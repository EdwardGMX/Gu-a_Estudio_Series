## 🔍 Fase 1 · Exploración y transformación (Unidad I) {#fase-exploracion}
@mapa Cargar la serie, mirarla, describirla y encontrar una transformación que estabilice su varianza.

:::pastilla azul | Aplicar · Cargar los datos con un índice anual | u1:serie u1:pandas
Tener la serie como un objeto `pandas.Series` con un **índice de periodos anuales**. Así cada valor sabe a qué año pertenece, los cortes por fecha funcionan (`y["1790":"1830"]`) y statsmodels reconoce la frecuencia sin advertencias.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `sm.datasets.sunspots` | — | El dataset viene incluido en statsmodels: no hace falta descargar nada. |
| `pd.period_range(start="1700", …)` | periodos | Un **periodo** representa el año completo, no un instante. Es lo correcto para promedios anuales. |
| `freq="Y"` | anual | statsmodels la lee para fechar los pronósticos (2009, 2010, …) sin avisos de "frecuencia desconocida". |
| `name="manchas"` | — | Aparece en tablas y resúmenes de los modelos. |
@@ Código
```python
import numpy as np
import pandas as pd
import statsmodels.api as sm

datos = sm.datasets.sunspots.load_pandas().data        # columnas YEAR y SUNACTIVITY
print(datos.dtypes.to_string())

y = pd.Series(datos["SUNACTIVITY"].values,
              index=pd.period_range(start="1700", periods=len(datos), freq="Y"),
              name="manchas")
anios = y.index.year                                   # los años como enteros (cortes y gráficas)
print(f"\n{len(y)} años: de {y.index[0]} a {y.index[-1]} | frecuencia: {y.index.freqstr}")
print(y.head(3).to_string())
print("…")
print(y.tail(3).to_string())
```
@@ Lectura
- El año viene como número decimal (`YEAR` es `float64`), por eso se construye el índice con `period_range` en lugar de usar esa columna directamente.
- Son **{{=len(y)}} años consecutivos**, de {{=y.index[0]}} a {{=y.index[-1]}}, sin huecos: un dato por año.
- La frecuencia `Y-DEC` significa "anual, el año termina en diciembre". Es la que pandas asigna a los años calendario.
@@ Decisión
Con los datos listos, lo primero es **verlos**. Antes de calcular cualquier estadístico, una gráfica de línea muestra la forma general: si hay tendencia, ciclos, cambios de nivel o valores extremos. El siguiente paso grafica la serie completa y localiza los años más activos y los que no tuvieron manchas.
:::

:::pastilla azul | Aplicar · Graficar la serie completa | u1:linea u3:ciclo-solar
Ver la forma de la serie antes de suponer nada. En una gráfica de línea se distinguen la tendencia, los ciclos, los cambios de amplitud y los extremos.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `y.nlargest(5)` | 5 | Los cinco años más activos: dicen qué tan altos llegan los máximos. |
| `y[y == 0]` | — | Los años sin manchas: importan para elegir la transformación (el logaritmo de 0 no existe). |
| `y["1790":"1830"]` | 41 años | Un periodo que en la gráfica se ve inusualmente bajo, para cuantificarlo. |
@@ Código
```python
maximos = y.nlargest(5)
ceros = y[y == 0]
print("Los 5 años más activos:")
print(maximos.to_string())
print("\nAños con cero manchas:", list(ceros.index.year))
print(f"\nPromedio 1790–1830: {y['1790':'1830'].mean():.1f}  |  promedio de toda la serie: {y.mean():.1f}")
```
@@ Resultado
```python oculto
grafica("lab-serie", [linea(anios, y, "manchas por año", "osc", 1.4),
                      puntos(maximos.index.year, maximos, "5 máximos", "rosa", 9),
                      puntos(ceros.index.year, ceros, "años en cero", "rojo", 9)],
        alto=340, title={"text": "Número anual de manchas solares, 1700–2008"},
        xaxis={"title": {"text": "año"}}, yaxis={"title": {"text": "manchas"}},
        shapes=[{"type": "rect", "x0": 1790, "x1": 1830, "y0": 0, "y1": 1, "yref": "paper", "fillcolor": "rgba(238,138,95,.12)", "line": {"width": 0}}],
        annotations=[{"x": 1810, "y": 1, "yref": "paper", "text": "1790–1830", "showarrow": False, "font": {"size": 11, "color": "#c4643a"}}])
```
@widget lab-graf id=lab-serie
@@ Lectura
- **Hay un ciclo evidente**: picos y valles que se repiten más o menos cada 11 años (es el ciclo de Schwabe). Entre 1700 y 2008 caben unos 28 ciclos.
- **La altura de los picos cambia muchísimo.** El máximo absoluto es {{=maximos.index[0]}} con **{{=maximos.iloc[0]|.1f}}** manchas, y los cinco más altos son del siglo XX. En cambio, entre 1790 y 1830 (zona sombreada) el promedio fue **{{=y['1790':'1830'].mean()|.1f}}**, menos de la mitad del promedio general ({{=y.mean()|.1f}}). Es el **mínimo de Dalton**.
- **Hay {{=len(ceros)}} años con cero manchas** ({{=", ".join(str(a) for a in ceros.index.year)}}). La serie está acotada por abajo en 0, pero no por arriba.
- Cuando los picos son altos, la serie oscila con más amplitud: **la variabilidad parece crecer con el nivel**. Eso habrá que comprobarlo con números.
@@ Decisión
La gráfica sugiere una distribución asimétrica (muchos años bajos, pocos muy altos) y una varianza que depende del nivel. El siguiente paso calcula los **estadísticos descriptivos** y el **histograma** para medir esa asimetría.
:::

