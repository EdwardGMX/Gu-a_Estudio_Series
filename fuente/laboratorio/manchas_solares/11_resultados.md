## 🏁 Resultados generales {#resultados}
@mapa Qué se logró, el modelo ganador contra las referencias, qué suposiciones se sostuvieron y cuáles no, los hallazgos principales y las limitaciones.

```python oculto
# Tablas y gráficas del resumen final (con los resultados de los pasos anteriores)
mae_prueba = {"AR(9) con corrección de sesgo": metricas(y_te, pron_media)["MAE"], "AR(9)": metricas(y_te, pron_ar9)["MAE"],
              "SeasonalNaive": tab_ref.loc["SeasonalNaive", "MAE"], "ARIMA(2,1,1)": mae_d1[(2, 1, 1)],
              "AutoARIMA (omisión)": metricas(y_te, pron_auto_def)["MAE"], "AR(2)": metricas(y_te, pron_ar2)["MAE"],
              "AR(2)×SAR(1)₁₁": metricas(y_te, pron_sar)["MAE"], "HistoricAverage": tab_ref.loc["HistoricAverage", "MAE"],
              "Naive": tab_ref.loc["Naive", "MAE"]}
filas_fin, clases_fin = [], []
for n, v in sorted(mae_prueba.items(), key=lambda kv: kv[1]):
    cvv = resumen_cv["MAE"].get(n.replace(" con corrección de sesgo", ""), np.nan) if "corrección" not in n else np.nan
    filas_fin.append([n, f"{v:.2f}", "—" if pd.isna(cvv) else f"{cvv:.2f}"])
    clases_fin.append("elegido" if "corrección" in n else ("reserva" if n == "SeasonalNaive" else ""))
tabla("lab-fin-modelos", ["modelo", "MAE prueba 1979–2008", "MAE validación cruzada"], filas_fin, clases_fin,
      titulo="Todos los modelos, ordenados por su error en la prueba",
      nota="La validación cruzada (12 ventanas de 11 años, 1912–1978) y la prueba (1979–2008) no comparten datos. La corrección de sesgo solo cambia el regreso a la escala, por eso no tiene su propia validación cruzada.")
grafica("lab-fin-serie", [linea(anios, y, "manchas observadas (1700–2008)", "osc", 1.2),
                          linea(anios, tend_40 ** 2, "nivel secular (HP, corte 40 años)", "rosa", 2.4)]
        + banda(xf, lo_fin, hi_fin, "intervalo de 80%", "rgba(124,105,214,.22)")
        + [linea(xf, media_fin, "pronóstico AR(9) 2009–2030", "lav", 2.6)],
        alto=340, title={"text": "309 años de actividad solar, su nivel secular y el pronóstico"}, xaxis={"title": {"text": "año"}}, yaxis={"title": {"text": "manchas"}})
```

### Respuesta al objetivo {#res-objetivo}

**La estructura.** La actividad solar tiene un **ciclo cuasiperiódico** de **{{=duraciones.mean()|.1f}} años en promedio**, con duraciones de {{=duraciones.min()}} a {{=duraciones.max()}} años. Se midió en el tiempo (paso 13), con las raíces del AR(9) ({{=info_raices.iloc[1]['periodo (años)']|.1f}} años, paso 26) y en el espectro (banda de {{=r9['banda'][0]|.1f}} a {{=r9['banda'][1]|.1f}} años, paso 38). Debajo del ciclo hay una **variación secular** de unos 100 años (mínimo de Dalton en {{=minimo_dalton}}, máximo del siglo XX en {{=maximo_moderno}}). Cuando el nivel secular sube, los ciclos son más intensos: correlación de {{=np.corrcoef(amplitud, tend_alineada)[0, 1]|.2f}} entre la amplitud y la tendencia (paso 44).

**El modelo.** Un **AR(9) sobre √y**, con corrección de sesgo al regresar a manchas. En validación cruzada reduce el error de la mejor referencia en {{=100 * (1 - resumen_cv.loc['AR(9)', 'MAE'] / resumen_cv.loc['SeasonalNaive', 'MAE'])|.0f}}% (MAE {{=resumen_cv.loc['AR(9)', 'MAE']|.2f}} contra {{=resumen_cv.loc['SeasonalNaive', 'MAE']|.2f}}), y en la prueba 1979–2008 lo reduce en {{=100 * (1 - metricas(y_te, pron_media)['MAE'] / tab_ref.loc['SeasonalNaive', 'MAE'])|.0f}}% (MAE {{=metricas(y_te, pron_media)['MAE']|.2f}} contra {{=tab_ref.loc['SeasonalNaive', 'MAE']|.2f}}).

@widget lab-tabla id=lab-fin-modelos

### Criterios de éxito {#res-criterios}

| # | Criterio | Resultado | ¿Se cumplió? |
|---|---|---|---|
| 1 | Ganarle a la mejor referencia en validación cruzada | MAE {{=resumen_cv.loc['AR(9)', 'MAE']|.2f}} contra {{=resumen_cv.loc['SeasonalNaive', 'MAE']|.2f}}; gana {{=int(resumen_cv.loc['AR(9)', 'ventanas ganadas'])}} de 12 ventanas | ✅ |
| 2 | Residuos de ruido blanco | Ljung–Box p = {{=lb_ar9['lb_pvalue'].iloc[0]|.3f}} (15 rezagos) y {{=lb_ar9['lb_pvalue'].iloc[1]|.3f}} (22) | ✅ |
| 3 | Intervalos sin valores imposibles y con la cobertura prometida | Límite inferior ≥ 0; cobertura de {{=100 * cob80|.0f}}% (80%) y {{=100 * cob95|.0f}}% (95%) | ✅ (algo conservadores) |
| 4 | Periodo estimado con dos métodos independientes | {{=info_raices.iloc[1]['periodo (años)']|.2f}} años (raíces del AR) y {{=1 / omega[j_ar]|.2f}} (espectro del AR) dentro de la banda de Daniell | ✅ |

