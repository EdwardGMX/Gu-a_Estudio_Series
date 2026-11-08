/* =====================================================================
   widgets2.js — Gráficas interactivas de la Unidad II.
   Usa las utilidades de widgets.js (window.GUIA_UTIL) y los cálculos
   de ts.js (TS) y ts2.js (TS2). Cada gráfica se registra con
   window.GUIA_REGISTRAR y se dibuja al acercarte a ella.
   ===================================================================== */
(function () {
  'use strict';
  const U = window.GUIA_UTIL, R = window.GUIA_REGISTRAR;
  if (!U || !R || !window.TS2) return;
  const { PAL, el, fmt, fp, num, kpi, tex, slider, seleccion, segmentado, boton, casilla, lienzo, lamina, fila, lectura,
    combinar, graf, banda, trazasACF, layoutACF, apilado, tablaHTML, extra, dispersion, codigoPython, pyv, panelCodigo, tablaTexto,
    panelParametros, tallos } = U;
  const DATOS = U.datos || {};
  const T2 = window.TS2;
  const AP = TS.datos.airpassengers, FECHAS_AP = TS.datos.fechasMensuales(1949, 144), LOGAP = AP.map(Math.log);
  const rango = TS.rango;
  const f3 = v => fmt(v, 3), f4 = v => fmt(v, 4);
  const sgn = v => (v < 0 ? '− ' + num(-v) : '+ ' + num(v));
  const lin = (x, y, color, nombre, extra) => Object.assign({ x, y, mode: 'lines', line: { color, width: 1.8 }, name: nombre }, extra || {});
  const vline = (x, y0, y1, color, dash, nombre) => ({ x: [x, x], y: [y0, y1], mode: 'lines', line: { color, width: 2, dash: dash || 'solid' }, name: nombre || '', hoverinfo: 'skip', showlegend: !!nombre });
  const hline = (x0, x1, y, color, dash, nombre) => ({ x: [x0, x1], y: [y, y], mode: 'lines', line: { color, width: 1.5, dash: dash || 'dash' }, name: nombre || '', hoverinfo: 'skip', showlegend: !!nombre });
  // Normales con distintas distribuciones (todas con media 0 y varianza 1)
  function choques(tipo, n, semilla) {
    const r = TS.rng(semilla);
    if (tipo === 't3') return rango(n).map(() => { const z = r.normal(); let c = 0; for (let i = 0; i < 3; i++) { const u = r.normal(); c += u * u; } return z / Math.sqrt(c / 3) / Math.sqrt(3); });
    if (tipo === 'unif') return rango(n).map(() => Math.sqrt(3) * (2 * r.unif() - 1));
    return r.normales(n);
  }
  const histograma = (x, color, nb) => ({ type: 'histogram', x, histnorm: 'probability density', nbinsx: nb || 30, marker: { color: color || 'rgba(124,105,214,.45)', line: { color: '#fff', width: 0.5 } }, name: 'histograma', hovertemplate: '%{x}<br>densidad %{y:.3f}<extra></extra>' });
  const curvaNormal = (m, s, a, b, color, nombre) => {
    const xs = rango(121).map(i => a + (b - a) * i / 120);
    return lin(xs, xs.map(v => T2.normpdf(v, m, s)), color || PAL.rosa, nombre || 'normal', { line: { color: color || PAL.rosa, width: 2.2 } });
  };
  const polTexto = (a, v) => a.map((c, i) => [c, i]).filter(([c]) => Math.abs(c) > 1e-12).map(([c, i], j) => {
    const s = j === 0 ? (c < 0 ? '-' : '') : (c < 0 ? ' - ' : ' + '), m = Math.abs(c), cs = (Math.abs(m - 1) < 1e-12 && i > 0) ? '' : num(m);
    return s + cs + (i === 0 ? '' : i === 1 ? (v || 'L') : (v || 'L') + '^{' + i + '}');
  }).join('') || '0';

  /* ======================= 0 · Repaso y herramientas ======================= */
  // ¿Esto es ruido blanco?
  R('w2-ruido', c => {
    const ctr = lienzo(c);
    let semilla = 11;
    const tipo = segmentado(ctr, { etiqueta: 'Proceso', valor: 'norm', opciones: [['norm', 'Normal'], ['t3', 't de Student (3 g.l.)'], ['unif', 'Uniforme'], ['arch', 'ARCH(1)'], ['ar', 'AR(1), φ = 0.6']] }, dibujar);
    const n = slider(ctr, { etiqueta: 'n', min: 50, max: 1000, paso: 50, valor: 200 }, dibujar);
    boton(ctr, 'Nueva muestra', () => { semilla += 7; dibujar(); });
    const f = fila(c), g1 = lamina(f), g2 = lamina(f), g3 = lamina(c), lec = lectura(c);
    const ex = extra(c, 'Vista extra: la ACF de la serie al cuadrado (memoria en la varianza)'), gx = lamina(ex), lx = lectura(ex);
    function serie() {
      const N = n.get(), t = tipo.get();
      if (t === 'arch') return T2.simARCH(N, 0.5, 0.5, { semilla }).e;
      if (t === 'ar') return TS.sim.ar1(N, 0.6, { semilla, sigma: 0.8 });
      return choques(t, N, semilla);
    }
    function dibujar() {
      const x = serie(), N = x.length, r = TS.acf(x, 20), b = 1.96 / Math.sqrt(N);
      const M = T2.momentos(x), lb = TS.ljungBox(x, 10), fuera = r.slice(1).filter(v => Math.abs(v) > b).length;
      graf(g1, [lin(rango(N, 1), x, PAL.lav, 'serie', { line: { color: PAL.lav, width: 1.1 } })], { height: 250, title: { text: 'La serie' }, showlegend: false, xaxis: { title: { text: 't' } } });
      const lim = Math.max(4, ...x.map(Math.abs));
      graf(g2, [histograma(x), curvaNormal(M.media, Math.sqrt(M.var), -lim, lim, PAL.rosa, 'normal con la misma media y varianza')], { height: 250, title: { text: 'Histograma' }, showlegend: false, bargap: 0.05 });
      graf(g3, trazasACF(r, N), layoutACF('ACF de la serie', { height: 240 }));
      const rb = tipo.get() !== 'ar';
      lec.className = 'w-lectura ' + (lb.p > 0.05 ? 'ok' : 'mal');
      lec.innerHTML = `Media ${f3(M.media)} · varianza ${f3(M.var)} · asimetría ${f3(M.skew)} · curtosis ${f3(M.kurt)}. Barras fuera de la banda: <b>${fuera} de 20</b> (se esperan ≈ 1). ` +
        `Ljung–Box con h = 10: Q = ${f3(lb.Q)}, p = <b>${fp(lb.p)}</b> → ${lb.p > 0.05 ? 'no hay evidencia de autocorrelación' : 'hay autocorrelación: <b>no</b> es ruido blanco'}. ` +
        (rb ? '' : '💡 El AR(1) tiene memoria: la ACF decae como 0.6<sup>k</sup>.') + (tipo.get() === 't3' ? ' 💡 Colas pesadas: la curtosis es mucho mayor que 3, pero sigue siendo ruido blanco.' : '');
      const x2 = x.map(v => v * v), r2 = TS.acf(x2, 20), lb2 = TS.ljungBox(x2, 10);
      graf(gx, trazasACF(r2, N, { color: PAL.cel }), layoutACF('ACF de la serie al cuadrado', { height: 220 }));
      lx.innerHTML = `Ljung–Box sobre los cuadrados (h = 10): p = <b>${fp(lb2.p)}</b>. ` + (tipo.get() === 'arch' ? 'El ARCH es ruido blanco en los valores, pero sus cuadrados están correlacionados: <b>la volatilidad tiene memoria</b>.' : tipo.get() === 'ar' ? 'Los cuadrados heredan la memoria del AR(1).' : 'Los cuadrados tampoco tienen memoria: este ruido blanco es además independiente.');
    }
    dibujar();
  });

  // Choques → filtro → serie (descomposición de Wold)
  const MODELOS_WOLD = {
    ma1: { nombre: 'MA(1), θ = 0.8', ar: [1], ma: [1, 0.8] },
    ma3: { nombre: 'MA(3), θ = (0.6, 0.4, 0.2)', ar: [1], ma: [1, 0.6, 0.4, 0.2] },
    ar1: { nombre: 'AR(1), φ = 0.8', ar: [1, -0.8], ma: [1] },
    ar1n: { nombre: 'AR(1), φ = −0.7', ar: [1, 0.7], ma: [1] },
    ar2: { nombre: 'AR(2), φ = (1, −0.5)', ar: [1, -1, 0.5], ma: [1] },
    arma: { nombre: 'ARMA(1,1), φ = 0.7, θ = 0.4', ar: [1, -0.7], ma: [1, 0.4] },
    paseo: { nombre: 'Paseo aleatorio (ψ = 1 siempre)', ar: [1, -1], ma: [1] }
  };
  R('w2-wold', c => {
    const ctr = lienzo(c), N = 60;
    let semilla = 5;
    const mod = seleccion(ctr, { etiqueta: 'Modelo', valor: 'ar1', opciones: Object.keys(MODELOS_WOLD).map(k => [k, MODELOS_WOLD[k].nombre]) }, dibujar);
    const tt = slider(ctr, { etiqueta: 'Instante t', min: 1, max: N, paso: 1, valor: 40 }, dibujar);
    boton(ctr, 'Otros choques', () => { semilla += 3; dibujar(); });
    const g1 = lamina(c), f = fila(c), g2 = lamina(f), g3 = lamina(f), lec = lectura(c);
    const ex = extra(c, 'Vista extra: la suma ψ₀ε_t + ψ₁ε_(t−1) + … renglón por renglón'), tab = el('div', { class: 'w-tabla' });
    ex.append(tab);
    function dibujar() {
      const M = MODELOS_WOLD[mod.get()], e = TS.rng(semilla).normales(N), psi = T2.psi(M.ar, M.ma, N), t = tt.get();
      const y = rango(N).map(i => { let s = 0; for (let j = 0; j <= i; j++) s += psi[j] * e[i - j]; return s; });
      graf(g1, [lin(rango(N, 1), y, PAL.lav, 'y_t', { mode: 'lines+markers', marker: { size: 4, color: PAL.lav } }),
        { x: [t], y: [y[t - 1]], mode: 'markers', marker: { size: 13, color: PAL.rosa, line: { color: '#fff', width: 2 } }, name: 'y en el instante elegido', hovertemplate: 'y_%{x} = %{y:.3f}<extra></extra>' }],
      { height: 240, title: { text: 'Serie: y<sub>t</sub> = Σ ψ<sub>j</sub> ε<sub>t−j</sub>' }, showlegend: false, xaxis: { title: { text: 't' } } });
      const maxPsi = Math.max(...psi.slice(0, t).map(Math.abs), 1e-9);
      const colores = rango(N).map(i => { if (i >= t) return 'rgba(169,165,194,.35)'; const w = Math.abs(psi[t - 1 - i]) / maxPsi; return w < 1e-3 ? 'rgba(169,165,194,.55)' : `rgba(224,112,159,${0.25 + 0.75 * w})`; });
      graf(g2, [{ type: 'bar', x: rango(N, 1), y: e, marker: { color: colores }, hovertemplate: 'ε_%{x} = %{y:.3f}<extra></extra>' }],
        { height: 240, title: { text: 'Choques ε<sub>t</sub> (rosa = alimentan al instante elegido)' }, showlegend: false, xaxis: { title: { text: 't' } }, bargap: 0.15 });
      const J = 20;
      graf(g3, tallos(rango(J + 1), psi.slice(0, J + 1), PAL.menta), { height: 240, title: { text: 'Pesos ψ<sub>j</sub> del filtro' }, xaxis: { title: { text: 'j (antigüedad del choque)' } }, showlegend: false });
      const filas = [], cls = [];
      let acum = 0;
      for (let j = 0; j < t; j++) {
        const prod = psi[j] * e[t - 1 - j];
        acum += prod;
        if (j < 10 || j === t - 1) { filas.push([j, `ε<sub>${t - j}</sub>`, f4(psi[j]), f4(e[t - 1 - j]), f4(prod), f4(acum)]); cls.push(j === 0 ? 'resaltado' : ''); }
        else if (j === 10) { filas.push(['⋮', '⋮', '⋮', '⋮', '⋮', '⋮']); cls.push(''); }
      }
      tab.innerHTML = tablaHTML(['j', 'choque', 'ψ<sub>j</sub>', 'ε<sub>t−j</sub>', 'ψ<sub>j</sub>·ε<sub>t−j</sub>', 'suma acumulada'], filas, cls);
      const efectivos = psi.slice(0, t).filter(v => Math.abs(v) > 0.05).length;
      lec.innerHTML = `y<sub>${t}</sub> = <b>${f4(y[t - 1])}</b>. Con este modelo, ${mod.get() === 'paseo' ? '<b>todos</b> los choques anteriores pesan lo mismo (ψ = 1): por eso el paseo aleatorio nunca «olvida» y no es estacionario.' : `solo ${efectivos} choque${efectivos === 1 ? '' : 's'} tiene${efectivos === 1 ? '' : 'n'} peso mayor que 0.05: la memoria es ${mod.get().startsWith('ma') ? 'corta y se corta de golpe' : 'larga pero se apaga'}.`}`;
    }
    dibujar();
  });

  // El mejor pronóstico minimiza el error cuadrático
  R('w2-esperanza', c => {
    const ctr = lienzo(c), C0 = 2, PHI = 0.6;
    const yt = slider(ctr, { etiqueta: 'Último dato y_t', min: -4, max: 14, paso: 0.5, valor: 10 }, dibujar);
    const a = slider(ctr, { etiqueta: 'Tu pronóstico a', min: 0, max: 14, paso: 0.1, valor: 6 }, dibujar);
    const sg = slider(ctr, { etiqueta: 'σ del choque', min: 0.5, max: 3, paso: 0.1, valor: 1 }, dibujar);
    boton(ctr, 'Usar la media condicional', () => { a.set(Math.round((C0 + PHI * yt.get()) * 10) / 10); dibujar(); });
    const f = fila(c), g1 = lamina(f), g2 = lamina(f), lec = lectura(c);
    const ex = extra(c, 'Vista extra: repetir «mañana» 2000 veces y medir el error de cada pronóstico'), tab = el('div', { class: 'w-tabla' });
    ex.append(tab);
    function dibujar() {
      const mu = C0 + PHI * yt.get(), s = sg.get(), A = a.get(), ecm = s * s + (mu - A) ** 2;
      const lo = Math.min(mu - 4 * s, A - 1), hi = Math.max(mu + 4 * s, A + 1), ymax = T2.normpdf(mu, mu, s);
      graf(g1, [curvaNormal(mu, s, lo, hi, PAL.lav, 'densidad de y(t+1)'), vline(mu, 0, ymax * 1.05, PAL.lav, 'dash', 'media condicional'), vline(A, 0, ymax * 1.05, PAL.rosa, 'solid', 'tu pronóstico')],
        { height: 260, title: { text: 'Distribución de y<sub>t+1</sub> dado y<sub>t</sub>' }, xaxis: { title: { text: 'valor de mañana' } }, yaxis: { title: { text: 'densidad' } } });
      const xs = rango(141).map(i => i * 0.1);
      graf(g2, [lin(xs, xs.map(v => s * s + (mu - v) ** 2), PAL.menta, 'ECM(a)'), { x: [A], y: [ecm], mode: 'markers', marker: { size: 12, color: PAL.rosa }, name: 'tu pronóstico' },
        { x: [mu], y: [s * s], mode: 'markers', marker: { size: 11, color: PAL.lav, symbol: 'diamond' }, name: 'mínimo' }],
      { height: 260, title: { text: 'Error cuadrático medio de cada pronóstico' }, xaxis: { title: { text: 'pronóstico a' } }, yaxis: { title: { text: 'E[(y − a)²]' }, range: [0, Math.max(30, ecm * 1.1)] } });
      lec.className = 'w-lectura ' + (Math.abs(A - mu) < 0.051 ? 'ok' : '');
      lec.innerHTML = `Media condicional: c + φ·y<sub>t</sub> = ${C0} + ${PHI}·${num(yt.get())} = <b>${num(mu)}</b>. ` +
        `Tu error cuadrático medio: σ² + (μ − a)² = ${num(s * s)} + (${num(mu)} − ${num(A)})² = <b>${fmt(ecm, 3)}</b>. ` +
        (Math.abs(A - mu) < 0.051 ? '✓ Estás en el mínimo: solo queda σ², el error que nadie puede evitar.' : `Te sobran ${fmt(ecm - s * s, 3)} unidades por alejarte de la media.`);
      const sim = TS.rng(17).normales(2000, s).map(v => mu + v);
      const filas = [A, mu, mu + 1, mu - 2].map((p, i) => {
        const e = TS.media(sim.map(v => (v - p) ** 2));
        return [i === 0 ? 'tu pronóstico' : i === 1 ? 'media condicional' : 'otro', num(p), fmt(e, 3), fmt(s * s + (mu - p) ** 2, 3)];
      });
      tab.innerHTML = tablaHTML(['pronóstico', 'a', 'ECM simulado (2000 repeticiones)', 'ECM teórico σ² + (μ − a)²'], filas, ['resaltado', '', '', '']);
    }
    dibujar();
  });

  /* ======================= 1 · Operador rezago ======================= */
  // Plano complejo con círculo unitario
  function planoComplejo(div, grupos, titulo, extraLayout) {
    const ang = rango(181).map(i => 2 * Math.PI * i / 180);
    const tr = [{ x: ang.map(Math.cos), y: ang.map(Math.sin), mode: 'lines', line: { color: PAL.gris, dash: 'dot', width: 1.5 }, name: 'círculo unitario', hoverinfo: 'skip' }];
    let lim = 1.6;
    for (const g of grupos) {
      g.raices.forEach(z => { lim = Math.max(lim, Math.abs(z.re) * 1.15, Math.abs(z.im) * 1.15); });
      tr.push({ x: g.raices.map(z => z.re), y: g.raices.map(z => z.im), mode: 'markers', name: g.nombre,
        marker: { size: g.tam || 11, color: g.color, symbol: g.simbolo || 'circle', line: { color: '#fff', width: 1 } },
        text: g.raices.map(z => `${T2.fmtComplejo(z, 3)}<br>|z| = ${fmt(T2.complejo.cabs(z), 4)}`), hovertemplate: '%{text}<extra>' + g.nombre + '</extra>' });
    }
    lim = Math.min(lim, 6);
    graf(div, tr, combinar({ height: 370, margin: { b: 96 }, legend: { y: -0.32 }, title: { text: titulo || 'Raíces en el plano complejo' }, xaxis: { range: [-lim, lim], title: { text: 'parte real' }, zeroline: true, zerolinecolor: '#ddd8ee' },
      yaxis: { range: [-lim, lim], scaleanchor: 'x', title: { text: 'parte imaginaria' }, zeroline: true, zerolinecolor: '#ddd8ee' } }, extraLayout || {}));
  }
  U.u2plano = planoComplejo;

  R('w2-polinomio', c => {
    const ctr = lienzo(c);
    const a1 = slider(ctr, { etiqueta: 'Factor A: coeficiente de L', min: -2, max: 2, paso: 0.05, valor: -0.5, fmt: num }, dibujar);
    const a2 = slider(ctr, { etiqueta: 'Factor A: coeficiente de L²', min: -1, max: 1, paso: 0.05, valor: 0, fmt: num }, dibujar);
    const tb = segmentado(ctr, { etiqueta: 'Factor B', valor: 'reg', opciones: [['reg', '1 + b·L'], ['est', '1 + b·L¹²']] }, dibujar);
    const b = slider(ctr, { etiqueta: 'b', min: -1.2, max: 1.2, paso: 0.05, valor: 0.3, fmt: num }, dibujar);
    const fx = el('div', { class: 'w-lectura' });
    c.append(fx);
    const f = fila(c), g1 = lamina(f), g2 = lamina(f), lec = lectura(c);
    const ex = extra(c, 'Vista extra: la tabla de multiplicación término por término'), tab = el('div', { class: 'w-tabla' });
    ex.append(tab);
    function dibujar() {
      const A = T2.polRecortar([1, a1.get(), a2.get()]), s = tb.get() === 'est' ? 12 : 1;
      const B = T2.polRecortar(T2.polEstacional([1], s, b.get()).map((v, i) => i === 0 ? 1 : v));
      const P = T2.polRecortar(T2.polMul(A, B));
      fx.innerHTML = tex(`\\underbrace{(${polTexto(A)})}_{A}\\;\\underbrace{(${polTexto(B)})}_{B} = ${polTexto(P)}`, true);
      graf(g1, tallos(rango(P.length), P, PAL.lav), { height: 370, title: { text: 'Coeficientes del producto' }, xaxis: { title: { text: 'potencia j de L' }, dtick: P.length > 16 ? 2 : 1 } });
      const rA = T2.raices(A), rB = T2.raices(B), rP = T2.raices(P);
      planoComplejo(g2, [{ nombre: 'raíces de A', raices: rA, color: PAL.lav, tam: 13 }, { nombre: 'raíces de B', raices: rB, color: PAL.dur, simbolo: 'diamond', tam: 12 },
        { nombre: 'raíces del producto', raices: rP, color: PAL.texto, simbolo: 'x-thin-open', tam: 9 }]);
      const minA = rA.length ? Math.min(...rA.map(T2.complejo.cabs)) : Infinity, minB = rB.length ? Math.min(...rB.map(T2.complejo.cabs)) : Infinity, minP = Math.min(minA, minB);
      const estado = m => !isFinite(m) ? 'sin raíces' : m > 1 + 1e-9 ? `fuera (mín |z| = ${fmt(m, 3)})` : Math.abs(m - 1) < 1e-6 ? '<b>en el círculo</b> (raíz unitaria)' : `<b>dentro</b> (mín |z| = ${fmt(m, 3)})`;
      lec.className = 'w-lectura ' + (minP > 1 + 1e-9 ? 'ok' : 'aviso');
      lec.innerHTML = `Raíces de A: ${estado(minA)} · de B: ${estado(minB)}. El producto tiene grado ${P.length - 1} y ${rP.length} raíces: las ${rA.length} de A más las ${rB.length} de B. ` +
        (minP > 1 + 1e-9 ? 'Si se usara como polinomio AR, el modelo sería <b>estacionario</b>.' : 'Si se usara como polinomio AR, <b>no</b> sería estacionario.');
      const tA = A.map((v, i) => [v, i]).filter(([v]) => Math.abs(v) > 1e-12), tB = B.map((v, i) => [v, i]).filter(([v]) => Math.abs(v) > 1e-12);
      const term = (v, i) => tex((v < 0 ? '-' : '') + (Math.abs(Math.abs(v) - 1) < 1e-12 && i ? '' : num(Math.abs(v))) + (i === 0 ? '' : i === 1 ? 'L' : `L^{${i}}`));
      tab.innerHTML = '<table><thead><tr><th>× </th>' + tB.map(([v, i]) => `<th>${term(v, i)}</th>`).join('') + '</tr></thead><tbody>' +
        tA.map(([va, ia]) => `<tr><th>${term(va, ia)}</th>` + tB.map(([vb, ib]) => `<td>${term(va * vb, ia + ib)}</td>`).join('') + '</tr>').join('') + '</tbody></table>' +
        `<p style="margin:6px 4px">Se juntan las celdas con la misma potencia: ${tex(polTexto(P))}</p>`;
    }
    dibujar();
  });

  R('w2-invertir', c => {
    const ctr = lienzo(c);
    const ph = slider(ctr, { etiqueta: 'φ', min: -1.5, max: 1.5, paso: 0.05, valor: 0.5, fmt: num }, dibujar);
    const k = slider(ctr, { etiqueta: 'Términos k', min: 1, max: 30, paso: 1, valor: 8 }, dibujar);
    const f = fila(c), g1 = lamina(f), g2 = lamina(f), lec = lectura(c);
    const ex = extra(c, 'Vista extra: (1 − φL)·S_k coeficiente por coeficiente'), tab = el('div', { class: 'w-tabla' });
    ex.append(tab);
    function dibujar() {
      const p = ph.get(), K = k.get(), co = rango(K + 1).map(j => Math.pow(p, j));
      graf(g1, tallos(rango(K + 1), co, Math.abs(p) < 1 ? PAL.menta : PAL.dur), { height: 280, title: { text: `Coeficientes de S<sub>k</sub>: φ<sup>j</sup> con φ = ${num(p)}` }, xaxis: { title: { text: 'j' } } });
      const ks = rango(31), sob = ks.map(j => Math.max(1e-12, Math.pow(Math.abs(p), j + 1)));
      graf(g2, [lin(ks, sob, PAL.lav, '|φ|^(k+1)', { mode: 'lines+markers', marker: { size: 4 } }), { x: [K], y: [Math.max(1e-12, Math.pow(Math.abs(p), K + 1))], mode: 'markers', marker: { size: 12, color: PAL.rosa }, name: 'k elegido' }, hline(0, 30, 1, PAL.gris, 'dash', '')],
        { height: 280, title: { text: 'Tamaño del sobrante |φ|<sup>k+1</sup>' }, xaxis: { title: { text: 'k' } }, yaxis: { type: 'log', title: { text: 'escala logarítmica' } }, showlegend: false });
      const so = Math.pow(p, K + 1);
      lec.className = 'w-lectura ' + (Math.abs(p) < 1 ? 'ok' : 'mal');
      lec.innerHTML = `(1 − ${num(p)}L)·S<sub>${K}</sub> = 1 ${so >= 0 ? '−' : '+'} ${fmt(Math.abs(so), 4)}·L<sup>${K + 1}</sup>. ` +
        (Math.abs(p) < 1 ? `Como |φ| < 1, el sobrante se hace tan pequeño como quieras: <b>el inverso existe</b> y el AR(1) tiene forma MA(∞).` : Math.abs(p) === 1 ? 'Con |φ| = 1 el sobrante nunca baja: <b>raíz unitaria</b>, no hay inverso con pesos que se apaguen.' : 'Con |φ| > 1 el sobrante crece: <b>no existe</b> un inverso convergente (el proceso sería explosivo).');
      const filas = [];
      for (let j = 0; j <= K + 1; j++) {
        const a = j <= K ? Math.pow(p, j) : 0, bb = j >= 1 ? -Math.pow(p, j) : 0;
        filas.push([`L<sup>${j}</sup>`, j <= K ? fmt(a, 4) : '—', j >= 1 ? fmt(bb, 4) : '—', fmt(a + bb, 4)]);
      }
      tab.innerHTML = tablaHTML(['potencia', 'de 1·S<sub>k</sub>', 'de −φL·S<sub>k</sub>', 'suma'], filas.length > 14 ? filas.slice(0, 6).concat([['⋮', '⋮', '⋮', '⋮']], filas.slice(-4)) : filas,
        (filas.length > 14 ? filas.slice(0, 6).concat([[]], filas.slice(-4)) : filas).map((f, i, arr) => i === 0 ? 'resaltado' : i === arr.length - 1 ? 'suma' : ''));
    }
    dibujar();
  });

  /* ======================= 2 · Modelos AR(p) ======================= */
  const TRIANGULO = { x: [-2, 2, 0, -2], y: [-1, -1, 1, -1], mode: 'lines', fill: 'toself', fillcolor: 'rgba(124,105,214,.08)', line: { color: PAL.lav, width: 1.5 }, name: 'zona estacionaria', hoverinfo: 'skip' };
  const PARABOLA = (() => { const xs = rango(81).map(i => -2 + i * 0.05); return { x: xs, y: xs.map(v => -v * v / 4), mode: 'lines', line: { color: PAL.gris, dash: 'dot', width: 1.5 }, name: 'φ₁² + 4φ₂ = 0', hoverinfo: 'skip' }; })();
  // Malla invisible para poder hacer clic en cualquier punto del plano (φ1, φ2)
  const MALLA = (() => { const x = [], y = []; for (let i = 0; i <= 80; i++) for (let j = 0; j <= 40; j++) { x.push(-2 + i * 0.05); y.push(-1 + j * 0.05); } return { x, y, mode: 'markers', marker: { size: 9, opacity: 0 }, hovertemplate: 'φ₁ = %{x:.2f}<br>φ₂ = %{y:.2f}<extra>clic para elegir</extra>', showlegend: false }; })();
  const teoricoTr = (vals, desde, nombre) => ({ x: rango(vals.length - desde, desde), y: vals.slice(desde), mode: 'markers', marker: { symbol: 'diamond', size: 9, color: PAL.rosa, line: { color: '#fff', width: 1 } }, name: nombre || 'teórico', hovertemplate: 'k = %{x}<br>teórico = %{y:.4f}<extra></extra>' });
  function zonaAR2(p1, p2) {
    const I = T2.ar2Info(p1, p2);
    if (!I.estacionario) return { I, texto: '<b>fuera del triángulo</b>: no es estacionario (una raíz está dentro o sobre el círculo unitario).' };
    if (I.complejas) return { I, texto: `raíces <b>complejas</b>: pseudo-ciclos de periodo ≈ ${fmt(I.periodo, 2)} con amortiguamiento r = ${fmt(I.amortiguamiento, 3)}.` };
    const l = I.raices.map(z => 1 / z.re), dom = l.reduce((a, b) => Math.abs(b) > Math.abs(a) ? b : a);
    return { I, texto: `raíces <b>reales</b>: la ACF decae ${dom > 0 ? 'sin cambiar de signo' : 'alternando de signo'} (raíz inversa dominante ${fmt(dom, 3)}).` };
  }
  function simularSeguro(ar, ma, n, semilla, c = 0) {
    if (T2.esEstacionario(ar)) return T2.simularARMA(ar, ma, n, { semilla, c, quemado: 400 }).y;
    const r = T2.simularARMA(ar, ma, n, { semilla, c, quemado: 0 }).y;
    return r.map(v => Math.max(-1e6, Math.min(1e6, v)));
  }

  R('w2-ar2', c => {
    const ctr = lienzo(c);
    let semilla = 4;
    const s1 = slider(ctr, { etiqueta: 'φ₁', min: -2, max: 2, paso: 0.05, valor: 0.5, fmt: num }, dibujar);
    const s2 = slider(ctr, { etiqueta: 'φ₂', min: -1, max: 1, paso: 0.05, valor: 0.3, fmt: num }, dibujar);
    boton(ctr, 'Otra trayectoria', () => { semilla += 5; dibujar(); });
    const f1 = fila(c), gT = lamina(f1), gR = lamina(f1), f2 = fila(c), gA = lamina(f2), gP = lamina(f2), gS = lamina(c), lec = lectura(c);
    const ex = extra(c, 'Vista extra: las cuatro zonas típicas del triángulo'), gx = lamina(ex, 'min-height:420px');
    let enlazado = false;
    function dibujar() {
      const p1 = s1.get(), p2 = s2.get(), ar = [1, -p1, -p2], Z = zonaAR2(p1, p2);
      graf(gT, [TRIANGULO, PARABOLA, MALLA, { x: [p1], y: [p2], mode: 'markers', marker: { size: 14, color: PAL.rosa, line: { color: '#fff', width: 2 } }, name: 'tu modelo', hovertemplate: 'φ₁ = %{x:.2f}<br>φ₂ = %{y:.2f}<extra></extra>' }],
        { height: 330, title: { text: 'Triángulo de estacionariedad (haz clic)' }, xaxis: { range: [-2.2, 2.2], title: { text: 'φ₁' } }, yaxis: { range: [-1.15, 1.15], title: { text: 'φ₂' } }, showlegend: false,
          annotations: [{ x: 0, y: 0.55, text: 'reales', showarrow: false, font: { color: PAL.lav, size: 11 } }, { x: 0, y: -0.7, text: 'complejas', showarrow: false, font: { color: PAL.lav, size: 11 } }] });
      if (!enlazado) { gT.on('plotly_click', ev => { const p = ev.points[0]; s1.set(Math.round(p.x * 20) / 20); s2.set(Math.round(p.y * 20) / 20); dibujar(); }); enlazado = true; }
      planoComplejo(gR, [{ nombre: 'raíces de φ(z)', raices: Z.I.raices, color: Z.I.estacionario ? PAL.menta : PAL.dur, tam: 13 }], 'Raíces de 1 − φ₁z − φ₂z²');
      if (Z.I.estacionario) {
        const r = T2.acfTeorica(ar, [1], 20), pc = T2.pacfTeorica(ar, [1], 20);
        graf(gA, tallos(rango(21), r, PAL.lav), layoutACF('ACF teórica', { height: 250, xaxis: { range: [-0.5, 20.5] } }));
        graf(gP, tallos(rango(20, 1), pc.slice(1), PAL.cel), layoutACF('PACF teórica', { height: 250, xaxis: { range: [0.5, 20.5] } }));
      } else {
        graf(gA, [], { height: 250, title: { text: 'ACF: no existe (no estacionario)' }, xaxis: { visible: false }, yaxis: { visible: false } });
        graf(gP, [], { height: 250, title: { text: 'PACF: no existe (no estacionario)' }, xaxis: { visible: false }, yaxis: { visible: false } });
      }
      const y = simularSeguro(ar, [1], 200, semilla);
      graf(gS, [lin(rango(200, 1), y, Z.I.estacionario ? PAL.lav : PAL.dur, 'y', { line: { width: 1.3, color: Z.I.estacionario ? PAL.lav : PAL.dur } })], { height: 230, title: { text: 'Una trayectoria simulada (200 periodos)' }, showlegend: false, xaxis: { title: { text: 't' } } });
      const ms = Z.I.raices.map(z => fmt(T2.complejo.cabs(z), 3)).join(' y ');
      lec.className = 'w-lectura ' + (Z.I.estacionario ? 'ok' : 'mal');
      lec.innerHTML = `φ₁ + φ₂ = ${num(p1 + p2)} ${p1 + p2 < 1 ? '<' : '≥'} 1 · φ₂ − φ₁ = ${num(p2 - p1)} ${p2 - p1 < 1 ? '<' : '≥'} 1 · |φ₂| = ${num(Math.abs(p2))} ${Math.abs(p2) < 1 ? '<' : '≥'} 1. Módulos de las raíces: ${ms}. ` +
        `Zona: ${Z.texto}` + (Z.I.estacionario ? ` PACF(2) = ${fmt(T2.pacfTeorica(ar, [1], 2)[2], 3)} = φ₂ ✓.` : '');
      const zonas = [[0.5, 0.3, 'reales positivas: decae sin oscilar'], [-0.5, 0.3, 'raíz negativa dominante: alterna'], [1, -0.5, 'complejas: pseudo-ciclo de 8'], [0.55, 0.42, 'cerca del borde: memoria muy larga']];
      const tr = [], L = { height: 420, showlegend: false, margin: { t: 30, b: 30, l: 40, r: 10 }, annotations: [] };
      zonas.forEach(([a, b, t], i) => {
        const yy = T2.simularARMA([1, -a, -b], [1], 120, { semilla: 30 + i, quemado: 300 }).y, xa = 'x' + (i ? i + 1 : ''), ya = 'y' + (i ? i + 1 : '');
        tr.push({ x: rango(120, 1), y: yy, mode: 'lines', line: { color: [PAL.lav, PAL.dur, PAL.menta, PAL.cel][i], width: 1.3 }, xaxis: xa, yaxis: ya });
        const col = i % 2, fil = Math.floor(i / 2);
        L['xaxis' + (i ? i + 1 : '')] = { domain: [col * 0.52, col * 0.52 + 0.48], anchor: ya, showticklabels: fil === 1 };
        L['yaxis' + (i ? i + 1 : '')] = { domain: [fil ? 0 : 0.56, fil ? 0.44 : 1], anchor: xa };
        L.annotations.push({ text: `φ = (${a}, ${b}): ${t}`, xref: 'paper', yref: 'paper', x: col * 0.52, y: fil ? 0.47 : 1.03, xanchor: 'left', showarrow: false, font: { size: 11, color: '#45397a' } });
      });
      graf(gx, tr, L);
    }
    dibujar();
  });

  R('w2-pseudociclo', c => {
    const ctr = lienzo(c);
    let semilla = 8;
    const P = slider(ctr, { etiqueta: 'Periodo P', min: 3, max: 30, paso: 0.5, valor: 8, fmt: num }, dibujar);
    const r = slider(ctr, { etiqueta: 'Amortiguamiento r', min: 0.3, max: 0.99, paso: 0.01, valor: 0.85, fmt: num }, dibujar);
    boton(ctr, 'Otra trayectoria', () => { semilla += 3; dibujar(); });
    const fx = el('div', { class: 'w-lectura' });
    c.append(fx);
    const g1 = lamina(c), f = fila(c), g2 = lamina(f), g3 = lamina(f), lec = lectura(c);
    const ex = extra(c, 'Vista extra: la ACF teórica y su signo'), tab = el('div', { class: 'w-tabla' });
    ex.append(tab);
    function dibujar() {
      const per = P.get(), rr = r.get(), w = 2 * Math.PI / per, p1 = 2 * rr * Math.cos(w), p2 = -rr * rr, ar = [1, -p1, -p2];
      fx.innerHTML = tex(`\\phi_1 = 2r\\cos\\!\\left(\\tfrac{2\\pi}{P}\\right) = 2(${num(rr)})\\cos\\!\\left(\\tfrac{2\\pi}{${num(per)}}\\right) = ${fmt(p1, 4)}, \\qquad \\phi_2 = -r^2 = ${fmt(p2, 4)}`, true);
      const n = 150, y = T2.simularARMA(ar, [1], n, { semilla, quemado: 400 }).y, lim = Math.max(...y.map(Math.abs)) * 1.1;
      const marcas = [];
      for (let k = per; k < n; k += per) marcas.push({ type: 'line', x0: k, x1: k, y0: -lim, y1: lim, line: { color: 'rgba(224,112,159,.25)', width: 1 } });
      graf(g1, [lin(rango(n, 1), y, PAL.lav, 'y', { line: { width: 1.5, color: PAL.lav } })], { height: 240, title: { text: `Trayectoria con φ₁ = ${fmt(p1, 3)}, φ₂ = ${fmt(p2, 3)} (líneas cada P = ${num(per)})` }, showlegend: false, shapes: marcas, yaxis: { range: [-lim, lim] } });
      const K = 40, rho = T2.acfTeorica(ar, [1], K), env = rango(K + 1).map(k => Math.pow(rr, k));
      graf(g2, tallos(rango(K + 1), rho, PAL.menta).concat([lin(rango(K + 1), env, PAL.gris, '+r^k', { line: { dash: 'dot', color: PAL.gris, width: 1.4 } }), lin(rango(K + 1), env.map(v => -v), PAL.gris, '−r^k', { line: { dash: 'dot', color: PAL.gris, width: 1.4 } })]),
        layoutACF('ACF teórica: coseno amortiguado', { height: 280, xaxis: { range: [-0.5, K + 0.5] } }));
      planoComplejo(g3, [{ nombre: 'raíces z = (1/r)·e^(±iω)', raices: T2.raices(ar), color: PAL.menta, tam: 13 }], 'Raíces de φ(z)', { height: 300 });
      const cambios = [];
      for (let k = 1; k <= K; k++) if (Math.sign(rho[k]) !== Math.sign(rho[k - 1]) && Math.abs(rho[k]) > 1e-12) cambios.push(k);
      const dif = cambios.length > 1 ? TS.media(TS.diff(cambios)) : null;
      lec.innerHTML = `ω = 2π/P = ${fmt(w, 4)} rad. La ACF cambia de signo en los rezagos ${cambios.slice(0, 6).join(', ')}${cambios.length > 6 ? '…' : ''}` + (dif ? ` (cada ≈ ${fmt(dif, 1)} rezagos ≈ P/2 = ${fmt(per / 2, 1)}).` : '.') +
        ` Con r = ${num(rr)}, después de un periodo completo la oscilación conserva r<sup>P</sup> = ${fmt(Math.pow(rr, per), 3)} de su tamaño.`;
      const filas = rango(Math.min(K, Math.ceil(2 * per)) + 1).map(k => [k, fmt(rho[k], 4), rho[k] > 1e-12 ? '＋' : rho[k] < -1e-12 ? '−' : '0']);
      tab.innerHTML = tablaHTML(['k', 'ρ(k)', 'signo'], filas, filas.map(f => cambios.includes(f[0]) ? 'resaltado' : ''));
    }
    dibujar();
  });

  const MODELOS_AR = {
    a1: { nombre: 'AR(1): φ = 0.7', phi: [0.7] }, a1n: { nombre: 'AR(1): φ = −0.6', phi: [-0.6] },
    a2: { nombre: 'AR(2): φ = (0.5, 0.3)', phi: [0.5, 0.3] }, a2c: { nombre: 'AR(2): φ = (1, −0.5)', phi: [1, -0.5] },
    a3: { nombre: 'AR(3): φ = (0.4, −0.25, 0.3)', phi: [0.4, -0.25, 0.3] }, a4: { nombre: 'AR(4): φ = (0.3, 0, 0, 0.5)', phi: [0.3, 0, 0, 0.5] }
  };
  // Durbin–Levinson guardando los coeficientes de cada regresión AR(k)
  function durbinLevinson(rho, K) {
    const filas = [];
    let prev = [];
    for (let k = 1; k <= K; k++) {
      let num_ = rho[k], den = 1;
      for (let j = 1; j < k; j++) { num_ -= prev[j - 1] * rho[k - j]; den -= prev[j - 1] * rho[j]; }
      const pkk = num_ / den, nuevo = [];
      for (let j = 1; j < k; j++) nuevo.push(prev[j - 1] - pkk * prev[k - j - 1]);
      nuevo.push(pkk);
      filas.push(nuevo.slice());
      prev = nuevo;
    }
    return filas;
  }
  U.u2dl = durbinLevinson;
  R('w2-arp', c => {
    const ctr = lienzo(c);
    let semilla = 21;
    const m = seleccion(ctr, { etiqueta: 'Modelo', valor: 'a2', opciones: Object.keys(MODELOS_AR).map(k => [k, MODELOS_AR[k].nombre]) }, dibujar);
    const n = slider(ctr, { etiqueta: 'n', min: 50, max: 2000, paso: 50, valor: 200 }, dibujar);
    boton(ctr, 'Nueva muestra', () => { semilla += 4; dibujar(); });
    const f = fila(c), gA = lamina(f), gP = lamina(f), lec = lectura(c);
    const ex = extra(c, 'Vista extra: los coeficientes de cada regresión AR(k) (Durbin–Levinson)'), tab = el('div', { class: 'w-tabla' });
    ex.append(tab);
    function dibujar() {
      const M = MODELOS_AR[m.get()], p = M.phi.length, ar = T2.polAR(M.phi), N = n.get(), K = 20;
      const y = T2.simularARMA(ar, [1], N, { semilla, quemado: 400 }).y, r = TS.acf(y, K), pc = TS.pacf(y, K);
      const rt = T2.acfTeorica(ar, [1], K), pt = T2.pacfTeorica(ar, [1], K), b = 1.96 / Math.sqrt(N);
      graf(gA, trazasACF(r, N).concat([teoricoTr(rt, 1)]), layoutACF('ACF: muestra (barras) y teoría (rombos)', { height: 270 }));
      graf(gP, trazasACF(pc, N, { color: PAL.cel }).concat([teoricoTr(pt, 1)]), layoutACF('PACF: muestra (barras) y teoría (rombos)', { height: 270 }));
      const fuera = pc.slice(p + 1).filter(v => Math.abs(v) > b).length;
      lec.innerHTML = `La PACF teórica se corta después de <b>p = ${p}</b> (último valor φ<sub>${p}${p}</sub> = ${fmt(pt[p], 3)} = φ<sub>${p}</sub>). En esta muestra, de los rezagos ${p + 1} a ${K}, <b>${fuera}</b> barra${fuera === 1 ? '' : 's'} sale${fuera === 1 ? '' : 'n'} de la banda ±${fmt(b, 3)} (se esperan ≈ ${fmt(0.05 * (K - p), 1)} por azar).`;
      const DL = durbinLevinson(rt, Math.min(p + 2, 6)), cols = Math.min(p + 2, 6);
      tab.innerHTML = tablaHTML(['regresión'].concat(rango(cols, 1).map(j => `coef. de y<sub>t−${j}</sub>`)).concat(['PACF φ<sub>kk</sub>']),
        DL.map((fila_, i) => [`AR(${i + 1})`].concat(rango(cols).map(j => j < fila_.length ? fmt(fila_[j], 4) : '')).concat([fmt(fila_[i], 4)])), DL.map((_, i) => i + 1 === p ? 'resaltado' : i + 1 > p ? 'tenue' : ''));
    }
    dibujar();
  });

  R('w2-yulewalker', c => {
    const ctr = lienzo(c);
    let semilla = 100;
    const s1 = slider(ctr, { etiqueta: 'φ₁ verdadero', min: -1.5, max: 1.5, paso: 0.05, valor: 0.5, fmt: num }, dibujar);
    const s2 = slider(ctr, { etiqueta: 'φ₂ verdadero', min: -0.9, max: 0.9, paso: 0.05, valor: 0.3, fmt: num }, dibujar);
    const nn = segmentado(ctr, { etiqueta: 'n', valor: '100', opciones: [['50', '50'], ['100', '100'], ['200', '200'], ['500', '500'], ['1000', '1000']] }, dibujar);
    boton(ctr, 'Repetir el experimento', () => { semilla += 1000; dibujar(); });
    const f = fila(c), g1 = lamina(f), g2 = lamina(f), lec = lectura(c);
    const ex = extra(c, 'Vista extra: promedio y dispersión de las 200 estimaciones'), tab = el('div', { class: 'w-tabla' });
    ex.append(tab);
    function dibujar() {
      const p1 = s1.get(), p2 = s2.get(), N = +nn.get(), ar = [1, -p1, -p2];
      if (!T2.esEstacionario(ar)) {
        graf(g1, [TRIANGULO, { x: [p1], y: [p2], mode: 'markers', marker: { size: 13, color: PAL.dur, symbol: 'diamond' } }], { height: 330, title: { text: 'Elige un punto dentro del triángulo' }, showlegend: false, xaxis: { range: [-2.2, 2.2] }, yaxis: { range: [-1.15, 1.15] } });
        Plotly.purge(g2); lec.className = 'w-lectura mal'; lec.innerHTML = 'Ese AR(2) no es estacionario: Yule–Walker supone estacionariedad. Mueve los deslizadores hacia dentro del triángulo.'; tab.innerHTML = ''; return;
      }
      const yw1 = [], yw2 = [], ol1 = [], ol2 = [];
      let primera = null;
      for (let rep = 0; rep < 200; rep++) {
        const y = T2.simularARMA(ar, [1], N, { semilla: semilla + rep, quemado: 200 }).y;
        if (!rep) primera = y;
        const e = T2.yuleWalker(y, 2, 'mle'), o = T2.ajustarAR(y, 2);
        yw1.push(e.phi[0]); yw2.push(e.phi[1]); ol1.push(o.beta[1]); ol2.push(o.beta[2]);
      }
      graf(g1, [TRIANGULO, dispersion(yw1, yw2, 'rgba(124,105,214,.45)'), dispersion(ol1, ol2, 'rgba(63,174,138,.40)'), { x: [p1], y: [p2], mode: 'markers', marker: { size: 15, color: PAL.rosa, symbol: 'diamond', line: { color: '#fff', width: 2 } }, name: 'verdadero' }],
        { height: 330, title: { text: `200 estimaciones con n = ${N}` }, showlegend: false, xaxis: { range: [-2.2, 2.2], title: { text: 'φ₁ estimado' } }, yaxis: { range: [-1.15, 1.15], title: { text: 'φ₂ estimado' } } });
      const r = TS.acf(primera, 15);
      const trA = trazasACF(r, N, { resaltar: 1 }); trA[trA.length - 1].marker.color[1] = PAL.rosa;
      graf(g2, trA, layoutACF('ACF de una de las muestras (rosa: rezagos 1 y 2)', { height: 330 }));
      const sdT = Math.sqrt((1 - p2 * p2) / N), est = (v) => [fmt(TS.media(v), 4), fmt(TS.desv(v, 1), 4)];
      tab.innerHTML = tablaHTML(['', 'promedio de φ₁ estimado', 'desv. est.', 'promedio de φ₂ estimado', 'desv. est.'], [
        ['Yule–Walker'].concat(est(yw1), est(yw2)), ['MCO (regresión)'].concat(est(ol1), est(ol2)), ['Verdadero / teoría', num(p1), fmt(sdT, 4), num(p2), fmt(sdT, 4)]], ['', '', 'suma']);
      const sesgo = TS.media(yw2) - p2;
      lec.innerHTML = `En la muestra de la derecha ρ̂(1) = ${fmt(r[1], 3)} y ρ̂(2) = ${fmt(r[2], 3)}. Con n = ${N}, la desviación estándar teórica de cada estimador es √((1 − φ₂²)/n) = ${fmt(sdT, 3)}: para dividirla entre 2 hay que multiplicar n por 4. ` +
        `Sesgo promedio de Yule–Walker en φ₂: ${fmt(sesgo, 3)}${Math.abs(sesgo) > 2 * sdT / Math.sqrt(200) ? ' (se nota, sobre todo con n chico o cerca del borde).' : ' (despreciable aquí).'}`;
    }
    dibujar();
  });

  /* ======================= 3 · Modelos MA(q) ======================= */
  R('w2-ma', c => {
    const ctr = lienzo(c);
    let semilla = 31;
    const q = segmentado(ctr, { etiqueta: 'Orden q', valor: '2', opciones: [['1', '1'], ['2', '2'], ['3', '3']] }, dibujar);
    const th = [slider(ctr, { etiqueta: 'θ₁', min: -1.5, max: 1.5, paso: 0.05, valor: 0.5, fmt: num }, dibujar),
      slider(ctr, { etiqueta: 'θ₂', min: -1.5, max: 1.5, paso: 0.05, valor: 0.4, fmt: num }, dibujar),
      slider(ctr, { etiqueta: 'θ₃', min: -1.5, max: 1.5, paso: 0.05, valor: -0.3, fmt: num }, dibujar)];
    const n = slider(ctr, { etiqueta: 'n', min: 50, max: 2000, paso: 50, valor: 300 }, dibujar);
    boton(ctr, 'Nueva muestra', () => { semilla += 4; dibujar(); });
    const f = fila(c), gA = lamina(f), gP = lamina(f), lec = lectura(c);
    const ex = extra(c, 'Vista extra: qué choques comparten y_t y y_(t−k)'), tab = el('div', { class: 'w-tabla' });
    ex.append(tab);
    function dibujar() {
      const Q = +q.get();
      th.forEach((s, i) => s.mostrar(i < Q));
      const theta = th.slice(0, Q).map(s => s.get()), ma = T2.polMA(theta), N = n.get(), K = 15;
      const y = T2.simularARMA([1], ma, N, { semilla, quemado: 50 }).y, r = TS.acf(y, K), pc = TS.pacf(y, K);
      const rt = T2.acfTeorica([1], ma, K), pt = T2.pacfTeorica([1], ma, K);
      graf(gA, trazasACF(r, N).concat([teoricoTr(rt, 1)]), layoutACF('ACF: se corta después de q', { height: 270 }));
      graf(gP, trazasACF(pc, N, { color: PAL.cel }).concat([teoricoTr(pt, 1)]), layoutACF('PACF: decae poco a poco', { height: 270 }));
      const g = T2.acvfTeorica([1], ma, Q + 1, 1), inv = T2.esInvertible(ma), mm = T2.minModulo(ma);
      lec.className = 'w-lectura ' + (inv ? 'ok' : 'aviso');
      lec.innerHTML = 'ρ teórica: ' + rango(Q + 1, 1).map(k => `ρ(${k}) = ${fmt(rt[k], 4)}`).join(' · ') + `. Después de q = ${Q} todas son 0. ` +
        (inv ? `Invertible (mín |z| = ${fmt(mm, 3)} > 1).` : `<b>No invertible</b> (mín |z| = ${fmt(mm, 3)} ≤ 1): tiene un gemelo invertible con la misma ACF.`);
      const cols = rango(Q + 2), pesos = (j, k) => { const i = j - k; return i >= 0 && i <= Q ? ma[i] : null; };
      let html = '<table><thead><tr><th>choque</th>' + cols.map(k => `<th>peso en y<sub>t${k ? '−' + k : ''}</sub></th>`).join('') + '</tr></thead><tbody>';
      for (let j = 0; j <= 2 * Q + 1; j++) html += `<tr><td>ε<sub>t${j ? '−' + j : ''}</sub></td>` + cols.map(k => { const w = pesos(j, k); return `<td>${w === null ? '—' : num(w)}</td>`; }).join('') + '</tr>';
      html += '</tbody></table>';
      const cuentas = cols.map(k => {
        const pares = [];
        for (let i = 0; i + k <= Q; i++) pares.push(`${num(ma[i + k])}·${num(ma[i])}`);
        return `γ(${k}) = ${pares.length ? pares.join(' + ') : '0'} = <b>${fmt(g[k] === undefined ? 0 : g[k], 4)}</b>`;
      });
      tab.innerHTML = html + `<p style="margin:8px 4px;line-height:1.7">${cuentas.join('<br>')}<br><i>(con σ² = 1; multiplica cada columna de y<sub>t</sub> por la de y<sub>t−k</sub> renglón por renglón y suma)</i></p>`;
    }
    dibujar();
  });

  R('w2-theta-inv', c => {
    const ctr = lienzo(c);
    const s = slider(ctr, { etiqueta: 'θ (invertible)', min: -0.95, max: 0.95, paso: 0.05, valor: 0.5, fmt: num }, dibujar);
    const f = fila(c), g1 = lamina(f), g2 = lamina(f), lec = lectura(c);
    const ex = extra(c, 'Vista extra: los pesos π_j de la forma AR(∞) de cada gemelo'), f2 = fila(ex), gx = lamina(f2), tab = el('div', { class: 'w-tabla' });
    f2.append(tab);
    function dibujar() {
      let t = s.get();
      if (Math.abs(t) < 0.05) { t = 0.05; s.set(0.05); }
      const tw = 1 / t, ra = T2.acfTeorica([1], [1, t], 5), rb = T2.acfTeorica([1], [1, tw], 5);
      graf(g1, tallos(rango(6), ra, PAL.lav).concat([teoricoTr(rb, 0, `gemelo θ = ${fmt(tw, 3)}`)]), layoutACF(`ACF de θ = ${num(t)} (tallos) y de 1/θ = ${fmt(tw, 3)} (rombos)`, { height: 280, xaxis: { range: [-0.5, 5.5] } }));
      const T = 30, ks = rango(T + 1), eA = ks.map(k => Math.max(1e-10, Math.pow(Math.abs(t), k))), eB = ks.map(k => Math.min(1e10, Math.pow(Math.abs(tw), k)));
      graf(g2, [lin(ks, eA, PAL.menta, `θ = ${num(t)} (invertible)`, { mode: 'lines+markers', marker: { size: 4 } }), lin(ks, eB, PAL.rosa, `θ = ${fmt(tw, 3)} (no invertible)`, { mode: 'lines+markers', marker: { size: 4 } })],
        { height: 280, title: { text: 'Error al recuperar los choques |ε̂_t − ε_t|' }, xaxis: { title: { text: 't' } }, yaxis: { type: 'log', exponentformat: 'power', title: { text: 'escala logarítmica' } } });
      lec.innerHTML = `ρ(1) = ${fmt(ra[1], 4)} con θ = ${num(t)} y también con θ = ${fmt(tw, 4)}. Al recuperar los choques con un arranque equivocado, el error se multiplica por −θ en cada periodo: ` +
        `con θ = ${num(t)} después de 10 periodos queda ${fmt(Math.pow(Math.abs(t), 10), 5)} del error inicial; con el gemelo crece a ${fmt(Math.pow(Math.abs(tw), 10), 1)} veces.`;
      const J = 10, pa = rango(J + 1).map(j => Math.pow(-t, j)), pb = rango(J + 1).map(j => Math.pow(-tw, j));
      graf(gx, tallos(rango(J + 1), pa, PAL.menta), { height: 250, title: { text: `π<sub>j</sub> = (−θ)<sup>j</sup> con θ = ${num(t)}` }, xaxis: { title: { text: 'j' } } });
      tab.innerHTML = tablaHTML(['j', `π<sub>j</sub> (θ = ${num(t)})`, `π<sub>j</sub> (θ = ${fmt(tw, 2)})`], rango(J + 1).map(j => [j, fmt(pa[j], 4), fmt(pb[j], 2)]));
    }
    dibujar();
  });

  /* ======================= 4 · Modelos ARMA ======================= */
  const MODELOS_IMP = {
    ar1: { nombre: 'AR(1): φ = 0.8', ar: [1, -0.8], ma: [1] }, ar1n: { nombre: 'AR(1): φ = −0.6', ar: [1, 0.6], ma: [1] },
    ar2c: { nombre: 'AR(2): φ = (1, −0.5)', ar: [1, -1, 0.5], ma: [1] }, ma2: { nombre: 'MA(2): θ = (0.5, 0.4)', ar: [1], ma: [1, 0.5, 0.4] },
    arma: { nombre: 'ARMA(1,1): φ = 0.7, θ = 0.4', ar: [1, -0.7], ma: [1, 0.4] },
    arima: { nombre: 'ARIMA(1,1,0): φ = 0.4', ar: [1, -1.4, 0.4], ma: [1], integrado: true },
    paseo: { nombre: 'Paseo aleatorio', ar: [1, -1], ma: [1], integrado: true }
  };
  R('w2-impulso', c => {
    const ctr = lienzo(c);
    let semilla = 12;
    const m = seleccion(ctr, { etiqueta: 'Modelo', valor: 'arma', opciones: Object.keys(MODELOS_IMP).map(k => [k, MODELOS_IMP[k].nombre]) }, dibujar);
    boton(ctr, 'Otros choques', () => { semilla += 5; dibujar(); });
    const g1 = lamina(c), g2 = lamina(c), lec = lectura(c);
    const ex = extra(c, 'Vista extra: la tabla de la respuesta al impulso'), tab = el('div', { class: 'w-tabla' });
    ex.append(tab);
    function dibujar() {
      const M = MODELOS_IMP[m.get()], J = 30, psi = T2.psi(M.ar, M.ma, J + 1), acum = TS.cumsum(psi);
      graf(g1, tallos(rango(J + 1), psi, PAL.lav).concat([lin(rango(J + 1), acum, PAL.rosa, 'acumulado', { line: { color: PAL.rosa, width: 2, dash: 'dot' } })]),
        { height: 270, title: { text: 'Respuesta a un choque unitario: ψ<sub>j</sub> (tallos) y efecto acumulado (rosa)' }, xaxis: { title: { text: 'j (periodos después del choque)' } }, showlegend: false });
      const n = 80, e = TS.rng(semilla).normales(n), e2 = e.slice();
      e2[29] += 3;
      const gen = eps => T2.simularARMA(M.ar, M.ma, n, { eps, quemado: 0 }).y;
      const y1 = gen(e), y2 = gen(e2), d = y2.map((v, i) => v - y1[i]);
      const A = apilado([{ x: rango(n, 1), y: y1, color: PAL.lav, nombre: 'sin el choque' }, { x: rango(n, 1), y: d, color: PAL.dur, nombre: 'diferencia' }], 380);
      A.tr.splice(1, 0, { x: rango(n, 1), y: y2, mode: 'lines', line: { color: PAL.rosa, width: 1.7, dash: 'dot' }, name: 'con +3 en t = 30', xaxis: 'x', yaxis: 'y' });
      A.L.shapes = [{ type: 'line', x0: 30, x1: 30, yref: 'paper', y0: 0, y1: 1, line: { color: 'rgba(224,112,159,.4)', dash: 'dash' } }];
      A.L.showlegend = true; A.L.legend = { orientation: 'h', y: 1.12, x: 0 };
      graf(g2, A.tr, A.L);
      const lp = M.integrado ? null : M.ma.reduce((s, v) => s + v, 0) / M.ar.reduce((s, v) => s + v, 0);
      lec.className = 'w-lectura ' + (M.integrado ? 'aviso' : 'ok');
      lec.innerHTML = M.integrado
        ? `Los pesos ψ no se apagan (ψ<sub>30</sub> = ${fmt(psi[30], 3)}): el choque de +3 deja la serie <b>permanentemente</b> desplazada en ≈ ${fmt(3 * psi[30], 2)}. Un modelo integrado nunca «olvida».`
        : `Los pesos se apagan (ψ<sub>10</sub> = ${fmt(psi[10], 4)}): el efecto es <b>transitorio</b>. El efecto acumulado converge a θ(1)/φ(1) = ${fmt(lp, 3)}. Abajo, la diferencia entre trayectorias es 3·ψ<sub>t−30</sub>.`;
      tab.innerHTML = tablaHTML(['j', 'ψ<sub>j</sub>', 'acumulado Σψ', '3·ψ<sub>j</sub> (diferencia en t = 30 + j)'], rango(13).map(j => [j, fmt(psi[j], 4), fmt(acum[j], 4), fmt(3 * psi[j], 4)]));
    }
    dibujar();
  });

  R('w2-arma11', c => {
    const ctr = lienzo(c);
    let semilla = 9;
    const sp = slider(ctr, { etiqueta: 'φ', min: -0.95, max: 0.95, paso: 0.05, valor: 0.7, fmt: num }, dibujar);
    const st = slider(ctr, { etiqueta: 'θ', min: -0.95, max: 0.95, paso: 0.05, valor: 0.4, fmt: num }, dibujar);
    boton(ctr, 'Otra trayectoria', () => { semilla += 3; dibujar(); });
    const f = fila(c), gA = lamina(f), gP = lamina(f), f2 = fila(c), gR = lamina(f2), gS = lamina(f2), lec = lectura(c);
    const ex = extra(c, 'Vista extra: ρ(1) con tus números y la tabla de la ACF'), cuenta = el('div', { class: 'w-lectura' }), tab = el('div', { class: 'w-tabla' });
    ex.append(cuenta, tab);
    function dibujar() {
      const p = sp.get(), t = st.get(), K = 12, ar = [1, -p], ma = [1, t];
      const ra = T2.acfTeorica(ar, ma, K), rar = T2.acfTeorica(ar, [1], K), rma = T2.acfTeorica([1], ma, K);
      const pa = T2.pacfTeorica(ar, ma, K), par = T2.pacfTeorica(ar, [1], K), pma = T2.pacfTeorica([1], ma, K);
      const mk = (v, color, nombre, sim) => ({ x: rango(K, 1), y: v.slice(1), mode: 'markers', marker: { color, size: 8, symbol: sim }, name: nombre });
      graf(gA, tallos(rango(K, 1), ra.slice(1), PAL.lav).concat([mk(rar, PAL.gris, 'AR(1)', 'circle-open'), mk(rma, PAL.menta, 'MA(1)', 'diamond')]), layoutACF('ACF: ARMA(1,1) (tallos), AR(1) y MA(1)', { height: 270, showlegend: true, legend: { y: -0.3 } }));
      graf(gP, tallos(rango(K, 1), pa.slice(1), PAL.lav).concat([mk(par, PAL.gris, 'AR(1)', 'circle-open'), mk(pma, PAL.menta, 'MA(1)', 'diamond')]), layoutACF('PACF: ARMA(1,1) (tallos), AR(1) y MA(1)', { height: 270, showlegend: true, legend: { y: -0.3 } }));
      planoComplejo(gR, [{ nombre: 'raíz AR: 1/φ', raices: Math.abs(p) > 1e-9 ? T2.raices(ar) : [], color: PAL.lav, tam: 13 }, { nombre: 'raíz MA: −1/θ', raices: Math.abs(t) > 1e-9 ? T2.raices(ma) : [], color: PAL.menta, simbolo: 'diamond', tam: 12 }], 'Raíces de φ(z) y θ(z)', { height: 300 });
      const y = T2.simularARMA(ar, ma, 150, { semilla, quemado: 300 }).y;
      graf(gS, [lin(rango(150, 1), y, PAL.lav, 'y', { line: { width: 1.2, color: PAL.lav } })], { height: 300, title: { text: 'Una trayectoria simulada' }, showlegend: false });
      const cancela = Math.abs(p + t) < 0.101;
      lec.className = 'w-lectura ' + (cancela ? 'aviso' : '');
      lec.innerHTML = `ρ(1) = ${fmt(ra[1], 4)} (el AR(1) daría ${fmt(p, 2)} y el MA(1) ${fmt(rma[1], 4)}); después decae como ${num(p)}<sup>k</sup>. ψ<sub>1</sub> = φ + θ = ${num(p + t)}. ` +
        (cancela ? '⚠️ <b>Las raíces casi coinciden</b>: los dos polinomios se cancelan y la serie es casi ruido blanco.' : '');
      const den = 1 + 2 * p * t + t * t, nu = (p + t) * (1 + p * t);
      cuenta.innerHTML = tex(`\\rho(1) = \\frac{(\\phi + \\theta)(1 + \\phi\\theta)}{1 + 2\\phi\\theta + \\theta^2} = \\frac{(${num(p)} ${sgn(t)})(1 ${sgn(p * t)})}{1 ${sgn(2 * p * t)} ${sgn(t * t)}} = \\frac{${fmt(nu, 4)}}{${fmt(den, 4)}} = ${fmt(nu / den, 4)}`, true);
      tab.innerHTML = tablaHTML(['k', 'ARMA(1,1)', 'AR(1)', 'MA(1)', 'PACF ARMA(1,1)'], rango(7, 1).map(k => [k, fmt(ra[k], 4), fmt(rar[k], 4), fmt(rma[k], 4), fmt(pa[k], 4)]));
    }
    dibujar();
  });

  // ---- formato al estilo numpy
  function npArr(v, d = 4) {
    const s = v.map(x => { let t = (Math.abs(x) < 0.5 * 10 ** -d ? 0 : x).toFixed(d).replace(/0+$/, ''); if (t.endsWith('.')) t += ''; return t === '-0.' ? '0.' : t; });
    const w = Math.max(...s.map(x => x.length));
    return '[' + s.map(x => x.padStart(w)).join(' ') + ']';
  }
  const npC = zs => '[' + zs.map(z => `${fmt(z.re, 4)}${z.im < 0 ? '-' : '+'}${fmt(Math.abs(z.im), 4)}j`).join(', ') + ']';
  U.u2np = { npArr, npC };
  R('py2-armaprocess', c => {
    const ctr = lienzo(c);
    let activo = 'ar';
    const f1 = slider(ctr, { etiqueta: 'φ₁ (modelo)', min: -1.5, max: 1.5, paso: 0.05, valor: 0.5, fmt: num }, () => { activo = 'ar'; dibujar(); });
    const f2 = slider(ctr, { etiqueta: 'φ₂ (modelo)', min: -1, max: 1, paso: 0.05, valor: 0.3, fmt: num }, () => { activo = 'ar'; dibujar(); });
    const t1 = slider(ctr, { etiqueta: 'θ₁ (modelo)', min: -1.5, max: 1.5, paso: 0.05, valor: 0, fmt: num }, () => { activo = 'ma'; dibujar(); });
    const t2 = slider(ctr, { etiqueta: 'θ₂ (modelo)', min: -1, max: 1, paso: 0.05, valor: 0, fmt: num }, () => { activo = 'ma'; dibujar(); });
    const ns = slider(ctr, { etiqueta: 'nsample', min: 50, max: 1000, paso: 50, valor: 300 }, () => { activo = 'nsample'; dibujar(); });
    const bi = segmentado(ctr, { etiqueta: 'burnin', valor: '200', opciones: [['0', '0'], ['50', '50'], ['200', '200'], ['500', '500']] }, () => { activo = 'burnin'; dibujar(); });
    const sc = slider(ctr, { etiqueta: 'scale (σ)', min: 0.5, max: 3, paso: 0.5, valor: 1, fmt: num }, () => { activo = 'scale'; dibujar(); });
    const lg = slider(ctr, { etiqueta: 'lags', min: 4, max: 12, paso: 1, valor: 6 }, () => { activo = 'lags'; dibujar(); });
    const pc = panelCodigo(c), g = lamina(c), lec = lectura(c);
    const params = panelParametros(c, [
      { nombre: 'ar', que: 'Coeficientes del polinomio φ(L) = 1 − φ₁L − φ₂L²: el primero es 1 y los demás con el signo <b>cambiado</b>.', rec: 'Escribe <code>[1, -φ1, -φ2]</code>. Si el modelo es AR(2) con φ = (0.5, 0.3): <code>[1, -0.5, -0.3]</code>.' },
      { nombre: 'ma', que: 'Coeficientes de θ(L) = 1 + θ₁L + θ₂L²: el signo se conserva.', rec: '<code>[1, θ1, θ2]</code>; <code>[1]</code> si no hay parte MA.' },
      { nombre: 'nsample', que: 'Cuántos datos genera <code>generate_sample</code>.', rec: '200–500 para ver bien ACF y PACF.' },
      { nombre: 'burnin', que: 'Datos iniciales que se generan y se descartan para olvidar el arranque en cero.', rec: '<b>≥ 200</b>; más si las raíces están cerca de 1.' },
      { nombre: 'scale', que: 'Desviación estándar σ de los choques.', rec: '1 (la forma de la ACF no depende de σ).' },
      { nombre: 'lags', que: 'Cuántos valores devuelven <code>acf</code>, <code>pacf</code> y <code>arma2ma</code> (empezando en el rezago 0).', rec: '10–20 para identificar; aquí pocos para leer la salida.' }
    ]);
    function dibujar() {
      const ar = T2.polRecortar([1, -f1.get(), -f2.get()]), ma = T2.polRecortar([1, t1.get(), t2.get()]), L = lg.get();
      const est = T2.esEstacionario(ar), inv = T2.esInvertible(ma), argsP = { ar: '[' + ar.map(num).join(', ') + ']', ma: '[' + ma.map(num).join(', ') + ']', nsample: ns.get(), burnin: +bi.get(), scale: num(sc.get()), lags: L };
      pc.codigo(codigoPython(`from statsmodels.tsa.arima_process import ArmaProcess\nimport numpy as np\n\nar = np.array({ar})      # φ(L): 1, −φ1, −φ2\nma = np.array({ma})      # θ(L): 1, θ1, θ2\nproceso = ArmaProcess(ar, ma)\nprint("isstationary:", proceso.isstationary)\nprint("isinvertible:", proceso.isinvertible)\nprint("arroots:", np.round(proceso.arroots, 4))\nprint("maroots:", np.round(proceso.maroots, 4))\nprint("acf :", np.round(proceso.acf(lags={lags}), 4))\nprint("pacf:", np.round(proceso.pacf(lags={lags}), 4))\nprint("arma2ma:", np.round(proceso.arma2ma(lags={lags}), 4))\ny = proceso.generate_sample(nsample={nsample}, scale={scale}, burnin={burnin})`, argsP, activo));
      const lineas = [`isstationary: ${est ? 'True' : 'False'}`, `isinvertible: ${inv ? 'True' : 'False'}`, `arroots: ${ar.length > 1 ? npC(T2.raices(ar)) : '[]'}`, `maroots: ${ma.length > 1 ? npC(T2.raices(ma)) : '[]'}`];
      if (est) { lineas.push('acf : ' + npArr(T2.acfTeorica(ar, ma, L - 1))); lineas.push('pacf: ' + npArr(T2.pacfTeorica(ar, ma, L - 1))); }
      else { lineas.push('acf : (proceso no estacionario: la ACF teórica no existe)'); lineas.push('pacf: (proceso no estacionario)'); }
      lineas.push('arma2ma: ' + npArr(T2.psi(ar, ma, L)));
      pc.salida(lineas.join('\n'));
      const y = T2.simularARMA(ar, ma, ns.get(), { semilla: 1, sigma: sc.get(), quemado: +bi.get() }).y.map(v => Math.max(-1e6, Math.min(1e6, v)));
      graf(g, [lin(rango(y.length), y, est ? PAL.lav : PAL.dur, 'y', { line: { width: 1.2, color: est ? PAL.lav : PAL.dur } })], { height: 250, title: { text: `generate_sample(nsample=${ns.get()}, burnin=${bi.get()})` }, showlegend: false });
      params(argsP, activo);
      lec.className = 'w-lectura ' + (est && inv ? 'ok' : 'aviso');
      lec.innerHTML = (est ? 'Estacionario' : '<b>No estacionario</b>: una raíz AR está dentro del círculo o sobre él') + ' · ' + (inv ? 'invertible' : '<b>no invertible</b>') + '. ' +
        (+bi.get() === 0 && est ? '💡 Con burnin = 0 la muestra arranca en 0: fíjate en los primeros valores.' : '') + ' <i>La muestra se genera en tu navegador; con numpy los números exactos serán otros.</i>';
    }
    dibujar();
  });

  /* Las demás secciones se agregan abajo */
  U.u2 = { T2, AP, FECHAS_AP, LOGAP, f3, f4, sgn, lin, vline, hline, choques, histograma, curvaNormal, polTexto, DATOS };
})();
