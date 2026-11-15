## 🏆 Resultados generales y conclusiones {#resultados}
@mapa La respuesta al objetivo, los criterios de éxito, qué pasó con cada suposición, si el modelo captura la estacionalidad y la tendencia, las limitaciones y el trabajo futuro.

```python oculto
# Tablas y gráficas del resumen final (con los resultados de los pasos anteriores)
ORDEN_FIN = list(tab_pru.index)
filas_fin = [[m, CATEGORIA[m], f'{tab_val.loc[m, "MAE"]:.3f}', f'{tab_pru.loc[m, "MAE"]:.3f}', f'{tab_pru.loc[m, "RMSE"]:.3f}',
              (f'{tab_pru.loc[m, "mejora % vs Naive"]:+.1f}%' if abs(tab_pru.loc[m, "mejora % vs Naive"]) >= 0.05 else "0.0%")] for m in ORDEN_FIN]
tabla("fin-modelos", ["modelo", "categoría", "MAE validación", "MAE prueba", "RMSE prueba", "mejora vs Naive (prueba)"], filas_fin,
      ["elegido" if m == elegido else ("reserva" if m == ORDEN_FIN[0] else ("descartado" if tab_pru.loc[m, "MAE"] > tab_pru.loc["Naive", "MAE"] else "")) for m in ORDEN_FIN],
      titulo="Los finalistas: validación (para elegir) y prueba (para reportar)",
      nota="Verde: el modelo elegido con la validación. Amarillo: el mejor en la prueba. Rojo: peor que la persistencia en la prueba.")
```

### Respuesta al objetivo {#res-objetivo}

**El problema.** Pronosticar cada medianoche las 24 horas siguientes de la velocidad media horaria del viento en la turbina MV01, con datos SCADA de 2019 que hubo que reparar, ordenar, limpiar e imputar antes de poder usarlos.

**El modelo entregado.** Con las reglas del juego (elegir con la validación, reportar con la prueba), el modelo elegido es una **{{=elegido}}**: una regresión sobre cuatro términos de Fourier (el ciclo de 24 y 12 horas) con errores AR(3), ajustada sobre √y. En la prueba reduce el MAE de la persistencia en **{{=tab_pru.loc[elegido, 'mejora % vs Naive']|.1f}}%** ({{=tab_pru.loc[elegido, 'MAE']|.2f}} contra {{=tab_pru.loc['Naive', 'MAE']|.2f}} m/s) y su intervalo del 80% cubre el {{=100 * tab_cob['cobertura'].iloc[0]|.0f}}% de las horas.

**El mejor en la prueba.** **{{=ORDEN_FIN[0]}}**, un modelo de aprendizaje automático lineal, con {{=tab_pru['mejora % vs Naive'].iloc[0]|.1f}}% de mejora. Ridge con el viento solo, el finalista de su categoría, logra {{=tab_pru.loc['Ridge', 'mejora % vs Naive']|.1f}}%. La diferencia con el elegido se explica por el **nivel** al que regresa cada modelo ([[prueba-ranking|el análisis del sesgo]]).

@widget lab-tabla id=fin-modelos

### Criterios de éxito {#res-criterios}

| # | Criterio | Resultado | ¿Se cumplió? |
|---|---|---|---|
| 1 | El elegido en validación le gana en la prueba a la mejor referencia | MAE {{=tab_pru.loc[elegido, 'MAE']|.3f}} contra {{=tab_pru.loc['Naive', 'MAE']|.3f}} de la persistencia ({{=tab_pru.loc[elegido, 'mejora % vs Naive']|.1f}}%); RMSE {{=tab_pru.loc[elegido, 'RMSE']|.2f}} contra {{=tab_pru.loc['Naive', 'RMSE']|.2f}} | ✅ por poco |
| 2 | Residuos a un paso como ruido blanco | Ljung–Box p = {{=lb['lb_pvalue'].iloc[0]|.1e}} (24 rezagos); autocorrelaciones pequeñas en los rezagos 1, 2 y 24; fuerte efecto ARCH | 🟡 no del todo |
| 3 | Intervalos del 80% y 95% con la cobertura prometida | {{=100 * tab_cob['cobertura'].iloc[0]|.0f}}% y {{=100 * tab_cob['cobertura'].iloc[1]|.0f}}%, pero con anchos de {{=tab_cob['ancho medio (m/s)'].iloc[0]|.0f}} y {{=tab_cob['ancho medio (m/s)'].iloc[1]|.0f}} m/s | ✅ con intervalos anchos |
| 4 | Saber si el modelo captura la estacionalidad y la tendencia | Ver la sección siguiente | ✅ la estacionalidad; 🟡 la tendencia |

