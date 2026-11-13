## 🎚️ Fase 8 · Filtros: separar el ciclo de la variación secular (Unidad III) {#fase-filtros}
@mapa Hodrick–Prescott con el λ "de manual" y con un λ calculado, Baxter–King para aislar la banda de 11 años, y las ganancias que explican por qué cada uno funcionó o no.

:::pastilla rojo | Aplicar · Hodrick–Prescott con λ = 6.25 (el valor típico para datos anuales) | u3:hp u3:filtros-economia
Separar la **variación de largo plazo** (la "tendencia" de HP) del ciclo de 11 años. Es la suposición **S6**: usar el λ que se recomienda para datos anuales, 6.25 (Ravn y Uhlig), sin pensar en qué periodos se quieren separar.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `hpfilter(z, lamb=6.25)` | λ = 6.25 | El valor que suele recomendarse para datos anuales en economía. |
| periodo de corte | 2π / arccos(1 − 1/(2√λ)) | El periodo en el que la ganancia del filtro es ½: lo más corto queda en el "ciclo", lo más largo en la "tendencia". |
@@ Código
```python
from statsmodels.tsa.filters.hp_filter import hpfilter

def corte_hp(lam):
    """Periodo (en años) en que la ganancia del componente cíclico de HP vale 1/2."""
    return 2 * np.pi / np.arccos(1 - 1 / (2 * np.sqrt(lam)))

ciclo_625, tend_625 = hpfilter(z, lamb=6.25)
print(f"λ = 6.25 → periodo de corte = {corte_hp(6.25):.1f} años")
print(f"Correlación entre la 'tendencia' y la serie: {np.corrcoef(tend_625, z)[0, 1]:.3f}")
print(f"Desviación: tendencia = {tend_625.std():.2f}, ciclo = {ciclo_625.std():.2f}")
```
@@ Resultado
```python oculto
grafica("lab-hp625", [linea(anios, z, "√manchas", "gris", 1.2), linea(anios, tend_625, "'tendencia' HP, λ = 6.25", "rosa", 2.4)],
        alto=300, title={"text": "Con λ = 6.25 la 'tendencia' sigue al ciclo solar"}, xaxis={"title": {"text": "año"}})
```
@widget lab-graf id=lab-hp625
@@ Lectura
- Con λ = 6.25, el periodo de corte es **{{=corte_hp(6.25)|.1f}} años**: cae **dentro** de la banda del ciclo solar (8 a 14 años). El filtro pone una parte del ciclo de 11 años en la "tendencia" y otra en el "ciclo".
- La gráfica lo confirma: la "tendencia" rosa **sube y baja con cada ciclo solar** (correlación de {{=np.corrcoef(tend_625, z)[0, 1]|.3f}} con la serie). No separó nada de lo que interesaba.
- No es un error del filtro. El 6.25 se pensó para **ciclos económicos**, de unos 2 a 8 años en datos anuales, que deben quedar en el componente cíclico. Aquí el ciclo dura 11 años y la variación de interés, decenas de años: otra escala.
@@ Decisión
❌ El λ "de manual" no sirve para esta pregunta. La forma correcta es **calcular λ a partir del periodo de corte que se quiere**. Para que todo el ciclo solar (hasta ~15 años) quede en el componente cíclico y la tendencia solo capture variaciones de varias décadas, se pide un corte de **40 años**.
:::

:::pastilla verde | Aplicar · Hodrick–Prescott con λ calculado para un corte de 40 años | u3:hp u3:proponer-filtro u3:objetivo-filtro
Obtener una **tendencia secular** que no contenga el ciclo de 11 años, eligiendo λ con la fórmula de la ganancia de HP.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| P_c = 40 años | corte | Bastante más largo que el ciclo más largo observado (15 años) y bastante más corto que la variación de ~100 años que se quiere ver. |
| λ = 1 / (4(1 − cos(2π/P_c))²) | fórmula | Se despeja de "ganancia = ½ en el periodo P_c". |
@@ Código
```python
P_corte = 40
lam_40 = 1 / (4 * (1 - np.cos(2 * np.pi / P_corte)) ** 2)
ciclo_40, tend_40 = hpfilter(z, lamb=lam_40)
print(f"λ para un corte de {P_corte} años = {lam_40:.1f}  (comprobación: corte = {corte_hp(lam_40):.1f} años)")
print(f"Correlación tendencia–serie: {np.corrcoef(tend_40, z)[0, 1]:.3f}")
minimo_dalton = tend_40["1780":"1850"].idxmin()
minimo_1900 = tend_40["1850":"1950"].idxmin()
maximo_moderno = tend_40["1900":].idxmax()
print(f"Mínimo secular 1780–1850: {minimo_dalton} ({tend_40[minimo_dalton] ** 2:.0f} manchas)")
print(f"Mínimo secular 1850–1950: {minimo_1900} ({tend_40[minimo_1900] ** 2:.0f} manchas)")
print(f"Máximo secular del siglo XX: {maximo_moderno} ({tend_40[maximo_moderno] ** 2:.0f} manchas)")
```
@@ Resultado
```python oculto
grafica("lab-hp40", [linea(anios, z, "√manchas", "gris", 1.1), linea(anios, tend_40, f"tendencia HP, λ = {lam_40:.0f}", "lav", 3)],
        alto=310, title={"text": "Tendencia secular de la actividad solar (corte de 40 años)"}, xaxis={"title": {"text": "año"}},
        annotations=[{"x": int(minimo_dalton.year), "y": float(tend_40[minimo_dalton]), "text": "mínimo de Dalton", "showarrow": True, "ay": 34},
                     {"x": int(maximo_moderno.year), "y": float(tend_40[maximo_moderno]), "text": "máximo del siglo XX", "showarrow": True, "ay": -30}])
```
@widget lab-graf id=lab-hp40
@@ Lectura
- **λ = {{=lam_40|.0f}}**, unas 260 veces el 6.25 de manual. La comprobación devuelve un corte de {{=corte_hp(lam_40)|.1f}} años.
- La tendencia (lila) ya **no sigue el ciclo**: es una curva lenta (correlación con la serie {{=np.corrcoef(tend_40, z)[0, 1]|.3f}}) que muestra la historia secular del Sol.
  - Un **mínimo en {{=minimo_dalton}}** (unas {{=tend_40[minimo_dalton] ** 2|.0f}} manchas de nivel de fondo): el **mínimo de Dalton**.
  - Otro mínimo relativo hacia **{{=minimo_1900}}**.
  - Un **máximo secular en {{=maximo_moderno}}** ({{=tend_40[maximo_moderno] ** 2|.0f}} manchas), el periodo más activo de los 300 años.
