## 🏗️ Fase 5 · Modelos ARMA, SARIMA y ARIMA (Unidad II) {#fase-modelos}
@mapa El AR(2) de Yule, la búsqueda por AIC y BIC, el AR(9), sus raíces, y los intentos con estacionalidad, con d = 1 y con AutoARIMA.

:::pastilla amarillo | Aplicar · El AR(2) de Yule | u2:ar2-complejas u2:ar2-triangulo u2:raices u2:lb-residuos
Ajustar el modelo clásico (suposición **S4**): un AR(2) con raíces complejas genera oscilaciones amortiguadas, y su periodo se puede calcular de los coeficientes. Si el AR(2) basta, sus residuos serán ruido blanco.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `ARIMA(z_tr, order=(2, 0, 0))` | p = 2, d = 0, q = 0 | Lo que sugirió la PACF (paso 18) y lo que decidió el paso 17 (sin diferenciar). |
| `trend` (por omisión `"c"`) | constante | La media de √y no es cero. |
| periodo | 2π / arccos(φ₁ / (2√−φ₂)) | Fórmula del AR(2) con raíces complejas (φ₁² + 4φ₂ < 0). |
| `model_df=2` | grados de libertad | Ljung–Box sobre residuos descuenta los 2 parámetros AR. |
@@ Código
```python
from statsmodels.tsa.arima.model import ARIMA

ar2 = ARIMA(z_tr, order=(2, 0, 0)).fit()
print(ar2.summary().tables[1])
phi1, phi2 = ar2.params["ar.L1"], ar2.params["ar.L2"]
discriminante = phi1 ** 2 + 4 * phi2
amortiguamiento = np.sqrt(-phi2)
periodo_ar2 = 2 * np.pi / np.arccos(phi1 / (2 * amortiguamiento))
print(f"φ₁² + 4φ₂ = {discriminante:.3f}  →  raíces {'complejas' if discriminante < 0 else 'reales'}")
print(f"Periodo implícito = {periodo_ar2:.2f} años | amortiguamiento por año = {amortiguamiento:.3f}")

lb_ar2 = acorr_ljungbox(ar2.resid, lags=[10, 20], model_df=2)
print(lb_ar2.round(4).to_string())
pron_ar2 = ar2.forecast(len(y_te)) ** 2
print(f"MAE en la prueba: {metricas(y_te, pron_ar2)['MAE']:.2f}")
```
@@ Resultado
```python oculto
grafica("lab-ar2", [linea(y["1940":"1978"].index.year, y["1940":"1978"], "entrenamiento", "osc", 1.3),
                    puntos(y_te.index.year, y_te, "prueba (real)", "menta", 7),
                    linea(y_te.index.year, pron_ref_y["SeasonalNaive"], "ingenuo estacional (la vara)", "rosa", 1.6, "dot"),
                    linea(y_te.index.year, pron_ar2, "AR(2)", "lav", 2.4)],
        alto=320, title={"text": "AR(2): el ciclo se amortigua hasta el promedio"}, xaxis={"title": {"text": "año"}})
```
@widget lab-graf id=lab-ar2
@@ Lectura
- **φ₁ = {{=phi1|.3f}}, φ₂ = {{=phi2|.3f}}**, los dos muy significativos. El discriminante φ₁² + 4φ₂ = {{=discriminante|.3f}} es negativo: **raíces complejas**, es decir, un ciclo.
- **El periodo implícito es {{=periodo_ar2|.2f}} años.** Sin decirle nada sobre el 11, el modelo lo encontró en dos números. Es el resultado que hizo famoso a Yule en 1927.
- El amortiguamiento por año es {{=amortiguamiento|.3f}}: la parte determinista del ciclo se reduce a {{=amortiguamiento ** 11|.2f}} de su tamaño en un ciclo. Los choques aleatorios son los que mantienen vivo el ciclo. Por eso el pronóstico (lila) hace un ciclo y medio y luego **se apaga** hacia el promedio.
- **Ljung–Box rechaza** (p = {{=lb_ar2['lb_pvalue'].iloc[0]|.4f}} con 10 rezagos): queda autocorrelación en los residuos. Y el MAE en la prueba es **{{=metricas(y_te, pron_ar2)['MAE']|.2f}}**, **peor** que el ingenuo estacional ({{=tab_ref.loc['SeasonalNaive', 'MAE']|.2f}}).
@@ Decisión
🟡 El AR(2) **explica** el ciclo (su periodo) pero **no pronostica** suficientemente bien, y sus residuos tienen estructura. La PACF del paso 18 ya advertía rezagos significativos hasta el 9. En lugar de probar órdenes a mano, el siguiente paso hace una **búsqueda sistemática** de ARMA(p, q) con AIC y BIC.
:::

