## ⚖️ Estacionariedad {#estacionariedad}
@mapa Estacionariedad débil, ruido blanco, AR(1), paseo aleatorio, raíz unitaria, tipos de tendencia y diferenciación.

### Intuición {#intuicion-est}

Una serie es **estacionaria** cuando sus propiedades estadísticas **no cambian con el tiempo**: si tomas un pedazo del principio y otro del final, «se parecen» estadísticamente (misma media, misma dispersión, misma forma de dependencia). Puede subir y bajar mucho, pero siempre alrededor del mismo nivel y con la misma intensidad.

:::intuicion El termómetro de una habitación con clima
La temperatura de una habitación con aire acondicionado sube y baja minuto a minuto, pero siempre alrededor de 22 °C y con oscilaciones parecidas: es estacionaria. La temperatura de una ciudad a lo largo de 50 años (con calentamiento global y estaciones del año) no lo es: su nivel cambia con la época.
:::

### Estacionariedad estricta y débil {#debil}

:::definicion Estacionariedad estricta
Un proceso es **estrictamente estacionario** si la distribución conjunta de $(y_{t_1}, \dots, y_{t_m})$ es la misma que la de $(y_{t_1 + h}, \dots, y_{t_m + h})$ para cualquier desplazamiento $h$. Es decir, **toda** la probabilidad es invariante en el tiempo. Es muy exigente y casi imposible de verificar con datos.
:::

