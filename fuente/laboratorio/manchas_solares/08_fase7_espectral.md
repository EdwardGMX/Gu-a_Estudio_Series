## 🌈 Fase 7 · El dominio de la frecuencia (Unidad III) {#fase-espectral}
@mapa Periodograma, por qué no es consistente, suavizado de Daniell, Welch, el espectro del AR(9) y el intento de describir el ciclo con armónicos fijos.

:::pastilla azul | Aplicar · El periodograma de √y | u3:periodograma u3:periodograma-def u3:unidades-frecuencia
Descomponer la varianza de la serie **por frecuencias**: el periodograma dice cuánta varianza aportan las oscilaciones de cada periodo. Un ciclo dominante aparece como un pico.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `signal.periodogram(z, fs=1.0)` | un dato por año | Con `fs=1` la frecuencia sale en **ciclos por año**: periodo = 1 / frecuencia. |
| `detrend="constant"` | restar la media | Sin esto, la frecuencia 0 se llevaría un pico enorme que no informa nada. |
| `dens / 2` | convención de la guía | scipy devuelve la densidad de un solo lado, que es 2·I(ω). Se divide entre 2 para que coincida con I(ω) de la Unidad III. |
| frecuencias de Fourier | j / n | Con n = 309 hay 154 frecuencias entre 0 y 0.5. |
@@ Código
```python
from scipy import signal

frec, dens = signal.periodogram(z.values, fs=1.0, detrend="constant")
I = dens / 2                                         # periodograma I(ω_j)
picos = pd.DataFrame({"frecuencia": frec, "periodo (años)": 1 / np.where(frec > 0, frec, np.nan), "I": I})
picos = picos.iloc[1:].nlargest(6, "I")
print(f"Resolución en frecuencia: 1/n = {1 / len(z):.4f} ciclos por año")
print(picos.round(4).to_string(index=False))
```
@@ Resultado
```python oculto
per_hover = [f"{1 / f:.1f} años" if f > 0 else "∞" for f in frec]
grafica("lab-perio", [{**linea(frec[1:], I[1:], "periodograma I(ω)", "lav", 1.6), "text": per_hover[1:],
                        "hovertemplate": "ω = %{x:.4f} (periodo %{text})<br>I = %{y:.2f}<extra></extra>"},
                       puntos(picos["frecuencia"], picos["I"], "6 mayores", "rosa", 9)],
        alto=320, title={"text": "Periodograma de √y"}, xaxis={"title": {"text": "frecuencia ω (ciclos por año)"}},
        yaxis={"title": {"text": "I(ω)"}},
        annotations=[{"x": float(r["frecuencia"]), "y": float(r["I"]), "text": f'{r["periodo (años)"]:.1f} años', "showarrow": True, "arrowhead": 0, "ay": -22, "font": {"size": 11}}
                     for _, r in picos.head(3).iterrows()])
```
@widget lab-graf id=lab-perio
@@ Lectura
- **El pico dominante está en ω = {{=picos.iloc[0]['frecuencia']|.4f}}**, es decir, un periodo de **{{=picos.iloc[0]['periodo (años)']|.1f}} años**. Es el ciclo solar, visto ahora desde la frecuencia.
- Muy cerca hay otros picos grandes (periodos de {{=", ".join(f"{p:.1f}" for p in picos['periodo (años)'].iloc[1:] if 9 < p < 13)}} años): el ciclo no es una sola frecuencia, sino una **banda**. Es la versión en frecuencia de lo que mostró el paso 13 (duraciones de 9 a 15 años).
- Hay un pico en **{{=picos.loc[picos['periodo (años)'] > 50, 'periodo (años)'].iloc[0]|.0f}} años**, en las frecuencias más bajas. Es la variación de largo plazo del nivel que se vio en las medias móviles del paso 4 y que hizo rechazar a KPSS en el paso 15 (en física solar se le conoce como ciclo de Gleissberg).
- La gráfica es muy **irregular**: valores vecinos saltan de alto a bajo. Antes de leer periodos "exactos" en ella conviene entender cuánto se puede confiar en cada valor.
@@ Decisión
La tentación es leer el periodo directo del pico más alto: "{{=picos.iloc[0]['periodo (años)']|.2f}} años". El siguiente paso revisa si esa precisión es real: qué tan fina es la rejilla de frecuencias y cuán ancho es el intervalo de confianza de un solo valor del periodograma.
:::

