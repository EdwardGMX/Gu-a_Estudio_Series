## 📈 Modelos ARIMA(p, d, q) {#arima}
@mapa ARMA sobre la serie diferenciada: escribirlo completo, los casos famosos (paseo aleatorio y suavizamiento exponencial), la deriva, pronósticos recursivos a mano, intervalos con los pesos ψ y el simulador de ARIMA.

### Definición {#arima-def}

:::definicion Modelo ARIMA(p, d, q)
$$\phi(L)\,(1 - L)^d\,y_t = c + \theta(L)\,\varepsilon_t \qquad\Longleftrightarrow\qquad w_t = (1 - L)^d\,y_t \;\text{ sigue un ARMA}(p, q)$$

- $p$: rezagos autorregresivos de la serie diferenciada.
- $\tip{d-dif}{d}$: número de diferencias necesarias para volverla estacionaria en media.
- $q$: rezagos de media móvil.

La guía oficial: *ARIMA es la evolución natural de ARMA cuando la serie original no es estacionaria, pero su diferencia sí*. La «I» significa **integrado**: la serie original es la suma acumulada («integral») de la diferenciada.
:::

| Modelo | Nombre común | Ecuación |
|---|---|---|
| ARIMA(0,0,0) | ruido blanco | $y_t = c + \varepsilon_t$ |
| ARIMA(0,1,0) | paseo aleatorio | $y_t = y_{t-1} + \varepsilon_t$ |
| ARIMA(0,1,0) con constante | paseo aleatorio con deriva | $y_t = c + y_{t-1} + \varepsilon_t$ |
| ARIMA(0,1,1) | suavizamiento exponencial simple | $y_t = y_{t-1} + \varepsilon_t + \theta\,\varepsilon_{t-1}$ |
| ARIMA(1,1,0) | AR(1) en las diferencias | $\Delta y_t = \phi\,\Delta y_{t-1} + \varepsilon_t$ |
| ARIMA(0,2,2) | equivalente al método de Holt (tendencia lineal) | $\Delta^2 y_t = \varepsilon_t + \theta_1\varepsilon_{t-1} + \theta_2\varepsilon_{t-2}$ |