:::pastilla azul | Aplicar · Búsqueda de órdenes ARMA(p, q) con AIC y BIC | u2:aic-bic u2:rejilla u2:penalizacion
Comparar todos los ARMA(p, q) con p de 0 a 10 y q de 0 a 3 con criterios de información: el **AIC** premia el ajuste con una penalización suave; el **BIC** penaliza más los parámetros y prefiere modelos pequeños.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| p = 0…10, q = 0…3 | 44 modelos | p hasta 10 cubre lo que sugirió la PACF; q hasta 3 porque la ACF no se corta (no hay indicios de un MA puro). |
| `warnings.simplefilter("ignore")` | — | En una rejilla, algunos modelos sobrados no convergen del todo y statsmodels avisa. Se silencia **solo durante la búsqueda**; el modelo elegido se revisará aparte. |
| mismo `d = 0` | — | Los AIC solo son comparables entre modelos con la misma diferenciación y los mismos datos. |
@@ Código
```python
import itertools

filas = []
with warnings.catch_warnings():
    warnings.simplefilter("ignore")
    for p, q in itertools.product(range(11), range(4)):
        m = ARIMA(z_tr, order=(p, 0, q)).fit()
        filas.append({"p": p, "q": q, "AIC": m.aic, "BIC": m.bic})
rejilla = pd.DataFrame(filas)
print("Los 5 mejores por AIC:")
print(rejilla.nsmallest(5, "AIC").round(1).to_string(index=False))
print("\nLos 5 mejores por BIC:")
print(rejilla.nsmallest(5, "BIC").round(1).to_string(index=False))
```
@@ Resultado
```python oculto
matriz = rejilla.pivot(index="q", columns="p", values="AIC")
grafica("lab-rejilla", [{"type": "heatmap", "z": [[None if pd.isna(v) else float(v) for v in fila] for fila in matriz.values],
                         "x": [int(c) for c in matriz.columns], "y": [int(i) for i in matriz.index],
                         "colorscale": [[0, "#3f8a39"], [0.15, "#bfe6b8"], [0.5, "#fff4c2"], [1, "#f6b1b1"]],
                         "colorbar": {"title": {"text": "AIC"}}, "hovertemplate": "ARMA(%{x}, %{y})<br>AIC = %{z:.1f}<extra></extra>"}],
        alto=270, title={"text": "AIC de cada ARMA(p, q): más verde = mejor"}, xaxis={"title": {"text": "p (orden AR)"}, "dtick": 1},
        yaxis={"title": {"text": "q (orden MA)"}, "dtick": 1})
```
@widget lab-graf id=lab-rejilla
@@ Lectura
- **AR(9)**, es decir ARMA(9, 0), gana con **los dos criterios**: AIC = {{=rejilla.set_index(['p', 'q']).loc[(9, 0), 'AIC']|.1f}} y BIC = {{=rejilla.set_index(['p', 'q']).loc[(9, 0), 'BIC']|.1f}}. Que el BIC, mucho más estricto, también lo elija es una señal fuerte.
- El AR(2) del paso anterior tiene AIC = {{=rejilla.set_index(['p', 'q']).loc[(2, 0), 'AIC']|.1f}}: unos {{=rejilla.set_index(['p', 'q']).loc[(2, 0), 'AIC'] - rejilla['AIC'].min()|.0f}} puntos peor. Una diferencia de más de 10 puntos de AIC ya se considera decisiva.
- En el mapa de calor, el AIC casi no cambia de p = 2 a p = 5, baja poco a poco desde p = 6 y da un **salto al llegar a p = 9** (de {{=rejilla.set_index(['p', 'q']).loc[(8, 0), 'AIC']|.1f}} a {{=rejilla.set_index(['p', 'q']).loc[(9, 0), 'AIC']|.1f}}). Los rezagos intermedios, junto con el 9, capturan la forma **asimétrica** del ciclo solar (sube más rápido de lo que baja).
- Agregar términos MA a p = 9 no mejora: ARMA(9, 1) y (10, 0) quedan prácticamente empatados, pero con un parámetro más.
@@ Decisión
✅ El candidato principal es **AR(9)**. El siguiente paso lo ajusta, revisa sus coeficientes y comprueba con Ljung–Box que sus residuos ya sean ruido blanco, la condición que el AR(2) no cumplió.
:::

