## 🧩 Fase 2 · ¿Estacionalidad, ciclo o tendencia? (Unidad I) {#fase-estructura}
@mapa Se prueba la suposición de que el ciclo de 11 años es una estacionalidad: descomposición aditiva, multiplicativa y STL, y la duración real de cada ciclo.

:::pastilla rojo | Aplicar · Descomposición aditiva con periodo 11 | u1:descomposicion u1:fuerza u3:periodo-vs-ciclo
Poner a prueba la suposición **S2**: si el ciclo solar se comporta como una estacionalidad de periodo 11, la descomposición clásica debería separar una tendencia suave, un patrón de 11 años que se repite y un residuo sin estructura.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `seasonal_decompose(z, …)` | sobre √y | Se descompone la serie ya transformada, cuya varianza es más estable: así un modelo **aditivo** tiene sentido. |
| `model="additive"` | aditivo | z = T + S + R. |
| `period=11` | 11 años | La duración "de libro" del ciclo solar. El método exige un periodo **entero y fijo**. |
| `acf(resid, nlags=11)` | — | Si la descomposición funcionó, el residuo no debe tener autocorrelación. |
| F_S | fuerza estacional | Cerca de 1 si el patrón de 11 años explica casi toda la variación sin tendencia. |
@@ Código
```python
from statsmodels.tsa.seasonal import seasonal_decompose
from statsmodels.tsa.stattools import acf

desc_ad = seasonal_decompose(z, model="additive", period=11)
resid_ad = desc_ad.resid.dropna()
F_S_ad = max(0, 1 - resid_ad.var() / (desc_ad.seasonal + desc_ad.resid).dropna().var())
r_ad = acf(resid_ad, nlags=11)
print(f"Varianza del residuo / varianza de √y: {resid_ad.var() / z.var():.3f}")
print(f"Fuerza de la estacionalidad F_S = {F_S_ad:.3f}")
print("ACF del residuo en los rezagos 1, 5 y 11:", r_ad[[1, 5, 11]].round(2))
print("Patrón estacional (un ciclo de 11 años):", desc_ad.seasonal.iloc[:11].round(2).tolist())
```
@@ Resultado
```python oculto
ajuste_ad = desc_ad.trend + desc_ad.seasonal
grafica("lab-desc-ad", [linea(anios, z, "√manchas", "gris", 1.4),
                        linea(anios, ajuste_ad, "tendencia + patrón de 11 años", "rosa", 2.2)],
        alto=310, title={"text": "Lo que la descomposición aditiva cree que es la serie"}, xaxis={"title": {"text": "año"}})
grafica("lab-desc-ad-acf", correlograma(acf(resid_ad, nlags=25), len(resid_ad), "ACF del residuo"),
        alto=250, title={"text": "ACF del residuo de la descomposición aditiva"}, showlegend=False,
        xaxis={"title": {"text": "rezago (años)"}}, yaxis={"range": [-1.05, 1.05]})
```
@widget lab-graf id=lab-desc-ad
@widget lab-graf id=lab-desc-ad-acf
@@ Lectura
- **El patrón de 11 años es demasiado chico**: mide {{=desc_ad.seasonal.max() - desc_ad.seasonal.min()|.2f}} de pico a valle, mientras que los ciclos reales de √y suben desde valores cercanos a 0–3 hasta 7–14. Al promediar 28 ciclos que no están alineados, los picos de unos caen sobre los valles de otros y se cancelan en parte.
- En la gráfica, la curva rosa a veces va **en fase** con la serie y a veces **en contrafase** (por ejemplo, alrededor de 1780–1800): el "11" fijo se adelanta o se atrasa respecto a los ciclos reales.
- El residuo conserva **{{=100 * resid_ad.var() / z.var()|.0f}}%** de la varianza de la serie, y su ACF es enorme y oscilante: **{{=r_ad[1]|.2f}}** en el rezago 1, **{{=r_ad[5]|.2f}}** en el 5 y **{{=r_ad[11]|.2f}}** en el 11. Es el ciclo mismo, que la descomposición no capturó.
- La fuerza estacional es **F_S = {{=F_S_ad|.3f}}**, lejos del 0.64 que indica una estacionalidad fuerte.
@@ Decisión
❌ La descomposición aditiva con periodo 11 **no captura el ciclo**. Antes de culpar al periodo, el analista considera la otra explicación habitual: que el modelo debía ser **multiplicativo**, porque la amplitud del ciclo cambia con el nivel. El siguiente paso lo prueba con `model="multiplicative"` sobre la serie original.
:::

