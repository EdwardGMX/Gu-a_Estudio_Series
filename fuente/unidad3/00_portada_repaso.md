<section class="portada" id="inicio">
<span class="etiqueta">📙 Guía de estudio · ETS de Análisis de Series de Tiempo</span>
<h1>Unidad III · Análisis espectral y filtrado</h1>
<p class="bajada">Hasta ahora miramos las series en el tiempo: valores, rezagos y autocorrelaciones. Esta unidad las mira por frecuencias: separa la variabilidad en oscilaciones lentas y rápidas, encuentra ciclos escondidos en el ruido, mide si dos series comparten un ciclo y diseña filtros que quitan lo que estorba (la tendencia, el ruido o una banda de frecuencias). Igual que en la Unidad II, cada idea se explica de varias formas: con una demostración paso a paso, con un ejemplo a mano, con código Python que se ejecuta de verdad y con una gráfica que puedes mover.</p>
<ul class="insignias"><li>🔍 Demostraciones sin saltarse pasos</li><li>✍️ Ejemplos a mano con la tabla iluminada</li><li>🐍 Código Python con su salida real</li><li>🎛️ Gráficas y simuladores interactivos</li><li>🧩 Ejercicios con botón de respuesta</li></ul>
<div class="como-usar">
<div class="tarjeta"><h3>🖱️ Pasa el cursor por las fórmulas</h3><p>Cada símbolo trae su explicación. Pruébalo con la fórmula estrella de la unidad, la densidad espectral: $f(\omega) = \sum_{k=-\infty}^{\infty} \gamma(k)\, e^{-2\pi i \omega k}$.</p></div>
<div class="tarjeta"><h3>⇠ Enlaces a las unidades I y II</h3><p>Lo que ya estudiaste (autocovarianza, ruido blanco, medias móviles, números complejos, AR(2) con raíces complejas) aparece con etiquetas <b>⇠ Unidad I</b> o <b>⇠ Unidad II</b>. Los enlaces ↩ y ↪ te mueven dentro de esta unidad y el botón <b>⤺ Volver</b> te regresa a donde ibas.</p></div>
<div class="tarjeta"><h3>🎨 Cada color es un tipo de bloque</h3><div class="leyenda"><span style="background:var(--lavanda-f);border-color:var(--lavanda)">📘 Definición</span><span style="background:var(--mantequilla-f);border-color:var(--mantequilla)">💡 Intuición</span><span style="background:var(--celeste-f);border-color:var(--celeste)">🔍 Demostración</span><span style="background:var(--durazno-f);border-color:var(--durazno)">✍️ Ejemplo a mano</span><span style="background:var(--rosa-f);border-color:var(--rosa)">🎛️ Interactivo</span><span style="background:var(--coral-f);border-color:var(--coral)">⚠️ Cuidado</span><span style="background:var(--turquesa-f);border-color:var(--turquesa)">💬 Duda frecuente</span><span style="background:var(--verde-f);border-color:var(--verde)">✅ Resumen</span></div></div>
</div>
<div class="ruta">
<div class="ruta-paso"><b>1 · Mirar en frecuencia</b><span>Periodicidad contra ciclo y la densidad espectral: qué frecuencias aportan la varianza.</span></div>
<div class="ruta-paso"><b>2 · Estimar el espectro</b><span>Fourier y periodograma; suavizado de Daniell, Welch y modelos AR.</span></div>
<div class="ruta-paso"><b>3 · Comparar dos series</b><span>Espectro cruzado: magnitud, fase (retardos) y coherencia.</span></div>
<div class="ruta-paso"><b>4 · Filtrar</b><span>Pasa bajos, pasa altos, pasa banda y rechaza banda: corte, orden y diseño.</span></div>
</div>
<h3 style="margin:22px 0 4px;font-size:1.2rem">🗺️ Mapa de la unidad</h3>
<div class="mapa">@@MAPA@@</div>
</section>

