<section class="portada" id="inicio">
<span class="etiqueta">🎯 Preguntas tipo del ETS</span>
<h1>Las 21 preguntas tipo, con respuesta modelo</h1>
<p class="bajada">Son las preguntas que trae la Guía para ETS. Úsalas como en el examen: escribe tu respuesta, abre la respuesta modelo, palomea los puntos que sí incluiste y califícate. Las que marques «a medias» o «mal» se van a tu lista de errores.</p>
<ul class="insignias"><li>✍️ Escribe antes de mirar</li><li>📝 Respuesta modelo de 4 a 8 renglones</li><li>☑️ Puntos que debe tener</li><li>↗ Enlace al tema</li></ul>
<div class="como-usar">
<div class="tarjeta"><h3>Cómo se califica una respuesta abierta</h3><p>Una buena respuesta <b>define</b> el concepto, da la <b>regla de decisión</b> o la fórmula cuando aplica, y cierra con <b>qué se hace</b> con el resultado. Si te faltó uno de los puntos de la lista, márcala «a medias».</p></div>
<div class="tarjeta"><h3>Tu respuesta se guarda</h3><p>Lo que escribes y tu calificación se quedan en este navegador. Puedes volver otro día y comparar cómo respondes ahora.</p></div>
</div>
</section>

<div class="pt-resumen" id="pt-resumen"><div class="pt-datos m-datos"></div><button type="button">Ver solo las que no domino</button></div>

## Unidad I · Características de series de tiempo {#pt-u1}

