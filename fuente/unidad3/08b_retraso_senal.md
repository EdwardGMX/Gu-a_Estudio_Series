## 🧲 Regresión con retraso y extracción de señales {#retraso-senal .prof}
@mapa Los incisos 3.4.2 y 3.4.3 del temario: la correlación cruzada y el preblanqueo, la regresión con retraso en el tiempo y en la frecuencia, el modelo señal más ruido y el filtro óptimo de Wiener, que resulta ser la coherencia y explica de dónde sale el filtro de Hodrick–Prescott.

El espectro cruzado [[cruzado]] dice **en qué frecuencias** se mueven juntas dos series y con qué desfase. Esta sección da el paso siguiente: usar esa relación para **explicar** una serie con los valores pasados de otra (regresión con retraso) y para **separar** una señal del ruido que la tapa (filtro de Wiener). Las dos ideas son la misma cuenta, $f_{yx}/f_x$, como en Shumway y Stoffer.

### Correlación cruzada y preblanqueo {#ccf}

:::definicion Función de correlación cruzada (CCF)
$$\rho_{yx}(k) = \frac{\gamma_{yx}(k)}{\sigma_x\,\sigma_y}, \qquad \hat\rho_{yx}(k) = \frac{\frac1n\sum_t (y_{t+k} - \bar y)(x_t - \bar x)}{s_x\,s_y}$$

con $\gamma_{yx}(k) = \Cov(y_{t+k},\ x_t)$ [[cov-cruzada]]. Un pico en $k > 0$ dice que $y$ responde a $x$ **$k$ periodos después**.

- Si **al menos una** de las dos series es ruido blanco y no hay relación, $\hat\rho_{yx}(k) \approx N(0,\ 1/n)$: la banda es $\pm 2/\sqrt n$.
- Si las **dos** están autocorrelacionadas, la varianza de $\hat\rho_{yx}(k)$ es mucho mayor y aparecen picos anchos y espurios.
- **Preblanqueo**: se ajusta un AR a $x$, $\phi(L)x_t = w_t$, y se aplica **el mismo filtro** $\phi(L)$ a $y$. La CCF entre $\tilde y_t = \phi(L)y_t$ y $w_t$ ya se lee con la banda $\pm 2/\sqrt n$.
:::

:::intuicion Quitar el eco antes de escuchar
Si $x$ es muy persistente, $x_t$ se parece a $x_{t-1}$, $x_{t-2}$… Cuando $y$ responde a $x_{t-3}$, también «se parece» a todos sus vecinos y la CCF sale alta en muchos rezagos: es el eco de la autocorrelación de $x$. Preblanquear es quitar ese eco: después, $w_t$ ya no se parece a sus vecinos y la CCF solo marca el rezago verdadero.
:::