:::pastilla rojo | Aplicar · Leer el periodo "exacto" en el periodograma crudo | u3:periodograma-ruido u3:fuga u3:sesgo-varianza
Comprobar si el valor máximo del periodograma da un periodo **preciso**. Dos cosas lo limitan: la **resolución** (solo se evalúan las frecuencias j/n) y la **varianza** (cada I(ω) se distribuye como f(ω)·χ²₂/2, sin importar cuántos datos haya).
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| frecuencias vecinas | j − 1, j, j + 1 | Los periodos que se pueden "ver" alrededor del pico. |
| IC 95% de un I(ω) | 2I / χ²₂(0.975) a 2I / χ²₂(0.025) | El intervalo de la densidad f(ω) basado en un solo valor del periodograma (2 grados de libertad). |
@@ Código
```python
j_pico = int(np.argmax(I[1:]) + 1)
vecinas = frec[j_pico - 1:j_pico + 2]
print("Periodos de la rejilla alrededor del pico:", (1 / vecinas).round(2))
ic_crudo_I = (2 * I[j_pico] / stats.chi2.ppf(0.975, 2), 2 * I[j_pico] / stats.chi2.ppf(0.025, 2))
print(f"I en el pico = {I[j_pico]:.1f}   IC 95% para f(ω): {ic_crudo_I[0]:.1f} a {ic_crudo_I[1]:.1f}")
print(f"El límite superior es {ic_crudo_I[1] / ic_crudo_I[0]:.0f} veces el inferior.")
```
@@ Lectura
- **Resolución**: los únicos periodos que el periodograma puede evaluar cerca del pico son {{=", ".join(f"{p:.2f}" for p in 1 / vecinas)}} años. "{{=1 / frec[j_pico]|.2f}} años" no es una medición con dos decimales: es **el punto de la rejilla más cercano**. El verdadero periodo medio podría estar en cualquier lugar entre los vecinos.
- **Varianza**: el intervalo de 95% de la densidad en el pico va de **{{=ic_crudo_I[0]|.1f}} a {{=ic_crudo_I[1]|.1f}}**. El límite superior es **{{=ic_crudo_I[1] / ic_crudo_I[0]|.0f}} veces** el inferior. Con esa incertidumbre, que el valor de 11.0 años sea mayor que el de 10.0 no significa nada.
- Y este problema **no mejora con más datos**: con 3,000 años, cada I(ω) seguiría teniendo 2 grados de libertad. El periodograma crudo **no es un estimador consistente** de la densidad espectral.
@@ Decisión
❌ El periodograma crudo sirve para **ver** dónde hay picos, no para **medir**. Hay que suavizarlo. El siguiente paso aplica el promedio de Daniell, que intercambia resolución por estabilidad, y construye intervalos que sí sirven.
:::

