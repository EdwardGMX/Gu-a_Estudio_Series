## ✅ Fase 6 · Validación cruzada, regreso a la escala e intervalos (Unidad II) {#fase-validacion}
@mapa Comparar todos los modelos con origen móvil, confirmar la transformación, corregir el sesgo al regresar de la raíz y revisar la cobertura de los intervalos.

:::pastilla verde | Aplicar · Validación cruzada con origen móvil (statsforecast) | u2:rolling-origin u2:ref-evaluar u2:estrategias
Comparar todos los candidatos en **muchas** ventanas de pronóstico, no en una sola. Un modelo puede ganar en 1979–2008 por suerte; si gana en 12 ventanas distintas, la ventaja es real.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `df=df_tr` | solo hasta 1978 | La prueba 1979–2008 queda intacta: la validación usa únicamente el entrenamiento. |
| `h=11` | un ciclo | Cada ventana pronostica un ciclo completo hacia adelante, el horizonte que interesa. |
| `n_windows=12, step_size=5` | 12 cortes cada 5 años | Cortes de 1912 a 1967: cubren distintas fases del ciclo (máximos, mínimos, laderas). |
| `ARIMA(order=…, include_mean=True)` | statsforecast | La misma especificación que en statsmodels, para que cada modelo se reajuste en cada corte. |
| error en manchas | (√y)² | Las métricas se calculan después de elevar al cuadrado. |
@@ Código
```python
from statsforecast.models import ARIMA as ARIMA_sf

modelos_cv = [HistoricAverage(), Naive(), SeasonalNaive(season_length=11),
              ARIMA_sf(order=(2, 0, 0), include_mean=True, alias="AR(2)"),
              ARIMA_sf(order=(9, 0, 0), include_mean=True, alias="AR(9)"),
              ARIMA_sf(order=(2, 1, 1), alias="ARIMA(2,1,1)"),
              AutoARIMA(season_length=1, alias="AutoARIMA (omisión)")]
cv = StatsForecast(models=modelos_cv, freq="YS").cross_validation(df=df_tr, h=11, n_windows=12, step_size=5)
nombres_cv = [c for c in cv.columns if c not in ("unique_id", "ds", "cutoff", "y")]
print(f"Cortes: {cv['cutoff'].dt.year.min()} a {cv['cutoff'].dt.year.max()} ({cv['cutoff'].nunique()} ventanas de 11 años)")

real_cv = cv["y"].astype(float) ** 2
err_cv = pd.DataFrame({n: (real_cv - cv[n].astype(float) ** 2).abs() for n in nombres_cv})
err_cv["cutoff"] = cv["cutoff"].dt.year
mae_ventana = err_cv.groupby("cutoff").mean()
resumen_cv = pd.DataFrame({"MAE": mae_ventana.mean(),
                           "RMSE": np.sqrt(pd.DataFrame({n: (real_cv - cv[n].astype(float) ** 2) ** 2 for n in nombres_cv}).mean()),
                           "ventanas ganadas": mae_ventana.idxmin(axis=1).value_counts().reindex(nombres_cv, fill_value=0)})
print(resumen_cv.sort_values("MAE").round(2).to_string())
```
@@ Resultado
```python oculto
orden_cv = resumen_cv.sort_values("MAE")
grafica("lab-cv", [barras(list(orden_cv.index), orden_cv["MAE"], "MAE promedio",
                          ["verde" if n == "AR(9)" else ("rosa" if n == "SeasonalNaive" else "lav") for n in orden_cv.index],
                          hovertemplate="%{x}: MAE %{y:.2f}<extra></extra>")],
        alto=290, title={"text": "MAE en 12 ventanas de 11 años (validación con origen móvil)"}, showlegend=False, yaxis={"title": {"text": "MAE (manchas)"}})
grafica("lab-cv-ventanas", [linea(mae_ventana.index, mae_ventana[n], n, c, 2.2 if n == "AR(9)" else 1.5, mode="lines+markers")
                            for n, c in [("AR(9)", "verde"), ("SeasonalNaive", "rosa"), ("AR(2)", "lav"), ("ARIMA(2,1,1)", "dur")]],
        alto=290, title={"text": "MAE de cada ventana, por año de corte"}, xaxis={"title": {"text": "año del corte"}}, yaxis={"title": {"text": "MAE"}})
tabla("lab-tab-cv", ["modelo", "MAE", "RMSE", "ventanas ganadas (de 12)"],
      [[n, f'{orden_cv.loc[n, "MAE"]:.2f}', f'{orden_cv.loc[n, "RMSE"]:.2f}', int(orden_cv.loc[n, "ventanas ganadas"])] for n in orden_cv.index],
      ["elegido" if n == "AR(9)" else ("descartado" if n in ("Naive", "ARIMA(2,1,1)") else "") for n in orden_cv.index])
```
@widget lab-graf id=lab-cv
@widget lab-tabla id=lab-tab-cv
@widget lab-graf id=lab-cv-ventanas
@@ Lectura
- **AR(9) gana**: MAE promedio **{{=resumen_cv.loc['AR(9)', 'MAE']|.2f}}** contra {{=resumen_cv.loc['SeasonalNaive', 'MAE']|.2f}} del ingenuo estacional, la mejor referencia. Es {{=100 * (1 - resumen_cv.loc['AR(9)', 'MAE'] / resumen_cv.loc['SeasonalNaive', 'MAE'])|.0f}}% menos error. Gana **{{=int(resumen_cv.loc['AR(9)', 'ventanas ganadas'])}} de las 12 ventanas**.
- El ranking confirma, con otros datos, todo lo de la Fase 5. El AR(2) ({{=resumen_cv.loc['AR(2)', 'MAE']|.2f}}) y AutoARIMA con sus opciones por omisión ({{=resumen_cv.loc['AutoARIMA (omisión)', 'MAE']|.2f}}) quedan por detrás del ingenuo estacional. El modelo con d = 1 ({{=resumen_cv.loc['ARIMA(2,1,1)', 'MAE']|.2f}}) tampoco le gana.
- En la gráfica por ventana se ve que **ningún modelo gana siempre**. En algunos cortes el ingenuo estacional acierta porque el ciclo siguiente se pareció mucho al anterior. Las peores ventanas de los dos son parecidas (AR(9) {{=mae_ventana['AR(9)'].max()|.1f}}, ingenuo estacional {{=mae_ventana['SeasonalNaive'].max()|.1f}}): los dos fallan cuando el ciclo siguiente es muy distinto de los anteriores. La ventaja del AR(9) está en las ventanas típicas: su MAE **mediano** es {{=mae_ventana['AR(9)'].median()|.1f}}, contra {{=mae_ventana['SeasonalNaive'].median()|.1f}} del ingenuo estacional.
@@ Decisión
✅ Se cumple el **criterio de éxito 1**: el AR(9) le gana a la mejor referencia en validación cruzada. Queda pendiente la elección de la transformación que se dejó abierta en el paso 9. El siguiente paso repite la validación del AR(9) con las cuatro transformaciones candidatas.
:::

