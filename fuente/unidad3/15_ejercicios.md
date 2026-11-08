## 🧩 Ejercicios de la Unidad III {#ejercicios3}
@mapa 63 ejercicios de opción múltiple y de cálculo paso a paso, cada uno con su respuesta explicada y un enlace al tema.

Elige una opción y presiona **Ver respuesta**: se marca la correcta, se explica por qué y hay un enlace a la sección donde se estudia. Los ejercicios de cálculo abierto tienen **Ver solución paso a paso**. Intenta resolverlos en papel antes de abrir la solución.

<div class="marcador" id="marcador"><div class="m-datos"><span class="m-resp"></span><span class="m-ok"></span><span class="m-mal"></span></div><button type="button">Reiniciar ejercicios</button></div>

### Bloque A · Frecuencia, periodo y alias {#ej3-a}

:::ejercicio Básico | [[oscilacion]]
En datos mensuales, un patrón que se repite cada 4 meses tiene frecuencia:
- [ ] $\omega = 0.0833$
- [ ] $\omega = 4$
- [x] $\omega = 0.25$ ciclos por observación
- [ ] $\omega = 0.5$
---
$\omega = 1/\Per = 1/4 = 0.25$. El valor 0.0833 sería el ciclo anual (periodo 12).
:::

:::ejercicio Básico | [[oscilacion]]
¿Qué frecuencia tiene el patrón semanal en datos diarios?
- [ ] $7$
- [x] $1/7 \approx 0.143$
- [ ] $1/52$
- [ ] $0.5$
---
Se repite cada 7 observaciones: $\omega = 1/7$. Con `fs=7` en `scipy` aparecería en 1 ciclo por semana.
:::

:::ejercicio Básico | [[nyquist]]
¿Cuál es la oscilación más rápida que se puede ver con datos tomados en tiempos enteros?
- [x] La de periodo 2 ($\omega = 1/2$)
- [ ] La de periodo 1
- [ ] La de periodo 4
- [ ] No hay límite
---
Es la frecuencia de Nyquist: sube y baja en dos observaciones. Las más rápidas aparecen como un alias más lento.
:::

:::ejercicio Intermedio | [[demo-alias]]
Una señal de 0.8 ciclos por observación se muestrea en $t = 0, 1, 2, \dots$ ¿Qué oscilación «ven» los datos?
- [ ] Una de 0.8 ciclos por observación
- [x] Una de 0.2 ciclos por observación (periodo 5)
- [ ] Una de 0.4
- [ ] Ninguna: se ve como ruido
---
$\cos(2\pi\cdot 0.8\,t) = \cos(2\pi(1 - 0.2)t) = \cos(2\pi\cdot 0.2\,t)$ para $t$ entero. El alias es $\lvert 0.8 - 1\rvert = 0.2$.
:::

:::ejercicio Intermedio | [[unidades-frecuencia]]
Un libro reporta un pico en $\lambda = \pi/6$ radianes por observación. ¿Cuál es el periodo?
- [ ] 6
- [ ] 3
- [ ] $\pi/6$
- [x] 12
---
$\omega = \lambda/2\pi = 1/12$ ciclos por observación, así que $\Per = 12$ (el ciclo anual en datos mensuales).
:::

:::ejercicio Intermedio | [[demo-fase-regresion]]
Una oscilación se ajustó como $x_t = 3\cos(2\pi\omega t) - 4\sin(2\pi\omega t)$. ¿Cuál es su amplitud y cuánta varianza aporta?
- [ ] Amplitud 7, varianza 49
- [ ] Amplitud 5, varianza 25
- [ ] Amplitud 1, varianza 0.5
- [x] Amplitud 5, varianza 12.5
---
$A = \sqrt{3^2 + 4^2} = 5$ y la varianza de una oscilación es $A^2/2 = 12.5$ [[guia-tres-componentes]].
:::

:::ejercicio Básico | [[demo-ortogonalidad]]
Con $n = 4$, ¿cuánto vale $\sum_{t=1}^{4}\cos(2\pi t/4)\sin(2\pi t/4)$?
- [x] 0
- [ ] 2
- [ ] 4
- [ ] 1
---
$\cos = (0, -1, 0, 1)$ y $\sin = (1, 0, -1, 0)$: todos los productos valen 0. En las frecuencias de Fourier, el seno y el coseno son ortogonales.
:::

### Bloque B · Periodicidad y ciclo {#ej3-b}

