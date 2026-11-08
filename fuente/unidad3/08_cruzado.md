## 🔗 Espectro cruzado, fase y coherencia {#cruzado}
@mapa Dos series a la vez: la covarianza cruzada, el espectro cruzado y sus tres lecturas (magnitud, fase y coherencia), por qué un retardo se ve como una fase lineal, por qué hay que suavizar, cómo decidir si una coherencia es significativa y un caso real con el ciclo económico.

### De la covarianza cruzada al espectro cruzado {#cov-cruzada}

Con dos series estacionarias $x_t$ y $y_t$, la pregunta deja de ser «¿qué frecuencias tiene cada una?» y pasa a ser **«¿en qué frecuencias se mueven juntas, y con qué desfase?»**. La guía oficial lo resume: *la densidad espectral cruzada describe cómo dos series se relacionan en el dominio de la frecuencia*.

:::definicion Covarianza cruzada y espectro cruzado
$$\gamma_{yx}(k) = \Cov(y_{t+k},\ x_t), \qquad f_{yx}(\omega) = \sum_{k=-\infty}^{\infty}\gamma_{yx}(k)\,e^{-2\pi i\omega k}$$

A diferencia de la autocovarianza, $\gamma_{yx}$ **no es simétrica**: $\gamma_{yx}(3)$ (cómo responde $y$ tres periodos después de $x$) puede ser grande y $\gamma_{yx}(-3)$ pequeña. Por eso el espectro cruzado es **complejo**:

$$f_{yx}(\omega) = c_{yx}(\omega) - i\,q_{yx}(\omega)$$

con el **coespectro** $c_{yx}$ (la parte de la relación que ocurre en fase) y el **espectro de cuadratura** $q_{yx}$ (la parte desfasada un cuarto de ciclo).
:::

### Magnitud, fase y coherencia {#mag-fase-coh}

Un número complejo se describe con su módulo y su argumento [[u2:complejos]]. Del espectro cruzado salen tres lecturas, las mismas que define la guía oficial:

:::definicion Las tres lecturas del espectro cruzado
- **Magnitud**: $\lvert f_{yx}(\omega)\rvert$, la fuerza de la relación lineal entre las dos series en la frecuencia $\omega$.
- **Fase**: $\varphi_{yx}(\omega) = \arg f_{yx}(\omega) = \operatorname{atan2}\big(-q_{yx}(\omega),\ c_{yx}(\omega)\big)$, el desfase o retardo entre los componentes de esa frecuencia.
- **Coherencia**: la magnitud normalizada, como una correlación al cuadrado en cada frecuencia:

$$\rho^2_{yx}(\omega) = \frac{\lvert f_{yx}(\omega)\rvert^2}{f_x(\omega)\,f_y(\omega)}, \qquad 0 \le \rho^2_{yx}(\omega) \le 1$$

Valores altos sugieren una relación fuerte en esa banda.
:::

:::intuicion Dos músicos que tocan la misma pieza
Imagina a dos músicos que tocan juntos. La **coherencia** en una nota dice qué tan parecido suena esa nota en los dos (1: idéntica; 0: no tienen nada que ver). La **fase** dice si uno toca esa nota un poco después que el otro. Si uno va siempre medio segundo atrás, el desfase en radianes es mayor en las notas agudas (más rápidas) que en las graves, porque medio segundo es una fracción mayor de su ciclo: por eso un retardo constante produce una fase que crece en línea recta con la frecuencia.
:::

