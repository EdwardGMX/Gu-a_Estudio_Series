## 🔀 Unidad II · ARMA y Box–Jenkins {#u2-arma}
@mapa El ARMA(1,1) estimado, sus pesos ψ y su ACF, la cancelación de raíces, la rejilla de ARMA(p, q) y el ciclo de Box–Jenkins aplicado al viento.

:::pastilla verde | Aplicar · El ARMA(1,1) | u2:arma-def u2:sim-arma {#arma-11}
Estimar un **ARMA(1,1)**, $y_t = c + \phi_1 y_{t-1} + \varepsilon_t + \theta_1 \varepsilon_{t-1}$: la persistencia del AR más una corrección MA del choque anterior. Con dos parámetros, ¿hace más que el AR(1)?
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `ARIMA(y_fit, order=(1, 0, 1))` | máxima verosimilitud | El ARMA más chico. |
| condiciones | \|φ₁\| < 1 y \|θ₁\| < 1 | Estacionario e invertible. |
@@ Código
```python
arma11 = ARIMA(y_fit, order=(1, 0, 1)).fit()
f_a, t_a = arma11.params["ar.L1"], arma11.params["ma.L1"]
print(arma11.params.round(4).to_string())
print(f"\n¿Estacionario? {abs(f_a) < 1} | ¿invertible? {abs(t_a) < 1}")
print(f"σ: ARMA(1,1) {np.sqrt(arma11.params['sigma2']):.4f} | AR(1) {np.sqrt(ar1.sigma2):.4f}")
VAL["ARMA(1,1)"] = evaluar_sm(arma11)
print(f"MAE en la validación: ARMA(1,1) {metricas(VAL['ARMA(1,1)']['real'], VAL['ARMA(1,1)']['pron'])['MAE']:.3f} | AR(1) {mae_ar[1]:.3f}")
```
@@ Lectura
- φ̂₁ = {{=f_a|.3f}} y θ̂₁ = {{=t_a|.3f}}: la parte AR hace casi todo y la MA es una pequeña corrección. Es estacionario e invertible.
- El σ a un paso apenas baja ({{=np.sqrt(arma11.params['sigma2'])|.4f}} contra {{=np.sqrt(ar1.sigma2)|.4f}}) y en la validación el ARMA(1,1) es **un poco peor** que el AR(1) ({{=metricas(VAL['ARMA(1,1)']['real'], VAL['ARMA(1,1)']['pron'])['MAE']|.3f}} contra {{=mae_ar[1]|.3f}}).
@@ Decisión
✅ Agregar un término MA no ayuda: la parte MA corrige solo la hora siguiente, y lo que le falta al AR(1) es memoria de días.
:::

:::pastilla azul | Aplicar · Los pesos ψ y la ACF del ARMA(1,1) | u2:psi-pesos u2:arma-acf {#arma-psi}
Calcular la forma MA(∞) del ARMA(1,1): $\psi_1 = \phi + \theta$ y $\psi_j = \phi^{j-1}(\phi + \theta)$. Y su ACF teórica: $\rho_1 = \frac{(1 + \phi\theta)(\phi + \theta)}{1 + 2\phi\theta + \theta^2}$ y después $\rho_k = \phi\,\rho_{k-1}$. La parte MA cambia el primer valor; la AR decide cómo decae.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `arma2ma(121)` | pesos ψ | La respuesta al impulso. |
| `acf(121)` | ACF teórica | Para comparar con la muestral. |
@@ Código
```python
proc11 = ArmaProcess([1, -f_a], [1, t_a])
psi11 = proc11.arma2ma(121)
acf11 = proc11.acf(121)
rho1_f = (1 + f_a * t_a) * (f_a + t_a) / (1 + 2 * f_a * t_a + t_a ** 2)
print(f"ψ₁ = φ + θ = {f_a + t_a:.4f} (arma2ma: {psi11[1]:.4f}) | ψ₂₄ = {psi11[24]:.4f}")
print(f"ρ₁ con la fórmula: {rho1_f:.4f} | con ArmaProcess: {acf11[1]:.4f} | muestral: {acf_fit[1]:.4f}")
print(f"ρ₂₄: ARMA(1,1) {acf11[24]:.3f} | AR(1) {acf_teo[1][24]:.3f} | muestral {acf_fit[24]:.3f}")
```
@@ Resultado
```python oculto
grafica("arma-psi", [linea(list(range(121)), acf_fit, "ACF muestral", "osc", 2.6), linea(list(range(121)), acf11, "ARMA(1,1) teórica", "rosa", 2.2, "dash"),
                     linea(list(range(121)), acf_teo[1], "AR(1) teórica", "dur", 1.6, "dot")],
        alto=280, title={"text": "ACF teórica del ARMA(1,1) y del AR(1) contra la del viento"}, xaxis={"title": {"text": "rezago (horas)"}, "dtick": 24},
        yaxis={"title": {"text": "autocorrelación"}})
```
@widget lab-graf id=arma-psi
@@ Lectura
- ψ₁ = φ + θ = {{=f_a + t_a|.3f}}: un choque afecta a la hora siguiente un poco más que en el AR(1). Después los pesos decaen como φ<sup>j</sup>, más rápido que en el AR(1) porque φ̂ es menor.
- La ACF teórica del ARMA(1,1) **cae más rápido** que la del viento: ρ₂₄ = {{=acf11[24]|.2f}} contra {{=acf_fit[24]|.2f}}. La fórmula de ρ₁ coincide con `ArmaProcess`.
@@ Decisión
🔵 En un ARMA(1,1), después del primer rezago la ACF decae como la de un AR(1). No hay forma de que dos coeficientes produzcan la memoria de varios días.
:::

:::pastilla amarillo | Aplicar · Cancelación de raíces y parsimonia | u2:cancelacion u2:demo-cancelacion {#arma-cancelacion}
Estimar un **ARMA(2,2)** y comparar las raíces de su parte AR con las de su parte MA. Si una raíz AR casi coincide con una MA, se **cancelan**: el modelo es en realidad uno más chico y tiene parámetros de sobra, mal estimados.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `ARIMA(y_fit, order=(2, 0, 2))` | ARMA(2,2) | Cuatro coeficientes. |
| raíces | de φ(z) y de θ(z) | Si coinciden, se cancelan. |
| errores estándar | `bse` | Los parámetros que se cancelan suelen tener errores grandes. |
@@ Código
```python
arma22 = ARIMA(y_fit, order=(2, 0, 2)).fit()
ar_c = arma22.params[["ar.L1", "ar.L2"]].values
ma_c = arma22.params[["ma.L1", "ma.L2"]].values
r_ar = np.roots(np.r_[-ar_c[::-1], 1])
r_ma = np.roots(np.r_[ma_c[::-1], 1])
print(pd.DataFrame({"coef": arma22.params, "error est.": arma22.bse}).round(4).to_string())
print(f"\nRaíces AR: {np.round(r_ar, 4)} | raíces MA: {np.round(r_ma, 4)}")
dist = np.min(np.abs(r_ar[:, None] - r_ma[None, :]))
print(f"Distancia mínima entre una raíz AR y una MA: {dist:.4f}")
print(f"σ: ARMA(2,2) {np.sqrt(arma22.params['sigma2']):.4f} | ARMA(1,1) {np.sqrt(arma11.params['sigma2']):.4f} | AR(3) {np.sqrt(mv3.params['sigma2']):.4f}")
```
@@ Resultado
```python oculto
grafica("arma-cancelacion", [linea(np.cos(tt_c).round(4), np.sin(tt_c).round(4), "círculo unitario", "gris", 1.4, "dot"),
                             puntos(r_ar.real, r_ar.imag, "raíces de φ(z)", "lav", 12), puntos(r_ma.real, r_ma.imag, "raíces de θ(z)", "dur", 9)],
        alto=320, title={"text": "Raíces de la parte AR y de la parte MA del ARMA(2,2)"},
        xaxis={"title": {"text": "parte real"}, "scaleanchor": "y"}, yaxis={"title": {"text": "parte imaginaria"}})
```
@widget lab-graf id=arma-cancelacion
@@ Lectura
- Las raíces del ARMA(2,2) **no** se cancelan exactamente (la distancia mínima es {{=dist|.2f}}), pero el modelo tiene otro síntoma de exceso de parámetros: los errores estándar de φ₁, φ₂ y θ₁ son de unos **0.2**, del mismo orden que los propios coeficientes.
- El σ es prácticamente el del AR(3) ({{=np.sqrt(arma22.params['sigma2'])|.4f}} contra {{=np.sqrt(mv3.params['sigma2'])|.4f}}): los cuatro coeficientes describen lo mismo que tres coeficientes AR.
@@ Decisión
🟡 El ARMA(2,2) es redundante. La parsimonia de Box–Jenkins pide el modelo más chico que explique los datos; con estas cifras, sobra.
:::

:::pastilla verde | Aplicar · La rejilla de ARMA(p, q) | u2:candidatos u2:sim-armaprocess {#arma-rejilla}
Estimar todos los ARMA con p y q de 0 a 3 y medir su error de validación. Es la forma de explorar sistemáticamente los modelos chicos antes de elegir con un criterio formal (AIC y BIC, más adelante).
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| p, q | 0 a 3 | 16 modelos, de la media sola al ARMA(3,3). |
| medida | MAE en la validación | El criterio del análisis. |
@@ Código
```python
ARMA_G = {}
for p in range(4):
    for q in range(4):
        ARMA_G[(p, q)] = ARIMA(y_fit, order=(p, 0, q)).fit()
mae_g = pd.DataFrame(index=range(4), columns=range(4), dtype=float)
for (p, q), r in ARMA_G.items():
    v = evaluar_sm(r)
    mae_g.loc[p, q] = metricas(v["real"], v["pron"])["MAE"]
mae_g.index.name, mae_g.columns.name = "p", "q"
print(mae_g.round(3).to_string())
p_g, q_g = np.unravel_index(np.nanargmin(mae_g.values), mae_g.shape)
print(f"\nMejor de la rejilla: ARMA({p_g},{q_g}) con MAE {mae_g.values[p_g, q_g]:.3f} | AR({p_mejor}): {mae_ar[p_mejor]:.3f}")
```
@@ Resultado
```python oculto
grafica("arma-rejilla", [calor([f"q = {q}" for q in range(4)], [f"p = {p}" for p in range(4)], mae_g.values.tolist(), "MAE", "Purples", reversescale=True,
                               hovertemplate="%{y}, %{x}: MAE %{z:.3f}<extra></extra>", colorbar={"title": {"text": "MAE"}}),
                         {"type": "scatter", "x": [f"q = {q}" for q in range(4) for p in range(4)], "y": [f"p = {p}" for q in range(4) for p in range(4)],
                          "mode": "text", "text": [f"{mae_g.loc[p, q]:.2f}" for q in range(4) for p in range(4)], "textfont": {"color": "#fff", "size": 11},
                          "hoverinfo": "skip", "showlegend": False}],
        alto=310, title={"text": "Error de validación de los ARMA(p, q)"}, yaxis={"autorange": "reversed"})
```
@widget lab-graf id=arma-rejilla
@@ Lectura
- La fila **p = 0** (MA puros) es mucho peor que las demás (MAE de 3.1 a 3.3): sin parte AR no hay modelo.
- Con **p ≥ 1** todos los ARMA quedan entre {{=np.nanmin(mae_g.values[1:])|.3f}} y {{=np.nanmax(mae_g.values[1:])|.3f}}: las diferencias son de centésimas.
- El mejor es el **ARMA({{=p_g}},{{=q_g}})** con {{=mae_g.values[p_g, q_g]|.3f}}, lejos del AR({{=p_mejor}}) ({{=mae_ar[p_mejor]|.3f}}).
@@ Decisión
✅ Los ARMA chicos no sustituyen a los rezagos largos. Ningún ARMA(p, q) con p, q ≤ 3 llega al nivel de Holt–Winters.
:::

:::pastilla verde | Aplicar · El ciclo de Box–Jenkins con el viento | u2:ciclo-bj u2:patrones2 u2:casos-identificacion {#bj-ciclo}
Recorrer el ciclo de **Box–Jenkins**: identificar con la ACF y la PACF, estimar, diagnosticar los residuos y, si pasan, pronosticar. Se hace con los candidatos que salieron de la identificación y de la rejilla.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| identificación | ACF que decae, PACF que se corta en 1 | Patrón AR de orden bajo, con memoria larga. |
| candidatos | AR(1), AR(3), ARMA(1,1), el mejor de la rejilla y el AR del mejor orden | Del más simple al mejor en validación. |
| diagnóstico | Ljung–Box con h = 96 y `model_df` | ¿Quedó autocorrelación? |
@@ Código
```python
CAND_BJ = {"AR(1)": (AR_P[1].resid, 1), "AR(3)": (AR_P[3].resid, 3), "ARMA(1,1)": (arma11.resid[1:], 2),
           f"ARMA({p_g},{q_g})": (ARMA_G[(p_g, q_g)].resid[1:], p_g + q_g), f"AR({p_mejor})": (AR_P[p_mejor].resid, p_mejor)}
filas_bj = []
for k, (e, gl) in CAND_BJ.items():
    lb = acorr_ljungbox(e, lags=[96], model_df=gl)
    mae_k = mae_ar.get(p_mejor) if k == f"AR({p_mejor})" else (mae_g.values[p_g, q_g] if k == f"ARMA({p_g},{q_g})" else metricas(VAL[k]["real"], VAL[k]["pron"])["MAE"])
    filas_bj.append({"modelo": k, "coeficientes": gl, "σ": e.std(), "Q(96)": lb["lb_stat"].iloc[0], "p-value": lb["lb_pvalue"].iloc[0], "MAE validación": mae_k})
tab_bj = pd.DataFrame(filas_bj).set_index("modelo")
print(tab_bj.round(4).to_string())
```
@@ Resultado
```python oculto
tabla("bj-ciclo", ["modelo", "coeficientes", "σ a un paso", "Q(96)", "p-value", "¿residuos blancos?", "MAE validación"],
      [[k, int(r["coeficientes"]), f"{r['σ']:.3f}", f"{r['Q(96)']:.0f}", f"{r['p-value']:.3f}", "sí" if r["p-value"] > 0.05 else "no", f"{r['MAE validación']:.3f}"] for k, r in tab_bj.iterrows()],
      ["elegido" if r["p-value"] > 0.05 else "" for _, r in tab_bj.iterrows()], titulo="Box–Jenkins: estimación, diagnóstico y validación")
```
@widget lab-tabla id=bj-ciclo
@@ Lectura
- **Identificación**: la ACF decae despacio y la PACF se corta en 1, con picos pequeños en 2, 3 y alrededor de 24: un AR de orden bajo, con algo de memoria a un día.
- **Diagnóstico**: los modelos chicos (AR(1), AR(3), ARMA(1,1), ARMA({{=p_g}},{{=q_g}})) **fallan Ljung–Box** con h = 96: queda autocorrelación de días en sus residuos. Solo el **AR({{=p_mejor}})** pasa (p = {{=tab_bj.loc[f'AR({p_mejor})', 'p-value']|.2f}}).
- **Validación**: el AR({{=p_mejor}}) también es el mejor pronóstico ({{=tab_bj.loc[f'AR({p_mejor})', 'MAE validación']|.3f}}).
@@ Decisión
✅ Box–Jenkins lleva al AR de orden alto, aunque sea poco parsimonioso. Antes de buscar alternativas con menos parámetros (SARIMA, exógenas), la Unidad II revisa si hace falta **transformar** la serie o **diferenciarla**.
:::
