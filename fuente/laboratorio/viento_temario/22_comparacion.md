## ⚖️ Comparación con el primer análisis {#comparacion}
@mapa Qué tan cerca llegan los modelos del temario de los de aprendizaje automático del flujo del proyecto, y qué cambió por seguir el orden de las unidades.

:::pastilla verde | Aplicar · Los mismos días de prueba, dos análisis | u2:metricas-ref {#comp-resultados}
Comparar los resultados de este análisis con los del primer análisis (el flujo del proyecto, ya retirado de la guía), que usó **las mismas fechas** de entrenamiento, validación y prueba, el mismo protocolo (24 horas desde cada medianoche) y además modelos de aprendizaje automático y redes neuronales. Los números del primer análisis se copian de su tabla de prueba.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `PRIMERO` | MAE de prueba del primer análisis | Su tabla de resultados, sin modificarlo. |
| comparación | MAE y mejora sobre el ingenuo | El ingenuo es el mismo en los dos (2.844). |
@@ Código
```python
PRIMERO = {"Ridge + físicas (ML)": 2.576, "Ridge (ML)": 2.630, "Ensamble armónica + Ridge": 2.662, "Armónica + AR(3) (elegido del primero)": 2.793,
           "SARIMA d = 0": 2.819, "Red neuronal (16)": 2.846, "Holt–Winters": 3.111, "Naive": 2.844}
ESTE = {f"{k} (elegido)" if k == elegido else k: v for k, v in tab_pru["MAE"].items()}
print(f"Ingenuo en los dos análisis: {PRIMERO['Naive']:.3f} y {tab_pru.loc['Naive', 'MAE']:.3f}")
print(f"Mejor del primer análisis: {min(PRIMERO, key=PRIMERO.get)} ({min(PRIMERO.values()):.3f})")
print(f"Mejor de este análisis: {mejor_pru} ({tab_pru['MAE'].iloc[0]:.3f})")
print(f"El elegido del primer análisis: 2.793 | el de este: {tab_pru.loc[elegido, 'MAE']:.3f}")
```
@@ Resultado
```python oculto
filas_cmp = sorted([(k, v, "primer análisis (con ML)") for k, v in PRIMERO.items() if k != "Naive"] + [(k, v, "por unidades (solo temario)") for k, v in ESTE.items() if not k.startswith("Naive")]
                   + [("Naive (los dos)", PRIMERO["Naive"], "referencia")], key=lambda f: f[1])[:14]
grafica("comp-resultados", [barras([f[1] for f in filas_cmp][::-1], [f[0] for f in filas_cmp][::-1], "MAE en la prueba",
                                   [{"primer análisis (con ML)": "cel", "por unidades (solo temario)": "lav", "referencia": "dur"}[f[2]] for f in filas_cmp][::-1],
                                   orientation="h", customdata=[f[2] for f in filas_cmp][::-1], hovertemplate="%{y}: %{x:.3f} m/s (%{customdata})<extra></extra>")],
        alto=460, showlegend=False, title={"text": "MAE en la prueba: azul, primer análisis; morado, este análisis; naranja, el ingenuo"},
        margin={"l": 230}, xaxis={"title": {"text": "MAE (m/s)"}, "range": [2.4, 3.2]})
```
@widget lab-graf id=comp-resultados
@@ Lectura
- El **ingenuo** es idéntico en los dos análisis ({{=tab_pru.loc['Naive', 'MAE']|.3f}}) y la **armónica + AR(3)** también (2.793): las mismas fechas, el mismo protocolo y la misma limpieza dan los mismos números.
- El mejor modelo **solo del temario**, el {{=mejor_pru}} ({{=tab_pru['MAE'].iloc[0]|.3f}}), queda a {{=tab_pru['MAE'].iloc[0] - 2.576|.3f}} m/s del mejor del primer análisis (Ridge con variables físicas, 2.576) y le gana a Ridge sin ellas (2.630).
- El **elegido** de este análisis ({{=tab_pru.loc[elegido, 'MAE']|.3f}}) es mejor que el elegido del primero (2.793): la validación de la Unidad II comparó modelos con más rezagos.
@@ Decisión
✅ Un AR largo o una regresión lineal con 24 rezagos y Fourier, todos del temario, hacen casi lo mismo que un modelo de aprendizaje automático lineal. Lo único que el primer análisis tenía de más útil eran las **variables físicas** (presión y dirección del viento).
:::

:::pastilla verde | Aplicar · Qué cambió por seguir el temario | u1:formulario u2:formulario2 u3:formulario3 {#comp-lecciones}
Reunir lo que este análisis encontró de distinto, o con más detalle, por recorrer las unidades en orden, y lo que los dos análisis comparten.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| tabla | tema, primer análisis, este análisis | Para leerla de un vistazo. |
@@ Código
```python
LECCIONES = [
    ("Limpieza", "La misma reparación, huecos y paros.", "Además: consistencia entre columnas, saltos, estados de la turbina y el viento medido en los paros."),
    ("Estacionariedad", "ADF y KPSS se contradicen.", f"Además: Zivot–Andrews, Chow y CUSUM ubican la ruptura el {fecha_larga(fecha_za)}, dentro de la prueba."),
    ("Referencias", "Naive, SeasonalNaive, WindowAverage y Holt–Winters.", f"Además: SES, Holt y ventanas; Holt–Winters es la más exigente en la validación y peor que el ingenuo en la prueba."),
    ("AR y MA", "No se probaron por separado.", f"El viento es autorregresivo: un MA de 24 términos queda detrás del AR(1); el mejor AR tiene {p_mejor} rezagos."),
    ("Selección", "Elegido: la armónica + AR(3).", f"Elegido: {elegido}. Los mejores de la validación estaban empatados (diferencias de centésimas)."),
    ("Resultado en la prueba", "Mejor: Ridge + físicas (2.576), con aprendizaje automático.", f"Mejor: {mejor_pru} ({tab_pru['MAE'].iloc[0]:.3f}), solo con el temario."),
    ("Lección común", "La validación no contenía un cambio de temporada.", "La misma: el sesgo del nivel explica el cambio de orden entre validación y prueba."),
]
for t, a, b in LECCIONES:
    print(f"{t}\n   primero: {a}\n   este:    {b}")
```
@@ Resultado
```python oculto
tabla("comp-lecciones", ["tema", "flujo del proyecto", "por unidades"], [list(f) for f in LECCIONES], titulo="Los dos análisis, tema por tema")
```
@widget lab-tabla id=comp-lecciones
@@ Lectura
- Seguir el temario agregó **detalle** en todas las etapas: más pruebas de limpieza, la ubicación exacta de la ruptura estructural, los AR y MA por separado, la rejilla de SARIMA, el diagnóstico completo y el análisis espectral.
- La **lección principal es la misma** en los dos: el viento regresa a un nivel que cambia con la temporada, y una validación sin cambio de temporada no puede anticipar el sesgo de la prueba.
@@ Decisión
✅ Los dos análisis se complementan: el del proyecto muestra el flujo de trabajo completo con aprendizaje automático; este muestra cada herramienta de la materia aplicada y leída sobre la misma serie.
:::
