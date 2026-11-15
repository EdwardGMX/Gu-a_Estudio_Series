## 🔍 Fase 2b · Análisis exploratorio {#fase-eda}
@mapa Mirar la serie a lo largo del año, su distribución, la transformación que la vuelve más simétrica, el ciclo diario, la dirección del viento, la curva de potencia, el resto del parque y si la varianza es constante.

:::pastilla azul | Aplicar · El año completo: la serie, sus meses y un zoom horario | u1:linea u1:estadisticos u1:visualizacion {#eda-serie}
Ver la forma de la serie antes de suponer nada: niveles, cambios a lo largo del año, rachas y extremos. Con 8,760 horas, una sola gráfica no deja ver nada; se combinan el **promedio diario** del año y un **zoom de dos semanas** en resolución horaria.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `resample("D").mean()` | promedio diario | 365 puntos que muestran el comportamiento del año. |
| zoom | 1–14 de febrero | Dos semanas para ver el detalle horario y el ciclo diario. |
| `groupby(mes)` | media y desviación | Cuantifica el cambio de nivel y de dispersión a lo largo del año. |
@@ Código
```python
por_mes = y.groupby(y.index.month).agg(["mean", "std", "min", "max"])
por_mes.index = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"]
print(f"Viento horario de MV01 en 2019: media {y.mean():.2f} m/s, desviación {y.std():.2f}, de {y.min():.2f} a {y.max():.2f}")
print("\nPor mes (m/s):")
print(por_mes.round(2).to_string())
print(f"\nMes más ventoso: {por_mes['mean'].idxmax()} ({por_mes['mean'].max():.1f} m/s) | más calmado: {por_mes['mean'].idxmin()} ({por_mes['mean'].min():.1f} m/s)")
media_30d = y.rolling(24 * 30, center=True).mean()
print(f"Media móvil de 30 días: de {media_30d.min():.1f} a {media_30d.max():.1f} m/s")
```
@@ Resultado
```python oculto
y_dia = diario(y)
grafica("eda-anio", [linea(y_dia.index, y_dia, "promedio diario", "osc", 1.6),
                     linea(y_dia.index, y_dia.rolling(30, center=True).mean(), "media móvil de 30 días", "rosa", 2.6)],
        alto=320, title={"text": "Viento en MV01, 2019 (promedio de cada día)"}, yaxis={"title": {"text": "m/s"}},
        shapes=[{"type": "rect", "x0": "2019-10-20", "x1": "2019-12-31", "y0": 0, "y1": 1, "yref": "paper", "fillcolor": "rgba(63,174,138,.10)", "line": {"width": 0}}],
        annotations=[{"x": "2019-11-25", "y": 1, "yref": "paper", "text": "lo que será la prueba", "showarrow": False, "font": {"size": 11, "color": "#2f8a6c"}}])
zoom = y["2019-02-01":"2019-02-14"]
grafica("eda-zoom", [linea(zoom.index, zoom, "viento horario", "lav", 1.6)], alto=270,
        title={"text": "Zoom horario: 1 al 14 de febrero"}, yaxis={"title": {"text": "m/s"}}, showlegend=False)
```
@widget lab-graf id=eda-anio
@widget lab-graf id=eda-zoom
@@ Lectura
- **El nivel cambia mucho a lo largo del año.** Enero, noviembre y diciembre promedian más de 11 m/s; mayo apenas {{=por_mes.loc['may', 'mean']|.1f}}. Hay además un repunte en julio. La media móvil de 30 días va de {{=media_30d.min()|.1f}} a {{=media_30d.max()|.1f}} m/s.
- **El viento llega en episodios de varios días**: en el zoom de febrero hay rachas de 2 a 5 días con más de 15 m/s, separadas por días tranquilos. Esa escala de días (la escala **sinóptica**, la de los frentes y sistemas de presión) domina la serie.
- **El ciclo diario existe, pero se ve poco**: en los días tranquilos se nota una pequeña subida al mediodía; en los días de viento fuerte desaparece.
- La zona verde es lo que será el conjunto de prueba (el 20% final): cae en la **temporada más ventosa**, más alta que el promedio del entrenamiento.
@@ Decisión
Una serie que cambia tanto de nivel con la estación difícilmente tendrá una distribución simétrica. El siguiente paso mira su **distribución**.
:::

:::pastilla azul | Aplicar · La distribución del viento: histograma y Weibull | u1:estadisticos u1:normal {#eda-distribucion}
Describir la forma de la distribución. En energía eólica el viento se describe tradicionalmente con una **distribución de Weibull**, acotada en cero y con cola a la derecha.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `stats.weibull_min.fit(…, floc=0)` | ubicación en 0 | Ajusta la forma `k` y la escala `c`; el viento no puede ser negativo. |
| `stats.skew` | asimetría | 0 en una distribución simétrica. |
@@ Código
```python
from scipy import stats

k_weib, _, c_weib = stats.weibull_min.fit(y, floc=0)
print(f"Asimetría: {stats.skew(y):.3f} | curtosis (exceso): {stats.kurtosis(y):.3f}")
print(f"Weibull: forma k = {k_weib:.2f}, escala c = {c_weib:.2f} m/s")
print(f"Horas por debajo de 4 m/s (la turbina no arranca): {(y < 4).mean():.1%}")
print(f"Horas por arriba de 15 m/s (potencia nominal): {(y > 15).mean():.1%}")
conteos, bordes = np.histogram(y, bins=26, range=(0, 26))
```
@@ Resultado
```python oculto
centros = (bordes[:-1] + bordes[1:]) / 2
dens = conteos / conteos.sum()
xs = np.linspace(0.05, 26, 200)
grafica("eda-hist", [barras(centros, dens, "horas (proporción)", "lav", width=0.9, hovertemplate="%{x:.1f} m/s: %{y:.3f}<extra></extra>"),
                     linea(xs, stats.weibull_min.pdf(xs, k_weib, 0, c_weib), f"Weibull (k = {k_weib:.2f}, c = {c_weib:.1f})", "rosa", 2.6)],
        alto=290, title={"text": "Distribución del viento horario"}, xaxis={"title": {"text": "m/s"}}, yaxis={"title": {"text": "proporción"}})
```
@widget lab-graf id=eda-hist
@@ Lectura
- La asimetría es **positiva** ({{=stats.skew(y)|.2f}}): más horas tranquilas que muy ventosas y una cola a la derecha. La distribución no es normal.
- La Weibull ajusta bien la forma general con **k = {{=k_weib|.2f}}** (cerca de 2, el valor típico de sitios con viento constante) y **c = {{=c_weib|.1f}} m/s**, una escala muy alta: es un sitio de viento excepcional.
- La distribución tiene dos "jorobas" suaves: las horas de las temporadas tranquilas y las de los episodios intensos. Es la huella del cambio de nivel del paso anterior.
@@ Decisión
Los modelos ARIMA suponen errores con varianza constante y aproximadamente normales. Una distribución asimétrica, acotada en cero, suele tener **varianza que crece con el nivel**. El siguiente paso busca la transformación que lo corrige.
:::

:::pastilla verde | Aplicar · Box–Cox: la raíz cuadrada estabiliza la varianza | u2:boxcox u1:log u1:moviles {#eda-transformacion}
Encontrar una transformación que haga la dispersión **independiente del nivel** y la distribución más simétrica. Box–Cox estima el exponente λ por máxima verosimilitud.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `stats.boxcox` | λ estimado | λ = 1 es no transformar, λ = 0.5 es la raíz cuadrada, λ = 0 el logaritmo. |
| ventana | 7 días | Media y desviación móviles para medir si la dispersión sube con el nivel. |
| `log(y + 0.5)` | desplazamiento | El viento horario más bajo es {{=y.min()|.2f}}: el logaritmo exagera las horas casi en calma. |
@@ Código
```python
_, lam_bc = stats.boxcox(y)
print(f"λ de Box–Cox estimado: {lam_bc:.3f}\n")
comparacion = {}
for nombre, serie in {"y (sin transformar)": y, "√y": np.sqrt(y), "log(y + 0.5)": np.log(y + 0.5)}.items():
    media_m, desv_m = serie.rolling(24 * 7).mean(), serie.rolling(24 * 7).std()
    comparacion[nombre] = {"asimetría": stats.skew(serie), "corr(media móvil, desv. móvil)": media_m.corr(desv_m)}
comparacion = pd.DataFrame(comparacion)
print(comparacion.round(3).to_string())
z = np.sqrt(y).rename("raiz_viento")
```
@@ Resultado
```python oculto
mm_y = y.rolling(24 * 7).mean(); sd_y = y.rolling(24 * 7).std()
mm_z = z.rolling(24 * 7).mean(); sd_z = z.rolling(24 * 7).std()
sel = slice(None, None, 24)
grafica("eda-boxcox", [puntos(mm_y[sel], sd_y[sel], "y: nivel vs dispersión", "dur", 6),
                       puntos(mm_z[sel] * mm_y.mean() / mm_z.mean(), sd_z[sel] * sd_y.mean() / sd_z.mean(), "√y (reescalada)", "menta", 6)],
        alto=300, title={"text": "Dispersión semanal contra nivel semanal"}, xaxis={"title": {"text": "media móvil de 7 días"}},
        yaxis={"title": {"text": "desviación móvil de 7 días"}},
        nota="Cada punto es una ventana de 7 días. Para comparar en la misma gráfica, √y se reescaló a las unidades de y.")
```
@widget lab-graf id=eda-boxcox
@@ Lectura
- Box–Cox estima **λ = {{=lam_bc|.3f}}**, prácticamente **0.5: la raíz cuadrada**. Coincide con lo que se sabe del viento: la raíz de una Weibull con k ≈ 2 es casi normal.
- Sin transformar, la dispersión **sube con el nivel** (correlación {{=comparacion.loc['corr(media móvil, desv. móvil)', 'y (sin transformar)']|.2f}}): las semanas ventosas varían más. Con **√y** esa correlación desaparece ({{=comparacion.loc['corr(media móvil, desv. móvil)', '√y']|.3f}}) y la asimetría baja a {{=comparacion.loc['asimetría', '√y']|.2f}}.
- El logaritmo **corrige de más**: invierte la relación ({{=comparacion.loc['corr(media móvil, desv. móvil)', 'log(y + 0.5)']|.2f}}) y deja la asimetría negativa ({{=comparacion.loc['asimetría', 'log(y + 0.5)']|.2f}}), porque estira demasiado las horas de calma.
@@ Decisión
✅ Los modelos clásicos trabajarán con **z = √y**. Los pronósticos se regresarán a m/s elevando al cuadrado, y **los errores siempre se medirán en m/s**, que es lo que le importa a quien usa el pronóstico. Ahora, el ciclo diario: ¿existe, de qué tamaño es y es igual todo el año?
:::

:::pastilla azul | Aplicar · El ciclo diario a lo largo del año | u1:componentes u1:estacional-graf u1:subseries {#eda-diario}
Medir el **ciclo diario** (la "estacionalidad" de periodo 24 en datos horarios) y ver si cambia con los meses. Un mapa de calor de **hora del día × mes** muestra las dos cosas en una sola figura.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `groupby([mes, hora])` | 12 × 24 promedios | Un perfil diario para cada mes. |
| amplitud | máximo − mínimo del perfil | Qué tanto sube y baja el viento en un día típico de ese mes. |
@@ Código
```python
perfil = y.groupby([y.index.month, y.index.hour]).mean().unstack()
perfil.index = por_mes.index
amplitud = perfil.max(axis=1) - perfil.min(axis=1)
resumen_diario = pd.DataFrame({"media del mes": perfil.mean(axis=1), "amplitud diaria": amplitud,
                               "hora del máximo": perfil.idxmax(axis=1), "hora del mínimo": perfil.idxmin(axis=1)})
print(resumen_diario.round(2).to_string())
perfil_anual = y.groupby(y.index.hour).mean()
print(f"\nPerfil de todo el año: de {perfil_anual.min():.2f} m/s (a las {perfil_anual.idxmin()} h) a {perfil_anual.max():.2f} (a las {perfil_anual.idxmax()} h)")
```
@@ Resultado
```python oculto
exportar("eda-calor", {"t": [{"type": "heatmap", "z": perfil.values.round(2).tolist(), "x": list(range(24)), "y": list(perfil.index),
                              "colorscale": [[0, "#f3f0ff"], [0.5, "#9d8be3"], [1, "#45397a"]], "colorbar": {"title": {"text": "m/s"}},
                              "hovertemplate": "%{y}, %{x} h: %{z:.1f} m/s<extra></extra>"}],
                       "l": {"title": {"text": "Viento medio por hora del día y mes"}, "xaxis": {"title": {"text": "hora del día (UTC−6)"}, "dtick": 3},
                             "yaxis": {"autorange": "reversed"}}, "alto": 360, "nota": None})
```
@widget lab-graf id=eda-calor
@@ Lectura
- **Las franjas horizontales dominan**: el color cambia mucho más de un mes a otro que de una hora a otra. La diferencia entre meses es de hasta {{=por_mes['mean'].max() - por_mes['mean'].min()|.1f}} m/s; la amplitud diaria, de {{=amplitud.min()|.1f}} a {{=amplitud.max()|.1f}} m/s.
- En casi todos los meses el máximo llega **entre las 11 y las 15 h** y el mínimo de noche o de madrugada: cuando el sol calienta el suelo, el aire se mezcla y baja a la altura del rotor el viento más rápido de arriba. En enero el perfil es más plano (amplitud {{=amplitud['ene']|.1f}}) y su máximo cae de noche, porque dominan los episodios de viento del norte.
- La amplitud es mayor en los meses tranquilos (abril, julio, septiembre, alrededor de 3 m/s) y menor en los de nortes.
@@ Decisión
El ciclo diario es real pero **pequeño** frente a los cambios entre días y meses, y su forma cambia con la estación. Las fases 2c y Unidad III lo medirán formalmente con la STL y el espectro. Antes, la dirección del viento ayuda a entender de dónde vienen los episodios intensos.
:::

:::pastilla azul | Aplicar · Rosa de los vientos: de dónde viene el viento fuerte | u1:visualizacion {#eda-direccion}
Ver la **dirección** del viento y su intensidad por sector. Si los episodios fuertes vienen siempre del mismo lado, la dirección puede ser una variable útil para pronosticar.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `WindDirMean` | grados (0 = norte) | Dirección de donde viene el viento. |
| sectores | 16 de 22.5° | La rosa de los vientos clásica. |
| intensidad | menor a 8, 8 a 15, más de 15 m/s | Para ver de qué sectores vienen los vientos fuertes. |
@@ Código
```python
direccion = s10["WindDirMean"]
sector = ((direccion + 11.25) % 360 // 22.5).astype("Int64")
NOMBRES = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSO", "SO", "OSO", "O", "ONO", "NO", "NNO"]
rosa = pd.DataFrame({"sector": sector, "viento": s10["WindSpdMean"]}).dropna()
rosa["sector"] = rosa["sector"].map(dict(enumerate(NOMBRES)))
frecuencia = rosa["sector"].value_counts(normalize=True).reindex(NOMBRES).fillna(0) * 100
viento_sector = rosa.groupby("sector")["viento"].mean().reindex(NOMBRES)
print(pd.DataFrame({"% del tiempo": frecuencia, "viento medio (m/s)": viento_sector}).round(1).T.to_string())
del_norte = rosa["sector"].isin(["NNO", "N", "NNE"])
print(f"\nDel sector norte (NNO, N, NNE): {del_norte.mean():.0%} del tiempo y {(rosa['viento'] > 15)[del_norte].sum() / (rosa['viento'] > 15).sum():.0%} de los registros con más de 15 m/s")
```
@@ Resultado
```python oculto
trazas_rosa = []
for (lo, hi), col, nom in [((0, 8), "#c9c0f2", "menos de 8 m/s"), ((8, 15), "#9d8be3", "8 a 15 m/s"), ((15, 50), "#45397a", "más de 15 m/s")]:
    parte = rosa[(rosa["viento"] >= lo) & (rosa["viento"] < hi)]["sector"].value_counts().reindex(NOMBRES).fillna(0) / len(rosa) * 100
    trazas_rosa.append({"type": "barpolar", "r": parte.round(2).tolist(), "theta": NOMBRES, "name": nom, "marker": {"color": col},
                        "hovertemplate": "%{theta}: %{r:.1f}% del tiempo<extra>" + nom + "</extra>"})
exportar("eda-rosa", {"t": trazas_rosa, "l": {"title": {"text": "Rosa de los vientos de MV01"}, "polar": {"angularaxis": {"direction": "clockwise", "rotation": 90}},
                                             "legend": {"orientation": "h", "y": -0.1}}, "alto": 380, "nota": None})
```
@widget lab-graf id=eda-rosa
@@ Lectura
- **El viento viene casi siempre del norte**: los sectores NNO, N y NNE suman el {{=del_norte.mean() * 100|.0f}}% del tiempo, y de ahí sale el {{=(rosa['viento'] > 15)[del_norte].sum() / (rosa['viento'] > 15).sum() * 100|.0f}}% de los registros de más de 15 m/s.
- Los vientos del sur y del sureste son más débiles ({{=viento_sector['SSE']|.1f}} m/s en promedio desde el SSE contra {{=viento_sector['NNO']|.1f}} desde el NNO).
- Este patrón, con episodios fuertes del norte en invierno, es el de los **«nortes»**: aire frío que baja del Golfo de México y se acelera al cruzar un paso entre montañas. Es lo que se observa en el Istmo de Tehuantepec, aunque el dataset no lo confirma.
@@ Decisión
La dirección (como seno y coseno del ángulo) se probará como variable en la [[fase-caracteristicas|ingeniería de características]]. Ahora toca la relación que convierte el viento en dinero: la **curva de potencia**.
:::

:::pastilla azul | Aplicar · La curva de potencia y los paros | u1:linealidad u1:estadisticos {#eda-curva}
Ver cómo responde la potencia al viento. La curva de potencia es la que permitirá traducir el pronóstico de viento a energía al final del flujo, así que hay que estimarla **sin los paros**.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| intervalos de 0.5 m/s | `pd.cut` | La mediana de la potencia en cada intervalo es la curva empírica. La mediana no se deja arrastrar por los pocos registros anómalos. |
| sin paros | `~s10["paro"]` | Los paros no son parte de la respuesta de la turbina al viento. |
| muestra para graficar | 2,500 registros | Suficientes para ver la nube sin hacer pesada la página. |
@@ Código
```python
cortes = np.arange(0, 26.5, 0.5)
operando = s10.loc[~s10["paro"], ["WindSpdMean", "RealPowerMean"]].dropna()
curva = operando.groupby(pd.cut(operando["WindSpdMean"], cortes), observed=False)["RealPowerMean"].median()
curva.index = [iv.mid for iv in curva.index]
curva = curva.dropna()
arranque = curva[curva > 20].index.min()
nominal = curva[curva > 0.97 * 2300].index.min()
print(f"Velocidad de arranque (potencia > 20 kW): {arranque:.2f} m/s")
print(f"Llega al 97% de la potencia nominal desde: {nominal:.2f} m/s")
print(f"Velocidad más alta con producción: {curva[curva > 20].index.max():.2f} m/s")
print("\nCurva (m/s → kW), cada 2 m/s:")
print(curva.loc[[2.25, 4.25, 6.25, 8.25, 10.25, 12.25, 14.25, 16.25]].round(0).to_string())
```
@@ Resultado
```python oculto
muestra_c = s10[["WindSpdMean", "RealPowerMean", "paro"]].dropna().sample(2500, random_state=1)
grafica("eda-curva", [puntos(muestra_c.loc[~muestra_c["paro"], "WindSpdMean"], muestra_c.loc[~muestra_c["paro"], "RealPowerMean"], "operando", "cel", 4, opacity=0.5),
                      puntos(muestra_c.loc[muestra_c["paro"], "WindSpdMean"], muestra_c.loc[muestra_c["paro"], "RealPowerMean"], "en paro", "rojo", 5),
                      linea(curva.index, curva.values, "curva empírica (mediana)", "osc", 3)],
        alto=340, title={"text": "Potencia contra viento (registros de 10 minutos)"}, xaxis={"title": {"text": "viento (m/s)"}},
        yaxis={"title": {"text": "potencia (kW)"}})
```
@widget lab-graf id=eda-curva
@@ Lectura
- La curva tiene la forma clásica: nada por debajo de **{{=arranque|.1f}} m/s** (arranque), una subida que crece aproximadamente con el **cubo** del viento entre 5 y 12 m/s, y una meseta en los 2,300 kW desde unos **{{=nominal|.0f}} m/s**.
- Los puntos rojos son los **paros**: buen viento y producción cero. Si se hubieran incluido, la mediana en vientos altos bajaría y la curva quedaría sesgada.
- Esta no linealidad explica por qué es más fácil pronosticar el viento que la potencia: un error de 1 m/s en el viento vale casi nada en la meseta, pero cientos de kW en la subida.
@@ Decisión
La curva `curva` se guarda para el paso final [[energia|de viento a energía]]. El siguiente paso usa el resto del parque para comprobar que la medición de MV01 es coherente con la de sus vecinas.
:::

:::pastilla azul | Aplicar · El parque: correlación entre turbinas y un anemómetro que se apagó | u1:autocorr {#eda-parque}
Comparar el viento de MV01 con el de las otras turbinas del parque. Si todas ven el mismo viento, sirven para validar las mediciones y para imputar; una turbina que se aleja del resto delata un sensor dañado.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `viento_parque` | promedio horario | Las seis turbinas, con los ceros exactos ya convertidos en `NaN`. |
| `.corr()` | Pearson | Con todas las horas que cada pareja tiene en común. |
| datos por mes | `notna().mean()` | Para ver si alguna turbina dejó de reportar. |
@@ Código
```python
corr_parque = viento_parque.corr()
print("Correlación del viento horario con MV01:")
print(corr_parque["MV01"].round(3).to_string())
disponible = viento_parque.notna().groupby(viento_parque.index.month).mean().mul(100).round(0)
disponible.index = por_mes.index
print("\nPorcentaje de horas con viento válido, por mes:")
print(disponible.T.to_string())
```
@@ Resultado
```python oculto
exportar("eda-parque", {"t": [{"type": "heatmap", "z": disponible.T.values.tolist(), "x": list(disponible.index), "y": list(disponible.columns),
                               "colorscale": [[0, "#c94f4f"], [0.5, "#f6d36b"], [1, "#3fae8a"]], "zmin": 0, "zmax": 100,
                               "colorbar": {"title": {"text": "%"}}, "hovertemplate": "%{y}, %{x}: %{z:.0f}% de horas con dato<extra></extra>"}],
                        "l": {"title": {"text": "Horas con viento válido por turbina y mes"}}, "alto": 270, "nota": None})
```
@widget lab-graf id=eda-parque
@@ Lectura
- Todas las turbinas con datos ven el mismo viento: correlaciones de {{=corr_parque['MV01'].drop('MV01').min()|.3f}} a {{=corr_parque['MV01'].drop('MV01').max()|.3f}} con MV01. MV02, la más cercana en el número, es la más parecida.
- **MV03 dejó de reportar viento en julio** y no volvió: desde entonces su anemómetro marca exactamente 0 y su potencia también. En el archivo crudo eso aparece como "datos", no como huecos; solo la limpieza de ceros lo hizo visible.
- **MV06 termina en septiembre**: es la turbina que el límite de filas de Excel cortó a la mitad. Y **MV04** casi no tiene viento en mayo y junio: son sus miles de líneas truncadas.
@@ Decisión
La medición de MV01 es coherente con el parque y la imputación con MV02 está justificada. Falta revisar un supuesto de los modelos: que la **varianza sea constante**.
:::

:::pastilla amarillo | Aplicar · ¿Varianza constante? Levene por mes y Breusch–Pagan | u1:pruebas-varianza u2:heterocedasticidad {#eda-varianza}
Probar formalmente si la varianza cambia a lo largo del año, antes y después de la raíz cuadrada. La raíz corrige la dependencia del **nivel**; falta saber si queda otra fuente de cambio.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `levene` | 12 grupos (meses) | $H_0$: todos los meses tienen la misma varianza. Usa la mediana, así que es robusta a la asimetría. |
| `het_breuschpagan` | regresor: nivel semanal | $H_0$: la varianza no depende del nivel. Se aplica a las desviaciones respecto a la media móvil de 7 días. |
@@ Código
```python
from scipy.stats import levene
from statsmodels.stats.diagnostic import het_breuschpagan
import statsmodels.api as sm

pruebas_var = {}
for nombre, serie in {"y": y, "√y": z}.items():
    p_lev = levene(*[g.values for _, g in serie.groupby(serie.index.month)]).pvalue
    nivel = serie.rolling(24 * 7, center=True).mean()
    desvio = (serie - nivel).dropna()
    lm_bp, p_bp = het_breuschpagan(desvio.values, sm.add_constant(nivel.loc[desvio.index].values))[:2]
    pruebas_var[nombre] = {"Levene por mes (p)": p_lev, "Breusch–Pagan: LM": lm_bp, "Breusch–Pagan (p)": p_bp,
                           "R² de e² sobre el nivel": lm_bp / len(desvio)}
pruebas_var = pd.DataFrame(pruebas_var)
print(pruebas_var.map(lambda v: f"{v:.3g}").to_string())
desv_mes = z.groupby(z.index.month).std()
print(f"\nDesviación de √y por mes: de {desv_mes.min():.2f} ({por_mes.index[desv_mes.argmin()]}) a {desv_mes.max():.2f} ({por_mes.index[desv_mes.argmax()]})")
```
@@ Lectura
- Sin transformar, las dos pruebas rechazan: la varianza **depende del nivel** y **cambia por mes**.
- Con **√y**, el estadístico de Breusch–Pagan cae de {{=pruebas_var.loc['Breusch–Pagan: LM', 'y']|.0f}} a {{=pruebas_var.loc['Breusch–Pagan: LM', '√y']|.0f}}: el nivel explicaba el {{=100 * pruebas_var.loc['R² de e² sobre el nivel', 'y']|.1f}}% de la variación de los errores al cuadrado y ahora explica el {{=100 * pruebas_var.loc['R² de e² sobre el nivel', '√y']|.2f}}%. Todavía rechaza, pero con más de 8,500 horas cualquier efecto diminuto es "significativo": la raíz eliminó casi toda la dependencia del nivel, como se vio en [[eda-transformacion|Box–Cox]].
- Pero **Levene sigue rechazando** con √y: la desviación de √y va de {{=desv_mes.min()|.2f}} a {{=desv_mes.max()|.2f}} según el mes. Hay meses más "nerviosos" que otros, independientemente de su nivel.
@@ Decisión
🟡 La transformación resuelve una parte de la heterocedasticidad, no toda. Los intervalos de predicción de un modelo con varianza constante podrían quedar angostos en los meses nerviosos y anchos en los tranquilos. Se revisará con los residuos ([[res-arch|efecto ARCH]]). La Fase 2c pasa a la **estructura**: descomposición y estacionariedad.
:::
