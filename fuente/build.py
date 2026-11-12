#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Genera index.html (Unidad I) y unidad2.html (Unidad II) a partir de fuente/unidad1/ y fuente/unidad2/.

  • Las fórmulas ($...$ y $$...$$) se pre-renderizan con KaTeX (Node.js) y a
    los símbolos se les agrega una explicación que aparece al pasar el cursor.
  • Los bloques ```python se EJECUTAN y su salida real se muestra debajo.
  • [[id]] crea un enlace a otra sección (↩ si está antes, ↪ si está después).

Requisitos
  Python 3: markdown-it-py, pygments, numpy, pandas, statsmodels, matplotlib, scipy, scikit-learn
  Node.js:  katex@0.16.11   (cd fuente && npm install katex@0.16.11)
Uso
  python3 fuente/build.py          (todas las unidades)
  python3 fuente/build.py u2       (solo la Unidad II)
"""
import ast
import contextlib
import html
import io
import json
import os
import re
import subprocess
import sys
import traceback
import warnings
from pathlib import Path

from markdown_it import MarkdownIt
from pygments import highlight
from pygments.formatters import HtmlFormatter
from pygments.lexers import PythonLexer

AQUI = Path(__file__).resolve().parent
RAIZ = AQUI.parent
CACHE = AQUI / "cache"
UNIDADES = {
    "u1": {"carpeta": "unidad1", "salida": "index.html", "numero": "I", "nombre": "Unidad I",
           "titulo_pagina": "Unidad I · Características de series de tiempo — Guía de estudio",
           "descripcion": "Guía de estudio interactiva de la Unidad I de Análisis de Series de Tiempo: componentes, estacionariedad, raíz unitaria, ADF, KPSS, ACF, PACF y Ljung-Box, con demostraciones paso a paso, ejemplos a mano, código Python y gráficas interactivas.",
           "scripts": []},
    "u2": {"carpeta": "unidad2", "salida": "unidad2.html", "numero": "II", "nombre": "Unidad II",
           "titulo_pagina": "Unidad II · Procesos lineales: AR, MA, ARMA, ARIMA y SARIMA(X) — Guía de estudio",
           "descripcion": "Guía de estudio interactiva de la Unidad II de Análisis de Series de Tiempo: operador rezago, AR, MA, ARMA, ARIMA, SARIMA, SARIMAX, máxima verosimilitud, AIC/BIC, diagnóstico de residuos, ARCH, validación temporal, métricas de pronóstico y modelos de referencia con statsforecast.",
           "scripts": ["assets/js/ts2.js", "assets/js/widgets2.js"],
           # En la Unidad II algunos símbolos cambian de significado o aparecen símbolos nuevos
           "renombrar": {"alpha": "alpha-u2", "beta": "beta-x", "xt": "x-exo", "p": "p-ar"},
           "reglas": [
               (r"\\mathcal\{L\}", "verosim"), (r"\\ell(?![A-Za-z])", "ell"),
               (r"\\Phi(?![A-Za-z])", "Phi-est"), (r"\\Theta(?![A-Za-z])", "Theta-est"),
               (r"\\psi_\{[^}]*\}", "psi"), (r"\\psi_[0-9a-z]", "psi"), (r"\\psi(?![A-Za-z])", "psi"),
               (r"\\hat\{y\}", "yhat"), (r"\\hat\{\\theta\}", "thetahat"),
               (r"\\sigma_t\^2", "sigma2t"), (r"\\sigma_\{t\}\^2", "sigma2t"),
               (r"\\varepsilon_\{t\+[0-9a-z]+\}", "eps-fut"), (r"y_\{t\+h\}", "y+h"),
               (r"\\Delta_(?:\{[^}]+\}|[0-9a-z])", "Delta-s"),
               (r"e_\{t-[0-9a-z]+\}", "e-res-j"), (r"e_t(?![A-Za-z0-9])", "e-res"), (r"e_\{t\}", "e-res"),
               (r"(?<![A-Za-z\\{])L(?![A-Za-z])", "L-op"),
           ]},
    "u3": {"carpeta": "unidad3", "salida": "unidad3.html", "numero": "III", "nombre": "Unidad III",
           "titulo_pagina": "Unidad III · Análisis espectral y filtrado — Guía de estudio",
           "descripcion": "Guía de estudio interactiva de la Unidad III de Análisis de Series de Tiempo: periodicidad y ciclo, dominio de la frecuencia, densidad espectral, transformada de Fourier, periodograma, Welch, estimación paramétrica, espectro cruzado, coherencia y filtros lineales, con demostraciones, ejemplos a mano, Python y gráficas interactivas.",
           "scripts": ["assets/js/ts2.js", "assets/js/ts3.js", "assets/js/widgets3.js"],
           # En la Unidad III aparecen la frecuencia, los espectros y los filtros
           "renombrar": {"alpha": "alfa-sig", "tau": "tau-hp", "chi2": "chi2-esp", "beta": "beta-fourier"},
           "reglas": [
               (r"e\^\{\s*-?\s*2\\pi\s*i[^}]*\}", "exp-c"),
               (r"\\lvert\s*A\(\\omega\)\s*\\rvert\^2", "gan2"), (r"\\lvert\s*A\(\\omega\)\s*\\rvert", "gan"),
               (r"(?<![A-Za-z\\])A\(\\omega\)", "A-omega"),
               (r"\\hat\{f\}", "fhat"),
               (r"(?<![A-Za-z\\])f_\{(?:yx|xy)\}", "f-cruz"),
               (r"(?<![A-Za-z\\])f_(?:\{(?:xx|yy|x|y|u|w|v|e|z)\}|(?:x|y|u|w|v|e|z)(?![A-Za-z]))", "f-serie"),
               (r"(?<![A-Za-z\\])f\(\\omega(?:_\{?j\}?)?\)", "f-omega"),
               (r"(?<![A-Za-z\\])I\(\\omega(?:_\{?j\}?)?\)", "per"), (r"(?<![A-Za-z\\])d\(\\omega(?:_\{?j\}?)?\)", "dft"),
               (r"\\rho\^2_\{[^}]*\}", "coh"),
               (r"\\gamma_\{(?:xy|yx)\}", "gamma-cruz"),
               (r"(?<![A-Za-z\\])c_\{(?:xy|yx)\}", "cospectro"), (r"(?<![A-Za-z\\])q_\{(?:xy|yx)\}", "cuadratura"),
               (r"\\varphi_\{[^}]*\}|\\varphi(?![A-Za-z])", "fase"),
               (r"\\omega_\{?j\}?(?![A-Za-z])", "omega-j"), (r"\\omega_\{?c\}?(?![A-Za-z])", "omega-c"),
               (r"\\omega(?![A-Za-z_])", "omega3"),
               (r"\\lambda(?![A-Za-z])", "lambda-hp"), (r"\\tau_t", "tau-hp"),
               (r"\\Delta_(?:\{[^}]+\}|[0-9a-z])", "Delta-s"),
               (r"(?<![A-Za-z\\])a_\{?[jk]\}?(?![A-Za-z])", "a-imp"), (r"(?<![A-Za-z\\])h_\{?k\}?(?![A-Za-z])", "h-ker"),
               (r"(?<![A-Za-z\\])x_\{t-[0-9a-zD]+\}", "x-j"),
               (r"(?<![A-Za-z\\{])L(?![A-Za-z])", "L-op"),
           ]},
}

MACROS = {
    r"\tip": r"\htmlData{tip=#1}{#2}",
    r"\E": r"\tip{E}{\mathrm{E}}",
    r"\Var": r"\tip{Var}{\operatorname{Var}}",
    r"\Cov": r"\tip{Cov}{\operatorname{Cov}}",
    r"\Corr": r"\tip{Corr}{\operatorname{Corr}}",
    r"\lrvar": r"\tip{sigma2lr}{\hat{\sigma}^2_{\infty}}",
    r"\ehat": r"\tip{e-kpss}{\hat{e}}",
    # Unidad II
    r"\AIC": r"\tip{aic}{\mathrm{AIC}}", r"\BIC": r"\tip{bic}{\mathrm{BIC}}", r"\HQIC": r"\tip{hqic}{\mathrm{HQIC}}",
    r"\MAE": r"\tip{MAE}{\mathrm{MAE}}", r"\MSE": r"\tip{MSE}{\mathrm{MSE}}", r"\RMSE": r"\tip{RMSE}{\mathrm{RMSE}}",
    r"\MAPE": r"\tip{MAPE}{\mathrm{MAPE}}", r"\sMAPE": r"\tip{sMAPE}{\mathrm{sMAPE}}", r"\MASE": r"\tip{MASE}{\mathrm{MASE}}",
    r"\JB": r"\tip{JB}{\mathrm{JB}}", r"\LM": r"\tip{LM}{\mathrm{LM}}",
    r"\pL": r"\tip{phiL}{\phi(L)}", r"\tL": r"\tip{thetaL}{\theta(L)}",
    r"\PL": r"\tip{PhiL}{\Phi(L^{s})}", r"\TL": r"\tip{ThetaL}{\Theta(L^{s})}",
    # Unidad III
    r"\Lsp": r"\tip{L-span}{L}", r"\Bw": r"\tip{B-banda}{B}", r"\Per": r"\tip{P-periodo}{P}", r"\Kseg": r"\tip{K-seg}{K}",
}

# ----------------------------------------------------------------------------
# Explicaciones automáticas de símbolos dentro de las fórmulas
# ----------------------------------------------------------------------------
PROTEGIDOS = {r"\tip": 2, r"\htmlData": 2, r"\text": 1, r"\textbf": 1, r"\textit": 1,
              r"\operatorname": 1, r"\mathrm": 1, r"\textsf": 1}

REGLAS = [(re.compile(p), k) for p, k in [
    (r"\\bar\{y\}", "ybar"), (r"\\bar y(?![A-Za-z])", "ybar"), (r"\\bar\{x\}", "xbar"),
    (r"\\hat\{\\gamma\}", "gammahat"), (r"\\hat\{\\rho\}", "rhohat"), (r"\\hat\{\\delta\}", "deltahat"),
    (r"\\hat\{\\sigma\}\^2", "sigma2hat"), (r"\\hat\{\\phi\}", "phihat"), (r"\\hat\{\\mu\}", "muhat"),
    (r"\\hat\{\\varepsilon\}_t", "epshat"), (r"\\hat\{\\varepsilon\}", "epshat"),
    (r"\\gamma\(0\)", "gamma0"), (r"\\gamma\(-?k\)", "gammak"), (r"\\gamma_k", "gammak"), (r"\\gamma_0", "gamma0"),
    (r"\\gamma(?![A-Za-z])", "gammak"),
    (r"\\rho\(-?k\)", "rhok"), (r"\\rho_k", "rhok"), (r"\\rho(?![A-Za-z])", "rhok"),
    (r"\\sigma\^2_\{\\varepsilon\}", "sigma2"), (r"\\sigma\^2_\\varepsilon", "sigma2"),
    (r"\\sigma_\{\\varepsilon\}\^2", "sigma2"), (r"\\sigma_\\varepsilon\^2", "sigma2"),
    (r"\\sigma\^2", "sigma2"), (r"\\sigma(?![A-Za-z])", "sigma"),
    (r"\\varepsilon_\{t-1\}", "eps-1"), (r"\\varepsilon_\{t-[0-9a-z]+\}", "eps-j"),
    (r"\\varepsilon_t", "eps"), (r"\\varepsilon_\{t\}", "eps"),
    (r"\\varepsilon_[0-9a-z](?![A-Za-z])", "eps-j"), (r"\\varepsilon(?![A-Za-z])", "eps"),
    (r"\\phi(?![A-Za-z])", "phi"), (r"\\mu(?![A-Za-z])", "mu"), (r"\\delta(?![A-Za-z])", "delta"),
    (r"\\Delta(?![A-Za-z])", "Delta"), (r"\\tau(?![A-Za-z])", "tau"), (r"\\theta(?![A-Za-z])", "theta"),
    (r"\\chi\^2", "chi2"), (r"\\eta(?![A-Za-z])", "eta"), (r"\\alpha(?![A-Za-z])", "alpha"),
    (r"\\beta(?![A-Za-z])", "beta"), (r"\\infty", "infty"),
    (r"y_\{t-1\}", "y-1"), (r"y_\{t-k\}", "y-k"), (r"y_\{t\+k\}", "y+k"), (r"y_\{t\+1\}", "y+1"),
    (r"y_\{t-[ij0-9]+\}", "y-j"), (r"y_\{t\}", "yt"), (r"y_t(?![A-Za-z0-9])", "yt"),
    (r"y_0(?![0-9])", "y0"), (r"y_[0-9](?![0-9])", "yn"), (r"y_\{[0-9]+\}", "yn"),
    (r"x_t(?![A-Za-z0-9])", "xt"),
    (r"T_t(?![A-Za-z])", "Tt"), (r"S_t(?![A-Za-z])", "St"), (r"C_t(?![A-Za-z])", "Ct"), (r"R_t(?![A-Za-z])", "Rt"),
    (r"H_0", "H0"), (r"H_1", "H1"),
]]


def fin_grupo(tex, i):
    """tex[i] == '{'. Devuelve el índice justo después de la llave que la cierra."""
    prof, j = 0, i
    while j < len(tex):
        c = tex[j]
        if c == "\\":
            j += 2
            continue
        if c == "{":
            prof += 1
        elif c == "}":
            prof -= 1
            if prof == 0:
                return j + 1
        j += 1
    raise ValueError("Llaves sin cerrar en: " + tex)


def fin_argumento(tex, j):
    """Avanza sobre un argumento de sub/superíndice: {…}, \\comando o un carácter."""
    if j < len(tex) and tex[j] == "{":
        return fin_grupo(tex, j)
    m = re.match(r"\\[A-Za-z]+", tex[j:])
    return j + (len(m.group(0)) if m else 1)


def envolver_operadores(tex):
    """\\sum y \\lim se envuelven completos (con sus límites) para no romper la tipografía."""
    salida, i = [], 0
    for m in re.finditer(r"\\(sum|lim)(?![A-Za-z])", tex):
        a = m.start()
        if a < i:
            continue
        if re.search(r"\\tip\{[\w+\-]+\}\{\s*$", tex[:a]):
            continue
        j = m.end()
        for _ in range(2):
            k = j
            while k < len(tex) and tex[k] == " ":
                k += 1
            if k < len(tex) and tex[k] in "_^":
                j = fin_argumento(tex, k + 1)
        salida.append(tex[i:a])
        salida.append(r"{\tip{%s}{%s}}" % (m.group(1), tex[a:j]))
        i = j
    salida.append(tex[i:])
    return "".join(salida)


def segmentar(tex):
    segs, i, inicio = [], 0, 0
    while i < len(tex):
        if tex[i] == "\\":
            m = re.match(r"\\[A-Za-z]+", tex[i:])
            if m and m.group(0) in PROTEGIDOS:
                j = i + len(m.group(0))
                for _ in range(PROTEGIDOS[m.group(0)]):
                    while j < len(tex) and tex[j] == " ":
                        j += 1
                    if j < len(tex) and tex[j] == "{":
                        j = fin_grupo(tex, j)
                if i > inicio:
                    segs.append([tex[inicio:i], False])
                segs.append([tex[i:j], True])
                i = inicio = j
                continue
            i += len(m.group(0)) if m else 2
            continue
        i += 1
    if inicio < len(tex):
        segs.append([tex[inicio:], False])
    return segs


def autotip(tex, extra=(), renombrar=None):
    # \hat\rho → \hat{\rho} (así la regla del símbolo no rompe el acento)
    tex = re.sub(r"\\(hat|bar|tilde)\s*(\\[A-Za-z]+|[A-Za-z])", r"\\\1{\2}", tex)
    segs = segmentar(envolver_operadores(tex))
    renombrar = renombrar or {}
    for patron, clave in list(extra) + REGLAS:
        clave = renombrar.get(clave, clave)
        nuevos = []
        for texto, prot in segs:
            if prot:
                nuevos.append([texto, True])
                continue
            pos = 0
            for m in patron.finditer(texto):
                if m.start() > pos:
                    nuevos.append([texto[pos:m.start()], False])
                nuevos.append([r"{\tip{%s}{%s}}" % (clave, m.group(0)), True])
                pos = m.end()
            if pos < len(texto):
                nuevos.append([texto[pos:], False])
        segs = nuevos
    return "".join(t for t, _ in segs)


# ----------------------------------------------------------------------------
# Utilidades
# ----------------------------------------------------------------------------
def slug(texto):
    t = re.sub(r"[^\w\s-]", "", texto.lower())
    return re.sub(r"\s+", "-", t).strip("-")[:60]


GRIEGAS = {"omega": "ω", "sigma": "σ", "phi": "φ", "varphi": "φ", "theta": "θ", "gamma": "γ", "lambda": "λ",
           "pi": "π", "rho": "ρ", "alpha": "α", "beta": "β", "Delta": "Δ", "nabla": "∇", "varepsilon": "ε",
           "epsilon": "ε", "mu": "μ", "tau": "τ", "chi": "χ", "Phi": "Φ", "Theta": "Θ", "eta": "η"}
SUPER = {"2": "²", "3": "³", "0": "⁰", "1": "¹", "n": "ⁿ"}


def formula_texto(tex):
    """Fórmula sencilla de un título → HTML legible sin KaTeX (para el índice y las referencias)."""
    t = re.sub(r"\\lvert\s*|\\lVert\s*|\\left\|\s*", "|", tex)
    t = re.sub(r"\s*\\rvert|\s*\\rVert|\s*\\right\|", "|", t)
    t = re.sub(r"\\hat\{\\?(\w+)\}", lambda m: GRIEGAS.get(m.group(1), m.group(1)) + "\u0302", t)
    t = re.sub(r"\\([A-Za-z]+)", lambda m: GRIEGAS.get(m.group(1), "" if m.group(1) in ("left", "right") else m.group(1)), t)
    t = re.sub(r"\\[,;:! ]", " ", t)
    t = html.escape(t.replace("-", "−"))
    t = re.sub(r"\^\{([0-9n])\}|\^([0-9n])", lambda m: SUPER[m.group(1) or m.group(2)], t)
    t = re.sub(r"\^\{([^}]*)\}|\^(\w)", lambda m: f"<sup>{m.group(1) or m.group(2)}</sup>", t)
    t = re.sub(r"_\{([^}]*)\}|_(\w)", lambda m: f"<sub>{m.group(1) or m.group(2)}</sub>", t)
    return t.replace("{", "").replace("}", "")


def titulo_html(texto):
    """Texto de un título con $…$ y `…` → HTML para enlaces, índice y botones."""
    partes = re.split(r"(\$[^$]+\$)", texto.replace("`", ""))
    return "".join(formula_texto(p[1:-1]) if p.startswith("$") and p.endswith("$") and len(p) > 1
                   else html.escape(p) for p in partes)


