## 🌋 Heterocedasticidad y modelos ARCH {#arch}
@mapa Cuando la varianza cambia: los dos tipos de heterocedasticidad, el modelo ARCH(1) (varianza, curtosis y por qué es ruido blanco sin ser independiente), la prueba ARCH-LM a mano, GARCH y qué hacer en la práctica.

### Heterocedasticidad {#heterocedasticidad}

:::definicion Heterocedasticidad
Ocurre cuando la **varianza del error no es constante**. La guía oficial: *en series financieras o de demanda, la volatilidad puede agruparse por periodos*. Sus consecuencias:

- intervalos de pronóstico incorrectos (demasiado angostos en épocas turbulentas y demasiado anchos en épocas tranquilas);
- inferencia poco confiable (errores estándar mal calculados);
- **subestimación del riesgo** en periodos de alta volatilidad;
- residuos que no cumplen los supuestos del modelo.
:::

Hay dos tipos muy distintos, y cada uno tiene su remedio:

| Tipo | Cómo se ve | Ejemplo | Remedio |
|---|---|---|---|
| La varianza crece con el **nivel** | la serie «se abre» como un embudo | AirPassengers en niveles | logaritmo o Box–Cox [[boxcox]] |
| Volatilidad **agrupada** (condicional) | rachas tranquilas y rachas agitadas, sin relación con el nivel | rendimientos de acciones, tipo de cambio | modelos ARCH/GARCH |

### El modelo ARCH(1) {#arch1}

Robert Engle propuso en 1982 (y ganó el Nobel por ello) un modelo donde la varianza de hoy depende del tamaño del choque de ayer.

:::definicion Modelo ARCH(1)
$$\varepsilon_t = \sigma_t\,\tip{z-arch}{z_t}, \qquad \tip{sigma2t}{\sigma_t^2} = \tip{omega-arch}{\omega} + \tip{alpha-arch}{\alpha}\,\varepsilon_{t-1}^2, \qquad z_t \sim \text{i.i.d. } N(0, 1)$$

- $\sigma_t^2$: la varianza **condicional**: la varianza del choque de hoy sabiendo lo que pasó ayer.
- $\omega > 0$ y $0 \le \alpha < 1$: condiciones para que la varianza sea positiva y no explote.
- Un choque grande ayer ($\varepsilon_{t-1}^2$ grande) produce una varianza grande hoy: así se **agrupan** los choques grandes.
:::