:::pastilla rojo | Aplicar · Descomposición multiplicativa con periodo 11 | u1:multiplicativo u1:aditivo
Probar si el problema era el tipo de modelo: en una descomposición **multiplicativa** el patrón se escala con el nivel (y = T · S · R), lo que en principio encaja con ciclos más altos en épocas más activas.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `model="multiplicative"` | multiplicativo | El patrón se aplica como un factor del nivel. |
| `y` (sin transformar) | escala original | La versión multiplicativa ya incluye el efecto del nivel; aplicarla a √y sería mezclar dos correcciones. |
| `try / except ValueError` | — | Se espera un error por los años con cero manchas; se captura para verlo y seguir. |
| `y + 1` | desplazamiento | El arreglo habitual para que el método acepte los ceros. |
@@ Código
```python
try:
    seasonal_decompose(y, model="multiplicative", period=11)
except ValueError as error:
    print("ValueError:", error)

desc_mul = seasonal_decompose(y + 1, model="multiplicative", period=11)
resid_mul = desc_mul.resid.dropna()
r_mul = acf(resid_mul, nlags=11)
print(f"\nCon y + 1: el residuo va de {resid_mul.min():.3f} a {resid_mul.max():.3f} (debería rondar 1)")
print("ACF del residuo en los rezagos 1, 5 y 11:", r_mul[[1, 5, 11]].round(2))
```
@@ Resultado
```python oculto
grafica("lab-desc-mul", [linea(desc_mul.resid.index.year, desc_mul.resid, "residuo multiplicativo", "dur", 1.6)],
        alto=270, title={"text": "Residuo de la descomposición multiplicativa (ideal: alrededor de 1)"}, showlegend=False,
        xaxis={"title": {"text": "año"}}, yaxis={"type": "log", "title": {"text": "residuo (escala log)"}},
        shapes=[{"type": "line", "x0": 1700, "x1": 2008, "y0": 1, "y1": 1, "line": {"color": PALETA["gris"], "dash": "dot"}}])
```
@widget lab-graf id=lab-desc-mul
@@ Lectura
- Primer intento: statsmodels **se niega**. La descomposición multiplicativa divide entre la tendencia y el patrón, así que no admite ceros.
- Con y + 1 sí corre, pero el residuo, que en un modelo multiplicativo debería oscilar cerca de 1, va de **{{=resid_mul.min()|.3f}}** a **{{=resid_mul.max()|.3f}}**: en algunos años el "residuo" multiplica la serie por 5 y en otros la divide entre 20. Los peores casos están en los mínimos, donde y + 1 es casi 1 y cualquier desfase entre el patrón fijo y el ciclo real se vuelve un cociente enorme.
- La ACF del residuo sigue igual de estructurada: {{=r_mul[1]|.2f}}, {{=r_mul[5]|.2f}} y {{=r_mul[11]|.2f}} en los rezagos 1, 5 y 11.
- Cambiar de aditivo a multiplicativo **no resolvió nada**. El problema no es cómo se combinan los componentes, sino el supuesto de un patrón **fijo** de 11 años.
@@ Decisión
❌ Descartada. La siguiente herramienta permite que el patrón **cambie** de un ciclo a otro y es robusta ante valores extremos: **STL** con periodo 11. Si tampoco funciona, la conclusión será que el ciclo solar no es una estacionalidad.
:::

