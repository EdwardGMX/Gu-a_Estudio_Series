## 🛠️ Cómo proponer un filtro {#proponer-filtro}
@mapa La pregunta tipo examen «proponga un filtro para remover tendencia, ruido de alta frecuencia o una banda no deseada»: del objetivo al tipo de filtro, una receta en seis pasos, un ejemplo completo con el CO₂ de Mauna Loa, filtros de muesca y un laboratorio interactivo.

### Del objetivo al filtro {#objetivo-filtro}

| Objetivo | Frecuencias que hay que quitar | Tipo | Opciones concretas |
|---|---|---|---|
| **Remover tendencia** | Las más bajas (cerca de 0) | Pasa altos | Diferencia $1 - L$; Butterworth pasa altos con corte en $1/\Per_{\max}$; ciclo de HP |
| **Remover ruido de alta frecuencia** | Las altas (periodos cortos) | Pasa bajos | Media móvil (centrada si es para describir); Butterworth pasa bajos; SES si es en tiempo real |
| **Aislar un ciclo** | Todo fuera de la banda del ciclo | Pasa banda | Butterworth pasa banda; Baxter–King o Christiano–Fitzgerald |
| **Remover una banda no deseada** (estacionalidad, interferencia) | Una frecuencia y sus armónicos | Rechaza banda | Filtro de muesca en $1/s, 2/s, \dots$; diferencia estacional $1 - L^s$ (quita también la tendencia); media móvil de $s$ términos |

### La receta en seis pasos {#receta-filtro}

1. **Escribe el objetivo** en una frase: qué quieres conservar y qué quieres quitar.
2. **Mira el periodograma** (suavizado): ¿en qué frecuencias está lo que estorba? ¿Hay picos en $k/s$?
3. **Traduce periodos a frecuencias**: $\omega = 1/\Per$, en las unidades de los datos (o usa `fs` en `scipy`).
4. **Elige el tipo, el corte y el orden** (o la media móvil o la diferencia adecuada) [[corte-orden]].
5. **Revisa la ganancia** $\lvert A(\omega)\rvert$ en las frecuencias clave: cerca de 1 en lo que conservas, cerca de 0 en lo que quitas. Revisa también la fase si el filtro es causal.
6. **Aplica y verifica**: compara el periodograma antes y después, mira la serie filtrada, descarta los extremos y decide entre fase cero (`filtfilt`, para describir) o causal (`lfilter`, para tiempo real).

