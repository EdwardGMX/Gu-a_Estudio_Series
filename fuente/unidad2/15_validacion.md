## ✂️ Validación temporal y pronóstico {#validacion}
@mapa Por qué no se mezclan los datos, entrenamiento/validación/prueba en orden, pronóstico a un paso contra varios pasos, las estrategias recursiva, directa y MIMO, y la validación con origen móvil.

### ¿Por qué no una partición aleatoria? {#particion}

En aprendizaje automático es común separar al azar 80% para entrenar y 20% para probar. En series de tiempo eso es un error grave. La guía oficial: *la validación debe respetar el orden temporal. No se mezclan datos futuros con datos pasados*.

:::intuicion Otra forma de verlo: interpolar contra extrapolar
Si eliges al azar qué meses van a la prueba, para «pronosticar» marzo de 1955 el modelo tiene a la mano febrero **y abril** de 1955. Eso no es pronosticar, es **interpolar**: rellenar un hueco con información de los dos lados. En la vida real, cuando pronosticas marzo todavía no existe abril. Una partición aleatoria mide qué tan bien rellenas huecos, no qué tan bien anticipas el futuro, y por eso da errores engañosamente pequeños.
:::

:::interactivo w2-validacion | Partición aleatoria contra partición temporal {#w-validacion}
La misma regla de pronóstico se evalúa de dos maneras sobre AirPassengers. En la aleatoria, cada mes de prueba se «pronostica» con el promedio de sus vecinos (lo que haría un modelo con fuga). En la temporal, se pronostica el último año con lo que se sabía hasta el final del anterior.
@@@
- **Arriba**: qué meses son de entrenamiento (lila) y cuáles de prueba (rosa) en cada esquema.
- **Barras**: el MAPE de cada esquema. La partición aleatoria promete un error que nunca vas a tener al pronosticar de verdad.
- Cambia la proporción de prueba y la semilla: la conclusión no cambia.
:::

### Entrenamiento, validación y prueba {#tres-bloques}

<div class="ruta">
<div class="ruta-paso"><b>Entrenamiento</b><span>Estima los parámetros de cada candidato. AirPassengers: 1949–1958.</span></div>
<div class="ruta-paso"><b>Validación</b><span>Compara candidatos y ajusta decisiones (órdenes, transformación). AirPassengers: 1959.</span></div>
<div class="ruta-paso"><b>Prueba</b><span>Se usa <b>una sola vez</b>, al final, con el modelo ya elegido. AirPassengers: 1960.</span></div>
</div>

La guía oficial usa la versión de dos bloques (entrenar con 1949–1959, probar con 1960) y la complementa con AIC/BIC para elegir. Con pocos datos es razonable; con más datos conviene la versión de tres bloques o, mejor, el origen móvil [[rolling-origin]].

:::cuidado Las fugas más sutiles
- Estimar el $\lambda$ de Box–Cox, la media o la desviación estándar para estandarizar **con toda la serie** (incluida la prueba).
- Elegir el modelo viendo el error de prueba y luego reportar ese mismo error como «error esperado».
- Usar exógenas que en la realidad no tendrías a tiempo [[fuga]].

Regla: todo lo que se calcula con datos (parámetros, transformaciones, decisiones) se calcula **solo con el pasado** del punto que se pronostica.
:::

### Un paso contra varios pasos {#un-paso}

:::definicion Pronóstico a un paso y a varios pasos
- **Un paso adelante** (*one-step-ahead*): se pronostica $t + 1$ con la información **real** hasta $t$; luego llega el dato real de $t + 1$ y se pronostica $t + 2$, y así sucesivamente.
- **Varios pasos** (*multi-step*): desde un origen $t$ se pronostican $t + 1, \dots, t + h$ de una sola vez, usando **pronósticos previos** en lugar de datos reales.

En statsmodels: `get_forecast(h)` (o `get_prediction(..., dynamic=True)`) da el pronóstico a varios pasos; `get_prediction(..., dynamic=False)` sobre datos reales da los pronósticos a un paso.
:::

:::demo Por qué el error crece con el horizonte {#demo-error-horizonte}
:::pasos
= e_{t+1} = \varepsilon_{t+1}, \qquad \Var(e_{t+1}) = \sigma^2
> A un paso solo falta conocer el choque de mañana.
= e_{t+h} = \psi_0\varepsilon_{t+h} + \psi_1\varepsilon_{t+h-1} + \dots + \psi_{h-1}\varepsilon_{t+1}
> A $h$ pasos se acumulan $h$ choques desconocidos [[demo-var-pronostico]].
= \Var(e_{t+h}) = \sigma^2\sum_{j<h}\psi_j^2 \ge \sigma^2 = \Var(e_{t+1})
> Cada término extra es no negativo: en promedio, el error a varios pasos **nunca** es menor que a un paso.
:::

En un año concreto puede pasar lo contrario por azar: con AirPassengers, el MAPE de 1960 a un paso es 3.05% y a doce pasos 2.90%. La conclusión «el error crece con el horizonte» es sobre el **promedio** de muchos orígenes, y eso es lo que mide la validación con origen móvil.
:::

```python
completo = ajuste_def.apply(log_serie)                     # mismos parámetros, ahora con los datos de 1960
uno = completo.get_prediction(start=132, end=143, dynamic=False)      # a un paso: usa el dato real anterior
varios = ajuste_def.get_forecast(12)                                   # a varios pasos desde dic-1959
real_1960 = serie.iloc[-12:]
mape = lambda p: 100 * np.mean(np.abs(real_1960.values - np.exp(p.predicted_mean.values)) / real_1960.values)
print(f"MAPE a un paso: {mape(uno):.2f}%  |  MAPE a 12 pasos: {mape(varios):.2f}%")
ancho = lambda p: np.exp(p.conf_int().iloc[:, 1]) - np.exp(p.conf_int().iloc[:, 0])
print("Ancho de la banda 95% (pasajeros), meses 1, 6 y 12:")
print("  un paso :", np.round(ancho(uno).values[[0, 5, 11]], 1))
print("  12 pasos:", np.round(ancho(varios).values[[0, 5, 11]], 1))
```

```python oculto cache
# --- Precálculo: validación con origen móvil y one-step vs multi-step (se guarda en caché) ---
import warnings
import numpy as np, pandas as pd
from statsmodels.tsa.statespace.sarimax import SARIMAX
warnings.simplefilter("ignore")
_AP = [112,118,132,129,121,135,148,148,136,119,104,118,115,126,141,135,125,149,170,170,158,133,114,140,145,150,178,163,172,178,199,199,184,162,146,166,171,180,193,181,183,218,230,242,209,191,172,194,196,196,236,235,229,243,264,272,237,211,180,201,204,188,235,227,234,264,302,293,259,229,203,229,242,233,267,269,270,315,364,347,312,274,237,278,284,277,317,313,318,374,413,405,355,306,271,306,315,301,356,348,355,422,465,467,404,347,305,336,340,318,362,348,363,435,491,505,404,359,310,337,360,342,406,396,420,472,548,559,463,407,362,405,417,391,419,461,472,535,622,606,508,461,390,432]
_s = pd.Series(_AP, index=pd.date_range("1949-01-01", periods=144, freq="MS"), dtype=float)
_log = np.log(_s)
_modelos = {"aerolinea": ((0, 1, 1), (0, 1, 1, 12)), "ar_est": ((1, 1, 0), (1, 1, 0, 12)), "arima": ((1, 1, 1), (0, 0, 0, 0))}
_origenes = list(range(96, 121, 2))
_res = {k: [] for k in list(_modelos) + ["ingenuo_est", "ingenuo"]}
for T in _origenes:
    tr = _log.iloc[:T]
    real = _s.iloc[T:T + 12].values
    for k, (o, so) in _modelos.items():
        tr_k = "c" if k == "arima" else "n"
        r = SARIMAX(tr, order=o, seasonal_order=so, trend=tr_k).fit(disp=False)
        pred = np.exp(r.get_forecast(12).predicted_mean.values)
        _res[k].append([round(float(v), 3) for v in pred])
    _res["ingenuo_est"].append([round(float(v), 3) for v in _s.iloc[T - 12:T].values])
    _res["ingenuo"].append([round(float(_s.iloc[T - 1]), 3)] * 12)
# one-step vs multi-step en 1960 con el modelo de aerolínea ajustado hasta 1959
_tr = _log.iloc[:-12]
_r = SARIMAX(_tr, order=(0, 1, 1), seasonal_order=(0, 1, 1, 12)).fit(disp=False)
_multi = _r.get_forecast(12)
_full = _r.apply(_log)                     # mismos parámetros, ahora con los datos de 1960 disponibles
_uno = _full.get_prediction(start=132, end=143, dynamic=False)
_din = _full.get_prediction(start=132, end=143, dynamic=True)
_f = lambda x: [round(float(v), 5) for v in np.asarray(x)]
exportar("validacion_ap", {
    "origenes": _origenes, "pred": _res, "serie": [float(v) for v in _AP],
    "fechas": [str(d.date()) for d in _s.index],
    "multi": {"media": _f(_multi.predicted_mean), "inf": _f(_multi.conf_int().iloc[:, 0]), "sup": _f(_multi.conf_int().iloc[:, 1])},
    "uno": {"media": _f(_uno.predicted_mean), "inf": _f(_uno.conf_int().iloc[:, 0]), "sup": _f(_uno.conf_int().iloc[:, 1])},
    "dinamico_igual": bool(np.allclose(_din.predicted_mean.values, _multi.predicted_mean.values)),
    "params": _f(_r.params)})
print("origenes:", len(_origenes))
```

:::interactivo w2-unpaso | 1960 a un paso y a doce pasos {#w-unpaso}
El mismo modelo de aerolínea (parámetros estimados con 1949–1959) pronostica 1960 de dos formas.
@@@
- **Rosa**: el pronóstico a 12 pasos hecho en diciembre de 1959, con su banda que se abre mes a mes.
- **Menta**: los pronósticos a un paso: cada mes se pronostica con el dato real del mes anterior. Su banda es angosta y casi constante.
- **Puntos**: los datos reales de 1960.
- **Vista extra**: la tabla mes por mes con los dos pronósticos y sus errores.
:::

### Estrategias para pronosticar varios pasos {#estrategias}

La guía oficial describe tres:

| Estrategia | Cómo funciona | Ventaja | Desventaja |
|---|---|---|---|
| **Recursiva** | un modelo de un paso se aplica repetidamente usando sus propios pronósticos | un solo modelo; es lo que hace ARIMA | si el modelo está mal especificado, el error se **acumula** |
| **Directa** | se entrena un modelo distinto para cada horizonte $h$ | cada modelo se optimiza para su horizonte | $H$ modelos; ignoran la relación entre horizontes |
| **MIMO** | un solo modelo produce todos los horizontes a la vez (salida vectorial) | coherencia entre horizontes | modelos más complejos (redes, regresión multisalida) |

:::guiado Recursiva contra directa con un AR(1) a mano {#guia-estrategias}
Serie (ya centrada): $y = (1.0,\ 0.6,\ 0.9,\ 0.2,\ -0.3,\ 0.1,\ -0.5,\ -0.2)$. Queremos pronosticar dos pasos desde $y_8 = -0.2$.

| Cantidad | Valor |
|---|---|
| $\sum y_t\,y_{t-1}$ | 1.28 |
| $\sum y_{t-1}^2$ | 2.56 |
| $\sum y_t\,y_{t-2}$ | 0.90 |
| $\sum y_{t-2}^2$ | 2.31 |
| $\hat\phi$ (modelo de un paso) | 0.5 |
| $\hat b_2$ (modelo directo de dos pasos) | 0.3896 |
---
= \hat\phi = \frac{\sum y_t\,y_{t-1}}{\sum y_{t-1}^2} = \frac{1.28}{2.56} = 0.5
> Recursiva: se estima un AR(1) de **un paso** (regresión de $y_t$ sobre $y_{t-1}$).
@ usa c2[1-2]; da c2[5]
= \hat y_{t+2}^{\text{rec}} = \hat\phi\,\hat y_{t+1} = \hat\phi^2\,y_t = 0.25(-0.2) = -0.05
> Se aplica dos veces: el segundo paso usa el pronóstico del primero.
@ usa c2[5]
= \hat b_2 = \frac{\sum y_t\,y_{t-2}}{\sum y_{t-2}^2} = \frac{0.90}{2.31} = 0.3896
> Directa: se estima **otro** modelo, la regresión de $y_t$ sobre $y_{t-2}$, pensado solo para dos pasos.
@ usa c2[3-4]; da c2[6]
= \hat y_{t+2}^{\text{dir}} = \hat b_2\,y_t = 0.3896(-0.2) = -0.078
> Los dos pronósticos difieren porque $\hat b_2 \ne \hat\phi^2$: los datos no se comportan exactamente como un AR(1).
@ usa c2[6]
= \text{Si el modelo es correcto: } \hat b_2 \approx \hat\phi^2;\quad \text{si no, la directa se adapta mejor}
> La recursiva es más eficiente cuando el modelo es el verdadero; la directa es más robusta cuando el modelo está mal especificado.
:::

:::interactivo w2-estrategias | ¿Cuándo gana cada estrategia? {#w-estrategias}
Los datos vienen de un AR(2), pero puedes ajustarles un AR(1) (mal especificado) o un AR(2) (correcto). La gráfica compara el error cuadrático medio de las estrategias recursiva y directa para cada horizonte, promediando 200 simulaciones.
@@@
- **Lila**: recursiva. **Rosa**: directa. Con el modelo **correcto** las dos casi coinciden (la recursiva un poco mejor); con el modelo **incorrecto** la directa gana en los horizontes largos.
- **Línea gris**: el error mínimo posible (el del modelo verdadero con parámetros conocidos).
- **Vista extra**: la tabla de errores por horizonte.
:::

### Validación con origen móvil (rolling origin) {#rolling-origin}

Un solo año de prueba son 12 errores: poca evidencia para elegir entre modelos parecidos [[guia-rejilla]]. La **validación con origen móvil** (o *validación cruzada para series de tiempo*) repite el ejercicio desde muchos orígenes:

:::definicion Origen móvil con ventana creciente
1. Elige un primer origen $T_1$ (por ejemplo, después de 8 años de datos).
2. Ajusta el modelo con los datos hasta $T_1$ y pronostica $h = 1, \dots, H$.
3. Guarda los errores. Mueve el origen ($T_2 = T_1 + \text{paso}$), **reajusta** con los datos hasta $T_2$ y repite.
4. Promedia los errores por horizonte y en total.

Así cada modelo se evalúa con decenas de pronósticos, todos honestos (siempre con el pasado del origen).
:::

```python cache
errores = {"aerolinea": [], "ingenuo estacional": []}
for T in range(96, 121, 2):                                 # 13 orígenes: dic-1956 ... dic-1958
    pasado, futuro = log_serie.iloc[:T], serie.iloc[T:T + 12].values
    m = SARIMAX(pasado, order=(0, 1, 1), seasonal_order=(0, 1, 1, 12)).fit(disp=False)
    errores["aerolinea"].append(np.abs(futuro - np.exp(m.get_forecast(12).predicted_mean.values)))
    errores["ingenuo estacional"].append(np.abs(futuro - serie.iloc[T - 12:T].values))
for nombre, e in errores.items():
    e = np.array(e)
    print(f"{nombre:20s} MAE total = {e.mean():6.2f} | MAE por horizonte h=1, 6, 12: {np.round(e.mean(axis=0)[[0, 5, 11]], 1)}")
```

:::interactivo w2-rolling | Origen móvil con cinco modelos {#w-rolling}
Mueve el origen y mira cómo cada modelo pronostica los siguientes 12 meses con lo que sabía hasta ese momento. Abajo, el error promedio por horizonte sobre los 13 orígenes. Todos los modelos SARIMA se reajustaron en cada origen con statsmodels.
@@@
- **Arriba**: la ventana de entrenamiento (gris) crece con el origen; las líneas de colores son los pronósticos de cada modelo y los puntos, los datos reales.
- **Abajo a la izquierda**: el MAE promedio por horizonte. El error crece con $h$, como predice la teoría [[demo-error-horizonte]].
- **Abajo a la derecha**: el MAE total de cada modelo: aerolínea y (1,1,0)(1,1,0) prácticamente empatan; el ingenuo estacional es la referencia a vencer y el ARIMA sin estacionalidad pierde contra todos.
- **Vista extra**: la tabla con MAE y MAPE totales de cada modelo.
:::

:::resumen Lo que debes llevarte de la validación
- Nunca partición aleatoria: entrenamiento → validación → prueba, **en orden**; la prueba se usa una sola vez.
- Todo lo que se estima (parámetros, $\lambda$, estandarización) se estima solo con el pasado.
- Un paso usa datos reales hasta $t$; varios pasos usan pronósticos previos; en promedio el error crece con $h$.
- Estrategias: recursiva (ARIMA), directa (un modelo por horizonte) y MIMO (todos a la vez).
- El origen móvil da muchos errores honestos y permite comparar modelos parecidos con más confianza que un solo año de prueba.
:::