:::pastilla verde | Aplicar · Ajustar el AR(9) y revisar sus residuos | u2:summary-coef u2:lb-residuos u2:diagnostico
Ajustar el modelo elegido por AIC y BIC y verificar el primer requisito del diagnóstico: **residuos sin autocorrelación**.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `order=(9, 0, 0)` | AR(9) | El ganador de la rejilla. |
| `lags=[15, 22], model_df=9` | — | Con 9 parámetros, el número de rezagos debe ser mayor que 9 para que queden grados de libertad; 22 cubre dos ciclos. |
@@ Código
```python
ar9 = ARIMA(z_tr, order=(9, 0, 0)).fit()
coef_ar9 = pd.DataFrame({"coef": ar9.params, "p": ar9.pvalues}).drop("sigma2")
print(coef_ar9.round(3).to_string())
lb_ar9 = acorr_ljungbox(ar9.resid, lags=[15, 22], model_df=9)
print(lb_ar9.round(4).to_string())
pron_ar9 = ar9.forecast(len(y_te)) ** 2
print(f"MAE en la prueba: {metricas(y_te, pron_ar9)['MAE']:.2f}  (vara: ingenuo estacional {tab_ref.loc['SeasonalNaive', 'MAE']:.2f})")
```
@@ Resultado
```python oculto
grafica("lab-ar9-acf", correlograma(acf(ar9.resid, nlags=25), len(z_tr), "ACF de los residuos"), alto=240,
        title={"text": "ACF de los residuos del AR(9): dentro de la banda"}, showlegend=False,
        xaxis={"title": {"text": "rezago (años)"}}, yaxis={"range": [-0.5, 0.5]})
grafica("lab-ar9", [linea(y["1940":"1978"].index.year, y["1940":"1978"], "entrenamiento", "osc", 1.3),
                    puntos(y_te.index.year, y_te, "prueba (real)", "menta", 7),
                    linea(y_te.index.year, pron_ref_y["SeasonalNaive"], "ingenuo estacional", "rosa", 1.6, "dot"),
                    linea(y_te.index.year, pron_ar2, "AR(2)", "gris", 1.4),
                    linea(y_te.index.year, pron_ar9, "AR(9)", "lav", 2.6)],
        alto=320, title={"text": "AR(9): sostiene el ciclo durante toda la prueba"}, xaxis={"title": {"text": "año"}})
```
@widget lab-graf id=lab-ar9-acf
@widget lab-graf id=lab-ar9
@@ Lectura
- Los coeficientes de los rezagos 1, 2 y 9 son los más significativos (p < 0.001); los de 4, 5 y 8 también lo son al 5%. Los intermedios afinan la forma del ciclo.
- **Ljung–Box ya no rechaza**: p = {{=lb_ar9['lb_pvalue'].iloc[0]|.3f}} con 15 rezagos y {{=lb_ar9['lb_pvalue'].iloc[1]|.3f}} con 22. La ACF de los residuos queda dentro de la banda. El AR(9) captura la dependencia que el AR(2) dejaba.
- En la prueba, el AR(9) **le gana a la vara**: MAE de **{{=metricas(y_te, pron_ar9)['MAE']|.2f}}** contra {{=tab_ref.loc['SeasonalNaive', 'MAE']|.2f}} del ingenuo estacional y {{=metricas(y_te, pron_ar2)['MAE']|.2f}} del AR(2). En la gráfica mantiene el ciclo durante los 30 años, en lugar de apagarse como el AR(2). Acierta el máximo de {{=pron_ar9['1975':'1985'].idxmax()}} y se atrasa un poco en los siguientes (pronostica {{=pron_ar9['1985':'1995'].idxmax()}} y {{=pron_ar9['1995':'2008'].idxmax()}}; los reales fueron {{=y['1985':'1995'].idxmax()}} y {{=y['1995':'2005'].idxmax()}}).
@@ Decisión
✅ El AR(9) cumple el primer criterio de éxito en esta prueba. Pero un modelo con 9 coeficientes es difícil de interpretar. El siguiente paso usa sus **raíces**, como se hizo con el AR(2), para ver qué ciclos contiene.
:::

