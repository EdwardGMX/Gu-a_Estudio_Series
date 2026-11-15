## 🤖 Fase 5b · Aprendizaje automático y redes neuronales {#fase-ml}
@mapa Entrenar con la tabla directa una regresión Ridge, probar si ayudan las variables físicas y las de calendario, comparar con gradient boosting y con dos redes neuronales, y combinar el mejor clásico con el mejor de aprendizaje automático.

:::pastilla verde | Aplicar · Ridge: una regresión lineal regularizada con los rezagos | u2:ar-def u2:estrategias {#ml-ridge}
Entrenar el modelo de aprendizaje automático más simple que tiene sentido: una **regresión lineal con penalización Ridge**, un modelo por horizonte, con las 34 características del viento. En el fondo es un AR "directo" con muchos rezagos cuyos coeficientes se encogen para no sobreajustar.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `StandardScaler` | estandarizar | La penalización Ridge trata igual a todas las variables; deben estar en la misma escala. |
| `Ridge(alpha=1.0)` | penalización | Con 27 rezagos muy correlacionados entre sí, la penalización estabiliza los coeficientes. |
| 24 modelos | uno por horizonte | Estrategia directa. |
| `np.clip(…, 0, None)` | sin negativos | El viento no puede ser negativo. |
@@ Código
```python
from sklearn.linear_model import Ridge
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import make_pipeline

def directo(fabrica, columnas, entrena, evalua):
    """Entrena un modelo por horizonte y devuelve los pronósticos indexados por el momento pronosticado."""
    pron = pd.Series(index=evalua.index, dtype=float)
    for h in range(1, 25):
        a, b = entrena[entrena["h"] == h], evalua["h"] == h
        modelo = fabrica().fit(a[columnas], a["y"])
        pron[b] = np.clip(modelo.predict(evalua.loc[b, columnas]), 0, None)
    return pd.Series(pron.values, index=pd.DatetimeIndex(evalua["momento"])).sort_index()

RIDGE = lambda: make_pipeline(StandardScaler(), Ridge(alpha=1.0))
VAL["Ridge"] = directo(RIDGE, VIENTO, ent_val, ev_val).reindex(VAL.index).values
print(tabla_val(["Ridge", "Armónica + AR(3)", "SARIMA d=0", "WindowAverage", "Naive"]).round(3).to_string())
```
@@ Lectura
- Ridge queda en MAE {{=metricas(VAL['real'], VAL['Ridge'])['MAE']|.3f}} y RMSE {{=metricas(VAL['real'], VAL['Ridge'])['RMSE']|.3f}}: le gana al SARIMA d = 0 y a las referencias, pero **queda detrás de la regresión armónica** ({{=metricas(VAL['real'], VAL['Armónica + AR(3)'])['MAE']|.3f}}).
- Funciona distinto que los clásicos: el SARIMA estima **un solo** modelo a un paso y lo encadena para llegar a 24 horas; Ridge estima **un modelo para cada horizonte**, optimizado directamente para el error a $h$ horas. Además, las medias móviles le dan un "nivel reciente" al que regresar, en lugar de la media de todo el entrenamiento. En estas 8 semanas de validación, cuyo nivel se parece al promedio del entrenamiento, esa diferencia no le da ventaja.
@@ Decisión
✅ Ridge con el viento es el candidato de aprendizaje automático. ¿Mejora si se le agregan las variables físicas?
:::

:::pastilla amarillo | Aplicar · ¿Ayudan la presión, la temperatura, la dirección y la hora? | u2:exogenas u2:requisitos-exog {#ml-fisicas}
Agregar a Ridge las variables físicas (presión y su cambio, temperatura, dirección) y la hora del día del momento pronosticado, y medir en la validación si el error baja.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `VIENTO + FISICAS` | 40 variables | Información medida en la turbina hasta el origen. |
| `+ ["hora"]` | la hora pronosticada | Como número del 0 al 23. Un modelo lineal solo puede darle un efecto lineal. |
@@ Código
```python
VAL["Ridge + físicas"] = directo(RIDGE, VIENTO + FISICAS, ent_val, ev_val).reindex(VAL.index).values
VAL["Ridge + físicas + hora"] = directo(RIDGE, VIENTO + FISICAS + ["hora"], ent_val, ev_val).reindex(VAL.index).values
print(tabla_val(["Ridge", "Ridge + físicas", "Ridge + físicas + hora"]).round(3).to_string())
```
@@ Lectura
- Agregar las variables físicas **no mejora** la validación: MAE {{=metricas(VAL['real'], VAL['Ridge + físicas'])['MAE']|.3f}} contra {{=metricas(VAL['real'], VAL['Ridge'])['MAE']|.3f}} con el viento solo. La hora tampoco cambia el resultado de forma apreciable.
- No significa que no tengan información (en las [[car-moviles|características]] se vio que el cambio de presión y la dirección se correlacionan con el cambio futuro), sino que **esa información ya está en los rezagos y las medias del viento**, o que en 8 semanas de validación su aporte no se distingue del ruido.
@@ Decisión
🟡 Por la regla del juego, se queda **Ridge con el viento solo**, el más simple de los que empatan. Las físicas se volverán a mirar en la prueba, por curiosidad, pero no se usan para elegir. Ahora la suposición **S7**: el calendario.
:::

:::pastilla rojo | Aplicar · El calendario: día de la semana, mes, trimestre y festivos | u2:festivos {#ml-calendario}
Agregar las cinco variables de calendario a Ridge (suposición **S7**). Si el día de la semana o los festivos no tienen relación física con el viento, el modelo solo puede aprender coincidencias del entrenamiento.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `CALENDARIO` | hora, día de la semana, mes, trimestre, festivo | Las variables que pide el flujo de trabajo. |
@@ Código
```python
VAL["Ridge + calendario"] = directo(RIDGE, VIENTO + FISICAS + CALENDARIO, ent_val, ev_val).reindex(VAL.index).values
print(tabla_val(["Ridge", "Ridge + físicas", "Ridge + calendario"]).round(3).to_string())
meses_ent = sorted(int(m) for m in ent_val["mes"].unique()); meses_val = sorted(int(m) for m in ev_val["mes"].unique())
print(f"\nMeses en el entrenamiento de la validación: {meses_ent} | meses evaluados: {meses_val}")
```
@@ Lectura
- Con el calendario el error **sube** a {{=metricas(VAL['real'], VAL['Ridge + calendario'])['MAE']|.3f}}: es el peor de los Ridge.
- El problema del **mes** es concreto: el modelo lo trata como un número y aprende una pendiente con los meses de enero a agosto; en la validación (finales de agosto, septiembre y octubre) **extrapola** esa pendiente a meses que no vio. El día de la semana y los festivos solo agregan coincidencias.
@@ Decisión
❌ **S7 descartada**: el calendario no ayuda a pronosticar el viento. Es una lección general: las variables de calendario funcionan cuando hay un comportamiento humano detrás (ventas, tráfico, demanda eléctrica); el viento no lo tiene. Siguiente: ¿un modelo no lineal, como **gradient boosting**, saca más de las mismas variables?
:::

:::pastilla amarillo | Aplicar · Gradient boosting: árboles que no saben extrapolar | u2:estrategias {#ml-hgb}
Entrenar `HistGradientBoostingRegressor`, un modelo de árboles potenciados (la misma familia que LightGBM y XGBoost), con las mismas tablas. Puede capturar relaciones no lineales e interacciones (por ejemplo, que la presión importe solo cuando el viento viene del norte). La suposición **S8** es que un modelo más complejo ganará.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `max_iter=200`, `learning_rate=0.05` | 200 árboles pequeños | Un aprendizaje lento generaliza mejor. |
| `max_leaf_nodes=15`, `min_samples_leaf=40` | árboles chicos | Limitan el sobreajuste. |
| tres versiones | viento; + físicas + hora; + calendario | Los mismos grupos que con Ridge. |
@@ Código
```python
from sklearn.ensemble import HistGradientBoostingRegressor

HGB = lambda: HistGradientBoostingRegressor(max_iter=200, learning_rate=0.05, max_leaf_nodes=15, min_samples_leaf=40, random_state=0)
VAL["HGB"] = directo(HGB, VIENTO, ent_val, ev_val).reindex(VAL.index).values
VAL["HGB + físicas + hora"] = directo(HGB, VIENTO + FISICAS + ["hora"], ent_val, ev_val).reindex(VAL.index).values
VAL["HGB + calendario"] = directo(HGB, VIENTO + FISICAS + CALENDARIO, ent_val, ev_val).reindex(VAL.index).values
print(tabla_val(["Ridge", "HGB", "HGB + físicas + hora", "HGB + calendario"]).round(3).to_string())
rango_ent = ent_val["y"].quantile([0.01, 0.99]).values
print(f"\nViento en el entrenamiento: 1% más bajo {rango_ent[0]:.1f} m/s, 1% más alto {rango_ent[1]:.1f} m/s")
```
@@ Lectura
- El mejor gradient boosting queda en {{=min(metricas(VAL['real'], VAL[m])['MAE'] for m in ['HGB', 'HGB + físicas + hora', 'HGB + calendario'])|.3f}} de MAE: **no supera a Ridge** ({{=metricas(VAL['real'], VAL['Ridge'])['MAE']|.3f}}).
- A diferencia de Ridge, al gradient boosting el calendario no le hace daño: un árbol usa el mes para separar temporadas, no para extrapolar una pendiente. Pero tampoco le da ventaja.
- La razón de fondo: un árbol pronostica **promedios de lo que vio en el entrenamiento**. No puede producir un valor fuera de ese rango ni seguir una tendencia hacia afuera, y la relación entre el viento actual y el futuro es, en su mayor parte, **lineal** (persistencia más reversión). Para eso basta y sobra un modelo lineal.
@@ Decisión
🟡 El gradient boosting funciona, pero con reservas: más lento, menos interpretable y sin ventaja. Pasa a la prueba su mejor versión en la validación (con el calendario). Falta la categoría de **redes neuronales**.
:::

:::pastilla rojo | Aplicar · Una red neuronal con todas las variables | u2:estrategias {#ml-mlp}
Entrenar una **red neuronal** multicapa (perceptrón multicapa, MLP) con dos capas ocultas, la arquitectura más básica de aprendizaje profundo, con las variables del viento, las físicas y la hora.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `hidden_layer_sizes=(32, 16)` | dos capas | 32 y 16 neuronas con activación ReLU. |
| `alpha=0.01` | penalización L2 pequeña | El valor típico por omisión. |
| `early_stopping=True` | 10% para validar dentro | Detiene el entrenamiento cuando el error de esa parte deja de bajar. |
| `StandardScaler` | estandarizar | Las redes son muy sensibles a la escala de las entradas. |
@@ Código
```python
from sklearn.neural_network import MLPRegressor

MLP_GRANDE = lambda: make_pipeline(StandardScaler(), MLPRegressor(hidden_layer_sizes=(32, 16), alpha=0.01, early_stopping=True,
                                                                 max_iter=300, random_state=0))
VAL["Red neuronal (32, 16)"] = directo(MLP_GRANDE, VIENTO + FISICAS + ["hora"], ent_val, ev_val).reindex(VAL.index).values
print(tabla_val(["Ridge", "Red neuronal (32, 16)", "WindowAverage", "Naive"]).round(3).to_string())
```
@@ Lectura
- La red neuronal queda en {{=metricas(VAL['real'], VAL['Red neuronal (32, 16)'])['MAE']|.3f}} de MAE: **peor que la persistencia** ({{=metricas(VAL['real'], VAL['Naive'])['MAE']|.3f}}).
- Con unos 2,000 parámetros por horizonte y menos de 6,000 orígenes para entrenar cada uno, la red **memoriza** particularidades del entrenamiento que no se repiten. El `early_stopping` no alcanza a evitarlo porque su 10% de validación interna es aleatorio y no respeta el tiempo.
@@ Decisión
❌ Así no funciona. Antes de descartar las redes, el siguiente paso prueba una **más pequeña y más regularizada**, con menos variables.
:::

:::pastilla amarillo | Aplicar · Una red neuronal pequeña y regularizada | u2:estrategias {#ml-mlp2}
Reducir la red a una sola capa de 16 neuronas, aumentar mucho la penalización y usar solo las variables del viento, como Ridge. Si así mejora, el problema era el exceso de capacidad.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `hidden_layer_sizes=(16,)` | una capa | Unos 560 parámetros por horizonte en lugar de 2,000. |
| `alpha=1.0` | 100 veces más penalización | Empuja la red hacia una función suave, más parecida a una regresión lineal. |
| `VIENTO` | 34 variables | Las mismas que Ridge. |
@@ Código
```python
MLP = lambda: make_pipeline(StandardScaler(), MLPRegressor(hidden_layer_sizes=(16,), alpha=1.0, early_stopping=True,
                                                          max_iter=300, random_state=0))
VAL["Red neuronal (16)"] = directo(MLP, VIENTO, ent_val, ev_val).reindex(VAL.index).values
print(tabla_val(["Ridge", "Red neuronal (16)", "Red neuronal (32, 16)", "Naive"]).round(3).to_string())
```
@@ Lectura
- La red pequeña mejora mucho ({{=metricas(VAL['real'], VAL['Red neuronal (16)'])['MAE']|.3f}}) y ya le gana a la persistencia, pero **sigue por detrás de Ridge** ({{=metricas(VAL['real'], VAL['Ridge'])['MAE']|.3f}}).
- Mientras más se regulariza la red, más se parece a una regresión lineal y mejor le va. Es una señal clara de que, con estos datos, **la no linealidad no aporta**: lo que hay que aprender es esencialmente lineal.
@@ Decisión
🟡 La red pequeña representa a las redes neuronales en la prueba. Una red recurrente (LSTM) podría aprender la dinámica directamente de la serie, pero necesitaría más datos que un año y otra biblioteca; queda como trabajo futuro. Por último, ¿se puede ganar algo **combinando** modelos de distintas familias?
:::

:::pastilla verde | Aplicar · Un ensamble: promediar el mejor clásico y el mejor de aprendizaje automático | u2:ref-elegir {#ml-ensamble}
Promediar los pronósticos de la **regresión armónica** (el mejor clásico) y de **Ridge** (el mejor de aprendizaje automático). Si sus errores no están perfectamente correlacionados, el promedio se equivoca menos que cada uno.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| pesos | 50% y 50% | Sin estimar pesos: con 56 días, estimarlos sería otra fuente de sobreajuste. |
| correlación de errores | Pearson | Mide qué tanto se equivocan "al mismo tiempo". |
@@ Código
```python
VAL["Ensamble (Armónica + Ridge)"] = (VAL["Armónica + AR(3)"] + VAL["Ridge"]) / 2
corr_err = (VAL["real"] - VAL["Armónica + AR(3)"]).corr(VAL["real"] - VAL["Ridge"])
print(f"Correlación entre los errores de los dos modelos: {corr_err:.3f}")
print(tabla_val(["Ensamble (Armónica + Ridge)", "Ridge", "Armónica + AR(3)"]).round(3).to_string())
```
@@ Lectura
- Los errores de los dos modelos están **muy correlacionados** ({{=corr_err|.2f}}): los dos fallan en los mismos momentos, que son los cambios bruscos de un episodio que ninguno puede anticipar con la serie sola.
- Aun así el ensamble queda en {{=metricas(VAL['real'], VAL['Ensamble (Armónica + Ridge)'])['MAE']|.3f}} de MAE, entre los dos o muy cerca del mejor, con un RMSE de {{=metricas(VAL['real'], VAL['Ensamble (Armónica + Ridge)'])['RMSE']|.3f}}.
@@ Decisión
✅ El ensamble pasa a la prueba como una opción robusta: rara vez es el mejor, pero casi nunca es malo. Con todos los candidatos entrenados, la Fase 6 reúne las **métricas preliminares** de la validación y elige.
:::
