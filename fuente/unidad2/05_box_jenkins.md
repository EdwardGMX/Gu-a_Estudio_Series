## 🔎 Identificación: la metodología Box–Jenkins {#box-jenkins}
@mapa El ciclo identificar → estimar → diagnosticar → pronosticar, la tabla de patrones ampliada, cuatro series identificadas paso a paso y el juego de adivinar el modelo.

### El ciclo de Box–Jenkins {#ciclo-bj}

George Box y Gwilym Jenkins propusieron en 1970 una receta para construir modelos ARIMA que se sigue usando tal cual. No es una fórmula: es un **ciclo** que se repite hasta que los residuos ya no tienen nada que contar.

<div class="ruta">
<div class="ruta-paso"><b>0 · Preparar</b><span>Graficar, transformar (log, Box–Cox) y diferenciar hasta tener una serie estacionaria [[transformaciones]].</span></div>
<div class="ruta-paso"><b>1 · Identificar</b><span>Leer ACF y PACF de la serie estacionaria y proponer candidatos ($p$, $q$, $P$, $Q$).</span></div>
<div class="ruta-paso"><b>2 · Estimar</b><span>Ajustar cada candidato por máxima verosimilitud y compararlos con AIC/BIC [[aic-bic]].</span></div>
<div class="ruta-paso"><b>3 · Diagnosticar</b><span>¿Residuos de ruido blanco? Si no, volver al paso 1 con lo que dicen los residuos [[diagnostico]].</span></div>
</div>

Cuando el diagnóstico sale bien, el modelo se usa para **pronosticar** y se evalúa con datos que no vio [[validacion]]. Fíjate que el paso 3 regresa al 1: los residuos mal comportados te dicen **qué le falta** al modelo (por ejemplo, un pico en el rezago 12 de la ACF de los residuos pide un término estacional).

### La tabla de patrones, ampliada {#patrones2}

En la Unidad I viste la tabla básica [[u1:patrones]]. Esta versión agrega los casos que aparecen al modelar.

| Lo que ves | ACF | PACF | Qué proponer |
|---|---|---|---|
| Ruido blanco | todo dentro de la banda | todo dentro de la banda | nada: ARMA(0,0) |
| AR($p$) | decae (exponencial o como onda) | **se corta** después de $p$ | AR($p$) |
| MA($q$) | **se corta** después de $q$ | decae | MA($q$) |
| ARMA($p$, $q$) | decae después de $q$ | decae después de $p$ | empezar con ARMA(1,1) |
| Raíz unitaria | decae **muy lento**, casi en línea recta | un pico cercano a 1 en el rezago 1 | diferenciar ($d = 1$) [[u1:patrones]] |
| Sobrediferenciación | $\rho(1) \approx -0.5$ | negativa y decayendo | quitar una diferencia [[sobrediferenciar]] |
| Estacionalidad AR | picos en $s, 2s, 3s, \dots$ que decaen | un pico en $s$ | $P = 1$ [[ar-estacional]] |
| Estacionalidad MA | un pico en $s$ | picos en $s, 2s, \dots$ que decaen | $Q = 1$ |

:::intuicion Otra forma de verlo: la ACF y la PACF son «huellas digitales»
La ACF mide toda la dependencia entre $y_t$ y $y_{t-k}$, directa o indirecta. La PACF mide solo la **directa**. En un AR($p$) la dependencia directa termina en $p$ (la PACF se corta) pero la indirecta se propaga para siempre (la ACF decae). En un MA($q$) pasa lo contrario: los valores comparten choques solo hasta $q$ (la ACF se corta), pero para imitarlo con rezagos de $y$ se necesitan infinitos (la PACF decae). Si las dos decaen, hay de las dos cosas: ARMA.
:::

### Cuatro series identificadas paso a paso {#casos-identificacion}

Simulamos cuatro series de 300 datos con modelos que **conocemos** (en la vida real no los conoceríamos) y las identificamos solo mirando la ACF y la PACF, como en el examen. La tabla de cada caso marca con ★ los valores que salen de la banda $\pm 1.96/\sqrt{300} = \pm 0.113$.

```python
from statsmodels.tsa.stattools import acf, pacf

rng = np.random.default_rng(2026)
series = {
    "A": ArmaProcess([1, -0.5, -0.3], [1]).generate_sample(300, distrvs=rng.standard_normal, burnin=200),
    "B": ArmaProcess([1], [1, 0.7]).generate_sample(300, distrvs=rng.standard_normal, burnin=200),
    "C": ArmaProcess([1, -0.8], [1, -0.4]).generate_sample(300, distrvs=rng.standard_normal, burnin=200),
    "D": 50 + np.cumsum(rng.standard_normal(300)),
}
banda = 1.96 / np.sqrt(300)
for nombre, x in series.items():
    r, pr = acf(x, nlags=6)[1:], pacf(x, nlags=6)[1:]
    marca = lambda v: f"{v:6.3f}{'★' if abs(v) > banda else ' '}"
    print(f"Serie {nombre}  ACF :", " ".join(marca(v) for v in r))
    print(f"          PACF:", " ".join(marca(v) for v in pr))
```

