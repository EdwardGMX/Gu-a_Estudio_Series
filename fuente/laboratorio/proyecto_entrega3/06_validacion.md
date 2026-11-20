## 🔁 Fase 5 · Selección con validación dentro del entrenamiento {#fase-validacion}
@mapa El pronóstico por componentes, el origen móvil sin fuga de información y la elección de los parámetros de la STL, los modelos de cada componente y la ventana.

:::pastilla azul | Aplicar · El pronóstico STL y el origen móvil | u1:pron-descomp u2:rolling-origin u2:un-paso u2:ref-transformadas {#val-metodo}
Programar el procedimiento que se va a evaluar. Para elegir la configuración **no se usa la prueba**: el entrenamiento se divide otra vez 80/20 y se elige con el último 20 % (la **validación**, {{=len(train) - int(len(train) * 0.8)}} días). En cada día de la validación se repite exactamente lo que se haría en la vida real:

1. Se toma solo la historia disponible hasta ese día.
2. Se **recalcula la STL** con esa historia (si se calculara una sola vez con todo, la descomposición ya "conocería" el futuro).
3. Cada componente se pronostica con su modelo, con toda la historia (**ventana expansiva**) o solo los últimos `ventana` días (**deslizante**).
4. Se suman los tres pronósticos para los siguientes **h = 7 días**.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `H_VAL` | 7 | El horizonte que pide el CENACE. |
| `inicio_val` | `int(292 × 0.8)` = 233 | Primer origen de la validación. |
| paso entre orígenes | 1 día | Cada día de la validación es un origen. |
| estacional | `SeasonalNaive(season_length=periodo)` | Repite el último ciclo. |
@@ Código
```python
def modelo_tendencia(nombre):
    if nombre == 'RWD':
        return RandomWalkWithDrift()
    if nombre == 'ARIMA(2,1,0)':
        return ARIMA(order=(2, 1, 0))
    return AutoARIMA()

def modelo_residuo(nombre):
    if nombre == 'Naive':
        return Naive()
    return HistoricAverage()

def pronostico_stl(hist, h, periodo=7, seasonal=7, tendencia='RWD', residuo='Naive', ventana=None, detalle=False):
    r = STL(hist['y'].values, period=periodo, seasonal=seasonal, robust=True).fit()
    componentes = [(r.trend, modelo_tendencia(tendencia)),
                   (r.seasonal, SeasonalNaive(season_length=periodo)),
                   (r.resid, modelo_residuo(residuo))]
    partes = []
    for valores, modelo in componentes:
        df_c = hist[['unique_id', 'ds']].copy()
        df_c['y'] = valores
        if ventana is not None:
            df_c = df_c.tail(ventana)
        sf = StatsForecast(models=[modelo], freq='D')
        sf.fit(df_c)
        partes.append(sf.predict(h=h).iloc[:, -1].values)
    total = np.sum(partes, axis=0)
    return (total, partes, r) if detalle else total

def origen_movil(datos, inicio, h, nombre='STL', **config):
    filas = []
    for i in range(inicio, len(datos) - h + 1):
        hist = datos.iloc[:i]
        real = datos.iloc[i:i + h]
        pron = real[['unique_id', 'ds', 'y']].copy()
        pron['cutoff'] = hist['ds'].iloc[-1]
        pron[nombre] = pronostico_stl(hist, h, **config)
        filas.append(pron)
    return pd.concat(filas, ignore_index=True)

def metricas(cv, modelos):
    tabla = evaluate(cv[['unique_id', 'ds', 'y'] + modelos], metrics=[rmse, mae])
    tabla_mape = evaluate(cv.loc[cv['y'] > 0, ['unique_id', 'ds', 'y'] + modelos], metrics=[mape])
    tabla = pd.concat([tabla, tabla_mape]).drop(columns='unique_id').set_index('metric').T
    tabla['mape'] = tabla['mape'] * 100
    tabla.columns = ['RMSE', 'MAE', 'MAPE (%)']
    return tabla.sort_values('RMSE')

H_VAL = 7
inicio_val = int(len(train) * 0.8)
print("Entrenamiento interno:", inicio_val, "días")
print("Validación:", len(train) - inicio_val, "días,", train['ds'].iloc[inicio_val].date(), "-", train['ds'].iloc[-1].date())
print("Orígenes con 7 días completos:", len(train) - inicio_val - H_VAL + 1)
```
@@ Resultado
```python oculto
# Animación: el origen se mueve por la validación (configuración inicial: periodo 7, seasonal 7, RWD, Naive)
cuad, txts, etqs, errs = [], [], [], []
y_min, y_max = -15000, 70000
for i in range(inicio_val, len(train) - H_VAL + 1, 3):
    hist = train.iloc[:i]
    real = train.iloc[i:i + H_VAL]
    tot, (pt, ps, pr), r = pronostico_stl(hist, H_VAL, detalle=True)
    ver = hist.tail(35)
    e = float(np.sqrt(np.mean((real['y'].values - tot) ** 2)))
    errs.append(e)
    cuad.append([linea(ver['ds'], ver['y'], "historia conocida", "gris", 1.4),
                 linea(ver['ds'], r.trend[-35:], "tendencia de la STL recalculada", "osc", 2),
                 linea(real['ds'], real['y'], "lo que pasó", "lav", 2.6, mode="lines+markers"),
                 linea(real['ds'], pt, "pronóstico de la tendencia (RWD)", "osc", 1.6, "dot"),
                 linea(real['ds'], tot, "pronóstico STL = tend. + estac. + resid.", "dur", 2.6, "dash", mode="lines+markers")])
    o = hist['ds'].iloc[-1]
    txts.append(f"Origen: <b>{fecha_larga(o)}</b>. Solo se conoce lo gris; la STL se recalcula con esa historia, la tendencia se extiende con RWD "
                f"y se le suman la estacional y el último residuo. RMSE de estos 7 días: <b>{kwh(e)}</b> kWh "
                f"(promedio de los orígenes vistos: {kwh(np.sqrt(np.mean(np.square(errs))))}).")
    etqs.append(fecha_corta(o))
animacion("anim-origen", cuad, textos=txts, etiquetas=etqs, etiqueta="Origen", vel=1300, alto=360,
          lv=[{"shapes": [vline(str(train['ds'].iloc[i - 1].date()), "rosa")]} for i in range(inicio_val, len(train) - H_VAL + 1, 3)],
          title={"text": "Origen móvil en la validación: cada origen pronostica 7 días"},
          yaxis={"title": {"text": "kWh/día"}, "range": [y_min, y_max]})
```
@widget lab-anim id=anim-origen
@@ Lectura
- La validación va del {{=fecha_larga(train['ds'].iloc[inicio_val])}} al {{=fecha_larga(train['ds'].iloc[-1])}}; con h = 7 hay **{{=len(train) - inicio_val - H_VAL + 1}} orígenes** y cada uno da 7 pronósticos.
- En la animación (un origen de cada tres, con la configuración inicial) se ve el punto débil de la STL para pronosticar: RWD extiende la tendencia **desde su último valor** con la pendiente de toda la historia, que es casi cero. Si el viento venía subiendo, el pronóstico se queda en ese nivel alto durante 7 días aunque el viento ya haya cambiado.
- La tendencia de la STL se recalcula en cada origen y su último tramo cambia de un origen a otro: en el borde, el LOESS tiene pocos datos.
@@ Decisión
🔵 Con este procedimiento se eligen, en orden: los parámetros de la STL, los modelos de cada componente y la ventana.
:::

:::pastilla verde | Aplicar · a) Los parámetros de la STL | u1:stl-parametros u2:metricas-def {#val-stl}
Evaluar las 25 combinaciones de `period` y `seasonal` con el origen móvil (tendencia con RWD, residuo con Naive) y quedarse con la de menor **RMSE**.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| rejilla | 5 periodos × 5 ventanas | La misma de la fase 4. |
| criterio | RMSE | Penaliza más los errores grandes; el MAPE no sirve aquí (ver la lectura). |
@@ Código
```python
val_stl = []
for periodo in [5, 7, 14, 21, 28]:
    for seasonal in [7, 15, 31, 51, 101]:
        cv = origen_movil(train, inicio_val, H_VAL, periodo=periodo, seasonal=seasonal)
        fila = metricas(cv, ['STL']).iloc[0].to_dict()
        fila.update(periodo=periodo, seasonal=seasonal)
        val_stl.append(fila)

val_stl = pd.DataFrame(val_stl).set_index(['periodo', 'seasonal']).sort_values('RMSE')
mejor_periodo, mejor_seasonal = map(int, val_stl.index[0])
print(val_stl.head(6).round(1))
print(f"Mejor STL: periodo={mejor_periodo}, seasonal={mejor_seasonal}")
```
@@ Resultado
```python oculto
z = [[float(val_stl.loc[(pp, ss), 'RMSE']) for ss in SEASONALS] for pp in PERIODOS]
grafica("val-stl", [calor([str(s) for s in SEASONALS], [str(pp) for pp in PERIODOS], z, "RMSE", escala=[[0, "#45397a"], [0.5, "#a99be6"], [1, "#f4f1fc"]],
                          hovertemplate="periodo %{y}, seasonal %{x}<br>RMSE %{z:,.0f}<extra></extra>",
                          text=[[kwh(v) for v in fila] for fila in z], texttemplate="%{text}")],
        alto=330, title={"text": "RMSE de validación (más oscuro = mejor)"},
        xaxis={"title": {"text": "seasonal"}, "type": "category"}, yaxis={"title": {"text": "period"}, "type": "category"})
```
@widget lab-graf id=val-stl
@@ Lectura
- La mejor combinación es **periodo = {{=mejor_periodo}} con `seasonal` = {{=mejor_seasonal}}** (RMSE de {{=kwh(val_stl['RMSE'].iloc[0])}} kWh), y le siguen las de `seasonal` 51 y 31 con el mismo periodo. Los periodos de 21 y 28 días son claramente peores (hasta {{=kwh(val_stl['RMSE'].max())}}): con 233 días hay pocos ciclos para estimar su patrón.
- Los valores grandes de `seasonal` funcionan mejor: producen una estacional más **suave y estable**, con menos ruido que repetir.
- El **MAPE** sale en cientos o miles por ciento porque hay días con producción casi nula (por ejemplo, 2.8 kWh el 24 de julio): un error de unos miles de kWh en esos días da porcentajes enormes. Por eso se decide con RMSE y MAE.
:::nota Detalle del notebook
En el notebook entregado, la tabla de esta celda pone primero periodo 14 / seasonal 101, pero la celda siguiente imprimió `periodo=14, seasonal=31` y todo lo que sigue usó 14/31: es la salida de una ejecución anterior. Al correr el notebook de corrido sale **14/101**, y es la que se usa aquí, así que las cifras de la STL de esta página difieren un poco de las entregadas. Las conclusiones no cambian.
:::
@@ Decisión
✅ STL con `period` = {{=mejor_periodo}} y `seasonal` = {{=mejor_seasonal}}. Ahora los modelos de cada componente.
:::

:::pastilla verde | Aplicar · b) El modelo de cada componente | u2:deriva u2:ref-metodos u2:arima-def {#val-modelos}
Con la STL elegida, probar las **6 combinaciones** de modelo para la tendencia (RWD, ARIMA(2,1,0), AutoARIMA) y para el residuo (Naive, HistoricAverage).
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| tendencia | RWD, ARIMA(2,1,0), AutoARIMA | El de clase, el sugerido por la ACF/PACF y el automático. |
| residuo | Naive, HistoricAverage | Repetir el último residuo o usar su media (≈ 0). |
@@ Código
```python
val_modelos = []
for tendencia in ['RWD', 'ARIMA(2,1,0)', 'AutoARIMA']:
    for residuo in ['Naive', 'HistoricAverage']:
        cv = origen_movil(train, inicio_val, H_VAL, periodo=mejor_periodo, seasonal=mejor_seasonal,
                          tendencia=tendencia, residuo=residuo)
        fila = metricas(cv, ['STL']).iloc[0].to_dict()
        fila.update(tendencia=tendencia, residuo=residuo)
        val_modelos.append(fila)

val_modelos = pd.DataFrame(val_modelos).set_index(['tendencia', 'residuo']).sort_values('RMSE')
mejor_tendencia, mejor_residuo = val_modelos.index[0]
print(val_modelos.round(1))
print(f"Mejores modelos: tendencia={mejor_tendencia}, residuo={mejor_residuo}")
```
@@ Resultado
```python oculto
orden_vm = val_modelos.sort_values('RMSE', ascending=False)
grafica("val-modelos", [barras(orden_vm['RMSE'], [f"{t} + {r}" for t, r in orden_vm.index], "RMSE",
                               ["menta" if r == "HistoricAverage" else "dur" for _, r in orden_vm.index], orientation="h",
                               hovertemplate="%{y}: %{x:,.0f} kWh<extra></extra>")],
        alto=300, title={"text": "RMSE de validación (verde: residuo con su media; naranja: residuo con Naive)"},
        margin={"l": 210}, xaxis={"title": {"text": "RMSE (kWh)"}, "range": [16000, 20000]})
```
@widget lab-graf id=val-modelos
@@ Lectura
- La mejor combinación es **`{{=mejor_tendencia}}` para la tendencia y `{{=mejor_residuo}}` para el residuo** (RMSE de {{=kwh(val_modelos['RMSE'].iloc[0])}}).
- Pronosticar el residuo con **su media** es mejor que con `Naive` para los tres modelos de tendencia: el residuo es ruido impredecible y su mejor pronóstico es su promedio (≈ 0).
- `RandomWalkWithDrift` le gana al ARIMA(2,1,0) y a AutoARIMA en la tendencia: los modelos más complejos extrapolan el último movimiento de la tendencia, y eso empeora el pronóstico cuando el viento cambia de régimen. RWD usa la pendiente de **toda** la historia, que es casi cero.
@@ Decisión
✅ Tendencia con RWD, estacional con SeasonalNaive y residuo con HistoricAverage. Falta la ventana.
:::

:::pastilla verde | Aplicar · c) Ventana expansiva o deslizante | u2:ref-ventanas u2:estrategias {#val-ventana}
Decidir cuánta historia usan los modelos de los componentes: **toda** (expansiva) o solo los últimos 90, 60, 30 o 14 días (deslizante).
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `ventana` | `None`, 90, 60, 30, 14 | `None` es la expansiva. |
| 7 días | no se probó | `SeasonalNaive` con periodo 14 necesita al menos 14 días, y con 7 datos tampoco se estima un AR/MA. |
@@ Código
```python
val_ventanas = []
for ventana in [None, 90, 60, 30, 14]:
    cv = origen_movil(train, inicio_val, H_VAL, periodo=mejor_periodo, seasonal=mejor_seasonal,
                      tendencia=mejor_tendencia, residuo=mejor_residuo, ventana=ventana)
    fila = metricas(cv, ['STL']).iloc[0].to_dict()
    fila['ventana'] = 'Expansiva' if ventana is None else ventana
    val_ventanas.append(fila)

val_ventanas = pd.DataFrame(val_ventanas).set_index('ventana')
mejor_deslizante = int(val_ventanas.drop(index='Expansiva')['RMSE'].idxmin())
config = dict(periodo=mejor_periodo, seasonal=mejor_seasonal, tendencia=mejor_tendencia, residuo=mejor_residuo)
print(val_ventanas.round(1))
print(f"Mejor ventana deslizante: {mejor_deslizante} días")
print(config)
```
@@ Resultado
```python oculto
grafica("val-ventana", [barras([str(v) if v != 'Expansiva' else 'expansiva' for v in val_ventanas.index], val_ventanas['RMSE'], "RMSE",
                               ["menta" if v == 'Expansiva' else "cel" if v == mejor_deslizante else "gris" for v in val_ventanas.index],
                               hovertemplate="%{x}: %{y:,.0f} kWh<extra></extra>")],
        alto=280, title={"text": "RMSE de validación según la ventana"}, xaxis={"title": {"text": "días de historia"}, "type": "category"},
        yaxis={"title": {"text": "RMSE (kWh)"}, "range": [15000, 20000]})
```
@widget lab-graf id=val-ventana
@@ Lectura
- La **expansiva** es la mejor (RMSE de {{=kwh(val_ventanas.loc['Expansiva', 'RMSE'])}}). Entre las deslizantes gana la de **{{=mejor_deslizante}} días** ({{=kwh(val_ventanas.loc[mejor_deslizante, 'RMSE'])}}), con la de 90 muy cerca; las de 30 y 14 días son peores.
- Con un solo año de datos, usar toda la historia ayuda más que adaptarse a lo último: con pocos días, la pendiente del RWD y la media del residuo se vuelven inestables.
@@ Decisión
✅ Configuración final: STL ({{=mejor_periodo}}, {{=mejor_seasonal}}) + RWD + SeasonalNaive + HistoricAverage. A la prueba van la **expansiva** y la de **{{=mejor_deslizante}} días**.
:::
