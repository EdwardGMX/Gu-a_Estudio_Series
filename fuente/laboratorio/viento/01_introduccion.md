## 📖 Introducción {#intro}
@mapa Qué es un SCADA, qué trae el archivo de la profesora, qué no sabemos de él y por qué pronosticar el viento importa.

Un **aerogenerador** convierte la energía del viento en electricidad: el viento mueve las aspas, el rotor hace girar un generador y la potencia se entrega a la red. Cada turbina moderna tiene un sistema **SCADA** (*Supervisory Control and Data Acquisition*) que mide cientos de variables y guarda, cada **10 minutos**, su promedio, desviación, mínimo y máximo: velocidad del viento en la góndola, potencia activa y reactiva, ángulo de las aspas, velocidad del rotor y del generador, temperaturas de la caja de engranes, de los rodamientos y del generador, dirección, presión, estado de operación y códigos de falla.

El archivo que dio la profesora, `MV01-MV25_2019.txt`, es una exportación SCADA de **un parque eólico durante 2019**. Las turbinas se llaman MV01, MV02, … y son de **2.3 MW**. El archivo pesa 280 MB y viene **dañado**: el nombre promete 25 turbinas pero solo trae seis, varias columnas quedaron partidas, hay comas perdidas y líneas cortadas. Repararlo es la primera parte del trabajo.

:::cuidado Lo que no sabemos del dataset
No hay documentación del parque. Las pistas de los propios datos (vientos muy intensos del norte en invierno, un máximo secundario en julio y temperaturas de 22 a 28 °C todo el año) son compatibles con el **Istmo de Tehuantepec**, en Oaxaca, una de las zonas con más viento del mundo. Pero no está confirmado, y el reloj del equipo cambia de horario en las fechas de Estados Unidos. Por eso el análisis no depende de la ubicación.
:::

El archivo completo no está en el repositorio. El script `fuente/laboratorio/viento/preparar_datos.py` lo lee una vez, aplica la misma reparación que se explica en los pasos 1 y 2, y guarda los datos que usa este flujo en `assets/datos/viento/`:

| Archivo | Contenido |
|---|---|
| [`muestra_cruda.txt`](assets/datos/viento/muestra_cruda.txt) | 24 líneas del archivo original, tal como vienen, con un ejemplo de cada problema. |
| [`scada_mv01_2019_10min.csv.gz`](assets/datos/viento/scada_mv01_2019_10min.csv.gz) | La turbina **MV01**: 52,555 registros de 10 minutos y 28 variables. |
| [`scada_parque_2019_10min.csv.gz`](assets/datos/viento/scada_parque_2019_10min.csv.gz) | Viento y potencia de MV01 a MV06. |
| [`perfil_archivo.json`](assets/datos/viento/perfil_archivo.json) | Cuántas líneas de cada tipo tiene el archivo completo. |

:::intuicion Por qué pronosticar el viento
La energía que entrega un parque depende del viento de las próximas horas. En los mercados eléctricos con **mercado del día en adelanto**, el operador del parque ofrece hoy la energía que producirá mañana, hora por hora; si entrega menos de lo prometido, paga penalizaciones. El pronóstico del viento a 24 horas también sirve para programar mantenimiento en los días tranquilos y para que el operador de la red tenga lista la generación de respaldo. Pronosticar el viento y luego convertirlo en energía con la **curva de potencia** de la turbina es la forma estándar de hacerlo.
:::

## 🎯 Objetivo general {#objetivo}
@mapa El problema que se resuelve, las suposiciones iniciales del analista y los criterios para decir que el trabajo salió bien.

:::definicion Objetivo general
**Pronosticar la velocidad media horaria del viento en la turbina MV01 para las siguientes 24 horas**, cada día a la medianoche, con intervalos de predicción del 80% y 95%. Se comparan modelos de referencia, modelos clásicos (SARIMA, Holt–Winters, regresión armónica), de aprendizaje automático y redes neuronales, y el pronóstico ganador se traduce a **energía** con la curva de potencia. En el camino se usan las herramientas de las tres unidades.
:::

| Fase del flujo de trabajo | Dónde está |
|---|---|
| 1. Definición del problema y horizonte | [[fase-datos]] |
| 2. Preparación: validación temporal, limpieza e imputación | [[fase-limpieza]] |
| 2. Análisis exploratorio | [[fase-eda]] |
| 2. Descomposición, estacionariedad, ACF y PACF | [[fase-estructura]] |
| Unidad III: espectro, coherencia y filtros | [[fase-espectral]] |
| 3. División temporal 80/20, referencias y métricas | [[fase-particion]] |
| 4. Ingeniería de características | [[fase-caracteristicas]] |
| 5. Modelado: clásicos | [[fase-clasicos]] |
| 5. Modelado: aprendizaje automático y redes neuronales | [[fase-ml]] |
| Métricas preliminares (validación) | [[fase-validacion]] |
| 6. Evaluación en la prueba y diagnóstico de residuos | [[fase-prueba]] |
| 7. Conclusiones y trabajo futuro | [[resultados]] |

Como haría un analista real, el trabajo empieza con **suposiciones** que se van a poner a prueba:

| # | Suposición inicial del analista | Dónde se pone a prueba |
|---|---|---|
| S1 | "El archivo es un CSV: basta con `pd.read_csv`." | [[crudo-encabezado]], [[crudo-reparar]] |
| S2 | "La hora local del archivo sirve como índice de tiempo." | [[vt-orden]] |
| S3 | "Los huecos se rellenan bien con interpolación lineal." | [[imp-experimento]] |
| S4 | "El viento tiene un ciclo diario fuerte: el ingenuo estacional de 24 h será una buena referencia." | [[est-stl]], [[esp-bandas]], [[ref-validacion]] |
| S5 | "Como la ADF rechaza la raíz unitaria, la serie es estacionaria y un SARIMA con d = 0 basta." | [[est-adf-kpss]], [[cla-d0-d1]], [[prueba-resultados]] |
| S6 | "El MAPE sirve para comparar los modelos." | [[met-mape]] |
| S7 | "Las variables de calendario (día de la semana, festivos) ayudarán." | [[ml-calendario]] |
| S8 | "Un modelo más complejo (gradient boosting, red neuronal) le ganará a los lineales." | [[ml-hgb]], [[ml-mlp]], [[prueba-resultados]] |

**Criterios de éxito:**

1. El modelo elegido **en validación** debe ganarle en la **prueba** a la mejor referencia (la persistencia, como se verá), con MAE y RMSE en m/s.
2. Sus residuos a un paso deben parecerse a **ruido blanco** (Ljung–Box).
3. Sus intervalos del 80% y 95% deben **cubrir lo que prometen** en la prueba.
4. Debe quedar claro si el modelo **captura la estacionalidad y la tendencia** de la serie.

### Mapa del flujo {#mapa-flujo}

Cada ficha es una pastilla, con el color de su resultado. Toca una para ir directo a ese paso.

<div class="pasos-mapa">@@PASOS@@</div>
