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

  /* Las demás secciones se agregan abajo */
  U.u2 = { T2, AP, FECHAS_AP, LOGAP, f3, f4, sgn, lin, vline, hline, choques, histograma, curvaNormal, polTexto, DATOS };
})();