:::pastilla verde | Aplicar · Suavizado de Daniell con intervalos de confianza | u3:no-parametrico u3:idea-suavizar u3:suavizado-python
Estimar la densidad espectral promediando **L** valores vecinos del periodograma (Daniell). Cada promedio tiene 2L grados de libertad: más L, menos varianza, pero también menos resolución (ancho de banda B = L/n).
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| L = 5 y L = 9 | dos anchos | 5 conserva más detalle; 9 es más estable. Comparar los dos muestra qué conclusiones dependen del ancho. |
| `np.pad(I, m, mode="reflect")` | extremos | Refleja los valores en los bordes para poder promediar también las primeras y últimas frecuencias. |
| IC: 2L·f̂ / χ²_{2L} | 2L grados de libertad | El intervalo correspondiente al promedio de L valores. |
| ancho a media altura | f̂ ≥ máx/2 | La banda de periodos donde se concentra el ciclo. |
@@ Código
```python
def daniell(I, L):
    m = (L - 1) // 2
    return np.convolve(np.pad(I, m, mode="reflect"), np.ones(L) / L, mode="valid")

resultados_dan = {}
for L in (5, 9):
    f_hat = daniell(I, L)
    j = int(np.argmax(f_hat[1:]) + 1)
    gl = 2 * L
    ic = (gl * f_hat[j] / stats.chi2.ppf(0.975, gl), gl * f_hat[j] / stats.chi2.ppf(0.025, gl))
    banda_ciclo = frec[(f_hat >= f_hat[j] / 2) & (frec > 0.05) & (frec < 0.15)]
    resultados_dan[L] = {"f_hat": f_hat, "j": j, "ic": ic, "banda": (1 / banda_ciclo.max(), 1 / banda_ciclo.min())}
    print(f"L = {L}: pico en {1 / frec[j]:.2f} años | IC 95% de f en el pico: {ic[0]:.1f} a {ic[1]:.1f} "
          f"(razón {ic[1] / ic[0]:.1f}) | banda a media altura: {1 / banda_ciclo.max():.1f}–{1 / banda_ciclo.min():.1f} años | B = {L / len(z):.4f}")
```
@@ Resultado
```python oculto
r5, r9 = resultados_dan[5], resultados_dan[9]
lo9 = 2 * 9 * r9["f_hat"] / stats.chi2.ppf(0.975, 18); hi9 = 2 * 9 * r9["f_hat"] / stats.chi2.ppf(0.025, 18)
grafica("lab-daniell", [linea(frec[1:], I[1:], "periodograma crudo", "gris", 1)]
        + banda(frec[1:], lo9[1:], hi9[1:], "IC 95% (L = 9)", "rgba(63,174,138,.16)")
        + [linea(frec[1:], r5["f_hat"][1:], "Daniell L = 5", "lav", 2.2), linea(frec[1:], r9["f_hat"][1:], "Daniell L = 9", "menta", 2.6)],
        alto=330, title={"text": "Periodograma suavizado de Daniell (escala logarítmica)"},
        xaxis={"title": {"text": "frecuencia ω (ciclos por año)"}}, yaxis={"type": "log", "title": {"text": "densidad"}})
```
@widget lab-graf id=lab-daniell
@@ Lectura
- Con **L = 5**, el pico queda en {{=1 / frec[r5['j']]|.2f}} años, y la razón entre los límites del intervalo baja de {{=ic_crudo_I[1] / ic_crudo_I[0]|.0f}} (crudo) a **{{=r5['ic'][1] / r5['ic'][0]|.1f}}**.
- Con **L = 9**, el pico se mueve a {{=1 / frec[r9['j']]|.2f}} años y la razón baja a **{{=r9['ic'][1] / r9['ic'][0]|.1f}}**. Que el "periodo del pico" cambie con L es la prueba de que no se puede afirmar un periodo con decimales. Lo robusto es la **banda**: a media altura, el ciclo ocupa de **{{=r9['banda'][0]|.1f}} a {{=r9['banda'][1]|.1f}} años** (L = 9).
- En escala logarítmica, el intervalo de confianza tiene el **mismo ancho vertical** en todas las frecuencias, una propiedad útil para comparar. El pico del ciclo solar queda muy por encima de las frecuencias altas: es real, no ruido.
- La variación de largo plazo (frecuencias cercanas a 0) también sobrevive al suavizado.
@@ Decisión
✅ El dominio de la frecuencia da un ciclo con su pico entre **{{=1 / frec[r5['j']]|.1f}} y {{=1 / frec[r9['j']]|.1f}} años** (según el suavizado) y la mayor parte de su varianza entre {{=r9['banda'][0]|.1f}} y {{=r9['banda'][1]|.1f}} años, con incertidumbre cuantificada. Para confirmar que esto no depende del método de suavizado, el siguiente paso usa el otro estimador no paramétrico de la Unidad III, el de **Welch**.
:::