:::definicion Estacionariedad débil (o de segundo orden) {#def-debil}
Un proceso es **débilmente estacionario** si cumple tres condiciones:

$$\text{(1)}\;\; \E[\tip{yt}{y_t}] = \tip{mu}{\mu} \qquad \text{(2)}\;\; \Var(y_t) = \sigma^2 < \infty \qquad \text{(3)}\;\; \Cov(y_t, y_{t-k}) = \gamma(k)$$

1. **Media constante**: $\mu$ no lleva subíndice $t$; el nivel promedio es el mismo en todas las épocas. Falla con **tendencia**, **estacionalidad** o **rupturas** en la media.
2. **Varianza constante y finita**: la dispersión no crece ni se encoge con el tiempo. Falla con **heterocedasticidad** (amplitud creciente) o con un **paseo aleatorio**.
3. **Autocovarianza que depende solo del rezago**: la relación entre $y_t$ y $y_{t-k}$ depende de la **distancia** $k$, no de **cuándo** se mide. Enero–febrero de 1950 se relacionan igual que enero–febrero de 1990.
:::

Cuando en esta guía (y en el examen) se dice «estacionaria» sin más, se refiere a la **débil**. Relación entre ambas: estricta con varianza finita ⇒ débil; y para procesos gaussianos (normales), débil ⇒ estricta, porque la normal queda determinada por medias y covarianzas.

### Estacionalidad ≠ estacionariedad {#estacionalidad-vs}

:::duda Explica estacionalidad y estacionariedad
Suenan parecido pero son conceptos distintos:

| | **Estacionalidad** | **Estacionariedad** |
|---|---|---|
| ¿Qué es? | un **componente**: un patrón que se repite con periodo fijo [[cinco]] | una **propiedad**: estabilidad estadística en el tiempo |
| Pregunta | ¿se repite algo cada $s$ periodos? | ¿la media, la varianza y la dependencia son constantes? |
| Ejemplo | más pasajeros cada julio | un ruido que oscila siempre alrededor de 0 |

Y se relacionan así: **una estacionalidad determinística hace que la serie NO sea estacionaria**, porque la media cambia según la temporada.
:::

:::demo La estacionalidad determinística viola la condición (1) {#est-no-estacionaria}
Sea $y_t = \mu + S_t + \varepsilon_t$ con $S_t$ un patrón fijo (por ejemplo, $+5$ en verano y $-5$ en invierno) y $\varepsilon_t$ ruido blanco.

:::pasos
= \E[y_t] = \E[\mu + S_t + \varepsilon_t] = \mu + S_t + \E[\varepsilon_t]
> Linealidad [[linealidad]]: $\mu$ y $S_t$ son números fijos (no aleatorios).
= = \mu + S_t
> El ruido blanco tiene media 0 [[ruido-blanco]].
= \E[y_{\text{julio}}] = \mu + 5 \;\ne\; \mu - 5 = \E[y_{\text{enero}}]
> La media **depende de $t$** (de la temporada): falla la condición (1).
:::
:::

:::cuidado La trampa de la ventana móvil
Si calculas la media móvil con una ventana de 12 o 24 meses en una serie con estacionalidad mensual, la línea sale **plana**: cada ventana contiene periodos completos y el patrón se cancela [[mm-estacional]]. Eso **no** significa que la serie sea estacionaria: la media teórica sí cambia mes con mes; la ventana simplemente la promedia. Por la misma razón, ADF y KPSS (que miran tendencias y raíces unitarias) a veces **no detectan** la estacionalidad. Para verla usa la gráfica estacional [[estacional-graf]] o la ACF (picos en los rezagos $s, 2s, \dots$) [[patrones]].
:::

### Estacionaria no significa plana {#no-plana}

Una serie estacionaria puede verse muy «movida»: lo que importa es que se mueva **siempre igual**. Un AR(1) con $\phi = 0.9$ hace ondas largas que parecen tendencias locales, y sin embargo regresa siempre a su media [[ar1]]. A la inversa, una serie casi plana con un escalón (ruptura) **no** es estacionaria.

### ¿Por qué importa tanto? {#importancia}

- **Modelos**: ARMA (Unidad II) supone dependencia temporal estable. Si la serie tiene tendencia o raíz unitaria, el modelo confunde la estructura sistemática con autocorrelación.
- **Estimación**: $\bar y$ y $\hat\gamma(k)$ promedian en el tiempo; solo estiman algo con sentido si lo que promedian no cambia [[media-insesgada]].
- **Regresiones espurias**: dos paseos aleatorios independientes suelen dar una regresión con $R^2$ alto y coeficientes «significativos» que no significan nada.
- **Pronóstico**: si el pasado se comporta como el futuro, lo aprendido sirve para predecir.

### El ruido blanco {#ruido-blanco}

:::definicion Ruido blanco
$\varepsilon_t$ es **ruido blanco** con varianza $\sigma^2$, y se escribe $\varepsilon_t \sim \mathrm{RB}(0, \sigma^2)$, si:

$$\E[\varepsilon_t] = 0, \qquad \Var(\varepsilon_t) = \sigma^2, \qquad \Cov(\varepsilon_t, \varepsilon_{t-k}) = 0 \;\text{ para } k \ne 0$$

Si además son independientes y normales, es **ruido blanco gaussiano**: $\varepsilon_t \overset{iid}{\sim} N(0, \sigma^2)$.
:::

:::demo El ruido blanco es estacionario {#rb-estacionario}
Revisamos las tres condiciones de [[def-debil]]:

:::pasos
= \E[\varepsilon_t] = 0 \quad\text{para todo } t
> (1) Media constante, igual a 0: ✓.
= \Var(\varepsilon_t) = \sigma^2 < \infty \quad\text{para todo } t
> (2) Varianza constante y finita: ✓.
= \gamma(k) = \begin{cases}\sigma^2 & k = 0\\ 0 & k \ne 0\end{cases} \qquad \rho(k) = \begin{cases}1 & k = 0\\ 0 & k \ne 0\end{cases}
> (3) La autocovarianza depende solo de $k$ (es 0 fuera de $k = 0$): ✓.
:::

Es el proceso estacionario **más simple**: no tiene memoria. Por eso su ACF teórica es **cero en todos los rezagos** y, en la práctica, sus autocorrelaciones muestrales caen dentro de las bandas [[bartlett]].
:::

:::nota Ruido blanco vs. i.i.d.
i.i.d. (independientes e idénticamente distribuidos) es **más fuerte** que ruido blanco: el ruido blanco solo pide correlación cero, no independencia. Un ejemplo de ruido blanco que **no** es independiente aparece en finanzas: rendimientos sin autocorrelación pero con «rachas» de volatilidad (modelos ARCH, Unidad II).
:::

:::interactivo ruido | Ruido blanco: serie, histograma y correlograma
Cambia $\sigma$ y la semilla. La serie siempre oscila alrededor de 0 con la misma intensidad; el histograma tiene forma de campana; y las autocorrelaciones quedan, casi todas, dentro de las bandas.
:::

### El modelo AR(1) {#ar1}

:::definicion Proceso autorregresivo de orden 1
$$y_t = \tip{c}{c} + \phi\, y_{t-1} + \varepsilon_t, \qquad \varepsilon_t \sim \mathrm{RB}(0, \sigma^2)$$

El valor de hoy es una constante, más una **fracción $\phi$ del valor de ayer**, más un choque nuevo. $\phi$ mide la **memoria**: con $\phi = 0$ no hay memoria (ruido blanco más constante); con $\phi$ cerca de 1 la serie es muy persistente; con $\phi$ negativo alterna de signo.
:::

:::demo (1) Sustitución repetida: el AR(1) es una suma de choques pasados {#ar1-sustitucion}
:::pasos
= y_t = c + \phi\,y_{t-1} + \varepsilon_t
> Modelo original.
= y_{t-1} = c + \phi\,y_{t-2} + \varepsilon_{t-1}
> El mismo modelo, un periodo antes.
= y_t = c + \phi\,(c + \phi\,y_{t-2} + \varepsilon_{t-1}) + \varepsilon_t = c(1 + \phi) + \phi^2 y_{t-2} + \varepsilon_t + \phi\,\varepsilon_{t-1}
> Sustituimos $y_{t-1}$ y distribuimos $\phi$.
= y_t = c(1 + \phi + \phi^2) + \phi^3 y_{t-3} + \varepsilon_t + \phi\,\varepsilon_{t-1} + \phi^2\varepsilon_{t-2}
> Sustituimos ahora $y_{t-2} = c + \phi\,y_{t-3} + \varepsilon_{t-2}$. Ya se ve el patrón.
= y_t = c\sum_{j=0}^{k-1}\phi^j \;+\; \phi^k\,y_{t-k} \;+\; \sum_{j=0}^{k-1}\phi^j\,\varepsilon_{t-j}
> Después de $k$ sustituciones: el choque de hace $j$ periodos pesa $\phi^j$.
= \text{Si } |\phi| < 1:\quad y_t = \frac{c}{1 - \phi} + \sum_{j=0}^{\infty}\phi^j\,\varepsilon_{t-j}
> Al llevar $k \to \infty$: $\phi^k y_{t-k} \to 0$ y $\sum \phi^j \to \frac{1}{1-\phi}$ (serie geométrica [[geo-suma]]).
:::

Esta forma se llama **MA(∞)**: el AR(1) es un promedio ponderado de **todos** los choques pasados, con pesos $\tip{psi}{\psi_j} = \phi^j$ que se **apagan** geométricamente.
:::

:::demo (2) La media del AR(1) estacionario {#ar1-media}
:::pasos
= \E[y_t] = \E\!\left[\frac{c}{1-\phi} + \sum_{j=0}^{\infty}\phi^j\,\varepsilon_{t-j}\right] = \frac{c}{1-\phi} + \sum_{j=0}^{\infty}\phi^j\,\E[\varepsilon_{t-j}]
> Linealidad de la esperanza [[linealidad]].
= \mu = \frac{c}{1 - \phi}
> Cada $\E[\varepsilon_{t-j}] = 0$. ¡No depende de $t$! Condición (1) ✓.
:::

**Atajo** (si ya sabemos que es estacionario, $\E[y_t] = \E[y_{t-1}] = \mu$): $\mu = c + \phi\mu + 0 \Rightarrow \mu(1 - \phi) = c \Rightarrow \mu = c/(1-\phi)$. Fíjate que con $\phi = 1$ habría que dividir entre cero: **no existe una media fija**.
:::

:::demo (3) La varianza del AR(1) estacionario {#ar1-varianza}
:::pasos
= \Var(y_t) = \Var\!\left(\sum_{j=0}^{\infty}\phi^j\,\varepsilon_{t-j}\right)
> La constante $c/(1-\phi)$ no aporta varianza [[var-prop]].
= = \sum_{j=0}^{\infty}\Var\big(\phi^j\varepsilon_{t-j}\big) = \sum_{j=0}^{\infty}\phi^{2j}\,\sigma^2
> Los choques no están correlacionados: la varianza de la suma es la suma de varianzas [[cov-prop]]; y $\Var(a X) = a^2\Var(X)$ con $a = \phi^j$.
= \gamma(0) = \sigma^2\sum_{j=0}^{\infty}(\phi^2)^j = \frac{\sigma^2}{1 - \phi^2}
> Serie geométrica con razón $r = \phi^2 < 1$ [[geo-suma]]. Constante en $t$: condición (2) ✓.
:::
:::

:::demo (4) Autocovarianza y ACF del AR(1): ρ(k) = φᵏ {#ar1-acf}
Centramos la serie: $x_t = y_t - \mu$. Como $\mu = c + \phi\mu$, restando queda $x_t = \phi\,x_{t-1} + \varepsilon_t$.

:::pasos
= x_t\,x_{t-k} = \phi\,x_{t-1}\,x_{t-k} + \varepsilon_t\,x_{t-k} \qquad (k \ge 1)
> Multiplicamos ambos lados por $x_{t-k}$.
= \E[x_t\,x_{t-k}] = \phi\,\E[x_{t-1}\,x_{t-k}] + \E[\varepsilon_t\,x_{t-k}]
> Tomamos esperanza [[linealidad]].
= \gamma(k) = \phi\,\gamma(k-1) + 0
> $\E[x_t x_{t-k}] = \gamma(k)$ y $\E[x_{t-1}x_{t-k}] = \gamma(k-1)$ (distancia $k - 1$). El choque de **hoy** no está correlacionado con el pasado ($x_{t-k}$ solo depende de choques anteriores a $t$).
= \gamma(k) = \phi\,\gamma(k-1) = \phi^2\gamma(k-2) = \dots = \phi^k\,\gamma(0)
> Aplicamos la regla una y otra vez. Depende solo de $k$: condición (3) ✓.
= \rho(k) = \frac{\gamma(k)}{\gamma(0)} = \phi^k
> La ACF **decae geométricamente**: rápido si $\phi$ es pequeño, lento si $\phi$ está cerca de 1, y alternando de signo si $\phi < 0$.
:::

**Conclusión:** con $|\phi| < 1$ se cumplen las tres condiciones: el AR(1) es estacionario.
:::

:::ejemplo AR(1) con c = 2, φ = 0.6 y σ² = 4
:::pasos
= \mu = \frac{c}{1 - \phi} = \frac{2}{1 - 0.6} = \frac{2}{0.4} = 5
> La serie oscila alrededor de 5.
= \gamma(0) = \frac{\sigma^2}{1 - \phi^2} = \frac{4}{1 - 0.36} = \frac{4}{0.64} = 6.25 \quad (\text{desv. est.} = 2.5)
> La varianza de la serie es **mayor** que la del choque (4): la memoria acumula variabilidad.
= \gamma(1) = 0.6 \times 6.25 = 3.75, \qquad \gamma(2) = 0.6^2 \times 6.25 = 2.25
> Regla $\gamma(k) = \phi^k\gamma(0)$.
= \rho(1) = 0.6,\quad \rho(2) = 0.36,\quad \rho(3) = 0.216
> Cada rezago multiplica por 0.6.
= y_0 = 5,\; \varepsilon = (1, -2, 0.5):\quad y_1 = 2 + 0.6(5) + 1 = 6
> Simulamos tres pasos a mano, empezando en la media.
= y_2 = 2 + 0.6(6) - 2 = 3.6, \qquad y_3 = 2 + 0.6(3.6) + 0.5 = 4.66
> Tras cada choque la serie «tira» de regreso hacia 5.
:::
:::

```python
rng = np.random.default_rng(2024)
phi, c, sigma, n = 0.6, 2.0, 2.0, 200_000
e = rng.normal(0, sigma, n)
y = np.empty(n)
y[0] = c / (1 - phi)
for t in range(1, n):
    y[t] = c + phi * y[t - 1] + e[t]
print("media muestral:   ", round(y.mean(), 3), "| teoría c/(1-φ)     =", c / (1 - phi))
print("varianza muestral:", round(y.var(), 3), "| teoría σ²/(1-φ²)   =", round(sigma**2 / (1 - phi**2), 3))
print("ACF rezagos 1-3:  ", np.round(acf(y, nlags=3)[1:], 3), "| teoría φ^k =", [phi, round(phi**2, 3), round(phi**3, 3)])
```

:::interactivo ar1 | Laboratorio del AR(1)
Mueve $\phi$ y observa: la serie, su media y banda teórica $\mu \pm 2\sigma_y$, y la ACF muestral contra la teórica $\phi^k$. Lleva $\phi$ a 1: la varianza teórica «explota» (división entre cero) y la serie deja de regresar a su media.
:::

### El paseo aleatorio {#paseo}

:::definicion Paseo aleatorio (random walk)
Es el AR(1) con $\phi = 1$ y $c = 0$:

$$y_t = y_{t-1} + \varepsilon_t$$

Hoy es igual a ayer más un choque. No hay ninguna fuerza que lo regrese a un nivel: **deambula**. Modela bien precios de acciones o tipos de cambio en el corto plazo.
:::

:::demo El paseo aleatorio no es estacionario {#paseo-demo}
:::pasos
= y_1 = y_0 + \varepsilon_1, \qquad y_2 = y_1 + \varepsilon_2 = y_0 + \varepsilon_1 + \varepsilon_2
> Sustituimos hacia atrás desde un valor inicial fijo $y_0$.
= y_t = y_0 + \sum_{j=1}^{t}\varepsilon_j
> En general: el valor inicial más la **suma de todos los choques**. Ningún choque se olvida.
= \E[y_t] = y_0 + \sum_{j=1}^{t}\E[\varepsilon_j] = y_0
> La media sí es constante (condición 1 ✓)… pero no basta.
= \Var(y_t) = \sum_{j=1}^{t}\Var(\varepsilon_j) = t\,\sigma^2
> $y_0$ es fijo y los choques no están correlacionados [[cov-prop]]. **Crece con $t$**: falla la condición (2) ✗.
= \Cov(y_t, y_{t-k}) = \Cov\!\left(\sum_{j=1}^{t}\varepsilon_j,\; \sum_{i=1}^{t-k}\varepsilon_i\right) = (t - k)\,\sigma^2
> Solo aportan los $t - k$ choques **compartidos** (las parejas $\varepsilon_i\varepsilon_j$ con $i \ne j$ tienen covarianza 0). Depende de $t$: falla la condición (3) ✗.
= \Corr(y_t, y_{t-k}) = \frac{(t-k)\sigma^2}{\sqrt{t\,\sigma^2}\sqrt{(t-k)\,\sigma^2}} = \sqrt{\frac{t-k}{t}}
> Con $t = 100$ y $k = 10$: $\sqrt{0.9} = 0.949$. Las correlaciones son casi 1 y bajan **muy lentamente**: esa es la huella de una raíz unitaria en la ACF [[patrones]].
:::
:::

:::ejemplo Un paseo de 5 pasos
Con $y_0 = 0$ y choques $\varepsilon = (1,\, -2,\, 0.5,\, 1.5,\, -1)$: $y_1 = 1$, $y_2 = 1 - 2 = -1$, $y_3 = -1 + 0.5 = -0.5$, $y_4 = -0.5 + 1.5 = 1$, $y_5 = 1 - 1 = 0$. Comprobación: $y_5 = 0 + (1 - 2 + 0.5 + 1.5 - 1) = 0$ ✓. Con $\sigma^2 = 1$, la incertidumbre sobre $y_{100}$ es $\Var(y_{100}) = 100$ (desviación 10), mientras que sobre $y_1$ es solo 1.
:::

```python
R, n = 5000, 100
paseos = rng.normal(0, 1, size=(R, n)).cumsum(axis=1)     # cada fila es una realización
for t in [1, 25, 100]:
    print(f"t = {t:3d}: varianza entre realizaciones = {paseos[:, t - 1].var():6.2f}   (teoría t·σ² = {t})")
```

:::interactivo abanico | El abanico: la varianza del paseo crece con t
200 realizaciones a la vez. En el AR(1) estacionario la nube se queda en una **franja de ancho fijo**; en el paseo aleatorio se abre como abanico, siguiendo $\pm 2\sigma\sqrt{t}$.
:::

### La raíz unitaria {#raiz-unitaria}

Para entender el nombre necesitamos una herramienta: el **operador rezago** $L$, definido por $L\,y_t = y_{t-1}$ (y $L^2 y_t = y_{t-2}$, etc.).

:::demo De dónde sale la «raíz» {#raiz-demo}
:::pasos
= y_t = c + \phi\,y_{t-1} + \varepsilon_t \;\Longrightarrow\; y_t - \phi\,L\,y_t = c + \varepsilon_t
> Escribimos $y_{t-1} = L\,y_t$ y pasamos el término a la izquierda.
= (1 - \phi\,L)\,y_t = c + \varepsilon_t
> Factorizamos $y_t$: el polinomio $1 - \phi L$ resume la dinámica.
= 1 - \phi\,\tip{z}{z} = 0 \;\Longrightarrow\; z = \frac{1}{\phi}
> **Ecuación característica**: cambiamos $L$ por un número $z$ y buscamos su raíz.
= |z| > 1 \;\Longleftrightarrow\; \left|\frac1\phi\right| > 1 \;\Longleftrightarrow\; |\phi| < 1
> La raíz cae **fuera del círculo unitario** exactamente cuando el AR(1) es estacionario (la serie geométrica converge [[geo-suma]]).
= \phi = 1 \;\Longrightarrow\; z = 1
> La raíz vale **1 = una unidad**: de ahí el nombre **raíz unitaria**. Es el paseo aleatorio [[paseo]].
:::
:::

| $\phi$ | raíz $z = 1/\phi$ | ¿dónde cae? | comportamiento |
|---|---|---|---|
| 0.5 | 2 | fuera del círculo | estacionario, memoria corta |
| 0.9 | 1.11 | fuera (cerca del borde) | estacionario pero persistente |
| **1** | **1** | **sobre el círculo** | **raíz unitaria**: no estacionario |
| 1.25 | 0.8 | dentro | explosivo (crece sin límite) |

:::duda ¿Qué es una raíz unitaria, en palabras sencillas?
Es la situación en la que **los choques nunca se olvidan**. En un AR(1) estacionario, un choque de hoy pesa $\phi$ mañana, $\phi^2$ pasado mañana… y se va apagando. Con raíz unitaria ($\phi = 1$) pesa $1, 1, 1, \dots$ para siempre: cada sorpresa **mueve el nivel de manera permanente**. Por eso la serie no tiene un nivel al cual regresar, su varianza crece con el tiempo y su ACF baja muy despacio. Las pruebas ADF y KPSS [[pruebas]] existen justamente para decidir si hay raíz unitaria.
:::

:::demo ¿Cuánto tarda un choque en reducirse a la mitad? {#vida-media}
Sin más choques, un impulso de tamaño 1 en $t = 0$ vale $\phi^h$ después de $h$ periodos (respuesta al impulso).

:::pasos
= \phi^h = \tfrac12
> Buscamos el $h$ en el que el efecto se reduce a la mitad.
= h\,\ln\phi = \ln\tfrac12
> Aplicamos logaritmo: $\ln(a^r) = r\ln a$ [[log-producto]].
= h = \frac{\ln(0.5)}{\ln(\phi)}
> Despejamos. Con $\phi = 0.5$: $h = 1$. Con $\phi = 0.9$: $h = -0.693/-0.105 = 6.58$. Con $\phi = 0.99$: $h = 69$. Con $\phi = 1$: $\ln 1 = 0$ y $h = \infty$.
:::
:::

:::ejemplo Un choque de 10 unidades
| periodos después | $\phi = 0.5$ | $\phi = 0.9$ | $\phi = 1$ |
|---|---|---|---|
| 0 | 10 | 10 | 10 |
| 1 | 5 | 9 | 10 |
| 2 | 2.5 | 8.1 | 10 |
| 3 | 1.25 | 7.29 | 10 |
| 4 | 0.625 | 6.561 | 10 |

Con $\phi = 1$ el choque es **permanente**.
:::

:::interactivo choque | Respuesta a un choque y ubicación de la raíz
Elige $\phi$ y el tamaño del choque. A la izquierda, cómo se disipa (o no) el impulso; a la derecha, la raíz $z = 1/\phi$ y el círculo unitario.
:::

### Tendencia determinística vs. tendencia estocástica {#tendencias}

Dos series pueden crecer **en promedio igual** y, aun así, ser de naturaleza muy distinta.

:::cols
**Tendencia determinística** (estacionaria en tendencia)

$$y_t = \tip{a}{a} + \tip{b}{b}\,t + \varepsilon_t$$

- $\E[y_t] = a + b\,t$: la media cambia ⇒ no estacionaria.
- $\Var(y_t) = \sigma^2$: constante.
- Los choques son **temporales**: la serie regresa a la recta.
- Se arregla **restando la recta** (regresión sobre $t$).
+++
**Tendencia estocástica** (estacionaria en diferencias)

$$y_t = b + y_{t-1} + \varepsilon_t$$

- Paseo aleatorio **con deriva** $b$.
- $y_t = y_0 + b\,t + \sum_{j=1}^{t}\varepsilon_j$.
- $\E[y_t] = y_0 + b\,t$ y $\Var(y_t) = t\,\sigma^2$.
- Los choques son **permanentes**.
- Se arregla **diferenciando**: $\Delta y_t = b + \varepsilon_t$.
:::

:::demo Paseo con deriva: forma cerrada y diferencia {#deriva-demo}
:::pasos
= y_t = b + y_{t-1} + \varepsilon_t = b + (b + y_{t-2} + \varepsilon_{t-1}) + \varepsilon_t
> Sustituimos $y_{t-1}$.
= y_t = y_0 + b\,t + \sum_{j=1}^{t}\varepsilon_j
> Tras $t$ sustituciones se acumulan $t$ derivas y $t$ choques (igual que en [[paseo-demo]]).
= \Delta y_t = y_t - y_{t-1} = b + \varepsilon_t
> Al restar dos periodos consecutivos, todo lo acumulado se cancela salvo la deriva y el choque nuevo.
= \E[\Delta y_t] = b,\quad \Var(\Delta y_t) = \sigma^2,\quad \Cov(\Delta y_t, \Delta y_{t-k}) = 0
> La diferencia es ruido blanco más una constante: **estacionaria** [[rb-estacionario]].
:::
:::

¿Y si aplicamos el tratamiento **equivocado**?

:::demo Diferenciar una tendencia determinística crea autocorrelación artificial {#sobre-diferenciar}
:::pasos
= \Delta y_t = \big(a + b\,t + \varepsilon_t\big) - \big(a + b(t-1) + \varepsilon_{t-1}\big)
> Restamos el modelo evaluado en $t$ y en $t - 1$.
= = b + \varepsilon_t - \varepsilon_{t-1} = b + \tip{u-ma}{u_t}
> $a$ se cancela y $bt - b(t-1) = b$. Llamamos $u_t = \varepsilon_t - \varepsilon_{t-1}$.
= \Var(u_t) = \Var(\varepsilon_t) + \Var(\varepsilon_{t-1}) = 2\sigma^2
> Choques no correlacionados [[cov-prop]]: la varianza **se duplica** (diferenciar de más mete ruido).
= \Cov(u_t, u_{t-1}) = \Cov(\varepsilon_t - \varepsilon_{t-1},\; \varepsilon_{t-1} - \varepsilon_{t-2}) = -\Var(\varepsilon_{t-1}) = -\sigma^2
> Desarrollamos con la regla 4 de [[cov-prop]]: el único término que no es 0 es el del choque compartido $\varepsilon_{t-1}$, con signo menos.
= \rho_u(1) = \frac{-\sigma^2}{2\sigma^2} = -\frac12, \qquad \rho_u(k) = 0 \;\;(k \ge 2)
> **Sobre-diferenciar** deja una autocorrelación de −0.5 en el rezago 1 que no existía en los datos.
:::

Al revés, si a un paseo con deriva le **restas una recta**, queda $\sum_{j=1}^{t}\varepsilon_j$: otro paseo aleatorio, con varianza $t\sigma^2$. Sigue sin ser estacionario.
:::

:::ejemplo Mismos choques, dos tendencias
Choques $\varepsilon = (0.5,\, -1,\, 1,\, 0,\, -0.5)$, $a = y_0 = 5$ y $b = 2$.

| $t$ | determinística $5 + 2t + \varepsilon_t$ | estocástica $2 + y_{t-1} + \varepsilon_t$ |
|---|---|---|
| 1 | $7 + 0.5 = 7.5$ | $2 + 5 + 0.5 = 7.5$ |
| 2 | $9 - 1 = 8$ | $2 + 7.5 - 1 = 8.5$ |
| 3 | $11 + 1 = 12$ | $2 + 8.5 + 1 = 11.5$ |
| 4 | $13 + 0 = 13$ | $2 + 11.5 + 0 = 13.5$ |
| 5 | $15 - 0.5 = 14.5$ | $2 + 13.5 - 0.5 = 15$ |

En la determinística, el choque de $t = 2$ ($-1$) solo afecta a $t = 2$. En la estocástica ese $-1$ se queda en todos los periodos siguientes. Diferencias: determinística $\Delta y = (0.5,\, 4,\, 1,\, 1.5)$, que oscila de más (es $2 + \varepsilon_t - \varepsilon_{t-1}$); estocástica $\Delta y = (1,\, 3,\, 2,\, 1.5)$, que es exactamente $2 + \varepsilon_t$.
:::

:::interactivo tendencias | ¿Restar la recta o diferenciar?
Las dos series usan los **mismos choques**. Aplica cada tratamiento a cada serie y mira el resultado y su $\hat\rho(1)$. Solo una combinación por serie deja ruido estacionario y bien portado.
:::

### La diferenciación {#diferenciacion}

:::definicion Operadores de diferencia
$$\Delta y_t = y_t - y_{t-1} = (1 - L)\,y_t \qquad \Delta^2 y_t = \Delta(\Delta y_t) \qquad \Delta_{\tip{s}{s}}\,y_t = y_t - y_{t-s}$$

- $\Delta$: cambio respecto al periodo anterior. Elimina una tendencia lineal o una raíz unitaria.
- $\Delta^2$: la diferencia de la diferencia. Elimina una tendencia cuadrática (o dos raíces unitarias).
- $\Delta_s$: **diferencia estacional**, compara con la misma temporada del ciclo anterior ($s = 12$ en datos mensuales).
- Cada diferencia **pierde** datos: $\Delta$ pierde 1, $\Delta^2$ pierde 2 y $\Delta_s$ pierde $s$.
:::

:::demo Qué elimina cada diferencia {#dif-demo}
**Recta.** Si $y_t = a + b\,t$: $\Delta y_t = (a + bt) - (a + b(t-1)) = b$, una constante.

**Parábola.** Si $y_t = a + b\,t + c\,t^2$:

:::pasos
= \Delta y_t = b\,\big(t - (t-1)\big) + c\,\big(t^2 - (t-1)^2\big)
> $a$ se cancela; agrupamos los términos de $b$ y de $c$.
= = b + c\,(2t - 1)
> $t^2 - (t^2 - 2t + 1) = 2t - 1$: queda una **recta** en $t$.
= \Delta^2 y_t = \big(b + c(2t - 1)\big) - \big(b + c(2(t-1) - 1)\big) = 2c
> Diferenciar otra vez la recta deja una constante.
:::

**Estacionalidad fija.** Si $S_t = S_{t-s}$ (el patrón se repite), entonces $\Delta_s S_t = S_t - S_{t-s} = 0$: la diferencia estacional la borra.
:::

:::ejemplo Diferencias a mano
Con $y = (10,\, 12,\, 15,\, 14,\, 18)$:

- $\Delta y = (12 - 10,\; 15 - 12,\; 14 - 15,\; 18 - 14) = (2,\, 3,\, -1,\, 4)$
- $\Delta^2 y = (3 - 2,\; -1 - 3,\; 4 - (-1)) = (1,\, -4,\, 5)$

Con la serie trimestral de [[descomposicion]], $\Delta_4 y = (28 - 24,\; 21 - 18,\; 18 - 14,\; 30 - 26,\; \dots) = (4,\, 3,\, 4,\, 4,\, 3,\, 4,\, 3,\, 4)$: el patrón estacional desapareció y queda casi constante (el crecimiento anual).
:::

```python
y = pd.Series([10, 12, 15, 14, 18])
print("Δy  :", y.diff().dropna().tolist())
print("Δ²y :", y.diff().diff().dropna().tolist())
trimestral = pd.Series([24, 18, 14, 26, 28, 21, 18, 30, 31, 25, 21, 34])
print("Δ₄y :", trimestral.diff(4).dropna().astype(int).tolist())
```

:::interactivo diferencias | Qué diferencia necesita cada serie
Elige una serie y aplica $\Delta$, $\Delta^2$ o $\Delta_s$. Busca la transformación **mínima** que deja algo estable: diferenciar de más también es un error [[sobre-diferenciar]].
:::

### Galería: ¿estacionaria o no? {#galeria}

:::interactivo galeria | Ocho procesos, tres condiciones
Para cada proceso verás la serie, su media móvil y su banda de ±2 desviaciones móviles, y el diagnóstico de qué condición falla.
:::

| Proceso | (1) media constante | (2) varianza constante | (3) γ depende solo de $k$ | ¿Estacionario? |
|---|---|---|---|---|
| Ruido blanco | ✓ | ✓ | ✓ | **Sí** |
| AR(1), $\phi = 0.6$ | ✓ | ✓ | ✓ | **Sí** |
| AR(1), $\phi = 0.97$ | ✓ | ✓ | ✓ | **Sí**, aunque muy persistente |
| Paseo aleatorio | ✓ ($y_0$) | ✗ ($t\sigma^2$) | ✗ | No |
| Tendencia determinística | ✗ ($a + bt$) | ✓ | ✓ | No (sí lo es alrededor de su tendencia) |
| Varianza creciente | ✓ | ✗ | ✗ | No |
| Estacionalidad determinística | ✗ ($\mu + S_t$) | ✓ | ✓ | No |
| Ruptura en la media | ✗ (salto) | ✓ | ✓ | No |

:::resumen Lo esencial de la sección 5
- Débilmente estacionaria = media constante + varianza constante + autocovarianza que depende solo del rezago.
- Ruido blanco: estacionario y sin memoria. AR(1) con $|\phi| < 1$: estacionario con $\mu = \frac{c}{1-\phi}$, $\gamma(0) = \frac{\sigma^2}{1-\phi^2}$ y $\rho(k) = \phi^k$.
- Paseo aleatorio ($\phi = 1$): raíz unitaria, $\Var(y_t) = t\sigma^2$, choques permanentes.
- Tendencia determinística ⇒ restar la recta; estocástica ⇒ diferenciar. Sobre-diferenciar crea $\rho(1) = -0.5$.
:::
