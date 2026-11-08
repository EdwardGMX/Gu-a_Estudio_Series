## 📈 ¿Qué es una serie de tiempo? {#serie}
@mapa Proceso estocástico, realización, los 5 elementos mínimos y por qué no se vale barajar los datos.

### Proceso estocástico y realización {#proceso}

:::definicion Serie de tiempo
Una **serie de tiempo** es una **trayectoria observada** de un **proceso estocástico** indexado en el tiempo:

$$\{\tip{yt}{y_t}\}_{\tip{t}{t}=1}^{\tip{n}{n}} = \{y_1, y_2, \dots, y_n\}$$

- **Proceso estocástico**: una *colección de variables aleatorias* $Y_1, Y_2, Y_3, \dots$, una por cada instante. Es la «máquina» que genera los datos.
- **Realización** (o trayectoria): los números concretos que salieron **una vez**. Es lo único que observamos.
:::

:::intuicion La máquina y el boleto
Imagina una máquina que, cada mes, saca un número al azar, pero **recordando** lo que sacó antes. El proceso es la máquina con todas sus reglas; la serie que tienes en tu Excel es **un boleto** impreso por esa máquina. Si pudieras «reiniciar la historia», la máquina imprimiría otro boleto distinto con las mismas reglas. Por eso hablamos de *media del proceso* $\mu$ (promedio sobre todos los boletos posibles) y de *media muestral* $\bar y$ (promedio de tu único boleto).
:::

:::interactivo realizaciones | Muchas historias posibles, una sola observada
Cada línea tenue es una realización distinta del **mismo** proceso; la línea fuerte es «la que observamos». Cambia de proceso y genera otra historia. Activa la media del conjunto para ver el promedio de 200 historias en cada instante $t$ (eso es lo que mide $\E[y_t]$).
@@@
- **Eje horizontal**: el tiempo $t$ (1 a 100). **Eje vertical**: el valor $y_t$.
- **Líneas lilas tenues**: otras 7 historias del **mismo** proceso (mismas reglas, choques distintos).
- **Línea rosa**: la historia «observada», la única que tendrías en la práctica.
- Con **«Mostrar media del conjunto»**: la línea menta es el promedio de 200 historias en cada $t$ (una estimación de $\E[y_t]$) y la franja menta es ±2 desviaciones entre historias (refleja $\Var(y_t)$).
- **Qué buscar**: si la línea menta es horizontal y la franja tiene **ancho constante**, el proceso es estacionario. En el paseo aleatorio la franja se abre con $t$.
:::

:::duda Si solo tengo una realización, ¿cómo puedo estimar μ?
Promediando **en el tiempo** en lugar de entre realizaciones. Eso funciona cuando el proceso es estacionario y su memoria se desvanece (se dice que es **ergódico**): una sola historia larga recorre todos los valores típicos del proceso y $\bar y$ se acerca a $\mu$. Si el proceso no es estacionario (por ejemplo, un paseo aleatorio), el promedio temporal no converge a nada fijo.
:::

### Los 5 elementos mínimos {#elementos}

No basta con que los datos tengan una fecha. Para que una tabla sea una serie de tiempo útil necesitas:

| # | Elemento | Pregunta que responde | Ejemplo |
|---|---|---|---|
| 1 | **Índice temporal ordenado** | ¿en qué orden ocurrieron? | ene-2024, feb-2024, mar-2024… |
| 2 | **Frecuencia** o unidad de muestreo | ¿cada cuánto se mide? | mensual, diaria, por hora |
| 3 | **Variable objetivo cuantitativa** | ¿qué número medimos? | pasajeros, ventas, °C |
| 4 | **Observaciones comparables** e intervalos regulares | ¿se midió siempre igual? | misma definición y unidad todo el periodo |
| 5 | **Contexto del fenómeno** | ¿qué explica lo que veo? | vacaciones, crisis, cambios de política |

