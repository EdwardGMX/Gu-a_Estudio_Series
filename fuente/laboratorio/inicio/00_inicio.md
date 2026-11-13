<section class="portada" id="inicio">
<span class="etiqueta">🧪 Laboratorio · Análisis de Series de Tiempo</span>
<h1>Laboratorio de análisis completos</h1>
<p class="bajada">Elige un dataset y recorre un análisis real de principio a fin, como lo haría un científico de datos especializado en series de tiempo: con hipótesis, intentos que fallan, decisiones justificadas y las herramientas de las tres unidades.</p>
<div class="lab-datasets">
<a class="lab-ds" href="lab-manchas-solares.html"><span class="lab-ds-ico">☀️</span><b>Manchas solares</b><small>Número anual de manchas solares, 1700–2008 (309 años). Un ciclo de ~11 años que no es una estacionalidad.</small><span class="lab-ds-tags"><span>anual</span><span>ciclo</span><span>AR(p)</span><span>espectral</span><span>filtros</span></span><span class="lab-ds-ir">Abrir el flujo →</span></a>
<div class="lab-ds proximo"><span class="lab-ds-ico">✈️</span><b>AirPassengers</b><small>Pasajeros mensuales 1949–1960: tendencia y estacionalidad multiplicativa.</small><span class="lab-ds-tags"><span>mensual</span><span>SARIMA</span></span></div>
<div class="lab-ds proximo"><span class="lab-ds-ico">🌋</span><b>CO₂ de Mauna Loa</b><small>Concentración de CO₂ 1958–2001: tendencia más estacionalidad aditiva.</small><span class="lab-ds-tags"><span>mensual</span><span>STL</span></span></div>
<div class="lab-ds proximo"><span class="lab-ds-ico">🏦</span><b>Macroeconomía de EE. UU.</b><small>PIB, consumo y desempleo trimestrales 1959–2009: ciclos económicos y coherencia.</small><span class="lab-ds-tags"><span>trimestral</span><span>HP / BK</span><span>ARMAX</span></span></div>
<div class="lab-ds proximo"><span class="lab-ds-ico">🌊</span><b>Caudal del Nilo</b><small>Caudal anual 1871–1970 con una ruptura conocida en 1898.</small><span class="lab-ds-tags"><span>anual</span><span>rupturas</span></span></div>
</div>
</section>

## 🧭 Cómo se lee un flujo del Laboratorio {#como-leer}

Cada dataset es un **caso completo**. Empieza con una **introducción** (de dónde vienen los datos y qué problema resuelven) y un **objetivo general** con las hipótesis iniciales del analista. Sigue con el **flujo**: una serie de **pastillas**, una por paso. Termina con los **resultados generales**.

Cada pastilla es un paso del análisis y tiene siempre la misma estructura:

| Sección | Qué contiene |
|---|---|
| 🎯 **Objetivo** | Qué se quiere averiguar y por qué es el paso lógico en ese momento. |
| ⚙️ **Parámetros y por qué** | Cada argumento del código, el valor elegido y la razón. |
| ▶ **Ver el código** | El código Python del paso (toca el triángulo para desplegarlo). Todas las pastillas, en orden, forman un análisis que corre de corrido. |
| 📊 **Resultado** | La salida real del código, con su gráfica o tabla. |
| 🔎 **Qué nos dicen los valores** | La lectura de cada número y de lo que se ve en la gráfica. |
| ➡️ **Decisión y siguiente paso** | Qué se concluye, qué se hará después y con qué código. |

El color de la pastilla dice **cómo salió** ese intento:

<div class="lab-leyenda"><span style="background:var(--celeste-f);border-color:var(--celeste);color:var(--celeste-o)">🔵 Exploración: se mira, todavía no se decide</span><span style="background:var(--verde-f);border-color:var(--verde);color:var(--verde-o)">✅ Logrado: se cumplió el objetivo del paso</span><span style="background:var(--mantequilla-f);border-color:var(--mantequilla);color:var(--mantequilla-o)">🟡 Funciona con reservas: sirve, pero con un costo o una duda</span><span style="background:var(--coral-f);border-color:var(--coral);color:var(--coral-o)">❌ Descartado: la suposición no se sostuvo</span></div>

Las pastillas rojas no son errores del analista: son **suposiciones razonables que los datos desmintieron**. Ver por qué falló algo enseña tanto como ver lo que funciona. Por eso cada una explica qué se esperaba, qué salió y qué se intenta después.

:::cuidado Las gráficas son fijas
A diferencia de las unidades, aquí las gráficas no tienen controles: muestran exactamente el resultado del código de su pastilla, que se ejecutó al generar la página. Al pasar el cursor ves cada valor y puedes hacer zoom.
:::
