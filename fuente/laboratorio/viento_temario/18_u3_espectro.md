## 📊 Unidad III · Densidad espectral y periodograma {#u3-espectro}
@mapa El espectro teórico de los modelos de la Unidad II, la varianza por bandas, el periodograma, Parseval, su ruido, la fuga espectral, el suavizado de Daniell, el método de Welch, la estimación paramétrica con AR y los armónicos del ciclo diario.

:::pastilla azul | Aplicar · El espectro teórico de los modelos de la Unidad II | u3:def-densidad u3:espectro-ar1 u3:espectro-arma u3:espectro-rb {#u3-teorico}
Calcular la **densidad espectral** de los AR estimados en la Unidad II: $f(\omega) = \frac{\sigma^2}{2\pi}\frac{1}{|\phi(e^{-i\omega})|^2}$. Un AR(1) con φ > 0 tiene un espectro **rojo** (más potencia en frecuencias bajas); el ruido blanco es plano; un AR de orden alto puede tener picos.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| modelos | ruido blanco, AR(1) y AR(72) en m/s | Del más simple al mejor AR. |
| φ(e<sup>−iω</sup>) | 1 − Σ φ<sub>j</sub> e<sup>−iωj</sup> | El polinomio AR evaluado en el círculo unitario. |
| frecuencias | de 1/2000 a 1/2 ciclos por hora | De 83 días a 2 horas. |
@@ Código
```python
f_g = np.unique(np.r_[np.geomspace(1 / 2000, 0.5, 400), 1 / np.array([240, 48, 30, 24, 20, 12, 6])])
w_g = 2 * np.pi * f_g
def espectro_ar(params, sigma2):
    phis = np.asarray(params[1:])
    pol = 1 - np.exp(-1j * np.outer(w_g, np.arange(1, len(phis) + 1))) @ phis
    return sigma2 / (2 * np.pi) / np.abs(pol) ** 2

esp_ar1 = espectro_ar(AR_P[1].params.values, AR_P[1].sigma2)
esp_ar72 = espectro_ar(AR_P[p_mejor].params.values, AR_P[p_mejor].sigma2)
esp_rb = np.full_like(f_g, y_fit.var() / (2 * np.pi))
i24g = np.argmin(np.abs(f_g - 1 / 24))
print(f"AR(1): f en la frecuencia más baja / f en 1/2 = {esp_ar1[0] / esp_ar1[-1]:,.0f} (espectro rojo)")
print(f"AR({p_mejor}): valor en 24 h {esp_ar72[i24g]:.2f} contra {esp_ar72[np.argmin(np.abs(f_g - 1 / 20))]:.2f} en 20 h y {esp_ar72[np.argmin(np.abs(f_g - 1 / 30))]:.2f} en 30 h")
print(f"Ruido blanco con la varianza del viento: {esp_rb[0]:.2f} en todas las frecuencias")
```
@@ Resultado
```python oculto
per_g = (1 / f_g).round(2)
grafica("u3-teorico", [linea(per_g, esp_rb.round(4), "ruido blanco", "gris", 1.6, "dash"), linea(per_g, esp_ar1.round(4), "AR(1)", "dur", 2.4),
                       linea(per_g, esp_ar72.round(4), f"AR({p_mejor})", "lav", 2)] + marcas_periodo([24, 12], 1e-2, 1e3),
        alto=300, title={"text": "Espectros teóricos de los modelos estimados"}, xaxis={"title": {"text": "periodo (horas)"}, "type": "log", "autorange": "reversed"},
        yaxis={"title": {"text": "densidad (escala log)"}, "type": "log"})
```
@widget lab-graf id=u3-teorico
@@ Lectura
- El **ruido blanco** es plano: la misma densidad ({{=esp_rb[0]|.1f}}) en todas las frecuencias.
- El **AR(1)** tiene un espectro **rojo**: en la frecuencia más baja la densidad es {{=esp_ar1[0] / esp_ar1[-1]|,.0f}} veces la de la más alta. Así se ve en frecuencia una serie con φ cerca de 1.
- El **AR({{=p_mejor}})** es rojo también, pero con **picos** en 24 horas ({{=esp_ar72[i24g]|.1f}} contra {{=esp_ar72[np.argmin(np.abs(f_g - 1 / 20))]|.1f}} en 20 h) y en 12: sus raíces complejas cerca del círculo unitario.
@@ Decisión
🔵 Cada modelo de la Unidad II tiene su "huella" en frecuencia. Falta estimar el espectro directamente desde los datos para ver cuál se parece más.
:::

:::pastilla verde | Aplicar · El periodograma del viento | u3:periodograma-def u3:dft-def u3:periodograma-python u3:sim-periodogram {#u3-periodograma}
Calcular el **periodograma**, $I(f_k) = \frac{1}{n}\left|\sum_t y_t e^{-2\pi i f_k t}\right|^2$, el estimador directo del espectro a partir de la transformada de Fourier de los datos. Se buscan sus picos.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `periodogram(y, fs=1, detrend="constant")` | ciclos por hora | Quita la media antes de transformar. |
| `scaling="density"` | densidad | Su integral es la varianza. |
| picos | las 6 ordenadas más altas por encima de 2 días, y las de 24 y 12 h | Las escalas lentas y las del ciclo diario. |
@@ Código
```python
from scipy import signal
f_p, I_p = signal.periodogram(y.values, fs=1.0, detrend="constant", scaling="density")
f_p, I_p = f_p[1:], I_p[1:]
per_p = 1 / f_p
k24, k12 = np.argmin(np.abs(per_p - 24)), np.argmin(np.abs(per_p - 12))
print(f"Ordenadas: {len(I_p)} | la más alta en el periodo {per_p[I_p.argmax()]:.0f} h")
vec24 = np.r_[I_p[k24 - 10:k24 - 1], I_p[k24 + 2:k24 + 11]]
print(f"En 24 h: I = {I_p[k24]:.1f}, {I_p[k24] / np.median(vec24):.0f} veces la mediana de sus vecinas")
print(f"En 12 h: I = {I_p[k12]:.1f}, {I_p[k12] / np.median(np.r_[I_p[k12 - 10:k12 - 1], I_p[k12 + 2:k12 + 11]]):.0f} veces sus vecinas")
top_lentos = np.argsort(I_p * (per_p > 48))[::-1][:6]
print("Periodos de las 6 ordenadas más altas por encima de 2 días:", np.round(per_p[top_lentos], 0))
```
@@ Resultado
```python oculto
sel = np.r_[np.arange(0, 400), np.arange(400, len(I_p), 3)]
grafica("u3-periodograma", [linea(per_p[sel].round(2), I_p[sel].round(4), "periodograma", "lav", 1)] + marcas_periodo([24, 12], 1e-3, I_p.max()),
        alto=310, showlegend=False, title={"text": "Periodograma del viento horario (líneas: 24 y 12 h)"},
        xaxis={"title": {"text": "periodo (horas)"}, "type": "log", "autorange": "reversed"}, yaxis={"title": {"text": "I(f) (escala log)"}, "type": "log"})
```
@widget lab-graf id=u3-periodograma
@@ Lectura
- La ordenada más alta es la del periodo de **un año** ({{=per_p[I_p.argmax()]|.0f}} h): la temporada. Las siguientes son de **{{=per_p[top_lentos[1]]|.0f}} h ({{=per_p[top_lentos[1]] / 24|.0f}} días), {{=per_p[top_lentos[2]]|,.0f}} h ({{=per_p[top_lentos[2]] / 720|.0f}} meses) y {{=per_p[top_lentos[4]]|.0f}} h ({{=per_p[top_lentos[4]] / 24|.0f}} días)**: las escalas de la temporada y de los episodios.
- En **24 horas** hay un pico muy claro: {{=I_p[k24] / np.median(vec24)|.0f}} veces sus vecinas. En **12 horas**, otro, {{=I_p[k12] / np.median(np.r_[I_p[k12 - 10:k12 - 1], I_p[k12 + 2:k12 + 11]])|.0f}} veces.
- Entre los picos, el periodograma es muy irregular: salta un orden de magnitud entre ordenadas vecinas.
@@ Decisión
✅ El periodograma ve las dos cosas: la masa de potencia en los periodos largos y una **línea** estrecha en el ciclo diario. Su irregularidad es el problema que resuelven los suavizadores.
:::

:::pastilla verde | Aplicar · Parseval y la varianza por bandas | u3:parseval u3:varianza-bandas u3:w-bandas {#u3-bandas}
Comprobar el **teorema de Parseval**: la suma del periodograma (por el ancho de cada frecuencia) es la **varianza**. Así el periodograma es un análisis de varianza por frecuencias: se puede decir qué parte de la varianza del viento está en cada banda de periodos.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| Δf | 1/n | El ancho de cada ordenada. |
| bandas | más de 30 días, 3 a 30 días, 1 a 3 días, ciclo diario (22–26 h), armónico (11.5–12.5 h) y el resto | Las escalas del viento. |
@@ Código
```python
var_parseval = I_p.sum() * (f_p[1] - f_p[0])
print(f"Parseval: Σ I · Δf = {var_parseval:.3f} | varianza de la serie (con n): {y.var(ddof=0):.3f}")
BANDAS = {"más de 30 días": per_p > 720, "3 a 30 días": (per_p > 72) & (per_p <= 720), "1 a 3 días (sin el diario)": (per_p > 26) & (per_p <= 72),
          "ciclo diario (22–26 h)": (per_p >= 22) & (per_p <= 26), "armónico (11.5–12.5 h)": (per_p >= 11.5) & (per_p <= 12.5)}
BANDAS["el resto (horas)"] = ~np.any(np.column_stack(list(BANDAS.values())), axis=1)
por_banda = pd.Series({k: 100 * I_p[m].sum() / I_p.sum() for k, m in BANDAS.items()})
print(por_banda.round(1).astype(str).add("%").to_string())
```
@@ Resultado
```python oculto
grafica("u3-bandas", [barras(list(por_banda.index), por_banda.values, "% de la varianza", ["osc", "lav", "cel", "rosa", "dur", "gris"],
                             hovertemplate="%{x}: %{y:.1f}%<extra></extra>")],
        alto=290, showlegend=False, title={"text": "¿Dónde está la varianza del viento?"}, yaxis={"title": {"text": "% de la varianza"}})
```
@widget lab-graf id=u3-bandas
@@ Lectura
- Parseval se cumple exactamente: la suma del periodograma por Δf da {{=var_parseval|.3f}}, la varianza de la serie.
- Casi toda la varianza está en los **periodos largos**: {{=por_banda['más de 30 días']|.0f}}% en más de 30 días (la temporada) y {{=por_banda['3 a 30 días']|.0f}}% entre 3 y 30 días (los episodios).
- El **ciclo diario** tiene solo el {{=por_banda['ciclo diario (22–26 h)']|.1f}}% y su armónico, el {{=por_banda['armónico (11.5–12.5 h)']|.1f}}%. Las variaciones de horas, el {{=por_banda['el resto (horas)']|.0f}}%.
@@ Decisión
✅ El análisis de varianza por frecuencias confirma con números lo que mostró la Unidad I: el viento es un fenómeno de **días y semanas**, con un ciclo diario pequeño encima.
:::

:::pastilla amarillo | Aplicar · Qué tan ruidoso es el periodograma | u3:periodograma-ruido u3:demo-inconsistencia {#u3-ruido}
Ver que el periodograma **no se estabiliza** con más datos: cada ordenada se distribuye aproximadamente como el espectro verdadero por una χ²₂ / 2, con una desviación del mismo tamaño que su media. Se compara el periodograma de la primera y de la segunda mitad del año en las frecuencias altas, donde el espectro casi no cambia.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| mitades | enero–junio y julio–diciembre | Dos "repeticiones" del experimento. |
| banda | periodos de 2 a 4 horas | Espectro casi plano: el cambio es ruido. |
| coeficiente de variación | desviación / media de las ordenadas | 1 para una exponencial (χ²₂ / 2). |
@@ Código
```python
mitad_n = len(y) // 2
f1, I1 = signal.periodogram(y.values[:mitad_n], fs=1.0, detrend="constant")
f2, I2 = signal.periodogram(y.values[mitad_n:], fs=1.0, detrend="constant")
banda_alta = (1 / f1[1:] >= 2) & (1 / f1[1:] <= 4)
o1, o2 = I1[1:][banda_alta], I2[1:][banda_alta]
print(f"Ordenadas en la banda de 2 a 4 h: {banda_alta.sum()} en cada mitad")
print(f"Coeficiente de variación: primera mitad {o1.std() / o1.mean():.2f} | segunda {o2.std() / o2.mean():.2f} (la teoría dice 1)")
print(f"Correlación entre las ordenadas de las dos mitades: {np.corrcoef(o1, o2)[0, 1]:.3f}")
cv_total = I_p[(per_p >= 2) & (per_p <= 4)]
print(f"Con el año completo (el doble de datos): coeficiente de variación {cv_total.std() / cv_total.mean():.2f}")
```
@@ Resultado
```python oculto
grafica("u3-ruido", [puntos(o1[:600].round(4), o2[:600].round(4), "frecuencias de 2 a 4 h", "lav", 4, opacity=0.5)],
        alto=290, showlegend=False, title={"text": "Periodograma de la primera mitad contra la segunda (misma frecuencia)"},
        xaxis={"title": {"text": "I(f), enero a junio"}, "type": "log"}, yaxis={"title": {"text": "I(f), julio a diciembre"}, "type": "log"})
```
@widget lab-graf id=u3-ruido
@@ Lectura
- En la banda de 2 a 4 horas el coeficiente de variación de las ordenadas es {{=o1.std() / o1.mean()|.2f}} y {{=o2.std() / o2.mean()|.2f}} en cada mitad: cada ordenada varía tanto como su propio valor medio, como dice la teoría (χ²₂ / 2).
- Las ordenadas de la misma frecuencia en las dos mitades casi no se parecen (correlación {{=np.corrcoef(o1, o2)[0, 1]|.2f}}): la nube de puntos es redonda.
- Con el año completo, el doble de datos, el coeficiente sigue en {{=cv_total.std() / cv_total.mean()|.2f}}: **más datos no reducen el ruido** del periodograma, solo agregan ordenadas.
@@ Decisión
🟡 El periodograma es un estimador **inconsistente**: sirve para ubicar picos, no para leer el valor del espectro en una frecuencia. Para eso hay que suavizar.
:::

:::pastilla amarillo | Aplicar · Fuga espectral, ventanas y tendencias | u3:fuga u3:w-fuga u3:taper {#u3-fuga}
Ver la **fuga espectral**: la potencia de un pico se "derrama" a las frecuencias vecinas porque la serie es finita. Una **ventana** (afilado o *taper*) que suaviza los extremos reduce la fuga lejos del pico. También se ve el efecto de no quitar la **tendencia** en las frecuencias bajas.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `window="boxcar"` | sin ventana | El periodograma básico. |
| `window="hann"` | ventana de Hann | La más usada para reducir la fuga. |
| `detrend="linear"` | quita una recta | Comparar con quitar solo la media. |
@@ Código
```python
f_h, I_h = signal.periodogram(y.values, fs=1.0, window="hann", detrend="constant")
f_h, I_h = f_h[1:], I_h[1:]
zona = (per_p > 21) & (per_p < 27)
lejos = zona & ((per_p < 23.5) | (per_p > 24.5))
print(f"Cerca de 24 h (21–27 h, sin el pico): mediana sin ventana {np.median(I_p[lejos]):.3f} | con Hann {np.median(I_h[lejos]):.3f}")
print(f"Pico en 24 h: sin ventana {I_p[k24]:.1f} | con Hann {I_h[k24]:.1f}")
f_l, I_l = signal.periodogram(y.values, fs=1.0, detrend="linear")
print(f"Frecuencia más baja (periodo de un año): con detrend constante {I_p[0]:.1f} | con detrend lineal {I_l[1]:.1f}")
```
@@ Resultado
```python oculto
control("u3-fuga", [{"etiqueta": "Ventana", "tipo": "seg", "textos": ["sin ventana", "Hann"], "inicial": 0}],
        [[linea(per_p[zona].round(3), I_p[zona].round(4), "sin ventana", "lav", 1.6, mode="lines+markers", marker={"size": 4})],
         [linea(per_p[zona].round(3), I_h[zona].round(4), "con Hann", "rosa", 1.6, mode="lines+markers", marker={"size": 4})]],
        alto=290, showlegend=False, title={"text": "El periodograma alrededor de 24 horas"}, xaxis={"title": {"text": "periodo (horas)"}},
        yaxis={"title": {"text": "I(f) (escala log)"}, "type": "log"})
```
@widget lab-control id=u3-fuga
@@ Lectura
- Sin ventana, el fondo alrededor del pico de 24 h tiene mediana {{=np.median(I_p[lejos])|.1f}}; con la ventana de **Hann** baja a {{=np.median(I_h[lejos])|.1f}}: parte de esa potencia era fuga de los periodos largos y del propio pico.
- El pico de 24 h no se pierde con la ventana (de {{=I_p[k24]|,.0f}} a {{=I_h[k24]|,.0f}}).
- Quitar una recta en lugar de la media casi no cambia la frecuencia más baja: el viento no tiene tendencia lineal que fugue.
@@ Decisión
🟡 Con una serie larga y un pico tan marcado la fuga es moderada. La ventana de Hann es la opción de Welch, que se usa a continuación.
:::

:::pastilla verde | Aplicar · Suavizar el periodograma: Daniell | u3:idea-suavizar u3:demo-daniell u3:sesgo-varianza u3:w-daniell {#u3-daniell}
Promediar cada ordenada del periodograma con sus vecinas (el suavizador de **Daniell**). El promedio de m ordenadas tiene m veces menos varianza, pero mezcla frecuencias distintas: es el dilema **sesgo–varianza**. Mueve el control para cambiar m.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| m | 1, 5, 21, 101 y 401 ordenadas | De ningún suavizado a mucho. |
| ancho de banda | m / n ciclos por hora | Cuánto mezcla en frecuencia. |
| pico de 24 h | valor suavizado en 24 h / mediana de 20 a 22 h | ¿Sigue viéndose? |
@@ Código
```python
M_DAN = [1, 5, 21, 101, 401]
dan = {m: pd.Series(I_p).rolling(m, center=True, min_periods=1).mean().values for m in M_DAN}
zona_ref = (per_p > 20) & (per_p < 22)
for m, Is in dan.items():
    print(f"m = {m:>3}: ancho de banda {m / len(y):.5f} ciclos/hora | pico de 24 h / fondo = {Is[k24] / np.median(Is[zona_ref]):6.1f}")
```
@@ Resultado
```python oculto
sel2 = np.r_[np.arange(0, 300), np.arange(300, len(I_p), 8)]
control("u3-daniell", [{"etiqueta": "Ordenadas promediadas m", "textos": [str(m) for m in M_DAN], "inicial": 2}],
        [[linea(per_p[sel2].round(2), dan[m][sel2].round(4), f"Daniell con m = {m}", "rosa", 1.8)] for m in M_DAN],
        base=[linea(per_p[sel2].round(2), I_p[sel2].round(4), "periodograma", "gris", 0.6, opacity=0.5)],
        textos=[f"m = {m}: pico de 24 h / fondo = <b>{dan[m][k24] / np.median(dan[m][zona_ref]):.1f}</b>" for m in M_DAN],
        alto=300, title={"text": "Periodograma suavizado con Daniell"}, xaxis={"title": {"text": "periodo (horas)"}, "type": "log", "autorange": "reversed"},
        yaxis={"title": {"text": "densidad (escala log)"}, "type": "log"})
```
@widget lab-control id=u3-daniell
@@ Lectura
- Con **m = 1** (sin suavizar) el pico de 24 h es {{=dan[1][k24] / np.median(dan[1][zona_ref])|.0f}} veces el fondo, pero la curva es ruido puro.
- Con **m = 21** la curva ya es legible y el pico sigue claro ({{=dan[21][k24] / np.median(dan[21][zona_ref])|.1f}} veces el fondo).
- Con **m = 101** o más, el promedio mezcla el pico con sus vecinas y casi desaparece: es el **sesgo** del suavizado.
@@ Decisión
✅ Un m intermedio (de 11 a 21 ordenadas) equilibra sesgo y varianza para este viento. La elección depende de la pregunta: los picos estrechos piden poco suavizado.
:::

:::pastilla verde | Aplicar · El método de Welch | u3:welch u3:guia-welch u3:sim-welch {#u3-welch}
Estimar el espectro con **Welch**: se parte la serie en segmentos que se traslapan a la mitad, se calcula un periodograma con ventana de Hann en cada uno y se promedian. Segmentos cortos dan una curva suave pero sin detalle; segmentos largos, detalle con ruido. Mueve el control.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `nperseg` | 168, 336, 720 y 2,160 horas | Una semana, dos, un mes y tres meses. |
| traslape | 50% | El de omisión. |
| segmentos | aproximadamente 2n / nperseg | Cuántos periodogramas se promedian. |
@@ Código
```python
NPS = [168, 336, 720, 2160]
welchs = {m: signal.welch(y.values, fs=1.0, nperseg=m, detrend="constant") for m in NPS}
pico_w = {}
for m, (fw, Pw) in welchs.items():
    i_w = np.argmin(np.abs(fw[1:] - 1 / 24)) + 1
    vec_w = Pw[(1 / np.maximum(fw, 1e-9) > 20) & (1 / np.maximum(fw, 1e-9) < 22)]
    pico_w[m] = Pw[i_w] / np.median(vec_w) if len(vec_w) else np.nan
    print(f"nperseg = {m:>4}: {int(2 * len(y) / m) - 1:>3} segmentos | resolución {1 / m:.5f} | pico de 24 h / fondo {pico_w[m]:5.1f}")
```
@@ Resultado
```python oculto
control("u3-welch", [{"etiqueta": "nperseg", "textos": [f"{m} h" for m in NPS], "inicial": 2}],
        [[linea((1 / welchs[m][0][1:]).round(2), welchs[m][1][1:].round(4), f"Welch, nperseg = {m}", "menta", 2, mode="lines+markers", marker={"size": 3})] for m in NPS],
        base=marcas_periodo([24, 12], 1e-2, 3e3), alto=300, showlegend=False, title={"text": "Espectro de Welch del viento"},
        xaxis={"title": {"text": "periodo (horas)"}, "type": "log", "autorange": "reversed"}, yaxis={"title": {"text": "densidad (escala log)"}, "type": "log"})
```
@widget lab-control id=u3-welch
@@ Lectura
- Con segmentos de **una semana** (168 h) la curva es suavísima pero el pico de 24 h casi desaparece ({{=pico_w[168]|.1f}} veces el fondo): la resolución de {{=1 / 168|.4f}} ciclos por hora no separa 24 h de sus vecinas.
- Con **un mes** (720 h) el pico es claro y la curva sigue suave; con **tres meses** (2,160 h) el pico es altísimo ({{=pico_w[2160]|.0f}} veces) pero la curva vuelve a ser ruidosa (solo 7 segmentos).
- En todos se ve el espectro rojo y el armónico de 12 h.
@@ Decisión
✅ Welch con segmentos de un mes es el estimador no paramétrico de referencia para el viento horario.
:::

:::pastilla verde | Aplicar · Estimación paramétrica: el espectro de un AR | u3:idea-parametrico u3:ar-espectral u3:orden-ar u3:w-ar-espectral {#u3-ar-espectral}
Estimar el espectro **paramétricamente**: se ajusta un AR(p) a toda la serie y se usa su espectro teórico. Con p chico la curva es suave pero no ve picos; con p grande aparecen los picos del ciclo diario. Mueve el control para cambiar p.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `AutoReg(y, lags=p)` | AR(p) con toda la serie | Para comparar con Welch, que también usa todo. |
| p | 1, 3, 12, 24, 48 y 96 | De lo que elige BIC a lo que elige AIC y más. |
| referencia | Welch con nperseg = 720 | El no paramétrico de la pastilla anterior. |
@@ Código
```python
P_ESP = [1, 3, 12, 24, 48, 96]
ar_todo = {p: AutoReg(y, lags=p).fit() for p in P_ESP}
esp_p = {p: espectro_ar(r.params.values, r.sigma2) for p, r in ar_todo.items()}
for p, e in esp_p.items():
    print(f"AR({p:>2}): pico de 24 h / valor en 20 h = {e[i24g] / e[np.argmin(np.abs(f_g - 1 / 20))]:.2f} | AIC {ar_todo[p].aic:,.0f}")
```
@@ Resultado
```python oculto
fw720, Pw720 = welchs[720]
control("u3-ar-espectral", [{"etiqueta": "Orden p", "textos": [str(p) for p in P_ESP], "inicial": 3}],
        [[linea(per_g, esp_p[p].round(4), f"AR({p})", "lav", 2.4)] for p in P_ESP],
        base=[linea((1 / fw720[1:]).round(2), Pw720[1:].round(4), "Welch (720 h)", "menta", 1.4, "dot")],
        alto=300, title={"text": "Espectro paramétrico AR contra Welch"}, xaxis={"title": {"text": "periodo (horas)"}, "type": "log", "autorange": "reversed"},
        yaxis={"title": {"text": "densidad (escala log)"}, "type": "log"})
```
@widget lab-control id=u3-ar-espectral
@@ Lectura
- El **AR(1)** y el **AR(3)** dan solo una curva roja, sin picos: con pocos coeficientes no pueden representar una línea en 24 horas. La razón de {{=esp_p[1][i24g] / esp_p[1][np.argmin(np.abs(f_g - 1 / 20))]|.2f}} entre 24 y 20 horas es solo la pendiente de la curva.
- Con **p = 48** aparece el pico diario y con **p = 96** es claro ({{=esp_p[96][i24g] / esp_p[96][np.argmin(np.abs(f_g - 1 / 20))]|.1f}} veces el valor en 20 h). AIC sigue bajando con p.
- En las frecuencias bajas, todos los AR coinciden con Welch.
@@ Decisión
✅ El método paramétrico es suave por construcción, pero solo ve los picos si el orden es suficiente. Es la misma conclusión de la Unidad II: la memoria del ciclo diario pide rezagos de días.
:::

:::pastilla azul | Aplicar · ¿Por qué aparecen armónicos? El espectro de cada transformación | u3:armonicos u3:ap-transformaciones {#u3-armonicos}
Explicar los picos en 12 h (y otros menores en 8 h y 6 h): un patrón diario que **no es una senoide** se descompone en la frecuencia fundamental (24 h) más sus **armónicos** (24/2, 24/3, …). Y comparar el espectro del viento con el de √y y el de ∇y, como en el caso de AirPassengers.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| armónicos | 24, 12, 8 y 6 horas | k = 1, 2, 3 y 4 veces la frecuencia diaria. |
| transformaciones | y, √y y ∇y | La serie, la transformada de la Unidad II y la diferencia. |
| estimador | Welch con nperseg = 720 | Suave y con resolución suficiente. |
@@ Código
```python
for P in [24, 12, 8, 6]:
    kP = np.argmin(np.abs(per_p - P))
    fondo = np.median(np.r_[I_p[kP - 15:kP - 2], I_p[kP + 3:kP + 16]])
    print(f"{P:>2} h: periodograma / fondo = {I_p[kP] / fondo:6.1f}")
TRANSF = {"y": y.values, "√y": np.sqrt(y.values), "∇y": np.diff(y.values)}
esp_tr = {k: signal.welch(v, fs=1.0, nperseg=720, detrend="constant") for k, v in TRANSF.items()}
for k, (fw, Pw) in esp_tr.items():
    print(f"{k:>3}: potencia en periodos > 3 días / potencia en < 6 h = {Pw[1:][1 / fw[1:] > 72].sum() / Pw[1:][1 / fw[1:] < 6].sum():8.1f}")
```
@@ Resultado
```python oculto
control("u3-armonicos", [{"etiqueta": "Serie", "tipo": "seg", "textos": list(TRANSF), "inicial": 0}],
        [[linea((1 / esp_tr[k][0][1:]).round(2), (esp_tr[k][1][1:] / esp_tr[k][1][1:].max()).round(6), f"Welch de {k}", c, 2)] for k, c in zip(TRANSF, ["lav", "menta", "dur"])],
        base=marcas_periodo([24, 12, 8, 6], 1e-6, 1), alto=300, showlegend=False, title={"text": "Espectro (normalizado) de cada transformación"},
        xaxis={"title": {"text": "periodo (horas)"}, "type": "log", "autorange": "reversed"}, yaxis={"title": {"text": "densidad / máximo (escala log)"}, "type": "log"})
```
@widget lab-control id=u3-armonicos
@@ Lectura
- Además de 24 y 12 horas hay un pico en **6 horas** ({{=I_p[np.argmin(np.abs(per_p - 6))] / np.median(np.r_[I_p[np.argmin(np.abs(per_p - 6)) - 15:np.argmin(np.abs(per_p - 6)) - 2], I_p[np.argmin(np.abs(per_p - 6)) + 3:np.argmin(np.abs(per_p - 6)) + 16]])|.0f}} veces el fondo) y casi nada en 8: el perfil diario sube rápido de mañana y tiene una forma que necesita los armónicos pares.
- √y tiene casi el mismo espectro que y, con un poco menos de peso en los periodos largos.
- **∇y** invierte el espectro: la diferencia **elimina** los periodos largos y deja las variaciones de horas. La diferencia es un filtro pasa altos, el tema de la siguiente sección.
@@ Decisión
🔵 Los armónicos no son ciclos nuevos: son la forma del ciclo diario. Un modelo con solo la senoide de 24 h (como la armónica de la Unidad II, que usa 24 y 12) no copia toda la forma.
:::

:::pastilla verde | Aplicar · Paramétrico contra no paramétrico | u3:comparacion-espectral u3:daniell-vs-welch {#u3-comparacion}
Resumir qué estimador del espectro conviene para cada pregunta sobre el viento: dónde está la varianza, si hay un pico diario y cuánto mide.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| criterios | ve el pico de 24 h, curva suave, resolución en frecuencias bajas | Lo que importa en esta serie. |
@@ Código
```python
COMPARA_ESP = [
    ["periodograma", "sí, muy claro", "no (muy ruidoso)", "la máxima (1/n)"],
    ["Daniell con m = 21", "sí", "sí", f"{21 / len(y):.4f} ciclos/hora"],
    ["Welch, 720 h", "sí", "sí", f"{1 / 720:.4f} ciclos/hora"],
    ["Welch, 168 h", "apenas", "muy suave", f"{1 / 168:.4f} ciclos/hora"],
    [f"AR({p_bic}) (BIC)", "no", "muy suave", "solo una forma roja"],
    ["AR(48) o más", "sí", "sí", "depende de p"],
]
for f in COMPARA_ESP:
    print(" | ".join(f))
```
@@ Resultado
```python oculto
tabla("u3-comparacion", ["estimador", "¿ve el pico de 24 h?", "¿curva suave?", "resolución"], COMPARA_ESP,
      ["", "elegido", "elegido", "", "descartado", ""], titulo="Cómo estimar el espectro del viento")
```
@widget lab-tabla id=u3-comparacion
@@ Lectura
- El **periodograma** ve el pico mejor que nadie pero es inservible para leer valores.
- **Daniell** y **Welch** con un ancho intermedio dan curvas legibles que conservan el pico.
- El **AR de BIC** (p = {{=p_bic}}) solo da la forma roja; un **AR largo** da un espectro suave con picos.
@@ Decisión
✅ Para el viento horario: Welch de un mes para la forma del espectro y el periodograma para ubicar las líneas del ciclo diario. Con el espectro de una serie, la siguiente pregunta es cómo se relacionan **dos** series en frecuencia.
:::