:::pastilla azul | Aplicar · El método de Welch y el costo de segmentar | u3:welch u3:daniell-vs-welch u3:taper
Estimar la densidad promediando periodogramas de **segmentos** traslapados. Es la alternativa a Daniell: reduce la varianza cortando la serie en vez de promediar frecuencias vecinas.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `nperseg=64` | segmentos de 64 años | Unos 8 segmentos con 50% de traslape: varianza baja. Resolución 1/64 ≈ 0.016. |
| `nperseg=128` | segmentos de 128 años | Pocos segmentos (unos 3): más resolución y más varianza. |
| ventana | Hann (por omisión) | Reduce la fuga de un pico hacia frecuencias vecinas. |
| `/ 2` | misma convención | Para comparar con el periodograma. |
@@ Código
```python
resultados_welch = {}
for nps in (64, 128):
    fw, Pw = signal.welch(z.values, fs=1.0, nperseg=nps, detrend="constant")
    Pw = Pw / 2
    j = int(np.argmax(Pw[1:]) + 1)
    resultados_welch[nps] = (fw, Pw)
    print(f"nperseg = {nps}: {len(fw)} frecuencias, pico en {1 / fw[j]:.2f} años, "
          f"periodo más largo visible = {1 / fw[1]:.0f} años")
```
@@ Resultado
```python oculto
fw64, P64 = resultados_welch[64]; fw128, P128 = resultados_welch[128]
grafica("lab-welch", [linea(frec[1:], r9["f_hat"][1:], "Daniell L = 9", "menta", 2),
                      linea(fw64[1:], P64[1:], "Welch, 64 años", "dur", 2.4, mode="lines+markers"),
                      linea(fw128[1:], P128[1:], "Welch, 128 años", "cel", 1.8, mode="lines+markers")],
        alto=320, title={"text": "Welch contra Daniell"}, xaxis={"title": {"text": "frecuencia ω (ciclos por año)"}},
        yaxis={"type": "log", "title": {"text": "densidad"}})
```
@widget lab-graf id=lab-welch
@@ Lectura
- Las tres estimaciones coinciden en lo esencial: un pico ancho alrededor de **0.09 ciclos por año** (entre 10.5 y 11.7 años). Con 64 años el pico queda en {{=1 / fw64[int(np.argmax(P64[1:]) + 1)]|.2f}} años, y con 128 en {{=1 / fw128[int(np.argmax(P128[1:]) + 1)]|.2f}}.
- **El costo de segmentar**: con segmentos de 64 años, la frecuencia más baja que se puede ver corresponde a un periodo de **{{=1 / fw64[1]|.0f}} años**. La variación de ~100 años **desaparece** de la estimación de Welch-64, cuando Daniell sí la mostraba. Ningún segmento de 64 años contiene un ciclo de 100.
- Con 128 años la variación de largo plazo empieza a asomar, pero la curva es más irregular (menos segmentos que promediar).
@@ Decisión
Para el ciclo de 11 años los dos métodos coinciden. Para la variación secular, Welch con segmentos cortos no sirve; esa parte se estudiará con filtros en la Fase 8. Antes, el siguiente paso cierra el círculo con la Unidad II: calcula el **espectro teórico del AR(9)** y lo compara con estas estimaciones.
:::