:::cuidado «Tener fecha» no basta {#fecha}
Una lista de clientes con su fecha de registro **no** es una serie de tiempo: cada fila es una persona distinta y no hay dependencia entre «el cliente de ayer» y «el de hoy». Si la agregas («número de registros por día»), **ahora sí** obtienes una serie: un valor por periodo, medido de forma comparable.
:::

### Diferencia contra datos i.i.d.: no se vale barajar {#iid}

En estadística clásica muchas técnicas suponen datos **i.i.d.** (independientes e idénticamente distribuidos): el orden no importa. En series de tiempo **el pasado influye en el presente**, así que el orden **es información**.

:::definicion Dependencia temporal
Hay dependencia temporal cuando $\Cov(y_t, y_{t-k}) \ne 0$ para algún rezago $k \ge 1$: conocer el pasado ayuda a anticipar el presente. Esta covarianza se llama **autocovarianza** y la estudiamos en [[autocov]].
:::

:::interactivo barajar | ¿Qué pasa si barajamos los datos?
Barajar conserva **los mismos números** (misma media, misma varianza), pero destruye el orden. Observa cómo la autocorrelación del rezago 1 se desploma hacia 0: la estructura temporal desaparece.
@@@
- **Izquierda**: la serie en su orden (lila) o barajada (durazno). **Derecha**: su ACF hasta el rezago 24.
- En la ACF, la **franja lila** es la banda $\pm 1.96/\sqrt n$; las barras **naranjas** salen de la banda (significativas) y las **lilas** quedan dentro.
- **Qué buscar**: la lectura de abajo muestra que media y varianza no cambian al barajar, pero la ACF pasa de barras grandes a barras dentro de la banda: el **orden** era la información.
:::

:::cuidado Consecuencia práctica
Como el orden importa, **nunca** se hace una partición aleatoria entre entrenamiento y prueba: siempre se entrena con el pasado y se evalúa con el futuro. Lo verás a detalle en la Unidad II.
:::

### Construir correctamente la serie en pandas {#pandas}

Los datos suelen llegar como texto. Los pasos son siempre los mismos: (1) convertir la fecha a tipo fecha, (2) usarla como índice, (3) ordenar, (4) declarar la frecuencia. Usaremos la serie clásica **AirPassengers** (pasajeros mensuales de aerolíneas, 1949–1960).

```python
import numpy as np
import pandas as pd

pasajeros = [
    112, 118, 132, 129, 121, 135, 148, 148, 136, 119, 104, 118,   # 1949
    115, 126, 141, 135, 125, 149, 170, 170, 158, 133, 114, 140,   # 1950
    145, 150, 178, 163, 172, 178, 199, 199, 184, 162, 146, 166,   # 1951
    171, 180, 193, 181, 183, 218, 230, 242, 209, 191, 172, 194,   # 1952
    196, 196, 236, 235, 229, 243, 264, 272, 237, 211, 180, 201,   # 1953
    204, 188, 235, 227, 234, 264, 302, 293, 259, 229, 203, 229,   # 1954
    242, 233, 267, 269, 270, 315, 364, 347, 312, 274, 237, 278,   # 1955
    284, 277, 317, 313, 318, 374, 413, 405, 355, 306, 271, 306,   # 1956
    315, 301, 356, 348, 355, 422, 465, 467, 404, 347, 305, 336,   # 1957
    340, 318, 362, 348, 363, 435, 491, 505, 404, 359, 310, 337,   # 1958
    360, 342, 406, 396, 420, 472, 548, 559, 463, 407, 362, 405,   # 1959
    417, 391, 419, 461, 472, 535, 622, 606, 508, 461, 390, 432,   # 1960
]
meses = [f"{a}-{m:02d}" for a in range(1949, 1961) for m in range(1, 13)]
df = pd.DataFrame({"Month": meses, "Passengers": pasajeros})   # así llega de un CSV
print(df.dtypes)        # Month es texto: todavía NO es una fecha
```

```python
df["Month"] = pd.to_datetime(df["Month"], format="%Y-%m")   # 1) texto → fecha
serie = (df.set_index("Month")      # 2) la fecha es el índice
           .sort_index()            # 3) orden cronológico
           ["Passengers"]
           .asfreq("MS"))           # 4) frecuencia: inicio de cada mes
print(serie.head(4))
print("Frecuencia:", serie.index.freqstr, "| n =", len(serie), "| faltantes:", serie.isna().sum())
```

:::interactivo tabla-ap | El dataset completo: AirPassengers mes por mes {#tabla-airpassengers}
Estos son los 144 datos de `serie`, acomodados con un año por renglón y un mes por columna (es lo que produce `serie.to_frame().pivot_table(...)`). El color es más rosa cuanto más alto el valor.
@@@
- **Cada celda** es una observación $y_t$; al pasar el cursor se resaltan su renglón (año) y su columna (mes) y se marca en la gráfica de abajo.
- **Leer por renglón** (un año): ves el patrón estacional, con el pico en julio–agosto.
- **Leer por columna** (un mes): ves la tendencia, porque cada año ese mes es mayor.
- **«ln(pasajeros)»**: los valores crecen de forma más pareja.
- **«cambio vs. mismo mes del año anterior»**: es $100\,(y_t / y_{t-12} - 1)$, un crecimiento anual en %. El primer año queda vacío porque no tiene año anterior. Es casi lo mismo que $\Delta_{12}\ln y_t$ [[logaritmos]].
:::

`asfreq` es muy útil porque **revela los huecos**: si falta una fecha, aparece con `NaN` en lugar de esconderse.

```python
sucia = pd.DataFrame({"fecha": ["2024-01-03", "2024-01-01", "2024-01-02", "2024-01-02", "2024-01-06"],
                      "usuarios": [130, 120, 125, 125, 150]})
limpia = (sucia.assign(fecha=pd.to_datetime(sucia["fecha"]))
               .drop_duplicates()             # quita el 2 de enero repetido
               .set_index("fecha").sort_index()["usuarios"]
               .asfreq("D"))                  # aparecen el 4 y el 5 de enero como NaN
print(limpia)
print("Rellenando huecos por interpolación lineal:")
print(limpia.interpolate())
```

| Código | Frecuencia | Código | Frecuencia |
|---|---|---|---|
| `"D"` | diaria | `"MS"` | mensual (inicio de mes) |
| `"W"` | semanal | `"ME"` | mensual (fin de mes) |
| `"h"` | por hora | `"QS"` | trimestral (inicio) |
| `"B"` | días hábiles | `"YS"` | anual (inicio) |

:::resumen Lo esencial de la sección 1
- Una serie es **una realización** de un proceso estocástico: vemos un boleto, no la máquina.
- El orden contiene información (dependencia temporal): no se baraja.
- En pandas: `to_datetime` → `set_index` → `sort_index` → `asfreq`.
:::

## 👀 Visualización de series de tiempo {#visualizacion}
@mapa Gráfica de línea, gráfica estacional, boxplot por mes, lag plot y estadísticas móviles.

Antes de cualquier prueba, **grafica**. Una buena gráfica responde en segundos lo que una prueba tarda páginas en confirmar.

### La gráfica de línea {#linea}

Es la gráfica fundamental: $t$ en el eje horizontal y $y_t$ en el vertical. Al verla, recorre esta lista:

| Mira… | Pregunta | En AirPassengers |
|---|---|---|
| **Nivel** | ¿alrededor de qué valor se mueve? | empieza ~100 y termina ~450 |
| **Tendencia** | ¿sube o baja sostenidamente? | sí, crece |
| **Estacionalidad** | ¿hay un patrón que se repite con periodo fijo? | sí, cada 12 meses (pico en julio–agosto) |
| **Varianza** | ¿la amplitud de las oscilaciones cambia? | crece con el nivel ⇒ multiplicativa [[multiplicativo]] |
| **Atípicos y rupturas** | ¿saltos, picos aislados, cambios de régimen? | no evidentes |

```python
import matplotlib.pyplot as plt

fig, ax = plt.subplots(figsize=(10, 3.5))
ax.plot(serie.index, serie.values, color="#6a57cf")
ax.set_title("AirPassengers: pasajeros mensuales (miles)")
ax.set_xlabel("Fecha"); ax.set_ylabel("Pasajeros")
plt.show()
```

### Gráfica estacional y boxplot por mes {#estacional-graf}

Para ver la **estacionalidad** se dibuja **una línea por año** con los meses en el eje horizontal. Si las líneas tienen la misma forma, hay estacionalidad; si además se separan hacia arriba, también hay tendencia.

```python
tabla = serie.to_frame("y")
tabla["anio"], tabla["mes"] = tabla.index.year, tabla.index.month
pivote = tabla.pivot(index="mes", columns="anio", values="y")
print(pivote.iloc[:, [0, 5, 11]])        # tres años de ejemplo: 1949, 1954 y 1960
pivote.plot(figsize=(9, 4), legend=False, title="Una línea por año")
plt.show()
```

:::interactivo estacional | Gráfica estacional de AirPassengers
Alterna entre «una línea por año» y «boxplot por mes». Prueba también con logaritmos: verás que las líneas se vuelven casi paralelas, señal de que el patrón es **multiplicativo** [[log]].
@@@
- **Vista «una línea por año»**: eje x = mes; cada línea es un año, de lila (1949) a rosa (1960). Pasa el cursor para ver el valor exacto.
- **Vista «boxplot por mes»**: cada caja resume los 12 valores de ese mes. La línea central es la **mediana**, la caja va del primer al tercer **cuartil** (el 50% central), los bigotes llegan a los valores no atípicos y cada punto es un año.
- **Qué buscar**: forma común entre líneas ⇒ **estacionalidad**; líneas cada vez más arriba ⇒ **tendencia**; distancia pico–valle que crece ⇒ **multiplicativo**.
- En Python: `pivote.plot()` para las líneas y `sns.boxplot(x=mes, y=valor)` o `tabla.boxplot(column="y", by="mes")` para las cajas.
:::

### Gráfica de rezagos (lag plot) {#lagplot}

Un **lag plot** pone $y_{t-k}$ en el eje horizontal y $y_t$ en el vertical. Cada punto es una pareja de observaciones separadas $k$ periodos.

- Nube alineada hacia arriba ⇒ **autocorrelación positiva** (valores altos siguen a valores altos).
- Nube alineada hacia abajo ⇒ **autocorrelación negativa** (alternancia alto–bajo).
- Nube redonda ⇒ **sin autocorrelación** en ese rezago.

:::interactivo rezagos | Explorador de rezagos
Mueve $k$ y observa cómo cambia la nube y su correlación. La barra resaltada en el correlograma de la derecha es el mismo número: el correlograma no es más que **todas estas correlaciones juntas** [[correlograma]].
@@@
- **Izquierda**: cada punto es una pareja $(y_{t-k},\, y_t)$: en x el valor de hace $k$ periodos, en y el valor actual. El título muestra $\hat\rho(k)$.
- **Derecha**: el correlograma; la barra **rosa** es el $k$ elegido, las **naranjas** son significativas y la franja es la banda.
- Nube alineada hacia arriba ⇒ $\rho > 0$; hacia abajo ⇒ $\rho < 0$; redonda ⇒ $\rho \approx 0$.
- Prueba AirPassengers con $k = 12$: la nube vuelve a alinearse por la estacionalidad.
- En Python: `pd.plotting.lag_plot(serie, lag=k)`.
:::

:::duda ¿Por qué la correlación de la nube no coincide exactamente con ρ̂(k)?
La correlación de Pearson de la nube usa la media y la desviación de **cada** columna de parejas por separado y divide entre $n - k$. $\hat\rho(k)$ usa la media de **toda** la serie y divide entre $n$ [[autocov]]. Con muchos datos son casi iguales; con pocos datos y rezagos grandes, $\hat\rho(k)$ sale más cerca de 0.
:::

### Media móvil y desviación estándar móvil {#moviles}

Una forma visual de revisar si la media o la varianza cambian en el tiempo es calcularlas en una **ventana** que se desliza.

:::definicion Estadísticas móviles (ventana hacia atrás de tamaño m)
$$\tip{MA}{\mathrm{MM}_t} = \frac{1}{\tip{m}{m}}\sum_{j=0}^{m-1} y_{t-j}, \qquad \tip{Svar}{s_t} = \sqrt{\frac{1}{m-1}\sum_{j=0}^{m-1}\big(y_{t-j} - \mathrm{MM}_t\big)^2}$$

- $m$: cuántos datos entran en la ventana (por ejemplo, 12 meses).
- $j = 0, \dots, m-1$ recorre el periodo actual y los $m-1$ anteriores.
- $s_t$ divide entre $m - 1$ (la convención de pandas para la desviación estándar muestral).
:::

:::guiado Media y desviación móviles con m = 3
Serie: $y = (4,\, 6,\, 5,\, 7,\, 9,\, 8)$. Cada ventana toma el periodo actual y los dos anteriores.

| $t$ | $y_t$ | $\mathrm{MM}_t$ | $s_t$ |
|---|---|---|---|
| 1 | 4 | — | — |
| 2 | 6 | — | — |
| 3 | 5 | 5 | 1 |
| 4 | 7 | 6 | 1 |
| 5 | 9 | 7 | 2 |
| 6 | 8 | 8 | 1 |
---
= t = 1, 2:\quad \text{ventana incompleta}
> No hay 3 datos hasta $t$: en pandas quedan como `NaN`.
@ usa c2[1-2]
= \mathrm{MM}_3 = \frac{4 + 6 + 5}{3} = \frac{15}{3} = 5
> Primera ventana completa: $t = 1, 2, 3$.
@ usa c2[1-3]; da c3[3]
= s_3 = \sqrt{\frac{(4-5)^2 + (6-5)^2 + (5-5)^2}{3 - 1}} = \sqrt{\frac{1 + 1 + 0}{2}} = 1
> Desviaciones respecto a la media **de la ventana** y división entre $m - 1 = 2$.
@ usa c2[1-3] c3[3]; da c4[3]
= \mathrm{MM}_4 = \frac{6 + 5 + 7}{3} = 6, \qquad s_4 = \sqrt{\frac{0 + 1 + 1}{2}} = 1
> La ventana se recorre un lugar: sale el 4 y entra el 7.
@ usa c2[2-4]; da c3[4] c4[4]
= \mathrm{MM}_5 = \frac{5 + 7 + 9}{3} = 7, \qquad s_5 = \sqrt{\frac{4 + 0 + 4}{2}} = 2
> Desviaciones $-2, 0, 2$ respecto a 7.
@ usa c2[3-5]; da c3[5] c4[5]
= \mathrm{MM}_6 = \frac{7 + 9 + 8}{3} = 8, \qquad s_6 = \sqrt{\frac{1 + 1 + 0}{2}} = 1
> La media móvil sube de 5 a 8: **la media no es constante** (hay tendencia). La desviación casi no cambia.
@ usa c2[4-6]; da c3[6] c4[6]
:::

```python
movil = pd.DataFrame({"y": [4, 6, 5, 7, 9, 8]})
movil["MM_3"] = movil["y"].rolling(3).mean()
movil["s_3"] = movil["y"].rolling(3).std()     # ddof=1 por defecto
print(movil)
```

:::interactivo moviles | Media y desviación móviles en distintas series
Si la línea de la media móvil se mueve, la media no es constante. Si la banda (±2 desviaciones móviles) se ensancha, la varianza no es constante. Ambas cosas violan la estacionariedad [[debil]].
@@@
- **Línea lila**: la serie. **Línea rosa**: la media móvil de los últimos $m$ datos (cada punto promedia una ventana que **termina** en $t$). **Franja menta**: media móvil ± 2 desviaciones móviles.
- Los primeros $m - 1$ puntos no tienen línea: la ventana está incompleta (en pandas son `NaN`).
- **Qué buscar**: rosa horizontal ⇒ media constante; franja de ancho constante ⇒ varianza constante. La lectura de abajo compara el inicio con el final.
:::

:::nota Sobre los simuladores de Python
A partir de aquí encontrarás **simuladores**: bloques donde el código de Python se reescribe con los parámetros que elijas y debajo aparece la salida que obtendrías. Los cálculos se hacen en tu navegador con las mismas fórmulas que pandas y statsmodels (verificadas contra ellos). Con **AirPassengers** los números coinciden exactamente con Python; las series **simuladas** (AR, MA, ruido, paseo) se generan en el navegador, así que en tu computadora obtendrás otra muestra del mismo proceso, con números parecidos pero no idénticos.
:::

:::interactivo py-rolling | Simulador: `rolling()` de pandas con sus parámetros {#sim-rolling}
Cambia `window`, `center` y `min_periods`. El código de arriba se reescribe con tus valores (resaltados en amarillo) y la salida muestra lo que imprimiría `print(movil.head(8))`.
@@@
- **Código**: los valores resaltados son los parámetros que cambiaste; el último que moviste parpadea.
- **Salida**: las primeras 8 filas de la serie móvil; `NaN` = no hay datos suficientes en la ventana.
- **Gráfica**: la serie (lila) y el estadístico móvil (rosa). Si eliges `.std()`, la rosa se mide en el eje derecho.
- **Tabla de parámetros**: qué hace cada uno y qué valor conviene; se resalta el último que cambiaste.
:::

:::duda ¿Ventana centrada o hacia atrás?
Depende de para qué la quieras. **Hacia atrás** (`center=False`, el valor por defecto) solo usa el pasado: es la que tendrías en tiempo real, pero va **retrasada** unos $m/2$ periodos respecto a la serie. **Centrada** (`center=True`) usa datos de ambos lados: no se retrasa y describe mejor la tendencia, pero no existe en los últimos periodos. La descomposición clásica usa la centrada [[mm-centrada]].
:::

:::duda ¿Por qué aparecen NaN al inicio?
Con `window=12` y `min_periods=None`, pandas necesita 12 datos para calcular; los primeros 11 periodos no los tienen y quedan como `NaN`. Si pones `min_periods=1`, calcula con lo que haya, pero entonces los primeros valores promedian muy pocos datos y no son comparables con el resto.
:::

```python
s = pd.Series([4, 6, 5, 7, 9, 8, 10])
comparacion = pd.DataFrame({
    "y": s,
    "atrás (3)": s.rolling(3).mean(),
    "centrada (3)": s.rolling(3, center=True).mean(),
    "atrás, min_periods=1": s.rolling(3, min_periods=1).mean(),
})
print(comparacion.round(3))
```

## 🧩 Componentes de una serie de tiempo {#componentes}
@mapa Tendencia, estacionalidad, ciclo, ruido y rupturas; modelos aditivo y multiplicativo; descomposición clásica.

### Los cinco componentes {#cinco}

:::definicion Descomposición conceptual
$$y_t = T_t + S_t + C_t + \varepsilon_t \qquad\text{o, si la amplitud crece con el nivel,}\qquad y_t = T_t \times S_t \times \varepsilon_t$$
:::

| Componente | Qué es | Ejemplo |
|---|---|---|
| **Tendencia** $T_t$ | movimiento sostenido del nivel medio, hacia arriba o abajo | crecimiento de pasajeros por décadas |
| **Estacionalidad** $S_t$ | patrón que se repite con **periodo fijo y conocido** | más ventas cada diciembre |
| **Ciclo** $C_t$ | oscilación recurrente de **duración variable** (normalmente de varios años) | auges y recesiones económicas |
| **Ruido** $\varepsilon_t$ | variación aleatoria no explicada por estructura sistemática | pequeñas variaciones día a día |
| **Ruptura estructural** | cambio abrupto o persistente en media, varianza o tendencia | una pandemia, un cambio de ley |

:::interactivo constructor | Construye tu propia serie
Mueve cada componente y mira cómo se arma la serie final (arriba). Prueba: pon todo en cero excepto el ruido; luego agrega solo tendencia; luego solo estacionalidad. Cambia a **multiplicativo** con tendencia fuerte y verás que la estacionalidad **crece** junto con el nivel.
@@@
- **Panel superior**: la serie final, la que observarías en la práctica.
- **Paneles inferiores**: cada componente por separado con el mismo eje de tiempo: tendencia (con la ruptura), estacional, ciclo y ruido.
- En **multiplicativo**, la estacionalidad, el ciclo y el ruido se expresan en %: cada uno es un factor $1 + \%/100$ que multiplica a la tendencia.
- **Qué buscar**: compara el rango del primer y del último ciclo estacional (abajo). Si crece, la amplitud depende del nivel.
:::

### Estacionalidad vs. ciclo {#est-vs-ciclo}

Es una pregunta clásica de examen porque ambos «suben y bajan»:

| | Estacionalidad | Ciclo |
|---|---|---|
| Periodo | **fijo y conocido** (12 meses, 7 días, 24 horas) | **variable**, no se sabe de antemano |
| Causa típica | calendario, clima, costumbres | economía, mercados, ecosistemas |
| Duración típica | menos de un año | varios años |
| ¿Se puede anticipar la fecha del pico? | sí (cada julio) | no con exactitud |

### Modelo aditivo {#aditivo}

:::definicion Modelo aditivo
$$y_t = T_t + S_t + R_t$$

Cada componente **se suma**. El efecto estacional $S_t$ se mide en las **mismas unidades** que la serie y su tamaño **no depende del nivel**: «en diciembre se venden 8 mil unidades más que el promedio», ya sea que el promedio sea 100 o 1000. Los índices estacionales suman 0 a lo largo de un periodo completo.
:::

:::guiado Armar una serie aditiva a mano
Tendencia $T_t = 100 + 2t$, efecto estacional trimestral $S = (+8,\,-3,\,-10,\,+5)$ (suman 0) y ruido $\varepsilon = (1,\,-2,\,0.5,\,-1)$.

| $t$ | $T_t = 100 + 2t$ | $S_t$ | $\varepsilon_t$ | $y_t = T_t + S_t + \varepsilon_t$ |
|---|---|---|---|---|
| 1 | 102 | +8 | 1 | 111 |
| 2 | 104 | −3 | −2 | 99 |
| 3 | 106 | −10 | 0.5 | 96.5 |
| 4 | 108 | +5 | −1 | 112 |
---
= T_t = 100 + 2t = (102,\; 104,\; 106,\; 108)
> Evaluamos la recta en $t = 1, 2, 3, 4$.
@ usa c1[1-4]; da c2[1-4]
= y_1 = 102 + 8 + 1 = 111
> Primer trimestre: tendencia más su efecto estacional más el ruido.
@ usa c2[1] c3[1] c4[1]; da c5[1]
= y_2 = 104 - 3 - 2 = 99
> Segundo trimestre: está 3 unidades abajo de la tendencia.
@ usa c2[2] c3[2] c4[2]; da c5[2]
= y_3 = 106 - 10 + 0.5 = 96.5, \qquad y_4 = 108 + 5 - 1 = 112
> Los otros dos trimestres.
@ usa c2[3-4] c3[3-4] c4[3-4]; da c5[3-4]
= T = 1000:\quad 1000 + 8 = 1008
> Muchos años después el primer trimestre seguirá sumando **+8**: en el modelo aditivo la amplitud estacional es **constante**.
@ usa c3[1]
:::

### Modelo multiplicativo {#multiplicativo}

:::definicion Modelo multiplicativo
$$y_t = T_t \times S_t \times R_t$$

Ahora $S_t$ es un **factor**: $S_t = 1.08$ significa «8% arriba de la tendencia». Como es un porcentaje, el efecto en unidades **crece con el nivel**: 8% de 100 son 8, pero 8% de 1000 son 80. Los índices estacionales promedian **1** a lo largo de un periodo.
:::

:::guiado La misma idea, ahora multiplicativa
Mismas tendencias; factores estacionales $S = (1.08,\, 0.97,\, 0.90,\, 1.05)$ y ruido multiplicativo $R = (1.01,\, 0.98,\, 1.005,\, 0.99)$.

| $t$ | $T_t$ | $S_t$ | $R_t$ | $S_t \times R_t$ | $y_t = T_t \times S_t \times R_t$ |
|---|---|---|---|---|---|
| 1 | 102 | 1.08 | 1.01 | 1.0908 | 111.2616 |
| 2 | 104 | 0.97 | 0.98 | 0.9506 | 98.8624 |
| 3 | 106 | 0.90 | 1.005 | 0.9045 | 95.877 |
| 4 | 108 | 1.05 | 0.99 | 1.0395 | 112.266 |
---
= S_t \times R_t = (1.0908,\; 0.9506,\; 0.9045,\; 1.0395)
> Primero multiplicamos los dos factores de cada trimestre.
@ usa c3[1-4] c4[1-4]; da c5[1-4]
= y_1 = 102 \times 1.0908 = 111.2616
> El primer trimestre queda 9.08% arriba de la tendencia.
@ usa c2[1] c5[1]; da c6[1]
= y_2 = 104 \times 0.9506 = 98.8624
> El segundo, casi 5% abajo.
@ usa c2[2] c5[2]; da c6[2]
= y_3 = 106 \times 0.9045 = 95.877, \qquad y_4 = 108 \times 1.0395 = 112.266
> Los otros dos trimestres.
@ usa c2[3-4] c5[3-4]; da c6[3-4]
= T = 1000:\quad 1000 \times 1.08 = 1080 \;(\text{efecto de } {+80})
> Con nivel 1000, el mismo factor produce un efecto **diez veces mayor** que con nivel 100: la amplitud crece.
@ usa c3[1]
:::

:::duda ¿La amplitud es el efecto estacional en la descomposición?
Casi. El **efecto estacional** es el componente $S_t$: cuánto se aleja cada temporada de la tendencia. La **amplitud** es el *tamaño* de esas oscilaciones (por ejemplo, la distancia entre el mes más alto y el más bajo de un año). En el modelo **aditivo** la amplitud es la misma todos los años porque $S_t$ se suma; en el **multiplicativo** la amplitud **crece con el nivel** porque $S_t$ multiplica. Por eso «la amplitud crece con el nivel» es la pista visual para elegir el modelo multiplicativo.
:::

### El logaritmo convierte lo multiplicativo en aditivo {#log}

:::demo Del modelo multiplicativo al aditivo {#demo-log}
:::pasos
= y_t = T_t \times S_t \times R_t
> Partimos del modelo multiplicativo (todos los factores son positivos).
= \ln y_t = \ln\big(T_t \times S_t \times R_t\big)
> Aplicamos logaritmo natural a ambos lados.
= \ln y_t = \ln T_t + \ln S_t + \ln R_t
> El logaritmo de un producto es la suma de los logaritmos [[log-producto]].
= y^*_t = T^*_t + S^*_t + R^*_t
> Renombramos $y^*_t = \ln y_t$, etc.: **es un modelo aditivo** en la escala logarítmica.
:::
:::

:::ejemplo Comprobación numérica
Con el primer trimestre del ejemplo anterior, $y_1 = 111.2616$:

:::pasos
= \ln 102 + \ln 1.08 + \ln 1.01 = 4.62497 + 0.07696 + 0.00995 = 4.71188
> Suma de los logaritmos de los tres factores.
= \ln(111.2616) = 4.71188 \;✓
> Coincide con el logaritmo del producto.
= \ln(1.1 \times 200) - \ln(200) = 5.39363 - 5.29832 = 0.09531
> Un factor de 1.1 sobre un nivel de 200…
= \ln(1.1 \times 2000) - \ln(2000) = 7.69621 - 7.60090 = 0.09531
> …y sobre un nivel de 2000: en logaritmos el efecto es **idéntico** (0.0953). La amplitud se volvió constante.
:::
:::

:::interactivo logaritmo | AirPassengers: escala original vs. logarítmica
A la izquierda la serie y a la derecha el rango anual (mes máximo − mes mínimo de cada año). En la escala original el rango crece año con año; en logaritmos se mantiene casi constante.
@@@
- **Izquierda**: la serie en la escala elegida. **Derecha**: cada barra es el **rango del año** (mes máximo − mes mínimo), una medida de la amplitud estacional.
- **Qué buscar**: en la escala original las barras crecen año con año; en logaritmos son casi iguales. Ese es el efecto de $\ln$ sobre un modelo multiplicativo.
:::

:::duda ¿Logaritmo o Box–Cox?
El logaritmo es un caso particular de la transformación de **Box–Cox**, $y^{(\lambda)} = (y^\lambda - 1)/\lambda$ (con $\lambda = 0$ es $\ln y$). Box–Cox busca el $\lambda$ que mejor estabiliza la varianza; si el $\lambda$ óptimo sale cerca de 0, usa $\ln$, que es más fácil de interpretar (porcentajes). Ambas exigen datos **positivos**. Se estudia con más detalle en la Unidad II.
:::

:::duda ¿Para qué sirve convertir lo multiplicativo en aditivo?
Porque casi todas las herramientas que veremos (medias móviles, descomposición aditiva, ACF, pruebas ADF y KPSS, modelos ARIMA) suponen que los efectos **se suman** y que la varianza es **estable**. Si la amplitud crece con el nivel, la varianza no es constante y esas herramientas se equivocan. Al tomar logaritmos: (1) la amplitud se vuelve constante, (2) los efectos se leen como **porcentajes** [[logaritmos]], y (3) al final puedes regresar a la escala original con $y_t = e^{\ln y_t}$.
:::

### ¿Para qué sirven los modelos aditivo y multiplicativo? {#para-que}

:::duda ¿Cuál es su fin?
No son un fin en sí mismos: son una **forma de separar la serie en piezas interpretables**. Sirven para:

1. **Entender**: ¿cuánto del movimiento es tendencia, cuánto es temporada y cuánto es azar?
2. **Desestacionalizar**: quitar $S_t$ para comparar meses distintos de forma justa (las cifras «ajustadas por estacionalidad» de los reportes económicos). Aditivo: $y_t - S_t$; multiplicativo: $y_t / S_t$.
3. **Pronosticar por piezas**: proyectar la tendencia y volver a poner el patrón estacional.
4. **Elegir transformaciones**: si el modelo correcto es multiplicativo, sabes que conviene usar logaritmos antes de modelar.

La elección es **visual**: amplitud constante ⇒ aditivo; amplitud que crece con el nivel ⇒ multiplicativo (o aditivo sobre $\ln y_t$).
:::

### La media móvil centrada {#mm-centrada}

La descomposición clásica estima la tendencia con una **media móvil centrada**: un promedio con el mismo número de datos a cada lado de $t$.

:::definicion Media móvil centrada
Si el periodo $s$ es **impar** ($s = 2J + 1$), se promedian $J$ datos antes, el actual y $J$ después, todos con peso $1/s$:

$$\hat{T}_t = \frac{1}{s}\sum_{j=-J}^{J} y_{t+j}$$

Si $s$ es **par** (4 trimestres, 12 meses) no existe un «centro» exacto, así que se usa la media móvil **2×s**: $s + 1$ datos donde los extremos pesan la mitad. Para $s = 4$:

$$\hat{T}_t = \tfrac18\,y_{t-2} + \tfrac14\,y_{t-1} + \tfrac14\,y_t + \tfrac14\,y_{t+1} + \tfrac18\,y_{t+2}$$

Los pesos $\tip{w}{w_j}$ suman 1 $\big(\tfrac18 + \tfrac14 + \tfrac14 + \tfrac14 + \tfrac18 = 1\big)$ y son **simétricos**.
:::

¿Por qué funciona? Tres propiedades, cada una con su demostración:

:::demo (1) Una media móvil simétrica no altera una tendencia lineal {#mm-lineal}
Sea $y_t = a + b\,t$ (una recta) y pesos simétricos $w_{-j} = w_j$ que suman 1.

:::pasos
= \hat T_t = \sum_{j=-J}^{J} w_j\,y_{t+j} = \sum_{j=-J}^{J} w_j\,\big(a + b(t + j)\big)
> Sustituimos la recta evaluada en $t + j$.
= = (a + b\,t)\sum_{j=-J}^{J} w_j \;+\; b\sum_{j=-J}^{J} j\,w_j
> Separamos la suma y sacamos lo que no depende de $j$ [[prop-suma]].
= = (a + b\,t)\cdot 1 \;+\; b \cdot 0
> Los pesos suman 1; y como son simétricos, cada $j\,w_j$ se cancela con $(-j)\,w_{-j}$.
= = a + b\,t
> La media móvil devuelve **exactamente la misma recta**.
:::

Ejemplo: $y_t = 3 + 2t$ y media de 3: en $t = 5$, $\tfrac13(y_4 + y_5 + y_6) = \tfrac13(11 + 13 + 15) = 13 = y_5$. ✓
:::

:::demo (2) Si la ventana abarca un periodo completo, la estacionalidad desaparece {#mm-estacional}
Sea $S_t$ un patrón trimestral que se repite ($S_{t+4} = S_t$) y cuyos 4 valores suman 0.

:::pasos
= \hat T_t = \tfrac18 S_{t-2} + \tfrac14 S_{t-1} + \tfrac14 S_t + \tfrac14 S_{t+1} + \tfrac18 S_{t+2}
> Aplicamos la media 2×4 al componente estacional.
= S_{t+2} = S_{t-2}
> $t+2$ y $t-2$ están separados 4 periodos: es la **misma** temporada.
= \hat T_t = \tfrac14 S_{t-2} + \tfrac14 S_{t-1} + \tfrac14 S_t + \tfrac14 S_{t+1}
> Los dos octavos se juntan: $\tfrac18 + \tfrac18 = \tfrac14$.
= = \tfrac14\big(S_{t-2} + S_{t-1} + S_t + S_{t+1}\big) = \tfrac14 \cdot 0 = 0
> Son 4 trimestres consecutivos distintos, es decir, un periodo completo, y suman 0.
:::

Con $S = (8, -3, -10, 5)$ en $t = 3$: $\tfrac18(8) + \tfrac14(-3 - 10 + 5) + \tfrac18(8) = 1 - 2 + 1 = 0$. ✓ Si la ventana **no** coincide con el periodo, quedan restos del patrón estacional en la tendencia.
:::

:::demo (3) Promediar reduce el ruido {#mm-ruido}
Si $\varepsilon_t$ son independientes con varianza $\sigma^2$, una media simple de $m$ de ellos:

:::pasos
= \Var\!\left(\frac{1}{m}\sum_{j=1}^{m}\varepsilon_j\right) = \frac{1}{m^2}\Var\!\left(\sum_{j=1}^{m}\varepsilon_j\right)
> La constante $1/m$ sale al cuadrado [[var-prop]].
= = \frac{1}{m^2}\sum_{j=1}^{m}\Var(\varepsilon_j) = \frac{1}{m^2}\cdot m\,\sigma^2
> Variables independientes: la varianza de la suma es la suma de las varianzas [[cov-prop]].
= = \frac{\sigma^2}{m}
> Con $m = 12$, el ruido que queda en la tendencia tiene **la doceava parte** de la varianza original.
:::
:::

:::interactivo mediamovil | ¿Qué ventana elimina la estacionalidad?
Serie trimestral con tendencia, estacionalidad y ruido. Prueba ventanas de 3, 4 (2×4), 5 y 8 (2×8): solo las que abarcan periodos completos dejan una tendencia **lisa**. Abajo verás los pesos de la ventana elegida.
@@@
- **Puntos lilas**: la serie trimestral. **Línea menta discontinua**: la tendencia verdadera ($50 + 0.8t$), que conocemos porque la serie es simulada. **Línea rosa**: la tendencia estimada con la media móvil centrada.
- **Gráfica de abajo**: los pesos que recibe cada dato de la ventana ($t-2, \dots, t+2$); siempre suman 1.
- **Qué buscar**: con 4 u 8 la rosa casi coincide con la menta; con 3 o 5 ondula. La «distancia típica» es la raíz del promedio de los errores al cuadrado.
:::

### Descomposición clásica paso a paso {#descomposicion}

:::definicion Algoritmo de la descomposición clásica (aditiva)
1. **Tendencia**: $\hat T_t$ = media móvil centrada de orden $s$ [[mm-centrada]]. Se pierden $s/2$ datos al inicio y al final.
2. **Quitar la tendencia**: $y_t - \hat T_t$ (en el multiplicativo, $y_t / \hat T_t$).
3. **Índices estacionales**: promediar $y_t - \hat T_t$ de cada temporada (todos los primeros trimestres juntos, todos los segundos…) y **centrarlos** para que sumen 0 (en el multiplicativo, para que promedien 1).
4. **Residuo**: $\hat R_t = y_t - \hat T_t - \hat S_t$ (en el multiplicativo, $y_t / (\hat T_t \hat S_t)$).
:::

:::guiado Descomposición clásica de una serie trimestral (3 años) {#guia-descomp}
$$y = (24,\, 18,\, 14,\, 26,\;\; 28,\, 21,\, 18,\, 30,\;\; 31,\, 25,\, 21,\, 34)$$

| $t$ | trim. | $y_t$ | $\hat T_t$ | $y_t - \hat T_t$ | $\hat S_t$ | $\hat R_t$ |
|---|---|---|---|---|---|---|
| 1 | Q1 | 24 | — | — | 4.9531 | — |
| 2 | Q2 | 18 | — | — | −2.4844 | — |
| 3 | Q3 | 14 | 21 | −7 | −6.7969 | −0.2031 |
| 4 | Q4 | 26 | 21.875 | 4.125 | 4.3281 | −0.2031 |
| 5 | Q1 | 28 | 22.75 | 5.25 | 4.9531 | 0.2969 |
| 6 | Q2 | 21 | 23.75 | −2.75 | −2.4844 | −0.2656 |
| 7 | Q3 | 18 | 24.625 | −6.625 | −6.7969 | 0.1719 |
| 8 | Q4 | 30 | 25.5 | 4.5 | 4.3281 | 0.1719 |
| 9 | Q1 | 31 | 26.375 | 4.625 | 4.9531 | −0.3281 |
| 10 | Q2 | 25 | 27.25 | −2.25 | −2.4844 | 0.2344 |
| 11 | Q3 | 21 | — | — | −6.7969 | — |
| 12 | Q4 | 34 | — | — | 4.3281 | — |

| Trimestre | valores de $y_t - \hat T_t$ | promedio | índice centrado $\hat S$ |
|---|---|---|---|
| Q1 | 5.25, 4.625 | 4.9375 | 4.9531 |
| Q2 | −2.75, −2.25 | −2.5 | −2.4844 |
| Q3 | −7, −6.625 | −6.8125 | −6.7969 |
| Q4 | 4.125, 4.5 | 4.3125 | 4.3281 |
| **Media** | | −0.015625 | 0 |
---
= \hat T_3 = \tfrac18 y_1 + \tfrac14 (y_2 + y_3 + y_4) + \tfrac18 y_5 = 3 + 14.5 + 3.5 = 21
> **Paso 1 · Tendencia.** La media 2×4 centrada en $t = 3$ usa dos datos antes y dos después [[mm-centrada]]: $\tfrac18(24) + \tfrac14(18 + 14 + 26) + \tfrac18(28)$.
@ usa c3[1-5]; da c4[3]
= \hat T_4 = \tfrac18(18) + \tfrac14(14 + 26 + 28) + \tfrac18(21) = 2.25 + 17 + 2.625 = 21.875
> La ventana se recorre un lugar.
@ usa c3[2-6]; da c4[4]
= \hat T_5, \dots, \hat T_{10} = 22.75,\; 23.75,\; 24.625,\; 25.5,\; 26.375,\; 27.25
> Se repite hasta $t = 10$. En $t = 1, 2, 11, 12$ no hay dos datos a cada lado: la tendencia no existe ahí.
@ usa c3[3-12]; da c4[5-10]
= y_t - \hat T_t = (-7,\; 4.125,\; 5.25,\; -2.75,\; -6.625,\; 4.5,\; 4.625,\; -2.25)
> **Paso 2 · Quitar la tendencia.** Restamos renglón por renglón; queda el efecto estacional más el ruido.
@ usa c3[3-10] c4[3-10]; da c5[3-10]
= Q1:\; \frac{5.25 + 4.625}{2} = 4.9375
> **Paso 3 · Promediar por temporada.** Los primeros trimestres con tendencia disponible son $t = 5$ y $t = 9$.
@ usa c5[5,9] c2[5,9]; da t2.c2[1] t2.c3[1]
= Q2: -2.5,\qquad Q3: -6.8125,\qquad Q4: 4.3125
> Lo mismo con $t = 6, 10$ (Q2), $t = 3, 7$ (Q3) y $t = 4, 8$ (Q4).
@ usa c5[3,4,6,7,8,10]; da t2.c2[2-4] t2.c3[2-4]
= \frac{4.9375 - 2.5 - 6.8125 + 4.3125}{4} = \frac{-0.0625}{4} = -0.015625
> Los promedios no suman 0 por el ruido: calculamos su media.
@ usa t2.c3[1-4]; da t2.c3[5]
= \hat S_{Q} = \text{promedio} - (-0.015625):\quad (4.9531,\; -2.4844,\; -6.7969,\; 4.3281)
> A cada promedio le restamos la media; ahora los 4 índices suman 0.
@ usa t2.c3[1-5]; da t2.c4[1-5]
= \hat S_t = \hat S_{\text{trimestre de } t}
> Cada renglón de la serie recibe el índice de su trimestre (el patrón se repite los 3 años).
@ usa t2.c4[1-4] c2[1-12]; da c6[1-12]
= \hat R_3 = y_3 - \hat T_3 - \hat S_3 = 14 - 21 - (-6.7969) = -0.2031
> **Paso 4 · Residuo.** Lo que queda después de quitar tendencia y estacionalidad. Todos los residuos son pequeños (entre −0.33 y 0.30): el primer trimestre está unas 5 unidades **arriba** de la tendencia y el tercero casi 7 **abajo**.
@ usa c3[3-10] c4[3-10] c6[3-10]; da c7[3-10]
:::

```python
from statsmodels.tsa.seasonal import seasonal_decompose

y = np.array([24, 18, 14, 26, 28, 21, 18, 30, 31, 25, 21, 34], dtype=float)
d = seasonal_decompose(y, model="additive", period=4)
print("Tendencia:   ", np.round(d.trend, 4))
print("Índices S:   ", np.round(d.seasonal[:4], 4))
print("Residuo:     ", np.round(d.resid, 4))
```

Los números coinciden con los del cálculo a mano. Con AirPassengers (periodo 12), el modelo multiplicativo da factores estacionales que se leen como porcentajes:

```python
dec_mult = seasonal_decompose(serie, model="multiplicative", period=12)
factores = dec_mult.seasonal.iloc[:12]
factores.index = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"]
print(factores.round(3))
print("Promedio de los 12 factores:", round(factores.mean(), 6))
```

Julio tiene un factor de 1.227: está **22.7% arriba** de la tendencia; noviembre (0.801) está casi **20% abajo**.

:::interactivo descomposicion | Descomposición clásica de AirPassengers
Compara el modelo aditivo con el multiplicativo. Fíjate en el **residuo**: con el aditivo conserva un patrón en forma de embudo (pequeño al inicio, grande al final), señal de que el modelo no es el adecuado. Con el multiplicativo el residuo se ve como ruido alrededor de 1.
@@@
- **Cuatro paneles con el mismo eje de tiempo** (igual que `dec.plot()` en Python):
  1. **Observada** (`dec.observed`): la serie original.
  2. **Tendencia** (`dec.trend`): la media móvil 2×12; le faltan 6 meses en cada extremo.
  3. **Estacional** (`dec.seasonal`): el mismo patrón de 12 meses repetido.
  4. **Residuo** (`dec.resid`): lo que sobra; la línea punteada es 0 (aditivo) o 1 (multiplicativo).
- **Tabla**: el índice (aditivo, en pasajeros) o el factor (multiplicativo) de cada mes y su porcentaje respecto a la tendencia.
- **Qué buscar**: un residuo sin patrón y con dispersión parecida en toda la muestra.
:::

:::interactivo py-decompose | Simulador: `seasonal_decompose` con todos sus parámetros {#sim-decompose}
Cambia el modelo, el periodo, `two_sided` y `extrapolate_trend`. Observa en la salida dónde aparecen los `NaN` y en la gráfica qué le pasa al residuo cuando el periodo es incorrecto.
@@@
- **Código**: la llamada exacta con tus parámetros.
- **Salida**: las 8 primeras filas de observada, tendencia, estacional y residuo. Con `extrapolate_trend=0` la tendencia empieza con 6 `NaN` (la mitad de la ventana 2×12).
- **Gráfica**: lo que dibuja `dec.plot()`; el residuo va con puntos y la línea punteada marca 0 o 1.
- **Lectura**: cuántos `NaN` hay, y si el residuo conserva estructura estacional ($\hat\rho(12)$ del residuo).
:::

| Caso | `model` | `period` | `two_sided` | `extrapolate_trend` |
|---|---|---|---|---|
| Mensual con amplitud constante | `"additive"` | 12 | True | 0 |
| Mensual con amplitud creciente (AirPassengers) | `"multiplicative"` | 12 | True | 0 |
| Trimestral | según la amplitud | 4 | True | 0 |
| Diaria con patrón semanal | según la amplitud | 7 | True | 0 |
| Necesitas tendencia en todas las fechas | el que corresponda | el real | True | `period - 1` |
| Tendencia «en tiempo real» (solo pasado) | el que corresponda | el real | False | 0 |

:::duda ¿Qué pasa si no pongo `period`?
Si la serie tiene un índice de fechas **con frecuencia** (por ejemplo, la que creamos con `asfreq("MS")` en [[pandas]]), `seasonal_decompose` deduce el periodo: 12 para mensual, 4 para trimestral, 7 para diaria. Si el índice no tiene frecuencia (o es un arreglo de NumPy), da un error y te pide `period`.
:::

:::duda ¿Por qué la tendencia tiene NaN y qué hace `extrapolate_trend`?
La media móvil centrada 2×12 necesita 6 datos de cada lado, así que en los 6 primeros y 6 últimos meses no existe [[mm-centrada]]. Con `extrapolate_trend=k` statsmodels ajusta una recta por mínimos cuadrados a los $k + 1$ valores de tendencia más cercanos a cada extremo y la prolonga. En statsmodels 0.15 se puede escribir `"period"` (en versiones anteriores `"freq"`), que equivale a `period - 1`; un entero funciona en todas las versiones.
:::

:::duda ¿Qué significa que el residuo tenga patrón?
Que la descomposición dejó estructura sin explicar: un **embudo** indica que el modelo debía ser multiplicativo; ondas cada 12 meses indican un periodo equivocado; rachas largas indican que la tendencia no se estimó bien. Un buen residuo se parece a ruido.
:::

```python
dec_auto = seasonal_decompose(serie, model="multiplicative")                 # sin period: lo deduce de "MS"
dec_12 = seasonal_decompose(serie, model="multiplicative", period=12)
print("¿Mismo resultado sin period?", np.allclose(dec_auto.seasonal, dec_12.seasonal))
print("NaN en la tendencia:", dec_12.trend.isna().sum())
dec_ext = seasonal_decompose(serie, model="multiplicative", period=12, extrapolate_trend=11)   # = period - 1
print("NaN con extrapolate_trend=11:", dec_ext.trend.isna().sum())
print(pd.DataFrame({"sin extrapolar": dec_12.trend, "extrapolada": dec_ext.trend}).head(7).round(2))
```

:::cuidado Limitaciones de la descomposición clásica
- Pierde $s/2$ observaciones en cada extremo (la tendencia no existe ahí).
- Supone que el patrón estacional es **idéntico** todos los años.
- Es sensible a valores atípicos (un promedio se mueve mucho con un dato extremo).

Métodos más modernos (STL, X-13) relajan estas suposiciones, pero la lógica es la misma.
:::

:::resumen Lo esencial de la sección 3
- Componentes: tendencia, estacionalidad (periodo fijo), ciclo (periodo variable), ruido y rupturas.
- **Aditivo**: amplitud constante. **Multiplicativo**: amplitud que crece con el nivel; $\ln$ lo convierte en aditivo.
- La media móvil centrada de orden $s$ conserva la tendencia lineal, elimina la estacionalidad de periodo $s$ y reduce el ruido a $\sigma^2/m$.
- Descomposición clásica: tendencia → quitarla → promediar por temporada y centrar → residuo.
:::
