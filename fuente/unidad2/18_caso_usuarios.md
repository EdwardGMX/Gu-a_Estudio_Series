## 👥 Caso SARIMAX: usuarios diarios con días festivos {#caso-usuarios}
@mapa Una serie diaria con patrón semanal y festivos: por qué s = 7, el SARIMA sin exógenas contra el SARIMAX con festivos, la interpretación de β en logaritmos, el Θ cercano a −1 y la mejora en el pronóstico.

### El problema {#usuarios-problema}

Una estación de transporte registra sus **usuarios diarios** durante dos años (728 días). La serie tiene tres rasgos que la guía oficial menciona como típicos de datos de demanda:

- un **patrón semanal**: entre semana hay más usuarios que el fin de semana, así que $s = 7$;
- un **crecimiento** lento a lo largo del tiempo;
- **días festivos** en los que la afluencia cae mucho, y que no caen siempre el mismo día de la semana.

Los datos son simulados con efectos conocidos (los festivos bajan el logaritmo en 0.30, es decir, un 26%), así que podemos comprobar si el modelo los recupera. Entrenamos con los primeros 700 días y probamos con los últimos 28.

```python oculto cache
# --- Precálculo: caso de usuarios diarios con festivos, SARIMA vs SARIMAX (se guarda en caché) ---
import warnings
import numpy as np, pandas as pd
from statsmodels.tsa.statespace.sarimax import SARIMAX
from statsmodels.stats.diagnostic import acorr_ljungbox
warnings.simplefilter("ignore")
_rng = np.random.default_rng(2026)
_n = 728
_fechas = pd.date_range("2024-01-01", periods=_n, freq="D")
_efecto = np.array([0.05, 0.06, 0.06, 0.05, 0.04, -0.20, -0.35])
_u = np.zeros(_n); _ch = _rng.normal(0, 0.04, _n)
for _t in range(1, _n):
    _u[_t] = 0.6 * _u[_t - 1] + _ch[_t]
_fest_d = pd.to_datetime(["2024-01-01", "2024-02-05", "2024-03-18", "2024-03-28", "2024-03-29", "2024-05-01", "2024-09-16", "2024-11-18",
    "2024-12-12", "2024-12-25", "2025-01-01", "2025-02-03", "2025-03-17", "2025-04-17", "2025-04-18", "2025-05-01",
    "2025-09-16", "2025-11-17", "2025-12-12", "2025-12-25"])
_fest = pd.Series(_fechas.isin(_fest_d).astype(float), index=_fechas, name="festivo")
_logu = np.log(50_000) + 0.0004 * np.arange(_n) + _efecto[_fechas.dayofweek] + _u - 0.30 * _fest.values
_usu = pd.Series(np.round(np.exp(_logu)), index=_fechas, name="Usuarios")
_ly = np.log(_usu)
_ytr, _yte = _ly.iloc[:-28], _ly.iloc[-28:]
_ftr, _fte = _fest.iloc[:-28], _fest.iloc[-28:]
_A = SARIMAX(_ytr, order=(1, 0, 0), seasonal_order=(0, 1, 1, 7), trend="c").fit(disp=False)
_B = SARIMAX(_ytr, exog=_ftr, order=(1, 0, 0), seasonal_order=(0, 1, 1, 7), trend="c").fit(disp=False)
_real = np.exp(_yte.values)
def _info(res, exog=None):
    fc = res.get_forecast(28, exog=exog)
    m, c = fc.predicted_mean.values, fc.conf_int().values
    pred = np.exp(m); err = _real - pred
    burn = int(max(res.loglikelihood_burn, res.nobs_diffuse))
    ci = res.conf_int()
    lb = acorr_ljungbox(res.resid.values[burn:], lags=[7, 14], model_df=2)
    return {"params": [[str(k), round(float(res.params[k]), 6), round(float(res.bse[k]), 6), round(float(res.zvalues[k]), 3), round(float(res.pvalues[k]), 4),
                        round(float(ci.loc[k, 0]), 6), round(float(ci.loc[k, 1]), 6)] for k in res.params.index],
            "llf": round(float(res.llf), 3), "aic": round(float(res.aic), 3), "bic": round(float(res.bic), 3),
            "pred": [round(float(v), 1) for v in pred], "inf": [round(float(v), 1) for v in np.exp(c[:, 0])], "sup": [round(float(v), 1) for v in np.exp(c[:, 1])],
            "resid": [round(float(v), 5) for v in res.resid.values[burn:]], "burn": burn,
            "mae": round(float(np.mean(np.abs(err))), 1), "rmse": round(float(np.sqrt(np.mean(err ** 2))), 1),
            "mape": round(float(100 * np.mean(np.abs(err / _real))), 3),
            "lb": [[round(float(a), 3), round(float(b), 4)] for a, b in zip(lb["lb_stat"], lb["lb_pvalue"])]}
exportar("usuarios", {"fechas": [str(d.date()) for d in _fechas], "usuarios": [int(v) for v in _usu.values],
                      "festivo": [int(v) for v in _fest.values], "n_test": 28,
                      "A": _info(_A), "B": _info(_B, _fte)})
print("A aic", round(_A.aic, 2), "B aic", round(_B.aic, 2))
```