:::demo Un ARIMA(1,1,0) es un AR(2) con raíz unitaria {#demo-arima110}
Tomemos $\Delta y_t = \phi\,\Delta y_{t-1} + \varepsilon_t$ con $\phi = 0.4$.

:::pasos
= (1 - \phi L)(1 - L)\,y_t = \varepsilon_t
> Forma con polinomios: el AR(1) actúa sobre la serie ya diferenciada.
= (1 - L - \phi L + \phi L^2)\,y_t = \big(1 - (1 + \phi)L + \phi L^2\big)\,y_t = \varepsilon_t
> Multiplicamos los dos factores [[polinomios]].
= y_t = (1 + \phi)\,y_{t-1} - \phi\,y_{t-2} + \varepsilon_t = 1.4\,y_{t-1} - 0.4\,y_{t-2} + \varepsilon_t
> Lo escribimos como un AR(2) en la serie original.
= \phi_1 + \phi_2 = 1.4 - 0.4 = 1
> Está **justo sobre el borde** del triángulo de estacionariedad [[ar2-triangulo]]: no es estacionario.
= 1 - 1.4z + 0.4z^2 = (1 - z)(1 - 0.4z) = 0 \;\Rightarrow\; z_1 = 1,\; z_2 = 2.5
> Una raíz **unitaria** (la de la diferencia) y otra fuera del círculo (la del AR de las diferencias).
:::
:::

### Los dos casos famosos {#arima-famosos}

#### El paseo aleatorio: el pronóstico ingenuo

Con ARIMA(0,1,0), $y_{t+h} = y_t + \varepsilon_{t+1} + \dots + \varepsilon_{t+h}$, así que con las reglas de la esperanza condicional [[esperanza-cond]]

$$\hat{y}_{t+h \mid t} = y_t \quad \text{para todo } h$$

El mejor pronóstico es **el último valor observado**. Es el famoso **pronóstico ingenuo** (*naive*), que sirve de referencia para cualquier modelo: si tu modelo no le gana al ingenuo, no está aportando nada [[metricas]].

#### ARIMA(0,1,1) = suavizamiento exponencial simple

:::demo El ARIMA(0,1,1) es el suavizamiento exponencial simple con α = 1 + θ {#demo-ses}
Modelo: $y_t = y_{t-1} + \varepsilon_t + \theta\,\varepsilon_{t-1}$.

:::pasos
= \hat{y}_{t+1 \mid t} = \E_t[y_t + \varepsilon_{t+1} + \theta\,\varepsilon_t] = y_t + \theta\,\varepsilon_t
> El choque de mañana vale 0 en promedio; el de hoy ya se conoce.
= \varepsilon_t = y_t - \hat{y}_{t \mid t-1}
> El choque de hoy es el error del pronóstico que hicimos ayer.
= \hat{y}_{t+1 \mid t} = y_t + \theta\,(y_t - \hat{y}_{t \mid t-1}) = (1 + \theta)\,y_t - \theta\,\hat{y}_{t \mid t-1}
> Sustituimos y agrupamos.
= \hat{y}_{t+1 \mid t} = \tip{alpha-ses}{\alpha}\,y_t + (1 - \alpha)\,\hat{y}_{t \mid t-1}, \qquad \alpha = 1 + \theta
> Es la fórmula del **suavizamiento exponencial simple**: el pronóstico nuevo es un promedio ponderado del dato de hoy y del pronóstico anterior.
:::

Con $-1 < \theta < 0$ se obtiene $0 < \alpha < 1$. Un $\theta$ cerca de $-1$ ($\alpha$ chico) suaviza mucho; un $\theta$ cerca de 0 ($\alpha$ cerca de 1) se parece al ingenuo.
:::

:::guiado Las dos fórmulas dan el mismo pronóstico {#guia-ses}
ARIMA(0,1,1) con $\theta = -0.6$, es decir, suavizamiento con $\alpha = 0.4$. Pronóstico inicial $\hat{y}_{1|0} = 48$.

| $t$ | $y_t$ | $\hat{y}_{t \mid t-1}$ | $\varepsilon_t = y_t - \hat{y}_{t \mid t-1}$ | ARIMA: $y_t - 0.6\,\varepsilon_t$ | SES: $0.4\,y_t + 0.6\,\hat{y}_{t \mid t-1}$ |
|---|---|---|---|---|---|
| 1 | 50 | 48 | 2 | 48.8 | 48.8 |
| 2 | 52 | 48.8 | 3.2 | 50.08 | 50.08 |
| 3 | 49 | 50.08 | −1.08 | 49.648 | 49.648 |
| 4 | 51 | 49.648 | 1.352 | 50.1888 | 50.1888 |
---
= \varepsilon_1 = 50 - 48 = 2, \qquad \hat{y}_{2|1} = 50 - 0.6(2) = 48.8
> Con la fórmula del ARIMA: dato menos 0.6 veces el error.
@ usa c2[1] c3[1]; da c4[1] c5[1]
= \hat{y}_{2|1} = 0.4(50) + 0.6(48) = 20 + 28.8 = 48.8
> Con la fórmula del suavizamiento: el mismo número.
@ usa c2[1] c3[1]; da c6[1]
= \varepsilon_2 = 52 - 48.8 = 3.2, \qquad \hat{y}_{3|2} = 52 - 1.92 = 50.08 = 0.4(52) + 0.6(48.8)
> El pronóstico del renglón anterior pasa a ser $\hat{y}_{t \mid t-1}$ del siguiente.
@ usa c2[2] c3[2]; da c4[2] c5[2] c6[2]
= \varepsilon_3 = 49 - 50.08 = -1.08, \qquad \hat{y}_{4|3} = 49 + 0.648 = 49.648
> Un error negativo baja el pronóstico.
@ usa c2[3] c3[3]; da c4[3] c5[3] c6[3]
= \hat{y}_{5|4} = 51 - 0.6(1.352) = 50.1888
> Las dos columnas coinciden en todos los renglones: son el mismo método escrito de dos formas.
@ usa c2[4] c3[4]; da c4[4] c5[4] c6[4]
:::

### La constante cuando hay diferencias: la deriva {#deriva}

:::demo Con d = 1, la constante se vuelve una pendiente {#demo-deriva}
Paseo aleatorio con constante: $\Delta y_t = c + \varepsilon_t$.

:::pasos
= y_t = y_{t-1} + c + \varepsilon_t = y_{t-2} + 2c + \varepsilon_{t-1} + \varepsilon_t = \dots
> Sustituimos hacia atrás, como en la Unidad I [[u1:deriva-demo]].
= y_t = y_0 + c\,t + \sum_{j=1}^{t}\varepsilon_j
> La constante se acumula $t$ veces: produce una **tendencia lineal** con pendiente $c$.
= \hat{y}_{t+h \mid t} = y_t + c\,h
> El pronóstico es una **recta** que sale del último dato con pendiente $c$.
= (1 - L)^2\,y_t = c \;\Rightarrow\; y_t \approx \tfrac{c}{2}\,t^2 + \dots
> Con $d = 2$ una constante produciría una tendencia **cuadrática**: casi nunca tiene sentido, por eso con $d = 2$ no se incluye constante.
:::
:::

:::cuidado Cómo se pide la deriva en statsmodels
- En `SARIMAX`, `trend="c"` con $d = 1$ agrega la constante a la ecuación de la serie **diferenciada**: es la deriva.
- En `ARIMA` (de `statsmodels.tsa.arima.model`), `trend="c"` con $d \ge 1$ da **error**, porque ahí la tendencia se define sobre la serie original y una constante desaparecería al diferenciar. La deriva se pide con `trend="t"` (tendencia lineal en niveles), que tras diferenciar es la misma constante.

Las dos formas estiman lo mismo; compruébalo abajo.
:::

```python
from statsmodels.tsa.arima.model import ARIMA

rng = np.random.default_rng(3)
y_deriva = 100 + np.cumsum(0.5 + rng.standard_normal(200))          # paseo aleatorio con deriva 0.5
try:
    ARIMA(y_deriva, order=(0, 1, 0), trend="c").fit()
except ValueError as e:
    print("ARIMA con trend='c' y d=1 ->", str(e)[:110], "...")
a = ARIMA(y_deriva, order=(0, 1, 0), trend="t").fit()
s = SARIMAX(y_deriva, order=(0, 1, 0), trend="c").fit(disp=False)
print("ARIMA   trend='t':", dict(zip(a.param_names, np.round(a.params, 4).tolist())))
print("SARIMAX trend='c':", dict(zip(s.param_names, np.round(s.params, 4).tolist())))
print("Pronósticos:", np.round(a.get_forecast(3).predicted_mean, 3), "=", np.round(s.get_forecast(3).predicted_mean, 3))
```

:::interactivo w2-deriva | La forma del pronóstico según d y la constante {#w-deriva}
Compara la **función de pronóstico** de varios modelos a partir de la misma historia: sin diferencias, con una diferencia, con y sin deriva y con dos diferencias.
@@@
- **Línea lila**: la historia (80 datos simulados). **Líneas de colores**: el pronóstico de cada modelo hasta 36 pasos.
- ARMA estacionario: el pronóstico **regresa a la media**. ARIMA($p$,1,$q$) sin constante: se **aplana** en un nivel. Con deriva: una **recta**. Con $d = 2$: una recta que sigue la pendiente de los últimos datos.
- **Vista extra**: las bandas de 95% de cada modelo. Fíjate que en los modelos con diferencias la banda crece sin límite.
:::

### Pronosticar un ARIMA a mano {#arima-pronostico}

:::definicion Receta del pronóstico recursivo
1. Escribe el modelo **expandido** en la serie original (como el AR(2) de [[demo-arima110]]).
2. Escribe la ecuación en $t + h$.
3. Sustituye: valores pasados → los datos; valores futuros de $y$ → sus pronósticos; choques futuros → 0; choques pasados → los residuos.
4. Calcula $h = 1, 2, \dots$ en orden, porque cada paso usa los anteriores.
:::

:::guiado ARIMA(1,1,0) con φ = 0.4: dos formas de pronosticar {#guia-arima-pron}
Últimos datos: $y_{t-1} = 100$, $y_t = 104$. Modelo expandido: $y_t = 1.4\,y_{t-1} - 0.4\,y_{t-2} + \varepsilon_t$.

| $h$ | Forma 1: $1.4\,\hat{y}_{t+h-1} - 0.4\,\hat{y}_{t+h-2}$ | Forma 2: $\widehat{\Delta y} = 0.4^h(4)$ | Forma 2: acumulado |
|---|---|---|---|
| 0 | 104 (dato) | 4 (dato) | 104 |
| 1 | 105.6 | 1.6 | 105.6 |
| 2 | 106.24 | 0.64 | 106.24 |
| 3 | 106.496 | 0.256 | 106.496 |
| $\infty$ | 106.667 | 0 | 106.667 |
---
= \hat{y}_{t+1} = 1.4(104) - 0.4(100) = 145.6 - 40 = 105.6
> Forma 1: el AR(2) expandido con los dos últimos datos.
@ usa c2[1]; da c2[2]
= \hat{y}_{t+2} = 1.4(105.6) - 0.4(104) = 147.84 - 41.6 = 106.24
> Ahora uno de los «rezagos» es un pronóstico.
@ usa c2[1-2]; da c2[3]
= \hat{y}_{t+3} = 1.4(106.24) - 0.4(105.6) = 148.736 - 42.24 = 106.496
> Cada paso usa los dos anteriores.
@ usa c2[2-3]; da c2[4]
= \Delta y_t = 104 - 100 = 4 \;\Rightarrow\; \widehat{\Delta y}_{t+h} = 0.4^h \cdot 4:\; 1.6,\; 0.64,\; 0.256
> Forma 2: pronosticar primero las **diferencias** (un AR(1) sin constante, que regresa a 0)...
@ usa c3[1]; da c3[2-4]
= \hat{y}_{t+h} = 104 + 1.6 + 0.64 + 0.256 + \dots
> ... y luego **acumularlas** sobre el último nivel (se «integra»). Da exactamente lo mismo.
@ usa c3[2-4]; da c4[2-4]
= \hat{y}_{t+\infty} = 104 + 4\,\frac{0.4}{1 - 0.4} = 104 + 2.667 = 106.667
> La suma geométrica de las diferencias pronosticadas [[u1:geo-suma]]: el pronóstico se **aplana** en un nuevo nivel.
@ usa c3[1]; da c2[5] c4[5]
:::

| Modelo | Forma del pronóstico a largo plazo |
|---|---|
| ARMA($p$, $q$) con constante | regresa a la media $\mu$ |
| ARIMA($p$, 1, $q$) sin constante | se aplana en un nivel (que depende de los últimos datos) |
| ARIMA($p$, 1, $q$) con constante | recta con pendiente igual a la deriva |
| ARIMA($p$, 2, $q$) sin constante | recta cuya pendiente sale de los últimos datos |

### Intervalos de pronóstico con los pesos ψ {#intervalos-psi}

:::demo La varianza del error de pronóstico {#demo-var-pronostico}
Usamos la forma MA(∞) $y_{t+h} = \mu + \sum_j \psi_j\,\varepsilon_{t+h-j}$. Para un ARIMA, los $\psi_j$ salen de dividir $\theta(L)$ entre el polinomio AR **completo** $\phi(L)(1 - L)^d$ con la misma recursión de [[demo-psi]].

:::pasos
= y_{t+h} = \underbrace{\psi_0\varepsilon_{t+h} + \dots + \psi_{h-1}\varepsilon_{t+1}}_{\text{choques futuros}} + \underbrace{\psi_h\varepsilon_t + \psi_{h+1}\varepsilon_{t-1} + \dots}_{\text{ya conocidos en } t}
> Separamos los choques que todavía no ocurren de los que ya ocurrieron.
= \hat{y}_{t+h \mid t} = \psi_h\varepsilon_t + \psi_{h+1}\varepsilon_{t-1} + \dots
> Los choques futuros se pronostican con 0 [[esperanza-cond]].
= e_{t+h} = y_{t+h} - \hat{y}_{t+h \mid t} = \sum_{j=0}^{h-1}\psi_j\,\varepsilon_{t+h-j}
> El error de pronóstico es la suma de los choques futuros ponderados.
= \tip{s2-h}{\sigma^2_h} = \Var(e_{t+h}) = \sigma^2\,(\psi_0^2 + \psi_1^2 + \dots + \psi_{h-1}^2)
> Los choques no están correlacionados: la varianza de la suma es la suma de varianzas.
= \hat{y}_{t+h \mid t} \pm 1.96\,\sigma\sqrt{\psi_0^2 + \dots + \psi_{h-1}^2}
> Intervalo de 95% suponiendo choques normales.
:::
:::

Consecuencias: con $h = 1$ el error es solo $\varepsilon_{t+1}$ y la banda es $\pm 1.96\,\sigma$. En un modelo **estacionario** los $\psi_j$ se apagan y la varianza converge a la de la serie. En un modelo **integrado** los $\psi_j$ no se apagan y la banda crece sin límite.

:::guiado Tres bandas de pronóstico calculadas a mano {#guia-bandas}
| $h$ | Paseo aleatorio ($\sigma = 2$): $\psi_j = 1$ | ARIMA(1,1,0), $\phi = 0.4$, $\sigma = 1$: $\psi_j$ | su $\sum\psi^2$ | AR(1), $\phi = 0.4$, $\sigma = 1$: $\sum\psi^2$ |
|---|---|---|---|---|
| 1 | ±3.92 | 1 | 1 | 1 |
| 2 | ±5.54 | 1.4 | 2.96 | 1.16 |
| 3 | ±6.79 | 1.56 | 5.3936 | 1.1856 |
| 4 | ±7.84 | 1.624 | 8.0310 | 1.1897 |
---
= \text{Paseo: } \sigma_h^2 = 4h \;\Rightarrow\; \pm 1.96(2)\sqrt{h}:\;\; 3.92,\; 5.54,\; 6.79,\; 7.84
> Todos los pesos valen 1: la banda crece como $\sqrt h$. En $h = 9$ ya es $\pm 11.76$.
@ da c2[1-4]
= \text{ARIMA(1,1,0): } \psi_j = 1 + 0.4 + \dots + 0.4^j:\;\; 1,\; 1.4,\; 1.56,\; 1.624
> Los pesos del AR(2) expandido $1 - 1.4L + 0.4L^2$ [[demo-arima110]]: no se apagan, se acercan a $1/(1 - 0.4) = 1.667$.
@ da c3[1-4]
= \sum\psi^2:\;\; 1,\; 1 + 1.96 = 2.96,\; 2.96 + 2.4336 = 5.3936,\; 5.3936 + 2.6374 = 8.0310
> Se acumulan los cuadrados. La banda de 95% en $h = 4$ es $\pm 1.96\sqrt{8.031} = \pm 5.55$.
@ usa c3[1-4]; da c4[1-4]
= \text{AR(1): } \psi_j = 0.4^j \;\Rightarrow\; \sum\psi^2 \to \frac{1}{1 - 0.16} = 1.1905
> El modelo estacionario tiene una banda que deja de crecer casi de inmediato: la incertidumbre queda acotada por la varianza de la serie.
@ da c5[1-4]
:::

:::interactivo w2-pronostico | Pronósticos con bandas para distintos modelos {#w-pronostico}
Elige un modelo y sus parámetros. Verás la historia simulada, el pronóstico a 24 pasos y las bandas de 80% y 95%.
@@@
- **Bandas**: la oscura es el 80% y la clara el 95%. Su ancho sale de la fórmula $1.96\,\sigma\sqrt{\sum\psi_j^2}$ (o 1.28 para el 80%).
- En los modelos estacionarios la banda se **estabiliza**; en los integrados crece como $\sqrt h$ o más rápido.
- **Lectura**: el ancho de la banda de 95% en $h = 1$, 12 y 24.
- **Vista extra**: la tabla de pesos $\psi_j$, su suma de cuadrados acumulada y el ancho de la banda para cada $h$.
:::

```python
rng = np.random.default_rng(10)
dy = ArmaProcess([1, -0.4], [1]).generate_sample(120, distrvs=rng.standard_normal, burnin=100)
y_arima = 100 + np.cumsum(dy)                                   # ARIMA(1,1,0) con φ = 0.4
ajuste_arima = ARIMA(y_arima, order=(1, 1, 0)).fit()
phi_hat, s2_hat = ajuste_arima.params
fc_arima = ajuste_arima.get_forecast(4)
manual, previo, ultimo = [], y_arima[-2], y_arima[-1]
for h in range(4):                                             # la recursión de la forma 1, con φ estimado
    nuevo = (1 + phi_hat) * ultimo - phi_hat * previo
    manual.append(nuevo); previo, ultimo = ultimo, nuevo
print("φ̂ =", round(phi_hat, 4), "| σ̂² =", round(s2_hat, 4))
print("statsmodels:", np.round(fc_arima.predicted_mean, 3))
print("a mano     :", np.round(manual, 3))
psi = ArmaProcess(np.polymul([1, -phi_hat], [1, -1]), [1]).arma2ma(4)
print("error estándar statsmodels:", np.round(fc_arima.se_mean, 4))
print("σ̂·√Σψ²     a mano       :", np.round(np.sqrt(s2_hat * np.cumsum(psi ** 2)), 4))
```

:::cuidado ¿Importa el orden de los coeficientes al multiplicar?
Para **multiplicar** no: `np.polymul` hace la convolución de los dos arreglos y el resultado es correcto en cualquier convención, siempre que uses la misma para los dos factores. Arriba, `[1, -φ]` por `[1, -1]` da `[1, -(1+φ), φ]`, que es $1 - (1 + \phi)L + \phi L^2$. El orden sí importa para **evaluar** (`np.polyval`) y para las **raíces** (`np.roots`), que suponen la potencia más alta primero [[raices]].
:::

### El simulador de ARIMA {#sim-arima}

```python oculto cache
# --- Precálculo del simulador: 36 modelos ARIMA ajustados a la misma serie (se guarda en caché) ---
import warnings, itertools
import numpy as np
from statsmodels.tsa.arima.model import ARIMA
warnings.simplefilter("ignore")
_rng = np.random.default_rng(2026)
_e = _rng.standard_normal(250)
_dy = np.zeros(250)
for _t in range(1, 250):
    _dy[_t] = 0.3 + 0.5 * _dy[_t - 1] + _e[_t]            # diferencias: AR(1) con media 0.6
_y = 50 + np.cumsum(_dy[100:])                             # 150 datos de un ARIMA(1,1,0) con deriva
_fits = {}
for _p, _d, _q in itertools.product(range(3), range(2), range(3)):
    for _tr in (["n", "c"] if _d == 0 else ["n", "t"]):
        _r = ARIMA(_y, order=(_p, _d, _q), trend=_tr).fit()
        _fc = _r.get_forecast(12)
        _ci = _fc.conf_int(alpha=0.05)
        _fits[f"{_p}{_d}{_q}{_tr}"] = {
            "params": [[str(nm), round(float(v), 4), round(float(se), 4), round(float(z), 2), round(float(pv), 4)]
                       for nm, v, se, z, pv in zip(_r.param_names, _r.params, _r.bse, _r.zvalues, _r.pvalues)],
            "llf": round(float(_r.llf), 3), "aic": round(float(_r.aic), 3), "bic": round(float(_r.bic), 3),
            "fc": [round(float(v), 3) for v in _fc.predicted_mean], "inf": [round(float(v), 3) for v in _ci[:, 0]],
            "sup": [round(float(v), 3) for v in _ci[:, 1]]}
exportar("arima_sim", {"y": [round(float(v), 3) for v in _y], "fits": _fits})
print("ajustes:", len(_fits))
```

:::interactivo py2-arima | Simulador: `ARIMA(...).fit()` y `get_forecast` {#sim-arima-py}
La serie tiene 150 datos generados por un ARIMA(1,1,0) con deriva (diferencias con media 0.6 y $\phi = 0.5$). Cambia el orden y la tendencia: los 36 modelos se ajustaron con statsmodels al construir esta página, así que la salida es **exactamente** la que verías en Python.
@@@
- **Código**: el `order=(p, d, q)` y el `trend` que elijas. Con $d = 1$ las opciones de tendencia son `"n"` y `"t"` (deriva); con $d = 0$, `"n"` y `"c"`.
- **Salida**: la tabla de coeficientes con su error estándar, $z$ y p-value, más log-verosimilitud, AIC y BIC.
- **Gráfica**: los últimos 60 datos y el pronóstico a 12 pasos con su banda de 95%.
- Prueba ARIMA(1,1,0) con `trend="t"` (el modelo verdadero) contra ARIMA(2,0,0) con `trend="c"`: el AR(2) en niveles intenta imitar la raíz unitaria y su pronóstico regresa a una media que no existe.
- **Tabla de parámetros**: qué hace cada argumento y qué valor conviene.
:::

:::resumen Lo que debes llevarte del ARIMA
- ARIMA($p$, $d$, $q$) = ARMA($p$, $q$) sobre $\Delta^d y_t$: $\phi(L)(1 - L)^d y_t = c + \theta(L)\varepsilon_t$. Expandido es un AR con raíz unitaria.
- ARIMA(0,1,0): pronóstico ingenuo $\hat{y}_{t+h} = y_t$. ARIMA(0,1,1) = suavizamiento exponencial con $\alpha = 1 + \theta$.
- Con $d = 1$ la constante es una **deriva** (pronóstico en recta). En `ARIMA` se pide con `trend="t"`; en `SARIMAX`, con `trend="c"`.
- Pronóstico recursivo: futuros $\varepsilon$ → 0, futuros $y$ → sus pronósticos. Banda: $\pm 1.96\,\sigma\sqrt{\sum_{j<h}\psi_j^2}$, que en un modelo integrado crece sin límite.
:::
