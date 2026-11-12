## 📏 Métricas de pronóstico {#metricas}
@mapa MAE, MSE, RMSE, MAPE, sMAPE y MASE con un ejemplo a mano, sus propiedades (atípicos, ceros, escala), cuál elegir, cómo se calculan en Python y la comparación de modelos en AirPassengers.

### Las seis métricas {#metricas-def}

Todas comparan los valores reales $y_t$ con los pronósticos $\hat{y}_t$ en el periodo de prueba, a través del error $e_t = y_t - \hat{y}_t$.

:::definicion Métricas de error de pronóstico
$$\MAE = \frac1n\sum_{t=1}^{n}|y_t - \hat{y}_t|, \qquad \MSE = \frac1n\sum_{t=1}^{n}(y_t - \hat{y}_t)^2, \qquad \RMSE = \sqrt{\MSE}$$

$$\MAPE = \frac{100}{n}\sum_{t=1}^{n}\left|\frac{y_t - \hat{y}_t}{y_t}\right|, \qquad \sMAPE = \frac{100}{n}\sum_{t=1}^{n}\frac{2\,|y_t - \hat{y}_t|}{|y_t| + |\hat{y}_t|}, \qquad \MASE = \frac{\MAE}{\MAE_{\text{ingenuo}}}$$

donde $\MAE_{\text{ingenuo}} = \frac{1}{n_e - m}\sum_{t=m+1}^{n_e}|y_t - y_{t-m}|$ es el error del pronóstico ingenuo **en el entrenamiento** ($m = 1$ para el ingenuo simple, $m = s$ para el estacional).
:::

| Métrica | Interpretación (guía oficial) | Unidades |
|---|---|---|
| MAE | error absoluto promedio | las de la serie |
| MSE | castiga más los errores grandes | al cuadrado |
| RMSE | raíz del MSE, en las mismas unidades | las de la serie |
| MAPE | error porcentual promedio | % |
| sMAPE | versión simétrica del MAPE | % (entre 0 y 200) |
| MASE | compara contra un modelo ingenuo | sin unidades |

### Las seis métricas a mano {#guia-metricas-sec}