:::demo Las propiedades del ARCH(1) {#demo-arch}
:::pasos
= \E[\varepsilon_t \mid \text{pasado}] = \sigma_t\,\E[z_t] = 0
> $\sigma_t$ se conoce con el pasado y $z_t$ es independiente de él, con media 0.
= \Var(\varepsilon_t \mid \text{pasado}) = \sigma_t^2\,\Var(z_t) = \omega + \alpha\,\varepsilon_{t-1}^2
> La varianza **condicional** cambia en cada periodo: heterocedasticidad.
= \E[\varepsilon_t^2] = \E[\sigma_t^2] = \omega + \alpha\,\E[\varepsilon_{t-1}^2] \;\Rightarrow\; \Var(\varepsilon_t) = \frac{\omega}{1 - \alpha}
> Ley de esperanzas iteradas y estacionariedad ($\E[\varepsilon_t^2] = \E[\varepsilon_{t-1}^2]$). La varianza **incondicional** es constante.
= \Cov(\varepsilon_t, \varepsilon_{t-k}) = \E\big[\varepsilon_{t-k}\,\E[\varepsilon_t \mid \text{pasado}]\big] = 0
> Los choques **no están correlacionados**: el ARCH es ruido blanco [[ruido-blanco2]].
= \varepsilon_t^2 = \omega + \alpha\,\varepsilon_{t-1}^2 + v_t, \qquad v_t = \varepsilon_t^2 - \sigma_t^2
> Pero sus **cuadrados** siguen un AR(1) (con $v_t$ de media cero): la ACF de $\varepsilon_t^2$ es $\alpha^k$. No correlacionados, pero **dependientes**.
= K = \frac{\E[\varepsilon_t^4]}{(\E[\varepsilon_t^2])^2} = \frac{3(1 - \alpha^2)}{1 - 3\alpha^2} > 3 \quad (3\alpha^2 < 1)
> Desarrollando $\E[\sigma_t^4]$ con la misma técnica. La curtosis supera la de la normal: **colas pesadas**, aunque $z_t$ sea normal.
:::
:::

:::guiado Un ARCH(1) a mano con ω = 0.2 y α = 0.5 {#guia-arch}
Con $\varepsilon_0 = 0$ y estos choques estandarizados $z_t$:

| $t$ | $z_t$ | $\varepsilon_{t-1}$ | $\sigma_t^2 = 0.2 + 0.5\,\varepsilon_{t-1}^2$ | $\sigma_t$ | $\varepsilon_t = \sigma_t z_t$ |
|---|---|---|---|---|---|
| 1 | 1.2 | 0 | 0.2 | 0.4472 | 0.5367 |
| 2 | −0.5 | 0.5367 | 0.344 | 0.5865 | −0.2933 |
| 3 | 2.0 | −0.2933 | 0.243 | 0.4930 | 0.9859 |
| 4 | 0.3 | 0.9859 | 0.686 | 0.8283 | 0.2485 |
| 5 | −1.5 | 0.2485 | 0.2309 | 0.4805 | −0.7207 |
---
= \sigma_1^2 = 0.2 + 0.5(0)^2 = 0.2, \qquad \varepsilon_1 = \sqrt{0.2}\,(1.2) = 0.5367
> Sin choque previo, la varianza es solo $\omega$.
@ usa c2[1] c3[1]; da c4[1] c5[1] c6[1]
= \sigma_2^2 = 0.2 + 0.5(0.5367)^2 = 0.344
> El choque de ayer sube la varianza de hoy.
@ usa c3[2]; da c4[2] c5[2] c6[2]
= \sigma_4^2 = 0.2 + 0.5(0.9859)^2 = 0.686
> Después del choque grande de $t = 3$, la varianza se **triplica**: aunque $z_4 = 0.3$ es pequeño, el sistema queda «nervioso».
@ usa c3[4]; da c4[4] c5[4]
= \sigma_5^2 = 0.2 + 0.5(0.2485)^2 = 0.2309
> Un choque chico regresa la calma: la varianza vuelve cerca de $\omega$.
@ usa c3[5]; da c4[5] c5[5] c6[5]
= \Var(\varepsilon_t) = \frac{0.2}{1 - 0.5} = 0.4, \qquad K = \frac{3(1 - 0.25)}{1 - 0.75} = 9
> A largo plazo la varianza es 0.4, y la curtosis es 9: tres veces la de la normal.
:::

:::interactivo w2-arch | Volatilidad agrupada {#w-arch}
Simula un ARCH(1). Mira cómo los choques grandes llegan en rachas aunque la ACF de la serie esté vacía.
@@@
- **Arriba**: la serie $\varepsilon_t$ (lila) y la banda $\pm 2\sigma_t$ (rosa), que se ensancha después de cada choque grande.
- **Abajo a la izquierda**: la ACF de $\varepsilon_t$: plana (ruido blanco). **Abajo a la derecha**: la ACF de $\varepsilon_t^2$: decae como $\alpha^k$ (rombos). La ACF **muestral** de los cuadrados suele quedar por debajo de los rombos: con colas tan pesadas converge muy despacio, así que no esperes que coincida.
- **Lectura**: la varianza muestral contra $\omega/(1 - \alpha)$, la curtosis muestral contra $3(1 - \alpha^2)/(1 - 3\alpha^2)$ y la prueba ARCH-LM.
- Con $\alpha = 0$ es ruido blanco normal; con $\alpha$ cerca de 0.6, la curtosis teórica ya es infinita y aparecen choques gigantes.
- **Vista extra**: el histograma con la normal de la misma varianza: el ARCH tiene más valores cerca de 0 **y** más valores extremos.
:::

### La prueba ARCH-LM paso a paso {#arch-lm}

:::definicion Procedimiento de ARCH-LM (Engle)
1. Calcula los residuos $e_t$ del modelo de la media (ARIMA, SARIMA…) y sus cuadrados $e_t^2$.
2. Haz la regresión $e_t^2 = a_0 + a_1 e_{t-1}^2 + \dots + a_q e_{t-q}^2 + u_t$ y anota su $R^2$.
3. $\LM = n'R^2$, con $n'$ las observaciones de esa regresión.
4. Compara con $\chi^2(q)$. Si el p-value es menor que 0.05, hay efectos ARCH.
:::

:::guiado ARCH-LM con un rezago y ocho residuos {#guia-archlm}
Residuos: $(0.5,\ -1.2,\ 1.5,\ -0.3,\ 0.2,\ -0.1,\ 0.9,\ -1.4)$.

| $t$ | $e_t$ | $e_t^2$ (variable $y$) | $e_{t-1}^2$ (variable $x$) |
|---|---|---|---|
| 1 | 0.5 | 0.25 | — |
| 2 | −1.2 | 1.44 | 0.25 |
| 3 | 1.5 | 2.25 | 1.44 |
| 4 | −0.3 | 0.09 | 2.25 |
| 5 | 0.2 | 0.04 | 0.09 |
| 6 | −0.1 | 0.01 | 0.04 |
| 7 | 0.9 | 0.81 | 0.01 |
| 8 | −1.4 | 1.96 | 0.81 |
---
= e_t^2:\; 0.25,\ 1.44,\ 2.25,\ 0.09,\ 0.04,\ 0.01,\ 0.81,\ 1.96
> Elevamos al cuadrado: se pierde el signo; solo importa el **tamaño** del choque.
@ usa c2[1-8]; da c3[1-8]
= (x, y) = (e_{t-1}^2, e_t^2):\; (0.25, 1.44),\ (1.44, 2.25),\ \dots,\ (0.81, 1.96)
> Con un rezago hay $n' = 7$ pares (el primer dato no tiene anterior).
@ usa c3[1-7]; da c4[2-8]
= \hat a_1 = 0.178,\quad \hat a_0 = 0.819,\quad R^2 = r_{xy}^2 = 0.161^2 = 0.026
> La regresión simple de $y$ sobre $x$: con una sola variable, $R^2$ es la correlación al cuadrado.
@ usa c3[2-8] c4[2-8]
= \LM = n'R^2 = 7(0.026) = 0.182, \qquad p = P(\chi^2_1 > 0.182) = 0.670
> No hay evidencia de efectos ARCH: un choque grande no anuncia otro (por ejemplo, después del 2.25 viene un 0.09). `het_arch(e, nlags=1)` da exactamente lo mismo.
:::

:::interactivo w2-archlm | La regresión detrás de ARCH-LM {#w-archlm}
Simula residuos con distinto grado de efecto ARCH y mira la regresión de $e_t^2$ sobre $e_{t-1}^2$ que usa la prueba.
@@@
- **Izquierda**: cada punto es un par $(e_{t-1}^2, e_t^2)$ con la recta de regresión. Con efectos ARCH la nube se inclina: choques grandes seguidos de choques grandes.
- **Derecha**: el estadístico LM para $q = 1, \dots, 12$ rezagos y su valor crítico al 5%.
- **Vista extra**: los coeficientes de la regresión con $q = 1$ y la cuenta $\LM = n'R^2$.
:::

### GARCH y qué hacer en la práctica {#garch}

El ARCH(1) solo «recuerda» un periodo. Para que la volatilidad persista se usa **GARCH(1,1)** (Bollerslev, 1986), que agrega la varianza de ayer:

$$\sigma_t^2 = \omega + \alpha\,\varepsilon_{t-1}^2 + \beta\,\sigma_{t-1}^2, \qquad \Var(\varepsilon_t) = \frac{\omega}{1 - \alpha - \beta}$$

$\alpha + \beta$ mide la **persistencia** de la volatilidad; en datos financieros suele estar entre 0.9 y 0.99. En Python se estima con el paquete `arch` (no viene con statsmodels):

```python norun
# pip install arch
from arch import arch_model
garch = arch_model(residuos * 100, mean="Zero", vol="GARCH", p=1, q=1)   # reescalar ayuda al optimizador
res_garch = garch.fit(disp="off")
print(res_garch.summary())
```

:::definicion Qué hacer según lo que encuentres
| Hallazgo | Acción |
|---|---|
| La varianza crece con el nivel | transformar: log o Box–Cox [[boxcox]] |
| Un cambio de varianza en una fecha concreta (prueba H rechaza, ARCH-LM no) | modelar solo el periodo reciente o tratar el cambio de régimen |
| Rachas de volatilidad (ARCH-LM rechaza) | GARCH para la varianza; ARIMA para la media |
| Unos pocos atípicos | identificarlos y tratarlos con variables indicadoras |
:::

:::duda ¿El ARCH cambia los pronósticos puntuales?
No: si los choques son ARCH, la media condicional (y el pronóstico puntual del ARIMA) no cambia. Lo que cambia son los **intervalos**: después de un periodo agitado deben ser más anchos y en calma más angostos. Un ARIMA con varianza constante usa el mismo ancho siempre, así que se equivoca en los dos sentidos. En gestión de riesgo (por ejemplo, el valor en riesgo de una inversión), eso es justo lo importante.
:::

:::resumen Lo que debes llevarte del ARCH
- Heterocedasticidad = varianza no constante: o crece con el nivel (transformar) o se agrupa en rachas (ARCH/GARCH).
- ARCH(1): $\sigma_t^2 = \omega + \alpha\varepsilon_{t-1}^2$; varianza incondicional $\omega/(1 - \alpha)$; curtosis $3(1 - \alpha^2)/(1 - 3\alpha^2) > 3$.
- El ARCH es **ruido blanco** (sin correlación) pero **no independiente**: la ACF de $\varepsilon_t^2$ decae como $\alpha^k$.
- ARCH-LM: regresión de $e_t^2$ sobre sus rezagos; $\LM = n'R^2 \sim \chi^2(q)$.
:::
