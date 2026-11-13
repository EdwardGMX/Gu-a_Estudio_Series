<section class="portada" id="inicio">
<span class="etiqueta">📗 Guía de estudio · ETS de Análisis de Series de Tiempo</span>
<h1>Unidad II · Procesos lineales en tiempo discreto</h1>
<p class="bajada">Cómo se construyen, se estiman, se revisan y se usan para pronosticar los modelos AR, MA, ARMA, ARIMA, SARIMA, ARMAX y SARIMAX. Cada idea se explica de varias formas: con una demostración paso a paso, con un ejemplo a mano, con código Python que se ejecuta de verdad y con una gráfica que puedes mover.</p>
<ul class="insignias"><li>🔍 Demostraciones sin saltarse pasos</li><li>✍️ Ejemplos a mano con la tabla iluminada</li><li>🐍 Código Python con su salida real</li><li>🎛️ Gráficas y simuladores interactivos</li><li>🧩 Ejercicios con botón de respuesta</li></ul>
<div class="como-usar">
<div class="tarjeta"><h3>🖱️ Pasa el cursor por las fórmulas</h3><p>Cada símbolo trae su explicación. Pruébalo con el modelo estrella de la unidad: $\phi(L)\,\Phi(L^{12})\,(1-L)(1-L^{12})\,y_t = \theta(L)\,\Theta(L^{12})\,\varepsilon_t$.</p></div>
<div class="tarjeta"><h3>⇠ Enlaces a la Unidad I</h3><p>Lo que ya estudiaste (ruido blanco, estacionariedad, ACF, PACF, Ljung–Box) aparece con etiquetas <b>⇠ Unidad I</b>. Los enlaces ↩ y ↪ te mueven dentro de esta unidad y el botón <b>⤺ Volver</b> te regresa a donde ibas.</p></div>
<div class="tarjeta"><h3>🎨 Cada color es un tipo de bloque</h3><div class="leyenda"><span style="background:var(--lavanda-f);border-color:var(--lavanda)">📘 Definición</span><span style="background:var(--mantequilla-f);border-color:var(--mantequilla)">💡 Intuición</span><span style="background:var(--celeste-f);border-color:var(--celeste)">🔍 Demostración</span><span style="background:var(--durazno-f);border-color:var(--durazno)">✍️ Ejemplo a mano</span><span style="background:var(--rosa-f);border-color:var(--rosa)">🎛️ Interactivo</span><span style="background:var(--coral-f);border-color:var(--coral)">⚠️ Cuidado</span><span style="background:var(--turquesa-f);border-color:var(--turquesa)">💬 Duda frecuente</span><span style="background:var(--verde-f);border-color:var(--verde)">✅ Resumen</span></div></div>
</div>
<div class="ruta">
<div class="ruta-paso"><b>0 · Poner la vara</b><span>Pronosticar con las referencias más simples y medir su error: lo que todo modelo debe superar.</span></div>
<div class="ruta-paso"><b>1 · Identificar</b><span>Transformar, diferenciar y leer ACF/PACF para proponer p, d, q, P, D, Q.</span></div>
<div class="ruta-paso"><b>2 · Estimar</b><span>Máxima verosimilitud; comparar candidatos con AIC y BIC.</span></div>
<div class="ruta-paso"><b>3 · Diagnosticar</b><span>Los residuos deben parecer ruido blanco: Ljung–Box, Jarque–Bera, ARCH-LM.</span></div>
<div class="ruta-paso"><b>4 · Pronosticar y validar</b><span>Respetar el orden del tiempo y medir el error con MAE, RMSE, MAPE, MASE.</span></div>
</div>
<h3 style="margin:22px 0 4px;font-size:1.2rem">🗺️ Mapa de la unidad</h3>
<div class="mapa">@@MAPA@@</div>
</section>

## 🧰 Repaso y herramientas para la Unidad II {#herramientas2}
@mapa Lo que necesitas de la Unidad I, el ruido blanco, la idea de filtro lineal, la notación nueva, números complejos y la esperanza condicional.

La Unidad I fue de **diagnóstico**: aprendimos a mirar una serie, a decidir si es estacionaria y a leer su memoria con la ACF y la PACF. La Unidad II es de **modelado**: vamos a escribir ecuaciones que generan series con esa memoria, a estimar sus parámetros con datos y a usarlas para pronosticar. Esta sección reúne todo lo que se usa después; cada vez que una demostración lo necesite habrá un enlace ↩ de regreso.

