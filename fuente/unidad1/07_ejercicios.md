## 🧩 Ejercicios de la Unidad I {#ejercicios}
@mapa 54 ejercicios de opción múltiple, cálculo y lectura de gráficas, cada uno con su respuesta explicada.

Elige una opción y presiona **Ver respuesta**: se marca la correcta, se explica por qué y hay un enlace a la sección donde se estudia el tema. Los ejercicios de cálculo abierto tienen **Ver solución paso a paso**. Intenta resolverlos en papel antes de abrir la solución.

<div class="marcador" id="marcador"><div class="m-datos"><span class="m-resp"></span><span class="m-ok"></span><span class="m-mal"></span></div><button type="button">Reiniciar ejercicios</button></div>

### Bloque A · Naturaleza de las series y componentes {#ej-a}

:::ejercicio Básico | [[fecha]]
¿Cuál de los siguientes conjuntos de datos **no** es una serie de tiempo?
- [ ] La temperatura máxima de cada día en Toluca durante 2024.
- [x] La lista de clientes de un banco con la fecha en que abrió cada uno su cuenta.
- [ ] El número de pasajeros que entran al Metro cada hora.
- [ ] Las ventas mensuales de una tienda desde 2015.
---
Cada fila de la lista de clientes es una **persona distinta**: no hay una variable medida de forma comparable en intervalos regulares ni dependencia entre «el cliente de ayer» y «el de hoy». Tener una fecha no basta. Si se agregara («cuentas abiertas por día»), sí sería una serie.
:::

:::ejercicio Básico | [[cinco]]
En datos mensuales de ventas aparece cada diciembre un pico de tamaño parecido. ¿Qué componente es?
- [ ] Tendencia
- [ ] Ciclo
- [x] Estacionalidad
- [ ] Ruptura estructural
---
Es un patrón que se repite con **periodo fijo y conocido** (12 meses). El ciclo también sube y baja, pero con duración **variable** y normalmente de varios años [[est-vs-ciclo]].
:::

:::ejercicio Intermedio | [[multiplicativo]]
En una gráfica, las oscilaciones estacionales son cada año más grandes conforme la serie crece. ¿Qué conviene hacer?
- [ ] Usar un modelo aditivo directamente.
- [x] Usar un modelo multiplicativo o, equivalentemente, trabajar con $\ln y_t$.
- [ ] Eliminar los datos de los últimos años.
- [ ] Usar una media móvil de 5 meses.
---
Una amplitud que crece con el nivel indica que el efecto estacional es un **porcentaje** del nivel: modelo multiplicativo $y_t = T_t \times S_t \times R_t$. El logaritmo lo convierte en aditivo [[demo-log]] y estabiliza la varianza.
:::

:::ejercicio Básico | [[multiplicativo]]
En un modelo multiplicativo sin ruido, la tendencia de julio vale $T_t = 200$ y el factor estacional de julio es $S_t = 1.15$. ¿Cuánto vale $y_t$ y cuál es el efecto estacional en unidades?
- [ ] $y_t = 201.15$; efecto de 1.15
- [ ] $y_t = 215$; efecto de 15
- [x] $y_t = 230$; efecto de +30
- [ ] $y_t = 345$; efecto de +145
---
$y_t = T_t \times S_t = 200 \times 1.15 = 230$. El factor 1.15 significa «15% arriba de la tendencia», y 15% de 200 son **30 unidades**. Si la tendencia fuera 400, el mismo factor daría +60: por eso la amplitud crece con el nivel.
:::

:::ejercicio Intermedio | [[descomposicion]]
En una descomposición **aditiva** trimestral, los promedios de $y_t - \hat T_t$ por trimestre salieron $(6,\; -2,\; -5,\; 3)$. ¿Cuál es el índice estacional del primer trimestre?
- [ ] 6
- [x] 5.5
- [ ] 6.5
- [ ] 1.5
---
:::pasos
= \frac{6 - 2 - 5 + 3}{4} = \frac{2}{4} = 0.5
> Los promedios suman 2, no 0: se calcula su media.
= \hat S_{Q1} = 6 - 0.5 = 5.5
> Se centra restando la media. Los índices quedan $(5.5,\, -2.5,\, -5.5,\, 2.5)$, que sí suman 0.
:::
:::

:::ejercicio Básico | [[mm-centrada]]
¿Cuáles son los pesos de la media móvil centrada 2×4 que se usa con datos trimestrales?
- [ ] $(\tfrac14, \tfrac14, \tfrac14, \tfrac14)$
- [x] $(\tfrac18, \tfrac14, \tfrac14, \tfrac14, \tfrac18)$
- [ ] $(\tfrac15, \tfrac15, \tfrac15, \tfrac15, \tfrac15)$
- [ ] $(\tfrac12, \tfrac14, \tfrac14)$
---
Con periodo par no hay centro exacto: se usan 5 datos y los extremos pesan la mitad. Los pesos suman 1 y son simétricos, así que la media conserva una tendencia lineal [[mm-lineal]] y elimina un patrón trimestral [[mm-estacional]].
:::

