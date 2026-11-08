## 🧽 Estimación no paramétrica: suavizar el periodograma {#no-parametrico}
@mapa Cómo convertir el periodograma ruidoso en un buen estimador: promediar frecuencias vecinas (Daniell), su ancho de banda y sus intervalos de confianza, el dilema sesgo–varianza, las ventanas y el método de Welch, con ejemplos a mano y en Python.

### La idea: promediar vecinos {#idea-suavizar}

Cada ordenada del periodograma es casi insesgada pero tiene un error enorme ([[periodograma-ruido]]). Si la densidad espectral es suave, las frecuencias vecinas tienen casi la misma $f$, y sus ordenadas son casi independientes. **Promediar $L$ vecinas** reduce la varianza unas $L$ veces sin mover mucho el centro.

:::definicion Periodograma suavizado (Daniell)
$$\hat{f}(\omega_j) = \frac{1}{\Lsp}\sum_{k=-m}^{m}I\!\left(\omega_j + \frac{k}{n}\right), \qquad \Lsp = 2m + 1$$

- **Ancho de banda**: $\Bw = \Lsp/n$, el ancho del intervalo de frecuencias que se promedia.
- **Grados de libertad**: $2\Lsp$, porque se suman $\Lsp$ variables $\chi^2_2$ independientes.
- **Intervalo de confianza de 95% para $f(\omega)$**:

$$\frac{2\Lsp\,\hat{f}(\omega)}{\chi^2_{2\Lsp}(0.975)} \;\le\; f(\omega) \;\le\; \frac{2\Lsp\,\hat{f}(\omega)}{\chi^2_{2\Lsp}(0.025)}$$

Con pesos distintos $h_k$ (que suman 1), se usa $\Lsp_h = 1/\sum h_k^2$ en lugar de $\Lsp$. El **Daniell modificado** da peso $1/(2m)$ a las ordenadas interiores y la mitad a las dos de los extremos, para que el núcleo no tenga «escalones».
:::

