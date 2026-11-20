<section class="portada" id="inicio">
<span class="etiqueta">🧪 Laboratorio · Siguiendo el temario</span>
<h1>🌬️ Viento por unidades: el SCADA de 2019, tema por tema</h1>
<p class="bajada">Los mismos datos SCADA del aerogenerador MV01, ahora en el orden de la materia: primero la limpieza y la exploración, después todo lo de la Unidad I, luego la Unidad II (empezando por los modelos de referencia y los AR y MA solos) y al final la Unidad III. Cada paso usa solo lo visto antes, con muchas gráficas y algunas interactivas.</p>
<div class="lab-selector"><span>Dataset:</span><a href="lab-manchas-solares.html">☀️ Manchas solares</a><a href="lab-proyecto-entrega3.html">⚡ Proyecto entrega 3</a><a class="activo" href="lab-viento-unidades.html">🌬️ Viento por unidades</a><em>✈️ AirPassengers</em><em>🌋 CO₂</em><a href="laboratorio.html">← Todos los datasets</a></div>
<div class="lab-leyenda"><span style="background:var(--celeste-f);border-color:var(--celeste);color:var(--celeste-o)">🔵 Exploración</span><span style="background:var(--verde-f);border-color:var(--verde);color:var(--verde-o)">✅ Logrado</span><span style="background:var(--mantequilla-f);border-color:var(--mantequilla);color:var(--mantequilla-o)">🟡 Funciona con reservas</span><span style="background:var(--coral-f);border-color:var(--coral);color:var(--coral-o)">❌ Descartado</span></div>
</section>