:::interactivo w2-usuarios | SARIMA contra SARIMAX en los últimos 28 días {#w-usuarios}
Las estrellas rosas son días festivos. Compara el pronóstico del modelo sin exógenas (A) con el del modelo que sabe qué días son festivos (B).
@@@
- **Arriba**: los últimos días de entrenamiento y los 28 de prueba, con el pronóstico del modelo que elijas y su banda de 95%.
- El modelo A pronostica un día «normal» aunque sea festivo; el B baja el pronóstico ese día porque conoce el calendario [[requisitos-exog]].
- **Abajo**: los residuos del entrenamiento. En el modelo A los festivos dejan residuos negativos enormes (lo que el modelo no supo explicar); en el B desaparecen.
- **Vista extra**: las tablas de coeficientes de los dos modelos.
:::

### Los dos modelos {#usuarios-modelos}

```python cache
rng = np.random.default_rng(2026)
n = 728
fechas = pd.date_range("2024-01-01", periods=n, freq="D")
efecto_dia = np.array([0.05, 0.06, 0.06, 0.05, 0.04, -0.20, -0.35])           # lunes ... domingo
u = np.zeros(n); choques = rng.normal(0, 0.04, n)
for t in range(1, n):
    u[t] = 0.6 * u[t - 1] + choques[t]                                          # errores AR(1)
dias_festivos = pd.to_datetime(["2024-01-01", "2024-02-05", "2024-03-18", "2024-03-28", "2024-03-29", "2024-05-01", "2024-09-16",
    "2024-11-18", "2024-12-12", "2024-12-25", "2025-01-01", "2025-02-03", "2025-03-17", "2025-04-17", "2025-04-18", "2025-05-01",
    "2025-09-16", "2025-11-17", "2025-12-12", "2025-12-25"])
festivo = pd.Series(fechas.isin(dias_festivos).astype(float), index=fechas, name="festivo")
log_u = np.log(50_000) + 0.0004 * np.arange(n) + efecto_dia[fechas.dayofweek] + u - 0.30 * festivo.values
usuarios = pd.Series(np.round(np.exp(log_u)), index=fechas, name="Usuarios")

y_log = np.log(usuarios)
y_tr, y_te = y_log.iloc[:-28], y_log.iloc[-28:]
x_tr, x_te = festivo.iloc[:-28], festivo.iloc[-28:]
modelo_A = SARIMAX(y_tr, order=(1, 0, 0), seasonal_order=(0, 1, 1, 7), trend="c").fit(disp=False)
modelo_B = SARIMAX(y_tr, exog=x_tr, order=(1, 0, 0), seasonal_order=(0, 1, 1, 7), trend="c").fit(disp=False)
print(modelo_B.summary().tables[1])
real_u = np.exp(y_te)
for nombre, m, x in [("A (sin festivos)", modelo_A, None), ("B (con festivos)", modelo_B, x_te)]:
    pred_u = np.exp(m.get_forecast(28, exog=x).predicted_mean)
    print(f"{nombre}: AIC = {m.aic:9.2f} | MAPE prueba = {100 * np.mean(np.abs((real_u - pred_u) / real_u)):.2f}%")
```

:::guiado Interpretar el modelo B {#guia-usuarios}
| Parámetro | Estimado | Lectura |
|---|---|---|
| `intercept` | 0.0009 | deriva del error diferenciado: crecimiento semanal |
| `festivo` | −0.3101 | efecto de un festivo en el log |
| `ar.L1` | 0.652 | memoria día a día del error |
| `ma.S.L7` | −0.990 | MA estacional casi en −1 |
| `sigma2` | 0.0017 | varianza del choque diario |
---
= \hat\beta = -0.310 \;\Rightarrow\; e^{-0.310} - 1 = -0.267 = -26.7\%
> Un festivo reduce los usuarios un 27% ese día. El valor verdadero de la simulación era $-0.30$ (un 26%): el modelo lo recupera [[log2]].
@ usa c2[2]
= \hat\phi = 0.652 \approx 0.6
> La memoria AR(1) del error también se recupera (en la simulación era 0.6).
@ usa c2[3]
= \hat\Theta = -0.990 \approx -1
> Con $\Theta = -1$ el factor $(1 - L^7)$ de la diferencia y el $(1 - L^7)$ del MA se cancelan: el patrón semanal es **determinístico** (el mismo efecto cada lunes, cada domingo…), y diferenciar estacionalmente fue de más [[sobrediferenciar]].
@ usa c2[4]
= \frac{0.0009}{1 - 0.652} = 0.0027 \approx 7 \times 0.0004
> La media de la serie diferenciada es el crecimiento de una semana en logaritmos: 0.27% semanal, como en la simulación.
@ usa c2[1] c2[3]
:::

:::duda ¿Qué hago con un Θ tan cerca de −1?
Es la señal de sobrediferenciación estacional que vimos en [[demo-sobredif]], ahora en el reloj de 7 días. El modelo funciona (sus pronósticos son buenos), pero una alternativa más limpia es **no** diferenciar estacionalmente y modelar el día de la semana con exógenas: seis variables indicadoras (lunes a sábado) o términos de Fourier con periodo 7 [[festivos]]. Es una buena discusión para el reporte: muestra que entiendes lo que dice el coeficiente.
:::

### Resultados {#usuarios-resultados}

| Modelo | AIC | MAPE en los 28 días de prueba |
|---|---|---|
| A: SARIMA(1,0,0)(0,1,1)₇ con constante | −1750.07 | 5.38% |
| B: el mismo con la exógena `festivo` | −2407.13 | 4.46% |

El AIC baja en más de 650 unidades: la diferencia es enorme porque en el modelo A cada festivo produce un residuo de alrededor de −0.3, cuando la desviación típica del choque es 0.04 (¡más de 7 desviaciones!). En la prueba, el MAPE baja casi un punto porcentual, y la mejora se concentra justo en los días festivos.

:::examen Así se redacta la conclusión
«Se ajustó un SARIMAX(1,0,0)(0,1,1)₇ con constante al logaritmo de los usuarios diarios, con la variable indicadora de día festivo como exógena. El coeficiente del festivo es −0.310 (z ≈ −30), lo que equivale a una reducción del 27% en los usuarios esos días. Incluir la exógena reduce el AIC de −1750.1 a −2407.1 y el MAPE de prueba de 5.38% a 4.46%. La variable es válida para pronosticar porque los días festivos se conocen con anticipación, así que no introduce fuga de información. El MA estacional estimado ($\hat\Theta \approx -1$) indica que el patrón semanal es prácticamente determinístico; una alternativa sería modelarlo con indicadoras de día de la semana.»
:::

:::resumen Lo que debes llevarte del caso SARIMAX
- Datos diarios con patrón semanal: $s = 7$. Los festivos que no caen siempre el mismo día se modelan con una **exógena** conocida a futuro.
- En `SARIMAX` el coeficiente de la exógena es su efecto contemporáneo; en logaritmos se lee como $100(e^\beta - 1)\%$.
- Para pronosticar hay que dar la exógena futura (`exog=x_futuro`).
- Un $\hat\Theta \approx -1$ delata una estacionalidad determinística (sobrediferenciación estacional).
:::
