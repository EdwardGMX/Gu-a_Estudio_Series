## 🧩 Variables exógenas: ARMAX y SARIMAX {#exogenas}
@mapa Cuando el pasado de la serie no basta: ARMAX contra regresión con errores ARMA (lo que hace statsmodels), los requisitos de una buena exógena, la fuga de información, festivos y términos de Fourier, y un pronóstico a mano.

Hasta aquí, todos los modelos usaron solo el pasado de la propia serie. Pero muchas series responden a **cosas de afuera**: el tráfico baja en días festivos, la demanda de energía sube con el calor, las ventas suben con una promoción. Esas variables externas se llaman **exógenas** y se agregan al modelo.

### ARMAX y SARIMAX {#armax}

:::definicion Modelo ARMAX(p, q)
$$y_t = c + \sum_{i=1}^{p}\phi_i\,y_{t-i} + \sum_{k=1}^{m}\beta_k\,x_{k,t} + \varepsilon_t + \sum_{j=1}^{q}\theta_j\,\varepsilon_{t-j}$$

- $x_{k,t}$: variable exógena $k$ en el tiempo $t$ (por ejemplo, $1$ si es festivo y $0$ si no).
- $\tip{beta-x}{\beta_k}$: efecto de la variable exógena $k$ sobre $y_t$.
- $m$: número de variables exógenas.

La guía oficial: *debe usarse cuando existen variables externas con sentido predictivo y disponibles al momento de pronosticar*.
:::

:::definicion Modelo SARIMAX
Es un SARIMA con variables exógenas. statsmodels lo escribe como una **regresión con errores SARIMA**:

$$y_t = \beta_1 x_{1,t} + \dots + \beta_m x_{m,t} + u_t, \qquad \phi(L)\Phi(L^s)(1 - L)^d(1 - L^s)^D\,u_t = c + \theta(L)\Theta(L^s)\,\varepsilon_t$$

- $\tip{u-err}{u_t}$: la parte de $y_t$ que las exógenas no explican; ella es la que sigue el SARIMA.

La guía oficial: *permite modelar estacionalidad, dependencia temporal y efectos externos. Es útil en demanda, tráfico, energía, ventas o usuarios, donde días festivos, clima, precios o eventos pueden alterar la serie*.
:::

Las dos formas **no son lo mismo**, y la diferencia cambia cómo se interpreta $\beta$.