:::ejercicio Básico | [[periodo-vs-ciclo]]
¿Cuál de estos patrones es un **ciclo** y no una periodicidad?
- [ ] La estacionalidad anual de las ventas mensuales
- [ ] El patrón semanal de los usuarios del metro
- [x] El ciclo de las manchas solares (de 7 a 17 años)
- [ ] El ciclo día–noche de la temperatura horaria
---
Su duración varía; los otros tres tienen un periodo fijo marcado por el calendario o por la rotación de la Tierra.
:::

:::ejercicio Intermedio | [[demo-acf-oscilacion]]
Para $x_t = A\cos(2\pi t/12 + \varphi)$ con fase al azar, ¿cuánto vale $\rho(6)$?
- [x] −1
- [ ] 0
- [ ] 0.5
- [ ] 1
---
$\rho(k) = \cos(2\pi k/12)$, así que $\rho(6) = \cos\pi = -1$: medio ciclo después, el valor es el opuesto. Y $\rho(12) = \rho(24) = 1$: la ACF no se apaga.
:::

:::ejercicio Básico | [[periodo-vs-ciclo]]
¿Cómo se ve un **ciclo** de duración variable en el periodograma suavizado?
- [ ] Como una línea angosta en $1/\Per$
- [ ] Como un espectro plano
- [x] Como una joroba ancha alrededor de su frecuencia típica
- [ ] Como un valle en $1/\Per$
---
Como cada vuelta dura un poco distinto, la potencia se reparte entre muchas frecuencias vecinas. La línea angosta es la huella de una periodicidad exacta.
:::

:::ejercicio Intermedio | [[cuando-sarima]]
Los máximos de una serie anual están separados por 10, 12, 9, 13 y 11 años. ¿Qué conviene?
- [ ] Un SARIMA con $s = 11$, porque la duración media es 11
- [x] Un AR(2) o AR($p$) que genere un ciclo, porque la duración cambia
- [ ] Una diferencia estacional $1 - L^{11}$
- [ ] Eliminar el ciclo con una media móvil de 11
---
La duración va de 9 a 13: es un ciclo. Un término estacional de periodo fijo se desfasaría a los pocos ciclos [[guia-ciclos-solares]].
:::

:::ejercicio Básico | [[ciclo-acf]]
¿Qué ACF corresponde a un ciclo AR(2) con raíces complejas?
- [ ] Cero después del rezago 2
- [ ] Positiva y decae sin oscilar
- [ ] Oscila con la misma altura para siempre
- [x] Oscila y se apaga
---
La ACF de un AR(2) con raíces complejas es aproximadamente $r^k\cos(\cdot)$: oscila con el ciclo y decae con $r^k$ [[u2:ar2-complejas]].
:::

### Bloque C · Densidad espectral {#ej3-c}

:::ejercicio Básico | [[demo-espectro-rb]]
Un ruido blanco tiene $\sigma^2 = 4$. ¿Cuál es su densidad espectral?
- [ ] $f(0) = 4$ y $f(\omega) = 0$ en las demás
- [ ] $f(\omega) = 2$ para toda $\omega$
- [x] $f(\omega) = 4$ para toda $\omega$
- [ ] $f(\omega) = 4\cos(2\pi\omega)$
---
Solo $\gamma(0) = 4$ es distinta de cero, así que $f(\omega) = \gamma(0) = 4$: plana. Comprobación: $2\int_0^{1/2}4\,d\omega = 4$.
:::

:::ejercicio Intermedio | [[demo-espectro-ma1]]
MA(1) con $\theta = -0.5$ y $\sigma^2 = 1$. ¿Cuánto vale $f(0)$?
- [ ] 2.25
- [x] 0.25
- [ ] 1.25
- [ ] 0
---
$f(0) = \sigma^2(1 + \theta)^2 = 0.5^2 = 0.25$, y $f(1/2) = (1 - \theta)^2 = 2.25$: con $\theta < 0$ el espectro sube hacia las frecuencias altas (hueco en las bajas).
:::

:::ejercicio Intermedio | [[demo-espectro-ar1]]
AR(1) con $\phi = 0.8$ y $\sigma^2 = 1$. ¿Cuánto vale $f(0)$?
- [ ] 5
- [ ] 1.8
- [ ] 0.309
- [x] 25
---
$f(0) = 1/(1 + 0.64 - 1.6) = 1/0.04 = 25$, contra $f(1/2) = 1/3.24 = 0.309$: espectro muy «rojo».
:::

