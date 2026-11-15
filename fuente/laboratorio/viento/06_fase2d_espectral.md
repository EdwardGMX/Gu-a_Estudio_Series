## 🌈 Fase 2d · Espectro, coherencia y filtros (Unidad III) {#fase-espectral}
@mapa Ver en qué frecuencias está la varianza del viento, confirmar el ciclo de 24 horas con tres estimadores, medir qué comparten las turbinas, el viento, la temperatura y la potencia, encontrar el retraso térmico de la caja de engranes y separar escalas con un filtro.

:::pastilla verde | Aplicar · El periodograma: 24 horas y su armónico de 12 | u3:periodograma u3:periodograma-python u3:armonicos u3:unidades-frecuencia {#esp-periodograma}
Ver la serie en el dominio de la frecuencia. Si el ciclo diario es real, el periodograma debe tener un pico **angosto** exactamente en ω = 1/24 ciclos por hora; si su forma no es una senoide pura, también en sus armónicos (1/12, 1/8, …).
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `signal.periodogram` | sin ventana | El periodograma crudo, $I(\omega_j)$, en las frecuencias de Fourier $\omega_j = j/n$. |
| `z − z.mean()` | centrada | La media solo agrega un pico en ω = 0. |
| `/ 2` | escala | scipy devuelve la densidad de un solo lado (el doble); se divide para usar la convención de la guía. |
| resolución | 1/8,760 ciclos por hora | Con un año de datos horarios, las frecuencias están muy juntas. |
@@ Código
```python
from scipy import signal

zc = (z - z.mean()).values
frec, I_z = signal.periodogram(zc, detrend=False)
I_z = I_z / 2
def en(periodo_h):
    return np.argmin(np.abs(frec - 1 / periodo_h))
for per in (24, 12, 8):
    j = en(per)
    print(f"Periodo {per:2d} h: I = {I_z[j]:7.2f} | promedio de sus 6 vecinas: {np.r_[I_z[j-3:j], I_z[j+1:j+4]].mean():.2f}")
top = np.argsort(I_z[1:])[::-1][:8] + 1
print("\nLas 8 ordenadas más altas (periodo en horas: I):")
print({f"{1 / frec[j]:.0f} h": round(float(I_z[j]), 1) for j in top})
```
@@ Resultado
```python oculto
mask = (frec > 0) & (frec <= 0.2)
grafica("esp-periodograma", [linea(frec[mask], I_z[mask], "periodograma de √y", "lav", 1)],
        alto=310, title={"text": "Periodograma de √y (frecuencias hasta 0.2 ciclos por hora)"}, showlegend=False,
        xaxis={"title": {"text": "frecuencia (ciclos por hora)"}, "type": "log"}, yaxis={"title": {"text": "I(ω)"}, "type": "log"},
        shapes=[vline(1 / 24, "rosa"), vline(1 / 12, "dur")],
        annotations=[{"x": np.log10(1 / 24), "y": 1, "yref": "paper", "text": "24 h", "showarrow": False, "font": {"color": PALETA["rosa"]}},
                     {"x": np.log10(1 / 12), "y": 0.92, "yref": "paper", "text": "12 h", "showarrow": False, "font": {"color": PALETA["dur"]}}])
```
@widget lab-graf id=esp-periodograma
@@ Lectura
- **Hay un pico angosto exactamente en 24 horas**: {{=I_z[en(24)]|.0f}}, unas {{=I_z[en(24)] / np.r_[I_z[en(24)-3:en(24)], I_z[en(24)+1:en(24)+4]].mean()|.0f}} veces el nivel de sus vecinas. Un ciclo de periodo fijo deja exactamente esa huella: toda su potencia en una sola frecuencia.
- También hay un pico en **12 horas** ({{=I_z[en(12)] / np.r_[I_z[en(12)-3:en(12)], I_z[en(12)+1:en(12)+4]].mean()|.0f}} veces sus vecinas), el primer **armónico**: el ciclo diario no es una senoide perfecta (sube rápido al mediodía y se queda plano en la noche). En 8 horas ya no hay pico ({{=I_z[en(8)]|.2f}}, por debajo de sus vecinas).
- Pero las ordenadas más altas están en **periodos de días y semanas**: la parte izquierda de la gráfica, en escala logarítmica, está muy por encima del pico de 24 h. La varianza del viento vive en los episodios largos, no en el ciclo diario.
@@ Decisión
✅ El ciclo de 24 horas existe y es determinístico (pico angosto). Para medir **cuánto** de la varianza explica, el siguiente paso suma el periodograma por bandas.
:::

:::pastilla azul | Aplicar · La varianza por bandas de frecuencia (Parseval) | u3:parseval u3:varianza-bandas {#esp-bandas}
Repartir la varianza de √y entre escalas de tiempo. Por el **teorema de Parseval**, la suma del periodograma es la varianza de la serie, así que sumar por bandas dice qué porcentaje aporta cada escala.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| bandas | > 30 días, 3–30 días, 1–3 días, 22–26 h, 11.5–12.5 h, resto | Estaciones, episodios sinópticos, cambios diarios, ciclo diario, su armónico y turbulencia de horas. |
@@ Código
```python
bandas = {"más de 30 días": (0, 1 / 720), "3 a 30 días": (1 / 720, 1 / 72), "1 a 3 días": (1 / 72, 1 / 26),
          "ciclo diario (22–26 h)": (1 / 26, 1 / 22), "resto de 12.5 a 22 h": (1 / 22, 1 / 12.5),
          "armónico (11.5–12.5 h)": (1 / 12.5, 1 / 11.5), "menos de 11.5 h": (1 / 11.5, 0.51)}
total = I_z[1:].sum()
por_banda = pd.Series({b: I_z[(frec > lo) & (frec <= hi)].sum() / total * 100 for b, (lo, hi) in bandas.items()})
print("Porcentaje de la varianza de √y por banda:")
print(por_banda.round(1).to_string())
print(f"Suma: {por_banda.sum():.1f}% | Parseval: 2·ΣI/n = {2 * I_z[1:].sum() / len(zc):.4f} contra la varianza {zc.var():.4f}")
```
@@ Resultado
```python oculto
cols_b = ["osc", "lav", "cel", "rosa", "gris", "dur", "gris"]
grafica("esp-bandas", [barras(list(por_banda.index), por_banda.values, "% de la varianza", cols_b, hovertemplate="%{x}: %{y:.1f}%<extra></extra>")],
        alto=290, title={"text": "¿En qué escala de tiempo está la varianza del viento?"}, showlegend=False, yaxis={"title": {"text": "% de la varianza"}})
```
@widget lab-graf id=esp-bandas
@@ Lectura
- **El {{=por_banda['más de 30 días'] + por_banda['3 a 30 días']|.0f}}% de la varianza está en escalas de más de 3 días**: las estaciones ({{=por_banda['más de 30 días']|.0f}}%) y los episodios sinópticos ({{=por_banda['3 a 30 días']|.0f}}%).
- **El ciclo diario aporta solo el {{=por_banda['ciclo diario (22–26 h)']|.1f}}%**, y su armónico de 12 horas el {{=por_banda['armónico (11.5–12.5 h)']|.1f}}%. Coincide con F_S = {{=F_S|.2f}} de la [[est-stl|STL]].
- La suma de las bandas da el 100% y Parseval se cumple: el periodograma es un **análisis de varianza por frecuencias**.
@@ Decisión
Es la evidencia más directa contra la suposición **S4**: un modelo que solo repita el ciclo diario captura menos del 5% de la varianza. Lo que más importa para pronosticar a 24 horas es **en qué parte de un episodio** está el viento. Antes de seguir, el periodograma crudo es ruidoso; el siguiente paso lo suaviza.
:::

:::pastilla verde | Aplicar · Suavizar: Welch y Daniell | u3:welch u3:daniell-vs-welch u3:periodograma-ruido u3:sesgo-varianza {#esp-welch}
Obtener un estimador del espectro **consistente**. El periodograma crudo no mejora con más datos: cada ordenada es tan ruidosa como lo que estima. Welch promedia periodogramas de segmentos; Daniell promedia ordenadas vecinas.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `nperseg=336` | 2 semanas | Segmentos con 14 ciclos diarios: resolución suficiente para separar 24 h de sus vecinas. |
| Daniell | `uniform_filter1d(I, 25)` | Promedio móvil de 25 ordenadas, de ancho 25/8,760 ≈ 0.003 ciclos por hora. |
| ventana de Welch | Hann (por omisión) | Reduce la fuga de potencia de las frecuencias bajas, muy grandes, hacia el pico diario. |
@@ Código
```python
from scipy.ndimage import uniform_filter1d

f_w, P_w = signal.welch(zc, nperseg=336)
P_w = P_w / 2
I_dan = uniform_filter1d(I_z, 25, mode="nearest")
k24 = np.argmin(np.abs(f_w - 1 / 24))
k12 = np.argmin(np.abs(f_w - 1 / 12))
print(f"Welch: {len(f_w)} frecuencias, separadas {f_w[1]:.4f} ciclos por hora")
print(f"  pico de 24 h: {P_w[k24]:.3f} contra {P_w[k24 - 2]:.3f} y {P_w[k24 + 2]:.3f} a dos frecuencias de distancia")
print(f"  pico de 12 h: {P_w[k12]:.3f} contra {P_w[k12 - 2]:.3f} y {P_w[k12 + 2]:.3f}")
print(f"Daniell en 24 h: {I_dan[en(24)]:.2f} contra {I_dan[en(24) - 40]:.2f} y {I_dan[en(24) + 40]:.2f} a 40 ordenadas")
```
@@ Resultado
```python oculto
m2 = (f_w > 0)
md = (frec > 0) & (frec <= 0.5)
grafica("esp-welch", [linea(frec[md][::4], I_dan[md][::4], "Daniell (25 ordenadas)", "cel", 1.4),
                      linea(f_w[m2], P_w[m2], "Welch (segmentos de 2 semanas)", "osc", 2.4)],
        alto=310, title={"text": "Dos estimadores suavizados del espectro de √y"},
        xaxis={"title": {"text": "frecuencia (ciclos por hora)"}, "type": "log"}, yaxis={"title": {"text": "densidad espectral"}, "type": "log"},
        shapes=[vline(1 / 24, "rosa"), vline(1 / 12, "dur")])
```
@widget lab-graf id=esp-welch
@@ Lectura
- Los dos estimadores muestran la misma forma: **mucha potencia en frecuencias bajas que cae de manera continua** hacia las altas (un espectro "rojo", como el de un AR con φ cercano a 1), con dos picos encima en **24 y 12 horas**.
- Welch, con segmentos de dos semanas, todavía distingue el pico de 24 h ({{=P_w[k24]|.2f}} contra {{=P_w[k24 - 2]|.2f}} a su izquierda). Su precio es la **resolución**: no puede ver nada más lento que dos semanas.
- Daniell conserva la resolución del año completo en las frecuencias bajas, pero aplana un poco el pico diario al promediarlo con 24 vecinas.
@@ Decisión
✅ El espectro tiene dos ingredientes: un **fondo rojo** (persistencia, que modela un AR) y **picos determinísticos** en 24 y 12 h (que modelan términos armónicos o una parte estacional). El siguiente paso comprueba si un AR solo puede reproducir ambos.
:::

:::pastilla azul | Aplicar · El espectro de un AR: el BIC no ve el ciclo diario | u3:ar-espectral u3:orden-ar u3:parametrico {#esp-ar}
Estimar el espectro **paramétrico** ajustando un AR y comparar dos criterios de orden. Un AR de orden bajo produce un espectro suave; para tener un pico angosto en 24 horas necesita muchos rezagos.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `ar_select_order(…, maxlag=60)` | hasta 60 rezagos | Cubre dos días y medio. |
| `ic="bic"` y `ic="aic"` | dos criterios | BIC penaliza más los parámetros y elige órdenes más bajos. |
| $f(\omega) = \sigma^2 / \lvert 1 - \sum_k \phi_k e^{-2\pi i \omega k}\rvert^2$ | espectro de un AR | La fórmula de la Unidad III. |
@@ Código
```python
from statsmodels.tsa.ar_model import AutoReg, ar_select_order

def espectro_ar(res, f):
    phi, s2 = res.params[1:], res.sigma2
    k = np.arange(1, len(phi) + 1)
    return s2 / np.abs(1 - np.exp(-2j * np.pi * np.outer(f, k)) @ phi) ** 2

ordenes = {}
for ic in ("bic", "aic"):
    sel = ar_select_order(zc, maxlag=60, ic=ic, trend="c")
    ordenes[ic] = max(sel.ar_lags) if sel.ar_lags else 0
print("Orden elegido:", ordenes)
res_ar = {ic: AutoReg(zc, lags=p, trend="c").fit() for ic, p in ordenes.items()}
f_ar = np.linspace(0.001, 0.5, 2000)
esp = {ic: espectro_ar(r, f_ar) for ic, r in res_ar.items()}
j24 = np.argmin(np.abs(f_ar - 1 / 24))
for ic in esp:
    print(f"AR({ordenes[ic]}) por {ic.upper()}: f(1/24) = {esp[ic][j24]:.3f}, f a ±0.004 = {esp[ic][j24 - 16]:.3f} y {esp[ic][j24 + 16]:.3f}")
```
@@ Resultado
```python oculto
mw = f_w > 0
grafica("esp-ar", [linea(f_w[mw], P_w[mw], "Welch (no paramétrico)", "gris", 2),
                   linea(f_ar, esp["bic"], f"AR({ordenes['bic']}) elegido por BIC", "dur", 2.2),
                   linea(f_ar, esp["aic"], f"AR({ordenes['aic']}) elegido por AIC", "osc", 1.6)],
        alto=310, title={"text": "Espectros paramétricos contra Welch"},
        xaxis={"title": {"text": "frecuencia (ciclos por hora)"}, "type": "log"}, yaxis={"title": {"text": "densidad espectral"}, "type": "log"},
        shapes=[vline(1 / 24, "rosa")])
```
@widget lab-graf id=esp-ar
@@ Lectura
- El **BIC elige un AR({{=ordenes['bic']}})**, cuyo espectro es una curva suave que reproduce el fondo rojo, pero **no tiene pico en 24 horas**: con tres rezagos no puede "recordar" lo que pasó hace un día.
- El **AIC elige un AR({{=ordenes['aic']}})**: con tantos rezagos sí alcanza el rezago 24 y su espectro muestra los picos de 24 y 12 horas, pero gasta decenas de parámetros en ello.
- Es el mismo mensaje de la ACF: la persistencia se explica con pocos rezagos, el ciclo diario necesita una herramienta específica.
@@ Decisión
Para los modelos clásicos hay dos maneras económicas de agregar el ciclo diario a un AR de orden bajo: una **parte estacional** SAR/SMA de periodo 24, o **términos de Fourier** (senos y cosenos de periodo 24 y 12) como variables exógenas. Las dos se probarán en la [[fase-clasicos|fase de modelos]]. Ahora, la **coherencia**: qué comparten dos series en cada frecuencia.
:::

:::pastilla azul | Aplicar · Coherencia entre turbinas: qué escalas comparten | u3:cruzado u3:mag-fase-coh u3:sim-coherence {#esp-turbinas}
Medir en qué escalas de tiempo **MV01 y MV02 ven el mismo viento**. La coherencia es una correlación al cuadrado frecuencia por frecuencia: vale 1 si en esa escala las dos series se mueven juntas.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| datos de 10 minutos | 52,560 registros | Para llegar a escalas de minutos, que en datos horarios no existen. |
| `interpolate(limit=6)` | huecos de hasta 1 h | `coherence` no acepta `NaN`; los huecos largos se quitan. |
| `nperseg=1008` | 7 días | Promedia 52 segmentos: la coherencia queda estable. |
@@ Código
```python
v_mv02 = parque.loc[parque["device"] == "MV02"].set_index("ts")["WindSpdMean"].reindex(rejilla).where(lambda x: x > 0)
par = pd.concat([s10["WindSpdMean"], v_mv02], axis=1).interpolate(limit=6).dropna()
f_c, coh_mv = signal.coherence(par.iloc[:, 0].values, par.iloc[:, 1].values, nperseg=1008)
coh_periodo = {}
for horas in (168, 24, 6, 2, 1, 0.5, 1 / 3):
    j = np.argmin(np.abs(f_c - 1 / (6 * horas)))           # frecuencia en ciclos por registro de 10 min
    coh_periodo[f"{horas:g} h" if horas >= 1 else f"{horas * 60:.0f} min"] = round(float(coh_mv[j]), 3)
print("Coherencia MV01–MV02 por periodo:", coh_periodo)
```
@@ Resultado
```python oculto
per_h = 1 / (6 * f_c[1:])
grafica("esp-turbinas", [linea(per_h, coh_mv[1:], "coherencia MV01–MV02", "menta", 2.2)],
        alto=290, title={"text": "Coherencia entre dos turbinas vecinas"}, showlegend=False,
        xaxis={"title": {"text": "periodo (horas)"}, "type": "log", "autorange": "reversed"}, yaxis={"title": {"text": "coherencia"}, "range": [0, 1.02]})
```
@widget lab-graf id=esp-turbinas
@@ Lectura
- En periodos de **un día o más** la coherencia es casi 1 ({{=coh_periodo['24 h']}} en 24 h): los episodios sinópticos y el ciclo diario son **los mismos** en las dos turbinas.
- Baja a {{=coh_periodo['2 h']}} en periodos de 2 horas y a casi cero en {{=coh_periodo['20 min']}} a los 20 minutos: las ráfagas y remolinos de minutos son **locales** de cada turbina.
- Eso justifica dos decisiones anteriores: la **imputación con la vecina** (que comparte justo las escalas que importan en una serie horaria) y la **frecuencia horaria** (que elimina la parte de la señal que no se comparte ni se puede pronosticar).
@@ Decisión
La coherencia entre turbinas es casi perfecta porque miden lo mismo. Más interesante es una relación **física** entre variables distintas: el viento y la temperatura.
:::

:::pastilla azul | Aplicar · Coherencia y fase entre el viento y la temperatura | u3:mag-fase-coh u3:demo-retardo u3:sim-retardo {#esp-temperatura}
Medir si el viento y la temperatura comparten el ciclo diario y **cuál de los dos va adelante**. La fase del espectro cruzado dice el desfase en cada frecuencia.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `csd(temp, viento)` | espectro cruzado | Su ángulo es la fase del viento respecto a la temperatura. |
| retardo | $d = -\varphi / (2\pi\omega)$ | Si el viento fuera la temperatura retrasada $d$ horas, la fase sería $-2\pi\omega d$. |
| `nperseg=336` | 2 semanas | Como en Welch. |
@@ Código
```python
temp_h = s10["AmbTempMean"].resample("h").mean().interpolate(limit_direction="both")
f_t, coh_t = signal.coherence(temp_h.values, y.values, nperseg=336)
_, cxy = signal.csd(temp_h.values, y.values, nperseg=336)
k = np.argmin(np.abs(f_t - 1 / 24))
fase24 = np.angle(cxy[k])
retardo_h = -fase24 / (2 * np.pi * f_t[k])
print(f"Coherencia viento–temperatura en 24 h: {coh_t[k]:.3f} | en 72 h: {coh_t[np.argmin(np.abs(f_t - 1 / 72))]:.3f} | en 6 h: {coh_t[np.argmin(np.abs(f_t - 1 / 6))]:.3f}")
print(f"Fase en 24 h: {fase24:.3f} rad → retardo del viento respecto a la temperatura: {retardo_h:.2f} h")
perfil_t = temp_h.groupby(temp_h.index.hour).mean()
print(f"Hora del máximo promedio: viento {y.groupby(y.index.hour).mean().idxmax()} h, temperatura {perfil_t.idxmax()} h")
```
@@ Resultado
```python oculto
mt = (f_t > 0) & (f_t <= 0.25)
grafica("esp-temp", [linea(1 / f_t[mt], coh_t[mt], "coherencia viento–temperatura", "dur", 2.2)],
        alto=270, title={"text": "Coherencia entre el viento y la temperatura ambiente"}, showlegend=False,
        xaxis={"title": {"text": "periodo (horas)"}, "type": "log", "autorange": "reversed"}, yaxis={"title": {"text": "coherencia"}, "range": [0, 1]},
        shapes=[vline(24, "rosa")])
```
@widget lab-graf id=esp-temp
@@ Lectura
- La coherencia tiene su **máximo en 24 horas** ({{=coh_t[k]|.2f}}): el viento y la temperatura comparten sobre todo el ciclo diario, que tienen la misma causa (el calentamiento del suelo por el sol).
- La fase da un retardo de **{{=retardo_h|.1f}} horas**: negativo, así que el **viento va adelante**. En los promedios, el viento llega a su máximo hacia las {{=y.groupby(y.index.hour).mean().idxmax()}} h y la temperatura hacia las {{=perfil_t.idxmax()}} h. El sol empieza a mezclar el aire y a bajar viento rápido antes de que el aire alcance su temperatura máxima.
- Fuera de 24 h la coherencia es moderada: los episodios del norte también traen aire más fresco, pero la relación es menos fija.
@@ Decisión
La temperatura comparte el ciclo diario, pero no adelanta al viento: no servirá para pronosticarlo. Ahora, la relación que más le importa al operador: **viento y potencia**.
:::

:::pastilla amarillo | Aplicar · Viento y potencia: la coherencia que rompen los paros | u3:mag-fase-coh u3:demo-coh-r2 {#esp-potencia}
Medir la coherencia entre el viento y la potencia de MV01, con y sin los paros. La coherencia mide relaciones **lineales**; la curva de potencia no lo es, y los paros rompen cualquier relación.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| potencia horaria | con y sin paros | Sin paros: los registros en paro pasan a `NaN` y se interpolan. |
| `nperseg=336` | 2 semanas | Como antes. |
@@ Código
```python
pot_con = s10["RealPowerMean"].resample("h").mean().interpolate(limit_direction="both")
pot_sin = s10["RealPowerMean"].where(~s10["paro"]).resample("h").mean().interpolate(limit_direction="both")
filas = {}
for nombre, pot in {"con paros": pot_con, "sin paros": pot_sin}.items():
    f_p, c_p = signal.coherence(y.values, pot.values, nperseg=336)
    filas[nombre] = {f"{h} h": c_p[np.argmin(np.abs(f_p - 1 / h))] for h in (168, 72, 24, 12, 6, 3)}
coh_pot = pd.DataFrame(filas).T
print(coh_pot.round(3).to_string())
```
@@ Resultado
```python oculto
graf_p = []
for nombre, pot, col in [("con paros", pot_con, "rojo"), ("sin paros", pot_sin, "menta")]:
    f_p, c_p = signal.coherence(y.values, pot.values, nperseg=336)
    mp = (f_p > 0) & (f_p <= 0.4)
    graf_p.append(linea(1 / f_p[mp], c_p[mp], nombre, col, 2.2))
grafica("esp-potencia", graf_p, alto=280, title={"text": "Coherencia entre viento y potencia de MV01"},
        xaxis={"title": {"text": "periodo (horas)"}, "type": "log", "autorange": "reversed"}, yaxis={"title": {"text": "coherencia"}, "range": [0, 1]})
```
@widget lab-graf id=esp-potencia
@@ Lectura
- Con los paros, la coherencia es moderada: {{=coh_pot.loc['con paros', '24 h']|.2f}} en 24 horas y {{=coh_pot.loc['con paros', '72 h']|.2f}} en 3 días. Parecería que el viento explica poco de la potencia.
- **Sin paros sube en todas las escalas** ({{=coh_pot.loc['sin paros', '24 h']|.2f}} en 24 h): una buena parte de lo que "no explicaba" el viento eran las horas en que la turbina estaba detenida.
- Aun sin paros no llega a 1, porque la curva de potencia **no es lineal**: en la meseta, el viento cambia y la potencia no. La coherencia, como el $R^2$, solo cuenta la parte lineal.
@@ Decisión
🟡 La coherencia confirma la relación, pero subestima su fuerza por la no linealidad. Para convertir viento en potencia se usará la **curva empírica** del [[eda-curva|análisis exploratorio]], no una regresión lineal. Ahora una relación con **retraso**: la temperatura del aceite de la caja de engranes.
:::

:::pastilla verde | Aplicar · Preblanqueo: el aceite de la caja de engranes responde a la potencia con retraso | u3:ccf u3:demo-preblanqueo u3:regresion-retraso {#esp-ccf}
Encontrar **con cuánto retraso** sube la temperatura del aceite de la caja de engranes cuando la turbina produce más. La correlación cruzada directa no sirve porque las dos series son muy persistentes; hay que **preblanquear**.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| datos de 10 minutos | potencia y `GBOilTempMean` | El calor del aceite responde en minutos. |
| AR(6) para la potencia | filtro de preblanqueo | Deja a la potencia como ruido blanco; **el mismo filtro** se aplica a la temperatura. |
| banda | ±2/√n | Válida porque una de las dos series ya es ruido blanco. |
@@ Código
```python
caja = pd.concat([s10["RealPowerMean"], s10["GBOilTempMean"]], axis=1).interpolate(limit=6).dropna()
pot_c, aceite = caja.iloc[:, 0].values, caja.iloc[:, 1].values

def ccf(a, b, K=12):
    """corr(a_{t+k}, b_t) para k = −3 … K."""
    a = (a - a.mean()) / a.std(); b = (b - b.mean()) / b.std(); n = len(a)
    return pd.Series({k: ((a[k:] * b[:n - k]).sum() if k >= 0 else (a[:n + k] * b[-k:]).sum()) / n for k in range(-3, K + 1)})

ar_pot = AutoReg(pot_c, lags=6, trend="c").fit()
filtro = np.r_[1, -ar_pot.params[1:]]
w_pot = signal.lfilter(filtro, [1], pot_c)[6:]               # potencia preblanqueada
w_ace = signal.lfilter(filtro, [1], aceite)[6:]              # el mismo filtro a la temperatura
ccf_cruda, ccf_pre = ccf(aceite, pot_c), ccf(w_ace, w_pot)
print(f"Banda ±2/√n = ±{2 / np.sqrt(len(w_pot)):.3f}")
print(pd.DataFrame({"cruda": ccf_cruda, "preblanqueada": ccf_pre}).T.round(3).to_string())
```
@@ Resultado
```python oculto
grafica("esp-ccf", [barras(list(ccf_pre.index), ccf_pre.values, "CCF preblanqueada", ["dur" if abs(v) > 2 / np.sqrt(len(w_pot)) else "lav" for v in ccf_pre.values]),
                    linea(list(ccf_cruda.index), ccf_cruda.values, "CCF cruda", "gris", 2, "dot")],
        alto=290, title={"text": "Temperatura del aceite (t + k) contra potencia (t)"}, xaxis={"title": {"text": "k (registros de 10 minutos)"}, "dtick": 1},
        yaxis={"title": {"text": "correlación"}})
```
@widget lab-graf id=esp-ccf
@@ Lectura
- La CCF **cruda** vale alrededor de {{=ccf_cruda.mean()|.2f}} en todos los rezagos, incluso en los negativos: es el eco de la persistencia de las dos series y no dice nada del retraso.
- **Preblanqueada**, casi no hay nada en los rezagos negativos y el máximo está en **k = {{=ccf_pre.idxmax()}}** ({{=ccf_pre.max()|.2f}}): la temperatura del aceite responde a un aumento de potencia **unos 10 minutos después**. Después la correlación decae poco a poco durante más de una hora: es una **respuesta distribuida**, la inercia térmica del aceite.
- Esa forma (pico en 1 y cola que decae) es la de un modelo de **regresión con retraso** con rezagos distribuidos: $T_t = \alpha + \sum_k \beta_k P_{t-k} + \text{error}$.
@@ Decisión
✅ El preblanqueo encontró el retraso que la CCF cruda escondía. Un sistema de monitoreo podría usar esa relación para detectar un calentamiento anormal de la caja de engranes: si la temperatura sube más de lo que predice la potencia reciente, algo anda mal. Para cerrar la Unidad III, un **filtro** que separe las escalas de tiempo del viento.
:::

:::pastilla verde | Aplicar · Un filtro pasa bajos: separar los episodios del ciclo diario | u3:butterworth u3:fase-cero u3:sim-butter u3:filtro-espectro {#esp-filtro}
Separar la serie en una parte **lenta** (episodios de más de 2 días y estaciones) y una parte **rápida** (ciclo diario y cambios de horas) con un filtro Butterworth pasa bajos, aplicado con fase cero para no desplazar la serie en el tiempo.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `signal.butter(4, 1/48, fs=1)` | orden 4, corte en 48 h | Deja pasar los periodos de más de 2 días y corta el ciclo diario (24 h) y sus armónicos. |
| `filtfilt` | dos pasadas | Fase cero: el pico de un episodio queda en la misma hora. |
| `freqz` | ganancia | Para comprobar cuánto deja pasar en 24 h. |
@@ Código
```python
b_f, a_f = signal.butter(4, 1 / 48, btype="low", fs=1)
lento = pd.Series(signal.filtfilt(b_f, a_f, z.values), index=z.index)
rapido = z - lento
w_g, h_g = signal.freqz(b_f, a_f, worN=[1 / 168, 1 / 72, 1 / 48, 1 / 24, 1 / 12], fs=1)
print("Ganancia del filtro (aplicado dos veces):", {f"{1 / f:.0f} h": round(float(np.abs(h) ** 2), 3) for f, h in zip(w_g, h_g)})
print(f"Varianza de √y: {z.var():.3f} | parte lenta: {lento.var():.3f} ({lento.var() / z.var():.0%}) | parte rápida: {rapido.var():.3f} ({rapido.var() / z.var():.0%})")
print(f"Correlación entre las partes: {lento.corr(rapido):.3f}")
perfil_rapido = rapido.groupby(rapido.index.hour).mean()
print(f"Perfil diario de la parte rápida: de {perfil_rapido.min():.3f} a {perfil_rapido.max():.3f}")
```
@@ Resultado
```python oculto
mes_f = slice("2019-03-01", "2019-03-31")
grafica("esp-filtro", [linea(z[mes_f].index, z[mes_f], "√y", "gris", 1.2),
                       linea(lento[mes_f].index, lento[mes_f], "parte lenta (> 2 días)", "osc", 2.6),
                       linea(rapido[mes_f].index, rapido[mes_f] + 1, "parte rápida + 1", "rosa", 1.2)],
        alto=310, title={"text": "Filtro Butterworth pasa bajos (marzo de 2019)"}, yaxis={"title": {"text": "√(m/s)"}})
```
@widget lab-graf id=esp-filtro
@@ Lectura
- El filtro deja pasar casi todo en 7 días (ganancia ≈ 1) y **elimina el ciclo diario** (ganancia de {{=float(np.abs(h_g[3]) ** 2)|.3f}} en 24 h). En 48 h, la frecuencia de corte, deja pasar la mitad de la potencia.
- La **parte lenta** se lleva el {{=lento.var() / z.var() * 100|.0f}}% de la varianza: coincide con lo que dijo el [[esp-bandas|reparto por bandas]] para las escalas de más de 2 días.
- La **parte rápida** contiene el ciclo diario (su perfil promedio va de {{=perfil_rapido.min()|.2f}} a {{=perfil_rapido.max()|.2f}}) y los cambios de pocas horas. Las dos partes casi no se correlacionan ({{=lento.corr(rapido)|.2f}}): el filtro separó escalas independientes.
@@ Decisión
✅ La Unidad III dejó claro qué hay que pronosticar: **la parte lenta es la que pesa** y la rápida es en su mayor parte el ciclo diario, que es predecible. Un buen modelo a 24 horas debe seguir el episodio en curso y añadir el ciclo diario. Con eso, la Fase 3 prepara la **evaluación**: partición, protocolo, referencias y métricas.
:::
