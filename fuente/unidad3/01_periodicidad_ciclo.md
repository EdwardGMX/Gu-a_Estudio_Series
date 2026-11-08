## 🔁 Periodicidad y ciclo {#periodicidad}
@mapa La primera pregunta de la unidad: ¿el patrón se repite exactamente (periodicidad) o solo aproximadamente (ciclo)? Cómo se ve cada uno en los datos, en la ACF y en el espectro, y por qué no todo ciclo justifica un SARIMA estacional.

### Dos tipos de repetición {#periodo-vs-ciclo}

La guía oficial empieza la unidad con esta distinción, porque decide qué modelo se puede defender:

:::definicion Periodicidad y ciclo
- **Periodicidad**: repetición **exacta** después de un intervalo constante $\Per$. Formalmente, la parte sistemática cumple $x_{t+P} = x_t$ para todo $t$. Ejemplo: el ciclo anual de datos mensuales, con $\Per = 12$ siempre.
- **Ciclo**: patrón recurrente **aproximado**, con duración, amplitud o forma **variables**. Ejemplos: el ciclo económico (expansiones y recesiones de 2 a 8 años), el ciclo solar (unos 11 años, a veces 9, a veces 14), El Niño (de 2 a 7 años).
:::

| | Periodicidad | Ciclo |
|---|---|---|
| Duración | Fija: siempre $\Per$ | Variable alrededor de un valor típico |
| Amplitud y forma | Iguales (o que cambian lentamente) | Cambian de una vuelta a otra |
| Causa típica | Calendario, rotación de la Tierra, turnos | Dinámica interna del sistema (inercia, retroalimentación) |
| Huella en la ACF | Oscila **sin apagarse** | Oscila y **se apaga** |
| Huella en el espectro | Pico **angosto** (casi una línea) en $1/\Per$ y sus múltiplos | Joroba **ancha** alrededor de la frecuencia típica |
| Modelo natural | Diferencia estacional, SARIMA, variables indicadoras o términos de Fourier | AR(2) o AR de orden mayor, componentes cíclicos |

:::intuicion Un reloj y un corazón
Un reloj marca las 12 cada 12 horas, siempre: es periódico. Un corazón late más o menos 70 veces por minuto, pero cada latido dura un poco distinto y se acelera al correr: es un ciclo. Si quisieras predecir el próximo latido con «exactamente 0.857 segundos después del anterior», te equivocarías cada vez más; con el reloj nunca te equivocas.
:::

:::ejemplo Clasificar cinco series
- **Ventas mensuales de juguetes**, con el máximo cada diciembre: **periodicidad** de $\Per = 12$, porque la fija el calendario. Modelo: diferencia estacional o SARIMA, o variables indicadoras de mes.
- **Temperatura cada hora**: **periodicidad** de $\Per = 24$ (la rotación de la Tierra), más otra de $24 \times 365$ horas (el año).
- **Llamadas por hora a un centro de atención**: dos periodicidades a la vez, la diaria ($\Per = 24$) y la semanal ($\Per = 7 \times 24 = 168$).
- **PIB trimestral sin tendencia**: **ciclo** económico de 6 a 32 trimestres. Ninguna regla obliga a que la siguiente recesión llegue a los $s$ trimestres. Modelo: términos AR, o un filtro pasa banda si solo se quiere describir el ciclo [[bk]].
- **Linces atrapados cada año en Canadá** (un ejemplo clásico de Box y Jenkins): **ciclo** de unos 10 años cuya duración y altura cambian de una vuelta a otra. Como las manchas solares, se modela con un AR(2) o de orden mayor.
:::

### El ciclo solar: un ciclo que no es periódico {#ciclo-solar}

Las manchas solares tienen un ciclo famoso «de 11 años». Midamos cuánto dura de verdad cada ciclo, de máximo a máximo:

```python
from scipy.signal import find_peaks

picos, _ = find_peaks(manchas.values, distance=6, prominence=20)     # máximos separados al menos 6 años
anios_max = manchas.index[picos].astype(int)
duraciones = np.diff(anios_max)
print("últimos máximos:", list(anios_max[-10:]))
print("duraciones (años):", duraciones.tolist())
print(f"duración media = {duraciones.mean():.2f} años | mínima = {duraciones.min()} | máxima = {duraciones.max()}")
print(f"manchas en los máximos: de {manchas.values[picos].min():.0f} a {manchas.values[picos].max():.0f}")
```

