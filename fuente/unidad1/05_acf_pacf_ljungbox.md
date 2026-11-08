## 🔗 Análisis de autocorrelación: ACF y PACF {#acf-pacf}
@mapa Correlograma, bandas de Bartlett, efectos directos e indirectos, PACF deducida a mano y patrones de identificación.

### La ACF y el correlograma {#correlograma}

:::definicion Correlograma
Es la gráfica de las autocorrelaciones muestrales $\hat\rho(k)$ [[autocorr]] contra el rezago $k = 1, 2, \dots$, con **bandas de confianza** alrededor de 0. Cada barra responde: *¿qué tan correlacionados están los valores separados $k$ periodos?* Las barras que **salen** de la banda son significativamente distintas de 0.
:::

```python
from statsmodels.graphics.tsaplots import plot_acf, plot_pacf

fig, ejes = plt.subplots(1, 2, figsize=(11, 3.5))
plot_acf(serie, lags=36, ax=ejes[0], title="ACF de AirPassengers")
plot_pacf(serie, lags=36, ax=ejes[1], method="ywm", title="PACF de AirPassengers")
plt.show()
print("Primeras autocorrelaciones:", np.round(acf(serie, nlags=4), 3))
```

Una ACF que empieza en casi 1 y **baja muy despacio** (0.95, 0.92, 0.88…) es la firma de una serie con tendencia o raíz unitaria [[paseo-demo]]: hay que diferenciar antes de interpretar nada más.