:::pastilla amarillo | Aplicar · STL robusta con periodo 11 | u1:stl u1:stl-parametros u1:stl-robusto u1:fuerza
Darle a la idea de "estacionalidad de 11 años" su mejor oportunidad: STL deja que el patrón **evolucione** año con año y, con `robust=True`, reduce el peso de los ciclos atípicamente altos o bajos.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `STL(z, period=11)` | sobre √y | STL es aditiva; se usa la serie ya estabilizada. |
| `robust=True` | pesos bicuadrados | Los ciclos extremos (1957, el mínimo de Dalton) no deben deformar el patrón de los demás. |
| `seasonal=7` (por omisión) | 7 ciclos | Cada valor del patrón se estima con unos 7 ciclos vecinos: el patrón puede cambiar poco a poco. |
@@ Código
```python
from statsmodels.tsa.seasonal import STL

stl11 = STL(z, period=11, robust=True).fit()
r_stl = acf(stl11.resid, nlags=11)
F_S_stl = max(0, 1 - stl11.resid.var() / (stl11.seasonal + stl11.resid).var())
F_T_stl = max(0, 1 - stl11.resid.var() / (stl11.trend + stl11.resid).var())
print(f"F_S = {F_S_stl:.3f}   F_T = {F_T_stl:.3f}")
print("ACF del residuo en los rezagos 1, 5 y 11:", r_stl[[1, 5, 11]].round(2))
print(f"Varianza del residuo / varianza de √y: {stl11.resid.var() / z.var():.3f}")
print(f"Pesos robustos menores que 0.5: {(stl11.weights < 0.5).sum()} años")
```
@@ Resultado
```python oculto
grafica("lab-stl11", [linea(anios, z, "√manchas", "gris", 1.2),
                      linea(anios, stl11.trend + stl11.seasonal, "tendencia + patrón STL", "rosa", 2),
                      linea(anios, stl11.seasonal, "patrón de 11 años (STL)", "cel", 1.6)],
        alto=320, title={"text": "STL con periodo 11: el patrón ahora cambia de un ciclo a otro"}, xaxis={"title": {"text": "año"}})
grafica("lab-stl11-acf", correlograma(acf(stl11.resid, nlags=25), len(z), "ACF del residuo"),
        alto=240, title={"text": "ACF del residuo de STL"}, showlegend=False, xaxis={"title": {"text": "rezago (años)"}}, yaxis={"range": [-1.05, 1.05]})
```
@widget lab-graf id=lab-stl11
@widget lab-graf id=lab-stl11-acf
@@ Lectura
- STL lo hace **mucho mejor** que la clásica: la fuerza estacional sube de {{=F_S_ad|.3f}} a **{{=F_S_stl|.3f}}**, y el patrón (celeste) ya tiene una amplitud parecida a la de los ciclos reales, que cambia de un siglo a otro.
- Pero el residuo **sigue teniendo estructura**: ACF de **{{=r_stl[1]|.2f}}** en el rezago 1. Su varianza todavía es el {{=100 * stl11.resid.var() / z.var()|.0f}}% de la de la serie.
- La razón está en cómo trabaja STL: suaviza la subserie de cada "posición" del ciclo (la posición 1, 12, 23… juntas). Si un ciclo dura 9 años y el siguiente 14, esas posiciones **no corresponden a la misma fase** del ciclo solar. STL ajusta como puede, pero el desfase queda en el residuo.
- Los {{=(stl11.weights < 0.5).sum()}} años con peso robusto menor a 0.5 son, precisamente, los de los ciclos que se desfasaron más.
@@ Decisión
🟡 STL funciona **a medias**. La sospecha es que la duración del ciclo **no es fija**, y eso es medible directamente. El siguiente paso localiza cada mínimo solar y mide la duración de cada ciclo, sin suponer ningún periodo.
:::

