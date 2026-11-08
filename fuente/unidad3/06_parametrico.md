## 🧮 Estimación espectral paramétrica {#parametrico}
@mapa Ajustar un modelo AR y usar su fórmula como estimador del espectro: el procedimiento, un ejemplo completo a mano con las manchas solares, cómo elegir el orden, y la comparación con los métodos no paramétricos que pide la guía oficial.

### La idea: ajustar un modelo y usar su espectro {#idea-parametrico}

La guía oficial describe los **métodos paramétricos** así: *asumen un modelo como AR, MA o ARMA y calculan el espectro desde los parámetros estimados*. Si el modelo es bueno, el resultado es una curva suave, sin el ruido del periodograma, y con picos bien definidos.

:::definicion Estimador espectral autorregresivo
1. Elige el orden $p$ (por ejemplo, con el AIC).
2. Estima $\hat\phi_1, \dots, \hat\phi_p$ y $\hat\sigma^2$ (Yule–Walker, Burg o máxima verosimilitud) [[u2:ar-estimar]].
3. Evalúa

$$\hat{f}(\omega) = \frac{\hat\sigma^2}{\big\lvert 1 - \hat\phi_1 e^{-2\pi i\omega} - \dots - \hat\phi_p e^{-2\pi i p\omega}\big\rvert^2}$$

¿Por qué AR y no ARMA? Porque se estima con ecuaciones lineales, y porque cualquier densidad espectral continua se puede aproximar tanto como se quiera con el espectro de un AR de orden suficientemente grande.
:::

:::intuicion Ajustar una curva con forma conocida
El periodograma suavizado es como dibujar a mano alzada siguiendo una nube de puntos. El método paramétrico es como elegir una **familia** de curvas (las que puede producir un AR($p$)) y quedarse con la que mejor explica los datos. Si la familia es la adecuada, el resultado es más preciso; si no lo es, la curva puede tener una forma que los datos no tienen.
:::

### Paso a paso con un AR(2) {#ar-espectral}

Con un AR(2) el denominador se puede escribir solo con cosenos ([[demo-pico-ar2]]):

$$D(\omega) = 1 + \phi_1^2 + \phi_2^2 - 2\phi_1(1 - \phi_2)\cos(2\pi\omega) - 2\phi_2\cos(4\pi\omega), \qquad \hat f(\omega) = \hat\sigma^2/D(\omega)$$