:::pastilla azul | Aplicar · Las raíces del AR(9): qué ciclos contiene | u2:raices u2:polinomios u3:espectro-ar2
Traducir los 9 coeficientes a algo interpretable: cada par de **raíces complejas** del polinomio AR es un ciclo con su periodo y su persistencia.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `ar9.arroots` | 9 raíces | Raíces de 1 − φ₁L − … − φ₉L⁹. Todas fuera del círculo unitario (\|raíz\| > 1) significa que el modelo es estacionario. |
| periodo | 2π / \|ángulo\| | El ángulo de la raíz es la frecuencia del ciclo que genera. |
| persistencia | 1 / \|raíz\| | Cuánto conserva el ciclo de un año al siguiente: cerca de 1, muy persistente. |
@@ Código
```python
raices = ar9.arroots
with np.errstate(divide="ignore"):                    # la raíz real tiene ángulo 0: periodo infinito
    periodos = 2 * np.pi / np.abs(np.angle(raices))
info_raices = pd.DataFrame({"módulo": np.abs(raices),
                            "periodo (años)": periodos,
                            "persistencia anual": 1 / np.abs(raices)})
info_raices = info_raices[np.angle(raices) >= 0].sort_values("periodo (años)", ascending=False)
print(info_raices.round(3).to_string(index=False))
print("¿Todas fuera del círculo unitario?", bool(np.all(np.abs(raices) > 1)))
```
@@ Resultado
```python oculto
th = np.linspace(0, 2 * np.pi, 200)
grafica("lab-raices", [linea(np.cos(th), np.sin(th), "círculo unitario", "gris", 1.4, "dash"),
                       puntos(raices.real, raices.imag, "raíces del AR(9)", "lav", 11,
                              text=[f"periodo {2 * np.pi / abs(np.angle(r)):.1f} años" if abs(np.angle(r)) > 1e-9 else "raíz real" for r in raices],
                              hovertemplate="%{text}<br>módulo %{customdata:.3f}<extra></extra>", customdata=[float(abs(r)) for r in raices])],
        alto=330, title={"text": "Raíces del polinomio AR(9)"}, xaxis={"title": {"text": "parte real"}, "scaleanchor": "y", "range": [-1.6, 1.6]},
        yaxis={"title": {"text": "parte imaginaria"}, "range": [-1.4, 1.4]})
```
@widget lab-graf id=lab-raices
@@ Lectura
- **Todas las raíces están fuera del círculo unitario**: el modelo es estacionario, coherente con la decisión d = 0.
- El par **más cercano al círculo** tiene periodo **{{=info_raices.iloc[1]['periodo (años)']|.1f}} años** y persistencia {{=info_raices.iloc[1]['persistencia anual']|.3f}}. Es el ciclo solar, y es **mucho más persistente** que en el AR(2) ({{=amortiguamiento|.3f}}): tras un ciclo completo conserva {{=info_raices.iloc[1]['persistencia anual'] ** 11|.2f}} de su tamaño, contra {{=amortiguamiento ** 11|.2f}} en el AR(2). Por eso el AR(9) sostiene el ciclo en el pronóstico.
- Los otros pares (periodos de {{=", ".join(f"{v:.1f}" for v in info_raices['periodo (años)'].iloc[2:])}} años) son casi exactamente la **mitad** y la **tercera parte** del ciclo principal ({{=info_raices.iloc[1]['periodo (años)'] / 2|.1f}} y {{=info_raices.iloc[1]['periodo (años)'] / 3|.1f}}): son **armónicos**. Sumados al ciclo principal, le dan su forma asimétrica (sube rápido, baja despacio). Una senoide pura no puede tener esa forma.
- La raíz real (periodo "infinito") representa la variación lenta del nivel.
@@ Decisión
El modelo tiene sentido físico. Ahora toca darle una oportunidad justa a las alternativas descartadas en la exploración. El siguiente paso prueba un **SARIMA con estacionalidad de 11**, la suposición S2 en su versión de modelo, por si un término estacional mejora al AR(9).
:::