:::ejercicio Intermedio | [[mm-estacional]]
Se calcula una media móvil de **3** meses sobre una serie con estacionalidad **mensual** (periodo 12). ¿Qué ocurre?
- [ ] La estacionalidad se elimina por completo.
- [x] La tendencia estimada conserva parte del patrón estacional.
- [ ] La media móvil queda exactamente igual a la serie.
- [ ] La varianza del ruido se multiplica por 3.
---
La estacionalidad solo se cancela cuando la ventana abarca **periodos completos**, porque así suma todo el patrón (que suma 0). Con 3 meses se promedian unas pocas temporadas y el patrón sobrevive suavizado. En cambio, el ruido sí se reduce: su varianza se **divide** entre 3 [[mm-ruido]].
:::

:::ejercicio Reto | [[log]]
Si $y_t = T_t \times S_t \times R_t$ con $S_{\text{julio}} = 1.2$, ¿cuánto vale el efecto estacional de julio en la serie $\ln y_t$?
- [ ] 1.2
- [ ] 0.2
- [x] $\ln 1.2 \approx 0.182$
- [ ] Depende del nivel de la tendencia.
---
$\ln y_t = \ln T_t + \ln S_t + \ln R_t$, así que en escala logarítmica el efecto estacional es **aditivo** y vale $\ln 1.2 = 0.1823$, sin importar el nivel. Es aproximadamente el 20% (para cambios pequeños $\ln(1+x) \approx x$ [[logaritmos]]).
:::

### Bloque B · Estadísticos básicos {#ej-b}

:::ejercicio Básico | [[autocorr]]
Calcula a mano $\bar y$, $\hat\gamma(0)$, $\hat\gamma(1)$, $\hat\rho(1)$ y $\hat\rho(2)$ para la serie $y = (1,\; 3,\; 2,\; 4,\; 5)$.
---
:::pasos
= \bar y = \frac{1 + 3 + 2 + 4 + 5}{5} = \frac{15}{5} = 3
> Media.
= d_t = y_t - \bar y = (-2,\; 0,\; -1,\; 1,\; 2)
> Desviaciones (suman 0 ✓).
= \hat\gamma(0) = \frac{4 + 0 + 1 + 1 + 4}{5} = \frac{10}{5} = 2
> Promedio de cuadrados, dividiendo entre $n = 5$.
= \sum_{t=2}^{5} d_t d_{t-1} = (0)(-2) + (-1)(0) + (1)(-1) + (2)(1) = 0 + 0 - 1 + 2 = 1
> Productos con el rezago 1 (cuatro parejas).
= \hat\gamma(1) = \frac{1}{5} = 0.2, \qquad \hat\rho(1) = \frac{0.2}{2} = 0.1
> Se divide entre $n$ y luego entre $\hat\gamma(0)$.
= \sum_{t=3}^{5} d_t d_{t-2} = (-1)(-2) + (1)(0) + (2)(-1) = 2 + 0 - 2 = 0 \;\Rightarrow\; \hat\rho(2) = 0
> Rezago 2: tres parejas que se compensan.
:::

Puedes comprobarlo con la calculadora de [[autocorr]].
:::

:::ejercicio Básico | [[autocorr]]
¿Por qué $\rho(0) = 1$ en cualquier serie?
- [ ] Porque la media siempre vale 1.
- [x] Porque $\rho(0) = \gamma(0)/\gamma(0)$: cada valor está perfectamente correlacionado consigo mismo.
- [ ] Porque el primer dato de la serie se normaliza a 1.
- [ ] Solo vale 1 si la serie es estacionaria.
---
$\rho(k) = \gamma(k)/\gamma(0)$; con $k = 0$ el numerador y el denominador son la misma varianza. No depende de los datos ni de la estacionariedad.
:::

:::ejercicio Intermedio | [[autocov-prop]]
¿Cuál de las siguientes afirmaciones sobre la autocovarianza de un proceso estacionario es **falsa**?
- [ ] $\gamma(k) = \gamma(-k)$
- [ ] $\gamma(0) = \Var(y_t)$
- [ ] $|\gamma(k)| \le \gamma(0)$
- [x] $\gamma(k)$ siempre está entre −1 y 1.
---
La que está acotada entre −1 y 1 es la **autocorrelación** $\rho(k)$ [[corr-acotada]]. La autocovarianza tiene las unidades de la serie al cuadrado: si la serie está en miles de pesos, $\gamma(k)$ puede valer 50 000. Las otras tres son propiedades demostradas en [[autocov-prop]].
:::

:::ejercicio Intermedio | [[autocov]]
En $\hat\gamma(k) = \frac1n\sum_{t=k+1}^{n}(y_t - \bar y)(y_{t-k} - \bar y)$, ¿por qué la suma empieza en $t = k + 1$?
- [ ] Para descartar los primeros $k$ datos por ser atípicos.
- [x] Porque para $t \le k$ no existe el valor $y_{t-k}$.
- [ ] Porque así la suma da exactamente 0.
- [ ] Es un error tipográfico; debe empezar en $t = 1$.
---
Si $t = k$, haría falta $y_0$, que no observamos. Solo hay $n - k$ parejas completas [[rezago]]. Aun así se divide entre $n$ (no entre $n - k$) por las razones de la nota de [[autocov]].
:::

