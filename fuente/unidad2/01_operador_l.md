## ⏪ El operador rezago L y los polinomios {#operador-l}
@mapa La notación compacta de todos los modelos: L, diferencias como polinomios, multiplicar factores, raíces y círculo unitario, invertir un polinomio.

Los modelos de esta unidad se escriben con muchos rezagos: $y_{t-1}, y_{t-2}, \varepsilon_{t-1}, y_{t-12}, \dots$ Escribirlos uno por uno se vuelve ilegible muy rápido (el SARIMA de la portada tiene 14 términos). El **operador rezago** permite escribirlos como si fueran polinomios de álgebra de secundaria, multiplicarlos, factorizarlos y encontrar sus raíces.

### Definición y reglas {#def-l}

:::definicion El operador rezago
$$L\,y_t = y_{t-1}, \qquad L^k\,y_t = \underbrace{L\,L \cdots L}_{k \text{ veces}}\;y_t = y_{t-k}$$

Reglas (todas salen de aplicar la definición):

1. **Constantes**: $L\,c = c$. Una constante es la misma en todos los periodos.
2. **Linealidad**: $L(a\,x_t + b\,y_t) = a\,x_{t-1} + b\,y_{t-1}$.
3. **Potencias**: $L^j L^k y_t = L^{j+k} y_t = y_{t-j-k}$, y $L^0 = 1$ (no mover).
4. **Sumas de potencias**: $(1 - L)\,y_t = y_t - L\,y_t = y_t - y_{t-1} = \Delta y_t$.
:::

Algunos libros escriben $B$ (*backshift*) en lugar de $L$ (*lag*). Es exactamente lo mismo.

