## 🧪 Fase 4 · Partición, referencias y métricas (Unidad II) {#fase-referencias}
@mapa Separar entrenamiento y prueba respetando el tiempo, pronosticar con los cuatro modelos de referencia y elegir las métricas correctas.

:::pastilla azul | Aplicar · Partición temporal: entrenamiento 1700–1978, prueba 1979–2008 | u2:particion u2:validacion
Reservar los últimos años como **prueba**, datos que ningún modelo verá al ajustarse, para medir honestamente qué tan bien pronostica cada uno.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| corte | 1978 | Deja **30 años** de prueba, casi 3 ciclos completos: el error de un solo ciclo depende demasiado de la suerte. |
| sin barajar | orden temporal | En series de tiempo la prueba siempre va **después** del entrenamiento; barajar dejaría al modelo "ver el futuro". |
| `z_tr`, `y_tr` | dos escalas | Los modelos se ajustan en √y; los errores se miden en manchas, que es lo que le importa a quien usa el pronóstico. |
@@ Código
```python
z_tr, z_te = z[:"1978"], z["1979":]
y_tr, y_te = y[:"1978"], y["1979":]
print(f"Entrenamiento: {z_tr.index[0]}–{z_tr.index[-1]}  ({len(z_tr)} años)")
print(f"Prueba:        {z_te.index[0]}–{z_te.index[-1]}  ({len(z_te)} años ≈ {len(z_te) / duraciones.mean():.1f} ciclos)")
print(f"Promedio de manchas: entrenamiento {y_tr.mean():.1f} | prueba {y_te.mean():.1f}")
```
@@ Resultado
```python oculto
grafica("lab-particion", [linea(y_tr.index.year, y_tr, "entrenamiento (1700–1978)", "osc", 1.3),
                          linea(y_te.index.year, y_te, "prueba (1979–2008)", "menta", 2.2)],
        alto=280, title={"text": "Partición temporal"}, xaxis={"title": {"text": "año"}},
        shapes=[{"type": "line", "x0": 1978.5, "x1": 1978.5, "y0": 0, "y1": 1, "yref": "paper", "line": {"color": PALETA["rosa"], "dash": "dash"}}])
```
@widget lab-graf id=lab-particion
@@ Lectura
- {{=len(z_tr)}} años para entrenar y {{=len(z_te)}} para probar ({{=len(z_te) / duraciones.mean()|.1f}} ciclos).
- La prueba cae en una época **muy activa** (promedio {{=y_te.mean()|.1f}} contra {{=y_tr.mean()|.1f}} del entrenamiento): incluye los máximos de {{=y['1975':'1985'].idxmax()}}, {{=y['1985':'1995'].idxmax()}} y {{=y['1995':'2005'].idxmax()}}. Es un examen exigente, porque los modelos deberán pronosticar ciclos más altos que el promedio histórico.
@@ Decisión
Antes de cualquier modelo sofisticado hay que saber **cuánto vale pronosticar sin pensar**. El siguiente paso calcula los cuatro modelos de referencia con `statsforecast`, sobre √y, y mide sus errores en la escala original.
:::

