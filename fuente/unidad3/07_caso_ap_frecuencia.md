## ✈️ AirPassengers en el dominio de la frecuencia {#ap-frecuencia}
@mapa La serie de las unidades I y II vista con el periodograma: qué hace cada transformación con el espectro, por qué aparecen armónicos de 1/12, cómo se descompone el patrón estacional en oscilaciones y cómo luce el espectro del modelo de aerolínea.

### El espectro de cada transformación {#ap-transformaciones}

En la Unidad I transformamos AirPassengers en cuatro pasos (logaritmo, diferencia regular y diferencia estacional) para volverla estacionaria [[u1:caso-transformar]]. El periodograma muestra qué quita cada paso:

```python
transformaciones = {"log": log_serie.values,
                    "log sin tendencia": signal.detrend(log_serie.values),
                    "Δ log": np.diff(log_serie.values),
                    "ΔΔ₁₂ log": np.diff(log_serie.values[12:] - log_serie.values[:-12])}
for nombre, s in transformaciones.items():
    f, P = signal.periodogram(s)
    lento = P[f < 1 / 24].sum() / P.sum()                       # periodos de más de 2 años
    estac = [P[np.argmin(np.abs(f - k / 12))] / P.max() for k in range(1, 7)]
    print(f"{nombre:18s} pico en periodo {1 / f[P.argmax()]:6.1f} | potencia en ω < 1/24: {lento:6.1%} | P(k/12)/máx: {np.round(estac, 2)}")
```

| Serie | Lo que domina el periodograma | Qué significa |
|---|---|---|
| $\ln y_t$ | Frecuencias casi cero (83% de la potencia en periodos de más de 2 años) | La tendencia lo tapa todo |
| $\ln y_t$ sin tendencia lineal | Pico en $1/12$ y otro en $2/12$ | Estacionalidad anual con un armónico |
| $\Delta\ln y_t$ | Picos en $1/12, 2/12, 3/12, 4/12, 5/12$ | La tendencia desapareció; la estacionalidad quedó, con todos sus armónicos |
| $\Delta\Delta_{12}\ln y_t$ | Sin picos dominantes | Ni tendencia ni estacionalidad: parece ruido con algo de estructura MA |

