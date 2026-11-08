## 🎚️ Filtros lineales: respuesta al impulso y función de transferencia {#filtros-lineales}
@mapa Qué es un filtro lineal, su respuesta al impulso, su función de transferencia (ganancia y fase), el teorema que conecta los espectros de entrada y salida, y cómo leer con él las medias móviles, las diferencias y el suavizamiento exponencial que usamos en las unidades I y II.

### Qué es un filtro lineal {#filtro-def}

La guía oficial lo define como algo que *modifica o elimina componentes de frecuencia de una señal*. Ya usamos muchos sin llamarlos así: la media móvil de la descomposición clásica, la diferencia $1 - L$, la diferencia estacional, el suavizamiento exponencial, y el propio ARMA, que es ruido blanco pasado por un filtro [[u2:filtro-lineal]].

:::definicion Filtro lineal invariante en el tiempo
$$y_t = \sum_{j=-\infty}^{\infty}a_j\,x_{t-j}$$

- Los pesos $a_j$ no dependen de $t$: el filtro trata igual a todos los periodos.
- Es **causal** si solo usa el presente y el pasado ($a_j = 0$ para $j < 0$): se puede aplicar en tiempo real.
- Es **simétrico** o centrado si $a_{-j} = a_j$: usa el pasado y el futuro por igual (la media móvil centrada de la Unidad I [[u1:mm-centrada]]).
:::

| Filtro | Pesos $a_j$ | Causal | Dónde lo usamos |
|---|---|---|---|
| Media móvil centrada de 3 | $a_{-1} = a_0 = a_1 = 1/3$ | No | Suavizar (Unidad I) |
| Media móvil $2\times 12$ | $\frac{1}{24}, \frac{1}{12}, \dots, \frac{1}{12}, \frac{1}{24}$ ($j = -6..6$) | No | Tendencia de la descomposición clásica |
| Diferencia $1 - L$ | $a_0 = 1$, $a_1 = -1$ | Sí | Quitar la tendencia |
| Diferencia estacional $1 - L^{12}$ | $a_0 = 1$, $a_{12} = -1$ | Sí | Quitar la estacionalidad |
| Suavizamiento exponencial | $a_j = \alpha(1 - \alpha)^j$, $j \ge 0$ | Sí | Pronóstico SES = ARIMA(0,1,1) [[u2:demo-ses]] |

### Respuesta al impulso {#respuesta-impulso}

:::definicion Respuesta al impulso
Es la salida del filtro cuando la entrada es un **impulso unitario**: $x_0 = 1$ y $x_t = 0$ en todos los demás instantes. Como $y_t = \sum_j a_j x_{t-j}$ solo tiene un término distinto de cero ($j = t$), la salida es $y_t = a_t$: **la respuesta al impulso son los pesos del filtro**. Los pesos $\psi_j$ de la Unidad II son exactamente esto para un ARMA [[u2:guia-impulso]].
:::

