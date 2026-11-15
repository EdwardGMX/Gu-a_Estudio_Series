### Bloque L · Preguntas de respuesta abierta {#ej2-abiertas}

El examen pide **explicar, comparar, justificar, interpretar y proponer**. Escribe tu respuesta como la redactarías en el examen, abre la respuesta modelo, palomea los puntos que sí incluiste y califícate. Las que marques «a medias» o «mal» se van a tu lista de [repaso de errores](practica.html#errores). Las 21 preguntas tipo de la guía oficial están en [Preguntas tipo](preguntas-tipo.html).

:::abierta Interprete | [[summary-coef]]
El `summary()` de un SARIMAX(1,1,1)(0,1,1)$_{12}$ muestra: `ar.L1` = 0.21 con P>|z| = 0.48; `ma.L1` = −0.62 con P>|z| = 0.000; `ma.S.L12` = −0.55 con P>|z| = 0.000; Prob(Q) = 0.71; Prob(JB) = 0.38; Prob(H) = 0.44. ¿Qué concluyes y qué harías después?
---
Los términos `ma.L1` y `ma.S.L12` son significativos (P>|z| menor que 0.05), pero `ar.L1` **no lo es**: con 0.48 no se rechaza que valga cero. Los residuos no muestran problemas: Prob(Q) = 0.71, sin autocorrelación; Prob(JB) = 0.38, normalidad razonable; Prob(H) = 0.44, varianza constante. El modelo es adecuado pero tiene un parámetro de más. Lo siguiente es ajustar el modelo sin el término AR, que es el **modelo de aerolínea** SARIMA(0,1,1)(0,1,1)$_{12}$, comparar AIC y BIC (ambos con las mismas diferencias, así que son comparables), volver a revisar los residuos y decidir con el error fuera de muestra. Si ajustan igual, se prefiere el más parsimonioso.
+++
- Identifica que `ar.L1` no es significativo y los otros dos sí.
- Lee las tres pruebas de residuos y concluye que no hay problemas.
- Propone el modelo sin el término AR.
- Dice cómo comparar: AIC o BIC, residuos y error fuera de muestra.
:::

:::abierta Compare | [[invertibilidad]]
Compare **estacionariedad** e **invertibilidad**: a qué parte del modelo ARMA se refiere cada una, cómo se comprueban y por qué importan.
---
La **estacionariedad** es una condición sobre la parte **AR**: las raíces del polinomio $\phi(z)$ deben quedar fuera del círculo unitario. Garantiza que los choques se disipen con el tiempo y que la serie tenga media, varianza y autocorrelaciones estables. La **invertibilidad** es una condición sobre la parte **MA**: las raíces de $\theta(z)$ deben quedar fuera del círculo unitario. Garantiza que el modelo pueda escribirse como un AR infinito con pesos que se apagan, es decir, que los choques se puedan reconstruir a partir del pasado observado, y hace **única** la representación: dos MA distintos pueden tener la misma ACF y solo uno es invertible. Un MA finito siempre es estacionario y un AR finito siempre es invertible. En un AR(1) y un MA(1) las condiciones se reducen a $\lvert\phi\rvert < 1$ y $\lvert\theta\rvert < 1$.
+++
- Estacionariedad: raíces del polinomio AR fuera del círculo unitario.
- Invertibilidad: raíces del polinomio MA fuera del círculo unitario.
- Para qué sirve cada una (choques que se disipan; representación única y reconstruir los choques).
- Un caso concreto, como $\lvert\phi\rvert < 1$ y $\lvert\theta\rvert < 1$.
:::

:::abierta Justifique | [[sobrediferenciar]]
Un compañero diferenció dos veces su serie «para estar seguro». La ACF de la serie resultante tiene $\rho(1) = -0.52$ y la varianza aumentó respecto de la serie con una sola diferencia. ¿Qué ocurrió y qué recomiendas?
---
Ocurrió una **sobrediferenciación**. Diferenciar una serie que ya era estacionaria no la «mejora»: le agrega una media móvil con raíz unitaria, que no es invertible. La huella es justo la que se observa: una autocorrelación en el rezago 1 **cercana a −0.5** y una **varianza mayor** que la de la serie con una diferencia menos. Recomiendo regresar a una sola diferencia: se usa el **menor** $d$ que deja la serie estacionaria, y se justifica con la gráfica, con ADF y KPSS y con la ACF. Una regla práctica es comparar las varianzas de la serie con $d = 0, 1, 2$ y quedarse con la diferencia que da la menor.
+++
- Nombra el problema: sobrediferenciación.
- Explica las dos señales: $\rho(1)$ cercano a −0.5 y varianza que aumenta.
- Recomienda el menor $d$ que logra estacionariedad.
- Menciona cómo justificar $d$ (ADF y KPSS, ACF o comparación de varianzas).
:::

:::abierta Proponga | [[sarima-ap]]
Una serie mensual se transformó con logaritmo, una diferencia regular y una diferencia estacional. La ACF de la serie transformada tiene un pico negativo significativo en el rezago 1 y otro en el rezago 12; lo demás queda dentro de la banda. La PACF decae en los rezagos 1, 2, 3 y en 12, 24. Proponga un modelo y justifique cada orden.
---
Propongo un **SARIMA(0,1,1)(0,1,1)$_{12}$** sobre el logaritmo de la serie. $d = 1$ y $D = 1$ porque ya se aplicaron una diferencia regular y una estacional, con $s = 12$ por ser datos mensuales. En la parte regular, la ACF **se corta después del rezago 1** y la PACF decae: es un MA(1), así que $q = 1$ y $p = 0$. En la parte estacional ocurre lo mismo en múltiplos de 12: un solo pico de la ACF en el rezago 12 y una PACF que decae en 12 y 24: MA estacional de orden 1, así que $Q = 1$ y $P = 0$. Es el modelo de aerolínea. No se elige de forma mecánica: se compara con modelos vecinos, como (1,1,1)(0,1,1) y (0,1,1)(1,1,1), con AIC y BIC, se revisan los residuos con Ljung–Box y se evalúa fuera de muestra.
+++
- Modelo: SARIMA(0,1,1)(0,1,1)$_{12}$ sobre el logaritmo.
- Justifica $d$, $D$ y $s$ con las transformaciones aplicadas.
- Justifica $q = 1$ y $Q = 1$ con el corte de la ACF y el decaimiento de la PACF.
- Menciona la comparación con candidatos vecinos o la revisión de residuos.
:::

:::abierta Explique | [[fuga]]
Quieres pronosticar las ventas diarias de la próxima semana. Tienes tres posibles variables exógenas: la promoción planeada para cada día, la temperatura y el número de visitas a la tienda de ese mismo día. ¿Cuáles sirven y con qué cuidado?
---
La **promoción planeada** sirve: tiene sentido predictivo y se conoce de antemano para todo el horizonte. La **temperatura** puede servir, pero su valor futuro no se conoce: hay que usar el pronóstico meteorológico, y su error se suma al del modelo; conviene evaluar el modelo con temperaturas pronosticadas y no con las observadas. Las **visitas del mismo día** no sirven tal cual: no se conocen antes de que ocurra el día, así que usarlas con su valor real es **fuga de información**; el modelo ajustaría muy bien el pasado y no podría pronosticar. Solo se podrían usar pronosticándolas aparte o con rezago (las visitas de la semana anterior). La regla: una exógena debe estar disponible, o ser pronosticable, en el horizonte que se quiere predecir.
+++
- Promoción planeada: válida, se conoce a futuro.
- Temperatura: requiere su propio pronóstico, que agrega error.
- Visitas del mismo día: fuga de información; solo pronosticada o rezagada.
- Enuncia la regla de disponibilidad en el horizonte.
:::

:::abierta Interprete | [[metricas-propiedades]]
En el bloque de prueba, el modelo A obtiene MAE = 12, RMSE = 25 y MASE = 0.80; el modelo B obtiene MAE = 14, RMSE = 16 y MASE = 0.93. ¿Cuál elegirías?
---
Los dos mejoran al pronóstico ingenuo, porque su MASE es menor que 1. El modelo A tiene el menor error típico (MAE de 12 contra 14), pero su RMSE es más del doble de su MAE: como el RMSE eleva los errores al cuadrado, esa distancia indica que A comete **algunos errores muy grandes**. En el modelo B el RMSE (16) es cercano al MAE (14): sus errores son parejos, sin fallas grandes. La elección depende del costo de equivocarse: si un error grande es especialmente costoso, como quedarse sin inventario, conviene **B**; si lo que importa es el error promedio y los errores grandes ocasionales son tolerables, conviene **A**. Antes de decidir revisaría en qué fechas falla A, porque pueden ser atípicos o un evento que una variable exógena explicaría.
+++
- Los dos tienen MASE menor que 1: mejoran al ingenuo.
- A tiene menor MAE pero un RMSE mucho mayor: errores grandes ocasionales.
- B tiene errores parejos (RMSE cercano al MAE).
- La elección depende del costo de los errores grandes.
:::

:::abierta Explique | [[tres-bloques]]
Explique para qué sirve cada bloque de la partición temporal (entrenamiento, validación y prueba) y por qué el modelo no se elige con el bloque de prueba.
---
El bloque de **entrenamiento**, el inicial, sirve para estimar los parámetros de cada modelo candidato. El de **validación**, posterior, sirve para compararlos y elegir uno: órdenes, transformaciones y variables exógenas. El de **prueba**, al final, se usa una sola vez, con el modelo ya elegido, para estimar su desempeño realista. Si el modelo se elige con el bloque de prueba, ese error deja de ser honesto: entre muchos candidatos, el ganador lo es en parte por suerte en esos datos, y el error reportado resulta optimista. Los tres bloques respetan el orden temporal para que nunca se use el futuro para predecir el pasado. Con pocos datos, la validación se sustituye por un origen móvil dentro del entrenamiento, y al final se reajusta el modelo con todos los datos antes de pronosticar.
+++
- Entrenamiento: estimar parámetros.
- Validación: comparar y elegir el modelo.
- Prueba: evaluación final, una sola vez.
- Elegir con la prueba vuelve optimista el error reportado.
:::

:::abierta Justifique | [[garch]]
Los residuos de un SARIMA ajustado a una serie financiera dan: Ljung–Box p-value = 0.62; Ljung–Box de los residuos al cuadrado p-value = 0.001; ARCH-LM p-value = 0.002; Jarque–Bera p-value = 0.000 con curtosis 6.1. ¿El modelo es adecuado? ¿Qué reportarías?
---
La **media** está bien modelada: Ljung–Box no rechaza (0.62), así que los residuos no están autocorrelacionados y el pronóstico puntual es utilizable. La **varianza** no: los residuos al cuadrado sí están autocorrelacionados (0.001) y ARCH-LM rechaza la varianza condicional constante (0.002). Hay heterocedasticidad condicional, con rachas de alta y baja volatilidad. Además, Jarque–Bera rechaza la normalidad con curtosis 6.1: colas pesadas, típicas de este fenómeno. La consecuencia es que los **intervalos de pronóstico**, que suponen varianza constante y normalidad, no son confiables: serán angostos en los periodos agitados. Reportaría el pronóstico puntual con esa advertencia y propondría modelar la varianza con un ARCH o un GARCH sobre los residuos, o probar una transformación, y volver a correr las pruebas.
+++
- Distingue media (bien: sin autocorrelación) de varianza (mal: efectos ARCH).
- Interpreta ARCH-LM o el Ljung–Box de los residuos al cuadrado.
- Relaciona Jarque–Bera y la curtosis con colas pesadas.
- Consecuencia para los intervalos y una propuesta (GARCH, transformación o advertencia).
:::

### Bloque M · Holt y Holt–Winters {#ej2-m .prof}

Ejercicios de [[holt]], el complemento de los pronósticos de referencia con tendencia y estacionalidad.

:::ejercicio Básico | [[holt]]
En el método de Holt con $\alpha = \beta = 0.5$ se tiene $\ell_{t-1} = 20$, $b_{t-1} = 2$ y llega $y_t = 25$. ¿Cuánto valen $\ell_t$ y el pronóstico a dos pasos $\hat y_{t+2 \mid t}$?
- [ ] $\ell_t = 22.5$ y $\hat y_{t+2 \mid t} = 26.5$
- [x] $\ell_t = 23.5$ y $\hat y_{t+2 \mid t} = 29$
- [ ] $\ell_t = 25$ y $\hat y_{t+2 \mid t} = 29$
- [ ] $\ell_t = 23.5$ y $\hat y_{t+2 \mid t} = 27.5$
---
:::pasos
= \ell_t = 0.5(25) + 0.5(20 + 2) = 12.5 + 11 = 23.5
> El nivel promedia el dato con lo esperado, $\ell_{t-1} + b_{t-1} = 22$.
= b_t = 0.5(23.5 - 20) + 0.5(2) = 1.75 + 1 = 2.75
> La pendiente promedia el cambio de nivel (3.5) con la pendiente anterior.
= \hat y_{t+2 \mid t} = 23.5 + 2(2.75) = 29
> La recta del pronóstico [[guia-holt]].
:::
:::

:::ejercicio Básico | [[holt]]
Las ventas mensuales de una cadena crecen año con año y cada diciembre tienen un pico que, **en porcentaje**, es siempre parecido (el pico crece con las ventas). ¿Qué método de suavizamiento conviene?
- [ ] Suavizamiento exponencial simple.
- [ ] Holt.
- [ ] Holt–Winters aditivo.
- [x] Holt–Winters multiplicativo.
---
Hay tendencia (descarta el simple) y estacionalidad (descarta Holt solo). Como el pico crece con el nivel, el efecto estacional es un **porcentaje**: multiplicativo, igual que en la descomposición [[u1:multiplicativo]]. Una alternativa equivalente es Holt–Winters aditivo sobre $\ln y_t$.
:::

:::ejercicio Intermedio | [[holt]]
En el método de Holt se fija $\beta = 0$. ¿Qué pasa con la pendiente?
- [ ] Se vuelve igual al último cambio de nivel en cada periodo.
- [x] Nunca se actualiza: se queda en su valor inicial y el pronóstico usa siempre esa misma pendiente.
- [ ] Vale cero, así que el método se convierte en el suavizamiento simple.
- [ ] Se vuelve negativa.
---
Con $\beta = 0$: $b_t = 0 \cdot (\ell_t - \ell_{t-1}) + 1 \cdot b_{t-1} = b_{t-1}$. La pendiente queda fija en $b_1$, aunque el nivel sí se actualiza. El caso opuesto, $\beta = 1$, hace que la pendiente sea solo el último cambio de nivel.
:::

:::ejercicio Intermedio | [[holt]]
Un Holt–Winters aditivo trimestral termina en un **segundo** trimestre con $\ell_T = 200$, $b_T = 3$ y efectos estacionales $(-4,\ +6,\ +9,\ -11)$ para T1 a T4. ¿Cuál es el pronóstico para dentro de dos trimestres?
- [ ] 189
- [x] 195
- [ ] 206
- [ ] 215
---
Dos trimestres después de un T2 es un **T4**, con efecto $-11$: $\hat y_{T+2 \mid T} = 200 + 2(3) - 11 = 195$. El primer pronóstico (T3) sería $200 + 3 + 9 = 212$.
:::
