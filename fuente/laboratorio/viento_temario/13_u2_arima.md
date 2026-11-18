## 🪄 Unidad II · Transformaciones y ARIMA {#u2-arima}
@mapa Por qué transformar, el logaritmo otra vez, Box–Cox, cómo regresar a la escala original, la diferencia y la sobrediferenciación, los ARIMA famosos, la deriva, el pronóstico a mano, los intervalos con los pesos ψ y la decisión entre d = 0 y d = 1.

:::pastilla amarillo | Aplicar · ¿Por qué transformar? El error crece con el nivel | u2:por-que-transformar u1:pruebas-varianza {#tr-por-que}
Medir si el error del modelo depende del **nivel** del viento. La Unidad I ya mostró varianza no constante; aquí se ve en los residuos del AR(3): si el error es mayor cuando el viento es alto, los intervalos de varianza constante serán demasiado angostos en los nortes y demasiado anchos en las calmas.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| residuos | del AR(3) en `y_fit` | Un modelo sencillo y representativo. |
| nivel | y<sub>t−1</sub>, en intervalos de 3 m/s | El viento que había cuando se hizo el pronóstico. |
| razón | σ en el nivel más alto / σ en el más bajo | 1 si la varianza fuera constante. |
@@ Código
```python
NIVELES = [0, 3, 6, 9, 12, 15, 30]
def sd_por_nivel(resid, nivel_previo):
    return resid.groupby(pd.cut(nivel_previo.reindex(resid.index), NIVELES), observed=True).std()

sd_niv_ar3 = sd_por_nivel(AR_P[3].resid, y_fit.shift(1))
print("σ del residuo del AR(3) según el viento de la hora anterior:")
print({str(k): round(v, 3) for k, v in sd_niv_ar3.items()})
print(f"Razón entre el nivel más alto y el más bajo: {sd_niv_ar3.iloc[-1] / sd_niv_ar3.iloc[0]:.2f}")
```
@@ Lectura
- El error del AR(3) **crece con el nivel**: σ = {{=sd_niv_ar3.iloc[0]|.2f}} m/s cuando la hora anterior tenía menos de 3 m/s y alrededor de 1.3 cuando tenía más de 9.
- La razón entre el nivel más alto y el más bajo es {{=sd_niv_ar3.iloc[-1] / sd_niv_ar3.iloc[0]|.2f}}: el error es casi un 30% mayor con viento fuerte.
@@ Decisión
🟡 Confirma lo que encontró Breusch–Pagan en la Unidad I. Con varianza ligada al nivel, la Unidad II propone transformar la serie antes de modelarla.
:::

:::pastilla verde | Aplicar · La familia Box–Cox | u2:boxcox u2:w-boxcox u2:cómo-se-elige-λ {#tr-boxcox}
Buscar la transformación que **estabiliza la varianza** dentro de la familia de **Box–Cox**, $y^{(\lambda)} = \frac{y^\lambda - 1}{\lambda}$ (con λ = 0 el logaritmo). Se estima λ por máxima verosimilitud y se comprueba con los residuos del AR(3) en cada escala. Mueve el control para cambiar λ.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `stats.boxcox(y_fit)` | λ de máxima verosimilitud | El que hace la distribución más parecida a una normal. |
| λ | 0, 0.25, 0.5, 0.75 y 1 | Del logaritmo a la serie original (λ = 1). |
| criterio | razón de σ del residuo entre nivel alto y bajo | Cerca de 1: varianza estable. |
@@ Código
```python
def boxcox(v, lam):
    v = np.asarray(v, float)
    return np.log(v) if lam == 0 else (v ** lam - 1) / lam

lam_mv = stats.boxcox(y_fit.values)[1]
print(f"λ de máxima verosimilitud: {lam_mv:.3f}")
LAMS = [0, 0.25, 0.5, 0.75, 1]
sd_lam, razon_lam = {}, {}
for lam in LAMS:
    zt = pd.Series(boxcox(y_fit, lam), index=y_fit.index)
    r = AutoReg(zt, lags=3).fit()
    sd_lam[lam] = sd_por_nivel(r.resid, y_fit.shift(1))
    razon_lam[lam] = sd_lam[lam].iloc[-1] / sd_lam[lam].iloc[0]
    print(f"λ = {lam:<4}: razón σ alto / σ bajo = {razon_lam[lam]:.2f} | asimetría de la serie transformada {zt.skew():+.2f}")
```
@@ Resultado
```python oculto
etiq_niv = [f"{a}–{b}" for a, b in zip(NIVELES[:-1], NIVELES[1:])]
control("tr-boxcox", [{"etiqueta": "λ", "textos": [str(l) for l in LAMS], "inicial": 2}],
        [[barras(etiq_niv, (sd_lam[l] / sd_lam[l].mean()).values, "σ relativa del residuo", "lav")] for l in LAMS],
        base=[linea(etiq_niv, [1] * len(etiq_niv), "varianza constante", "rojo", 1.4, "dash")],
        textos=[f"λ = {l}: el residuo en vientos altos tiene <b>{razon_lam[l]:.2f}</b> veces la σ de las calmas." for l in LAMS],
        alto=280, title={"text": "σ del residuo del AR(3) según el nivel, en cada escala de Box–Cox"},
        xaxis={"title": {"text": "viento de la hora anterior (m/s)"}}, yaxis={"title": {"text": "σ / σ promedio"}, "range": [0, 1.6]})
```
@widget lab-control id=tr-boxcox
@@ Lectura
- El λ de máxima verosimilitud es **{{=lam_mv|.2f}}**, cerca de 0.5: la **raíz cuadrada**.
- Con **λ = 1** (sin transformar) el error de los vientos altos es {{=razon_lam[1]|.2f}} veces el de las calmas; con **λ = 0** (logaritmo) la relación se **invierte** ({{=razon_lam[0]|.2f}}): el log exagera los errores de las calmas.
- Con **λ = 0.5** la razón es {{=razon_lam[0.5]|.2f}} y la asimetría de la serie es casi cero ({{=pd.Series(boxcox(y_fit, 0.5)).skew()|+.2f}}). Ninguna λ deja la varianza perfectamente plana, pero la raíz es la que hace la distribución más simétrica.
@@ Decisión
✅ Se elige **z = √y** (λ = 0.5) como escala de modelado. Es una transformación suave que no castiga las calmas como el logaritmo.
:::

:::pastilla rojo | Aplicar · El logaritmo, visto de nuevo | u2:log2 u2:demo-dlog {#tr-log}
Probar el **logaritmo** (λ = 0) como transformación para modelar, aunque en la Unidad I no convenía para la descomposición. Se ajusta el AR(3) en log y se regresa a m/s con la exponencial.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `np.log(y)` | λ = 0 | El caso extremo de Box–Cox. |
| `np.exp` | regreso a m/s | Da la mediana del pronóstico, no la media. |
@@ Código
```python
ar3_log = ARIMA(np.log(y_fit), order=(3, 0, 0)).fit()
VAL["AR(3) en log"] = evaluar_sm(ar3_log, transf=np.log, inv=np.exp)
m_log = metricas(VAL["AR(3) en log"]["real"], VAL["AR(3) en log"]["pron"])
print(f"AR(3) en log: MAE {m_log['MAE']:.3f}, RMSE {m_log['RMSE']:.3f} | AR(3) en m/s: MAE {mae_ar[3]:.3f}")
print(f"Sesgo medio (real − pronóstico): en log {(VAL['AR(3) en log']['real'] - VAL['AR(3) en log']['pron']).mean():+.3f} | en m/s {(VAL['AR(3)']['real'] - VAL['AR(3)']['pron']).mean():+.3f}")
print(f"Razón σ alto / σ bajo en log: {razon_lam[0]:.2f} (en m/s: {razon_lam[1]:.2f})")
```
@@ Lectura
- El AR(3) en log es **peor** que en m/s: MAE {{=m_log['MAE']|.3f}} contra {{=mae_ar[3]|.3f}}.
- Tiene un **sesgo** grande ({{=(VAL['AR(3) en log']['real'] - VAL['AR(3) en log']['pron']).mean()|+.2f}} m/s): la exponencial del pronóstico es la mediana, que en una distribución sesgada queda por debajo de la media.
- La varianza en log no se estabiliza: se invierte (razón {{=razon_lam[0]|.2f}}).
@@ Decisión
❌ El logaritmo se descarta también para modelar. Coincide con la Unidad I: el viento tiene demasiadas calmas para el log.
:::

:::pastilla amarillo | Aplicar · Regresar a la escala original: mediana contra media | u2:regresar-escala u2:demo-lognormal {#tr-regresar}
Modelar la **raíz cuadrada** del viento (λ = 0.5) y regresar a m/s. Elevar al cuadrado el pronóstico da la **mediana** del viento futuro; para la **media** hay que sumar la varianza del pronóstico: $E[y] = E[z]^2 + \text{Var}(z)$ cuando $y = z^2$.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| z = √y | λ = 0.5 | Lo que sugirió Box–Cox. |
| mediana | ẑ² | La retransformación ingenua. |
| media | ẑ² + Var(ẑ) | Corrige el sesgo de la retransformación. |
@@ Código
```python
z = np.sqrt(y)
z_fit = z[:ini_val - pd.Timedelta(hours=1)]
ar3_z = ARIMA(z_fit, order=(3, 0, 0)).fit()
r_all_z = ar3_z.apply(z[:ORIGENES_VAL[-1] + pd.Timedelta(hours=23)])
filas_z = []
for t0 in ORIGENES_VAL:
    pr = r_all_z.get_prediction(start=t0, end=t0 + pd.Timedelta(hours=23), dynamic=True)
    idx = pd.date_range(t0, periods=24, freq="h")
    zm, zv = pr.predicted_mean.values.clip(min=0), pr.var_pred_mean.values
    filas_z.append(pd.DataFrame({"real": y[idx].values, "mediana": zm ** 2, "media": zm ** 2 + zv, "h": np.arange(1, 25)}, index=idx))
val_z = pd.concat(filas_z)
VAL["AR(3) en √y"] = val_z.rename(columns={"mediana": "pron"})[["real", "pron", "h"]]
for k in ["mediana", "media"]:
    m = metricas(val_z["real"], val_z[k])
    print(f"AR(3) en √y, {k:>7}: MAE {m['MAE']:.3f}, RMSE {m['RMSE']:.3f}, sesgo {(val_z['real'] - val_z[k]).mean():+.3f}")
print(f"AR(3) en m/s:          MAE {mae_ar[3]:.3f}, RMSE {metricas(VAL['AR(3)']['real'], VAL['AR(3)']['pron'])['RMSE']:.3f}")
```
@@ Lectura
- Elevar al cuadrado el pronóstico (la **mediana**) deja un sesgo de {{=(val_z['real'] - val_z['mediana']).mean()|+.2f}} m/s: se queda corto, sobre todo con viento fuerte.
- Sumar la varianza del pronóstico (la **media**) reduce el sesgo a {{=(val_z['real'] - val_z['media']).mean()|+.2f}} y baja el MAE a {{=metricas(val_z['real'], val_z['media'])['MAE']|.3f}}, mejor que el AR(3) en m/s ({{=mae_ar[3]|.3f}}).
@@ Decisión
🟡 La transformación ayuda **solo si se regresa bien**: con la mediana, el AR(3) en √y es peor que en m/s; con la media, es mejor. En lo que sigue se reportan las dos cuando importe. La tabla de modelos usa la mediana, que es la retransformación habitual.
:::

:::pastilla amarillo | Aplicar · Diferenciar, y diferenciar de más | u2:diferenciar2 u2:sobrediferenciar u2:demo-sobredif {#tr-diferencias}
Estimar modelos con una y con dos diferencias sobre √y. Si la serie no necesita la segunda diferencia, el MA estimado tiene un coeficiente **cercano a −1**: la sobrediferenciación crea una raíz unitaria en la parte MA.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `ARIMA(z, (0, 1, 1))` | una diferencia | El modelo más simple con d = 1. |
| `ARIMA(z, (0, 2, 1))` | dos diferencias | Una de más. |
| varianza | de ∇z y ∇²z | La sobrediferenciación aumenta la varianza. |
@@ Código
```python
m011 = ARIMA(z_fit, order=(0, 1, 1)).fit()
m021 = ARIMA(z_fit, order=(0, 2, 1)).fit()
print(f"ARIMA(0,1,1): θ = {m011.params['ma.L1']:+.4f} | ARIMA(0,2,1): θ = {m021.params['ma.L1']:+.4f}")
print(f"Varianza: z {z_fit.var():.4f} | ∇z {z_fit.diff().var():.4f} | ∇²z {z_fit.diff().diff().var():.4f}")
print(f"r₁: ∇z {z_fit.diff().autocorr(1):+.3f} | ∇²z {z_fit.diff().diff().autocorr(1):+.3f} (−0.5 es la firma de una diferencia de más)")
```
@@ Lectura
- Con **una** diferencia, el MA estimado es pequeño (θ = {{=m011.params['ma.L1']|+.3f}}): ∇√y ya es casi ruido blanco.
- Con **dos** diferencias, θ = **{{=m021.params['ma.L1']|+.4f}}**: prácticamente −1. Es la firma de la sobrediferenciación: el modelo intenta "deshacer" la diferencia de más.
- La varianza **sube** de {{=z_fit.diff().var()|.3f}} a {{=z_fit.diff().diff().var()|.3f}} con la segunda diferencia y r₁ pasa a {{=z_fit.diff().diff().autocorr(1)|+.2f}}.
@@ Decisión
🟡 d = 2 queda descartado. Entre d = 0 y d = 1 decide la validación, más abajo.
:::

:::pastilla verde | Aplicar · Los ARIMA famosos: el ingenuo y el suavizamiento exponencial | u2:arima-famosos u2:ref-arima {#arima-famosos}
Comprobar que dos referencias son ARIMA: el **ingenuo** es un ARIMA(0,1,0) (paseo aleatorio) y el **SES** es un ARIMA(0,1,1) con α = 1 + θ. Se estiman en la escala del viento y se comparan sus pronósticos.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `ARIMA(y_fit, (0, 1, 0))` | paseo aleatorio | Su pronóstico es el último valor. |
| `ARIMA(y_fit, (0, 1, 1))` | SES | Su pronóstico es el nivel suavizado. |
| α equivalente | 1 + θ̂ | La relación entre los dos modelos (es un SES "de verdad" solo si 0 < α ≤ 1). |
@@ Código
```python
m010_y = ARIMA(y_fit, order=(0, 1, 0)).fit()
m011_y = ARIMA(y_fit, order=(0, 1, 1)).fit()
alfa_eq = 1 + m011_y.params["ma.L1"]
pr010 = m010_y.forecast(3).values
pr011 = m011_y.forecast(3).values
nivel = y_fit.iloc[0]
for v in y_fit.values[1:]:
    nivel = alfa_eq * v + (1 - alfa_eq) * nivel          # la recursión del SES con α = 1 + θ
ses_eq = nivel
print(f"ARIMA(0,1,0): pronóstico {np.round(pr010, 4)} | último valor {y_fit.iloc[-1]:.4f}")
print(f"ARIMA(0,1,1): θ = {m011_y.params['ma.L1']:.4f} → α = 1 + θ = {alfa_eq:.4f} | pronóstico {np.round(pr011, 4)} | SES con ese α: {ses_eq:.4f}")
VAL["ARIMA(0,1,1)"] = evaluar_sm(m011_y)
print(f"MAE en la validación: ARIMA(0,1,1) {metricas(VAL['ARIMA(0,1,1)']['real'], VAL['ARIMA(0,1,1)']['pron'])['MAE']:.3f} | SES con α = {a_opt}: {mae_ses[a_opt]:.3f}")
```
@@ Lectura
- El ARIMA(0,1,0) pronostica exactamente el último valor: **es el ingenuo**.
- El ARIMA(0,1,1) estimado tiene θ = {{=m011_y.params['ma.L1']|+.3f}}, así que α = 1 + θ = **{{=alfa_eq|.3f}}**: mayor que 1. Su pronóstico coincide con la recursión del SES con ese α, pero un SES con α > 1 **no es un promedio**: le da más peso al último dato que al propio dato.
- Por máxima verosimilitud (error a un paso) el mejor "SES" es casi el ingenuo; en la validación a 24 horas, el SES con α = {{=a_opt}} es mucho mejor ({{=mae_ses[a_opt]|.3f}} contra {{=metricas(VAL['ARIMA(0,1,1)']['real'], VAL['ARIMA(0,1,1)']['pron'])['MAE']|.3f}}).
@@ Decisión
✅ Las referencias son modelos ARIMA. Y una lección: estimar con el error **a un paso** no garantiza el mejor modelo **a 24 pasos**.
:::

:::pastilla azul | Aplicar · La constante con diferencias: la deriva | u2:deriva u2:demo-deriva {#arima-deriva}
Agregar una constante a un modelo con d = 1: en un ARIMA(0,1,0) la constante es una **deriva**, una pendiente que se suma en cada paso. Es el paseo aleatorio con deriva de las referencias. Con el viento, ¿la deriva es significativa?
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `trend="t"` | deriva en un modelo con d = 1 | En statsmodels la constante de ∇y se escribe como tendencia en y. |
| comparación | pendiente de RWD | (y<sub>n</sub> − y<sub>1</sub>) / (n − 1). |
@@ Código
```python
m010_d = ARIMA(y_fit, order=(0, 1, 0), trend="t").fit()
deriva = m010_d.params.iloc[0]
print(f"Deriva estimada: {deriva:+.5f} m/s por hora (error estándar {m010_d.bse.iloc[0]:.5f}, p-value {m010_d.pvalues.iloc[0]:.3f})")
print(f"Pendiente del RWD: {(y_fit.iloc[-1] - y_fit.iloc[0]) / (len(y_fit) - 1):+.5f} m/s por hora")
print(f"En 24 horas la deriva suma {24 * deriva:+.3f} m/s")
```
@@ Lectura
- La deriva es de {{=deriva|+.4f}} m/s por hora, con un error estándar seis veces mayor (p-value {{=m010_d.pvalues.iloc[0]|.2f}}): **no es significativa**.
- Coincide con la pendiente del paseo con deriva: es la recta entre el primer y el último dato.
- En 24 horas suma {{=24 * deriva|+.2f}} m/s, nada.
@@ Decisión
🔵 No hay deriva: con d = 1 el modelo va sin constante. Es coherente con Mann–Kendall en la Unidad I.
:::

:::pastilla verde | Aplicar · Pronosticar un ARIMA a mano | u2:arima-pronostico u2:guia-arima-pron {#arima-mano}
Calcular a mano el pronóstico de un AR(1) en √y y compararlo con statsmodels. Para un AR(1) con media μ, el pronóstico a h pasos es $\hat z_{t+h} = \mu + \phi^h (z_t - \mu)$: la distancia a la media se encoge en un factor φ cada hora.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `ARIMA(z_fit, (1, 0, 0))` | AR(1) en √y | La recursión más sencilla. |
| origen | el primero de la validación | Un caso concreto. |
| h | 1, 2, 3, 6, 12 y 24 | Para ver cómo se acerca a la media. |
@@ Código
```python
ar1_z = ARIMA(z_fit, order=(1, 0, 0)).fit()
mu_z, phi_z = ar1_z.params["const"], ar1_z.params["ar.L1"]
z_t = z_fit.iloc[-1]
pr_sm = ar1_z.forecast(24).values
filas_h = []
for h in [1, 2, 3, 6, 12, 24]:
    a_mano = mu_z + phi_z ** h * (z_t - mu_z)
    filas_h.append({"h": h, "a mano": a_mano, "statsmodels": pr_sm[h - 1], "en m/s": a_mano ** 2})
print(f"μ = {mu_z:.4f} (√ de {mu_z ** 2:.2f} m/s) | φ = {phi_z:.4f} | último dato z_t = {z_t:.4f} ({z_t ** 2:.2f} m/s)")
print(pd.DataFrame(filas_h).set_index("h").round(4).to_string())
```
@@ Lectura
- La media del AR(1) en √y es μ = {{=mu_z|.3f}} (que en m/s es {{=mu_z ** 2|.1f}}) y φ = {{=phi_z|.3f}}.
- El último dato estaba muy abajo (z = {{=z_t|.2f}}, {{=z_t ** 2|.1f}} m/s), así que el pronóstico **sube hacia la media**: a 24 horas llega a {{=filas_h[-1]['en m/s']|.1f}} m/s. La distancia a la media se encoge en φ<sup>24</sup> = {{=phi_z ** 24|.2f}}.
- La fórmula a mano y statsmodels coinciden en todos los horizontes.
@@ Decisión
✅ Pronosticar un AR(1) a mano es aplicar φ<sup>h</sup> a la distancia entre el último dato y la media. Ojo: la media de √y elevada al cuadrado ({{=mu_z ** 2|.2f}}) no es la media del viento ({{=y_fit.mean()|.2f}}).
:::

:::pastilla verde | Aplicar · Intervalos de pronóstico con los pesos ψ | u2:intervalos-psi u2:demo-var-pronostico u2:guia-bandas {#arima-intervalos}
Calcular la varianza del error de pronóstico a h pasos, $\sigma^2 \sum_{j=0}^{h-1} \psi_j^2$, con los pesos ψ, y comparar el ancho de los intervalos de un modelo con **d = 0** (se estabiliza) y uno con **d = 1** (crece sin límite).
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| modelos | AR(3) y ARIMA(0,1,1) en √y | Uno de cada tipo. |
| ψ | `arma2ma` del polinomio completo | Con d = 1 se multiplica por (1 − L). |
| 95% | ẑ ± 1.96 σ<sub>h</sub>, luego al cuadrado | Los límites se transforman igual que el pronóstico. |
@@ Código
```python
fi3 = ar3_z.params[["ar.L1", "ar.L2", "ar.L3"]].values
psi_d0 = ArmaProcess(np.r_[1, -fi3], [1]).arma2ma(24)
psi_d1 = ArmaProcess(np.convolve([1, -1], [1]), [1, m011.params["ma.L1"]]).arma2ma(24)
sd_d0 = np.sqrt(ar3_z.params["sigma2"] * np.cumsum(psi_d0 ** 2))
sd_d1 = np.sqrt(m011.params["sigma2"] * np.cumsum(psi_d1 ** 2))
sd_sm = np.sqrt(ar3_z.get_forecast(24).var_pred_mean.values)
print(f"AR(3) en √y: σ a 1, 6 y 24 h con los ψ = {np.round(sd_d0[[0, 5, 23]], 4)} | statsmodels = {np.round(sd_sm[[0, 5, 23]], 4)}")
print(f"ARIMA(0,1,1) en √y: σ a 1, 6 y 24 h = {np.round(sd_d1[[0, 5, 23]], 4)}")
print(f"σ de largo plazo del AR(3): {np.sqrt(ar3_z.params['sigma2'] * np.sum(ArmaProcess(np.r_[1, -fi3], [1]).arma2ma(3000) ** 2)):.4f} | σ de √y: {z_fit.std():.4f}")
```
@@ Resultado
```python oculto
hh = np.arange(1, 25)
grafica("arima-intervalos", [linea(hh, 2 * 1.96 * sd_d0, "d = 0: AR(3)", "lav", 2.6), linea(hh, 2 * 1.96 * sd_d1, "d = 1: ARIMA(0,1,1)", "dur", 2.6)],
        alto=270, title={"text": "Ancho del intervalo del 95% (en √y) según el horizonte"}, xaxis={"title": {"text": "horas hacia adelante"}, "dtick": 2},
        yaxis={"title": {"text": "ancho en √(m/s)"}})
```
@widget lab-graf id=arima-intervalos
@@ Lectura
- La desviación del error del AR(3) calculada con los ψ coincide con la de statsmodels: {{=sd_d0[0]|.3f}} a una hora, {{=sd_d0[23]|.3f}} a 24.
- Con **d = 0** el ancho crece y se **estabiliza**: su límite es la desviación de la serie ({{=z_fit.std()|.3f}}).
- Con **d = 1** el ancho crece sin parar: a 24 horas ya es {{=sd_d1[23] / sd_d0[23]|.1f}} veces el del AR(3).
@@ Decisión
✅ Un modelo con d = 0 dice "a largo plazo el viento estará en su rango de siempre"; uno con d = 1 dice "podría estar en cualquier parte". Lo primero es lo físicamente razonable.
:::

:::pastilla verde | Aplicar · ARIMA en √y: ¿d = 0 o d = 1? | u2:arima-def u2:sim-arima {#arima-d}
Comparar en la validación los ARIMA en √y con **d = 0** (el viento regresa a su media, como dice ADF) y con **d = 1** (el nivel se mueve libremente, como dice KPSS). Es la decisión que la Unidad I dejó abierta.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| d = 0 | AR(3) y ARMA(2,3) | Los modelos chicos de la rejilla. |
| d = 1 | ARIMA(0,1,1), (1,1,1) y (2,1,2) | Los de diferencia más comunes. |
| escala | √y, pronóstico al cuadrado | La transformación elegida. |
@@ Código
```python
ARIMA_Z = {"ARIMA(3,0,0) en √y": ar3_z, "ARIMA(2,0,3) en √y": ARIMA(z_fit, order=(2, 0, 3)).fit(), "ARIMA(0,1,1) en √y": m011,
           "ARIMA(1,1,1) en √y": ARIMA(z_fit, order=(1, 1, 1)).fit(), "ARIMA(2,1,2) en √y": ARIMA(z_fit, order=(2, 1, 2)).fit()}
cuad = lambda v: np.clip(v, 0, None) ** 2
for k, r in ARIMA_Z.items():
    VAL[k] = evaluar_sm(r, transf=np.sqrt, inv=cuad)
tab_arima = tabla_metricas(VAL, list(ARIMA_Z))
tab_arima["sesgo a 24 h"] = [(VAL[k]["real"] - VAL[k]["pron"])[VAL[k]["h"] == 24].mean() for k in tab_arima.index]
print(tab_arima.round(3).to_string())
```
@@ Resultado
```python oculto
tabla("arima-d", ["modelo", "d", "MAE", "RMSE", "MASE", "sesgo a 24 h"],
      [[k, k.split(",")[1], f"{r['MAE']:.3f}", f"{r['RMSE']:.3f}", f"{r['MASE']:.2f}", f"{r['sesgo a 24 h']:+.2f}"] for k, r in tab_arima.iterrows()],
      ["elegido" if i == 0 else "" for i in range(len(tab_arima))], titulo="ARIMA en √y en la validación")
```
@widget lab-tabla id=arima-d
@@ Lectura
- Los modelos con **d = 0** ganan: el ARIMA(2,0,3) en √y tiene MAE {{=tab_arima['MAE'].iloc[0]|.3f}} y los de d = 1 quedan en 2.3 a 2.4, como el ingenuo.
- Los de d = 0 tienen un **sesgo negativo a 24 horas** (se pasan, unos {{=-tab_arima.loc['ARIMA(3,0,0) en √y', 'sesgo a 24 h']|.1f}} m/s): regresan a la media del entrenamiento, más alta que la de la validación. Los de d = 1 no tienen sesgo, pero tampoco aciertan.
- Ninguno le gana al AR({{=p_mejor}}) en m/s ni a Holt–Winters.
@@ Decisión
✅ **d = 0**, como decía ADF. La contradicción con KPSS queda como un sesgo: la media a la que regresa el modelo es la del entrenamiento. Se retoma en la evaluación final.
:::
