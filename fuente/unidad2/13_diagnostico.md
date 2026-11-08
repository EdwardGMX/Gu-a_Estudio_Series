## 🩺 Diagnóstico de residuos {#diagnostico}
@mapa Qué debe cumplir un buen residuo, Ljung–Box con model_df, Jarque–Bera, la prueba H y ARCH-LM, plot_diagnostics panel por panel, los primeros residuos que hay que descartar y cuatro casos típicos.

### Qué deben cumplir los residuos {#residuos-que}

La guía oficial: *después de estimar ARIMA, SARIMA o SARIMAX, revisa los residuos. Un buen modelo debe dejar residuos sin autocorrelación, con media cercana a cero y varianza aproximadamente constante*. Si los residuos tienen autocorrelación, **el modelo todavía no capturó toda la dinámica**.

| Lo que se revisa | Herramienta | Si falla… |
|---|---|---|
| Sin autocorrelación | Ljung–Box, ACF de residuos | falta un término AR/MA (mira en qué rezago está el pico) |
| Media cero, sin patrones | gráfica de residuos en el tiempo | falta tendencia, quiebre o una exógena |
| Normalidad | Jarque–Bera, histograma, Q-Q plot | atípicos o colas pesadas: los intervalos con ±1.96 fallan |
| Varianza constante | prueba H, ARCH-LM, residuos al cuadrado | transformar (log, Box–Cox) o modelar la varianza [[arch]] |

:::intuicion Otra forma de verlo: los residuos son lo que «sobró»
Piensa en el modelo como un filtro que debería sacar de la serie todo lo predecible. Lo que queda (los residuos) debe ser **ruido blanco** [[ruido-blanco2]]. Cada prueba busca un tipo distinto de «basura» que el filtro dejó pasar: memoria (Ljung–Box), forma rara (Jarque–Bera) o volatilidad cambiante (H, ARCH-LM).
:::

### Primero: descarta los residuos iniciales {#residuos-iniciales}

Con diferencias, statsmodels no tiene datos anteriores para calcular los primeros $d + sD$ residuos y los inicializa de forma «difusa». Esos residuos no significan nada y **contaminan** cualquier prueba.

```python
print("Primeros 14 residuos del modelo de aerolínea:")
print(np.round(ajuste_def.resid.values[:14], 4))
print("Observaciones quemadas:", ajuste_def.loglikelihood_burn)
residuos = ajuste_def.resid.iloc[ajuste_def.loglikelihood_burn:]       # ← los que se analizan
print("Residuos útiles:", len(residuos), "| media:", round(residuos.mean(), 5), "| desv. est.:", round(residuos.std(), 4))
```

:::cuidado El primer residuo es el primer dato
El residuo 1 vale 4.7185, que es $\ln 112$: el primer dato completo. El residuo 13 vale −2.385, otro valor absurdo producido por la inicialización estacional. Si los dejas, Jarque–Bera rechaza la normalidad y Ljung–Box puede marcar autocorrelación que no existe. El `summary()` y `plot_diagnostics()` ya los descartan; **tú debes hacerlo** cuando llames a `acorr_ljungbox` o `het_arch` directamente.
:::

### Ljung–Box sobre residuos: el argumento `model_df` {#lb-residuos}

Ya conoces la prueba [[u1:ljung-box]]: $Q = n(n + 2)\sum_{k=1}^{h}\frac{\hat\rho_k^2}{n - k}$, con $H_0$: no hay autocorrelación hasta el rezago $h$. Sobre residuos hay un ajuste importante.

:::definicion Grados de libertad de Ljung–Box en residuos
Si los residuos vienen de un modelo con $p + q + P + Q$ coeficientes ARMA estimados,

$$Q \sim \chi^2\big(h - (p + q + P + Q)\big) \quad \text{bajo } H_0$$

En statsmodels: `acorr_ljungbox(residuos, lags=[h], model_df=p + q + P + Q)`. Se necesita $h > $ `model_df`.
:::

:::intuicion Otra forma de verlo: ¿por qué se restan grados de libertad?
Al estimar los coeficientes, el modelo elige justo los valores que **hacen chicas** las primeras autocorrelaciones de los residuos. Los residuos parecen más «blancos» de lo que serían con los parámetros verdaderos, así que $Q$ tiende a salir pequeño. Restar grados de libertad compensa ese favor: la distribución de referencia se corre a la izquierda y la prueba vuelve a tener el 5% de falsas alarmas que promete.
:::