:::guiado Respuesta al impulso y al escalón de un filtro causal {#guia-impulso3}
| $t$ | Impulso $x_t$ | Respuesta $y_t$ | Escalón $x_t$ | Respuesta $y_t$ |
|---|---|---|---|---|
| −1 | 0 | 0 | 0 | 0 |
| 0 | 1 | 0.5 | 1 | 0.5 |
| 1 | 0 | 0.3 | 1 | 0.8 |
| 2 | 0 | 0.2 | 1 | 1.0 |
| 3 | 0 | 0 | 1 | 1.0 |
| 4 | 0 | 0 | 1 | 1.0 |
---
= y_t = 0.5\,x_t + 0.3\,x_{t-1} + 0.2\,x_{t-2}
> Un filtro causal con tres pesos que suman 1 (un promedio ponderado del presente y los dos periodos anteriores).
= t = 0:\; y_0 = 0.5(1) + 0.3(0) + 0.2(0) = 0.5; \quad t = 1:\; y_1 = 0.3; \quad t = 2:\; y_2 = 0.2
> Con el impulso, la salida reproduce los pesos uno por uno y después vuelve a cero: la respuesta al impulso es $(0.5,\ 0.3,\ 0.2)$.
@ usa c2[2-4]; da c3[2-4]
= \text{escalón}:\; y_0 = 0.5,\quad y_1 = 0.5 + 0.3 = 0.8,\quad y_2 = 0.5 + 0.3 + 0.2 = 1
> La respuesta a un escalón (la entrada pasa de 0 a 1 y se queda) es la suma acumulada de la respuesta al impulso.
@ usa c4[2-6]; da c5[2-6]
= \lim_{t\to\infty} y_t = \sum_j a_j = 1 = A(0)
> A largo plazo el filtro deja pasar un cambio permanente completo: su ganancia en la frecuencia cero es la suma de los pesos.
@ usa c5[4-6]
:::

### Función de transferencia, ganancia y fase {#transferencia}

:::definicion Función de transferencia
$$A(\omega) = \sum_j a_j\,e^{-2\pi i\omega j}$$

Es la transformada de Fourier de la respuesta al impulso (guía oficial: *muestra qué frecuencias pasan o se atenúan*). Es compleja:
- su módulo $\lvert A(\omega)\rvert$ es la **ganancia**: cuánto se multiplica la amplitud de una oscilación de frecuencia $\omega$ (1 = pasa intacta, 0 = se elimina);
- su argumento es el **desplazamiento de fase**: cuánto se corre esa oscilación en el tiempo.
:::

:::intuicion El ecualizador
Un ecualizador de música tiene una perilla por cada banda de frecuencias: bajos, medios, agudos. La ganancia $\lvert A(\omega)\rvert$ es la posición de esas perillas para **todas** las frecuencias a la vez: 1 deja la banda como está, 0 la silencia y 2 la duplica. Diseñar un filtro es decidir cómo quieres esas perillas; la respuesta al impulso es la receta, en el tiempo, que produce ese ajuste.
:::

:::demo Una oscilación entra y sale con la misma frecuencia {#demo-oscilacion-filtro}
:::pasos
= x_t = e^{2\pi i\omega t}
> Una oscilación de frecuencia $\omega$ escrita con Euler (su parte real es $\cos(2\pi\omega t)$) [[euler]].
= y_t = \sum_j a_j e^{2\pi i\omega(t - j)} = \Big(\sum_j a_j e^{-2\pi i\omega j}\Big)e^{2\pi i\omega t} = A(\omega)\,e^{2\pi i\omega t}
> Sacamos de la suma lo que no depende de $j$.
= x_t = \cos(2\pi\omega t) \;\Rightarrow\; y_t = \lvert A(\omega)\rvert\cos\big(2\pi\omega t + \arg A(\omega)\big)
> Tomando la parte real (si los pesos son reales). Un filtro lineal **no crea frecuencias nuevas**: solo cambia la amplitud y la fase de cada una. Por eso se analiza tan bien en el dominio de la frecuencia.
:::
:::

En el filtro del ejemplo anterior: $A(0) = 1$; en $\omega = 1/4$, $A = 0.5 + 0.3e^{-i\pi/2} + 0.2e^{-i\pi} = 0.3 - 0.3i$, ganancia $0.42$ y fase $-\pi/4$ (la oscilación de periodo 4 sale a menos de la mitad y retrasada medio periodo); en $\omega = 1/2$, $A = 0.4$. Es un **pasa bajos** suave.

:::ejemplo El ciclo anual a través de tres filtros
Entra $x_t = 10\cos(2\pi t/12)$, un ciclo anual de amplitud 10 en datos mensuales ($\omega = 1/12$):
- **Media móvil causal de 3**, $y_t = \frac13(x_t + x_{t-1} + x_{t-2})$: $A(1/12) = e^{-i\pi/6}\,\frac{1 + 2\cos(\pi/6)}{3} = 0.911\,e^{-i\pi/6}$. Sale $y_t = 9.11\cos\big(2\pi t/12 - \pi/6\big)$: casi la misma amplitud y **un mes de retraso** ($\pi/6$ es la doceava parte de una vuelta).
- **Media móvil centrada de 3**: la misma ganancia, 0.911, pero $A$ es real: **sin retraso**.
- **Diferencia** $y_t = x_t - x_{t-1}$: $A(1/12) = 1 - e^{-i\pi/6} = 2\sin(\pi/12)\,e^{i(\pi/2 - \pi/12)} = 0.518\,e^{1.309i}$. Sale $y_t = 5.18\cos(2\pi t/12 + 1.309)$: la mitad de la amplitud y **adelantada 2.5 meses** ($1.309/(2\pi/12) = 2.5$). La razón: la diferencia es grande donde $x$ sube más rápido, un cuarto de ciclo (3 meses) antes de su máximo; como compara con el mes anterior, queda medio mes más atrás.
- En los tres casos sale una oscilación de periodo 12: un filtro lineal cambia la amplitud y la fase, nunca la frecuencia.
:::

### El teorema clave: $f_y = \lvert A\rvert^2 f_x$ {#filtro-espectro}

:::demo El espectro de la salida es el de la entrada por la ganancia al cuadrado {#demo-filtro-espectro}
:::pasos
= \gamma_y(k) = \Cov\Big(\sum_j a_j x_{t+k-j},\ \sum_l a_l x_{t-l}\Big) = \sum_j\sum_l a_j a_l\,\gamma_x(k - j + l)
> Covarianza de dos sumas: todos los pares [[u1:cov-prop]].
= f_y(\omega) = \sum_k\sum_j\sum_l a_j a_l\,\gamma_x(k - j + l)\,e^{-2\pi i\omega k}
> Definición de la densidad espectral de $y$.
= e^{-2\pi i\omega k} = e^{-2\pi i\omega m}\,e^{-2\pi i\omega j}\,e^{2\pi i\omega l}, \qquad m = k - j + l
> Reescribimos la exponencial con el nuevo índice $m$ (los exponentes suman lo mismo).
= f_y(\omega) = \Big(\sum_j a_j e^{-2\pi i\omega j}\Big)\Big(\sum_l a_l e^{2\pi i\omega l}\Big)\Big(\sum_m\gamma_x(m)e^{-2\pi i\omega m}\Big) = A(\omega)\,\overline{A(\omega)}\,f_x(\omega)
> La triple suma se factoriza: el segundo paréntesis es el conjugado de $A(\omega)$.
= f_y(\omega) = \lvert A(\omega)\rvert^2 f_x(\omega)
> La **función de transferencia de potencia** $\lvert A(\omega)\rvert^2$ multiplica el espectro frecuencia por frecuencia. Con $x = \varepsilon$ (ruido blanco, $f_x = \sigma^2$) y $A = \theta(e^{-2\pi i\omega})/\phi(e^{-2\pi i\omega})$ sale la fórmula del ARMA [[espectro-arma]].
:::
:::

El teorema da un segundo camino, mucho más corto, hacia los espectros de la sección de densidad espectral:

:::demo El espectro del AR(1), otra vez, con el teorema del filtro {#demo-ar1-filtro}
:::pasos
= (1 - \phi L)\,y_t = \varepsilon_t \;\Rightarrow\; y_t = \sum_{j=0}^{\infty}\phi^j\varepsilon_{t-j}
> El AR(1) estacionario es un filtro lineal del ruido blanco con pesos $a_j = \phi^j$: su forma MA(∞) [[u2:demo-invertir]].
= A(\omega) = \sum_{j=0}^{\infty}\phi^j e^{-2\pi i\omega j} = \frac{1}{1 - \phi\,e^{-2\pi i\omega}}
> Serie geométrica de razón $\phi e^{-2\pi i\omega}$, cuyo módulo es $\lvert\phi\rvert < 1$.
= f_y(\omega) = \lvert A(\omega)\rvert^2\sigma^2 = \frac{\sigma^2}{\lvert 1 - \phi e^{-2\pi i\omega}\rvert^2} = \frac{\sigma^2}{1 + \phi^2 - 2\phi\cos(2\pi\omega)}
> El teorema con $f_\varepsilon = \sigma^2$. Es el resultado de [[demo-espectro-ar1]], pero sin sumar ninguna autocovarianza.
= \phi(L)\,y_t = \theta(L)\,\varepsilon_t \;\Rightarrow\; A(\omega) = \frac{\theta(e^{-2\pi i\omega})}{\phi(e^{-2\pi i\omega})}, \qquad f_y = \sigma^2\lvert A(\omega)\rvert^2
> En general, un ARMA es el filtro $\theta(L)/\phi(L)$ aplicado a un ruido blanco: de ahí sale de un solo golpe la fórmula de [[espectro-arma]].
:::
:::

:::demo Cuánta varianza deja pasar un filtro aplicado a ruido blanco {#demo-varianza-filtro}
:::pasos
= y_t = \sum_j a_j\varepsilon_{t-j} \;\Rightarrow\; \Var(y_t) = \sigma^2\sum_j a_j^2
> En el tiempo: los choques son independientes, así que sus varianzas se suman con los pesos al cuadrado.
= \Var(y_t) = \int_{-1/2}^{1/2}f_y(\omega)\,d\omega = \sigma^2\int_{-1/2}^{1/2}\lvert A(\omega)\rvert^2\,d\omega
> En frecuencia: el área bajo $f_y = \lvert A\rvert^2\sigma^2$.
= \int_{-1/2}^{1/2}\lvert A(\omega)\rvert^2\,d\omega = \sum_j\sum_l a_j a_l\int_{-1/2}^{1/2}e^{-2\pi i\omega(j - l)}\,d\omega = \sum_j a_j^2
> La integral vale 1 si $j = l$ y 0 si $j \ne l$: la ortogonalidad, ahora en el continuo. Es la identidad de Parseval para los pesos de un filtro.
= \text{media de 3}: \tfrac{3}{9} = \tfrac13, \qquad 1 - L: 1^2 + 1^2 = 2, \qquad \text{SES}: \sum_{j\ge0}\alpha^2(1 - \alpha)^{2j} = \frac{\alpha}{2 - \alpha}
> Tres aplicaciones. Con $\alpha = 0.3$, el suavizamiento exponencial deja pasar el 18% de la varianza de un ruido blanco; la diferencia la duplica.
:::
:::

:::interactivo w3-filtro-espectro | La salida de un filtro en frecuencia {#w-filtro-espectro}
Elige el espectro de entrada y un filtro. La salida es el producto frecuencia por frecuencia.
@@@
- **Arriba**: tres curvas: el espectro de entrada $f_x$, la ganancia al cuadrado $\lvert A(\omega)\rvert^2$ y el espectro de salida $f_y = \lvert A\rvert^2 f_x$.
- **Abajo**: una simulación de la entrada y de la salida filtrada, con el periodograma suavizado de la salida sobre la curva teórica.
- Prueba la diferencia con ruido blanco a la entrada: la salida es «azul», con 4 veces la varianza en $\omega = 1/2$ y nada en $\omega = 0$.
- **Vista extra**: la varianza de entrada y de salida (áreas bajo las curvas).
:::

### Medias móviles: filtros pasa bajos {#mm-filtro}

:::guiado La ganancia de la media móvil centrada de 3 {#guia-ganancia-mm3}
| $\omega$ | Periodo | $\cos(2\pi\omega)$ | $A(\omega) = \frac{1 + 2\cos(2\pi\omega)}{3}$ | Ganancia $\lvert A\rvert$ |
|---|---|---|---|---|
| 0 | ∞ | 1 | 1 | 1 |
| 1/12 | 12 | 0.866 | 0.911 | 0.911 |
| 1/6 | 6 | 0.5 | 0.667 | 0.667 |
| 1/4 | 4 | 0 | 0.333 | 0.333 |
| 1/3 | 3 | −0.5 | 0 | 0 |
| 1/2 | 2 | −1 | −0.333 | 0.333 |
---
= A(\omega) = \tfrac13\big(e^{2\pi i\omega} + 1 + e^{-2\pi i\omega}\big) = \tfrac13\big(1 + 2\cos(2\pi\omega)\big)
> Pesos $1/3$ en $j = -1, 0, 1$. Por ser simétrico, el seno se cancela y $A(\omega)$ es **real**: el filtro centrado no desfasa.
= \omega = 0:\; A = 1
> Las oscilaciones muy lentas (la tendencia) pasan completas.
@ usa c3[1]; da c4[1] c5[1]
= \omega = 1/3:\; A = \tfrac13(1 + 2(-0.5)) = 0
> La oscilación de periodo 3 se **elimina por completo**: tres valores consecutivos de una oscilación de periodo 3 siempre suman cero.
@ usa c3[5]; da c4[5] c5[5]
= \omega = 1/2:\; A = \tfrac13(1 - 2) = -\tfrac13
> La oscilación más rápida no se elimina: sale con un tercio de su amplitud y **con el signo invertido** (ganancia negativa = desfase de $\pi$). Un pasa bajos imperfecto.
@ usa c3[6]; da c4[6] c5[6]
:::

Con esa ganancia y el teorema $f_y = \lvert A\rvert^2 f_x$ se calcula qué le hace la media móvil a una serie concreta. Usemos el AR(1) con $\phi = 0.6$ de [[guia-espectro-ar1]]:

:::guiado Un AR(1) a través de la media móvil centrada de 3 {#guia-salida-filtro}
| $\omega$ | $A(\omega)$ | $\lvert A(\omega)\rvert^2$ | $f_x(\omega)$ del AR(1) | $f_y = \lvert A\rvert^2 f_x$ |
|---|---|---|---|---|
| 0 | 1 | 1 | 6.25 | 6.25 |
| 1/12 | 0.911 | 0.829 | 3.118 | 2.586 |
| 1/6 | 0.667 | 0.444 | 1.316 | 0.585 |
| 1/4 | 0.333 | 0.111 | 0.735 | 0.082 |
| 1/3 | 0 | 0 | 0.510 | 0 |
| 1/2 | −0.333 | 0.111 | 0.391 | 0.043 |
---
= f_x(\omega) = \frac{1}{1.36 - 1.2\cos(2\pi\omega)}, \qquad f_x(1/12) = \frac{1}{1.36 - 1.2(0.866)} = 3.118
> El espectro de entrada: rojo, con casi toda la potencia en frecuencias bajas.
@ usa c1[2]; da c4[2]
= \lvert A(\omega)\rvert^2 = \Big(\frac{1 + 2\cos(2\pi\omega)}{3}\Big)^2:\quad 1,\ 0.829,\ 0.444,\ 0.111,\ 0,\ 0.111
> La ganancia de la tabla anterior, al cuadrado: el filtro actúa sobre la **potencia**.
@ usa c2[1-6]; da c3[1-6]
= f_y(1/12) = 0.829 \times 3.118 = 2.586, \qquad f_y(1/4) = 0.111 \times 0.735 = 0.082
> Frecuencia por frecuencia: lo lento casi no cambia; lo de periodo 4 se reduce a la novena parte.
@ usa c3[2] c4[2] c3[4] c4[4]; da c5[2] c5[4]
= f_y(1/3) = 0
> La salida no tiene **ninguna** oscilación de periodo 3: el filtro las borró.
@ usa c3[5] c4[5]; da c5[5]
= \Var(y) = \frac{3\gamma_x(0) + 4\gamma_x(1) + 2\gamma_x(2)}{9} = \frac{3(1.5625) + 4(0.9375) + 2(0.5625)}{9} = 1.0625
> La varianza de $y_t = \frac13(x_{t-1} + x_t + x_{t+1})$ en el dominio del tiempo, con $\gamma_x(k) = 0.6^k/0.64$. En frecuencia es el área bajo $f_y$, y da lo mismo: $2\int_0^{1/2}\lvert A\rvert^2 f_x\,d\omega = 1.0625$.
= \frac{1.0625}{1.5625} = 68\%
> El filtro conserva dos tercios de la varianza: casi toda la que estaba en frecuencias bajas, que es donde el AR(1) tenía su potencia. Si la entrada fuera ruido blanco, conservaría solo $\sum a_j^2 = 1/3$.
@ usa c5[1-6]
:::

La media móvil $2\times 12$ de la descomposición clásica es mucho mejor para su tarea: su ganancia vale **0 exactamente en $1/12, 2/12, \dots, 6/12$**, así que elimina el patrón estacional completo y deja pasar las frecuencias muy bajas (0.90 en periodos de 4 años, 0.63 en periodos de 2 años). Por eso extrae la tendencia sin estacionalidad [[u1:mm-estacional]].

:::duda ¿Por qué la media móvil causal retrasa la serie y la centrada no?
La media de los últimos $k$ valores ($a_j = 1/k$, $j = 0, \dots, k - 1$) tiene $A(\omega) = e^{-\pi i\omega(k - 1)}\frac{\sin(\pi\omega k)}{k\sin(\pi\omega)}$: la fase $-\pi\omega(k - 1)$ es una recta, que equivale a un **retraso de $(k - 1)/2$ periodos** en todas las frecuencias ([[demo-retardo]]). La centrada usa tantos datos futuros como pasados y su fase es 0. El precio: la centrada no se puede calcular en los últimos $(k-1)/2$ periodos.
:::

### Diferencias: filtros pasa altos {#diferencia-filtro}

:::demo La ganancia de la diferencia {#demo-ganancia-diferencia}
:::pasos
= y_t = x_t - x_{t-1} \;\Rightarrow\; A(\omega) = 1 - e^{-2\pi i\omega}
> Pesos $a_0 = 1$, $a_1 = -1$.
= \lvert A(\omega)\rvert^2 = (1 - \cos 2\pi\omega)^2 + \sin^2 2\pi\omega = 2 - 2\cos(2\pi\omega) = 4\sin^2(\pi\omega)
> Parte real al cuadrado más parte imaginaria al cuadrado; luego $1 - \cos 2a = 2\sin^2 a$.
= \lvert A(0)\rvert^2 = 0, \qquad \lvert A(1/2)\rvert^2 = 4
> Elimina la frecuencia cero (la tendencia) y **cuadruplica** la potencia de las oscilaciones más rápidas: es un **pasa altos**.
= (1 - L^{12}) \;\Rightarrow\; \lvert A(\omega)\rvert^2 = 4\sin^2(12\pi\omega) = 0 \text{ en } \omega = 0, \tfrac{1}{12}, \tfrac{2}{12}, \dots, \tfrac{6}{12}
> La diferencia estacional se anula en la frecuencia cero **y** en todas las frecuencias estacionales: quita la tendencia y el patrón estacional a la vez. Eso es lo que vimos en el periodograma de $\Delta\Delta_{12}\ln y_t$ [[ap-transformaciones]].
:::
:::

| $\omega$ | 0 | 1/12 | 1/6 | 1/4 | 1/2 |
|---|---|---|---|---|---|
| $\lvert 1 - e^{-2\pi i\omega}\rvert^2$ | 0 | 0.268 | 1 | 2 | 4 |

Esta tabla explica la **sobrediferenciación** de la Unidad II [[u2:sobrediferenciar]]: si diferencias un ruido blanco, su espectro plano $\sigma^2$ se multiplica por $4\sin^2(\pi\omega)$; el área (la varianza) se **duplica** y la potencia se carga a las frecuencias altas, que en la ACF se ve como $\rho(1) = -0.5$.

### El suavizamiento exponencial: pasa bajos con retraso {#ses-filtro}

Con pesos $a_j = \alpha(1 - \alpha)^j$ (serie geométrica), $A(\omega) = \frac{\alpha}{1 - (1 - \alpha)e^{-2\pi i\omega}}$. Con $\alpha = 0.3$: ganancia 1 en $\omega = 0$, $0.25$ en $\omega = 1/4$ y $0.18$ en $\omega = 1/2$. Es un pasa bajos, pero **causal**: su fase es negativa y retrasa las oscilaciones lentas unos $(1 - \alpha)/\alpha = 2.3$ periodos. Por eso el pronóstico SES siempre «llega tarde» a los cambios de nivel.

:::interactivo w3-respuesta | Diseña un filtro y mira su respuesta {#w-respuesta}
Elige un filtro clásico o escribe tus propios pesos. Mira su respuesta al impulso, su ganancia, su fase y lo que le hace a una serie.
@@@
- **Arriba, izquierda**: la respuesta al impulso (los pesos $a_j$).
- **Arriba, derecha**: la ganancia $\lvert A(\omega)\rvert$ (y, si quieres, la fase). Las líneas punteadas marcan $k/12$.
- **Abajo**: una serie de prueba con tendencia, estacionalidad de 12 y ruido (o AirPassengers en logaritmos), y la salida del filtro.
- La media $2\times 12$ quita la estacionalidad y deja la tendencia; $1 - L^{12}$ quita ambas; la media causal retrasa la tendencia.
- **Vista extra**: la ganancia en las frecuencias clave y la suma de los pesos ($A(0)$).
:::

### Comprobarlo en Python {#filtros-lineales-python}

`scipy.signal.freqz(b, a, worN, fs=1)` evalúa $A(\omega)$ para un filtro con pesos `b` (y parte recursiva `a`, que aquí es 1). Las ganancias salen idénticas a las de las tablas:

```python
pesos = {"media móvil de 3": np.ones(3) / 3,
         "diferencia 1 − L": np.array([1.0, -1.0]),
         "diferencia estacional 1 − L¹²": np.r_[1.0, np.zeros(11), -1.0],
         "media móvil 2×12": np.r_[0.5, np.ones(11), 0.5] / 12}
w_f = np.array([0, 1 / 24, 1 / 12, 1 / 6, 1 / 4, 1 / 3, 1 / 2])
print("ω =", np.round(w_f, 4))
for nombre, b in pesos.items():
    _, h = signal.freqz(b, 1, worN=w_f, fs=1)                     # A(ω) en las frecuencias pedidas
    print(f"{nombre:30s} |A(ω)| = {np.round(np.abs(h), 3)}")

# La varianza de la salida con ruido blanco a la entrada: σ² Σ a_j²
e = np.random.default_rng(3).normal(size=100_000)
for nombre in ["media móvil de 3", "diferencia 1 − L"]:
    b = pesos[nombre]
    y = signal.lfilter(b, 1, e)
    print(f"{nombre:30s} varianza de la salida = {y.var():.3f} | teórica σ²Σa² = {np.sum(b ** 2):.3f}")
```

`freqz` usa los pesos como si fueran causales ($j = 0, 1, 2$); para la media centrada eso solo cambia la fase, no la ganancia. La varianza de la salida confirma el teorema: la media de 3 deja un tercio de la varianza de un ruido blanco y la diferencia la duplica.

:::duda ¿La ganancia puede ser mayor que 1?
Sí. La diferencia tiene ganancia 2 en $\omega = 1/2$ y $\sqrt2$ en $\omega = 1/4$: esas oscilaciones salen **más grandes** que como entraron. Por eso diferenciar una serie que no lo necesita aumenta su varianza (sobrediferenciación). En un filtro de suavizamiento bien diseñado la ganancia no pasa de 1; cuando la ganancia es negativa, como en la media móvil simple, lo que cambia es el **signo** de la oscilación, no su tamaño.
:::

:::cuidado Ganancias negativas y efectos de borde
- Una media móvil simple tiene ganancia **negativa** en algunas frecuencias altas: invierte el signo de esas oscilaciones (puede crear ciclos falsos pequeños). Las medias ponderadas o los filtros de diseño evitan esto.
- Un filtro centrado de $2M + 1$ pesos no se puede calcular en los primeros y últimos $M$ datos; la Unidad I los dejaba como `NaN` [[u1:mm-centrada]].
:::

:::resumen Lo que debes llevarte de los filtros lineales
- $y_t = \sum_j a_j x_{t-j}$; la respuesta al impulso son los pesos $a_j$ y su suma es $A(0)$, la ganancia de largo plazo.
- $A(\omega) = \sum_j a_j e^{-2\pi i\omega j}$: ganancia $\lvert A\rvert$ y fase $\arg A$; una oscilación sale con la misma frecuencia.
- Teorema: $f_y(\omega) = \lvert A(\omega)\rvert^2 f_x(\omega)$; de ahí sale el espectro del ARMA.
- Media móvil de 3: $A = (1 + 2\cos 2\pi\omega)/3$, cero en $\omega = 1/3$. La $2\times 12$ se anula en $k/12$.
- Diferencia: $\lvert A\rvert^2 = 4\sin^2(\pi\omega)$, pasa altos; $1 - L^{12}$ se anula en 0 y en $k/12$.
:::
