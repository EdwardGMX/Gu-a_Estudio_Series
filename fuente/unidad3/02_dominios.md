## 🔀 Dominio del tiempo y dominio de la frecuencia {#dominios}
@mapa Dos lenguajes para la misma serie: valores y rezagos contra oscilaciones y frecuencias. Una serie como suma de oscilaciones, cómo se reparte la varianza entre ellas y el «diccionario» que traduce la ACF al espectro.

### Dos lenguajes para la misma serie {#dos-lenguajes}

La guía oficial define los dos enfoques así:

:::definicion Dominio del tiempo y dominio de la frecuencia
- **Dominio del tiempo**: analiza valores, rezagos, autocorrelaciones y evolución temporal. Pregunta: *¿cuánto se parece el valor de hoy al de hace $k$ periodos?* Herramientas: la gráfica de la serie, la ACF, la PACF, los modelos ARIMA.
- **Dominio de la frecuencia**: analiza qué frecuencias o periodicidades dominan la variabilidad. Pregunta: *¿qué parte de la varianza viene de oscilaciones lentas, cuál de oscilaciones rápidas y hay alguna frecuencia que destaque?* Herramientas: el periodograma, la densidad espectral, la coherencia, los filtros.

El análisis espectral **complementa** la ACF porque transforma la dependencia temporal en componentes de frecuencia. No agrega información nueva: la reorganiza.
:::

| Pregunta | Dominio que la responde mejor |
|---|---|
| ¿Cuánto influye el valor de ayer en el de hoy? | Tiempo (ACF, PACF, AR) |
| ¿Qué pronóstico doy para el próximo mes? | Tiempo (ARIMA) |
| ¿Hay un ciclo escondido debajo del ruido? ¿De qué periodo? | Frecuencia (periodograma) |
| ¿Hay varios ciclos superpuestos (anual y de 4 años)? | Frecuencia |
| ¿Dos series comparten el ciclo económico, aunque no el ruido de corto plazo? | Frecuencia (coherencia) |
| ¿Qué hace exactamente una media móvil o una diferencia a la serie? | Frecuencia (ganancia del filtro) |

### Una serie como suma de oscilaciones {#suma-oscilaciones}

La idea central de la unidad: una serie estacionaria se puede pensar como una **suma de oscilaciones** de distintas frecuencias, cada una con una amplitud al azar. Empecemos con un número finito de ellas.

:::definicion Proceso con $q$ componentes periódicos
$$x_t = \sum_{k=1}^{q}\big[\,U_{k1}\cos(2\pi\omega_k t) + U_{k2}\sin(2\pi\omega_k t)\,\big]$$

donde los coeficientes $U_{k1}, U_{k2}$ son variables aleatorias no correlacionadas, con media 0 y varianza $\sigma_k^2$ (la misma para el coseno y el seno de cada frecuencia).
:::

