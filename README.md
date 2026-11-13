# Guía de estudio · Análisis de Series de Tiempo

Página web interactiva para preparar el ETS de Análisis de Series de Tiempo. Tiene tres unidades y un Laboratorio, cada uno en su propia página y con un menú arriba para cambiar de uno a otro:

| Página | Unidad |
|---|---|
| `index.html` | **Unidad I · Características de series de tiempo** |
| `unidad2.html` | **Unidad II · Procesos lineales en tiempo discreto: AR, MA, ARMA, ARIMA, SARIMA y SARIMAX** |
| `unidad3.html` | **Unidad III · Análisis espectral y filtrado** |
| `laboratorio.html` | **Laboratorio · análisis completos con datasets reales** |

## Qué incluye

### Unidad I

- **13 secciones**: herramientas matemáticas, qué es una serie de tiempo, visualización (incluida la gráfica de subseries), componentes y descomposición clásica, STL (LOESS a mano, el algoritmo, sus parámetros, versión robusta, fuerza de tendencia y estacionalidad) y pronóstico por descomposición, estadísticos básicos, estacionariedad (ruido blanco, AR(1), paseo aleatorio, raíz unitaria, tendencia determinística vs. estocástica, diferenciación), pruebas ADF y KPSS, ACF y PACF, Ljung–Box, caso integrador con AirPassengers y formulario.
- **Demostraciones paso a paso** (cada paso con su justificación) y **20 ejemplos a mano guiados**: con «▶ Recorrer paso a paso» la tabla de datos ilumina en amarillo lo que usa cada paso y en verde lo que calcula.
- **Tabla interactiva del dataset AirPassengers** enlazada con su gráfica.
- **Código Python** con su salida real (se ejecuta al generar la página).
- **39 gráficas interactivas**, calculadas en el navegador con las mismas fórmulas que `statsmodels` (STL incluido, verificado contra `statsmodels.tsa.seasonal.STL`), cada una con su sección «Cómo leer esta gráfica» y, en la mayoría, una «vista extra» (gráfica o tabla enlazada) que muestra de dónde salen los números.
- **9 simuladores de Python** (`rolling`, `seasonal_decompose`, `STL`, transformaciones, `adfuller`, `kpss`, `plot_acf`/`plot_pacf`, `acf`, `acorr_ljungbox`).
- **54 ejercicios** con botón de respuesta y explicación.

### Unidad II

- **22 secciones**: repaso y herramientas (filtro lineal, números complejos, esperanza condicional), **pronósticos de referencia antes de cualquier modelo** (partición temporal, MAE y RMSE a mano, `HistoricAverage`, `Naive`, `SeasonalNaive`, `RandomWalkWithDrift`, `WindowAverage`, `SeasonalWindowAverage` y suavizamiento exponencial simple, el flujo de `statsforecast`, residuales, intervalos de predicción, referencias en logaritmo y por descomposición STL, árbol de decisión para elegir la referencia y errores frecuentes), operador rezago y polinomios, AR(p) (media, triángulo de estacionariedad, Yule–Walker, pseudo-ciclos, PACF), MA(q) e invertibilidad, ARMA y pesos ψ, metodología Box–Jenkins, transformaciones (log, Box–Cox, regreso a la escala original, sobrediferenciación), ARIMA (deriva, ARIMA(0,1,1) = suavizamiento exponencial, las referencias como ARIMA pequeños, pronóstico e intervalos), SARIMA y el modelo de aerolínea, variables exógenas (ARMAX contra regresión con errores SARIMA, fuga de información, festivos), máxima verosimilitud, AIC/BIC/HQIC y cuándo se pueden comparar, el `summary()` de SARIMAX renglón por renglón, diagnóstico de residuos (Ljung–Box con `model_df`, Jarque–Bera, prueba H), ARCH/GARCH y ARCH-LM, validación temporal (un paso contra varios pasos, estrategias, origen móvil y `cross_validation` de statsforecast), métricas (MAE, MSE, RMSE, MAPE, sMAPE, MASE y la comparación completa contra las referencias con `utilsforecast`), dos casos integradores (AirPassengers de principio a fin y usuarios diarios con días festivos), formulario y checklist.
- **Cada proceso explicado de varias formas**: 45 demostraciones paso a paso, **45 ejemplos a mano guiados** con la tabla iluminada, 21 ejemplos resueltos, 13 intuiciones, 25 dudas frecuentes y 24 recuadros de «Cuidado».
- **52 bloques de código Python** con su salida real (statsmodels, scipy, scikit-learn, statsforecast y utilsforecast).
- **48 gráficas interactivas** (calculadas en el navegador con `assets/js/ts2.js`, verificado contra statsmodels, scipy y statsforecast), todas con «Cómo leer esta gráfica» y vista extra, y **6 simuladores de Python** (`ArmaProcess`, `boxcox`, `ARIMA`, `plot_diagnostics`, `sklearn.metrics` y `StatsForecast`).
- **86 ejercicios** en 11 bloques (básicos, intermedios y retos), con respuesta explicada y enlace al tema.
- Enlaces **⇠ Unidad I** a lo que ya se estudió (ruido blanco, estacionariedad, ACF, Ljung–Box…).

### Unidad III