:::ejercicio Intermedio | [[demo-propiedades-f]]
Una serie tiene $\gamma(0) = 2$, $\gamma(1) = 0.8$ y $\gamma(k) = 0$ para $k \ge 2$. ¿Cuánto vale $f(0)$?
- [x] 3.6
- [ ] 2.8
- [ ] 2
- [ ] 0.4
---
$f(\omega) = \gamma(0) + 2\gamma(1)\cos(2\pi\omega) = 2 + 1.6\cos(2\pi\omega)$; en $\omega = 0$ vale 3.6 y en $\omega = 1/2$, 0.4.
:::

:::ejercicio Básico | [[demo-propiedades-f]]
¿Qué mide el área bajo la densidad espectral entre $-1/2$ y $1/2$?
- [x] La varianza $\gamma(0)$
- [ ] La media de la serie
- [ ] La autocorrelación de primer orden
- [ ] El número de picos
---
Es la transformada inversa con $k = 0$: $\gamma(0) = \int f(\omega)\,d\omega$. Por eso el área en una banda es la varianza de esas frecuencias.
:::

:::ejercicio Reto | [[demo-pico-ar2]]
¿En qué periodo está el pico del espectro del AR(2) con $\phi_1 = 1$ y $\phi_2 = -0.5$?
- [ ] 8 exactamente
- [ ] 4
- [x] 8.69
- [ ] No tiene pico interior
---
$\cos(2\pi\omega^*) = \frac{1(-1.5)}{4(-0.5)} = 0.75 \Rightarrow \omega^* = 0.115$ y $\Per = 8.69$. El 8 es el pseudo-periodo de las raíces; el pico del espectro se corre porque $r = 0.71$ está lejos de 1.
:::

:::ejercicio Básico | [[misma-memoria]]
El espectro de una serie concentra su potencia cerca de $\omega = 1/2$. ¿Cómo es su ACF?
- [ ] Positiva y decae despacio
- [ ] Vale cero en todos los rezagos
- [ ] Tiene picos en 12, 24 y 36
- [x] Alterna de signo (positiva, negativa, positiva…)
---
Potencia en frecuencias altas = oscilaciones rápidas: la serie alterna arriba–abajo, como un AR(1) con $\phi < 0$ (espectro «azul»).
:::

:::ejercicio Intermedio | [[espectro-arma]]
¿Qué altura tienen los picos del AR estacional $(1 - 0.6L^{12})y_t = \varepsilon_t$ con $\sigma^2 = 1$?
- [ ] 1.6, en $\omega = 1/12$ solamente
- [x] 6.25, en $\omega = 0, 1/12, \dots, 6/12$
- [ ] 0.39, en $\omega = 1/24$
- [ ] 2.5, en $\omega = 1/2$
---
En $\omega = k/12$, $e^{-24\pi i\omega} = 1$ y el denominador vale $(1 - 0.6)^2 = 0.16$: $f = 1/0.16 = 6.25$. A la mitad entre ellas vale $1/1.6^2 = 0.39$.
:::

:::ejercicio Intermedio | [[varianza-bandas]]
¿Qué porcentaje de la varianza de un ruido blanco está en las frecuencias de 0 a 0.1?
- [x] 20%
- [ ] 10%
- [ ] 50%
- [ ] Depende de $\sigma^2$
---
Con espectro plano, la fracción es $2(0.1)\sigma^2/\sigma^2 = 0.2$: la banda ocupa el 20% del intervalo $[0, 1/2]$.
:::

:::ejercicio Reto | [[demo-espectro-ma1]]
Calcula el espectro del MA(1) con $\theta = 0.8$ y $\sigma^2 = 1$ en $\omega = 0$, $1/4$ y $1/2$.
---
:::pasos
= f(\omega) = 1 + 0.64 + 2(0.8)\cos(2\pi\omega) = 1.64 + 1.6\cos(2\pi\omega)
> Fórmula del MA(1).
= f(0) = 3.24, \qquad f(1/4) = 1.64, \qquad f(1/2) = 0.04
> En $\omega = 1/2$ casi se anula: con $\theta$ cerca de 1, el MA promedia cada choque con el anterior y borra las oscilaciones más rápidas.
= 2\int_0^{1/2}f(\omega)\,d\omega = 2(0.82) = 1.64 = \gamma(0)
> Comprobación con el área.
:::
:::

### Bloque D · Transformada de Fourier y periodograma {#ej3-d}

