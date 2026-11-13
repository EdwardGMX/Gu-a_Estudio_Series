## 🧱 Pronósticos de referencia (benchmarks) {#referencia}
@mapa Antes de cualquier modelo: pronosticar, partir los datos y medir el error con MAE y RMSE; los cuatro métodos básicos y tres más (ventanas y suavizamiento exponencial), statsforecast, residuales, intervalos, referencias con logaritmo y descomposición, cómo elegir la referencia y los errores más frecuentes.

### Por qué empezar por lo más simple {#ref-por-que}

Antes de escribir una sola ecuación AR o MA hay que saber **cuánto vale pronosticar sin pensar**. Los pronósticos de referencia (*benchmarks* o *baselines*) son reglas tan simples que se calculan con una línea: repetir el promedio, repetir el último dato, repetir el mismo mes del año pasado o seguir la recta entre el primer dato y el último. Se usan para cuatro cosas:

1. **Poner la vara.** Todos los modelos de esta unidad (AR, MA, ARMA, ARIMA, SARIMA) se van a comparar contra la **mejor** referencia. Un modelo complicado solo vale la pena si le gana. Si tu SARIMA se equivoca en promedio 50 pasajeros y copiar el año pasado se equivoca 48, el SARIMA no aporta nada.
2. **Detectar errores.** Si un modelo pierde contra el ingenuo, casi siempre hay algo mal: la transformación, el orden de diferenciación, el periodo estacional o una fuga de información.
3. **Dar sentido a los números.** Un error de 30 no dice nada por sí solo. «30, cuando la mejor referencia se equivoca 48» sí: es un 37% menos de error. Más adelante, el MASE convierte esa comparación en una métrica [[metricas-def]].
4. **Practicar el flujo completo.** Partir los datos, ajustar, pronosticar, calcular residuales, construir intervalos y evaluar es igual para un método de una línea que para un SARIMAX. Esta sección hace todo el flujo con la librería `statsforecast`, y el resto de la unidad lo repite con modelos cada vez más ricos.

:::intuicion Otra forma de verlo: la regla de dedo del médico
Piensa en un médico que estrena un aparato de diagnóstico carísimo. Lo primero que pregunta es si acierta **más que la regla de dedo** que ya usaba. Los pronósticos de referencia son esa regla de dedo. Si el aparato no le gana, no importa lo sofisticado que sea.
:::

### Pronosticar y medir el error {#ref-pronosticar}

:::definicion Notación del pronóstico
- $y_1, \dots, y_T$ son los datos **observados** que se usan para pronosticar; $T$ es el **origen** del pronóstico.
- $\tip{h-pron}{h}$ es el **horizonte**: cuántos periodos adelante se pronostica ($h = 1$ es el siguiente).
- $\hat{y}_{T+h \mid T}$ se lee «el pronóstico de $y_{T+h}$ hecho con la información hasta $T$».
- $\tip{m-est}{m}$ es el **periodo estacional**: 12 en datos mensuales, 4 en trimestrales, 7 en diarios con patrón semanal.
:::

Para saber si un pronóstico es bueno hay que compararlo con datos que **no vio**. La forma más simple es la **partición temporal**: los primeros datos son el **entrenamiento** (con ellos se calcula el pronóstico) y los últimos son la **prueba** (con ellos se mide el error). La partición se hace siempre **en orden**, nunca al azar: en la vida real el futuro no se conoce cuando se pronostica [[particion]].

:::definicion El error de pronóstico y dos métricas básicas
En el periodo de prueba, con $n$ datos reales $y_t$ y sus pronósticos $\hat{y}_t$, el **error** es $e_t = y_t - \hat{y}_t$ (positivo si el pronóstico se quedó corto). Las dos métricas que usaremos desde ya son

$$\tip{MAE}{\mathrm{MAE}} = \frac1n\sum_{t}\lvert y_t - \hat{y}_t\rvert, \qquad \tip{RMSE}{\mathrm{RMSE}} = \sqrt{\frac1n\sum_{t}(y_t - \hat{y}_t)^2}$$

- **MAE**: cuántas unidades se equivoca el pronóstico en promedio. Es la más fácil de explicar.
- **RMSE**: también en las unidades de la serie, pero castiga más los errores grandes (un error de 10 pesa como cien errores de 1). Siempre $\mathrm{RMSE} \ge \mathrm{MAE}$.

Las dos dependen de la escala: sirven para comparar métodos **en la misma serie**. Las métricas porcentuales y escaladas (MAPE, sMAPE, MASE) se estudian al final de la unidad [[metricas]].
:::

### Los cuatro métodos básicos {#ref-metodos}

Llamamos $y_1, \dots, y_T$ a los datos de entrenamiento, $h$ al horizonte y $m$ al periodo estacional.

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

| Método | Clase en statsforecast | Columna que produce | Gana cuando la serie… | Cuando $h$ crece, el pronóstico… |
|---|---|---|---|---|
| Promedio histórico | `HistoricAverage()` | `HistoricAverage` | oscila alrededor de un nivel fijo | es una línea horizontal en $\bar{y}$ |
| Ingenuo | `Naive()` | `Naive` | es un paseo aleatorio (precios, tipos de cambio) | es una línea horizontal en $y_T$ |
| Ingenuo estacional | `SeasonalNaive(season_length=m)` | `SeasonalNaive` | tiene una estacionalidad fuerte y estable | repite la última temporada una y otra vez |
| Deriva | `RandomWalkWithDrift()` | `RWD` | sube o baja de forma persistente | es una recta con pendiente $b$ que nunca se detiene |

Cada método **supone** algo sobre el futuro: que no hay memoria (promedio), que solo importa el presente (ingenuo), que el patrón se repite (estacional) o que el crecimiento sigue (deriva). Elegir una referencia es elegir una suposición, y la gráfica de la serie suele decir cuál es razonable [[u1:patrones]].

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

### Evaluar a mano: ¿cuál le atinó a 2022? {#guia-ref-eval-sec}

Al terminar 2022 se conocen los datos reales: **14, 18, 10 y 16**. Son la prueba de los cuatro pronósticos.