:::pastilla azul | Aplicar · Medir la duración real de cada ciclo | u3:periodo-vs-ciclo u3:ciclo-solar
Localizar los **mínimos** de cada ciclo y medir cuánto dura cada uno. Si las duraciones varían mucho, el ciclo no puede tratarse como una estacionalidad, y eso explicaría los tres pasos anteriores.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `rolling(5, center=True)` | media de 5 años | Suaviza el ruido de año a año para que cada mínimo sea un solo punto y no varios valles pequeños. |
| `find_peaks(-suave, distance=7)` | picos de −y | Los mínimos de y son los máximos de −y. Con `distance=7` dos mínimos no pueden estar a menos de 7 años, porque ningún ciclo es tan corto. |
| desfase acumulado | real − (1711 + 11k) | Cuánto se habría equivocado un calendario fijo de 11 años contado desde el primer mínimo. |
@@ Código
```python
from scipy.signal import find_peaks

suave = y.rolling(5, center=True, min_periods=1).mean()
pos_min, _ = find_peaks(-suave.values, distance=7)
anios_min = anios[pos_min]
duraciones = np.diff(anios_min)
alturas = np.array([y.iloc[a:b].max() for a, b in zip(pos_min[:-1], pos_min[1:])])
desfase = anios_min - (anios_min[0] + 11 * np.arange(len(anios_min)))

ciclos = pd.DataFrame({"inicio": anios_min[:-1], "fin": anios_min[1:], "duración": duraciones,
                       "máximo del ciclo": alturas.round(1), "desfase vs. 11 fijo": desfase[1:]})
print(ciclos.to_string(index=False))
print(f"\nDuración: media {duraciones.mean():.2f}, desviación {duraciones.std(ddof=1):.2f}, "
      f"de {duraciones.min()} a {duraciones.max()} años")
print(f"Desfase máximo contra un calendario fijo de 11 años: {np.abs(desfase).max()} años")
```
@@ Resultado
```python oculto
grafica("lab-duraciones", [barras(ciclos["inicio"], ciclos["duración"], "duración del ciclo",
                                  ["rojo" if abs(d - 11) >= 2 else "lav" for d in ciclos["duración"]],
                                  width=7, hovertemplate="ciclo que empieza en %{x}: %{y} años<extra></extra>"),
                           linea([1705, 2000], [11, 11], "11 años", "rosa", 2, "dash"),
                           {**linea(ciclos["inicio"], ciclos["desfase vs. 11 fijo"], "desfase acumulado (eje derecho)", "dur", 2), "yaxis": "y2", "mode": "lines+markers"}],
        alto=330, title={"text": "Duración de cada ciclo solar y desfase contra un calendario de 11 años"},
        xaxis={"title": {"text": "año en que empieza el ciclo"}}, yaxis={"title": {"text": "años"}, "range": [0, 16]},
        yaxis2={"overlaying": "y", "side": "right", "title": {"text": "desfase (años)"}, "range": [-8, 8], "showgrid": False, "zeroline": True})
```
@widget lab-graf id=lab-duraciones
@@ Lectura
- Hay **{{=len(duraciones)}} ciclos completos**, con una duración media de **{{=duraciones.mean()|.2f}} años**: el "11" es correcto **en promedio**.
- Pero varían de **{{=duraciones.min()}} a {{=duraciones.max()}} años** (desviación {{=duraciones.std(ddof=1)|.2f}}). En la gráfica, las barras rojas son los ciclos que se alejan dos años o más de 11.
- Lo decisivo es el **desfase acumulado** (línea naranja): un calendario fijo de 11 años llega a equivocarse hasta **{{=np.abs(desfase).max()}} años**, casi **medio ciclo**. Con medio ciclo de error, el patrón fijo pone un máximo donde hay un mínimo, que es justo lo que se vio en la descomposición aditiva alrededor de 1780–1800.
- También varía la altura: el máximo de cada ciclo va de {{=alturas.min()|.1f}} a {{=alturas.max()|.1f}} manchas.
- Conclusión: el ciclo solar es un **ciclo cuasiperiódico** (periodo y amplitud variables), no una **estacionalidad** (periodo fijo ligado al calendario). Es la distinción de la Unidad III entre periodicidad y ciclo.
@@ Decisión
✋ La suposición S2 queda **descartada** con evidencia directa. Un ciclo de periodo variable se modela mejor como un proceso **autorregresivo**, cuya dinámica genera oscilaciones sin fijar su duración (Unidad II), y se describe mejor en el **dominio de la frecuencia**, donde aparece como una banda y no como una línea (Unidad III). Antes de modelar, el siguiente paso mira la memoria de la serie con gráficas de rezagos.
:::

