## 🔀 Modelos ARMA(p, q) {#arma}
@mapa AR y MA juntos: condiciones, pesos ψ y respuesta al impulso, ACF del ARMA(1,1), cancelación de raíces, parsimonia y el simulador de ArmaProcess.

### Definición y condiciones {#arma-def}

:::definicion Modelo ARMA(p, q)
$$y_t = c + \sum_{i=1}^{p}\phi_i\,y_{t-i} + \varepsilon_t + \sum_{j=1}^{q}\theta_j\,\varepsilon_{t-j} \qquad\Longleftrightarrow\qquad \phi(L)\,y_t = c + \theta(L)\,\varepsilon_t$$

Combina la parte autorregresiva AR($p$) y la de media móvil MA($q$). Para que sea un buen modelo se piden tres cosas:

| Condición | Se revisa en | Qué garantiza |
|---|---|---|
| **Estacionariedad** | raíces de $\phi(z)$ fuera del círculo | los choques se apagan; existe la forma MA(∞) |
| **Invertibilidad** | raíces de $\theta(z)$ fuera del círculo | los choques se recuperan de los datos; existe la forma AR(∞) |
| **Sin raíces comunes** | $\phi(z)$ y $\theta(z)$ no comparten raíces | el modelo no se puede simplificar (parámetros identificables) |

La media es la del AR: $\mu = c/(1 - \phi_1 - \dots - \phi_p)$ [[demo-ar-media]], porque los choques tienen media cero.
:::

La guía oficial insiste en un punto: **ARMA requiere que la serie ya sea estacionaria**. Si tiene tendencia o raíz unitaria, primero se transforma o se diferencia, y eso es precisamente lo que hace el ARIMA [[arima]].

:::intuicion Otra forma de verlo: ¿por qué juntar las dos partes?
Por **parsimonia**. Un AR(1) tiene ACF que decae desde $\phi$; un MA(1) tiene un solo pico. Si los datos muestran «un primer pico grande y luego un decaimiento geométrico», un AR puro necesitaría muchos rezagos para imitarlo y un MA puro también. Un ARMA(1,1) lo logra con **dos parámetros**. Es como describir una curva con su fórmula en lugar de con una tabla de cien puntos.
:::

### Los pesos ψ: la forma MA(∞) {#psi-pesos}

Todo ARMA estacionario es un filtro de choques $y_t = \mu + \sum \psi_j \varepsilon_{t-j}$ [[filtro-lineal]]. Los pesos salen de «dividir» los polinomios: $\psi(L) = \theta(L)/\phi(L)$.