:::pastilla rojo | Aplicar · SARIMA con estacionalidad de 11 años | u2:sarima u2:ar-estacional u2:comparabilidad
Comprobar si agregar un término **estacional de periodo 11** al AR(2) logra lo mismo que el AR(9) con menos parámetros. Es la versión de modelo de la suposición S2.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `seasonal_order=(1, 0, 0, 11)` | AR estacional | z_t depende de z_{t−11}: "este año se parece al de hace un ciclo". Mismos datos y mismo d que el AR(9), así que el AIC es comparable. |
| `seasonal_order=(0, 1, 1, 11)` | diferencia estacional | La receta tipo "aerolínea". Su AIC **no** es comparable (otra diferenciación); se compara con el MAE de la prueba. |
@@ Código
```python
with warnings.catch_warnings():
    warnings.simplefilter("ignore")
    sar = ARIMA(z_tr, order=(2, 0, 0), seasonal_order=(1, 0, 0, 11)).fit()
    sarima = ARIMA(z_tr, order=(2, 0, 0), seasonal_order=(0, 1, 1, 11)).fit()
pron_sar = sar.forecast(len(y_te)) ** 2
pron_sarima = sarima.forecast(len(y_te)) ** 2
print(f"AR(2)×SAR(1)₁₁        : AIC = {sar.aic:.1f}   MAE prueba = {metricas(y_te, pron_sar)['MAE']:.2f}   Φ₁ = {sar.params['ar.S.L11']:.3f}")
print(f"AR(2)×(0,1,1)₁₁       : AIC = {sarima.aic:.1f} (no comparable)   MAE prueba = {metricas(y_te, pron_sarima)['MAE']:.2f}")
print(f"AR(9) (referencia)    : AIC = {ar9.aic:.1f}   MAE prueba = {metricas(y_te, pron_ar9)['MAE']:.2f}")
```
@@ Resultado
```python oculto
grafica("lab-sarima", [puntos(y_te.index.year, y_te, "prueba (real)", "menta", 7),
                       linea(y_te.index.year, pron_ar9, "AR(9)", "lav", 2.4),
                       linea(y_te.index.year, pron_sar, "AR(2)×SAR(1)₁₁", "dur", 1.8),
                       linea(y_te.index.year, pron_sarima, "AR(2)×(0,1,1)₁₁", "rosa", 1.8, "dash")],
        alto=300, title={"text": "Los SARIMA de periodo 11 contra el AR(9)"}, xaxis={"title": {"text": "año"}})
```
@widget lab-graf id=lab-sarima
@@ Lectura
- El término estacional sí es significativo (Φ₁ = {{=sar.params['ar.S.L11']|.3f}}) y mejora al AR(2) solo (AIC {{=sar.aic|.1f}} contra {{=rejilla.set_index(['p', 'q']).loc[(2, 0), 'AIC']|.1f}}). Pero queda muy lejos del AR(9) (AIC {{=ar9.aic|.1f}}).
- En la prueba, los dos SARIMA (MAE {{=metricas(y_te, pron_sar)['MAE']|.2f}} y {{=metricas(y_te, pron_sarima)['MAE']|.2f}}) quedan peor que el AR(9) y que el propio ingenuo estacional.
- Es la misma lección del paso 13 con otra herramienta: un rezago **fijo** de 11 años apunta a veces a un máximo y a veces a una ladera del ciclo anterior. Los 9 rezagos del AR(9) le dan al modelo la flexibilidad para "buscar" la fase.
@@ Decisión
❌ La estacionalidad de periodo 11 queda descartada **también como modelo**. El siguiente paso le da su oportunidad a la otra suposición descartada, S3: modelos con **d = 1**, como si las pruebas del paso 15 hubieran tenido razón.
:::