### ¿El modelo captura la estacionalidad y la tendencia? {#res-estacionalidad}

**La estacionalidad, sí.** El único ciclo real del viento es el **diario**: un pico angosto de 24 horas en el [[esp-periodograma|periodograma]] con su armónico de 12, estable a lo largo del año ([[est-mstl|el perfil de MSTL se repite]]) aunque su amplitud cambia con la temporada. El modelo lo representa con cuatro términos de Fourier, y en sus residuos queda muy poco en el rezago 24 ({{=acf_res[24]|.2f}}). El ciclo **semanal** que propuso MSTL no existe, y la estacionalidad aporta poco: {{=por_banda['ciclo diario (22–26 h)'] + por_banda['armónico (11.5–12.5 h)']|.1f}}% de la varianza.

**La tendencia, a medias.** La serie no tiene una tendencia lineal: tiene un **nivel que cambia con la temporada** (más de 11 m/s en enero, noviembre y diciembre, y apenas {{=por_mes.loc['may', 'mean']|.0f}} en mayo) y **episodios de varios días**, que concentran el {{=por_banda['más de 30 días'] + por_banda['3 a 30 días']|.0f}}% de la varianza. El AR(3) sigue cada episodio y regresa a la media, pero a una **media fija**, la de todo el entrenamiento. Cuando la temporada cambió, esa media quedó baja: un sesgo de {{=sesgo.loc[elegido, 'sesgo a 24 h']|.1f}} m/s a 24 horas en la prueba. Un modelo que regresa a un nivel reciente (Ridge con medias móviles) lo resolvió mejor.

### Qué pasó con cada suposición {#res-suposiciones}

| # | Suposición inicial | Veredicto | Evidencia |
|---|---|---|---|
| S1 | El archivo es un CSV y basta con `pd.read_csv`. | ❌ | Encabezado partido, comas perdidas, líneas truncadas y ilegibles, y el límite de filas de Excel ([[crudo-encabezado|lectura]], [[crudo-reparar|reparación]]). |
| S2 | La hora local sirve como índice. | 🟡 | El horario de verano crea una hora duplicada y otra inexistente; se usó UTC−6 fija ([[vt-orden|validación temporal]]). |
| S3 | La interpolación lineal basta para los huecos. | 🟡 | Sirve en huecos cortos, pero la turbina vecina se equivoca la mitad y no empeora con el largo ([[imp-experimento|experimento]]). |
| S4 | El ciclo diario es fuerte y el ingenuo estacional será buena referencia. | ❌ | F_S = {{=F_S|.2f}}, el ciclo diario es {{=por_banda['ciclo diario (22–26 h)']|.1f}}% de la varianza, y el ingenuo estacional fue de los peores ([[est-stl|STL]], [[esp-bandas|bandas]], [[ref-validacion|referencias]]). |
| S5 | Como ADF rechaza, un SARIMA con d = 0 basta. | 🟡 | Ganó en la validación, pero en la prueba la media fija lo dejó corto; ADF y KPSS tenían razón cada una a su escala ([[est-memoria|memoria larga]], [[prueba-ranking|sesgo]]). |
| S6 | El MAPE sirve para comparar. | ❌ | Las horas en calma pesan desproporcionadamente y el MAPE ordena distinto que el MAE ([[met-mape|MAPE]]). |
| S7 | El calendario ayudará. | ❌ | Empeoró a Ridge y no le dio ventaja al gradient boosting; el viento no sabe qué día es ([[ml-calendario|calendario]]). |
| S8 | Un modelo más complejo le ganará a los lineales. | ❌ | Gradient boosting y redes neuronales quedaron detrás de Ridge y de la regresión armónica en validación y prueba ([[ml-hgb|gradient boosting]], [[ml-mlp2|red neuronal]]). |