:::ejercicio Básico | [[dft-def]]
Con 10 años de datos mensuales ($n = 120$), ¿qué índice $j$ corresponde al ciclo anual?
- [ ] $j = 12$
- [ ] $j = 1$
- [x] $j = 10$
- [ ] $j = 120$
---
$\omega_j = j/n = 1/12 \Rightarrow j = 120/12 = 10$: el ciclo anual cabe 10 veces en la muestra.
:::

:::ejercicio Intermedio | [[periodograma-mano]]
Para $x = (1, -1, 1, -1)$, ¿cuánto vale $I(1/2)$?
- [ ] 0
- [ ] 1
- [ ] 16
- [x] 4
---
$\sum x_t\cos(\pi t) = -4$, así que $I = (-4)^2/4 = 4$. Toda la suma de cuadrados ($\sum x_t^2 = 4$) está en la frecuencia de Nyquist, que en Parseval cuenta una sola vez.
:::

:::ejercicio Intermedio | [[parseval]]
Con $n = 10$, $\sum(x_t - \bar x)^2 = 50$ e $I(0.1) = 10$, $I(0.2) = 5$, $I(0.3) = 3$, $I(0.4) = 4$. ¿Cuánto vale $I(0.5)$?
- [ ] 28
- [x] 6
- [ ] 22
- [ ] 3
---
Parseval: $2(10 + 5 + 3 + 4) + I(0.5) = 44 + I(0.5) = 50$, así que $I(0.5) = 6$.
:::

:::ejercicio Reto | [[guia-periodograma]]
Calcula el periodograma de $x = (3, 1, -1, 1)$ en $\omega = 1/4$ y $\omega = 1/2$, y comprueba Parseval.
---
:::pasos
= \bar{x} = 1, \qquad x_t - \bar x = (2, 0, -2, 0), \qquad \sum(x_t - \bar x)^2 = 8
> Centramos la serie.
= \omega = 1/4:\ \cos(\pi t/2) = (0, -1, 0, 1),\ \sin(\pi t/2) = (1, 0, -1, 0) \;\Rightarrow\; \sum d_t\cos = 0,\ \sum d_t\sin = 2 + 2 = 4
> Productos con los cosenos y senos de la frecuencia de Fourier $j = 1$.
= I(1/4) = \frac{0^2 + 4^2}{4} = 4
> El periodograma.
= \omega = 1/2:\ \sum d_t\cos(\pi t) = -2 + 0 + 2 + 0 = 0 \;\Rightarrow\; I(1/2) = 0
> En Nyquist no hay energía.
= 2\,I(1/4) + I(1/2) = 8 = \sum(x_t - \bar x)^2
> Parseval se cumple: toda la variabilidad es una oscilación de periodo 4, $x_t = 1 + 2\sin(\pi t/2)$.
:::
:::

:::ejercicio Intermedio | [[guia-ic-periodograma]]
Una ordenada del periodograma vale $I = 20$. ¿Cuál es el intervalo de 95% para $f(\omega)$?
- [ ] $[18,\ 22]$
- [ ] $[10,\ 40]$
- [ ] $[0.27,\ 39.5]$
- [x] $[5.4,\ 790]$
---
$[\,2(20)/7.378,\ 2(20)/0.0506\,] = [5.42,\ 790]$: con una sola ordenada no se sabe casi nada de la altura de $f$.
:::

:::ejercicio Básico | [[periodograma-python]]
`scipy.signal.periodogram` devuelve 50 en una frecuencia interior. ¿Cuánto vale el periodograma de Shumway–Stoffer, $I(\omega_j)$?
- [ ] 100
- [x] 25
- [ ] 50
- [ ] 12.5
---
`scipy` reporta la densidad unilateral, $2I(\omega_j)$, para que el área entre 0 y 1/2 sea la varianza.
:::

:::ejercicio Básico | [[periodograma-ruido]]
¿Por qué se dice que el periodograma es un estimador **inconsistente**?
- [ ] Porque está sesgado aunque $n$ sea grande
- [ ] Porque puede dar valores negativos
- [x] Porque su varianza no disminuye al aumentar $n$
- [ ] Porque solo existe para $n$ par
---
Cada ordenada usa solo dos números ($d_c$ y $d_s$): $\Var[I] \approx f^2$ para cualquier $n$. Más datos dan más frecuencias, no más precisión en cada una.
:::

:::ejercicio Intermedio | [[periodograma-def]]
En la regresión sobre la frecuencia $\omega_j$ se obtuvo $\beta_1 = 2$ y $\beta_2 = 1$ con $n = 100$. ¿Cuánto vale $I(\omega_j)$?
- [x] 125
- [ ] 500
- [ ] 5
- [ ] 20
---
$P = \beta_1^2 + \beta_2^2 = 5 = \frac{4}{n}I$, así que $I = \frac{100}{4}(5) = 125$.
:::