:::pastilla azul | Aplicar · Los cuatro modelos de referencia con statsforecast | u2:referencia u2:ref-statsforecast u2:metricas
Fijar la **vara** que cualquier modelo debe superar: promedio histórico, ingenuo, ingenuo estacional (con la "estación" de 11 años) y deriva.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `unique_id, ds, y` | formato largo | El formato que exige statsforecast. `ds` debe ser una fecha: el año se convierte a `1700-01-01`, … |
| `freq="YS"` | anual, al inicio del año | Coincide con cómo se fecharon los años; con otra frecuencia las fechas del pronóstico no coincidirían con la prueba. |
| `SeasonalNaive(season_length=11)` | 11 | Pone a prueba otra vez la suposición S2: "el ciclo anterior se repite". |
| `h=len(y_te)` | 30 | Todo el periodo de prueba de una sola vez, desde 1978. |
| `.pow(2)` | inversa de √ | Regresa los pronósticos a manchas. |
| MASE | escala: ingenuo en el entrenamiento | MASE < 1 significa mejor que el ingenuo a un paso dentro de la muestra. |
@@ Código
```python
from statsforecast import StatsForecast
from statsforecast.models import HistoricAverage, Naive, SeasonalNaive, RandomWalkWithDrift

df_z = pd.DataFrame({"unique_id": "manchas", "ds": pd.to_datetime(anios.astype(str)), "y": z.values})
df_tr = df_z[df_z["ds"] <= "1978"]
referencias = StatsForecast(models=[HistoricAverage(), Naive(), SeasonalNaive(season_length=11),
                                    RandomWalkWithDrift()], freq="YS")
pron_ref = referencias.forecast(df=df_tr, h=len(y_te))
nombres_ref = ["HistoricAverage", "Naive", "SeasonalNaive", "RWD"]
pron_ref_y = pron_ref[nombres_ref].astype(float).pow(2).set_axis(y_te.index)

escala_mase = np.mean(np.abs(np.diff(y_tr.values)))      # MAE del ingenuo a un paso en el entrenamiento

def metricas(real, pron):
    e = real.values - np.asarray(pron, dtype=float)
    return {"MAE": np.mean(np.abs(e)), "RMSE": np.sqrt(np.mean(e ** 2)),
            "MAPE %": 100 * np.mean(np.abs(e / real.values)), "MASE": np.mean(np.abs(e)) / escala_mase}

tab_ref = pd.DataFrame({n: metricas(y_te, pron_ref_y[n]) for n in nombres_ref}).T
print(tab_ref.round(2).to_string())
```
@@ Resultado
```python oculto
COL_REF = {"HistoricAverage": "cel", "Naive": "dur", "SeasonalNaive": "rosa", "RWD": "mant"}
grafica("lab-ref", [linea(y["1940":"1978"].index.year, y["1940":"1978"], "entrenamiento", "osc", 1.3),
                    puntos(y_te.index.year, y_te, "prueba (real)", "menta", 7)]
                   + [linea(y_te.index.year, pron_ref_y[n], n, COL_REF[n], 2.2 if n == "SeasonalNaive" else 1.6, "dot" if n == "HistoricAverage" else "solid") for n in nombres_ref],
        alto=330, title={"text": "Los cuatro modelos de referencia frente a 1979–2008"}, xaxis={"title": {"text": "año"}})
orden_ref = tab_ref.sort_values("MAE")
tabla("lab-tab-ref", ["modelo", "MAE", "RMSE", "MAPE %", "MASE"],
      [[n] + [f"{v:.2f}" for v in orden_ref.loc[n]] for n in orden_ref.index], ["elegido"] + [""] * 3,
      titulo="Errores en la prueba (manchas), ordenados por MAE")
```
@widget lab-graf id=lab-ref
@widget lab-tabla id=lab-tab-ref
@@ Lectura
- **El ingenuo estacional de 11 años es, por mucho, la mejor referencia**: MAE de **{{=tab_ref.loc['SeasonalNaive', 'MAE']|.2f}}** manchas, contra {{=tab_ref.loc['HistoricAverage', 'MAE']|.2f}} del promedio y {{=tab_ref.loc['Naive', 'MAE']|.2f}} del ingenuo. Copiar el último ciclo funciona bien al principio: su MAE en 1979–1989 es {{=np.mean(np.abs(y_te['1979':'1989'].values - pron_ref_y['SeasonalNaive']['1979':'1989'].values))|.1f}} y en 1990–2008 sube a {{=np.mean(np.abs(y_te['1990':'2008'].values - pron_ref_y['SeasonalNaive']['1990':'2008'].values))|.1f}}.
- En la gráfica se ve su punto débil: como el ciclo real no dura exactamente 11 años, la copia **se va desfasando**. Hacia el final de la prueba sus picos ya no coinciden con los reales.
- El promedio y el ingenuo son líneas planas: no ven el ciclo en absoluto. La deriva es un ingenuo inclinado, casi igual de malo.
- **MASE**: incluso el mejor ({{=tab_ref.loc['SeasonalNaive', 'MASE']|.2f}}) queda por arriba de 1. Pronosticar 30 años es mucho más difícil que pronosticar un año con el dato anterior, que es la escala del MASE.
- La columna de **MAPE** se ve rara: valores de {{=tab_ref['MAPE %'].min()|.0f}}% a {{=tab_ref['MAPE %'].max()|.0f}}%. Eso merece su propio paso.
@@ Decisión
La vara queda en **MAE = {{=tab_ref.loc['SeasonalNaive', 'MAE']|.2f}}** (ingenuo estacional). Pero antes de comparar modelos hay que decidir **con qué métrica**. La suposición S5 era usar el MAPE, la métrica porcentual más popular. El siguiente paso revisa por qué aquí sale tan extraño.
:::

