## 📖 Introducción: qué se hizo en la tercera entrega {#intro}
@mapa De dónde sale la serie, qué se quiere pronosticar, los tres escenarios de pronóstico y cómo está organizada esta página.

El proyecto semestral (grupo 6AM1, Dra. Claudia García Blanquel) analiza los datos **SCADA** de las turbinas del parque eólico, registrados cada 10 minutos durante **2019**. En la tercera entrega el equipo dejó de trabajar con el viento cada 10 minutos y pasó a la **energía diaria de la turbina MV01**: una sola cifra por día, en kWh, que es la que interesa para planear la entrega de electricidad.

:::definicion Cómo se calculó la serie (en el EDA de entregas anteriores)
Para cada día: la **potencia media del día** × 24 h, en hora estándar (UTC−6). Si un día tenía **menos de 130 de sus 144 registros** válidos de 10 minutos, se dejó como nulo en lugar de inventar la energía que faltaba. El resultado es el archivo `energia_MV01.csv`: 365 renglones con `fecha` y `energia_kwh`.
:::

:::definicion Objetivo de la entrega
Pronosticar la energía diaria de MV01 y comparar dos familias de modelos:

1. **ARIMA directo sobre la serie**: un ARIMA elegido a mano con la ACF y la PACF, contra el que elige **AutoARIMA**.
2. **Pronóstico por componentes STL**: descomponer en tendencia, estacionalidad y residuo, pronosticar cada parte con un modelo sencillo y sumar.

Los dos se comparan contra las referencias de clase (`Naive` y `HistoricAverage`) en **tres escenarios**:

| Escenario | Qué simula |
|---|---|
| **h = 73**, un solo pronóstico | Entrenar una vez y pronosticar de golpe todo el periodo de prueba. |
| **h = 1**, origen móvil | Cada día se pronostica el día siguiente y luego se agrega el dato real. |
| **h = 7**, origen móvil | Lo que pide el **CENACE**: estimaciones con hasta 7 días de anticipación. |
:::

### Cómo está organizada esta página {#organizacion}

Cada **pastilla** es una celda (o un grupo de celdas) del notebook `Proyecto_series_3er_entrega.ipynb`, en el mismo orden. Dice qué se hizo y para qué, muestra el código, la salida real y cómo se leen los números. Las gráficas con el botón **▶ Reproducir** son animaciones: arrancan solas la primera vez que aparecen en pantalla y se pueden pausar o recorrer cuadro por cuadro con la barra.

:::nota Los números de esta página
Todo el código del notebook se vuelve a ejecutar de corrido al generar la página, así que las cifras son las que salen hoy de ese código. Donde el notebook entregado tiene algún detalle (una salida vieja, una palabra que exagera), aparece una **nota breve** y el análisis sigue igual.
:::

| Fase | Celdas del notebook |
|---|---|
| 1 · Preprocesamiento | carga, nulos e interpolación, días sin producción |
| 2 · Exploración y división | gráfica de la serie y partición 80/20 |
| 3 · Estacionariedad y ARIMA | ADF, ACF/PACF, ARIMA(2,0,0) y AutoARIMA |
| 4 · Descomposición STL | STL, variación de parámetros, componentes |
| 5 · Validación | parámetros de la STL, modelos de cada componente y ventana |
| 6 · Prueba | h = 73, h = 1 y h = 7 |
| 7 · Resultados | residuo de otra turbina y conclusiones |
