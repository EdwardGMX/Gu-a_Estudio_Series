## 🗒️ Formulario y checklist de la Unidad III {#formulario3}
@mapa Todas las fórmulas de la unidad en una página, las conversiones de frecuencia, los estimadores del espectro, los filtros, las funciones de Python, el flujo para el examen y los errores que restan puntos.

### Fórmulas {#formulas3}

| Concepto | Fórmula | Ver |
|---|---|---|
| Oscilación | $A\cos(2\pi\omega t + \varphi) = \beta_1\cos(2\pi\omega t) + \beta_2\sin(2\pi\omega t)$, $A = \sqrt{\beta_1^2 + \beta_2^2}$ | [[demo-fase-regresion]] |
| Periodo y frecuencia | $\Per = 1/\omega$; radianes $\lambda = 2\pi\omega$; Nyquist $\omega = 1/2$ | [[oscilacion]] |
| Alias | $\omega_{\text{alias}} = \lvert\omega - \operatorname{round}(\omega)\rvert$ | [[demo-alias]] |
| Varianza de una oscilación | $A^2/2$ | [[guia-tres-componentes]] |
| Suma de componentes | $\gamma(h) = \sum_k\sigma_k^2\cos(2\pi\omega_k h)$, $\Var = \sum_k\sigma_k^2$ | [[demo-varianza-componentes]] |
| ACF de una oscilación con fase al azar | $\rho(k) = \cos(2\pi\omega k)$ (no decae) | [[demo-acf-oscilacion]] |
| Densidad espectral | $f(\omega) = \sum_k\gamma(k)e^{-2\pi i\omega k} = \gamma(0) + 2\sum_{k\ge1}\gamma(k)\cos(2\pi\omega k)$ | [[demo-propiedades-f]] |
| Inversa y varianza | $\gamma(k) = \int_{-1/2}^{1/2}e^{2\pi i\omega k}f(\omega)\,d\omega$, $\gamma(0) = 2\int_0^{1/2}f(\omega)\,d\omega$ | [[demo-propiedades-f]] |
| Ruido blanco | $f(\omega) = \sigma^2$ | [[demo-espectro-rb]] |
| MA(1) | $f(\omega) = \sigma^2(1 + \theta^2 + 2\theta\cos 2\pi\omega)$ | [[demo-espectro-ma1]] |
| AR(1) | $f(\omega) = \sigma^2/(1 + \phi^2 - 2\phi\cos 2\pi\omega)$ | [[demo-espectro-ar1]] |
| Pico del AR(2) | $\cos(2\pi\omega^*) = \phi_1(\phi_2 - 1)/(4\phi_2)$ | [[demo-pico-ar2]] |
| ARMA | $f(\omega) = \sigma^2\lvert\theta(e^{-2\pi i\omega})\rvert^2/\lvert\phi(e^{-2\pi i\omega})\rvert^2$ | [[espectro-arma]] |
| DFT | $d(\omega_j) = n^{-1/2}\sum_{t=1}^n x_t e^{-2\pi i\omega_j t}$, $\omega_j = j/n$ | [[dft-def]] |
| Periodograma | $I(\omega_j) = \lvert d(\omega_j)\rvert^2 = \sum_{\lvert k\rvert<n}\hat\gamma(k)e^{-2\pi i\omega_j k}$; $P(\omega_j) = \frac4n I(\omega_j) = \beta_1^2 + \beta_2^2$ | [[demo-periodograma-acf]] |
| Parseval | $\sum(x_t - \bar x)^2 = \sum_{j=1}^{n-1}I(\omega_j)$ | [[parseval]] |
| Distribución del periodograma | $2I(\omega_j)/f(\omega_j) \approx \chi^2_2$; IC: $[\,2I/\chi^2_2(0.975),\ 2I/\chi^2_2(0.025)\,] = [0.271I,\ 39.5I]$ | [[guia-ic-periodograma]] |
| Daniell | $\hat f(\omega_j) = \frac1{\Lsp}\sum_{k=-m}^{m}I(\omega_j + k/n)$, $\Lsp = 2m + 1$, $\Bw = \Lsp/n$, gl $= 2\Lsp$ | [[idea-suavizar]] |
| IC del suavizado | $[\,2\Lsp\hat f/\chi^2_{2\Lsp}(0.975),\ 2\Lsp\hat f/\chi^2_{2\Lsp}(0.025)\,]$ | [[guia-daniell]] |
| Welch | $\Kseg$ segmentos de $M$; resolución $1/M$; gl $\approx 2\Kseg$ | [[welch]] |
| AR paramétrico | $\hat f(\omega) = \hat\sigma^2/\lvert 1 - \sum_k\hat\phi_k e^{-2\pi i\omega k}\rvert^2$ | [[ar-espectral]] |
| Espectro cruzado | $\gamma_{yx}(k) = \Cov(y_{t+k}, x_t)$, $f_{yx}(\omega) = \sum_k\gamma_{yx}(k)e^{-2\pi i\omega k} = c_{yx} - iq_{yx}$ | [[cov-cruzada]] |
| Coherencia y fase | $\rho^2_{yx} = \lvert f_{yx}\rvert^2/(f_xf_y)$; $\varphi = \operatorname{atan2}(-q_{yx}, c_{yx})$; retardo: $\varphi = -2\pi\omega D$ | [[demo-retardo]] |
| Umbral de coherencia | $\hat\rho^2 > F_{2,2\Lsp-2}/(\Lsp - 1 + F_{2,2\Lsp-2})$ (0.312 con $\Lsp = 9$) | [[coherencia-cruda]] |
| Filtro lineal | $y_t = \sum_j a_j x_{t-j}$; $A(\omega) = \sum_j a_j e^{-2\pi i\omega j}$; $f_y = \lvert A(\omega)\rvert^2 f_x$ | [[demo-filtro-espectro]] |
| Media móvil centrada de 3 | $A(\omega) = (1 + 2\cos 2\pi\omega)/3$, cero en $\omega = 1/3$ | [[guia-ganancia-mm3]] |
| Diferencias | $\lvert 1 - e^{-2\pi i\omega}\rvert^2 = 4\sin^2(\pi\omega)$; $1 - L^{s}$: cero en $k/s$ | [[demo-ganancia-diferencia]] |
| Butterworth pasa bajos | $\lvert A(\omega)\rvert = [1 + (\tan\pi\omega/\tan\pi\omega_c)^{2N}]^{-1/2}$; vale 0.707 en $\omega_c$ | [[guia-butterworth]] |
| Filtro ideal | $a_j = \sin(2\pi\omega_c j)/(\pi j)$, $a_0 = 2\omega_c$ | [[demo-filtro-ideal]] |
| `filtfilt` | Ganancia $\lvert A\rvert^2$, fase 0 (usa el futuro) | [[demo-filtfilt]] |
| Hodrick–Prescott | Ciclo: $\frac{4\lambda(1 - \cos 2\pi\omega)^2}{1 + 4\lambda(1 - \cos 2\pi\omega)^2}$; con λ = 1600, ganancia 1/2 en ~40 trimestres | [[demo-ganancia-hp]] |