### Bloque C · Estacionariedad, raíz unitaria y diferenciación {#ej-c}

:::ejercicio Básico | [[def-debil]]
¿Qué condiciones definen la estacionariedad **débil**?
- [ ] Media cero, varianza uno y distribución normal.
- [x] Media constante, varianza constante (finita) y autocovarianza que depende solo del rezago.
- [ ] Que la serie no tenga valores atípicos.
- [ ] Que la serie sea plana, sin subidas ni bajadas.
---
Son las tres condiciones de [[def-debil]]. La media no tiene que ser 0 ni la distribución normal, y la serie puede oscilar mucho: «estacionaria» no es «plana» [[no-plana]].
:::

:::ejercicio Intermedio | [[ar1]]
Un AR(1) tiene $c = 3$, $\phi = 0.4$ y $\sigma^2 = 2.1$. ¿Cuáles son su media, su varianza y $\rho(2)$?
- [ ] $\mu = 3$, $\gamma(0) = 2.1$, $\rho(2) = 0.4$
- [x] $\mu = 5$, $\gamma(0) = 2.5$, $\rho(2) = 0.16$
- [ ] $\mu = 7.5$, $\gamma(0) = 3.5$, $\rho(2) = 0.8$
- [ ] $\mu = 5$, $\gamma(0) = 5.25$, $\rho(2) = 0.16$
---
:::pasos
= \mu = \frac{c}{1-\phi} = \frac{3}{0.6} = 5
> [[ar1-media]]
= \gamma(0) = \frac{\sigma^2}{1 - \phi^2} = \frac{2.1}{1 - 0.16} = \frac{2.1}{0.84} = 2.5
> [[ar1-varianza]] — ojo: es $\phi^2$, no $\phi$.
= \rho(2) = \phi^2 = 0.16
> [[ar1-acf]]
:::
:::

:::ejercicio Básico | [[paseo-demo]]
En un paseo aleatorio $y_t = y_{t-1} + \varepsilon_t$ con $y_0 = 0$ y $\sigma^2 = 4$, ¿cuál es la desviación estándar de $y_{25}$?
- [ ] 2
- [ ] 4
- [x] 10
- [ ] 100
---
$\Var(y_t) = t\,\sigma^2 = 25 \times 4 = 100$, así que la desviación estándar es $\sqrt{100} = 10$. (100 es la varianza, no la desviación.) La incertidumbre crece con $\sqrt t$.
:::

:::ejercicio Intermedio | [[est-no-estacionaria]]
La serie $y_t = 10 + 3\sin(2\pi t/12) + \varepsilon_t$, con $\varepsilon_t$ ruido blanco, ¿es estacionaria?
- [ ] Sí, porque su media móvil de 12 meses es constante.
- [ ] Sí, porque ADF y KPSS no detectan problemas.
- [x] No, porque $\E[y_t] = 10 + 3\sin(2\pi t/12)$ depende de $t$.
- [ ] No, porque su varianza crece con $t$.
---
La estacionalidad determinística hace que la **media cambie según el mes**: falla la condición (1) [[est-no-estacionaria]]. Que la media móvil de 12 meses salga plana es la trampa de [[estacionalidad-vs]]: la ventana cubre un periodo completo y cancela el patrón. La varianza sí es constante ($\sigma^2$).
:::

:::ejercicio Intermedio | [[raiz-demo]]
Para el AR(1) $y_t = 0.8\,y_{t-1} + \varepsilon_t$, ¿cuál es la raíz de su ecuación característica y qué implica?
- [ ] $z = 0.8$, dentro del círculo: explosivo.
- [x] $z = 1.25$, fuera del círculo unitario: estacionario.
- [ ] $z = 1$: raíz unitaria.
- [ ] $z = -0.8$: alterna de signo.
---
$1 - 0.8z = 0 \Rightarrow z = 1/0.8 = 1.25$. Como $|z| > 1$ (equivale a $|\phi| < 1$), el proceso es estacionario [[raiz-demo]]. Cuidado: la raíz es $1/\phi$, no $\phi$.
:::

:::ejercicio Intermedio | [[vida-media]]
En un AR(1) con $\phi = 0.8$, ¿después de cuántos periodos se reduce a la mitad el efecto de un choque?
- [ ] 0.8
- [ ] 1.25
- [x] Aproximadamente 3.1
- [ ] Nunca: el choque es permanente.
---
$h = \dfrac{\ln 0.5}{\ln 0.8} = \dfrac{-0.6931}{-0.2231} = 3.106$. Comprobación: $0.8^3 = 0.512$, casi la mitad ✓. Solo con $\phi = 1$ el choque sería permanente.
:::

:::ejercicio Reto | [[sobre-diferenciar]]
Se diferencia una serie $y_t = a + b\,t + \varepsilon_t$ (tendencia determinística con ruido blanco). ¿Cuál es la autocorrelación del rezago 1 de $\Delta y_t$?
- [ ] 0
- [ ] 1
- [x] −0.5
- [ ] $b$
---
$\Delta y_t = b + \varepsilon_t - \varepsilon_{t-1}$. Su varianza es $2\sigma^2$ y su autocovarianza en el rezago 1 es $-\sigma^2$, así que $\rho(1) = -\sigma^2/(2\sigma^2) = -0.5$ [[sobre-diferenciar]]. Es la huella de haber **diferenciado de más**: lo correcto era restar la recta.
:::

