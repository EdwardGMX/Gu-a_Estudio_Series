## ⚖️ Fase 3 · Estacionariedad y dependencia (Unidad I) {#fase-estacionariedad}
@mapa ADF y KPSS, la tentación de diferenciar, la sensibilidad de las pruebas a sus parámetros, ACF, PACF y Ljung–Box.

:::pastilla amarillo | Aplicar · Pruebas ADF y KPSS con sus opciones por omisión | u1:adf u1:kpss u1:conjunta
Decidir si √y es estacionaria. Se usan las **dos pruebas complementarias**: ADF tiene como hipótesis nula una raíz unitaria y KPSS, la estacionariedad. Si las dos apuntan al mismo lado, la conclusión es firme.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `adfuller(z)` | `regression="c"`, `autolag="AIC"` | Valores por omisión: constante sin tendencia (la serie no crece sin límite) y el número de rezagos lo elige el AIC. |
| `kpss(z)` | `regression="c"`, `nlags="auto"` | Estacionariedad alrededor de una media constante; el ancho de banda de Newey–West lo elige statsmodels. |
| nivel | 5% | El nivel convencional de la guía. |
@@ Código
```python
from statsmodels.tsa.stattools import adfuller, kpss

adf_def = adfuller(z)
kpss_def = kpss(z)
print(f"ADF : estadístico = {adf_def[0]:.3f}, p = {adf_def[1]:.4f}, rezagos usados = {adf_def[2]}")
print(f"KPSS: estadístico = {kpss_def[0]:.3f}, p = {kpss_def[1]:.4f}, rezagos usados = {kpss_def[2]}")
```
@@ Lectura
- **ADF: p = {{=adf_def[1]|.4f}}**. Por un pelo **no** se rechaza la raíz unitaria al 5%.
- **KPSS: p = {{=kpss_def[1]|.4f}}**. **Sí** se rechaza la estacionariedad al 5%.
- Leídas como manda la tabla de decisión conjunta, las dos pruebas dicen lo mismo: **no estacionaria**. Esto confirma la suposición S3 y la impresión que daba la gráfica.
- Una alarma, sin embargo: el p de ADF está en la **zona gris** (0.053), y ADF usó **{{=adf_def[2]}} rezagos**, una cifra alta para una serie anual.
@@ Decisión
🟡 El resultado apunta a diferenciar, pero con poca contundencia. El analista hace lo que sugieren las pruebas: el siguiente paso **diferencia** √y y revisa qué pasa. Si diferenciar era lo correcto, la serie diferenciada debería verse claramente estacionaria y sin el comportamiento "errante" que obliga a diferenciar.
:::

:::pastilla rojo | Aplicar · Diferenciar, Δz_t = z_t − z_{t−1} | u1:diferenciacion u2:sobrediferenciar u3:diferencia-filtro
Aplicar la primera diferencia que sugieren las pruebas, y comprobar si de verdad hacía falta. Una serie con raíz unitaria **vaga sin límite**; una estacionaria siempre **regresa** a su media.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `z.diff().dropna()` | d = 1 | La diferencia ordinaria; el primer año queda sin valor. |
| prueba de rango | 309 pasos | Si z fuera un paseo aleatorio con pasos del tamaño de Δz, después de 309 años se habría alejado típicamente desv(Δz)·√309 de donde empezó. Se compara con lo que la serie realmente se movió. |
@@ Código
```python
dz = z.diff().dropna()
adf_dz = adfuller(dz)
r_dz = acf(dz, nlags=11)
print(f"ADF de Δz: estadístico = {adf_dz[0]:.3f}, p = {adf_dz[1]:.2e}")
print("ACF de Δz en los rezagos 1, 5 y 11:", r_dz[[1, 5, 11]].round(2))

alcance_paseo = dz.std() * np.sqrt(len(z))           # alejamiento típico de un paseo aleatorio
print(f"\nSi √y fuera un paseo aleatorio, en {len(z)} años se alejaría ≈ {alcance_paseo:.1f} unidades de su inicio.")
print(f"Rango real de √y en 309 años: de {z.min():.1f} a {z.max():.1f} (amplitud {z.max() - z.min():.1f}).")
```
@@ Resultado
```python oculto
rng_lab = np.random.default_rng(7)
paseos = np.cumsum(rng_lab.normal(0, dz.std(), (5, len(z))), axis=1) + float(z.iloc[0])
grafica("lab-paseo", [linea(anios, paseos[i], "paseo aleatorio simulado" if i == 0 else "", "gris", 1, showlegend=(i == 0)) for i in range(5)]
                     + [linea(anios, z, "√manchas (real)", "osc", 1.8)],
        alto=320, title={"text": "√y real contra 5 paseos aleatorios con pasos del mismo tamaño"}, xaxis={"title": {"text": "año"}})
grafica("lab-dz-acf", correlograma(acf(dz, nlags=25), len(dz), "ACF de Δz"), alto=240,
        title={"text": "ACF de la serie diferenciada: el ciclo sigue ahí"}, showlegend=False, xaxis={"title": {"text": "rezago (años)"}}, yaxis={"range": [-1.05, 1.05]})
```
@widget lab-graf id=lab-paseo
@widget lab-graf id=lab-dz-acf
@@ Lectura
- ADF sobre Δz rechaza con **p = {{=adf_dz[1]|.1e}}**. Era de esperarse: diferenciar casi cualquier serie la vuelve "estacionaria". Eso no prueba que hiciera falta.
- **La ACF de Δz sigue oscilando** con periodo de unos 11 años ({{=r_dz[5]|.2f}} en el rezago 5 y {{=r_dz[11]|.2f}} en el 11). Diferenciar no quitó el ciclo; solo lo filtró, amplificando las frecuencias altas.
- **La prueba decisiva es la gráfica**. Un paseo aleatorio con pasos del tamaño de los de Δz se aleja típicamente **{{=alcance_paseo|.1f}}** unidades en 309 años, como hacen las 5 simulaciones grises. La serie real nunca salió del intervalo de {{=z.min()|.1f}} a {{=z.max()|.1f}}: **regresa una y otra vez a su nivel**. Eso es reversión a la media, lo contrario de una raíz unitaria.
@@ Decisión
❌ Diferenciar **no era necesario**: la serie es acotada y regresa a su media. Queda una pregunta incómoda: ¿por qué las pruebas dijeron lo contrario? El siguiente paso revisa qué tan **sensibles** son ADF y KPSS a sus parámetros (los rezagos de ADF y la especificación de KPSS). Por justicia, un modelo con d = 1 se comparará de todos modos contra los demás en la Fase 5.
:::

