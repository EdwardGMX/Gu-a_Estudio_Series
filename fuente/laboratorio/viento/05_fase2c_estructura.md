## 🧩 Fase 2c · Componentes y estacionariedad (Unidad I) {#fase-estructura}
@mapa Descomponer la serie en tendencia, ciclo diario y residuo; medir la fuerza de cada componente; probar si hay un ciclo semanal; aplicar ADF y KPSS, entender por qué se contradicen y leer la ACF y la PACF para proponer órdenes.

:::pastilla amarillo | Aplicar · Descomposición clásica aditiva con periodo 24 | u1:descomposicion u1:aditivo u1:mm-centrada {#est-clasica}
Separar **tendencia**, **estacionalidad diaria** y **residuo** con la descomposición clásica, el método más simple: una media móvil centrada para la tendencia y el promedio por hora del día para la estacionalidad.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `z` | √y | La raíz volvió aditivo el comportamiento (la dispersión ya no depende del nivel). |
| `model="additive"` | aditiva | $z_t = T_t + S_t + R_t$. |
| `period=24` | un día | El ciclo que se busca. La media móvil de la tendencia abarca 24 horas. |
@@ Código
```python
from statsmodels.tsa.seasonal import seasonal_decompose

dec = seasonal_decompose(z, model="additive", period=24)
var_comp = pd.Series({"tendencia": dec.trend.var(), "estacionalidad (24 h)": dec.seasonal.var(), "residuo": dec.resid.var()})
print("Varianza de cada componente (escala √y):")
print(var_comp.round(4).to_string())
print(f"\nLa estacionalidad explica el {dec.seasonal.var() / z.var():.1%} de la varianza de √y")
print("Patrón diario estimado (24 valores), redondeado:")
print(dec.seasonal.iloc[:24].round(3).values)
```
@@ Resultado
```python oculto
sem2 = slice("2019-02-01", "2019-02-14")
grafica("est-clasica", [linea(z[sem2].index, z[sem2], "√y", "gris", 1.2),
                        linea(dec.trend[sem2].index, dec.trend[sem2], "tendencia (media móvil de 24 h)", "osc", 2.4),
                        linea(dec.seasonal[sem2].index, dec.seasonal[sem2] + z.mean(), "estacionalidad + media", "rosa", 1.6)],
        alto=300, title={"text": "Descomposición clásica (zoom: 1–14 de febrero)"}, yaxis={"title": {"text": "√(m/s)"}})
```
@widget lab-graf id=est-clasica
@@ Lectura
- La **estacionalidad diaria explica muy poco**: el {{=dec.seasonal.var() / z.var() * 100|.1f}}% de la varianza. Su patrón sube al mediodía y baja de noche, igual que el mapa de calor.
- La "tendencia" de la descomposición clásica es una media móvil de 24 horas, así que **sigue cada episodio de viento**: no es una tendencia de largo plazo sino el nivel de cada día. Se lleva la mayor parte de la varianza.
- La descomposición clásica impone **el mismo patrón diario todo el año**, pero el [[eda-diario|mapa de calor]] mostró que la amplitud cambia entre 1.5 y 3 m/s según el mes.
@@ Decisión
🟡 Sirve para una primera idea, pero su estacionalidad rígida no se ajusta a un ciclo que cambia con las estaciones. La **STL** permite que la estacionalidad evolucione y además es robusta a valores extremos.
:::

:::pastilla verde | Aplicar · STL robusta y la fuerza de cada componente | u1:stl u1:stl-robusto u1:fuerza {#est-stl}
Descomponer con **STL**, que deja que el patrón diario cambie poco a poco a lo largo del año, y medir con números qué tan fuertes son la tendencia y la estacionalidad.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `period=24` | un día | El ciclo diario. |
| `robust=True` | pesos robustos | Los episodios extremos no deforman el patrón diario. |
| $F_T = 1 - \frac{\operatorname{Var}(R)}{\operatorname{Var}(T + R)}$ | fuerza de la tendencia | Cerca de 1: la tendencia domina; cerca de 0: no hay. |
| $F_S = 1 - \frac{\operatorname{Var}(R)}{\operatorname{Var}(S + R)}$ | fuerza de la estacionalidad | Igual, para el ciclo diario. |
@@ Código
```python
from statsmodels.tsa.seasonal import STL

stl = STL(z, period=24, robust=True).fit()
F_T = max(0, 1 - stl.resid.var() / (stl.trend + stl.resid).var())
F_S = max(0, 1 - stl.resid.var() / (stl.seasonal + stl.resid).var())
print(f"Fuerza de la tendencia:       F_T = {F_T:.3f}")
print(f"Fuerza de la estacionalidad:  F_S = {F_S:.3f}")
amp_dia = stl.seasonal.resample("D").agg(lambda s: s.max() - s.min())       # amplitud de cada día
amp_mes = amp_dia.groupby(amp_dia.index.month).mean()
amp_mes.index = por_mes.index
print("\nAmplitud media del ciclo diario de STL, por mes (escala √y):")
print(amp_mes.round(2).to_string())
```
@@ Resultado
```python oculto
grafica("est-stl", [linea(amp_dia.index, amp_dia, "amplitud diaria de la estacionalidad STL", "rosa", 1.6),
                    linea(amp_dia.index, amp_dia.rolling(30, center=True).mean(), "media de 30 días", "osc", 2.6)],
        alto=280, title={"text": "La estacionalidad de STL cambia a lo largo del año"}, yaxis={"title": {"text": "máx − mín en el día (√(m/s))"}})
```
@widget lab-graf id=est-stl
@@ Lectura
- **F_T = {{=F_T|.2f}}**: la "tendencia" (el nivel que cambia de un día a otro) es el componente dominante.
- **F_S = {{=F_S|.2f}}**: el ciclo diario es **débil**. Por comparación, en AirPassengers la fuerza estacional pasa de 0.9.
- La amplitud del ciclo diario **cambia con el año**: de {{=amp_mes.min()|.2f}} en {{=amp_mes.idxmin()}} a {{=amp_mes.max()|.2f}} en {{=amp_mes.idxmax()}} (escala √y). STL lo captura; la descomposición clásica, con un solo patrón para todo el año, no podía.
@@ Decisión
✅ STL describe mejor la serie. Pero el resultado ya pone en duda la suposición **S4**: con un ciclo diario tan débil, repetir el día anterior (el ingenuo estacional de 24 h) difícilmente será una buena referencia. Antes de seguir, una pregunta común: ¿habrá también un ciclo **semanal**?
:::

:::pastilla rojo | Aplicar · MSTL: ¿hay un ciclo semanal? | u1:stl u1:est-vs-ciclo {#est-mstl}
Probar si el viento tiene un patrón de **7 días** además del diario, con **MSTL**, que estima varias estacionalidades a la vez. En las ventas o en la demanda eléctrica el ciclo semanal es real; en el viento no hay una razón física para él.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `periods=[24, 168]` | día y semana | Dos estacionalidades. |
| estabilidad | perfil semanal de enero–junio contra julio–diciembre | Un ciclo real se repite: los dos perfiles deberían parecerse. |
@@ Código
```python
from statsmodels.tsa.seasonal import MSTL

mstl = MSTL(z, periods=[24, 168]).fit()
semanal, diaria = mstl.seasonal["seasonal_168"], mstl.seasonal["seasonal_24"]
print(f"Varianza del componente semanal: {semanal.var():.4f} | del diario: {diaria.var():.4f}")

mitad = len(z) // 2
def estabilidad(comp, periodo):
    pos = np.arange(len(comp)) % periodo
    p1 = comp.iloc[:mitad].groupby(pos[:mitad]).mean()
    p2 = comp.iloc[mitad:].groupby(pos[mitad:]).mean()
    return np.corrcoef(p1, p2)[0, 1]
print(f"Correlación del perfil entre la primera y la segunda mitad del año:")
print(f"  diario (24 h):   {estabilidad(diaria, 24):.3f}")
print(f"  semanal (168 h): {estabilidad(semanal, 168):.3f}")
```
@@ Resultado
```python oculto
pos168 = np.arange(len(semanal)) % 168
p1s = semanal.iloc[:mitad].groupby(pos168[:mitad]).mean(); p2s = semanal.iloc[mitad:].groupby(pos168[mitad:]).mean()
grafica("est-mstl", [linea(list(range(168)), p1s, "enero–junio", "lav", 2.2), linea(list(range(168)), p2s, "julio–diciembre", "dur", 2.2)],
        alto=270, title={"text": "El «ciclo semanal» de MSTL en cada mitad del año"}, xaxis={"title": {"text": "hora de la semana"}, "dtick": 24},
        yaxis={"title": {"text": "√(m/s)"}})
```
@widget lab-graf id=est-mstl
@@ Lectura
- MSTL le asigna al componente semanal una varianza ({{=semanal.var()|.3f}}) **mayor** que al diario ({{=diaria.var()|.3f}}). Si se leyera solo ese número, parecería que el ciclo semanal es más importante.
- Pero el perfil semanal **no se repite**: su correlación entre las dos mitades del año es {{=estabilidad(semanal, 168)|.2f}}; en la gráfica, las dos curvas suben y bajan en momentos distintos. El diario, en cambio, se repite casi idéntico ({{=estabilidad(diaria, 24)|.2f}}).
- Lo que MSTL llamó "semanal" son los **episodios sinópticos** de 3 a 7 días: como duran parecido a una semana, el método los acomodó en un periodo de 168 horas.
@@ Decisión
❌ **No hay ciclo semanal.** Un método de descomposición siempre devuelve un componente para cada periodo que se le pide, exista o no; hay que comprobar que se repita. Se trabajará solo con el periodo de 24 horas. Ahora la pregunta central de la Unidad I: ¿es estacionaria la serie?
:::

:::pastilla amarillo | Aplicar · ADF y KPSS: se contradicen | u1:adf u1:kpss u1:tabla-hipotesis {#est-adf-kpss}
Aplicar las dos pruebas de estacionariedad, cuyas hipótesis nulas son opuestas. Si coinciden, la conclusión es firme; si se contradicen, hay que entender por qué antes de decidir. La suposición S5 es que basta la ADF.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `adfuller(…, autolag="AIC")` | rezagos por AIC | $H_0$: raíz unitaria. Rechazar es evidencia de estacionariedad. |
| `kpss(…, regression="c")` | nivel constante | $H_0$: estacionaria alrededor de una media fija. Rechazar es evidencia de no estacionariedad. |
| `nlags="auto"` | ancho de banda automático | Para la varianza de largo plazo de KPSS. |
@@ Código
```python
from statsmodels.tsa.stattools import adfuller, kpss

adf_z = adfuller(z, autolag="AIC")
kpss_z = kpss(z, regression="c", nlags="auto")
print(f"ADF:  estadístico = {adf_z[0]:.2f}, p-value = {adf_z[1]:.2e}, rezagos usados = {adf_z[2]}")
print(f"KPSS: estadístico = {kpss_z[0]:.3f}, p-value = {kpss_z[1]:.3f} (valor crítico al 5%: {kpss_z[3]['5%']})")
```
@@ Lectura
- **ADF rechaza** la raíz unitaria con muchísima fuerza (estadístico {{=adf_z[0]|.1f}}, p ≈ {{=adf_z[1]|.0e}}): el viento **regresa a su media**; no es un paseo aleatorio.
- **KPSS también rechaza** su nula (estadístico {{=kpss_z[0]|.2f}} contra un crítico de {{=kpss_z[3]['5%']}}; el p-value real es menor que 0.01, el mínimo de la tabla): según KPSS, la serie **no** es estacionaria alrededor de una media fija.
- Las dos pruebas no pueden tener razón a la vez en el sentido simple. Es el caso de la [[u1:tabla-hipotesis|tabla de hipótesis]] en que ambas rechazan.
@@ Decisión
🟡 No se puede decidir sin entender la contradicción. Cuando ambas rechazan, lo usual es que la serie **regrese a una media que cambia lentamente**: es estacionaria a corto plazo, pero su nivel se mueve con las estaciones. El siguiente paso lo comprueba.
:::

:::pastilla azul | Aplicar · Por qué se contradicen: memoria larga y un nivel que cambia con la estación | u1:acf-pacf u1:falsas-alarmas u1:especificaciones {#est-memoria}
Ver la ACF a muchos rezagos y la media de largo plazo para entender qué detecta cada prueba.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `acf(z, nlags=24*14)` | dos semanas | La ACF de un proceso estacionario simple cae a cero en pocos días. |
| ADF con rezagos fijos | 1, 24, 168 | Para ver si su conclusión depende de cuántos rezagos use. |
| `kpss(…, regression="ct")` | con tendencia | Por si el problema fuera una tendencia lineal. |
@@ Código
```python
from statsmodels.tsa.stattools import acf

acf_z = acf(z, nlags=24 * 14)
print("ACF de √y en algunos rezagos (horas: valor):")
print({k: round(float(acf_z[k]), 3) for k in [1, 6, 24, 48, 72, 168, 336]})
print("\nADF con rezagos fijos (rezagos: p-value):",
      {L: f"{adfuller(z, maxlag=L, autolag=None)[1]:.1e}" for L in (1, 24, 168)})
print(f"KPSS con tendencia: estadístico = {kpss(z, regression='ct', nlags='auto')[0]:.3f} (crítico al 5%: 0.146)")
nivel_30 = z.rolling(24 * 30, center=True).mean()
print(f"\nMedia de √y por trimestre: {z.groupby(z.index.quarter).mean().round(2).to_dict()}")
```
@@ Resultado
```python oculto
grafica("est-acf-larga", correlograma(acf_z[:24 * 14 + 1], len(z), "ACF de √y", 1, "lav"), alto=280,
        title={"text": "La ACF de √y a dos semanas"}, xaxis={"title": {"text": "rezago (horas)"}, "dtick": 24}, showlegend=False)
```
@widget lab-graf id=est-acf-larga
@@ Lectura
- La ACF baja rápido el primer día (de {{=acf_z[1]|.2f}} a {{=acf_z[24]|.2f}} en 24 horas) y luego **se estanca**: a los 7 días todavía vale {{=acf_z[168]|.2f}} y a los 14, {{=acf_z[336]|.2f}}. Esa cola larga es la huella de un **nivel que se mueve con las estaciones**: dos horas de la misma temporada se parecen aunque estén separadas por semanas.
- La ADF rechaza con cualquier número de rezagos: el regreso a la media a corto plazo es real y no depende de la especificación.
- KPSS con tendencia lineal también rechaza: el problema no es una recta, es un nivel que **sube y baja** (alto en invierno, bajo en mayo).
- **Las dos pruebas tienen razón, cada una a su escala**: ADF mira la dinámica de horas y días, donde el viento regresa a su nivel; KPSS mira todo el año, donde el nivel no es fijo.
@@ Decisión
Hay dos caminos para modelar: (1) **no diferenciar** y dejar que el modelo regrese a la media del entrenamiento, con el riesgo de que esa media no sea la de la temporada que se pronostica; (2) **diferenciar**, para que el modelo siga el nivel reciente. La suposición S5 apuesta por el primero. No se decidirá aquí: se probarán **los dos** en la [[cla-d0-d1|fase de modelos]]. El siguiente paso revisa qué diferenciación vuelve la serie estacionaria según ambas pruebas.
:::

:::pastilla verde | Aplicar · Diferenciación regular y estacional | u1:diferenciacion u2:diferenciar2 u2:sobrediferenciar {#est-diferencias}
Aplicar la diferencia regular ($\Delta z_t = z_t - z_{t-1}$), la estacional de 24 horas ($\Delta_{24} z_t = z_t - z_{t-24}$) y ambas, y ver cuál basta para que **ADF y KPSS coincidan**. Diferenciar de más también es un error, así que se elige la mínima.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `diff(1)` | regular | Quita el nivel que cambia. |
| `diff(24)` | estacional | Quita el ciclo diario y también el nivel. |
| varianza | de cada versión | Una diferencia de más **aumenta** la varianza (señal de sobrediferenciación). |
@@ Código
```python
versiones = {"z": z, "Δz": z.diff(), "Δ₂₄z": z.diff(24), "ΔΔ₂₄z": z.diff(24).diff()}
filas = []
for nombre, serie in versiones.items():
    s = serie.dropna()
    a, k = adfuller(s, autolag="AIC"), kpss(s, regression="c", nlags="auto")
    filas.append([nombre, f"{a[1]:.1e}", f"{k[0]:.3f}", "≥ 0.10" if k[1] >= 0.1 else f"{k[1]:.3f}", f"{s.var():.4f}"])
tab_dif = pd.DataFrame(filas, columns=["serie", "ADF p", "KPSS estadístico", "KPSS p", "varianza"]).set_index("serie")
print(tab_dif.to_string())
```
@@ Lectura
- Con **una diferencia regular** (Δz) las dos pruebas coinciden: ADF rechaza la raíz unitaria y KPSS ya no rechaza la estacionariedad (estadístico {{=tab_dif.loc['Δz', 'KPSS estadístico']}}).
- La diferencia estacional Δ₂₄ también lo logra, pero tiene una varianza **{{=float(tab_dif.loc['Δ₂₄z', 'varianza']) / float(tab_dif.loc['Δz', 'varianza'])|.1f}} veces mayor** que Δz: compara cada hora con la del día anterior, y en un día el viento cambia mucho más que en una hora.
- Aplicar las dos (ΔΔ₂₄) **sube** otra vez la varianza respecto a Δz: es **sobrediferenciar**.
@@ Decisión
✅ Si se diferencia, basta **d = 1, D = 0**. Las candidatas para la Fase 5 quedan así: modelos con **d = 0** (la serie en niveles, con media) y con **d = 1**. El siguiente paso lee la ACF y la PACF de ambas para proponer los órdenes $p$, $q$, $P$ y $Q$.
:::

:::pastilla verde | Aplicar · ACF y PACF de √y y de su diferencia | u1:acf-pacf u1:pacf u2:casos-identificacion u2:sarima {#est-acf}
Usar la ACF y la PACF para proponer órdenes de los modelos ARIMA y SARIMA: la PACF sugiere la parte AR y la ACF la parte MA; los rezagos 24 y 48 dicen si hace falta una parte estacional.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `nlags=50` | dos días | Para ver los rezagos 24 y 48. |
| banda | ±1.96/√n | Con n = 8,760 es ±0.021: casi cualquier valor es "significativo", así que importa el **tamaño**, no solo cruzar la banda. |
@@ Código
```python
from statsmodels.tsa.stattools import pacf

acf_n, pacf_n = acf(z, nlags=50), pacf(z, nlags=50)
dz = z.diff().dropna()
acf_d, pacf_d = acf(dz, nlags=50), pacf(dz, nlags=50)
print("√y   ACF:", np.round(acf_n[[1, 2, 3, 24, 48]], 3), "| PACF:", np.round(pacf_n[[1, 2, 3, 4, 24, 25]], 3))
print("Δ√y  ACF:", np.round(acf_d[[1, 2, 3, 24, 48]], 3), "| PACF:", np.round(pacf_d[[1, 2, 3, 4, 24, 25]], 3))
print(f"Banda: ±{1.96 / np.sqrt(len(z)):.3f}")
```
@@ Resultado
```python oculto
for nombre, val, tit in [("est-acf-n", acf_n, "ACF de √y"), ("est-pacf-n", pacf_n, "PACF de √y"),
                         ("est-acf-d", acf_d, "ACF de Δ√y"), ("est-pacf-d", pacf_d, "PACF de Δ√y")]:
    grafica(nombre, correlograma(val, len(z), tit, 1, "lav" if "acf" in nombre else "cel"), alto=230,
            title={"text": tit}, xaxis={"dtick": 6}, showlegend=False,
            yaxis={"range": [-0.15, 1] if nombre.endswith("-n") else [-0.12, 0.12]})
```
@widget lab-graf id=est-acf-n
@widget lab-graf id=est-pacf-n
@widget lab-graf id=est-acf-d
@widget lab-graf id=est-pacf-d
@@ Lectura
- **√y**: la ACF decae despacio y la **PACF se corta después del rezago 1** ({{=pacf_n[1]|.3f}}, y luego valores menores a 0.07). Es la firma de un **AR de orden bajo** con φ cercano a 1. Hay pequeños valores negativos en los rezagos 24 y 25 de la PACF: una parte estacional débil.
- **Δ√y**: casi ruido blanco. Lo más notorio es el rezago 2 ({{=acf_d[2]|.3f}}) y un pico en **24** ({{=acf_d[24]|.3f}}) que se repite en 48: el ciclo diario que queda después de diferenciar.
- Candidatos razonables: con d = 0, un **AR(1) a AR(3)** con una parte estacional $(1,0,1)_{24}$; con d = 1, un **ARIMA(0,1,2) o (2,1,0)** más algo estacional, o un ARMA(2,2).
@@ Decisión
✅ Los candidatos se compararán con **AIC y BIC** en la [[cla-orden|fase de modelos]]. Antes, la Unidad III: ¿qué dice el **espectro** sobre el ciclo diario y la escala de los episodios?
:::