```python oculto
exportar("casos_identificacion", {k: [round(float(v), 4) for v in x] for k, x in series.items()})
```

:::ejemplo Serie A: la PACF se corta
:::pasos
= \text{ACF: } 0.78,\ 0.66,\ 0.54,\ \dots \text{ todas con ★ y bajando poco a poco}
> La ACF **decae** gradualmente: hay memoria autorregresiva.
= \text{PACF: } 0.78,\ 0.14 \text{ con ★ y luego todo dentro de la banda}
> La PACF **se corta** después del rezago 2.
= \Rightarrow \text{AR(2)}
> Corte en la PACF en $p = 2$. Y efectivamente la generamos con $\phi = (0.5, 0.3)$. El segundo valor de la PACF, 0.14, es una estimación de $\phi_2 = 0.3$ [[demo-pacf-ar2]]: con 300 datos todavía tiene bastante ruido.
:::
:::

:::ejemplo Serie B: la ACF se corta
:::pasos
= \text{ACF: } 0.49 \text{ con ★ y después todo dentro de la banda}
> Un solo pico y luego nada: la ACF **se corta** en 1.
= \text{PACF: } 0.49,\ -0.31,\ 0.15, \dots \text{ alternando y bajando}
> La PACF decae alternando signo: la firma del MA con $\theta > 0$ [[ma-acf]].
= \hat\rho(1) = \frac{\theta}{1 + \theta^2} = 0.49 \;\Rightarrow\; \theta \approx 0.81
> Incluso se puede despejar una primera estimación de $\theta$: la solución invertible de $0.49\,\theta^2 - \theta + 0.49 = 0$.
= \Rightarrow \text{MA(1)}
> Generada con $\theta = 0.7$. La estimación por momentos es ruidosa; la de máxima verosimilitud será mejor [[mv]].
:::
:::

:::ejemplo Serie C: la más difícil
:::pasos
= \text{ACF: } 0.51,\ 0.37,\ 0.30,\ 0.22,\ \dots \text{ decae}
> Decae, pero el primer valor no encaja con el ritmo de decaimiento (0.37/0.51 ≈ 0.73, no 0.51 como en un AR(1)): huele a ARMA [[guia-acf-arma]].
= \text{PACF: } 0.51,\ 0.15 \text{ con ★ y luego dentro}
> A simple vista parece un corte en 2: ¡podría confundirse con un AR(2)!
= \Rightarrow \text{candidatos: AR(2) y ARMA(1,1)}
> Cuando la lectura es ambigua no se adivina: se proponen **varios candidatos** y se comparan con AIC/BIC y con los residuos. Abajo lo hacemos; gana el ARMA(1,1), que es el modelo con que se generó ($\phi = 0.8$, $\theta = -0.4$).
:::
:::

:::ejemplo Serie D: no es estacionaria
:::pasos
= \text{ACF de } y_t:\ 0.95,\ 0.90,\ 0.86,\ \dots
> Decae **muy** lento, casi en línea recta: la huella de la raíz unitaria [[u1:patrones]]. No se identifica $p$ ni $q$ en esta serie.
= \Delta y_t = y_t - y_{t-1} \;\Rightarrow\; \text{ACF y PACF dentro de la banda}
> Después de diferenciar, todo es ruido blanco.
= \Rightarrow \text{ARIMA(0,1,0): paseo aleatorio}
> La serie es la suma acumulada de choques [[u1:paseo]].
:::
:::

