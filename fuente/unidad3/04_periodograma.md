## 📊 Transformada de Fourier y periodograma {#periodograma}
@mapa La transformada discreta de Fourier, el periodograma visto de tres formas (energía, regresión y ACF muestral), un periodograma completo a mano, Parseval, por qué es tan ruidoso, cómo se calcula en Python y la fuga espectral.

### La transformada discreta de Fourier {#dft-def}

La densidad espectral es una propiedad del **proceso**; con datos necesitamos un estimador. La herramienta es la **transformada discreta de Fourier** (DFT), que, en palabras de la guía oficial, *descompone una señal compleja en senos y cosenos de distintas frecuencias, amplitudes y fases*.

:::definicion Transformada discreta de Fourier
Para datos $x_1, \dots, x_n$ y las frecuencias de Fourier $\omega_j = j/n$, $j = 0, 1, \dots, n - 1$:

$$d(\omega_j) = \frac{1}{\sqrt{n}}\sum_{t=1}^{n}x_t\,e^{-2\pi i\omega_j t} = d_c(\omega_j) - i\,d_s(\omega_j)$$

con la **transformada coseno** $d_c(\omega_j) = n^{-1/2}\sum x_t\cos(2\pi\omega_j t)$ y la **transformada seno** $d_s(\omega_j) = n^{-1/2}\sum x_t\sin(2\pi\omega_j t)$. La transformación se puede deshacer:

$$x_t = \frac{1}{\sqrt{n}}\sum_{j=0}^{n-1}d(\omega_j)\,e^{2\pi i\omega_j t}$$

Es decir, **toda serie de $n$ datos es exactamente una suma de oscilaciones en las $n$ frecuencias de Fourier**. La DFT solo cambia de coordenadas: de «un valor por instante» a «un coeficiente complejo por frecuencia».
:::

:::intuicion La DFT pregunta «¿cuánto te pareces a esta oscilación?»
$d_c(\omega_j)$ es, salvo una constante, la covarianza de la serie con un coseno de frecuencia $\omega_j$, y $d_s(\omega_j)$ la covarianza con un seno. Si la serie tiene un ciclo de esa frecuencia, alguna de las dos (o ambas, según la fase) será grande; si no, se cancelan positivos con negativos. El módulo $\lvert d(\omega_j)\rvert$ dice **cuánto** se parece; el argumento, **en qué fase**.
:::

### El periodograma {#periodograma-def}

:::definicion Periodograma
$$I(\omega_j) = \lvert d(\omega_j)\rvert^2 = d_c^2(\omega_j) + d_s^2(\omega_j), \qquad j = 0, 1, \dots, \lfloor n/2\rfloor$$

Es el estimador no paramétrico más simple de la densidad espectral (guía oficial). Por la simetría $I(\omega_{n-j}) = I(\omega_j)$, basta calcularlo hasta $j = n/2$.
:::

El periodograma tiene tres interpretaciones, y conviene dominar las tres:

| Interpretación | Fórmula | Qué dice |
|---|---|---|
| **Energía por frecuencia** | $I(\omega_j) = \lvert d(\omega_j)\rvert^2$ | Cuánto «pesa» cada oscilación en la serie |
| **Regresión** | $P(\omega_j) = \beta_1^2 + \beta_2^2 = \frac{4}{n}\,I(\omega_j)$ | El cuadrado de la amplitud de la oscilación ajustada en $\omega_j$ |
| **Versión muestral de $f$** | $I(\omega_j) = \sum_{\lvert k\rvert < n}\hat{\gamma}(k)\,e^{-2\pi i\omega_j k}$ | La definición de $f(\omega)$ con la autocovarianza muestral |

