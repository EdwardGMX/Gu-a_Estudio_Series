# Guía de estudio · Análisis de Series de Tiempo

Página web interactiva para preparar el ETS de Análisis de Series de Tiempo. Cada parte tiene su propia página y un menú arriba para cambiar de una a otra:

| Página | Contenido |
|---|---|
| `index.html` | **Inicio**: mapa del temario oficial, ruta de estudio en 15 sesiones, avance y accesos |
| `unidad1.html` | **Unidad I · Características de series de tiempo** |
| `unidad2.html` | **Unidad II · Procesos lineales en tiempo discreto: AR, MA, ARMA, ARIMA, SARIMA y SARIMAX** |
| `unidad3.html` | **Unidad III · Análisis espectral y filtrado** |
| `preguntas-tipo.html` | **Preguntas tipo**: las 21 preguntas de la guía oficial del ETS con respuesta modelo |
| `practica.html` | **Práctica**: simulacro de examen, interpretar salidas de Python y repaso de errores |
| `repaso.html` | **Hojas de repaso** de las tres unidades, para pantalla e impresión |
| `laboratorio.html` | **Laboratorio · análisis completos con datasets reales** |

## Cómo estudiar con la guía

- **Empieza en Inicio.** El mapa del temario enlaza cada inciso del programa oficial con su sección, marca cuáles ya estudiaste y cuáles entran en el ETS. La ruta de estudio reparte todo en 15 sesiones con su tiempo estimado; «Continuar donde te quedaste» regresa a la última sección que leíste.
- **Modo ETS** (botón 🎯 arriba). Oculta los temas de **profundización**, que no pide la guía oficial del ETS, y deja un aviso plegado en su lugar para abrirlos si quieres. Lo esencial (definiciones, pruebas, interpretación, las preguntas de la guía) siempre queda visible. Los contadores de avance, de ejercicios y de tiempo se ajustan al modo.
- **Buscador** (🔎 o la tecla `/`). Busca en las secciones, definiciones y símbolos de todas las páginas y lleva al lugar exacto, aunque sea un tema de profundización.
- **Tiempo estimado** en cada sección, para el modo ETS y para el texto completo.
- **Preguntas tipo.** Las 21 preguntas de la guía oficial: escribes tu respuesta, abres la respuesta modelo con los puntos que debe tener y te calificas (bien, a medias, mal). Cada unidad tiene además 8 preguntas de respuesta abierta del mismo estilo.
- **Práctica.** Un **simulacro** de 15 ejercicios al azar (opción múltiple, salidas generadas y respuesta abierta) con calificación por unidad y por tema; un generador para **interpretar salidas** (ACF/PACF, ADF/KPSS, Ljung–Box, `summary()` y periodograma) con parámetros nuevos cada vez; y el **repaso de errores**, que junta todo lo que fallaste y lo quita cuando lo respondes bien.
- **Hojas de repaso.** Los resúmenes y el formulario de cada unidad en una sola página, lista para imprimir.
- Todo el avance (secciones estudiadas, respuestas, errores, simulacros) se guarda en el navegador.

## Qué incluye

### Unidad I

- **13 secciones**: herramientas matemáticas, qué es una serie de tiempo, visualización (incluida la gráfica de subseries), componentes y descomposición clásica, STL (LOESS a mano, el algoritmo, sus parámetros, versión robusta, fuerza de tendencia y estacionalidad) y pronóstico por descomposición, estadísticos básicos, estacionariedad (ruido blanco, AR(1), paseo aleatorio, raíz unitaria, tendencia determinística vs. estocástica, **regresión de tendencia** y regresión espuria, diferenciación), pruebas ADF y KPSS (con las pruebas del inciso 1.2.4: **Mann–Kendall**, **Chow, CUSUM y Zivot–Andrews**, **Levene y Breusch–Pagan**, ACF por tramos y una tabla con todas las hipótesis nulas), ACF y PACF, Ljung–Box, caso integrador con AirPassengers y formulario.
- **Demostraciones paso a paso** (cada paso con su justificación) y **24 ejemplos a mano guiados**: con «▶ Recorrer paso a paso» la tabla de datos ilumina en amarillo lo que usa cada paso y en verde lo que calcula.
- **Tabla interactiva del dataset AirPassengers** enlazada con su gráfica.
- **Código Python** con su salida real (se ejecuta al generar la página).
- **39 gráficas interactivas**, calculadas en el navegador con las mismas fórmulas que `statsmodels` (STL incluido, verificado contra `statsmodels.tsa.seasonal.STL`), cada una con su sección «Cómo leer esta gráfica» y, en la mayoría, una «vista extra» (gráfica o tabla enlazada) que muestra de dónde salen los números.
- **9 simuladores de Python** (`rolling`, `seasonal_decompose`, `STL`, transformaciones, `adfuller`, `kpss`, `plot_acf`/`plot_pacf`, `acf`, `acorr_ljungbox`).
- **62 ejercicios** con botón de respuesta y explicación, y **8 preguntas de respuesta abierta**.

