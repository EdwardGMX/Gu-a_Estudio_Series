## ⚖️ Criterios de información: AIC y BIC {#aic-bic}
@mapa Por qué la log-verosimilitud sola no sirve para elegir, AIC, BIC y HQIC, el castigo por parámetro, qué modelos se pueden comparar y la rejilla de 36 modelos de AirPassengers.

### ¿Por qué no elegir el modelo con mayor ℓ? {#aic-por-que}

:::demo Agregar parámetros nunca baja la log-verosimilitud máxima {#demo-anidados}
Comparemos un AR(1) con un AR(2). El AR(1) es un caso particular del AR(2): el que tiene $\phi_2 = 0$.

:::pasos
= \hat\ell_{\text{AR(2)}} = \max_{\phi_1, \phi_2, \sigma^2}\ell(\phi_1, \phi_2, \sigma^2)
> El máximo se busca entre **todos** los valores de $(\phi_1, \phi_2)$...
= \ge \max_{\phi_1, \sigma^2}\ell(\phi_1, 0, \sigma^2) = \hat\ell_{\text{AR(1)}}
> ... incluidos los que tienen $\phi_2 = 0$. El máximo sobre un conjunto más grande no puede ser menor.
= \hat\ell_{\text{AR(}p+1\text{)}} \ge \hat\ell_{\text{AR(}p\text{)}} \;\text{ para todo } p
> Si eligiéramos por $\ell$, **siempre** ganaría el modelo más grande, aunque sus parámetros extra solo ajusten el ruido.
:::
:::

Ajustar el ruido se llama **sobreajuste**: el modelo memoriza las particularidades de esta muestra y pronostica peor datos nuevos. Hace falta un criterio que premie el ajuste pero **cobre** por cada parámetro.

### AIC, BIC y HQIC {#aic-def}

:::definicion Criterios de información
$$\AIC = 2k - 2\ell, \qquad \BIC = k\ln(n) - 2\ell, \qquad \HQIC = 2k\ln(\ln n) - 2\ell$$

- $\tip{k-par}{k}$: número de parámetros estimados (**incluida** la varianza $\sigma^2$).
- $\ell$: log-verosimilitud maximizada.
- $n$: número de observaciones (en `SARIMAX`, las **efectivas**: sin las $d + sD$ que se pierden al diferenciar).

La guía oficial: *se prefiere el modelo con menor AIC o BIC. BIC penaliza más la complejidad cuando $n$ es grande*. Los dos tienen la forma «**desajuste** + **castigo**»: $-2\ell$ baja cuando el modelo ajusta mejor; el castigo sube con cada parámetro.
:::

:::demo ¿Cuándo castiga más el BIC que el AIC? {#demo-bic-mas}
:::pasos
= \text{castigo por parámetro: AIC} = 2, \qquad \text{BIC} = \ln n
> Cada parámetro extra suma 2 al AIC y $\ln n$ al BIC.
= \ln n > 2 \iff n > e^2 \approx 7.39
> Con 8 observaciones o más, el BIC castiga más que el AIC. En la práctica, **siempre**.
= n = 119:\; \ln 119 = 4.78 \approx 2.4 \times 2
> En AirPassengers, cada parámetro le cuesta al BIC casi dos veces y media lo que le cuesta al AIC. Por eso el BIC elige modelos más sencillos.
:::
:::

:::guiado AIC, BIC y HQIC del modelo de aerolínea, a mano {#guia-aic}
Del `summary()` del modelo de aerolínea con los valores predeterminados [[sarima-ap]]:

| Dato | Valor |
|---|---|
| $\ell$ (Log Likelihood) | 223.6266 |
| $k$ (ma.L1, ma.S.L12, sigma2) | 3 |
| $n$ efectivo $= 132 - 13$ | 119 |
| AIC | −441.2532 |
| BIC | −432.9158 |
| HQIC | −437.8676 |
---
= -2\ell = -2(223.6266) = -447.2532
> El término de ajuste. Con log-verosimilitudes positivas (comunes con datos en logaritmos) los criterios salen negativos; no importa: **menor es mejor**.
@ usa c2[1]
= \AIC = 2(3) - 447.2532 = -441.2532
> Castigo de 2 por cada uno de los 3 parámetros. Coincide con el `summary()`.
@ usa c2[1-2]; da c2[4]
= \BIC = 3\ln(119) - 447.2532 = 3(4.7791) - 447.2532 = 14.3374 - 447.2532 = -432.9158
> statsmodels usa las 119 observaciones **efectivas**: las 13 primeras se pierden por las diferencias $(1 - L)(1 - L^{12})$. Con $n = 132$ saldría −432.60 y no coincidiría.
@ usa c2[1-3]; da c2[5]
= \HQIC = 2(3)\ln(\ln 119) - 447.2532 = 6(1.5643) - 447.2532 = -437.8676
> El castigo del HQIC queda entre los otros dos.
@ usa c2[1-3]; da c2[6]
:::

### El castigo por parámetro {#penalizacion}

:::demo ¿Cuánto debe mejorar ℓ para que valga la pena un parámetro? {#demo-umbral}
:::pasos
= \Delta\AIC = 2(k + 1) - 2(\ell + \Delta\ell) - (2k - 2\ell) = 2 - 2\Delta\ell
> Agregamos un parámetro que sube la log-verosimilitud en $\Delta\ell$.
= \Delta\AIC < 0 \iff \Delta\ell > 1
> Para el AIC, un parámetro extra se justifica si sube $\ell$ en más de **1 unidad**.
= \Delta\BIC < 0 \iff \Delta\ell > \frac{\ln n}{2}
> Para el BIC, en más de $\ln(n)/2$: con $n = 119$, más de 2.39 unidades.
= 2\Delta\ell \sim \chi^2(1) \text{ si el parámetro sobra} \;\Rightarrow\; P(2\Delta\ell > 2) = 0.157, \quad P(2\Delta\ell > 4.78) = 0.029
> Conexión con la prueba de razón de verosimilitudes: el AIC acepta un parámetro inútil el 15.7% de las veces; el BIC, solo el 2.9%. Por eso el AIC tiende a **sobreajustar** un poco y el BIC no.
:::
:::

:::ejemplo ¿Vale la pena el término AR estacional?
Comparamos el modelo de aerolínea con SARIMA(0,1,1)(1,1,1)₁₂, que agrega $\Phi$:

$$\ell: 223.6266 \to 223.7306, \qquad \Delta\ell = 0.104 < 1$$

El parámetro extra casi no mejora el ajuste: $\Delta\AIC = 2 - 2(0.104) = +1.79$ (empeora) y $\Delta\BIC = 4.78 - 0.21 = +4.57$ (empeora más). Se queda el modelo de aerolínea.
:::

:::interactivo w2-penalizacion | AIC contra BIC eligiendo el orden de un AR {#w-penalizacion}
Los datos vienen de un AR(2). Se ajustan AR($p$) con $p = 0, \dots, 10$ sobre la misma muestra y se calcula $-2\ell$, AIC y BIC para cada uno.
@@@
- **Izquierda**: $-2\ell$ (gris) siempre baja al agregar rezagos; el AIC (lila) y el BIC (rosa) bajan y luego **suben** cuando el castigo supera la mejora. Los rombos marcan el $p$ elegido por cada uno.
- **Derecha**: repite el experimento 100 veces y cuenta qué $p$ elige cada criterio. El BIC acierta $p = 2$ más seguido; el AIC a veces elige órdenes mayores.
- Con $n$ chico los dos se equivocan más (eligen órdenes menores porque el $\phi_2$ verdadero no se nota).
- **Vista extra**: la tabla de $\ell$, AIC y BIC para la muestra actual.
:::

:::duda ¿Qué diferencia de AIC es «importante»?
Una regla muy citada (Burnham y Anderson): con $\Delta = \AIC_i - \AIC_{\min}$, si $\Delta < 2$ los modelos tienen un apoyo **parecido**; entre 4 y 7, mucho menos apoyo; más de 10, prácticamente ninguno. Diferencias de décimas no significan nada: entre modelos casi empatados, elige el más sencillo o el que tenga mejores residuos y mejor validación.
:::

### ¿Qué modelos se pueden comparar? {#comparabilidad}

El AIC y el BIC solo comparan modelos que explican **exactamente los mismos datos**. Hay cuatro trampas frecuentes:

| Trampa | Por qué rompe la comparación | Qué hacer |
|---|---|---|
| Distinto $d$ o $D$ | la verosimilitud es de la serie diferenciada $w_t$, que cambia con $d$ y $D$; además cambia $n$ efectivo | elegir $d$ y $D$ con pruebas y gráficas; comparar AIC solo dentro del mismo $(d, D)$ |
| Distinta transformación (log contra niveles) | las densidades están en unidades distintas | corregir con el jacobiano (abajo) o comparar con métricas de pronóstico |
| Distinta configuración (`enforce_*`) | cambia cuántas observaciones se queman [[sarima-ap]] | ajustar todos con la misma configuración |
| Distinta muestra | más datos = más términos en $\ell$ | misma ventana de entrenamiento para todos |

:::demo El jacobiano: comparar un modelo en logaritmos con uno en niveles {#demo-jacobiano}
Sea $z_t = \ln y_t$ y un modelo para $z$ con log-verosimilitud $\ell_z$.

:::pasos
= f_Y(y) = f_Z(\ln y)\left|\frac{d\,\ln y}{dy}\right| = f_Z(\ln y)\cdot\frac{1}{y}
> Cambio de variable en una densidad: se multiplica por la derivada de la transformación.
= \ell_y = \sum_t\ln f_Y(y_t) = \ell_z - \sum_t\ln y_t
> En logaritmos, el factor $1/y_t$ se vuelve $-\ln y_t$ en cada observación.
= \AIC_y = \AIC_z + 2\sum_t\ln y_t
> El AIC del modelo en logaritmos, **expresado en la escala original**, ya es comparable con el de un modelo en niveles.
:::
:::

:::ejemplo Aerolínea en logaritmos contra aerolínea en niveles
Con el entrenamiento de AirPassengers (y las 119 observaciones que entran a la verosimilitud):

$$\AIC_{\text{niveles}} = 901.72, \qquad \AIC_{\log} = -441.25 \;\to\; -441.25 + 2(661.44) = 881.63$$

Comparados de forma correcta, el modelo en logaritmos **gana** por 20 unidades. Sin el jacobiano habrías comparado $-441$ contra $902$, una diferencia sin sentido.
:::

:::cuidado Un AIC «mejor» que no lo es
En la rejilla de abajo, el SARIMA(1,0,0)(0,1,1)₁₂ con constante tiene AIC = −442.85, **menor** que el −441.25 del modelo de aerolínea. Pero no usa la diferencia regular ($d = 0$): modela otra serie ($\Delta_{12}\ln y_t$ en lugar de $\Delta\Delta_{12}\ln y_t$) con otro número de observaciones. No es comparable. En la prueba de 1960, su MAPE es 4.39% contra 2.90% del modelo de aerolínea.
:::

### La rejilla de AirPassengers {#rejilla}

```python cache
import itertools
warnings.filterwarnings("ignore")
filas_rejilla = []
for p, q, P, Q in itertools.product(range(3), range(3), range(2), range(2)):
    r = SARIMAX(train, order=(p, 1, q), seasonal_order=(P, 1, Q, 12)).fit(disp=False)
    filas_rejilla.append({"modelo": f"({p},1,{q})({P},1,{Q})12", "k": len(r.params), "llf": round(r.llf, 2),
                          "AIC": round(r.aic, 2), "BIC": round(r.bic, 2)})
rejilla = pd.DataFrame(filas_rejilla).sort_values("AIC").reset_index(drop=True)
print(rejilla.head(8).to_string())
print("Mejor por BIC:", rejilla.loc[rejilla["BIC"].idxmin(), "modelo"])
```

:::guiado Leer la rejilla {#guia-rejilla}
| Modelo | $k$ | AIC | BIC | MAPE en 1960 |
|---|---|---|---|---|
| (0,1,1)(0,1,1) | 3 | −441.25 | −432.92 | 2.90% |
| (1,1,0)(0,1,1) | 3 | −440.83 | −432.50 | 3.18% |
| (2,1,1)(0,1,1) | 5 | −440.67 | −426.77 | 3.40% |
| (1,1,1)(0,1,1) | 4 | −439.52 | −428.40 | 2.71% |
| (2,1,2)(1,1,1) | 7 | −435.87 | −416.42 | 2.61% |
---
= \text{Aerolínea: menor AIC y menor BIC}
> Gana con 3 parámetros. Es el modelo que Box y Jenkins propusieron.
@ usa c3[1] c4[1]
= (1,1,0)(0,1,1):\; \Delta\AIC = 0.42
> Prácticamente empatado: cambiar el MA(1) regular por un AR(1) regular da casi lo mismo (con $\theta \approx -0.35$, el AR(∞) del MA(1) se parece a un AR(1) con $\phi \approx -0.35$ [[ar-infinito]]).
@ usa c3[2]
= (2,1,1)(0,1,1):\; \AIC \text{ casi igual, pero } \BIC \text{ 6 unidades peor}
> Dos parámetros más que el BIC no perdona.
@ usa c2[3] c3[3] c4[3]
= \text{El mejor MAPE en 1960 es el del modelo más grande (2.61\%)}
> ¿Contradicción? No: 12 datos de prueba son **poca evidencia** y una diferencia de 0.3 puntos de MAPE puede ser suerte. Por eso conviene validar con muchos orígenes [[rolling-origin]] y no con un solo año.
@ usa c5[1-5]
:::

:::interactivo w2-aic-grid | Explora los 36 modelos {#w-aic-grid}
Todos se ajustaron con statsmodels al construir la página. Ordena la tabla por cualquier columna y haz clic en un modelo para ver su pronóstico de 1960 y sus coeficientes.
@@@
- **Tabla**: AIC, BIC, p-value de Ljung–Box a 24 rezagos (con `model_df` = número de parámetros ARMA) y el MAPE de la prueba. El renglón verde es el que elegiste.
- **Gráfica**: los datos de 1957–1960 y el pronóstico del modelo elegido (en pasajeros) con su banda de 95%.
- **Lectura**: la diferencia de AIC y BIC contra el mejor, con la regla de Burnham y Anderson.
- Usa el filtro para ver solo los modelos con $\Delta\AIC < 2$: ¿cuál de ellos elegirías y por qué?
:::

:::resumen Lo que debes llevarte de AIC y BIC
- $\ell$ máxima nunca baja al agregar parámetros: elegir por $\ell$ sobreajusta.
- $\AIC = 2k - 2\ell$, $\BIC = k\ln n - 2\ell$; **menor es mejor**; $k$ incluye $\sigma^2$ y en `SARIMAX` $n$ es el efectivo.
- Un parámetro vale la pena si sube $\ell$ más de 1 (AIC) o más de $\ln(n)/2$ (BIC). El BIC elige modelos más sencillos.
- Solo compara modelos con los **mismos datos**: mismo $d$ y $D$, misma transformación (o con jacobiano), misma configuración y muestra.
- $\Delta\AIC < 2$ = empate: decide por sencillez, residuos y validación.
:::
