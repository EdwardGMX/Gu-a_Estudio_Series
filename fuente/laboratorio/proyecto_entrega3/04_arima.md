## 📏 Fase 3 · Estacionariedad, ACF/PACF y el ARIMA {#fase-arima}
@mapa ADF sobre el entrenamiento, la ACF y la PACF construidas rezago por rezago, el ARIMA(2,0,0) que sugieren y el ARIMA(1,1,2) que elige AutoARIMA.

:::pastilla verde | Aplicar · ADF: ¿hay que diferenciar? | u1:adf u1:salida-adf u1:diferenciacion {#arima-adf}
Probar si la serie de entrenamiento es estacionaria en niveles con la prueba de **Dickey–Fuller aumentada**. Su hipótesis nula es que hay **raíz unitaria** (la serie no regresa a un nivel); si se rechaza, no hace falta diferenciar ($d = 0$).
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| serie | `train['y']` | Solo el entrenamiento. |
| `d` | 0 | Primero en niveles; solo se diferencia si la prueba lo pide. |
| umbral | 0.05 | Nivel de significancia usual. |
@@ Código
```python
def prueba_diferenciacion(serie, d, titulo):
    serie = serie.dropna()
    for _ in range(d):
        serie = serie.diff()
    pval = adfuller(serie.dropna())[1]
    if pval < 0.05:
        print(f'{titulo}: estacionaria, p-value: {pval:.3g}')
    else:
        print(f'{titulo}: NO estacionaria, p-value: {pval:.3g}')
    return pval

p_adf = prueba_diferenciacion(train['y'], 0, "Entrenamiento en d=0")
```
@@ Resultado
```python oculto
media_tr = train['y'].mean()
grafica("arima-adf", [linea(train['ds'], train['y'], "entrenamiento", "lav", 1.4),
                      linea([train['ds'].iloc[0], train['ds'].iloc[-1]], [media_tr] * 2, "media", "rojo", 1.6, "dash")],
        alto=280, title={"text": "El entrenamiento cruza su media una y otra vez"}, yaxis={"title": {"text": "kWh/día"}})
```
@widget lab-graf id=arima-adf
@@ Lectura
- p-value = **{{=p_adf|.1e}}**, muchísimo menor que 0.05: se **rechaza** la raíz unitaria. La serie es estacionaria en niveles y $d = 0$.
- Tiene sentido físico: la energía depende del viento, que sube y baja pero siempre regresa a su nivel promedio; en la gráfica la serie cruza la media decenas de veces.
:::nota Detalle del notebook
La función original imprime "no se requiere diferenciar" aun cuando se le pasa `d=1` (es decir, cuando ya se diferenció). Aquí el mensaje solo dice si la serie probada es estacionaria.
:::
@@ Decisión
✅ $d = 0$. Siguiente: la ACF y la PACF para proponer $p$ y $q$.
:::

:::pastilla verde | Aplicar · La ACF y la PACF, rezago por rezago | u1:acf-pacf u1:correlograma u1:pacf u1:patrones u2:patrones2 {#arima-acf}
Medir cuánto se parece cada día a los días anteriores. La **ACF** en el rezago $k$ es la correlación entre $y_t$ y $y_{t-k}$; la **PACF** es esa misma relación después de quitar lo que ya explican los rezagos intermedios. Sus patrones dicen qué AR o MA proponer.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `LAGS` | 20 | Casi tres semanas: alcanza para ver un posible ciclo semanal (rezagos 7 y 14). |
| `alpha` | 0.05 | Bandas de 95 %: lo que queda dentro no es distinto de 0. |
@@ Código
```python
from statsmodels.tsa.stattools import acf, pacf
LAGS = 20
r_acf = acf(train['y'], nlags=LAGS)
r_pacf = pacf(train['y'], nlags=LAGS)
banda_acf = 1.96 / np.sqrt(len(train))
print("ACF :", np.round(r_acf[1:9], 2))
print("PACF:", np.round(r_pacf[1:9], 2))
print(f"Banda ±1.96/√n = ±{banda_acf:.3f}")
```
@@ Resultado
```python oculto
yv = train['y'].values
cuad, txts = [], []
for k in range(1, 9):
    x_, y_ = yv[:-k], yv[k:]
    m, b = np.polyfit(x_, y_, 1)
    xs = np.array([0, 56000])
    barras_k = {"type": "bar", "x": list(range(1, k + 1)), "y": _vals(r_acf[1:k + 1]), "name": "ACF hasta k",
                "marker": {"color": [PALETA["dur"] if abs(v) > banda_acf else PALETA["lav"] for v in r_acf[1:k + 1]]},
                "xaxis": "x2", "yaxis": "y2", "width": 0.6, "showlegend": False}
    cuad.append([{"x": _vals(x_), "y": _vals(y_), "mode": "markers", "name": f"(y<sub>t−{k}</sub>, y<sub>t</sub>)",
                  "marker": {"color": PALETA["lav"], "size": 5, "opacity": .45}, "showlegend": False},
                 {"x": _vals(xs), "y": _vals(m * xs + b), "mode": "lines", "name": "recta", "line": {"color": PALETA["rosa"], "width": 2.4}, "showlegend": False},
                 barras_k])
    lectura_k = ("muy fuerte: un día bueno casi siempre sigue a otro bueno" if k == 1 else
                 "la nube se abre: la memoria se va perdiendo" if k in (2, 3) else
                 "casi una nube redonda: poca relación" if k in (4, 5) else
                 "un pequeño repunte, pero no es un pico estacional claro")
    txts.append(f"<b>Rezago {k}</b>: cada punto es un día contra el de {k} día{'s' if k > 1 else ''} antes. "
                f"La correlación es <b>{r_acf[k]:.2f}</b>, {lectura_k}. La barra {k} de la derecha es ese número.")
banda_shape = {"type": "rect", "xref": "x2", "yref": "y2", "x0": 0.5, "x1": 8.5, "y0": -banda_acf, "y1": banda_acf,
               "fillcolor": "rgba(124,105,214,.13)", "line": {"width": 0}}
animacion("anim-rezagos", cuad, textos=txts, etiquetas=[f"k = {k}" for k in range(1, 9)], etiqueta="Rezago", vel=2000, alto=360,
          title={"text": "Cómo se construye la ACF: el día t contra el día t − k"},
          xaxis={"domain": [0, .52], "title": {"text": "y(t − k), kWh"}, "range": [-2000, 57000]},
          yaxis={"title": {"text": "y(t), kWh"}, "range": [-2000, 57000]},
          xaxis2={"domain": [.62, 1], "anchor": "y2", "range": [0.5, 8.5], "dtick": 1, "title": {"text": "rezago k"}},
          yaxis2={"anchor": "x2", "range": [-.3, 1], "title": {"text": "ACF"}}, shapes=[banda_shape])
k20 = list(range(1, LAGS + 1))
def _corr(v, eje):
    cols = [PALETA["dur"] if abs(x) > banda_acf else PALETA["lav"] for x in v]
    return {"type": "bar", "x": k20, "y": _vals(v), "marker": {"color": cols}, "width": .6, "xaxis": "x" if eje == 1 else "x2",
            "yaxis": "y" if eje == 1 else "y2", "showlegend": False, "hovertemplate": "k = %{x}<br>%{y:.3f}<extra></extra>"}
grafica("arima-correl", [_corr(r_acf[1:], 1), _corr(r_pacf[1:], 2)], alto=420,
        title={"text": "ACF (arriba) y PACF (abajo) del entrenamiento; en naranja las significativas"},
        yaxis={"domain": [.56, 1], "range": [-.35, 1], "title": {"text": "ACF"}}, yaxis2={"domain": [0, .44], "range": [-.35, 1], "title": {"text": "PACF"}},
        xaxis={"anchor": "y", "dtick": 1}, xaxis2={"anchor": "y2", "dtick": 1, "title": {"text": "rezago k"}},
        shapes=[{"type": "rect", "xref": "paper", "yref": y_, "x0": 0, "x1": 1, "y0": -banda_acf, "y1": banda_acf,
                 "fillcolor": "rgba(124,105,214,.13)", "line": {"width": 0}} for y_ in ("y", "y2")])
```
@widget lab-anim id=anim-rezagos
@widget lab-graf id=arima-correl
@@ Lectura
- La **ACF decae poco a poco**: {{=r_acf[1]|.2f}}, {{=r_acf[2]|.2f}}, {{=r_acf[3]|.2f}}… Es lo típico de un proceso autorregresivo: el efecto de un día se va diluyendo.
- La **PACF se corta**: es significativa en el rezago 1 ({{=r_pacf[1]|.2f}}) y en el 2 ({{=r_pacf[2]|.2f}}); después queda dentro de las bandas, salvo un valor marginal en el rezago 5.
- ACF que decae + PACF que se corta en 2 = el patrón de un **AR(2)**.
- En la ACF hay un pequeño repunte en los rezagos 6 a 8 (≈ {{=r_acf[7]|.2f}}), pero no es un pico aislado en el 7: no hay un ciclo semanal claro.
@@ Decisión
✅ Se propone un **ARIMA(2,0,0)** con constante (la serie tiene media distinta de cero).
:::

:::pastilla verde | Aplicar · ARIMA(2,0,0): los coeficientes y cómo pronostica | u2:ar-def u2:ar-media u2:arima-pronostico {#arima-200}
Ajustar el ARIMA(2,0,0) con `statsforecast` y ver qué hace al pronosticar: cada día es una combinación de los dos días anteriores, y conforme se aleja del último dato el pronóstico regresa a la media.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `order` | `(2, 0, 0)` | $p = 2$ por la PACF, $d = 0$ por la ADF, $q = 0$. |
| `include_constant` | `True` | La serie no tiene media cero; la constante es su nivel. |
| `freq` | `'D'` | Un dato por día. |
@@ Código
```python
sf = StatsForecast(models=[ARIMA(order=(2, 0, 0), alias='ARIMA(2,0,0)', include_constant=True)], freq='D')
sf.fit(train)

params = sf.fitted_[0][0].model_['coef']
for name, value in params.items():
    print(f"parametro {name:10}: {value:.4f}")
pron_ar = sf.predict(h=21)
```
@@ Resultado
```python oculto
phi1, phi2, mu_ar = params['ar1'], params['ar2'], params['intercept']
ult = train.tail(21)
hist_v = list(train['y'].values[-2:])
fechas_f = pron_ar['ds'].tolist()
vals_f = pron_ar['ARIMA(2,0,0)'].tolist()
cuad, txts = [], []
base_ar = [linea(ult['ds'], ult['y'], "últimos 21 días del entrenamiento", "osc", 2),
           linea([ult['ds'].iloc[0], fechas_f[-1]], [mu_ar] * 2, "media del modelo (μ)", "rojo", 1.4, "dash")]
previos = hist_v[:]
for h in range(1, 22):
    y1, y2 = previos[-1], previos[-2]
    cuad.append([linea([ult['ds'].iloc[-1]] + fechas_f[:h], [train['y'].iloc[-1]] + vals_f[:h], "pronóstico ARIMA(2,0,0)", "dur", 2.4, "dot",
                       mode="lines+markers", marker={"size": 7, "color": PALETA["dur"]})])
    if h <= 3:
        txts.append(f"<b>h = {h}</b>: ŷ = μ + {phi1:.2f}·(y<sub>t−1</sub> − μ) {phi2:+.2f}·(y<sub>t−2</sub> − μ) = "
                    f"{kwh(mu_ar)} + {phi1:.2f}·({kwh(y1 - mu_ar)}) {phi2:+.2f}·({kwh(y2 - mu_ar)}) = <b>{kwh(vals_f[h-1])}</b> kWh. "
                    + ("Usa los dos últimos días reales." if h == 1 else "Ya usa pronósticos en lugar de datos reales."))
    else:
        txts.append(f"<b>h = {h}</b>: {kwh(vals_f[h-1])} kWh, a {kwh(abs(vals_f[h-1] - mu_ar))} de la media. "
                    + ("Cada paso multiplica la distancia a la media por menos de 1: se va pegando a la línea roja." if h < 10
                       else "Prácticamente ya es la media: después de unos días el AR no tiene más que decir."))
    previos.append(vals_f[h - 1])
animacion("anim-ar2", cuad, base=base_ar, textos=txts, etiquetas=[f"h = {h}" for h in range(1, 22)], etiqueta="Días hacia adelante",
          vel=1100, pausas={0: 3500, 1: 3500, 2: 3500}, alto=330, title={"text": "El ARIMA(2,0,0) pronosticando desde el 19 de octubre"},
          yaxis={"title": {"text": "kWh/día"}})
```
@widget lab-anim id=anim-ar2
@@ Lectura
- $\phi_1 = $ {{=phi1|.2f}} y $\phi_2 = $ {{=phi2|.2f}}. Con ellos, la ACF teórica en el rezago 1 es $\phi_1 / (1 - \phi_2) = $ {{=phi1 / (1 - phi2)|.2f}}, igual a la observada ({{=r_acf[1]|.2f}}).
- El **intercepto** ({{=kwh(mu_ar)}} kWh) es la media del proceso: prácticamente la media del entrenamiento ({{=kwh(media_tr)}}). En `statsforecast` el intercepto de un ARIMA con constante es la media $\mu$, no la $c$ de $y_t = c + \phi_1 y_{t-1} + \phi_2 y_{t-2} + \varepsilon_t$.
- En la animación se ve el comportamiento clave: el primer pronóstico aprovecha el último día real, pero cada paso acerca el pronóstico a la media. Después de una semana ya es una línea plana.
@@ Decisión
✅ El ARIMA(2,0,0) queda listo. Ahora, qué propone AutoARIMA sin ayuda.
:::

:::pastilla amarillo | Aplicar · AutoARIMA elige un ARIMA(1,1,2) | u2:arima-def u2:aic-bic u2:sobrediferenciar u1:kpss {#arima-auto}
Dejar que **AutoARIMA** busque el modelo con menor AIC, permitiéndole también un ciclo de 7 días, y compararlo con el elegido a mano.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `season_length` | 7 | Le permite buscar términos estacionales semanales $(P, D, Q)_7$. |
| criterio | AIC (por defecto) | Elige entre muchos órdenes. |
| diferenciación | prueba **KPSS** (por defecto) | Así decide $d$ AutoARIMA de statsforecast. |
@@ Código
```python
sf_auto = StatsForecast(models=[AutoARIMA(season_length=7)], freq='D')
sf_auto.fit(train)

modelo_auto = sf_auto.fitted_[0][0].model_
p, q, P, Q, m, d, D = modelo_auto['arma']
print(f"AutoARIMA eligió: ARIMA({p},{d},{q})({P},{D},{Q})[{m}]")
print(f"AIC: {modelo_auto['aic']:.2f}")
for name, value in modelo_auto['coef'].items():
    print(f"parametro {name:10}: {value:.4f}")
pron_auto = sf_auto.predict(h=21)
```
@@ Resultado
```python oculto
grafica("arima-auto", [linea(ult['ds'], ult['y'], "últimos 21 días del entrenamiento", "osc", 2),
                       linea(pron_ar['ds'], pron_ar['ARIMA(2,0,0)'], "ARIMA(2,0,0): regresa a la media", "dur", 2.4, "dot"),
                       linea(pron_auto['ds'], pron_auto['AutoARIMA'], f"AutoARIMA ARIMA({p},{d},{q}): se queda en un nivel", "cel", 2.4, "dot"),
                       linea([ult['ds'].iloc[0], pron_ar['ds'].iloc[-1]], [mu_ar] * 2, "media", "rojo", 1.2, "dash")],
        alto=320, title={"text": "Los dos ARIMA pronosticando 21 días"}, yaxis={"title": {"text": "kWh/día"}})
```
@widget lab-graf id=arima-auto
@@ Lectura
- AutoARIMA eligió un **ARIMA({{=p}},{{=d}},{{=q}}) sin parte estacional** ($P = Q = 0$), aunque podía buscar un ciclo de 7 días.
- Eligió $d = 1$, al revés que la ADF, porque decide la diferenciación con **KPSS** (hipótesis nula: estacionaria). En el EDA de las entregas anteriores ADF y KPSS ya estaban en conflicto.
- Con $d = 1$ y **sin constante**, su pronóstico de largo plazo se queda en un **nivel fijo** (≈ {{=kwh(pron_auto['AutoARIMA'].iloc[-1])}} kWh) en vez de regresar a la media; el ARIMA(2,0,0) sí regresa.
:::nota Detalle del notebook
El notebook dice que esto **confirma** que no hay estacionalidad semanal. Es más preciso decir que es **consistente** con eso: que AutoARIMA no elija términos estacionales no prueba que no existan. Además, más adelante AutoARIMA se usa con su valor por defecto (`season_length=1`); como aquí eligió la parte estacional (0,0,0), el resultado es el mismo.
:::
@@ Decisión
🟡 Los dos ARIMA se comparan fuera de muestra en la fase 6; el d = 0 contra d = 1 lo decide el error de pronóstico.
:::