:::pastilla verde | Aplicar · Confirmar la transformación con validación cruzada | u2:transformaciones u2:regresar-escala
Decidir la transformación por lo que importa al final, el **error de pronóstico en manchas**, y no solo por las medidas de varianza del paso 9.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| mismos 12 cortes | 1912, 1917, …, 1967 | Comparación justa con el paso anterior. |
| `inv_boxcox(f, λ) − 1` | inversa de Box-Cox | Deshace la transformación y el desplazamiento de +1. |
| `np.expm1` | inversa de log1p | e^f − 1. |
| λ de Box-Cox | estimado solo con el entrenamiento | Estimarlo con toda la serie sería usar información de la prueba. |
@@ Código
```python
from scipy.special import inv_boxcox

lam_tr = stats.boxcox(y_tr + 1)[1]
transformaciones = {
    "sin transformar": (lambda s: s, lambda f: f),
    "raíz": (np.sqrt, lambda f: f ** 2),
    "Box-Cox": (lambda s: pd.Series(stats.boxcox(s + 1, lam_tr), index=s.index), lambda f: inv_boxcox(f, lam_tr) - 1),
    "log(y + 1)": (np.log1p, np.expm1)}
cortes = sorted(mae_ventana.index)
mae_transf = {}
with warnings.catch_warnings():
    warnings.simplefilter("ignore")
    for nombre, (directa, inversa) in transformaciones.items():
        errores = []
        for c in cortes:
            ajuste = ARIMA(directa(y[:str(c)]), order=(9, 0, 0)).fit()
            pron = np.asarray(inversa(ajuste.forecast(11)))
            errores.append(np.abs(y[str(c + 1):str(c + 11)].values - pron))
        mae_transf[nombre] = np.mean(np.concatenate(errores))
print(f"λ de Box-Cox con el entrenamiento: {lam_tr:.3f}")
print(pd.Series(mae_transf, name="MAE en validación cruzada").round(2).to_string())
```
@@ Resultado
```python oculto
tabla("lab-tab-transf", ["transformación", "MAE en validación cruzada"],
      [[k, f"{v:.2f}"] for k, v in sorted(mae_transf.items(), key=lambda kv: kv[1])],
      ["elegido" if i == 0 else ("descartado" if k == "log(y + 1)" else "") for i, (k, v) in enumerate(sorted(mae_transf.items(), key=lambda kv: kv[1]))],
      titulo="AR(9) con cada transformación, mismos 12 cortes")
```
@widget lab-tabla id=lab-tab-transf
@@ Lectura
- **La raíz queda primera** (MAE {{=mae_transf['raíz']|.2f}}), aunque por poco: sin transformar da {{=mae_transf['sin transformar']|.2f}} y Box-Cox {{=mae_transf['Box-Cox']|.2f}}. **log(y + 1) es claramente peor** ({{=mae_transf['log(y + 1)']|.2f}}), igual que se vio con la varianza en el paso 7.
- Para el **pronóstico puntual** la transformación importa poco. Su valor está en otra parte: los **intervalos** y los **residuos**. Sin transformar, los residuos crecen con el nivel (paso 31) y, como se verá en el paso 35, los intervalos incluyen manchas negativas.
- Box-Cox no compensa su complejidad: ni mejora el error ni tiene interpretación.
@@ Decisión
✅ La elección del paso 9 queda **confirmada**: √y es la transformación final. Ahora hay que revisar un detalle técnico que casi siempre se olvida: al regresar de √y elevando al cuadrado, **¿el pronóstico queda sesgado?**
:::

