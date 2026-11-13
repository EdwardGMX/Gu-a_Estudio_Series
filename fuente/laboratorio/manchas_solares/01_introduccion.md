## 📖 Introducción {#intro}
@mapa Qué son las manchas solares, de dónde vienen los datos y por qué esta serie es un reto clásico.

Las **manchas solares** son regiones oscuras de la superficie del Sol, más frías que su entorno, donde el campo magnético es muy intenso. Desde el siglo XVIII se cuentan con un índice estandarizado, el **número de Wolf** (o número relativo de manchas). Combina el número de grupos y el de manchas individuales, y se promedia por año.

Contar manchas tiene consecuencias muy prácticas. Cuando el Sol está activo hay más tormentas solares, que afectan satélites, GPS, comunicaciones de radio y redes eléctricas. Por eso agencias espaciales y operadores de satélites necesitan **pronosticar la actividad solar** con años de anticipación.

El dataset es `sunspots` de statsmodels: **309 promedios anuales, de 1700 a 2008**. Es una de las series más estudiadas de la historia de la estadística. George Udny Yule inventó el modelo autorregresivo en 1927 precisamente para describirla.

:::intuicion Por qué esta serie es un buen reto
A simple vista parece fácil: sube y baja cada 11 años, como una estacionalidad. Pero el "11" no es exacto: unos ciclos duran 9 años y otros 14. Su altura cambia mucho de un ciclo a otro, y hubo décadas casi sin manchas. Muchas herramientas que funcionan bien con datos mensuales estacionales fallan aquí de formas muy instructivas. Este flujo las prueba una por una.
:::

## 🎯 Objetivo general {#objetivo}
@mapa Qué se quiere lograr, las hipótesis iniciales del analista y cómo se medirá el éxito.

:::definicion Objetivo general
**Describir la estructura de la actividad solar** (cuánto dura el ciclo, cuánto varía, qué tan fuerte es la variación de largo plazo) y **construir un modelo que pronostique el número anual de manchas** al menos un ciclo hacia adelante, con intervalos de predicción coherentes. Se usan las herramientas de las tres unidades.
:::

Como haría un analista real, el trabajo empieza con **suposiciones** que se van a poner a prueba:

| # | Suposición inicial del analista | Dónde se pone a prueba |
|---|---|---|
| S1 | "La varianza crece con el nivel, así que el logaritmo la estabilizará." | Pasos 5 a 9 |
| S2 | "El ciclo de 11 años se comporta como una estacionalidad de periodo 11." | Pasos 10 a 13, 27 y 41 |
| S3 | "Las oscilaciones tan largas indican que la serie no es estacionaria y hay que diferenciarla." | Pasos 15 a 17 y 28 |
| S4 | "Un AR(2), el modelo clásico de Yule, basta para describir el ciclo." | Pasos 23 a 30 |
| S5 | "El MAPE es una buena métrica para comparar pronósticos." | Paso 22 |
| S6 | "El valor típico de λ = 6.25 para datos anuales sirve para el filtro de Hodrick–Prescott." | Pasos 42 a 45 |

**Criterios de éxito:**

1. El modelo final debe **ganarle a la mejor referencia** (promedio, ingenuo, ingenuo estacional, deriva) en validación cruzada con origen móvil, medido con MAE en la escala original.
2. Sus residuos deben ser **ruido blanco** (Ljung–Box sin rechazar).
3. Sus intervalos no deben dar valores **imposibles** (manchas negativas) y deben cubrir lo que prometen.
4. El periodo del ciclo debe estimarse con **dos métodos independientes** (dominio del tiempo y de la frecuencia) que coincidan.

### Mapa del flujo {#mapa-flujo}

Cada ficha es una pastilla, con el color de su resultado. Toca una para ir directo a ese paso.

<div class="pasos-mapa">@@PASOS@@</div>
