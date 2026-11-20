## 🧩 Fase 4 · Descomposición STL {#fase-stl}
@mapa La STL del entrenamiento componente por componente, qué pasa al cambiar sus parámetros y qué modelo le toca a cada componente.

:::pastilla azul | Aplicar · STL con periodo de 7 días | u1:stl u1:stl-parametros u1:stl-robusto u1:aditivo {#stl-desc}
Separar el entrenamiento en **tendencia + estacionalidad + residuo** con STL. La idea de la segunda familia de modelos es pronosticar cada parte por separado (algo sencillo para cada una) y sumar.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `period` | 7 | No hay un ciclo claro. El de 7 días es el ciclo corto que más veces se repite en el entrenamiento (≈ 42 veces) y es donde la ACF tiene un pequeño repunte. |
| `seasonal` | 7 (por defecto) | Ventana del LOESS estacional; se varía en el siguiente paso. |
| `robust` | `True` | Los paros (días en 0) no deben deformar la tendencia ni la estacionalidad. |
@@ Código
```python
res = STL(train['y'], period=7, robust=True).fit()
recon = res.trend + res.seasonal + res.resid
print(f"Máxima diferencia entre la suma y la serie: {np.abs(recon - train['y']).max():.2e} kWh")
for nombre, comp in [("tendencia", res.trend), ("estacional", res.seasonal), ("residuo", res.resid)]:
    print(f"{nombre:>10}: de {comp.min():9,.0f} a {comp.max():9,.0f} kWh, varianza = {np.var(comp) / np.var(train['y']) * 100:4.1f} % de la serie")
```
@@ Resultado
```python oculto
xs = train['ds']
serie_g = linea(xs, train['y'], "serie (entrenamiento)", "gris", 1.2)
tend_g = linea(xs, res.trend, "tendencia", "osc", 2.6)
sinT = linea(xs, train['y'] - res.trend, "serie − tendencia", "gris", 1.1)
est_g = linea(xs, res.seasonal, "estacional (periodo 7)", "rosa", 1.6)
res_g = linea(xs, res.resid, "residuo", "menta", 1.2)
suma_g = linea(xs, recon, "tendencia + estacional + residuo", "dur", 1.4, "dot")
ver_mes = {"xaxis": {"range": ["2019-03-01", "2019-04-15"]}}
animacion("anim-stl", [[serie_g], [serie_g, tend_g], [sinT, est_g], [sinT, est_g], [res_g], [serie_g, suma_g]],
          lv=[{}, {}, {}, ver_mes, {}, {}],
          textos=["La serie del entrenamiento: 292 días con mucho ruido.",
                  "<b>Tendencia</b>: un LOESS que suaviza la serie. Sube y baja con los episodios de viento, sin dirección de largo plazo.",
                  "Se resta la tendencia y se busca un patrón que se repita cada 7 días: la <b>componente estacional</b> (rosa).",
                  "De cerca (marzo – mediados de abril): con <code>seasonal = 7</code> el patrón rosa <b>cambia de una semana a otra</b> y va persiguiendo los altibajos de la serie; no es un ciclo fijo.",
                  "<b>Residuo</b> = serie − tendencia − estacional. Es grande: aquí está la variación irregular del clima.",
                  "Comprobación: la suma de las tres componentes reproduce la serie exactamente."],
          etiquetas=["serie", "tendencia", "estacional", "zoom", "residuo", "suma"], etiqueta="Paso", vel=2600, alto=330,
          yaxis={"title": {"text": "kWh/día"}})
```
@widget lab-anim id=anim-stl
@@ Lectura
- La suma reproduce la serie (diferencia máxima ≈ 0), como debe en una descomposición aditiva.
- La **tendencia** se lleva **{{=np.var(res.trend) / np.var(train['y']) * 100|.0f}} %** de la varianza, la **estacional** apenas **{{=np.var(res.seasonal) / np.var(train['y']) * 100|.0f}} %** y el **residuo** **{{=np.var(res.resid) / np.var(train['y']) * 100|.0f}} %**.
- Ese {{=np.var(res.seasonal) / np.var(train['y']) * 100|.0f}} % de la estacional no es un ciclo semanal real: con la ventana `seasonal` más chica (7), la STL deja que el patrón cambie cada semana y termina absorbiendo parte del ruido. La ACF de la serie no tenía un pico en el rezago 7. La STL calcula un patrón porque se le pidió un periodo, no porque la serie lo tenga.
@@ Decisión
🔵 Antes de usar la STL para pronosticar, se prueba qué pasa al mover `period` y `seasonal`.
:::

:::pastilla amarillo | Aplicar · Variar `period` y `seasonal`: ¿algún residuo es ruido blanco? | u1:stl-parametros u1:ljung-box u1:lb-por-que u1:fuerza {#stl-param}
Probar 25 combinaciones de **periodo** (5, 7, 14, 21, 28 días) y **ventana estacional** (7 a 101) y, para cada una, revisar si el residuo es **ruido blanco** con Ljung–Box (H₀: no hay autocorrelación hasta el rezago 14) y cómo se reparte la varianza.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `period` | 5, 7, 14, 21, 28 | De ciclos cortos a casi un mes. |
| `seasonal` | 7, 15, 31, 51, 101 | Impar; más grande = estacional más suave y estable entre ciclos. |
| `lags` (Ljung–Box) | 14 | Dos semanas de rezagos. |
@@ Código
```python
filas = []
for periodo in [5, 7, 14, 21, 28]:
    for seasonal in [7, 15, 31, 51, 101]:
        r = STL(train['y'], period=periodo, seasonal=seasonal, robust=True).fit()
        filas.append({
            'periodo': periodo, 'seasonal': seasonal,
            'Ljung-Box p (lag 14)': acorr_ljungbox(r.resid, lags=[14])['lb_pvalue'].iloc[0],
            'ADF p residuo': adfuller(r.resid)[1],
            '% var tendencia': np.var(r.trend) / np.var(train['y']) * 100,
            '% var estacional': np.var(r.seasonal) / np.var(train['y']) * 100,
            '% var residuo': np.var(r.resid) / np.var(train['y']) * 100,
        })
tabla_stl = pd.DataFrame(filas)
print(tabla_stl.round(3).to_string(index=False))
```
@@ Resultado
```python oculto
PERIODOS, SEASONALS = [5, 7, 14, 21, 28], [7, 15, 31, 51, 101]
variantes, textos_v = [], []
for periodo in PERIODOS:
    for seasonal in SEASONALS:
        r = STL(train['y'], period=periodo, seasonal=seasonal, robust=True).fit()
        a = acf(r.resid, nlags=LAGS)[1:]
        f = tabla_stl[(tabla_stl.periodo == periodo) & (tabla_stl.seasonal == seasonal)].iloc[0]
        variantes.append([{"type": "bar", "x": k20, "y": _vals(a), "width": .6, "name": "ACF del residuo",
                           "marker": {"color": [PALETA["dur"] if abs(v) > banda_acf else PALETA["menta"] for v in a]},
                           "hovertemplate": "k = %{x}<br>%{y:.3f}<extra></extra>"}])
        textos_v.append(f"periodo = {periodo}, seasonal = {seasonal}: Ljung–Box p = <b>{f['Ljung-Box p (lag 14)']:.1e}</b> (no es ruido blanco). "
                        f"Varianza: tendencia {f['% var tendencia']:.0f} %, estacional {f['% var estacional']:.0f} %, residuo <b>{f['% var residuo']:.0f} %</b>.")
control("stl-param", [{"tipo": "seg", "etiqueta": "period", "textos": [str(x) for x in PERIODOS], "inicial": 1},
                      {"tipo": "seg", "etiqueta": "seasonal", "textos": [str(x) for x in SEASONALS], "inicial": 0}],
        variantes, textos=textos_v, alto=300, title={"text": "ACF del residuo de la STL (naranja: fuera de la banda)"},
        xaxis={"title": {"text": "rezago k"}, "dtick": 1}, yaxis={"range": [-.4, .7]},
        shapes=[{"type": "rect", "xref": "paper", "x0": 0, "x1": 1, "y0": -banda_acf, "y1": banda_acf, "fillcolor": "rgba(124,105,214,.13)", "line": {"width": 0}}])
tabla("stl-param-tab", ["periodo", "seasonal", "Ljung–Box p", "ADF p", "% tendencia", "% estacional", "% residuo"],
      [[int(f['periodo']), int(f['seasonal']), f"{f['Ljung-Box p (lag 14)']:.1e}", f"{f['ADF p residuo']:.4f}", f"{f['% var tendencia']:.1f}",
        f"{f['% var estacional']:.1f}", f"{f['% var residuo']:.1f}"] for _, f in tabla_stl.iterrows()],
      titulo="Las 25 combinaciones")
```
@widget lab-control id=stl-param
@widget lab-tabla id=stl-param-tab
@@ Lectura
- **Ninguna** combinación deja un residuo que sea ruido blanco: en todas, Ljung–Box da p ≈ 0 (la mayor es {{=tabla_stl['Ljung-Box p (lag 14)'].max()|.1e}}), y la ACF del residuo tiene barras naranjas en los primeros rezagos.
- La ADF del residuo sale significativa en todas, así que **no sirve para distinguir** entre configuraciones: prueba raíz unitaria, no ruido blanco, y casi cualquier residuo de STL es estacionario.
- El residuo conserva entre **{{=tabla_stl['% var residuo'].min()|.0f}} %** y **{{=tabla_stl['% var residuo'].max()|.0f}} %** de la varianza: buena parte de la serie es variación irregular del clima.
@@ Decisión
🟡 El criterio del residuo no permite elegir. Los parámetros se elegirán por el **error de pronóstico en la validación** (fase 5).
:::

:::pastilla azul | Aplicar · Qué modelo le toca a cada componente | u1:adf u1:diferenciacion u1:acf-pacf u2:deriva u2:ref-metodos {#stl-comp}
Estudiar la tendencia y la estacional de la STL (periodo 7) para decidir con qué modelo pronosticar cada una.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| tendencia | ADF con `d = 0` y `d = 1`; ACF/PACF de su primera diferencia | Ver si es estacionaria y qué AR sugiere. |
| estacional | su ACF | Ver qué tan periódica es. |
@@ Código
```python
p_tend0 = prueba_diferenciacion(res.trend, 0, "Tendencia en d=0")
p_tend1 = prueba_diferenciacion(res.trend, 1, "Tendencia en d=1")
tendencia_dif1 = res.trend.diff().dropna()
acf_td, pacf_td = acf(tendencia_dif1, nlags=LAGS), pacf(tendencia_dif1, nlags=LAGS)
acf_est = acf(res.seasonal, nlags=LAGS)
print("ACF  tendencia diferenciada:", np.round(acf_td[1:7], 2))
print("PACF tendencia diferenciada:", np.round(pacf_td[1:7], 2))
print("ACF  estacional (k = 7, 14):", np.round(acf_est[[7, 14]], 2))
```
@@ Resultado
```python oculto
def _corr3(v, n_eje, color):
    b = 1.96 / np.sqrt(len(train))
    return {"type": "bar", "x": k20, "y": _vals(v[1:]), "width": .6, "showlegend": False, "xaxis": f"x{n_eje}", "yaxis": f"y{n_eje}",
            "marker": {"color": [PALETA["dur"] if abs(x) > b else PALETA[color] for x in v[1:]]}, "hovertemplate": "k = %{x}<br>%{y:.3f}<extra></extra>"}
grafica("stl-comp", [_corr3(acf_td, "", "osc"), _corr3(pacf_td, 2, "osc"), _corr3(acf_est, 3, "rosa")], alto=520,
        title={"text": "Tendencia diferenciada: ACF y PACF · Estacional: ACF"},
        yaxis={"domain": [.70, 1], "range": [-1, 1], "title": {"text": "ACF tend."}}, xaxis={"anchor": "y", "dtick": 1},
        yaxis2={"domain": [.36, .64], "range": [-1, 1], "title": {"text": "PACF tend."}}, xaxis2={"anchor": "y2", "dtick": 1},
        yaxis3={"domain": [0, .30], "range": [-1, 1], "title": {"text": "ACF estac."}}, xaxis3={"anchor": "y3", "dtick": 1, "title": {"text": "rezago k"}})
```
@widget lab-graf id=stl-comp
@@ Lectura
- **Tendencia en niveles**: ADF la marca estacionaria, pero por poco (p = {{=p_tend0|.3f}}). Su primera diferencia es claramente estacionaria (p = {{=p_tend1|.1e}}).
- En la diferencia, la **ACF decae** durante unos 5 rezagos y la **PACF** tiene valores fuertes en los rezagos 1 y 2 ({{=pacf_td[1]|.2f}} y {{=pacf_td[2]|.2f}}): un **ARIMA(2,1,0)** para la tendencia. Se comparará con `RandomWalkWithDrift` (visto en clase) y con AutoARIMA.
- **Estacional**: su ACF tiene picos en los rezagos 7 y 14 ({{=acf_est[7]|.2f}} y {{=acf_est[14]|.2f}}) porque la STL **obliga** a que el patrón se repita cada 7 días. Es periódica por construcción, así que ADF o un AR/MA no aportan nada: se pronostica con `SeasonalNaive`, que repite el último ciclo.
- **Residuo**: se probará `Naive` (repetir el último) contra `HistoricAverage` (su media, ≈ 0).
@@ Decisión
🔵 Candidatos: tendencia → RWD, ARIMA(2,1,0) o AutoARIMA; estacional → SeasonalNaive; residuo → Naive o HistoricAverage. Los elige la validación.
:::
