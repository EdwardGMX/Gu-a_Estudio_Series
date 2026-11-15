### Bloque I · Preguntas de respuesta abierta {#ej3-abiertas}

El examen pide **explicar, comparar, justificar, interpretar y proponer**. Escribe tu respuesta como la redactarías en el examen, abre la respuesta modelo, palomea los puntos que sí incluiste y califícate. Las que marques «a medias» o «mal» se van a tu lista de [repaso de errores](practica.html#errores). Las 21 preguntas tipo de la guía oficial están en [Preguntas tipo](preguntas-tipo.html).

:::abierta Interprete | [[leer-densidad]]
El espectro estimado de una serie **mensual** tiene un pico angosto en $\omega = 0.0833$, otro menor en $\omega = 0.1667$ y mucha potencia cerca de $\omega = 0$. Interprete cada rasgo.
---
El pico en $\omega = 0.0833$ corresponde a un periodo de $1/0.0833 = 12$ meses: es la **periodicidad anual**. El pico en $0.1667$ equivale a 6 meses y es su **segundo armónico**: aparece porque el patrón estacional no es una senoide perfecta, no porque exista un fenómeno semestral aparte. Que ambos picos sean **angostos** indica una repetición de periodo fijo, lo que justifica una diferencia estacional o un SARIMA con $s = 12$. La potencia concentrada cerca de $\omega = 0$ viene de movimientos muy lentos: **tendencia**. Conviene quitarla (diferenciar o restar la tendencia) antes de estimar el espectro, porque su potencia se fuga hacia las frecuencias vecinas y esconde lo demás.
+++
- Convierte 0.0833 a un periodo de 12 meses.
- Identifica 0.1667 como armónico (6 meses) del patrón estacional.
- Pico angosto: periodicidad de periodo fijo, se justifica $s = 12$.
- Potencia cerca de cero: tendencia, que conviene quitar antes.
:::

:::abierta Explique | [[unidades-frecuencia]]
En una serie **trimestral**, el espectro tiene su máximo en $\omega = 0.05$ ciclos por observación. ¿A qué periodo corresponde, en trimestres y en años? ¿Cuál es la frecuencia más alta que se puede observar y qué significa?
---
El periodo es el inverso de la frecuencia: $\Per = 1/\omega = 1/0.05 = 20$ observaciones. Como cada observación es un trimestre, son 20 trimestres, es decir, **5 años**: un ciclo de mediano plazo, no la estacionalidad anual, que estaría en $\omega = 1/4 = 0.25$. La frecuencia más alta observable es $\omega = 1/2$ ciclos por observación, que corresponde a un periodo de 2 observaciones: una serie que sube y baja en cada dato. Con datos trimestrales no se puede distinguir nada que oscile más rápido que un ciclo cada dos trimestres. Siempre hay que decir la unidad: la misma frecuencia en radianes sería $2\pi \times 0.05 \approx 0.314$.
+++
- Periodo = 1/ω = 20 trimestres.
- Lo convierte a 5 años.
- Frecuencia máxima 1/2, es decir, periodo de 2 observaciones.
- Menciona la estacionalidad en ω = 0.25 o la conversión de unidades.
:::

:::abierta Explique | [[periodograma-ruido]]
Explique por qué tener más datos no vuelve más suave al periodograma y cuál es el costo de suavizarlo.
---
Cada ordenada del periodograma se distribuye, aproximadamente, como la densidad espectral multiplicada por una ji-cuadrada con 2 grados de libertad dividida entre 2: su desviación estándar es del **mismo tamaño que lo que estima**. Al aumentar $n$ no se promedia más información en cada frecuencia; lo que aumenta es el **número de frecuencias** de Fourier, cada una igual de ruidosa. Por eso el periodograma es casi insesgado pero no mejora con más datos. La solución es promediar: ordenadas vecinas (Daniell) o periodogramas de segmentos (Welch). El costo es la **resolución**: al promediar se ensanchan y aplanan los picos y se funden frecuencias cercanas. Es un compromiso entre sesgo y varianza: poco suavizado deja una curva ruidosa con picos falsos; mucho, una curva estable que borra picos reales.
+++
- La variabilidad de cada ordenada no disminuye con $n$.
- Más datos dan más frecuencias, no ordenadas más precisas.
- Se suaviza promediando (Daniell o Welch).
- El costo es la resolución: compromiso entre sesgo y varianza.
:::

:::abierta Interprete | [[mag-fase-coh]]
Con datos semanales de gasto en publicidad ($x$) y ventas ($y$) se obtiene una coherencia de 0.85 en la banda de periodos de 10 a 14 semanas y de alrededor de 0.1 en las demás frecuencias. En esa banda, la fase corresponde a un retardo de 2 semanas de $y$ respecto de $x$. Interprete.
---
La coherencia es una correlación al cuadrado **por frecuencia**. Un valor de 0.85 indica que, en los ciclos de unas 12 semanas, el 85% de la variabilidad de las ventas se explica linealmente con la publicidad: las dos series **comparten ese ciclo**. Fuera de esa banda la coherencia es baja, así que no hay relación lineal apreciable: la relación existe solo en ciertas frecuencias, algo que una correlación global no mostraría. La fase dice que las ventas **van 2 semanas detrás** de la publicidad: la publicidad antecede. Antes de concluir hay que verificar que 0.85 supera el umbral de significancia para el suavizado usado, y recordar que coherencia no es causalidad. En la práctica, sugiere usar la publicidad rezagada 2 semanas como variable explicativa.
+++
- Coherencia alta: relación lineal fuerte en esa banda (ciclo compartido).
- Coherencia baja en el resto: la relación solo existe en ciertas frecuencias.
- Fase: las ventas siguen a la publicidad con 2 semanas de retardo.
- Una cautela (umbral de significancia o no causalidad) o un uso práctico.
:::

:::abierta Proponga | [[receta-filtro]]
Tienes datos **diarios** de usuarios activos con una tendencia lenta, un patrón semanal y ruido. Quieres aislar el patrón semanal para estudiarlo. Proponga un filtro.
---
El patrón semanal vive en la frecuencia $\omega = 1/7 \approx 0.143$ ciclos por día, y en sus armónicos $2/7$ y $3/7$ si no es una senoide. La tendencia está cerca de $\omega = 0$ y el ruido, repartido en todas las frecuencias. Propongo un **pasa banda** alrededor de $1/7$: por ejemplo, un Butterworth de orden 3 o 4 con cortes en periodos de 6 y 8 días ($\omega$ entre 0.125 y 0.167). El orden controla qué tan abrupta es la transición: uno mayor separa mejor, pero puede generar oscilaciones en los extremos. Como es para describir y no para pronosticar, lo aplico con fase cero (`filtfilt`), para no desplazar el patrón en el tiempo. Verifico que la ganancia sea cercana a 1 en $1/7$ y a 0 en $\omega = 0$, y que el periodograma de la salida conserve solo ese pico. Si también interesan los armónicos, quito la tendencia con un pasa altos y promedio por día de la semana.
+++
- Ubica el patrón semanal en ω = 1/7.
- Propone un pasa banda alrededor de esa frecuencia.
- Da frecuencias de corte y un orden.
- Menciona la fase cero o la verificación con la ganancia o el periodograma.
:::

:::abierta Explique | [[filtro-espectro]]
Explique qué son la respuesta al impulso y la función de transferencia de un filtro lineal, y cómo cambia el espectro de una serie al filtrarla.
---
Un filtro lineal produce cada salida como una combinación de valores de la entrada: $y_t = \sum_j a_j x_{t-j}$. La **respuesta al impulso** es la salida cuando la entrada es un impulso unitario (un 1 seguido de ceros): devuelve los pesos $a_j$, que describen el filtro en el dominio del tiempo. La **función de transferencia** es la transformada de Fourier de esos pesos, $A(\omega) = \sum_j a_j e^{-2\pi i \omega j}$: su módulo, la **ganancia**, dice cuánto se amplifica o se atenúa cada frecuencia, y su argumento, cuánto se desfasa. El efecto sobre el espectro es $f_y(\omega) = \lvert A(\omega) \rvert^2 f_x(\omega)$: el filtro multiplica la potencia de cada frecuencia por la ganancia al cuadrado. Por ejemplo, la diferencia $y_t = x_t - x_{t-1}$ tiene $\lvert A(\omega) \rvert^2 = 4\sin^2(\pi\omega)$, que vale 0 en $\omega = 0$: elimina la tendencia y amplifica las frecuencias altas.
+++
- Respuesta al impulso: los pesos del filtro (salida ante un impulso unitario).
- Función de transferencia: transformada de Fourier de los pesos; ganancia y fase.
- El espectro de salida es el de entrada por la ganancia al cuadrado.
- Un ejemplo (diferencia o media móvil).
:::

:::abierta Justifique | [[mm-filtro]]
Justifique, en términos de ganancia, por qué una media móvil de 12 términos elimina la estacionalidad anual de una serie mensual y por qué la diferencia regular elimina la tendencia.
---
La media móvil de 12 términos promedia un año completo. Su ganancia vale 1 en $\omega = 0$ y es **exactamente cero en las frecuencias $k/12$**, que son la estacional ($1/12$) y sus armónicos: una oscilación de periodo 12, o de un divisor de 12, promediada sobre 12 meses se cancela. Por eso deja pasar la tendencia, que está en frecuencias bajas, y elimina la estacionalidad: es un **pasa bajos** con ceros en las frecuencias estacionales. La diferencia regular, $y_t = x_t - x_{t-1}$, tiene ganancia $2\lvert\sin(\pi\omega)\rvert$: vale **cero en $\omega = 0$**, donde vive la tendencia, y crece hasta 2 en $\omega = 1/2$. Es un **pasa altos**: quita los movimientos lentos y de paso amplifica el ruido de alta frecuencia. La razón por la que cada operación funciona es que su ganancia vale cero justo donde vive el componente que se quiere quitar.
+++
- Media móvil de 12: ganancia 1 en ω = 0 y 0 en ω = k/12.
- Es un pasa bajos: conserva la tendencia y quita la estacionalidad.
- Diferencia: ganancia 2|sin(πω)|, cero en ω = 0.
- Es un pasa altos: quita la tendencia y amplifica las frecuencias altas.
:::

:::abierta Interprete | [[ar-espectral]]
En una serie **anual**, el periodograma suavizado muestra una joroba ancha centrada en $\omega \approx 0.09$; el espectro de un AR(2) ajustado tiene su pico en $\omega = 0.092$; y la ACF oscila y se va apagando. ¿Qué estructura tiene la serie y cómo la modelarías?
---
El máximo en $\omega \approx 0.09$ corresponde a un periodo de $1/0.09 \approx 11$ años. Tres pistas dicen que es un **ciclo** y no una periodicidad exacta: la joroba es **ancha**, es decir, la potencia se reparte en un rango de frecuencias, lo que significa duración variable; la ACF oscila pero se **amortigua**, mientras que una periodicidad daría oscilaciones que no se apagan; y un AR(2) lo reproduce, lo que ocurre cuando sus raíces son complejas y generan un pseudo-ciclo. Que los estimadores no paramétrico y paramétrico coincidan en la misma frecuencia hace sólida la conclusión. No conviene un SARIMA con $s = 11$, que supone un periodo fijo. Lo modelaría con términos AR, un AR(2) o de orden mayor elegido con AIC, que generan el ciclo, y verificaría los residuos.
+++
- Convierte la frecuencia a un periodo cercano a 11 años.
- Lo identifica como ciclo (joroba ancha o ACF amortiguada).
- Señala que los dos estimadores coinciden.
- Propone términos AR y descarta el SARIMA de periodo fijo.
:::

### Bloque J · Regresión con retraso y filtro de Wiener {#ej3-j .prof}

Ejercicios de los incisos 3.4.2 y 3.4.3 del temario: [[ccf]], [[regresion-retraso]], [[senal-ruido]] y [[wiener]].

:::ejercicio Básico | [[ccf]]
¿Por qué se **preblanquea** antes de leer la correlación cruzada entre dos series?
- [ ] Para que las dos series tengan la misma varianza.
- [x] Porque si $x$ está autocorrelacionada, la CCF sale alta en muchos rezagos (eco de su persistencia) y la banda $\pm 2/\sqrt n$ deja de valer.
- [ ] Para eliminar la relación entre $x$ y $y$ y comprobar que era espuria.
- [ ] Porque la CCF solo se puede calcular con series de media cero.
---
La banda $\pm 2/\sqrt n$ supone que al menos una serie es ruido blanco. Se ajusta un AR a $x$, se usan sus residuos $w_t$ y se aplica **el mismo filtro** a $y$; la relación (los $\beta_r$) se conserva [[demo-preblanqueo]] y la CCF solo marca los rezagos verdaderos.
:::

:::ejercicio Intermedio | [[regresion-retraso]]
Tras preblanquear, la CCF entre $\tilde y$ y $w$ solo sale de la banda en el rezago $k = 4$, con $\hat\rho = 0.5$, $s_{\tilde y} = 2$ y $s_w = 1$. ¿Qué modelo y qué coeficiente se proponen?
- [ ] $y_t = \beta x_{t+4} + v_t$ con $\hat\beta = 0.25$
- [x] $y_t = \beta x_{t-4} + v_t$ con $\hat\beta = 1$
- [ ] $y_t = \beta x_{t-4} + v_t$ con $\hat\beta = 0.5$
- [ ] $y_t = \beta x_t + v_t$ con $\hat\beta = 2$
---
Un pico en $k > 0$ de $\rho_{yx}(k) = \operatorname{corr}(y_{t+k}, x_t)$ significa que $y$ responde $k$ periodos **después** de $x$: el regresor es $x_{t-4}$. El coeficiente es $\hat\beta_4 = \hat\rho\,s_{\tilde y}/s_w = 0.5 \times 2/1 = 1$ [[demo-preblanqueo]]. En frecuencia, la fase sería una recta de pendiente $-2\pi(4)$ [[demo-retardo]].
:::

:::ejercicio Básico | [[wiener]]
En el modelo señal más ruido, a cierta frecuencia $f_s(\omega) = 3$ y $f_n(\omega) = 1$. ¿Cuánto vale la ganancia del filtro de Wiener en esa frecuencia?
- [ ] 0.25
- [ ] 0.33
- [x] 0.75
- [ ] 3
---
$A(\omega) = f_s/(f_s + f_n) = 3/4 = 0.75$. La razón señal a ruido es 3 y $A = \mathrm{SNR}/(1 + \mathrm{SNR})$: se deja pasar el 75% de esa frecuencia, la fracción que es señal [[guia-wiener]].
:::

:::ejercicio Intermedio | [[wiener]]
¿Cuál de estas afirmaciones sobre el filtro de Wiener es **falsa**?
- [ ] Su ganancia es la coherencia entre la serie observada y la señal.
- [ ] Su ganancia está entre 0 y 1 y no desfasa.
- [x] Puede separar la señal del ruido aun dentro de una misma frecuencia, si se conocen bien los espectros.
- [ ] El filtro de Hodrick–Prescott es un filtro de Wiener para un modelo particular de tendencia más ciclo.
---
Un filtro lineal solo decide **cuánto** de cada frecuencia deja pasar; dentro de una frecuencia, señal y ruido salen juntos. Por eso queda un error $f_sf_n/(f_s + f_n)$ que ningún filtro lineal elimina [[demo-wiener]]. Las otras tres son ciertas [[demo-hp-wiener]].
:::
