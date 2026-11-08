## 🧩 Ejercicios de la Unidad II {#ejercicios2}
@mapa 61 ejercicios de opción múltiple, cálculo e interpretación de salidas de Python, cada uno con su respuesta explicada.

Elige una opción y presiona **Ver respuesta**: se marca la correcta, se explica por qué y hay un enlace a la sección donde se estudia el tema. Los ejercicios de cálculo abierto tienen **Ver solución paso a paso**. Intenta resolverlos en papel antes de abrir la solución.

<div class="marcador" id="marcador"><div class="m-datos"><span class="m-resp"></span><span class="m-ok"></span><span class="m-mal"></span></div><button type="button">Reiniciar ejercicios</button></div>

### Bloque A · Operador rezago y polinomios {#ej2-a}

:::ejercicio Básico | [[def-l]]
Con $y = (3,\ 5,\ 4,\ 8)$, ¿cuánto vale $(1 - L)^2\,y_4$?
- [ ] −1
- [ ] 4
- [x] 5
- [ ] 3
---
$(1 - L)^2 y_4 = y_4 - 2y_3 + y_2 = 8 - 2(4) + 5 = 5$. Otra forma: $\Delta y = (2, -1, 4)$ y $\Delta^2 y_4 = 4 - (-1) = 5$.
:::

:::ejercicio Básico | [[polinomios]]
¿Qué polinomio $\phi(L)$ corresponde a $y_t = 0.7\,y_{t-1} - 0.2\,y_{t-2} + \varepsilon_t$?
- [ ] $0.7L - 0.2L^2$
- [ ] $1 + 0.7L - 0.2L^2$
- [ ] $1 - 0.7L - 0.2L^2$
- [x] $1 - 0.7L + 0.2L^2$
---
Se pasan los rezagos a la izquierda: $y_t - 0.7y_{t-1} + 0.2y_{t-2} = \varepsilon_t$, así que $\phi(L) = 1 - 0.7L + 0.2L^2$. Cada coeficiente cambia de signo al entrar al polinomio [[demo-polinomio]].
:::

:::ejercicio Intermedio | [[guia-doble-dif]]
Expande $(1 - 0.5L)(1 - L^4)$.
- [ ] $1 - 0.5L - L^4 - 0.5L^5$
- [x] $1 - 0.5L - L^4 + 0.5L^5$
- [ ] $1 - 0.5L^4$
- [ ] $1 - 1.5L^5$
---
Término por término: $1 \cdot 1 = 1$, $1 \cdot (-L^4) = -L^4$, $(-0.5L)\cdot 1 = -0.5L$ y $(-0.5L)(-L^4) = +0.5L^5$. El término cruzado lleva signo **más** porque es el producto de dos negativos.
:::

:::ejercicio Intermedio | [[raices]]
Las raíces de $1 - 0.9z + 0.2z^2$ son:
- [ ] $z = 1$ y $z = 2$: hay raíz unitaria.
- [ ] $z = 0.4$ y $z = 0.5$: el AR(2) no es estacionario.
- [ ] $z = -2$ y $z = -2.5$: el AR(2) es estacionario.
- [x] $z = 2$ y $z = 2.5$: el AR(2) es estacionario.
---
$1 - 0.9z + 0.2z^2 = (1 - 0.4z)(1 - 0.5z)$, que se anula en $z = 1/0.4 = 2.5$ y $z = 1/0.5 = 2$: las dos fuera del círculo unitario. Los valores 0.4 y 0.5 son las **raíces inversas**: confundirlas es el error típico [[raices]].
:::

:::ejercicio Básico | [[invertir]]
¿Cuáles son los primeros cuatro coeficientes de $(1 - 0.8L)^{-1}$?
- [ ] $1,\ -0.8,\ 0.64,\ -0.512$
- [ ] $1,\ 1.25,\ 1.5625,\ 1.953$
- [ ] $1,\ 0.8,\ 1.6,\ 2.4$
- [x] $1,\ 0.8,\ 0.64,\ 0.512$
---
Es la serie geométrica $\sum 0.8^j L^j$, que existe porque $|0.8| < 1$ [[demo-invertir]]. Son los pesos $\psi_j$ del AR(1) con $\phi = 0.8$.
:::

### Bloque B · Modelos AR {#ej2-b}

:::ejercicio Básico | [[ar-media]]
¿Cuál es la media de $y_t = 3 + 0.4\,y_{t-1} + \varepsilon_t$?
- [ ] 3
- [x] 5
- [ ] 1.2
- [ ] 7.5
---
$\mu = c/(1 - \phi) = 3/0.6 = 5$. La constante no es la media: la memoria la amplifica [[demo-ar-media]].
:::

:::ejercicio Básico | [[ar-media]]
¿Cuál es la media de $y_t = 2 + 0.5\,y_{t-1} + 0.3\,y_{t-2} + \varepsilon_t$?
- [x] 10
- [ ] 2.5
- [ ] 4
- [ ] 2
---
$\mu = 2/(1 - 0.5 - 0.3) = 2/0.2 = 10$.
:::