### Conversiones rápidas {#conversiones3}

| Datos | Ciclo | Periodo | $\omega$ (ciclos por observación) | Con `fs` |
|---|---|---|---|---|
| Mensuales | anual | 12 | 0.0833 | `fs=12` → 1 ciclo por año |
| Mensuales | semestral (armónico) | 6 | 0.1667 | 2 ciclos por año |
| Trimestrales | anual | 4 | 0.25 | `fs=4` → 1 |
| Trimestrales | ciclo económico | 6 a 32 | 0.031 a 0.167 | — |
| Diarios | semanal | 7 | 0.1429 | `fs=7` → 1 ciclo por semana |
| Anuales | ciclo solar | ≈ 11 | ≈ 0.091 | — |

### Python de la unidad {#python3}

| Para… | Función | Recuerda |
|---|---|---|
| Periodograma | `signal.periodogram(x, fs, detrend, window, scaling)` | Devuelve $2I$ (densidad unilateral); quita la media por omisión |
| Welch | `signal.welch(x, fs, nperseg, noverlap, window)` | Elige `nperseg` a mano si $n < 256$ |
| Espectro cruzado y coherencia | `signal.csd(x, y, …)`, `signal.coherence(x, y, …)` | `csd(x, y)` = $\overline{X}Y$: fase de $y$ respecto a $x$ |
| FFT | `np.fft.fft(x)`, `np.fft.rfft(x)` | $I(\omega_j) = \lvert\text{fft}\rvert^2/n$ |
| AR para el espectro | `yule_walker(x, order=p, method="mle")` | Devuelve $\hat\phi$ y $\hat\sigma$ (no $\hat\sigma^2$) |
| Respuesta de un filtro | `signal.freqz(b, a, worN, fs)` | Con `fs=1`, frecuencias en ciclos por observación |
| Diseñar filtros | `signal.butter`, `signal.firwin`, `signal.iirnotch` | `output="sos"` para órdenes altos |
| Aplicar filtros | `signal.lfilter` (causal), `signal.filtfilt` (fase cero) | `filtfilt` usa el futuro |
| Tendencia y ciclo | `hpfilter`, `bkfilter`, `cffilter` | `bkfilter` pierde $K$ datos de cada lado |