- La distancia entre esos mínimos y máximos (del orden de 80 a 100 años) es consistente con el pico de baja frecuencia del periodograma (paso 36).
@@ Decisión
✅ Variación secular separada. Queda la otra mitad: aislar el **ciclo de 11 años** como una señal limpia, sin la tendencia y sin el ruido de alta frecuencia, para medir cómo cambia su **amplitud**. Para eso se usa un filtro **pasa-banda**, el de Baxter–King, centrado en 8 a 14 años.
:::

:::pastilla verde | Aplicar · Baxter–King: aislar la banda de 8 a 14 años | u3:bk u3:filtro-ideal u3:fase-cero
Extraer solo las oscilaciones con periodos entre 8 y 14 años, donde está el ciclo solar según la Fase 7, y medir su **amplitud** a lo largo del tiempo con la envolvente de Hilbert.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `low=8, high=14` | periodos en años | La banda del ciclo: cubre las duraciones observadas (paso 13) y deja fuera los armónicos de 5 años y la variación secular. |
| `K=12` | 12 rezagos y 12 adelantos | Un filtro simétrico de 25 pesos (fase cero, no desplaza los picos). Cuesta 12 años en cada extremo. |
| `signal.hilbert` | señal analítica | Su módulo es la **envolvente**: la amplitud instantánea del ciclo. |
@@ Código
```python
from statsmodels.tsa.filters.bk_filter import bkfilter

K_bk = 12
ciclo_bk = pd.Series(np.asarray(bkfilter(z, low=8, high=14, K=K_bk)).ravel(), index=z.index[K_bk:-K_bk])
amplitud = pd.Series(np.abs(signal.hilbert(ciclo_bk.values)), index=ciclo_bk.index)
print(f"Años con ciclo filtrado: {ciclo_bk.index[0]}–{ciclo_bk.index[-1]} ({len(ciclo_bk)} de {len(z)})")
print(f"Varianza del ciclo BK / varianza de √y: {ciclo_bk.var() / z.var():.3f}")
tend_alineada = tend_40.loc[ciclo_bk.index]
print(f"Correlación entre la amplitud del ciclo y la tendencia secular: {np.corrcoef(amplitud, tend_alineada)[0, 1]:.3f}")
```
@@ Resultado
```python oculto
xb = ciclo_bk.index.year
grafica("lab-bk", [linea(xb, ciclo_bk, "ciclo de 8–14 años (Baxter–King)", "cel", 1.8),
                   linea(xb, amplitud, "amplitud (envolvente)", "rosa", 2.4), linea(xb, -amplitud, "", "rosa", 2.4, showlegend=False),
                   linea(xb, tend_alineada - tend_alineada.mean(), "tendencia secular (centrada)", "lav", 2, "dash")],
        alto=330, title={"text": "El ciclo de 11 años y su amplitud"}, xaxis={"title": {"text": "año"}})
```
@widget lab-graf id=lab-bk
@@ Lectura
- La banda de 8 a 14 años contiene el **{{=100 * ciclo_bk.var() / z.var()|.0f}}%** de la varianza de √y: el ciclo solar es la componente dominante.
- La **envolvente** (rosa) cambia mucho: es muy angosta entre 1800 y 1830 (el mínimo de Dalton), se estrecha de nuevo hacia 1880–1910 y es muy ancha a mediados del siglo XX. Su correlación con la tendencia secular es **{{=np.corrcoef(amplitud, tend_alineada)[0, 1]|.3f}}**: **cuando el nivel de fondo es alto, los ciclos son más intensos**. Es la explicación física de la heterocedasticidad de la Fase 1: la varianza dependía del nivel porque amplitud y nivel se mueven juntos.
- Al ser un filtro simétrico, los picos del ciclo filtrado coinciden en el tiempo con los de la serie. El costo son los {{=K_bk}} años perdidos en cada extremo: Baxter–King **no sirve para pronosticar** (no ve el final de la serie), solo para describir.
@@ Decisión
✅ Ciclo aislado y su amplitud medida. Para cerrar la fase, el siguiente paso dibuja las **ganancias** de los tres filtros. Es la forma de entender, sin prueba y error, por qué el λ = 6.25 falló y por qué λ = {{=lam_40|.0f}} y Baxter–King funcionaron.
:::

