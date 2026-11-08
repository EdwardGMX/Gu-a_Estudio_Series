## 🌈 Densidad espectral {#densidad}
@mapa La transformada de Fourier de la autocovarianza: definición, propiedades (real, par, área = varianza), cómo se lee, los espectros del ruido blanco, MA(1), AR(1), AR(2) y ARMA calculados a mano, y la varianza repartida por bandas.

### La definición {#def-densidad}

En [[demo-varianza-componentes]] vimos que con un número finito de oscilaciones la varianza es una **suma** de aportes, uno por frecuencia. Una serie estacionaria cualquiera (un AR, un MA…) tiene aportes en **todas** las frecuencias, así que la suma se vuelve una curva: la densidad espectral.

:::definicion Densidad espectral
Para una serie débilmente estacionaria con $\sum_k \lvert\gamma(k)\rvert < \infty$, la **densidad espectral** es la transformada de Fourier de su autocovarianza:

$$f(\omega) = \sum_{k=-\infty}^{\infty}\gamma(k)\,e^{-2\pi i\omega k}, \qquad -\tfrac12 \le \omega \le \tfrac12$$

y la autocovarianza se recupera con la transformada inversa:

$$\gamma(k) = \int_{-1/2}^{1/2} e^{2\pi i\omega k}\,f(\omega)\,d\omega$$

En palabras de la guía oficial: describe **cómo se distribuye la potencia o varianza de la serie entre distintas frecuencias**.
:::

