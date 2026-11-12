## 🧵 Descomposición STL y pronóstico por descomposición {#stl}
@mapa LOESS calculado a mano, el algoritmo de STL paso a paso, sus parámetros en statsmodels, la versión robusta ante atípicos, la fuerza de la tendencia y de la estacionalidad, y cómo pronosticar con una descomposición.

### Por qué otra descomposición {#stl-por-que}

La descomposición clásica es fácil de calcular a mano, pero tiene tres defectos que ya vimos [[descomposicion]]: pierde $s/2$ datos de tendencia en cada extremo, supone que el patrón estacional es **idéntico** todos los años y un solo atípico mueve los promedios. **STL** (*Seasonal-Trend decomposition using LOESS*, Cleveland et al., 1990) resuelve los tres sin cambiar la idea de fondo:

$$y_t = T_t + S_t + R_t$$

| | Descomposición clásica | STL |
|---|---|---|
| Tendencia | media móvil centrada 2×$s$ | LOESS (rectas locales con pesos) |
| Datos perdidos en los extremos | $s/2$ de cada lado (`NaN`) | **ninguno** |
| Estacionalidad | el mismo índice cada año | puede **cambiar** poco a poco de un año a otro |
| Atípicos | los arrastra a los promedios | versión **robusta** que los ignora |
| Periodo | cualquiera | cualquiera ($s \ge 2$) |
| Modelo | aditivo o multiplicativo | solo **aditivo**: para el multiplicativo se aplica a $\ln y_t$ [[log]] |

:::intuicion Otra forma de verlo: un sastre contra una talla única
La descomposición clásica es ropa de talla única: el mismo patrón estacional para los 12 años. STL es un sastre que toma medidas año por año y deja que el traje cambie un poco cada vez, sin perder la forma general. Cuánto puede cambiar lo decide el parámetro `seasonal`.
:::

### LOESS: una recta local con pesos {#loess}

La pieza básica de STL es **LOESS** (*locally estimated scatterplot smoothing*). Para estimar el valor suavizado en un punto $x_0$:

:::definicion LOESS en un punto
1. Se toman los $\tip{q-loess}{q}$ datos más cercanos a $x_0$ (la **ventana**).
2. Cada uno recibe un peso que depende de su distancia $r = \lvert x_j - x_0 \rvert$, con el **peso tricúbico**
$$\tip{w-loess}{w_j} = \left(1 - \left(\frac{r}{\tip{h-loess}{h}}\right)^3\right)^3 \quad \text{si } r < h, \qquad w_j = 0 \text{ si } r \ge h,$$
donde $h$ es la distancia al dato más lejano de la ventana.
3. Se ajusta una **recta por mínimos cuadrados ponderados** (grado 1) o un promedio ponderado (grado 0) con esos pesos.
4. El valor suavizado es esa recta evaluada en $x_0$.

Repitiendo esto en cada punto se obtiene una curva suave que sigue los datos sin imponerles una forma global.
:::

