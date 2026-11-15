## 📋 Fase 6 · Métricas preliminares: la validación decide {#fase-validacion}
@mapa Reunir los errores de todos los modelos en la validación, elegir el ganador y los finalistas de cada categoría antes de abrir la prueba, y ver cómo cambia el error con el horizonte.

:::pastilla verde | Aplicar · La tabla de la validación y la elección | u2:validacion u2:ref-elegir u2:metricas {#val-tabla}
Comparar **todos** los modelos con las mismas 1,344 horas de validación y **elegir antes de ver la prueba**: el ganador general por MAE (el modelo que se entregaría) y el mejor de cada categoría. Así la prueba mide honestamente lo que pasaría en operación.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| criterio | MAE | La métrica principal elegida en [[met-mape|el paso de métricas]]. El RMSE se usa para desempatar. |
| categorías | referencia, clásico, aprendizaje automático, red neuronal, ensamble | El flujo pide al menos un modelo de cada enfoque. |
| `mejora %` | contra la persistencia | Qué tanto mejora cada modelo a la referencia más usada. |
@@ Código
```python
CATEGORIA = {**{m: "referencia" for m in REFERENCIAS},
             **{m: "clásico" for m in ["SARIMA d=0", "SARIMA d=1", "Holt-Winters", "Armónica + AR(3)"]},
             **{m: "aprendizaje automático" for m in VAL.columns if m.startswith(("Ridge", "HGB"))},
             **{m: "red neuronal" for m in VAL.columns if m.startswith("Red")},
             "Ensamble (Armónica + Ridge)": "ensamble"}
modelos_val = [m for m in VAL.columns if m not in ("real", "h")]
tab_val = tabla_val(modelos_val)
tab_val["categoría"] = [CATEGORIA[m] for m in tab_val.index]
tab_val["mejora % vs Naive"] = 100 * (1 - tab_val["MAE"] / tab_val.loc["Naive", "MAE"])
elegido = tab_val.index[0]
mejor_cat = tab_val.groupby("categoría", sort=False).head(1)
print(f"Modelo elegido (menor MAE en la validación): {elegido}\n")
print("Mejor modelo de cada categoría:")
print(mejor_cat[["categoría", "MAE", "RMSE", "mejora % vs Naive"]].round(3).to_string())
FINALISTAS = list(dict.fromkeys(list(mejor_cat.index) + REFERENCIAS + ["SARIMA d=0", "SARIMA d=1", "Holt-Winters", "Ridge + físicas"]))
print(f"\nPasan a la prueba {len(FINALISTAS)} modelos.")
```
@@ Resultado
```python oculto
tabla("val-todos", ["modelo", "categoría", "MAE", "RMSE", "MAPE %", "MASE", "mejora vs Naive"],
      [[m, r["categoría"], f'{r["MAE"]:.3f}', f'{r["RMSE"]:.3f}', f'{r["MAPE %"]:.1f}', f'{r["MASE"]:.3f}', f'{r["mejora % vs Naive"]:+.1f}%']
       for m, r in tab_val.iterrows()],
      ["elegido" if m == elegido else ("reserva" if m in mejor_cat.index else ("descartado" if r["MAE"] > tab_val.loc["Naive", "MAE"] else ""))
       for m, r in tab_val.iterrows()],
      titulo="Todos los modelos en la validación (25/08 – 19/10), errores en m/s",
      nota="Verde: el elegido. Amarillo: el mejor de cada categoría. Rojo: peor que la persistencia.")
```
@widget lab-tabla id=val-todos
@@ Lectura
- **El elegido es {{=elegido}}**, con MAE {{=tab_val.loc[elegido, 'MAE']|.3f}} m/s: {{=tab_val.loc[elegido, 'mejora % vs Naive']|.1f}}% menos error que la persistencia. Es un modelo **clásico**, con 8 parámetros.
- El **ensamble** queda prácticamente empatado ({{=tab_val.loc['Ensamble (Armónica + Ridge)', 'MAE']|.3f}}), y Ridge, el mejor de aprendizaje automático, a {{=tab_val.loc['Ridge', 'MAE'] - tab_val.loc[elegido, 'MAE']|.2f}} m/s.
- La mejor red neuronal mejora a la persistencia en {{=tab_val.loc['Red neuronal (16)', 'mejora % vs Naive']|.0f}}%, pero queda lejos de los modelos lineales.
- Las diferencias entre los mejores son de centésimas de m/s en 56 días: **son pequeñas y podrían cambiar de orden** con otro periodo. Por eso pasan a la prueba los mejores de cada categoría y no solo el ganador.
@@ Decisión
✅ **Decisión tomada antes de ver la prueba:** el modelo que se entregaría es **{{=elegido}}**. Pasan a la prueba los mejores de cada categoría, todas las referencias y los otros clásicos, para entender el resultado. Antes, el error según el horizonte.
:::

:::pastilla azul | Aplicar · El error según el horizonte en la validación | u2:demo-error-horizonte u2:un-paso {#val-horizonte}
Ver **en qué horizontes** gana cada modelo. Un MAE promedio de 24 horas esconde que a 1 hora casi cualquier cosa sirve y a 24 horas casi nada.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `groupby("h")` | 24 grupos | El MAE de los 56 pronósticos de cada horizonte. |
| habilidad | $1 - \text{MAE}_\text{modelo} / \text{MAE}_\text{Naive}$ | Positiva si el modelo le gana a la persistencia en ese horizonte. |
@@ Código
```python
MOSTRAR = [elegido, "Ridge", "Red neuronal (16)", "WindowAverage", "Naive"]
mae_h_val = VAL.groupby("h").apply(lambda g: pd.Series({m: np.mean(np.abs(g["real"] - g[m])) for m in MOSTRAR}))
habilidad_val = 1 - mae_h_val.div(mae_h_val["Naive"], axis=0)
print("MAE por horizonte (m/s):")
print(mae_h_val.loc[[1, 3, 6, 12, 18, 24]].round(2).to_string())
print(f"\nHabilidad del elegido sobre la persistencia: a 1 h {habilidad_val.loc[1, elegido]:+.0%}, a 6 h {habilidad_val.loc[6, elegido]:+.0%}, a 24 h {habilidad_val.loc[24, elegido]:+.0%}")
```
@@ Resultado
```python oculto
COL_F = {elegido: "lav", "Ridge": "menta", "Red neuronal (16)": "mant", "WindowAverage": "cel", "Naive": "dur"}
grafica("val-h", [linea(mae_h_val.index, mae_h_val[m], m, COL_F[m], 2.6 if m == elegido else 1.6, "dot" if m in ("Naive", "WindowAverage") else "solid") for m in MOSTRAR],
        alto=300, title={"text": "Error según el horizonte (validación)"}, xaxis={"title": {"text": "horas hacia adelante"}, "dtick": 2},
        yaxis={"title": {"text": "MAE (m/s)"}})
```
@widget lab-graf id=val-h
@@ Lectura
- A **1 hora**, la persistencia es la mejor ({{=mae_h_val.loc[1, 'Naive']|.2f}} m/s) y los buenos modelos quedan apenas por encima ({{=mae_h_val.loc[1, elegido]|.2f}} el elegido): el mejor pronóstico de la siguiente hora es casi la hora actual.
- Desde unas **6 horas** los modelos se separan de la persistencia: su error crece más despacio porque mezclan el valor actual con un nivel más estable y el ciclo diario.
- A **24 horas** el elegido tiene una habilidad de {{=habilidad_val.loc[24, elegido] * 100|.0f}}% sobre la persistencia. Ninguno baja de {{=mae_h_val.loc[24].min()|.1f}} m/s: un día adelante, la serie sola ya no sabe si el episodio continuará.
@@ Decisión
La elección está hecha y documentada. La Fase 7 **abre la prueba**: ajusta los finalistas con todo el entrenamiento y los evalúa una sola vez en los 73 días finales.
:::