:::pastilla verde | Aplicar · El espectro paramétrico del AR(9) | u3:parametrico u3:ar-espectral u3:comparacion-espectral
Calcular la densidad espectral que **implica** el AR(9) y compararla con la estimación no paramétrica. Si coinciden, el modelo de la Unidad II y el análisis de la Unidad III describen la misma serie.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| f(ω) = σ² / \|φ(e^{−2πiω})\|² | fórmula del AR(p) | La densidad de un AR depende solo de sus coeficientes y de la varianza del choque. |
| `ARIMA(z, order=(9, 0, 0))` | serie completa | Para comparar con el periodograma de los 309 años, el modelo se ajusta con los mismos datos. |
| rejilla | 2,001 frecuencias | El espectro paramétrico es una curva suave: se puede evaluar en cualquier frecuencia. |
@@ Código
```python
ar9_total = ARIMA(z, order=(9, 0, 0)).fit()
phis, sigma2 = ar9_total.arparams, ar9_total.params["sigma2"]
omega = np.linspace(0, 0.5, 2001)
polinomio = 1 - sum(phis[k] * np.exp(-2j * np.pi * omega * (k + 1)) for k in range(9))
f_ar9 = sigma2 / np.abs(polinomio) ** 2
j_ar = int(np.argmax(f_ar9))
print(f"Pico del espectro AR(9): ω = {omega[j_ar]:.4f} → periodo {1 / omega[j_ar]:.2f} años")
print(f"Daniell (L = 9): {1 / frec[r9['j']]:.2f} años | raíz principal del AR(9) del paso 26: {info_raices.iloc[1]['periodo (años)']:.2f} años")
print(f"Área bajo f(ω) en [−½, ½] = {2 * np.trapezoid(f_ar9, omega):.2f} | varianza de √y = {z.var():.2f}")
```
@@ Resultado
```python oculto
grafica("lab-espectro-ar", [linea(frec[1:], I[1:], "periodograma crudo", "gris", 1),
                            linea(frec[1:], r9["f_hat"][1:], "Daniell L = 9", "menta", 2),
                            linea(omega[1:], f_ar9[1:], "espectro del AR(9)", "lav", 2.8)],
        alto=320, title={"text": "El AR(9) y el periodograma describen la misma serie"},
        xaxis={"title": {"text": "frecuencia ω (ciclos por año)"}}, yaxis={"type": "log", "title": {"text": "densidad"}})
```
@widget lab-graf id=lab-espectro-ar
@@ Lectura
- El espectro del AR(9) tiene su pico en **{{=1 / omega[j_ar]|.2f}} años**, dentro de la banda del suavizado de Daniell y prácticamente igual al periodo de la raíz principal del paso 26 ({{=info_raices.iloc[1]['periodo (años)']|.2f}}). **Se cumple el criterio de éxito 4**: dos métodos independientes coinciden.
- La curva lila sigue a la estimación no paramétrica en todo el rango: el pico principal, los **armónicos** de 5.2 y 3.4 años (una pequeña joroba cerca de 0.19 y otra casi imperceptible cerca de 0.28) y la subida hacia las frecuencias bajas.
- El área bajo el espectro ({{=2 * np.trapezoid(f_ar9, omega)|.2f}}) reproduce aproximadamente la varianza de √y ({{=z.var()|.2f}}), como exige la relación entre la densidad espectral y γ(0).
@@ Decisión
✅ El AR(9) queda validado también en frecuencia. Para terminar la fase, se prueba una última versión de la suposición S2, ahora en frecuencia: describir el ciclo con una **regresión armónica** (senos y cosenos de periodo fijo 11).
:::

