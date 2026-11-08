/* =====================================================================
   widgets3.js — Gráficas interactivas de la Unidad III.
   Usa las utilidades de widgets.js (window.GUIA_UTIL) y los cálculos de
   ts.js (TS), ts2.js (TS2) y ts3.js (TS3). Cada gráfica se registra con
   window.GUIA_REGISTRAR y se dibuja al acercarte a ella.
   ===================================================================== */
(function () {
  'use strict';
  const U = window.GUIA_UTIL, R = window.GUIA_REGISTRAR;
  if (!U || !R || !window.TS3 || !window.TS2) return;
  const { PAL, el, fmt, fp, num, kpi, slider, seleccion, segmentado, boton, casilla, lienzo, lamina, fila, lectura,
    combinar, graf, banda, trazasACF, layoutACF, tablaHTML, extra, codigoPython, pyv, panelCodigo, tablaTexto,
    panelParametros, tallos } = U;
  const DATOS = U.datos || {};
  const T2 = window.TS2, T3 = window.TS3;
  const rango = TS.rango;
  const AP = TS.datos.airpassengers, LOGAP = AP.map(Math.log);
  const f2 = v => fmt(v, 2), f3 = v => fmt(v, 3), f4 = v => fmt(v, 4);
  const lin = (x, y, color, nombre, ext) => Object.assign({ x, y, mode: 'lines', line: { color, width: 1.8 }, name: nombre }, ext || {});
  const vline = (x, y0, y1, color, dash, nombre) => ({ x: [x, x], y: [y0, y1], mode: 'lines', line: { color, width: 1.6, dash: dash || 'solid' }, name: nombre || '', hoverinfo: 'skip', showlegend: !!nombre });
  const hline = (x0, x1, y, color, dash, nombre) => ({ x: [x0, x1], y: [y, y], mode: 'lines', line: { color, width: 1.4, dash: dash || 'dash' }, name: nombre || '', hoverinfo: 'skip', showlegend: !!nombre });
  const periodo = w => (w > 0 ? 1 / w : Infinity);
  const fP = w => (w > 0 ? fmt(1 / w, 1) : '∞');
  // Traza en el eje de frecuencias, con el periodo en la etiqueta flotante
  const esp = (f, P, color, nombre, ext) => Object.assign({
    x: f, y: P, mode: 'lines', line: { color, width: 2 }, name: nombre || '',
    customdata: f.map(w => (w > 0 ? 1 / w : null)),
    hovertemplate: 'ω = %{x:.4f} · periodo %{customdata:.1f}<br>%{y:.4g}<extra>' + (nombre || '') + '</extra>'
  }, ext || {});
  const puntos = (f, P, color, nombre, ext) => esp(f, P, color, nombre, Object.assign({ mode: 'markers', marker: { color, size: 4.5 } }, ext || {}));
  const barras = (f, P, colores, nombre, ext) => Object.assign({ type: 'bar', x: f, y: P, marker: { color: colores }, name: nombre || '', customdata: f.map(w => (w > 0 ? 1 / w : null)), hovertemplate: 'ω = %{x:.4f} · periodo %{customdata:.1f}<br>%{y:.4g}<extra></extra>' }, ext || {});
  // Líneas verticales que funcionan en ejes logarítmicos (formas con yref = paper)
  const marcas = (xs, color, dash) => xs.map(x => ({ type: 'line', x0: x, x1: x, y0: 0, y1: 1, yref: 'paper', line: { color: color || 'rgba(224,112,159,.45)', width: 1.2, dash: dash || 'dot' } }));
  const franja = (x0, x1, color) => ({ type: 'rect', x0, x1, y0: 0, y1: 1, yref: 'paper', fillcolor: color || 'rgba(63,174,138,.10)', line: { width: 0 }, layer: 'below' });
  const EJE_W = { title: { text: 'frecuencia ω (ciclos por observación)' }, range: [0, 0.5] };
  const EJE_WC = { title: { text: 'ω' }, range: [0, 0.5] };          // para gráficas angostas con leyenda
  const simular = (ar, ma, n, semilla, sigma) => T2.simularARMA(ar, ma, n, { semilla, sigma: sigma || 1 }).y;
  const sinCero = r => ({ f: r.f.slice(1), I: r.I.slice(1) });
  const positivo = a => a.map(v => Math.max(v, 1e-12));
  // Máximos locales simples (para series simuladas)
  function maximos(y, w) {
    const m = TS.media(y), out = [];
    for (let i = w; i < y.length - w; i++) {
      let ok = y[i] > m;
      for (let j = i - w; ok && j <= i + w; j++) if (y[j] > y[i]) ok = false;
      if (ok && (!out.length || i - out[out.length - 1] > w)) out.push(i);
    }
    return out;
  }
  const raicesInversas = pol => T2.raices(pol).map(z => T2.complejo.cdiv(T2.complejo.cx(1), z));
  const circulo = (r, color) => { const a = rango(121).map(i => 2 * Math.PI * i / 120); return lin(a.map(v => r * Math.cos(v)), a.map(v => r * Math.sin(v)), color || '#cfc8ea', '', { hoverinfo: 'skip', showlegend: false, line: { color: color || '#cfc8ea', width: 1.4 } }); };
  const nyq = 0.5;

  /* ---------------------------- Series reales ---------------------------- */
  const MANCHAS = DATOS.manchas || { anio: [], y: [], picos: [] };
  const NINO = (DATOS.nino && DATOS.nino.y) || [];
  const NINO_ANOM = (() => {
    const m = rango(12).map(k => { const v = NINO.filter((_, i) => i % 12 === k); return v.length ? TS.media(v) : 0; });
    return NINO.map((v, i) => v - m[i % 12]);
  })();
  const CO2 = (DATOS.co2 && DATOS.co2.y) || [];
  const MACRO = DATOS.macro || { lpib: [], pib: [], inv: [], cons: [], du: [] };
  const AR2_VERDAD = { ar: [1, -1.2, 0.72], ma: [1], s2: 1 };
  const SERIES = {
    manchas: { nombre: 'Manchas solares (anual)', y: () => MANCHAS.y, u: 'años' },
    anom: { nombre: 'El Niño: anomalías (mensual)', y: () => NINO_ANOM, u: 'meses' },
    nino: { nombre: 'El Niño: temperatura (mensual)', y: () => NINO, u: 'meses' },
    ar2: { nombre: 'AR(2) simulado, φ = (1.2, −0.72)', y: (n, s) => simular(AR2_VERDAD.ar, AR2_VERDAD.ma, n || 300, s || 5), u: 'periodos', verdad: AR2_VERDAD },
    apdd: { nombre: 'AirPassengers: ΔΔ₁₂ log', y: () => TS.diff(LOGAP.slice(12).map((v, i) => v - LOGAP[i])), u: 'meses' },
    co2d: { nombre: 'CO₂: Δ (mensual)', y: () => TS.diff(CO2), u: 'meses' }
  };
  const opcionesSeries = claves => claves.map(k => [k, SERIES[k].nombre]);

  /* ======================= 0 · Repaso y herramientas ======================= */
  R('w3-oscilacion', c => {
    const ctr = lienzo(c);
    const A = slider(ctr, { etiqueta: 'amplitud A', min: 0.5, max: 3, paso: 0.1, valor: 2, fmt: num }, dibujar);
    const w = slider(ctr, { etiqueta: 'frecuencia ω', min: 0.01, max: 0.5, paso: 0.005, valor: 0.0833, fmt: v => `${fmt(v, 3)} (periodo ${fP(v)})` }, dibujar);
    const ph = slider(ctr, { etiqueta: 'fase φ', min: -12, max: 12, paso: 1, valor: 2, fmt: v => (v === 0 ? '0' : `${num(v / 12)}π`) }, dibujar);
    const g1 = lamina(c), g2 = lamina(c), lec = lectura(c);
    const ex = extra(c, 'Vista extra: el vector (β₁, β₂) y la amplitud'), gx = lamina(ex);
    const n = 48;
    function dibujar() {
      const a = A.get(), om = w.get(), fi = ph.get() * Math.PI / 12, b1 = a * Math.cos(fi), b2 = -a * Math.sin(fi);
      const tc = rango(n * 20 + 1).map(i => 1 + i / 20), td = rango(n, 1);
      graf(g1, [lin(tc, tc.map(t => a * Math.cos(2 * Math.PI * om * t + fi)), '#c9c3e3', 'oscilación de fondo', { hoverinfo: 'skip' }),
        { x: td, y: td.map(t => a * Math.cos(2 * Math.PI * om * t + fi)), mode: 'markers', marker: { color: PAL.lav, size: 7 }, name: 'lo que observas (t entero)', hovertemplate: 't = %{x}<br>x = %{y:.3f}<extra></extra>' }],
        { height: 250, title: { text: `x_t = ${num(a)}·cos(2π·${fmt(om, 3)}·t + φ) · periodo 1/ω = ${fP(om)}` }, xaxis: { title: { text: 't' } }, yaxis: { range: [-3.3, 3.3] } });
      graf(g2, [lin(td, td.map(t => b1 * Math.cos(2 * Math.PI * om * t)), PAL.cel, `β₁·cos(2πωt), β₁ = ${f3(b1)}`, { line: { color: PAL.cel, width: 1.6, dash: 'dot' } }),
        lin(td, td.map(t => b2 * Math.sin(2 * Math.PI * om * t)), PAL.rosa, `β₂·sen(2πωt), β₂ = ${f3(b2)}`, { line: { color: PAL.rosa, width: 1.6, dash: 'dot' } }),
        { x: td, y: td.map(t => b1 * Math.cos(2 * Math.PI * om * t) + b2 * Math.sin(2 * Math.PI * om * t)), mode: 'markers', marker: { color: PAL.lav, size: 6 }, name: 'suma = x_t' }],
        { height: 260, title: { text: 'La misma serie como regresión sobre un coseno y un seno' }, xaxis: { title: { text: 't' } }, yaxis: { range: [-3.3, 3.3] } });
      lec.innerHTML = `β₁ = A·cos φ = <b>${f3(b1)}</b> y β₂ = −A·sen φ = <b>${f3(b2)}</b>; de regreso, A = √(β₁² + β₂²) = <b>${f3(Math.hypot(b1, b2))}</b>. ` +
        `La serie da ${fmt(om * n, 1)} vueltas en ${n} observaciones.` + (om > 0.45 ? ' Con ω cerca de 0.5 los puntos alternan arriba–abajo: es la oscilación más rápida visible.' : '');
      graf(gx, [circulo(a), lin([0, b1], [0, b2], PAL.lav, 'vector (β₁, β₂)', { line: { color: PAL.lav, width: 3 } }),
        { x: [b1], y: [b2], mode: 'markers+text', text: [`(${f2(b1)}, ${f2(b2)})`], textposition: 'top right', marker: { color: PAL.rosa, size: 10 }, showlegend: false }],
        { height: 300, title: { text: `Longitud = A = ${f2(a)} · ángulo = −φ` }, xaxis: { range: [-3.4, 3.4], title: { text: 'β₁' }, scaleanchor: 'y' }, yaxis: { range: [-3.4, 3.4], title: { text: 'β₂' } }, showlegend: false });
    }
    dibujar();
  });

  R('w3-aliasing', c => {
    const ctr = lienzo(c);
    const fr = slider(ctr, { etiqueta: 'frecuencia real (ciclos por observación)', min: 0.02, max: 2, paso: 0.01, valor: 0.9, fmt: v => fmt(v, 2) }, dibujar);
    const g1 = lamina(c), g2 = lamina(c), lec = lectura(c);
    const ex = extra(c, 'Vista extra: la tabla de equivalencias'), tab = el('div', { class: 'w-tabla' });
    ex.append(tab);
    const alias = f => Math.abs(f - Math.round(f));
    function dibujar() {
      const f = fr.get(), fa = alias(f), n = 30, tc = rango(n * 40 + 1).map(i => i / 40), td = rango(n + 1);
      graf(g1, [lin(tc, tc.map(t => Math.cos(2 * Math.PI * f * t)), '#bdb6d8', 'señal real', { line: { color: '#bdb6d8', width: 1.3 }, hoverinfo: 'skip' }),
        lin(tc, tc.map(t => Math.cos(2 * Math.PI * fa * t)), PAL.rosa, `lo que «ven» los datos (alias ω = ${fmt(fa, 3)})`, { line: { color: PAL.rosa, width: 2.2, dash: f > 0.5 ? 'solid' : 'dot' }, hoverinfo: 'skip' }),
        { x: td, y: td.map(t => Math.cos(2 * Math.PI * f * t)), mode: 'markers', marker: { color: PAL.lav, size: 8 }, name: 'observaciones', hovertemplate: 't = %{x}<br>%{y:.3f}<extra></extra>' }],
        { height: 270, title: { text: `Señal de ${fmt(f, 2)} ciclos por observación, observada en t = 0, 1, 2, …` }, xaxis: { title: { text: 't' } }, yaxis: { range: [-1.3, 1.3] } });
      const xs = rango(401).map(i => 2 * i / 400);
      graf(g2, [lin(xs, xs.map(alias), PAL.cel, 'frecuencia aparente', { hoverinfo: 'skip' }),
        { x: [f], y: [fa], mode: 'markers', marker: { color: PAL.rosa, size: 11 }, name: 'tu señal' }, hline(0, 2, 0.5, PAL.gris, 'dot', 'Nyquist (1/2)')],
        { height: 230, title: { text: 'El «doblez»: toda frecuencia cae entre 0 y 1/2' }, xaxis: { title: { text: 'frecuencia real' } }, yaxis: { title: { text: 'frecuencia aparente' }, range: [0, 0.55] } });
      lec.className = 'w-lectura ' + (f > 0.5 ? 'aviso' : 'ok');
      lec.innerHTML = f <= 0.5 ? `Con ${fmt(f, 2)} < 1/2 ciclo por observación, los datos ven la señal tal cual (periodo ${fP(f)}).`
        : `⚠️ ${fmt(f, 2)} > 1/2: los datos no la distinguen de una oscilación de <b>${fmt(fa, 3)}</b> ciclos por observación (periodo ${fP(fa)}). Es un <b>alias</b>.`;
      tab.innerHTML = tablaHTML(['frecuencia real', 'periodo real', 'alias', 'periodo aparente', '¿se ve bien?'],
        [0.1, 0.4, 0.6, 0.9, 1.0417, f].map(v => [fmt(v, 3), fmt(1 / v, 2), fmt(alias(v), 3), fP(alias(v)), v <= 0.5 ? 'sí' : 'no: alias']),
        [0, 0, 0, 0, 0, 1].map(v => (v ? 'resaltado' : '')));
    }
    dibujar();
  });

  /* ======================= 1 · Periodicidad y ciclo ======================= */
  R('w3-manchas', c => {
    const ctr = lienzo(c);
    const a0 = slider(ctr, { etiqueta: 'desde el año', min: 1700, max: 1950, paso: 5, valor: 1700 }, dibujar);
    const a1 = slider(ctr, { etiqueta: 'hasta el año', min: 1760, max: 2008, paso: 4, valor: 2008 }, dibujar);
    const g1 = lamina(c), f = fila(c), g2 = lamina(f), g3 = lamina(f), lec = lectura(c);
    const ex = extra(c, 'Vista extra: la tabla de ciclos'), tab = el('div', { class: 'w-tabla' });
    ex.append(tab);
    const yr = MANCHAS.anio, y = MANCHAS.y, pk = MANCHAS.picos || [];
    function dibujar() {
      let d = a0.get(), h = a1.get();
      if (h - d < 40) h = Math.min(2008, d + 40);
      const sel = pk.filter(i => yr[i] >= d && yr[i] <= h);
      const ciclos = sel.slice(0, -1).map((i, k) => ({ anio: yr[i], alto: y[i], dur: yr[sel[k + 1]] - yr[i] }));
      const shapes = sel.slice(0, -1).map((i, k) => ({ type: 'rect', x0: yr[i], x1: yr[sel[k + 1]], y0: 0, y1: 1, yref: 'paper', fillcolor: k % 2 ? 'rgba(124,105,214,.07)' : 'rgba(224,112,159,.06)', line: { width: 0 }, layer: 'below' }));
      const idx = rango(yr.length).filter(i => yr[i] >= d && yr[i] <= h);
      graf(g1, [lin(idx.map(i => yr[i]), idx.map(i => y[i]), PAL.lav, 'manchas', { line: { color: PAL.lav, width: 1.4 } }),
        { x: sel.map(i => yr[i]), y: sel.map(i => y[i]), mode: 'markers', marker: { symbol: 'star', size: 11, color: PAL.rosa }, name: 'máximos', hovertemplate: '%{x}: %{y:.0f}<extra>máximo</extra>' }],
        { height: 260, title: { text: `Manchas solares ${d}–${h}` }, shapes, showlegend: false, xaxis: { title: { text: 'año' } } });
      const durs = ciclos.map(o => o.dur), m = durs.length ? TS.media(durs) : NaN;
      graf(g2, [{ type: 'bar', x: ciclos.map(o => o.anio), y: durs, marker: { color: durs.map(v => (Math.abs(v - m) > 2 ? PAL.dur : 'rgba(124,105,214,.6)')) }, hovertemplate: 'ciclo que empieza en %{x}: %{y} años<extra></extra>' },
        hline(d, h, m, PAL.rosa, 'dash', `media ${fmt(m, 2)}`)], { height: 250, title: { text: 'Duración de cada ciclo (años)' }, yaxis: { range: [0, 19] }, showlegend: false });
      graf(g3, [{ x: durs, y: ciclos.map(o => o.alto), mode: 'markers', marker: { color: PAL.cel, size: 9 }, text: ciclos.map(o => String(o.anio)), hovertemplate: '%{text}: %{x} años, máximo %{y:.0f}<extra></extra>' }],
        { height: 250, title: { text: 'Duración contra altura del máximo' }, xaxis: { title: { text: 'duración (años)' } }, yaxis: { title: { text: 'manchas en el máximo' } }, showlegend: false });
      lec.innerHTML = durs.length ? `${durs.length} ciclos: duración media <b>${fmt(m, 2)}</b> años, de <b>${Math.min(...durs)}</b> a <b>${Math.max(...durs)}</b>; alturas de ${fmt(Math.min(...ciclos.map(o => o.alto)), 0)} a ${fmt(Math.max(...ciclos.map(o => o.alto)), 0)}. ` +
        (Math.max(...durs) - Math.min(...durs) >= 3 ? 'La duración cambia: es un <b>ciclo</b>, no una periodicidad.' : 'En este tramo corto la duración casi no cambia; amplía el intervalo.') : 'Elige un intervalo más amplio.';
      tab.innerHTML = tablaHTML(['ciclo', 'año del máximo', 'manchas', 'años hasta el siguiente'], ciclos.map((o, k) => [k + 1, o.anio, fmt(o.alto, 0), o.dur]));
    }
    dibujar();
  });

  R('w3-ciclo', c => {
    const ctr = lienzo(c);
    let semilla = 3;
    const tipo = seleccion(ctr, { etiqueta: 'Proceso', valor: 'per', opciones: [['per', 'Oscilación periódica + ruido'], ['est', 'Patrón estacional fijo + ruido'], ['ar2', 'Ciclo AR(2)'], ['azar', 'Ciclo de duración aleatoria']] }, dibujar);
    const P = slider(ctr, { etiqueta: 'periodo P', min: 4, max: 30, paso: 1, valor: 12 }, dibujar);
    const s = slider(ctr, { etiqueta: 'ruido σ', min: 0, max: 1.5, paso: 0.1, valor: 0.5, fmt: num }, dibujar);
    const r = slider(ctr, { etiqueta: 'r (amortiguamiento del AR(2))', min: 0.5, max: 0.98, paso: 0.01, valor: 0.9, fmt: num }, dibujar);
    boton(ctr, 'Otra muestra', () => { semilla += 5; dibujar(); });
    const g1 = lamina(c), f = fila(c), g2 = lamina(f), g3 = lamina(f), lec = lectura(c);
    const ex = extra(c, 'Vista extra: la distancia entre máximos consecutivos'), gx = lamina(ex);
    const n = 300;
    function serie() {
      const t = tipo.get(), p = P.get(), sg = s.get(), rng = TS.rng(semilla), e = rng.normales(n, 1);
      if (t === 'per') { const fi = 2 * Math.PI * rng.unif(); return rango(n, 1).map((tt, i) => 1.5 * Math.cos(2 * Math.PI * tt / p + fi) + sg * e[i]); }
      if (t === 'est') { const pat = rango(p).map(() => rng.normal()); const m = TS.media(pat); return rango(n).map(i => (pat[i % p] - m) * 1.2 + sg * e[i]); }
      if (t === 'ar2') { const rr = r.get(), ar = [1, -2 * rr * Math.cos(2 * Math.PI / p), rr * rr]; return T2.simularARMA(ar, [1], n, { semilla }).y.map((v, i) => v + sg * e[i]); }
      let th = 2 * Math.PI * rng.unif(); const out = [];
      for (let i = 0; i < n; i++) { th += (2 * Math.PI / p) * Math.max(0.2, 1 + 0.35 * rng.normal()); out.push(1.5 * Math.cos(th) + sg * e[i]); }
      return out;
    }
    function dibujar() {
      const t = tipo.get(), p = P.get(); r.mostrar(t === 'ar2');
      const x = serie(), w0 = Math.max(1, Math.round(p / 6)), xs = x.map((_, i) => { let s0 = 0, c0 = 0; for (let j = i - w0; j <= i + w0; j++) if (j >= 0 && j < n) { s0 += x[j]; c0++; } return s0 / c0; });
      const mx = maximos(xs, Math.max(1, Math.floor(p / 3)));
      graf(g1, [lin(rango(n, 1), x, PAL.lav, 'serie', { line: { color: PAL.lav, width: 1.2 } }), { x: mx.map(i => i + 1), y: mx.map(i => x[i]), mode: 'markers', marker: { color: PAL.rosa, size: 7 }, name: 'máximos' }],
        { height: 230, title: { text: { per: 'Periódica: la misma duración siempre', est: 'Patrón estacional fijo (periódico, no senoidal)', ar2: 'Ciclo AR(2): la duración varía', azar: 'Ciclo de duración aleatoria' }[t] }, showlegend: false, xaxis: { title: { text: 't' } } });
      const K = Math.min(3 * p, 90), rac = TS.acf(x, K), tr = trazasACF(rac, n);
      if (t === 'per') tr.push({ x: rango(K, 1), y: rango(K, 1).map(k => Math.cos(2 * Math.PI * k / p) * 1.125 / (1.125 + s.get() ** 2)), mode: 'markers', marker: { color: PAL.menta, size: 5 }, name: 'teórica' });
      if (t === 'ar2') { const rr = r.get(), ar = [1, -2 * rr * Math.cos(2 * Math.PI / p), rr * rr], g = T2.acvfTeorica(ar, [1], K, 1), tot = g[0] + s.get() ** 2; tr.push({ x: rango(K, 1), y: g.slice(1).map(v => v / tot), mode: 'markers', marker: { color: PAL.menta, size: 5 }, name: 'teórica' }); }
      graf(g2, tr, layoutACF('ACF muestral (y teórica)', { height: 270 }));
      const per = sinCero(T3.periodograma(x)), trs = [puntos(per.f, positivo(per.I), 'rgba(124,105,214,.55)', 'periodograma')];
      if (t === 'ar2') { const rr = r.get(), ar = [1, -2 * rr * Math.cos(2 * Math.PI / p), rr * rr], F = T3.frecs(400); trs.push(esp(F, T3.espectroARMA(ar, [1], 1, F).map(v => v + s.get() ** 2), PAL.rosa, 'densidad teórica')); }
      graf(g3, trs, { height: 270, title: { text: 'Espectro' }, xaxis: EJE_W, yaxis: { type: 'log', exponentformat: 'power' }, shapes: marcas([1 / p]), showlegend: false });
      const d = mx.slice(1).map((v, i) => v - mx[i]);
      graf(gx, [{ type: 'histogram', x: d, xbins: { size: 1 }, marker: { color: 'rgba(79,159,216,.6)', line: { color: '#fff', width: 1 } } }, vline(p, 0, Math.max(3, d.length / 2), PAL.rosa, 'dash', `P = ${p}`)],
        { height: 240, title: { text: `Distancia entre máximos: media ${d.length ? fmt(TS.media(d), 1) : '—'}, desv. est. ${d.length > 1 ? fmt(TS.desv(d, 1), 1) : '—'}` }, xaxis: { title: { text: 'periodos entre máximos' } }, showlegend: false });
      const sd = d.length > 1 ? TS.desv(d, 1) : 0;
      lec.innerHTML = (t === 'per' || t === 'est') ? `Periodicidad: la ACF vuelve a subir en ${p}, ${2 * p}, ${3 * p}… sin apagarse, y el periodograma tiene un pico angosto en 1/${p} = ${f3(1 / p)}${t === 'est' ? ' y en sus armónicos k/' + p : ''}.`
        : `Ciclo: la ACF oscila y <b>se apaga</b>; el espectro tiene una joroba ancha alrededor de 1/${p}. La distancia entre máximos varía (desv. est. ${fmt(sd, 1)}).`;
    }
    dibujar();
  });

  /* ======================= 2 · Tiempo y frecuencia ======================= */
  R('w3-mezcla', c => {
    const ctr = lienzo(c);
    const def = [[0.06, 3.6], [0.10, 6.4], [0.40, 9.2]], col = [PAL.cel, PAL.menta, PAL.dur], fases = [-0.983, -0.896, -0.862];
    const ws = [], As = [];
    def.forEach(([w0, a0], k) => {
      ws.push(slider(ctr, { etiqueta: `ω${k + 1}`, min: 0.01, max: 0.5, paso: 0.005, valor: w0, fmt: v => `${fmt(v, 3)} (P = ${fP(v)})` }, dibujar));
      As.push(slider(ctr, { etiqueta: `A${k + 1}`, min: 0, max: 10, paso: 0.2, valor: a0, fmt: num }, dibujar));
    });
    const s = slider(ctr, { etiqueta: 'ruido σ', min: 0, max: 6, paso: 0.25, valor: 0, fmt: num }, dibujar);
    const ajustar = casilla(ctr, 'Redondear a frecuencias de Fourier (j/100)', true, dibujar);
    const g1 = lamina(c), g2 = lamina(c), lec = lectura(c);
    const ex = extra(c, 'Vista extra: la varianza de cada componente'), tab = el('div', { class: 'w-tabla' });
    ex.append(tab);
    const n = 100, ruido = TS.rng(21).normales(n, 1);
    function dibujar() {
      const W = ws.map(o => (ajustar.get() ? Math.round(o.get() * n) / n : o.get())), A = As.map(o => o.get()), t = rango(n, 1);
      const comps = W.map((w, k) => t.map(tt => A[k] * Math.cos(2 * Math.PI * w * tt + fases[k])));
      const x = t.map((_, i) => comps.reduce((sm, cc) => sm + cc[i], 0) + s.get() * ruido[i]);
      graf(g1, comps.map((cc, k) => lin(t, cc, col[k], `componente ${k + 1}`, { line: { color: col[k], width: 1, dash: 'dot' }, opacity: 0.7 })).concat([lin(t, x, PAL.lav, 'serie observada', { line: { color: PAL.lav, width: 2 } })]),
        { height: 260, title: { text: 'La suma de tres oscilaciones (más ruido)' }, xaxis: { title: { text: 't' } } });
      const per = T3.periodograma(x), f = per.f.slice(1), P = per.I.slice(1).map(v => 4 * v / n);
      graf(g2, [barras(f, P, f.map(w => (W.some(v => Math.abs(v - w) < 0.6 / n) ? PAL.rosa : 'rgba(124,105,214,.55)')), 'P(ω_j) = (4/n)·I(ω_j)')],
        { height: 260, title: { text: 'Periodograma escalado: una barra de altura A² por oscilación' }, xaxis: EJE_W, yaxis: { title: { text: 'P(ω_j)' } }, bargap: 0.2, showlegend: false });
      const verdad = A.map(a => a * a / 2), tot = verdad.reduce((a, b) => a + b, 0) + s.get() ** 2;
      lec.innerHTML = `Varianza de la serie: <b>${fmt(TS.varianza(x), 2)}</b> (teórica ${fmt(tot, 2)}). Aportes: ` + verdad.map((v, k) => `ω = ${fmt(W[k], 3)}: ${fmt(100 * v / tot, 1)}%`).join(' · ') + (s.get() > 0 ? ` · ruido: ${fmt(100 * s.get() ** 2 / tot, 1)}%` : '') +
        (ajustar.get() ? '' : ' · Sin redondear, cada barra se reparte entre vecinas: fuga espectral.');
      tab.innerHTML = tablaHTML(['componente', 'ω', 'periodo', 'A', 'varianza A²/2', '% del total', 'P(ω_j) más cercano'], W.map((w, k) => {
        const j = Math.round(w * n);
        return [k + 1, fmt(w, 3), fP(w), fmt(A[k], 1), fmt(verdad[k], 2), fmt(100 * verdad[k] / tot, 1) + '%', j >= 1 && j <= n / 2 ? fmt(P[j - 1], 2) : '—'];
      }));
    }
    dibujar();
  });

  const PROCESOS = {
    rb: { nombre: 'Ruido blanco', ar: () => [1], ma: () => [1], dic: 'ACF cero ↔ espectro plano: todas las frecuencias aportan lo mismo.' },
    ar1: { nombre: 'AR(1)', p: { et: 'φ', min: -0.95, max: 0.95, v: 0.7 }, ar: v => [1, -v], ma: () => [1], dic: v => (v > 0 ? 'ACF positiva que decae ↔ espectro rojo (potencia en frecuencias bajas).' : 'ACF que alterna de signo ↔ espectro azul (potencia en frecuencias altas).') },
    ma1: { nombre: 'MA(1)', p: { et: 'θ', min: -0.95, max: 0.95, v: -0.6 }, ar: () => [1], ma: v => [1, v], dic: v => (v < 0 ? 'Un solo ρ(1) negativo ↔ hueco en frecuencias bajas.' : 'Un solo ρ(1) positivo ↔ espectro que baja suavemente.') },
    ar2: { nombre: 'AR(2) con ciclo', p: { et: 'periodo del ciclo', min: 4, max: 30, v: 10 }, p2: { et: 'r', min: 0.5, max: 0.97, v: 0.85 }, ar: (v, r) => [1, -2 * r * Math.cos(2 * Math.PI / v), r * r], ma: () => [1], dic: 'ACF que oscila y se apaga ↔ pico en la frecuencia del ciclo.' },
    est: { nombre: 'AR estacional (s = 12)', p: { et: 'Φ', min: 0.1, max: 0.95, v: 0.7 }, ar: v => { const a = new Array(13).fill(0); a[0] = 1; a[12] = -v; return a; }, ma: () => [1], dic: 'Picos en la ACF en 12, 24, 36 ↔ picos en el espectro en 0, 1/12, 2/12, …, 6/12.' }
  };
  R('w3-dos-dominios', c => {
    const ctr = lienzo(c);
    let semilla = 9;
    const pr = seleccion(ctr, { etiqueta: 'Proceso', valor: 'ar1', opciones: Object.keys(PROCESOS).map(k => [k, PROCESOS[k].nombre]) }, () => { config(); dibujar(); });
    const p1 = slider(ctr, { etiqueta: 'φ', min: -0.95, max: 0.95, paso: 0.05, valor: 0.7, fmt: num }, dibujar);
    const p2 = slider(ctr, { etiqueta: 'r', min: 0.5, max: 0.97, paso: 0.01, valor: 0.85, fmt: num }, dibujar);
    const lg = casilla(ctr, 'Escala logarítmica', true, dibujar);
    boton(ctr, 'Otra simulación', () => { semilla += 3; dibujar(); });
    const g1 = lamina(c), f = fila(c), g2 = lamina(f), g3 = lamina(f), lec = lectura(c);
    const ex = extra(c, 'Vista extra: el diccionario tiempo ↔ frecuencia'), tab = el('div', { class: 'w-tabla' });
    ex.append(tab);
    function config() {
      const P = PROCESOS[pr.get()];
      p1.mostrar(!!P.p); p2.mostrar(!!P.p2);
      if (P.p) p1.config({ min: P.p.min, max: P.p.max, paso: P.p.et.includes('periodo') ? 1 : 0.05, valor: P.p.v, etiqueta: P.p.et, fmt: num });
      if (P.p2) p2.config({ min: P.p2.min, max: P.p2.max, paso: 0.01, valor: P.p2.v, etiqueta: P.p2.et, fmt: num });
    }
    function dibujar() {
      const P = PROCESOS[pr.get()], v = p1.get(), r = p2.get(), ar = P.ar(v, r), ma = P.ma(v, r), n = 256;
      const x = simular(ar, ma, n, semilla), K = 36;
      graf(g1, [lin(rango(n, 1), x, PAL.lav, 'serie', { line: { color: PAL.lav, width: 1.2 } })], { height: 210, title: { text: `${P.nombre}: una simulación` }, showlegend: false });
      const g = T2.acvfTeorica(ar, ma, K, 1), rt = g.map(u => u / g[0]), rm = TS.acf(x, K);
      graf(g2, [{ type: 'bar', x: rango(K, 1), y: rt.slice(1), marker: { color: 'rgba(124,105,214,.6)' }, width: 0.5, name: 'teórica', hovertemplate: 'k = %{x}: %{y:.3f}<extra>teórica</extra>' },
        { x: rango(K, 1), y: rm.slice(1), mode: 'markers', marker: { color: PAL.rosa, size: 5 }, name: 'muestral' }], layoutACF('En el tiempo: la ACF', { height: 280, showlegend: true }));
      const F = T3.frecs(400), fe = T3.espectroARMA(ar, ma, 1, F), per = sinCero(T3.periodograma(x));
      graf(g3, [puntos(per.f, positivo(per.I), 'rgba(124,105,214,.4)', 'periodograma'), esp(F, fe, PAL.rosa, 'densidad teórica', { line: { color: PAL.rosa, width: 2.4 } })],
        { height: 280, title: { text: 'En la frecuencia: f(ω)' }, xaxis: EJE_WC, yaxis: lg.get() ? { type: 'log', exponentformat: 'power' } : {}, showlegend: true });
      const dic = typeof P.dic === 'function' ? P.dic(v) : P.dic, im = fe.indexOf(Math.max(...fe));
      lec.innerHTML = `${dic} La densidad es máxima en ω = ${f3(F[im])} (periodo ${fP(F[im])}) y su área (de −1/2 a 1/2) es la varianza, ${fmt(g[0], 3)}.`;
      tab.innerHTML = tablaHTML(['Lo que ves en la ACF', 'Lo que ves en el espectro'], [
        ['Cero en todos los rezagos', 'Plano'], ['Positiva, decae despacio', 'Rojo: potencia en frecuencias bajas'], ['Alterna de signo', 'Azul: potencia en frecuencias altas'],
        ['Oscila y se apaga', 'Pico en la frecuencia del ciclo'], ['Picos en 12, 24, 36', 'Picos en k/12'], ['Un ρ(1) negativo y nada más', 'Hueco cerca de ω = 0']],
        [pr.get() === 'rb', pr.get() === 'ar1' && v > 0, pr.get() === 'ar1' && v < 0, pr.get() === 'ar2', pr.get() === 'est', pr.get() === 'ma1' && v < 0].map(b => (b ? 'resaltado' : '')));
    }
    config(); dibujar();
  });

  /* ======================= 3 · Densidad espectral ======================= */
  R('w3-espectro-arma', c => {
    const ctr = lienzo(c);
    const a1 = slider(ctr, { etiqueta: 'φ₁', min: -1.9, max: 1.9, paso: 0.05, valor: 1.2, fmt: num }, dibujar);
    const a2 = slider(ctr, { etiqueta: 'φ₂', min: -0.95, max: 0.95, paso: 0.05, valor: -0.7, fmt: num }, dibujar);
    const t1 = slider(ctr, { etiqueta: 'θ₁', min: -0.95, max: 0.95, paso: 0.05, valor: 0, fmt: num }, dibujar);
    const S = slider(ctr, { etiqueta: 'Φ (AR estacional, s = 12)', min: 0, max: 0.9, paso: 0.05, valor: 0, fmt: num }, dibujar);
    const lg = casilla(ctr, 'Escala logarítmica', true, dibujar);
    const f = fila(c), g1 = lamina(f), g2 = lamina(f), g3 = lamina(c), lec = lectura(c);
    const ex = extra(c, 'Vista extra: valores en frecuencias clave'), tab = el('div', { class: 'w-tabla' });
    ex.append(tab);
    function dibujar() {
      const est = new Array(13).fill(0); est[0] = 1; est[12] = -S.get();
      const ar = T2.polMul([1, -a1.get(), -a2.get()], S.get() ? est : [1]), ma = [1, t1.get()];
      const okEst = T2.esEstacionario ? T2.esEstacionario(ar) : true, F = T3.frecs(1201);
      const fe = okEst ? T3.espectroARMA(ar, ma, 1, F) : F.map(() => NaN);
      graf(g1, [esp(F, fe, PAL.rosa, 'f(ω)', { line: { color: PAL.rosa, width: 2.4 } }), hline(0, 0.5, 1, PAL.gris, 'dot', 'ruido blanco (σ² = 1)')],
        { height: 300, title: { text: okEst ? 'Densidad espectral teórica' : '⚠️ No estacionario: el espectro no existe' }, xaxis: EJE_W, yaxis: lg.get() ? { type: 'log', exponentformat: 'power' } : {}, showlegend: false, shapes: S.get() ? marcas(rango(6, 1).map(k => k / 12)) : [] });
      const ra = raicesInversas([1, -a1.get(), -a2.get()]), rm = raicesInversas(ma), rs = S.get() ? rango(12).map(k => ({ re: Math.pow(S.get(), 1 / 12) * Math.cos(2 * Math.PI * k / 12), im: Math.pow(S.get(), 1 / 12) * Math.sin(2 * Math.PI * k / 12) })) : [];
      graf(g2, [circulo(1), { x: ra.map(z => z.re), y: ra.map(z => z.im), mode: 'markers', marker: { size: 11, color: PAL.lav, symbol: 'circle-open', line: { width: 3 } }, name: 'raíces inversas AR', hovertemplate: '(%{x:.3f}, %{y:.3f})<extra>AR</extra>' },
        { x: rs.map(z => z.re), y: rs.map(z => z.im), mode: 'markers', marker: { size: 7, color: PAL.mant, symbol: 'circle-open', line: { width: 2 } }, name: 'AR estacional' },
        { x: rm.map(z => z.re), y: rm.map(z => z.im), mode: 'markers', marker: { size: 11, color: PAL.menta, symbol: 'x' }, name: 'raíz inversa MA', hovertemplate: '(%{x:.3f}, %{y:.3f})<extra>MA</extra>' }],
        { height: 300, title: { text: 'Raíces inversas: cerca del borde = pico (AR) o valle (MA)' }, xaxis: { range: [-1.25, 1.25], scaleanchor: 'y', zeroline: true }, yaxis: { range: [-1.25, 1.25], zeroline: true }, showlegend: false });
      const K = 40, g = okEst ? T2.acvfTeorica(ar, ma, K, 1) : null;
      if (g) graf(g3, [{ type: 'bar', x: rango(K, 1), y: g.slice(1).map(v => v / g[0]), marker: { color: 'rgba(124,105,214,.6)' }, width: 0.5, hovertemplate: 'k = %{x}: %{y:.3f}<extra></extra>' }], layoutACF('La misma memoria en el tiempo: ACF teórica', { height: 230 }));
      else graf(g3, [], { height: 120, title: { text: 'Sin ACF: el proceso no es estacionario' } });
      if (!okEst) { lec.className = 'w-lectura mal'; lec.innerHTML = 'Alguna raíz inversa del AR está fuera del círculo: el proceso no es estacionario y no tiene densidad espectral. Mueve φ₁ o φ₂.'; tab.innerHTML = ''; return; }
      lec.className = 'w-lectura';
      const im = fe.indexOf(Math.max(...fe)), fmin = fe.indexOf(Math.min(...fe));
      lec.innerHTML = `Pico en ω = <b>${f3(F[im])}</b> (periodo ${fP(F[im])}), con f = ${fmt(fe[im], 3)}; mínimo en ω = ${f3(F[fmin])}. Varianza = área = ${fmt(g[0], 3)}.` +
        (Math.abs(a2.get()) > 0 && a1.get() ** 2 + 4 * a2.get() < 0 ? ` Raíces complejas: el ciclo «de las raíces» tiene periodo ${fmt(2 * Math.PI / Math.acos(a1.get() / (2 * Math.sqrt(-a2.get()))), 2)}; el pico del espectro queda en ${fP(F[im])}.` : '');
      const clave = [0, 1 / 12, 0.1, 0.25, 0.5];
      tab.innerHTML = tablaHTML(['ω', 'periodo', 'f(ω)', 'f(ω)/σ²'], clave.map(w => { const v = T3.espectroARMA(ar, ma, 1, [w])[0]; return [fmt(w, 4), fP(w), fmt(v, 4), fmt(v, 3)]; }).concat([[`pico: ${f4(F[im])}`, fP(F[im]), fmt(fe[im], 4), fmt(fe[im], 3)]]), [0, 0, 0, 0, 0, 1].map(v => (v ? 'resaltado' : '')));
    }
    dibujar();
  });

  const PROC_ACF = {
    ma1: { nombre: 'MA(1), θ = 0.6', ar: [1], ma: [1, 0.6] },
    ar1: { nombre: 'AR(1), φ = 0.6', ar: [1, -0.6], ma: [1] },
    ar1f: { nombre: 'AR(1), φ = 0.9 (memoria larga)', ar: [1, -0.9], ma: [1] },
    ar2: { nombre: 'AR(2), φ = (1.2, −0.72)', ar: [1, -1.2, 0.72], ma: [1] },
    ar1n: { nombre: 'AR(1), φ = −0.7', ar: [1, 0.7], ma: [1] }
  };
  R('w3-fourier-acf', c => {
    const ctr = lienzo(c);
    const pr = seleccion(ctr, { etiqueta: 'Proceso', valor: 'ar1', opciones: Object.keys(PROC_ACF).map(k => [k, PROC_ACF[k].nombre]) }, dibujar);
    const K = slider(ctr, { etiqueta: 'rezagos sumados K', min: 0, max: 40, paso: 1, valor: 2 }, dibujar);
    const g1 = lamina(c), g2 = lamina(c), lec = lectura(c);
    const ex = extra(c, 'Vista extra: las autocovarianzas que se suman'), gx = lamina(ex);
    function dibujar() {
      const P = PROC_ACF[pr.get()], k = K.get(), g = T2.acvfTeorica(P.ar, P.ma, 60, 1), F = T3.frecs(601);
      const fK = T3.espectroDesdeACVF(g, F, k), fv = T3.espectroARMA(P.ar, P.ma, 1, F);
      graf(g1, [esp(F, fv, PAL.gris, 'f(ω) verdadera', { line: { color: PAL.gris, width: 2, dash: 'dot' } }), esp(F, fK, PAL.rosa, `suma parcial con K = ${k}`, { line: { color: PAL.rosa, width: 2.4 } }), hline(0, 0.5, 0, '#ddd', 'solid')],
        { height: 290, title: { text: `γ(0) + 2·Σ γ(k)·cos(2πωk), k = 1…${k}` }, xaxis: EJE_W });
      const onda = k ? F.map(w => 2 * g[k] * Math.cos(2 * Math.PI * w * k)) : F.map(() => g[0]);
      graf(g2, [esp(F, onda, PAL.cel, k ? `2γ(${k})·cos(2πω·${k})` : 'γ(0)')], { height: 220, title: { text: k ? `El último término: una onda de periodo 1/${k} en el eje de frecuencias, de altura 2γ(${k}) = ${fmt(2 * g[k], 4)}` : 'Con K = 0 solo está la varianza γ(0): un espectro plano' }, xaxis: EJE_W, showlegend: false });
      const err = Math.max(...F.map((w, i) => Math.abs(fK[i] - fv[i]))), neg = Math.min(...fK) < 0;
      lec.innerHTML = `Error máximo de la suma parcial: <b>${fmt(err, 4)}</b>.` + (neg ? ' ⚠️ Con pocos rezagos la suma parcial puede volverse <b>negativa</b>: por eso los estimadores truncados necesitan pesos que bajen suavemente.' : '') +
        (pr.get() === 'ma1' && k >= 1 ? ' En un MA(1), γ(k) = 0 para k ≥ 2: con K = 1 ya es exacto.' : '') + (pr.get() === 'ar1f' ? ' Con φ = 0.9 la memoria es larga: hacen falta muchos rezagos.' : '');
      graf(gx, tallos(rango(31), g.slice(0, 31), PAL.lav).concat([{ x: [k], y: [g[k] || 0], mode: 'markers', marker: { color: PAL.rosa, size: 11 }, showlegend: false }]), { height: 230, title: { text: 'γ(k), k = 0…30 (en rosa, el último que sumaste)' }, xaxis: { title: { text: 'rezago k' } }, showlegend: false });
    }
    dibujar();
  });

  R('w3-bandas', c => {
    const ctr = lienzo(c);
    let semilla = 4;
    const pr = seleccion(ctr, { etiqueta: 'Proceso', valor: 'ar1', opciones: Object.keys(PROC_ACF).map(k => [k, PROC_ACF[k].nombre]) }, dibujar);
    const a = slider(ctr, { etiqueta: 'desde ω', min: 0, max: 0.49, paso: 0.005, valor: 0, fmt: v => `${fmt(v, 3)} (P = ${fP(v)})` }, dibujar);
    const b = slider(ctr, { etiqueta: 'hasta ω', min: 0.01, max: 0.5, paso: 0.005, valor: 0.1, fmt: v => `${fmt(v, 3)} (P = ${fP(v)})` }, dibujar);
    boton(ctr, 'Otra simulación', () => { semilla += 2; dibujar(); });
    const g1 = lamina(c), g2 = lamina(c), lec = lectura(c);
    const ex = extra(c, 'Vista extra: el porcentaje en cinco bandas fijas'), tab = el('div', { class: 'w-tabla' });
    ex.append(tab);
    function dibujar() {
      let lo = a.get(), hi = b.get();
      if (hi <= lo + 0.005) hi = Math.min(0.5, lo + 0.01);
      const P = PROC_ACF[pr.get()], F = T3.frecs(2001), fe = T3.espectroARMA(P.ar, P.ma, 1, F), v0 = 2 * T3.integral(F, fe, 0, 0.5);
      const frac = 2 * T3.integral(F, fe, lo, hi) / v0, sel = F.map((w, i) => (w >= lo && w <= hi ? fe[i] : null));
      graf(g1, [esp(F, fe, PAL.lav, 'f(ω)'), esp(F, sel, PAL.rosa, 'banda', { fill: 'tozeroy', fillcolor: 'rgba(224,112,159,.25)', line: { color: PAL.rosa, width: 2.4 } })],
        { height: 270, title: { text: `La banda [${fmt(lo, 3)}, ${fmt(hi, 3)}] (periodos de ${fP(hi)} a ${fP(lo)}) tiene el ${fmt(100 * frac, 1)}% de la varianza` }, xaxis: EJE_W, showlegend: false });
      const n = 400, x = simular(P.ar, P.ma, n, semilla), X = T3.fft(x.map(v => v - TS.media(x)));
      const keep = rango(n).map(j => { const w = Math.min(j, n - j) / n; return w >= lo && w <= hi ? 1 : 0; });
      const y = T3.ifft(X.re.map((v, j) => v * keep[j]), X.im.map((v, j) => v * keep[j])).re;
      graf(g2, [lin(rango(n, 1), x.map(v => v - TS.media(x)), '#cfc8ea', 'serie completa', { line: { color: '#cfc8ea', width: 1.2 } }), lin(rango(n, 1), y, PAL.rosa, 'solo la banda', { line: { color: PAL.rosa, width: 1.8 } })],
        { height: 240, title: { text: `La parte de una simulación que vive en esa banda: ${fmt(100 * TS.varianza(y) / TS.varianza(x), 1)}% de su varianza` }, xaxis: { title: { text: 't' } } });
      lec.innerHTML = `Fracción de la varianza en la banda = 2∫ f(ω)dω / γ(0) = <b>${fmt(100 * frac, 1)}%</b>, aunque la banda es el ${fmt(100 * (hi - lo) / 0.5, 0)}% del rango de frecuencias.`;
      const bandas = [[0, 1 / 20, 'más de 20'], [1 / 20, 1 / 10, '10 a 20'], [1 / 10, 1 / 5, '5 a 10'], [1 / 5, 1 / 3, '3 a 5'], [1 / 3, 0.5, '2 a 3']];
      tab.innerHTML = tablaHTML(['periodos', 'banda de ω', '% de la varianza'], bandas.map(([l, h, t]) => [t, `${fmt(l, 3)}–${fmt(h, 3)}`, fmt(200 * T3.integral(F, fe, l, h) / v0, 1) + '%']));
    }
    dibujar();
  });

  /* ======================= 4 · Periodograma ======================= */
  const VENTAS8 = [5, 9, 6, 2, 6, 10, 7, 3];
  const detrendLineal = x => T3.quitarTendencia(x, 'linear');
  const SERIES_RF = {
    ventas: { nombre: 'Ventas trimestrales (n = 8)', y: () => VENTAS8, j: 2 },
    ap: { nombre: 'AirPassengers: log sin tendencia (n = 144)', y: () => detrendLineal(LOGAP), j: 12 },
    manchas: { nombre: 'Manchas solares (n = 309)', y: () => MANCHAS.y, j: 28 },
    anom: { nombre: 'El Niño: anomalías (n = 732)', y: () => NINO_ANOM, j: 14 }
  };
  R('w3-regresion-fourier', c => {
    const ctr = lienzo(c);
    const sr = seleccion(ctr, { etiqueta: 'Serie', valor: 'ventas', opciones: Object.keys(SERIES_RF).map(k => [k, SERIES_RF[k].nombre]) }, () => { config(); dibujar(); });
    const jj = slider(ctr, { etiqueta: 'frecuencia de Fourier j', min: 1, max: 4, paso: 1, valor: 2 }, dibujar);
    const g1 = lamina(c), g2 = lamina(c), lec = lectura(c);
    const ex = extra(c, 'Vista extra: la tabla de Parseval acumulada'), tab = el('div', { class: 'w-tabla' });
    ex.append(tab);
    function config() { const S = SERIES_RF[sr.get()], n = S.y().length; jj.config({ min: 1, max: Math.floor(n / 2), paso: 1, valor: S.j, fmt: v => `${v} (ω = ${fmt(v / n, 4)}, P = ${fmt(n / v, 2)})` }); }
    function dibujar() {
      const x = SERIES_RF[sr.get()].y(), n = x.length, m = TS.media(x), xc = x.map(v => v - m), j = jj.get();
      const rf = T3.regresionFourier(xc, j), t = rango(n, 1);
      graf(g1, [{ x: t, y: xc, mode: n > 40 ? 'lines' : 'lines+markers', line: { color: '#b9b2d8', width: 1.2 }, marker: { color: PAL.lav, size: 7 }, name: 'serie − media' },
        lin(t, rf.ajuste, PAL.rosa, `oscilación ajustada en ω = ${fmt(j / n, 4)}`, { line: { color: PAL.rosa, width: 2.2 } })],
        { height: 250, title: { text: `β₁ = ${f3(rf.b1)}, β₂ = ${f3(rf.b2)} → amplitud ${f3(Math.hypot(rf.b1, rf.b2))}` }, xaxis: { title: { text: 't' } } });
      const per = T3.periodograma(x), f = per.f.slice(1), I = per.I.slice(1);
      graf(g2, [barras(f, I, f.map((_, i) => (i + 1 === j ? PAL.rosa : 'rgba(124,105,214,.55)')), 'I(ω_j)')],
        { height: 250, title: { text: 'Periodograma I(ω_j) (la barra rosa es la que ajustaste)' }, xaxis: EJE_W, bargap: n > 100 ? 0 : 0.25, showlegend: false });
      const ss = xc.reduce((s, v) => s + v * v, 0), aporte = i => (n % 2 === 0 && i + 1 === n / 2 ? 1 : 2) * I[i];
      lec.innerHTML = `I(ω_${j}) = <b>${fmt(rf.I, 4)}</b>; P = β₁² + β₂² = ${fmt(rf.P, 4)} = (4/n)·I. Esta frecuencia explica el <b>${fmt(100 * aporte(j - 1) / ss, 1)}%</b> de la suma de cuadrados (${fmt(ss, 2)}).`;
      const orden = rango(I.length).sort((a, b) => aporte(b) - aporte(a)).slice(0, 8);
      let acum = 0;
      tab.innerHTML = tablaHTML(['j', 'ω_j', 'periodo', 'I(ω_j)', '% de la suma de cuadrados', '% acumulado'], orden.map(i => { acum += aporte(i) / ss; return [i + 1, fmt(f[i], 4), fmt(1 / f[i], 2), fmt(I[i], 4), fmt(100 * aporte(i) / ss, 1) + '%', fmt(100 * acum, 1) + '%']; }), orden.map(i => (i + 1 === j ? 'resaltado' : '')));
    }
    config(); dibujar();
  });

  R('w3-periodograma-ruido', c => {
    const ctr = lienzo(c);
    let semilla = 12;
    const nn = segmentado(ctr, { etiqueta: 'tamaño de muestra n', valor: '256', opciones: [['64', '64'], ['256', '256'], ['1024', '1024'], ['2048', '2048']] }, dibujar);
    boton(ctr, 'Otra muestra', () => { semilla += 7; dibujar(); });
    const g1 = lamina(c), g2 = lamina(c), lec = lectura(c);
    const ex = extra(c, 'Vista extra: media y varianza de I/f para varios n'), tab = el('div', { class: 'w-tabla' });
    ex.append(tab);
    const V = AR2_VERDAD;
    function cociente(n, s) { const x = simular(V.ar, V.ma, n, s), per = sinCero(T3.periodograma(x)), fv = T3.espectroARMA(V.ar, V.ma, 1, per.f); return { per, fv, q: per.I.map((v, i) => v / fv[i]) }; }
    function dibujar() {
      const n = +nn.get(), { per, fv, q } = cociente(n, semilla), F = T3.frecs(500), fF = T3.espectroARMA(V.ar, V.ma, 1, F);
      const inf = fF.map(v => v * 0.0506 / 2), sup = fF.map(v => v * 7.378 / 2);
      graf(g1, [{ x: F.concat(F.slice().reverse()), y: sup.concat(inf.slice().reverse()), fill: 'toself', fillcolor: 'rgba(124,105,214,.12)', line: { width: 0 }, hoverinfo: 'skip', name: 'donde cae el 95% de I' },
        puntos(per.f, positivo(per.I), 'rgba(124,105,214,.7)', 'periodograma'), esp(F, fF, PAL.rosa, 'densidad verdadera', { line: { color: PAL.rosa, width: 2.4 } })],
        { height: 300, title: { text: `AR(2) con n = ${n}: ${per.f.length} ordenadas, todas igual de ruidosas` }, xaxis: EJE_W, yaxis: { type: 'log', exponentformat: 'power', range: [-3, 2.3] } });
      const xs = rango(121).map(i => i / 10);
      graf(g2, [{ type: 'histogram', x: q.map(v => 2 * v), histnorm: 'probability density', xbins: { start: 0, end: 12, size: 0.5 }, marker: { color: 'rgba(79,159,216,.55)', line: { color: '#fff', width: 0.5 } }, name: '2I/f' },
        lin(xs, xs.map(v => 0.5 * Math.exp(-v / 2)), PAL.rosa, 'densidad χ²₂', { line: { color: PAL.rosa, width: 2.4 } })], { height: 240, title: { text: 'El cociente 2I/f sigue una χ²₂ (exponencial) para cualquier n' }, xaxis: { title: { text: '2 I(ω_j) / f(ω_j)' }, range: [0, 12] } });
      lec.innerHTML = `Con n = ${n}: media de I/f = <b>${fmt(TS.media(q), 2)}</b> (≈ 1: casi insesgado) y varianza = <b>${fmt(TS.varianza(q, 1), 2)}</b> (≈ 1: el error es tan grande como f). Más datos dan más puntos, no puntos más precisos.`;
      tab.innerHTML = tablaHTML(['n', 'ordenadas', 'media de I/f', 'varianza de I/f'], [64, 256, 1024, 2048].map(m => { const r = cociente(m, semilla + 101); return [m, r.q.length, fmt(TS.media(r.q), 3), fmt(TS.varianza(r.q, 1), 3)]; }), [64, 256, 1024, 2048].map(m => (m === n ? 'resaltado' : '')));
    }
    dibujar();
  });

  // Periodograma con las opciones de scipy.signal.periodogram
  function pgScipy(x, { fs = 1, detrend = 'constant', ventana = 'boxcar', escala = 'density', alfa = 0.1 }) {
    const r = T3.periodograma(x, { detrend: detrend === 'False' ? 'none' : detrend, ventana, alfa }), n = x.length;
    const w = T3.ventana(ventana, n, { alfa }), S1 = w.reduce((a, b) => a + b, 0);
    const P = r.re.map((re, j) => { const v = re * re + r.im[j] * r.im[j], d = j === 0 || (n % 2 === 0 && j === n / 2) ? 1 : 2; return escala === 'density' ? d * v / (fs * r.S2) : d * v / (S1 * S1); });
    return { f: r.f.map(v => v * fs), P };
  }
  const SERIES_PY = {
    log: { nombre: 'log(AirPassengers)', y: () => LOGAP, cod: 'x = log_serie.values', mensual: true },
    dlog: { nombre: 'Δ log(AirPassengers)', y: () => TS.diff(LOGAP), cod: 'x = np.diff(log_serie.values)', mensual: true },
    manchas: { nombre: 'Manchas solares', y: () => MANCHAS.y, cod: 'x = manchas.values', mensual: false }
  };
  R('py3-periodogram', c => {
    const ctr = lienzo(c);
    let activo = 'x';
    const sr = seleccion(ctr, { etiqueta: 'x', valor: 'dlog', opciones: Object.keys(SERIES_PY).map(k => [k, SERIES_PY[k].nombre]) }, () => { activo = 'x'; dibujar(); });
    const fsS = segmentado(ctr, { etiqueta: 'fs', valor: '1', opciones: [['1', '1.0'], ['12', '12']] }, () => { activo = 'fs'; dibujar(); });
    const dt = segmentado(ctr, { etiqueta: 'detrend', valor: 'constant', opciones: [['constant', '"constant"'], ['linear', '"linear"'], ['False', 'False']] }, () => { activo = 'detrend'; dibujar(); });
    const wn = segmentado(ctr, { etiqueta: 'window', valor: 'boxcar', opciones: [['boxcar', '"boxcar"'], ['hann', '"hann"'], ['tukey', '("tukey", 0.1)']] }, () => { activo = 'window'; dibujar(); });
    const sc = segmentado(ctr, { etiqueta: 'scaling', valor: 'density', opciones: [['density', '"density"'], ['spectrum', '"spectrum"']] }, () => { activo = 'scaling'; dibujar(); });
    const lg = casilla(ctr, 'Eje y logarítmico', true, dibujar);
    const pc = panelCodigo(c), g = lamina(c), lec = lectura(c);
    const params = panelParametros(c, [
      { nombre: 'x', que: 'La serie (un arreglo de números).', rec: 'Una serie <b>estacionaria</b>: quita la tendencia o diferencia antes.' },
      { nombre: 'fs', que: 'Frecuencia de muestreo: cuántas observaciones por unidad de tiempo. Cambia las unidades del eje de frecuencias.', rec: '<code>1.0</code> para ciclos por observación; <code>12</code> en datos mensuales para ciclos por año.' },
      { nombre: 'detrend', que: 'Qué quitar antes de la FFT: la media, una recta o nada.', rec: '<code>"constant"</code> (por omisión) o <code>"linear"</code> si hay tendencia lineal.' },
      { nombre: 'window', que: 'Ventana que multiplica a la serie para reducir la fuga espectral.', rec: '<code>"boxcar"</code> (sin ventana) para el periodograma clásico; <code>("tukey", 0.1)</code> o <code>"hann"</code> si hay picos fuertes.' },
      { nombre: 'scaling', que: '<code>"density"</code>: densidad (unidades² por unidad de frecuencia); <code>"spectrum"</code>: potencia de cada frecuencia (unidades²).', rec: '<code>"density"</code> para comparar con f(ω); <code>"spectrum"</code> para leer la amplitud de una oscilación pura.' }
    ]);
    function dibujar() {
      const S = SERIES_PY[sr.get()], x = S.y(), fs = +fsS.get(), win = wn.get(), r = pgScipy(x, { fs, detrend: dt.get(), ventana: win, escala: sc.get() });
      const winPy = win === 'tukey' ? '("tukey", 0.1)' : `"${win}"`, detPy = dt.get() === 'False' ? 'False' : `"${dt.get()}"`;
      pc.codigo(codigoPython(`from scipy import signal\n\n{x}\nf, Pxx = signal.periodogram(x, fs={fs}, detrend={detrend}, window={window}, scaling={scaling})\nprint("frecuencias:", np.round(f[:4], 4), "…", f[-1])\nprint("Pxx:", np.round(Pxx[:4], 6))\nj = Pxx[1:].argmax() + 1\nprint(f"pico en f = {f[j]:.4f} → periodo {1 / f[j]:.2f}")`, { x: S.cod, fs: fs === 1 ? '1.0' : '12', detrend: detPy, window: winPy, scaling: `"${sc.get()}"` }, activo));
      const j = r.P.slice(1).indexOf(Math.max(...r.P.slice(1))) + 1;
      pc.salida([`frecuencias: [${r.f.slice(0, 4).map(v => fmt(v, 4)).join(' ')}] … ${fmt(r.f[r.f.length - 1], 4)}`, `Pxx: [${r.P.slice(0, 4).map(v => fmt(v, 6)).join(' ')}]`, `pico en f = ${fmt(r.f[j], 4)} → periodo ${fmt(1 / r.f[j], 2)}`].join('\n'));
      graf(g, [esp(r.f.slice(1), positivo(r.P.slice(1)), PAL.lav, 'Pxx', { mode: 'lines+markers', marker: { size: 3.5, color: PAL.lav }, line: { color: PAL.lav, width: 1.2 } })],
        { height: 280, title: { text: `periodogram(${S.nombre})` }, xaxis: { title: { text: fs === 1 ? 'f (ciclos por observación)' : 'f (ciclos por año)' }, range: [0, fs / 2] }, yaxis: lg.get() ? { type: 'log', exponentformat: 'power' } : {}, showlegend: false, shapes: S.mensual ? marcas(rango(6, 1).map(k => (k / 12) * fs)) : [] });
      params({ x: S.cod.replace('x = ', ''), fs: fs === 1 ? '1.0' : '12', detrend: detPy, window: winPy, scaling: `"${sc.get()}"` }, activo);
      lec.innerHTML = (dt.get() === 'False' ? '⚠️ Sin quitar la media, la frecuencia 0 recibe una potencia enorme. ' : '') + (S.mensual && fs === 12 ? 'Con fs = 12 el ciclo anual cae en f = 1 ciclo por año. ' : '') +
        (sr.get() === 'log' && dt.get() !== 'linear' ? 'El logaritmo tiene tendencia: la potencia se amontona cerca de 0. Prueba <code>detrend="linear"</code> o la serie diferenciada.' : `El pico está en periodo ${fmt(1 / r.f[j], 2)} ${fs === 12 ? 'años' : S.mensual ? 'meses' : 'años'}.`);
    }
    dibujar();
  });

  R('w3-fuga', c => {
    const ctr = lienzo(c);
    const n = 64;
    const dj = slider(ctr, { etiqueta: 'frecuencia de la oscilación (en unidades de 1/n)', min: 6, max: 10, paso: 0.05, valor: 8.5, fmt: v => `${fmt(v, 2)}/64 = ${fmt(v / n, 4)}` }, dibujar);
    const wn = segmentado(ctr, { etiqueta: 'Ventana', valor: 'boxcar', opciones: [['boxcar', 'Sin ventana'], ['hann', 'Hann'], ['hamming', 'Hamming']] }, dibujar);
    const g1 = lamina(c), g2 = lamina(c), lec = lectura(c);
    const ex = extra(c, 'Vista extra: la ventana y su núcleo en frecuencia'), fx = fila(ex), gx1 = lamina(fx), gx2 = lamina(fx);
    function espectroFino(x, w, M) {
      const pad = x.map((v, i) => v * w[i]).concat(new Array(M - n).fill(0)), F = T3.fft(pad), S2 = w.reduce((a, b) => a + b * b, 0);
      const f = [], P = [];
      for (let j = 0; j <= M / 2; j++) { f.push(j / M); P.push((F.re[j] ** 2 + F.im[j] ** 2) / S2); }
      return { f, P };
    }
    const dB = (P, ref) => P.map(v => 10 * Math.log10(Math.max(v / ref, 1e-12)));
    function dibujar() {
      const w0 = dj.get() / n, win = wn.get(), w = T3.ventana(win, n), x = rango(n, 1).map(t => Math.cos(2 * Math.PI * w0 * t));
      graf(g1, [lin(rango(n, 1), x.map((v, i) => v * w[i]), PAL.lav, 'serie × ventana', { mode: 'lines+markers', marker: { size: 4 } }), lin(rango(n, 1), w, PAL.rosa, 'ventana', { line: { color: PAL.rosa, width: 1.6, dash: 'dot' } })],
        { height: 220, title: { text: `Oscilación de frecuencia ${fmt(w0, 4)} (${fmt(dj.get(), 2)} vueltas en ${n} datos)` }, xaxis: { title: { text: 't' } } });
      const fino = espectroFino(x, w, 2048), per = T3.periodograma(x, { ventana: win }), ref = Math.max(...fino.P);
      graf(g2, [esp(fino.f, dB(fino.P, ref), '#c9c3e3', 'transformada continua (relleno de ceros)', { line: { color: '#c9c3e3', width: 1.4 } }),
        { x: per.f, y: dB(per.I, ref), mode: 'markers', marker: { color: PAL.lav, size: 7 }, name: 'periodograma (frecuencias de Fourier)', hovertemplate: 'ω = %{x:.4f}<br>%{y:.1f} dB<extra></extra>' }],
        { height: 280, title: { text: 'Periodograma en decibeles (0 dB = el pico)' }, xaxis: EJE_W, yaxis: { range: [-90, 5], title: { text: 'dB' } }, shapes: marcas([w0], PAL.rosa) });
      const lejos = per.f.map((f, i) => (Math.abs(f - w0) > 4 / n ? dB([per.I[i]], ref)[0] : -999)), peor = Math.max(...lejos), entera = Math.abs(dj.get() - Math.round(dj.get())) < 1e-9;
      lec.innerHTML = entera && win === 'boxcar' ? 'La frecuencia es de Fourier y no hay ventana: toda la energía cae en una barra; las demás valen 0 (−∞ dB).'
        : `A más de 4 frecuencias de distancia del pico, la fuga llega hasta <b>${fmt(peor, 1)} dB</b>. ` + (win === 'boxcar' ? 'Sin ventana, la fuga lejana es alta.' : 'La ventana bajó mucho la fuga lejana, a cambio de un pico central más ancho.');
      const M = 4096, W = T3.fft(w.concat(new Array(M - n).fill(0))), fk = rango(M / 2 + 1).map(j => j / M), kern = fk.map((_, j) => W.re[j] ** 2 + W.im[j] ** 2);
      graf(gx1, [lin(rango(n, 1), w, PAL.rosa, 'ventana')], { height: 220, title: { text: 'La ventana en el tiempo' }, showlegend: false });
      graf(gx2, [esp(fk, dB(kern, kern[0]), PAL.cel, 'núcleo')], { height: 220, title: { text: 'Su núcleo |W(ω)|² en dB' }, xaxis: { range: [0, 0.25], title: { text: 'distancia en frecuencia' } }, yaxis: { range: [-100, 5] }, showlegend: false });
    }
    dibujar();
  });

  /* ======================= 5 · Suavizado y Welch ======================= */
  const SERIES_SUAVE = ['manchas', 'anom', 'ar2'];
  R('w3-daniell', c => {
    const ctr = lienzo(c);
    let semilla = 5;
    const sr = seleccion(ctr, { etiqueta: 'Serie', valor: 'manchas', opciones: opcionesSeries(SERIES_SUAVE) }, dibujar);
    const mm = slider(ctr, { etiqueta: 'm (L = 2m + 1)', min: 0, max: 15, paso: 1, valor: 2, fmt: v => `${v} (L = ${2 * v + 1})` }, dibujar);
    const mod = casilla(ctr, 'Daniell modificado', false, dibujar);
    const lg = casilla(ctr, 'Escala logarítmica', true, dibujar);
    boton(ctr, 'Otra simulación', () => { semilla += 3; dibujar(); });
    const g1 = lamina(c), lec = lectura(c);
    const ex = extra(c, 'Vista extra: el núcleo de suavizado y los grados de libertad'), fx = fila(ex), gx = lamina(fx), tab = el('div', { class: 'w-tabla' });
    fx.append(tab);
    function dibujar() {
      const k = sr.get(), x = SERIES[k].y(512, semilla), m = mm.get(), D = T3.daniell(x, m, { modificado: mod.get() }), ic = T3.intervalo(D.fhat, D.gl);
      const tr = [{ x: D.f.concat(D.f.slice().reverse()), y: ic.sup.concat(ic.inf.slice().reverse()), fill: 'toself', fillcolor: 'rgba(224,112,159,.13)', line: { width: 0 }, hoverinfo: 'skip', name: 'IC de 95%' },
        puntos(D.f, positivo(D.I), 'rgba(140,135,170,.45)', 'periodograma crudo', { marker: { size: 3.5, color: 'rgba(140,135,170,.45)' } }), esp(D.f, D.fhat, PAL.rosa, `suavizado (L = ${2 * m + 1})`, { line: { color: PAL.rosa, width: 2.6 } })];
      if (SERIES[k].verdad) { const V = SERIES[k].verdad, F = T3.frecs(400); tr.push(esp(F, T3.espectroARMA(V.ar, V.ma, V.s2, F), PAL.gris, 'densidad verdadera', { line: { color: PAL.texto, width: 1.6, dash: 'dot' } })); }
      const ymax = Math.max(...D.fhat), x0 = 0.38;
      tr.push({ x: [x0, x0 + D.B], y: [ymax * (lg.get() ? 3 : 1.05), ymax * (lg.get() ? 3 : 1.05)], mode: 'lines+text', line: { color: PAL.menta, width: 5 }, text: ['', `B = ${fmt(D.B, 4)}`], textposition: 'middle right', name: 'ancho de banda', hoverinfo: 'skip' });
      graf(g1, tr, { height: 330, title: { text: `${SERIES[k].nombre}: Daniell${mod.get() ? ' modificado' : ''} con m = ${m}` }, xaxis: EJE_W, yaxis: lg.get() ? { type: 'log', exponentformat: 'power' } : {} });
      const ip = D.fhat.indexOf(ymax);
      lec.innerHTML = `Pico del suavizado en ω = <b>${f4(D.f[ip])}</b> (periodo ${fP(D.f[ip])} ${SERIES[k].u}). Grados de libertad 2L<sub>h</sub> = ${fmt(D.gl, 1)}; el IC va de ${fmt(D.gl / ic.qSup, 3)}·f̂ a ${fmt(D.gl / ic.qInf, 3)}·f̂ (cociente ${fmt(ic.qSup / ic.qInf, 1)}).` +
        (m === 0 ? ' Con m = 0 no hay suavizado: es el periodograma crudo, con su IC enorme.' : '');
      const h = D.pesos, M = (h.length - 1) / 2;
      graf(gx, tallos(rango(h.length).map(i => i - M), h, PAL.lav), { height: 220, title: { text: 'Pesos h_k del núcleo' }, xaxis: { title: { text: 'k' } }, showlegend: false });
      tab.innerHTML = tablaHTML(['Cantidad', 'Valor'], [['L = 2m + 1', 2 * m + 1], ['L_h = 1/Σh_k²', fmt(D.Lh, 2)], ['grados de libertad', fmt(D.gl, 1)], ['ancho de banda B', fmt(D.B, 4)], ['factor inferior gl/χ²(0.975)', fmt(D.gl / ic.qSup, 3)], ['factor superior gl/χ²(0.025)', fmt(D.gl / ic.qInf, 3)]]);
    }
    dibujar();
  });

  R('w3-welch', c => {
    const ctr = lienzo(c);
    let semilla = 8;
    const sr = seleccion(ctr, { etiqueta: 'Serie', valor: 'ar2', opciones: opcionesSeries(SERIES_SUAVE) }, dibujar);
    const M = slider(ctr, { etiqueta: 'nperseg (longitud de los segmentos)', min: 16, max: 300, paso: 4, valor: 64 }, dibujar);
    const ov = segmentado(ctr, { etiqueta: 'traslape', valor: '50', opciones: [['0', '0%'], ['25', '25%'], ['50', '50%'], ['75', '75%']] }, dibujar);
    const wn = segmentado(ctr, { etiqueta: 'ventana', valor: 'hann', opciones: [['hann', 'Hann'], ['hamming', 'Hamming'], ['boxcar', 'Sin ventana']] }, dibujar);
    boton(ctr, 'Otra simulación', () => { semilla += 3; dibujar(); });
    const g1 = lamina(c), g2 = lamina(c), lec = lectura(c);
    const ex = extra(c, 'Vista extra: segmentos, resolución y grados de libertad'), tab = el('div', { class: 'w-tabla' });
    ex.append(tab);
    function dibujar() {
      const k = sr.get(), x = SERIES[k].y(600, semilla), n = x.length, m = Math.min(M.get(), n), no = Math.floor(m * +ov.get() / 100);
      const W = T3.welch(x, { nperseg: m, noverlap: no, ventana: wn.get() }), K = W.K;
      const shapes = W.ini.map((a, i) => ({ type: 'rect', x0: a + 1, x1: a + m, y0: 0, y1: 1, yref: 'paper', fillcolor: i % 2 ? 'rgba(79,159,216,.12)' : 'rgba(224,112,159,.12)', line: { width: 0 }, layer: 'below' }));
      graf(g1, [lin(rango(n, 1), x, PAL.lav, 'serie', { line: { color: PAL.lav, width: 1 } })], { height: 210, title: { text: `${K} segmentos de ${m} datos (traslape ${ov.get()}%)` }, shapes, showlegend: false });
      const tr = W.ini.slice(0, 12).map((a, i) => { const p = T3.periodograma(x.slice(a, a + m), { ventana: wn.get() }); const col = i % 2 ? 'rgba(79,159,216,.35)' : 'rgba(224,112,159,.32)'; return esp(p.f.slice(1), positivo(p.I.slice(1)), col, i ? '' : 'periodograma de cada segmento', { line: { width: 1, color: col }, showlegend: !i }); });
      const fw = W.f.slice(1), pw = W.pxx.slice(1).map((v, i) => (m % 2 === 0 && i === W.f.length - 2 ? v : v / 2));
      tr.push(esp(fw, pw, PAL.lav, 'Welch (promedio)', { line: { color: PAL.lav, width: 3 } }));
      if (SERIES[k].verdad) { const V = SERIES[k].verdad, F = T3.frecs(400); tr.push(esp(F, T3.espectroARMA(V.ar, V.ma, V.s2, F), PAL.texto, 'densidad verdadera', { line: { color: PAL.texto, width: 1.6, dash: 'dot' } })); }
      graf(g2, tr, { height: 320, title: { text: 'Periodogramas de los segmentos y su promedio' }, xaxis: EJE_W, yaxis: { type: 'log', exponentformat: 'power' } });
      const ip = pw.indexOf(Math.max(...pw));
      lec.innerHTML = `Resolución 1/M = ${fmt(1 / m, 4)}; el pico de Welch está en ω = <b>${f4(fw[ip])}</b> (periodo ${fP(fw[ip])} ${SERIES[k].u}). ` + (K < 4 ? '⚠️ Con tan pocos segmentos la estimación sigue siendo ruidosa.' : m < 32 ? '⚠️ Segmentos muy cortos: los picos se ven borrosos.' : 'Buen equilibrio entre resolución y estabilidad.');
      tab.innerHTML = tablaHTML(['Cantidad', 'Valor'], [['n', n], ['nperseg M', m], ['noverlap', no], ['segmentos K', K], ['resolución 1/M', fmt(1 / m, 4)], ['grados de libertad aproximados (≈ 2K)', 2 * K], ['frecuencia del pico', `${fmt(fw[ip], 4)} (periodo ${fP(fw[ip])})`]]);
    }
    dibujar();
  });

  const medianaBias = K => { let b = 1; for (let k = 1; k <= Math.floor((K - 1) / 2); k++) b += 1 / (2 * k + 1) - 1 / (2 * k); return b; };
  R('py3-welch', c => {
    const ctr = lienzo(c);
    let activo = 'nperseg';
    const M = segmentado(ctr, { etiqueta: 'nperseg', valor: '240', opciones: [['60', '60'], ['120', '120'], ['240', '240'], ['480', '480']] }, () => { activo = 'nperseg'; dibujar(); });
    const ov = segmentado(ctr, { etiqueta: 'noverlap', valor: 'None', opciones: [['None', 'None (la mitad)'], ['0', '0']] }, () => { activo = 'noverlap'; dibujar(); });
    const wn = segmentado(ctr, { etiqueta: 'window', valor: 'hann', opciones: [['hann', '"hann"'], ['hamming', '"hamming"'], ['boxcar', '"boxcar"']] }, () => { activo = 'window'; dibujar(); });
    const av = segmentado(ctr, { etiqueta: 'average', valor: 'mean', opciones: [['mean', '"mean"'], ['median', '"median"']] }, () => { activo = 'average'; dibujar(); });
    const pc = panelCodigo(c), g = lamina(c), lec = lectura(c);
    const params = panelParametros(c, [
      { nombre: 'nperseg', que: 'Longitud de cada segmento. Decide la resolución (1/nperseg) y cuántos segmentos se promedian.', rec: 'Que quepan varias vueltas del ciclo que buscas (aquí, 240 meses = 20 años para ciclos de 2 a 7 años).' },
      { nombre: 'noverlap', que: 'Cuántos datos comparten dos segmentos consecutivos.', rec: '<code>None</code> (la mitad): casi duplica los segmentos sin perder estabilidad.' },
      { nombre: 'window', que: 'Ventana de cada segmento.', rec: '<code>"hann"</code> (por omisión).' },
      { nombre: 'average', que: 'Cómo se combinan los periodogramas: promedio o mediana (corregida por sesgo).', rec: '<code>"mean"</code>; <code>"median"</code> si algún segmento tiene atípicos.' }
    ]);
    function dibujar() {
      const x = NINO_ANOM, m = +M.get(), no = ov.get() === 'None' ? Math.floor(m / 2) : 0, win = wn.get();
      const ini = T3.segmentosWelch(x.length, m, no), K = ini.length, per = ini.map(a => T3.periodograma(x.slice(a, a + m), { ventana: win })), nf = per[0].f.length;
      const P = rango(nf).map(j => { const vals = per.map(p => p.I[j]); const d = j === 0 || (m % 2 === 0 && j === m / 2) ? 1 : 2; if (av.get() === 'mean') return d * TS.media(vals); const s = vals.slice().sort((a, b) => a - b), med = K % 2 ? s[(K - 1) / 2] : (s[K / 2 - 1] + s[K / 2]) / 2; return d * med / medianaBias(K); });
      const f = per[0].f, jp = P.slice(1).indexOf(Math.max(...P.slice(1))) + 1;
      pc.codigo(codigoPython(`from scipy import signal\n\nx = anomalia.values                      # El Niño sin el ciclo anual, n = 732\nf, Pxx = signal.welch(x, fs=1.0, nperseg={nperseg}, noverlap={noverlap}, window={window}, average={average})\nj = Pxx[1:].argmax() + 1\nprint("segmentos:", (len(x) - {nperseg}) // ({nperseg} - ({noverlap} or {nperseg} // 2)) + 1 if {noverlap} is not None else "…")\nprint(f"resolución: {1 / {nperseg}:.4f}  pico en {1 / f[j]:.1f} meses")`, { nperseg: m, noverlap: ov.get(), window: `"${win}"`, average: `"${av.get()}"` }, activo)
        .replace(/print\("segmentos:".*\n/, ''));
      pc.salida([`segmentos: ${K}`, `resolución: ${fmt(1 / m, 4)}  pico en ${fmt(1 / f[jp], 1)} meses`].join('\n'));
      graf(g, [esp(f.slice(1), positivo(P.slice(1)), PAL.lav, 'Pxx', { mode: 'lines+markers', marker: { size: 4, color: PAL.lav } })], { height: 280, title: { text: `welch(anomalías de El Niño), ${K} segmentos` }, xaxis: { title: { text: 'f (ciclos por mes)' }, range: [0, 0.2] }, yaxis: { type: 'log', exponentformat: 'power' }, shapes: [franja(1 / 84, 1 / 24)], showlegend: false });
      params({ nperseg: m, noverlap: ov.get(), window: `"${win}"`, average: `"${av.get()}"` }, activo);
      lec.innerHTML = `La franja verde es la banda de El Niño (2 a 7 años). Con nperseg = ${m} hay ${K} segmentos y la resolución es 1/${m}: ` + (m <= 60 ? 'demasiado gruesa para separar periodos de 2 a 7 años.' : m >= 480 ? 'muy fina, pero con solo ' + K + ' segmentos la curva es ruidosa.' : 'un buen equilibrio.') + ` El pico queda en ${fmt(1 / f[jp], 1)} meses.`;
    }
    dibujar();
  });

  /* ======================= 6 · Paramétrico ======================= */
  const SERIES_AR = ['manchas', 'anom', 'ar2', 'apdd'];
  R('w3-ar-espectral', c => {
    const ctr = lienzo(c);
    let semilla = 5;
    const sr = seleccion(ctr, { etiqueta: 'Serie', valor: 'manchas', opciones: opcionesSeries(SERIES_AR) }, dibujar);
    const pp = slider(ctr, { etiqueta: 'orden p', min: 1, max: 20, paso: 1, valor: 2 }, dibujar);
    boton(ctr, 'Otra simulación', () => { semilla += 3; dibujar(); });
    const g1 = lamina(c), g2 = lamina(c), lec = lectura(c);
    const ex = extra(c, 'Vista extra: coeficientes y picos del AR'), tab = el('div', { class: 'w-tabla' });
    ex.append(tab);
    function dibujar() {
      const k = sr.get(), x = SERIES[k].y(300, semilla), p = pp.get(), F = T3.frecs(800).slice(1), A = T3.arEspectral(x, p, F), D = T3.daniell(x, 2);
      const tr = [puntos(D.f, positivo(D.I), 'rgba(140,135,170,.35)', 'periodograma crudo', { marker: { size: 3.5, color: 'rgba(140,135,170,.35)' } }), esp(D.f, D.fhat, '#9d97bd', 'Daniell L = 5', { line: { color: '#9d97bd', width: 1.6 } }), esp(F, A.espectro, PAL.rosa, `AR(${p})`, { line: { color: PAL.rosa, width: 2.6 } })];
      if (SERIES[k].verdad) { const V = SERIES[k].verdad; tr.push(esp(F, T3.espectroARMA(V.ar, V.ma, V.s2, F), PAL.texto, 'verdadera', { line: { color: PAL.texto, width: 1.4, dash: 'dot' } })); }
      graf(g1, tr, { height: 320, title: { text: `${SERIES[k].nombre}: espectro AR(${p}) por Yule–Walker` }, xaxis: EJE_W, yaxis: { type: 'log', exponentformat: 'power' } });
      const ords = T3.ordenesAR(x, 20).slice(1), best = ords.reduce((a, b) => (b.aic < a.aic ? b : a));
      graf(g2, [{ x: ords.map(o => o.p), y: ords.map(o => o.aic - best.aic), mode: 'lines+markers', line: { color: PAL.lav }, marker: { size: ords.map(o => (o.p === p ? 12 : 6)), color: ords.map(o => (o.p === best.p ? PAL.menta : o.p === p ? PAL.rosa : PAL.lav)) }, hovertemplate: 'p = %{x}: ΔAIC = %{y:.1f}<extra></extra>' }],
        { height: 220, title: { text: `AIC − AIC mínimo (el mínimo, en verde, es p = ${best.p})` }, xaxis: { title: { text: 'orden p' }, dtick: 1 }, yaxis: { type: 'log', title: { text: 'ΔAIC (escala log)' } }, showlegend: false });
      const pk = rango(F.length).filter(i => i > 0 && i < F.length - 1 && A.espectro[i] > A.espectro[i - 1] && A.espectro[i] > A.espectro[i + 1]);
      lec.innerHTML = `AR(${p}): σ̂² = ${fmt(A.sigma2, 3)}; ${pk.length ? 'picos en periodos ' + pk.map(i => fP(F[i])).join(', ') : 'sin picos interiores (máximo en un extremo)'}. ` + (p < best.p ? 'Orden menor que el del AIC: la curva puede ser demasiado simple.' : p > best.p + 4 ? '⚠️ Orden mucho mayor que el del AIC: cuidado con picos falsos.' : 'Cerca del orden que sugiere el AIC.');
      tab.innerHTML = tablaHTML(['k', 'φ̂_k'], A.phi.map((v, i) => [i + 1, fmt(v, 4)])) + (pk.length ? tablaHTML(['pico', 'ω', 'periodo', 'f̂'], pk.map((i, q) => [q + 1, fmt(F[i], 4), fP(F[i]), fmt(A.espectro[i], 3)])) : '');
    }
    dibujar();
  });

  R('w3-comparar-espectros', c => {
    const ctr = lienzo(c);
    let semilla = 5;
    const sr = seleccion(ctr, { etiqueta: 'Serie', valor: 'manchas', opciones: [['manchas', 'Manchas solares'], ['anom', 'El Niño: anomalías'], ['ar2c', 'AR(2) simulado, n = 128'], ['ar2l', 'AR(2) simulado, n = 1024']] }, dibujar);
    const mm = slider(ctr, { etiqueta: 'Daniell m', min: 1, max: 12, paso: 1, valor: 2 }, dibujar);
    const M = slider(ctr, { etiqueta: 'Welch nperseg', min: 32, max: 256, paso: 8, valor: 64 }, dibujar);
    boton(ctr, 'Otra simulación', () => { semilla += 3; dibujar(); });
    const g1 = lamina(c), lec = lectura(c);
    const ex = extra(c, 'Vista extra: el periodo del pico según cada método'), tab = el('div', { class: 'w-tabla' });
    ex.append(tab);
    function dibujar() {
      const k = sr.get(), x = k === 'ar2c' ? simular(AR2_VERDAD.ar, [1], 128, semilla) : k === 'ar2l' ? simular(AR2_VERDAD.ar, [1], 1024, semilla) : SERIES[k].y(), u = k === 'manchas' ? 'años' : k === 'anom' ? 'meses' : 'periodos';
      const D = T3.daniell(x, mm.get()), m = Math.min(M.get(), x.length), W = T3.welch(x, { nperseg: m }), ords = T3.ordenesAR(x, 20).slice(1), best = ords.reduce((a, b) => (b.aic < a.aic ? b : a));
      const F = T3.frecs(800).slice(1), A = T3.arEspectral(x, best.p, F), fw = W.f.slice(1), pw = W.pxx.slice(1).map(v => v / 2);
      const tr = [puntos(D.f, positivo(D.I), 'rgba(140,135,170,.35)', 'periodograma crudo', { marker: { size: 3, color: 'rgba(140,135,170,.35)' } }), esp(D.f, D.fhat, PAL.lav, `Daniell (L = ${2 * mm.get() + 1})`), esp(fw, pw, PAL.cel, `Welch (M = ${m})`), esp(F, A.espectro, PAL.rosa, `AR(${best.p}) por AIC`, { line: { color: PAL.rosa, width: 2.4 } })];
      if (k.startsWith('ar2')) tr.push(esp(F, T3.espectroARMA(AR2_VERDAD.ar, [1], 1, F), PAL.texto, 'verdadera', { line: { color: PAL.texto, width: 1.4, dash: 'dot' } }));
      graf(g1, tr, { height: 340, title: { text: 'Cuatro estimadores del mismo espectro' }, xaxis: EJE_W, yaxis: { type: 'log', exponentformat: 'power' } });
      const pico = (f, P) => f[P.indexOf(Math.max(...P))];
      const filas = [['periodograma crudo', pico(D.f, D.I)], [`Daniell L = ${2 * mm.get() + 1}`, pico(D.f, D.fhat)], [`Welch M = ${m}`, pico(fw, pw)], [`AR(${best.p})`, pico(F, A.espectro)]];
      if (k.startsWith('ar2')) filas.push(['verdadera', pico(F, T3.espectroARMA(AR2_VERDAD.ar, [1], 1, F))]);
      tab.innerHTML = tablaHTML(['método', 'ω del pico', `periodo (${u})`], filas.map(([a, w]) => [a, fmt(w, 4), fP(w)]));
      const ps = filas.slice(1, 4).map(([, w]) => 1 / w);
      lec.innerHTML = `Los tres estimadores suavizados ponen el pico entre ${fmt(Math.min(...ps), 1)} y ${fmt(Math.max(...ps), 1)} ${u}. ` + (Math.max(...ps) / Math.min(...ps) < 1.2 ? 'Coinciden: la conclusión es sólida.' : 'Difieren bastante: el pico es ancho o la serie es corta; repórtalo como un rango.');
    }
    dibujar();
  });

  /* ======================= 7 · AirPassengers en frecuencia ======================= */
  const FECHAS_AP = TS.datos.fechasMensuales(1949, 144);
  const TRANSF_AP = {
    log: { nombre: 'log', y: () => LOGAP, x: () => FECHAS_AP },
    dt: { nombre: 'log sin tendencia lineal', y: () => detrendLineal(LOGAP), x: () => FECHAS_AP },
    d: { nombre: 'Δ log', y: () => TS.diff(LOGAP), x: () => FECHAS_AP.slice(1) },
    dd: { nombre: 'ΔΔ₁₂ log', y: () => TS.diff(LOGAP.slice(12).map((v, i) => v - LOGAP[i])), x: () => FECHAS_AP.slice(13) }
  };
  R('w3-ap-espectro', c => {
    const ctr = lienzo(c);
    const tr = segmentado(ctr, { etiqueta: 'Transformación', valor: 'd', opciones: Object.keys(TRANSF_AP).map(k => [k, TRANSF_AP[k].nombre]) }, dibujar);
    const mm = slider(ctr, { etiqueta: 'suavizado Daniell m', min: 0, max: 6, paso: 1, valor: 1 }, dibujar);
    const g1 = lamina(c), g2 = lamina(c), lec = lectura(c);
    const ex = extra(c, 'Vista extra: la altura en cada k/12'), tab = el('div', { class: 'w-tabla' });
    ex.append(tab);
    function dibujar() {
      const T = TRANSF_AP[tr.get()], y = T.y(), D = T3.daniell(y, mm.get());
      graf(g1, [lin(T.x(), y, PAL.lav, T.nombre)], { height: 220, title: { text: `AirPassengers: ${T.nombre}` }, showlegend: false });
      graf(g2, [puntos(D.f, positivo(D.I), 'rgba(124,105,214,.55)', 'periodograma'), esp(D.f, D.fhat, PAL.rosa, `suavizado (L = ${2 * mm.get() + 1})`, { line: { color: PAL.rosa, width: 2.4 } })],
        { height: 300, title: { text: 'Periodograma con las frecuencias estacionales k/12 marcadas' }, xaxis: EJE_W, yaxis: { type: 'log', exponentformat: 'power' }, shapes: marcas(rango(6, 1).map(k => k / 12)) });
      const tot = D.I.reduce((a, b) => a + b, 0), lento = D.I.filter((_, i) => D.f[i] < 1 / 24).reduce((a, b) => a + b, 0) / tot, mx = Math.max(...D.I);
      const alt = rango(6, 1).map(k => { const i = D.f.reduce((b, w, q) => (Math.abs(w - k / 12) < Math.abs(D.f[b] - k / 12) ? q : b), 0); return D.I[i] / mx; });
      lec.innerHTML = { log: `La tendencia concentra el <b>${fmt(100 * lento, 0)}%</b> de la potencia en periodos de más de 2 años: tapa la estacionalidad.`, dt: 'Sin la tendencia aparece el pico anual (1/12) y su armónico semestral (2/12).', d: 'La diferencia quitó la tendencia: quedan los «dientes» en k/12, los armónicos del patrón estacional.', dd: 'Con ΔΔ₁₂ los dientes desaparecen: la ganancia de 1 − L¹² es cero en cada k/12.' }[tr.get()];
      tab.innerHTML = tablaHTML(['k', 'ω = k/12', 'periodo', 'I(k/12) / máx'], alt.map((v, i) => [i + 1, fmt((i + 1) / 12, 4), fmt(12 / (i + 1), 1), fmt(v, 3)])) + `<p style="margin:6px 4px">Potencia en periodos de más de 2 años: <b>${fmt(100 * lento, 1)}%</b>.</p>`;
    }
    dibujar();
  });

  const PATRON_AP = (() => {
    const w = [0.5].concat(new Array(11).fill(1), [0.5]).map(v => v / 12), resto = [], mes = [];
    for (let t = 6; t < 138; t++) { let s = 0; for (let j = -6; j <= 6; j++) s += w[j + 6] * LOGAP[t + j]; resto.push(LOGAP[t] - s); mes.push(t % 12); }
    const p = rango(12).map(k => TS.media(resto.filter((_, i) => mes[i] === k))), m = TS.media(p);
    return p.map(v => v - m);
  })();
  const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  function armonicos(s) {
    return rango(6, 1).map(k => {
      let sc = 0, ss = 0;
      s.forEach((v, i) => { const t = i + 1; sc += v * Math.cos(2 * Math.PI * k * t / 12); ss += v * Math.sin(2 * Math.PI * k * t / 12); });
      const b1 = (k < 6 ? 2 : 1) * sc / 12, b2 = k < 6 ? 2 * ss / 12 : 0, A = Math.hypot(b1, b2);
      return { k, b1, b2, A, var: k < 6 ? A * A / 2 : A * A, fase: Math.atan2(-b2, b1) };
    });
  }
  R('w3-armonicos', c => {
    const ctr = lienzo(c);
    const K = slider(ctr, { etiqueta: 'armónicos sumados K', min: 1, max: 6, paso: 1, valor: 2 }, dibujar);
    const g1 = lamina(c), g2 = lamina(c), lec = lectura(c);
    const ex = extra(c, 'Vista extra: amplitud, fase y mes del máximo de cada armónico'), tab = el('div', { class: 'w-tabla' });
    ex.append(tab);
    const H = armonicos(PATRON_AP), V = TS.varianza(PATRON_AP);
    function recon(t, k) { return H.slice(0, k).reduce((s, h) => s + h.b1 * Math.cos(2 * Math.PI * h.k * t / 12) + h.b2 * Math.sin(2 * Math.PI * h.k * t / 12), 0); }
    function dibujar() {
      const k = K.get(), tf = rango(221).map(i => 0.5 + i * 12 / 220);
      graf(g1, [{ x: rango(12, 1), y: PATRON_AP, mode: 'markers', marker: { color: PAL.lav, size: 10 }, name: 'patrón estacional (log)', text: MESES, hovertemplate: '%{text}: %{y:.4f}<extra></extra>' },
        lin(tf, tf.map(t => recon(t, k)), PAL.rosa, `suma de ${k} armónico${k > 1 ? 's' : ''}`, { line: { color: PAL.rosa, width: 2.4 } })],
        { height: 280, title: { text: `Patrón estacional de AirPassengers y su reconstrucción con K = ${k}` }, xaxis: { tickvals: rango(12, 1), ticktext: MESES }, yaxis: { title: { text: 'efecto en log' } } });
      graf(g2, [{ type: 'bar', x: H.map(h => `k = ${h.k} (P = ${fmt(12 / h.k, 1)})`), y: H.map(h => 100 * h.var / V), marker: { color: H.map(h => (h.k <= k ? PAL.rosa : 'rgba(124,105,214,.35)')) }, text: H.map(h => fmt(100 * h.var / V, 1) + '%'), textposition: 'outside', hovertemplate: '%{x}: %{y:.1f}%<extra></extra>' }],
        { height: 240, title: { text: '% de la varianza del patrón que explica cada armónico' }, yaxis: { range: [0, 85] }, showlegend: false });
      const exp = H.slice(0, k).reduce((s, h) => s + h.var, 0) / V;
      lec.innerHTML = `Con ${k} armónico${k > 1 ? 's' : ''} se explica el <b>${fmt(100 * exp, 1)}%</b> del patrón (${2 * k - (k === 6 ? 1 : 0)} coeficientes en lugar de 11). ` + (k === 6 ? 'Con los 6 la reconstrucción es exacta.' : '');
      tab.innerHTML = tablaHTML(['k', 'periodo', 'β₁', 'β₂', 'amplitud', '% varianza', 'mes del máximo'], H.map(h => {
        const per = 12 / h.k, tm = ((((-h.fase) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) / (2 * Math.PI) * per || per;
        return [h.k, fmt(per, 1), fmt(h.b1, 4), fmt(h.b2, 4), fmt(h.A, 4), fmt(100 * h.var / V, 1) + '%', h.k < 6 ? `${MESES[(Math.round(tm) + 11) % 12]} (t = ${fmt(tm, 1)})` : '—'];
      }), H.map(h => (h.k <= k ? 'resaltado' : '')));
    }
    dibujar();
  });

  /* ======================= 8 · Espectro cruzado ======================= */
  const envolver = a => ((a + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
  function ccf(x, y, K) {
    const n = Math.min(x.length, y.length), mx = TS.media(x), my = TS.media(y), sx = TS.desv(x), sy = TS.desv(y);
    return rango(2 * K + 1, -K).map(k => { let s = 0; for (let t = Math.max(0, -k); t < Math.min(n, n - k); t++) s += (y[t + k] - my) * (x[t] - mx); return s / (n * sx * sy); });
  }
  R('w3-coherencia-cruda', c => {
    const ctr = lienzo(c);
    let semilla = 4;
    const mm = slider(ctr, { etiqueta: 'm (ordenadas promediadas L = 2m + 1)', min: 0, max: 15, paso: 1, valor: 0, fmt: v => `${v} (L = ${2 * v + 1})` }, dibujar);
    boton(ctr, 'Otras dos series', () => { semilla += 5; dibujar(); });
    const g1 = lamina(c), g2 = lamina(c), lec = lectura(c);
    const ex = extra(c, 'Vista extra: el mismo cálculo con dos series relacionadas'), gx = lamina(ex);
    const n = 256;
    function dibujar() {
      const rng = TS.rng(semilla), x = rng.normales(n), y = rng.normales(n), m = mm.get(), L = 2 * m + 1;
      const C = T3.cruzadoDaniell(x, y, m), u = T3.umbralCoherencia(L), arriba = C.coh.filter(v => v > u).length / C.coh.length;
      graf(g1, [esp(C.f, C.coh, PAL.lav, 'coherencia estimada', { mode: 'lines+markers', marker: { size: 3 } }), hline(0, 0.5, u, PAL.rosa, 'dash', `umbral 5% (${fmt(u, 3)})`)],
        { height: 260, title: { text: `Dos ruidos blancos independientes: coherencia verdadera = 0 (L = ${L})` }, xaxis: EJE_W, yaxis: { range: [0, 1.05] } });
      graf(g2, [{ type: 'histogram', x: C.coh, xbins: { start: 0, end: 1.0001, size: 0.05 }, marker: { color: 'rgba(79,159,216,.55)', line: { color: '#fff', width: 0.5 } } }, vline(u, 0, C.coh.length / 3, PAL.rosa, 'dash')],
        { height: 220, title: { text: `${fmt(100 * arriba, 1)}% de las frecuencias por encima del umbral` }, xaxis: { title: { text: 'coherencia estimada' }, range: [0, 1.02] }, showlegend: false });
      lec.className = 'w-lectura ' + (m === 0 ? 'mal' : 'ok');
      lec.innerHTML = m === 0 ? '⚠️ Sin promediar, la coherencia vale <b>1 en todas las frecuencias</b>: |d_y·d̄_x|² = |d_x|²|d_y|². No dice nada.'
        : `Con L = ${L}, el umbral es ${fmt(u, 3)} y solo un ${fmt(100 * arriba, 1)}% de las frecuencias lo cruza (esperado: 5%). Esas son falsas alarmas: busca bandas, no puntos sueltos.`;
      const z = rng.normales(n), y2 = x.map((v, i) => 0.8 * v + 0.6 * z[i]), C2 = T3.cruzadoDaniell(x, y2, Math.max(m, 1));
      graf(gx, [esp(C2.f, C2.coh, PAL.menta, 'coherencia estimada'), hline(0, 0.5, 0.64, PAL.texto, 'dot', 'verdadera (0.64)'), hline(0, 0.5, T3.umbralCoherencia(2 * Math.max(m, 1) + 1), PAL.rosa, 'dash', 'umbral')],
        { height: 230, title: { text: 'y = 0.8x + 0.6·ruido: coherencia verdadera 0.64 en todas las frecuencias' }, xaxis: EJE_W, yaxis: { range: [0, 1.05] } });
    }
    dibujar();
  });

  R('w3-cruzado', c => {
    const ctr = lienzo(c);
    let semilla = 6;
    const D = slider(ctr, { etiqueta: 'retardo D', min: -6, max: 6, paso: 1, valor: 2 }, dibujar);
    const B = slider(ctr, { etiqueta: 'β', min: -1.5, max: 1.5, paso: 0.1, valor: 0.8, fmt: num }, dibujar);
    const S = slider(ctr, { etiqueta: 'ruido de y, σ', min: 0, max: 3, paso: 0.1, valor: 1, fmt: num }, dibujar);
    const tp = segmentado(ctr, { etiqueta: 'y copia…', valor: 'todas', opciones: [['todas', 'todas las frecuencias'], ['lentas', 'solo las lentas (ω < 0.1)']] }, dibujar);
    const M = segmentado(ctr, { etiqueta: 'nperseg', valor: '64', opciones: [['32', '32'], ['64', '64'], ['128', '128']] }, dibujar);
    boton(ctr, 'Otra muestra', () => { semilla += 3; dibujar(); });
    const g1 = lamina(c), f = fila(c), g2 = lamina(f), g3 = lamina(f), lec = lectura(c);
    const ex = extra(c, 'Vista extra: la correlación cruzada en el tiempo'), gx = lamina(ex);
    const n = 512, phi = 0.5;
    function dibujar() {
      const rng = TS.rng(semilla), e = rng.normales(n + 20), v = rng.normales(n), x0 = [];
      let prev = 0;
      for (let t = 0; t < n + 20; t++) { prev = phi * prev + e[t]; x0.push(prev); }
      const lentas = tp.get() === 'lentas';
      let z = x0;
      if (lentas) { const X = T3.fft(x0), keep = rango(x0.length).map(j => (Math.min(j, x0.length - j) / x0.length < 0.1 ? 1 : 0)); z = T3.ifft(X.re.map((q, j) => q * keep[j]), X.im.map((q, j) => q * keep[j])).re; }
      const d = D.get(), b = B.get(), s = S.get(), x = x0.slice(10, 10 + n), y = rango(n).map(t => b * z[10 + t - d] + s * v[t]);
      graf(g1, [lin(rango(150, 1), x.slice(0, 150), PAL.lav, 'x'), lin(rango(150, 1), y.slice(0, 150), PAL.rosa, 'y')], { height: 210, title: { text: `y_t = ${num(b)}·${lentas ? '(x lenta)' : 'x'}_{t−${d}} + ${num(s)}·ruido (primeros 150 datos)` } });
      const C = T3.coherencia(x, y, { nperseg: +M.get() }), u = T3.umbralCoherencia(C.K), F = C.f.slice(1);
      const fx = F.map(w => 1 / (1 + phi * phi - 2 * phi * Math.cos(2 * Math.PI * w))), teo = F.map((w, i) => { const pasa = !lentas || w < 0.1; return pasa ? b * b * fx[i] / (b * b * fx[i] + s * s) : 0; });
      graf(g2, [esp(F, C.coh.slice(1), PAL.lav, 'estimada (Welch)', { mode: 'lines+markers', marker: { size: 3.5 } }), esp(F, teo, PAL.texto, 'teórica', { line: { color: PAL.texto, width: 1.5, dash: 'dot' } }), hline(0, 0.5, u, PAL.rosa, 'dash', `umbral ≈ ${fmt(u, 2)}`)],
        { height: 280, title: { text: 'Coherencia' }, xaxis: EJE_WC, yaxis: { range: [0, 1.05] } });
      const fw = F.map(w => w), fase = C.fase.slice(1), Ft = T3.frecs(300).slice(1), teoF = Ft.map(w => envolver(-2 * Math.PI * w * d + (b < 0 ? Math.PI : 0)));
      graf(g3, [{ x: fw, y: fase, mode: 'markers', marker: { size: 5, color: C.coh.slice(1).map(v => (v > u ? PAL.lav : 'rgba(170,165,200,.35)')) }, name: 'fase estimada', hovertemplate: 'ω = %{x:.3f}<br>fase %{y:.2f}<extra></extra>' },
        { x: Ft, y: teoF, mode: 'markers', marker: { size: 2.5, color: PAL.rosa }, name: '−2πωD (envuelta)', hoverinfo: 'skip' }],
        { height: 280, title: { text: 'Fase (puntos tenues: coherencia no significativa)' }, xaxis: EJE_WC, yaxis: { range: [-3.4, 3.4], tickvals: [-Math.PI, -Math.PI / 2, 0, Math.PI / 2, Math.PI], ticktext: ['−π', '−π/2', '0', 'π/2', 'π'] } });
      const sig = F.map((w, i) => ({ w, f: fase[i], ok: C.coh[i + 1] > u && w > 0.01 && w < 0.12 })).filter(o => o.ok);
      const Dest = sig.length ? TS.media(sig.map(o => -envolver(o.f - (b < 0 ? Math.PI : 0)) / (2 * Math.PI * o.w))) : NaN;
      lec.innerHTML = `${C.K} segmentos. Coherencia media donde hay relación: <b>${fmt(TS.media(C.coh.slice(1).filter((_, i) => !lentas || F[i] < 0.1)), 2)}</b>. ` +
        (isFinite(Dest) ? `Retardo leído de la fase en frecuencias bajas: <b>${fmt(Dest, 2)}</b> (verdadero ${d}). ` : '') + (b < 0 ? 'Con β < 0 la fase se corre π: las series se mueven al revés. ' : '') + (d < 0 ? 'D negativo: y va <b>adelante</b> de x (fase positiva).' : d > 0 ? 'D positivo: y va <b>atrasada</b> (fase negativa).' : '');
      const r = ccf(x, y, 15);
      graf(gx, tallos(rango(31, -15), r, PAL.cel).concat([vline(d, -1, 1, PAL.rosa, 'dot')]), { height: 230, title: { text: `corr(y_{t+k}, x_t): el pico está en k = D = ${d}` }, xaxis: { title: { text: 'k' } }, yaxis: { range: [-1, 1] }, showlegend: false });
    }
    dibujar();
  });

  const VAR_MACRO = { inv: 'Inversión real (crecimiento)', cons: 'Consumo real (crecimiento)', du: 'Δ desempleo' };
  const TRIM = n => rango(n).map(i => 1959.25 + 0.25 * (i + 1));
  R('w3-macro', c => {
    const ctr = lienzo(c);
    const vr = seleccion(ctr, { etiqueta: 'Variable', valor: 'inv', opciones: Object.keys(VAR_MACRO).map(k => [k, VAR_MACRO[k]]) }, dibujar);
    const M = segmentado(ctr, { etiqueta: 'nperseg', valor: '32', opciones: [['24', '24'], ['32', '32'], ['48', '48'], ['64', '64']] }, dibujar);
    const g1 = lamina(c), f = fila(c), g2 = lamina(f), g3 = lamina(f), lec = lectura(c);
    const ex = extra(c, 'Vista extra: la correlación cruzada con el PIB'), gx = lamina(ex);
    const z = a => { const m = TS.media(a), s = TS.desv(a); return a.map(v => (v - m) / s); };
    function dibujar() {
      const x = MACRO.pib, y = MACRO[vr.get()], n = x.length, fechas = TRIM(n);
      graf(g1, [lin(fechas, z(x), PAL.lav, 'crecimiento del PIB'), lin(fechas, z(y), PAL.rosa, VAR_MACRO[vr.get()])], { height: 220, title: { text: 'Series estandarizadas (trimestral, 1959–2009)' } });
      const C = T3.coherencia(x, y, { nperseg: +M.get() }), u = T3.umbralCoherencia(C.K), F = C.f.slice(1), co = C.coh.slice(1), fa = C.fase.slice(1), cic = F.map(w => w >= 1 / 32 && w <= 1 / 6);
      graf(g2, [esp(F, co, PAL.lav, 'coherencia', { mode: 'lines+markers', marker: { size: 4 } }), hline(0, 0.5, u, PAL.rosa, 'dash', `umbral ≈ ${fmt(u, 2)}`)],
        { height: 280, title: { text: 'Coherencia con el PIB' }, xaxis: { title: { text: 'ω (por trimestre)' }, range: [0, 0.5] }, yaxis: { range: [0, 1.05] }, shapes: [franja(1 / 32, 1 / 6)] });
      graf(g3, [{ x: F, y: fa, mode: 'markers', marker: { size: 7, color: co.map(v => (v > u ? PAL.lav : 'rgba(170,165,200,.35)')) }, customdata: F.map(w => 1 / w), hovertemplate: 'ω = %{x:.3f} (periodo %{customdata:.1f})<br>fase %{y:.2f}<extra></extra>' }],
        { height: 280, title: { text: 'Fase (de la variable respecto al PIB)' }, xaxis: { title: { text: 'ω (ciclos por trimestre)' }, range: [0, 0.5] }, yaxis: { range: [-3.4, 3.4], tickvals: [-Math.PI, 0, Math.PI], ticktext: ['−π', '0', 'π'] }, shapes: [franja(1 / 32, 1 / 6)], showlegend: false });
      const cm = TS.media(co.filter((_, i) => cic[i])), alta = TS.media(co.filter((_, i) => F[i] > 0.25)), fm = TS.media(fa.filter((_, i) => cic[i]));
      lec.innerHTML = `En la banda del ciclo económico (franja verde, 6 a 32 trimestres) la coherencia media es <b>${fmt(cm, 2)}</b>; en periodos de menos de 4 trimestres, ${fmt(alta, 2)}. Fase media en el ciclo: ${fmt(fm, 2)} rad: ` +
        (Math.abs(fm) > 2.2 ? 'cerca de ±π, la variable se mueve <b>al revés</b> que el PIB.' : Math.abs(fm) < 0.15 ? 'cerca de 0, se mueve <b>en fase</b>.' : fm > 0 ? 'positiva: la variable va ligeramente <b>adelante</b> del PIB.' : 'negativa: va ligeramente <b>atrasada</b>.');
      const r = ccf(x, y, 8);
      graf(gx, tallos(rango(17, -8), r, PAL.cel), { height: 230, title: { text: 'corr(variable_{t+k}, PIB_t)' }, xaxis: { title: { text: 'k (trimestres)' } }, yaxis: { range: [-1, 1] }, showlegend: false });
    }
    dibujar();
  });

  R('py3-coherence', c => {
    const ctr = lienzo(c);
    let activo = 'nperseg';
    const M = segmentado(ctr, { etiqueta: 'nperseg', valor: '32', opciones: [['16', '16'], ['32', '32'], ['64', '64'], ['202', '202 (n)']] }, () => { activo = 'nperseg'; dibujar(); });
    const ov = segmentado(ctr, { etiqueta: 'noverlap', valor: 'None', opciones: [['None', 'None'], ['0', '0']] }, () => { activo = 'noverlap'; dibujar(); });
    const wn = segmentado(ctr, { etiqueta: 'window', valor: 'hann', opciones: [['hann', '"hann"'], ['boxcar', '"boxcar"']] }, () => { activo = 'window'; dibujar(); });
    const dt = segmentado(ctr, { etiqueta: 'detrend', valor: 'constant', opciones: [['constant', '"constant"'], ['linear', '"linear"']] }, () => { activo = 'detrend'; dibujar(); });
    const pc = panelCodigo(c), g = lamina(c), lec = lectura(c);
    const params = panelParametros(c, [
      { nombre: 'nperseg', que: 'Longitud de los segmentos de Welch: menos datos por segmento = más segmentos promediados.', rec: 'Que haya al menos 6–8 segmentos; con un solo segmento la coherencia vale 1.' },
      { nombre: 'noverlap', que: 'Traslape entre segmentos.', rec: '<code>None</code> (la mitad).' },
      { nombre: 'window', que: 'Ventana de cada segmento.', rec: '<code>"hann"</code>.' },
      { nombre: 'detrend', que: 'Qué se quita a cada segmento.', rec: '<code>"constant"</code>; <code>"linear"</code> si los segmentos tienen tendencia.' }
    ]);
    function dibujar() {
      const x = MACRO.pib, y = MACRO.inv, m = +M.get(), no = ov.get() === 'None' ? Math.floor(m / 2) : 0;
      const C = T3.coherencia(x, y, { nperseg: m, noverlap: no, ventana: wn.get(), detrend: dt.get() }), F = C.f, cic = F.map(w => w >= 1 / 32 && w <= 1 / 6);
      const cm = TS.media(C.coh.filter((_, i) => cic[i])), alta = TS.media(C.coh.filter((_, i) => F[i] > 0.25)), u = T3.umbralCoherencia(C.K);
      pc.codigo(codigoPython(`from scipy import signal\n\npib = np.diff(np.log(macro.realgdp.values)) * 100\ninv = np.diff(np.log(macro.realinv.values)) * 100\nf, coh = signal.coherence(pib, inv, fs=1.0, nperseg={nperseg}, noverlap={noverlap}, window={window}, detrend={detrend})\nf, pxy = signal.csd(pib, inv, fs=1.0, nperseg={nperseg}, noverlap={noverlap}, window={window}, detrend={detrend})\nciclo = (f >= 1 / 32) & (f <= 1 / 6)\nprint(f"coherencia en el ciclo: {coh[ciclo].mean():.3f} | en ω > 1/4: {coh[f > 0.25].mean():.3f}")\nprint(f"fase media en el ciclo: {np.angle(pxy[ciclo]).mean():.3f} rad")`, { nperseg: m, noverlap: ov.get(), window: `"${wn.get()}"`, detrend: `"${dt.get()}"` }, activo));
      pc.salida([`coherencia en el ciclo: ${isFinite(cm) ? fmt(cm, 3) : 'nan'} | en ω > 1/4: ${fmt(alta, 3)}`, `fase media en el ciclo: ${isFinite(cm) ? fmt(TS.media(C.fase.filter((_, i) => cic[i])), 3) : 'nan'} rad`].join('\n'));
      graf(g, [esp(F, C.coh, PAL.lav, 'coherencia', { mode: 'lines+markers', marker: { size: 4 } }), hline(0, 0.5, u, PAL.rosa, 'dash', `umbral ≈ ${fmt(u, 2)}`)], { height: 260, title: { text: `${C.K} segmento${C.K > 1 ? 's' : ''}` }, xaxis: EJE_W, yaxis: { range: [0, 1.05] }, shapes: [franja(1 / 32, 1 / 6)] });
      params({ nperseg: m, noverlap: ov.get(), window: `"${wn.get()}"`, detrend: `"${dt.get()}"` }, activo);
      lec.className = 'w-lectura ' + (C.K === 1 ? 'mal' : '');
      lec.innerHTML = C.K === 1 ? '⚠️ Con un solo segmento la coherencia vale 1 en todas las frecuencias: no hay nada que promediar.' : `${C.K} segmentos: la coherencia del PIB con la inversión en el ciclo es ${fmt(cm, 2)}. ` + (C.K < 6 ? 'Con tan pocos segmentos, la coherencia está inflada (el umbral es alto).' : '');
    }
    dibujar();
  });

  /* ======================= 9 · Filtros lineales ======================= */
  // Un filtro: pesos centrados (simétricos) o causales b/a
  function filtroDe(tipo, k, alfa, texto) {
    const nulos = n => new Array(n).fill(0);
    switch (tipo) {
      case 'mm3c': return { nombre: 'media móvil centrada de 3', centrado: T3.pesosCentrada(3) };
      case 'mm12': return { nombre: 'media móvil 2×12', centrado: T3.pesosCentrada(12) };
      case 'mmk': return { nombre: `media móvil causal de ${k}`, b: T3.pesosMM(k), a: [1] };
      case 'dif': return { nombre: 'diferencia 1 − L', b: [1, -1], a: [1] };
      case 'dif12': return { nombre: 'diferencia estacional 1 − L¹²', b: [1].concat(nulos(11), [-1]), a: [1] };
      case 'ddif': return { nombre: '(1 − L)(1 − L¹²)', b: T2.polMul([1, -1], [1].concat(nulos(11), [-1])), a: [1] };
      case 'ses': return { nombre: `suavizamiento exponencial, α = ${num(alfa)}`, b: [alfa], a: [1, -(1 - alfa)] };
      default: {
        const p = (texto || '').split(/[,;\s]+/).map(Number).filter(v => isFinite(v));
        return { nombre: 'pesos propios', b: p.length ? p : [1], a: [1] };
      }
    }
  }
  const respuestaF = (F, w) => (F.centrado ? T3.respuestaCentrada(F.centrado, w) : T3.respuesta(F.b, F.a, w));
  function aplicarF(F, x) {
    if (F.centrado) return T3.aplicarCentrado(x, F.centrado);
    const y = T3.lfilter(F.b, F.a, x).y, q = F.a.length > 1 ? 12 : F.b.length - 1;
    return y.map((v, i) => (i < q ? null : v));
  }
  function impulsoF(F, n) {
    if (F.centrado) { const M = (F.centrado.length - 1) / 2; return { j: rango(F.centrado.length, -M), a: F.centrado }; }
    const imp = rango(n).map(i => (i === 0 ? 1 : 0)), y = T3.lfilter(F.b, F.a, imp).y;
    const L = F.a.length > 1 ? Math.min(n, 25) : F.b.length;
    return { j: rango(L), a: y.slice(0, L) };
  }
  const PRUEBA = (() => { const r = TS.rng(17), e = r.normales(144, 0.3); return rango(144).map(t => 0.02 * t + 0.8 * Math.sin(2 * Math.PI * t / 12) + 0.4 * Math.cos(4 * Math.PI * t / 12) + e[t]); })();
  R('w3-respuesta', c => {
    const ctr = lienzo(c);
    const ft = seleccion(ctr, { etiqueta: 'Filtro', valor: 'mm12', opciones: [['mm3c', 'Media móvil centrada de 3'], ['mm12', 'Media móvil 2×12'], ['mmk', 'Media móvil causal de k'], ['dif', 'Diferencia 1 − L'], ['dif12', 'Diferencia 1 − L¹²'], ['ddif', '(1 − L)(1 − L¹²)'], ['ses', 'Suavizamiento exponencial'], ['propio', 'Pesos propios (causales)']] }, () => { config(); dibujar(); });
    const kk = slider(ctr, { etiqueta: 'k', min: 2, max: 12, paso: 1, valor: 4 }, dibujar);
    const al = slider(ctr, { etiqueta: 'α', min: 0.05, max: 0.95, paso: 0.05, valor: 0.3, fmt: num }, dibujar);
    const txt = el('input', { type: 'text', value: '0.5, 0.3, 0.2', style: 'width:150px' });
    const ctl = U.control('pesos a₀, a₁, …', txt); ctr.append(ctl); txt.addEventListener('input', dibujar);
    const fs = casilla(ctr, 'Mostrar la fase', false, dibujar);
    const sr = segmentado(ctr, { etiqueta: 'Serie de prueba', valor: 'prueba', opciones: [['prueba', 'tendencia + estacionalidad + ruido'], ['ap', 'log AirPassengers']] }, dibujar);
    const f = fila(c), g1 = lamina(f), g2 = lamina(f), g3 = lamina(c), lec = lectura(c);
    const ex = extra(c, 'Vista extra: la ganancia en las frecuencias clave'), tab = el('div', { class: 'w-tabla' });
    ex.append(tab);
    function config() { const t = ft.get(); kk.mostrar(t === 'mmk'); al.mostrar(t === 'ses'); ctl.style.display = t === 'propio' ? '' : 'none'; }
    function dibujar() {
      const F = filtroDe(ft.get(), kk.get(), al.get(), txt.value), W = T3.frecs(601), r = respuestaF(F, W), imp = impulsoF(F, 40);
      graf(g1, tallos(imp.j, imp.a, PAL.lav), { height: 250, title: { text: 'Respuesta al impulso: los pesos a_j' }, xaxis: { title: { text: 'j' } }, showlegend: false });
      const trG = [esp(W, r.map(o => o.gan), PAL.rosa, '|A(ω)|', { line: { color: PAL.rosa, width: 2.4 } })];
      if (fs.get()) trG.push(esp(W, r.map(o => o.fase), PAL.cel, 'fase (rad)', { yaxis: 'y2', line: { color: PAL.cel, width: 1.4, dash: 'dot' } }));
      graf(g2, trG, { height: 250, title: { text: 'Ganancia' + (fs.get() ? ' y fase' : '') }, xaxis: EJE_WC, yaxis: { title: { text: '|A(ω)|' }, rangemode: 'tozero' }, yaxis2: { overlaying: 'y', side: 'right', range: [-3.3, 3.3], showgrid: false }, shapes: marcas(rango(6, 1).map(k => k / 12)), showlegend: fs.get() });
      const x = sr.get() === 'ap' ? LOGAP : PRUEBA, y = aplicarF(F, x), t = rango(x.length, 1);
      graf(g3, [lin(t, x, '#b9b2d8', 'entrada', { line: { color: '#b9b2d8', width: 1.3 } }), lin(t, y, PAL.rosa, 'salida', { line: { color: PAL.rosa, width: 2 }, yaxis: ['dif', 'dif12', 'ddif'].includes(ft.get()) ? 'y2' : 'y' })],
        { height: 260, title: { text: `${F.nombre} aplicado a la serie de prueba` }, yaxis2: { overlaying: 'y', side: 'right', showgrid: false, title: { text: 'salida' } }, xaxis: { title: { text: 't (meses)' } } });
      const A0 = respuestaF(F, [0])[0], clave = [0, 1 / 24, 1 / 12, 1 / 6, 1 / 4, 1 / 3, 1 / 2], gk = respuestaF(F, clave);
      lec.innerHTML = `Ganancia en ω = 0 (tendencia): <b>${fmt(A0.gan, 3)}</b>; en ω = 1/12 (estacionalidad): <b>${fmt(gk[2].gan, 3)}</b>; en ω = 1/2: <b>${fmt(gk[6].gan, 3)}</b>. ` +
        (F.centrado ? 'Filtro simétrico: fase 0 (no retrasa), pero no se calcula en los extremos.' : ft.get() === 'mmk' ? `Filtro causal: retrasa la tendencia ${fmt((kk.get() - 1) / 2, 1)} periodos.` : ft.get() === 'ses' ? `Causal: retrasa los movimientos lentos unos ${fmt((1 - al.get()) / al.get(), 1)} periodos.` : '');
      tab.innerHTML = tablaHTML(['ω', 'periodo', '|A(ω)|', '|A(ω)|²', 'fase (rad)'], clave.map((w, i) => [fmt(w, 4), fP(w), fmt(gk[i].gan, 4), fmt(gk[i].gan2, 4), fmt(gk[i].fase, 3)])) +
        `<p style="margin:6px 4px">Suma de los pesos = A(0) = <b>${fmt(F.centrado ? F.centrado.reduce((a, b) => a + b, 0) : A0.re, 4)}</b>.</p>`;
    }
    config(); dibujar();
  });

  R('w3-filtro-espectro', c => {
    const ctr = lienzo(c);
    let semilla = 4;
    const en = seleccion(ctr, { etiqueta: 'Entrada', valor: 'rb', opciones: [['rb', 'Ruido blanco'], ['ar1', 'AR(1), φ = 0.7'], ['ar2', 'AR(2) con ciclo de 8']] }, dibujar);
    const ft = seleccion(ctr, { etiqueta: 'Filtro', valor: 'dif', opciones: [['dif', 'Diferencia 1 − L'], ['mm3c', 'Media móvil centrada de 3'], ['mm12', 'Media móvil 2×12'], ['dif12', '1 − L¹²'], ['ses', 'Suavizamiento exponencial α = 0.3'], ['bw', 'Butterworth pasa bajos N = 4, corte 0.1']] }, dibujar);
    const lg = casilla(ctr, 'Escala logarítmica', false, dibujar);
    boton(ctr, 'Otra simulación', () => { semilla += 3; dibujar(); });
    const g1 = lamina(c), g2 = lamina(c), lec = lectura(c);
    const ex = extra(c, 'Vista extra: varianza de la entrada y de la salida'), tab = el('div', { class: 'w-tabla' });
    ex.append(tab);
    const ENTRADA = { rb: { ar: [1], ma: [1] }, ar1: { ar: [1, -0.7], ma: [1] }, ar2: { ar: [1, -1.2, 0.72], ma: [1] } };
    function dibujar() {
      const E = ENTRADA[en.get()], F = ft.get() === 'bw' ? Object.assign({ nombre: 'Butterworth' }, T3.butter(4, 0.1, 'lowpass')) : filtroDe(ft.get(), 4, 0.3), W = T3.frecs(801);
      const fx = T3.espectroARMA(E.ar, E.ma, 1, W), A2 = respuestaF(F, W).map(o => o.gan2), fy = fx.map((v, i) => v * A2[i]);
      const ly = lg.get() ? { type: 'log', exponentformat: 'power' } : { rangemode: 'tozero' };
      graf(g1, [esp(W, fx, PAL.lav, 'entrada f_x'), esp(W, A2, PAL.mant, '|A(ω)|²', { line: { color: PAL.mant, width: 1.8, dash: 'dash' } }), esp(W, fy, PAL.rosa, 'salida f_y = |A|²·f_x', { line: { color: PAL.rosa, width: 2.6 } })],
        { height: 300, title: { text: 'El espectro de salida es el de entrada multiplicado por |A(ω)|²' }, xaxis: EJE_W, yaxis: ly });
      const n = 1024, x = simular(E.ar, E.ma, n + 30, semilla), yfull = F.centrado ? T3.aplicarCentrado(x, F.centrado) : T3.lfilter(F.b, F.a, x).y, y = yfull.slice(20, 20 + n - 40).filter(v => v !== null);
      const D = T3.daniell(y, 4);
      graf(g2, [esp(D.f, D.fhat, 'rgba(224,112,159,.6)', 'periodograma suavizado de la salida simulada'), esp(W, fy, PAL.texto, 'f_y teórica', { line: { color: PAL.texto, width: 1.4, dash: 'dot' } })],
        { height: 250, title: { text: 'Comprobación con una simulación' }, xaxis: EJE_W, yaxis: ly });
      const vx = 2 * T3.integral(W, fx), vy = 2 * T3.integral(W, fy);
      lec.innerHTML = `Varianza de entrada ${fmt(vx, 3)} → salida <b>${fmt(vy, 3)}</b> (×${fmt(vy / vx, 2)}). ` + (ft.get() === 'dif' && en.get() === 'rb' ? 'Diferenciar un ruido blanco duplica su varianza y la carga a las frecuencias altas: la sobrediferenciación vista en frecuencia.' : '');
      tab.innerHTML = tablaHTML(['', 'varianza teórica (área)', 'varianza de la simulación'], [['entrada', fmt(vx, 4), fmt(TS.varianza(x), 4)], ['salida', fmt(vy, 4), fmt(TS.varianza(y), 4)]]);
    }
    dibujar();
  });

  /* ======================= 10 · Tipos de filtros ======================= */
  R('w3-ideal', c => {
    const ctr = lienzo(c);
    const wc = slider(ctr, { etiqueta: 'corte ω_c', min: 0.05, max: 0.4, paso: 0.01, valor: 0.15, fmt: v => `${fmt(v, 2)} (P = ${fP(v)})` }, dibujar);
    const M = slider(ctr, { etiqueta: 'M (2M + 1 pesos)', min: 3, max: 60, paso: 1, valor: 15 }, dibujar);
    const wn = segmentado(ctr, { etiqueta: 'Ventana', valor: 'boxcar', opciones: [['boxcar', 'Truncado (sin ventana)'], ['hamming', 'Hamming'], ['hann', 'Hann']] }, dibujar);
    const g1 = lamina(c), g2 = lamina(c), lec = lectura(c);
    const ex = extra(c, 'Vista extra: ondulación, atenuación y transición'), tab = el('div', { class: 'w-tabla' });
    ex.append(tab);
    function medir(h, w0) {
      const W = T3.frecs(2001), g = T3.respuestaCentrada(h, W).map(o => o.re);
      const paso = W.map((w, i) => (w < w0 - 0.03 ? Math.abs(g[i] - 1) : 0)), rech = W.map((w, i) => (w > w0 + 0.03 ? Math.abs(g[i]) : 0));
      const a90 = W.find((w, i) => w > 0 && g[i] < 0.9) || 0, a10 = W.find((w, i) => w > a90 && g[i] < 0.1) || 0.5;
      return { W, g, rizo: Math.max(...paso), rech: Math.max(...rech), trans: a10 - a90 };
    }
    function dibujar() {
      const w0 = wc.get(), m = M.get(), nt = 2 * m + 1, trunc = T3.firwin(nt, w0, { ventana: 'boxcar', escala: false }), h = wn.get() === 'boxcar' ? trunc : T3.firwin(nt, w0, { ventana: wn.get(), escala: true }), j = rango(nt, -m);
      graf(g1, tallos(j, trunc, '#b9b2d8').concat(wn.get() === 'boxcar' ? [] : [{ x: j, y: h, mode: 'markers', marker: { color: PAL.rosa, size: 6 }, name: 'con ventana' }]),
        { height: 240, title: { text: `a_j = sen(2πω_c j)/(πj), truncado a ${nt} pesos${wn.get() === 'boxcar' ? '' : ' y multiplicado por la ventana'}` }, xaxis: { title: { text: 'j' } }, showlegend: false });
      const r = medir(h, w0);
      graf(g2, [lin([0, w0, w0, 0.5], [1, 1, 0, 0], PAL.texto, 'ideal', { line: { color: PAL.texto, width: 1.4, dash: 'dot' } }), esp(r.W, r.g, PAL.rosa, 'real', { line: { color: PAL.rosa, width: 2.4 } })],
        { height: 280, title: { text: 'Ganancia A(ω): real contra ideal' }, xaxis: EJE_W, yaxis: { range: [-0.15, 1.2] } });
      lec.innerHTML = `Ondulación en la banda de paso: <b>${fmt(100 * r.rizo, 1)}%</b>; peor ganancia en la de rechazo: <b>${fmt(r.rech, 3)}</b>; ancho de la transición (de 0.9 a 0.1): ${fmt(r.trans, 3)}. ` +
        (wn.get() === 'boxcar' ? 'Sin ventana aparece el sobrepaso de Gibbs (≈ 9%) aunque subas M.' : 'La ventana casi elimina las ondulaciones, a cambio de una transición más ancha.');
      tab.innerHTML = tablaHTML(['ventana', 'ondulación en el paso', 'máx. en el rechazo', 'transición'], ['boxcar', 'hamming', 'hann'].map(v => { const hh = v === 'boxcar' ? trunc : T3.firwin(nt, w0, { ventana: v, escala: true }), q = medir(hh, w0); return [v, fmt(100 * q.rizo, 1) + '%', fmt(q.rech, 3), fmt(q.trans, 3)]; }), ['boxcar', 'hamming', 'hann'].map(v => (v === wn.get() ? 'resaltado' : '')));
    }
    dibujar();
  });

  const PRUEBA_BW = (() => {
    const n = 300, r = TS.rng(23), e = r.normales(n, 0.4), t = rango(n, 1);
    return { n, lento: t.map(s => 2 * Math.cos(2 * Math.PI * s / 40)), medio: t.map(s => Math.cos(2 * Math.PI * s / 12 + 1)), rapido: t.map(s => 0.8 * Math.cos(2 * Math.PI * s / 4 + 0.5)), ruido: e };
  })();
  R('w3-butter', c => {
    const ctr = lienzo(c);
    const tp = segmentado(ctr, { etiqueta: 'Tipo', valor: 'lowpass', opciones: [['lowpass', 'pasa bajos'], ['highpass', 'pasa altos'], ['bandpass', 'pasa banda'], ['bandstop', 'rechaza banda']] }, () => { config(); dibujar(); });
    const N = slider(ctr, { etiqueta: 'orden N', min: 1, max: 6, paso: 1, valor: 4 }, dibujar);
    const P1 = slider(ctr, { etiqueta: 'corte: periodo', min: 3, max: 80, paso: 1, valor: 20, fmt: v => `${v} (ω = ${fmt(1 / v, 3)})` }, dibujar);
    const P2 = slider(ctr, { etiqueta: 'periodo máximo de la banda', min: 6, max: 80, paso: 1, valor: 20, fmt: v => `${v} (ω = ${fmt(1 / v, 3)})` }, dibujar);
    const dB = casilla(ctr, 'Ganancia en dB', false, dibujar);
    const g1 = lamina(c), g2 = lamina(c), lec = lectura(c);
    const ex = extra(c, 'Vista extra: respuesta al impulso y polos y ceros'), fx = fila(ex), gx1 = lamina(fx), gx2 = lamina(fx);
    function config() {
      const banda = tp.get() === 'bandpass' || tp.get() === 'bandstop';
      P2.mostrar(banda);
      P1.config({ min: 3, max: 80, paso: 1, valor: banda ? 8 : 20, etiqueta: banda ? 'periodo mínimo de la banda' : 'corte: periodo', fmt: v => `${v} (ω = ${fmt(1 / v, 3)})` });
    }
    function dibujar() {
      const t = tp.get(), banda = t === 'bandpass' || t === 'bandstop';
      let p1 = P1.get(), p2 = P2.get();
      if (banda && p2 <= p1 + 1) p2 = p1 + 2;
      const fc = banda ? [1 / p2, 1 / p1] : 1 / p1, Bw = T3.butter(N.get(), fc, t), W = T3.frecs(801), r = T3.respuesta(Bw.b, Bw.a, W);
      const gA = r.map(o => o.gan), gA2 = r.map(o => o.gan2), tr = v => (dB.get() ? v.map(u => 20 * Math.log10(Math.max(u, 1e-6))) : v);
      const cortes = banda ? fc : [fc];
      graf(g1, [esp(W, tr(gA), PAL.rosa, '|A(ω)| (lfilter)', { line: { color: PAL.rosa, width: 2.4 } }), esp(W, tr(gA2), PAL.cel, '|A(ω)|² (filtfilt)', { line: { color: PAL.cel, width: 1.6, dash: 'dot' } }),
        { x: cortes, y: tr(cortes.map(() => Math.SQRT1_2)), mode: 'markers', marker: { color: PAL.texto, size: 9, symbol: 'diamond' }, name: '−3 dB (0.707)' }],
        { height: 280, title: { text: `Butterworth ${t}, orden ${N.get()}` }, xaxis: EJE_W, yaxis: dB.get() ? { range: [-80, 5], title: { text: 'dB' } } : { range: [0, 1.1] }, shapes: marcas([1 / 40, 1 / 12, 1 / 4], 'rgba(63,174,138,.5)') });
      const T = PRUEBA_BW, x = rango(T.n).map(i => T.lento[i] + T.medio[i] + T.rapido[i] + T.ruido[i]);
      const pasa = w => T3.ganButter(1, fc, t, w) > Math.SQRT1_2 - 1e-9, obj = rango(T.n).map(i => (pasa(1 / 40) ? T.lento[i] : 0) + (pasa(1 / 12) ? T.medio[i] : 0) + (pasa(1 / 4) ? T.rapido[i] : 0));
      const yl = T3.lfilter(Bw.b, Bw.a, x).y; let yf = null;
      try { yf = T3.filtfilt(Bw.b, Bw.a, x); } catch (e) { yf = null; }
      const estable = yl.every(isFinite) && (!yf || yf.every(isFinite)), tt = rango(T.n, 1);
      graf(g2, [lin(tt, x, '#d2cde6', 'serie de prueba', { line: { color: '#d2cde6', width: 1.1 } }), lin(tt, obj, PAL.texto, 'lo que debería quedar', { line: { color: PAL.texto, width: 1.4, dash: 'dot' } }),
        lin(tt, estable ? yl : [], PAL.cel, 'lfilter (causal)', { line: { color: PAL.cel, width: 1.6 } }), lin(tt, estable && yf ? yf : [], PAL.rosa, 'filtfilt (fase cero)', { line: { color: PAL.rosa, width: 2 } })],
        { height: 280, title: { text: 'Ciclo de 40 + ciclo de 12 + oscilación de 4 + ruido' }, xaxis: { title: { text: 't' } } });
      if (!estable) { lec.className = 'w-lectura mal'; lec.innerHTML = '⚠️ Con este orden y estos cortes, los coeficientes en forma b/a se vuelven numéricamente inestables. En scipy usa <code>butter(..., output="sos")</code> con <code>sosfiltfilt</code>.'; }
      else {
        lec.className = 'w-lectura';
        const rm = v => Math.sqrt(TS.media(v.slice(30, -30).map((u, i) => (u - obj[i + 30]) ** 2)));
        lec.innerHTML = `Ganancia en periodo 40: ${fmt(T3.ganButter(N.get(), fc, t, 1 / 40), 3)} · periodo 12: ${fmt(T3.ganButter(N.get(), fc, t, 1 / 12), 3)} · periodo 4: ${fmt(T3.ganButter(N.get(), fc, t, 1 / 4), 3)}. ` +
          `Error contra lo que debería quedar: lfilter ${fmt(rm(yl), 3)}, filtfilt <b>${fmt(rm(yf), 3)}</b> (el causal pierde por el retraso).`;
      }
      const imp = T3.lfilter(Bw.b, Bw.a, rango(60).map(i => (i === 0 ? 1 : 0))).y;
      graf(gx1, tallos(rango(60), imp, PAL.lav), { height: 240, title: { text: 'Respuesta al impulso (infinita: IIR)' }, showlegend: false });
      graf(gx2, [circulo(1), { x: Bw.p.map(z => z.re), y: Bw.p.map(z => z.im), mode: 'markers', marker: { symbol: 'x', size: 10, color: PAL.rosa }, name: 'polos' }, { x: Bw.z.map(z => z.re), y: Bw.z.map(z => z.im), mode: 'markers', marker: { symbol: 'circle-open', size: 10, color: PAL.lav, line: { width: 2 } }, name: 'ceros' }],
        { height: 240, title: { text: 'Polos (×) dentro del círculo = estable' }, xaxis: { range: [-1.3, 1.3], scaleanchor: 'y' }, yaxis: { range: [-1.3, 1.3] }, showlegend: false });
    }
    config(); dibujar();
  });

  R('py3-butter', c => {
    const ctr = lienzo(c);
    let activo = 'N';
    const N = segmentado(ctr, { etiqueta: 'N', valor: '4', opciones: [['2', '2'], ['4', '4'], ['6', '6']] }, () => { activo = 'N'; dibujar(); });
    const Wn = segmentado(ctr, { etiqueta: 'Wn (ciclos por año, fs = 12)', valor: '0.5', opciones: [['0.333', '1/3 (periodo 3 años)'], ['0.5', '0.5 (periodo 2 años)'], ['0.75', '0.75 (16 meses)']] }, () => { activo = 'Wn'; dibujar(); });
    const bt = segmentado(ctr, { etiqueta: 'btype', valor: 'low', opciones: [['low', '"low"'], ['high', '"high"']] }, () => { activo = 'btype'; dibujar(); });
    const md = segmentado(ctr, { etiqueta: 'filtrado', valor: 'filtfilt', opciones: [['filtfilt', 'filtfilt'], ['lfilter', 'lfilter']] }, () => { activo = 'metodo'; dibujar(); });
    const pc = panelCodigo(c), g = lamina(c), lec = lectura(c);
    const params = panelParametros(c, [
      { nombre: 'N', que: 'Orden del filtro: qué tan abrupta es la transición.', rec: '2 a 4; súbelo solo si la atenuación no alcanza.' },
      { nombre: 'Wn', que: 'Frecuencia de corte en las unidades de <code>fs</code> (aquí, ciclos por año).', rec: 'Por debajo de lo que quieres quitar: el ciclo anual está en 1 ciclo por año.' },
      { nombre: 'btype', que: 'Tipo de filtro.', rec: '<code>"low"</code> para la tendencia; <code>"high"</code> para quedarte con el ciclo anual y el ruido.' },
      { nombre: 'metodo', que: '<code>filtfilt</code>: fase cero (usa el futuro). <code>lfilter</code>: causal, retrasa.', rec: '<code>filtfilt</code> para describir; <code>lfilter</code> si el resultado se usará en tiempo real.' }
    ]);
    function dibujar() {
      const n = +N.get(), w = +Wn.get(), t = bt.get(), Bw = T3.butter(n, w / 12, t === 'low' ? 'lowpass' : 'highpass'), x = CO2;
      const y = md.get() === 'filtfilt' ? T3.filtfilt(Bw.b, Bw.a, x) : T3.lfilter(Bw.b, Bw.a, x.map(v => v - x[0])).y.map(v => v + (t === 'low' ? x[0] : 0));
      const r = T3.respuesta(Bw.b, Bw.a, [1 / 24, 1 / 12, 1 / 6]).map(o => o.gan), pot = md.get() === 'filtfilt' ? 2 : 1;
      pc.codigo(codigoPython(`from scipy import signal\n\nb, a = signal.butter({N}, {Wn}, btype={btype}, fs=12)          # fs = 12: frecuencias en ciclos por año\n_, h = signal.freqz(b, a, worN=[0.5, 1, 2], fs=12)\nprint("ganancia en 0.5, 1 y 2 ciclos por año:", np.round(np.abs(h) ** {pot}, 4))\ny = signal.{metodo}(b, a, co2_mensual.values)\nprint("desviación estándar de co2 − y:", round(np.std(co2_mensual.values - y), 3))`, { N: n, Wn: w, btype: `"${t}"`, pot, metodo: md.get() }, activo));
      const resto = x.map((v, i) => v - y[i]).slice(24, -24);
      pc.salida([`ganancia en 0.5, 1 y 2 ciclos por año: [${r.map(v => fmt(v ** pot, 4)).join(' ')}]`, `desviación estándar de co2 − y: ${fmt(TS.desv(resto), 3)}`].join('\n'));
      const fechas = rango(x.length).map(i => 1958 + 2 / 12 + i / 12);
      graf(g, [lin(fechas, x, '#c9c3e3', 'CO₂ mensual', { line: { color: '#c9c3e3', width: 1.2 } }), lin(fechas, y, PAL.rosa, `${md.get()}(butter)`, { line: { color: PAL.rosa, width: 2 }, yaxis: t === 'high' ? 'y2' : 'y' })],
        { height: 280, title: { text: 'CO₂ de Mauna Loa (ppm)' }, yaxis2: { overlaying: 'y', side: 'right', showgrid: false }, xaxis: { title: { text: 'año' } } });
      params({ N: n, Wn: w, btype: `"${t}"`, metodo: md.get() }, activo);
      lec.innerHTML = t === 'low' ? `El ciclo anual (1 ciclo por año) sale con ganancia ${fmt(r[1] ** pot, 4)}: ` + (r[1] ** pot < 0.05 ? 'prácticamente eliminado.' : 'todavía se nota; baja Wn o sube N.') + (md.get() === 'lfilter' ? ' Con lfilter la tendencia sale retrasada.' : '')
        : 'Con el pasa altos queda el ciclo anual (y el ruido) sin la tendencia.';
    }
    dibujar();
  });

  /* ======================= 11 · HP y Baxter–King ======================= */
  const LAMBDAS = [6.25, 25, 100, 400, 1600, 6400, 14400, 129600, 1e6];
  const FECHAS_Q = n => rango(n).map(i => 1959 + 0.25 * i);
  R('w3-hp', c => {
    const ctr = lienzo(c);
    const li = slider(ctr, { etiqueta: 'λ', min: 0, max: LAMBDAS.length - 1, paso: 1, valor: 4, fmt: v => String(LAMBDAS[v]) }, dibujar);
    const g1 = lamina(c), g2 = lamina(c), g3 = lamina(c), lec = lectura(c);
    const ex = extra(c, 'Vista extra: tamaño del ciclo y corte para cada λ'), tab = el('div', { class: 'w-tabla' });
    ex.append(tab);
    const y = MACRO.lpib, fechas = FECHAS_Q(y.length), p50 = lam => 1 / (Math.acos(1 - 1 / Math.sqrt(4 * lam)) / (2 * Math.PI));
    function dibujar() {
      const lam = LAMBDAS[li.get()], H = T3.hp(y, lam), W = T3.frecs(801);
      graf(g1, [lin(fechas, y, '#b9b2d8', '100·ln(PIB)', { line: { color: '#b9b2d8', width: 1.4 } }), lin(fechas, H.tendencia, PAL.rosa, 'tendencia HP', { line: { color: PAL.rosa, width: 2.2 } })], { height: 230, title: { text: `PIB real de EE. UU. y su tendencia (λ = ${lam})` } });
      graf(g2, [lin(fechas, H.ciclo, PAL.lav, 'ciclo'), hline(fechas[0], fechas[fechas.length - 1], 0, PAL.gris, 'dot')], { height: 220, title: { text: `Ciclo: desviación estándar ${fmt(TS.desv(H.ciclo), 2)}% (los valles son recesiones)` }, showlegend: false });
      graf(g3, [esp(W, T3.hpGanancia(lam, W), PAL.rosa, 'ganancia del ciclo'), esp(W, T3.hpGanancia(lam, W).map(v => 1 - v), PAL.cel, 'ganancia de la tendencia', { line: { color: PAL.cel, width: 1.6, dash: 'dot' } })],
        { height: 240, title: { text: `Ganancia: el ciclo se queda con los periodos de menos de ~${fmt(p50(lam), 0)} trimestres` }, xaxis: { title: { text: 'ω (ciclos por trimestre)' }, range: [0, 0.25] }, yaxis: { range: [0, 1.05] }, shapes: [franja(1 / 32, 1 / 6)].concat(marcas([1 / p50(lam)], PAL.texto, 'dash')) });
      lec.innerHTML = `Con λ = ${lam}, la ganancia del ciclo vale 1/2 en el periodo ${fmt(p50(lam), 1)} trimestres (${fmt(p50(lam) / 4, 1)} años). La franja verde es el ciclo económico (6 a 32 trimestres): ` +
        (p50(lam) < 32 ? 'con este λ el «ciclo» pierde parte del ciclo económico.' : p50(lam) > 200 ? 'con este λ el «ciclo» absorbe también movimientos muy largos.' : 'λ deja pasar casi todo el ciclo económico.');
      tab.innerHTML = tablaHTML(['λ', 'periodo con ganancia 1/2 (trimestres)', 'desv. est. del ciclo'], LAMBDAS.map(l => [l, fmt(p50(l), 1), fmt(TS.desv(T3.hp(y, l).ciclo), 2) + '%']), LAMBDAS.map(l => (l === lam ? 'resaltado' : '')));
    }
    dibujar();
  });

  R('w3-bk', c => {
    const ctr = lienzo(c);
    const pl = slider(ctr, { etiqueta: 'periodo mínimo', min: 2, max: 12, paso: 1, valor: 6 }, dibujar);
    const ph = slider(ctr, { etiqueta: 'periodo máximo', min: 14, max: 60, paso: 1, valor: 32 }, dibujar);
    const K = slider(ctr, { etiqueta: 'K (pesos de cada lado)', min: 4, max: 24, paso: 1, valor: 12 }, dibujar);
    const g1 = lamina(c), g2 = lamina(c), lec = lectura(c);
    const ex = extra(c, 'Vista extra: los pesos del filtro'), gx = lamina(ex);
    function dibujar() {
      const lo = pl.get(), hi = ph.get(), k = K.get(), B = T3.bk(MACRO.lpib, lo, hi, k), W = T3.frecs(801), gan = T3.respuestaCentrada(B.pesos, W).map(o => o.re);
      graf(g1, [lin([0, 1 / hi, 1 / hi, 1 / lo, 1 / lo, 0.5], [0, 0, 1, 1, 0, 0], PAL.texto, 'ideal', { line: { color: PAL.texto, width: 1.4, dash: 'dot' } }), esp(W, gan, PAL.rosa, `Baxter–King, K = ${k}`, { line: { color: PAL.rosa, width: 2.4 } })],
        { height: 260, title: { text: `Ganancia del pasa banda de ${lo} a ${hi} trimestres` }, xaxis: { title: { text: 'ω (ciclos por trimestre)' }, range: [0, 0.5] }, yaxis: { range: [-0.15, 1.25] } });
      const fechas = FECHAS_Q(MACRO.lpib.length), H = T3.hp(MACRO.lpib, 1600);
      graf(g2, [lin(fechas.slice(k, -k), B.ciclo, PAL.rosa, 'ciclo Baxter–King', { line: { color: PAL.rosa, width: 2 } }), lin(fechas, H.ciclo, PAL.lav, 'ciclo HP (λ = 1600)', { line: { color: PAL.lav, width: 1.3, dash: 'dot' } })],
        { height: 250, title: { text: `Ciclo del PIB: se pierden ${k} trimestres de cada lado` } });
      const hc = H.ciclo.slice(k, -k), r = TS.media(hc.map((v, i) => (v - TS.media(hc)) * (B.ciclo[i] - TS.media(B.ciclo)))) / (TS.desv(hc) * TS.desv(B.ciclo));
      lec.innerHTML = `Desviación estándar del ciclo BK: <b>${fmt(TS.desv(B.ciclo), 2)}%</b> (HP: ${fmt(TS.desv(H.ciclo), 2)}%); correlación entre los dos ciclos: <b>${fmt(r, 3)}</b>. ` + (k < 8 ? 'Con K chico la ganancia se aleja del rectángulo ideal (fuga fuera de la banda).' : 'Suma de los pesos = 0: la tendencia se elimina por completo.');
      graf(gx, tallos(rango(2 * k + 1, -k), B.pesos, PAL.lav), { height: 230, title: { text: `Pesos b_j (simétricos, suma ${fmt(B.pesos.reduce((a, b) => a + b, 0), 6)})` }, showlegend: false });
    }
    dibujar();
  });

  /* ======================= 12 · Proponer un filtro ======================= */
  const ESCENARIOS = (() => {
    const n = 300, r = TS.rng(31), e = r.normales(n), t = rango(n, 1), u = r.normales(n);
    let rw = 0; const tend = t.map((s, i) => { rw += 0.05 + 0.08 * u[i]; return 0.0004 * s * s + rw; });
    const ar = []; let p0 = 0; for (let i = 0; i < n; i++) { p0 = 0.7 * p0 + 0.6 * u[(i + 7) % n]; ar.push(p0); }
    const sem = t.map(s => [1.2, 0.8, 0.5, 0.4, 0.6, -1.4, -2.1][s % 7]), mSem = TS.media(sem);
    const sc = (A, P, f) => t.map(s => A * Math.cos(2 * Math.PI * s / P + f));
    return {
      tendencia: { nombre: 'Quitar la tendencia', x: t.map((s, i) => tend[i] + sc(1, 20, 0.3)[i] + 0.3 * e[i]), obj: t.map((s, i) => sc(1, 20, 0.3)[i] + 0.3 * e[i]), comp: [['tendencia', 0.004], ['ciclo de 20', 0.05]], prop: { tipo: 'highpass', p1: 60, N: 4 }, por: 'Un pasa altos con corte en periodo 60: conserva el ciclo de 20 y el ruido, y quita lo que tarda más de 5 años (en datos mensuales). La diferencia 1 − L también funciona, pero amplifica el ruido.' },
      ruido: { nombre: 'Quitar el ruido de alta frecuencia', x: t.map((s, i) => sc(2, 30, 0)[i] + 0.8 * e[i]), obj: sc(2, 30, 0), comp: [['ciclo de 30', 1 / 30], ['ruido (todas)', 0.3]], prop: { tipo: 'lowpass', p1: 15, N: 4 }, por: 'Un pasa bajos con corte en periodo 15: el ciclo de 30 pasa completo y el ruido de periodos cortos se elimina (queda solo el ruido de periodos largos).' },
      ciclo: { nombre: 'Aislar el ciclo de 10', x: t.map((s, i) => sc(1.5, 40, 0)[i] + sc(1, 10, 1)[i] + sc(0.8, 4, 2)[i] + 0.3 * e[i]), obj: sc(1, 10, 1), comp: [['ciclo de 40', 1 / 40], ['ciclo de 10', 0.1], ['oscilación de 4', 0.25]], prop: { tipo: 'bandpass', p1: 7, p2: 15, N: 3 }, por: 'Un pasa banda entre periodos 7 y 15: deja el ciclo de 10 y quita el de 40 y la oscilación de 4.' },
      semanal: { nombre: 'Quitar el patrón semanal (datos diarios)', x: t.map((s, i) => sc(1.5, 60, 0)[i] + (sem[i] - mSem) + 0.3 * e[i]), obj: t.map((s, i) => sc(1.5, 60, 0)[i] + 0.3 * e[i]), comp: [['ciclo de 60 días', 1 / 60], ['semana (1/7)', 1 / 7], ['armónico 2/7', 2 / 7], ['armónico 3/7', 3 / 7]], prop: { tipo: 'notch', p1: 7, Q: 4 }, por: 'Muescas en 1/7, 2/7 y 3/7 (el patrón semanal y sus armónicos): el resto de la serie queda intacto. Una media móvil de 7 días también quita la semana, pero suaviza todo lo demás.' },
      interferencia: { nombre: 'Quitar una interferencia en ω = 0.3', x: t.map((s, i) => ar[i] + sc(1.5, 1 / 0.3, 0)[i]), obj: ar, comp: [['señal AR(1)', 0.05], ['interferencia', 0.3]], prop: { tipo: 'bandstop', p1: 3.1, p2: 3.6, N: 2 }, por: 'Un rechaza banda angosto alrededor de ω = 0.3 (periodos de 3.1 a 3.6), o una muesca en 0.3: la señal AR(1) casi no se toca.' }
    };
  })();
  R('w3-proponer', c => {
    const ctr = lienzo(c);
    const es = seleccion(ctr, { etiqueta: 'Escenario', valor: 'ruido', opciones: Object.keys(ESCENARIOS).map(k => [k, ESCENARIOS[k].nombre]) }, () => { lec2.innerHTML = ''; lec2.style.display = 'none'; dibujar(); });
    const tp = seleccion(ctr, { etiqueta: 'Filtro', valor: 'lowpass', opciones: [['lowpass', 'Pasa bajos'], ['highpass', 'Pasa altos'], ['bandpass', 'Pasa banda'], ['bandstop', 'Rechaza banda'], ['notch', 'Muescas en 1/P y armónicos']] }, () => { config(); dibujar(); });
    const P1 = slider(ctr, { etiqueta: 'periodo de corte', min: 2.2, max: 100, paso: 0.1, valor: 15, fmt: v => `${fmt(v, 1)} (ω = ${fmt(1 / v, 3)})` }, dibujar);
    const P2 = slider(ctr, { etiqueta: 'periodo máximo de la banda', min: 2.5, max: 100, paso: 0.1, valor: 30, fmt: v => `${fmt(v, 1)} (ω = ${fmt(1 / v, 3)})` }, dibujar);
    const N = slider(ctr, { etiqueta: 'orden N', min: 1, max: 6, paso: 1, valor: 2 }, dibujar);
    const Q = slider(ctr, { etiqueta: 'Q de la muesca', min: 1, max: 20, paso: 1, valor: 4 }, dibujar);
    boton(ctr, 'Ver propuesta', () => { const E = ESCENARIOS[es.get()], p = E.prop; tp.set(p.tipo); config(); P1.set(p.p1); if (p.p2) P2.set(p.p2); if (p.N) N.set(p.N); if (p.Q) Q.set(p.Q); lec2.innerHTML = '💡 ' + E.por; lec2.style.display = ''; dibujar(); });
    const g1 = lamina(c), g2 = lamina(c), lec = lectura(c), lec2 = lectura(c);
    lec2.style.display = 'none';
    const ex = extra(c, 'Vista extra: la ganancia de tu filtro en cada componente'), tab = el('div', { class: 'w-tabla' });
    ex.append(tab);
    function config() { const t = tp.get(); P2.mostrar(t === 'bandpass' || t === 'bandstop'); N.mostrar(t !== 'notch'); Q.mostrar(t === 'notch'); }
    function filtrar(x) {
      const t = tp.get();
      if (t === 'notch') {
        let y = x.slice(); const p = P1.get(), H = [];
        for (let k = 1; k / p < 0.5 - 1e-9; k++) { const F = T3.iirnotch(k / p, Q.get()); H.push(F); y = T3.filtfilt(F.b, F.a, y); }
        return { y, gan: w => H.reduce((s, F) => s * T3.respuesta(F.b, F.a, [w])[0].gan2, 1) };
      }
      let p1 = P1.get(), p2 = P2.get();
      if ((t === 'bandpass' || t === 'bandstop') && p2 <= p1 * 1.05) p2 = p1 * 1.1;
      const fc = t === 'bandpass' || t === 'bandstop' ? [1 / p2, 1 / p1] : 1 / p1, B = T3.butter(N.get(), fc, t);
      return { y: T3.filtfilt(B.b, B.a, x), gan: w => T3.respuesta(B.b, B.a, [w])[0].gan2 };
    }
    function dibujar() {
      const E = ESCENARIOS[es.get()], x = E.x, n = x.length, t = rango(n, 1);
      let res;
      try { res = filtrar(x); } catch (e) { res = { y: x.map(() => NaN), gan: () => NaN }; }
      const ok = res.y.every(isFinite), rmse = ok ? Math.sqrt(TS.media(res.y.slice(20, -20).map((v, i) => (v - E.obj[i + 20]) ** 2))) : NaN, base = Math.sqrt(TS.media(x.slice(20, -20).map((v, i) => (v - E.obj[i + 20]) ** 2)));
      graf(g1, [lin(t, x, '#d2cde6', 'serie', { line: { color: '#d2cde6', width: 1.1 } }), lin(t, E.obj, PAL.texto, 'objetivo', { line: { color: PAL.texto, width: 1.4, dash: 'dot' } }), lin(t, ok ? res.y : [], PAL.rosa, 'tu filtro (filtfilt)', { line: { color: PAL.rosa, width: 2 } })],
        { height: 280, title: { text: `${E.nombre}: RMSE contra el objetivo = ${ok ? fmt(rmse, 3) : '—'} (sin filtrar: ${fmt(base, 3)})` }, xaxis: { title: { text: 't' } } });
      const per = sinCero(T3.periodograma(x)), W = T3.frecs(500).slice(1);
      graf(g2, [puntos(per.f, positivo(per.I), 'rgba(124,105,214,.55)', 'periodograma de la serie'), esp(W, W.map(w => res.gan(w)), PAL.rosa, 'ganancia² de tu filtro (eje derecho)', { yaxis: 'y2', line: { color: PAL.rosa, width: 2.2 } })],
        { height: 280, title: { text: 'Dónde está cada cosa y qué deja pasar tu filtro' }, xaxis: EJE_W, yaxis: { type: 'log', exponentformat: 'power' }, yaxis2: { overlaying: 'y', side: 'right', range: [0, 1.1], showgrid: false }, shapes: marcas(E.comp.map(([, w]) => w), 'rgba(63,174,138,.6)') });
      const mejora = ok ? 1 - rmse / base : 0;
      lec.className = 'w-lectura ' + (!ok ? 'mal' : mejora > 0.6 ? 'ok' : mejora > 0.3 ? 'aviso' : 'mal');
      lec.innerHTML = !ok ? '⚠️ El filtro es inestable con estos parámetros: baja el orden o separa los cortes.' : `Tu filtro reduce el error un <b>${fmt(100 * mejora, 0)}%</b> respecto a no filtrar. ` + (mejora > 0.6 ? '¡Buen diseño!' : 'Revisa en la gráfica de abajo si la ganancia es alta donde está el objetivo y baja donde está lo que estorba.');
      tab.innerHTML = tablaHTML(['componente', 'ω', 'periodo', 'ganancia² de tu filtro'], E.comp.map(([nm, w]) => [nm, fmt(w, 4), fP(w), fmt(res.gan(w), 3)]));
    }
    config(); dibujar();
  });

  /* ======================= 13 · Caso El Niño ======================= */
  R('w3-caso-elnino', c => {
    const ctr = lienzo(c);
    const paso = segmentado(ctr, { etiqueta: 'Paso', valor: '1', opciones: [['1', '1 · Serie'], ['2', '2 · Ciclo anual'], ['3', '3 · Periodograma'], ['4', '4 · Tres estimadores'], ['5', '5 · Periodicidad o ciclo'], ['6', '6 · Filtro'], ['7', '7 · Eventos']] }, dibujar);
    const g = lamina(c), lec = lectura(c);
    const x = NINO, n = x.length, fechas = rango(n).map(i => 1950 + i / 12);
    const clim = rango(12).map(k => TS.media(x.filter((_, i) => i % 12 === k)));
    const B = T3.butter(4, [1 / 84, 1 / 24], 'bandpass'), enso = T3.filtfilt(B.b, B.a, NINO_ANOM);
    function dibujar() {
      const p = paso.get();
      if (p === '1') {
        graf(g, [lin(fechas, x, PAL.lav, 'temperatura (°C)', { line: { color: PAL.lav, width: 1.2 } })], { height: 300, title: { text: 'Temperatura superficial del mar, región de El Niño (1950–2010)' }, showlegend: false });
        lec.innerHTML = '<b>Paso 1.</b> Serie mensual de 732 datos, sin faltantes. Se ve un vaivén anual muy regular y, encima, años más cálidos (El Niño) y más fríos (La Niña) sin un ritmo fijo.';
      } else if (p === '2') {
        graf(g, [{ type: 'bar', x: MESES, y: clim, marker: { color: clim.map(v => (v === Math.max(...clim) ? PAL.rosa : v === Math.min(...clim) ? PAL.cel : 'rgba(124,105,214,.55)')) }, hovertemplate: '%{x}: %{y:.2f} °C<extra></extra>' }],
          { height: 300, title: { text: 'Climatología: el promedio de cada mes' }, yaxis: { range: [Math.min(...clim) - 0.6, Math.max(...clim) + 0.4], title: { text: '°C' } }, showlegend: false });
        lec.innerHTML = `<b>Paso 2.</b> El mar está ${fmt(Math.max(...clim) - Math.min(...clim), 2)} °C más cálido en marzo que en septiembre. Restar a cada mes su promedio (la climatología) quita la parte periódica exacta: quedan las <b>anomalías</b> (varianza ${fmt(TS.varianza(NINO_ANOM), 3)} contra ${fmt(TS.varianza(x), 3)} total).`;
      } else if (p === '3') {
        const per = sinCero(T3.periodograma(x));
        graf(g, [puntos(per.f, positivo(per.I), PAL.lav, 'periodograma')], { height: 320, title: { text: 'Periodograma de la temperatura: una línea y una joroba' }, xaxis: { title: { text: 'ω (ciclos por mes)' }, range: [0, 0.2] }, yaxis: { type: 'log', exponentformat: 'power' }, shapes: [franja(1 / 84, 1 / 24)].concat(marcas([1 / 12])), showlegend: false });
        lec.innerHTML = '<b>Paso 3.</b> La línea en ω = 1/12 (punteada) concentra el <b>76%</b> de la varianza: es la periodicidad anual. La joroba en la franja verde (periodos de 2 a 7 años) concentra el <b>14%</b>: es El Niño.';
      } else if (p === '4') {
        const D = T3.daniell(NINO_ANOM, 3), W = T3.welch(NINO_ANOM, { nperseg: 240 }), ords = T3.ordenesAR(NINO_ANOM, 24).slice(1), best = ords.reduce((a, b) => (b.aic < a.aic ? b : a)), F = T3.frecs(1000).slice(1), A = T3.arEspectral(NINO_ANOM, best.p, F);
        graf(g, [puntos(D.f, positivo(D.I), 'rgba(140,135,170,.35)', 'periodograma'), esp(D.f, D.fhat, PAL.lav, 'Daniell L = 7'), esp(W.f.slice(1), W.pxx.slice(1).map(v => v / 2), PAL.cel, 'Welch (240)'), esp(F, A.espectro, PAL.rosa, `AR(${best.p})`, { line: { color: PAL.rosa, width: 2.4 } })],
          { height: 330, title: { text: 'Espectro de las anomalías: tres estimadores' }, xaxis: { title: { text: 'ω (ciclos por mes)' }, range: [0, 0.2] }, yaxis: { type: 'log', exponentformat: 'power' }, shapes: [franja(1 / 84, 1 / 24)] });
        const pico = (f, P) => 1 / f[P.indexOf(Math.max(...P))];
        lec.innerHTML = `<b>Paso 4.</b> Daniell: pico en ${fmt(pico(D.f, D.fhat), 1)} meses; Welch: ${fmt(pico(W.f.slice(1), W.pxx.slice(1)), 1)}; AR(${best.p}) por AIC: ${fmt(pico(F, A.espectro), 1)}. Los tres coinciden en un ciclo de 4 a 5 años, con un pico ancho.`;
      } else if (p === '5') {
        const P1 = sinCero(T3.periodograma(x)), P2 = sinCero(T3.periodograma(NINO_ANOM));
        graf(g, [puntos(P1.f, positivo(P1.I), 'rgba(124,105,214,.6)', 'temperatura'), puntos(P2.f, positivo(P2.I), 'rgba(224,112,159,.7)', 'anomalías')],
          { height: 320, title: { text: 'Una línea angosta (periodicidad) contra una joroba ancha (ciclo)' }, xaxis: { title: { text: 'ω (ciclos por mes)' }, range: [0, 0.12] }, yaxis: { type: 'log', exponentformat: 'power' }, shapes: [franja(1 / 84, 1 / 24)].concat(marcas([1 / 12])) });
        lec.innerHTML = '<b>Paso 5.</b> El ciclo anual cae en una sola frecuencia de Fourier y desaparece en las anomalías: es una <b>periodicidad</b> (se justifica un término estacional de 12). El Niño reparte su potencia en muchas frecuencias vecinas: es un <b>ciclo</b> de duración variable (no se justifica un periodo fijo).';
      } else if (p === '6') {
        const W = T3.frecs(801), r = T3.respuesta(B.b, B.a, W);
        graf(g, [esp(W, r.map(o => o.gan2), PAL.rosa, '|A(ω)|² con filtfilt', { line: { color: PAL.rosa, width: 2.4 } })], { height: 300, title: { text: 'Butterworth pasa banda, orden 4, periodos de 24 a 84 meses' }, xaxis: { title: { text: 'ω (ciclos por mes)' }, range: [0, 0.15] }, yaxis: { range: [0, 1.05] }, shapes: [franja(1 / 84, 1 / 24)].concat(marcas([1 / 12])), showlegend: false });
        lec.innerHTML = `<b>Paso 6.</b> El filtro deja pasar la franja de El Niño y vale ${fmt(T3.respuesta(B.b, B.a, [1 / 12])[0].gan2, 4)} en el ciclo anual. Se aplica con <code>filtfilt</code> (fase cero) porque es para describir el pasado.`;
      } else {
        const pk = maximos(enso, 18).filter(i => enso[i] > 1.2);
        graf(g, [lin(fechas, NINO_ANOM, '#d2cde6', 'anomalías', { line: { color: '#d2cde6', width: 1.1 } }), lin(fechas, enso, PAL.rosa, 'banda de 2 a 7 años', { line: { color: PAL.rosa, width: 2.2 } }),
          { x: pk.map(i => fechas[i]), y: pk.map(i => enso[i]), mode: 'markers+text', text: pk.map(i => String(Math.floor(fechas[i]))), textposition: 'top center', marker: { symbol: 'star', size: 12, color: PAL.dur }, name: 'eventos fuertes' }],
          { height: 320, title: { text: 'El Niño aislado con el pasa banda' }, yaxis: { title: { text: '°C' } } });
        lec.innerHTML = `<b>Paso 7.</b> La banda de 2 a 7 años explica el ${fmt(100 * TS.varianza(enso) / TS.varianza(NINO_ANOM), 0)}% de la varianza de las anomalías y recupera los eventos fuertes: ${pk.map(i => Math.floor(fechas[i])).join(', ')}. Conclusión: periodicidad anual (76%) + ciclo de El Niño de 4 a 5 años (14%).`;
      }
    }
    dibujar();
  });
})();
