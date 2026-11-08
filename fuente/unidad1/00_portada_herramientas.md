<section class="portada" id="inicio">
<span class="etiqueta">📘 Guía de estudio · ETS de Análisis de Series de Tiempo</span>
<h1>Unidad I · Características de series de tiempo</h1>
<p class="bajada">Qué es una serie de tiempo, cómo se descompone, qué significa que sea estacionaria y cómo comprobarlo con ADF, KPSS, ACF, PACF y Ljung–Box. Todo explicado desde cero y sin saltarse pasos.</p>
<ul class="insignias"><li>🔍 Demostraciones paso a paso</li><li>✍️ Ejemplos resueltos a mano</li><li>🐍 Código Python con su salida real</li><li>🎛️ Gráficas interactivas</li><li>🧩 Ejercicios con botón de respuesta</li></ul>
<div class="como-usar">
<div class="tarjeta"><h3>🖱️ Pasa el cursor por las fórmulas</h3><p>Cada símbolo trae su explicación. Pruébalo aquí: $y_t = c + \phi\, y_{t-1} + \varepsilon_t$. En el celular, tócalo con el dedo.</p></div>
<div class="tarjeta"><h3>↩ Enlaces para repasar</h3><p>Las etiquetas moradas (↩) te regresan a donde ya se explicó algo; las azules (↪) te adelantan. Al saltar aparece el botón <b>⤺ Volver</b> para regresar exactamente a donde ibas.</p></div>
<div class="tarjeta"><h3>🎨 Cada color es un tipo de bloque</h3><div class="leyenda"><span style="background:var(--lavanda-f);border-color:var(--lavanda)">📘 Definición</span><span style="background:var(--mantequilla-f);border-color:var(--mantequilla)">💡 Intuición</span><span style="background:var(--celeste-f);border-color:var(--celeste)">🔍 Demostración</span><span style="background:var(--durazno-f);border-color:var(--durazno)">✍️ Ejemplo a mano</span><span style="background:var(--rosa-f);border-color:var(--rosa)">🎛️ Interactivo</span><span style="background:var(--coral-f);border-color:var(--coral)">⚠️ Cuidado</span><span style="background:var(--turquesa-f);border-color:var(--turquesa)">💬 Duda frecuente</span><span style="background:var(--verde-f);border-color:var(--verde)">✅ Resumen</span></div></div>
</div>
<h3 style="margin:22px 0 4px;font-size:1.2rem">🗺️ Mapa de la unidad</h3>
<div class="mapa">@@MAPA@@</div>
</section>

## 🧰 Caja de herramientas matemáticas {#herramientas}
@mapa Notación, sumatoria, esperanza, varianza, covarianza, logaritmos y serie geométrica: lo que usan todas las demostraciones.

Antes de hablar de series de tiempo conviene tener a la mano **unas pocas reglas** de álgebra y probabilidad. Todas las demostraciones de la unidad se construyen con ellas, y cada vez que se use una verás un enlace ↩ que te trae de regreso a esta sección. Si ya las dominas, puedes saltar directo a [[serie]].

### Cómo se lee la notación {#notacion}

Una **serie de tiempo** es una lista de números ordenados en el tiempo. Para hablar de ella sin escribir todos los números usamos una letra con un **subíndice**:

:::definicion El subíndice t
$$\tip{yt}{y_t} = \text{valor de la serie en el periodo } \tip{t}{t}, \qquad \tip{t}{t} = 1, 2, \dots, \tip{n}{n}$$

- $y$ es **qué** medimos (ventas, pasajeros, temperatura…).
- $t$ es **cuándo** (el número del periodo: 1, 2, 3…).
- $n$ es **cuántos** datos tenemos.
:::

:::ejemplo Leer una serie con subíndices
Supón que estas son las ventas (en miles) de una tienda durante 6 meses:

| Mes | ene | feb | mar | abr | may | jun |
|---|---|---|---|---|---|---|
| $t$ | 1 | 2 | 3 | 4 | 5 | 6 |
| $y_t$ | 12 | 15 | 14 | 18 | 17 | 20 |

Entonces $y_1 = 12$ (enero), $y_3 = 14$ (marzo) y $y_6 = 20$ (junio). Como hay 6 datos, $n = 6$.

