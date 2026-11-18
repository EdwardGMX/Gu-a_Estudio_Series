## 📈 Unidad I · La serie de tiempo y su visualización {#u1-serie}
@mapa Qué hace del viento una serie de tiempo, cómo se construye bien en pandas y las gráficas de la Unidad I: de línea, estacional, de subseries, de rezagos y estadísticas móviles.

:::pastilla azul | Aplicar · Un proceso estocástico, una sola realización | u1:proceso {#u1-proceso}
Pensar el viento como un **proceso estocástico**: en cada hora hay una variable aleatoria, y lo que se observó en 2019 es **una sola realización** de todas las posibles. Una forma de ver la idea con datos reales es tratar cada día de enero como una "historia" de 24 horas del mismo proceso.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| días | los 31 de enero | Mismo mes, misma temporada: condiciones parecidas. |
| media por hora | promedio de los 31 días | Una estimación de la media del proceso en cada hora del día. |
@@ Código
```python
enero = y["2019-01"]
dias_ene = enero.to_frame("v").assign(dia=enero.index.day, hora=enero.index.hour).pivot(index="hora", columns="dia", values="v")
media_hora_ene = dias_ene.mean(axis=1)
print(f"Días: {dias_ene.shape[1]} | a las 13:00 el viento fue de {dias_ene.loc[13].min():.1f} a {dias_ene.loc[13].max():.1f} m/s")
print(f"Desviación entre días, promedio de las 24 horas: {dias_ene.std(axis=1).mean():.2f} m/s")
print(f"Rango de la media por hora: {media_hora_ene.min():.2f} a {media_hora_ene.max():.2f} m/s")
```
@@ Resultado
```python oculto
grafica("u1-proceso", [linea(dias_ene.index, dias_ene[d], f"{d} de enero", "gris", 0.8, showlegend=False, opacity=0.55) for d in dias_ene.columns]
        + [linea(media_hora_ene.index, media_hora_ene, "media de los 31 días", "rosa", 3.2)],
        alto=310, title={"text": "Los 31 días de enero: 31 historias del mismo proceso"}, xaxis={"title": {"text": "hora del día"}, "dtick": 3},
        yaxis={"title": {"text": "m/s"}})
```
@widget lab-graf id=u1-proceso
@@ Lectura
- Cada línea gris es un día de enero: a la misma hora del día el viento fue muy distinto (a las 13:00, de {{=dias_ene.loc[13].min()|.1f}} a {{=dias_ene.loc[13].max()|.1f}} m/s). La desviación entre días ronda los **{{=dias_ene.std(axis=1).mean()|.1f}} m/s**.
- La media de los 31 días (en rosa) es casi plana: entre {{=media_hora_ene.min()|.1f}} y {{=media_hora_ene.max()|.1f}} m/s. La diferencia **entre** días pesa mucho más que la forma **dentro** del día.
@@ Decisión
🔵 De 2019 solo existe **una** realización: para estimar la media, la varianza o la correlación del proceso hay que suponer que lo que pasa en distintos momentos se parece (la estacionariedad), porque no se puede repetir el año.
:::

:::pastilla verde | Aplicar · Los cinco elementos mínimos de la serie | u1:elementos {#u1-elementos}
Escribir los **cinco elementos** que definen la serie: qué se mide, en qué unidad, cada cuánto, durante qué periodo y cómo se obtuvo. Sin ellos, dos personas pueden estar hablando de series distintas.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `ELEMENTOS` | diccionario | Queda escrito junto al código, no solo en la cabeza del analista. |
@@ Código
```python
ELEMENTOS = {
    "variable": "velocidad media del viento en la góndola de la turbina MV01",
    "unidad": "metros por segundo (m/s)",
    "frecuencia": "horaria (promedio de 6 registros de 10 minutos)",
    "periodo": f"{y.index[0]:%d/%m/%Y %H:%M} a {y.index[-1]:%d/%m/%Y %H:%M}, {len(y):,} observaciones",
    "medición": "anemómetro del SCADA; hora estándar UTC−6; 3.3% de horas imputadas con la turbina MV02",
}
for k, v in ELEMENTOS.items():
    print(f"{k:>10}: {v}")
```
@@ Lectura
- La serie queda definida sin ambigüedad: viento medio horario de MV01, en m/s, durante todo 2019, con {{=len(y)|,}} observaciones.
- La medición incluye las decisiones de la limpieza: el reloj fijo UTC−6 y las horas imputadas. Quien use la serie debe saberlo.
@@ Decisión
✅ Los cinco elementos están escritos. La frecuencia horaria y el periodo de un año determinan qué ciclos se pueden estudiar: el diario sí, el anual apenas (un solo ciclo).
:::

:::pastilla azul | Aplicar · No se vale barajar | u1:iid {#u1-barajar}
Comprobar que el **orden** de los datos importa. Si se barajan las horas, la distribución queda idéntica (mismos valores), pero la serie pierde su forma. Esa es la diferencia con los datos i.i.d. de la estadística básica.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `rng.permutation` | barajar las 8,760 horas | Conserva los valores, destruye el orden. |
| cambio medio entre horas | promedio de \|y<sub>t</sub> − y<sub>t−1</sub>\| | Mide qué tan "pegada" está cada hora a la anterior. |
@@ Código
```python
rng_b = np.random.default_rng(7)
barajada = pd.Series(rng_b.permutation(y.values), index=y.index)
print(f"Media: original {y.mean():.3f} | barajada {barajada.mean():.3f}")
print(f"Desviación: original {y.std():.3f} | barajada {barajada.std():.3f}")
print(f"Cambio medio entre horas consecutivas: original {y.diff().abs().mean():.2f} m/s | barajada {barajada.diff().abs().mean():.2f} m/s")
```
@@ Resultado
```python oculto
sem = slice("2019-03-04", "2019-03-10")
control("u1-barajar", [{"etiqueta": "Serie", "tipo": "seg", "textos": ["original", "barajada"], "inicial": 0}],
        [[linea(y[sem].index, y[sem], "viento original", "osc", 1.8)], [linea(barajada[sem].index, barajada[sem], "viento barajado", "dur", 1.4)]],
        textos=[f"Cambio medio entre horas: <b>{y.diff().abs().mean():.2f} m/s</b>. Cada hora se parece a la anterior.",
                f"Cambio medio entre horas: <b>{barajada.diff().abs().mean():.2f} m/s</b>. Mismos valores, sin ninguna continuidad."],
        alto=280, title={"text": "Una semana de marzo, en su orden y barajada"}, yaxis={"title": {"text": "m/s"}, "range": [0, 26]})
```
@widget lab-control id=u1-barajar
@@ Lectura
- La serie barajada tiene **exactamente** la misma media ({{=barajada.mean()|.2f}}) y desviación ({{=barajada.std()|.2f}}) que la original: para la estadística i.i.d. serían la misma muestra.
- Pero el cambio medio entre horas consecutivas sube de **{{=y.diff().abs().mean()|.2f}} a {{=barajada.diff().abs().mean()|.2f}} m/s**. En la gráfica, la original es una curva continua y la barajada, ruido.
@@ Decisión
🔵 La información útil para pronosticar está en el **orden**: cada hora se parece a la anterior. Por eso en series de tiempo no se baraja nunca, ni para dividir los datos ni para validar.
:::

:::pastilla verde | Aplicar · Construir la serie correctamente en pandas | u1:pandas {#u1-pandas}
Revisar que el objeto `y` sea una serie de tiempo **bien construida**: índice de fechas, ordenado, sin duplicados, con frecuencia fija y sin faltantes. Y practicar las operaciones básicas: seleccionar por fecha, cambiar de frecuencia y desplazar.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `y.index.freq` | `"h"` | Muchas funciones de statsmodels la necesitan para pronosticar fechas. |
| `asfreq("h")` | fija la frecuencia | Si faltara una hora, aparecería como `NaN`. |
| `y.loc["2019-07"]` | selección por texto | pandas entiende fechas parciales. |
@@ Código
```python
y = y.asfreq("h")
print(type(y.index).__name__, "| frecuencia:", y.index.freqstr, "| ordenado:", y.index.is_monotonic_increasing,
      "| duplicados:", y.index.duplicated().sum(), "| NaN:", y.isna().sum())
print(f"\nJulio: {len(y.loc['2019-07'])} horas, media {y.loc['2019-07'].mean():.2f} m/s")
print("Primeras horas del 2 de enero:")
print(y.loc["2019-01-02 00:00":"2019-01-02 03:00"].round(2).to_string())
print(f"\nPromedios semanales: {len(y.resample('W').mean())} semanas | mensuales: {len(y.resample('MS').mean())} meses")
```
@@ Lectura
- El índice es un `DatetimeIndex` con frecuencia **h**, ordenado, sin duplicados y sin `NaN`: cumple los requisitos de la Unidad I.
- pandas entiende fechas parciales (`y.loc['2019-07']` da las {{=len(y.loc['2019-07'])}} horas de julio) y cambia de frecuencia con `resample` (53 semanas, 12 meses).
@@ Decisión
✅ La serie está lista para todas las funciones del temario.
:::

:::pastilla verde | Aplicar · La gráfica de línea, a distintas escalas | u1:linea {#u1-linea}
Dibujar la serie con su **gráfica de línea** a cuatro escalas. Cada escala muestra un componente distinto: el año muestra la temporada, el mes muestra los episodios, la semana muestra el paso de un régimen a otro y el día muestra la forma hora por hora.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| año | media diaria | 365 puntos en lugar de 8,760. |
| mes, semana, día | horario | Marzo, la segunda semana de marzo y el 12 de marzo. |
@@ Código
```python
ESCALAS = {"año (media diaria)": y.resample("D").mean(), "marzo (horario)": y["2019-03"],
           "una semana": y["2019-03-11":"2019-03-17"], "un día": y["2019-03-12"]}
for k, s in ESCALAS.items():
    print(f"{k:>20}: {len(s):>4} puntos, de {s.min():5.1f} a {s.max():5.1f} m/s")
```
@@ Resultado
```python oculto
control("u1-linea", [{"etiqueta": "Escala", "tipo": "seg", "textos": list(ESCALAS), "inicial": 0}],
        [[linea(s.index, s.round(2), "viento", "lav", 1.6 if i < 2 else 2.2, mode="lines" if i < 3 else "lines+markers")] for i, s in enumerate(ESCALAS.values())],
        textos=["La temporada: nortes en invierno, calma en mayo y agosto.", "Los episodios: varios días seguidos de viento fuerte o débil.",
                "El cambio de régimen: un norte que empieza y termina.", "La forma hora por hora: cambios suaves, sin saltos."],
        alto=290, showlegend=False, title={"text": "La misma serie a cuatro escalas"}, yaxis={"title": {"text": "m/s"}})
```
@widget lab-control id=u1-linea
@@ Lectura
- **El año** muestra la temporada de nortes (noviembre a marzo) y la calma de mayo y agosto.
- **Marzo** muestra episodios de varios días: el viento pasa de menos de 1 a más de 22 m/s en el mismo mes.
- **La semana** muestra cómo entra y sale un norte en pocas horas.
- **El día** muestra cambios suaves de hora a hora: no hay saltos aleatorios.
@@ Decisión
✅ Ninguna escala sola cuenta toda la historia. La gráfica de línea a varias escalas es el primer paso de cualquier análisis.
:::

:::pastilla azul | Aplicar · Gráfica estacional: el perfil diario de cada mes | u1:estacional-graf {#u1-estacional}
Dibujar la **gráfica estacional** con el periodo de 24 horas: una línea por mes, con el viento medio de cada hora del día. Si las líneas tienen la misma forma, la estacionalidad diaria es estable; si cambian, depende de la temporada.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| periodo | 24 horas | El candidato a estacionalidad de una serie horaria. |
| `groupby([mes, hora])` | 12 × 24 promedios | Un perfil por mes. |
@@ Código
```python
perfil_mes = y.groupby([y.index.month, y.index.hour]).mean().unstack()
perfil_mes.index = MESES
amp_mes = perfil_mes.max(axis=1) - perfil_mes.min(axis=1)
hora_max = perfil_mes.idxmax(axis=1)
print("Amplitud del perfil diario por mes (m/s):", amp_mes.round(1).to_dict())
print("Hora del máximo:", hora_max.to_dict())
```
@@ Resultado
```python oculto
COLM = ["#2f2560", "#45397a", "#55459f", "#7c69d6", "#3fae8a", "#7fc9a8", "#d9a520", "#ee8a5f", "#e0709f", "#c94f4f", "#4f9fd8", "#2d6fa3"]
grafica("u1-estacional", [linea(list(range(24)), perfil_mes.loc[m], m, COLM[i], 2.2 if m in ("ene", "may", "jul") else 1.2) for i, m in enumerate(MESES)],
        alto=330, title={"text": "Gráfica estacional: viento medio por hora del día, un mes por línea"}, xaxis={"title": {"text": "hora del día"}, "dtick": 3},
        yaxis={"title": {"text": "m/s"}})
```
@widget lab-graf id=u1-estacional
@@ Lectura
- En casi todos los meses el viento **sube al mediodía** (máximo entre las 11 y las 15 h) y **baja de madrugada**: hay un ciclo diario.
- La amplitud del ciclo (máximo menos mínimo del perfil) es pequeña: de {{=amp_mes.min()|.1f}} m/s (enero y diciembre) a {{=amp_mes.max()|.1f}} (julio y septiembre). Las líneas de los meses están separadas mucho más de lo que cada una sube y baja.
- La forma cambia con la temporada: en los meses de norte el perfil es casi plano.
@@ Decisión
🔵 Hay estacionalidad diaria, pero es **débil** y su amplitud **cambia con el mes**. La diferencia entre meses (la temporada) es mucho mayor que el ciclo diario.
:::

:::pastilla azul | Aplicar · Boxplot por hora y por mes | u1:estacional-graf {#u1-boxplot}
Complementar la gráfica estacional con **diagramas de caja**: además del promedio, muestran la dispersión de cada hora del día y de cada mes. Así se ve si la estacionalidad es grande comparada con la variación normal.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| por hora | 24 cajas | La estacionalidad diaria. |
| por mes | 12 cajas | La temporada. |
| `boxpoints=False` | sin puntos | 365 o 730 puntos por caja no se distinguen. |
@@ Código
```python
iqr_hora = y.groupby(y.index.hour).quantile(0.75) - y.groupby(y.index.hour).quantile(0.25)
mediana_hora = y.groupby(y.index.hour).median()
print(f"Mediana por hora: de {mediana_hora.min():.1f} a {mediana_hora.max():.1f} m/s | rango intercuartil típico: {iqr_hora.mean():.1f} m/s")
mediana_mes = y.groupby(y.index.month).median()
print(f"Mediana por mes: de {mediana_mes.min():.1f} a {mediana_mes.max():.1f} m/s")
```
@@ Resultado
```python oculto
control("u1-boxplot", [{"etiqueta": "Agrupar por", "tipo": "seg", "textos": ["hora del día", "mes"], "inicial": 0}],
        [[cajas({h: y[y.index.hour == h].values for h in range(24)}, "por hora", "lav")], [cajas({MESES[m - 1]: y[y.index.month == m].values for m in range(1, 13)}, "por mes", "menta")]],
        alto=320, showlegend=False, title={"text": "Diagramas de caja del viento horario"}, yaxis={"title": {"text": "m/s"}},
        lv=[{"xaxis": {"title": {"text": "hora del día"}}}, {"xaxis": {"title": {"text": "mes"}}}])
```
@widget lab-control id=u1-boxplot
@@ Lectura
- **Por hora**, las medianas van de {{=mediana_hora.min()|.1f}} a {{=mediana_hora.max()|.1f}} m/s, pero cada caja tiene un rango intercuartil de unos {{=iqr_hora.mean()|.0f}} m/s: las cajas se enciman casi por completo.
- **Por mes**, las medianas van de {{=mediana_mes.min()|.1f}} a {{=mediana_mes.max()|.1f}} m/s y las cajas se separan claramente: enero, marzo, noviembre y diciembre están arriba; mayo y agosto, abajo.
@@ Decisión
🔵 La hora del día explica poco del viento; el mes explica mucho más. Pero con un solo año, la "estacionalidad anual" es un solo ciclo: no se puede saber si se repite.
:::

:::pastilla azul | Aplicar · Gráfica de subseries por hora del día | u1:subseries {#u1-subseries}
Dibujar las **subseries de ciclo**: para cada hora del día, la serie de sus 365 valores (uno por día) con su media. Permite ver a la vez si la media cambia entre horas (estacionalidad) y cómo evoluciona cada hora a lo largo del año.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| subseries | 24, una por hora | La subserie de la hora h son los valores de todos los días a esa hora. |
| suavizado | media de 7 días de cada subserie | Para que se vea la forma en el año. |
@@ Código
```python
subseries = {h: y[y.index.hour == h].rolling(7, center=True, min_periods=1).mean().values for h in range(24)}
medias_sub = pd.Series({h: y[y.index.hour == h].mean() for h in range(24)})
print("Media de cada subserie (m/s):")
print(medias_sub.round(2).values.reshape(4, 6))
```
@@ Resultado
```python oculto
tr_sub = []
for h in range(0, 24, 2):
    xs = h + np.linspace(0.05, 1.85, 365)[::2]
    tr_sub.append(linea(xs.round(3), subseries[h][::2].round(2), f"{h}:00", "gris", 0.9, showlegend=False, hovertemplate=f"{h}:00<br>%{{y:.1f}} m/s<extra></extra>"))
    tr_sub.append(linea([h + 0.05, h + 1.85], [medias_sub[h]] * 2, "media de la subserie", "rosa", 2.6, showlegend=(h == 0)))
grafica("u1-subseries", tr_sub, alto=310, title={"text": "Subseries de las horas pares: cada tramo es un año de esa hora"},
        xaxis={"title": {"text": "hora del día"}, "tickvals": list(range(1, 24, 2)), "ticktext": [f"{h}" for h in range(0, 24, 2)]},
        yaxis={"title": {"text": "m/s (media de 7 días)"}})
```
@widget lab-graf id=u1-subseries
@@ Lectura
- Las medias de las subseries (rosa) dibujan el ciclo diario: suben de unos {{=medias_sub.min()|.1f}} m/s de madrugada a {{=medias_sub.max()|.1f}} a mediodía.
- Las 24 subseries tienen **la misma forma en el año** (alto en enero, bajo en mayo, repunte en julio, alto en diciembre): la temporada afecta a todas las horas por igual.
@@ Decisión
🔵 El ciclo diario es una pequeña diferencia de nivel entre subseries que se mueven juntas. Lo que domina es el movimiento común: los episodios y la temporada.
:::

:::pastilla verde | Aplicar · Gráfica de rezagos: el viento contra su pasado | u1:lagplot {#u1-lagplot}
Graficar y<sub>t</sub> contra y<sub>t−k</sub> para varios rezagos. Si la nube se pega a una recta, el pasado a k horas predice el presente; si es redonda, no dice nada. Mueve el control para cambiar el rezago.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| rezagos | 1, 2, 3, 6, 12, 24, 48, 168 y 720 horas | De la hora anterior a un mes antes. |
| muestra | 600 puntos por rezago | Suficiente para ver la forma. |
| correlación | Pearson entre y<sub>t</sub> y y<sub>t−k</sub> | Resume la nube en un número. |
@@ Código
```python
REZ_LAG = [1, 2, 3, 6, 12, 24, 48, 168, 720]
corr_lag = {k: y.corr(y.shift(k)) for k in REZ_LAG}
for k, c in corr_lag.items():
    print(f"rezago {k:>4} h: correlación {c:.3f}")
```
@@ Resultado
```python oculto
idx_m = np.random.default_rng(5).choice(np.arange(720, len(y)), 600, replace=False)
control("u1-lagplot", [{"etiqueta": "Rezago k", "textos": [f"{k} h" for k in REZ_LAG], "inicial": 0}],
        [[puntos(y.shift(k).values[idx_m].round(1), y.values[idx_m].round(1), "horas", "lav", 4, opacity=0.45)] for k in REZ_LAG],
        base=[linea([0, 26], [0, 26], "y = x", "gris", 1, "dot")],
        textos=[f"Rezago de {k} h: correlación <b>{corr_lag[k]:.3f}</b>." for k in REZ_LAG],
        alto=330, showlegend=False, title={"text": "y<sub>t</sub> contra y<sub>t−k</sub>"},
        xaxis={"title": {"text": "viento k horas antes (m/s)"}, "range": [0, 26]}, yaxis={"title": {"text": "viento ahora (m/s)"}, "range": [0, 26]})
```
@widget lab-control id=u1-lagplot
@@ Lectura
- Con **1 hora** de rezago la nube está pegada a la recta (correlación {{=corr_lag[1]|.3f}}): la hora anterior predice muy bien la actual.
- La correlación **baja con el rezago**: {{=corr_lag[6]|.2f}} a 6 h, {{=corr_lag[24]|.2f}} a 24 h, {{=corr_lag[48]|.2f}} a 48 h y casi cero a 30 días.
- A 24 horas la nube no se vuelve a pegar: el viento de ayer a la misma hora predice **peor** que el de hace 12 horas ({{=corr_lag[12]|.2f}}).
@@ Decisión
✅ La memoria del viento es de **horas a pocos días**, y decae poco a poco. El rezago de 24 horas no tiene nada especial: otra señal de que el ciclo diario es débil.
:::

:::pastilla verde | Aplicar · Media y desviación estándar móviles | u1:moviles {#u1-moviles}
Calcular la **media móvil** y la **desviación estándar móvil** con una ventana hacia atrás de m horas. Si la media y la desviación móviles cambian a lo largo del año, la serie no tiene un nivel ni una variabilidad constantes. Mueve el control para cambiar la ventana.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `rolling(m)` | ventana hacia atrás | Como en la definición de la Unidad I. |
| m | 24, 72, 168 y 720 horas | De un día a un mes. |
| eje x | día del año | Las gráficas con 8,760 fechas pesan mucho; se grafica cada 12 horas. |
@@ Código
```python
VENT_M = [24, 72, 168, 720]
moviles = {m: (y.rolling(m).mean(), y.rolling(m).std()) for m in VENT_M}
for m, (mu_m, sd_m) in moviles.items():
    print(f"m = {m:>3} h: la media móvil va de {mu_m.min():5.2f} a {mu_m.max():5.2f} | la desviación, de {sd_m.min():.2f} a {sd_m.max():.2f}")
```
@@ Resultado
```python oculto
dia_anio = ((y.index.dayofyear - 1) + y.index.hour / 24).values
cada6 = slice(None, None, 12)
control("u1-moviles", [{"etiqueta": "Ventana m", "textos": [f"{m} h" for m in VENT_M], "inicial": 2}],
        [[linea(dia_anio[cada6].round(2), moviles[m][0].values[cada6].round(2), "media móvil", "rosa", 2.2),
          linea(dia_anio[cada6].round(2), moviles[m][1].values[cada6].round(2), "desviación estándar móvil", "menta", 2)] for m in VENT_M],
        base=[linea(dia_anio[cada6].round(2), y.values[cada6].round(1), "viento (cada 12 h)", "gris", 0.6, opacity=0.6)],
        alto=320, title={"text": "Estadísticas móviles del viento"}, xaxis={"title": {"text": "día del año"}}, yaxis={"title": {"text": "m/s"}})
```
@widget lab-control id=u1-moviles
@@ Lectura
- Con **m = 24 h** la media móvil sigue cada episodio y va de {{=moviles[24][0].min()|.1f}} a {{=moviles[24][0].max()|.1f}} m/s.
- Con **m = 168 h** (una semana) se ven las temporadas y aún los episodios largos; con **m = 720 h** (un mes) queda solo la temporada, que va de {{=moviles[720][0].min()|.1f}} a {{=moviles[720][0].max()|.1f}} m/s.
- La desviación móvil **también cambia**: con m = 720 va de {{=moviles[720][1].min()|.1f}} a {{=moviles[720][1].max()|.1f}} m/s.
@@ Decisión
✅ Ni la media ni la desviación son constantes a ninguna escala: la serie probablemente **no es estacionaria**. La Unidad I lo pondrá a prueba con ADF y KPSS.
:::