:::interactivo w2-identificar | Las cuatro series, con sus gráficas {#w-identificar}
Son **los mismos datos** que generó el código de arriba. Elige una serie y lee su ACF y PACF antes de revelar la respuesta.
@@@
- **Arriba**: la serie (en D puedes verla también diferenciada).
- **ACF y PACF**: barras naranjas = fuera de la banda. Busca dónde se **corta** cada una (o si decae).
- **Revelar**: muestra el modelo verdadero y la lectura que lleva a él.
- **Vista extra**: la tabla de AIC de los nueve ARMA($p$, $q$) con $p, q \le 2$ para esa serie, calculados en tu navegador por mínimos cuadrados condicionales. El menor está resaltado.
:::

### De la lectura a la decisión: probar candidatos {#candidatos}

La ACF y la PACF dan **pistas**, no veredictos. La práctica estándar es ajustar varios candidatos razonables y comparar.

```python
import itertools
warnings.filterwarnings("ignore")            # algunos candidatos malos no convergen: es esperado

tabla = []
for p, q in itertools.product(range(3), range(3)):
    ajuste = SARIMAX(series["C"], order=(p, 0, q), trend="c").fit(disp=False)
    tabla.append({"modelo": f"ARMA({p},{q})", "AIC": round(ajuste.aic, 2), "BIC": round(ajuste.bic, 2),
                  "LB p (10)": round(acorr_ljungbox(ajuste.resid, lags=[10], model_df=p + q)["lb_pvalue"].iloc[0], 3)})
print(pd.DataFrame(tabla).sort_values("AIC").to_string(index=False))
```

:::guiado Leer la tabla de candidatos de la serie C {#guia-candidatos}
| Modelo | AIC | BIC | p de Ljung–Box |
|---|---|---|---|
| ARMA(1,1) | 868.22 | 883.03 | 0.499 |
| ARMA(2,2) | 869.57 | 891.80 | 0.447 |
| ARMA(2,0) = AR(2) | 870.32 | 885.13 | 0.373 |
| ARMA(1,0) = AR(1) | 875.53 | 886.64 | 0.087 |
| ARMA(0,1) = MA(1) | 904.82 | 915.94 | 0.000 |
---
= \text{ARMA(1,1): menor AIC (868.22) y menor BIC (883.03)}
> Gana con solo dos parámetros ARMA. Coincide con el modelo verdadero.
@ usa c2[1] c3[1]
= \text{ARMA(2,2): AIC 1.35 mayor, pero BIC 8.8 mayor}
> Con cuatro parámetros ARMA ajusta casi igual. El BIC castiga más cada parámetro ($\ln 300 = 5.7$ contra 2 del AIC) y lo descarta con claridad: **parsimonia** [[cancelacion]].
@ usa c2[2] c3[2]
= \text{AR(2): AIC 2.1 mayor}
> Era nuestro otro candidato. Pierde por poco: con datos reales ambos podrían ser aceptables, y sus residuos también pasan Ljung–Box.
@ usa c2[3] c3[3] c4[3]
= \text{AR(1): AIC 7.3 mayor y p de Ljung–Box} = 0.087
> Le falta memoria: el p-value está cerca del límite.
@ usa c2[4] c4[4]
= \text{MA(1): AIC 36.6 mayor y p de Ljung–Box} = 0.000
> Rechazo claro: los residuos conservan autocorrelación. Un MA(1) no puede producir una ACF que decae.
@ usa c2[5] c4[5]
:::

:::duda ¿No existe algo que elija el modelo automáticamente?
Sí: la función `auto_arima` del paquete `pmdarima` (fuera de statsmodels) recorre candidatos por pasos y elige por AIC. Es útil para tener un punto de partida, pero **no** sustituye el diagnóstico: puede elegir modelos con raíces casi canceladas o con residuos que no son ruido blanco, y no sabe si un pico estacional tiene sentido para tu problema. En el ETS se espera que justifiques la elección con ACF/PACF, AIC/BIC y residuos.
:::

:::cuidado Errores típicos al identificar
- **Identificar sobre la serie original** cuando no es estacionaria: la ACF de una serie con tendencia siempre «decae lento» y oculta todo lo demás. Primero transforma y diferencia.
- **Pocos rezagos**: con datos mensuales mira al menos 36 (tres años) para ver los picos estacionales en 12, 24 y 36.
- **Sobreinterpretar una barra suelta**: con 5% de falsas alarmas, una barra aislada en el rezago 17 casi nunca significa nada [[u1:falsas-alarmas]].
- **Muestras chicas**: con $n = 50$ la banda es $\pm 0.28$; patrones reales pueden quedar dentro.
:::

:::interactivo w2-adivina | Juego: ¿qué modelo generó esta serie? {#w-adivina}
Cada ronda simula una serie con un modelo al azar. Mira la ACF y la PACF y elige. Tu marcador se lleva en la esquina.
@@@
- La **serie**, la **ACF** y la **PACF** se muestran sin decirte el modelo.
- Elige entre ruido blanco, AR(1), AR(2), MA(1), MA(2), ARMA(1,1) y paseo aleatorio.
- Al responder verás el modelo verdadero, sus parámetros y la explicación de qué patrón lo delataba. Algunas rondas son difíciles a propósito: con $n$ chico hasta un experto se equivoca.
- Sube $n$ para practicar con patrones claros y bájalo para ver cuánto ruido mete la muestra.
:::

:::resumen Lo que debes llevarte de la identificación
- Box–Jenkins es un **ciclo**: preparar → identificar → estimar → diagnosticar (y volver si hace falta) → pronosticar.
- Se identifica sobre la serie **estacionaria**: la PACF que se corta sugiere AR($p$); la ACF que se corta, MA($q$); si las dos decaen, ARMA.
- Una lectura ambigua no se resuelve adivinando: se comparan varios candidatos con AIC/BIC y Ljung–Box de los residuos.
:::