:::pastilla azul | Aplicar · Estadísticos descriptivos e histograma | u1:estadisticos u1:media u1:varianza
Resumir la distribución de los valores: centro, dispersión y forma. La asimetría y los ceros condicionan qué transformaciones son posibles y qué tan normales serán los residuos.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `stats.skew`, `stats.kurtosis` | scipy | Asimetría y curtosis en exceso (0 en una normal). |
| `np.histogram(…, bins=19, range=(0, 190))` | intervalos de 10 | Cubre de 0 al máximo (190.2) con clases fáciles de leer. |
@@ Código
```python
from scipy import stats

resumen = pd.Series({
    "n": len(y), "media": y.mean(), "mediana": y.median(), "desv. estándar": y.std(),
    "mínimo": y.min(), "máximo": y.max(),
    "asimetría": stats.skew(y), "curtosis (exceso)": stats.kurtosis(y),
    "años en cero": int((y == 0).sum())})
print(resumen.round(3).to_string())
conteos, bordes = np.histogram(y, bins=19, range=(0, 190))
```
@@ Resultado
```python oculto
centros = (bordes[:-1] + bordes[1:]) / 2
grafica("lab-hist", [barras(centros, conteos, "años", "lav", width=9.2, hovertemplate="%{x:.0f} ± 5 manchas: %{y} años<extra></extra>")],
        alto=290, title={"text": "Histograma del número anual de manchas"}, showlegend=False,
        xaxis={"title": {"text": "manchas"}}, yaxis={"title": {"text": "años"}},
        shapes=[{"type": "line", "x0": float(y.mean()), "x1": float(y.mean()), "y0": 0, "y1": 1, "yref": "paper", "line": {"color": PALETA["rosa"], "dash": "dash"}},
                {"type": "line", "x0": float(y.median()), "x1": float(y.median()), "y0": 0, "y1": 1, "yref": "paper", "line": {"color": PALETA["menta"], "dash": "dot"}}],
        annotations=[{"x": float(y.mean()), "y": 1, "yref": "paper", "text": "media", "showarrow": False, "xanchor": "left", "font": {"color": PALETA["rosa"]}},
                     {"x": float(y.median()), "y": 0.92, "yref": "paper", "text": "mediana", "showarrow": False, "xanchor": "right", "font": {"color": PALETA["menta"]}}])
```
@widget lab-graf id=lab-hist
@@ Lectura
- **Media {{=resumen['media']|.2f}} > mediana {{=resumen['mediana']|.1f}}**: la media se va a la derecha porque los años muy activos la jalan. Medio siglo de años bajos pesa menos que unos cuantos picos.
- **Asimetría {{=resumen['asimetría']|.3f}}**: cola larga a la derecha. El histograma lo confirma: la clase más poblada está cerca de cero y casi no hay años por arriba de 150.
- **Desviación estándar {{=resumen['desv. estándar']|.2f}}**, casi del tamaño de la media: la serie es muy variable en términos relativos (coeficiente de variación ≈ {{=resumen['desv. estándar']/resumen['media']|.2f}}).
- Una variable acotada en 0, asimétrica a la derecha y cuya dispersión parece crecer con el nivel es el caso típico en que **una transformación** ayuda a los modelos lineales.
@@ Decisión
La asimetría sola no prueba que la varianza dependa del nivel. Para eso se necesita ver **cómo cambia la dispersión a lo largo del tiempo**. El siguiente paso calcula la media y la desviación estándar móviles con una ventana de 11 años, la duración aproximada de un ciclo, para que cada ventana contenga un ciclo completo.
:::

