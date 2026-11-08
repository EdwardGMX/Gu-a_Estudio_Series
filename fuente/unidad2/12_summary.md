## 📋 Leer el `summary()` de SARIMAX {#summary}
@mapa El reporte de statsmodels renglón por renglón: encabezado, tabla de coeficientes (z, p-value e intervalo), las cuatro pruebas de abajo y los cálculos a mano que hay detrás de cada número.

En el examen práctico casi siempre te piden «ajusta el modelo e interpreta el `summary()`». Esta sección lo recorre completo con el modelo de aerolínea (valores predeterminados de `SARIMAX`).

```python
print(ajuste_def.summary())
```

:::interactivo w2-summary | El summary anotado {#w-summary}
Pasa el cursor (o toca) cualquier renglón del reporte para ver qué significa y cómo se calcula. Puedes cambiar de modelo: el reporte se reconstruye con los valores que dio statsmodels para ese modelo.
@@@
- **Amarillo**: los números del encabezado; **verde**: la tabla de coeficientes; **rosa**: las pruebas sobre los residuos.
- **Recuadro de abajo**: la explicación del renglón elegido, con la cuenta hecha con sus números.
- Compara el modelo de aerolínea con uno sobreparametrizado como (2,1,2)(1,1,1): verás coeficientes con p-values grandes y errores estándar enormes.
:::

### El encabezado {#summary-encabezado}

| Renglón | Qué dice | En el modelo de aerolínea |
|---|---|---|
| `Dep. Variable` | nombre de la serie modelada | `Passengers` (en logaritmos) |
| `No. Observations` | datos que recibió el modelo (**antes** de diferenciar) | 132 |
| `Model` | órdenes $(p, d, q)\times(P, D, Q, s)$ | `SARIMAX(0, 1, 1)x(0, 1, 1, 12)` |
| `Log Likelihood` | $\ell$ maximizada [[mv]] | 223.627 |
| `AIC`, `BIC`, `HQIC` | criterios de información [[aic-bic]] | −441.253, −432.916, −437.868 |
| `Sample` | primera y última fecha usadas | 01-1949 a 12-1959 |
| `Covariance Type` | cómo se estimaron los errores estándar [[mv-curvatura]] | `opg` |

:::cuidado La log-verosimilitud positiva no es un error
Una densidad puede valer más que 1 (por ejemplo, una normal con $\sigma = 0.036$ tiene un pico de $1/(0.036\sqrt{2\pi}) \approx 11$), así que $\ell$ puede ser positiva. Pasa casi siempre que la serie está en logaritmos y sus cambios son pequeños. Por eso AIC y BIC salen **negativos**; se siguen comparando igual: menor es mejor.
:::

### La tabla de coeficientes {#summary-coef}

:::definicion Cada columna de la tabla
Para cada parámetro $\hat\beta$ con error estándar $\operatorname{se}(\hat\beta)$:

$$z = \frac{\hat\beta}{\operatorname{se}(\hat\beta)}, \qquad \text{P>|z|} = 2\,\big(1 - \Phi(|z|)\big), \qquad [0.025,\; 0.975] = \hat\beta \pm 1.96\,\operatorname{se}(\hat\beta)$$

- `z` prueba $H_0: \beta = 0$ (el parámetro no sirve). Con $|z| > 1.96$ se rechaza al 5%.
- `P>|z|` es el p-value de esa prueba (con la normal estándar $\Phi$).
- El intervalo de 95% que **no** contiene al 0 es otra forma de decir «significativo».
:::

:::guiado Los números del renglón ma.L1, a mano {#guia-coef}
| Columna | Valor en el summary |
|---|---|
| coef | −0.3485 |
| std err | 0.081 |
| z | −4.302 |
| P>\|z\| | 0.000 |
| [0.025 | −0.507 |
| 0.975] | −0.190 |
---
= z = \frac{-0.3485}{0.0810} = -4.302
> El coeficiente está a 4.3 errores estándar de cero.
@ usa c2[1-2]; da c2[3]
= p = 2\,(1 - \Phi(4.302)) = 2\,(1 - 0.9999915) = 0.000017
> Se imprime como 0.000 porque se redondea a tres decimales. Rechazamos $H_0$: el término MA regular sí hace falta.
@ usa c2[3]; da c2[4]
= -0.3485 - 1.96(0.0810) = -0.5073, \qquad -0.3485 + 1.96(0.0810) = -0.1897
> Intervalo de 95%: no contiene al 0 (y queda dentro de $(-1, 1)$: invertible).
@ usa c2[1-2]; da c2[5-6]
= \hat\theta = -0.3485 \;\Rightarrow\; \alpha = 1 + \hat\theta = 0.65
> Interpretación: es «como» un suavizamiento exponencial que da 65% de peso al dato del mes más reciente [[demo-ses]]; el término estacional hace lo mismo con el año anterior.
@ usa c2[1]
:::

:::ejemplo Los otros dos renglones
- `ma.S.L12` = −0.5624 con $z = -0.5624/0.0944 = -5.957$: el MA estacional también es claramente significativo.
- `sigma2` = 0.0013 es la varianza de los choques en logaritmos, $\hat\sigma^2 = 0.001312$. Su error estándar sale «0.000» por el redondeo: no significa que sea exacto. Lo útil es $\hat\sigma = \sqrt{0.001312} = 0.036$: el error típico de un pronóstico a un mes es de alrededor de **3.6%**.
:::

:::duda Si un coeficiente no es significativo, ¿lo quito?
Casi siempre conviene probar el modelo sin él: si el AIC/BIC mejora (o casi no cambia) y los residuos siguen siendo ruido blanco, quédate con el modelo más sencillo. Dos excepciones: (1) no se quitan términos «intermedios» de un polinomio a la ligera (si $\phi_2$ es significativo, $\phi_1$ se queda aunque no lo sea); (2) un coeficiente no significativo en un modelo con raíces casi canceladas no es el problema, es el **síntoma**: sobran parámetros [[cancelacion]].
:::

### Las pruebas de la parte de abajo {#summary-pruebas}

Las cuatro se calculan sobre los **residuos estandarizados**, sin las primeras $d + sD = 13$ observaciones (que se pierden al diferenciar). Las veremos a fondo en [[diagnostico]]; aquí está cómo leerlas.

| Renglón | Prueba | $H_0$ | Aerolínea | Lectura |
|---|---|---|---|---|
| `Ljung-Box (L1) (Q)`, `Prob(Q)` | autocorrelación en el rezago 1 | residuos sin autocorrelación | 0.01, p = 0.93 | ✓ (pero solo revisa el rezago 1) |
| `Jarque-Bera (JB)`, `Prob(JB)` | normalidad | residuos normales | 1.15, p = 0.56 | ✓ normales |
| `Heteroskedasticity (H)`, `Prob(H)` | varianza constante | misma varianza al principio y al final | 0.38, p = 0.00 | ✗ la varianza **bajó** |
| `Skew` | asimetría | — | 0.01 | simétricos |
| `Kurtosis` | curtosis (no excesiva) | — | 3.48 | colas un poco más pesadas que la normal (3) |

:::guiado Jarque–Bera desde la asimetría y la curtosis del summary {#guia-jb-summary}
| Dato | Valor |
|---|---|
| $n$ (residuos usados) | 119 |
| Skew $S$ | 0.0136 |
| Kurtosis $K$ | 3.4808 |
| JB | 1.15 |
---
= \JB = \frac{n}{6}\left[S^2 + \frac{(K - 3)^2}{4}\right]
> La fórmula de Jarque–Bera [[jarque-bera]].
= = \frac{119}{6}\left[0.0136^2 + \frac{0.4808^2}{4}\right] = 19.833\,(0.000185 + 0.05779)
> Sustituimos: casi todo el estadístico viene de la curtosis.
@ usa c2[1-3]
= = 19.833 \times 0.05798 = 1.150
> Coincide con el summary. Con 2 grados de libertad, $P(\chi^2_2 > 1.15) = e^{-1.15/2} = 0.56$.
@ da c2[4]
:::

:::cuidado «Ljung-Box (L1)» solo mira el rezago 1
Un p-value alto en el rezago 1 no garantiza que no quede autocorrelación en el 12 o en el 24, que en una serie mensual es lo que más importa. Siempre complementa con `acorr_ljungbox(residuos, lags=[12, 24], model_df=p + q + P + Q)` [[lb-residuos]].
:::

:::duda ¿Qué hago con Prob(H) = 0.00?
$H = 0.38$ significa que la suma de residuos al cuadrado del último tercio de la muestra es solo el 38% de la del primer tercio: los choques se volvieron **más pequeños** con el tiempo (en logaritmos). No invalida los pronósticos puntuales, pero las bandas usan un $\hat\sigma$ promedio de toda la muestra, así que para 1960 probablemente quedan **un poco anchas** (de hecho 11 de 12 meses cayeron dentro). Opciones: usar Box–Cox con $\lambda$ un poco mayor que 0, entrenar solo con los años más recientes o modelar la varianza [[arch]].
:::

:::resumen Lo que debes llevarte del summary
- Encabezado: $n$ (antes de diferenciar), $\ell$, AIC, BIC, HQIC.
- Coeficientes: $z = \text{coef}/\text{se}$, $p = 2(1 - \Phi(|z|))$, intervalo $\text{coef} \pm 1.96\,\text{se}$; significativo si $|z| > 1.96$.
- `sigma2` es la varianza del choque; su raíz da el error típico a un paso.
- Abajo: Ljung–Box (solo rezago 1: complementa con 12 y 24), Jarque–Bera (normalidad), H (varianza constante), asimetría y curtosis.
:::
