## 🔁 Unidad III · Periodicidad y dominio de la frecuencia {#u3-frecuencia}
@mapa Periodicidad contra ciclo en la ACF, la oscilación básica (amplitud, frecuencia y fase), el alias y el límite de Nyquist, las unidades de frecuencia, la serie como suma de oscilaciones y la misma memoria vista en el tiempo y en la frecuencia.

:::pastilla azul | Aplicar · Periodicidad y ciclo: la huella en la ACF | u3:periodo-vs-ciclo u3:ciclo-acf u3:cuando-sarima {#u3-periodo-ciclo}
Separar las dos repeticiones del viento con la descomposición STL de la Unidad I y comparar sus ACF. Una componente **periódica** (el patrón diario) tiene una ACF que oscila con su periodo **sin apagarse**; un **ciclo** sin periodo fijo (los episodios) tiene una ACF que decae sin oscilar.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| periódica | componente estacional de STL con `seasonal=999` | El patrón diario casi fijo. |
| ciclo | tendencia de STL (los episodios y la temporada) | Lo que dura días sin fecha fija. |
| rezagos | hasta 10 días | Para ver si la oscilación se apaga. |
@@ Código
```python
acf_per = acf(stl_s[999].seasonal, nlags=240, fft=True)
acf_cic = acf(stl.trend, nlags=240, fft=True)
print(f"Periódica: ACF en 12, 24, 120 y 240 h = {np.round(acf_per[[12, 24, 120, 240]], 3)}")
print(f"Ciclo:     ACF en 12, 24, 120 y 240 h = {np.round(acf_cic[[12, 24, 120, 240]], 3)}")
print(f"Viento:    ACF en 12, 24, 120 y 240 h = {np.round(r_720[[12, 24, 120, 240]], 3)}")
```
@@ Resultado
```python oculto
k240 = list(range(241))
grafica("u3-periodo-ciclo", [linea(k240, acf_per, "patrón diario (periódico)", "rosa", 2), linea(k240, acf_cic, "episodios (ciclo)", "osc", 2.4),
                             linea(k240, r_720[:241], "viento", "gris", 1.4, "dot")],
        alto=290, title={"text": "ACF de la parte periódica, de la parte cíclica y del viento"}, xaxis={"title": {"text": "rezago (horas)"}, "dtick": 24},
        yaxis={"title": {"text": "autocorrelación"}})
```
@widget lab-graf id=u3-periodo-ciclo
@@ Lectura
- La ACF del **patrón diario** oscila con periodo 24 y **no se apaga**: vale {{=acf_per[12]|.2f}} a 12 horas, {{=acf_per[24]|.2f}} a 24 y todavía {{=acf_per[240]|.2f}} a diez días. Es la firma de una periodicidad.
- La ACF de los **episodios** decae sin oscilar: {{=acf_cic[24]|.2f}} a un día, {{=acf_cic[120]|.2f}} a cinco. Es la firma de un ciclo sin periodo fijo.
- La ACF del viento es casi la de los episodios: la parte periódica es tan pequeña que apenas ondula la curva.
@@ Decisión
🔵 Un SARIMA estacional se justifica cuando la parte periódica es grande y estable. En el viento es estable pero pequeña: por eso la regresión armónica (un patrón fijo con pocos parámetros) funcionó tan bien como el SARIMA.
:::

:::pastilla verde | Aplicar · La oscilación básica: amplitud, frecuencia y fase | u3:oscilacion u3:demo-fase-regresion u3:guia-amplitud-fase {#u3-oscilacion}
Ajustar al viento una **oscilación** $A\cos(2\pi f t - \varphi)$ de frecuencia f = 1/24 por regresión: $y_t = \mu + a\cos(2\pi t/24) + b\sin(2\pi t/24) + e_t$, con $A = \sqrt{a^2 + b^2}$ y la fase $\varphi = \operatorname{atan2}(b, a)$. La fase dice a qué hora ocurre el máximo.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| f | 1/24 ciclos por hora | El ciclo diario. |
| armónico | f = 2/24 (12 h) | Para un perfil que no es una senoide pura. |
| hora del máximo | φ / (2π f) | Convierte la fase de radianes a horas. |
@@ Código
```python
tt_h = np.arange(len(y))
X_os = sm.add_constant(np.column_stack([np.cos(2 * np.pi * tt_h / 24), np.sin(2 * np.pi * tt_h / 24),
                                        np.cos(4 * np.pi * tt_h / 24), np.sin(4 * np.pi * tt_h / 24)]))
os_fit = sm.OLS(y.values, X_os).fit()
a1, b1, a2, b2 = os_fit.params[1:]
A24, fase24 = np.hypot(a1, b1), np.arctan2(b1, a1)
A12 = np.hypot(a2, b2)
print(f"Ciclo de 24 h: A = {A24:.3f} m/s, fase {fase24:.3f} rad → máximo a las {(fase24 / (2 * np.pi / 24)) % 24:.1f} h")
print(f"Armónico de 12 h: A = {A12:.3f} m/s")
print(f"R² de la regresión: {os_fit.rsquared:.4f} (la parte del viento que explica el ciclo diario)")
```
@@ Resultado
```python oculto
hh24 = np.arange(24)
ajuste24 = os_fit.params[0] + a1 * np.cos(2 * np.pi * hh24 / 24) + b1 * np.sin(2 * np.pi * hh24 / 24)
ajuste_ambos = ajuste24 + a2 * np.cos(4 * np.pi * hh24 / 24) + b2 * np.sin(4 * np.pi * hh24 / 24)
grafica("u3-oscilacion", [puntos(hh24, media_h.values, "media de cada hora", "osc", 9), linea(hh24, ajuste24, "oscilación de 24 h", "rosa", 2.4),
                          linea(hh24, ajuste_ambos, "24 h + 12 h", "lav", 2.4, "dash")],
        alto=280, title={"text": "El perfil diario y las oscilaciones ajustadas"}, xaxis={"title": {"text": "hora del día"}, "dtick": 3},
        yaxis={"title": {"text": "m/s"}})
```
@widget lab-graf id=u3-oscilacion
@@ Lectura
- La oscilación de 24 horas tiene amplitud **A = {{=A24|.2f}} m/s** y su máximo a las **{{=(fase24 / (2 * np.pi / 24)) % 24|.0f}} h**: el viento sube por la tarde.
- El armónico de 12 horas ({{=A12|.2f}} m/s) corrige la forma: el perfil diario no es una senoide pura, sube rápido en la mañana y baja más despacio.
- Las dos oscilaciones juntas explican apenas el {{=100 * os_fit.rsquared|.1f}}% de la varianza del viento.
@@ Decisión
✅ La regresión sobre senos y cosenos es la herramienta básica de la Unidad III, y es la misma que se usó como exógena en la Unidad II.
:::

:::pastilla amarillo | Aplicar · El límite de Nyquist y el alias | u3:nyquist u3:demo-alias u3:w-aliasing {#u3-nyquist}
Ver el **alias**: si se muestrea una oscilación más despacio que dos veces por periodo, aparece como otra oscilación más lenta. Se toma el patrón diario de STL (periodo 24 h) y se "mide" cada 25 horas: el ciclo diario parece tener un periodo de 25 **días**.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| muestreo | cada 25 horas | Más lento que el límite de Nyquist del ciclo diario (cada 12 h). |
| frecuencia aparente | \|f − k/Δ\| con k entero | f = 1/24 por hora, Δ = 25 h. |
| Nyquist | 1 / (2Δ) | La frecuencia más alta que se ve con muestreo Δ. |
@@ Código
```python
patron = stl_s[999].seasonal
cada25 = patron.iloc[::25]
f_real = 1 / 24
f_alias = abs(f_real - round(f_real * 25) / 25)
print(f"Nyquist con datos horarios: {1 / 2:.2f} ciclos/hora (periodo mínimo 2 h) | con datos cada 25 h: {1 / 50:.3f} ciclos/hora")
print(f"Frecuencia aparente del ciclo diario muestreado cada 25 h: {f_alias:.5f} ciclos/hora → periodo {1 / f_alias:.0f} h = {1 / f_alias / 24:.0f} días")
print(f"Muestras por ciclo aparente: {1 / f_alias / 25:.0f}")
```
@@ Resultado
```python oculto
vent_a = slice("2019-03-01", "2019-04-30")
pa = patron[vent_a]
pa25 = pa.iloc[::25]
grafica("u3-nyquist", [linea(pa.index, pa.round(3), "patrón diario (horario)", "gris", 0.8), linea(pa25.index, pa25.round(3), "el mismo, medido cada 25 h", "rosa", 2.6, mode="lines+markers")],
        alto=280, title={"text": "El alias: un ciclo de 24 h medido cada 25 h parece de 25 días"}, yaxis={"title": {"text": "m/s"}})
```
@widget lab-graf id=u3-nyquist
@@ Lectura
- Con datos horarios, la frecuencia más alta que se puede ver es 0.5 ciclos por hora (un periodo de 2 horas): el ciclo diario está muy por debajo de ese límite.
- Medido cada 25 horas, el límite baja a 0.02 ciclos por hora (periodo de 50 horas) y el ciclo diario queda arriba: aparece como una oscilación **falsa** de {{=1 / f_alias / 24|.0f}} días, que en la gráfica se ve como una onda lenta.
@@ Decisión
🟡 Si los datos se registraran una vez al día a una hora que se corre poco a poco, el ciclo diario se disfrazaría de un ciclo de semanas. La frecuencia de muestreo decide qué escalas se pueden estudiar.
:::

:::pastilla verde | Aplicar · Unidades de frecuencia | u3:unidades-frecuencia u3:guia-conversiones {#u3-unidades}
Escribir las escalas del viento en las **tres convenciones** de frecuencia: ciclos por hora (la de `scipy`), radianes por hora (ω = 2πf, la de las fórmulas) y el **periodo** (1/f). Cada biblioteca usa una distinta; confundirlas es un error frecuente.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| escalas | 8 h, 12 h, 1 día, 3 días, 1 semana, 1 mes | Las del viento. |
| frecuencias de Fourier | k / n con n = 8,760 | Las que aparecen en el periodograma. |
@@ Código
```python
ESCALAS_F = {"8 horas": 8, "12 horas": 12, "1 día": 24, "3 días": 72, "1 semana": 168, "1 mes": 720}
filas_u = []
for k, P in ESCALAS_F.items():
    f = 1 / P
    filas_u.append({"escala": k, "periodo (h)": P, "f (ciclos/hora)": f, "ω (rad/hora)": 2 * np.pi * f, "f (ciclos/día)": 24 * f, "índice de Fourier k": len(y) * f})
tab_unid = pd.DataFrame(filas_u).set_index("escala")
print(tab_unid.round(5).to_string())
print(f"\nResolución en frecuencia: 1/n = {1 / len(y):.6f} ciclos/hora (frecuencias vecinas de periodos {len(y) / 365:.0f} y {len(y) / 366:.2f} h cerca de 24 h)")
```
@@ Resultado
```python oculto
tabla("u3-unidades", ["escala", "periodo (h)", "f (ciclos/hora)", "ω (rad/hora)", "f (ciclos/día)", "k de Fourier"],
      [[k, f"{r['periodo (h)']:.0f}", f"{r['f (ciclos/hora)']:.5f}", f"{r['ω (rad/hora)']:.4f}", f"{r['f (ciclos/día)']:.3f}", f"{r['índice de Fourier k']:.1f}"] for k, r in tab_unid.iterrows()],
      titulo="Las escalas del viento en tres convenciones de frecuencia")
```
@widget lab-tabla id=u3-unidades
@@ Lectura
- El ciclo diario tiene f = 1/24 ≈ 0.0417 ciclos por hora, ω ≈ 0.262 radianes por hora y cae en el **índice k = 365** de la transformada de Fourier (365 ciclos en el año).
- Una semana tiene k ≈ 52 y un mes, k ≈ 12: las escalas de días ocupan las frecuencias más bajas del periodograma.
- Las frecuencias de Fourier vecinas del ciclo diario corresponden a periodos de 24.07 y 23.93 horas: con un año de datos, la resolución es muy fina.
@@ Decisión
✅ En lo que sigue las gráficas usan el **periodo** en horas (más fácil de leer) y el código, los ciclos por hora (los de `scipy`).
:::

:::pastilla verde | Aplicar · El viento como suma de oscilaciones | u3:suma-oscilaciones u3:dos-lenguajes u3:w-mezcla {#u3-suma}
Reconstruir el viento con **solo las oscilaciones más fuertes** de su transformada de Fourier. Si con pocas se recupera casi todo, el viento vive en pocas frecuencias. Mueve el control para cambiar cuántas se usan.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `np.fft.rfft` | 4,381 frecuencias | Todas las de Fourier de 8,760 datos. |
| oscilaciones | las 5, 20, 100, 400 y 1,500 de mayor potencia | De muy pocas a muchas. |
| varianza explicada | potencia retenida / potencia total | Por Parseval, es la varianza que reproducen. |
@@ Código
```python
Y_fft = np.fft.rfft(y.values - y.mean())
potencia = np.abs(Y_fft) ** 2
orden_p = np.argsort(potencia)[::-1]
K_OSC = [5, 20, 100, 400, 1500]
reconst, var_exp = {}, {}
for k in K_OSC:
    Yk = np.zeros_like(Y_fft)
    Yk[orden_p[:k]] = Y_fft[orden_p[:k]]
    reconst[k] = pd.Series(np.fft.irfft(Yk, n=len(y)) + y.mean(), index=y.index)
    var_exp[k] = potencia[orden_p[:k]].sum() / potencia.sum()
    print(f"{k:>5} oscilaciones: {var_exp[k]:.1%} de la varianza")
per_top = len(y) / orden_p[:8]
print("Periodos de las 8 más fuertes (horas):", np.round(per_top, 0))
```
@@ Resultado
```python oculto
mzs = slice("2019-03-04", "2019-03-17")
control("u3-suma", [{"etiqueta": "Oscilaciones", "textos": [f"{k:,}" for k in K_OSC], "inicial": 2}],
        [[linea(reconst[k][mzs].index, reconst[k][mzs].round(2), f"suma de {k} oscilaciones", "rosa", 2.4)] for k in K_OSC],
        base=[linea(y[mzs].index, y[mzs].round(2), "viento", "gris", 1.2)],
        textos=[f"Con {k:,} de 4,381 oscilaciones se reproduce el <b>{100 * var_exp[k]:.0f}%</b> de la varianza." for k in K_OSC],
        alto=290, title={"text": "El viento reconstruido con sus oscilaciones más fuertes (dos semanas de marzo)"}, yaxis={"title": {"text": "m/s"}})
```
@widget lab-control id=u3-suma
@@ Lectura
- Con solo **5 oscilaciones** (de 4,381) se reproduce el {{=100 * var_exp[5]|.0f}}% de la varianza, y con 100 el {{=100 * var_exp[100]|.0f}}%: son oscilaciones lentas que dibujan la temporada y los episodios.
- Las más fuertes tienen periodos de **días a meses** (de {{=per_top.min()|.0f}} a {{=per_top.max()|.0f}} horas). Ninguna de las 8 primeras es el ciclo diario.
- Para reproducir los cambios de hora a hora hacen falta cientos de oscilaciones más, cada una con poca potencia.
@@ Decisión
✅ El viento es casi todo **baja frecuencia**. El dominio de la frecuencia lo dice con una sola frase: la varianza está en los periodos largos.
:::

:::pastilla azul | Aplicar · La misma memoria en dos idiomas: de la ACF al espectro | u3:misma-memoria u3:acf-a-espectro u3:w-fourier-acf {#u3-memoria}
Calcular el espectro como la **transformada de Fourier de la ACF**: $f(\omega) = \frac{\gamma_0}{2\pi}\left(1 + 2\sum_{k\ge1}\rho_k \cos(\omega k)\right)$. La ACF y el espectro contienen la misma información: la memoria de la serie vista como rezagos o como frecuencias.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| rezagos | hasta 720 | Un mes de ACF. |
| ventana | Bartlett (1 − k/720) | Sin ventana la suma da valores negativos (es el estimador de Blackman–Tukey). |
| frecuencias | 1/1000 a 1/2 ciclos por hora | De 42 días a 2 horas. |
@@ Código
```python
Mbt = 720
lagw = 1 - np.arange(1, Mbt + 1) / Mbt
f_bt = np.linspace(1 / 1000, 0.5, 1200)
gam0 = y.var()
esp_bt = gam0 / (2 * np.pi) * (1 + 2 * (np.cos(2 * np.pi * np.outer(f_bt, np.arange(1, Mbt + 1))) @ (lagw * r_720[1:Mbt + 1])))
i24 = np.argmin(np.abs(f_bt - 1 / 24))
print(f"Espectro de Blackman–Tukey: en 1/24 vale {esp_bt[i24]:.3f}; en 1/20 y 1/28: {esp_bt[np.argmin(np.abs(f_bt - 1 / 20))]:.3f} y {esp_bt[np.argmin(np.abs(f_bt - 1 / 28))]:.3f}")
print(f"Más alto en la frecuencia más baja: {esp_bt[0]:.1f}, {esp_bt[0] / np.median(esp_bt):.0f} veces la mediana")
print(f"¿Valores negativos? {(esp_bt < 0).sum()}")
```
@@ Resultado
```python oculto
def marcas_periodo(periodos, lo, hi):
    """Líneas verticales como trazas (funcionan en ejes logarítmicos)."""
    return [linea([P, P], [lo, hi], f"{P} h", "rosa", 1, "dot", showlegend=False, hoverinfo="skip") for P in periodos]

grafica("u3-memoria", [linea((1 / f_bt).round(2), esp_bt.round(5), "espectro desde la ACF", "lav", 2.2)] + marcas_periodo([24, 12], esp_bt.min(), esp_bt.max()),
        alto=290, showlegend=False, title={"text": "El espectro calculado a partir de la ACF (líneas: 24 y 12 h)"},
        xaxis={"title": {"text": "periodo (horas, escala log)"}, "type": "log", "autorange": "reversed"},
        yaxis={"title": {"text": "densidad espectral (escala log)"}, "type": "log"})
```
@widget lab-graf id=u3-memoria
@@ Lectura
- El espectro calculado desde la ACF es altísimo en las **frecuencias bajas** ({{=esp_bt[0] / np.median(esp_bt)|.0f}} veces la mediana) y cae al subir la frecuencia: un espectro "rojo", el de una serie muy persistente.
- Tiene un **pico** en 24 horas ({{=esp_bt[i24]|.1f}}, contra {{=esp_bt[np.argmin(np.abs(f_bt - 1 / 20))]|.1f}} en 20 h) y otro menor en 12: el ciclo diario y su armónico.
- La ventana de Bartlett evita valores negativos: sin ella, la suma de la ACF muestral puede dar "densidades" negativas.
@@ Decisión
🔵 La ACF que decae despacio (Unidad I) y el espectro rojo con un pico en 24 h (Unidad III) dicen lo mismo. El periodograma lo calcula directamente desde los datos.
:::
