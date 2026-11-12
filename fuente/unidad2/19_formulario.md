## 🗒️ Formulario y checklist de la Unidad II {#formulario2}
@mapa Todas las fórmulas de la unidad en una página, la tabla de pruebas, el flujo para el examen práctico y los errores que restan puntos.

### Fórmulas {#formulas2}

| Concepto | Fórmula | Ver |
|---|---|---|
| Operador rezago | $L^k y_t = y_{t-k}$, $\Delta = 1 - L$, $\Delta_s = 1 - L^s$ | [[def-l]] |
| AR($p$) | $y_t = c + \sum_{i=1}^p\phi_i y_{t-i} + \varepsilon_t$, $\phi(L)\,y_t = c + \varepsilon_t$ | [[ar-def]] |
| Media del AR | $\mu = \frac{c}{1 - \phi_1 - \dots - \phi_p}$ | [[demo-ar-media]] |
| Estacionariedad del AR(2) | $\phi_1 + \phi_2 < 1$, $\phi_2 - \phi_1 < 1$, $\lvert\phi_2\rvert < 1$ | [[ar2-triangulo]] |
| Yule–Walker (AR(2)) | $\rho(1) = \frac{\phi_1}{1 - \phi_2}$, $\rho(k) = \phi_1\rho(k-1) + \phi_2\rho(k-2)$ | [[demo-yw]] |
| Varianza del AR($p$) | $\gamma(0) = \frac{\sigma^2}{1 - \sum\phi_i\rho(i)}$ | [[demo-yw]] |
| Pseudo-ciclo del AR(2) | $r = \sqrt{-\phi_2}$, $\cos\omega = \frac{\phi_1}{2\sqrt{-\phi_2}}$, $P = 2\pi/\omega$ | [[demo-pseudociclo]] |
| PACF del AR(2) | $\phi_{22} = \phi_2$, $\phi_{kk} = 0$ si $k > 2$ | [[demo-pacf-ar2]] |
| MA($q$) | $y_t = c + \varepsilon_t + \sum_{j=1}^q\theta_j\varepsilon_{t-j}$ | [[ma-def]] |
| Momentos del MA($q$) | $\gamma(0) = \sigma^2\sum_{j=0}^q\theta_j^2$, $\gamma(k) = \sigma^2\sum_{i=0}^{q-k}\theta_{i+k}\theta_i$, 0 si $k > q$ | [[demo-ma-momentos]] |
| MA(1) | $\rho(1) = \frac{\theta}{1 + \theta^2}$, $\lvert\rho(1)\rvert \le 0.5$; invertible si $\lvert\theta\rvert < 1$ | [[guia-ma1-acf]] |
| Pesos $\psi$ | $\psi_0 = 1$, $\psi_j = \theta_j + \sum_i\phi_i\psi_{j-i}$ | [[demo-psi]] |
| ARMA(1,1) | $\rho(1) = \frac{(\phi + \theta)(1 + \phi\theta)}{1 + 2\phi\theta + \theta^2}$, $\rho(k) = \phi\rho(k-1)$, $\gamma(0) = \frac{\sigma^2(1 + 2\phi\theta + \theta^2)}{1 - \phi^2}$ | [[demo-acf-arma11]] |
| Box–Cox | $\frac{y^\lambda - 1}{\lambda}$ ($\lambda \ne 0$), $\ln y$ ($\lambda = 0$) | [[boxcox]] |
| Media lognormal | $\E[y] = e^{\mu + \sigma^2/2}$ | [[demo-lognormal]] |
| ARIMA | $\phi(L)(1 - L)^d y_t = c + \theta(L)\varepsilon_t$ | [[arima-def]] |
| ARIMA(0,1,1) = SES | $\hat{y}_{t+1} = \alpha y_t + (1 - \alpha)\hat{y}_{t \mid t-1}$, $\alpha = 1 + \theta$ | [[demo-ses]] |
| Varianza del pronóstico | $\sigma_h^2 = \sigma^2\sum_{j=0}^{h-1}\psi_j^2$; banda $\hat{y} \pm 1.96\,\sigma_h$ | [[demo-var-pronostico]] |
| SARIMA | $\phi(L)\Phi(L^s)(1 - L)^d(1 - L^s)^D y_t = \theta(L)\Theta(L^s)\varepsilon_t$ | [[sarima-def]] |
| ACF del modelo de aerolínea | $\rho(1) = \frac{\theta}{1 + \theta^2}$, $\rho(s) = \frac{\Theta}{1 + \Theta^2}$, $\rho(s \pm 1) = \rho(1)\rho(s)$ | [[demo-acf-aerolinea]] |
| SARIMAX | $y_t = \beta' x_t + u_t$, $u_t \sim$ SARIMA | [[armax]] |
| Log-verosimilitud normal | $\ell = -\frac n2\big(\ln 2\pi\hat\sigma^2 + 1\big)$, $\hat\sigma^2 = \frac1n\sum e_t^2$ | [[demo-mv-normal]] |
| Error estándar | $\operatorname{se}(\hat\theta) \approx 1/\sqrt{-\ell''(\hat\theta)}$ | [[mv-curvatura]] |
| Criterios de información | $\AIC = 2k - 2\ell$, $\BIC = k\ln n - 2\ell$, $\HQIC = 2k\ln\ln n - 2\ell$ | [[aic-def]] |
| Coeficientes del summary | $z = \text{coef}/\text{se}$, $p = 2(1 - \Phi(\lvert z\rvert))$, IC $= \text{coef} \pm 1.96\,\text{se}$ | [[summary-coef]] |
| Jarque–Bera | $\JB = \frac n6\big[S^2 + \frac{(K - 3)^2}{4}\big] \sim \chi^2_2$ | [[jarque-bera]] |
| ARCH(1) | $\sigma_t^2 = \omega + \alpha\varepsilon_{t-1}^2$; $\Var = \frac{\omega}{1 - \alpha}$; $K = \frac{3(1 - \alpha^2)}{1 - 3\alpha^2}$ | [[arch1]] |
| ARCH-LM | $\LM = n'R^2 \sim \chi^2_q$ | [[arch-lm]] |
| Métricas | $\MAE$, $\RMSE = \sqrt{\MSE}$, $\MAPE$, $\sMAPE$, $\MASE = \MAE/\MAE_{\text{ingenuo}}$ | [[metricas-def]] |
| Referencias | promedio $\bar{y}$; ingenuo $y_T$; estacional $y_{T+h-m(k+1)}$, $k = \lfloor (h-1)/m \rfloor$; deriva $y_T + h\frac{y_T - y_1}{T - 1}$ | [[ref-metodos]] |
| Bandas de las referencias | $\hat{y} \pm c\,\hat{\sigma}_h$: $\hat{\sigma}\sqrt{1 + 1/T}$, $\hat{\sigma}\sqrt{h}$, $\hat{\sigma}\sqrt{k + 1}$, $\hat{\sigma}\sqrt{h(1 + h/(T-1))}$; $c = 1.28,\ 1.645,\ 1.96$ | [[ref-intervalos]] |
| Residuales del ingenuo | $e_t = \Delta y_t$, $\bar{e} = \frac{y_T - y_1}{T - 1} = b$ | [[demo-ref-media-res]] |