:::pastilla amarillo | Aplicar · Regresar a la escala original elevando al cuadrado | u2:regresar-escala
Revisar si **elevar al cuadrado** el pronóstico de √y da un buen pronóstico de y. No es obvio: el cuadrado de un promedio **no** es el promedio de los cuadrados.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `get_forecast(30)` | pronóstico con varianza | Da la media pronosticada de √y y su varianza en cada horizonte. |
| `media_z ** 2` | "pronóstico ingenuo" | Es la **mediana** de y si √y es simétrica alrededor de su pronóstico. |
| `media_z ** 2 + var_z` | corrección | Como E[z²] = E[z]² + Var(z), esto estima la **media** de y. |
| sesgo | promedio de (real − pronóstico) | Positivo: el pronóstico se queda corto. |
@@ Código
```python
pr9 = ar9.get_forecast(len(y_te))
media_z, var_z = pr9.predicted_mean, pr9.var_pred_mean
pron_mediana = media_z ** 2                      # solo elevar al cuadrado
pron_media = media_z ** 2 + var_z                # E[y] = E[√y]² + Var(√y)
for nombre, p in [("elevar al cuadrado", pron_mediana), ("con corrección de sesgo", pron_media)]:
    m = metricas(y_te, p)
    print(f"{nombre:25s} MAE = {m['MAE']:.2f}  RMSE = {m['RMSE']:.2f}  sesgo = {np.mean(y_te.values - p.values):+.2f}")
print(f"\nCorrección agregada: de {var_z.iloc[0]:.2f} (h = 1) a {var_z.iloc[-1]:.2f} manchas (h = 30)")
```
@@ Lectura
- Elevando al cuadrado, el pronóstico se queda corto en promedio **{{=np.mean(y_te.values - pron_mediana.values)|.2f}} manchas** (sesgo positivo).
- La corrección suma la varianza del pronóstico de √y: poco al principio ({{=var_z.iloc[0]|.2f}} manchas a un año) y más a largo plazo ({{=var_z.iloc[-1]|.2f}} a 30 años), porque la incertidumbre crece con el horizonte.
- Con la corrección el sesgo baja a {{=np.mean(y_te.values - pron_media.values)|.2f}}, el MAE pasa de {{=metricas(y_te, pron_mediana)['MAE']|.2f}} a {{=metricas(y_te, pron_media)['MAE']|.2f}} y el RMSE de {{=metricas(y_te, pron_mediana)['RMSE']|.2f}} a {{=metricas(y_te, pron_media)['RMSE']|.2f}}. Mejora un poco en todo.
- El sesgo restante viene de que 1979–2008 fue una época más activa que el promedio histórico (paso 20), algo que ningún modelo estacionario puede anticipar.
@@ Decisión
🟡 Elevar al cuadrado es aceptable, pero **sesgado**. Se adopta la versión corregida para el pronóstico puntual: estima la media, que es lo que minimiza el error cuadrático. Falta el último criterio de éxito, los **intervalos**: que no den manchas negativas y que cubran lo que prometen.
:::