:::ejercicio Básico | [[tendencias]]
Una serie es un paseo aleatorio con deriva, $y_t = 0.5 + y_{t-1} + \varepsilon_t$. ¿Qué transformación la vuelve estacionaria?
- [ ] Restarle una recta ajustada por regresión.
- [x] Diferenciarla una vez: $\Delta y_t = 0.5 + \varepsilon_t$.
- [ ] Tomar el logaritmo.
- [ ] Aplicarle una media móvil de 12 periodos.
---
La tendencia es **estocástica**: los choques se acumulan. La diferencia cancela lo acumulado y deja ruido blanco más una constante [[deriva-demo]]. Si se restara una recta, quedaría $\sum\varepsilon_j$, que sigue siendo un paseo aleatorio.
:::

:::ejercicio Intermedio | [[dif-demo]]
Si $y_t = 2 + 3t + 0.5\,t^2$, ¿cuánto vale $\Delta^2 y_t$?
- [ ] 0
- [ ] 0.5
- [x] 1
- [ ] 3
---
Con $y_t = a + bt + ct^2$ se demostró que $\Delta^2 y_t = 2c$ [[dif-demo]]. Aquí $c = 0.5$, así que $\Delta^2 y_t = 1$. La segunda diferencia elimina la tendencia cuadrática.
:::

:::ejercicio Básico | [[ruido-blanco]]
¿Cuál es la ACF teórica de un ruido blanco?
- [ ] $\rho(k) = 0.5^k$
- [x] $\rho(0) = 1$ y $\rho(k) = 0$ para todo $k \ne 0$
- [ ] $\rho(k) = 1$ para todo $k$
- [ ] Decae lentamente desde 1
---
El ruido blanco no tiene memoria: $\Cov(\varepsilon_t, \varepsilon_{t-k}) = 0$ para $k \ne 0$ [[rb-estacionario]]. En una muestra, las $\hat\rho(k)$ no son exactamente 0 sino que caen dentro de las bandas $\pm 1.96/\sqrt n$ (salvo un 5%).
:::

### Bloque D · Pruebas ADF y KPSS {#ej-d}

:::ejercicio Básico | [[df-deduccion]]
¿Cuál es la hipótesis nula de la prueba ADF?
- [ ] La serie es estacionaria.
- [x] La serie tiene raíz unitaria (no es estacionaria).
- [ ] La serie no tiene autocorrelación.
- [ ] La serie es ruido blanco.
---
ADF prueba $H_0: \delta = 0$ ($\phi = 1$, raíz unitaria) contra $H_1: \delta < 0$ (estacionaria). Rechazar es evidencia **a favor** de la estacionariedad [[tabla-hipotesis]].
:::

:::ejercicio Básico | [[kpss]]
¿Cuál es la hipótesis nula de la prueba KPSS?
- [x] La serie es estacionaria (alrededor de una constante o de una tendencia).
- [ ] La serie tiene raíz unitaria.
- [ ] La serie es estacional.
- [ ] La varianza de la serie es cero.
---
KPSS supone estacionariedad: $H_0: \sigma^2_u = 0$, el paseo aleatorio escondido es constante [[kpss]]. Su nula es la **opuesta** a la de ADF.
:::

:::ejercicio Intermedio | [[conjunta]]
ADF da p-value = 0.01 y KPSS da p-value = 0.20. ¿Qué concluyes?
- [x] Evidencia favorable de estacionariedad.
- [ ] Evidencia de no estacionariedad.
- [ ] Ambas rechazan: hay un cambio de régimen.
- [ ] Evidencia insuficiente.
---
ADF **rechaza** la raíz unitaria (0.01 < 0.05) y KPSS **no rechaza** la estacionariedad (0.20 > 0.05): ambas apuntan a lo mismo [[conjunta]].
:::

:::ejercicio Intermedio | [[conjunta]]
ADF da p-value = 0.62 y KPSS da p-value = 0.01. ¿Qué concluyes y qué harías?
- [ ] Es estacionaria; se puede modelar con ARMA directamente.
- [x] No es estacionaria; conviene transformar o diferenciar y volver a probar.
- [ ] Evidencia insuficiente; hay que conseguir más datos.
- [ ] El resultado es contradictorio; se debe ignorar.
---
ADF **no rechaza** la raíz unitaria y KPSS **rechaza** la estacionariedad: ambas coinciden en «no estacionaria». El siguiente paso es la transformación mínima ($\ln$, $\Delta$, $\Delta_s$) y repetir las pruebas [[flujo]].
:::

:::ejercicio Intermedio | [[especificaciones]]
Una serie crece de forma lineal y sostenida. ¿Qué especificación de la ADF debes usar?
- [ ] `regression="n"` (sin constante)
- [ ] `regression="c"` (solo constante)
- [x] `regression="ct"` (constante y tendencia)
- [ ] Da igual: el resultado no cambia.
---
Con tendencia lineal se incluye $\beta t$, así la alternativa es «estacionaria alrededor de una recta». Si solo se usa constante, la prueba confunde la tendencia determinística con raíz unitaria y casi nunca rechaza [[especificaciones]].
:::