md = MarkdownIt("commonmark", {"html": True, "typographer": False}).enable("table").enable("strikethrough")
FORMATO = HtmlFormatter(nowrap=True)

TIPOS = {
    "definicion": ("📘", "Definición"),
    "intuicion": ("💡", "Intuición"),
    "demo": ("🔍", "Demostración paso a paso"),
    "ejemplo": ("✍️", "Ejemplo a mano"),
    "cuidado": ("⚠️", "Cuidado"),
    "resumen": ("✅", "Resumen"),
    "examen": ("🎯", "Así te lo pueden preguntar"),
    "duda": ("💬", "Duda frecuente"),
    "nota": ("📝", "Nota"),
    "interactivo": ("🎛️", "Gráfica interactiva"),
    "python": ("🐍", "En Python"),
}
NIVELES = {"básico": "basico", "basico": "basico", "intermedio": "intermedio", "reto": "reto"}


class Documento:
    def __init__(self):
        self.math = []
        self.refs = []
        self.anclas = {}
        self.orden = 0
        self.sec = -1
        self.sub = 0
        self.mapa = []
        self.toc = []
        self.abierta = False
        self.n_ejercicio = 0
        self.ns = {"__name__": "__guia__"}
        self.errores = []
        self.exportados = {}
        self.ns["exportar"] = self.exportar
        exec("import matplotlib\nmatplotlib.use('Agg')\nimport warnings\n", self.ns)

    def exportar(self, nombre, valor):
        """Guarda un resultado de Python para que lo usen las gráficas (JSON en la página)."""
        import math
        def limpio(v):
            try:
                import numpy as np
                import pandas as pd
                if isinstance(v, pd.Series):
                    v = v.to_numpy()
                if isinstance(v, pd.DataFrame):
                    return {str(c): limpio(v[c]) for c in v.columns}
                if isinstance(v, (pd.Timestamp,)):
                    return str(v.date())
                if isinstance(v, np.ndarray):
                    return [limpio(x) for x in v.tolist()]
                if isinstance(v, np.generic):
                    v = v.item()
            except ImportError:
                pass
            if isinstance(v, float):
                return None if math.isnan(v) or math.isinf(v) else round(v, 8)
            if isinstance(v, dict):
                return {str(k): limpio(x) for k, x in v.items()}
            if isinstance(v, (list, tuple)):
                return [limpio(x) for x in v]
            return v
        self.exportados[nombre] = limpio(valor)

    # ---------------- protección de matemáticas y referencias --------------
    def proteger(self, texto):
        def rep_d(m):
            self.math.append((m.group(1).strip(), True))
            return f"\n\n@@D{len(self.math) - 1}@@\n\n"

        texto = re.sub(r"\$\$(.+?)\$\$", rep_d, texto, flags=re.S)

        def rep_i(m):
            self.math.append((m.group(1), False))
            return f"@@I{len(self.math) - 1}@@"

        texto = re.sub(r"(?<![\\$])\$(?!\$)(.+?)(?<![\\$])\$", rep_i, texto)

        def rep_r(m):
            self.refs.append((m.group(1), m.group(2), self.orden))
            return f"@@R{len(self.refs) - 1}@@"

        texto = re.sub(r"\[\[([\w:-]+)(?:\|([^\]]+))?\]\]", rep_r, texto)
        texto = re.sub(r"\{\{([\w+-]+)\|([^}]+)\}\}",
                       lambda m: f'<span class="termino" data-tip="{m.group(1)}">{m.group(2)}</span>', texto)
        return texto.replace(r"\$", "$")

    def md(self, texto):
        return md.render(self.proteger(texto))

    def md_inline(self, texto):
        return md.renderInline(self.proteger(texto))

    def ancla(self, id_, num, titulo, tipo):
        if id_ in self.anclas:
            self.errores.append(f"id repetido: {id_}")
        self.orden += 1
        self.anclas[id_] = {"num": num, "titulo": titulo, "tipo": tipo, "orden": self.orden}

    # ------------------------------ parser ---------------------------------
    def parsear(self, lineas):
        nodos, buf, i = [], [], 0

        def vaciar():
            if any(l.strip() for l in buf):
                nodos.append(("md", "\n".join(buf)))
            buf.clear()

        while i < len(lineas):
            l = lineas[i]
            if l.startswith("```"):
                vaciar()
                info, j, cod = l[3:].strip(), i + 1, []
                while not lineas[j].startswith("```"):
                    cod.append(lineas[j])
                    j += 1
                nodos.append(("code", info, "\n".join(cod)))
                i = j + 1
                continue
            m = re.match(r"^(#{2,4}) (.+?)(?:\s*\{#([\w-]+)\})?\s*$", l)
            if m:
                vaciar()
                nodos.append(("h", len(m.group(1)), m.group(2), m.group(3)))
                i += 1
                continue
            m = re.match(r"^:::(\w+)\s*(.*)$", l)
            if m:
                vaciar()
                prof, j, hijos = 1, i + 1, []
                while j < len(lineas):
                    if re.match(r"^:::\w", lineas[j]):
                        prof += 1
                    elif lineas[j].strip() == ":::":
                        prof -= 1
                        if prof == 0:
                            break
                    hijos.append(lineas[j])
                    j += 1
                if j >= len(lineas):
                    self.errores.append(f"Bloque :::{m.group(1)} sin cerrar")
                nodos.append(("cont", m.group(1), m.group(2).strip(), hijos))
                i = j + 1
                continue
            m = re.match(r"^@widget\s+([\w-]+)\s*(.*)$", l)
            if m:
                vaciar()
                nodos.append(("widget", m.group(1), m.group(2)))
                i += 1
                continue
            m = re.match(r"^@mapa\s+(.*)$", l)
            if m:
                vaciar()
                nodos.append(("mapa", m.group(1)))
                i += 1
                continue
            buf.append(l)
            i += 1
        vaciar()
        return nodos

    # ------------------------------ render ---------------------------------
    def render(self, nodos):
        return "\n".join(self.render_nodo(n) for n in nodos)

    def render_nodo(self, n):
        tipo = n[0]
        if tipo == "md":
            return self.md(n[1])
        if tipo == "h":
            return self.render_h(*n[1:])
        if tipo == "code":
            return self.render_code(n[1], n[2])
        if tipo == "widget":
            return self.render_widget(n[1], n[2])
        if tipo == "cont":
            return self.render_cont(n[1], n[2], n[3])
        if tipo == "mapa":
            if self.mapa:
                self.mapa[-1]["texto"] = n[1]
            return ""
        raise ValueError(tipo)

    def render_h(self, nivel, titulo, id_):
        id_ = id_ or slug(titulo)
        if nivel == 2:
            self.sec += 1
            self.sub = 0
            num = str(self.sec)
            self.ancla(id_, num, titulo, "seccion")
            previo = self.cerrar_seccion()
            self.abierta = True
            self.toc.append({"id": id_, "num": num, "titulo": titulo, "subs": []})
            self.mapa.append({"id": id_, "num": num, "titulo": titulo, "texto": ""})
            t = self.md_inline(titulo)
            return (f'{previo}<section class="seccion" data-seccion="{id_}">'
                    f'<h2 id="{id_}"><span class="h-num">{num}</span><span class="h-txt">{t}</span></h2>')
        if nivel == 3:
            self.sub += 1
            num = f"{self.sec}.{self.sub}"
            self.ancla(id_, num, titulo, "sub")
            self.toc[-1]["subs"].append({"id": id_, "num": num, "titulo": titulo})
            return f'<h3 id="{id_}"><span class="h-num">{num}</span> {self.md_inline(titulo)}</h3>'
        self.ancla(id_, None, titulo, "menor")
        return f'<h4 id="{id_}">{self.md_inline(titulo)}</h4>'

    def cerrar_seccion(self):
        if not self.abierta:
            return ""
        s = self.toc[-1]
        self.abierta = False
        return (f'<div class="fin-seccion"><button class="btn-estudiada" data-seccion="{s["id"]}">'
                f'<span class="ico">☐</span> Marcar «{titulo_html(s["titulo"])}» como estudiada</button></div></section>')

    def ejecutar(self, codigo, esperar_error=False):
        buf = io.StringIO()
        arbol = ast.parse(codigo)
        ultimo = None
        if arbol.body and isinstance(arbol.body[-1], ast.Expr):
            ultimo = ast.Expression(arbol.body.pop().value)
        avisos = []
        with contextlib.redirect_stdout(buf), warnings.catch_warnings(record=True) as w:
            warnings.simplefilter("always")
            try:
                exec(compile(arbol, "<celda>", "exec"), self.ns)
                if ultimo is not None:
                    val = eval(compile(ultimo, "<celda>", "eval"), self.ns)
                    if val is not None:
                        print(repr(val))
            except Exception as e:
                if not esperar_error:
                    self.errores.append("Error al ejecutar Python:\n" + codigo + "\n" + traceback.format_exc())
                print(f"{type(e).__name__}: {e}")
            for a in w:
                if issubclass(a.category, (DeprecationWarning, PendingDeprecationWarning, FutureWarning)):
                    continue
                if "Matplotlib" in str(a.message) or "FigureCanvasAgg" in str(a.message):
                    continue
                avisos.append(f"⚠ {a.category.__name__}: {a.message}")
        try:
            import matplotlib.pyplot as plt
            plt.close("all")
        except Exception:
            pass
        salida = buf.getvalue().rstrip("\n")
        if avisos:
            salida = (salida + "\n" if salida else "") + "\n".join(dict.fromkeys(avisos))
        return salida

    def render_code(self, info, codigo):
        partes = info.split()
        lang = partes[0] if partes else "text"
        opciones = set(partes[1:])
        if lang != "python":
            return f'<pre class="pre-texto">{html.escape(codigo)}</pre>'
        if "oculto" in opciones:
            import hashlib
            clave = hashlib.sha1(codigo.encode("utf-8")).hexdigest()[:16]
            archivo = CACHE / f"{clave}.json"
            if "cache" in opciones and archivo.exists():
                self.exportados.update(json.loads(archivo.read_text(encoding="utf-8")))
                return ""
            antes = set(self.exportados)
            sal = self.ejecutar(codigo)
            if sal.strip():
                print("   [bloque oculto] " + sal.strip().replace("\n", "\n   "))
            if "cache" in opciones:
                CACHE.mkdir(exist_ok=True)
                nuevos = {k: v for k, v in self.exportados.items() if k not in antes}
                archivo.write_text(json.dumps(nuevos, ensure_ascii=False), encoding="utf-8")
            return ""
        salida = None
        if "norun" not in opciones:
            if "cache" in opciones:
                # Bloque visible caro: su salida se guarda en caché. Úsalo solo si los bloques
                # siguientes no dependen de las variables que define (en caché no se ejecuta).
                import hashlib
                archivo = CACHE / f"vis-{hashlib.sha1(codigo.encode('utf-8')).hexdigest()[:16]}.json"
                if archivo.exists():
                    salida = json.loads(archivo.read_text(encoding="utf-8"))["salida"]
                else:
                    salida = self.ejecutar(codigo, esperar_error="error" in opciones)
                    CACHE.mkdir(exist_ok=True)
                    archivo.write_text(json.dumps({"salida": salida}, ensure_ascii=False), encoding="utf-8")
            else:
                salida = self.ejecutar(codigo, esperar_error="error" in opciones)
        h = highlight(codigo, PythonLexer(), FORMATO)
        out = (f'<div class="codigo"><div class="c-cab"><span class="c-lang">🐍 Python</span>'
               f'<button class="c-copiar" type="button">Copiar</button></div>'
               f'<pre class="c-fuente"><code>{h}</code></pre>')
        if salida:
            out += (f'<div class="c-salida"><div class="c-salida-cab">Salida</div>'
                    f'<pre>{html.escape(salida)}</pre></div>')
        return out + "</div>"

    def render_widget(self, nombre, opciones):
        datos = {}
        for par in re.findall(r"([\w-]+)=([^\s]+)", opciones):
            datos[par[0]] = par[1]
        attr = html.escape(json.dumps(datos, ensure_ascii=False), quote=True)
        return (f'<div class="widget" data-widget="{nombre}" data-opciones="{attr}">'
                f'<div class="w-cargando">Cargando gráfica interactiva…</div></div>')

    def separar_id(self, cab):
        m = re.search(r"\s*\{#([\w-]+)\}\s*$", cab)
        if m:
            return cab[: m.start()].strip(), m.group(1)
        return cab, None

    def render_cont(self, tipo, cab, hijos):
        cab, id_ = self.separar_id(cab)
        if tipo == "pasos":
            return self.render_pasos(hijos)
        if tipo == "guiado":
            return self.render_guiado(cab, hijos, id_)
        if tipo == "ejercicio":
            return self.render_ejercicio(cab, hijos)
        if tipo == "cols":
            partes, actual = [], []
            for l in hijos:
                if l.strip() == "+++":
                    partes.append(actual)
                    actual = []
                else:
                    actual.append(l)
            partes.append(actual)
            cols = "".join(f'<div class="col">{self.render(self.parsear(p))}</div>' for p in partes)
            return f'<div class="cols cols-{len(partes)}">{cols}</div>'
        if tipo == "detalles":
            return (f'<details class="detalles"><summary>{self.md_inline(cab or "Ver más")}</summary>'
                    f'<div class="det-cuerpo">{self.render(self.parsear(hijos))}</div></details>')
        if tipo == "interactivo":
            nombre, _, titulo = cab.partition("|")
            nombre = nombre.strip()
            titulo = titulo.strip()
            leer = ""
            if "@@@" in [l.strip() for l in hijos]:
                k = [l.strip() for l in hijos].index("@@@")
                hijos, resto = hijos[:k], hijos[k + 1:]
                leer = (f'<div class="w-leer"><div class="w-leer-cab">📖 Cómo leer esta gráfica</div>'
                        f'{self.render(self.parsear(resto))}</div>')
            cuerpo = self.render(self.parsear(hijos))
            w = self.render_widget(nombre.split()[0], " ".join(nombre.split()[1:])) + leer
            if id_:
                self.ancla(id_, self.num_actual(), titulo or "Gráfica interactiva", "bloque")
            idattr = f' id="{id_}"' if id_ else ""
            return (f'<div class="bloque b-interactivo"{idattr}><div class="b-cab"><span class="b-ico">🎛️</span>'
                    f'<span class="b-tipo">Gráfica interactiva</span><span class="b-titulo">{self.md_inline(titulo)}</span></div>'
                    f'<div class="b-cuerpo">{cuerpo}{w}</div></div>')
        if tipo not in TIPOS:
            self.errores.append(f"Tipo de bloque desconocido: {tipo}")
            return ""
        ico, etiqueta = TIPOS[tipo]
        if id_:
            self.ancla(id_, self.num_actual(), cab or etiqueta, "bloque")
        cuerpo = self.render(self.parsear(hijos))
        idattr = f' id="{id_}"' if id_ else ""
        titulo = f'<span class="b-titulo">{self.md_inline(cab)}</span>' if cab else ""
        cabecera = f'<span class="b-ico">{ico}</span><span class="b-tipo">{etiqueta}</span>{titulo}'
        if tipo == "demo":
            return (f'<details class="bloque b-demo"{idattr} open><summary class="b-cab">{cabecera}'
                    f'<span class="b-plegar"></span></summary><div class="b-cuerpo">{cuerpo}</div></details>')
        return f'<div class="bloque b-{tipo}"{idattr}><div class="b-cab">{cabecera}</div><div class="b-cuerpo">{cuerpo}</div></div>'

    def num_actual(self):
        return f"{self.sec}.{self.sub}" if self.sub else str(self.sec)

    def render_pasos(self, hijos, dims=None):
        pasos = []
        for l in hijos:
            s = l.strip()
            if not s:
                continue
            if s.startswith("= "):
                pasos.append({"f": s[2:].strip(), "r": [], "usa": [], "da": []})
            elif s.startswith("@ ") and pasos:
                for parte in s[2:].split(";"):
                    clave, _, refs = parte.strip().partition(" ")
                    if clave in ("usa", "da"):
                        pasos[-1][clave] += self.expandir_celdas(refs, dims)
                    else:
                        self.errores.append(f"Marca de celdas desconocida: {s}")
            elif s.startswith("> "):
                pasos[-1]["r"].append(s[2:])
            elif pasos:
                pasos[-1]["r"].append(s)
        filas = []
        for k, p in enumerate(pasos, 1):
            self.math.append((p["f"], True))
            f = f"@@D{len(self.math) - 1}@@"
            r = self.md_inline(" ".join(p["r"])) if p["r"] else ""
            visible = len(re.sub(r"\\[A-Za-z]+|[{}_^]|\\[,;!: ]", "", p["f"]))
            clase = "paso largo" if visible > 48 else "paso"
            datos = ""
            if dims is not None:
                datos = f' data-usa="{" ".join(p["usa"])}" data-da="{" ".join(p["da"])}" tabindex="0"'
            filas.append(f'<div class="{clase}"{datos}><div class="p-num">{k}</div><div class="p-formula">{f}</div>'
                         f'<div class="p-razon">{r}</div></div>')
        return f'<div class="pasos{" g-pasos" if dims is not None else ""}">{"".join(filas)}</div>'

    def expandir_celdas(self, refs, dims):
        """'c2[1-6] t2.c3[1,4] c*[7]' → ids de celdas (y de los encabezados de esas columnas)."""
        ids = []
        for m in re.finditer(r"(?:t(\d+)\.)?c(\d+|\*)\[([^\]]+)\]", refs):
            t = int(m.group(1) or 1)
            if not dims or t > len(dims):
                self.errores.append(f"Tabla inexistente en marca de celdas: {refs}")
                continue
            nf, nc = dims[t - 1]
            cols = range(1, nc + 1) if m.group(2) == "*" else [int(m.group(2))]
            filas = []
            for parte in m.group(3).split(","):
                parte = parte.strip()
                if parte == "*":
                    filas += list(range(1, nf + 1))
                elif "-" in parte:
                    a, z = parte.split("-")
                    filas += list(range(int(a), int(z) + 1))
                elif parte:
                    filas.append(int(parte))
            for c in cols:
                if c > nc:
                    self.errores.append(f"Columna {c} fuera de la tabla {t}: {refs}")
                ids.append(f"t{t}-h{c}")
                for f in filas:
                    if f > nf:
                        self.errores.append(f"Fila {f} fuera de la tabla {t}: {refs}")
                    ids.append(f"t{t}-r{f}-c{c}")
        return list(dict.fromkeys(ids))

    def render_guiado(self, cab, hijos, id_):
        lineas = [l.rstrip() for l in hijos]
        k = [l.strip() for l in lineas].index("---")
        antes, pasos = lineas[:k], lineas[k + 1:]
        celdas = lambda l: [x.strip() for x in l.strip().strip("|").split("|")]
        partes, dims, buf, i = [], [], [], 0
        while i < len(antes):
            l = antes[i]
            if l.strip().startswith("|") and i + 1 < len(antes) and re.match(r"^\s*\|[\s:|-]+\|\s*$", antes[i + 1]):
                if buf:
                    partes.append(self.render(self.parsear(buf)))
                    buf = []
                n = len(dims) + 1
                enc = celdas(l)
                i += 2
                filas = []
                while i < len(antes) and antes[i].strip().startswith("|"):
                    filas.append(celdas(antes[i]))
                    i += 1
                dims.append((len(filas), len(enc)))
                h = "".join(f'<th data-celda="t{n}-h{c}">{self.md_inline(x)}</th>' for c, x in enumerate(enc, 1))
                cuerpo = ""
                for r, fila in enumerate(filas, 1):
                    clase = ' class="suma"' if fila and fila[0].startswith("**") else ""
                    cuerpo += f"<tr{clase}>" + "".join(
                        f'<td data-celda="t{n}-r{r}-c{c}">{self.md_inline(x)}</td>' for c, x in enumerate(fila, 1)) + "</tr>"
                partes.append(f'<div class="tabla g-tabla"><table data-tabla="{n}"><thead><tr>{h}</tr></thead><tbody>{cuerpo}</tbody></table></div>')
            else:
                buf.append(l)
                i += 1
        if buf:
            partes.append(self.render(self.parsear(buf)))
        if id_:
            self.ancla(id_, self.num_actual(), cab, "bloque")
        pas = self.render_pasos(pasos, dims)
        idattr = f' id="{id_}"' if id_ else ""
        control = ('<div class="g-control"><button type="button" class="g-iniciar">▶ Recorrer paso a paso</button>'
                   '<button type="button" class="g-ant" disabled>◀ Anterior</button><span class="g-pos">Pasa el cursor por un paso para ver qué datos usa</span>'
                   '<button type="button" class="g-sig" disabled>Siguiente ▶</button><button type="button" class="g-todo" disabled>Ver todo</button></div>')
        leyenda = ('<div class="g-leyenda"><span class="g-l-usa">datos que se usan</span>'
                   '<span class="g-l-da">resultado del paso</span></div>')
        return (f'<div class="bloque b-ejemplo guiado"{idattr}><div class="b-cab"><span class="b-ico">✍️</span>'
                f'<span class="b-tipo">Ejemplo a mano · guiado</span><span class="b-titulo">{self.md_inline(cab)}</span></div>'
                f'<div class="b-cuerpo"><div class="g-fijo">{"".join(partes)}{leyenda}{control}<div class="g-espejo" hidden></div></div>{pas}</div></div>')

    def render_ejercicio(self, cab, hijos):
        self.n_ejercicio += 1
        nivel, _, tema = cab.partition("|")
        nivel = nivel.strip() or "Básico"
        clase = NIVELES.get(nivel.lower(), "basico")
        if "---" in [l.strip() for l in hijos]:
            k = [l.strip() for l in hijos].index("---")
            enun, expl = hijos[:k], hijos[k + 1:]
        else:
            enun, expl = hijos, []
        opciones, texto, correcta = [], [], None
        for l in enun:
            m = re.match(r"^- \[( |x)\] (.*)$", l)
            if m:
                if m.group(1) == "x":
                    correcta = len(opciones)
                opciones.append(m.group(2))
            else:
                texto.append(l)
        n = self.n_ejercicio
        partes = [f'<div class="ejercicio" id="ej-{n}" data-correcta="{"" if correcta is None else correcta}">',
                  f'<div class="ej-cab"><span class="ej-num">Ejercicio {n}</span>'
                  f'<span class="ej-nivel nivel-{clase}">{html.escape(nivel)}</span>'
                  f'<span class="ej-tema">{self.md_inline(tema.strip()) if tema.strip() else ""}</span></div>',
                  f'<div class="ej-enunciado">{self.render(self.parsear(texto))}</div>']
        if opciones:
            botones = "".join(
                f'<button type="button" class="opcion" data-i="{i}"><span class="letra">{chr(65 + i)}</span>'
                f'<span class="op-txt">{self.md_inline(o)}</span></button>' for i, o in enumerate(opciones))
            partes.append(f'<div class="ej-opciones">{botones}</div>')
            if correcta is None:
                self.errores.append(f"Ejercicio {n} sin respuesta marcada")
        etiqueta = "Ver respuesta" if opciones else "Ver solución paso a paso"
        partes.append(f'<div class="ej-acciones"><button type="button" class="btn-respuesta">{etiqueta}</button></div>')
        partes.append(f'<div class="ej-solucion" hidden>{self.render(self.parsear(expl))}</div></div>')
        return "".join(partes)