:::guiado LOESS en el centro de una ventana de 7 datos {#guia-loess}
| $j$ | $y_j$ | $r = \lvert j - 4 \rvert$ | $r/h$ | $(r/h)^3$ | $w_j$ | $w_j\,y_j$ |
|---|---|---|---|---|---|---|
| 1 | 5 | 3 | 1 | 1 | 0 | 0 |
| 2 | 8 | 2 | 0.6667 | 0.2963 | 0.3485 | 2.7878 |
| 3 | 6 | 1 | 0.3333 | 0.0370 | 0.8930 | 5.3577 |
| 4 | 9 | 0 | 0 | 0 | 1 | 9 |
| 5 | 13 | 1 | 0.3333 | 0.0370 | 0.8930 | 11.6084 |
| 6 | 10 | 2 | 0.6667 | 0.2963 | 0.3485 | 3.4847 |
| 7 | 12 | 3 | 1 | 1 | 0 | 0 |
| suma | | | | | 3.4829 | 32.2386 |
---
= x_0 = 4, \quad q = 7, \quad h = \max(4 - 1,\ 7 - 4) = 3
> La ventana son los 7 datos, centrada en $j = 4$. El dato más lejano está a 3 lugares: esa es $h$.
@ usa c1[1-7]
= r_j = \lvert j - 4 \rvert:\quad 3,\ 2,\ 1,\ 0,\ 1,\ 2,\ 3
> La distancia de cada dato al punto que queremos suavizar.
@ usa c1[1-7]; da c3[1-7] c4[1-7] c5[1-7]
= w_j = \left(1 - (r/3)^3\right)^3:\quad 0,\ 0.3485,\ 0.8930,\ 1,\ 0.8930,\ 0.3485,\ 0
> Pesos tricúbicos. El propio punto pesa 1, los vecinos casi 0.9, y los extremos, a distancia $h$, pesan **0**: en la práctica una ventana de 7 usa 5 datos.
@ usa c5[1-7]; da c6[1-7] c6[8]
= \hat{y}_4 = \frac{\sum w_j\,y_j}{\sum w_j} = \frac{32.2386}{3.4829} = 9.256
> Como la ventana es **simétrica**, el centro ponderado de los $j$ es exactamente 4 y la recta ponderada evaluada en su centro es el promedio ponderado. El dato observado era 9; el suavizado lo jala un poco hacia el 13 de su derecha.
@ usa c2[1-7] c6[1-7]; da c7[1-7] c7[8]
:::

:::ejemplo En el borde, la recta corrige lo que el promedio no puede
Con los mismos datos, suavizar en $x_0 = 1$ (el primer dato) usa la ventana $j = 1, \dots, 7$ con $h = 6$: los pesos son $1,\ 0.986,\ 0.893,\ 0.670,\ 0.349,\ 0.075,\ 0$, todos **a la derecha** del punto.

- El **promedio ponderado** (grado 0) da $7.44$: está sesgado hacia arriba porque todos los vecinos están a la derecha, donde la serie es más alta.
- La **recta ponderada** (grado 1) evaluada en $x_0 = 1$ da $5.20$, muy cerca del dato real (5): la pendiente compensa que la ventana esté de un solo lado.

Por eso STL usa grado 1 por omisión (`seasonal_deg=1`, `trend_deg=1`), y por eso **no pierde datos en los extremos**: la media móvil centrada simplemente no puede calcularse ahí.
:::

:::interactivo loess | LOESS paso a paso {#w-loess}
Elige el punto que quieres suavizar, el tamaño de la ventana y el grado. Los puntos se agrandan según su peso.
@@@
- **Gráfica**: los datos (el tamaño de cada punto es su peso tricúbico), la recta local ponderada (rosa) y la curva LOESS completa (lila), que repite el cálculo en cada punto.
- **Lectura**: $h$, cuántos datos tienen peso mayor que cero y el valor suavizado en el punto elegido.
- **Qué buscar**: una ventana chica sigue los datos (poco suave); una grande se parece a una recta global. En los extremos compara grado 0 y grado 1: el promedio se va hacia los datos interiores y la recta no.
- **Vista extra**: la tabla de distancias, pesos y aportes, como la del ejemplo guiado.
:::

### El algoritmo de STL {#stl-algoritmo}

STL alterna dos suavizados: uno para la estacionalidad (sobre cada subserie de meses [[subseries]]) y otro para la tendencia (sobre la serie sin estacionalidad). Cada uno mejora con el resultado del otro.

:::definicion Ciclo interno de STL
Se empieza con $T_t = 0$ y se repite (5 veces por omisión, 2 si es robusto):

1. **Quitar la tendencia**: $y_t - T_t$.
2. **Suavizar cada subserie de ciclo** (todos los eneros juntos, todos los febreros…) con LOESS de ventana `seasonal`. Se extiende un periodo hacia atrás y otro hacia adelante. El resultado es $C_t$.
3. **Filtro de paso bajo** sobre $C_t$: tres medias móviles (de longitud $s$, $s$ y 3) seguidas de un LOESS de ventana `low_pass`. El resultado $L_t$ es lo que en $C_t$ todavía parece tendencia.
4. **Estacionalidad**: $S_t = C_t - L_t$. Restar $L_t$ evita que la tendencia se cuele en la estacionalidad.
5. **Desestacionalizar**: $y_t - S_t$.
6. **Tendencia**: LOESS de ventana `trend` sobre $y_t - S_t$. El resultado es el nuevo $T_t$.

Al final, $R_t = y_t - T_t - S_t$.
:::

:::definicion Ciclo externo (solo con `robust=True`)
Después de cada ciclo interno se calculan **pesos de robustez** a partir del residuo, con $\lvert R_t\rvert$ comparado contra seis veces su mediana:

$$\tip{rho-rob}{\rho_t} = \left(1 - \left(\frac{\lvert R_t\rvert}{6\,\operatorname{mediana}\lvert R\rvert}\right)^2\right)^2 \quad\text{si } \lvert R_t\rvert < 6\,\operatorname{mediana}\lvert R\rvert, \qquad \rho_t = 0 \text{ si no.}$$

En el siguiente ciclo interno cada LOESS multiplica sus pesos tricúbicos por $\rho_t$: un atípico con $\rho_t = 0$ deja de influir en la tendencia y la estacionalidad, y queda **todo** en el residuo. Se repite 15 veces por omisión.
:::

<div class="ruta">
<div class="ruta-paso"><b>1 · y − T</b><span>Quitar la tendencia actual (al inicio, cero).</span></div>
<div class="ruta-paso"><b>2 · Subseries</b><span>LOESS de cada mes a lo largo de los años: C.</span></div>
<div class="ruta-paso"><b>3 · Paso bajo</b><span>Medias móviles s, s, 3 y LOESS: L.</span></div>
<div class="ruta-paso"><b>4 · S = C − L</b><span>Estacionalidad sin tendencia colada.</span></div>
<div class="ruta-paso"><b>5 y 6 · Tendencia</b><span>LOESS sobre y − S: el nuevo T.</span></div>
</div>

:::duda ¿Por qué hace falta el filtro de paso bajo del paso 3?
Si la serie sube, el LOESS de cada subserie también sube: los eneros de 1960 son más altos que los de 1949 en parte por la tendencia. Sin el paso 3, ese crecimiento quedaría dentro de $S_t$ y la estacionalidad no sumaría cero en cada año. Las medias móviles de longitud $s$ promedian un año completo, así que lo que sobrevive en $L_t$ es justo la parte de tendencia, y se resta [[mm-estacional]].
:::

### Los parámetros de STL en statsmodels {#stl-parametros}

```python
from statsmodels.tsa.seasonal import STL

stl_log = STL(np.log(serie), period=12)              # aditiva sobre el logaritmo
print(stl_log.config)
res_stl = stl_log.fit()
comp_stl = pd.DataFrame({"observada": res_stl.observed, "tendencia": res_stl.trend,
                         "estacional": res_stl.seasonal, "residuo": res_stl.resid})
print(comp_stl.head(4).round(4))
print("NaN en la tendencia:", res_stl.trend.isna().sum())
```

| Parámetro | Qué controla | Valor por omisión | Cómo elegirlo |
|---|---|---|---|
| `period` | el periodo estacional $s$ | se deduce de la frecuencia del índice | 12 mensual, 4 trimestral, 7 diaria |
| `seasonal` | ventana del LOESS de cada subserie, en **años** | 7 | impar $\ge 3$. Chica: la estacionalidad cambia rápido. Grande: casi fija |
| `trend` | ventana del LOESS de la tendencia, en **periodos** | el menor impar $\ge \frac{1.5\,s}{1 - 1.5/\text{seasonal}}$ (23 con $s = 12$) | impar. Chica: tendencia que sigue los ciclos. Grande: tendencia muy suave |
| `low_pass` | ventana del paso bajo | el menor impar mayor que $s$ (13) | casi nunca se cambia |
| `seasonal_deg`, `trend_deg` | grado del LOESS (0 o 1) | 1 | 1; usa `seasonal_deg=0` con `seasonal` muy grande para una estacionalidad fija |
| `robust` | activa el ciclo externo | `False` | `True` si hay atípicos |

:::demo De dónde sale la ventana de tendencia por omisión {#demo-stl-trend}
:::pasos
= \text{trend} \ge \frac{1.5\,s}{1 - 1.5/\text{seasonal}} = \frac{1.5(12)}{1 - 1.5/7} = \frac{18}{0.7857} = 22.91
> La regla de Cleveland et al.: la ventana de tendencia debe ser bastante más larga que un periodo para que la tendencia no absorba la estacionalidad, y más larga cuanto más flexible sea la estacionalidad (`seasonal` chico).
= \lceil 22.91 \rceil = 23 \;\;(\text{impar}) \;\Rightarrow\; \text{trend} = 23
> Se redondea hacia arriba y, si sale par, se suma 1. Con datos trimestrales ($s = 4$): $\frac{6}{0.7857} = 7.64 \to 9$.
:::
:::

:::cuidado `seasonal=999` no da una estacionalidad fija
En statsmodels, una ventana estacional enorme con `seasonal_deg=1` ajusta una **recta** a cada subserie: julio puede seguir creciendo de un año a otro. En AirPassengers (en logaritmos), el efecto de julio pasa de 0.156 en 1949 a 0.277 en 1960 incluso con `seasonal=999`. Para un patrón idéntico cada año (el equivalente al `s.window = "periodic"` de R) usa `seasonal=999, seasonal_deg=0`.
:::

:::duda ¿Por qué `seasonal` y `trend` tienen que ser impares?
Porque LOESS centra la ventana en el punto que estima: con un número impar de datos hay los mismos a cada lado. statsmodels lanza `ValueError` si das un número par o menor que 3.
:::

:::interactivo stl | STL de AirPassengers con todos sus controles {#w-stl}
Cambia las ventanas, activa la versión robusta o mete un atípico. Los cuatro paneles son los de `res.plot()`.
@@@
- **Cuatro paneles**: observada, tendencia, estacional y residuo, con el mismo eje de tiempo. A diferencia de la clásica, la tendencia llega hasta los extremos.
- **Lectura**: la configuración que se usó (incluida la ventana de tendencia por omisión), la fuerza de la tendencia y de la estacionalidad [[fuerza]] y, si hay atípico, su peso robusto.
- **Qué buscar**: con `seasonal` chico el panel estacional cambia de forma año con año; con «fija» es el mismo patrón repetido. Con el atípico y sin `robust`, el pico se reparte entre la tendencia y la estacionalidad de ese mes; con `robust`, se queda solo en el residuo.
- **Vista extra**: el efecto estacional de un mes año por año, según STL y según la descomposición clásica (que es una línea plana).
:::

:::interactivo py-stl | Simulador: `STL` con sus parámetros {#sim-stl}
Elige los parámetros y mira el código, la configuración final y las primeras filas de la descomposición.
@@@
- `trend=None` usa la regla de la ventana por omisión [[demo-stl-trend]]; si escribes un número par aparece el `ValueError` real.
- Con `period=6` la estacionalidad queda mal y el residuo conserva el ciclo de 12 meses.
- Con `robust=True` cambian las iteraciones (`inner_iter=2`, `outer_iter=15`) y aparecen pesos menores que 1.
:::

### Robustez ante atípicos {#stl-robusto}

```python
con_atipico = serie.copy()
con_atipico.iloc[60] *= 1.6                         # enero de 1954 con 60% más pasajeros
normal = STL(np.log(serie), period=12).fit()
sin_rob = STL(np.log(con_atipico), period=12).fit()
con_rob = STL(np.log(con_atipico), period=12, robust=True).fit()
for nombre, r in [("sin robust", sin_rob), ("robust=True", con_rob)]:
    print(f"{nombre:12s} cambio máximo de la tendencia = {np.abs(r.trend - normal.trend).max():.4f} | "
          f"de los eneros = {np.abs(r.seasonal - normal.seasonal).iloc[::12].max():.4f} | "
          f"peso del atípico = {r.weights.iloc[60]:.3f}")
```

Sin `robust`, el atípico sube el efecto estacional de **todos** los eneros cercanos (hasta 0.12 en logaritmos, unos 13% de pasajeros) porque entra al LOESS de la subserie de enero. Con `robust=True` su peso es 0 y el cambio en los eneros baja a 0.02: el atípico queda casi completo en el residuo, que es donde debe estar.

### Fuerza de la tendencia y de la estacionalidad {#fuerza}

Una descomposición permite medir **qué tan fuerte** es cada componente, comparando la varianza del residuo con la del componente más el residuo:

:::definicion Fuerza de la tendencia y de la estacionalidad (Wang, Smith y Hyndman)
$$\tip{FT}{F_T} = \max\left(0,\ 1 - \frac{\Var(R_t)}{\Var(T_t + R_t)}\right), \qquad \tip{FS}{F_S} = \max\left(0,\ 1 - \frac{\Var(R_t)}{\Var(S_t + R_t)}\right)$$

- $T_t + R_t$ es la serie **desestacionalizada**; $S_t + R_t$ es la serie **sin tendencia**.
- Si el componente es fuerte, el residuo es diminuto comparado con él y $F$ se acerca a 1. Si no hay tal componente, $\Var(T_t + R_t) \approx \Var(R_t)$ y $F \approx 0$.
- Regla práctica: $F > 0.64$ indica un componente fuerte.
:::

:::guiado La fuerza en la descomposición trimestral {#guia-fuerza}
| $t$ | $T_t$ | $S_t$ | $R_t$ | $T_t + R_t$ | $S_t + R_t$ |
|---|---|---|---|---|---|
| 3 | 21 | −6.7969 | −0.2031 | 20.7969 | −7 |
| 4 | 21.875 | 4.3281 | −0.2031 | 21.6719 | 4.125 |
| 5 | 22.75 | 4.9531 | 0.2969 | 23.0469 | 5.25 |
| 6 | 23.75 | −2.4844 | −0.2656 | 23.4844 | −2.75 |
| 7 | 24.625 | −6.7969 | 0.1719 | 24.7969 | −6.625 |
| 8 | 25.5 | 4.3281 | 0.1719 | 25.6719 | 4.5 |
| 9 | 26.375 | 4.9531 | −0.3281 | 26.0469 | 4.625 |
| 10 | 27.25 | −2.4844 | 0.2344 | 27.4844 | −2.25 |
| varianza | | | 0.0659 | 5.2129 | 27.3903 |
---
= T_t + R_t = y_t - S_t, \qquad S_t + R_t = y_t - T_t
> Son la serie desestacionalizada y la serie sin tendencia de la descomposición clásica [[guia-descomp]]. Solo se usan los 8 trimestres que tienen tendencia.
@ usa c2[1-8] c3[1-8] c4[1-8]; da c5[1-8] c6[1-8]
= \Var(R_t) = 0.0659, \quad \Var(T_t + R_t) = 5.2129, \quad \Var(S_t + R_t) = 27.3903
> Varianzas muestrales (con $n - 1$; el cociente no cambia si usas $n$).
@ usa c4[1-8] c5[1-8] c6[1-8]; da c4[9] c5[9] c6[9]
= F_T = 1 - \frac{0.0659}{5.2129} = 0.987, \qquad F_S = 1 - \frac{0.0659}{27.3903} = 0.998
> Las dos son casi 1: el residuo es diminuto. La estacionalidad es todavía más fuerte que la tendencia: la diferencia entre trimestres (de −6.8 a +5) pesa más que el crecimiento de 21 a 27.
@ usa c4[9] c5[9] c6[9]
:::

```python
F_T = max(0, 1 - res_stl.resid.var() / (res_stl.trend + res_stl.resid).var())
F_S = max(0, 1 - res_stl.resid.var() / (res_stl.seasonal + res_stl.resid).var())
print(f"ln(AirPassengers) con STL: F_T = {F_T:.4f}, F_S = {F_S:.4f}")
```

:::duda ¿Para qué sirve medir la fuerza?
Para decidir con un número lo que la gráfica sugiere: si $F_S$ es bajo, no vale la pena modelar estacionalidad (ni diferenciar estacionalmente); si $F_T$ es alto, la serie no es estacionaria en media [[estacionariedad]]. Con muchas series a la vez (cientos de productos), permite clasificarlas sin graficar cada una.
:::

### Pronóstico por descomposición {#pron-descomp}

Una descomposición no solo describe: también **pronostica**. La idea es pronosticar por separado lo fácil (la estacionalidad, que se repite) y lo difícil (la serie sin estacionalidad), y sumar.

:::definicion Pronóstico por descomposición (aditivo)
1. Descomponer el **entrenamiento**: $y_t = \hat{S}_t + \tip{A-desest}{A_t}$, con $A_t = \hat{T}_t + \hat{R}_t = y_t - \hat{S}_t$ la serie **desestacionalizada**.
2. **Estacionalidad**: se pronostica repitiendo la última temporada, $\hat{S}_{T+h} = \hat{S}_{T+h-s}$ (un ingenuo estacional sobre el componente).
3. **Serie desestacionalizada**: se pronostica con un método sin estacionalidad: el ingenuo $\hat{A}_{T+h} = A_T$, la deriva $A_T + h\,\frac{A_T - A_1}{T - 1}$ o una **recta** ajustada por mínimos cuadrados.
4. **Sumar**: $\hat{y}_{T+h} = \hat{A}_{T+h} + \hat{S}_{T+h}$.

Si la descomposición se hizo sobre $\ln y_t$, el pronóstico en la escala original es $e^{\hat{A}_{T+h} + \hat{S}_{T+h}}$.
:::

:::guiado Pronosticar 4 trimestres con la descomposición clásica {#guia-pron-descomp}
| $t$ | trim. | $y_t$ | $\hat{S}_t$ | $A_t$ o recta | $t - 6.5$ | $(t - 6.5)\,A_t$ | $\hat{y}_t$ |
|---|---|---|---|---|---|---|---|
| 1 | Q1 | 24 | 4.9531 | 19.0469 | −5.5 | −104.7578 | |
| 2 | Q2 | 18 | −2.4844 | 20.4844 | −4.5 | −92.1797 | |
| 3 | Q3 | 14 | −6.7969 | 20.7969 | −3.5 | −72.7891 | |
| 4 | Q4 | 26 | 4.3281 | 21.6719 | −2.5 | −54.1797 | |
| 5 | Q1 | 28 | 4.9531 | 23.0469 | −1.5 | −34.5703 | |
| 6 | Q2 | 21 | −2.4844 | 23.4844 | −0.5 | −11.7422 | |
| 7 | Q3 | 18 | −6.7969 | 24.7969 | 0.5 | 12.3984 | |
| 8 | Q4 | 30 | 4.3281 | 25.6719 | 1.5 | 38.5078 | |
| 9 | Q1 | 31 | 4.9531 | 26.0469 | 2.5 | 65.1172 | |
| 10 | Q2 | 25 | −2.4844 | 27.4844 | 3.5 | 96.1953 | |
| 11 | Q3 | 21 | −6.7969 | 27.7969 | 4.5 | 125.0859 | |
| 12 | Q4 | 34 | 4.3281 | 29.6719 | 5.5 | 163.1953 | |
| 13 | Q1 | ? | 4.9531 | 30.0885 | | | 35.0417 |
| 14 | Q2 | ? | −2.4844 | 30.9996 | | | 28.5152 |
| 15 | Q3 | ? | −6.7969 | 31.9107 | | | 25.1138 |
| 16 | Q4 | ? | 4.3281 | 32.8217 | | | 37.1498 |
---
= A_t = y_t - \hat{S}_t:\quad 24 - 4.9531 = 19.0469,\ \dots,\ 34 - 4.3281 = 29.6719
> **Paso 1 · Desestacionalizar.** Los índices son los de la descomposición clásica [[guia-descomp]]. Sin la estacionalidad, la serie sube de forma casi recta.
@ usa c3[1-12] c4[1-12]; da c5[1-12]
= \bar{t} = 6.5, \qquad \bar{A} = \frac{290}{12} = 24.1667, \qquad \textstyle\sum (t - \bar{t})^2 = 143
> **Paso 2 · Recta por mínimos cuadrados.** Las piezas de la pendiente. $\sum (t - 6.5)^2 = 2(0.5^2 + 1.5^2 + \dots + 5.5^2) = 143$.
@ usa c5[1-12] c6[1-12]
= \textstyle\sum (t - \bar{t})\,A_t = 130.2812 \;\Rightarrow\; \hat{b} = \frac{130.2812}{143} = 0.9111
> Como $\sum (t - \bar{t}) = 0$, la covarianza se calcula multiplicando directamente por $A_t$. La serie desestacionalizada sube 0.91 por trimestre.
@ usa c5[1-12] c6[1-12]; da c7[1-12]
= \hat{a} = \bar{A} - \hat{b}\,\bar{t} = 24.1667 - 0.9111(6.5) = 18.2448
> La recta pasa por el punto de medias $(\bar{t}, \bar{A})$.
= \hat{A}_t = 18.2448 + 0.9111\,t:\quad 30.0885,\ 30.9996,\ 31.9107,\ 32.8217
> **Paso 3 · Extrapolar** la recta a $t = 13, \dots, 16$.
@ da c5[13-16]
= \hat{y}_t = \hat{A}_t + \hat{S}_t:\quad 35.04,\ 28.52,\ 25.11,\ 37.15
> **Paso 4 · Devolver la estacionalidad**: cada trimestre recibe su índice. El pronóstico conserva el patrón alto en Q1 y Q4, bajo en Q3.
@ usa c4[13-16] c5[13-16]; da c8[13-16]
:::

:::ejemplo La misma serie con la deriva en lugar de la recta
Con la deriva sobre $A_t$: $b = \frac{A_{12} - A_1}{11} = \frac{29.6719 - 19.0469}{11} = 0.9659$ y $\hat{A}_{12+h} = 29.6719 + 0.9659\,h$, que da $\hat{y} = 35.59,\ 29.12,\ 25.77,\ 37.86$. La pendiente es parecida (0.97 contra 0.91), pero la deriva parte del **último** dato y la recta del ajuste global. Si el último dato es un poco alto (aquí $A_{12} = 29.67$ queda 0.49 arriba de la recta, que en $t = 12$ vale 29.18), la deriva hereda ese desfase en todo el horizonte.
:::

Con AirPassengers se descompone el **logaritmo** del entrenamiento (1949–1959), se pronostica 1960 y se regresa con la exponencial:

```python
from sklearn.linear_model import LinearRegression

entr_stl = np.log(serie.iloc[:-12])                 # 1949–1959 en logaritmos
real_1960 = serie.iloc[-12:].values
dec_e = STL(entr_stl, period=12).fit()
S_fut = dec_e.seasonal.iloc[-12:].values            # estacionalidad: se repite la de 1959
A_e = (entr_stl - dec_e.seasonal).values            # serie desestacionalizada
T_e, h_e = len(A_e), np.arange(1, 13)

def recta(ultimos):                                 # recta con los últimos `ultimos` meses
    t = np.arange(T_e - ultimos, T_e).reshape(-1, 1)
    lr = LinearRegression().fit(t, A_e[-ultimos:])
    return lr.predict(np.arange(T_e, T_e + 12).reshape(-1, 1))

metodos = {"ingenuo": np.repeat(A_e[-1], 12),
           "deriva": A_e[-1] + h_e * (A_e[-1] - A_e[0]) / (T_e - 1),
           "recta (todo)": recta(T_e),
           "recta (5 años)": recta(60)}
for nombre, A_fut in metodos.items():
    pron = np.exp(A_fut + S_fut)
    print(f"STL + {nombre:15s} MAPE 1960 = {100 * np.mean(np.abs((real_1960 - pron) / real_1960)):.2f}%")
```

| Método para la serie desestacionalizada | MAPE en 1960 |
|---|---|
| STL + ingenuo | 3.92% |
| STL + deriva | 4.28% |
| STL + recta con toda la muestra | 7.74% |
| STL + recta con los últimos 5 años | **2.52%** |
| *Referencia: ingenuo estacional* | 9.99% |
| *SARIMA de aerolínea (Unidad II)* | 2.90% |

Cualquier pronóstico por descomposición le gana con mucho al ingenuo estacional, porque separa el crecimiento del patrón. Pero el método para $A_t$ importa: la recta con los 11 años queda **por arriba** de 1960 (7.7% de más en promedio), porque su pendiente mezcla el crecimiento rápido de los primeros años con el más lento de 1957–1959. La recta con los últimos 5 años sigue mejor el ritmo reciente.

:::cuidado La ventana de la recta es una decisión de modelado
Con 2 años la recta da 2.68%, con 3 años 4.64% y con 5 años 2.52%: el resultado no es monótono y depende de lo que pasó en cada ventana. Elegir la ventana viendo el error de 1960 es usar la prueba para entrenar [[iid]]. Lo correcto es elegirla con validación (por ejemplo, probando en 1958 y 1959) y reportar 1960 una sola vez.
:::

statsmodels trae este procedimiento ya armado en `STLForecast`: descompone con STL, ajusta un modelo a la serie desestacionalizada y le suma la estacionalidad repetida. Con un ARIMA(0,1,0) con constante sobre $A_t$ (la deriva) da el mismo pronóstico que arriba, y además intervalos:

```python
from statsmodels.tsa.forecasting.stl import STLForecast
from statsmodels.tsa.arima.model import ARIMA

stlf = STLForecast(entr_stl, ARIMA, model_kwargs={"order": (0, 1, 0), "trend": "t"}, period=12).fit()
banda = stlf.get_prediction(start=len(entr_stl), end=len(entr_stl) + 11).summary_frame(alpha=0.05)
pron_stlf = np.exp(banda["mean"].values)
print(f"STLForecast + deriva: MAPE 1960 = {100 * np.mean(np.abs((real_1960 - pron_stlf) / real_1960)):.2f}%")
print(np.exp(banda[["mean", "mean_ci_lower", "mean_ci_upper"]]).head(3).round(1))
```

:::interactivo pron-descomp | Pronóstico por descomposición de AirPassengers {#w-pron-descomp}
Elige la descomposición (STL o clásica) y el método para la serie desestacionalizada. Todo se calcula con 1949–1959 y se compara con 1960.
@@@
- **Gráfica principal**: los últimos años del entrenamiento, el pronóstico por descomposición, el ingenuo estacional (punteado) y los datos reales de 1960.
- **Lectura**: el MAPE de tu pronóstico contra el del ingenuo estacional (9.99%) y el del SARIMA de aerolínea (2.90%).
- **Qué buscar**: con la recta y pocos años la ventana importa mucho (prueba 2, 3 y 5 años). Con la descomposición clásica la estacionalidad de 1960 es el promedio de todos los años: en julio se queda unos 5% corta, porque el pico de verano fue creciendo. STL usa el patrón más reciente.
- **Vista extra**: la serie desestacionalizada $A_t$ con lo que se extrapola (la recta, la deriva o el último valor). Es literalmente lo que se pronostica antes de sumar la estacionalidad.
:::

:::duda ¿Por qué el ingenuo estacional sobre la estacionalidad y no sobre la serie?
Porque $\hat{S}_t$ ya no tiene tendencia: copiar el último año del **componente** es razonable. Copiar el último año de la **serie** (el ingenuo estacional de la Unidad II) también copia su nivel, y en una serie que crece se queda corto. El pronóstico por descomposición separa las dos cosas: el nivel lo pronostica el método de $A_t$ y la forma la estacionalidad.
:::

:::duda ¿Y el residuo?
Se pronostica como cero: se supone que es ruido impredecible. Si el residuo de la descomposición tiene autocorrelación (revísalo con la ACF y Ljung–Box [[ljung-box]]), queda información útil: por eso `STLForecast` puede usar un ARIMA más completo sobre $A_t$ en lugar de la deriva.
:::

:::resumen Lo esencial de STL y el pronóstico por descomposición
- STL: $y = T + S + R$ con LOESS; sin `NaN` en los extremos, estacionalidad que puede cambiar, versión robusta. Es aditiva: para el multiplicativo, aplícala a $\ln y$.
- LOESS: pesos tricúbicos $(1 - (r/h)^3)^3$ y una recta ponderada; en el centro de una ventana simétrica es un promedio ponderado.
- Parámetros: `seasonal` (años, impar, 7), `trend` (por omisión $\ge 1.5s/(1 - 1.5/\text{seasonal})$, 23 con $s = 12$), `robust`. Estacionalidad fija: `seasonal` grande con `seasonal_deg=0`.
- Fuerza: $F = \max(0, 1 - \Var(R)/\Var(\text{componente} + R))$; cerca de 1 = componente fuerte.
- Pronóstico: $\hat{y} = \hat{A}_{T+h} + \hat{S}_{T+h-s}$, con $A$ pronosticada por ingenuo, deriva o recta; `STLForecast` lo hace en una línea.
:::
