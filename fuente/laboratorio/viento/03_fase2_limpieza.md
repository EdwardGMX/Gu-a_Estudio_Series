## 🧹 Fase 2a · Validación temporal, limpieza e imputación {#fase-limpieza}
@mapa Ordenar las fechas, resolver el horario de verano, completar la rejilla de 10 minutos, quitar valores imposibles, separar los paros, pasar a horas y rellenar los huecos con el método que menos se equivoca.

:::pastilla amarillo | Aplicar · Orden, duplicados y el horario de verano | u1:serie u1:pandas {#vt-orden}
Comprobar las dos condiciones mínimas de cualquier serie de tiempo: que el índice esté **ordenado** y que **no tenga duplicados**. La suposición S2 es que la hora local del archivo sirve como índice.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `is_monotonic_increasing` | — | `True` si cada fecha es posterior a la anterior. |
| `duplicated()` | en UTC y en hora local | Una misma fecha dos veces rompe `resample`, `asfreq` y cualquier modelo. |
| desfase UTC − local | 5 o 6 horas | Si cambia durante el año, el reloj local tiene horario de verano. |
@@ Código
```python
scada["ts_utc"] = pd.to_datetime(scada["ts_utc"])
scada["ts_local"] = pd.to_datetime(scada["ts_local"])
print("¿Ordenado por la hora UTC?", scada["ts_utc"].is_monotonic_increasing)
print("¿Ordenado por la hora local?", scada["ts_local"].is_monotonic_increasing)
print("Duplicados en UTC:", scada["ts_utc"].duplicated().sum(), "| en hora local:", scada["ts_local"].duplicated().sum())

desfase = (scada["ts_utc"] - scada["ts_local"]).dt.total_seconds() / 3600
print("\nDesfase UTC − local (horas: registros):")
print(desfase.value_counts().to_string())
cambios = scada.loc[desfase.diff().fillna(0) != 0, ["ts_utc", "ts_local"]].head(2)
print("\nDónde cambia el desfase:")
print(cambios.to_string())
print("\nEl duplicado en hora local:")
print(scada.loc[scada["ts_local"].duplicated(keep=False), ["ts_utc", "ts_local", "WindSpdMean"]].to_string())
```
@@ Lectura
- El archivo **no está ordenado por UTC, pero sí por hora local**. El desorden está en un solo lugar: la madrugada del **3 de noviembre**.
- El desfase es de 6 horas en invierno y de 5 en verano: el reloj local cambia el **10 de marzo** y el **3 de noviembre**, las fechas del horario de verano de Estados Unidos en 2019.
- El 3 de noviembre a las 2:00 el reloj local regresó a la 1:00, así que **la hora de 1:00 a 1:59 ocurrió dos veces**. El equipo guardó la primera vuelta y casi toda la segunda se perdió: queda un **duplicado** en hora local (01:00) con dos vientos distintos, de dos momentos reales separados por una hora.
- En marzo pasa lo contrario: la hora de 2:00 a 2:59 local **no existe**. En hora local la serie tendría un hueco que no es un dato faltante.
@@ Decisión
🟡 **S2 solo funciona con reservas**: la hora local tiene huecos y repeticiones artificiales dos veces al año. Se usará la hora UTC convertida a **hora estándar del centro fija (UTC−6)**, sin horario de verano: no tiene duplicados, avanza siempre 10 minutos y el ciclo diario queda alineado con el sol todo el año. El siguiente paso construye ese índice y busca los registros que faltan.
:::

:::pastilla azul | Aplicar · Índice en hora estándar y la rejilla completa de 10 minutos | u1:serie u1:pandas {#vt-rejilla}
Construir el índice definitivo, ordenarlo y **reindexar contra la rejilla completa** de 10 minutos: así cada registro faltante aparece como un hueco explícito (`NaN`) en lugar de esconderse.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `ts_utc − 6 h` | hora estándar | Sin horario de verano: un día siempre tiene 144 registros. |
| `pd.date_range(…, freq="10min")` | 52,560 marcas | La rejilla ideal de 2019. |
| racha | huecos consecutivos | Para imputar no es lo mismo un hueco de 10 minutos que uno de un día y medio. |
@@ Código
```python
scada = scada.sort_values("ts_utc")
scada["ts"] = scada["ts_utc"] - pd.Timedelta(hours=6)            # hora estándar del centro, sin cambio de horario
s10 = scada.set_index("ts").drop(columns=["ts_utc", "ts_local"])
rejilla = pd.date_range("2019-01-01 00:00", "2019-12-31 23:50", freq="10min")
sin_registro = rejilla.difference(s10.index)
s10 = s10.reindex(rejilla)
print("¿Ordenado?", s10.index.is_monotonic_increasing, "| ¿duplicados?", s10.index.duplicated().any())
print(f"Registros esperados: {len(rejilla):,} | sin registro: {len(sin_registro)}")
print("  ", [str(t) for t in sin_registro])

sin_viento = s10["WindSpdMean"].isna()
print(f"\nSin dato de viento: {sin_viento.sum():,} registros ({sin_viento.mean():.1%})")
print(s10.loc[sin_viento, "fila"].fillna("sin registro").value_counts().to_string())

grupo = sin_viento.ne(sin_viento.shift()).cumsum()
rachas = sin_viento.groupby(grupo).agg(inicio=lambda g: g.index[0], largo="size", hueco="first").query("hueco")
print(f"\n{len(rachas)} rachas de huecos: {(rachas['largo'] == 1).sum()} de un solo registro,"
      f" {(rachas['largo'] <= 6).sum()} de una hora o menos; la más larga dura {rachas['largo'].max() / 6:.1f} h")
print(rachas.query("largo > 18").assign(horas=lambda r: (r["largo"] / 6).round(1))[["inicio", "horas"]].to_string(index=False))
```
@@ Resultado
```python oculto
faltan_dia = sin_viento.resample("D").sum()
grafica("vt-huecos", [barras(faltan_dia.index, faltan_dia, "registros sin viento", "dur", hovertemplate="%{x|%d %b}: %{y} registros<extra></extra>")],
        alto=260, title={"text": "Registros de 10 minutos sin viento, por día (máximo 144)"}, showlegend=False,
        yaxis={"title": {"text": "registros"}})
```
@widget lab-graf id=vt-huecos
@@ Lectura
- Ahora el índice está ordenado y sin duplicados. Los **{{=len(sin_registro)}} registros que no existen** son la segunda vuelta de la 1:00 del 3 de noviembre, la que el equipo perdió.
- Faltan **{{=sin_viento.sum()|,}}** valores de viento ({{=sin_viento.mean() * 100|.1f}}%): sobre todo las líneas ilegibles y truncadas que encontró la [[crudo-reparar|reparación]].
- Casi todos los huecos son **cortos**: {{=(rachas['largo'] == 1).sum()}} de las {{=len(rachas)}} rachas son de un solo registro. Pero hay unos cuantos largos (barras altas): el 6 de marzo y, sobre todo, el **20 de julio**, con {{=rachas['largo'].max() / 6|.0f}} horas seguidas sin dato.
@@ Decisión
Los huecos se rellenarán después de pasar a horas, cuando ya se sepa qué método funciona. Antes hay que revisar que los valores **que sí están** sean creíbles: el siguiente paso busca valores imposibles.
:::

:::pastilla verde | Aplicar · Códigos de error y rangos físicos | u1:estadisticos {#limpia-centinelas}
Encontrar valores que **no son mediciones** sino códigos que el equipo escribe cuando un sensor falla, y fijar un rango físico creíble para cada variable.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| −2184.6 y 3268.2 | códigos | Aparecen exactamente igual en varias columnas a la vez: son marcas de error del equipo, no temperaturas ni presiones. |
| `RANGOS` | uno por variable | Una temperatura ambiente de −2184 °C o una presión de 3268 hPa son físicamente imposibles. |
| densidad del aire | 0.9 a 1.4 kg/m³ | Al nivel del mar ronda 1.2; un 0 significa que no se calculó. |
@@ Código
```python
numericas = s10.select_dtypes("number")
print("Valores −2184.6 o 3268.2 por columna:")
print(numericas.isin([-2184.6, 3268.2]).sum()[lambda c: c > 0].to_string())

RANGOS = {"AmbTempMean": (-10, 50), "NacTempMean": (-10, 70), "GBOilTempMean": (-10, 90), "GenTemp1Mean": (-10, 150),
          "BrgTemp1Mean": (-10, 120), "BaroPressMean": (900, 1100), "AirDensityMean": (0.9, 1.4),
          "WindSpdMean": (0, 40), "RealPowerMean": (-50, 2400)}
fuera = {}
for col, (lo, hi) in RANGOS.items():
    malos = s10[col].notna() & ~s10[col].between(lo, hi)
    fuera[col] = malos.sum()
    s10.loc[malos, col] = np.nan                      # un valor imposible es un dato faltante
print("\nValores fuera de rango que pasan a NaN:")
print(pd.Series(fuera).to_string())
```
@@ Lectura
- Los códigos aparecen en **{{=fuera['AmbTempMean']}} registros**, en seis columnas a la vez: cuando el equipo pierde la lectura de sus sensores escribe el mismo código en todas. Si se dejaran, un promedio horario de temperatura podría dar −300 °C.
- La densidad del aire tiene {{=fuera['AirDensityMean']}} valores fuera de rango, casi todos ceros. Coinciden con otra falla que se revisa en el siguiente paso.
- El viento y la potencia no tienen valores fuera de rango.
@@ Decisión
✅ Los valores imposibles pasan a `NaN`. Que el viento esté dentro de su rango no garantiza que sea real: un anemómetro apagado marca exactamente 0, que es un valor posible. El siguiente paso busca ceros sospechosos.
:::

:::pastilla verde | Aplicar · El anemómetro apagado: ceros que no son calma | u1:estadisticos {#limpia-apagado}
Distinguir la **calma real** (viento bajo que varía) de un **sensor apagado** (todo en cero exacto, sin variación).
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `WindSpdMean == 0` y `WindSpdSdev == 0` | cero exacto y sin variación | Un viento real nunca tiene desviación cero en 10 minutos: el aire siempre fluctúa. |
| valores pegados | 3 registros idénticos seguidos | Un sensor congelado repite el último valor. |
@@ Código
```python
cero = s10["WindSpdMean"] == 0
print(f"Registros con viento exactamente 0: {cero.sum()}")
print("En esos registros:")
print(s10.loc[cero, ["WindSpdSdev", "WindSpdMax", "RealPowerMean", "TurbineState"]].describe().loc[["mean", "min", "max"]].round(2).to_string())

apagado = cero & (s10["WindSpdSdev"] == 0)
s10.loc[apagado, ["WindSpdMean", "WindSpdSdev", "WindSpdMin", "WindSpdMax"]] = np.nan

v10 = s10["WindSpdMean"]
pegado = v10.diff().eq(0) & v10.diff(-1).eq(0)
print(f"\nRegistros pegados (igual al anterior y al siguiente) después de quitar los apagados: {pegado.sum()}")
print(f"Viento más bajo que queda: {v10.min():.2f} m/s")
```
@@ Lectura
- Los {{=cero.sum()}} registros con viento 0 tienen **todo en cero**: desviación, máximo, potencia y estado de la turbina (y también la densidad del aire, que en el paso anterior ya pasó a `NaN`). No es calma: el controlador estaba **apagado** y el SCADA registró ceros. Por eso la densidad del aire valía 0 en el paso anterior.
- Si se dejaran, el promedio horario mezclaría un viento real de 6 m/s con ceros falsos.
- Después de quitarlos casi no hay valores pegados ({{=pegado.sum()}}): el anemómetro no se congeló en ningún otro momento.
@@ Decisión
✅ Los ceros del sensor apagado pasan a `NaN`. Falta un último tipo de dato engañoso, que no afecta al viento pero sí a la potencia: los **paros** de la turbina.
:::

:::pastilla azul | Aplicar · Paros y limitaciones: la turbina detenida con buen viento | u1:estadisticos u1:rupturas {#limpia-paros}
Medir cuánto tiempo la turbina **no produjo aunque había viento**, y por qué. No cambia la variable objetivo (el viento), pero sí la conversión a energía y las relaciones entre viento y potencia que se estudian después.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| viento útil | 4 a 25 m/s | Por debajo de 4 m/s la turbina no arranca; por arriba de 25 se detiene por seguridad. |
| potencia de paro | < 20 kW | Con viento útil, una potencia casi nula solo se explica por un paro. |
| `RealPowerLimitMean < 2290` | limitación | El operador le pidió entregar menos de su máximo (curtailment). |
@@ Código
```python
v10, p10 = s10["WindSpdMean"], s10["RealPowerMean"]
paro = v10.between(4, 25) & (p10 < 20)
limitada = s10["RealPowerLimitMean"] < 2290
print(f"Paro con viento útil: {paro.sum():,} registros = {paro.sum() / 6:,.0f} horas ({paro.mean():.1%} del año)")
print("Estado de la turbina en los paros:", s10.loc[paro, "TurbineState"].value_counts().head(4).astype(int).to_dict())
print("Estado cuando produce más de 100 kW:", s10.loc[p10 > 100, "TurbineState"].value_counts().head(2).astype(int).to_dict())
print("Códigos de falla más comunes en los paros:", s10.loc[paro, "FaultCode"].value_counts().head(4).astype(int).to_dict())
print(f"Registros con limitación de potencia: {limitada.sum()}")
s10["paro"] = paro
paro_mes = paro.groupby(paro.index.month).mean() * 100
print("\nPorcentaje del tiempo en paro por mes:")
print(paro_mes.round(1).to_string())
```
@@ Resultado
```python oculto
MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"]
grafica("vt-paros", [barras(MESES, paro_mes.values, "% del tiempo en paro", ["dur" if m in (11, 12) else "lav" for m in paro_mes.index],
                            hovertemplate="%{x}: %{y:.1f}%<extra></extra>")],
        alto=270, title={"text": "Tiempo con la turbina parada aunque había viento útil"}, showlegend=False,
        yaxis={"title": {"text": "% del mes"}})
```
@widget lab-graf id=vt-paros
@@ Lectura
- MV01 pasó **{{=paro.sum() / 6|,.0f}} horas** ({{=paro.mean() * 100|.1f}}% del año) parada con viento útil. En operación normal su estado es el 8; en los paros aparecen los estados 3, 13 y 15 con códigos de falla.
- Los paros se concentran en **noviembre y diciembre** (barras en durazno): más del 20% del tiempo. Justo es el periodo que quedará en el conjunto de **prueba**.
- La limitación de potencia ordenada por el operador es rara ({{=limitada.sum()}} registros).
@@ Decisión
Se agrega la columna `paro` para usarla en el análisis de la curva de potencia ([[eda-curva]]) y en la coherencia entre viento y potencia ([[esp-potencia]]). Si el objetivo fuera la potencia, estos paros serían **cambios estructurales** imposibles de pronosticar con la serie sola. Es otra razón para pronosticar el viento. Con los datos limpios, el siguiente paso pasa de registros de 10 minutos a **horas**.
:::

:::pastilla verde | Aplicar · Agregar a horas sin inventar promedios | u1:moviles u1:serie {#limpia-horaria}
Construir la serie horaria como el promedio de los seis registros de cada hora, pero **solo cuando hay suficientes**: el promedio de un único registro no representa una hora.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `resample("h").mean()` | promedio | La velocidad media horaria. Los `NaN` se ignoran al promediar. |
| mínimo | 4 de 6 registros | Con 40 minutos de datos el promedio es confiable; con menos, la hora se marca como faltante y se imputa. |
@@ Código
```python
validos = s10["WindSpdMean"].resample("h").count()
viento_h = s10["WindSpdMean"].resample("h").mean().where(validos >= 4).rename("viento")
print(f"Horas: {len(viento_h):,} | con los 6 registros: {(validos == 6).sum():,} | con 4 o 5: {validos.between(4, 5).sum()}"
      f" | sin dato (menos de 4): {viento_h.isna().sum()}")

hueco_h = viento_h.isna()
rachas_h = hueco_h.groupby(hueco_h.ne(hueco_h.shift()).cumsum()).agg(["first", "size"]).query("first")["size"]
print("\nRachas de horas faltantes (largo en horas: cuántas):")
print(rachas_h.value_counts().sort_index().to_string())
```
@@ Resultado
```python oculto
cuenta_val = validos.value_counts().sort_index()
grafica("vt-validos", [barras([str(k) for k in cuenta_val.index], cuenta_val.values, "horas", ["rojo" if k < 4 else ("mant" if k < 6 else "menta") for k in cuenta_val.index],
                              hovertemplate="%{x} registros válidos: %{y:,} horas<extra></extra>")],
        alto=250, title={"text": "Registros válidos en cada hora"}, showlegend=False, xaxis={"title": {"text": "registros de 10 minutos con viento"}},
        yaxis={"type": "log", "title": {"text": "horas (escala log)"}})
```
@widget lab-graf id=vt-validos
@@ Lectura
- {{=(validos == 6).sum()|,}} de las {{=len(viento_h)|,}} horas tienen los seis registros. Las que tienen 4 o 5 conservan su promedio.
- Quedan **{{=viento_h.isna().sum()}} horas sin dato** ({{=viento_h.isna().mean() * 100|.1f}}%). La mayoría son huecos de una sola hora ({{=(rachas_h == 1).sum()}} rachas), pero hay {{=(rachas_h > 12).sum()}} de más de 12 horas.
@@ Decisión
Hay que rellenar esos huecos: SARIMA, la descomposición y el espectro necesitan una serie sin `NaN`. El flujo de trabajo pide interpolación lineal o media móvil, justificando la elección. En lugar de suponer cuál funciona (suposición S3), el siguiente paso lo **mide**.
:::

:::pastilla verde | Aplicar · Experimento: ¿qué método de imputación se equivoca menos? | u1:moviles {#imp-experimento}
Comparar métodos de imputación **ocultando datos que sí conocemos** y midiendo el error al reconstruirlos. Así la elección se justifica con evidencia y no con costumbre.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| huecos simulados | 1, 3, 6, 12 y 24 h | Los largos que aparecen en los datos reales. |
| repeticiones | 40 por largo | En lugares al azar donde el dato real existe (semilla fija). |
| lineal | `interpolate(method="time")` | Une con una recta el último dato antes del hueco y el primero después. |
| media móvil | ventana centrada de 12 h | Rellena con el promedio de las horas vecinas disponibles. |
| perfil horario | promedio de esa hora del día | Usa solo el ciclo diario. |
| turbina vecina | regresión con MV02 | MV02 está a unos cientos de metros y su viento se mide al mismo tiempo. |
@@ Código
```python
parque = pd.read_csv(RUTA_DATOS / "scada_parque_2019_10min.csv.gz", parse_dates=["ts_utc"])
parque["ts"] = parque["ts_utc"] - pd.Timedelta(hours=6)
viento_parque = (parque.pivot_table(index="ts", columns="device", values="WindSpdMean")
                 .reindex(rejilla).where(lambda x: x > 0)          # mismo criterio: los ceros exactos son sensor apagado
                 .resample("h").mean())
vecina = viento_parque["MV02"]
print(f"Correlación horaria MV01–MV02: {viento_h.corr(vecina):.3f}")

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
print("\nError absoluto medio de la reconstrucción (m/s):")
print(exp_imp.round(2).to_string())
```
@@ Resultado
```python oculto
COL_IMP = {"lineal": "lav", "media móvil (12 h)": "cel", "perfil horario": "gris", "turbina vecina (MV02)": "menta"}
grafica("imp-exp", [linea(exp_imp.index, exp_imp[m], m, COL_IMP[m], 2.6, mode="lines+markers") for m in metodos],
        alto=300, title={"text": "Error al reconstruir huecos de distinto largo"},
        xaxis={"title": {"text": "largo del hueco (horas)"}, "type": "log", "tickvals": [1, 3, 6, 12, 24]}, yaxis={"title": {"text": "MAE (m/s)"}})
```
@widget lab-graf id=imp-exp
@@ Lectura
- **La turbina vecina gana en todos los largos** y su error casi no crece: unos {{=exp_imp['turbina vecina (MV02)'].mean()|.2f}} m/s, porque mide el mismo viento al mismo tiempo (correlación {{=viento_h.corr(vecina)|.3f}}).
- La **interpolación lineal** es buena en huecos cortos ({{=exp_imp.loc[1, 'lineal']|.2f}} m/s en una hora) pero su error crece con el largo: en 24 horas llega a {{=exp_imp.loc[24, 'lineal']|.2f}} m/s, porque una recta no puede reproducir las subidas y bajadas del viento durante un día.
- La **media móvil** es peor que la lineal en huecos cortos: promedia horas lejanas y aplana el valor.
- El **perfil horario** es el peor (≈ {{=exp_imp['perfil horario'].mean()|.1f}} m/s): el ciclo diario explica muy poco del viento. Es la primera pista contra la suposición S4.
@@ Decisión
✅ Se imputa con la **turbina vecina** y, donde MV02 tampoco tiene dato, con **interpolación lineal**. 🟡 **S3 solo vale a medias**: la interpolación lineal sirve para huecos cortos, pero no es la mejor opción cuando hay una medición vecina. El siguiente paso aplica la imputación y deja una bandera para saber qué horas son reconstruidas.
:::

:::pastilla verde | Aplicar · Imputar y marcar las horas reconstruidas | u1:serie {#imp-final}
Rellenar los huecos con el método elegido y guardar una **bandera** de imputación: los datos inventados deben poder identificarse siempre.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `a + b · MV02` | regresión con todo el año | La relación entre las dos turbinas es estable. |
| `interpolate(method="time")` | segunda opción | Para las horas en que MV02 tampoco tiene dato. |
| `imputada` | bandera booleana | Permite revisar después si los errores se concentran en las horas imputadas. |
@@ Código
```python
ok = viento_h.notna() & vecina.notna()
b_vec, a_vec = np.polyfit(vecina[ok], viento_h[ok], 1)
imputada = viento_h.isna()
por_vecina = imputada & vecina.notna()
y = viento_h.fillna(a_vec + b_vec * vecina).interpolate(method="time", limit_direction="both").rename("viento")
print(f"Regresión: viento MV01 = {a_vec:.3f} + {b_vec:.4f} · viento MV02")
print(f"Horas imputadas: {imputada.sum()} ({imputada.mean():.1%}) | con la vecina: {por_vecina.sum()} | con interpolación: {(imputada & ~por_vecina).sum()}")
print(f"¿Quedan NaN? {y.isna().sum()} | ¿índice con frecuencia fija? {pd.infer_freq(y.index)}")
print(f"\nSerie final: {len(y):,} horas, de {y.index[0]} a {y.index[-1]}")
```
@@ Resultado
```python oculto
ventana = slice("2019-07-19 00:00", "2019-07-23 23:00")
grafica("imp-final", [linea(viento_h[ventana].index, viento_h[ventana], "MV01 (medido)", "osc", 2),
                      linea(vecina[ventana].index, vecina[ventana], "MV02 (vecina)", "gris", 1.2, "dot"),
                      linea(y[ventana].index, y[ventana].where(imputada[ventana]), "MV01 imputado", "dur", 2.6)],
        alto=300, title={"text": "El hueco más largo (20–22 de julio) relleno con la turbina vecina"}, yaxis={"title": {"text": "m/s"}})
```
@widget lab-graf id=imp-final
@@ Lectura
- La relación entre turbinas es casi 1 a 1 (pendiente {{=b_vec|.3f}}): MV01 y MV02 ven prácticamente el mismo viento.
- Se imputaron **{{=imputada.sum()}} horas** ({{=imputada.mean() * 100|.1f}}%), {{=por_vecina.sum()}} con la vecina. En la gráfica, el hueco de {{=rachas['largo'].max() / 6|.0f}} horas de julio se rellena siguiendo las subidas y bajadas reales de MV02; una recta habría cruzado ese día y medio sin ninguna de ellas.
- La serie final tiene **{{=len(y)|,}} horas** sin `NaN`, con frecuencia fija `h`.
@@ Decisión
✅ La serie está lista. La Fase 2b la **explora**: cómo se ve a lo largo del año, cómo se distribuye, qué ciclos tiene y cómo se relaciona con la potencia y con las otras turbinas.
:::
