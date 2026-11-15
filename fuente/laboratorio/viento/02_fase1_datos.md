## 📂 Fase 1 · Los datos y la definición del problema {#fase-datos}
@mapa Leer el archivo crudo, reparar sus líneas, cargar la turbina MV01 y definir la variable objetivo, la frecuencia y el horizonte.

:::pastilla azul | Aplicar · Mirar el archivo crudo antes de leerlo | u1:pandas u1:serie {#crudo-encabezado}
Ver cómo viene el archivo **antes** de pedirle a pandas que lo interprete. La suposición S1 es que es un CSV común; si lo fuera, el encabezado y cada línea tendrían el mismo número de campos separados por comas.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `muestra_cruda.txt` | 24 líneas | Un ejemplo de cada tipo de línea del archivo original (el completo pesa 280 MB). |
| `.split(",")` | coma | Es lo que haría `pd.read_csv`: cortar en cada coma. |
| `value_counts()` | — | Si el archivo estuviera bien, todas las líneas tendrían 175 campos, como el encabezado. |
@@ Código
```python
crudo = (RUTA_DATOS / "muestra_cruda.txt").read_text(encoding="utf-8").splitlines()
encabezado = crudo[0].split(",")
print(f"Campos en el encabezado: {len(encabezado)}")
print("Los primeros diez:", encabezado[:10])

campos_por_linea = pd.Series([len(l.split(",")) for l in crudo[1:]])
print("\nCampos por línea en la muestra (campos: líneas):")
print(campos_por_linea.value_counts().sort_index().to_string())
print("\nUna línea normal, primeros 120 caracteres:")
print(crudo[1][:120])
```
@@ Lectura
- El encabezado tiene **{{=len(encabezado)}} campos**, pero los nombres están **partidos**: `UTCDBTimeS` y `tamp` deberían ser `UTCDBTimeStamp`; `DeviceTim` y `eStamp`, `DeviceTimeStamp`. En los datos pasa lo mismo: la fecha y la hora de cada marca de tiempo quedaron separadas por una coma (`01/01/2019,06:00:30.853`).
- No todas las líneas tienen 175 campos. Hay líneas de **1 campo** (vacías: solo tabuladores), de **43–44** (cortadas a la mitad) y de **173–174** (les falta alguna coma).
- Cada línea tiene **tres marcas de tiempo**: la hora en que llegó a la base de datos (`UTCDBTimeStamp`, con segundos y milisegundos), la del equipo en UTC (`UTCDeviceTimeStamp`, redondeada a 10 minutos) y la del equipo en hora local (`DeviceTimeStamp`). La segunda es la que identifica el intervalo de 10 minutos.
@@ Decisión
❌ **S1 no se sostiene**: `pd.read_csv` asignaría valores a columnas equivocadas en cuanto una línea tuviera menos campos, sin avisar. Hay que leer el archivo **línea por línea**, reconocer qué le pasó a cada una y repararla cuando se pueda. Eso hace el siguiente paso.
:::

:::pastilla verde | Aplicar · Reparar línea por línea: comas perdidas, líneas parciales y truncadas | u1:pandas {#crudo-reparar}
Escribir una función que **clasifique y repare** cada línea, y usarla en la muestra. Es la misma función que usa `preparar_datos.py` con el archivo completo.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `PREFIJO` | expresión regular | Reconoce las tres marcas de tiempo aunque vengan partidas, incluso la variante `2019-03,-06` de las líneas cortadas. |
| `PEGADO = (?<=\d)-(?=\d)` | un dígito seguido de un signo menos | En las líneas de 173–174 campos se perdió la coma antes de un número negativo: `6.6999998-20.9` son dos valores, `6.6999998` y `-20.9`. |
| `N_CAMPOS = 166` | campos después de las fechas | De `Seconds` a `ExtraBytes`. |
| `ANCLA = 131` | `AltWindSpeedSource` | Esa columna repite el nombre de la turbina. Si `MV01` está en la posición 131, todo lo que va antes está en su lugar. |
| `len(linea) <= 330` | 330 caracteres | Las líneas truncadas miden siempre 325 o 326 caracteres: se cortaron a la mitad. |
@@ Código
```python
import re
import json

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
        return "reparada"                          # se restituyó la coma antes de cada negativo
    if len(campos) > ANCLA and campos[ANCLA] == m.group(3):
        return "parcial"                           # valen las columnas antes de la ancla
    return "truncada" if len(linea) <= 330 else "ilegible"

estados_muestra = pd.Series([clasificar(l) for l in crudo[1:]])
print("En la muestra:")
print(estados_muestra.value_counts().to_string())

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
grafica("vt-estados", [barras(orden_est, [por_estado.get(e, 0) for e in orden_est], "líneas", [col_est[e] for e in orden_est],
                              hovertemplate="%{x}: %{y:,} líneas<extra></extra>")],
        alto=280, title={"text": "Las 1,048,576 líneas del archivo, por lo que les pasó"}, showlegend=False, yaxis={"title": {"text": "líneas"}})
filas_t = []
for t in perfil["turbinas"]:
    c = {e: perfil["por_turbina"].get(f"{t}|{e}", 0) for e in orden_est[:-1]}
    tot = sum(c.values())
    filas_t.append([t, f"{tot:,}"] + [f"{c[e]:,}" for e in orden_est[:-1]] + [f"{100 * (c['truncada'] + c['ilegible']) / tot:.1f}%"])
tabla("vt-turbinas", ["turbina", "registros", "completas", "reparadas", "parciales", "truncadas", "ilegibles", "sin viento ni potencia"], filas_t,
      ["elegido"] + [""] * 5, titulo="Registros por turbina en el archivo completo",
      nota="Un año completo son 52,560 registros de 10 minutos. Las líneas truncadas e ilegibles no traen viento ni potencia.")
```
@widget lab-graf id=vt-estados
@widget lab-tabla id=vt-turbinas
@@ Lectura
- **{{=100 * por_estado['vacía'] / por_estado.sum()|.0f}}% del archivo son líneas vacías** ({{=por_estado['vacía']|,}}). El archivo tiene exactamente 1,048,576 líneas, que es el **máximo de filas de Excel**: casi seguro se abrió y se guardó en Excel, que rellenó filas vacías y **cortó todo lo que pasaba de ese límite**. Por eso solo vienen 6 de las 25 turbinas, y MV06 termina en septiembre.
- De las líneas con datos, {{=por_estado['completa']|,}} están completas y **{{=por_estado['reparada']|,}} se reparan** devolviendo la coma antes de los negativos. Otras {{=por_estado['parcial']}} son **parciales**: tienen otra coma perdida, pero la ancla confirma que las primeras 131 columnas, donde están el viento y la potencia, están en su lugar.
- Las **{{=por_estado['truncada']|,}} truncadas** se cortaron en la columna 34: conservan las temperaturas, pero no el viento ni la potencia. Las **{{=por_estado['ilegible']|,}} ilegibles** perdieron una coma sin ninguna pista de dónde: no se puede saber qué valor es cuál, así que solo se conserva su marca de tiempo.
- **MV01 pierde poco**: solo el {{=float(filas_t[0][-1][:-1])|.1f}}% de sus registros no trae viento ni potencia. MV02 pierde todavía menos ({{=float(filas_t[1][-1][:-1])|.1f}}%), y MV04 y MV05 pierden más del 10%.
@@ Decisión
✅ La reparación recupera casi todo. Se trabaja con **MV01**, la primera turbina y una de las más completas; MV02, la más completa, será la **turbina vecina** para rellenar huecos ([[imp-experimento]]). El siguiente paso carga el archivo de MV01 que generó `preparar_datos.py` con esta misma función.
:::

:::pastilla verde | Aplicar · Cargar la turbina MV01 | u1:pandas u1:serie {#carga-mv01}
Tener en memoria los registros de 10 minutos de MV01 con las variables que usará el análisis, y saber de qué tipo de línea viene cada uno.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `scada_mv01_2019_10min.csv.gz` | 2.5 MB | 28 de las 166 variables: viento, potencia, temperaturas, presión, dirección, estado y códigos de falla. |
| `fila` | columna nueva | El estado de la línea original (`completa`, `reparada`, …), para poder rastrear de dónde salió cada dato. |
@@ Código
```python
scada = pd.read_csv(RUTA_DATOS / "scada_mv01_2019_10min.csv.gz")
print(f"{len(scada):,} registros de 10 minutos y {scada.shape[1]} columnas\n")
print(scada["fila"].value_counts().to_string())
print()
print(scada[["ts_utc", "ts_local", "WindSpdMean", "RealPowerMean", "AmbTempMean", "TurbineState"]].head(4).to_string())
```
@@ Lectura
- Son **{{=len(scada)|,}} registros**; un año completo serían 52,560. Faltan {{=52560 - len(scada)}} que se buscarán en la validación temporal.
- `WindSpdMean` es la velocidad media del viento en 10 minutos, en m/s, medida por el anemómetro de la góndola. `RealPowerMean` es la potencia activa media, en kW: la turbina entrega como máximo 2,300 kW.
- `ts_utc` y `ts_local` difieren en 6 horas en enero: el reloj local está en el horario del centro (UTC−6).
@@ Decisión
Antes de mirar los valores hay que definir **qué** se va a pronosticar, **cada cuánto** y **con qué anticipación**. El siguiente paso compara las candidatas a variable objetivo.
:::

:::pastilla verde | Aplicar · Definir la variable objetivo, la frecuencia y el horizonte | u1:serie u2:particion {#definir-problema}
Elegir la serie, su frecuencia y su horizonte de pronóstico con datos, no por costumbre. Las candidatas naturales son la **potencia** (lo que se vende) y la **velocidad del viento** (lo que la produce).
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| potencia en 0 | < 20 kW | La turbina está parada: por falta de viento o por un paro. |
| potencia al máximo | > 2,250 kW | La turbina está en su potencia nominal: más viento ya no cambia nada. |
| frecuencia horaria | `resample("h")` | Promediar seis registros reduce el ruido de la turbulencia y es la unidad del mercado eléctrico (energía por hora). |
@@ Código
```python
viento10, potencia10 = scada["WindSpdMean"], scada["RealPowerMean"]
print(f"Potencia media: {potencia10.mean():,.0f} kW → factor de planta {potencia10.mean() / 2300:.1%}")
print(f"Registros con la turbina parada (< 20 kW):       {(potencia10 < 20).mean():.1%}")
print(f"Registros en potencia nominal (> 2,250 kW):     {(potencia10 > 2250).mean():.1%}")
parada_con_viento = (potencia10 < 20) & viento10.between(4, 25)
print(f"Parada aunque el viento era útil (4 a 25 m/s):  {parada_con_viento.mean():.1%}")
print(f"\nViento: media {viento10.mean():.2f} m/s, mínimo {viento10.min():.2f}, máximo {viento10.max():.2f}")
horas = pd.date_range("2019-01-01", "2019-12-31 23:00", freq="h")
print(f"\nCon frecuencia horaria la serie tendrá {len(horas):,} observaciones;"
      f" el 20% final para prueba son {int(0.2 * len(horas)):,} horas ({0.2 * len(horas) / 24:.0f} días).")
```
@@ Lectura
- La potencia tiene dos topes: **{{=(potencia10 < 20).mean() * 100|.0f}}%** de los registros está en cero y **{{=(potencia10 > 2250).mean() * 100|.0f}}%** en el máximo. Es una variable **censurada**: entre esos topes depende del viento de forma no lineal (la curva de potencia).
- Además, en **{{=parada_con_viento.mean() * 100|.1f}}%** de los registros la turbina estaba **parada con buen viento**: fallas, mantenimiento o paros por tormenta. Esos ceros no tienen nada que ver con el clima y ningún modelo de series de tiempo podría anticiparlos.
- El viento, en cambio, es una variable continua de 0 a {{=viento10.max()|.0f}} m/s que no depende de que la turbina funcione.
@@ Decisión
✅ **Definición del problema:**

- **Variable objetivo:** velocidad media horaria del viento en la góndola de MV01 (m/s).
- **Frecuencia:** horaria, {{=len(horas)|,}} observaciones (muy por encima de las 100 mínimas).
- **Horizonte:** las **24 horas** del día siguiente, pronosticadas cada día a la medianoche (el formato del mercado del día en adelanto).
- **Relevancia:** el pronóstico del viento es la entrada del pronóstico de energía. Al final del flujo se convierte en energía con la curva de potencia ([[energia]]).

Con el problema definido, la Fase 2 prepara la serie. Lo primero es comprobar que las fechas estén **ordenadas y sin duplicados**.
:::