```python oculto
# Utilidades para dibujar las gráficas y tablas de la página (no forman parte del análisis)
from pathlib import Path
import numpy as np
import pandas as pd
import warnings
warnings.filterwarnings("ignore")

RUTA_DATOS = next(p for p in [Path("assets/datos/viento"), Path("../assets/datos/viento")] if p.exists())

PALETA = {"lav": "#7c69d6", "rosa": "#e0709f", "dur": "#ee8a5f", "menta": "#3fae8a", "cel": "#4f9fd8",
          "mant": "#d9a520", "gris": "#a9a5c2", "osc": "#45397a", "rojo": "#c94f4f", "verde": "#3f8a39"}
MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"]
MESES_L = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"]

def fecha_larga(t):
    return f"{t.day} de {MESES_L[t.month - 1]}"

def _vals(v, dec=4):
    out = []
    for x in list(v):
        if isinstance(x, pd.Timestamp):
            out.append(x.strftime("%Y-%m-%d") if x.hour == 0 and x.minute == 0 else x.strftime("%Y-%m-%d %H:%M"))
            continue
        if isinstance(x, str):
            out.append(x)
            continue
        try:
            out.append(None if x is None or pd.isna(x) else round(float(x), dec))
        except (TypeError, ValueError):
            out.append(x)
    return out

def linea(x, y, nombre, color="lav", ancho=1.8, dash="solid", **kw):
    return {"x": _vals(x), "y": _vals(y), "mode": "lines", "name": nombre,
            "line": {"color": PALETA.get(color, color), "width": ancho, "dash": dash}, **kw}

def puntos(x, y, nombre, color="menta", tam=6, **kw):
    return {"x": _vals(x), "y": _vals(y), "mode": "markers", "name": nombre,
            "marker": {"color": PALETA.get(color, color), "size": tam, "line": {"color": "#fff", "width": 1}}, **kw}

def barras(x, y, nombre, color="lav", **kw):
    c = [PALETA.get(k, k) for k in color] if isinstance(color, list) else PALETA.get(color, color)
    return {"type": "bar", "x": _vals(x), "y": _vals(y), "name": nombre, "marker": {"color": c}, **kw}

def banda(x, lo, hi, nombre, color="rgba(124,105,214,.16)"):
    return [{"x": _vals(x), "y": _vals(hi), "mode": "lines", "line": {"color": "rgba(0,0,0,0)"}, "hoverinfo": "skip", "showlegend": False},
            {"x": _vals(x), "y": _vals(lo), "mode": "lines", "line": {"color": "rgba(0,0,0,0)"}, "fill": "tonexty",
             "fillcolor": color, "name": nombre, "hoverinfo": "skip"}]

def caja(y, nombre, color="lav", **kw):
    return {"type": "box", "y": _vals(y, 2), "name": nombre, "marker": {"color": PALETA.get(color, color), "size": 2},
            "line": {"width": 1.2}, "boxpoints": False, **kw}

def cajas(grupos, nombre="", color="lav", **kw):
    """Diagramas de caja con los cuartiles ya calculados (no manda todos los datos a la página)."""
    q = {k: np.percentile(np.asarray(v, float), [25, 50, 75]) for k, v in grupos.items()}
    lo, hi = [], []
    for k, v in grupos.items():
        v = np.asarray(v, float)
        ric = q[k][2] - q[k][0]
        lo.append(v[v >= q[k][0] - 1.5 * ric].min())
        hi.append(v[v <= q[k][2] + 1.5 * ric].max())
    return {"type": "box", "x": [str(k) for k in grupos], "q1": _vals([q[k][0] for k in grupos], 2), "median": _vals([q[k][1] for k in grupos], 2),
            "q3": _vals([q[k][2] for k in grupos], 2), "lowerfence": _vals(lo, 2), "upperfence": _vals(hi, 2), "name": nombre,
            "marker": {"color": PALETA.get(color, color)}, "line": {"width": 1.2}, **kw}

def calor(x, y, z, nombre="", escala="Purples", **kw):
    return {"type": "heatmap", "x": _vals(x), "y": _vals(y), "z": [_vals(f, kw.pop("dec", 3)) for f in z], "colorscale": escala, "name": nombre, **kw}

def correlograma(valores, n, nombre="ACF", desde=1, color="lav", banda_val=None):
    """Barras de la ACF o PACF con la banda ±1.96/√n (las significativas en durazno)."""
    k = list(range(desde, len(valores)))
    b = banda_val if banda_val is not None else 1.96 / np.sqrt(n)
    v = [float(valores[i]) for i in k]
    cols = [PALETA["dur"] if abs(x) > b else PALETA[color] for x in v]
    return banda([desde - 0.5, k[-1] + 0.5], [-b, -b], [b, b], "±1.96/√n") + [
        {"type": "bar", "x": k, "y": _vals(v), "name": nombre, "marker": {"color": cols}, "width": 0.6,
         "hovertemplate": "k = %{x}<br>%{y:.3f}<extra></extra>"}]

def vline(x, color="rosa", dash="dash"):
    return {"type": "line", "x0": x, "x1": x, "y0": 0, "y1": 1, "yref": "paper", "line": {"color": PALETA.get(color, color), "dash": dash}}

def hline(y, color="gris", dash="dot"):
    return {"type": "line", "x0": 0, "x1": 1, "xref": "paper", "y0": y, "y1": y, "line": {"color": PALETA.get(color, color), "dash": dash}}

def _leyenda(trazas, layout):
    con_nombre = [t for t in trazas if t.get("name") and t.get("showlegend", True) is not False]
    if "legend" not in layout and len(con_nombre) > 1 and (layout.get("xaxis") or {}).get("title"):
        layout["legend"] = {"orientation": "h", "y": -0.3, "yanchor": "top"}

def grafica(nombre, trazas, alto=320, nota=None, **layout):
    _leyenda(trazas, layout)
    exportar(nombre, {"t": trazas, "l": layout, "alto": alto, "nota": nota})

def control(nombre, controles, variantes, base=None, textos=None, alto=320, nota=None, lv=None, **layout):
    """Gráfica interactiva: `variantes[i]` son las trazas de la combinación i de los controles."""
    _leyenda((base or []) + (variantes[0] if variantes else []), layout)
    exportar(nombre, {"controles": controles, "base": base or [], "variantes": variantes, "textos": textos,
                      "lv": lv, "l": layout, "alto": alto, "nota": nota})

def tabla(nombre, cols, filas, clases=None, titulo=None, nota=None):
    exportar(nombre, {"cols": cols, "filas": [[c for c in f] for f in filas], "clases": clases or [], "titulo": titulo, "nota": nota})

def diario(s):
    """Promedio diario de una serie horaria, para graficar un año sin 8,760 puntos."""
    return s.resample("D").mean()
```
