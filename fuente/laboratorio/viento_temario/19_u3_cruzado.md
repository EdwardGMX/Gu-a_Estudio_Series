## 🔗 Unidad III · Espectro cruzado y retrasos {#u3-cruzado}
@mapa La coherencia y la fase entre dos turbinas, por qué la coherencia cruda siempre vale 1, el viento y la temperatura en frecuencia, la correlación cruzada con preblanqueo y la regresión con retraso.

:::pastilla verde | Aplicar · Coherencia y fase entre MV01 y MV02 | u3:cov-cruzada u3:mag-fase-coh u3:sim-coherence {#u3-coherencia}
Medir en qué escalas de tiempo se parecen el viento de **MV01** y el de su vecina **MV02** con la **coherencia** (una correlación al cuadrado por frecuencia, de 0 a 1) y la **fase** (el adelanto de una sobre la otra). Dos sensores del mismo viento deberían ser coherentes en las escalas lentas y diferir en las rápidas.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `signal.coherence(x, y, nperseg=720)` | segmentos de un mes | La coherencia necesita promediar segmentos. |
| `signal.csd` | espectro cruzado | Su ángulo es la fase. |
| MV02 | viento horario, huecos interpolados | El espectro necesita una serie sin huecos. |
@@ Código
```python
mv02 = vecina.interpolate(limit_direction="both").values
f_c, coh = signal.coherence(mv02, y.values, fs=1.0, nperseg=720, detrend="constant")
_, Pxy = signal.csd(mv02, y.values, fs=1.0, nperseg=720, detrend="constant")
fase_c = np.angle(Pxy)
f_c, coh, fase_c = f_c[1:], coh[1:], fase_c[1:]
per_c = 1 / f_c
for P in [240, 72, 24, 12, 6, 3]:
    i = np.argmin(np.abs(per_c - P))
    print(f"Periodo {P:>3} h: coherencia {coh[i]:.3f} | fase {fase_c[i]:+.3f} rad → retraso {fase_c[i] / (2 * np.pi * f_c[i]):+.2f} h")
P_media = per_c[np.argmax(coh < 0.5)] if (coh < 0.5).any() else np.nan
print(f"La coherencia baja de 0.5 en periodos de unas {P_media:.1f} horas")
```
@@ Resultado
```python oculto
grafica("u3-coherencia", [linea(per_c.round(2), coh.round(4), "coherencia MV01–MV02", "lav", 2.4, mode="lines+markers", marker={"size": 3})],
        alto=280, showlegend=False, title={"text": "Coherencia entre el viento de MV01 y el de MV02"},
        xaxis={"title": {"text": "periodo (horas)"}, "type": "log", "autorange": "reversed"}, yaxis={"title": {"text": "coherencia"}, "range": [0, 1.02]})
```
@widget lab-graf id=u3-coherencia
@@ Lectura
- La coherencia es casi **1** en todas las escalas lentas: {{=coh[np.argmin(np.abs(per_c - 240))]|.3f}} a diez días, {{=coh[np.argmin(np.abs(per_c - 24))]|.3f}} en el ciclo diario. Las dos turbinas miden el mismo viento.
- Baja en las escalas rápidas: {{=coh[np.argmin(np.abs(per_c - 6))]|.2f}} a 6 horas y {{=coh[np.argmin(np.abs(per_c - 3))]|.2f}} a 3. Por debajo de unas {{=P_media|.0f}} horas, lo que mide cada turbina es sobre todo turbulencia local.
- La fase es casi cero en todas las frecuencias: el viento llega a las dos al mismo tiempo (diferencias de minutos).
@@ Decisión
✅ El espectro cruzado separa lo común (las escalas de horas a semanas) de lo local (la turbulencia de pocas horas). Lo común es lo que se puede pronosticar con información del parque.
:::

:::pastilla rojo | Aplicar · La coherencia cruda siempre vale 1 | u3:coherencia-cruda u3:demo-coherencia-cruda {#u3-coh-cruda}
Calcular la coherencia **sin promediar** (un solo segmento con toda la serie). Con una sola "repetición", el cociente |f<sub>xy</sub>|² / (f<sub>x</sub> f<sub>y</sub>) es exactamente 1 en todas las frecuencias, aunque las series no tengan relación. Se comprueba con el viento contra un ruido blanco.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `nperseg=len(y)` | un segmento | Sin promediar. |
| pareja | viento de MV01 y el ruido blanco de la Unidad I | Sin ninguna relación real. |
@@ Código
```python
_, coh_cruda = signal.coherence(ruido.values, y.values, fs=1.0, nperseg=len(y), window="boxcar", detrend="constant")
_, coh_720 = signal.coherence(ruido.values, y.values, fs=1.0, nperseg=720, detrend="constant")
print(f"Coherencia cruda viento–ruido: de {coh_cruda[1:].min():.4f} a {coh_cruda[1:].max():.4f}")
print(f"Coherencia con segmentos de 720 h: media {coh_720[1:].mean():.3f} (con 23 segmentos se espera cerca de 1/23 = {1 / 23:.3f})")
```
@@ Lectura
- Sin promediar, la coherencia entre el viento y un **ruido blanco** sin ninguna relación vale **exactamente 1** en todas las frecuencias.
- Con segmentos de un mes (23 promedios) baja a {{=coh_720[1:].mean()|.3f}}, cerca de lo esperado para series independientes (1 entre el número de segmentos).
@@ Decisión
❌ La coherencia **cruda** no significa nada: siempre hay que suavizar o promediar segmentos, y comparar contra el nivel que daría el azar.
:::

:::pastilla azul | Aplicar · El viento y la temperatura en frecuencia | u3:w-cruzado u3:sim-retardo {#u3-temperatura}
Medir la coherencia entre el viento y la **temperatura ambiente**. En la exploración se vieron relacionadas a escala de días; en frecuencia se puede ver además si su ciclo diario está en fase o desfasado, y por cuántas horas.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| temperatura | horaria, centinelas interpolados | La de la pastilla de exógenas. |
| `nperseg=720` | un mes | Como en MV01–MV02. |
| desfase | fase / (2πf) | En horas; con `csd(temperatura, viento)`, positivo si el viento va adelante. |
@@ Código
```python
f_t, coh_t = signal.coherence(temp_h.values, y.values, fs=1.0, nperseg=720, detrend="constant")
_, Pty = signal.csd(temp_h.values, y.values, fs=1.0, nperseg=720, detrend="constant")
f_t, coh_t, fase_t = f_t[1:], coh_t[1:], np.angle(Pty[1:])
per_t = 1 / f_t
i24t = np.argmin(np.abs(per_t - 24))
print(f"Coherencia en 24 h: {coh_t[i24t]:.3f} | fase {fase_t[i24t]:+.3f} rad → retraso {fase_t[i24t] / (2 * np.pi / 24):+.2f} h")
print(f"Coherencia media en periodos de 3 a 30 días: {coh_t[(per_t > 72) & (per_t < 720)].mean():.3f} | de 2 a 12 h: {coh_t[(per_t > 2) & (per_t < 12)].mean():.3f}")
hora_max_temp = temp_h.groupby(temp_h.index.hour).mean().idxmax()
print(f"Hora de la temperatura máxima en promedio: {hora_max_temp} h | del viento máximo: {media_h.idxmax()} h")
```
@@ Resultado
```python oculto
grafica("u3-temperatura", [linea(per_t.round(2), coh_t.round(4), "coherencia viento–temperatura", "dur", 2.4, mode="lines+markers", marker={"size": 3})],
        alto=280, showlegend=False, title={"text": "Coherencia entre el viento y la temperatura"},
        xaxis={"title": {"text": "periodo (horas)"}, "type": "log", "autorange": "reversed"}, yaxis={"title": {"text": "coherencia"}, "range": [0, 1.02]})
```
@widget lab-graf id=u3-temperatura
@@ Lectura
- En el **ciclo diario** la coherencia entre el viento y la temperatura es alta ({{=coh_t[i24t]|.2f}}): los dos tienen un ciclo diario y está sincronizado.
- La fase indica que el viento va **{{=fase_t[i24t] / (2 * np.pi / 24)|.1f}} horas adelante**: su máximo es a las {{=media_h.idxmax()}} h y el de la temperatura a las {{=hora_max_temp}} h.
- Entre **3 y 30 días** la coherencia es moderada ({{=coh_t[(per_t > 72) & (per_t < 720)].mean()|.2f}}): los nortes traen aire frío, pero no siempre en la misma proporción. En las escalas de horas casi no hay relación.
@@ Decisión
🔵 Lo que la temperatura comparte con el viento es sobre todo el **ciclo diario**, y eso ya lo tiene la regresión armónica. Explica por qué la temperatura de ayer no ayudó como exógena en la Unidad II.
:::

:::pastilla verde | Aplicar · Correlación cruzada y preblanqueo | u3:ccf u3:demo-preblanqueo u3:guia-preblanqueo {#u3-ccf}
Buscar si una turbina **va adelante** de la otra con la **correlación cruzada** (CCF) entre MV02 y MV01. Con series tan persistentes la CCF cruda es ancha y no se ve el retraso; el **preblanqueo** filtra las dos series con el AR de una de ellas para quitar la autocorrelación, y deja ver el retraso real.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| filtro | AR(p) de MV02, con p de BIC | Lo deja como ruido blanco. |
| mismo filtro a MV01 | φ(L) aplicado a MV01 | Para no crear relaciones falsas. |
| rezagos | −12 a 12 horas | Positivo: MV02 va adelante. |
@@ Código
```python
from statsmodels.tsa.ar_model import ar_select_order
s02 = pd.Series(mv02, index=y.index)
orden_02 = ar_select_order(s02, maxlag=24, ic="bic").ar_lags
p02 = max(orden_02) if orden_02 else 1
fil = AutoReg(s02, lags=p02).fit()
phis02 = fil.params.iloc[1:].values
def preblanquear(s):
    v = s.values
    salida = v[p02:] - sum(phis02[j] * v[p02 - j - 1:len(v) - j - 1] for j in range(p02))
    return pd.Series(salida, index=s.index[p02:])

a02, a01 = preblanquear(s02), preblanquear(y)
REZ_C = list(range(-12, 13))
ccf_cruda = [s02.corr(y.shift(-k)) for k in REZ_C]
ccf_pb = [a02.corr(a01.shift(-k)) for k in REZ_C]
print(f"Filtro: AR({p02}) de MV02 | residuos con r₁ = {a02.autocorr(1):.3f}")
print(f"CCF cruda: máxima {max(ccf_cruda):.3f} en el rezago {REZ_C[int(np.argmax(ccf_cruda))]} | en ±6: {ccf_cruda[6]:.3f} y {ccf_cruda[18]:.3f}")
print(f"CCF preblanqueada: máxima {max(ccf_pb):.3f} en el rezago {REZ_C[int(np.argmax(ccf_pb))]} | en ±1: {ccf_pb[11]:.3f} y {ccf_pb[13]:.3f} | banda ±{2 / np.sqrt(len(a01)):.3f}")
```
@@ Resultado
```python oculto
control("u3-ccf", [{"etiqueta": "Serie", "tipo": "seg", "textos": ["cruda", "preblanqueada"], "inicial": 1}],
        [[barras(REZ_C, ccf_cruda, "CCF cruda", "gris")], [barras(REZ_C, ccf_pb, "CCF preblanqueada", "lav")]],
        alto=270, showlegend=False, title={"text": "Correlación cruzada entre MV02 (t − k) y MV01 (t)"}, xaxis={"title": {"text": "rezago k (horas)"}, "dtick": 2},
        yaxis={"range": [-0.2, 1.05]})
```
@widget lab-control id=u3-ccf
@@ Lectura
- La **CCF cruda** es enorme en todos los rezagos ({{=max(ccf_cruda)|.2f}} en 0 y todavía {{=ccf_cruda[6]|.2f}} a 6 horas): la persistencia de cada serie la ensancha y esconde cualquier retraso.
- El filtro fue un AR({{=p02}}) de MV02, que deja sus residuos como ruido blanco (r₁ = {{=a02.autocorr(1)|.3f}}).
- La **CCF preblanqueada** tiene un solo pico en el **rezago 0** ({{=max(ccf_pb)|.2f}}) y valores pequeños a ±1 hora ({{=ccf_pb[13]|.3f}} con MV02 adelante, {{=ccf_pb[11]|.3f}} con MV01 adelante).
@@ Decisión
✅ No hay retraso de horas entre turbinas: el viento cambia en todo el parque a la vez. Para pronosticar MV01, MV02 no da información **anticipada**; solo sirve como segunda medición del mismo momento.
:::

:::pastilla verde | Aplicar · Regresión con retraso y señal más ruido | u3:regresion-retraso u3:senal-ruido u3:wiener {#u3-retraso}
Escribir la relación entre turbinas como una **regresión con retraso** (MV01 sobre MV02 de la misma hora y de horas anteriores), y pensar las dos mediciones como **señal más ruido**: el viento "verdadero" del parque más el ruido de cada anemómetro. Promediar las dos turbinas reduce el ruido.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| retrasos | 0 a 3 horas de MV02 | La CCF preblanqueada no mostró más. |
| ruido | Var(MV01 − MV02) / 2 | Si los ruidos son independientes y de igual varianza. |
| señal | Var(MV01) − ruido | Lo común a las dos. |
@@ Código
```python
X_rr = pd.DataFrame({f"MV02 (t−{k})": s02.shift(k) for k in range(4)})
reg_rr = sm.OLS(y.values[3:], sm.add_constant(X_rr.values[3:])).fit()
print("Coeficientes:", {k: round(float(v), 4) for k, v in zip(["constante"] + list(X_rr.columns), reg_rr.params)})
print(f"R² = {reg_rr.rsquared:.4f}")
ok_sr = viento_h.notna() & vecina.notna()
dif_sr = (viento_h - vecina)[ok_sr]
var_ruido = dif_sr.var() / 2
var_senal = viento_h[ok_sr].var() - var_ruido
print(f"\nVarianza del ruido de un anemómetro: {var_ruido:.3f} | de la señal común: {var_senal:.2f} | razón señal/ruido {var_senal / var_ruido:.0f}")
print(f"Desviación del ruido: {np.sqrt(var_ruido):.2f} m/s (el error de imputar con la vecina era de unos {exp_imp['turbina vecina (MV02)'].mean():.2f})")
```
@@ Lectura
- En la regresión con retraso casi todo el peso está en la **misma hora** (coeficiente {{=reg_rr.params[1]|.3f}}) y un poco en la anterior ({{=reg_rr.params[2]|.3f}}); los rezagos de 2 y 3 horas valen cero. R² = {{=reg_rr.rsquared|.3f}}.
- Como **señal más ruido**: la varianza común es {{=var_senal|.1f}} y la del ruido de cada anemómetro {{=var_ruido|.2f}}, una razón señal/ruido de {{=var_senal / var_ruido|.0f}}. El ruido tiene una desviación de {{=np.sqrt(var_ruido)|.2f}} m/s, casi igual al error de imputar con la vecina.
@@ Decisión
✅ Cada anemómetro tiene un ruido de unos 0.4 m/s sobre la señal común del parque. El filtro de Wiener óptimo para estimar la señal sería casi el promedio de las dos turbinas; con una razón señal/ruido tan alta, cualquiera de las dos ya es una buena medición. Sigue la última sección: los **filtros**.
:::