:::pastilla verde | Aplicar · Sensibilidad de ADF y KPSS a sus parámetros | u1:adf u1:especificaciones u1:potencia u1:kpss
Averiguar si el veredicto de "no estacionaria" del paso 15 depende de una elección técnica: el **número de rezagos** de ADF y la **especificación** de KPSS.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `maxlag=L, autolag=None` | L = 2, 4, 8, 9, 12 | Fija los rezagos de ADF en lugar de dejar que el AIC los elija. 2 corresponde a la dinámica AR(2) del ciclo; 8 o 9 es lo que eligió el AIC. |
| `kpss(z, regression="ct")` | constante y tendencia | Permite que el nivel tenga una deriva lenta: separa "variación de muy largo plazo" de "raíz unitaria". |
@@ Código
```python
import warnings

filas_adf = []
for L in [2, 4, 8, 9, 12]:
    r = adfuller(z, maxlag=L, autolag=None)
    filas_adf.append({"rezagos": L, "estadístico": round(r[0], 3), "p": round(r[1], 4)})
sens_adf = pd.DataFrame(filas_adf)
print(sens_adf.to_string(index=False))

with warnings.catch_warnings(record=True) as aviso:
    warnings.simplefilter("always")
    kpss_ct = kpss(z, regression="ct")
print(f"\nKPSS con tendencia: estadístico = {kpss_ct[0]:.3f}, p = {kpss_ct[1]} (aviso: {aviso[0].category.__name__ if aviso else 'ninguno'})")
```
@@ Resultado
```python oculto
tabla("lab-sens-adf", ["rezagos de ADF", "estadístico", "p", "¿rechaza la raíz unitaria al 5%?"],
      [[f["rezagos"], f'{f["estadístico"]:.3f}', f'{f["p"]:.4f}', "sí" if f["p"] < 0.05 else "no"] for f in filas_adf],
      ["elegido" if f["p"] < 0.05 else "descartado" for f in filas_adf], titulo="El veredicto de ADF cambia con el número de rezagos")
```
@widget lab-tabla id=lab-sens-adf
@@ Lectura
- **Con 2 o 4 rezagos ADF rechaza la raíz unitaria con muchísima fuerza** (p ≈ 0). Solo con 8 y 9 rezagos, justo los que eligió el AIC, cae en la zona gris; con 12 vuelve a rechazar.
- No es contradictorio. Con muchos rezagos, la regresión de ADF **absorbe el ciclo** en los términos rezagados y pierde potencia: le queda muy poca información para distinguir "regresa a la media" de "no regresa". Las series con ciclos fuertes son el caso típico en que ADF tiene poca potencia.
- **KPSS con tendencia no rechaza** (p > {{=kpss_ct[1]}}; el aviso `InterpolationWarning` solo dice que el p real es todavía mayor que el último valor de la tabla). KPSS sin tendencia rechazaba porque detecta la **variación de muy largo plazo** del nivel (el mínimo de Dalton y el máximo de 1957, vistos en el paso 4), no una raíz unitaria.
- Junto con la prueba de rango del paso 16: **√y es estacionaria** alrededor de un nivel que varía lentamente.
@@ Decisión
✅ Se trabajará con **d = 0** (sin diferenciar). La variación de largo plazo se estudiará en la Fase 8 con filtros. Ahora que la serie se trata como estacionaria, el siguiente paso identifica su estructura con la **ACF** y la **PACF**, la herramienta de Box–Jenkins para proponer los órdenes p y q.
:::