:::guiado El espectro AR(2) de las manchas solares {#guia-ar-espectral}
| $\omega$ | Periodo | $\cos(2\pi\omega)$ | $\cos(4\pi\omega)$ | $D(\omega)$ | $\hat f(\omega)$ |
|---|---|---|---|---|---|
| 0 | ∞ | 1 | 1 | 0.0909 | 3 184 |
| 0.0877 | 11.40 | 0.8519 | 0.4515 | 0.0315 | 9 189 |
| 0.25 | 4 | 0 | −1 | 1.9957 | 145 |
| 0.5 | 2 | −1 | 1 | 9.3141 | 31 |
---
= \hat\phi_1 = 1.3752, \quad \hat\phi_2 = -0.6767, \quad \hat\sigma^2 = 289.37
> Yule–Walker sobre las 309 observaciones (lo calculamos en Python más abajo). Como $\hat\phi_1^2 + 4\hat\phi_2 = -0.82 < 0$, las raíces son complejas: hay un ciclo [[u2:ar2-complejas]].
= 1 + \hat\phi_1^2 + \hat\phi_2^2 = 1 + 1.8912 + 0.4579 = 3.3491, \qquad 2\hat\phi_1(1 - \hat\phi_2) = 4.6116, \qquad -2\hat\phi_2 = 1.3534
> Las tres constantes del denominador: $D(\omega) = 3.3491 - 4.6116\cos(2\pi\omega) + 1.3534\cos(4\pi\omega)$.
= \cos(2\pi\omega^*) = \frac{\hat\phi_1(\hat\phi_2 - 1)}{4\hat\phi_2} = \frac{1.3752(-1.6767)}{4(-0.6767)} = 0.8519 \;\Rightarrow\; \omega^* = 0.0877
> La fórmula del pico del AR(2). El periodo del pico es $1/0.0877 = 11.40$ años.
@ usa c1[2] c2[2]
= D(\omega^*) = 3.3491 - 4.6116(0.8519) + 1.3534(0.4515) = 0.0315 \;\Rightarrow\; \hat f(\omega^*) = \frac{289.37}{0.0315} = 9\,189
> En el pico el denominador casi se anula.
@ usa c3[2] c4[2]; da c5[2] c6[2]
= D(0) = 3.3491 - 4.6116 + 1.3534 = 0.0909 \;\Rightarrow\; \hat f(0) = 3\,184
> En la frecuencia cero.
@ usa c3[1] c4[1]; da c5[1] c6[1]
= D(1/4) = 3.3491 - 1.3534 = 1.9957 \;\Rightarrow\; \hat f(1/4) = 145; \qquad D(1/2) = 9.3141 \;\Rightarrow\; \hat f(1/2) = 31
> Las oscilaciones de 4 y 2 años casi no aportan: el pico de 11 años domina. La curva entera sale de solo tres números ($\hat\phi_1$, $\hat\phi_2$, $\hat\sigma^2$).
@ usa c3[3-4] c4[3-4]; da c5[3-4] c6[3-4]
:::

En el examen no te darán una computadora para Yule–Walker, pero sí pueden darte la ACF muestral. El procedimiento completo, desde las autocorrelaciones hasta el pico:

:::guiado De la ACF muestral al espectro: Yule–Walker a mano {#guia-yw-ar2}
| $\omega$ | Periodo | $\cos(2\pi\omega)$ | $\cos(4\pi\omega)$ | $D(\omega)$ | $\hat f(\omega) = 20/D(\omega)$ |
|---|---|---|---|---|---|
| 0 | ∞ | 1 | 1 | 0.1111 | 180 |
| 0.0932 | 10.73 | 0.8333 | 0.3889 | 0.0370 | 540 |
| 0.25 | 4 | 0 | −1 | 1.8889 | 10.6 |
| 0.5 | 2 | −1 | 1 | 9 | 2.22 |
---
= \hat\gamma(0) = 100, \qquad \hat\rho(1) = 0.8, \qquad \hat\rho(2) = 0.4
> Los datos del problema: la varianza muestral y las dos primeras autocorrelaciones.
= \hat\phi_1 = \frac{\hat\rho(1)\,[1 - \hat\rho(2)]}{1 - \hat\rho(1)^2} = \frac{0.8(0.6)}{0.36} = 1.333, \qquad \hat\phi_2 = \frac{\hat\rho(2) - \hat\rho(1)^2}{1 - \hat\rho(1)^2} = \frac{0.4 - 0.64}{0.36} = -0.667
> La solución de las dos ecuaciones de Yule–Walker de un AR(2) [[u2:ar-estimar]]. Como $\hat\phi_1^2 + 4\hat\phi_2 = -0.89 < 0$, las raíces son complejas: habrá un pico interior.
= \hat\sigma^2 = \hat\gamma(0)\,\big[1 - \hat\phi_1\hat\rho(1) - \hat\phi_2\hat\rho(2)\big] = 100\,(1 - 1.067 + 0.267) = 20
> La varianza del ruido: lo que el AR(2) no explica de la varianza total.
= D(\omega) = 3.222 - 4.444\cos(2\pi\omega) + 1.333\cos(4\pi\omega)
> Las constantes $1 + \hat\phi_1^2 + \hat\phi_2^2$, $2\hat\phi_1(1 - \hat\phi_2)$ y $-2\hat\phi_2$, como en el ejemplo anterior.
= \cos(2\pi\omega^*) = \frac{1.333(-1.667)}{4(-0.667)} = 0.8333 \;\Rightarrow\; \omega^* = 0.0932,\ \Per = 10.73
> El pico del espectro estimado: un ciclo de casi 11 periodos.
@ usa c3[2]; da c1[2] c2[2]
= D(\omega^*) = 3.222 - 4.444(0.8333) + 1.333(0.3889) = 0.0370 \;\Rightarrow\; \hat f(\omega^*) = \frac{20}{0.0370} = 540
> La altura del pico.
@ usa c3[2] c4[2]; da c5[2] c6[2]
= D(0) = (1 - \hat\phi_1 - \hat\phi_2)^2 = 0.111, \qquad D(\tfrac12) = (1 + \hat\phi_1 - \hat\phi_2)^2 = 9
> En los extremos el denominador es un cuadrado perfecto (atajo útil): $\hat f(0) = 180$ y $\hat f(1/2) = 2.22$. En $\omega = 1/4$, $D = 3.222 - 1.333 = 1.889$ y $\hat f = 10.6$.
@ usa c3[1] c3[4]; da c5[1] c6[1] c5[4] c6[4]
:::

### Elegir el orden {#orden-ar}

El orden es la decisión importante. Con $p$ muy chico, el modelo no tiene suficientes «grados de libertad» para la forma del espectro (un AR(1) no puede tener un pico interior); con $p$ muy grande, aparecen **picos falsos**, porque el modelo empieza a ajustar el ruido. La práctica usual es elegir $p$ con el AIC [[u2:aic-def]] y revisar que el resultado se parezca al periodograma suavizado.

```python
from statsmodels.regression.linear_model import yule_walker

def espectro_ar(x, p, w):
    phi, sigma = yule_walker(x, order=p, method="mle")       # sigma es la desviación estándar
    z = np.exp(-2j * np.pi * w)
    den = np.abs(1 - sum(phi[k] * z ** (k + 1) for k in range(p))) ** 2
    return phi, sigma ** 2, sigma ** 2 / den

x_m = manchas.values
n_m = len(x_m)
aic = []
for p in range(1, 21):
    _, s2, _ = espectro_ar(x_m, p, np.array([0.0]))
    aic.append(n_m * np.log(s2) + 2 * (p + 1))
p_aic = int(np.argmin(aic)) + 1
print("orden elegido por AIC:", p_aic)
w = np.linspace(0.001, 0.5, 5000)
for p in [2, p_aic]:
    phi, s2, f_ar = espectro_ar(x_m, p, w)
    print(f"AR({p}): φ̂ = {np.round(phi[:3], 4)}{'…' if p > 3 else ''}  σ̂² = {s2:.2f}  pico en {1 / w[f_ar.argmax()]:.2f} años")
```

El AIC elige $p = 9$, y su pico queda en 10.5 años; el AR(2) lo pone en 11.4. Ambos están dentro de la joroba que vimos al suavizar el periodograma (entre 10 y 12 años), lo cual es consistente con un ciclo de duración variable.

:::ejemplo Leer la tabla de AIC y BIC de las manchas solares
| $p$ | $\hat\sigma^2$ | AIC | $\Delta$AIC | BIC | $\Delta$BIC |
|---|---|---|---|---|---|
| 1 | 533.82 | 1944.5 | 238.0 | 1952.0 | 208.1 |
| 2 | 289.37 | 1757.3 | 50.8 | 1768.5 | 24.6 |
| 3 | 283.16 | 1752.6 | 46.1 | 1767.6 | 23.7 |
| 8 | 249.78 | 1723.9 | 17.3 | 1757.5 | 13.6 |
| 9 | 234.66 | 1706.6 | 0 | 1743.9 | 0 |
| 10 | 234.63 | 1708.5 | 2.0 | 1749.6 | 5.7 |
| 12 | 234.60 | 1712.5 | 5.9 | 1761.0 | 17.1 |

Con $\text{AIC} = n\ln\hat\sigma^2 + 2(p + 1)$ y $\text{BIC} = n\ln\hat\sigma^2 + (p + 1)\ln n$ [[u2:aic-def]]:
- Del AR(1) al AR(2) el AIC baja 187 puntos: sin el segundo coeficiente no puede haber pico, porque un AR(1) no tiene pico interior.
- Del AR(8) al AR(9) baja otros 17; del 9 al 10 **sube** 2: el décimo coeficiente casi no reduce $\hat\sigma^2$ (de 234.66 a 234.63) y paga 2 puntos de penalización.
- El BIC penaliza más ($\ln 309 = 5.7$ por parámetro) y aquí también elige $p = 9$. Cuando los dos criterios no coinciden, compara los dos espectros: si muestran el mismo pico, la conclusión no depende del orden.
:::

El estimador paramétrico no está atado a Yule–Walker. Con máxima verosimilitud, y con otros modelos de la Unidad II, el pico se mueve muy poco:

```python
from statsmodels.tsa.arima.model import ARIMA
warnings.simplefilter("ignore")

w_mv = np.linspace(0.001, 0.5, 20000)
z_mv = np.exp(-2j * np.pi * w_mv)
for orden in [(2, 0, 0), (2, 0, 1), (3, 0, 0)]:
    r = ARIMA(manchas.values, order=orden, trend="c").fit()
    ar, ma, s2 = r.arparams, r.maparams, r.params[-1]
    num = np.abs(1 + sum(ma[k] * z_mv ** (k + 1) for k in range(len(ma)))) ** 2
    den = np.abs(1 - sum(ar[k] * z_mv ** (k + 1) for k in range(len(ar)))) ** 2
    f_mv = s2 * num / den
    print(f"ARIMA{orden}: φ̂ = {np.round(ar, 3)}, θ̂ = {np.round(ma, 3)}, σ̂² = {s2:.1f}, pico en {1 / w_mv[f_mv.argmax()]:.2f} años")
```

Por máxima verosimilitud el AR(2) pone el pico en 11.42 años (Yule–Walker: 11.40); agregar un MA(1) o un tercer coeficiente AR lo deja entre 11.39 y 11.46. Lo que es robusto al método y al modelo es la **ubicación** del pico; su altura y su ancho dependen más de la especificación.

:::interactivo w3-ar-espectral | Elige el orden y mira el espectro AR {#w-ar-espectral}
Ajusta un AR($p$) por Yule–Walker a la serie que elijas y compara su espectro con el periodograma suavizado.
@@@
- **Arriba**: el espectro AR (curva rosa) sobre el periodograma suavizado (gris) y el crudo (puntos). Con $p$ pequeño la curva es demasiado simple; con $p$ muy grande aparecen picos que el periodograma suavizado no respalda.
- **Abajo**: el AIC de cada orden (el mínimo está marcado). El orden que elijas aparece resaltado.
- **Vista extra**: los coeficientes estimados, $\hat\sigma^2$ y el periodo de los picos del espectro AR.
:::

### Paramétrico contra no paramétrico {#comparacion-espectral}

La guía oficial resume la comparación en dos frases: el no paramétrico tiene *menos supuestos, es más directo y puede ser ruidoso*; el paramétrico es *más suave e interpretable si el modelo es correcto, pero depende de la especificación*. En detalle:

| | No paramétrico (periodograma, Daniell, Welch) | Paramétrico (AR, ARMA) |
|---|---|---|
| Supuestos | Solo estacionariedad | Que el modelo (y su orden) sea adecuado |
| Qué se decide | El ancho de banda o la longitud de los segmentos | El orden $p$ (y $q$) |
| Forma del resultado | Curva irregular; su suavidad depende de la banda | Curva suave siempre |
| Resolución con pocos datos | Limitada por $\Bw = L/n$ o $1/M$ | Puede separar picos cercanos si el modelo es correcto |
| Intervalos de confianza | Sencillos ($\chi^2_{2L}$) | Más complicados (dependen de los parámetros) |
| Riesgo principal | Mucho ruido o picos aplanados | Picos falsos (orden alto) o perdidos (orden bajo) |
| Cuándo conviene | Exploración, series largas, informes «sin modelo» | Series cortas, picos angostos, cuando ya tienes un modelo ARMA |

:::interactivo w3-comparar-espectros | Tres estimadores, una serie {#w-comparar-espectros}
Superpón el periodograma crudo, el suavizado de Daniell, el de Welch y el espectro AR (con el orden del AIC) sobre la misma serie.
@@@
- Los cuatro estimadores deberían contar la misma historia: si un pico aparece solo en uno, desconfía.
- Mueve el suavizado de Daniell y la longitud de Welch para ver cuánto cambian sus picos; el AR no tiene esa perilla, tiene el orden.
- En la serie simulada, la curva punteada es la verdad: compara qué estimador se le acerca más con $n$ pequeño y con $n$ grande.
- **Vista extra**: la tabla con el periodo del pico más alto según cada método.
:::

:::cuidado Antes de ajustar un AR para el espectro
- La serie debe ser **estacionaria**: con tendencia, el AR pone un pico enorme en la frecuencia 0 que tapa todo lo demás. Diferencia o quita la tendencia primero.
- Un orden demasiado alto produce **picos espurios**; el AIC, con series largas, tiende a elegir órdenes grandes. Compara siempre con el periodograma suavizado.
- El espectro AR siempre es suave: no confundas suavidad con certeza.
:::

:::duda ¿Que el AIC elija un AR(9) significa que las manchas solares «son» un AR(9)?
No. Aquí el AR es una **herramienta de aproximación**: nueve coeficientes alcanzan para dibujar bien la forma del espectro (una joroba ancha cerca de 1/11 y potencia en frecuencias bajas). El Sol no sigue un AR(9); simplemente, un AR(9) reproduce bien su autocovarianza en el rango de rezagos que podemos estimar.
:::

:::duda ¿Puedo usar como estimador del espectro el SARIMA que ya ajusté en la Unidad II?
Sí, y es una buena idea si el modelo ya pasó el diagnóstico. Un SARIMA es un ARMA para la serie **diferenciada**, así que su espectro paramétrico es
$$\hat f(\omega) = \hat\sigma^2\,\frac{\lvert\hat\theta(e^{-2\pi i\omega})\rvert^2\,\lvert\hat\Theta(e^{-2\pi i\omega s})\rvert^2}{\lvert\hat\phi(e^{-2\pi i\omega})\rvert^2\,\lvert\hat\Phi(e^{-2\pi i\omega s})\rvert^2}$$
y describe a la serie después de las diferencias. Es lo que hicimos con el modelo de aerolínea en [[espectro-aerolinea]]. La desventaja: hereda los supuestos del modelo, incluido el periodo $s$ fijo; si lo que buscas es un ciclo de duración variable, el AR($p$) por AIC es más flexible.
:::

:::examen Así te lo pueden preguntar: «Compare la estimación espectral paramétrica y la no paramétrica»
«La estimación **no paramétrica** parte del periodograma, $I(\omega_j) = \lvert d(\omega_j)\rvert^2$, y lo estabiliza promediando frecuencias vecinas (Daniell) o segmentos (Welch). Hace pocos supuestos (solo estacionariedad) y es directa, pero el periodograma crudo es muy ruidoso y el suavizado cambia varianza por resolución. La **paramétrica** ajusta un modelo, típicamente un AR($p$) elegido con el AIC, y usa su fórmula $\hat f(\omega) = \hat\sigma^2/\lvert\hat\phi(e^{-2\pi i\omega})\rvert^2$. Produce una curva suave e interpretable, con buena resolución aun con pocos datos si el modelo es adecuado, pero depende de la especificación: un orden bajo pierde picos y uno alto crea picos falsos. En la práctica se usan juntos: si ambos muestran el mismo pico, la conclusión es sólida.»
:::

:::resumen Lo que debes llevarte de la estimación paramétrica
- Ajusta un AR($p$) y usa $\hat f(\omega) = \hat\sigma^2/\lvert 1 - \sum\hat\phi_k e^{-2\pi i\omega k}\rvert^2$.
- Con un AR(2), el pico está donde $\cos(2\pi\omega^*) = \hat\phi_1(\hat\phi_2 - 1)/(4\hat\phi_2)$: en las manchas solares, 11.4 años.
- El orden se elige con el AIC (manchas solares: $p = 9$, pico en 10.5 años) y se contrasta con el periodograma suavizado.
- No paramétrico: pocos supuestos, ruidoso. Paramétrico: suave, depende del modelo.
:::
