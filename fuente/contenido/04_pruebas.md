## 🧪 Pruebas de estacionariedad: ADF y KPSS {#pruebas}
@mapa Pruebas de hipótesis desde cero, Dickey–Fuller deducida y calculada a mano, ADF, KPSS y su lectura conjunta.

### Pruebas de hipótesis desde cero {#hipotesis}

:::intuicion La analogía del juicio
En un juicio se presume la **inocencia** hasta que las pruebas demuestren lo contrario «más allá de una duda razonable». Una prueba estadística funciona igual:

- $H_0$ (**hipótesis nula**) es la «presunción de inocencia»: lo que se supone cierto mientras no haya evidencia fuerte en contra.
- $H_1$ (**alternativa**) es lo que concluimos si la evidencia es abrumadora.
- Si las pruebas no alcanzan, el veredicto es «no culpable», **no** «inocente demostrado». Igual en estadística: **no rechazar $H_0$ no es lo mismo que aceptarla**.
:::

:::definicion Estadístico, valor crítico y p-value
- **Estadístico de prueba**: un número calculado con los datos que mide qué tan lejos están de lo que predice $H_0$.
- **Nivel de significancia** $\tip{alfa-sig}{\alpha}$: el riesgo que aceptas de rechazar $H_0$ siendo verdadera (normalmente 5%).
- **p-value**: la probabilidad, **suponiendo que $H_0$ es cierta**, de obtener un resultado al menos tan extremo como el observado.

$$\text{Regla:}\qquad \text{p-value} < \tip{alfa-sig}{\alpha} \;\Longrightarrow\; \text{rechazar } H_0$$

Un p-value pequeño dice: «si $H_0$ fuera cierta, lo que vi sería muy raro; mejor dudo de $H_0$».
:::

:::ejemplo Un p-value calculado a mano: ¿la moneda está cargada?
Lanzas una moneda 10 veces y salen 9 águilas. $H_0$: la moneda es justa ($p = 0.5$); $H_1$: favorece las águilas.

:::pasos
= P(X = 9) = \binom{10}{9}(0.5)^{10} = \frac{10}{1024}, \qquad P(X = 10) = \binom{10}{10}(0.5)^{10} = \frac{1}{1024}
> Probabilidades binomiales bajo $H_0$ de los resultados «al menos tan extremos» como 9 águilas.
= \text{p-value} = P(X \ge 9) = \frac{10 + 1}{1024} = \frac{11}{1024} = 0.0107
> Sumamos los dos casos.
= 0.0107 < 0.05 \;\Longrightarrow\; \text{se rechaza } H_0
> Con una moneda justa, 9 o más águilas pasaría solo 1 de cada 93 veces: hay evidencia de que está cargada.
:::
:::

```python
from scipy.stats import binom
print("p-value = P(X ≥ 9) =", round(binom.sf(8, 10, 0.5), 4))    # sf(8) = P(X > 8)
```

:::duda ¿Por qué se usa 0.05?
Es una **convención** (propuesta por Fisher), no una ley: significa aceptar un 5% de riesgo de rechazar $H_0$ siendo verdadera. Si equivocarse es muy costoso se usa 0.01; en análisis exploratorios a veces 0.10. Lo importante es fijar $\alpha$ **antes** de ver los resultados y reportar el p-value completo, no solo «significativo / no significativo».
:::

| | $H_0$ es verdadera | $H_0$ es falsa |
|---|---|---|
| **Rechazo $H_0$** | ❌ Error tipo I (probabilidad $\alpha$) | ✅ Decisión correcta (**potencia**) |
| **No rechazo $H_0$** | ✅ Decisión correcta | ❌ Error tipo II |

### La idea de Dickey–Fuller {#df}

Queremos saber si un AR(1) tiene raíz unitaria [[raiz-unitaria]], es decir, probar $H_0: \phi = 1$.

