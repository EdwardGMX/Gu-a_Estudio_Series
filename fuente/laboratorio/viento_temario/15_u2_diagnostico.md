## 🩺 Unidad II · Diagnóstico, verosimilitud y summary {#u2-diagnostico}
@mapa El diagnóstico de residuos del mejor modelo hasta ahora (la regresión armónica con errores AR(3)): residuos iniciales, Ljung–Box con `model_df`, Jarque–Bera, la prueba H y ARCH-LM, los cuatro paneles de `plot_diagnostics`; la máxima verosimilitud paso a paso y la lectura del `summary()`.

:::pastilla verde | Aplicar · Primero: los residuos iniciales | u2:residuos-iniciales {#diag-iniciales}
Revisar los **primeros residuos** antes de diagnosticar. En un modelo con diferencias, el primer residuo es casi el valor de la serie (el modelo no tiene pasado con qué pronosticarlo) y puede arruinar todas las pruebas. Se comparan el modelo armónico (d = 0) y un ARIMA con d = 1.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| modelos | armónica + AR(3) y ARIMA(2,1,2), en √y | Uno sin y otro con diferencia. |
| descarte | los primeros 24 residuos | Más que el orden del modelo: una regla práctica. |
@@ Código
```python
res_arm = armonica.resid
res_d1 = ARIMA_Z["ARIMA(2,1,2) en √y"].resid
print("Primeros 4 residuos, armónica:", np.round(res_arm.values[:4], 3))
print("Primeros 4 residuos, ARIMA(2,1,2):", np.round(res_d1.values[:4], 3))
print(f"σ de los residuos del ARIMA(2,1,2): con todos {res_d1.std():.4f} | sin los primeros 24 {res_d1[24:].std():.4f}")
res_arm = res_arm.iloc[24:]
print(f"Residuos de la armónica que se diagnostican: {len(res_arm):,}")
```
@@ Lectura
- El primer residuo del **ARIMA(2,1,2)** vale {{=ARIMA_Z['ARIMA(2,1,2) en √y'].resid.values[0]|.2f}}: es casi el valor de √y en la primera hora, porque con d = 1 el modelo no tiene un dato anterior. Los siguientes ya son pequeños.
- En la **armónica** (d = 0) el primer residuo es más grande que los demás ({{=armonica.resid.values[0]|.2f}}), pero no tan extremo.
- Descartar los primeros 24 residuos no cambia casi la σ con tantos datos, pero sí las pruebas sensibles a valores extremos (Jarque–Bera).
@@ Decisión
✅ Se diagnostican los residuos de la armónica desde la hora 25. Con series cortas este paso es mucho más importante.
:::

:::pastilla amarillo | Aplicar · Ljung–Box sobre residuos: el argumento `model_df` | u2:lb-residuos u2:guia-model-df {#diag-lb}
Aplicar Ljung–Box a los residuos de la armónica. Con residuos de un modelo, los grados de libertad son h − (p + q): los parámetros ARMA ya "usaron" parte de la autocorrelación. Eso es `model_df`.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `model_df=3` | p + q = 3 | Los tres coeficientes AR; los de Fourier no cuentan. |
| h | 24, 48 y 96 | Un día, dos y cuatro. |
@@ Código
```python
lb_arm = acorr_ljungbox(res_arm, lags=[24, 48, 96], model_df=3)
lb_arm0 = acorr_ljungbox(res_arm, lags=[24, 48, 96])
print(pd.DataFrame({"Q": lb_arm["lb_stat"], "p con model_df=3": lb_arm["lb_pvalue"], "p sin model_df": lb_arm0["lb_pvalue"]}).round(4).to_string())
acf_arm = acf(res_arm, nlags=96, fft=True)
grandes_arm = {k: round(float(acf_arm[k]), 3) for k in range(1, 97) if abs(acf_arm[k]) > 1.96 / np.sqrt(len(res_arm))}
print(f"\nRezagos fuera de la banda: {len(grandes_arm)} de 96 → {dict(list(grandes_arm.items())[:8])}")
```
@@ Lectura
- Ljung–Box **rechaza** con h = 24 (p = {{=lb_arm['lb_pvalue'].iloc[0]|.3f}}) y con h = 96 (p = {{=lb_arm['lb_pvalue'].iloc[2]|.3f}}): queda algo de autocorrelación.
- Pero es **pequeña**: solo {{=len(grandes_arm)}} de 96 rezagos salen de la banda y el mayor vale {{=max(map(abs, grandes_arm.values()))|.3f}}. Con más de 5,000 residuos, Ljung–Box detecta autocorrelaciones minúsculas.
- Con `model_df=3` los p-values son un poco más chicos: se descuentan los grados de libertad que usaron los coeficientes AR.
@@ Decisión
🟡 Los residuos son "casi" ruido blanco: lo que queda (en 5, 23 y 24 horas) es pequeño frente a la autocorrelación original. Se acepta con la advertencia; un AR más largo lo reduciría.
:::

:::pastilla amarillo | Aplicar · Jarque–Bera: ¿son normales los residuos? | u2:jarque-bera u2:guia-jb {#diag-jb}
Probar si los residuos son **normales** con **Jarque–Bera**, que combina la asimetría (debe ser 0) y la curtosis (debe ser 3). La normalidad no es necesaria para pronosticar, pero sí para que los intervalos de predicción tengan la cobertura prometida.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `jarque_bera(res)` | JB = n/6 (S² + (K − 3)²/4) | $H_0$: normalidad. |
| comparación | los cuantiles del residuo contra los de la normal | Dónde falla la normalidad. |
@@ Código
```python
from statsmodels.stats.stattools import jarque_bera
jb_arm = jarque_bera(res_arm)
print(f"Jarque–Bera: {jb_arm[0]:,.1f}, p-value {jb_arm[1]:.1e} | asimetría {jb_arm[2]:+.3f} | curtosis {jb_arm[3]:.2f}")
est_res = (res_arm - res_arm.mean()) / res_arm.std()
print(f"Residuos estandarizados fuera de ±3: {(est_res.abs() > 3).mean():.2%} (en una normal: 0.27%)")
print(f"Cuantiles 1% y 99%: {est_res.quantile(0.01):.2f} y {est_res.quantile(0.99):.2f} (normal: −2.33 y 2.33)")
```
@@ Lectura
- Jarque–Bera **rechaza** la normalidad con mucha fuerza. La asimetría es casi 0 ({{=jb_arm[2]|+.3f}}): la raíz cuadrada hizo su trabajo. El problema es la **curtosis**, de {{=jb_arm[3]|.1f}}: colas pesadas.
- El {{=100 * (est_res.abs() > 3).mean()|.1f}}% de los residuos está más allá de ±3 desviaciones, cinco veces lo que daría una normal.
@@ Decisión
🟡 Los residuos no son normales: hay más errores grandes de los esperados (los cambios bruscos de régimen). Los intervalos de predicción normales quedarán un poco cortos en las colas.
:::

:::pastilla amarillo | Aplicar · Varianza constante: la prueba H y ARCH-LM | u2:prueba-h {#diag-h}
Probar si la varianza de los residuos es constante con dos pruebas: la **prueba H** de `summary()` compara la varianza del primer tercio de los residuos con la del último tercio; **ARCH-LM** prueba si los residuos al cuadrado se pueden predecir con sus rezagos.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `test_heteroskedasticity("breakvar")` | prueba H | La de la parte de abajo del `summary()`. |
| `het_arch(res, nlags=24)` | ARCH-LM con 24 rezagos | Un día de rezagos de e². |
@@ Código
```python
from statsmodels.stats.diagnostic import het_arch
H_arm = armonica.test_heteroskedasticity("breakvar")[0]
arch_arm = het_arch(res_arm, nlags=24)
print(f"Prueba H: estadístico {H_arm[0]:.3f}, p-value {H_arm[1]:.1e}")
print(f"ARCH-LM (24 rezagos): LM = {arch_arm[0]:,.1f}, p-value {arch_arm[1]:.1e}")
tercio = len(res_arm) // 3
print(f"Varianza del primer tercio: {res_arm[:tercio].var():.4f} | del último: {res_arm[-tercio:].var():.4f}")
print(f"Autocorrelación de los residuos al cuadrado: r₁ = {(res_arm ** 2).autocorr(1):.3f}, r₂₄ = {(res_arm ** 2).autocorr(24):.3f}")
```
@@ Lectura
- La **prueba H** rechaza: la varianza del último tercio de los residuos es {{=res_arm[-tercio:].var() / res_arm[:tercio].var()|.2f}} veces la del primero.
- **ARCH-LM** rechaza con mucha fuerza (LM = {{=arch_arm[0]|,.0f}}): los residuos al cuadrado tienen autocorrelación (r₁ = {{=(res_arm ** 2).autocorr(1)|.2f}}). Después de un error grande es probable otro error grande.
@@ Decisión
🟡 La varianza **no es constante en el tiempo**: hay periodos tranquilos y periodos agitados. Es el tema de la sección de ARCH, al final de la Unidad II.
:::

:::pastilla verde | Aplicar · Los cuatro paneles de `plot_diagnostics` | u2:plot-diagnostics u2:sim-diagnostics {#diag-paneles}
Dibujar los **cuatro paneles** que hace `plot_diagnostics()`: los residuos estandarizados en el tiempo, su histograma con la densidad normal, la gráfica cuantil–cuantil y el correlograma. Mueve el control para cambiar de panel.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| residuos estandarizados | residuo / σ | Para leerlos contra la normal estándar. |
| panel del tiempo | una muestra cada 6 horas | La serie completa pesaría mucho. |
| QQ | 400 cuantiles | Suficientes para ver las colas. |
@@ Código
```python
qs = np.linspace(0.0025, 0.9975, 400)
qq_teo, qq_obs = norm.ppf(qs), np.quantile(est_res, qs)
cu_r, bo_r = np.histogram(est_res, bins=60, density=True)
print(f"Panel QQ: el cuantil 99.75% observado es {qq_obs[-1]:.2f} contra {qq_teo[-1]:.2f} de la normal")
print(f"Correlograma: r₁ = {acf_arm[1]:+.3f}, r₂₄ = {acf_arm[24]:+.3f}")
```
@@ Resultado
```python oculto
xm_r = ((bo_r[:-1] + bo_r[1:]) / 2).round(3)
xx = np.linspace(-5, 5, 101)
control("diag-paneles", [{"etiqueta": "Panel", "tipo": "seg", "textos": ["en el tiempo", "histograma", "cuantil–cuantil", "correlograma"], "inicial": 0}],
        [[linea(est_res.index[::6], est_res.values[::6].round(2), "residuo estandarizado", "lav", 0.8)],
         [barras(xm_r, cu_r, "residuos", "lav"), linea(xx, norm.pdf(xx), "N(0, 1)", "rosa", 2.4)],
         [puntos(qq_teo.round(3), qq_obs.round(3), "cuantiles", "lav", 4), linea([-3.5, 3.5], [-3.5, 3.5], "recta de la normal", "rosa", 1.6)],
         correlograma(acf_arm[:49], len(res_arm), "ACF", 1, "lav")],
        alto=300, showlegend=False, title={"text": "Diagnóstico de la armónica + AR(3)"},
        lv=[{"yaxis": {"title": {"text": "residuo / σ"}}}, {"xaxis": {"title": {"text": "residuo / σ"}, "range": [-5, 5]}},
            {"xaxis": {"title": {"text": "cuantil de la normal"}}, "yaxis": {"title": {"text": "cuantil observado"}}},
            {"xaxis": {"title": {"text": "rezago (horas)"}, "dtick": 6}, "yaxis": {"range": [-0.1, 0.1]}}])
```
@widget lab-control id=diag-paneles
@@ Lectura
- **En el tiempo**: los residuos se ven alrededor de cero, pero con **ráfagas** de valores grandes (los periodos agitados que detectó ARCH-LM).
- **Histograma**: más alto y angosto en el centro que la normal, con colas más largas.
- **Cuantil–cuantil**: los puntos se separan de la recta en los dos extremos; el cuantil 99.75% es {{=qq_obs[-1]|.1f}} en lugar de {{=qq_teo[-1]|.1f}}.
- **Correlograma**: casi todo dentro de la banda.
@@ Decisión
✅ Los cuatro paneles cuentan lo mismo que las pruebas: la **media** está bien modelada (correlograma limpio) y la **varianza** no (colas pesadas y ráfagas).
:::

:::pastilla verde | Aplicar · Máxima verosimilitud a mano: el AR(1) en √y | u2:mv-idea u2:mv-ar1 u2:mv-factorizacion {#mv-ar1}
Calcular la **log-verosimilitud** del AR(1) en √y para muchos valores de φ y ver dónde está el máximo. La **condicional** usa la factorización $\ell(\phi) = \sum_{t=2}^{n} \ln f(z_t \mid z_{t-1})$; la **exacta** agrega el primer dato con su distribución estacionaria.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| φ | de 0.90 a 0.995 | Alrededor del valor estimado. |
| μ y σ² | los que maximizan para cada φ | Así la curva depende solo de φ (verosimilitud perfil). |
| exacta | suma ln f(z₁) con varianza σ² / (1 − φ²) | La que maximiza `ARIMA`. |
@@ Código
```python
zv = z_fit.values
def loglik_ar1(phi, exacta=False):
    mu = zv.mean()
    e = (zv[1:] - mu) - phi * (zv[:-1] - mu)
    s2 = np.mean(e ** 2)
    ll = -0.5 * len(e) * (np.log(2 * np.pi * s2) + 1)
    if exacta:
        v1 = s2 / (1 - phi ** 2)
        ll += -0.5 * (np.log(2 * np.pi * v1) + (zv[0] - mu) ** 2 / v1)
    return ll

PHIS = np.linspace(0.90, 0.995, 96)
ll_c = np.array([loglik_ar1(p) for p in PHIS])
ll_e = np.array([loglik_ar1(p, True) for p in PHIS])
print(f"Máximo condicional en φ = {PHIS[ll_c.argmax()]:.4f} | exacto en φ = {PHIS[ll_e.argmax()]:.4f} | ARIMA: {ar1_z.params['ar.L1']:.4f}")
print(f"Log-verosimilitud máxima: a mano {ll_e.max():.1f} | ARIMA {ar1_z.llf:.1f}")
```
@@ Resultado
```python oculto
grafica("mv-ar1", [linea(PHIS.round(4), (ll_c - ll_c.max()).round(2), "condicional", "lav", 2.6), linea(PHIS.round(4), (ll_e - ll_e.max()).round(2), "exacta", "rosa", 2, "dash")],
        alto=280, title={"text": "Log-verosimilitud del AR(1) en √y según φ (respecto de su máximo)"}, xaxis={"title": {"text": "φ"}},
        yaxis={"title": {"text": "ℓ(φ) − ℓ máximo"}, "range": [-200, 5]}, shapes=[vline(float(ar1_z.params["ar.L1"]), "osc")])
```
@widget lab-graf id=mv-ar1
@@ Lectura
- La log-verosimilitud tiene un **máximo único** en φ = {{=PHIS[ll_e.argmax()]|.3f}}, el mismo valor que estima `ARIMA` ({{=ar1_z.params['ar.L1']|.4f}}). La log-verosimilitud máxima a mano coincide con la de statsmodels ({{=ar1_z.llf|.1f}}).
- La condicional y la exacta casi no se distinguen: con 5,664 datos, el primer dato pesa nada.
- La curva cae rápido a los lados: con φ = 0.90 la verosimilitud es muchísimo menor. El dato descarta con claridad valores lejanos de φ̂.
@@ Decisión
✅ La máxima verosimilitud es literalmente buscar el pico de esta curva. statsmodels lo hace con un optimizador en varias dimensiones a la vez.
:::

:::pastilla azul | Aplicar · Curvatura y errores estándar | u2:mv-curvatura {#mv-curvatura}
Obtener el **error estándar** de φ̂ a partir de la **curvatura** de la log-verosimilitud en el máximo: $\text{ee}(\hat\phi) \approx \sqrt{-1 / \ell''(\hat\phi)}$. Una curva muy puntiaguda significa un parámetro bien determinado.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| ℓ'' | diferencia central con paso 10⁻⁴ | La segunda derivada numérica. |
| comparación | `bse` de `ARIMA` | statsmodels usa la misma idea (la matriz de información). |
| teórico | √((1 − φ²) / n) | La fórmula asintótica del AR(1). |
@@ Código
```python
ph_h, paso = ar1_z.params["ar.L1"], 1e-4
d2 = (loglik_ar1(ph_h + paso, True) - 2 * loglik_ar1(ph_h, True) + loglik_ar1(ph_h - paso, True)) / paso ** 2
print(f"ℓ''(φ̂) = {d2:,.0f} → ee = {np.sqrt(-1 / d2):.5f}")
print(f"ee de statsmodels: {ar1_z.bse['ar.L1']:.5f} | fórmula asintótica √((1 − φ²)/n): {np.sqrt((1 - ph_h ** 2) / len(zv)):.5f}")
print(f"Intervalo del 95% para φ: {ph_h - 1.96 * np.sqrt(-1 / d2):.4f} a {ph_h + 1.96 * np.sqrt(-1 / d2):.4f}")
```
@@ Lectura
- La segunda derivada en el máximo es muy negativa ({{=d2|,.0f}}): la curva es muy puntiaguda. El error estándar que resulta, {{=np.sqrt(-1 / d2)|.4f}}, coincide con la fórmula asintótica.
- statsmodels reporta {{=ar1_z.bse['ar.L1']|.4f}}, un poco mayor: usa el producto de gradientes (OPG), que se aleja de la curvatura cuando los residuos no son normales.
- El intervalo del 95% para φ va de {{=ph_h - 1.96 * np.sqrt(-1 / d2)|.3f}} a {{=ph_h + 1.96 * np.sqrt(-1 / d2)|.3f}}: lejos de 1.
@@ Decisión
🔵 La curvatura dice cuánta información tienen los datos sobre un parámetro. Aquí, mucha: φ está muy bien determinado.
:::

:::pastilla amarillo | Aplicar · Cómo lo hace statsmodels, y cuando falla | u2:mv-statsmodels u2:mv-arma {#mv-statsmodels}
Estimar el mismo ARMA(1,1) en √y con tres métodos de `ARIMA`: el **filtro de Kalman** (`statespace`, máxima verosimilitud exacta), **innovaciones** y **Hannan–Rissanen** (regresiones, sin optimizar). Y revisar los avisos de convergencia que aparecieron con los modelos grandes.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `method="statespace"` | por omisión | Máxima verosimilitud exacta. |
| `method="innovations_mle"` | algoritmo de innovaciones | Máxima verosimilitud por otro camino. |
| `method="hannan_rissanen"` | dos regresiones | Rápido, no exacto; sirve de valores iniciales. |
@@ Código
```python
import time
filas_mv = []
for met in ["statespace", "innovations_mle", "hannan_rissanen"]:
    t0 = time.time()
    r = ARIMA(z_fit, order=(1, 0, 1)).fit(method=met)
    filas_mv.append({"método": met, "φ": r.params["ar.L1"], "θ": r.params["ma.L1"], "σ²": r.params["sigma2"], "segundos": time.time() - t0})
print(pd.DataFrame(filas_mv).set_index("método").round(5).to_string())
print(f"\n¿Convergió la armónica? {armonica.mle_retvals.get('converged')} | iteraciones: {armonica.mle_retvals.get('iterations')}")
print(f"¿Convergió el AR(3) en √y con temperatura y presión? {m_fuga.mle_retvals.get('converged')}")
```
@@ Lectura
- Los tres métodos dan prácticamente el mismo ARMA(1,1): φ ≈ {{=filas_mv[0]['φ']|.3f}} y θ ≈ {{=filas_mv[0]['θ']|.3f}}. Hannan–Rissanen, que no optimiza, se aleja un poco en θ y en σ².
- La armónica convergió en {{=armonica.mle_retvals.get('iterations')}} iteraciones. El modelo con temperatura y presión **no convergió**: el optimizador se detuvo en el límite de iteraciones.
@@ Decisión
🟡 Un aviso de no convergencia no se ignora: el modelo con exógenas físicas ya estaba descartado, pero si fuera el elegido habría que reestimarlo (más iteraciones, otro optimizador o variables reescaladas).
:::

:::pastilla verde | Aplicar · Leer el `summary()` | u2:summary u2:summary-encabezado u2:summary-coef u2:summary-pruebas {#summary}
Leer el `summary()` de la regresión armónica de arriba abajo: el **encabezado** (modelo, observaciones, log-verosimilitud, AIC, BIC), la **tabla de coeficientes** (estimación, error estándar, z, p-value e intervalo) y las **pruebas** de la parte de abajo (Ljung–Box a 1 rezago, Jarque–Bera, prueba H).
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| modelo | armónica + AR(3) en √y | El mejor modelo de la Unidad II hasta ahora. |
| Ljung–Box del summary | a 1 rezago | Solo revisa el primero: no basta. |
@@ Código
```python
print(armonica.summary().as_text())
```
@@ Resultado
```python oculto
tabla("summary", ["parte", "qué dice", "valor"],
      [["encabezado", "log-verosimilitud / AIC / BIC", f"{armonica.llf:,.1f} / {armonica.aic:,.1f} / {armonica.bic:,.1f}"],
       ["coeficientes", "todos significativos al 5%", "sí" if (armonica.pvalues.drop('sigma2') < 0.05).all() else "no"],
       ["coeficientes", "suma de φ (persistencia)", f"{armonica.params[['ar.L1', 'ar.L2', 'ar.L3']].sum():.4f}"],
       ["abajo", "Ljung–Box a 1 rezago", f"p = {acorr_ljungbox(armonica.resid[24:], lags=[1])['lb_pvalue'].iloc[0]:.2f}"],
       ["abajo", "Jarque–Bera", f"p = {jb_arm[1]:.1e}, curtosis {jb_arm[3]:.1f}"],
       ["abajo", "prueba H", f"H = {H_arm[0]:.2f}, p = {H_arm[1]:.1e}"]],
      titulo="Lo que hay que leer en el summary()")
```
@widget lab-tabla id=summary
@@ Lectura
- **Encabezado**: 5,664 observaciones (hasta el 24 de agosto), log-verosimilitud {{=armonica.llf|.1f}}, AIC {{=armonica.aic|.1f}}. El AIC es negativo porque la escala √y es pequeña: no significa nada por sí solo.
- **Coeficientes**: todos significativos. La `const` (2.79) es la **media** de √y; los términos de Fourier dan el ciclo diario y los AR suman {{=armonica.params[['ar.L1', 'ar.L2', 'ar.L3']].sum()|.3f}}.
- **Abajo**: Ljung–Box a **un** rezago no rechaza (p = 0.95), pero ya se vio que con 24 sí. Jarque–Bera rechaza (curtosis 5.9) y la prueba H también (H = {{=H_arm[0]|.2f}}).
@@ Decisión
✅ El `summary()` resume todo el diagnóstico en una página, pero su Ljung–Box de un solo rezago es engañoso: siempre hay que correrlo aparte con varios h.
:::