:::demo ARMAX contra regresión con errores AR(1) {#demo-armax}
Tomamos un solo rezago AR y una exógena.

:::pasos
= \text{ARMAX: } y_t = \phi\,y_{t-1} + \beta\,x_t + \varepsilon_t
> La exógena entra en la misma ecuación que el rezago de $y$.
= \text{ARMAX: } y_t = \beta\,x_t + \phi\beta\,x_{t-1} + \phi^2\beta\,x_{t-2} + \dots + \text{choques}
> Sustituyendo hacia atrás: el efecto de $x$ **se arrastra** con la memoria del AR. Efecto total de un cambio permanente: $\beta/(1 - \phi)$.
= \text{Regresión con errores AR(1): } y_t = \beta\,x_t + u_t, \quad u_t = \phi\,u_{t-1} + \varepsilon_t
> La exógena actúa sobre $y$ directamente; la memoria está solo en el error.
= y_t - \beta x_t = \phi\,(y_{t-1} - \beta x_{t-1}) + \varepsilon_t \;\Rightarrow\; y_t = \phi\,y_{t-1} + \beta\,x_t - \phi\beta\,x_{t-1} + \varepsilon_t
> Sustituimos $u_t = y_t - \beta x_t$. Aparece un término extra $-\phi\beta\,x_{t-1}$ que **cancela** el arrastre.
= \text{efecto de } x_t \text{ sobre } y_t = \beta \text{ (inmediato y sin arrastre)}
> En la forma de statsmodels, $\beta$ es el efecto **contemporáneo**, el más fácil de interpretar: «un festivo baja $y$ en $\beta$ ese mismo día».
:::
:::

:::guiado Un festivo con cada formulación (β = −0.3, φ = 0.6) {#guia-armax}
Un solo día festivo en $t = 1$ ($x_1 = 1$, los demás 0) y sin choques, para ver solo el efecto de $x$.

| $t$ | $x_t$ | ARMAX: $0.6\,y_{t-1} - 0.3\,x_t$ | Regresión con errores AR(1): $-0.3\,x_t$ |
|---|---|---|---|
| 1 | 1 | −0.3 | −0.3 |
| 2 | 0 | −0.18 | 0 |
| 3 | 0 | −0.108 | 0 |
| 4 | 0 | −0.0648 | 0 |
| total | | −0.75 | −0.3 |
---
= \text{ARMAX: } y_1 = 0.6(0) - 0.3(1) = -0.3
> El día del festivo, las dos formas coinciden.
@ usa c2[1]; da c3[1]
= y_2 = 0.6(-0.3) - 0.3(0) = -0.18, \quad y_3 = -0.108, \quad y_4 = -0.0648
> En el ARMAX el festivo **sigue afectando** los días siguientes porque entra en $y_{t-1}$.
@ usa c3[1]; da c3[2-4]
= \text{suma ARMAX} = \frac{-0.3}{1 - 0.6} = -0.75
> Efecto acumulado: dos veces y media el efecto del día.
@ usa c3[1-4]; da c3[5]
= \text{Regresión con errores AR(1): solo } t = 1 \text{ se ve afectado}
> El efecto del festivo es de un solo día: el error $u_t$ no «sabe» que hubo festivo.
@ usa c2[1-4]; da c4[1-5]
:::

:::interactivo w2-armax | ¿Cómo responde la serie a una variable externa? {#w-armax}
Compara las dos formulaciones ante tres tipos de variable externa: un día festivo aislado, un cambio permanente (por ejemplo, una nueva tarifa) y una variable que cambia todos los días.
@@@
- **Línea lila**: ARMAX. **Línea rosa**: regresión con errores ARMA (la de statsmodels). **Barras grises**: la variable externa $x_t$.
- Con el **festivo** el ARMAX deja una «cola» que se apaga como $\phi^j$; la regresión solo reacciona ese día.
- Con el **cambio permanente** el ARMAX llega poco a poco a $\beta/(1 - \phi)$; la regresión salta de inmediato a $\beta$.
- **Vista extra**: la tabla de los primeros periodos con las dos respuestas.
:::

### Requisitos de una buena variable exógena {#requisitos-exog}

La guía oficial da cinco condiciones. Agrega $x$ **solo si**:

1. tiene sentido **causal o predictivo** (hay una razón para que afecte a $y$);
2. estará **disponible al pronosticar** (conoces o puedes pronosticar sus valores futuros);
3. **no introduce fuga de información** (no usa datos que en la realidad no tendrías a tiempo);
4. **mejora** el AIC/BIC o las métricas fuera de muestra;
5. **no vuelve inestable** el modelo (coeficientes razonables, sin cambiar todo lo demás).

| Variable candidata | ¿Se conoce a futuro? | Veredicto |
|---|---|---|
| Día festivo, día de la semana, mes | sí, con el calendario | ✅ excelente |
| Precio o promoción **planeados** | sí, la empresa los decide | ✅ buena |
| Temperatura de mañana | solo como pronóstico del clima | ⚠️ úsala con el pronóstico, no con el valor real |
| Usuarios del mismo día en otra estación | no: se conocen al mismo tiempo que $y$ | ❌ fuga de información |
| Clics en la app **de ese mismo día** | no | ❌ fuga de información |

:::cuidado Para pronosticar hay que dar los valores futuros de x
Si el modelo tiene exógenas, `get_forecast` **exige** los valores de $x$ para cada periodo del horizonte. Sin ellos, statsmodels da un error. Compruébalo abajo.
:::

```python
rng = np.random.default_rng(3)
n = 200
festivo = (rng.random(n) < 0.08).astype(float)                       # ~8% de días festivos
u = ArmaProcess([1, -0.6], [1]).generate_sample(n, distrvs=rng.standard_normal, scale=0.5, burnin=100)
y_x = 10 - 2.0 * festivo + u                                          # regresión con errores AR(1)
fit_x = SARIMAX(y_x, exog=festivo, order=(1, 0, 0), trend="c").fit(disp=False)
print(dict(zip(fit_x.param_names, np.round(fit_x.params, 3).tolist())))
print("Media de u implícita: intercept / (1 - φ) =", round(fit_x.params[0] / (1 - fit_x.params[2]), 3))
try:
    fit_x.get_forecast(3)                                             # sin exog futura...
except ValueError as e:
    print("Error:", str(e)[:105], "...")
x_futuro = np.array([[0.0], [1.0], [0.0]])                            # mañana no, pasado sí es festivo
print("Pronóstico con exog futura:", np.round(fit_x.get_forecast(3, exog=x_futuro).predicted_mean, 3))
```

Observa que el `intercept` (3.58) **no** es la media de la serie: en `SARIMAX` la constante va en la ecuación del error $u_t$, así que la media es $3.58/(1 - 0.644) \approx 10$, igual que en [[ar-media]]. Y el coeficiente de la exógena (`x1` = −1.99) es el efecto **inmediato** de un festivo: el día festivo pronosticado sale unas 2 unidades abajo.

### La fuga de información {#fuga}

:::definicion Fuga de información (data leakage)
Ocurre cuando el modelo usa, al entrenarse o al evaluarse, información que **no estaría disponible** en el momento real del pronóstico. El resultado es un modelo que se ve excelente en la validación y falla en la práctica.

Ejemplos típicos en series de tiempo: usar como exógena una variable contemporánea que se conoce al mismo tiempo que $y$; estandarizar o transformar con estadísticos calculados con **toda** la serie (incluida la prueba); elegir el modelo viendo los datos de prueba [[validacion]].
:::

:::interactivo w2-fuga | Una exógena que hace trampa {#w-fuga}
Queremos pronosticar $y$ (usuarios de una estación) y tenemos $z$ (usuarios de la estación vecina), muy correlacionada con $y$ **el mismo día**. Al validar podemos hacer trampa usando el $z$ real, o ser honestos y usar el $z$ que realmente tendríamos (su pronóstico).
@@@
- **Arriba**: $y$ (lila) y $z$ (durazno) en el periodo de prueba.
- **Barras**: el MAE del modelo con $z$ real (con fuga), con $z$ pronosticado (honesto) y sin $z$. La validación con fuga promete un error mucho menor del que vas a tener.
- Mueve la correlación entre $y$ y $z$: cuanto más alta, más engañosa es la fuga.
- **Vista extra**: los coeficientes de cada modelo y la explicación de dónde entra la trampa.
:::

### Festivos, calendario y términos de Fourier {#festivos}

Las exógenas más útiles suelen ser **determinísticas**: se conocen con certeza hacia el futuro.

- **Indicadoras (dummies)**: festivo, día de pago, temporada de vacaciones. Si el modelo está en logaritmos, $\beta$ se lee como cambio porcentual: $100\,(e^\beta - 1)\%$ [[log2]].
- **Términos de Fourier**: cuando el periodo estacional es muy largo (365 días en datos diarios, 52 semanas), un `seasonal_order` con $s = 365$ es lentísimo e inestable. En su lugar se agregan como exógenas senos y cosenos:

$$x_{t} = \sin\!\Big(\frac{2\pi k t}{s}\Big),\;\; \cos\!\Big(\frac{2\pi k t}{s}\Big), \qquad k = 1, \dots, K$$

Con $K$ pequeño (2 a 5) se describen formas estacionales suaves con pocos parámetros.

```python
from statsmodels.tsa.deterministic import DeterministicProcess, Fourier

fechas_diarias = pd.date_range("2024-01-01", periods=730, freq="D")
proceso_det = DeterministicProcess(fechas_diarias, constant=False, additional_terms=[Fourier(period=365.25, order=2)])
X_fourier = proceso_det.in_sample()                  # exógenas para entrenar
X_futuro = proceso_det.out_of_sample(steps=2)        # las mismas columnas para el futuro: ¡se conocen!
print(X_fourier.head(3).round(4))
print(X_futuro.round(4))
```

:::guiado Pronóstico a mano con un festivo {#guia-festivo}
Modelo en logaritmos: $\ln y_t = \mu + \beta\,x_t + u_t$ con $u_t = \phi\,u_{t-1} + \varepsilon_t$, donde $\mu = 10.8$, $\beta = -0.3$, $\phi = 0.6$. Hoy $\ln y_t = 10.9$ y no fue festivo; **mañana sí es festivo**.

| Cantidad | Valor |
|---|---|
| $\ln y_t$ (hoy) | 10.9 |
| $x_t$ (hoy) | 0 |
| $x_{t+1}$ (mañana) | 1 |
| $u_t$ | 0.1 |
| $\hat u_{t+1}$ | 0.06 |
| $\ln\hat y_{t+1}$ | 10.56 |
| $\hat y_{t+1}$ | 38,537 |
---
= u_t = \ln y_t - \mu - \beta x_t = 10.9 - 10.8 - 0 = 0.1
> El error de hoy: cuánto se desvió hoy la serie de lo que explican la media y la exógena.
@ usa c2[1-2]; da c2[4]
= \hat u_{t+1} = \phi\,u_t = 0.6(0.1) = 0.06
> La memoria está en el error: se pronostica con su AR(1).
@ usa c2[4]; da c2[5]
= \ln\hat y_{t+1} = \mu + \beta\,x_{t+1} + \hat u_{t+1} = 10.8 - 0.3(1) + 0.06 = 10.56
> Se suma el efecto del festivo de **mañana**, que se conoce por el calendario.
@ usa c2[3] c2[5]; da c2[6]
= \hat y_{t+1} = e^{10.56} = 38{,}537 \quad\text{contra}\quad e^{10.86} = 52{,}045 \text{ sin festivo}
> Regresamos a la escala original (mediana del pronóstico [[regresar-escala]]).
@ usa c2[6]; da c2[7]
= \frac{38{,}537}{52{,}045} = e^{-0.3} = 0.741 \;\Rightarrow\; -25.9\%
> El festivo reduce el pronóstico un 25.9%: así se interpreta un $\beta$ en logaritmos.
@ usa c2[7]
:::

:::duda ¿Y si la exógena también es una serie de tiempo con memoria?
Es lo normal (temperatura, precio del petróleo). Entonces hay dos opciones: (1) pronosticarla aparte (con su propio ARIMA) y usar ese pronóstico como `exog` futura, sabiendo que su error se suma al del modelo; o (2) usar solo sus valores **rezagados** ($x_{t-1}$, $x_{t-2}$), que sí se conocen al pronosticar un paso adelante. Lo que nunca debes hacer es validar con los valores reales futuros de $x$: eso es fuga de información.
:::

:::resumen Lo que debes llevarte de las exógenas
- ARMAX: $x$ entra en la ecuación con los rezagos de $y$, y su efecto se arrastra ($\beta/(1 - \phi)$ a largo plazo).
- `SARIMAX` de statsmodels: **regresión con errores SARIMA**; $\beta$ es el efecto contemporáneo y la constante va en la ecuación del error.
- Una exógena debe tener sentido, **conocerse a futuro**, no causar fuga y mejorar el modelo fuera de muestra.
- Para pronosticar: `get_forecast(steps, exog=x_futuro)`. Festivos y Fourier son exógenas ideales porque se conocen con certeza.
:::