:::ejercicio Básico | [[fuga]]
¿Qué reduce la fuga espectral de un pico fuerte hacia frecuencias lejanas?
- [x] Multiplicar la serie por una ventana (afilado) antes de la FFT
- [ ] Usar más frecuencias de Fourier
- [ ] Rellenar la serie con ceros
- [ ] Elevar la serie al cuadrado
---
La ventana evita el corte brusco en los extremos y baja la fuga lejana, a cambio de un pico un poco más ancho. Rellenar con ceros solo interpola.
:::

### Bloque E · Estimación del espectro {#ej3-e}

:::ejercicio Básico | [[idea-suavizar]]
Un periodograma suavizado de Daniell con $L = 5$ tiene cuántos grados de libertad:
- [ ] 5
- [ ] 2
- [x] 10
- [ ] 4
---
Es la suma de 5 ji-cuadradas de 2 grados de libertad: $2L = 10$.
:::

:::ejercicio Básico | [[idea-suavizar]]
Con $n = 240$ y $L = 9$, ¿cuál es el ancho de banda?
- [ ] $\Bw = 26.7$
- [ ] $\Bw = 9$
- [ ] $\Bw = 0.0042$
- [x] $\Bw = 0.0375$
---
$\Bw = L/n = 9/240 = 0.0375$ ciclos por observación: dos picos más cercanos que eso no se distinguen.
:::

:::ejercicio Reto | [[guia-daniell]]
Tres ordenadas vecinas valen 12, 30 y 18. Calcula el suavizado de Daniell con $L = 3$ y su intervalo de 95% ($\chi^2_6(0.025) = 1.237$, $\chi^2_6(0.975) = 14.449$).
---
:::pasos
= \hat f = \frac{12 + 30 + 18}{3} = 20
> Promedio de las tres ordenadas.
= \text{gl} = 2L = 6
> Grados de libertad.
= \left[\frac{6(20)}{14.449},\ \frac{6(20)}{1.237}\right] = [8.3,\ 97.0]
> Mucho más angosto que el de una sola ordenada ($[0.27I,\ 39.5I]$), aunque todavía amplio: el cociente es 11.7.
:::
:::

:::ejercicio Intermedio | [[welch]]
Welch con $n = 1000$, `nperseg=200` y `noverlap=100`. ¿Cuántos segmentos se promedian y cuál es la resolución?
- [ ] 5 segmentos, resolución 1/1000
- [x] 9 segmentos, resolución 1/200
- [ ] 10 segmentos, resolución 1/100
- [ ] 9 segmentos, resolución 1/100
---
Los segmentos empiezan cada 100 datos: $(1000 - 200)/100 + 1 = 9$. La resolución es $1/M = 1/200$.
:::

:::ejercicio Básico | [[sesgo-varianza]]
Si aumentas mucho el suavizado ($L$ grande), ¿qué pasa?
- [ ] Baja la varianza y los picos se vuelven más altos
- [x] Baja la varianza, pero los picos se aplanan y se pierde resolución
- [ ] Sube la varianza y se gana resolución
- [ ] No cambia nada si $n$ es grande
---
Es el dilema sesgo–varianza: la brocha gruesa deja la curva pareja pero borra los detalles.
:::

:::ejercicio Intermedio | [[ar-espectral]]
Se ajustó un AR(1) con $\hat\phi = 0.5$ y $\hat\sigma^2 = 2$. ¿Cuánto vale el estimador paramétrico en $\omega = 0$?
- [ ] 2
- [ ] 4
- [x] 8
- [ ] 0.889
---
$\hat f(0) = \hat\sigma^2/(1 - \hat\phi)^2 = 2/0.25 = 8$. En $\omega = 1/2$ vale $2/1.5^2 = 0.889$.
:::

:::ejercicio Básico | [[comparacion-espectral]]
¿Cuál de estos estimadores es **paramétrico**?
- [ ] El periodograma suavizado de Daniell
- [ ] El método de Welch
- [ ] El periodograma con ventana de Hann
- [x] El espectro de un AR($p$) ajustado por Yule–Walker
---
Supone un modelo y calcula el espectro con sus parámetros. Los otros tres solo promedian periodogramas.
:::