:::pastilla azul | Aplicar · Gráficas de rezagos: y_t contra y_{t−k} | u1:lagplot u1:autocorr
Ver directamente cómo se relaciona cada año con el de 1, 5 y 11 años antes. El rezago 1 mide la inercia, el 5 o 6 (medio ciclo) debería dar una relación **negativa** y el 11 (un ciclo) una positiva.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `z.shift(k)` | k = 1, 5, 11 | Desplaza la serie k años: cada punto es (z_{t−k}, z_t). |
| `.corr()` | Pearson | La pendiente visual en un número. |
@@ Código
```python
corr_rezagos = {k: z.corr(z.shift(k)) for k in range(1, 13)}
print("Correlación de √y con su rezago k:")
print(pd.Series(corr_rezagos).round(3).to_string())
```
@@ Resultado
```python oculto
paneles, ejes = [], {}
for i, (k, col) in enumerate([(1, "lav"), (5, "rosa"), (11, "menta")]):
    sufijo = "" if i == 0 else str(i + 1)
    paneles.append({**puntos(z.shift(k), z, f"k = {k}", col, 5), "xaxis": "x" + sufijo, "yaxis": "y" + sufijo,
                    "hovertemplate": f"z(t−{k}) = %{{x:.2f}}<br>z(t) = %{{y:.2f}}<extra></extra>"})
    ejes["xaxis" + sufijo] = {"domain": [i / 3 + 0.03, (i + 1) / 3 - 0.03], "title": {"text": f"√y en t − {k}"}}
    ejes["yaxis" + sufijo] = {"anchor": "x" + sufijo, "title": {"text": "√y en t" if i == 0 else ""}}
grafica("lab-rezagos", paneles, alto=300, title={"text": "Gráficas de rezagos de √y"}, legend={"orientation": "h", "y": -0.28}, **ejes)
```
@widget lab-graf id=lab-rezagos
@@ Lectura
- **Rezago 1, correlación {{=corr_rezagos[1]|.3f}}**: mucha inercia. Un año activo casi siempre va seguido de otro activo.
- **Rezago 5, correlación {{=corr_rezagos[5]|.3f}}**: la nube cae hacia la derecha. Cinco años después de un año alto suele venir uno bajo (medio ciclo de distancia).
- **Rezago 11, correlación {{=corr_rezagos[11]|.3f}}**: vuelve a ser positiva, aunque menos que en el rezago 1, porque el desfase de los ciclos la "borronea".
- La correlación cambia de signo con k como una **onda amortiguada**: el sello de un proceso autorregresivo con raíces complejas (Unidad II, AR(2) con ciclo).
@@ Decisión
La serie tiene memoria fuerte y cíclica. Antes de elegir un modelo ARMA hay que decidir si es **estacionaria** o si necesita diferenciarse (la *d* de ARIMA). La gráfica de la serie, con sus oscilaciones largas, hace pensar a primera vista que **no** lo es (suposición S3). El siguiente paso aplica las pruebas ADF y KPSS.
:::