### Lo que necesitas de la Unidad I {#repaso-u1}

| Concepto | Para qué se usa en esta unidad | Repásalo |
|---|---|---|
| Ruido blanco | Es la «materia prima» de todos los modelos y lo que deben parecer los residuos | [[u1:ruido-blanco]] |
| Estacionariedad débil | ARMA solo describe series estacionarias; ARIMA convierte las que no lo son | [[u1:def-debil]] |
| AR(1) y su ACF $\rho(k) = \phi^k$ | Es el caso más sencillo del AR($p$) | [[u1:ar1]] |
| Paseo aleatorio y raíz unitaria | Son el ARIMA(0,1,0) y la razón de diferenciar | [[u1:raiz-unitaria]] |
| Diferencia regular y estacional | Son la «I» de ARIMA y la $D$ de SARIMA | [[u1:diferenciacion]] |
| Logaritmo | Estabiliza la varianza; ahora lo generalizamos con Box–Cox | [[u1:log]] |
| ACF y PACF | Son la herramienta de identificación de órdenes | [[u1:patrones]] |
| Ljung–Box | Se aplica a los residuos del modelo | [[u1:lb-h]] |
| Serie geométrica | Aparece al invertir polinomios y al sumar pesos $\psi$ | [[u1:geo-suma]] |
| Covarianza de sumas | Todas las fórmulas de varianza y ACF de esta unidad la usan | [[u1:cov-prop]] |

Antes de empezar, cargamos las librerías y la serie con la que trabajaremos todo el tiempo, **AirPassengers** (pasajeros mensuales de aerolíneas, 1949–1960):

```python
import warnings
import numpy as np
import pandas as pd
from scipy import stats
from statsmodels.tsa.arima_process import ArmaProcess
from statsmodels.tsa.statespace.sarimax import SARIMAX
from statsmodels.stats.diagnostic import acorr_ljungbox

pasajeros = [112, 118, 132, 129, 121, 135, 148, 148, 136, 119, 104, 118, 115, 126, 141, 135, 125, 149, 170, 170, 158, 133, 114, 140,
             145, 150, 178, 163, 172, 178, 199, 199, 184, 162, 146, 166, 171, 180, 193, 181, 183, 218, 230, 242, 209, 191, 172, 194,
             196, 196, 236, 235, 229, 243, 264, 272, 237, 211, 180, 201, 204, 188, 235, 227, 234, 264, 302, 293, 259, 229, 203, 229,
             242, 233, 267, 269, 270, 315, 364, 347, 312, 274, 237, 278, 284, 277, 317, 313, 318, 374, 413, 405, 355, 306, 271, 306,
             315, 301, 356, 348, 355, 422, 465, 467, 404, 347, 305, 336, 340, 318, 362, 348, 363, 435, 491, 505, 404, 359, 310, 337,
             360, 342, 406, 396, 420, 472, 548, 559, 463, 407, 362, 405, 417, 391, 419, 461, 472, 535, 622, 606, 508, 461, 390, 432]
serie = pd.Series(pasajeros, index=pd.date_range("1949-01-01", periods=144, freq="MS"), name="Passengers", dtype=float)
log_serie = np.log(serie)
print(serie.tail(3))
print("Frecuencia:", serie.index.freqstr, "| n =", len(serie))
```

### El ruido blanco: la pieza con la que se construye todo {#ruido-blanco2}

:::definicion Ruido blanco
Una serie $\varepsilon_t$ es **ruido blanco** con varianza $\sigma^2$, y se escribe $\varepsilon_t \sim \mathrm{RB}(0, \sigma^2)$, si cumple tres condiciones:

$$\E[\varepsilon_t] = 0, \qquad \Var(\varepsilon_t) = \sigma^2 \;(\text{constante}), \qquad \Cov(\varepsilon_t, \varepsilon_{t-k}) = 0 \;\text{ para todo } k \neq 0$$

Es decir: media cero, varianza constante y **ninguna autocorrelación**. Su ACF teórica vale 1 en el rezago 0 y 0 en todos los demás [[u1:rb-estacionario]].
:::