:::pastilla rojo | Aplicar · Modelos con d = 1 (como si la serie no fuera estacionaria) | u2:arima u2:sobrediferenciar u2:arima-pronostico
Comprobar con pronósticos reales, no solo con pruebas de hipótesis, si diferenciar habría sido mejor. Si el paso 17 se equivocó, un ARIMA(p, 1, q) debería ganarle al AR(9).
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `(2, 1, 0)`, `(2, 1, 1)`, `(4, 1, 0)` | d = 1 | Variantes razonables sobre Δz: la dinámica del ciclo con distintos órdenes. |
| comparación | MAE en la prueba | Los AIC con d = 1 no son comparables con los de d = 0. |
@@ Código
```python
mae_d1 = {}
with warnings.catch_warnings():
    warnings.simplefilter("ignore")
    for orden in [(2, 1, 0), (2, 1, 1), (4, 1, 0)]:
        m = ARIMA(z_tr, order=orden).fit()
        mae_d1[orden] = metricas(y_te, m.forecast(len(y_te)) ** 2)["MAE"]
        if orden == (2, 1, 1):
            pron_211 = m.forecast(len(y_te)) ** 2
for orden, v in mae_d1.items():
    print(f"ARIMA{orden}: MAE en la prueba = {v:.2f}")
print(f"AR(9) con d = 0  : MAE en la prueba = {metricas(y_te, pron_ar9)['MAE']:.2f}")
```
@@ Resultado
```python oculto
grafica("lab-d1", [puntos(y_te.index.year, y_te, "prueba (real)", "menta", 7),
                   linea(y_te.index.year, pron_ar9, "AR(9), d = 0", "lav", 2.4),
                   linea(y_te.index.year, pron_211, "ARIMA(2,1,1)", "dur", 2)],
        alto=290, title={"text": "Con d = 1 el pronóstico pierde el ciclo"}, xaxis={"title": {"text": "año"}})
```
@widget lab-graf id=lab-d1
@@ Lectura
- Los tres modelos con d = 1 quedan **peor** que el AR(9): el mejor de ellos, ARIMA(2,1,1), tiene MAE {{=mae_d1[(2, 1, 1)]|.2f}}, y ARIMA(2,1,0) llega a {{=mae_d1[(2, 1, 0)]|.2f}}.
- En la gráfica se ve por qué: un modelo con d = 1 no tiene una media a la cual regresar. Su pronóstico se estaciona en un nivel que depende del último dato y el ciclo se desvanece, porque **la diferencia le quitó al modelo la información del nivel**.
@@ Decisión
❌ Confirmado con pronósticos: diferenciar empeora. Queda probar una última alternativa, la que muchos usarían de entrada: dejar que **AutoARIMA** de statsforecast elija el modelo solo.
:::

