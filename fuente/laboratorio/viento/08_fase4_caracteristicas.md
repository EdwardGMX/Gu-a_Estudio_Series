## 🛠️ Fase 4 · Ingeniería de características {#fase-caracteristicas}
@mapa Construir las variables que usarán los modelos de aprendizaje automático: calendario, rezagos elegidos con la ACF y la PACF, estadísticos móviles y variables físicas; evitar la fuga de información y armar la tabla para pronosticar 24 horas.

:::pastilla azul | Aplicar · Variables de calendario: hora, día, mes, trimestre y festivos | u2:festivos u1:estacional-graf {#car-calendario}
Crear las variables de calendario que pide el flujo de trabajo para el **momento que se pronostica**: hora del día, día de la semana, mes, trimestre y si es festivo. Antes de usarlas, revisar si tienen sentido físico para el viento.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `FESTIVOS` | días de descanso oficiales de México en 2019 | Año Nuevo, Constitución, Benito Juárez, Jueves y Viernes Santo, Día del Trabajo, Independencia, Revolución, Virgen de Guadalupe y Navidad. |
| `kruskal` | prueba de Kruskal–Wallis | $H_0$: el viento tiene la misma distribución todos los días de la semana. |
@@ Código
```python
from scipy.stats import kruskal

FESTIVOS = pd.to_datetime(["2019-01-01", "2019-02-04", "2019-03-18", "2019-04-18", "2019-04-19", "2019-05-01",
                           "2019-09-16", "2019-11-18", "2019-12-12", "2019-12-25"])
def calendario(momentos):
    m = pd.DatetimeIndex(momentos)
    return pd.DataFrame({"hora": m.hour, "dia_sem": m.dayofweek, "mes": m.month, "trimestre": m.quarter,
                         "festivo": m.normalize().isin(FESTIVOS).astype(int)}, index=m)
cal = calendario(y.index)
dias = ["lun", "mar", "mié", "jue", "vie", "sáb", "dom"]
por_dia = y.groupby(cal["dia_sem"].values).mean()
print("Viento medio por día de la semana:", dict(zip(dias, por_dia.round(2))))
print(f"Kruskal–Wallis por día de la semana: p = {kruskal(*[y[cal['dia_sem'] == d] for d in range(7)]).pvalue:.4f}")
print(f"Viento medio en festivos: {y[cal['festivo'] == 1].mean():.2f} m/s ({cal['festivo'].sum() // 24} días) | resto: {y[cal['festivo'] == 0].mean():.2f}")
```
@@ Lectura
- Los promedios por día de la semana van de {{=por_dia.min()|.2f}} a {{=por_dia.max()|.2f}} m/s y Kruskal–Wallis "rechaza" que sean iguales. Pero **no hay ninguna razón física** para que el viento sepa qué día es: Kruskal–Wallis supone observaciones independientes, y aquí un solo episodio de 3 días de nortes que cayó entre viernes y domingo basta para mover los promedios.
- Los {{=cal['festivo'].sum() // 24}} festivos tienen un viento medio de {{=y[cal['festivo'] == 1].mean()|.1f}} m/s, más que el resto, pero cinco de los diez caen en enero, marzo, noviembre y diciembre, los meses más ventosos: el efecto es de la temporada, no del festivo. Diez días son muy pocos para separar cualquier efecto del azar de los episodios.
- **La hora del día sí tiene sentido** (el ciclo diario) y el **mes** resume la temporada.
@@ Decisión
Las cinco variables se construyen, pero la suposición **S7** ("el calendario ayudará") se pondrá a prueba en la [[ml-calendario|fase de modelos]]: se espera que la hora ayude un poco y que el día de la semana y los festivos solo agreguen ruido. Ahora los **rezagos**.
:::

:::pastilla verde | Aplicar · Rezagos elegidos con la ACF y la PACF | u1:rezago u1:acf-pacf u2:fuga {#car-rezagos}
Crear los rezagos del viento que verán los modelos. La [[est-acf|ACF y PACF]] dijeron que la información está en la **última hora** (PACF cortada en 1), en el **mismo momento de los días anteriores** (rezagos 24 y 48) y en el nivel de la temporada (cola larga de la ACF).
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| rezagos 0 a 23 | el último día completo, hora por hora | Para pronosticar la hora $t+h$ desde el origen $t$, el rezago $L$ es el viento en $t-L$. Así se cubren la persistencia y el ciclo diario. |
| rezagos 48, 72, 168 | 2, 3 y 7 días | La misma hora de días anteriores y el nivel de la semana. |
| correlación | rezago contra el objetivo a 1, 6 y 24 h | Para ver cuánto informa cada rezago según el horizonte. |
@@ Código
```python
REZAGOS = list(range(24)) + [48, 72, 168]
def rezagos(serie):
    return pd.DataFrame({f"lag{L}": serie.shift(L) for L in REZAGOS}, index=serie.index)
X_rez = rezagos(y)
corr_rez = pd.DataFrame({f"objetivo a {h} h": X_rez.corrwith(y.shift(-h)) for h in (1, 6, 24)})
print(corr_rez.loc[["lag0", "lag1", "lag2", "lag6", "lag12", "lag23", "lag48", "lag72", "lag168"]].round(3).to_string())
```
@@ Lectura
- Para pronosticar **1 hora** adelante, el valor actual (`lag0`) tiene correlación {{=corr_rez.loc['lag0', 'objetivo a 1 h']|.3f}}: la persistencia lo es casi todo.
- A **24 horas**, la correlación del valor actual baja a {{=corr_rez.loc['lag0', 'objetivo a 24 h']|.2f}}, y el rezago 23 (la misma hora de ayer respecto al momento pronosticado) vale {{=corr_rez.loc['lag23', 'objetivo a 24 h']|.2f}}. Ninguno basta solo: hay que combinarlos.
- Los rezagos de 2, 3 y 7 días todavía aportan ({{=corr_rez.loc['lag168', 'objetivo a 24 h']|.2f}} a una semana): es la memoria de la temporada que se vio en la ACF.
@@ Decisión
✅ Se usarán los 27 rezagos. Un modelo lineal regularizado (Ridge) podrá repartir el peso entre ellos sin sobreajustar. Faltan los **estadísticos móviles** y las variables físicas.
:::

:::pastilla verde | Aplicar · Estadísticos móviles y variables físicas | u1:moviles u2:requisitos-exog u2:exogenas {#car-moviles}
Resumir el pasado reciente con **medias, desviaciones, mínimos y máximos móviles**, y agregar variables **físicas** medidas en la turbina que podrían anticipar cambios: la presión atmosférica y su tendencia, la temperatura y la dirección del viento. Todas se conocen en el momento del origen.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| medias móviles | 6, 24, 72 y 168 h | Nivel reciente a varias escalas; la de 168 h sigue la temporada. |
| desviación, mínimo y máximo | ventana de 24 h | Qué tan agitado estuvo el último día. |
| `rolling(…)` sin `center` | solo el pasado | El valor en $t$ usa de $t-k+1$ a $t$. |
| `dpres3`, `dpres24` | cambio de presión en 3 y 24 h | Los nortes llegan con un aumento de presión: un barómetro que sube puede anticipar viento. |
| `dir_s`, `dir_c` | seno y coseno de la dirección | La dirección es circular (359° está junto a 1°); el seno y el coseno lo respetan. |
@@ Código
```python
presion = s10["BaroPressMean"].resample("h").mean().interpolate(limit_direction="both")
rad = np.deg2rad(s10["WindDirMean"])
dir_s = np.sin(rad).resample("h").mean().interpolate(limit_direction="both")
dir_c = np.cos(rad).resample("h").mean().interpolate(limit_direction="both")

def moviles_y_fisicas(serie):
    X = pd.DataFrame(index=serie.index)
    for k in (6, 24, 72, 168):
        X[f"media{k}"] = serie.rolling(k).mean()
    X["desv24"], X["min24"], X["max24"] = serie.rolling(24).std(), serie.rolling(24).min(), serie.rolling(24).max()
    X["presion"], X["dpres3"], X["dpres24"] = presion, presion.diff(3), presion.diff(24)
    X["temp"], X["dir_s"], X["dir_c"] = temp_h, dir_s, dir_c
    return X
X_mov = moviles_y_fisicas(y)
cambio_24 = y.shift(-24) - y                                  # cuánto cambiará el viento en 24 h
print("Correlación con el cambio del viento en las próximas 24 h:")
print(X_mov.corrwith(cambio_24).round(3).to_string())
```
@@ Lectura
- Todas las medias móviles se correlacionan **negativamente** con el cambio futuro, sobre todo las cortas ({{=X_mov['media6'].corr(cambio_24)|.2f}} la de 6 horas, {{=X_mov['media168'].corr(cambio_24)|.2f}} la de 7 días): es la **reversión a la media**. Si el viento de las últimas horas está alto, lo más probable es que baje.
- El **cambio de presión en 24 h** se correlaciona {{=X_mov['dpres24'].corr(cambio_24)|.2f}} con el cambio del viento: una presión que sube tiende a anticipar más viento (la llegada de un norte). Es una relación modesta pero tiene sentido físico.
- La dirección del viento también informa ({{=X_mov['dir_c'].corr(cambio_24)|.2f}} con el coseno, que vale 1 cuando el viento viene del norte): si el norte ya está soplando, lo más probable es que empiece a amainar.
@@ Decisión
✅ Variables listas. Antes de juntar todo hay que revisar el error más común y más caro al construir características: la **fuga de información**.
:::

:::pastilla rojo | Aplicar · La fuga de información: una media móvil centrada | u2:fuga u1:mm-centrada {#car-fuga}
Mostrar con un experimento qué pasa si una característica usa, sin querer, **datos del futuro**. La media móvil **centrada** (`center=True`), útil para describir una serie, en el momento $t$ promedia horas posteriores a $t$.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `rolling(24, center=True)` | centrada | Promedia de $t-12$ a $t+11$: 11 horas del futuro. |
| modelo | regresión lineal a 6 horas | Con el valor actual y la media móvil, mal y bien construida. |
| evaluación | validación | La misma ventana que se usa para elegir modelos. |
@@ Código
```python
from sklearn.linear_model import LinearRegression

objetivo6 = y.shift(-6)
def error_con(media):
    X = pd.DataFrame({"actual": y, "media": media, "obj": objetivo6}).dropna()
    entrena, evalua = X[X.index < ini_val - pd.Timedelta(hours=6)], X[(X.index >= ini_val) & (X.index < y_te.index[0] - pd.Timedelta(hours=6))]
    m = LinearRegression().fit(entrena[["actual", "media"]], entrena["obj"])
    return np.mean(np.abs(evalua["obj"] - m.predict(evalua[["actual", "media"]])))
mae_fuga = error_con(y.rolling(24, center=True).mean())
mae_ok = error_con(y.rolling(24).mean())
print(f"MAE a 6 horas con la media CENTRADA (fuga): {mae_fuga:.3f} m/s")
print(f"MAE a 6 horas con la media del pasado:      {mae_ok:.3f} m/s")
print(f"Persistencia a 6 horas en la validación:     {np.mean(np.abs(objetivo6 - y)[ini_val:y_te.index[0] - pd.Timedelta(hours=7)]):.3f} m/s")
```
@@ Lectura
- Con la media centrada, el error a 6 horas baja a **{{=mae_fuga|.2f}} m/s**, muy por debajo de la persistencia. Parece un modelo excelente.
- Es una trampa: la media centrada en $t$ ya contiene el viento de $t+1$ a $t+11$, que incluye el valor que se quiere pronosticar. En operación, a la medianoche, esos datos **no existen**.
- Con la media construida solo con el pasado, el error es **{{=mae_ok|.2f}} m/s**: la mejora es real pero modesta.
@@ Decisión
❌ **Toda característica debe calcularse con datos disponibles en el origen.** En este flujo: rezagos con `shift`, medias móviles sin `center`, y las variables físicas medidas hasta el origen. Las de calendario se refieren al momento pronosticado, que sí se conoce de antemano. Con eso, el siguiente paso arma la tabla para pronosticar 24 horas.
:::

:::pastilla azul | Aplicar · La tabla directa: un modelo por cada horizonte | u2:estrategias u2:guia-estrategias {#car-tabla}
Armar los datos para que un modelo de aprendizaje automático pronostique **24 horas a la vez**. Se usa la **estrategia directa**: para cada horizonte $h = 1, \dots, 24$ se entrena un modelo distinto con las características del origen y el viento $h$ horas después como objetivo.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| estrategia directa | 24 modelos | La alternativa recursiva usa su propio pronóstico como rezago y acumula errores; la directa no, a cambio de entrenar 24 modelos. |
| `origen`, `momento` | columnas | El origen es cuándo se pronostica; el momento, la hora pronosticada. |
| filas de entrenamiento | todos los orígenes horarios | Para entrenar sirve cualquier hora como origen; para evaluar, solo las 23:00. |
@@ Código
```python
X_base = pd.concat([X_rez, X_mov], axis=1)
partes = []
for h in range(1, 25):
    P = X_base.copy()
    P["h"], P["y"] = h, y.shift(-h)
    P["origen"], P["momento"] = P.index, P.index + pd.Timedelta(hours=h)
    partes.append(pd.concat([P, calendario(P["momento"]).set_index(P.index)], axis=1))
tabla_directa = pd.concat(partes).dropna()
VIENTO = list(X_rez.columns) + ["media6", "media24", "media72", "media168", "desv24", "min24", "max24"]
FISICAS = ["presion", "dpres3", "dpres24", "temp", "dir_s", "dir_c"]
CALENDARIO = ["hora", "dia_sem", "mes", "trimestre", "festivo"]

def separar(desde, hasta):
    """Entrenamiento: todo lo que ocurrió antes de `desde`. Evaluación: orígenes de las 23:00 cuyos momentos caen en [desde, hasta)."""
    entrena = tabla_directa[tabla_directa["momento"] < desde]
    evalua = tabla_directa[(tabla_directa["origen"].dt.hour == 23) & (tabla_directa["origen"] >= desde - pd.Timedelta(hours=1))
                           & (tabla_directa["momento"] < hasta)]
    return entrena, evalua
ent_val, ev_val = separar(ini_val, y_te.index[0])
print(f"Tabla directa: {len(tabla_directa):,} filas × {tabla_directa.shape[1]} columnas")
print(f"Validación: {len(ent_val):,} filas para entrenar | {len(ev_val):,} para evaluar ({ev_val['origen'].nunique()} orígenes × 24)")
print(f"Características: {len(VIENTO)} del viento, {len(FISICAS)} físicas, {len(CALENDARIO)} de calendario")
```
@@ Lectura
- Cada origen genera 24 filas, una por horizonte: la tabla tiene {{=len(tabla_directa)|,}} filas.
- Para la validación se entrena con todo lo anterior al {{=ini_val.strftime('%d/%m')}} y se evalúa en los mismos {{=ev_val['origen'].nunique()}} orígenes de medianoche que los modelos clásicos. Los resultados serán **directamente comparables**.
- Hay tres grupos de características: **viento** ({{=len(VIENTO)}}), **físicas** ({{=len(FISICAS)}}) y **calendario** ({{=len(CALENDARIO)}}). Se probará qué grupos ayudan.
@@ Decisión
La tabla está lista para la Fase 5b. Antes, los **modelos clásicos**, que trabajan directamente con la serie √y.
:::
