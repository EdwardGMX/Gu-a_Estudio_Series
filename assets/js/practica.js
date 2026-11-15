/* =====================================================================
   practica.js — Página de práctica: generador de salidas para interpretar
   (ACF/PACF, ADF + KPSS, Ljung–Box, summary de SARIMAX y periodograma),
   simulacro de examen y repaso de los ejercicios fallados.
   Usa TS, TS2 y TS3 para los cálculos y GUIA_UI para los ejercicios.
   ===================================================================== */
(function () {
  'use strict';
  const U = window.GUIA_UTIL, UI = window.GUIA_UI, TS = window.TS, T2 = window.TS2, T3 = window.TS3;
  if (!U || !UI) return;
  const { el, graf, trazasACF, layoutACF, PAL } = U;
  const { $, $$, leer, guardar, esc } = UI;
  const B = window.GUIA_BUSCADOR || { paginas: {} };
  const pagina = u => B.paginas[u] || { a: '', c: u, n: u };
  const f2 = (v, d = 2) => Number(v).toFixed(d);
  const semillaNueva = () => (Math.floor(Math.random() * 2147483000) + 1) >>> 0;
  const entre = (r, a, b, d = 2) => Number((a + (b - a) * r.unif()).toFixed(d));
  const elige = (r, lista) => lista[Math.floor(r.unif() * lista.length)];
  const signo = r => (r.unif() < 0.5 ? -1 : 1);
  const maxAbs = (v, a, b) => Math.max(...v.slice(a, b + 1).map(Math.abs));
  const barajar = (r, lista) => { const x = lista.slice(); for (let i = x.length - 1; i > 0; i--) { const j = Math.floor(r.unif() * (i + 1)); [x[i], x[j]] = [x[j], x[i]]; } return x; };
  const lista = v => v.map(x => f2(x)).join(', ');

  /* ============================ Generadores ============================ */
  // Cada generador devuelve { titulo, unidad, enlace, pintar(div), pregunta, opciones, correcta, explicacion }.
  // La respuesta correcta se decide con los números calculados, no con el nombre del proceso simulado.

  // ---- ACF y PACF → ¿qué modelo propones? (Unidad II)
  function genAcfPacf(semilla) {
    const n = 400, b = 1.96 / Math.sqrt(n), K = 20;
    let mejor = null;
    for (let intento = 0; intento < 60; intento++) {
      const r = TS.rng(semilla + intento * 7919);
      const tipo = elige(r, ['ar1', 'ar1', 'ar2', 'ar2', 'ma1', 'ma1', 'ma2', 'ma2', 'arma11', 'rb', 'rw']);
      let phi = [], theta = [], x;
      if (tipo === 'ar1') phi = [signo(r) * entre(r, 0.55, 0.85)];
      if (tipo === 'ar2') phi = elige(r, [[0.5, 0.3], [1.1, -0.5], [0.3, 0.45], [-0.4, 0.35], [0.9, -0.4]]);
      if (tipo === 'ma1') theta = [signo(r) * entre(r, 0.55, 0.85)];
      if (tipo === 'ma2') theta = elige(r, [[0.6, 0.4], [-0.5, 0.4], [0.7, -0.35], [0.4, 0.5]]);
      if (tipo === 'arma11') { phi = [entre(r, 0.6, 0.8)]; theta = [entre(r, 0.4, 0.6)]; }
      const s2 = Math.floor(r.unif() * 1e9) + 1;
      if (tipo === 'rw') x = TS.cumsum(TS.rng(s2).normales(n, 1));
      else x = T2.simularARMA(T2.polAR(phi), T2.polMA(theta), n, { semilla: s2 }).y;
      const acf = TS.acf(x, K), pacf = TS.pacf(x, K);
      let ok = false;
      if (tipo === 'ar1' || tipo === 'ar2') { const p = phi.length; ok = Math.abs(pacf[p]) > 2 * b && maxAbs(pacf, p + 1, p + 5) < 1.5 * b && Math.abs(acf[p + 1]) > 1.2 * b; }
      if (tipo === 'ma1' || tipo === 'ma2') { const q = theta.length; ok = Math.abs(acf[q]) > 2 * b && maxAbs(acf, q + 1, q + 5) < 1.5 * b && Math.abs(pacf[q + 1]) > 1.2 * b; }
      if (tipo === 'arma11') ok = Math.abs(acf[2]) > 2 * b && Math.abs(acf[3]) > 1.5 * b && Math.abs(pacf[2]) > 2 * b && Math.abs(pacf[3]) > 1.2 * b;
      if (tipo === 'rb') ok = maxAbs(acf, 1, K) < 1.45 * b && maxAbs(pacf, 1, K) < 1.45 * b;
      if (tipo === 'rw') ok = acf[1] > 0.9 && acf[10] > 0.6;
      mejor = { tipo, phi, theta, acf, pacf };
      if (ok) break;
    }
    const { tipo, phi, theta, acf, pacf } = mejor;
    const OP = ['AR(1)', 'AR(2)', 'MA(1)', 'MA(2)', 'ARMA(1,1)', 'Ruido blanco: no hay dependencia que modelar', 'Serie no estacionaria: hay que diferenciar antes de identificar'];
    const correcta = { ar1: 0, ar2: 1, ma1: 2, ma2: 3, arma11: 4, rb: 5, rw: 6 }[tipo];
    const EXPL = {
      ar1: `La <b>PACF se corta después del rezago 1</b> (${f2(pacf[1])} y luego valores dentro de la banda) y la <b>ACF decae gradualmente</b> (${lista(acf.slice(1, 5))}…): es la huella de un AR(1). La serie se simuló con φ = ${f2(phi[0])}.`,
      ar2: `La <b>PACF tiene dos picos significativos</b>, en los rezagos 1 y 2 (${f2(pacf[1])} y ${f2(pacf[2])}), y después se corta; la ACF decae sin cortarse. Es un AR(2). La serie se simuló con φ₁ = ${f2(phi[0])} y φ₂ = ${f2(phi[1])}.`,
      ma1: `La <b>ACF se corta después del rezago 1</b> (${f2(acf[1])} y luego dentro de la banda) y la <b>PACF decae</b> alternando o amortiguándose (${lista(pacf.slice(1, 5))}…): es un MA(1). La serie se simuló con θ = ${f2(theta[0])}.`,
      ma2: `La <b>ACF tiene picos significativos solo en los rezagos 1 y 2</b> (${f2(acf[1])} y ${f2(acf[2])}) y después se corta; la PACF decae sin cortarse. Es un MA(2). La serie se simuló con θ₁ = ${f2(theta[0])} y θ₂ = ${f2(theta[1])}.`,
      arma11: `<b>Ninguna de las dos se corta</b>: la ACF decae gradualmente (${lista(acf.slice(1, 5))}…) y la PACF también (${lista(pacf.slice(1, 4))}…). Cuando ambas decaen, el candidato es un ARMA; el más simple es ARMA(1,1). La serie se simuló con φ = ${f2(phi[0])} y θ = ${f2(theta[0])}.`,
      rb: `<b>Ningún rezago sale con claridad de la banda</b> ni en la ACF ni en la PACF: no hay autocorrelación que modelar. Es el aspecto que deben tener los residuos de un buen modelo.`,
      rw: `La ACF empieza cerca de 1 (${f2(acf[1])}) y <b>cae muy lentamente</b>, casi en línea recta (en el rezago 10 todavía vale ${f2(acf[10])}). Esa no es la huella de un AR estacionario sino de una raíz unitaria: primero se diferencia, se confirma con ADF y KPSS, y se vuelven a leer ACF y PACF. La serie se simuló como un paseo aleatorio.`
    };
    return {
      titulo: 'ACF y PACF', unidad: 'u2', enlace: { u: 'u2', id: 'patrones2', t: 'La tabla de patrones' },
      pintar(div) {
        const a = el('div', { class: 'w-graf', style: 'min-height:240px' }), p = el('div', { class: 'w-graf', style: 'min-height:240px' });
        div.append(a, p);
        graf(a, trazasACF(acf, n, { hasta: K }), layoutACF(`ACF muestral (n = ${n})`, { height: 240 }));
        graf(p, trazasACF(pacf, n, { hasta: K, color: PAL.cel, nombre: 'PACF muestral' }), layoutACF('PACF muestral', { height: 240 }));
        div.append(el('div', { class: 'is-nota' }, 'La banda sombreada es ±1.96/√n. Un pico aislado apenas fuera de la banda puede ser azar.'));
      },
      pregunta: 'La serie ya es estacionaria en apariencia. Con esta ACF y esta PACF, ¿qué propones?',
      opciones: OP, correcta, explicacion: EXPL[tipo]
    };
  }

  // ---- ADF + KPSS → lectura conjunta (Unidad I)
  function genAdfKpss(semilla) {
    const n = 200;
    let res = null;
    for (let intento = 0; intento < 40; intento++) {
      const r = TS.rng(semilla + intento * 104729);
      const tipo = elige(r, ['ar', 'ar', 'rw', 'rwd', 'salto', 'tend']);
      const e = TS.rng(Math.floor(r.unif() * 1e9) + 1).normales(n, 1);
      let x, como;
      if (tipo === 'ar') { const phi = entre(r, 0.2, 0.6); x = []; let v = 0; for (let t = 0; t < n; t++) { v = phi * v + e[t]; x.push(10 + v); } como = `un AR(1) estacionario con φ = ${f2(phi)}`; }
      if (tipo === 'rw') { x = TS.cumsum(e).map(v => 20 + v); como = 'un paseo aleatorio (raíz unitaria)'; }
      if (tipo === 'rwd') { const d = entre(r, 0.1, 0.25); x = TS.cumsum(e.map(v => v + d)).map(v => 20 + v); como = `un paseo aleatorio con deriva ${f2(d)}`; }
      if (tipo === 'salto') { const s = entre(r, 2.5, 4, 1); x = e.map((v, t) => 10 + v + (t >= n / 2 ? s : 0)); como = `ruido blanco con un salto de nivel de ${s} a la mitad: cada tramo es estacionario, pero el salto engaña a las pruebas. Conviene analizar por tramos`; }
      if (tipo === 'tend') { const m = entre(r, 0.02, 0.04, 3); x = e.map((v, t) => 10 + m * t + v); como = `una tendencia lineal determinística más ruido: con la especificación «solo constante» las pruebas la confunden con raíz unitaria; con constante y tendencia la lectura cambia`; }
      const a = TS.adf(x), k = TS.kpss(x);
      res = { x, a, k, como };
      const dudoso = p => p > 0.025 && p < 0.09;
      if (!dudoso(a.p) && !dudoso(k.p)) break;
    }
    const { x, a, k, como } = res, ra = a.p < 0.05, rk = k.p < 0.05;
    const pk = k.fueraDeTabla === 'mayor' ? '> 0.10' : k.fueraDeTabla === 'menor' ? '< 0.01' : f2(k.p, 3);
    const correcta = ra && !rk ? 0 : !ra && rk ? 1 : ra && rk ? 2 : 3;
    const sigue = [
      'Hay evidencia de estacionariedad: se puede pasar a leer ACF y PACF para proponer un ARMA.',
      'Hay evidencia de no estacionariedad: se transforma o se diferencia, y se repiten las pruebas.',
      'Las dos pruebas se contradicen: revisa la gráfica (¿ruptura o cambio de régimen?) y la especificación de la prueba.',
      'Ninguna prueba es concluyente: revisa la gráfica, el tamaño de muestra y la especificación.'][correcta];
    return {
      titulo: 'ADF y KPSS', unidad: 'u1', enlace: { u: 'u1', id: 'conjunta', t: 'Lectura conjunta ADF + KPSS' },
      pintar(div) {
        const g = el('div', { class: 'w-graf', style: 'min-height:210px' });
        div.append(g);
        graf(g, [{ x: x.map((_, i) => i + 1), y: x, mode: 'lines', line: { color: PAL.lav, width: 1.6 }, hovertemplate: 't = %{x}<br>y = %{y:.2f}<extra></extra>' }],
          { height: 210, showlegend: false, title: { text: `La serie (n = ${n})` }, margin: { t: 34, b: 30 } });
        const t = el('div', { class: 'tabla' });
        t.innerHTML = `<table class="is-tabla"><thead><tr><th>Prueba (regression='c')</th><th>Hipótesis nula</th><th>Estadístico</th><th>p-value</th></tr></thead><tbody>` +
          `<tr><td><code>adfuller</code></td><td>Tiene raíz unitaria</td><td class="num">${f2(a.stat, 3)}</td><td class="num">${a.p < 0.0001 ? '< 0.0001' : f2(a.p, 4)}</td></tr>` +
          `<tr><td><code>kpss</code></td><td>Es estacionaria</td><td class="num">${f2(k.stat, 3)}</td><td class="num">${pk}</td></tr></tbody></table>`;
        div.append(t);
      },
      pregunta: 'Con α = 0.05, ¿cuál es la lectura conjunta?',
      opciones: ['ADF rechaza y KPSS no rechaza: evidencia de estacionariedad', 'ADF no rechaza y KPSS rechaza: evidencia de no estacionariedad',
        'Ambas rechazan: estructura más compleja, posible ruptura o mala especificación', 'Ninguna rechaza: evidencia insuficiente'],
      correcta,
      explicacion: `ADF: p = ${a.p < 0.0001 ? '< 0.0001' : f2(a.p, 4)}, así que <b>${ra ? 'se rechaza' : 'no se rechaza'}</b> la raíz unitaria. KPSS: p ${/[<>]/.test(pk) ? pk : '= ' + pk}, así que <b>${rk ? 'se rechaza' : 'no se rechaza'}</b> la estacionariedad. ${sigue}<br><span class="is-nota">La serie se simuló como ${como}.</span>`
    };
  }

  // ---- Ljung–Box sobre residuos (Unidad II)
  function genLjungBox(semilla) {
    const n = 144, lags = [6, 12, 24];
    let res = null;
    for (let intento = 0; intento < 40; intento++) {
      const r = TS.rng(semilla + intento * 15485863);
      const tipo = elige(r, ['rb', 'rb', 'ar', 'est']);
      const e = TS.rng(Math.floor(r.unif() * 1e9) + 1).normales(n + 60, 1);
      let x = e.slice(), como = 'ruido blanco';
      if (tipo === 'ar') { const phi = entre(r, 0.3, 0.45); for (let t = 1; t < x.length; t++) x[t] = phi * x[t - 1] + e[t]; como = `un AR(1) con φ = ${f2(phi)}: al modelo le faltó un término de corto plazo`; }
      if (tipo === 'est') { const phi = entre(r, 0.4, 0.55); for (let t = 12; t < x.length; t++) x[t] = phi * x[t - 12] + e[t]; como = `residuos con dependencia en el rezago 12 (${f2(phi)}): al modelo le faltó estructura estacional`; }
      x = x.slice(60);
      const tabla = TS.ljungBoxTabla(x, lags);
      res = { tabla, como };
      if (tabla.every(f => f.lb_pvalue < 0.02 || f.lb_pvalue > 0.1)) break;
    }
    const { tabla, como } = res, rech = tabla.filter(f => f.lb_pvalue < 0.05).map(f => f.lag);
    return {
      titulo: 'Ljung–Box en residuos', unidad: 'u2', enlace: { u: 'u2', id: 'lb-residuos', t: 'Ljung–Box sobre residuos' },
      pintar(div) {
        const t = el('div', { class: 'tabla' });
        t.innerHTML = `<table class="is-tabla"><thead><tr><th>Rezago h</th><th>lb_stat</th><th>lb_pvalue</th></tr></thead><tbody>` +
          tabla.map(f => `<tr><td class="num">${f.lag}</td><td class="num">${f2(f.lb_stat, 3)}</td><td class="num">${f.lb_pvalue < 0.0001 ? '< 0.0001' : f2(f.lb_pvalue, 4)}</td></tr>`).join('') + '</tbody></table>';
        div.append(el('div', { class: 'is-nota' }, `Salida de acorr_ljungbox(residuos, lags=[6, 12, 24]) para los residuos de un modelo ajustado a ${n} datos mensuales.`), t);
      },
      pregunta: 'Con α = 0.05, ¿qué concluyes sobre el modelo?',
      opciones: ['Los residuos son compatibles con ruido blanco: el modelo capturó la dependencia temporal', 'Queda autocorrelación en los residuos: el modelo no capturó toda la estructura',
        'Los residuos siguen una distribución normal', 'Hay heterocedasticidad condicional (efectos ARCH)'],
      correcta: rech.length ? 1 : 0,
      explicacion: (rech.length
        ? `El p-value es menor que 0.05 en ${rech.length === 1 ? 'el rezago' : 'los rezagos'} ${rech.join(', ')}: se rechaza que las autocorrelaciones sean todas cero. <b>Quedó información temporal sin modelar</b> y hay que revisar los órdenes${rech.includes(12) && !rech.includes(6) ? ' (aparece al incluir el rezago 12: revisa la parte estacional)' : ''}.`
        : 'Todos los p-values son mayores que 0.05: no se rechaza que las autocorrelaciones sean cero. Los residuos <b>son compatibles con ruido blanco</b>.') +
        ` Ljung–Box no dice nada sobre normalidad (eso es Jarque–Bera) ni sobre la varianza (ARCH-LM).<br><span class="is-nota">Los residuos se simularon como ${como}.</span>`
    };
  }

  // ---- summary() de SARIMAX (Unidad II)
  function genSummary(semilla) {
    const r = TS.rng(semilla), n = 144, nef = 131, k = 4;
    const caso = elige(r, ['coef', 'autocorr', 'normal', 'het', 'bien']);
    const pz = z => 2 * (1 - TS.normcdf(Math.abs(z)));
    const coefs = [
      ['ar.L1', caso === 'coef' ? signo(r) * entre(r, 0.02, 0.09, 4) : entre(r, 0.3, 0.6, 4), entre(r, 0.085, 0.12, 3)],
      ['ma.L1', -entre(r, 0.45, 0.8, 4), entre(r, 0.07, 0.1, 3)],
      ['ma.S.L12', -entre(r, 0.45, 0.7, 4), entre(r, 0.07, 0.1, 3)]
    ];
    const s2 = entre(r, 0.0012, 0.002, 4), ll = entre(r, 228, 250, 3);
    const Q = caso === 'autocorr' ? entre(r, 6.5, 12) : entre(r, 0.01, 1.1), pQ = TS.chi2sf(Q, 1);
    const skew = caso === 'normal' ? signo(r) * entre(r, 0.9, 1.4) : signo(r) * entre(r, 0.02, 0.22);
    const kurt = caso === 'normal' ? entre(r, 5, 7) : entre(r, 2.75, 3.35);
    const JB = nef / 6 * (skew * skew + 0.25 * (kurt - 3) ** 2), pJB = TS.chi2sf(JB, 2);
    const H = caso === 'het' ? entre(r, 2.7, 3.6) : entre(r, 0.8, 1.3), gl = Math.floor(nef / 3), sf = T2.fsf(H, gl, gl), pH = 2 * Math.min(sf, 1 - sf);
    const aic = -2 * ll + 2 * k, bic = -2 * ll + k * Math.log(nef), hqic = -2 * ll + 2 * k * Math.log(Math.log(nef));
    const D = (v, w, d) => f2(v, d).padStart(w), A = 86;
    const fila = (a, b, c, d) => (a.padEnd(18) + String(b).padStart(31)).padEnd(52) + c.padEnd(18) + String(d).padStart(16);
    const L = [];
    L.push(' '.repeat(34) + 'SARIMAX Results', '='.repeat(A));
    L.push(fila('Dep. Variable:', 'log_y', 'No. Observations:', n));
    L.push(fila('Model:', 'SARIMAX(1, 1, 1)x(0, 1, 1, 12)', 'Log Likelihood', f2(ll, 3)));
    L.push(fila('Sample:', '01-01-1949', 'AIC', f2(aic, 3)));
    L.push(fila('', '- 12-01-1960', 'BIC', f2(bic, 3)));
    L.push(fila('Covariance Type:', 'opg', 'HQIC', f2(hqic, 3)));
    L.push('='.repeat(A));
    L.push('                 coef    std err          z      P>|z|      [0.025      0.975]', '-'.repeat(A));
    coefs.forEach(([nom, c, se]) => { const z = c / se; L.push(nom.padEnd(10) + D(c, 11, 4) + D(se, 11, 3) + D(z, 11, 3) + D(pz(z), 11, 3) + D(c - 1.96 * se, 12, 3) + D(c + 1.96 * se, 12, 3)); });
    { const se = s2 / entre(r, 7, 9); L.push('sigma2'.padEnd(10) + D(s2, 11, 4) + D(se, 11, 4) + D(s2 / se, 11, 3) + D(0, 11, 3) + D(s2 - 1.96 * se, 12, 3) + D(s2 + 1.96 * se, 12, 3)); }
    L.push('='.repeat(A));
    const fila2 = (a, b, c, d) => (a.padEnd(28) + String(b).padStart(14)).padEnd(46) + c.padEnd(24) + String(d).padStart(16);
    L.push(fila2('Ljung-Box (L1) (Q):', f2(Q), 'Jarque-Bera (JB):', f2(JB)));
    L.push(fila2('Prob(Q):', f2(pQ), 'Prob(JB):', f2(pJB)));
    L.push(fila2('Heteroskedasticity (H):', f2(H), 'Skew:', f2(skew)));
    L.push(fila2('Prob(H) (two-sided):', f2(pH), 'Kurtosis:', f2(kurt)));
    L.push('='.repeat(A));
    const z1 = coefs[0][1] / coefs[0][2];
    const EXPL = {
      coef: `El coeficiente <code>ar.L1</code> vale ${f2(coefs[0][1], 4)} con error estándar ${f2(coefs[0][2], 3)}: z = ${f2(z1, 2)} y <b>P&gt;|z| = ${f2(pz(z1), 3)}</b>, mayor que 0.05; su intervalo incluye el cero. No se distingue de cero, así que conviene ajustar el modelo sin ese término y comparar AIC, BIC y residuos. Las pruebas de abajo no muestran problemas.`,
      autocorr: `<b>Prob(Q) = ${f2(pQ)}</b>, menor que 0.05: la prueba de Ljung–Box rechaza que los residuos no estén autocorrelacionados. Quedó dependencia temporal sin modelar; hay que cambiar los órdenes. Los coeficientes son significativos y las otras pruebas no fallan.`,
      normal: `<b>Prob(JB) = ${f2(pJB)}</b>, con asimetría ${f2(skew)} y curtosis ${f2(kurt)} (lo normal es 0 y 3): Jarque–Bera rechaza la normalidad. El pronóstico puntual sigue siendo válido, pero los intervalos basados en la normal son dudosos; revisa atípicos. No hay autocorrelación (Prob(Q) = ${f2(pQ)}) ni heterocedasticidad (Prob(H) = ${f2(pH)}).`,
      het: `<b>Prob(H) = ${f2(pH)}</b> con H = ${f2(H)}: la varianza de los residuos del último tercio es ${f2(H)} veces la del primero. Se rechaza la homocedasticidad: considera una transformación (logaritmo, Box–Cox) o advierte sobre los intervalos. Prob(Q) = ${f2(pQ)} y Prob(JB) = ${f2(pJB)} no muestran otros problemas.`,
      bien: `Todos los coeficientes tienen P&gt;|z| menor que 0.05 y las tres pruebas de residuos tienen probabilidades altas: Prob(Q) = ${f2(pQ)} (sin autocorrelación), Prob(JB) = ${f2(pJB)} (normalidad razonable) y Prob(H) = ${f2(pH)} (varianza constante). No hay un problema a la vista; falta comparar contra otros candidatos y evaluar fuera de muestra.`
    };
    return {
      titulo: 'summary() de SARIMAX', unidad: 'u2', enlace: { u: 'u2', id: 'summary', t: 'Leer el summary() de SARIMAX' },
      pintar(div) {
        div.append(el('pre', { class: 'is-pre' }, L.join('\n')),
          el('div', { class: 'is-nota' }, 'Salida con el formato de statsmodels. Los números se generan al azar, pero son consistentes entre sí (z = coef/std err, las probabilidades corresponden a sus estadísticos).'));
      },
      pregunta: '¿Cuál es el principal problema que muestra esta salida?',
      opciones: ['Un coeficiente no es significativo: conviene probar el modelo sin ese término', 'Los residuos están autocorrelacionados: el modelo no capturó toda la dependencia',
        'Los residuos no son normales: los intervalos basados en la normal son dudosos', 'La varianza de los residuos no es constante (heterocedasticidad)',
        'Ninguno: coeficientes significativos y residuos sin problemas a la vista'],
      correcta: { coef: 0, autocorr: 1, normal: 2, het: 3, bien: 4 }[caso], explicacion: EXPL[caso]
    };
  }

  // ---- Periodograma → periodo dominante (Unidad III)
  function genPeriodograma(semilla) {
    let res = null;
    for (let intento = 0; intento < 40; intento++) {
      const r = TS.rng(semilla + intento * 32452843);
      const n = elige(r, [120, 144, 200, 240]);
      const P = elige(r, [4, 5, 6, 8, 10, 12, 20, 24].filter(p => n % p === 0));
      const A = entre(r, 1.3, 2.2), fase = entre(r, 0, 6.28), phi = elige(r, [0, 0, 0.3]);
      const e = TS.rng(Math.floor(r.unif() * 1e9) + 1).normales(n, 1);
      let ru = 0;
      const x = e.map((v, t) => { ru = phi * ru + v; return A * Math.cos(2 * Math.PI * (t + 1) / P + fase) + ru; });
      const per = T3.periodograma(x);
      let j = 1;
      for (let i = 2; i < per.I.length; i++) if (per.I[i] > per.I[j]) j = i;
      const segundo = Math.max(...per.I.filter((_, i) => i > 0 && Math.abs(i - j) > 1));
      res = { n, P, per, j, x, ok: Math.round(1 / per.f[j]) === P && per.I[j] > 3 * segundo };
      if (res.ok) break;
    }
    const { n, per, j } = res, w = per.f[j], P = Math.round(1 / w);
    const r2 = TS.rng(semilla ^ 0x5bd1e995);
    const otras = barajar(r2, [...new Set([2 * P, Math.max(2, Math.round(P / 2)), P + 2, 3 * P, Math.max(3, P - 1), 7, 12, 30].filter(v => v !== P))]).slice(0, 3);
    const valores = barajar(r2, [P, ...otras]);
    return {
      titulo: 'Periodograma', unidad: 'u3', enlace: { u: 'u3', id: 'periodograma-def', t: 'El periodograma' },
      pintar(div) {
        const g = el('div', { class: 'w-graf', style: 'min-height:260px' });
        div.append(g);
        graf(g, [{ x: per.f.slice(1), y: per.I.slice(1), mode: 'lines+markers', line: { color: PAL.lav, width: 1.4 }, marker: { size: 3.5, color: PAL.lav }, hovertemplate: 'ω = %{x:.4f}<br>I(ω) = %{y:.1f}<extra></extra>' }],
          { height: 260, showlegend: false, title: { text: `Periodograma (n = ${n})` }, xaxis: { title: { text: 'frecuencia ω (ciclos por observación)' } }, yaxis: { title: { text: 'I(ω)' } } });
        div.append(el('div', { class: 'is-nota' }, 'Pasa el cursor por el pico para leer su frecuencia.'));
      },
      pregunta: '¿Cuál es el periodo dominante de la serie?',
      opciones: valores.map(v => `${v} observaciones`), correcta: valores.indexOf(P),
      explicacion: `El pico más alto está en ω = ${j}/${n} = ${f2(w, 4)} ciclos por observación. El periodo es el inverso de la frecuencia: 1/ω = <b>${P} observaciones</b>. La serie se simuló como una oscilación de periodo ${res.P} más ruido; como es una línea angosta y no una joroba ancha, es una periodicidad y no un ciclo de duración variable.`
    };
  }

  const GEN = { acfpacf: genAcfPacf, adfkpss: genAdfKpss, ljungbox: genLjungBox, summary: genSummary, periodograma: genPeriodograma };
  const NOMBRES = { acfpacf: 'ACF y PACF', adfkpss: 'ADF y KPSS', ljungbox: 'Ljung–Box', summary: 'summary()', periodograma: 'Periodograma' };

  // Convierte un elemento generado en un ejercicio de opción múltiple igual a los de las unidades
  function montarGenerado(item, cont) {
    const pg = pagina(item.enlace.u);
    const ej = el('div', { class: 'ejercicio generado', 'data-correcta': String(item.correcta), 'data-unidad': item.unidad });
    ej.innerHTML = `<div class="ej-cab"><span class="ej-num">${esc(item.titulo)}</span><span class="ej-nivel nivel-intermedio">Interpretar salida</span>` +
      `<span class="ej-tema"><a class="ref ref-unidad" href="${pg.a}#${item.enlace.id}"><span class="ref-flecha">${esc(pg.c)}</span> ${esc(item.enlace.t)}</a></span></div>` +
      `<div class="is-salida"></div><div class="is-pregunta">${item.pregunta}</div>` +
      `<div class="ej-opciones">${item.opciones.map((o, i) => `<button type="button" class="opcion" data-i="${i}"><span class="letra">${String.fromCharCode(65 + i)}</span><span class="op-txt">${o}</span></button>`).join('')}</div>` +
      `<div class="ej-acciones"><button type="button" class="btn-respuesta">Ver respuesta</button></div><div class="ej-solucion" hidden><p>${item.explicacion}</p></div>`;
    cont.append(ej);
    item.pintar($('.is-salida', ej));
    UI.iniciarEjercicio(ej);
    return ej;
  }

  /* ===================== Widget: interpretar salidas ===================== */
  window.GUIA_REGISTRAR('interpretar', function (c) {
    c.innerHTML = '';
    let tipo = 'azar';
    const marcas = leer('guia-interpretar', { ok: 0, total: 0 });
    const ctr = el('div', { class: 'w-controles' }), zona = el('div'), cuenta = el('div', { class: 'w-lectura' });
    c.append(ctr, zona, cuenta);
    const seg = el('div', { class: 'w-seg' });
    const tipos = [['azar', 'Al azar']].concat(Object.keys(GEN).map(k => [k, NOMBRES[k]]));
    tipos.forEach(([k, n]) => {
      const b = el('button', { type: 'button', class: k === tipo ? 'on' : '' }, n);
      b.addEventListener('click', () => { tipo = k; $$('button', seg).forEach(x => x.classList.toggle('on', x === b)); nueva(); });
      seg.append(b);
    });
    const btn = el('button', { type: 'button', class: 'w-btn' }, '🎲 Nueva salida');
    btn.addEventListener('click', nueva);
    ctr.append(el('div', { class: 'w-control' }, el('label', {}, 'Tipo de salida'), seg), btn);
    function pintarCuenta() {
      cuenta.innerHTML = marcas.total ? `Llevas <b>${marcas.ok}</b> de <b>${marcas.total}</b> salidas bien interpretadas (${Math.round(100 * marcas.ok / marcas.total)}%).` : 'Elige una opción y pulsa «Ver respuesta». Tu marcador se guarda en este navegador.';
    }
    function nueva() {
      zona.innerHTML = '';
      const k = tipo === 'azar' ? Object.keys(GEN)[Math.floor(Math.random() * Object.keys(GEN).length)] : tipo;
      const ej = montarGenerado(GEN[k](semillaNueva()), zona);
      $('.btn-respuesta', ej).addEventListener('click', () => {
        if (ej.dataset.contado || !ej.dataset.resultado) return;
        ej.dataset.contado = '1';
        marcas.total++; if (ej.dataset.resultado === 'ok') marcas.ok++;
        guardar('guia-interpretar', marcas);
        pintarCuenta();
      });
    }
    pintarCuenta();
    nueva();
  });

  /* ============================ Banco de ejercicios ============================ */
  const BANCO = window.GUIA_BANCO || {};
  const TODOS = [];
  Object.keys(BANCO).forEach(u => BANCO[u].items.forEach(it => TODOS.push(it)));
  const POR_ID = new Map(TODOS.map(it => [it.e, it]));
  // Inserta un ejercicio del banco (HTML generado por build.py) y lo activa
  function montarBanco(it, cont, opc) {
    const caja = el('div');
    caja.innerHTML = it.h;
    const ej = caja.firstElementChild;
    ej.removeAttribute('id');
    ej.removeAttribute('data-prof');
    ej.dataset.unidad = it.su;
    cont.append(ej);
    UI.iniciarEjercicio(ej, opc);
    return ej;
  }
  const NOMBRE_U = { u1: 'Unidad I', u2: 'Unidad II', u3: 'Unidad III' };

  /* ============================== Widget: simulacro ============================== */
  window.GUIA_REGISTRAR('simulacro', function (c) {
    c.classList.add('pr-app');
    // Muestra al azar que procura no repetir tema (sección) mientras haya de dónde elegir
    const muestra = (r, pool, k) => {
      const mezcla = barajar(r, pool), vistos = new Set(), out = [];
      for (const it of mezcla) { if (out.length < k && !vistos.has(it.sec)) { vistos.add(it.sec); out.push(it); } }
      for (const it of mezcla) { if (out.length < k && !out.includes(it)) out.push(it); }
      return out;
    };
    function inicio() {
      c.className = 'widget pr-app';
      c.innerHTML = '';
      const hist = leer('guia-simulacros', []);
      const panel = el('div', { class: 'pr-panel' });
      panel.innerHTML = `<h4>Antes de empezar</h4><p>Resérvate unos 45 minutos, sin apuntes. Responde las 15 preguntas y pulsa <b>Terminar y calificar</b>: hasta entonces no verás ninguna respuesta.</p>` +
        `<div class="pr-opciones"><label><input type="checkbox" id="sim-ets"${UI.enEts() ? ' checked' : ''}> Solo temas de la Guía para ETS (sin profundización)</label></div>` +
        `<button type="button" class="pr-btn" id="sim-ir">▶ Comenzar simulacro</button>` +
        (hist.length ? `<div class="pr-historial">Tus simulacros: ${hist.slice(-6).map(h => `<b>${h.nota.toFixed(1)}</b> <small>(${h.fecha})</small>`).join(' · ')}</div>` : '');
      c.append(panel);
      $('#sim-ir', c).addEventListener('click', () => comenzar($('#sim-ets', c).checked));
    }
    function comenzar(soloEts) {
      const r = TS.rng(semillaNueva());
      const items = [];
      ['u1', 'u2', 'u3'].forEach(u => {
        const sirve = it => it.su === u && !(soloEts && it.prof);
        const mc = muestra(r, TODOS.filter(it => it.tipo === 'mc' && sirve(it)), 3);
        const ab = muestra(r, TODOS.filter(it => it.tipo === 'ab' && sirve(it)), 1);
        const extra = ab.length ? [] : muestra(r, TODOS.filter(it => it.tipo === 'mc' && sirve(it) && !mc.includes(it)), 1);
        const gen = u === 'u1' ? 'adfkpss' : u === 'u2' ? elige(r, ['acfpacf', 'summary', 'ljungbox']) : 'periodograma';
        mc.concat(extra).forEach(it => items.push({ clase: 'mc', u, it }));
        items.push({ clase: 'gen', u, gen: GEN[gen](semillaNueva()) });
        ab.forEach(it => items.push({ clase: 'ab', u, it }));
      });
      c.className = 'widget pr-app simulando';
      c.innerHTML = '';
      const barra = el('div', { class: 'pr-barra' }), resultado = el('div'), listaEl = el('div');
      const cuenta = el('span', {}, ''), terminar = el('button', { type: 'button', class: 'pr-btn' }, 'Terminar y calificar');
      barra.append(cuenta, terminar);
      c.append(barra, resultado, listaEl);
      items.forEach((x, i) => {
        const caja = el('div', { class: 'pr-item' });
        caja.append(el('div', { class: 'pr-etq' }, el('b', {}, `Pregunta ${i + 1} de ${items.length}`), el('span', {}, NOMBRE_U[x.u])));
        listaEl.append(caja);
        x.ej = x.clase === 'gen' ? montarGenerado(x.gen, caja) : montarBanco(x.it, caja, { efimero: true });
      });
      const respondida = x => x.clase === 'ab' ? $('.ab-texto', x.ej).value.trim().length > 0 : !!$('.opcion.elegida', x.ej);
      const pintarCuenta = () => { cuenta.textContent = `Respondidas: ${items.filter(respondida).length} de ${items.length}`; };
      c.addEventListener('guia:eleccion', pintarCuenta);
      c.addEventListener('input', pintarCuenta);
      pintarCuenta();
      let registro = null;
      function calificar() {
        const puntos = x => x.clase === 'ab' ? ({ bien: 1, medias: 0.5, mal: 0 })[x.ej.dataset.nota] : (x.ej.dataset.resultado === 'ok' ? 1 : 0);
        const pend = items.filter(x => x.clase === 'ab' && !x.ej.dataset.nota).length;
        const total = items.reduce((s, x) => s + (puntos(x) || 0), 0), nota = 10 * total / items.length;
        const porU = ['u1', 'u2', 'u3'].map(u => { const xs = items.filter(x => x.u === u); return { u, p: xs.reduce((s, x) => s + (puntos(x) || 0), 0), n: xs.length }; });
        const filas = items.map((x, i) => {
          const p = puntos(x), marca = p === undefined ? '… califícala' : p === 1 ? '✓' : p === 0.5 ? '≈' : '✗';
          const tema = x.clase === 'gen' ? { u: x.gen.enlace.u, id: x.gen.enlace.id, t: x.gen.enlace.t } : { u: x.it.su, id: x.it.sec, t: x.it.st || 'Ver el tema' };
          const pg = pagina(tema.u);
          return `<tr><td class="num">${i + 1}</td><td>${NOMBRE_U[x.u]}</td><td>${x.clase === 'ab' ? 'Abierta' : x.clase === 'gen' ? 'Interpretar' : 'Opción múltiple'}</td>` +
            `<td style="font-weight:800;color:${p === 1 ? 'var(--menta-o)' : p === undefined ? 'var(--texto-suave)' : p === 0.5 ? 'var(--mantequilla-o)' : 'var(--coral-o)'}">${marca}</td>` +
            `<td>${tema.id ? `<a class="ref ref-unidad" href="${pg.a}#${tema.id}"><span class="ref-flecha">${esc(pg.c)}</span> ${esc(tema.t)}</a>` : ''}</td></tr>`;
        }).join('');
        resultado.innerHTML = `<div class="pr-resultado"><div class="pr-nota">${nota.toFixed(1)} <small>de 10 · ${total} de ${items.length} puntos${pend ? ` · faltan ${pend} abierta${pend === 1 ? '' : 's'} por calificar` : ''}</small></div>` +
          `<div class="pr-desglose">${porU.map(d => `<div><b>${NOMBRE_U[d.u]}</b>${d.p} de ${d.n}</div>`).join('')}</div>` +
          (pend ? '<p>Lee la respuesta modelo de cada pregunta abierta, palomea los puntos que sí incluiste y califícate: la nota se actualiza sola.</p>' : '') +
          `<div class="tabla"><table class="pr-temas"><thead><tr><th>#</th><th>Unidad</th><th>Tipo</th><th>Resultado</th><th>Tema para repasar</th></tr></thead><tbody>${filas}</tbody></table></div>` +
          `<div class="pr-opciones"><button type="button" class="pr-btn" id="sim-otro">↺ Nuevo simulacro</button><a class="pr-btn sec" href="#errores" style="text-decoration:none">🔁 Repasar mis errores</a></div></div>`;
        $('#sim-otro', resultado).addEventListener('click', () => { inicio(); c.scrollIntoView({ block: 'start' }); });
        const hist = leer('guia-simulacros', []);
        const dato = { fecha: new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }), nota: Number(nota.toFixed(2)), porUnidad: porU.map(d => d.p), ets: soloEts };
        if (registro === null) { hist.push(dato); registro = hist.length - 1; } else hist[registro] = dato;
        guardar('guia-simulacros', hist.slice(-30));
        if (hist.length > 30) registro = 29;
      }
      terminar.addEventListener('click', () => {
        if (c.classList.contains('calificado')) return;
        items.forEach(x => UI.revelar(x.ej, { contarVacia: true }));
        c.classList.add('calificado');
        barra.remove();
        calificar();
        resultado.scrollIntoView({ block: 'start' });
        window.dispatchEvent(new Event('resize'));
      });
      c.addEventListener('guia:nota', () => { if (c.classList.contains('calificado')) calificar(); });
    }
    if (!TODOS.length) { c.innerHTML = '<div class="w-cargando">No se pudo cargar el banco de ejercicios.</div>'; return; }
    inicio();
  });

  /* =========================== Widget: repaso de errores =========================== */
  window.GUIA_REGISTRAR('errores', function (c) {
    c.classList.add('pr-app');
    let filtro = 'todas', mostrados = 10;
    function pendientes() {
      const e = leer('guia-errores', {});
      // Se descartan los ids que ya no existen (el ejercicio cambió de texto)
      const viejos = Object.keys(e).filter(id => !POR_ID.has(id));
      if (viejos.length) { viejos.forEach(id => delete e[id]); guardar('guia-errores', e); }
      return Object.keys(e).sort((a, b) => e[b] - e[a]).map(id => POR_ID.get(id));
    }
    function pintar() {
      c.innerHTML = '';
      const todos = pendientes(), lista = todos.filter(it => filtro === 'todas' || it.su === filtro);
      const barra = el('div', { class: 'pr-panel' });
      barra.innerHTML = `<div class="pr-opciones" style="margin:0"><span id="err-cuenta"></span>` +
        `<label>Unidad <select id="err-filtro"><option value="todas">Todas</option><option value="u1">Unidad I</option><option value="u2">Unidad II</option><option value="u3">Unidad III</option></select></label>` +
        `<button type="button" class="pr-btn sec" id="err-act">↻ Actualizar lista</button></div>`;
      c.append(barra);
      $('#err-filtro', c).value = filtro;
      $('#err-filtro', c).addEventListener('change', e => { filtro = e.target.value; mostrados = 10; pintar(); });
      $('#err-act', c).addEventListener('click', pintar);
      const cuenta = () => { const n = Object.keys(leer('guia-errores', {})).length; $('#err-cuenta', c).innerHTML = n ? `Tienes <b>${n}</b> ejercicio${n === 1 ? '' : 's'} por repasar` : 'No tienes errores pendientes'; };
      cuenta();
      if (!lista.length) {
        c.append(el('div', { class: 'pr-vacio' }, todos.length ? 'No hay errores pendientes en esta unidad.' : '🎉 Tu lista está vacía. Cuando falles un ejercicio en una unidad, en las preguntas tipo o en un simulacro, aparecerá aquí.'));
        return;
      }
      const zona = el('div');
      c.append(zona);
      lista.slice(0, mostrados).forEach(it => {
        const caja = el('div', { class: 'pr-item' });
        caja.append(el('div', { class: 'pr-etq' }, el('b', {}, NOMBRE_U[it.su] || ''), el('span', {}, it.st || '')));
        zona.append(caja);
        const ej = montarBanco(it, caja);
        ej.dataset.err = it.e;
      });
      if (lista.length > mostrados) {
        const mas = el('button', { type: 'button', class: 'pr-btn sec' }, `Mostrar ${Math.min(10, lista.length - mostrados)} más`);
        mas.addEventListener('click', () => { mostrados += 10; pintar(); });
        c.append(mas);
      }
      c._cuenta = cuenta;
    }
    // Al acertar, el ejercicio sale de la lista: se marca, sin redibujar lo que estás respondiendo
    document.addEventListener('guia:errores', () => {
      const e = leer('guia-errores', {});
      $$('[data-err]', c).forEach(ej => ej.classList.toggle('pr-fuera', !e[ej.dataset.err]));
      if (c._cuenta && $('#err-cuenta', c)) c._cuenta();
    });
    pintar();
  });
})();