:::pastilla verde | Aplicar · Intervalos de predicción en la escala original y su cobertura | u2:intervalos-psi u2:ref-intervalos
Construir intervalos de 80% y 95% para las manchas y comprobar en la prueba si cubren lo que prometen. Se comparan con los de un AR(9) **sin transformar**, que es lo que se obtendría si se hubiera saltado la Fase 1.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `conf_int(alpha=0.20)`, `alpha=0.05` | 80% y 95% | Los niveles habituales. |
| `.clip(lower=0) ** 2` | límites en manchas | Los cuantiles se conservan al elevar al cuadrado, pero √y no puede ser negativa: si el límite inferior de √y es negativo, el de y es 0. |
| `ARIMA(y_tr, order=(9, 0, 0))` | sin transformar | Para comparar intervalos. |
@@ Código
```python
def a_manchas(ic):
    return ic.iloc[:, 0].clip(lower=0) ** 2, ic.iloc[:, 1] ** 2

lo80, hi80 = a_manchas(pr9.conf_int(alpha=0.20))
lo95, hi95 = a_manchas(pr9.conf_int(alpha=0.05))
cob80 = np.mean((y_te.values >= lo80.values) & (y_te.values <= hi80.values))
cob95 = np.mean((y_te.values >= lo95.values) & (y_te.values <= hi95.values))
print(f"Cobertura en la prueba: 80% → {100 * cob80:.0f}%   95% → {100 * cob95:.0f}%")
print(f"Ancho medio: 80% → {np.mean(hi80 - lo80):.1f} manchas   95% → {np.mean(hi95 - lo95):.1f} manchas")

ar9_crudo = ARIMA(y_tr, order=(9, 0, 0)).fit()
ic_crudo = ar9_crudo.get_forecast(len(y_te)).conf_int(alpha=0.05)
print(f"\nAR(9) sin transformar: límite inferior de 95% mínimo = {ic_crudo.iloc[:, 0].min():.1f} manchas "
      f"({(ic_crudo.iloc[:, 0] < 0).sum()} de {len(y_te)} años con límite negativo)")
```
@@ Resultado
```python oculto
xs_te = y_te.index.year
grafica("lab-intervalos", [linea(y["1950":"1978"].index.year, y["1950":"1978"], "entrenamiento", "osc", 1.3)]
        + banda(xs_te, lo95, hi95, "95%", "rgba(124,105,214,.13)") + banda(xs_te, lo80, hi80, "80%", "rgba(124,105,214,.28)")
        + [linea(xs_te, pron_media, "AR(9) con corrección de sesgo", "lav", 2.6),
           linea(xs_te, ic_crudo.iloc[:, 0], "límite inferior 95% sin transformar", "rojo", 1.6, "dash"),
           puntos(xs_te, y_te, "prueba (real)", "menta", 7)],
        alto=340, title={"text": "Pronóstico 1979–2008 con intervalos de 80% y 95%"}, xaxis={"title": {"text": "año"}},
        shapes=[{"type": "line", "x0": 1950, "x1": 2008, "y0": 0, "y1": 0, "line": {"color": PALETA["gris"], "width": 1}}])
```
@widget lab-graf id=lab-intervalos
@@ Lectura
- **Cobertura**: la banda de 80% contiene el {{=100 * cob80|.0f}}% de los años reales y la de 95% el {{=100 * cob95|.0f}}%. Las dos cubren **al menos** lo que prometen. Quedan algo anchas, consistente con lo que advirtió el paso 31 (residuos no normales): son **conservadoras**, el error menos grave.
- Las bandas son **asimétricas**: más anchas hacia arriba que hacia abajo, porque se construyeron en √y y se elevaron al cuadrado. Es lo correcto para un conteo que no puede bajar de 0 pero sí dispararse.
- El AR(9) **sin transformar** da intervalos con límite inferior de **{{=ic_crudo.iloc[:, 0].min()|.1f}} manchas** (línea roja punteada): negativos en {{=(ic_crudo.iloc[:, 0] < 0).sum()}} de los {{=len(y_te)}} años. Un intervalo que incluye "−47 manchas" no tiene sentido físico. Esta es la razón práctica de la Fase 1.
@@ Decisión
✅ Se cumplen los **criterios de éxito 1, 2 y 3**. Falta el 4: estimar el periodo del ciclo con un método **independiente**, en el dominio de la frecuencia. La Fase 7 cambia de lenguaje: en lugar de preguntar "¿cómo depende este año de los anteriores?", pregunta "¿qué frecuencias forman la serie?".
:::
