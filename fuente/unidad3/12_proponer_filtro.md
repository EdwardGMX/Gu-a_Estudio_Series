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