## 🧰 Repaso y herramientas para la Unidad III {#herramientas3}
@mapa Lo que necesitas de las unidades I y II, la oscilación básica (amplitud, frecuencia y fase), la fórmula de Euler, las frecuencias de Fourier, el límite de Nyquist y los datos que usaremos.

La Unidad I fue de **diagnóstico** y la Unidad II de **modelado**, ambas en el **dominio del tiempo**: la memoria de una serie se describía con la autocovarianza $\gamma(k)$, es decir, con cuánto se parecen dos valores separados $k$ periodos. La Unidad III describe la misma memoria de otra forma: como una mezcla de oscilaciones de distintas frecuencias, cada una con su propio peso. Para eso necesitamos algo de trigonometría y los números complejos de la Unidad II. Esta sección los reúne; cada vez que una demostración los use habrá un enlace ↩ de regreso.

### Lo que necesitas de las unidades I y II {#repaso3}

| Concepto | Para qué se usa en esta unidad | Repásalo |
|---|---|---|
| Estacionariedad débil | La densidad espectral solo existe para series estacionarias | [[u1:def-debil]] |
| Autocovarianza $\gamma(k)$ | La densidad espectral es su transformada de Fourier | [[u1:autocov]] |
| Ruido blanco | Tiene el espectro más sencillo: plano | [[u1:ruido-blanco]] |
| ACF del AR(1), $\rho(k) = \phi^k$ | Da el primer espectro que calcularemos a mano | [[u1:ar1-acf]] |
| Estacionalidad contra ciclo | Es la primera pregunta de la unidad: ¿periodicidad o ciclo? | [[u1:est-vs-ciclo]] |
| Medias móviles | Son el primer filtro pasa bajos | [[u1:mm-centrada]] |
| Diferencias regular y estacional | Son filtros pasa altos; su ganancia explica la sobrediferenciación | [[u1:diferenciacion]] |
| Serie geométrica | Aparece al sumar exponenciales complejas | [[u1:geo-suma]] |
| Números complejos, módulo y argumento | El espectro cruzado y la función de transferencia son complejos | [[u2:complejos]] |
| AR(2) con raíces complejas | Produce un pico en el espectro: el pseudo-ciclo | [[u2:ar2-complejas]] |
| Filtro lineal y pesos $\psi$ | Todo ARMA es ruido blanco pasado por un filtro | [[u2:filtro-lineal]] |
| Yule–Walker | Estima el AR del método espectral paramétrico | [[u2:ar-estimar]] |

### Los datos de la unidad {#datos3}

Usaremos cinco series reales. Todas vienen dentro de `statsmodels` (no necesitan internet), salvo AirPassengers, que escribimos completa como en las unidades anteriores:

| Serie | Frecuencia | Periodo | Para qué la usamos |
|---|---|---|---|
| **AirPassengers** | mensual | 1949–1960 (144) | Tendencia y estacionalidad: armónicos y el efecto de las diferencias |
| **Manchas solares** | anual | 1700–2008 (309) | Un **ciclo** de unos 11 años cuya duración cambia |
| **El Niño** (temperatura del mar en el Pacífico) | mensual | 1950–2010 (732) | Una **periodicidad** exacta (anual) junto a un **ciclo** irregular (2 a 7 años) |
| **CO₂ de Mauna Loa** | mensual | 1958–2001 (526) | Tendencia fuerte con un ciclo anual: diseñar filtros |
| **Macroeconomía de EE. UU.** | trimestral | 1959–2009 (203) | Espectro cruzado y coherencia: ¿qué variables comparten el ciclo del PIB? |

