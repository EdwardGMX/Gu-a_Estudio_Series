## 🏁 Fase 7 · Evaluación en la prueba y diagnóstico de residuos {#fase-prueba}
@mapa Ajustar los finalistas con todo el entrenamiento, medirlos en los 73 días de prueba, entender por qué cambió el orden, diagnosticar los residuos del elegido, revisar la cobertura de los intervalos y traducir el pronóstico a energía.

:::pastilla verde | Aplicar · Los resultados en la prueba | u2:metricas u2:ref-evaluar u2:particion {#prueba-resultados}
Ajustar cada finalista con las **7,008 horas de entrenamiento** y evaluarlo con el mismo protocolo en los **73 días de prueba**, que ningún modelo ni ninguna decisión ha visto. Es la medición que se reportaría.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `df_z`, `df_x` completos | entrenamiento + prueba | `cross_validation` con `n_windows=73` ajusta con lo anterior a la prueba y pronostica cada día con los datos hasta su origen. |
| `separar(inicio de la prueba, …)` | tabla directa | Los modelos de aprendizaje automático se reentrenan con todo lo anterior a la prueba. |
| métricas | MAE, RMSE, MAPE, MASE | Las obligatorias del flujo, más el MASE. |
@@ Código
```python
te_ref = StatsForecast(models=referencias(), freq="h").cross_validation(df=df_z, h=24, step_size=24, n_windows=N_TE, refit=True)
te_cla = StatsForecast(models=clasicos() + [AutoETS(model="ANA", season_length=24, alias="Holt-Winters")], freq="h").cross_validation(
    df=df_z, h=24, step_size=24, n_windows=N_TE, refit=False, level=[80, 95])
te_arm = StatsForecast(models=[ARIMA(order=(3, 0, 0), include_mean=True, alias="Armónica + AR(3)")], freq="h").cross_validation(
    df=df_x, h=24, step_size=24, n_windows=N_TE, refit=False, level=[80, 95])

PRU = pd.DataFrame({"real": (te_ref["y"] ** 2).values, "h": te_ref.groupby("cutoff").cumcount().values + 1},
                   index=pd.DatetimeIndex(te_ref["ds"]))
for m in REFERENCIAS:
    PRU[m] = (te_ref[m].clip(lower=0) ** 2).values
for m in ["SARIMA d=0", "SARIMA d=1", "Holt-Winters"]:
    PRU[m] = (te_cla[m].clip(lower=0) ** 2).values
PRU["Armónica + AR(3)"] = (te_arm["Armónica + AR(3)"].clip(lower=0) ** 2).values

ent_te, ev_te = separar(y_te.index[0], y_te.index[-1] + pd.Timedelta(hours=1))
ML_FINAL = {"Ridge": (RIDGE, VIENTO), "Ridge + físicas": (RIDGE, VIENTO + FISICAS), "HGB + calendario": (HGB, VIENTO + FISICAS + CALENDARIO),
            "Red neuronal (16)": (MLP, VIENTO)}
for m, (fabrica, columnas) in ML_FINAL.items():
    PRU[m] = directo(fabrica, columnas, ent_te, ev_te).reindex(PRU.index).values
PRU["Ensamble (Armónica + Ridge)"] = (PRU["Armónica + AR(3)"] + PRU["Ridge"]) / 2

tab_pru = pd.DataFrame({m: metricas(PRU["real"], PRU[m]) for m in FINALISTAS}).T.sort_values("MAE")
tab_pru["mejora % vs Naive"] = 100 * (1 - tab_pru["MAE"] / tab_pru.loc["Naive", "MAE"])
print(tab_pru.round(3).to_string())
```
@@ Resultado
```python oculto
tabla("pru-todos", ["modelo", "categoría", "MAE", "RMSE", "MAPE %", "MASE", "mejora vs Naive", "lugar en validación"],
      [[m, CATEGORIA[m], f'{r["MAE"]:.3f}', f'{r["RMSE"]:.3f}', f'{r["MAPE %"]:.1f}', f'{r["MASE"]:.3f}', (f'{r["mejora % vs Naive"]:+.1f}%' if abs(r["mejora % vs Naive"]) >= 0.05 else "0.0%"),
        int(list(tab_val.index).index(m)) + 1] for m, r in tab_pru.iterrows()],
      ["elegido" if m == elegido else ("descartado" if r["MAE"] > tab_pru.loc["Naive", "MAE"] else "") for m, r in tab_pru.iterrows()],
      titulo="Los finalistas en la prueba (20/10 – 31/12), errores en m/s",
      nota="La última columna es el lugar que el modelo tuvo en la validación, entre todos los modelos probados.")
```
@widget lab-tabla id=pru-todos
@@ Lectura
- **El elegido, {{=elegido}}, le gana a la persistencia en la prueba**: MAE {{=tab_pru.loc[elegido, 'MAE']|.3f}} contra {{=tab_pru.loc['Naive', 'MAE']|.3f}} ({{=tab_pru.loc[elegido, 'mejora % vs Naive']|.1f}}% menos) y RMSE {{=tab_pru.loc[elegido, 'RMSE']|.3f}} contra {{=tab_pru.loc['Naive', 'RMSE']|.3f}}. El primer criterio de éxito se cumple, pero por poco.
- **El mejor de la prueba es {{=tab_pru.index[0]}}** (MAE {{=tab_pru['MAE'].iloc[0]|.3f}}, {{=tab_pru['mejora % vs Naive'].iloc[0]|.1f}}% menos error que la persistencia). Ridge, el mejor de aprendizaje automático en la validación, ahora le gana claramente al elegido.
- Las **variables físicas**, que no ayudaron en la validación, sí ayudan en la prueba: los nortes llegan con cambios de presión y de dirección, y en esta temporada hay muchos. Por la regla del juego no se eligieron, pero es una pista para el trabajo futuro.
- Los errores son mayores que en la validación para todos (la persistencia pasa de {{=tab_val.loc['Naive', 'MAE']|.2f}} a {{=tab_pru.loc['Naive', 'MAE']|.2f}} m/s): la temporada de nortes es más ventosa y más variable.
- El MAPE es parecido entre modelos (alrededor de {{=tab_pru['MAPE %'].median()|.0f}}%) y no ordena igual que el MAE, como se anticipó.
@@ Decisión
✅ El elegido cumple el criterio, pero la prueba cambió el orden de los primeros lugares. Hay que entender por qué antes de concluir.
:::

:::pastilla azul | Aplicar · El error según el horizonte en la prueba | u2:demo-error-horizonte {#prueba-horizonte}
Repetir en la prueba el análisis por horizonte: ¿en qué horizontes le gana cada modelo a la persistencia en la temporada de nortes?
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `groupby("h")` | 24 grupos | 73 pronósticos por horizonte. |
| habilidad | $1 - \text{MAE}_\text{modelo} / \text{MAE}_\text{Naive}$ | Positiva si le gana a la persistencia. |
@@ Código
```python
MOSTRAR_P = [elegido, "Ridge", "Ensamble (Armónica + Ridge)", "SARIMA d=1", "Naive"]
mae_h_pru = PRU.groupby("h").apply(lambda g: pd.Series({m: np.mean(np.abs(g["real"] - g[m])) for m in MOSTRAR_P}))
habilidad_pru = 1 - mae_h_pru.div(mae_h_pru["Naive"], axis=0)
print("Habilidad sobre la persistencia en la prueba (%):")
print((100 * habilidad_pru.loc[[1, 3, 6, 12, 18, 24]]).round(1).to_string())
```
@@ Resultado
```python oculto
COL_P = {elegido: "lav", "Ridge": "menta", "Ensamble (Armónica + Ridge)": "cel", "SARIMA d=1": "rosa", "Naive": "dur"}
grafica("pru-h", [linea(habilidad_pru.index, 100 * habilidad_pru[m], m, COL_P[m], 2.4 if m in (elegido, "Ridge") else 1.6) for m in MOSTRAR_P if m != "Naive"],
        alto=300, title={"text": "Habilidad sobre la persistencia según el horizonte (prueba)"}, xaxis={"title": {"text": "horas hacia adelante"}, "dtick": 2},
        yaxis={"title": {"text": "% de mejora en el MAE"}, "zeroline": True})
```
@widget lab-graf id=pru-h
@@ Lectura
- En las **primeras 6 horas nadie le gana a la persistencia**: las habilidades rondan 0% o son negativas. En la temporada de nortes, lo que pasa en la siguiente hora se parece todavía más a la hora actual.
- **Ridge gana desde unas 10 horas** y su ventaja crece hasta el final del día: {{=100 * habilidad_pru.loc[24, 'Ridge']|.0f}}% a 24 horas.
- **El elegido solo gana a la tarde** ({{=100 * habilidad_pru.loc[18, elegido]|.0f}}% a 18 horas, cuando su ciclo diario acierta) y a 24 horas su habilidad cae a {{=100 * habilidad_pru.loc[24, elegido]|.0f}}%. Es el horizonte en que más pesa el nivel al que regresa, y en esta temporada ese nivel está muy por debajo del real.
- El SARIMA con d = 1, que no regresa a ningún nivel, nunca le gana a la persistencia.
@@ Decisión
El patrón por horizonte apunta a la misma causa: **el nivel al que regresa cada modelo**. El siguiente paso lo comprueba con el sesgo.
:::

:::pastilla amarillo | Aplicar · ¿Por qué cambió el orden? El nivel de la prueba y el sesgo | u2:residuos-que u1:est-no-estacionaria {#prueba-ranking}
Explicar por qué el elegido en la validación no fue el mejor en la prueba. La [[part-particion|partición]] mostró que la prueba es mucho más ventosa; un modelo que regresa a la **media del entrenamiento** debería pronosticar **de menos** en esa temporada. El **error medio** (sesgo) lo comprueba.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| sesgo | promedio de real − pronóstico | Positivo: el modelo se queda corto. |
| sesgo a 24 h | solo el último horizonte | Donde más pesa el nivel al que regresa el modelo. |
| media del entrenamiento | √y promedio, al cuadrado | El nivel al que tienden los modelos con d = 0. |
@@ Código
```python
sesgo = pd.DataFrame({"sesgo (m/s)": {m: (PRU["real"] - PRU[m]).mean() for m in FINALISTAS},
                      "sesgo a 24 h": {m: (PRU["real"] - PRU[m])[PRU["h"] == 24].mean() for m in FINALISTAS},
                      "MAE validación": tab_val.loc[FINALISTAS, "MAE"], "MAE prueba": tab_pru.loc[FINALISTAS, "MAE"]})
print(sesgo.sort_values("MAE prueba").round(3).to_string())
print(f"\nNivel al que regresan los modelos con d = 0: {z_tr.mean() ** 2:.2f} m/s | viento medio en la prueba: {y_te.mean():.2f} m/s")
print(f"Viento medio en la validación: {VAL['real'].mean():.2f} m/s")
from scipy.stats import spearmanr
print(f"Correlación de Spearman entre el orden de validación y el de prueba: {spearmanr(sesgo['MAE validación'], sesgo['MAE prueba'])[0]:.2f}")
```
@@ Lectura
- Los modelos que regresan a una **media fija** (la regresión armónica, el SARIMA con d = 0 y el promedio histórico) tienen un **sesgo positivo** grande a 24 horas ({{=sesgo.loc[elegido, 'sesgo a 24 h']|.1f}} m/s el elegido): se quedan cortos porque tienden a {{=z_tr.mean() ** 2|.1f}} m/s, el nivel del entrenamiento, cuando la prueba promedió {{=y_te.mean()|.1f}}.
- En la validación eso no pasaba: su nivel ({{=VAL['real'].mean()|.1f}} m/s) estaba cerca de la media del entrenamiento. La validación **no podía** detectar el problema, porque no incluía una temporada de nortes.
- Ridge regresa a un nivel **reciente** (sus medias móviles de 3 y 7 días) y por eso se adapta mejor a la temporada: su sesgo a 24 horas ({{=sesgo.loc['Ridge', 'sesgo a 24 h']|.1f}} m/s) es menos de la mitad.
- Los modelos que **no** regresan a ninguna media (persistencia, SARIMA con d = 1, Holt–Winters) casi no tienen sesgo, pero tampoco ganan: siguen cada episodio hasta el final y fallan cuando termina.
- Aun así, el orden general se conserva bastante (Spearman {{=spearmanr(sesgo['MAE validación'], sesgo['MAE prueba'])[0]|.2f}}): los modelos malos en la validación siguen siendo malos en la prueba.
@@ Decisión
🟡 Es el desenlace de la contradicción entre ADF y KPSS: **las dos tenían razón**. La serie regresa a su nivel (ADF), pero el nivel cambia con la temporada (KPSS), y un modelo con una media fija paga ese cambio cuando la temporada cambia. La suposición **S5** se cumple a medias. Aun así, el elegido sigue siendo el que se habría entregado; el siguiente paso revisa sus **residuos**.
:::

:::pastilla amarillo | Aplicar · Residuos del elegido: en el tiempo, su ACF y Ljung–Box | u2:diagnostico u2:lb-residuos u1:ljung-box u2:plot-diagnostics {#res-residuos}
Revisar si los residuos a un paso del modelo elegido se parecen a **ruido blanco**. Si quedan autocorrelaciones, hay información que el modelo no aprovechó. Se usan los errores a 1 hora **en la prueba**: el modelo ajustado con el entrenamiento se aplica, sin reestimar, a toda la serie.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `SARIMAX(z, exog=Fourier, order=(3, 0, 0), trend="c")` | el mismo modelo | En statsmodels, que da residuos y pruebas de diagnóstico. |
| `.apply(z, exog)` | sin reestimar | Los parámetros del entrenamiento filtran toda la serie: los residuos de la prueba son errores fuera de muestra. |
| `acorr_ljungbox(…, lags=[24, 48], model_df=3)` | 1 y 2 días | Resta los 3 parámetros AR a los grados de libertad. |
@@ Código
```python
from statsmodels.tsa.statespace.sarimax import SARIMAX
from statsmodels.stats.diagnostic import acorr_ljungbox

fourier = df_x.set_index("ds")[["sen1", "cos1", "sen2", "cos2"]]
fourier.index = z.index
ajuste_arm = SARIMAX(z_tr, exog=fourier.iloc[:n_tr], order=(3, 0, 0), trend="c").fit(disp=False)
resid_todo = ajuste_arm.apply(z, exog=fourier).resid
resid_te = resid_todo.iloc[n_tr:]
print(f"Residuos a 1 hora en la prueba (√y): media {resid_te.mean():.4f}, desviación {resid_te.std():.3f}")
lb = acorr_ljungbox(resid_te, lags=[24, 48], model_df=3)
print(lb.round(4).to_string())
acf_res = acf(resid_te, nlags=48)
grandes = {k: round(float(acf_res[k]), 3) for k in range(1, 49) if abs(acf_res[k]) > 1.96 / np.sqrt(len(resid_te))}
print(f"Rezagos fuera de la banda ±{1.96 / np.sqrt(len(resid_te)):.3f}: {grandes}")
```
@@ Resultado
```python oculto
rd = resid_te
grafica("res-tiempo", [linea(rd.index, rd, "residuo a 1 hora", "lav", 0.9)], alto=250, showlegend=False,
        title={"text": "Residuos a un paso del elegido en la prueba (escala √y)"}, yaxis={"title": {"text": "√(m/s)"}})
grafica("res-acf", correlograma(acf_res, len(resid_te), "ACF de los residuos", 1, "lav"), alto=240, showlegend=False,
        title={"text": "ACF de los residuos en la prueba"}, xaxis={"dtick": 6}, yaxis={"range": [-0.15, 0.15]})
```
@widget lab-graf id=res-tiempo
@widget lab-graf id=res-acf
@@ Lectura
- Los residuos tienen media casi cero ({{=resid_te.mean()|.3f}}) a 1 hora: el sesgo de la prueba aparece a horizontes largos, no al siguiente paso.
- **Ljung–Box rechaza** la ausencia de autocorrelación (p = {{=lb['lb_pvalue'].iloc[0]|.1e}} con 24 rezagos). Los rezagos fuera de la banda son pocos: sobre todo el 1 y el 2 ({{=grandes.get(1, 0)}} y {{=grandes.get(2, 0)}}) y el 24. En la temporada de nortes la persistencia de hora a hora es todavía mayor que la que el modelo estimó con el resto del año. Queda algo de estructura, de tamaño modesto.
- En la gráfica de los residuos se ven **ráfagas**: periodos de residuos grandes (los cambios bruscos al inicio y al final de cada norte) y periodos tranquilos. Esa agrupación no es autocorrelación de los residuos, sino de su **tamaño**.
@@ Decisión
🟡 El criterio de residuos blancos **no se cumple del todo**: con 1,752 horas, Ljung–Box detecta autocorrelaciones pequeñas que el modelo podría mejorar (por ejemplo, con más términos AR o una parte MA). La agrupación de residuos grandes sugiere **heterocedasticidad condicional**, que se revisa a continuación.
:::

:::pastilla amarillo | Aplicar · Normalidad, efecto ARCH y un GARCH(1,1) | u2:arch u2:arch-lm u2:garch u2:jarque-bera {#res-arch}
Probar si la varianza de los residuos **cambia con el tiempo de forma predecible** (efecto ARCH) y, si es así, estimarla con un **GARCH(1,1)**. Si la volatilidad es predecible, los intervalos de predicción deberían ensancharse en los episodios agitados.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `jarque_bera` | normalidad | $H_0$: asimetría 0 y curtosis 3. |
| `het_arch(…, nlags=24)` | ARCH-LM | $H_0$: no hay efecto ARCH en 24 rezagos. |
| `arch_model(…, vol="GARCH", p=1, q=1)` | GARCH(1,1) | $\sigma_t^2 = \omega + \alpha e_{t-1}^2 + \beta \sigma_{t-1}^2$. Se ajusta con los residuos del entrenamiento. |
| `* 10` | reescalar | `arch` converge mejor con residuos de orden 1. |
@@ Código
```python
from statsmodels.stats.diagnostic import het_arch
from statsmodels.stats.stattools import jarque_bera
from arch import arch_model

jb = jarque_bera(resid_te)
print(f"Jarque–Bera: estadístico {jb[0]:.1f}, p = {jb[1]:.1e} | asimetría {jb[2]:.2f}, curtosis {jb[3]:.2f}")
lm_arch = het_arch(resid_te, nlags=24)
print(f"ARCH-LM (24 rezagos): estadístico {lm_arch[0]:.1f}, p = {lm_arch[1]:.1e}")

resid_tr = resid_todo.iloc[24:n_tr]
garch = arch_model(resid_tr * 10, mean="Zero", vol="GARCH", p=1, q=1).fit(disp="off")
print()
print(garch.params.round(4).to_string())
print(f"Persistencia de la volatilidad α + β = {garch.params['alpha[1]'] + garch.params['beta[1]']:.3f}")
vol_te = arch_model(resid_todo.iloc[24:] * 10, mean="Zero", vol="GARCH", p=1, q=1).fix(garch.params).conditional_volatility.iloc[n_tr - 24:] / 10
print(f"Volatilidad condicional en la prueba (√y): de {vol_te.min():.3f} a {vol_te.max():.3f}")
```
@@ Resultado
```python oculto
vol_d = vol_te.resample("D").mean()
grafica("res-garch", [linea(resid_te.index, resid_te.abs(), "|residuo|", "gris", 0.8),
                      linea(vol_te.index, vol_te, "volatilidad GARCH(1,1)", "rosa", 2.2)],
        alto=270, title={"text": "La volatilidad de los residuos cambia con los episodios (prueba)"}, yaxis={"title": {"text": "√(m/s)"}})
```
@widget lab-graf id=res-garch
@@ Lectura
- Los residuos **no son normales**: curtosis de {{=jb[3]|.1f}} (3 en una normal), con colas pesadas por los cambios bruscos.
- **El efecto ARCH es muy fuerte** (ARCH-LM con p ≈ {{=lm_arch[1]|.0e}}): después de un residuo grande vienen otros grandes. Es la heterocedasticidad que [[eda-varianza|Levene]] ya había anticipado: hay periodos "nerviosos" y periodos tranquilos.
- El GARCH(1,1) tiene α + β = {{=garch.params['alpha[1]'] + garch.params['beta[1]']|.3f}}: la volatilidad **persiste**; un choque grande tarda unas {{=np.log(0.5) / np.log(garch.params['alpha[1]'] + garch.params['beta[1]'])|.0f}} horas en perder la mitad de su efecto. En la prueba, la volatilidad condicional va de {{=vol_te.min()|.2f}} a {{=vol_te.max()|.2f}}: hay horas con más del triple de incertidumbre que otras.
@@ Decisión
🟡 Un modelo con varianza constante tendrá intervalos **demasiado anchos en las horas tranquilas y demasiado angostos en las agitadas**. El siguiente paso mide qué tanto afecta eso a la cobertura de los intervalos del 80% y 95%.
:::

:::pastilla verde | Aplicar · Intervalos del 80% y 95%: ¿cubren lo que prometen? | u2:ref-intervalos u2:intervalos-psi u2:regresar-escala {#prueba-intervalos}
Medir la **cobertura** de los intervalos en la prueba: un intervalo del 80% debería contener el valor real en el 80% de las horas. Se comparan dos métodos: los intervalos **analíticos** del modelo elegido (que suponen errores normales con varianza constante) y unos intervalos **empíricos** para Ridge, construidos con los errores de la validación en cada horizonte.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `level=[80, 95]` | statsforecast | Intervalos en √y; al elevarlos al cuadrado siguen siendo intervalos del mismo nivel en m/s. |
| cuantiles empíricos | 10–90% y 2.5–97.5% del error de validación por horizonte | No suponen normalidad. Es una versión simple de la *predicción conformal*. |
| ancho | promedio en m/s | Un intervalo que cubre bien pero es enorme no sirve. |
@@ Código
```python
def cobertura(real, lo, hi):
    return np.mean((real >= lo) & (real <= hi)), np.mean(hi - lo)

col = "Armónica + AR(3)"
filas = []
for nivel in (80, 95):
    lo = te_arm[f"{col}-lo-{nivel}"].clip(lower=0).values ** 2
    hi = te_arm[f"{col}-hi-{nivel}"].clip(lower=0).values ** 2
    c, a = cobertura(PRU["real"].values, lo, hi)
    filas.append([f"{elegido} (analítico)", nivel, c, a])

err_val = (VAL["real"] - VAL["Ridge"]).groupby(VAL["h"])
for nivel, (qa, qb) in {80: (0.10, 0.90), 95: (0.025, 0.975)}.items():
    q_lo, q_hi = err_val.quantile(qa), err_val.quantile(qb)
    lo = np.clip(PRU["Ridge"] + PRU["h"].map(q_lo), 0, None)
    hi = PRU["Ridge"] + PRU["h"].map(q_hi)
    c, a = cobertura(PRU["real"], lo, hi)
    filas.append(["Ridge (empírico)", nivel, c, a])
    if nivel == 80:
        lo80_r, hi80_r = lo, hi
    else:
        lo95_r, hi95_r = lo, hi
tab_cob = pd.DataFrame(filas, columns=["modelo e intervalo", "nivel %", "cobertura", "ancho medio (m/s)"])
print(tab_cob.assign(cobertura=lambda t: (100 * t["cobertura"]).round(1)).round(2).to_string(index=False))
```
@@ Lectura
- Los intervalos analíticos del elegido **cubren casi lo que prometen**: el {{=100 * tab_cob['cobertura'].iloc[0]|.0f}}% con el nivel 80 y el {{=100 * tab_cob['cobertura'].iloc[1]|.0f}}% con el 95. Pero son **muy anchos**: {{=tab_cob['ancho medio (m/s)'].iloc[0]|.0f}} y {{=tab_cob['ancho medio (m/s)'].iloc[1]|.0f}} m/s en promedio. En la escala √y la varianza del pronóstico crece rápido con el horizonte, y al elevar al cuadrado los límites se estiran en los vientos altos, justo los de la temporada de nortes.
- Los intervalos empíricos de Ridge son más angostos ({{=tab_cob['ancho medio (m/s)'].iloc[2]|.1f}} y {{=tab_cob['ancho medio (m/s)'].iloc[3]|.1f}} m/s), pero **se quedan cortos**: cubren el {{=100 * tab_cob['cobertura'].iloc[2]|.0f}}% y el {{=100 * tab_cob['cobertura'].iloc[3]|.0f}}%. Se calibraron con los errores de una temporada más tranquila, y en la de nortes los errores son mayores.
- Es el dilema de siempre: intervalos honestos pero poco informativos, o informativos pero optimistas. Ninguno tiene en cuenta que la volatilidad cambia con los episodios.
@@ Decisión
✅ Los intervalos del elegido cumplen el criterio 3 casi exactamente (el del 95% se queda {{=95 - 100 * tab_cob['cobertura'].iloc[1]|.0f}} puntos corto). Para hacerlos más informativos sin perder cobertura habría que modelar la volatilidad (el GARCH del paso anterior) o calibrarlos con errores de la misma temporada. El siguiente paso los muestra junto con el pronóstico.
:::

:::pastilla verde | Aplicar · El pronóstico contra lo real, con intervalos | u2:arima-pronostico u2:w-pronostico {#prueba-grafica}
Graficar el pronóstico del elegido y el de Ridge contra el viento real en dos semanas de la prueba, con las bandas del 80% y 95% del elegido. Ver los pronósticos ayuda a entender los números: dónde aciertan, dónde fallan y por qué.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| ventana | 1 al 14 de diciembre | Dos semanas con un norte intenso y días tranquilos. |
| pronóstico | el de cada medianoche | Cada día empieza un pronóstico nuevo de 24 horas: por eso hay "saltos" a las 00:00. |
@@ Código
```python
ventana = (PRU.index >= "2019-12-01") & (PRU.index < "2019-12-15")
P = PRU.loc[ventana]
lo80 = te_arm.loc[ventana, f"{col}-lo-80"].clip(lower=0).values ** 2
hi80 = te_arm.loc[ventana, f"{col}-hi-80"].clip(lower=0).values ** 2
lo95 = te_arm.loc[ventana, f"{col}-lo-95"].clip(lower=0).values ** 2
hi95 = te_arm.loc[ventana, f"{col}-hi-95"].clip(lower=0).values ** 2
print(f"En estas dos semanas: MAE del elegido {np.mean(np.abs(P['real'] - P[elegido])):.2f} | Ridge {np.mean(np.abs(P['real'] - P['Ridge'])):.2f}"
      f" | persistencia {np.mean(np.abs(P['real'] - P['Naive'])):.2f} m/s")
fuera95 = int(np.sum((P["real"].values < lo95) | (P["real"].values > hi95)))
print(f"Horas fuera del intervalo del 95%: {fuera95} de {len(P)}")
```
@@ Resultado
```python oculto
grafica("pru-grafica", banda(P.index, lo95, hi95, "intervalo del 95%", "rgba(124,105,214,.12)") + banda(P.index, lo80, hi80, "intervalo del 80%", "rgba(124,105,214,.25)")
        + [linea(P.index, P["real"], "viento real", "osc", 1.8), linea(P.index, P[elegido], elegido, "lav", 2.2), linea(P.index, P["Ridge"], "Ridge", "menta", 1.6, "dot")],
        alto=360, title={"text": "Pronósticos de cada medianoche contra el viento real (1–14 de diciembre)"}, yaxis={"title": {"text": "m/s"}})
```
@widget lab-graf id=pru-grafica
@@ Lectura
- Cada día el pronóstico **arranca cerca del valor real de la medianoche** y luego se va acercando a su nivel de referencia: el elegido hacia la media del entrenamiento, Ridge hacia el nivel de los últimos días. Por eso, en los días de norte, el elegido se queda por debajo y Ridge lo sigue mejor.
- El ciclo diario aparece en los dos pronósticos como una pequeña ondulación al mediodía.
- Los errores grandes ocurren cuando **empieza o termina un norte**: la serie sola no puede anticipar el cambio, y el valor real sale de la banda del 95% en {{=fuera95}} de las {{=len(P)}} horas.
@@ Decisión
✅ La gráfica confirma la lectura de las tablas. Falta el último paso, el que le importa al operador del parque: convertir el viento pronosticado en **energía**.
:::

:::pastilla verde | Aplicar · De viento a energía: el pronóstico que le importa al operador | u1:linealidad {#energia}
Convertir los pronósticos de viento en **potencia** con la curva empírica de la [[eda-curva|exploración]] y medir el error de la **energía diaria**. Se compara contra dos verdades: la energía que la turbina **podría** haber producido con el viento real (sin paros) y la que **realmente** produjo.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `np.interp(viento, curva.index, curva)` | curva de potencia | La mediana de potencia en cada medio m/s, sin paros. |
| energía diaria | suma de 24 horas, en MWh | La unidad del mercado y de la facturación. |
| producción potencial | curva aplicada al viento real | Lo que habría producido sin paros: aísla el error del pronóstico del viento. |
@@ Código
```python
def a_potencia(viento):
    return np.interp(viento, curva.index.values, curva.values, left=0, right=0)

pot_real = s10["RealPowerMean"].resample("h").mean().reindex(PRU.index)
pot_potencial = pd.Series(a_potencia(PRU["real"].values), index=PRU.index)
energia = pd.DataFrame({"potencial": pot_potencial, "real": pot_real.fillna(pot_potencial)}).resample("D").sum() / 1000
for m in [elegido, "Ridge", "Ensamble (Armónica + Ridge)", "Naive"]:
    energia[m] = pd.Series(a_potencia(PRU[m].values), index=PRU.index).resample("D").sum() / 1000
filas_e = {m: {"MAE contra la potencial (MWh/día)": np.mean(np.abs(energia["potencial"] - energia[m])),
               "MAE contra la real (MWh/día)": np.mean(np.abs(energia["real"] - energia[m]))}
           for m in [elegido, "Ridge", "Ensamble (Armónica + Ridge)", "Naive"]}
tab_energia = pd.DataFrame(filas_e).T
print(tab_energia.round(2).to_string())
print(f"\nEnergía media diaria en la prueba: potencial {energia['potencial'].mean():.1f} MWh | real {energia['real'].mean():.1f} MWh")
print(f"Energía perdida por paros en la prueba: {energia['potencial'].sum() - energia['real'].sum():,.0f} MWh"
      f" ({1 - energia['real'].sum() / energia['potencial'].sum():.0%} de la potencial)")
```
@@ Resultado
```python oculto
grafica("energia", [barras(energia.index, energia["real"], "producida", "gris"),
                    linea(energia.index, energia["potencial"], "potencial (sin paros)", "osc", 2),
                    linea(energia.index, energia[elegido], f"pronóstico ({elegido})", "lav", 2),
                    linea(energia.index, energia["Ridge"], "pronóstico (Ridge)", "menta", 1.6, "dot")],
        alto=320, title={"text": "Energía diaria de MV01 en la prueba"}, yaxis={"title": {"text": "MWh por día"}})
```
@widget lab-graf id=energia
@@ Lectura
- Contra la energía **potencial**, el elegido se equivoca en promedio **{{=tab_energia.loc[elegido, 'MAE contra la potencial (MWh/día)']|.1f}} MWh por día**, frente a {{=tab_energia.loc['Naive', 'MAE contra la potencial (MWh/día)']|.1f}} de la persistencia; Ridge, {{=tab_energia.loc['Ridge', 'MAE contra la potencial (MWh/día)']|.1f}}. Un día típico de la prueba produce unos {{=energia['potencial'].mean()|.0f}} MWh posibles.
- Contra la energía **realmente producida**, todos los errores son mayores: en la prueba se perdieron {{=energia['potencial'].sum() - energia['real'].sum()|,.0f}} MWh por paros ({{=(1 - energia['real'].sum() / energia['potencial'].sum()) * 100|.0f}}% de lo posible). Esos días son las barras grises muy por debajo de la línea potencial, y ningún pronóstico del viento los puede anticipar.
- La curva de potencia **amortigua** los errores en la meseta: en un norte de 18 m/s, pronosticar 15 cambia poco la energía. Los errores que más cuestan son los de vientos de 6 a 12 m/s.
@@ Decisión
✅ El pronóstico se traduce a energía. Para el operador, la mejora más grande ya no está en el modelo de viento sino en **reducir los paros** o anunciarlos de antemano: los paros de la temporada de nortes cuestan más energía que todo el error del pronóstico. Con esto termina el flujo; las conclusiones están en los resultados generales.
:::