:::demo El preblanqueo conserva los coeficientes {#demo-preblanqueo}
:::pasos
= y_t = \sum_r \beta_r\,x_{t-r} + v_t, \qquad \phi(L)\,x_t = w_t \;\text{(ruido blanco)}
> El modelo de la relación y el AR que describe a $x$.
= \phi(L)\,y_t = \sum_r \beta_r\,\phi(L)\,x_{t-r} + \phi(L)\,v_t \;\Rightarrow\; \tilde y_t = \sum_r \beta_r\,w_{t-r} + \tilde v_t
> Se aplica $\phi(L)$ a los dos lados. Como es lineal, pasa a través de la suma y los $\beta_r$ **no cambian**.
= \Cov(\tilde y_{t+k},\ w_t) = \beta_k\,\sigma_w^2
> $w$ es ruido blanco: de toda la suma, solo el término con $r = k$ comparte el choque $w_t$.
= \rho_{\tilde y w}(k) = \beta_k\,\frac{\sigma_w}{\sigma_{\tilde y}}
> La CCF preblanqueada es **proporcional a los coeficientes**: sus picos señalan qué rezagos importan, y $\hat\beta_k = \hat\rho_{\tilde y w}(k)\,s_{\tilde y}/s_w$.
:::
:::

:::guiado Preblanquear con φ = 0.5 {#guia-preblanqueo}
| $t$ | $x_t$ | $y_t$ | $w_t = x_t - 0.5\,x_{t-1}$ | $\tilde y_t = y_t - 0.5\,y_{t-1}$ |
|---|---|---|---|---|
| 1 | 4 | 1 | — | — |
| 2 | 2 | 3 | 0 | 2.5 |
| 3 | 3 | 2 | 2 | 0.5 |
| 4 | −1 | 4 | −2.5 | 3 |
| 5 | 1 | 0 | 1.5 | −2 |
---
= \hat\phi = 0.5 \;\Rightarrow\; \phi(L) = 1 - 0.5L
> Supongamos que el AR(1) ajustado a $x$ dio $\hat\phi = 0.5$.
@ usa c2[1-5]
= \begin{gathered} w_2 = 2 - 0.5(4) = 0, \quad w_3 = 3 - 0.5(2) = 2 \\ w_4 = -1 - 0.5(3) = -2.5, \quad w_5 = 1 - 0.5(-1) = 1.5 \end{gathered}
> Los residuos del AR(1): $x$ preblanqueada. Se pierde el primer dato.
@ usa c2[1-5]; da c4[2-5]
= \begin{gathered} \tilde y_2 = 3 - 0.5(1) = 2.5, \quad \tilde y_3 = 2 - 0.5(3) = 0.5 \\ \tilde y_4 = 4 - 0.5(2) = 3, \quad \tilde y_5 = 0 - 0.5(4) = -2 \end{gathered}
> **El mismo filtro** se aplica a $y$, aunque $y$ no sea un AR(1). Si se blanqueara $y$ con su propio modelo, los $\beta_r$ cambiarían [[demo-preblanqueo]].
@ usa c3[1-5]; da c5[2-5]
:::

:::ejemplo Leer la CCF preblanqueada
Con $n = 100$ (banda $\pm 0.2$), la CCF entre $\tilde y$ y $w$ dio $0.05,\ 0.12,\ 0.58,\ 0.35,\ -0.06$ en los rezagos $k = 0, 1, 2, 3, 4$, con $s_{\tilde y} = 3$ y $s_w = 1.5$.

- Solo $k = 2$ y $k = 3$ salen de la banda: $y$ empieza a responder **dos periodos después** de $x$ y la respuesta dura dos periodos.
- $\hat\beta_2 = 0.58 \times 3/1.5 = 1.16$ y $\hat\beta_3 = 0.35 \times 2 = 0.70$.
- Modelo propuesto: $y_t = \alpha + \beta_2\,x_{t-2} + \beta_3\,x_{t-3} + \text{error}$, que se estima con mínimos cuadrados (o con errores ARMA) en las series originales.
:::

### Modelos de regresión con retraso {#regresion-retraso}

:::definicion Regresión con retraso (rezagos distribuidos)
$$y_t = \sum_{r=-\infty}^{\infty}\beta_r\,x_{t-r} + v_t$$

con $x_t$ y $v_t$ estacionarias e independientes entre sí. $\beta_r$ es cuánto se mueve $y$, $r$ periodos después, por un movimiento unitario de $x$: es la **respuesta al impulso** del filtro que lleva de $x$ a $y$ [[respuesta-impulso]]. En la práctica se usan unos cuantos rezagos, $y_t = \alpha + \beta_d x_{t-d} + \dots + \beta_{d+s}x_{t-d-s} + v_t$, elegidos con la CCF preblanqueada.

**En frecuencia** (Shumway y Stoffer), los coeficientes salen del espectro cruzado:
$$B(\omega) = \sum_r \beta_r\,e^{-2\pi i\omega r} = \frac{f_{yx}(\omega)}{f_x(\omega)}, \qquad \beta_r = \int_{-1/2}^{1/2} B(\omega)\,e^{2\pi i\omega r}\,d\omega$$
y el error cuadrático medio mínimo es $\displaystyle\int_{-1/2}^{1/2} f_y(\omega)\big[1 - \rho^2_{yx}(\omega)\big]\,d\omega$.
:::

:::intuicion Dos caminos a la misma respuesta
En el **tiempo**: la CCF preblanqueada dice **cuándo** responde $y$, y la regresión, **cuánto**. En la **frecuencia**: la ganancia $\lvert B(\omega)\rvert$ dice cuánto pasa de $x$ a $y$ en cada frecuencia, la pendiente de la fase dice el retardo [[demo-retardo]] y la transformada inversa devuelve los $\beta_r$. La fórmula $B = f_{yx}/f_x$ es la misma de la coherencia como $R^2$ [[demo-coh-r2]]: «covarianza entre varianza», frecuencia por frecuencia.
:::

Una simulación: $x$ es un AR(1) muy persistente ($\phi = 0.9$) y $y_t = 1.5\,x_{t-3} + v_t$.

```python
import statsmodels.api as sm
from statsmodels.tsa.ar_model import AutoReg

rng = np.random.default_rng(7)
n_r = 400
x_r = signal.lfilter([1], [1, -0.9], rng.normal(size=n_r + 100))[100:]      # x: AR(1) con φ = 0.9
y_r = np.r_[np.zeros(3), 1.5 * x_r[:-3]] + rng.normal(0, 2, n_r)            # y_t = 1.5 x_{t-3} + ruido

def ccf(a, b, K=6):
    """Correlación cruzada r_ab(k) = corr(a_{t+k}, b_t) para k = -K … K."""
    a = (a - a.mean()) / a.std()
    b = (b - b.mean()) / b.std()
    n = len(a)
    return pd.Series({k: (a[k:] * b[:n - k]).sum() / n if k >= 0 else (a[:n + k] * b[-k:]).sum() / n
                      for k in range(-K, K + 1)})

phi_x = AutoReg(x_r, lags=1, trend="n").fit().params[0]                    # 1) AR(1) para x
w_r = x_r[1:] - phi_x * x_r[:-1]                                           # 2) x preblanqueada
y_pb = y_r[1:] - phi_x * y_r[:-1]                                          # 3) el MISMO filtro a y
print(f"φ̂ = {phi_x:.3f} | banda ±2/√n = ±{2 / np.sqrt(n_r):.2f}")
print(pd.DataFrame({"CCF cruda": ccf(y_r, x_r), "CCF preblanqueada": ccf(y_pb, w_r)}).loc[-2:6].round(2).T)
```

La CCF cruda es alta en **todos** los rezagos, incluso en los negativos (¡como si $y$ anticipara a $x$!): es el eco de la persistencia de $x$. Preblanqueada, solo el rezago 3 sale de la banda. Ahora se estima cuánto, primero en el tiempo y luego en la frecuencia:

```python
rez = pd.DataFrame({"y": y_r, **{f"x(t-{j})": pd.Series(x_r).shift(j) for j in range(6)}}).dropna()
m_rez = sm.OLS(rez["y"], sm.add_constant(rez.drop(columns="y"))).fit()
print(pd.DataFrame({"β̂": m_rez.params, "p-value": m_rez.pvalues}).iloc[1:].round(3).T)

# La misma respuesta en frecuencia: B(ω) = f_yx / f_x y su transformada inversa
_, p_xx = signal.welch(x_r, nperseg=64)
_, p_xy = signal.csd(x_r, y_r, nperseg=64)                                 # csd(x, y) = f_yx (fase de y respecto a x)
beta_frec = np.fft.irfft(p_xy / p_xx, n=64)
print("β̂_r estimados en frecuencia, r = 0 … 5:", np.round(beta_frec[:6], 2))
```

Los dos caminos encuentran lo mismo: un solo coeficiente grande, en el rezago 3, cerca del verdadero 1.5 (el cálculo en frecuencia es algo más ruidoso en los demás rezagos). En una aplicación real se agregaría un modelo ARMA para el error (un ARMAX o SARIMAX con $x_{t-3}$ como exógena [[u2:exogenas]]).

### Señal más ruido {#senal-ruido}

:::definicion Modelo de señal más ruido
$$y_t = s_t + n_t$$

- $s_t$: la **señal** que interesa (un ciclo, una tendencia, la temperatura verdadera), estacionaria con espectro $f_s(\omega)$.
- $n_t$: el **ruido** (error de medición, variaciones de corto plazo), estacionario con espectro $f_n(\omega)$ y no correlacionado con $s_t$.
- Solo se observa $y_t$, con $f_y = f_s + f_n$. Se busca el filtro $\hat s_t = \sum_r a_r\,y_{t-r}$ que minimice $\E\big[(s_t - \hat s_t)^2\big]$.
- La **razón señal a ruido** en cada frecuencia es $\mathrm{SNR}(\omega) = f_s(\omega)/f_n(\omega)$.

Es una regresión con retraso [[regresion-retraso]] donde la «entrada» es lo que se observa ($y$) y la «salida» es lo que se quiere recuperar ($s$).
:::

:::intuicion Sintonizar el radio
Una estación de radio llega con estática. Un buen ecualizador sube el volumen en las frecuencias donde la estación es fuerte y lo baja donde solo hay estática. Eso es extraer una señal: dejar pasar cada frecuencia en proporción a qué tanto de ella es señal. Ningún filtro puede separar señal y ruido **dentro** de una misma frecuencia: ahí solo puede decidir cuánto dejar pasar.
:::

### El filtro óptimo de Wiener {#wiener}

:::definicion Filtro de Wiener
El filtro lineal que minimiza el error cuadrático medio tiene función de transferencia
$$A(\omega) = \frac{f_s(\omega)}{f_s(\omega) + f_n(\omega)} = \frac{\mathrm{SNR}(\omega)}{1 + \mathrm{SNR}(\omega)}$$
y el espectro del error que deja es
$$f_e(\omega) = \frac{f_s(\omega)\,f_n(\omega)}{f_s(\omega) + f_n(\omega)}, \qquad \text{ECM mínimo} = \int_{-1/2}^{1/2} f_e(\omega)\,d\omega$$

- $0 \le A(\omega) \le 1$ y es **real**: no desfasa (es simétrico y usa datos pasados y futuros).
- Donde domina la señal, $A \approx 1$ (pasa); donde domina el ruido, $A \approx 0$ (corta).
- $A(\omega)$ es la **coherencia** entre lo observado y la señal, $\rho^2_{ys}(\omega)$.
:::

:::demo De dónde sale la ganancia de Wiener {#demo-wiener}
:::pasos
= \Cov(s_{t+k},\ y_t) = \Cov(s_{t+k},\ s_t + n_t) = \gamma_s(k) \;\Rightarrow\; f_{sy}(\omega) = f_s(\omega)
> El ruido no se correlaciona con la señal: el espectro cruzado entre lo que se quiere y lo que se observa es el de la señal.
= f_y(\omega) = f_s(\omega) + f_n(\omega)
> Las varianzas de dos procesos no correlacionados se suman, frecuencia por frecuencia.
= A(\omega) = \frac{f_{sy}(\omega)}{f_y(\omega)} = \frac{f_s(\omega)}{f_s(\omega) + f_n(\omega)}
> Es el $B = f_{yx}/f_x$ de la regresión con retraso [[regresion-retraso]], con $y$ como entrada y $s$ como salida.
= \rho^2_{sy}(\omega) = \frac{\lvert f_{sy}\rvert^2}{f_s\,f_y} = \frac{f_s^2}{f_s\,(f_s + f_n)} = \frac{f_s}{f_s + f_n} = A(\omega)
> La ganancia óptima **es** la coherencia: se deja pasar la fracción de cada frecuencia que es señal [[demo-coh-r2]].
= f_e(\omega) = f_s\big(1 - \rho^2_{sy}\big) = f_s\,\frac{f_n}{f_s + f_n}
> Lo que no se puede recuperar: la parte de la señal que, en cada frecuencia, está revuelta con el ruido.
:::
:::

:::guiado Ganancia de Wiener para una señal AR(1) con ruido blanco {#guia-wiener}
| $\omega$ | $1.64 - 1.6\cos 2\pi\omega$ | $f_s(\omega)$ | $A(\omega) = f_s/(f_s + 1)$ | $f_e(\omega)$ |
|---|---|---|---|---|
| 0 | 0.04 | 25 | 0.962 | 0.962 |
| 0.1 | 0.346 | 2.894 | 0.743 | 0.743 |
| 0.25 | 1.64 | 0.610 | 0.379 | 0.379 |
| 0.5 | 3.24 | 0.309 | 0.236 | 0.236 |
---
= s_t = 0.8\,s_{t-1} + \varepsilon_t,\ \sigma_\varepsilon^2 = 1 \;\Rightarrow\; f_s(\omega) = \frac{1}{1 + 0.64 - 1.6\cos 2\pi\omega}
> El espectro del AR(1) [[demo-espectro-ar1]]. El ruido es blanco con $f_n = 1$.
@ usa c1[1-4]; da c2[1-4]
= \begin{gathered} \omega = 0:\ f_s = \frac{1}{0.04} = 25 \\ \omega = 0.1:\ \cos(0.2\pi) = 0.809 \;\Rightarrow\; f_s = \frac{1}{1.64 - 1.294} = 2.894 \end{gathered}
> La señal es «roja»: casi toda su potencia está en frecuencias bajas.
@ usa c2[1-2]; da c3[1-2]
= \omega = 0.25:\ f_s = \frac{1}{1.64} = 0.610, \qquad \omega = 0.5:\ f_s = \frac{1}{3.24} = 0.309
> En las frecuencias altas la señal es más débil que el ruido ($f_s < 1$).
@ usa c2[3-4]; da c3[3-4]
= \begin{gathered} A(0) = \frac{25}{26} = 0.962, \qquad A(0.1) = \frac{2.894}{3.894} = 0.743 \\ A(0.25) = \frac{0.610}{1.610} = 0.379, \qquad A(0.5) = \frac{0.309}{1.309} = 0.236 \end{gathered}
> Un **pasa bajos** suave: deja casi todo en $\omega = 0$ y corta parte de las frecuencias altas, pero nunca del todo, porque ahí también hay algo de señal.
@ usa c3[1-4]; da c4[1-4]
= f_e = \frac{f_s \cdot 1}{f_s + 1} = A(\omega)
> Con $f_n = 1$ el espectro del error coincide con la ganancia. El error es grande en las frecuencias bajas en valor absoluto, pero ahí es una fracción mínima de la señal (0.96 de 25).
@ usa c4[1-4]; da c5[1-4]
:::

En Python, filtrar es **multiplicar en frecuencia**: transformada de Fourier, multiplicar por $A(\omega)$ y transformada inversa.

```python
from scipy import integrate

rng = np.random.default_rng(12)
n_w = 1024
s_w = signal.lfilter([1], [1, -0.8], rng.normal(size=n_w + 100))[100:]     # señal: AR(1) con φ = 0.8, σ² = 1
y_w = s_w + rng.normal(0, 1, n_w)                                           # lo observado: señal + ruido (f_n = 1)

om = np.fft.rfftfreq(n_w)                                                   # frecuencias de Fourier 0 … 0.5
f_s = 1 / np.abs(1 - 0.8 * np.exp(-2j * np.pi * om)) ** 2                  # espectro de la señal
s_wiener = np.fft.irfft(f_s / (f_s + 1) * np.fft.rfft(y_w), n=n_w)         # Wiener con los espectros verdaderos

# En la práctica f_s no se conoce: se estima f_y con Welch y se le resta el ruido (se supone f_n = 1)
f_b, p_y = signal.welch(y_w, nperseg=128)
A_est = np.clip(1 - 1 / (p_y / 2), 0, 1)                                    # scipy reporta 2f (densidad unilateral)
s_est = np.fft.irfft(np.interp(om, f_b, A_est) * np.fft.rfft(y_w), n=n_w)

s_mm3 = np.convolve(y_w, np.ones(3) / 3, mode="same")                        # para comparar: media móvil de 3
fs_teo = lambda w: 1 / (1.64 - 1.6 * np.cos(2 * np.pi * w))
ecm_teo = 2 * integrate.quad(lambda w: fs_teo(w) / (fs_teo(w) + 1), 0, 0.5)[0]
ecm = lambda est: np.mean((est - s_w)[10:-10] ** 2)                         # sin los bordes
print(f"Varianza de la señal: {s_w.var():.2f}")
print(f"ECM sin filtrar = {ecm(y_w):.3f} | media móvil de 3 = {ecm(s_mm3):.3f} | "
      f"Wiener estimado = {ecm(s_est):.3f} | Wiener exacto = {ecm(s_wiener):.3f} (mínimo teórico {ecm_teo:.3f})")
```

Sin filtrar, el error es la varianza del ruido (cerca de 1). La media móvil de 3 lo baja a 0.57; el filtro de Wiener con los espectros verdaderos, a 0.47, prácticamente el mínimo teórico: **ningún filtro lineal lo hace mejor**. Estimando la señal con Welch, suponiendo solo que el ruido es blanco con varianza 1, queda en 0.52, todavía mejor que la media móvil.

:::demo El filtro de Hodrick–Prescott es un filtro de Wiener {#demo-hp-wiener}
:::pasos
= \begin{gathered} y_t = \tau_t + c_t, \qquad \Delta^2\tau_t = u_t,\ \Var(u_t) = \sigma_\tau^2 \\ c_t \text{ ruido blanco},\ \Var(c_t) = \sigma_c^2 \end{gathered}
> Un modelo de señal más ruido: la «señal» es una tendencia cuya aceleración es ruido blanco y el «ruido» es el ciclo.
= f_\tau(\omega) = \frac{\sigma_\tau^2}{\lvert 1 - e^{-2\pi i\omega}\rvert^4} = \frac{\sigma_\tau^2}{4\,(1 - \cos 2\pi\omega)^2}
> El filtro $\Delta^2$ convierte la tendencia en ruido blanco, así que el espectro de la tendencia es el del ruido dividido entre la ganancia de $\Delta^2$ [[filtro-espectro]]. (La tendencia no es estacionaria; la fórmula vale como pseudoespectro.)
= A_\tau(\omega) = \frac{f_\tau}{f_\tau + \sigma_c^2} = \frac{1}{1 + \frac{\sigma_c^2}{\sigma_\tau^2}\,4\,(1 - \cos 2\pi\omega)^2}
> La ganancia de Wiener, dividiendo arriba y abajo entre $f_\tau$.
= \lambda = \frac{\sigma_c^2}{\sigma_\tau^2} \;\Rightarrow\; A_\tau(\omega) = \frac{1}{1 + 4\lambda\,(1 - \cos 2\pi\omega)^2}
> Exactamente la ganancia del HP [[demo-ganancia-hp]]. Elegir $\lambda = 1600$ es suponer que la varianza del ciclo es 1600 veces la de la aceleración de la tendencia.
:::
:::

:::cuidado Límites del filtro de Wiener
- Necesita **conocer** $f_s$ y $f_n$, o suponer la forma de uno para estimar el otro. Si el modelo de la señal está mal, el filtro deja de ser óptimo.
- Es **no causal**: usa datos futuros. Sirve para limpiar la historia, no para estimar la señal de hoy en tiempo real (para eso se usan versiones causales, como el filtro de Kalman).
- Al filtrar con la transformada de Fourier, los extremos de la serie quedan peor estimados, igual que con cualquier filtro simétrico [[filtros-economia]].
:::

:::resumen Regresión con retraso y extracción de señales
- CCF: $\hat\rho_{yx}(k) = \widehat{\Cov}(y_{t+k}, x_t)/(s_xs_y)$, banda $\pm 2/\sqrt n$ solo si una serie es ruido blanco. **Preblanquear**: AR para $x$ y el mismo filtro para $y$; los picos señalan los rezagos y $\hat\beta_k = \hat\rho_{\tilde yw}(k)\,s_{\tilde y}/s_w$.
- Regresión con retraso: $y_t = \sum_r\beta_r x_{t-r} + v_t$; en frecuencia, $B(\omega) = f_{yx}/f_x$ y $\beta_r$ es su transformada inversa.
- Señal más ruido: $y_t = s_t + n_t$. Filtro de Wiener: $A(\omega) = f_s/(f_s + f_n) = \rho^2_{ys}(\omega)$, real, entre 0 y 1; error $f_sf_n/(f_s + f_n)$.
- El HP es un filtro de Wiener con $\lambda = \sigma_c^2/\sigma_\tau^2$.
:::