:::pastilla azul | Aplicar · Media y desviación estándar móviles (ventana de 11 años) | u1:moviles
Ver si el **nivel** y la **dispersión** cambian con el tiempo, y si cambian juntos. Si la desviación sube cuando sube la media, la varianza depende del nivel (heterocedasticidad) y conviene transformar antes de modelar.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `rolling(11)` | 11 años | Una ventana de un ciclo completo promedia el sube y baja del ciclo y deja ver el nivel de fondo. Con una ventana de 5 años la media móvil seguiría el ciclo. |
| `center=True` | centrada | El valor de 1810 resume 1805–1815, no 1800–1810. |
| `.corr()` | Pearson | Un solo número para "¿suben juntas?". |
@@ Código
```python
media_movil = y.rolling(11, center=True).mean()
desv_movil = y.rolling(11, center=True).std()
r_nivel = media_movil.corr(desv_movil)
print(f"Correlación entre la media móvil y la desviación móvil: {r_nivel:.3f}")
moviles = pd.DataFrame({"media móvil": media_movil, "desv. móvil": desv_movil})
print(moviles.loc[["1715", "1810", "1870", "1957"]].round(1).to_string())
```
@@ Resultado
```python oculto
grafica("lab-moviles", [linea(anios, y, "manchas", "gris", 1),
                        linea(anios, media_movil, "media móvil (11 años)", "lav", 2.6),
                        linea(anios, desv_movil, "desviación móvil (11 años)", "rosa", 2.6)],
        alto=330, title={"text": "El nivel y la dispersión se mueven juntos"}, xaxis={"title": {"text": "año"}})
```
@widget lab-graf id=lab-moviles
@@ Lectura
- **La media móvil no es constante**: baja a {{=media_movil['1810']|.1f}} en el mínimo de Dalton y sube a {{=media_movil['1957']|.1f}} alrededor de 1957. Hay una variación lenta, de muchas décadas, debajo del ciclo de 11 años.
- **La desviación móvil sigue a la media casi exactamente**: en 1810 vale {{=desv_movil['1810']|.1f}} y en 1957 {{=desv_movil['1957']|.1f}}. La correlación entre las dos curvas es **{{=r_nivel|.3f}}**.
- Eso es heterocedasticidad **ligada al nivel**: cuando la actividad es alta, los ciclos son más amplios. Un modelo ARMA supone varianza constante del choque, así que sin transformar daría intervalos demasiado anchos en los mínimos y demasiado angostos en los máximos.
@@ Decisión
Hay que estabilizar la varianza. Para elegir la transformación con un criterio y no al tanteo, el siguiente paso mide **qué tan rápido crece la desviación con la media**. Si la desviación es proporcional a la media elevada a una potencia β, la transformación de Box-Cox con λ = 1 − β la estabiliza.
:::