### Unidad II

- **22 secciones**: repaso y herramientas (filtro lineal, números complejos, esperanza condicional), **pronósticos de referencia antes de cualquier modelo** (partición temporal, MAE y RMSE a mano, `HistoricAverage`, `Naive`, `SeasonalNaive`, `RandomWalkWithDrift`, `WindowAverage`, `SeasonalWindowAverage`, suavizamiento exponencial simple, **Holt y Holt–Winters**, el flujo de `statsforecast`, residuales, intervalos de predicción, referencias en logaritmo y por descomposición STL, árbol de decisión para elegir la referencia y errores frecuentes), operador rezago y polinomios, AR(p) (media, triángulo de estacionariedad, Yule–Walker, pseudo-ciclos, PACF), MA(q) e invertibilidad, ARMA y pesos ψ, metodología Box–Jenkins, transformaciones (log, Box–Cox, regreso a la escala original, sobrediferenciación), ARIMA (deriva, ARIMA(0,1,1) = suavizamiento exponencial, las referencias como ARIMA pequeños, pronóstico e intervalos), SARIMA y el modelo de aerolínea, variables exógenas (ARMAX contra regresión con errores SARIMA, fuga de información, festivos), máxima verosimilitud, AIC/BIC/HQIC y cuándo se pueden comparar, el `summary()` de SARIMAX renglón por renglón, diagnóstico de residuos (Ljung–Box con `model_df`, Jarque–Bera, prueba H), ARCH/GARCH y ARCH-LM, validación temporal (un paso contra varios pasos, estrategias, origen móvil y `cross_validation` de statsforecast), métricas (MAE, MSE, RMSE, MAPE, sMAPE, MASE y la comparación completa contra las referencias con `utilsforecast`), dos casos integradores (AirPassengers de principio a fin y usuarios diarios con días festivos), formulario y checklist.
- **Cada proceso explicado de varias formas**: 45 demostraciones paso a paso, **46 ejemplos a mano guiados** con la tabla iluminada, 22 ejemplos resueltos, 14 intuiciones, 25 dudas frecuentes y 25 recuadros de «Cuidado».
- **54 bloques de código Python** con su salida real (statsmodels, scipy, scikit-learn, statsforecast y utilsforecast).
- **48 gráficas interactivas** (calculadas en el navegador con `assets/js/ts2.js`, verificado contra statsmodels, scipy y statsforecast), todas con «Cómo leer esta gráfica» y vista extra, y **6 simuladores de Python** (`ArmaProcess`, `boxcox`, `ARIMA`, `plot_diagnostics`, `sklearn.metrics` y `StatsForecast`).
- **90 ejercicios** en 12 bloques (básicos, intermedios y retos), con respuesta explicada y enlace al tema, y **8 preguntas de respuesta abierta**.
- Enlaces **⇠ Unidad I** a lo que ya se estudió (ruido blanco, estacionariedad, ACF, Ljung–Box…).

### Unidad III