:::ejercicio Intermedio | [[orden-ar]]
¿Qué riesgo tiene usar un orden AR mucho mayor que el que sugiere el AIC para estimar el espectro?
- [x] Que aparezcan picos falsos (el modelo ajusta el ruido)
- [ ] Que el espectro quede plano
- [ ] Que el espectro sea negativo
- [ ] Ninguno: más orden siempre es mejor
---
Con muchos coeficientes, el AR puede «inventar» oscilaciones. Por eso se elige $p$ con un criterio y se compara con el periodograma suavizado.
:::

### Bloque F · Espectro cruzado y coherencia {#ej3-f}

:::ejercicio Básico | [[mag-fase-coh]]
En una frecuencia, $f_x = 2$, $f_y = 8$ y $\lvert f_{yx}\rvert = 3$. ¿Cuánto vale la coherencia?
- [ ] 0.1875
- [ ] 0.75
- [ ] 3
- [x] 0.5625
---
$\rho^2 = 3^2/(2\cdot 8) = 9/16 = 0.5625$: el 56% de la varianza de $y$ en esa frecuencia se explica linealmente con $x$.
:::

:::ejercicio Intermedio | [[demo-retardo]]
En $\omega = 0.125$ la fase estimada es $-\pi/2$. Si la relación es un retardo puro, ¿cuántos periodos va atrasada $y$?
- [ ] 0.5
- [ ] 4
- [x] 2
- [ ] 8
---
$D = -\varphi/(2\pi\omega) = (\pi/2)/(2\pi\cdot 0.125) = 2$.
:::

:::ejercicio Básico | [[coherencia-cruda]]
¿Cuánto vale la coherencia calculada con los periodogramas **crudos** (sin promediar)?
- [x] 1 en todas las frecuencias
- [ ] 0 en todas las frecuencias
- [ ] La correlación entre las series
- [ ] Depende de las series
---
$\lvert d_y\bar d_x\rvert^2/(\lvert d_x\rvert^2\lvert d_y\rvert^2) = 1$ siempre: sin promediar no se puede medir la coherencia.
:::

:::ejercicio Intermedio | [[coherencia-cruda]]
Con $L = 9$ ordenadas promediadas, el umbral de 5% es 0.312. Una coherencia estimada de 0.25 en una frecuencia:
- [ ] Es significativa
- [x] No es significativa al 5%
- [ ] Indica una relación negativa
- [ ] Indica un retardo de 2 periodos
---
$0.25 < 0.312$: con independencia saldrían valores así por azar.
:::

:::ejercicio Básico | [[cruzado-macro]]
En las frecuencias del ciclo económico, la fase entre el PIB y el cambio del desempleo es cercana a $\pi$. ¿Qué significa?
- [ ] Que no hay relación
- [ ] Que van en fase
- [x] Que se mueven en sentidos opuestos
- [ ] Que el desempleo se adelanta un año
---
Una fase de $\pi$ es medio ciclo de desfase: cuando una sube, la otra baja (la relación es negativa).
:::

:::ejercicio Intermedio | [[demo-retardo]]
$y_t = 2x_{t-3} + v_t$, con $v$ independiente de $x$ y $f_v = f_x$. ¿Cuánto vale la coherencia?
- [x] 0.8
- [ ] 0.5
- [ ] 1
- [ ] 0.667
---
$\rho^2 = \beta^2 f_x/(\beta^2 f_x + f_v) = 4f_x/(4f_x + f_x) = 0.8$. El retardo no cambia la coherencia; cambia la fase ($-6\pi\omega$).
:::

:::ejercicio Intermedio | [[cruzado-macro]]
Con `scipy.signal.csd(x, y)`, la fase baja en línea recta con pendiente negativa. ¿Qué indica?
- [ ] Que $x$ va atrasada respecto a $y$
- [ ] Que las series no son estacionarias
- [ ] Que la coherencia es 0
- [x] Que $y$ va atrasada respecto a $x$
---
`csd(x, y)` calcula $\overline{X}Y$, cuya fase es $-2\pi\omega D$ cuando $y_t$ copia a $x_{t-D}$: pendiente $-2\pi D$ con $D > 0$.
:::

### Bloque G · Filtros lineales {#ej3-g}

:::ejercicio Básico | [[guia-ganancia-mm3]]
¿Cuál es la ganancia de la media móvil centrada de 3 en $\omega = 1/6$?
- [ ] 1
- [x] 2/3
- [ ] 1/3
- [ ] 0
---
$A = (1 + 2\cos(2\pi/6))/3 = (1 + 1)/3 = 2/3$. En $\omega = 1/3$ vale 0.
:::