Si «estamos parados» en abril ($t = 4$):

- $y_t = y_4 = 18$ es el valor **actual**;
- $y_{t-1} = y_3 = 14$ es el valor **un periodo antes** (rezago 1);
- $y_{t-2} = y_2 = 15$ es el valor **dos periodos antes** (rezago 2).
:::

Otros adornos que verás todo el tiempo:

| Notación | Se lee | Significado |
|---|---|---|
| $y_{t-k}$ | «y en t menos k» | el valor $k$ periodos antes (rezago $k$) |
| $\bar{y}$ | «y barra» | el promedio de los datos |
| $\hat{\phi}$ | «fi gorro» | el gorro indica **estimación** hecha con datos; sin gorro es el valor **verdadero** (teórico) |
| $\Delta y_t$ | «delta y t» | el cambio $y_t - y_{t-1}$ |
| $\E[\,\cdot\,]$ | «esperanza de…» | el promedio teórico (lo vemos en [[esperanza]]) |

Y las letras griegas más usadas en la unidad (pasa el cursor sobre cada una):

| Letra | Nombre | Para qué la usamos |
|---|---|---|
| $\mu$ | mu | media (esperanza) del proceso |
| $\sigma^2$ | sigma cuadrada | varianza |
| $\gamma(k)$ | gamma | autocovarianza en el rezago $k$ |
| $\rho(k)$ | ro | autocorrelación en el rezago $k$ |
| $\varepsilon_t$ | épsilon | choque aleatorio (ruido blanco) |
| $\phi$ | fi | coeficiente autorregresivo |
| $\delta$, $\tau$ | delta, tau | coeficiente y estadístico de Dickey–Fuller |
| $\eta$ | eta | estadístico KPSS |

### La sumatoria Σ paso a paso {#sumatoria}

:::definicion Sumatoria
$$\sum_{t=1}^{\tip{n}{n}} y_t = y_1 + y_2 + \dots + y_n$$

Se lee «la suma de $y_t$ desde $t = 1$ hasta $t = n$». El número de abajo es **dónde empiezas**, el de arriba **dónde terminas**, y lo de la derecha es **lo que sumas** en cada paso.
:::

:::guiado Sumatorias con números
Datos: $y_1 = 3,\; y_2 = 5,\; y_3 = 2,\; y_4 = 6$.

| $t$ | $y_t$ | $y_{t-1}$ | $y_t\,y_{t-1}$ |
|---|---|---|---|
| 1 | 3 | — | — |
| 2 | 5 | 3 | 15 |
| 3 | 2 | 5 | 10 |
| 4 | 6 | 2 | 12 |
---
= \sum_{t=1}^{4} y_t = y_1 + y_2 + y_3 + y_4 = 3 + 5 + 2 + 6 = 16
> Se sustituye $t = 1, 2, 3, 4$ y se suman los cuatro valores de la columna $y_t$.
@ usa c2[1-4]
= \sum_{t=2}^{4} y_t = y_2 + y_3 + y_4 = 5 + 2 + 6 = 13
> Ahora empieza en $t = 2$: solo entran **tres** renglones. Ojo con el índice de abajo.
@ usa c2[2-4]
= y_{t-1} = (\text{—},\; 3,\; 5,\; 2)
> El rezago de cada renglón es el valor del renglón **anterior**. En $t = 1$ no existe, porque $y_0$ no se observó.
@ usa c2[1-3]; da c3[2-4]
= \sum_{t=2}^{4} y_t\,y_{t-1} = 5\cdot 3 + 2\cdot 5 + 6\cdot 2 = 15 + 10 + 12 = 37
> Cada término multiplica un valor por el anterior. Es exactamente la forma de la autocovarianza [[autocov]].
@ usa c2[2-4] c3[2-4]; da c4[2-4]
:::

:::duda ¿Por qué tantas fórmulas «suman»?
Porque sumar es la forma de **juntar la información de todas las observaciones**. Un promedio es una suma dividida entre $n$; la varianza es el promedio de distancias al cuadrado; la autocovarianza es el promedio de productos $(y_t - \bar y)(y_{t-k} - \bar y)$. En cada caso la suma recorre **todos** los periodos y la división convierte el total en un promedio. Cuando veas una Σ, pregúntate: *¿qué estoy sumando en cada periodo y entre cuánto voy a dividir?*
:::