- **17 secciones**: herramientas (oscilación, amplitud y fase, Euler, ortogonalidad, Nyquist y alias, tres convenciones de frecuencia), periodicidad contra ciclo (manchas solares), dominio del tiempo y dominio de la frecuencia, densidad espectral (ruido blanco, MA(1), AR(1), pico del AR(2), ARMA, varianza por bandas), transformada de Fourier y periodograma (Parseval, distribución ji-cuadrada, fuga y ventanas), estimación no paramétrica (Daniell, ancho de banda, intervalos, afilado, Welch), estimación paramétrica (AR por Yule–Walker y orden por AIC), AirPassengers en frecuencia y armónicos, espectro cruzado (magnitud, fase, retardo, coherencia y su umbral), **regresión con retraso y extracción de señales** (correlación cruzada y preblanqueo, regresión con rezagos en el tiempo y en la frecuencia, señal más ruido, filtro óptimo de Wiener y el HP como filtro de Wiener), filtros lineales (respuesta al impulso, función de transferencia, ganancia y fase, $f_y = \lvert A\rvert^2 f_x$), tipos de filtros (pasa bajos, pasa altos, pasa banda, rechaza banda, corte y orden, filtro ideal y Gibbs, FIR e IIR, Butterworth, fase cero), filtros de Hodrick–Prescott y Baxter–King, cómo proponer un filtro, caso integrador con El Niño, formulario y checklist.
- **Cada proceso explicado de varias formas**: 31 demostraciones paso a paso, **31 ejemplos a mano guiados** con la tabla iluminada (del periodograma por sumas y por regresión, Daniell simple y modificado, Yule–Walker desde la ACF, la fase en varias frecuencias, el orden de un Butterworth a partir de requisitos, los pesos de un FIR y de Baxter–King…), 14 ejemplos resueltos, 13 intuiciones, 18 dudas frecuentes, 13 recuadros de «Cuidado» y 9 preguntas tipo examen con respuesta modelo.
- **33 bloques de código Python** con su salida real (numpy, scipy.signal, statsmodels) sobre manchas solares, El Niño, CO₂ de Mauna Loa, datos macroeconómicos de EE. UU. y AirPassengers.
- **31 gráficas interactivas** (calculadas en el navegador con `assets/js/ts3.js`, verificado contra scipy y statsmodels: periodograma, Welch, espectro cruzado, coherencia, Butterworth, `filtfilt`, `firwin`, Hodrick–Prescott, Baxter–King…), entre ellas una calculadora de periodos y frecuencias y un diseñador de filtros a partir de requisitos, todas con «Cómo leer esta gráfica» y vista extra, y **4 simuladores de Python** (`periodogram`, `welch`, `coherence` y `butter` + `filtfilt`).
- **74 ejercicios** en 9 bloques (básicos, intermedios y retos), con respuesta explicada y enlace al tema, y **8 preguntas de respuesta abierta**.
- Enlaces **⇠ Unidad I** y **⇠ Unidad II** a lo que ya se estudió (autocovarianza, ruido blanco, AR(2) con raíces complejas, sobrediferenciación…).

### Laboratorio

- **Página de inicio** (`laboratorio.html`) para elegir el dataset. Por ahora está disponible **Manchas solares**; AirPassengers, CO₂ de Mauna Loa, Macroeconomía de EE. UU. y el caudal del Nilo aparecen como «Próximamente».
- **Manchas solares, 1700–2008** (`lab-manchas-solares.html`): un análisis completo de principio a fin, con introducción, objetivo general y criterios de éxito, **46 pastillas** en 9 fases (exploración y transformación, estacionalidad contra ciclo, estacionariedad, partición y referencias, modelos ARMA/SARIMA/ARIMA, validación cruzada e intervalos, dominio de la frecuencia, filtros y pronóstico final 2009–2030) y **Resultados generales** al final.
- Cada pastilla dice qué se **aplica** y para qué, explica cada parámetro, tiene un triángulo para **ver el código**, muestra la salida real de Python con su gráfica o tabla, explica qué dicen los valores y decide el siguiente paso.
- **Prueba y error con colores**: 🔵 exploración, ✅ logrado, 🟡 funciona con reservas, ❌ descartado. Las suposiciones del analista que no resultaron (logaritmo, estacionalidad de 11 años, diferenciar, MAPE, λ = 6.25…) se prueban y se descartan con los resultados.
- Solo usa pandas, numpy, statsmodels, scipy, statsforecast y scikit-learn; las 43 gráficas y 7 tablas son fijas (calculadas al generar la página). Los números del texto se insertan desde el propio cálculo, así que siempre coinciden con la salida.
- Enlaces **📚 Repasa** de cada pastilla al tema correspondiente de las unidades.

### En las tres unidades

- **Explicación de cada símbolo** al pasar el cursor (o tocar) las fórmulas.
- Enlaces ↩ / ↪ entre temas con botón «Volver a donde estabas».
- Índice lateral, botón para marcar cada sección como estudiada, checklist y botón para copiar el código; el avance se guarda en el navegador.
- Diseño adaptable a celular.

## Cómo verla

- **GitHub Pages**: *Settings → Pages → Build and deployment → Deploy from a branch*, elige la rama `main` y la carpeta `/ (root)`. La dirección principal del sitio abre el Inicio; la Unidad I está en `.../unidad1.html`, la Unidad II en `.../unidad2.html`, la Unidad III en `.../unidad3.html`, y así las demás páginas.
- **En tu computadora**: abre `index.html` en el navegador y navega desde el menú. Necesita internet para cargar KaTeX y Plotly desde el CDN.

## Estructura