:::pastilla amarillo | Aplicar · AutoARIMA de statsforecast con sus opciones por omisión | u2:aic-bic u2:ref-statsforecast
Ver si una búsqueda automática llega por su cuenta al mismo modelo. Es la práctica habitual cuando hay muchas series, y conviene saber si se puede confiar en ella aquí.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `AutoARIMA(season_length=1)` | sin estacionalidad | Datos anuales; ya se descartó la estacionalidad de 11. |
| demás opciones | por omisión | Así la usaría alguien con prisa: búsqueda escalonada (`stepwise=True`) y criterio AICc. |
@@ Código
```python
from statsforecast.models import AutoARIMA

auto_def = StatsForecast(models=[AutoARIMA(season_length=1)], freq="YS")
auto_def.fit(df_tr)
arma_def = auto_def.fitted_[0][0].model_["arma"]        # (p, q, P, Q, s, d, D)
pron_auto_def = auto_def.predict(h=len(y_te))["AutoARIMA"].astype(float).pow(2).set_axis(y_te.index)
print(f"Modelo elegido: ARIMA({arma_def[0]}, {arma_def[5]}, {arma_def[1]})")
print(f"MAE en la prueba: {metricas(y_te, pron_auto_def)['MAE']:.2f}")
```
@@ Lectura
- AutoARIMA eligió **ARIMA({{=arma_def[0]}}, {{=arma_def[5]}}, {{=arma_def[1]}})**, no el AR(9). Su MAE en la prueba es {{=metricas(y_te, pron_auto_def)['MAE']|.2f}}, cerca del AR(2) y peor que el ingenuo estacional.
- No es que el AR(9) sea peor según su criterio. AutoARIMA tiene por omisión un **tope en el orden total**, `max_order=5` (p + q + P + Q ≤ 5), heredado de `auto.arima` de R. **El AR(9) estaba fuera del espacio de búsqueda.**
- Por eso el resultado queda en amarillo: la herramienta funciona, pero sus valores por omisión están pensados para series mensuales típicas, no para un ciclo largo con estructura en el rezago 9.
@@ Decisión
🟡 El siguiente paso repite AutoARIMA **ampliando la búsqueda**: `max_p=10`, `max_q=3`, `max_order=13` y búsqueda exhaustiva (`stepwise=False`). Si llega al AR(9), la elección quedará confirmada por dos caminos independientes.
:::

:::pastilla verde | Aplicar · AutoARIMA con la búsqueda ampliada | u2:aic-bic
Confirmar, con un buscador automático y otro criterio (AICc), que el AR(9) es el mejor modelo **dentro de un espacio de búsqueda suficientemente grande**.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `max_p=10, max_q=3` | — | El mismo espacio de la rejilla del paso 24. |
| `max_order=13` | p + q ≤ 13 | Quita el tope de 5. |
| `stepwise=False` | búsqueda exhaustiva | La búsqueda escalonada puede quedarse en un óptimo local; con esta serie corta, revisar todos es barato. |
@@ Código
```python
auto_amp = StatsForecast(models=[AutoARIMA(season_length=1, max_p=10, max_q=3, max_order=13, stepwise=False)], freq="YS")
auto_amp.fit(df_tr)
arma_amp = auto_amp.fitted_[0][0].model_["arma"]
pron_auto_amp = auto_amp.predict(h=len(y_te))["AutoARIMA"].astype(float).pow(2).set_axis(y_te.index)
print(f"Modelo elegido: ARIMA({arma_amp[0]}, {arma_amp[5]}, {arma_amp[1]})")
print(f"MAE en la prueba: {metricas(y_te, pron_auto_amp)['MAE']:.2f}")
```
@@ Lectura
- Con la búsqueda ampliada, AutoARIMA elige **ARIMA({{=arma_amp[0]}}, {{=arma_amp[5]}}, {{=arma_amp[1]}})**, el mismo AR(9) del paso 24, con MAE {{=metricas(y_te, pron_auto_amp)['MAE']|.2f}} en la prueba.
- Tres caminos (AIC, BIC y AICc, búsqueda en rejilla de statsmodels y búsqueda exhaustiva de statsforecast) llegan al mismo modelo. Pequeñas diferencias en los coeficientes vienen de que cada librería estima de forma un poco distinta.
@@ Decisión
✅ El **AR(9)** queda como modelo principal. Antes de confiar en sus **intervalos**, el siguiente paso revisa los otros supuestos del diagnóstico: normalidad y varianza constante de los residuos.
:::

