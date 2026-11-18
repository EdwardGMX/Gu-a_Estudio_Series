## 🧹 Limpieza de los datos {#limpieza}
@mapa Del archivo dañado a una serie horaria completa: qué trae el archivo, qué le pasó, cómo se validan las fechas, qué valores son imposibles, cuándo la turbina estaba parada, cómo se pasa a horas y cómo se rellenan los huecos.

:::pastilla azul | Explorar · Qué trae el archivo, tal como viene | u1:pandas u1:elementos {#limp-archivo}
Mirar el archivo antes de cargarlo. Un archivo SCADA es texto separado por comas: el encabezado dice cuántos campos debería tener cada línea, y contar los campos de cada línea es la forma más rápida de saber si está sano.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `muestra_cruda.txt` | encabezado + 24 líneas | Un ejemplo de cada tipo de línea del archivo original de 280 MB, sin tocar. |
| `split(",")` | separador coma | Contar campos sin interpretar nada: si una línea tiene más o menos campos que el encabezado, algo le pasó. |
@@ Código
```python
crudo = (RUTA_DATOS / "muestra_cruda.txt").read_text(encoding="utf-8").splitlines()
encabezado = crudo[0].split(",")
print(f"Campos en el encabezado: {len(encabezado)}")
print("Los primeros ocho:", encabezado[:8])
campos_por_linea = pd.Series([len(l.split(",")) for l in crudo[1:]])
print("\nCampos por línea en la muestra (campos: líneas):")
print(campos_por_linea.value_counts().sort_index().to_string())
print("\nUna línea normal, primeros 110 caracteres:")
print(crudo[1][:110])
```
@@ Resultado
```python oculto
cpl = campos_por_linea.value_counts().sort_index()
grafica("limp-campos", [barras([str(k) for k in cpl.index], cpl.values, "líneas", ["menta" if k == len(encabezado) else "dur" for k in cpl.index],
                               hovertemplate="%{x} campos: %{y} líneas<extra></extra>")],
        alto=250, showlegend=False, title={"text": "¿Cuántos campos tiene cada línea de la muestra?"},
        xaxis={"title": {"text": "campos en la línea"}, "type": "category"}, yaxis={"title": {"text": "líneas"}})
```
@widget lab-graf id=limp-campos
@@ Lectura
- El encabezado tiene **{{=len(encabezado)}} campos**, pero sus nombres están **partidos**: `UTCDBTimeS` y `tamp` eran una sola columna, `UTCDBTimeStamp`. Alguien abrió el archivo en un programa que cortó los nombres largos.
- Las líneas de la muestra tienen de 1 a 175 campos. Solo las que tienen exactamente {{=len(encabezado)}} se pueden leer tal cual; las de 173 y 174 perdieron alguna coma, y las de 43 o 44 están cortadas.
- Las líneas de un solo campo están **vacías**: solo comas o espacios.
@@ Decisión
⚠️ `pd.read_csv` no sirve directo: leería mal las columnas de las líneas dañadas sin avisar. Hay que clasificar cada línea antes de cargarla.
:::

:::pastilla amarillo | Explorar · Los daños del archivo completo | u1:pandas {#limp-danos}
Clasificar cada línea del archivo según lo que le pasó y contar cuántas hay de cada tipo en el archivo completo. El conteo se hizo una vez con el archivo original (el script `preparar_datos.py`) y se guardó en `perfil_archivo.json`; aquí se aplica la misma clasificación a la muestra para ver cómo funciona.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `PREFIJO` | expresión regular de fecha, hora y turbina | Si el inicio de la línea no se reconoce, la línea es ilegible. |
| `N_CAMPOS = 166` | campos de una línea sana después del prefijo | La referencia para decidir si una línea está completa. |
| `PEGADO` | dígito, guion, dígito | Una coma perdida antes de un número negativo pega dos campos (`12.5-3.1`). |
| `ANCLA = 131` | columna con el nombre de la turbina | Si la ancla está en su lugar, las columnas anteriores son confiables aunque la línea esté cortada. |
@@ Código
```python
import re, json

PREFIJO = re.compile(r"^(\d\d/\d\d/\d{4}),([\d:.]+),(MV\d\d),(\d{4}-\d\d-\d\d),(\d\d:\d\d:\d\d),(-?\d+),(-?\d+),"
                     r"(\d{4}-\d\d),?(-?\d\d),(\d\d:\d\d:\d\d),(.*)$")
PEGADO = re.compile(r"(?<=\d)-(?=\d)")
N_CAMPOS, ANCLA = 166, 131

def clasificar(linea):
    """Qué le pasó a una línea del archivo crudo."""
    if not linea.strip("\t ,"):
        return "vacía"
    m = PREFIJO.match(linea)
    if not m:
        return "ilegible"
    campos = m.group(11).split(",")
    if len(campos) == N_CAMPOS:
        return "completa"
    if len(PEGADO.sub(",-", m.group(11)).split(",")) == N_CAMPOS:
        return "reparada"
    if len(campos) > ANCLA and campos[ANCLA] == m.group(3):
        return "parcial"
    return "truncada" if len(linea) <= 330 else "ilegible"

print("En la muestra:", pd.Series([clasificar(l) for l in crudo[1:]]).value_counts().to_dict())
perfil = json.loads((RUTA_DATOS / "perfil_archivo.json").read_text(encoding="utf-8"))
por_estado = pd.Series(perfil["por_estado"]).sort_values(ascending=False)
print(f"\nEn el archivo completo ({perfil['lineas']:,} líneas):")
print((por_estado / por_estado.sum() * 100).round(2).astype(str).add(" %").to_string())
print("\nTurbinas que trae:", perfil["turbinas"])
```
@@ Resultado
```python oculto
orden_est = ["completa", "reparada", "parcial", "truncada", "ilegible", "vacía"]
col_est = {"completa": "menta", "reparada": "cel", "parcial": "mant", "truncada": "dur", "ilegible": "rojo", "vacía": "gris"}
grafica("limp-estados", [barras(orden_est, [por_estado.get(e, 0) for e in orden_est], "líneas", [col_est[e] for e in orden_est],
                                hovertemplate="%{x}: %{y:,} líneas<extra></extra>")],
        alto=270, title={"text": "Las 1,048,576 líneas del archivo, según lo que les pasó"}, showlegend=False, yaxis={"title": {"text": "líneas"}})
filas_t = []
for t in perfil["turbinas"]:
    c = {e: perfil["por_turbina"].get(f"{t}|{e}", 0) for e in orden_est[:-1]}
    tot = sum(c.values())
    filas_t.append([t, f"{tot:,}", f"{100 * tot / 52560:.0f}%"] + [f"{c[e]:,}" for e in orden_est[:-1]])
tabla("limp-turbinas", ["turbina", "registros", "del año", "completos", "reparados", "parciales", "truncados", "ilegibles"], filas_t,
      ["elegido"] + [""] * 5, titulo="Registros por turbina en el archivo completo",
      nota="Un año completo son 52,560 registros de 10 minutos. Los truncados y los ilegibles no traen viento ni potencia.")
```
@widget lab-graf id=limp-estados
@widget lab-tabla id=limp-turbinas
@@ Lectura
- **El {{=100 * por_estado['vacía'] / por_estado.sum()|.0f}}% de las líneas está vacío.** El archivo tiene exactamente 1,048,576 líneas, el máximo de filas de una hoja de Excel: alguien lo guardó desde Excel y todo lo que no cabía se perdió. Por eso solo trae **seis turbinas** de las 25 que promete el nombre.
- De las líneas con datos, la mayoría está completa; las **reparadas** son las que perdieron la coma antes de un número negativo y se pueden restituir.
- Las **truncadas** y las **ilegibles** ({{=100 * (por_estado['truncada'] + por_estado['ilegible']) / por_estado.sum()|.1f}}% del archivo) conservan la fecha, pero no el viento ni la potencia.
- MV01 es una de las turbinas con el año casi completo; MV06 se corta en septiembre.
@@ Decisión
✅ Se trabaja con **MV01**. Las líneas reparadas se usan; las truncadas e ilegibles quedan como huecos con su fecha, para no perder la rejilla de tiempo.
:::

:::pastilla verde | Aplicar · Cargar los datos reparados de MV01 | u1:pandas u1:elementos {#limp-cargar}
Cargar el archivo ya reparado de la turbina MV01 y revisar qué variables trae, en qué unidades y cuántos faltantes tiene cada una. Es el **diccionario de datos**: sin él no se sabe qué significa cada columna.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `scada_mv01_2019_10min.csv.gz` | 28 variables de MV01 | Las columnas útiles del archivo original, ya alineadas. |
| `fila` | completa, reparada, parcial o ilegible | Cada registro recuerda de qué tipo de línea salió. |
| `DICCIONARIO` | qué mide cada columna y su unidad | Las unidades se deducen de los rangos y de la documentación habitual de los SCADA. |
@@ Código
```python
scada = pd.read_csv(RUTA_DATOS / "scada_mv01_2019_10min.csv.gz")
print(f"{len(scada):,} registros de 10 minutos y {scada.shape[1]} columnas")
print("\nDe qué tipo de línea salió cada registro:")
print(scada["fila"].value_counts().to_string())

DICCIONARIO = {
    "WindSpdMean": ("velocidad media del viento en la góndola", "m/s"), "WindSpdSdev": ("desviación estándar del viento en los 10 min", "m/s"),
    "WindSpdMin": ("viento mínimo en los 10 min", "m/s"), "WindSpdMax": ("viento máximo en los 10 min", "m/s"),
    "WindDirMean": ("dirección del viento", "grados"), "YawPosMean": ("orientación de la góndola", "grados"),
    "YawErrMean": ("error de orientación respecto al viento", "grados"), "RealPowerMean": ("potencia activa", "kW"),
    "RealPowerSdev": ("desviación estándar de la potencia", "kW"), "ReactivePowerMean": ("potencia reactiva", "kVAr"),
    "RealPowerLimitMean": ("límite de potencia impuesto", "kW"), "PitchPos1Mean": ("ángulo de la aspa 1", "grados"),
    "GenSpdMean": ("velocidad del generador", "rpm"), "HubSpdMean": ("velocidad del rotor", "rpm"),
    "AmbTempMean": ("temperatura ambiente", "°C"), "NacTempMean": ("temperatura de la góndola", "°C"),
    "GBOilTempMean": ("temperatura del aceite de la caja de engranes", "°C"), "BrgTemp1Mean": ("temperatura del rodamiento", "°C"),
    "GenTemp1Mean": ("temperatura del generador", "°C"), "BaroPressMean": ("presión barométrica", "hPa"),
    "AirDensityMean": ("densidad del aire", "kg/m³"), "TurbineState": ("estado de operación", "código"),
    "FaultCode": ("código de falla", "código"), "OpStatusCode": ("estado operativo", "código"),
    "ExpectedEnergy": ("energía esperada en los 10 min", "kWh"), "LostEnergy": ("energía perdida en los 10 min", "kWh"),
    "DeltaRunState": ("cambio de estado de marcha", "conteo"), "DeltaFault": ("cambio de falla", "conteo")}
faltan = scada[list(DICCIONARIO)].isna().mean()
print(f"\nVariables descritas: {len(DICCIONARIO)} | faltante promedio: {faltan.mean():.1%} | la que más falta: {faltan.idxmax()} ({faltan.max():.1%})")
```
@@ Resultado
```python oculto
tabla("limp-diccionario", ["columna", "qué mide", "unidad", "faltantes"],
      [[c, d, u, f"{100 * faltan[c]:.1f}%"] for c, (d, u) in DICCIONARIO.items()],
      ["elegido" if c == "WindSpdMean" else ("reserva" if c in ("RealPowerMean", "TurbineState") else "") for c in DICCIONARIO],
      titulo="Diccionario de datos de MV01",
      nota="Verde: la variable objetivo. Amarillo: las que se usan para limpiarla.")
```
@widget lab-tabla id=limp-diccionario
@@ Lectura
- MV01 tiene {{=len(scada)|,}} registros: casi los 52,560 de un año completo. {{=scada['fila'].isin(['ilegible', 'truncada']).sum()|,}} vienen de líneas ilegibles o truncadas y no tienen viento.
- Hay de todo: viento, potencia, ángulos, velocidades de giro, temperaturas, presión y códigos de estado. La **variable objetivo** es `WindSpdMean`, el viento medio de cada 10 minutos.
- Los faltantes son pocos en casi todas las columnas (en promedio {{=100 * faltan.mean()|.1f}}%); los que tienen más son contadores de eventos que el equipo no siempre escribe.
@@ Decisión
✅ Se usan `WindSpdMean` como objetivo y `RealPowerMean`, `WindSpdSdev` y `TurbineState` para limpiarla. Las demás variables se revisan en la exploración.
:::

:::pastilla amarillo | Aplicar · Validación temporal: orden, duplicados y horario de verano | u1:pandas u1:iid {#limp-fechas}
Comprobar que el índice de tiempo esté **ordenado y sin duplicados**. El archivo trae dos relojes: la hora UTC y la hora local del equipo. Hay que decidir cuál usar.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `is_monotonic_increasing` | orden | Una serie de tiempo necesita el tiempo en orden. |
| `duplicated()` | duplicados | Dos registros con la misma hora no se pueden ordenar. |
| desfase UTC − local | horas | Si cambia durante el año, el reloj local tiene horario de verano. |
@@ Código
```python
scada["ts_utc"] = pd.to_datetime(scada["ts_utc"])
scada["ts_local"] = pd.to_datetime(scada["ts_local"])
print("¿Ordenado por la hora UTC?", scada["ts_utc"].is_monotonic_increasing, "| ¿por la local?", scada["ts_local"].is_monotonic_increasing)
print("Duplicados en UTC:", scada["ts_utc"].duplicated().sum(), "| en hora local:", scada["ts_local"].duplicated().sum())
desfase = (scada["ts_utc"] - scada["ts_local"]).dt.total_seconds() / 3600
print("\nDesfase UTC − local (horas: registros):")
print(desfase.value_counts().to_string())
cambios = scada.loc[desfase.diff().fillna(0) != 0, ["ts_utc", "ts_local"]]
print("\nDónde cambia el desfase:")
print(cambios.to_string())
```
@@ Resultado
```python oculto
des_d = desfase.groupby(scada["ts_utc"].dt.floor("D")).mean()
grafica("limp-desfase", [linea(des_d.index, des_d, "UTC − hora local", "dur", 2.4, shape="hv")], alto=240, showlegend=False,
        title={"text": "Diferencia entre el reloj UTC y el reloj local del equipo"}, yaxis={"title": {"text": "horas"}, "range": [4.5, 6.5]})
```
@widget lab-graf id=limp-desfase
@@ Lectura
- El archivo viene **ordenado por la hora local**, pero esa hora tiene un registro **duplicado**. La hora UTC no tiene duplicados, aunque el archivo no viene en ese orden.
- El desfase UTC − local vale **5 horas** de marzo a noviembre y **6 horas** el resto del año: el reloj del equipo usa **horario de verano**, y lo cambia en las fechas de Estados Unidos (10 de marzo y 3 de noviembre de 2019).
- El 10 de marzo la hora local salta de las 02:00 a las 03:00 (esa hora no existe) y el 3 de noviembre la 01:00 se repite (la hora duplicada).
@@ Decisión
🟡 La hora local **no sirve como índice**: tiene una hora que no existe y otra que se repite. Se usará la hora **UTC menos 6 horas**, la hora estándar del centro de México sin cambio de horario. Es la regla de la Unidad I: el índice debe estar ordenado, sin duplicados y con frecuencia fija.
:::

:::pastilla verde | Aplicar · La rejilla de 10 minutos y los huecos | u1:pandas u1:elementos {#limp-rejilla}
Construir el índice **completo** del año, un registro cada 10 minutos, y reindexar los datos. Así los registros que faltan aparecen como `NaN` en su lugar, y se pueden contar y medir sus **rachas**.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `ts = ts_utc − 6 h` | hora estándar del centro, fija | Sin horario de verano: ni horas duplicadas ni horas que no existen. |
| `pd.date_range(…, freq="10min")` | 52,560 marcas | El año completo con la frecuencia del SCADA. |
| rachas | grupos de `NaN` consecutivos | No es lo mismo un registro suelto que un día entero sin datos. |
@@ Código
```python
scada = scada.sort_values("ts_utc")
scada["ts"] = scada["ts_utc"] - pd.Timedelta(hours=6)
s10 = scada.set_index("ts").drop(columns=["ts_utc", "ts_local"])
rejilla = pd.date_range("2019-01-01 00:00", "2019-12-31 23:50", freq="10min")
sin_registro = rejilla.difference(s10.index)
s10 = s10.reindex(rejilla)
print("¿Ordenado?", s10.index.is_monotonic_increasing, "| ¿duplicados?", s10.index.duplicated().any(), "| frecuencia:", pd.infer_freq(s10.index[:100]))
print(f"Registros esperados: {len(rejilla):,} | sin registro: {len(sin_registro)}")

sin_viento = s10["WindSpdMean"].isna()
print(f"\nSin dato de viento: {sin_viento.sum():,} registros ({sin_viento.mean():.1%})")
print(s10.loc[sin_viento, "fila"].fillna("sin registro").value_counts().to_string())
grupo = sin_viento.ne(sin_viento.shift()).cumsum()
rachas = sin_viento.groupby(grupo).agg(inicio=lambda g: g.index[0], largo="size", hueco="first").query("hueco")
print(f"\n{len(rachas)} rachas: {(rachas['largo'] == 1).sum()} de un registro, {(rachas['largo'] <= 6).sum()} de una hora o menos;"
      f" la más larga dura {rachas['largo'].max() / 6:.1f} h")
```
@@ Resultado
```python oculto
faltan_dia = sin_viento.resample("D").sum()
grafica("limp-huecos", [barras(faltan_dia.index, faltan_dia, "registros sin viento", "dur", hovertemplate="%{x|%d %b}: %{y} registros<extra></extra>")],
        alto=250, title={"text": "Registros de 10 minutos sin viento, por día (máximo 144)"}, showlegend=False, yaxis={"title": {"text": "registros"}})
lr = rachas["largo"].clip(upper=200).value_counts().sort_index()
grafica("limp-rachas", [barras([str(k) for k in lr.index], lr.values, "rachas", "lav", hovertemplate="%{x} registros seguidos: %{y} rachas<extra></extra>")],
        alto=240, showlegend=False, title={"text": "Largo de las rachas de huecos"},
        xaxis={"title": {"text": "registros de 10 minutos seguidos sin viento"}, "type": "category"}, yaxis={"title": {"text": "rachas"}, "type": "log"})
```
@widget lab-graf id=limp-huecos
@widget lab-graf id=limp-rachas
@@ Lectura
- Con la hora fija, el índice queda **ordenado, sin duplicados y con frecuencia de 10 minutos**. Faltan {{=len(sin_registro)}} registros que nunca existieron: la hora perdida por el cambio de horario.
- Faltan {{=sin_viento.sum()|,}} datos de viento ({{=100 * sin_viento.mean()|.1f}}%), casi todos de líneas ilegibles o truncadas.
- La mayoría de los huecos son **sueltos**: {{=(rachas['largo'] == 1).sum()}} de {{=len(rachas)}} rachas son de un solo registro. Pero hay unos cuantos largos, el mayor de {{=rachas['largo'].max() / 6|.0f}} horas.
@@ Decisión
✅ La rejilla completa es la base de todo lo que sigue. Los huecos sueltos desaparecerán al promediar por hora; los largos necesitarán imputación.
:::

:::pastilla verde | Aplicar · Valores imposibles: centinelas y rangos físicos | u1:estadisticos {#limp-centinelas}
Buscar valores que **no pueden ser mediciones**: los centinelas (números que el equipo escribe cuando no tiene dato) y los valores fuera del rango físico de cada sensor. Un valor imposible es un dato faltante disfrazado.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| centinelas | −2184.6 y 3268.2 | Se repiten exactos en varias columnas: son marcas de "sin dato". |
| `RANGOS` | mínimo y máximo físico por sensor | Ninguna temperatura ambiente de −2,000 °C ni presión de 3,000 hPa. |
@@ Código
```python
numericas = s10.select_dtypes("number")
centinelas = numericas.isin([-2184.6, 3268.2]).sum()
print("Valores −2184.6 o 3268.2 por columna:")
print(centinelas[centinelas > 0].to_string())

RANGOS = {"AmbTempMean": (-10, 50), "NacTempMean": (-10, 70), "GBOilTempMean": (-10, 90), "GenTemp1Mean": (-10, 150),
          "BrgTemp1Mean": (-10, 120), "BaroPressMean": (900, 1100), "AirDensityMean": (0.9, 1.4),
          "WindSpdMean": (0, 40), "RealPowerMean": (-50, 2400)}
fuera = {}
for col, (lo, hi) in RANGOS.items():
    malos = s10[col].notna() & ~s10[col].between(lo, hi)
    fuera[col] = int(malos.sum())
    s10.loc[malos, col] = np.nan
print("\nValores fuera de rango que pasan a NaN:")
print(pd.Series(fuera).to_string())
```
@@ Resultado
```python oculto
fz = pd.Series(fuera).sort_values()
grafica("limp-fuera", [barras(fz.values, fz.index, "valores", "rojo", orientation="h", hovertemplate="%{y}: %{x:,}<extra></extra>")],
        alto=290, showlegend=False, title={"text": "Valores imposibles que pasan a faltantes"}, margin={"l": 120},
        xaxis={"title": {"text": "registros (escala log)"}, "type": "log"})
```
@widget lab-graf id=limp-fuera
@@ Lectura
- Seis columnas de temperatura y presión tienen exactamente los mismos **centinelas** ({{=int(centinelas.max())}} veces cada una): el equipo escribe −2184.6 o 3268.2 cuando no tiene la lectura.
- La densidad del aire tiene {{=fuera['AirDensityMean']}} valores fuera de rango, casi los mismos que las líneas truncadas: son restos de líneas cortadas.
- **El viento y la potencia no tienen valores fuera de rango.**
@@ Decisión
✅ Los valores imposibles pasan a `NaN`. No afectan al viento, pero sí a las variables que se usan para explicarlo (temperatura, presión), que se revisan en la exploración.
:::

:::pastilla verde | Aplicar · El anemómetro apagado | u1:estadisticos {#limp-apagado}
Revisar los registros con viento **exactamente 0**. El viento casi nunca es cero durante 10 minutos completos; si además la desviación estándar es 0, el sensor no estaba midiendo.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `WindSpdMean == 0` | viento cero | Sospechoso en 10 minutos. |
| `WindSpdSdev == 0` | sin variación | Un anemómetro funcionando siempre varía un poco. |
| pegados | igual al anterior y al siguiente | Un sensor congelado repite el mismo valor. |
@@ Código
```python
cero = s10["WindSpdMean"] == 0
print(f"Registros con viento exactamente 0: {cero.sum()}")
print(s10.loc[cero, ["WindSpdSdev", "WindSpdMax", "RealPowerMean"]].describe().loc[["mean", "min", "max"]].round(2).to_string())
apagado = cero & (s10["WindSpdSdev"] == 0)
s10.loc[apagado, ["WindSpdMean", "WindSpdSdev", "WindSpdMin", "WindSpdMax"]] = np.nan
v10 = s10["WindSpdMean"]
pegado = v10.diff().eq(0) & v10.diff(-1).eq(0)
print(f"\nApagados que pasan a NaN: {apagado.sum()} | pegados que quedan: {pegado.sum()} | viento más bajo que queda: {v10.min():.2f} m/s")
apag_dia = apagado.resample("D").sum()
print("Días con más registros apagados:", apag_dia.nlargest(3).to_dict())
```
@@ Lectura
- Hay {{=cero.sum()}} registros con viento exactamente 0, y en **todos** la desviación estándar, el máximo y la potencia también valen 0. Un viento real de cero absoluto durante 10 minutos, sin la menor variación, es imposible: el anemómetro estaba apagado.
- Se concentran en unos pocos días de mayo (hasta {{=max(apag_dia.nlargest(1).values)}} registros en un día): un mantenimiento.
- Después de quitarlos, el viento más bajo que queda es {{=v10.min()|.2f}} m/s y casi no hay valores pegados.
@@ Decisión
✅ Los {{=apagado.sum()}} registros del anemómetro apagado pasan a `NaN`. Dejarlos habría metido días de "calma total" que nunca ocurrieron.
:::

:::pastilla azul | Explorar · Consistencia entre columnas | u1:estadisticos {#limp-consistencia}
Usar las relaciones que **deben** cumplirse entre columnas para encontrar errores que no se ven en una sola: el mínimo no puede ser mayor que la media, ni el máximo menor; la desviación estándar no puede ser negativa; y una turbina no produce mucha potencia sin viento.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| tolerancia | 0.05 m/s | Los promedios vienen redondeados. |
| potencia sin viento | más de 500 kW con menos de 3 m/s | La turbina arranca alrededor de 3.5 m/s. |
| viento sin potencia | se revisa después | Eso no es un error de medición: es un paro. |
@@ Código
```python
v = s10
minmax = (v["WindSpdMin"] > v["WindSpdMean"] + 0.05) | (v["WindSpdMax"] < v["WindSpdMean"] - 0.05)
sdev_neg = v["WindSpdSdev"] < 0
pot_sin_viento = (v["RealPowerMean"] > 500) & (v["WindSpdMean"] < 3)
gen_rotor = (v["GenSpdMean"] / v["HubSpdMean"]).where(v["HubSpdMean"] > 5)
print(f"Mínimo > media o máximo < media: {minmax.sum()}")
print(f"Desviación estándar negativa:    {sdev_neg.sum()}")
print(f"Más de 500 kW con menos de 3 m/s: {pot_sin_viento.sum()}")
print(f"\nRelación generador/rotor cuando gira: mediana {gen_rotor.median():.1f}, percentiles 1–99 {gen_rotor.quantile(.01):.1f}–{gen_rotor.quantile(.99):.1f}")
print("(es la relación de la caja de engranes: debe ser casi constante)")
```
@@ Resultado
```python oculto
mu = s10[["WindSpdMean", "RealPowerMean"]].dropna().sample(2500, random_state=1)
grafica("limp-consist", [puntos(mu["WindSpdMean"].round(2), mu["RealPowerMean"].round(0), "registros de 10 min", "lav", 3, opacity=0.35)],
        alto=300, showlegend=False, title={"text": "Viento contra potencia: el registro debe caer cerca de una curva"},
        xaxis={"title": {"text": "viento (m/s)"}}, yaxis={"title": {"text": "potencia (kW)"}})
```
@widget lab-graf id=limp-consist
@@ Lectura
- **Ninguna** violación: el mínimo nunca supera a la media, el máximo nunca es menor, ninguna desviación es negativa y la turbina nunca produce más de 500 kW con menos de 3 m/s.
- La relación entre la velocidad del generador y la del rotor es {{=gen_rotor.median()|.1f}} casi siempre: es la relación fija de la caja de engranes, y confirma que esas dos columnas son coherentes.
- La nube de viento contra potencia sigue una curva en S, con puntos en potencia cero a cualquier viento: son los **paros**, que se revisan enseguida.
@@ Decisión
✅ Las columnas son consistentes entre sí. Los únicos registros raros son los de viento útil y potencia cero, que no son errores de medición sino decisiones de operación.
:::

:::pastilla amarillo | Explorar · Saltos bruscos: ¿error o ráfaga? | u1:estadisticos u1:linea {#limp-saltos}
Buscar cambios grandes entre registros consecutivos y valores alejados de su vecindad. Un salto puede ser un error del sensor o una ráfaga real; para decidir se compara con la turbina vecina.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| salto | más de 6 m/s en 10 minutos | Un cambio así en el promedio de 10 minutos es raro. |
| z robusto | (y − mediana móvil) / (1.4826 · MAD) > 6 | La mediana y el MAD no se dejan arrastrar por los propios atípicos. |
| ventana | 2 horas (13 registros) | Compara cada registro con su vecindad inmediata. |
@@ Código
```python
v10 = s10["WindSpdMean"]
salto = v10.diff().abs()
print(f"Saltos de más de 6 m/s en 10 minutos: {(salto > 6).sum()} | el mayor: {salto.max():.1f} m/s el {salto.idxmax()}")
med = v10.rolling(13, center=True, min_periods=7).median()
mad = (v10 - med).abs().rolling(13, center=True, min_periods=7).median()
z_rob = (v10 - med) / (1.4826 * mad.replace(0, np.nan))
atipico = z_rob.abs() > 6
print(f"Registros con |z robusto| > 6: {atipico.sum()} ({atipico.mean():.2%})")
print(f"Viento medio de esos registros: {v10[atipico].mean():.1f} m/s contra {v10.mean():.1f} del año")
```
@@ Resultado
```python oculto
t0 = salto.idxmax()
win = slice(t0 - pd.Timedelta(hours=10), t0 + pd.Timedelta(hours=10))
grafica("limp-salto", [linea(v10[win].index, v10[win], "MV01", "osc", 2, mode="lines+markers", marker={"size": 4}),
                       puntos(v10[win][atipico[win]].index, v10[win][atipico[win]], "|z robusto| > 6", "rojo", 9)],
        alto=280, title={"text": f"Alrededor del mayor salto ({t0:%d/%m %H:%M})"}, yaxis={"title": {"text": "m/s"}})
```
@widget lab-graf id=limp-salto
@@ Lectura
- Hay solo {{=(salto > 6).sum()}} saltos de más de 6 m/s en 10 minutos; el mayor, de {{=salto.max()|.1f}} m/s, el {{=salto.idxmax().strftime('%d/%m a las %H:%M')}}. En la gráfica es un cambio real: el viento sube y se queda arriba, no es un pico aislado.
- El z robusto marca {{=atipico.sum()}} registros ({{=100 * atipico.mean()|.2f}}%). Su viento medio es más **bajo** que el del año ({{=v10[atipico].mean()|.1f}} contra {{=v10.mean()|.1f}} m/s): son ráfagas y caídas en ratos de viento débil, donde la vecindad es muy tranquila y cualquier cambio parece enorme.
@@ Decisión
🟡 **No se borra nada.** Los saltos coinciden con cambios de régimen y los atípicos robustos son variaciones reales de vientos débiles. Borrarlos quitaría justo lo que el pronóstico tiene que aprender. Se anota como pendiente para los residuos de la Unidad II.
:::

:::pastilla azul | Explorar · Estados de la turbina y códigos de falla | u1:estadisticos {#limp-estados}
Entender qué dicen las columnas de **estado**: cuánto tiempo pasa la turbina en cada estado y cuánta potencia produce en cada uno. Así se puede saber cuándo la turbina estaba trabajando normalmente.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `TurbineState` | código del controlador | Distingue marcha, espera, paro y falla. |
| potencia media por estado | kW | El estado de producción es el que tiene potencia. |
| `FaultCode` | código de falla | Indica la causa de algunos paros. |
@@ Código
```python
por_estado_t = s10.groupby("TurbineState").agg(registros=("RealPowerMean", "size"), potencia=("RealPowerMean", "mean"),
                                               viento=("WindSpdMean", "mean"))
por_estado_t["% del tiempo"] = 100 * por_estado_t["registros"] / por_estado_t["registros"].sum()
print(por_estado_t.sort_values("registros", ascending=False).round(1).head(8).to_string())
fallas = s10["FaultCode"].value_counts()
print(f"\nCódigos de falla distintos: {fallas.size} | el más común: {int(fallas.index[0])} ({fallas.iloc[0]:,} registros)")
print("Los cinco más comunes:", {int(k): int(v) for k, v in fallas.head(5).items()})
```
@@ Resultado
```python oculto
pe = por_estado_t.sort_values("registros", ascending=False).head(8)
grafica("limp-estado", [barras([f"estado {int(k)}" for k in pe.index], pe["% del tiempo"], "% del tiempo", "lav",
                               customdata=_vals(pe["potencia"], 0), hovertemplate="%{x}: %{y:.1f}% del tiempo<br>potencia media %{customdata} kW<extra></extra>")],
        alto=260, showlegend=False, title={"text": "Tiempo en cada estado de la turbina"}, yaxis={"title": {"text": "% del tiempo"}})
```
@widget lab-graf id=limp-estado
@@ Lectura
- La turbina pasa el **{{=por_estado_t.loc[8.0, '% del tiempo']|.0f}}%** del tiempo en el estado 8, el único con potencia alta ({{=por_estado_t.loc[8.0, 'potencia']|,.0f}} kW en promedio): es el estado de **producción**.
- Los estados 5 y 6 tienen viento bajo ({{=por_estado_t.loc[5.0, 'viento']|.1f}} y {{=por_estado_t.loc[6.0, 'viento']|.1f}} m/s): la turbina espera viento suficiente.
- Los estados 3, 13 y 15 tienen **viento alto y potencia casi cero**: son paros con viento útil. El estado 0 coincide con los {{=por_estado_t.loc[0.0, 'registros']}} registros del anemómetro apagado: la turbina estaba fuera de línea.
- Hay {{=fallas.size}} códigos de falla distintos; el 0 (sin falla) es el más común.
@@ Decisión
🔵 El estado explica la potencia, no el viento. Para la serie del viento lo que importa es saber cuándo hubo paros, porque cambian la potencia y quizá el viento medido.
:::

:::pastilla amarillo | Aplicar · Paros: viento útil sin potencia | u1:estadisticos u1:componentes {#limp-paros}
Detectar cuándo la turbina estaba **parada aunque había viento útil** y revisar si el viento medido en esos ratos es confiable. El anemómetro está en la góndola, detrás del rotor: cuando el rotor gira, mide un viento frenado por las aspas; cuando está parado, no. Se compara con la turbina vecina MV02.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| viento útil | 4 a 25 m/s | Entre el arranque y el corte de la turbina. |
| potencia | menos de 20 kW | La turbina no está produciendo. |
| cociente MV01 / MV02 | con y sin paro | Si el viento de MV01 cambia al pararse, el paro deja una huella en la serie. |
@@ Código
```python
v10, p10 = s10["WindSpdMean"], s10["RealPowerMean"]
paro = v10.between(4, 25) & (p10 < 20)
s10["paro"] = paro
print(f"Paro con viento útil: {paro.sum():,} registros = {paro.sum() / 6:,.0f} horas ({paro.mean():.1%} del año)")
print("Estados más comunes en los paros:", s10.loc[paro, "TurbineState"].value_counts().head(3).astype(int).to_dict())

parque = pd.read_csv(RUTA_DATOS / "scada_parque_2019_10min.csv.gz", parse_dates=["ts_utc"])
parque["ts"] = parque["ts_utc"] - pd.Timedelta(hours=6)
viento_parque10 = parque.pivot_table(index="ts", columns="device", values="WindSpdMean").reindex(rejilla).where(lambda x: x > 0)
cociente = (v10 / viento_parque10["MV02"]).where(viento_parque10["MV02"].between(5, 20))
print(f"\nCociente MV01/MV02 (mediana): operando {cociente[~paro].median():.3f} | en paro {cociente[paro].median():.3f}")
paro_mes = paro.groupby(paro.index.month).mean() * 100
print("\n% del tiempo en paro por mes:", paro_mes.round(1).to_dict())
```
@@ Resultado
```python oculto
grafica("limp-paro-mes", [barras(MESES, paro_mes.values, "% del tiempo en paro", ["dur" if m in (11, 12) else "lav" for m in paro_mes.index],
                                 hovertemplate="%{x}: %{y:.1f}%<extra></extra>")],
        alto=260, title={"text": "Tiempo con la turbina parada aunque había viento útil"}, showlegend=False, yaxis={"title": {"text": "% del mes"}})
cq = pd.DataFrame({"c": cociente, "p": paro}).dropna()
h_op = np.histogram(cq.loc[~cq["p"], "c"], bins=np.linspace(0.6, 1.4, 41), density=True)
h_pa = np.histogram(cq.loc[cq["p"], "c"], bins=np.linspace(0.6, 1.4, 41), density=True)
xm = (h_op[1][1:] + h_op[1][:-1]) / 2
grafica("limp-paro-cociente", [linea(xm, h_op[0], "turbina operando", "menta", 2.4, shape="hvh"), linea(xm, h_pa[0], "turbina en paro", "dur", 2.4, shape="hvh")],
        alto=270, title={"text": "Viento de MV01 entre viento de MV02"}, xaxis={"title": {"text": "MV01 / MV02"}}, yaxis={"title": {"text": "densidad"}})
```
@widget lab-graf id=limp-paro-mes
@widget lab-graf id=limp-paro-cociente
@@ Lectura
- La turbina estuvo parada con viento útil **{{=paro.sum() / 6|,.0f}} horas** ({{=100 * paro.mean()|.1f}}% del año), sobre todo en **noviembre y diciembre** (más del 20% del tiempo) y en julio y febrero.
- El cociente MV01/MV02 casi no cambia: {{=cociente[~paro].median()|.3f}} con la turbina operando y {{=cociente[paro].median()|.3f}} en paro. Las dos distribuciones se enciman. El anemómetro de MV01 mide prácticamente lo mismo con el rotor girando o parado.
@@ Decisión
🟡 Se **conserva el viento** de los paros: es un viento real y bien medido. Los paros se marcan porque afectan la **potencia**, y se retoman al convertir el pronóstico en energía y al buscar cambios estructurales.
:::

:::pastilla verde | Aplicar · De 10 minutos a horas, con una regla de completitud | u1:elementos u1:pandas {#limp-horaria}
Promediar los registros de cada hora para obtener la serie horaria, que es la frecuencia del pronóstico. Una hora con muy pocos registros no es representativa: se exige un mínimo.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `resample("h").mean()` | promedio horario | Un promedio de 6 registros de 10 minutos. |
| completitud | al menos 4 de 6 registros | Con 40 minutos medidos el promedio ya es representativo. |
@@ Código
```python
validos = s10["WindSpdMean"].resample("h").count()
viento_h = s10["WindSpdMean"].resample("h").mean().where(validos >= 4).rename("viento")
print(f"Horas: {len(viento_h):,} | con 6 registros: {(validos == 6).sum():,} | con 4 o 5: {validos.between(4, 5).sum()}"
      f" | sin dato (menos de 4): {viento_h.isna().sum()}")
hueco_h = viento_h.isna()
rachas_h = hueco_h.groupby(hueco_h.ne(hueco_h.shift()).cumsum()).agg(["first", "size"]).query("first")["size"]
print("\nRachas de horas faltantes (largo en horas: cuántas):")
print(rachas_h.value_counts().sort_index().to_string())
```
@@ Resultado
```python oculto
cuenta_val = validos.value_counts().sort_index()
grafica("limp-validos", [barras([str(k) for k in cuenta_val.index], cuenta_val.values, "horas", ["rojo" if k < 4 else ("mant" if k < 6 else "menta") for k in cuenta_val.index],
                                hovertemplate="%{x} registros válidos: %{y:,} horas<extra></extra>")],
        alto=250, title={"text": "Registros válidos en cada hora"}, showlegend=False, xaxis={"title": {"text": "registros de 10 minutos con viento"}},
        yaxis={"type": "log", "title": {"text": "horas (escala log)"}})
```
@widget lab-graf id=limp-validos
@@ Lectura
- De las {{=len(viento_h)|,}} horas del año, {{=(validos == 6).sum()|,}} tienen sus 6 registros y {{=validos.between(4, 5).sum()}} tienen 4 o 5. Solo **{{=viento_h.isna().sum()}} horas** quedan sin dato.
- Promediar por hora absorbió casi todos los huecos sueltos: de {{=len(rachas)}} rachas de 10 minutos quedan {{=len(rachas_h)}} rachas horarias, la mayoría de una hora y unas pocas largas (la mayor, de {{=rachas_h.max()}} horas).
@@ Decisión
✅ La serie horaria tiene 8,760 observaciones, muy por encima del mínimo de 100 del flujo. Quedan {{=viento_h.isna().sum()}} horas por imputar.
:::

:::pastilla verde | Explorar · La turbina vecina como respaldo | u1:lagplot {#limp-vecina}
Medir qué tan parecido es el viento de MV01 al de las otras turbinas del parque. Si una vecina se parece mucho, sirve para rellenar los huecos de MV01 con información real del mismo momento.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `viento_parque` | promedio horario de MV01 a MV06 | Mismo criterio que MV01: los ceros exactos son sensor apagado. |
| correlación | con MV01 en las horas que ambas tienen | La medida más simple de parecido. |
@@ Código
```python
viento_parque = viento_parque10.resample("h").mean()
corr_vec = viento_parque.drop(columns="MV01").corrwith(viento_h)
print("Correlación horaria con MV01:")
print(corr_vec.round(3).to_string())
vecina = viento_parque["MV02"]
print(f"\nMV02 tiene dato en {vecina[viento_h.isna()].notna().mean():.0%} de las horas que le faltan a MV01")
```
@@ Resultado
```python oculto
mm = pd.DataFrame({"a": viento_h, "b": vecina}).dropna().sample(2000, random_state=2).round(2)
grafica("limp-vecina", [puntos(mm["b"], mm["a"], "horas", "lav", 4, opacity=0.4), linea([0, 25], [0, 25], "y = x", "gris", 1.2, "dot")],
        alto=300, title={"text": "Viento horario de MV01 contra MV02"}, xaxis={"title": {"text": "MV02 (m/s)"}}, yaxis={"title": {"text": "MV01 (m/s)"}})
```
@widget lab-graf id=limp-vecina
@@ Lectura
- Las cinco turbinas tienen correlaciones de 0.97 a 0.99 con MV01. **MV02 es la más parecida** ({{=corr_vec['MV02']|.3f}}): la nube de puntos está pegada a la recta y = x.
- MV02 tiene dato en el {{=100 * vecina[viento_h.isna()].notna().mean()|.0f}}% de las horas que le faltan a MV01: los huecos casi nunca coinciden.
@@ Decisión
✅ MV02 es un buen respaldo: mide casi el mismo viento en el mismo momento. Se prueba como método de imputación junto con los del temario.
:::

:::pastilla amarillo | Aplicar · ¿Cómo rellenar los huecos? Un experimento | u1:moviles {#limp-imp-exp}
Comparar métodos de imputación con huecos **artificiales**: se borran horas que sí se conocen, se reconstruyen con cada método y se mide el error. Es la única forma honesta de elegir, porque en los huecos reales no se sabe la verdad.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| métodos | lineal, media móvil de 12 h, perfil horario, turbina vecina | Los dos que pide el flujo y dos alternativas. |
| largos | 1, 3, 6, 12 y 24 horas | Los huecos reales son de todos esos tamaños. |
| repeticiones | 40 por largo | Para que el promedio no dependa de un caso. |
@@ Código
```python
def imputar(serie, metodo):
    if metodo == "lineal":
        return serie.interpolate(method="time", limit_direction="both")
    if metodo == "media móvil (12 h)":
        return serie.fillna(serie.rolling(12, center=True, min_periods=2).mean()).interpolate(limit_direction="both")
    if metodo == "perfil horario":
        return serie.fillna(serie.groupby(serie.index.hour).transform("mean"))
    if metodo == "turbina vecina (MV02)":
        ok = serie.notna() & vecina.notna()
        b, a = np.polyfit(vecina[ok], serie[ok], 1)
        return serie.fillna(a + b * vecina).interpolate(limit_direction="both")

metodos = ["lineal", "media móvil (12 h)", "perfil horario", "turbina vecina (MV02)"]
rng = np.random.default_rng(2019)
conocido = viento_h.notna() & vecina.notna()
filas = []
for largo in [1, 3, 6, 12, 24]:
    errores = {m: [] for m in metodos}
    for _ in range(40):
        i = rng.integers(48, len(viento_h) - 48 - largo)
        bloque = viento_h.index[i:i + largo]
        if not conocido[bloque].all():
            continue
        oculta = viento_h.copy()
        oculta[bloque] = np.nan
        for m in metodos:
            errores[m].append(np.mean(np.abs(imputar(oculta, m)[bloque] - viento_h[bloque])))
    filas.append({"hueco (h)": largo, **{m: np.mean(e) for m, e in errores.items()}})
exp_imp = pd.DataFrame(filas).set_index("hueco (h)")
print("Error absoluto medio de la reconstrucción (m/s):")
print(exp_imp.round(2).to_string())
```
@@ Resultado
```python oculto
COL_IMP = {"lineal": "lav", "media móvil (12 h)": "cel", "perfil horario": "gris", "turbina vecina (MV02)": "menta"}
grafica("limp-imp-exp", [linea(exp_imp.index, exp_imp[m], m, COL_IMP[m], 2.6, mode="lines+markers") for m in metodos],
        alto=300, title={"text": "Error al reconstruir huecos de distinto largo"},
        xaxis={"title": {"text": "largo del hueco (horas)"}, "type": "log", "tickvals": [1, 3, 6, 12, 24]}, yaxis={"title": {"text": "MAE (m/s)"}})
```
@widget lab-graf id=limp-imp-exp
@@ Lectura
- **La turbina vecina gana en todos los largos** y su error no crece con el hueco (alrededor de {{=exp_imp['turbina vecina (MV02)'].mean()|.2f}} m/s): usa información real del mismo momento.
- La **interpolación lineal** es buena en huecos de una hora ({{=exp_imp.loc[1, 'lineal']|.2f}}) pero empeora con el largo ({{=exp_imp.loc[24, 'lineal']|.2f}} a 24 h): une los extremos con una recta y se pierde lo que pasó en medio.
- La **media móvil** queda detrás de la lineal: promediar 12 horas suaviza demasiado.
- El **perfil horario** es el peor (unos 4 m/s): el ciclo diario explica muy poco del viento de una hora concreta.
@@ Decisión
🟡 La interpolación lineal y la media móvil, que propone el flujo, funcionan en huecos cortos. Para los largos se usa la **turbina vecina**, y la interpolación queda como respaldo.
:::

:::pastilla verde | Aplicar · La imputación final y su marca | u1:pandas {#limp-imputar}
Rellenar los huecos de MV01 con la regresión sobre MV02 y, donde MV02 tampoco tiene dato, con interpolación lineal. Se guarda una **marca** de qué horas se imputaron, para poder revisarlas después.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `np.polyfit(vecina, mv01, 1)` | recta MV01 = a + b · MV02 | Corrige la diferencia de nivel entre turbinas. |
| `interpolate(method="time")` | respaldo | Para las horas en que tampoco hay vecina. |
| `imputada` | marca booleana | Las horas inventadas no deben pasar por medidas. |
@@ Código
```python
ok = viento_h.notna() & vecina.notna()
b_vec, a_vec = np.polyfit(vecina[ok], viento_h[ok], 1)
imputada = viento_h.isna()
por_vecina = imputada & vecina.notna()
y = viento_h.fillna(a_vec + b_vec * vecina).interpolate(method="time", limit_direction="both").clip(lower=0).rename("viento")
print(f"Regresión: viento MV01 = {a_vec:.3f} + {b_vec:.4f} · viento MV02")
print(f"Horas imputadas: {imputada.sum()} ({imputada.mean():.1%}) | con la vecina: {por_vecina.sum()} | con interpolación: {(imputada & ~por_vecina).sum()}")
print(f"¿Quedan NaN? {y.isna().sum()} | frecuencia: {pd.infer_freq(y.index)} | de {y.index[0]} a {y.index[-1]}")
```
@@ Resultado
```python oculto
ventana = slice("2019-07-19 00:00", "2019-07-23 23:00")
grafica("limp-imputar", [linea(viento_h[ventana].index, viento_h[ventana], "MV01 (medido)", "osc", 2),
                         linea(vecina[ventana].index, vecina[ventana], "MV02 (vecina)", "gris", 1.2, "dot"),
                         linea(y[ventana].index, y[ventana].where(imputada[ventana]), "MV01 imputado", "dur", 2.6)],
        alto=290, title={"text": "El hueco más largo (julio), relleno con la turbina vecina"}, yaxis={"title": {"text": "m/s"}})
```
@widget lab-graf id=limp-imputar
@@ Lectura
- La recta es MV01 = {{=a_vec|.3f}} + {{=b_vec|.3f}} · MV02: las dos turbinas miden casi lo mismo, con MV01 apenas {{=100 * (1 - b_vec)|.1f}}% por debajo.
- Se imputaron {{=imputada.sum()}} horas ({{=100 * imputada.mean()|.1f}}%): {{=por_vecina.sum()}} con la vecina y {{=(imputada & ~por_vecina).sum()}} con interpolación.
- En el hueco de julio, la parte imputada sigue la forma de MV02 hora por hora, con sus subidas y bajadas: una interpolación lineal habría dibujado una recta.
@@ Decisión
✅ La serie no tiene huecos, tiene frecuencia horaria fija y sus horas imputadas están marcadas.
:::

:::pastilla verde | Aplicar · Resumen de la limpieza | u1:elementos {#limp-resumen}
Reunir en una tabla todo lo que se cambió, para que cualquiera pueda reproducir la serie y saber qué tan "construida" está.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `y` | viento horario de MV01, 8,760 horas | La serie que se analiza en todo lo que sigue. |
| `imputada` | marca de horas rellenadas | Se usa para revisar residuos y errores más adelante. |
@@ Código
```python
resumen_limpieza = pd.DataFrame([
    ["líneas ilegibles o truncadas del archivo", int(por_estado.get("ilegible", 0) + por_estado.get("truncada", 0)), "sin viento ni potencia"],
    ["registros sin línea (horario de verano)", len(sin_registro), "huecos en la rejilla"],
    ["valores fuera de rango", int(sum(fuera.values())), "pasan a NaN"],
    ["anemómetro apagado (viento 0 sin variación)", int(apagado.sum()), "pasan a NaN"],
    ["registros en paro con viento útil", int(paro.sum()), "se conservan, con marca"],
    ["horas con menos de 4 registros", int(viento_h.isna().sum()), "imputadas"],
], columns=["qué", "cuántos", "qué se hizo"])
print(resumen_limpieza.to_string(index=False))
print(f"\nSerie final: {len(y):,} horas | media {y.mean():.2f} m/s | imputadas {imputada.mean():.1%}")
```
@@ Lectura
- La serie final tiene **{{=len(y)|,}} horas** con viento medio de {{=y.mean()|.2f}} m/s. Solo el {{=100 * imputada.mean()|.1f}}% de las horas es imputado.
- Lo más grave del archivo (las líneas perdidas por Excel) no afecta a MV01; lo que sí la afecta son los huecos de líneas ilegibles, el cambio de horario y el anemómetro apagado.
@@ Decisión
✅ La limpieza termina con una serie lista para explorar. Los paros quedan marcados y se retoman en la exploración y en las pruebas de cambio estructural de la Unidad I.
:::
