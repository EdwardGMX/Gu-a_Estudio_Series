## 🏁 Fase 7 · Resultados y conclusiones {#resultados}
@mapa Por qué no se usó el residuo de otra turbina, la tabla final de los tres escenarios y las conclusiones de la entrega.

:::pastilla rojo | Descartado · Completar el pronóstico con el residuo de otra turbina | u2:fuga u2:requisitos-exog {#res-otra-turbina}
El plan original proponía completar la predicción de MV01 con el **residuo de la turbina más parecida**. Se descartó antes de programarlo.
@@ Lectura
- Para pronosticar el día *t* de MV01 se usaría el residuo **real** de otra turbina en ese mismo día *t*: un dato que **no existe** en el momento de pronosticar.
- Las turbinas vecinas reciben el mismo viento, así que sus residuos están muy correlacionados. Las métricas saldrían artificialmente bajas: es **fuga de información**.
- Para que fuera válido haría falta pronosticar también el residuo de la otra turbina, con lo que se regresa al mismo problema.
@@ Decisión
❌ El residuo de MV01 se pronostica solo con su propia historia.
:::

:::pastilla verde | Aplicar · Los tres escenarios en una tabla | u2:metricas-ref u2:ref-elegir {#res-tabla}
Juntar el RMSE de los seis modelos en los tres escenarios.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| métrica | RMSE | La usada en toda la selección. |
@@ Código
```python
resumen = pd.concat({'h = 73 (un solo pronóstico)': metricas_73['RMSE'],
                     'h = 1 (origen móvil)': metricas_h1['RMSE'],
                     'h = 7 (origen móvil)': metricas_h7['RMSE']}, axis=1)
print(resumen.round(0))
```
@@ Resultado
```python oculto
esc = list(resumen.columns)
_vd = f'STL ventana {mejor_deslizante}'
texto_ventanas = "; ".join(f"a {e.split(' (')[0].replace('h = ', 'h = ')} gana la " + ("expansiva" if resumen.loc['STL expansiva', e] < resumen.loc[_vd, e] else f"de {mejor_deslizante} días")
                           + f" ({kwh(min(resumen.loc['STL expansiva', e], resumen.loc[_vd, e]))} contra {kwh(max(resumen.loc['STL expansiva', e], resumen.loc[_vd, e]))})" for e in esc)
cuad, txts = [], []
for j, e in enumerate(esc):
    orden = resumen[e].sort_values()
    cuad.append([barras(orden.values[::-1], orden.index[::-1].tolist(), e,
                        [("verde" if m == orden.index[0] else COL_M[m]) for m in orden.index[::-1]], orientation="h",
                        hovertemplate="%{y}: %{x:,.0f} kWh<extra></extra>", text=[kwh(v) for v in orden.values[::-1]], textposition="auto")])
    txts.append({0: f"<b>h = 73</b>: gana el {orden.index[0]} ({kwh(orden.iloc[0])}), casi empatado con la media. A muchos días no hay más que la media.",
                 1: f"<b>h = 1</b>: los dos ARIMA bajan a ≈ {kwh(orden.iloc[0])}, {(1 - orden.iloc[0] / resumen.loc['Naive', e]) * 100:.0f} % mejor que Naive. Aquí sí sirve la memoria del viento.",
                 2: f"<b>h = 7</b>: gana el {orden.index[0]} ({kwh(orden.iloc[0])}), apenas debajo de la media: solo el primer día aporta."}[j])
animacion("anim-resumen", cuad, textos=txts, etiquetas=["h = 73", "h = 1", "h = 7"], etiqueta="Escenario", vel=3500, alto=320,
          title={"text": "RMSE en la prueba (verde: el mejor del escenario)"}, margin={"l": 150}, xaxis={"title": {"text": "RMSE (kWh)"}, "range": [0, 27000]})
tabla("res-tabla", ["modelo"] + esc, [[m] + [kwh(resumen.loc[m, e]) for e in esc] for m in resumen.index], titulo="RMSE en la prueba (kWh)")
```
@widget lab-anim id=anim-resumen
@widget lab-tabla id=res-tabla
@@ Lectura
- El **ARIMA(2,0,0)** está arriba en los tres escenarios (empatado con AutoARIMA a un día).
- La **STL** nunca gana: a un día y a siete días queda incluso detrás de la media.
@@ Decisión
✅ Con esto se escriben las conclusiones.
:::

### Conclusiones de la entrega {#conclusiones}

1. **El mejor enfoque es el ARIMA clásico.** El ARIMA(2,0,0), elegido con la ACF y la PACF, y AutoARIMA son los mejores a un día (RMSE ≈ {{=kwh(metricas_h1['RMSE'].iloc[0])}} kWh, {{=(1 - metricas_h1['RMSE'].iloc[0] / metricas_h1.loc['Naive', 'RMSE']) * 100|.0f}} % mejor que `Naive`). A 7 y a 73 días el ARIMA(2,0,0) sigue siendo el mejor, pero apenas supera al promedio histórico. Con la historia de la propia serie solo se anticipa bien el día siguiente, lo que coincide con la ACF ({{=r_acf[1]|.2f}} en el rezago 1 y luego decae).
2. **La descomposición STL no mejora el pronóstico.** La serie no tiene una estacionalidad real, así que la STL obliga a repetir un patrón que termina desfasado de lo que pasa. Además, la tendencia extrapolada con `RandomWalkWithDrift` hace que el error crezca con el horizonte. Su residuo nunca fue ruido blanco, y la variación irregular del clima concentra casi la mitad de la varianza.
3. **Ventanas:** en la validación la expansiva fue mejor que cualquier deslizante. En la prueba quedaron muy parejas: {{=texto_ventanas}}. Con un solo año de datos, la ventana pesa mucho menos que el tipo de modelo: las dos STL quedan detrás de la media en cualquier caso.
:::nota Detalle del notebook
El notebook concluye que la expansiva fue mejor "tanto en la validación como en la prueba", pero en su propia tabla de prueba la ventana de 60 días tiene menor RMSE a 73 días y a un día; la expansiva solo gana a 7 días.
:::
4. **d = 0 contra d = 1:** el ARIMA(2,0,0) igualó o superó a AutoARIMA (d = 1) en los tres horizontes, lo que respalda el resultado de la ADF: la serie es estacionaria en niveles.
5. **Limitaciones:**
   - Los paros de la turbina, como el del 18 al 24 de diciembre, no se pueden predecir con la serie y suben el error.
   - El MAPE no es útil por los días con producción casi nula; la evaluación se basa en RMSE y MAE.
   - Para mejorar el horizonte de 7 días que pide el CENACE haría falta información externa, como el pronóstico meteorológico de la velocidad del viento.

:::nota Detalles menores del notebook entregado
- Algunos números del texto del notebook no coinciden con sus propias tablas por unas cuantas unidades (por ejemplo, 18,251 en el texto contra 18,255.80 en la tabla del h = 73): las tablas y el texto vienen de ejecuciones distintas. Conviene "Reiniciar y ejecutar todo" antes de entregar y copiar los números de la última ejecución.
- La validación interna (agosto – octubre) es temporada de poco viento y la prueba (noviembre – diciembre) es de mucho viento: la configuración se eligió en otras condiciones. Vale la pena mencionarlo en las limitaciones.
- Una forma de reportar el error en porcentaje sin el problema del MAPE es normalizarlo por la capacidad: MAE / (2,300 kW × 24 h ≈ 55,200 kWh) × 100. Para el ARIMA a h = 7 da ≈ {{=metricas_h7.loc['ARIMA(2,0,0)', 'MAE'] / 55200 * 100|.0f}} %.
:::