:::pastilla amarillo | Aplicar · Diagnóstico completo de los residuos del AR(9) | u2:jarque-bera u2:arch-lm u2:heterocedasticidad u2:residuos-que
Revisar los supuestos que afectan a los **intervalos de predicción**: residuos normales (Jarque–Bera) y varianza constante (prueba ARCH-LM y relación con el nivel).
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `stats.jarque_bera` | asimetría + curtosis | H₀: los residuos son normales. |
| `het_arch(…, nlags=5)` | 5 rezagos | H₀: no hay efectos ARCH (la varianza no depende de los choques recientes). |
| corr(\|e\|, ajustado) | — | Si es positiva, los errores son más grandes cuando el nivel es alto: la transformación no bastó. |
| `resid[9:]` | sin los primeros 9 | Los primeros residuos de un AR(9) se calculan con información incompleta. |
@@ Código
```python
from statsmodels.stats.diagnostic import het_arch

e9 = ar9.resid.iloc[9:]
ajustado9 = (z_tr - ar9.resid).iloc[9:]
jb = stats.jarque_bera(e9)
arch = het_arch(e9, nlags=5)
print(f"Jarque–Bera: estadístico = {jb.statistic:.2f}, p = {jb.pvalue:.4f} | asimetría = {stats.skew(e9):.3f}, curtosis = {stats.kurtosis(e9):.3f}")
print(f"ARCH-LM (5 rezagos): p = {arch[1]:.4f}")
print(f"corr(|residuo|, valor ajustado) = {np.corrcoef(np.abs(e9), ajustado9)[0, 1]:.3f}")
```
@@ Resultado
```python oculto
cont_e, bord_e = np.histogram(e9, bins=24)
cen_e = (bord_e[:-1] + bord_e[1:]) / 2
dens = stats.norm.pdf(cen_e, e9.mean(), e9.std()) * len(e9) * (bord_e[1] - bord_e[0])
grafica("lab-ar9-hist", [barras(cen_e, cont_e, "residuos", "lav", width=float(bord_e[1] - bord_e[0]) * 0.92),
                         linea(cen_e, dens, "normal con la misma media y desviación", "rosa", 2.2)],
        alto=270, title={"text": "Histograma de los residuos del AR(9)"}, xaxis={"title": {"text": "residuo (unidades de √y)"}})
grafica("lab-ar9-res", [puntos(ajustado9, e9, "residuo contra valor ajustado", "cel", 5)], alto=270,
        title={"text": "¿Depende el tamaño del residuo del nivel?"}, showlegend=False,
        xaxis={"title": {"text": "valor ajustado (√y)"}}, yaxis={"title": {"text": "residuo"}})
```
@widget lab-graf id=lab-ar9-hist
@widget lab-graf id=lab-ar9-res
@@ Lectura
- **Jarque–Bera rechaza la normalidad** (p = {{=jb.pvalue|.4f}}): los residuos tienen asimetría {{=stats.skew(e9)|.3f}} y curtosis en exceso {{=stats.kurtosis(e9)|.3f}}. En el histograma, la cola derecha es más larga que la de la normal: hay choques positivos grandes (arranques de ciclo fuertes).
- **ARCH-LM rechaza** (p = {{=arch[1]|.4f}}): hay rachas de choques grandes. Es habitual en esta serie, porque los ciclos muy activos tienden a tener más variación entre años.
- La correlación entre el tamaño del residuo y el nivel es {{=np.corrcoef(np.abs(e9), ajustado9)[0, 1]|.3f}}, pequeña (sin transformar, este mismo modelo daría una correlación positiva). La raíz cuadrada **sí** eliminó la dependencia con el nivel; lo que queda es otra cosa (agrupamiento de choques).
- Ninguno de estos problemas afecta al **pronóstico puntual**, pero los intervalos normales podrían no tener exactamente la cobertura que prometen.
@@ Decisión
🟡 El AR(9) es adecuado para pronosticar, pero sus intervalos se tomarán con cautela. Se revisarán contra la realidad en el paso 35. Hasta aquí todo se ha comparado con **una sola** ventana de prueba. La Fase 6 hace la comparación definitiva con **validación cruzada con origen móvil**.
:::