:::guiado ¿Periodicidad o ciclo? Las duraciones del ciclo solar {#guia-ciclos-solares}
| Ciclo | Año del máximo | Manchas en el máximo | Años hasta el siguiente máximo |
|---|---|---|---|
| 1 | 1883 | 64 | 10 |
| 2 | 1893 | 85 | 12 |
| 3 | 1905 | 64 | 12 |
| 4 | 1917 | 104 | 11 |
| 5 | 1928 | 78 | 9 |
| 6 | 1937 | 114 | 10 |
| 7 | 1947 | 152 | 10 |
| 8 | 1957 | 190 | 11 |
| 9 | 1968 | 106 | 11 |
| 10 | 1979 | 155 | 10 |
---
= 1893 - 1883 = 10, \quad 1905 - 1893 = 12, \quad \dots, \quad 1989 - 1979 = 10
> Cada duración es la resta de dos años de máximo consecutivos (el máximo de 1989 es el siguiente después del último renglón).
@ usa c2[1-10]; da c4[1-10]
= \bar{d} = \frac{10 + 12 + 12 + 11 + 9 + 10 + 10 + 11 + 11 + 10}{10} = \frac{106}{10} = 10.6 \text{ años}
> La duración típica: por eso se dice «unos 11 años».
@ usa c4[1-10]
= \min = 9, \qquad \max = 12
> En solo 100 años la duración ya varía de 9 a 12. En toda la muestra (1705–2000) varía de **7 a 17** años, con media 10.93.
@ usa c4[5] c4[2] c4[3]
= \frac{190}{64} \approx 3
> La altura de los máximos también cambia: el más alto triplica al más bajo.
@ usa c3[1] c3[8]
= \Rightarrow\; \text{ciclo, no periodicidad}
> Duración y amplitud variables: no hay un $\Per$ fijo que se repita. Un modelo con «periodo 11 exacto» se desfasaría pronto.
:::

:::interactivo w3-manchas | Los ciclos de las manchas solares {#w-manchas}
La serie completa con sus máximos marcados. Elige un intervalo de años para ver cómo cambian la duración y la altura de los ciclos.
@@@
- **Arriba**: manchas solares por año; las estrellas son los máximos detectados y las franjas alternadas separan un ciclo de otro.
- **Abajo, izquierda**: la duración de cada ciclo. Si fuera periódico, todas las barras medirían lo mismo.
- **Abajo, derecha**: duración contra altura del máximo; no hay una relación simple.
- **Vista extra**: la tabla de ciclos (año del máximo, altura y duración).
:::

### La huella en la ACF {#ciclo-acf}

La ACF distingue los dos casos. Una oscilación periódica nunca «olvida» su fase: lo que pasó hace 100 periodos dice exactamente dónde estamos hoy.

:::demo La ACF de una oscilación con fase al azar no se apaga {#demo-acf-oscilacion}
:::pasos
= x_t = \tip{A-amp}{A}\cos(2\pi\omega t + \varphi), \qquad \varphi \sim \text{Uniforme}(0, 2\pi)
> Una oscilación cuya fase (el «dónde empieza») es aleatoria. Con la fase al azar el proceso es estacionario: ningún instante es especial.
= \E[x_t] = \frac{\tip{A-amp}{A}}{2\pi}\int_0^{2\pi}\cos(2\pi\omega t + \varphi)\,d\varphi = 0
> El coseno promedia cero sobre una vuelta completa.
= \E[x_{t+k}x_t] = \tip{A-amp}{A}^2\,\E\big[\cos(2\pi\omega(t + k) + \varphi)\cos(2\pi\omega t + \varphi)\big]
> Producto de dos valores separados $k$ periodos.
= = \frac{\tip{A-amp}{A}^2}{2}\,\E\big[\cos(2\pi\omega k) + \cos(2\pi\omega(2t + k) + 2\varphi)\big]
> Identidad $\cos a\cos b = \frac12[\cos(a - b) + \cos(a + b)]$ [[demo-ortogonalidad]].
= \gamma(k) = \frac{\tip{A-amp}{A}^2}{2}\cos(2\pi\omega k), \qquad \rho(k) = \cos(2\pi\omega k)
> El segundo término promedia cero (contiene $2\varphi$). La autocorrelación oscila con el mismo periodo y **nunca decae**: vuelve a valer 1 en $k = \Per, 2\Per, \dots$
:::
:::

En cambio, un **ciclo** como el del AR(2) con raíces complejas tiene una ACF que oscila **y se apaga** como $r^k$ [[u2:ar2-complejas]]: después de varios ciclos, el sistema «olvida» en qué fase estaba, porque cada ciclo dura un poco distinto.

| Proceso | ACF | Qué significa |
|---|---|---|
| Oscilación con fase al azar | $\cos(2\pi\omega k)$: no decae | La fase se conoce para siempre: periodicidad |
| Estacionalidad determinística + ruido | Picos en $\Per, 2\Per, \dots$ que no bajan | Periodicidad con ruido encima |
| AR(2) con raíces complejas | $\approx r^k\cos(\cdot)$: decae | Ciclo: la fase se va olvidando |
| Ruido blanco | 0 para $k \ge 1$ | Sin repetición |

:::guiado La misma oscilación de periodo 10, periódica y cíclica {#guia-acf-periodo-ciclo}
| Rezago $k$ | $\rho(k)$ periódica: $\cos(2\pi k/10)$ | $\rho(k)$ del AR(2) | Envolvente $r^k = 0.9^k$ |
|---|---|---|---|
| 1 | 0.809 | 0.805 | 0.900 |
| 2 | 0.309 | 0.362 | 0.810 |
| 5 | −1 | −0.590 | 0.590 |
| 10 | 1 | 0.349 | 0.349 |
| 15 | −1 | −0.206 | 0.206 |
| 20 | 1 | 0.122 | 0.122 |
| 30 | 1 | 0.042 | 0.042 |
---
= r = 0.9,\ \theta = 2\pi/10 \;\Rightarrow\; \phi_1 = 2r\cos\theta = 1.4562, \qquad \phi_2 = -r^2 = -0.81
> Un AR(2) con raíces inversas $0.9\,e^{\pm 2\pi i/10}$: su pseudo-ciclo dura 10 periodos, igual que la oscilación periódica [[u2:ar2-complejas]].
= \text{periódica}: \rho(5) = \cos\pi = -1, \quad \rho(10) = \rho(20) = \rho(30) = 1
> Medio ciclo después, el valor opuesto; un ciclo completo después, el mismo. Después de 30 rezagos se sigue sabiendo exactamente en qué fase estamos.
@ usa c1[3-7]; da c2[3-7]
= \text{AR(2)}: \rho(5) = -0.590, \quad \rho(10) = 0.349 = 0.9^{10}
> También oscila con periodo 10, pero la altura se reduce con la envolvente $r^k$: un ciclo después queda el 35% de la «memoria» de la fase.
@ usa c1[3-4] c4[3-4]; da c3[3-4]
= \rho(20) = 0.122, \qquad \rho(30) = 0.042
> Tres ciclos después, casi nada: el AR(2) ya no sabe si está en un máximo o en un mínimo. Es la diferencia entre un reloj y un corazón.
@ usa c4[6-7]; da c3[6-7]
= \text{espectro}: \text{línea en } \omega = 0.1 \text{ (periódica)} \quad\text{contra}\quad \text{joroba con pico en } \Per = 10.12 \text{ (AR(2))}
> El mismo contraste en el otro idioma: la ACF que no decae corresponde a una línea angosta, y la que se apaga a una joroba [[espectro-ar2]].
:::

En los datos se ve lo mismo. La ACF de las manchas solares tiene máximos cada 10 u 11 años, cada vez más bajos:

```python
from statsmodels.tsa.stattools import acf

r_m = acf(manchas.values, nlags=60, fft=True)
maximos = [k for k in range(1, 59) if r_m[k] > r_m[k - 1] and r_m[k] > r_m[k + 1]]
print("rezagos de los máximos de la ACF:", maximos)
print("altura de esos máximos:          ", np.round(r_m[maximos], 3).tolist())
print(f"separación media entre máximos = {np.diff(maximos).mean():.2f} años")
```

La separación de unos 10.75 años es el ciclo; la caída de 0.66 a 0.11 en cinco ciclos es la señal de que no es una periodicidad exacta.

:::interactivo w3-ciclo | Periodicidad contra ciclo {#w-ciclo}
Compara cuatro procesos: una oscilación periódica con ruido, un patrón estacional periódico, un ciclo AR(2) y un ciclo de duración aleatoria. Ajusta el periodo y la intensidad del ruido.
@@@
- **Arriba**: la serie simulada, con los máximos marcados.
- **Abajo, izquierda**: la ACF muestral. La periódica sigue oscilando con la misma altura; la del ciclo se apaga.
- **Abajo, derecha**: el espectro (el periodograma de la simulación y, cuando existe, el teórico). La periódica da un pico angosto; el ciclo, una joroba ancha.
- **Vista extra**: el histograma de la distancia entre máximos consecutivos: una sola barra (periodo fijo) contra una campana (duración variable).
:::

### ¿Cuándo se justifica un SARIMA estacional? {#cuando-sarima}

La guía oficial lo advierte: **no todo ciclo justifica un SARIMA estacional**. La diferencia estacional $1 - L^{s}$ y los términos $\Phi(L^s)$, $\Theta(L^s)$ suponen que el patrón se repite **exactamente** cada $s$ periodos [[u2:sarima-def]]. Con un ciclo de duración variable, el rezago $s$ a veces cae en un máximo y a veces en un mínimo, y el modelo se vuelve difícil de defender.

```python cache
from statsmodels.tsa.statespace.sarimax import SARIMAX
warnings.simplefilter("ignore")
candidatos = {"AR(2)": dict(order=(2, 0, 0)),
              "AR(9)": dict(order=(9, 0, 0)),
              "SARIMA(2,0,0)(1,0,0)[11]": dict(order=(2, 0, 0), seasonal_order=(1, 0, 0, 11))}
for nombre, kw in candidatos.items():
    r = SARIMAX(manchas.values, trend="c", **kw).fit(disp=False)
    print(f"{nombre:26s} AIC = {r.aic:7.1f}   parámetros = {len(r.params)}")
```

El AR(9) gana por casi 40 puntos de AIC al modelo que fuerza un «periodo 11»: un AR de orden alto puede reproducir una joroba ancha en el espectro, que es justo lo que tiene un ciclo; el término estacional supone una línea angosta.

:::cuidado Señales de que estás forzando un periodo
- Eliges $s$ porque «se ve como un ciclo», pero la distancia entre máximos varía mucho (en las manchas solares, de 7 a 17 años).
- En el espectro no hay un pico angosto en $1/s$, sino una joroba ancha.
- No hay una razón física o de calendario para ese periodo (los meses del año sí lo son; «11 años» del Sol no es exacto).
- Los coeficientes estacionales salen poco significativos o el pronóstico se desfasa del ciclo real a los pocos periodos.
:::

:::duda ¿Y la estacionalidad que cambia de forma poco a poco?
Es periódica en su **duración** (siempre 12 meses) aunque su forma o amplitud cambien lentamente. Para eso sirven los SARIMA con diferencia estacional (el patrón puede ir cambiando) o un modelo en logaritmos si la amplitud crece con el nivel. Lo que distingue un ciclo es que su **duración** cambia.
:::

:::examen Así te lo pueden preguntar: «Diferencie periodicidad y ciclo»
«Una **periodicidad** es una repetición exacta después de un intervalo constante: el patrón cumple $x_{t+P} = x_t$, como la estacionalidad anual de datos mensuales ($\Per = 12$). Un **ciclo** es un patrón recurrente aproximado cuya duración, amplitud o forma varían, como el ciclo solar (de 7 a 17 años, con media cercana a 11) o el ciclo económico. En la ACF, la periodicidad produce oscilaciones que no se apagan y el ciclo, oscilaciones amortiguadas; en el espectro, la periodicidad da un pico angosto en $1/P$ y sus armónicos, y el ciclo, una joroba ancha. La distinción importa porque un SARIMA estacional supone un periodo fijo; forzarlo sobre un ciclo produce un modelo difícil de defender, y es mejor usar términos AR que generen el ciclo.»
:::

:::resumen Lo que debes llevarte de periodicidad y ciclo
- **Periodicidad**: repetición exacta cada $\Per$. **Ciclo**: repetición aproximada, con duración y amplitud variables.
- La ACF de una oscilación con fase al azar es $\cos(2\pi\omega k)$ y no decae; la de un ciclo AR(2) se apaga.
- En el espectro: línea angosta (periodicidad) contra joroba ancha (ciclo).
- Un SARIMA estacional solo se justifica con un periodo fijo; para ciclos, términos AR.
:::