:::ejercicio Básico | [[ar2-triangulo]]
¿Cuál de estos AR(2) **no** es estacionario?
- [ ] $\phi = (0.5,\ 0.3)$
- [ ] $\phi = (1.2,\ -0.5)$
- [x] $\phi = (0.3,\ 0.8)$
- [ ] $\phi = (-0.5,\ 0.2)$
---
Con $(0.3, 0.8)$: $\phi_1 + \phi_2 = 1.1 > 1$, falla la primera condición del triángulo. Los demás cumplen las tres: $\phi_1 + \phi_2 < 1$, $\phi_2 - \phi_1 < 1$ y $|\phi_2| < 1$.
:::

:::ejercicio Intermedio | [[ar-acf]]
Para el AR(2) con $\phi_1 = 0.6$ y $\phi_2 = 0.2$, ¿cuánto valen $\rho(1)$ y $\rho(2)$?
- [ ] $\rho(1) = 0.75$, $\rho(2) = 0.45$
- [ ] $\rho(1) = 0.6$, $\rho(2) = 0.36$
- [x] $\rho(1) = 0.75$, $\rho(2) = 0.65$
- [ ] $\rho(1) = 0.6$, $\rho(2) = 0.56$
---
:::pasos
= \rho(1) = \frac{\phi_1}{1 - \phi_2} = \frac{0.6}{0.8} = 0.75
> Yule–Walker con $k = 1$ [[demo-yw]].
= \rho(2) = \phi_1\rho(1) + \phi_2 = 0.6(0.75) + 0.2 = 0.65
> Yule–Walker con $k = 2$. Las opciones con 0.36 o 0.6 usan la ACF del AR(1) por error.
:::
:::

:::ejercicio Reto | [[ar2-complejas]]
El AR(2) $y_t = 1.2\,y_{t-1} - 0.72\,y_{t-2} + \varepsilon_t$ tiene raíces complejas. ¿Cada cuántos periodos se repite aproximadamente su pseudo-ciclo?
- [x] 8
- [ ] 4
- [ ] 12
- [ ] No tiene ciclo.
---
:::pasos
= r = \sqrt{0.72} = 0.8485, \qquad \cos\omega = \frac{1.2}{2(0.8485)} = 0.7071
> Fórmulas del pseudo-ciclo [[demo-pseudociclo]].
= \omega = \frac{\pi}{4} \;\Rightarrow\; P = \frac{2\pi}{\pi/4} = 8
> Un ciclo cada 8 periodos.
:::
:::

:::ejercicio Básico | [[ar-pacf]]
¿Qué patrón tiene la PACF teórica de un AR(3)?
- [ ] Decae exponencialmente sin cortarse.
- [ ] Es igual a la ACF.
- [ ] Tiene un solo pico en el rezago 3.
- [x] Tiene a lo más tres valores distintos de cero y después vale cero.
---
La PACF de un AR($p$) se corta después del rezago $p$, y su último valor no nulo es $\phi_3$ [[demo-pacf-ar2]].
:::

:::ejercicio Intermedio | [[ar-estimar]]
Con $\hat\rho(1) = 0.5$ y $\hat\rho(2) = 0.4$, estima un AR(2) por Yule–Walker.
---
:::pasos
= \hat\phi_2 = \frac{\hat\rho(2) - \hat\rho(1)^2}{1 - \hat\rho(1)^2} = \frac{0.4 - 0.25}{1 - 0.25} = \frac{0.15}{0.75} = 0.2
> Es la PACF en el rezago 2 [[guia-yw]].
= \hat\phi_1 = \hat\rho(1)\,(1 - \hat\phi_2) = 0.5(0.8) = 0.4
> De la ecuación de Yule–Walker con $k = 1$.
= \hat\phi_1 + \hat\phi_2 = 0.6 < 1, \quad \hat\phi_2 - \hat\phi_1 = -0.2 < 1, \quad |\hat\phi_2| < 1
> El modelo estimado es estacionario.
:::
:::

:::ejercicio Básico | [[ar-python]]
¿Cómo se escribe en `ArmaProcess` el AR(2) $y_t = 0.5\,y_{t-1} - 0.3\,y_{t-2} + \varepsilon_t$?
- [ ] `ArmaProcess(ar=[0.5, -0.3], ma=[1])`
- [ ] `ArmaProcess(ar=[1, 0.5, -0.3], ma=[1])`
- [x] `ArmaProcess(ar=[1, -0.5, 0.3], ma=[1])`
- [ ] `ArmaProcess(ar=[1, -0.5, -0.3], ma=[1])`
---
`ar` recibe el polinomio $\phi(L) = 1 - 0.5L + 0.3L^2$: el 1 inicial y los coeficientes con el signo **cambiado**.
:::

### Bloque C · Modelos MA e invertibilidad {#ej2-c}

