## 🧪 Unidad I · Pruebas de estacionariedad {#u1-pruebas}
@mapa ADF con sus tres especificaciones y su sensibilidad a los rezagos, KPSS, la lectura conjunta, las pruebas por tramos, las rupturas estructurales, Mann–Kendall y las pruebas de varianza constante.

:::pastilla amarillo | Aplicar · La prueba ADF y sus tres especificaciones | u1:adf u1:especificaciones u1:salida-adf {#u1-adf}
Aplicar la prueba **Dickey–Fuller aumentada**: $H_0$: hay raíz unitaria (no estacionaria) contra $H_1$: es estacionaria. Se corre con las tres especificaciones (sin constante, con constante y con constante y tendencia) y se lee cada parte de la salida.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `regression` | `"n"`, `"c"` y `"ct"` | Sin términos deterministas, con media y con media y tendencia lineal. |
| `autolag="AIC"` | rezagos elegidos por AIC | Los rezagos de ∇y que limpian la autocorrelación de la ecuación. |
| `maxlag` | por omisión: 12 (n/100)<sup>1/4</sup> | Para n = 8,760 son 36 rezagos como máximo. |
@@ Código
```python
from statsmodels.tsa.stattools import adfuller, kpss
filas_adf = []
for reg in ["n", "c", "ct"]:
    est, p, rez, nobs, crit, _ = adfuller(y, regression=reg, autolag="AIC")
    filas_adf.append({"especificación": reg, "estadístico": est, "p-value": p, "rezagos": rez, "obs.": nobs,
                      "crítico 5%": crit["5%"], "crítico 1%": crit["1%"]})
tab_adf = pd.DataFrame(filas_adf).set_index("especificación")
print(tab_adf.round(4).to_string())
adf_d = adfuller(dia["mean"], regression="c", autolag="AIC")
print(f"\nViento diario, con constante: estadístico {adf_d[0]:.3f}, p-value {adf_d[1]:.4f}, {adf_d[2]} rezagos")
```
@@ Resultado
```python oculto
tabla("u1-adf", ["especificación", "estadístico", "valor crítico 5%", "p-value", "rezagos", "¿rechaza H₀ al 5%?"],
      [[{"n": "sin constante", "c": "con constante", "ct": "constante y tendencia"}[k], f"{r['estadístico']:.3f}", f"{r['crítico 5%']:.3f}", f"{r['p-value']:.2e}",
        int(r["rezagos"]), "sí" if r["p-value"] < 0.05 else "no"] for k, r in tab_adf.iterrows()],
      ["elegido" if r["p-value"] < 0.05 else "descartado" for _, r in tab_adf.iterrows()], titulo="ADF del viento horario")
```
@widget lab-tabla id=u1-adf
@@ Lectura
- Las tres especificaciones **rechazan la raíz unitaria** con mucha holgura: con constante, el estadístico es {{=tab_adf.loc['c', 'estadístico']|.2f}} contra un valor crítico de {{=tab_adf.loc['c', 'crítico 5%']|.2f}} al 5%.
- AIC eligió {{=int(tab_adf.loc['c', 'rezagos'])}} rezagos de ∇y: la ecuación de la prueba necesita más de un día de historia para limpiar la autocorrelación.
- Sin constante el estadístico es mucho menos negativo ({{=tab_adf.loc['n', 'estadístico']|.2f}}): esa especificación supone media cero, y el viento no la tiene. La tendencia no cambia nada (con y sin ella, {{=tab_adf.loc['ct', 'estadístico']|.2f}}).
- El viento diario también rechaza (estadístico {{=adf_d[0]|.2f}}).
@@ Decisión
🟡 Según la ADF el viento **no tiene raíz unitaria**: regresa a su media. La especificación correcta es la de **constante**. Falta ver qué dice KPSS.
:::

:::pastilla azul | Aplicar · ¿Cuánto depende la ADF de los rezagos? | u1:adf u1:potencia {#u1-adf-rezagos}
Repetir la ADF con un número **fijo** de rezagos, de 0 a 96. Los rezagos corrigen la autocorrelación de los errores de la ecuación de la prueba; con muy pocos la prueba está sesgada, y con demasiados pierde potencia.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `autolag=None` | usa exactamente `maxlag` rezagos | Para ver el efecto de cada número. |
| rezagos | 0, 1, 2, 4, 8, 12, 24, 36, 48, 72 y 96 | De ninguno a cuatro días. |
@@ Código
```python
REZ_ADF = [0, 1, 2, 4, 8, 12, 24, 36, 48, 72, 96]
adf_rez = pd.DataFrame({k: dict(zip(["estadístico", "p-value"], adfuller(y, maxlag=k, regression="c", autolag=None)[:2])) for k in REZ_ADF}).T
print(adf_rez.round(5).to_string())
print(f"\nValor crítico al 5%: {adfuller(y, maxlag=0, regression='c', autolag=None)[4]['5%']:.3f}")
```
@@ Resultado
```python oculto
grafica("u1-adf-rezagos", [linea([str(k) for k in REZ_ADF], adf_rez["estadístico"], "estadístico ADF", "lav", 2.6, mode="lines+markers"),
                           linea([str(k) for k in REZ_ADF], [tab_adf.loc["c", "crítico 5%"]] * len(REZ_ADF), "valor crítico al 5%", "rojo", 1.6, "dash")],
        alto=280, title={"text": "Estadístico ADF (con constante) según el número de rezagos"}, xaxis={"title": {"text": "rezagos de ∇y en la ecuación"}, "type": "category"},
        yaxis={"title": {"text": "estadístico"}})
```
@widget lab-graf id=u1-adf-rezagos
@@ Lectura
- Con **cualquier** número de rezagos el estadístico queda muy por debajo del valor crítico ({{=tab_adf.loc['c', 'crítico 5%']|.2f}}): de {{=adf_rez['estadístico'].min()|.1f}} con pocos rezagos a {{=adf_rez['estadístico'].max()|.1f}} con 96.
- El estadístico se acerca a cero al agregar rezagos: la prueba pierde potencia, pero ni con cuatro días de rezagos deja de rechazar.
@@ Decisión
🔵 La conclusión de la ADF es **robusta** al número de rezagos. No es un resultado frágil de la elección de AIC.
:::

:::pastilla amarillo | Aplicar · La prueba KPSS | u1:kpss u1:sim-kpss {#u1-kpss}
Aplicar la prueba **KPSS**, que invierte las hipótesis: $H_0$: la serie es estacionaria (alrededor de una media o de una tendencia) contra $H_1$: tiene raíz unitaria. El estadístico se construye con las **sumas acumuladas** de las desviaciones: si la serie se queda mucho tiempo de un lado de la media, las sumas crecen.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `regression` | `"c"` y `"ct"` | Estacionaria alrededor de una media o de una tendencia. |
| `nlags="auto"` | ancho de banda de Hobijn | Corrige la autocorrelación en la varianza de largo plazo. |
| p-value | tabla de 0.01 a 0.10 | statsmodels lo recorta: "0.01" significa "menor que 0.01". |
@@ Código
```python
import warnings as _w
filas_k = []
for reg in ["c", "ct"]:
    with _w.catch_warnings():
        _w.simplefilter("ignore")
        est, p, rez, crit = kpss(y, regression=reg, nlags="auto")
    filas_k.append({"especificación": reg, "estadístico": est, "p-value": p, "rezagos": rez, "crítico 5%": crit["5%"]})
tab_kpss = pd.DataFrame(filas_k).set_index("especificación")
print(tab_kpss.round(4).to_string())
S_t = np.cumsum(y.values - y.mean())
print(f"\nSuma acumulada máxima: {S_t.max():,.0f} | mínima: {S_t.min():,.0f} (m/s·h)")
```
@@ Resultado
```python oculto
grafica("u1-kpss", [linea(dia_anio[::12].round(2), S_t[::12].round(0), "suma acumulada de (y − ȳ)", "dur", 2.4)],
        alto=270, showlegend=False, title={"text": "Las sumas acumuladas que usa KPSS"}, xaxis={"title": {"text": "día del año"}},
        yaxis={"title": {"text": "m/s · h"}}, shapes=[hline(0)])
```
@widget lab-graf id=u1-kpss
@@ Lectura
- KPSS **rechaza** la estacionariedad con las dos especificaciones: el estadístico con constante es {{=tab_kpss.loc['c', 'estadístico']|.2f}}, el doble del valor crítico de {{=tab_kpss.loc['c', 'crítico 5%']|.3f}} (p-value menor que 0.01).
- Las sumas acumuladas lo explican: suben hasta {{=S_t.max()|,.0f}} en los primeros meses (viento arriba de la media durante semanas) y luego bajan durante el verano. La serie pasa **temporadas enteras** de un lado de su media.
- Con tendencia tampoco pasa (estadístico {{=tab_kpss.loc['ct', 'estadístico']|.2f}} contra {{=tab_kpss.loc['ct', 'crítico 5%']|.3f}}): la temporada no es una recta.
@@ Decisión
🟡 ADF dice "estacionaria" y KPSS dice "no estacionaria". Hay que leerlas juntas.
:::

:::pastilla verde | Aplicar · Lectura conjunta ADF + KPSS | u1:conjunta {#u1-conjunta}
Combinar las dos pruebas en varias versiones del viento. Las cuatro combinaciones posibles tienen una lectura: estacionaria (ADF rechaza, KPSS no), no estacionaria (al revés), contradicción (las dos rechazan) o datos insuficientes (ninguna rechaza).
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| ADF | `regression="c"`, `autolag="AIC"` | La especificación con media. |
| KPSS | `regression="c"`, `nlags="auto"` | La misma hipótesis de estacionariedad alrededor de una media. |
| nivel | 5% | El nivel de significancia habitual. |
@@ Código
```python
def conjunta(s):
    a = adfuller(s, regression="c", autolag="AIC")[1]
    with _w.catch_warnings():
        _w.simplefilter("ignore")
        k = kpss(s, regression="c", nlags="auto")[1]
    if a < 0.05 and k >= 0.05:
        lectura = "estacionaria"
    elif a >= 0.05 and k < 0.05:
        lectura = "no estacionaria"
    elif a < 0.05 and k < 0.05:
        lectura = "contradicción"
    else:
        lectura = "no concluyente"
    return a, k, lectura

tab_conj = pd.DataFrame({k: dict(zip(["p ADF", "p KPSS", "lectura"], conjunta(s))) for k, (s, _) in VERSIONES.items()}).T
print(tab_conj.to_string())
```
@@ Resultado
```python oculto
COL_LECT = {"estacionaria": "elegido", "no estacionaria": "descartado", "contradicción": "reserva", "no concluyente": ""}
tabla("u1-conjunta", ["versión", "p-value ADF", "p-value KPSS", "lectura"],
      [[k, f"{r['p ADF']:.2e}", ("< 0.01" if r["p KPSS"] <= 0.01 else ("> 0.10" if r["p KPSS"] >= 0.1 else f"{r['p KPSS']:.3f}")), r["lectura"]] for k, r in tab_conj.iterrows()],
      [COL_LECT[r["lectura"]] for _, r in tab_conj.iterrows()], titulo="ADF y KPSS sobre seis versiones del viento",
      nota="Verde: estacionaria. Amarillo: las dos pruebas rechazan (contradicción).")
```
@widget lab-tabla id=u1-conjunta
@@ Lectura
- El **viento horario** da una **contradicción**: ADF rechaza la raíz unitaria y KPSS rechaza la estacionariedad. Es el caso típico de una serie **estacionaria con memoria larga o con cambios de nivel**: no es un paseo aleatorio (ADF), pero tampoco oscila alrededor de una media fija a escala de meses (KPSS).
- **∇y**, **∇<sub>24</sub>y** y el **residuo de STL** son estacionarios según las dos pruebas.
- El **viento diario** sale estacionario (KPSS con p = {{=tab_conj.loc['viento diario', 'p KPSS']|.3f}}) y su diferencia da una contradicción leve: diferenciar el diario sobra.
@@ Decisión
✅ La lectura del viento horario es **"estacionaria alrededor de un nivel que cambia con la temporada"**. Para la Unidad II deja dos caminos: modelar el nivel (d = 0, con un modelo que regrese a la media) o diferenciar (d = 1). Se probarán los dos.
:::

:::pastilla azul | Aplicar · Las pruebas por tramos de 30 días | u1:laboratorio u1:rupturas {#u1-tramos}
Aplicar ADF y KPSS a cada bloque de 30 días por separado. Si en cada tramo corto la serie parece estacionaria, la "no estacionariedad" del año completo viene de cambios **entre** tramos (la temporada), no de una raíz unitaria.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| tramos | 12 bloques de 720 horas | Del tamaño de un mes. |
| pruebas | ADF y KPSS con constante | Las mismas que en la lectura conjunta. |
@@ Código
```python
filas_tr = []
for b, s in y.groupby(bloque):
    if len(s) < 700:
        continue
    a, k, l = conjunta(s)
    filas_tr.append({"inicio": s.index[0], "p ADF": a, "p KPSS": k, "lectura": l})
tramos = pd.DataFrame(filas_tr)
print(tramos.assign(inicio=tramos["inicio"].dt.strftime("%d/%m")).round(4).to_string(index=False))
print("\nLecturas:", tramos["lectura"].value_counts().to_dict())
```
@@ Resultado
```python oculto
grafica("u1-tramos", [barras(tramos["inicio"].dt.strftime("%d %b"), tramos["p ADF"], "p-value ADF", "lav"),
                      barras(tramos["inicio"].dt.strftime("%d %b"), tramos["p KPSS"], "p-value KPSS", "dur")],
        alto=270, barmode="group", title={"text": "p-values de ADF y KPSS en cada tramo de 30 días"}, yaxis={"title": {"text": "p-value"}, "range": [0, 0.12]},
        shapes=[hline(0.05, "rojo", "dash")])
```
@widget lab-graf id=u1-tramos
@@ Lectura
- En **6 de 12** tramos la lectura es "estacionaria"; en los demás hay contradicciones o "no estacionaria", sobre todo de mayo a octubre.
- Dentro de un mes, KPSS rechaza menos que en el año completo: buena parte de la no estacionariedad anual es el **cambio de nivel entre temporadas**.
- Los tramos de mayo a septiembre, con menos viento y más ciclo diario, son los más difíciles para las pruebas: hay episodios largos dentro del propio mes.
@@ Decisión
🔵 Las pruebas por tramos confirman la lectura conjunta: el viento es **localmente** estacionario, con un nivel que cambia de un mes a otro.
:::

:::pastilla amarillo | Aplicar · Rupturas estructurales: Zivot–Andrews, Chow y CUSUM | u1:pruebas-ruptura u1:rupturas {#u1-rupturas}
Buscar **cambios estructurales** en el nivel del viento diario. La ADF puede confundir una ruptura con una raíz unitaria. **Zivot–Andrews** es una ADF que permite un cambio de media en una fecha desconocida; **Chow** prueba un cambio en una fecha dada; **CUSUM** acumula los residuos y detecta si se alejan de cero.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `zivot_andrews(…, regression="c")` | cambio en la media | $H_0$: raíz unitaria sin ruptura. |
| Chow | en la fecha que encuentra Zivot–Andrews | F para "misma media antes y después". |
| `breaks_cusumolsresid` | CUSUM de los residuos de una media constante | $H_0$: no hay cambio estructural. |
@@ Código
```python
from statsmodels.tsa.stattools import zivot_andrews
from statsmodels.stats.diagnostic import breaks_cusumolsresid
from scipy import stats as _st
za = zivot_andrews(dia["mean"].values, regression="c", autolag="AIC")
fecha_za = dia.index[za[4]]
print(f"Zivot–Andrews: estadístico {za[0]:.3f}, p-value {za[1]:.4f}, ruptura el {fecha_za:%d/%m}")

antes, despues = dia["mean"][:fecha_za], dia["mean"][fecha_za:]
ssr_r = ((dia["mean"] - dia["mean"].mean()) ** 2).sum()
ssr_u = ((antes - antes.mean()) ** 2).sum() + ((despues - despues.mean()) ** 2).sum()
F_chow = ((ssr_r - ssr_u) / 1) / (ssr_u / (len(dia) - 2))
print(f"Chow en esa fecha: F = {F_chow:.1f}, p-value {_st.f.sf(F_chow, 1, len(dia) - 2):.2e} | media antes {antes.mean():.2f}, después {despues.mean():.2f}")

res_c = (dia["mean"] - dia["mean"].mean()).values
cus = breaks_cusumolsresid(res_c, ddof=1)
print(f"CUSUM: estadístico {cus[0]:.3f}, p-value {cus[1]:.4f}")
```
@@ Resultado
```python oculto
cusum_path = np.cumsum(res_c) / (res_c.std() * np.sqrt(len(res_c)))
grafica("u1-rupturas", [linea(dia.index, cusum_path.round(3), "CUSUM de los residuos", "lav", 2.4)],
        alto=270, showlegend=False, title={"text": "CUSUM del viento diario (líneas rojas: límites del 5%)"}, yaxis={"title": {"text": "suma acumulada estandarizada"}},
        shapes=[hline(1.36, "rojo", "dash"), hline(-1.36, "rojo", "dash"), vline(fecha_za.strftime("%Y-%m-%d"), "dur")])
```
@widget lab-graf id=u1-rupturas
@@ Lectura
- **Zivot–Andrews** rechaza la raíz unitaria aun permitiendo una ruptura (estadístico {{=za[0]|.2f}}), y ubica la ruptura más probable el **{{=fecha_larga(fecha_za)}}**.
- **Chow** en esa fecha confirma un cambio de media muy fuerte: de {{=antes.mean()|.1f}} m/s antes a {{=despues.mean()|.1f}} después (F = {{=F_chow|.0f}}).
- **CUSUM** se sale de los límites del 5% durante meses: la media no es constante en el año.
@@ Decisión
🟡 Hay un **cambio estructural** a fines de octubre: la entrada de la temporada de nortes. Coincide casi con el inicio de la **prueba** (20 de octubre). Los modelos se elegirán con datos de antes del cambio y se evaluarán después: hay que tenerlo presente al final.
:::

:::pastilla verde | Aplicar · Prueba de tendencia de Mann–Kendall | u1:prueba-tendencia {#u1-mann-kendall}
Probar si hay una **tendencia monótona** (siempre sube o siempre baja) con **Mann–Kendall**, que no supone normalidad: cuenta cuántos pares de datos crecen contra cuántos decrecen. Su pendiente asociada es la de **Theil–Sen** (la mediana de las pendientes entre pares).
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `kendalltau(t, y)` | τ de Kendall | Mann–Kendall es la prueba de τ entre el tiempo y la serie. |
| `theilslopes` | pendiente robusta | Cuánto cambia la serie por unidad de tiempo. |
| escalas | diaria, semanal y mensual | La autocorrelación diaria infla la significancia; los promedios semanales y mensuales lo reducen. |
@@ Código
```python
filas_mk = []
for nombre, s in {"diaria": dia["mean"], "semanal": y.resample("W").mean(), "mensual": y.resample("MS").mean()}.items():
    tt = np.arange(len(s))
    tau, p_mk = _st.kendalltau(tt, s.values)
    pend = _st.theilslopes(s.values, tt)[0]
    filas_mk.append({"escala": nombre, "n": len(s), "τ": tau, "p-value": p_mk, "pendiente por año": pend * len(s)})
tab_mk = pd.DataFrame(filas_mk).set_index("escala")
print(tab_mk.round(4).to_string())
```
@@ Lectura
- Mann–Kendall **no encuentra tendencia monótona** en ninguna escala (p = {{=tab_mk.loc['diaria', 'p-value']|.2f}} con datos diarios y {{=tab_mk.loc['mensual', 'p-value']|.2f}} con mensuales).
- La pendiente de Theil–Sen es de unos {{=tab_mk.loc['diaria', 'pendiente por año']|.1f}} m/s por año, pero no es significativa: el viento baja de enero a mayo y vuelve a subir de octubre a diciembre.
@@ Decisión
✅ No hay tendencia: lo que cambia es la temporada, que sube y baja. Coincide con la regresión de tendencia (R² casi cero de la recta).
:::

:::pastilla amarillo | Aplicar · ¿La varianza es constante? Levene, Breusch–Pagan y la ACF por tramos | u1:pruebas-varianza {#u1-homoced}
Probar la tercera condición de la estacionariedad: varianza constante (**homocedasticidad**). **Levene** compara la dispersión entre grupos (los meses); **Breusch–Pagan** prueba si el cuadrado del residuo depende de una variable (el nivel). Se usa el residuo de STL para no mezclar la varianza con los cambios de nivel.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `levene(*meses)` | 12 grupos | $H_0$: todos los meses tienen la misma varianza. |
| `het_breuschpagan(e², [1, nivel])` | nivel = tendencia de STL | $H_0$: la varianza no depende del nivel. |
| ACF por trimestre | r<sub>1</sub> del residuo | La autocorrelación también debe ser estable. |
@@ Código
```python
from statsmodels.stats.diagnostic import het_breuschpagan
import statsmodels.api as sm
res_stl = stl.resid
lev = _st.levene(*[res_stl[res_stl.index.month == m].values for m in range(1, 13)])
print(f"Levene entre meses (residuo de STL): estadístico {lev.statistic:.1f}, p-value {lev.pvalue:.2e}")
bp = het_breuschpagan(res_stl.values, sm.add_constant(stl.trend.values))
print(f"Breusch–Pagan contra el nivel: LM = {bp[0]:.1f}, p-value {bp[1]:.2e}")
sd_mes = res_stl.groupby(res_stl.index.month).std()
print(f"Desviación del residuo por mes: de {sd_mes.min():.2f} a {sd_mes.max():.2f}")
r1_trim = res_stl.groupby(res_stl.index.quarter).apply(lambda s: s.autocorr(1))
print("r_1 del residuo por trimestre:", r1_trim.round(3).to_dict())
niv_bins = pd.cut(stl.trend, [0, 4, 7, 10, 13, 16, 30])
sd_niv = res_stl.groupby(niv_bins, observed=True).std()
print("Desviación del residuo por nivel:", {str(k): round(v, 2) for k, v in sd_niv.items()})
```
@@ Resultado
```python oculto
grafica("u1-homoced", [barras(MESES, sd_mes.values, "desviación del residuo", "lav")],
        alto=250, showlegend=False, title={"text": "Desviación estándar del residuo de STL por mes"}, yaxis={"title": {"text": "m/s"}})
```
@widget lab-graf id=u1-homoced
@@ Lectura
- **Levene** rechaza con fuerza que los meses tengan la misma varianza del residuo (p = {{=lev.pvalue|.0e}}): la desviación va de {{=sd_mes.min()|.2f}} a {{=sd_mes.max()|.2f}} m/s según el mes.
- **Breusch–Pagan** rechaza que la varianza sea independiente del nivel: con viento de menos de 4 m/s el residuo tiene desviación de {{=sd_niv.iloc[0]|.2f}} y con más de 16, de {{=sd_niv.iloc[-1]|.2f}}.
- La autocorrelación a 1 hora del residuo también cambia por trimestre (de {{=r1_trim.min()|.2f}} a {{=r1_trim.max()|.2f}}).
@@ Decisión
🟡 La varianza **no es constante**: crece con el nivel y cambia con la temporada. Es lo que la Unidad II atiende con Box–Cox (varianza ligada al nivel) y con ARCH (varianza que cambia en el tiempo).
:::

:::pastilla verde | Aplicar · Todas las pruebas en una tabla | u1:mapa-pruebas {#u1-mapa-pruebas}
Reunir los resultados de todas las pruebas de la Unidad I sobre el viento: qué hipótesis prueba cada una, qué salió y qué significa.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| nivel | 5% | El mismo para todas. |
@@ Código
```python
mapa_pruebas = [
    ["ADF (con constante)", "H₀: raíz unitaria", f"p = {tab_adf.loc['c', 'p-value']:.1e}", "rechaza: no hay raíz unitaria"],
    ["KPSS (con constante)", "H₀: estacionaria", "p < 0.01" if tab_kpss.loc["c", "p-value"] <= 0.01 else f"p = {tab_kpss.loc['c', 'p-value']:.3f}", "rechaza: no es estacionaria alrededor de una media"],
    ["Zivot–Andrews (diaria)", "H₀: raíz unitaria sin ruptura", f"p = {za[1]:.3f}", f"ruptura más probable el {fecha_za:%d/%m}"],
    ["Chow (en esa fecha)", "H₀: misma media antes y después", f"p = {_st.f.sf(F_chow, 1, len(dia) - 2):.1e}", "rechaza: la media cambia"],
    ["CUSUM (diaria)", "H₀: sin cambio estructural", f"p = {cus[1]:.3f}", "rechaza" if cus[1] < 0.05 else "no rechaza"],
    ["Mann–Kendall (mensual)", "H₀: sin tendencia monótona", f"p = {tab_mk.loc['mensual', 'p-value']:.2f}", "no rechaza" if tab_mk.loc["mensual", "p-value"] >= 0.05 else "rechaza"],
    ["Levene (meses)", "H₀: misma varianza", f"p = {lev.pvalue:.1e}", "rechaza: la varianza cambia"],
    ["Breusch–Pagan (nivel)", "H₀: varianza sin relación con el nivel", f"p = {bp[1]:.1e}", "rechaza" if bp[1] < 0.05 else "no rechaza"],
]
for f in mapa_pruebas:
    print(" | ".join(f))
```
@@ Resultado
```python oculto
tabla("u1-mapa-pruebas", ["prueba", "hipótesis nula", "resultado", "lectura"], mapa_pruebas, titulo="Las pruebas de la Unidad I sobre el viento horario de MV01")
```
@widget lab-tabla id=u1-mapa-pruebas
@@ Lectura
- La serie **no tiene raíz unitaria** (ADF, Zivot–Andrews) ni **tendencia monótona** (Mann–Kendall).
- Pero **no es estacionaria** alrededor de una media fija (KPSS) porque su nivel **cambia** con la temporada (Chow, CUSUM, con una ruptura a fines de octubre).
- Y su **varianza no es constante** (Levene, Breusch–Pagan).
@@ Decisión
✅ El diagnóstico de la Unidad I: un proceso que regresa a su nivel, con un nivel que cambia de temporada a temporada y una varianza que crece con el nivel. Falta medir su memoria con la ACF y la PACF.
:::