:::pastilla rojo | Aplicar · Elegir modelos con el MAPE | u2:metricas-def u2:metricas-propiedades
Comprobar si el **MAPE** es confiable para esta serie antes de usarlo para elegir modelos. El MAPE divide cada error entre el valor real, así que cualquier año con muy pocas manchas puede dominarlo.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| error porcentual por año | 100·\|e\|/y | Para ver qué años pesan en el promedio. |
| segunda ventana | 1901–1930 | Otra evaluación de 30 años, que incluye el mínimo de 1913 (1.4 manchas), para ver si el ranking es estable. |
@@ Código
```python
ape = 100 * np.abs(y_te.values[:, None] - pron_ref_y.values) / y_te.values[:, None]
ape = pd.DataFrame(ape, index=y_te.index, columns=nombres_ref)
peor = ape.idxmax()
print("Año que más pesa en el MAPE de cada modelo:")
for n in nombres_ref:
    print(f"  {n:16s} {peor[n]}: real = {y_te[peor[n]]:5.1f}, error porcentual = {ape.loc[peor[n], n]:7.0f}%,"
          f" MAPE sin ese año = {ape[n].drop(peor[n]).mean():6.1f}%")

# La misma comparación con otra ventana de 30 años (1901–1930)
df_1900 = df_z[df_z["ds"] <= "1900"]
y_1930 = y["1901":"1930"]
p1900 = referencias.forecast(df=df_1900, h=30)[nombres_ref].astype(float).pow(2).set_axis(y_1930.index)
tab_1900 = pd.DataFrame({n: metricas(y_1930, p1900[n]) for n in nombres_ref}).T
print("\nVentana 1901–1930:")
print(tab_1900[["MAE", "MAPE %"]].round(1).to_string())
```
@@ Resultado
```python oculto
rk_mae = tab_1900["MAE"].rank().astype(int); rk_mape = tab_1900["MAPE %"].rank().astype(int)
tabla("lab-mape", ["modelo", "MAE 1901–1930", "lugar por MAE", "MAPE % 1901–1930", "lugar por MAPE"],
      [[n, f'{tab_1900.loc[n, "MAE"]:.1f}', rk_mae[n], f'{tab_1900.loc[n, "MAPE %"]:.1f}', rk_mape[n]] for n in nombres_ref],
      ["descartado" if rk_mape[n] == 1 and rk_mae[n] > 2 else ("elegido" if rk_mae[n] == 1 else "") for n in nombres_ref],
      titulo="El MAPE y el MAE eligen modelos distintos")
```
@widget lab-tabla id=lab-mape
@@ Lectura
- En la prueba 1979–2008, el año que más pesa es **{{=peor['Naive']}}**, con solo {{=y_te[peor['Naive']]|.1f}} manchas. El ingenuo comete ahí un error de {{=ape.loc[peor['Naive'], 'Naive']|.0f}}%, y ese solo año sube el MAPE del modelo de {{=ape['Naive'].drop(peor['Naive']).mean()|.1f}}% a {{=ape['Naive'].mean()|.1f}}%. **Un año entre 30 decide la métrica.**
- En la ventana 1901–1930 pasa algo peor: el MAPE **invierte el ranking**. El ingenuo queda en el lugar {{=rk_mape['Naive']}} por MAPE ({{=tab_1900.loc['Naive', 'MAPE %']|.1f}}%) y en el {{=rk_mae['Naive']}} por MAE ({{=tab_1900.loc['Naive', 'MAE']|.1f}}). El ingenuo estacional, el mejor por MAE ({{=tab_1900.loc['SeasonalNaive', 'MAE']|.1f}}), tiene un MAPE de {{=tab_1900.loc['SeasonalNaive', 'MAPE %']|.1f}}%, porque se equivocó en 1913, cuando hubo apenas 1.4 manchas.
- La razón: el MAPE castiga enormemente los errores en los **mínimos** (dividir entre 1.4 o 2.9 multiplica el error) y casi no castiga los de los **máximos**. Para pronosticar actividad solar, donde los máximos son lo que importa, es justo al revés de lo que se necesita.
@@ Decisión
❌ El MAPE **no sirve** para esta serie. Se usarán el **MAE** (métrica principal, en manchas y fácil de interpretar), el **RMSE** (castiga más los errores grandes en los máximos) y el **MASE** (sin unidades, comparable entre series). Con la vara y las métricas definidas, la Fase 5 construye los modelos, empezando por la suposición S4: el **AR(2) de Yule**.
:::