:::ejercicio Reto | [[df-mano]]
En una regresión de Dickey–Fuller **sin constante** con 40 observaciones se obtuvo $\sum y_{t-1}\Delta y_t = -12$, $\sum y_{t-1}^2 = 30$ y $\tip{se}{\operatorname{EE}}(\hat\delta) = 0.15$. ¿Cuál es $\tau$ y qué se concluye al 5% (crítico ≈ −1.95)?
- [ ] $\tau = -0.40$; no se rechaza $H_0$.
- [x] $\tau = -2.67$; se rechaza $H_0$: no hay raíz unitaria.
- [ ] $\tau = -2.67$; no se rechaza porque $-2.67 < -1.95$.
- [ ] $\tau = 2.67$; se rechaza $H_0$.
---
:::pasos
= \hat\delta = \frac{-12}{30} = -0.4
> Estimador de mínimos cuadrados [[df-mco]] (equivale a $\hat\phi = 0.6$).
= \tau = \frac{-0.4}{0.15} = -2.667
> Estadístico de Dickey–Fuller.
= -2.667 < -1.95 \;\Rightarrow\; \text{se rechaza } H_0
> La región de rechazo está en la cola **izquierda**: más negativo que el crítico ⇒ rechazar.
:::
:::

:::ejercicio Intermedio | [[df]]
¿Por qué no se usa el valor crítico $-1.645$ de la normal para la ADF?
- [ ] Porque la ADF es una prueba de dos colas.
- [x] Porque bajo $H_0$ el regresor $y_{t-1}$ es un paseo aleatorio y $\tau$ no sigue una distribución $t$ ni normal.
- [ ] Porque los datos de series de tiempo nunca son normales.
- [ ] Por costumbre; daría el mismo resultado.
---
Bajo la raíz unitaria la varianza de $y_{t-1}$ crece con $t$ y los teoremas usuales no aplican. La distribución de Dickey–Fuller está corrida a la izquierda (crítico 5% de −2.86 con constante); usar −1.645 llevaría a rechazar $H_0$ verdadera demasiadas veces [[distdf]].
:::

:::ejercicio Reto | [[kpss]]
Calcula el estadístico KPSS (especificación `"c"`, $L = 0$) para $y = (4,\; 4,\; 5,\; 6,\; 6)$ y decide al 5% (crítico 0.463).
---
:::pasos
= \bar y = \frac{25}{5} = 5, \qquad \ehat_t = (-1,\; -1,\; 0,\; 1,\; 1)
> Residuos respecto a la media.
= S_t = (-1,\; -2,\; -2,\; -1,\; 0)
> Sumas acumuladas (terminan en 0, como siempre [[suma-desv]]).
= \frac{1}{n^2}\sum S_t^2 = \frac{1 + 4 + 4 + 1 + 0}{25} = \frac{10}{25} = 0.4
> Numerador del estadístico.
= \lrvar = \frac{1 + 1 + 0 + 1 + 1}{5} = 0.8
> Con $L = 0$ es el promedio de los residuos al cuadrado.
= \eta = \frac{0.4}{0.8} = 0.5 > 0.463 \;\Rightarrow\; \text{se rechaza } H_0
> La serie sube de forma sostenida: no es estacionaria en nivel. (`kpss(y, "c", nlags=0)` da p ≈ 0.042.)
:::
:::

:::ejercicio Intermedio | [[kpss]]
`kpss` devuelve p-value = 0.10 con el aviso `InterpolationWarning: the actual p-value is greater than the p-value returned`. ¿Qué significa?
- [ ] La prueba falló y hay que repetirla.
- [x] El estadístico es menor que el crítico del 10%; el p-value real es mayor que 0.10 y no se rechaza la estacionariedad.
- [ ] Se rechaza $H_0$ al 10%.
- [ ] La serie tiene raíz unitaria.
---
La tabla de KPSS solo cubre del 1% al 10%. Fuera de ella, `statsmodels` devuelve el extremo y avisa [[kpss]]. «p > 0.10» significa que no hay evidencia contra la estacionariedad.
:::

:::ejercicio Intermedio | [[rupturas]]
Una serie es ruido blanco alrededor de 0 durante 5 años y luego, tras un cambio de política, ruido blanco alrededor de 4. ¿Qué riesgo hay al aplicar ADF a toda la serie?
- [ ] Ninguno: ADF detecta bien los cambios de nivel.
- [x] Que no rechace la raíz unitaria, confundiendo el salto con persistencia.
- [ ] Que rechace siempre con p = 0.
- [ ] Que el estadístico salga positivo.
---
El salto hace que la serie «no regrese» a su nivel anterior y la ADF lo interpreta como raíz unitaria [[rupturas]]. Hay que graficar, analizar por tramos o usar pruebas con ruptura (Zivot–Andrews).
:::

### Bloque E · ACF, PACF y Ljung–Box {#ej-e}