:::pastilla azul | Aplicar · Medir cómo crece la dispersión con el nivel | u2:boxcox u1:log
Estimar **β en desv ∝ media^β** usando bloques de 11 años. Si β ≈ 1, la desviación es proporcional al nivel y el logaritmo (λ = 0) es la transformación indicada; si β ≈ 0.5, la raíz cuadrada (λ = 0.5).
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| bloques de 11 años | 28 bloques | Cada bloque es aproximadamente un ciclo: su media y su desviación no dependen de en qué parte del ciclo cae. |
| `np.polyfit(log media, log desv, 1)` | recta | En escala log-log la relación potencia se vuelve lineal: la pendiente es β. |
| `1 − pendiente` | λ sugerida | Regla de la familia Box-Cox: si desv ∝ media^β, la potencia λ = 1 − β iguala las varianzas. |
@@ Código
```python
grupo = np.arange(len(y)) // 11                        # 0,0,…(11 veces),1,1,…
bloques = pd.DataFrame({"media": y.groupby(grupo).mean(), "desv": y.groupby(grupo).std()})
bloques = bloques.iloc[: len(y) // 11]                 # solo bloques completos
beta, intercepto = np.polyfit(np.log(bloques["media"]), np.log(bloques["desv"]), 1)
lam_sugerida = 1 - beta
print(f"{len(bloques)} bloques de 11 años")
print(f"log(desv) = {intercepto:.3f} + {beta:.3f}·log(media)   →   λ sugerida = 1 − β = {lam_sugerida:.3f}")
```
@@ Resultado
```python oculto
xs = np.linspace(np.log(bloques["media"]).min(), np.log(bloques["media"]).max(), 20)
grafica("lab-beta", [puntos(np.log(bloques["media"]), np.log(bloques["desv"]), "un bloque de 11 años", "lav", 9,
                            text=[f"{1700 + 11 * i}–{1710 + 11 * i}" for i in bloques.index], hovertemplate="%{text}<br>log media %{x:.2f}<br>log desv %{y:.2f}<extra></extra>"),
                     linea(xs, intercepto + beta * xs, f"recta: pendiente β = {beta:.3f}", "rosa", 2.4)],
        alto=310, title={"text": "log(desviación) contra log(media), por bloques"},
        xaxis={"title": {"text": "log(media del bloque)"}}, yaxis={"title": {"text": "log(desviación del bloque)"}})
```
@widget lab-graf id=lab-beta
@@ Lectura
- Los 28 puntos forman casi una recta: la relación potencia describe bien los datos.
- La pendiente es **β = {{=beta|.3f}}**, prácticamente 1: la desviación es **proporcional al nivel**. Un ciclo con el doble de actividad promedio oscila el doble.
- La regla da **λ = 1 − β = {{=lam_sugerida|.3f}}**, muy cerca de 0, que corresponde al **logaritmo**. Esto coincide con la suposición inicial S1.
@@ Decisión
Todo apunta al logaritmo. El siguiente paso lo aplica directamente con `np.log(y)`. Hay una advertencia en el paso 2 (los años con cero manchas), pero lo natural es intentarlo y ver qué pasa.
:::

:::pastilla rojo | Aplicar · Logaritmo natural, `np.log(y)` | u1:log u2:log2
Aplicar el logaritmo, la transformación que sugirió el paso anterior, para que la desviación deje de depender del nivel.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `np.log(y)` | logaritmo natural | λ = 0 en la familia Box-Cox. |
| `np.errstate(divide="ignore")` | — | Silencia el aviso de división entre cero para poder ver el resultado completo. |
@@ Código
```python
with np.errstate(divide="ignore"):
    y_log = np.log(y)
infinitos = y_log[np.isinf(y_log)]
print("Valores infinitos:", len(infinitos), "→ años", list(infinitos.index.year))
print("Media del logaritmo:", y_log.mean())
print("Desviación del logaritmo:", y_log.std())
```
@@ Lectura
- **log(0) = −∞**: los {{=len(infinitos)}} años sin manchas se vuelven menos infinito, y con ellos la media ({{=y_log.mean()}}) y la desviación (`nan`) dejan de tener sentido. El aviso `invalid value encountered in subtract` es numpy calculando ∞ − ∞ dentro de la desviación.
- No se pueden **quitar** esos años. Son observaciones reales (los mínimos más profundos de la serie) y borrarlos rompería la secuencia anual que necesitan la ACF y los modelos ARMA.
- La regla de β ignoró un detalle: la relación desv ∝ media se estimó con bloques cuyos promedios **nunca son cero**, pero los años individuales sí lo son.
@@ Decisión
❌ El logaritmo puro **no es aplicable**. El arreglo habitual es sumar 1 antes de tomar el logaritmo: `np.log1p(y)` = log(y + 1), que vale 0 cuando no hay manchas. El siguiente paso lo prueba y mide si de verdad estabiliza la varianza.
:::

