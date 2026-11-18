## 🎚️ Unidad III · Filtros {#u3-filtros}
@mapa La media móvil y la diferencia como filtros lineales, el teorema f<sub>y</sub> = |A|² f<sub>x</sub>, el suavizamiento exponencial como pasa bajos con retraso, los cuatro tipos de filtro con Butterworth, el orden y la fase cero, Hodrick–Prescott, Baxter–King, cómo proponer un filtro y el caso integrador.

:::pastilla verde | Aplicar · La media móvil de 24 horas como filtro | u3:filtro-def u3:respuesta-impulso u3:transferencia u3:mm-filtro {#u3-filtro-mm}
Ver la media móvil de 24 horas como un **filtro lineal**: su **respuesta al impulso** son 24 pesos de 1/24 y su **función de transferencia** $A(f) = \frac{1}{24}\sum_{j=0}^{23} e^{-2\pi i f j}$ dice cuánto deja pasar de cada frecuencia. La **ganancia** |A(f)| vale 1 en las frecuencias bajas y **0 exactamente** en 1/24, 2/24, …: por eso la media de 24 horas borra el ciclo diario.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| pesos | h<sub>j</sub> = 1/24, j = 0, …, 23 | La media móvil hacia atrás de la Unidad I. |
| `signal.freqz(h, worN=f, fs=1)` | A(f) | La transferencia en las frecuencias que se elijan. |
| 2×24 | la centrada | Tiene la misma ganancia con un cero más. |
@@ Código
```python
h24 = np.ones(24) / 24
h2x24 = np.convolve(np.ones(24) / 24, [0.5, 0.5])
f_fil = np.unique(np.r_[np.geomspace(1 / 500, 0.5, 400), 1 / np.array([720, 240, 96, 72, 48, 36, 24, 12, 8, 6, 3])])
_, G_mm24 = signal.freqz(h24, worN=f_fil, fs=1.0)
_, G_mm2x24 = signal.freqz(h2x24, worN=f_fil, fs=1.0)
for P in [240, 48, 24, 12, 8, 6]:
    i = np.argmin(np.abs(f_fil - 1 / P))
    print(f"Periodo {P:>3} h: ganancia de la media de 24 h = {abs(G_mm24[i]):.4f} | de la 2×24 = {abs(G_mm2x24[i]):.4f}")
```
@@ Resultado
```python oculto
grafica("u3-filtro-mm", [linea((1 / f_fil).round(3), np.abs(G_mm24).round(5), "media móvil de 24 h", "lav", 2.4), linea((1 / f_fil).round(3), np.abs(G_mm2x24).round(5), "media 2×24 (centrada)", "rosa", 1.8, "dash")]
        + marcas_periodo([24, 12, 8, 6], 0, 1),
        alto=290, title={"text": "Ganancia de las medias móviles: ceros en el ciclo diario y sus armónicos"},
        xaxis={"title": {"text": "periodo (horas)"}, "type": "log", "autorange": "reversed"}, yaxis={"title": {"text": "|A(f)|"}, "range": [0, 1.05]})
```
@widget lab-graf id=u3-filtro-mm
@@ Lectura
- La ganancia de la media de 24 horas es casi 1 en los periodos largos ({{=abs(G_mm24[np.argmin(np.abs(f_fil - 1 / 240))])|.2f}} a diez días) y **cero** en 24, 12, 8 y 6 horas: elimina exactamente el ciclo diario y todos sus armónicos.
- Entre esos ceros deja pasar algo (los "lóbulos" de la gráfica): no es un pasa bajos perfecto. A 48 horas ya atenúa bastante ({{=abs(G_mm24[np.argmin(np.abs(f_fil - 1 / 48))])|.2f}}).
- La 2×24 tiene prácticamente la misma ganancia; su ventaja es que está centrada.
@@ Decisión
✅ La pregunta de la Unidad I, "¿qué ventana borra la estacionalidad?", tiene aquí su respuesta exacta: la que pone un cero de la ganancia en cada armónico del periodo.
:::

:::pastilla verde | Aplicar · El teorema clave: el espectro de la salida de un filtro | u3:filtro-espectro u3:demo-filtro-espectro u3:filtros-lineales-python {#u3-teorema}
Comprobar con datos el teorema de los filtros: si y = filtro(x), el espectro de la salida es el de la entrada multiplicado por la ganancia al cuadrado. Se filtra el viento con la media de 24 horas y se compara el espectro de Welch de la salida con |A|² por el espectro del viento.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| filtro | media móvil de 24 h (`lfilter`) | El de la pastilla anterior. |
| espectros | Welch, segmentos de 720 h | El estimador de referencia. |
| comparación | cociente f<sub>salida</sub> / f<sub>entrada</sub> contra \|A\|² | Debe coincidir. |
@@ Código
```python
salida_mm = signal.lfilter(h24, [1.0], y.values)[24:]
fw_s, Pw_s = signal.welch(salida_mm, fs=1.0, nperseg=720, detrend="constant")
fw_x, Pw_x = welchs[720]
_, A_w = signal.freqz(h24, worN=fw_x[1:], fs=1.0)
cociente_w = Pw_s[1:] / Pw_x[1:]
for P in [240, 72, 36, 24]:
    i = np.argmin(np.abs(fw_x[1:] - 1 / P))
    print(f"Periodo {P:>3} h: f_salida / f_entrada = {cociente_w[i]:.4f} | |A|² = {abs(A_w[i]) ** 2:.4f}")
print(f"Varianza: entrada {y.var():.2f} | salida {salida_mm.var():.2f} ({salida_mm.var() / y.var():.0%})")
```
@@ Resultado
```python oculto
grafica("u3-teorema", [linea((1 / fw_x[1:]).round(2), Pw_x[1:].round(4), "espectro del viento", "gris", 1.6),
                       linea((1 / fw_x[1:]).round(2), Pw_s[1:].round(5), "espectro de la salida", "lav", 2.4),
                       linea((1 / fw_x[1:]).round(2), (np.abs(A_w) ** 2 * Pw_x[1:]).round(5), "|A|² × espectro del viento", "rosa", 1.8, "dot")],
        alto=300, title={"text": "El espectro de la salida es |A|² por el de la entrada"}, xaxis={"title": {"text": "periodo (horas)"}, "type": "log", "autorange": "reversed"},
        yaxis={"title": {"text": "densidad (escala log)"}, "type": "log", "range": [-6, 4]})
```
@widget lab-graf id=u3-teorema
@@ Lectura
- El cociente entre el espectro de la salida y el de la entrada coincide con |A|²: {{=cociente_w[np.argmin(np.abs(fw_x[1:] - 1 / 72))]|.3f}} contra {{=abs(A_w[np.argmin(np.abs(fw_x[1:] - 1 / 72))]) ** 2|.3f}} a 72 horas, y casi cero en 24.
- En la gráfica, la línea punteada (|A|² por el espectro del viento) cae encima del espectro de la salida.
- La salida conserva el {{=100 * salida_mm.var() / y.var()|.0f}}% de la varianza: lo que se quitó es el ciclo diario y las variaciones de horas.
@@ Decisión
✅ El teorema f<sub>y</sub> = |A|² f<sub>x</sub> permite saber qué le hace un filtro a una serie **antes** de aplicarlo.
:::

:::pastilla verde | Aplicar · Las diferencias son filtros pasa altos | u3:diferencia-filtro u3:demo-ganancia-diferencia {#u3-diferencia}
Ver la diferencia ∇ = 1 − L como filtro: su ganancia es $|A(f)| = 2|\sin(\pi f)|$, que vale **0 en la frecuencia cero** y crece con la frecuencia. La diferencia estacional ∇₂₄ = 1 − L²⁴ tiene ganancia $2|\sin(24\pi f)|$: cero en la frecuencia cero **y** en el ciclo diario y sus armónicos.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| ∇ | pesos [1, −1] | La diferencia regular. |
| ∇₂₄ | 1 en 0, −1 en 24 | La estacional. |
| comprobación | varianza de ∇y contra la integral de \|A\|² f<sub>y</sub> | El teorema, otra vez. |
@@ Código
```python
_, A_d1 = signal.freqz([1, -1], worN=f_fil, fs=1.0)
_, A_d24 = signal.freqz(np.r_[1, np.zeros(23), -1], worN=f_fil, fs=1.0)
for P in [720, 72, 24, 12, 3]:
    i = np.argmin(np.abs(f_fil - 1 / P))
    print(f"Periodo {P:>3} h: ganancia de ∇ = {abs(A_d1[i]):.4f} | de ∇₂₄ = {abs(A_d24[i]):.4f}")
_, A_d1w = signal.freqz([1, -1], worN=fw_x, fs=1.0)
var_teo = np.sum(np.abs(A_d1w) ** 2 * Pw_x) * (fw_x[1] - fw_x[0])
print(f"\nVarianza de ∇y: observada {y.diff().var():.3f} | con el teorema (Σ |A|² f_y Δf) {var_teo:.3f}")
```
@@ Resultado
```python oculto
grafica("u3-diferencia", [linea((1 / f_fil).round(3), np.abs(A_d1).round(5), "∇ (regular)", "dur", 2.4), linea((1 / f_fil).round(3), np.abs(A_d24).round(5), "∇₂₄ (estacional)", "cel", 1.4)],
        alto=280, title={"text": "Ganancia de las diferencias"}, xaxis={"title": {"text": "periodo (horas)"}, "type": "log", "autorange": "reversed"},
        yaxis={"title": {"text": "|A(f)|"}, "range": [0, 2.05]})
```
@widget lab-graf id=u3-diferencia
@@ Lectura
- La **diferencia regular** casi anula las escalas largas (ganancia {{=abs(A_d1[np.argmin(np.abs(f_fil - 1 / 720))])|.3f}} a un mes) y amplifica las cortas (1.73 a 3 horas): es un **pasa altos**. Por eso ∇y casi no tiene autocorrelación: le quitó los episodios.
- La **diferencia estacional** tiene ceros en 24, 12, 8 horas y en la frecuencia cero, pero **amplifica** las escalas de días (ganancia 1.74 a 72 horas): por eso ∇₂₄y seguía con mucha memoria.
- El teorema predice bien la varianza de ∇y ({{=var_teo|.2f}} contra {{=y.diff().var()|.2f}}).
@@ Decisión
🔵 Diferenciar es filtrar. La Unidad I eligió la diferencia regular sin saber esto; la Unidad III explica por qué la estacional no servía.
:::

:::pastilla azul | Aplicar · El suavizamiento exponencial: pasa bajos con retraso | u3:ses-filtro u3:w-respuesta {#u3-ses}
Escribir el **SES** de la Unidad II (α = 0.2) como filtro: $A(f) = \frac{\alpha}{1 - (1 - \alpha)e^{-2\pi i f}}$. Es un **pasa bajos causal**: deja pasar los cambios lentos, atenúa los rápidos y los **retrasa**. Para frecuencias bajas el retraso es de unas (1 − α)/α horas.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| α | el de la referencia SES | El que eligió la validación. |
| retraso | −arg A(f) / (2πf) | En horas, por frecuencia. |
| comprobación | rezago de máxima correlación entre el nivel SES y la media móvil centrada de 12 h | El retraso visto en los datos. |
@@ Código
```python
_, A_ses = signal.freqz([a_opt], [1, -(1 - a_opt)], worN=f_fil, fs=1.0)
retraso_ses = -np.unwrap(np.angle(A_ses)) / (2 * np.pi * f_fil)
for P in [240, 48, 24, 12, 6]:
    i = np.argmin(np.abs(f_fil - 1 / P))
    print(f"Periodo {P:>3} h: ganancia {abs(A_ses[i]):.3f} | retraso {retraso_ses[i]:.2f} h")
print(f"Retraso teórico en frecuencias bajas: (1 − α)/α = {(1 - a_opt) / a_opt:.1f} h")
nivel_ses = y.ewm(alpha=a_opt, adjust=False).mean()
centrada12 = y.rolling(13, center=True).mean()
corr_ret = {k: nivel_ses.corr(centrada12.shift(k)) for k in range(0, 9)}
print(f"El nivel SES se parece más a la media centrada de hace {max(corr_ret, key=corr_ret.get)} horas")
```
@@ Resultado
```python oculto
grafica("u3-ses", [linea((1 / f_fil).round(3), np.abs(A_ses).round(5), "ganancia", "lav", 2.4), linea((1 / f_fil).round(3), retraso_ses.round(4), "retraso (horas)", "rosa", 2, yaxis="y2")],
        alto=290, title={"text": f"El SES con α = {a_opt} como filtro"}, xaxis={"title": {"text": "periodo (horas)"}, "type": "log", "autorange": "reversed"},
        yaxis={"title": {"text": "|A(f)|"}, "range": [0, 1.05]}, yaxis2={"title": {"text": "retraso (h)"}, "overlaying": "y", "side": "right", "showgrid": False})
```
@widget lab-graf id=u3-ses
@@ Lectura
- El SES con α = {{=a_opt}} es un **pasa bajos**: deja pasar casi todo en periodos de días ({{=abs(A_ses[np.argmin(np.abs(f_fil - 1 / 240))])|.2f}}) y atenúa lo rápido ({{=abs(A_ses[np.argmin(np.abs(f_fil - 1 / 6))])|.2f}} a 6 horas).
- Pero **retrasa**: en las escalas largas su salida va unas **{{=(1 - a_opt) / a_opt|.0f}} horas atrás**, y en los datos su nivel se parece más a la media centrada de hace {{=max(corr_ret, key=corr_ret.get)}} horas.
@@ Decisión
🔵 Por eso el SES (y WindowAverage) se queda atrás cuando el viento cambia de nivel: siempre llega tarde. Es el precio de usar solo el pasado.
:::

:::pastilla verde | Aplicar · Los cuatro tipos de filtro con Butterworth | u3:cuatro-tipos u3:butterworth u3:sim-butter {#u3-tipos}
Aplicar al viento los **cuatro tipos** de filtro con un Butterworth de orden 4 de fase cero: **pasa bajos** (lo que dura más de 2 días), **pasa altos** (lo que dura menos), **pasa banda** (el ciclo diario, de 20 a 28 h) y **rechaza banda** (todo menos el ciclo diario). Mueve el control para ver cada salida.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `signal.butter(4, …, output="sos")` | orden 4 | Una caída de 80 dB por década, sin ondulaciones. |
| corte | 1/48 ciclos por hora; banda 1/28 a 1/20 | Dos días; la banda del ciclo diario. |
| `sosfiltfilt` | fase cero | Filtra hacia adelante y hacia atrás: sin retraso. |
@@ Código
```python
TIPOS = {"pasa bajos (> 2 días)": signal.butter(4, 1 / 48, "lowpass", fs=1.0, output="sos"),
         "pasa altos (< 2 días)": signal.butter(4, 1 / 48, "highpass", fs=1.0, output="sos"),
         "pasa banda (20–28 h)": signal.butter(4, [1 / 28, 1 / 20], "bandpass", fs=1.0, output="sos"),
         "rechaza banda (20–28 h)": signal.butter(4, [1 / 28, 1 / 20], "bandstop", fs=1.0, output="sos")}
yc_f = y.values - y.mean()
salidas = {k: signal.sosfiltfilt(sos, yc_f) for k, sos in TIPOS.items()}
for k, s_ in salidas.items():
    print(f"{k:>24}: {100 * s_.var() / yc_f.var():5.1f}% de la varianza del viento")
```
@@ Resultado
```python oculto
mzt = slice(y.index.get_loc(pd.Timestamp("2019-04-01")), y.index.get_loc(pd.Timestamp("2019-04-15")))
control("u3-tipos", [{"etiqueta": "Filtro", "tipo": "seg", "textos": list(TIPOS), "inicial": 0}],
        [[linea(y.index[mzt], (s_[mzt] + (y.mean() if k.startswith(("pasa bajos", "rechaza")) else 0)).round(2), k, "rosa", 2.4)] for k, s_ in salidas.items()],
        base=[linea(y.index[mzt], y.values[mzt].round(2), "viento", "gris", 1)],
        textos=[f"Esta salida tiene el <b>{100 * s_.var() / yc_f.var():.1f}%</b> de la varianza del viento." for s_ in salidas.values()],
        alto=300, title={"text": "Los cuatro tipos de filtro sobre dos semanas de abril"}, yaxis={"title": {"text": "m/s"}})
```
@widget lab-control id=u3-tipos
@@ Lectura
- El **pasa bajos** (más de 2 días) conserva el {{=100 * salidas['pasa bajos (> 2 días)'].var() / yc_f.var()|.0f}}% de la varianza: dibuja los episodios.
- El **pasa altos** se queda con el {{=100 * salidas['pasa altos (< 2 días)'].var() / yc_f.var()|.0f}}%: el ciclo diario y las variaciones de horas.
- El **pasa banda** del ciclo diario tiene solo el {{=100 * salidas['pasa banda (20–28 h)'].var() / yc_f.var()|.1f}}%, y en la gráfica es una ondulación pequeña y regular; el **rechaza banda** conserva todo lo demás ({{=100 * salidas['rechaza banda (20–28 h)'].var() / yc_f.var()|.0f}}%).
@@ Decisión
✅ Los cuatro tipos separan el viento en piezas con significado físico, y sus varianzas coinciden con el análisis por bandas del periodograma.
:::

:::pastilla verde | Aplicar · Frecuencia de corte y orden | u3:corte-orden u3:filtro-ideal u3:fir-iir {#u3-orden}
Ver cómo el **orden** del Butterworth cambia la forma de la ganancia: con orden bajo la transición entre lo que pasa y lo que se corta es gradual; con orden alto se acerca al **filtro ideal** (un escalón), que no existe porque necesitaría infinitos coeficientes. Mueve el control.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| tipo | pasa bajos con corte en 48 h | El de la pastilla anterior. |
| orden | 1, 2, 4, 8 y 12 | De muy suave a muy abrupto. |
| ganancia en el corte | 1/√2 ≈ 0.707 | La definición de la frecuencia de corte de Butterworth. |
@@ Código
```python
ORDENES = [1, 2, 4, 8, 12]
gan_ord = {}
for o in ORDENES:
    sos_o = signal.butter(o, 1 / 48, "lowpass", fs=1.0, output="sos")
    _, Ao = signal.sosfreqz(sos_o, worN=f_fil, fs=1.0)
    gan_ord[o] = np.abs(Ao)
    print(f"orden {o:>2}: ganancia en 48 h {gan_ord[o][np.argmin(np.abs(f_fil - 1 / 48))]:.3f} | en 24 h {gan_ord[o][np.argmin(np.abs(f_fil - 1 / 24))]:.4f} | en 96 h {gan_ord[o][np.argmin(np.abs(f_fil - 1 / 96))]:.3f}")
```
@@ Resultado
```python oculto
ideal = (1 / f_fil > 48).astype(float)
control("u3-orden", [{"etiqueta": "Orden", "textos": [str(o) for o in ORDENES], "inicial": 2}],
        [[linea((1 / f_fil).round(3), gan_ord[o].round(5), f"Butterworth de orden {o}", "lav", 2.6)] for o in ORDENES],
        base=[linea((1 / f_fil).round(3), ideal, "filtro ideal", "gris", 1.4, "dash")],
        alto=290, title={"text": "Ganancia del pasa bajos de 48 h según el orden"}, xaxis={"title": {"text": "periodo (horas)"}, "type": "log", "autorange": "reversed"},
        yaxis={"title": {"text": "|A(f)|"}, "range": [0, 1.05]})
```
@widget lab-control id=u3-orden
@@ Lectura
- En la frecuencia de corte (48 h) la ganancia vale **0.70** con cualquier orden: es la definición de Butterworth.
- Lo que cambia es la **pendiente**: a 24 horas la ganancia es {{=gan_ord[1][np.argmin(np.abs(f_fil - 1 / 24))]|.2f}} con orden 1, {{=gan_ord[4][np.argmin(np.abs(f_fil - 1 / 24))]|.3f}} con orden 4 y prácticamente 0 con orden 12.
- Con orden alto la curva se acerca al escalón del filtro ideal, pero nunca lo alcanza.
@@ Decisión
✅ Orden 4 es un buen compromiso para el viento: corta el ciclo diario casi por completo sin la inestabilidad numérica de los órdenes muy altos.
:::

:::pastilla amarillo | Aplicar · Causal o de fase cero | u3:fase-cero u3:demo-filtfilt {#u3-fase-cero}
Comparar el mismo pasa bajos aplicado de forma **causal** (`sosfilt`, solo usa el pasado: es lo único posible en tiempo real) y de **fase cero** (`sosfiltfilt`, usa pasado y futuro). El causal retrasa la señal; el de fase cero no, pero no se puede usar para pronosticar.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| filtro | Butterworth pasa bajos de orden 4, corte 48 h | El mismo para los dos. |
| retraso | rezago de máxima correlación entre las dos salidas | Cuánto se atrasa el causal. |
@@ Código
```python
sos_pb = TIPOS["pasa bajos (> 2 días)"]
causal = signal.sosfilt(sos_pb, yc_f)
cero = salidas["pasa bajos (> 2 días)"]
corr_fc = {k: np.corrcoef(cero[200:len(cero) - 40], causal[200 + k:len(causal) - 40 + k])[0, 1] for k in range(0, 40)}
ret_fc = max(corr_fc, key=corr_fc.get)
print(f"El filtro causal va {ret_fc} horas atrasado respecto del de fase cero (correlación {corr_fc[ret_fc]:.4f})")
_, A_pb = signal.sosfreqz(sos_pb, worN=f_fil, fs=1.0)
ret_teo = -np.unwrap(np.angle(A_pb)) / (2 * np.pi * f_fil)
print(f"Retraso teórico del causal: {ret_teo[np.argmin(np.abs(f_fil - 1 / 240))]:.1f} h a 10 días | {ret_teo[np.argmin(np.abs(f_fil - 1 / 96))]:.1f} h a 4 días")
```
@@ Resultado
```python oculto
grafica("u3-fase-cero", [linea(y.index[mzt], y.values[mzt].round(2), "viento", "gris", 1), linea(y.index[mzt], (cero[mzt] + y.mean()).round(2), "fase cero (filtfilt)", "menta", 2.4),
                         linea(y.index[mzt], (causal[mzt] + y.mean()).round(2), "causal (filt)", "dur", 2.4, "dash")],
        alto=290, title={"text": "El mismo pasa bajos, causal y de fase cero"}, yaxis={"title": {"text": "m/s"}})
```
@widget lab-graf id=u3-fase-cero
@@ Lectura
- El filtro **causal** va **{{=ret_fc}} horas atrasado** respecto del de fase cero, casi lo que predice su fase ({{=ret_teo[np.argmin(np.abs(f_fil - 1 / 240))]|.0f}} horas en las escalas lentas). En la gráfica, la línea discontinua sube y baja casi un día después.
- El de fase cero sigue los cambios sin retraso, pero para calcular cada valor usa datos **futuros**.
@@ Decisión
🟡 Para describir o desestacionalizar una serie histórica se usa fase cero; para pronosticar, solo un filtro causal es honesto, y su retraso es inevitable.
:::

:::pastilla verde | Aplicar · El filtro de Hodrick–Prescott | u3:hp u3:demo-ganancia-hp u3:w-hp {#u3-hp}
Separar el viento **diario** en una **tendencia** suave y un **ciclo** con el filtro de **Hodrick–Prescott**, que minimiza $\sum (y_t - \tau_t)^2 + \lambda \sum (\nabla^2 \tau_t)^2$. Con λ grande la tendencia es casi una recta; con λ chico sigue a los datos. Mueve el control.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| serie | viento medio diario | HP se usa con datos de baja frecuencia. |
| λ | 10, 100, 1,600, 14,400 y 129,600 | Los valores habituales de datos anuales, trimestrales y mensuales, y dos más. |
| periodo de corte | ≈ 2π (λ)<sup>1/4</sup> días | El periodo en que la ganancia del ciclo vale 1/2. |
@@ Código
```python
from statsmodels.tsa.filters.hp_filter import hpfilter
LAMB = [10, 100, 1600, 14400, 129600]
hp_res = {l: hpfilter(dia["mean"], lamb=l) for l in LAMB}
for l, (cic, ten) in hp_res.items():
    print(f"λ = {l:>6}: corte ≈ {2 * np.pi * l ** 0.25:5.0f} días | varianza del ciclo {cic.var():5.2f} ({cic.var() / dia['mean'].var():.0%} de la diaria)")
```
@@ Resultado
```python oculto
control("u3-hp", [{"etiqueta": "λ", "textos": [f"{l:,}" for l in LAMB], "inicial": 2}],
        [[linea(dia.index, hp_res[l][1].round(2), f"tendencia HP (λ = {l:,})", "rosa", 2.8)] for l in LAMB],
        base=[linea(dia.index, dia["mean"].round(2), "viento diario", "gris", 1)],
        textos=[f"λ = {l:,}: periodo de corte ≈ {2 * np.pi * l ** 0.25:.0f} días; el ciclo tiene el {100 * hp_res[l][0].var() / dia['mean'].var():.0f}% de la varianza diaria." for l in LAMB],
        alto=290, title={"text": "Tendencia de Hodrick–Prescott del viento diario"}, yaxis={"title": {"text": "m/s"}})
```
@widget lab-control id=u3-hp
@@ Lectura
- Con **λ = 1,600** (el valor clásico para datos trimestrales) la tendencia corta en periodos de unos 40 días y el "ciclo" se lleva el {{=100 * hp_res[1600][0].var() / dia['mean'].var()|.0f}}% de la varianza diaria.
- Con **λ = 10** la tendencia sigue casi cada episodio; con **λ = 129,600** es una curva de la temporada.
- No hay un λ "correcto": cada uno define qué se llama tendencia. Para datos diarios de viento, un λ de 100 a 1,600 separa la temporada de los episodios.
@@ Decisión
✅ HP es un pasa bajos (la tendencia) con su complemento (el ciclo). Es útil para describir, pero usa datos futuros: no sirve para pronosticar.
:::

:::pastilla verde | Aplicar · Baxter–King: un pasa banda para la escala de los nortes | u3:bk u3:guia-bk-pesos u3:filtros-economia-python {#u3-bk}
Aislar la escala **sinóptica** (de 3 a 30 días, la de los episodios) con el filtro de **Baxter–King**, un pasa banda simétrico de pesos finitos que se diseñó para el ciclo económico. Pierde K datos en cada extremo.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `bkfilter(dia, low=3, high=30, K=15)` | periodos de 3 a 30 días | La banda de los episodios. |
| K | 15 días de cada lado | Más K, mejor aproximación al filtro ideal y más datos perdidos. |
@@ Código
```python
from statsmodels.tsa.filters.bk_filter import bkfilter
bk = pd.Series(np.asarray(bkfilter(dia["mean"].values, low=3, high=30, K=15)).ravel(), index=dia.index[15:-15])
print(f"Datos que pierde: {len(dia) - len(bk)} | varianza del ciclo sinóptico: {bk.var():.2f} ({bk.var() / dia['mean'][15:-15].var():.0%} de la diaria)")
cruces = int(((bk.shift(1) < 0) & (bk >= 0)).sum())
print(f"Cruces hacia arriba por cero: {cruces} → un ciclo cada {len(bk) / max(cruces, 1):.1f} días en promedio")
print(f"Correlación con la banda de 3 a 30 días de Butterworth: {bk.corr(pd.Series(signal.sosfiltfilt(signal.butter(4, [1 / 30, 1 / 3], 'bandpass', fs=1.0, output='sos'), dia['mean'].values - dia['mean'].mean()), index=dia.index)[bk.index]):.3f}")
```
@@ Resultado
```python oculto
grafica("u3-bk", [linea(bk.index, bk.round(2), "ciclo de 3 a 30 días (Baxter–King)", "osc", 2.2)], alto=270, showlegend=False,
        title={"text": "La escala sinóptica del viento diario"}, yaxis={"title": {"text": "m/s respecto del nivel"}}, shapes=[hline(0)])
```
@widget lab-graf id=u3-bk
@@ Lectura
- La banda de 3 a 30 días tiene el **{{=100 * bk.var() / dia['mean'][15:-15].var()|.0f}}%** de la varianza del viento diario: la escala de los episodios.
- El ciclo cruza cero hacia arriba {{=cruces}} veces: en promedio, **un ciclo cada {{=len(bk) / max(cruces, 1)|.0f}} días**.
- Baxter–King y un Butterworth de la misma banda dan casi lo mismo (correlación 0.99). Baxter–King pierde 15 días en cada extremo.
@@ Decisión
✅ Los filtros diseñados para el ciclo económico sirven para el "ciclo" del viento: el de los nortes, con un periodo típico de una semana.
:::

:::pastilla verde | Aplicar · Cómo proponer un filtro: quitar el ciclo diario | u3:objetivo-filtro u3:receta-filtro u3:notch u3:w-proponer {#u3-proponer}
Seguir la **receta** de la Unidad III para un objetivo concreto: obtener una serie horaria **sin el ciclo diario** que conserve todo lo demás. (1) Objetivo, (2) frecuencias a quitar, (3) tipo de filtro, (4) diseño, (5) aplicar, (6) verificar con el espectro.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| frecuencias | 1/24, 1/12 y 1/6 | El ciclo diario y los armónicos con pico en el periodograma. |
| tipo | filtros de muesca (`iirnotch`) en serie | Quitan una banda estrecha y dejan el resto. |
| Q | 8 | Ancho de la muesca: f/Q (en 24 h, de unas 22 a 26 horas). |
| verificación | amplitud del perfil diario y espectro antes y después | Que desaparezca solo lo que se quería. |
@@ Código
```python
desest = y.values - y.mean()
for P in [24, 12, 6]:
    b_n, a_n = signal.iirnotch(1 / P, Q=8, fs=1.0)
    desest = signal.filtfilt(b_n, a_n, desest)
desest = pd.Series(desest + y.mean(), index=y.index)
amp_antes = y.groupby(y.index.hour).mean().pipe(lambda p: p.max() - p.min())
amp_despues = desest.groupby(desest.index.hour).mean().pipe(lambda p: p.max() - p.min())
print(f"Amplitud del perfil diario: antes {amp_antes:.2f} m/s | después {amp_despues:.3f} m/s")
print(f"Varianza: antes {y.var():.2f} | después {desest.var():.2f} (se quitó el {1 - desest.var() / y.var():.1%})")
fw_d, Pw_d = signal.welch(desest.values, fs=1.0, nperseg=720, detrend="constant")
i24w = np.argmin(np.abs(fw_d - 1 / 24))
print(f"Espectro en 24 h: antes {Pw_x[i24w]:.2f} | después {Pw_d[i24w]:.3f}")
print(f"Correlación con la serie desestacionalizada por STL: {desest.corr(y - stl_s[31].seasonal):.3f}")
```
@@ Resultado
```python oculto
grafica("u3-proponer", [linea((1 / fw_x[1:]).round(2), Pw_x[1:].round(4), "viento", "gris", 1.6), linea((1 / fw_d[1:]).round(2), Pw_d[1:].round(4), "sin el ciclo diario", "menta", 2.4)],
        alto=290, title={"text": "Espectro antes y después de las muescas en 24, 12 y 6 horas"}, xaxis={"title": {"text": "periodo (horas)"}, "type": "log", "autorange": "reversed"},
        yaxis={"title": {"text": "densidad (escala log)"}, "type": "log"})
```
@widget lab-graf id=u3-proponer
@@ Lectura
- Con muescas en 24, 12 y 6 horas, la amplitud del perfil diario baja de {{=amp_antes|.2f}} a {{=amp_despues|.2f}} m/s y el espectro en 24 horas cae de {{=Pw_x[i24w]|.0f}} a {{=Pw_d[i24w]|.1f}}.
- Se quita el {{=100 * (1 - desest.var() / y.var())|.1f}}% de la varianza: algo más que el ciclo diario, porque cada muesca tiene un ancho. El resto del espectro queda igual (las curvas se enciman fuera de las muescas).
- La serie filtrada es casi igual a la desestacionalizada con STL de la Unidad I (correlación {{=desest.corr(y - stl_s[31].seasonal)|.3f}}).
@@ Decisión
✅ La receta funciona: objetivo claro, frecuencias identificadas en el periodograma, un filtro que solo toca esas frecuencias y verificación con el espectro.
:::

:::pastilla verde | Aplicar · Caso integrador: los nortes en el dominio de la frecuencia | u3:caso-elnino u3:elnino-filtro u3:elnino-conclusion {#u3-caso}
Cerrar la Unidad III como en el caso de El Niño: aislar con un pasa banda la escala de los episodios (2 a 10 días) en la serie horaria, ver cuánto de la varianza es, cuál es su periodo típico y redactar la conclusión como en el examen.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| banda | 2 a 10 días | Donde están los episodios según el periodograma. |
| filtro | Butterworth pasa banda de orden 4, fase cero | El de los cuatro tipos. |
| periodo típico | del pico del espectro de Welch en la banda | La "duración" de un ciclo de norte. |
@@ Código
```python
sos_sin = signal.butter(4, [1 / 240, 1 / 48], "bandpass", fs=1.0, output="sos")
sinoptica = pd.Series(signal.sosfiltfilt(sos_sin, yc_f), index=y.index)
banda_w = (fw_x > 1 / 240) & (fw_x < 1 / 48)
per_pico = 1 / fw_x[banda_w][np.argmax(Pw_x[banda_w])]
print(f"Varianza de la escala sinóptica: {100 * sinoptica.var() / yc_f.var():.0f}% de la del viento")
print(f"Periodo con más potencia en la banda: {per_pico:.0f} h ({per_pico / 24:.1f} días)")
print(f"Amplitud típica (desviación) del ciclo sinóptico: {sinoptica.std():.2f} m/s | en los meses de nortes: {sinoptica[sinoptica.index.month.isin([1, 2, 11, 12])].std():.2f}")
RESP_U3 = [
    ("P8 · ¿En qué escalas está la variabilidad?", f"{por_banda['más de 30 días'] + por_banda['3 a 30 días']:.0f}% en periodos de más de 3 días; {por_banda['ciclo diario (22–26 h)'] + por_banda['armónico (11.5–12.5 h)']:.1f}% en el ciclo diario y su armónico."),
    ("¿El ciclo diario es periódico?", f"Sí: una línea en 24 h con armónicos en 12 y 6 h; amplitud de {A24:.2f} m/s, máximo a las {(fase24 / (2 * np.pi / 24)) % 24:.0f} h."),
    ("¿Hay retrasos entre turbinas o con la temperatura?", f"Entre turbinas no (coherencia de 0.99 y fase cero); el viento va unas {fase_t[i24t] / (2 * np.pi / 24):.1f} h adelante de la temperatura en el ciclo diario."),
    ("¿Qué filtros sirven?", "La media 2×24 o muescas para quitar el ciclo diario; pasa bandas de 2 a 10 días (o Baxter–King) para aislar los nortes."),
]
for p, r in RESP_U3:
    print(f"{p}\n   {r}")
```
@@ Resultado
```python oculto
mzc = slice("2019-10-01", "2019-12-31")
grafica("u3-caso", [linea(y[mzc].index[::3], y[mzc].values[::3].round(1), "viento (cada 3 h)", "gris", 0.8),
                    linea(sinoptica[mzc].index[::3], (sinoptica[mzc].values[::3] + y.mean()).round(2), "escala de 2 a 10 días", "osc", 2.4)],
        alto=290, title={"text": "La escala sinóptica en el último trimestre (la temporada de la prueba)"}, yaxis={"title": {"text": "m/s"}})
tabla("u3-resumen", ["pregunta", "respuesta de la Unidad III"], [list(f) for f in RESP_U3], titulo="Lo que respondió la Unidad III")
```
@widget lab-graf id=u3-caso
@widget lab-tabla id=u3-resumen
@@ Lectura
- La escala de **2 a 10 días** tiene el {{=100 * sinoptica.var() / yc_f.var()|.0f}}% de la varianza del viento horario y su periodo con más potencia es de **{{=per_pico / 24|.1f}} días**.
- En el último trimestre (la temporada de la prueba) la escala sinóptica sube y baja con cada norte; su amplitud es mayor en los meses de nortes ({{=sinoptica[sinoptica.index.month.isin([1, 2, 11, 12])].std()|.1f}} m/s contra {{=sinoptica.std()|.1f}} en todo el año).
- **Conclusión, como en el examen:** el viento de MV01 tiene un espectro rojo, con más del 80% de su varianza en periodos de más de 3 días; un ciclo diario periódico pero débil (3% de la varianza, máximo a las 13 h, con armónicos en 12 y 6 h); y una escala sinóptica de unos 7 días que corresponde a los nortes. Las turbinas del parque son coherentes en todas las escalas lentas y sin retraso entre ellas.
@@ Decisión
✅ Con esto termina la Unidad III. Lo que el pronóstico puede aprovechar está en la memoria de los episodios y en el ciclo diario; lo que no puede anticipar es el inicio y el fin de cada norte. Toca la evaluación final.
:::
