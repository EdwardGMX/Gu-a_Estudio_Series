## 🧩 Unidad I · Componentes y descomposición {#u1-componentes}
@mapa Los cinco componentes en el viento, estacionalidad contra ciclo, modelo aditivo o multiplicativo, la media móvil centrada, la descomposición clásica, LOESS, STL, la fuerza de cada componente y el pronóstico por descomposición.

:::pastilla azul | Aplicar · Los componentes del viento, a ojo | u1:cinco u1:componentes {#u1-cinco}
Separar el viento en piezas sencillas para ver los componentes de la Unidad I: el **nivel de la temporada**, el **ciclo diario**, los **episodios** de días y lo **irregular**. Aquí se hace con promedios simples, como primera idea; los métodos formales vienen después.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| temporada | media móvil centrada de 30 días | Lo que cambia de un mes a otro. |
| ciclo diario | perfil horario medio de lo que queda | La forma repetida cada 24 horas. |
| episodios | media móvil de 24 horas del resto | Lo que dura días, sin fecha fija. |
| irregular | lo que sobra | Lo que cambia de una hora a otra. |
@@ Código
```python
temporada = y.rolling(720, center=True, min_periods=360).mean()
r1 = y - temporada
ciclo_d = r1.groupby(r1.index.hour).transform("mean")
r2 = r1 - ciclo_d
episodio = r2.rolling(24, center=True, min_periods=12).mean()
irregular = r2 - episodio
piezas = pd.DataFrame({"temporada": temporada - y.mean(), "ciclo diario": ciclo_d, "episodios": episodio, "irregular": irregular})
varianzas = piezas.var()
print("Varianza de cada pieza (m²/s²):")
print(varianzas.round(2).to_string())
print(f"\nVarianza del viento: {y.var():.2f} | suma de las piezas: {varianzas.sum():.2f} (no coinciden porque las piezas no son independientes)")
print("Parte de la suma:", (100 * varianzas / varianzas.sum()).round(1).astype(str).add("%").to_dict())
```
@@ Resultado
```python oculto
mz = slice("2019-03-01", "2019-03-14")
grafica("u1-cinco", [linea(y[mz].index, y[mz].round(2), "viento", "gris", 1, opacity=0.8),
                     linea(y[mz].index, temporada[mz].round(2), "temporada", "osc", 2.6),
                     linea(y[mz].index, (temporada + episodio)[mz].round(2), "temporada + episodios", "lav", 2),
                     linea(y[mz].index, (temporada + episodio + ciclo_d)[mz].round(2), "+ ciclo diario", "rosa", 1.4)],
        alto=320, title={"text": "Dos semanas de marzo armadas pieza por pieza"}, yaxis={"title": {"text": "m/s"}})
```
@widget lab-graf id=u1-cinco
@@ Lectura
- Los **episodios** de varios días son la pieza más grande: {{=100 * varianzas['episodios'] / varianzas.sum()|.0f}}% de la suma de varianzas. Le siguen la **temporada** ({{=100 * varianzas['temporada'] / varianzas.sum()|.0f}}%) y lo **irregular** ({{=100 * varianzas['irregular'] / varianzas.sum()|.0f}}%).
- El **ciclo diario** aporta apenas el {{=100 * varianzas['ciclo diario'] / varianzas.sum()|.1f}}%: en la gráfica, la línea rosa casi no se separa de la morada.
- La suma de varianzas ({{=varianzas.sum()|.1f}}) no es la varianza del viento ({{=y.var()|.1f}}): estas piezas hechas a mano no son independientes. Es la razón de usar métodos formales.
@@ Decisión
🔵 El viento no es "tendencia + estacionalidad + ruido" al estilo de los ejemplos de clase: su componente principal es un **ciclo irregular** de días. Se anota para elegir modelos en la Unidad II.
:::

:::pastilla azul | Aplicar · Estacionalidad contra ciclo | u1:est-vs-ciclo {#u1-est-ciclo}
Distinguir la **estacionalidad** (se repite con periodo fijo, conocido de antemano) del **ciclo** (sube y baja, pero sin periodo fijo). Se compara la regularidad del ciclo diario con la de los episodios de viento fuerte.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| hora del máximo diario | en los días tranquilos (media < 8 m/s) | Si el ciclo diario fuera exacto, el máximo caería siempre a la misma hora. |
| tiempo entre episodios | días entre el inicio de dos nortes | Si fueran estacionales, el intervalo sería casi constante. |
@@ Código
```python
tranquilos = dia.index[dia["mean"] < 8]
hora_max_dia = y[y.index.normalize().isin(tranquilos)].groupby(lambda t: t.normalize()).idxmax().map(lambda t: t.hour)
print(f"Días tranquilos: {len(tranquilos)} | hora del máximo: mediana {hora_max_dia.median():.0f} h, "
      f"el {hora_max_dia.between(10, 16).mean():.0%} entre las 10 y las 16 h")
intervalos = episodios["inicio"].diff().dt.days.dropna()
print(f"Días entre episodios: media {intervalos.mean():.1f}, desviación {intervalos.std():.1f}, de {intervalos.min():.0f} a {intervalos.max():.0f}")
print(f"Coeficiente de variación del intervalo: {intervalos.std() / intervalos.mean():.2f}")
```
@@ Resultado
```python oculto
hm = hora_max_dia.value_counts().reindex(range(24), fill_value=0)
iv = intervalos.clip(upper=40).value_counts().sort_index()
control("u1-est-ciclo", [{"etiqueta": "Ver", "tipo": "seg", "textos": ["hora del máximo diario", "días entre nortes"], "inicial": 0}],
        [[barras(list(range(24)), hm.values, "días", "lav")], [barras(iv.index, iv.values, "intervalos", "dur")]],
        alto=270, showlegend=False, title={"text": "¿Qué tan regular es cada repetición?"},
        lv=[{"xaxis": {"title": {"text": "hora del día del máximo (días tranquilos)"}}}, {"xaxis": {"title": {"text": "días entre el inicio de dos episodios"}}}])
```
@widget lab-control id=u1-est-ciclo
@@ Lectura
- El máximo del día cae cerca del mediodía (mediana a las {{=hora_max_dia.median()|.0f}} h), pero solo el {{=100 * hora_max_dia.between(10, 16).mean()|.0f}}% de los días tranquilos lo tiene entre las 10 y las 16 h: el ciclo diario es real pero **ruidoso**.
- Entre el inicio de dos nortes pasan en promedio {{=intervalos.mean()|.0f}} días, pero el intervalo va de {{=intervalos.min()|.0f}} a {{=intervalos.max()|.0f}} días (coeficiente de variación {{=intervalos.std() / intervalos.mean()|.2f}}): **no hay periodo**.
@@ Decisión
🔵 El ciclo diario es una **estacionalidad** (periodo fijo de 24 h, aunque débil). Los nortes son un **ciclo** (repetición sin periodo fijo). Un modelo estacional puede capturar lo primero, pero no lo segundo.
:::

:::pastilla amarillo | Aplicar · ¿Modelo aditivo o multiplicativo? | u1:aditivo u1:multiplicativo {#u1-adit-mult}
Decidir si el ciclo diario se **suma** al nivel (su tamaño no depende del nivel: modelo aditivo) o lo **multiplica** (crece con el nivel: modelo multiplicativo). Se mide, semana por semana, el nivel y el tamaño del ciclo diario.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| nivel | media de la semana | El nivel en ese momento del año. |
| tamaño del ciclo | desviación de los 24 promedios horarios de la semana | Cuánto sube y baja el perfil diario. |
| criterio | correlación nivel–tamaño | Positiva y fuerte: multiplicativo; cercana a cero: aditivo. |
@@ Código
```python
semana_id = (np.arange(len(y)) // 168)
g_sem = pd.DataFrame({"v": y.values, "h": y.index.hour, "s": semana_id}).query("s < 52")
nivel_sem = g_sem.groupby("s")["v"].mean()
tam_ciclo = g_sem.groupby(["s", "h"])["v"].mean().groupby("s").std()
corr_nt = nivel_sem.corr(tam_ciclo)
print(f"Semanas: {len(nivel_sem)} | correlación entre nivel y tamaño del ciclo: {corr_nt:.2f}")
cuart = pd.qcut(nivel_sem, 4, labels=["el cuarto más tranquilo", "segundo", "tercero", "el más ventoso"])
print(tam_ciclo.groupby(cuart, observed=True).mean().round(2).to_string())
```
@@ Resultado
```python oculto
grafica("u1-adit-mult", [puntos(nivel_sem, tam_ciclo, "semanas", "lav", 8, customdata=[f"semana {s + 1}" for s in nivel_sem.index],
                                hovertemplate="%{customdata}: nivel %{x:.1f}, ciclo %{y:.2f}<extra></extra>")],
        alto=290, showlegend=False, title={"text": "Tamaño del ciclo diario contra el nivel de la semana"},
        xaxis={"title": {"text": "viento medio de la semana (m/s)"}}, yaxis={"title": {"text": "tamaño del ciclo (m/s)"}})
```
@widget lab-graf id=u1-adit-mult
@@ Lectura
- La correlación entre el nivel de la semana y el tamaño de su ciclo diario es **{{=corr_nt|.2f}}**: casi nula y negativa. El ciclo **no crece** con el nivel.
- Por cuartos de nivel, el ciclo es de 0.8 a 1.1 m/s sin un orden claro; el cuarto más ventoso tiene el ciclo más chico.
@@ Decisión
🟡 El modelo **aditivo** es el adecuado. El multiplicativo supondría que en los nortes el ciclo diario es más grande, y pasa lo contrario.
:::

:::pastilla rojo | Aplicar · ¿Y si se toma el logaritmo? | u1:log {#u1-log}
Probar el truco de la Unidad I: el logaritmo convierte un modelo multiplicativo en aditivo. Si el ciclo del viento fuera multiplicativo, en escala logarítmica su tamaño dejaría de depender del nivel.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `np.log(y)` | logaritmo natural | El viento mínimo es 0.35 m/s: no hay ceros. |
| mismo criterio | correlación nivel–tamaño | Para comparar con la escala original. |
@@ Código
```python
log_y = np.log(y)
g_log = pd.DataFrame({"v": log_y.values, "h": y.index.hour, "s": semana_id}).query("s < 52")
corr_nt_log = g_log.groupby("s")["v"].mean().corr(g_log.groupby(["s", "h"])["v"].mean().groupby("s").std())
print(f"Correlación nivel–tamaño del ciclo: escala original {corr_nt:.2f} | escala log {corr_nt_log:.2f}")
print(f"Asimetría: original {y.skew():.2f} | log {log_y.skew():.2f}")
print(f"Horas con menos de 1 m/s: {(y < 1).sum()} (en log, menores que 0; la más baja vale {log_y.min():.2f})")
```
@@ Resultado
```python oculto
cu, bo = np.histogram(log_y, bins=40)
control("u1-log", [{"etiqueta": "Escala", "tipo": "seg", "textos": ["original", "logarítmica"], "inicial": 0}],
        [[barras(((bordes[:-1] + bordes[1:]) / 2).round(2), cuentas, "horas", "lav")], [barras(((bo[:-1] + bo[1:]) / 2).round(3), cu, "horas", "dur")]],
        alto=270, showlegend=False, title={"text": "Distribución del viento en escala original y logarítmica"}, yaxis={"title": {"text": "horas"}},
        lv=[{"xaxis": {"title": {"text": "viento (m/s)"}}}, {"xaxis": {"title": {"text": "log(viento)"}}}])
```
@widget lab-control id=u1-log
@@ Lectura
- En escala logarítmica la correlación nivel–tamaño pasa de {{=corr_nt|.2f}} a **{{=corr_nt_log|.2f}}**: el logaritmo **crea** una relación fuerte que no existía. Agranda el ciclo de las semanas tranquilas, donde el viento está cerca de cero.
- Además invierte la asimetría (de {{=y.skew()|.2f}} a {{=log_y.skew()|.2f}}): estira las calmas hacia valores muy negativos ({{=log_y.min()|.2f}} en la hora más tranquila).
@@ Decisión
❌ El logaritmo **no** conviene: el viento ya es aditivo, y en log las calmas se vuelven atípicos. Si hace falta estabilizar la varianza, la Unidad II ofrece transformaciones más suaves (Box–Cox).
:::

:::pastilla verde | Aplicar · La media móvil centrada: ¿qué ventana borra el ciclo diario? | u1:mm-centrada {#u1-mm-centrada}
Suavizar con **medias móviles centradas** de distinto tamaño y medir cuánto ciclo diario sobrevive. Solo una ventana que cubre un periodo completo (24 horas, que por ser par se calcula como 2×24) elimina la estacionalidad sin deformarla. Mueve el control.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| ventanas | 3, 12, 23, 2×24, 25 y 49 horas | Más chicas, iguales y más grandes que el periodo. |
| 2×24 | media de 24 seguida de media de 2 | Con m par la media no queda centrada en una hora; la 2×24 sí. |
| ciclo que sobrevive | amplitud del perfil horario de la serie suavizada | Debería ser casi 0 si la ventana elimina el ciclo. |
@@ Código
```python
def mm_centrada(s, m):
    if m % 2 == 0:
        return s.rolling(m, center=True).mean().rolling(2).mean().shift(-1)
    return s.rolling(m, center=True).mean()

VENT_C = {"3": 3, "12": 12, "23": 23, "2×24": 24, "25": 25, "49": 49}
suaves = {k: mm_centrada(y, m) for k, m in VENT_C.items()}
amp_orig = y.groupby(y.index.hour).mean().pipe(lambda p: p.max() - p.min())
amp_queda = {k: s.groupby(s.index.hour).mean().pipe(lambda p: p.max() - p.min()) for k, s in suaves.items()}
print(f"Amplitud del ciclo diario en el viento: {amp_orig:.2f} m/s")
for k, a in amp_queda.items():
    print(f"  media móvil centrada de {k:>4}: queda {a:.3f} m/s ({a / amp_orig:.0%})")
```
@@ Resultado
```python oculto
mz2 = slice("2019-08-05", "2019-08-11")
control("u1-mm-centrada", [{"etiqueta": "Ventana", "textos": list(VENT_C), "inicial": 3}],
        [[linea(s[mz2].index, s[mz2].round(2), f"media móvil centrada de {k}", "rosa", 2.6)] for k, s in suaves.items()],
        base=[linea(y[mz2].index, y[mz2].round(2), "viento", "gris", 1.2)],
        textos=[f"Ciclo diario que sobrevive: <b>{amp_queda[k]:.2f} m/s</b> ({amp_queda[k] / amp_orig:.0%} del original)." for k in VENT_C],
        alto=300, title={"text": "Una semana de agosto suavizada con medias móviles centradas"}, yaxis={"title": {"text": "m/s"}})
```
@widget lab-control id=u1-mm-centrada
@@ Lectura
- Las ventanas **menores** que el periodo dejan pasar el ciclo: con 3 horas queda el {{=100 * amp_queda['3'] / amp_orig|.0f}}% y con 12 horas, el {{=100 * amp_queda['12'] / amp_orig|.0f}}%.
- La **2×24** lo elimina por completo (queda {{=amp_queda['2×24']|.3f}} m/s). Las de 23 y 25 dejan un poco (alrededor del 5%) y la de 49, casi nada.
- En la gráfica, la línea rosa de 2×24 sigue los cambios de varios días sin las ondulaciones diarias.
@@ Decisión
✅ La media móvil **2×24** es la que usa la descomposición clásica para estimar la tendencia de una serie horaria con estacionalidad diaria.
:::

:::pastilla verde | Aplicar · Descomposición clásica aditiva con periodo 24 | u1:descomposicion u1:sim-decompose {#u1-desc-aditiva}
Aplicar la **descomposición clásica** con `seasonal_decompose`: la tendencia es la media móvil 2×24, la estacionalidad es el promedio de cada hora del día de la serie sin tendencia (centrado en cero) y el residuo es lo que sobra.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `model="additive"` | aditivo | Lo que sugirió la comparación nivel–ciclo. |
| `period=24` | un día | La estacionalidad candidata. |
| `two_sided=True` | media centrada | La de la definición clásica. |
@@ Código
```python
from statsmodels.tsa.seasonal import seasonal_decompose
dec_a = seasonal_decompose(y, model="additive", period=24)
patron_a = dec_a.seasonal.iloc[:24]
patron_a.index = dec_a.seasonal.index[:24].hour
print("Índices estacionales (m/s), cada 3 horas:", patron_a.iloc[::3].round(2).to_dict())
print(f"Suman: {patron_a.sum():.4f} (deben sumar 0)")
print(f"Tendencia: {dec_a.trend.isna().sum()} NaN (12 al inicio y 12 al final)")
var_a = pd.Series({"tendencia": dec_a.trend.var(), "estacional": dec_a.seasonal.var(), "residuo": dec_a.resid.var()})
print("Varianza de cada componente:", var_a.round(2).to_dict())
```
@@ Resultado
```python oculto
mz3 = slice("2019-08-05", "2019-08-18")
control("u1-desc-aditiva", [{"etiqueta": "Componente", "tipo": "seg", "textos": ["serie y tendencia", "estacional", "residuo"], "inicial": 0}],
        [[linea(y[mz3].index, y[mz3].round(2), "viento", "gris", 1.2), linea(y[mz3].index, dec_a.trend[mz3].round(2), "tendencia (2×24)", "osc", 2.6)],
         [linea(y[mz3].index, dec_a.seasonal[mz3].round(3), "estacional", "rosa", 2)],
         [linea(y[mz3].index, dec_a.resid[mz3].round(2), "residuo", "lav", 1.4)]],
        alto=290, title={"text": "Descomposición clásica aditiva (dos semanas de agosto)"}, yaxis={"title": {"text": "m/s"}})
grafica("u1-desc-patron", [barras(list(range(24)), patron_a.values, "índice estacional", ["menta" if v > 0 else "dur" for v in patron_a.values])],
        alto=240, showlegend=False, title={"text": "Los 24 índices estacionales aditivos"}, xaxis={"title": {"text": "hora del día"}, "dtick": 3},
        yaxis={"title": {"text": "m/s"}})
```
@widget lab-control id=u1-desc-aditiva
@widget lab-graf id=u1-desc-patron
@@ Lectura
- Los índices estacionales dicen que el viento está **unos {{=patron_a.max()|.1f}} m/s arriba de la tendencia al mediodía** y unos {{=-patron_a.min()|.1f}} abajo de madrugada. Suman cero, como exige el modelo aditivo.
- La tendencia (media 2×24) se pierde en las primeras y últimas 12 horas: es el costo de la media centrada.
- Las varianzas: tendencia {{=var_a['tendencia']|.1f}}, estacional {{=var_a['estacional']|.2f}} y residuo {{=var_a['residuo']|.1f}} (m/s)². La "tendencia" de la descomposición clásica contiene los episodios y la temporada.
@@ Decisión
✅ La descomposición funciona, y confirma con números lo que se veía: el componente estacional es pequeño. Un solo patrón de 24 valores para todo el año es una simplificación.
:::

:::pastilla amarillo | Aplicar · La descomposición multiplicativa, para comparar | u1:multiplicativo u1:descomposicion {#u1-desc-mult}
Repetir la descomposición con el modelo **multiplicativo** y comparar cuál deja un residuo menor. En el multiplicativo los índices son factores (1.05 significa 5% arriba de la tendencia).
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `model="multiplicative"` | y = T · S · R | Para comparar. |
| error de reconstrucción | y − T − S contra y − T · S | Los dos en m/s, para que sean comparables. |
@@ Código
```python
dec_m = seasonal_decompose(y, model="multiplicative", period=24)
patron_m = dec_m.seasonal.iloc[:24]
patron_m.index = range(24)
err_a = (y - dec_a.trend - dec_a.seasonal).dropna()
err_m = (y - dec_m.trend * dec_m.seasonal).dropna()
print(f"Factores estacionales: de {patron_m.min():.3f} a {patron_m.max():.3f} (promedian {patron_m.mean():.3f})")
print(f"Residuo en m/s: aditivo, desviación {err_a.std():.3f} | multiplicativo, desviación {err_m.std():.3f}")
calma = dec_a.trend.dropna() < 5
print(f"En las horas de tendencia < 5 m/s: aditivo {err_a[calma].std():.3f} | multiplicativo {err_m[calma].std():.3f}")
print(f"En las horas de tendencia > 12 m/s: aditivo {err_a[dec_a.trend.dropna() > 12].std():.3f} | multiplicativo {err_m[dec_a.trend.dropna() > 12].std():.3f}")
```
@@ Lectura
- Los factores multiplicativos van de {{=patron_m.min()|.2f}} a {{=patron_m.max()|.2f}}: al mediodía el viento estaría {{=100 * (patron_m.max() - 1)|.0f}}% arriba de la tendencia.
- El residuo del multiplicativo es **mayor** ({{=err_m.std()|.2f}} contra {{=err_a.std()|.2f}} m/s), sobre todo con viento fuerte ({{=err_m[dec_a.trend.dropna() > 12].std()|.2f}} contra {{=err_a[dec_a.trend.dropna() > 12].std()|.2f}}): en un norte, un factor de 1.19 exagera el ciclo diario.
@@ Decisión
🟡 El aditivo gana. Se usa el modelo aditivo en todo lo que sigue.
:::

:::pastilla rojo | Aplicar · La descomposición siempre encuentra "estacionalidad": un ciclo semanal falso | u1:descomposicion u1:para-que {#u1-desc-semanal}
Descomponer la serie **diaria** con periodo 7, como si el viento tuviera un ciclo semanal. El algoritmo no puede decir "no hay estacionalidad": siempre devuelve 7 índices. Hay que medir si esos índices son algo más que ruido.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `dia["mean"]` | media diaria, 365 datos | La frecuencia en la que tendría sentido un ciclo semanal. |
| `period=7` | una semana | El viento no sabe qué día es: no debería haber ciclo. |
| prueba | índices de la primera mitad del año contra los de la segunda | Si la estacionalidad es real, se repite. |
@@ Código
```python
dec_s = seasonal_decompose(dia["mean"], model="additive", period=7)
ind_sem = dec_s.seasonal.groupby(dec_s.seasonal.index.dayofweek).first()
print("Índices 'semanales' (lunes a domingo, m/s):", ind_sem.round(2).values)
print(f"Varianza: estacional {dec_s.seasonal.var():.3f} | residuo {dec_s.resid.var():.3f}")
mitad = dia.index[182]
primera = seasonal_decompose(dia["mean"][:mitad], period=7).seasonal.groupby(lambda t: t.dayofweek).first()
segunda = seasonal_decompose(dia["mean"][mitad:], period=7).seasonal.groupby(lambda t: t.dayofweek).first()
print(f"Correlación entre los índices de la primera y la segunda mitad: {primera.corr(segunda):.2f}")
```
@@ Resultado
```python oculto
DIAS = ["lun", "mar", "mié", "jue", "vie", "sáb", "dom"]
grafica("u1-desc-semanal", [barras(DIAS, primera.values, "enero a junio", "lav"), barras(DIAS, segunda.values, "julio a diciembre", "dur")],
        alto=260, barmode="group", title={"text": "Índices 'semanales' de cada mitad del año"}, yaxis={"title": {"text": "m/s"}})
```
@widget lab-graf id=u1-desc-semanal
@@ Lectura
- La descomposición devuelve 7 índices "semanales" de hasta {{=dec_s.seasonal.abs().max()|.2f}} m/s, aunque el viento no sabe qué día de la semana es.
- Su varianza ({{=dec_s.seasonal.var()|.2f}}) es minúscula frente a la del residuo ({{=dec_s.resid.var()|.1f}}) y, sobre todo, **no se repite**: los índices de la primera mitad del año y los de la segunda tienen correlación de {{=primera.corr(segunda)|.2f}}.
@@ Decisión
❌ No hay ciclo semanal. La lección: la descomposición siempre "encuentra" estacionalidad; hay que comprobar que sea grande y estable antes de creerle.
:::

:::pastilla verde | Aplicar · LOESS: una recta local para suavizar | u1:loess u1:stl {#u1-loess}
Suavizar el viento **diario** con **LOESS**: en cada día se ajusta una recta por mínimos cuadrados ponderados con los q días más cercanos (pesos tricúbicos). Es la pieza con la que se construye STL. Mueve el control para cambiar la ventana q.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `lowess(…, frac=q/365, it=0)` | LOESS de grado 1 | `frac` es la fracción de datos de la ventana; `it=0` sin robustez. |
| q | 7, 15, 31, 61 y 121 días | De una semana a cuatro meses. |
| suavidad | desviación de las diferencias de la curva | Una curva más suave cambia menos de un día a otro. |
@@ Código
```python
from statsmodels.nonparametric.smoothers_lowess import lowess
Q_LOESS = [7, 15, 31, 61, 121]
xd = np.arange(len(dia))
curvas_loess = {q: lowess(dia["mean"].values, xd, frac=q / len(dia), it=0, return_sorted=False) for q in Q_LOESS}
for q, c in curvas_loess.items():
    print(f"q = {q:>3} días: rango de la curva {c.min():5.1f} a {c.max():5.1f} m/s | cambio diario típico {np.std(np.diff(c)):.3f} | error contra los datos {np.std(dia['mean'].values - c):.2f}")
```
@@ Resultado
```python oculto
control("u1-loess", [{"etiqueta": "Ventana q", "textos": [f"{q} días" for q in Q_LOESS], "inicial": 2}],
        [[linea(dia.index, curvas_loess[q].round(2), f"LOESS con q = {q}", "rosa", 2.8)] for q in Q_LOESS],
        base=[linea(dia.index, dia["mean"].round(2), "media diaria", "gris", 1)],
        alto=300, title={"text": "LOESS del viento diario"}, yaxis={"title": {"text": "m/s"}})
```
@widget lab-control id=u1-loess
@@ Lectura
- Con **q = 7** días la curva sigue casi cada episodio (va de {{=curvas_loess[7].min()|.1f}} a {{=curvas_loess[7].max()|.1f}} m/s y cambia mucho de un día a otro).
- Con **q = 31** queda una curva de la temporada; con **q = 121** solo las dos grandes temporadas.
- Cuanto más grande la ventana, más suave la curva y más lejos de los datos (el error sube de {{=np.std(dia['mean'].values - curvas_loess[7])|.1f}} a {{=np.std(dia['mean'].values - curvas_loess[121])|.1f}} m/s): es el compromiso de todo suavizador.
@@ Decisión
✅ LOESS separa escalas eligiendo la ventana. STL aplica esta misma idea dos veces: una para la estacionalidad y otra para la tendencia.
:::

:::pastilla verde | Aplicar · STL con periodo de 24 horas | u1:stl-algoritmo u1:stl-parametros {#u1-stl}
Descomponer con **STL**, que usa LOESS en lugar de medias móviles: la estacionalidad puede cambiar poco a poco a lo largo del año, y no se pierden datos en los extremos.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `period=24` | un día | La estacionalidad diaria. |
| `seasonal=7` | ventana de 7 ciclos | El valor por omisión: el patrón diario se adapta en una semana. |
| `trend` | automático (37 h) | La regla de statsmodels a partir del periodo. |
@@ Código
```python
from statsmodels.tsa.seasonal import STL
stl = STL(y, period=24).fit()
print(f"Ventana de la tendencia: {STL(y, period=24).config['trend']} horas | NaN en los componentes: {stl.trend.isna().sum()}")
var_stl = pd.Series({"tendencia": stl.trend.var(), "estacional": stl.seasonal.var(), "residuo": stl.resid.var()})
print("Varianza de cada componente:", var_stl.round(2).to_dict())
amp_stl_dia = stl.seasonal.resample("D").agg(lambda s: s.max() - s.min())
print(f"Amplitud diaria de la estacionalidad: de {amp_stl_dia.min():.2f} a {amp_stl_dia.max():.2f} m/s (mediana {amp_stl_dia.median():.2f})")
```
@@ Resultado
```python oculto
control("u1-stl", [{"etiqueta": "Componente", "tipo": "seg", "textos": ["serie y tendencia", "estacional", "residuo"], "inicial": 0}],
        [[linea(y[mz3].index, y[mz3].round(2), "viento", "gris", 1.2), linea(y[mz3].index, stl.trend[mz3].round(2), "tendencia STL", "osc", 2.6)],
         [linea(y[mz3].index, stl.seasonal[mz3].round(3), "estacional STL", "rosa", 2)],
         [linea(y[mz3].index, stl.resid[mz3].round(2), "residuo STL", "lav", 1.4)]],
        alto=290, title={"text": "STL con periodo 24 (dos semanas de agosto)"}, yaxis={"title": {"text": "m/s"}})
```
@widget lab-control id=u1-stl
@@ Lectura
- STL no pierde datos en los extremos y su tendencia usa una ventana de {{=STL(y, period=24).config['trend']}} horas.
- Con `seasonal=7` la estacionalidad tiene varianza {{=var_stl['estacional']|.2f}}, casi el triple que en la clásica ({{=var_a['estacional']|.2f}}): su amplitud diaria va de {{=amp_stl_dia.min()|.1f}} a {{=amp_stl_dia.max()|.1f}} m/s según la semana.
- El residuo es más chico ({{=var_stl['residuo']|.2f}} contra {{=var_a['residuo']|.2f}}) porque la estacionalidad flexible absorbe parte de lo que en la clásica era residuo.
@@ Decisión
✅ STL describe mejor una estacionalidad que cambia con la temporada. Pero hay que vigilar que la estacionalidad flexible no se lleve también parte de lo irregular.
:::

:::pastilla verde | Aplicar · El parámetro `seasonal`: qué tan rápido cambia el patrón diario | u1:stl-parametros u1:w-stl {#u1-stl-seasonal}
Cambiar la ventana estacional de STL. Con `seasonal` chico el patrón diario se adapta cada semana; con uno enorme queda casi fijo todo el año. Mueve el control y mira cómo cambia la amplitud del ciclo diario a lo largo del año.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `seasonal` | 7, 31, 91 y 999 | Una semana, un mes, una temporada y casi fijo. |
| amplitud diaria | máximo − mínimo de la estacionalidad en cada día | Resume el patrón de cada día en un número. |
@@ Código
```python
SEAS = [7, 31, 91, 999]
stl_s = {s: STL(y, period=24, seasonal=s).fit() for s in SEAS}
amp_s = {s: r.seasonal.resample("D").agg(lambda v: v.max() - v.min()) for s, r in stl_s.items()}
for s, r in stl_s.items():
    F_S_s = max(0, 1 - r.resid.var() / (r.seasonal + r.resid).var())
    print(f"seasonal = {s:>3}: amplitud diaria de {amp_s[s].min():.2f} a {amp_s[s].max():.2f} m/s | fuerza estacional {F_S_s:.2f}")
```
@@ Resultado
```python oculto
control("u1-stl-seasonal", [{"etiqueta": "seasonal", "textos": [str(s) for s in SEAS], "inicial": 0}],
        [[linea(amp_s[s].index, amp_s[s].round(3), f"seasonal = {s}", "rosa", 2.2)] for s in SEAS],
        alto=280, showlegend=False, title={"text": "Amplitud del patrón diario de STL, día por día"}, yaxis={"title": {"text": "m/s"}, "range": [0, 7]})
```
@widget lab-control id=u1-stl-seasonal
@@ Lectura
- Con **seasonal = 7** la amplitud diaria salta de un día a otro (de {{=amp_s[7].min()|.1f}} a {{=amp_s[7].max()|.1f}} m/s) y la fuerza estacional sale de {{=max(0, 1 - stl_s[7].resid.var() / (stl_s[7].seasonal + stl_s[7].resid).var())|.2f}}.
- Con **31** y **91** la amplitud cambia despacio: más alta en primavera y verano, más baja en invierno, como en la gráfica estacional.
- Con **999** el patrón es casi fijo (amplitud de {{=amp_s[999].min()|.1f}} a {{=amp_s[999].max()|.1f}}) y la fuerza baja a {{=max(0, 1 - stl_s[999].resid.var() / (stl_s[999].seasonal + stl_s[999].resid).var())|.2f}}.
@@ Decisión
✅ La fuerza estacional **depende de la ventana**: una ventana chica le atribuye a la estacionalidad parte de lo que es ruido. Para un ciclo diario estable, una ventana de un mes (31) es un buen punto medio.
:::

:::pastilla amarillo | Aplicar · STL robusto: ¿hay atípicos que deformen la descomposición? | u1:stl-robusto {#u1-stl-robusto}
Repetir STL con `robust=True`. El ciclo externo calcula **pesos de robustez**: las horas con residuos muy grandes reciben peso bajo y no deforman la tendencia ni la estacionalidad. Ver dónde caen los pesos bajos dice qué horas son "raras".
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `robust=True` | pesos bisquare | Los residuos mayores que 6 veces la mediana de \|residuo\| pesan 0. |
| peso bajo | menor que 0.5 | Horas que STL considera atípicas. |
@@ Código
```python
stl_r = STL(y, period=24, robust=True).fit()
pesos = pd.Series(stl_r.weights, index=y.index)
bajos = pesos < 0.5
print(f"Horas con peso menor que 0.5: {bajos.sum()} ({bajos.mean():.1%}) | con peso 0: {(pesos == 0).sum()}")
print(f"Cambio absoluto medio del viento en esas horas: {y.diff().abs()[bajos].mean():.2f} m/s contra {y.diff().abs().mean():.2f} en general")
print(f"¿Coinciden con horas imputadas? {imputada[bajos].mean():.1%} (en general {imputada.mean():.1%})")
print(f"¿Con horas en paro? {s10['paro'].resample('h').mean().gt(0.5)[bajos].mean():.1%}")
print(f"Desviación del residuo: normal {stl.resid.std():.3f} | robusto {stl_r.resid.std():.3f}")
```
@@ Resultado
```python oculto
pmin = pesos.resample("D").min()
grafica("u1-stl-robusto", [barras(pmin.index, 1 - pmin, "1 − peso mínimo del día", "dur", hovertemplate="%{x|%d %b}: peso mínimo %{customdata:.2f}<extra></extra>",
                                  customdata=_vals(pmin, 3))],
        alto=250, showlegend=False, title={"text": "Días con horas atípicas para STL (barra alta = peso bajo)"}, yaxis={"title": {"text": "1 − peso"}, "range": [0, 1]})
```
@widget lab-graf id=u1-stl-robusto
@@ Lectura
- El {{=100 * bajos.mean()|.0f}}% de las horas recibe peso menor que 0.5 ({{=(pesos == 0).sum()}} con peso 0). Son horas de **cambios rápidos** (cambio medio de {{=y.diff().abs()[bajos].mean()|.2f}} m/s contra {{=y.diff().abs().mean()|.2f}}): las entradas y salidas de los nortes.
- Casi no coinciden con las horas imputadas ({{=100 * imputada[bajos].mean()|.0f}}%, contra {{=100 * imputada.mean()|.0f}}% en general) y apenas un poco más con los paros: la limpieza no dejó errores grandes.
- El residuo del STL robusto es **mayor** ({{=stl_r.resid.std()|.2f}} contra {{=stl.resid.std()|.2f}}): al ignorar esas horas, la tendencia ya no las persigue y el error se queda en el residuo.
@@ Decisión
🟡 Los "atípicos" de STL no son errores: son cambios de régimen reales. El STL normal es adecuado; el robusto sirve para saber **dónde** están los cambios bruscos.
:::

:::pastilla verde | Aplicar · La fuerza de la tendencia y de la estacionalidad | u1:fuerza {#u1-fuerza}
Medir con un número qué tan fuertes son la tendencia y la estacionalidad: $F_T = \max\left(0,\ 1 - \frac{\text{Var}(R)}{\text{Var}(T + R)}\right)$ y $F_S = \max\left(0,\ 1 - \frac{\text{Var}(R)}{\text{Var}(S + R)}\right)$. Cerca de 1 es fuerte; cerca de 0, débil. También se calcula mes por mes.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| componentes | los de STL con `seasonal=7` | La descomposición base. |
| por mes | varianzas dentro de cada mes | Para ver si la fuerza cambia con la temporada. |
@@ Código
```python
def fuerza(T, S, R):
    return max(0, 1 - R.var() / (T + R).var()), max(0, 1 - R.var() / (S + R).var())

F_T, F_S = fuerza(stl.trend, stl.seasonal, stl.resid)
print(f"Todo el año: F_T = {F_T:.3f} | F_S = {F_S:.3f}")
fuerza_mes = pd.DataFrame([fuerza(stl.trend[y.index.month == m], stl.seasonal[y.index.month == m], stl.resid[y.index.month == m])
                           for m in range(1, 13)], index=MESES, columns=["F_T", "F_S"])
print("\nPor mes:")
print(fuerza_mes.round(2).T.to_string())
```
@@ Resultado
```python oculto
grafica("u1-fuerza", [barras(MESES, fuerza_mes["F_T"], "F_T (tendencia)", "osc"), barras(MESES, fuerza_mes["F_S"], "F_S (estacionalidad)", "rosa")],
        alto=270, barmode="group", title={"text": "Fuerza de la tendencia y de la estacionalidad diaria, mes por mes"}, yaxis={"range": [0, 1]})
```
@widget lab-graf id=u1-fuerza
@@ Lectura
- La tendencia es **fuerte** todo el año (F_T = {{=F_T|.2f}}): en STL la "tendencia" incluye los episodios de varios días, que son la mayor parte de la variación.
- La estacionalidad diaria es **moderada** (F_S = {{=F_S|.2f}}, con `seasonal=7`) y cambia con la temporada: de {{=fuerza_mes['F_S'].min()|.2f}} en los meses de norte a {{=fuerza_mes['F_S'].max()|.2f}} en septiembre.
@@ Decisión
✅ El ciclo diario importa más de abril a septiembre, cuando no hay nortes. Recuerda que F_S con `seasonal=7` es optimista; con una ventana casi fija baja a {{=max(0, 1 - stl_s[999].resid.var() / (stl_s[999].seasonal + stl_s[999].resid).var())|.2f}}.
:::

:::pastilla azul | ⏩ Adelanto · Dividir los datos y medir los pronósticos | u2:particion u2:tres-bloques u2:rolling-origin u2:metricas {#u1-particion}
**Adelanto de la Unidad II.** Para evaluar cualquier pronóstico hace falta separar los datos en el tiempo y medir el error. Se fija aquí el protocolo que usa todo el análisis: el **último 20%** del año es la **prueba** (no se toca hasta el final) y los **últimos 56 días del entrenamiento** son la **validación**, donde se comparan los modelos. Cada medianoche de la validación se pronostican las 24 horas siguientes con los datos disponibles hasta ese momento (**origen móvil**).
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| prueba | últimos 73 días (1,752 horas, 20%) | La regla del flujo; se usa solo al final. |
| validación | últimos 56 días del entrenamiento | Ocho semanas para elegir entre modelos. |
| horizonte | 24 horas desde cada medianoche | El pronóstico del día siguiente. |
| métricas | MAE, RMSE, MAPE y MASE | MASE divide el MAE entre el error del ingenuo a un paso en el entrenamiento. |
@@ Código
```python
N_TE, N_VAL = 73, 56
n_te = 24 * N_TE
n_tr = len(y) - n_te
y_tr, y_te = y.iloc[:n_tr], y.iloc[n_tr:]
ini_val = y_tr.index[-24 * N_VAL]
ORIGENES_VAL = pd.date_range(ini_val, periods=N_VAL, freq="D")
ORIGENES_TE = pd.date_range(y_te.index[0], periods=N_TE, freq="D")
escala_mase = y_tr.diff().abs().mean()

def metricas(real, pron):
    real, pron = np.asarray(real, float), np.asarray(pron, float)
    e = real - pron
    return {"MAE": np.mean(np.abs(e)), "RMSE": np.sqrt(np.mean(e ** 2)), "MAPE %": 100 * np.mean(np.abs(e) / real),
            "MASE": np.mean(np.abs(e)) / escala_mase}

def evaluar(pronosticar, origenes=ORIGENES_VAL, serie=None):
    """Aplica pronosticar(historia) -> 24 valores en cada origen; regresa un DataFrame con real, pronóstico y horizonte."""
    serie = y if serie is None else serie
    filas = []
    for t0 in origenes:
        hist = serie[:t0 - pd.Timedelta(hours=1)]
        p = np.clip(np.asarray(pronosticar(hist), float), 0, None)
        idx = pd.date_range(t0, periods=24, freq="h")
        filas.append(pd.DataFrame({"real": y[idx].values, "pron": p, "h": np.arange(1, 25)}, index=idx))
    return pd.concat(filas)

print(f"Entrenamiento: {y_tr.index[0]:%d/%m} a {y_tr.index[-1]:%d/%m} ({n_tr:,} h) | validación desde el {ini_val:%d/%m} | prueba: {y_te.index[0]:%d/%m} a {y_te.index[-1]:%d/%m}")
print(f"Viento medio: entrenamiento sin validación {y_tr[:ini_val].mean():.2f} | validación {y_tr[ini_val:].mean():.2f} | prueba {y_te.mean():.2f} m/s")
print(f"Escala del MASE (MAE del ingenuo a un paso en el entrenamiento): {escala_mase:.3f} m/s")
```
@@ Resultado
```python oculto
dpar = dia["mean"]
grafica("u1-particion", [linea(dpar[:ini_val - pd.Timedelta(days=1)].index, dpar[:ini_val - pd.Timedelta(days=1)], "entrenamiento", "lav", 1.6),
                         linea(dpar[ini_val:y_te.index[0] - pd.Timedelta(days=1)].index, dpar[ini_val:y_te.index[0] - pd.Timedelta(days=1)], "validación", "menta", 2),
                         linea(dpar[y_te.index[0]:].index, dpar[y_te.index[0]:], "prueba", "dur", 2)],
        alto=270, title={"text": "La división del año: entrenamiento, validación y prueba"}, yaxis={"title": {"text": "m/s (media diaria)"}})
```
@widget lab-graf id=u1-particion
@@ Lectura
- El entrenamiento va del 1 de enero al {{=y_tr.index[-1].strftime('%d/%m')}} ({{=n_tr|,}} horas), la validación empieza el {{=ini_val.strftime('%d/%m')}} y la prueba va del {{=y_te.index[0].strftime('%d/%m')}} al 31 de diciembre.
- La **prueba es mucho más ventosa** ({{=y_te.mean()|.1f}} m/s) que la validación ({{=y_tr[ini_val:].mean()|.1f}}): cae en la temporada de nortes. Es un aviso de que lo que funcione en la validación podría no funcionar igual en la prueba.
- La escala del MASE es {{=escala_mase|.3f}} m/s: un modelo con MASE menor que 1 se equivoca a 24 horas menos que el ingenuo a una hora, algo muy difícil.
@@ Decisión
⏩ El protocolo queda fijo: **elegir con la validación, reportar con la prueba**. Las mismas fechas que en el primer análisis, para poder comparar al final.
:::

:::pastilla amarillo | Aplicar · Pronóstico por descomposición | u1:pron-descomp {#u1-pron-descomp}
Pronosticar con la descomposición, como en la Unidad I: cada medianoche se descompone la historia con STL, se pronostica la parte **desestacionalizada** (tendencia + residuo) y se le suma el **último patrón diario**. Se prueban dos formas de pronosticar la parte desestacionalizada.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| historia | últimos 28 días antes de cada origen | STL con poca historia es rápido y se adapta. |
| desestacionalizada "última" | se repite su último valor | Supone que el nivel actual sigue. |
| desestacionalizada "media de 3 días" | se repite su promedio de los últimos 3 días | Supone que el nivel regresa a lo reciente. |
| estacionalidad | las últimas 24 horas del componente estacional | El patrón diario más reciente. |
@@ Código
```python
def por_descomposicion(hist, modo="última"):
    h28 = hist[-24 * 28:]
    r = STL(h28, period=24).fit()
    desest = h28 - r.seasonal
    nivel = desest.iloc[-1] if modo == "última" else desest[-72:].mean()
    return nivel + r.seasonal[-24:].values

val_desc = {m: evaluar(lambda h, m=m: por_descomposicion(h, m)) for m in ["última", "media de 3 días"]}
for m, r in val_desc.items():
    print(f"STL + {m:<16}: " + " | ".join(f"{k} {v:.3f}" for k, v in metricas(r["real"], r["pron"]).items()))
```
@@ Resultado
```python oculto
vv = val_desc["última"]
ver = slice(ORIGENES_VAL[14], ORIGENES_VAL[20] + pd.Timedelta(hours=23))
grafica("u1-pron-descomp", [linea(vv[ver].index, vv[ver]["real"], "viento real", "osc", 1.8),
                            linea(vv[ver].index, vv[ver]["pron"], "STL + última", "rosa", 2),
                            linea(vv[ver].index, val_desc["media de 3 días"][ver]["pron"], "STL + media de 3 días", "menta", 2, "dot")],
        alto=300, title={"text": "Pronósticos por descomposición de cada medianoche (una semana de validación)"}, yaxis={"title": {"text": "m/s"}})
```
@widget lab-graf id=u1-pron-descomp
@@ Lectura
- **STL + última** tiene MAE de {{=metricas(val_desc['última']['real'], val_desc['última']['pron'])['MAE']|.2f}} m/s en la validación: repite el nivel de la medianoche y le pone encima el ciclo diario.
- **STL + media de 3 días** es peor (MAE {{=metricas(val_desc['media de 3 días']['real'], val_desc['media de 3 días']['pron'])['MAE']|.2f}}): el nivel de los últimos días es peor guía que el nivel actual.
- En la gráfica, el pronóstico arranca bien cada medianoche pero no anticipa los cambios de nivel: un pronóstico por descomposición solo extiende lo que ya está pasando.
@@ Decisión
🟡 Es el primer pronóstico del análisis. Sin otro con qué compararlo no se sabe si es bueno; la Unidad II empieza justo por ahí, con los **modelos de referencia**.
:::
