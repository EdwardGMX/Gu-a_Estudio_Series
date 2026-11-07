# Guía de estudio · Análisis de Series de Tiempo

Página web interactiva para preparar el ETS de Análisis de Series de Tiempo. Por ahora contiene la **Unidad I: Características de series de tiempo**.

## Qué incluye

- **12 secciones**: herramientas matemáticas, qué es una serie de tiempo, visualización, componentes y descomposición clásica, estadísticos básicos, estacionariedad (ruido blanco, AR(1), paseo aleatorio, raíz unitaria, tendencia determinística vs. estocástica, diferenciación), pruebas ADF y KPSS, ACF y PACF, Ljung–Box, caso integrador con AirPassengers y formulario.
- **Demostraciones paso a paso** (cada paso con su justificación) y **17 ejemplos a mano guiados**: con «▶ Recorrer paso a paso» la tabla de datos ilumina en amarillo lo que usa cada paso y en verde lo que calcula.
- **Tabla interactiva del dataset AirPassengers** enlazada con su gráfica.
- **Código Python** con su salida real (se ejecuta al generar la página).
- **35 gráficas interactivas**, calculadas en el navegador con las mismas fórmulas que `statsmodels`, cada una con su sección «Cómo leer esta gráfica» y, en la mayoría, una «vista extra» (gráfica o tabla enlazada) que muestra de dónde salen los números.
- **8 simuladores de Python** (`rolling`, `seasonal_decompose`, transformaciones, `adfuller`, `kpss`, `plot_acf`/`plot_pacf`, `acf`, `acorr_ljungbox`): el código se reescribe con los parámetros que eliges y muestra su salida, con una tabla de valores recomendados.
- **Explicación de cada símbolo** al pasar el cursor por las fórmulas, y enlaces ↩ para regresar a temas anteriores (con botón «Volver a donde estabas»).
- **43 ejercicios** con botón de respuesta y explicación.

## Cómo verla

- **GitHub Pages**: *Settings → Pages → Build and deployment → Deploy from a branch*, elige la rama (`unidad-1` mientras se revisa, `main` después) y la carpeta `/ (root)`.
- **En tu computadora**: abre `index.html` en el navegador. Necesita internet para cargar KaTeX y Plotly desde el CDN.

## Estructura

```
index.html              página generada (no editar a mano)
assets/css/estilos.css  diseño
assets/js/ts.js         cálculos de series de tiempo (ACF, PACF, ADF, KPSS, Ljung–Box…)
assets/js/ui.js         explicación de símbolos, enlaces, índice y ejercicios
assets/js/widgets.js    gráficas interactivas
fuente/contenido/*.md   texto de la guía (Markdown + fórmulas)
fuente/glosario.json    explicación de cada símbolo
fuente/build.py         genera index.html
```

## Regenerar la página

```bash
pip install markdown-it-py pygments numpy pandas scipy statsmodels matplotlib
cd fuente && npm install && cd ..
python3 fuente/build.py
```