### Tabla de pruebas sobre los residuos {#tabla-pruebas2}

| Prueba | $H_0$ | Si p < 0.05… | En statsmodels |
|---|---|---|---|
| **Ljung–Box** | no hay autocorrelación hasta $h$ | el modelo dejó dinámica sin capturar | `acorr_ljungbox(r, lags=[h], model_df=p+q+P+Q)` |
| **Jarque–Bera** | los residuos son normales | intervalos con ±1.96 poco confiables | `jarque_bera(r)` o el `summary()` |
| **H (breakvar)** | la varianza no cambia entre el inicio y el final | la varianza subió ($H > 1$) o bajó ($H < 1$) | `test_heteroskedasticity("breakvar")` |
| **ARCH-LM** | no hay efectos ARCH | volatilidad agrupada | `het_arch(r, nlags=q)` |
| **z de un coeficiente** | el coeficiente vale 0 | el término sí hace falta | columna `P>\|z\|` del `summary()` |

### Flujo para el examen práctico {#flujo2}

La guía oficial propone este flujo:

1. **Cargar** la serie, convertir la fecha, ordenar y fijar la frecuencia.
2. **Revisar** duplicados, nulos, frecuencia y rango temporal.
3. **Graficar** la serie y describir tendencia, estacionalidad, ciclos, atípicos y cambios de varianza.
4. **Transformar** si la varianza crece con el nivel (log, Box–Cox) [[transformaciones]].
5. **Diferenciar** regular y estacionalmente; confirmar con ADF y KPSS [[diferenciar2]].
6. **Leer** la ACF y la PACF de la serie estacionaria y proponer candidatos [[box-jenkins]].
7. **Estimar** los candidatos y compararlos con AIC/BIC (mismos $d$, $D$ y configuración) [[aic-bic]].
8. **Diagnosticar** los residuos: Ljung–Box, Jarque–Bera, H, ARCH-LM y gráficas [[diagnostico]].
9. **Pronosticar**, regresar a la escala original y evaluar con MAE, RMSE, MAPE y MASE contra la mejor referencia (ingenuo, estacional, deriva o promedio) [[metricas]] [[referencia]].
10. **Concluir** por escrito con números [[caso-ap-conclusion]].

