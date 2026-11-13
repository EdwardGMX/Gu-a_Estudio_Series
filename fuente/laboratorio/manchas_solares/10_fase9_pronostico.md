## 🔮 Fase 9 · Modelo final y pronóstico 2009–2030 {#fase-final}
@mapa Reajustar el AR(9) con los 309 años y pronosticar los dos ciclos siguientes con intervalos.

:::pastilla verde | Aplicar · Reajustar el AR(9) con toda la serie y pronosticar 22 años | u2:arima-pronostico u2:intervalos-psi u2:regresar-escala
Producir el entregable: el pronóstico de los **dos ciclos siguientes** (2009–2030) con el modelo validado, usando ahora **todos** los datos, incluidos los 30 años que se habían reservado para la prueba.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `ar9_total` | AR(9) con 1700–2008 | Ya se ajustó en el paso 40. Una vez validado el modelo, se reajusta con todo para no desperdiciar los datos más recientes. |
| `steps=22` | dos ciclos | Más allá de dos ciclos el pronóstico converge a la media y deja de aportar. |
| media corregida | E[√y]² + Var(√y) | La corrección de sesgo del paso 34. |
| intervalo | 80% | Más útil que el de 95% para planear, que es casi tan ancho como toda la escala. |
@@ Código
```python
pr_fin = ar9_total.get_forecast(steps=22)
media_fin = pr_fin.predicted_mean ** 2 + pr_fin.var_pred_mean
lo_fin, hi_fin = a_manchas(pr_fin.conf_int(alpha=0.20))
pron_final = pd.DataFrame({"pronóstico": media_fin, "80% inferior": lo_fin, "80% superior": hi_fin})
print(pron_final.round(1).iloc[::2].to_string())

anio_min = media_fin.iloc[:12].idxmin()
anio_max = media_fin.iloc[:12].idxmax()
anio_max2 = media_fin.iloc[12:].idxmax()
print(f"\nPróximo mínimo pronosticado: {anio_min} | próximo máximo: {anio_max} ({media_fin[anio_max]:.0f} manchas)")
print(f"Máximo del ciclo siguiente: {anio_max2} ({media_fin[anio_max2]:.0f} manchas)")
```
@@ Resultado
```python oculto
xf = media_fin.index.year
grafica("lab-final", [linea(y["1950":].index.year, y["1950":], "observado", "osc", 1.6)]
        + banda(xf, lo_fin, hi_fin, "intervalo de 80%", "rgba(124,105,214,.22)")
        + [linea(xf, media_fin, "pronóstico AR(9)", "lav", 2.8)],
        alto=330, title={"text": "Pronóstico de la actividad solar 2009–2030"}, xaxis={"title": {"text": "año"}}, yaxis={"title": {"text": "manchas"}})
```
@widget lab-graf id=lab-final
@@ Lectura
- El modelo pronostica un **mínimo en {{=anio_min}}** (2008 ya era un año muy bajo, con 2.9 manchas), un **máximo hacia {{=anio_max}}** de unas **{{=media_fin[anio_max]|.0f}} manchas** y un segundo máximo hacia {{=anio_max2}} ({{=media_fin[anio_max2]|.0f}}).
- Los máximos pronosticados son **más bajos** que los de los ciclos recientes (155–158). Es lo esperado de un modelo estacionario: con el horizonte, el pronóstico se acerca a la media de largo plazo, y cuanto más lejos, más.
- El intervalo de 80% en el máximo va de {{=lo_fin[anio_max]|.0f}} a {{=hi_fin[anio_max]|.0f}} manchas. La incertidumbre sobre la **altura** de un ciclo es grande incluso con un buen modelo: la amplitud depende de choques que todavía no ocurren.
- Con información que no estaba en el dataset (termina en 2008): el ciclo solar 24 real tuvo su máximo en **2014** y su mínimo a **finales de 2019**, {{=2014 - anio_max.year}} años después de lo pronosticado en el caso del máximo y {{=2019 - anio_min.year}} en el del mínimo. Es el mismo tipo de error de fase que se vio en la prueba (paso 25) y una consecuencia directa de que la duración del ciclo varíe de 9 a 15 años.
@@ Decisión
✅ Entregable terminado. La siguiente sección reúne los resultados generales del análisis.
:::