:::pastilla azul | Aplicar · ACF y PACF de √y | u1:acf-pacf u1:patrones u2:ar2-complejas u2:patrones2
Identificar candidatos ARMA. Un AR(p) tiene una ACF que decae y una PACF que **se corta después del rezago p**; un MA(q), al revés. Un ciclo produce una ACF con forma de **onda amortiguada**.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `nlags=30` | 30 años | Casi tres ciclos: deja ver si la oscilación de la ACF se amortigua. |
| `pacf(…, method="ywm")` | Yule–Walker | Estable con series largas. |
| banda | ±1.96/√n | Valores fuera de la banda son significativos al 5% (aproximado). |
@@ Código
```python
from statsmodels.tsa.stattools import pacf

r_z = acf(z, nlags=30)
p_z = pacf(z, nlags=30, method="ywm")
banda_z = 1.96 / np.sqrt(len(z))
print(f"Banda ±1.96/√n = ±{banda_z:.3f}")
print("ACF  (rezagos 1–12):", r_z[1:13].round(2))
print("PACF (rezagos 1–12):", p_z[1:13].round(2))
print("Rezagos con PACF significativa:", [k for k in range(1, 31) if abs(p_z[k]) > banda_z])
```
@@ Resultado
```python oculto
grafica("lab-acf-z", correlograma(r_z, len(z), "ACF"), alto=250, title={"text": "ACF de √y: onda amortiguada de periodo ≈ 11"},
        showlegend=False, xaxis={"title": {"text": "rezago (años)"}}, yaxis={"range": [-1.05, 1.05]})
grafica("lab-pacf-z", correlograma(p_z, len(z), "PACF", color="cel"), alto=250, title={"text": "PACF de √y"},
        showlegend=False, xaxis={"title": {"text": "rezago (años)"}}, yaxis={"range": [-1.05, 1.05]})
```
@widget lab-graf id=lab-acf-z
@widget lab-graf id=lab-pacf-z
@@ Lectura
- **ACF**: empieza en {{=r_z[1]|.2f}}, cruza el cero entre los rezagos 3 y 4, toca fondo en el 5 ({{=r_z[5]|.2f}}) y vuelve a subir hasta {{=r_z[11]|.2f}} en el 11. Es una **onda amortiguada** con periodo de unos 11 años, la firma de un AR(2) con raíces complejas.
- **PACF**: dos valores enormes, **{{=p_z[1]|.2f}}** en el rezago 1 y **{{=p_z[2]|.2f}}** en el 2. Un AR(2) puro se cortaría ahí. Pero después hay más rezagos significativos: {{=", ".join(str(k) for k in range(3, 31) if abs(p_z[k]) > banda_z)}}.
- Lectura de Box–Jenkins: el núcleo es un **AR(2)**, el modelo clásico de Yule para esta serie. La PACF sugiere que un AR de orden mayor, alrededor de 9, capturaría lo que queda.
@@ Decisión
Hay dos candidatos naturales: **AR(2)** (la suposición S4, parsimoniosa e interpretable) y **AR(9)** (lo que sugiere la PACF). Antes de modelar, el último paso de exploración confirma con Ljung–Box que hay dependencia que modelar. Parece obvio, pero es la prueba formal de la Unidad I.
:::

:::pastilla azul | Aplicar · Prueba de Ljung–Box sobre √y | u1:ljung-box u1:lb-h
Confirmar formalmente que √y **no** es ruido blanco: si lo fuera, el mejor pronóstico sería su media y no tendría sentido construir un modelo.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `lags=[10, 22]` | 10 y 22 | 10 es el valor habitual para series no estacionales y 22 cubre dos ciclos. |
| `model_df` | 0 | Se prueba la serie misma, no los residuos de un modelo. |
@@ Código
```python
from statsmodels.stats.diagnostic import acorr_ljungbox

lb_z = acorr_ljungbox(z, lags=[10, 22])
print(lb_z.round(4).to_string())
```
@@ Lectura
- **Q(10) = {{=lb_z['lb_stat'].iloc[0]|.1f}}** con p ≈ {{=lb_z['lb_pvalue'].iloc[0]|.0e}}: la serie está lejísimos del ruido blanco. Para comparar, el valor crítico de una χ² con 10 grados de libertad al 5% es 18.3.
- Era lo esperado con autocorrelaciones de 0.82 en el rezago 1. El dato importante es que **hay mucha estructura predecible**, que es lo que los modelos deben capturar.
@@ Decisión
✅ Fin de la exploración. Resumen de la evidencia: la serie se trabaja como **√y**, es **estacionaria** (d = 0), su ciclo es **cuasiperiódico** (no estacional) y su estructura es **autorregresiva** (AR(2) a AR(9)). La Fase 4 prepara la evaluación: partición de los datos, métricas y modelos de referencia contra los cuales medir cualquier modelo.
:::
