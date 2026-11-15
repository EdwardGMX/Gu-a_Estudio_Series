## ✂️ Fase 3 · División temporal, protocolo, referencias y métricas {#fase-particion}
@mapa Separar entrenamiento y prueba en orden cronológico, definir cómo se pronostica cada día, reservar una validación dentro del entrenamiento, fijar la vara de las referencias y elegir las métricas.

:::pastilla verde | Aplicar · Partición cronológica: 80% entrenamiento, 20% prueba | u2:particion u2:validacion {#part-particion}
Reservar el **último 20%** de las horas como conjunto de **prueba**, que ningún modelo verá al ajustarse ni al elegirse. En series de tiempo la prueba va siempre **después** del entrenamiento: barajar dejaría a los modelos ver el futuro.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `int(0.8 * n)` | 7,008 horas | El 80% para entrenar, como pide el flujo de trabajo. |
| corte | 20 de octubre, 00:00 | Coincide con el inicio de un día: la prueba son 73 días completos. |
| `z_tr`, `y_tr` | dos escalas | Los modelos clásicos se ajustan en √y; los errores se miden en m/s. |
@@ Código
```python
n_total = len(y)
n_tr = int(0.8 * n_total)
y_tr, y_te = y.iloc[:n_tr], y.iloc[n_tr:]
z_tr, z_te = z.iloc[:n_tr], z.iloc[n_tr:]
print(f"Entrenamiento: {y_tr.index[0]} a {y_tr.index[-1]} ({len(y_tr):,} horas, {len(y_tr) / 24:.0f} días)")
print(f"Prueba:        {y_te.index[0]} a {y_te.index[-1]} ({len(y_te):,} horas, {len(y_te) / 24:.0f} días)")
print(f"\nViento medio: entrenamiento {y_tr.mean():.2f} m/s | prueba {y_te.mean():.2f} m/s")
print(f"Horas imputadas en la prueba: {imputada[y_te.index].sum()} | horas en paro en la prueba: {s10['paro'][y_te.index[0]:].sum() / 6:.0f}")
```
@@ Resultado
```python oculto
y_tr_d, y_te_d = diario(y_tr), diario(y_te)
grafica("part-particion", [linea(y_tr_d.index, y_tr_d, "entrenamiento (80%)", "osc", 1.5), linea(y_te_d.index, y_te_d, "prueba (20%)", "menta", 2.2)],
        alto=270, title={"text": "Partición cronológica (promedios diarios)"}, yaxis={"title": {"text": "m/s"}}, shapes=[vline(str(y_te.index[0]), "rosa")])
```
@widget lab-graf id=part-particion
@@ Lectura
- La prueba son **{{=len(y_te) // 24}} días completos**, del {{=y_te.index[0].strftime('%d/%m')}} al {{=y_te.index[-1].strftime('%d/%m')}}.
- **La prueba es más ventosa que el entrenamiento**: {{=y_te.mean()|.1f}} m/s contra {{=y_tr.mean()|.1f}}. Cae en la temporada de nortes, mientras que el entrenamiento incluye los meses tranquilos de mayo a octubre. Es un examen exigente y realista: el modelo tendrá que pronosticar una temporada distinta al promedio de lo que vio.
@@ Decisión
✅ Partición fija. Ahora hay que definir **cómo** se pronostica dentro de la prueba: no basta con un solo pronóstico de 1,752 horas.
:::

:::pastilla azul | Aplicar · Protocolo: un pronóstico de 24 horas cada medianoche, y una validación | u2:rolling-origin u2:ref-cv u2:validacion {#part-protocolo}
Definir el procedimiento de evaluación que se usará con **todos** los modelos. Como en el mercado del día en adelanto, cada día a la medianoche se pronostican las 24 horas siguientes con los datos observados hasta ese momento; al día siguiente se repite con un dato más. Además, para elegir modelos **sin mirar la prueba**, se reserva una **validación** dentro del entrenamiento.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| origen | 23:00 de cada día | Con el dato de las 23:00 se pronostican de las 00:00 a las 23:00 del día siguiente. |
| `h=24`, `step_size=24` | un día por ventana | 24 pronósticos por origen; el siguiente origen es un día después. |
| ventanas de prueba | 73 | Los 73 días de la prueba. |
| ventanas de validación | 56 | Los últimos 8 semanas del entrenamiento (25 de agosto al 19 de octubre). |
| `refit=False` | parámetros fijos | Cada modelo se ajusta **una vez** con los datos anteriores al periodo evaluado; en cada origen solo se actualiza con los datos nuevos. |
@@ Código
```python
df_z = pd.DataFrame({"unique_id": "MV01", "ds": z.index, "y": z.values})       # formato de statsforecast
df_tr = df_z.iloc[:n_tr]
N_VAL, N_TE = 56, len(y_te) // 24
ini_val = y_tr.index[-N_VAL * 24]
print(f"Validación: {N_VAL} días, del {ini_val:%d/%m} al {y_tr.index[-1]:%d/%m} | modelos ajustados con {n_tr - N_VAL * 24:,} horas")
print(f"Prueba:     {N_TE} días, del {y_te.index[0]:%d/%m} al {y_te.index[-1]:%d/%m} | modelos ajustados con las {n_tr:,} horas de entrenamiento")

escala_mase = np.mean(np.abs(np.diff(y_tr.values)))          # MAE del ingenuo a un paso en el entrenamiento

def metricas(real, pron):
    real, pron = np.asarray(real, float), np.asarray(pron, float)
    e = real - pron
    return {"MAE": np.mean(np.abs(e)), "RMSE": np.sqrt(np.mean(e ** 2)),
            "MAPE %": 100 * np.mean(np.abs(e) / real), "MASE": np.mean(np.abs(e)) / escala_mase}
print(f"\nEscala del MASE (error del ingenuo a 1 hora en el entrenamiento): {escala_mase:.3f} m/s")
```
@@ Lectura
- Cada modelo produce **{{=N_TE * 24|,}} pronósticos en la prueba** ({{=N_TE}} días × 24 horas) y {{=N_VAL * 24|,}} en la validación. Los pronósticos a 1 hora y a 24 horas se mezclan en las métricas generales y después se separan por horizonte.
- Con `refit=False` el modelo no se vuelve a estimar en cada origen; solo incorpora los datos nuevos para arrancar el pronóstico. Así funciona en operación y la evaluación tarda segundos.
- **La regla del juego**: todas las decisiones (órdenes, variables, hiperparámetros, qué modelo gana) se toman con la **validación**. La prueba se abre una sola vez, al final.
- Las métricas se calculan en **m/s**. Se incluye el **MASE**, que divide el MAE entre el error del ingenuo a una hora ({{=escala_mase|.3f}} m/s): un MASE de 3 significa un error tres veces el de pronosticar la siguiente hora con la actual.
@@ Decisión
Con el protocolo listo, lo primero es medir la **vara**: qué tan bien pronostican los modelos de referencia.
:::

:::pastilla verde | Aplicar · Los modelos de referencia en la validación | u2:referencia u2:ref-statsforecast u2:ref-metodos u2:ref-elegir {#ref-validacion}
Calcular los pronósticos de referencia con `statsforecast`: **ingenuo** (persistencia: el último valor), **ingenuo estacional** (el día anterior), **promedio histórico**, **promedio de ventana** (las últimas 24 horas) y **deriva**. Cualquier modelo que no les gane no vale la pena. La suposición S4 apuesta por el ingenuo estacional.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `SeasonalNaive(season_length=24)` | el día anterior | Pone a prueba S4. |
| `WindowAverage(window_size=24)` | promedio del último día | Un pronóstico plano que promedia el ciclo diario. |
| `refit=True` | se recalculan en cada origen | Estos modelos no tienen parámetros que estimar: "reajustarlos" es solo actualizar su último valor. |
| `.pow(2)` | inversa de √ | Los pronósticos regresan a m/s. |
@@ Código
```python
from statsforecast import StatsForecast
from statsforecast.models import Naive, SeasonalNaive, HistoricAverage, WindowAverage, RandomWalkWithDrift

REFERENCIAS = ["Naive", "SeasonalNaive", "HistoricAverage", "WindowAverage", "RWD"]
def referencias():
    return [Naive(), SeasonalNaive(season_length=24), HistoricAverage(), WindowAverage(window_size=24), RandomWalkWithDrift()]

val_ref = StatsForecast(models=referencias(), freq="h").cross_validation(df=df_tr, h=24, step_size=24, n_windows=N_VAL, refit=True)
val_ref["h"] = val_ref.groupby("cutoff").cumcount() + 1
real_val = val_ref["y"] ** 2
tab_ref_val = pd.DataFrame({m: metricas(real_val, val_ref[m].clip(lower=0) ** 2) for m in REFERENCIAS}).T.sort_values("MAE")
print(tab_ref_val.round(3).to_string())
```
@@ Resultado
```python oculto
error_h_ref = pd.DataFrame({m: (real_val - val_ref[m].clip(lower=0) ** 2).abs().groupby(val_ref["h"]).mean() for m in REFERENCIAS})
COL_REF = {"Naive": "dur", "SeasonalNaive": "rosa", "HistoricAverage": "gris", "WindowAverage": "cel", "RWD": "mant"}
grafica("ref-val-h", [linea(error_h_ref.index, error_h_ref[m], m, COL_REF[m], 2.2) for m in REFERENCIAS], alto=300,
        title={"text": "Error de las referencias según el horizonte (validación)"}, xaxis={"title": {"text": "horas hacia adelante"}, "dtick": 2},
        yaxis={"title": {"text": "MAE (m/s)"}})
tabla("ref-val-tab", ["referencia", "MAE", "RMSE", "MAPE %", "MASE"],
      [[m] + [f"{v:.3f}" if c != "MAPE %" else f"{v:.1f}" for c, v in tab_ref_val.loc[m].items()] for m in tab_ref_val.index],
      ["elegido"] + [""] * 4, titulo="Referencias en la validación (25/08 – 19/10), errores en m/s")
```
@widget lab-tabla id=ref-val-tab
@widget lab-graf id=ref-val-h
@@ Lectura
- **La mejor referencia por MAE es {{=tab_ref_val.index[0]}}** ({{=tab_ref_val['MAE'].iloc[0]|.2f}} m/s). La persistencia (Naive) logra {{=tab_ref_val.loc['Naive', 'MAE']|.2f}} y la deriva prácticamente lo mismo: con una serie tan larga, la pendiente de la deriva es casi cero.
- **El ingenuo estacional es de las peores** ({{=tab_ref_val.loc['SeasonalNaive', 'MAE']|.2f}}): repetir el día de ayer arrastra todo el episodio de ayer, y el viento de un día a otro cambia más que lo que el ciclo diario explica. ❌ **S4 queda descartada.**
- En la gráfica se ve la historia completa: la **persistencia es imbatible a 1–3 horas** y empeora rápido con el horizonte; el promedio de ventana empieza peor pero crece más despacio, porque promedia el ciclo diario. El promedio histórico es plano y malo en todos los horizontes.
@@ Decisión
✅ La vara queda fijada por la **persistencia** y el **promedio de ventana**: un modelo útil debe combinar lo mejor de las dos (seguir el valor actual a corto plazo y tender a un nivel razonable a largo plazo). La tabla tiene una columna llamativa, el **MAPE**, que se revisa antes de elegir métricas.
:::

:::pastilla rojo | Aplicar · El MAPE con vientos en calma | u2:metricas-def u2:metricas-propiedades u2:demo-rmse-mae {#met-mape}
Comprobar si el **MAPE** sirve para comparar modelos de viento (suposición S6). El MAPE divide cada error entre el valor real: no existe si hay ceros (aquí no los hay, pues el mínimo horario es {{=y.min()|.2f}} m/s), pero las horas casi en calma pueden dominarlo.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| calma | viento real < 2 m/s | Horas en que un error de 1 m/s es más del 50%. |
| ranking | MAE contra MAPE | Si una métrica cambia el orden de los modelos, hay que entender por qué. |
@@ Código
```python
calma = (real_val < 2).values
for m in ["Naive", "WindowAverage", "SeasonalNaive"]:
    ape = 100 * np.abs(real_val - val_ref[m].clip(lower=0) ** 2) / real_val
    print(f"{m:14s} MAPE = {ape.mean():5.1f}% | sin las horas en calma: {ape[~calma].mean():5.1f}%"
          f" | las {calma.sum()} horas en calma ({calma.mean():.1%}) aportan el {ape[calma].sum() / ape.sum():.0%} del MAPE")
rk = pd.DataFrame({"lugar por MAE": tab_ref_val["MAE"].rank().astype(int), "lugar por MAPE": tab_ref_val["MAPE %"].rank().astype(int),
                   "lugar por RMSE": tab_ref_val["RMSE"].rank().astype(int)})
print()
print(rk.to_string())
```
@@ Lectura
- Las horas en calma son apenas el {{=calma.mean() * 100|.0f}}% de la validación, pero **aportan entre la quinta y la tercera parte del MAPE**: pesan cuatro o cinco veces más de lo que les toca. En esas horas, pronosticar 3 m/s cuando hubo 1 es un error de 200%.
- El MAPE **ordena distinto que el MAE** (tabla): el promedio de ventana gana por MAE y queda tercero por MAPE. El MAPE premia a los modelos que aciertan en las calmas, que son justo las horas en que la turbina **no produce** y el error no cuesta nada. (Aquí coincide con el RMSE, pero por otra razón: el RMSE castiga los errores grandes, que el promedio de ventana comete al inicio de cada episodio.)
- Lo contrario pasa con el viento fuerte: un error de 2 m/s a 15 m/s es solo 13% en el MAPE, pero puede cambiar cientos de kW.
@@ Decisión
❌ **S6 descartada**: el MAPE se reportará porque lo pide el flujo de trabajo, pero **no** se usará para elegir. La métrica principal será el **MAE** en m/s (fácil de interpretar, robusta), con el **RMSE** (castiga más los errores grandes, que son los caros) y el **MASE** para comparar entre horizontes. Con la vara y las métricas definidas, la Fase 4 construye las **características** para los modelos de aprendizaje automático.
:::
