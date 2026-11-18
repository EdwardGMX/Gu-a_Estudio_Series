## 🏁 Evaluación final con los modelos del temario {#final}
@mapa Los finalistas de la Unidad II, reestimados con todo el entrenamiento y medidos en los 73 días de prueba: errores, error por horizonte, el sesgo por el cambio de temporada, el diagnóstico de residuos del elegido, la cobertura de los intervalos del 80% y 95%, el pronóstico contra lo real y las conclusiones.

:::pastilla verde | Aplicar · Los finalistas en la prueba | u2:ref-evaluar u2:metricas u2:tres-bloques {#fin-prueba}
Reestimar cada finalista con las **7,008 horas del entrenamiento** (validación incluida) y pronosticar cada medianoche de los **73 días de prueba**, que nadie ha visto. Es la medición que se reporta. El orden de la validación ya no se puede cambiar.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| reestimación | con `y_tr` completo | Más datos para los parámetros; la prueba sigue intacta. |
| orígenes | las 73 medianoches del 20 de octubre al 31 de diciembre | El mismo protocolo de la validación. |
| métricas | MAE, RMSE, MAPE y MASE | Las del flujo. |
@@ Código
```python
import re as _re
z_tr = np.sqrt(y_tr)
PRU = {}
PRU["Naive"] = evaluar(REF_FUN["Naive"], ORIGENES_TE)

cv_hw_te = StatsForecast(models=[AutoETS(model="ANA", season_length=24, alias="Holt-Winters")], freq="h").cross_validation(
    df=df_y, h=24, step_size=24, n_windows=N_TE, refit=False, level=[80, 95])
PRU["Holt-Winters"] = pd.DataFrame({"real": cv_hw_te["y"].values, "pron": cv_hw_te["Holt-Winters"].clip(lower=0).values, "h": np.tile(np.arange(1, 25), N_TE),
                                    **{f"{b}{nv}": cv_hw_te[f"Holt-Winters-{b}-{nv}"].clip(lower=0).values for b in ("lo", "hi") for nv in (80, 95)}},
                                   index=pd.DatetimeIndex(cv_hw_te["ds"]))

for k in [f for f in FINALISTAS if f.startswith("SARIMA")]:
    o = tuple(int(v) for v in _re.findall(r"\d", k)[:6])
    PRU.update(cv_sf([ARIMA_SF(order=o[:3], seasonal_order=o[3:], season_length=24, include_mean=(o[1] == 0), alias=k)], df=df_z, n_windows=N_TE, niveles=[80, 95]))

ar_te = AutoReg(y_tr, lags=p_mejor).fit()
PRU[f"AR({p_mejor})"] = evaluar(lambda h: pron_ar(ar_te.params.values, h), ORIGENES_TE)

pos_tr = np.arange(L_DIR, n_tr - 24)
X_base_tr = np.array([matriz(yv, t) for t in pos_tr])
coef_dir_te = {h: np.linalg.lstsq(np.column_stack([np.ones(len(pos_tr)), X_base_tr, Fh[pos_tr + h - 1]]), yv[pos_tr + h - 1], rcond=None)[0] for h in range(1, 25)}
filas_dte = [[coef_dir_te[h] @ np.r_[1, matriz(yv, y.index.get_loc(t0)), Fh[y.index.get_loc(t0) + h - 1]] for h in range(1, 25)] for t0 in ORIGENES_TE]
idx_te = np.concatenate([pd.date_range(t0, periods=24, freq="h") for t0 in ORIGENES_TE])
PRU["Directa (24 rezagos + Fourier)"] = pd.DataFrame({"real": y[idx_te].values, "pron": np.clip(np.ravel(filas_dte), 0, None), "h": np.tile(np.arange(1, 25), N_TE)}, index=idx_te)

SM_TE = {"ARMA(1,1)": (ARIMA(y_tr, order=(1, 0, 1)), {}),
         "AR(3) en √y": (ARIMA(z_tr, order=(3, 0, 0)), {"transf": np.sqrt, "inv": cuad}),
         "ARIMA(2,1,2) en √y": (ARIMA(z_tr, order=(2, 1, 2)), {"transf": np.sqrt, "inv": cuad}),
         "MA(24)": (ARIMA(y_tr, order=(0, 0, 24)), {}),
         "Armónica + AR(3) en √y": (ARIMA(z_tr, exog=FOURIER.loc[z_tr.index], order=(3, 0, 0)), {"transf": np.sqrt, "inv": cuad, "exog": FOURIER, "niveles": (80, 95)})}
for k, (mod, kw) in SM_TE.items():
    if k in FINALISTAS:
        res_k = mod.fit()
        PRU[k] = evaluar_sm(res_k, origenes=ORIGENES_TE, **kw)
        if k.startswith("Armónica"):
            arm_te = res_k
        del res_k
        gc.collect()

faltan_f = [k for k in FINALISTAS if k not in PRU]
print("Finalistas sin evaluar:", faltan_f if faltan_f else "ninguno")
tab_pru = pd.DataFrame({k: metricas(PRU[k]["real"], PRU[k]["pron"]) for k in FINALISTAS if k in PRU}).T.sort_values("MAE")
tab_pru["mejora % vs Naive"] = 100 * (1 - tab_pru["MAE"] / tab_pru.loc["Naive", "MAE"])
tab_pru["lugar en validación"] = [int(list(hab.index).index(k)) + 1 for k in tab_pru.index]
mejor_pru = tab_pru.index[0]
print(tab_pru.round(3).to_string())
```
@@ Resultado
```python oculto
tabla("fin-prueba", ["modelo", "familia", "MAE", "RMSE", "MAPE %", "MASE", "mejora vs ingenuo", "lugar en validación"],
      [[k, FAMILIA.get(k, ""), f"{r['MAE']:.3f}", f"{r['RMSE']:.3f}", f"{r['MAPE %']:.1f}", f"{r['MASE']:.2f}",
        (f"{r['mejora % vs Naive']:+.1f}%" if abs(r["mejora % vs Naive"]) >= 0.05 else "0.0%"), int(r["lugar en validación"])] for k, r in tab_pru.iterrows()],
      ["elegido" if k == elegido else ("reserva" if k == tab_pru.index[0] else ("descartado" if r["MAE"] > tab_pru.loc["Naive", "MAE"] else "")) for k, r in tab_pru.iterrows()],
      titulo="Los finalistas en la prueba (20/10 – 31/12), errores en m/s",
      nota="Verde: el elegido con la validación. Amarillo: el mejor en la prueba. Rojo: peor que el ingenuo. La última columna es su lugar entre los modelos de la Unidad II en la validación.")
```
@widget lab-tabla id=fin-prueba
@@ Lectura
- El elegido, **{{=elegido}}**, le gana al ingenuo en la prueba: MAE {{=tab_pru.loc[elegido, 'MAE']|.3f}} contra {{=tab_pru.loc['Naive', 'MAE']|.3f}} ({{=tab_pru.loc[elegido, 'mejora % vs Naive']|+.1f}}%), y también en RMSE ({{=tab_pru.loc[elegido, 'RMSE']|.2f}} contra {{=tab_pru.loc['Naive', 'RMSE']|.2f}}).
- El mejor de la prueba es **{{=mejor_pru}}** ({{=tab_pru['MAE'].iloc[0]|.3f}}, {{=tab_pru['mejora % vs Naive'].iloc[0]|+.1f}}%), que en la validación estaba en el lugar {{=int(tab_pru.loc[mejor_pru, 'lugar en validación'])}}. Los dos primeros son los modelos con **más rezagos**.
- **Holt–Winters**, la referencia más exigente en la validación, es **peor que el ingenuo** en la prueba ({{=tab_pru.loc['Holt-Winters', 'MAE']|.3f}}). La armónica queda en {{=tab_pru.loc['Armónica + AR(3) en √y', 'MAE']|.3f}}, lo mismo que en el primer análisis (2.793), donde fue el modelo elegido.
- Todos los errores son mayores que en la validación: la temporada de nortes es más ventosa y más variable.
@@ Decisión
✅ El elegido con la validación cumple: le gana a la referencia ingenua en la prueba. El orden de los primeros lugares cambia; hay que entender por qué antes de concluir.
:::

:::pastilla azul | Aplicar · El error según el horizonte en la prueba | u2:un-paso u2:demo-error-horizonte {#fin-horizonte}
Repetir en la prueba el análisis por horizonte: ¿en qué horas del día siguiente le gana cada modelo al ingenuo durante la temporada de nortes?
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| habilidad | 1 − MAE<sub>modelo</sub> / MAE<sub>ingenuo</sub> por horizonte | Positiva si le gana. |
| modelos | el elegido, el mejor de la prueba, Holt–Winters y la armónica | Los que importan para la conclusión. |
@@ Código
```python
MOSTRAR_F = list(dict.fromkeys([elegido, mejor_pru, "Holt-Winters", "Armónica + AR(3) en √y", "Naive"]))
mae_h_te = pd.DataFrame({k: PRU[k].groupby("h").apply(lambda g: np.mean(np.abs(g["real"] - g["pron"]))) for k in MOSTRAR_F})
hab_te = 1 - mae_h_te.div(mae_h_te["Naive"], axis=0)
print("Habilidad sobre el ingenuo en la prueba (%):")
print((100 * hab_te.loc[[1, 3, 6, 12, 18, 24]]).round(1).to_string())
```
@@ Resultado
```python oculto
COL_F = dict(zip(MOSTRAR_F, ["lav", "menta", "verde", "cel", "dur"]))
grafica("fin-horizonte", [linea(hab_te.index, 100 * hab_te[k], k, COL_F[k], 2.4) for k in MOSTRAR_F if k != "Naive"],
        alto=300, title={"text": "Habilidad sobre el ingenuo según el horizonte (prueba)"}, xaxis={"title": {"text": "horas hacia adelante"}, "dtick": 2},
        yaxis={"title": {"text": "% de mejora en el MAE"}, "zeroline": True})
```
@widget lab-graf id=fin-horizonte
@@ Lectura
- En las **primeras horas** nadie le gana al ingenuo: en la temporada de nortes la hora siguiente se parece todavía más a la actual.
- La ventaja aparece **a partir de 12 horas** y es máxima entre 18 y 24 horas (el elegido, {{=100 * hab_te.loc[18, elegido]|.0f}}% a 18 h). Es donde importa saber que el viento regresa a su nivel y conocer el ciclo diario.
- **Holt–Winters** es mucho peor que el ingenuo en las primeras horas ({{=100 * hab_te.loc[1, 'Holt-Winters']|.0f}}% a 1 hora): su nivel suavizado reacciona tarde a los cambios bruscos de los nortes.
@@ Decisión
🔵 La ventaja de los modelos de la Unidad II es de horizontes largos. Para las primeras horas, la persistencia es casi imbatible.
:::

:::pastilla amarillo | Aplicar · ¿Por qué cambió el orden? El sesgo del cambio de temporada | u1:rupturas u2:residuos-que {#fin-sesgo}
Explicar las diferencias entre validación y prueba con el **sesgo** (real − pronóstico). La Unidad I encontró un **cambio estructural** el 30 de octubre, justo al empezar la prueba. Un modelo que regresa a la media del entrenamiento debería quedarse corto en la temporada de nortes.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| sesgo | promedio de real − pronóstico | Positivo: el modelo se queda corto. |
| a 24 h | solo el último horizonte | Donde más pesa el nivel al que regresa el modelo. |
@@ Código
```python
sesgo_te = pd.DataFrame({"sesgo": {k: (PRU[k]["real"] - PRU[k]["pron"]).mean() for k in tab_pru.index},
                         "sesgo a 24 h": {k: (PRU[k]["real"] - PRU[k]["pron"])[PRU[k]["h"] == 24].mean() for k in tab_pru.index},
                         "MAE validación": {k: hab.loc[k, "MAE"] for k in tab_pru.index}, "MAE prueba": tab_pru["MAE"]})
print(sesgo_te.round(3).to_string())
print(f"\nViento medio: entrenamiento {y_tr.mean():.2f} | validación {y_tr[ini_val:].mean():.2f} | prueba {y_te.mean():.2f} m/s")
from scipy.stats import spearmanr
rho_vp = spearmanr(sesgo_te["MAE validación"], sesgo_te["MAE prueba"])[0]
print(f"Correlación de Spearman entre el orden de validación y el de prueba: {rho_vp:.2f}")
```
@@ Resultado
```python oculto
st_ord = sesgo_te.sort_values("MAE prueba")
grafica("fin-sesgo", [barras(list(st_ord.index), st_ord["sesgo a 24 h"].values, "sesgo a 24 h", ["dur" if v > 0 else "cel" for v in st_ord["sesgo a 24 h"].values],
                             hovertemplate="%{x}: %{y:+.2f} m/s<extra></extra>")],
        alto=300, showlegend=False, title={"text": "Sesgo a 24 horas en la prueba (positivo: el modelo se queda corto)"}, yaxis={"title": {"text": "m/s"}},
        margin={"b": 120}, xaxis={"tickangle": -35})
```
@widget lab-graf id=fin-sesgo
@@ Lectura
- Casi todos los modelos con d = 0 tienen **sesgo positivo** a 24 horas: se quedan cortos porque regresan a la media del entrenamiento ({{=y_tr.mean()|.1f}} m/s) y la prueba promedió {{=y_te.mean()|.1f}}. La armónica es la más afectada ({{=sesgo_te.loc['Armónica + AR(3) en √y', 'sesgo a 24 h']|+.1f}} m/s).
- Los AR con muchos rezagos se quedan menos cortos ({{=sesgo_te.loc[f'AR({p_mejor})', 'sesgo a 24 h']|+.1f}} el AR({{=p_mejor}})): sus rezagos de días los anclan más al nivel reciente.
- El ingenuo y Holt–Winters casi no tienen sesgo: no regresan a ninguna media. Pero Holt–Winters pierde por llegar tarde a los cambios.
- El orden general se conserva bastante (Spearman {{=rho_vp|.2f}}): los modelos malos en la validación siguen siendo malos en la prueba.
@@ Decisión
🟡 Es el desenlace de la contradicción entre **ADF y KPSS** de la Unidad I: las dos tenían razón. El viento regresa a su nivel (ADF), pero ese nivel cambia con la temporada (KPSS), y la ruptura del 30 de octubre cayó dentro de la prueba. La validación no podía verlo.
:::

:::pastilla amarillo | Aplicar · Diagnóstico de residuos del elegido | u2:diagnostico u2:lb-residuos u2:jarque-bera u2:arch-lm {#fin-residuos}
Revisar los **residuos a un paso** del modelo elegido **en la prueba**: el error de pronosticar cada hora con los datos hasta la hora anterior, usando los coeficientes del entrenamiento. Se grafican en el tiempo, se mira su ACF y se aplican Ljung–Box, Jarque–Bera y ARCH-LM.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| residuos | ecuación de h = 1 del modelo directo, en cada hora de la prueba | Errores fuera de muestra. |
| Ljung–Box | h = 24 y 48, `model_df=24` | Los 24 rezagos del modelo. |
| ARCH-LM | 24 rezagos | ¿La volatilidad se agrupa? |
@@ Código
```python
pos_te = np.arange(n_tr, len(y))
X_te1 = np.column_stack([np.ones(len(pos_te)), np.array([matriz(yv, t) for t in pos_te]), Fh[pos_te]])
resid_te = pd.Series(yv[pos_te] - X_te1 @ coef_dir_te[1], index=y.index[pos_te])
lb_te = acorr_ljungbox(resid_te, lags=[48, 96], model_df=24)
jb_te = jarque_bera(resid_te)
arch_te = het_arch(resid_te, nlags=24)
acf_te = acf(resid_te, nlags=72, fft=True)
print(f"Residuos a un paso en la prueba: media {resid_te.mean():+.3f} m/s, desviación {resid_te.std():.3f}")
print(lb_te.round(4).to_string())
print(f"Jarque–Bera: p = {jb_te[1]:.1e}, curtosis {jb_te[3]:.2f} | ARCH-LM: LM = {arch_te[0]:.0f}, p = {arch_te[1]:.1e}")
print(f"Desviación del residuo: en la validación {np.std(VAL['Directa (24 rezagos + Fourier)'].query('h == 1')['real'] - VAL['Directa (24 rezagos + Fourier)'].query('h == 1')['pron']):.3f} | en la prueba {resid_te.std():.3f}")
```
@@ Resultado
```python oculto
control("fin-residuos", [{"etiqueta": "Vista", "tipo": "seg", "textos": ["en el tiempo", "ACF"], "inicial": 0}],
        [[linea(resid_te.index, resid_te.round(3), "residuo a un paso", "lav", 0.8)], correlograma(acf_te, len(resid_te), "ACF de los residuos", 1, "lav")],
        alto=270, showlegend=False, title={"text": f"Residuos a un paso del elegido en la prueba"},
        lv=[{"yaxis": {"title": {"text": "m/s"}}}, {"xaxis": {"title": {"text": "rezago (horas)"}, "dtick": 6}, "yaxis": {"range": [-0.15, 0.15]}}])
```
@widget lab-control id=fin-residuos
@@ Lectura
- Los residuos a un paso tienen media casi cero ({{=resid_te.mean()|+.2f}} m/s) y una desviación un poco mayor que en la validación ({{=resid_te.std()|.2f}} contra 1.13).
- **Ljung–Box rechaza** (p = {{=lb_te['lb_pvalue'].iloc[0]|.4f}} con h = 48), pero la ACF muestra autocorrelaciones pequeñas: el modelo capturó casi toda la dependencia lineal.
- **Jarque–Bera** rechaza (curtosis {{=jb_te[3]|.1f}}) y **ARCH-LM** también: hay ráfagas de errores grandes en las entradas y salidas de los nortes, visibles en la gráfica de los residuos en el tiempo.
@@ Decisión
🟡 La media del viento está bien modelada; su varianza no. Es la misma conclusión del diagnóstico de la Unidad II, ahora fuera de muestra.
:::

:::pastilla verde | Aplicar · Intervalos del 80% y 95%: ¿cubren lo que prometen? | u2:ref-intervalos u2:intervalos-psi u2:regresar-escala {#fin-intervalos}
Medir la **cobertura** de los intervalos en la prueba. Se comparan los intervalos **analíticos** (que suponen errores normales con varianza constante) de la armónica, del SARIMA y de Holt–Winters, y unos intervalos **empíricos** para el elegido, construidos con los cuantiles de sus errores de validación en cada horizonte.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| analíticos | ẑ ± z σ<sub>h</sub> en √y, al cuadrado | Los de statsmodels y statsforecast. |
| empíricos | cuantiles 10–90% y 2.5–97.5% del error de validación por horizonte | No suponen normalidad. |
| ancho | promedio en m/s | Un intervalo que cubre pero es enorme no informa. |
@@ Código
```python
def cobertura(d, lo, hi):
    dentro = (d["real"] >= lo) & (d["real"] <= hi)
    return dentro.mean(), (hi - lo).mean()

filas_cob = []
for k in ["Armónica + AR(3) en √y", mejor_sar + " en √y", "Holt-Winters"]:
    if k in PRU and "lo80" in PRU[k]:
        for nv in (80, 95):
            c, a = cobertura(PRU[k], PRU[k][f"lo{nv}"], PRU[k][f"hi{nv}"])
            filas_cob.append({"modelo e intervalo": f"{k} (analítico)", "nivel %": nv, "cobertura": c, "ancho medio": a})
err_val_e = (VAL[elegido]["real"] - VAL[elegido]["pron"]).groupby(VAL[elegido]["h"])
BANDAS_E = {}
for nv, (qa, qb) in {80: (0.10, 0.90), 95: (0.025, 0.975)}.items():
    lo_e = np.clip(PRU[elegido]["pron"] + PRU[elegido]["h"].map(err_val_e.quantile(qa)), 0, None)
    hi_e = PRU[elegido]["pron"] + PRU[elegido]["h"].map(err_val_e.quantile(qb))
    BANDAS_E[nv] = (lo_e, hi_e)
    c, a = cobertura(PRU[elegido], lo_e, hi_e)
    filas_cob.append({"modelo e intervalo": f"{elegido} (empírico)", "nivel %": nv, "cobertura": c, "ancho medio": a})
tab_cob = pd.DataFrame(filas_cob)
print(tab_cob.assign(cobertura=lambda t: (100 * t["cobertura"]).round(1)).round(2).to_string(index=False))
```
@@ Resultado
```python oculto
tabla("fin-intervalos", ["modelo e intervalo", "nivel", "cobertura en la prueba", "ancho medio (m/s)"],
      [[r["modelo e intervalo"], f"{int(r['nivel %'])}%", f"{100 * r['cobertura']:.1f}%", f"{r['ancho medio']:.1f}"] for _, r in tab_cob.iterrows()],
      ["elegido" if abs(100 * r["cobertura"] - r["nivel %"]) <= 3 else ("descartado" if 100 * r["cobertura"] < r["nivel %"] - 8 else "") for _, r in tab_cob.iterrows()],
      titulo="Cobertura de los intervalos en la prueba", nota="Verde: a 3 puntos o menos de su nivel. Rojo: cubre 8 puntos o más por debajo de lo que promete.")
```
@widget lab-tabla id=fin-intervalos
@@ Lectura
- Los intervalos **analíticos** de la armónica y del SARIMA cubren casi lo que prometen ({{=100 * tab_cob.iloc[0]['cobertura']|.0f}}% y {{=100 * tab_cob.iloc[1]['cobertura']|.0f}}% en la armónica), pero son muy **anchos**: {{=tab_cob.iloc[0]['ancho medio']|.0f}} y {{=tab_cob.iloc[1]['ancho medio']|.0f}} m/s en promedio. Al elevar al cuadrado, los límites se estiran en los vientos altos.
- Los de **Holt–Winters** se quedan muy cortos ({{=100 * tab_cob.iloc[4]['cobertura']|.0f}}% con el nivel 80): suponen un error pequeño en las primeras horas.
- Los **empíricos** del elegido son más angostos pero también cubren menos de lo prometido ({{=100 * tab_cob.iloc[6]['cobertura']|.0f}}% y {{=100 * tab_cob.iloc[7]['cobertura']|.0f}}%): se calibraron con los errores de una temporada más tranquila.
@@ Decisión
✅ Para la temporada de nortes, los intervalos analíticos de los modelos en √y son los honestos. Para hacerlos más informativos haría falta modelar la volatilidad (el GARCH de la Unidad II).
:::

:::pastilla verde | Aplicar · El pronóstico contra lo real, con intervalos | u2:arima-pronostico u2:w-pronostico {#fin-grafica}
Graficar los pronósticos de cada medianoche del elegido, con sus bandas empíricas del 80% y 95%, junto con la armónica y el viento real, en dos semanas de diciembre con nortes.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| ventana | 1 al 14 de diciembre | Un norte fuerte y días tranquilos. |
| pronóstico | uno nuevo cada medianoche | Por eso hay saltos a las 00:00. |
@@ Código
```python
vent_f = (PRU[elegido].index >= "2019-12-01") & (PRU[elegido].index < "2019-12-15")
Pv = PRU[elegido][vent_f]
fuera95_v = int(np.sum((Pv["real"] < BANDAS_E[95][0][vent_f]) | (Pv["real"] > BANDAS_E[95][1][vent_f])))
print(f"En estas dos semanas: MAE del elegido {np.mean(np.abs(Pv['real'] - Pv['pron'])):.2f} | armónica {np.mean(np.abs(PRU['Armónica + AR(3) en √y'][vent_f]['real'] - PRU['Armónica + AR(3) en √y'][vent_f]['pron'])):.2f}"
      f" | ingenuo {np.mean(np.abs(PRU['Naive'][vent_f]['real'] - PRU['Naive'][vent_f]['pron'])):.2f} m/s")
print(f"Horas fuera de la banda del 95%: {fuera95_v} de {len(Pv)}")
```
@@ Resultado
```python oculto
grafica("fin-grafica", banda(Pv.index, BANDAS_E[95][0][vent_f], BANDAS_E[95][1][vent_f], "95%", "rgba(124,105,214,.12)")
        + banda(Pv.index, BANDAS_E[80][0][vent_f], BANDAS_E[80][1][vent_f], "80%", "rgba(124,105,214,.26)")
        + [linea(Pv.index, Pv["real"], "viento real", "osc", 1.8), linea(Pv.index, Pv["pron"], elegido, "lav", 2.2),
           linea(Pv.index, PRU["Armónica + AR(3) en √y"][vent_f]["pron"], "Armónica + AR(3)", "rosa", 1.4, "dot")],
        alto=360, title={"text": "Pronósticos de cada medianoche contra el viento real (1–14 de diciembre)"}, yaxis={"title": {"text": "m/s"}})
```
@widget lab-graf id=fin-grafica
@@ Lectura
- Cada pronóstico **arranca cerca del valor real** de la medianoche y se va acercando a su nivel. En los días de norte el elegido se queda por debajo; la armónica, todavía más.
- El ciclo diario se ve como una ondulación en los pronósticos.
- Los errores grandes llegan cuando **empieza o termina un norte**: el viento real sale de la banda del 95% en {{=fuera95_v}} de las {{=len(Pv)}} horas.
@@ Decisión
✅ La gráfica confirma las tablas: el modelo sabe del nivel y del ciclo diario, y no puede anticipar los cambios de régimen.
:::

:::pastilla verde | Aplicar · Conclusiones: ¿captura la estacionalidad y la tendencia? | u1:componentes u3:elnino-conclusion {#fin-conclusiones}
Responder las preguntas finales del flujo con lo que dijeron las tres unidades y la prueba, y escribir las limitaciones del análisis.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| estacionalidad | el ciclo diario | La única periodicidad del viento horario. |
| tendencia | el nivel de la temporada | Lo que el viento tiene en lugar de una tendencia. |
@@ Código
```python
CONCLUSIONES = [
    ("¿Captura la estacionalidad?", f"Sí. El ciclo diario ({por_banda['ciclo diario (22–26 h)']:.1f}% de la varianza, máximo a las {(fase24 / (2 * np.pi / 24)) % 24:.0f} h) entra con los términos de Fourier y los 24 rezagos; en los residuos queda r₂₄ = {acf_te[24]:+.3f}."),
    ("¿Captura la tendencia?", f"A medias. No hay tendencia monótona, pero el nivel cambia con la temporada: a 24 horas el elegido se queda corto {sesgo_te.loc[elegido, 'sesgo a 24 h']:+.2f} m/s en la prueba."),
    ("¿Le gana a la referencia?", f"Al ingenuo sí ({tab_pru.loc[elegido, 'mejora % vs Naive']:+.1f}% en MAE); a Holt–Winters, {'sí' if tab_pru.loc[elegido, 'MAE'] < tab_pru.loc['Holt-Winters', 'MAE'] else 'no'}."),
    ("¿Residuos de ruido blanco?", f"{'Sí' if lb_te['lb_pvalue'].iloc[0] > 0.05 else 'No del todo'}: Ljung–Box con h = 48 da p = {lb_te['lb_pvalue'].iloc[0]:.4f}, con autocorrelaciones pequeñas; la varianza no es constante (ARCH-LM p = {arch_te[1]:.0e})."),
    ("Limitación: cambios estructurales", "Un solo año de datos: la validación (agosto a octubre) no contiene ninguna entrada de temporada de nortes, y la prueba sí."),
    ("Limitación: valores atípicos y paros", "Los cambios bruscos al empezar y terminar cada norte no se pueden anticipar con la serie; los paros afectan la potencia, no el viento."),
    ("Limitación: falta de variables", "Sin pronósticos meteorológicos como exógenas, la mejora sobre el ingenuo a 24 horas tiene un techo bajo."),
]
for p, r in CONCLUSIONES:
    print(f"{p}\n   {r}")
```
@@ Resultado
```python oculto
tabla("fin-conclusiones", ["pregunta", "respuesta"], [list(f) for f in CONCLUSIONES], titulo="Conclusiones y limitaciones")
```
@widget lab-tabla id=fin-conclusiones
@@ Lectura
- **Estacionalidad:** capturada. El ciclo diario entra al modelo y no queda en los residuos.
- **Tendencia:** no hay tendencia, pero sí un **nivel de temporada** que el modelo no anticipa: es la principal fuente de error en la prueba.
- **Limitaciones:** un solo año (una sola transición de temporada), cambios bruscos imposibles de anticipar con la propia serie y ninguna variable meteorológica pronosticada.
@@ Decisión
✅ El análisis por unidades llega a un pronóstico que le gana a la referencia ingenua en un {{=tab_pru.loc[elegido, 'mejora % vs Naive']|.0f}}% en la temporada más difícil del año, con modelos que se entienden pieza por pieza. Falta compararlo con el primer análisis.
:::
