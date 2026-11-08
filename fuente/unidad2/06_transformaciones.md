## 🪄 Transformaciones: logaritmo, Box–Cox y diferencias {#transformaciones}
@mapa Estabilizar la varianza con log y Box–Cox, elegir λ, regresar a la escala original sin sesgo, diferencias regular y estacional y cómo reconocer la sobrediferenciación.

### ¿Por qué transformar? {#por-que-transformar}

La guía oficial lo dice así: *las transformaciones se usan para estabilizar varianza, linealizar relaciones, reducir asimetría, volver interpretables los cambios porcentuales y acercar la serie a los supuestos de modelado*. Los modelos ARMA suponen **varianza constante** y relaciones **lineales**; muchas series reales no cumplen ninguna de las dos cosas.

| Problema que ves | Transformación | Por qué funciona |
|---|---|---|
| La amplitud estacional crece con el nivel (patrón multiplicativo) | logaritmo | convierte productos en sumas [[u1:log]] |
| La varianza crece con el nivel, pero el log «se pasa» o «se queda corto» | Box–Cox con $\lambda$ estimado | elige la potencia que mejor estabiliza |
| Tendencia o raíz unitaria | diferencia regular $\Delta$ | quita el nivel cambiante [[u1:diferenciacion]] |
| Patrón estacional que se repite | diferencia estacional $\Delta_s$ | compara contra el mismo periodo del ciclo anterior |
| Interesan las tasas de crecimiento | diferencia del log | $\Delta \ln y_t \approx$ crecimiento porcentual |

:::cuidado El orden importa
Primero se **transforma** (log o Box–Cox) y después se **diferencia**. Si diferencias primero, aparecen valores negativos y ya no puedes sacar logaritmo; además la varianza que querías estabilizar ya quedó mezclada.
:::

### El logaritmo, visto de nuevo {#log2}

En la Unidad I usamos el logaritmo para convertir un modelo multiplicativo en aditivo. Aquí nos interesa otra de sus propiedades: **sus diferencias son tasas de crecimiento**.