:::ejercicio Básico | [[ma-momentos]]
MA(1) con $\theta = -0.5$ y $\sigma^2 = 2$. ¿Cuánto valen $\gamma(0)$ y $\rho(1)$?
- [x] $\gamma(0) = 2.5$, $\rho(1) = -0.4$
- [ ] $\gamma(0) = 2$, $\rho(1) = -0.5$
- [ ] $\gamma(0) = 1.5$, $\rho(1) = -0.4$
- [ ] $\gamma(0) = 2.5$, $\rho(1) = 0.4$
---
$\gamma(0) = \sigma^2(1 + \theta^2) = 2(1.25) = 2.5$ y $\rho(1) = \theta/(1 + \theta^2) = -0.5/1.25 = -0.4$. El signo de $\rho(1)$ es el de $\theta$.
:::

:::ejercicio Reto | [[ma-momentos]]
MA(2) con $\theta_1 = 0.4$ y $\theta_2 = -0.3$. ¿Cuál es su ACF?
- [ ] $\rho(1) = 0.32$, $\rho(2) = -0.24$, $\rho(3) = 0.1$
- [ ] $\rho(1) = 0.4$, $\rho(2) = -0.3$, $\rho(3) = 0$
- [x] $\rho(1) = 0.224$, $\rho(2) = -0.24$, $\rho(k) = 0$ para $k \ge 3$
- [ ] Decae exponencialmente.
---
:::pasos
= \gamma(0)/\sigma^2 = 1 + 0.16 + 0.09 = 1.25
> Suma de los pesos al cuadrado.
= \gamma(1)/\sigma^2 = \theta_1 + \theta_1\theta_2 = 0.4 - 0.12 = 0.28 \;\Rightarrow\; \rho(1) = 0.28/1.25 = 0.224
> Pares de pesos a distancia 1 [[guia-ma2-acf]].
= \gamma(2)/\sigma^2 = \theta_2 = -0.3 \;\Rightarrow\; \rho(2) = -0.3/1.25 = -0.24
> A distancia 2 solo coincide el par $(1, \theta_2)$; después, cero.
:::
:::

:::ejercicio Básico | [[invertibilidad]]
¿Qué MA(1) tiene exactamente la misma ACF que el MA(1) con $\theta = 0.25$?
- [x] $\theta = 4$
- [ ] $\theta = 0.5$
- [ ] $\theta = -0.25$
- [ ] $\theta = 1$
---
$\theta$ y $1/\theta$ dan el mismo $\rho(1)$: $0.25/1.0625 = 4/17 = 0.2353$ en los dos casos [[demo-gemelos]]. Se elige el invertible, $\theta = 0.25$.
:::

:::ejercicio Intermedio | [[demo-ma1-max]]
Una serie tiene ACF muestral con un único pico, $\hat\rho(1) = 0.7$, y todo lo demás dentro de la banda. ¿Qué puedes concluir?
- [ ] Es un MA(1) con $\theta \approx 0.7$.
- [x] No puede ser un MA(1) puro, porque en un MA(1) $|\rho(1)| \le 0.5$.
- [ ] Es ruido blanco.
- [ ] Es un AR(1) con $\phi = 0.7$, porque la ACF se corta.
---
$\theta/(1 + \theta^2)$ nunca pasa de 0.5. Un pico de 0.7 exige otra estructura (por ejemplo, una parte AR o una diferencia que falta). Un AR(1) tampoco: su ACF decaería ($0.7, 0.49, \dots$), no se cortaría.
:::

:::ejercicio Intermedio | [[guia-recuperar]]
MA(1) $y_t = \varepsilon_t + 0.5\,\varepsilon_{t-1}$ con $\varepsilon_0 = 0$ y datos $y = (2,\ 0,\ 1.5)$. ¿Cuáles son los choques recuperados?
- [ ] $(2,\ 0,\ 1.5)$
- [x] $(2,\ -1,\ 2)$
- [ ] $(2,\ 1,\ 1)$
- [ ] $(1,\ -0.5,\ 1.75)$
---
$\varepsilon_t = y_t - 0.5\,\varepsilon_{t-1}$: $\varepsilon_1 = 2$, $\varepsilon_2 = 0 - 0.5(2) = -1$, $\varepsilon_3 = 1.5 - 0.5(-1) = 2$.
:::

### Bloque D · ARMA y pesos ψ {#ej2-d}

:::ejercicio Básico | [[psi-pesos]]
ARMA(1,1) con $\phi = 0.5$ y $\theta = 0.3$. ¿Cuánto valen $\psi_1$, $\psi_2$ y $\psi_3$?
- [ ] $0.8,\ 0.64,\ 0.512$
- [ ] $0.5,\ 0.25,\ 0.125$
- [ ] $0.3,\ 0.15,\ 0.075$
- [x] $0.8,\ 0.4,\ 0.2$
---
$\psi_1 = \theta + \phi = 0.8$; después $\psi_j = \phi\,\psi_{j-1}$: $0.4$, $0.2$ [[guia-psi]].
:::

:::ejercicio Intermedio | [[arma-acf]]
ARMA(1,1) con $\phi = 0.5$ y $\theta = 0.5$. ¿Cuánto valen $\rho(1)$ y $\rho(2)$?
- [ ] $0.5$ y $0.25$
- [ ] $0.7143$ y $0.5102$
- [ ] $0.4$ y $0.2$
- [x] $0.7143$ y $0.3571$
---
$\rho(1) = \frac{(1)(1.25)}{1 + 0.5 + 0.25} = \frac{1.25}{1.75} = 0.7143$ y $\rho(2) = \phi\,\rho(1) = 0.5(0.7143) = 0.3571$ [[demo-acf-arma11]].
:::