:::demo De la AR(1) a la regresión de Dickey–Fuller {#df-deduccion}
:::pasos
= y_t = \phi\,y_{t-1} + \varepsilon_t
> AR(1) sin constante.
= y_t - y_{t-1} = \phi\,y_{t-1} - y_{t-1} + \varepsilon_t
> Restamos $y_{t-1}$ en ambos lados.
= \Delta y_t = (\phi - 1)\,y_{t-1} + \varepsilon_t
> El lado izquierdo es la diferencia [[diferenciacion]]; factorizamos $y_{t-1}$.
= \Delta y_t = \delta\,y_{t-1} + \varepsilon_t, \qquad \delta = \phi - 1
> Renombramos el coeficiente.
= H_0:\ \phi = 1 \;\Longleftrightarrow\; \delta = 0 \qquad\quad H_1:\ |\phi| < 1 \;\Longleftrightarrow\; \delta < 0
> Probar la raíz unitaria es probar si $\delta$ es cero. La alternativa es **de una cola** (estacionario).
:::
:::

:::intuicion ¿La serie regresa a su media?
Si $\delta < 0$ y ayer la serie estaba **arriba** ($y_{t-1} > 0$), entonces $\delta\,y_{t-1} < 0$: hoy tiende a **bajar**. Si ayer estaba abajo, tiende a subir. Un $\delta$ negativo es una fuerza que **jala hacia la media**. Con $\delta = 0$ esa fuerza no existe: el cambio de hoy no depende de dónde esté la serie (paseo aleatorio).
:::

:::demo El estimador de mínimos cuadrados de δ {#df-mco}
Buscamos el $\delta$ que hace más pequeña la suma de cuadrados de los errores $\tip{SC}{\operatorname{SCR}}(\delta) = \sum_t (\Delta y_t - \delta\,y_{t-1})^2$.

:::pasos
= \frac{d\,\operatorname{SCR}}{d\delta} = \sum_t 2\,(\Delta y_t - \delta\,y_{t-1})\,(-y_{t-1})
> Regla de la cadena: la derivada de $u^2$ es $2u\,u'$ y la derivada de $(\Delta y_t - \delta y_{t-1})$ respecto a $\delta$ es $-y_{t-1}$.
= -2\sum_t y_{t-1}\Delta y_t + 2\delta\sum_t y_{t-1}^2 = 0
> Igualamos a cero (condición de mínimo) y separamos la suma [[prop-suma]].
= \hat\delta = \frac{\sum_t y_{t-1}\,\Delta y_t}{\sum_t y_{t-1}^2}
> Despejamos $\delta$.
= s^2 = \frac{\sum_t \hat{\varepsilon}_t^2}{m - 1}, \qquad \tip{se}{\operatorname{EE}}(\hat\delta) = \sqrt{\frac{s^2}{\sum_t y_{t-1}^2}}
> $\hat\varepsilon_t = \Delta y_t - \hat\delta y_{t-1}$ son los residuos y $m$ el número de observaciones de la regresión (se resta 1 por el parámetro estimado).
= \tau = \frac{\hat\delta}{\tip{se}{\operatorname{EE}}(\hat\delta)}
> **Estadístico de Dickey–Fuller**: tiene la forma de una $t$, pero no su distribución.
:::
:::

:::cuidado τ no sigue la distribución t de Student
Bajo $H_0$ el regresor $y_{t-1}$ es un **paseo aleatorio**, cuya varianza crece con $t$ [[paseo-demo]]. Los teoremas que garantizan que un estadístico $t$ sea aproximadamente normal **no aplican**. Dickey y Fuller calcularon por simulación la distribución correcta: está **corrida a la izquierda**. Por eso sus valores críticos son más negativos que los de la normal ($-1.645$ al 5% en una cola):

| Especificación | 1% | 5% | 10% |
|---|---|---|---|
| sin constante (`"n"`) | −2.57 | **−1.94** | −1.62 |
| con constante (`"c"`) | −3.43 | **−2.86** | −2.57 |
| constante y tendencia (`"ct"`) | −3.96 | **−3.41** | −3.13 |

(Valores asintóticos de MacKinnon; con muestras pequeñas son un poco más negativos, y `statsmodels` los ajusta según $n$.)
:::

:::interactivo distdf | ¿Por qué hacen falta tablas especiales? {#distdf}
Simulamos muchos paseos aleatorios (donde $H_0$ es cierta) y calculamos $\tau$ en cada uno. El histograma rosa es la distribución real de $\tau$; la curva es la normal. Si usaras $-1.645$, rechazarías $H_0$ verdadera mucho más del 5% de las veces.
@@@
- **Histograma rosa**: los 2000 valores de $\tau$ obtenidos en paseos aleatorios, donde $H_0$ es cierta.
- **Curva lila**: la normal estándar, que sería la distribución si $\tau$ fuera una $t$ común.
- **Líneas discontinuas**: el crítico de la normal ($-1.645$) y el de Dickey–Fuller. El área del histograma a la izquierda de cada línea es la proporción de rechazos.
:::

### Dickey–Fuller calculada a mano {#df-mano}

:::ejemplo Prueba DF (sin constante) con 10 datos
$$y = (3,\; 1,\; 2,\; -1,\; 0,\; -2,\; 1,\; 0,\; 2,\; 1)$$

**Paso 1 · Armar la tabla.** Para $t = 2, \dots, 10$ calculamos $\Delta y_t = y_t - y_{t-1}$:

| $t$ | $y_{t-1}$ | $\Delta y_t$ | $y_{t-1}\,\Delta y_t$ | $y_{t-1}^2$ | $\hat\varepsilon_t = \Delta y_t + 0.875\,y_{t-1}$ | $\hat\varepsilon_t^2$ |
|---|---|---|---|---|---|---|
| 2 | 3 | −2 | −6 | 9 | 0.625 | 0.390625 |
| 3 | 1 | 1 | 1 | 1 | 1.875 | 3.515625 |
| 4 | 2 | −3 | −6 | 4 | −1.25 | 1.5625 |
| 5 | −1 | 1 | −1 | 1 | 0.125 | 0.015625 |
| 6 | 0 | −2 | 0 | 0 | −2 | 4 |
| 7 | −2 | 3 | −6 | 4 | 1.25 | 1.5625 |
| 8 | 1 | −1 | −1 | 1 | −0.125 | 0.015625 |
| 9 | 0 | 2 | 0 | 0 | 2 | 4 |
| 10 | 2 | −1 | −2 | 4 | 0.75 | 0.5625 |
| **Suma** | | | **−21** | **24** | | **15.625** |

**Paso 2 · Estimar y probar.**

:::pasos
= \hat\delta = \frac{\sum y_{t-1}\Delta y_t}{\sum y_{t-1}^2} = \frac{-21}{24} = -0.875
> Fórmula de mínimos cuadrados [[df-mco]]. Equivale a $\hat\phi = 1 + \hat\delta = 0.125$.
= s^2 = \frac{15.625}{9 - 1} = 1.953125
> Hay $m = 9$ observaciones y un parámetro estimado.
= \tip{se}{\operatorname{EE}}(\hat\delta) = \sqrt{\frac{1.953125}{24}} = \sqrt{0.081380} = 0.28527
> Error estándar del coeficiente.
= \tau = \frac{-0.875}{0.28527} = -3.067
> Estadístico de Dickey–Fuller.
= \tau = -3.067 < -1.97 = \text{valor crítico al 5\% (sin constante, } m = 9)
> Más negativo que el valor crítico ⇒ **se rechaza $H_0$**: no hay raíz unitaria; la serie regresa rápido a 0.
:::
:::

```python
from statsmodels.tsa.stattools import adfuller

y = np.array([3, 1, 2, -1, 0, -2, 1, 0, 2, 1], dtype=float)
dy, ylag = np.diff(y), y[:-1]
delta = np.sum(ylag * dy) / np.sum(ylag**2)
resid = dy - delta * ylag
s2 = np.sum(resid**2) / (len(dy) - 1)
ee = np.sqrt(s2 / np.sum(ylag**2))
print(f"delta = {delta:.4f}   EE = {ee:.5f}   tau = {delta / ee:.4f}")

estad, pval, rezagos, nobs, criticos = adfuller(y, maxlag=0, regression="n", autolag=None)   # sin autolag: 5 resultados
print(f"statsmodels: tau = {estad:.4f}   p-value = {pval:.4f}   críticos = { {k: round(v, 3) for k, v in criticos.items()} }")
```

### ADF: la versión «aumentada» {#adf}

La DF supone que $\varepsilon_t$ es ruido blanco. Si la serie tiene más memoria (por ejemplo, es un AR(2)), los errores quedan **autocorrelacionados** y la prueba se equivoca. La solución de Said y Dickey: **aumentar** la regresión con diferencias rezagadas.

:::demo Un AR(2) también se escribe como regresión de Dickey–Fuller {#adf-ar2}
:::pasos
= y_t = \phi_1 y_{t-1} + \phi_2 y_{t-2} + \varepsilon_t
> AR(2): el valor de hoy depende de los dos anteriores.
= y_t = \phi_1 y_{t-1} + \phi_2 y_{t-1} - \phi_2 y_{t-1} + \phi_2 y_{t-2} + \varepsilon_t
> Sumamos y restamos $\phi_2 y_{t-1}$ (no cambia nada, pero permite reagrupar).
= y_t = (\phi_1 + \phi_2)\,y_{t-1} - \phi_2\,(y_{t-1} - y_{t-2}) + \varepsilon_t
> Agrupamos: los dos primeros términos y los dos siguientes.
= \Delta y_t = (\phi_1 + \phi_2 - 1)\,y_{t-1} - \phi_2\,\Delta y_{t-1} + \varepsilon_t
> Restamos $y_{t-1}$ de ambos lados; $y_{t-1} - y_{t-2} = \Delta y_{t-1}$.
= \delta = \phi_1 + \phi_2 - 1, \qquad \tip{gamma-adf}{\gamma_1} = -\phi_2
> Raíz unitaria ⟺ $\phi_1 + \phi_2 = 1$ ⟺ $z = 1$ resuelve $1 - \phi_1 z - \phi_2 z^2 = 0$. La prueba sigue siendo sobre $\delta$; el término $\Delta y_{t-1}$ solo «limpia» la memoria extra.
:::
:::

:::definicion Ecuación de la prueba ADF (parte por parte)
$$\Delta y_t = \underbrace{\alpha}_{\text{constante}} + \underbrace{\beta\,t}_{\text{tendencia}} + \underbrace{\delta\,y_{t-1}}_{\text{lo que se prueba}} + \underbrace{\sum_{i=1}^{\tip{p}{p}} \tip{gamma-adf}{\gamma_i}\,\Delta y_{t-i}}_{\text{limpia la autocorrelación}} + \varepsilon_t$$

- $\Delta y_t$: el cambio de hoy (variable dependiente).
- $\alpha$: constante; solo se incluye si la serie oscila alrededor de un nivel distinto de 0.
- $\beta\,t$: tendencia lineal; solo si la serie tiene tendencia determinística.
- $\delta\,y_{t-1}$: el corazón de la prueba. $H_0: \delta = 0$ (raíz unitaria) vs. $H_1: \delta < 0$ (estacionaria).
- $\sum \gamma_i\,\Delta y_{t-i}$: $p$ rezagos de la diferencia para que $\varepsilon_t$ quede como ruido blanco. `statsmodels` elige $p$ con el criterio AIC entre 0 y $\lceil 12\,(n/100)^{1/4} \rceil$ (redondeado hacia arriba).
- El estadístico es otra vez $\tau = \hat\delta / \tip{se}{\operatorname{EE}}(\hat\delta)$ con valores críticos de MacKinnon.
:::

### Las tres especificaciones de la ADF {#especificaciones}

| `regression=` | Ecuación | Úsala cuando la serie… | Crítico 5% |
|---|---|---|---|
| `"n"` | $\Delta y_t = \delta y_{t-1} + \dots$ | oscila alrededor de **cero** (por ejemplo, residuos, rendimientos) | −1.94 |
| `"c"` | $\Delta y_t = \alpha + \delta y_{t-1} + \dots$ | oscila alrededor de una **media distinta de cero**, sin tendencia | −2.86 |
| `"ct"` | $\Delta y_t = \alpha + \beta t + \delta y_{t-1} + \dots$ | tiene **crecimiento o decrecimiento** lineal persistente | −3.41 |

:::duda ¿La prueba ADF es para series con tendencia determinística?
No exactamente. La ADF **siempre** prueba lo mismo: si hay **raíz unitaria** (tendencia **estocástica**) [[tendencias]]. Lo que cambia con la especificación es **contra qué alternativa** se compara:

- Con `"c"`: $H_1$ = «estacionaria alrededor de una **media**».
- Con `"ct"`: $H_1$ = «estacionaria alrededor de una **recta**» (estacionaria en tendencia).

Por eso, si tu serie crece, debes usar `"ct"`: así la prueba puede distinguir entre «crece porque tiene una recta (determinística)» y «crece porque acumula choques (estocástica)». Si usas `"c"` con una serie que tiene tendencia determinística, la prueba **confunde la tendencia con una raíz unitaria** y casi nunca rechaza.
:::

```python
rng = np.random.default_rng(7)
t = np.arange(1, 201)
tend = 10 + 0.05 * t + rng.normal(0, 1, 200)          # tendencia determinística + ruido
for reg in ["c", "ct"]:
    estad, pval, *_ = adfuller(tend, regression=reg, autolag="AIC")
    print(f"ADF con regression='{reg}':  tau = {estad:7.3f}   p-value = {pval:.4f}")
```

Con `"c"` la prueba no ve la estacionariedad alrededor de la recta y no rechaza; con `"ct"` rechaza claramente: la serie es **estacionaria en tendencia**.

### Anatomía de la salida de `adfuller` {#salida-adf}

```python
resultado = adfuller(serie, regression="ct", autolag="AIC")
nombres = ["estadístico τ", "p-value", "rezagos usados (p)", "observaciones", "valores críticos", "mejor AIC"]
for nombre, valor in zip(nombres, resultado):
    print(f"{nombre:20s}: {valor}")
```

| Posición | Qué es | Cómo se usa |
|---|---|---|
| `[0]` | $\tau$ | compáralo con los críticos: más negativo ⇒ rechazar |
| `[1]` | p-value (MacKinnon) | si $< 0.05$ ⇒ rechazar $H_0$ (no hay raíz unitaria) |
| `[2]` | $p$ elegido por AIC | cuántas diferencias rezagadas se agregaron |
| `[3]` | observaciones de la regresión | $n - 1 - p$ |
| `[4]` | críticos 1%, 5%, 10% | ajustados por tamaño de muestra |
| `[5]` | AIC del mejor modelo | solo informativo |

:::interactivo py-adfuller | Simulador: `adfuller` con todos sus parámetros {#sim-adfuller}
Elige la serie y los parámetros. Además de la salida que imprimirías, verás **la búsqueda de rezagos** que hace `autolag` (con el AIC, el BIC y la $t$ de cada candidato) y **la regresión final** de la que sale $\tau$.
@@@
- **Código y salida**: lo que escribirías e imprimirías en Python.
- **Tarjeta de decisión**: compara $\tau$ con el crítico al 5%.
- **Tabla «Búsqueda de rezagos»**: cada renglón es un modelo con $p$ diferencias rezagadas, todos estimados con la **misma** muestra. AIC elige el menor AIC, BIC el menor BIC y «t-stat» empieza en el máximo y quita rezagos hasta que el último tiene $|t| \ge 1.645$. El renglón amarillo (✓) es el elegido.
- **Tabla «Regresión final»**: los coeficientes de $\Delta y_t = \dots + \delta\,y_{t-1} + \sum\gamma_i\Delta y_{t-i}$. El renglón amarillo es $\delta$: su $t$ **es** el estadístico ADF.
:::

| Situación | `regression` | `autolag` | `maxlag` |
|---|---|---|---|
| Serie en niveles con tendencia (o su log) | `"ct"` | `"AIC"` | `None` |
| Serie que oscila alrededor de un nivel ≠ 0 | `"c"` | `"AIC"` | `None` |
| Serie ya diferenciada | `"c"` (o `"n"` si la media es ≈ 0) | `"AIC"` | `None` |
| Residuos o rendimientos (media 0) | `"n"` | `"AIC"` | `None` |
| Mensual con estacionalidad fuerte | según la gráfica | `"AIC"` | al menos 13 para cubrir el rezago 12 |
| Quieres el modelo más pequeño posible | según la gráfica | `"BIC"` | `None` |

:::duda ¿AIC, BIC o t-stat?
Los tres buscan cuántos rezagos $p$ hacen falta para que el error sea ruido blanco. **AIC** (el predeterminado) tiende a elegir más rezagos; **BIC** castiga más los parámetros y elige menos; **t-stat** quita rezagos desde el máximo hasta que el último sea significativo. Si los tres llevan a la misma conclusión, tu resultado es robusto; si no, reporta el de AIC y menciona la diferencia.
:::

:::duda ¿Por qué cambia el resultado si cambio `maxlag`?
Porque cambia el conjunto de modelos candidatos **y** la muestra con la que se comparan (todos se estiman con las observaciones disponibles para el modelo más grande). Más rezagos ⇒ errores más limpios, pero menos potencia. Por eso conviene usar el valor por defecto y, como chequeo, probar uno o dos valores más.
:::

:::duda ¿La ADF necesita que los datos sean normales? ¿Y si tengo NaN?
No necesita normalidad: los valores críticos son asintóticos. Lo que sí necesita es que **no haya NaN** (después de `.diff()` usa `.dropna()`) y que la serie tenga suficientes datos: con menos de unos 30–50 la prueba tiene muy poca potencia [[potencia]].
:::

```python
x = np.log(serie)
for criterio in ["AIC", "BIC", "t-stat"]:
    estad, pval, rezagos, nobs, *_ = adfuller(x, regression="ct", autolag=criterio)
    print(f"autolag={criterio:7s} → rezagos = {rezagos:2d}   τ = {estad:7.3f}   p-value = {pval:.4f}")
estad, pval, rezagos, *_ = adfuller(x, regression="ct", maxlag=2, autolag=None)
print(f"autolag=None, maxlag=2 → rezagos = {rezagos:2d}   τ = {estad:7.3f}   p-value = {pval:.4f}")
```

Aquí los tres criterios eligen 13 rezagos: los necesitan para absorber la estacionalidad de 12 meses. En cambio, forzar `maxlag=2` deja esa autocorrelación estacional en el error y la prueba **rechaza falsamente** la raíz unitaria (p ≈ 0). Por eso no conviene recortar `maxlag` en series mensuales.

En AirPassengers (en niveles), aun con tendencia incluida, el p-value es alto: **no se rechaza la raíz unitaria**. Lo retomaremos en el caso integrador [[caso]].

:::nota Si ves un FutureWarning
Con `statsmodels` 0.15 o posterior, `adfuller` y `kpss` muestran un aviso `FutureWarning`: en versiones futuras devolverán un objeto con nombres (`resultado.stat`, `resultado.pvalue`…) en lugar de una tupla. No es un error y los números son los mismos; en esta guía lo ocultamos para que la salida se lea mejor.
:::

### La prueba KPSS {#kpss}

La KPSS (Kwiatkowski, Phillips, Schmidt y Shin, 1992) invierte la pregunta: su hipótesis nula es la **estacionariedad**.

:::definicion El modelo de KPSS
$$y_t = \tip{xi-kpss}{\xi}\,t + \tip{r-kpss}{r_t} + \varepsilon_t, \qquad \tip{r-kpss}{r_t} = r_{t-1} + \tip{u-kpss}{u_t}, \qquad \Var(u_t) = \tip{sigma2u}{\sigma^2_u}$$

- $\xi\,t$: tendencia determinística (solo en la especificación `"ct"`).
- $r_t$: un **paseo aleatorio** escondido dentro de la serie.
- $\varepsilon_t$: ruido estacionario.

$$H_0:\ \sigma^2_u = 0 \;\;(r_t \text{ es constante} \Rightarrow \text{estacionaria}) \qquad H_1:\ \sigma^2_u > 0 \;\;(\text{hay raíz unitaria})$$
:::

:::definicion El estadístico KPSS
1. Obtener los residuos $\ehat_t$: la serie menos su media (`"c"`) o menos su recta ajustada (`"ct"`).
2. Acumularlos: $\tip{S-kpss}{S_t} = \sum_{i=1}^{t}\ehat_i$.
3. Calcular

$$\eta = \frac{\dfrac{1}{n^2}\displaystyle\sum_{t=1}^{n} S_t^2}{\lrvar}, \qquad \lrvar = \frac{1}{n}\left[\sum_{t=1}^{n}\ehat_t^2 + 2\sum_{l=1}^{\tip{L-nw}{L}}\Big(1 - \frac{l}{L+1}\Big)\sum_{t=l+1}^{n}\ehat_t\,\ehat_{t-l}\right]$$

- El numerador mide **qué tanto se alejan de 0 las sumas acumuladas**.
- El denominador es la varianza de «largo plazo» de los residuos: la varianza normal más una corrección por autocorrelación con $L$ rezagos (Newey–West). Con $L = 0$ es simplemente $\frac1n\sum \ehat_t^2$.
- Valores **grandes** de $\eta$ ⇒ evidencia **contra** la estacionariedad.
:::

:::intuicion ¿Por qué sumas acumuladas?
Las desviaciones respecto a la media siempre suman 0 al final [[suma-desv]]. Si la serie es estacionaria, en el camino la suma acumulada **va y viene** cerca de 0. Si la serie tiene un paseo aleatorio, pasa largas rachas arriba (o abajo) de su media y la suma acumulada hace **excursiones enormes** antes de regresar a 0 en $t = n$.
:::

:::ejemplo KPSS a mano (especificación "c", L = 0)
**Serie A** (con tendencia): $y = (5, 7, 6, 8, 7, 9, 8, 10)$, $\bar y = 60/8 = 7.5$.

| $t$ | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
|---|---|---|---|---|---|---|---|---|
| $\ehat_t = y_t - 7.5$ | −2.5 | −0.5 | −1.5 | 0.5 | −0.5 | 1.5 | 0.5 | 2.5 |
| $S_t$ | −2.5 | −3 | −4.5 | −4 | −4.5 | −3 | −2.5 | 0 |
| $S_t^2$ | 6.25 | 9 | 20.25 | 16 | 20.25 | 9 | 6.25 | 0 |

:::pasos
= \frac{1}{n^2}\sum S_t^2 = \frac{87}{64} = 1.359375
> La suma de la última fila es 87 y $n^2 = 64$.
= \lrvar = \frac{1}{8}\sum \ehat_t^2 = \frac{6.25 + 0.25 + 2.25 + 0.25 + 0.25 + 2.25 + 0.25 + 6.25}{8} = \frac{18}{8} = 2.25
> Con $L = 0$ no hay corrección por autocorrelación.
= \eta = \frac{1.359375}{2.25} = 0.6042
> Estadístico KPSS.
= 0.6042 > 0.463 = \text{crítico al 5\%}
> **Se rechaza $H_0$**: la suma acumulada se fue muy lejos (hasta −4.5); la serie no es estacionaria en nivel.
= \text{p-value} = 0.025 - 0.015\cdot\frac{0.6042 - 0.574}{0.739 - 0.574} = 0.0223
> El p-value se **interpola** en la tabla de KPSS: 0.6042 está entre los críticos del 2.5% (0.574) y del 1% (0.739).
:::

**Serie B** (sin tendencia): $y = (6, 8, 5, 7, 9, 6, 8, 7)$, $\bar y = 7$. Residuos $(-1, 1, -2, 0, 2, -1, 1, 0)$, sumas acumuladas $(-1, 0, -2, -2, 0, -1, 0, 0)$, $\sum S_t^2 = 10$ y $\sum \ehat_t^2 = 12$:

$$\eta = \frac{10/64}{12/8} = \frac{0.15625}{1.5} = 0.1042 < 0.347 \;(\text{crítico al 10\%}) \Rightarrow \text{no se rechaza: estacionaria}$$
:::

```python
from statsmodels.tsa.stattools import kpss

for nombre, x in [("A (tendencia)", [5, 7, 6, 8, 7, 9, 8, 10]), ("B (estable)", [6, 8, 5, 7, 9, 6, 8, 7])]:
    estad, pval, L, crit = kpss(np.array(x, dtype=float), regression="c", nlags=0)
    print(f"Serie {nombre:14s} η = {estad:.4f}   p-value = {pval:.4f}   crítico 5% = {crit['5%']}")
```

:::cuidado El aviso `InterpolationWarning`
La tabla de KPSS solo va del 1% al 10%. Si el estadístico cae fuera (como en la serie B), `statsmodels` devuelve el extremo de la tabla (0.10 o 0.01) y avisa que el p-value real es **mayor** (o **menor**). No es un error: «p-value > 0.10» simplemente significa «no se rechaza» con holgura.
:::

:::interactivo py-kpss | Simulador: `kpss` y sus sumas acumuladas {#sim-kpss}
Elige la serie, la especificación y `nlags`. La gráfica de la derecha muestra las **sumas acumuladas** $S_t$ de los residuos: son las que forman el numerador del estadístico.
@@@
- **Código y salida**: lo que escribirías e imprimirías, incluido el aviso de interpolación cuando aparece.
- **Izquierda**: los residuos $\hat e_t$ (la serie menos su media, o menos su recta con `"ct"`).
- **Derecha**: $S_t = \hat e_1 + \dots + \hat e_t$. Si se aleja mucho de 0 por mucho tiempo, $\eta$ crece y se rechaza la estacionariedad. Siempre termina en 0.
- **Lectura**: el cálculo $\eta = (\sum S_t^2/n^2)/\hat\sigma^2_\infty$ con tus números. `nlags` solo cambia el denominador.
:::

:::duda ¿Qué `nlags` uso en KPSS?
Usa `"auto"` (el predeterminado, método de Hobijn et al.). Con `nlags=0` la prueba supone que los residuos no tienen autocorrelación y, si la tienen, **rechaza de más**. Con un valor muy grande corrige demasiado y pierde potencia. `"legacy"` es la regla antigua $\lceil 12(n/100)^{1/4}\rceil$.
:::

:::duda ¿Por qué a veces ADF y KPSS se contradicen?
Porque responden preguntas distintas con hipótesis nulas opuestas, y ambas tienen errores. Las contradicciones son frecuentes con series **muy persistentes pero estacionarias** ($\phi \approx 0.95$), con **rupturas estructurales** o con la especificación equivocada. La tabla de lectura conjunta [[conjunta]] te dice qué revisar en cada caso.
:::

```python
import warnings
paseo = np.random.default_rng(2).normal(size=200).cumsum()
with warnings.catch_warnings():
    warnings.simplefilter("ignore")
    for nl in ["auto", "legacy", 0, 4, 16]:
        estad, pval, rezagos, _ = kpss(paseo, regression="c", nlags=nl)
        print(f"nlags={str(nl):7s} → rezagos usados = {rezagos:2d}   η = {estad:6.3f}   p-value = {pval:.3f}")
```

En un paseo aleatorio $H_0$ es falsa, así que la prueba **debería rechazar**. Con 0 o 4 rezagos rechaza con fuerza y con `"auto"` también, pero con 15 o 16 el denominador $\lrvar$ crece tanto que ya no rechaza: demasiados rezagos le quitan potencia.

| Especificación KPSS | $H_0$ | Crítico 5% |
|---|---|---|
| `regression="c"` | estacionaria alrededor de una **constante** | 0.463 |
| `regression="ct"` | estacionaria alrededor de una **tendencia** | 0.146 |

### Lectura conjunta ADF + KPSS {#conjunta}

Como sus hipótesis nulas son **opuestas**, usarlas juntas da un diagnóstico más sólido:

| | KPSS **no** rechaza (p ≥ 0.05) | KPSS **rechaza** (p < 0.05) |
|---|---|---|
| **ADF rechaza** (p < 0.05) | ✅ **Estacionaria**: ambas coinciden | ⚠️ Ambas rechazan: posible estructura compleja, cambio de régimen o mala especificación |
| **ADF no rechaza** (p ≥ 0.05) | ❓ Evidencia insuficiente: revisa gráfica, tamaño de muestra y especificación | ❌ **No estacionaria**: ambas coinciden |

:::examen La tabla que más se pregunta
- ADF: $H_0$ = **hay raíz unitaria** (no estacionaria). Rechazar ⇒ evidencia **a favor** de estacionariedad.
- KPSS: $H_0$ = **es estacionaria**. Rechazar ⇒ evidencia **en contra** de estacionariedad.
- Truco para recordarlo: **A**DF **A**firma problemas (raíz) en su nula; **K**PSS **K**onfía en la estacionariedad.
:::

```python
import warnings

def diagnostico(x, reg_adf="c", reg_kpss="c", alfa=0.05):
    """Lectura conjunta ADF + KPSS."""
    adf_p = adfuller(x, regression=reg_adf, autolag="AIC")[1]
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")                  # aviso de interpolación de KPSS
        kpss_p = kpss(x, regression=reg_kpss, nlags="auto")[1]
    a, k = adf_p < alfa, kpss_p < alfa
    lectura = {(True, False): "estacionaria", (False, True): "NO estacionaria",
               (True, True): "ambas rechazan: revisar", (False, False): "evidencia insuficiente"}[(a, k)]
    return pd.Series({"ADF p": round(adf_p, 4), "KPSS p": round(kpss_p, 4), "lectura": lectura})

rng = np.random.default_rng(2)
casos = {"ruido blanco": rng.normal(size=300),
         "paseo aleatorio": rng.normal(size=300).cumsum(),
         "AirPassengers": serie.values}
print(pd.DataFrame({k: diagnostico(v) for k, v in casos.items()}).T)
```

### Laboratorio ADF + KPSS {#laboratorio}

:::interactivo laboratorio | Corre las pruebas tú mismo
Elige el proceso, su parámetro, el tamaño de muestra y las especificaciones. Los cálculos replican `adfuller(autolag="AIC")` y `kpss(nlags="auto")` de statsmodels. Experimenta:

1. AR(1) con $\phi = 0.95$ y $n = 60$: ¿la ADF logra rechazar? (poca **potencia** cerca de la raíz unitaria).
2. Tendencia determinística con ADF `"c"` y luego `"ct"`.
3. Ruptura estructural: mira qué dice cada prueba.
@@@
- **Gráfica**: la serie simulada.
- **Tarjetas**: rosa = rechaza $H_0$, azul = no rechaza. ADF muestra $\tau$, p-value, crítico ajustado a $n$, rezagos elegidos por AIC y observaciones usadas. KPSS muestra $\eta$, p-value (con «>» o «<» si cae fuera de la tabla) y rezagos de Newey–West.
- **Tabla 2×2**: la celda amarilla es la lectura conjunta.
:::

### Cuidado con las rupturas estructurales {#rupturas}

Un **cambio de nivel** (por ejemplo, una nueva política) hace que la serie se vea como si «nunca regresara» a su media anterior. La ADF lo interpreta como persistencia y tiende a **no rechazar** la raíz unitaria, aunque cada tramo sea perfectamente estacionario.

```python
rng = np.random.default_rng(3)
quiebre = np.r_[rng.normal(0, 1, 150), rng.normal(4, 1, 150)]    # salto de 0 a 4 a la mitad
print(diagnostico(quiebre))
print("Solo la primera mitad:"); print(diagnostico(quiebre[:150]))
```

Con el salto, ADF no rechaza la raíz unitaria y KPSS rechaza la estacionariedad: la lectura conjunta dice «NO estacionaria», aunque cada mitad por separado es ruido blanco perfectamente estacionario. Recomendaciones: **grafica siempre** primero, analiza por tramos si hay un evento conocido y, si hace falta, usa pruebas que permiten una ruptura (por ejemplo, Zivot–Andrews).

### ¿Qué tan confiable es la ADF? {#potencia}

La ADF tiene **poca potencia** cuando $\phi$ está cerca de 1: le cuesta distinguir «muy persistente» de «raíz unitaria», sobre todo con pocos datos.

```python
rng = np.random.default_rng(5)
def tasa_rechazo(phi, n, reps=300):
    rechazos = 0
    for _ in range(reps):
        e = rng.normal(size=n + 50)
        x = np.zeros(n + 50)
        for t in range(1, n + 50):
            x[t] = phi * x[t - 1] + e[t]
        rechazos += adfuller(x[50:], regression="c", maxlag=1, autolag=None)[1] < 0.05
    return rechazos / reps

for phi in [1.0, 0.95, 0.8]:
    print(f"φ = {phi:4.2f}:  n=50 → {tasa_rechazo(phi, 50):.0%}   n=200 → {tasa_rechazo(phi, 200):.0%} de rechazos")
```

Con $\phi = 1$ rechaza cerca del 5% (es el error tipo I, como debe ser). Con $\phi = 0.95$, aunque la serie **sí** es estacionaria, la ADF casi nunca lo detecta con $n = 50$. Por eso se complementa con KPSS y con la gráfica.

:::resumen Lo esencial de la sección 6
- DF: $\Delta y_t = \delta y_{t-1} + \varepsilon_t$, $H_0: \delta = 0$ (raíz unitaria), $\tau = \hat\delta/\tip{se}{\operatorname{EE}}(\hat\delta)$ con valores críticos especiales.
- ADF agrega $\sum\gamma_i\Delta y_{t-i}$; especificaciones `"n"`, `"c"`, `"ct"` según la gráfica.
- KPSS: $H_0$ = estacionaria; estadístico con sumas acumuladas de residuos.
- Lectura conjunta: ADF rechaza + KPSS no rechaza ⇒ estacionaria; al revés ⇒ no estacionaria.
:::