:::ejercicio Intermedio | [[demo-ganancia-diferencia]]
¿Cuál es la ganancia $\lvert A(\omega)\rvert$ de la diferencia $1 - L$ en $\omega = 1/2$?
- [ ] 0
- [x] 2
- [ ] 4
- [ ] 1
---
$\lvert A\rvert^2 = 4\sin^2(\pi/2) = 4$, así que $\lvert A\rvert = 2$: la oscilación más rápida sale con el doble de amplitud (y 4 veces su varianza).
:::

:::ejercicio Intermedio | [[demo-filtro-espectro]]
Si diferencias un ruido blanco con $\sigma^2 = 1$, ¿cuál es la varianza de la serie diferenciada?
- [x] 2
- [ ] 1
- [ ] 4
- [ ] 0.5
---
$f_y = 4\sin^2(\pi\omega)\cdot 1$ y su área es 2; directamente, $\Var(\varepsilon_t - \varepsilon_{t-1}) = 2\sigma^2$. Es la sobrediferenciación [[u2:sobrediferenciar]].
:::

:::ejercicio Básico | [[respuesta-impulso]]
¿Cuál es la respuesta al impulso de $y_t = 0.4x_t + 0.4x_{t-1} + 0.2x_{t-2}$ y su ganancia en $\omega = 0$?
- [ ] $(0.4,\ 0.8,\ 1)$ y ganancia 1
- [ ] $(1,\ 1,\ 1)$ y ganancia 3
- [ ] $(0.2,\ 0.4,\ 0.4)$ y ganancia 0
- [x] $(0.4,\ 0.4,\ 0.2)$ y ganancia 1
---
La respuesta al impulso son los pesos; $A(0) = \sum a_j = 1$. La opción $(0.4, 0.8, 1)$ es la respuesta al **escalón**.
:::

:::ejercicio Básico | [[demo-ganancia-diferencia]]
¿En qué frecuencias vale cero la ganancia de la diferencia estacional $1 - L^{12}$?
- [ ] Solo en $\omega = 0$
- [ ] Solo en $\omega = 1/12$
- [x] En $\omega = 0, 1/12, 2/12, \dots, 6/12$
- [ ] En $\omega = 1/24, 3/24, \dots$
---
$\lvert A\rvert^2 = 4\sin^2(12\pi\omega)$ se anula en los múltiplos de $1/12$: quita la tendencia y toda la estacionalidad.
:::

:::ejercicio Intermedio | [[mm-filtro]]
¿Cuántos periodos retrasa la tendencia una media móvil **causal** de los últimos 5 valores?
- [x] 2
- [ ] 5
- [ ] 0
- [ ] 2.5
---
Su fase es $-\pi\omega(k - 1)$, un retraso de $(k - 1)/2 = 2$ periodos en todas las frecuencias.
:::

:::ejercicio Básico | [[ses-filtro]]
Visto como filtro, el suavizamiento exponencial simple es:
- [ ] Un rechaza banda en $1/12$
- [ ] Un pasa altos de fase cero
- [x] Un pasa bajos causal que retrasa los movimientos lentos
- [ ] Un filtro que no cambia la ganancia
---
Sus pesos $\alpha(1 - \alpha)^j$ promedian el pasado: atenúan las frecuencias altas y, por ser causal, introducen un retraso de unos $(1 - \alpha)/\alpha$ periodos.
:::

### Bloque H · Tipos de filtros y diseño {#ej3-h}

:::ejercicio Básico | [[cuatro-tipos]]
Quieres quitar la tendencia lenta de una serie. ¿Qué tipo de filtro usas?
- [ ] Pasa bajos
- [x] Pasa altos
- [ ] Rechaza banda en $1/12$
- [ ] Ninguno: la tendencia no tiene frecuencia
---
La tendencia vive en las frecuencias cercanas a 0; un pasa altos (o la diferencia) las elimina.
:::

:::ejercicio Intermedio | [[guia-butterworth]]
Para aislar el ciclo económico (6 a 32 trimestres) con un pasa banda, ¿qué frecuencias de corte usas?
- [ ] $[6,\ 32]$
- [ ] $[0.6,\ 3.2]$
- [ ] $[1/6,\ 1/32]$ en radianes
- [x] $[1/32,\ 1/6] = [0.031,\ 0.167]$
---
Cada periodo se traduce con $\omega = 1/\Per$; el periodo largo da la frecuencia baja.
:::