:::guiado El efecto de model_df en el modelo de aerolínea {#guia-model-df}
| $h$ | $Q$ | p sin `model_df` ($\chi^2_h$) | p con `model_df=2` ($\chi^2_{h-2}$) |
|---|---|---|---|
| 12 | 6.843 | 0.868 | 0.740 |
| 24 | 18.593 | 0.773 | 0.670 |
---
= Q(12) = 6.843 \text{ con } \chi^2_{12}: \;\; p = 0.868
> Sin corregir: compara con 12 grados de libertad.
@ usa c2[1]; da c3[1]
= Q(12) = 6.843 \text{ con } \chi^2_{10}: \;\; p = 0.740
> Con `model_df=2` ($\theta$ y $\Theta$): 10 grados de libertad. El p-value baja, porque la corrección es más exigente.
@ usa c2[1]; da c4[1]
= Q(24) = 18.593 \text{ con } \chi^2_{22}: \;\; p = 0.670
> Con 24 rezagos (dos años) tampoco hay autocorrelación. El modelo capturó la dinámica regular y la estacional.
@ usa c2[2]; da c4[2]
= p > 0.05 \text{ en todos los casos} \Rightarrow \text{no se rechaza } H_0
> Conclusión: residuos sin autocorrelación. (Si el p-value estuviera cerca de 0.05, la corrección sí cambiaría la decisión).
@ usa c4[1-2]
:::

```python
print(acorr_ljungbox(residuos, lags=[12, 24], model_df=2))
```

### Jarque–Bera: ¿son normales? {#jarque-bera}

:::definicion Prueba de Jarque–Bera
$$\JB = \frac{n}{6}\left[\tip{S-skew}{S}^2 + \frac{(\tip{K-kurt}{K} - 3)^2}{4}\right] \sim \chi^2(2) \quad \text{bajo } H_0: \text{normalidad}$$

- $S = \frac{m_3}{m_2^{3/2}}$: asimetría; $K = \frac{m_4}{m_2^2}$: curtosis, con $m_r = \frac1n\sum(e_t - \bar e)^r$.
- En la normal $S = 0$ y $K = 3$: el estadístico mide qué tan lejos están de esos valores.
:::

:::guiado Jarque–Bera con diez residuos {#guia-jb}
Residuos: $(-1.2,\ 0.3,\ 0.8,\ -0.1,\ 2.5,\ -0.4,\ -0.9,\ 0.2,\ -1.0,\ -0.2)$, con media 0.

| Cantidad | Valor |
|---|---|
| $m_2 = \frac1n\sum e_t^2$ | 1.048 |
| $m_3 = \frac1n\sum e_t^3$ | 1.2642 |
| $m_4 = \frac1n\sum e_t^4$ | 4.3239 |
| $S$ | 1.1783 |
| $K$ | 3.9369 |
| JB | 2.680 |
| p-value | 0.262 |
---
= m_2 = \frac{1.44 + 0.09 + 0.64 + 0.01 + 6.25 + 0.16 + 0.81 + 0.04 + 1 + 0.04}{10} = \frac{10.48}{10} = 1.048
> Momento de orden 2 (la varianza dividida entre $n$).
@ da c2[1]
= S = \frac{m_3}{m_2^{3/2}} = \frac{1.2642}{1.048^{1.5}} = \frac{1.2642}{1.0729} = 1.1783
> Asimetría positiva: el 2.5 «jala» la cola derecha.
@ usa c2[1-2]; da c2[4]
= K = \frac{m_4}{m_2^2} = \frac{4.3239}{1.0983} = 3.9369
> Curtosis mayor que 3: colas algo pesadas (otra vez por el 2.5).
@ usa c2[1] c2[3]; da c2[5]
= \JB = \frac{10}{6}\left[1.1783^2 + \frac{0.9369^2}{4}\right] = 1.6667\,(1.3885 + 0.2194) = 2.680
> Cada parte del corchete es una «contribución»: aquí pesa más la asimetría.
@ usa c2[4-5]; da c2[6]
= p = P(\chi^2_2 > 2.680) = e^{-2.680/2} = 0.262
> Para $\chi^2$ con 2 grados de libertad la cola es exactamente $e^{-x/2}$. No se rechaza la normalidad: con 10 datos la prueba tiene poca potencia.
@ usa c2[6]; da c2[7]
:::

:::interactivo w2-jb | ¿De dónde sale el estadístico de Jarque–Bera? {#w-jb}
Genera residuos con distintas distribuciones y mira qué parte del JB viene de la asimetría y cuál de la curtosis.
@@@
- **Izquierda**: histograma y curva normal con la misma media y varianza.
- **Centro**: el Q-Q plot. Puntos sobre la recta = normal; forma de **S** = colas pesadas; curva = asimetría.
- **Derecha**: las dos contribuciones del JB ($\frac n6 S^2$ y $\frac{n}{24}(K - 3)^2$) y el valor crítico 5.99 del 5%.
- Con $n$ grande hasta desviaciones pequeñas se detectan; con $n$ chico, ni las grandes.
:::

:::duda Si Jarque–Bera rechaza, ¿el modelo no sirve?
No necesariamente. Los coeficientes y los pronósticos puntuales siguen siendo razonables; lo que falla son los **intervalos** basados en la normal (si hay colas pesadas, quedan cortos para los valores extremos). Revisa si el rechazo viene de unos pocos atípicos identificables (una huelga, un error de captura), que se pueden tratar con variables indicadoras [[festivos]].
:::

### Varianza constante: la prueba H y ARCH-LM {#prueba-h}

:::definicion Prueba H de statsmodels (breakvar)
Divide los $n$ residuos en tercios de tamaño $h = \operatorname{round}(n/3)$ y compara la varianza del último con la del primero:

$$\tip{H-het}{H} = \frac{\sum_{t = n - h + 1}^{n} e_t^2}{\sum_{t = 1}^{h} e_t^2} \sim F(h, h) \quad \text{bajo } H_0$$

$H \approx 1$: varianza estable. El p-value que imprime el `summary()` es de **dos colas**: detecta tanto aumentos ($H > 1$) como disminuciones ($H < 1$).
:::

:::definicion Prueba ARCH-LM
Regresión de los residuos al cuadrado sobre sus propios rezagos: $e_t^2 = a_0 + a_1 e_{t-1}^2 + \dots + a_q e_{t-q}^2 + u_t$.

$$\LM = n'\,\tip{R2}{R^2} \sim \chi^2(q) \quad \text{bajo } H_0: \text{sin efectos ARCH}$$

donde $n'$ son las observaciones de esa regresión. Si $R^2$ es grande, los choques grandes «anuncian» choques grandes: la volatilidad tiene memoria [[arch-lm]].
:::

```python
from statsmodels.stats.diagnostic import het_arch
lm, lm_p, f_stat, f_p = het_arch(residuos, nlags=12)
print(f"ARCH-LM con 12 rezagos: LM = {lm:.2f}, p = {lm_p:.3f}")
print("Prueba H del summary:", np.round(ajuste_def.test_heteroskedasticity("breakvar")[0], 4))
```

Las dos pruebas responden preguntas distintas. La prueba H rechaza ($H = 0.38$, p = 0.003): la varianza de los residuos **bajó** de forma gradual a lo largo de la década. ARCH-LM no rechaza (p = 0.21): no hay **rachas** de volatilidad en las que un choque grande anuncie otro. Para AirPassengers el problema es de nivel de varianza, no de volatilidad agrupada.

### `plot_diagnostics()`: los cuatro paneles {#plot-diagnostics}

```python norun
fig = ajuste_def.plot_diagnostics(figsize=(10, 7), lags=24)     # matplotlib: 4 paneles
fig.tight_layout()
```

| Panel | Qué muestra | Qué buscar |
|---|---|---|
| Arriba a la izquierda | residuos estandarizados en el tiempo | nube sin patrón alrededor de 0, sin rachas ni cambios de amplitud |
| Arriba a la derecha | histograma, densidad suavizada (KDE) y $N(0,1)$ | que las tres curvas se parezcan |
| Abajo a la izquierda | Q-Q plot normal | puntos sobre la recta, sobre todo en los extremos |
| Abajo a la derecha | correlograma de los residuos | todas las barras dentro de la banda |

:::interactivo w2-residuos | Cuatro diagnósticos típicos {#w-residuos}
Elige un caso y revisa los cuatro paneles de `plot_diagnostics` junto con la tabla de pruebas. Los dos primeros son residuos reales de modelos de la rejilla de AirPassengers; los otros dos, residuos simulados con un problema a propósito.
@@@
- **Modelo bueno** (aerolínea): nube sin patrón, histograma normal, Q-Q recto, correlograma limpio.
- **Modelo incompleto** (0,1,0)(0,1,0): picos en los rezagos 1 y 12 del correlograma; Ljung–Box rechaza. ¡Los picos dicen qué falta!
- **Atípicos**: unos pocos puntos enormes en el primer panel, colas en el Q-Q; Jarque–Bera rechaza.
- **Volatilidad agrupada (ARCH)**: rachas de residuos grandes; el correlograma de los residuos se ve limpio, pero ARCH-LM rechaza.
- **Vista extra**: la ACF de los residuos al cuadrado, donde se delata el caso ARCH.
:::

:::interactivo py2-diagnostics | Simulador: las pruebas sobre los residuos {#sim-diagnostics}
Elige los residuos (de un modelo de la rejilla) y los parámetros de cada prueba. El código y su salida se actualizan; los cálculos usan exactamente las fórmulas de statsmodels.
@@@
- `lags` y `model_df` de Ljung–Box: con `model_df` igual al número de coeficientes ARMA del modelo.
- `nlags` de ARCH-LM: con datos mensuales, 12 es un buen valor.
- Prueba el modelo incompleto y luego el de aerolínea: verás cómo un buen modelo «limpia» las tres pruebas.
:::

:::resumen Lo que debes llevarte del diagnóstico
- Descarta los primeros $d + sD$ residuos (`resid.iloc[ajuste.loglikelihood_burn:]`).
- Ljung–Box en residuos: `model_df = p + q + P + Q` y $h$ de 12 y 24 en datos mensuales.
- Jarque–Bera: $\frac n6[S^2 + (K - 3)^2/4] \sim \chi^2(2)$; rechazar afecta sobre todo a los intervalos.
- Prueba H: varianza del último tercio entre la del primero; ARCH-LM: $n'R^2$ de $e_t^2$ sobre sus rezagos.
- Un residuo con autocorrelación en el rezago $k$ te dice qué término le falta al modelo.
:::