- **16 secciones**: herramientas (oscilación, amplitud y fase, Euler, ortogonalidad, Nyquist y alias, tres convenciones de frecuencia), periodicidad contra ciclo (manchas solares), dominio del tiempo y dominio de la frecuencia, densidad espectral (ruido blanco, MA(1), AR(1), pico del AR(2), ARMA, varianza por bandas), transformada de Fourier y periodograma (Parseval, distribución ji-cuadrada, fuga y ventanas), estimación no paramétrica (Daniell, ancho de banda, intervalos, afilado, Welch), estimación paramétrica (AR por Yule–Walker y orden por AIC), AirPassengers en frecuencia y armónicos, espectro cruzado (magnitud, fase, retardo, coherencia y su umbral), filtros lineales (respuesta al impulso, función de transferencia, ganancia y fase, $f_y = \lvert A\rvert^2 f_x$), tipos de filtros (pasa bajos, pasa altos, pasa banda, rechaza banda, corte y orden, filtro ideal y Gibbs, FIR e IIR, Butterworth, fase cero), filtros de Hodrick–Prescott y Baxter–King, cómo proponer un filtro, caso integrador con El Niño, formulario y checklist.
- **Cada proceso explicado de varias formas**: 28 demostraciones paso a paso, **29 ejemplos a mano guiados** con la tabla iluminada (del periodograma por sumas y por regresión, Daniell simple y modificado, Yule–Walker desde la ACF, la fase en varias frecuencias, el orden de un Butterworth a partir de requisitos, los pesos de un FIR y de Baxter–King…), 13 ejemplos resueltos, 10 intuiciones, 18 dudas frecuentes, 12 recuadros de «Cuidado» y 9 preguntas tipo examen con respuesta modelo.
- **30 bloques de código Python** con su salida real (numpy, scipy.signal, statsmodels) sobre manchas solares, El Niño, CO₂ de Mauna Loa, datos macroeconómicos de EE. UU. y AirPassengers.
- **31 gráficas interactivas** (calculadas en el navegador con `assets/js/ts3.js`, verificado contra scipy y statsmodels: periodograma, Welch, espectro cruzado, coherencia, Butterworth, `filtfilt`, `firwin`, Hodrick–Prescott, Baxter–King…), entre ellas una calculadora de periodos y frecuencias y un diseñador de filtros a partir de requisitos, todas con «Cómo leer esta gráfica» y vista extra, y **4 simuladores de Python** (`periodogram`, `welch`, `coherence` y `butter` + `filtfilt`).
- **70 ejercicios** en 8 bloques (básicos, intermedios y retos), con respuesta explicada y enlace al tema.
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

- **GitHub Pages**: *Settings → Pages → Build and deployment → Deploy from a branch*, elige la rama `main` y la carpeta `/ (root)`. La Unidad I queda en la dirección principal del sitio, la Unidad II en `.../unidad2.html`, la Unidad III en `.../unidad3.html` y el Laboratorio en `.../laboratorio.html`.
- **En tu computadora**: abre `index.html`, `unidad2.html`, `unidad3.html` o `laboratorio.html` en el navegador. Necesita internet para cargar KaTeX y Plotly desde el CDN.

## Estructura

```
index.html               Unidad I (generada, no editar a mano)
unidad2.html             Unidad II (generada, no editar a mano)
unidad3.html             Unidad III (generada, no editar a mano)
laboratorio.html         inicio del Laboratorio (generada)
lab-manchas-solares.html flujo de Manchas solares (generada)
assets/css/estilos.css   diseño
assets/js/ts.js          cálculos de la Unidad I (ACF, PACF, ADF, KPSS, Ljung–Box…)
assets/js/ts2.js         cálculos de la Unidad II (polinomios y raíces, ACF/PACF teóricas, simulación
                         ARMA/SARIMA/ARCH, pronóstico con pesos ψ, verosimilitud, Box–Cox, Jarque–Bera,
                         ARCH-LM, métricas…)
assets/js/ts3.js         cálculos de la Unidad III (FFT, periodograma, Daniell, Welch, espectro cruzado y
                         coherencia, espectros ARMA y AR por Yule–Walker, respuesta de filtros, lfilter,
                         filtfilt, Butterworth, firwin, muesca, Hodrick–Prescott, Baxter–King…)
assets/js/ui.js          explicación de símbolos, enlaces, índice, ejemplos guiados y ejercicios
assets/js/widgets.js     gráficas de la Unidad I y utilidades comunes
assets/js/widgets2.js    gráficas y simuladores de la Unidad II
assets/js/widgets3.js    gráficas y simuladores de la Unidad III
assets/js/lab.js         gráficas y tablas fijas del Laboratorio
fuente/unidad1/*.md      texto de la Unidad I (Markdown + fórmulas)
fuente/unidad2/*.md      texto de la Unidad II
fuente/unidad3/*.md      texto de la Unidad III
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
python3 fuente/build.py lab-manchas  # solo el flujo de Manchas solares (lab = inicio del Laboratorio)
```

Los bloques de Python marcados con `cache` (rejillas de modelos, validación con origen móvil, el caso de usuarios) se ejecutan una vez y su resultado se guarda en `fuente/cache/`; si cambias su código se vuelven a ejecutar. Los enlaces entre unidades (⇠ Unidad I, ⇠ Unidad II) usan `fuente/cache/anclas_u1.json`, `anclas_u2.json` y `anclas_u3.json`, que se actualizan cada vez que se genera la unidad correspondiente.

En el Laboratorio, cada paso es un bloque `:::pastilla estado | título | enlaces` con secciones `@@ Parámetros`, `@@ Código`, `@@ Resultado`, `@@ Lectura` y `@@ Decisión`; el estado (`azul`, `verde`, `amarillo` o `rojo`) da el color. Dentro del texto, `{{=expresión|formato}}` inserta un valor calculado por el código de Python.

Los datos de la Unidad III y del Laboratorio vienen de `statsmodels.datasets` (manchas solares, El Niño, CO₂ y macrodata), así que no hace falta internet para generarla.
