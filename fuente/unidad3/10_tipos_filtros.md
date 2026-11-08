## 🧪 Tipos de filtros: pasa bajos, pasa altos, pasa banda y rechaza banda {#tipos-filtros}
@mapa Los cuatro tipos de filtro de la guía oficial y para qué sirve cada uno, la frecuencia de corte y el orden, el filtro ideal y por qué no existe, el Butterworth y los FIR por ventanas en Python, y la diferencia entre filtrar en tiempo real (causal) y con fase cero.

### Los cuatro tipos {#cuatro-tipos}

Un filtro se clasifica por **qué frecuencias deja pasar**. La guía oficial da los cuatro tipos con su uso típico:

:::definicion Tipos de filtro
- **Pasa bajos**: conserva frecuencias bajas y atenúa altas. Útil para **suavizar ruido rápido**.
- **Pasa altos**: conserva frecuencias altas y atenúa bajas. Útil para **remover tendencia lenta**.
- **Pasa banda**: conserva un rango específico $[\omega_1, \omega_2]$. Útil para **aislar un ciclo de interés**.
- **Rechaza banda**: atenúa un rango específico. Útil para **remover interferencia periódica**.
:::

| Tipo | Ganancia ideal | Ejemplo en series de tiempo | Filtros que ya conoces |
|---|---|---|---|
| Pasa bajos | 1 en $[0, \omega_c]$, 0 arriba | Tendencia–ciclo sin el ruido mensual | Medias móviles, SES, tendencia de HP |
| Pasa altos | 0 en $[0, \omega_c]$, 1 arriba | Quitar la tendencia para estudiar las fluctuaciones | Diferencia $1 - L$, ciclo de HP |
| Pasa banda | 1 en $[\omega_1, \omega_2]$, 0 fuera | El ciclo económico (6 a 32 trimestres) | Baxter–King [[bk]] |
| Rechaza banda | 0 en $[\omega_1, \omega_2]$, 1 fuera | Quitar el patrón semanal de datos diarios | Diferencia estacional (en $k/s$) |

### Frecuencia de corte y orden {#corte-orden}

La guía oficial define dos conceptos para describir un filtro real:

:::definicion Frecuencia de corte y orden
- **Frecuencia de corte** $\omega_c$: frecuencia donde empieza la atenuación relevante. En los filtros Butterworth es donde la ganancia cae a $1/\sqrt2 \approx 0.707$ (la potencia a la mitad, −3 dB).
- **Orden** del filtro: controla qué tan **abrupta** es la transición entre la banda de paso y la de rechazo. Más orden = transición más corta, pero más coeficientes, más efectos de borde y más riesgo numérico.
:::

El filtro **Butterworth** es el más usado porque su ganancia es lo más plana posible en la banda de paso. Su versión digital pasa bajos de orden $N$ tiene

$$\lvert A(\omega)\rvert = \frac{1}{\sqrt{1 + \left(\dfrac{\tan(\pi\omega)}{\tan(\pi\omega_c)}\right)^{2N}}}$$

