## 📖 Introducción: el mismo viento, en el orden del temario {#intro}
@mapa Qué es este análisis, en qué se distingue del primero y cómo está organizado.

Este laboratorio usa **los mismos datos SCADA** que el primer análisis del proyecto (el flujo de trabajo completo, que ya no forma parte de la guía): la velocidad del viento de la turbina **MV01** de un parque eólico durante **2019**, medida cada 10 minutos. Allí el orden lo marcaba el flujo de trabajo de un proyecto (definir, preparar, modelar, evaluar). **Aquí el orden lo marca la materia**: cada herramienta aparece cuando el temario la presenta, se aplica al viento y se lee qué dice. Es una forma de estudiar la materia completa con una sola serie real.

:::definicion Objetivo
Recorrer **las tres unidades** del curso sobre una serie real y, con lo que cada unidad permite, **pronosticar la velocidad media horaria del viento en MV01 para las siguientes 24 horas**, cada medianoche. Al final, los modelos del temario se evalúan en un periodo que nadie vio y el resultado se compara con el del primer análisis.
:::

### Cómo está organizado {#organizacion}

| Parte | Qué se hace | Dónde está |
|---|---|---|
| Limpieza | Leer el archivo dañado, validar las fechas, quitar valores imposibles, detectar paros, pasar a horas e imputar los huecos | [[limpieza]] |
| Exploración (EDA) | Distribución, ciclo diario, dirección, curva de potencia, otras variables y otras turbinas | [[eda]] |
| Unidad I | La serie y su visualización, componentes, descomposición clásica y STL, estadísticos, estacionariedad, ADF y KPSS, ACF, PACF y Ljung–Box | [[u1-serie]] a [[u1-acf]] |
| Unidad II | **Modelos de referencia**, luego **AR solos** y **MA solos**, y después ARMA, Box–Jenkins, transformaciones, ARIMA, exógenas, AIC y BIC, SARIMA, diagnóstico, máxima verosimilitud, `summary()`, validación, ARCH y métricas | [[u2-referencias]] a [[u2-validacion]] |
| Unidad III | Periodicidad, dominio de la frecuencia, periodograma, estimación espectral, espectro cruzado, retrasos y filtros | [[u3-frecuencia]] a [[u3-filtros]] |
| Evaluación final | Los mejores modelos del temario en la prueba: errores, residuos e intervalos | [[final]] |
| Comparación | Qué cambió frente al primer análisis | [[comparacion]] |

### La regla del juego: no adelantar temas {#regla}

Cada paso usa **solo lo visto antes**. Si una pregunta necesita una herramienta de más adelante, se anota y se responde cuando llega su tema. Por ejemplo, la transformación de Box–Cox (Unidad II) no se usa en la Unidad I aunque el viento la pida, y el periodograma (Unidad III) no se usa para elegir modelos de la Unidad II.

Hay **una excepción**, porque sin ella no se podría comparar ningún pronóstico: la **división temporal en entrenamiento, validación y prueba**, el **pronóstico con origen móvil** y las **métricas** (MAE, RMSE, MAPE, MASE) se usan desde el primer pronóstico, aunque en el temario aparecen al final de la Unidad II. Esos pasos llevan la marca **⏩ Adelanto** y se explican de nuevo, con detalle, en [[u2-validacion|su lugar]].

:::intuicion Cómo leer cada paso
Cada paso es una **pastilla**: dice qué se aplica y para qué, los parámetros con su justificación, el código con su salida real, las gráficas, qué nos dicen los valores y la decisión que se toma. El color dice cómo salió: 🔵 exploración, ✅ logrado, 🟡 funciona con reservas y ❌ descartado. Algunas gráficas tienen **controles** para ver cómo cambia el resultado con un parámetro; esas versiones también se calcularon con el código de la página.
:::

### Mapa del flujo {#mapa-flujo}
@@PASOS@@
