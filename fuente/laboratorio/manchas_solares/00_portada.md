<section class="portada" id="inicio">
<span class="etiqueta">🧪 Laboratorio · Flujo completo</span>
<h1>☀️ Manchas solares, 1700–2008</h1>
<p class="bajada">Un análisis de principio a fin del número anual de manchas solares: exploración, transformación, descomposición, estacionariedad, modelos ARMA, validación, análisis espectral y filtros. Paso a paso, con las suposiciones que fallaron y por qué.</p>
<div class="lab-selector"><span>Dataset:</span><a class="activo" href="lab-manchas-solares.html">☀️ Manchas solares</a><em>✈️ AirPassengers</em><em>🌋 CO₂</em><em>🏦 Macroeconomía</em><em>🌊 Nilo</em><a href="laboratorio.html">← Todos los datasets</a></div>
<div class="lab-leyenda"><span style="background:var(--celeste-f);border-color:var(--celeste);color:var(--celeste-o)">🔵 Exploración</span><span style="background:var(--verde-f);border-color:var(--verde);color:var(--verde-o)">✅ Logrado</span><span style="background:var(--mantequilla-f);border-color:var(--mantequilla);color:var(--mantequilla-o)">🟡 Funciona con reservas</span><span style="background:var(--coral-f);border-color:var(--coral);color:var(--coral-o)">❌ Descartado</span></div>
</section>

```python oculto
# Utilidades para dibujar las gráficas y tablas de la página (no forman parte del análisis)
import numpy as np
import pandas as pd

PALETA = {"lav": "#7c69d6", "rosa": "#e0709f", "dur": "#ee8a5f", "menta": "#3fae8a", "cel": "#4f9fd8",
          "mant": "#d9a520", "gris": "#a9a5c2", "osc": "#45397a", "rojo": "#c94f4f", "verde": "#3f8a39"}

def _vals(v):
    out = []
    for x in list(v):
        try:
            out.append(None if x is None or (isinstance(x, float) and np.isnan(x)) or pd.isna(x) else (float(x) if not isinstance(x, str) else x))
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

def correlograma(valores, n, nombre="ACF", desde=1, color="lav"):
    """Barras de la ACF o PACF con la banda ±1.96/√n (las significativas en durazno)."""
    k = list(range(desde, len(valores)))
    b = 1.96 / np.sqrt(n)
    v = [float(valores[i]) for i in k]
    cols = [PALETA["dur"] if abs(x) > b else PALETA[color] for x in v]
    return banda([desde - 0.5, k[-1] + 0.5], [-b, -b], [b, b], "±1.96/√n") + [
        {"type": "bar", "x": k, "y": v, "name": nombre, "marker": {"color": cols}, "width": 0.5,
         "hovertemplate": "k = %{x}<br>%{y:.3f}<extra></extra>"}]

def grafica(nombre, trazas, alto=320, nota=None, **layout):
    exportar(nombre, {"t": trazas, "l": layout, "alto": alto, "nota": nota})

def tabla(nombre, cols, filas, clases=None, titulo=None, nota=None):
    exportar(nombre, {"cols": cols, "filas": [[c for c in f] for f in filas], "clases": clases or [], "titulo": titulo, "nota": nota})

def n2(v, d=2):
    return f"{v:,.{d}f}"
```
