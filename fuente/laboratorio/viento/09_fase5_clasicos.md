## 📐 Fase 5a · Modelos clásicos (Unidad II) {#fase-clasicos}
@mapa Elegir órdenes SARIMA con AIC y BIC, leer el modelo estimado, decidir entre d = 0 y d = 1 con la validación, probar Holt–Winters y una regresión armónica con errores AR.

:::pastilla verde | Aplicar · Órdenes SARIMA por AIC y BIC | u2:aic-bic u2:candidatos u2:comparabilidad u2:sarima-def {#cla-orden}
Ajustar los candidatos que sugirieron la [[est-acf|ACF y la PACF]] y compararlos con **AIC** y **BIC**. Los criterios solo comparan modelos con la **misma** serie de respuesta: no se pueden comparar un modelo con d = 0 y otro con d = 1, porque el segundo modela $\Delta z_t$, otra serie con otra verosimilitud.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `ARIMA(order, seasonal_order, season_length=24)` | statsforecast | Mucho más rápido que statsmodels con 7,000 datos y periodo 24. |
| `include_mean=True` | solo con d = 0 | Con d = 0 la serie tiene media distinta de cero; con d = 1 la media de $\Delta z$ es casi 0. |
| candidatos d = 0 | AR(1) a AR(3) y ARMA(2,1), (2,2), con $(1,0,1)_{24}$ | La PACF se cortaba en 1–3 y había algo en 24. |
| candidatos d = 1 | (0,1,2), (2,1,0), (2,1,2) con $(1,0,0)_{24}$ o $(1,0,1)_{24}$ | La ACF de $\Delta z$ tenía el rezago 2 y el 24. |
@@ Código
```python
from statsforecast.models import ARIMA

CANDIDATOS = [((1, 0, 0), (1, 0, 1)), ((2, 0, 1), (1, 0, 1)), ((3, 0, 0), (1, 0, 1)), ((2, 0, 2), (1, 0, 1)),
              ((0, 1, 2), (1, 0, 0)), ((2, 1, 0), (1, 0, 0)), ((0, 1, 2), (1, 0, 1)), ((2, 1, 2), (1, 0, 1))]
filas = []
for orden, estacional in CANDIDATOS:
    ajuste = StatsForecast(models=[ARIMA(order=orden, seasonal_order=estacional, season_length=24,
                                         include_mean=orden[1] == 0)], freq="h").fit(df_tr)
    info = ajuste.fitted_[0, 0].model_
    filas.append({"modelo": f"ARIMA{orden}×{estacional}₂₄", "d": orden[1], "parámetros": len(info["coef"]),
                  "AIC": info["aic"], "BIC": info["bic"]})
tab_orden = pd.DataFrame(filas).sort_values(["d", "BIC"]).set_index("modelo")
print(tab_orden.round(1).to_string())
```
@@ Resultado
```python oculto
mejor_d0 = tab_orden[tab_orden["d"] == 0]["BIC"].idxmin(); mejor_d1 = tab_orden[tab_orden["d"] == 1]["BIC"].idxmin()
tabla("cla-orden", ["modelo", "d", "parámetros", "AIC", "BIC"],
      [[m, int(r["d"]), int(r["parámetros"]), f'{r["AIC"]:.1f}', f'{r["BIC"]:.1f}'] for m, r in tab_orden.iterrows()],
      ["elegido" if m in (mejor_d0, mejor_d1) else "" for m in tab_orden.index],
      titulo="Candidatos SARIMA ajustados con el entrenamiento (escala √y)",
      nota="AIC y BIC solo se comparan dentro de cada bloque de d: los modelos con d = 1 describen otra serie (Δ√y).")
```
@widget lab-tabla id=cla-orden
@@ Lectura
- Con **d = 0**, el mejor por BIC es **{{=mejor_d0}}** y el AIC está de acuerdo en el orden: tres rezagos de persistencia y una parte estacional diaria.
- Con **d = 1**, el mejor por BIC es **{{=mejor_d1}}**. Entre los de d = 1, agregar la parte estacional MA $(1,0,1)_{24}$ mejora mucho el BIC respecto a $(1,0,0)_{24}$: después de diferenciar, el ciclo diario se ve mejor como un promedio móvil estacional.
- Las diferencias de AIC dentro de cada bloque son de decenas de puntos: con 7,000 horas, el criterio distingue bien.
@@ Decisión
✅ Pasan dos modelos: **{{=mejor_d0}}** y **{{=mejor_d1}}**. La elección entre d = 0 y d = 1 no la puede hacer el AIC; la hará la **validación**. Antes, se revisa qué estimó el modelo con d = 0.
:::

:::pastilla verde | Aplicar · El SARIMA con d = 0: coeficientes, raíces y cancelación estacional | u2:summary-coef u2:raices u2:cancelacion u2:invertibilidad {#cla-sarima}
Leer los coeficientes estimados y comprobar las condiciones de **estacionariedad** (raíces AR fuera del círculo unitario) e **invertibilidad** (raíces MA fuera), y revisar si la parte estacional realmente aporta.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| raíces | `np.roots` del polinomio AR | Un AR es estacionario si todas sus raíces tienen módulo mayor que 1. |
| `sar1`, `sma1` | coeficientes estacionales | Si $\Phi \approx -\Theta$, el factor $(1 - \Phi L^{24})$ casi se cancela con $(1 + \Theta L^{24})$. |
@@ Código
```python
sarima0 = StatsForecast(models=[ARIMA(order=(3, 0, 0), seasonal_order=(1, 0, 1), season_length=24, include_mean=True)],
                        freq="h").fit(df_tr).fitted_[0, 0].model_
coef = pd.Series(sarima0["coef"])
print(coef.round(4).to_string())
phi = coef[["ar1", "ar2", "ar3"]].values
raices = np.roots(np.r_[-phi[::-1], 1])                 # raíces de 1 − φ1 L − φ2 L² − φ3 L³
print("\nMódulo de las raíces AR:", np.round(np.abs(raices), 3))
print(f"Suma de los φ (persistencia): {phi.sum():.3f}")
print(f"Parte estacional: Φ = {coef['sar1']:.3f}, Θ = {coef['sma1']:.3f}, Φ + Θ = {coef['sar1'] + coef['sma1']:.3f}")
print(f"Desviación de los residuos (escala √y): {np.sqrt(sarima0['sigma2']):.3f}")
```
@@ Lectura
- Los tres coeficientes AR suman {{=phi.sum()|.3f}}: la persistencia es muy alta y todas las raíces están fuera del círculo unitario (la más cercana tiene módulo {{=np.abs(raices).min()|.3f}}). El modelo es **estacionario**, aunque por poco: regresa a la media, pero lentamente.
- La parte estacional tiene $\Phi$ = {{=coef['sar1']|.3f}} y $\Theta$ = {{=coef['sma1']|.3f}}: **casi se cancelan** (suma {{=coef['sar1'] + coef['sma1']|.3f}}). El modelo dice que el ciclo diario es un patrón **muy persistente pero de amplitud pequeña**: el efecto neto de los dos factores es una corrección suave de la hora correspondiente de días anteriores.
- La desviación de los residuos ({{=np.sqrt(sarima0['sigma2'])|.3f}} en √y) equivale a menos de 1 m/s a un paso para vientos de 8 a 12 m/s.
@@ Decisión
✅ Modelo válido. La pregunta pendiente de la [[est-memoria|estacionariedad]] sigue abierta: ¿pronostica mejor con d = 0 (regresa a la media del entrenamiento) o con d = 1 (sigue el nivel reciente)?
:::

:::pastilla amarillo | Aplicar · ¿d = 0 o d = 1? La validación decide | u2:arima-pronostico u2:demo-arima110 u2:ref-cv {#cla-d0-d1}
Comparar los dos SARIMA con el protocolo de la validación: 56 días, pronóstico de 24 horas cada medianoche, parámetros estimados con los datos anteriores a la validación. La suposición **S5** dice que d = 0 basta.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `cross_validation(…, refit=False)` | un ajuste | El modelo se estima con las 5,664 horas anteriores a la validación y en cada origen solo se actualiza con los datos nuevos. |
| `level=[80, 95]` | intervalos | Se guardan para revisar la cobertura más adelante. |
| `.clip(lower=0) ** 2` | regreso a m/s | La raíz no puede ser negativa. |
@@ Código
```python
def clasicos():
    return [ARIMA(order=(3, 0, 0), seasonal_order=(1, 0, 1), season_length=24, include_mean=True, alias="SARIMA d=0"),
            ARIMA(order=(2, 1, 2), seasonal_order=(1, 0, 1), season_length=24, alias="SARIMA d=1")]
val_sar = StatsForecast(models=clasicos(), freq="h").cross_validation(df=df_tr, h=24, step_size=24, n_windows=N_VAL,
                                                                     refit=False, level=[80, 95])
VAL = pd.DataFrame({"real": real_val.values, "h": val_ref["h"].values}, index=pd.DatetimeIndex(val_ref["ds"]))
for m in REFERENCIAS:
    VAL[m] = (val_ref[m].clip(lower=0) ** 2).values
for m in ["SARIMA d=0", "SARIMA d=1"]:
    VAL[m] = (val_sar[m].clip(lower=0) ** 2).values
def tabla_val(modelos):
    return pd.DataFrame({m: metricas(VAL["real"], VAL[m]) for m in modelos}).T.sort_values("MAE")
print(tabla_val(["SARIMA d=0", "SARIMA d=1", "Naive", "WindowAverage"]).round(3).to_string())
```
@@ Resultado
```python oculto
COL_M = {"Naive": "dur", "WindowAverage": "cel", "SARIMA d=0": "lav", "SARIMA d=1": "rosa"}
eh = VAL.groupby("h").apply(lambda g: pd.Series({m: np.mean(np.abs(g["real"] - g[m])) for m in COL_M}))
grafica("cla-d0d1", [linea(eh.index, eh[m], m, COL_M[m], 2.4 if "SARIMA" in m else 1.4, "solid" if "SARIMA" in m else "dot") for m in COL_M],
        alto=290, title={"text": "SARIMA con d = 0 y d = 1 según el horizonte (validación)"}, xaxis={"title": {"text": "horas hacia adelante"}, "dtick": 2},
        yaxis={"title": {"text": "MAE (m/s)"}})
```
@widget lab-graf id=cla-d0d1
@@ Lectura
- En la validación, **SARIMA con d = 0 gana** (MAE {{=metricas(VAL['real'], VAL['SARIMA d=0'])['MAE']|.3f}} contra {{=metricas(VAL['real'], VAL['SARIMA d=1'])['MAE']|.3f}} con d = 1) y le gana a las dos referencias.
- Por horizonte: en la primera hora los dos SARIMA empatan con la persistencia, y hasta unas 12 horas van prácticamente juntos, cada vez más por debajo de ella. **A partir de las 15 horas el de d = 0 queda por debajo del de d = 1**: es el horizonte en que la reversión a la media empieza a pesar. El de d = 1 se comporta como una persistencia mejorada.
- En la validación (finales de agosto a mediados de octubre) el nivel del viento está cerca del promedio del entrenamiento, así que regresar a la media es una buena apuesta.
@@ Decisión
🟡 **S5 se sostiene en la validación, con una reserva**: d = 0 gana porque la media a la que regresa coincide con el nivel de esas semanas. La [[part-particion|partición]] mostró que la prueba es mucho más ventosa que el entrenamiento; si allí la media del entrenamiento queda baja, el d = 0 podría sufrir. Se mantiene **SARIMA d = 0** como el clásico principal y d = 1 como alternativa, y se verá en la prueba. Siguiente clásico: **Holt–Winters**.
:::

:::pastilla amarillo | Aplicar · Holt–Winters con estacionalidad de 24 horas | u2:holt u2:guia-holt u2:arima011-suavizamiento-exponencial-simple {#cla-ets}
Probar el método de **Holt–Winters** aditivo (un modelo ETS con error aditivo, sin tendencia y con estacionalidad aditiva de 24 horas). Suaviza el nivel y el patrón diario con pesos exponenciales: es la alternativa clásica de "suavizamiento" a los ARIMA.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `AutoETS(model="ANA", season_length=24)` | error A, tendencia N, estacionalidad A | Sin tendencia: el viento no crece ni decrece de forma sostenida; con estacionalidad diaria. |
| α, γ | estimados por máxima verosimilitud | El peso del dato nuevo en el nivel y en la estacionalidad. |
@@ Código
```python
from statsforecast.models import AutoETS

modelo_ets = AutoETS(model="ANA", season_length=24, alias="Holt-Winters")
ajuste_ets = StatsForecast(models=[modelo_ets], freq="h").fit(df_tr).fitted_[0, 0].model_
alfa, gama = ajuste_ets["par"][0], ajuste_ets["par"][2]
print(f"α (nivel) = {alfa:.3f} | γ (estacionalidad) = {gama:.4f} | AIC = {ajuste_ets['aic']:.1f}")
val_ets = StatsForecast(models=[AutoETS(model="ANA", season_length=24, alias="Holt-Winters")], freq="h").cross_validation(
    df=df_tr, h=24, step_size=24, n_windows=N_VAL, refit=False, level=[80, 95])
VAL["Holt-Winters"] = (val_ets["Holt-Winters"].clip(lower=0) ** 2).values
print(tabla_val(["SARIMA d=0", "Holt-Winters", "Naive", "WindowAverage"]).round(3).to_string())
```
@@ Lectura
- El nivel se actualiza con α = {{=alfa|.2f}}: es un promedio exponencial de las últimas horas, con una vida media de unas {{=np.log(0.5) / np.log(1 - alfa)|.1f}} horas. El pronóstico es ese nivel más el patrón diario estimado (γ = {{=gama|.3f}}: el patrón cambia muy despacio), **sin regresar a ninguna media**: una persistencia suavizada con ciclo diario.
- En la validación su MAE es {{=metricas(VAL['real'], VAL['Holt-Winters'])['MAE']|.3f}}: mejor que la persistencia y algo mejor que el SARIMA por MAE, pero peor por RMSE ({{=metricas(VAL['real'], VAL['Holt-Winters'])['RMSE']|.3f}} contra {{=metricas(VAL['real'], VAL['SARIMA d=0'])['RMSE']|.3f}}): se equivoca menos en promedio y más en los errores grandes, los de los episodios.
- Le falta el ingrediente que hace útil al SARIMA d = 0 a horizontes largos: la reversión a la media. Cuando un episodio intenso termina, el ETS tarda en «enterarse».
@@ Decisión
🟡 Holt–Winters es una referencia clásica razonable, sobre todo si el nivel de la prueba es distinto del de la validación. Pasa a la prueba. El último clásico separa los dos ingredientes que mostró el [[esp-ar|espectro AR]]: persistencia y ciclo diario.
:::

:::pastilla verde | Aplicar · Regresión armónica con errores AR: el ciclo diario con senos y cosenos | u2:armax u2:exogenas u3:armonicos u3:w-regresion-fourier {#cla-armonica}
Modelar el ciclo diario como una **función determinística** (dos pares de seno y coseno de periodo 24 y 12 horas) y la persistencia con un **AR(3)** en los errores. Es un modelo ARIMAX: las variables exógenas son términos de Fourier, que se conocen para cualquier hora futura.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `sen1, cos1` | $\sin(2\pi t/24)$, $\cos(2\pi t/24)$ | El ciclo de 24 horas. |
| `sen2, cos2` | $\sin(2\pi t/12)$, $\cos(2\pi t/12)$ | El armónico de 12 horas que mostró el periodograma. |
| `ARIMA(order=(3, 0, 0))` | sin parte estacional | La parte estacional ya la hacen los términos de Fourier: 4 parámetros en lugar de un SAR y un SMA. |
| AIC | comparable con el SARIMA d = 0 | Misma serie, misma d: ahora sí se pueden comparar. |
@@ Código
```python
t_h = np.arange(len(df_z))
df_x = df_z.copy()
for k in (1, 2):
    df_x[f"sen{k}"] = np.sin(2 * np.pi * k * t_h / 24)
    df_x[f"cos{k}"] = np.cos(2 * np.pi * k * t_h / 24)
df_x_tr = df_x.iloc[:n_tr]
armonica = StatsForecast(models=[ARIMA(order=(3, 0, 0), include_mean=True)], freq="h").fit(df_x_tr).fitted_[0, 0].model_
print(pd.Series(armonica["coef"]).round(4).to_string())
amp24 = np.hypot(armonica["coef"]["ex_1"], armonica["coef"]["ex_2"])
print(f"\nAIC: regresión armónica = {armonica['aic']:.1f} | SARIMA(3,0,0)×(1,0,1)₂₄ = {tab_orden.loc['ARIMA(3, 0, 0)×(1, 0, 1)₂₄', 'AIC']:.1f}")
print(f"Amplitud del ciclo de 24 h: {amp24:.3f} en √y")
val_arm = StatsForecast(models=[ARIMA(order=(3, 0, 0), include_mean=True, alias="Armónica + AR(3)")], freq="h").cross_validation(
    df=df_x_tr, h=24, step_size=24, n_windows=N_VAL, refit=False, level=[80, 95])
VAL["Armónica + AR(3)"] = (val_arm["Armónica + AR(3)"].clip(lower=0) ** 2).values
print()
print(tabla_val(["Armónica + AR(3)", "SARIMA d=0", "Holt-Winters", "WindowAverage"]).round(3).to_string())
```
@@ Lectura
- Los coeficientes AR son parecidos a los del SARIMA, y los cuatro términos de Fourier describen el ciclo diario con una amplitud de {{=amp24|.2f}} en √y.
- El **AIC es menor** ({{=armonica['aic']|.1f}} contra {{=tab_orden.loc['ARIMA(3, 0, 0)×(1, 0, 1)₂₄', 'AIC']|.1f}}): un patrón diario fijo y suave describe la serie mejor que el par SAR–SMA que casi se cancelaba.
- En la validación es **el mejor clásico** por MAE ({{=metricas(VAL['real'], VAL['Armónica + AR(3)'])['MAE']|.3f}}) y por RMSE ({{=metricas(VAL['real'], VAL['Armónica + AR(3)'])['RMSE']|.3f}}): combina la reversión a la media del AR con un ciclo diario estable.
@@ Decisión
✅ La regresión armónica es la versión más **económica e interpretable** del modelo clásico: separa explícitamente "ciclo diario" y "persistencia". Pasa a la prueba junto con los SARIMA y Holt–Winters. La Fase 5b prueba los enfoques de **aprendizaje automático** y **redes neuronales**.
:::