:::ejercicio Básico | [[bartlett]]
Con $n = 225$ observaciones, ¿cuál es la banda aproximada al 95% para la ACF de un ruido blanco?
- [ ] $\pm 0.05$
- [x] $\pm 0.131$
- [ ] $\pm 0.196$
- [ ] $\pm 1.96$
---
$\pm 1.96/\sqrt{225} = \pm 1.96/15 = \pm 0.1307$ [[bartlett]].
:::

:::ejercicio Intermedio | [[patrones]]
Esta es la ACF y la PACF de una serie simulada de 200 datos. ¿Qué proceso la generó?

@widget figura-acf proceso=ar1 param=0.7 semilla=9 n=200

- [x] Un AR(1) con $\phi > 0$
- [ ] Un MA(1)
- [ ] Ruido blanco
- [ ] Un paseo aleatorio
---
La ACF **decae geométricamente** ($0.71,\ 0.50,\ 0.35, \dots$, muy cerca de $0.7^k$) y la PACF **se corta** después del rezago 1: es la firma de un AR(1) con $\phi \approx 0.7$ [[ar1-acf]] [[pacf-2]].
:::

:::ejercicio Intermedio | [[patrones]]
¿Y esta?

@widget figura-acf proceso=ma1 param=0.8 semilla=9 n=200

- [ ] Un AR(1) con $\phi > 0$
- [x] Un MA(1) con $\theta > 0$
- [ ] Un paseo aleatorio
- [ ] Una serie estacional de periodo 12
---
La ACF tiene un pico en el rezago 1 y **se corta** (los demás quedan dentro de la banda); la PACF decae alternando. Es un MA(1) [[ma1-acf]]. Con $\theta = 0.8$, $\rho(1) = 0.8/1.64 = 0.49$.
:::

:::ejercicio Intermedio | [[patrones]]
¿Qué indica esta ACF?

@widget figura-acf proceso=paseo param=0 semilla=2 n=200

- [ ] Ruido blanco: no hay que hacer nada.
- [ ] Un MA(1).
- [x] Raíz unitaria o tendencia: conviene diferenciar antes de modelar.
- [ ] Estacionalidad de periodo 12.
---
La ACF empieza casi en 1 y baja **muy despacio**: es la huella del paseo aleatorio, donde $\Corr(y_t, y_{t-k}) = \sqrt{(t-k)/t}$ [[paseo-demo]]. Hay que diferenciar y volver a mirar.
:::

:::ejercicio Reto | [[pacf-2]]
Si $\rho(1) = 0.5$ y $\rho(2) = 0.4$, ¿cuánto vale la autocorrelación parcial $\phi_{22}$?
- [ ] 0.4
- [ ] 0.15
- [x] 0.2
- [ ] −0.1
---
$$\phi_{22} = \frac{\rho_2 - \rho_1^2}{1 - \rho_1^2} = \frac{0.4 - 0.25}{1 - 0.25} = \frac{0.15}{0.75} = 0.2$$
De la correlación total 0.4 del rezago 2, una parte (0.25) llega indirectamente a través del rezago 1 [[indirectos]].
:::

:::ejercicio Intermedio | [[ma1-acf]]
Para un MA(1) $y_t = \varepsilon_t + 0.5\,\varepsilon_{t-1}$, ¿cuánto vale $\rho(1)$ y $\rho(2)$?
- [ ] $\rho(1) = 0.5$, $\rho(2) = 0.25$
- [x] $\rho(1) = 0.4$, $\rho(2) = 0$
- [ ] $\rho(1) = 0.5$, $\rho(2) = 0$
- [ ] $\rho(1) = 0.25$, $\rho(2) = 0.125$
---
$\rho(1) = \theta/(1 + \theta^2) = 0.5/1.25 = 0.4$ y $\rho(k) = 0$ para $k \ge 2$ porque $y_t$ y $y_{t-2}$ no comparten ningún choque [[ma1-acf]]. La opción con 0.25 corresponde al patrón de un AR(1).
:::

:::ejercicio Intermedio | [[lb-mano]]
Con $n = 50$ y $\hat\rho(1) = 0.4$, calcula el estadístico de Ljung–Box con $h = 1$ y decide al 5% ($\chi^2_{1;\,0.95} = 3.841$).
---
:::pasos
= Q = n(n+2)\,\frac{\hat\rho(1)^2}{n - 1} = 50 \cdot 52 \cdot \frac{0.16}{49}
> Fórmula con un solo rezago [[lb-formula]].
= Q = 2600 \times 0.0032653 = 8.49
> Producto.
= 8.49 > 3.841 \;\Rightarrow\; \text{se rechaza } H_0 \;(\text{p-value} \approx 0.0036)
> Hay autocorrelación significativa en el rezago 1. (Coincide con lo que dice la banda: $0.4 > 1.96/\sqrt{50} = 0.277$.)
:::
:::

:::ejercicio Básico | [[lb-formula]]
¿Cuál es la hipótesis nula de la prueba de Ljung–Box con $h = 10$?
- [ ] La serie es estacionaria.
- [x] $\rho(1) = \rho(2) = \dots = \rho(10) = 0$: no hay autocorrelación hasta el rezago 10.
- [ ] Al menos una autocorrelación es distinta de cero.
- [ ] La serie tiene raíz unitaria.
---
Ljung–Box es una prueba **conjunta** de ausencia de autocorrelación [[lb-formula]]. La opción 3 es la alternativa $H_1$.
:::