:::demo Promediar $L$ ordenadas divide la varianza entre $L$ {#demo-daniell}
:::pasos
= I(\omega_j + k/n) \approx \frac{f(\omega_j)}{2}\,\chi^2_{2,k}, \qquad k = -m, \dots, m, \quad\text{independientes}
> Si $f$ casi no cambia dentro de la banda, todas las vecinas tienen la misma distribución [[periodograma-ruido]].
= \frac{2\Lsp\,\hat{f}(\omega_j)}{f(\omega_j)} = \sum_{k=-m}^{m}\frac{2I(\omega_j + k/n)}{f(\omega_j)} \approx \sum_{k}\chi^2_{2,k} = \chi^2_{2\Lsp}
> La suma de $\Lsp$ ji-cuadradas independientes de 2 grados de libertad es una ji-cuadrada de $2\Lsp$.
= \E[\hat f] \approx f, \qquad \Var[\hat f] \approx \frac{f^2}{(2\Lsp)^2}\cdot 2(2\Lsp) = \frac{f^2}{\Lsp}
> $\Var[\chi^2_\nu] = 2\nu$. El promedio conserva la media y divide la varianza entre $\Lsp$: con $\Lsp = 9$ el error estándar baja a un tercio.
:::
:::

:::guiado Suavizar el pico de las manchas solares a mano {#guia-daniell}
| $j$ | $\omega_j = j/309$ | Periodo (años) | $I(\omega_j)$ |
|---|---|---|---|
| 26 | 0.0841 | 11.88 | 16 444 |
| 27 | 0.0874 | 11.44 | 592 |
| 28 | 0.0906 | 11.04 | 67 507 |
| 29 | 0.0939 | 10.66 | 22 804 |
| 30 | 0.0971 | 10.30 | 1 908 |
| 31 | 0.1003 | 9.97 | 35 910 |
| 32 | 0.1036 | 9.66 | 2 347 |
---
= I(\omega_{28}) = 67\,507, \quad\text{pero}\quad I(\omega_{27}) = 592
> El periodograma crudo salta de 592 a 67 507 entre dos frecuencias vecinas. La densidad verdadera no puede cambiar así: es ruido $\chi^2_2$.
@ usa c4[2] c4[3]
= \Lsp = 3:\quad \hat{f}(\omega_{28}) = \frac{592 + 67\,507 + 22\,804}{3} = 30\,301
> Promedio de la ordenada y sus dos vecinas ($m = 1$).
@ usa c4[2-4]
= \Lsp = 5:\quad \hat{f}(\omega_{28}) = \frac{16\,444 + 592 + 67\,507 + 22\,804 + 1\,908}{5} = 21\,851
> Con $m = 2$ el valor sigue bajando: el pico real es más ancho y más bajo de lo que sugería una sola ordenada.
@ usa c4[1-5]
= \Bw = 5/309 = 0.0162 \text{ ciclos por año}
> El ancho de banda: promediamos oscilaciones de periodos entre 11.9 y 10.3 años.
@ usa c2[1] c2[5]
= \frac{10(21\,851)}{20.48} = 10\,668 \;\le\; f(\omega_{28}) \;\le\; \frac{10(21\,851)}{3.247} = 67\,296
> Intervalo de 95% con $2\Lsp = 10$ grados de libertad ($\chi^2_{10}(0.975) = 20.48$, $\chi^2_{10}(0.025) = 3.247$). Su cociente es 6.3; sin suavizar era 146.
:::

### El dilema sesgo–varianza {#sesgo-varianza}

Suavizar no es gratis. Si la densidad verdadera cambia dentro de la banda (un pico angosto), el promedio lo **aplana** y lo **ensancha**: es un sesgo. Además, dos picos separados por menos de $\Bw$ se funden en uno.

| | $\Lsp$ chico (poco suavizado) | $\Lsp$ grande (mucho suavizado) |
|---|---|---|
| Varianza | Alta: estimación «nerviosa» | Baja: curva suave |
| Sesgo en los picos | Bajo: los picos conservan su altura | Alto: los picos se aplanan |
| Resolución | Fina: distingue picos cercanos | Gruesa: los funde |
| Intervalo de confianza | Ancho | Angosto |

:::intuicion El tamaño de la brocha
Suavizar es pintar con una brocha de ancho $\Bw$: una brocha delgada respeta los detalles pero deja la superficie dispareja; una gruesa deja todo parejo pero borra los detalles finos. No hay un ancho «correcto» universal: se prueban varios, se mira el resultado y se elige uno cuyo ancho de banda sea menor que la separación entre los rasgos que te interesan (por ejemplo, que $\Bw < 1/12$ si quieres ver el pico anual de datos mensuales sin que se mezcle con la frecuencia cero).
:::

:::interactivo w3-daniell | Suaviza el periodograma {#w-daniell}
Elige la serie y cuántas ordenadas promediar. Compara el periodograma crudo con el suavizado y su intervalo de confianza.
@@@
- **Arriba**: el periodograma crudo (puntos grises) y el suavizado (curva), con su banda de 95% en escala logarítmica. En la serie simulada aparece también la densidad verdadera (punteada).
- La barra horizontal junto a la leyenda mide el ancho de banda $\Bw = \Lsp/n$.
- Con $m = 0$ el «suavizado» es el periodograma crudo; al subir $m$ la curva se calma y la banda se angosta, pero los picos bajan.
- **Vista extra**: los pesos $h_k$ del núcleo (simple o modificado), los grados de libertad y el factor por el que se multiplica $\hat f$ para obtener cada extremo del intervalo.
:::

### Ventanas y afilado (*tapering*) {#taper}

Antes de calcular el periodograma, se suele multiplicar la serie por una **ventana** que baja suavemente a cero en los extremos ([[fuga]]). Shumway y Stoffer recomiendan una ventana coseno que solo afila el 10% de los datos de cada lado. Dos efectos:

1. **Menos fuga**: los picos fuertes ya no contaminan frecuencias lejanas (importante si hay un ciclo dominante y otro débil).
2. **Un poco menos de información**: los datos de los extremos pesan menos, así que los grados de libertad bajan ligeramente.

### El método de Welch {#welch}

La guía oficial lo define como el método que *promedia periodogramas por segmentos para obtener una estimación más estable*. Es la otra forma de promediar: en lugar de juntar frecuencias vecinas, junta **trozos de tiempo**.

:::definicion Método de Welch
1. Divide la serie en $\Kseg$ segmentos de longitud $M$, que se traslapan (lo usual: 50%).
2. A cada segmento quítale la media y multiplícalo por una ventana (Hann por omisión en `scipy`).
3. Calcula el periodograma de cada segmento, en las frecuencias $j/M$.
4. Promedia los $\Kseg$ periodogramas.

**Resolución**: $1/M$ (los segmentos cortos ven menos frecuencias). **Varianza**: baja aproximadamente $\Kseg$ veces (algo menos si se traslapan). En `scipy`: `signal.welch(x, fs, nperseg=M, noverlap=M // 2, window="hann")`.
:::

:::guiado Welch a mano con tres segmentos {#guia-welch}
| Segmento | Datos | Media | Desviaciones | $\sum d_t\cos(2\pi t/4)$ | $\sum d_t\sin(2\pi t/4)$ | $I(1/4)$ |
|---|---|---|---|---|---|---|
| 1 ($t$ = 1–4) | 5, 9, 6, 2 | 5.5 | −0.5, 3.5, 0.5, −3.5 | −7 | −1 | 12.5 |
| 2 ($t$ = 3–6) | 6, 2, 6, 10 | 6 | 0, −4, 0, 4 | 8 | 0 | 16 |
| 3 ($t$ = 5–8) | 6, 10, 7, 3 | 6.5 | −0.5, 3.5, 0.5, −3.5 | −7 | −1 | 12.5 |
| Promedio | | | | | | 13.67 |
---
= M = 4,\ \text{traslape } 2 \;\Rightarrow\; \Kseg = 3 \text{ segmentos}
> Las mismas ventas trimestrales de [[guia-periodograma]], en trozos de un año que se traslapan medio año. Sin ventana, para que la cuenta se vea.
@ usa c2[1-3]
= d_t = x_t - \bar{x}_{\text{segmento}}
> Cada segmento se centra con su propia media.
@ usa c2[1-3] c3[1-3]; da c4[1-3]
= I_1(1/4) = \frac{(-7)^2 + (-1)^2}{4} = 12.5, \quad I_2(1/4) = \frac{8^2 + 0^2}{4} = 16, \quad I_3(1/4) = 12.5
> El periodograma de cada segmento en la frecuencia anual (dentro del segmento, $t = 1, 2, 3, 4$ y $\cos(2\pi t/4) = 0, -1, 0, 1$).
@ usa c4[1-3] c5[1-3] c6[1-3]; da c7[1-3]
= \hat{f}_{\text{Welch}}(1/4) = \frac{12.5 + 16 + 12.5}{3} = 13.67
> El promedio. Tres estimaciones parecidas (12.5, 16, 12.5) en lugar de una sola: así se gana estabilidad.
@ usa c7[1-3]; da c7[4]
= \frac{2(25)}{8} = 6.25 \quad\text{contra}\quad \frac{2(13.67)}{4} = 6.83
> ¿Por qué 13.67 y no 25, como en el periodograma completo? Porque la altura depende de la resolución: con segmentos de 4 la banda de cada frecuencia es el doble de ancha. Lo comparable es la **varianza** que se atribuye al ciclo anual, $2I/n$: 6.25 con la serie completa y 6.83 con Welch.
@ usa c7[4]
:::

:::interactivo w3-welch | Welch paso a paso {#w-welch}
Elige la serie, la longitud de los segmentos, el traslape y la ventana. Mira cada segmento y cómo se promedian sus periodogramas.
@@@
- **Arriba**: la serie con los segmentos dibujados como franjas (los traslapes se ven más oscuros).
- **Abajo**: el periodograma de cada segmento (líneas tenues) y su promedio, la estimación de Welch (línea gruesa). En la serie simulada, la punteada es la densidad verdadera.
- Segmentos largos: buena resolución pero pocos segmentos (estimación ruidosa). Segmentos cortos: muchos segmentos (estimación estable) pero picos borrosos.
- **Vista extra**: número de segmentos, resolución $1/M$, grados de libertad aproximados y la frecuencia del pico.
:::

### En Python {#suavizado-python}

`scipy` trae Welch listo; el suavizado de Daniell se escribe en pocas líneas con la FFT. Las dos funciones dan densidades en la escala de `scipy` si multiplicas por 2 la de Daniell.

```python
def periodograma_suavizado(x, m):
    """Daniell simple con L = 2m + 1 ordenadas; devuelve (ω_j, I(ω_j), f̂(ω_j)) para j = 1..n/2."""
    x = np.asarray(x, float) - np.mean(x)
    n = len(x)
    I = np.abs(np.fft.fft(x)) ** 2 / n             # I(ω_j), j = 0..n-1 (círculo completo)
    I[0] = (I[1] + I[-1]) / 2                       # la frecuencia 0 se reemplaza por sus vecinas
    L = 2 * m + 1
    I_ext = np.concatenate([I[-m:], I, I[:m]]) if m else I    # el periodograma es periódico: se envuelve
    f_suave = np.convolve(I_ext, np.ones(L) / L, mode="valid")
    j = np.arange(1, n // 2 + 1)
    return j / n, I[j], f_suave[j]

for m in [0, 2, 5]:
    w, I, fs = periodograma_suavizado(manchas.values, m)
    L = 2 * m + 1
    inf, sup = 2 * L * fs / stats.chi2.ppf(0.975, 2 * L), 2 * L * fs / stats.chi2.ppf(0.025, 2 * L)
    k = fs.argmax()
    print(f"L = {L:2d}: pico en {1 / w[k]:5.2f} años, f̂ = {fs[k]:8.0f}, IC 95% = [{inf[k]:7.0f}, {sup[k]:8.0f}], B = {L / len(manchas):.4f}")

for M in [64, 128]:
    f_w, P_w = signal.welch(manchas.values, nperseg=M)          # Hann, traslape de 50%
    print(f"Welch con nperseg = {M}: pico en {1 / f_w[P_w.argmax()]:5.2f} años (resolución 1/{M} = {1 / M:.4f})")
```

:::interactivo py3-welch | Simulador: `scipy.signal.welch` {#sim-welch}
Cambia los argumentos de `welch` y mira el código, la salida y el espectro estimado de El Niño.
@@@
- `nperseg` es la longitud de los segmentos: decide la resolución ($1/M$) y el número de segmentos.
- `noverlap` es cuántos datos comparten dos segmentos seguidos (por omisión, la mitad).
- `window` es la ventana de cada segmento; `average="median"` es más robusta ante segmentos con datos atípicos.
- La tabla de parámetros explica cada uno y su valor recomendado.
:::

### ¿Daniell o Welch? {#daniell-vs-welch}

| | Daniell (promedio en frecuencia) | Welch (promedio en tiempo) |
|---|---|---|
| Qué promedia | $\Lsp$ ordenadas vecinas de un solo periodograma | $\Kseg$ periodogramas de segmentos |
| Resolución | $\Bw = \Lsp/n$ | $\approx 1/M$ (algo peor con ventana) |
| Grados de libertad | $2\Lsp$ | $\approx 2\Kseg$ (menos con traslape) |
| Conviene con | Series cortas o medianas; libros de estadística (Shumway–Stoffer, R) | Series largas; ingeniería y `scipy` |
| Ventaja extra | Usa todos los datos en cada frecuencia | Ver cada segmento ayuda a detectar si el espectro cambia en el tiempo |

Los dos resuelven el mismo problema con la misma moneda: cambian **resolución** por **estabilidad**.

:::cuidado El valor por omisión de `nperseg`
`signal.welch` usa `nperseg=256`. Si tu serie tiene menos de 256 datos, `scipy` usa un solo segmento de longitud $n$ (con un aviso): eso **no** es Welch, es un periodograma con ventana de Hann, igual de ruidoso. Con series mensuales de 10 o 20 años, elige `nperseg` a mano (por ejemplo, 48 o 64) y revisa cuántos segmentos quedan.
:::

:::duda ¿Cuántas ordenadas promedio o qué `nperseg` uso?
Empieza por la resolución que necesitas: si te interesa un ciclo de periodo $\Per$, la banda debe ser bastante más angosta que $1/\Per$; con Welch, que cada segmento contenga varias vueltas del ciclo ($M \ge 3\Per$ es una buena regla). Después prueba dos o tres valores: lo que se mantiene en todos es real; lo que aparece y desaparece al cambiar el suavizado es ruido.
:::

:::examen Así te lo pueden preguntar: «¿Por qué no basta el periodograma y qué hace el método de Welch?»
«El periodograma es un estimador casi insesgado de la densidad espectral, pero cada ordenada se distribuye aproximadamente como $f(\omega)\chi^2_2/2$: su desviación estándar es del mismo tamaño que lo que estima y no disminuye al aumentar $n$, por lo que es inconsistente y muy ruidoso. La solución es promediar: el suavizado de Daniell promedia $L$ ordenadas vecinas (varianza $\approx f^2/L$, ancho de banda $L/n$, $2L$ grados de libertad), y el método de Welch divide la serie en segmentos traslapados, les aplica una ventana, calcula el periodograma de cada uno y los promedia. Ambos reducen la varianza a cambio de resolución: más promedio da una curva más estable pero aplana los picos y funde frecuencias cercanas.»
:::

:::resumen Lo que debes llevarte del suavizado y Welch
- Daniell: $\hat f = \frac1L\sum_{k=-m}^{m}I(\omega_j + k/n)$, con $\Bw = L/n$ y $2L$ grados de libertad.
- IC de 95%: $[\,2L\hat f/\chi^2_{2L}(0.975),\ 2L\hat f/\chi^2_{2L}(0.025)\,]$; con $L = 5$ el cociente de los extremos es 6.3 (sin suavizar, 146).
- Más suavizado: menos varianza, más sesgo en los picos, menos resolución.
- Welch: promedia periodogramas de $K$ segmentos con ventana; resolución $1/M$. En `scipy`, elige `nperseg` a mano en series cortas.
:::
