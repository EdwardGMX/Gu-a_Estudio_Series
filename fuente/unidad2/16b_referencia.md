## 🧱 Modelos de referencia (benchmarks) {#referencia}
@mapa Los cuatro métodos de referencia de statsforecast (HistoricAverage, Naive, SeasonalNaive y RandomWalkWithDrift): fórmulas, cálculo a mano, por qué son modelos ARIMA, valores ajustados y residuales, intervalos de predicción, el flujo completo con statsforecast y la evaluación contra ellos.

### Por qué empezar por lo más simple {#ref-por-que}

Antes de ajustar un ARIMA hay que saber **cuánto vale pronosticar sin pensar**. Los modelos de referencia (*benchmarks*) son reglas tan simples que se calculan con una línea: repetir el promedio, repetir el último dato, repetir el mismo mes del año pasado o seguir la recta entre el primer dato y el último. Se usan para tres cosas:

1. **Poner la vara.** Un modelo complicado solo vale la pena si le gana a la mejor referencia. Si tu SARIMA tiene un MAPE de 12% y el ingenuo estacional de 10%, el SARIMA no aporta nada [[metricas]].
2. **Escalar el error.** El MASE divide el MAE del modelo entre el del ingenuo: es literalmente «cuántas veces el error de la referencia» [[metricas-def]].
3. **Practicar el flujo completo.** Ajustar, pronosticar, calcular residuales, construir intervalos y evaluar es igual para un modelo de una línea que para un SARIMAX. Esta sección hace todo el flujo con la librería `statsforecast`.

:::intuicion Otra forma de verlo: el examen de diagnóstico del pronóstico
Piensa en un médico que estrena un aparato de diagnóstico carísimo. Lo primero que pregunta es si acierta **más que la regla de dedo** que ya usaba. Los modelos de referencia son esa regla de dedo. Si el aparato no le gana, no importa lo sofisticado que sea.
:::

### Los cuatro métodos {#ref-metodos}

Llamamos $y_1, \dots, y_T$ a los datos de entrenamiento, $h$ al horizonte y $m$ al periodo estacional (12 en datos mensuales, 4 en trimestrales).

:::definicion Los cuatro pronósticos de referencia
- **Promedio histórico** (`HistoricAverage`): todos los pronósticos valen la media de los datos.
$$\hat{y}_{T+h \mid T} = \bar{y} = \frac{1}{T}\sum_{t=1}^{T} y_t$$
- **Ingenuo** (`Naive`): todos los pronósticos valen el último dato.
$$\hat{y}_{T+h \mid T} = y_T$$
- **Ingenuo estacional** (`SeasonalNaive(season_length=m)`): cada periodo futuro copia el mismo periodo de la última temporada observada.
$$\hat{y}_{T+h \mid T} = y_{T+h-m(k+1)}, \qquad \tip{k-temp}{k} = \left\lfloor \frac{h-1}{\tip{m-est}{m}} \right\rfloor$$
- **Deriva** (`RandomWalkWithDrift`): el último dato más una pendiente igual al cambio promedio por periodo.
$$\hat{y}_{T+h \mid T} = y_T + \tip{h-pron}{h}\,\tip{b-deriva}{b}, \qquad \tip{b-deriva}{b} = \frac{y_T - y_1}{\tip{T-obs}{T} - 1}$$

$k$ cuenta cuántas temporadas completas hay que saltar: en el primer año de pronóstico vale 0 (se copia el último año observado); en el segundo año vale 1 y se vuelve a copiar **el mismo** último año.
:::

| Método | Clase en statsforecast | Columna que produce | Gana cuando la serie… | Es el ARIMA… |
|---|---|---|---|---|
| Promedio histórico | `HistoricAverage()` | `HistoricAverage` | oscila alrededor de un nivel fijo | ARIMA(0,0,0) con constante |
| Ingenuo | `Naive()` | `Naive` | es un paseo aleatorio (precios, tipos de cambio) | ARIMA(0,1,0) |
| Ingenuo estacional | `SeasonalNaive(season_length=m)` | `SeasonalNaive` | tiene una estacionalidad fuerte y estable | ARIMA(0,0,0)(0,1,0)$_m$ |
| Deriva | `RandomWalkWithDrift()` | `RWD` | sube o baja de forma persistente | ARIMA(0,1,0) con constante |

:::cuidado La columna de la deriva se llama `RWD`
Las otras tres columnas llevan el nombre de la clase, pero `RandomWalkWithDrift()` produce la columna **`RWD`** (y `RWD-lo-80`, `RWD-hi-80`, …). Si buscas `"RandomWalkWithDrift"` en el DataFrame obtendrás un `KeyError`.
:::

### Los cuatro pronósticos a mano {#guia-ref-pron-sec}

