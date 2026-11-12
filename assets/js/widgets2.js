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
  const pq = p => (p < 1e-4 ? 'p < 0.0001' : 'p = ' + fp(p));
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
        `Ljung–Box con h = 10: Q = ${f3(lb.Q)}, <b>${pq(lb.p)}</b> → ${lb.p > 0.05 ? 'no hay evidencia de autocorrelación' : 'hay autocorrelación: <b>no</b> es ruido blanco'}. ` +
        (rb ? '' : '💡 El AR(1) tiene memoria: la ACF decae como 0.6<sup>k</sup>.') + (tipo.get() === 't3' ? ' 💡 Colas pesadas: la curtosis es mucho mayor que 3, pero sigue siendo ruido blanco.' : '');
      const x2 = x.map(v => v * v), r2 = TS.acf(x2, 20), lb2 = TS.ljungBox(x2, 10);
      graf(gx, trazasACF(r2, N, { color: PAL.cel }), layoutACF('ACF de la serie al cuadrado', { height: 220 }));
      lx.innerHTML = `Ljung–Box sobre los cuadrados (h = 10): <b>${pq(lb2.p)}</b>. ` + (tipo.get() === 'arch' ? 'El ARCH es ruido blanco en los valores, pero sus cuadrados están correlacionados: <b>la volatilidad tiene memoria</b>.' : tipo.get() === 'ar' ? 'Los cuadrados heredan la memoria del AR(1).' : 'Los cuadrados tampoco tienen memoria: este ruido blanco es además independiente.');
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
    if (!I.raices.length) return { I, texto: 'con φ₁ = φ₂ = 0 el polinomio es 1: no hay raíces y el proceso es <b>ruido blanco</b> (ACF y PACF valen 0 en todo rezago k ≥ 1).' };
    const l = I.raices.map(z => 1 / z.re), dom = l.reduce((a, b) => Math.abs(b) > Math.abs(a) ? b : a);
    if (I.raices.length === 1) return { I, texto: `con φ₂ = 0 es un <b>AR(1)</b>: una sola raíz real, la ACF decae ${dom > 0 ? 'sin cambiar de signo' : 'alternando de signo'} como ${fmt(dom, 3)}ᵏ.` };
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

  /* ======================= 5 · Identificación Box–Jenkins ======================= */
  const RESP_CASOS = {
    A: { modelo: 'AR(2) con φ = (0.5, 0.3)', lectura: 'La ACF decae poco a poco y la PACF tiene dos barras grandes y luego se corta: AR(2).' },
    B: { modelo: 'MA(1) con θ = 0.7', lectura: 'La ACF tiene un solo pico y luego se corta; la PACF decae alternando signo: MA(1).' },
    C: { modelo: 'ARMA(1,1) con φ = 0.8 y θ = −0.4', lectura: 'Las dos decaen, aunque la PACF se ve casi cortada en 2. Es ambigua entre AR(2) y ARMA(1,1): el AIC prefiere el ARMA(1,1).' },
    D: { modelo: 'Paseo aleatorio: ARIMA(0,1,0)', lectura: 'En niveles la ACF decae casi en línea recta (raíz unitaria). Diferenciada, todo queda dentro de la banda: ruido blanco.' }
  };
  function tablaAIC(y, tab) {
    const filas = [];
    for (let p = 0; p <= 2; p++) for (let q = 0; q <= 2; q++) {
      const a = T2.ajustarARMA(y, p, q, { desde: 2 });
      filas.push({ m: `ARMA(${p},${q})`, aic: a.aic, bic: a.bic, k: a.k });
    }
    const min = Math.min(...filas.map(f => f.aic));
    filas.sort((a, b) => a.aic - b.aic);
    tab.innerHTML = tablaHTML(['modelo', 'parámetros k', 'AIC (CSS)', 'BIC (CSS)'], filas.map(f => [f.m, f.k, fmt(f.aic, 2), fmt(f.bic, 2)]), filas.map(f => f.aic === min ? 'elegido' : '')) +
      '<p style="margin:6px 4px;font-size:.88rem">Estimados por mínimos cuadrados condicionales desde t = 3 para que todos usen las mismas observaciones; los valores difieren un poco de los de <code>SARIMAX</code> (máxima verosimilitud exacta), pero el orden suele coincidir.</p>';
  }
  R('w2-identificar', c => {
    const D = DATOS.casos_identificacion;
    if (!D) { c.textContent = 'Faltan los datos de los casos.'; return; }
    const ctr = lienzo(c);
    let revelado = false;
    const s = segmentado(ctr, { etiqueta: 'Serie', valor: 'A', opciones: [['A', 'A'], ['B', 'B'], ['C', 'C'], ['D', 'D']] }, () => { revelado = false; dibujar(); });
    const dif = casilla(ctr, 'Diferenciar la serie D', false, dibujar);
    boton(ctr, 'Revelar el modelo', () => { revelado = true; dibujar(); });
    const g1 = lamina(c), f = fila(c), gA = lamina(f), gP = lamina(f), lec = lectura(c);
    const ex = extra(c, 'Vista extra: AIC y BIC de los nueve ARMA(p, q) con p, q ≤ 2'), tab = el('div', { class: 'w-tabla' });
    ex.append(tab);
    function dibujar() {
      const k = s.get(), esD = k === 'D';
      dif.mostrar(esD);
      let y = D[k];
      const usaDif = esD && dif.get();
      if (usaDif) y = TS.diff(y);
      const N = y.length;
      graf(g1, [lin(rango(N, 1), y, PAL.lav, 'serie', { line: { width: 1.2, color: PAL.lav } })], { height: 220, title: { text: `Serie ${k}${usaDif ? ' diferenciada' : ''}` }, showlegend: false });
      graf(gA, trazasACF(TS.acf(y, 20), N), layoutACF('ACF', { height: 260 }));
      graf(gP, trazasACF(TS.pacf(y, 20), N, { color: PAL.cel }), layoutACF('PACF', { height: 260 }));
      lec.className = 'w-lectura ' + (revelado ? 'ok' : '');
      lec.innerHTML = revelado ? `<b>${RESP_CASOS[k].modelo}.</b> ${RESP_CASOS[k].lectura}` : 'Antes de revelar: ¿la ACF se corta o decae? ¿Y la PACF? ¿Hace falta diferenciar?';
      tablaAIC(usaDif || !esD ? y : TS.diff(y), tab);
    }
    dibujar();
  });

  R('w2-adivina', c => {
    const ctr = lienzo(c), OPC = [['rb', 'Ruido blanco'], ['ar1', 'AR(1)'], ['ar2', 'AR(2)'], ['ma1', 'MA(1)'], ['ma2', 'MA(2)'], ['arma', 'ARMA(1,1)'], ['paseo', 'Paseo aleatorio']];
    const n = slider(ctr, { etiqueta: 'n', min: 100, max: 1000, paso: 50, valor: 300 }, () => nueva());
    boton(ctr, 'Nueva serie', () => nueva());
    const marcador = el('span', { class: 'w-marcador' });
    ctr.append(marcador);
    const g1 = lamina(c), f = fila(c), gA = lamina(f), gP = lamina(f), juego = el('div', { class: 'w-juego' }), lec = lectura(c);
    c.append(juego);
    let ronda = 0, aciertos = 0, intentos = 0, actual = null, respondido = false;
    const r = TS.rng(20261107);
    const ent = (a, b) => a + (b - a) * r.unif(), sg = () => (r.unif() < 0.5 ? -1 : 1);
    function generar() {
      const tipo = OPC[Math.floor(r.unif() * OPC.length)][0];
      let ar = [1], ma = [1], txt = '', pista = '';
      if (tipo === 'ar1') { const p = sg() * ent(0.5, 0.85); ar = [1, -p]; txt = `φ = ${fmt(p, 2)}`; pista = `la PACF se corta en 1 y la ACF decae${p < 0 ? ' alternando signo' : ''}`; }
      if (tipo === 'ar2') { let p1, p2; do { p1 = ent(-1.2, 1.2); p2 = ent(-0.7, 0.6); } while (!(p1 + p2 < 0.9 && p2 - p1 < 0.9 && Math.abs(p2) > 0.3)); ar = [1, -p1, -p2]; txt = `φ = (${fmt(p1, 2)}, ${fmt(p2, 2)})`; pista = 'la PACF tiene dos barras y se corta; la ACF decae (a veces como onda)'; }
      if (tipo === 'ma1') { const t = sg() * ent(0.5, 0.9); ma = [1, t]; txt = `θ = ${fmt(t, 2)}`; pista = 'la ACF tiene un solo pico y se corta; la PACF decae'; }
      if (tipo === 'ma2') { const t1 = sg() * ent(0.4, 0.8), t2 = sg() * ent(0.4, 0.7); ma = [1, t1, t2]; if (!T2.esInvertible(ma)) ma = [1, t1 * 0.6, t2 * 0.6]; txt = `θ = (${fmt(ma[1], 2)}, ${fmt(ma[2], 2)})`; pista = 'la ACF tiene dos barras y se corta; la PACF decae'; }
      if (tipo === 'arma') { const p = sg() * ent(0.5, 0.85); let t = sg() * ent(0.4, 0.8); if (Math.abs(p + t) < 0.4) t = -t; ma = [1, t]; ar = [1, -p]; txt = `φ = ${fmt(p, 2)}, θ = ${fmt(t, 2)}`; pista = 'las dos decaen; ninguna se corta de golpe'; }
      if (tipo === 'paseo') { ar = [1, -1]; txt = 'ψ_j = 1 para todo j'; pista = 'la ACF decae casi en línea recta desde valores cercanos a 1'; }
      if (tipo === 'rb') { txt = 'sin memoria'; pista = 'nada sale de la banda (salvo alguna falsa alarma)'; }
      const y = tipo === 'paseo' ? TS.cumsum(r.normales(n.get())) : T2.simularARMA(ar, ma, n.get(), { semilla: 1000 + ronda * 7, quemado: 300 }).y;
      return { tipo, y, txt, pista };
    }
    function nueva() {
      ronda++; respondido = false; actual = generar();
      const y = actual.y, N = y.length;
      graf(g1, [lin(rango(N, 1), y, PAL.lav, 'serie', { line: { width: 1.2, color: PAL.lav } })], { height: 220, title: { text: `Ronda ${ronda}: ¿qué modelo es?` }, showlegend: false });
      graf(gA, trazasACF(TS.acf(y, 20), N), layoutACF('ACF', { height: 250 }));
      graf(gP, trazasACF(TS.pacf(y, 20), N, { color: PAL.cel }), layoutACF('PACF', { height: 250 }));
      juego.innerHTML = '';
      OPC.forEach(([k, t]) => { const b = el('button', { type: 'button' }, t); b.addEventListener('click', () => responder(k, b)); juego.append(b); });
      lec.className = 'w-lectura'; lec.innerHTML = 'Elige una opción.';
      marcador.textContent = `Aciertos: ${aciertos} / ${intentos}`;
    }
    function responder(k, b) {
      if (respondido) return;
      respondido = true; intentos++;
      const ok = k === actual.tipo;
      if (ok) aciertos++;
      b.classList.add(ok ? 'bien' : 'mal');
      [...juego.children].forEach((x, i) => { if (OPC[i][0] === actual.tipo) x.classList.add('bien'); });
      const nombre = OPC.find(o => o[0] === actual.tipo)[1];
      lec.className = 'w-lectura ' + (ok ? 'ok' : 'mal');
      lec.innerHTML = `${ok ? '✓ ¡Correcto!' : '✗ No.'} Era <b>${nombre}</b> (${actual.txt}). La pista: ${actual.pista}.`;
      marcador.textContent = `Aciertos: ${aciertos} / ${intentos}`;
    }
    nueva();
  });

  /* ======================= 6 · Transformaciones ======================= */
  const ANIOS_AP = rango(12).map(i => 1949 + i);
  const LAM_AP = T2.boxcoxMLE(AP);
  function porAnio(z) {
    return ANIOS_AP.map((a, i) => { const v = z.slice(12 * i, 12 * i + 12); return { anio: a, media: TS.media(v), sd: TS.desv(v, 1) }; });
  }
  R('w2-boxcox', c => {
    const ctr = lienzo(c);
    const s = slider(ctr, { etiqueta: 'λ', min: -1, max: 1.5, paso: 0.01, valor: 1, fmt: v => fmt(v, 2) }, dibujar);
    boton(ctr, `Usar λ̂ = ${fmt(LAM_AP, 3)}`, () => { s.set(Math.round(LAM_AP * 100) / 100); dibujar(); });
    boton(ctr, 'Logaritmo (λ = 0)', () => { s.set(0); dibujar(); }, 'sec');
    const g1 = lamina(c), f = fila(c), g2 = lamina(f), g3 = lamina(f), lec = lectura(c);
    const ex = extra(c, 'Vista extra: media y desviación estándar por año en la escala transformada'), tab = el('div', { class: 'w-tabla' });
    ex.append(tab);
    const lams = rango(126).map(i => -1 + i * 0.02), llfs = lams.map(l => T2.boxcoxLLF(AP, l));
    function dibujar() {
      const l = s.get(), z = T2.boxcox(AP, l), A = porAnio(z);
      graf(g1, [lin(FECHAS_AP, z, PAL.lav, 'transformada', { line: { color: PAL.lav, width: 1.6 } })], { height: 240, title: { text: `AirPassengers con Box–Cox, λ = ${fmt(l, 2)}` }, showlegend: false });
      const xs = A.map(a => a.media), ys = A.map(a => a.sd), reg = TS.ols(xs.map(v => [1, v]), ys), b = reg.beta[1];
      const x0 = Math.min(...xs), x1 = Math.max(...xs);
      graf(g2, [Object.assign(dispersion(xs, ys, PAL.dur, A.map(a => a.anio)), { mode: 'markers+text', textposition: 'top center', textfont: { size: 9, color: '#8a84a8' } }),
        lin([x0, x1], [reg.beta[0] + b * x0, reg.beta[0] + b * x1], PAL.rosa, 'recta', { line: { color: PAL.rosa, dash: 'dash', width: 2 } })],
      { height: 300, title: { text: 'Desviación estándar de cada año vs su media' }, showlegend: false, xaxis: { title: { text: 'media del año' } }, yaxis: { title: { text: 'desv. estándar del año' }, rangemode: 'tozero' } });
      graf(g3, [lin(lams, llfs, PAL.menta, 'ℓ(λ)'), { x: [LAM_AP], y: [T2.boxcoxLLF(AP, LAM_AP)], mode: 'markers', marker: { symbol: 'diamond', size: 12, color: PAL.lav }, name: 'máximo' },
        { x: [l], y: [T2.boxcoxLLF(AP, l)], mode: 'markers', marker: { size: 11, color: PAL.rosa }, name: 'tu λ' }],
      { height: 300, title: { text: 'Log-verosimilitud de Box–Cox' }, showlegend: false, xaxis: { title: { text: 'λ' } }, yaxis: { title: { text: 'ℓ(λ)' } } });
      const razon = A[11].sd / A[0].sd;
      lec.className = 'w-lectura ' + (razon < 1.6 && razon > 0.7 ? 'ok' : '');
      lec.innerHTML = `La variabilidad de 1960 es <b>${fmt(razon, 2)} veces</b> la de 1949 (con λ = 1 es ${fmt(77.7 / 13.7, 1)} veces). ` +
        `ℓ(λ) = ${fmt(T2.boxcoxLLF(AP, l), 2)} contra el máximo ${fmt(T2.boxcoxLLF(AP, LAM_AP), 2)} en λ̂ = ${fmt(LAM_AP, 3)}. ` +
        (razon < 1.6 && razon > 0.7 ? 'La varianza ya casi no depende del nivel.' : razon >= 1.6 ? 'Todavía crece con el nivel: baja λ.' : 'Ahora la variabilidad <b>decrece</b> con el nivel: te pasaste, sube λ.');
      tab.innerHTML = tablaHTML(['año', 'media', 'desv. estándar', 'desv. / desv. de 1949'], A.map(a => [a.anio, fmt(a.media, 4), fmt(a.sd, 4), fmt(a.sd / A[0].sd, 3)]));
    }
    dibujar();
  });

  R('py2-boxcox', c => {
    const ctr = lienzo(c);
    let activo = 'modo';
    const modo = segmentado(ctr, { etiqueta: 'lmbda', valor: 'auto', opciones: [['auto', 'None (estimar)'], ['fijo', 'fijo']] }, () => { activo = 'modo'; dibujar(); });
    const s = slider(ctr, { etiqueta: 'valor fijo de λ', min: -1, max: 1.5, paso: 0.05, valor: 0.5, fmt: num }, () => { activo = 'lam'; dibujar(); });
    const pc = panelCodigo(c), g = lamina(c), lec = lectura(c);
    const params = panelParametros(c, [
      { nombre: 'x', que: 'Los datos; deben ser <b>estrictamente positivos</b>.', rec: 'La serie original (sin diferenciar). Si hay ceros, suma una constante o usa Yeo–Johnson.' },
      { nombre: 'lmbda', que: 'Si es <code>None</code>, estima λ por máxima verosimilitud y devuelve <code>(datos, λ)</code>; si es un número, solo devuelve los datos transformados.', rec: '<code>None</code> para explorar; luego fija un valor redondo cercano (0, 0.5, 1).' },
      { nombre: 'alpha', que: 'Si lo das (con <code>lmbda=None</code>) devuelve además un intervalo de confianza para λ.', rec: '<code>alpha=0.05</code> si quieres saber si λ = 0 es plausible.' }
    ]);
    function dibujar() {
      const auto = modo.get() === 'auto', l = auto ? LAM_AP : s.get();
      s.mostrar(!auto);
      const z = T2.boxcox(AP, l), args = { linea: auto ? 'z, lam = stats.boxcox(datos)          # lmbda=None: estima λ' : `lam = ${num(l)}\nz = stats.boxcox(datos, lmbda=lam)    # λ fijo: devuelve solo los datos` };
      pc.codigo(codigoPython(`from scipy import stats\nfrom scipy.special import inv_boxcox\n\ndatos = serie.values                     # AirPassengers, 144 meses\n{linea}\nprint("λ:", round(lam, 4))\nprint("log-verosimilitud:", round(stats.boxcox_llf(lam, datos), 3))\nprint("primeros transformados:", np.round(z[:4], 4))\nprint("de regreso:", np.round(inv_boxcox(z[:4], lam), 2))`, args, activo === 'modo' || activo === 'lam' ? 'linea' : null));
      pc.salida([`λ: ${fmt(l, 4)}`, `log-verosimilitud: ${fmt(T2.boxcoxLLF(AP, l), 3)}`, `primeros transformados: ${npArr(z.slice(0, 4))}`, `de regreso: ${npArr(T2.invBoxcox(z.slice(0, 4), l), 2)}`].join('\n'));
      graf(g, [lin(FECHAS_AP, z, PAL.lav, 'z', { line: { color: PAL.lav, width: 1.5 } })], { height: 230, title: { text: `stats.boxcox con λ = ${fmt(l, 3)}` }, showlegend: false });
      params({ x: 'serie.values', lmbda: auto ? 'None' : num(l), alpha: '—' }, activo === 'modo' || activo === 'lam' ? 'lmbda' : null);
      lec.innerHTML = auto ? `λ̂ = ${fmt(LAM_AP, 4)}: muy cerca de 0, por eso con AirPassengers se usa el logaritmo.` : `Con λ fijo la diferencia de log-verosimilitud respecto al máximo es ${fmt(T2.boxcoxLLF(AP, LAM_AP) - T2.boxcoxLLF(AP, l), 2)} (más de ~2 ya es una diferencia apreciable).`;
    }
    dibujar();
  });

  const PROC_DIF = {
    rb: { nombre: 'Ruido blanco', gen: s => TS.rng(s).normales(300) },
    ar: { nombre: 'AR(1), φ = 0.6', gen: s => T2.simularARMA([1, -0.6], [1], 300, { semilla: s }).y },
    paseo: { nombre: 'Paseo aleatorio', gen: s => TS.cumsum(TS.rng(s).normales(300)) },
    deriva: { nombre: 'Paseo con deriva 0.2', gen: s => TS.cumsum(TS.rng(s).normales(300).map(v => v + 0.2)) },
    tend: { nombre: 'Tendencia determinística + AR(1)', gen: s => T2.simularARMA([1, -0.5], [1], 300, { semilla: s }).y.map((v, i) => v + 0.05 * i) },
    i2: { nombre: 'Integrada dos veces, I(2)', gen: s => TS.cumsum(TS.cumsum(TS.rng(s).normales(300).map(v => 0.2 * v))) }
  };
  R('w2-sobrediferenciar', c => {
    const ctr = lienzo(c);
    let semilla = 3;
    const pr = seleccion(ctr, { etiqueta: 'Proceso', valor: 'paseo', opciones: Object.keys(PROC_DIF).map(k => [k, PROC_DIF[k].nombre]) }, dibujar);
    const d = segmentado(ctr, { etiqueta: 'Diferencias d', valor: '1', opciones: [['0', '0'], ['1', '1'], ['2', '2']] }, dibujar);
    boton(ctr, 'Otra muestra', () => { semilla += 7; dibujar(); });
    const g1 = lamina(c), f = fila(c), g2 = lamina(f), g3 = lamina(f), lec = lectura(c);
    const ex = extra(c, 'Vista extra: varianza, ρ̂(1) y ADF para cada d'), tab = el('div', { class: 'w-tabla' });
    ex.append(tab);
    function dibujar() {
      const y0 = PROC_DIF[pr.get()].gen(semilla), ys = [y0, TS.diff(y0), TS.diff(TS.diff(y0))], D_ = +d.get(), y = ys[D_];
      graf(g1, [lin(rango(y.length, D_ + 1), y, PAL.lav, 'serie', { line: { color: PAL.lav, width: 1.2 } })], { height: 220, title: { text: `${PROC_DIF[pr.get()].nombre} con d = ${D_}` }, showlegend: false });
      const vars = ys.map(v => TS.varianza(v, 1)), mi = vars.indexOf(Math.min(...vars));
      graf(g2, [{ type: 'bar', x: ['d = 0', 'd = 1', 'd = 2'], y: vars, marker: { color: [0, 1, 2].map(i => i === D_ ? PAL.rosa : i === mi ? PAL.menta : 'rgba(124,105,214,.55)') }, text: vars.map(v => fmt(v, v > 100 ? 0 : 3)), textposition: 'outside', hovertemplate: '%{x}: varianza %{y:.4f}<extra></extra>' }],
        { height: 280, title: { text: 'Varianza según el número de diferencias' }, yaxis: { type: 'log', exponentformat: 'power', title: { text: 'varianza (escala log)' } }, showlegend: false });
      graf(g3, trazasACF(TS.acf(y, 20), y.length), layoutACF(`ACF con d = ${D_}`, { height: 280 }));
      const filas = ys.map((v, i) => {
        const a = TS.adf(v, { regression: 'c' }), r1 = TS.acf(v, 1)[1];
        const diag = r1 < -0.4 ? 'sobrediferenciada' : a.p > 0.05 ? 'no estacionaria' : 'estacionaria';
        return [`d = ${i}`, fmt(vars[i], 4), fmt(r1, 3), fp(a.p), diag];
      });
      tab.innerHTML = tablaHTML(['diferencias', 'varianza', 'ρ̂(1)', 'ADF p', 'diagnóstico'], filas, filas.map((_, i) => i === mi ? 'elegido' : i === D_ ? 'resaltado' : ''));
      const r1 = TS.acf(y, 1)[1];
      lec.className = 'w-lectura ' + (D_ === mi && r1 > -0.4 ? 'ok' : r1 < -0.4 ? 'mal' : 'aviso');
      lec.innerHTML = `Regla de la menor varianza: <b>d = ${mi}</b>. Con d = ${D_}: varianza ${fmt(vars[D_], 4)}, ρ̂(1) = ${fmt(r1, 3)}. ` +
        (r1 < -0.4 ? '⚠️ ρ̂(1) cerca de −0.5: <b>sobrediferenciaste</b>.' : D_ < mi ? 'Todavía le falta diferenciar.' : D_ === mi ? 'Buena elección.' : '') +
        (pr.get() === 'tend' ? ' 💡 Con tendencia determinística, en lugar de diferenciar conviene incluir la tendencia en el modelo.' : '');
    }
    dibujar();
  });

  /* ======================= 7 · ARIMA ======================= */
  const bandaTr = (x, inf, sup, color, nombre) => ({ x: x.concat(x.slice().reverse()), y: sup.concat(inf.slice().reverse()), fill: 'toself', fillcolor: color, line: { width: 0 }, hoverinfo: 'skip', name: nombre, showlegend: !!nombre, mode: 'lines' });
  U.u2banda = bandaTr;
  R('w2-deriva', c => {
    const ctr = lienzo(c);
    let semilla = 15;
    const cc = slider(ctr, { etiqueta: 'deriva c', min: -0.5, max: 0.5, paso: 0.05, valor: 0.2, fmt: num }, dibujar);
    boton(ctr, 'Otra historia', () => { semilla += 4; dibujar(); });
    const g1 = lamina(c), lec = lectura(c);
    const ex = extra(c, 'Vista extra: la banda de 95% de cada modelo'), ctr2 = el('div', { class: 'w-controles' }), g2 = lamina(ex);
    ex.prepend(ctr2);
    const cual = segmentado(ctr2, { etiqueta: 'Banda de', valor: 'b', opciones: [['a', 'AR(1)'], ['b', 'ARIMA(0,1,0)'], ['c', 'con deriva'], ['e', 'ARIMA(0,2,0)']] }, dibujar);
    function dibujar() {
      const n = 80, H = 36, y = TS.cumsum(TS.rng(semilla).normales(n).map(v => v + 0.2)).map(v => v + 20), mu = TS.media(y), dr = cc.get();
      const mods = {
        a: { nombre: 'AR(1) estacionario, φ = 0.9', ar: [1, -0.9], c: mu * 0.1, color: PAL.menta },
        b: { nombre: 'ARIMA(0,1,0) sin constante', ar: [1, -1], c: 0, color: PAL.lav },
        c: { nombre: `ARIMA(0,1,0) con deriva c = ${num(dr)}`, ar: [1, -1], c: dr, color: PAL.rosa },
        d: { nombre: 'ARIMA(1,1,0), φ = 0.5', ar: [1, -1.5, 0.5], c: 0, color: PAL.cel },
        e: { nombre: 'ARIMA(0,2,0)', ar: [1, -2, 1], c: 0, color: PAL.dur }
      };
      const xh = rango(n, 1), xf = rango(H, n + 1), tr = [lin(xh, y, '#45397a', 'historia', { line: { color: '#45397a', width: 1.6 } })];
      const P = {};
      Object.entries(mods).forEach(([k, m]) => { P[k] = T2.pronosticar(y, m.ar, [1], H, { c: m.c, sigma2: 1 }); tr.push(lin([n].concat(xf), [y[n - 1]].concat(P[k].media), m.color, m.nombre, { line: { color: m.color, width: 2.2, dash: k === 'a' ? 'dot' : 'solid' } })); });
      graf(g1, tr, { height: 360, title: { text: 'Funciones de pronóstico desde la misma historia' }, xaxis: { title: { text: 't' } }, legend: { orientation: 'h', y: -0.25 } });
      const k = cual.get(), m = mods[k], p = P[k];
      graf(g2, [lin(xh, y, '#45397a', 'historia', { line: { color: '#45397a', width: 1.4 } }), bandaTr(xf, p.inf, p.sup, 'rgba(124,105,214,.18)', '95%'), lin(xf, p.media, m.color, 'pronóstico', { line: { color: m.color, width: 2.2 } })],
        { height: 300, title: { text: `Banda de 95%: ${m.nombre}` }, showlegend: false });
      lec.innerHTML = `En h = 36: AR(1) → ${fmt(P.a.media[H - 1], 1)} (regresa a la media ${fmt(mu, 1)}) · ARIMA(0,1,0) → ${fmt(P.b.media[H - 1], 1)} (se queda en el último dato) · con deriva → ${fmt(P.c.media[H - 1], 1)} (= ${fmt(y[n - 1], 1)} + 36·${num(dr)}) · ARIMA(0,2,0) → ${fmt(P.e.media[H - 1], 1)} (sigue la última pendiente, ${fmt(y[n - 1] - y[n - 2], 2)} por periodo).`;
    }
    dibujar();
  });

  const MODELOS_PRON = {
    ar1: { nombre: 'AR(1)', usa: ['phi'], hacer: v => ({ ar: [1, -v.phi], ma: [1], c: 0 }) },
    arma: { nombre: 'ARMA(1,1)', usa: ['phi', 'theta'], hacer: v => ({ ar: [1, -v.phi], ma: [1, v.theta], c: 0 }) },
    arima110: { nombre: 'ARIMA(1,1,0)', usa: ['phi'], hacer: v => ({ ar: T2.polMul([1, -v.phi], [1, -1]), ma: [1], c: 0 }) },
    arima011: { nombre: 'ARIMA(0,1,1)', usa: ['theta'], hacer: v => ({ ar: [1, -1], ma: [1, v.theta], c: 0 }) },
    paseo: { nombre: 'Paseo aleatorio', usa: [], hacer: () => ({ ar: [1, -1], ma: [1], c: 0 }) },
    deriva: { nombre: 'Paseo con deriva', usa: ['c'], hacer: v => ({ ar: [1, -1], ma: [1], c: v.c }) }
  };
  R('w2-pronostico', c => {
    const ctr = lienzo(c);
    let semilla = 22;
    const m = seleccion(ctr, { etiqueta: 'Modelo', valor: 'arima110', opciones: Object.keys(MODELOS_PRON).map(k => [k, MODELOS_PRON[k].nombre]) }, dibujar);
    const S = {
      phi: slider(ctr, { etiqueta: 'φ', min: -0.9, max: 0.95, paso: 0.05, valor: 0.4, fmt: num }, dibujar),
      theta: slider(ctr, { etiqueta: 'θ', min: -0.9, max: 0.9, paso: 0.05, valor: -0.5, fmt: num }, dibujar),
      c: slider(ctr, { etiqueta: 'deriva c', min: -0.5, max: 0.5, paso: 0.05, valor: 0.3, fmt: num }, dibujar)
    };
    const sg = slider(ctr, { etiqueta: 'σ', min: 0.5, max: 3, paso: 0.25, valor: 1, fmt: num }, dibujar);
    boton(ctr, 'Otra historia', () => { semilla += 3; dibujar(); });
    const g = lamina(c), lec = lectura(c);
    const ex = extra(c, 'Vista extra: pesos ψ y ancho de la banda para cada h'), tab = el('div', { class: 'w-tabla' });
    ex.append(tab);
    function dibujar() {
      const M = MODELOS_PRON[m.get()];
      Object.entries(S).forEach(([k, s]) => s.mostrar(M.usa.includes(k)));
      const v = { phi: S.phi.get(), theta: S.theta.get(), c: S.c.get() }, P = M.hacer(v), s = sg.get(), n = 80, H = 24;
      const integrado = Math.abs(P.ar.reduce((a, b) => a + b, 0)) < 1e-9;
      let y;
      if (integrado) {
        const arw = T2.polRecortar(P.ar.length > 2 ? [1, -v.phi] : [1]);
        y = TS.cumsum(T2.simularARMA(arw, P.ma, n, { semilla, sigma: s, c: P.c, quemado: 200 }).y).map(x => x + 50);
      } else y = T2.simularARMA(P.ar, P.ma, n, { semilla, sigma: s, quemado: 300 }).y.map(x => x + 50);
      const cAjust = integrado ? P.c : 50 * P.ar.reduce((a, b) => a + b, 0);
      const pr = T2.pronosticar(y, P.ar, P.ma, H, { c: cAjust, sigma2: s * s }), z80 = TS.normppf(0.9);
      const xh = rango(n, 1), xf = rango(H, n + 1), i80 = pr.media.map((mm, i) => mm - z80 * pr.ee[i]), s80 = pr.media.map((mm, i) => mm + z80 * pr.ee[i]);
      graf(g, [lin(xh, y, '#45397a', 'historia', { line: { color: '#45397a', width: 1.5 } }), bandaTr(xf, pr.inf, pr.sup, 'rgba(124,105,214,.14)', '95%'), bandaTr(xf, i80, s80, 'rgba(124,105,214,.28)', '80%'),
        lin([n].concat(xf), [y[n - 1]].concat(pr.media), PAL.rosa, 'pronóstico', { line: { color: PAL.rosa, width: 2.4 } })],
      { height: 340, title: { text: `${M.nombre}: pronóstico a ${H} pasos con bandas de 80% y 95%` }, xaxis: { title: { text: 't' } }, legend: { orientation: 'h', y: -0.22 } });
      const w = h => 1.96 * pr.ee[h - 1];
      lec.innerHTML = `Ancho de la banda de 95% (±): h = 1 → <b>${fmt(w(1), 2)}</b> (= 1.96σ) · h = 12 → <b>${fmt(w(12), 2)}</b> · h = 24 → <b>${fmt(w(24), 2)}</b>. ` +
        (integrado ? 'Modelo integrado: los pesos ψ no se apagan y la banda crece sin límite.' : `Modelo estacionario: la banda se estabiliza cerca de ±1.96·σ<sub>y</sub> = ±${fmt(1.96 * Math.sqrt(T2.acvfTeorica(P.ar, P.ma, 0, s * s)[0]), 2)}.`);
      let acum = 0;
      tab.innerHTML = tablaHTML(['h', 'ψ<sub>h−1</sub>', 'Σ ψ²', 'error estándar σ√Σψ²', 'banda 95% (±)'], rango(H).filter(h => h < 8 || (h + 1) % 6 === 0).map(h => { acum = pr.psi.slice(0, h + 1).reduce((a, b) => a + b * b, 0); return [h + 1, fmt(pr.psi[h], 4), fmt(acum, 4), fmt(pr.ee[h], 4), fmt(1.96 * pr.ee[h], 3)]; }));
    }
    dibujar();
  });

  R('py2-arima', c => {
    const D = DATOS.arima_sim;
    if (!D) { c.textContent = 'Faltan los datos del simulador.'; return; }
    const ctr = lienzo(c);
    let activo = 'order';
    const p = segmentado(ctr, { etiqueta: 'p', valor: '1', opciones: [['0', '0'], ['1', '1'], ['2', '2']] }, () => { activo = 'order'; dibujar(); });
    const d = segmentado(ctr, { etiqueta: 'd', valor: '1', opciones: [['0', '0'], ['1', '1']] }, () => { activo = 'order'; dibujar(); });
    const q = segmentado(ctr, { etiqueta: 'q', valor: '0', opciones: [['0', '0'], ['1', '1'], ['2', '2']] }, () => { activo = 'order'; dibujar(); });
    const tr = segmentado(ctr, { etiqueta: 'trend', valor: 'c', opciones: [['n', '"n" (sin constante)'], ['c', '"c" / "t" (constante o deriva)']] }, () => { activo = 'trend'; dibujar(); });
    const pc = panelCodigo(c), g = lamina(c), lec = lectura(c);
    const params = panelParametros(c, [
      { nombre: 'order', que: '(p, d, q): rezagos AR, número de diferencias y rezagos MA.', rec: 'd según ADF/KPSS; p y q chicos (0–2) según ACF/PACF; compara candidatos con AIC/BIC.' },
      { nombre: 'trend', que: '"n" sin término determinístico; "c" constante (solo con d = 0); "t" tendencia lineal, que con d = 1 equivale a una deriva.', rec: '"c" si d = 0 y la media no es 0; "t" si d = 1 y la serie crece; "n" si d = 1 y no hay crecimiento.' },
      { nombre: 'steps', que: 'Cuántos periodos pronostica <code>get_forecast</code>.', rec: 'El horizonte que necesites; recuerda que la banda crece con h.' },
      { nombre: 'alpha', que: 'Nivel de significancia del intervalo de <code>conf_int</code>.', rec: '0.05 (95%); 0.2 para bandas de 80%.' }
    ]);
    function dibujar() {
      const dd = d.get(), t = tr.get() === 'n' ? 'n' : (dd === '0' ? 'c' : 't'), clave = `${p.get()}${dd}${q.get()}${t}`, F = D.fits[clave];
      const args = { p: p.get(), d: dd, q: q.get(), trend: t };
      pc.codigo(codigoPython(`from statsmodels.tsa.arima.model import ARIMA\n\nmodelo = ARIMA(y, order=({p}, {d}, {q}), trend="{trend}")\najuste = modelo.fit()\nprint(ajuste.summary().tables[1])\nprint("llf:", round(ajuste.llf, 3), "| AIC:", round(ajuste.aic, 3), "| BIC:", round(ajuste.bic, 3))\npron = ajuste.get_forecast(steps=12)\nprint(np.round(pron.predicted_mean[:3], 3))\nprint(np.round(pron.conf_int(alpha=0.05)[:3], 3))`, args, activo === 'order' ? null : 'trend'));
      const linea = '='.repeat(78), guion = '-'.repeat(78), z = 1.959964;
      const filas = F.params.map(([nm, co, se, zz, pv]) => nm.padEnd(10) + co.toFixed(4).padStart(11) + se.toFixed(3).padStart(11) + zz.toFixed(3).padStart(11) + pv.toFixed(3).padStart(11) + (co - z * se).toFixed(3).padStart(12) + (co + z * se).toFixed(3).padStart(12));
      const fcs = rango(3).map(i => F.fc[i].toFixed(3)), cis = rango(3).map(i => ` [${F.inf[i].toFixed(3).padStart(8)} ${F.sup[i].toFixed(3).padStart(8)}]`);
      pc.salida([linea, '                 coef    std err          z      P>|z|      [0.025      0.975]', guion].concat(filas, [linea,
        `llf: ${F.llf} | AIC: ${F.aic} | BIC: ${F.bic}`, `[${fcs.join(' ')}]`, '[' + cis.map(s => s.trim()).join('\n ') + ']']).join('\n'));
      const y = D.y, n = y.length, xh = rango(60, n - 59), xf = rango(12, n + 1);
      graf(g, [lin(xh, y.slice(-60), '#45397a', 'datos', { line: { color: '#45397a', width: 1.5 } }), bandaTr(xf, F.inf, F.sup, 'rgba(124,105,214,.2)', '95%'), lin([n].concat(xf), [y[n - 1]].concat(F.fc), PAL.rosa, 'pronóstico', { line: { color: PAL.rosa, width: 2.4 } })],
        { height: 280, title: { text: `ARIMA(${p.get()},${dd},${q.get()}) trend="${t}"` }, showlegend: false });
      params({ order: `(${p.get()}, ${dd}, ${q.get()})`, trend: `"${t}"`, steps: 12, alpha: 0.05 }, activo === 'order' ? 'order' : 'trend');
      const mismos = Object.keys(D.fits).filter(k => k[1] === dd), mejorClave = mismos.reduce((a, b) => (D.fits[b].aic < D.fits[a].aic ? b : a)), mejor = D.fits[mejorClave];
      lec.className = 'w-lectura ' + (clave === mejorClave ? 'ok' : '');
      lec.innerHTML = `AIC = ${fmt(F.aic, 2)}. Entre los 18 modelos con d = ${dd}, el menor AIC es ${fmt(mejor.aic, 2)}: ARIMA(${mejorClave[0]},${mejorClave[1]},${mejorClave[2]}) con trend="${mejorClave[3]}". ` +
        (dd === '0' ? '⚠️ Con d = 0 el AR intenta imitar una raíz unitaria: compara su pronóstico con el de d = 1. ' : '') + '<i>Los AIC con d distinto no son comparables entre sí</i> (<a class="ref" href="#comparabilidad">por qué</a>).';
    }
    dibujar();
  });

  /* ======================= 8 · SARIMA ======================= */
  function barrasEstacionales(vals, s, desde, nombre) {
    const ks = rango(vals.length - desde, desde);
    return { type: 'bar', x: ks, y: vals.slice(desde), name: nombre, width: 0.6, marker: { color: ks.map(k => k % s === 0 ? PAL.rosa : (k % s === 1 || k % s === s - 1) && k > 1 ? PAL.dur : 'rgba(124,105,214,.75)') }, hovertemplate: 'k = %{x}<br>%{y:.4f}<extra></extra>' };
  }
  U.u2barrasEst = barrasEstacionales;
  R('w2-sarima-acf', c => {
    const ctr = lienzo(c);
    const sp = slider(ctr, { etiqueta: 'φ (AR regular)', min: -0.9, max: 0.9, paso: 0.05, valor: 0, fmt: num }, dibujar);
    const st = slider(ctr, { etiqueta: 'θ (MA regular)', min: -0.9, max: 0.9, paso: 0.05, valor: -0.4, fmt: num }, dibujar);
    const sP = slider(ctr, { etiqueta: 'Φ (AR estacional)', min: -0.9, max: 0.9, paso: 0.05, valor: 0, fmt: num }, dibujar);
    const sT = slider(ctr, { etiqueta: 'Θ (MA estacional)', min: -0.9, max: 0.9, paso: 0.05, valor: -0.6, fmt: num }, dibujar);
    const ss = segmentado(ctr, { etiqueta: 's', valor: '12', opciones: [['4', '4'], ['7', '7'], ['12', '12']] }, dibujar);
    boton(ctr, 'Modelo de aerolínea', () => { sp.set(0); st.set(-0.4); sP.set(0); sT.set(-0.6); ss.set ? ss.set('12') : 0; dibujar(); });
    const gA = lamina(c), gP = lamina(c), lec = lectura(c);
    const ex = extra(c, 'Vista extra: los polinomios completos, expandidos'), fx = el('div', { class: 'w-lectura' });
    ex.append(fx);
    function dibujar() {
      const s = +ss.get(), K = Math.max(48, 4 * s), M = { phi: sp.get() ? [sp.get()] : [], theta: st.get() ? [st.get()] : [], Phi: sP.get() ? [sP.get()] : [], Theta: sT.get() ? [sT.get()] : [], s };
      const E = T2.expandir(M), r = T2.acfTeorica(E.ar, E.ma, K), pc = T2.pacfTeorica(E.ar, E.ma, K);
      const L = t => ({ height: 250, title: { text: t }, xaxis: { title: { text: 'rezago k' }, range: [0.3, K + 0.7], dtick: s }, yaxis: { range: [-1, 1], zeroline: true, zerolinecolor: '#c9c3e6' }, showlegend: false, bargap: 0.2 });
      graf(gA, [barrasEstacionales(r, s, 1, 'ACF')], L(`ACF teórica (rosa: múltiplos de ${s}; durazno: satélites s ± 1)`));
      graf(gP, [barrasEstacionales(pc, s, 1, 'PACF')], L('PACF teórica'));
      lec.innerHTML = `ρ(1) = ${fmt(r[1], 4)} · ρ(${s - 1}) = ${fmt(r[s - 1], 4)} · ρ(${s}) = ${fmt(r[s], 4)} · ρ(${s + 1}) = ${fmt(r[s + 1], 4)} · ρ(${2 * s}) = ${fmt(r[2 * s], 4)}. ` +
        (M.theta.length && M.Theta.length && !M.phi.length && !M.Phi.length ? `Comprueba: ρ(1)·ρ(${s}) = ${fmt(r[1] * r[s], 4)} = ρ(${s + 1}) ✓.` : '');
      fx.innerHTML = tex(`\\phi(L)\\Phi(L^{${s}}) = ${polTexto(E.ar)}`, true) + tex(`\\theta(L)\\Theta(L^{${s}}) = ${polTexto(E.ma)}`, true);
    }
    dibujar();
  });

  R('w2-sarima-sim', c => {
    const ctr = lienzo(c);
    let semilla = 6;
    const d = segmentado(ctr, { etiqueta: 'd', valor: '1', opciones: [['0', '0'], ['1', '1']] }, dibujar);
    const D = segmentado(ctr, { etiqueta: 'D', valor: '1', opciones: [['0', '0'], ['1', '1']] }, dibujar);
    const st = slider(ctr, { etiqueta: 'θ', min: -0.9, max: 0.9, paso: 0.05, valor: -0.4, fmt: num }, dibujar);
    const sT = slider(ctr, { etiqueta: 'Θ', min: -0.9, max: 0.9, paso: 0.05, valor: -0.6, fmt: num }, dibujar);
    const sP = slider(ctr, { etiqueta: 'Φ', min: -0.9, max: 0.9, paso: 0.05, valor: 0, fmt: num }, dibujar);
    boton(ctr, 'Otra serie', () => { semilla += 5; dibujar(); });
    const g1 = lamina(c), f = fila(c), gA = lamina(f), gB = lamina(f), lec = lectura(c);
    const PATRON = [0, 2, 6, 4, 3, 8, 14, 14, 7, 1, -5, 0].map(v => v * 1.5);
    function dibujar() {
      const dd = +d.get(), DD = +D.get(), M = { theta: st.get() ? [st.get()] : [], Theta: sT.get() ? [sT.get()] : [], Phi: sP.get() ? [sP.get()] : [], s: 12, d: dd, D: DD };
      // Valores iniciales de la integración estacional: el patrón (d = 0) o sus cambios mes a mes más un crecimiento (d = 1)
      const inicio = dd ? PATRON.map((v, i) => v - PATRON[(i + 11) % 12] + 0.8) : PATRON;
      const n = 144, S = T2.simularSARIMA(M, n, { semilla, sigma: 1, inicioS: DD ? inicio : null, nivel: 100 });
      const y = S.y;
      graf(g1, [lin(FECHAS_AP, y, PAL.lav, 'y', { line: { color: PAL.lav, width: 1.6 } })], { height: 240, title: { text: `SARIMA(0,${dd},${M.theta.length})(${M.Phi.length},${DD},${M.Theta.length})₁₂ simulado (12 años)` }, showlegend: false });
      const w = DD ? TS.diff(dd ? TS.diff(y) : y, 12) : (dd ? TS.diff(y) : y);
      const wd = dd && DD ? TS.diff(TS.diff(y, 12)) : w;
      const L = t => layoutACF(t, { height: 260, xaxis: { range: [0.3, 36.7], dtick: 12 } });
      graf(gA, [barrasEstacionales(TS.acf(y, 36), 12, 1, 'ACF')], L('ACF de y<sub>t</sub>'));
      graf(gB, [barrasEstacionales(TS.acf(wd, 36), 12, 1, 'ACF')], L(`ACF de la serie diferenciada (d = ${dd}, D = ${DD})`));
      const rd = TS.acf(wd, 13);
      lec.innerHTML = `En la serie diferenciada: ρ̂(1) = ${fmt(rd[1], 3)}, ρ̂(12) = ${fmt(rd[12], 3)}, ρ̂(13) = ${fmt(rd[13], 3)}. ` +
        (DD ? 'La diferencia estacional quitó el patrón anual (que en y<sub>t</sub> se ve como ACF alta en 12, 24, 36).' : 'Sin D, el patrón anual no se repite de forma fija: la parte estacional sale solo de Φ y Θ.');
    }
    dibujar();
  });

  R('w2-aerolinea', c => {
    const G = DATOS.rejilla_ap;
    if (!G) { c.textContent = 'Faltan los datos.'; return; }
    const M = G.modelos.find(m => m.orden.join() === '0,1,1' && m.estacional.join() === '0,1,1');
    const ctr = lienzo(c);
    const esc = segmentado(ctr, { etiqueta: 'Escala', valor: 'orig', opciones: [['log', 'logaritmo'], ['orig', 'pasajeros']] }, dibujar);
    const cerca = casilla(ctr, 'Ver solo desde 1957', true, dibujar);
    const g = lamina(c), lec = lectura(c);
    const ex = extra(c, 'Vista extra: el pronóstico mes por mes'), tab = el('div', { class: 'w-tabla' });
    ex.append(tab);
    function dibujar() {
      const lg = esc.get() === 'log', T = v => (lg ? v : Math.exp(v)), ini = cerca.get() ? 96 : 0;
      const xtr = G.fechas_tr.slice(ini), ytr = G.log_tr.slice(ini).map(T), xte = G.fechas_te;
      const fc = M.fc.map(T), inf = M.fc_inf.map(T), sup = M.fc_sup.map(T), real = G.log_te.map(T);
      graf(g, [lin(xtr, ytr, '#45397a', 'entrenamiento', { line: { color: '#45397a', width: 1.6 } }), bandaTr(xte, inf, sup, 'rgba(224,112,159,.18)', 'banda 95%'),
        lin(xte, fc, PAL.rosa, 'pronóstico', { line: { color: PAL.rosa, width: 2.4 } }), { x: xte, y: real, mode: 'markers', marker: { color: PAL.menta, size: 8, line: { color: '#fff', width: 1 } }, name: 'real 1960' }],
      { height: 340, title: { text: `Aerolínea ajustado con 1949–1959: pronóstico de 1960 (${lg ? 'log' : 'pasajeros'})` }, legend: { orientation: 'h', y: -0.2 } });
      const dentro = real.filter((v, i) => v >= inf[i] && v <= sup[i]).length;
      lec.className = 'w-lectura ok';
      lec.innerHTML = `En pasajeros: MAE = <b>${fmt(M.mae, 1)}</b> miles, RMSE = <b>${fmt(M.rmse, 1)}</b>, MAPE = <b>${fmt(M.mape, 2)}%</b>, MASE = ${fmt(M.mase, 3)}. ${dentro} de 12 meses reales quedaron dentro de la banda de 95%. ` +
        (lg ? 'En logaritmos la banda es simétrica.' : 'En pasajeros la banda es asimétrica: más larga hacia arriba.');
      tab.innerHTML = tablaHTML(['mes', 'pronóstico', 'banda 95%', 'real', 'error %'], xte.map((x, i) => {
        const p = Math.exp(M.fc[i]), r = Math.exp(G.log_te[i]);
        return [x.slice(0, 7), fmt(p, 1), `[${fmt(Math.exp(M.fc_inf[i]), 1)}, ${fmt(Math.exp(M.fc_sup[i]), 1)}]`, fmt(r, 0), fmt(100 * (r - p) / r, 2) + '%'];
      }));
    }
    dibujar();
  });

  /* ======================= 9 · Exógenas ======================= */
  R('w2-armax', c => {
    const ctr = lienzo(c);
    const tipo = segmentado(ctr, { etiqueta: 'Variable externa', valor: 'pulso', opciones: [['pulso', 'festivo aislado'], ['escalon', 'cambio permanente'], ['aleatoria', 'cambia cada día']] }, dibujar);
    const sb = slider(ctr, { etiqueta: 'β', min: -2, max: 2, paso: 0.1, valor: -1, fmt: num }, dibujar);
    const sp = slider(ctr, { etiqueta: 'φ', min: 0, max: 0.95, paso: 0.05, valor: 0.6, fmt: num }, dibujar);
    const ruido = casilla(ctr, 'Agregar choques', false, dibujar);
    const g = lamina(c), lec = lectura(c);
    const ex = extra(c, 'Vista extra: las dos respuestas periodo por periodo'), tab = el('div', { class: 'w-tabla' });
    ex.append(tab);
    function dibujar() {
      const n = 40, b = sb.get(), p = sp.get(), t0 = 10, r = TS.rng(5);
      const x = rango(n).map(i => tipo.get() === 'pulso' ? (i === t0 ? 1 : 0) : tipo.get() === 'escalon' ? (i >= t0 ? 1 : 0) : (i >= 5 ? r.normal() : 0));
      const e = ruido.get() ? TS.rng(9).normales(n, 0.3) : new Array(n).fill(0);
      const ya = [], yr = [];
      let u = 0;
      for (let i = 0; i < n; i++) {
        ya.push((i ? p * ya[i - 1] : 0) + b * x[i] + e[i]);
        u = (i ? p * u : 0) + e[i];
        yr.push(b * x[i] + u);
      }
      const A = apilado([{ x: rango(n), y: ya, color: PAL.lav, nombre: 'ARMAX' }, { x: rango(n), y: x, color: PAL.gris, nombre: 'x_t' }], 400);
      A.tr.splice(1, 0, { x: rango(n), y: yr, mode: 'lines+markers', marker: { size: 4 }, line: { color: PAL.rosa, width: 2 }, name: 'regresión con errores AR(1)', xaxis: 'x', yaxis: 'y' });
      A.tr[2] = { type: 'bar', x: rango(n), y: x, marker: { color: 'rgba(169,165,194,.7)' }, name: 'x_t', xaxis: 'x2', yaxis: 'y2' };
      A.L.showlegend = true; A.L.legend = { orientation: 'h', y: 1.12 };
      graf(g, A.tr, A.L);
      const largo = b / (1 - p);
      lec.innerHTML = tipo.get() === 'escalon' ? `Cambio permanente: la regresión salta de inmediato a β = ${num(b)}; el ARMAX se acerca poco a poco a β/(1 − φ) = ${fmt(largo, 3)}.`
        : tipo.get() === 'pulso' ? `Festivo aislado: la regresión solo cambia ese día (${num(b)}); en el ARMAX el efecto dura y suma en total β/(1 − φ) = ${fmt(largo, 3)}.`
          : 'Con una x que cambia cada día, el ARMAX «suaviza» y acumula su efecto; en la regresión, y sigue a x de inmediato.';
      tab.innerHTML = tablaHTML(['t', 'x_t', 'ARMAX', 'regresión con errores AR(1)'], rango(12, t0 - 2).map(i => [i, fmt(x[i], 3), fmt(ya[i], 4), fmt(yr[i], 4)]), rango(12, t0 - 2).map(i => i === t0 ? 'resaltado' : ''));
    }
    dibujar();
  });

  R('w2-fuga', c => {
    const ctr = lienzo(c);
    let semilla = 3;
    const rz = slider(ctr, { etiqueta: 'Ruido propio de z', min: 0.5, max: 6, paso: 0.5, valor: 1.5, fmt: num }, dibujar);
    boton(ctr, 'Otros datos', () => { semilla += 7; dibujar(); });
    const g1 = lamina(c), g2 = lamina(c), lec = lectura(c);
    const ex = extra(c, 'Vista extra: los tres modelos y dónde entra la trampa'), tab = el('div', { class: 'w-tabla' });
    ex.append(tab);
    function dibujar() {
      const n = 250, nt = 200, r = TS.rng(semilla), f = T2.simularARMA([1, -0.8], [1], n, { semilla: semilla + 1 }).y;
      const y = f.map(v => 50 + 5 * v + 1.5 * r.normal()), z = f.map(v => 40 + 5 * v + rz.get() * r.normal());
      const ols = (X, Y) => TS.ols(X, Y).beta;
      const bz = ols(rango(nt).map(i => [1, z[i]]), y.slice(0, nt));                                   // y sobre z (mismo día)
      const by = ols(rango(nt - 1, 1).map(i => [1, y[i - 1]]), y.slice(1, nt));                         // AR(1) de y
      const bzz = ols(rango(nt - 1, 1).map(i => [1, z[i - 1]]), z.slice(1, nt));                        // AR(1) de z
      const pf = [], ph = [], ps = [];
      for (let t = nt; t < n; t++) {
        pf.push(bz[0] + bz[1] * z[t]);                       // con fuga: usa el z real de ese día
        const zh = bzz[0] + bzz[1] * z[t - 1];               // honesto: pronóstico de z con lo que se sabe ayer
        ph.push(bz[0] + bz[1] * zh);
        ps.push(by[0] + by[1] * y[t - 1]);                    // sin z: AR(1) de y
      }
      const real = y.slice(nt), mae = p => TS.media(p.map((v, i) => Math.abs(real[i] - v)));
      const M = [mae(pf), mae(ph), mae(ps)], cor = TS.correlacion ? TS.correlacion(y, z) : null;
      graf(g1, [lin(rango(n - nt, nt + 1), real, PAL.lav, 'y (lo que queremos pronosticar)'), lin(rango(n - nt, nt + 1), z.slice(nt), PAL.dur, 'z (estación vecina, mismo día)'), lin(rango(n - nt, nt + 1), pf, PAL.rosa, 'pronóstico con fuga', { line: { dash: 'dot', color: PAL.rosa, width: 1.6 } })],
        { height: 260, title: { text: 'Periodo de prueba (50 días)' }, legend: { orientation: 'h', y: -0.25 } });
      graf(g2, [{ type: 'bar', x: ['con z real (fuga)', 'con z pronosticado (honesto)', 'sin z (AR(1) de y)'], y: M, marker: { color: [PAL.rosa, PAL.menta, PAL.lav] }, text: M.map(v => fmt(v, 2)), textposition: 'outside' }],
        { height: 260, title: { text: 'MAE en la prueba (pronóstico a un día)' }, yaxis: { rangemode: 'tozero' }, showlegend: false });
      const rr = (() => { const my = TS.media(y), mz = TS.media(z); let a = 0, b1 = 0, b2 = 0; for (let i = 0; i < n; i++) { a += (y[i] - my) * (z[i] - mz); b1 += (y[i] - my) ** 2; b2 += (z[i] - mz) ** 2; } return a / Math.sqrt(b1 * b2); })();
      lec.className = 'w-lectura aviso';
      lec.innerHTML = `Correlación entre y y z el mismo día: ${fmt(rr, 3)}. La validación con fuga promete MAE = <b>${fmt(M[0], 2)}</b>, pero en la práctica, sin el z de mañana, el error real sería <b>${fmt(M[1], 2)}</b> ${M[1] > M[2] ? `(¡peor que no usar z: ${fmt(M[2], 2)}!)` : `(apenas mejor que no usar z: ${fmt(M[2], 2)})`}.`;
      tab.innerHTML = tablaHTML(['modelo', 'ecuación estimada', 'qué necesita para pronosticar mañana'], [
        ['con fuga', `ŷ = ${fmt(bz[0], 2)} + ${fmt(bz[1], 3)}·z<sub>t+1</sub>`, '<b>el z de mañana</b>: no se conoce a tiempo ❌'],
        ['honesto', `ŷ = ${fmt(bz[0], 2)} + ${fmt(bz[1], 3)}·ẑ<sub>t+1</sub>, ẑ<sub>t+1</sub> = ${fmt(bzz[0], 2)} + ${fmt(bzz[1], 3)}·z<sub>t</sub>`, 'el z de hoy ✓'],
        ['sin z', `ŷ = ${fmt(by[0], 2)} + ${fmt(by[1], 3)}·y<sub>t</sub>`, 'el y de hoy ✓']]);
    }
    dibujar();
  });

  /* ======================= 10 · Máxima verosimilitud ======================= */
  R('w2-moneda', c => {
    const ctr = lienzo(c);
    const n = slider(ctr, { etiqueta: 'Lanzamientos n', min: 5, max: 200, paso: 1, valor: 10 }, () => { k.input.max = n.get(); if (k.get() > n.get()) k.set(n.get()); dibujar(); });
    const k = slider(ctr, { etiqueta: 'Águilas', min: 0, max: 10, paso: 1, valor: 7 }, dibujar);
    boton(ctr, '×10 los datos', () => { const N = Math.min(200, n.get() * 10), K = Math.round(k.get() / n.get() * N); n.set(N); k.input.max = N; k.set(K); dibujar(); });
    const f = fila(c), g1 = lamina(f), g2 = lamina(f), lec = lectura(c);
    const ex = extra(c, 'Vista extra: ℓ(p) en una rejilla'), tab = el('div', { class: 'w-tabla' });
    ex.append(tab);
    function dibujar() {
      const N = n.get(), K = Math.min(k.get(), N), ps = rango(499).map(i => 0.002 + i * 0.002);
      const ll = p => K * Math.log(p) + (N - K) * Math.log(1 - p), ph = Math.min(0.998, Math.max(0.002, K / N)), lmax = ll(ph);
      const rel = ps.map(p => ll(p) - lmax), L = rel.map(Math.exp), dentro = ps.filter((p, i) => rel[i] >= -1.92);
      graf(g1, [lin(ps, L, PAL.lav, 'L(p)/L(p̂)', { fill: 'tozeroy', fillcolor: 'rgba(124,105,214,.12)' }), vline(ph, 0, 1, PAL.rosa, 'dash', 'p̂')], { height: 280, title: { text: 'Verosimilitud (reescalada)' }, showlegend: false, xaxis: { title: { text: 'p' }, range: [0, 1] }, yaxis: { range: [0, 1.05] } });
      graf(g2, [lin(ps, rel, PAL.menta, 'ℓ(p) − ℓ(p̂)'), hline(0, 1, -1.92, PAL.rosa, 'dot', ''), bandaTr(dentro, dentro.map(() => -12), dentro.map(() => 0.5), 'rgba(224,112,159,.10)', '')],
        { height: 280, title: { text: 'Log-verosimilitud relativa' }, showlegend: false, xaxis: { title: { text: 'p' }, range: [0, 1] }, yaxis: { range: [-12, 0.5] } });
      const se = Math.sqrt(ph * (1 - ph) / N), curv = K / (ph * ph) + (N - K) / ((1 - ph) ** 2);
      lec.innerHTML = `p̂ = ${K}/${N} = <b>${fmt(K / N, 3)}</b>. Curvatura I(p̂) = ${fmt(curv, 2)} ⇒ error estándar 1/√I = <b>${fmt(1 / Math.sqrt(curv), 4)}</b> (= √(p̂(1−p̂)/n) = ${fmt(se, 4)}). ` +
        `Intervalo de verosimilitud 95%: [${fmt(dentro[0], 3)}, ${fmt(dentro[dentro.length - 1], 3)}].`;
      tab.innerHTML = tablaHTML(['p', 'ℓ(p)', 'ℓ(p) − ℓ(p̂)'], [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9].map(p => [num(p), fmt(ll(p), 3), fmt(ll(p) - lmax, 3)]), [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9].map(p => Math.abs(p - K / N) < 0.05 ? 'elegido' : ''));
    }
    dibujar();
  });

  R('w2-verosimilitud-ar1', c => {
    const ctr = lienzo(c);
    let semilla = 13;
    const sp = slider(ctr, { etiqueta: 'φ verdadero', min: -0.95, max: 0.95, paso: 0.05, valor: 0.6, fmt: num }, dibujar);
    const sn = slider(ctr, { etiqueta: 'n', min: 10, max: 500, paso: 5, valor: 30 }, dibujar);
    boton(ctr, 'Otra muestra', () => { semilla += 3; dibujar(); });
    const f = fila(c), g1 = lamina(f), g2 = lamina(f), lec = lectura(c);
    const ex = extra(c, 'Vista extra: el error estándar a partir de la curvatura'), tab = el('div', { class: 'w-tabla' });
    ex.append(tab);
    function dibujar() {
      const phi = sp.get(), n = sn.get(), y = T2.simularARMA([1, -phi], [1], n, { semilla, quemado: 300 }).y;
      const ssr = p => { let s = 0; for (let t = 1; t < n; t++) s += (y[t] - p * y[t - 1]) ** 2; return s; };
      const llc = p => T2.llConcentrada(ssr(p), n - 1);
      const lle = p => { if (Math.abs(p) >= 1) return NaN; const s2 = ((1 - p * p) * y[0] * y[0] + ssr(p)) / n; return -n / 2 * (Math.log(2 * Math.PI) + Math.log(s2) + 1) + 0.5 * Math.log(1 - p * p); };
      const gc = rango(441).map(i => -1.1 + i * 0.005), ge = gc.filter(p => Math.abs(p) < 0.995);
      const vc = gc.map(llc), ve = ge.map(lle);
      const ic = vc.indexOf(Math.max(...vc)), ie = ve.indexOf(Math.max(...ve.filter(isFinite)));
      const top = Math.max(vc[ic], ve[ie]);
      graf(g1, [lin(gc, vc, PAL.lav, 'condicional'), lin(ge, ve, PAL.rosa, 'exacta'), vline(phi, top - 25, top + 1, PAL.gris, 'dot', 'verdadero'),
        { x: [gc[ic]], y: [vc[ic]], mode: 'markers', marker: { symbol: 'diamond', size: 11, color: PAL.lav }, name: 'máx. condicional' }, { x: [ge[ie]], y: [ve[ie]], mode: 'markers', marker: { symbol: 'diamond', size: 11, color: PAL.rosa }, name: 'máx. exacta' }],
      { height: 300, title: { text: 'ℓ(φ) con σ² optimizado' }, xaxis: { title: { text: 'φ' }, range: [-1.1, 1.1] }, yaxis: { range: [top - 25, top + 1] }, legend: { orientation: 'h', y: -0.3 } });
      graf(g2, [lin(rango(n, 1), y, PAL.lav, 'y', { line: { width: 1.3, color: PAL.lav } })], { height: 300, title: { text: `Muestra de un AR(1), φ = ${num(phi)}, n = ${n}` }, showlegend: false });
      const h = 0.005, d2 = (llc(gc[ic] + h) - 2 * llc(gc[ic]) + llc(gc[ic] - h)) / (h * h), se = 1 / Math.sqrt(-d2), ph = gc[ic];
      lec.innerHTML = `Máximo condicional: φ̂ = <b>${fmt(gc[ic], 3)}</b> · máximo exacto: φ̂ = <b>${fmt(ge[ie], 3)}</b> (verdadero ${num(phi)}). ` + (n <= 40 ? 'Con tan pocos datos el primer dato pesa y las dos curvas difieren.' : 'Con muchos datos las dos curvas casi coinciden.');
      tab.innerHTML = tablaHTML(['cantidad', 'valor'], [['curvatura −ℓ″(φ̂) (numérica)', fmt(-d2, 2)], ['error estándar 1/√curvatura', fmt(se, 4)], ['fórmula √((1 − φ̂²)/n)', fmt(Math.sqrt(Math.max(0, 1 - ph * ph) / n), 4)], ['intervalo ±1.96·se', `[${fmt(ph - 1.96 * se, 3)}, ${fmt(ph + 1.96 * se, 3)}]`]]);
    }
    dibujar();
  });

  R('w2-superficie', c => {
    const ctr = lienzo(c);
    let semilla = 4;
    const caso = segmentado(ctr, { etiqueta: 'Modelo verdadero', valor: 'normal', opciones: [['normal', 'φ = 0.7, θ = 0.4'], ['cancel', 'casi cancelación: φ = 0.5, θ = −0.5'], ['ma', 'MA(1): θ = 0.6']] }, dibujar);
    const sn = slider(ctr, { etiqueta: 'n', min: 100, max: 1000, paso: 100, valor: 300 }, dibujar);
    boton(ctr, 'Otra muestra', () => { semilla += 3; dibujar(); });
    const f = fila(c), g1 = lamina(f), g2 = lamina(f), lec = lectura(c);
    const ex = extra(c, 'Vista extra: los cinco mejores puntos de la rejilla'), tab = el('div', { class: 'w-tabla' });
    ex.append(tab);
    function dibujar() {
      const V = { normal: [0.7, 0.4], cancel: [0.5, -0.5], ma: [0, 0.6] }[caso.get()], n = sn.get();
      const y = T2.simularARMA([1, -V[0]], [1, V[1]], n, { semilla, quemado: 300 }).y;
      const g = rango(39).map(i => -0.95 + i * 0.05), Z = [];
      let mejor = { v: -Infinity }, puntos = [];
      for (const t of g) {
        const fila_ = [];
        for (const p of g) { const r = T2.cssARMA(y, [1, -p], [1, t], 0, 1), v = r.llf; fila_.push(v); puntos.push({ p, t, v }); if (v > mejor.v) mejor = { p, t, v }; }
        Z.push(fila_);
      }
      const Zr = Z.map(f_ => f_.map(v => Math.max(-60, v - mejor.v)));
      graf(g1, [{ type: 'contour', x: g, y: g, z: Zr, colorscale: [[0, '#f7f5fd'], [0.6, '#cbbff3'], [0.9, '#8d79dc'], [1, '#3f2f9a']], contours: { start: -60, end: 0, size: 5 }, colorbar: { title: { text: 'ℓ − máx' }, len: 0.8 }, hovertemplate: 'φ = %{x:.2f}<br>θ = %{y:.2f}<br>ℓ − máx = %{z:.2f}<extra></extra>' },
        { x: [V[0]], y: [V[1]], mode: 'markers', marker: { symbol: 'x', size: 13, color: PAL.rosa, line: { width: 2 } }, name: 'verdadero' }, { x: [mejor.p], y: [mejor.t], mode: 'markers', marker: { symbol: 'diamond', size: 11, color: '#fff', line: { color: '#3f2f9a', width: 2 } }, name: 'máximo' }],
      { height: 360, title: { text: 'Log-verosimilitud (CSS) en el plano (φ, θ)' }, xaxis: { title: { text: 'φ' } }, yaxis: { title: { text: 'θ' }, scaleanchor: 'x' }, showlegend: false });
      const it = g.indexOf(mejor.t), corte = Z[it];
      graf(g2, [lin(g, corte.map(v => v - mejor.v), PAL.lav, 'corte'), vline(mejor.p, -40, 2, PAL.rosa, 'dash', '')], { height: 360, title: { text: `Corte con θ = ${fmt(mejor.t, 2)}` }, xaxis: { title: { text: 'φ' } }, yaxis: { range: [-40, 2], title: { text: 'ℓ − máx' } }, showlegend: false });
      puntos.sort((a, b) => b.v - a.v);
      const cresta = puntos.slice(0, 10).filter(q => Math.abs(q.p + q.t) < 0.16).length;
      lec.className = 'w-lectura ' + (caso.get() === 'cancel' ? 'aviso' : '');
      lec.innerHTML = `Máximo de la rejilla: φ̂ = ${fmt(mejor.p, 2)}, θ̂ = ${fmt(mejor.t, 2)} (verdadero ${V[0]}, ${V[1]}). ` +
        (caso.get() === 'cancel' ? `${cresta} de los 10 mejores puntos están sobre la diagonal φ ≈ −θ: una <b>cresta</b>, el modelo no puede decidir.` : 'La región clara alrededor del máximo es pequeña: la estimación es precisa.');
      tab.innerHTML = tablaHTML(['φ', 'θ', 'ℓ', 'ℓ − máx'], puntos.slice(0, 5).map(q => [fmt(q.p, 2), fmt(q.t, 2), fmt(q.v, 2), fmt(q.v - mejor.v, 3)]));
    }
    dibujar();
  });

  /* ======================= 11 · AIC y BIC ======================= */
  R('w2-penalizacion', c => {
    const ctr = lienzo(c);
    let semilla = 50;
    const sn = slider(ctr, { etiqueta: 'n', min: 30, max: 500, paso: 10, valor: 100 }, dibujar);
    const s2 = slider(ctr, { etiqueta: 'φ₂ verdadero (φ₁ = 0.5)', min: 0.05, max: 0.45, paso: 0.05, valor: 0.3, fmt: num }, dibujar);
    boton(ctr, 'Otra muestra', () => { semilla += 1000; dibujar(); });
    const f = fila(c), g1 = lamina(f), g2 = lamina(f), lec = lectura(c);
    const ex = extra(c, 'Vista extra: ℓ, AIC y BIC de la muestra actual'), tab = el('div', { class: 'w-tabla' });
    ex.append(tab);
    const P = 10;
    function evaluar(y) {
      return rango(P + 1).map(p => T2.ajustarAR(y, p, { holdBack: P }));
    }
    function dibujar() {
      const n = sn.get(), ar = [1, -0.5, -s2.get()];
      const y = T2.simularARMA(ar, [1], n, { semilla, quemado: 200 }).y, A = evaluar(y);
      const aic = A.map(a => a.aic), bic = A.map(a => a.bic), m2 = A.map(a => -2 * a.llf);
      const pa = aic.indexOf(Math.min(...aic)), pb = bic.indexOf(Math.min(...bic)), ps = rango(P + 1);
      graf(g1, [lin(ps, m2, PAL.gris, '−2ℓ', { mode: 'lines+markers', marker: { size: 5 } }), lin(ps, aic, PAL.lav, 'AIC', { mode: 'lines+markers', marker: { size: 5 } }), lin(ps, bic, PAL.rosa, 'BIC', { mode: 'lines+markers', marker: { size: 5 } }),
        { x: [pa], y: [aic[pa]], mode: 'markers', marker: { symbol: 'diamond', size: 13, color: PAL.lav, line: { color: '#fff', width: 1.5 } }, name: 'elige AIC' }, { x: [pb], y: [bic[pb]], mode: 'markers', marker: { symbol: 'diamond', size: 13, color: PAL.rosa, line: { color: '#fff', width: 1.5 } }, name: 'elige BIC' }],
      { height: 320, title: { text: 'Una muestra: −2ℓ, AIC y BIC según p' }, xaxis: { title: { text: 'orden p del AR ajustado' }, dtick: 1 }, legend: { orientation: 'h', y: -0.3 } });
      const ca = new Array(P + 1).fill(0), cb = new Array(P + 1).fill(0), R_ = 100;
      for (let r = 0; r < R_; r++) {
        const yy = T2.simularARMA(ar, [1], n, { semilla: semilla + 7 + r, quemado: 200 }).y, B = evaluar(yy);
        const a1 = B.map(b => b.aic), b1 = B.map(b => b.bic);
        ca[a1.indexOf(Math.min(...a1))]++; cb[b1.indexOf(Math.min(...b1))]++;
      }
      graf(g2, [{ type: 'bar', x: ps, y: ca, name: 'AIC', marker: { color: PAL.lav } }, { type: 'bar', x: ps, y: cb, name: 'BIC', marker: { color: PAL.rosa } }],
        { height: 320, title: { text: `${R_} muestras: ¿qué p elige cada criterio?` }, barmode: 'group', xaxis: { title: { text: 'p elegido' }, dtick: 1 }, yaxis: { title: { text: 'veces' } }, legend: { orientation: 'h', y: -0.3 } });
      lec.innerHTML = `En esta muestra el AIC elige p = <b>${pa}</b> y el BIC p = <b>${pb}</b> (verdadero: 2). En ${R_} repeticiones aciertan p = 2: AIC ${ca[2]} veces, BIC ${cb[2]} veces; eligen p > 2: AIC ${ca.slice(3).reduce((a, b) => a + b, 0)} veces, BIC ${cb.slice(3).reduce((a, b) => a + b, 0)} veces.`;
      tab.innerHTML = tablaHTML(['p', 'k', 'ℓ', 'AIC', 'BIC'], A.map((a, p) => [p, a.k, fmt(a.llf, 2), fmt(a.aic, 2), fmt(a.bic, 2)]), A.map((_, p) => p === pa && p === pb ? 'elegido' : p === pa || p === pb ? 'resaltado' : ''));
    }
    dibujar();
  });

  R('w2-aic-grid', c => {
    const G = DATOS.rejilla_ap;
    if (!G) { c.textContent = 'Faltan los datos.'; return; }
    const M = G.modelos.map(m => Object.assign({ etiqueta: `(${m.orden.join(',')})(${m.estacional.join(',')})₁₂` }, m));
    const minA = Math.min(...M.map(m => m.aic)), minB = Math.min(...M.map(m => m.bic));
    const ctr = lienzo(c);
    let orden = 'aic', asc = true, sel = M.find(m => m.orden.join() === '0,1,1' && m.estacional.join() === '0,1,1');
    const filtro = casilla(ctr, 'Solo modelos con ΔAIC < 2', false, dibujar);
    const g = lamina(c), lec = lectura(c), tab = el('div', { class: 'w-tabla', style: 'max-height:360px;overflow:auto' });
    c.append(tab);
    const COLS = [['etiqueta', 'modelo'], ['k', 'k'], ['aic', 'AIC'], ['daic', 'ΔAIC'], ['bic', 'BIC'], ['lb', 'LB p (24)'], ['mape', 'MAPE 1960 %']];
    function dibujar() {
      const filas = M.map(m => Object.assign(m, { daic: m.aic - minA, lb: m.lb24[1] })).filter(m => !filtro.get() || m.daic < 2);
      filas.sort((a, b) => (asc ? 1 : -1) * (a[orden] > b[orden] ? 1 : a[orden] < b[orden] ? -1 : 0));
      tab.innerHTML = '<table><thead><tr>' + COLS.map(([k, t]) => `<th class="ord" data-k="${k}">${t}${orden === k ? (asc ? ' ▲' : ' ▼') : ''}</th>`).join('') + '</tr></thead><tbody>' +
        filas.map((m, i) => `<tr class="clic ${m === sel ? 'elegido' : ''}" data-i="${M.indexOf(m)}"><td>${m.etiqueta}</td><td>${m.k}</td><td>${fmt(m.aic, 2)}</td><td>${fmt(m.daic, 2)}</td><td>${fmt(m.bic, 2)}</td><td>${fmt(m.lb, 3)}</td><td>${fmt(m.mape, 2)}</td></tr>`).join('') + '</tbody></table>';
      tab.querySelectorAll('th.ord').forEach(th => th.addEventListener('click', () => { const k = th.dataset.k; if (orden === k) asc = !asc; else { orden = k; asc = true; } dibujar(); }));
      tab.querySelectorAll('tr.clic').forEach(tr => tr.addEventListener('click', () => { sel = M[+tr.dataset.i]; dibujar(); }));
      const ini = 96, xtr = G.fechas_tr.slice(ini), ytr = G.log_tr.slice(ini).map(Math.exp), xte = G.fechas_te;
      graf(g, [lin(xtr, ytr, '#45397a', 'entrenamiento', { line: { color: '#45397a', width: 1.5 } }), bandaTr(xte, sel.fc_inf.map(Math.exp), sel.fc_sup.map(Math.exp), 'rgba(224,112,159,.18)', 'banda 95%'),
        lin(xte, sel.fc.map(Math.exp), PAL.rosa, 'pronóstico', { line: { color: PAL.rosa, width: 2.3 } }), { x: xte, y: G.log_te.map(Math.exp), mode: 'markers', marker: { color: PAL.menta, size: 7 }, name: 'real 1960' }],
      { height: 300, title: { text: `SARIMA${sel.etiqueta}: pronóstico de 1960` }, legend: { orientation: 'h', y: -0.22 } });
      const d = sel.aic - minA, apoyo = d < 2 ? 'apoyo parecido al mejor' : d < 4 ? 'algo menos de apoyo' : d <= 7 ? 'mucho menos apoyo' : d > 10 ? 'prácticamente sin apoyo' : 'poco apoyo';
      lec.innerHTML = `<b>SARIMA${sel.etiqueta}</b>: ΔAIC = ${fmt(d, 2)} (${apoyo}), ΔBIC = ${fmt(sel.bic - minB, 2)}. Coeficientes: ` +
        sel.params.map(([nm, co, se, z, p]) => `${nm} = ${fmt(co, 4)} (z = ${fmt(z, 2)}${p > 0.05 ? ', <b>no significativo</b>' : ''})`).join(' · ') + '.';
    }
    dibujar();
  });

  /* ======================= 12 · summary() anotado ======================= */
  R('w2-summary', c => {
    const G = DATOS.rejilla_ap;
    if (!G) { c.textContent = 'Faltan los datos.'; return; }
    const M = G.modelos;
    const ctr = lienzo(c);
    const nombre = m => `(${m.orden.join(',')})(${m.estacional.join(',')})12`;
    const elegir = seleccion(ctr, { etiqueta: 'Modelo', valor: '0,1,1|0,1,1', opciones: M.map(m => [m.orden.join() + '|' + m.estacional.join(), 'SARIMA' + nombre(m)]) }, dibujar);
    const pre = el('div', { class: 'resumen-sm' }), nota = el('div', { class: 'resumen-nota' });
    c.append(pre, nota);
    const r3 = v => v.toFixed(3), r4 = v => v.toFixed(4);
    function dibujar() {
      const [o, e] = elegir.get().split('|'), m = M.find(x => x.orden.join() === o && x.estacional.join() === e);
      const ne = m.nobs - m.burn, k = m.k;
      const izq = (a, b) => a + String(b).padStart(49 - a.length), der = (a, b) => a + String(b).padStart(38 - a.length);
      const izqP = (a, b) => a + String(b).padStart(42 - a.length);
      const mod = `SARIMAX(${m.orden.join(', ')})x(${m.estacional.join(', ')}, 12)`;
      const L = [];
      const add = (t, clave, clase) => L.push({ t, clave, clase });
      add('                                     SARIMAX Results                                      ', 'titulo', 'rs-c');
      add('='.repeat(90), null);
      add(izq('Dep. Variable:', 'Passengers') + '   ' + der('No. Observations:', m.nobs), 'nobs', 'rs-c');
      add(izq('Model:', mod) + '   ' + der('Log Likelihood', r3(m.llf)), 'llf', 'rs-c');
      add(izq('Date:', 'Sat, 07 Nov 2026') + '   ' + der('AIC', r3(m.aic)), 'aic', 'rs-c');
      add(izq('Time:', '22:44:53') + '   ' + der('BIC', r3(m.bic)), 'bic', 'rs-c');
      add(izq('Sample:', '01-01-1949') + '   ' + der('HQIC', r3(m.hqic)), 'hqic', 'rs-c');
      add(izq('', '- 12-01-1959') + '   ' + ' '.repeat(38), 'sample', 'rs-c');
      add(izq('Covariance Type:', 'opg') + '   ' + ' '.repeat(38), 'cov', 'rs-c');
      add('='.repeat(78), null);
      add('                 coef    std err          z      P>|z|      [0.025      0.975]', 'cabcoef', 'rs-a');
      add('-'.repeat(78), null);
      m.params.forEach(([nm, co, se, z, p, lo, hi], i) => add(nm.padEnd(10) + r4(co).padStart(11) + r3(se).padStart(11) + r3(z).padStart(11) + r3(p).padStart(11) + r3(lo).padStart(12) + r3(hi).padStart(12), 'par' + i, 'rs-a'));
      add('='.repeat(83), null);
      add(izqP('Ljung-Box (L1) (Q):', m.lb1[0].toFixed(2)) + '   ' + der('Jarque-Bera (JB):', m.jb[0].toFixed(2)), 'lbjb', 'rs-m');
      add(izqP('Prob(Q):', m.lb1[1].toFixed(2)) + '   ' + der('Prob(JB):', m.jb[1].toFixed(2)), 'probs', 'rs-m');
      add(izqP('Heteroskedasticity (H):', m.h[0].toFixed(2)) + '   ' + der('Skew:', m.jb[2].toFixed(2)), 'hskew', 'rs-m');
      add(izqP('Prob(H) (two-sided):', m.h[1].toFixed(2)) + '   ' + der('Kurtosis:', m.jb[3].toFixed(2)), 'probh', 'rs-m');
      add('='.repeat(83), null);
      const X = {
        titulo: 'Reporte de <code>SARIMAXResults.summary()</code>: tres tablas (encabezado, coeficientes y pruebas sobre los residuos).',
        nobs: `<b>No. Observations = ${m.nobs}</b>: los datos que recibió el modelo, antes de diferenciar. La verosimilitud usa ${m.nobs} − ${m.burn} = <b>${ne}</b> (se pierden d + sD = ${m.burn}).`,
        llf: `<b>Log Likelihood = ${r3(m.llf)}</b>: ℓ maximizada. Positiva porque la serie está en logaritmos y los choques son pequeños (σ̂ ≈ ${fmt(Math.sqrt(m.params[m.params.length - 1][1]), 3)}).`,
        aic: `<b>AIC = 2k − 2ℓ</b> = 2(${k}) − 2(${r3(m.llf)}) = ${r3(2 * k - 2 * m.llf)}. k = ${k} parámetros: ${m.params.map(p => p[0]).join(', ')}.`,
        bic: `<b>BIC = k·ln(n) − 2ℓ</b> = ${k}·ln(${ne}) − 2(${r3(m.llf)}) = ${k}(${fmt(Math.log(ne), 4)}) − ${r3(2 * m.llf)} = ${r3(k * Math.log(ne) - 2 * m.llf)}. Usa las ${ne} observaciones efectivas.`,
        hqic: `<b>HQIC = 2k·ln(ln n) − 2ℓ</b> = 2(${k})·ln(ln ${ne}) − 2(${r3(m.llf)}) = ${r3(2 * k * Math.log(Math.log(ne)) - 2 * m.llf)}.`,
        sample: '<b>Sample</b>: primera y última fecha del entrenamiento (enero de 1949 a diciembre de 1959).',
        cov: '<b>Covariance Type: opg</b>: los errores estándar salen del producto exterior de los gradientes de ℓ (una estimación de la información de Fisher).',
        cabcoef: '<b>Columnas</b>: coeficiente estimado, error estándar, z = coef/se, p-value de H₀: coef = 0 e intervalo de 95% (coef ± 1.96·se).',
        lbjb: `<b>Ljung–Box (L1) Q = ${m.lb1[0].toFixed(2)}</b>: autocorrelación de los residuos solo en el rezago 1. <b>Jarque–Bera = ${m.jb[0].toFixed(2)}</b>: (n/6)[S² + (K − 3)²/4] = (${ne}/6)[${fmt(m.jb[2], 4)}² + (${fmt(m.jb[3], 4)} − 3)²/4] ≈ ${fmt(ne / 6 * (m.jb[2] ** 2 + (m.jb[3] - 3) ** 2 / 4), 2)}.`,
        probs: `<b>Prob(Q) = ${m.lb1[1].toFixed(2)}</b> ${m.lb1[1] > 0.05 ? '> 0.05: no hay autocorrelación en el rezago 1 ✓' : '< 0.05: queda autocorrelación en el rezago 1 ✗'}. <b>Prob(JB) = ${m.jb[1].toFixed(2)}</b> ${m.jb[1] > 0.05 ? '> 0.05: compatibles con normalidad ✓' : '< 0.05: no son normales ✗'}.`,
        hskew: `<b>H = ${m.h[0].toFixed(2)}</b>: suma de residuos² del último tercio ÷ la del primer tercio (${Math.round(ne / 3)} observaciones cada uno). ${m.h[0] < 1 ? 'Menor que 1: la varianza bajó.' : 'Mayor que 1: la varianza subió.'} <b>Skew = ${m.jb[2].toFixed(2)}</b>: asimetría (0 en la normal).`,
        probh: `<b>Prob(H) = ${m.h[1].toFixed(2)}</b> ${m.h[1] > 0.05 ? '> 0.05: varianza estable ✓' : '< 0.05: la varianza cambió a lo largo de la muestra ✗ (prueba de dos colas con F(h, h))'}. <b>Kurtosis = ${m.jb[3].toFixed(2)}</b>: 3 en la normal; ${m.jb[3] > 3 ? 'un poco más de colas.' : 'colas ligeras.'}`
      };
      m.params.forEach(([nm, co, se, z, p, lo, hi], i) => {
        X['par' + i] = `<b>${nm}</b>: z = ${r4(co)} / ${fmt(se, 4)} = ${fmt(co / se, 3)}; p = 2(1 − Φ(|z|)) ${p < 0.001 ? '&lt; 0.001' : '= ' + fmt(p, 3)}; IC 95% = ${r4(co)} ± 1.96·${fmt(se, 4)} = [${r3(lo)}, ${r3(hi)}]. ` +
          (nm === 'sigma2' ? `Es la varianza del choque: σ̂ = √${fmt(co, 6)} = ${fmt(Math.sqrt(co), 4)} (≈ ${fmt(100 * Math.sqrt(co), 1)}% por mes en logaritmos).` : p > 0.05 ? '<b>No significativo</b>: el intervalo contiene al 0; prueba el modelo sin este término.' : 'Significativo al 5%: el intervalo no contiene al 0.');
      });
      pre.innerHTML = L.map(l => l.clave ? `<span class="rs-l ${l.clase || ''}" data-k="${l.clave}">${l.t.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</span>` : l.t).join('\n');
      const mostrar = k => { nota.innerHTML = X[k] || ''; pre.querySelectorAll('.rs-l').forEach(s => s.classList.toggle('on', s.dataset.k === k)); };
      pre.querySelectorAll('.rs-l').forEach(s => { s.addEventListener('mouseenter', () => mostrar(s.dataset.k)); s.addEventListener('click', () => mostrar(s.dataset.k)); });
      mostrar('par0');
    }
    dibujar();
  });

  /* ======================= 13 · Diagnóstico de residuos ======================= */
  const lbP = (x, h, mdf = 0) => { const r = TS.ljungBox(x, h); return { Q: r.Q, p: TS.chi2sf(r.Q, h - mdf), df: h - mdf }; };
  function qqTrazas(x, color) {
    const Q = T2.qq(x);
    return [{ x: Q.teo, y: Q.obs, mode: 'markers', marker: { size: 5, color: color || PAL.lav, opacity: 0.8 }, name: 'residuos', hovertemplate: 'teórico %{x:.2f}<br>observado %{y:.2f}<extra></extra>' },
      lin([Q.teo[0], Q.teo[Q.teo.length - 1]], [Q.recta[0], Q.recta[Q.recta.length - 1]], PAL.rosa, 'recta', { line: { color: PAL.rosa, width: 2 } })];
  }
  U.u2qq = qqTrazas;
  function generarResid(tipo, n, semilla) {
    const r = TS.rng(semilla);
    if (tipo === 't5') return rango(n).map(() => { const z = r.normal(); let s = 0; for (let i = 0; i < 5; i++) { const u = r.normal(); s += u * u; } return z / Math.sqrt(s / 5); });
    if (tipo === 't3') return choques('t3', n, semilla).map(v => v * Math.sqrt(3));
    if (tipo === 'chi') return rango(n).map(() => { let s = 0; for (let i = 0; i < 3; i++) { const u = r.normal(); s += u * u; } return (s - 3) / Math.sqrt(6); });
    if (tipo === 'unif') return choques('unif', n, semilla);
    if (tipo === 'atip') return r.normales(n).map((v, i) => (i % 20 === 7 ? v + (i % 40 === 7 ? 5 : -5) : v));
    return r.normales(n);
  }
  R('w2-jb', c => {
    const ctr = lienzo(c);
    let semilla = 2;
    const d = seleccion(ctr, { etiqueta: 'Distribución', valor: 't5', opciones: [['norm', 'Normal'], ['t5', 't de Student, 5 g.l.'], ['t3', 't de Student, 3 g.l.'], ['chi', 'χ² con 3 g.l. (asimétrica)'], ['unif', 'Uniforme'], ['atip', 'Normal con 5% de atípicos']] }, dibujar);
    const n = slider(ctr, { etiqueta: 'n', min: 20, max: 2000, paso: 20, valor: 200 }, dibujar);
    boton(ctr, 'Otra muestra', () => { semilla += 3; dibujar(); });
    const f = fila(c), g1 = lamina(f), g2 = lamina(f), g3 = lamina(f), lec = lectura(c);
    function dibujar() {
      const x = generarResid(d.get(), n.get(), semilla), J = T2.jarqueBera(x), M = T2.momentos(x), lim = Math.max(4, ...x.map(Math.abs));
      graf(g1, [histograma(x, null, 30), curvaNormal(M.media, Math.sqrt(M.var), -lim, lim)], { height: 270, title: { text: 'Histograma' }, showlegend: false, bargap: 0.05 });
      graf(g2, qqTrazas(x), { height: 270, title: { text: 'Q-Q normal' }, showlegend: false, xaxis: { title: { text: 'cuantil teórico' } }, yaxis: { title: { text: 'cuantil observado' } } });
      graf(g3, [{ type: 'bar', x: ['(n/6)·S²', '(n/24)·(K − 3)²'], y: J.partes, marker: { color: [PAL.dur, PAL.lav] }, text: J.partes.map(v => fmt(v, 2)), textposition: 'outside' }, hline(-0.5, 1.5, 5.99, PAL.rosa, 'dash', '')],
        { height: 270, title: { text: `JB = ${fmt(J.jb, 2)} (línea: 5.99 = crítico 5%)` }, showlegend: false, yaxis: { rangemode: 'tozero' } });
      lec.className = 'w-lectura ' + (J.p > 0.05 ? 'ok' : 'mal');
      lec.innerHTML = `S = ${fmt(J.skew, 3)} · K = ${fmt(J.kurt, 3)} · JB = <b>${fmt(J.jb, 3)}</b>, <b>${pq(J.p)}</b> → ${J.p > 0.05 ? 'no se rechaza la normalidad' : 'se rechaza la normalidad'}. ` +
        `De la asimetría viene el ${fmt(100 * J.partes[0] / Math.max(J.jb, 1e-12), 0)}% del estadístico.`;
    }
    dibujar();
  });

  function casoResiduos(tipo) {
    const G = DATOS.rejilla_ap;
    const busca = (o, e) => G.modelos.find(m => m.orden.join() === o && m.estacional.join() === e);
    if (tipo === 'bueno') { const m = busca('0,1,1', '0,1,1'); return { x: m.est, mdf: 2, nombre: 'Aerolínea (0,1,1)(0,1,1)₁₂' }; }
    if (tipo === 'incompleto') { const m = busca('0,1,0', '0,1,0'); return { x: m.est, mdf: 0, nombre: 'Incompleto (0,1,0)(0,1,0)₁₂' }; }
    if (tipo === 'atipicos') return { x: TS.rng(77).normales(119).map((v, i) => [17, 58, 90].includes(i) ? v + (i === 58 ? -5.5 : 4.8) : v), mdf: 0, nombre: 'Simulado con atípicos' };
    const a = T2.simARCH(240, 0.3, 0.7, { semilla: 21 }), s = TS.desv(a.e, 0);
    return { x: a.e.map(v => v / s), mdf: 0, nombre: 'Simulado con volatilidad agrupada (ARCH)' };
  }
  R('w2-residuos', c => {
    if (!DATOS.rejilla_ap) { c.textContent = 'Faltan los datos.'; return; }
    const ctr = lienzo(c);
    const caso = segmentado(ctr, { etiqueta: 'Caso', valor: 'bueno', opciones: [['bueno', 'modelo bueno'], ['incompleto', 'modelo incompleto'], ['atipicos', 'atípicos'], ['arch', 'volatilidad agrupada']] }, dibujar);
    const f1 = fila(c), g1 = lamina(f1), g2 = lamina(f1), f2 = fila(c), g3 = lamina(f2), g4 = lamina(f2), tab = el('div', { class: 'w-tabla' }), lec = lectura(c);
    c.insertBefore(tab, lec);
    const ex = extra(c, 'Vista extra: la ACF de los residuos al cuadrado'), gx = lamina(ex);
    function dibujar() {
      const C = casoResiduos(caso.get()), x = C.x, n = x.length, lim = Math.max(3.5, ...x.map(Math.abs));
      graf(g1, [lin(rango(n, 1), x, PAL.lav, 'residuo', { line: { width: 1, color: PAL.lav } }), hline(1, n, 0, PAL.gris, 'dot', '')], { height: 240, title: { text: 'Residuos estandarizados' }, showlegend: false });
      const xs = rango(81).map(i => -lim + 2 * lim * i / 80);
      graf(g2, [histograma(x, null, 25), lin(xs, T2.kde(x, xs), PAL.dur, 'KDE', { line: { color: PAL.dur, width: 2 } }), lin(xs, xs.map(v => T2.normpdf(v)), PAL.menta, 'N(0,1)', { line: { color: PAL.menta, width: 2, dash: 'dash' } })],
        { height: 240, title: { text: 'Histograma + KDE + N(0,1)' }, legend: { orientation: 'h', y: -0.25 }, bargap: 0.05 });
      graf(g3, qqTrazas(x), { height: 260, title: { text: 'Q-Q normal' }, showlegend: false, xaxis: { title: { text: 'cuantil teórico' } } });
      graf(g4, trazasACF(TS.acf(x, 24), n), layoutACF('Correlograma', { height: 260 }));
      const lb = lbP(x, 12, C.mdf), lb24 = lbP(x, 24, C.mdf), J = T2.jarqueBera(x), H = T2.hetH(x), A = T2.hetArch(x, 12);
      const marca = p => p < 0.05 ? `<b style="color:#c0392b">${fp(p)} ✗</b>` : `${fp(p)} ✓`;
      tab.innerHTML = tablaHTML(['prueba', 'estadístico', 'p-value', 'qué mira'], [
        [`Ljung–Box h = 12 (model_df = ${C.mdf})`, fmt(lb.Q, 2), marca(lb.p), 'autocorrelación'], [`Ljung–Box h = 24`, fmt(lb24.Q, 2), marca(lb24.p), 'autocorrelación'],
        ['Jarque–Bera', fmt(J.jb, 2), marca(J.p), 'normalidad'], ['H (dos colas)', fmt(H.H, 3), marca(H.p), 'varianza al inicio vs al final'], ['ARCH-LM (12 rezagos)', fmt(A.lm, 2), marca(A.p), 'volatilidad agrupada']]);
      const dx = { bueno: 'Todo en orden salvo la prueba H (la varianza bajó con los años, ya lo vimos en el summary).', incompleto: 'Barras grandes en los rezagos 1 y 12: faltan el MA regular y el MA estacional. Ljung–Box rechaza con fuerza.', atipicos: 'Tres puntos enormes en el primer panel: el Q-Q se despega en las puntas y Jarque–Bera rechaza.', arch: 'El correlograma está limpio, pero hay rachas de residuos grandes: ARCH-LM rechaza. Mira la vista extra.' };
      lec.innerHTML = `<b>${C.nombre}</b> (${n} residuos). ${dx[caso.get()]}`;
      graf(gx, trazasACF(TS.acf(x.map(v => v * v), 24), n, { color: PAL.cel }), layoutACF('ACF de los residuos al cuadrado', { height: 230 }));
    }
    dibujar();
  });

  R('py2-diagnostics', c => {
    const G = DATOS.rejilla_ap;
    if (!G) { c.textContent = 'Faltan los datos.'; return; }
    const ctr = lienzo(c);
    let activo = 'modelo';
    const OPC = [['0,1,1|0,1,1', 'aerolínea (0,1,1)(0,1,1)'], ['0,1,0|0,1,0', 'incompleto (0,1,0)(0,1,0)'], ['0,1,1|0,1,0', 'sin MA estacional (0,1,1)(0,1,0)'], ['1,1,0|1,1,0', '(1,1,0)(1,1,0)'], ['2,1,2|1,1,1', 'sobrado (2,1,2)(1,1,1)']];
    const mo = seleccion(ctr, { etiqueta: 'Residuos de', valor: OPC[0][0], opciones: OPC }, () => { activo = 'modelo'; dibujar(); });
    const h = slider(ctr, { etiqueta: 'lags (Ljung–Box)', min: 6, max: 36, paso: 6, valor: 12 }, () => { activo = 'lags'; dibujar(); });
    const md = segmentado(ctr, { etiqueta: 'model_df', valor: 'auto', opciones: [['auto', 'p + q + P + Q'], ['0', '0']] }, () => { activo = 'model_df'; dibujar(); });
    const nl = slider(ctr, { etiqueta: 'nlags (ARCH-LM)', min: 1, max: 24, paso: 1, valor: 12 }, () => { activo = 'nlags'; dibujar(); });
    const pc = panelCodigo(c), lec = lectura(c);
    const params = panelParametros(c, [
      { nombre: 'lags', que: 'Hasta qué rezago acumula Ljung–Box las autocorrelaciones.', rec: '12 y 24 con datos mensuales (uno y dos ciclos); 7 y 14 con datos diarios.' },
      { nombre: 'model_df', que: 'Coeficientes ARMA estimados que se restan a los grados de libertad.', rec: '<code>p + q + P + Q</code> del modelo (sin contar constante ni σ²).' },
      { nombre: 'nlags', que: 'Rezagos de e² en la regresión de ARCH-LM.', rec: '12 con datos mensuales; 5–10 con datos diarios o financieros.' }
    ]);
    function dibujar() {
      const [o, e] = mo.get().split('|'), m = G.modelos.find(x => x.orden.join() === o && x.estacional.join() === e);
      const k = m.orden[0] + m.orden[2] + m.estacional[0] + m.estacional[2], mdf = md.get() === 'auto' ? k : 0, H = h.get(), x = m.resid;
      const args = { order: `(${o.split(',').join(', ')})`, sorder: `(${e.split(',').join(', ')}, 12)`, h: H, mdf, nlags: nl.get() };
      pc.codigo(codigoPython(`from statsmodels.stats.diagnostic import acorr_ljungbox, het_arch\nfrom statsmodels.stats.stattools import jarque_bera\n\nmodelo = SARIMAX(train, order={order}, seasonal_order={sorder}).fit(disp=False)\nresiduos = modelo.resid.iloc[modelo.loglikelihood_burn:]      # sin los primeros d + sD\nprint(acorr_ljungbox(residuos, lags=[{h}], model_df={mdf}))\njb, jb_p, skew, kurt = jarque_bera(residuos)\nprint("JB:", round(jb, 3), "p:", round(jb_p, 4), "| skew:", round(skew, 3), "kurtosis:", round(kurt, 3))\nlm, lm_p, f, f_p = het_arch(residuos, nlags={nlags})\nprint("ARCH-LM:", round(lm, 3), "p:", round(lm_p, 4))`, args,
        activo === 'modelo' ? 'order' : activo === 'lags' ? 'h' : activo === 'model_df' ? 'mdf' : 'nlags'));
      const lb = lbP(x, H, mdf), J = T2.jarqueBera(x), A = T2.hetArch(x, nl.get());
      pc.salida(H > mdf ? `      lb_stat  lb_pvalue\n${String(H).padStart(2)}  ${lb.Q.toFixed(6).padStart(10)}  ${lb.p.toFixed(6).padStart(9)}\nJB: ${J.jb.toFixed(3)} p: ${J.p.toFixed(4)} | skew: ${J.skew.toFixed(3)} kurtosis: ${J.kurt.toFixed(3)}\nARCH-LM: ${A.lm.toFixed(3)} p: ${A.p.toFixed(4)}`
        : 'ValueError: lags debe ser mayor que model_df');
      params({ lags: `[${H}]`, model_df: mdf, nlags: nl.get() }, activo === 'lags' ? 'lags' : activo === 'model_df' ? 'model_df' : activo === 'nlags' ? 'nlags' : null);
      lec.className = 'w-lectura ' + (lb.p > 0.05 && J.p > 0.05 && A.p > 0.05 ? 'ok' : 'aviso');
      lec.innerHTML = `Ljung–Box con ${H} rezagos y ${lb.df} grados de libertad: <b>${pq(lb.p)}</b> ${lb.p > 0.05 ? '✓' : '✗ queda autocorrelación'} · Jarque–Bera ${pq(J.p)} · ARCH-LM ${pq(A.p)}. ` + (mdf === 0 && k > 0 ? '💡 Sin <code>model_df</code> la prueba es demasiado benévola.' : '');
    }
    dibujar();
  });

  /* ======================= 14 · ARCH ======================= */
  const CHI2_95 = [0, 3.841, 5.991, 7.815, 9.488, 11.070, 12.592, 14.067, 15.507, 16.919, 18.307, 19.675, 21.026];
  R('w2-arch', c => {
    const ctr = lienzo(c);
    let semilla = 8;
    const so = slider(ctr, { etiqueta: 'ω', min: 0.05, max: 1, paso: 0.05, valor: 0.2, fmt: num }, dibujar);
    const sa = slider(ctr, { etiqueta: 'α', min: 0, max: 0.9, paso: 0.05, valor: 0.5, fmt: num }, dibujar);
    const sn = slider(ctr, { etiqueta: 'n', min: 200, max: 2000, paso: 100, valor: 500 }, dibujar);
    boton(ctr, 'Otra muestra', () => { semilla += 3; dibujar(); });
    const g1 = lamina(c), f = fila(c), g2 = lamina(f), g3 = lamina(f), lec = lectura(c);
    const ex = extra(c, 'Vista extra: el histograma contra la normal de la misma varianza'), gx = lamina(ex);
    function dibujar() {
      const w = so.get(), a = sa.get(), n = sn.get(), S = T2.simARCH(n, w, a, { semilla }), e = S.e, sd = S.s2.map(Math.sqrt), x = rango(n, 1);
      graf(g1, [bandaTr(x, sd.map(v => -2 * v), sd.map(v => 2 * v), 'rgba(224,112,159,.18)', '±2σ_t'), lin(x, e, PAL.lav, 'ε_t', { line: { width: 1, color: PAL.lav } })],
        { height: 260, title: { text: `ARCH(1) con ω = ${num(w)} y α = ${num(a)}: ε<sub>t</sub> y la banda ±2σ<sub>t</sub>` }, showlegend: false, xaxis: { title: { text: 't' } } });
      graf(g2, trazasACF(TS.acf(e, 20), n), layoutACF('ACF de ε_t: ruido blanco', { height: 260 }));
      const r2 = TS.acf(e.map(v => v * v), 20);
      graf(g3, trazasACF(r2, n, { color: PAL.cel }).concat([teoricoTr(rango(21).map(k => Math.pow(a, k)), 1, 'α^k')]), layoutACF('ACF de ε²_t: memoria en la varianza', { height: 260 }));
      const M = T2.momentos(e), A = T2.hetArch(e, 5), kt = 3 * a * a < 1 ? 3 * (1 - a * a) / (1 - 3 * a * a) : Infinity;
      lec.className = 'w-lectura ' + (A.p < 0.05 ? 'aviso' : 'ok');
      lec.innerHTML = `Varianza muestral ${fmt(M.var, 3)} (teórica ω/(1 − α) = ${fmt(w / (1 - a), 3)}) · curtosis muestral ${fmt(M.kurt, 2)} (teórica ${isFinite(kt) ? fmt(kt, 2) : '∞: 3α² ≥ 1'}) · ARCH-LM (5 rezagos): LM = ${fmt(A.lm, 2)}, <b>${pq(A.p)}</b> ${A.p < 0.05 ? '→ hay efectos ARCH' : '→ sin evidencia de efectos ARCH'}.`;
      const lim = Math.max(...e.map(Math.abs));
      graf(gx, [histograma(e, null, 50), curvaNormal(0, Math.sqrt(M.var), -lim, lim, PAL.rosa, 'normal')], { height: 260, title: { text: 'ARCH: más valores cerca de 0 y más extremos que la normal' }, showlegend: false, bargap: 0.05 });
    }
    dibujar();
  });

  R('w2-archlm', c => {
    const ctr = lienzo(c);
    let semilla = 30;
    const sa = slider(ctr, { etiqueta: 'α (efecto ARCH)', min: 0, max: 0.8, paso: 0.05, valor: 0.4, fmt: num }, dibujar);
    const sn = slider(ctr, { etiqueta: 'n', min: 100, max: 1000, paso: 50, valor: 300 }, dibujar);
    boton(ctr, 'Otra muestra', () => { semilla += 3; dibujar(); });
    const f = fila(c), g1 = lamina(f), g2 = lamina(f), lec = lectura(c);
    const ex = extra(c, 'Vista extra: la regresión con un rezago'), tab = el('div', { class: 'w-tabla' });
    ex.append(tab);
    function dibujar() {
      const a = sa.get(), n = sn.get(), e = T2.simARCH(n, 1 - a, a, { semilla }).e, e2 = e.map(v => v * v);
      const xs = e2.slice(0, -1), ys = e2.slice(1), A1 = T2.hetArch(e, 1), x1 = Math.max(...xs);
      graf(g1, [dispersion(xs, ys, 'rgba(124,105,214,.45)'), lin([0, x1], [A1.beta[0], A1.beta[0] + A1.beta[1] * x1], PAL.rosa, 'recta', { line: { color: PAL.rosa, width: 2.4 } })],
        { height: 300, title: { text: `e²_t contra e²_(t−1): pendiente ${fmt(A1.beta[1], 3)}, R² = ${fmt(A1.r2, 3)}` }, showlegend: false, xaxis: { title: { text: 'e²_(t−1)' } }, yaxis: { title: { text: 'e²_t' } } });
      const qs = rango(12, 1), lms = qs.map(q => T2.hetArch(e, q).lm);
      graf(g2, [{ type: 'bar', x: qs, y: lms, marker: { color: lms.map((v, i) => v > CHI2_95[i + 1] ? PAL.dur : 'rgba(124,105,214,.7)') }, name: 'LM' }, lin(qs, qs.map(q => CHI2_95[q]), PAL.rosa, 'crítico 5%', { line: { dash: 'dash', color: PAL.rosa, width: 2 } })],
        { height: 300, title: { text: 'LM = n′R² según el número de rezagos q' }, xaxis: { title: { text: 'q' }, dtick: 1 }, legend: { orientation: 'h', y: -0.3 } });
      lec.className = 'w-lectura ' + (A1.p < 0.05 ? 'aviso' : 'ok');
      lec.innerHTML = `Con q = 1: LM = ${A1.n}·${fmt(A1.r2, 4)} = <b>${fmt(A1.lm, 2)}</b>, <b>${pq(A1.p)}</b>. ` + (a === 0 ? 'Sin efecto ARCH, la nube no tiene inclinación y LM queda bajo la línea crítica casi siempre.' : 'Barras naranjas = se rechaza H₀ (sin efectos ARCH) con ese número de rezagos.');
      tab.innerHTML = tablaHTML(['cantidad', 'valor'], [['a₀ (constante)', fmt(A1.beta[0], 4)], ['a₁ (pendiente)', fmt(A1.beta[1], 4)], ['R²', fmt(A1.r2, 4)], ["n′ (pares usados)", A1.n], ['LM = n′R²', fmt(A1.lm, 3)], ['p = P(χ²₁ > LM)', fp(A1.p)]]);
    }
    dibujar();
  });

  /* ======================= 15 · Validación ======================= */
  R('w2-validacion', c => {
    const ctr = lienzo(c);
    let semilla = 4;
    const sp = slider(ctr, { etiqueta: 'Proporción de prueba', min: 0.1, max: 0.3, paso: 0.05, valor: 0.15, fmt: v => Math.round(v * 100) + '%' }, dibujar);
    boton(ctr, 'Otra partición aleatoria', () => { semilla += 5; dibujar(); });
    const g1 = lamina(c), g2 = lamina(c), lec = lectura(c);
    function dibujar() {
      const n = AP.length, k = Math.round(sp.get() * n), r = TS.rng(semilla);
      // Aleatoria: k meses al azar (sin los extremos), cada uno «pronosticado» con el promedio de sus vecinos de entrenamiento
      const idx = rango(n - 2, 1), prueba = new Set();
      while (prueba.size < k) prueba.add(idx[Math.floor(r.unif() * idx.length)]);
      const vecino = (i, paso) => { let j = i + paso; while (j >= 0 && j < n && prueba.has(j)) j += paso; return j >= 0 && j < n ? AP[j] : null; };
      const errA = [...prueba].map(i => { const a = vecino(i, -1), b = vecino(i, 1), p = a !== null && b !== null ? (a + b) / 2 : (a || b); return Math.abs(AP[i] - p) / AP[i]; });
      // Temporal: los últimos k meses, con ingenuo estacional y crecimiento anual estimado con el entrenamiento
      const T = n - k, g = TS.media(AP.slice(T - 12, T)) / TS.media(AP.slice(T - 24, T - 12)), ext = AP.slice(0, T);
      for (let i = T; i < n; i++) ext.push(ext[i - 12] * g);
      const errT = rango(k).map(j => Math.abs(AP[T + j] - ext[T + j]) / AP[T + j]);
      const colA = AP.map((_, i) => prueba.has(i) ? PAL.rosa : 'rgba(124,105,214,.6)'), colT = AP.map((_, i) => i >= T ? PAL.rosa : 'rgba(124,105,214,.6)');
      const A = apilado([{ x: FECHAS_AP, y: AP, color: PAL.gris, nombre: 'aleatoria' }, { x: FECHAS_AP, y: AP, color: PAL.gris, nombre: 'temporal' }], 360);
      A.tr[0] = Object.assign(A.tr[0], { mode: 'lines+markers', marker: { color: colA, size: 5 }, line: { color: '#ddd8ee', width: 1 } });
      A.tr[1] = Object.assign(A.tr[1], { mode: 'lines+markers', marker: { color: colT, size: 5 }, line: { color: '#ddd8ee', width: 1 } });
      A.L.annotations = [{ text: 'Partición aleatoria (rosa = prueba)', xref: 'paper', yref: 'paper', x: 0, y: 1.06, showarrow: false, xanchor: 'left', font: { size: 11 } }, { text: 'Partición temporal (rosa = prueba)', xref: 'paper', yref: 'paper', x: 0, y: 0.47, showarrow: false, xanchor: 'left', font: { size: 11 } }];
      graf(g1, A.tr, A.L);
      const mA = 100 * TS.media(errA), mT = 100 * TS.media(errT);
      graf(g2, [{ type: 'bar', x: ['aleatoria (interpola)', 'temporal (pronostica)'], y: [mA, mT], marker: { color: [PAL.rosa, PAL.menta] }, text: [fmt(mA, 2) + '%', fmt(mT, 2) + '%'], textposition: 'outside' }],
        { height: 250, title: { text: 'MAPE en la prueba' }, showlegend: false, yaxis: { rangemode: 'tozero', title: { text: 'MAPE %' } } });
      lec.className = 'w-lectura aviso';
      lec.innerHTML = `Con ${k} meses de prueba: la partición aleatoria da MAPE = <b>${fmt(mA, 2)}%</b>; la temporal, <b>${fmt(mT, 2)}%</b>. La aleatoria es ${fmt(mT / mA, 1)} veces más optimista porque «ve» meses del futuro.`;
    }
    dibujar();
  });

  R('w2-unpaso', c => {
    const V = DATOS.validacion_ap;
    if (!V) { c.textContent = 'Faltan los datos.'; return; }
    const ctr = lienzo(c);
    const v1 = casilla(ctr, 'Mostrar a un paso', true, dibujar), v2 = casilla(ctr, 'Mostrar a 12 pasos', true, dibujar);
    const g = lamina(c), lec = lectura(c);
    const ex = extra(c, 'Vista extra: los dos pronósticos mes por mes'), tab = el('div', { class: 'w-tabla' });
    ex.append(tab);
    function dibujar() {
      const xs = V.fechas.slice(108), xt = V.fechas.slice(132), real = V.serie.slice(132), E = a => a.map(Math.exp);
      const tr = [lin(xs.slice(0, 24), V.serie.slice(108, 132), '#45397a', 'datos hasta 1959', { line: { color: '#45397a', width: 1.6 } })];
      if (v2.get()) tr.push(bandaTr(xt, E(V.multi.inf), E(V.multi.sup), 'rgba(224,112,159,.15)', ''), lin(xt, E(V.multi.media), PAL.rosa, 'a 12 pasos', { line: { color: PAL.rosa, width: 2.3 } }));
      if (v1.get()) tr.push(bandaTr(xt, E(V.uno.inf), E(V.uno.sup), 'rgba(63,174,138,.18)', ''), lin(xt, E(V.uno.media), PAL.menta, 'a un paso', { line: { color: PAL.menta, width: 2.3, dash: 'dot' } }));
      tr.push({ x: xt, y: real, mode: 'markers', marker: { color: '#45397a', size: 7 }, name: 'real 1960' });
      graf(g, tr, { height: 330, title: { text: '1960: pronóstico a un paso contra pronóstico a 12 pasos' }, legend: { orientation: 'h', y: -0.2 } });
      const m = a => 100 * TS.media(real.map((r, i) => Math.abs(r - Math.exp(a[i])) / r));
      lec.innerHTML = `MAPE a un paso: <b>${fmt(m(V.uno.media), 2)}%</b> · a 12 pasos: <b>${fmt(m(V.multi.media), 2)}%</b>. En este año quedaron parecidos (incluso un poco mejor el de 12 pasos, por azar), pero la banda a un paso es mucho más angosta: ${fmt(Math.exp(V.uno.sup[11]) - Math.exp(V.uno.inf[11]), 0)} contra ${fmt(Math.exp(V.multi.sup[11]) - Math.exp(V.multi.inf[11]), 0)} pasajeros en diciembre.`;
      tab.innerHTML = tablaHTML(['mes', 'real', 'a un paso', 'error %', 'a 12 pasos', 'error %'], xt.map((x, i) => [x.slice(0, 7), fmt(real[i], 0), fmt(Math.exp(V.uno.media[i]), 1), fmt(100 * (real[i] - Math.exp(V.uno.media[i])) / real[i], 2), fmt(Math.exp(V.multi.media[i]), 1), fmt(100 * (real[i] - Math.exp(V.multi.media[i])) / real[i], 2)]));
    }
    dibujar();
  });

  R('w2-estrategias', c => {
    const ctr = lienzo(c);
    let semilla = 500;
    const mod = segmentado(ctr, { etiqueta: 'Modelo ajustado', valor: 'ar1', opciones: [['ar1', 'AR(1): mal especificado'], ['ar2', 'AR(2): correcto']] }, dibujar);
    const sn = slider(ctr, { etiqueta: 'n de entrenamiento', min: 50, max: 400, paso: 50, valor: 150 }, dibujar);
    boton(ctr, 'Repetir', () => { semilla += 1000; dibujar(); });
    const g = lamina(c), lec = lectura(c);
    const ex = extra(c, 'Vista extra: error cuadrático medio por horizonte'), tab = el('div', { class: 'w-tabla' });
    ex.append(tab);
    function dibujar() {
      const H = 10, R_ = 200, n = sn.get(), p = mod.get() === 'ar1' ? 1 : 2, ar = [1, -0.3, -0.5];
      const mse = { rec: new Array(H).fill(0), dir: new Array(H).fill(0), opt: new Array(H).fill(0) };
      for (let r = 0; r < R_; r++) {
        const y = T2.simularARMA(ar, [1], n + H, { semilla: semilla + r, quemado: 200 }).y, tr = y.slice(0, n), fut = y.slice(n);
        const A = T2.ajustarAR(tr, p);
        const ext = tr.slice();
        for (let h = 0; h < H; h++) { let v = A.beta[0]; for (let j = 1; j <= p; j++) v += A.beta[j] * ext[ext.length - j]; ext.push(v); }
        const opt = T2.pronosticar(tr, ar, [1], H, {}).media;
        for (let h = 1; h <= H; h++) {
          const X = [], z = [];
          for (let t = p - 1; t + h < n; t++) { const f = [1]; for (let j = 0; j < p; j++) f.push(tr[t - j]); X.push(f); z.push(tr[t + h]); }
          const b = TS.ols(X, z).beta;
          let d = b[0]; for (let j = 0; j < p; j++) d += b[j + 1] * tr[n - 1 - j];
          mse.rec[h - 1] += (fut[h - 1] - ext[n + h - 1]) ** 2 / R_;
          mse.dir[h - 1] += (fut[h - 1] - d) ** 2 / R_;
          mse.opt[h - 1] += (fut[h - 1] - opt[h - 1]) ** 2 / R_;
        }
      }
      const hs = rango(H, 1);
      graf(g, [lin(hs, mse.rec, PAL.lav, 'recursiva', { mode: 'lines+markers' }), lin(hs, mse.dir, PAL.rosa, 'directa', { mode: 'lines+markers' }), lin(hs, mse.opt, PAL.gris, 'modelo verdadero (óptimo)', { line: { dash: 'dot', color: PAL.gris } })],
        { height: 320, title: { text: `Datos AR(2) con φ = (0.3, 0.5); se ajusta un AR(${p})` }, xaxis: { title: { text: 'horizonte h' }, dtick: 1 }, yaxis: { title: { text: 'error cuadrático medio' } }, legend: { orientation: 'h', y: -0.25 } });
      const gana = hs.filter(h => mse.dir[h - 1] < mse.rec[h - 1]).length;
      lec.innerHTML = p === 1 ? `Con el modelo mal especificado, la directa gana en ${gana} de ${H} horizontes: cada modelo directo aprende la relación real entre y<sub>t</sub> y y<sub>t+h</sub>, mientras la recursiva arrastra el error del AR(1).`
        : `Con el modelo correcto, la recursiva y la directa casi coinciden (la directa gana en ${gana} de ${H} horizontes) y las dos se acercan al óptimo.`;
      tab.innerHTML = tablaHTML(['h', 'recursiva', 'directa', 'óptimo'], hs.map(h => [h, fmt(mse.rec[h - 1], 3), fmt(mse.dir[h - 1], 3), fmt(mse.opt[h - 1], 3)]));
    }
    dibujar();
  });

  R('w2-rolling', c => {
    const V = DATOS.validacion_ap;
    if (!V) { c.textContent = 'Faltan los datos.'; return; }
    const MOD = [['aerolinea', 'aerolínea (0,1,1)(0,1,1)', PAL.rosa, 'aerolínea'], ['ar_est', '(1,1,0)(1,1,0)', PAL.dur, '(1,1,0)(1,1,0)'], ['arima', 'ARIMA(1,1,1) sin estacionalidad', PAL.cel, 'ARIMA sin est.'], ['ingenuo_est', 'ingenuo estacional', PAL.menta, 'ingenuo est.'], ['ingenuo', 'ingenuo', PAL.gris, 'ingenuo']];
    const ctr = lienzo(c);
    const so = slider(ctr, { etiqueta: 'Origen', min: 0, max: V.origenes.length - 1, paso: 1, valor: 6, fmt: i => V.fechas[V.origenes[i] - 1].slice(0, 7) }, dibujar);
    const g1 = lamina(c), f = fila(c), g2 = lamina(f), g3 = lamina(f), lec = lectura(c);
    const ex = extra(c, 'Vista extra: MAE y MAPE totales de cada modelo'), tab = el('div', { class: 'w-tabla' });
    ex.append(tab);
    const s = V.serie, err = {}, errp = {};
    MOD.forEach(([k]) => { err[k] = V.origenes.map((T, i) => V.pred[k][i].map((p, h) => Math.abs(s[T + h] - p))); errp[k] = V.origenes.map((T, i) => V.pred[k][i].map((p, h) => Math.abs(s[T + h] - p) / s[T + h])); });
    const porH = k => rango(12).map(h => TS.media(err[k].map(e => e[h]))), total = k => TS.media(err[k].flat()), totalP = k => 100 * TS.media(errp[k].flat());
    function dibujar() {
      const i = so.get(), T = V.origenes[i], xs = V.fechas;
      const tr = [lin(xs.slice(0, T), s.slice(0, T), '#9a94b8', 'entrenamiento', { line: { color: '#9a94b8', width: 1.4 } }), { x: xs.slice(T, T + 12), y: s.slice(T, T + 12), mode: 'markers', marker: { color: '#45397a', size: 7 }, name: 'real' }];
      MOD.forEach(([k, nm, col]) => tr.push(lin(xs.slice(T, T + 12), V.pred[k][i], col, nm, { line: { color: col, width: 2 } })));
      graf(g1, tr, { height: 320, title: { text: `Origen ${xs[T - 1].slice(0, 7)}: ${T} meses de entrenamiento, pronóstico de los 12 siguientes` }, xaxis: { range: [xs[Math.max(0, T - 48)], xs[Math.min(143, T + 12)]] }, legend: { orientation: 'h', y: -0.25 } });
      graf(g2, MOD.map(([k, nm, col]) => lin(rango(12, 1), porH(k), col, nm, { mode: 'lines+markers', marker: { size: 5 } })), { height: 300, title: { text: 'MAE promedio por horizonte (13 orígenes)' }, xaxis: { title: { text: 'h' }, dtick: 1 }, showlegend: false });
      graf(g3, [{ type: 'bar', x: MOD.map(m => m[3]), y: MOD.map(m => total(m[0])), marker: { color: MOD.map(m => m[2]) }, text: MOD.map(m => fmt(total(m[0]), 1)), textposition: 'outside' }], { height: 300, title: { text: 'MAE total' }, showlegend: false, yaxis: { rangemode: 'tozero' } });
      lec.innerHTML = `En este origen, MAE de 12 meses: ` + MOD.map(([k, nm, col, corto]) => `${corto} ${fmt(TS.media(err[k][i]), 1)}`).join(' · ') + '. Sobre los 13 orígenes, aerolínea y (1,1,0)(1,1,0) quedan prácticamente empatados y muy por debajo de los ingenuos.';
      tab.innerHTML = tablaHTML(['modelo', 'MAE total', 'MAPE total %', 'MAE h = 1', 'MAE h = 12'], MOD.map(([k, nm]) => [nm, fmt(total(k), 2), fmt(totalP(k), 2), fmt(porH(k)[0], 1), fmt(porH(k)[11], 1)]));
    }
    dibujar();
  });

  /* ======================= 16 · Métricas ======================= */
  R('w2-metricas', c => {
    const ctr = lienzo(c);
    const Y = [100, 110, 120, 130, 125, 140], F = [92, 114, 118, 136, 128, 133], TR = [90, 95, 100, 98, 105, 102];
    const ss = slider(ctr, { etiqueta: 'Sesgo del pronóstico', min: -20, max: 20, paso: 1, valor: 0, fmt: v => (v > 0 ? '+' : '') + v }, dibujar);
    const sd = slider(ctr, { etiqueta: 'Acercar la serie a cero', min: 0, max: 95, paso: 5, valor: 0, fmt: v => '−' + v }, dibujar);
    const at = casilla(ctr, 'Agregar un error atípico (+50 en t = 4)', false, dibujar);
    const f = fila(c), g1 = lamina(f), g2 = lamina(f), lec = lectura(c);
    const ex = extra(c, 'Vista extra: el aporte de cada periodo'), tab = el('div', { class: 'w-tabla' });
    ex.append(tab);
    function dibujar() {
      const D = sd.get(), y = Y.map(v => v - D), fc = F.map((v, i) => v + ss.get() + (at.get() && i === 3 ? 50 : 0) - D), tr = TR.map(v => v - D);
      const M = T2.metricas(y, fc, { entrenamiento: tr, m: 1 }), t = rango(6, 1);
      const seg = []; t.forEach((x, i) => seg.push({ x: [x, x], y: [y[i], fc[i]], mode: 'lines', line: { color: 'rgba(224,112,159,.6)', width: 3 }, hoverinfo: 'skip', showlegend: false }));
      graf(g1, seg.concat([{ x: t, y, mode: 'markers', marker: { size: 11, color: '#45397a' }, name: 'real' }, { x: t, y: fc, mode: 'markers', marker: { size: 11, symbol: 'diamond', color: PAL.rosa }, name: 'pronóstico' }]),
        { height: 300, title: { text: 'Real contra pronóstico (segmentos = errores)' }, xaxis: { title: { text: 't' }, dtick: 1 }, legend: { orientation: 'h', y: -0.25 } });
      const nombres = ['MAE', 'RMSE', 'MAPE %', 'sMAPE %', 'MASE × 10'], vals = [M.mae, M.rmse, M.mape, M.smape, 10 * M.mase];
      graf(g2, [{ type: 'bar', x: nombres, y: vals, marker: { color: [PAL.lav, PAL.dur, PAL.rosa, PAL.cel, PAL.menta] }, text: [fmt(M.mae, 2), fmt(M.rmse, 2), fmt(M.mape, 2) + '%', fmt(M.smape, 2) + '%', fmt(M.mase, 3)], textposition: 'outside' }],
        { height: 300, title: { text: 'Las métricas (MASE multiplicado por 10 para que se vea)' }, showlegend: false, yaxis: { rangemode: 'tozero' } });
      lec.className = 'w-lectura ' + (M.mape > 30 ? 'mal' : '');
      lec.innerHTML = `MAE = <b>${fmt(M.mae, 2)}</b> · MSE = ${fmt(M.mse, 2)} · RMSE = <b>${fmt(M.rmse, 2)}</b> (RMSE/MAE = ${fmt(M.rmse / M.mae, 2)}) · MAPE = <b>${fmt(M.mape, 2)}%</b> · sMAPE = ${fmt(M.smape, 2)}% · MASE = <b>${fmt(M.mase, 3)}</b> ${M.mase < 1 ? '(mejor que el ingenuo)' : '(peor que el ingenuo)'}. ` +
        (D >= 80 ? '⚠️ Con la serie cerca de cero el MAPE se dispara aunque los errores absolutos sean los mismos.' : at.get() ? '💡 El atípico infla más el RMSE que el MAE.' : '');
      tab.innerHTML = tablaHTML(['t', 'y', 'ŷ', 'e', '|e|', 'e²', '|e|/y (%)', 'sMAPE (%)'], t.map((x, i) => { const e = y[i] - fc[i]; return [x, num(y[i]), num(fc[i]), num(e), num(Math.abs(e)), num(e * e), fmt(100 * Math.abs(e / y[i]), 2), fmt(200 * Math.abs(e) / (Math.abs(y[i]) + Math.abs(fc[i])), 2)]; }));
    }
    dibujar();
  });

  function pronosticos1960() {
    const G = DATOS.rejilla_ap, b = (o, e) => G.modelos.find(m => m.orden.join() === o && m.estacional.join() === e);
    const trY = G.log_tr.map(Math.exp), real = G.log_te.map(Math.exp);
    return { trY, real, fechas: G.fechas_te, mods: [
      { k: 'aero', n: 'aerolínea (0,1,1)(0,1,1)', p: b('0,1,1', '0,1,1').fc.map(Math.exp), c: PAL.rosa },
      { k: 'v1', n: '(1,1,1)(0,1,1)', p: b('1,1,1', '0,1,1').fc.map(Math.exp), c: PAL.dur },
      { k: 'v2', n: '(2,1,2)(1,1,1)', p: b('2,1,2', '1,1,1').fc.map(Math.exp), c: PAL.cel },
      { k: 'ie', n: 'ingenuo estacional', p: trY.slice(-12), c: PAL.menta },
      { k: 'in', n: 'ingenuo', p: new Array(12).fill(trY[trY.length - 1]), c: PAL.gris }] };
  }
  R('w2-metricas-modelos', c => {
    if (!DATOS.rejilla_ap) { c.textContent = 'Faltan los datos.'; return; }
    const P = pronosticos1960();
    const ctr = lienzo(c);
    const met = segmentado(ctr, { etiqueta: 'Métrica', valor: 'mape', opciones: [['mae', 'MAE'], ['rmse', 'RMSE'], ['mape', 'MAPE'], ['smape', 'sMAPE'], ['mase', 'MASE']] }, dibujar);
    const f = fila(c), g1 = lamina(f), g2 = lamina(f), lec = lectura(c);
    const ex = extra(c, 'Vista extra: las seis métricas de cada modelo'), tab = el('div', { class: 'w-tabla' });
    ex.append(tab);
    const M = P.mods.map(m => Object.assign({ M: T2.metricas(P.real, m.p, { entrenamiento: P.trY, m: 12 }) }, m));
    function dibujar() {
      graf(g1, [{ x: P.fechas, y: P.real, mode: 'markers', marker: { size: 8, color: '#45397a' }, name: 'real 1960' }].concat(M.map(m => lin(P.fechas, m.p, m.c, m.n, { line: { color: m.c, width: 2 } }))),
        { height: 320, title: { text: 'Pronósticos de 1960' }, legend: { orientation: 'h', y: -0.3 } });
      const k = met.get(), v = M.map(m => m.M[k]), orden = M.map((m, i) => i).sort((a, b) => v[a] - v[b]);
      graf(g2, [{ type: 'bar', x: M.map(m => m.n.split(' (')[0].replace('aerolínea', 'aerolínea')), y: v, marker: { color: M.map(m => m.c) }, text: v.map(x => fmt(x, k === 'mase' ? 3 : 2)), textposition: 'outside' }],
        { height: 320, title: { text: `${k.toUpperCase()} en 1960` }, showlegend: false, yaxis: { rangemode: 'tozero' } });
      lec.innerHTML = `Orden según ${k.toUpperCase()}: ` + orden.map(i => M[i].n).join(' → ') + '. ' + (k === 'mase' ? `Escala: MAE del ingenuo estacional en el entrenamiento = ${fmt(M[0].M.escala, 2)}.` : '');
      tab.innerHTML = tablaHTML(['modelo', 'MAE', 'MSE', 'RMSE', 'MAPE %', 'sMAPE %', 'MASE'], M.map(m => [m.n, fmt(m.M.mae, 2), fmt(m.M.mse, 1), fmt(m.M.rmse, 2), fmt(m.M.mape, 3), fmt(m.M.smape, 3), fmt(m.M.mase, 4)]));
    }
    dibujar();
  });

  R('py2-metricas', c => {
    if (!DATOS.rejilla_ap) { c.textContent = 'Faltan los datos.'; return; }
    const P = pronosticos1960();
    const ctr = lienzo(c);
    let activo = 'modelo';
    const mo = segmentado(ctr, { etiqueta: 'Pronóstico', valor: 'aero', opciones: [['aero', 'aerolínea'], ['ie', 'ingenuo estacional']] }, () => { activo = 'modelo'; dibujar(); });
    const rm = segmentado(ctr, { etiqueta: 'RMSE con', valor: 'root', opciones: [['root', 'root_mean_squared_error'], ['sqrt', 'np.sqrt(MSE)'], ['viejo', 'squared=False']] }, () => { activo = 'rmse'; dibujar(); });
    const ms = segmentado(ctr, { etiqueta: 'Escala del MASE', valor: '12', opciones: [['1', 'ingenuo simple (m = 1)'], ['12', 'ingenuo estacional (m = 12)']] }, () => { activo = 'm'; dibujar(); });
    const pc = panelCodigo(c), lec = lectura(c);
    function dibujar() {
      const m = P.mods.find(x => x.k === mo.get()), mm = +ms.get(), M = T2.metricas(P.real, m.p, { entrenamiento: P.trY, m: mm });
      const lineaR = { root: 'rmse = root_mean_squared_error(real, pron)', sqrt: 'rmse = np.sqrt(mean_squared_error(real, pron))', viejo: 'rmse = mean_squared_error(real, pron, squared=False)' }[rm.get()];
      const args = { pron: mo.get() === 'aero' ? 'np.exp(ajuste_def.get_forecast(12).predicted_mean.values)' : 'serie.iloc[-24:-12].values           # ingenuo estacional', linea: lineaR, m: mm };
      pc.codigo(codigoPython(`from sklearn.metrics import mean_absolute_error, mean_squared_error, root_mean_squared_error, mean_absolute_percentage_error\n\nreal = serie.iloc[-12:].values\npron = {pron}\nmae = mean_absolute_error(real, pron)\n{linea}\nmape = 100 * mean_absolute_percentage_error(real, pron)\nentrena = serie.iloc[:-12].values\nescala = np.mean(np.abs(entrena[{m}:] - entrena[:-{m}]))\nprint(f"MAE = {mae:.3f} | RMSE = {rmse:.3f} | MAPE = {mape:.3f}% | MASE = {mae / escala:.4f}")`, args, activo === 'modelo' ? 'pron' : activo === 'rmse' ? 'linea' : 'm'));
      pc.salida(rm.get() === 'viejo' ? "TypeError: got an unexpected keyword argument 'squared'" : `MAE = ${M.mae.toFixed(3)} | RMSE = ${M.rmse.toFixed(3)} | MAPE = ${M.mape.toFixed(3)}% | MASE = ${M.mase.toFixed(4)}`);
      lec.className = 'w-lectura ' + (rm.get() === 'viejo' ? 'mal' : '');
      lec.innerHTML = rm.get() === 'viejo' ? 'Con scikit-learn 1.6 o posterior, <code>squared=False</code> ya no existe: usa una de las otras dos formas.' : `Escala del MASE con m = ${mm}: ${fmt(M.escala, 2)}. ${mm === 1 ? 'El ingenuo simple se equivoca mucho en una serie estacional, así que el MASE sale engañosamente bajo.' : 'Con datos estacionales, la escala estacional es la referencia justa.'}`;
    }
    dibujar();
  });

  /* ======================= 16b · Modelos de referencia ======================= */
  const REF_K = ['ha', 'n', 'sn', 'rwd'];
  const REF_ES = { ha: 'Promedio', n: 'Ingenuo', sn: 'Estacional', rwd: 'Deriva' };
  const REF_COL = { ha: PAL.cel, n: PAL.dur, sn: PAL.rosa, rwd: PAL.menta };
  const rgba = (hex, a) => { const v = parseInt(hex.slice(1), 16); return `rgba(${v >> 16},${(v >> 8) & 255},${v & 255},${a})`; };
  const SERIES_REF = (() => {
    const r1 = TS.rng(423).normales(250, 2.2); let p = 150; const accion = r1.map(e => (p += e));
    const r2 = TS.rng(402).normales(40, 3), e4 = [12, -4, -15, 7]; const trim = r2.map((e, i) => 100 + e4[i % 4] + e);
    const r3 = TS.rng(401).normales(120, 1.2); let q = 50; const tend = r3.map(e => (q += 0.8 + e));
    const estable = TS.rng(402).normales(120, 8).map(e => 200 + e);
    return {
      ap: { nombre: 'AirPassengers (mensual)', y: AP, x: FECHAS_AP, m: 12, h: 12, hMax: 36, ganador: 'sn' },
      accion: { nombre: 'Precio de una acción (días hábiles)', y: accion, x: rango(250, 1), m: 5, h: 20, hMax: 60, ganador: 'n' },
      trim: { nombre: 'Producción trimestral (estacional)', y: trim, x: rango(40, 1), m: 4, h: 8, hMax: 12, ganador: 'sn' },
      tend: { nombre: 'Serie con tendencia', y: tend, x: rango(120, 1), m: 12, h: 12, hMax: 36, ganador: 'rwd' },
      estable: { nombre: 'Ventas estables (ruido alrededor de una media)', y: estable, x: rango(120, 1), m: 12, h: 12, hMax: 36, ganador: 'ha' }
    };
  })();
  const opcionesSerieRef = () => Object.keys(SERIES_REF).map(k => [k, SERIES_REF[k].nombre]);
  const COMENTARIO_REF = {
    ap: 'AirPassengers tiene tendencia <b>y</b> estacionalidad: el estacional copia bien la forma, pero 1960 queda por arriba porque la serie siguió creciendo. Ninguna referencia basta; el SARIMA de aerolínea baja el MAPE a 2.9%.',
    accion: 'En un paseo aleatorio lo mejor que se sabe del futuro es el último precio: el ingenuo es el modelo correcto. Con otra muestra podría ganar la deriva por azar, pero no de forma sistemática.',
    trim: 'Con una estacionalidad fuerte y sin tendencia, copiar el mismo trimestre del año anterior es casi imbatible.',
    tend: 'La serie sube de forma persistente: la deriva prolonga esa subida y el ingenuo se queda atrás cada vez más.',
    estable: 'Sin tendencia ni memoria, el mejor pronóstico es la media: el ingenuo y la deriva persiguen el ruido del último dato.'
  };

  R('w2-ref-metodos', c => {
    const ctr = lienzo(c);
    const se = seleccion(ctr, { etiqueta: 'Serie', valor: 'ap', opciones: opcionesSerieRef() }, () => { const S = SERIES_REF[se.get()]; hs.config({ min: 2, max: S.hMax, paso: 1, valor: S.h }); dibujar(); });
    const hs = slider(ctr, { etiqueta: 'Periodos de prueba', min: 2, max: 36, paso: 1, valor: 12 }, dibujar);
    const rs = seleccion(ctr, { etiqueta: 'Resaltar', valor: 'todos', opciones: [['todos', 'ninguno (todos iguales)']].concat(REF_K.map(k => [k, REF_ES[k]])) }, dibujar);
    const g = lamina(c), tab = el('div', { class: 'w-tabla' }), lec = lectura(c);
    c.insertBefore(tab, lec);
    const ex = extra(c, 'Vista extra: los primeros pronósticos, como los devuelve sf.forecast()'), tx = el('div', { class: 'w-tabla' });
    ex.append(tx);
    function dibujar() {
      const S = SERIES_REF[se.get()], h = hs.get(), n = S.y.length, tr = S.y.slice(0, n - h), te = S.y.slice(n - h);
      const P = T2.refPronostico(tr, h, { m: S.m }), xt = S.x.slice(0, n - h), xf = S.x.slice(n - h), r = rs.get();
      const M = {};
      REF_K.forEach(k => { M[k] = T2.metricas(te, P[k].media, { entrenamiento: tr, m: S.m }); });
      const orden = REF_K.slice().sort((a, b) => M[a].mae - M[b].mae), mejor = orden[0];
      const trazas = [lin(xt, tr, '#45397a', 'entrenamiento', { line: { color: '#45397a', width: 1.4 } }),
        { x: xf, y: te, mode: 'markers', marker: { color: PAL.menta, size: 7, line: { color: '#fff', width: 1 } }, name: 'prueba (real)' }];
      REF_K.forEach(k => {
        const fuerte = r === k, tenue = r !== 'todos' && !fuerte;
        trazas.push(lin([xt[xt.length - 1]].concat(xf), [tr[tr.length - 1]].concat(P[k].media), REF_COL[k], REF_ES[k],
          { line: { color: REF_COL[k], width: fuerte ? 3.4 : 2, dash: k === 'ha' ? 'dot' : 'solid' }, opacity: tenue ? 0.3 : 1 }));
      });
      graf(g, trazas, { height: 330, title: { text: S.nombre + ': cuatro pronósticos' }, legend: { orientation: 'h', y: -0.18 } });
      tab.innerHTML = tablaHTML(['método', 'MAE', 'RMSE', 'MAPE %', 'MASE'], orden.map(k => [REF_ES[k], fmt(M[k].mae, 2), fmt(M[k].rmse, 2), fmt(M[k].mape, 2), fmt(M[k].mase, 3)]), orden.map((k, i) => i === 0 ? 'elegido' : ''));
      lec.className = 'w-lectura ok';
      lec.innerHTML = `Con ${h} periodos de prueba gana <b>${REF_ES[mejor]}</b> (MAE ${fmt(M[mejor].mae, 2)}, ${fmt(M[orden[1]].mae / M[mejor].mae, 2)} veces menos error que el segundo, ${REF_ES[orden[1]]}). ` +
        (mejor === S.ganador ? COMENTARIO_REF[se.get()] : `Con este horizonte no gana la referencia «natural» de la serie (${REF_ES[S.ganador]}): con pocos periodos de prueba el azar pesa mucho. Prueba con el horizonte original (${S.h}).`);
      const filas = rango(Math.min(h, 6)).map(i => [String(xf[i]), fmt(P.ha.media[i], 2), fmt(P.n.media[i], 2), fmt(P.sn.media[i], 2), fmt(P.rwd.media[i], 2)]);
      tx.innerHTML = tablaHTML(['ds', 'HistoricAverage', 'Naive', 'SeasonalNaive', 'RWD'], filas) +
        `<p style="font-size:.86rem;margin:6px 2px">Último dato y<sub>T</sub> = ${fmt(tr[tr.length - 1], 2)} · ȳ = ${fmt(P.A.mu, 2)} · b = (y<sub>T</sub> − y<sub>1</sub>)/(T − 1) = ${fmt(P.A.b, 4)} · m = ${S.m}.</p>`;
    }
    dibujar();
  });

  R('w2-ref-residuos', c => {
    const ctr = lienzo(c);
    const se = seleccion(ctr, { etiqueta: 'Serie', valor: 'ap', opciones: opcionesSerieRef() }, dibujar);
    const me = segmentado(ctr, { etiqueta: 'Método', valor: 'n', opciones: REF_K.map(k => [k, REF_ES[k]]) }, dibujar);
    const g1 = lamina(c), f = fila(c), g2 = lamina(f), g3 = lamina(f), lec = lectura(c);
    const ex = extra(c, 'Vista extra: la media de los residuales de cada método y la pendiente b'), tx = el('div', { class: 'w-tabla' });
    ex.append(tx);
    function dibujar() {
      const S = SERIES_REF[se.get()], k = me.get(), ytr = S.y.slice(0, S.y.length - S.h), A = T2.refAjustar(ytr, S.m);
      const xs = [], e = [];
      A.res[k].forEach((v, i) => { if (Number.isFinite(v)) { xs.push(S.x[i]); e.push(v); } });
      const n = e.length, Mo = T2.momentos(e), media = Mo.media, sd = Math.sqrt(Mo.var * n / (n - 1));
      const H = Math.min(40, Math.max(2 * S.m, 10)), lb = TS.ljungBoxTabla(e, [H], { model_df: 0 })[0];
      const tmed = media / (sd / Math.sqrt(n)), jb = T2.jarqueBera(e), het = T2.hetH(e.map(v => v - media));
      graf(g1, [lin(xs, e, REF_COL[k], 'residual', { line: { color: REF_COL[k], width: 1.2 } }),
        hline(xs[0], xs[n - 1], 0, PAL.gris, 'solid'), hline(xs[0], xs[n - 1], media, PAL.rosa, 'dash', 'media = ' + fmt(media, 3))],
      { height: 240, title: { text: `Residuales de ${REF_ES[k]} en el entrenamiento (${n} datos; faltan ${ytr.length - n} al inicio)` }, legend: { orientation: 'h', y: -0.22 } });
      const lim = Math.max(...e.map(Math.abs)) * 1.05;
      graf(g2, [histograma(e, rgba(REF_COL[k], 0.45)), curvaNormal(media, sd, -lim, lim, PAL.lav, 'normal')], { height: 240, title: { text: 'Histograma' }, showlegend: false, bargap: 0.05 });
      graf(g3, trazasACF(TS.acf(e, H), n), layoutACF('ACF de los residuales', { height: 240 }));
      const ok = v => (v ? '✓' : '✗');
      const c1 = lb.lb_pvalue > 0.05, c2 = Math.abs(tmed) < 2, c3 = het.p > 0.05, c4 = jb.p > 0.05;
      lec.className = 'w-lectura ' + (c1 && c2 ? 'ok' : 'mal');
      lec.innerHTML = `${ok(c1)} <b>Sin autocorrelación</b>: Ljung–Box(${H}) Q = ${fmt(lb.lb_stat, 1)}, ${pq(lb.lb_pvalue)}. ` +
        `${ok(c2)} <b>Media cero</b>: media ${fmt(media, 3)}, t = ${fmt(tmed, 2)}${c2 ? '' : ' (sesgo: el pronóstico se queda corto o se pasa de forma sistemática)'}. ` +
        `${ok(c3)} <b>Varianza constante</b>: H = ${fmt(het.H, 2)}, ${pq(het.p)}. ` +
        `${ok(c4)} <b>Normalidad</b>: Jarque–Bera ${pq(jb.p)}. ` +
        (c1 && c2 ? '💡 Los residuales parecen ruido blanco: esta referencia ya captura lo predecible de la serie.' : '💡 Queda estructura sin usar: un modelo mejor puede ganarle a esta referencia.') +
        ` σ̂ = ${fmt(A.sig[k], 3)} (statsforecast).`;
      tx.innerHTML = tablaHTML(['método', 'media de los residuales', 'σ̂', 'residuales'], REF_K.map(j => {
        const v = A.res[j].filter(Number.isFinite); return [REF_ES[j], fmt(TS.media(v), 4), fmt(A.sig[j], 3), v.length];
      }), REF_K.map(j => (j === k ? 'elegido' : ''))) +
        `<p style="font-size:.86rem;margin:6px 2px">Pendiente de la deriva b = (y<sub>T</sub> − y<sub>1</sub>)/(T − 1) = <b>${fmt(A.b, 4)}</b>: coincide con la media de los residuales del ingenuo. Los del promedio y la deriva tienen media 0 exacta; los del estacional miden el crecimiento promedio de una temporada a la siguiente.</p>`;
    }
    dibujar();
  });

  R('w2-ref-intervalos', c => {
    const ctr = lienzo(c);
    const se = seleccion(ctr, { etiqueta: 'Serie', valor: 'ap', opciones: opcionesSerieRef() }, () => { const S = SERIES_REF[se.get()]; hs.config({ min: 1, max: S.hMax, paso: 1, valor: S.h }); dibujar(); });
    const me = segmentado(ctr, { etiqueta: 'Método', valor: 'sn', opciones: REF_K.map(k => [k, REF_ES[k]]) }, dibujar);
    const nv = segmentado(ctr, { etiqueta: 'Nivel', valor: '80', opciones: [['80', '80%'], ['90', '90%'], ['95', '95%'], ['99', '99%']] }, dibujar);
    const hs = slider(ctr, { etiqueta: 'Horizonte h', min: 1, max: 36, paso: 1, valor: 12 }, dibujar);
    const g = lamina(c), lec = lectura(c);
    const ex = extra(c, 'Vista extra: cómo se abre la banda con el horizonte en cada método'), gx = lamina(ex), lx = lectura(ex);
    function dibujar() {
      const S = SERIES_REF[se.get()], k = me.get(), nivel = +nv.get(), h = hs.get(), n = S.y.length;
      const tr = S.y.slice(0, n - h), te = S.y.slice(n - h), xt = S.x.slice(0, n - h), xf = S.x.slice(n - h);
      const P = T2.refPronostico(tr, h, { m: S.m, niveles: [nivel, 95] }), F = P[k], Bn = F.bandas[nivel], B95 = F.bandas[95];
      const desde = Math.max(0, tr.length - Math.max(3 * h, 3 * S.m, 30));
      const trazas = [bandaTr(xf, B95.lo, B95.hi, rgba(REF_COL[k], 0.12), '95%'), bandaTr(xf, Bn.lo, Bn.hi, rgba(REF_COL[k], 0.3), nivel + '%'),
        lin(xt.slice(desde), tr.slice(desde), '#45397a', 'entrenamiento', { line: { color: '#45397a', width: 1.5 } }),
        lin(xf, F.media, REF_COL[k], 'pronóstico ' + REF_ES[k], { line: { color: REF_COL[k], width: 2.6 } }),
        { x: xf, y: te, mode: 'markers', marker: { color: PAL.menta, size: 7, line: { color: '#fff', width: 1 } }, name: 'real' }];
      graf(g, trazas, { height: 330, title: { text: `${REF_ES[k]} con banda de ${nivel}% (y 95%)` }, legend: { orientation: 'h', y: -0.18 } });
      const dentro = te.filter((v, i) => v >= Bn.lo[i] && v <= Bn.hi[i]).length, z = Bn.z;
      const formula = { ha: 'σ̂·√(1 + 1/T)', n: 'σ̂·√h', sn: 'σ̂·√(k + 1), k = ⌊(h − 1)/m⌋', rwd: 'σ̂·√(h(1 + h/(T − 1)))' }[k];
      const cubre = dentro / h * 100;
      lec.className = 'w-lectura ' + (Math.abs(cubre - nivel) <= 20 ? 'ok' : 'mal');
      lec.innerHTML = `σ̂ = ${fmt(P.A.sig[k], 3)} · σ̂<sub>h</sub> = ${formula} · c = ${fmt(z, 3)}. Media anchura: <b>${fmt(z * F.sd[0], 2)}</b> en h = 1 y <b>${fmt(z * F.sd[h - 1], 2)}</b> en h = ${h}. ` +
        `Cobertura observada: <b>${dentro} de ${h}</b> datos reales dentro de la banda (${fmt(cubre, 0)}% contra ${nivel}% prometido). ` +
        (Math.abs(cubre - nivel) <= 20 ? 'La banda cumple razonablemente lo que promete.' : cubre < nivel ? '⚠ La banda promete más de lo que cumple: los residuales tienen sesgo o autocorrelación, y la fórmula normal ya no aplica.' : 'La banda quedó más ancha de lo necesario en esta prueba.');
      const T = tr.length, H = S.hMax, hh = rango(H, 1);
      graf(gx, REF_K.map(j => lin(hh, hh.map(v => T2.refFactor(j, v, T, S.m)), REF_COL[j], REF_ES[j], { line: { color: REF_COL[j], width: j === k ? 3.2 : 1.8, shape: j === 'sn' ? 'hv' : 'linear' } })),
        { height: 260, title: { text: 'Factor σ̂<sub>h</sub> / σ̂' }, xaxis: { title: { text: 'h' } }, legend: { orientation: 'h', y: -0.25 } });
      lx.innerHTML = `Con T = ${T} y m = ${S.m}: en h = ${H} el factor vale ${REF_K.map(j => REF_ES[j] + ' ' + fmt(T2.refFactor(j, H, T, S.m), 2)).join(', ')}. El estacional solo sube al empezar cada temporada nueva; la deriva se separa del ingenuo por el error de estimar la pendiente.`;
    }
    dibujar();
  });

  R('w2-ref-cv', c => {
    const ctr = lienzo(c);
    const se = seleccion(ctr, { etiqueta: 'Serie', valor: 'ap', opciones: opcionesSerieRef() }, () => { const S = SERIES_REF[se.get()]; hs.config({ min: 1, max: Math.min(24, S.hMax), paso: 1, valor: Math.min(S.h, 24) }); st.config({ min: 1, max: 24, paso: 1, valor: Math.min(S.h, 24) }); dibujar(); });
    const hs = slider(ctr, { etiqueta: 'h', min: 1, max: 24, paso: 1, valor: 12 }, dibujar);
    const nw = slider(ctr, { etiqueta: 'n_windows', min: 1, max: 6, paso: 1, valor: 3 }, dibujar);
    const st = slider(ctr, { etiqueta: 'step_size', min: 1, max: 24, paso: 1, valor: 12 }, dibujar);
    const vw = slider(ctr, { etiqueta: 'Ventana que se dibuja', min: 1, max: 3, paso: 1, valor: 3 }, dibujar);
    const g = lamina(c), g2 = lamina(c), lec = lectura(c);
    const ex = extra(c, 'Vista extra: el MAE de cada ventana'), tx = el('div', { class: 'w-tabla' });
    ex.append(tx);
    function dibujar() {
      const S = SERIES_REF[se.get()], n = S.y.length, h = hs.get(), paso = st.get();
      let W = nw.get();
      while (W > 1 && n - h - (W - 1) * paso < Math.max(2 * S.m + 2, 10)) W--;
      if (W !== nw.get()) nw.set(W);
      vw.config({ min: 1, max: W, paso: 1, valor: Math.min(vw.get(), W) });
      const ventanas = rango(W).map(i => {
        const corte = n - h - (W - 1 - i) * paso, tr = S.y.slice(0, corte), te = S.y.slice(corte, corte + h);
        const P = T2.refPronostico(tr, h, { m: S.m }), mae = {};
        REF_K.forEach(k => { mae[k] = TS.media(te.map((v, j) => Math.abs(v - P[k].media[j]))); });
        return { corte, cutoff: S.x[corte - 1], xs: S.x.slice(corte, corte + h), P, mae };
      });
      const sel = ventanas[vw.get() - 1], sombras = ventanas.map((v, i) => ({ type: 'rect', xref: 'x', yref: 'paper', x0: v.xs[0], x1: v.xs[v.xs.length - 1], y0: 0, y1: 1, fillcolor: i === vw.get() - 1 ? 'rgba(224,112,159,.16)' : 'rgba(124,105,214,.09)', line: { width: 0 } }));
      const trazas = [lin(S.x, S.y, '#45397a', 'serie', { line: { color: '#45397a', width: 1.3 } }),
        vline(sel.cutoff, Math.min(...S.y), Math.max(...S.y), PAL.gris, 'dash', 'cutoff')].concat(REF_K.map(k => lin(sel.xs, sel.P[k].media, REF_COL[k], REF_ES[k], { line: { color: REF_COL[k], width: 2.2 } })));
      graf(g, trazas, { height: 300, title: { text: `${W} ventanas de ${h} periodos cada ${paso}` }, shapes: sombras, legend: { orientation: 'h', y: -0.2 } });
      const etiquetas = ventanas.map((v, i) => `ventana ${i + 1}`);
      graf(g2, REF_K.map(k => ({ type: 'bar', x: etiquetas.concat(['promedio']), y: ventanas.map(v => v.mae[k]).concat([TS.media(ventanas.map(v => v.mae[k]))]), name: REF_ES[k], marker: { color: REF_COL[k] }, hovertemplate: REF_ES[k] + ': MAE %{y:.2f}<extra></extra>' })),
        { height: 260, barmode: 'group', title: { text: 'MAE por ventana' }, legend: { orientation: 'h', y: -0.25 }, yaxis: { rangemode: 'tozero' } });
      const prom = {};
      REF_K.forEach(k => { prom[k] = TS.media(ventanas.map(v => v.mae[k])); });
      const orden = REF_K.slice().sort((a, b) => prom[a] - prom[b]);
      const pierde = ventanas.map((v, i) => [i + 1, REF_K.slice().sort((a, b) => v.mae[a] - v.mae[b])[0]]).filter(([, k]) => k !== orden[0]);
      lec.innerHTML = `En promedio gana <b>${REF_ES[orden[0]]}</b> (MAE ${fmt(prom[orden[0]], 2)}), seguido de ${REF_ES[orden[1]]} (${fmt(prom[orden[1]], 2)}). ` +
        (pierde.length ? `Pero no gana en todas: en ${pierde.map(([i, k]) => `la ventana ${i} gana ${REF_ES[k]}`).join(' y ')}. Por eso conviene promediar varias ventanas.` : 'Gana en todas las ventanas.') +
        (paso < h && W > 1 ? ' ⚠ Con step_size < h las ventanas se traslapan.' : '');
      tx.innerHTML = tablaHTML(['cutoff'].concat(REF_K.map(k => T2.REF_NOMBRES[k])), ventanas.map(v => [String(v.cutoff)].concat(REF_K.map(k => fmt(v.mae[k], 2))))
        .concat([['promedio'].concat(REF_K.map(k => fmt(prom[k], 2)))]));
    }
    dibujar();
  });

  R('py2-statsforecast', c => {
    const ctr = lienzo(c);
    let activo = 'models';
    const cambia = k => () => { activo = k; dibujar(); };
    const mo = segmentado(ctr, { etiqueta: 'models', valor: 'dos', opciones: [['dos', 'Naive + SeasonalNaive'], ['cuatro', 'los cuatro'], ['ha', 'solo HistoricAverage']] }, cambia('models'));
    const sl = segmentado(ctr, { etiqueta: 'season_length', valor: '12', opciones: [['12', '12'], ['4', '4'], ['1', '1']] }, cambia('season'));
    const fq = segmentado(ctr, { etiqueta: 'freq', valor: 'MS', opciones: [['MS', '"MS"'], ['ME', '"ME"'], ['D', '"D"']] }, cambia('freq'));
    const hs = slider(ctr, { etiqueta: 'h', min: 1, max: 24, paso: 1, valor: 12 }, cambia('h'));
    const lv = segmentado(ctr, { etiqueta: 'level', valor: '80', opciones: [['none', 'None'], ['80', '[80]'], ['8095', '[80, 95]']] }, cambia('level'));
    const md = segmentado(ctr, { etiqueta: 'Método', valor: 'forecast', opciones: [['forecast', 'forecast'], ['fitpredict', 'fit + predict'], ['fitted', 'fitted=True'], ['olvido', 'olvidar fitted=True']] }, cambia('modo'));
    const pc = panelCodigo(c, { fuente: 'statsforecast' }), lec = lectura(c);
    const tr = AP.slice(0, 132), FTR = FECHAS_AP.slice(0, 132);
    const fecha = (iso, f, j) => {
      const [a, m] = iso.split('-').map(Number);
      if (f === 'MS') { const t = (a * 12 + m - 1) + j; return `${Math.floor(t / 12)}-${String(t % 12 + 1).padStart(2, '0')}-01`; }
      if (f === 'ME') { const t = (a * 12 + m - 1) + j - 1, aa = Math.floor(t / 12), mm = t % 12 + 1, d = new Date(Date.UTC(aa, mm, 0)).getUTCDate(); return `${aa}-${String(mm).padStart(2, '0')}-${String(d).padStart(2, '0')}`; }
      const d = new Date(Date.UTC(a, m - 1, 1 + j)); return d.toISOString().slice(0, 10);
    };
    // Formato de pandas: columna de enteros → 1 decimal; si no, 6 decimales
    const colFmt = vs => { const fin = vs.filter(Number.isFinite), ent = fin.every(v => Math.abs(v - Math.round(v)) < 1e-9); return vs.map(v => !Number.isFinite(v) ? 'NaN' : ent ? v.toFixed(1) : v.toFixed(6)); };
    function dibujar() {
      const m = +sl.get(), f = fq.get(), h = hs.get(), lvl = lv.get(), modo = md.get();
      const claves = { dos: ['n', 'sn'], cuatro: ['ha', 'n', 'sn', 'rwd'], ha: ['ha'] }[mo.get()];
      const clase = { ha: 'HistoricAverage()', n: 'Naive()', sn: `SeasonalNaive(season_length=${m})`, rwd: 'RandomWalkWithDrift()' };
      const imp = { ha: 'HistoricAverage', n: 'Naive', sn: 'SeasonalNaive', rwd: 'RandomWalkWithDrift' };
      const niveles = lvl === 'none' ? [] : lvl === '80' ? [80] : [80, 95], levelTxt = lvl === 'none' ? 'None' : `[${niveles.join(', ')}]`;
      const nombres = claves.map(k => T2.REF_NOMBRES[k]);
      const cols = ['unique_id', 'ds'];
      claves.forEach(k => { cols.push(T2.REF_NOMBRES[k]); niveles.forEach(v => cols.push(`${T2.REF_NOMBRES[k]}-lo-${v}`)); niveles.forEach(v => cols.push(`${T2.REF_NOMBRES[k]}-hi-${v}`)); });
      const llamada = {
        forecast: `fcst = sf.forecast(df=train_df, h={h}, level={level})\nprint(fcst.columns.tolist())\nprint(fcst[["ds"] + {nombres}].head(4))`,
        fitpredict: `sf.fit(df=train_df)\nfcst = sf.predict(h={h}, level={level})\nprint(fcst.columns.tolist())\nprint(fcst[["ds"] + {nombres}].head(4))`,
        fitted: `fcst = sf.forecast(df=train_df, h={h}, level={level}, fitted=True)\najust = sf.forecast_fitted_values()\nprint(ajust[["ds", "y"] + {nombres}].iloc[10:14])`,
        olvido: `fcst = sf.forecast(df=train_df, h={h}, level={level})\najust = sf.forecast_fitted_values()`
      }[modo];
      const args = { imports: claves.map(k => imp[k]).join(', '), models: '[' + claves.map(k => clase[k]).join(', ') + ']', freq: `"${f}"`, h, level: levelTxt, nombres: '[' + nombres.map(s => `"${s}"`).join(', ') + ']' };
      const marca = { models: 'models', season: 'models', freq: 'freq', h: 'h', level: 'level', modo: 'h' }[activo];
      pc.codigo(codigoPython(`from statsforecast import StatsForecast\nfrom statsforecast.models import {imports}\n\ntrain_df = df_ap.iloc[:-12]      # AirPassengers 1949–1959 en formato largo\nsf = StatsForecast(models={models}, freq={freq})\n` + llamada, args, marca));
      const P = T2.refPronostico(tr, Math.max(h, 1), { m, niveles });
      let salida;
      if (modo === 'olvido') salida = 'Exception: Please run `forecast` method using `fitted=True`';
      else if (modo === 'fitted') {
        const A = P.A, idx = rango(4, 10), datos = [['ds', idx.map(i => FTR[i])], ['y', colFmt(idx.map(i => tr[i]))]];
        claves.forEach(k => datos.push([T2.REF_NOMBRES[k], colFmt(idx.map(i => A.fit[k][i]))]));
        salida = tablaTexto(datos.map(d => d[0]), idx.map((_, r) => datos.map(d => d[1][r])), idx.map(String));
      } else {
        const filas = rango(Math.min(4, h)), datos = [['ds', filas.map(j => fecha(FTR[131], f, j + 1))]];
        claves.forEach(k => datos.push([T2.REF_NOMBRES[k], colFmt(filas.map(j => P[k].media[j]))]));
        salida = '[' + cols.map(s => `'${s}'`).join(', ') + ']\n' + tablaTexto(datos.map(d => d[0]), filas.map(r => datos.map(d => d[1][r])), filas.map(String));
      }
      pc.salida(salida);
      const notas = [];
      if (modo === 'olvido') notas.push('Los ajustados solo se guardan si los pides: vuelve a llamar a <code>forecast</code> con <code>fitted=True</code>.');
      if (modo === 'fitted') notas.push(`Los primeros renglones de los ajustados tienen <code>NaN</code>: el ingenuo no tiene dato anterior en el renglón 0 y el estacional no tiene temporada anterior en los primeros ${m} renglones. Quítalos con <code>.dropna()</code> antes de calcular residuales.`);
      if (f !== 'MS' && modo !== 'fitted' && modo !== 'olvido') notas.push(`⚠ Con <code>freq="${f}"</code> el primer pronóstico queda fechado ${fecha(FTR[131], f, 1)}, no 1960-01-01: al unir con la prueba por <code>ds</code> no coincide ninguna fecha y las métricas salen <code>NaN</code>.`);
      if (claves.includes('sn') && m !== 12) notas.push(`⚠ Con <code>season_length=${m}</code> el estacional copia los últimos ${m} ${m === 1 ? 'mes (es igual al ingenuo)' : 'meses'}, no el mismo mes del año anterior. No sale ningún error: es un error silencioso.`);
      if (claves.includes('rwd') && modo !== 'olvido') notas.push('La deriva sale en la columna <code>RWD</code>, no <code>RandomWalkWithDrift</code>.');
      if (lvl === 'none' && modo !== 'fitted' && modo !== 'olvido') notas.push('Sin <code>level</code> no hay columnas <code>-lo-</code> ni <code>-hi-</code>.');
      if (modo === 'fitpredict') notas.push('<code>fit</code> + <code>predict</code> da exactamente los mismos números que <code>forecast</code>.');
      lec.className = 'w-lectura ' + (notas.some(t => t.startsWith('⚠')) || modo === 'olvido' ? 'mal' : 'ok');
      lec.innerHTML = notas.join(' ') || 'Configuración correcta para AirPassengers: fechas al inicio de mes y estacionalidad de 12.';
    }
    dibujar();
  });

  /* ======================= 17 · Caso AirPassengers ======================= */
  R('w2-caso-ap', c => {
    const G = DATOS.rejilla_ap;
    if (!G) { c.textContent = 'Faltan los datos.'; return; }
    const ctr = lienzo(c);
    const paso = segmentado(ctr, { etiqueta: 'Paso', valor: '1', opciones: rango(9, 1).map(i => [String(i), String(i)]) }, dibujar);
    boton(ctr, 'Siguiente ▶', () => { paso.set(String(Math.min(9, +paso.get() + 1))); dibujar(); });
    const g = lamina(c), g2 = lamina(c), tab = el('div', { class: 'w-tabla' }), lec = lectura(c);
    c.insertBefore(tab, lec);
    const aero = G.modelos.find(m => m.orden.join() === '0,1,1' && m.estacional.join() === '0,1,1');
    const w = TS.diff(TS.diff(LOGAP, 12)), FW = FECHAS_AP.slice(13);
    function dibujar() {
      const p = +paso.get();
      g2.style.display = 'none'; tab.innerHTML = '';
      let texto = '';
      if (p === 1) { graf(g, [lin(FECHAS_AP, AP, PAL.lav, 'pasajeros', { line: { color: PAL.lav, width: 1.8 } })], { height: 300, title: { text: 'Paso 1 · AirPassengers (miles de pasajeros)' }, showlegend: false }); texto = '<b>Cargar y graficar.</b> 144 meses (1949–1960) con frecuencia mensual. Se ven tendencia creciente y estacionalidad de 12 meses cuya amplitud crece con el nivel: patrón multiplicativo.'; }
      if (p === 2) { graf(g, [lin(FECHAS_AP, LOGAP, PAL.menta, 'log', { line: { color: PAL.menta, width: 1.8 } })], { height: 300, title: { text: 'Paso 2 · ln(pasajeros)' }, showlegend: false }); texto = `<b>Transformar.</b> El logaritmo vuelve parejas las oscilaciones. Box–Cox estima λ̂ = ${fmt(LAM_AP, 3)} ≈ 0, así que se usa el log por interpretabilidad.`; }
      if (p === 3) {
        const a = TS.adf(w, { regression: 'c' }), k = TS.kpss(w, { regression: 'c' });
        graf(g, [lin(FW, w, PAL.cel, 'ΔΔ12 log', { line: { color: PAL.cel, width: 1.4 } })], { height: 300, title: { text: 'Paso 3 · ΔΔ₁₂ ln y_t' }, showlegend: false });
        texto = `<b>Diferenciar y probar.</b> Con una diferencia regular y una estacional: ADF p = ${fp(a.p)} (rechaza la raíz unitaria) y KPSS p ${k.fueraDeTabla === 'mayor' ? '> 0.10' : '= ' + fp(k.p)} (no rechaza la estacionariedad). Se fija d = 1, D = 1.`;
      }
      if (p === 4) {
        const r = TS.acf(w, 36), pc = TS.pacf(w, 36);
        graf(g, trazasACF(r, w.length, { resaltar: 12 }), layoutACF('Paso 4 · ACF de ΔΔ₁₂ ln y_t', { height: 260 }));
        g2.style.display = ''; graf(g2, trazasACF(pc, w.length, { color: PAL.cel }), layoutACF('PACF de ΔΔ₁₂ ln y_t', { height: 240 }));
        texto = `<b>Identificar.</b> Picos en la ACF en 1 (${fmt(r[1], 3)}) y 12 (${fmt(r[12], 3)}), con satélite en 13 (${fmt(r[13], 3)}): firma de MA(1) regular × MA(1) estacional. Candidatos: (0,1,1)(0,1,1), (1,1,0)(0,1,1), (1,1,1)(0,1,1), (0,1,1)(1,1,1).`;
      }
      if (p === 5) {
        const top = G.modelos.slice().sort((a, b) => a.aic - b.aic).slice(0, 6), m0 = top[0].aic;
        graf(g, [{ type: 'bar', x: top.map(m => `(${m.orden.join(',')})(${m.estacional.join(',')})`), y: top.map(m => m.aic - m0), marker: { color: top.map((m, i) => i ? 'rgba(124,105,214,.7)' : PAL.rosa) }, text: top.map(m => fmt(m.aic - m0, 2)), textposition: 'outside' }],
          { height: 300, title: { text: 'Paso 5 · ΔAIC de los 6 mejores modelos' }, showlegend: false, yaxis: { rangemode: 'tozero', title: { text: 'ΔAIC' } } });
        tab.innerHTML = tablaHTML(['modelo', 'k', 'AIC', 'BIC'], top.map(m => [`(${m.orden.join(',')})(${m.estacional.join(',')})₁₂`, m.k, fmt(m.aic, 2), fmt(m.bic, 2)]), ['elegido']);
        texto = '<b>Estimar y comparar.</b> El modelo de aerolínea tiene el menor AIC y el menor BIC; los siguientes están a menos de 2 unidades de AIC pero tienen igual o más parámetros.';
      }
      if (p === 6) {
        graf(g, trazasACF(TS.acf(aero.est, 24), aero.est.length), layoutACF('Paso 6 · ACF de los residuos del modelo de aerolínea', { height: 270 }));
        tab.innerHTML = tablaHTML(['prueba', 'resultado'], [['Ljung–Box h = 12 (model_df = 2)', `p = ${fmt(aero.lb12[1], 3)} ✓`], ['Ljung–Box h = 24', `p = ${fmt(aero.lb24[1], 3)} ✓`], ['Jarque–Bera', `p = ${fmt(aero.jb[1], 3)} ✓`], ['H (varianza)', `p = ${fmt(aero.h[1], 4)} ✗`]]);
        texto = '<b>Diagnosticar.</b> Residuos sin autocorrelación y normales. La prueba H indica que la varianza bajó con el tiempo: los intervalos de 1960 pueden quedar un poco anchos.';
      }
      if (p === 7 || p === 9) {
        const xs = G.fechas_tr.slice(96), E = v => v.map(Math.exp);
        graf(g, [lin(xs, E(G.log_tr.slice(96)), '#45397a', 'entrenamiento'), bandaTr(G.fechas_te, E(aero.fc_inf), E(aero.fc_sup), 'rgba(224,112,159,.18)', ''), lin(G.fechas_te, E(aero.fc), PAL.rosa, 'pronóstico', { line: { color: PAL.rosa, width: 2.4 } }), { x: G.fechas_te, y: E(G.log_te), mode: 'markers', marker: { color: PAL.menta, size: 8 }, name: 'real' }],
          { height: 300, title: { text: p === 7 ? 'Paso 7 · Pronóstico de 1960 en pasajeros' : 'Paso 9 · Conclusión' }, legend: { orientation: 'h', y: -0.2 } });
        texto = p === 7 ? '<b>Pronosticar.</b> 12 pasos desde diciembre de 1959; se regresa a pasajeros con exp (la banda queda asimétrica).'
          : `<b>Conclusión.</b> SARIMA(0,1,1)(0,1,1)₁₂ sobre ln y<sub>t</sub>: θ̂ = ${fmt(aero.params[0][1], 3)}, Θ̂ = ${fmt(aero.params[1][1], 3)}; residuos de ruido blanco; MAPE 1960 = ${fmt(aero.mape, 2)}% contra 9.99% del ingenuo estacional. Modelo adecuado para pronosticar (ver la redacción completa abajo).`;
      }
      if (p === 8) {
        const P = pronosticos1960(), M = P.mods.map(m => ({ n: m.n, c: m.c, M: T2.metricas(P.real, m.p, { entrenamiento: P.trY, m: 12 }) }));
        graf(g, [{ type: 'bar', x: M.map(m => m.n.split(' (')[0]), y: M.map(m => m.M.mape), marker: { color: M.map(m => m.c) }, text: M.map(m => fmt(m.M.mape, 2) + '%'), textposition: 'outside' }], { height: 300, title: { text: 'Paso 8 · MAPE en 1960' }, showlegend: false, yaxis: { rangemode: 'tozero' } });
        tab.innerHTML = tablaHTML(['modelo', 'MAE', 'RMSE', 'MAPE %', 'MASE'], M.map(m => [m.n, fmt(m.M.mae, 2), fmt(m.M.rmse, 2), fmt(m.M.mape, 2), fmt(m.M.mase, 3)]), ['elegido']);
        texto = '<b>Evaluar.</b> En pasajeros (no en logaritmos): el modelo de aerolínea reduce el MAPE del ingenuo estacional de casi 10% a menos de 3%, con MASE = 0.44.';
      }
      lec.innerHTML = texto;
    }
    dibujar();
  });

  /* ======================= 18 · Caso usuarios ======================= */
  R('w2-usuarios', c => {
    const D = DATOS.usuarios;
    if (!D) { c.textContent = 'Faltan los datos.'; return; }
    const ctr = lienzo(c);
    const mo = segmentado(ctr, { etiqueta: 'Modelo', valor: 'B', opciones: [['A', 'A: SARIMA'], ['B', 'B: SARIMAX con festivos'], ['AB', 'los dos']] }, dibujar);
    const bd = casilla(ctr, 'Mostrar banda de 95%', true, dibujar);
    const g1 = lamina(c), g2 = lamina(c), lec = lectura(c);
    const ex = extra(c, 'Vista extra: los coeficientes de los dos modelos'), f = fila(ex), tA = el('div', { class: 'w-tabla' }), tB = el('div', { class: 'w-tabla' });
    f.append(tA, tB);
    const n = D.fechas.length, nt = D.n_test, ini = n - nt - 56;
    function dibujar() {
      const xs = D.fechas.slice(ini), ys = D.usuarios.slice(ini), xt = D.fechas.slice(n - nt), fe = D.festivo;
      const tr = [lin(xs, ys, '#45397a', 'usuarios', { line: { color: '#45397a', width: 1.4 } }),
        { x: xs.filter((_, i) => fe[ini + i]), y: ys.filter((_, i) => fe[ini + i]), mode: 'markers', marker: { color: PAL.rosa, size: 11, symbol: 'star' }, name: 'festivo' }];
      const usar = mo.get() === 'AB' ? ['A', 'B'] : [mo.get()];
      usar.forEach(k => {
        const M = D[k], col = k === 'A' ? PAL.dur : PAL.menta;
        if (bd.get()) tr.push(bandaTr(xt, M.inf, M.sup, k === 'A' ? 'rgba(232,148,95,.15)' : 'rgba(63,174,138,.16)', ''));
        tr.push(lin(xt, M.pred, col, k === 'A' ? 'pronóstico A' : 'pronóstico B', { line: { color: col, width: 2.3 } }));
      });
      graf(g1, tr, { height: 330, title: { text: 'Últimos 56 días de entrenamiento y 28 de prueba' }, legend: { orientation: 'h', y: -0.22 }, shapes: [{ type: 'line', x0: xt[0], x1: xt[0], yref: 'paper', y0: 0, y1: 1, line: { color: PAL.gris, dash: 'dot' } }] });
      const k = usar[usar.length - 1], R_ = D[k].resid, off = D[k].burn, fx = D.fechas.slice(off, n - nt), fr = fe.slice(off, n - nt);
      graf(g2, [lin(fx, R_, k === 'A' ? PAL.dur : PAL.menta, 'residuo', { line: { width: 0.9, color: k === 'A' ? PAL.dur : PAL.menta } }), { x: fx.filter((_, i) => fr[i]), y: R_.filter((_, i) => fr[i]), mode: 'markers', marker: { color: PAL.rosa, size: 9, symbol: 'star' }, name: 'festivo' }],
        { height: 260, title: { text: `Residuos del entrenamiento, modelo ${k} (estrellas = festivos)` }, showlegend: false });
      const idxF = rango(nt).filter(i => fe[n - nt + i]), real = D.usuarios.slice(n - nt);
      const errF = m => idxF.map(i => 100 * (real[i] - D[m].pred[i]) / real[i]);
      lec.innerHTML = `MAPE de prueba: A = <b>${fmt(D.A.mape, 2)}%</b>, B = <b>${fmt(D.B.mape, 2)}%</b> · AIC: A = ${fmt(D.A.aic, 1)}, B = ${fmt(D.B.aic, 1)}. ` +
        (idxF.length ? `En los ${idxF.length} festivos de la prueba (${idxF.map(i => xt[i].slice(5)).join(', ')}), el error de A fue ${errF('A').map(v => fmt(v, 1) + '%').join(' y ')}; el de B, ${errF('B').map(v => fmt(v, 1) + '%').join(' y ')}.` : '');
      const tabla = (M, t) => '<p style="margin:4px 6px;font-weight:700">' + t + '</p>' + tablaHTML(['parámetro', 'coef', 'se', 'z'], M.params.map(p => [p[0], fmt(p[1], 4), fmt(p[2], 4), fmt(p[3], 2)]));
      tA.innerHTML = tabla(D.A, 'Modelo A (sin festivos)'); tB.innerHTML = tabla(D.B, 'Modelo B (con festivos)');
    }
    dibujar();
  });

  /* Las demás secciones se agregan abajo */
  U.u2 = { T2, AP, FECHAS_AP, LOGAP, f3, f4, sgn, lin, vline, hline, choques, histograma, curvaNormal, polTexto, DATOS };
})();
