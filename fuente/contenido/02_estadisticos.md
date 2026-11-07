## 📏 Características estadísticas básicas {#estadisticos}
@mapa Rezago, media, varianza, autocovarianza y autocorrelación: definiciones, propiedades y cálculo a mano.

En [[esperanza]] y [[covarianza]] definimos media, varianza y covarianza para variables aleatorias sueltas. Ahora las aplicamos a una serie, donde **cada instante es una variable aleatoria** [[proceso]] y lo interesante es cómo se relacionan instantes distintos.

### El rezago {#rezago}

:::definicion Rezago (lag)
El **rezago** $\tip{k}{k}$ es la distancia, en periodos, entre dos observaciones. La serie rezagada $k$ periodos es $y_{t-k}$: la misma serie, **desplazada** $k$ lugares hacia el futuro.
:::

:::ejemplo Desplazar una serie
Con $y = (2, 4, 6, 5, 3, 4)$:

| $t$ | 1 | 2 | 3 | 4 | 5 | 6 |
|---|---|---|---|---|---|---|
| $y_t$ | 2 | 4 | 6 | 5 | 3 | 4 |
| $y_{t-1}$ | — | 2 | 4 | 6 | 5 | 3 |
| $y_{t-2}$ | — | — | 2 | 4 | 6 | 5 |

Con rezago $k$ solo hay $n - k$ parejas completas $(y_t, y_{t-k})$: aquí 5 parejas para $k = 1$ y 4 para $k = 2$. Cuanto más grande es $k$, **menos información** tenemos para medir la relación.
:::

```python
y = pd.Series([2, 4, 6, 5, 3, 4], index=range(1, 7), name="y_t")
print(pd.DataFrame({"y_t": y, "y_(t-1)": y.shift(1), "y_(t-2)": y.shift(2)}))
```

### La media {#media}

:::definicion Media del proceso y media muestral
$$\mu_t = \E[y_t] \qquad\qquad \bar{y} = \frac{1}{n}\sum_{t=1}^{n} y_t$$

- $\mu_t$ es **teórica**: el promedio de $y_t$ sobre todas las realizaciones posibles [[proceso]]. En general **puede cambiar con $t$** (por eso lleva subíndice).
- $\bar y$ se calcula con **tu** serie: promedia a lo largo del **tiempo**.
- Que $\bar y$ sirva para estimar $\mu$ exige que $\mu_t$ **no cambie con $t$**. Esa es la primera condición de estacionariedad [[debil]].
:::