```python
import warnings
import numpy as np
import pandas as pd
from scipy import signal, stats
from statsmodels.datasets import sunspots, elnino, co2, macrodata

pasajeros = [112, 118, 132, 129, 121, 135, 148, 148, 136, 119, 104, 118, 115, 126, 141, 135, 125, 149, 170, 170, 158, 133, 114, 140,
             145, 150, 178, 163, 172, 178, 199, 199, 184, 162, 146, 166, 171, 180, 193, 181, 183, 218, 230, 242, 209, 191, 172, 194,
             196, 196, 236, 235, 229, 243, 264, 272, 237, 211, 180, 201, 204, 188, 235, 227, 234, 264, 302, 293, 259, 229, 203, 229,
             242, 233, 267, 269, 270, 315, 364, 347, 312, 274, 237, 278, 284, 277, 317, 313, 318, 374, 413, 405, 355, 306, 271, 306,
             315, 301, 356, 348, 355, 422, 465, 467, 404, 347, 305, 336, 340, 318, 362, 348, 363, 435, 491, 505, 404, 359, 310, 337,
             360, 342, 406, 396, 420, 472, 548, 559, 463, 407, 362, 405, 417, 391, 419, 461, 472, 535, 622, 606, 508, 461, 390, 432]
serie = pd.Series(pasajeros, index=pd.date_range("1949-01-01", periods=144, freq="MS"), name="Passengers", dtype=float)
log_serie = np.log(serie)

manchas = sunspots.load_pandas().data.set_index("YEAR")["SUNACTIVITY"]            # anual, 1700–2008
tabla_nino = elnino.load_pandas().data.set_index("YEAR")                           # una fila por año, una columna por mes
nino = pd.Series(tabla_nino.values.ravel(), index=pd.date_range("1950-01-01", periods=tabla_nino.size, freq="MS"), name="SST")
co2_mensual = co2.load_pandas().data["co2"].resample("MS").mean().interpolate()    # semanal → mensual
macro = macrodata.load_pandas().data                                                # trimestral, 1959–2009

for nombre, s in [("AirPassengers", serie), ("manchas", manchas), ("nino", nino), ("co2_mensual", co2_mensual)]:
    print(f"{nombre:14s} n = {len(s):3d}   media = {s.mean():8.2f}   varianza = {s.var(ddof=0):9.2f}")
print("macro:", macro.shape, list(macro.columns[:6]))
```

```python oculto
# --- Datos para las gráficas de la unidad (se guardan en la página) ---
from scipy.signal import find_peaks as _fp
exportar("manchas", {"anio": [int(a) for a in manchas.index], "y": manchas.values,
                     "picos": [int(i) for i in _fp(manchas.values, distance=6, prominence=20)[0]]})
exportar("nino", {"y": nino.values})
exportar("co2", {"y": co2_mensual.values})
_lpib = np.log(macro.realgdp.values) * 100
exportar("macro", {"lpib": _lpib,
                   "pib": np.diff(_lpib), "inv": np.diff(np.log(macro.realinv.values)) * 100,
                   "cons": np.diff(np.log(macro.realcons.values)) * 100, "du": np.diff(macro.unemp.values)})
```

### La oscilación básica: amplitud, frecuencia y fase {#oscilacion}

Toda la unidad está construida con una sola pieza: la oscilación de coseno.

:::definicion Oscilación (sinusoide) de tiempo discreto
$$x_t = \tip{A-amp}{A}\cos(2\pi\omega t + \varphi), \qquad t = 1, 2, \dots, n$$

- $\tip{A-amp}{A}$ es la **amplitud**: la altura máxima respecto al nivel medio.
- $\omega$ es la **frecuencia** en **ciclos por observación**: cuántas oscilaciones completas caben en un periodo de tiempo. Su inverso $\Per = 1/\omega$ es el **periodo**: cuántas observaciones tarda en repetirse.
- $\varphi$ es la **fase**: en qué momento alcanza el máximo (en radianes).
:::

