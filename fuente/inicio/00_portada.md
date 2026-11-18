<section class="portada" id="inicio">
<span class="etiqueta">📘 Guía de estudio · ETS de Análisis de Series de Tiempo</span>
<h1>Análisis de Series de Tiempo</h1>
<p class="bajada">Tres unidades, un laboratorio y práctica de examen. Sigue la <b>ruta de estudio</b>, enciende el <b>modo ETS</b> para ver solo lo que entra al examen y usa las <b>preguntas tipo</b> y el <b>simulacro</b> para comprobar que ya puedes responder por escrito.</p>
<div class="avance-global" id="avance-global"></div>
<div class="accesos">
<a class="acceso" id="continuar" href="unidad1.html" hidden><span class="ac-ico">▶️</span><span class="ac-titulo">Continuar donde te quedaste</span><span class="ac-texto">Vuelve al último tema que estabas leyendo.</span><span class="ac-dato"></span></a>
<a class="acceso" href="preguntas-tipo.html"><span class="ac-ico">🎯</span><span class="ac-titulo">Preguntas tipo</span><span class="ac-texto">Las 21 preguntas de la guía oficial, con respuesta modelo y los puntos que debe tener.</span><span class="ac-dato" data-dato="abiertas"></span></a>
<a class="acceso" href="practica.html#simulacro"><span class="ac-ico">⏱️</span><span class="ac-titulo">Simulacro de examen</span><span class="ac-texto">15 ejercicios al azar de las tres unidades, calificados al final por unidad y por tema.</span><span class="ac-dato" data-dato="simulacro"></span></a>
<a class="acceso" href="practica.html#errores"><span class="ac-ico">🔁</span><span class="ac-titulo">Repasar mis errores</span><span class="ac-texto">Solo los ejercicios que has fallado; salen de la lista cuando los aciertas.</span><span class="ac-dato" data-dato="errores"></span></a>
<a class="acceso" href="practica.html#interpretar"><span class="ac-ico">📊</span><span class="ac-titulo">Interpretar salidas</span><span class="ac-texto">ACF y PACF, ADF con KPSS, Ljung–Box, <code>summary()</code> y periodogramas generados al azar.</span></a>
<a class="acceso" href="repaso.html"><span class="ac-ico">🗒️</span><span class="ac-titulo">Hojas de repaso</span><span class="ac-texto">Lo esencial de cada unidad en una vista, lista para imprimir.</span></a>
<a class="acceso" href="laboratorio.html"><span class="ac-ico">🧪</span><span class="ac-titulo">Laboratorio</span><span class="ac-texto">Un análisis completo, de principio a fin, con un dataset real.</span></a>
</div>
</section>

## 🧭 Cómo estudiar con esta guía {#como-estudiar}

<div class="como-usar">
<div class="tarjeta"><h3>🎯 Modo ETS</h3><p>El interruptor de la barra superior deja a la vista lo que aparece en la <b>Guía para ETS</b> y pliega la <b>profundización</b> (demostraciones largas, STL, filtros económicos, statsforecast…). Cada bloque plegado conserva un botón para abrirlo. Los tiempos y el avance se recalculan con el modo encendido.</p></div>
<div class="tarjeta"><h3>🔎 Buscador</h3><p>La lupa (o la tecla <b>/</b>) busca en los títulos, las definiciones y los símbolos de las tres unidades y te lleva a la sección. Sirve como diccionario: escribe «coherencia» o «invertibilidad».</p></div>
<div class="tarjeta"><h3>✍️ Practica por escrito</h3><p>El examen pide <i>explicar, comparar, interpretar y proponer</i>. Además de la opción múltiple, cada unidad tiene preguntas de respuesta abierta: escribes, comparas con la respuesta modelo y te calificas.</p></div>
<div class="tarjeta"><h3>✅ Marca tu avance</h3><p>Al final de cada sección hay un botón para marcarla como estudiada. Esta portada lee esas marcas: te dice qué incisos del temario ya cubriste y qué sesión sigue. Todo se guarda en este navegador.</p></div>
</div>

## 🗓️ Ruta de estudio por sesiones {#ruta}

Doce sesiones de estudio y tres de práctica, de lo esencial a lo complementario. El tiempo de cada sesión cambia con el modo ETS: con el modo encendido cuenta solo lo que entra al examen; con el modo apagado, el texto completo. Una sesión se marca sola cuando terminas todas sus secciones.

<p class="aviso-ets">🎯 Modo ETS encendido: los tiempos cuentan solo lo esencial.</p>