:::pastilla rojo | Aplicar · Logaritmo desplazado, `np.log1p(y)` = log(y + 1) | u2:log2 u1:moviles
Rescatar la idea del logaritmo evitando el problema de los ceros, y comprobar con la desviación móvil si la varianza queda estable.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `np.log1p(y)` | log(1 + y) | Está definido en 0 y es más preciso que `np.log(y + 1)` para valores pequeños. |
| `diagnostico_varianza(z)` | función propia | Se reutilizará con cada transformación candidata: asimetría y correlación entre media y desviación móviles. Lo ideal es que ambas queden cerca de 0. |
@@ Código
```python
y_log1 = np.log1p(y)

def diagnostico_varianza(z):
    """Asimetría y correlación nivel–dispersión de una serie transformada (ventanas de 11 años)."""
    mm, dm = z.rolling(11, center=True).mean(), z.rolling(11, center=True).std()
    return {"asimetría": stats.skew(z), "corr(media móvil, desv. móvil)": mm.corr(dm)}

comparacion = pd.DataFrame({"original": diagnostico_varianza(y), "log(y + 1)": diagnostico_varianza(y_log1)})
print(comparacion.round(3).to_string())
```
@@ Resultado
```python oculto
grafica("lab-log1p", [linea(anios, y_log1, "log(y + 1)", "osc", 1.3),
                      linea(anios, y_log1.rolling(11, center=True).std(), "desviación móvil de log(y + 1)", "rosa", 2.6)],
        alto=320, title={"text": "log(y + 1): los mínimos se vuelven pozos profundos"}, xaxis={"title": {"text": "año"}})
```
@widget lab-graf id=lab-log1p
@@ Lectura
- La correlación entre nivel y dispersión pasó de **{{=comparacion.loc['corr(media móvil, desv. móvil)', 'original']|.3f}}** a **{{=comparacion.loc['corr(media móvil, desv. móvil)', 'log(y + 1)']|.3f}}**: cambió de signo. Ahora la dispersión es **mayor cuando el nivel es bajo**.
- La asimetría pasó de {{=comparacion.loc['asimetría', 'original']|.3f}} a **{{=comparacion.loc['asimetría', 'log(y + 1)']|.3f}}**: la cola larga ahora está a la izquierda.
- La gráfica muestra por qué: el logaritmo **estira los valores pequeños**. Pasar de 1 a 10 manchas vale 1.7 unidades de log(y + 1), mientras que pasar de 100 a 190 vale solo 0.6. Cada mínimo se convierte en un pozo profundo, y la desviación móvil (rosa) se dispara justo en los periodos de baja actividad, como 1790–1830.
- El logaritmo **corrige de más**. Era de esperarse que λ = 0 fuera demasiado fuerte para una serie que toca el cero.
@@ Decisión
❌ log(y + 1) cambia un problema por otro. En lugar de seguir probando valores de λ a mano, el siguiente paso deja que **los datos elijan λ** por máxima verosimilitud con `scipy.stats.boxcox`.
:::

:::pastilla amarillo | Aplicar · Box-Cox con λ de máxima verosimilitud | u2:boxcox
Encontrar la potencia λ que hace los datos **lo más normales posible** (máxima verosimilitud de Box-Cox) y ver si estabiliza mejor la varianza que el logaritmo.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `stats.boxcox(y + 1, …)` | y + 1 | Box-Cox exige datos estrictamente positivos; el desplazamiento de 1 resuelve los ceros. |
| `alpha=0.05` | IC 95% | Devuelve también el intervalo de confianza de λ: si un valor "redondo" como 0.5 cae dentro, se puede usar sin perder nada. |
@@ Código
```python
y_bc, lam_bc, ic_bc = stats.boxcox(y + 1, alpha=0.05)
y_bc = pd.Series(y_bc, index=y.index)
print(f"λ de máxima verosimilitud = {lam_bc:.3f}   (IC 95%: {ic_bc[0]:.3f} a {ic_bc[1]:.3f})")
comparacion["Box-Cox"] = diagnostico_varianza(y_bc)
print(comparacion.round(3).to_string())
```
@@ Lectura
- **λ̂ = {{=lam_bc|.3f}}**, con intervalo de 95% de {{=ic_bc[0]|.3f}} a {{=ic_bc[1]|.3f}}. Ni el logaritmo (λ = 0) ni la raíz cuadrada (λ = 0.5) quedan dentro del intervalo.
- La transformación funciona: la asimetría queda en **{{=comparacion.loc['asimetría', 'Box-Cox']|.3f}}** (casi simétrica) y la correlación nivel–dispersión baja a **{{=comparacion.loc['corr(media móvil, desv. móvil)', 'Box-Cox']|.3f}}**.
- Tiene dos costos: depende del desplazamiento arbitrario "+1" (con +0.5 o +2 saldría otro λ), y λ = {{=lam_bc|.2f}} no tiene interpretación. Para regresar a la escala original hay que usar `inv_boxcox(·, λ) − 1`.
@@ Decisión
🟡 Box-Cox sirve, pero vale la pena compararla con una alternativa con **fundamento teórico**. El número de manchas es un **conteo**, y para conteos tipo Poisson la varianza es proporcional a la media, que es justo lo que se midió en el paso 5 en bloques. La transformación que estabiliza la varianza de un conteo es la **raíz cuadrada**. El siguiente paso compara las cuatro transformaciones lado a lado.
:::