:::demo La varianza se reparte por frecuencias {#demo-varianza-componentes}
:::pasos
= \E[x_t] = \sum_{k}\big[\E(U_{k1})\cos(2\pi\omega_k t) + \E(U_{k2})\sin(2\pi\omega_k t)\big] = 0
> Los cosenos y senos son números fijos; lo aleatorio son los coeficientes, que tienen media 0.
= \E[x_{t+h}\,x_t] = \sum_{k}\sigma_k^2\big[\cos(2\pi\omega_k(t + h))\cos(2\pi\omega_k t) + \sin(2\pi\omega_k(t + h))\sin(2\pi\omega_k t)\big]
> Al multiplicar las dos sumas, los productos cruzados entre coeficientes distintos tienen esperanza 0 (no están correlacionados); solo quedan $\E(U_{k1}^2) = \E(U_{k2}^2) = \sigma_k^2$.
= \cos a\cos b + \sin a\sin b = \cos(a - b)
> Identidad del coseno de una diferencia, con $a - b = 2\pi\omega_k h$.
= \gamma(h) = \sum_{k=1}^{q}\sigma_k^2\cos(2\pi\omega_k h)
> La autocovarianza no depende de $t$: el proceso es estacionario. Es una suma de cosenos, uno por frecuencia.
= \gamma(0) = \Var(x_t) = \sum_{k=1}^{q}\sigma_k^2
> Con $h = 0$ todos los cosenos valen 1: **la varianza total es la suma de las varianzas de cada frecuencia**. Esta es la idea que la densidad espectral generaliza a una infinidad de frecuencias.
:::
:::

El ejemplo clásico de Shumway y Stoffer suma tres oscilaciones con $n = 100$:

$$x_t = \underbrace{2\cos(2\pi t\tfrac{6}{100}) + 3\sin(2\pi t\tfrac{6}{100})}_{\text{lenta}} + \underbrace{4\cos(2\pi t\tfrac{10}{100}) + 5\sin(2\pi t\tfrac{10}{100})}_{\text{media}} + \underbrace{6\cos(2\pi t\tfrac{40}{100}) + 7\sin(2\pi t\tfrac{40}{100})}_{\text{rápida}}$$

:::guiado ¿Cuánta varianza aporta cada oscilación? {#guia-tres-componentes}
| Componente | $\omega$ | Periodo | $\beta_1$ | $\beta_2$ | $A^2 = \beta_1^2 + \beta_2^2$ | Varianza $A^2/2$ | % del total |
|---|---|---|---|---|---|---|---|
| Lenta | 0.06 | 16.7 | 2 | 3 | 13 | 6.5 | 9.4 |
| Media | 0.10 | 10 | 4 | 5 | 41 | 20.5 | 29.5 |
| Rápida | 0.40 | 2.5 | 6 | 7 | 85 | 42.5 | 61.2 |
| Total | | | | | 139 | 69.5 | 100 |
---
= \Per = 1/\omega:\quad 1/0.06 = 16.7,\quad 1/0.10 = 10,\quad 1/0.40 = 2.5
> El periodo de cada componente. La rápida sube y baja en 2.5 observaciones.
@ usa c2[1-3]; da c3[1-3]
= A^2 = 2^2 + 3^2 = 13,\quad 4^2 + 5^2 = 41,\quad 6^2 + 7^2 = 85
> El cuadrado de la amplitud de cada oscilación [[demo-fase-regresion]].
@ usa c4[1-3] c5[1-3]; da c6[1-3]
= \text{varianza} = A^2/2:\quad 6.5,\quad 20.5,\quad 42.5
> El promedio de $\cos^2$ (o de $\sin^2$) sobre ciclos completos es 1/2; por eso una oscilación de amplitud $A$ tiene varianza $A^2/2$.
@ usa c6[1-3]; da c7[1-3]
= \Var(x_t) = 6.5 + 20.5 + 42.5 = 69.5
> Las varianzas se suman porque las oscilaciones son ortogonales [[demo-ortogonalidad]].
@ usa c7[1-3]; da c7[4]
= 6.5/69.5 = 9.4\%,\quad 20.5/69.5 = 29.5\%,\quad 42.5/69.5 = 61.2\%
> La oscilación rápida aporta casi dos tercios de la varianza. Esto es exactamente lo que mide un espectro: **qué fracción de la varianza vive en cada frecuencia**.
@ usa c7[1-4]; da c8[1-3]
:::

En Python, la transformada de Fourier recupera los tres valores de $A^2$ sin que le digamos las frecuencias. El **periodograma escalado** $P(\omega_j) = (4/n^2)\,\lvert\text{FFT}\rvert^2$ (que en [[periodograma-def]] veremos que es $\tfrac{4}{n}I(\omega_j)$) vale exactamente $\beta_1^2 + \beta_2^2$ en cada frecuencia de Fourier:

```python
n = 100
t = np.arange(1, n + 1)
x = (2 * np.cos(2 * np.pi * t * 6 / 100) + 3 * np.sin(2 * np.pi * t * 6 / 100)
     + 4 * np.cos(2 * np.pi * t * 10 / 100) + 5 * np.sin(2 * np.pi * t * 10 / 100)
     + 6 * np.cos(2 * np.pi * t * 40 / 100) + 7 * np.sin(2 * np.pi * t * 40 / 100))
P = 4 / n**2 * np.abs(np.fft.fft(x)) ** 2       # periodograma escalado: β1² + β2² en cada ω_j
frecuencias = np.arange(n) / n
mayores = np.argsort(P[: n // 2 + 1])[::-1][:3]
for j in sorted(mayores):
    print(f"ω = {frecuencias[j]:.2f}  periodo = {1 / frecuencias[j]:5.1f}  P = {P[j]:.1f}")
print("varianza de x:", round(x.var(), 2), "| suma de A²/2:", (13 + 41 + 85) / 2)
```

:::interactivo w3-mezcla | Arma una serie con tres oscilaciones {#w-mezcla}
Elige la frecuencia y la amplitud de tres oscilaciones y agrega ruido. El periodograma encuentra las tres frecuencias aunque la serie se vea desordenada.
@@@
- **Arriba**: la suma (la serie que observarías) y, en tenue, las tres oscilaciones por separado.
- **Abajo**: el periodograma escalado $P(\omega_j)$. Cada oscilación produce una barra en su frecuencia, de altura $A^2$; el ruido reparte su varianza en todas las frecuencias por igual.
- Si eliges una frecuencia que no es de Fourier ($j/n$ con $j$ entero), la barra se reparte entre vecinas: es la **fuga espectral** [[fuga]].
- **Vista extra**: la tabla con la varianza de cada componente y la que estima el periodograma.
:::

### La misma memoria en dos idiomas {#misma-memoria}

La ACF y el espectro son dos formas de escribir la misma información (en la siguiente sección veremos la fórmula exacta que las une). Con práctica se traduce de una a la otra a simple vista:

| Lo que ves en la ACF | Lo que ves en el espectro | Ejemplo |
|---|---|---|
| Cero en todos los rezagos | Plano: todas las frecuencias por igual | Ruido blanco |
| Positiva y decae despacio | Concentrado en frecuencias **bajas** («rojo») | AR(1) con $\phi > 0$, series con tendencia |
| Alterna de signo | Concentrado en frecuencias **altas** («azul») | AR(1) con $\phi < 0$, sobrediferenciación |
| Oscila y se apaga | **Pico** en la frecuencia del ciclo | AR(2) con raíces complejas |
| Picos en $12, 24, 36, \dots$ | Picos en $1/12, 2/12, \dots, 6/12$ | Estacionalidad mensual |
| Un solo valor negativo en $k = 1$ | Hueco en frecuencias bajas | MA(1) con $\theta < 0$ |

:::intuicion El prisma
Un prisma separa la luz blanca en colores; cada color es una frecuencia. La luz blanca tiene **todos** los colores con la misma intensidad: por eso al ruido con espectro plano se le llama **ruido blanco**. Una serie con más potencia en frecuencias bajas es «roja» (como la luz roja, de frecuencia baja), y una con más potencia en las altas es «azul». El periodograma es nuestro prisma.
:::

:::interactivo w3-dos-dominios | El mismo proceso en el tiempo y en la frecuencia {#w-dos-dominios}
Elige un proceso y sus parámetros. Las tres gráficas muestran lo mismo en tres lenguajes: la serie, la ACF y la densidad espectral.
@@@
- **Arriba**: una simulación del proceso.
- **Abajo, izquierda**: la ACF teórica (barras) y la muestral (puntos).
- **Abajo, derecha**: la densidad espectral teórica (curva) y el periodograma de la simulación (puntos, muy ruidoso: lo arreglaremos en [[no-parametrico]]).
- Fíjate en la traducción: ACF que decae despacio ↔ espectro rojo; ACF alternada ↔ espectro azul; ACF que oscila ↔ pico.
- **Vista extra**: el «diccionario» con la traducción del proceso que elegiste.
:::

### ¿Qué ve mejor cada dominio? {#que-ve-cada}

| Mejor en el tiempo | Mejor en la frecuencia |
|---|---|
| Pronosticar (ARIMA, SARIMAX) | Encontrar periodicidades escondidas en ruido |
| Memoria de corto plazo (1 o 2 rezagos) | Varios ciclos superpuestos de periodos distintos |
| Rupturas, atípicos, intervenciones | Ciclos de duración variable (jorobas anchas) |
| Relaciones con retardos cortos y conocidos | Relaciones entre series que solo existen en ciertas frecuencias |
| | Entender y diseñar filtros |

:::duda Si la ACF y el espectro tienen la misma información, ¿para qué el espectro?
Por la misma razón por la que a veces conviene ver una canción como partitura y a veces como sonido. Con tres oscilaciones superpuestas, la ACF es una mezcla de tres cosenos difícil de descifrar; el espectro muestra tres picos separados. Y en el sentido contrario: un AR(1) se ve clarísimo en la PACF (un solo pico) y en el espectro es solo una curva que baja. Cada dominio simplifica distintas estructuras.
:::

:::examen Así te lo pueden preguntar: «¿En qué se diferencian el dominio del tiempo y el de la frecuencia?»
«En el **dominio del tiempo** se analizan los valores de la serie, sus rezagos y su autocorrelación: cuánto depende el valor actual de los anteriores. En el **dominio de la frecuencia** se analiza cómo se reparte la varianza entre oscilaciones de distintas frecuencias: qué periodicidades o ciclos dominan. Ambos contienen la misma información para una serie estacionaria (la densidad espectral es la transformada de Fourier de la autocovarianza), pero el espectral facilita detectar ciclos superpuestos o escondidos en ruido, comparar series por frecuencias y diseñar filtros, mientras que el temporal es el natural para modelar y pronosticar.»
:::

:::resumen Lo que debes llevarte de los dos dominios
- Tiempo: valores, rezagos y ACF. Frecuencia: qué oscilaciones aportan la varianza.
- Una suma de oscilaciones no correlacionadas tiene $\gamma(h) = \sum\sigma_k^2\cos(2\pi\omega_k h)$ y varianza $\sum\sigma_k^2$: **la varianza se reparte por frecuencias**.
- Una oscilación de amplitud $A$ aporta varianza $A^2/2$; el periodograma escalado la recupera en su frecuencia.
- Diccionario: ACF que decae ↔ espectro rojo; ACF alternada ↔ azul; ACF que oscila ↔ pico; ruido blanco ↔ plano.
:::