:::guiado El MAE y el RMSE de los cuatro métodos {#guia-ref-eval}
| $h$ | Trimestre | $y$ real | $e$ promedio | $e$ ingenuo | $e$ estacional | $e$ deriva |
|---|---|---|---|---|---|---|
| 1 | 2022-T1 | 14 | 1.75 | −1 | 1 | −1.714 |
| 2 | 2022-T2 | 18 | 5.75 | 3 | 1 | 1.571 |
| 3 | 2022-T3 | 10 | −2.25 | −5 | 1 | −7.143 |
| 4 | 2022-T4 | 16 | 3.75 | 1 | 1 | −1.857 |
| MAE | | | 3.375 | 2.5 | 1 | 3.071 |
| RMSE | | | 3.717 | 3 | 1 | 3.869 |
---
= e = y - 12.25:\quad 1.75,\ 5.75,\ -2.25,\ 3.75
> Errores del promedio: real menos pronóstico. Positivo quiere decir que el pronóstico se quedó corto.
@ usa c3[1-4]; da c4[1-4]
= \mathrm{MAE} = \frac{1.75 + 5.75 + 2.25 + 3.75}{4} = \frac{13.5}{4} = 3.375
> El MAE promedia los errores **sin signo**: si se promediaran con signo, el $-2.25$ cancelaría parte de los demás y el error parecería menor de lo que es.
@ usa c4[1-4]; da c4[5]
= \mathrm{RMSE} = \sqrt{\frac{3.0625 + 33.0625 + 5.0625 + 14.0625}{4}} = \sqrt{13.8125} = 3.717
> El RMSE eleva al cuadrado antes de promediar: el error de 5.75 del T2 aporta 33 de los 55 de la suma.
@ usa c4[1-4]; da c4[6]
= \begin{gathered} \text{ingenuo: } e = y - 15 = -1,\ 3,\ -5,\ 1 \\ \mathrm{MAE} = \tfrac{10}{4} = 2.5, \quad \mathrm{RMSE} = \sqrt{\tfrac{1 + 9 + 25 + 1}{4}} = \sqrt{9} = 3 \end{gathered}
> El ingenuo acierta en promedio más que el promedio histórico porque 2021 ya estaba más alto que 2020.
@ usa c3[1-4]; da c5[1-6]
= \text{estacional: } e = 14 - 13,\ 18 - 17,\ 10 - 9,\ 16 - 15 = 1,\ 1,\ 1,\ 1 \;\Rightarrow\; \mathrm{MAE} = \mathrm{RMSE} = 1
> El ingenuo estacional copia la forma exacta del año y solo se queda 1 unidad corto en cada trimestre. Es, por mucho, la mejor referencia: la vara que un modelo tendría que superar en esta serie.
@ usa c3[1-4]; da c6[1-6]
= \begin{gathered} \text{deriva: } e = -1.714,\ 1.571,\ -7.143,\ -1.857 \\ \mathrm{MAE} = \tfrac{12.286}{4} = 3.071, \quad \mathrm{RMSE} = \sqrt{\tfrac{59.878}{4}} = 3.869 \end{gathered}
> La deriva comete el error más grande de todos en el T3 (pronostica una subida justo en el trimestre bajo).
@ usa c3[1-4]; da c7[1-6]
= \text{MAE: } 1 < 2.5 < 3.071 < 3.375, \qquad \text{RMSE: } 1 < 3 < 3.717 < 3.869
> **Las dos métricas no ordenan igual**: por MAE la deriva le gana al promedio, pero por RMSE pierde, porque su único error grande ($-7.143$) pesa mucho al elevarlo al cuadrado. Por eso hay que decidir de antemano qué métrica manda.
@ usa c4[5-6] c5[5-6] c6[5-6] c7[5-6]
:::

Lo mismo en Python, con numpy:

```python
real_22 = np.array([14, 18, 10, 16])
pron_22 = {"Promedio": np.full(4, 12.25), "Ingenuo": np.full(4, 15.0),
           "Estacional": np.array([13, 17, 9, 15.0]), "Deriva": 15 + (5 / 7) * np.arange(1, 5)}
for nombre, p in pron_22.items():
    e = real_22 - p
    print(f"{nombre:10s} errores = {np.round(e, 3)} | MAE = {np.mean(np.abs(e)):.3f} | RMSE = {np.sqrt(np.mean(e ** 2)):.3f}")
```

:::interactivo w2-ref-metodos | Los cuatro métodos sobre cinco series {#w-ref-metodos}
Elige una serie y cuántos periodos dejar para la prueba. Las cuatro reglas se calculan con el entrenamiento y se comparan con los datos reales que no vieron.
@@@
- **Gráfica**: el entrenamiento (línea oscura), la prueba (puntos verdes) y los cuatro pronósticos. El método que elijas en «Resaltar» se dibuja más grueso.
- **Lectura**: MAE y RMSE de cada método en la prueba (la tabla también trae el MAPE y el MASE, que se estudian en [[metricas]]). El ganador aparece en verde.
- **Qué buscar**: cada serie tiene «su» ganador. El precio de la acción favorece al ingenuo, la serie trimestral al estacional, la serie con tendencia a la deriva y las ventas estables al promedio. En AirPassengers, que tiene tendencia **y** estacionalidad, ninguno es bueno: gana el estacional, pero se queda corto porque no sube.
- **Vista extra**: la tabla de los primeros pronósticos de cada método, como la devuelve `sf.forecast()`.
:::

:::ejemplo Qué referencia gana en cada tipo de serie
En la **producción trimestral** de la gráfica de arriba (40 trimestres, los últimos 8 para probar), el ingenuo estacional tiene un MAE de 3.02 contra 11.53 del ingenuo, 10.61 del promedio y 11.22 de la deriva. El error es casi **cuatro veces menor** porque la serie tiene una estacionalidad trimestral marcada que los otros tres no pueden ver.

La regla general:

| Si la serie… | La referencia natural es… | Porque… |
|---|---|---|
| oscila alrededor de un nivel fijo | el promedio | el mejor pronóstico de un ruido es su media |
| se mueve como un paseo aleatorio | el ingenuo | lo mejor que se sabe del futuro es el presente [[u1:paseo]] |
| tiene un patrón estacional estable | el ingenuo estacional | el mismo mes del año pasado ya trae el patrón |
| tiene tendencia persistente | la deriva | prolonga el crecimiento promedio |
| tiene tendencia **y** estacionalidad | ninguna de las cuatro basta | se necesita una referencia compuesta [[ref-transformadas]] o un modelo SARIMA |
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

# 2. Los cuatro modelos y la frecuencia mensual (fecha al inicio del mes)
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

### Más referencias: ventanas y suavizamiento exponencial {#ref-ventanas}

Los cuatro métodos básicos son extremos: el promedio le da **el mismo peso a todos** los datos y el ingenuo le da **todo el peso al último**. Hay tres referencias intermedias, también en statsforecast, que viven entre esos dos extremos.

:::definicion Promedio de ventana, promedio estacional de ventana y suavizamiento exponencial simple
- **Promedio de ventana** (`WindowAverage(window_size=k)`): la media de los últimos $\tip{k-ven}{k}$ datos.
$$\hat{y}_{T+h \mid T} = \frac{1}{k}\sum_{j=0}^{k-1} y_{T-j}$$
- **Promedio estacional de ventana** (`SeasonalWindowAverage(season_length=m, window_size=k)`): para cada periodo de la temporada, la media de ese mismo periodo en las últimas $k$ temporadas.
$$\hat{y}_{T+h \mid T} = \frac{1}{k}\sum_{j=0}^{k-1} y_{T+h-m(j+1)} \qquad (h \le m)$$
- **Suavizamiento exponencial simple** (`SimpleExponentialSmoothing(alpha=α)`): un **nivel** que se actualiza con cada dato nuevo, y el pronóstico es el último nivel.
$$\tip{ell-nivel}{\ell_t} = \tip{alpha-ses}{\alpha}\,y_t + (1 - \alpha)\,\ell_{t-1}, \qquad \ell_1 = y_1, \qquad \hat{y}_{T+h \mid T} = \ell_T$$

Los tres dan pronósticos **planos** (o una temporada repetida, en el estacional): no proyectan tendencia. `SimpleExponentialSmoothingOptimized()` elige $\alpha$ solo, minimizando la suma de errores al cuadrado a un paso dentro del entrenamiento.
:::

:::demo El suavizamiento exponencial es un promedio con pesos que decaen {#demo-ref-ses-pesos}
:::pasos
= \ell_T = \alpha\,y_T + (1 - \alpha)\,\ell_{T-1}
> La regla de actualización en el último periodo.
= \ell_T = \alpha\,y_T + (1 - \alpha)\left[\alpha\,y_{T-1} + (1 - \alpha)\,\ell_{T-2}\right] = \alpha\,y_T + \alpha(1 - \alpha)\,y_{T-1} + (1 - \alpha)^2\,\ell_{T-2}
> Sustituimos $\ell_{T-1}$ por su propia regla.
= \ell_T = \sum_{j=0}^{T-2} \alpha(1 - \alpha)^{j}\,y_{T-j} \;+\; (1 - \alpha)^{T-1}\,y_1
> Repitiendo hasta llegar a $\ell_1 = y_1$: el dato de hace $j$ periodos pesa $\alpha(1 - \alpha)^j$. Los pesos decaen **geométricamente**, de ahí el nombre «exponencial».
= \sum_{j=0}^{T-2} \alpha(1 - \alpha)^{j} + (1 - \alpha)^{T-1} = \alpha\,\frac{1 - (1 - \alpha)^{T-1}}{1 - (1 - \alpha)} + (1 - \alpha)^{T-1} = 1
> Serie geométrica finita [[u1:geo-suma]]: los pesos suman exactamente 1, así que el pronóstico es un **promedio ponderado** de los datos.
:::
Con $\alpha$ cerca de 1 casi todo el peso cae en el último dato (se parece al ingenuo); con $\alpha$ chico el peso se reparte entre muchos datos y el pronóstico se suaviza.
:::

:::demo La familia: los métodos se convierten unos en otros {#demo-ref-familia}
:::pasos
= k = 1:\quad \frac{1}{1}\,y_T = y_T \;=\; \text{ingenuo}
> Un promedio de ventana de un solo dato es el último dato.
= k = T:\quad \frac{1}{T}\sum_{t=1}^{T} y_t = \bar{y} \;=\; \text{promedio histórico}
> Con la ventana del tamaño de toda la muestra se recupera el promedio.
= \text{estacional con } k = 1:\quad y_{T+h-m} \;=\; \text{ingenuo estacional}\ (h \le m)
> El promedio estacional de una sola temporada es copiar la última temporada.
= \alpha = 1:\quad \ell_t = y_t \;\Rightarrow\; \hat{y}_{T+h \mid T} = y_T \;=\; \text{ingenuo}
> El suavizamiento sin memoria es el ingenuo.
= \alpha \to 0:\quad \ell_t = \ell_{t-1} = \dots = \ell_1 = y_1
> ⚠️ Con $\alpha$ muy chico **no** se obtiene el promedio, sino el primer dato: el nivel casi no se mueve desde su valor inicial. Es una diferencia con el promedio de ventana.
:::
El tamaño de ventana $k$ y la constante $\alpha$ son la misma perilla: cuánta memoria tiene el pronóstico. Un promedio de ventana de tamaño $k$ y un suavizamiento con $\alpha \approx 2/(k + 1)$ le dan al pasado una «edad promedio» parecida.
:::

:::guiado Suavizamiento exponencial con α = 0.5 en la producción de refresco {#guia-ref-ses}
| $t$ | $y_t$ | $\ell_t$ | $\hat{y}_{t \mid t-1} = \ell_{t-1}$ | peso de $y_t$ en $\ell_8$ |
|---|---|---|---|---|
| 1 | 10 | | | |
| 2 | 14 | | | |
| 3 | 8 | | | |
| 4 | 12 | | | |
| 5 | 13 | | | |
| 6 | 17 | | | |
| 7 | 9 | | | |
| 8 | 15 | | | |
| 9 (2022) | ? | | | |
---
= \ell_1 = y_1 = 10
> statsforecast arranca el nivel en el primer dato. Por eso el primer ajustado no existe (`NaN`).
@ usa c2[1]; da c3[1]
= \ell_2 = 0.5(14) + 0.5(10) = 12, \qquad \ell_3 = 0.5(8) + 0.5(12) = 10
> Cada nivel es el promedio del dato nuevo y el nivel anterior (porque $\alpha = 0.5$).
@ usa c2[2-3] c3[1]; da c3[2-3]
= \ell_4 = 11,\ \ \ell_5 = 12,\ \ \ell_6 = 14.5,\ \ \ell_7 = 11.75,\ \ \ell_8 = 0.5(15) + 0.5(11.75) = 13.375
> Se repite la regla hasta el último dato. El nivel sube con el T2 alto (17) y baja con el T3 bajo (9): persigue la estacionalidad con retraso.
@ usa c2[4-8] c3[3-7]; da c3[4-8]
= \hat{y}_{t \mid t-1} = \ell_{t-1}:\quad 10,\ 12,\ 10,\ 11,\ 12,\ 14.5,\ 11.75
> El ajustado a un paso es el nivel del periodo anterior. Son los valores que devuelve `forecast_fitted_values()`.
@ usa c3[1-7]; da c4[2-8]
= \hat{y}_{T+h \mid T} = \ell_8 = 13.375 \quad (h = 1, 2, 3, 4)
> El pronóstico es plano: el mismo valor para todo 2022.
@ usa c3[8]; da c4[9]
= \begin{gathered} 0.5,\ 0.25,\ 0.125,\ 0.0625,\ 0.03125,\ 0.015625,\ 0.0078125 \ \ (y_8, \dots, y_2) \\ (1 - 0.5)^{7} = 0.0078125 \ \ (y_1) \end{gathered}
> Los pesos de [[demo-ref-ses-pesos]]: el último dato pesa la mitad, el penúltimo la cuarta parte… Comprobación: $0.5(15) + 0.25(9) + 0.125(17) + \dots + 0.0078125(10) = 13.375$.
@ usa c3[8]; da c5[1-8]
:::

:::ejemplo Los tres métodos nuevos contra la prueba de 2022
Con los mismos 8 trimestres y la prueba real $14, 18, 10, 16$:

- **Promedio de ventana**, $k = 4$: $(13 + 17 + 9 + 15)/4 = 13.5$ en los cuatro trimestres. Errores $0.5,\ 4.5,\ -3.5,\ 2.5$ → **MAE = 2.75**.
- **Promedio estacional de ventana**, $k = 2$: T1 $= (10 + 13)/2 = 11.5$, T2 $= (14 + 17)/2 = 15.5$, T3 $= (8 + 9)/2 = 8.5$, T4 $= (12 + 15)/2 = 13.5$. Errores $2.5,\ 2.5,\ 1.5,\ 2.5$ → **MAE = 2.25**.
- **Suavizamiento exponencial**, $\alpha = 0.5$: $13.375$ plano. Errores $0.625,\ 4.625,\ -3.375,\ 2.625$ → **MAE = 2.81**.

Los tres le ganan al promedio histórico (3.375) y ninguno al ingenuo estacional (1.0). El promedio estacional de ventana tiene la forma correcta, pero **promediar con 2020 lo jala hacia abajo**: la serie creció entre 2020 y 2021, y una ventana más larga mezcla niveles viejos. Promediar ayuda cuando el patrón es estable y ruidoso; estorba cuando el nivel cambia.
:::

```python
from statsforecast.models import WindowAverage, SeasonalWindowAverage, SimpleExponentialSmoothing, SimpleExponentialSmoothingOptimized

chica = pd.DataFrame({"unique_id": "refresco", "ds": pd.date_range("2020-01-01", periods=8, freq="QS"),
                      "y": [10, 14, 8, 12, 13, 17, 9, 15.0]})
sf_v = StatsForecast(models=[WindowAverage(window_size=4), SeasonalWindowAverage(season_length=4, window_size=2),
                             SimpleExponentialSmoothing(alpha=0.5), SimpleExponentialSmoothingOptimized()], freq="QS")
fc_v = sf_v.forecast(df=chica, h=4)
print(fc_v.drop(columns="unique_id").set_index("ds").astype("float64").round(3))

sf_v.fit(chica)
print("α elegido por SESOpt:", round(sf_v.fitted_[0, 3].model_["alpha"], 4))
```

El suavizamiento optimizado elige $\alpha = 0.21$: mucha memoria, porque con una estacionalidad tan marcada el último dato es un mal resumen del nivel. Es otra señal de que en esta serie manda el patrón estacional.

:::cuidado Estos tres métodos no dan ajustados ni intervalos con `level`
En statsforecast 2.x, `WindowAverage` y `SeasonalWindowAverage` lanzan `NotImplementedError: return fitted` si pides `fitted=True`, y ninguno de los tres acepta `level=[80]` por sí solo: lanzan `You must pass prediction_intervals to compute them`. Si los mezclas con los cuatro básicos en un mismo `StatsForecast` con `fitted=True` o `level`, falla **todo** el pronóstico. Úsalos en un objeto aparte, o pide intervalos **conformales** (calculados con los errores de validación cruzada, sin suponer normalidad):

`SimpleExponentialSmoothing(alpha=0.5, prediction_intervals=ConformalIntervals(h=12, n_windows=3))`, con `from statsforecast.utils import ConformalIntervals`.
:::

En AirPassengers (prueba 1960), los tres métodos nuevos tampoco alcanzan al ingenuo estacional:

```python
sf_v_ap = StatsForecast(models=[WindowAverage(window_size=12), SeasonalWindowAverage(season_length=12, window_size=3),
                                SimpleExponentialSmoothingOptimized()], freq="MS")
fc_v_ap = sf_v_ap.forecast(df=train_df, h=12)
real_60 = test_df["y"].values
for col in ["WindowAverage", "SeasWA", "SESOpt"]:
    e = real_60 - fc_v_ap[col].values.astype("float64")
    print(f"{col:14s} MAE = {np.mean(np.abs(e)):6.2f} | RMSE = {np.sqrt(np.mean(e ** 2)):6.2f}")
```

Ojo con los nombres de las columnas: `SeasonalWindowAverage` produce **`SeasWA`** y `SimpleExponentialSmoothingOptimized` produce **`SESOpt`** (y `SimpleExponentialSmoothing`, `SES`). El promedio estacional de tres años (MAE 83.6) es incluso **peor** que copiar el último año (47.8): en una serie que crece 10% al año, promediar años viejos subestima el nivel.

:::interactivo w2-ref-ventanas | Ventanas y suavizamiento: la perilla de la memoria {#w-ref-ventanas}
Elige la serie, el método y su parámetro ($k$ o $\alpha$). Se compara contra los cuatro básicos en la misma prueba.
@@@
- **Arriba**: el entrenamiento, la prueba y el pronóstico del método elegido. La línea punteada es el ingenuo estacional, para comparar.
- **Abajo**: el MAE en la prueba para **todos** los valores del parámetro, con el valor actual marcado. Las líneas horizontales son el MAE de los cuatro básicos.
- **Qué buscar**: con $k = 1$ o $\alpha = 1$ la curva toca el MAE del ingenuo; con $k = T$, el del promedio. En las ventas estables, una ventana grande es mejor; en el precio de la acción, la mejor memoria es casi ninguna.
- **Vista extra**: los pesos que recibe cada dato pasado en el pronóstico (barras): parejos en la ventana, geométricos en el suavizamiento.
:::

### Valores ajustados y residuales {#ref-residuos}

:::definicion Ajustados y residuales de cada método
El **valor ajustado** $\hat{y}_t$ es lo que el método habría pronosticado para $t$ con los datos hasta $t - 1$ (un paso adelante), y el **residual** es $\tip{e-res}{e_t} = y_t - \hat{y}_t$: lo que el método no explicó dentro del entrenamiento. Los errores de la prueba miden qué tan bien pronostica; los residuales dicen **si todavía queda algo que aprovechar**.

| Método | Ajustado $\hat{y}_t$ | Primeros residuales que faltan |
|---|---|---|
| Promedio | $\bar{y}$ (la media de **toda** la muestra) | ninguno |
| Ingenuo | $y_{t-1}$ | 1 (el primer dato no tiene anterior) |
| Ingenuo estacional | $y_{t-m}$ | $m$ (el primer año no tiene año anterior) |
| Deriva | $y_{t-1} + b$ | 1 |
| Suavizamiento exponencial | $\ell_{t-1}$ | 1 |

En `sf.forecast_fitted_values()` los residuales que faltan aparecen como `NaN`; hay que quitarlos con `.dropna()` antes de cualquier prueba estadística.
:::

:::cuidado Los ajustados del promedio no son pronósticos honestos
Para un pronóstico verdadero a un paso, en $t$ solo deberías usar $y_1, \dots, y_{t-1}$. El promedio histórico usa la media de **toda** la muestra en todos los periodos, incluido el futuro de cada $t$. Por eso sus residuales suman exactamente cero, y por eso el error dentro de la muestra subestima el error real. Lo mismo pasa con la pendiente $b$ de la deriva, que se calcula con el último dato. En la práctica no importa mucho porque son uno o dos parámetros, pero es la razón de evaluar siempre con datos que el método no vio.
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

Los residuales de un buen pronóstico deben parecerse a **ruido blanco** [[u1:ruido-blanco]]:

1. **No estar correlacionados** (la prueba de Ljung–Box no rechaza [[u1:lb-h]]). Si lo están, queda información útil sin usar.
2. **Tener media cero.** Si no, el pronóstico está sesgado y basta con sumarle la media para mejorarlo.
3. *Deseable:* **varianza constante**, para que los intervalos tengan el mismo ancho a lo largo del tiempo.
4. *Deseable:* **distribución normal**, para que los intervalos con $\pm 1.28$, $\pm 1.96$ tengan la cobertura que prometen.

Las dos primeras son obligatorias: si fallan, se puede mejorar el pronóstico. Las otras dos solo afectan a los intervalos. Son las mismas cuatro condiciones que se revisarán en los residuos de cada modelo ARIMA [[residuos-que]].

```python
from statsmodels.stats.diagnostic import acorr_ljungbox

ajustados = sf.forecast_fitted_values()
for nombre in ["HistoricAverage", "Naive", "SeasonalNaive", "RWD"]:
    e_ref = (ajustados["y"] - ajustados[nombre]).dropna()      # quita los NaN iniciales
    lb_ref = acorr_ljungbox(e_ref, lags=[24])                 # 2 años de rezagos
    print(f"{nombre:16s} n = {len(e_ref):3d} | media = {e_ref.mean():7.3f} | desv = {e_ref.std():7.3f} | "
          f"Ljung–Box(24) p = {lb_ref['lb_pvalue'].iloc[0]:.1e}")
```

Ninguna referencia deja residuales de ruido blanco en AirPassengers: todas rechazan Ljung–Box con p-values astronómicamente pequeños. Es la prueba de que hay estructura que un modelo puede aprovechar. Esa es exactamente la motivación de los modelos que vienen: el AR, el MA y el SARIMA existen para **capturar la autocorrelación que las referencias dejan en los residuales**.

:::interactivo w2-ref-residuos | Diagnóstico de los residuales de cada referencia {#w-ref-residuos}
Elige la serie y el método. Los residuales se calculan sobre el entrenamiento (en AirPassengers, 1949–1959) como en `forecast_fitted_values()`, sin los `NaN` iniciales, y se revisan las cuatro propiedades.
@@@
- **Arriba**: los residuales en el tiempo con su media (línea rosa punteada). Si la media se separa del cero, el pronóstico está sesgado.
- **Abajo a la izquierda**: el histograma con la normal de la misma media y varianza.
- **Abajo a la derecha**: la ACF con la banda $\pm 1.96/\sqrt n$. La lectura da Ljung–Box con $h = 2m$ (o 10 si no hay estacionalidad) y una lista de ✓ y ✗ con las cuatro propiedades.
- **Qué buscar**: con el precio de la acción, los residuales del ingenuo son ruido blanco (es el método correcto). Con AirPassengers ninguno lo es. Con el promedio en una serie con tendencia, la ACF de los residuales decae lentísimo: los residuales **son** la serie centrada.
- **Vista extra**: la media de los residuales de los cuatro métodos junto a la pendiente $b$, para comprobar [[demo-ref-media-res]] con cualquier serie.
:::

:::duda ¿Cuántos rezagos uso en Ljung–Box para una referencia?
Una regla práctica es $2m$ para datos estacionales (24 en mensuales) y 10 si no hay estacionalidad. Las referencias casi no estiman nada (el ingenuo y el estacional, cero parámetros; el promedio y la deriva, uno), así que no hace falta corregir los grados de libertad. Lo importante es **no aplicar la prueba sobre los `NaN` iniciales**: `acorr_ljungbox` con un `NaN` devuelve `NaN`.
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
> **Ingenuo**: si la serie es un paseo aleatorio $y_t = y_{t-1} + \varepsilon_t$ [[u1:paseo]], el error a $h$ pasos acumula $h$ choques independientes, y las varianzas de variables independientes se suman.
= \begin{gathered} y_{T+h} - y_{T+h-m(k+1)} = \varepsilon_{T+h} + \varepsilon_{T+h-m} + \dots \;(k + 1 \text{ choques}) \\ \Rightarrow\; \Var = (k + 1)\,\sigma^2 \end{gathered}
> **Estacional**: cada mes es un paseo aleatorio que avanza una vez por año. En el primer año falta un choque ($k = 0$); en el segundo, dos.
= y_{T+h} - \bar{y} = \varepsilon_{T+h} - \bar{\varepsilon} \;\Rightarrow\; \Var = \sigma^2 + \frac{\sigma^2}{T} = \sigma^2\left(1 + \frac{1}{T}\right)
> **Promedio**: el choque futuro más el error de haber estimado la media con $T$ datos. Los dos son independientes y no dependen de $h$.
= y_{T+h} - (y_T + h\hat{b}) = \textstyle\sum_{j=1}^{h}\varepsilon_{T+j} - h(\hat{b} - b), \qquad \Var(\hat{b}) = \frac{\sigma^2}{T - 1}
> **Deriva**: además de los $h$ choques, la pendiente estimada tiene error, y ese error se multiplica por $h$. $\hat{b}$ es el promedio de $T - 1$ diferencias independientes.
= \Var = h\sigma^2 + h^2\frac{\sigma^2}{T - 1} = \sigma^2\,h\left(1 + \frac{h}{T - 1}\right)
> Los choques futuros no se correlacionan con los pasados, así que las varianzas se suman. El término $h^2$ hace que la banda se abra más rápido que la del ingenuo.
:::
Cuando lleguemos a ARIMA, estas cuatro fórmulas aparecerán como casos particulares de una sola regla con los pesos $\psi$ [[intervalos-psi]].
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
> Banda de 90%: más ancha, con el cuantil 0.95. A $h = 4$ ya incluye valores negativos, imposibles para una producción: la banda normal no sabe que la serie es positiva (el logaritmo lo arregla [[ref-transformadas]]).
@ usa c2[1-4] c4[1-4]; da c8[1-4] c9[1-4]
:::

Los mismos números con statsforecast:

```python
sf_chica = StatsForecast(models=[Naive(), SeasonalNaive(season_length=4), HistoricAverage()], freq="QS")
fc_chica = sf_chica.forecast(df=chica, h=4, level=[80, 90]).set_index("ds")
# statsforecast devuelve float32: se pasa a float64 para redondear limpio
print(fc_chica[["Naive", "Naive-lo-80", "Naive-hi-80", "Naive-lo-90", "Naive-hi-90"]].astype("float64").round(3))
print(fc_chica[["SeasonalNaive", "SeasonalNaive-lo-80", "SeasonalNaive-hi-80"]].astype("float64").round(3))
print(fc_chica[["HistoricAverage", "HistoricAverage-lo-80", "HistoricAverage-hi-80"]].astype("float64").round(3))
```

:::ejemplo Las bandas del estacional y del promedio en la misma serie
**Ingenuo estacional.** Sus residuales son $y_5 - y_1 = 3$, $y_6 - y_2 = 3$, $y_7 - y_3 = 1$ y $y_8 - y_4 = 3$, así que

$$\hat{\sigma} = \sqrt{\frac{9 + 9 + 1 + 9}{8 - 4}} = \sqrt{7} = 2.646$$

En los cuatro trimestres de 2022 ($k = 0$) la media anchura de 80% es $1.2816 \times 2.646 = 3.391$: por ejemplo, $13 \pm 3.391 = (9.609,\ 16.391)$ en el T1. En 2023 ($k = 1$) se multiplica por $\sqrt{2}$: $\pm 4.795$.

**Promedio.** Sus residuales son $y_t - 12.25$ y suman $\sum e_t^2 = 67.5$:

$$\hat{\sigma} = \sqrt{\frac{67.5}{7}} = 3.105, \qquad \hat{\sigma}_h = 3.105\sqrt{1 + \tfrac18} = 3.294, \qquad 12.25 \pm 1.2816(3.294) = (8.029,\ 16.471)$$

El mismo intervalo para todo $h$. Compara: el estacional da bandas **más angostas** que el ingenuo (2.6 contra 5.1 de desviación) porque sus residuales son más chicos. Un mejor método también da intervalos más útiles.

**¿Cumplieron?** Los datos reales de 2022 ($14, 18, 10, 16$) caen todos dentro de la banda de 80% del estacional: $14 \in (9.6, 16.4)$, $18 \in (13.6, 20.4)$, $10 \in (5.6, 12.4)$ y $16 \in (11.6, 18.4)$.
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
Sí, **si el método es correcto**: de cada 10 pronósticos, en promedio 8 datos reales quedan dentro de su banda de 80%. No es un intervalo de confianza para un parámetro (como el de la media), sino para una observación futura: incluye el choque que todavía no ocurre, y por eso siempre es más ancho.
:::

### Referencias con logaritmo y con descomposición {#ref-transformadas}

Las referencias se pueden aplicar a una **versión transformada** de la serie y luego regresar a la escala original. Es la manera de construir referencias más fuertes sin dejar de ser simples.

:::definicion Referencia sobre el logaritmo
1. Transformar: $z_t = \log y_t$ [[u1:log]].
2. Aplicar la referencia a $z_t$ y obtener $\hat{z}_{T+h \mid T}$ y su banda $(\hat{z}^{\,lo},\ \hat{z}^{\,hi})$.
3. Regresar: $\hat{y}_{T+h \mid T} = e^{\hat{z}_{T+h \mid T}}$ y la banda $\left(e^{\hat{z}^{\,lo}},\ e^{\hat{z}^{\,hi}}\right)$.

La banda en la escala original **ya no es simétrica** (se estira hacia arriba) y **nunca es negativa**. El pronóstico puntual que se obtiene es la **mediana**, no la media; la corrección se estudia en [[regresar-escala]].
:::

:::demo Qué cambia (y qué no) al usar el logaritmo {#demo-ref-log}
:::pasos
= \hat{y}_{T+h \mid T} = e^{z_T} = e^{\log y_T} = y_T
> **Ingenuo**: el pronóstico puntual es **idéntico** con o sin logaritmo. Lo mismo pasa con el ingenuo estacional, que copia un dato. Solo cambian las bandas.
= \hat{y}_{T+h \mid T} = \exp\!\left(\frac{1}{T}\sum_{t=1}^{T}\log y_t\right) = \left(\prod_{t=1}^{T} y_t\right)^{1/T}
> **Promedio**: el promedio de los logaritmos regresa como la **media geométrica**, que siempre es menor o igual que la aritmética.
= \hat{z}_{T+h \mid T} = z_T + h\,\frac{z_T - z_1}{T - 1} \;\Rightarrow\; \hat{y}_{T+h \mid T} = y_T \left(\frac{y_T}{y_1}\right)^{h/(T-1)} = y_T\,\tip{g-crec}{g}^{\,h}
> **Deriva**: una recta en el logaritmo es un crecimiento **porcentual constante** en la escala original, con factor $g = (y_T/y_1)^{1/(T-1)}$ por periodo. Es la deriva natural de una serie que crece «tanto por ciento al año».
:::
En AirPassengers, $g = (405/112)^{1/131} = 1.0099$: la deriva en logaritmo supone que la serie crece 0.99% cada mes. La deriva en la escala original supone que crece 2.24 pasajeros cada mes, sin importar el nivel.
:::

```python
df_log = train_df.assign(y=np.log(train_df["y"]))                 # z = log y en el entrenamiento
fc_log = StatsForecast(models=[Naive(), SeasonalNaive(season_length=12), RandomWalkWithDrift()], freq="MS") \
    .forecast(df=df_log, h=12, level=[80])
cols = [c for c in fc_log.columns if c not in ("unique_id", "ds")]
fc_log[cols] = np.exp(fc_log[cols].astype("float64"))            # regresar a pasajeros
print(fc_log[["ds", "SeasonalNaive", "SeasonalNaive-lo-80", "SeasonalNaive-hi-80"]].head(3).round(2))
for col in ["Naive", "SeasonalNaive", "RWD"]:
    e = real_60 - fc_log[col].values
    print(f"{col:14s} en log → MAE = {np.mean(np.abs(e)):6.2f}")
```

El ingenuo y el estacional dan el mismo MAE que sin logaritmo (76.00 y 47.83): sus pronósticos puntuales no cambian. Lo que cambia es la banda: en enero de 1960 el estacional pronostica 360 con banda de 80% $(302.1,\ 429.0)$, que queda 58 por debajo y 69 por arriba. La deriva sí mejora (MAE 62.05 contra 66.31), porque el crecimiento de AirPassengers es porcentual.

:::definicion Referencia por descomposición
Cuando la serie tiene tendencia **y** estacionalidad, ninguna referencia sola las ve a las dos. La solución es separarlas con una descomposición STL [[u1:stl]] y pronosticar cada parte con la referencia que le toca [[u1:pron-descomp]]:

1. Descomponer $z_t = \log y_t$ en estacionalidad $S_t$ y serie **desestacionalizada** $A_t = z_t - S_t$.
2. Pronosticar $A_t$ con la deriva (o el ingenuo): no tiene estacionalidad.
3. Pronosticar $S_t$ con el ingenuo estacional: el patrón de la última temporada.
4. Sumar y regresar: $\hat{y}_{T+h \mid T} = \exp\!\left(\hat{A}_{T+h \mid T} + \hat{S}_{T+h \mid T}\right)$.
:::

```python
from statsmodels.tsa.seasonal import STL
from statsforecast.models import MSTL

z_tr = np.log(serie.iloc[:-12])
stl_ref = STL(z_tr, period=12, robust=True).fit()
A = z_tr - stl_ref.seasonal                                       # desestacionalizada (log)
b_A = (A.iloc[-1] - A.iloc[0]) / (len(A) - 1)                     # deriva de A
h = np.arange(1, 13)
pron_stl_deriva = np.exp(A.iloc[-1] + h * b_A + stl_ref.seasonal.iloc[-12:].values)
pron_stl_ingenuo = np.exp(A.iloc[-1] + stl_ref.seasonal.iloc[-12:].values)
for nombre, p in [("STL + deriva", pron_stl_deriva), ("STL + ingenuo", pron_stl_ingenuo)]:
    print(f"{nombre:14s} MAE = {np.mean(np.abs(real_60 - p)):6.2f} | RMSE = {np.sqrt(np.mean((real_60 - p) ** 2)):6.2f}")

# Lo mismo en una línea con statsforecast: MSTL con la deriva para la parte desestacionalizada
fc_mstl = StatsForecast(models=[MSTL(season_length=12, trend_forecaster=RandomWalkWithDrift())], freq="MS").forecast(df=df_log, h=12)
print(f"MSTL + deriva  MAE = {np.mean(np.abs(real_60 - np.exp(fc_mstl['MSTL'].values.astype('float64')))):6.2f}")
```

¡El MAE baja de 47.83 (ingenuo estacional) a **14.0**! (`MSTL` de statsforecast usa su propia versión de STL y llega a 13.36.) La referencia compuesta combina las dos suposiciones correctas: la estacionalidad se repite y el nivel crece un porcentaje fijo. Sigue siendo una referencia (no estima ningún modelo de la Unidad II), pero es una vara **mucho más alta**. Cualquier SARIMA para AirPassengers tendrá que compararse contra ella [[metricas-ref]].

:::interactivo w2-ref-transformar | Referencias con logaritmo y con descomposición {#w-ref-transformar}
AirPassengers, prueba 1960. Elige la referencia, la escala y el nivel de la banda.
@@@
- **Gráfica**: 1957–1959 y el pronóstico de 1960 con su banda; los puntos verdes son los datos reales.
- **Escala logarítmica**: el pronóstico se calcula sobre $\log y$ y se regresa con la exponencial. Fíjate en la banda: se vuelve asimétrica y deja de llegar a valores imposibles.
- **STL + deriva / STL + ingenuo**: la estacionalidad (STL robusta sobre $\log y$) se pronostica con el ingenuo estacional y la parte desestacionalizada con la deriva o el ingenuo. La banda es la de esa parte, más la estacionalidad.
- **Lectura**: MAE, RMSE y la cobertura observada de la banda. Compara la cobertura del estacional (3 de 12) con la de STL + deriva.
:::

### Cómo elegir la referencia {#ref-elegir}

:::definicion Árbol de decisión
1. **¿La serie tiene un patrón estacional claro?** (en la gráfica, o con picos de la ACF en $m, 2m, \dots$ [[u1:patrones]])
   - **Sí, con nivel estable** → ingenuo estacional. Si el patrón es muy ruidoso, el promedio estacional de ventana con $k = 2$ o 3.
   - **Sí, y además con tendencia** → la referencia por descomposición (STL + deriva, en logaritmo si la variación crece con el nivel). El ingenuo estacional queda como vara **mínima**.
2. **No es estacional. ¿Sube o baja de forma persistente?**
   - **Sí** → la deriva; en logaritmo si el crecimiento es porcentual.
3. **No tiene tendencia. ¿Los datos cercanos se parecen entre sí (la ACF decae lento)?**
   - **Sí, se mueve como un paseo aleatorio** → el ingenuo. Si cada dato trae mucho ruido, el suavizamiento exponencial o el promedio de ventana.
   - **No, oscila alrededor de un nivel fijo** → el promedio histórico (o de ventana, si el nivel cambia poco a poco).
4. **Siempre:** calcula **todas** las que tengan sentido y quédate con la que tenga menor error en la prueba. El árbol dice cuál esperas que gane; los datos deciden.
:::

| Situación | Referencia | En statsforecast |
|---|---|---|
| Ruido alrededor de una media | promedio | `HistoricAverage()` |
| Nivel que cambia poco a poco | promedio de ventana o SES | `WindowAverage(window_size=k)`, `SimpleExponentialSmoothingOptimized()` |
| Paseo aleatorio | ingenuo | `Naive()` |
| Tendencia | deriva | `RandomWalkWithDrift()` |
| Estacionalidad estable | ingenuo estacional | `SeasonalNaive(season_length=m)` |
| Estacionalidad ruidosa y estable | promedio estacional de ventana | `SeasonalWindowAverage(season_length=m, window_size=k)` |
| Tendencia y estacionalidad | descomposición + deriva | `MSTL(season_length=m, trend_forecaster=RandomWalkWithDrift())` |

:::duda ¿Por qué no elegir de una vez la referencia más sofisticada?
Porque la referencia tiene que ser **difícil de vencer y fácil de explicar**. Si usas como vara una que ya es casi un modelo, nadie sabrá si el SARIMA gana por sus términos AR y MA o por la descomposición. Lo usual es reportar **dos**: la referencia simple natural (ingenuo estacional, en datos mensuales) y la mejor que encontraste.
:::

### Evaluar contra las referencias {#ref-evaluar}

La función `evaluate` de `utilsforecast` hace la comparación de un jalón: une el pronóstico con la prueba por `unique_id` y `ds`, y devuelve una fila por métrica y una columna por método.

```python
from utilsforecast.evaluation import evaluate
from utilsforecast.losses import mae, rmse

modelos_ref = ["HistoricAverage", "Naive", "SeasonalNaive", "RWD"]
res_sf = test_df.merge(fcst[["unique_id", "ds"] + modelos_ref], on=["unique_id", "ds"])
res_sf["STL_deriva"] = pron_stl_deriva                                     # la referencia compuesta

ev_ref = evaluate(res_sf, metrics=[mae, rmse], models=modelos_ref + ["STL_deriva"])
print(ev_ref.drop(columns="unique_id").set_index("metric").round(2))
```

| Referencia | MAE | RMSE |
|---|---|---|
| Promedio histórico | 213.67 | 226.27 |
| Ingenuo | 76.00 | 102.98 |
| Ingenuo estacional | **47.83** | **50.71** |
| Deriva | 66.31 | 92.67 |
| STL + deriva (log) | **14.00** | **17.94** |

La conclusión se escribe así: *«entre las cuatro referencias simples gana el ingenuo estacional (MAE 47.8); la referencia por descomposición baja el error a 14.0. Un modelo para AirPassengers tiene que mejorar esas dos cifras»*. Con las métricas porcentuales (MAPE) y escaladas (MASE) de [[metricas]], y con varias ventanas de prueba [[rolling-origin]], la comparación se vuelve más completa.

:::duda Una sola partición 80/20, ¿está mal?
No está mal: es la evaluación más simple, respetando el orden. Su problema es que el resultado depende de qué pasó en ese 20%: con otra ventana de prueba, las distancias entre los métodos cambian, y a veces también el ganador. Más adelante, la validación con origen móvil promedia varios cortes y da una estimación más estable del error esperado [[ref-cv]]. Si el examen pide 80/20, hazlo así.
:::

### Errores frecuentes con las referencias {#ref-errores}

| Error | Qué pasa | Cómo evitarlo |
|---|---|---|
| `season_length` equivocado | Con datos mensuales y `season_length=4`, el «estacional» copia los últimos 4 meses: un error silencioso | usa $m = 12$ (mensual), 4 (trimestral), 7 (diario), 52 (semanal) |
| `freq` que no coincide con las fechas | Las fechas del pronóstico no empatan con la prueba; el `merge` queda vacío | `"MS"` si la fecha es el día 1, `"ME"` si es el último día |
| Comparar dentro de la muestra | El promedio y la deriva usan datos «del futuro» en sus ajustados y parecen mejores de lo que son | mide siempre en la prueba |
| Compararse con la **peor** referencia | «Mi modelo le gana al promedio histórico» no dice nada si el estacional es 4 veces mejor | reporta la **mejor** referencia |
| Calcular la referencia con la prueba incluida | El promedio o la pendiente incorporan datos que no se conocían: fuga de información | calcula todo con `train_df` |
| Deriva con un primer dato atípico | Solo importan $y_1$ y $y_T$: un $y_1$ raro tuerce toda la recta | grafica la serie; recorta el inicio si hace falta |
| Olvidar regresar del logaritmo | Se comparan $\log$ contra pasajeros y el MAE sale minúsculo | aplica `np.exp` antes de medir |
| Mezclar métodos sin intervalos con `level` o `fitted=True` | `WindowAverage` hace fallar todo el `forecast` | pon esos métodos en otro `StatsForecast` |
| Buscar la columna `RandomWalkWithDrift` | `KeyError`: la columna se llama `RWD` | revisa `fcst.columns` |

:::resumen Lo que debes llevarte de los pronósticos de referencia
- Primero la vara: todo modelo se compara contra la **mejor** referencia, en datos de prueba que no vio, con MAE y RMSE.
- Promedio $\bar{y}$, ingenuo $y_T$, estacional $y_{T+h-m(k+1)}$ y deriva $y_T + h(y_T - y_1)/(T-1)$; la deriva es la recta entre el primer dato y el último, y la media de los residuales del ingenuo es $b$.
- Entre el promedio y el ingenuo están el promedio de ventana ($k = 1$ ingenuo, $k = T$ promedio) y el suavizamiento exponencial (pesos $\alpha(1-\alpha)^j$, $\alpha = 1$ ingenuo); el promedio estacional de ventana con $k = 1$ es el ingenuo estacional.
- Bandas: $\hat{y} \pm c\,\hat{\sigma}_h$ con $\hat{\sigma}_h$ constante (promedio), $\propto\sqrt{h}$ (ingenuo), en escalones (estacional) o más rápido (deriva). Solo son confiables si los residuales son ruido blanco normal.
- En logaritmo, el ingenuo y el estacional dan el mismo pronóstico puntual pero bandas asimétricas y positivas; la deriva se vuelve crecimiento porcentual. Con tendencia **y** estacionalidad, la referencia por descomposición (STL + deriva) es mucho más fuerte.
- statsforecast: formato largo `unique_id, ds, y`; `StatsForecast(models, freq)`; `forecast(df, h, level, fitted=True)`; `forecast_fitted_values()`. Columnas `RWD`, `SeasWA`, `SES`, `SESOpt`; `freq` debe coincidir con las fechas.
:::
