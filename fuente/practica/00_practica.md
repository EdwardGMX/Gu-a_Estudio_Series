<section class="portada" id="inicio">
<span class="etiqueta">⏱️ Práctica para el examen</span>
<h1>Simulacro, repaso de errores e interpretación de salidas</h1>
<p class="bajada">Tres herramientas para comprobar que ya puedes resolver el examen: un simulacro con ejercicios al azar de las tres unidades, la lista de lo que has fallado y un generador de salidas de Python para interpretar.</p>
<ul class="insignias"><li>⏱️ 15 ejercicios al azar</li><li>📈 Calificación por unidad y por tema</li><li>🔁 Tus errores, hasta que salgan</li><li>📊 Salidas nuevas cada vez</li></ul>
</section>

## ⏱️ Simulacro de examen {#simulacro}

Quince ejercicios, cinco por unidad: opción múltiple, respuesta abierta y una salida para interpretar de cada unidad. Las respuestas no se muestran hasta que termines. Al calificar verás tu nota por unidad y por tema, con el enlace a lo que conviene repasar; las preguntas abiertas las calificas tú contra la respuesta modelo.

@widget simulacro

## 🔁 Repasar mis errores {#errores}

Aquí aparecen los ejercicios que has fallado en las unidades, en las preguntas tipo o en un simulacro, y las preguntas abiertas que calificaste «a medias» o «mal». Cada uno sale de la lista cuando lo respondes bien.

@widget errores

## 📊 Interpretar salidas {#interpretar}

En el examen te pueden dar una gráfica o una tabla ya calculada y pedirte la conclusión. Elige el tipo de salida y pulsa **Nueva salida**: la página simula una serie, calcula el resultado con las mismas fórmulas que `statsmodels` y `scipy`, y te pregunta qué concluyes. La respuesta correcta se deriva de los números que ves.

:::interactivo interpretar | Genera una salida y decide qué concluir {#generador}
@@@
- **ACF y PACF**: busca cuál de las dos se corta y en qué rezago; la banda sombreada es $\pm 1.96/\sqrt{n}$. Un pico aislado apenas fuera de la banda es esperable: con 20 rezagos, uno de cada veinte se sale por azar.
- **ADF y KPSS**: las hipótesis nulas son opuestas. Decide con $\alpha = 0.05$ y usa la tabla de lectura conjunta.
- **Ljung–Box**: se aplica a residuos; un p-value pequeño significa que quedó autocorrelación sin modelar.
- **`summary()`**: revisa primero la columna `P>|z|` y luego las cuatro pruebas de abajo (`Prob(Q)`, `Prob(JB)`, `Prob(H)`).
- **Periodograma**: el pico más alto marca la frecuencia dominante; el periodo es $1/\omega$.
:::
