## 🔭 Fase 2 · Exploración y división 80/20 {#fase-eda}
@mapa La serie completa mes por mes y la partición en entrenamiento y prueba, hecha antes de cualquier prueba estadística.

:::pastilla azul | Aplicar · La energía de 2019, mes por mes | u1:linea u1:moviles {#eda-serie}
Graficar la serie completa con su **media móvil centrada de 7 días** y la media del año, para ver si hay tendencia, temporadas o ciclos antes de probar nada.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `rolling(7, center=True)` | 7 días centrada | Suaviza el ruido de un día a otro sin mover los picos de lugar. |
| línea roja | media de los 365 días | El nivel al que la serie regresa. |
@@ Código
```python
media_movil = df['y'].rolling(7, center=True).mean()
media_anual = df['y'].mean()
mensual = df.groupby(df['ds'].dt.month)['y'].mean()
print(f"Media del año: {media_anual:,.0f} kWh/día")
print((mensual / 1000).round(1).rename('miles de kWh/día').to_string())
```
@@ Resultado
```python oculto
cuad, txts, etqs = [], [], []
for m in range(1, 13):
    hasta = df['ds'].dt.month <= m
    d = df[hasta]
    cuad.append([linea(d['ds'], d['y'], "energía diaria", "lav", 1.2, opacity=.55),
                 linea(d['ds'], media_movil[hasta], "media móvil 7 días", "osc", 2.4),
                 linea(df['ds'][df['ds'].dt.month == m], [mensual[m]] * int((df['ds'].dt.month == m).sum()), f"media de {MESES_L[m-1]}", "dur", 3)])
    nivel = "alta" if mensual[m] > media_anual * 1.15 else "baja" if mensual[m] < media_anual * 0.85 else "cerca de la media"
    txts.append(f"<b>{MESES_L[m-1].capitalize()}</b>: media de {kwh(mensual[m])} kWh/día, producción <b>{nivel}</b> "
                f"(la del año es {kwh(media_anual)}). " + {1: "Arranca con viento fuerte; el 20 cae a 0 por un paro del parque.",
                2: "Semanas casi sin viento: varios días por debajo de 5,000 kWh.", 3: "Regresan las rachas largas a plena carga a mitad de mes.",
                4: "Se alternan pocos días buenos con semanas flojas.", 5: "El mes más pobre: casi todo el mes por debajo de 15,000.",
                6: "Sigue la calma, con un repunte fuerte al final del mes.", 7: "Episodios cortos de viento; el hueco imputado del 20 al 22.",
                8: "Pocos días buenos; la mayoría por debajo de la media.", 9: "Rachas de unos días y luego calma.",
                10: "Aquí termina el entrenamiento (19 de octubre).", 11: "Vuelve la temporada de viento, con días en cero sueltos.",
                12: "Mucho viento… y el paro del 18 al 24 de diciembre (7 días en cero)."}[m])
    etqs.append(MESES[m - 1])
animacion("anim-serie", cuad, base=[{"x": [str(df['ds'].min().date()), str(df['ds'].max().date())], "y": [media_anual] * 2, "mode": "lines",
                                     "name": "media del año", "line": {"color": PALETA["rojo"], "dash": "dash", "width": 1.4}}],
          textos=txts, etiquetas=etqs, etiqueta="Mes", vel=1600, alto=330,
          title={"text": "Energía generada por MV01 en 2019"}, yaxis={"title": {"text": "kWh/día"}, "range": [0, 57000]},
          xaxis={"range": [str(df['ds'].min().date()), str(df['ds'].max().date())]})
```
@widget lab-anim id=anim-serie
@@ Lectura
- La serie va de 0 a unos 55,000 kWh/día y **no tiene tendencia**: la media móvil sube y baja, pero siempre regresa a la línea roja.
- Se alternan **episodios de varios días** con viento fuerte y periodos de calma. Esa persistencia (un día bueno suele seguir a otro bueno) es lo que un modelo AR puede aprovechar.
- Hay una temporada, aunque irregular: los meses más altos son **enero, marzo y noviembre** (enero: {{=kwh(mensual[1])}} kWh/día) y el más bajo es **mayo** ({{=kwh(mensual[5])}}); de mayo a octubre casi todos los meses quedan por debajo de la media. Con un solo año de datos no se puede modelar como estacionalidad anual: se vería una sola vez.
:::nota Detalle del notebook
El notebook dice que la producción es mayor en "enero–marzo y noviembre–diciembre", pero **febrero** fue un mes de calma ({{=kwh(mensual[2])}} kWh/día, por debajo de la media). La idea general (más viento en invierno) se sostiene.
:::
@@ Decisión
🔵 Sin tendencia, con persistencia y sin un ciclo corto evidente. Antes de probar nada, se separa la prueba.
:::

:::pastilla verde | Aplicar · División 80/20 antes de cualquier prueba | u2:particion u2:tres-bloques {#eda-division}
Separar el **80 %** inicial para entrenar y el **20 %** final para la prueba. Se hace **antes** de la ADF, la ACF/PACF y la STL para que todas las decisiones del modelo salgan solo del entrenamiento; si se miraran los datos de prueba para elegir el modelo, el error de prueba saldría optimista.
@@ Parámetros
| Parámetro | Valor | Por qué |
|---|---|---|
| `corte` | `int(365 × 0.8)` = 292 | Proporción usual; deja 73 días de prueba (unas 10 semanas). |
| orden | sin barajar (`iloc`) | En series de tiempo la prueba tiene que ser el **futuro** del entrenamiento. |
@@ Código
```python
corte = int(len(df) * 0.8)

train = df.iloc[:corte].reset_index(drop=True)
test = df.iloc[corte:].reset_index(drop=True)

print("Entrenamiento:", len(train), train['ds'].min().date(), "-", train['ds'].max().date())
print("Test:", len(test), test['ds'].min().date(), "-", test['ds'].max().date())
print("Días con 0 kWh en test:", (test['y'] == 0).sum())
```
@@ Resultado
```python oculto
inicio_val_eda = int(len(train) * 0.8)
gris = linea(df['ds'], df['y'], "serie completa", "gris", 1.2)
tr = linea(train['ds'], train['y'], f"entrenamiento ({len(train)} días)", "lav", 1.6)
te = linea(test['ds'], test['y'], f"prueba ({len(test)} días)", "dur", 1.8)
cer = puntos(test['ds'][test['y'] == 0], test['y'][test['y'] == 0], "días en 0 dentro de la prueba", "rojo", 8)
tri = linea(train['ds'][:inicio_val_eda], train['y'][:inicio_val_eda], f"entrenamiento interno ({inicio_val_eda})", "lav", 1.6)
va = linea(train['ds'][inicio_val_eda:], train['y'][inicio_val_eda:], f"validación ({len(train) - inicio_val_eda})", "menta", 1.8)
fcorte = str(train['ds'].iloc[-1].date())
fval = str(train['ds'].iloc[inicio_val_eda].date())
lv_div = [{"shapes": []}, {"shapes": [vline(fcorte, "osc")]}, {"shapes": [vline(fcorte, "osc")]}, {"shapes": [vline(fcorte, "osc")]},
          {"shapes": [vline(fcorte, "osc"), vline(fval, "menta")]}]
animacion("anim-division", [[gris], [gris, tr], [tr, te], [tr, te, cer], [tri, va, te]], lv=lv_div,
          textos=["Los 365 días, en orden. No se pueden barajar: la prueba tiene que ser lo que pasó <b>después</b>.",
                  f"El 80 % inicial es el <b>entrenamiento</b>: {len(train)} días, del 1 de enero al {fecha_larga(train['ds'].iloc[-1])}.",
                  f"El 20 % final es la <b>prueba</b>: {len(test)} días, del {fecha_larga(test['ds'].iloc[0])} al 31 de diciembre. No se toca hasta el final.",
                  f"Ojo: {(test['y'] == 0).sum()} de los 13 días en cero cayeron en la prueba, incluido el paro de diciembre. Ningún modelo los va a anticipar.",
                  f"Para elegir la configuración de la STL (fase 5), el entrenamiento se vuelve a partir 80/20: {inicio_val_eda} días para ajustar y "
                  f"{len(train) - inicio_val_eda} de <b>validación</b> ({fecha_corta(train['ds'].iloc[inicio_val_eda])} – {fecha_corta(train['ds'].iloc[-1])})."],
          etiquetas=["serie", "entrenamiento", "prueba", "ceros", "validación"], etiqueta="Paso", vel=2300, alto=320,
          yaxis={"title": {"text": "kWh/día"}})
```
@widget lab-anim id=anim-division
@@ Lectura
- **Entrenamiento:** {{=len(train)}} días (1 de enero – {{=fecha_larga(train['ds'].iloc[-1])}}). **Prueba:** {{=len(test)}} días ({{=fecha_larga(test['ds'].iloc[0])}} – 31 de diciembre).
- La prueba tiene **{{=int((test['y'] == 0).sum())}} días en 0 kWh**: casi todos los ceros del año. Eso va a pesar en cualquier métrica.
- La prueba cae en la temporada de viento y el entrenamiento termina en la de calma; la validación interna (agosto–octubre) también es temporada de calma.
@@ Decisión
✅ Desde aquí, todas las pruebas y gráficas de diagnóstico usan solo `train`.
:::