:::guiado La ganancia de un Butterworth pasa bajos a mano {#guia-butterworth}
| $\omega$ | Periodo | $\tan(\pi\omega)/\tan(\pi\omega_c)$ | Ganancia $N = 1$ | Ganancia $N = 2$ | Ganancia $N = 4$ |
|---|---|---|---|---|---|
| 0.02 | 50 | 0.194 | 0.982 | 0.999 | 1.000 |
| 0.05 | 20 | 0.488 | 0.899 | 0.973 | 0.998 |
| 0.10 | 10 | 1 | 0.707 | 0.707 | 0.707 |
| 0.20 | 5 | 2.236 | 0.408 | 0.196 | 0.040 |
| 0.30 | 3.3 | 4.236 | 0.230 | 0.056 | 0.003 |
---
= \omega_c = 0.1 \;\Rightarrow\; \tan(\pi\cdot 0.1) = 0.3249
> Queremos conservar las oscilaciones de periodo mayor que 10 y quitar las más rápidas.
= \omega = 0.2:\quad \frac{\tan(0.2\pi)}{\tan(0.1\pi)} = \frac{0.7265}{0.3249} = 2.236
> La razón de tangentes mide qué tan lejos del corte estamos.
@ usa c1[4]; da c3[4]
= N = 2:\quad \frac{1}{\sqrt{1 + 2.236^4}} = \frac{1}{\sqrt{1 + 25}} = 0.196
> Una oscilación de periodo 5 sale con el 20% de su amplitud (4% de su varianza).
@ usa c3[4]; da c5[4]
= N = 4:\quad \frac{1}{\sqrt{1 + 2.236^8}} = \frac{1}{\sqrt{1 + 625}} = 0.040
> Con el doble de orden, la misma oscilación sale con el 4%: la transición es mucho más abrupta.
@ usa c3[4]; da c6[4]
= \omega = \omega_c:\quad \frac{1}{\sqrt{1 + 1}} = 0.707 \text{ para cualquier } N
> Todas las curvas pasan por $(\omega_c, 0.707)$: así se define la frecuencia de corte.
@ usa c4[3] c5[3] c6[3]
:::

Para proponer un filtro hay que **traducir periodos a frecuencias**, $\omega = 1/\Per$, en las unidades de los datos:

| Objetivo | Datos | Periodos que interesan | Frecuencias de corte | Tipo |
|---|---|---|---|---|
| Quitar el ruido de menos de 6 meses | mensuales | $\Per > 6$ | $\omega_c = 1/6 = 0.167$ | Pasa bajos |
| Quitar la tendencia de más de 10 años | mensuales | $\Per < 120$ | $\omega_c = 1/120 = 0.0083$ | Pasa altos |
| Aislar el ciclo económico | trimestrales | $6 \le \Per \le 32$ | $[1/32,\ 1/6] = [0.031,\ 0.167]$ | Pasa banda |
| Quitar el patrón semanal | diarios | $\Per = 7$ (y sus armónicos) | alrededor de $1/7, 2/7, 3/7$ | Rechaza banda |

En `scipy` se pasa la frecuencia con `fs`: `signal.butter(4, 1/6, btype="low", fs=1)` usa ciclos por observación; `signal.butter(4, 2, btype="low", fs=12)` usa ciclos por año en datos mensuales (2 ciclos por año = periodo de 6 meses).

### El filtro ideal y por qué no existe {#filtro-ideal}

:::demo La respuesta al impulso del pasa bajos ideal {#demo-filtro-ideal}
:::pasos
= A(\omega) = \begin{cases}1 & \lvert\omega\rvert \le \omega_c\\ 0 & \omega_c < \lvert\omega\rvert \le 1/2\end{cases}
> El filtro perfecto: deja pasar intacto todo lo que está por debajo del corte y elimina todo lo demás.
= a_j = \int_{-1/2}^{1/2}A(\omega)\,e^{2\pi i\omega j}\,d\omega = \int_{-\omega_c}^{\omega_c}e^{2\pi i\omega j}\,d\omega
> Los pesos se recuperan con la transformada inversa (igual que $\gamma(k)$ a partir de $f(\omega)$).
= a_j = \frac{e^{2\pi i\omega_c j} - e^{-2\pi i\omega_c j}}{2\pi i j} = \frac{\sin(2\pi\omega_c j)}{\pi j}, \qquad a_0 = 2\omega_c
> Integral de la exponencial y fórmula de Euler para el seno.
= a_j \ne 0 \text{ para infinitos } j \text{ positivos y negativos}
> Los pesos decaen como $1/j$: muy despacio, sin terminar nunca, y usan el futuro ($j < 0$). Un filtro ideal necesitaría infinitos datos hacia atrás y hacia adelante.
:::
:::

En la práctica se **trunca** la respuesta al impulso a $2M + 1$ pesos. El corte brusco produce ondulaciones en la ganancia (el **fenómeno de Gibbs**: unos 9% de sobrepaso cerca del corte, sin importar $M$). Multiplicar los pesos por una **ventana** suave (Hamming, Hann) elimina casi todas las ondulaciones a cambio de una transición más ancha. Así se diseñan los filtros **FIR** (de respuesta finita), como `signal.firwin` y el filtro de Baxter–King.

:::interactivo w3-ideal | Del filtro ideal al real: truncar y suavizar {#w-ideal}
Un pasa bajos ideal con corte $\omega_c$, truncado a $2M + 1$ pesos, con o sin ventana.
@@@
- **Arriba**: los pesos $a_j = \sin(2\pi\omega_c j)/(\pi j)$ truncados (barras) y, con ventana, multiplicados por ella (puntos).
- **Abajo**: la ganancia resultante contra la ideal (rectángulo punteado). Sin ventana aparecen las ondulaciones de Gibbs; con Hamming desaparecen y la transición se ensancha.
- Aumentar $M$ angosta la transición, pero no quita el 9% de sobrepaso si no hay ventana.
- **Vista extra**: la tabla con la ondulación máxima en la banda de paso, la atenuación en la banda de rechazo y el ancho de la transición.
:::

### FIR o IIR {#fir-iir}

| | FIR (respuesta al impulso finita) | IIR (respuesta infinita, como Butterworth) |
|---|---|---|
| Pesos | Un número finito de $a_j$ | Recursivo: usa salidas pasadas (como un AR) |
| Diseño en `scipy` | `firwin`, `firwin2` | `butter`, `cheby1`, `ellip`, `iirnotch` |
| Fase | Lineal si es simétrico (retraso constante) | No lineal; se corrige con `filtfilt` |
| Coeficientes para una transición abrupta | Muchos | Pocos |
| Estabilidad | Siempre estable | Puede volverse inestable con órdenes altos (usa `output="sos"`) |
| Ejemplos en series de tiempo | Medias móviles, Baxter–King | Suavizamiento exponencial, Butterworth |

### Butterworth en Python {#butterworth}

```python
from scipy.signal import butter, filtfilt, lfilter, freqz

n = 240
t = np.arange(1, n + 1)
rng = np.random.default_rng(7)
lento = 2 * np.cos(2 * np.pi * t / 40)                  # ciclo de periodo 40: lo que queremos conservar
x = lento + np.cos(2 * np.pi * t / 5) + rng.normal(0, 0.5, n)   # + oscilación de periodo 5 + ruido

b, a = butter(4, 0.1, btype="low", fs=1)                 # orden 4, corte en periodo 10
_, h = freqz(b, a, worN=[1 / 40, 0.1, 1 / 5], fs=1)
print("ganancia en periodos 40, 10 y 5:", np.round(np.abs(h), 3))
causal = lfilter(b, a, x)                               # en tiempo real: solo usa el pasado
fase_cero = filtfilt(b, a, x)                           # hacia adelante y hacia atrás
centro = slice(30, n - 30)                              # sin los bordes
for nombre, y in [("lfilter", causal), ("filtfilt", fase_cero)]:
    retraso = max(range(-10, 11), key=lambda d: np.corrcoef(y[centro], np.roll(lento, d)[centro])[0, 1])
    print(f"{nombre:8s}: error contra el ciclo lento = {np.sqrt(np.mean((y - lento)[centro] ** 2)):.3f}  retraso estimado = {retraso} periodos")
```

:::interactivo w3-butter | Butterworth: tipo, corte y orden {#w-butter}
Diseña un Butterworth y aplícalo a una serie de prueba con un ciclo lento, una oscilación rápida y ruido. Compara el filtrado causal con el de fase cero.
@@@
- **Arriba**: la ganancia del filtro (con el punto de −3 dB marcado en cada corte). Cambia el orden y mira cómo se endurece la transición.
- **Abajo**: la serie de prueba, la salida con `lfilter` (causal, retrasada) y con `filtfilt` (fase cero, alineada); en tenue, el componente que el filtro debería recuperar.
- Con pasa banda o rechaza banda aparecen dos cortes: elige el rango en periodos.
- **Vista extra**: la respuesta al impulso del filtro y sus polos y ceros en el plano complejo.
:::

:::interactivo py3-butter | Simulador: `scipy.signal.butter` + `filtfilt` {#sim-butter}
Cambia los argumentos de `butter` y del filtrado y mira el código, la salida y el resultado sobre el CO₂ de Mauna Loa.
@@@
- `N` es el orden; `Wn` la frecuencia (o las dos frecuencias) de corte en las unidades de `fs`.
- `btype` elige el tipo: `"low"`, `"high"`, `"bandpass"` o `"bandstop"`.
- `filtfilt` aplica el filtro dos veces (fase cero); `lfilter`, una vez (causal).
- La tabla explica cada parámetro y su valor recomendado.
:::

### Causal o de fase cero {#fase-cero}

:::demo Filtrar hacia adelante y hacia atrás elimina la fase {#demo-filtfilt}
:::pasos
= u_t = \text{filtro}(x_t) \;\Rightarrow\; \text{en frecuencia: } A(\omega)
> Primera pasada, hacia adelante: ganancia $\lvert A\rvert$ y fase $\arg A$ (un retraso).
= y_t = \text{filtro}(u_t \text{ al revés}) \text{ al revés} \;\Rightarrow\; \overline{A(\omega)}
> Invertir el tiempo conjuga la respuesta en frecuencia: la fase cambia de signo (el retraso se vuelve adelanto).
= A_{\text{total}}(\omega) = A(\omega)\,\overline{A(\omega)} = \lvert A(\omega)\rvert^2
> El total es real y no negativo: **fase cero** (ni retraso ni adelanto) y ganancia **al cuadrado** (la atenuación se duplica en decibeles y el corte efectivo queda en ganancia 0.5).
:::
:::

:::cuidado `filtfilt` usa el futuro
Un filtro de fase cero necesita datos de **después** de cada instante. Es perfecto para **describir** una serie histórica (extraer su tendencia o su ciclo), pero no sirve para **pronosticar** ni para variables que se usarán en tiempo real: incluirlo en un modelo de pronóstico es una forma de fuga de información [[u2:fuga]]. Además, cerca de los extremos de la serie no hay datos suficientes y el resultado depende del relleno (`padtype`, `padlen`): no interpretes los primeros y últimos periodos.
:::

:::duda ¿Qué orden elijo?
El menor que logre la atenuación que necesitas en la banda de rechazo. Empieza con $N = 2$ o $4$, revisa la ganancia en las frecuencias que quieres eliminar (por ejemplo, que sea menor que 0.1) y súbelo solo si hace falta. Órdenes de 8 o más con frecuencias de corte muy bajas pueden dar coeficientes inestables con `output="ba"`; en ese caso usa `butter(..., output="sos")` con `sosfiltfilt`.
:::

:::resumen Lo que debes llevarte de los tipos de filtros
- Pasa bajos (suavizar), pasa altos (quitar tendencia), pasa banda (aislar un ciclo), rechaza banda (quitar interferencia periódica).
- Frecuencia de corte: donde empieza la atenuación (Butterworth: ganancia 0.707). Orden: qué tan abrupta es la transición.
- Butterworth: $\lvert A\rvert = [1 + (\tan\pi\omega/\tan\pi\omega_c)^{2N}]^{-1/2}$. Traduce periodos a frecuencias con $\omega = 1/P$.
- El ideal tiene pesos $\sin(2\pi\omega_c j)/(\pi j)$, infinitos; truncar produce ondulaciones (Gibbs) y una ventana las suaviza.
- `lfilter` es causal (retrasa); `filtfilt` tiene fase cero y ganancia $\lvert A\rvert^2$, pero usa el futuro.
:::