:::demo La recursión de los pesos ψ {#demo-psi}
:::pasos
= \phi(L)\,(y_t - \mu) = \theta(L)\,\varepsilon_t \;\Rightarrow\; y_t - \mu = \frac{\theta(L)}{\phi(L)}\,\varepsilon_t = \psi(L)\,\varepsilon_t
> Si el AR es estacionario, $\phi(L)$ se puede invertir [[invertir]].
= \phi(L)\,\psi(L) = \theta(L)
> Multiplicamos ambos lados por $\phi(L)$: es una igualdad entre polinomios.
= (1 - \phi_1 L - \dots - \phi_p L^p)(\psi_0 + \psi_1 L + \psi_2 L^2 + \dots) = 1 + \theta_1 L + \dots + \theta_q L^q
> Escribimos los dos lados completos.
= L^j:\quad \psi_j - \phi_1\psi_{j-1} - \dots - \phi_p\psi_{j-p} = \theta_j
> Igualamos el coeficiente de cada potencia $L^j$ ($\theta_j = 0$ si $j > q$, $\psi_{\text{negativo}} = 0$, $\theta_0 = 1$).
= \psi_0 = 1, \qquad \psi_j = \theta_j + \phi_1\psi_{j-1} + \dots + \phi_p\psi_{j-p}
> Despejamos: cada peso es el «MA de hoy» más el «eco AR» de los pesos anteriores.
:::
:::

:::guiado Pesos ψ del ARMA(1,1) con φ = 0.7 y θ = 0.4 {#guia-psi}
| $j$ | $\theta_j$ | $\psi_{j-1}$ | $\psi_j = \theta_j + 0.7\,\psi_{j-1}$ |
|---|---|---|---|
| 0 | 1 | — | 1 |
| 1 | 0.4 | 1 | 1.1 |
| 2 | 0 | 1.1 | 0.77 |
| 3 | 0 | 0.77 | 0.539 |
| 4 | 0 | 0.539 | 0.3773 |
---
= \psi_0 = 1
> El choque de hoy entra con peso 1.
@ usa c2[1]; da c4[1]
= \psi_1 = \theta_1 + \phi\,\psi_0 = 0.4 + 0.7(1) = 1.1
> El choque de ayer pesa por dos caminos: directo (MA, $0.4$) y por el eco del AR ($0.7$).
@ usa c2[2] c3[2]; da c4[2]
= \psi_2 = 0 + 0.7(1.1) = 0.77
> Desde $j = 2$ ya no hay término MA: solo queda el eco del AR.
@ usa c2[3] c3[3]; da c4[3]
= \psi_3 = 0.7(0.77) = 0.539, \qquad \psi_4 = 0.7(0.539) = 0.3773
> Se multiplica por $\phi = 0.7$ en cada paso.
@ usa c3[4-5]; da c4[4-5]
= \psi_j = \phi^{j-1}(\phi + \theta) = 0.7^{j-1}(1.1) \quad (j \ge 1)
> Fórmula cerrada del ARMA(1,1): decaimiento geométrico **a partir de $j = 1$**.
@ usa c4[2-5]
:::

Hay una segunda forma de calcular los mismos pesos, muy útil para interpretarlos: **la respuesta al impulso**. Si el sistema está en reposo y llega un único choque de tamaño 1, la trayectoria que sigue la serie son exactamente los $\psi_j$.

:::guiado Los mismos pesos como respuesta a un impulso {#guia-impulso}
$y_t = 0.7\,y_{t-1} + \varepsilon_t + 0.4\,\varepsilon_{t-1}$, con un solo choque $\varepsilon_0 = 1$ y todos los demás en cero.

| $t$ | $\varepsilon_t$ | $\varepsilon_{t-1}$ | $y_{t-1}$ | $y_t$ |
|---|---|---|---|---|
| 0 | 1 | 0 | 0 | 1 |
| 1 | 0 | 1 | 1 | 1.1 |
| 2 | 0 | 0 | 1.1 | 0.77 |
| 3 | 0 | 0 | 0.77 | 0.539 |
---
= y_0 = 0.7(0) + 1 + 0.4(0) = 1
> Llega el impulso.
@ usa c2[1] c3[1] c4[1]; da c5[1]
= y_1 = 0.7(1) + 0 + 0.4(1) = 1.1
> El impulso vuelve a entrar por la parte MA y por el rezago de $y$.
@ usa c3[2] c4[2]; da c5[2]
= y_2 = 0.7(1.1) = 0.77, \qquad y_3 = 0.7(0.77) = 0.539
> Ya solo queda la memoria AR. Es la misma columna $\psi_j$ de la tabla anterior.
@ usa c4[3-4]; da c5[3-4]
:::

:::interactivo w2-impulso | Respuesta al impulso: ¿qué le pasa a la serie después de un choque? {#w-impulso}
Elige un modelo. Arriba ves la respuesta a un choque unitario ($\psi_j$) y su efecto acumulado; abajo, dos trayectorias con los mismos choques salvo un choque extra de $+3$ en $t = 30$.
@@@
- **Tallos**: $\psi_j$, el efecto del choque $j$ periodos después. **Línea rosa**: el efecto acumulado $\sum_{i \le j}\psi_i$.
- En modelos estacionarios los tallos se apagan y el acumulado converge a $\theta(1)/\phi(1)$: el choque tiene un efecto **transitorio**.
- En el paseo aleatorio y el ARIMA(1,1,0) los tallos **no** se apagan: el choque cambia el nivel **para siempre** (efecto permanente).
- **Abajo**: la diferencia entre las dos trayectorias (en durazno) es exactamente $3\,\psi_{t-30}$: la respuesta al impulso escalada.
- **Vista extra**: la tabla de $\psi_j$ y del acumulado.
:::

### La ACF del ARMA(1,1) {#arma-acf}

:::demo Autocovarianzas del ARMA(1,1) {#demo-acf-arma11}
Modelo centrado $y_t = \phi\,y_{t-1} + \varepsilon_t + \theta\,\varepsilon_{t-1}$. Necesitamos dos covarianzas auxiliares entre la serie y los choques.

:::pasos
= \E[y_t\,\varepsilon_t] = \sigma^2, \qquad \E[y_t\,\varepsilon_{t-1}] = \phi\,\E[y_{t-1}\varepsilon_{t-1}] + \theta\,\sigma^2 = (\phi + \theta)\,\sigma^2
> $y_t$ contiene $\varepsilon_t$ con peso 1 y $\varepsilon_{t-1}$ con peso $\psi_1 = \phi + \theta$.
= \gamma(1) = \E[y_t\,y_{t-1}] = \phi\,\gamma(0) + \E[\varepsilon_t y_{t-1}] + \theta\,\E[\varepsilon_{t-1}y_{t-1}] = \phi\,\gamma(0) + \theta\,\sigma^2
> Multiplicamos el modelo por $y_{t-1}$; el choque de hoy no se correlaciona con el pasado.
= \gamma(0) = \E[y_t\,y_t] = \phi\,\gamma(1) + \sigma^2 + \theta(\phi + \theta)\,\sigma^2
> Multiplicamos el modelo por $y_t$ y usamos las dos covarianzas auxiliares.
= \gamma(0) = \phi^2\gamma(0) + \phi\theta\sigma^2 + \sigma^2 + \phi\theta\sigma^2 + \theta^2\sigma^2
> Sustituimos $\gamma(1)$ del segundo paso.
= \gamma(0) = \frac{\sigma^2\,(1 + 2\phi\theta + \theta^2)}{1 - \phi^2}
> Despejamos $\gamma(0)$.
= \rho(1) = \frac{\gamma(1)}{\gamma(0)} = \frac{(\phi + \theta)(1 + \phi\theta)}{1 + 2\phi\theta + \theta^2}, \qquad \rho(k) = \phi\,\rho(k-1) \;\; (k \ge 2)
> Sustituimos $\gamma(0)$ en $\gamma(1)$ y factorizamos el numerador. Para $k \ge 2$ la parte MA ya no comparte choques y solo queda la recursión del AR.
:::
:::

:::guiado ACF del ARMA(1,1) con φ = 0.7 y θ = 0.4 {#guia-acf-arma}
| $k$ | ARMA(1,1): $\rho(k)$ | AR(1) con $\phi = 0.7$: $\rho(k) = 0.7^k$ |
|---|---|---|
| 1 | 0.8186 | 0.7 |
| 2 | 0.5730 | 0.49 |
| 3 | 0.4011 | 0.343 |
| 4 | 0.2808 | 0.2401 |
---
= 1 + 2\phi\theta + \theta^2 = 1 + 2(0.7)(0.4) + 0.16 = 1.72
> Denominador.
= (\phi + \theta)(1 + \phi\theta) = (1.1)(1.28) = 1.408
> Numerador.
= \rho(1) = \frac{1.408}{1.72} = 0.8186
> Primer valor: **no** es $\phi$. La parte MA lo cambia.
@ da c2[1]
= \rho(2) = 0.7(0.8186) = 0.5730, \quad \rho(3) = 0.4011, \quad \rho(4) = 0.2808
> Desde aquí decae como un AR(1): se multiplica por $0.7$.
@ usa c2[1]; da c2[2-4]
= \frac{\rho_{\text{ARMA}}(k)}{\rho_{\text{AR}}(k)} = \frac{0.8186}{0.7} = 1.169 \text{ en todos los rezagos}
> Las dos ACF decaen al mismo ritmo; el ARMA es la del AR(1) «escalada». Por eso la ACF sola no basta para distinguir AR de ARMA y se mira también la PACF (que en el ARMA **no** se corta).
@ usa c2[1-4] c3[1-4]
= \gamma(0) = \frac{1.72}{1 - 0.49} = 3.3725 \quad (\sigma^2 = 1)
> La varianza de la serie.
:::

:::interactivo w2-arma11 | Laboratorio del ARMA(1,1) {#w-arma11}
Mueve $\phi$ y $\theta$. Compara la ACF y la PACF del ARMA(1,1) con las del AR(1) de la misma $\phi$ y del MA(1) de la misma $\theta$.
@@@
- **ACF (izquierda)**: lila = ARMA(1,1), gris = AR(1), menta = MA(1). La del ARMA arranca distinta y luego decae al ritmo de $\phi$.
- **PACF (derecha)**: la del AR(1) se corta en 1; la del ARMA(1,1) **decae** (hereda la forma AR(∞) de la parte MA).
- **Plano complejo**: la raíz AR ($1/\phi$) y la raíz MA ($-1/\theta$). Si las juntas (por ejemplo $\phi = 0.5$, $\theta = -0.5$), se **cancelan** y el modelo se vuelve ruido blanco [[cancelacion]].
- **Vista extra**: la cuenta de $\rho(1)$ con tus valores y la tabla de $\rho(k)$.
:::

### Cancelación de raíces y parsimonia {#cancelacion}

:::demo Un ARMA(1,1) con φ = −θ es ruido blanco {#demo-cancelacion}
Tomemos $\phi = 0.5$ y $\theta = -0.5$.

:::pasos
= y_t = 0.5\,y_{t-1} + \varepsilon_t - 0.5\,\varepsilon_{t-1} \;\Longleftrightarrow\; (1 - 0.5L)\,y_t = (1 - 0.5L)\,\varepsilon_t
> Los dos polinomios son **iguales**: comparten la raíz $z = 2$.
= y_t = \frac{1 - 0.5L}{1 - 0.5L}\,\varepsilon_t = \varepsilon_t
> El factor común se cancela.
= \psi_1 = \theta + \phi = -0.5 + 0.5 = 0
> Comprobación con los pesos: todos los $\psi_j$ con $j \ge 1$ valen cero.
:::

El modelo «parece» tener dos parámetros pero se comporta como ruido blanco. Si le ajustas un ARMA(1,1) a ruido blanco, cualquier par con $\hat\phi \approx -\hat\theta$ explica igual de bien los datos: las estimaciones salen con **errores estándar enormes** y no significativas.
:::

```python
np.random.seed(2)
ruido = np.random.standard_normal(300)                       # ruido blanco puro
sobrado = SARIMAX(ruido, order=(1, 0, 1)).fit(disp=False)   # le ajustamos un ARMA(1,1) de más
print(sobrado.summary().tables[1])
justo = SARIMAX(ruido, order=(0, 0, 0)).fit(disp=False)
print(f"AIC del ARMA(1,1) = {sobrado.aic:.2f}  vs  AIC del ruido blanco = {justo.aic:.2f}")
```

Observa: $\hat\phi = -0.178$ y $\hat\theta = 0.117$ casi se cancelan, sus errores estándar (≈ 0.95) son más grandes que los propios coeficientes y el AIC empeora [[aic-bic]]. Es la señal típica de un modelo **sobreparametrizado**.

:::definicion Principio de parsimonia
Entre los modelos que dejan residuos de ruido blanco, se prefiere el que tiene **menos parámetros**. Cada parámetro de más se estima con error, hace el modelo más inestable y empeora el pronóstico fuera de la muestra aunque mejore un poco el ajuste dentro de ella. AIC y BIC formalizan esta idea [[aic-bic]].
:::

:::ejemplo Cancelación casi perfecta
Con $\phi = 0.6$ y $\theta = -0.5$ las raíces son $1/0.6 = 1.667$ y $1/0.5 = 2$: cercanas pero no iguales. Los pesos son

$$\psi_1 = 0.6 - 0.5 = 0.1, \quad \psi_2 = 0.6(0.1) = 0.06, \quad \psi_3 = 0.036, \dots$$

La serie es **casi** ruido blanco: con datos reales sería muy difícil distinguir este ARMA(1,1) de un ruido blanco, y el modelo sencillo sería el preferido.
:::

### El simulador de `ArmaProcess` {#sim-arma}

:::interactivo py2-armaprocess | Simulador: `ArmaProcess` con todos sus métodos {#sim-armaprocess}
Elige los coeficientes del modelo (con el signo **del modelo**) y observa cómo se traducen a los arreglos `ar` y `ma`, qué responde cada método y cómo se ve una muestra.
@@@
- **Código**: los arreglos `ar` y `ma` se arman con los signos correctos; cambia un coeficiente y mira qué número cambia.
- **Salida**: `isstationary`, `isinvertible`, las raíces, la ACF y PACF teóricas y los pesos `arma2ma` (los $\psi_j$).
- **Gráfica**: una muestra de `generate_sample` con el `burnin` elegido. Sin `burnin`, la serie arranca en cero y los primeros valores no son representativos.
- **Tabla de parámetros**: qué hace cada argumento y qué valor conviene.
:::

:::duda ¿Qué hace `burnin` en `generate_sample`?
Genera esa cantidad de valores **extra** al principio y los descarta. Sirve porque la recursión arranca con ceros, que no son una muestra típica del proceso estacionario. Con raíces cerca del círculo unitario (memoria larga) conviene un `burnin` grande (200 o más) para que se olvide el arranque.
:::

:::resumen Lo que debes llevarte del ARMA(p, q)
- $\phi(L)\,y_t = c + \theta(L)\,\varepsilon_t$: requiere serie **estacionaria**; raíces de $\phi$ fuera (estacionariedad), raíces de $\theta$ fuera (invertibilidad) y sin raíces comunes.
- Pesos $\psi$: $\psi_0 = 1$, $\psi_j = \theta_j + \sum\phi_i\psi_{j-i}$; son la **respuesta al impulso**.
- ARMA(1,1): $\rho(1) = \frac{(\phi + \theta)(1 + \phi\theta)}{1 + 2\phi\theta + \theta^2}$ y $\rho(k) = \phi\,\rho(k-1)$.
- Tanto la ACF como la PACF **decaen** gradualmente.
- **Parsimonia**: raíces que casi se cancelan y errores estándar enormes delatan parámetros de más.
:::