:::demo La densidad espectral es real, simétrica y su área es la varianza {#demo-propiedades-f}
:::pasos
= f(\omega) = \gamma(0) + \sum_{k=1}^{\infty}\gamma(k)\big(e^{-2\pi i\omega k} + e^{2\pi i\omega k}\big)
> Separamos el término $k = 0$ y juntamos cada $k$ con su $-k$, usando que la autocovarianza es simétrica: $\gamma(-k) = \gamma(k)$ [[u1:autocov-prop]].
= e^{-i\theta} + e^{i\theta} = 2\cos\theta
> Fórmula de Euler [[demo-euler]].
= f(\omega) = \gamma(0) + 2\sum_{k=1}^{\infty}\gamma(k)\cos(2\pi\omega k)
> **Forma real** de la densidad espectral: no hay números complejos. Es la fórmula que usaremos para calcular a mano.
= f(-\omega) = f(\omega)
> El coseno es par. Por eso basta graficar $f$ en $[0, 1/2]$.
= \gamma(0) = \int_{-1/2}^{1/2} f(\omega)\,d\omega = 2\int_{0}^{1/2} f(\omega)\,d\omega
> La transformada inversa con $k = 0$ ($e^0 = 1$). **El área bajo la densidad espectral es la varianza.** Con la simetría, el área de 0 a 1/2 es la mitad.
:::
:::

Además $f(\omega) \ge 0$ para toda frecuencia (lo justificaremos con el periodograma en [[periodograma-ruido]]: es el límite de un promedio de cuadrados). Sus unidades son **varianza por unidad de frecuencia**: igual que una densidad de probabilidad, lo que tiene sentido es el área en un intervalo, no la altura en un punto.

### Cómo se lee {#leer-densidad}

La guía oficial resume la interpretación en cuatro reglas:

| Lo que ves | Qué significa | Ejemplo |
|---|---|---|
| Potencia en frecuencias **cercanas a cero** | Patrones **lentos** o de largo plazo | Tendencia, AR(1) con $\phi$ cerca de 1 |
| Potencia en frecuencias **altas** (cerca de 1/2) | Variaciones **rápidas** | Ruido de medición, sobrediferenciación |
| **Picos** | Periodicidades o ciclos dominantes, de periodo $1/\omega_{\text{pico}}$ | Estacionalidad, ciclo solar |
| Potencia aproximadamente **plana** | Ruido blanco: ninguna frecuencia domina | Residuos de un buen modelo |

:::intuicion Un histograma de la varianza
Piensa en la densidad espectral como un **histograma** en el que el eje horizontal no tiene valores de la serie sino frecuencias, y el área de cada barra es la parte de la varianza que aportan las oscilaciones de esas frecuencias. Un histograma alto a la izquierda dice «casi toda la variabilidad viene de movimientos lentos»; uno plano dice «todas las velocidades aportan lo mismo»; una barra muy alta en medio dice «hay un ritmo que domina».
:::

### Ruido blanco: el espectro plano {#espectro-rb}

:::demo El ruido blanco tiene $f(\omega) = \sigma^2$ {#demo-espectro-rb}
:::pasos
= \gamma(0) = \sigma^2, \qquad \gamma(k) = 0 \text{ para } k \ne 0
> Definición de ruido blanco [[u1:ruido-blanco]].
= f(\omega) = \sigma^2 + 2\sum_{k=1}^{\infty} 0\cdot\cos(2\pi\omega k) = \sigma^2
> Todas las frecuencias aportan lo mismo: es el «blanco» de la luz que tiene todos los colores por igual.
= 2\int_0^{1/2}\sigma^2\,d\omega = 2\cdot\sigma^2\cdot\tfrac12 = \sigma^2
> Comprobación: el área es la varianza.
:::
:::

### MA(1): la primera curva {#espectro-ma1}

:::demo Espectro del MA(1) {#demo-espectro-ma1}
:::pasos
= y_t = \varepsilon_t + \theta\varepsilon_{t-1}: \quad \gamma(0) = \sigma^2(1 + \theta^2), \quad \gamma(1) = \sigma^2\theta, \quad \gamma(k) = 0 \text{ si } k \ge 2
> La autocovarianza del MA(1) [[u2:ma-momentos]].
= f(\omega) = \gamma(0) + 2\gamma(1)\cos(2\pi\omega)
> En la forma real solo sobreviven los términos $k = 0$ y $k = 1$.
= f(\omega) = \sigma^2\big(1 + \theta^2 + 2\theta\cos(2\pi\omega)\big)
> Es una curva coseno: si $\theta > 0$ baja de $\sigma^2(1 + \theta)^2$ en $\omega = 0$ a $\sigma^2(1 - \theta)^2$ en $\omega = 1/2$; si $\theta < 0$ sube.
:::
:::

:::guiado El espectro de un MA(1) a mano {#guia-espectro-ma1}
| $\omega$ | Periodo | $\cos(2\pi\omega)$ | $f(\omega) = 1.25 + \cos(2\pi\omega)$ |
|---|---|---|---|
| 0 | ∞ | 1 | 2.25 |
| 1/12 | 12 | 0.866 | 2.116 |
| 1/6 | 6 | 0.5 | 1.75 |
| 1/4 | 4 | 0 | 1.25 |
| 1/3 | 3 | −0.5 | 0.75 |
| 1/2 | 2 | −1 | 0.25 |
---
= \theta = 0.5,\ \sigma^2 = 1:\quad f(\omega) = 1 + 0.25 + 2(0.5)\cos(2\pi\omega) = 1.25 + \cos(2\pi\omega)
> Sustituimos en la fórmula del MA(1).
= \omega = 0:\ \cos 0 = 1 \;\Rightarrow\; f(0) = 2.25
> La frecuencia cero: el aporte de los movimientos más lentos.
@ usa c3[1]; da c4[1]
= \omega = 1/4:\ \cos(\pi/2) = 0 \;\Rightarrow\; f(1/4) = 1.25 = \gamma(0)
> A la mitad del rango el coseno vale cero y queda exactamente la varianza.
@ usa c3[4]; da c4[4]
= \omega = 1/2:\ \cos\pi = -1 \;\Rightarrow\; f(1/2) = 0.25
> La frecuencia más rápida aporta nueve veces menos que la más lenta: con $\theta > 0$ los choques se «promedian» con su vecino y la serie se suaviza.
@ usa c3[6]; da c4[6]
= 2\int_0^{1/2}\big(1.25 + \cos(2\pi\omega)\big)d\omega = 2\,(0.625 + 0) = 1.25
> El área es $\gamma(0) = \sigma^2(1 + \theta^2) = 1.25$: el coseno integra cero sobre medio ciclo.
@ usa c4[1-6]
:::

:::ejemplo Un MA(2) que solo deja pasar las frecuencias medias
Sea $y_t = \varepsilon_t - \varepsilon_{t-2}$ con $\sigma^2 = 1$:
- Autocovarianzas: $\gamma(0) = 1 + 1 = 2$, $\gamma(1) = 0$ (no hay términos separados un periodo) y $\gamma(2) = -1$.
- Espectro: $f(\omega) = \gamma(0) + 2\gamma(2)\cos(4\pi\omega) = 2 - 2\cos(4\pi\omega) = 4\sin^2(2\pi\omega)$.
- Valores: $f(0) = 0$, $f(1/8) = 2$, $f(1/6) = 3$, $f(1/4) = 4$ y $f(1/2) = 0$. La potencia se concentra alrededor del periodo 4 y **desaparece** en los dos extremos.
- La razón: $1 - L^2 = (1 - L)(1 + L)$. El factor $1 - L$ borra la frecuencia 0 y el factor $1 + L$ borra la 1/2; queda un **pasa banda** hecho con dos coeficientes, una idea que retomaremos con los filtros [[diferencia-filtro]].
- Comprobación: $2\int_0^{1/2}4\sin^2(2\pi\omega)\,d\omega = 2 \cdot 4 \cdot \tfrac14 = 2 = \gamma(0)$.
:::

### AR(1): rojo o azul según el signo de $\phi$ {#espectro-ar1}

:::demo Espectro del AR(1) sumando una serie geométrica {#demo-espectro-ar1}
:::pasos
= \gamma(k) = \frac{\sigma^2}{1 - \phi^2}\,\phi^{\lvert k\rvert}
> Autocovarianza del AR(1): varianza $\sigma^2/(1 - \phi^2)$ y ACF $\phi^{\lvert k\rvert}$ [[u1:ar1-acf]].
= f(\omega) = \frac{\sigma^2}{1 - \phi^2}\Big[1 + \sum_{k=1}^{\infty}z^k + \sum_{k=1}^{\infty}\bar{z}^{\,k}\Big], \qquad z = \phi\,e^{-2\pi i\omega}
> Definición de $f$, separando los rezagos positivos ($z^k$) y los negativos (su conjugado $\bar z^{\,k}$).
= \sum_{k=1}^{\infty}z^k = \frac{z}{1 - z} \quad\text{porque } \lvert z\rvert = \lvert\phi\rvert < 1
> Serie geométrica [[u1:geo-suma]].
= 1 + \frac{z}{1 - z} + \frac{\bar z}{1 - \bar z} = \frac{1}{1 - z} + \frac{\bar z}{1 - \bar z} = \frac{1 - z\bar z}{(1 - z)(1 - \bar z)} = \frac{1 - \phi^2}{\lvert 1 - z\rvert^2}
> Común denominador; $z\bar z = \lvert z\rvert^2 = \phi^2$.
= f(\omega) = \frac{\sigma^2}{\lvert 1 - \phi e^{-2\pi i\omega}\rvert^2} = \frac{\sigma^2}{1 + \phi^2 - 2\phi\cos(2\pi\omega)}
> El factor $1 - \phi^2$ se cancela. En el último paso, $\lvert 1 - \phi e^{-i\theta}\rvert^2 = (1 - \phi\cos\theta)^2 + (\phi\sin\theta)^2$.
:::
:::

:::guiado AR(1) con $\phi = 0.6$ y con $\phi = -0.6$ {#guia-espectro-ar1}
| $\omega$ | $\cos(2\pi\omega)$ | $1.36 - 1.2\cos$ | $f$ con $\phi = 0.6$ | $1.36 + 1.2\cos$ | $f$ con $\phi = -0.6$ |
|---|---|---|---|---|---|
| 0 | 1 | 0.16 | 6.25 | 2.56 | 0.391 |
| 1/6 | 0.5 | 0.76 | 1.316 | 1.96 | 0.510 |
| 1/4 | 0 | 1.36 | 0.735 | 1.36 | 0.735 |
| 1/3 | −0.5 | 1.96 | 0.510 | 0.76 | 1.316 |
| 1/2 | −1 | 2.56 | 0.391 | 0.16 | 6.25 |
---
= \phi = 0.6:\quad 1 + 0.36 - 2(0.6)\cos(2\pi\omega) = 1.36 - 1.2\cos(2\pi\omega)
> El denominador con $\sigma^2 = 1$.
@ usa c2[1-5]; da c3[1-5]
= f(0) = 1/0.16 = 6.25, \qquad f(1/2) = 1/2.56 = 0.391
> Con $\phi > 0$ la potencia se concentra en las frecuencias bajas: espectro **rojo**. La serie se mueve en rachas largas.
@ usa c3[1] c3[5]; da c4[1] c4[5]
= \phi = -0.6:\quad 1.36 + 1.2\cos(2\pi\omega) \;\Rightarrow\; f(0) = 0.391,\ f(1/2) = 6.25
> Con $\phi < 0$ es el espejo: espectro **azul**, porque la serie alterna arriba–abajo en cada periodo.
@ usa c2[1-5]; da c5[1-5] c6[1-5]
= \frac{f(0)}{f(1/2)} = \frac{6.25}{0.391} = 16 = \left(\frac{1 + 0.6}{1 - 0.6}\right)^2
> El contraste entre frecuencias lentas y rápidas crece muy rápido con $\lvert\phi\rvert$. Con $\phi = 0.9$ sería $19^2 = 361$.
@ usa c4[1] c4[5]
:::

### AR(2): el pico del ciclo {#espectro-ar2}

Un AR(2) con raíces complejas genera un ciclo [[u2:ar2-complejas]]. En el espectro, ese ciclo es un **pico**.

:::demo Dónde está el pico de un AR(2) {#demo-pico-ar2}
:::pasos
= f(\omega) = \frac{\sigma^2}{\lvert 1 - \phi_1 e^{-2\pi i\omega} - \phi_2 e^{-4\pi i\omega}\rvert^2}
> El mismo argumento del AR(1) (o el teorema del filtro de [[filtro-espectro]]): el polinomio AR evaluado en $e^{-2\pi i\omega}$.
= \lvert\cdot\rvert^2 = 1 + \phi_1^2 + \phi_2^2 - 2\phi_1(1 - \phi_2)\cos(2\pi\omega) - 2\phi_2\cos(4\pi\omega)
> Desarrollando el módulo al cuadrado (parte real al cuadrado más parte imaginaria al cuadrado).
= \cos(4\pi\omega) = 2c^2 - 1, \quad c = \cos(2\pi\omega) \;\Rightarrow\; D(c) = 1 + \phi_1^2 + \phi_2^2 - 2\phi_1(1 - \phi_2)\,c - 2\phi_2(2c^2 - 1)
> El denominador es una parábola en $c$. El pico de $f$ está donde el denominador es mínimo.
= D'(c) = -2\phi_1(1 - \phi_2) - 8\phi_2\,c = 0 \;\Rightarrow\; \cos(2\pi\omega^*) = \frac{\phi_1(\phi_2 - 1)}{4\phi_2}
> Derivamos e igualamos a cero. Con $\phi_2 < 0$ la parábola abre hacia arriba y es un mínimo. Si el resultado está entre −1 y 1 hay un pico interior; si no, el máximo está en un extremo ($\omega = 0$ o $1/2$).
:::
:::

:::ejemplo El AR(2) con $\phi_1 = 1$, $\phi_2 = -0.5$
- Pico: $\cos(2\pi\omega^*) = \frac{1\cdot(-1.5)}{4(-0.5)} = 0.75$, así que $\omega^* = \arccos(0.75)/2\pi = 0.1150$ y el periodo del pico es $1/0.1150 = 8.69$.
- Altura: $D(0.75) = 2.25 - 2.25 + 0.125 = 0.125$, así que $f(\omega^*) = 8$, el doble que en la frecuencia cero ($f(0) = 1/0.25 = 4$).
- En la Unidad II, el pseudo-periodo calculado con el **argumento de las raíces** daba exactamente 8 [[u2:demo-pseudociclo]]. No es un error: el pico del espectro y el argumento de la raíz coinciden solo cuando el módulo $r$ de la raíz inversa está cerca de 1. Con $r = \sqrt{0.5} = 0.71$ el pico se corre hacia frecuencias bajas. Con $\phi = (1.2, -0.72)$, $r = 0.85$ y el pico queda en 8.14, mucho más cerca de 8.
:::

:::guiado El espectro del AR(2) con $\phi = (1.2,\ -0.72)$ {#guia-espectro-ar2}
| $\omega$ | Periodo | $\cos(2\pi\omega)$ | $\cos(4\pi\omega)$ | $D(\omega)$ | $f(\omega) = 1/D(\omega)$ |
|---|---|---|---|---|---|
| 0 | ∞ | 1 | 1 | 0.2704 | 3.70 |
| 0.08 | 12.5 | 0.8763 | 0.5358 | 0.1126 | 8.88 |
| 0.1228 | 8.14 | 0.7167 | 0.0272 | 0.0392 | 25.51 |
| 0.125 | 8 | 0.7071 | 0 | 0.0395 | 25.34 |
| 0.25 | 4 | 0 | −1 | 1.5184 | 0.659 |
| 0.5 | 2 | −1 | 1 | 8.5264 | 0.117 |
---
= 1 + \phi_1^2 + \phi_2^2 = 2.9584, \qquad 2\phi_1(1 - \phi_2) = 2(1.2)(1.72) = 4.128, \qquad -2\phi_2 = 1.44
> Las tres constantes del denominador de [[demo-pico-ar2]], con $\sigma^2 = 1$: $D(\omega) = 2.9584 - 4.128\cos(2\pi\omega) + 1.44\cos(4\pi\omega)$.
= \cos(2\pi\omega^*) = \frac{\phi_1(\phi_2 - 1)}{4\phi_2} = \frac{1.2(-1.72)}{4(-0.72)} = 0.7167 \;\Rightarrow\; \omega^* = 0.1228,\ \Per = 8.14
> La frecuencia del pico. Está entre −1 y 1, así que hay un pico interior.
@ usa c3[3]; da c1[3] c2[3]
= D(\omega^*) = 2.9584 - 4.128(0.7167) + 1.44(0.0272) = 0.0392 \;\Rightarrow\; f(\omega^*) = 25.5
> En el pico, el denominador casi se anula.
@ usa c3[3] c4[3]; da c5[3] c6[3]
= \Per = 8:\quad D = 2.9584 - 4.128(0.7071) + 1.44(0) = 0.0395 \;\Rightarrow\; f = 25.3
> En el pseudo-periodo de las raíces (8) el espectro vale casi lo mismo que en el pico (8.14): con $r = 0.85$ las dos medidas del ciclo casi coinciden.
@ usa c3[4] c4[4]; da c5[4] c6[4]
= f(0) = 1/0.2704 = 3.70, \qquad f(1/2) = 1/8.5264 = 0.117
> El pico es 7 veces más alto que la frecuencia cero y más de 200 veces más alto que la de Nyquist: casi toda la varianza vive cerca del ciclo de 8 periodos.
@ usa c3[1] c4[1] c3[6] c4[6]; da c5[1] c6[1] c5[6] c6[6]
= \phi = (1,\ -0.5):\ \frac{f(\omega^*)}{f(0)} = \frac{8}{4} = 2 \qquad\text{contra}\qquad \phi = (1.2,\ -0.72):\ \frac{25.5}{3.70} = 6.9
> Comparado con el ejemplo anterior ($r = 0.71$), el pico de este AR(2) ($r = 0.85$) es mucho más alto y angosto: cuanto más cerca de 1 está el módulo de la raíz, más regular es el ciclo.
@ usa c6[1] c6[3]
:::

### ARMA: un cociente de polinomios {#espectro-arma}

:::definicion Espectro de un ARMA($p$, $q$)
Si $\phi(L)\,y_t = \theta(L)\,\varepsilon_t$ es estacionario,

$$f(\omega) = \sigma^2\,\frac{\lvert\theta(e^{-2\pi i\omega})\rvert^2}{\lvert\phi(e^{-2\pi i\omega})\rvert^2}$$

Es la fórmula del AR(1) y el MA(1) a la vez; la demostración general sale del teorema del filtro [[filtro-espectro]]. Las raíces del polinomio AR cerca del círculo unitario producen **picos** (el denominador casi se anula); las del polinomio MA producen **valles**.
:::

| Modelo | Espectro | Forma |
|---|---|---|
| AR estacional $(1 - 0.7L^{12})y_t = \varepsilon_t$ | $\sigma^2/\lvert 1 - 0.7e^{-24\pi i\omega}\rvert^2$ | Picos de altura $1/0.3^2 = 11.1$ en $\omega = 0, 1/12, \dots, 6/12$ |
| MA estacional $y_t = (1 - 0.6L^{12})\varepsilon_t$ | $\sigma^2\lvert 1 - 0.6e^{-24\pi i\omega}\rvert^2$ | Valles en $k/12$: quita potencia justo en las frecuencias estacionales |
| Aerolínea diferenciada (Unidad II) | $\sigma^2\lvert 1 + \theta e^{-2\pi i\omega}\rvert^2\lvert 1 + \Theta e^{-24\pi i\omega}\rvert^2$ | Valles en $k/12$ (con $\Theta < 0$) y en $\omega = 0$ (con $\theta < 0$) |

:::interactivo w3-espectro-arma | Diseña un ARMA y mira su espectro {#w-espectro-arma}
Mueve los coeficientes de un ARMA(2,1) con un término AR estacional opcional. La densidad espectral se actualiza al instante, junto con la ACF y las raíces.
@@@
- **Arriba, izquierda**: la densidad espectral teórica (activa la escala logarítmica para ver picos y valles pequeños). La línea punteada es $\sigma^2$, el espectro del ruido blanco.
- **Arriba, derecha**: las raíces inversas de $\phi(z)$ (círculos) y de $\theta(z)$ (cruces) dentro del círculo unitario. Cuanto más cerca del borde, más alto el pico (AR) o más hondo el valle (MA), en la frecuencia que marca su ángulo.
- **Abajo**: la ACF teórica, para comparar los dos idiomas.
- **Vista extra**: los valores de $f$ en las frecuencias clave y la ubicación del pico con su periodo.
:::

### De la ACF al espectro, término a término {#acf-a-espectro}

La forma real $f(\omega) = \gamma(0) + 2\sum_{k\ge 1}\gamma(k)\cos(2\pi\omega k)$ dice que el espectro es una **suma de cosenos**: cada rezago $k$ aporta una onda de periodo $1/k$ en el eje de frecuencias, con altura $2\gamma(k)$. Sumarlas una por una es la mejor forma de ver por qué una ACF que decae despacio produce un espectro concentrado cerca de cero.

:::interactivo w3-fourier-acf | Construye el espectro sumando autocovarianzas {#w-fourier-acf}
Elige un proceso y cuántos rezagos $K$ sumar. La curva rosa es la suma parcial $\gamma(0) + 2\sum_{k=1}^{K}\gamma(k)\cos(2\pi\omega k)$; la línea punteada es el espectro verdadero.
@@@
- **Arriba**: la suma parcial contra el espectro completo. Con pocos rezagos aparece un «oleaje» (puede incluso volverse negativa); al agregar rezagos se acerca a la curva verdadera.
- **Abajo**: la onda que aporta el último rezago agregado, $2\gamma(K)\cos(2\pi\omega K)$.
- Con un MA(1), $K = 1$ ya es el espectro exacto. Con un AR(1) de $\phi = 0.9$ necesitas muchos rezagos, porque su memoria es larga.
- **Vista extra**: las autocovarianzas $\gamma(k)$ que se están sumando.
:::

### La varianza repartida por bandas {#varianza-bandas}

Como el área bajo $f$ es la varianza, el área en una **banda** de frecuencias es la varianza que aportan esas oscilaciones:

$$\text{fracción de la varianza en } [a, b] = \frac{2\int_a^b f(\omega)\,d\omega}{\gamma(0)}, \qquad 0 \le a < b \le \tfrac12$$

Para el AR(1) con $\phi = 0.6$, las oscilaciones de periodo mayor que 10 ($\omega < 0.1$) aportan el **58%** de la varianza, aunque son solo el 20% del rango de frecuencias. Esa cuenta es la que permite decir frases como «el ciclo económico explica dos tercios de la varianza del PIB».

:::interactivo w3-bandas | ¿Cuánta varianza hay en cada banda? {#w-bandas}
Elige un proceso y arrastra los extremos de la banda. El área sombreada es la varianza que aportan esas frecuencias.
@@@
- **Arriba**: la densidad espectral con la banda sombreada y su porcentaje de la varianza total.
- **Abajo**: la parte de una simulación que corresponde a esa banda (la serie filtrada con un pasa banda ideal) sobre la serie completa. Si la banda tiene el 58% de la varianza, la curva filtrada «explica» buena parte de los movimientos.
- **Vista extra**: el porcentaje en cinco bandas fijas (periodos de más de 20, de 10 a 20, de 5 a 10, de 3 a 5 y de 2 a 3).
:::

### Calcularlo en Python {#densidad-python}

`numpy` basta para evaluar la fórmula del ARMA. Comprobamos dos propiedades: el área es la varianza y los valores coinciden con los de los ejemplos a mano.

```python
def espectro_arma(ar, ma, sigma2, w):
    """f(ω) = σ² |θ(e^{-2πiω})|² / |φ(e^{-2πiω})|², con ar = [1, -φ1, ...] y ma = [1, θ1, ...]."""
    z = np.exp(-2j * np.pi * np.asarray(w))
    num = np.abs(np.polyval(ma[::-1], z)) ** 2
    den = np.abs(np.polyval(ar[::-1], z)) ** 2
    return sigma2 * num / den

w = np.linspace(0, 0.5, 20001)
casos = {"MA(1), θ = 0.5": ([1], [1, 0.5]), "AR(1), φ = 0.6": ([1, -0.6], [1]), "AR(2), φ = (1, -0.5)": ([1, -1, 0.5], [1])}
from statsmodels.tsa.arima_process import ArmaProcess
for nombre, (ar, ma) in casos.items():
    f = espectro_arma(np.array(ar), np.array(ma), 1.0, w)
    area = 2 * np.trapezoid(f, w)
    var = ArmaProcess(ar, ma).acovf(1)[0]
    print(f"{nombre:22s} f(0) = {f[0]:6.3f}  f(1/2) = {f[-1]:6.3f}  pico en ω = {w[f.argmax()]:.4f}  área = {area:.4f}  γ(0) = {var:.4f}")
```

La relación funciona en los dos sentidos. Con la transformada inversa, $\gamma(k) = \int_{-1/2}^{1/2}\cos(2\pi\omega k)\,f(\omega)\,d\omega$ (la parte imaginaria se cancela porque $f$ es par), se recuperan las autocovarianzas a partir del espectro:

```python
w_c = np.linspace(-0.5, 0.5, 200001)
f_ar1 = 1 / np.abs(1 - 0.6 * np.exp(-2j * np.pi * w_c)) ** 2        # AR(1) con φ = 0.6 y σ² = 1
for k in [0, 1, 2, 5]:
    g_k = np.trapezoid(np.cos(2 * np.pi * w_c * k) * f_ar1, w_c)
    print(f"k = {k}:  ∫cos(2πωk) f(ω) dω = {g_k:.4f}   fórmula del AR(1), φ^k/(1 − φ²) = {0.6 ** k / (1 - 0.36):.4f}")
```

Del espectro a la ACF y de la ACF al espectro: es la misma información en dos idiomas, como se anunció en [[misma-memoria]].

:::cuidado La misma densidad, tres escalas
- **Shumway–Stoffer** (esta guía): $f$ definida en $[-1/2, 1/2]$ y simétrica; el área total es la varianza. El ruido blanco tiene $f = \sigma^2$.
- **`scipy.signal`** (periodogram, welch): devuelve la densidad **unilateral**, solo en $[0, 1/2]$ y **multiplicada por 2** para que su área en ese intervalo sea la varianza. El ruido blanco da $2\sigma^2$.
- **Brockwell–Davis y Hamilton**: frecuencia en radianes, $\tip{lambda-ang}{\lambda} \in [-\pi, \pi]$, con $f_{\tip{lambda-ang}{\lambda}} = f/(2\pi)$. El ruido blanco da $\sigma^2/2\pi$.

`statsmodels` tiene `arma_periodogram`, pero usa todavía otra normalización; para no confundirte, evalúa la fórmula directamente como arriba. Y antes de comparar números de dos libros o librerías, revisa la convención.
:::

:::duda ¿Existe la densidad espectral de un paseo aleatorio?
No: el paseo aleatorio no es estacionario y $\sum\lvert\gamma(k)\rvert$ no converge. Si calculas su periodograma verás casi toda la potencia amontonada en las frecuencias más bajas (es el caso extremo de «espectro rojo»). La receta es la de siempre: **diferencia primero** [[u1:diferenciacion]] y analiza el espectro de la serie estacionaria.
:::

:::duda ¿Por qué el espectro de un MA puede valer cero en una frecuencia?
Porque $\lvert\theta(e^{-2\pi i\omega})\rvert^2$ se anula si $\theta(z)$ tiene una raíz **sobre** el círculo unitario. Ejemplo: $y_t = \varepsilon_t - \varepsilon_{t-1}$ (un ruido blanco sobrediferenciado) tiene $f(0) = 0$: le falta toda la potencia de largo plazo. Es la versión espectral del MA no invertible con $\theta = -1$ [[u2:demo-sobredif]].
:::

:::examen Así te lo pueden preguntar: «Defina densidad espectral y su relación con la autocovarianza»
«Para una serie débilmente estacionaria con autocovarianzas absolutamente sumables, la densidad espectral es la transformada de Fourier de la autocovarianza: $f(\omega) = \sum_k\gamma(k)e^{-2\pi i\omega k} = \gamma(0) + 2\sum_{k\ge1}\gamma(k)\cos(2\pi\omega k)$, con $\omega$ en ciclos por observación entre −1/2 y 1/2. La relación es biunívoca: $\gamma(k) = \int e^{2\pi i\omega k}f(\omega)\,d\omega$, y en particular $\gamma(0) = \int f(\omega)\,d\omega$, así que $f$ describe cómo se reparte la varianza entre frecuencias. Frecuencias bajas corresponden a patrones lentos, altas a variaciones rápidas, los picos a ciclos dominantes y un espectro plano al ruido blanco. Por ejemplo, un AR(1) con $\phi = 0.6$ tiene $f(\omega) = \sigma^2/(1.36 - 1.2\cos 2\pi\omega)$, concentrada en frecuencias bajas.»
:::

:::resumen Lo que debes llevarte de la densidad espectral
- $f(\omega) = \sum_k\gamma(k)e^{-2\pi i\omega k} = \gamma(0) + 2\sum_{k\ge 1}\gamma(k)\cos(2\pi\omega k)$; es real, par y no negativa.
- $\gamma(0) = 2\int_0^{1/2}f(\omega)\,d\omega$: el área es la varianza y el área en una banda, la varianza de esas oscilaciones.
- Ruido blanco: $\sigma^2$. MA(1): $\sigma^2(1 + \theta^2 + 2\theta\cos 2\pi\omega)$. AR(1): $\sigma^2/(1 + \phi^2 - 2\phi\cos 2\pi\omega)$.
- AR(2): pico donde $\cos(2\pi\omega^*) = \phi_1(\phi_2 - 1)/(4\phi_2)$. ARMA: $\sigma^2\lvert\theta(e^{-2\pi i\omega})\rvert^2/\lvert\phi(e^{-2\pi i\omega})\rvert^2$.
- `scipy` reporta el doble (densidad unilateral); los libros en radianes, $f/2\pi$.
:::