:::interactivo py-plotacf | Simulador: `plot_acf` y `plot_pacf` con todos sus parámetros {#sim-plotacf}
Elige la serie y mueve cada parámetro. La gráfica reproduce el estilo de statsmodels (tallos con punto y banda sombreada) y el código cambia con tus valores. Prueba especialmente `zero`, `bartlett_confint` y `alpha`.
@@@
- **Tallos con punto**: cada uno es el valor de la ACF (o PACF) en ese rezago; el rezago 0 aparece solo con `zero=True` y siempre vale 1.
- **Banda sombreada**: el intervalo de confianza **alrededor de 0**. Una barra que sale de la banda es significativa al nivel `alpha`.
  - En `plot_acf` con `bartlett_confint=True` la banda **se ensancha** con el rezago: en $k$ usa $\pm z\sqrt{(1 + 2\sum_{j<k}\hat\rho_j^2)/n}$.
  - Con `bartlett_confint=False`, y siempre en `plot_pacf`, la banda es **fija**: $\pm z/\sqrt n$.
  - $z$ depende de `alpha`: 2.576 (0.01), 1.960 (0.05), 1.645 (0.10).
- **Salida y lectura**: la lista de rezagos fuera de la banda y consejos según tus parámetros.
- **Tabla de parámetros**: qué hace cada uno y qué valor conviene.
:::

| Tipo de serie | `lags` | `zero` | `alpha` | `bartlett_confint` (ACF) | `method` (PACF) |
|---|---|---|---|---|---|
| Mensual (periodo 12) | 36–48 | False | 0.05 | True | `"ywm"` |
| Trimestral (periodo 4) | 16–20 | False | 0.05 | True | `"ywm"` |
| Diaria con patrón semanal | 21–35 | False | 0.05 | True | `"ywm"` |
| Sin estacionalidad | 20–30 | False | 0.05 | True | `"ywm"` |
| Pocos datos ($n < 60$) | como máximo $n/4$ | False | 0.05 | True | `"ols"` o `"ywm"` |
| Residuos de un modelo | 24–36 | False | 0.05 | False (comparar con ruido blanco) | `"ywm"` |

:::duda ¿Por qué `plot_acf` dibuja una barra de altura 1 en el rezago 0?
Porque $\rho(0) = \gamma(0)/\gamma(0) = 1$ siempre [[autocorr]]: es la correlación de cada dato consigo mismo. No aporta información y, como es tan alta, **aplasta la escala** de las demás barras. Por eso se recomienda `zero=False`.
:::

:::duda ¿Por qué la banda de `plot_acf` se ensancha y la de `plot_pacf` no?
La banda de Bartlett de la ACF responde: «suponiendo que las autocorrelaciones **anteriores** pueden ser distintas de 0, ¿la de este rezago también lo es?». Cada autocorrelación grande en rezagos previos aumenta la incertidumbre de las siguientes [[bartlett]]. En la PACF, bajo un AR de orden menor, los coeficientes parciales de rezagos mayores tienen varianza aproximada $1/n$, así que la banda es fija.
:::

:::duda ¿Qué diferencia hay entre `acf()` y `plot_acf()`?
`acf()` (en `statsmodels.tsa.stattools`) **devuelve números**: los valores, y si pides `alpha=` y `qstat=True`, también los intervalos y los estadísticos de Ljung–Box. `plot_acf()` (en `statsmodels.graphics.tsaplots`) **dibuja** esos números. Para un reporte o un examen usa `acf()` para citar valores exactos y `plot_acf()` para mostrar el patrón.
:::

:::duda ¿Qué método de PACF uso?
`"ywm"` (Yule–Walker con la autocovarianza dividida entre $n$, el predeterminado de `plot_pacf`) siempre da valores entre −1 y 1. `"ols"` estima cada regresión por mínimos cuadrados [[pacf]] y es muy usado con muestras medianas. Evita `"yw"` (dividido entre $n - k$) con pocos datos: puede dar valores mayores que 1 en rezagos altos.
:::

:::interactivo py-acftabla | Simulador: la tabla numérica de `acf(..., alpha, qstat=True)` {#sim-acftabla}
Lo que se ve en la gráfica, ahora en números: para cada rezago, la autocorrelación, su intervalo de confianza y la prueba de Ljung–Box acumulada.
@@@
- **Columnas de la salida**: `acf` = $\hat\rho(k)$; `inferior`/`superior` = $\hat\rho(k) \mp z\cdot\text{EE}_k$ (Bartlett); `Q` y `p-value` = Ljung–Box con $h = k$.
- Una autocorrelación es significativa si su intervalo **no contiene al 0**. Ojo: en la gráfica la banda se dibuja centrada en 0, pero el criterio es el mismo.
- **Gráfica**: el p-value de Ljung–Box para cada $h$; si cae bajo la línea gris hay autocorrelación conjunta hasta ese rezago.
:::

```python
final = np.log(serie).diff(12).diff().dropna()
valores, confint = acf(final, nlags=12, alpha=0.05)
tabla = pd.DataFrame({"acf": valores, "inferior": confint[:, 0], "superior": confint[:, 1]})
tabla["¿significativa?"] = (tabla["inferior"] > 0) | (tabla["superior"] < 0)
print(tabla.iloc[1:].round(3))
```

```python
fig, ejes = plt.subplots(2, 1, figsize=(10, 6))
plot_acf(final, lags=36, zero=False, ax=ejes[0], title="ACF de ΔΔ₁₂ ln(pasajeros)")
plot_pacf(final, lags=36, zero=False, method="ywm", ax=ejes[1], title="PACF de ΔΔ₁₂ ln(pasajeros)")
plt.tight_layout()
plt.show()
```

### Bandas de confianza (Bartlett) {#bartlett}

:::definicion Banda para ruido blanco
Si la serie es ruido blanco [[ruido-blanco]], para $n$ grande cada autocorrelación muestral se comporta como una normal con media 0 y varianza $1/n$:

$$\hat\rho(k) \;\approx\; N\!\left(0,\; \frac{1}{n}\right) \qquad\Longrightarrow\qquad \text{banda al 95\%:}\;\; \pm\frac{\tip{z196}{1.96}}{\sqrt{\tip{n}{n}}}$$

La deducción de la banda a partir de la normal está en [[normal]]. Con $n = 100$: $\pm 0.196$; con $n = 144$ (AirPassengers): $\pm 1.96/12 = \pm 0.163$; con $n = 400$: $\pm 0.098$. **Más datos ⇒ bandas más angostas** ⇒ detectamos correlaciones más pequeñas.
:::

:::definicion Banda de Bartlett (la que dibuja `plot_acf`)
`plot_acf` dibuja por defecto una banda que **se ensancha** con el rezago:

$$\Var\big(\hat\rho(k)\big) \approx \frac{1}{n}\left(1 + 2\sum_{j=1}^{k-1}\hat\rho(j)^2\right), \qquad \text{banda: } \pm 1.96\sqrt{\Var\big(\hat\rho(k)\big)}$$

Supone que las autocorrelaciones **hasta $k - 1$** pueden ser distintas de 0 (un MA($k-1$)) y pregunta si la del rezago $k$ también lo es. Para $k = 1$ coincide con $\pm 1.96/\sqrt n$.
:::

:::ejemplo Bandas a mano
Con $n = 100$ y $\hat\rho(1) = 0.5$:

:::pasos
= k = 1:\quad \pm\frac{1.96}{\sqrt{100}} = \pm 0.196
> El primer rezago usa la banda de ruido blanco.
= k = 2:\quad \Var(\hat\rho(2)) \approx \frac{1 + 2(0.5)^2}{100} = \frac{1.5}{100} = 0.015
> La suma solo tiene el término $j = 1$.
= \pm 1.96\sqrt{0.015} = \pm 1.96 \times 0.12247 = \pm 0.240
> La banda del rezago 2 es más ancha porque el rezago 1 fue grande.
:::

Así, $\hat\rho(1) = 0.5$ (fuera de $\pm 0.196$) es significativa, pero un $\hat\rho(2) = 0.22$ quedaría **dentro** de $\pm 0.240$.
:::

:::cuidado 5% de falsas alarmas
Con bandas al 95%, aunque la serie sea ruido blanco, **1 de cada 20 barras** saldrá de la banda por azar. Ver una barra aislada fuera en el rezago 17 no significa mucho; por eso existe una prueba **conjunta**: Ljung–Box [[ljung-box]].
:::

:::interactivo bartlett | Ruido blanco y bandas de confianza
Mueve $n$ y genera nuevas muestras. La banda se angosta como $1/\sqrt n$ y, en promedio, alrededor del 5% de las barras cae fuera (marcadas en rosa).
@@@
- **Barras**: la ACF de una muestra de ruido blanco (naranjas = fuera de la banda).
- **Franja**: $\pm 1.96/\sqrt n$; se angosta al aumentar $n$.
- **Lectura**: cuántas barras salen; en promedio debe rondar el 5%.
:::

### Efectos directos e indirectos {#indirectos}

En un AR(1), $y_t$ depende **directamente** solo de $y_{t-1}$. Sin embargo $\rho(2) = \phi^2 \ne 0$ [[ar1-acf]]. ¿Por qué hay correlación con $y_{t-2}$ si no aparece en el modelo?

:::intuicion La cadena de influencia
$y_{t-2}$ influye en $y_{t-1}$, y $y_{t-1}$ influye en $y_t$. La correlación entre $y_t$ y $y_{t-2}$ es un efecto **indirecto** que viaja por $y_{t-1}$: con $\phi = 0.8$, el rezago 2 hereda $0.8 \times 0.8 = 0.64$.

- La **ACF** mide la correlación **total** (directa + indirecta).
- La **PACF** mide solo la parte **directa**: la relación que queda entre $y_t$ y $y_{t-k}$ después de descontar los rezagos intermedios $y_{t-1}, \dots, y_{t-k+1}$.
:::

### La PACF (autocorrelación parcial) {#pacf}

:::definicion Autocorrelación parcial
La PACF en el rezago $k$, $\tip{phikk}{\phi_{kk}}$, es el **último coeficiente** de la regresión de $y_t$ sobre sus $k$ primeros rezagos:

$$y_t = \phi_{k1}\,y_{t-1} + \phi_{k2}\,y_{t-2} + \dots + \tip{phikk}{\phi_{kk}}\,y_{t-k} + e_t$$

Como los rezagos intermedios están en la regresión, $\phi_{kk}$ mide el efecto de $y_{t-k}$ **manteniendo fijos** los demás. En el rezago 1 no hay intermedios, así que $\phi_{11} = \rho(1)$.
:::

:::demo La PACF del rezago 2 en función de la ACF {#pacf-2}
Trabajamos con la serie centrada (media 0) y la regresión de orden 2: $y_t = \phi_{21}\,y_{t-1} + \phi_{22}\,y_{t-2} + e_t$, donde $e_t$ no está correlacionado con $y_{t-1}$ ni con $y_{t-2}$.

:::pasos
= \E[y_t\,y_{t-1}] = \phi_{21}\,\E[y_{t-1}^2] + \phi_{22}\,\E[y_{t-2}\,y_{t-1}]
> Multiplicamos la regresión por $y_{t-1}$ y tomamos esperanza; el término $\E[e_t y_{t-1}] = 0$.
= \gamma(1) = \phi_{21}\,\gamma(0) + \phi_{22}\,\gamma(1) \;\Longrightarrow\; \rho_1 = \phi_{21} + \phi_{22}\,\rho_1
> Reconocemos autocovarianzas y dividimos todo entre $\gamma(0)$ (escribimos $\rho_k = \rho(k)$).
= \E[y_t\,y_{t-2}] = \phi_{21}\,\E[y_{t-1}y_{t-2}] + \phi_{22}\,\E[y_{t-2}^2] \;\Longrightarrow\; \rho_2 = \phi_{21}\,\rho_1 + \phi_{22}
> Lo mismo multiplicando por $y_{t-2}$. Estas son las **ecuaciones de Yule–Walker**.
= \phi_{21} = \rho_1\,(1 - \phi_{22})
> De la primera ecuación: $\phi_{21} = \rho_1 - \phi_{22}\rho_1$.
= \rho_2 = \rho_1^2\,(1 - \phi_{22}) + \phi_{22} = \rho_1^2 + \phi_{22}\,(1 - \rho_1^2)
> Sustituimos en la segunda y agrupamos los términos con $\phi_{22}$.
= \phi_{22} = \frac{\rho_2 - \rho_1^2}{1 - \rho_1^2}
> Despejamos. El numerador es lo que $\rho_2$ tiene **de más** respecto a lo que explicaría la cadena $\rho_1 \times \rho_1$.
:::

**Comprobación con el AR(1):** $\rho_1 = \phi$ y $\rho_2 = \phi^2$, así que $\phi_{22} = (\phi^2 - \phi^2)/(1 - \phi^2) = 0$. ✓ La PACF de un AR(1) **se corta** después del rezago 1: todo lo que hay en el rezago 2 era indirecto.
:::

:::ejemplo PACF a mano con la serie diminuta
De [[autocorr]]: $\hat\rho_1 = 0.1$ y $\hat\rho_2 = -0.6$.

:::pasos
= \hat\phi_{11} = \hat\rho_1 = 0.1
> En el rezago 1, PACF y ACF coinciden.
= \hat\phi_{22} = \frac{-0.6 - (0.1)^2}{1 - (0.1)^2} = \frac{-0.6 - 0.01}{1 - 0.01} = \frac{-0.61}{0.99} = -0.6162
> Casi toda la correlación del rezago 2 es **directa**: la cadena a través del rezago 1 solo explicaría $0.1 \times 0.1 = 0.01$.
:::

Para rezagos mayores se repite la idea con más ecuaciones (el algoritmo de **Durbin–Levinson** las resuelve de forma recursiva).
:::

```python
from statsmodels.tsa.stattools import pacf

y = np.array([2, 4, 6, 5, 3, 4], dtype=float)
print("PACF (método 'ywm', Yule-Walker con la ACF de la sección 4):", np.round(pacf(y, nlags=2, method="ywm"), 4))
```

:::duda ¿La PACF puede salir mayor que 1?
Teóricamente no, pero con el método `"yw"` (autocovarianzas divididas entre $n - k$) y pocos datos, sí puede pasar en rezagos altos. Por eso `plot_pacf` usa `"ywm"` por defecto, que siempre queda entre −1 y 1. Compruébalo en el simulador [[sim-plotacf]].
:::

### Patrones para identificar modelos {#patrones}

Para completar el cuadro necesitamos un proceso cuya ACF **se corte**: el MA(1).

:::demo ACF del MA(1): ρ(1) = θ/(1 + θ²) y luego 0 {#ma1-acf}
Modelo: $y_t = \varepsilon_t + \theta\,\varepsilon_{t-1}$, con $\varepsilon_t \sim \mathrm{RB}(0, \sigma^2)$. Su media es 0.

:::pasos
= \gamma(0) = \Var(\varepsilon_t) + \theta^2\Var(\varepsilon_{t-1}) = (1 + \theta^2)\,\sigma^2
> Choques no correlacionados: se suman las varianzas [[cov-prop]].
= \gamma(1) = \Cov(\varepsilon_t + \theta\varepsilon_{t-1},\; \varepsilon_{t-1} + \theta\varepsilon_{t-2}) = \theta\,\Var(\varepsilon_{t-1}) = \theta\,\sigma^2
> De los cuatro productos, solo el que comparte $\varepsilon_{t-1}$ no es cero.
= \gamma(k) = 0 \quad (k \ge 2)
> $y_t$ y $y_{t-k}$ ya no comparten ningún choque.
= \rho(1) = \frac{\theta\,\sigma^2}{(1 + \theta^2)\,\sigma^2} = \frac{\theta}{1 + \theta^2}, \qquad \rho(k) = 0 \;\; (k \ge 2)
> La ACF **se corta** después del rezago 1. Con $\theta = 0.5$: $\rho(1) = 0.5/1.25 = 0.4$. El máximo posible es $0.5$ (con $\theta = 1$).
:::
:::

| Proceso | ACF | PACF |
|---|---|---|
| Ruido blanco | todas ≈ 0 | todas ≈ 0 |
| AR(1), $\phi > 0$ | decae geométricamente ($\phi^k$) | **se corta** después de 1 |
| AR(1), $\phi < 0$ | decae alternando signo | se corta después de 1 (negativa) |
| AR($p$) | decae gradualmente | **se corta** después de $p$ |
| MA(1) | **se corta** después de 1 | decae gradualmente |
| MA($q$) | **se corta** después de $q$ | decae gradualmente |
| ARMA($p, q$) | decae gradualmente | decae gradualmente |
| Paseo aleatorio / tendencia | decae **muy lento** desde ≈ 1 | pico ≈ 1 en el rezago 1 |
| Estacional (periodo $s$) | picos en $s, 2s, 3s, \dots$ | pico en $s$ |

:::examen Regla rápida de la guía
- Corte claro en la **ACF** ⇒ posible componente **MA($q$)**.
- Corte claro en la **PACF** ⇒ posible componente **AR($p$)**.
- Ambas decaen gradualmente ⇒ posible **ARMA**.
- Después de ajustar un modelo, la ACF/PACF de los **residuos** no debe mostrar patrones: si quedan barras significativas, el modelo dejó señal sin capturar.
:::

:::interactivo correlograma | Galería de correlogramas
Elige un proceso y su parámetro. Verás la serie, la ACF y la PACF con sus bandas. Compara lo que ves con la tabla de arriba: con $n$ pequeño los patrones son más ruidosos; súbelo para verlos con claridad.
@@@
- **Arriba** la serie; **abajo** la ACF y la PACF (barras) con su banda $\pm 1.96/\sqrt n$. Los **rombos rosas** son los valores teóricos.
- **Barras naranjas** = fuera de la banda.
- Esta galería usa la banda fija de ruido blanco en ambas funciones. `plot_acf` de statsmodels usa por defecto la de Bartlett, que se ensancha: compáralas en el simulador [[sim-plotacf]].
:::

:::definicion Cómo leer ACF y PACF en la práctica
1. **Grafica la serie.** Si tiene tendencia o la ACF decae muy lento, primero transforma o diferencia [[diferenciacion]].
2. **Busca estacionalidad**: picos en $s, 2s, \dots$ ⇒ diferencia estacional.
3. Con la serie ya estacionaria, mira **dónde se corta** cada función (ACF ⇒ $q$, PACF ⇒ $p$).
4. Ignora barras aisladas en rezagos altos (5% de falsas alarmas) y confirma con **Ljung–Box** [[ljung-box]].
:::

## 📦 La prueba de Ljung–Box {#ljung-box}
@mapa Prueba conjunta de autocorrelación: la fórmula parte por parte, cálculo a mano y cómo elegir h.

### ¿Por qué una prueba conjunta? {#lb-por-que}

:::demo Revisar barra por barra produce falsas alarmas {#falsas-alarmas}
Supón que la serie es ruido blanco y revisas 20 rezagos, cada uno con 5% de probabilidad de salir de la banda por azar (y, para simplificar, independientes entre sí).

:::pasos
= P(\text{una barra queda dentro}) = 0.95
> Complemento del 5%.
= P(\text{las 20 quedan dentro}) = 0.95^{20} = 0.3585
> Eventos independientes: se multiplican las probabilidades.
= P(\text{al menos una sale}) = 1 - 0.95^{20} = 0.6415
> Complemento: ¡casi dos de cada tres veces verías alguna barra «significativa» en ruido puro!
:::
:::

Ljung–Box resume **todas** las autocorrelaciones hasta el rezago $h$ en un solo número y una sola decisión.

### La fórmula parte por parte {#lb-formula}

:::definicion Estadístico de Ljung–Box
$$\tip{Q}{Q} = \tip{n}{n}\,(n + 2)\sum_{k=1}^{\tip{h}{h}} \frac{\hat\rho(k)^2}{n - k} \;\;\overset{H_0}{\sim}\;\; \chi^2_{h}$$

- $\hat\rho(k)^2$: cada autocorrelación **al cuadrado** (así las negativas también suman evidencia).
- $\frac{1}{n-k}$: da más peso a los rezagos altos, que se estiman con menos parejas [[rezago]].
- $n(n+2)$: escala la suma para que, bajo $H_0$, siga una $\chi^2$.
- $h$: cuántos rezagos se evalúan juntos; son los grados de libertad.

$$H_0: \rho(1) = \rho(2) = \dots = \rho(h) = 0 \quad(\text{no hay autocorrelación}) \qquad H_1: \text{alguna es distinta de 0}$$

Regla: **p-value < 0.05 ⇒ hay dependencia temporal significativa**.
:::

:::demo De dónde sale la ji-cuadrada {#lb-chi2}
:::pasos
= \sqrt{n}\;\hat\rho(k) \approx N(0, 1)
> Bajo ruido blanco, $\hat\rho(k) \approx N(0, 1/n)$ [[bartlett]]; multiplicar por $\sqrt n$ estandariza [[normal]].
= n\,\hat\rho(k)^2 \approx \chi^2_1
> Una normal estándar al cuadrado es, por definición, una $\chi^2$ con 1 grado de libertad.
= Q_{BP} = n\sum_{k=1}^{h}\hat\rho(k)^2 \approx \chi^2_h
> Las $\hat\rho(k)$ de rezagos distintos son aproximadamente independientes: la suma de $h$ ji-cuadradas de 1 g.l. es una $\chi^2_h$. Este es el estadístico de **Box–Pierce**.
= \Var\big(\hat\rho(k)\big) \approx \frac{n - k}{n(n+2)} \;\Longrightarrow\; Q = n(n+2)\sum_{k=1}^{h}\frac{\hat\rho(k)^2}{n - k}
> Con muestras pequeñas la varianza exacta es un poco menor que $1/n$; Ljung y Box estandarizan con ella y la aproximación $\chi^2_h$ mejora mucho.
:::
:::

### Ljung–Box calculada a mano {#lb-mano}

:::guiado (a) La serie diminuta, h = 2
Con $n = 6$, $\hat\rho(1) = 0.1$ y $\hat\rho(2) = -0.6$ [[guia-acf]]:

| $k$ | $\hat\rho(k)$ | $\hat\rho(k)^2$ | $n - k$ | $\hat\rho(k)^2/(n-k)$ |
|---|---|---|---|---|
| 1 | 0.1 | 0.01 | 5 | 0.002 |
| 2 | −0.6 | 0.36 | 4 | 0.09 |
| **Suma** | | | | 0.092 |
---
= \hat\rho(k)^2 = (0.01,\; 0.36)
> Al cuadrado, para que la correlación negativa también cuente como evidencia.
@ usa c2[1-2]; da c3[1-2]
= n - k = (6 - 1,\; 6 - 2) = (5,\; 4)
> Cuántas parejas hay en cada rezago.
@ usa c1[1-2]; da c4[1-2]
= \frac{0.01}{5} = 0.002, \qquad \frac{0.36}{4} = 0.09, \qquad \text{suma} = 0.092
> Cada cuadrado entre su número de parejas; casi todo viene del rezago 2.
@ usa c3[1-2] c4[1-2]; da c5[1-3]
= Q = n(n+2)\cdot 0.092 = 6 \cdot 8 \cdot 0.092 = 4.416
> Multiplicamos por $n(n+2) = 48$.
@ usa c5[3]
= \text{p-value} = P(\chi^2_2 > 4.416) = e^{-4.416/2} = e^{-2.208} = 0.1099
> Con 2 grados de libertad la cola de la $\chi^2$ tiene fórmula exacta: $P(\chi^2_2 > q) = e^{-q/2}$.
= 0.1099 > 0.05 \;\Longrightarrow\; \text{no se rechaza } H_0
> Con solo 6 datos no hay evidencia suficiente, aunque $\hat\rho(2) = -0.6$ parezca grande. (El valor crítico es $\chi^2_{2;\,0.95} = 5.991$.)
:::

:::guiado (b) n = 100 y tres autocorrelaciones
| $k$ | $\hat\rho(k)$ | $\hat\rho(k)^2$ | $n - k$ | $\hat\rho(k)^2/(n-k)$ |
|---|---|---|---|---|
| 1 | 0.30 | 0.09 | 99 | 0.000909 |
| 2 | 0.10 | 0.01 | 98 | 0.000102 |
| 3 | −0.05 | 0.0025 | 97 | 0.000026 |
| **Suma** | | | | 0.001037 |
---
= \hat\rho(k)^2 = (0.09,\; 0.01,\; 0.0025)
> Cuadrados de las tres autocorrelaciones.
@ usa c2[1-3]; da c3[1-3]
= n - k = (99,\; 98,\; 97)
> Con $n = 100$ casi no cambian entre rezagos.
@ usa c1[1-3]; da c4[1-3]
= 0.000909 + 0.000102 + 0.000026 = 0.001037
> Sumamos las tres contribuciones.
@ usa c3[1-3] c4[1-3]; da c5[1-4]
= Q = 100 \cdot 102 \times 0.001037 = 10.58
> Multiplicamos por $n(n+2) = 10200$.
@ usa c5[4]
= 10.58 > 7.815 = \chi^2_{3;\,0.95} \;\Longrightarrow\; \text{se rechaza } H_0 \;(\text{p-value} = 0.014)
> Hay autocorrelación significativa, sobre todo por el rezago 1.
@ usa c5[1]
:::

```python
from statsmodels.stats.diagnostic import acorr_ljungbox
from scipy.stats import chi2

print(acorr_ljungbox(np.array([2, 4, 6, 5, 3, 4.]), lags=[2]))
Q = 100 * 102 * (0.30**2 / 99 + 0.10**2 / 98 + 0.05**2 / 97)
print(f"\nCaso (b): Q = {Q:.3f}   p-value = {chi2.sf(Q, 3):.4f}   crítico 5% = {chi2.ppf(0.95, 3):.3f}")
```

### ¿Qué h usar? Y cómo se aplica a residuos {#lb-h}

| Situación | $h$ recomendado |
|---|---|
| Serie no estacional | $h = 10$ (o $\min(10,\, n/5)$) |
| Serie estacional de periodo $s$ | $h = 2s$ (24 en mensuales) |
| Regla alternativa | $h \approx \ln(n)$ |

- Un $h$ **muy pequeño** puede no ver autocorrelaciones en rezagos lejanos (por ejemplo, la estacional en 12).
- Un $h$ **muy grande** diluye la evidencia entre muchos rezagos sin señal y pierde potencia.
- Al aplicar Ljung–Box a los **residuos** de un ARMA($p, q$) se restan los parámetros estimados de los grados de libertad: $\chi^2_{h - p - q}$ (lo verás en la Unidad II).

:::cuidado Estacionaria no es lo mismo que ruido blanco
Un AR(1) con $\phi = 0.5$ es **estacionario** [[ar1]], pero **sí** tiene autocorrelación: Ljung–Box la rechaza. Las pruebas ADF/KPSS responden «¿es estable?»; Ljung–Box responde «¿tiene memoria lineal?». Un buen modelo deja **residuos** que pasan ambas: estables y sin memoria.
:::

```python
rng = np.random.default_rng(3)
rb = rng.normal(size=200)
ar = np.zeros(200)
for t in range(1, 200):
    ar[t] = 0.5 * ar[t - 1] + rb[t]
print("Ruido blanco:"); print(acorr_ljungbox(rb, lags=[5, 10]))
print("AR(1) con φ = 0.5 (estacionario):"); print(acorr_ljungbox(ar, lags=[5, 10]))
```

:::interactivo ljungbox | Ljung–Box paso a paso
Las barras muestran cuánto aporta cada rezago a $Q$; la línea, cómo se acumula $Q$ hasta el rezago $h$, comparada con el valor crítico de la $\chi^2_h$. Cambia $\phi$ (0 = ruido blanco) y $h$.
@@@
- **Barras azules**: lo que aporta cada rezago, $n(n+2)\hat\rho(k)^2/(n-k)$.
- **Línea rosa**: $Q$ acumulado hasta el rezago $k$. **Línea gris discontinua**: el crítico $\chi^2_k$ al 95%.
- **Qué buscar**: si en $k = h$ la línea rosa está **arriba** de la gris, se rechaza $H_0$.
:::

:::interactivo py-ljungbox | Simulador: `acorr_ljungbox` con sus parámetros {#sim-ljungbox}
Prueba `lags` como entero o como lista, agrega Box–Pierce y cambia `model_df` (lo que usarás con los residuos de un modelo en la Unidad II).
@@@
- **Salida**: el `DataFrame` que devuelve statsmodels: una fila por cada $h$ con `lb_stat` (Q) y `lb_pvalue`; con `boxpierce=True` agrega `bp_stat` y `bp_pvalue`.
- **Gráfica**: p-value para cada $h$; la línea gris es 0.05. Con `model_df` > 0, los primeros $h \le$ `model_df` no tienen p-value (grados de libertad ≤ 0).
:::

| Situación | `lags` | `boxpierce` | `model_df` |
|---|---|---|---|
| Serie no estacional | 10 | False | 0 |
| Serie mensual | `[12, 24]` o 24 | False | 0 |
| Residuos de un ARMA(p, q) | 10 (o 24 si es mensual) | False | p + q |
| Comparar con un libro antiguo | el que use el libro | True | según el caso |

:::duda ¿Por qué el p-value cambia tanto con h?
Porque $Q$ suma las autocorrelaciones **hasta** $h$. Si la autocorrelación está en el rezago 1, con $h$ pequeño se detecta fácil; con $h$ muy grande se «diluye» entre muchos rezagos sin señal y el p-value sube. Si está en el rezago 12, con $h < 12$ la prueba ni siquiera la ve. Por eso se eligen valores de $h$ que cubran los rezagos donde esperas estructura.
:::

```python
res = acorr_ljungbox(final, lags=[12, 24], boxpierce=True)
print(res.round(4))
```

:::resumen Lo esencial de las secciones 7 y 8
- ACF: correlación total; PACF: correlación directa ($\phi_{kk}$ = último coeficiente de la regresión de orden $k$).
- Bandas: $\pm 1.96/\sqrt n$ (Bartlett las ensancha con el rezago).
- AR($p$): PACF se corta en $p$. MA($q$): ACF se corta en $q$. Raíz unitaria: ACF decae muy lento.
- Ljung–Box: $Q = n(n+2)\sum_{k=1}^h \hat\rho(k)^2/(n-k) \sim \chi^2_h$; p-value < 0.05 ⇒ hay autocorrelación.
:::