:::guiado Proponer un filtro para la tendencia del CO₂ {#guia-co2}
| Filtro | $\lvert A\rvert$ en periodo 48 | $\lvert A\rvert$ en periodo 24 | $\lvert A\rvert$ en periodo 12 | $\lvert A\rvert$ en periodo 6 |
|---|---|---|---|---|
| Media móvil $2\times 12$ | 0.899 | 0.633 | 0 | 0 |
| Butterworth $N = 2$, corte 1/24 | 0.971 | 0.707 | 0.235 | 0.052 |
| Butterworth $N = 4$, corte 1/24 | 0.998 | 0.707 | 0.058 | 0.003 |
| Butterworth $N = 4$ con `filtfilt` | 0.996 | 0.500 | 0.003 | 0.000 |
| Diferencia estacional $1 - L^{12}$ | 1.414 | 2 | 0 | 0 |
---
= \text{Objetivo: la tendencia del CO}_2\text{ sin su ciclo anual}
> El CO₂ de Mauna Loa sube de forma sostenida y además oscila cada año (las plantas del hemisferio norte absorben CO₂ en verano). El periodograma de su diferencia tiene picos en $1/12$ y $2/12$.
= \omega_{\text{anual}} = 1/12, \quad \omega_{\text{semestral}} = 1/6 \;\Rightarrow\; \text{pasa bajos con corte } 1/24
> Queremos conservar los movimientos de más de 2 años y eliminar los de 1 año o menos.
= \text{Butterworth } N = 2:\ \lvert A(1/12)\rvert = 0.235
> Insuficiente: deja casi una cuarta parte de la amplitud del ciclo anual.
@ usa c4[2]
= \text{Butterworth } N = 4 \text{ con filtfilt}:\ 0.058^2 = 0.003
> Con orden 4 y fase cero (ganancia al cuadrado), el ciclo anual queda en 0.3% de su amplitud y las oscilaciones de 4 años pasan al 99.6%.
@ usa c2[4] c4[4]
= \text{Media móvil } 2\times 12:\ \lvert A(1/12)\rvert = \lvert A(1/6)\rvert = 0
> La alternativa clásica: elimina exactamente el ciclo anual y sus armónicos, aunque atenúa algo los periodos de 2 años (0.63).
@ usa c2[1] c3[1] c4[1] c5[1]
= 1 - L^{12}:\ \text{descartada}
> Quita el ciclo anual, pero también la tendencia (ganancia 0 en $\omega = 0$) y **amplifica** los periodos de 2 a 4 años: es lo contrario de lo que pedimos.
@ usa c2[5] c3[5] c4[5]
:::

```python
from scipy.signal import butter, filtfilt, iirnotch

c = co2_mensual.values
mm = np.r_[0.5, np.ones(11), 0.5] / 12
tend_mm = np.convolve(c, mm, mode="same")
tend_mm[:6] = tend_mm[-6:] = np.nan                       # bordes sin media móvil completa
b, a = butter(4, 1 / 24, btype="low", fs=1)
tend_bw = filtfilt(b, a, c)
print(f"tamaño del ciclo anual que se quitó (desv. estándar del resto): MM = {np.nanstd(c - tend_mm):.2f} ppm, Butterworth = {np.std((c - tend_bw)[6:-6]):.2f} ppm")
print(f"diferencia máxima entre las dos tendencias: {np.nanmax(np.abs(tend_mm - tend_bw)):.2f} ppm")

# Rechaza banda: dos filtros de muesca, en el ciclo anual y en su armónico semestral
b1, a1 = iirnotch(1 / 12, Q=2, fs=1)
b2, a2 = iirnotch(1 / 6, Q=2, fs=1)
sin_estacion = filtfilt(b2, a2, filtfilt(b1, a1, c))
f, P0 = signal.periodogram(np.diff(c))
_, P1 = signal.periodogram(np.diff(sin_estacion))
for k in [1, 2, 3]:
    j = np.argmin(np.abs(f - k / 12))
    print(f"periodograma de ΔCO₂ en {k}/12: antes = {P0[j]:8.3f}, después = {P1[j]:8.4f}")
```

Las dos tendencias difieren menos de 0.4 ppm: con un buen diseño, el resultado no depende mucho del filtro. Los **filtros de muesca** quitan solo una banda angosta alrededor de cada frecuencia: después de aplicarlos en $1/12$ y $1/6$, el periodograma ya no tiene picos ahí, pero conserva el de $3/12$ (que no tocamos) y toda la tendencia.

### Del requisito al orden {#orden-requisito}

En el paso 4 de la receta el orden se puede **calcular**. Supón que el requisito es: en datos mensuales, conservar al menos el 90% de la amplitud de los movimientos de 24 meses o más, y dejar como máximo el 10% de los de 12 meses o menos.

:::guiado El orden y el corte de un Butterworth a partir de dos requisitos {#guia-orden-butter}
| Cantidad | Valor |
|---|---|
| Frecuencia de paso $\omega_p$ (periodo 24) | 0.04167 |
| Frecuencia de rechazo $\omega_s$ (periodo 12) | 0.08333 |
| $r = \tan(\pi\omega_s)/\tan(\pi\omega_p)$ | 2.0353 |
| Condición de paso: $1/0.9^2 - 1$ | 0.2346 |
| Condición de rechazo: $1/0.1^2 - 1$ | 99 |
| Orden mínimo | 4.25 → $N = 5$ |
| Corte $\omega_c$ | 0.0481 (periodo 20.8) |
| Ganancia en $\omega_p$ y en $\omega_s$ | 0.900 y 0.059 |
---
= \lvert A(\omega)\rvert \ge 0.9 \iff \Big(\frac{\tan\pi\omega_p}{\tan\pi\omega_c}\Big)^{2N} \le \frac{1}{0.81} - 1 = 0.2346
> El requisito de la banda de paso, despejado de la fórmula de la ganancia del Butterworth [[corte-orden]].
@ usa c2[1]; da c2[4]
= \lvert A(\omega)\rvert \le 0.1 \iff \Big(\frac{\tan\pi\omega_s}{\tan\pi\omega_c}\Big)^{2N} \ge \frac{1}{0.01} - 1 = 99
> El requisito de la banda de rechazo.
@ usa c2[2]; da c2[5]
= \Big(\frac{\tan\pi\omega_s}{\tan\pi\omega_p}\Big)^{2N} \ge \frac{99}{0.2346} = 422, \qquad \frac{\tan(\pi/12)}{\tan(\pi/24)} = \frac{0.26795}{0.13165} = 2.0353
> Dividimos las dos condiciones: el corte se cancela y queda una condición solo sobre $N$.
@ usa c2[1-2] c2[4-5]; da c2[3]
= N \ge \frac{\ln 422}{2\ln 2.0353} = \frac{6.045}{1.421} = 4.25 \;\Rightarrow\; N = 5
> El orden es entero: redondeamos hacia arriba. Con $N = 4$ no hay ningún corte que cumpla los dos requisitos a la vez.
@ usa c2[3-5]; da c2[6]
= \tan(\pi\omega_c) = \frac{\tan(\pi/24)}{0.2346^{1/10}} \;\Rightarrow\; \omega_c = 0.0481 \quad (\text{periodo } 20.8)
> El corte que cumple **justo** la banda de paso. Cualquier $\omega_c$ entre 0.0481 y 0.0534 sirve; `scipy` elige este extremo.
@ usa c2[1] c2[4] c2[6]; da c2[7]
= \lvert A(1/24)\rvert = 0.900, \qquad \lvert A(1/12)\rvert = 0.059
> Verificación: se cumple el 90% en la banda de paso y sobra margen en la de rechazo. Si lo vas a aplicar con `filtfilt`, la ganancia se eleva al cuadrado: pide 0.949 y 0.316 por pasada.
@ usa c2[7]; da c2[8]
:::

`scipy` hace la misma cuenta con `buttord`, que recibe los requisitos en decibeles: $-20\log_{10}(0.9) = 0.915$ dB de pérdida máxima en la banda de paso y $-20\log_{10}(0.1) = 20$ dB de atenuación mínima en la de rechazo.

```python
from scipy.signal import buttord, freqz

gpass = -20 * np.log10(0.9)                 # pérdida máxima permitida en la banda de paso (dB)
gstop = -20 * np.log10(0.1)                 # atenuación mínima en la banda de rechazo (dB)
N, wc = buttord(1 / 24, 1 / 12, gpass, gstop, fs=1)
b, a = butter(N, wc, fs=1)
_, h = freqz(b, a, worN=[1 / 48, 1 / 24, 1 / 18, 1 / 12, 1 / 6], fs=1)
print(f"orden N = {N}, corte ω_c = {wc:.4f} (periodo {1 / wc:.1f} meses)")
print("ganancia en periodos de 48, 24, 18, 12 y 6 meses:", np.round(np.abs(h), 3))
```

:::interactivo w3-orden-butter | Del requisito al orden: diseña el Butterworth {#w-orden-butter}
Escribe tus requisitos (qué periodos conservar y cuáles quitar, y con qué ganancias) y mira el orden mínimo y el corte que los cumplen, igual que `buttord`.
@@@
- **La gráfica**: las zonas verdes son las permitidas y las rosas, las prohibidas. La curva rosa (orden $N$) pasa por arriba del rombo de la banda de paso y por debajo del de la banda de rechazo; la gris punteada (orden $N - 1$, con el corte ajustado a la banda de paso) se mete en la zona prohibida de rechazo.
- Acerca los dos periodos (por ejemplo, conservar 24 y quitar 18): la bajada tiene que ser más empinada y el orden sube rápido. Relaja las ganancias y baja.
- Con la casilla de `filtfilt`, la curva es la ganancia total (al cuadrado) y cada pasada necesita menos orden.
- **Lectura**: la cuenta del orden con logaritmos, el corte y las ganancias que se obtienen.
- **Vista extra**: el orden necesario para otros periodos de rechazo, con el mismo periodo de paso.
:::

### Filtros de muesca {#notch}

:::definicion Filtro de muesca (notch)
Un rechaza banda muy angosto: ganancia 0 exactamente en $\omega_0$ y casi 1 en el resto. En `scipy`, `iirnotch(w0, Q, fs)`; el **factor de calidad** $Q$ controla el ancho de la muesca ($\text{ancho} \approx \omega_0/Q$): con $Q$ grande la muesca es angosta y casi no toca las frecuencias vecinas. Para quitar un patrón periódico que no es un coseno puro hay que poner una muesca en cada armónico $k/s$ que tenga potencia. Ejemplo: la interferencia de la red eléctrica (60 Hz) en una señal médica, o el patrón semanal ($1/7, 2/7, 3/7$) en datos diarios.
:::

La diferencia estacional también es un rechaza banda, pero con «muescas» en **todas** las $k/s$ y en la frecuencia cero. En el caso de los usuarios diarios de la Unidad II, el $\hat\Theta \approx -1$ indicaba que la diferencia $1 - L^7$ quitaba más de lo necesario [[u2:guia-usuarios]]: una alternativa era quitar solo el patrón semanal, con indicadoras, términos de Fourier o muescas.

:::interactivo w3-proponer | Laboratorio: propón el filtro para cada objetivo {#w-proponer}
Cada escenario tiene una serie simulada con componentes conocidos y un objetivo. Elige el tipo de filtro, los cortes y el orden; la gráfica compara tu resultado con el componente que había que recuperar.
@@@
- **Arriba**: la serie, el componente objetivo (punteado) y la salida de tu filtro (rosa). El error (RMSE) se calcula sin los extremos.
- **Abajo**: el periodograma de la serie con la ganancia de tu filtro encima. Un buen filtro tiene ganancia cerca de 1 donde está el objetivo y cerca de 0 donde está lo que estorba.
- El botón **Ver propuesta** muestra un diseño razonable y por qué.
- **Vista extra**: la tabla con la ganancia de tu filtro en las frecuencias de cada componente.
:::

:::duda ¿Qué hago con los valores filtrados de los extremos?
Desconfiar de ellos. Cerca de los bordes el filtro necesita datos que no existen: una media móvil centrada simplemente no se calcula ahí, Baxter–King los descarta, y `filtfilt` **inventa** datos reflejando la serie (`padtype="odd"`), así que los primeros y últimos valores dependen de ese relleno. Una regla práctica es no interpretar el primer ni el último periodo largo de lo que estás extrayendo (por ejemplo, un año en una tendencia mensual), y comparar el resultado con otro filtro: si dos diseños razonables coinciden en el centro y discrepan en las puntas, las puntas son poco confiables.
:::

:::examen Así te lo pueden preguntar: «Proponga un filtro para remover tendencia, ruido de alta frecuencia o una banda no deseada»
**Tendencia.** «Como la tendencia vive en las frecuencias más bajas, uso un **pasa altos**. La opción más sencilla es la diferencia $1 - L$, cuya ganancia $\lvert A(\omega)\rvert = 2\lvert\sin(\pi\omega)\rvert$ vale 0 en $\omega = 0$; si no quiero amplificar las frecuencias altas, uso un Butterworth pasa altos con corte en $1/P_{\max}$ (por ejemplo, $1/120$ en datos mensuales para quitar movimientos de más de 10 años) o el ciclo del HP. Verifico en el periodograma que desaparezca la potencia cerca de 0.»

**Ruido de alta frecuencia.** «Uso un **pasa bajos** con corte por debajo de las frecuencias del ruido y por encima de las que quiero conservar: por ejemplo, un Butterworth de orden 4 con corte en $1/6$ para conservar los movimientos de más de 6 meses. Si es para describir la serie, lo aplico con `filtfilt` (fase cero); si es en tiempo real, con un filtro causal, sabiendo que introduce retraso. Una media móvil centrada es la alternativa simple, aunque su ganancia no cae a cero de forma monótona.»

**Banda no deseada.** «Uso un **rechaza banda** centrado en la frecuencia de la interferencia: un filtro de muesca en $\omega_0$ (y en sus armónicos si el patrón no es senoidal) o un Butterworth rechaza banda $[\omega_1, \omega_2]$. Por ejemplo, para el patrón semanal de datos diarios, muescas en $1/7$, $2/7$ y $3/7$. Compruebo que la ganancia sea casi 0 en esas frecuencias y casi 1 en las demás, y que el periodograma ya no muestre esos picos.»
:::

:::resumen Lo que debes llevarte de cómo proponer un filtro
- Objetivo → frecuencias → tipo: tendencia = pasa altos; ruido rápido = pasa bajos; ciclo = pasa banda; interferencia = rechaza banda o muesca.
- Traduce periodos a frecuencias ($\omega = 1/P$) y revisa la ganancia del filtro en las frecuencias clave antes de aplicarlo.
- Verifica con el periodograma antes y después; descarta los extremos; `filtfilt` para describir, filtros causales para tiempo real.
- Con el CO₂: Butterworth $N = 4$, corte $1/24$, con `filtfilt`, o media móvil $2\times 12$; las dos tendencias difieren menos de 0.4 ppm.
:::