:::abierta Pregunta 1 | [[u1:serie]] {#pt-1}
**¿Por qué un conjunto de datos indexados por tiempo no necesariamente es una serie de tiempo en sentido estadístico?**
---
Una serie de tiempo es una **realización de un proceso estocástico** indexado en el tiempo: una misma variable, medida de forma comparable, en instantes ordenados y con frecuencia regular (o justificadamente irregular). Tener una columna de fecha no basta. Si cada renglón es una entidad distinta (clientes con su fecha de alta), si la variable o la unidad de medida cambia, o si las observaciones son independientes entre sí, el orden no aporta información: se podrían barajar los renglones sin perder nada. En una serie de tiempo el pasado puede influir en el presente, por eso **no se vale barajar** y la validación debe respetar la secuencia temporal. Además se necesita el contexto del fenómeno para interpretar tendencia, estacionalidad, ciclos, rupturas y atípicos.
+++
- Define la serie como trayectoria observada de un proceso estocástico indexado en el tiempo.
- Menciona los elementos mínimos: índice ordenado, frecuencia, una variable cuantitativa medida de forma comparable.
- Señala la dependencia temporal y la diferencia con datos i.i.d. (no se puede barajar).
- Da un contraejemplo de datos con fecha que no son serie de tiempo.
:::

:::abierta Pregunta 2 | [[u1:componentes]] {#pt-2}
**Diferencie tendencia, estacionalidad, ciclo y ruido, con un ejemplo de cada uno.**
---
La **tendencia** es el movimiento sostenido del nivel medio, ascendente o descendente: el crecimiento de los pasajeros de avión entre 1949 y 1960. La **estacionalidad** es un patrón que se repite con **periodo fijo y conocido**: el pico de pasajeros cada julio y agosto ($s = 12$ en datos mensuales). El **ciclo** es una oscilación recurrente cuya duración y amplitud **varían**: el ciclo económico o el ciclo solar, de 7 a 17 años. El **ruido** es la variación aleatoria que queda sin explicar por la estructura sistemática. Se combinan de forma aditiva, $y_t = T_t + S_t + C_t + \varepsilon_t$, o multiplicativa, $y_t = T_t \times S_t \times \varepsilon_t$, cuando la amplitud crece con el nivel. La diferencia entre estacionalidad y ciclo decide el modelo: solo un periodo fijo justifica una diferencia estacional o un SARIMA.
+++
- Tendencia: cambio sostenido del nivel, con ejemplo.
- Estacionalidad: periodo fijo y conocido, con ejemplo y valor de $s$.
- Ciclo: duración o amplitud variables, con ejemplo.
- Ruido: variación aleatoria no explicada.
- Menciona el modelo aditivo o el multiplicativo.
:::

:::abierta Pregunta 3 | [[u1:debil]] {#pt-3}
**Defina estacionariedad débil y explique por qué es importante para los modelos ARMA.**
---
Una serie es **débilmente estacionaria** si su media es constante, $\E[y_t] = \mu$; su varianza es constante y finita, $\Var(y_t) = \sigma^2$; y su autocovarianza depende solo de la distancia entre observaciones y no del momento, $\Cov(y_t, y_{t-k}) = \gamma(k)$. Estacionaria no significa plana: puede fluctuar mucho mientras esas propiedades no cambien. Importa para ARMA porque el modelo supone una **dependencia temporal estable**: con parámetros constantes solo puede describir una serie cuya media, varianza y autocorrelación no cambian, y solo así la ACF y la PACF se pueden estimar con una única realización. Si hay tendencia, raíz unitaria, varianza creciente o estacionalidad fuerte, el modelo confunde esa estructura con autocorrelación; primero se transforma o se diferencia (ARIMA, SARIMA).
+++
- Las tres condiciones: media constante, varianza constante y finita, autocovarianza que depende solo del rezago $k$.
- Aclara que estacionaria no significa plana.
- Explica que ARMA requiere dependencia estable (parámetros constantes; ACF y PACF bien definidas).
- Dice qué hacer si no se cumple: transformar o diferenciar.
:::

:::abierta Pregunta 4 | [[u1:conjunta]] {#pt-4}
**Compare las pruebas ADF y KPSS: hipótesis nulas e interpretación del p-value.**
---
Son pruebas complementarias con hipótesis nulas **opuestas**. En la **ADF** (Dickey–Fuller aumentada), $H_0$: la serie tiene raíz unitaria, es decir, **no es estacionaria**; si el p-value es menor que 0.05 se rechaza $H_0$ y hay evidencia a favor de la estacionariedad. En la **KPSS**, $H_0$: la serie **es estacionaria** alrededor de una constante o de una tendencia; si el p-value es menor que 0.05 se rechaza y hay evidencia en contra de la estacionariedad. Lectura conjunta: ADF rechaza y KPSS no rechaza, estacionaria; ADF no rechaza y KPSS rechaza, no estacionaria; ambas rechazan, estructura más compleja (ruptura, cambio de régimen o mala especificación); ninguna rechaza, evidencia insuficiente. En la ADF hay que elegir bien la especificación: con solo constante, una tendencia determinística se confunde con raíz unitaria.
+++
- $H_0$ de la ADF: raíz unitaria (no estacionaria); p < 0.05 favorece la estacionariedad.
- $H_0$ de la KPSS: estacionaria; p < 0.05 es evidencia contra la estacionariedad.
- Los cuatro casos de la lectura conjunta.
- Menciona la especificación (constante, constante y tendencia).
:::

:::abierta Pregunta 5 | [[u1:patrones]] {#pt-5}
**Interprete una ACF que cae lentamente y una PACF con un solo pico significativo.**
---
La PACF con un único pico significativo en el rezago 1 indica que, descontado el efecto de $y_{t-1}$, los rezagos anteriores ya no aportan: la dependencia directa es de orden 1. Si la ACF **decae de forma geométrica** hacia cero, el patrón es el de un **AR(1)** con $\phi$ positivo: $\rho(k) = \phi^k$ y la PACF se corta después del rezago 1. Si la ACF cae **muy lentamente**, casi en línea recta y con valores cercanos a 1 durante muchos rezagos, la lectura cambia: es la huella de una serie **no estacionaria** (tendencia o raíz unitaria, $\phi \approx 1$). En ese caso no se ajusta todavía un AR: se confirma con ADF y KPSS, se aplica una diferencia regular y se vuelven a leer la ACF y la PACF de la serie diferenciada.
+++
- PACF que se corta en 1: componente AR de orden 1.
- ACF con decaimiento geométrico: AR(1), $\rho(k) = \phi^k$.
- Decaimiento muy lento con valores cercanos a 1: señal de no estacionariedad.
- Siguiente paso: ADF y KPSS, diferenciar y volver a leer.
:::

:::abierta Pregunta 6 | [[u1:ljung-box]] {#pt-6}
**Explique qué evalúa la prueba de Ljung–Box y cómo se interpreta cuando se aplica a los residuos de un modelo.**
---
Ljung–Box es una prueba **conjunta**: evalúa si las autocorrelaciones hasta el rezago $h$ son todas cero, en lugar de revisarlas una por una. $H_0$: no hay autocorrelación hasta el rezago $h$; $H_1$: al menos una es distinta de cero. El estadístico $Q = n(n+2)\sum_{k=1}^{h} \hat{\rho}_k^2/(n-k)$ se compara con una $\chi^2$ con $h$ grados de libertad (menos el número de parámetros AR y MA cuando se aplica a residuos). Aplicada a los **residuos**, se desea un p-value **mayor que 0.05**: no hay evidencia de autocorrelación y los residuos son compatibles con ruido blanco. Un p-value menor que 0.05 indica dependencia temporal significativa: el modelo no capturó toda la estructura y hay que revisar los órdenes, la parte estacional o las transformaciones.
+++
- Es una prueba conjunta sobre varias autocorrelaciones.
- $H_0$: sin autocorrelación hasta el rezago $h$.
- En residuos se desea p > 0.05 (compatibles con ruido blanco).
- p < 0.05: quedó estructura sin modelar; se revisa el modelo.
:::

## Unidad II · Procesos lineales en tiempo discreto {#pt-u2}

:::abierta Pregunta 7 | [[u2:transformaciones]] {#pt-7}
**Justifique cuándo aplicar logaritmo, diferencia regular y diferencia estacional.**
---
El **logaritmo** se aplica cuando la variabilidad crece con el nivel (la amplitud estacional se abre con la tendencia): estabiliza la varianza y convierte relaciones multiplicativas en aditivas; exige valores positivos, y Box–Cox generaliza la idea. La **diferencia regular**, $\Delta y_t = y_t - y_{t-1}$, se aplica cuando hay tendencia o raíz unitaria: la ACF decae muy lentamente, la ADF no rechaza y la KPSS rechaza. La **diferencia estacional**, $\Delta_s y_t = y_t - y_{t-s}$, se aplica cuando hay un patrón de periodo fijo que persiste: picos en $s, 2s, 3s$ de la ACF que no se apagan ($s = 12$ mensual, 4 trimestral, 7 diario con patrón semanal). El orden es: primero el logaritmo, después las diferencias. Cada una se justifica con gráfica, ADF y KPSS y ACF, y se evita **sobrediferenciar**, que introduce autocorrelación negativa artificial y aumenta la varianza. Al pronosticar se regresa a la escala original.
+++
- Logaritmo: varianza que crece con el nivel; relación multiplicativa.
- Diferencia regular: tendencia o raíz unitaria, con su evidencia.
- Diferencia estacional: patrón de periodo fijo $s$.
- Advierte sobre la sobrediferenciación.
- Menciona regresar a la escala original.
:::

:::abierta Pregunta 8 | [[u2:arima-def]] {#pt-8}
**Describa los modelos AR, MA, ARMA, ARIMA, SARIMA, ARMAX y SARIMAX.**
---
**AR($p$)**: el valor actual se explica por una constante, sus $p$ valores pasados y un choque: $y_t = c + \sum_{i=1}^{p} \phi_i y_{t-i} + \varepsilon_t$. **MA($q$)**: se explica por el choque actual y $q$ choques pasados: $y_t = c + \varepsilon_t + \sum_{j=1}^{q} \theta_j \varepsilon_{t-j}$. **ARMA($p,q$)** combina ambos y requiere una serie ya estacionaria, con las raíces fuera del círculo unitario. **ARIMA($p,d,q$)** aplica $d$ diferencias regulares para volver estacionaria una serie con tendencia y ajusta un ARMA a la serie diferenciada. **SARIMA($p,d,q$)($P,D,Q$)$_s$** agrega términos AR y MA estacionales y $D$ diferencias estacionales de periodo $s$. **ARMAX** extiende ARMA con variables externas que ayudan a explicar la serie, y **SARIMAX** hace lo mismo sobre un SARIMA; las exógenas deben tener sentido predictivo y estar disponibles o ser pronosticables en el horizonte.
+++
- AR: rezagos de la propia serie; MA: rezagos de los choques.
- ARMA combina ambos y exige estacionariedad.
- ARIMA agrega la diferenciación regular ($d$).
- SARIMA agrega la parte estacional ($P, D, Q, s$).
- ARMAX y SARIMAX agregan variables exógenas y su requisito.
:::

:::abierta Pregunta 9 | [[u2:sarima-def]] {#pt-9}
**Explique qué significan $p$, $d$, $q$, $P$, $D$, $Q$ y $s$.**
---
En un SARIMA($p,d,q$)($P,D,Q$)$_s$: $p$ es el orden autorregresivo, el número de rezagos de la serie; $d$ es el número de diferencias regulares necesarias para quitar la tendencia; $q$ es el orden de media móvil, el número de rezagos del error. Las mayúsculas son lo mismo en la escala estacional: $P$ es el orden AR estacional (rezagos $s, 2s, \dots$), $D$ el número de diferencias estacionales y $Q$ el orden MA estacional; $s$ es el periodo estacional (12 mensual, 4 trimestral, 7 diario con patrón semanal). Ejemplo: el modelo de aerolínea, SARIMA(0,1,1)(0,1,1)$_{12}$, usa una diferencia regular, una estacional de 12 meses, un término MA de corto plazo y un MA estacional. Los órdenes se proponen con la ACF y la PACF de la serie transformada y se confirman con AIC o BIC y con los residuos; $d$ y $D$ se justifican con ADF y KPSS.
+++
- $p$, $d$, $q$: parte regular (AR, diferencias, MA).
- $P$, $D$, $Q$: parte estacional.
- $s$: periodo estacional, con un ejemplo.
- Un modelo concreto leído parámetro por parámetro.
:::

:::abierta Pregunta 10 | [[u2:aic-bic]] {#pt-10}
**Compare AIC, BIC y las métricas fuera de muestra.**
---
AIC y BIC son **criterios de información**: miden el ajuste dentro de la muestra con la log-verosimilitud $\ell$ y lo castigan por el número de parámetros $k$. $\AIC = -2\ell + 2k$ y $\BIC = -2\ell + k\ln(n)$; en ambos, menor es mejor. Como $\ln(n) > 2$ a partir de $n = 8$, el BIC penaliza más la complejidad y favorece modelos parsimoniosos; el AIC se orienta al desempeño predictivo esperado. Solo se comparan entre modelos ajustados a **los mismos datos**, con la misma transformación y las mismas diferencias. Las **métricas fuera de muestra** (MAE, RMSE, MAPE, MASE sobre el bloque de prueba) miden el error real al pronosticar datos que el modelo no vio. En la práctica: AIC y BIC para reducir la lista de candidatos, diagnóstico de residuos para descartar, y error fuera de muestra para decidir. Una log-verosimilitud más alta, por sí sola, no basta: los modelos más complejos siempre ajustan mejor dentro de la muestra.
+++
- Fórmulas de AIC y BIC y la regla «menor es mejor».
- El BIC penaliza más y favorece la parsimonia.
- Condición para compararlos: mismos datos y misma diferenciación.
- Las métricas fuera de muestra miden el error de pronóstico real.
- Cómo se usan juntos.
:::

:::abierta Pregunta 11 | [[u2:particion]] {#pt-11}
**Explique por qué no se usa una partición aleatoria (`train_test_split`) en series de tiempo.**
---
Porque las observaciones no son independientes y el orden importa. Una partición aleatoria mezcla pasado y futuro: el modelo se entrena con datos **posteriores** a los que debe predecir, y como los valores vecinos se parecen, puede «interpolar» entre ellos. Eso es **fuga de información futura** y da un error de prueba optimista que no se sostiene al pronosticar de verdad, donde solo se conoce el pasado. La partición correcta respeta el tiempo: un bloque inicial de **entrenamiento**, uno posterior de **validación** para elegir el modelo y uno final de **prueba** para estimar el desempeño realista; o una validación con origen móvil, que repite ese esquema avanzando el corte. La misma regla aplica a las transformaciones: sus parámetros se estiman solo con el entrenamiento.
+++
- Los datos son dependientes en el tiempo; el orden importa.
- La partición aleatoria usa el futuro para predecir el pasado (fuga).
- Consecuencia: error de prueba optimista.
- La alternativa: bloques ordenados de entrenamiento, validación y prueba, u origen móvil.
:::

:::abierta Pregunta 12 | [[u2:un-paso]] {#pt-12}
**Compare el pronóstico a un paso (*one-step ahead*) con el pronóstico a varios pasos (*multi-step ahead*).**
---
A **un paso**, el modelo predice solo el siguiente periodo y, antes de predecir el que sigue, incorpora el valor real observado. El error no se acumula y suele ser menor; es el esquema de la actualización continua (pronosticar mañana cada día). A **varios pasos**, se predicen $h$ periodos consecutivos sin ver valores reales intermedios: la incertidumbre crece con el horizonte, los intervalos se ensanchan y los errores pueden acumularse. Hay tres estrategias: **recursiva**, que usa sus propias predicciones como entradas; **directa**, que entrena un modelo para cada horizonte; y **MIMO**, en la que un modelo predice todo el horizonte de una vez. La evaluación debe coincidir con el uso: un error a un paso muy bajo no garantiza un buen pronóstico a doce meses.
+++
- Un paso: incorpora el valor real tras cada predicción; menos acumulación de error.
- Varios pasos: la incertidumbre crece con el horizonte.
- Estrategias recursiva, directa y MIMO.
- Evaluar con el mismo horizonte con que se usará el modelo.
:::

:::abierta Pregunta 13 | [[u2:requisitos-exog]] {#pt-13}
**Explique qué condiciones debe cumplir una variable exógena para usarse en un pronóstico.**
---
Una exógena no forma parte de la serie, pero ayuda a explicar su evolución. Para servir en un pronóstico debe cumplir: (1) **sentido predictivo**: una relación con la variable objetivo que tenga explicación y que se sostenga en el tiempo; (2) **disponibilidad en el horizonte**: sus valores futuros deben conocerse de antemano (calendario, festivos, precios o promociones planeadas) o poder pronosticarse, sabiendo que ese pronóstico agrega error; (3) **sin fuga de información**: no puede construirse con datos del futuro ni con la propia variable objetivo del mismo periodo; y (4) misma frecuencia y fechas alineadas con la serie. Ejemplos: precio, promociones, temperatura, días hábiles, festivos, gasto publicitario o indicadores económicos. Si una exógena solo se conoce después del hecho, mejora el ajuste histórico pero no sirve para pronosticar.
+++
- Relación con sentido predictivo con la variable objetivo.
- Disponible o pronosticable en el horizonte futuro.
- Sin fuga de información.
- Al menos un ejemplo válido (festivos, precio, temperatura…).
:::

:::abierta Pregunta 14 | [[u2:residuos-que]] {#pt-14}
**Describa cómo verificar si los residuos de un modelo son ruido blanco.**
---
Los residuos, $e_t = y_t - \hat{y}_t$, deben tener media cercana a cero, varianza aproximadamente constante y ninguna autocorrelación. Se revisa en cuatro frentes. (1) **Gráfica en el tiempo**: sin tendencia, sin tramos de mayor dispersión y sin patrones visibles. (2) **Autocorrelación**: ACF y PACF de los residuos dentro de las bandas, y prueba de **Ljung–Box** con p-value mayor que 0.05 en varios rezagos (incluido el estacional). (3) **Varianza constante**: prueba de heterocedasticidad o **ARCH-LM** con p-value mayor que 0.05, y ACF de los residuos al cuadrado sin picos. (4) **Normalidad**, si se van a interpretar intervalos e inferencia: histograma, gráfica Q-Q y **Jarque–Bera** con p-value alto, asimetría cercana a 0 y curtosis cercana a 3. Si falla la autocorrelación, queda información temporal sin modelar y se cambia el modelo; si falla la varianza o la normalidad, la media puede estar bien pero los intervalos no son confiables.
+++
- Qué deben cumplir: media cero, varianza constante, sin autocorrelación.
- ACF de residuos y Ljung–Box con p > 0.05.
- Prueba de heterocedasticidad o ARCH-LM.
- Normalidad: Q-Q, Jarque–Bera, asimetría y curtosis.
- Qué significa que alguna falle.
:::

:::abierta Pregunta 15 | [[u2:arch-lm]] {#pt-15}
**Explique qué indica una prueba ARCH-LM significativa.**
---
La prueba ARCH-LM contrasta $H_0$: no hay efectos ARCH, la varianza condicional es constante, contra $H_1$: la varianza depende de los errores pasados al cuadrado. Se calcula con una regresión de $e_t^2$ sobre sus rezagos; el estadístico es $\LM = n R^2$. Un p-value pequeño (menor que 0.05) indica **heterocedasticidad condicional**: los residuos al cuadrado están autocorrelacionados, es decir, la volatilidad tiene estructura y aparecen rachas de calma y rachas de agitación. El modelo de la media puede seguir siendo adecuado (los residuos pueden no estar autocorrelacionados), pero los errores estándar y sobre todo los **intervalos de pronóstico**, que suponen varianza constante, dejan de ser confiables. Las opciones son transformar la serie (logaritmo), modelar la varianza con ARCH o GARCH, o reportar el pronóstico con una advertencia sobre los intervalos.
+++
- $H_0$: sin efectos ARCH (varianza constante).
- Significativa: la varianza depende de los errores pasados al cuadrado (volatilidad con estructura).
- Consecuencia: intervalos de pronóstico poco confiables.
- Qué hacer: transformar, ARCH o GARCH, o advertir.
:::

## Unidad III · Análisis espectral y filtrado {#pt-u3}

:::abierta Pregunta 16 | [[u3:periodo-vs-ciclo]] {#pt-16}
**Diferencie periodicidad y ciclo.**
---
Una **periodicidad** es una repetición exacta después de un intervalo constante: el patrón cumple $x_{t+P} = x_t$, como la estacionalidad anual de datos mensuales ($\Per = 12$). Un **ciclo** es un patrón recurrente aproximado cuya duración, amplitud o forma varían, como el ciclo solar (de 7 a 17 años, con media cercana a 11) o el ciclo económico. En la ACF, la periodicidad produce oscilaciones que no se apagan y el ciclo, oscilaciones amortiguadas; en el espectro, la periodicidad da un pico angosto en $1/P$ y sus armónicos, y el ciclo, una joroba ancha. La distinción importa porque un SARIMA estacional supone un periodo fijo: forzarlo sobre un ciclo produce un modelo difícil de defender, y es mejor usar términos AR que generen el ciclo. Versión con más detalle: [[u3:ex-periodicidad]].
+++
- Periodicidad: repetición exacta con periodo constante, con ejemplo.
- Ciclo: duración, amplitud o forma variables, con ejemplo.
- Cómo se distinguen en la ACF o en el espectro.
- Consecuencia para el modelo: no todo ciclo justifica un SARIMA.
:::

:::abierta Pregunta 17 | [[u3:def-densidad]] {#pt-17}
**Defina la densidad espectral y explique su relación con la autocovarianza.**
---
Para una serie débilmente estacionaria, la densidad espectral describe cómo se reparte la varianza de la serie entre las distintas frecuencias. Formalmente es la **transformada de Fourier de la autocovarianza**: $f(\omega) = \sum_{k=-\infty}^{\infty} \gamma(k) e^{-2\pi i \omega k} = \gamma(0) + 2\sum_{k \ge 1} \gamma(k)\cos(2\pi\omega k)$, con $\omega$ en ciclos por observación. La relación es de ida y vuelta: $\gamma(k) = \int_{-1/2}^{1/2} e^{2\pi i \omega k} f(\omega)\, d\omega$ y, en particular, el área bajo $f$ es la varianza, $\gamma(0)$. Por eso el espectro y la ACF contienen la misma información en dos idiomas. Se lee así: frecuencias cercanas a cero, patrones lentos o de largo plazo; frecuencias altas, variaciones rápidas; picos, periodicidades o ciclos dominantes; espectro plano, ruido blanco. Versión con más detalle: [[u3:ex-densidad]].
+++
- Reparte la varianza (potencia) entre frecuencias; requiere estacionariedad débil.
- Es la transformada de Fourier de la autocovarianza (fórmula).
- El área bajo el espectro es la varianza; la relación es invertible.
- Interpretación: bajas, altas, picos y ruido blanco plano.
:::

:::abierta Pregunta 18 | [[u3:dft-def]] {#pt-18}
**Explique el papel de la transformada de Fourier en el análisis espectral.**
---
La transformada de Fourier descompone una señal en senos y cosenos de distintas frecuencias, amplitudes y fases. En su versión discreta reexpresa una serie de $n$ datos como una suma de oscilaciones en las frecuencias de Fourier $\omega_j = j/n$: para cada una da un coeficiente complejo $d(\omega_j)$ cuyo módulo mide la intensidad de esa oscilación y cuyo argumento, su fase. El módulo al cuadrado es el **periodograma**, $I(\omega_j) = \lvert d(\omega_j) \rvert^2$, el estimador no paramétrico más simple de la densidad espectral: permite identificar qué frecuencias están presentes y con qué intensidad. Tiene dos papeles: en la teoría, conecta la autocovarianza con la densidad espectral; en la práctica, permite calcular el periodograma con la FFT. El periodograma crudo es muy ruidoso, así que se suaviza o se usa el método de Welch. Versión con más detalle: [[u3:ex-fourier]].
+++
- Descompone la serie en senos y cosenos de distintas frecuencias, amplitudes y fases.
- Frecuencias de Fourier $\omega_j = j/n$ y coeficiente $d(\omega_j)$.
- El periodograma es su módulo al cuadrado y estima la densidad espectral.
- Limitación: el periodograma es ruidoso; se suaviza o se usa Welch.
:::

:::abierta Pregunta 19 | [[u3:comparacion-espectral]] {#pt-19}
**Compare la estimación espectral paramétrica y la no paramétrica.**
---
La estimación **no paramétrica** parte del periodograma y lo estabiliza promediando: frecuencias vecinas (suavizado de Daniell) o periodogramas de segmentos traslapados (método de **Welch**). Hace pocos supuestos, solo estacionariedad, y es directa; pero el periodograma crudo es muy ruidoso y el suavizado cambia varianza por resolución: más promedio da una curva más estable que aplana los picos. La **paramétrica** asume un modelo, típicamente un AR($p$) elegido con el AIC, y calcula el espectro con la fórmula del modelo y los parámetros estimados: $\hat{f}(\omega) = \hat{\sigma}^2 / \lvert \hat{\phi}(e^{-2\pi i \omega}) \rvert^2$. Da una curva suave e interpretable, con buena resolución aun con pocos datos **si el modelo es correcto**, pero depende de la especificación: un orden bajo pierde picos y uno alto crea picos falsos. Conviene usarlas juntas: si ambas muestran el mismo pico, la conclusión es sólida. Versión con más detalle: [[u3:ex-espectral]].
+++
- No paramétrica: periodograma suavizado o Welch; pocos supuestos; ruidosa.
- Paramétrica: se ajusta un modelo (AR, MA o ARMA) y se usa su espectro.
- Ventaja y riesgo de la paramétrica: suave, pero depende de la especificación.
- El compromiso entre varianza y resolución, o la recomendación de usarlas juntas.
:::

:::abierta Pregunta 20 | [[u3:mag-fase-coh]] {#pt-20}
**Explique magnitud, fase y coherencia en los espectros cruzados.**
---
La densidad espectral cruzada, $f_{yx}(\omega)$, describe cómo se relacionan dos series en el dominio de la frecuencia: es la transformada de Fourier de la covarianza cruzada y, como esta no es simétrica, es un número complejo. Su **magnitud** $\lvert f_{yx}(\omega) \rvert$ mide la fuerza de la relación lineal entre las dos series en la frecuencia $\omega$. Su **fase** mide el desfase o retardo entre los componentes de esa frecuencia: un retardo puro de $D$ periodos da una fase que es una recta de pendiente $-2\pi D$, y así se sabe cuál serie antecede a la otra. La **coherencia**, $\rho^2_{yx}(\omega) = \lvert f_{yx}(\omega) \rvert^2 / (f_x(\omega) f_y(\omega))$, está entre 0 y 1 y es una correlación al cuadrado por frecuencia: valores altos indican una relación lineal fuerte en esa banda. Sirve para detectar si dos variables comparten ciclos, si una antecede a otra o si la relación solo aparece en ciertas frecuencias. Versión con más detalle: [[u3:ex-cruzado]].
+++
- El espectro cruzado relaciona dos series por frecuencia.
- Magnitud: fuerza de la relación lineal en cada frecuencia.
- Fase: desfase o retardo; quién antecede a quién.
- Coherencia: medida normalizada entre 0 y 1.
- Una aplicación (ciclos comunes, adelanto, relación por bandas).
:::

:::abierta Pregunta 21 | [[u3:objetivo-filtro]] {#pt-21}
**Proponga un filtro para remover la tendencia, el ruido de alta frecuencia o una banda no deseada.**
---
Un filtro modifica o elimina componentes de frecuencia; se elige según dónde vive lo que se quiere quitar. **Tendencia**: vive en las frecuencias más bajas, así que se usa un **pasa altos**; el más sencillo es la diferencia $y_t - y_{t-1}$, cuya ganancia es cero en $\omega = 0$, o un Butterworth pasa altos con corte en el periodo más largo que se quiere conservar. **Ruido de alta frecuencia**: se usa un **pasa bajos**, por ejemplo una media móvil o un Butterworth con frecuencia de corte por debajo del ruido. **Banda no deseada** (una interferencia periódica): se usa un **rechaza banda** centrado en esa frecuencia; para aislar un ciclo de interés se usa, al contrario, un **pasa banda**. En todos los casos se especifican la **frecuencia de corte** ($\omega = 1/P$) y el **orden**, que controla qué tan abrupta es la transición, y se verifica en el periodograma de la serie filtrada que desapareció lo que se quería quitar. Versión con más detalle: [[u3:ex-filtro]].
+++
- Tendencia: pasa altos (diferencia o Butterworth).
- Ruido rápido: pasa bajos (media móvil o Butterworth).
- Banda no deseada: rechaza banda; para aislar un ciclo, pasa banda.
- Menciona frecuencia de corte y orden.
- Cómo verificar el resultado (ganancia o periodograma).
:::
