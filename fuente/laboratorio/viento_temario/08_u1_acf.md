## 🔗 Unidad I · ACF, PACF y Ljung–Box {#u1-acf}
@mapa El correlograma con las bandas de Bartlett, la tabla numérica de `acf`, la PACF, los efectos directos e indirectos, los patrones de la serie y de sus diferencias, la ACF por temporada, la prueba de Ljung–Box y el resumen de la Unidad I.

:::pastilla verde | Aplicar · El correlograma y las bandas de Bartlett | u1:correlograma u1:bartlett {#u1-correlograma}
Dibujar la **ACF** con las bandas que dibuja `plot_acf`: las de **Bartlett**, que se ensanchan con el rezago porque suponen que las autocorrelaciones anteriores son reales. Mueve el control para ver la ACF a distintos alcances.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `acf(…, alpha=0.05)` | intervalos de Bartlett al 95% | La banda de `plot_acf`. |
| ±1.96/√n | banda para ruido blanco | La de la definición: no se ensancha. |
| alcance | 48 horas, 7 días y 30 días | De la memoria corta a la de semanas. |
@@ Código
```python
r_720, conf_720 = acf(y, nlags=720, alpha=0.05, fft=True)
banda_bart = conf_720[:, 1] - r_720
primer_cero = next((k for k in range(1, 721) if r_720[k] < 0), None)
dentro_rb = int(np.argmax(np.abs(r_720) < 1.96 / np.sqrt(len(y))))
dentro_bart = int(np.argmax(np.abs(r_720[1:]) < banda_bart[1:])) + 1
print(f"Banda para ruido blanco: ±{1.96 / np.sqrt(len(y)):.4f} | banda de Bartlett a 24 h: ±{banda_bart[24]:.3f}, a 168 h: ±{banda_bart[168]:.3f}")
print(f"La ACF entra a la banda de ruido blanco en el rezago {dentro_rb} | a la de Bartlett en el {dentro_bart} | primer valor negativo: {primer_cero if primer_cero else 'ninguno hasta 720'}")
print("r_k en 1, 6, 12, 24, 48, 168 h:", np.round(r_720[[1, 6, 12, 24, 48, 168]], 3))
```
@@ Resultado
```python oculto
def _corr_bart(k_max):
    k = list(range(1, k_max + 1))
    return [{"x": k + k[::-1], "y": _vals(np.concatenate([banda_bart[1:k_max + 1], -banda_bart[1:k_max + 1][::-1]]), 4), "fill": "toself",
             "fillcolor": "rgba(124,105,214,.14)", "line": {"color": "rgba(0,0,0,0)"}, "name": "banda de Bartlett", "hoverinfo": "skip"},
            {"type": "bar", "x": k, "y": _vals(r_720[1:k_max + 1]), "name": "ACF", "marker": {"color": PALETA["lav"]},
             "hovertemplate": "k = %{x}<br>%{y:.3f}<extra></extra>"}]
control("u1-correlograma", [{"etiqueta": "Alcance", "tipo": "seg", "textos": ["48 horas", "7 días", "30 días"], "inicial": 1}],
        [_corr_bart(48), _corr_bart(168), _corr_bart(720)], alto=300, showlegend=False,
        title={"text": "ACF del viento horario con la banda de Bartlett"}, xaxis={"title": {"text": "rezago (horas)"}}, yaxis={"range": [-0.15, 1]},
        lv=[{"xaxis": {"dtick": 6}}, {"xaxis": {"dtick": 24}}, {"xaxis": {"dtick": 168}}])
```
@widget lab-control id=u1-correlograma
@@ Lectura
- La ACF **decae muy despacio**: {{=r_720[1]|.2f}} a una hora, {{=r_720[24]|.2f}} a un día, {{=r_720[48]|.2f}} a dos días y todavía {{=r_720[168]|.2f}} a una semana. No se vuelve negativa en todo el mes.
- Entra a la banda de ruido blanco (±{{=1.96 / np.sqrt(len(y))|.3f}}) recién en el rezago {{=dentro_rb}}, unos {{=dentro_rb / 24|.0f}} días. La banda de Bartlett, que se ensancha, la alcanza antes (rezago {{=dentro_bart}}).
- No hay un pico claro en 24, 48 o 72: el ciclo diario apenas se nota como una ligera ondulación.
@@ Decisión
✅ La memoria del viento es **larga**: la ACF de un AR(1) habría caído a la banda en pocos días. Es la huella de los episodios.
:::

:::pastilla verde | Aplicar · La tabla numérica de `acf` con `qstat` | u1:sim-acftabla u1:lb-formula {#u1-acf-tabla}
Pedir a `acf` los números además de la gráfica: la autocorrelación, su intervalo y, con `qstat=True`, el estadístico **Q de Ljung–Box** acumulado hasta cada rezago con su p-value.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `qstat=True` | Q y p-value | Ljung–Box para todos los rezagos a la vez. |
| `alpha=0.05` | intervalos al 95% | Los mismos de la gráfica. |
@@ Código
```python
r_q, conf_q, Q_q, p_q = acf(y, nlags=48, alpha=0.05, qstat=True, fft=True)
REZ_T = [1, 2, 3, 6, 12, 24, 48]
tab_acf = pd.DataFrame({"r_k": r_q[REZ_T], "banda": (conf_q[:, 1] - r_q)[REZ_T], "Q": Q_q[[k - 1 for k in REZ_T]], "p-value": p_q[[k - 1 for k in REZ_T]]}, index=REZ_T)
print(tab_acf.round(4).to_string())
```
@@ Resultado
```python oculto
tabla("u1-acf-tabla", ["rezago k", "r_k", "± banda de Bartlett", "Q de Ljung–Box", "p-value"],
      [[k, f"{r['r_k']:.3f}", f"{r['banda']:.3f}", f"{r['Q']:,.0f}", f"{r['p-value']:.1e}"] for k, r in tab_acf.iterrows()],
      titulo="La salida numérica de acf(y, nlags=48, alpha=0.05, qstat=True)")
```
@widget lab-tabla id=u1-acf-tabla
@@ Lectura
- Todas las autocorrelaciones de la tabla están muy fuera de su banda: incluso r<sub>48</sub> = {{=tab_acf.loc[48, 'r_k']|.3f}} contra una banda de ±{{=tab_acf.loc[48, 'banda']|.3f}}.
- El estadístico Q acumulado crece sin parar (a 48 rezagos vale {{=tab_acf.loc[48, 'Q']|,.0f}}) y el p-value es prácticamente cero desde el primer rezago.
@@ Decisión
✅ El viento **no es ruido blanco** por ningún criterio: un modelo tiene mucho que aprovechar.
:::

:::pastilla verde | Aplicar · La PACF | u1:pacf {#u1-pacf}
Calcular la **autocorrelación parcial**: la correlación entre y<sub>t</sub> y y<sub>t−k</sub> **después de quitar** el efecto de los rezagos intermedios. Donde la ACF se mantiene alta por efectos encadenados, la PACF muestra solo lo que aporta cada rezago por sí mismo.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `pacf(…, nlags=72)` | 3 días | Suficiente para ver si hay picos en 24 y 48. |
| método | Yule–Walker ajustado (el de omisión) | El de `plot_pacf`. |
| banda | ±1.96/√n | La de la PACF para ruido blanco. |
@@ Código
```python
from statsmodels.tsa.stattools import pacf
p_y = pacf(y, nlags=72)
banda_p = 1.96 / np.sqrt(len(y))
sig_p = [k for k in range(1, 73) if abs(p_y[k]) > banda_p]
print("PACF en los primeros 6 rezagos:", np.round(p_y[1:7], 3))
print(f"PACF en 23, 24 y 25: {np.round(p_y[23:26], 3)} | en 48: {p_y[48]:.3f}")
print(f"Rezagos fuera de la banda ±{banda_p:.3f}: {len(sig_p)} de 72 → {sig_p[:15]}…")
```
@@ Resultado
```python oculto
grafica("u1-pacf", correlograma(p_y, len(y), "PACF", 1, "menta"), alto=280, showlegend=False,
        title={"text": "PACF del viento horario"}, xaxis={"title": {"text": "rezago (horas)"}, "dtick": 6}, yaxis={"range": [-0.2, 1]})
```
@widget lab-graf id=u1-pacf
@@ Lectura
- La PACF tiene un valor enorme en el rezago 1 ({{=p_y[1]|.3f}}) y después casi todo es pequeño: en 2 vale {{=p_y[2]|.3f}} y en 3, {{=p_y[3]|.3f}}.
- Varios rezagos salen de la banda (por ejemplo 2, 3, 23, 24 y 25), pero con valores de 0.02 a 0.05: con 8,760 datos, la banda es tan angosta que detecta efectos diminutos.
- Alrededor de 24 horas los valores son **negativos** y pequeños.
@@ Decisión
✅ El patrón ACF que decae + PACF que se corta en 1 es el de un **AR(1)**, con unos pocos rezagos adicionales pequeños. Es el punto de partida de la Unidad II.
:::

:::pastilla azul | Aplicar · Efectos directos e indirectos | u1:indirectos {#u1-indirectos}
Explicar por qué la ACF del rezago 2 es tan alta: si y<sub>t</sub> depende de y<sub>t−1</sub> y y<sub>t−1</sub> de y<sub>t−2</sub>, entonces y<sub>t</sub> y y<sub>t−2</sub> se parecen **indirectamente**. En un AR(1) puro, r<sub>2</sub> = r<sub>1</sub>² y la parcial a 2 es cero.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| r<sub>1</sub>² | lo que explicaría solo el efecto indirecto | La predicción del AR(1). |
| φ<sub>22</sub> | PACF en el rezago 2 | El efecto directo que queda. |
@@ Código
```python
r1, r2 = r_720[1], r_720[2]
print(f"r_1 = {r1:.4f} | r_1² = {r1 ** 2:.4f} | r_2 = {r2:.4f}")
print(f"PACF a 2 con la fórmula (r_2 − r_1²) / (1 − r_1²) = {(r2 - r1 ** 2) / (1 - r1 ** 2):.4f} | con pacf: {p_y[2]:.4f}")
print(f"r_24 = {r_720[24]:.3f} contra r_1²⁴ = {r1 ** 24:.3f}")
```
@@ Lectura
- r<sub>1</sub>² = {{=r1 ** 2|.4f}} y r<sub>2</sub> = {{=r2|.4f}}: casi iguales. **Casi toda** la correlación a 2 horas es indirecta, a través de la hora intermedia.
- La fórmula de la PACF a 2 da {{=(r2 - r1 ** 2) / (1 - r1 ** 2)|.4f}}, igual que `pacf`: el efecto directo de hace 2 horas es mínimo y ligeramente negativo.
- A 24 horas la cosa cambia: r<sub>24</sub> = {{=r_720[24]|.3f}} es mayor que r<sub>1</sub>²⁴ = {{=r1 ** 24|.3f}}. Algo más que la cadena de una hora sostiene la memoria de un día.
@@ Decisión
🔵 A corto plazo el viento se comporta como un AR(1). A plazos de días tiene memoria adicional que un AR(1) no explica.
:::

:::pastilla verde | Aplicar · Patrones de la ACF y la PACF: la serie y sus diferencias | u1:patrones u1:correlograma {#u1-patrones}
Comparar la ACF y la PACF del viento y de sus diferencias, con la tabla de patrones de la Unidad I: un AR deja una ACF que decae y una PACF que se corta; un MA, al revés; un exceso de diferencias deja autocorrelaciones negativas. Mueve el control para cambiar de serie.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| series | y, ∇y, ∇<sub>24</sub>y y ∇∇<sub>24</sub>y | Las candidatas de la diferenciación. |
| rezagos | 1 a 72 | Tres días: deja ver 24 y 48. |
| arriba / abajo | ACF / PACF | Las dos gráficas que se leen juntas. |
@@ Código
```python
PATRONES = {k: (acf(s.dropna(), nlags=72, fft=True), pacf(s.dropna(), nlags=72)) for k, s in DIFS.items()}
for k, (ra, rp) in PATRONES.items():
    print(f"{k:>20}: ACF en 1, 24, 48 = {np.round(ra[[1, 24, 48]], 3)} | PACF en 1, 2, 24 = {np.round(rp[[1, 2, 24]], 3)}")
```
@@ Resultado
```python oculto
def _dos_paneles(ra, rp):
    a = correlograma(ra, len(y), "ACF", 1, "lav")
    p = [dict(t, xaxis="x2", yaxis="y2") for t in correlograma(rp, len(y), "PACF", 1, "menta")]
    return a + p
control("u1-patrones", [{"etiqueta": "Serie", "tipo": "seg", "textos": list(PATRONES), "inicial": 1}],
        [_dos_paneles(ra, rp) for ra, rp in PATRONES.values()], alto=420, showlegend=False,
        title={"text": "ACF (arriba) y PACF (abajo)"}, grid={"rows": 2, "columns": 1, "pattern": "independent"},
        xaxis={"dtick": 6}, xaxis2={"dtick": 6, "title": {"text": "rezago (horas)"}}, yaxis={"range": [-0.6, 1], "title": {"text": "ACF"}},
        yaxis2={"range": [-0.6, 1], "title": {"text": "PACF"}})
```
@widget lab-control id=u1-patrones
@@ Lectura
- **y**: ACF que decae lentamente y PACF que se corta en 1. Patrón AR(1) con memoria larga.
- **∇y**: casi todo dentro de la banda; quedan valores pequeños (PACF de {{=PATRONES['∇y'][1][2]|.3f}} en 2). Parecido al ruido, con algo de estructura.
- **∇<sub>24</sub>y**: ACF que decae y **negativa** en 24 ({{=PATRONES['∇₂₄y'][0][24]|.2f}}). La diferencia estacional no quita la persistencia y crea una correlación negativa en el periodo.
- **∇∇<sub>24</sub>y**: un pico de **{{=PATRONES['∇∇₂₄y'][0][24]|.2f}}** en el rezago 24, la firma de una diferencia estacional de más (un MA estacional con θ cercano a −1).
@@ Decisión
✅ La diferencia regular deja la serie más limpia. La estacional **sobra**: crea autocorrelaciones artificiales en 24. Con esto se descarta la diferencia estacional (D = 0) para la Unidad II.
:::

:::pastilla azul | Aplicar · La ACF en la temporada de nortes y en la de calma | u1:pruebas-varianza u1:correlograma {#u1-acf-tramos}
Calcular la ACF por separado en los meses de nortes y en los meses tranquilos. Si la memoria del viento cambia con la temporada, un solo modelo para todo el año será un promedio de dos comportamientos.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| nortes | enero, febrero, noviembre y diciembre | Los meses más ventosos. |
| calma | mayo a septiembre | Los meses con menos viento y más ciclo diario. |
| ACF por bloque | se calcula en cada mes y se promedia | Para no mezclar meses separados. |
@@ Código
```python
def acf_meses(meses, nl=72):
    return np.mean([acf(y[y.index.month == m], nlags=nl, fft=True) for m in meses], axis=0)

acf_nortes, acf_calma = acf_meses([1, 2, 11, 12]), acf_meses([5, 6, 7, 8, 9])
print(f"Nortes: r_1 = {acf_nortes[1]:.3f}, r_12 = {acf_nortes[12]:.3f}, r_24 = {acf_nortes[24]:.3f}, r_48 = {acf_nortes[48]:.3f}")
print(f"Calma:  r_1 = {acf_calma[1]:.3f}, r_12 = {acf_calma[12]:.3f}, r_24 = {acf_calma[24]:.3f}, r_48 = {acf_calma[48]:.3f}")
```
@@ Resultado
```python oculto
grafica("u1-acf-tramos", [linea(list(range(73)), acf_nortes, "meses de nortes", "osc", 2.6), linea(list(range(73)), acf_calma, "meses de calma", "menta", 2.6)],
        alto=280, title={"text": "ACF del viento según la temporada"}, xaxis={"title": {"text": "rezago (horas)"}, "dtick": 12}, yaxis={"title": {"text": "autocorrelación"}})
```
@widget lab-graf id=u1-acf-tramos
@@ Lectura
- A 1 hora la memoria es parecida en las dos temporadas ({{=acf_nortes[1]|.2f}} y {{=acf_calma[1]|.2f}}).
- A 24 horas es muy distinta: **{{=acf_nortes[24]|.2f}}** en los meses de nortes y **{{=acf_calma[24]|.2f}}** en los de calma. En calma el ciclo diario hace que el viento de mañana a la misma hora se parezca al de hoy; en los nortes, lo que dura es el episodio, que puede terminar de un día a otro.
- A 48 horas, en los nortes ya no queda nada ({{=acf_nortes[48]|.2f}}), mientras que en calma sigue en {{=acf_calma[48]|.2f}}.
@@ Decisión
🔵 La estructura de dependencia **cambia con la temporada**. La prueba (nortes) tiene menos memoria a 24 horas que la validación (agosto a octubre): pronosticar el día siguiente será más difícil en la prueba.
:::

:::pastilla verde | Aplicar · La prueba de Ljung–Box | u1:lb-formula u1:lb-h u1:sim-ljungbox {#u1-ljungbox}
Aplicar **Ljung–Box**, $Q = n(n+2)\sum_{k=1}^{h}\frac{r_k^2}{n-k}$, que prueba de una vez si las primeras h autocorrelaciones son cero ($H_0$: no hay autocorrelación hasta h). Se aplica al viento, a sus diferencias y al ruido blanco simulado.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `acorr_ljungbox(…, lags=[6, 24, 48])` | 6 horas, un día y dos días | Tres alcances. |
| comparación | ruido blanco simulado | Debe no rechazar. |
@@ Código
```python
from statsmodels.stats.diagnostic import acorr_ljungbox
SERIES_LB = {"viento": y, "∇y": y.diff().dropna(), "∇∇₂₄y": y.diff(24).diff().dropna(), "ruido blanco": ruido}
tab_lb = pd.concat({k: acorr_ljungbox(s, lags=[6, 24, 48]) for k, s in SERIES_LB.items()})
print(tab_lb.round(4).to_string())
yy = y.values - y.mean()
r_m = np.array([np.sum(yy[k:] * yy[:-k]) / np.sum(yy ** 2) for k in range(1, 7)])
Q_mano = len(y) * (len(y) + 2) * np.sum(r_m ** 2 / (len(y) - np.arange(1, 7)))
print(f"\nQ del viento con h = 6, a mano: {Q_mano:,.1f}")
```
@@ Resultado
```python oculto
tabla("u1-ljungbox", ["serie", "h", "Q", "p-value", "¿rechaza H₀?"],
      [[k, h, f"{r['lb_stat']:,.1f}", f"{r['lb_pvalue']:.2e}", "sí" if r["lb_pvalue"] < 0.05 else "no"] for (k, h), r in tab_lb.iterrows()],
      ["descartado" if r["lb_pvalue"] < 0.05 else "elegido" for _, r in tab_lb.iterrows()], titulo="Ljung–Box con h = 6, 24 y 48")
```
@widget lab-tabla id=u1-ljungbox
@@ Lectura
- El viento rechaza con valores de Q enormes ({{=tab_lb.loc[('viento', 6), 'lb_stat']|,.0f}} con h = 6). El cálculo a mano da lo mismo.
- **∇y** también rechaza (Q = {{=tab_lb.loc[('∇y', 24), 'lb_stat']|.0f}} con h = 24): sus autocorrelaciones son pequeñas, pero con 8,760 datos se detectan.
- **∇∇<sub>24</sub>y** rechaza con mucha más fuerza (Q = {{=tab_lb.loc[('∇∇₂₄y', 24), 'lb_stat']|,.0f}}) por el pico en 24 que creó la diferencia de más.
- El **ruido blanco** no rechaza en ningún h (p = {{=tab_lb.loc[('ruido blanco', 24), 'lb_pvalue']|.2f}} con h = 24), como debe ser.
@@ Decisión
✅ Ni el viento ni sus diferencias son ruido blanco. La prueba de Ljung–Box se usará en la Unidad II sobre los **residuos** de los modelos.
:::

:::pastilla amarillo | Aplicar · ¿Qué h usar? Ljung–Box de ∇y según el horizonte | u1:lb-h {#u1-lb-h}
Calcular el p-value de Ljung–Box de ∇y para h de 1 a 72. La elección de h cambia la conclusión: con h chico solo se revisan los primeros rezagos y con h grande se diluyen los que importan.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| h | 1 a 72 | De una hora a tres días. |
| reglas comunes | h = 10, h = 2s = 48, h = ln n ≈ 9 | Las que se ven en la literatura. |
@@ Código
```python
lb_h = acorr_ljungbox(y.diff().dropna(), lags=list(range(1, 73)))
print(lb_h.loc[[1, 2, 3, 6, 9, 10, 12, 24, 48, 72]].round(4).to_string())
print(f"\nPrimer h con p < 0.05: {int(lb_h.index[lb_h['lb_pvalue'] < 0.05][0])}")
```
@@ Resultado
```python oculto
grafica("u1-lb-h", [linea(lb_h.index, lb_h["lb_pvalue"].clip(lower=1e-12), "p-value de Ljung–Box", "lav", 2.4, mode="lines+markers", marker={"size": 4})],
        alto=270, showlegend=False, title={"text": "Ljung–Box de ∇y según h"}, xaxis={"title": {"text": "h (rezagos incluidos)"}, "dtick": 6},
        yaxis={"title": {"text": "p-value (escala log)"}, "type": "log"}, shapes=[hline(0.05, "rojo", "dash")])
```
@widget lab-graf id=u1-lb-h
@@ Lectura
- Con **h = 1** Ljung–Box **no rechaza** (p = {{=lb_h.loc[1, 'lb_pvalue']|.2f}}): r<sub>1</sub> de ∇y es casi cero.
- Desde **h = 2** rechaza siempre, porque r<sub>2</sub> = {{=PATRONES['∇y'][0][2]|.3f}} ya es significativo con este tamaño de muestra.
@@ Decisión
🟡 La elección de h cambia la conclusión: con h = 1 se diría que ∇y es ruido blanco, y no lo es. Para series horarias con posible ciclo diario conviene usar h de al menos 24.
:::

:::pastilla verde | Aplicar · Lo que respondió la Unidad I | u1:formulario {#u1-resumen}
Responder las preguntas de la exploración que le tocaban a la Unidad I y dejar escrito lo que la Unidad II debe atender.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| preguntas | P1 a P4 | Las de la Unidad I. |
@@ Código
```python
RESP_U1 = [
    ("P1 · ¿Hay estacionalidad diaria?", f"Sí, de periodo 24, aditiva y débil: F_S entre {max(0, 1 - stl_s[999].resid.var() / (stl_s[999].seasonal + stl_s[999].resid).var()):.2f} y {F_S:.2f} según la ventana; más fuerte de abril a septiembre."),
    ("P2 · ¿Cambia el nivel? ¿Hay tendencia?", f"El nivel cambia con la temporada (ruptura el {fecha_larga(fecha_za)}); no hay tendencia monótona (Mann–Kendall p = {tab_mk.loc['diaria', 'p-value']:.2f})."),
    ("P3 · ¿La variabilidad cambia?", "Sí: crece con el nivel y cambia por mes (Levene y Breusch–Pagan rechazan)."),
    ("P4 · ¿Cuánta memoria tiene?", f"Mucha: r_1 = {r_720[1]:.2f}, r_24 = {r_720[24]:.2f}; la ACF tarda {dentro_rb} horas en entrar a la banda. ADF rechaza la raíz unitaria; KPSS rechaza la estacionariedad."),
]
for p, r in RESP_U1:
    print(f"{p}\n   {r}")
```
@@ Resultado
```python oculto
tabla("u1-resumen", ["pregunta", "respuesta de la Unidad I"], [list(f) for f in RESP_U1], titulo="Lo que se sabe del viento al terminar la Unidad I")
```
@widget lab-tabla id=u1-resumen
@@ Lectura
- La estacionalidad diaria **existe pero es débil**, y es aditiva.
- El nivel **cambia con la temporada**, con un cambio fuerte a fines de octubre; no hay tendencia.
- La varianza **crece con el nivel** y cambia por mes.
- La serie tiene **memoria larga**, sin raíz unitaria según ADF, pero no es estacionaria alrededor de una media fija según KPSS. La diferencia estacional sobra.
@@ Decisión
✅ Con este diagnóstico empieza la Unidad II. Primero se fija el piso con los **modelos de referencia**, y luego se prueba cuánto mejoran los AR y los MA.
:::
