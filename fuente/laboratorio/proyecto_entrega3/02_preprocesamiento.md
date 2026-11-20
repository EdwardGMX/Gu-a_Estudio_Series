## 🧹 Fase 1 · Preprocesamiento de la serie {#fase-prep}
@mapa Cargar la energía diaria al formato de statsforecast, rellenar los 5 días nulos con interpolación lineal y revisar los 13 días sin producción.

:::pastilla verde | Aplicar · Cargar la serie en el formato de statsforecast | u1:pandas u2:ref-statsforecast {#prep-cargar}
Leer `energia_MV01.csv` y dejarlo con las tres columnas que exige `statsforecast`: `unique_id` (qué serie es), `ds` (la fecha) y `y` (el valor). Con ese formato todos los modelos de la librería se entrenan igual.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `parse_dates` | `['fecha']` | Que la fecha se lea como fecha y no como texto. |
| `unique_id` | `'MV01'` | Una sola serie; el nombre sirve para identificarla en las tablas. |
| `rename` | `fecha → ds`, `energia_kwh → y` | Los nombres que espera `StatsForecast`. |
@@ Código
```python
import numpy as np
import pandas as pd
import warnings
warnings.filterwarnings('ignore')

from statsmodels.tsa.seasonal import STL
from statsmodels.tsa.stattools import adfuller
from statsmodels.stats.diagnostic import acorr_ljungbox
from statsforecast import StatsForecast
from statsforecast.models import Naive, SeasonalNaive, RandomWalkWithDrift, HistoricAverage, AutoARIMA, ARIMA
from utilsforecast.evaluation import evaluate
from utilsforecast.losses import rmse, mae, mape

df = pd.read_csv(RUTA_DATOS / 'energia_MV01.csv', parse_dates=['fecha'])
df['unique_id'] = 'MV01'
df.rename(columns={'fecha': 'ds', 'energia_kwh': 'y'}, inplace=True)
df = df[['unique_id', 'ds', 'y']]
print(df.shape)
print(df['y'].describe().round(1))
```
@@ Resultado
La forma de la tabla (renglones, columnas) y el resumen de `y`: cuántos valores hay, su media, su desviación estándar y sus cuartiles.
@@ Lectura
- Hay **{{=len(df)}} días** (todo 2019) pero solo **{{=int(df['y'].count())}} valores**: faltan {{=int(df['y'].isna().sum())}}.
- La energía va de **0** a **{{=kwh(df['y'].max())}} kWh/día**, con media de {{=kwh(df['y'].mean())}} y mediana de {{=kwh(df['y'].median())}}. Que la mediana quede tan por debajo de la media dice que hay muchos días flojos y una cola de días muy buenos: la distribución es asimétrica hacia la derecha.
- El máximo es la turbina a plena carga todo el día: ≈ 2,300 kW × 24 h = 55,200 kWh.
@@ Decisión
✅ La serie ya está en formato largo. Lo siguiente es ver dónde están los nulos.
:::

:::pastilla verde | Aplicar · Rellenar los 5 días nulos con interpolación lineal | u1:pandas u1:estadisticos {#prep-nulos}
Encontrar los días sin dato y rellenarlos. **No se eliminan**: si se borran, la serie queda con saltos y un rezago de 1 ya no sería "el día anterior", lo que rompe la ACF y los modelos AR. Como los huecos son cortos, se unen los vecinos con una recta.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `method` | `'linear'` | Une el último valor antes del hueco con el primero después, con una recta. |
| `limit` | `3` | Solo rellena huecos de hasta 3 días; uno más largo se quedaría en nulo y avisaría del problema. |
@@ Código
```python
print(df.isna().sum())
dias_imputados = df.loc[df['y'].isna(), 'ds']
print(dias_imputados.dt.date.tolist())

df['y'] = df['y'].interpolate(method='linear', limit=3)
print(df[df['ds'].isin(dias_imputados)].round(1))
```
@@ Resultado
```python oculto
def _anim_hueco(ini, fin, titulo):
    """Cuadros: el hueco, la recta entre los vecinos y los valores rellenados."""
    crudo = pd.read_csv(RUTA_DATOS / 'energia_MV01.csv', parse_dates=['fecha']).set_index('fecha')['energia_kwh']
    ven = crudo[ini:fin]
    nul = ven[ven.isna()].index
    a, b = nul[0] - pd.Timedelta(days=1), nul[-1] + pd.Timedelta(days=1)
    rell = df.set_index('ds')['y'][nul]
    serie = linea(ven.index, ven, "energía diaria", "lav", 2, connectgaps=False)
    vec = puntos([a, b], [crudo[a], crudo[b]], "vecinos del hueco", "osc", 10)
    recta = linea([a, b], [crudo[a], crudo[b]], "recta entre los vecinos", "rosa", 2.4, "dash")
    imp = puntos(rell.index, rell, "valores imputados", "dur", 12)
    sombra = {"type": "rect", "x0": str((nul[0] - pd.Timedelta(hours=12)).date()), "x1": str((nul[-1] + pd.Timedelta(hours=12)).date()),
              "y0": 0, "y1": 1, "yref": "paper", "fillcolor": "rgba(238,138,95,.12)", "line": {"width": 0}}
    cuad = [[serie], [serie, vec], [serie, vec, recta], [serie, recta, imp]]
    lvs = [{"shapes": [sombra], "title": {"text": titulo}}] * 4
    pasos = len(nul) + 1
    txt = [f"<b>{titulo}.</b> La línea se corta: faltan {len(nul)} días ({', '.join(fecha_corta(t) for t in nul)}).",
           f"Se toman los dos días con dato a los lados: el {fecha_corta(a)} ({kwh(crudo[a])} kWh) y el {fecha_corta(b)} ({kwh(crudo[b])} kWh).",
           f"Se traza la recta entre ellos. En {pasos} pasos baja (o sube) {kwh(abs(crudo[b] - crudo[a]) / pasos)} kWh por día.",
           "Cada día del hueco toma el valor de la recta en su fecha: " + ", ".join(f"{fecha_corta(t)} → {kwh(v)}" for t, v in rell.items()) + " kWh."]
    return cuad, lvs, txt

c1, l1, t1 = _anim_hueco("2019-02-25", "2019-03-18", "Hueco de marzo")
c2, l2, t2 = _anim_hueco("2019-07-10", "2019-08-02", "Hueco de julio")
animacion("anim-interp", c1 + c2, textos=t1 + t2, lv=l1 + l2, etiqueta="Paso",
          etiquetas=[f"marzo {i}/4" for i in range(1, 5)] + [f"julio {i}/4" for i in range(1, 5)], vel=2200, alto=320,
          yaxis={"title": {"text": "kWh/día"}, "rangemode": "tozero"})
```
@widget lab-anim id=anim-interp
@@ Lectura
- Son **5 días** en dos huecos: 6–7 de marzo y 20–22 de julio, de 2 y 3 días.
- La recta es lo más neutral posible: no inventa viento ni calma, solo une lo que se midió antes y después. En julio pasa de {{=kwh(df.set_index('ds')['y']['2019-07-19'])}} a {{=kwh(df.set_index('ds')['y']['2019-07-23'])}} kWh, así que los tres días imputados bajan en escalones iguales.
- Los dos huecos quedan dentro del **entrenamiento** (que termina el 19 de octubre), así que ningún valor inventado se usa para calcular las métricas de la prueba.
@@ Decisión
✅ La serie queda completa, con días consecutivos. Ahora los días con 0 kWh.
:::

:::pastilla azul | Aplicar · Los 13 días sin producción | u1:visualizacion {#prep-ceros}
Contar los días con **0 kWh** y decidir qué hacer con ellos. No son datos faltantes: la turbina estuvo parada.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| condición | `y == 0` | Producción nula durante todo el día. |
@@ Código
```python
ceros = df[df['y'] == 0]
print(f"Días con 0 kWh: {len(ceros)}")
print(ceros['ds'].dt.strftime('%d/%m').tolist())
```
@@ Resultado
```python oculto
grafica("prep-ceros", [linea(df['ds'], df['y'], "energía diaria", "lav", 1.4),
                       puntos(ceros['ds'], ceros['y'], "días con 0 kWh", "rojo", 9)],
        alto=300, title={"text": "Los días sin producción (en rojo)"}, yaxis={"title": {"text": "kWh/día"}})
```
@widget lab-graf id=prep-ceros
@@ Lectura
- Hay **{{=len(ceros)}} días en cero**. El 20 de enero fue un paro de todo el parque, y del **18 al 24 de diciembre** hay 7 días seguidos en cero que parecen un paro de la turbina.
- Se **conservan**: son producción real y es justo lo que la turbina entregó. Pero ningún modelo que solo mire la propia serie puede adivinar un paro, así que van a subir el error en la prueba.
- El **MAPE** divide entre el valor real, y en esos días dividiría entre cero. Por eso se calcula solo con los días que sí produjeron.
@@ Decisión
🔵 La serie está lista. Siguiente: mirarla completa y dividirla.
:::