:::ruta
Unidad I · Qué es una serie, cómo se ve y cómo se mide | u1:serie u1:visualizacion u1:componentes u1:estadisticos | Naturaleza de la serie, componentes, modelos aditivo y multiplicativo, media, varianza, autocovarianza y autocorrelación.
Unidad I · Estacionariedad y sus pruebas | u1:estacionariedad u1:pruebas | Estacionariedad débil, ruido blanco, paseo aleatorio, raíz unitaria, diferenciación, ADF, KPSS y su lectura conjunta.
Unidad I · ACF, PACF, Ljung–Box y caso integrador | u1:acf-pacf u1:ljung-box u1:caso u1:formulario u1:ejercicios | Cierra la unidad con el caso de AirPassengers y los ejercicios.
Unidad II · Operador rezago, AR y MA | u2:herramientas2 u2:referencia u2:operador-l u2:ar u2:ma | Ruido blanco, pronósticos ingenuos, polinomios en L, estacionariedad e invertibilidad.
Unidad II · ARMA, identificación, transformaciones, ARIMA y SARIMA | u2:arma u2:box-jenkins u2:transformaciones u2:arima u2:sarima | Box–Jenkins, logaritmo y Box–Cox, diferencias, sobrediferenciación y el modelo de aerolínea.
Unidad II · Exógenas, estimación y diagnóstico | u2:exogenas u2:mv u2:aic-bic u2:summary u2:diagnostico u2:arch | ARMAX y SARIMAX, máxima verosimilitud, AIC y BIC, lectura del `summary()`, residuos y ARCH.
Unidad II · Validación, métricas y casos | u2:validacion u2:metricas u2:caso-ap u2:caso-usuarios u2:formulario2 | Partición temporal, un paso contra varios, MAE, RMSE, MAPE, sMAPE y MASE, y los dos casos integradores.
Unidad II · Ejercicios | u2:ejercicios2 | Los bloques de ejercicios y las preguntas abiertas de la unidad.
Unidad III · Frecuencia, periodicidad y densidad espectral | u3:herramientas3 u3:periodicidad u3:dominios u3:densidad | Periodicidad contra ciclo, dominio del tiempo y de la frecuencia, y cómo se lee un espectro.
Unidad III · Estimar el espectro y espectro cruzado | u3:periodograma u3:no-parametrico u3:parametrico u3:cruzado | Fourier, periodograma, Welch, estimación paramétrica, magnitud, fase y coherencia.
Unidad III · Filtros y caso integrador | u3:filtros-lineales u3:tipos-filtros u3:proponer-filtro u3:caso-elnino u3:formulario3 | Respuesta al impulso, función de transferencia, los cuatro tipos de filtro y cómo proponer uno.
Unidad III · Ejercicios | u3:ejercicios3 | Los bloques de ejercicios y las preguntas abiertas de la unidad.
Práctica · Las 21 preguntas tipo | preguntas:pt-u1 preguntas:pt-u2 preguntas:pt-u3 | Responde por escrito antes de abrir la respuesta modelo y califícate con la lista de puntos.
Práctica · Simulacro y repaso de errores | | Haz un [simulacro](practica.html#simulacro), revisa en qué unidad fallaste y vacía tu lista en [Repasar mis errores](practica.html#errores). Repite hasta sacar 8 o más. | 90
Práctica · Hojas de repaso e interpretar salidas | | Lee las [hojas de repaso](repaso.html) de las tres unidades y resuelve diez salidas en [Interpretar salidas](practica.html#interpretar). Es la sesión de la víspera. | 75
:::

Lo complementario, para una segunda vuelta con el modo ETS apagado: los bloques marcados como **profundización** en cada unidad el [Laboratorio de manchas solares](lab-manchas-solares.html), que recorre un análisis completo con las herramientas de las tres unidades, y el [Laboratorio · Viento por unidades](lab-viento-unidades.html), que repasa la materia **tema por tema, en el orden del temario**, con datos reales de un aerogenerador.

## 🎯 Mapa de la Guía para ETS {#mapa-guia}

Cada tema de la guía oficial del examen y la sección donde se estudia. La columna de avance se llena con las secciones que marcas como estudiadas.

:::temario
# Unidad I · Características de series de tiempo
I.1 | Naturaleza de una serie de tiempo | u1:serie
I.2 | Componentes principales | u1:componentes
I.3 | Características estadísticas básicas | u1:estadisticos
I.4 | Concepto de estacionariedad | u1:estacionariedad
I.5 | Pruebas ADF, KPSS y diagnóstico de estacionariedad | u1:pruebas
I.6 | Análisis de autocorrelación: ACF y PACF | u1:acf-pacf
I.7 | Prueba de Ljung–Box | u1:ljung-box
# Unidad II · Procesos lineales en tiempo discreto
II.1 | Ruido blanco | u2:ruido-blanco2
II.2 | Modelos AR, MA y ARMA | u2:ar u2:ma u2:arma
II.3 | ARIMA y diferenciación | u2:arima u2:diferenciar2
II.4 | Transformaciones | u2:transformaciones
II.5 | SARIMA y SARIMAX | u2:sarima u2:exogenas
II.6 | ARMAX | u2:armax
II.7 | Estimación por máxima verosimilitud, AIC y BIC | u2:mv u2:aic-bic
II.8 | Diagnóstico de residuos | u2:diagnostico u2:summary
II.9 | Heterocedasticidad y ARCH | u2:arch
II.10 | Pronóstico y validación temporal | u2:validacion
II.11 | Métricas de pronóstico | u2:metricas
# Unidad III · Análisis espectral y filtrado
III.1 | Periodicidad y ciclo | u3:periodicidad
III.2 | Dominio del tiempo vs dominio de la frecuencia | u3:dominios
III.3 | Densidad espectral | u3:densidad
III.4 | Transformada de Fourier y periodograma, Welch y métodos paramétricos | u3:periodograma u3:no-parametrico u3:parametrico
III.5 | Series múltiples, espectro cruzado y coherencia | u3:cruzado
III.6 | Filtrado | u3:filtros-lineales u3:tipos-filtros u3:proponer-filtro
# Flujo práctico en Python y cierre
Flujo | Los nueve pasos del flujo práctico, con AirPassengers | u1:caso u2:caso-ap | El [Laboratorio](lab-manchas-solares.html) repite el flujo con otra serie.
Preguntas | Las 21 preguntas tipo | preguntas:pt-u1 preguntas:pt-u2 preguntas:pt-u3
Checklist | Checklist final de estudio | u1:checklist u2:checklist2 u3:checklist3
:::

## 🏛️ Mapa del programa de estudios del IPN {#mapa-temario}

Los incisos del programa oficial de la unidad de aprendizaje. Los que dicen **profundización** no aparecen en la Guía para ETS: están en la guía para completar los apuntes y quedan plegados en el modo ETS.

:::temario
# Unidad I · Características de series de tiempo
1.1.1 | Visualización gráfica de una serie de tiempo | u1:visualizacion u1:pandas
1.1.2 | Modelos estadísticos de series de tiempo | u1:componentes u1:ruido-blanco u1:ar1 u1:paseo
1.1.3 | Medidas de dependencia | u1:autocov u1:autocorr
1.1.4 | Series de tiempo estacionarias | u1:estacionariedad
1.1.5 | Estimación de correlación | u1:acf-pacf u1:ljung-box
1.2.1 | Alcances de las pruebas estadísticas y estacionariedad como propiedad de escala | u1:hipotesis u1:conjunta u1:potencia
1.2.2 | Estacionariedad de la media, homoscedasticidad y estacionariedad en sentido amplio | u1:debil u1:moviles
1.2.3 | Estacionariedad en sentido amplio: razones de su existencia e implicaciones | u1:importancia u1:no-plana
1.2.4 | Pruebas de tendencia y ruptura en la media, para homoscedasticidad y función de autocorrelación estacionaria | u1:adf u1:kpss u1:rupturas u1:prueba-tendencia u1:pruebas-ruptura u1:pruebas-varianza u1:mapa-pruebas
# Unidad II · Procesos lineales en tiempo discreto
2.1.1 | Procesos autorregresivos | u2:ar
2.1.2 | Procesos de promedio móvil | u2:ma
2.1.3 | Procesos de media móvil autorregresiva (ARMA) | u2:arma u2:operador-l
2.1.4 | Estimación de parámetros en modelos ARMA | u2:mv u2:ar-estimar u2:aic-bic u2:summary
2.2 | Pronósticos con modelos ARMA | u2:arima-pronostico u2:validacion u2:metricas
2.3 | Procesos dependientes de variables externas (ARMAX) | u2:exogenas u2:caso-usuarios
2.4 | Evaluación de órdenes de integración: ARIMA | u2:arima u2:transformaciones u2:box-jenkins u2:sarima
# Unidad III · Análisis espectral y filtrado
3.1 | Comportamiento cíclico y periodicidad | u3:periodicidad u3:dominios
3.1.1 | Densidad espectral | u3:densidad
3.1.2 | Periodograma y transformada de Fourier discreta | u3:periodograma
3.2.1 | Estimación espectral paramétrica | u3:parametrico
3.2.2 | Estimación espectral no paramétrica | u3:no-parametrico
3.3 | Series múltiples y espectros cruzados | u3:cruzado
3.4.1 | Filtros lineales | u3:filtros-lineales u3:tipos-filtros u3:proponer-filtro
3.4.2 | Modelos de regresión con retraso | u3:ccf u3:regresion-retraso
3.4.3 | Extracción de señales y filtro óptimo | u3:senal-ruido u3:wiener u3:filtros-economia
:::

### Relación de prácticas {#practicas}

:::temario
1 | Análisis descriptivo y exploratorio de series de tiempo | u1:visualizacion u1:caso
2 | Series de tiempo estacionarias y no estacionarias | u1:estacionariedad u1:pruebas
3 | Regresión lineal en contexto de series de tiempo | u1:regresion-tendencia u1:tendencias
4 | Suavizamiento de series de tiempo | u1:moviles u2:ref-ventanas u2:holt
6 | Construcción de modelos ARIMA | u2:box-jenkins u2:caso-ap
7 | Inferencia de parámetros en modelos ARIMA | u2:mv u2:summary
8 | Pronósticos con modelos ARIMA | u2:arima-pronostico u2:validacion
9 | Periodograma y transformada de Fourier discreta | u3:periodograma
10 | Filtrado de series de tiempo | u3:tipos-filtros u3:proponer-filtro
11 | Extracción de señales | u3:caso-elnino u3:wiener
:::
