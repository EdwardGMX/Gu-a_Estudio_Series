## 🗓️ Modelos SARIMA(p,d,q)(P,D,Q)s {#sarima}
@mapa La estacionalidad multiplicativa: polinomios estacionales, el modelo de aerolínea expandido término por término, su ACF teórica (picos en 1, 11, 12 y 13), el AR estacional, cómo leer P, D, Q y AirPassengers.

### Definición {#sarima-def}

:::definicion Modelo SARIMA(p, d, q)(P, D, Q)ₛ
$$\phi_p(L)\;\Phi_P(L^s)\;(1 - L)^d\;(1 - L^s)^D\;y_t = \theta_q(L)\;\Theta_Q(L^s)\;\varepsilon_t$$

- $\phi_p(L)$ y $\theta_q(L)$: los polinomios AR y MA **regulares** (rezagos 1, 2, …).
- $\Phi_P(L^s) = 1 - \Phi_1 L^s - \dots - \Phi_P L^{Ps}$: AR **estacional** (rezagos $s, 2s, \dots$).
- $\Theta_Q(L^s) = 1 + \Theta_1 L^s + \dots + \Theta_Q L^{Qs}$: MA **estacional**.
- $(1 - L)^d$ y $(1 - L^s)^D$: diferencias regulares y estacionales.
- $\tip{s}{s}$: periodo estacional: 12 en datos mensuales, 4 trimestrales, 7 diarios con ciclo semanal, 24 horarios con ciclo diario.

La guía oficial: *SARIMA es la extensión de ARIMA que agrega componentes estacionales. Es útil cuando hay patrones que se repiten cada $s$ periodos*. En statsmodels: `SARIMAX(y, order=(p, d, q), seasonal_order=(P, D, Q, s))`.
:::

:::intuicion Otra forma de verlo: dos relojes que se multiplican
Una serie mensual vive con dos relojes. El **regular** compara cada mes con el anterior; el **estacional**, con el mismo mes del año pasado. El modelo SARIMA pone un polinomio para cada reloj y los **multiplica**. Al multiplicar aparecen términos cruzados: por ejemplo $L \cdot L^{12} = L^{13}$, «el mes anterior del año pasado». Esos términos cruzados no cuestan parámetros extra: salen solos del producto. Por eso el modelo es tan económico.
:::

### El modelo de aerolínea: SARIMA(0,1,1)(0,1,1)₁₂ {#aerolinea}

Box y Jenkins lo propusieron precisamente para **AirPassengers** (por eso se llama así), y sigue siendo el punto de partida para casi cualquier serie mensual con tendencia y estacionalidad.