### Errores comunes que restan puntos {#errores2}

:::cuidado Evita estos errores
- Escribir `ar=[1, 0.5]` en `ArmaProcess` para un AR con $\phi = 0.5$ (es `[1, -0.5]`) [[ar-python]].
- Confundir la constante con la media en un AR, o la `const` de `ARIMA` con el `intercept` de `SARIMAX` [[ar-media]].
- Decir que un MA tiene que cumplir una condición para ser estacionario (siempre lo es; la condición es de invertibilidad) [[invertibilidad]].
- Comparar AIC entre modelos con distinto $d$ o $D$, en distinta escala o con distinta configuración de `enforce_*` [[comparabilidad]].
- Incluir los primeros $d + sD$ residuos en las pruebas [[residuos-iniciales]].
- Olvidar `model_df` en Ljung–Box sobre residuos [[lb-residuos]].
- Calcular las métricas en logaritmos en lugar de la escala original [[regresar-escala]].
- Usar `mean_squared_error(..., squared=False)` en scikit-learn reciente [[metricas-python]].
- Validar con una partición aleatoria o con exógenas que no se conocen a futuro [[particion]].
- En statsforecast: usar una `freq` que no coincide con las fechas (`"ME"` con datos al inicio de mes), buscar la columna `RandomWalkWithDrift` (se llama `RWD`) u olvidar `fitted=True` antes de `forecast_fitted_values()` [[ref-statsforecast]].
- Calcular residuales o Ljung–Box sin quitar los `NaN` iniciales de los ajustados [[ref-residuos]].
- Pronosticar un SARIMAX sin pasar la exógena futura [[requisitos-exog]].
:::

### Checklist: antes del examen debes poder… {#checklist2}

- [ ] Escribir un modelo con el operador $L$ y expandir un producto de polinomios (incluido el SARIMA de aerolínea).
- [ ] Calcular la media de un AR($p$) y decidir si un AR(2) es estacionario con el triángulo y con sus raíces.
- [ ] Calcular a mano la ACF de un AR(2) con Yule–Walker y la PACF en el rezago 2.
- [ ] Calcular el periodo de un pseudo-ciclo de un AR(2) con raíces complejas.
- [ ] Calcular la ACF de un MA(1) y de un MA(2) y explicar por qué se corta.
- [ ] Explicar la invertibilidad y por qué $\theta$ y $1/\theta$ no se distinguen.
- [ ] Calcular los pesos $\psi$ de un ARMA(1,1) y su ACF.
- [ ] Identificar AR, MA, ARMA, raíz unitaria y estacionalidad con la ACF y la PACF.
- [ ] Aplicar Box–Cox y regresar a la escala original (mediana y media).
- [ ] Reconocer la sobrediferenciación.
- [ ] Expandir un ARIMA, pronosticarlo a mano y calcular sus bandas con los $\psi_j$.
- [ ] Mostrar que ARIMA(0,1,1) es el suavizamiento exponencial simple.
- [ ] Escribir la ACF teórica del modelo de aerolínea.
- [ ] Explicar la diferencia entre ARMAX y regresión con errores ARMA, y los requisitos de una exógena.
- [ ] Derivar estimadores de máxima verosimilitud sencillos y la log-verosimilitud concentrada.
- [ ] Calcular AIC, BIC y HQIC a mano y decir cuándo dos modelos no son comparables.
- [ ] Interpretar todos los renglones del `summary()` de SARIMAX.
- [ ] Calcular Jarque–Bera y ARCH-LM a mano y decidir con la $\chi^2$.
- [ ] Explicar entrenamiento/validación/prueba, un paso contra varios pasos y el origen móvil.
- [ ] Calcular a mano MAE, RMSE, MAPE, sMAPE y MASE y saber cuál conviene.
- [ ] Calcular a mano los pronósticos del promedio, el ingenuo, el estacional y la deriva, y decir qué ARIMA es cada uno.
- [ ] Calcular los residuales y las bandas de 80% y 95% de una referencia, y explicar por qué crecen con $h$ (o no).
- [ ] Escribir el flujo de statsforecast: formato `unique_id, ds, y`, `forecast` con `level` y `fitted=True`, `forecast_fitted_values`, `evaluate` y `cross_validation`.
- [ ] Redactar la conclusión completa de un caso práctico.