:::guiado El operador en acción con 8 datos {#guia-l}
Serie: $y = (5,\; 7,\; 6,\; 9,\; 8,\; 11,\; 10,\; 13)$.

| $t$ | $y_t$ | $L\,y_t$ | $L^2 y_t$ | $(1 - L)\,y_t$ | $(1 - L)^2 y_t$ | $(1 - L^2)\,y_t$ |
|---|---|---|---|---|---|---|
| 1 | 5 | — | — | — | — | — |
| 2 | 7 | 5 | — | 2 | — | — |
| 3 | 6 | 7 | 5 | −1 | −3 | 1 |
| 4 | 9 | 6 | 7 | 3 | 4 | 2 |
| 5 | 8 | 9 | 6 | −1 | −4 | 2 |
| 6 | 11 | 8 | 9 | 3 | 4 | 2 |
| 7 | 10 | 11 | 8 | −1 | −4 | 2 |
| 8 | 13 | 10 | 11 | 3 | 4 | 2 |
---
= L\,y_t = y_{t-1}:\quad L\,y_2 = y_1 = 5,\;\; L\,y_3 = y_2 = 7,\;\dots
> Aplicar $L$ es **bajar la columna un renglón**. En $t = 1$ no hay dato anterior.
@ usa c2[1-7]; da c3[2-8]
= L^2 y_t = L(L\,y_t) = y_{t-2}
> Aplicar $L$ dos veces baja la columna dos renglones: se pierden los dos primeros periodos.
@ usa c2[1-6]; da c4[3-8]
= (1 - L)\,y_t = y_t - y_{t-1} = \Delta y_t:\quad 7 - 5 = 2,\;\; 6 - 7 = -1,\;\dots
> El polinomio $1 - L$ es la **diferencia regular** [[u1:diferenciacion]].
@ usa c2[1-8] c3[2-8]; da c5[2-8]
= (1 - L)^2 = 1 - 2L + L^2 \;\Rightarrow\; (1 - L)^2 y_t = y_t - 2\,y_{t-1} + y_{t-2}
> Se desarrolla el binomio como en álgebra. En $t = 3$: $6 - 2(7) + 5 = -3$.
@ usa c2[3] c3[3] c4[3]; da c6[3]
= (1 - L)^2 y_t = \Delta(\Delta y_t) = \Delta y_t - \Delta y_{t-1}:\quad -1 - 2 = -3,\;\; 3 - (-1) = 4,\;\dots
> Comprobación: diferenciar dos veces la columna de $\Delta y_t$ da lo mismo.
@ usa c5[2-8]; da c6[3-8]
= (1 - L^2)\,y_t = y_t - y_{t-2}:\quad 6 - 5 = 1,\;\; 9 - 7 = 2,\;\; 8 - 6 = 2,\;\dots
> Ojo: $(1 - L^2) \neq (1 - L)^2$. Este compara con **dos** periodos antes: es una diferencia «estacional» con $s = 2$.
@ usa c2[1-8] c4[3-8]; da c7[3-8]
= (1 - L^2)\,y_t = (2,\; 2,\; 2,\; 2,\; 2) \;\text{ a partir de } t = 4
> La serie sube y baja alternadamente (patrón de periodo 2). La diferencia con $s = 2$ lo elimina por completo y deja solo la tendencia de +2 cada dos periodos.
@ usa c7[4-8]
:::

:::intuicion Otra forma de verlo: L es un «control de tiempo»
Piensa en la serie como un video. $L$ es el botón de «retroceder un cuadro». $L^{12}$ retrocede un año completo en datos mensuales. Un polinomio como $1 - L - L^{12} + L^{13}$ es una **receta de edición**: «toma el cuadro actual, réstale el anterior, réstale el de hace un año y súmale el de hace un año y un mes». No es un número: es una instrucción que se aplica a la serie.
:::

### Polinomios en L: los modelos en una línea {#polinomios}

Con $L$ los modelos se escriben como **polinomio × serie = polinomio × choques**.

:::definicion Los dos polinomios de un ARMA
$$\phi(L) = 1 - \phi_1 L - \phi_2 L^2 - \dots - \phi_p L^p, \qquad \theta(L) = 1 + \theta_1 L + \theta_2 L^2 + \dots + \theta_q L^q$$

| Modelo | Forma con rezagos | Forma con polinomios |
|---|---|---|
| AR($p$) | $y_t = c + \phi_1 y_{t-1} + \dots + \phi_p y_{t-p} + \varepsilon_t$ | $\phi(L)\,y_t = c + \varepsilon_t$ |
| MA($q$) | $y_t = c + \varepsilon_t + \theta_1 \varepsilon_{t-1} + \dots + \theta_q \varepsilon_{t-q}$ | $y_t = c + \theta(L)\,\varepsilon_t$ |
| ARMA($p, q$) | las dos cosas a la vez | $\phi(L)\,y_t = c + \theta(L)\,\varepsilon_t$ |
| ARIMA($p, d, q$) | ARMA sobre la serie diferenciada $d$ veces | $\phi(L)\,(1 - L)^d\,y_t = c + \theta(L)\,\varepsilon_t$ |
:::

:::demo Pasar de la forma con rezagos a la forma con polinomios {#demo-polinomio}
Tomemos el AR(2): $y_t = c + \phi_1 y_{t-1} + \phi_2 y_{t-2} + \varepsilon_t$.

:::pasos
= y_t - \phi_1 y_{t-1} - \phi_2 y_{t-2} = c + \varepsilon_t
> Pasamos todos los términos con $y$ al lado izquierdo.
= y_t - \phi_1 L\,y_t - \phi_2 L^2 y_t = c + \varepsilon_t
> Cada rezago se escribe con $L$: $y_{t-1} = L\,y_t$ y $y_{t-2} = L^2 y_t$.
= (1 - \phi_1 L - \phi_2 L^2)\,y_t = c + \varepsilon_t
> Factorizamos $y_t$ por la derecha (linealidad).
= \phi(L)\,y_t = c + \varepsilon_t
> Le damos nombre al polinomio. **Por eso los coeficientes AR aparecen con signo menos dentro de $\phi(L)$**.
:::
:::

Lo más útil es que los polinomios **se multiplican como en álgebra**. Así se construyen los modelos estacionales: se multiplica un factor regular por uno estacional.

:::ejemplo Multiplicar dos factores AR(1)
$$(1 - 0.5L)(1 + 0.3L)$$

:::pasos
= = 1\cdot 1 + 1\cdot 0.3L - 0.5L\cdot 1 - 0.5L\cdot 0.3L
> Cada término del primer paréntesis multiplica a cada término del segundo.
= = 1 + 0.3L - 0.5L - 0.15L^2
> Las potencias se suman: $L \cdot L = L^2$.
= = 1 - 0.2L - 0.15L^2
> Juntamos los términos con $L$.
= \Rightarrow\; y_t = 0.2\,y_{t-1} + 0.15\,y_{t-2} + \varepsilon_t
> Leído como $\phi(L)$: es un AR(2) con $\phi_1 = 0.2$ y $\phi_2 = 0.15$. ¡Un AR(2) puede ser el producto de dos AR(1)!
:::
:::

:::guiado La doble diferencia de AirPassengers {#guia-doble-dif}
$(1 - L)(1 - L^{12})\,y_t$ con los primeros datos de AirPassengers (miles de pasajeros).

| $t$ | mes | $y_t$ |
|---|---|---|
| 1 | ene 1949 | 112 |
| 2 | feb 1949 | 118 |
| 13 | ene 1950 | 115 |
| 14 | feb 1950 | 126 |
---
= (1 - L)(1 - L^{12}) = 1 - L^{12} - L + L^{13}
> Se multiplica término a término: $1\cdot 1$, $1\cdot(-L^{12})$, $(-L)\cdot 1$ y $(-L)(-L^{12}) = L^{13}$.
= (1 - L)(1 - L^{12})\,y_t = y_t - y_{t-1} - y_{t-12} + y_{t-13}
> Cada potencia de $L$ es un rezago. Para $t = 14$ se necesitan $y_{14}, y_{13}, y_2, y_1$.
@ usa c3[1-4]
= w_{14} = 126 - 115 - 118 + 112 = 5
> Sustituimos: $y_{14} = 126$, $y_{13} = 115$, $y_{2} = 118$, $y_{1} = 112$.
@ usa c3[1-4]
= \Delta y_{14} - \Delta y_{2} = (126 - 115) - (118 - 112) = 11 - 6 = 5
> Otra forma: es «el cambio de este mes menos el cambio del mismo mes del año anterior». Da lo mismo.
@ usa c3[1-4]
:::

| Operador | Polinomio | Qué hace |
|---|---|---|
| $\Delta$ | $1 - L$ | cambio de un periodo al siguiente |
| $\Delta^2$ | $1 - 2L + L^2$ | cambio del cambio (curvatura) |
| $\Delta_{12}$ | $1 - L^{12}$ | cambio contra el mismo mes del año anterior |
| $\Delta\,\Delta_{12}$ | $1 - L - L^{12} + L^{13}$ | la transformación de AirPassengers [[u1:caso-transformar]] |
| AR(1) | $1 - \phi L$ | quita la parte predecible por el dato anterior |
| AR estacional | $1 - \Phi L^{12}$ | quita la parte predecible por el mismo mes del año anterior |

:::interactivo w2-polinomio | Multiplicar polinomios y ver sus raíces {#w-polinomio}
Elige dos factores. La gráfica de arriba muestra los coeficientes del producto; la de abajo, las raíces de cada factor y del producto en el plano complejo, junto con el círculo unitario.
@@@
- **Tallos de arriba**: el coeficiente de cada potencia $L^j$ en el producto. Así se «lee» qué rezagos usa el modelo completo.
- **Plano complejo**: cada punto es una raíz. Los círculos son las raíces del factor A, los rombos las del factor B y las cruces las del producto: **las raíces del producto son exactamente las de los factores juntas**.
- **Círculo punteado**: el círculo unitario. Si todas las raíces de un polinomio AR quedan **fuera**, el modelo es estacionario [[raices]].
- Prueba el factor estacional $1 - 0.8L^{12}$: tiene 12 raíces repartidas en un círculo de radio $0.8^{-1/12} \approx 1.019$, apenas fuera del círculo unitario.
- **Vista extra**: la tabla de multiplicación término por término (cada celda es un producto de un término de A por uno de B).
:::

:::duda ¿L es un número? ¿Por qué se vale multiplicarlo como si lo fuera?
$L$ no es un número, es un **operador** (una instrucción). Pero cumple las mismas reglas de suma y multiplicación que los polinomios: se distribuye, conmuta ($L^j L^k = L^k L^j$) y sus potencias se suman. Por eso toda el álgebra de polinomios funciona. Cuando buscamos **raíces**, cambiamos $L$ por una variable $z$ (un número, real o complejo) y resolvemos $\phi(z) = 0$.
:::

### Raíces y el círculo unitario {#raices}

En la Unidad I viste que el AR(1) es estacionario si $|\phi| < 1$, y que eso equivale a que la raíz $z = 1/\phi$ de $1 - \phi z = 0$ cumpla $|z| > 1$ [[u1:raiz-demo]]. La misma idea funciona para cualquier orden.

:::definicion Condición de estacionariedad de un AR(p)
Un AR($p$) es **estacionario** si todas las raíces de su polinomio característico

$$\phi(z) = 1 - \phi_1 z - \phi_2 z^2 - \dots - \phi_p z^p = 0$$

están **fuera del círculo unitario**: $|z_i| > 1$ para todas. Si alguna raíz vale exactamente 1, hay **raíz unitaria** (y conviene diferenciar). Si alguna está dentro, el proceso explota.

La guía oficial lo dice de forma intuitiva: *los choques deben disiparse con el tiempo y no crecer indefinidamente*.
:::

:::demo Por qué las raíces deciden si los choques se apagan {#demo-raices}
Todo polinomio se puede factorizar con sus raíces $z_1, \dots, z_p$. Escribimos $\lambda_i = 1/z_i$ (las **raíces inversas**).

:::pasos
= \phi(z) = (1 - \lambda_1 z)(1 - \lambda_2 z) \cdots (1 - \lambda_p z)
> Cada factor se anula en $z = 1/\lambda_i = z_i$, así que el producto tiene exactamente esas raíces (y vale 1 en $z = 0$, como $\phi(z)$).
= \phi(L)\,y_t = \varepsilon_t \;\Longleftrightarrow\; (1 - \lambda_1 L)\cdots(1 - \lambda_p L)\,y_t = \varepsilon_t
> El AR($p$) es una **cadena de AR(1)**: cada factor es un filtro de tipo $1 - \lambda L$.
= (1 - \lambda L)^{-1} = 1 + \lambda L + \lambda^2 L^2 + \dots
> Cada AR(1) se invierte con la serie geométrica [[invertir]]; sus pesos son $\lambda^j$.
= \lambda^j \to 0 \iff |\lambda| < 1 \iff |z| = 1/|\lambda| > 1
> Los pesos de cada factor se apagan solo si su raíz inversa está **dentro** del círculo, es decir, si la raíz está **fuera**.
= \text{todas las } |z_i| > 1 \;\Rightarrow\; \psi_j \to 0 \;\Rightarrow\; \text{los choques se disipan}
> Si una sola raíz falla, ese factor arrastra los choques para siempre (raíz unitaria) o los amplifica (explosivo).
:::
:::

:::ejemplo Raíces del AR(2) que salió del producto
Para $1 - 0.2z - 0.15z^2 = (1 - 0.5z)(1 + 0.3z)$:

:::pasos
= 1 - 0.5z = 0 \Rightarrow z_1 = 2, \qquad 1 + 0.3z = 0 \Rightarrow z_2 = -\tfrac{1}{0.3} = -3.3333
> Como ya está factorizado, cada factor da una raíz.
= |z_1| = 2 > 1, \quad |z_2| = 3.3333 > 1 \;\Rightarrow\; \text{estacionario}
> Las dos fuera del círculo. Las raíces inversas son $\lambda_1 = 0.5$ y $\lambda_2 = -0.3$: dentro del círculo.
:::
:::

:::cuidado Raíces o raíces inversas: revisa qué te muestran
statsmodels (`ArmaProcess.arroots`) y esta guía reportan las raíces $z_i$: el criterio es **fuera** del círculo ($|z| > 1$). Muchas gráficas (por ejemplo `autoplot` de R o algunos libros) muestran las **raíces inversas** $1/z_i$, y entonces el criterio es **dentro** del círculo. Es la misma condición vista al revés.
:::

```python
from numpy.polynomial import polynomial as P

a, b = [1, -0.5], [1, 0.3]                 # 1 - 0.5L  y  1 + 0.3L  (potencias crecientes de L)
prod = P.polymul(a, b)
print("Producto:", prod)                    # 1 - 0.2L - 0.15L^2
print("(1-L)(1-L^12):", P.polymul([1, -1], [1] + [0] * 11 + [-1]))

proc = ArmaProcess(ar=prod, ma=[1])
print("Raíces z:", np.round(proc.arroots, 4), "| módulos:", np.round(np.abs(proc.arroots), 4))
print("¿Estacionario?", proc.isstationary)
print("np.roots espera el orden contrario:", np.round(np.roots(prod[::-1]), 4))
```

:::duda ¿Por qué `np.roots` da raíces distintas si le paso el mismo arreglo?
`np.roots` espera los coeficientes de la potencia **más alta a la más baja** ($a_p z^p + \dots + a_0$), mientras que `ArmaProcess` y `numpy.polynomial` los esperan de la **más baja a la más alta** ($a_0 + a_1 z + \dots$). Si le pasas `[1, -0.2, -0.15]` a `np.roots`, estás resolviendo $z^2 - 0.2z - 0.15 = 0$, cuyas raíces son las **inversas** de las que buscas. Por eso arriba se invierte el arreglo con `[::-1]`.
:::

### Invertir un polinomio {#invertir}

Invertir $\phi(L)$ significa encontrar la serie de potencias $\phi(L)^{-1}$ tal que $\phi(L)\,\phi(L)^{-1} = 1$. Con ella, un AR se convierte en un MA(∞), y un MA en un AR(∞).

:::demo El inverso de 1 − φL es la serie geométrica {#demo-invertir}
Proponemos $S_k = 1 + \phi L + \phi^2 L^2 + \dots + \phi^k L^k$ y multiplicamos por $1 - \phi L$.

:::pasos
= (1 - \phi L)\,S_k = (1 + \phi L + \dots + \phi^k L^k) - (\phi L + \phi^2 L^2 + \dots + \phi^{k+1} L^{k+1})
> Distribuimos: el primer renglón es $1 \cdot S_k$ y el segundo $-\phi L \cdot S_k$.
= = 1 - \phi^{k+1} L^{k+1}
> Todos los términos intermedios se cancelan en pares (es una suma telescópica, como en [[u1:geo-suma]]).
= |\phi| < 1 \;\Rightarrow\; \phi^{k+1} \to 0 \;\Rightarrow\; (1 - \phi L)\,S_\infty = 1
> El término que sobra desaparece cuando $k$ crece. Si $|\phi| \ge 1$ no desaparece y el inverso no existe.
= (1 - \phi L)^{-1} = \sum_{j=0}^{\infty} \phi^j L^j \;\Rightarrow\; y_t = (1 - \phi L)^{-1}\varepsilon_t = \sum_{j=0}^{\infty} \phi^j\,\varepsilon_{t-j}
> Aplicado al AR(1): es la forma MA(∞) con pesos $\psi_j = \phi^j$ [[u1:ar1-sustitucion]].
:::
:::

Para polinomios más grandes no hace falta factorizar: los coeficientes del inverso salen con una **recursión**, igual que en la división larga.

:::guiado Inverso de 1 − 0.2L − 0.15L² con la recursión {#guia-invertir}
Buscamos $c_0, c_1, c_2, \dots$ tales que $(1 - 0.2L - 0.15L^2)(c_0 + c_1 L + c_2 L^2 + \dots) = 1$.

| $j$ | $c_{j-1}$ | $c_{j-2}$ | $c_j = 0.2\,c_{j-1} + 0.15\,c_{j-2}$ |
|---|---|---|---|
| 0 | — | — | 1 |
| 1 | 1 | — | 0.2 |
| 2 | 0.2 | 1 | 0.19 |
| 3 | 0.19 | 0.2 | 0.068 |
| 4 | 0.068 | 0.19 | 0.0421 |
---
= L^0:\; c_0 = 1
> El término independiente del producto debe ser 1.
@ da c4[1]
= L^1:\; c_1 - 0.2\,c_0 = 0 \;\Rightarrow\; c_1 = 0.2
> El coeficiente de cada potencia $L^j$ ($j \ge 1$) del producto debe ser 0.
@ usa c2[2]; da c4[2]
= L^2:\; c_2 - 0.2\,c_1 - 0.15\,c_0 = 0 \;\Rightarrow\; c_2 = 0.04 + 0.15 = 0.19
> A partir de aquí la regla es siempre la misma: $c_j = 0.2\,c_{j-1} + 0.15\,c_{j-2}$.
@ usa c2[3] c3[3]; da c4[3]
= c_3 = 0.2(0.19) + 0.15(0.2) = 0.038 + 0.03 = 0.068
> Cada coeficiente se calcula con los dos anteriores.
@ usa c2[4] c3[4]; da c4[4]
= c_4 = 0.2(0.068) + 0.15(0.19) = 0.0136 + 0.0285 = 0.0421
> Los coeficientes se apagan porque las raíces están fuera del círculo. Son los pesos $\psi_j$ del AR(2) [[psi-pesos]].
@ usa c2[5] c3[5]; da c4[5]
:::

:::interactivo w2-invertir | ¿Cuándo existe el inverso? {#w-invertir}
Mueve $\phi$ y el número de términos $k$. Verás los coeficientes del inverso $1, \phi, \phi^2, \dots$ y lo que sobra al multiplicar: $\phi^{k+1} L^{k+1}$.
@@@
- **Izquierda**: los coeficientes $\phi^j$. Con $|\phi| < 1$ se apagan; con $|\phi| > 1$ crecen sin control.
- **Derecha**: el tamaño del sobrante $|\phi|^{k+1}$ (en escala logarítmica). Si baja hacia 0, el inverso existe; si sube, no.
- Con $\phi = 1$ (raíz unitaria) el sobrante vale siempre 1: el paseo aleatorio no tiene forma MA(∞) con pesos que se apaguen.
- **Vista extra**: la multiplicación $(1 - \phi L)\,S_k$ coeficiente por coeficiente, donde se ve la cancelación telescópica.
:::

:::resumen Lo que debes llevarte del operador L
- $L\,y_t = y_{t-1}$; las diferencias son polinomios: $\Delta = 1 - L$, $\Delta_s = 1 - L^s$.
- Los modelos se escriben $\phi(L)\,y_t = c + \theta(L)\,\varepsilon_t$; los coeficientes AR van con signo **menos** dentro de $\phi(L)$.
- Los polinomios se multiplican como en álgebra; las raíces del producto son las de los factores.
- **Estacionario** ⇔ raíces de $\phi(z)$ fuera del círculo unitario ⇔ los choques se apagan.
- Invertir $1 - \phi L$ da la serie geométrica $\sum \phi^j L^j$ (solo si $|\phi| < 1$).
:::