:::demo Escribir el modelo de aerolínea término por término {#demo-aerolinea}
:::pasos
= (1 - L)(1 - L^{12})\,y_t = (1 + \theta L)(1 + \Theta L^{12})\,\varepsilon_t
> Una diferencia regular, una estacional y un término MA de cada tipo.
= (1 - L)(1 - L^{12}) = 1 - L - L^{12} + L^{13}
> El lado izquierdo ya lo expandimos en [[guia-doble-dif]].
= (1 + \theta L)(1 + \Theta L^{12}) = 1 + \theta L + \Theta L^{12} + \theta\Theta L^{13}
> El lado derecho: aparece el término cruzado $\theta\Theta L^{13}$.
= y_t - y_{t-1} - y_{t-12} + y_{t-13} = \varepsilon_t + \theta\,\varepsilon_{t-1} + \Theta\,\varepsilon_{t-12} + \theta\Theta\,\varepsilon_{t-13}
> Aplicamos cada potencia de $L$ como un rezago.
= y_t = y_{t-1} + (y_{t-12} - y_{t-13}) + \varepsilon_t + \theta\,\varepsilon_{t-1} + \Theta\,\varepsilon_{t-12} + \theta\Theta\,\varepsilon_{t-13}
> Lectura: «este mes = el mes pasado + lo que cambió el año pasado entre esos mismos dos meses + choques». ¡Con solo dos parámetros!
:::
:::

#### La ACF teórica del modelo de aerolínea

La serie doblemente diferenciada $w_t = (1 - L)(1 - L^{12})\,y_t$ es un MA(13) con solo cuatro pesos distintos de cero: $\psi_0 = 1$, $\psi_1 = \theta$, $\psi_{12} = \Theta$ y $\psi_{13} = \theta\Theta$. Igual que con el MA(2) [[ma-momentos]], basta ver **qué choques comparten** $w_t$ y $w_{t-k}$:

| Choque | peso en $w_t$ | en $w_{t-1}$ | en $w_{t-11}$ | en $w_{t-12}$ | en $w_{t-13}$ |
|---|---|---|---|---|---|
| $\varepsilon_t$ | 1 | — | — | — | — |
| $\varepsilon_{t-1}$ | $\theta$ | 1 | — | — | — |
| $\varepsilon_{t-12}$ | $\Theta$ | — | $\theta$ | 1 | — |
| $\varepsilon_{t-13}$ | $\theta\Theta$ | $\Theta$ | — | $\theta$ | 1 |

Cada autocovarianza es $\sigma^2$ por la suma, renglón por renglón, del producto de la columna de $w_t$ con la de $w_{t-k}$. Por ejemplo, $w_{t-11} = \varepsilon_{t-11} + \theta\varepsilon_{t-12} + \Theta\varepsilon_{t-23} + \theta\Theta\varepsilon_{t-24}$ comparte con $w_t$ solo el choque $\varepsilon_{t-12}$, que pesa $\Theta$ en uno y $\theta$ en el otro: $\gamma(11) = \sigma^2\,\theta\Theta$.

:::demo Autocorrelaciones del modelo de aerolínea {#demo-acf-aerolinea}
Escribimos $w_t = \varepsilon_t + \theta\varepsilon_{t-1} + \Theta\varepsilon_{t-12} + \theta\Theta\varepsilon_{t-13}$ y usamos $\gamma(k) = \sigma^2\sum_j \psi_j\psi_{j+k}$ [[demo-ma-momentos]].

:::pasos
= \gamma(0) = \sigma^2(1 + \theta^2 + \Theta^2 + \theta^2\Theta^2) = \sigma^2(1 + \theta^2)(1 + \Theta^2)
> La suma de los pesos al cuadrado se factoriza.
= \gamma(1) = \sigma^2(1\cdot\theta + \Theta\cdot\theta\Theta) = \sigma^2\,\theta\,(1 + \Theta^2)
> Pares de pesos a distancia 1: $(\psi_0, \psi_1)$ y $(\psi_{12}, \psi_{13})$.
= \gamma(11) = \sigma^2\,\psi_1\psi_{12} = \sigma^2\,\theta\Theta
> A distancia 11 solo coinciden $\psi_1$ y $\psi_{12}$.
= \gamma(12) = \sigma^2(\psi_0\psi_{12} + \psi_1\psi_{13}) = \sigma^2\,\Theta\,(1 + \theta^2)
> A distancia 12: $(\psi_0, \psi_{12})$ y $(\psi_1, \psi_{13})$.
= \gamma(13) = \sigma^2\,\psi_0\psi_{13} = \sigma^2\,\theta\Theta
> A distancia 13 solo $(\psi_0, \psi_{13})$. Cualquier otra distancia no comparte nada: $\gamma(k) = 0$.
= \rho(1) = \frac{\theta}{1 + \theta^2}, \quad \rho(12) = \frac{\Theta}{1 + \Theta^2}, \quad \rho(11) = \rho(13) = \rho(1)\,\rho(12)
> Dividimos entre $\gamma(0)$. Los picos «satélite» en 11 y 13 son el **producto** de los picos en 1 y 12.
:::
:::

:::guiado ACF del modelo de aerolínea con θ = −0.4 y Θ = −0.6 {#guia-acf-aerolinea}
| $k$ | 1 | 2–10 | 11 | 12 | 13 | 14 en adelante |
|---|---|---|---|---|---|---|
| $\rho(k)$ | −0.3448 | 0 | 0.1521 | −0.4412 | 0.1521 | 0 |
---
= \rho(1) = \frac{-0.4}{1 + 0.16} = \frac{-0.4}{1.16} = -0.3448
> El pico regular: la misma fórmula del MA(1) [[guia-ma1-acf]].
@ da c2[1]
= \rho(12) = \frac{-0.6}{1 + 0.36} = \frac{-0.6}{1.36} = -0.4412
> El pico estacional: la fórmula del MA(1) aplicada al reloj de 12 meses.
@ da c5[1]
= \rho(11) = \rho(13) = (-0.3448)(-0.4412) = 0.1521
> Los satélites, **positivos** porque son el producto de dos negativos.
@ usa c2[1] c5[1]; da c4[1] c6[1]
= \rho(k) = 0 \text{ en todos los demás rezagos}
> La firma completa: un pico en 1, otro en 12 y dos pequeños en 11 y 13.
@ da c3[1] c7[1]
= \text{En AirPassengers: } \hat\rho(1) = -0.341,\;\; \hat\rho(12) = -0.387,\;\; \hat\rho(13) = 0.152
> La ACF muestral de $\Delta\Delta_{12}\ln y_t$ tiene justo esa forma. Por eso el modelo de aerolínea le queda tan bien.
@ usa c2[1] c5[1] c6[1]
:::


### El AR estacional {#ar-estacional}

:::ejemplo SARIMA(0,0,0)(1,0,0)₁₂ con Φ = 0.8
$y_t = 0.8\,y_{t-12} + \varepsilon_t$: cada mes se parece al mismo mes del año anterior. Es un AR(1) pero con el reloj de 12 meses, así que su ACF es la del AR(1) [[u1:ar1-acf]] **estirada**:

$$\rho(12) = 0.8, \qquad \rho(24) = 0.8^2 = 0.64, \qquad \rho(36) = 0.8^3 = 0.512, \qquad \rho(k) = 0 \;\text{ si } k \text{ no es múltiplo de } 12$$

Y su PACF tiene un **solo** pico, en el rezago 12, de tamaño $\Phi = 0.8$.
:::

| Componente estacional | ACF en $s, 2s, 3s$ | PACF en $s, 2s, 3s$ | Se propone |
|---|---|---|---|
| MA estacional | un pico en $s$ y nada más | picos que decaen | $Q = 1$ |
| AR estacional | picos que decaen | un pico en $s$ y nada más | $P = 1$ |
| Estacionalidad no estacionaria | decae **muy lento** en $s, 2s, 3s$ | pico grande en $s$ | $D = 1$ |
| Interacción con la parte regular | satélites en $s \pm 1$ | satélites en $s \pm 1$ | lo genera el producto, no hace falta nada |

:::interactivo w2-sarima-acf | ACF y PACF teóricas de un SARIMA {#w-sarima-acf}
Elige los coeficientes regulares y estacionales. Verás la ACF y la PACF teóricas hasta el rezago 48 con los rezagos estacionales resaltados.
@@@
- **Barras rosas**: los rezagos estacionales $12, 24, 36, 48$. **Lilas**: los demás.
- Con $\Theta \neq 0$ y $\theta \neq 0$ aparecen los satélites en 11 y 13: el producto de los dos relojes.
- Con $\Phi \neq 0$ la ACF tiene «islas» alrededor de 12, 24, 36 que se van apagando como $\Phi^k$.
- **Vista extra**: el polinomio completo $\phi(L)\Phi(L^{12})$ y $\theta(L)\Theta(L^{12})$ expandido, para que veas qué rezagos usa el modelo y con qué coeficientes.
:::

:::interactivo w2-sarima-sim | Fabrica una serie con estacionalidad {#w-sarima-sim}
Simula un SARIMA con diferencias regulares y estacionales. Así se ve una serie como AirPassengers «desde adentro».
@@@
- **Arriba**: la serie simulada $y_t$. Con $D = 1$ aparece un patrón anual que cambia lentamente; con $d = 1$, además, el nivel deambula.
- **Abajo a la izquierda**: la ACF de $y_t$ (decae lento si hay diferencias).
- **Abajo a la derecha**: la ACF de la serie diferenciada $(1 - L)^d(1 - L^{12})^D y_t$: ahí reaparece la firma del ARMA que tú elegiste.
- Prueba el modelo de aerolínea ($d = D = 1$, $\theta = -0.4$, $\Theta = -0.6$) y compara con la ACF de AirPassengers.
:::

### SARIMA para AirPassengers {#sarima-ap}

Así ajusta la guía oficial el modelo de aerolínea a $\ln y_t$ (con 1949–1959 para entrenar y 1960 para probar):

```python
log_serie = np.log(serie)
train, test = log_serie.iloc[:-12], log_serie.iloc[-12:]
modelo = SARIMAX(train, order=(0, 1, 1), seasonal_order=(0, 1, 1, 12),
                 enforce_stationarity=False, enforce_invertibility=False)
ajuste = modelo.fit(disp=False)
print(ajuste.summary())
```

```python
ajuste_def = SARIMAX(train, order=(0, 1, 1), seasonal_order=(0, 1, 1, 12)).fit(disp=False)
print("Con los valores predeterminados:")
print("  coeficientes:", np.round(ajuste_def.params.values, 4))
print("  llf =", round(ajuste_def.llf, 2), "| AIC =", round(ajuste_def.aic, 2), "| observaciones quemadas:", ajuste_def.loglikelihood_burn)
print("Con enforce_*=False:")
print("  coeficientes:", np.round(ajuste.params.values, 4))
print("  llf =", round(ajuste.llf, 2), "| AIC =", round(ajuste.aic, 2), "| observaciones quemadas:", ajuste.loglikelihood_burn)
```

:::cuidado `enforce_stationarity=False` cambia la verosimilitud
Los coeficientes casi no cambian, pero la log-verosimilitud sí: con `enforce_*=False`, statsmodels inicializa todo el estado como «difuso aproximado» y **quema** las primeras 27 observaciones en lugar de 13 ($d + sD = 1 + 12$), así que la verosimilitud se calcula con 105 datos en lugar de 119. Por eso el AIC sale muy distinto (−393 contra −441).

Regla práctica: **para comparar AIC entre modelos, ajústalos todos con la misma configuración**, de preferencia la predeterminada (`True`), que además garantiza estacionariedad e invertibilidad [[comparabilidad]].
:::

Con los valores predeterminados, el modelo estimado es

$$\Delta\Delta_{12}\ln y_t = \varepsilon_t - 0.3485\,\varepsilon_{t-1} - 0.5624\,\varepsilon_{t-12} + 0.1960\,\varepsilon_{t-13}, \qquad \hat\sigma^2 = 0.001312$$

donde $0.1960 = (-0.3485)(-0.5624)$ es el término cruzado. La desviación estándar de los choques en logaritmos es $\sqrt{0.001312} = 0.036$: cada mes el modelo se equivoca, en promedio, alrededor de un **3.6%**.

```python oculto cache
# --- Precálculo: rejilla de modelos SARIMA para log(AirPassengers) (se guarda en caché) ---
import warnings, itertools
import numpy as np, pandas as pd
from scipy import stats
from statsmodels.tsa.statespace.sarimax import SARIMAX
from statsmodels.stats.diagnostic import acorr_ljungbox
warnings.simplefilter("ignore")
_AP = [112,118,132,129,121,135,148,148,136,119,104,118,115,126,141,135,125,149,170,170,158,133,114,140,145,150,178,163,172,178,199,199,184,162,146,166,171,180,193,181,183,218,230,242,209,191,172,194,196,196,236,235,229,243,264,272,237,211,180,201,204,188,235,227,234,264,302,293,259,229,203,229,242,233,267,269,270,315,364,347,312,274,237,278,284,277,317,313,318,374,413,405,355,306,271,306,315,301,356,348,355,422,465,467,404,347,305,336,340,318,362,348,363,435,491,505,404,359,310,337,360,342,406,396,420,472,548,559,463,407,362,405,417,391,419,461,472,535,622,606,508,461,390,432]
_s = pd.Series(_AP, index=pd.date_range("1949-01-01", periods=144, freq="MS"), dtype=float)
_log = np.log(_s)
_tr, _te = _log.iloc[:-12], _log.iloc[-12:]
_xtr = _s.iloc[:-12].values
_escala = np.mean(np.abs(_xtr[12:] - _xtr[:-12]))      # MAE del ingenuo estacional (y_t − y_{t−12}) en entrenamiento

def _r(v, d=6):
    return None if v is None or not np.isfinite(v) else round(float(v), d)

def _ficha(order, sorder, trend="n"):
    res = SARIMAX(_tr, order=order, seasonal_order=sorder, trend=trend).fit(disp=False)
    burn = int(max(res.loglikelihood_burn, res.nobs_diffuse))
    ci = res.conf_int()
    pars = [[str(nm), _r(res.params[nm]), _r(res.bse[nm]), _r(res.zvalues[nm], 3), _r(res.pvalues[nm], 4), _r(ci.loc[nm, 0]), _r(ci.loc[nm, 1])] for nm in res.params.index]
    lb1 = res.test_serial_correlation("ljungbox", lags=[1])[0]
    jb = res.test_normality("jarquebera")[0]
    h = res.test_heteroskedasticity("breakvar")[0]
    est = res.standardized_forecasts_error[0][burn:]
    resid = res.resid.values[burn:]
    k_arma = order[0] + order[2] + sorder[0] + sorder[2]
    lb = acorr_ljungbox(resid, lags=[12, 24], model_df=k_arma)
    fc = res.get_forecast(12)
    m, c = fc.predicted_mean.values, fc.conf_int(alpha=0.05).values
    real, pred = np.exp(_te.values), np.exp(m)
    err = real - pred
    return {
        "orden": list(order), "estacional": list(sorder[:3]), "trend": trend,
        "nombre": f"SARIMA{tuple(order)}{tuple(sorder[:3])}12",
        "llf": _r(res.llf, 4), "aic": _r(res.aic, 4), "bic": _r(res.bic, 4), "hqic": _r(res.hqic, 4),
        "k": int(len(res.params)), "nobs": int(res.nobs), "burn": burn, "params": pars,
        "lb1": [_r(lb1[0, 0], 4), _r(lb1[1, 0], 4)], "jb": [_r(jb[0], 4), _r(jb[1], 4), _r(jb[2], 4), _r(jb[3], 4)],
        "h": [_r(h[0], 4), _r(h[1], 4)],
        "lb12": [_r(lb["lb_stat"].iloc[0], 4), _r(lb["lb_pvalue"].iloc[0], 4)],
        "lb24": [_r(lb["lb_stat"].iloc[1], 4), _r(lb["lb_pvalue"].iloc[1], 4)],
        "est": [_r(v, 4) for v in est], "resid": [_r(v, 5) for v in resid],
        "fc": [_r(v, 5) for v in m], "fc_inf": [_r(v, 5) for v in c[:, 0]], "fc_sup": [_r(v, 5) for v in c[:, 1]],
        "mae": _r(np.mean(np.abs(err)), 3), "rmse": _r(np.sqrt(np.mean(err**2)), 3),
        "mape": _r(100 * np.mean(np.abs(err / real)), 3), "smape": _r(100 * np.mean(2 * np.abs(err) / (np.abs(real) + np.abs(pred))), 3),
        "mase": _r(np.mean(np.abs(err)) / _escala, 4),
    }

_rejilla = []
for p, q, P, Q in itertools.product(range(3), range(3), range(2), range(2)):
    _rejilla.append(_ficha((p, 1, q), (P, 1, Q, 12)))
_otros = [_ficha((1, 0, 0), (0, 1, 1, 12), "c"), _ficha((2, 1, 1), (0, 0, 0, 12), "c"), _ficha((1, 1, 0), (1, 0, 0, 12), "n"), _ficha((0, 1, 1), (0, 1, 1, 12), "c")]
exportar("rejilla_ap", {"modelos": _rejilla, "otros": _otros, "fechas_tr": [str(d.date()) for d in _tr.index],
                        "log_tr": [round(float(v), 6) for v in _tr.values], "log_te": [round(float(v), 6) for v in _te.values],
                        "fechas_te": [str(d.date()) for d in _te.index], "escala_mase": round(float(_escala), 4)})
print("modelos:", len(_rejilla) + len(_otros))
```

:::interactivo w2-aerolinea | El modelo de aerolínea pronostica 1960 {#w-aerolinea}
El modelo se ajustó con 1949–1959 (sin ver 1960). Compara su pronóstico con lo que realmente pasó.
@@@
- **Línea oscura**: los datos de entrenamiento. **Rosa**: el pronóstico de 1960 con su banda de 95%. **Puntos menta**: los datos reales de 1960.
- Elige la escala: en logaritmos la banda es simétrica; en pasajeros (con `exp`) es **asimétrica**, más ancha hacia arriba [[regresar-escala]].
- **Lectura**: MAE, RMSE y MAPE del año de prueba en pasajeros [[metricas]].
- **Vista extra**: la tabla mes por mes con el pronóstico, la banda, el dato real y el error porcentual.
:::

:::duda ¿Por qué no usar un MA(13) normal en lugar del multiplicativo?
Un MA(13) completo tendría 13 coeficientes libres, la mayoría inútiles. Podrías usar un MA «con huecos» (solo rezagos 1, 12 y 13), con 3 coeficientes. El multiplicativo usa **2** e impone que el coeficiente de 13 sea el producto de los otros dos. Esa restricción casi siempre se cumple en datos reales (el efecto «mes anterior» y el efecto «año anterior» se combinan), así que ganas parsimonia sin perder ajuste.
:::

:::resumen Lo que debes llevarte del SARIMA
- $\phi(L)\Phi(L^s)(1 - L)^d(1 - L^s)^D y_t = \theta(L)\Theta(L^s)\varepsilon_t$: un polinomio por cada «reloj», multiplicados.
- Modelo de aerolínea (0,1,1)(0,1,1)₁₂: $w_t = \varepsilon_t + \theta\varepsilon_{t-1} + \Theta\varepsilon_{t-12} + \theta\Theta\varepsilon_{t-13}$; ACF con picos en 1 y 12 y satélites $\rho(11) = \rho(13) = \rho(1)\rho(12)$.
- AR estacional: ACF en $s, 2s, \dots$ que decae como $\Phi^k$; PACF con un pico en $s$. MA estacional: al revés.
- En statsmodels: `seasonal_order=(P, D, Q, s)`. No compares AIC de modelos ajustados con distinta configuración de `enforce_*`.
:::
