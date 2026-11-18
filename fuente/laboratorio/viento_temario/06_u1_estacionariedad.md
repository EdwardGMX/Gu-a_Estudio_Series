## 📏 Unidad I · Estadísticos y estacionariedad {#u1-estacionariedad}
@mapa El rezago, la media, la varianza, la autocovarianza y la autocorrelación del viento; qué significa que sea estacionario; el ruido blanco, el AR(1) y el paseo aleatorio como puntos de comparación; la raíz unitaria, las tendencias y la diferenciación.

:::pastilla verde | Aplicar · El rezago | u1:rezago {#u1-rezago}
Construir rezagos de la serie con `shift`: y<sub>t−1</sub> es el viento de la hora anterior y y<sub>t−24</sub>, el del día anterior a la misma hora. Todos los estadísticos de dependencia se construyen comparando la serie con sus rezagos.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `shift(1)` | una hora | El rezago más usado. |
| `shift(24)` | un día | El rezago del ciclo diario. |
@@ Código
```python
tabla_rez = pd.DataFrame({"y_t": y, "y_(t-1)": y.shift(1), "y_(t-24)": y.shift(24)})
print(tabla_rez.loc["2019-01-02 00:00":"2019-01-02 04:00"].round(2).to_string())
print(f"\nNaN que deja cada rezago: shift(1) → {tabla_rez['y_(t-1)'].isna().sum()} | shift(24) → {tabla_rez['y_(t-24)'].isna().sum()}")
```
@@ Lectura
- `shift(1)` pone en cada hora el valor de la hora anterior: a las 01:00 del 2 de enero, y<sub>t−1</sub> = 13.63, que es el y<sub>t</sub> de las 00:00.
- Cada rezago deja k horas sin valor al inicio: 1 con `shift(1)` y 24 con `shift(24)`.
@@ Decisión
✅ Con los rezagos se construyen la gráfica de rezagos, la autocovarianza, la autocorrelación y, en la Unidad II, los modelos AR.
:::

:::pastilla azul | Aplicar · Media y varianza muestrales, por bloques | u1:media u1:varianza {#u1-media-var}
Calcular la **media** y la **varianza** muestrales de todo el año y de bloques de 30 días. Si la serie fuera estacionaria, todos los bloques tendrían más o menos la misma media y la misma varianza.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `ddof=1` | varianza con n − 1 | La varianza muestral insesgada. |
| bloques | 12 de 30 días (y uno de 5) | Del tamaño de un mes, sin depender del calendario. |
@@ Código
```python
bloque = np.arange(len(y)) // (24 * 30)
est_bloque = y.groupby(bloque).agg(["mean", "var"])
print(f"Todo el año: media {y.mean():.3f} m/s | varianza {y.var(ddof=1):.3f} (m/s)² | con n en lugar de n − 1: {y.var(ddof=0):.3f}")
print(f"Media por bloque: de {est_bloque['mean'].min():.2f} a {est_bloque['mean'].max():.2f} | varianza por bloque: de {est_bloque['var'].min():.1f} a {est_bloque['var'].max():.1f}")
```
@@ Resultado
```python oculto
inicio_b = [y.index[i * 720].strftime("%d %b") for i in est_bloque.index]
grafica("u1-media-var", [barras(inicio_b, est_bloque["mean"], "media del bloque (m/s)", "lav"),
                         linea(inicio_b, est_bloque["var"], "varianza del bloque ((m/s)²)", "dur", 2.4, mode="lines+markers", yaxis="y2")],
        alto=290, title={"text": "Media y varianza en bloques de 30 días"}, yaxis={"title": {"text": "media (m/s)"}},
        yaxis2={"title": {"text": "varianza"}, "overlaying": "y", "side": "right", "showgrid": False}, shapes=[hline(y.mean(), "lav")])
```
@widget lab-graf id=u1-media-var
@@ Lectura
- La media del año es {{=y.mean()|.2f}} m/s y la varianza {{=y.var()|.1f}} (m/s)². Con n o con n − 1 casi no cambia: con 8,760 datos la diferencia es despreciable.
- Pero **por bloques** la media va de {{=est_bloque['mean'].min()|.1f}} a {{=est_bloque['mean'].max()|.1f}} m/s y la varianza de {{=est_bloque['var'].min()|.0f}} a {{=est_bloque['var'].max()|.0f}}. Los bloques ventosos son también los más variables.
@@ Decisión
🔵 Ni la media ni la varianza son las mismas en todo el año. La media global de {{=y.mean()|.1f}} es un promedio de regímenes muy distintos.
:::

:::pastilla verde | Aplicar · La autocovarianza, con la fórmula y con statsmodels | u1:autocov {#u1-autocov}
Calcular la **autocovarianza muestral** $\hat\gamma(k) = \frac{1}{n}\sum_{t=k+1}^{n}(y_t - \bar y)(y_{t-k} - \bar y)$ a mano y comprobar que coincide con `acovf` de statsmodels. Mide cuánto varían juntas la serie y su rezago k.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| denominador | n, no n − k | La convención de statsmodels: garantiza una matriz de autocovarianzas válida. |
| k | 0, 1, 24 y 168 | La varianza, una hora, un día y una semana. |
@@ Código
```python
from statsmodels.tsa.stattools import acovf
yc = y.values - y.mean()
n = len(yc)
gamma_mano = {k: np.sum(yc[k:] * yc[:n - k]) / n for k in [0, 1, 24, 168]}
gamma_sm = acovf(y.values, nlag=168, fft=True)
for k, g in gamma_mano.items():
    print(f"γ̂({k:>3}) = {g:8.4f} a mano | {gamma_sm[k]:8.4f} con acovf")
print(f"\nCon n − k en el denominador, γ̂(168) sería {np.sum(yc[168:] * yc[:n - 168]) / (n - 168):.4f}")
```
@@ Lectura
- La fórmula a mano y `acovf` dan **exactamente** lo mismo: γ̂(0) = {{=gamma_mano[0]|.2f}} es la varianza (con n), γ̂(1) = {{=gamma_mano[1]|.2f}}, γ̂(24) = {{=gamma_mano[24]|.2f}} y γ̂(168) = {{=gamma_mano[168]|.2f}}.
- Con n − k en el denominador los valores de rezagos grandes salen un poco mayores; statsmodels usa n para que la matriz de autocovarianzas sea válida.
@@ Decisión
✅ La autocovarianza baja con el rezago pero sigue lejos de cero a una semana. Para comparar es mejor la autocorrelación, que no depende de las unidades.
:::

:::pastilla verde | Aplicar · La autocorrelación y sus signos | u1:autocorr u1:signos {#u1-acf-signos}
Dividir la autocovarianza entre la varianza para obtener la **autocorrelación** $r_k = \hat\gamma(k) / \hat\gamma(0)$, que va de −1 a 1. Se compara la del viento con la de sus **cambios** de hora a hora, para ver autocorrelaciones positivas y negativas.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `acf(…, nlags=12, fft=True)` | 12 rezagos | Medio día. |
| `y.diff()` | cambios de una hora a otra | Una serie con otro tipo de dependencia. |
@@ Código
```python
from statsmodels.tsa.stattools import acf
r_y = acf(y, nlags=12, fft=True)
r_dy = acf(y.diff().dropna(), nlags=12, fft=True)
print(f"r_1 a mano: {gamma_sm[1] / gamma_sm[0]:.4f} | con acf: {r_y[1]:.4f}")
print("Viento:   ", np.round(r_y[1:7], 3))
print("Cambios:  ", np.round(r_dy[1:7], 3))
```
@@ Resultado
```python oculto
grafica("u1-acf-signos", [barras(list(range(1, 13)), r_y[1:], "viento", "lav"), barras(list(range(1, 13)), r_dy[1:], "cambios de hora a hora", "dur")],
        alto=270, barmode="group", title={"text": "Autocorrelaciones del viento y de sus cambios"}, xaxis={"title": {"text": "rezago k (horas)"}, "dtick": 1},
        yaxis={"range": [-0.3, 1]})
```
@widget lab-graf id=u1-acf-signos
@@ Lectura
- El viento tiene autocorrelaciones **positivas y altas** que bajan despacio: r<sub>1</sub> = {{=r_y[1]|.3f}}, r<sub>6</sub> = {{=r_y[6]|.3f}}.
- Sus **cambios** de hora a hora casi no tienen autocorrelación (r<sub>1</sub> = {{=r_dy[1]|.3f}}) y la de r<sub>2</sub> es **negativa** ({{=r_dy[2]|.3f}}): después de una subida hay una ligera tendencia a bajar.
@@ Decisión
✅ La dependencia del viento está en su **nivel**, no en sus cambios. Es la primera pista de que la diferencia regular podría dejar algo parecido al ruido.
:::

:::pastilla amarillo | Aplicar · ¿Es estacionario? La intuición por trimestres | u1:intuicion-est u1:debil {#u1-est-intuicion}
Revisar las tres condiciones de la **estacionariedad débil** en cada trimestre: media constante, varianza constante y autocorrelación que depende solo del rezago (no del momento). Es la versión informal de lo que las pruebas formalizan.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| trimestres | 4 bloques de 3 meses | Suficientes datos en cada uno (más de 2,000 horas). |
| r<sub>1</sub> y r<sub>24</sub> | autocorrelación a 1 y 24 horas | La dependencia en cada trimestre. |
@@ Código
```python
trimestres = pd.DataFrame({t: {"media": s.mean(), "varianza": s.var(), "r_1": s.autocorr(1), "r_24": s.autocorr(24)}
                           for t, s in y.groupby(y.index.quarter)}).T
trimestres.index = ["ene–mar", "abr–jun", "jul–sep", "oct–dic"]
print(trimestres.round(3).to_string())
```
@@ Resultado
```python oculto
tabla("u1-est-intuicion", ["trimestre", "media", "varianza", "r₁", "r₂₄"],
      [[t, f"{r['media']:.2f}", f"{r['varianza']:.1f}", f"{r['r_1']:.3f}", f"{r['r_24']:.3f}"] for t, r in trimestres.iterrows()],
      titulo="Las condiciones de la estacionariedad, trimestre por trimestre")
```
@widget lab-tabla id=u1-est-intuicion
@@ Lectura
- **La media cambia**: de {{=trimestres['media'].min()|.1f}} m/s en abril–junio a {{=trimestres['media'].max()|.1f}} en enero–marzo.
- **La varianza cambia**: de {{=trimestres['varianza'].min()|.0f}} a {{=trimestres['varianza'].max()|.0f}}.
- **La autocorrelación a 1 hora es estable** (de {{=trimestres['r_1'].min()|.3f}} a {{=trimestres['r_1'].max()|.3f}}), pero la de **24 horas cambia** de {{=trimestres['r_24'].min()|.2f}} a {{=trimestres['r_24'].max()|.2f}}: el ciclo diario pesa más en verano.
@@ Decisión
🟡 Las tres condiciones fallan o fallan a medias: a escala de un año el viento **no parece estacionario**. A escala de horas, su dependencia sí es bastante estable.
:::

:::pastilla azul | Aplicar · Estacionalidad no es estacionariedad | u1:estacionalidad-vs u1:no-plana {#u1-estac-no}
Ver que el **ciclo diario** también rompe la estacionariedad: si la media depende de la hora del día, la media de la serie no es constante en el tiempo. Se estima la media de cada hora con su intervalo.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| media por hora | 24 medias de 365 días | La media del proceso a cada hora del día. |
| intervalo | ± 2 errores estándar con n efectivo | Los días consecutivos se parecen; el n efectivo corrige eso. |
| n efectivo | n (1 − r) / (1 + r), con r la autocorrelación de un día | Una corrección aproximada por dependencia. |
@@ Código
```python
r_dia = dia["mean"].autocorr(1)
n_ef = 365 * (1 - r_dia) / (1 + r_dia)
media_h = y.groupby(y.index.hour).mean()
ee_h = y.groupby(y.index.hour).std() / np.sqrt(n_ef)
print(f"Autocorrelación entre días: {r_dia:.2f} → n efectivo ≈ {n_ef:.0f} días en lugar de 365")
print(f"Media a las 5 h: {media_h[5]:.2f} ± {2 * ee_h[5]:.2f} | a las 13 h: {media_h[13]:.2f} ± {2 * ee_h[13]:.2f}")
print(f"¿Se enciman los intervalos? {media_h[5] + 2 * ee_h[5] > media_h[13] - 2 * ee_h[13]}")
```
@@ Resultado
```python oculto
grafica("u1-estac-no", [{"type": "scatter", "x": list(range(24)), "y": _vals(media_h), "mode": "lines+markers", "name": "media de cada hora",
                         "line": {"color": PALETA["lav"], "width": 2.4}, "error_y": {"type": "data", "array": _vals(2 * ee_h), "color": PALETA["gris"]}}],
        alto=270, showlegend=False, title={"text": "Media del viento a cada hora del día, con ± 2 errores estándar"},
        xaxis={"title": {"text": "hora del día"}, "dtick": 3}, yaxis={"title": {"text": "m/s"}})
```
@widget lab-graf id=u1-estac-no
@@ Lectura
- La media a las 13 h ({{=media_h[13]|.1f}} m/s) es mayor que a las 5 h ({{=media_h[5]|.1f}}): la media **depende de la hora**, y una serie con media que depende de t no es estacionaria aunque el patrón se repita.
- Pero los intervalos son anchos: como un día se parece al siguiente (autocorrelación {{=r_dia|.2f}}), los 365 días equivalen a unos **{{=n_ef|.0f}}** días independientes, y los intervalos de las 5 y las 13 h se enciman.
@@ Decisión
🔵 Estacionalidad y estacionariedad son cosas distintas: una serie estacional no es estacionaria, aunque su patrón sea muy regular. Aquí el ciclo diario es real, pero pequeño frente a la incertidumbre que deja la dependencia entre días.
:::

:::pastilla azul | Aplicar · El viento contra el ruido blanco | u1:ruido-blanco {#u1-ruido}
Comparar el viento con un **ruido blanco** de la misma media y varianza: una serie sin ninguna dependencia. El ruido blanco es la referencia contra la que se mide toda estructura.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| ruido | normal con media 8.92 y desviación 5.08 | Mismos momentos que el viento. |
| comparación | una semana y las autocorrelaciones r<sub>1</sub>, r<sub>24</sub> | Lo que el ruido no tiene. |
@@ Código
```python
ruido = pd.Series(np.random.default_rng(11).normal(y.mean(), y.std(), len(y)), index=y.index)
print(f"Ruido blanco: media {ruido.mean():.2f}, desviación {ruido.std():.2f}, r_1 = {ruido.autocorr(1):.3f}, r_24 = {ruido.autocorr(24):.3f}")
print(f"Viento:       media {y.mean():.2f}, desviación {y.std():.2f}, r_1 = {y.autocorr(1):.3f}, r_24 = {y.autocorr(24):.3f}")
print(f"Banda ±1.96/√n para el ruido: ±{1.96 / np.sqrt(len(y)):.3f}")
print(f"El ruido tiene {(ruido < 0).sum()} horas negativas")
```
@@ Resultado
```python oculto
semr = slice("2019-04-01", "2019-04-07")
control("u1-ruido", [{"etiqueta": "Serie", "tipo": "seg", "textos": ["viento", "ruido blanco"], "inicial": 0}],
        [[linea(y[semr].index, y[semr].round(2), "viento", "osc", 1.8)], [linea(ruido[semr].index, ruido[semr].round(2), "ruido blanco", "dur", 1.4)]],
        textos=[f"r<sub>1</sub> = <b>{y.autocorr(1):.3f}</b>: cada hora se parece a la anterior.", f"r<sub>1</sub> = <b>{ruido.autocorr(1):.3f}</b>: ninguna hora dice nada de la siguiente."],
        alto=280, showlegend=False, title={"text": "Una semana de abril: el viento y un ruido blanco con la misma media y varianza"},
        yaxis={"title": {"text": "m/s"}, "range": [-8, 26]})
```
@widget lab-control id=u1-ruido
@@ Lectura
- El ruido blanco tiene la misma media y desviación que el viento, pero su r<sub>1</sub> es {{=ruido.autocorr(1)|.3f}}, dentro de la banda ±{{=1.96 / np.sqrt(len(y))|.3f}}; el viento tiene {{=y.autocorr(1)|.3f}}.
- El ruido salta de un valor a otro sin continuidad y tiene {{=(ruido < 0).sum()}} horas negativas: un viento imposible.
@@ Decisión
🔵 El viento está muy lejos del ruido blanco. El trabajo de los modelos de la Unidad II es transformar el viento en **residuos** que sí se parezcan a esto.
:::

:::pastilla azul | Aplicar · Un AR(1) con los números del viento | u1:ar1 {#u1-ar1}
Simular un **AR(1)**, $y_t = c + \phi y_{t-1} + \varepsilon_t$, con φ igual a la autocorrelación a una hora del viento, y la media y la varianza del viento. Si se parece al viento, la memoria del viento es la de un AR(1); si no, tiene algo más.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| φ | r<sub>1</sub> = 0.970 | La persistencia de una hora a la siguiente. |
| c | μ (1 − φ) | Para que la media sea la del viento. |
| σ² | Var(y) (1 − φ²) | Para que la varianza sea la del viento. |
@@ Código
```python
phi1 = y.autocorr(1)
c1, s2_1 = y.mean() * (1 - phi1), y.var() * (1 - phi1 ** 2)
rng_a = np.random.default_rng(3)
sim_ar1 = np.empty(len(y))
sim_ar1[0] = y.mean()
for t in range(1, len(y)):
    sim_ar1[t] = c1 + phi1 * sim_ar1[t - 1] + rng_a.normal(0, np.sqrt(s2_1))
sim_ar1 = pd.Series(sim_ar1, index=y.index)
print(f"φ = {phi1:.3f} | c = {c1:.3f} | σ = {np.sqrt(s2_1):.3f} | vida media de un choque: {np.log(0.5) / np.log(phi1):.1f} horas")
print(f"Autocorrelación a 24 h: el AR(1) predice φ²⁴ = {phi1 ** 24:.3f}; el viento tiene {y.autocorr(24):.3f}")
print(f"Autocorrelación a 72 h: el AR(1) predice {phi1 ** 72:.3f}; el viento tiene {y.autocorr(72):.3f}")
print(f"Horas negativas en el AR(1) simulado: {(sim_ar1 < 0).mean():.1%}")
```
@@ Resultado
```python oculto
r_sim = acf(sim_ar1, nlags=96, fft=True)
r_vie = acf(y, nlags=96, fft=True)
grafica("u1-ar1", [linea(list(range(97)), r_vie, "viento", "osc", 2.4), linea(list(range(97)), r_sim, "AR(1) simulado", "dur", 2),
                   linea(list(range(97)), phi1 ** np.arange(97), "φᵏ (teórica)", "gris", 1.4, "dot")],
        alto=280, title={"text": "Autocorrelación del viento y del AR(1) con el mismo φ"}, xaxis={"title": {"text": "rezago (horas)"}, "dtick": 12},
        yaxis={"title": {"text": "autocorrelación"}})
```
@widget lab-graf id=u1-ar1
@@ Lectura
- Con φ = {{=phi1|.3f}}, un choque pierde la mitad de su efecto en unas **{{=np.log(0.5) / np.log(phi1)|.0f}} horas**.
- El AR(1) reproduce bien la autocorrelación de las primeras horas, pero **se queda corto** a partir de un día: a 24 h predice {{=phi1 ** 24|.2f}} y el viento tiene {{=y.autocorr(24)|.2f}}; a 72 h, {{=phi1 ** 72|.2f}} contra {{=y.autocorr(72)|.2f}}.
- El AR(1) normal produce un {{=100 * (sim_ar1 < 0).mean()|.0f}}% de horas negativas.
@@ Decisión
🔵 El viento tiene **más memoria larga** que un AR(1): los episodios de días hacen que la autocorrelación decaiga más despacio de lo que permite un solo coeficiente. Un modelo con más rezagos (Unidad II) podrá capturarlo.
:::

:::pastilla azul | Aplicar · ¿Es un paseo aleatorio? | u1:paseo {#u1-paseo}
Comparar el viento con **paseos aleatorios** que tienen los mismos cambios de hora a hora: $y_t = y_{t-1} + \varepsilon_t$. En un paseo la varianza crece con el tiempo y la serie no regresa a ningún nivel; si el viento fuera un paseo, no tendría media a la cual volver.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| choques | normales con la desviación de Δy | El mismo tamaño de cambio horario que el viento. |
| caminos | 5 | Para ver la dispersión. |
| inicio | 8.92 m/s | La media del viento. |
@@ Código
```python
sd_dy = y.diff().std()
caminos = y.mean() + np.cumsum(np.random.default_rng(21).normal(0, sd_dy, (5, len(y))), axis=1)
print(f"Desviación de los cambios horarios: {sd_dy:.3f} m/s")
print(f"Al final del año los 5 paseos están entre {caminos[:, -1].min():.0f} y {caminos[:, -1].max():.0f} m/s (el viento: {y.iloc[-1]:.1f})")
print(f"Desviación teórica del paseo después de un año: {sd_dy * np.sqrt(len(y)):.0f} m/s")
print(f"Rango del viento en el año: {y.min():.1f} a {y.max():.1f} m/s | rango de los paseos: {caminos.min():.0f} a {caminos.max():.0f}")
```
@@ Resultado
```python oculto
grafica("u1-paseo", [linea(dia_anio[::24].round(2), caminos[i, ::24].round(1), f"paseo {i + 1}", "gris", 1, showlegend=(i == 0), name="paseos aleatorios") for i in range(5)]
        + [linea(dia_anio[::24].round(2), y.values[::24].round(1), "viento (cada 24 h)", "osc", 2)],
        alto=300, title={"text": "El viento y cinco paseos aleatorios con los mismos cambios horarios"}, xaxis={"title": {"text": "día del año"}},
        yaxis={"title": {"text": "m/s"}})
```
@widget lab-graf id=u1-paseo
@@ Lectura
- Los paseos aleatorios con los mismos cambios horarios que el viento se **alejan sin límite**: después de un año están entre {{=caminos[:, -1].min()|.0f}} y {{=caminos[:, -1].max()|.0f}} m/s, y su desviación teórica es de {{=sd_dy * np.sqrt(len(y))|.0f}} m/s.
- El viento, en cambio, se queda entre {{=y.min()|.1f}} y {{=y.max()|.1f}} m/s: siempre regresa.
@@ Decisión
🔵 El viento **no es un paseo aleatorio**: tiene un nivel al que regresa. Sus cambios horarios se parecen a los de un paseo, pero la serie completa está acotada.
:::

:::pastilla azul | Aplicar · La raíz unitaria: ¿qué tan cerca de 1 está φ? | u1:raiz-unitaria {#u1-raiz}
Estimar φ por mínimos cuadrados en $y_t = c + \phi y_{t-1} + \varepsilon_t$ con datos horarios y con datos diarios. Si φ = 1 hay **raíz unitaria** (paseo aleatorio): un choque no se olvida nunca. Si φ < 1, el efecto de un choque decae como φ<sup>k</sup>.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `np.polyfit(y_{t−1}, y_t, 1)` | mínimos cuadrados | La pendiente es φ̂. |
| frecuencias | horaria y diaria | La misma memoria vista en dos escalas. |
| vida media | ln 0.5 / ln φ | Cuánto tarda un choque en perder la mitad de su efecto. |
@@ Código
```python
phi_h = np.polyfit(y.values[:-1], y.values[1:], 1)[0]
phi_d = np.polyfit(dia["mean"].values[:-1], dia["mean"].values[1:], 1)[0]
print(f"Horaria: φ̂ = {phi_h:.4f} → vida media {np.log(0.5) / np.log(phi_h):.1f} horas")
print(f"Diaria:  φ̂ = {phi_d:.4f} → vida media {np.log(0.5) / np.log(phi_d):.1f} días")
print(f"Si la horaria fuera un AR(1), la diaria tendría φ ≈ φ_h²⁴ = {phi_h ** 24:.3f}")
```
@@ Resultado
```python oculto
kk = np.arange(0, 121)
grafica("u1-raiz", [linea(kk, phi_h ** kk, f"φ = {phi_h:.3f} (viento horario)", "lav", 2.6), linea(kk, 0.9 ** kk, "φ = 0.9", "menta", 1.6, "dot"),
                    linea(kk, np.ones_like(kk, dtype=float), "φ = 1 (raíz unitaria)", "rojo", 1.6, "dash")],
        alto=270, title={"text": "Efecto de un choque de 1 m/s, k horas después"}, xaxis={"title": {"text": "horas después del choque"}, "dtick": 24},
        yaxis={"title": {"text": "efecto restante"}, "range": [0, 1.05]})
```
@widget lab-graf id=u1-raiz
@@ Lectura
- Con datos horarios φ̂ = **{{=phi_h|.4f}}**: muy cerca de 1, pero menor. Un choque tarda {{=np.log(0.5) / np.log(phi_h)|.0f}} horas en perder la mitad de su efecto.
- Con datos diarios φ̂ = {{=phi_d|.3f}}, lejos de 1. Si la horaria fuera un AR(1) exacto, la diaria tendría alrededor de {{=phi_h ** 24|.2f}}: la diaria tiene **más** persistencia, otra vez la memoria de los episodios.
@@ Decisión
🔵 Con datos horarios, φ̂ cerca de 1 hace difícil distinguir entre "persistente" y "raíz unitaria" a simple vista. Para eso están las pruebas formales que siguen.
:::

:::pastilla amarillo | Aplicar · Regresión de tendencia y los dos tipos de tendencia | u1:tendencias u1:regresion-tendencia {#u1-tendencias}
Ajustar una **tendencia determinística** al viento diario (una recta y una parábola en el tiempo) y comparar con la alternativa **estocástica** (diferenciar). Si la tendencia fuera determinística, restar la curva dejaría una serie estacionaria; si fuera estocástica, habría que diferenciar.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `np.polyfit(t, y, 1)` y grado 2 | recta y parábola | Las tendencias del temario. |
| t | días desde el 1 de enero | La variable de tiempo. |
| R² | 1 − SSR / SST | Cuánto explica la tendencia. |
@@ Código
```python
td = np.arange(len(dia))
yd = dia["mean"].values
ajustes = {}
for grado in (1, 2):
    coef = np.polyfit(td, yd, grado)
    ajustado = np.polyval(coef, td)
    r2 = 1 - np.sum((yd - ajustado) ** 2) / np.sum((yd - yd.mean()) ** 2)
    ajustes[grado] = (coef, ajustado, r2)
    print(f"Grado {grado}: R² = {r2:.3f} | coeficientes {np.round(coef, 5)}")
print(f"Pendiente de la recta: {ajustes[1][0][0] * 365:+.2f} m/s por año")
sin_tend = yd - ajustes[2][1]
dif_d = np.diff(yd)
print(f"\nSin tendencia (parábola): desviación {sin_tend.std():.2f}, autocorrelación a 1 día {pd.Series(sin_tend).autocorr(1):.2f}")
print(f"Diferenciada:             desviación {dif_d.std():.2f}, autocorrelación a 1 día {pd.Series(dif_d).autocorr(1):.2f}")
```
@@ Resultado
```python oculto
grafica("u1-tendencias", [linea(dia.index, yd.round(2), "media diaria", "gris", 1), linea(dia.index, ajustes[1][1], f"recta (R² = {ajustes[1][2]:.2f})", "dur", 2.4),
                          linea(dia.index, ajustes[2][1], f"parábola (R² = {ajustes[2][2]:.2f})", "lav", 2.6)],
        alto=290, title={"text": "Tendencias determinísticas del viento diario"}, yaxis={"title": {"text": "m/s"}})
```
@widget lab-graf id=u1-tendencias
@@ Lectura
- La **recta** no explica nada (R² = {{=ajustes[1][2]|.3f}}): el viento de diciembre es parecido al de enero. La pendiente de {{=ajustes[1][0][0] * 365|+.2f}} m/s por año no tiene sentido físico con un solo año.
- La **parábola** explica el {{=100 * ajustes[2][2]|.0f}}% de la varianza diaria: dibuja la temporada (alto en invierno, bajo en verano).
- Restar la parábola deja una serie con autocorrelación diaria de {{=pd.Series(sin_tend).autocorr(1)|.2f}}; diferenciar deja {{=pd.Series(dif_d).autocorr(1)|.2f}}.
@@ Decisión
🟡 La "tendencia" del viento es en realidad la **temporada** del año, que con un solo año no se distingue de una curva cualquiera. Ninguna tendencia determinística explica los episodios. No se usa una tendencia en el tiempo para pronosticar.
:::

:::pastilla verde | Aplicar · La diferenciación: regular, estacional y las dos | u1:diferenciacion {#u1-diferencias}
Aplicar los operadores de diferencia: **∇y<sub>t</sub> = y<sub>t</sub> − y<sub>t−1</sub>** (regular), **∇<sub>24</sub>y<sub>t</sub> = y<sub>t</sub> − y<sub>t−24</sub>** (estacional) y las dos juntas. Cada una quita un tipo de no estacionariedad. Mueve el control para ver cada serie.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `diff(1)` | regular | Quita un nivel que se mueve. |
| `diff(24)` | estacional | Quita un patrón que se repite cada 24 horas. |
| `diff(24).diff(1)` | las dos | La combinación del modelo de aerolínea. |
@@ Código
```python
DIFS = {"y (sin diferenciar)": y, "∇y": y.diff(), "∇₂₄y": y.diff(24), "∇∇₂₄y": y.diff(24).diff()}
tab_dif = pd.DataFrame({k: {"media": s.mean(), "desviación": s.std(), "r_1": s.autocorr(1), "r_24": s.autocorr(24),
                            "datos perdidos": s.isna().sum()} for k, s in DIFS.items()}).T
print(tab_dif.round(3).to_string())
```
@@ Resultado
```python oculto
semd = slice("2019-04-01", "2019-04-10")
control("u1-diferencias", [{"etiqueta": "Serie", "tipo": "seg", "textos": list(DIFS), "inicial": 1}],
        [[linea(s[semd].index, s[semd].round(2), k, ["osc", "lav", "rosa", "dur"][i], 1.6)] for i, (k, s) in enumerate(DIFS.items())],
        textos=[f"Desviación {tab_dif.loc[k, 'desviación']:.2f} m/s · r<sub>1</sub> = {tab_dif.loc[k, 'r_1']:.2f} · r<sub>24</sub> = {tab_dif.loc[k, 'r_24']:.2f}" for k in DIFS],
        alto=280, showlegend=False, title={"text": "La serie y sus diferencias (10 días de abril)"}, yaxis={"title": {"text": "m/s"}})
```
@widget lab-control id=u1-diferencias
@@ Lectura
- **∇y** tiene media cero, desviación {{=tab_dif.loc['∇y', 'desviación']|.2f}} m/s y casi **ninguna autocorrelación** (r<sub>1</sub> = {{=tab_dif.loc['∇y', 'r_1']|.3f}}).
- **∇<sub>24</sub>y** sigue muy autocorrelacionada (r<sub>1</sub> = {{=tab_dif.loc['∇₂₄y', 'r_1']|.2f}}) y su desviación ({{=tab_dif.loc['∇₂₄y', 'desviación']|.2f}}) es casi la del viento: restar el valor de ayer no quita los episodios.
- **∇∇<sub>24</sub>y** tiene r<sub>24</sub> = {{=tab_dif.loc['∇∇₂₄y', 'r_24']|.2f}}: la diferencia estacional, si no hace falta, crea una autocorrelación negativa a 24 horas (sobrediferenciación).
@@ Decisión
✅ La diferencia **regular** es la que más se acerca a una serie estacionaria. La estacional no parece necesaria: la estacionalidad es débil.
:::

:::pastilla verde | Aplicar · Galería: ¿cuál versión del viento parece estacionaria? | u1:galeria {#u1-galeria}
Reunir varias versiones del viento y revisar a ojo las tres condiciones de la estacionariedad débil, con números: ¿la media de la primera mitad se parece a la de la segunda? ¿Y la varianza? ¿La autocorrelación decae rápido?
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| media | diferencia entre mitades, en desviaciones | Estable si es chica. |
| varianza | cociente entre mitades | Estable si es cercano a 1. |
| memoria | r a 7 días (168 h o 7 días) | Si sigue alta, la dependencia no decae. |
@@ Código
```python
VERSIONES = {"viento horario": (y, 168), "∇y": (y.diff().dropna(), 168), "∇₂₄y": (y.diff(24).dropna(), 168),
             "residuo de STL": (stl.resid, 168), "viento diario": (dia["mean"], 7), "∇ viento diario": (dia["mean"].diff().dropna(), 7)}
filas_g = []
for k, (s, lag7) in VERSIONES.items():
    a, b = s.iloc[: len(s) // 2], s.iloc[len(s) // 2:]
    filas_g.append({"versión": k, "Δ media / desv.": abs(a.mean() - b.mean()) / s.std(), "cociente de varianzas": b.var() / a.var(),
                    "r a 7 días": s.autocorr(lag7)})
galeria = pd.DataFrame(filas_g).set_index("versión")
print(galeria.round(3).to_string())
```
@@ Resultado
```python oculto
def _parece(r):
    return abs(r["Δ media / desv."]) < 0.1 and 0.75 < r["cociente de varianzas"] < 1.33 and abs(r["r a 7 días"]) < 0.1
tabla("u1-galeria", ["versión", "Δ media / desv.", "cociente de varianzas", "r a 7 días", "¿parece estacionaria?"],
      [[k, f"{r['Δ media / desv.']:.2f}", f"{r['cociente de varianzas']:.2f}", f"{r['r a 7 días']:.3f}", "sí" if _parece(r) else "no"] for k, r in galeria.iterrows()],
      ["elegido" if _parece(r) else "descartado" for _, r in galeria.iterrows()],
      titulo="Las tres condiciones, a ojo", nota="Criterio informal: diferencia de medias menor que 0.1 desviaciones, cociente de varianzas entre 0.75 y 1.33 y r a 7 días menor que 0.1 en valor absoluto.")
```
@widget lab-tabla id=u1-galeria
@@ Lectura
- El **viento horario** y el **diario** fallan por la memoria: su autocorrelación a 7 días sigue en {{=galeria.loc['viento horario', 'r a 7 días']|.2f}} y {{=galeria.loc['viento diario', 'r a 7 días']|.2f}}.
- **∇y**, **∇<sub>24</sub>y**, el **residuo de STL** y la **diferencia del viento diario** pasan el criterio informal.
- Todas las versiones tienen medias parecidas en las dos mitades del año: con un año que empieza y termina en temporada de nortes, la media no distingue las mitades.
@@ Decisión
✅ La pregunta que queda para las pruebas formales: ¿el viento horario es **estacionario con mucha memoria** o tiene **raíz unitaria**? Las versiones diferenciadas parecen estacionarias, pero eso no dice si diferenciar era necesario.
:::