La guía oficial lo resume en una frase que vale la pena memorizar: **no esperamos que la serie original sea ruido blanco, pero sí que los residuos de un buen modelo se parezcan a ruido blanco.** El razonamiento es este:

1. Una serie real tiene **memoria**: lo de hoy se parece a lo de ayer (autocorrelación).
2. Un modelo intenta **capturar esa memoria** con una ecuación.
3. Lo que el modelo no logra explicar son los **residuos** $e_t = y_t - \hat{y}_t$.
4. Si en los residuos todavía hay autocorrelación, queda memoria **sin usar**: el pronóstico podría mejorar. Si los residuos son ruido blanco, ya no hay nada predecible que extraer.

:::intuicion Otra forma de verlo: el ruido blanco es «lo impredecible»
Imagina que te dan todos los valores pasados de un ruido blanco y te piden adivinar el siguiente. Como no está correlacionado con nada de su pasado, la mejor apuesta es siempre su media, 0, sin importar la historia. Por eso, cuando un modelo deja residuos que son ruido blanco, decimos que «exprimió» toda la información del pasado.
:::

:::interactivo w2-ruido | ¿Esto es ruido blanco? {#w-ruido}
Genera series con distintas distribuciones. Todas las opciones de la primera fila son ruido blanco; la opción «ARCH» también lo es, pero con una trampa que descubrirás en la vista extra. La opción «AR(1)» **no** es ruido blanco.
@@@
- **Arriba a la izquierda**: la serie. **Arriba a la derecha**: su histograma con la curva normal de la misma media y varianza.
- **Abajo**: la ACF con la banda $\pm 1.96/\sqrt n$ [[u1:bartlett]] y el p-value de Ljung–Box con $h = 10$ en la lectura.
- **Qué buscar**: en ruido blanco casi todas las barras quedan dentro de la banda (alrededor de 1 de cada 20 sale por azar) y el p-value de Ljung–Box es mayor que 0.05.
- **Vista extra**: la ACF de la serie **al cuadrado**. En el ruido blanco normal también es plana; en el ARCH no, porque la *varianza* tiene memoria aunque los valores no estén correlacionados. Lo estudiaremos en [[arch]].
:::

:::duda ¿El ruido blanco tiene que ser normal?
No. La definición solo pide media 0, varianza constante y autocorrelación cero; la distribución puede ser cualquiera (uniforme, t de Student…). Cuando además es normal se llama **ruido blanco gaussiano**, y en ese caso «no correlacionado» equivale a «independiente». La normalidad importa después, para que los **intervalos de pronóstico** con ±1.96 sean correctos; por eso se revisa con Jarque–Bera [[jarque-bera]].
:::

:::duda ¿No correlacionado es lo mismo que independiente?
No. «No correlacionado» solo descarta relaciones **lineales** entre $\varepsilon_t$ y $\varepsilon_{t-k}$. Puede quedar dependencia de otro tipo; el ejemplo clásico es la volatilidad: después de un choque grande suele venir otro grande (de cualquier signo). Los valores no se correlacionan, pero sus **cuadrados** sí. Eso es exactamente un proceso ARCH [[arch]].
:::

### La gran idea: una serie es un filtro de choques {#filtro-lineal}

Todos los modelos de esta unidad comparten una misma estructura. Se llaman **procesos lineales** porque escriben el valor de hoy como una **suma ponderada de choques** de ruido blanco:

:::definicion Proceso lineal (forma MA(∞))
$$y_t = \mu + \psi_0\,\varepsilon_t + \psi_1\,\varepsilon_{t-1} + \psi_2\,\varepsilon_{t-2} + \dots = \mu + \sum_{j=0}^{\infty} \psi_j\,\varepsilon_{t-j}, \qquad \psi_0 = 1$$

- $\varepsilon_t$ son los choques (ruido blanco): lo nuevo e impredecible de cada periodo.
- $\psi_j$ es el **peso** con que el choque de hace $j$ periodos sigue presente hoy.
- Para que la suma tenga sentido (varianza finita) se pide $\sum \psi_j^2 < \infty$: los pesos deben apagarse.
:::

El **teorema de Wold** dice que *cualquier* serie débilmente estacionaria (sin partes perfectamente predecibles) puede escribirse así. Por eso los modelos AR, MA y ARMA son tan generales: son maneras **económicas** de describir los pesos $\psi_j$ con pocos parámetros.

| Modelo | Pesos $\psi_j$ | Cuántos parámetros |
|---|---|---|
| MA(1) | $1,\ \theta,\ 0,\ 0, \dots$ (se cortan) | 1 |
| AR(1) | $1,\ \phi,\ \phi^2,\ \phi^3, \dots$ (decaen geométricamente) [[u1:ar1-sustitucion]] | 1 |
| ARMA(1,1) | $1,\ \phi + \theta,\ \phi(\phi + \theta),\ \phi^2(\phi + \theta), \dots$ | 2 |
| Paseo aleatorio | $1,\ 1,\ 1,\ 1, \dots$ (nunca se apagan: **no** estacionario) | 0 |

:::interactivo w2-wold | Choques → filtro → serie {#w-wold}
Arriba está la serie que resulta de sumar choques ponderados. Abajo a la izquierda, los choques $\varepsilon_t$ (barras); abajo a la derecha, los pesos $\psi_j$ del modelo que elijas. Mueve el instante $t$ para ver qué choques forman ese valor.
@@@
- **Barras (abajo a la izquierda)**: los choques; los que alimentan al instante elegido se pintan de rosa con una intensidad proporcional a su peso.
- **Tallos (abajo a la derecha)**: los pesos $\psi_0, \psi_1, \dots$ Fíjate en su forma: se cortan (MA), decaen (AR) u oscilan (AR(2) con raíces complejas).
- **Arriba**: la serie. El punto rosa es $y_t$ en el instante elegido.
- **Vista extra**: la cuenta completa de $y_t = \sum \psi_j \varepsilon_{t-j}$, renglón por renglón. Con el paseo aleatorio los pesos nunca se apagan: todos los choques del pasado siguen contando igual.
:::

:::ejemplo Construir un valor con la fórmula de filtro
Choques: $\varepsilon_1 = 1,\ \varepsilon_2 = -2,\ \varepsilon_3 = 0.5,\ \varepsilon_4 = 1.5$ (y cero antes). Modelo AR(1) con $\phi = 0.5$, cuyos pesos son $\psi_j = 0.5^j$: $1,\ 0.5,\ 0.25,\ 0.125$.

:::pasos
= y_4 = \psi_0\varepsilon_4 + \psi_1\varepsilon_3 + \psi_2\varepsilon_2 + \psi_3\varepsilon_1
> El choque más reciente lleva el peso más grande.
= = 1(1.5) + 0.5(0.5) + 0.25(-2) + 0.125(1)
> Sustituimos los pesos y los choques.
= = 1.5 + 0.25 - 0.5 + 0.125 = 1.375
> El choque de $-2$ de hace dos periodos todavía resta, pero ya solo con una cuarta parte de su tamaño.
:::

**Comprobación con la ecuación recursiva** $y_t = 0.5\,y_{t-1} + \varepsilon_t$: $y_1 = 1$, $y_2 = 0.5 - 2 = -1.5$, $y_3 = -0.75 + 0.5 = -0.25$, $y_4 = -0.125 + 1.5 = 1.375$. ✓ Las dos formas (recursiva y de filtro) dan lo mismo: son el mismo modelo escrito de dos maneras.
:::

### Notación de la unidad {#notacion2}

| Símbolo | Se lee | Significado |
|---|---|---|
| $\tip{c-const}{c}$ | constante | término fijo del modelo |
| $\tip{p-ar}{p}$, $\tip{q-ma}{q}$ | p, q | órdenes AR y MA: cuántos rezagos de la serie y de los choques |
| $\phi_i$, $\theta_j$ | fi i, theta j | coeficientes AR y MA |
| $\tip{d-dif}{d}$ | d | número de diferencias regulares |
| $\tip{P-est}{P}$, $\tip{D-est}{D}$, $\tip{Q-est}{Q}$, $\tip{s}{s}$ | P, D, Q, s | órdenes estacionales y periodo estacional |
| $\Phi$, $\Theta$ | fi y theta mayúsculas | coeficientes AR y MA estacionales |
| $L$ | operador rezago | $L\,y_t = y_{t-1}$ [[operador-l]] |
| $\varepsilon_t$ | épsilon | choque verdadero (no observable) |
| $e_t$ | e t | residuo: $y_t - \hat{y}_t$, la estimación del choque |
| $\hat{y}_{t+h \mid t}$ | y gorro | pronóstico de $y_{t+h}$ con información hasta $t$ |
| $\tip{h-pron}{h}$ | h | horizonte del pronóstico |
| $\psi_j$ | psi | pesos de la forma MA(∞) |
| $\ell$ | ele cursiva | log-verosimilitud [[mv]] |
| $\tip{k-par}{k}$ | k | número de parámetros estimados [[aic-bic]] |

:::cuidado Los signos cambian de un libro a otro
En esta guía (y en statsmodels) el MA se escribe con **más**: $y_t = \varepsilon_t + \theta\,\varepsilon_{t-1}$. Algunos libros (Box–Jenkins, R antiguo) usan $y_t = \varepsilon_t - \theta\,\varepsilon_{t-1}$. Es el mismo modelo con $\theta$ de signo contrario. Antes de interpretar un coeficiente, revisa la convención. En el AR todos usan $y_t = \phi\,y_{t-1} + \varepsilon_t$, pero `ArmaProcess` pide el polinomio $1 - \phi L$, es decir, `ar=[1, -phi]` [[ar-python]].
:::

### Números complejos en cinco minutos {#complejos}

Para saber si un AR es estacionario hay que encontrar las **raíces** de un polinomio [[raices]], y a veces esas raíces son números complejos. Esto es todo lo que necesitas.

:::definicion Número complejo
$$z = a + b\,\tip{i-imag}{i}, \qquad i^2 = -1$$

- $a$ es la parte **real** y $b$ la parte **imaginaria**. Se dibuja como el punto $(a, b)$ del plano.
- Su **módulo** (distancia al origen) es $|z| = \tip{r-mod}{r} = \sqrt{a^2 + b^2}$.
- En forma polar: $a = r\cos\tip{omega-frec}{\omega}$ y $b = r\sin\tip{omega-frec}{\omega}$, donde $\omega$ es el ángulo con el eje real.
- «Fuera del círculo unitario» significa $|z| > 1$.
:::

:::guiado Raíces de una cuadrática con discriminante negativo {#guia-complejas}
Resolvemos $1 - z + 0.5\,z^2 = 0$, que es el polinomio de un AR(2) con $\phi_1 = 1,\ \phi_2 = -0.5$ (lo veremos en [[ar2-complejas]]).

| Coeficiente | Valor |
|---|---|
| $A$ (de $z^2$) | 0.5 |
| $B$ (de $z$) | −1 |
| $C$ (constante) | 1 |
| Discriminante $B^2 - 4AC$ | |
| $z_1, z_2$ | |
| Módulo $\lvert z \rvert$ | |
---
= B^2 - 4AC = (-1)^2 - 4(0.5)(1) = 1 - 2 = -1
> Ordenamos como $A z^2 + B z + C$. El discriminante es negativo: no hay raíces reales.
@ usa c2[1-3]; da c2[4]
= \sqrt{-1} = i
> La raíz cuadrada de un negativo se escribe con $i$: $\sqrt{-q} = i\sqrt{q}$.
@ usa c2[4]
= z = \frac{-B \pm \sqrt{B^2 - 4AC}}{2A} = \frac{1 \pm i}{2(0.5)} = 1 \pm i
> La fórmula general funciona igual; las dos raíces son **conjugadas** (mismo $a$, $b$ de signo contrario).
@ usa c2[1-4]; da c2[5]
= |z| = \sqrt{1^2 + 1^2} = \sqrt{2} = 1.4142
> Las dos tienen el mismo módulo.
@ usa c2[5]; da c2[6]
= |z| = 1.4142 > 1 \;\Rightarrow\; \text{ambas raíces están fuera del círculo unitario}
> Conclusión: este AR(2) es estacionario. Además, como las raíces son complejas, la serie tendrá **pseudo-ciclos** [[ar2-complejas]].
@ usa c2[6]
:::

### La esperanza condicional: la mejor predicción {#esperanza-cond}

Pronosticar es responder: *dado todo lo que sé hasta hoy, ¿qué valor espero mañana?* Matemáticamente es una **esperanza condicional**, que se escribe $\E[y_{t+1} \mid y_t, y_{t-1}, \dots]$ o, más corto, $\E_t[y_{t+1}]$.

:::definicion Reglas para pronosticar con la esperanza condicional
Con información hasta el tiempo $t$:

1. Lo que ya ocurrió se conoce: $\E_t[y_{t-j}] = y_{t-j}$ y $\E_t[\varepsilon_{t-j}] = \varepsilon_{t-j}$ para $j \ge 0$.
2. Los choques futuros no se pueden adivinar: $\E_t[\varepsilon_{t+h}] = 0$ para $h \ge 1$.
3. La esperanza es lineal [[u1:linealidad]]: $\E_t[a + b\,X + c\,Y] = a + b\,\E_t[X] + c\,\E_t[Y]$.
:::

:::ejemplo Pronóstico de un AR(1) con las tres reglas
Modelo $y_t = 2 + 0.6\,y_{t-1} + \varepsilon_t$ y el último dato observado es $y_t = 10$.

:::pasos
= \hat{y}_{t+1|t} = \E_t[2 + 0.6\,y_t + \varepsilon_{t+1}] = 2 + 0.6\,y_t + \E_t[\varepsilon_{t+1}]
> Escribimos la ecuación en $t + 1$ y aplicamos la linealidad (regla 3).
= = 2 + 0.6(10) + 0 = 8
> $y_t = 10$ ya se conoce (regla 1) y el choque futuro vale 0 en promedio (regla 2).
= \hat{y}_{t+2|t} = 2 + 0.6\,\hat{y}_{t+1|t} = 2 + 0.6(8) = 6.8
> Para dos pasos, el valor de $t+1$ todavía no se conoce: se usa su pronóstico.
= \hat{y}_{t+h|t} \to \mu = \frac{2}{1 - 0.6} = 5
> Con horizontes largos el pronóstico se acerca a la media del proceso [[u1:ar1-media]].
:::
:::

:::demo La media es el mejor pronóstico (en error cuadrático) {#mejor-prediccion}
Sea $Y$ el valor futuro, con media $\mu$ y varianza $\sigma^2$, y sea $a$ cualquier número que usemos como pronóstico. Queremos el $a$ que minimiza el error cuadrático medio $\E[(Y - a)^2]$.

:::pasos
= \E[(Y - a)^2] = \E[(Y - \mu + \mu - a)^2]
> Sumamos y restamos $\mu$ (no cambia nada).
= = \E[(Y - \mu)^2] + 2(\mu - a)\,\E[Y - \mu] + (\mu - a)^2
> Desarrollamos el binomio; $(\mu - a)$ es una constante y sale de la esperanza.
= = \sigma^2 + 2(\mu - a)\cdot 0 + (\mu - a)^2 = \sigma^2 + (\mu - a)^2
> $\E[Y - \mu] = \mu - \mu = 0$ y $\E[(Y - \mu)^2]$ es la varianza.
= \min_a \;\big[\sigma^2 + (\mu - a)^2\big] \;\Rightarrow\; a = \mu
> $\sigma^2$ no depende de $a$ y $(\mu - a)^2 \ge 0$ vale cero solo si $a = \mu$.
:::

Cuando la información disponible cambia la media de $Y$, todo esto se repite con la media **condicional**: el mejor pronóstico es $\E_t[y_{t+h}]$, y el error que queda, $\sigma^2$, es lo que no se puede evitar.
:::

:::interactivo w2-esperanza | El mejor pronóstico minimiza el error cuadrático
La curva es la distribución del valor de mañana, $y_{t+1} \mid y_t$, en un AR(1). Mueve tu pronóstico $a$ y mira cómo cambia el error cuadrático medio.
@@@
- **Izquierda**: la densidad del valor futuro (centrada en $c + \phi\,y_t$) y tu pronóstico (línea rosa).
- **Derecha**: la parábola $\sigma^2 + (\mu - a)^2$. Su mínimo está justo en la media condicional y vale $\sigma^2$: ningún pronóstico puede bajar de ahí.
- Cambia $y_t$: la media condicional se mueve y el mejor pronóstico se mueve con ella. Por eso el pronóstico **depende del último dato**.
:::