:::ejercicio Básico | [[cancelacion]]
¿Qué proceso es el ARMA(1,1) $y_t = 0.6\,y_{t-1} + \varepsilon_t - 0.6\,\varepsilon_{t-1}$?
- [x] Ruido blanco: los dos polinomios son iguales y se cancelan.
- [ ] Un paseo aleatorio.
- [ ] Un AR(1) con $\phi = 0.6$.
- [ ] Un MA(1) con $\theta = -0.6$.
---
$(1 - 0.6L)\,y_t = (1 - 0.6L)\,\varepsilon_t \Rightarrow y_t = \varepsilon_t$. Ajustarle un ARMA(1,1) daría errores estándar enormes [[demo-cancelacion]].
:::

:::ejercicio Intermedio | [[arma-def]]
¿Qué garantiza que un ARMA(2,1) sea **invertible**?
- [ ] Que las raíces de $\phi(z)$ estén fuera del círculo unitario.
- [ ] Que la serie tenga media cero.
- [ ] Que $\phi_1 + \phi_2 < 1$.
- [x] Que la raíz de $\theta(z) = 1 + \theta_1 z$ esté fuera del círculo unitario, es decir, $|\theta_1| < 1$.
---
La invertibilidad depende solo de la parte MA; la estacionariedad, solo de la parte AR.
:::

### Bloque E · Identificación {#ej2-e}

:::ejercicio Básico | [[patrones2]]
La ACF de una serie estacionaria se corta después del rezago 2 y la PACF decae. ¿Qué modelo propones?
- [x] MA(2)
- [ ] AR(2)
- [ ] ARMA(2,2)
- [ ] Ruido blanco
---
ACF que se corta en $q$ = MA($q$). Si la que se cortara fuera la PACF, sería AR(2).
:::

:::ejercicio Básico | [[patrones2]]
La ACF de una serie empieza en 0.98 y baja casi en línea recta: 0.97, 0.95, 0.94… ¿Qué haces?
- [x] Diferenciar la serie y volver a mirar la ACF y la PACF.
- [ ] Proponer un MA de orden alto.
- [ ] Proponer un AR(1) con $\phi = 0.98$.
- [ ] Concluir que es ruido blanco.
---
Es la huella de una raíz unitaria. Primero se diferencia (y se confirma con ADF/KPSS); se identifica sobre la serie estacionaria [[box-jenkins]].
:::

:::ejercicio Intermedio | [[patrones2]]
En una serie mensual ya diferenciada, la ACF tiene un pico significativo en el rezago 12 y nada en 24 ni 36; la PACF tiene picos en 12, 24 y 36 que decrecen. ¿Qué componente estacional propones?
- [x] $Q = 1$ (MA estacional)
- [ ] $P = 1$ (AR estacional)
- [ ] $D = 1$ (otra diferencia estacional)
- [ ] Ninguno
---
Es el MA(1) «estirado» al reloj de 12 meses: la ACF se corta en $s$ y la PACF decae en $s, 2s, 3s$ [[ar-estacional]].
:::

:::ejercicio Intermedio | [[candidatos]]
Dos candidatos para la misma serie: ARMA(1,1) con AIC = −310.2 y ARMA(2,2) con AIC = −310.9; los dos dejan residuos de ruido blanco. ¿Cuál eliges?
- [ ] ARMA(2,2), porque su AIC es menor.
- [x] ARMA(1,1): la diferencia de AIC es menor que 2 y tiene dos parámetros menos.
- [ ] Ninguno: hay que probar ARMA(3,3).
- [ ] Da igual: elige al azar.
---
$\Delta\AIC = 0.7 < 2$: apoyo parecido. Ante el empate, **parsimonia** [[cancelacion]] (y el BIC casi seguro preferiría el ARMA(1,1)).
:::

:::ejercicio Básico | [[ciclo-bj]]
¿Cuál es el orden de la metodología Box–Jenkins?
- [x] Identificar → estimar → diagnosticar → pronosticar (regresando a identificar si el diagnóstico falla)
- [ ] Estimar → identificar → pronosticar → diagnosticar
- [ ] Diagnosticar → identificar → estimar → pronosticar
- [ ] Pronosticar → validar → estimar
---
Es un ciclo: si los residuos no son ruido blanco, se vuelve a identificar con la información que dan los residuos.
:::

### Bloque F · Transformaciones y ARIMA {#ej2-f}

:::ejercicio Básico | [[boxcox]]
¿Cuánto vale la transformación de Box–Cox de $y = 25$ con $\lambda = 0.5$?
- [ ] 5
- [ ] 12.5
- [x] 8
- [ ] 3.219
---
$(25^{0.5} - 1)/0.5 = (5 - 1)/0.5 = 8$. Con $\lambda = 0$ sería $\ln 25 = 3.219$.
:::