:::guiado Un pronóstico de cuatro periodos {#guia-metricas}
| $t$ | $y_t$ | $\hat{y}_t$ | $e_t$ | $\lvert e_t \rvert$ | $e_t^2$ | $\lvert e_t \rvert / y_t$ | $2\lvert e_t \rvert / (\lvert y_t \rvert + \lvert \hat{y}_t \rvert)$ |
|---|---|---|---|---|---|---|---|
| 1 | 100 | 90 | 10 | 10 | 100 | 0.1 | 0.10526 |
| 2 | 110 | 115 | −5 | 5 | 25 | 0.04545 | 0.04444 |
| 3 | 120 | 118 | 2 | 2 | 4 | 0.01667 | 0.01681 |
| 4 | 130 | 140 | −10 | 10 | 100 | 0.07692 | 0.07407 |
| promedio | | | | 6.75 | 57.25 | 0.05976 | 0.06015 |
---
= e_t = y_t - \hat{y}_t:\; 10,\ -5,\ 2,\ -10
> El error con signo: positivo si el pronóstico se quedó corto, negativo si se pasó.
@ usa c2[1-4] c3[1-4]; da c4[1-4]
= \MAE = \frac{10 + 5 + 2 + 10}{4} = \frac{27}{4} = 6.75
> En promedio, el pronóstico se equivoca por 6.75 unidades.
@ usa c5[1-4]; da c5[5]
= \MSE = \frac{100 + 25 + 4 + 100}{4} = \frac{229}{4} = 57.25, \qquad \RMSE = \sqrt{57.25} = 7.566
> El RMSE es mayor que el MAE porque los errores de 10 pesan más al elevarse al cuadrado.
@ usa c6[1-4]; da c6[5]
= \MAPE = \frac{100}{4}(0.1 + 0.04545 + 0.01667 + 0.07692) = 25(0.23904) = 5.976\%
> El error típico es de casi 6% del valor real.
@ usa c7[1-4]; da c7[5]
= \sMAPE = \frac{100}{4}(0.10526 + 0.04444 + 0.01681 + 0.07407) = 6.015\%
> Muy parecido al MAPE porque los errores son chicos comparados con el nivel.
@ usa c8[1-4]; da c8[5]
= \MAE_{\text{ingenuo}} = \frac{5 + 5 + 2 + 7}{4} = 4.75 \;\Rightarrow\; \MASE = \frac{6.75}{4.75} = 1.421
> Con un entrenamiento $(90, 95, 100, 98, 105)$, el ingenuo se equivoca 4.75 en promedio. $\MASE > 1$: este pronóstico es **peor** que repetir el último dato.
@ usa c5[5]
:::

### Propiedades que debes conocer {#metricas-propiedades}

:::demo El RMSE nunca es menor que el MAE {#demo-rmse-mae}
:::pasos
= 0 \le \frac1n\sum\big(|e_t| - \MAE\big)^2 = \frac1n\sum e_t^2 - 2\,\MAE\cdot\frac1n\sum|e_t| + \MAE^2
> La varianza de los errores absolutos no puede ser negativa; desarrollamos el cuadrado.
= = \MSE - 2\,\MAE^2 + \MAE^2 = \MSE - \MAE^2
> Usamos $\frac1n\sum|e_t| = \MAE$ y $\frac1n\sum e_t^2 = \MSE$.
= \MSE \ge \MAE^2 \;\Rightarrow\; \RMSE \ge \MAE
> Sacamos raíz. La igualdad solo se da si **todos** los errores tienen el mismo tamaño. Cuanto más dispersos (con atípicos), más se separan.
:::
:::

:::ejemplo Un solo error grande
Si en el ejemplo el último pronóstico hubiera sido 180 (error de −50 en lugar de −10):

$$\MAE: 6.75 \to 16.75 \;(\times 2.5), \qquad \RMSE: 7.57 \to 25.64 \;(\times 3.4)$$

El RMSE reacciona más. Por eso se usa cuando los errores grandes son especialmente costosos (por ejemplo, quedarse sin inventario), y el MAE cuando se quiere una medida robusta e interpretable.
:::

:::cuidado Los tres defectos del MAPE
1. **Explota cerca de cero**: si $y_t = 0.5$ y $\hat{y}_t = 1.5$, ese término vale 200%. Con ceros, no existe. No lo uses en series que pasan por cero (temperaturas, rendimientos, inventarios que se agotan).
2. **Es asimétrico**: con $y_t = 100$, quedarse corto tiene un límite (pronosticar 0 da 100%), pero pasarse no (pronosticar 300 da 200%). Favorece a los modelos que pronostican **de menos**.
3. **Depende de la escala de la serie**: no tiene sentido en datos con un cero arbitrario (grados Celsius).

El sMAPE corrige el primero solo en parte y queda acotado entre 0% y 200%, pero tampoco es realmente simétrico.
:::

:::definicion Cuál elegir (criterio práctico de la guía oficial)
- **MAE** si quieres interpretabilidad: «nos equivocamos por 13 mil pasajeros al mes».
- **RMSE** si quieres castigar los errores grandes.
- **MAPE** si los valores reales no están cerca de cero y quieres un porcentaje.
- **MASE** si quieres comparar contra una referencia ingenua, o comparar series de escalas distintas.

Reporta siempre **más de una** métrica y la del pronóstico ingenuo como punto de comparación. Las referencias y cómo se calculan con statsforecast están en [[referencia]].
:::

:::interactivo w2-metricas | Cómo reacciona cada métrica {#w-metricas}
Seis valores reales y sus pronósticos. Mueve el sesgo (todos los pronósticos de más o de menos), agrega un error atípico o acerca la serie a cero, y mira cómo responde cada métrica.
@@@
- **Izquierda**: real (puntos) contra pronóstico (rombos) y los errores como segmentos.
- **Derecha**: las seis métricas (MASE con el ingenuo del entrenamiento). Las de porcentaje están en %, el MSE en unidades al cuadrado.
- Con el **atípico**, el RMSE sube mucho más que el MAE. Al **acercar a cero**, el MAPE se dispara aunque los errores absolutos no cambien.
- **Vista extra**: la tabla con el aporte de cada periodo a cada métrica.
:::

### Las métricas en Python {#metricas-python}

```python
from sklearn.metrics import mean_absolute_error, mean_squared_error, mean_absolute_percentage_error, root_mean_squared_error

real = serie.iloc[-12:].values
pron = np.exp(ajuste_def.get_forecast(12).predicted_mean.values)            # aerolínea, en pasajeros
escala = np.mean(np.abs(serie.iloc[12:-12].values - serie.iloc[:-24].values))  # ingenuo estacional en entrenamiento
print(f"MAE   = {mean_absolute_error(real, pron):.3f}")
print(f"MSE   = {mean_squared_error(real, pron):.3f}")
print(f"RMSE  = {root_mean_squared_error(real, pron):.3f}")
print(f"MAPE  = {100 * mean_absolute_percentage_error(real, pron):.3f} %   ← sklearn devuelve una proporción")
print(f"sMAPE = {100 * np.mean(2 * np.abs(real - pron) / (np.abs(real) + np.abs(pron))):.3f} %")
print(f"MASE  = {mean_absolute_error(real, pron) / escala:.4f}   (escala: ingenuo estacional = {escala:.2f})")
```

:::cuidado `mean_squared_error(..., squared=False)` ya no existe
La guía oficial usa `mean_squared_error(y, ŷ, squared=False)` para el RMSE. Ese argumento se eliminó en scikit-learn 1.6: en versiones recientes da `TypeError`. Usa `root_mean_squared_error(y, ŷ)` (desde 1.4) o `np.sqrt(mean_squared_error(y, ŷ))`, que funciona en cualquier versión. Y recuerda que `mean_absolute_percentage_error` devuelve una **proporción** (0.029), no un porcentaje.
:::

:::interactivo w2-metricas-modelos | Cinco modelos para 1960 con todas las métricas {#w-metricas-modelos}
Compara el modelo de aerolínea, dos variantes de la rejilla y los dos pronósticos ingenuos en el año de prueba.
@@@
- **Izquierda**: los pronósticos de cada modelo contra los datos reales de 1960.
- **Derecha**: la métrica que elijas para cada modelo. Fíjate en que el orden puede cambiar según la métrica.
- El ingenuo estacional tiene $\MASE \approx 1$ por construcción… si 1960 se pareciera al entrenamiento; en la prueba queda arriba de 1 porque 1960 creció más.
- **Vista extra**: la tabla completa con las seis métricas.
:::

:::interactivo py2-metricas | Simulador: las funciones de `sklearn.metrics` {#sim-metricas}
Elige el modelo y cómo calcular el RMSE y la escala del MASE. El código y la salida se actualizan.
@@@
- `squared=False` produce el error de las versiones nuevas; `root_mean_squared_error` y `np.sqrt(MSE)` dan lo mismo.
- La **escala** del MASE cambia mucho el resultado: con el ingenuo simple ($m = 1$) y con el estacional ($m = 12$). Con datos estacionales se recomienda el estacional.
:::

:::resumen Lo que debes llevarte de las métricas
- MAE (interpretable), MSE/RMSE (castigan errores grandes; $\RMSE \ge \MAE$), MAPE/sMAPE (porcentaje; cuidado con ceros), MASE (contra el ingenuo; < 1 = mejor que el ingenuo).
- Calcula las métricas en la **escala original** (pasajeros), no en logaritmos.
- En scikit-learn reciente: `root_mean_squared_error`; `mean_absolute_percentage_error` devuelve proporción.
- Reporta varias métricas y siempre la del ingenuo como referencia.
:::
