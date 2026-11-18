## 🗓️ Unidad II · Exógenas, AIC/BIC y SARIMA {#u2-sarima}
@mapa Variables exógenas (términos de Fourier, temperatura y presión, festivos) y la fuga de información; AIC y BIC para elegir el orden y qué modelos se pueden comparar; SARIMA, el AR estacional y el modelo de aerolínea; la rejilla de SARIMA.

:::pastilla verde | Aplicar · Una exógena determinista: términos de Fourier | u2:armax u2:festivos {#exog-fourier}
Representar el ciclo diario con **términos de Fourier** (senos y cosenos de periodo 24 y 12 horas) como **variables exógenas** de un modelo con errores AR(3): una **regresión armónica**. Son exógenas perfectas: se conocen de antemano para cualquier hora futura.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| exógenas | sen y cos de 2πt/24 y 4πt/24 | El ciclo diario y su primer armónico: 4 coeficientes en lugar de 24. |
| errores | AR(3) | La dependencia que queda. |
| escala | √y | La transformación elegida. |
@@ Código
```python
hora_t = np.arange(len(y)) % 24
FOURIER = pd.DataFrame({"sen24": np.sin(2 * np.pi * hora_t / 24), "cos24": np.cos(2 * np.pi * hora_t / 24),
                        "sen12": np.sin(4 * np.pi * hora_t / 24), "cos12": np.cos(4 * np.pi * hora_t / 24)}, index=y.index)
armonica = ARIMA(z_fit, exog=FOURIER.loc[z_fit.index], order=(3, 0, 0)).fit()
print(pd.DataFrame({"coef": armonica.params, "p-value": armonica.pvalues}).round(4).to_string())
amp24 = np.hypot(armonica.params["sen24"], armonica.params["cos24"])
hora_pico = (np.degrees(np.arctan2(armonica.params["sen24"], armonica.params["cos24"])) % 360) / 15
print(f"\nAmplitud del ciclo de 24 h en √y: {amp24:.3f} | hora del máximo: {hora_pico:.1f} h")
VAL["Armónica + AR(3) en √y"] = evaluar_sm(armonica, transf=np.sqrt, inv=cuad, exog=FOURIER)
print(f"MAE en la validación: {metricas(VAL['Armónica + AR(3) en √y']['real'], VAL['Armónica + AR(3) en √y']['pron'])['MAE']:.3f} | AR(3) en √y: {tab_arima.loc['ARIMA(3,0,0) en √y', 'MAE']:.3f}")
```
@@ Lectura
- Los cuatro términos de Fourier son significativos. El ciclo de 24 horas tiene amplitud {{=amp24|.2f}} en √y y su máximo a las **{{=hora_pico|.0f}} h**, como en la gráfica estacional de la Unidad I.
- Los errores AR(3) tienen φ₁ = {{=armonica.params['ar.L1']|.3f}}: la persistencia sigue siendo la parte principal.
- En la validación la regresión armónica tiene **MAE {{=metricas(VAL['Armónica + AR(3) en √y']['real'], VAL['Armónica + AR(3) en √y']['pron'])['MAE']|.3f}}**: mejora mucho al AR(3) en √y ({{=tab_arima.loc['ARIMA(3,0,0) en √y', 'MAE']|.3f}}) y **le gana a Holt–Winters** ({{=tab_ref_todas.loc['Holt-Winters', 'MAE']|.3f}}) con solo 9 parámetros.
@@ Decisión
✅ Una exógena determinista, conocida en el futuro, es la forma más barata de poner el ciclo diario en el modelo. Es el primer modelo parsimonioso que vence a la referencia.
:::

:::pastilla rojo | Aplicar · Temperatura y presión: los requisitos y la fuga de información | u2:requisitos-exog u2:fuga u2:w-fuga {#exog-fuga}
Usar la **temperatura** y la **presión**, que la exploración mostró relacionadas con el viento, como exógenas. Una exógena útil debe conocerse **en el momento de pronosticar**. Se compara el modelo con sus valores **reales futuros** (una fuga: en la práctica no se conocen) contra el modelo con sus valores de **hace 24 horas** (sí se conocen).
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| contemporáneas | temperatura y presión de la misma hora | La fuga: usa el futuro. |
| rezagadas | las de 24 horas antes | Para pronosticar la hora t + h ≤ t + 24 solo se necesitan datos hasta t. |
| modelo | AR(3) en √y con las exógenas | El mismo en los dos casos. |
@@ Código
```python
temp_h = s10["AmbTempMean"].resample("h").mean().interpolate(limit_direction="both")
pres_h = s10["BaroPressMean"].resample("h").mean().interpolate(limit_direction="both")
EX_AHORA = pd.DataFrame({"temp": temp_h, "pres": pres_h - 995})
EX_AYER = EX_AHORA.shift(24).bfill()
m_fuga = ARIMA(z_fit, exog=EX_AHORA.loc[z_fit.index], order=(3, 0, 0)).fit()
m_ayer = ARIMA(z_fit, exog=EX_AYER.loc[z_fit.index], order=(3, 0, 0)).fit()
VAL["AR(3) √y + temp. y presión reales (fuga)"] = evaluar_sm(m_fuga, transf=np.sqrt, inv=cuad, exog=EX_AHORA)
VAL["AR(3) √y + temp. y presión de ayer"] = evaluar_sm(m_ayer, transf=np.sqrt, inv=cuad, exog=EX_AYER)
for k in ["AR(3) √y + temp. y presión reales (fuga)", "AR(3) √y + temp. y presión de ayer"]:
    print(f"{k:>42}: MAE {metricas(VAL[k]['real'], VAL[k]['pron'])['MAE']:.3f}")
print(f"{'AR(3) en √y sin exógenas':>42}: MAE {tab_arima.loc['ARIMA(3,0,0) en √y', 'MAE']:.3f}")
print("\nCoeficientes con la fuga:", m_fuga.params[["temp", "pres"]].round(4).to_dict(), "| p-values:", m_fuga.pvalues[["temp", "pres"]].round(4).to_dict())
```
@@ Lectura
- Con la temperatura y la presión de la **misma hora** (la fuga) el MAE baja a {{=metricas(VAL['AR(3) √y + temp. y presión reales (fuga)']['real'], VAL['AR(3) √y + temp. y presión reales (fuga)']['pron'])['MAE']|.3f}}: parece una gran mejora, y los coeficientes son muy significativos.
- Pero con los valores de **ayer**, que son los que se conocerían a la medianoche, el resultado es **igual** ({{=metricas(VAL['AR(3) √y + temp. y presión de ayer']['real'], VAL['AR(3) √y + temp. y presión de ayer']['pron'])['MAE']|.3f}}): la mejora no viene de saber el futuro, sino del **ciclo diario** que la temperatura trae consigo (sube de día y baja de noche).
- Los dos quedan detrás de la regresión armónica, que pone el ciclo diario directamente.
@@ Decisión
❌ La temperatura y la presión no aportan más que el ciclo diario. Y la lección de la fuga: una exógena se evalúa con los valores que se conocerían al pronosticar, no con los reales.
:::

:::pastilla rojo | Aplicar · Festivos y calendario | u2:festivos u2:guia-festivo {#exog-festivos}
Agregar una variable de **día festivo** como exógena. En una serie de demanda (electricidad, usuarios) los festivos cambian mucho el comportamiento; en el viento no debería haber ningún efecto. Es una forma de comprobar si una exógena aporta.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| festivos | los obligatorios de México en 2019 | 1 de enero, 4 de febrero, 18 de marzo, 1 de mayo, 16 de septiembre, 18 de noviembre y 25 de diciembre. |
| variable | 1 en las 24 horas del festivo, 0 en el resto | Una indicadora. |
@@ Código
```python
FESTIVOS = pd.to_datetime(["2019-01-01", "2019-02-04", "2019-03-18", "2019-05-01", "2019-09-16", "2019-11-18", "2019-12-25"])
EX_FEST = pd.DataFrame({"festivo": y.index.normalize().isin(FESTIVOS).astype(float)}, index=y.index)
m_fest = ARIMA(z_fit, exog=EX_FEST.loc[z_fit.index], order=(3, 0, 0)).fit()
print(f"Coeficiente del festivo: {m_fest.params['festivo']:+.4f} (error estándar {m_fest.bse['festivo']:.4f}, p-value {m_fest.pvalues['festivo']:.3f})")
print(f"Viento medio en festivos: {y[EX_FEST['festivo'] == 1].mean():.2f} m/s | en el resto: {y[EX_FEST['festivo'] == 0].mean():.2f}")
print(f"Festivos en el periodo de estimación: {int(EX_FEST.loc[z_fit.index, 'festivo'].sum() / 24)} días")
```
@@ Lectura
- El coeficiente del festivo es {{=m_fest.params['festivo']|+.3f}} con p-value {{=m_fest.pvalues['festivo']|.2f}}: **no significativo**.
- Que el viento medio en festivos sea un poco mayor ({{=y[EX_FEST['festivo'] == 1].mean()|.1f}} contra {{=y[EX_FEST['festivo'] == 0].mean()|.1f}}) es casualidad: hay solo 7 días festivos en el año, varios en temporada de nortes.
@@ Decisión
❌ El calendario humano no afecta al viento. Las exógenas de calendario son para series de demanda.
:::

:::pastilla verde | Aplicar · AIC y BIC para elegir el orden del AR | u2:aic-def u2:penalizacion u2:rejilla {#aic-orden}
Elegir el orden del AR con los **criterios de información**: $\text{AIC} = -2\ell + 2k$ y $\text{BIC} = -2\ell + k \ln n$. Los dos premian el ajuste (ℓ) y castigan los parámetros (k); BIC castiga más. Se comparan con lo que dijo la validación.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| p | 1 a 96 | Hasta cuatro días. |
| `hold_back=96` | misma muestra para todos | Los criterios solo se comparan con los mismos datos. |
| escala | y (m/s) | La de la búsqueda del orden de los AR. |
@@ Código
```python
crit = {}
for p in range(1, 97):
    r = AutoReg(y_fit, lags=p, hold_back=96).fit()
    crit[p] = {"AIC": r.aic, "BIC": r.bic, "HQIC": r.hqic}
crit = pd.DataFrame(crit).T
p_aic, p_bic, p_hq = int(crit["AIC"].idxmin()), int(crit["BIC"].idxmin()), int(crit["HQIC"].idxmin())
print(f"Orden elegido: AIC → {p_aic} | BIC → {p_bic} | HQIC → {p_hq} | validación → {p_mejor}")
print(f"Castigo por parámetro: AIC 2 | BIC ln n = {np.log(len(y_fit) - 96):.2f}")
for p in sorted({p_aic, p_bic, p_hq}):
    if p not in AR_P:
        AR_P[p] = AutoReg(y_fit, lags=p).fit()
    v = evaluar(lambda h, p=p: pron_ar(AR_P[p].params.values, h))
    VAL[f"AR({p})"] = v
    print(f"AR({p:>2}): MAE en la validación {metricas(v['real'], v['pron'])['MAE']:.3f}")
```
@@ Resultado
```python oculto
cr_rel = crit - crit.min()
grafica("aic-orden", [linea(crit.index, cr_rel["AIC"].round(1), "AIC − mínimo", "lav", 2.4), linea(crit.index, cr_rel["BIC"].round(1), "BIC − mínimo", "dur", 2.4)],
        alto=280, title={"text": "AIC y BIC de los AR(p), respecto de su mínimo"}, xaxis={"title": {"text": "orden p"}, "dtick": 12},
        yaxis={"title": {"text": "diferencia con el mínimo"}, "range": [0, 150]}, shapes=[vline(p_aic, "lav"), vline(p_bic, "dur")])
```
@widget lab-graf id=aic-orden
@@ Lectura
- **AIC** elige p = {{=p_aic}} y **BIC** elige p = {{=p_bic}}: el castigo de BIC por parámetro ({{=np.log(len(y_fit) - 96)|.1f}}) es más de cuatro veces el de AIC (2).
- La validación prefería p = {{=p_mejor}}, muy cerca de lo que eligió AIC: el AR({{=p_aic}}) tiene MAE {{=metricas(VAL[f'AR({p_aic})']['real'], VAL[f'AR({p_aic})']['pron'])['MAE']|.3f}}, casi igual.
- El AR({{=p_bic}}) de BIC es mucho más simple, pero su error es mayor ({{=metricas(VAL[f'AR({p_bic})']['real'], VAL[f'AR({p_bic})']['pron'])['MAE']|.3f}}).
@@ Decisión
✅ Para pronosticar, AIC se parece más a la validación; BIC prefiere el modelo "verdadero" más simple. Es la diferencia de la Unidad II: AIC para predecir, BIC para explicar.
:::

:::pastilla amarillo | Aplicar · ¿Qué modelos se pueden comparar con AIC? | u2:comparabilidad u2:demo-jacobiano {#aic-comparabilidad}
Comparar el AIC del AR(3) en m/s con el del AR(3) en √y. **No son comparables** tal cual: la verosimilitud está en unidades distintas. Para compararlos hay que pasar la de √y a m/s con el **jacobiano** de la transformación: $\ell_y = \ell_z + \sum \ln \left|\frac{dz}{dy}\right| = \ell_z - \sum \ln(2\sqrt{y_t})$.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| modelos | AR(3) en y y en √y, por máxima verosimilitud | Mismos datos, distinta escala. |
| corrección | AIC<sub>y</sub> = AIC<sub>z</sub> + 2 Σ ln(2√y<sub>t</sub>) | La misma verosimilitud, medida en m/s. |
@@ Código
```python
aic_y, aic_z = mv3.aic, ar3_z.aic
jac = 2 * np.sum(np.log(2 * np.sqrt(y_fit.values)))
print(f"AIC del AR(3) en m/s: {aic_y:,.1f} | en √y: {aic_z:,.1f} (¡parece mucho mejor!)")
print(f"AIC del AR(3) en √y llevado a m/s: {aic_z + jac:,.1f}")
print(f"Diferencia real: {aic_y - (aic_z + jac):+,.1f} a favor del modelo en {'√y' if aic_z + jac < aic_y else 'm/s'}")
print(f"También fallan: AIC con d = 0 contra d = 1 ({ARIMA_Z['ARIMA(3,0,0) en √y'].aic:,.1f} contra {ARIMA_Z['ARIMA(1,1,1) en √y'].aic:,.1f}): con d = 1 se modela ∇z y se pierde un dato.")
```
@@ Lectura
- El AIC en √y ({{=aic_z|,.0f}}) parece muchísimo menor que en m/s ({{=aic_y|,.0f}}), pero solo porque √y tiene unidades más chicas.
- Con el jacobiano, el modelo en √y tiene AIC de {{=aic_z + jac|,.0f}} en m/s: **peor** que el modelo directo en m/s por {{=(aic_z + jac) - aic_y|,.0f}} puntos.
- Tampoco se comparan modelos con distinto d: con d = 1 la verosimilitud es la de ∇z.
@@ Decisión
🟡 AIC y BIC solo comparan modelos de la **misma serie** (misma transformación y mismas diferencias). Para comparar escalas o diferencias, la herramienta es la validación.
:::

:::pastilla amarillo | Aplicar · SARIMA: el AR estacional | u2:sarima-def u2:ar-estacional {#sarima-ar-est}
Agregar la parte **estacional** de periodo 24: un **SARIMA**(p, d, q)(P, D, Q)<sub>24</sub>. El AR estacional, $\Phi_1 y_{t-24}$, dice cuánto se parece cada hora a la misma hora del día anterior, más allá de lo que explica la parte regular.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `ARIMA(order=(3, 0, 0), seasonal_order=(1, 0, 0), season_length=24)` | AR(3) × AR(1)₂₄ | Lo mínimo estacional, con statsforecast. |
| `seasonal_order=(1, 0, 1)` | ARMA(1,1)₂₄ estacional | La combinación habitual. |
| `include_mean=True` | constante | d = 0: la serie tiene media. |
| estimación | CSS-ML de statsforecast | Mucho más ligera que el filtro de Kalman de statsmodels con 27 estados. |
@@ Código
```python
from statsmodels.tsa.statespace.sarimax import SARIMAX
from statsforecast.models import ARIMA as ARIMA_SF
import gc
df_z = pd.DataFrame({"unique_id": "MV01", "ds": y.index, "y": np.sqrt(y.values)})
df_z_tr = df_z.iloc[:n_tr]

def cv_sf(modelos, df=None, n_windows=N_VAL, niveles=None):
    """Validación con origen móvil en √y con statsforecast (parámetros fijos) y regreso a m/s."""
    df = df_z_tr if df is None else df
    cv = StatsForecast(models=modelos, freq="h").cross_validation(df=df, h=24, step_size=24, n_windows=n_windows, refit=False,
                                                                  **({"level": niveles} if niveles else {}))
    salida = {}
    for m in modelos:
        d = pd.DataFrame({"real": y[pd.DatetimeIndex(cv["ds"])].values, "pron": cuad(cv[m.alias].values),
                          "h": np.tile(np.arange(1, 25), n_windows)}, index=pd.DatetimeIndex(cv["ds"]))
        for nv in (niveles or []):
            d[f"lo{nv}"], d[f"hi{nv}"] = cuad(cv[f"{m.alias}-lo-{nv}"].values), cuad(cv[f"{m.alias}-hi-{nv}"].values)
        salida[m.alias] = d
    return salida

def criterios(order, seasonal_order=(0, 0, 0)):
    """AIC, BIC y coeficientes de un ARIMA estacional de statsforecast estimado con z_fit."""
    m = ARIMA_SF(order=order, seasonal_order=seasonal_order, season_length=24 if any(seasonal_order) else 1,
                 include_mean=(order[1] == 0 and seasonal_order[1] == 0)).fit(z_fit.values)
    coef = {k: float(v) for k, v in m.model_["coef"].items()}
    return {"AIC": m.model_["aic"], "BIC": m.model_["bic"], "k": len(coef) + 1, "coef": coef}

ar3_sf = criterios((3, 0, 0))
sar_100 = criterios((3, 0, 0), (1, 0, 0))
sar_101 = criterios((3, 0, 0), (1, 0, 1))
print(f"AR(3): AIC {ar3_sf['AIC']:,.1f}")
print(f"AR(3)×AR(1)₂₄: Φ₁ = {sar_100['coef']['sar1']:.4f} | AIC {sar_100['AIC']:,.1f}")
print(f"AR(3)×ARMA(1,1)₂₄: Φ₁ = {sar_101['coef']['sar1']:.4f}, Θ₁ = {sar_101['coef']['sma1']:.4f} | AIC {sar_101['AIC']:,.1f}")
print(f"Φ + Θ = {sar_101['coef']['sar1'] + sar_101['coef']['sma1']:.4f} (si es casi 0, las dos partes se cancelan)")
cv_est = cv_sf([ARIMA_SF(order=(3, 0, 0), seasonal_order=(1, 0, 0), season_length=24, include_mean=True, alias="SARIMA(3,0,0)(1,0,0)₂₄ en √y"),
                ARIMA_SF(order=(3, 0, 0), seasonal_order=(1, 0, 1), season_length=24, include_mean=True, alias="SARIMA(3,0,0)(1,0,1)₂₄ en √y")])
for k, v in cv_est.items():
    VAL[k] = v
    print(f"{k}: MAE en la validación {metricas(v['real'], v['pron'])['MAE']:.3f}")
```
@@ Lectura
- El **AR(1) estacional** solo tiene Φ₁ = {{=sar_100['coef']['sar1']|.3f}}: después de la persistencia de las últimas horas, la misma hora de ayer agrega poco.
- Con la parte **ARMA(1,1) estacional**, Φ₁ = {{=sar_101['coef']['sar1']|.3f}} y Θ₁ = {{=sar_101['coef']['sma1']|.3f}}: casi se cancelan (suman {{=sar_101['coef']['sar1'] + sar_101['coef']['sma1']|.3f}}). Esa combinación describe un **patrón diario fijo** que se repite con mucha memoria: la versión SARIMA de la regresión armónica.
- El AIC baja mucho con la parte estacional ({{=ar3_sf['AIC']|.0f}} → {{=sar_101['AIC']|.0f}}), y el MAE mejora un poco ({{=metricas(VAL['SARIMA(3,0,0)(1,0,1)₂₄ en √y']['real'], VAL['SARIMA(3,0,0)(1,0,1)₂₄ en √y']['pron'])['MAE']|.3f}}).
@@ Decisión
🟡 La parte estacional sirve, pero en la forma Φ ≈ −Θ ≈ 1: un ciclo diario casi determinista. Es lo que la Unidad III llamará una "línea" en el espectro.
:::

:::pastilla rojo | Aplicar · El modelo de aerolínea con periodo 24 | u2:aerolinea u2:demo-aerolinea {#sarima-aerolinea}
Probar el **modelo de aerolínea**, SARIMA(0,1,1)(0,1,1)<sub>24</sub>, el clásico de las series con estacionalidad fuerte (como AirPassengers). Usa una diferencia regular y una **estacional**. La Unidad I indicó que la diferencia estacional sobra; aquí se ve qué pasa si se usa de todos modos.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `order=(0, 1, 1), seasonal_order=(0, 1, 1, 24)` | aerolínea | ∇∇₂₄ con un MA regular y uno estacional. |
| Θ | MA estacional | Si se acerca a −1, la diferencia estacional sobra. |
@@ Código
```python
aero = criterios((0, 1, 1), (0, 1, 1))
print({k: round(v, 4) for k, v in aero["coef"].items()})
VAL.update(cv_sf([ARIMA_SF(order=(0, 1, 1), seasonal_order=(0, 1, 1), season_length=24, alias="Aerolínea (0,1,1)(0,1,1)₂₄ en √y")]))
print(f"\nMAE en la validación: {metricas(VAL['Aerolínea (0,1,1)(0,1,1)₂₄ en √y']['real'], VAL['Aerolínea (0,1,1)(0,1,1)₂₄ en √y']['pron'])['MAE']:.3f}")
```
@@ Lectura
- El MA estacional estimado es Θ₁ = **{{=aero['coef']['sma1']|.3f}}**, prácticamente −1: la diferencia estacional **sobra** y el modelo la intenta deshacer.
- El MA regular es casi cero ({{=aero['coef']['ma1']|.3f}}): después de diferenciar, no queda estructura regular que modelar.
- El MAE es {{=metricas(VAL['Aerolínea (0,1,1)(0,1,1)₂₄ en √y']['real'], VAL['Aerolínea (0,1,1)(0,1,1)₂₄ en √y']['pron'])['MAE']|.3f}}: mejor que el ingenuo, pero peor que los SARIMA con d = 0.
@@ Decisión
❌ El modelo de aerolínea es para series con estacionalidad fuerte y tendencia, como AirPassengers. Con el viento, el diagnóstico de la Unidad I (D = 0) era correcto.
:::

:::pastilla verde | Aplicar · La rejilla de SARIMA | u2:sarima-ap u2:w-aic-grid {#sarima-rejilla}
Comparar varias combinaciones de parte regular y estacional con AIC, BIC y error de validación. AIC y BIC solo se comparan entre modelos con el **mismo d y D** y la misma escala; la validación compara todo.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| parte regular | (1,0,0), (3,0,0), (1,0,1), (2,0,3), (2,1,2) | Los mejores ARIMA anteriores. |
| parte estacional | (0,0,0), (1,0,0), (1,0,1) | Sin estacional, AR y ARMA estacional. |
| escala | √y | La elegida. |
| estimación y validación | statsforecast, `refit=False` | Los 15 modelos con el mismo método. |
@@ Código
```python
REG = [(1, 0, 0), (3, 0, 0), (1, 0, 1), (2, 0, 3), (2, 1, 2)]
EST = [(0, 0, 0, 0), (1, 0, 0, 24), (1, 0, 1, 24)]
filas_s, modelos_sf = [], []
for o in REG:
    for so in EST:
        tx = lambda t: "(" + ",".join(map(str, t)) + ")"
        nombre = f"SARIMA{tx(o)}{tx(so[:3])}₂₄" if so[3] else f"ARIMA{tx(o)}"
        info = sar_100 if (o, so) == ((3, 0, 0), (1, 0, 0, 24)) else (sar_101 if (o, so) == ((3, 0, 0), (1, 0, 1, 24)) else criterios(o, so[:3]))
        filas_s.append({"modelo": nombre, "d": o[1], "k": info["k"], "AIC": info["AIC"], "BIC": info["BIC"]})
        modelos_sf.append(ARIMA_SF(order=o, seasonal_order=so[:3], season_length=24 if so[3] else 1, include_mean=(o[1] == 0), alias=nombre + " en √y"))
cv_rej = cv_sf(modelos_sf)
VAL.update(cv_rej)
for f in filas_s:
    f["MAE"] = metricas(cv_rej[f["modelo"] + " en √y"]["real"], cv_rej[f["modelo"] + " en √y"]["pron"])["MAE"]
tab_sar = pd.DataFrame(filas_s).set_index("modelo").sort_values("MAE")
print(tab_sar.round(3).to_string())
mejor_sar = tab_sar.index[0]
print(f"\nMejor en la validación: {mejor_sar} | menor AIC con d = 0: {tab_sar[tab_sar['d'] == 0]['AIC'].idxmin()} | menor BIC con d = 0: {tab_sar[tab_sar['d'] == 0]['BIC'].idxmin()}")
```
@@ Resultado
```python oculto
tabla("sarima-rejilla", ["modelo", "d", "parámetros", "AIC", "BIC", "MAE validación"],
      [[k, int(r["d"]), int(r["k"]), f"{r['AIC']:,.0f}", f"{r['BIC']:,.0f}", f"{r['MAE']:.3f}"] for k, r in tab_sar.iterrows()],
      ["elegido" if k == mejor_sar else "" for k in tab_sar.index], titulo="SARIMA en √y: criterios y validación",
      nota="AIC y BIC solo son comparables entre modelos con el mismo d.")
```
@widget lab-tabla id=sarima-rejilla
@@ Lectura
- Los modelos **con parte estacional ARMA(1,1)** ocupan los primeros lugares: el mejor es **{{=mejor_sar}}** con MAE {{=tab_sar['MAE'].iloc[0]|.3f}}.
- Entre los modelos con d = 0, AIC elige el mismo que la validación; BIC prefiere el {{=tab_sar[tab_sar['d'] == 0]['BIC'].idxmin()}}, con menos parámetros.
- Los modelos con **d = 1** quedan abajo, y los no estacionales también.
- Ninguno le gana a la regresión armónica ({{=metricas(VAL['Armónica + AR(3) en √y']['real'], VAL['Armónica + AR(3) en √y']['pron'])['MAE']|.3f}}).
@@ Decisión
✅ El mejor SARIMA es {{=mejor_sar}}. Antes de compararlo con los demás, la Unidad II pide **diagnosticar** sus residuos.
:::