:::ejercicio Intermedio | [[demo-dlog]]
Si $\Delta\ln y_t = 0.05$, ¿cuánto creció $y$ exactamente?
- [ ] 5% exacto
- [ ] 50%
- [ ] 0.05%
- [x] $e^{0.05} - 1 = 5.13\%$ (la diferencia del log es una buena aproximación, 5%)
---
$y_t/y_{t-1} = e^{0.05} = 1.0513$. Para crecimientos pequeños $\Delta\ln y \approx r$ [[demo-dlog]].
:::

:::ejercicio Intermedio | [[sobrediferenciar]]
Después de diferenciar una serie, su varianza pasó de 2.1 a 3.9 y $\hat\rho(1) = -0.52$. ¿Qué indica?
- [ ] Que hace falta otra diferencia.
- [x] Que probablemente se sobrediferenció.
- [ ] Que la serie es un paseo aleatorio.
- [ ] Que hay estacionalidad.
---
Diferenciar una serie que ya era estacionaria aumenta la varianza (la duplica en el ruido blanco) y crea $\rho(1) \approx -0.5$ [[demo-sobredif]].
:::

:::ejercicio Reto | [[guia-arima-pron]]
ARIMA(1,1,0) con $\phi = 0.5$, sin constante. Los últimos datos son $y_{t-1} = 50$ y $y_t = 54$. Calcula $\hat{y}_{t+1}$, $\hat{y}_{t+2}$ y el nivel al que converge el pronóstico.
---
:::pasos
= y_t = 1.5\,y_{t-1} - 0.5\,y_{t-2} + \varepsilon_t
> Forma expandida: $(1 - 0.5L)(1 - L) = 1 - 1.5L + 0.5L^2$ [[demo-arima110]].
= \hat{y}_{t+1} = 1.5(54) - 0.5(50) = 81 - 25 = 56
> Con los dos últimos datos.
= \hat{y}_{t+2} = 1.5(56) - 0.5(54) = 84 - 27 = 57
> El primer pronóstico entra como rezago.
= \hat{y}_{t+\infty} = 54 + 4\,\frac{0.5}{1 - 0.5} = 54 + 4 = 58
> Las diferencias pronosticadas son $4(0.5)^h$: $2, 1, 0.5, \dots$, que suman 4.
:::
:::

:::ejercicio Básico | [[arima-famosos]]
¿Cuál es el pronóstico a cualquier horizonte de un ARIMA(0,1,0) sin constante?
- [ ] La media de toda la serie.
- [x] El último valor observado.
- [ ] Cero.
- [ ] Una recta con la pendiente promedio.
---
Es el paseo aleatorio: $\hat{y}_{t+h} = y_t$ (el pronóstico ingenuo). Con constante sería una recta con pendiente igual a la deriva [[deriva]].
:::

:::ejercicio Intermedio | [[demo-ses]]
Un ARIMA(0,1,1) tiene $\hat\theta = -0.7$. ¿Qué suavizamiento exponencial simple es equivalente?
- [ ] $\alpha = 0.7$
- [ ] $\alpha = 1.7$
- [x] $\alpha = 0.3$
- [ ] $\alpha = -0.7$
---
$\alpha = 1 + \theta = 0.3$: el pronóstico pesa 30% el dato más reciente y 70% el pronóstico anterior.
:::

:::ejercicio Intermedio | [[intervalos-psi]]
Paseo aleatorio con $\sigma = 3$. ¿Cuál es la semiamplitud de la banda de 95% a $h = 4$ pasos?
- [ ] $1.96 \times 3 = 5.88$
- [x] $1.96 \times 3 \times \sqrt 4 = 11.76$
- [ ] $1.96 \times 3 \times 4 = 23.52$
- [ ] $1.96 \times 9 \times 4 = 70.56$
---
En el paseo aleatorio $\psi_j = 1$, así que $\sigma_h^2 = h\sigma^2$ y $\sigma_h = \sigma\sqrt h = 6$ [[guia-bandas]].
:::

:::ejercicio Básico | [[deriva]]
Paseo aleatorio con deriva $c = 2$ y último dato $y_t = 100$. ¿Cuánto vale $\hat{y}_{t+5}$?
- [ ] 100
- [ ] 102
- [ ] 1000
- [x] 110
---
$\hat{y}_{t+h} = y_t + c\,h = 100 + 2(5) = 110$ [[demo-deriva]].
:::

### Bloque G · SARIMA y variables exógenas {#ej2-g}

:::ejercicio Reto | [[demo-acf-aerolinea]]
Modelo de aerolínea con $\theta = -0.5$ y $\Theta = -0.5$. ¿Cuánto valen $\rho(1)$, $\rho(12)$ y $\rho(13)$?
- [ ] $-0.4$, $-0.4$ y $-0.16$
- [ ] $-0.5$, $-0.5$ y $0.25$
- [x] $-0.4$, $-0.4$ y $0.16$
- [ ] $-0.4$, $0$ y $0$
---
$\rho(1) = \rho(12) = -0.5/1.25 = -0.4$ y el satélite $\rho(13) = \rho(1)\,\rho(12) = 0.16$, positivo [[guia-acf-aerolinea]].
:::

