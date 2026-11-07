## 🛫 Caso integrador: AirPassengers de principio a fin {#caso}
@mapa Todo junto: graficar, descomponer, transformar, probar y concluir como en un examen.

Aplicamos el flujo completo de la unidad a la serie `serie` que construimos en [[pandas]].

### Paso 1 · Mirar {#caso-mirar}

De la gráfica de línea [[linea]] y la gráfica estacional [[estacional-graf]]:

- **Tendencia** creciente: de ~110 a ~430 pasajeros.
- **Estacionalidad** de periodo 12 con pico en julio–agosto.
- **Amplitud que crece con el nivel** ⇒ modelo multiplicativo [[multiplicativo]] ⇒ conviene usar logaritmos [[log]].
- La ACF empieza en 0.95 y baja lentamente [[correlograma]] ⇒ huella de no estacionariedad.

### Paso 2 · Transformar {#caso-transformar}

| Transformación | Qué arregla | Referencia |
|---|---|---|
| $\ln y_t$ | estabiliza la varianza (amplitud constante) | [[log]] |
| $\Delta \ln y_t$ | quita la tendencia (crecimiento mensual ≈ %) | [[diferenciacion]] |
| $\Delta_{12}\ln y_t$ | quita la estacionalidad (crecimiento anual ≈ %) | [[dif-demo]] |
| $\Delta\Delta_{12}\ln y_t$ | quita ambas | |

### Paso 3 · Probar {#caso-probar}

Para la serie en niveles usamos la especificación con tendencia (`"ct"`) porque crece [[especificaciones]]; para las diferenciadas, con constante (`"c"`).

```python
log_ap = np.log(serie)
versiones = {"original": serie, "log": log_ap, "Δ log": log_ap.diff(),
             "Δ₁₂ log": log_ap.diff(12), "ΔΔ₁₂ log": log_ap.diff(12).diff()}
filas = {}
for nombre, x in versiones.items():
    x = x.dropna().values
    reg = "ct" if nombre in ("original", "log") else "c"
    d = diagnostico(x, reg_adf=reg, reg_kpss=reg)
    r = acf(x, nlags=12)
    filas[nombre] = {"spec": reg, "ADF p": d["ADF p"], "KPSS p": d["KPSS p"], "lectura": d["lectura"],
                     "ρ(1)": round(r[1], 3), "ρ(12)": round(r[12], 3),
                     "Ljung-Box p (h=24)": round(acorr_ljungbox(x, lags=[24])["lb_pvalue"].iloc[0], 4)}
print(pd.DataFrame(filas).T.to_string())
```

Cómo se lee cada renglón:

- **Original y log**: ni ADF ni KPSS rechazan ⇒ «evidencia insuficiente». La tabla conjunta [[conjunta]] dice: *revisa la gráfica*. Y la gráfica es clara: tendencia y estacionalidad fuertes, ACF que decae lentamente. (Con la especificación `"c"`, la KPSS rechaza con p < 0.01 y la ADF da p = 0.99.)
- **Δ log**: la tendencia se fue y las pruebas casi dan estacionaria, **pero** $\hat\rho(12) = 0.84$: queda una estacionalidad enorme que ADF y KPSS no ven [[estacionalidad-vs]].
- **Δ₁₂ log**: se fue la estacionalidad, pero $\hat\rho(1) = 0.71$: todavía es muy persistente y la ADF no rechaza al 5%.
- **ΔΔ₁₂ log**: ADF rechaza con p ≈ 0.0002 y KPSS no rechaza ⇒ **estacionaria**. Sin embargo Ljung–Box rechaza: **todavía hay autocorrelación** (estacionaria ≠ ruido blanco [[lb-h]]).

### Paso 4 · Leer la ACF y la PACF de la serie estacionaria {#caso-acf}

```python
final = log_ap.diff(12).diff().dropna()
print("ACF  rezagos 1-13:", np.round(acf(final, nlags=13)[1:], 2))
print("PACF rezagos 1-13:", np.round(pacf(final, nlags=13, method="ywm")[1:], 2))
print("banda ±1.96/√n =", round(1.96 / np.sqrt(len(final)), 3))
```

La ACF tiene picos negativos significativos **solo** en el rezago 1 (−0.34) y en el 12 (−0.39), y casi nada en medio: **se corta** [[patrones]]. Eso sugiere un componente MA(1) regular y un MA(1) estacional: es el famoso «modelo de aerolínea» $\text{SARIMA}(0,1,1)(0,1,1)_{12}$ que se estudia en la Unidad II.