:::interactivo w3-ap-espectro | El espectro de AirPassengers paso a paso {#w-ap-espectro}
Elige la transformación y el suavizado. Las líneas verticales marcan las frecuencias estacionales $k/12$.
@@@
- **Arriba**: la serie transformada.
- **Abajo**: el periodograma (puntos) y su versión suavizada (curva) en escala logarítmica, con las líneas en $k/12$, $k = 1, \dots, 6$.
- Con el logaritmo sin diferenciar, la potencia de la tendencia se fuga y tapa casi todo. Con $\Delta$ aparecen los «dientes» estacionales. Con $\Delta\Delta_{12}$ desaparecen: la diferencia estacional los borró (la razón está en [[diferencia-filtro]]).
- **Vista extra**: la tabla con la altura relativa en cada $k/12$ y la fracción de potencia en periodos largos.
:::

### ¿Por qué aparecen armónicos? {#armonicos}

Un patrón que se repite exactamente cada 12 meses pero **no** tiene forma de coseno (sube en verano, baja en noviembre, con un segundo pico en marzo) necesita varias oscilaciones para describirse: la de periodo 12 y sus **armónicos**, de periodos 6, 4, 3, 2.4 y 2.

:::demo Todo patrón de periodo $s$ es una suma de $s/2$ armónicos {#demo-armonicos}
:::pasos
= s_1, s_2, \dots, s_{12}, \qquad s_{t+12} = s_t, \qquad \sum_{t=1}^{12}s_t = 0
> Un patrón estacional mensual: doce valores que se repiten y suman cero (los efectos de cada mes respecto al promedio).
= s_t = \sum_{k=1}^{6}\big[\beta_{k1}\cos(2\pi k t/12) + \beta_{k2}\sin(2\pi k t/12)\big]
> La DFT de esos doce números: once coeficientes libres (seis cosenos y cinco senos, porque $\sin(\pi t) = 0$) para once valores libres. La representación es **exacta**.
= \frac{1}{12}\sum_{t=1}^{12}s_t^2 = \sum_{k=1}^{5}\frac{A_k^2}{2} + A_6^2
> Parseval: la varianza del patrón se reparte entre los armónicos (el de periodo 2 solo tiene coseno).
= \omega = \frac{k}{12}, \quad k = 1, \dots, 6
> Por eso los picos de una serie estacional aparecen en $1/12, 2/12, \dots, 6/12$: son las frecuencias del patrón, no ciclos distintos.
:::
:::

:::guiado El primer armónico del patrón estacional de AirPassengers {#guia-armonicos}
| Mes | $t$ | $s_t$ | $\cos(2\pi t/12)$ | $\sin(2\pi t/12)$ | $s_t\cos$ | $s_t\sin$ |
|---|---|---|---|---|---|---|
| ene | 1 | −0.0858 | 0.866 | 0.5 | −0.0743 | −0.0429 |
| feb | 2 | −0.1144 | 0.5 | 0.866 | −0.0572 | −0.0991 |
| mar | 3 | 0.0181 | 0 | 1 | 0 | 0.0181 |
| abr | 4 | −0.0130 | −0.5 | 0.866 | 0.0065 | −0.0113 |
| may | 5 | −0.0090 | −0.866 | 0.5 | 0.0078 | −0.0045 |
| jun | 6 | 0.1154 | −1 | 0 | −0.1154 | 0 |
| jul | 7 | 0.2108 | −0.866 | −0.5 | −0.1826 | −0.1054 |
| ago | 8 | 0.2045 | −0.5 | −0.866 | −0.1023 | −0.1771 |
| sep | 9 | 0.0648 | 0 | −1 | 0 | −0.0648 |
| oct | 10 | −0.0753 | 0.5 | −0.866 | −0.0377 | 0.0652 |
| nov | 11 | −0.2158 | 0.866 | −0.5 | −0.1869 | 0.1079 |
| dic | 12 | −0.1003 | 1 | 0 | −0.1003 | 0 |
| suma | | 0 | | | −0.8423 | −0.3138 |
---
= s_t = \text{promedio del mes de }\big(\ln y_t - \text{media móvil } 2\times 12\big)
> El patrón estacional en logaritmos: julio está 21% arriba del promedio y noviembre 22% abajo (como en la descomposición de la Unidad I [[u1:descomposicion]]).
@ usa c3[1-12]
= \beta_1 = \frac{2}{12}(-0.8423) = -0.1404, \qquad \beta_2 = \frac{2}{12}(-0.3138) = -0.0523
> Los coeficientes de la oscilación de periodo 12 [[demo-fase-regresion]].
@ usa c6[1-12] c7[1-12]; da c6[13] c7[13]
= A_1 = \sqrt{0.1404^2 + 0.0523^2} = 0.1498, \qquad \frac{A_1^2}{2} = 0.01122
> La amplitud del primer armónico: ±15% alrededor del promedio.
@ usa c6[13] c7[13]
= \frac{0.01122}{0.01559} = 72\%
> El patrón tiene varianza 0.01559; el primer armónico explica el 72%. El segundo (periodo 6) explica 20%, y los otros cuatro juntos, el 8% restante.
= \varphi = \operatorname{atan2}(0.0523,\ -0.1404) = 2.784 \;\Rightarrow\; t_{\max} = 12\,\frac{2\pi - 2.784}{2\pi} = 6.7
> El máximo del primer armónico cae entre julio y agosto: justo la temporada alta de vacaciones.
:::

El mismo proceso con el **segundo** armónico ($k = 2$, periodo de 6 meses) explica de dónde sale el 20%:

:::guiado El segundo armónico: dos máximos por año {#guia-armonico2}
| Mes | $t$ | $s_t$ | $\cos(2\pi\cdot 2t/12)$ | $\sin(2\pi\cdot 2t/12)$ | $s_t\cos$ | $s_t\sin$ |
|---|---|---|---|---|---|---|
| ene | 1 | −0.0858 | 0.5 | 0.866 | −0.0429 | −0.0743 |
| feb | 2 | −0.1144 | −0.5 | 0.866 | 0.0572 | −0.0991 |
| mar | 3 | 0.0181 | −1 | 0 | −0.0181 | 0 |
| abr | 4 | −0.0130 | −0.5 | −0.866 | 0.0065 | 0.0113 |
| may | 5 | −0.0090 | 0.5 | −0.866 | −0.0045 | 0.0078 |
| jun | 6 | 0.1154 | 1 | 0 | 0.1154 | 0 |
| jul | 7 | 0.2108 | 0.5 | 0.866 | 0.1054 | 0.1826 |
| ago | 8 | 0.2045 | −0.5 | 0.866 | −0.1023 | 0.1771 |
| sep | 9 | 0.0648 | −1 | 0 | −0.0648 | 0 |
| oct | 10 | −0.0753 | −0.5 | −0.866 | 0.0377 | 0.0652 |
| nov | 11 | −0.2158 | 0.5 | −0.866 | −0.1079 | 0.1869 |
| dic | 12 | −0.1003 | 1 | 0 | −0.1003 | 0 |
| suma | | 0 | | | −0.1186 | 0.4574 |
---
= \omega = 2/12 = 1/6: \quad \cos(2\pi\cdot 2t/12) = \cos(\pi t/3)
> Una oscilación que da dos vueltas por año: sus valores se repiten cada 6 meses (compara enero con julio).
@ usa c4[1-12] c5[1-12]
= \sum s_t\cos(\pi t/3) = -0.1186, \qquad \sum s_t\sin(\pi t/3) = 0.4574
> Los mismos doce valores del patrón, ahora contra el coseno y el seno de periodo 6.
@ usa c3[1-12] c4[1-12] c5[1-12]; da c6[1-13] c7[1-13]
= \beta_1 = \tfrac{2}{12}(-0.1186) = -0.0198, \qquad \beta_2 = \tfrac{2}{12}(0.4574) = 0.0762
> Los coeficientes del segundo armónico.
@ usa c6[13] c7[13]
= A_2 = \sqrt{0.0198^2 + 0.0762^2} = 0.0788, \qquad \frac{A_2^2}{2} = 0.00310 = 19.9\%\ \text{de } 0.01559
> Un armónico de ±8%. Con el primero (72%) ya suman el 92% de la varianza del patrón.
@ usa c6[13] c7[13]
= \varphi_2 = \operatorname{atan2}(-0.0762,\ -0.0198) = -1.824 \;\Rightarrow\; t_{\max} = \frac{12}{4\pi}\,(1.824 + 2\pi m) = 1.7 \text{ y } 7.7
> Dos máximos al año, a finales de febrero y de julio. Sumado al primer armónico (máximo en 6.7), el pico de verano se vuelve más agudo y aparece la pequeña subida de marzo: la forma que un solo coseno no puede dar.
= \text{armónicos 3 a 6}: 2.6\% + 3.9\% + 1.6\% + 0.1\% = 8.1\%
> Los detalles finos. El de periodo 2 casi no aporta: el patrón no alterna mes a mes.
:::

:::ejemplo ¿Cuántos armónicos tiene cada estacionalidad?
Un patrón de periodo $s$ tiene $s - 1$ valores libres (suman cero), y cada armónico aporta dos coeficientes, salvo el de Nyquist, que solo tiene coseno:
- **Trimestral** ($s = 4$): armónicos en $1/4$ (periodo 4) y $2/4 = 1/2$ (periodo 2). Dos coeficientes más uno: tres valores libres.
- **Semanal en datos diarios** ($s = 7$): $1/7$, $2/7$ y $3/7$, con periodos de 7, 3.5 y 2.33 días. Como 7 es impar, no hay armónico de Nyquist: $3 \times 2 = 6$ valores libres.
- **Diario en datos horarios** ($s = 24$): doce armónicos, de 24 horas hasta 2 horas.
- **Anual en datos semanales** ($s = 52$): 26 armónicos. Aquí se nota la ventaja de Fourier: con $K = 3$ armónicos (6 coeficientes) se describe casi cualquier patrón anual suave, en lugar de 51 variables indicadoras.
:::

:::interactivo w3-armonicos | Reconstruye el patrón estacional con armónicos {#w-armonicos}
Suma los armónicos uno por uno y mira cuánto del patrón de AirPassengers reproducen.
@@@
- **Arriba**: el patrón estacional (puntos, enero a diciembre) y su reconstrucción con los primeros $K$ armónicos (curva).
- **Abajo**: el porcentaje de la varianza del patrón que explica cada armónico; las barras activas están en color.
- Con $K = 2$ ya se explica el 92%: por eso en modelos con estacionalidad larga (semanal en datos diarios, anual en datos semanales) se usan **términos de Fourier** con pocos armónicos en lugar de 52 variables indicadoras [[u2:festivos]].
- **Vista extra**: la tabla de amplitudes, fases y mes del máximo de cada armónico.
:::

### El espectro del modelo de aerolínea {#espectro-aerolinea}

El modelo de la Unidad II para $\Delta\Delta_{12}\ln y_t$ es un MA doble: $w_t = (1 + \theta L)(1 + \Theta L^{12})\varepsilon_t$ [[u2:aerolinea]]. Su espectro, con la fórmula del ARMA [[espectro-arma]], es

$$f_w(\omega) = \sigma^2\,\lvert 1 + \theta e^{-2\pi i\omega}\rvert^2\,\lvert 1 + \Theta e^{-24\pi i\omega}\rvert^2$$

Con las estimaciones de la Unidad II ($\theta = -0.3485$, $\Theta = -0.5624$, $\sigma^2 = 0.001312$), el segundo factor vale $(1 + \Theta)^2 = 0.19$ en las frecuencias $k/12$ y $(1 - \Theta)^2 = 2.44$ a la mitad entre ellas: el espectro tiene **valles** en las frecuencias estacionales. Es la huella de haber diferenciado estacionalmente: la diferencia $\Delta_{12}$ quitó potencia en $k/12$ (en realidad, toda), y el MA estacional con $\Theta < 0$ la devuelve solo en parte.

```python
theta, Theta, s2 = -0.3485, -0.5624, 0.001312           # estimaciones de la Unidad II (entrenamiento 1949–1959)
w = np.array([0, 1 / 24, 1 / 12, 1 / 8, 1 / 6, 1 / 4, 1 / 2])
z = np.exp(-2j * np.pi * w)
f_aerolinea = s2 * np.abs(1 + theta * z) ** 2 * np.abs(1 + Theta * z ** 12) ** 2
for wi, fi in zip(w, f_aerolinea):
    print(f"ω = {wi:.4f} (periodo {1 / wi if wi else np.inf:5.1f}): f = {fi:.6f}")
```

:::duda Si la diferencia estacional borra los picos, ¿ya no hay estacionalidad?
En $\Delta\Delta_{12}\ln y_t$ no queda estacionalidad **determinística** (el patrón fijo se eliminó); lo que modela el término $\Theta$ es la forma en que el patrón **cambia** de un año a otro. Por eso el pronóstico del SARIMA sí tiene estacionalidad: al deshacer la diferencia estacional, el patrón del último año se vuelve a sumar [[u2:arima-pronostico]].
:::

:::duda Si uso términos de Fourier en un modelo, ¿cuántos armónicos $K$ pongo?
Los que pida el patrón, no todos. El espectro y la tabla de Parseval del patrón dan una primera respuesta (en AirPassengers, $K = 2$ explica el 92%); después se comparan modelos con $K = 1, 2, 3, \dots$ con el AIC [[u2:aic-def]], porque cada armónico agrega dos parámetros. Con estacionalidades largas (semanal en datos diarios, anual en datos semanales) suele bastar con $K$ entre 2 y 5.
:::

:::resumen Lo que debes llevarte de AirPassengers en frecuencia
- Sin diferenciar, la tendencia concentra la potencia cerca de $\omega = 0$ y tapa el resto.
- Una estacionalidad mensual produce picos en $k/12$, $k = 1, \dots, 6$: son los **armónicos** de un patrón que no es un coseno puro.
- El patrón de AirPassengers: 72% en el armónico de 12 meses y 20% en el de 6; su máximo cae entre julio y agosto.
- $\Delta\Delta_{12}\ln y_t$ no tiene picos; el espectro del modelo de aerolínea tiene **valles** en $k/12$.
:::