:::ejercicio Básico | [[sarima-def]]
Datos mensuales con una diferencia estacional y un MA estacional, sin AR estacional. ¿Qué `seasonal_order` usas?
- [ ] `(1, 1, 0, 12)`
- [x] `(0, 1, 1, 12)`
- [ ] `(0, 1, 1, 1)`
- [ ] `(12, 1, 1, 0)`
---
`seasonal_order=(P, D, Q, s)`: $P = 0$, $D = 1$, $Q = 1$, $s = 12$.
:::

:::ejercicio Básico | [[ar-estacional]]
En $y_t = 0.7\,y_{t-12} + \varepsilon_t$, ¿cuánto vale $\rho(24)$?
- [ ] 0
- [ ] 0.7
- [ ] 1.4
- [x] 0.49
---
Es un AR(1) en el reloj de 12 meses: $\rho(12k) = 0.7^k$, así que $\rho(24) = 0.49$; en los rezagos que no son múltiplos de 12, cero.
:::

:::ejercicio Intermedio | [[requisitos-exog]]
Quieres pronosticar los usuarios de **mañana** en una estación. ¿Cuál de estas exógenas es válida?
- [ ] El número de viajes con tarjeta que se registrarán mañana.
- [ ] Los usuarios de mañana en la estación vecina.
- [x] Si mañana es día festivo.
- [ ] El promedio de usuarios de toda la serie, incluida la prueba.
---
El calendario se conoce con anticipación. Las otras tres usan información que no tendrías al hacer el pronóstico: **fuga de información** [[fuga]].
:::

:::ejercicio Intermedio | [[log2]]
En un SARIMAX sobre $\ln y_t$, el coeficiente de «promoción» es $\hat\beta = -0.2$. ¿Cómo se interpreta?
- [ ] La promoción baja $y$ en 0.2 unidades.
- [x] La promoción baja $y$ en $100(e^{-0.2} - 1) = 18.1\%$ ese periodo.
- [ ] La promoción baja $y$ en 20% para siempre.
- [ ] El coeficiente no se puede interpretar.
---
En logaritmos, un cambio de $\beta$ multiplica $y$ por $e^\beta$. En la forma de statsmodels (regresión con errores ARMA) el efecto es **contemporáneo** [[demo-armax]].
:::

:::ejercicio Reto | [[demo-armax]]
Un ARMAX $y_t = 0.5\,y_{t-1} + 2\,x_t + \varepsilon_t$ y una regresión con errores AR(1) $y_t = 2\,x_t + u_t$, $u_t = 0.5\,u_{t-1} + \varepsilon_t$. Si $x$ sube 1 unidad de forma permanente, ¿cuánto sube $y$ a largo plazo en cada caso?
- [ ] 2 en los dos.
- [x] 4 en el ARMAX y 2 en la regresión con errores AR(1).
- [ ] 4 en los dos.
- [ ] 1 en el ARMAX y 2 en la regresión.
---
En el ARMAX el efecto se arrastra: $\beta/(1 - \phi) = 2/0.5 = 4$. En la regresión con errores AR(1) el efecto de $x$ no pasa por la memoria: es 2 desde el primer periodo [[guia-armax]].
:::

### Bloque H · Verosimilitud, AIC/BIC y summary {#ej2-h}

:::ejercicio Básico | [[mv-idea]]
En 12 lanzamientos salen 3 águilas. ¿Cuál es el estimador de máxima verosimilitud de $p$?
- [ ] 0.5
- [ ] 0.333
- [x] 0.25
- [ ] 3
---
$\ell(p) = 3\ln p + 9\ln(1 - p)$; derivando e igualando a cero, $\hat p = 3/12 = 0.25$ [[guia-moneda]].
:::

:::ejercicio Intermedio | [[demo-mv-normal]]
¿Cuál es el estimador de máxima verosimilitud de $\sigma^2$ con los datos $(1, 3, 5)$ normales?
- [ ] 4
- [x] 2.667
- [ ] 1.633
- [ ] 8
---
$\bar y = 3$ y $\sum(y - \bar y)^2 = 4 + 0 + 4 = 8$; la MV divide entre $n = 3$: $8/3 = 2.667$. (Con $n - 1$ daría 4).
:::

:::ejercicio Intermedio | [[aic-def]]
Un modelo tiene $\ell = 150$, $k = 4$ parámetros y $n = 100$ observaciones efectivas. ¿Cuánto valen AIC y BIC?
- [ ] AIC = 292, BIC = 318.4
- [x] AIC = −292, BIC = −281.58
- [ ] AIC = −296, BIC = −300
- [ ] AIC = −146, BIC = −141.4
---
$\AIC = 2(4) - 2(150) = -292$ y $\BIC = 4\ln 100 - 300 = 18.42 - 300 = -281.58$ [[guia-aic]].
:::

:::ejercicio Intermedio | [[penalizacion]]
Agregar un parámetro sube la log-verosimilitud de 200.0 a 200.6. ¿Qué pasa con el AIC?
- [x] Sube 0.8: no vale la pena el parámetro.
- [ ] Baja 1.2: el modelo mejora.
- [ ] No cambia.
- [ ] Baja 0.6.
---
$\Delta\AIC = 2 - 2(0.6) = +0.8$. Un parámetro solo se justifica para el AIC si sube $\ell$ en más de 1 [[demo-umbral]].
:::