:::demo Si la media es constante, ȳ es insesgada {#media-insesgada}
Supón que $\E[y_t] = \mu$ para todo $t$.

:::pasos
= \E[\bar y] = \E\!\left[\frac1n\sum_{t=1}^{n} y_t\right] = \frac1n\,\E\!\left[\sum_{t=1}^{n} y_t\right]
> La constante $1/n$ sale de la esperanza [[linealidad]].
= = \frac1n\sum_{t=1}^{n}\E[y_t]
> La esperanza de una suma es la suma de las esperanzas [[linealidad]].
= = \frac1n\sum_{t=1}^{n}\mu = \frac1n\,(n\,\mu) = \mu
> Todas las esperanzas valen lo mismo; sumamos $\mu$ $n$ veces [[prop-suma]].
:::

**Insesgada** significa que, en promedio sobre muchas realizaciones, $\bar y$ acierta. Si en cambio $\mu_t$ crece con $t$ (tendencia), $\bar y$ sería el promedio de medias distintas y no representaría a ninguna.
:::

### La varianza {#varianza}

:::definicion Varianza del proceso y varianza muestral
$$\sigma^2_t = \Var(y_t) = \E\big[(y_t - \mu_t)^2\big] \qquad\qquad \hat\gamma(0) = \frac1n\sum_{t=1}^{n}(y_t - \bar y)^2$$

Mide la **dispersión** o **volatilidad**. En series de tiempo se estima dividiendo entre $n$ (no entre $n - 1$) para que sea coherente con la autocovarianza; por eso se escribe $\hat\gamma(0)$: es la autocovarianza en el rezago 0 [[autocov]].
:::

:::ejemplo Media y varianza de la serie diminuta
Con $y = (2, 4, 6, 5, 3, 4)$, $n = 6$:

:::pasos
= \bar y = \frac{2 + 4 + 6 + 5 + 3 + 4}{6} = \frac{24}{6} = 4
> Suma de los valores entre $n$.
= y_t - \bar y = (-2,\; 0,\; 2,\; 1,\; -1,\; 0)
> Desviaciones respecto a la media. Comprueba que suman 0 [[suma-desv]].
= \hat\gamma(0) = \frac{(-2)^2 + 0^2 + 2^2 + 1^2 + (-1)^2 + 0^2}{6} = \frac{4 + 0 + 4 + 1 + 1 + 0}{6} = \frac{10}{6} = 1.6667
> Promedio de las desviaciones al cuadrado, dividiendo entre $n = 6$.
:::
:::

### La autocovarianza {#autocov}

:::definicion Autocovarianza
$$\gamma(t, k) = \Cov(y_t,\; y_{t-k}) = \E\big[(y_t - \mu_t)(y_{t-k} - \mu_{t-k})\big]$$

Es la covarianza [[covarianza]] de la serie **consigo misma** desplazada $k$ periodos («auto» = consigo misma). Responde: *cuando la serie está arriba de su media hoy, ¿suele estar arriba también hace $k$ periodos?* Si el proceso es estacionario depende **solo de $k$** y se escribe $\gamma(k)$.
:::

:::demo Propiedades de la autocovarianza {#autocov-prop}
**(a) En el rezago 0 es la varianza:**

:::pasos
= \gamma(0) = \Cov(y_t, y_{t-0}) = \Cov(y_t, y_t) = \Var(y_t)
> Con $k = 0$ comparamos cada valor consigo mismo; regla 1 de [[cov-prop]].
:::

**(b) Es simétrica:** $\gamma(k) = \gamma(-k)$.

:::pasos
= \gamma(-k) = \Cov(y_t,\; y_{t+k})
> Definición con $-k$: ahora el segundo valor está $k$ periodos **adelante**.
= = \Cov(y_{s-k},\; y_s) \quad\text{con } s = t + k
> Renombramos el tiempo: llamamos $s$ al instante $t + k$.
= = \Cov(y_s,\; y_{s-k}) = \gamma(k)
> La covarianza no depende del orden (regla 2 de [[cov-prop]]) y, si el proceso es estacionario, solo importa la distancia $k$.
:::

Por eso el correlograma solo se dibuja para $k \ge 0$: el lado negativo es un espejo.

**(c) Está acotada por la varianza:** $|\gamma(k)| \le \gamma(0)$, consecuencia directa de que la correlación vive entre −1 y 1 [[corr-acotada]].
:::

:::definicion Autocovarianza muestral (la fórmula que usa statsmodels)
$$\hat{\gamma}(\tip{k}{k}) = \frac{1}{\tip{n}{n}}\sum_{t=k+1}^{n} (y_t - \bar{y})(y_{t-k} - \bar{y})$$

Parte por parte:

- $(y_t - \bar y)$: desviación del valor **actual**.
- $(y_{t-k} - \bar y)$: desviación del valor de **hace $k$ periodos**.
- El producto es positivo si ambos están del mismo lado de la media y negativo si están en lados opuestos.
- La suma empieza en $t = k + 1$ porque para $t \le k$ no existe $y_{t-k}$: hay $n - k$ productos.
- Se divide entre $n$ (no entre $n - k$).
:::

:::nota ¿Por qué dividir entre n y no entre n − k?
Habría más productos «promediados» correctamente con $n - k$, pero dividir entre $n$ tiene ventajas: (1) garantiza que la ACF estimada sea una autocorrelación **válida** (matemáticamente, que la matriz de autocovarianzas sea positiva semidefinida); (2) en rezagos grandes, donde hay pocos productos, **encoge** la estimación hacia 0 y reduce su error; (3) es lo que usan por defecto `statsmodels` (`acf(..., adjusted=False)`) y la mayoría de los libros. Para $n$ grande y $k$ pequeño la diferencia es mínima.
:::

### La autocorrelación {#autocorr}

:::definicion Función de autocorrelación (ACF)
$$\rho(k) = \frac{\gamma(k)}{\gamma(0)} \qquad\qquad \hat\rho(k) = \frac{\hat\gamma(k)}{\hat\gamma(0)}$$

Es la autocovarianza **normalizada**: dividir entre la varianza le quita las unidades. Por eso:

- $\rho(0) = \gamma(0)/\gamma(0) = 1$ siempre.
- $-1 \le \rho(k) \le 1$ [[corr-acotada]].
- Permite **comparar** rezagos y series distintas (una autocovarianza de 50 no dice nada si no sabes la varianza).
- Si el proceso es estacionario, $\gamma(0) = \Var(y_t) = \Var(y_{t-k})$, así que $\rho(k)$ es exactamente $\Corr(y_t, y_{t-k})$.
:::

:::ejemplo ACF a mano con la serie diminuta
Desviaciones (de [[varianza]]): $d_t = y_t - \bar y = (-2,\, 0,\, 2,\, 1,\, -1,\, 0)$ y $\hat\gamma(0) = 10/6$.

**Rezago 1** ($t = 2, \dots, 6$, cinco productos $d_t\,d_{t-1}$):

| $t$ | $d_t$ | $d_{t-1}$ | $d_t\,d_{t-1}$ |
|---|---|---|---|
| 2 | 0 | −2 | 0 |
| 3 | 2 | 0 | 0 |
| 4 | 1 | 2 | 2 |
| 5 | −1 | 1 | −1 |
| 6 | 0 | −1 | 0 |
| **Suma** | | | **1** |

:::pasos
= \hat\gamma(1) = \frac{1}{6}\sum_{t=2}^{6} d_t\,d_{t-1} = \frac{1}{6}
> Sumamos los cinco productos y dividimos entre $n = 6$.
= \hat\rho(1) = \frac{\hat\gamma(1)}{\hat\gamma(0)} = \frac{1/6}{10/6} = \frac{1}{10} = 0.1
> Los $1/6$ se cancelan: basta dividir las **sumas** (1 entre 10).
:::

**Rezago 2** (cuatro productos $d_t\,d_{t-2}$, $t = 3, \dots, 6$): $(2)(-2) + (1)(0) + (-1)(2) + (0)(1) = -4 + 0 - 2 + 0 = -6$.

:::pasos
= \hat\gamma(2) = \frac{-6}{6} = -1, \qquad \hat\rho(2) = \frac{-6}{10} = -0.6
> Correlación negativa fuerte: los valores separados 2 periodos tienden a estar en lados opuestos de la media.
:::

**Rezago 3** (tres productos, $t = 4, 5, 6$): $(1)(-2) + (-1)(0) + (0)(2) = -2$, así que $\hat\rho(3) = -2/10 = -0.2$.
:::

```python
from statsmodels.tsa.stattools import acf

y = np.array([2, 4, 6, 5, 3, 4], dtype=float)
d = y - y.mean()
gamma = [np.sum(d[k:] * d[:len(y) - k]) / len(y) for k in range(4)]   # divide entre n
print("gamma_hat(k):", np.round(gamma, 4))
print("rho_hat(k) a mano:", np.round(np.array(gamma) / gamma[0], 4))
print("statsmodels acf:  ", np.round(acf(y, nlags=3), 4))
```

:::interactivo calculadora | Calculadora de autocorrelación paso a paso
Escribe tus propios números (separados por comas) y elige el rezago $k$. La tabla muestra cada desviación, cada producto y la suma, exactamente como en el ejemplo a mano. Úsala para comprobar tus ejercicios.
@@@
- **Tarjetas**: $n$, la media, $\hat\gamma(0)$ y el $\hat\rho(k)$ del rezago elegido.
- **Tabla**: un renglón por periodo con $y_t$, su desviación $d_t$, la desviación $k$ periodos antes y su **producto** (amarillo). Los primeros $k$ renglones no tienen pareja. La última fila es la suma de productos.
- **Fórmulas**: cómo esa suma se convierte en $\hat\gamma(k)$ (÷ n) y en $\hat\rho(k)$ (÷ $\hat\gamma(0)$).
- **Gráfica**: la ACF de tus datos. Con pocos datos la banda $\pm 1.96/\sqrt n$ es muy ancha.
:::

:::duda ¿Cuándo una autocorrelación es «grande»?
No hay un número fijo: depende de $n$. Se compara con la banda $\pm 1.96/\sqrt n$ [[bartlett]]. Con $n = 25$, un $\hat\rho(1) = 0.3$ **no** es significativo (banda ±0.39); con $n = 400$, un $\hat\rho(1) = 0.12$ **sí** lo es (banda ±0.098).
:::

### Autocorrelación positiva, nula y negativa {#signos}

| Signo de $\rho(1)$ | Comportamiento | Lag plot [[lagplot]] | Ejemplo |
|---|---|---|---|
| **Positivo** (cerca de 1) | la serie es «perezosa»: valores altos siguen a altos | nube creciente | temperatura diaria, AR(1) con $\phi > 0$ |
| **Cercano a 0** | sin memoria lineal | nube redonda | ruido blanco [[ruido-blanco]] |
| **Negativo** | la serie alterna: alto, bajo, alto… | nube decreciente | AR(1) con $\phi < 0$, serie sobre-diferenciada [[tendencias]] |

:::resumen Lo esencial de la sección 4
- Rezago $k$: distancia en periodos; con rezago $k$ hay $n - k$ parejas.
- $\gamma(k) = \Cov(y_t, y_{t-k})$; $\gamma(0)$ es la varianza; $\gamma(k) = \gamma(-k)$.
- $\hat\gamma(k) = \frac1n\sum_{t=k+1}^n (y_t - \bar y)(y_{t-k} - \bar y)$ (se divide entre $n$).
- $\rho(k) = \gamma(k)/\gamma(0)$, sin unidades y entre −1 y 1.
:::