:::ejercicio Reto | [[lb-h]]
Después de ajustar un modelo, Ljung–Box sobre los **residuos** da p-value = 0.003. ¿Qué significa?
- [ ] El modelo es excelente.
- [x] Los residuos aún tienen autocorrelación: el modelo no capturó toda la estructura temporal.
- [ ] Los residuos no son normales.
- [ ] La serie original no era estacionaria.
---
Un buen modelo deja residuos parecidos a ruido blanco. Con p < 0.05 se rechaza la ausencia de autocorrelación: queda señal que el modelo podría aprovechar [[lb-h]].
:::

:::ejercicio Intermedio | [[caso-probar]]
Para $\Delta\Delta_{12}\ln y_t$ de AirPassengers: ADF p ≈ 0.0002, KPSS p > 0.10 y Ljung–Box (h = 24) p ≈ 0. ¿Cuál es la lectura correcta?
- [ ] No es estacionaria y no tiene autocorrelación.
- [x] Es estacionaria, pero todavía tiene autocorrelación: hace falta un modelo (por ejemplo, con términos MA).
- [ ] Es ruido blanco: no hay nada más que modelar.
- [ ] Las pruebas se contradicen y no se puede concluir.
---
ADF + KPSS ⇒ estacionaria; Ljung–Box ⇒ con memoria lineal. Estacionaria **no** es ruido blanco [[lb-h]]: los picos de la ACF en 1 y 12 sugieren el modelo de aerolínea [[caso-acf]].
:::

:::ejercicio Básico | [[falsas-alarmas]]
Revisas la ACF de un ruido blanco en 40 rezagos con bandas al 95%. ¿Cuántas barras esperas ver fuera de la banda solo por azar?
- [ ] Ninguna
- [x] Alrededor de 2
- [ ] Alrededor de 20
- [ ] Todas
---
Cada barra tiene 5% de probabilidad de salir por azar: $40 \times 0.05 = 2$ en promedio. Por eso una barra aislada en un rezago alto no es evidencia fuerte, y se usa Ljung–Box para decidir de forma conjunta [[falsas-alarmas]].
:::

:::resumen ¿Cómo te fue?
Si fallaste algún ejercicio, usa el enlace ↩ de su encabezado para repasar esa sección y regresa con el botón **⤺ Volver**. Cuando domines todo, revisa la lista de [[checklist]].
:::

### Bloque F · Subseries, STL y pronóstico por descomposición {#ej-f}

:::ejercicio Básico | [[subseries]]
En una gráfica de subseries mensual, el tramo de julio sube mucho más rápido que el de noviembre. ¿Qué indica?
- [ ] Que no hay tendencia.
- [ ] Que la serie es estacionaria.
- [x] Que el patrón estacional cambia con los años (el pico crece).
- [ ] Que el periodo estacional no es 12.
---
Si cada mes creciera al mismo ritmo, la estacionalidad sería constante y todos los tramos tendrían la misma pendiente. Que julio suba más rápido significa que la diferencia entre julio y noviembre se agranda: justo lo que la descomposición clásica no puede capturar y STL sí [[stl-por-que]].
:::

:::ejercicio Básico | [[stl-por-que]]
¿Cuál de estas afirmaciones sobre STL es **falsa**?
- [ ] No deja `NaN` en los extremos de la tendencia.
- [ ] Permite que la estacionalidad cambie de un año a otro.
- [x] Puede aplicarse directamente con un modelo multiplicativo.
- [ ] Tiene una versión robusta ante atípicos.
---
STL solo es **aditiva**. Para una serie multiplicativa como AirPassengers se aplica al logaritmo, donde el patrón se vuelve aditivo [[log]], y se regresa con la exponencial.
:::

:::ejercicio Intermedio | [[guia-loess]]
En LOESS con una ventana de 5 datos centrada en $x_0$ (distancias $2, 1, 0, 1, 2$, así que $h = 2$), ¿cuánto pesa un vecino a distancia 1?
- [ ] 0.5
- [x] 0.6699
- [ ] 0.8750
- [ ] 1
---
$w = \left(1 - (1/2)^3\right)^3 = (7/8)^3 = 0.6699$. Los extremos, a distancia $h = 2$, pesan 0, así que la ventana de 5 usa en realidad 3 datos.
:::

:::ejercicio Intermedio | [[guia-loess]]
Con los pesos del ejercicio anterior ($0,\ 0.6699,\ 1,\ 0.6699,\ 0$) y los datos $y = (4,\ 6,\ 7,\ 10,\ 12)$, ¿cuánto vale el LOESS de grado 1 en el centro?
- [ ] 7
- [x] 7.6
- [ ] 7.8
- [ ] 8
---
La ventana es simétrica, así que la recta ponderada en el centro es el promedio ponderado: $\frac{0.6699(6) + 7 + 0.6699(10)}{0.6699 + 1 + 0.6699} = \frac{17.718}{2.3398} = 7.57 \approx 7.6$. El 12 del extremo no cuenta (peso 0).
:::