# ----------------------------------------------------------------------------
# KaTeX (Node)
# ----------------------------------------------------------------------------
def renderizar_katex(items):
    entrada = json.dumps({"macros": MACROS, "items": items})
    r = subprocess.run(["node", str(AQUI / "katex_render.js")], input=entrada, capture_output=True,
                       text=True, env={**os.environ})
    if r.returncode != 0:
        sys.exit("Error en KaTeX:\n" + r.stderr)
    datos = json.loads(r.stdout)
    return datos["out"], datos["errores"]


def construir(clave, externos):
    cfg = UNIDADES[clave]
    SALIDA = RAIZ / cfg["salida"]
    doc = Documento()
    archivos = sorted((AQUI / cfg["carpeta"]).glob("*.md"))
    cuerpo = []
    for a in archivos:
        cuerpo.append(doc.render(doc.parsear(a.read_text(encoding="utf-8").splitlines())))
    cuerpo.append(doc.cerrar_seccion())
    html_cuerpo = "\n".join(cuerpo)

    # ---- glosario de símbolos ----
    glosario = json.loads((AQUI / "glosario.json").read_text(encoding="utf-8"))
    claves = list(glosario)
    extra = [(re.compile(p), k) for p, k in cfg.get("reglas", [])]
    items = [[autotip(t, extra, cfg.get("renombrar")), d] for t, d in doc.math] + [[glosario[k][0], False] for k in claves]
    rend, errores = renderizar_katex(items)
    for tex, err in errores:
        doc.errores.append(f"KaTeX: {err}\n   en: {tex}")
    formulas, simbolos = rend[: len(doc.math)], rend[len(doc.math):]
    glos_json = {k: {"s": simbolos[i], "n": glosario[k][1], "d": glosario[k][2]} for i, k in enumerate(claves)}

    def sust_d(m):
        return f'<div class="ecuacion">{formulas[int(m.group(1))]}</div>'

    html_cuerpo = re.sub(r"<p>\s*@@D(\d+)@@\s*</p>", sust_d, html_cuerpo)
    html_cuerpo = re.sub(r"@@D(\d+)@@", sust_d, html_cuerpo)
    html_cuerpo = re.sub(r"@@I(\d+)@@", lambda m: formulas[int(m.group(1))], html_cuerpo)

    def sust_r(m):
        id_, texto, orden = doc.refs[int(m.group(1))]
        if ":" in id_:
            pref, rid = id_.split(":", 1)
            if pref not in externos or rid not in externos[pref]["anclas"]:
                doc.errores.append(f"Referencia externa inexistente: {id_}")
                return f"[[{id_}]]"
            a = externos[pref]["anclas"][rid]
            titulo = re.sub(r"^[^\w$¿¡(]+\s*", "", a["titulo"])
            etiqueta = texto or (f'{externos[pref]["nombre"]} · {a["num"]} {titulo}' if a["num"] else f'{externos[pref]["nombre"]} · {titulo}')
            return (f'<a class="ref ref-unidad" href="{externos[pref]["archivo"]}#{rid}" title="Abre la {externos[pref]["nombre"]}">'
                    f'<span class="ref-flecha">⇠</span> {titulo_html(etiqueta)}</a>')
        if id_ not in doc.anclas:
            if os.environ.get("GUIA_BORRADOR"):          # mientras se escribe la unidad
                print(f"  (pendiente: [[{id_}]])")
                return f'<a class="ref ref-adelante" href="#{id_}"><span class="ref-flecha">↪</span> {html.escape(texto or id_)}</a>'
            doc.errores.append(f"Referencia a id inexistente: {id_}")
            return f"[[{id_}]]"
        a = doc.anclas[id_]
        flecha = "↩" if a["orden"] <= orden else "↪"
        if texto:
            etiqueta = texto
        else:
            titulo = re.sub(r"^[^\w$¿¡(]+\s*", "", a["titulo"])
            etiqueta = f'{a["num"]} {titulo}' if a["num"] else titulo
        clase = "ref ref-atras" if flecha == "↩" else "ref ref-adelante"
        return f'<a class="{clase}" href="#{id_}"><span class="ref-flecha">{flecha}</span> {titulo_html(etiqueta)}</a>'

    html_cuerpo = re.sub(r"@@R(\d+)@@", sust_r, html_cuerpo)
    # El texto va en un <span> para que el flex de la etiqueta no separe cada <code> en su propia columna
    html_cuerpo = html_cuerpo.replace("<li>[ ] ", '<li class="check"><label><input type="checkbox"> <span>')
    html_cuerpo = re.sub(r'(<li class="check"><label><input type="checkbox"> <span>.*?)</li>', r"\1</span></label></li>", html_cuerpo)
    html_cuerpo = re.sub(r"<table>(.*?)</table>", r'<div class="tabla"><table>\1</table></div>', html_cuerpo, flags=re.S)

    # ---- índice lateral y mapa ----
    toc = []
    for s in doc.toc:
        subs = "".join(f'<li><a href="#{x["id"]}" data-id="{x["id"]}"><span class="t-num">{x["num"]}</span>'
                       f'{titulo_html(x["titulo"])}</a></li>' for x in s["subs"])
        toc.append(f'<li class="t-sec" data-seccion="{s["id"]}"><a href="#{s["id"]}" data-id="{s["id"]}">'
                   f'<span class="t-num">{s["num"]}</span>{titulo_html(s["titulo"])}'
                   f'<span class="t-check" aria-hidden="true"></span></a><ul>{subs}</ul></li>')
    mapa = "".join(
        f'<a class="mapa-tarjeta" href="#{m["id"]}"><span class="mapa-num">{m["num"]}</span>'
        f'<span class="mapa-titulo">{titulo_html(m["titulo"])}</span><span class="mapa-texto">{html.escape(m["texto"])}</span></a>'
        for m in doc.mapa)
    html_cuerpo = html_cuerpo.replace("@@MAPA@@", mapa)

    # ---- validación de símbolos ----
    usados = set(re.findall(r'data-tip="([^"]+)"', html_cuerpo))
    faltan = sorted(usados - set(glosario))
    if faltan:
        doc.errores.append("Claves de glosario sin definir: " + ", ".join(faltan))

    plantilla = (AQUI / "plantilla.html").read_text(encoding="utf-8")
    nav = "".join(
        (f'<a class="unidad activa" href="#inicio">{c["nombre"]}</a>' if k == clave else f'<a class="unidad" href="{c["salida"]}">{c["nombre"]}</a>')
        for k, c in UNIDADES.items())
    scripts = "\n".join(f'<script src="{x}" defer></script>' for x in cfg["scripts"])
    final = (plantilla.replace("{{INDICE}}", "\n".join(toc))
             .replace("{{TITULO_PAGINA}}", cfg["titulo_pagina"]).replace("{{DESCRIPCION}}", cfg["descripcion"])
             .replace("{{NAV}}", nav).replace("{{UNIDAD}}", clave).replace("{{NUMERO}}", cfg["numero"])
             .replace("{{SCRIPTS}}", scripts)
             .replace("{{DATOS}}", json.dumps(doc.exportados, ensure_ascii=False).replace("</", "<\\/"))
             .replace("{{CONTENIDO}}", html_cuerpo)
             .replace("{{GLOSARIO}}", json.dumps(glos_json, ensure_ascii=False).replace("</", "<\\/"))
             .replace("{{MACROS}}", json.dumps(MACROS).replace("</", "<\\/"))
             .replace("{{N_EJERCICIOS}}", str(doc.n_ejercicio)))
    SALIDA.write_text(final, encoding="utf-8")

    print(f"✓ {SALIDA.relative_to(RAIZ)}: {len(final) / 1024:.0f} KB · {len(doc.math)} fórmulas · "
          f"{len(doc.toc)} secciones · {doc.n_ejercicio} ejercicios · {len(usados)} símbolos explicados")
    sin_uso = sorted(set(glosario) - usados)
    if sin_uso:
        print("  (claves de glosario sin usar: " + ", ".join(sin_uso) + ")")
    if doc.errores:
        print("\n".join("✗ " + e for e in doc.errores))
        sys.exit(1)
    return doc


def main():
    pedidas = sys.argv[1:] or list(UNIDADES)
    externos = {}
    CACHE.mkdir(exist_ok=True)
    for clave in UNIDADES:
        copia = CACHE / f"anclas_{clave}.json"
        if clave not in pedidas:
            # Las anclas de las unidades que no se regeneran salen de la caché (para los enlaces ⇠ entre unidades)
            if copia.exists():
                externos[clave] = {"anclas": json.loads(copia.read_text(encoding="utf-8")),
                                   "archivo": UNIDADES[clave]["salida"], "nombre": UNIDADES[clave]["nombre"]}
            continue
        doc = construir(clave, externos)
        copia.write_text(json.dumps(doc.anclas, ensure_ascii=False), encoding="utf-8")
        externos[clave] = {"anclas": doc.anclas, "archivo": UNIDADES[clave]["salida"], "nombre": UNIDADES[clave]["nombre"]}
    return externos


if __name__ == "__main__":
    main()