```
index.html               Inicio: temario, ruta de estudio y avance (generada, no editar a mano)
unidad1.html             Unidad I (generada, no editar a mano)
unidad2.html             Unidad II (generada, no editar a mano)
unidad3.html             Unidad III (generada, no editar a mano)
laboratorio.html         inicio del Laboratorio (generada)
lab-manchas-solares.html flujo de Manchas solares (generada)
preguntas-tipo.html      las 21 preguntas de la guía oficial (generada)
practica.html            simulacro, interpretar salidas y repaso de errores (generada)
repaso.html              hojas de repaso (generada)
assets/datos/            banco de ejercicios de cada unidad e índice del buscador (generados)
assets/css/estilos.css   diseño
assets/js/ts.js          cálculos de la Unidad I (ACF, PACF, ADF, KPSS, Ljung–Box…)
assets/js/ts2.js         cálculos de la Unidad II (polinomios y raíces, ACF/PACF teóricas, simulación
                         ARMA/SARIMA/ARCH, pronóstico con pesos ψ, verosimilitud, Box–Cox, Jarque–Bera,
                         ARCH-LM, métricas…)
assets/js/ts3.js         cálculos de la Unidad III (FFT, periodograma, Daniell, Welch, espectro cruzado y
                         coherencia, espectros ARMA y AR por Yule–Walker, respuesta de filtros, lfilter,
                         filtfilt, Butterworth, firwin, muesca, Hodrick–Prescott, Baxter–King…)
assets/js/ui.js          explicación de símbolos, enlaces, índice, ejemplos guiados, ejercicios, modo ETS,
                         buscador, preguntas abiertas y avance de la portada
assets/js/practica.js    simulacro, generadores de salidas para interpretar y repaso de errores
assets/js/widgets.js     gráficas de la Unidad I y utilidades comunes
assets/js/widgets2.js    gráficas y simuladores de la Unidad II
assets/js/widgets3.js    gráficas y simuladores de la Unidad III
assets/js/lab.js         gráficas y tablas fijas del Laboratorio
fuente/unidad1/*.md      texto de la Unidad I (Markdown + fórmulas)
fuente/unidad2/*.md      texto de la Unidad II
fuente/unidad3/*.md      texto de la Unidad III
fuente/inicio/           portada (mapa del temario y ruta de estudio)
fuente/preguntas/        las 21 preguntas tipo con su respuesta modelo
fuente/practica/         página de práctica
fuente/repaso/           hojas de repaso (se arman con los formularios y resúmenes de cada unidad)
fuente/laboratorio/      texto del Laboratorio (inicio/ y un folder por dataset)
fuente/glosario.json     explicación de cada símbolo (compartido)
fuente/plantilla.html    plantilla de las páginas
fuente/cache/            resultados guardados de los cálculos de Python más lentos
fuente/build.py          genera las páginas
```

## Regenerar las páginas

```bash
pip install markdown-it-py pygments numpy pandas scipy statsmodels scikit-learn matplotlib arch statsforecast utilsforecast
cd fuente && npm install && cd ..
python3 fuente/build.py              # todo
python3 fuente/build.py u3           # solo la Unidad III (u1, u2 o u3)
python3 fuente/build.py u1 inicio repaso   # varias páginas (inicio, preguntas, practica, repaso…)
python3 fuente/build.py lab-manchas  # solo el flujo de Manchas solares (lab = inicio del Laboratorio)
```

Los bloques de Python marcados con `cache` (rejillas de modelos, validación con origen móvil, el caso de usuarios) se ejecutan una vez y su resultado se guarda en `fuente/cache/`; si cambias su código se vuelven a ejecutar. Los enlaces entre unidades (⇠ Unidad I, ⇠ Unidad II) usan `fuente/cache/anclas_u1.json`, `anclas_u2.json` y `anclas_u3.json`, que se actualizan cada vez que se genera la unidad correspondiente.

En el Laboratorio, cada paso es un bloque `:::pastilla estado | título | enlaces` con secciones `@@ Parámetros`, `@@ Código`, `@@ Resultado`, `@@ Lectura` y `@@ Decisión`; el estado (`azul`, `verde`, `amarillo` o `rojo`) da el color. Dentro del texto, `{{=expresión|formato}}` inserta un valor calculado por el código de Python.

Marcas propias del Markdown que usan las páginas nuevas:

- `## Título {#id .prof}` o `### Título {#id .prof}`: tema de **profundización** (se oculta en modo ETS). Sin `.prof`, el tema es esencial.
- `:::abierta Verbo | [[tema]]` con el enunciado, `---`, la respuesta modelo, `+++` y la lista de puntos que debe tener: pregunta de respuesta abierta.
- `:::temario` (líneas `# Grupo` o `inciso | tema | u1:ancla u2:ancla | nota`) y `:::ruta` (líneas `título | anclas | nota | minutos extra`): el mapa del temario y la ruta de estudio de la portada.
- `@@REPASO:u1@@`: inserta la hoja de repaso de una unidad (sus resúmenes y su formulario).
- Un `:::resumen` sin id es el resumen de su sección; con `{#id}` pertenece a su subtema y, si este es de profundización, se marca igual en las hojas de repaso.

Los datos de la Unidad III y del Laboratorio vienen de `statsmodels.datasets` (manchas solares, El Niño, CO₂ y macrodata), así que no hace falta internet para generarla.