:::ejercicio Básico | [[comparabilidad]]
¿Qué par de modelos **no** se puede comparar directamente con el AIC?
- [ ] ARIMA(1,1,1) y ARIMA(2,1,0) sobre la misma serie.
- [ ] AR(1) y AR(2) con la misma muestra.
- [ ] SARIMA(0,1,1)(0,1,1)₁₂ y SARIMA(1,1,0)(0,1,1)₁₂ sobre la misma serie.
- [x] ARIMA(1,1,1) y ARIMA(1,0,1) sobre la misma serie.
---
Con distinto $d$ la verosimilitud es de series distintas ($y_t$ contra $\Delta y_t$) y con distinto número de observaciones [[comparabilidad]].
:::

:::ejercicio Intermedio | [[summary-coef]]
En un summary aparece `ar.L1   -0.4200   0.150`. ¿Cuánto valen $z$ y el intervalo de 95%, y es significativo?
- [x] $z = -2.8$; intervalo $[-0.714,\ -0.126]$; significativo al 5%.
- [ ] $z = -0.063$; no significativo.
- [ ] $z = -2.8$; intervalo $[-0.57,\ -0.27]$; no significativo.
- [ ] $z = 2.8$; intervalo $[0.126,\ 0.714]$; significativo.
---
$z = -0.42/0.15 = -2.8$ y $|z| > 1.96$. Intervalo: $-0.42 \pm 1.96(0.15) = -0.42 \pm 0.294$, que no contiene al 0 [[guia-coef]].
:::

:::ejercicio Básico | [[summary-pruebas]]
En el summary de un SARIMAX aparece `Prob(Q): 0.03`. ¿Qué significa?
- [x] Que se rechaza la ausencia de autocorrelación en el rezago 1: el modelo dejó dinámica sin capturar.
- [ ] Que los residuos son normales.
- [ ] Que la varianza es constante.
- [ ] Que el modelo es estacionario.
---
Es el p-value de Ljung–Box con un rezago. Además, conviene revisar más rezagos (12 y 24) con `acorr_ljungbox` [[lb-residuos]].
:::

### Bloque I · Diagnóstico y ARCH {#ej2-i}

:::ejercicio Básico | [[residuos-iniciales]]
Ajustaste un SARIMA(1,1,1)(0,1,1)₁₂. ¿Cuántos residuos iniciales debes descartar antes de las pruebas?
- [ ] 1
- [x] 13
- [ ] 12
- [ ] 14
---
Se pierden $d + sD = 1 + 12 = 13$, que es el `loglikelihood_burn` del ajuste.
:::

:::ejercicio Intermedio | [[lb-residuos]]
Ljung–Box con `lags=[24]` sobre los residuos de un SARIMA(1,1,1)(0,1,1)₁₂. ¿Qué `model_df` usas y cuántos grados de libertad tiene la $\chi^2$?
- [ ] `model_df=0`, 24 grados de libertad
- [ ] `model_df=5`, 19 grados de libertad
- [ ] `model_df=13`, 11 grados de libertad
- [x] `model_df=3`, 21 grados de libertad
---
`model_df` = $p + q + P + Q = 1 + 1 + 0 + 1 = 3$ coeficientes ARMA; los grados de libertad son $24 - 3 = 21$. Las diferencias y $\sigma^2$ no cuentan.
:::

:::ejercicio Intermedio | [[jarque-bera]]
Con $n = 150$ residuos, asimetría $S = 0.4$ y curtosis $K = 4$, ¿se rechaza la normalidad al 5%?
- [ ] No se puede calcular sin los datos.
- [ ] No: $\JB = 0.41$.
- [ ] No: $\JB = 4.1 < 5.99$.
- [x] Sí: $\JB = 25\,(0.16 + 0.25) = 10.25 > 5.99$ (p ≈ 0.006).
---
$\frac{n}{6} = 25$, $S^2 = 0.16$ y $(K - 3)^2/4 = 0.25$. Con 2 grados de libertad, $p = e^{-10.25/2} = 0.006$ [[guia-jb]].
:::

:::ejercicio Reto | [[arch1]]
ARCH(1) con $\omega = 0.3$ y $\alpha = 0.4$. ¿Cuánto valen la varianza incondicional y la curtosis?
- [ ] Varianza 0.3, curtosis 3
- [ ] Varianza 0.7, curtosis 9
- [x] Varianza 0.5, curtosis 4.85
- [ ] Varianza 0.5, curtosis 3
---
$\Var = \frac{0.3}{1 - 0.4} = 0.5$ y $K = \frac{3(1 - 0.16)}{1 - 0.48} = \frac{2.52}{0.52} = 4.85$ [[demo-arch]].
:::

:::ejercicio Intermedio | [[arch-lm]]
La regresión de ARCH-LM con 5 rezagos usó $n' = 200$ observaciones y dio $R^2 = 0.08$. ¿Hay efectos ARCH al 5%? (El valor crítico de $\chi^2_5$ es 11.07).
- [ ] No: $\LM = 0.4$.
- [ ] No: $\LM = 0.08 < 11.07$.
- [x] Sí: $\LM = 200(0.08) = 16 > 11.07$.
- [ ] Sí, porque $R^2 > 0.05$.
---
$\LM = n'R^2 = 16$: se rechaza $H_0$ (sin efectos ARCH) [[guia-archlm]].
:::