:::ejercicio Básico | [[corte-orden]]
En un filtro Butterworth, ¿cuánto vale la ganancia en la frecuencia de corte?
- [x] $1/\sqrt2 \approx 0.707$
- [ ] 0.5
- [ ] 0
- [ ] 1
---
La potencia cae a la mitad (−3 dB) en $\omega_c$, para cualquier orden $N$.
:::

:::ejercicio Intermedio | [[guia-butterworth]]
Butterworth pasa bajos de orden 2 con corte en 0.1. ¿Cuál es su ganancia en $\omega = 0.2$?
- [ ] 0.707
- [x] 0.196
- [ ] 0.5
- [ ] 0.04
---
$\tan(0.2\pi)/\tan(0.1\pi) = 2.236$ y $1/\sqrt{1 + 2.236^4} = 0.196$. Con orden 4 sería 0.04.
:::

:::ejercicio Intermedio | [[fase-cero]]
¿Por qué no conviene usar `filtfilt` para construir una variable que entrará en un modelo de pronóstico?
- [ ] Porque cambia la frecuencia de las oscilaciones
- [ ] Porque su ganancia es mayor que 1
- [ ] Porque solo funciona con FIR
- [x] Porque usa datos futuros (fase cero) y eso es fuga de información
---
Filtra hacia adelante y hacia atrás: cada valor filtrado depende del futuro. Sirve para describir, no para pronosticar [[u2:fuga]].
:::

:::ejercicio Intermedio | [[hp]]
Con λ = 1600 en datos trimestrales, ¿cerca de qué periodo la ganancia del ciclo HP vale 1/2?
- [ ] 6 trimestres
- [ ] 16 trimestres
- [x] 40 trimestres
- [ ] 160 trimestres
---
$4\lambda(1 - \cos 2\pi\omega)^2 = 1$ da $\omega \approx 0.025$, periodo ≈ 40 trimestres (10 años).
:::

:::ejercicio Intermedio | [[notch]]
En datos diarios quieres quitar el patrón semanal sin tocar lo demás. ¿Qué propones?
- [ ] Un pasa bajos con corte en 1/2
- [x] Muescas (rechaza banda angostos) en $1/7$, $2/7$ y $3/7$
- [ ] Un pasa altos con corte en 1/7
- [ ] La diferencia $1 - L$
---
El patrón semanal tiene potencia en su frecuencia y sus armónicos. La diferencia $1 - L^7$ también lo quita, pero además elimina la tendencia y amplifica otras frecuencias.
:::

:::ejercicio Básico | [[filtro-ideal]]
Al truncar la respuesta al impulso del pasa bajos ideal aparecen ondulaciones en la ganancia. ¿Cómo se reducen?
- [ ] Truncando a menos pesos
- [ ] Aplicando el filtro dos veces
- [x] Multiplicando los pesos por una ventana (Hamming, Hann)
- [ ] No se pueden reducir
---
Es el fenómeno de Gibbs: con la ventana las ondulaciones casi desaparecen, a cambio de una transición más ancha.
:::

:::ejercicio Básico | [[bk]]
El filtro de Baxter–King con $K = 12$ aplicado a 203 trimestres, ¿cuántos datos devuelve?
- [ ] 203
- [ ] 191
- [ ] 12
- [x] 179
---
Pierde $K = 12$ datos al inicio y 12 al final: $203 - 24 = 179$.
:::

:::ejercicio Reto | [[guia-co2]]
Propón un filtro para extraer la tendencia del CO₂ mensual quitando su ciclo anual, y justifica con la ganancia.
---
:::pasos
= \text{conservar: periodos} > 24 \text{ meses}; \quad \text{quitar: } \omega = 1/12 \text{ y } 1/6
> El objetivo en frecuencias: el ciclo anual y su armónico semestral.
= \text{Butterworth pasa bajos}, \; N = 4, \; \omega_c = 1/24, \; \text{con filtfilt}
> Pasa bajos porque la tendencia está en frecuencias bajas; `filtfilt` para no retrasarla (es para describir).
= \lvert A(1/12)\rvert^2 = 0.058^2 = 0.003, \qquad \lvert A(1/48)\rvert^2 = 0.996
> El ciclo anual queda en 0.3% de su amplitud y los movimientos de 4 años pasan casi completos.
= \text{alternativa: media móvil } 2\times 12 \text{ (ganancia 0 exacta en } k/12)
> Las dos tendencias difieren menos de 0.4 ppm. Se descartan los extremos al interpretar.
:::
:::