:::interactivo caso | Recorre las transformaciones de AirPassengers
Elige la transformación y la especificación. Verás la serie, su ACF y los resultados de ADF, KPSS y Ljung–Box calculados en vivo.
:::

### Paso 5 · La conclusión (así se redacta en un examen) {#caso-conclusion}

:::examen Conclusión modelo
«La serie AirPassengers presenta tendencia creciente y estacionalidad de periodo 12 cuya amplitud crece con el nivel, por lo que se trabaja con su logaritmo. En niveles no es estacionaria: su ACF decae lentamente y, con especificación constante, la ADF no rechaza la raíz unitaria (p = 0.99) mientras que la KPSS sí rechaza la estacionariedad (p < 0.01). Tras aplicar una diferencia regular y una estacional al logaritmo, la ADF rechaza la raíz unitaria (p ≈ 0.0002) y la KPSS no rechaza la estacionariedad (p > 0.10), por lo que $\Delta\Delta_{12}\ln y_t$ es estacionaria. No obstante, Ljung–Box (h = 24) rechaza la ausencia de autocorrelación y la ACF muestra cortes en los rezagos 1 y 12, lo que sugiere un modelo con componentes MA(1) regular y estacional.»
:::

## 🗒️ Formulario y checklist de la Unidad I {#formulario}
@mapa Todas las fórmulas en una página, la tabla de hipótesis, el flujo de análisis y los errores que restan puntos.

### Fórmulas {#formulas}

| Concepto | Fórmula | Ver |
|---|---|---|
| Media muestral | $\bar y = \frac1n\sum_{t=1}^n y_t$ | [[media]] |
| Autocovarianza muestral | $\hat\gamma(k) = \frac1n\sum_{t=k+1}^n (y_t - \bar y)(y_{t-k} - \bar y)$ | [[autocov]] |
| Autocorrelación | $\hat\rho(k) = \hat\gamma(k)/\hat\gamma(0)$ | [[autocorr]] |
| Modelo aditivo / multiplicativo | $y_t = T_t + S_t + R_t$ / $y_t = T_t \times S_t \times R_t$ | [[aditivo]] |
| Log del multiplicativo | $\ln y_t = \ln T_t + \ln S_t + \ln R_t$ | [[demo-log]] |
| Media móvil 2×4 | $\tfrac18 y_{t-2} + \tfrac14(y_{t-1} + y_t + y_{t+1}) + \tfrac18 y_{t+2}$ | [[mm-centrada]] |
| AR(1) | $y_t = c + \phi y_{t-1} + \varepsilon_t$ | [[ar1]] |
| Media, varianza y ACF del AR(1) | $\mu = \frac{c}{1-\phi}$, $\gamma(0) = \frac{\sigma^2}{1-\phi^2}$, $\rho(k) = \phi^k$ | [[ar1-acf]] |
| Paseo aleatorio | $y_t = y_0 + \sum_{j=1}^t\varepsilon_j$, $\Var(y_t) = t\sigma^2$ | [[paseo-demo]] |
| Raíz del AR(1) | $1 - \phi z = 0 \Rightarrow z = 1/\phi$; estacionario si $\lvert z\rvert > 1$ | [[raiz-demo]] |
| Vida media de un choque | $h = \ln(0.5)/\ln(\phi)$ | [[vida-media]] |
| Sobre-diferenciar | $\Delta(a + bt + \varepsilon_t) = b + \varepsilon_t - \varepsilon_{t-1}$, $\rho(1) = -0.5$ | [[sobre-diferenciar]] |
| Dickey–Fuller | $\Delta y_t = \delta y_{t-1} + \varepsilon_t$, $\tau = \hat\delta/\tip{se}{\operatorname{EE}}(\hat\delta)$ | [[df-deduccion]] |
| ADF | $\Delta y_t = \alpha + \beta t + \delta y_{t-1} + \sum_{i=1}^p \gamma_i \Delta y_{t-i} + \varepsilon_t$ | [[adf]] |
| KPSS | $\eta = \frac{n^{-2}\sum S_t^2}{\lrvar}$, $S_t = \sum_{i\le t}\ehat_i$ | [[kpss]] |
| Bandas de la ACF | $\pm 1.96/\sqrt n$ | [[bartlett]] |
| PACF en el rezago 2 | $\phi_{22} = \frac{\rho_2 - \rho_1^2}{1 - \rho_1^2}$ | [[pacf-2]] |
| ACF del MA(1) | $\rho(1) = \frac{\theta}{1+\theta^2}$, $\rho(k) = 0$ si $k \ge 2$ | [[ma1-acf]] |
| Ljung–Box | $Q = n(n+2)\sum_{k=1}^h \frac{\hat\rho(k)^2}{n-k} \sim \chi^2_h$ | [[lb-formula]] |

