## 🔍 Exploración de los datos (EDA) {#eda}
@mapa Conocer la serie antes de modelarla: su forma en el año, su distribución, cuándo sopla más, de dónde viene, cuánta energía produce y con qué otras variables se relaciona.

:::pastilla azul | Explorar · El viento de todo el año | u1:linea {#eda-serie}
Ver la serie completa. Con 8,760 horas la gráfica horaria es una mancha, así que se muestran el **promedio diario** y, como banda, el rango entre la hora más tranquila y la más ventosa de cada día.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `resample("D")` | media, mínimo y máximo diarios | Resume cada día sin perder sus extremos. |
| `resample("MS").mean()` | media mensual | El nivel de cada mes. |
@@ Código
```python
dia = y.resample("D").agg(["mean", "min", "max"])
por_mes = y.groupby(y.index.month).agg(["mean", "std", "min", "max"])
por_mes.index = MESES
print("Viento medio por mes (m/s):")
print(por_mes["mean"].round(1).to_string())
print(f"\nDía más ventoso: {dia['mean'].idxmax():%d/%m} ({dia['mean'].max():.1f} m/s) | más tranquilo: {dia['mean'].idxmin():%d/%m} ({dia['mean'].min():.1f} m/s)")
print(f"Hora más ventosa del año: {y.idxmax()} ({y.max():.1f} m/s)")
```
@@ Resultado
```python oculto
mes_ts = y.resample("MS").mean()
grafica("eda-serie", banda(dia.index, dia["min"], dia["max"], "mínimo y máximo del día") +
        [linea(dia.index, dia["mean"], "media diaria", "lav", 1.6),
         linea(mes_ts.index + pd.Timedelta(days=14), mes_ts, "media mensual", "rosa", 2.6, mode="lines+markers")],
        alto=330, title={"text": "Viento de MV01 en 2019"}, yaxis={"title": {"text": "m/s"}})
```
@widget lab-graf id=eda-serie
@@ Lectura
- El viento tiene **dos temporadas**: alta de noviembre a marzo (enero promedia {{=por_mes.loc['ene', 'mean']|.1f}} m/s) y baja de mayo a octubre (mayo, {{=por_mes.loc['may', 'mean']|.1f}}), con un repunte en **julio** ({{=por_mes.loc['jul', 'mean']|.1f}}).
- Dentro de cada temporada el viento **no es constante**: sube y baja en episodios de varios días. Hay días de más de 20 m/s y días de menos de 3 en el mismo mes.
- La banda entre el mínimo y el máximo de cada día es ancha (a menudo de más de 8 m/s): también cambia mucho **dentro** del día.
@@ Decisión
🔵 La serie tiene al menos tres escalas de variación: la **temporada**, los **episodios de días** y lo que pasa **dentro del día**. Cada una se estudia con su herramienta del temario.
:::

:::pastilla azul | Explorar · Resumen estadístico por mes | u1:estadisticos {#eda-resumen}
Calcular media, desviación estándar, mínimo y máximo del viento en cada mes. Si estos números cambian mucho de un mes a otro, la serie no tiene un solo nivel ni una sola variabilidad.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `describe()` | toda la serie | El resumen global. |
| `groupby(mes)` | 12 grupos | El resumen de cada mes. |
| coeficiente de variación | desviación / media | Compara la variabilidad de meses con niveles distintos. |
@@ Código
```python
print(y.describe().round(2).to_string())
por_mes["cv"] = por_mes["std"] / por_mes["mean"]
print("\nPor mes:")
print(por_mes.round(2).to_string())
print(f"\nLa desviación más grande ({por_mes['std'].idxmax()}) es {por_mes['std'].max() / por_mes['std'].min():.1f} veces la más chica ({por_mes['std'].idxmin()})")
```
@@ Resultado
```python oculto
tabla("eda-mes", ["mes", "media", "desviación", "mínimo", "máximo", "coef. de variación"],
      [[m, f"{r['mean']:.2f}", f"{r['std']:.2f}", f"{r['min']:.2f}", f"{r['max']:.2f}", f"{r['cv']:.2f}"] for m, r in por_mes.iterrows()],
      ["elegido" if r["mean"] == por_mes["mean"].max() else ("descartado" if r["mean"] == por_mes["mean"].min() else "") for _, r in por_mes.iterrows()],
      titulo="El viento de MV01 mes por mes (m/s)", nota="Verde: el mes más ventoso. Rojo: el más tranquilo.")
```
@widget lab-tabla id=eda-mes
@@ Lectura
- El viento medio del año es {{=y.mean()|.2f}} m/s, con una desviación de {{=y.std()|.2f}}: la variabilidad es grande comparada con el nivel.
- La **media cambia más del doble** entre meses (de {{=por_mes['mean'].min()|.1f}} a {{=por_mes['mean'].max()|.1f}} m/s) y la desviación cambia {{=por_mes['std'].max() / por_mes['std'].min()|.1f}} veces.
- Los meses ventosos (enero, noviembre) tienen el **coeficiente de variación más bajo**: cuando hay norte, el viento es alto y relativamente estable.
@@ Decisión
🔵 Que la media y la varianza cambien de un mes a otro es la primera señal de que la serie podría **no ser estacionaria**, una pregunta que la Unidad I responde con pruebas.
:::

:::pastilla azul | Explorar · La distribución del viento y la curva de Weibull | u1:estadisticos {#eda-hist}
Ver la forma de la distribución del viento horario. En ingeniería eólica se usa la **distribución de Weibull**, que solo toma valores positivos y puede ser asimétrica; se ajusta y se compara con el histograma.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `weibull_min.fit(y, floc=0)` | forma k y escala c | Con ubicación 0, como se hace con el viento. |
| asimetría | `skew()` | Positiva si la cola derecha es más larga. |
@@ Código
```python
from scipy import stats
k_w, _, c_w = stats.weibull_min.fit(y, floc=0)
print(f"Weibull: forma k = {k_w:.2f}, escala c = {c_w:.2f} m/s")
print(f"Media de la Weibull ajustada: {stats.weibull_min.mean(k_w, scale=c_w):.2f} m/s (la serie: {y.mean():.2f})")
print(f"Asimetría: {y.skew():.2f} | curtosis en exceso: {y.kurt():.2f}")
print(f"Horas con menos de 3.5 m/s (no alcanza para arrancar): {(y < 3.5).mean():.1%} | con más de 25 m/s (corte): {(y > 25).mean():.2%}")
```
@@ Resultado
```python oculto
cuentas, bordes = np.histogram(y, bins=np.arange(0, 27, 1))
xg = np.linspace(0.05, 26, 120)
grafica("eda-hist", [barras(bordes[:-1] + 0.5, cuentas / len(y), "horas (proporción)", "lav", width=0.95),
                     linea(xg, stats.weibull_min.pdf(xg, k_w, scale=c_w), f"Weibull (k = {k_w:.2f}, c = {c_w:.1f})", "rosa", 2.6)],
        alto=300, title={"text": "Distribución del viento horario"}, xaxis={"title": {"text": "m/s"}}, yaxis={"title": {"text": "proporción"}})
```
@widget lab-graf id=eda-hist
@@ Lectura
- La distribución es **asimétrica a la derecha** (asimetría {{=y.skew()|.2f}}) y la Weibull con k = {{=k_w|.2f}} y c = {{=c_w|.1f}} m/s la describe bien: es la forma típica del viento, con k cerca de 2.
- El {{=100 * (y < 3.5).mean()|.0f}}% de las horas tiene menos de 3.5 m/s y la turbina no puede arrancar; casi nunca se pasa de 25 m/s, la velocidad de corte.
- La curtosis en exceso es negativa: la distribución es más "plana" que una normal, sin colas extremas.
@@ Decisión
🔵 El viento no es normal ni puede ser negativo. Un modelo lineal puede pronosticar valores negativos en las calmas; se anota para la Unidad II, que trata las transformaciones.
:::

:::pastilla azul | Explorar · El año hora por hora: un mapa de calor | u1:estacional-graf {#eda-calor}
Acomodar las 8,760 horas en una matriz de **días por horas del día** y colorear cada celda con el viento. Así se ven a la vez el ciclo diario (de arriba abajo) y los episodios de varios días (de izquierda a derecha).
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| filas | 24 horas del día | El eje del ciclo diario. |
| columnas | 365 días | El eje del año. |
@@ Código
```python
matriz = y.to_frame("v").assign(dia=y.index.normalize(), hora=y.index.hour).pivot(index="hora", columns="dia", values="v")
print(f"Matriz de {matriz.shape[0]} horas por {matriz.shape[1]} días")
perfil = y.groupby(y.index.hour).mean()
print(f"Hora más ventosa en promedio: {perfil.idxmax()}:00 ({perfil.max():.2f} m/s) | más tranquila: {perfil.idxmin()}:00 ({perfil.min():.2f} m/s)")
```
@@ Resultado
```python oculto
grafica("eda-calor", [calor([d.strftime("%Y-%m-%d") for d in matriz.columns], list(matriz.index), matriz.values.tolist(), "viento", "Viridis", dec=1,
                            colorbar={"title": {"text": "m/s"}}, hovertemplate="%{x} %{y}:00<br>%{z:.1f} m/s<extra></extra>")],
        alto=340, title={"text": "Viento de cada hora del año"}, yaxis={"title": {"text": "hora del día"}, "dtick": 6}, xaxis={"type": "date"})
```
@widget lab-graf id=eda-calor
@@ Lectura
- **Las franjas verticales dominan**: el color cambia sobre todo de un día a otro y en bloques de varios días (los nortes, en amarillo, en enero, marzo, noviembre y diciembre).
- Las **franjas horizontales** son débiles: el ciclo diario existe (la hora más ventosa en promedio es la de las {{=perfil.idxmax()}}:00, con {{=perfil.max()|.1f}} m/s, y la más tranquila, las {{=perfil.idxmin()}}:00, con {{=perfil.min()|.1f}}), pero es pequeño frente a los cambios entre días.
- De abril a octubre se ve más la estructura diaria (el perfil horario medio de cada mes varía unos 2.5 a 3 m/s, contra 1.5 en enero y diciembre): con menos viento del norte, el calentamiento del día pesa más.
@@ Decisión
🔵 La diferencia entre la hora más y la menos ventosa es de solo {{=perfil.max() - perfil.min()|.1f}} m/s, contra una desviación de {{=y.std()|.1f}} m/s. El ciclo diario será una estacionalidad **débil**; la Unidad I medirá su fuerza.
:::

:::pastilla azul | Explorar · ¿De dónde viene el viento? La rosa de los vientos | u1:visualizacion {#eda-rosa}
Contar cuánto tiempo sopla el viento desde cada dirección y con qué fuerza. La **rosa de los vientos** es una gráfica polar: cada pétalo es una dirección y su largo, el porcentaje del tiempo.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| sectores | 16, de 22.5° | La rosa náutica estándar. |
| clases de velocidad | 0–5, 5–10, 10–15, 15–20 y más de 20 m/s | Para ver si los vientos fuertes vienen de otra dirección. |
| registros | 10 minutos | La dirección no se promedia bien por hora (359° y 1° promedian 180°). |
@@ Código
```python
SECTORES = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSO", "SO", "OSO", "O", "ONO", "NO", "NNO"]
d10 = s10[["WindDirMean", "WindSpdMean"]].dropna()
sector = ((d10["WindDirMean"] + 11.25) % 360 // 22.5).astype(int).map(dict(enumerate(SECTORES)))
clase = pd.cut(d10["WindSpdMean"], [0, 5, 10, 15, 20, 50], labels=["0–5", "5–10", "10–15", "15–20", "más de 20"])
rosa = pd.crosstab(sector, clase, normalize=True).reindex(SECTORES) * 100
print("% del tiempo por sector (los seis principales):")
print(rosa.sum(axis=1).sort_values(ascending=False).head(6).round(1).to_string())
del_norte = rosa.loc[["NNO", "N", "NNE"]].sum().sum()
print(f"\nDel norte (NNO, N, NNE): {del_norte:.0f}% del tiempo | de esos, con más de 10 m/s: {rosa.loc[['NNO', 'N', 'NNE'], ['10–15', '15–20', 'más de 20']].sum().sum():.0f}%")
viento_sector = d10.groupby(sector)["WindSpdMean"].mean().reindex(SECTORES)
print("Viento medio del sector N:", round(viento_sector["N"], 1), "m/s | del sector S:", round(viento_sector["S"], 1), "m/s")
```
@@ Resultado
```python oculto
COL_ROSA = {"0–5": "#d9d2f5", "5–10": "#a99be6", "10–15": "#7c69d6", "15–20": "#55459f", "más de 20": "#2f2560"}
grafica("eda-rosa", [{"type": "barpolar", "r": _vals(rosa[c]), "theta": SECTORES, "name": f"{c} m/s", "marker": {"color": COL_ROSA[c]},
                      "hovertemplate": "%{theta}: %{r:.1f}% del tiempo<extra>" + c + " m/s</extra>"} for c in rosa.columns],
        alto=380, title={"text": "Rosa de los vientos de MV01"},
        polar={"angularaxis": {"direction": "clockwise", "rotation": 90}, "radialaxis": {"ticksuffix": "%"}}, legend={"orientation": "h", "y": -0.1})
```
@widget lab-graf id=eda-rosa
@@ Lectura
- El viento viene **del norte** el {{=del_norte|.0f}}% del tiempo, casi todo del nor-noroeste. Y es el viento fuerte: el sector N promedia {{=viento_sector['N']|.1f}} m/s.
- Una segunda familia viene del **sureste** (SE, ESE, SSE), más débil.
- Del sur casi nunca sopla, y cuando lo hace es flojo ({{=viento_sector['S']|.1f}} m/s).
@@ Decisión
🔵 Es el patrón del **Istmo de Tehuantepec**: los nortes cruzan el istmo desde el Golfo de México. Los episodios de viento fuerte de la serie son esos nortes.
:::

:::pastilla azul | Explorar · La curva de potencia: del viento a la energía | u1:visualizacion {#eda-curva}
Construir la **curva de potencia** de la turbina: cuánta potencia produce con cada velocidad del viento. Se usan solo los registros sin paro y se toma la mediana en cada intervalo de medio m/s.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| intervalos | 0.5 m/s | El ancho que usa la norma IEC 61400-12. |
| sin paros | `~paro` | Los paros pondrían ceros a cualquier viento. |
| mediana | por intervalo | Resiste los registros raros. |
@@ Código
```python
ok_c = s10["WindSpdMean"].notna() & s10["RealPowerMean"].notna() & ~s10["paro"]
cls = pd.cut(s10.loc[ok_c, "WindSpdMean"], np.arange(0, 26, 0.5))
curva = s10.loc[ok_c, "RealPowerMean"].groupby(cls, observed=True).median()
curva.index = [iv.mid for iv in curva.index]
arranque = curva[curva > 20].index.min()
nominal = curva[curva > 0.97 * 2300].index.min()
print(f"Arranque: unos {arranque:.2f} m/s | potencia nominal (2,300 kW) desde unos {nominal:.2f} m/s")
pot_h = s10["RealPowerMean"].resample("h").mean()
print(f"Factor de planta de 2019: {pot_h.mean() / 2300:.1%} | energía del año: {pot_h.sum() / 1000:,.0f} MWh")
print(f"Horas del año en potencia nominal: {(y >= nominal).mean():.0%}")
```
@@ Resultado
```python oculto
mc = s10.loc[ok_c, ["WindSpdMean", "RealPowerMean"]].sample(2500, random_state=3).round({"WindSpdMean": 2, "RealPowerMean": 0})
grafica("eda-curva", [puntos(mc["WindSpdMean"], mc["RealPowerMean"], "registros sin paro", "gris", 3, opacity=0.35),
                      linea(curva.index, curva.values, "mediana (curva de potencia)", "rosa", 3)],
        alto=310, title={"text": "Curva de potencia de MV01"}, xaxis={"title": {"text": "viento (m/s)"}}, yaxis={"title": {"text": "potencia (kW)"}})
```
@widget lab-graf id=eda-curva
@@ Lectura
- La turbina arranca hacia los **{{=arranque|.2f}} m/s** y llega a su potencia nominal de 2,300 kW desde unos **{{=nominal|.2f}} m/s**. Entre esos valores la potencia crece muy rápido, aproximadamente con el cubo del viento.
- Por encima del nominal la potencia ya no cambia: el {{=100 * (y >= nominal).mean()|.0f}}% de las horas del año la turbina está "llena".
- En 2019 MV01 tuvo un **factor de planta** de {{=100 * pot_h.mean() / 2300|.0f}}% y produjo unos {{=pot_h.sum() / 1000|,.0f}} MWh.
@@ Decisión
🔵 Un error de pronóstico cuesta distinto según el viento: entre 5 y 13 m/s un error de 1 m/s cambia mucho la energía; arriba de 14 casi no. Se usa al final para traducir el pronóstico a energía.
:::

:::pastilla azul | Explorar · El viento y las otras variables del SCADA | u1:lagplot {#eda-variables}
Medir la relación del viento con la temperatura ambiente, la presión y la densidad del aire, a escala **horaria** y **diaria**. Una variable que se mueve con el viento podría ayudar a explicarlo (es lo que la Unidad II llamará *variable exógena*).
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `horaria` | promedios horarios | La escala del pronóstico. |
| `resample("D")` | promedios diarios | Quita el ciclo diario: deja ver la relación entre días. |
| correlación de Pearson | lineal | La medida más simple; puede no ver relaciones curvas. |
@@ Código
```python
horaria = s10[["AmbTempMean", "BaroPressMean", "AirDensityMean"]].resample("h").mean()
horaria["viento"] = y
diaria = horaria.resample("D").mean()
corr_tab = pd.DataFrame({"horaria": horaria.corr()["viento"], "diaria": diaria.corr()["viento"]}).drop("viento")
print(corr_tab.round(3).to_string())
print(f"\nTemperatura: de {horaria['AmbTempMean'].min():.1f} a {horaria['AmbTempMean'].max():.1f} °C | presión: de {horaria['BaroPressMean'].min():.0f} a {horaria['BaroPressMean'].max():.0f} hPa")
```
@@ Resultado
```python oculto
grafica("eda-presion", [puntos(diaria["BaroPressMean"], diaria["viento"], "días", "lav", 6, opacity=0.7,
                               customdata=[d.strftime("%d/%m") for d in diaria.index], hovertemplate="%{customdata}: %{x:.1f} hPa, %{y:.1f} m/s<extra></extra>")],
        alto=290, showlegend=False, title={"text": "Viento medio diario contra presión media diaria"},
        xaxis={"title": {"text": "presión (hPa)"}}, yaxis={"title": {"text": "viento (m/s)"}})
```
@widget lab-graf id=eda-presion
@@ Lectura
- El viento se relaciona **al revés con la temperatura** y **al derecho con la presión y la densidad**: los nortes traen aire frío, denso y de alta presión.
- Las correlaciones son **más fuertes con los promedios diarios** (presión {{=corr_tab.loc['BaroPressMean', 'diaria']|.2f}}, temperatura {{=corr_tab.loc['AmbTempMean', 'diaria']|.2f}}) que con los horarios: la relación es entre **días**, no entre horas. En la gráfica, los días de presión alta son casi siempre ventosos.
@@ Decisión
🔵 La presión y la temperatura acompañan a los nortes. Pero para pronosticar mañana habría que conocer la presión de mañana. Esa trampa (la *fuga de información*) se revisa en la Unidad II.
:::

:::pastilla azul | Explorar · Las seis turbinas del parque | u1:visualizacion {#eda-turbinas}
Comparar el viento diario de las seis turbinas que trae el archivo. Si todas suben y bajan juntas, el viento depende del tiempo atmosférico de la región y no de algo local de MV01.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `viento_parque` | promedios horarios de MV01 a MV06 | Sin imputar: se ven los huecos reales de cada turbina. |
| matriz de correlación | horaria | Cuánto se parecen entre todas. |
@@ Código
```python
cobertura = viento_parque.notna().mean()
print("Horas con dato en el año:", (100 * cobertura).round(0).astype(int).astype(str).add("%").to_dict())
corr_parque = viento_parque.corr()
print(f"\nCorrelación más baja entre dos turbinas: {corr_parque.min().min():.3f} | media: {corr_parque.values[np.triu_indices(6, 1)].mean():.3f}")
media_parque = viento_parque.mean()
print("Viento medio:", media_parque.round(2).to_dict())
```
@@ Resultado
```python oculto
COL_T = {"MV01": "osc", "MV02": "lav", "MV03": "cel", "MV04": "menta", "MV05": "mant", "MV06": "dur"}
vpd = viento_parque.resample("D").mean()
grafica("eda-turbinas", [linea(vpd.index, vpd[t].round(2), t, COL_T[t], 2.2 if t == "MV01" else 1.1) for t in vpd.columns],
        alto=320, title={"text": "Viento medio diario de las seis turbinas"}, yaxis={"title": {"text": "m/s"}})
grafica("eda-corr-parque", [calor(list(corr_parque.columns), list(corr_parque.index), corr_parque.values.tolist(), "correlación", "Purples",
                                  zmin=0.95, zmax=1, hovertemplate="%{x}–%{y}: %{z:.3f}<extra></extra>")],
        alto=300, title={"text": "Correlación horaria entre turbinas"}, yaxis={"autorange": "reversed"})
```
@widget lab-graf id=eda-turbinas
@widget lab-graf id=eda-corr-parque
@@ Lectura
- Las seis turbinas suben y bajan **juntas**: la correlación horaria más baja entre dos de ellas es {{=corr_parque.min().min()|.3f}}. El viento lo decide el tiempo atmosférico de la región.
- Difieren un poco en el **nivel** (de {{=media_parque.min()|.1f}} a {{=media_parque.max()|.1f}} m/s) por su posición en el parque.
- Varias tienen huecos grandes: MV03 solo tiene dato en el {{=100 * cobertura['MV03']|.0f}}% de las horas y MV06 en el {{=100 * cobertura['MV06']|.0f}}%, por el corte del archivo.
@@ Decisión
🔵 Lo que se aprenda con MV01 vale para el parque. Las otras turbinas sirven como **segunda medición** del mismo viento, algo que la Unidad III aprovecha con el espectro cruzado.
:::

:::pastilla azul | Explorar · Episodios de viento fuerte: los nortes | u1:est-vs-ciclo {#eda-episodios}
Identificar los **episodios** de viento fuerte: rachas de días seguidos con viento medio alto. Saber cuántos son y cuánto duran dice si el viento tiene "memoria" de varios días.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| día ventoso | media diaria mayor que 12 m/s | Bastante arriba de la media anual. |
| episodio | días ventosos consecutivos | Un norte dura varios días. |
@@ Código
```python
ventoso = dia["mean"] > 12
grupos = ventoso.ne(ventoso.shift()).cumsum()
episodios = ventoso.groupby(grupos).agg(inicio=lambda g: g.index[0], dias="size", es="first").query("es")
print(f"Días ventosos: {ventoso.sum()} | episodios: {len(episodios)} | duración media: {episodios['dias'].mean():.1f} días | el más largo: {episodios['dias'].max()} días")
print("Episodios por mes de inicio:", episodios["inicio"].dt.month.map(dict(enumerate(MESES, 1))).value_counts().to_dict())
largos = episodios.nlargest(3, "dias")
print("Los tres más largos:", [(f"{r['inicio']:%d/%m}", int(r["dias"])) for _, r in largos.iterrows()])
```
@@ Resultado
```python oculto
dur = episodios["dias"].value_counts().sort_index()
grafica("eda-episodios", [barras([str(k) for k in dur.index], dur.values, "episodios", "lav", hovertemplate="%{x} días: %{y} episodios<extra></extra>")],
        alto=250, showlegend=False, title={"text": "Duración de los episodios de viento fuerte"},
        xaxis={"title": {"text": "días seguidos con más de 12 m/s"}, "type": "category"}, yaxis={"title": {"text": "episodios"}})
```
@widget lab-graf id=eda-episodios
@@ Lectura
- Hubo **{{=len(episodios)}} episodios** de viento fuerte con {{=ventoso.sum()}} días en total. Duran en promedio {{=episodios['dias'].mean()|.1f}} días; el más largo, {{=episodios['dias'].max()}} días desde el {{=largos.iloc[0]['inicio'].strftime('%d/%m')}}.
- {{=(episodios['dias'] <= 3).sum()}} de los {{=len(episodios)}} duran de 1 a 3 días, pero {{=(episodios['dias'] >= 7).sum()}} duran una semana o más.
- Empiezan en cualquier mes, aunque son más frecuentes de diciembre a marzo y en julio.
@@ Decisión
🔵 Un episodio de varios días significa que **el viento de hoy dice mucho del de mañana**: la serie tiene memoria larga. Pero el inicio y el fin de un episodio no tienen fecha fija: es un **ciclo**, no una estacionalidad.
:::

:::pastilla azul | Explorar · Una semana de norte contra una semana tranquila | u1:linea {#eda-semanas}
Ver el viento **hora por hora** en dos semanas muy distintas. La gráfica anual promedia los días; aquí se ve cómo es la serie que se va a pronosticar.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| semana de norte | la de mayor viento medio | El régimen que más energía produce. |
| semana tranquila | la de menor viento medio | El otro extremo. |
@@ Código
```python
semanal = y.resample("W-MON", label="left", closed="left").mean()
sem_norte, sem_calma = semanal.idxmax(), semanal.idxmin()
v_norte = y[sem_norte:sem_norte + pd.Timedelta(hours=167)]
v_calma = y[sem_calma:sem_calma + pd.Timedelta(hours=167)]
print(f"Semana de norte: desde el {sem_norte:%d/%m}, media {v_norte.mean():.1f} m/s, desviación {v_norte.std():.1f}")
print(f"Semana tranquila: desde el {sem_calma:%d/%m}, media {v_calma.mean():.1f} m/s, desviación {v_calma.std():.1f}")
```
@@ Resultado
```python oculto
hrs = np.arange(168) / 24
grafica("eda-semanas", [linea(hrs, v_norte.values, f"semana del {sem_norte:%d/%m} (norte)", "osc", 2),
                        linea(hrs, v_calma.values, f"semana del {sem_calma:%d/%m} (tranquila)", "menta", 2)],
        alto=290, title={"text": "Dos semanas hora por hora"}, xaxis={"title": {"text": "días desde el lunes"}, "dtick": 1},
        yaxis={"title": {"text": "m/s"}})
```
@widget lab-graf id=eda-semanas
@@ Lectura
- En la semana de **norte** (desde el {{=sem_norte.strftime('%d/%m')}}) el viento ronda los {{=v_norte.mean()|.0f}} m/s con cambios bruscos de varias horas; casi no se ve un ciclo diario.
- En la semana **tranquila** (desde el {{=sem_calma.strftime('%d/%m')}}) el viento es bajo ({{=v_calma.mean()|.1f}} m/s) y sí aparece una **ondulación diaria**: sube en el día y baja en la noche.
- La variabilidad también es distinta: desviación de {{=v_norte.std()|.1f}} contra {{=v_calma.std()|.1f}} m/s.
@@ Decisión
🔵 La serie no se comporta igual todo el año: el ciclo diario y la variabilidad dependen del régimen. Es una pista de heterocedasticidad y de que un solo modelo lineal tendrá que promediar dos comportamientos.
:::

:::pastilla verde | Explorar · Lo que deja la exploración: preguntas para las unidades | u1:serie {#eda-preguntas}
Convertir lo que se vio en **preguntas concretas**, y anotar en qué parte del temario se responde cada una. Es el plan del resto del análisis.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| preguntas | 8 | Una por cada rasgo que mostró la exploración. |
@@ Código
```python
PREGUNTAS = [
    ("¿El ciclo diario es una estacionalidad de periodo 24? ¿Qué tan fuerte es?", "Unidad I: componentes, descomposición y STL"),
    ("¿El nivel cambia con la temporada? ¿Hay tendencia?", "Unidad I: estacionariedad, regresión de tendencia, ADF y KPSS"),
    ("¿La variabilidad cambia con el nivel o la temporada?", "Unidad I: pruebas de homocedasticidad; Unidad II: Box–Cox y ARCH"),
    ("¿Cuánta memoria tiene la serie: horas o días?", "Unidad I: ACF, PACF y Ljung–Box"),
    ("¿Qué tan bien pronostica algo muy simple?", "Unidad II: modelos de referencia"),
    ("¿Basta un AR, un MA, un ARMA? ¿Hace falta diferenciar?", "Unidad II: AR, MA, ARMA, ARIMA y SARIMA"),
    ("¿La presión o la temperatura ayudan a pronosticar?", "Unidad II: variables exógenas; Unidad III: coherencia y retrasos"),
    ("¿En qué escalas de tiempo está la variabilidad?", "Unidad III: periodograma, espectro y filtros"),
]
for i, (p, d) in enumerate(PREGUNTAS, 1):
    print(f"P{i}. {p}\n    → {d}")
```
@@ Lectura
- Cada rasgo de la exploración (temporadas, episodios, ciclo diario débil, varianza cambiante, relación con la presión) se volvió una pregunta con su lugar en el temario.
- Las preguntas P1 a P4 son de la **Unidad I**, P5 a P7 de la **Unidad II** y P8 de la **Unidad III**.
@@ Decisión
✅ Con la serie limpia y explorada empieza el temario. La Unidad I comienza por definir bien la serie de tiempo.
:::