Tres propiedades que usaremos sin parar:

:::demo Propiedades de la sumatoria {#prop-suma}
**(a) Una constante sale de la suma.**

:::pasos
= \sum_{t=1}^{n} c\,x_t = c x_1 + c x_2 + \dots + c x_n
> Escribimos la suma completa: cada término trae la constante $c$.
= = c\,(x_1 + x_2 + \dots + x_n)
> Factorizamos $c$ (propiedad distributiva).
= = c \sum_{t=1}^{n} x_t
> Lo de adentro del paréntesis es otra vez una sumatoria.
:::

**(b) La suma de una suma se separa.**

:::pasos
= \sum_{t=1}^{n} (x_t + z_t) = (x_1 + z_1) + (x_2 + z_2) + \dots + (x_n + z_n)
> Escribimos todos los términos.
= = (x_1 + \dots + x_n) + (z_1 + \dots + z_n) = \sum_{t=1}^{n} x_t + \sum_{t=1}^{n} z_t
> Reacomodamos: en una suma el orden no importa (propiedad conmutativa y asociativa).
:::

**(c) Sumar una constante n veces da n por la constante.**

:::pasos
= \sum_{t=1}^{n} c = \underbrace{c + c + \dots + c}_{n \text{ veces}} = n\,c
> No hay nada que dependa de $t$: se repite el mismo número $n$ veces.
:::
:::

:::demo Las desviaciones respecto a la media siempre suman cero {#suma-desv}
Este resultado aparece en la varianza, la autocovarianza y la prueba KPSS.

:::pasos
= \bar{y} = \frac{1}{n}\sum_{t=1}^{n} y_t \quad\Longrightarrow\quad \sum_{t=1}^{n} y_t = n\,\bar{y}
> Definición de promedio; multiplicamos ambos lados por $n$.
= \sum_{t=1}^{n} (y_t - \bar{y}) = \sum_{t=1}^{n} y_t - \sum_{t=1}^{n} \bar{y}
> Separamos la suma con la propiedad (b).
= = n\,\bar{y} - n\,\bar{y}
> El primer término es $n\bar y$ (paso 1). El segundo suma la constante $\bar y$ $n$ veces: propiedad (c).
= = 0
> Por eso las desviaciones positivas y negativas siempre se compensan.
:::

Con los números de arriba: $\bar y = 16/4 = 4$ y las desviaciones son $-1,\; 1,\; -2,\; 2$, que suman $0$. ✓
:::

### Variable aleatoria y esperanza {#esperanza}

:::definicion Variable aleatoria
Una **variable aleatoria** $X$ es una cantidad cuyo valor depende del azar: el resultado de un dado, la demanda de mañana, el error de un pronóstico. Antes de observarla solo conocemos **qué valores puede tomar** y **con qué probabilidad**.
:::

:::definicion Esperanza (valor esperado)
Si $X$ toma los valores $\tip{xj}{x_j}$ con probabilidades $\tip{pj}{p_j}$:

$$\E[\tip{X}{X}] = \sum_{j} \tip{xj}{x_j}\,\tip{pj}{p_j} = \mu$$

Es un **promedio ponderado** de los valores posibles: cada valor pesa según qué tan probable es. Intuitivamente, es el promedio que obtendrías si repitieras el experimento infinitas veces.
:::

:::ejemplo Esperanza de un dado
Un dado justo toma los valores $1, \dots, 6$, cada uno con probabilidad $1/6$:

:::pasos
= \E[X] = 1\cdot\tfrac16 + 2\cdot\tfrac16 + 3\cdot\tfrac16 + 4\cdot\tfrac16 + 5\cdot\tfrac16 + 6\cdot\tfrac16
> Aplicamos la definición: valor × probabilidad, para cada valor.
= = \frac{1 + 2 + 3 + 4 + 5 + 6}{6} = \frac{21}{6} = 3.5
> Como todas las probabilidades son iguales, sacamos $\tfrac16$ como factor común.
:::

Ningún lanzamiento da 3.5, pero **en promedio** eso es lo que sale. La esperanza no es «el valor más probable», es el centro de gravedad.
:::

:::demo La esperanza es lineal {#linealidad}
**(a)** $\E[aX + b] = a\,\E[X] + b$ para constantes $a$ y $b$.

:::pasos
= \E[aX + b] = \sum_j (a x_j + b)\,p_j
> Definición de esperanza aplicada a la nueva variable $aX + b$: sus valores son $a x_j + b$ con las mismas probabilidades.
= = \sum_j a\,x_j\,p_j + \sum_j b\,p_j
> Distribuimos $p_j$ y separamos la suma [[prop-suma]].
= = a\sum_j x_j\,p_j + b\sum_j p_j
> Las constantes $a$ y $b$ salen de la suma [[prop-suma]].
= = a\,\E[X] + b \cdot 1
> La primera suma es la definición de $\E[X]$; las probabilidades suman 1.
:::

**(b)** $\E[X + Y] = \E[X] + \E[Y]$ siempre (sean o no independientes). Se demuestra igual, separando la suma doble sobre las probabilidades conjuntas. **(c)** La esperanza de una constante es la constante: $\E[c] = c$ (es el caso $a = 0$ de (a)).
:::

Con el dado: $\E[2X + 1] = 2(3.5) + 1 = 8$. No hace falta recalcular nada.

### Varianza y sus propiedades {#varianza-prop}

:::definicion Varianza
$$\Var(X) = \E\big[(X - \mu)^2\big], \qquad \sigma = \sqrt{\Var(X)}$$

- $X - \mu$: qué tan lejos cae cada valor de la media.
- Se eleva **al cuadrado** para que las distancias negativas no cancelen a las positivas (recuerda [[suma-desv]]: sin cuadrado, el promedio de las desviaciones sería 0).
- $\E[\cdot]$: se promedian esas distancias al cuadrado.
:::

:::demo Dos fórmulas útiles {#var-prop}
**(a) Atajo de cálculo:** $\Var(X) = \E[X^2] - \mu^2$.

:::pasos
= \Var(X) = \E\big[(X-\mu)^2\big] = \E\big[X^2 - 2\mu X + \mu^2\big]
> Desarrollamos el binomio al cuadrado $(a-b)^2 = a^2 - 2ab + b^2$.
= = \E[X^2] - 2\mu\,\E[X] + \mu^2
> Linealidad de la esperanza [[linealidad]]: $\mu$ es una constante.
= = \E[X^2] - 2\mu^2 + \mu^2 = \E[X^2] - \mu^2
> Sustituimos $\E[X] = \mu$ y simplificamos.
:::

**(b) Cambio de escala:** $\Var(aX + b) = a^2\,\Var(X)$.

:::pasos
= \E[aX + b] = a\mu + b
> Linealidad [[linealidad]].
= \Var(aX+b) = \E\big[(aX + b - (a\mu + b))^2\big]
> Definición de varianza con la nueva media.
= = \E\big[(aX - a\mu)^2\big] = \E\big[a^2 (X-\mu)^2\big]
> La $b$ se cancela y factorizamos $a$ dentro del cuadrado.
= = a^2\,\E\big[(X-\mu)^2\big] = a^2 \Var(X)
> La constante $a^2$ sale de la esperanza.
:::

Consecuencias: **sumar una constante no cambia la dispersión** ($b$ desapareció) y una constante tiene varianza 0.
:::

:::ejemplo Varianza de un dado
:::pasos
= \E[X^2] = \frac{1^2 + 2^2 + 3^2 + 4^2 + 5^2 + 6^2}{6} = \frac{91}{6} \approx 15.1667
> Promedio de los cuadrados (cada valor tiene probabilidad $1/6$).
= \Var(X) = \E[X^2] - \mu^2 = \frac{91}{6} - 3.5^2 = 15.1667 - 12.25 = 2.9167
> Atajo (a).
= \Var(2X + 1) = 2^2 \times 2.9167 = 11.6667
> Propiedad (b): el $+1$ no influye y el 2 se eleva al cuadrado.
:::
:::

### Covarianza y correlación {#covarianza}

:::definicion Covarianza
$$\Cov(X, Y) = \E\big[(X - \mu_X)(Y - \mu_Y)\big]$$

- Si cuando $X$ está **arriba** de su media $Y$ también suele estar **arriba**, los productos son positivos ⇒ covarianza **positiva**.
- Si cuando una sube la otra baja, los productos son negativos ⇒ covarianza **negativa**.
- Si no hay relación lineal, los productos se compensan ⇒ covarianza **cercana a 0**.
:::

:::demo Reglas de la covarianza {#cov-prop}
Todas salen de la definición y de la linealidad [[linealidad]]:

1. $\Cov(X, X) = \E[(X-\mu_X)^2] = \Var(X)$.
2. $\Cov(X, Y) = \Cov(Y, X)$ (el orden de un producto no importa).
3. $\Cov(aX + b,\; cY + d) = ac\,\Cov(X, Y)$ (las constantes sumadas desaparecen, las que multiplican salen).
4. $\Cov(X + Y,\; Z) = \Cov(X, Z) + \Cov(Y, Z)$ (se reparte como una multiplicación).
5. Si $X$ y $Y$ son **independientes**, $\E[XY] = \E[X]\E[Y]$ y por eso $\Cov(X, Y) = 0$.

Con ellas demostramos la fórmula clave para sumar variables aleatorias:

:::pasos
= \Var(X + Y) = \Cov(X + Y,\; X + Y)
> Regla 1: la varianza es la covarianza de una variable consigo misma.
= = \Cov(X, X) + \Cov(X, Y) + \Cov(Y, X) + \Cov(Y, Y)
> Regla 4 aplicada dos veces (como desarrollar $(a+b)(a+b)$).
= = \Var(X) + \Var(Y) + 2\,\Cov(X, Y)
> Reglas 1 y 2.
= \text{Si } X, Y \text{ son independientes:}\quad \Var(X + Y) = \Var(X) + \Var(Y)
> Regla 5: la covarianza vale 0. Este resultado explica por qué la varianza del paseo aleatorio crece con $t$ [[paseo]].
:::
:::

:::definicion Correlación
$$\Corr(X, Y) = \frac{\Cov(X, Y)}{\sigma_X\,\sigma_Y}$$

Es la covarianza **sin unidades**: dividir entre las desviaciones estándar la pone en una escala fija de $-1$ a $1$.
:::

:::demo La correlación siempre está entre −1 y 1 {#corr-acotada}
Llamemos $Z_X = X/\sigma_X$ y $Z_Y = Y/\sigma_Y$. Por [[var-prop]] (b), $\Var(Z_X) = \Var(X)/\sigma_X^2 = 1$ y lo mismo $\Var(Z_Y) = 1$. Además, por la regla 3, $\Cov(Z_X, Z_Y) = \Cov(X,Y)/(\sigma_X\sigma_Y) = \Corr(X, Y)$.

:::pasos
= 0 \le \Var(Z_X + Z_Y) = \Var(Z_X) + \Var(Z_Y) + 2\Cov(Z_X, Z_Y)
> Una varianza nunca es negativa (es un promedio de cuadrados); luego aplicamos [[cov-prop]].
= 0 \le 1 + 1 + 2\,\Corr(X, Y) \;\Longrightarrow\; \Corr(X, Y) \ge -1
> Sustituimos y despejamos.
= 0 \le \Var(Z_X - Z_Y) = 1 + 1 - 2\,\Corr(X, Y) \;\Longrightarrow\; \Corr(X, Y) \le 1
> Mismo razonamiento con la resta (la regla 3 con $c = -1$ cambia el signo de la covarianza).
:::

Por eso cualquier **autocorrelación** $\rho(k)$ también vive entre $-1$ y $1$ [[autocorr]].
:::

:::guiado Covarianza y correlación con 4 datos
| $i$ | $x_i$ | $y_i$ | $x_i - \bar x$ | $y_i - \bar y$ | producto | $(x_i-\bar x)^2$ | $(y_i - \bar y)^2$ |
|---|---|---|---|---|---|---|---|
| 1 | 1 | 2 | −1.5 | −3 | 4.5 | 2.25 | 9 |
| 2 | 2 | 4 | −0.5 | −1 | 0.5 | 0.25 | 1 |
| 3 | 3 | 5 | 0.5 | 0 | 0 | 0.25 | 0 |
| 4 | 4 | 9 | 1.5 | 4 | 6 | 2.25 | 16 |
| **Suma** | 10 | 20 | 0 | 0 | **11** | **5** | **26** |
---
= \bar x = \frac{1 + 2 + 3 + 4}{4} = \frac{10}{4} = 2.5, \qquad \bar y = \frac{2 + 4 + 5 + 9}{4} = \frac{20}{4} = 5
> Sumamos cada columna de datos y dividimos entre $n = 4$.
@ usa c2[1-4] c3[1-4]; da c2[5] c3[5]
= x_i - 2.5 = (-1.5,\, -0.5,\, 0.5,\, 1.5), \qquad y_i - 5 = (-3,\, -1,\, 0,\, 4)
> A cada dato le restamos su media. Las dos columnas de desviaciones suman 0 [[suma-desv]].
@ usa c2[1-4] c3[1-4] c2[5] c3[5]; da c4[1-5] c5[1-5]
= (x_i - \bar x)(y_i - \bar y) = (4.5,\; 0.5,\; 0,\; 6)
> Multiplicamos renglón por renglón: $(-1.5)(-3) = 4.5$, $(-0.5)(-1) = 0.5$, $(0.5)(0) = 0$, $(1.5)(4) = 6$.
@ usa c4[1-4] c5[1-4]; da c6[1-4]
= \widehat{\Cov}(x,y) = \frac{4.5 + 0.5 + 0 + 6}{4} = \frac{11}{4} = 2.75
> Promedio de los productos (dividimos entre $n = 4$).
@ usa c6[1-4]; da c6[5]
= \hat\sigma_x^2 = \frac{2.25 + 0.25 + 0.25 + 2.25}{4} = \frac{5}{4} = 1.25, \qquad \hat\sigma_y^2 = \frac{9 + 1 + 0 + 16}{4} = \frac{26}{4} = 6.5
> Elevamos al cuadrado cada desviación y promediamos.
@ usa c4[1-4] c5[1-4]; da c7[1-5] c8[1-5]
= \widehat{\Corr}(x, y) = \frac{2.75}{\sqrt{1.25}\,\sqrt{6.5}} = \frac{2.75}{2.8504} = 0.9648
> Covarianza entre el producto de las desviaciones estándar: correlación muy alta y positiva.
@ usa c6[5] c7[5] c8[5]
:::

### Logaritmos {#logaritmos}

:::definicion Logaritmo natural
$\ln(a)$ es el número al que hay que elevar $e \approx 2.71828$ para obtener $a$:

$$\tip{ln}{\ln}(a) = x \quad\Longleftrightarrow\quad \tip{e-euler}{e}^{x} = a \qquad (a > 0)$$
:::

:::demo El logaritmo convierte productos en sumas {#log-producto}
:::pasos
= a = e^{\ln a}, \qquad b = e^{\ln b}
> Por definición, $e$ elevado al logaritmo de un número regresa el número.
= a\,b = e^{\ln a}\,e^{\ln b} = e^{\ln a + \ln b}
> Ley de los exponentes: al multiplicar potencias de la misma base, se suman los exponentes.
= \ln(a\,b) = \ln\big(e^{\ln a + \ln b}\big) = \ln a + \ln b
> Aplicamos $\ln$ a ambos lados; $\ln$ y $e^x$ se deshacen mutuamente.
:::

De la misma forma: $\ln(a/b) = \ln a - \ln b$ y $\ln(a^r) = r\ln a$. Esta propiedad es la razón por la que el logaritmo convierte un modelo **multiplicativo** en **aditivo** [[log]].
:::

:::intuicion Diferencias de logaritmos ≈ cambios porcentuales
Para cambios pequeños, $\ln(1 + x) \approx x$. Por eso

$$\ln(y_t) - \ln(y_{t-1}) = \ln\!\left(\frac{y_t}{y_{t-1}}\right) \approx \frac{y_t - y_{t-1}}{y_{t-1}}$$

Ejemplo: de 100 a 110, $\ln(110) - \ln(100) = 4.7005 - 4.6052 = 0.0953$, casi el $10\%$ de crecimiento. Trabajar en logaritmos es trabajar en **porcentajes**.
:::

### La serie geométrica {#geometrica}

Aparece al estudiar el modelo AR(1) [[ar1]], cuando los choques del pasado se van multiplicando por $\phi$ una y otra vez.

:::demo Suma de una serie geométrica {#geo-suma}
Queremos $\tip{S-geo}{S_k} = 1 + r + r^2 + \dots + r^{k-1}$ (son $k$ términos, cada uno es el anterior por $\tip{r-geo}{r}$).

:::pasos
= S_k = 1 + r + r^2 + \dots + r^{k-1}
> La suma que buscamos.
= r\,S_k = r + r^2 + r^3 + \dots + r^{k}
> Multiplicamos todo por $r$: cada término «avanza» una posición.
= S_k - r\,S_k = 1 - r^{k}
> Restamos: todos los términos intermedios se cancelan; solo sobreviven el primero de $S_k$ y el último de $rS_k$.
= S_k\,(1 - r) = 1 - r^k \;\Longrightarrow\; S_k = \frac{1 - r^k}{1 - r} \quad (r \ne 1)
> Factorizamos $S_k$ y despejamos.
= \text{Si } |r| < 1:\; \lim_{k\to\infty} r^k = 0 \;\Longrightarrow\; \sum_{j=0}^{\infty} r^j = \frac{1}{1 - r}
> Un número con valor absoluto menor que 1 elevado a potencias cada vez más grandes se hace cada vez más pequeño.
:::

Si $|r| \ge 1$ la suma infinita **no converge** (los términos no se hacen pequeños). Esta frontera $|r| = 1$ es exactamente la de la **raíz unitaria** [[raiz-unitaria]].
:::

:::ejemplo Con r = 0.5
:::pasos
= S_4 = 1 + 0.5 + 0.25 + 0.125 = 1.875
> Suma directa de los 4 primeros términos.
= S_4 = \frac{1 - 0.5^4}{1 - 0.5} = \frac{1 - 0.0625}{0.5} = \frac{0.9375}{0.5} = 1.875 \;✓
> Con la fórmula: el mismo resultado.
= \sum_{j=0}^{\infty} 0.5^j = \frac{1}{1 - 0.5} = 2
> La suma infinita se acerca a 2 sin pasarse.
:::

También usaremos la versión con $r = \phi^2$: $\sum_{j=0}^{\infty} \phi^{2j} = \dfrac{1}{1 - \phi^2}$ cuando $|\phi| < 1$.
:::

### La distribución normal y el famoso 1.96 {#normal}

:::definicion Normal estándar
$Z \sim N(0, 1)$ es la campana con media 0 y varianza 1. Dos números que debes recordar:

$$P(-\tip{z196}{1.96} < Z < \tip{z196}{1.96}) = 0.95, \qquad P(Z < -1.645) = 0.05$$

Si $X \sim N(\mu, \sigma^2)$, entonces $Z = (X - \mu)/\sigma \sim N(0, 1)$: restar la media y dividir entre la desviación estándar **estandariza** (usa [[var-prop]] (b)).
:::

:::ejemplo De dónde sale una banda ±1.96/√n
Si un estimador $\hat\rho$ se distribuye aproximadamente $N(0,\; 1/n)$, su desviación estándar es $\sqrt{1/n} = 1/\sqrt{n}$. Estandarizando:

:::pasos
= P\!\left(-1.96 < \frac{\hat\rho - 0}{1/\sqrt{n}} < 1.96\right) = 0.95
> Definición del 1.96 aplicada a $Z = \hat\rho\,/\,(1/\sqrt n)$.
= P\!\left(-\frac{1.96}{\sqrt n} < \hat\rho < \frac{1.96}{\sqrt n}\right) = 0.95
> Multiplicamos las desigualdades por $1/\sqrt{n}$ (positivo, no cambia el sentido).
= n = 100:\quad \pm\frac{1.96}{\sqrt{100}} = \pm\frac{1.96}{10} = \pm 0.196
> Con 100 datos, la banda va de −0.196 a 0.196.
:::

Estas son las **bandas de confianza** del correlograma [[bartlett]].
:::