:::ejercicio Básico | [[demo-arch]]
¿Qué afirmación sobre un proceso ARCH(1) es correcta?
- [ ] Sus valores están autocorrelacionados.
- [x] Es ruido blanco, pero sus cuadrados están autocorrelacionados.
- [ ] Tiene varianza incondicional que cambia con el tiempo.
- [ ] Su curtosis es menor que la de la normal.
---
No correlacionado no es independiente: la varianza de hoy depende del choque de ayer. La ACF de $\varepsilon_t^2$ decae como $\alpha^k$.
:::

### Bloque J · Validación y métricas {#ej2-j}

:::ejercicio Básico | [[particion]]
¿Por qué no se separan entrenamiento y prueba al azar en una serie de tiempo?
- [ ] Porque la serie queda demasiado corta.
- [ ] Porque statsmodels no lo permite.
- [x] Porque el modelo usaría información del futuro (interpolaría en lugar de pronosticar) y el error saldría engañosamente pequeño.
- [ ] Porque los datos de prueba deben ser los más antiguos.
---
La validación debe respetar el orden del tiempo: entrenamiento → validación → prueba [[tres-bloques]].
:::

:::ejercicio Intermedio | [[un-paso]]
Con un SARIMAX ya ajustado hasta 1959, ¿cómo obtienes los pronósticos **a un paso** de cada mes de 1960?
- [ ] `ajuste.get_forecast(12)`
- [ ] `ajuste.forecast(1)` una sola vez
- [ ] `ajuste.get_prediction(dynamic=True)`
- [x] `ajuste.apply(serie_completa).get_prediction(start=..., end=..., dynamic=False)`
---
`apply` filtra los datos nuevos con los mismos parámetros; con `dynamic=False` cada predicción usa el dato real anterior. `get_forecast(12)` da el pronóstico a varios pasos [[un-paso]].
:::

:::ejercicio Intermedio | [[guia-metricas]]
Calcula MAE, RMSE y MAPE para $y = (50,\ 60,\ 80)$ y $\hat{y} = (55,\ 57,\ 72)$.
---
:::pasos
= e = (-5,\ 3,\ 8)
> Errores $y - \hat{y}$.
= \MAE = \frac{5 + 3 + 8}{3} = 5.333
> Promedio de los valores absolutos.
= \RMSE = \sqrt{\frac{25 + 9 + 64}{3}} = \sqrt{32.667} = 5.715
> Mayor que el MAE, como siempre [[demo-rmse-mae]].
= \MAPE = \frac{100}{3}\left(\frac{5}{50} + \frac{3}{60} + \frac{8}{80}\right) = \frac{100}{3}(0.25) = 8.33\%
> Cada error se divide entre su valor **real**.
:::
:::

:::ejercicio Básico | [[metricas-propiedades]]
¿Cuándo es $\RMSE = \MAE$?
- [x] Cuando todos los errores tienen el mismo valor absoluto.
- [ ] Cuando el modelo no tiene sesgo.
- [ ] Siempre.
- [ ] Nunca.
---
$\MSE - \MAE^2$ es la varianza de los errores absolutos: solo vale cero si todos los $|e_t|$ son iguales [[demo-rmse-mae]].
:::

:::ejercicio Intermedio | [[metricas-def]]
Un modelo tiene $\MASE = 0.8$ con la escala del ingenuo estacional. ¿Qué significa?
- [x] Que su MAE es 20% menor que el error típico del ingenuo estacional en el entrenamiento.
- [ ] Que su MAPE es 80%.
- [ ] Que es 80% peor que el ingenuo.
- [ ] Que explica el 80% de la varianza.
---
$\MASE = \MAE/\MAE_{\text{ingenuo}}$: menor que 1 = mejor que la referencia ingenua.
:::

:::ejercicio Básico | [[metricas-propiedades]]
Una serie de inventarios tiene varios meses con valor 0. ¿Qué métrica **no** conviene usar?
- [ ] MAE
- [ ] RMSE
- [x] MAPE
- [ ] MASE
---
El MAPE divide entre el valor real: con ceros no existe y con valores cercanos a cero explota.
:::

:::ejercicio Intermedio | [[estrategias]]
¿En qué consiste la estrategia **directa** para pronosticar 12 pasos?
- [x] Entrenar un modelo distinto para cada horizonte $h = 1, \dots, 12$.
- [ ] Un modelo de un paso que se aplica 12 veces con sus propios pronósticos.
- [ ] Un solo modelo que produce los 12 valores a la vez.
- [ ] Usar el último dato observado para los 12 meses.
---
Aplicar 12 veces un modelo de un paso es la estrategia **recursiva**, y un solo modelo que entrega los 12 valores a la vez es la **MIMO**. La directa es más robusta cuando el modelo de un paso está mal especificado [[guia-estrategias]].
:::
