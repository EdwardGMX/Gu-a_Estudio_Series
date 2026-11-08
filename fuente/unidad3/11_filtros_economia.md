## 🏛️ Filtros clásicos en economía: Hodrick–Prescott y Baxter–King {#filtros-economia}
@mapa Dos filtros que se usan para separar la tendencia y el ciclo económico: el de Hodrick–Prescott (un pasa bajos y un pasa altos a la vez) y el de Baxter–King (un pasa banda), con su ganancia, su elección de parámetros y sus riesgos.

### El filtro de Hodrick–Prescott {#hp}

:::definicion Filtro de Hodrick–Prescott (HP)
Separa la serie en una tendencia suave $\tau_t$ y un ciclo $c_t = y_t - \tau_t$ resolviendo

$$\min_{\tau_1,\dots,\tau_n}\ \sum_{t=1}^{n}(y_t - \tau_t)^2 \;+\; \lambda\sum_{t=3}^{n}\big(\Delta^2\tau_t\big)^2$$

El primer término pide que la tendencia siga a los datos; el segundo castiga que **se doble** ($\Delta^2\tau_t = \tau_t - 2\tau_{t-1} + \tau_{t-2}$ es su «aceleración»). Con $\lambda = 0$ la tendencia es la serie; con $\lambda \to \infty$ es una recta. Valores usuales: **1600** en datos trimestrales, **129 600** en mensuales, **6.25** en anuales.
:::