| Ejemplo | Datos | Periodo $\Per$ | Frecuencia $\omega = 1/\Per$ |
|---|---|---|---|
| Ciclo anual | mensuales | 12 meses | $1/12 \approx 0.0833$ |
| Ciclo anual | trimestrales | 4 trimestres | $1/4 = 0.25$ |
| Patrón semanal | diarios | 7 días | $1/7 \approx 0.143$ |
| Ciclo solar | anuales | ≈ 11 años | $\approx 0.091$ |
| Ciclo económico | trimestrales | 6 a 32 trimestres | $0.031$ a $0.167$ |
| La oscilación más rápida posible | cualquiera | 2 observaciones | $0.5$ |

:::intuicion El periodo y la frecuencia son la misma información
Decir «se repite cada 12 meses» y decir «da 1/12 de vuelta por mes» es lo mismo. Las frecuencias **bajas** (cerca de 0) son oscilaciones **lentas**, de periodo largo; las frecuencias **altas** (cerca de 1/2) son oscilaciones **rápidas**, que suben y bajan en pocas observaciones.
:::

La fase es incómoda porque está dentro del coseno. El siguiente truco la saca y convierte la oscilación en una **regresión lineal**, que es la idea que usa el periodograma.

:::demo La fase se convierte en dos coeficientes de regresión {#demo-fase-regresion}
:::pasos
= x_t = \tip{A-amp}{A}\cos(2\pi\omega t + \varphi)
> La oscilación con amplitud, frecuencia y fase.
= \cos(a + b) = \cos a\cos b - \sin a\sin b
> Identidad del coseno de una suma, con $a = 2\pi\omega t$ y $b = \varphi$.
= x_t = \underbrace{\tip{A-amp}{A}\cos\varphi}_{\beta_1}\,\cos(2\pi\omega t) \;+\; \underbrace{(-\tip{A-amp}{A}\sin\varphi)}_{\beta_2}\,\sin(2\pi\omega t)
> Lo que no depende de $t$ se agrupa en dos coeficientes.
= x_t = \beta_1\cos(2\pi\omega t) + \beta_2\sin(2\pi\omega t)
> Si conocemos $\omega$, es una regresión lineal sobre dos variables: $\cos(2\pi\omega t)$ y $\sin(2\pi\omega t)$.
= \tip{A-amp}{A} = \sqrt{\beta_1^2 + \beta_2^2}, \qquad \varphi = \operatorname{atan2}(-\beta_2,\ \beta_1)
> De regreso: la amplitud es la longitud del vector $(\beta_1, \beta_2)$ porque $\cos^2\varphi + \sin^2\varphi = 1$.
:::
:::

:::guiado Recuperar amplitud y fase de cuatro datos {#guia-amplitud-fase}
| $t$ | $x_t$ | $\cos(2\pi t/4)$ | $\sin(2\pi t/4)$ | $x_t\cos$ | $x_t\sin$ |
|---|---|---|---|---|---|
| 1 | −1 | 0 | 1 | 0 | −1 |
| 2 | −1.732 | −1 | 0 | 1.732 | 0 |
| 3 | 1 | 0 | −1 | 0 | −1 |
| 4 | 1.732 | 1 | 0 | 1.732 | 0 |
| suma | 0 | 0 | 0 | 3.464 | −2 |
---
= \omega = 1/4
> Los datos se repiten cada 4 observaciones (por ejemplo, un ciclo anual en datos trimestrales).
@ usa c2[1-4]
= \beta_1 = \frac{2}{n}\sum x_t\cos(2\pi\omega t) = \frac{2}{4}(3.464) = 1.732
> Con frecuencias de Fourier, la regresión tiene esta solución cerrada (lo demostramos en [[ortogonalidad]]).
@ usa c5[1-4]; da c5[5]
= \beta_2 = \frac{2}{n}\sum x_t\sin(2\pi\omega t) = \frac{2}{4}(-2) = -1
> Lo mismo con el seno.
@ usa c6[1-4]; da c6[5]
= \tip{A-amp}{A} = \sqrt{1.732^2 + (-1)^2} = \sqrt{3 + 1} = 2
> La amplitud: la serie sube hasta 2 y baja hasta −2.
@ usa c5[5] c6[5]
= \varphi = \operatorname{atan2}(1,\ 1.732) = 0.5236 = \pi/6
> La fase: los datos son exactamente $x_t = 2\cos(2\pi t/4 + \pi/6)$.
:::

:::interactivo w3-oscilacion | Amplitud, frecuencia y fase {#w-oscilacion}
Mueve la amplitud, la frecuencia y la fase. Los puntos son lo que observarías en $t = 1, 2, \dots$; la curva continua es la oscilación de fondo.
@@@
- **Arriba**: la oscilación $x_t = A\cos(2\pi\omega t + \varphi)$; el periodo $1/\omega$ aparece en el título.
- **Abajo**: la misma serie como suma de un coseno con peso $\beta_1$ y un seno con peso $\beta_2$. Las dos curvas punteadas sumadas dan la serie.
- Si subes $\omega$ cerca de 0.5, los puntos alternan arriba–abajo: es la oscilación más rápida que se puede ver con datos de tiempo discreto.
- **Vista extra**: el vector $(\beta_1, \beta_2)$ en el plano; su longitud es la amplitud y su ángulo, menos la fase.
:::

### La fórmula de Euler: una oscilación en un número complejo {#euler}

Las fórmulas espectrales se escriben con la **exponencial compleja**, porque convierte las sumas de senos y cosenos en series geométricas, que sí sabemos sumar.

:::definicion Fórmula de Euler
$$e^{i\theta} = \cos\theta + i\sin\theta, \qquad\text{y por lo tanto}\qquad \cos\theta = \frac{e^{i\theta} + e^{-i\theta}}{2}, \quad \sin\theta = \frac{e^{i\theta} - e^{-i\theta}}{2i}$$

$e^{i\theta}$ es el punto del círculo unitario con ángulo $\theta$: tiene módulo 1 y argumento $\theta$ [[u2:complejos]]. Con $\theta = -2\pi\omega k$, el número $e^{-2\pi i\omega k}$ da $k$ «pasos» de $\omega$ vueltas cada uno, en sentido de las manecillas del reloj.
:::

:::demo El coseno es el promedio de dos giros opuestos {#demo-euler}
:::pasos
= e^{i\theta} = \cos\theta + i\sin\theta, \qquad e^{-i\theta} = \cos\theta - i\sin\theta
> El segundo usa que el coseno es par y el seno impar: $\cos(-\theta) = \cos\theta$, $\sin(-\theta) = -\sin\theta$.
= e^{i\theta} + e^{-i\theta} = 2\cos\theta
> Al sumar, las partes imaginarias se cancelan.
= \cos(2\pi\omega t) = \tfrac12 e^{2\pi i\omega t} + \tfrac12 e^{-2\pi i\omega t}
> Una oscilación real de frecuencia $\omega$ es la mitad de un giro con frecuencia $+\omega$ más la mitad de uno con $-\omega$. Por eso los espectros se definen para $\omega$ entre $-1/2$ y $1/2$ y son simétricos: lo que aparece en $\omega$ aparece también en $-\omega$.
:::
:::

### Frecuencias de Fourier y ortogonalidad {#ortogonalidad}

Con $n$ datos hay $n$ frecuencias especiales, las **frecuencias de Fourier** $\omega_j = j/n$: las oscilaciones que caben exactamente $j$ veces en la muestra. Lo que las hace especiales es que sus senos y cosenos son **ortogonales**: no se «estorban» entre sí al hacer una regresión.

:::demo Senos y cosenos en frecuencias de Fourier son ortogonales {#demo-ortogonalidad}
:::pasos
= \sum_{t=1}^{n} e^{2\pi i (j/n) t} = \sum_{t=1}^{n} r^t, \qquad r = e^{2\pi i j/n}
> Escribimos la suma de un giro de frecuencia $j/n$ como una serie geométrica de razón $r$ [[u1:geo-suma]].
= \sum_{t=1}^{n} r^t = r\,\frac{1 - r^n}{1 - r} = 0 \quad\text{si } r \ne 1
> $r^n = e^{2\pi i j} = 1$ para cualquier entero $j$, así que el numerador vale cero. Solo si $j$ es múltiplo de $n$ ($r = 1$) la suma vale $n$.
= \sum_{t=1}^{n}\cos(2\pi\omega_j t) = 0, \qquad \sum_{t=1}^{n}\sin(2\pi\omega_j t) = 0 \qquad (0 < j < n)
> Partes real e imaginaria de la suma anterior: una oscilación completa promedia cero.
= \cos a\cos b = \tfrac12[\cos(a - b) + \cos(a + b)] \;\Rightarrow\; \sum_{t=1}^{n}\cos(2\pi\omega_j t)\cos(2\pi\omega_k t) = \begin{cases} n/2 & j = k \\ 0 & j \ne k \end{cases}
> Para $0 < j, k < n/2$: el producto es la suma de dos oscilaciones de frecuencias $(j \mp k)/n$, que suman cero salvo cuando $j = k$ (entonces $\cos 0 = 1$ se suma $n$ veces y queda $n/2$).
= \sum_{t=1}^{n}\cos(2\pi\omega_j t)\sin(2\pi\omega_k t) = 0 \quad\text{para toda } j, k
> El mismo argumento con $\cos a \sin b = \frac12[\sin(a + b) - \sin(a - b)]$.
:::
:::

:::ejemplo Comprobarlo con $n = 4$
Con $n = 4$, las frecuencias de Fourier son $0, 1/4, 2/4$. Para $\omega = 1/4$: $\cos(2\pi t/4) = (0, -1, 0, 1)$ y $\sin(2\pi t/4) = (1, 0, -1, 0)$ para $t = 1, \dots, 4$.

- $\sum\cos = 0$ y $\sum\sin = 0$.
- $\sum\cos^2 = 0 + 1 + 0 + 1 = 2 = n/2$ y $\sum\sin^2 = 2$.
- $\sum\cos\cdot\sin = 0 + 0 + 0 + 0 = 0$.

Por eso en [[guia-amplitud-fase]] pudimos calcular $\beta_1$ y $\beta_2$ por separado, con $\beta = \frac{2}{n}\sum x_t\cdot(\text{regresor})$: con regresores ortogonales, cada coeficiente de mínimos cuadrados es su covarianza con $x_t$ dividida entre su propia suma de cuadrados ($n/2$).
:::

### El límite de Nyquist y el alias {#nyquist}

Con datos tomados en tiempos enteros, la oscilación más rápida que se puede ver sube y baja en dos observaciones: frecuencia $1/2$. Es la **frecuencia de Nyquist**. Las oscilaciones más rápidas no desaparecen: se **disfrazan** de una oscilación más lenta.

:::demo Dos frecuencias que los datos no pueden distinguir {#demo-alias}
:::pasos
= \cos\big(2\pi(\omega + 1)t\big) = \cos(2\pi\omega t + 2\pi t) = \cos(2\pi\omega t)
> Sumar una vuelta completa por observación no cambia nada si $t$ es entero: $2\pi t$ es un múltiplo de $2\pi$.
= \cos\big(2\pi(1 - \omega)t\big) = \cos(2\pi t - 2\pi\omega t) = \cos(2\pi\omega t)
> El coseno es par. Así, una frecuencia de 0.9 ciclos por observación se ve exactamente igual que una de 0.1.
= \omega_{\text{alias}} = \big|\,\omega - \operatorname{round}(\omega)\,\big| \in [0,\ 1/2]
> Toda frecuencia se «dobla» dentro del intervalo $[0, 1/2]$. Por eso los espectros solo se grafican entre 0 y 1/2.
:::
:::

:::ejemplo Un ciclo diario que parece de 25 días
Mides la temperatura **cada 25 horas**. El ciclo diario tiene periodo 24 horas, así que su frecuencia es $25/24 = 1.0417$ ciclos **por observación**, mayor que 1/2. Su alias es $|1.0417 - 1| = 0.0417$ ciclos por observación: los datos muestran un ciclo falso de periodo $1/0.0417 = 24$ **observaciones**, es decir, $24 \times 25$ horas = **25 días**. La lección: la frecuencia de muestreo decide qué ciclos se pueden estudiar; con datos mensuales no se puede ver un patrón semanal.
:::

:::interactivo w3-aliasing | El alias: un ciclo rápido disfrazado de lento {#w-aliasing}
Una señal continua (curva gris) se observa cada cierto intervalo (puntos). Cambia la frecuencia real de la señal y mira qué oscilación «creen ver» los datos.
@@@
- **Arriba**: la señal verdadera (gris), las observaciones (puntos) y la oscilación más lenta que pasa por los mismos puntos (rosa): es el alias.
- Mientras la frecuencia real sea menor que 1/2 ciclo por observación, el alias es la propia señal. Al pasar de 1/2, la curva rosa ya no coincide con la gris, aunque pase por los mismos puntos.
- **Abajo**: el «doblez» de la frecuencia: cualquier frecuencia real cae, después de muestrear, en el intervalo $[0, 1/2]$.
- **Vista extra**: la tabla de equivalencias para el valor que elijas.
:::

### Unidades de frecuencia: tres convenciones {#unidades-frecuencia}

Los libros y las librerías no miden la frecuencia igual. En esta unidad seguimos a Shumway y Stoffer (bibliografía oficial), con $\omega$ en ciclos por observación.

| Convención | Símbolo y rango | Periodo | Dónde la verás |
|---|---|---|---|
| Ciclos por observación | $\omega \in [-1/2,\ 1/2]$ | $\Per = 1/\omega$ | Shumway–Stoffer; `scipy.signal` con `fs=1` |
| Radianes por observación | $\tip{lambda-ang}{\lambda} = 2\pi\omega \in [-\pi,\ \pi]$ | $\Per = 2\pi/\tip{lambda-ang}{\lambda}$ | Brockwell–Davis, Hamilton; el pseudo-ciclo de la Unidad II |
| Ciclos por unidad de tiempo | $f = \omega\cdot f_s$ | $1/f$ (en años, días…) | `scipy.signal` con `fs=12` (datos mensuales → ciclos por año) |

:::cuidado La $\omega$ de la Unidad II era otra
En la Unidad II, el pseudo-ciclo del AR(2) se escribió con un ángulo en **radianes**: $\Per = 2\pi/\omega$ [[u2:demo-pseudociclo]]. En esta unidad $\omega$ está en **ciclos por observación** y $\Per = 1/\omega$. Para pasar de una a otra: radianes $= 2\pi \times$ ciclos. Un periodo de 8 es $\omega = 0.125$ ciclos, o $\pi/4 = 0.785$ radianes.
:::

:::guiado Traducir entre periodo, frecuencia, radianes y `fs` {#guia-conversiones}
| Datos | Patrón | Periodo $\Per$ | $\omega = 1/\Per$ | $\tip{lambda-ang}{\lambda} = 2\pi\omega$ | Con `fs` |
|---|---|---|---|---|---|
| Mensuales | ciclo anual | 12 | 0.0833 | 0.5236 | `fs=12`: 1 ciclo por año |
| Trimestrales | ciclo de 4 años | 16 | 0.0625 | 0.3927 | `fs=4`: 0.25 ciclos por año |
| Diarios | patrón semanal | 7 | 0.1429 | 0.8976 | `fs=7`: 1 ciclo por semana |
| Horarios | día y noche | 24 | 0.0417 | 0.2618 | `fs=24`: 1 ciclo por día |
| Cualesquiera | señal de 0.6 ciclos por dato | 2.5 | 0.4 | 2.5133 | (es un alias) |
---
= \omega = \frac{1}{\Per} = \frac{1}{12} = 0.0833 \text{ ciclos por observación}
> La conversión básica: el ciclo anual de datos mensuales cabe 0.0833 veces en cada mes.
@ usa c3[1]; da c4[1]
= \tip{lambda-ang}{\lambda} = 2\pi\omega = 2\pi(0.0833) = 0.5236 = \pi/6 \text{ radianes por observación}
> Lo que verías en Brockwell–Davis o Hamilton: el mismo ciclo, medido como un ángulo.
@ usa c4[1]; da c5[1]
= f = \omega\cdot f_s = 0.0833 \times 12 = 1 \text{ ciclo por año}
> Con `fs=12`, `scipy` pone el pico en 1: las unidades pasan de «por observación» a «por año».
@ usa c4[1]; da c6[1]
= \Per = 16 \text{ trimestres}:\quad \omega = 0.0625, \qquad f = 0.0625 \times 4 = 0.25 \text{ ciclos por año}
> Un ciclo cada 4 años: 0.25 ciclos por año. El periodo en años es $1/0.25 = 4$, como debe ser.
@ usa c3[2]; da c4[2] c6[2]
= \Per = 7 \Rightarrow \omega = 0.1429,\ \tip{lambda-ang}{\lambda} = 0.8976; \qquad \Per = 24 \Rightarrow \omega = 0.0417,\ \tip{lambda-ang}{\lambda} = 0.2618
> Los patrones semanal y diario: mientras más largo el periodo, menor la frecuencia.
@ usa c3[3-4]; da c4[3-4] c5[3-4]
= \omega = 0.6 > \tfrac12 \;\Rightarrow\; \text{alias } \lvert 0.6 - 1\rvert = 0.4, \qquad \Per = 1/0.4 = 2.5
> Una frecuencia mayor que la de Nyquist no se ve como es: los datos la muestran como 0.4 ciclos por observación, una oscilación de periodo 2.5 [[demo-alias]].
@ usa c2[5]; da c3[5] c4[5] c5[5]
:::

:::interactivo w3-conversor | Calculadora de periodos y frecuencias {#w-conversor}
Elige el tipo de datos y un periodo; la calculadora da su frecuencia en las tres convenciones, el valor que verías en `scipy` con `fs` y si cae en una frecuencia de Fourier para tu número de datos.
@@@
- **Arriba**: dónde cae la frecuencia en el eje de 0 a 1/2. Si el periodo es entero, también aparecen en lila sus armónicos $k/\Per$, que es donde un patrón de ese periodo pone picos [[armonicos]].
- **Abajo**: la oscilación de ese periodo y los puntos que observarías en tiempos enteros.
- **Lectura**: $\omega$, $\tip{lambda-ang}{\lambda}$ (en fracciones de $\pi$ cuando se puede), los ciclos por año, semana o día, y el índice $j = n/\Per$. Si $j$ no es entero, la oscilación cae entre dos frecuencias de Fourier y su potencia se reparte (fuga) [[fuga]].
- **Vista extra**: la tabla de los patrones típicos de ese tipo de datos, con tu elección resaltada.
:::

:::resumen Lo que debes llevarte de las herramientas
- Una oscilación $A\cos(2\pi\omega t + \varphi)$ es una regresión sobre $\cos(2\pi\omega t)$ y $\sin(2\pi\omega t)$; la amplitud es $\sqrt{\beta_1^2 + \beta_2^2}$.
- Euler: $e^{i\theta} = \cos\theta + i\sin\theta$; el coseno es el promedio de dos giros opuestos, por eso los espectros son simétricos.
- En las frecuencias de Fourier $\omega_j = j/n$ los senos y cosenos son ortogonales.
- Con datos en tiempos enteros solo se ven frecuencias entre 0 y 1/2 (Nyquist); las más rápidas aparecen como un alias más lento.
- $\Per = 1/\omega$ en ciclos por observación; en radianes, $\Per = 2\pi/\tip{lambda-ang}{\lambda}$.
:::