:::pastilla rojo | Aplicar · Regresión armónica con periodo fijo de 11 años | u3:armonicos u3:periodicidad u3:cuando-sarima
Ajustar z_t = β₀ + Σ [aₖ cos(2πkt/11) + bₖ sin(2πkt/11)] con k = 1, 2. Si el ciclo tuviera periodo fijo, una senoide con su armónico explicaría casi toda la variación y dejaría un residuo sin estructura.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| k = 1, 2 | fundamental y armónico | El armónico permite la forma asimétrica (sube rápido, baja despacio). |
| `sm.OLS` | mínimos cuadrados | Es una regresión lineal en los senos y cosenos. |
| barrido de periodos | 9.0 a 14.0 | Para buscar el **mejor** periodo fijo posible, y no solo el 11. |
| dos mitades | 1700–1854 y 1855–2008 | Si la **fase** cambia entre mitades, el ciclo no es estrictamente periódico. |
@@ Código
```python
t = np.arange(len(z))

def armonicos(periodo, k_max=2, tt=t):
    cols = {"const": np.ones(len(tt))}
    for k in range(1, k_max + 1):
        cols[f"cos{k}"] = np.cos(2 * np.pi * k * tt / periodo)
        cols[f"sin{k}"] = np.sin(2 * np.pi * k * tt / periodo)
    return pd.DataFrame(cols)

arm11 = sm.OLS(z.values, armonicos(11)).fit()
r_arm = acf(arm11.resid, nlags=11)
print(f"Periodo 11: R² = {arm11.rsquared:.3f} | ACF del residuo en 1 y 11: {r_arm[1]:.2f}, {r_arm[11]:.2f}")

barrido = {p: sm.OLS(z.values, armonicos(p, 1)).fit().rsquared for p in np.arange(9.0, 14.01, 0.05)}
mejor_p = max(barrido, key=barrido.get)
print(f"Mejor periodo fijo (k = 1): {mejor_p:.2f} años con R² = {barrido[mejor_p]:.3f}")

mitad = len(z) // 2
fases = []
for a, b in [(0, mitad), (mitad, len(z))]:
    mod = sm.OLS(z.values[a:b], armonicos(11, 1, t[a:b])).fit()
    fases.append(np.degrees(np.arctan2(mod.params["sin1"], mod.params["cos1"])))
desfase_fase = (fases[1] - fases[0] + 180) % 360 - 180
print(f"Fase estimada: 1ª mitad {fases[0]:.0f}°, 2ª mitad {fases[1]:.0f}° → desfase {desfase_fase:.0f}° ≈ {abs(desfase_fase) / 360 * 11:.1f} años")
```
@@ Resultado
```python oculto
grafica("lab-armonica", [linea(anios, z, "√manchas", "gris", 1.3), linea(anios, arm11.fittedvalues, "armónicos de periodo 11", "rosa", 2.2)],
        alto=300, title={"text": "Una oscilación de periodo fijo se desfasa de la serie"}, xaxis={"title": {"text": "año"}})
grafica("lab-barrido", [linea(list(barrido), list(barrido.values()), "R² con un periodo fijo", "lav", 2.4)],
        alto=250, title={"text": "R² de la regresión armónica según el periodo fijo"}, showlegend=False,
        xaxis={"title": {"text": "periodo fijo (años)"}}, yaxis={"title": {"text": "R²"}})
```
@widget lab-graf id=lab-armonica
@widget lab-graf id=lab-barrido
@@ Lectura
- Con periodo 11 y su armónico, el modelo explica solo **R² = {{=arm11.rsquared|.3f}}** de la variación, y su residuo conserva una ACF de **{{=r_arm[1]|.2f}}** en el rezago 1. El ciclo sigue ahí.
- Y no es cuestión de elegir otro periodo: el barrido de 9 a 14 años encuentra el mejor en **{{=mejor_p|.2f}}** años, con R² = {{=barrido[mejor_p]|.3f}} (con un solo armónico). La curva del barrido es puntiaguda: con un periodo fijo apenas distinto de 11, el error se acumula en 300 años y la senoide se desalinea.
- La **fase** se movió {{=abs(desfase_fase)|.0f}}° entre la primera y la segunda mitad de la serie, unos {{=abs(desfase_fase) / 360 * 11|.1f}} años. Un ciclo estrictamente periódico tendría la misma fase siempre.
- Comparación: el AR(9), con la misma serie, deja residuos sin autocorrelación. La diferencia es conceptual: la regresión armónica supone una oscilación **determinista** (como una estacionalidad); el AR genera oscilaciones **estocásticas** que pueden adelantarse o atrasarse.
@@ Decisión
❌ La suposición S2 queda descartada también en el dominio de la frecuencia, con el tercer método (después de la descomposición y del SARIMA). La Fase 8 usa **filtros** para separar el ciclo de 11 años de la variación secular, y con eso describir cómo cambia la amplitud de los ciclos a lo largo de 300 años.
:::
