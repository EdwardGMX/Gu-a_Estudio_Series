### Bloque G · Preguntas de respuesta abierta {#ej-abiertas}

El examen pide **explicar, comparar, justificar, interpretar y proponer**. Escribe tu respuesta como la redactarías en el examen, abre la respuesta modelo, palomea los puntos que sí incluiste y califícate. Las que marques «a medias» o «mal» se van a tu lista de [repaso de errores](practica.html#errores). Las 21 preguntas tipo de la guía oficial están en [Preguntas tipo](preguntas-tipo.html).

:::abierta Interprete | [[conjunta]]
A las ventas mensuales de una tienda se les aplican las pruebas con `regression='c'`. Serie original: ADF p-value = 0.41 y KPSS p-value = 0.01. Después de una diferencia regular: ADF p-value = 0.001 y KPSS p-value = 0.10. Redacta la conclusión.
---
En la serie original la ADF **no rechaza** la raíz unitaria (0.41 > 0.05) y la KPSS **rechaza** la estacionariedad (0.01 < 0.05): las dos pruebas coinciden en que la serie **no es estacionaria**. Después de una diferencia, la ADF rechaza la raíz unitaria (0.001 < 0.05) y la KPSS no rechaza la estacionariedad (0.10 > 0.05): la serie diferenciada **es estacionaria**. Una diferencia regular basta, $d = 1$; diferenciar otra vez sería sobrediferenciar. El siguiente paso es leer la ACF y la PACF de la serie diferenciada para proponer los órdenes.
+++
- Lee cada prueba con su hipótesis nula correcta.
- Concluye «no estacionaria» para la serie original.
- Concluye «estacionaria» para la serie diferenciada y fija $d = 1$.
- Dice qué sigue (ACF y PACF) o advierte que no hay que diferenciar más.
:::

:::abierta Justifique | [[multiplicativo]]
En la gráfica de una serie mensual, los picos de diciembre son cada año más altos y la distancia entre el pico y el valle crece conforme sube el nivel. ¿Conviene un modelo aditivo o uno multiplicativo? ¿Qué transformación aplicarías y cómo comprobarías que funcionó?
---
Conviene el **multiplicativo**, $y_t = T_t \times S_t \times \varepsilon_t$: cuando la amplitud estacional crece con el nivel, la estacionalidad es un **porcentaje** de la tendencia y no una cantidad fija, que es lo que supone el modelo aditivo. Se aplica el **logaritmo**, que convierte el producto en suma, $\ln y_t = \ln T_t + \ln S_t + \ln \varepsilon_t$, y estabiliza la varianza. Para comprobarlo se grafica la serie en logaritmos (la amplitud de los picos debe verse pareja) y se revisa la desviación estándar móvil, que ya no debe crecer con la media móvil. La serie debe ser positiva; al pronosticar se regresa a la escala original con la exponencial.
+++
- Elige el multiplicativo y lo justifica con la amplitud que crece con el nivel.
- Propone el logaritmo y explica que convierte el producto en suma.
- Da una forma de comprobarlo (gráfica en logaritmos o desviación estándar móvil).
:::

:::abierta Explique | [[estacionalidad-vs]]
Explique la diferencia entre **estacionalidad** y **estacionariedad**. ¿Puede ser estacionaria una serie con estacionalidad marcada?
---
Son conceptos distintos aunque suenen parecido. La **estacionalidad** es un componente de la serie: un patrón que se repite con periodo fijo y conocido (cada 12 meses, cada 7 días). La **estacionariedad** es una propiedad estadística: media y varianza constantes y autocovarianza que depende solo del rezago. Una serie con estacionalidad marcada **no es estacionaria**, porque su media depende del momento del ciclo: el valor esperado de diciembre no es el de febrero. Para volverla estacionaria se quita ese componente, por ejemplo con una diferencia estacional $y_t - y_{t-s}$ o restando el patrón estimado; después se verifican las pruebas y la ACF, que ya no debe mostrar picos persistentes en $s, 2s, 3s$.
+++
- Estacionalidad: patrón de periodo fijo (un componente).
- Estacionariedad: media, varianza y autocovarianza estables (una propiedad).
- Una serie con estacionalidad marcada no es estacionaria, y dice por qué (la media depende del periodo).
- Cómo se corrige: diferencia estacional o quitar el componente.
:::

:::abierta Compare | [[tendencias]]
Compare la tendencia **determinística** con la tendencia **estocástica**: cómo se elimina cada una y qué ocurre si se usa el remedio equivocado.
---
Con tendencia **determinística** la serie fluctúa alrededor de una función fija del tiempo, $y_t = a + bt + \varepsilon_t$: los choques son transitorios y la serie regresa a la recta. Se elimina **restando la recta** estimada por regresión, y lo que queda es estacionario. Con tendencia **estocástica** hay raíz unitaria, como en el paseo aleatorio con deriva, $y_t = c + y_{t-1} + \varepsilon_t$: cada choque se queda para siempre en el nivel. Se elimina **diferenciando**. Si se diferencia una serie con tendencia determinística se introduce una media móvil no invertible (sobrediferenciación); si se le resta una recta a un paseo aleatorio, el residuo sigue sin ser estacionario. Se distinguen con la ADF con constante y tendencia y con la KPSS alrededor de una tendencia.
+++
- Determinística: recta más ruido estacionario; choques transitorios; se quita con regresión.
- Estocástica: raíz unitaria; choques permanentes; se quita diferenciando.
- Consecuencia de equivocarse en al menos un sentido.
- Cómo distinguirlas (ADF con tendencia, KPSS).
:::

:::abierta Interprete | [[lb-h]]
A una serie mensual ya diferenciada se le aplica Ljung–Box y se obtiene: rezago 6, p-value = 0.32; rezago 12, p-value = 0.004; rezago 24, p-value = 0.001. ¿Qué concluyes?
---
Hasta el rezago 6 no se rechaza que las autocorrelaciones sean cero (0.32 > 0.05), pero al incluir los rezagos hasta 12 y hasta 24 sí se rechaza (0.004 y 0.001): la serie **no es ruido blanco**. Como la significancia aparece justo al incorporar el rezago 12 en datos mensuales, la dependencia es **estacional**: hay autocorrelación a un año de distancia que la diferencia regular no quitó. Queda estructura por modelar; lo que sigue es revisar la ACF en los rezagos 12 y 24 y considerar una diferencia estacional o términos estacionales. Elegir un solo valor de $h$ pequeño habría escondido el problema, por eso se reportan varios.
+++
- Lee los tres p-values contra 0.05.
- Concluye que hay autocorrelación: la serie no es ruido blanco.
- Relaciona el rezago 12 con estructura estacional.
- Dice qué sigue o por qué conviene reportar varios rezagos.
:::

:::abierta Explique | [[especificaciones]]
¿Por qué importa elegir la especificación de la ADF (sin constante, con constante, con constante y tendencia)? ¿Qué pasa si se usa «solo constante» en una serie con crecimiento lineal persistente?
---
La especificación define **contra qué alternativa** se compara la raíz unitaria. Sin constante: la alternativa es una serie estacionaria centrada en cero. Con constante: estacionaria alrededor de una media distinta de cero. Con constante y tendencia: estacionaria alrededor de una recta. Si la serie crece de forma lineal y se usa solo constante, ninguna «media fija» la describe: la prueba ve que la serie nunca regresa a un nivel y **no rechaza** la raíz unitaria aunque en realidad sea estacionaria alrededor de una tendencia determinística. Es decir, se confunde tendencia determinística con raíz unitaria y se termina diferenciando una serie que solo necesitaba que se le quitara la recta. La regla es elegir la especificación **mirando primero la gráfica**.
+++
- Qué supone cada especificación (cero, media, recta).
- El error: con solo constante, una tendencia determinística se confunde con raíz unitaria.
- La consecuencia práctica (diferenciar de más) o la regla de mirar la gráfica.
:::

:::abierta Proponga | [[caso]]
Te entregan una serie **trimestral** de 15 años con tendencia creciente y picos en el cuarto trimestre que se hacen más grandes con el nivel. Proponga, en orden, el análisis de la Unidad I que harías antes de ajustar cualquier modelo.
---
(1) **Construir la serie**: fecha como índice, frecuencia trimestral, sin duplicados ni huecos. (2) **Graficar** y describir: tendencia creciente, estacionalidad con $s = 4$, amplitud que crece con el nivel. (3) **Estadísticos móviles y descomposición** multiplicativa para confirmar que la varianza crece con el nivel. (4) **Transformar**: logaritmo para estabilizar la varianza; después una diferencia regular para la tendencia y una estacional de orden 4 para el patrón del cuarto trimestre. (5) **Probar** con ADF y KPSS antes y después de cada transformación, justificando cada una. (6) **ACF y PACF** de la serie transformada para proponer órdenes, y Ljung–Box para confirmar que hay dependencia que modelar. (7) **Concluir** por escrito qué transformaciones se aplicaron, con qué evidencia y qué modelos candidatos se probarán.
+++
- Construye y grafica la serie, e identifica tendencia, $s = 4$ y varianza creciente.
- Propone logaritmo, diferencia regular y diferencia estacional de orden 4.
- Usa ADF y KPSS antes y después de transformar.
- Termina con ACF y PACF (y Ljung–Box) sobre la serie ya estacionaria.
:::

:::abierta Interprete | [[patrones]]
La ACF de una serie empieza en 0.97 y baja muy despacio. Se aplica una diferencia y ahora la ACF tiene un único pico significativo, en el rezago 1 (−0.45), mientras que la PACF decae poco a poco con valores negativos. ¿Qué modelo propones para la serie original?
---
La ACF original, cercana a 1 y con caída muy lenta, indica **no estacionariedad**: se justifica la diferencia, $d = 1$. En la serie diferenciada, la **ACF se corta después del rezago 1** y la **PACF decae**: es la huella de un MA(1), con coeficiente negativo porque el pico es negativo. El modelo propuesto para la serie original es un **ARIMA(0,1,1)**. Antes de aceptarlo hay que confirmar con ADF y KPSS que la serie diferenciada es estacionaria y, después de ajustar, que los residuos no tienen autocorrelación (Ljung–Box). Un pico cercano a −0.5 también puede ser señal de sobrediferenciación, pero aquí la ACF original respalda que la diferencia era necesaria.
+++
- ACF original lenta y cercana a 1: no estacionaria, $d = 1$.
- En la diferencia, ACF que se corta en 1 y PACF que decae: MA(1).
- Modelo final: ARIMA(0,1,1).
- Menciona una verificación (pruebas de estacionariedad, residuos o sobrediferenciación).
:::

### Bloque H · Tendencia, rupturas, varianza y regresión sobre el tiempo {#ej-h .prof}

Ejercicios de los temas de profundización del inciso 1.2.4 del temario: [[prueba-tendencia]], [[pruebas-ruptura]], [[pruebas-varianza]] y [[regresion-tendencia]].

:::ejercicio Básico | [[prueba-tendencia]]
Con los datos $y = (2,\ 4,\ 3,\ 5,\ 6)$, ¿cuánto vale el estadístico $S$ de Mann–Kendall?
- [ ] 4
- [x] 8
- [ ] 9
- [ ] 10
---
Hay $\binom{5}{2} = 10$ parejas. Solo una baja (el 4 contra el 3 que le sigue); las otras 9 suben. $S = 9 - 1 = 8$. El máximo posible sería 10, si todas subieran [[guia-mk]].
:::

:::ejercicio Intermedio | [[prueba-tendencia]]
La prueba de Mann–Kendall aplicada a un paseo aleatorio **sin deriva** de 120 datos da $Z = -9.3$. ¿Cuál es la lectura correcta?
- [ ] La serie tiene una tendencia determinística decreciente muy fuerte.
- [ ] La serie es estacionaria.
- [x] La prueba rechaza porque supone datos independientes; la autocorrelación del paseo crea rachas que parecen tendencia.
- [ ] Hay que usar una pendiente de Sen positiva para corregir el signo.
---
Mann–Kendall supone que, bajo $H_0$, los datos son independientes. Un paseo aleatorio forma rachas largas que «votan» casi siempre en la misma dirección, y la prueba rechaza aunque no haya tendencia determinística. Para distinguir tendencia determinística de estocástica se usa la ADF con `"ct"` y la KPSS [[especificaciones]].
:::

:::ejercicio Intermedio | [[pruebas-ruptura]]
En una prueba de Chow para un cambio de media en una fecha conocida, con $n = 20$: $\mathrm{SCR}_R = 50$, $\mathrm{SCR}_1 = 8$ y $\mathrm{SCR}_2 = 12$. ¿Cuánto vale $F$?
- [ ] 1.5
- [ ] 2.5
- [x] 27
- [ ] 30
---
:::pasos
= \mathrm{SCR}_1 + \mathrm{SCR}_2 = 20, \qquad k = 1
> El modelo libre tiene una media por tramo.
= F = \frac{(50 - 20)/1}{20/(20 - 2)} = \frac{30}{1.111} = 27
> Se compara con $F_{1,\,18}(0.95) = 4.41$: se rechaza que la media sea la misma en los dos tramos.
:::
:::

:::ejercicio Intermedio | [[pruebas-ruptura]]
Una serie con un salto de nivel da ADF p-value = 0.40. La prueba de Zivot–Andrews da p-value = 0.01 y ubica la ruptura en $t = 150$. ¿Qué concluyes?
- [ ] La serie tiene raíz unitaria; hay que diferenciarla.
- [x] La serie es estacionaria alrededor de una media que cambia en $t \approx 150$; la ADF no rechazaba por culpa de la ruptura.
- [ ] Las dos pruebas se contradicen, así que no se puede concluir nada.
- [ ] La ruptura hace que la serie tenga varianza infinita.
---
Zivot–Andrews es una ADF que permite una ruptura en fecha desconocida. Rechazar su nula (raíz unitaria) es evidencia de **estacionariedad con un cambio de nivel**. Es el caso típico de [[rupturas]]: la ADF sola confunde el salto con persistencia. Lo adecuado es modelar cada tramo o agregar una variable indicadora del cambio, no diferenciar.
:::

:::ejercicio Básico | [[pruebas-varianza]]
A los residuos (sin tendencia) de una serie mensual se les aplica Breusch–Pagan contra $t$: p-value = 0.0001. En logaritmos: p-value = 0.17. ¿Qué indica?
- [ ] La serie original es homoscedástica y el logaritmo la volvió heteroscedástica.
- [x] La varianza de la serie original cambia con el tiempo; el logaritmo la estabiliza, lo que apunta a un modelo multiplicativo.
- [ ] Las dos series tienen raíz unitaria.
- [ ] Hay que aplicar dos diferencias.
---
La nula de Breusch–Pagan es **homoscedasticidad**. Se rechaza en la serie original (la varianza depende de $t$) y no en logaritmos. Es el patrón de AirPassengers: la amplitud crece con el nivel y el logaritmo la empareja [[multiplicativo]].
:::

:::ejercicio Básico | [[regresion-tendencia]]
Con $t = 1, 2, 3, 4$ y $y = (3,\ 5,\ 6,\ 10)$ se ajusta $y_t = \beta_0 + \beta_1 t + \varepsilon_t$ por mínimos cuadrados. ¿Cuál es el pronóstico para $t = 5$?
- [ ] 11
- [x] 11.5
- [ ] 12
- [ ] 13.2
---
:::pasos
= \bar t = 2.5, \quad \bar y = 6, \quad \sum(t - \bar t)(y_t - \bar y) = 4.5 + 0.5 + 0 + 6 = 11, \quad \sum(t - \bar t)^2 = 5
> Las desviaciones de $t$ son $(-1.5, -0.5, 0.5, 1.5)$ y las de $y$, $(-3, -1, 0, 4)$.
= \hat\beta_1 = 11/5 = 2.2, \qquad \hat\beta_0 = 6 - 2.2(2.5) = 0.5
> La recta ajustada.
= \hat y_5 = 0.5 + 2.2(5) = 11.5
> El pronóstico prolonga la recta [[guia-reg-tendencia]].
:::
:::

:::ejercicio Intermedio | [[regresion-tendencia]]
Se ajusta $\ln y_t = 4.8 + 0.01\,t$ a una serie **mensual**. ¿Qué tasa de crecimiento anual implica, aproximadamente?
- [ ] 1%
- [ ] 10%
- [x] 12.7%
- [ ] 120%
---
$\beta_1 = 0.01$ es un crecimiento de cerca de 1% **mensual**. En un año, $e^{12(0.01)} - 1 = e^{0.12} - 1 = 0.127$, es decir, 12.7%. Es el orden de lo que crece AirPassengers [[regresion-tendencia]].
:::

:::ejercicio Reto | [[regresion-tendencia]]
Al regresar un paseo aleatorio sin deriva sobre $t$ se obtiene $R^2 = 0.88$ y un estadístico $t$ de la pendiente de $-32.7$. Los residuos tienen $\hat\rho(1) = 0.75$. ¿Qué está pasando?
- [ ] La serie tiene una tendencia determinística decreciente.
- [ ] Hay que agregar dummies de mes para mejorar el ajuste.
- [x] Es una regresión espuria: el error no es estacionario y las pruebas $t$ y el $R^2$ no son válidos.
- [ ] El $R^2$ alto confirma que la recta sirve para pronosticar.
---
Con una tendencia **estocástica**, el residuo de la regresión sobre $t$ sigue siendo un paseo aleatorio [[tendencias]]. Las pruebas de mínimos cuadrados suponen un error estacionario; sin eso, la prueba $t$ rechaza en la gran mayoría de los casos aunque no haya pendiente. La alarma son los residuos muy persistentes. El tratamiento correcto es diferenciar.
:::