:::pastilla azul | Aplicar · Las ganancias de los tres filtros | u3:transferencia u3:filtro-espectro u3:corte-orden
Ver qué hace cada filtro **en cada periodo**: la ganancia vale 1 si el filtro deja pasar esa oscilación completa y 0 si la elimina. Comparada con la banda del ciclo solar (8 a 14 años), explica los resultados de los tres pasos anteriores.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| ganancia de la tendencia HP | 1 / (1 + 4λ(1 − cos ω)²) | Fórmula cerrada del filtro de Hodrick–Prescott. |
| pesos de Baxter–King | ideales menos su promedio | bⱼ = (sin(ω_h j) − sin(ω_l j)) / (πj), recortados a K = 12 y ajustados para sumar 0, igual que en statsmodels. |
| eje horizontal | periodo, escala log | Más legible que la frecuencia para hablar de "años". |
@@ Código
```python
periodos = np.geomspace(2, 200, 400)
w = 2 * np.pi / periodos                                       # frecuencia angular (radianes por año)
gan_hp = {lam: 1 / (1 + 4 * lam * (1 - np.cos(w)) ** 2) for lam in (6.25, lam_40)}

w_l, w_h = 2 * np.pi / 14, 2 * np.pi / 8
j = np.arange(1, K_bk + 1)
pesos = np.r_[(w_h - w_l) / np.pi, (np.sin(w_h * j) - np.sin(w_l * j)) / (np.pi * j)]
pesos = pesos - (pesos[0] + 2 * pesos[1:].sum()) / (2 * K_bk + 1)   # los 25 pesos suman 0
gan_bk = pesos[0] + 2 * np.sum(pesos[1:, None] * np.cos(np.outer(j, w)), axis=0)

for nombre, g in [("tendencia HP λ=6.25", gan_hp[6.25]), (f"tendencia HP λ={lam_40:.0f}", gan_hp[lam_40]), ("Baxter–King 8–14", gan_bk)]:
    en_11 = np.interp(11, periodos, g)
    print(f"{nombre:22s} ganancia en 11 años = {en_11:.3f}")
```
@@ Resultado
```python oculto
grafica("lab-ganancias", [linea(periodos, gan_hp[6.25], "tendencia HP, λ = 6.25", "rosa", 2.4),
                          linea(periodos, gan_hp[lam_40], f"tendencia HP, λ = {lam_40:.0f}", "lav", 2.4),
                          linea(periodos, gan_bk, "Baxter–King (8–14 años)", "cel", 2.4)],
        alto=320, title={"text": "Ganancia de cada filtro según el periodo"},
        xaxis={"type": "log", "title": {"text": "periodo (años, escala log)"}, "tickvals": [2, 5, 8, 11, 14, 20, 40, 100, 200]},
        yaxis={"title": {"text": "ganancia"}, "range": [-0.15, 1.15]},
        shapes=[{"type": "rect", "x0": 8, "x1": 14, "y0": 0, "y1": 1, "yref": "paper", "fillcolor": "rgba(224,112,159,.10)", "line": {"width": 0}}])
```
@widget lab-graf id=lab-ganancias
@@ Lectura
- La franja rosa es la banda del ciclo solar (8 a 14 años).
- **HP con λ = 6.25** (rosa) tiene su ganancia de ½ justo **dentro** de la franja: en 11 años vale {{=np.interp(11, periodos, gan_hp[6.25])|.2f}}. Por eso su "tendencia" se llevaba la mitad del ciclo (paso 42).
- **HP con λ = {{=lam_40|.0f}}** (lila) vale prácticamente **0** en toda la franja ({{=np.interp(11, periodos, gan_hp[lam_40])|.3f}} en 11 años) y sube a 1 solo para periodos de varias décadas. Separa limpiamente la tendencia secular del ciclo (paso 43).
- **Baxter–King** (celeste) es una **campana** centrada en la franja: deja pasar casi completo lo que dura entre 8 y 14 años ({{=np.interp(11, periodos, gan_bk)|.2f}} en 11) y elimina tanto los armónicos cortos como la variación secular. Las pequeñas ondas fuera de la banda son el costo de recortar el filtro ideal a 25 pesos.
@@ Decisión
Con la ganancia se puede **diseñar** el filtro antes de aplicarlo, en lugar de probar valores de λ. Ya están todos los ingredientes. La última fase reajusta el modelo con toda la información disponible y pronostica los siguientes dos ciclos.
:::