### Qué pasó con cada suposición {#res-suposiciones}

| # | Suposición inicial | Veredicto | Evidencia |
|---|---|---|---|
| S1 | El logaritmo estabilizará la varianza. | ❌ No aplicable; log(y + 1) corrige de más. | Tres años en cero ([[paso-6|paso 6]]); correlación nivel–dispersión invertida a {{=comparacion.loc['corr(media móvil, desv. móvil)', 'log(y + 1)']|.2f}} ([[paso-7|paso 7]]). Ganó la raíz ([[paso-9|paso 9]], [[paso-33|paso 33]]). |
| S2 | El ciclo de 11 años es una estacionalidad. | ❌ Descartada con cuatro métodos. | Descomposición aditiva y multiplicativa, STL ([[paso-10|pasos 10–12]]), duraciones de {{=duraciones.min()}} a {{=duraciones.max()}} años con desfase de hasta {{=np.abs(desfase).max()}} años ([[paso-13|paso 13]]), SARIMA₁₁ ([[paso-27|paso 27]]) y armónicos fijos ([[paso-41|paso 41]]). |
| S3 | La serie no es estacionaria y hay que diferenciarla. | ❌ Falsa alarma de las pruebas. | ADF sensible a los rezagos y KPSS reaccionando a la variación secular ([[paso-17|paso 17]]); reversión a la media ([[paso-16|paso 16]]); los modelos con d = 1 pronostican peor ([[paso-28|paso 28]], [[paso-32|paso 32]]). |
| S4 | Un AR(2) basta. | 🟡 Explica el periodo, pero no basta. | Periodo de {{=periodo_ar2|.2f}} años, pero residuos autocorrelacionados y peor que el ingenuo estacional ([[paso-23|paso 23]]); el AR(9) gana por AIC, BIC y AICc ([[paso-24|paso 24]], [[paso-30|paso 30]]). |
| S5 | El MAPE sirve para comparar. | ❌ Lo domina un solo año. | Un año con 2.9 manchas decide el MAPE e invierte el ranking ([[paso-22|paso 22]]). |
| S6 | λ = 6.25 sirve para el filtro HP. | ❌ Su corte cae dentro del ciclo. | Corte de {{=corte_hp(6.25)|.1f}} años ([[paso-42|paso 42]]); λ = {{=lam_40|.0f}} calculado para 40 años sí funciona ([[paso-43|paso 43]], [[paso-45|paso 45]]). |

### Hallazgos principales {#res-hallazgos}

1. **Un ciclo no es una estacionalidad.** Todas las herramientas que suponen un periodo fijo (descomposición clásica, STL, SARIMA estacional, regresión armónica) fallaron por la misma razón: la duración varía y el desfase se acumula hasta medio ciclo. Un proceso **autorregresivo** genera oscilaciones sin fijar su periodo, y por eso funcionó.
2. **Las pruebas de raíz unitaria pueden engañar** en series con ciclos fuertes y variación de muy largo plazo. La decisión de no diferenciar se tomó combinando tres cosas: la sensibilidad de ADF a sus rezagos, KPSS con tendencia y una comprobación directa de reversión a la media. Los pronósticos la confirmaron.
3. **La transformación casi no cambia el pronóstico puntual, pero sí los intervalos.** Sin transformar, el MAE en validación es casi el mismo, pero los intervalos dan manchas negativas en {{=(ic_crudo.iloc[:, 0] < 0).sum()}} de 30 años.
4. **Los valores por omisión no son neutrales.** AutoARIMA con `max_order=5`, el λ = 6.25 de HP y el número de rezagos que eligió ADF llevaron a conclusiones equivocadas. En los tres casos la solución fue entender qué controla el parámetro y elegirlo según el problema.
5. **Tiempo y frecuencia cuentan la misma historia.** El AR(9) de la Unidad II y el espectro de la Unidad III coinciden en el periodo, los armónicos y la variación de baja frecuencia.

@widget lab-graf id=lab-fin-serie

### Limitaciones y siguientes pasos {#res-limitaciones}

- **La amplitud de los ciclos futuros es poco predecible.** El modelo pronostica bien la forma y la fase del siguiente ciclo, pero su altura depende de choques futuros. Por eso el intervalo de 80% en el próximo máximo va de {{=lo_fin[anio_max]|.0f}} a {{=hi_fin[anio_max]|.0f}} manchas.
- **La fase se desvía con el horizonte**: en la prueba el modelo se atrasó un par de años en los máximos de 1989 y 2000, y en el ciclo 24 real se adelantó.
- **Los residuos no son normales y tienen efectos ARCH** ([[paso-31|paso 31]]). Los intervalos resultaron conservadores, pero un modelo de varianza condicional (GARCH) los haría más precisos.
- **Datos anuales.** Los promedios mensuales permitirían estimar con más precisión el momento de cada mínimo y máximo.
- **Siguientes pasos naturales:** modelar la amplitud como función del nivel secular (paso 44), o usar un modelo no lineal en el que los ciclos intensos suban más rápido.
