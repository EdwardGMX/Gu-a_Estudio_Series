## 🌊 Caso integrador: El Niño en el dominio de la frecuencia {#caso-elnino}
@mapa Toda la unidad en un caso real: la temperatura mensual del mar en el Pacífico (1950–2010). Una periodicidad exacta (el ciclo anual) junto a un ciclo irregular (El Niño), el espectro estimado de tres formas, un filtro pasa banda para aislar los eventos y la conclusión redactada como en el examen.

La serie es la temperatura superficial del mar en la región de El Niño, mensual, de 1950 a 2010 ($n = 732$). Tiene justo lo que la guía oficial pide distinguir: una **periodicidad** (las estaciones del año, exactamente cada 12 meses) y un **ciclo** (El Niño y La Niña, que se repiten cada 2 a 7 años, con duración y fuerza variables).

:::interactivo w3-caso-elnino | El caso en siete pasos {#w-caso-elnino}
Recorre el análisis con los botones. Cada paso muestra la gráfica que justifica la decisión y lo que se escribiría en el reporte.
@@@
- **Botones**: un paso a la vez, en el orden del flujo práctico.
- **Gráfica**: la evidencia de ese paso (la serie, el periodograma, los estimadores suavizados, la ganancia del filtro o los eventos aislados).
- **Recuadro**: la decisión y la frase para el reporte.
:::

### Pasos 1 y 2 · La serie y su ciclo anual {#elnino-serie}

```python
climatologia = nino.groupby(nino.index.month).mean()               # promedio de cada mes del año
print(f"mes más cálido: {climatologia.idxmax()} | más frío: {climatologia.idxmin()} | amplitud: {climatologia.max() - climatologia.min():.2f} °C")
anomalia = nino - nino.groupby(nino.index.month).transform("mean")  # quitar el ciclo anual promedio
print(f"varianza total: {nino.var(ddof=0):.3f} | varianza de las anomalías: {anomalia.var(ddof=0):.3f}")
```

El ciclo anual es grande (el mar está casi 6 °C más caliente en marzo que en septiembre) y explica la mayor parte de la varianza. Quitarle a cada mes su promedio histórico (la **climatología**) es un rechaza banda que elimina la parte periódica exacta; lo que queda son las **anomalías**, donde vive El Niño.

### Paso 3 · El espectro: una línea y una joroba {#elnino-espectro}

```python
x = nino.values - nino.values.mean()
n = len(x)
I = np.abs(np.fft.fft(x)) ** 2 / n
w = np.arange(n) / n
def fraccion(a, b):
    sel = (w >= a) & (w <= b)
    return 2 * I[sel].sum() / n / x.var()
print(f"ciclo anual (periodos de 11 a 13 meses): {fraccion(1 / 13, 1 / 11):.1%} de la varianza")
print(f"El Niño (periodos de 2 a 7 años):        {fraccion(1 / 84, 1 / 24):.1%} de la varianza")
```

| Componente | Forma en el periodograma | Fracción de la varianza | Tipo |
|---|---|---|---|
| Ciclo anual | Línea angosta en $\omega = 1/12$ (y un armónico pequeño) | 76% | **Periodicidad** |
| El Niño / La Niña | Joroba ancha entre $1/84$ y $1/24$ | 14% | **Ciclo** |
| Resto | Disperso | 10% | Ruido y variación lenta |

La diferencia de forma es la de [[periodo-vs-ciclo]]: el ciclo anual pone toda su potencia en una sola frecuencia de Fourier; El Niño la reparte en muchas, porque su duración cambia de un evento a otro.

### Paso 4 · Estimar el espectro de las anomalías de tres formas {#elnino-estimar}

```python
w_d, I_d, f_d = periodograma_suavizado(anomalia.values, 3)                 # Daniell, L = 7
print(f"Daniell (L = 7): pico en {1 / w_d[f_d.argmax()]:.1f} meses")
f_w, P_w = signal.welch(anomalia.values, nperseg=240)                         # segmentos de 20 años
print(f"Welch (nperseg = 240): pico en {1 / f_w[1:][P_w[1:].argmax()]:.1f} meses")
aic = [n * np.log(yule_walker(anomalia.values, order=p, method="mle")[1] ** 2) + 2 * (p + 1) for p in range(1, 25)]
p_aic = int(np.argmin(aic)) + 1
phi, s = yule_walker(anomalia.values, order=p_aic, method="mle")
ww = np.linspace(0.002, 0.5, 5000)
zz = np.exp(-2j * np.pi * ww)
f_ar = s ** 2 / np.abs(1 - sum(phi[k] * zz ** (k + 1) for k in range(p_aic))) ** 2
print(f"AR({p_aic}) elegido por AIC: pico en {1 / ww[f_ar.argmax()]:.1f} meses")
```

Los tres métodos coinciden en un ciclo de **4 a 5 años** (52 a 60 meses), con una joroba ancha: es un ciclo, no una periodicidad [[comparacion-espectral]]. Ninguno justificaría un término estacional con $s = 52$ o $s = 60$.

### Pasos 5 y 6 · Aislar El Niño con un pasa banda {#elnino-filtro}

```python
b, a = butter(4, [1 / 84, 1 / 24], btype="bandpass", fs=1)           # periodos de 2 a 7 años
enso = filtfilt(b, a, anomalia.values)                                # fase cero: para describir el pasado
picos, _ = find_peaks(enso, distance=18, prominence=0.4)
fuertes = [(str(nino.index[i])[:7], float(round(enso[i], 2))) for i in picos if enso[i] > 1.2]
print("eventos de El Niño más fuertes (mes, °C):", fuertes)
print(f"la banda de 2 a 7 años explica {enso.var() / anomalia.var(ddof=0):.0%} de la varianza de las anomalías")
```

El filtro recupera los eventos conocidos: 1957–58, 1972–73, **1982–83** y **1997–98** (los dos más fuertes del siglo XX). Como usamos `filtfilt`, el resultado está alineado en el tiempo, pero usa datos futuros: sirve para describir el pasado, no para pronosticar el próximo evento [[fase-cero]].

### Paso 7 · La conclusión, como se redacta en el examen {#elnino-conclusion}

:::examen Conclusión del caso El Niño
«Se analizó la temperatura superficial mensual del mar en la región de El Niño (1950–2010, $n = 732$). El periodograma muestra dos estructuras distintas. La primera es una **periodicidad**: una línea angosta en $\omega = 1/12$ que concentra el 76% de la varianza y corresponde al ciclo anual (el mar es casi 6 °C más cálido en marzo que en septiembre); por ser exacta, se justifica modelarla con la climatología mensual o con un término estacional de periodo 12. La segunda es un **ciclo**: una joroba ancha entre periodos de 2 y 7 años que concentra el 14% de la varianza total. Al quitar la climatología, los tres estimadores del espectro de las anomalías (Daniell con $L = 7$, Welch con segmentos de 20 años y un AR(7) elegido por AIC) coinciden en un máximo entre 52 y 60 meses, pero con un pico ancho, lo que indica una duración variable: no se justifica un SARIMA con periodo fijo para este componente. Un filtro Butterworth pasa banda de orden 4 entre 24 y 84 meses, aplicado con fase cero, explica cerca de la mitad de la varianza de las anomalías y recupera los eventos de 1972–73, 1982–83 y 1997–98. Como el filtro usa información futura, sirve para describir y no para pronosticar.»
:::

:::cuidado Lo que más se olvida en un análisis espectral
- Reportar frecuencias sin traducirlas a **periodos** en unidades del problema (meses, años).
- Interpretar picos del periodograma **crudo** sin suavizar (o sin compararlos con otro estimador).
- Analizar una serie con tendencia sin quitarla: la fuga de la frecuencia cero inventa «ciclos largos».
- Llamar «periodo» a un ciclo de duración variable, o modelarlo con un SARIMA de periodo fijo.
- Usar un filtro de fase cero dentro de un modelo de pronóstico.
:::

:::resumen Lo que debes llevarte del caso El Niño
- Una línea angosta en el periodograma es una periodicidad (aquí, anual: 76% de la varianza); una joroba ancha es un ciclo (El Niño, de 2 a 7 años: 14%).
- Quitar la climatología mensual elimina la periodicidad; el espectro de las anomalías muestra el ciclo con un máximo cerca de 4.5 años.
- Daniell, Welch y AR coinciden: la conclusión es robusta. Un pasa banda de 24 a 84 meses aísla los eventos.
:::