:::pastilla verde | Aplicar · Raíz cuadrada como transformación de trabajo | u2:boxcox u2:regresar-escala
Comparar la **raíz cuadrada** con las otras transformaciones con los mismos criterios, y elegir una transformación de trabajo para el resto de la exploración.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `np.sqrt(y)` | λ = 0.5 | No necesita desplazamiento (√0 = 0), su inversa es elevar al cuadrado y es la transformación clásica para conteos. |
| razón de desviaciones | bloques de 28 años | Una medida más directa de estabilidad: la desviación del bloque más disperso entre la del menos disperso (1 sería perfecto). |
@@ Código
```python
z = np.sqrt(y)                                         # serie de trabajo: √manchas
comparacion["raíz"] = diagnostico_varianza(z)

def razon_desviaciones(s, tam=28):
    d = s.groupby(np.arange(len(s)) // tam).std()
    return d.max() / d.min()

comparacion.loc["desv. máx / desv. mín (bloques de 28 años)"] = [
    razon_desviaciones(s) for s in (y, y_log1, y_bc, z)]
print(comparacion.round(3).to_string())
```
@@ Resultado
```python oculto
fila_nombres = list(comparacion.index)
tabla("lab-transf", ["criterio (ideal)"] + list(comparacion.columns),
      [[f"{fila_nombres[0]} (0)"] + [f"{v:.3f}" for v in comparacion.iloc[0]],
       [f"{fila_nombres[1]} (0)"] + [f"{v:.3f}" for v in comparacion.iloc[1]],
       ["desv. máx / mín por bloques (1)"] + [f"{v:.2f}" for v in comparacion.iloc[2]]],
      titulo="Cuatro transformaciones con los mismos criterios")
grafica("lab-raiz", [linea(anios, z, "√manchas", "osc", 1.3),
                     linea(anios, z.rolling(11, center=True).std(), "desviación móvil de √y", "rosa", 2.6)],
        alto=310, title={"text": "√y: la dispersión ya no sigue al nivel"}, xaxis={"title": {"text": "año"}})
```
@widget lab-tabla id=lab-transf
@widget lab-graf id=lab-raiz
@@ Lectura
- **Contra la serie original**, la raíz mejora los tres criterios: la asimetría baja de {{=comparacion.loc['asimetría', 'original']|.3f}} a **{{=comparacion.loc['asimetría', 'raíz']|.3f}}**, la correlación nivel–dispersión de {{=comparacion.loc['corr(media móvil, desv. móvil)', 'original']|.3f}} a **{{=comparacion.loc['corr(media móvil, desv. móvil)', 'raíz']|.3f}}**, y la razón de desviaciones de {{=comparacion.loc['desv. máx / desv. mín (bloques de 28 años)', 'original']|.2f}} a **{{=comparacion.loc['desv. máx / desv. mín (bloques de 28 años)', 'raíz']|.2f}}**.
- **Contra log(y + 1)**, la raíz deja la serie más simétrica y con dispersión más pareja, y no invierte el problema. Su correlación sigue siendo positiva: corrige **parcialmente**, sin pasarse.
- **Box-Cox gana en los tres criterios**, como era de esperarse, porque su λ se eligió para optimizar justo eso. La diferencia con la raíz es pequeña en la razón de desviaciones ({{=comparacion.loc['desv. máx / desv. mín (bloques de 28 años)', 'Box-Cox']|.2f}} contra {{=comparacion.loc['desv. máx / desv. mín (bloques de 28 años)', 'raíz']|.2f}}) y mayor en la correlación.
- En la gráfica la desviación móvil de √y ya no se dispara en los máximos del siglo XX ni en los mínimos de 1800: oscila sin seguir al nivel.
@@ Decisión
✅ Se adopta **z = √y** como serie de trabajo: es simple, no tiene parámetros arbitrarios, tiene justificación teórica (conteos), quita la mayor parte de la dependencia entre nivel y dispersión y su inversa es elevar al cuadrado. La elección **queda en observación**: en el paso 33 se comparará con Box-Cox, log(y + 1) y la serie sin transformar, por la única métrica que importa al final, el error de pronóstico en validación cruzada.

El siguiente paso pone a prueba la suposición S2: que el ciclo de 11 años se puede tratar como una **estacionalidad de periodo 11**, con una descomposición clásica.
:::