### Tabla de hipótesis (la más preguntada) {#tabla-hipotesis}

| Prueba | $H_0$ | $H_1$ | Si p < 0.05… |
|---|---|---|---|
| **ADF** | hay raíz unitaria (no estacionaria) | estacionaria (en media o en tendencia) | evidencia **a favor** de estacionariedad |
| **KPSS** | estacionaria (en nivel o en tendencia) | hay raíz unitaria | evidencia **en contra** de estacionariedad |
| **Ljung–Box** | no hay autocorrelación hasta $h$ | hay autocorrelación | hay dependencia temporal (en residuos: el modelo dejó estructura) |

### Flujo de análisis de la Unidad I {#flujo}

1. **Construir** la serie correctamente: fecha → índice → orden → frecuencia [[pandas]].
2. **Graficar**: línea, estacional, lag plot, estadísticas móviles [[visualizacion]].
3. **Descomponer**: ¿aditiva o multiplicativa? [[descomposicion]]
4. **Transformar** si la varianza crece: logaritmo [[log]].
5. **Probar**: ADF + KPSS con la especificación correcta [[conjunta]].
6. **Diferenciar** lo mínimo necesario ($\Delta$, $\Delta_s$) y volver a probar [[diferenciacion]].
7. **Leer ACF y PACF** de la serie estacionaria [[patrones]] y confirmar con Ljung–Box [[ljung-box]].
8. **Concluir** por escrito: qué se hizo, qué dicen las pruebas y qué modelo sugiere [[caso-conclusion]].

### Errores comunes que restan puntos {#errores}

:::cuidado Evita estos errores
- Decir «acepto $H_0$» en lugar de «no rechazo $H_0$» [[hipotesis]].
- Confundir las hipótesis nulas de ADF y KPSS (son opuestas) [[tabla-hipotesis]].
- Usar ADF solo con constante en una serie con tendencia [[especificaciones]].
- Creer que estacionaria significa «plana» o que significa «ruido blanco» [[no-plana]].
- Creer que si ADF y KPSS dicen «estacionaria» ya no hay estacionalidad [[estacionalidad-vs]].
- Diferenciar de más (aparece $\hat\rho(1) \approx -0.5$) [[sobre-diferenciar]].
- Barajar los datos o hacer particiones aleatorias [[iid]].
- Interpretar una barra aislada fuera de la banda en un rezago alto como señal real [[falsas-alarmas]].
- Olvidar que la ACF muestral divide entre $n$ [[autocov]].
:::

### Checklist: antes del examen debes poder… {#checklist}

- [ ] Explicar la diferencia entre proceso estocástico y realización.
- [ ] Nombrar los 5 elementos mínimos de una serie de tiempo.
- [ ] Distinguir tendencia, estacionalidad, ciclo, ruido y ruptura.
- [ ] Elegir entre modelo aditivo y multiplicativo viendo una gráfica.
- [ ] Calcular a mano una media móvil 2×4 y unos índices estacionales.
- [ ] Calcular a mano $\bar y$, $\hat\gamma(k)$ y $\hat\rho(k)$ de una serie corta.
- [ ] Enunciar las 3 condiciones de estacionariedad débil y decir cuál falla en cada caso de la galería.
- [ ] Deducir la media, la varianza y la ACF del AR(1).
- [ ] Demostrar que $\Var(y_t) = t\sigma^2$ en un paseo aleatorio.
- [ ] Explicar qué es una raíz unitaria y por qué se llama así.
- [ ] Distinguir tendencia determinística de estocástica y saber cómo se elimina cada una.
- [ ] Escribir la ecuación de la ADF y explicar cada término y especificación.
- [ ] Calcular a mano un estadístico de Dickey–Fuller y uno KPSS.
- [ ] Leer conjuntamente ADF y KPSS (las 4 combinaciones).
- [ ] Reconocer los patrones de ACF/PACF de ruido blanco, AR(1), MA(1), paseo aleatorio y estacionalidad.
- [ ] Calcular $\phi_{22}$ a partir de $\rho_1$ y $\rho_2$.
- [ ] Calcular el estadístico de Ljung–Box y decidir con la $\chi^2$.