:::demo Un retardo se ve como una fase que crece en línea recta {#demo-retardo}
:::pasos
= y_t = \beta\,x_{t-D} + v_t, \qquad v_t \text{ independiente de } x
> $y$ copia a $x$ con $D$ periodos de retraso, multiplicada por $\beta > 0$, más un ruido propio.
= \gamma_{yx}(k) = \Cov(\beta x_{t+k-D} + v_{t+k},\ x_t) = \beta\,\gamma_x(k - D)
> El ruido no se correlaciona con $x$. La covarianza cruzada es la autocovarianza de $x$ **desplazada** $D$ lugares.
= f_{yx}(\omega) = \sum_k\beta\,\gamma_x(k - D)\,e^{-2\pi i\omega k} = \beta\,e^{-2\pi i\omega D}\sum_m\gamma_x(m)\,e^{-2\pi i\omega m}
> Cambio de índice $m = k - D$: sale el factor $e^{-2\pi i\omega D}$.
= f_{yx}(\omega) = \beta\,e^{-2\pi i\omega D}\,f_x(\omega) \;\Rightarrow\; \lvert f_{yx}\rvert = \beta f_x, \qquad \varphi_{yx}(\omega) = -2\pi\omega D
> La fase es una **recta** en $\omega$ con pendiente $-2\pi D$: el retardo se lee como $D = -\varphi/(2\pi\omega)$. Si $\beta < 0$ se suma $\pi$ (las series se mueven al revés).
= f_y = \beta^2 f_x + f_v \;\Rightarrow\; \rho^2_{yx}(\omega) = \frac{\beta^2 f_x^2}{f_x(\beta^2 f_x + f_v)} = \frac{\beta^2 f_x(\omega)}{\beta^2 f_x(\omega) + f_v(\omega)}
> La coherencia es una razón **señal / (señal + ruido)** en cada frecuencia: alta donde la parte que viene de $x$ domina al ruido propio de $y$.
:::
:::

:::demo La coherencia es un $R^2$ por frecuencia {#demo-coh-r2}
:::pasos
= y_t = \sum_j a_j x_{t-j} + e_t, \qquad A(\omega) = \sum_j a_j e^{-2\pi i\omega j}
> Explicamos $y$ con un filtro lineal de $x$ (cualquier combinación de rezagos y adelantos) más un error no correlacionado con $x$.
= A(\omega) = \frac{f_{yx}(\omega)}{f_x(\omega)}
> El mejor filtro, frecuencia por frecuencia, es la «regresión» del espectro cruzado sobre el de $x$ (como $\beta = \Cov/\Var$).
= f_e(\omega) = f_y(\omega) - \frac{\lvert f_{yx}(\omega)\rvert^2}{f_x(\omega)} = f_y(\omega)\big[1 - \rho^2_{yx}(\omega)\big]
> El espectro del error: lo que el filtro no explica.
= \rho^2_{yx}(\omega) = 1 - \frac{f_e(\omega)}{f_y(\omega)}
> La coherencia es la **fracción de la varianza de $y$ en la frecuencia $\omega$ que se explica linealmente con $x$**: un $R^2$ para cada frecuencia.
:::
:::

:::demo Filtrar cada serie no cambia la coherencia {#demo-coh-invariante}
:::pasos
= \tilde x_t = \sum_j a_j x_{t-j}, \qquad \tilde y_t = \sum_j b_j y_{t-j}
> Aplicamos un filtro distinto a cada serie (por ejemplo, diferenciamos una y suavizamos la otra).
= f_{\tilde x} = \lvert A\rvert^2 f_x, \qquad f_{\tilde y} = \lvert B\rvert^2 f_y, \qquad f_{\tilde y\tilde x} = B\,\overline{A}\,f_{yx}
> El teorema del filtro [[filtro-espectro]] y su versión cruzada, que se demuestra igual con dos filtros.
= \rho^2_{\tilde y\tilde x} = \frac{\lvert B\rvert^2\lvert A\rvert^2\lvert f_{yx}\rvert^2}{\lvert A\rvert^2 f_x\,\lvert B\rvert^2 f_y} = \rho^2_{yx}
> Las ganancias se cancelan en toda frecuencia donde no valen cero. La **fase** sí cambia: se le suma $\arg B - \arg A$.
= \text{la correlación cruzada, en cambio, sí cambia}
> En el dominio del tiempo, filtrar (por ejemplo, preblanquear) cambia por completo la correlación cruzada. La coherencia compara las dos series frecuencia por frecuencia, así que no le importa cómo se repartió la potencia dentro de cada una.
:::
:::

:::guiado Magnitud, fase, coherencia y retardo a mano {#guia-coherencia}
| Cantidad en $\omega = 0.1$ | Valor |
|---|---|
| $f_x(\omega)$ | 4 |
| $f_y(\omega)$ | 5 |
| $c_{yx}(\omega)$ | 2.4 |
| $q_{yx}(\omega)$ | 3.2 |
| Magnitud $\lvert f_{yx}\rvert$ | 4 |
| Coherencia | 0.8 |
| Fase (radianes) | −0.927 |
| Retardo (periodos) | 1.48 |
---
= f_{yx} = c_{yx} - i\,q_{yx} = 2.4 - 3.2i
> El espectro cruzado estimado en $\omega = 0.1$ (periodo de 10).
@ usa c2[3] c2[4]
= \lvert f_{yx}\rvert = \sqrt{2.4^2 + 3.2^2} = \sqrt{5.76 + 10.24} = 4
> La magnitud.
@ usa c2[3] c2[4]; da c2[5]
= \rho^2_{yx} = \frac{4^2}{4\cdot 5} = \frac{16}{20} = 0.8
> El 80% de la variabilidad de $y$ en esta frecuencia se explica con $x$.
@ usa c2[1] c2[2] c2[5]; da c2[6]
= \varphi_{yx} = \operatorname{atan2}(-3.2,\ 2.4) = -0.927 \text{ rad}
> La fase es negativa: $y$ va **atrasada** respecto a $x$.
@ usa c2[3] c2[4]; da c2[7]
= D = -\frac{\varphi_{yx}}{2\pi\omega} = \frac{0.927}{2\pi(0.1)} = 1.48 \text{ periodos}
> Si la relación fuera un retardo puro, $y$ seguiría a $x$ con casi un periodo y medio de retraso. Se confirma si la fase es lineal en varias frecuencias con la misma pendiente.
@ usa c2[7]; da c2[8]
= A = \frac{f_{yx}}{f_x} = 0.6 - 0.8i, \qquad \lvert A\rvert = 1
> La ganancia del filtro que lleva de $x$ a $y$: en esta frecuencia, $y$ copia la amplitud de $x$ completa.
@ usa c2[1] c2[3] c2[4]
:::

Una sola frecuencia no basta para afirmar que hay un retardo: hay que ver que la fase sea una **recta** en varias frecuencias, con la misma pendiente. Y hay una trampa: `atan2` devuelve ángulos entre $-\pi$ y $\pi$, así que una fase verdadera de $-3.8$ aparece como $+2.5$.

:::guiado El retardo leído en cuatro frecuencias {#guia-fase-varias}
| $\omega$ | $\hat c_{yx}$ | $\hat q_{yx}$ | $\hat\varphi = \operatorname{atan2}(-\hat q, \hat c)$ | $D = -\hat\varphi/(2\pi\omega)$ | Fase desenvuelta | $D$ corregido |
|---|---|---|---|---|---|---|
| 0.05 | 4.0 | 3.0 | −0.644 | 2.05 | −0.644 | 2.05 |
| 0.10 | 1.2 | 3.8 | −1.265 | 2.01 | −1.265 | 2.01 |
| 0.20 | −1.6 | 1.2 | −2.498 | 1.99 | −2.498 | 1.99 |
| 0.30 | −0.8 | −0.6 | 2.498 | −1.33 | −3.785 | 2.01 |
---
= \omega = 0.05:\ \hat\varphi = \operatorname{atan2}(-3,\ 4) = -0.644 \;\Rightarrow\; D = \frac{0.644}{2\pi(0.05)} = 2.05
> El coespectro y el de cuadratura estimados (ya suavizados) dan la fase, y la fase el retardo.
@ usa c2[1] c3[1]; da c4[1] c5[1]
= \omega = 0.10 \text{ y } 0.20:\quad D = 2.01 \text{ y } 1.99
> La misma cuenta: el retardo implícito casi no cambia con la frecuencia.
@ usa c2[2-3] c3[2-3]; da c4[2-3] c5[2-3]
= \omega = 0.30:\ \hat\varphi = \operatorname{atan2}(0.6,\ -0.8) = 2.498 \;\Rightarrow\; D = -1.33 \;\text{(¿negativo?)}
> ¡Un retardo negativo, cuando las otras tres frecuencias dicen 2! La fase verdadera es $-2\pi(0.3)(2) = -3.77$, que está fuera de $[-\pi, \pi]$: `atan2` la «envolvió» sumándole $2\pi$.
@ usa c2[4] c3[4]; da c4[4] c5[4]
= \hat\varphi - 2\pi = 2.498 - 6.283 = -3.785 \;\Rightarrow\; D = \frac{3.785}{2\pi(0.3)} = 2.01
> **Desenvolver la fase**: restar (o sumar) $2\pi$ hasta que la curva no tenga saltos. En Python, `np.unwrap`.
@ usa c4[4]; da c6[4] c7[4]
= \text{pendiente} = \frac{\sum\omega\hat\varphi}{\sum\omega^2} = -12.59 \;\Rightarrow\; D = \frac{12.59}{2\pi} = 2.00
> La recta por el origen ajustada a las cuatro fases desenvueltas. Conclusión: $y$ va atrasada 2 periodos respecto a $x$ en todas estas frecuencias, la huella de un retardo puro [[demo-retardo]].
@ usa c1[1-4] c6[1-4]
:::

### Hay que suavizar: la coherencia cruda siempre vale 1 {#coherencia-cruda}

Si se calcula la coherencia con los periodogramas crudos, sale **exactamente 1 en todas las frecuencias**, para cualquier par de series. No es un error de cálculo: es que no se promedió nada.

:::demo Sin promediar, la coherencia es 1 {#demo-coherencia-cruda}
:::pasos
= \hat{f}_{yx}(\omega_j) = d_y(\omega_j)\,\overline{d_x(\omega_j)}, \qquad \hat{f}_x = \lvert d_x\rvert^2, \qquad \hat{f}_y = \lvert d_y\rvert^2
> Los estimadores crudos: el periodograma cruzado y los dos periodogramas.
= \frac{\lvert\hat{f}_{yx}\rvert^2}{\hat{f}_x\hat{f}_y} = \frac{\lvert d_y\rvert^2\lvert d_x\rvert^2}{\lvert d_x\rvert^2\lvert d_y\rvert^2} = 1
> El módulo de un producto es el producto de los módulos. Con un solo par de números complejos siempre hay una «relación perfecta»: es como calcular una correlación con dos puntos.
= \hat\rho^2_{yx}(\omega) = \frac{\lvert\frac1L\sum_k d_y\bar d_x\rvert^2}{\frac1L\sum_k\lvert d_x\rvert^2\cdot\frac1L\sum_k\lvert d_y\rvert^2} \le 1
> Promediando $L$ frecuencias vecinas (o $K$ segmentos de Welch), la desigualdad de Cauchy–Schwarz ya permite valores menores que 1: la coherencia solo tiene sentido **suavizada**.
:::
:::

¿Cuándo es significativa? Si en verdad no hay relación ($\rho^2 = 0$) y se promediaron $L$ ordenadas, $\frac{(L - 1)\hat\rho^2}{1 - \hat\rho^2} \sim F_{2,\,2L-2}$. La coherencia es significativa al 5% si

$$\hat\rho^2_{yx}(\omega) > \frac{F_{2,\,2L-2}(0.95)}{L - 1 + F_{2,\,2L-2}(0.95)}$$

| $\Lsp$ ordenadas promediadas | 5 | 9 | 11 |
|---|---|---|---|
| Umbral de coherencia al 5% | 0.527 | 0.312 | 0.259 |

Con pocas ordenadas, coherencias de 0.5 pueden salir por puro azar. Y aunque cada frecuencia tenga un 5% de falsas alarmas, con 100 frecuencias esperarías unas 5 por encima del umbral: busca **bandas** coherentes, no puntos sueltos.

:::interactivo w3-coherencia-cruda | Sin suavizar, la coherencia no dice nada {#w-coherencia-cruda}
Dos ruidos blancos **independientes**: la coherencia verdadera es 0 en todas las frecuencias. Cambia cuántas ordenadas promedias.
@@@
- **Arriba**: la coherencia estimada en cada frecuencia y el umbral de 5% (línea rosa). Con $m = 0$ todo vale 1.
- Al promediar más ordenadas la coherencia baja hacia 0 y solo un 5% de las frecuencias cruza el umbral.
- **Abajo**: el histograma de las coherencias estimadas; el porcentaje por encima del umbral aparece en el título.
- **Vista extra**: el mismo cálculo con dos series que **sí** están relacionadas, para comparar.
:::

### Simular una relación con retardo {#sim-retardo}

:::interactivo w3-cruzado | Retardo, ruido y banda: cómo responden fase y coherencia {#w-cruzado}
$y_t$ es una copia de $x_t$ con retardo $D$, multiplicada por $\beta$, más ruido. Opcionalmente, $y$ solo copia los movimientos lentos de $x$ (pasa bajos). Mira qué estima Welch.
@@@
- **Arriba**: las dos series.
- **Abajo, izquierda**: la coherencia estimada (con su umbral) y la teórica. Más ruido baja la coherencia; si $y$ solo copia los movimientos lentos, la coherencia es alta solo en frecuencias bajas.
- **Abajo, derecha**: la fase estimada y la recta teórica $-2\pi\omega D$ (envuelta entre $-\pi$ y $\pi$). La pendiente revela el retardo. Donde la coherencia es baja, la fase es puro ruido.
- **Vista extra**: la correlación cruzada en el dominio del tiempo, con su pico en el rezago $D$: la misma información en el otro idioma.
:::

El mismo experimento en Python, con la receta completa: estimar la coherencia, quedarse con las frecuencias donde es alta, desenvolver la fase y ajustar una recta.

```python
rng = np.random.default_rng(11)
n_s = 2000
x_s = signal.lfilter([1], [1, -0.7], rng.normal(size=n_s + 50))[50:]      # AR(1) con φ = 0.7
y_s = np.r_[np.zeros(3), 0.8 * x_s[:-3]] + rng.normal(0, 1, n_s)          # y copia a x con 3 periodos de retardo
f_s, coh_s = signal.coherence(x_s, y_s, nperseg=128)
_, pxy_s = signal.csd(x_s, y_s, nperseg=128)
fase_s = np.unwrap(np.angle(pxy_s))                                         # fase desenvuelta
usar = (coh_s > 0.5) & (f_s > 0)
pendiente = np.polyfit(f_s[usar], fase_s[usar], 1)[0]
print(f"frecuencias con coherencia > 0.5: {usar.sum()} de {len(f_s)} (hasta ω = {f_s[usar].max():.3f})")
print(f"pendiente de la fase = {pendiente:.2f}  →  retardo estimado D = {-pendiente / (2 * np.pi):.2f} periodos")
print(f"coherencia en ω ≈ 0.05: {coh_s[np.argmin(abs(f_s - 0.05))]:.2f}   en ω ≈ 0.4: {coh_s[np.argmin(abs(f_s - 0.4))]:.2f}")
```

El retardo sale cerca de 3, el verdadero. La coherencia teórica es $\beta^2 f_x/(\beta^2 f_x + 1)$: 0.80 en $\omega = 0.05$ y solo 0.20 en $\omega = 0.4$, porque el AR(1) casi no tiene potencia en frecuencias altas y ahí domina el ruido de $y$. Por eso la recta se ajusta solo con las frecuencias bajas: donde la coherencia es baja, la fase no dice nada.

### Un caso real: el ciclo económico de EE. UU. {#cruzado-macro}

La guía oficial menciona tres aplicaciones: *detectar si dos variables comparten ciclos, si una serie antecede a otra o si la relación solo aparece en ciertas frecuencias*. Con datos trimestrales de 1959 a 2009, comparamos el crecimiento del PIB real con tres variables. Las frecuencias del **ciclo económico** son las de periodos entre 6 y 32 trimestres (1.5 a 8 años): $\omega \in [1/32,\ 1/6]$.

```python
pib = np.diff(np.log(macro.realgdp.values)) * 100          # crecimiento trimestral (%)
otras = {"inversión": np.diff(np.log(macro.realinv.values)) * 100,
         "consumo": np.diff(np.log(macro.realcons.values)) * 100,
         "Δ desempleo": np.diff(macro.unemp.values)}
for nombre, y in otras.items():
    f, coh = signal.coherence(pib, y, nperseg=32)            # Welch: segmentos de 8 años
    _, pxy = signal.csd(pib, y, nperseg=32)
    ciclo = (f >= 1 / 32) & (f <= 1 / 6)
    print(f"{nombre:12s} coherencia en el ciclo = {coh[ciclo].mean():.2f} | en periodos < 4 trim. = {coh[f > 0.25].mean():.2f} | "
          f"fase media en el ciclo = {np.angle(pxy[ciclo]).mean():+.2f} rad | correlación = {np.corrcoef(pib, y)[0, 1]:+.2f}")
```

| Variable | Coherencia en el ciclo | En frecuencias altas | Fase en el ciclo | Lectura |
|---|---|---|---|---|
| Inversión | 0.82 | 0.58 | ≈ 0 | Se mueve **en fase** con el PIB, sobre todo en el ciclo |
| Consumo | 0.68 | 0.23 | ≈ +0.24 | Comparte el ciclo; fase positiva: va ligeramente **adelante** |
| Δ desempleo | 0.74 | 0.19 | ≈ +2.7 (cerca de $\pi$) | Comparte el ciclo **al revés** (sube cuando el PIB cae) y algo atrasado |

La coherencia en frecuencias altas es mucho menor: en el corto plazo (de un trimestre a otro) estas series se mueven con su propio ruido; la relación fuerte es la del ciclo. Una sola correlación ($+0.66$ con el consumo, por ejemplo) mezcla todas las frecuencias y no lo muestra.

:::interactivo w3-macro | ¿Qué variables comparten el ciclo del PIB? {#w-macro}
Elige la variable y la longitud de los segmentos de Welch. La franja marca las frecuencias del ciclo económico.
@@@
- **Arriba**: el crecimiento del PIB y la variable elegida (estandarizados para que se vean en la misma escala).
- **Abajo, izquierda**: la coherencia, con el umbral aproximado de 5% y la franja del ciclo (periodos de 6 a 32 trimestres).
- **Abajo, derecha**: la fase. Cerca de 0 = en fase; cerca de $\pm\pi$ = al revés; positiva = la variable va adelante del PIB (con la convención de `scipy`).
- **Vista extra**: la correlación cruzada entre el PIB y la variable, por rezago.
:::

:::interactivo py3-coherence | Simulador: `scipy.signal.coherence` y `csd` {#sim-coherence}
Cambia los argumentos y mira el código, la salida y la coherencia del PIB con la inversión.
@@@
- `nperseg` decide cuántos segmentos se promedian: con segmentos largos hay pocos y la coherencia se infla (en el extremo, un solo segmento da coherencia 1).
- `csd(x, y)` calcula $\overline{X}\cdot Y$: su fase es la de $y$ respecto a $x$, negativa si $y$ va atrasada.
- La tabla explica cada parámetro y su valor recomendado.
:::

:::cuidado Errores comunes con la fase y la coherencia
- **La fase solo se interpreta donde la coherencia es alta.** Donde no hay relación, la fase es un número al azar entre $-\pi$ y $\pi$.
- **La fase está envuelta**: un retardo largo da una recta que «salta» de $-\pi$ a $\pi$. Desenvuélvela (`np.unwrap`) antes de medir su pendiente.
- **El signo depende de la convención**: `scipy.signal.csd(x, y)` da $\overline{X}Y$ (fase de $y$ respecto a $x$); otros programas usan el conjugado. Compruébalo con una simulación de retardo conocido.
- **Coherencia no es causalidad**: dos series pueden ser coherentes porque ambas responden a una tercera.
:::

:::duda ¿Qué diferencia hay entre la coherencia y la correlación?
La correlación resume la relación con **un solo número** que mezcla todas las frecuencias. La coherencia da **una correlación (al cuadrado) por frecuencia**. Dos series pueden tener correlación moderada porque están muy relacionadas en el ciclo económico y nada en el ruido trimestral; la coherencia separa las dos cosas. Además, la coherencia no se afecta por un retardo (un desfase cambia la fase, no la coherencia), mientras que la correlación contemporánea sí baja si una serie va atrasada.
:::

:::examen Así te lo pueden preguntar: «Explique magnitud, fase y coherencia en espectros cruzados»
«El espectro cruzado $f_{yx}(\omega)$ es la transformada de Fourier de la covarianza cruzada $\gamma_{yx}(k) = \Cov(y_{t+k}, x_t)$; como esta no es simétrica, $f_{yx}$ es complejo. Su **magnitud** $\lvert f_{yx}(\omega)\rvert$ mide la fuerza de la relación lineal en la frecuencia $\omega$; su **fase** $\varphi_{yx}(\omega) = \arg f_{yx}(\omega)$ mide el desfase entre los componentes de esa frecuencia (un retardo puro de $D$ periodos da $\varphi = -2\pi\omega D$, una recta); y la **coherencia** $\rho^2_{yx}(\omega) = \lvert f_{yx}\rvert^2/(f_x f_y)$, entre 0 y 1, es la fracción de la varianza de $y$ en esa frecuencia que se explica linealmente con $x$. Se estima suavizando (sin suavizar vale 1 siempre) y se compara con el umbral de la $F_{2,2L-2}$. Sirve para detectar ciclos comunes, cuál serie antecede a otra y si la relación solo existe en ciertas bandas, como la coherencia de 0.82 entre el PIB y la inversión en las frecuencias del ciclo económico.»
:::

:::resumen Lo que debes llevarte del espectro cruzado
- $f_{yx}(\omega) = \sum\gamma_{yx}(k)e^{-2\pi i\omega k} = c_{yx} - iq_{yx}$ es complejo.
- Magnitud: fuerza. Fase: desfase; con un retardo $D$, $\varphi = -2\pi\omega D$. Coherencia: $\lvert f_{yx}\rvert^2/(f_xf_y)$, un $R^2$ por frecuencia.
- Sin suavizar la coherencia vale 1; con $L$ ordenadas, es significativa si supera $F/(L - 1 + F)$ (0.31 con $L = 9$).
- Lee la fase solo donde la coherencia es alta, y revisa la convención de signo de tu software.
:::