:::demo El periodograma es la densidad espectral con $\hat{\gamma}(k)$ {#demo-periodograma-acf}
:::pasos
= \sum_{t=1}^{n}e^{-2\pi i\omega_j t} = 0 \quad (j \ne 0) \;\Rightarrow\; d(\omega_j) = \frac{1}{\sqrt n}\sum_{t=1}^{n}(x_t - \bar{x})\,e^{-2\pi i\omega_j t}
> Restar la media no cambia la DFT fuera de $j = 0$, porque las exponenciales de frecuencias de Fourier suman cero [[demo-ortogonalidad]].
= I(\omega_j) = d\,\bar d = \frac{1}{n}\sum_{t=1}^{n}\sum_{s=1}^{n}(x_t - \bar x)(x_s - \bar x)\,e^{-2\pi i\omega_j(t - s)}
> El módulo al cuadrado es el número por su conjugado; el conjugado cambia el signo del exponente.
= = \sum_{k=-(n-1)}^{n-1}\Big[\frac{1}{n}\sum_{t - s = k}(x_t - \bar x)(x_s - \bar x)\Big]e^{-2\pi i\omega_j k}
> Agrupamos los pares $(t, s)$ según su distancia $k = t - s$.
= I(\omega_j) = \sum_{\lvert k\rvert < n}\hat{\gamma}(k)\,e^{-2\pi i\omega_j k}
> El corchete es la autocovarianza muestral [[u1:autocov]]. Comparado con $f(\omega) = \sum\gamma(k)e^{-2\pi i\omega k}$: se cambió $\gamma$ por $\hat\gamma$ y la suma se corta en $n - 1$. Por eso $\E[I(\omega_j)] \to f(\omega_j)$ cuando $n$ crece.
:::
:::

### Un periodograma completo a mano {#periodograma-mano}

Ventas trimestrales de dos años: $x = (5, 9, 6, 2, 6, 10, 7, 3)$. Con $n = 8$ las frecuencias de Fourier son $0, 1/8, 2/8, 3/8, 4/8$, de periodos ∞, 8, 4, 2.67 y 2 trimestres.

:::guiado El periodograma de ocho ventas trimestrales {#guia-periodograma}
| $t$ | $x_t$ | $\cos(2\pi t/8)$ | $\sin(2\pi t/8)$ | $\cos(2\pi t/4)$ | $\sin(2\pi t/4)$ |
|---|---|---|---|---|---|
| 1 | 5 | 0.7071 | 0.7071 | 0 | 1 |
| 2 | 9 | 0 | 1 | −1 | 0 |
| 3 | 6 | −0.7071 | 0.7071 | 0 | −1 |
| 4 | 2 | −1 | 0 | 1 | 0 |
| 5 | 6 | −0.7071 | −0.7071 | 0 | 1 |
| 6 | 10 | 0 | −1 | −1 | 0 |
| 7 | 7 | 0.7071 | −0.7071 | 0 | −1 |
| 8 | 3 | 1 | 0 | 1 | 0 |
| $\sum x_t\cdot(\text{col.})$ | 48 | 1 | −2.414 | −14 | −2 |
---
= \bar{x} = 48/8 = 6, \qquad \sum(x_t - \bar x)^2 = 1 + 9 + 0 + 16 + 0 + 16 + 1 + 9 = 52
> La varianza total que vamos a repartir entre frecuencias.
@ usa c2[1-8]; da c2[9]
= \omega_1 = 1/8:\quad \sum x_t\cos(2\pi t/8) = 0.7071(5 - 6 - 6 + 7) - 2 + 3 = 1
> Multiplicamos cada venta por el coseno de su renglón y sumamos.
@ usa c2[1-8] c3[1-8]; da c3[9]
= \sum x_t\sin(2\pi t/8) = 0.7071(5 + 6 - 6 - 7) + 9 - 10 = -2.414
> Lo mismo con el seno.
@ usa c2[1-8] c4[1-8]; da c4[9]
= I(1/8) = \frac{1^2 + (-2.414)^2}{8} = \frac{1 + 5.828}{8} = 0.854
> $I = d_c^2 + d_s^2 = \frac{1}{n}\big[(\sum x\cos)^2 + (\sum x\sin)^2\big]$. Poca energía en el periodo de 8 trimestres.
@ usa c3[9] c4[9]
= \omega_2 = 1/4:\quad \sum x_t\cos(2\pi t/4) = -9 + 2 - 10 + 3 = -14, \qquad \sum x_t\sin(2\pi t/4) = 5 - 6 + 6 - 7 = -2
> En la frecuencia anual (periodo 4) los cosenos y senos valen 0 o ±1: la cuenta es sencilla.
@ usa c2[1-8] c5[1-8] c6[1-8]; da c5[9] c6[9]
= I(1/4) = \frac{(-14)^2 + (-2)^2}{8} = \frac{196 + 4}{8} = 25
> Muchísima energía: las ventas tienen un ciclo anual claro (suben en el 2.º trimestre, bajan en el 4.º).
@ usa c5[9] c6[9]
= I(3/8) = 0.146, \qquad I(1/2) = 0
> Las dos frecuencias restantes se calculan igual (el periodo 2 da $\sum x_t(-1)^t = 0$).
= 2\big[I(\tfrac18) + I(\tfrac14) + I(\tfrac38)\big] + I(\tfrac12) = 2(0.854 + 25 + 0.146) + 0 = 52
> **Parseval**: el periodograma reparte exactamente la suma de cuadrados (cada frecuencia entre 0 y 1/2 cuenta dos veces, por $\omega_j$ y $\omega_{n-j}$). El ciclo anual explica $2(25)/52 = 96\%$ de la variabilidad.
@ usa c2[9]
:::

La segunda interpretación, la de regresión, sale de los mismos números: en $\omega = 1/4$, $\beta_1 = \frac{2}{8}(-14) = -3.5$ y $\beta_2 = \frac{2}{8}(-2) = -0.5$, así que la oscilación anual tiene amplitud $\sqrt{3.5^2 + 0.5^2} = 3.54$ y $P(1/4) = \beta_1^2 + \beta_2^2 = 12.5 = \frac{4}{8}\cdot 25$.

Repitamos el proceso por el camino de la regresión con otra serie, ahora con frecuencias en las que el coseno y el seno no valen solo 0 o ±1. Seis datos, $x = (1, 2, 4, 1, 1, 3)$, cuyas frecuencias de Fourier son $1/6$, $1/3$ y $1/2$ (periodos 6, 3 y 2).

:::guiado El periodograma por regresión: seis datos y periodo 3 {#guia-periodograma-regresion}
| $t$ | $x_t$ | $x_t - \bar x$ | $\cos(2\pi t/3)$ | $\sin(2\pi t/3)$ | $(x_t - \bar x)\cos$ | $(x_t - \bar x)\sin$ |
|---|---|---|---|---|---|---|
| 1 | 1 | −1 | −0.5 | 0.866 | 0.5 | −0.866 |
| 2 | 2 | 0 | −0.5 | −0.866 | 0 | 0 |
| 3 | 4 | 2 | 1 | 0 | 2 | 0 |
| 4 | 1 | −1 | −0.5 | 0.866 | 0.5 | −0.866 |
| 5 | 1 | −1 | −0.5 | −0.866 | 0.5 | 0.866 |
| 6 | 3 | 1 | 1 | 0 | 1 | 0 |
| Suma | 12 | 0 | | | 4.5 | −0.866 |
---
= \bar x = 12/6 = 2, \qquad \sum(x_t - \bar x)^2 = 1 + 0 + 4 + 1 + 1 + 1 = 8
> Centramos la serie y calculamos la suma de cuadrados que vamos a repartir.
@ usa c2[1-7]; da c3[1-6]
= \sum(x_t - \bar x)\cos(2\pi t/3) = 4.5, \qquad \sum(x_t - \bar x)\sin(2\pi t/3) = -0.866
> Multiplicamos renglón por renglón por el coseno y el seno de $\omega = 1/3$ y sumamos.
@ usa c3[1-6] c4[1-6] c5[1-6]; da c6[1-7] c7[1-7]
= \beta_1 = \frac{2}{n}\sum(x_t - \bar x)\cos = \frac{2}{6}(4.5) = 1.5, \qquad \beta_2 = \frac{2}{6}(-0.866) = -0.289
> Los coeficientes de la regresión sobre $\cos(2\pi t/3)$ y $\sin(2\pi t/3)$. Por la ortogonalidad, cada uno se calcula por separado, como una covarianza [[demo-ortogonalidad]].
@ usa c6[7] c7[7]
= P(1/3) = \beta_1^2 + \beta_2^2 = 2.25 + 0.083 = 2.333, \qquad A = \sqrt{2.333} = 1.53
> El periodograma escalado es el cuadrado de la amplitud de la oscilación ajustada.
= I(1/3) = \frac{n}{4}P(1/3) = \frac{6}{4}(2.333) = 3.5 \qquad\Big(= \tfrac{4.5^2 + 0.866^2}{6} = \tfrac{21}{6}\Big)
> Los dos caminos dan lo mismo: la regresión y la fórmula $\frac1n[(\sum x\cos)^2 + (\sum x\sin)^2]$.
@ usa c6[7] c7[7]
= I(1/6) = 0.5, \quad I(1/2) = 0 \;\Rightarrow\; 2\big[I(\tfrac16) + I(\tfrac13)\big] + I(\tfrac12) = 2(0.5 + 3.5) + 0 = 8
> Parseval cierra la cuenta: la oscilación de periodo 3 explica $2(3.5)/8 = 87.5\%$ de la suma de cuadrados.
@ usa c3[1-6]
:::

### Parseval: el análisis de varianza por frecuencias {#parseval}

:::definicion Identidad de Parseval
$$\sum_{t=1}^{n}(x_t - \bar x)^2 = \sum_{j=1}^{n-1}I(\omega_j) = 2\sum_{j=1}^{\lfloor (n-1)/2\rfloor}I(\omega_j) \;\big[+\, I(1/2)\ \text{si } n \text{ es par}\big]$$

Es una **tabla de análisis de varianza**: la suma de cuadrados total se descompone en aportes de cada frecuencia, cada uno con 2 grados de libertad (el coseno y el seno). Sale de la ortogonalidad: la DFT es una rotación de coordenadas, y las rotaciones conservan las longitudes.
:::

:::demo Parseval sale de la ortogonalidad {#demo-parseval}
:::pasos
= x_t - \bar x = \frac{1}{\sqrt n}\sum_{j=1}^{n-1}d(\omega_j)\,e^{2\pi i\omega_j t}
> La DFT inversa: la serie centrada es la suma de sus oscilaciones de Fourier. El término $j = 0$ no aparece porque $d(0) = \sqrt n\,\bar x$ y ya restamos la media.
= \sum_{t=1}^{n}(x_t - \bar x)^2 = \frac1n\sum_{j}\sum_{l}d(\omega_j)\,\overline{d(\omega_l)}\sum_{t=1}^{n}e^{2\pi i(\omega_j - \omega_l)t}
> Como la serie es real, es igual a su conjugado: multiplicamos la suma por la conjugada de la suma.
= \sum_{t=1}^{n}e^{2\pi i(j - l)t/n} = \begin{cases}n & j = l\\ 0 & j \ne l\end{cases}
> Ortogonalidad de las exponenciales de Fourier [[demo-ortogonalidad]]: si $j \ne l$, es una suma geométrica que da vueltas completas y se cancela.
= \sum_{t=1}^{n}(x_t - \bar x)^2 = \frac1n\sum_{j=1}^{n-1}n\,\lvert d(\omega_j)\rvert^2 = \sum_{j=1}^{n-1}I(\omega_j)
> Solo sobreviven los términos con $j = l$. Como $I(\omega_{n-j}) = I(\omega_j)$, cada frecuencia entre 0 y 1/2 aparece dos veces; la de Nyquist, una.
:::
:::

| Fuente | Grados de libertad | Suma de cuadrados | En el ejemplo |
|---|---|---|---|
| $\omega_1 = 1/8$ | 2 | $2I(\omega_1)$ | 1.71 |
| $\omega_2 = 1/4$ | 2 | $2I(\omega_2)$ | 50 |
| $\omega_3 = 3/8$ | 2 | $2I(\omega_3)$ | 0.29 |
| $\omega_4 = 1/2$ | 1 | $I(\omega_4)$ | 0 |
| Total | $n - 1 = 7$ | $\sum(x_t - \bar x)^2$ | 52 |

:::ejemplo La tabla de Parseval de las manchas solares
Con $n = 309$ años, las seis ordenadas más grandes del periodograma son:

| $j$ | $\omega_j = j/309$ | Periodo (años) | % de $\sum(x_t - \bar x)^2$ |
|---|---|---|---|
| 28 | 0.0906 | 11.04 | 26.8 |
| 31 | 0.1003 | 9.97 | 14.3 |
| 29 | 0.0939 | 10.66 | 9.1 |
| 3 | 0.0097 | 103 | 8.7 |
| 26 | 0.0841 | 11.88 | 6.5 |
| 6 | 0.0194 | 51.5 | 3.9 |

- Cuatro de las seis están entre 10 y 12 años y juntas suman el **57%** de la variabilidad. El ciclo solar no ocupa **una** frecuencia sino varias vecinas: es la joroba de un ciclo [[periodo-vs-ciclo]].
- Las de 103 y 51.5 años son variaciones lentas de la altura de los máximos: hay siglos con ciclos más intensos que otros.
- No leas cada ordenada por separado: una sola es muy ruidosa, como veremos enseguida. Que la mayor esté en 11.04 y no en 10.66 no es una conclusión firme; que la potencia esté entre 10 y 12 años, sí.
:::

:::interactivo w3-regresion-fourier | El periodograma es una regresión en cada frecuencia {#w-regresion-fourier}
Elige una serie y una frecuencia de Fourier $\omega_j$. La gráfica ajusta la mejor oscilación de esa frecuencia y la barra correspondiente del periodograma se ilumina.
@@@
- **Arriba**: la serie (sin su media) y la oscilación $\beta_1\cos(2\pi\omega_j t) + \beta_2\sin(2\pi\omega_j t)$ ajustada por mínimos cuadrados.
- **Abajo**: el periodograma $I(\omega_j)$ para todas las frecuencias; la barra rosa es la que estás ajustando. Su altura es $\frac{n}{4}(\beta_1^2 + \beta_2^2)$.
- Recorre las frecuencias con el deslizador: donde la oscilación ajustada sigue a los datos, la barra es alta.
- **Vista extra**: la tabla de Parseval acumulada, con el porcentaje de la varianza que explican las frecuencias ordenadas de mayor a menor.
:::

### Qué tan ruidoso es el periodograma {#periodograma-ruido}

La guía oficial advierte que el periodograma *puede ser ruidoso*. Es peor que eso: su ruido **no baja** aunque tengas más datos.

:::definicion Distribución aproximada del periodograma
Para $n$ grande y $0 < \omega_j < 1/2$:

$$\frac{2\,I(\omega_j)}{f(\omega_j)} \;\approx\; \chi^2_2, \qquad\text{con ordenadas aproximadamente independientes entre frecuencias}$$

Así $\E[I(\omega_j)] \approx f(\omega_j)$ (casi insesgado), pero $\Var[I(\omega_j)] \approx f(\omega_j)^2$: la desviación estándar es **tan grande como lo que se estima**, sin importar $n$. Se dice que el periodograma es un estimador **inconsistente**.
:::

:::demo ¿Por qué no mejora con más datos? {#demo-inconsistencia}
:::pasos
= d_c(\omega_j) \approx N\big(0,\ f(\omega_j)/2\big), \qquad d_s(\omega_j) \approx N\big(0,\ f(\omega_j)/2\big), \quad\text{independientes}
> Cada transformada es una suma de $n$ términos: por un teorema central del límite es casi normal. Su varianza se reparte por igual entre el coseno y el seno.
= \frac{2\,I(\omega_j)}{f(\omega_j)} = \left(\frac{d_c}{\sqrt{f/2}}\right)^2 + \left(\frac{d_s}{\sqrt{f/2}}\right)^2 \;\approx\; Z_1^2 + Z_2^2 = \chi^2_2
> Suma de dos normales estándar al cuadrado.
= \E[\chi^2_2] = 2, \quad \Var[\chi^2_2] = 4 \;\Rightarrow\; \E[I] \approx f, \quad \Var[I] \approx \frac{f^2}{4}\cdot 4 = f^2
> Cada ordenada usa solo **dos** números ($d_c$ y $d_s$), tenga la serie 50 o 5000 datos. Más datos dan **más frecuencias**, no más precisión en cada una.
:::
:::

:::guiado El intervalo de confianza de una sola ordenada {#guia-ic-periodograma}
| Cantidad | Valor |
|---|---|
| Periodograma observado $I(\omega_j)$ | 10 |
| Grados de libertad | 2 |
| $\chi^2_2(0.025)$ | 0.0506 |
| $\chi^2_2(0.975)$ | 7.378 |
| Límite inferior | 2.71 |
| Límite superior | 395 |
---
= \frac{2I}{f} \sim \chi^2_2 \;\Rightarrow\; P\Big(\chi^2_2(0.025) \le \frac{2I}{f} \le \chi^2_2(0.975)\Big) = 0.95
> Partimos de la distribución aproximada.
@ usa c2[1] c2[2]
= \frac{2I}{\chi^2_2(0.975)} \le f \le \frac{2I}{\chi^2_2(0.025)}
> Despejamos $f$ (al invertir se voltean las desigualdades).
@ usa c2[3] c2[4]
= \frac{2(10)}{7.378} = 2.71, \qquad \frac{2(10)}{0.0506} = 395
> El intervalo de 95% va de 0.27 a 39.5 veces el valor observado: ¡un factor de 146 entre sus extremos! Con un periodograma crudo no se puede afirmar casi nada sobre la altura de un pico.
@ usa c2[1] c2[3] c2[4]; da c2[5] c2[6]
:::

:::interactivo w3-periodograma-ruido | Más datos no limpian el periodograma {#w-periodograma-ruido}
Simula un AR(2) con espectro conocido y cambia el tamaño de muestra. Compara el periodograma con la densidad verdadera.
@@@
- **Arriba**: el periodograma (puntos) y la densidad espectral verdadera (curva), en escala logarítmica. Con $n = 64$ o con $n = 2048$ los puntos se dispersan igual alrededor de la curva; solo hay más puntos.
- La franja es el intervalo de 95% de cada ordenada: siempre del mismo ancho relativo.
- **Abajo**: el cociente $2I/f$ en todas las frecuencias, contra la densidad $\chi^2_2$ (una exponencial). Es la misma distribución para cualquier proceso y cualquier $n$.
- **Vista extra**: la media y la varianza de $I/f$ (deberían estar cerca de 1 y 1) para varios tamaños de muestra.
:::

### Calcularlo en Python {#periodograma-python}

Hay dos caminos: la FFT de `numpy` con la fórmula, o `scipy.signal.periodogram`. Dan lo mismo, salvo la escala.

```python
x8 = np.array([5, 9, 6, 2, 6, 10, 7, 3.0])
n8 = len(x8)
d = np.fft.fft(x8 - x8.mean()) / np.sqrt(n8)          # d(ω_j); numpy usa t = 0..n-1 (solo cambia la fase)
I = np.abs(d) ** 2
print("I(ω_j), j = 0..4:", np.round(I[: n8 // 2 + 1], 4))
f_sp, P_sp = signal.periodogram(x8)                    # fs=1, detrend="constant", densidad unilateral
print("frecuencias:", f_sp)
print("scipy:      ", np.round(P_sp, 4))
print("2·I (salvo en 0 y 1/2):", np.round(np.r_[I[0], 2 * I[1:4], I[4]], 4))
print("Parseval:", (x8 - x8.mean()) @ (x8 - x8.mean()), "=", round(I[1:].sum(), 4))
```

Con datos reales, el periodograma de las manchas solares encuentra el ciclo de 11 años… y algunos picos más:

```python
f_m, P_m = signal.periodogram(manchas.values)
mayores = np.argsort(P_m)[::-1][:4]
for j in mayores:
    print(f"ω = {f_m[j]:.4f}  periodo = {1 / f_m[j]:6.1f} años  densidad = {P_m[j]:9.0f}")
```

Los dos picos más altos, en 11.0 y 10.0 años, no son dos ciclos distintos: son el mismo ciclo de duración variable, partido por el ruido del periodograma. Para decidirlo hace falta suavizar [[no-parametrico]].

:::interactivo py3-periodogram | Simulador: `scipy.signal.periodogram` {#sim-periodogram}
Elige la serie y los argumentos de `periodogram`. El código, su salida y la gráfica se actualizan.
@@@
- `fs` cambia las **unidades** del eje: con `fs=12` en datos mensuales la frecuencia sale en ciclos por año (el ciclo anual cae en 1).
- `detrend` quita la media (`"constant"`, por omisión) o una recta (`"linear"`); con `False` la frecuencia 0 se come la gráfica.
- `window` aplica una ventana para reducir la fuga [[fuga]]; `scaling="spectrum"` devuelve potencia en lugar de densidad.
- La tabla de parámetros dice qué hace cada uno y qué valor conviene.
:::

### Fuga espectral, ventanas y tendencias {#fuga}

:::definicion Fuga espectral
Si una oscilación tiene una frecuencia que **no** es de Fourier (no cabe un número entero de veces en la muestra), su energía no cae en una sola barra: se **fuga** a las frecuencias vecinas y, en menor medida, a todo el espectro. La fuga también aparece cuando la serie tiene una **tendencia**: la potencia gigantesca de la frecuencia cero se derrama sobre las frecuencias bajas y puede tapar un ciclo.
:::

Dos remedios:

1. **Quitar la tendencia** antes: restar una recta (`detrend="linear"`) o diferenciar. En AirPassengers, el logaritmo sin quitar la tendencia tiene el 83% de su variabilidad en frecuencias menores que 1/24; casi todo es tendencia, no ciclo.
2. **Usar una ventana** (*taper*): multiplicar la serie por una curva que baja suavemente a cero en los extremos (Hann, Hamming, o la ventana coseno del 10% que recomiendan Shumway y Stoffer). Los extremos dejan de ser un «corte» brusco y la fuga lejana cae mucho, a cambio de picos un poco más anchos.

:::interactivo w3-fuga | Fuga espectral y ventanas {#w-fuga}
Una oscilación pura cuya frecuencia puedes mover entre dos frecuencias de Fourier. Compara el periodograma sin ventana y con ventana.
@@@
- **Arriba**: la serie, multiplicada por la ventana elegida (la curva punteada es la ventana).
- **Abajo**: el periodograma en decibeles. Cuando la frecuencia coincide con una de Fourier, toda la energía cae en una barra; a media distancia se fuga a todas.
- Con la ventana de Hann la fuga lejana baja de unos −20 dB a menos de −60 dB, pero el pico principal se ensancha.
- **Vista extra**: la forma de la ventana en el tiempo y su «núcleo» en frecuencia, que es lo que produce la fuga.
:::

:::cuidado Lo que `scipy.signal.periodogram` hace por omisión
- `detrend="constant"`: resta la media (por eso la frecuencia 0 vale 0).
- `fs=1.0`: frecuencias en ciclos por observación, de 0 a 0.5.
- `scaling="density"` y `return_onesided=True`: devuelve $2I(\omega_j)$ (salvo en 0 y 1/2), para que el área de 0 a 1/2 sea la varianza.
- `window="boxcar"`: sin ventana.
Si comparas con un libro, divide entre 2 los valores de scipy.
:::

:::duda ¿Por qué no se calcula el periodograma en cualquier frecuencia, no solo en las de Fourier?
Se puede (con relleno de ceros o evaluando la fórmula), y sirve para dibujar curvas más finas. Pero solo en las frecuencias de Fourier las ordenadas son aproximadamente independientes y se cumple Parseval. Rellenar con ceros **no** agrega información: interpola entre las frecuencias de Fourier.
:::

:::duda ¿Qué mide la ordenada en $\omega = 0$?
Solo la media: $d(0) = n^{-1/2}\sum x_t = \sqrt n\,\bar x$, así que $I(0) = n\bar x^2$. No dice nada de las oscilaciones, y con una media grande es enorme: en las manchas solares, $I(0) = 764\,859$ contra 67 506 de la mayor ordenada del ciclo. Por eso se centra la serie (o `scipy` usa `detrend="constant"`), y por eso Parseval empieza en $j = 1$. Las frecuencias **cercanas** a cero sí importan: ahí viven la tendencia y los movimientos lentos.
:::

:::examen Así te lo pueden preguntar: «Explique el papel de la transformada de Fourier en el análisis espectral»
«La transformada discreta de Fourier reexpresa una serie de $n$ datos como una suma de senos y cosenos en las frecuencias de Fourier $\omega_j = j/n$: para cada frecuencia da un coeficiente complejo $d(\omega_j)$ cuyo módulo mide la intensidad de esa oscilación y cuyo argumento su fase. Su módulo al cuadrado es el periodograma, $I(\omega_j) = \lvert d(\omega_j)\rvert^2$, que equivale a reemplazar $\gamma(k)$ por $\hat\gamma(k)$ en la definición de la densidad espectral y reparte la suma de cuadrados de la serie entre frecuencias (Parseval). Así permite identificar qué frecuencias están presentes y con qué intensidad. Como cada ordenada sigue aproximadamente $f(\omega_j)\chi^2_2/2$, el periodograma es casi insesgado pero muy ruidoso, por lo que en la práctica se suaviza o se usa el método de Welch.»
:::

:::resumen Lo que debes llevarte del periodograma
- DFT: $d(\omega_j) = n^{-1/2}\sum x_t e^{-2\pi i\omega_j t}$; toda serie es una suma de oscilaciones en las frecuencias $j/n$.
- Periodograma $I(\omega_j) = \lvert d(\omega_j)\rvert^2$: energía por frecuencia, regresión ($P = \frac4n I$) y $f$ con $\hat\gamma$.
- Parseval: $\sum(x_t - \bar x)^2 = \sum_{j=1}^{n-1}I(\omega_j)$, una tabla de varianza por frecuencias.
- $2I/f \approx \chi^2_2$: casi insesgado pero inconsistente (su error no baja con $n$); el IC de una ordenada va de $0.27I$ a $39.5I$.
- `scipy` devuelve $2I$; quita la tendencia y usa ventanas para reducir la fuga.
:::
