## 🎯 Fase 6 · Pronósticos en la prueba {#fase-prueba}
@mapa Los seis modelos en los 73 días de prueba: de un solo golpe, a un día con origen móvil y a siete días como pide el CENACE.

:::pastilla amarillo | Aplicar · h = 73: un solo pronóstico para toda la prueba | u2:ref-pronosticar u2:metricas-ref u2:arima-pronostico {#prueba-73}
Entrenar cada modelo **una sola vez** con los 292 días de entrenamiento y pronosticar de golpe los 73 días de prueba.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| modelos directos | `Naive`, `HistoricAverage`, ARIMA(2,0,0), `AutoARIMA` | Las dos referencias y los dos ARIMA. |
| STL | expansiva y ventana de {{=mejor_deslizante}} días | La configuración elegida en la validación. |
| `h` | 73 | Todo el periodo de prueba. |
@@ Código
```python
h_test = len(test)
modelos_directos = [Naive(), HistoricAverage(),
                    ARIMA(order=(2, 0, 0), alias='ARIMA(2,0,0)', include_constant=True),
                    AutoARIMA()]

sf = StatsForecast(models=modelos_directos, freq='D')
sf.fit(train)
pron_73 = sf.predict(h=h_test)
pron_73['STL expansiva'] = pronostico_stl(train, h_test, **config)
pron_73[f'STL ventana {mejor_deslizante}'] = pronostico_stl(train, h_test, ventana=mejor_deslizante, **config)
pron_73 = test.merge(pron_73, on=['unique_id', 'ds'])

modelos = ['Naive', 'HistoricAverage', 'ARIMA(2,0,0)', 'AutoARIMA', 'STL expansiva', f'STL ventana {mejor_deslizante}']
metricas_73 = metricas(pron_73, modelos)
print(metricas_73.round(1))
```
@@ Resultado
```python oculto
COL_M = {"Naive": "mant", "HistoricAverage": "gris", "ARIMA(2,0,0)": "dur", "AutoARIMA": "cel", "STL expansiva": "rosa",
         f"STL ventana {mejor_deslizante}": "menta"}
HABLA = {"Naive": "repite el último día del entrenamiento ({v} kWh) durante 73 días: una línea plana en un día flojo.",
         "HistoricAverage": "pronostica la media del entrenamiento todos los días.",
         "ARIMA(2,0,0)": "aprovecha los primeros días y en una semana converge a la media: casi igual al promedio histórico.",
         "AutoARIMA": "con d = 1 y sin constante se queda en un nivel fijo, por debajo de la media.",
         "STL expansiva": "oscila con el patrón de 14 días que repite la estacional, pero desfasado de lo real; la tendencia extendida lo hace bajar.",
         f"STL ventana {mejor_deslizante}": f"también oscila desfasada; su tendencia usa solo la pendiente de los últimos {mejor_deslizante} días."}
hist73 = train.tail(30)
base73 = [linea(hist73['ds'], hist73['y'], "final del entrenamiento", "gris", 1.2),
          linea(pron_73['ds'], pron_73['y'], "lo que pasó (prueba)", "osc", 2)]
orden_entrada = ["Naive", "HistoricAverage", "ARIMA(2,0,0)", "AutoARIMA", "STL expansiva", f"STL ventana {mejor_deslizante}"]
cuad, txts = [], []
for j, m in enumerate(orden_entrada):
    cuad.append([linea(pron_73['ds'], pron_73[mm], mm, COL_M[mm], 3 if mm == m else 1.4, "solid" if mm == m else "dot",
                       opacity=1 if mm == m else .55) for mm in orden_entrada[:j + 1]])
    txts.append(f"<b>{m}</b> (RMSE {kwh(metricas_73.loc[m, 'RMSE'])}, MAE {kwh(metricas_73.loc[m, 'MAE'])}): "
                + HABLA[m].format(v=kwh(train['y'].iloc[-1])))
cuad.append(cuad[-1])
txts.append("Los seis juntos. Ninguno sigue las subidas y bajadas reales: con un solo pronóstico, lo mejor que se puede hacer a muchos días es "
            f"quedarse cerca de la media. Gana el <b>{metricas_73.index[0]}</b> ({kwh(metricas_73['RMSE'].iloc[0])}).")
animacion("anim-73", cuad, base=base73, textos=txts, etiquetas=orden_entrada + ["todos"], etiqueta="Modelo", vel=3000, alto=380,
          title={"text": "Un solo pronóstico de 73 días"}, yaxis={"title": {"text": "kWh/día"}})
tabla("prueba-73-tab", ["modelo", "RMSE", "MAE", "MAPE (%)"],
      [[m, kwh(f['RMSE']), kwh(f['MAE']), f"{f['MAPE (%)']:.0f}"] for m, f in metricas_73.iterrows()], titulo="h = 73, ordenados por RMSE")
```
@widget lab-anim id=anim-73
@widget lab-tabla id=prueba-73-tab
@@ Lectura
- Gana el **{{=metricas_73.index[0]}}** (RMSE {{=kwh(metricas_73['RMSE'].iloc[0])}}), pero el promedio histórico queda casi igual ({{=kwh(metricas_73.loc['HistoricAverage', 'RMSE'])}}): después de unos días el ARIMA ya es la media, una línea plana.
- **AutoARIMA** ({{=kwh(metricas_73.loc['AutoARIMA', 'RMSE'])}}) se queda en un nivel fijo de unos {{=kwh(pron_73['AutoARIMA'].iloc[-1])}} kWh por su d = 1.
- Las dos **STL** oscilan, pero **desfasadas** de lo real: repiten un patrón de {{=mejor_periodo}} días que en realidad no existe. Al final del periodo la expansiva llega a pronosticar hasta {{=kwh(pron_73['STL expansiva'].min())}} kWh{{=' (valores negativos, imposibles para una energía)' if pron_73['STL expansiva'].min() < 0 else ''}}.
- `Naive` es el peor ({{=kwh(metricas_73.loc['Naive', 'RMSE'])}}): repite un día flojo durante diez semanas de temporada de viento.
- El MAPE no es confiable por los días con producción casi nula; se compara con RMSE y MAE.
@@ Decisión
🟡 A 73 días ningún modelo hace mucho más que la media. Lo interesante es el origen móvil, donde cada día se actualiza la información.
:::

:::pastilla verde | Aplicar · h = 1 con origen móvil: pronosticar mañana, todos los días | u2:rolling-origin u2:ref-cv u2:un-paso {#prueba-h1}
En cada día de la prueba se pronostica **el día siguiente**, se compara con lo que pasó y ese día se agrega a la historia. Para los modelos directos se usa `cross_validation` de statsforecast (que reentrena en cada origen); para la STL, `origen_movil`, que recalcula la descomposición cada día.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `n_windows` | 73 | Un origen por cada día de la prueba. |
| `h` | 1 | Pronóstico a un día. |
| `step_size` | 1 | El origen avanza de un día en un día. |
@@ Código
```python
sf = StatsForecast(models=modelos_directos, freq='D')
cv_h1 = sf.cross_validation(df=df, n_windows=len(test), h=1, step_size=1)

stl_exp = origen_movil(df, corte, 1, nombre='STL expansiva', **config)
stl_des = origen_movil(df, corte, 1, nombre=f'STL ventana {mejor_deslizante}', ventana=mejor_deslizante, **config)
cv_h1 = (cv_h1.merge(stl_exp.drop(columns='y'), on=['unique_id', 'ds', 'cutoff'])
              .merge(stl_des.drop(columns='y'), on=['unique_id', 'ds', 'cutoff']))

metricas_h1 = metricas(cv_h1, modelos)
print(metricas_h1.round(1))

mejores_h1 = list(metricas_h1.index[:3])
errores_h1 = cv_h1[['ds']].copy()
for m in mejores_h1:
    errores_h1[m] = (cv_h1['y'] - cv_h1[m]).abs()
print("RMSE acumulado al final de cada mes:")
print(errores_h1.set_index('ds').pow(2).expanding().mean().pow(0.5).resample('ME').last().round(0))
```
@@ Resultado
```python oculto
ver_h1 = ["ARIMA(2,0,0)", "Naive", "HistoricAverage"]
cuad, txts, etqs = [], [], []
pasos_h1 = list(range(0, len(cv_h1), 2)) + ([len(cv_h1) - 1] if (len(cv_h1) - 1) % 2 else [])
for i in pasos_h1:
    d = cv_h1.iloc[:i + 1]
    tr_ = [linea(d['ds'], d['y'], "lo que pasó", "osc", 2.2)]
    for m in ver_h1:
        tr_.append(linea(d['ds'], d[m], m, COL_M[m], 2 if m == "ARIMA(2,0,0)" else 1.4, "solid" if m == "ARIMA(2,0,0)" else "dot"))
    hoy = d.iloc[-1]
    tr_.append(puntos([hoy['ds']], [hoy['ARIMA(2,0,0)']], "pronóstico de hoy (ARIMA)", "dur", 12))
    cuad.append(tr_)
    acum = {m: float(np.sqrt(np.mean((d['y'] - d[m]) ** 2))) for m in ver_h1}
    txts.append(f"<b>{fecha_larga(hoy['ds'])}</b>: con lo conocido hasta el {fecha_corta(hoy['cutoff'])}, el ARIMA pronosticó {kwh(hoy['ARIMA(2,0,0)'])} kWh "
                f"y pasó {kwh(hoy['y'])}. RMSE acumulado: ARIMA {kwh(acum['ARIMA(2,0,0)'])} · Naive {kwh(acum['Naive'])} · media {kwh(acum['HistoricAverage'])}.")
    etqs.append(fecha_corta(hoy['ds']))
animacion("anim-h1", cuad, textos=txts, etiquetas=etqs, etiqueta="Día", vel=650, alto=360,
          title={"text": "Pronóstico a un día con origen móvil"}, yaxis={"title": {"text": "kWh/día"}, "range": [-2000, 57000]},
          xaxis={"range": [str((cv_h1['ds'].min() - pd.Timedelta(days=1)).date()), str((cv_h1['ds'].max() + pd.Timedelta(days=1)).date())]})
tabla("prueba-h1-tab", ["modelo", "RMSE", "MAE", "MAPE (%)"],
      [[m, kwh(f['RMSE']), kwh(f['MAE']), f"{f['MAPE (%)']:.0f}"] for m, f in metricas_h1.iterrows()], titulo="h = 1, ordenados por RMSE")
mej_h1, seg_h1 = metricas_h1.index[0], metricas_h1.index[1]
```
@widget lab-anim id=anim-h1
@widget lab-tabla id=prueba-h1-tab
@@ Lectura
- A un día, los mejores son **{{=mej_h1}} (RMSE {{=kwh(metricas_h1['RMSE'].iloc[0])}}) y {{=seg_h1}} ({{=kwh(metricas_h1['RMSE'].iloc[1])}})**, prácticamente empatados. Mejoran en {{=(1 - metricas_h1['RMSE'].iloc[0] / metricas_h1.loc['Naive', 'RMSE']) * 100|.0f}} % a `Naive` ({{=kwh(metricas_h1.loc['Naive', 'RMSE'])}}) y en {{=(1 - metricas_h1['RMSE'].iloc[0] / metricas_h1.loc['HistoricAverage', 'RMSE']) * 100|.0f}} % al promedio histórico ({{=kwh(metricas_h1.loc['HistoricAverage', 'RMSE'])}}).
- Las dos **STL** son las peores, por encima de {{=kwh(min(metricas_h1.loc['STL expansiva', 'RMSE'], metricas_h1.loc[f'STL ventana {mejor_deslizante}', 'RMSE']))}}: incluso peores que la media.
- En la animación se ve cómo trabaja el ARIMA: **sigue el día anterior, jalado un poco hacia la media**. Aprovecha la persistencia del viento, pero no anticipa los cambios bruscos, que es donde se concentran sus errores. En el paro del 18 al 24 de diciembre pronostica varios miles de kWh mientras la producción real es 0.
@@ Decisión
✅ A un día, el ARIMA (cualquiera de los dos) es claramente mejor que las referencias. Ahora el horizonte del CENACE.
:::

:::pastilla verde | Aplicar · h = 7 con origen móvil: lo que pide el CENACE | u2:rolling-origin u2:metricas-ref u2:intervalos-psi {#prueba-h7}
Los parques eólicos entregan al **CENACE** estimaciones con hasta 7 días de anticipación. En cada día de la prueba se pronostican los **7 días siguientes** y se mide el error por días de anticipación.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `n_windows` | 73 − 7 + 1 = 67 | Orígenes con sus 7 días dentro de la prueba. |
| `h` | 7 | El horizonte del CENACE. |
| `paso` | `ds − cutoff` en días | Para ver cómo crece el error con la anticipación. |
@@ Código
```python
cv_h7 = sf.cross_validation(df=df, n_windows=len(test) - 7 + 1, h=7, step_size=1)

stl_exp7 = origen_movil(df, corte, 7, nombre='STL expansiva', **config)
stl_des7 = origen_movil(df, corte, 7, nombre=f'STL ventana {mejor_deslizante}', ventana=mejor_deslizante, **config)
cv_h7 = (cv_h7.merge(stl_exp7.drop(columns='y'), on=['unique_id', 'ds', 'cutoff'])
              .merge(stl_des7.drop(columns='y'), on=['unique_id', 'ds', 'cutoff']))

metricas_h7 = metricas(cv_h7, modelos)
print(metricas_h7.round(1))

cv_h7['paso'] = (cv_h7['ds'] - cv_h7['cutoff']).dt.days
rmse_paso = cv_h7[modelos].sub(cv_h7['y'], axis=0).pow(2).groupby(cv_h7['paso']).mean().pow(0.5)
print(rmse_paso.round(0))
```
@@ Resultado
```python oculto
ver_h7 = ["ARIMA(2,0,0)", "HistoricAverage", "STL expansiva"]
cortes = sorted(cv_h7['cutoff'].unique())
cuad, txts, etqs = [], [], []
for c in cortes[::2]:
    bloque = cv_h7[cv_h7['cutoff'] == c]
    antes = df[(df['ds'] <= c) & (df['ds'] > c - pd.Timedelta(days=21))]
    tr_ = [linea(antes['ds'], antes['y'], "historia conocida", "gris", 1.4),
           linea(bloque['ds'], bloque['y'], "lo que pasó", "osc", 2.4, mode="lines+markers")]
    for m in ver_h7:
        tr_.append(linea([c] + bloque['ds'].tolist(), [antes['y'].iloc[-1]] + bloque[m].tolist(), m, COL_M[m], 2.2 if m == "ARIMA(2,0,0)" else 1.6,
                         "solid" if m == "ARIMA(2,0,0)" else "dot", mode="lines+markers", marker={"size": 5}))
    cuad.append(tr_)
    e = {m: float(np.sqrt(np.mean((bloque['y'] - bloque[m]) ** 2))) for m in ver_h7}
    txts.append(f"Origen <b>{fecha_larga(pd.Timestamp(c))}</b>: el ARIMA arranca del último día ({kwh(antes['y'].iloc[-1])} kWh) y en 2 o 3 días ya es la media. "
                f"RMSE de estos 7 días: ARIMA {kwh(e['ARIMA(2,0,0)'])} · media {kwh(e['HistoricAverage'])} · STL {kwh(e['STL expansiva'])}.")
    etqs.append(fecha_corta(pd.Timestamp(c)))
xr = [str((pd.Timestamp(cortes[0]) - pd.Timedelta(days=21)).date()), str((cv_h7['ds'].max()).date())]
animacion("anim-h7", cuad, textos=txts, etiquetas=etqs, etiqueta="Origen", vel=1200, alto=360,
          lv=[{"shapes": [vline(str(pd.Timestamp(c).date()), "rosa")]} for c in cortes[::2]],
          title={"text": "Cada origen pronostica 7 días (CENACE)"}, yaxis={"title": {"text": "kWh/día"}, "range": [-20000, 70000]}, xaxis={"range": xr})
grafica("prueba-paso", [linea(rmse_paso.index, rmse_paso[m], m, COL_M[m], 3 if m == "ARIMA(2,0,0)" else 1.8, mode="lines+markers") for m in modelos],
        alto=330, title={"text": "RMSE según los días de anticipación"}, xaxis={"title": {"text": "días hacia adelante"}, "dtick": 1},
        yaxis={"title": {"text": "RMSE (kWh)"}})
tabla("prueba-h7-tab", ["modelo", "RMSE", "MAE", "MAPE (%)"],
      [[m, kwh(f['RMSE']), kwh(f['MAE']), f"{f['MAPE (%)']:.0f}"] for m, f in metricas_h7.iterrows()], titulo="h = 7, ordenados por RMSE")
```
@widget lab-anim id=anim-h7
@widget lab-graf id=prueba-paso
@widget lab-tabla id=prueba-h7-tab
@@ Lectura
- Con horizonte de 7 días gana el **{{=metricas_h7.index[0]}}** (RMSE {{=kwh(metricas_h7['RMSE'].iloc[0])}} y MAE {{=kwh(metricas_h7['MAE'].iloc[0])}}, la métrica que usa el CENACE), seguido muy de cerca por el promedio histórico ({{=kwh(metricas_h7.loc['HistoricAverage', 'RMSE'])}}).
- La gráfica por días de anticipación explica por qué: el **primer día** el ARIMA tiene un RMSE de {{=kwh(rmse_paso.loc[1, 'ARIMA(2,0,0)'])}} contra {{=kwh(rmse_paso.loc[1, 'HistoricAverage'])}} del promedio, pero **desde el segundo día** los dos quedan prácticamente iguales (≈ {{=kwh(rmse_paso.loc[2:, 'ARIMA(2,0,0)'].min())}}–{{=kwh(rmse_paso.loc[2:, 'ARIMA(2,0,0)'].max())}}). La información útil del pasado dura alrededor de un día; después, lo mejor que se puede hacer con la propia serie es su media.
- El error de `Naive` y de la STL **crece con el horizonte**: prolongan el último valor (Naive) o el último nivel de la tendencia (STL) (de {{=kwh(rmse_paso.loc[1, 'STL expansiva'])}} a {{=kwh(rmse_paso.loc[7, 'STL expansiva'])}} en la STL expansiva).
@@ Decisión
✅ Para el CENACE, el ARIMA(2,0,0) es el mejor modelo con la propia serie, pero solo aporta de verdad en el primer día.
:::