:::demo La diferencia del logaritmo es (casi) el crecimiento porcentual {#demo-dlog}
Llamamos $r_t = \frac{y_t - y_{t-1}}{y_{t-1}}$ al crecimiento porcentual (en proporción).

:::pasos
= \Delta \ln y_t = \ln y_t - \ln y_{t-1} = \ln\frac{y_t}{y_{t-1}}
> Diferencia de logaritmos = logaritmo del cociente.
= \frac{y_t}{y_{t-1}} = \frac{y_{t-1} + (y_t - y_{t-1})}{y_{t-1}} = 1 + r_t
> El cociente es «uno más el crecimiento».
= \ln(1 + r_t) = r_t - \frac{r_t^2}{2} + \frac{r_t^3}{3} - \dots
> Serie de Taylor del logaritmo alrededor de 0.
= \Delta \ln y_t \approx r_t \quad \text{si } |r_t| \text{ es pequeño}
> Los términos $r_t^2/2, \dots$ son despreciables para crecimientos de pocos puntos porcentuales.
:::
:::

:::guiado Crecimientos con y sin logaritmo {#guia-dlog}
| $t$ | $y_t$ | crecimiento $r_t$ | $\Delta \ln y_t$ |
|---|---|---|---|
| 1 | 100 | — | — |
| 2 | 110 | 0.10 | 0.0953 |
| 3 | 99 | −0.10 | −0.1054 |
---
= r_2 = \frac{110 - 100}{100} = 0.10 \qquad \Delta\ln y_2 = \ln\frac{110}{100} = 0.0953
> Sube 10%; la diferencia del log da 9.53%, muy cerca.
@ usa c2[1-2]; da c3[2] c4[2]
= r_3 = \frac{99 - 110}{110} = -0.10 \qquad \Delta\ln y_3 = \ln\frac{99}{110} = -0.1054
> Baja 10% y la serie **no** regresa a 100: subir 10% y bajar 10% no se cancelan.
@ usa c2[2-3]; da c3[3] c4[3]
= \Delta\ln y_2 + \Delta\ln y_3 = 0.0953 - 0.1054 = -0.0101 = \ln\frac{99}{100}
> En cambio las diferencias del log **sí se suman** sin error: dan el cambio total. Por eso los crecimientos se trabajan en logaritmos.
@ usa c4[2-3]
:::

:::duda ¿Cómo interpreto un coeficiente cuando el modelo está en logaritmos?
Si $\ln y_t$ aumenta en $\beta$ unidades, $y_t$ se multiplica por $e^\beta$, es decir, cambia en $100\,(e^\beta - 1)\%$. Para $\beta$ pequeño, $e^\beta - 1 \approx \beta$. Ejemplo: en el caso de usuarios [[caso-usuarios]], un festivo tiene $\beta = -0.31$ en el log: $e^{-0.31} - 1 = -0.27$, es decir, **27% menos usuarios**. Recuerda que el logaritmo exige $y_t > 0$.
:::

### La familia Box–Cox {#boxcox}

El logaritmo es una elección «todo o nada». Box y Cox (1964) propusieron una familia de transformaciones con un parámetro $\lambda$ que va de «no hacer nada» a «logaritmo» y más allá.

:::definicion Transformación de Box–Cox
$$y_t^{(\lambda)} = \begin{cases} \dfrac{y_t^{\lambda} - 1}{\lambda} & \lambda \neq 0 \\[2mm] \ln y_t & \lambda = 0 \end{cases} \qquad (y_t > 0)$$

- $\tip{lambda-bc}{\lambda} = 1$: $y_t - 1$, la serie igual (solo se desplaza).
- $\lambda = 0.5$: $2(\sqrt{y_t} - 1)$, casi la raíz cuadrada (varianza proporcional al nivel, típica de conteos).
- $\lambda = 0$: el logaritmo (desviación estándar proporcional al nivel).
- $\lambda = -1$: $1 - 1/y_t$, el inverso (para efectos todavía más fuertes).
:::

:::demo Por qué λ = 0 corresponde al logaritmo {#demo-bc-limite}
:::pasos
= y^\lambda = e^{\lambda \ln y}
> Toda potencia se puede escribir con la exponencial.
= e^{\lambda\ln y} = 1 + \lambda\ln y + \frac{(\lambda\ln y)^2}{2} + \frac{(\lambda\ln y)^3}{6} + \dots
> Serie de Taylor de $e^x$ con $x = \lambda \ln y$.
= \frac{y^\lambda - 1}{\lambda} = \ln y + \frac{\lambda(\ln y)^2}{2} + \frac{\lambda^2(\ln y)^3}{6} + \dots
> Restamos 1 y dividimos entre $\lambda$: el 1 se cancela y cada término pierde una $\lambda$.
= \lim_{\lambda \to 0}\frac{y^\lambda - 1}{\lambda} = \ln y
> Cuando $\lambda \to 0$ todos los términos después del primero desaparecen. Por eso se resta 1 y se divide entre $\lambda$: la familia es **continua** en $\lambda$ y siempre creciente.
:::
:::

:::guiado Cómo «aprieta» Box–Cox los valores grandes {#guia-boxcox}
| $\lambda$ | $y = 100$ | $y = 400$ | distancia entre los dos |
|---|---|---|---|
| 1 | 99 | 399 | 300 |
| 0.5 | 18 | 38 | 20 |
| 0 | 4.6052 | 5.9915 | 1.3863 |
| −1 | 0.99 | 0.9975 | 0.0075 |
---
= \lambda = 1:\; 100 - 1 = 99,\quad 400 - 1 = 399
> Sin transformación: la distancia es 300.
@ da c2[1] c3[1] c4[1]
= \lambda = 0.5:\; \frac{\sqrt{100} - 1}{0.5} = \frac{9}{0.5} = 18,\quad \frac{\sqrt{400} - 1}{0.5} = \frac{19}{0.5} = 38
> La raíz cuadrada reduce la distancia a 20.
@ da c2[2] c3[2] c4[2]
= \lambda = 0:\; \ln 100 = 4.6052,\quad \ln 400 = 5.9915
> El logaritmo la deja en $\ln 4 = 1.386$: solo importa el **cociente** 400/100.
@ da c2[3] c3[3] c4[3]
= \lambda = -1:\; 1 - \frac{1}{100} = 0.99,\quad 1 - \frac{1}{400} = 0.9975
> El inverso casi junta los dos valores.
@ da c2[4] c3[4] c4[4]
= \text{menor } \lambda \;\Rightarrow\; \text{más se comprimen los valores grandes}
> Si en tu serie la variabilidad crece con el nivel, bajar $\lambda$ comprime más las partes altas (las más variables) y la varianza se vuelve más pareja.
@ usa c4[1-4]
:::

#### ¿Cómo se elige λ?

El método más usado es la **máxima verosimilitud** [[mv]]: se elige el $\lambda$ con el que la serie transformada parece más normal y homocedástica. `scipy.stats.boxcox` maximiza

$$\ell(\lambda) = (\lambda - 1)\sum_{t=1}^{n}\ln y_t - \frac{n}{2}\ln\hat\sigma^2(\lambda)$$

donde $\hat\sigma^2(\lambda)$ es la varianza de la serie transformada. El primer término es el **jacobiano** de la transformación: sin él, la verosimilitud premiaría cualquier $\lambda$ que achique los números. Es la misma razón por la que no se pueden comparar AIC de un modelo en logaritmos y otro en niveles [[comparabilidad]].

```python
from scipy.special import inv_boxcox

transformada, lam = stats.boxcox(serie)
print(f"λ de máxima verosimilitud: {lam:.4f}")
for l in [1, 0.5, lam, 0]:
    print(f"  log-verosimilitud con λ = {l:.3f}: {stats.boxcox_llf(l, serie.values):.2f}")
print("Regreso a la escala original:", np.round(inv_boxcox(transformada[:3], lam), 2), "← los primeros datos:", serie.values[:3])
```

El $\hat\lambda = 0.148$ queda muy cerca de 0, y la log-verosimilitud con $\lambda = 0$ es casi igual (−679.8 contra −679.5). Por eso con AirPassengers se usa el logaritmo, que además es más fácil de interpretar. Esa es la práctica habitual: si $\hat\lambda$ cae cerca de un valor «bonito» (1, 0.5, 0), se usa ese valor.

:::interactivo w2-boxcox | Elige λ y mira si la varianza se estabiliza {#w-boxcox}
Transforma AirPassengers con el $\lambda$ que quieras. La meta es que la variabilidad de cada año ya no dependa de su nivel.
@@@
- **Arriba**: la serie transformada. Con $\lambda = 1$ los «picos» de verano crecen año con año; con $\lambda$ cerca de 0 se vuelven parejos.
- **Abajo a la izquierda**: cada punto es un año: su media (eje x) contra su desviación estándar (eje y), en la escala transformada. La pendiente de la recta dice cuánto crece la variabilidad con el nivel: **queremos pendiente cero**.
- **Abajo a la derecha**: la log-verosimilitud $\ell(\lambda)$ de Box–Cox. El rombo marca su máximo ($\hat\lambda \approx 0.148$) y el punto rosa tu elección.
- **Vista extra**: la tabla por año con media y desviación estándar transformadas y el cociente entre la variabilidad del último año y la del primero (cerca de 1 = estable).
:::

:::interactivo py2-boxcox | Simulador: `scipy.stats.boxcox` {#sim-boxcox}
Elige si `scipy` estima $\lambda$ (`lmbda=None`) o si lo fijas tú. El código y su salida se actualizan.
@@@
- Con `lmbda=None` la función devuelve **dos** cosas: la serie transformada y el $\hat\lambda$. Con un `lmbda` fijo devuelve **solo** la serie (error frecuente al desempacar).
- `boxcox_llf(lmbda, datos)` calcula la log-verosimilitud de la fórmula de arriba para comparar valores de $\lambda$.
- `inv_boxcox(z, lmbda)` (de `scipy.special`) regresa a la escala original.
:::

### Regresar a la escala original {#regresar-escala}

Si el modelo se estimó en logaritmos, el pronóstico sale en logaritmos. La guía oficial pide *regresar a la escala original con exp y evaluar métricas en unidades interpretables*. Hay dos detalles importantes.

:::definicion Pronósticos e intervalos en la escala original
Si el pronóstico en logaritmos es $\hat m$ con intervalo $[a, b]$:

1. El **intervalo** se transforma directamente: $[e^a,\, e^b]$. Es válido porque la exponencial es creciente (conserva los cuantiles), pero queda **asimétrico**: más largo hacia arriba.
2. $e^{\hat m}$ es la **mediana** del pronóstico, no su media. La media es $e^{\hat m + \sigma^2_h/2}$, donde $\sigma_h^2$ es la varianza del error de pronóstico en logaritmos.
:::

:::demo La media de una lognormal {#demo-lognormal}
Sea $X = \ln Y \sim N(\mu, \sigma^2)$. Queremos $\E[Y] = \E[e^X]$.

:::pasos
= \E[e^{X}] = \int_{-\infty}^{\infty} e^{x}\,\frac{1}{\sqrt{2\pi}\sigma}e^{-\frac{(x-\mu)^2}{2\sigma^2}}\,dx
> Definición de esperanza con la densidad normal.
= x - \frac{(x - \mu)^2}{2\sigma^2} = -\frac{(x - \mu - \sigma^2)^2}{2\sigma^2} + \mu + \frac{\sigma^2}{2}
> Completamos el cuadrado en el exponente (desarrolla ambos lados para comprobarlo).
= \E[e^X] = e^{\mu + \sigma^2/2}\int \frac{1}{\sqrt{2\pi}\sigma}e^{-\frac{(x - \mu - \sigma^2)^2}{2\sigma^2}}dx = e^{\mu + \sigma^2/2}
> La integral que queda es la de una normal con media $\mu + \sigma^2$: vale 1.
= \E[Y] = e^{\mu}\cdot e^{\sigma^2/2} > e^{\mu} = \text{mediana}(Y)
> El factor $e^{\sigma^2/2} > 1$: la media siempre queda por encima de la mediana.
:::
:::

:::ejemplo ¿Cuánto importa la corrección?
Pronóstico en logaritmos $\hat m = 6$ con desviación estándar del error $\sigma_h = 0.06$:

$$e^{6} = 403.43 \;\text{(mediana)}, \qquad e^{6 + 0.06^2/2} = 403.43 \times e^{0.0018} = 404.16 \;\text{(media)}$$

Apenas 0.18%. Pero a horizontes largos $\sigma_h$ crece: con $\sigma_h = 0.3$ el factor es $e^{0.045} = 1.046$, un 4.6% de diferencia. Para minimizar el MAE conviene la mediana; para el RMSE, la media.
:::

```python
log_ap = np.log(serie)
modelo_log = SARIMAX(log_ap.iloc[:-12], order=(0, 1, 1), seasonal_order=(0, 1, 1, 12)).fit(disp=False)
fc = modelo_log.get_forecast(12)
mediana = np.exp(fc.predicted_mean)
media = np.exp(fc.predicted_mean + fc.se_mean ** 2 / 2)          # corrección lognormal
intervalo = np.exp(fc.conf_int())
tabla_escala = pd.DataFrame({"mediana": mediana, "media": media, "inf 95%": intervalo.iloc[:, 0], "sup 95%": intervalo.iloc[:, 1], "real": serie.iloc[-12:]})
print(tabla_escala.round(1).head(6))
```

### Diferencias regular y estacional {#diferenciar2}

:::definicion Diferencias
$$\Delta y_t = (1 - L)\,y_t = y_t - y_{t-1}, \qquad \Delta_s y_t = (1 - L^s)\,y_t = y_t - y_{t-s}$$

Se aplican $\tip{d-dif}{d}$ diferencias regulares y $\tip{D-est}{D}$ estacionales: $w_t = (1 - L)^d(1 - L^s)^D\,y_t$. En la práctica casi siempre $d \le 2$ y $D \le 1$.
:::

Con AirPassengers, las pruebas de la Unidad I [[u1:conjunta]] en cada etapa cuentan la historia completa:

```python
from statsmodels.tsa.stattools import adfuller, kpss
warnings.filterwarnings("ignore")             # KPSS avisa cuando su p-value se sale de la tabla
etapas = {
    "original": serie, "log": log_ap, "Δ log": log_ap.diff(), "Δ12 log": log_ap.diff(12),
    "Δ Δ12 log": log_ap.diff(12).diff(), "Δ² log": log_ap.diff().diff(),
}
filas = []
for nombre, x in etapas.items():
    x = x.dropna()
    filas.append({"serie": nombre, "n": len(x), "ADF p": round(adfuller(x, autolag="AIC")[1], 4),
                  "KPSS p": round(kpss(x, regression="c", nlags="auto")[1], 3), "varianza": round(x.var(), 5),
                  "ρ̂(1)": round(acf(x, nlags=1)[1], 3)})
print(pd.DataFrame(filas).to_string(index=False))
```

:::guiado Leer la tabla de etapas {#guia-etapas}
| Serie | Diagnóstico |
|---|---|
| original | ADF p = 0.99, KPSS p = 0.01: no estacionaria |
| log | ADF p = 0.42: el log estabiliza la varianza pero no quita la tendencia |
| Δ log | ADF p = 0.07, pero queda la estacionalidad |
| Δ12 log | ADF p = 0.07 y ρ̂(1) = 0.71: todavía deambula |
| Δ Δ12 log | ADF p = 0.0002 y KPSS p = 0.10: estacionaria ✓ |
| Δ² log | ADF p ≈ 0, pero varianza mayor que la de Δ log: sobrediferenciada |
---
= \text{original y log: ADF no rechaza y KPSS rechaza}
> Las dos pruebas coinciden: hay raíz unitaria. El log no basta [[u1:conjunta]].
@ usa c2[1-2]
= \Delta\log \text{ y } \Delta_{12}\log: \text{ ADF casi rechaza (p} \approx 0.07)
> Una sola diferencia, de cualquier tipo, no alcanza: la regular deja el patrón anual; la estacional deja una serie que deambula ($\hat\rho(1) = 0.71$).
@ usa c2[3-4]
= \Delta\Delta_{12}\log: \text{ ADF p} = 0.0002, \text{ KPSS p} = 0.10
> Con las dos diferencias ($d = 1$, $D = 1$) ambas pruebas dicen «estacionaria». Su varianza (0.0021) es la menor de la tabla.
@ usa c2[5]
= \Delta^2\log: \text{ varianza } 0.0182 > 0.0114 \text{ de } \Delta\log
> Diferenciar dos veces de forma regular **aumenta** la varianza y no quita la estacionalidad: es el camino equivocado.
@ usa c2[6]
:::

### Sobrediferenciación {#sobrediferenciar}

Diferenciar de más también es un error, aunque menos visible: la serie queda estacionaria, pero se introduce una estructura artificial.

:::demo Diferenciar ruido blanco crea un MA(1) con θ = −1 {#demo-sobredif}
Sea $y_t = \varepsilon_t$ ruido blanco (ya era estacionario) y lo diferenciamos sin necesidad.

:::pasos
= w_t = \Delta y_t = \varepsilon_t - \varepsilon_{t-1}
> Es un MA(1) con $\theta = -1$.
= \Var(w_t) = \sigma^2 + \sigma^2 = 2\sigma^2
> La varianza se **duplica** [[demo-ma-momentos]].
= \rho_w(1) = \frac{\theta}{1 + \theta^2} = \frac{-1}{2} = -0.5
> Aparece una autocorrelación negativa de $-0.5$ que antes no existía.
= \theta(z) = 1 - z = 0 \;\Rightarrow\; z = 1
> La raíz MA queda **sobre** el círculo unitario: el modelo no es invertible [[invertibilidad]].
= \Delta^2 y_t = \varepsilon_t - 2\varepsilon_{t-1} + \varepsilon_{t-2} \;\Rightarrow\; \Var = (1 + 4 + 1)\,\sigma^2 = 6\sigma^2
> Con una segunda diferencia innecesaria la varianza se multiplica por 6.
:::
:::

:::definicion Señales de sobrediferenciación
1. $\hat\rho(1)$ de la serie diferenciada cerca de $-0.5$ o más negativo.
2. La varianza **sube** al diferenciar (en una serie que lo necesita, baja).
3. Al estimar un MA, $\hat\theta$ sale muy cerca de $-1$ (raíz MA casi unitaria).
4. ADF rechaza con fuerza **y** KPSS no rechaza ya antes de la última diferencia.

Remedio: quitar la diferencia de más, o (si hay tendencia determinística) usar una tendencia en lugar de diferenciar [[u1:tendencias]]. En la Unidad I viste que diferenciar una tendencia determinística también crea esta autocorrelación artificial [[u1:sobre-diferenciar]].
:::

:::interactivo w2-sobrediferenciar | ¿Cuántas diferencias necesita? {#w-sobrediferenciar}
Elige un proceso y el número de diferencias $d$. Compara la varianza y la ACF para $d = 0, 1, 2$.
@@@
- **Arriba**: la serie con las $d$ diferencias elegidas.
- **Abajo a la izquierda**: la varianza para $d = 0, 1, 2$. Una regla práctica clásica: el $d$ con **menor varianza** suele ser el adecuado.
- **Abajo a la derecha**: la ACF con el $d$ elegido. Con sobrediferenciación verás $\rho(1)$ cerca de $-0.5$.
- **Vista extra**: la tabla con varianza, $\hat\rho(1)$ y el p-value de la ADF para cada $d$, con el diagnóstico.
:::

:::resumen Lo que debes llevarte de las transformaciones
- Transforma **antes** de diferenciar. El log estabiliza la varianza cuando la variabilidad es proporcional al nivel; $\Delta\ln y_t \approx$ crecimiento porcentual.
- Box–Cox: $\frac{y^\lambda - 1}{\lambda}$ (log si $\lambda = 0$); $\hat\lambda$ por máxima verosimilitud (`stats.boxcox`). AirPassengers: $\hat\lambda = 0.148 \approx 0$.
- Al regresar con `exp`: el intervalo se transforma directo (queda asimétrico) y $e^{\hat m}$ es la mediana; la media lleva el factor $e^{\sigma_h^2/2}$.
- AirPassengers necesita log + $\Delta$ + $\Delta_{12}$. Diferenciar de más duplica la varianza y crea $\rho(1) \approx -0.5$ y $\theta \approx -1$.
:::
