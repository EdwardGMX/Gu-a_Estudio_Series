## 🧱 Unidad II · Modelos de referencia {#u2-referencias}
@mapa Los pronósticos más simples posibles: los cuatro métodos básicos, el flujo de statsforecast, las ventanas, el suavizamiento exponencial, Holt y Holt–Winters, residuos, intervalos, referencias con descomposición y cuál es la referencia que hay que vencer.

:::pastilla azul | Aplicar · Los cuatro métodos básicos en un día | u2:ref-metodos u2:ref-por-que {#ref-cuatro}
Pronosticar un día con los **cuatro métodos básicos**: el **ingenuo** (repetir el último valor), el **ingenuo estacional** (repetir las últimas 24 horas), la **media histórica** y el **paseo aleatorio con deriva** (seguir la recta entre el primer y el último dato). Antes de cualquier modelo hay que saber cuánto logra lo más simple.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| origen | una medianoche de la validación | Un ejemplo concreto. |
| horizonte | 24 horas | El del problema. |
| historia | todo lo anterior al origen | Lo que se conocía a esa hora. |
@@ Código
```python
REF_FUN = {
    "Naive": lambda h: np.repeat(h.iloc[-1], 24),
    "SeasonalNaive": lambda h: h.iloc[-24:].values,
    "HistoricAverage": lambda h: np.repeat(h.mean(), 24),
    "RWD": lambda h: h.iloc[-1] + (h.iloc[-1] - h.iloc[0]) / (len(h) - 1) * np.arange(1, 25),
}
t_ej = ORIGENES_VAL[9]
hist_ej = y[:t_ej - pd.Timedelta(hours=1)]
real_ej = y[t_ej:t_ej + pd.Timedelta(hours=23)]
pron_ej = {k: f(hist_ej) for k, f in REF_FUN.items()}
print(f"Origen: {t_ej:%d/%m/%Y} 00:00 | último valor conocido: {hist_ej.iloc[-1]:.2f} m/s | media histórica: {hist_ej.mean():.2f}")
for k, p in pron_ej.items():
    print(f"{k:>16}: MAE del día {np.mean(np.abs(real_ej.values - p)):.2f} m/s")
```
@@ Resultado
```python oculto
COL_REF = {"Naive": "dur", "SeasonalNaive": "rosa", "HistoricAverage": "gris", "RWD": "mant", "WindowAverage": "menta", "SeasonalWindowAverage": "cel",
           "SES": "lav", "Holt": "rojo", "Holt-Winters": "verde"}
h_prev = y[t_ej - pd.Timedelta(hours=48):t_ej - pd.Timedelta(hours=1)]
grafica("ref-cuatro", [linea(h_prev.index, h_prev, "historia (2 días)", "gris", 1.4), linea(real_ej.index, real_ej, "lo que pasó", "osc", 2.4)]
        + [linea(real_ej.index, p, k, COL_REF[k], 2, "dash") for k, p in pron_ej.items()],
        alto=300, title={"text": f"Los cuatro pronósticos básicos del {t_ej:%d/%m}"}, yaxis={"title": {"text": "m/s"}})
```
@widget lab-graf id=ref-cuatro
@@ Lectura
- El {{=t_ej.strftime('%d/%m')}} empezó con poco viento ({{=hist_ej.iloc[-1]|.1f}} m/s) y siguió tranquilo. El **ingenuo** y el **paseo con deriva**, que repiten el último valor, aciertan casi perfecto (MAE de {{=np.mean(np.abs(real_ej.values - pron_ej['Naive']))|.1f}} m/s).
- El **ingenuo estacional** copia el día anterior, que fue distinto: se equivoca {{=np.mean(np.abs(real_ej.values - pron_ej['SeasonalNaive']))|.1f}} m/s.
- La **media histórica** ({{=hist_ej.mean()|.1f}} m/s) queda muy arriba: un día tranquilo está lejos del promedio del año.
- La deriva es casi nula: la recta entre el 1 de enero y el origen es casi horizontal.
@@ Decisión
🔵 Un solo día no decide nada: depende de si el día se parece a lo último que se vio. Hay que evaluar en muchos días.
:::

:::pastilla verde | ⏩ Aplicar · Los cuatro métodos en las 56 medianoches de la validación | u2:ref-evaluar u2:ref-pronosticar {#ref-validacion}
Evaluar los cuatro métodos con el protocolo fijado: pronosticar 24 horas en cada una de las **56 medianoches** de la validación, con los datos disponibles hasta cada una, y calcular las métricas sobre las 1,344 horas.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `evaluar` | origen móvil, h = 24 | El protocolo del adelanto de la Unidad I. |
| métricas | MAE, RMSE, MAPE y MASE | Las del flujo. |
@@ Código
```python
VAL = {k: evaluar(f) for k, f in REF_FUN.items()}
VAL["STL + última (Unidad I)"] = val_desc["última"]

def tabla_metricas(dic, nombres=None):
    nombres = nombres or list(dic)
    return pd.DataFrame({k: metricas(dic[k]["real"], dic[k]["pron"]) for k in nombres}).T.sort_values("MAE")

tab_ref = tabla_metricas(VAL)
print(tab_ref.round(3).to_string())
```
@@ Resultado
```python oculto
tabla("ref-validacion", ["método", "MAE", "RMSE", "MAPE %", "MASE"],
      [[k, f"{r['MAE']:.3f}", f"{r['RMSE']:.3f}", f"{r['MAPE %']:.1f}", f"{r['MASE']:.2f}"] for k, r in tab_ref.iterrows()],
      ["elegido" if i == 0 else ("descartado" if i == len(tab_ref) - 1 else "") for i in range(len(tab_ref))],
      titulo="Referencias en la validación (56 días, errores en m/s)")
```
@widget lab-tabla id=ref-validacion
@@ Lectura
- El **ingenuo** tiene MAE de {{=tab_ref.loc['Naive', 'MAE']|.3f}} m/s en la validación. El **paseo con deriva** es prácticamente igual: la deriva es casi cero.
- El **ingenuo estacional** es peor ({{=tab_ref.loc['SeasonalNaive', 'MAE']|.3f}}): copiar ayer funciona peor que repetir la última hora. El ciclo diario es demasiado débil para que valga la pena.
- La **media histórica** es la peor ({{=tab_ref.loc['HistoricAverage', 'MAE']|.3f}}) y tiene un MAPE de {{=tab_ref.loc['HistoricAverage', 'MAPE %']|.0f}}%.
- El pronóstico **por descomposición** de la Unidad I (STL + última) le gana a las cuatro: {{=tab_ref.loc['STL + última (Unidad I)', 'MAE']|.3f}}.
@@ Decisión
✅ El ingenuo es la mejor de las cuatro básicas. Su MASE de {{=tab_ref.loc['Naive', 'MASE']|.2f}} dice que a 24 horas se equivoca 2.6 veces más que a una hora.
:::

:::pastilla verde | Aplicar · El mismo cálculo con statsforecast | u2:ref-statsforecast u2:sim-statsforecast u2:ref-cv {#ref-statsforecast}
Repetir la evaluación con **statsforecast**, la biblioteca que usa la Unidad II: los datos van en un DataFrame con `unique_id`, `ds` y `y`, y `cross_validation` hace el origen móvil. Debe dar lo mismo que el cálculo a mano.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `df_tr` | entrenamiento con la validación | `cross_validation` usa las últimas ventanas. |
| `h=24, step_size=24, n_windows=56` | 56 días de 24 horas | El mismo protocolo. |
| `refit=True` | reajusta en cada origen | Las referencias "se ajustan" con toda la historia. |
@@ Código
```python
from statsforecast import StatsForecast
from statsforecast.models import Naive, SeasonalNaive, HistoricAverage, RandomWalkWithDrift, WindowAverage, SeasonalWindowAverage
from statsforecast.models import SimpleExponentialSmoothing, Holt, AutoETS
df_y = pd.DataFrame({"unique_id": "MV01", "ds": y.index, "y": y.values})
df_tr = df_y.iloc[:n_tr]
cv_ref = StatsForecast(models=[Naive(), SeasonalNaive(season_length=24), HistoricAverage(), RandomWalkWithDrift(alias="RWD")], freq="h").cross_validation(
    df=df_tr, h=24, step_size=24, n_windows=N_VAL, refit=True)
print(f"Cortes: del {cv_ref['cutoff'].min():%d/%m %H:%M} al {cv_ref['cutoff'].max():%d/%m %H:%M} | filas: {len(cv_ref)}")
for k in REF_FUN:
    print(f"{k:>16}: MAE statsforecast {np.mean(np.abs(cv_ref['y'] - cv_ref[k].clip(lower=0))):.4f} | a mano {metricas(VAL[k]['real'], VAL[k]['pron'])['MAE']:.4f}")
```
@@ Lectura
- `cross_validation` hizo **56 cortes**, uno cada día a las 23:00 (el último dato conocido antes de cada medianoche), con {{=len(cv_ref)|,}} pronósticos en total.
- Los MAE de statsforecast y los del cálculo a mano coinciden en las cuatro cifras decimales.
@@ Decisión
✅ El cálculo a mano y la biblioteca hacen lo mismo. En lo que sigue se usa la herramienta más cómoda en cada caso.
:::

:::pastilla verde | Aplicar · Promedios de ventana: ¿cuántas horas recordar? | u2:ref-ventanas u2:w-ref-ventanas {#ref-ventanas}
Pronosticar con el **promedio de las últimas k horas** (`WindowAverage`) y con el **promedio de la misma hora en los últimos días** (`SeasonalWindowAverage`). Entre el ingenuo (k = 1) y la media histórica (k = todo) hay un punto óptimo. Mueve el control para cambiar k.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| k | 1, 3, 6, 12, 24, 48, 72, 168 y 336 horas | De una hora a dos semanas. |
| estacional | misma hora de los últimos 3, 7 y 14 días | La versión que respeta el ciclo diario. |
@@ Código
```python
K_VENT = [1, 3, 6, 12, 24, 48, 72, 168, 336]
val_vent = {k: evaluar(lambda h, k=k: np.repeat(h.iloc[-k:].mean(), 24)) for k in K_VENT}
mae_vent = pd.Series({k: metricas(r["real"], r["pron"])["MAE"] for k, r in val_vent.items()})
print("MAE en la validación según k:", mae_vent.round(3).to_dict())
k_opt = int(mae_vent.idxmin())
VAL["WindowAverage"] = val_vent[k_opt]
for w in [3, 7, 14]:
    VAL[f"SeasonalWindowAverage ({w} días)"] = evaluar(lambda h, w=w: h.iloc[-24 * w:].values.reshape(w, 24).mean(axis=0))
    print(f"SeasonalWindowAverage con {w:>2} días: MAE {metricas(VAL[f'SeasonalWindowAverage ({w} días)']['real'], VAL[f'SeasonalWindowAverage ({w} días)']['pron'])['MAE']:.3f}")
print(f"\nLa mejor ventana: k = {k_opt} horas")
```
@@ Resultado
```python oculto
dia_v = slice(ORIGENES_VAL[9], ORIGENES_VAL[11] + pd.Timedelta(hours=23))
control("ref-ventanas", [{"etiqueta": "Ventana k", "textos": [f"{k} h" for k in K_VENT], "inicial": K_VENT.index(k_opt)}],
        [[linea(val_vent[k][dia_v].index, val_vent[k][dia_v]["pron"].round(2), f"promedio de {k} h", "menta", 2.4, shape="hv")] for k in K_VENT],
        base=[linea(y[dia_v].index, y[dia_v].round(2), "viento real", "osc", 1.8)],
        textos=[f"k = {k} h: MAE en toda la validación <b>{mae_vent[k]:.3f} m/s</b>" + (" (la mejor)" if k == k_opt else "") for k in K_VENT],
        alto=290, title={"text": "Pronósticos de WindowAverage en tres días de la validación"}, yaxis={"title": {"text": "m/s"}})
```
@widget lab-control id=ref-ventanas
@@ Lectura
- El MAE baja de {{=mae_vent[1]|.3f}} con k = 1 (el ingenuo) a **{{=mae_vent[k_opt]|.3f}} con k = {{=k_opt}} horas** y vuelve a subir con ventanas largas: con dos semanas ya casi es la media histórica ({{=mae_vent[336]|.3f}}).
- Promediar unas horas **quita el ruido** de la última hora sin perder el nivel del episodio actual.
- Los promedios **estacionales** son peores que el ingenuo estacional y empeoran con más días: el ciclo diario de la última semana no ayuda.
@@ Decisión
✅ El promedio de las últimas {{=k_opt}} horas es mejor referencia que el ingenuo. Que un promedio corto gane dice que el viento tiene ruido de hora a hora encima de un nivel que cambia despacio.
:::

:::pastilla verde | Aplicar · Suavizamiento exponencial simple | u2:ref-ventanas u2:demo-ref-ses-pesos u2:guia-ref-ses {#ref-ses}
Pronosticar con el **suavizamiento exponencial simple** (SES): un promedio de todo el pasado con pesos que decaen como α(1 − α)<sup>j</sup>. Con α cerca de 1 es el ingenuo; con α cerca de 0, la media. El pronóstico es plano: el último nivel suavizado. Mueve el control para cambiar α.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| α | 0.02, 0.05, 0.1, 0.2, 0.4, 0.7 y 1 | De memoria larga a ninguna memoria. |
| `ewm(alpha=α, adjust=False)` | la recursión ℓ<sub>t</sub> = α y<sub>t</sub> + (1 − α) ℓ<sub>t−1</sub> | La definición de SES. |
| vida media de los pesos | ln 0.5 / ln(1 − α) horas | Cuánto pasado pesa la mitad. |
@@ Código
```python
ALFAS = [0.02, 0.05, 0.1, 0.2, 0.4, 0.7, 1.0]
val_ses = {a: evaluar(lambda h, a=a: np.repeat(h.ewm(alpha=a, adjust=False).mean().iloc[-1], 24)) for a in ALFAS}
mae_ses = pd.Series({a: metricas(r["real"], r["pron"])["MAE"] for a, r in val_ses.items()})
for a in ALFAS:
    vida = np.log(0.5) / np.log(1 - a) if a < 1 else 0
    print(f"α = {a:<4}: MAE {mae_ses[a]:.3f} | la mitad del peso en las últimas {vida:5.1f} horas")
a_opt = float(mae_ses.idxmin())
VAL["SES"] = val_ses[a_opt]
sf_ses = SimpleExponentialSmoothing(alpha=a_opt).fit(y[:ini_val - pd.Timedelta(hours=1)].values)
print(f"\nMejor α: {a_opt} | statsforecast con ese α pronostica {sf_ses.predict(1)['mean'][0]:.3f}; ewm da {y[:ini_val - pd.Timedelta(hours=1)].ewm(alpha=a_opt, adjust=False).mean().iloc[-1]:.3f}")
```
@@ Resultado
```python oculto
control("ref-ses", [{"etiqueta": "α", "textos": [str(a) for a in ALFAS], "inicial": ALFAS.index(a_opt)}],
        [[linea(val_ses[a][dia_v].index, val_ses[a][dia_v]["pron"].round(2), f"SES con α = {a}", "lav", 2.4, shape="hv")] for a in ALFAS],
        base=[linea(y[dia_v].index, y[dia_v].round(2), "viento real", "osc", 1.8)],
        textos=[f"α = {a}: MAE en la validación <b>{mae_ses[a]:.3f} m/s</b>" for a in ALFAS],
        alto=290, title={"text": "Pronósticos de SES en tres días de la validación"}, yaxis={"title": {"text": "m/s"}})
```
@widget lab-control id=ref-ses
@@ Lectura
- El SES con **α = {{=a_opt}}** es el mejor (MAE {{=mae_ses[a_opt]|.3f}}): la mitad del peso cae en las últimas {{=np.log(0.5) / np.log(1 - a_opt)|.0f}} horas, parecido a la ventana de {{=k_opt}} horas de WindowAverage, y con un resultado casi idéntico.
- Con α = 1 es el ingenuo ({{=mae_ses[1.0]|.3f}}) y con α = 0.02 se acerca a la media ({{=mae_ses[0.02]|.3f}}).
- statsforecast y la fórmula con `ewm` dan el mismo nivel suavizado.
@@ Decisión
✅ SES y WindowAverage cuentan la misma historia: el mejor pronóstico plano es un promedio de las últimas horas.
:::

:::pastilla amarillo | Aplicar · Holt y Holt–Winters | u2:holt u2:guia-holt {#ref-holt}
Agregar una **tendencia** al suavizamiento (**Holt**) y luego una **estacionalidad** de 24 horas (**Holt–Winters**, el ETS aditivo con estacionalidad). Se ajustan con la historia anterior a la validación y se aplican sin reajustar en cada origen.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `Holt()` | ETS(A, A, N) | Nivel y pendiente. |
| `AutoETS(model="ANA", season_length=24)` | ETS(A, N, A) | Nivel y estacionalidad aditiva, sin pendiente: el viento no tiene tendencia. |
| `refit=False` | parámetros fijos | Se estiman una vez y se aplican en cada origen. |
@@ Código
```python
cv_ets = StatsForecast(models=[Holt(), AutoETS(model="ANA", season_length=24, alias="Holt-Winters")], freq="h").cross_validation(
    df=df_tr, h=24, step_size=24, n_windows=N_VAL, refit=False, level=[80, 95])
for k in ["Holt", "Holt-Winters"]:
    VAL[k] = pd.DataFrame({"real": cv_ets["y"].values, "pron": cv_ets[k].clip(lower=0).values, "h": np.tile(np.arange(1, 25), N_VAL)}, index=pd.DatetimeIndex(cv_ets["ds"]))
    print(f"{k:>13}: MAE {metricas(VAL[k]['real'], VAL[k]['pron'])['MAE']:.3f}")
hw = AutoETS(model="ANA", season_length=24).fit(y[:ini_val - pd.Timedelta(hours=1)].values)
print(f"\nHolt–Winters: α = {hw.model_['par'][0]:.3f}, γ = {hw.model_['par'][2]:.4f}")
```
@@ Lectura
- **Holt** no mejora al ingenuo ({{=metricas(VAL['Holt']['real'], VAL['Holt']['pron'])['MAE']|.3f}}): la pendiente que estima se extrapola 24 horas y el viento no sigue tendencias tanto tiempo.
- **Holt–Winters** es la mejor referencia hasta ahora: **MAE {{=metricas(VAL['Holt-Winters']['real'], VAL['Holt-Winters']['pron'])['MAE']|.3f}}**. Su α = {{=hw.model_['par'][0]|.2f}} da un nivel que se adapta en pocas horas y su γ = {{=hw.model_['par'][2]|.2f}} deja que el patrón diario cambie con la temporada.
@@ Decisión
🟡 Holt–Winters gana porque combina las dos cosas que funcionaron por separado: un nivel suavizado y el ciclo diario. Es la referencia más exigente del temario.
:::

:::pastilla azul | Aplicar · Valores ajustados y residuales de las referencias | u2:ref-residuos u2:guia-ref-residuos {#ref-residuos}
Calcular los **residuales** de las referencias dentro de la muestra: el error del pronóstico **a un paso** que cada método habría hecho en el entrenamiento. Si los residuales tienen autocorrelación, el método deja información sin usar.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| ingenuo | e<sub>t</sub> = y<sub>t</sub> − y<sub>t−1</sub> | El residual del ingenuo es ∇y. |
| ingenuo estacional | e<sub>t</sub> = y<sub>t</sub> − y<sub>t−24</sub> | Es ∇<sub>24</sub>y. |
| media | e<sub>t</sub> = y<sub>t</sub> − ȳ | Los residuales de la media son la serie centrada. |
@@ Código
```python
y_fit = y[:ini_val - pd.Timedelta(hours=1)]
resid_ref = {"Naive": y_fit.diff().dropna(), "SeasonalNaive": y_fit.diff(24).dropna(), "HistoricAverage": y_fit - y_fit.mean()}
filas_res = []
for k, e in resid_ref.items():
    lb = acorr_ljungbox(e, lags=[24])
    filas_res.append({"método": k, "media": e.mean(), "desviación": e.std(), "r_1": e.autocorr(1), "r_24": e.autocorr(24), "Q(24)": lb["lb_stat"].iloc[0]})
tab_res_ref = pd.DataFrame(filas_res).set_index("método")
print(tab_res_ref.round(3).to_string())
```
@@ Resultado
```python oculto
control("ref-residuos", [{"etiqueta": "Método", "tipo": "seg", "textos": list(resid_ref), "inicial": 0}],
        [correlograma(acf(e, nlags=48, fft=True), len(e), "ACF de los residuales", 1, "lav") for e in resid_ref.values()],
        alto=270, showlegend=False, title={"text": "ACF de los residuales de cada referencia"}, xaxis={"title": {"text": "rezago (horas)"}, "dtick": 6},
        yaxis={"range": [-0.4, 1]})
```
@widget lab-control id=ref-residuos
@@ Lectura
- Los residuales del **ingenuo** (∇y) son casi ruido: r<sub>1</sub> = {{=tab_res_ref.loc['Naive', 'r_1']|.3f}}, aunque Ljung–Box todavía detecta algo (Q(24) = {{=tab_res_ref.loc['Naive', 'Q(24)']|.0f}}).
- Los del **ingenuo estacional** y la **media** conservan casi toda la autocorrelación del viento (r<sub>1</sub> de {{=tab_res_ref.loc['SeasonalNaive', 'r_1']|.2f}} y {{=tab_res_ref.loc['HistoricAverage', 'r_1']|.2f}}): dejan mucha información sin usar.
@@ Decisión
🔵 A **un paso**, el ingenuo ya aprovecha casi toda la información. A 24 pasos es otra historia: la ventaja de un modelo estará en los horizontes largos.
:::

:::pastilla amarillo | Aplicar · Intervalos de predicción de las referencias | u2:ref-intervalos u2:guia-ref-intervalos {#ref-intervalos}
Construir los **intervalos de predicción** del ingenuo y del ingenuo estacional con la fórmula de la Unidad II y medir su **cobertura** en la validación: un intervalo del 80% debe contener el valor real en el 80% de las horas.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| ingenuo | ŷ ± z σ √h | La varianza del error crece con el horizonte, como en un paseo. |
| ingenuo estacional | ŷ ± z σ<sub>24</sub> √⌈h/24⌉ | Dentro del primer día el error no crece. |
| z | 1.2816 (80%) y 1.96 (95%) | Cuantiles de la normal. |
@@ Código
```python
from scipy.stats import norm
sd_n, sd_s = resid_ref["Naive"].std(), resid_ref["SeasonalNaive"].std()
cob_ref = []
for k, sd, crec in [("Naive", sd_n, np.sqrt(VAL["Naive"]["h"].values)), ("SeasonalNaive", sd_s, np.ones(len(VAL["SeasonalNaive"])))]:
    for nivel in (80, 95):
        z = norm.ppf(0.5 + nivel / 200)
        ancho = z * sd * crec
        dentro = np.abs(VAL[k]["real"].values - VAL[k]["pron"].values) <= ancho
        cob_ref.append({"método": k, "nivel": nivel, "cobertura": dentro.mean(), "ancho medio": 2 * ancho.mean()})
tab_cob_ref = pd.DataFrame(cob_ref)
print(tab_cob_ref.round(3).to_string(index=False))
```
@@ Resultado
```python oculto
vn = VAL["Naive"][dia_v]
z80, z95 = norm.ppf(0.9), norm.ppf(0.975)
an80, an95 = z80 * sd_n * np.sqrt(vn["h"].values), z95 * sd_n * np.sqrt(vn["h"].values)
grafica("ref-intervalos", banda(vn.index, (vn["pron"] - an95).clip(lower=0), vn["pron"] + an95, "95%", "rgba(238,138,95,.13)")
        + banda(vn.index, (vn["pron"] - an80).clip(lower=0), vn["pron"] + an80, "80%", "rgba(238,138,95,.28)")
        + [linea(vn.index, vn["real"], "viento real", "osc", 1.8), linea(vn.index, vn["pron"], "ingenuo", "dur", 2.2, shape="hv")],
        alto=300, title={"text": "El ingenuo con sus intervalos del 80% y 95% (tres días de validación)"}, yaxis={"title": {"text": "m/s"}})
```
@widget lab-graf id=ref-intervalos
@@ Lectura
- Los intervalos del ingenuo **cubren de más**: el del 80% contiene el {{=100 * tab_cob_ref.iloc[0]['cobertura']|.0f}}% de las horas y el del 95%, el {{=100 * tab_cob_ref.iloc[1]['cobertura']|.0f}}%.
- La razón es el √h: supone que el viento es un paseo aleatorio, cuyo error crece sin límite. Como el viento regresa a su nivel, el error real crece más despacio y los intervalos quedan muy anchos (el del 95% mide {{=tab_cob_ref.iloc[1]['ancho medio']|.0f}} m/s en promedio).
- El ingenuo estacional también cubre de más.
@@ Decisión
🟡 Los intervalos de las referencias son **honestos pero poco informativos**: prometen menos de lo que cumplen. Un modelo que entienda que el viento regresa a su nivel debería dar intervalos más angostos con la misma cobertura.
:::

:::pastilla verde | Aplicar · Cuál es la referencia que hay que vencer | u2:ref-elegir u2:ref-errores {#ref-elegir}
Reunir todas las referencias y elegir **la mejor**: es el piso que cualquier modelo de la Unidad II debe superar. Se mira también el error según el horizonte, porque una referencia puede ser buena a una hora y mala a 24.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| criterio | MAE en la validación | La métrica principal del análisis. |
| por horizonte | MAE en cada h = 1, …, 24 | Dónde gana cada una. |
@@ Código
```python
REFERENCIAS = [k for k in VAL if k != "STL + última (Unidad I)"]
tab_ref_todas = tabla_metricas(VAL, REFERENCIAS)
print(tab_ref_todas.round(3).to_string())
mejor_ref = tab_ref_todas.index[0]
mae_h_ref = pd.DataFrame({k: VAL[k].groupby("h").apply(lambda g: np.mean(np.abs(g["real"] - g["pron"]))) for k in ["Naive", "SeasonalNaive", "WindowAverage", "SES", "Holt-Winters"]})
print(f"\nLa referencia que hay que vencer: {mejor_ref} (MAE {tab_ref_todas['MAE'].iloc[0]:.3f})")
print("MAE a 1, 6, 12 y 24 horas:")
print(mae_h_ref.loc[[1, 6, 12, 24]].round(2).to_string())
```
@@ Resultado
```python oculto
tabla("ref-elegir", ["referencia", "MAE", "RMSE", "MAPE %", "MASE"],
      [[k, f"{r['MAE']:.3f}", f"{r['RMSE']:.3f}", f"{r['MAPE %']:.1f}", f"{r['MASE']:.2f}"] for k, r in tab_ref_todas.iterrows()],
      ["elegido" if k == mejor_ref else "" for k in tab_ref_todas.index], titulo="Todas las referencias en la validación")
grafica("ref-horizonte", [linea(mae_h_ref.index, mae_h_ref[k], k, COL_REF.get(k, "lav"), 2.2) for k in mae_h_ref.columns],
        alto=290, title={"text": "Error de cada referencia según el horizonte"}, xaxis={"title": {"text": "horas hacia adelante"}, "dtick": 2},
        yaxis={"title": {"text": "MAE (m/s)"}})
```
@widget lab-tabla id=ref-elegir
@widget lab-graf id=ref-horizonte
@@ Lectura
- La referencia más exigente es **{{=mejor_ref}}** (MAE {{=tab_ref_todas['MAE'].iloc[0]|.3f}}), seguida de WindowAverage y SES, casi empatados.
- **Por horizonte**, el ingenuo gana a 1 hora ({{=mae_h_ref.loc[1, 'Naive']|.2f}}) pero a 12 horas es el peor de todos ({{=mae_h_ref.loc[12, 'Naive']|.2f}}); WindowAverage y SES son mejores a mitad del día; a 24 horas todas quedan entre 2.5 y 2.8 m/s.
- Holt–Winters es el único bueno a la vez en horizontes cortos y largos.
@@ Decisión
✅ El piso queda fijado: **un modelo de la Unidad II vale la pena si le gana a Holt–Winters** en la validación ({{=tab_ref_todas['MAE'].iloc[0]|.3f}} m/s). Ahora sí, los modelos AR y MA.
:::