:::ejercicio Básico | [[stl-parametros]]
¿Qué ventana de tendencia usa `STL(serie, period=12)` si no se especifica `trend`?
- [ ] 12
- [ ] 13
- [x] 23
- [ ] 25
---
La regla es el menor impar mayor o igual que $\frac{1.5 \cdot 12}{1 - 1.5/7} = 22.91$, es decir 23 [[demo-stl-trend]]. El 13 es la ventana del paso bajo (`low_pass`).
:::

:::ejercicio Intermedio | [[stl-parametros]]
Quieres que STL dé exactamente el mismo patrón estacional todos los años. ¿Qué escribes?
- [ ] `STL(y, period=12, seasonal=7)`
- [ ] `STL(y, period=12, seasonal=999)`
- [x] `STL(y, period=12, seasonal=999, seasonal_deg=0)`
- [ ] `STL(y, period=12, robust=True)`
---
Con `seasonal_deg=1` (el valor por omisión) una ventana enorme ajusta una **recta** a cada subserie: el efecto de cada mes todavía puede crecer o bajar. Con grado 0 es un promedio, y el patrón queda fijo.
:::

:::ejercicio Intermedio | [[stl-robusto]]
Con `robust=True`, el peso de robustez de un dato cuyo residuo es 3 veces la mediana de $\lvert R \rvert$ es…
- [ ] 0
- [x] 0.5625
- [ ] 0.75
- [ ] 1
---
$\rho = \left(1 - \left(\frac{3\,\text{mediana}}{6\,\text{mediana}}\right)^2\right)^2 = (1 - 0.25)^2 = 0.5625$. A partir de 6 veces la mediana, el peso es 0.
:::

:::ejercicio Intermedio | [[fuerza]]
Una descomposición da $\Var(R) = 2$, $\Var(T + R) = 2.5$ y $\Var(S + R) = 40$. ¿Qué concluyes?
- [ ] Tendencia y estacionalidad fuertes.
- [x] Estacionalidad fuerte ($F_S = 0.95$) y tendencia débil ($F_T = 0.2$).
- [ ] Tendencia fuerte ($F_T = 0.8$) y estacionalidad débil.
- [ ] Ninguna de las dos.
---
$F_T = 1 - 2/2.5 = 0.2$ y $F_S = 1 - 2/40 = 0.95$. Casi toda la variación de la serie sin estacionalidad es ruido, mientras que la estacionalidad domina la serie sin tendencia.
:::

:::ejercicio Reto | [[guia-pron-descomp]]
Una serie trimestral desestacionalizada se ajusta con la recta $\hat{A}_t = 50 + 2t$ ($t = 1, \dots, 20$) y los índices estacionales son $(5,\ -1,\ -6,\ 2)$ para Q1 a Q4. ¿Cuál es el pronóstico para $t = 23$, el tercer trimestre del año siguiente?
- [ ] 96
- [x] 90
- [ ] 102
- [ ] 92
---
:::pasos
= \hat{A}_{23} = 50 + 2(23) = 96
> La recta extrapolada al periodo 23.
= t = 23 \;\Rightarrow\; \text{trimestre } ((23 - 1) \bmod 4) + 1 = 3 \;\Rightarrow\; \hat{S} = -6
> El periodo 23 cae en Q3 (los periodos 3, 7, 11, 15, 19 y 23 son terceros trimestres).
= \hat{y}_{23} = 96 - 6 = 90
> Se devuelve la estacionalidad.
:::
:::

:::ejercicio Intermedio | [[pron-descomp]]
Descompones $\ln y_t$ con STL y pronosticas $\hat{A}_{T+h} = 6.1$ con $\hat{S}_{T+h} = 0.2$. ¿Cuál es el pronóstico en la escala original?
- [ ] 6.3
- [ ] $e^{6.1} + 0.2$
- [x] $e^{6.3} \approx 544.6$
- [ ] $e^{6.1} \cdot 0.2$
---
En logaritmos la descomposición es aditiva: $\ln\hat{y} = 6.1 + 0.2 = 6.3$, así que $\hat{y} = e^{6.3} = 544.6$. En la escala original la estacionalidad actúa como un **factor**: $e^{0.2} = 1.22$, es decir, 22% arriba del nivel.
:::

:::ejercicio Reto | [[pron-descomp]]
En AirPassengers, STL + recta con los 11 años da MAPE de 7.7% en 1960 y STL + recta con los últimos 5 años da 2.5%. ¿Qué conclusión es correcta?
- [ ] Siempre hay que usar los últimos 5 años.
- [ ] La recta con toda la muestra está mal calculada.
- [x] La ventana es una decisión de modelado que debe elegirse con validación, no viendo el error de 1960.
- [ ] El pronóstico por descomposición es peor que el ingenuo estacional.
---
Con 2 años el MAPE es 2.68% y con 3 años 4.64%: no hay una regla monótona. Si eliges la ventana mirando 1960, ese error deja de ser una medida honesta [[iid]]. Las cuatro variantes le ganan al ingenuo estacional (9.99%).
:::