### Flujo para un análisis espectral en el examen {#flujo3}

1. **Construir la serie**: índice temporal, frecuencia, faltantes y unidades.
2. **Graficar** y describir tendencia, estacionalidad, ciclos y atípicos.
3. **Volverla estacionaria**: logaritmo, quitar la tendencia o diferenciar [[ap-transformaciones]].
4. **Periodograma** crudo para ubicar frecuencias; **traducir a periodos**.
5. **Suavizar** (Daniell o Welch) y, si conviene, un **AR** con orden por AIC; comparar los tres [[comparacion-espectral]].
6. Clasificar cada pico: **línea angosta** (periodicidad) o **joroba ancha** (ciclo) [[periodo-vs-ciclo]].
7. Si hay dos series: **coherencia y fase** suavizadas, con su umbral [[cruzado]].
8. Si hay que filtrar: objetivo → tipo → corte y orden → ganancia → aplicar y verificar [[receta-filtro]].
9. **Conclusión** con números: frecuencias, periodos, fracción de la varianza, método y limitaciones [[elnino-conclusion]].

### Errores comunes que restan puntos {#errores3}

:::cuidado Evita estos errores
- Dar frecuencias sin traducirlas a **periodos** con unidades (meses, años) [[oscilacion]].
- Confundir la $\omega$ en radianes (Unidad II) con la $\omega$ en ciclos por observación [[unidades-frecuencia]].
- Analizar el espectro de una serie con **tendencia** sin quitarla [[fuga]].
- Interpretar picos del periodograma **crudo** como si fueran precisos [[periodograma-ruido]].
- Comparar valores de `scipy` con los de un libro sin dividir entre 2 [[periodograma-python]].
- Llamar «periodo» a un **ciclo** y modelarlo con un SARIMA de periodo fijo [[cuando-sarima]].
- Calcular la coherencia **sin suavizar** (siempre da 1) o leer la fase donde la coherencia es baja [[coherencia-cruda]].
- Usar `filtfilt`, HP o BK para construir variables de un **pronóstico** [[fase-cero]].
- Olvidar que la diferencia **amplifica** las frecuencias altas [[diferencia-filtro]].
:::

### Checklist: antes del examen debes poder… {#checklist3}

- [ ] Diferenciar periodicidad y ciclo con ejemplos, y explicar cómo se ve cada uno en la ACF y en el espectro.
- [ ] Convertir entre periodo, frecuencia en ciclos y frecuencia en radianes, y explicar el alias y el límite de Nyquist.
- [ ] Escribir una oscilación como regresión sobre un coseno y un seno, y recuperar amplitud y fase.
- [ ] Definir la densidad espectral, su relación con la autocovarianza y por qué su área es la varianza.
- [ ] Calcular a mano el espectro del ruido blanco, del MA(1), del AR(1) y el pico de un AR(2).
- [ ] Explicar el papel de la transformada de Fourier y calcular un periodograma pequeño a mano (con Parseval).
- [ ] Explicar por qué el periodograma es ruidoso e inconsistente, y armar el IC con la $\chi^2$.
- [ ] Suavizar con Daniell (ancho de banda, grados de libertad, IC) y explicar Welch.
- [ ] Comparar la estimación espectral paramétrica y la no paramétrica.
- [ ] Explicar magnitud, fase y coherencia, leer un retardo en la fase y decidir si una coherencia es significativa.
- [ ] Calcular la respuesta al impulso, la función de transferencia y la ganancia de medias móviles y diferencias.
- [ ] Usar $f_y = \lvert A(\omega)\rvert^2 f_x$ para explicar qué hace un filtro.
- [ ] Describir los filtros pasa bajos, pasa altos, pasa banda y rechaza banda, la frecuencia de corte y el orden.
- [ ] Proponer un filtro para remover tendencia, ruido de alta frecuencia o una banda no deseada.
- [ ] Explicar la diferencia entre filtrar en tiempo real (`lfilter`) y con fase cero (`filtfilt`).
- [ ] Redactar la conclusión de un análisis espectral con evidencia.
