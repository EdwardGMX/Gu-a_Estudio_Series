## ✈️ Caso integrador: AirPassengers de principio a fin {#caso-ap}
@mapa El flujo completo del examen práctico en nueve pasos: cargar, transformar, diferenciar y probar, identificar, estimar y comparar, diagnosticar, pronosticar, evaluar y redactar la conclusión.

Este caso junta todo lo de la unidad en el orden de la guía oficial. Cada paso tiene su código, lo que hay que mirar y el enlace a la sección donde se explica.

:::interactivo w2-caso-ap | El caso en nueve pasos {#w-caso-ap}
Recorre el caso con los botones. Cada paso muestra la gráfica o la tabla que justifica la decisión y la decisión que se toma.
@@@
- **Botones**: un paso a la vez, en el orden en que se hace en el examen.
- **Gráfica**: la evidencia de ese paso (la serie, la ACF, la tabla de AIC, los residuos o el pronóstico).
- **Recuadro**: qué se concluye y qué se escribe en el reporte.
:::

### Pasos 1 a 3 · Preparar la serie {#caso-ap-preparar}

| Paso | Qué se hace | Resultado | Ver |
|---|---|---|---|
| 1 · Cargar y graficar | índice mensual, frecuencia `MS`, 144 datos | tendencia creciente y estacionalidad de 12 meses cuya amplitud crece | [[u1:caso-mirar]] |
| 2 · Transformar | logaritmo (Box–Cox da $\hat\lambda = 0.148 \approx 0$) | varianza más estable | [[boxcox]] |
| 3 · Diferenciar y probar | $\Delta\Delta_{12}\ln y_t$; ADF p = 0.0002, KPSS p > 0.10 | estacionaria: $d = 1$, $D = 1$ | [[guia-etapas]] |

### Pasos 4 y 5 · Identificar, estimar y comparar {#caso-ap-modelo}

La ACF de $\Delta\Delta_{12}\ln y_t$ tiene picos en 1 y 12 (y satélites en 11 y 13): la firma del modelo de aerolínea [[guia-acf-aerolinea]]. Candidatos razonables: (0,1,1)(0,1,1), (1,1,0)(0,1,1), (1,1,1)(0,1,1) y (0,1,1)(1,1,1).

```python
candidatos = [((0, 1, 1), (0, 1, 1, 12)), ((1, 1, 0), (0, 1, 1, 12)), ((1, 1, 1), (0, 1, 1, 12)), ((0, 1, 1), (1, 1, 1, 12))]
tabla_c = []
for orden, est in candidatos:
    m = SARIMAX(train, order=orden, seasonal_order=est).fit(disp=False)
    r = m.resid.iloc[m.loglikelihood_burn:]
    k_arma = orden[0] + orden[2] + est[0] + est[2]
    tabla_c.append({"modelo": f"{orden}{est[:3]}", "AIC": round(m.aic, 2), "BIC": round(m.bic, 2),
                    "LB p (24)": round(acorr_ljungbox(r, lags=[24], model_df=k_arma)["lb_pvalue"].iloc[0], 3)})
print(pd.DataFrame(tabla_c).sort_values("AIC").to_string(index=False))
```

Gana el modelo de aerolínea por AIC y por BIC, con residuos sin autocorrelación [[guia-rejilla]].

### Pasos 6 a 8 · Diagnosticar, pronosticar y evaluar {#caso-ap-evaluar}

```python
final = SARIMAX(train, order=(0, 1, 1), seasonal_order=(0, 1, 1, 12)).fit(disp=False)
res_final = final.resid.iloc[final.loglikelihood_burn:]
print("Ljung-Box (12, 24):", np.round(acorr_ljungbox(res_final, lags=[12, 24], model_df=2)["lb_pvalue"].values, 3))
print("Jarque-Bera p:", round(final.test_normality("jarquebera")[0][1], 3), "| H p:", round(final.test_heteroskedasticity("breakvar")[0][1], 4))
pron_final = final.get_forecast(12)
pred = np.exp(pron_final.predicted_mean)
real = np.exp(test)
error = real - pred
print(f"MAE = {np.mean(np.abs(error)):.2f} | RMSE = {np.sqrt(np.mean(error ** 2)):.2f} | MAPE = {100 * np.mean(np.abs(error / real)):.2f}%")
ingenuo_est = serie.iloc[-24:-12].values
print(f"Ingenuo estacional: MAPE = {100 * np.mean(np.abs((real.values - ingenuo_est) / real.values)):.2f}%")
```

| Paso | Resultado | Ver |
|---|---|---|
| 6 · Diagnóstico | Ljung–Box p = 0.74 (12) y 0.67 (24); Jarque–Bera p = 0.56; H p = 0.003 (la varianza bajó) | [[diagnostico]] |
| 7 · Pronóstico | 12 meses de 1960, de regreso a pasajeros con `exp` (bandas asimétricas) | [[regresar-escala]] |
| 8 · Evaluación | MAE = 13.26, RMSE = 18.59, MAPE = 2.90%, MASE = 0.44; ingenuo estacional: MAPE = 9.99% | [[metricas]] |

### Paso 9 · La conclusión, como se redacta en el examen {#caso-ap-conclusion}

:::examen Conclusión del caso AirPassengers
«Se modeló el logaritmo de la serie AirPassengers (1949–1959 para entrenar, 1960 para probar). La serie transformada requirió una diferencia regular y una estacional ($d = D = 1$): con ellas la ADF rechaza la raíz unitaria (p = 0.0002) y la KPSS no rechaza la estacionariedad (p > 0.10). La ACF de la serie diferenciada presenta picos en los rezagos 1 y 12, lo que sugiere componentes MA(1) regular y estacional. Entre los candidatos, el SARIMA(0,1,1)(0,1,1)₁₂ obtuvo el menor AIC (−441.25) y el menor BIC (−432.92); sus coeficientes $\hat\theta = -0.349$ y $\hat\Theta = -0.562$ son significativos e invertibles. Los residuos no muestran autocorrelación (Ljung–Box p = 0.74 con 12 rezagos y 0.67 con 24) y son compatibles con normalidad (Jarque–Bera p = 0.56), aunque su varianza disminuye a lo largo de la muestra (prueba H, p = 0.003). En 1960 el modelo logra un MAPE de 2.90% (RMSE = 18.6 miles de pasajeros) frente a 9.99% del pronóstico ingenuo estacional, por lo que se considera adecuado para pronosticar.»
:::

:::cuidado Lo que más se olvida en el caso práctico
- Evaluar las métricas en **logaritmos** en lugar de pasajeros.
- Usar los primeros 13 residuos (los de la inicialización) en las pruebas.
- Comparar el AIC de modelos con distinto $d$ o $D$, o de un modelo en log con otro en niveles.
- Reportar solo el `summary()` sin decir qué significa cada número.
- Olvidar comparar contra un pronóstico ingenuo.
:::