:::demo La ganancia del filtro HP {#demo-ganancia-hp}
:::pasos
= -2(y_t - \tau_t) + 2\lambda\,(1 - L^{-1})^2(1 - L)^2\,\tau_t = 0
> Condición de primer orden respecto a $\tau_t$ (lejos de los extremos): $\tau_t$ aparece en tres términos del castigo, $\Delta^2\tau_t$, $\Delta^2\tau_{t+1}$ y $\Delta^2\tau_{t+2}$; $L^{-1}$ adelanta un periodo.
= y_t = \big[1 + \lambda(1 - L)^2(1 - L^{-1})^2\big]\,\tau_t
> La serie es la tendencia pasada por un filtro; despejar $\tau$ es aplicar el filtro inverso.
= (1 - e^{-2\pi i\omega})^2(1 - e^{2\pi i\omega})^2 = \lvert 1 - e^{-2\pi i\omega}\rvert^4 = 4\big(1 - \cos 2\pi\omega\big)^2
> En frecuencia, $L \to e^{-2\pi i\omega}$; usamos $\lvert 1 - e^{-2\pi i\omega}\rvert^2 = 2 - 2\cos 2\pi\omega$ [[demo-ganancia-diferencia]].
= A_\tau(\omega) = \frac{1}{1 + 4\lambda(1 - \cos 2\pi\omega)^2}, \qquad A_c(\omega) = 1 - A_\tau(\omega) = \frac{4\lambda(1 - \cos 2\pi\omega)^2}{1 + 4\lambda(1 - \cos 2\pi\omega)^2}
> La tendencia es un **pasa bajos** y el ciclo un **pasa altos**; las dos ganancias son reales (fase cero) porque el filtro es simétrico.
:::
:::

:::guiado ¿Qué periodos deja en el ciclo el HP con λ = 1600? {#guia-hp}
| Periodo (trimestres) | $\omega = 1/P$ | $1 - \cos(2\pi\omega)$ | $u = 4\lambda(1 - \cos)^2$ | Ganancia del ciclo $u/(1 + u)$ |
|---|---|---|---|---|
| 8 | 0.125 | 0.29289 | 549.0 | 0.998 |
| 16 | 0.0625 | 0.07612 | 37.09 | 0.974 |
| 32 | 0.03125 | 0.01921 | 2.363 | 0.703 |
| 40 | 0.025 | 0.01231 | 0.970 | 0.492 |
| 64 | 0.0156 | 0.00482 | 0.148 | 0.129 |
---
= P = 8:\quad 1 - \cos(\pi/4) = 0.29289, \qquad u = 6400(0.29289)^2 = 549.0
> Con $4\lambda = 6400$. Un ciclo de 2 años pasa completo al componente cíclico (99.8%).
@ usa c2[1]; da c3[1] c4[1]
= \frac{549.0}{550.0} = 0.998
> Ganancia del ciclo.
@ usa c4[1]; da c5[1]
= P = 32:\quad u = 6400(0.01921)^2 = 2.363 \;\Rightarrow\; \frac{2.363}{3.363} = 0.703
> En el límite largo del ciclo económico (8 años) el HP ya deja solo el 70%.
@ usa c3[3]; da c4[3] c5[3]
= P = 40:\quad u = 0.970 \;\Rightarrow\; 0.492
> La ganancia del ciclo cruza 1/2 cerca de 40 trimestres (10 años): es el «corte» del HP con $\lambda = 1600$.
@ usa c4[4]; da c5[4]
= P = 64:\quad 0.129
> Las oscilaciones de 16 años van casi completas a la tendencia.
@ usa c5[5]
:::

Una curiosidad útil: con los valores usuales, el corte del HP queda **siempre cerca de los 10 años**: con $\lambda = 6.25$ en datos anuales cae en 9.8 años, y con $\lambda = 129\,600$ en datos mensuales en 119 meses. Por eso esos valores se consideran equivalentes entre frecuencias de muestreo.

:::interactivo w3-hp | Hodrick–Prescott sobre el PIB de EE. UU. {#w-hp}
Cambia λ y mira la tendencia, el ciclo y la ganancia del filtro sobre el logaritmo del PIB real trimestral (1959–2009).
@@@
- **Arriba**: $100\ln(\text{PIB})$ y su tendencia HP.
- **En medio**: el ciclo $c_t = y_t - \tau_t$ (en % respecto a la tendencia); las recesiones aparecen como valles.
- **Abajo**: la ganancia del ciclo $A_c(\omega)$ con la franja del ciclo económico (6 a 32 trimestres). Con λ pequeño, el ciclo pierde los periodos largos; con λ enorme, la tendencia es casi una recta y el «ciclo» absorbe todo.
- **Vista extra**: la desviación estándar del ciclo y el periodo donde la ganancia cruza 1/2.
:::

### Baxter–King: un pasa banda para el ciclo económico {#bk}

El HP es un pasa altos: deja en el ciclo también el ruido de muy corto plazo. **Baxter y King** propusieron un **pasa banda** que aísla solo los periodos de 6 a 32 trimestres. Es un filtro FIR simétrico: el pasa banda ideal truncado a $2K + 1$ pesos [[demo-filtro-ideal]].

:::definicion Filtro de Baxter–King
Con la banda de periodos $[\Per_{\min}, \Per_{\max}]$, en radianes $\omega_1 = 2\pi/\Per_{\max}$ y $\omega_2 = 2\pi/\Per_{\min}$:

$$b_0 = \frac{\omega_2 - \omega_1}{\pi}, \qquad b_j = \frac{\sin(j\omega_2) - \sin(j\omega_1)}{\pi j}, \quad j = 1, \dots, K$$

y a todos se les resta su promedio para que sumen cero (ganancia 0 en la frecuencia cero: elimina la tendencia). El ciclo es $c_t = \sum_{j=-K}^{K}b_{\lvert j\rvert}\,y_{t-j}$. Con datos trimestrales, lo usual es $[6, 32]$ y $K = 12$: se pierden 12 datos al inicio y 12 al final.
:::

:::interactivo w3-bk | Baxter–King: aislar ciclos de 6 a 32 trimestres {#w-bk}
Elige la banda de periodos y el número de pesos $K$; compara la ganancia con la del pasa banda ideal y el ciclo resultante con el del HP.
@@@
- **Arriba**: la ganancia del BK (curva) contra el ideal (rectángulo). Con $K$ chico la banda se desdibuja; con $K$ grande se acerca al ideal pero se pierden más datos en los extremos.
- **Abajo**: el ciclo BK del PIB y, punteado, el ciclo HP. Son muy parecidos (correlación cercana a 0.96), pero el BK es más suave porque quitó el ruido de menos de 6 trimestres.
- **Vista extra**: los pesos $b_j$ como barras (simétricos y con suma cero).
:::

### En Python {#filtros-economia-python}

```python
from statsmodels.tsa.filters.hp_filter import hpfilter
from statsmodels.tsa.filters.bk_filter import bkfilter
from statsmodels.tsa.filters.cf_filter import cffilter

lpib = np.log(macro.realgdp.values) * 100                    # en %: el ciclo queda en % de la tendencia
ciclo_hp, tendencia_hp = hpfilter(lpib, lamb=1600)
ciclo_bk = bkfilter(lpib, low=6, high=32, K=12)              # pierde K = 12 datos de cada lado
ciclo_cf, _ = cffilter(lpib, low=6, high=32, drift=True)     # Christiano–Fitzgerald: no pierde datos
print(f"desviación estándar del ciclo: HP = {ciclo_hp.std():.2f}%, BK = {ciclo_bk.std():.2f}%, CF = {ciclo_cf.std():.2f}%")
print(f"datos: HP = {len(ciclo_hp)}, BK = {len(ciclo_bk)}, CF = {len(ciclo_cf)}")
print("correlación HP–BK:", round(np.corrcoef(ciclo_hp[12:-12], ciclo_bk)[0, 1], 3))
for lam in [100, 1600, 14400]:
    print(f"λ = {lam:5d}: desviación estándar del ciclo HP = {hpfilter(lpib, lamb=lam)[0].std():.2f}%")
```

El ciclo del PIB tiene una desviación estándar de alrededor de 1.5%, sea cual sea el filtro; pero cambia mucho con λ (0.9% con λ = 100, 2.0% con λ = 14 400). **El tamaño del «ciclo» lo decide en buena parte el analista** al elegir el filtro.

:::cuidado Los riesgos de estos filtros
- **Usan el futuro**: el HP y el BK son simétricos (de fase cero). La tendencia HP del último trimestre cambia cuando llegan datos nuevos (el problema del final de muestra). No los uses para construir variables de un modelo de pronóstico [[fase-cero]].
- **Pueden crear ciclos**: aplicado a un paseo aleatorio, el HP produce un «ciclo» con periodo típico de varios años aunque los datos no tengan ninguno (crítica de Hamilton, 2018). El ciclo filtrado no prueba que exista un ciclo.
- **Los extremos son poco confiables** en todos: el BK simplemente los descarta; el HP y el CF los estiman con menos información.
:::

:::duda ¿Por qué λ = 1600?
Hodrick y Prescott lo eligieron suponiendo que una desviación de 5% del ciclo es tan probable como un cambio de 1/8 de punto en la tasa de crecimiento de la tendencia en un trimestre: $\lambda = (5/(1/8))^2 = 1600$. En términos espectrales, equivale a poner el corte (ganancia 1/2) cerca de 40 trimestres. No es una ley natural: es una convención útil para comparar estudios.
:::

:::resumen Lo que debes llevarte de HP y Baxter–King
- HP: $\min\sum(y_t - \tau_t)^2 + \lambda\sum(\Delta^2\tau_t)^2$; tendencia = pasa bajos, ciclo = pasa altos con ganancia $\frac{4\lambda(1 - \cos 2\pi\omega)^2}{1 + 4\lambda(1 - \cos 2\pi\omega)^2}$.
- Con λ = 1600 (trimestral) el corte está cerca de 40 trimestres; λ = 129 600 (mensual) y 6.25 (anual) dan cortes similares en años.
- BK: pasa banda FIR para 6–32 trimestres con $K = 12$; pierde $K$ datos de cada lado. CF no los pierde.
- Son de fase cero (usan el futuro) y pueden crear ciclos aparentes: úsalos para describir, no para pronosticar.
:::