:::guiado Producción trimestral de refresco: cuatro pronósticos para 2022 {#guia-ref-pron}
| $t$ | Trimestre | $y_t$ | Promedio | Ingenuo | Estacional | Deriva |
|---|---|---|---|---|---|---|
| 1 | 2020-T1 | 10 | | | | |
| 2 | 2020-T2 | 14 | | | | |
| 3 | 2020-T3 | 8 | | | | |
| 4 | 2020-T4 | 12 | | | | |
| 5 | 2021-T1 | 13 | | | | |
| 6 | 2021-T2 | 17 | | | | |
| 7 | 2021-T3 | 9 | | | | |
| 8 | 2021-T4 | 15 | | | | |
| 9 | 2022-T1 | ? | 12.25 | 15 | 13 | 15.714 |
| 10 | 2022-T2 | ? | 12.25 | 15 | 17 | 16.429 |
| 11 | 2022-T3 | ? | 12.25 | 15 | 9 | 17.143 |
| 12 | 2022-T4 | ? | 12.25 | 15 | 15 | 17.857 |
---
= \bar{y} = \frac{10 + 14 + 8 + 12 + 13 + 17 + 9 + 15}{8} = \frac{98}{8} = 12.25
> Promedio histórico: todos los datos pesan lo mismo, y el resultado se repite en los cuatro trimestres. No distingue el T2 alto del T3 bajo.
@ usa c3[1-8]; da c4[9-12]
= \hat{y}_{T+h \mid T} = y_T = y_8 = 15 \quad (h = 1, 2, 3, 4)
> Ingenuo: el último dato (2021-T4) se repite hacia adelante. Tampoco ve la estacionalidad.
@ usa c3[8]; da c5[9-12]
= \begin{gathered} k = \left\lfloor \tfrac{h-1}{4} \right\rfloor = 0 \\ \hat{y}_{9} = y_5 = 13,\ \ \hat{y}_{10} = y_6 = 17 \\ \hat{y}_{11} = y_7 = 9,\ \ \hat{y}_{12} = y_8 = 15 \end{gathered}
> Ingenuo estacional con $m = 4$: cada trimestre de 2022 copia el mismo trimestre de 2021. Es el único que reproduce el patrón alto-bajo.
@ usa c3[5-8]; da c6[9-12]
= b = \frac{y_T - y_1}{T - 1} = \frac{15 - 10}{8 - 1} = \frac{5}{7} = 0.714
> La deriva: en siete pasos la serie subió 5 unidades, así que en promedio sube 0.714 por trimestre.
@ usa c3[1] c3[8]
= \hat{y}_{T+h \mid T} = 15 + 0.714\,h:\quad 15.714,\ \ 16.429,\ \ 17.143,\ \ 17.857
> Se parte del último dato y se suma la pendiente $h$ veces. Es una recta que no ve la estacionalidad.
@ usa c3[8]; da c7[9-12]
:::

:::demo La deriva es la recta entre el primer dato y el último {#demo-ref-deriva}
:::pasos
= \begin{gathered} \frac{1}{T-1}\sum_{t=2}^{T}(y_t - y_{t-1}) \\ = \frac{(y_2 - y_1) + (y_3 - y_2) + \dots + (y_T - y_{T-1})}{T - 1} \end{gathered}
> Empezamos por el promedio de las primeras diferencias $\Delta y_t$, el cambio de cada periodo.
= = \frac{y_T - y_1}{T - 1} = b
> La suma es **telescópica**: cada $y_t$ intermedio aparece una vez con $+$ y otra con $-$, y solo sobreviven el último y el primero.
= \hat{y}_{T+h \mid T} = y_T + h\,\frac{y_T - y_1}{T - 1}
> Evaluado en $h = 0$ da $y_T$; si se extiende hacia atrás $T - 1$ periodos ($h = -(T - 1)$) da $y_1$. El pronóstico es la recta que pasa por el primer dato y por el último, prolongada al futuro.
:::
Consecuencia práctica: **solo importan $y_1$ y $y_T$**. Si el primer dato es atípico, la pendiente sale mal aunque los demás 130 datos sean perfectos. En el ejemplo, las diferencias son $4, -6, 4, 1, 4, -8, 6$ y su promedio es $5/7$, igual que $b$.
:::

:::demo Los cuatro métodos son modelos ARIMA {#demo-ref-arima}
:::pasos
= y_t = c + \varepsilon_t \;\Rightarrow\; \hat{y}_{T+h \mid T} = \E_T[c + \varepsilon_{T+h}] = c, \qquad \hat{c} = \bar{y}
> **Promedio**: ARIMA(0,0,0) con constante, ruido blanco alrededor de una media. Por mínimos cuadrados (o máxima verosimilitud), la constante estimada es $\bar{y}$.
= y_t = y_{t-1} + \varepsilon_t \;\Rightarrow\; \hat{y}_{T+h \mid T} = y_T
> **Ingenuo**: ARIMA(0,1,0), el paseo aleatorio. Los choques futuros valen 0 en promedio [[el-paseo-aleatorio-el-pronóstico-ingenuo]].
= y_t = y_{t-m} + \varepsilon_t \;\Rightarrow\; \hat{y}_{T+h \mid T} = y_{T+h-m}\ \ (h \le m)
> **Estacional**: $(1 - L^m)\,y_t = \varepsilon_t$, un ARIMA(0,0,0)(0,1,0)$_m$. Cada mes es un paseo aleatorio propio, que solo se conecta con el mismo mes del año anterior.
= y_t = c + y_{t-1} + \varepsilon_t \;\Rightarrow\; \hat{y}_{T+h \mid T} = y_T + h\,c, \qquad \hat{c} = \overline{\Delta y} = b
> **Deriva**: ARIMA(0,1,0) con constante. La constante de un modelo con $d = 1$ es una pendiente [[demo-deriva]], y se estima con el promedio de las diferencias, que es $b$ [[demo-ref-deriva]].
:::
Por eso los modelos de referencia **no son una categoría aparte**: son los ARIMA más pequeños posibles, con cero o un parámetro. Cuando un ARIMA más grande no les gana, la conclusión es que los términos AR y MA adicionales no capturan nada útil.
:::

Comprobación en Python: statsmodels da exactamente los mismos pronósticos.

```python
from statsmodels.tsa.arima.model import ARIMA

entrena_ref = serie.iloc[:-12]                      # 1949–1959
ar_media = ARIMA(entrena_ref, order=(0, 0, 0), trend="c").fit()
ar_paseo = ARIMA(entrena_ref, order=(0, 1, 0)).fit()
ar_deriva = ARIMA(entrena_ref, order=(0, 1, 0), trend="t").fit()
ar_estac = ARIMA(entrena_ref, order=(0, 0, 0), seasonal_order=(0, 1, 0, 12)).fit()

print("ARIMA(0,0,0)+c   :", ar_media.forecast(3).round(2).tolist(), "| ȳ =", round(entrena_ref.mean(), 2))
print("ARIMA(0,1,0)     :", ar_paseo.forecast(3).round(2).tolist(), "| y_T =", entrena_ref.iloc[-1])
print("ARIMA(0,1,0)+t   :", ar_deriva.forecast(3).round(2).tolist(),
      "| b =", round((entrena_ref.iloc[-1] - entrena_ref.iloc[0]) / (len(entrena_ref) - 1), 4))
print("(0,0,0)(0,1,0)12 :", ar_estac.forecast(3).round(2).tolist(), "| enero-marzo 1959 =", entrena_ref.iloc[-12:-9].tolist())
```

La deriva estimada por máxima verosimilitud ($2.2366$) coincide con $b = (405 - 112)/131 = 2.2366$ hasta el cuarto decimal.

:::interactivo w2-ref-metodos | Los cuatro métodos sobre cinco series {#w-ref-metodos}
Elige una serie y cuántos periodos dejar para la prueba. Las cuatro reglas se calculan con el entrenamiento y se comparan con los datos reales que no vieron.
@@@
- **Gráfica**: el entrenamiento (línea oscura), la prueba (puntos verdes) y los cuatro pronósticos. El método que elijas en «Resaltar» se dibuja más grueso.
- **Lectura**: MAE, RMSE, MAPE y MASE de cada método en la prueba (el MASE usa el ingenuo estacional del entrenamiento como escala, igual que `mase(..., seasonality=m)`). El ganador aparece en verde.
- **Qué buscar**: cada serie tiene «su» ganador. El precio de la acción favorece al ingenuo, la serie trimestral al estacional, la serie con tendencia a la deriva y las ventas estables al promedio. En AirPassengers, que tiene tendencia **y** estacionalidad, ninguno es bueno: gana el estacional, pero se queda corto porque no sube.
- **Vista extra**: la tabla de los primeros pronósticos de cada método, como la devuelve `sf.forecast()`.
:::

:::ejemplo Qué referencia gana en cada tipo de serie
En la **producción trimestral** de la gráfica de arriba (40 trimestres, los últimos 8 para probar), el ingenuo estacional tiene un MAE de 3.02 contra 11.53 del ingenuo, 10.61 del promedio y 11.22 de la deriva. El error es casi **cuatro veces menor** porque la serie tiene una estacionalidad trimestral marcada que los otros tres no pueden ver.

La regla general:

| Si la serie… | La referencia natural es… | Porque… |
|---|---|---|
| oscila alrededor de un nivel fijo | el promedio | el mejor pronóstico de un ruido es su media |
| se mueve como un paseo aleatorio | el ingenuo | lo mejor que se sabe del futuro es el presente |
| tiene un patrón estacional estable | el ingenuo estacional | el mismo mes del año pasado ya trae el patrón |
| tiene tendencia persistente | la deriva | prolonga el crecimiento promedio |
| tiene tendencia **y** estacionalidad | ninguna basta | se necesita un SARIMA o un pronóstico por descomposición [[u1:pron-descomp]] (y compararlo contra la mejor referencia) |
:::

### El flujo de statsforecast {#ref-statsforecast}

`statsforecast` (de Nixtla) trabaja siempre con un DataFrame en **formato largo** con tres columnas obligatorias:

| Columna | Qué contiene | En AirPassengers |
|---|---|---|
| `unique_id` | el nombre de la serie (permite muchas series en una sola tabla) | `"AirPassengers"` |
| `ds` | la fecha, como `datetime` | `1949-01-01`, `1949-02-01`, … |
| `y` | el valor numérico | `112`, `118`, … |

:::definicion Los cuatro pasos del flujo
1. **Crear** el objeto con los modelos y la frecuencia: `sf = StatsForecast(models=[Naive(), SeasonalNaive(season_length=12)], freq="MS")`.
2. **Pronosticar** con `sf.forecast(df=entrenamiento, h=12, level=[80, 95], fitted=True)`. Devuelve un DataFrame con `unique_id`, `ds`, una columna por modelo y, si pediste `level`, las columnas `Modelo-lo-80`, `Modelo-hi-80`, …
3. **Recuperar los ajustados** (si usaste `fitted=True`) con `sf.forecast_fitted_values()`: los pronósticos a un paso dentro del entrenamiento, para calcular residuales.
4. **Evaluar**: unir el pronóstico con la prueba por `unique_id` y `ds`, y calcular métricas con `utilsforecast.evaluation.evaluate`.

La alternativa `sf.fit(df)` seguida de `sf.predict(h=12, level=[90])` da los mismos pronósticos; `forecast` es más rápido porque no guarda los modelos ajustados.
:::

| Frecuencia de los datos | `freq` | `season_length` típico |
|---|---|---|
| Mensual, fecha al **inicio** del mes | `"MS"` | 12 |
| Mensual, fecha al **final** del mes | `"ME"` (antes `"M"`) | 12 |
| Trimestral, inicio del trimestre | `"QS"` (o `"3MS"` si empieza en otro mes) | 4 |
| Semanal, cada viernes | `"W-FRI"` | 52 |
| Días hábiles (bolsa) | `"B"` | 5 |
| Diaria | `"D"` | 7 |
| Anual | `"YS"` | 1 (no hay estacionalidad) |

```python
from statsforecast import StatsForecast
from statsforecast.models import HistoricAverage, Naive, SeasonalNaive, RandomWalkWithDrift

# 1. Formato largo: unique_id, ds, y
df_ap = pd.DataFrame({"unique_id": "AirPassengers", "ds": serie.index, "y": serie.values})
train_df, test_df = df_ap.iloc[:-12], df_ap.iloc[-12:]          # 1949–1959 | 1960

# 2. Los cuatro modelos_ref y la frecuencia mensual (fecha al inicio del mes)
sf = StatsForecast(models=[HistoricAverage(), Naive(), SeasonalNaive(season_length=12), RandomWalkWithDrift()],
                   freq="MS")

# 3. Pronóstico a 12 meses con bandas de 80% y 95%, guardando los ajustados
fcst = sf.forecast(df=train_df, h=12, level=[80, 95], fitted=True)
print(fcst.columns.tolist()[:7], "…")
print(fcst[["ds", "HistoricAverage", "Naive", "SeasonalNaive", "RWD"]].head(4).round(2))
```

:::cuidado Una frecuencia equivocada mueve las fechas y rompe la evaluación
Si los datos tienen la fecha al **inicio** del mes y usas `freq="ME"` (o el antiguo `"M"`), los pronósticos salen fechados el **último día** de cada mes: `1959-12-31`, `1960-01-31`, … Al unirlos con la prueba por `ds` no coincide ninguna fecha, el `merge` queda vacío y las métricas salen `NaN`. Con `freq="D"` es peor: los «12 meses» se vuelven 12 días a partir del 2 de diciembre de 1959. La frecuencia tiene que coincidir con cómo están fechados tus datos.
:::

:::interactivo py2-statsforecast | Simulador: `StatsForecast` con sus parámetros {#sim-statsforecast}
Elige los modelos, el `season_length`, la frecuencia, el horizonte y los niveles. El código y la salida se actualizan; los números son los mismos que da statsforecast.
@@@
- Cambia `freq` a `"ME"` o `"D"` y mira cómo se mueven las fechas de `ds`.
- Con `season_length=4` el ingenuo estacional copia los **últimos cuatro meses** y no el mismo mes del año pasado: un error silencioso, no aparece ningún mensaje.
- Con `level=None` no aparecen columnas `-lo-` ni `-hi-`.
- El modo «olvidar fitted=True» reproduce el error real que aparece si llamas a `forecast_fitted_values()` sin haber pedido los ajustados.
:::

:::duda ¿Por qué `forecast_fitted_values()` dice que use `fitted=True`?
Porque los valores ajustados solo se guardan si los pides al pronosticar. Si llamas a `sf.forecast(df=train, h=12)` y luego a `sf.forecast_fitted_values()`, statsforecast lanza `Exception: Please run forecast method using fitted=True`. Vuelve a llamar a `forecast` con `fitted=True`.
:::

:::duda ¿`forecast` o `fit` + `predict`?
Dan los mismos números. `fit` guarda los modelos ajustados (útil si vas a pronosticar varias veces o quieres inspeccionarlos con `sf.fitted_`), y `predict` pronostica con ellos. `forecast` hace todo en un solo paso sin guardarlos y es más eficiente cuando tienes miles de series. Para el examen basta con saber que son equivalentes.
:::

### Valores ajustados y residuales {#ref-residuos}

:::definicion Ajustados y residuales de cada método
El **valor ajustado** $\hat{y}_t$ es lo que el método habría pronosticado para $t$ con los datos hasta $t - 1$ (un paso adelante), y el **residual** es $e_t = y_t - \hat{y}_t$ [[residuos-que]].

| Método | Ajustado $\hat{y}_t$ | Primeros residuales que faltan |
|---|---|---|
| Promedio | $\bar{y}$ (la media de **toda** la muestra) | ninguno |
| Ingenuo | $y_{t-1}$ | 1 (el primer dato no tiene anterior) |
| Ingenuo estacional | $y_{t-m}$ | $m$ (el primer año no tiene año anterior) |
| Deriva | $y_{t-1} + b$ | 1 |

En `sf.forecast_fitted_values()` los residuales que faltan aparecen como `NaN`; hay que quitarlos con `.dropna()` antes de cualquier prueba [[residuos-iniciales]].
:::

:::cuidado Los ajustados del promedio no son pronósticos honestos
Para un pronóstico verdadero a un paso, en $t$ solo deberías usar $y_1, \dots, y_{t-1}$. El promedio histórico usa la media de **toda** la muestra en todos los periodos, incluido el futuro de cada $t$. Por eso sus residuales suman exactamente cero, y por eso el error dentro de la muestra subestima el error real. Lo mismo pasa con la pendiente $b$ de la deriva, que se calcula con el último dato. En la práctica no importa mucho porque son uno o dos parámetros, pero es la razón de evaluar siempre con datos que el modelo no vio [[particion]].
:::

:::guiado Residuales del ingenuo y de la deriva {#guia-ref-residuos}
| $t$ | $y_t$ | $\hat{y}_t$ ingenuo | $e_t$ ingenuo | $e_t^2$ | $\hat{y}_t$ deriva | $e_t$ deriva |
|---|---|---|---|---|---|---|
| 1 | 10 | NaN | NaN | | NaN | NaN |
| 2 | 14 | 10 | 4 | 16 | 10.714 | 3.286 |
| 3 | 8 | 14 | −6 | 36 | 14.714 | −6.714 |
| 4 | 12 | 8 | 4 | 16 | 8.714 | 3.286 |
| 5 | 13 | 12 | 1 | 1 | 12.714 | 0.286 |
| 6 | 17 | 13 | 4 | 16 | 13.714 | 3.286 |
| 7 | 9 | 17 | −8 | 64 | 17.714 | −8.714 |
| 8 | 15 | 9 | 6 | 36 | 9.714 | 5.286 |
| suma | | | 5 | 185 | | 0 |
---
= \hat{y}_t = y_{t-1}:\quad 10,\ 14,\ 8,\ 12,\ 13,\ 17,\ 9
> El ajustado del ingenuo es la serie desplazada un periodo. En $t = 1$ no hay dato anterior: `NaN`.
@ usa c2[1-7]; da c3[2-8]
= e_t = y_t - y_{t-1}:\quad 4,\ -6,\ 4,\ 1,\ 4,\ -8,\ 6
> Los residuales del ingenuo son las **primeras diferencias** de la serie.
@ usa c2[1-8] c3[2-8]; da c4[2-8]
= \bar{e} = \frac{4 - 6 + 4 + 1 + 4 - 8 + 6}{7} = \frac{5}{7} = 0.714 = b
> ¡La media de los residuales del ingenuo es justo la pendiente de la deriva! Si es claramente distinta de cero, la serie tiene tendencia y el ingenuo se queda atrás de forma sistemática.
@ usa c4[2-8]; da c4[9]
= \hat{\sigma} = \sqrt{\frac{\sum e_t^2}{T - 1}} = \sqrt{\frac{185}{7}} = \sqrt{26.43} = 5.141
> La desviación de los residuales (raíz del error cuadrático medio a un paso). Se usa en los intervalos de predicción [[guia-ref-intervalos]].
@ usa c5[2-8]; da c5[9]
= \begin{gathered} \hat{y}_t = y_{t-1} + 0.714 \;\Rightarrow\; e_t^{\text{deriva}} = e_t^{\text{ingenuo}} - 0.714 \\ \textstyle\sum e_t^{\text{deriva}} = 5 - 7(0.714) = 0 \end{gathered}
> La deriva corrige ese sesgo: sus residuales son los del ingenuo menos $b$, y suman exactamente cero.
@ usa c3[2-8] c4[2-8]; da c6[2-8] c7[2-8] c7[9]
:::

:::demo Qué media tienen los residuales de cada referencia {#demo-ref-media-res}
:::pasos
= \textstyle\sum_{t=1}^{T}(y_t - \bar{y}) = T\bar{y} - T\bar{y} = 0
> **Promedio**: los residuales suman cero por definición de la media, sea cual sea la serie.
= \frac{1}{T-1}\textstyle\sum_{t=2}^{T}(y_t - y_{t-1}) = \frac{y_T - y_1}{T - 1} = b
> **Ingenuo**: los residuales son las diferencias y su promedio es telescópico [[demo-ref-deriva]].
= \frac{1}{T-1}\textstyle\sum_{t=2}^{T}(y_t - y_{t-1} - b) = b - b = 0
> **Deriva**: restar $b$ a cada residual del ingenuo deja media cero.
= \begin{gathered} \frac{1}{T-m}\textstyle\sum_{t=m+1}^{T}(y_t - y_{t-m}) \\ = \text{crecimiento promedio de una temporada a la siguiente} \end{gathered}
> **Estacional**: no tiene por qué ser cero. En una serie que crece, cada mes es mayor que el mismo mes del año anterior y los residuales son casi todos positivos.
:::
En AirPassengers (entrenamiento 1949–1959) los residuales del ingenuo tienen media $2.237 = b$, los de la deriva y del promedio media 0, y los del ingenuo estacional media **30.2**: cada mes tuvo, en promedio, 30 mil pasajeros más que el mismo mes del año anterior. Ese sesgo es la razón por la que el ingenuo estacional se queda corto en 1960.
:::

Los residuales de un buen pronóstico deben cumplir lo mismo que los de un ARIMA [[residuos-que]]:

1. **No estar correlacionados** (Ljung–Box no rechaza). Si lo están, queda información útil sin usar.
2. **Tener media cero.** Si no, el pronóstico está sesgado y basta con sumarle la media para mejorarlo.
3. *Deseable:* **varianza constante**, para que los intervalos tengan el mismo ancho a lo largo del tiempo.
4. *Deseable:* **distribución normal**, para que los intervalos con $\pm 1.28$, $\pm 1.96$ tengan la cobertura que prometen.

Las dos primeras son obligatorias: si fallan, se puede mejorar el pronóstico. Las otras dos solo afectan a los intervalos.

```python
from statsmodels.stats.diagnostic import acorr_ljungbox

ajustados = sf.forecast_fitted_values()
for nombre in ["HistoricAverage", "Naive", "SeasonalNaive", "RWD"]:
    e_ref = (ajustados["y"] - ajustados[nombre]).dropna()      # quita los NaN iniciales
    lb_ref = acorr_ljungbox(e_ref, lags=[24])                 # 2 años de rezagos; model_df = 0
    print(f"{nombre:16s} n = {len(e_ref):3d} | media = {e_ref.mean():7.3f} | desv = {e_ref.std():7.3f} | "
          f"Ljung–Box(24) p = {lb_ref['lb_pvalue'].iloc[0]:.1e}")
```

Ninguna referencia deja residuales de ruido blanco en AirPassengers: todas rechazan Ljung–Box con p-values astronómicamente pequeños. Es la prueba de que hay estructura que un SARIMA sí puede aprovechar (el de aerolínea deja $p = 0.74$ con 12 rezagos [[caso-ap-evaluar]]).

:::interactivo w2-ref-residuos | Diagnóstico de los residuales de cada referencia {#w-ref-residuos}
Elige la serie y el método. Los residuales se calculan sobre el entrenamiento (en AirPassengers, 1949–1959) como en `forecast_fitted_values()`, sin los `NaN` iniciales, y se revisan las cuatro propiedades.
@@@
- **Arriba**: los residuales en el tiempo con su media (línea rosa punteada). Si la media se separa del cero, el pronóstico está sesgado.
- **Abajo a la izquierda**: el histograma con la normal de la misma media y varianza.
- **Abajo a la derecha**: la ACF con la banda $\pm 1.96/\sqrt n$. La lectura da Ljung–Box con $h = 2m$ (o 10 si no hay estacionalidad) y una lista de ✓ y ✗ con las cuatro propiedades.
- **Qué buscar**: con el precio de la acción, los residuales del ingenuo son ruido blanco (es el modelo correcto). Con AirPassengers ninguno lo es. Con el promedio en una serie con tendencia, la ACF de los residuales decae lentísimo: los residuales **son** la serie centrada.
- **Vista extra**: la media de los residuales de los cuatro métodos junto a la pendiente $b$, para comprobar [[demo-ref-media-res]] con cualquier serie.
:::

:::duda ¿Qué `model_df` uso en Ljung–Box para una referencia?
El ingenuo y el estacional no estiman nada: `model_df = 0`. El promedio y la deriva estiman un parámetro ($\bar{y}$ o $b$); hay quien usa `model_df = 1`, pero con 24 rezagos y cientos de datos la diferencia es despreciable. Lo importante es no aplicar la prueba sobre los `NaN` iniciales [[lb-residuos]].
:::

### Intervalos de predicción {#ref-intervalos}

Un pronóstico puntual dice «lo más probable»; el **intervalo de predicción** dice entre qué valores caerá el dato real con una probabilidad dada. En statsforecast se piden con `level=[80, 95]`.

:::definicion Intervalo de predicción con residuales normales
$$\hat{y}_{T+h \mid T} \pm \tip{c-nivel}{c}\,\tip{sigma-h}{\hat{\sigma}_h}$$

| Nivel | 80% | 90% | 95% | 99% |
|---|---|---|---|---|
| $c$ | 1.282 | 1.645 | 1.960 | 2.576 |

$\hat{\sigma}_h$ es la desviación del error a $h$ pasos. Para las cuatro referencias tiene fórmula cerrada a partir de $\tip{sigma-ref}{\hat{\sigma}}$, la desviación de los residuales:

| Método | $\hat{\sigma}_h$ | Cómo crece con $h$ |
|---|---|---|
| Promedio | $\hat{\sigma}\sqrt{1 + 1/T}$ | no crece |
| Ingenuo | $\hat{\sigma}\sqrt{h}$ | como $\sqrt{h}$ |
| Ingenuo estacional | $\hat{\sigma}\sqrt{k + 1}$, con $k = \lfloor (h-1)/m \rfloor$ | en escalones, uno por temporada |
| Deriva | $\hat{\sigma}\sqrt{h\,(1 + h/(T - 1))}$ | más rápido que $\sqrt{h}$ |

statsforecast calcula $\hat{\sigma}$ con $\sqrt{\sum e_t^2 / (T - 1)}$ en el promedio, el ingenuo y la deriva, y con $\sqrt{\sum e_t^2/(T - m)}$ en el ingenuo estacional.
:::

:::demo De dónde salen las cuatro fórmulas {#demo-ref-varianza}
:::pasos
= y_{T+h} - y_T = \varepsilon_{T+1} + \varepsilon_{T+2} + \dots + \varepsilon_{T+h} \;\Rightarrow\; \Var = h\,\sigma^2
> **Ingenuo**: bajo el paseo aleatorio, el error a $h$ pasos acumula $h$ choques independientes. Es el caso $\psi_j = 1$ de [[demo-var-pronostico]].
= \begin{gathered} y_{T+h} - y_{T+h-m(k+1)} = \varepsilon_{T+h} + \varepsilon_{T+h-m} + \dots \;(k + 1 \text{ choques}) \\ \Rightarrow\; \Var = (k + 1)\,\sigma^2 \end{gathered}
> **Estacional**: cada mes es un paseo aleatorio que avanza una vez por año. En el primer año falta un choque ($k = 0$); en el segundo, dos.
= y_{T+h} - \bar{y} = \varepsilon_{T+h} - \bar{\varepsilon} \;\Rightarrow\; \Var = \sigma^2 + \frac{\sigma^2}{T} = \sigma^2\left(1 + \frac{1}{T}\right)
> **Promedio**: el choque futuro más el error de haber estimado la media con $T$ datos. Los dos son independientes y no dependen de $h$.
= y_{T+h} - (y_T + h\hat{b}) = \textstyle\sum_{j=1}^{h}\varepsilon_{T+j} - h(\hat{b} - b), \qquad \Var(\hat{b}) = \frac{\sigma^2}{T - 1}
> **Deriva**: además de los $h$ choques, la pendiente estimada tiene error, y ese error se multiplica por $h$. $\hat{b}$ es el promedio de $T - 1$ diferencias independientes.
= \Var = h\sigma^2 + h^2\frac{\sigma^2}{T - 1} = \sigma^2\,h\left(1 + \frac{h}{T - 1}\right)
> Los choques futuros no se correlacionan con los pasados, así que las varianzas se suman. El término $h^2$ hace que la banda se abra más rápido que la del ingenuo.
:::
:::

:::guiado Las bandas de 80% y 90% del ingenuo {#guia-ref-intervalos}
| $h$ | $\hat{y}_{T+h \mid T}$ | $\sqrt{h}$ | $\hat{\sigma}_h$ | $1.2816\,\hat{\sigma}_h$ | lo-80 | hi-80 | lo-90 | hi-90 |
|---|---|---|---|---|---|---|---|---|
| 1 | 15 | 1 | 5.141 | 6.588 | 8.412 | 21.588 | 6.544 | 23.456 |
| 2 | 15 | 1.414 | 7.270 | 9.317 | 5.683 | 24.317 | 3.041 | 26.959 |
| 3 | 15 | 1.732 | 8.904 | 11.411 | 3.589 | 26.411 | 0.354 | 29.646 |
| 4 | 15 | 2 | 10.282 | 13.177 | 1.823 | 28.177 | −1.912 | 31.912 |
---
= \hat{\sigma} = 5.141 \;\;\text{(de los residuales del ingenuo)}
> Se reutiliza la desviación que calculamos en [[guia-ref-residuos]].
= \hat{\sigma}_h = 5.141\sqrt{h}:\quad 5.141,\ 7.270,\ 8.904,\ 10.282
> La incertidumbre crece con la raíz del horizonte: a 4 trimestres es el doble que a 1.
@ usa c3[1-4]; da c4[1-4]
= 1.2816 \times \hat{\sigma}_h:\quad 6.588,\ 9.317,\ 11.411,\ 13.177
> El cuantil 0.90 de la normal (deja 10% en cada cola) da la media anchura de la banda de 80%.
@ usa c4[1-4]; da c5[1-4]
= \begin{gathered} h = 1:\ 15 \pm 6.588 = (8.412,\ 21.588) \\ h = 4:\ 15 \pm 13.177 = (1.823,\ 28.177) \end{gathered}
> Banda de 80%: centrada en el pronóstico y simétrica.
@ usa c2[1-4] c5[1-4]; da c6[1-4] c7[1-4]
= 15 \pm 1.6449\,\hat{\sigma}_h:\quad (6.544,\ 23.456),\ \dots,\ (-1.912,\ 31.912)
> Banda de 90%: más ancha, con el cuantil 0.95. A $h = 4$ ya incluye valores negativos, imposibles para una producción: la banda normal no sabe que la serie es positiva.
@ usa c2[1-4] c4[1-4]; da c8[1-4] c9[1-4]
:::

Los mismos números con statsforecast:

```python
chica = pd.DataFrame({"unique_id": "refresco", "ds": pd.date_range("2020-01-01", periods=8, freq="QS"),
                      "y": [10, 14, 8, 12, 13, 17, 9, 15]})
sf_chica = StatsForecast(models=[Naive(), SeasonalNaive(season_length=4), HistoricAverage()], freq="QS")
fc_chica = sf_chica.forecast(df=chica, h=4, level=[80, 90]).set_index("ds")
# statsforecast devuelve float32: se pasa a float64 para redondear limpio
print(fc_chica[["Naive", "Naive-lo-80", "Naive-hi-80", "Naive-lo-90", "Naive-hi-90"]].astype("float64").round(3))
print(fc_chica[["SeasonalNaive", "SeasonalNaive-lo-80", "SeasonalNaive-hi-80", "HistoricAverage-lo-80", "HistoricAverage-hi-80"]].astype("float64").round(3))
```

:::ejemplo Las bandas del estacional y del promedio en la misma serie
**Ingenuo estacional.** Sus residuales son $y_5 - y_1 = 3$, $y_6 - y_2 = 3$, $y_7 - y_3 = 1$ y $y_8 - y_4 = 3$, así que

$$\hat{\sigma} = \sqrt{\frac{9 + 9 + 1 + 9}{8 - 4}} = \sqrt{7} = 2.646$$

En los cuatro trimestres de 2022 ($k = 0$) la media anchura de 80% es $1.2816 \times 2.646 = 3.391$: por ejemplo, $13 \pm 3.391 = (9.609,\ 16.391)$ en el T1. En 2023 ($k = 1$) se multiplica por $\sqrt{2}$: $\pm 4.795$.

**Promedio.** Sus residuales son $y_t - 12.25$ y suman $\sum e_t^2 = 67.5$:

$$\hat{\sigma} = \sqrt{\frac{67.5}{7}} = 3.105, \qquad \hat{\sigma}_h = 3.105\sqrt{1 + \tfrac18} = 3.294, \qquad 12.25 \pm 1.2816(3.294) = (8.029,\ 16.471)$$

El mismo intervalo para todo $h$. Compara: el estacional da bandas **más angostas** que el ingenuo (2.6 contra 5.1 de desviación) porque sus residuales son más chicos. Un mejor modelo también da intervalos más útiles.
:::

:::interactivo w2-ref-intervalos | Las bandas de cada método {#w-ref-intervalos}
Elige la serie, el método, el nivel y el horizonte. La banda clara es la de 95% y la oscura la del nivel que elijas.
@@@
- **Gráfica principal**: los últimos datos del entrenamiento, el pronóstico con sus bandas y los datos reales de la prueba. La lectura cuenta cuántos datos reales quedaron **dentro** de la banda (la cobertura observada) contra la que promete el nivel.
- **Qué buscar**: en AirPassengers, la banda de 80% del estacional solo cubre 3 de los 12 meses de 1960, aunque promete 80%. No es mala suerte: los residuales tienen media 30 (sesgo) y autocorrelación, así que la fórmula no aplica. Con el precio de la acción, la banda del ingenuo sí cumple lo que promete.
- **Vista extra**: el factor $\hat{\sigma}_h/\hat{\sigma}$ de los cuatro métodos contra $h$. El promedio es plano, el ingenuo crece como $\sqrt{h}$, el estacional sube en escalones y la deriva se abre más rápido.
:::

:::cuidado Los intervalos son tan buenos como los residuales
Las fórmulas suponen que los residuales son ruido blanco **normal** con media cero. Si hay autocorrelación o sesgo, la banda es demasiado angosta y su cobertura real queda muy por debajo del nivel nominal (el caso del estacional en AirPassengers). Si los residuales tienen colas pesadas, el 95% cubre menos de 95%. Revisa siempre los residuales [[ref-residuos]] antes de creerle a una banda.
:::

:::duda ¿«Intervalo de 80%» quiere decir que el dato real cae ahí con 80% de probabilidad?
Sí, **si el modelo es correcto**: de cada 10 pronósticos, en promedio 8 datos reales quedan dentro de su banda de 80%. No es un intervalo de confianza para un parámetro (eso es el `[0.025 0.975]` del `summary()` [[summary-coef]]), sino para una observación futura, por eso incluye el choque futuro y siempre es más ancho.
:::

### Evaluar contra las referencias {#ref-evaluar}

La evaluación es la misma que en [[metricas]], con la función `evaluate` de `utilsforecast`. Une el pronóstico con la prueba por `unique_id` y `ds`, y devuelve una fila por métrica y una columna por modelo.

```python
from functools import partial
from utilsforecast.evaluation import evaluate
from utilsforecast.losses import mae, rmse, mape, mase

modelos_ref = ["HistoricAverage", "Naive", "SeasonalNaive", "RWD"]
res_sf = test_df.merge(fcst[["unique_id", "ds"] + modelos_ref], on=["unique_id", "ds"])
res_sf["Aerolinea"] = np.exp(ajuste_def.get_forecast(12).predicted_mean.values)      # SARIMA de aerolínea

ev_sf = evaluate(res_sf, metrics=[mae, rmse, mape, partial(mase, seasonality=12)],
              models=modelos_ref + ["Aerolinea"], train_df=train_df)
ev_sf.loc[ev_sf["metric"] == "mape", modelos_ref + ["Aerolinea"]] *= 100                   # proporción → %
print(ev_sf.drop(columns="unique_id").set_index("metric").round(2))
```

| Modelo | MAE | RMSE | MAPE | MASE |
|---|---|---|---|---|
| Promedio histórico | 213.67 | 226.27 | 43.62% | 7.02 |
| Ingenuo | 76.00 | 102.98 | 14.25% | 2.50 |
| Ingenuo estacional | **47.83** | **50.71** | **9.99%** | **1.57** |
| Deriva | 66.31 | 92.67 | 12.42% | 2.18 |
| SARIMA de aerolínea | 13.26 | 18.59 | 2.90% | 0.44 |

La mejor referencia es el ingenuo estacional, y el modelo de aerolínea reduce su error a menos de la tercera parte. Esa es la frase que justifica el SARIMA en una conclusión [[caso-ap-conclusion]].

:::cuidado `mape` de utilsforecast devuelve una proporción
Igual que en scikit-learn [[metricas-python]], `utilsforecast.losses.mape` devuelve 0.0999, no 9.99. Por eso se multiplica por 100 la fila de `mape`. Y `mase` necesita el argumento `seasonality` (con `functools.partial`) y el `train_df` para calcular la escala; sin ellos lanza `TypeError`.
:::

Un solo año de prueba puede engañar. La validación con origen móvil [[rolling-origin]] se hace en statsforecast con `cross_validation`: `n_windows` cortes, cada uno con `h` periodos de prueba, separados `step_size` periodos.

```python
cv_sf = sf.cross_validation(df=df_ap, h=12, n_windows=3, step_size=12)
print(cv_sf.columns.tolist())
err_cv = cv_sf[modelos_ref].sub(cv_sf["y"], axis=0).abs()          # |y − ŷ| de cada modelo
err_cv["cutoff"] = cv_sf["cutoff"]
mae_cv = err_cv.groupby("cutoff").mean()                  # MAE de cada ventana
print(mae_cv.round(2))
print("Promedio de las 3 ventanas:\n", mae_cv.mean().round(2).to_string())
```

:::interactivo w2-ref-cv | Validación cruzada de las referencias {#w-ref-cv}
Reproduce `cross_validation(df, h, n_windows, step_size)` con los cuatro métodos.
@@@
- **Arriba**: la serie con cada ventana de prueba sombreada y su corte (`cutoff`) marcado. Los pronósticos de la ventana elegida se dibujan encima.
- **Abajo**: el MAE de cada método en cada ventana y su promedio. Un método que gana en promedio puede perder en alguna ventana.
- Con `step_size` menor que `h` las ventanas se **traslapan**: los mismos meses se evalúan desde varios cortes.
- **Vista extra**: la tabla del MAE por ventana, como la que imprime el código de arriba.
:::

:::duda Una sola partición 80/20, ¿está mal?
No está mal: es la validación con **una sola** partición, respetando el orden [[particion]]. Su problema es que el resultado depende de qué pasó en ese 20% (en AirPassengers, la ventana de 1958 favorece mucho al estacional y la de 1959 no tanto). La validación cruzada con origen móvil promedia varios cortes y da una estimación más estable del error esperado. Si el examen pide 80/20, hazlo así; si pide comparar modelos con más rigor, agrega `cross_validation`.
:::

:::resumen Lo que debes llevarte de los modelos de referencia
- Promedio $\bar{y}$, ingenuo $y_T$, estacional $y_{T+h-m(k+1)}$ y deriva $y_T + h(y_T - y_1)/(T-1)$. Son los ARIMA(0,0,0)+c, (0,1,0), (0,0,0)(0,1,0)$_m$ y (0,1,0)+c.
- La deriva es la recta entre el primer dato y el último; la media de los residuales del ingenuo es $b$.
- Bandas: $\hat{y} \pm c\,\hat{\sigma}_h$ con $\hat{\sigma}_h$ constante (promedio), $\propto\sqrt{h}$ (ingenuo), en escalones (estacional) o más rápido (deriva). Solo son confiables si los residuales son ruido blanco normal.
- statsforecast: formato largo `unique_id, ds, y`; `StatsForecast(models, freq)`; `forecast(df, h, level, fitted=True)`; `forecast_fitted_values()`; `cross_validation(df, h, n_windows, step_size)`. La deriva sale en la columna `RWD`.
- `freq` debe coincidir con las fechas (`"MS"` contra `"ME"`), y `mape` de utilsforecast devuelve una proporción.
- Todo modelo se compara contra la **mejor** referencia; si no le gana, no sirve.
:::
