#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Genera la portada (index.html), las tres unidades, el Laboratorio y las páginas de práctica
(preguntas tipo, práctica y repaso) a partir de los archivos Markdown de fuente/.

  • Las fórmulas ($...$ y $$...$$) se pre-renderizan con KaTeX (Node.js) y a
    los símbolos se les agrega una explicación que aparece al pasar el cursor.
  • Los bloques ```python se EJECUTAN y su salida real se muestra debajo.
  • [[id]] crea un enlace a otra sección (↩ si está antes, ↪ si está después).
  • Un título con «.prof» ({#id .prof}) marca la sección o el subtema como profundización:
    el modo ETS lo pliega y no cuenta en el tiempo esencial.

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
    # ---------------- Portada: mapa del temario, ruta de estudio y accesos ----------------
    "inicio": {"carpeta": "inicio", "salida": "index.html", "numero": "", "nombre": "Inicio",
               "titulo_pagina": "Guía de estudio · Análisis de Series de Tiempo (ETS)",
               "descripcion": "Portada de la guía de estudio para el ETS de Análisis de Series de Tiempo: mapa del temario del IPN y de la guía oficial, ruta de estudio por sesiones, modo ETS, preguntas tipo, simulacro y hojas de repaso.",
               "scripts": [], "indice_titulo": "Inicio", "sin_estudiada": True, "sin_tiempo": True,
               "pie": "Guía de estudio · Análisis de Series de Tiempo. El avance se guarda en este navegador."},
    "u1": {"carpeta": "unidad1", "salida": "unidad1.html", "numero": "I", "nombre": "Unidad I", "formulario": "formulario",
           "titulo_pagina": "Unidad I · Características de series de tiempo — Guía de estudio",
           "descripcion": "Guía de estudio interactiva de la Unidad I de Análisis de Series de Tiempo: componentes, estacionariedad, raíz unitaria, ADF, KPSS, ACF, PACF y Ljung-Box, con demostraciones paso a paso, ejemplos a mano, código Python y gráficas interactivas.",
           "scripts": []},
    "u2": {"carpeta": "unidad2", "salida": "unidad2.html", "numero": "II", "nombre": "Unidad II", "formulario": "formulario2",
           "titulo_pagina": "Unidad II · Procesos lineales: AR, MA, ARMA, ARIMA y SARIMA(X) — Guía de estudio",
           "descripcion": "Guía de estudio interactiva de la Unidad II de Análisis de Series de Tiempo: pronósticos de referencia con statsforecast, operador rezago, AR, MA, ARMA, ARIMA, SARIMA, SARIMAX, máxima verosimilitud, AIC/BIC, diagnóstico de residuos, ARCH, validación temporal y métricas de pronóstico.",
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
    "u3": {"carpeta": "unidad3", "salida": "unidad3.html", "numero": "III", "nombre": "Unidad III", "formulario": "formulario3",
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
    # ---------------- Laboratorio: flujos completos con un dataset ----------------
    "lab": {"carpeta": "laboratorio/inicio", "salida": "laboratorio.html", "numero": "Lab", "nombre": "Laboratorio",
            "titulo_pagina": "Laboratorio · Análisis completos de series de tiempo — Guía de estudio",
            "descripcion": "Laboratorio de Análisis de Series de Tiempo: elige un dataset y recorre un análisis completo, paso a paso, con las herramientas de las tres unidades, código Python con su salida real y prueba y error.",
            "scripts": ["assets/js/lab.js"], "indice_titulo": "Laboratorio", "sin_tiempo": True,
            "pie": "Laboratorio · Análisis de Series de Tiempo. Todo el código se ejecuta al generar la página; las gráficas muestran sus resultados reales."},
    "lab-manchas": {"carpeta": "laboratorio/manchas_solares", "salida": "lab-manchas-solares.html", "numero": "Lab",
                    "nombre": "Laboratorio · Manchas solares", "en_nav": False, "nav_activo": "lab",
                    "titulo_pagina": "Laboratorio · Manchas solares (1700–2008) — Guía de estudio",
                    "descripcion": "Análisis completo de las manchas solares anuales 1700–2008: exploración, transformación, descomposición, estacionariedad, ACF/PACF, modelos AR/ARMA/SARIMA, validación cruzada, periodograma, espectro AR y filtros HP y Baxter–King, paso a paso con código Python.",
                    "scripts": ["assets/js/lab.js"], "indice_titulo": "Flujo · Manchas solares",
                    "pie": "Laboratorio · Manchas solares. Todo el código se ejecuta al generar la página; las gráficas y tablas muestran sus resultados reales.",
                    "reglas": [(r"\\hat\{y\}", "yhat"), (r"\\omega(?![A-Za-z_])", "omega3"), (r"\\lambda(?![A-Za-z])", "lambda-hp")]},
    "lab-viento": {"carpeta": "laboratorio/viento", "salida": "lab-viento.html", "numero": "Lab",
                   "nombre": "Laboratorio · Viento en un parque eólico", "en_nav": False, "nav_activo": "lab",
                   "titulo_pagina": "Laboratorio · Viento de un aerogenerador (SCADA 2019) — Guía de estudio",
                   "descripcion": "Flujo completo con datos SCADA reales de un parque eólico en 2019: reparación del archivo, validación temporal, limpieza, imputación, análisis exploratorio, descomposición, estacionariedad, espectro, coherencia, modelos de referencia, SARIMA, Holt–Winters, regresión armónica, Ridge, gradient boosting y redes neuronales, con validación, prueba y diagnóstico de residuos.",
                   "scripts": ["assets/js/lab.js"], "indice_titulo": "Flujo · Viento (SCADA)",
                   "pie": "Laboratorio · Viento en un parque eólico. Datos SCADA proporcionados en clase. Todo el código se ejecuta al generar la página; las gráficas y tablas muestran sus resultados reales.",
                   "reglas": [(r"\\hat\{y\}", "yhat"), (r"\\omega(?![A-Za-z_])", "omega3")]},
    "lab-viento-u": {"carpeta": "laboratorio/viento_temario", "salida": "lab-viento-unidades.html", "numero": "Lab",
                     "nombre": "Laboratorio · Viento por unidades", "en_nav": False, "nav_activo": "lab",
                     "titulo_pagina": "Laboratorio · Viento por unidades: limpieza, EDA y las tres unidades con datos SCADA — Guía de estudio",
                     "descripcion": "Los datos SCADA de un aerogenerador en 2019 analizados en el orden del temario: limpieza, exploración, Unidad I (visualización, componentes, STL, estacionariedad, ADF, KPSS, ACF, Ljung–Box), Unidad II (referencias, AR, MA, ARMA, ARIMA, SARIMA, diagnóstico, ARCH, métricas) y Unidad III (periodograma, espectros, coherencia y filtros), con evaluación final y comparación.",
                     "scripts": ["assets/js/lab.js"], "indice_titulo": "Viento · por unidades",
                     "pie": "Laboratorio · Viento por unidades. Datos SCADA proporcionados en clase. Todo el código se ejecuta al generar la página; las gráficas y tablas muestran sus resultados reales.",
                     "reglas": [(r"\\hat\{y\}", "yhat"), (r"\\omega(?![A-Za-z_])", "omega3")]},
    # ---------------- Práctica para el examen ----------------
    "preguntas": {"carpeta": "preguntas", "salida": "preguntas-tipo.html", "numero": "", "nombre": "Preguntas tipo",
                  "titulo_pagina": "Preguntas tipo del ETS con respuesta modelo — Guía de estudio",
                  "descripcion": "Las 21 preguntas tipo de la Guía para ETS de Análisis de Series de Tiempo, cada una con su respuesta modelo redactada como en el examen, los puntos que debe tener y el enlace al tema.",
                  "scripts": [], "indice_titulo": "Preguntas tipo", "sin_estudiada": True,
                  "pie": "Preguntas tipo · Análisis de Series de Tiempo. Tus respuestas y tu autocalificación se guardan en este navegador.",
                  "reglas": [(r"\\hat\{y\}", "yhat"), (r"\\omega(?![A-Za-z_])", "omega3")]},
    "practica": {"carpeta": "practica", "salida": "practica.html", "numero": "", "nombre": "Práctica",
                 "titulo_pagina": "Práctica: simulacro, repaso de errores e interpretar salidas — Guía de estudio",
                 "descripcion": "Simulacro de examen con ejercicios al azar de las tres unidades, repaso de los ejercicios fallados y generador de salidas para interpretar (ACF/PACF, ADF y KPSS, Ljung–Box, summary de SARIMAX y periodograma).",
                 "scripts": ["assets/js/ts2.js", "assets/js/ts3.js", "assets/datos/banco-u1.js", "assets/datos/banco-u2.js",
                             "assets/datos/banco-u3.js", "assets/datos/banco-preguntas.js", "assets/js/practica.js"],
                 "indice_titulo": "Práctica", "sin_estudiada": True, "sin_tiempo": True,
                 "pie": "Práctica · Análisis de Series de Tiempo. Las salidas para interpretar se generan en tu navegador con las mismas fórmulas que statsmodels y scipy."},
    "repaso": {"carpeta": "repaso", "salida": "repaso.html", "numero": "", "nombre": "Repaso",
               "titulo_pagina": "Hojas de repaso por unidad — Guía de estudio",
               "descripcion": "Hojas de repaso de las tres unidades de Análisis de Series de Tiempo: lo que debes llevarte de cada tema, fórmulas, tablas de hipótesis, flujo de análisis y errores comunes, listas para leer de un vistazo o imprimir.",
               "scripts": [], "indice_titulo": "Hojas de repaso", "sin_estudiada": True, "sin_tiempo": True,
               "pie": "Hojas de repaso · Análisis de Series de Tiempo. Se arman con los resúmenes y formularios de cada unidad."},
}
# Las páginas que usan datos de otras (anclas, tiempos, resúmenes, ejercicios) se generan después de ellas
ORDEN_BUILD = ["u1", "u2", "u3", "lab", "lab-manchas", "lab-viento", "lab-viento-u", "preguntas", "practica", "repaso", "inicio"]
DATOS = RAIZ / "assets" / "datos"
CORTO = {"u1": "U I", "u2": "U II", "u3": "U III", "lab": "Lab", "lab-manchas": "Lab", "lab-viento": "Lab", "lab-viento-u": "Lab", "preguntas": "Preguntas",
         "practica": "Práctica", "repaso": "Repaso", "inicio": "Inicio"}

# Estado de cada pastilla del Laboratorio: clase CSS, icono y etiqueta
ESTADOS = {"azul": ("🔵", "Exploración"), "verde": ("✅", "Logrado"), "amarillo": ("🟡", "Funciona con reservas"),
           "rojo": ("❌", "Descartado")}

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


def titulo_plano(texto):
    """Título sin HTML ni emojis iniciales (para el buscador y los datos de la práctica)."""
    t = html.unescape(re.sub(r"<[^>]+>", "", titulo_html(texto)))
    return re.sub(r"^[^\w$¿¡(«]+\s*", "", t).strip()


def minutos(m, paso=5):
    """Redondea un tiempo de estudio: múltiplos de 5 minutos (mínimo 5) o al minuto si paso = 1."""
    if paso == 1:
        return max(1, int(round(m)))
    return max(5, int(round(m / paso)) * paso)


def texto_minutos(m):
    m = int(m)
    if m < 60:
        return f"{m} min"
    h, r = divmod(m, 60)
    return f"{h} h" if r == 0 else f"{h} h {r} min"


def peso_nodo(n):
    """Minutos de estudio que aporta un nodo: lectura a unas 170 palabras por minuto más un extra por tipo de bloque."""
    pal = lambda t: len(re.findall(r"\S+", t))
    if n[0] == "md":
        return pal(n[1]) / 170
    if n[0] == "code":
        return 0 if "oculto" in n[1].split() else 0.4 + pal(n[2]) / 250
    if n[0] == "widget":
        return 1.5
    if n[0] == "cont":
        extra = {"guiado": 2, "demo": 1, "interactivo": 2, "ejercicio": 0.8, "abierta": 3, "ejemplo": 0.5, "pastilla": 1.5}
        return pal("\n".join(n[3])) / 170 + extra.get(n[1], 0)
    return 0


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
    def __init__(self, clave="", cfg=None, externos=None):
        self.clave = clave
        self.cfg = cfg or {}
        self.externos = externos or {}
        self.sec_id = None          # id de la sección (##) en curso
        self.sub_id = None          # id del subtema (###) en curso
        self.sec_prof = False       # la sección en curso es de profundización
        self.sub_prof = False       # el subtema en curso es de profundización
        self.sub_abierta = False
        self.t_sec = {}             # id de sección → [minutos esenciales, minutos totales]
        self.t_sub = {}             # id de subtema → minutos
        self.ejercicios = []        # datos de cada ejercicio (para la práctica)
        self.n_abierta = 0
        self.busq = []              # entradas extra del buscador (definiciones)
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
        self.pastillas = []
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

    def valores(self, texto):
        """{{=expresión|formato}} se sustituye por el valor que tiene en Python en ese punto del documento."""
        def rep(m):
            expr, _, fmt = m.group(1).partition("|")
            try:
                v = eval(expr, self.ns)
                return format(v, fmt.strip()) if fmt.strip() else str(v)
            except Exception as e:
                self.errores.append(f"No se pudo evaluar {{{{={m.group(1)}}}}}: {type(e).__name__}: {e}")
                return "??"
        return re.sub(r"\{\{=(.+?)\}\}", rep, texto)

    def md(self, texto):
        return md.render(self.proteger(self.valores(texto)))

    def md_inline(self, texto):
        return md.renderInline(self.proteger(self.valores(texto)))

    def ancla(self, id_, num, titulo, tipo):
        if id_ in self.anclas:
            self.errores.append(f"id repetido: {id_}")
        self.orden += 1
        self.anclas[id_] = {"num": num, "titulo": titulo, "tipo": tipo, "orden": self.orden,
                            "sec": self.sec_id, "prof": bool(self.sec_prof or self.sub_prof)}

    def info_tema(self, tema):
        """Datos del primer [[enlace]] de un texto: unidad, id, sección y si es de profundización."""
        m = re.search(r"\[\[([\w:-]+)", tema or "")
        if not m:
            return None
        id_ = m.group(1)
        if ":" in id_:
            pref, rid = id_.split(":", 1)
            a = self.externos.get(pref, {}).get("anclas", {}).get(rid)
            return {"u": pref, "id": rid, "sec": a.get("sec"), "prof": bool(a.get("prof"))} if a else None
        a = self.anclas.get(id_)
        return {"u": self.clave, "id": id_, "sec": a.get("sec"), "prof": bool(a.get("prof"))} if a else None

    def calcular_tiempos(self, listas):
        """Recorre los nodos de todos los archivos y suma el tiempo de estudio por sección y por subtema."""
        sec = sub = None
        sec_prof = sub_prof = False
        for nodos in listas:
            for n in nodos:
                if n[0] == "h":
                    id_ = n[3] or slug(n[2])
                    if n[1] == 2:
                        sec, sub, sec_prof, sub_prof = id_, None, n[4], False
                        self.t_sec[sec] = [0.0, 0.0]
                    elif n[1] == 3:
                        sub, sub_prof = id_, n[4]
                        self.t_sub[sub] = 0.0
                    continue
                if sec is None:
                    continue
                m = peso_nodo(n)
                self.t_sec[sec][1] += m
                if not (sec_prof or sub_prof):
                    self.t_sec[sec][0] += m
                if sub is not None:
                    self.t_sub[sub] += m

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
            m = re.match(r"^(#{2,4}) (.+?)(?:\s*\{#([\w-]+)(\s+\.prof)?\})?\s*$", l)
            if m:
                vaciar()
                nodos.append(("h", len(m.group(1)), m.group(2), m.group(3), bool(m.group(4))))
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

    def boton_prof(self, id_, titulo, nivel):
        """Botón que queda a la vista en el modo ETS en lugar de un bloque de profundización."""
        que = "Sección de profundización" if nivel == 2 else "Profundización"
        return (f'<button type="button" class="prof-stub" data-para="{id_}" aria-expanded="false">'
                f'<span class="ps-ico" aria-hidden="true">➕</span><span class="ps-txt"><b>{que}</b> · {titulo_html(titulo)}</span>'
                f'<span class="ps-min">@@TP:{id_}@@</span><span class="ps-acc"></span></button>')

    def render_h(self, nivel, titulo, id_, prof=False):
        id_ = id_ or slug(titulo)
        if nivel == 2:
            self.sec += 1
            self.sub = 0
            num = str(self.sec)
            previo = self.cerrar_seccion()
            self.sec_id, self.sub_id, self.sec_prof, self.sub_prof = id_, None, prof, False
            self.ancla(id_, num, titulo, "seccion")
            self.abierta = True
            self.toc.append({"id": id_, "num": num, "titulo": titulo, "subs": [], "prof": prof})
            self.mapa.append({"id": id_, "num": num, "titulo": titulo, "texto": ""})
            t = self.md_inline(titulo)
            clase = "seccion prof" if prof else "seccion"
            boton = self.boton_prof(id_, titulo, 2) if prof else ""
            return (f'{previo}<section class="{clase}" data-seccion="{id_}">{boton}'
                    f'<h2 id="{id_}"><span class="h-num">{num}</span><span class="h-txt">{t}</span></h2>@@T:{id_}@@')
        if nivel == 3:
            self.sub += 1
            num = f"{self.sec}.{self.sub}"
            previo = self.cerrar_sub()
            self.sub_id, self.sub_prof = id_, prof
            self.ancla(id_, num, titulo, "sub")
            self.toc[-1]["subs"].append({"id": id_, "num": num, "titulo": titulo, "prof": bool(prof or self.sec_prof)})
            self.sub_abierta = True
            clase = "sub prof" if prof else "sub"
            boton = self.boton_prof(id_, titulo, 3) if prof else ""
            return (f'{previo}<!--SUB {id_}--><div class="{clase}" data-sub="{id_}">{boton}'
                    f'<h3 id="{id_}"><span class="h-num">{num}</span> {self.md_inline(titulo)}</h3>')
        self.ancla(id_, None, titulo, "menor")
        return f'<h4 id="{id_}">{self.md_inline(titulo)}</h4>'

    def cerrar_sub(self):
        if not self.sub_abierta:
            return ""
        self.sub_abierta = False
        self.sub_prof = False
        self.sub_id = None
        return "</div><!--/SUB-->"

    def cerrar_seccion(self):
        if not self.abierta:
            return ""
        s = self.toc[-1]
        self.abierta = False
        previo = self.cerrar_sub()
        if self.cfg.get("sin_estudiada"):
            return f"{previo}</section>"
        return (f'{previo}<div class="fin-seccion"><button class="btn-estudiada" data-seccion="{s["id"]}">'
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
                if issubclass(a.category, (DeprecationWarning, PendingDeprecationWarning, FutureWarning, SyntaxWarning)):
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

    def render_code(self, info, codigo, separar=False):
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
        if separar:
            cod = (f'<div class="codigo"><div class="c-cab"><span class="c-lang">🐍 Python</span>'
                   f'<button class="c-copiar" type="button">Copiar</button></div>'
                   f'<pre class="c-fuente"><code>{h}</code></pre></div>')
            sal = (f'<div class="codigo c-solo-salida"><div class="c-salida"><div class="c-salida-cab">Salida del código</div>'
                   f'<pre>{html.escape(salida)}</pre></div></div>') if salida else ""
            return cod, sal
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
        if tipo == "pastilla":
            return self.render_pastilla(cab, hijos, id_)
        if tipo == "ejercicio":
            return self.render_ejercicio(cab, hijos)
        if tipo == "abierta":
            return self.render_abierta(cab, hijos, id_)
        if tipo == "temario":
            return self.render_temario(cab, hijos)
        if tipo == "ruta":
            return self.render_ruta(hijos)
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
        if tipo == "definicion" and cab:
            self.busq.append({"t": cab, "i": id_ or self.sub_id or self.sec_id, "p": bool(self.sec_prof or self.sub_prof)})
        if tipo == "demo":
            return (f'<details class="bloque b-demo"{idattr} open><summary class="b-cab">{cabecera}'
                    f'<span class="b-plegar"></span></summary><div class="b-cuerpo">{cuerpo}</div></details>')
        bloque = f'<div class="bloque b-{tipo}"{idattr}><div class="b-cab">{cabecera}</div><div class="b-cuerpo">{cuerpo}</div></div>'
        if tipo == "resumen":      # las hojas de repaso reúnen estos bloques
            # Sin id es el resumen de la sección (aunque caiga dentro de su último subtema);
            # con id pertenece al subtema en curso y hereda su marca de profundización.
            prof = self.sec_prof or (bool(id_) and self.sub_prof)
            return f'<!--RS {self.sec_id}|{int(bool(prof))}-->{bloque}<!--/RS-->'
        return bloque

    def render_pastilla(self, cab, hijos, id_):
        """Un paso del Laboratorio: objetivo, parámetros, código plegable, resultado, lectura y decisión."""
        partes = [p.strip() for p in cab.split("|")]
        estado, titulo = partes[0], partes[1] if len(partes) > 1 else "Paso"
        repasos = partes[2].split() if len(partes) > 2 else []
        if estado not in ESTADOS:
            self.errores.append(f"Estado de pastilla desconocido: {estado}")
            estado = "azul"
        ico, etiqueta = ESTADOS[estado]
        n = len(self.pastillas) + 1
        id_ = id_ or f"paso-{n}"
        self.sub += 1
        self.ancla(id_, str(n), f"Paso {n} · {titulo}", "sub")
        corto = re.sub(r"^Aplicar\s*·\s*", "", titulo)
        self.toc[-1]["subs"].append({"id": id_, "num": str(n), "titulo": corto, "estado": estado})
        self.pastillas.append({"id": id_, "n": n, "titulo": corto, "estado": estado, "fase": self.toc[-1]["id"]})
        # Secciones separadas por líneas «@@ Nombre»
        secciones, actual, nombre = [], [], "Objetivo"
        for l in hijos:
            m = re.match(r"^@@\s+(.+?)\s*$", l)
            if m:
                secciones.append((nombre, actual))
                nombre, actual = m.group(1), []
            else:
                actual.append(l)
        secciones.append((nombre, actual))
        ETQ = {"Objetivo": "🎯 Objetivo", "Parámetros": "⚙️ Parámetros y por qué", "Código": "🐍 Código",
               "Resultado": "📊 Resultado", "Lectura": "🔎 Qué nos dicen los valores", "Decisión": "➡️ Decisión y siguiente paso"}
        html_sec, salidas = [], []
        for nom, lineas in secciones:
            if not any(x.strip() for x in lineas):
                continue
            if nom == "Código":
                nodos = self.parsear(lineas)
                codigos = []
                for nd in nodos:
                    if nd[0] == "code" and nd[1].split()[:1] == ["python"] and "oculto" not in nd[1].split():
                        cod, sal = self.render_code(nd[1], nd[2], separar=True)
                        codigos.append(cod)
                        salidas.append(sal)
                    else:
                        codigos.append(self.render_nodo(nd))
                html_sec.append(f'<details class="pa-codigo"><summary><span class="pa-tri" aria-hidden="true"></span>'
                                f'Ver el código de este paso</summary><div class="pa-codigo-cuerpo">{"".join(codigos)}</div></details>')
                continue
            cuerpo = self.render(self.parsear(lineas))
            if nom == "Resultado":
                cuerpo = "".join(salidas) + cuerpo
                salidas = []
            clase = {"Objetivo": "obj", "Parámetros": "par", "Resultado": "res", "Lectura": "lec", "Decisión": "dec"}.get(nom, "otro")
            html_sec.append(f'<div class="pa-sec pa-{clase}"><div class="pa-et">{ETQ.get(nom, nom)}</div>{cuerpo}</div>')
        if salidas:      # código sin sección de resultado: la salida va al final
            html_sec.append(f'<div class="pa-sec pa-res"><div class="pa-et">{ETQ["Resultado"]}</div>{"".join(salidas)}</div>')
        rep_html = ""
        if repasos:
            rep_html = ('<div class="pa-repaso"><span>📚 Repasa:</span> '
                        + " ".join(self.md_inline(f"[[{r}]]") for r in repasos) + "</div>")
        return (f'<article class="pastilla pa-{estado}" id="{id_}"><header class="pa-cab">'
                f'<span class="pa-num">Paso {n}</span><span class="pa-estado">{ico} {etiqueta}</span>'
                f'<h3 class="pa-titulo">{self.md_inline(titulo)}</h3></header>'
                f'<div class="pa-cuerpo">{"".join(html_sec)}{rep_html}</div></article>')

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
        import hashlib
        eid = f'{self.clave}-{hashlib.sha1(chr(10).join(enun).encode("utf-8")).hexdigest()[:8]}'
        info = self.info_tema(tema)
        prof = bool(info and info["prof"])
        self.ejercicios.append({"e": eid, "u": self.clave, "n": n, "niv": nivel, "cl": clase, "tipo": "mc" if opciones else "sol",
                                "su": info["u"] if info else self.clave, "sec": info["sec"] if info else None, "prof": prof})
        partes = [f'<!--EJ {eid}--><div class="ejercicio" id="ej-{n}" data-eid="{eid}"{" data-prof=1" if prof else ""} '
                  f'data-correcta="{"" if correcta is None else correcta}">',
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
        partes.append(f'<div class="ej-solucion" hidden>{self.render(self.parsear(expl))}</div></div><!--/EJ-->')
        return "".join(partes)

    def render_abierta(self, cab, hijos, id_):
        """Pregunta de respuesta abierta: enunciado, --- respuesta modelo, +++ puntos que debe tener."""
        import hashlib
        self.n_abierta += 1
        verbo, _, tema = cab.partition("|")
        verbo = verbo.strip() or "Explique"
        lim = [l.strip() for l in hijos]
        if "---" not in lim:
            self.errores.append(f"Pregunta abierta sin respuesta modelo: {cab}")
            return ""
        k = lim.index("---")
        enun, resto = hijos[:k], hijos[k + 1:]
        lim2 = [l.strip() for l in resto]
        if "+++" in lim2:
            j = lim2.index("+++")
            modelo, puntos = resto[:j], [l.strip()[2:] for l in resto[j + 1:] if l.strip().startswith("- ")]
        else:
            modelo, puntos = resto, []
        n = self.n_abierta
        id_ = id_ or f"ab-{n}"
        eid = f'{self.clave}-ab-{hashlib.sha1(chr(10).join(enun).encode("utf-8")).hexdigest()[:8]}'
        info = self.info_tema(tema)
        prof = bool(info and info["prof"])
        self.ancla(id_, None, verbo, "abierta")
        self.ejercicios.append({"e": eid, "u": self.clave, "n": n, "niv": verbo, "cl": "abierta", "tipo": "ab",
                                "su": info["u"] if info else self.clave, "sec": info["sec"] if info else None, "prof": prof})
        lista = "".join(f'<li><label><input type="checkbox"> <span>{self.md_inline(p)}</span></label></li>' for p in puntos)
        bloque_puntos = (f'<div class="ab-puntos"><div class="ab-et">☑️ Tu respuesta debe tener</div><ul class="ab-lista">{lista}</ul></div>'
                         if puntos else "")
        return (f'<!--EJ {eid}--><div class="ejercicio abierta" id="{id_}" data-eid="{eid}" data-abierta="1"{" data-prof=1" if prof else ""}>'
                f'<div class="ej-cab"><span class="ej-num">{html.escape(verbo)}</span><span class="ej-nivel nivel-abierta">Respuesta abierta</span>'
                f'<span class="ej-tema">{self.md_inline(tema.strip()) if tema.strip() else ""}</span></div>'
                f'<div class="ej-enunciado">{self.render(self.parsear(enun))}</div>'
                f'<textarea class="ab-texto" rows="5" placeholder="Escribe aquí tu respuesta, como la redactarías en el examen. Se guarda en este navegador."></textarea>'
                f'<div class="ej-acciones"><button type="button" class="btn-respuesta">Ver respuesta modelo</button></div>'
                f'<div class="ej-solucion" hidden><div class="ab-modelo"><div class="ab-et">📝 Respuesta modelo</div>{self.render(self.parsear(modelo))}</div>'
                f'{bloque_puntos}<div class="ab-nota"><span>¿Cómo te fue?</span>'
                f'<button type="button" data-nota="bien">✓ Bien</button><button type="button" data-nota="medias">≈ A medias</button>'
                f'<button type="button" data-nota="mal">✗ Mal</button></div></div></div><!--/EJ-->')

    def enlace_externo(self, ref):
        """'u1:ancla' → (html del enlace, datos del ancla). Para el mapa del temario y la ruta de estudio."""
        pref, _, rid = ref.partition(":")
        ext = self.externos.get(pref)
        if not ext or rid not in ext["anclas"]:
            self.errores.append(f"Referencia externa inexistente: {ref}")
            return f"[[{ref}]]", None
        a = ext["anclas"][rid]
        titulo = re.sub(r"^[^\w$¿¡(«]+\s*", "", a["titulo"])
        num = f'{a["num"]} ' if a.get("num") else ""
        return (f'<a class="ref ref-unidad" href="{ext["archivo"]}#{rid}"><span class="ref-flecha">{CORTO.get(pref, pref)}</span> '
                f'{num}{titulo_html(titulo)}</a>'), {"u": pref, "id": rid, **a}

    def render_temario(self, cab, hijos):
        """Tabla inciso → sección de la guía. Líneas «# Grupo» o «inciso | tema | u1:ancla u2:ancla | nota»."""
        filas = []
        for l in hijos:
            l = l.strip()
            if not l:
                continue
            if l.startswith("# "):
                filas.append(f'<tr class="tm-grupo"><td colspan="4">{self.md_inline(l[2:])}</td></tr>')
                continue
            p = [x.strip() for x in l.split("|")]
            inciso, tema, refs = p[0], p[1], (p[2].split() if len(p) > 2 else [])
            nota = p[3] if len(p) > 3 else ""
            enlaces, secs, profs = [], [], []
            for r in refs:
                h, a = self.enlace_externo(r)
                enlaces.append(h)
                if a:
                    secs.append(f'{a["u"]}:{a.get("sec") or a["id"]}')
                    profs.append(bool(a.get("prof")))
            etiqueta = ('<span class="tm-tag tm-prof">profundización</span>' if profs and all(profs)
                        else '<span class="tm-tag tm-ets">entra al ETS</span>' if profs else "")
            nota_html = f'<div class="tm-nota">{self.md_inline(nota)}</div>' if nota else ""
            clase = ' class="tm-solo-prof"' if profs and all(profs) else ""
            filas.append(f'<tr{clase} data-secs="{" ".join(dict.fromkeys(secs))}"><td class="tm-num">{html.escape(inciso)}</td>'
                         f'<td class="tm-tema">{self.md_inline(tema)} {etiqueta}{nota_html}</td>'
                         f'<td class="tm-donde">{"".join(enlaces)}</td><td class="tm-estado"></td></tr>')
        titulo = f'<caption>{self.md_inline(cab)}</caption>' if cab else ""
        return (f'<div class="tabla temario"><table>{titulo}<thead><tr><th>Inciso</th><th>Tema</th><th>Dónde se estudia</th>'
                f'<th>Avance</th></tr></thead><tbody>{"".join(filas)}</tbody></table></div>')

    def render_ruta(self, hijos):
        """Ruta de estudio. Cada línea: «título | u1:seccion u1:otra | nota | minutos extra»."""
        items = []
        for l in hijos:
            l = l.strip()
            if not l:
                continue
            p = [x.strip() for x in l.split("|")]
            titulo, refs = p[0], (p[1].split() if len(p) > 1 else [])
            nota = p[2] if len(p) > 2 else ""
            extra = float(p[3]) if len(p) > 3 and p[3] else 0
            enlaces, secs, t_ets, t_tot = [], [], extra, extra
            for r in refs:
                h, a = self.enlace_externo(r)
                enlaces.append(h)
                if not a:
                    continue
                t = self.externos[a["u"]].get("meta", {}).get("tiempos", {}).get(a["id"])
                if t:
                    t_ets += t[0]
                    t_tot += t[1]
                secs.append(f'{a["u"]}:{a.get("sec") or a["id"]}')
            n = len(items) + 1
            tiempo = (f'<span class="rt-min"><span class="t-ets">⏱ {texto_minutos(minutos(t_ets))}</span>'
                      f'<span class="t-total">⏱ {texto_minutos(minutos(t_tot))}</span></span>')
            nota_html = f'<p class="rt-nota">{self.md_inline(nota)}</p>' if nota else ""
            items.append(f'<li class="rt-sesion" data-secs="{" ".join(dict.fromkeys(secs))}"><div class="rt-cab">'
                         f'<span class="rt-num">Sesión {n}</span><span class="rt-titulo">{self.md_inline(titulo)}</span>{tiempo}'
                         f'<span class="rt-estado"></span></div><div class="rt-secs">{"".join(enlaces)}</div>{nota_html}</li>')
        return f'<ol class="ruta-estudio">{"".join(items)}</ol>'


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
    doc = Documento(clave, cfg, externos)
    archivos = sorted((AQUI / cfg["carpeta"]).glob("*.md"))
    if not archivos:
        sys.exit(f"No hay archivos .md en {cfg['carpeta']}")
    listas = [doc.parsear(a.read_text(encoding="utf-8").splitlines()) for a in archivos]
    doc.calcular_tiempos(listas)
    cuerpo = [doc.render(nodos) for nodos in listas]
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

    # ---- tiempo estimado de cada sección (modo ETS y texto completo) ----
    def sust_t(m):
        if cfg.get("sin_tiempo"):
            return ""
        e, t = doc.t_sec.get(m.group(1), [0, 0])
        if t < 1:
            return ""
        me, mt = texto_minutos(minutos(e)), texto_minutos(minutos(t))
        if e < 0.5:
            return f'<div class="sec-tiempo">⏱ <b>{mt}</b> · profundización: no entra en el modo ETS</div>'
        if me == mt:
            return f'<div class="sec-tiempo">⏱ <b>{mt}</b> de estudio</div>'
        return (f'<div class="sec-tiempo"><span class="t-ets">⏱ <b>{me}</b> en modo ETS <small>· {mt} con la profundización</small></span>'
                f'<span class="t-total">⏱ <b>{mt}</b> el texto completo <small>· {me} en modo ETS</small></span></div>')

    def sust_tp(m):
        t = doc.t_sub.get(m.group(1))
        if t is None:
            t = doc.t_sec.get(m.group(1), [0, 0])[1]
        return f"⏱ {texto_minutos(minutos(t, 1))}"

    html_cuerpo = re.sub(r"@@T:([\w-]+)@@", sust_t, html_cuerpo)
    html_cuerpo = re.sub(r"@@TP:([\w-]+)@@", sust_tp, html_cuerpo)

    # ---- índice lateral y mapa ----
    toc = []
    for s in doc.toc:
        def clase_li(x):
            cl = ([f't-pa t-{x["estado"]}'] if x.get("estado") else []) + (["prof"] if x.get("prof") else [])
            return f' class="{" ".join(cl)}"' if cl else ""
        subs = "".join(f'<li{clase_li(x)}><a href="#{x["id"]}" data-id="{x["id"]}"><span class="t-num">{x["num"]}</span>'
                       f'{titulo_html(x["titulo"])}</a></li>' for x in s["subs"])
        toc.append(f'<li class="t-sec{" prof" if s.get("prof") else ""}" data-seccion="{s["id"]}"><a href="#{s["id"]}" data-id="{s["id"]}">'
                   f'<span class="t-num">{s["num"]}</span>{titulo_html(s["titulo"])}'
                   f'<span class="t-check" aria-hidden="true"></span></a><ul>{subs}</ul></li>')
    mapa = "".join(
        f'<a class="mapa-tarjeta{" prof" if doc.anclas[m["id"]]["prof"] else ""}" href="#{m["id"]}"><span class="mapa-num">{m["num"]}</span>'
        f'<span class="mapa-titulo">{titulo_html(m["titulo"])}</span><span class="mapa-texto">{html.escape(m["texto"])}</span></a>'
        for m in doc.mapa)
    html_cuerpo = html_cuerpo.replace("@@MAPA@@", mapa)
    # Mapa de pasos del Laboratorio: una ficha por pastilla, con su color
    fases = []
    for s in doc.toc:
        ps = [p for p in doc.pastillas if p["fase"] == s["id"]]
        if ps:
            fichas = "".join(f'<a class="paso-ficha pf-{p["estado"]}" href="#{p["id"]}" title="{html.escape(titulo_html(p["titulo"]), quote=True)}">'
                             f'<b>{p["n"]}</b><span>{titulo_html(p["titulo"])}</span></a>' for p in ps)
            fases.append(f'<div class="pasos-fase"><div class="pasos-fase-cab"><span class="mapa-num">{s["num"]}</span>'
                         f'{titulo_html(s["titulo"])}</div><div class="pasos-fichas">{fichas}</div></div>')
    html_cuerpo = html_cuerpo.replace("@@PASOS@@", "".join(fases))

    # ---- datos para las demás páginas: ejercicios, hojas de repaso, buscador y tiempos ----
    salida = cfg["salida"]
    enlazar = lambda h: h.replace('href="#', f'href="{salida}#')

    def titulo_seccion(u, sec):
        anclas = doc.anclas if u == clave else externos.get(u, {}).get("anclas", {})
        a = anclas.get(sec)
        return (f'{a["num"]} · ' if a and a.get("num") else "") + titulo_plano(a["titulo"]) if a else ""

    doc.banco = []
    for e in doc.ejercicios:
        m = re.search(r"<!--EJ %s-->(.*?)<!--/EJ-->" % re.escape(e["e"]), html_cuerpo, re.S)
        if m:
            doc.banco.append({**e, "st": titulo_seccion(e["su"], e["sec"]), "h": enlazar(m.group(1))})

    doc.repaso = {}
    if cfg.get("formulario"):
        res = [{"sec": m.group(1), "prof": m.group(2) == "1", "titulo": titulo_seccion(clave, m.group(1)), "html": enlazar(m.group(3))}
               for m in re.finditer(r"<!--RS ([\w-]+)\|(\d)-->(.*?)<!--/RS-->", html_cuerpo, re.S)]
        m = re.search(r'<section class="seccion[^"]*" data-seccion="%s">(.*?)<div class="fin-seccion">' % cfg["formulario"], html_cuerpo, re.S)
        form = ""
        if m:
            form = re.sub(r"<!--SUB checklist\w*-->.*?<!--/SUB-->", "", m.group(1), flags=re.S)       # la checklist se queda en la unidad
            form = re.sub(r'<h2 id=.*?</h2>|<div class="sec-tiempo">.*?</div>', "", form, flags=re.S)
            form = re.sub(r'<h3 id="[\w-]+">', "<h3>", enlazar(form))
        else:
            doc.errores.append(f'No se encontró la sección de formulario «{cfg["formulario"]}»')
        doc.repaso = {"resumenes": [r for r in res if r["sec"] != cfg["formulario"]], "formulario": form}

    if clave == "repaso":
        def sust_repaso(m):
            u = m.group(1)
            r = externos.get(u, {}).get("repaso")
            if not r:
                doc.errores.append(f"No hay datos de repaso de {u}: genera primero esa unidad")
                return ""
            arch = externos[u]["archivo"]
            tarjetas = "".join(
                f'<div class="rp-res{" prof" if x["prof"] else ""}"><a class="rp-origen" href="{arch}#{x["sec"]}">{html.escape(x["titulo"])} ↗</a>{x["html"]}</div>'
                for x in r["resumenes"])
            return (f'<h3 class="rp-h" id="rp-{u}-ideas"><span class="h-num">✓</span> Lo que debes llevarte de cada tema</h3>'
                    f'<div class="rp-resumenes">{tarjetas}</div>'
                    f'<h3 class="rp-h" id="rp-{u}-formulario"><span class="h-num">∑</span> Formulario, tablas y errores comunes</h3>'
                    f'<div class="rp-formulario">{r["formulario"]}</div>')
        html_cuerpo = re.sub(r"(?:<p>)?@@REPASO:(\w+)@@(?:</p>)?", sust_repaso, html_cuerpo)

    # Primera sección donde aparece cada símbolo del glosario (el buscador lleva ahí)
    cortes = [(m.start(), m.group(1)) for m in re.finditer(r'<section class="seccion[^"]*" data-seccion="([\w-]+)">', html_cuerpo)]
    tips, k = {}, -1
    for m in re.finditer(r'data-tip="([^"]+)"', html_cuerpo):
        while k + 1 < len(cortes) and cortes[k + 1][0] < m.start():
            k += 1
        if k >= 0:
            tips.setdefault(m.group(1), cortes[k][1])
    tiempos = {i: [round(v[0], 1), round(v[1], 1)] for i, v in doc.t_sec.items()}
    for i, v in doc.t_sub.items():
        if i in doc.anclas:
            tiempos[i] = [0 if doc.anclas[i]["prof"] else round(v, 1), round(v, 1)]
    indice = [[i, a["tipo"], a["num"] or "", titulo_plano(a["titulo"]), int(a["prof"])]
              for i, a in doc.anclas.items() if a["tipo"] in ("seccion", "sub", "menor", "bloque") and a["titulo"]]
    indice += [[b["i"], "def", "", titulo_plano(b["t"]), int(b["p"])] for b in doc.busq if b["i"]]
    doc.meta = {
        "secciones": [{"id": s["id"], "num": s["num"], "titulo": titulo_plano(s["titulo"]), "prof": bool(s.get("prof"))} for s in doc.toc],
        "tiempos": tiempos, "indice": indice, "tips": tips if clave in ("u1", "u2", "u3") else {},
    }

    # ---- validación de símbolos ----
    usados = set(re.findall(r'data-tip="([^"]+)"', html_cuerpo))
    faltan = sorted(usados - set(glosario))
    if faltan:
        doc.errores.append("Claves de glosario sin definir: " + ", ".join(faltan))

    plantilla = (AQUI / "plantilla.html").read_text(encoding="utf-8")
    activo = cfg.get("nav_activo", clave)
    nav = "".join(
        (f'<a class="unidad activa" href="{"#inicio" if k == clave else c["salida"]}">{c["nombre"]}</a>' if k == activo
         else f'<a class="unidad" href="{c["salida"]}">{c["nombre"]}</a>')
        for k, c in UNIDADES.items() if c.get("en_nav", True))
    scripts = "\n".join(f'<script src="{x}" defer></script>' for x in cfg["scripts"])
    final = (plantilla.replace("{{INDICE}}", "\n".join(toc))
             .replace("{{TITULO_PAGINA}}", cfg["titulo_pagina"]).replace("{{DESCRIPCION}}", cfg["descripcion"])
             .replace("{{NAV}}", nav).replace("{{UNIDAD}}", clave)
             .replace("{{INDICE_TITULO}}", cfg.get("indice_titulo", f'Índice de la Unidad {cfg["numero"]}'))
             .replace("{{PIE}}", cfg.get("pie", f'Guía de estudio · Análisis de Series de Tiempo · Unidad {cfg["numero"]}. Las gráficas se calculan en tu navegador con las mismas fórmulas que usa <code>statsmodels</code>.'))
             .replace("{{NUMERO}}", cfg["numero"])
             .replace("{{SCRIPTS}}", scripts)
             .replace("{{DATOS}}", json.dumps(doc.exportados, ensure_ascii=False).replace("</", "<\\/"))
             .replace("{{CONTENIDO}}", html_cuerpo)
             .replace("{{GLOSARIO}}", json.dumps(glos_json, ensure_ascii=False).replace("</", "<\\/"))
             .replace("{{MACROS}}", json.dumps(MACROS).replace("</", "<\\/"))
             .replace("{{N_EJERCICIOS}}", str(doc.n_ejercicio)))
    SALIDA.write_text(final, encoding="utf-8")

    print(f"✓ {SALIDA.relative_to(RAIZ)}: {len(final) / 1024:.0f} KB · {len(doc.math)} fórmulas · "
          f"{len(doc.toc)} secciones · {doc.n_ejercicio} ejercicios · {doc.n_abierta} preguntas abiertas · {len(usados)} símbolos explicados")
    if clave in ("u1", "u2", "u3"):
        e, t = sum(v[0] for v in doc.t_sec.values()), sum(v[1] for v in doc.t_sec.values())
        print(f"  tiempo estimado: {texto_minutos(minutos(e))} en modo ETS · {texto_minutos(minutos(t))} el texto completo")
    sin_uso = sorted(set(glosario) - usados)
    if sin_uso and clave in ("u1", "u2", "u3") and os.environ.get("GUIA_GLOSARIO"):
        print("  (claves de glosario sin usar: " + ", ".join(sin_uso) + ")")
    if doc.errores:
        print("\n".join("✗ " + e for e in doc.errores))
        sys.exit(1)
    return doc


def externo_de_cache(clave):
    """Datos de una página que no se regenera: anclas, tiempos y repaso salen de fuente/cache/."""
    f = CACHE / f"anclas_{clave}.json"
    if not f.exists():
        return None
    e = {"archivo": UNIDADES[clave]["salida"], "nombre": UNIDADES[clave]["nombre"], "anclas": json.loads(f.read_text(encoding="utf-8")),
         "meta": {}, "repaso": {}}
    for nombre in ("meta", "repaso"):
        g = CACHE / f"{nombre}_{clave}.json"
        if g.exists():
            e[nombre] = json.loads(g.read_text(encoding="utf-8"))
    return e


def escribir_buscador(externos):
    """assets/datos/buscador.js: títulos, definiciones y glosario de todas las páginas (lo carga cada página)."""
    glosario = json.loads((AQUI / "glosario.json").read_text(encoding="utf-8"))
    paginas = {k: {"a": UNIDADES[k]["salida"], "c": CORTO.get(k, k), "n": UNIDADES[k]["nombre"]} for k in UNIDADES if k in externos}
    entradas, tips = [], {}
    for k in UNIDADES:
        meta = externos.get(k, {}).get("meta", {})
        entradas += [[k] + e for e in meta.get("indice", [])]
        for clave, sec in meta.get("tips", {}).items():
            tips.setdefault(clave, [k, sec])
    limpio = lambda t: html.unescape(re.sub(r"<[^>]+>", "", t))
    glos = [[k, limpio(v[1]), limpio(v[2])] + tips[k] for k, v in glosario.items() if k in tips]
    secciones = {k: externos[k]["meta"].get("secciones", []) for k in ("u1", "u2", "u3") if k in externos}
    DATOS.mkdir(parents=True, exist_ok=True)
    datos = {"paginas": paginas, "entradas": entradas, "glosario": glos, "secciones": secciones}
    (DATOS / "buscador.js").write_text("window.GUIA_BUSCADOR = " + json.dumps(datos, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/") + ";\n",
                                       encoding="utf-8")
    print(f"✓ assets/datos/buscador.js: {len(entradas)} títulos y definiciones · {len(glos)} símbolos")


def main():
    pedidas = sys.argv[1:] or list(ORDEN_BUILD)
    for p in pedidas:
        if p not in UNIDADES:
            sys.exit(f"Página desconocida: {p}. Opciones: {', '.join(ORDEN_BUILD)}")
    CACHE.mkdir(exist_ok=True)
    DATOS.mkdir(parents=True, exist_ok=True)
    # Todas las páginas parten de su caché, para que una unidad pueda enlazar a otra que se construye
    # después (u1 → u2); cada página que se regenera reemplaza su entrada al terminar.
    externos = {}
    for clave in ORDEN_BUILD:
        e = externo_de_cache(clave)
        if e:
            externos[clave] = e
    for clave in ORDEN_BUILD:
        if clave not in pedidas:
            continue
        doc = construir(clave, externos)
        (CACHE / f"anclas_{clave}.json").write_text(json.dumps(doc.anclas, ensure_ascii=False), encoding="utf-8")
        (CACHE / f"meta_{clave}.json").write_text(json.dumps(doc.meta, ensure_ascii=False), encoding="utf-8")
        if doc.repaso:
            (CACHE / f"repaso_{clave}.json").write_text(json.dumps(doc.repaso, ensure_ascii=False), encoding="utf-8")
        if doc.banco and clave in ("u1", "u2", "u3", "preguntas"):
            (DATOS / f"banco-{clave}.js").write_text(
                "window.GUIA_BANCO = window.GUIA_BANCO || {};\nwindow.GUIA_BANCO[" + json.dumps(clave) + "] = "
                + json.dumps({"archivo": UNIDADES[clave]["salida"], "nombre": UNIDADES[clave]["nombre"], "items": doc.banco},
                             ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/") + ";\n", encoding="utf-8")
        externos[clave] = {"anclas": doc.anclas, "archivo": UNIDADES[clave]["salida"], "nombre": UNIDADES[clave]["nombre"],
                           "meta": doc.meta, "repaso": doc.repaso}
    escribir_buscador(externos)
    return externos


if __name__ == "__main__":
    main()
