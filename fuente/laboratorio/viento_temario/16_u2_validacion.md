## ✂️ Unidad II · Validación, ARCH y métricas {#u2-validacion}
@mapa Ahora sí en su lugar del temario: por qué la partición no es aleatoria, el error a uno y a varios pasos, las estrategias recursiva y directa, la estabilidad del origen móvil, la heterocedasticidad condicional (ARCH y GARCH), las seis métricas, sus propiedades, la comparación contra las referencias y los finalistas de la Unidad II.

:::pastilla rojo | Aplicar · ¿Por qué no una partición aleatoria? | u2:particion u2:w-validacion {#val-aleatoria}
Mostrar qué pasaría con una partición **aleatoria** (como en aprendizaje automático con datos i.i.d.): las horas de prueba quedarían rodeadas de horas de entrenamiento, y "pronosticarlas" sería solo **interpolar**. El error saldría muchísimo menor que el de un pronóstico real a 24 horas.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| partición aleatoria | 20% de las horas al azar | Lo que haría un `train_test_split` sin cuidado. |
| "modelo" | interpolación lineal desde las horas de entrenamiento | Lo que cualquier modelo aprende cuando ve el antes y el después. |
| comparación | el MAE real a 24 horas de la armónica | El error honesto. |
@@ Código
```python
rng_p = np.random.default_rng(42)
prueba_al = rng_p.random(len(y_fit)) < 0.2
interp = y_fit.where(~prueba_al).interpolate(limit_direction="both")
mae_al = np.mean(np.abs(interp[prueba_al] - y_fit[prueba_al]))
mae_real = metricas(VAL["Armónica + AR(3) en √y"]["real"], VAL["Armónica + AR(3) en √y"]["pron"])["MAE"]
print(f"Partición aleatoria (interpolar): MAE {mae_al:.3f} m/s")
print(f"Pronóstico real a 24 horas (armónica, validación temporal): MAE {mae_real:.3f} m/s")
print(f"La partición aleatoria haría creer que el error es {mae_real / mae_al:.1f} veces menor de lo que es")
```
@@ Lectura
- Con una partición aleatoria, "pronosticar" una hora de prueba es interpolar entre sus vecinas de entrenamiento: el MAE sale de **{{=mae_al|.2f}} m/s**, como el de la imputación de la limpieza.
- El pronóstico real a 24 horas tiene un MAE de {{=mae_real|.2f}}: la partición aleatoria haría creer que el error es {{=mae_real / mae_al|.1f}} veces menor.
@@ Decisión
❌ En series de tiempo la partición es **cronológica**: el modelo solo puede ver el pasado del momento que pronostica. Es la regla que este análisis usa desde el adelanto de la Unidad I.
:::

:::pastilla verde | Aplicar · Un paso contra varios pasos: el error según el horizonte | u2:un-paso u2:demo-error-horizonte {#val-horizonte}
Medir el error de los mejores modelos en cada horizonte h = 1, …, 24. A un paso todos se parecen al ingenuo; la diferencia entre modelos está en los horizontes largos.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| modelos | armónica, AR(72), mejor SARIMA, Holt–Winters e ingenuo | Lo mejor de cada familia y la referencia simple. |
| habilidad | 1 − MAE<sub>modelo</sub> / MAE<sub>ingenuo</sub> | Positiva si mejora al ingenuo en ese horizonte. |
@@ Código
```python
nombre_sar = mejor_sar + " en √y"
MOSTRAR_H = {"Armónica + AR(3) en √y": "lav", f"AR({p_mejor})": "menta", nombre_sar: "cel", "Holt-Winters": "verde", "Naive": "dur"}
mae_h = pd.DataFrame({k: VAL[k].groupby("h").apply(lambda g: np.mean(np.abs(g["real"] - g["pron"]))) for k in MOSTRAR_H})
habil = 1 - mae_h.div(mae_h["Naive"], axis=0)
print("MAE por horizonte:")
print(mae_h.loc[[1, 3, 6, 12, 18, 24]].round(2).to_string())
```
@@ Resultado
```python oculto
grafica("val-horizonte", [linea(mae_h.index, mae_h[k], k, c, 2.6 if k.startswith("Armónica") else 1.8) for k, c in MOSTRAR_H.items()],
        alto=300, title={"text": "Error de validación según el horizonte"}, xaxis={"title": {"text": "horas hacia adelante"}, "dtick": 2},
        yaxis={"title": {"text": "MAE (m/s)"}})
```
@widget lab-graf id=val-horizonte
@@ Lectura
- A **1 hora** todos están entre 0.9 y 1.1 m/s; el ingenuo es de los mejores ({{=mae_h.loc[1, 'Naive']|.2f}}).
- A **12 horas** el ingenuo ya es mucho peor ({{=mae_h.loc[12, 'Naive']|.2f}}) y los modelos rondan 2.1 a 2.4: ahí está la ventaja de saber que el viento regresa a su nivel y tiene un ciclo diario.
- A **24 horas** todos se acercan ({{=mae_h.loc[24].min()|.2f}} a {{=mae_h.loc[24].max()|.2f}}): el día siguiente completo es difícil para cualquiera.
- Holt–Winters es el mejor a 12 horas; la armónica y los AR, a 18.
@@ Decisión
✅ La comparación entre modelos se decide en los horizontes intermedios. A una hora casi no hay nada que ganar sobre el ingenuo.
:::

:::pastilla azul | Aplicar · Estrategias para varios pasos: recursiva contra directa | u2:estrategias u2:guia-estrategias {#val-estrategias}
Comparar las dos estrategias de pronóstico a varios pasos. La **recursiva** usa un modelo de un paso y alimenta sus propios pronósticos (todo lo anterior en la Unidad II). La **directa** estima un modelo distinto para cada horizonte: y<sub>t+h</sub> sobre los últimos datos conocidos, sin pronósticos intermedios.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| predictores | los últimos 24 valores, más Fourier | Lo mismo para las dos estrategias. |
| recursiva | AR(24) + Fourier, aplicada paso a paso | Un solo modelo. |
| directa | 24 regresiones por mínimos cuadrados, una por h | Cada una minimiza el error de su propio horizonte. |
@@ Código
```python
L_DIR = 24
Fh = FOURIER.values
def matriz(serie_v, t_idx):
    """Fila de predictores para pronosticar desde la posición t: los últimos 24 valores conocidos."""
    return serie_v[t_idx - L_DIR:t_idx][::-1]

yv = y.values
pos_fit = np.arange(L_DIR, len(y_fit) - 24)
X_base = np.array([matriz(yv, t) for t in pos_fit])
coef_dir = {}
for h in range(1, 25):
    X = np.column_stack([np.ones(len(pos_fit)), X_base, Fh[pos_fit + h - 1]])
    coef_dir[h] = np.linalg.lstsq(X, yv[pos_fit + h - 1], rcond=None)[0]
X1 = np.column_stack([np.ones(len(pos_fit)), X_base, Fh[pos_fit]])
coef_rec = np.linalg.lstsq(X1, yv[pos_fit], rcond=None)[0]

filas_dir, filas_rec = [], []
for t0 in ORIGENES_VAL:
    i0 = y.index.get_loc(t0)
    base = matriz(yv, i0)
    filas_dir.append([coef_dir[h] @ np.r_[1, base, Fh[i0 + h - 1]] for h in range(1, 25)])
    buf = list(yv[i0 - L_DIR:i0])
    pr = []
    for h in range(1, 25):
        v = coef_rec @ np.r_[1, np.array(buf[-L_DIR:])[::-1], Fh[i0 + h - 1]]
        pr.append(v)
        buf.append(v)
    filas_rec.append(pr)
real_v = np.concatenate([y[t0:t0 + pd.Timedelta(hours=23)].values for t0 in ORIGENES_VAL])
hv = np.tile(np.arange(1, 25), N_VAL)
idx_v = np.concatenate([pd.date_range(t0, periods=24, freq="h") for t0 in ORIGENES_VAL])
VAL["Directa (24 rezagos + Fourier)"] = pd.DataFrame({"real": real_v, "pron": np.clip(np.ravel(filas_dir), 0, None), "h": hv}, index=idx_v)
VAL["Recursiva (24 rezagos + Fourier)"] = pd.DataFrame({"real": real_v, "pron": np.clip(np.ravel(filas_rec), 0, None), "h": hv}, index=idx_v)
for k in ["Recursiva (24 rezagos + Fourier)", "Directa (24 rezagos + Fourier)"]:
    print(f"{k}: MAE {metricas(VAL[k]['real'], VAL[k]['pron'])['MAE']:.3f}")
mae_est = pd.DataFrame({k: VAL[k].groupby("h").apply(lambda g: np.mean(np.abs(g["real"] - g["pron"]))) for k in ["Recursiva (24 rezagos + Fourier)", "Directa (24 rezagos + Fourier)"]})
print("\nA 1, 6, 12 y 24 horas:")
print(mae_est.loc[[1, 6, 12, 24]].round(3).to_string())
```
@@ Resultado
```python oculto
grafica("val-estrategias", [linea(mae_est.index, mae_est.iloc[:, 0], "recursiva", "lav", 2.4), linea(mae_est.index, mae_est.iloc[:, 1], "directa", "rosa", 2.4)],
        alto=270, title={"text": "Recursiva contra directa, según el horizonte"}, xaxis={"title": {"text": "horas hacia adelante"}, "dtick": 2},
        yaxis={"title": {"text": "MAE (m/s)"}})
```
@widget lab-graf id=val-estrategias
@@ Lectura
- Con los mismos predictores (24 rezagos y Fourier), la **directa** y la **recursiva** dan casi lo mismo: MAE {{=metricas(VAL['Directa (24 rezagos + Fourier)']['real'], VAL['Directa (24 rezagos + Fourier)']['pron'])['MAE']|.3f}} y {{=metricas(VAL['Recursiva (24 rezagos + Fourier)']['real'], VAL['Recursiva (24 rezagos + Fourier)']['pron'])['MAE']|.3f}}.
- A 1 hora son idénticas (es el mismo modelo) y a 24 la diferencia es de milésimas.
- Las dos le ganan un poco a la armónica + AR(3), porque usan 24 rezagos en lugar de 3.
@@ Decisión
🔵 Con un modelo lineal bien especificado, la estrategia importa poco. La directa sirve cuando el modelo recursivo acumula errores (modelos no lineales, horizontes largos).
:::

:::pastilla amarillo | Aplicar · El origen móvil: ¿qué tan estable es la comparación? | u2:rolling-origin u2:w-rolling {#val-origenes}
Ver el error **de cada uno de los 56 días** de la validación, no solo el promedio. Si un modelo gana en promedio pero pierde la mitad de los días, la ventaja es frágil; el origen móvil permite verlo.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| MAE diario | por cada origen | Un número por día. |
| comparación | armónica contra Holt–Winters | El mejor modelo y la mejor referencia. |
@@ Código
```python
def mae_dia(k):
    v = VAL[k]
    return (v["real"] - v["pron"]).abs().groupby(v.index.normalize()).mean()

md_arm, md_hw = mae_dia("Armónica + AR(3) en √y"), mae_dia("Holt-Winters")
gana = (md_arm < md_hw).mean()
print(f"Días en que la armónica le gana a Holt–Winters: {gana:.0%} de {len(md_arm)}")
print(f"MAE diario de la armónica: mediana {md_arm.median():.2f}, de {md_arm.min():.2f} a {md_arm.max():.2f}")
print(f"Diferencia media diaria: {(md_hw - md_arm).mean():+.3f} m/s (error estándar {(md_hw - md_arm).std() / np.sqrt(len(md_arm)):.3f})")
```
@@ Resultado
```python oculto
grafica("val-origenes", [barras(md_arm.index, (md_hw - md_arm).values, "Holt–Winters − armónica", ["menta" if d > 0 else "dur" for d in (md_hw - md_arm).values],
                                hovertemplate="%{x|%d/%m}: %{y:+.2f} m/s<extra></extra>")],
        alto=260, showlegend=False, title={"text": "Ventaja diaria de la armónica sobre Holt–Winters (verde: gana la armónica)"},
        yaxis={"title": {"text": "diferencia de MAE (m/s)"}})
```
@widget lab-graf id=val-origenes
@@ Lectura
- La armónica le gana a Holt–Winters solo el **{{=100 * gana|.0f}}%** de los días, aunque en promedio sea mejor.
- La ventaja media diaria es de {{=(md_hw - md_arm).mean()|+.3f}} m/s, con un error estándar de {{=(md_hw - md_arm).std() / np.sqrt(len(md_arm))|.3f}}: **no es significativa**.
- El error diario varía mucho más entre días ({{=md_arm.min()|.1f}} a {{=md_arm.max()|.1f}} m/s) que entre modelos.
@@ Decisión
🟡 Los mejores modelos de la Unidad II están **empatados** en la validación: las diferencias de centésimas en el MAE son ruido. Elegir el primero de la tabla es la regla, pero hay que reportarlo con esa advertencia.
:::

:::pastilla amarillo | Aplicar · Heterocedasticidad condicional: los residuos al cuadrado | u2:heterocedasticidad u2:arch1 {#arch-cuadrados}
Mirar la ACF de los **residuos al cuadrado** de la armónica. Si los residuos fueran ruido blanco con varianza constante, sus cuadrados tampoco tendrían autocorrelación. Una ACF de e² que decae despacio es la huella de la **volatilidad agrupada** que modelan ARCH y GARCH.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| e² | residuos de la armónica al cuadrado | La varianza "instantánea". |
| rezagos | 1 a 72 | Tres días. |
@@ Código
```python
acf_e2 = acf(res_arm ** 2, nlags=72, fft=True)
print(f"ACF de e²: r₁ = {acf_e2[1]:.3f}, r₆ = {acf_e2[6]:.3f}, r₁₂ = {acf_e2[12]:.3f}, r₂₄ = {acf_e2[24]:.3f}")
print(f"ACF de e (para comparar): r₁ = {acf_arm[1]:+.3f}, r₆ = {acf_arm[6]:+.3f}")
```
@@ Resultado
```python oculto
grafica("arch-cuadrados", correlograma(acf_e2, len(res_arm), "ACF de e²", 1, "dur"), alto=260, showlegend=False,
        title={"text": "ACF de los residuos al cuadrado"}, xaxis={"title": {"text": "rezago (horas)"}, "dtick": 6}, yaxis={"range": [-0.05, 0.25]})
```
@widget lab-graf id=arch-cuadrados
@@ Lectura
- La ACF de e² tiene r₁ = **{{=acf_e2[1]|.2f}}**, muy fuera de la banda, y decae en unas horas ({{=acf_e2[6]|.2f}} a 6 horas, {{=acf_e2[12]|.2f}} a 12).
- La de los residuos sin elevar al cuadrado es casi cero: la **media** está bien modelada, la **varianza** no.
@@ Decisión
🟡 Hay heterocedasticidad condicional: a un residuo grande le sigue otro grande durante algunas horas.
:::

:::pastilla verde | Aplicar · ARCH(1) y la prueba ARCH-LM paso a paso | u2:arch1 u2:arch-lm u2:guia-archlm {#arch-lm}
Estimar un **ARCH(1)**, $\sigma_t^2 = \alpha_0 + \alpha_1 e_{t-1}^2$, con una regresión de e² sobre su rezago, y hacer la **prueba ARCH-LM** a mano: regresar e² sobre q rezagos de e² y calcular LM = n R², que sigue una χ² con q grados de libertad.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| q | 24 rezagos | Los mismos de `het_arch`. |
| LM | (n − q) · R² | El estadístico de Engle. |
@@ Código
```python
e2 = (res_arm ** 2).values
X_a1 = sm.add_constant(e2[:-1])
arch1 = sm.OLS(e2[1:], X_a1).fit()
print(f"ARCH(1): α₀ = {arch1.params[0]:.5f}, α₁ = {arch1.params[1]:.3f} (t = {arch1.tvalues[1]:.1f})")
q_a = 24
X_q = sm.add_constant(np.column_stack([e2[q_a - j:len(e2) - j] for j in range(1, q_a + 1)]))
lm_reg = sm.OLS(e2[q_a:], X_q).fit()
LM_mano = (len(e2) - q_a) * lm_reg.rsquared
print(f"ARCH-LM a mano: R² = {lm_reg.rsquared:.4f}, LM = {LM_mano:.1f}, p-value {stats.chi2.sf(LM_mano, q_a):.1e}")
print(f"Con het_arch: LM = {arch_arm[0]:.1f}")
```
@@ Lectura
- El ARCH(1) estimado tiene α₁ = {{=arch1.params[1]|.2f}} (t = {{=arch1.tvalues[1]|.0f}}): el 21% del cuadrado del residuo anterior pasa a la varianza de la hora siguiente.
- La prueba a mano da LM = {{=LM_mano|.1f}}, exactamente lo que da `het_arch`; el p-value es prácticamente cero.
@@ Decisión
✅ El efecto ARCH es real. Un GARCH describe mejor la memoria de la volatilidad con menos parámetros que un ARCH de muchos rezagos.
:::

:::pastilla verde | Aplicar · GARCH(1,1): la volatilidad del viento | u2:garch {#arch-garch}
Estimar un **GARCH(1,1)**, $\sigma_t^2 = \omega + \alpha e_{t-1}^2 + \beta \sigma_{t-1}^2$, sobre los residuos de la armónica. Con α + β cerca de 1 la volatilidad es muy persistente: un periodo agitado dura muchas horas.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `arch_model(e · 10, mean="Zero", vol="GARCH", p=1, q=1)` | GARCH(1,1) | Los residuos ya tienen media cero; × 10 ayuda al optimizador. |
| vida media | ln 0.5 / ln(α + β) | Cuánto tarda un choque de volatilidad en reducirse a la mitad. |
@@ Código
```python
from arch import arch_model
garch = arch_model(res_arm.values * 10, mean="Zero", vol="GARCH", p=1, q=1).fit(disp="off")
a_g, b_g = garch.params["alpha[1]"], garch.params["beta[1]"]
print(garch.params.round(4).to_string())
print(f"\nα + β = {a_g + b_g:.3f} → vida media de un choque de volatilidad: {np.log(0.5) / np.log(a_g + b_g):.1f} horas")
vol = pd.Series(garch.conditional_volatility / 10, index=res_arm.index)
print(f"Volatilidad condicional: de {vol.min():.3f} a {vol.max():.3f} en √y (σ constante: {res_arm.std():.3f})")
```
@@ Resultado
```python oculto
vd = vol.resample("D").mean()
grafica("arch-garch", [linea(vd.index, vd.round(4), "volatilidad GARCH (media diaria)", "rosa", 2.2), linea([vd.index[0], vd.index[-1]], [res_arm.std()] * 2, "σ constante", "gris", 1.4, "dash")],
        alto=270, title={"text": "Volatilidad condicional de los residuos de la armónica"}, yaxis={"title": {"text": "σ en √(m/s)"}})
```
@widget lab-graf id=arch-garch
@@ Lectura
- El GARCH(1,1) tiene α = {{=a_g|.3f}} y β = {{=b_g|.3f}}: α + β = **{{=a_g + b_g|.2f}}**. Un choque de volatilidad se reduce a la mitad en unas **{{=np.log(0.5) / np.log(a_g + b_g)|.0f}} horas**.
- La volatilidad condicional va de {{=vol.min()|.2f}} a {{=vol.max()|.2f}}: en los momentos más agitados es cuatro veces la σ constante del modelo ({{=res_arm.std()|.2f}}).
- En la gráfica, la volatilidad media sube de enero ({{=vol[vol.index.month == 1].mean()|.2f}}) a agosto ({{=vol[vol.index.month == 8].mean()|.2f}}): en la escala √y, los vientos débiles y cambiantes del verano son los más agitados, y los episodios aislados de volatilidad alta aparecen en cualquier mes.
@@ Decisión
✅ La incertidumbre del pronóstico depende del momento. Los intervalos de varianza constante serán demasiado anchos en las horas tranquilas y demasiado angostos en las agitadas; se verá en la evaluación final.
:::

:::pastilla verde | Aplicar · Las seis métricas | u2:metricas-def u2:metricas-python {#met-seis}
Calcular las **seis métricas** de la Unidad II para los mejores modelos: MAE, RMSE, MAPE, sMAPE, MASE y RMSSE. Las dos últimas dividen entre el error del ingenuo a un paso en el entrenamiento, para que no dependan de las unidades.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| sMAPE | 200 · \|e\| / (\|y\| + \|ŷ\|) | Versión "simétrica" del MAPE. |
| RMSSE | RMSE / RMSE del ingenuo a un paso | El análogo cuadrático del MASE. |
| modelos | los mejores de cada familia | Para ver si las métricas coinciden. |
@@ Código
```python
escala_rmsse = np.sqrt(np.mean(y_tr.diff().dropna() ** 2))
def seis(real, pron):
    real, pron = np.asarray(real, float), np.asarray(pron, float)
    e = real - pron
    return {"MAE": np.mean(np.abs(e)), "RMSE": np.sqrt(np.mean(e ** 2)), "MAPE %": 100 * np.mean(np.abs(e) / real),
            "sMAPE %": 200 * np.mean(np.abs(e) / (np.abs(real) + np.abs(pron))), "MASE": np.mean(np.abs(e)) / escala_mase,
            "RMSSE": np.sqrt(np.mean(e ** 2)) / escala_rmsse}
TOP = ["Armónica + AR(3) en √y", f"AR({p_mejor})", nombre_sar, "Holt-Winters", "WindowAverage", "SES", "Naive", "MA(24)"]
tab_seis = pd.DataFrame({k: seis(VAL[k]["real"], VAL[k]["pron"]) for k in TOP}).T.sort_values("MAE")
print(tab_seis.round(3).to_string())
```
@@ Resultado
```python oculto
tabla("met-seis", ["modelo", "MAE", "RMSE", "MAPE %", "sMAPE %", "MASE", "RMSSE"],
      [[k] + [f"{r[c]:.3f}" if c not in ("MAPE %", "sMAPE %") else f"{r[c]:.1f}" for c in ["MAE", "RMSE", "MAPE %", "sMAPE %", "MASE", "RMSSE"]] for k, r in tab_seis.iterrows()],
      ["elegido" if i == 0 else "" for i in range(len(tab_seis))], titulo="Las seis métricas en la validación")
```
@widget lab-tabla id=met-seis
@@ Lectura
- MAE, RMSE, sMAPE, MASE y RMSSE ordenan **igual** a los dos primeros: la armónica y el AR({{=p_mejor}}).
- El **MAPE** ordena distinto: pone primero al SARIMA y al **ingenuo en segundo lugar** ({{=tab_seis.loc['Naive', 'MAPE %']|.1f}}%), aunque el ingenuo es de los peores en todo lo demás.
- MASE y RMSSE mayores que 2 dicen que a 24 horas cualquier modelo se equivoca más del doble que el ingenuo a una hora.
@@ Decisión
✅ Las métricas en m/s y las escaladas coinciden. El MAPE no: se revisa por qué.
:::

:::pastilla rojo | Aplicar · Propiedades de las métricas: el problema del MAPE | u2:metricas-propiedades u2:demo-rmse-mae {#met-propiedades}
Revisar qué tanto **coinciden** las métricas al ordenar los modelos y de dónde sale el MAPE. El MAPE divide entre el valor real: las horas de calma (viento de 1 o 2 m/s) pesan muchísimo aunque su error en m/s sea pequeño.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| rangos | el lugar de cada modelo con cada métrica | Para ver si cambian de orden. |
| aporte al MAPE | de las horas con menos de 3 m/s | Cuánto del MAPE viene de las calmas. |
@@ Código
```python
rangos = tab_seis.rank()
print("Lugar de cada modelo según cada métrica:")
print(rangos.astype(int).to_string())
v_arm = VAL["Armónica + AR(3) en √y"]
ape = np.abs(v_arm["real"] - v_arm["pron"]) / v_arm["real"]
calma = v_arm["real"] < 3
print(f"\nHoras con menos de 3 m/s: {calma.mean():.0%} de la validación, pero aportan el {ape[calma].sum() / ape.sum():.0%} del MAPE")
print(f"Error en m/s de esas horas: {np.abs(v_arm['real'] - v_arm['pron'])[calma].mean():.2f} | del resto: {np.abs(v_arm['real'] - v_arm['pron'])[~calma].mean():.2f}")
```
@@ Lectura
- Las horas con menos de 3 m/s son solo el {{=100 * calma.mean()|.0f}}% de la validación, pero aportan el **{{=100 * ape[calma].sum() / ape.sum()|.0f}}% del MAPE**: un error de 2 m/s en una hora de 1 m/s es un error del 200%.
- El ingenuo gana en MAPE porque en las calmas repite un valor bajo, y en una calma ese error relativo es menor, aunque en m/s se equivoque mucho en el resto.
@@ Decisión
❌ El MAPE **no sirve** para elegir modelos de viento: castiga las calmas, que casi no producen energía. Se usa MAE como criterio principal y RMSE como apoyo.
:::

:::pastilla verde | Aplicar · Comparar contra las referencias con utilsforecast | u2:metricas-ref u2:ref-evaluar {#met-referencias}
Calcular las métricas con **utilsforecast**, la biblioteca de la Unidad II para evaluar, y expresar cada modelo como **habilidad** sobre las referencias: cuánto reduce el error del ingenuo y el de Holt–Winters.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `utilsforecast.losses.mae` | MAE por serie | La misma métrica, en la herramienta del temario. |
| habilidad | 1 − MAE / MAE de la referencia | En porcentaje. |
@@ Código
```python
from utilsforecast.losses import mae as uf_mae
todos = [k for k in VAL if k != "STL + última (Unidad I)"]
df_eval = pd.DataFrame({"unique_id": "MV01", "ds": VAL["Naive"].index, "y": VAL["Naive"]["real"].values})
for k in todos:
    df_eval[k] = VAL[k]["pron"].reindex(VAL["Naive"].index).values
mae_uf = uf_mae(df_eval, models=todos).drop(columns="unique_id").iloc[0].sort_values()
hab = pd.DataFrame({"MAE": mae_uf, "vs ingenuo %": 100 * (1 - mae_uf / mae_uf["Naive"]), "vs Holt–Winters %": 100 * (1 - mae_uf / mae_uf["Holt-Winters"])})
print(f"Modelos evaluados en la Unidad II: {len(hab)}")
print(hab.head(12).round(2).to_string())
```
@@ Resultado
```python oculto
top15 = hab.head(15)
grafica("met-referencias", [barras(top15["vs Holt–Winters %"].values[::-1], list(top15.index[::-1]), "habilidad sobre Holt–Winters", 
                                   ["menta" if v > 0 else "dur" for v in top15["vs Holt–Winters %"].values[::-1]], orientation="h",
                                   hovertemplate="%{y}: %{x:+.1f}%<extra></extra>")],
        alto=440, showlegend=False, title={"text": "Los 15 mejores modelos de la Unidad II contra Holt–Winters"}, margin={"l": 230},
        xaxis={"title": {"text": "% de reducción del MAE de Holt–Winters"}})
```
@widget lab-graf id=met-referencias
@@ Lectura
- Se evaluaron **{{=len(hab)}} modelos** en la Unidad II. Los mejores reducen el error del ingenuo en un 16 a 17% y el de Holt–Winters en menos del 2%.
- Los primeros lugares son modelos con **rezagos largos o ciclo diario explícito**: la regresión directa y la recursiva con 24 rezagos y Fourier, la armónica y los AR de orden alto. Solo cinco modelos le ganan a Holt–Winters.
@@ Decisión
✅ La referencia más exigente casi no se puede superar con los modelos del temario: el viento a 24 horas tiene un límite de lo que se puede pronosticar con su propio pasado.
:::

:::pastilla verde | Aplicar · Lo que respondió la Unidad II: los finalistas | u2:formulario2 u2:flujo2 {#u2-resumen}
Elegir, **solo con la validación**, el mejor modelo de cada familia del temario. Serán los finalistas que se evalúan en la prueba al final del análisis, junto con las referencias.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| familias | referencias, AR, MA, ARMA, ARIMA con d = 1, SARIMA y regresión armónica | Una por tema de la Unidad II. |
| criterio | MAE en la validación | El mismo de todo el análisis. |
@@ Código
```python
FAMILIA = {}
for k in todos:
    if k in REFERENCIAS:
        FAMILIA[k] = "referencia"
    elif k.startswith("Armónica") or "temp." in k or k.startswith("Directa") or k.startswith("Recursiva"):
        FAMILIA[k] = "regresión con exógenas"
    elif k.startswith(("SARIMA", "Aerolínea")):
        FAMILIA[k] = "SARIMA"
    elif k.startswith("AR(") and "√y" not in k and "log" not in k:
        FAMILIA[k] = "AR"
    elif k.startswith("MA("):
        FAMILIA[k] = "MA"
    elif k.startswith("ARMA") or (k.startswith("ARIMA(") and ",0," in k):
        FAMILIA[k] = "ARMA / ARIMA con d = 0"
    else:
        FAMILIA[k] = "ARIMA con d = 1" if ",1," in k else "AR transformado"
fam = hab.assign(familia=[FAMILIA[k] for k in hab.index])
mejores_fam = fam.groupby("familia", sort=False).head(1)
elegido = hab.index[0]
FINALISTAS = list(dict.fromkeys(list(mejores_fam.index) + ["Armónica + AR(3) en √y", "Naive", "Holt-Winters"]))
print(mejores_fam.round(3).to_string())
print(f"\nEl elegido en la validación: {elegido}")
print("Finalistas para la prueba:", FINALISTAS)
```
@@ Resultado
```python oculto
tabla("u2-resumen", ["familia", "mejor modelo", "MAE validación", "vs ingenuo", "vs Holt–Winters"],
      [[r["familia"], k, f"{r['MAE']:.3f}", f"{r['vs ingenuo %']:+.1f}%", f"{r['vs Holt–Winters %']:+.1f}%"] for k, r in mejores_fam.iterrows()],
      ["elegido" if k == elegido else ("descartado" if r["vs ingenuo %"] < 0 else "") for k, r in mejores_fam.iterrows()],
      titulo="El mejor de cada familia de la Unidad II (validación)")
```
@widget lab-tabla id=u2-resumen
@@ Lectura
- El elegido en la validación es **{{=elegido}}** (MAE {{=hab['MAE'].iloc[0]|.3f}}), por milésimas sobre la recursiva y por centésimas sobre la armónica: un empate en la práctica.
- Por familia: el mejor **AR** es el AR({{=p_mejor}}), el mejor **SARIMA** es {{=mejor_sar}}, los **ARMA** chicos y el **AR en √y** quedan atrás, el mejor **ARIMA con d = 1** apenas mejora al ingenuo y el mejor **MA** es peor que el ingenuo.
- Pasan a la prueba {{=len(FINALISTAS)}} finalistas: el mejor de cada familia, la armónica (el elegido del primer análisis) y las referencias ingenua y Holt–Winters.
@@ Decisión
✅ Con esto termina la Unidad II. Los finalistas esperan la prueba al final del análisis; antes, la Unidad III mira el viento en el **dominio de la frecuencia**.
:::