### Hallazgos principales {#res-hallazgos}

1. **Preparar los datos fue la mitad del trabajo.** El archivo tenía varios tipos de daño y la serie tenía un sensor apagado, códigos de error, un cambio de horario y paros. Cada problema, sin detectar, habría producido un resultado engañoso sin ningún mensaje de error.
2. **El viento es, sobre todo, persistencia más reversión al nivel.** La relación entre el pasado y el futuro es casi lineal: los modelos lineales (AR, regresión armónica, Ridge) ganaron a los no lineales, y las redes neuronales mejoraron solo cuando se les obligó a parecerse a una regresión lineal.
3. **La validación no puede ver lo que no contiene.** El periodo de validación era de una temporada tranquila y la prueba, de nortes. La regla de elegir con la validación es correcta, pero su resultado depende de que la validación se parezca al futuro.
4. **ADF y KPSS no se contradecían**: describían la misma serie a escalas distintas. Esa "contradicción" fue la pista del principal problema del modelo elegido.
5. **Para el operador, los paros cuestan más que el error del pronóstico.** En la prueba se perdió el {{=(1 - energia['real'].sum() / energia['potencial'].sum()) * 100|.0f}}% de la energía posible por paros; el error del mejor pronóstico es de unos {{=tab_energia['MAE contra la potencial (MWh/día)'].min()|.0f}} MWh por día sobre unos {{=energia['potencial'].mean()|.0f}} posibles ([[energia|de viento a energía]]).

@widget lab-graf id=pru-grafica

### Limitaciones {#res-limitaciones}

- **Cambios estructurales.** El nivel del viento cambia con la temporada y un año de datos solo tiene un invierno: ningún modelo pudo aprender cómo es una transición de temporada antes de verla en la prueba.
- **Valores atípicos no previstos.** Los paros (con buen viento y potencia cero) no se pueden pronosticar con la serie del viento; en la temporada de nortes llegan a más del 20% del tiempo.
- **Falta de variables.** El pronóstico a 24 horas del viento depende del tiempo atmosférico que viene. Sin un pronóstico meteorológico numérico (como el GFS o el ECMWF) como variable exógena, cualquier modelo basado solo en la serie mejora poco a la persistencia: aquí, el mejor de la prueba, menos del 10%.
- **Varianza no constante.** El efecto ARCH es fuerte y los intervalos de varianza constante son demasiado anchos en las horas tranquilas.
- **Datos incompletos.** El archivo perdió 19 de las 25 turbinas por el límite de filas de Excel; con todo el parque se podría modelar la producción total, que es más predecible que la de una turbina.

### Trabajo futuro {#res-futuro}

- **Elegir el nivel con más cuidado**: una validación con varias ventanas a lo largo del año (origen móvil en todo el entrenamiento) o modelos que regresen a un nivel reciente, como un SARIMA ajustado con una ventana móvil o con la media de los últimos 30 días como exógena.
- **Agregar pronósticos meteorológicos** como variables exógenas: es la mejora más grande posible para el horizonte de 24 horas.
- **Modelar la volatilidad** con un SARIMA-GARCH o con intervalos conformales que se adapten al nivel de agitación reciente.
- **Usar varias turbinas a la vez**: un modelo para el parque completo, o un modelo de Ridge con el viento de todas las turbinas, que promedia el ruido local.
- **Redes recurrentes (LSTM)** o modelos de lenguaje para series de tiempo, con varios años de datos; con uno solo, este flujo mostró que los modelos simples son difíciles de superar.
- **Detección de anomalías** con la relación potencia–temperatura del aceite que encontró el [[esp-ccf|preblanqueo]], para anticipar algunos paros.
