/* =====================================================================
   widgets.js — Gráficas interactivas de la guía (Plotly + KaTeX).
   Cada gráfica se crea cuando te acercas a ella (carga diferida).
   ===================================================================== */
(function () {
  'use strict';
  const PAL = { lav: '#7c69d6', rosa: '#e0709f', dur: '#ee8a5f', menta: '#3fae8a', cel: '#4f9fd8', mant: '#d9a520', gris: '#a9a5c2', texto: '#3b3a52', rejilla: '#efecf8' };
  let MACROS = {};
  try { MACROS = JSON.parse(document.getElementById('macros-katex').textContent); } catch (e) { MACROS = {}; }
  const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

  /* ------------------------- Carga de librerías ------------------------- */
  const CDN = {
    plotly: 'https://cdn.jsdelivr.net/npm/plotly.js-dist-min@2.35.2/plotly.min.js',
    katex: 'https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js'
  };
  const cargas = {};
  function cargar(url) {
    if (!cargas[url]) {
      cargas[url] = new Promise((ok, mal) => {
        const s = document.createElement('script');
        s.src = url; s.async = true; s.crossOrigin = 'anonymous';
        s.onload = ok; s.onerror = () => mal(new Error('No se pudo cargar ' + url));
        document.head.appendChild(s);
      });
    }
    return cargas[url];
  }
  const librerias = () => Promise.all([cargar(CDN.plotly), cargar(CDN.katex)]);

  /* ------------------------------ Utilidades ---------------------------- */
  function el(tag, attrs, ...hijos) {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (k === 'class') e.className = v;
      else if (k === 'html') e.innerHTML = v;
      else if (k === 'style') e.style.cssText = v;
      else e.setAttribute(k, v);
    }
    for (const h of hijos) if (h !== null && h !== undefined) e.append(h.nodeType ? h : document.createTextNode(String(h)));
    return e;
  }
  const fmt = (v, d = 3) => (v === null || v === undefined || !isFinite(v)) ? '—' : Number(v).toFixed(d);
  const fp = p => !isFinite(p) ? '—' : p < 0.0001 ? '< 0.0001' : p.toFixed(4);
  function num(v) { const r = Math.round(v * 10000) / 10000; return String(Object.is(r, -0) ? 0 : r); }
  const kpi = (nombre, valor) => `<div class="w-kpi"><b>${valor}</b><span>${nombre}</span></div>`;
  const ref = (id, texto) => `<a class="ref ref-atras" href="#${id}"><span class="ref-flecha">↩</span> ${texto}</a>`;
  function tex(s, display) {
    try {
      return window.katex.renderToString(s, { displayMode: !!display, macros: Object.assign({}, MACROS), trust: true, strict: 'ignore', throwOnError: false, output: 'html' });
    } catch (e) { return s; }
  }
  function mezcla(a, b, t) {
    const pa = [1, 3, 5].map(i => parseInt(a.substr(i, 2), 16)), pb = [1, 3, 5].map(i => parseInt(b.substr(i, 2), 16));
    return 'rgb(' + pa.map((v, i) => Math.round(v + (pb[i] - v) * t)).join(',') + ')';
  }
  function barajar(x, semilla) {
    const r = TS.rng(semilla).unif, a = x.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }
  function fracc(w) { const d = Math.round(1 / w); return Math.abs(1 / d - w) < 1e-9 ? '1/' + d : w.toFixed(3); }
  function simAR(n, coef, semilla, quemado = 300) {
    const e = TS.rng(semilla).normales(n + quemado), y = new Array(n + quemado).fill(0);
    for (let t = 0; t < n + quemado; t++) {
      let v = e[t];
      coef.forEach((c, j) => { if (c && t - j - 1 >= 0) v += c * y[t - j - 1]; });
      y[t] = v;
    }
    return y.slice(quemado);
  }

  /* -------------------------------- Controles --------------------------- */
  function control(etiqueta, contenido, clase) {
    const d = el('div', { class: 'w-control ' + (clase || '') });
    if (etiqueta !== null) { const l = el('label', {}, el('span', {}, etiqueta)); d.append(l); d._label = l; }
    d.append(contenido);
    return d;
  }
  function slider(padre, o, alCambiar) {
    const inp = el('input', { type: 'range', min: o.min, max: o.max, step: o.paso, value: o.valor });
    const val = el('span', { class: 'w-valor' });
    const d = control(o.etiqueta, inp);
    d._label.append(val);
    let f = o.fmt || (v => v);
    const pintar = () => { val.textContent = f(Number(inp.value)); };
    pintar();
    let pend = false;
    inp.addEventListener('input', () => {
      pintar();
      if (!pend) { pend = true; requestAnimationFrame(() => { pend = false; alCambiar(); }); }
    });
    padre.append(d);
    return {
      get: () => Number(inp.value),
      set: v => { inp.value = v; pintar(); },
      input: inp,
      etiqueta: t => { d._label.firstChild.textContent = t; },
      config: c => { inp.min = c.min; inp.max = c.max; inp.step = c.paso; inp.value = c.valor; if (c.etiqueta) d._label.firstChild.textContent = c.etiqueta; if (c.fmt) f = c.fmt; pintar(); },
      mostrar: si => { d.style.display = si ? '' : 'none'; }
    };
  }
  function seleccion(padre, o, alCambiar) {
    const s = el('select');
    for (const [v, t] of o.opciones) s.append(el('option', { value: v }, t));
    s.value = o.valor;
    s.addEventListener('change', alCambiar);
    padre.append(control(o.etiqueta, s));
    return { get: () => s.value, set: v => { s.value = v; } };
  }
  function segmentado(padre, o, alCambiar) {
    const g = el('div', { class: 'w-seg', role: 'group' });
    let actual = String(o.valor);
    const botones = o.opciones.map(([v, t]) => {
      const b = el('button', { type: 'button' }, t);
      b.dataset.v = String(v);
      b.addEventListener('click', () => { actual = String(v); pintar(); alCambiar(); });
      g.append(b);
      return b;
    });
    const pintar = () => botones.forEach(b => b.classList.toggle('on', b.dataset.v === actual));
    pintar();
    padre.append(control(o.etiqueta, g, 'angosto'));
    return { get: () => actual, set: v => { actual = String(v); pintar(); } };
  }
  function boton(padre, texto, alClic, clase) {
    const b = el('button', { type: 'button', class: 'w-btn ' + (clase || '') }, texto);
    b.addEventListener('click', alClic);
    padre.append(b);
    return b;
  }
  function casilla(padre, texto, valor, alCambiar) {
    const i = el('input', { type: 'checkbox' });
    i.checked = valor;
    i.addEventListener('change', alCambiar);
    const lab = el('label', { class: 'w-control w-check' }, i, el('span', {}, texto));
    padre.append(lab);
    return { get: () => i.checked, set: v => { i.checked = !!v; }, mostrar: v => { lab.style.display = v ? '' : 'none'; } };
  }
  function lienzo(c) { c.innerHTML = ''; const ctr = el('div', { class: 'w-controles' }); c.append(ctr); return ctr; }
  function lamina(c, estilo) { const d = el('div', { class: 'w-graf', style: estilo || '' }); c.append(d); return d; }
  function fila(c) { const f = el('div', { class: 'w-fila' }); c.append(f); return f; }
  function lectura(c) { const d = el('div', { class: 'w-lectura' }); c.append(d); return d; }

  /* ------------------------------- Plotly ------------------------------- */
  const BASE = {
    margin: { l: 52, r: 16, t: 40, b: 44 },
    paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: '#ffffff',
    font: { family: 'Nunito, system-ui, sans-serif', size: 12, color: PAL.texto },
    legend: { orientation: 'h', y: -0.22, x: 0, font: { size: 11 } },
    hoverlabel: { bgcolor: '#ffffff', bordercolor: '#d9d2f5', font: { color: PAL.texto, family: 'Nunito, sans-serif' } },
    title: { font: { family: 'Fredoka, Nunito, sans-serif', size: 14, color: '#45397a' }, x: 0.01, xanchor: 'left', y: 0.97 },
    bargap: 0.35
  };
  const EJE = { gridcolor: PAL.rejilla, zeroline: false, linecolor: '#ddd8ee', tickfont: { size: 11 }, automargin: true, title: { font: { size: 12 } } };
  const CONFIG = { displayModeBar: false, responsive: true };
  function combinar(a, b) {
    const out = Object.assign({}, a);
    for (const k of Object.keys(b || {})) {
      const v = b[k];
      if (v && typeof v === 'object' && !Array.isArray(v) && a && a[k] && typeof a[k] === 'object' && !Array.isArray(a[k])) out[k] = combinar(a[k], v);
      else out[k] = v;
    }
    return out;
  }
  function graf(div, trazas, layout) {
    const L = combinar(BASE, layout || {});
    if (!L.xaxis) L.xaxis = {};
    if (!L.yaxis) L.yaxis = {};
    for (const k of Object.keys(L)) if (/^[xy]axis\d*$/.test(k)) L[k] = combinar(EJE, L[k]);
    window.Plotly.react(div, trazas, L, CONFIG);
  }
  function banda(x0, x1, b, color) {
    return [
      { x: [x0, x1], y: [b, b], mode: 'lines', line: { color: 'rgba(0,0,0,0)' }, hoverinfo: 'skip', showlegend: false },
      { x: [x0, x1], y: [-b, -b], mode: 'lines', line: { color: 'rgba(0,0,0,0)' }, fill: 'tonexty', fillcolor: color || 'rgba(124,105,214,.13)', hoverinfo: 'skip', showlegend: false }
    ];
  }
  function trazasACF(r, n, o) {
    o = o || {};
    const desde = o.desde || 1, hasta = o.hasta || r.length - 1, b = 1.96 / Math.sqrt(n);
    const ks = [], vs = [], cs = [];
    for (let k = desde; k <= hasta; k++) {
      ks.push(k); vs.push(r[k]);
      cs.push(k === o.resaltar ? PAL.rosa : Math.abs(r[k]) > b ? PAL.dur : (o.color || PAL.lav));
    }
    return banda(desde - 0.5, hasta + 0.5, b).concat([{
      type: 'bar', x: ks, y: vs, marker: { color: cs }, width: 0.45, name: o.nombre || 'ACF muestral',
      hovertemplate: 'k = %{x}<br>valor = %{y:.3f}<extra></extra>'
    }]);
  }
  const layoutACF = (titulo, extra) => combinar({ height: 260, title: { text: titulo }, yaxis: { range: [-1.05, 1.05] }, xaxis: { title: { text: 'rezago k' } }, showlegend: false }, extra || {});
  function apilado(series, alto, extra) {
    const m = series.length, tr = [], L = combinar({ height: alto, showlegend: false, margin: { t: 26, b: 34, l: 58, r: 14 } }, extra || {});
    series.forEach((s, j) => {
      const yid = j ? 'y' + (j + 1) : 'y';
      tr.push(Object.assign({ x: s.x, y: s.y, mode: s.modo || 'lines', line: { color: s.color, width: 1.7 }, marker: { size: 3.5, color: s.color }, name: s.nombre, xaxis: 'x', yaxis: yid }, s.extra || {}));
      const alto1 = 1 / m, hi = 1 - j * alto1, lo = hi - alto1 + 0.06;
      L[j ? 'yaxis' + (j + 1) : 'yaxis'] = combinar({ domain: [lo, hi - 0.015], title: { text: s.nombre, font: { size: 11 } } }, s.eje || {});
    });
    L.xaxis = combinar({ anchor: m > 1 ? 'y' + m : 'y' }, (extra && extra.xaxis) || {});
    return { tr, L };
  }

  /* ============================== Widgets =============================== */
  const W = Object.create(null);
  // ---- Ayudas para vistas extra
  function tablaHTML(cab, filas, clases) {
    return '<table><thead><tr>' + cab.map(h => `<th>${h}</th>`).join('') + '</tr></thead><tbody>' +
      filas.map((f, i) => `<tr class="${(clases && clases[i]) || ''}">` + f.map(v => `<td>${v}</td>`).join('') + '</tr>').join('') + '</tbody></table>';
  }
  function extra(c, titulo) {
    const caja = el('div', { class: 'w-extra' }, el('div', { class: 'w-extra-cab' }, '🔎 ' + titulo));
    c.append(caja);
    return caja;
  }
  const dispersion = (xs, ys, color, etiquetas) => ({ x: xs, y: ys, mode: 'markers', marker: { color: color || 'rgba(124,105,214,.55)', size: 7, line: { color: '#fff', width: 0.6 } }, text: etiquetas, hovertemplate: (etiquetas ? '%{text}<br>' : '') + 'x = %{x:.3f}<br>y = %{y:.3f}<extra></extra>' });


  // 1.1 Realizaciones de un proceso
  W.realizaciones = c => {
    const ctr = lienzo(c), n = 100;
    let base = 1, sel = 0;
    const proc = seleccion(ctr, { etiqueta: 'Proceso', valor: 'ar', opciones: [['ar', 'AR(1) con φ = 0.8'], ['paseo', 'Paseo aleatorio'], ['ruido', 'Ruido blanco']] }, dibujar);
    boton(ctr, 'Observar otra historia', () => { sel = (sel + 1) % 8; dibujar(); });
    boton(ctr, 'Nuevas historias', () => { base += 37; dibujar(); }, 'sec');
    const ens = casilla(ctr, 'Mostrar media del conjunto (200 historias)', false, dibujar);
    const tc = slider(ctr, { etiqueta: 'Corte en el instante t', min: 1, max: 100, paso: 1, valor: 60 }, dibujar);
    const g = lamina(c), lec = lectura(c), ex = extra(c, 'Vista extra: el valor en un instante t es una variable aleatoria'), fx = fila(ex), gx1 = lamina(fx), gx2 = el('div', { class: 'w-tabla' });
    fx.append(gx2);
    const gen = (p, s) => p === 'ar' ? TS.sim.ar1(n, 0.8, { semilla: s }) : p === 'paseo' ? TS.sim.paseo(n, { semilla: s }) : TS.sim.ruido(n, { semilla: s });
    function dibujar() {
      const p = proc.get(), t = TS.rango(n, 1), tr = [];
      let primera = true;
      for (let j = 0; j < 8; j++) {
        if (j === sel) continue;
        tr.push({ x: t, y: gen(p, base + j), mode: 'lines', line: { color: 'rgba(124,105,214,.3)', width: 1.2 }, hoverinfo: 'skip', name: 'otras historias posibles', showlegend: primera });
        primera = false;
      }
      if (ens.get()) {
        const M = 200, s1 = new Array(n).fill(0), s2 = new Array(n).fill(0);
        for (let j = 0; j < M; j++) gen(p, 5000 + base + j).forEach((v, i) => { s1[i] += v; s2[i] += v * v; });
        const m = s1.map(v => v / M), sd = s2.map((v, i) => Math.sqrt(Math.max(0, v / M - m[i] * m[i])));
        tr.push({ x: t, y: m.map((v, i) => v + 2 * sd[i]), mode: 'lines', line: { width: 0 }, hoverinfo: 'skip', showlegend: false });
        tr.push({ x: t, y: m.map((v, i) => v - 2 * sd[i]), mode: 'lines', line: { width: 0 }, fill: 'tonexty', fillcolor: 'rgba(63,174,138,.15)', name: 'media ± 2 desv. del conjunto', hoverinfo: 'skip' });
        tr.push({ x: t, y: m, mode: 'lines', line: { color: PAL.menta, width: 3 }, name: 'media del conjunto en cada t' });
      }
      tr.push({ x: t, y: gen(p, base + sel), mode: 'lines', line: { color: PAL.rosa, width: 2.6 }, name: 'la historia que observamos' });
      graf(g, tr, { height: 360, title: { text: 'Realizaciones del mismo proceso' }, xaxis: { title: { text: 't' } }, yaxis: { title: { text: 'y(t)' } } });
      lec.innerHTML = {
        ar: 'Las historias se cruzan, pero todas oscilan alrededor de 0 con una dispersión parecida: la media y la varianza del conjunto <b>no cambian con t</b>. Es un proceso estacionario.',
        paseo: 'La media del conjunto se queda cerca de 0, pero las historias se separan cada vez más: la dispersión <b>crece con t</b> (varianza tσ²). No es estacionario.',
        ruido: 'Cada historia es puro azar sin memoria; el conjunto tiene media 0 y la misma dispersión en todo t.'
      }[p] + (ens.get() ? '' : ' Activa «Mostrar media del conjunto» para verlo con números.');
      const T0 = tc.get(), vals = TS.rango(200).map(j => gen(p, 5000 + base + j)[T0 - 1]), m0 = TS.media(vals), s0 = TS.desv(vals);
      window.Plotly.relayout(g, { shapes: [{ type: 'line', x0: T0, x1: T0, yref: 'paper', y0: 0, y1: 1, line: { color: PAL.mant, width: 3, dash: 'dot' } }] });
      graf(gx1, [{ type: 'histogram', x: vals, nbinsx: 25, marker: { color: 'rgba(217,165,32,.55)', line: { color: '#fff', width: 1 } } }], { height: 250, title: { text: `Valores de Y(${T0}) en 200 historias` }, showlegend: false, bargap: 0.03, xaxis: { title: { text: `y(${T0})` } } });
      const m1 = TS.rango(200).map(j => gen(p, 5000 + base + j)[9]);
      gx2.innerHTML = tablaHTML(['Instante', 'Media entre historias', 'Desv. entre historias'], [['t = 10', fmt(TS.media(m1), 2), fmt(TS.desv(m1), 2)], [`t = ${T0}`, fmt(m0, 2), fmt(s0, 2)]]) +
        `<p style="font-size:.88rem;margin:6px 4px">La línea amarilla punteada de la gráfica principal marca el instante elegido. El histograma son los 200 valores posibles de <b>Y(${T0})</b>: su promedio estima E[y(t)] y su dispersión estima la desviación de y(t). ${p === 'paseo' ? 'En el paseo la dispersión en t = ' + T0 + ' es mucho mayor que en t = 10.' : 'Compara con t = 10: son parecidas.'}</p>`;
    }
    dibujar();
  };

  // 1.4 Barajar los datos
  W.barajar = c => {
    const ctr = lienzo(c);
    let barajada = false, semilla = 3;
    const datos = seleccion(ctr, { etiqueta: 'Serie', valor: 'ap', opciones: [['ap', 'AirPassengers'], ['ar', 'AR(1) simulado (φ = 0.85)']] }, () => { barajada = false; dibujar(); });
    const bt = boton(ctr, '🔀 Barajar los datos', () => { barajada = !barajada; if (barajada) semilla++; dibujar(); });
    const f = fila(c), g1 = lamina(f), g2 = lamina(f), lec = lectura(c), ex = extra(c, 'Vista extra: lag plot y(t−1) contra y(t)'), gx = lamina(ex);
    function dibujar() {
      const x0 = datos.get() === 'ap' ? TS.datos.airpassengers.slice() : TS.sim.ar1(144, 0.85, { c: 7.5, semilla: 5 });
      const x = barajada ? barajar(x0, semilla) : x0;
      bt.textContent = barajada ? '↩ Volver al orden original' : '🔀 Barajar los datos';
      graf(g1, [{ x: TS.rango(x.length, 1), y: x, mode: 'lines', line: { color: barajada ? PAL.dur : PAL.lav, width: 1.8 }, name: 'y' }],
        { height: 280, title: { text: barajada ? 'Datos barajados' : 'Datos en su orden' }, xaxis: { title: { text: 't' } }, showlegend: false });
      const r = TS.acf(x, 24), r0 = TS.acf(x0, 24);
      graf(g2, trazasACF(r, x.length), layoutACF('ACF'));
      lec.innerHTML = `Media: <b>${fmt(TS.media(x), 2)}</b> · Varianza: <b>${fmt(TS.varianza(x), 2)}</b> (idénticas en orden y barajadas) · ρ̂(1) en orden: <b>${fmt(r0[1])}</b>` +
        (barajada ? ` · ρ̂(1) barajada: <b>${fmt(r[1])}</b>. Los números son los mismos, pero la memoria desapareció.` : '. Presiona «Barajar» y compara.');
      graf(gx, [dispersion(x.slice(0, -1), x.slice(1), barajada ? 'rgba(238,138,95,.6)' : undefined)], { height: 280, title: { text: `${barajada ? 'Barajados' : 'En orden'}: cada punto es (y(t−1), y(t)); ρ̂(1) = ${fmt(r[1])}` }, xaxis: { title: { text: 'y(t−1)' } }, yaxis: { title: { text: 'y(t)' } }, showlegend: false });
    }
    dibujar();
  };

  // 2.2 Gráfica estacional
  W.estacional = c => {
    const ctr = lienzo(c);
    const modo = segmentado(ctr, { etiqueta: 'Vista', valor: 'lineas', opciones: [['lineas', 'Una línea por año'], ['caja', 'Boxplot por mes']] }, dibujar);
    const lg = casilla(ctr, 'Usar logaritmo', false, dibujar);
    const g = lamina(c), lec = lectura(c), ex = extra(c, 'Vista extra: perfil estacional promedio'), fx = fila(ex), gx = lamina(fx), tx = el('div', { class: 'w-tabla' });
    fx.append(tx);
    function dibujar() {
      const ap = TS.datos.airpassengers.map(v => lg.get() ? Math.log(v) : v), tr = [], lineas = modo.get() === 'lineas';
      if (lineas) {
        for (let a = 0; a < 12; a++) tr.push({ x: MESES, y: ap.slice(12 * a, 12 * a + 12), mode: 'lines+markers', name: String(1949 + a), line: { color: mezcla('#b3a3f2', '#f08fb5', a / 11), width: 2 }, marker: { size: 4 } });
      } else {
        for (let m = 0; m < 12; m++) tr.push({ type: 'box', name: MESES[m], y: TS.rango(12).map(a => ap[12 * a + m]), marker: { color: PAL.lav, size: 4 }, line: { color: PAL.lav }, fillcolor: 'rgba(201,188,247,.35)', boxpoints: 'all', jitter: 0.4, pointpos: 0 });
      }
      graf(g, tr, { height: 380, title: { text: lineas ? 'Una línea por año (de lila 1949 a rosa 1960)' : 'Cada mes a lo largo de los 12 años' }, yaxis: { title: { text: lg.get() ? 'ln(pasajeros)' : 'pasajeros' } }, showlegend: lineas, legend: { orientation: 'v', x: 1.01, y: 1, font: { size: 10 } } });
      lec.innerHTML = lineas
        ? (lg.get() ? 'En logaritmos las líneas son casi <b>paralelas</b>: el patrón tiene el mismo tamaño cada año. Era multiplicativo y el logaritmo lo volvió aditivo.' : 'Todas las líneas tienen la misma forma (pico en julio–agosto, valle en noviembre) y cada año está más arriba: hay <b>estacionalidad</b> y <b>tendencia</b>. Las líneas recientes oscilan más: la amplitud crece.')
        : 'Julio y agosto tienen las medianas más altas y noviembre la más baja. Las cajas son altas porque mezclan años con niveles muy distintos (la tendencia).';
      const prom = MESES.map((_, m) => TS.media(TS.rango(12).map(a => ap[12 * a + m]))), gm = TS.media(prom);
      graf(gx, [{ type: 'bar', x: MESES, y: prom.map(v => v - gm), marker: { color: prom.map(v => v >= gm ? PAL.rosa : PAL.cel) }, hovertemplate: '%{x}: %{y:.3f}<extra></extra>' }], { height: 260, title: { text: 'Promedio de cada mes menos el promedio general' }, showlegend: false });
      tx.innerHTML = tablaHTML(['Mes', 'Promedio 1949–1960', 'Diferencia'], MESES.map((m, i) => [m, fmt(prom[i], lg.get() ? 3 : 1), (prom[i] >= gm ? '+' : '') + fmt(prom[i] - gm, lg.get() ? 3 : 1)]));
    }
    dibujar();
  };

  // 2.3 Lag plot
  W.rezagos = c => {
    const ctr = lienzo(c);
    const series = { ar: TS.sim.ar1(200, 0.8, { semilla: 21 }), arn: TS.sim.ar1(200, -0.7, { semilla: 22 }), rb: TS.sim.ruido(200, { semilla: 23 }), ap: TS.datos.airpassengers };
    const s = seleccion(ctr, { etiqueta: 'Serie', valor: 'ar', opciones: [['ar', 'AR(1) con φ = 0.8'], ['arn', 'AR(1) con φ = −0.7'], ['rb', 'Ruido blanco'], ['ap', 'AirPassengers']] }, dibujar);
    const k = slider(ctr, { etiqueta: 'Rezago k', min: 1, max: 24, paso: 1, valor: 1 }, dibujar);
    const f = fila(c), g1 = lamina(f), g2 = lamina(f), lec = lectura(c), ex = extra(c, 'Vista extra: las primeras parejas que forman la nube'), tx = el('div', { class: 'w-tabla' });
    ex.append(tx);
    function dibujar() {
      const x = series[s.get()], kk = k.get(), n = x.length, r = TS.acf(x, 24), b = 1.96 / Math.sqrt(n);
      graf(g1, [{ x: x.slice(0, n - kk), y: x.slice(kk), mode: 'markers', marker: { color: 'rgba(124,105,214,.55)', size: 6, line: { color: '#fff', width: 0.5 } }, hovertemplate: 'y(t−k) = %{x:.2f}<br>y(t) = %{y:.2f}<extra></extra>' }],
        { height: 320, title: { text: `Lag plot, k = ${kk}: ρ̂(${kk}) = ${fmt(r[kk])}` }, xaxis: { title: { text: `y(t−${kk})` } }, yaxis: { title: { text: 'y(t)' } }, showlegend: false });
      graf(g2, trazasACF(r, n, { resaltar: kk }), layoutACF('Correlograma (rosa = el rezago del lag plot)', { height: 320 }));
      lec.innerHTML = `Con k = ${kk} hay n − k = <b>${n - kk}</b> parejas. ` +
        (Math.abs(r[kk]) > b ? `La autocorrelación es <b>significativa</b> (sale de la banda ±${fmt(b)}). ` : 'La autocorrelación queda <b>dentro</b> de la banda: no es significativa. ') +
        (r[kk] > 0.3 ? 'La nube sube: valores altos siguen a valores altos.' : r[kk] < -0.3 ? 'La nube baja: la serie alterna.' : 'La nube es casi redonda.');
      const mx = TS.media(x), filasP = TS.rango(10).map(i => { const t1 = i + kk + 1, a = x[t1 - 1 - kk], b2 = x[t1 - 1]; return [t1, fmt(a, 2), fmt(b2, 2), fmt((b2 - mx) * (a - mx), 2)]; });
      tx.innerHTML = tablaHTML(['t', `y(t−${kk})`, 'y(t)', '(y(t) − ȳ)(y(t−k) − ȳ)'], filasP) + `<p style="font-size:.88rem;margin:6px 4px">Cada renglón es un punto de la nube. Si la mayoría de los productos de la última columna son positivos, ρ̂(${kk}) sale positivo (suma de todos los productos ÷ n ÷ varianza). Hay ${n - kk} renglones en total.</p>`;
    }
    dibujar();
  };

  // 2.4 Media y desviación móviles
  W.moviles = c => {
    const ctr = lienzo(c);
    const S = { rb: TS.sim.ruido(200, { semilla: 31, media: 10 }), tend: TS.sim.tendencia(200, { a: 5, b: 0.05, semilla: 32 }), het: TS.sim.heteroc(200, { factor: 4, semilla: 33 }), ap: TS.datos.airpassengers };
    const s = seleccion(ctr, { etiqueta: 'Serie', valor: 'rb', opciones: [['rb', 'Ruido blanco (estacionaria)'], ['tend', 'Tendencia + ruido'], ['het', 'Varianza creciente'], ['ap', 'AirPassengers']] }, dibujar);
    const w = slider(ctr, { etiqueta: 'Ventana m', min: 4, max: 36, paso: 1, valor: 12 }, dibujar);
    const po = slider(ctr, { etiqueta: 'Ver la ventana que termina en t', min: 12, max: 200, paso: 1, valor: 60 }, dibujar);
    const g = lamina(c), lec = lectura(c), ex = extra(c, 'Vista extra: los datos de una ventana'), tx = el('div', { class: 'w-tabla' });
    ex.append(tx);
    function dibujar() {
      const x = S[s.get()], m = w.get(), t = TS.rango(x.length, 1), mm = TS.mediaMovil(x, m), sd = TS.desvMovil(x, m);
      graf(g, [
        { x: t, y: x, mode: 'lines', line: { color: 'rgba(124,105,214,.55)', width: 1.3 }, name: 'serie' },
        { x: t, y: mm.map((v, i) => v === null ? null : v + 2 * sd[i]), mode: 'lines', line: { width: 0 }, hoverinfo: 'skip', showlegend: false },
        { x: t, y: mm.map((v, i) => v === null ? null : v - 2 * sd[i]), mode: 'lines', line: { width: 0 }, fill: 'tonexty', fillcolor: 'rgba(63,174,138,.18)', name: 'media móvil ± 2 desv. móviles', hoverinfo: 'skip' },
        { x: t, y: mm, mode: 'lines', line: { color: PAL.rosa, width: 3 }, name: `media móvil (m = ${m})` }
      ], { height: 350, title: { text: 'Media y desviación estándar móviles' }, xaxis: { title: { text: 't' } } });
      const vm = mm.filter(v => v !== null), vs = sd.filter(v => v !== null), q = Math.max(1, Math.floor(vm.length / 8));
      const m1 = TS.media(vm.slice(0, q)), m2 = TS.media(vm.slice(-q)), s1 = TS.media(vs.slice(0, q)), s2 = TS.media(vs.slice(-q));
      const cM = Math.abs(m2 - m1) > 0.6 * TS.media(vs), cS = s2 / s1 > 1.5 || s1 / s2 > 1.5;
      lec.className = 'w-lectura ' + (cM || cS ? 'mal' : 'ok');
      lec.innerHTML = `Media móvil: de <b>${fmt(m1, 2)}</b> al inicio a <b>${fmt(m2, 2)}</b> al final → ${cM ? '<b>cambia</b>: la media no es constante.' : 'casi constante.'} Desviación móvil: de <b>${fmt(s1, 2)}</b> a <b>${fmt(s2, 2)}</b> → ${cS ? '<b>cambia</b>: la varianza no es constante.' : 'casi constante.'}`;
      const T0 = Math.min(Math.max(po.get(), m), x.length), ven = x.slice(T0 - m, T0), mv = TS.media(ven), sv = TS.desv(ven, 1);
      window.Plotly.relayout(g, { shapes: [{ type: 'rect', x0: T0 - m + 0.5, x1: T0 + 0.5, yref: 'paper', y0: 0, y1: 1, fillcolor: 'rgba(248,225,156,.35)', line: { width: 0 } }] });
      tx.innerHTML = `<p style="font-size:.88rem;margin:4px">Ventana sombreada en amarillo: t = ${T0 - m + 1} a ${T0} (${m} datos). Su media es <b>${fmt(mv, 2)}</b> (punto rosa en t = ${T0}) y su desviación <b>${fmt(sv, 2)}</b>.</p>` +
        tablaHTML(['t'].concat(TS.rango(Math.min(m, 12), T0 - Math.min(m, 12) + 1).map(String)), [['y(t)'].concat(ven.slice(-Math.min(m, 12)).map(v => fmt(v, 2)))]) + (m > 12 ? '<p style="font-size:.8rem;margin:4px">(se muestran los últimos 12 datos de la ventana)</p>' : '');
    }
    dibujar();
  };

  // 3.1 Constructor de componentes
  W.constructor = c => {
    const ctr = lienzo(c);
    let semilla = 41;
    const modelo = segmentado(ctr, { etiqueta: 'Modelo', valor: 'ad', opciones: [['ad', 'Aditivo'], ['mu', 'Multiplicativo']] }, () => { etiquetar(); dibujar(); });
    const per = segmentado(ctr, { etiqueta: 'Periodo estacional', valor: 12, opciones: [[4, '4'], [12, '12']] }, dibujar);
    const niv = slider(ctr, { etiqueta: 'Nivel inicial', min: 10, max: 100, paso: 1, valor: 50 }, dibujar);
    const pen = slider(ctr, { etiqueta: 'Pendiente', min: -0.3, max: 1.5, paso: 0.05, valor: 0.4, fmt: v => v.toFixed(2) }, dibujar);
    const est = slider(ctr, { etiqueta: 'Amplitud estacional', min: 0, max: 20, paso: 0.5, valor: 8 }, dibujar);
    const cic = slider(ctr, { etiqueta: 'Amplitud del ciclo', min: 0, max: 15, paso: 0.5, valor: 0 }, dibujar);
    const dur = slider(ctr, { etiqueta: 'Duración del ciclo', min: 24, max: 120, paso: 6, valor: 60, fmt: v => v + ' periodos' }, dibujar);
    const rui = slider(ctr, { etiqueta: 'Ruido σ', min: 0, max: 10, paso: 0.5, valor: 2 }, dibujar);
    const sal = slider(ctr, { etiqueta: 'Ruptura (salto a la mitad)', min: -30, max: 30, paso: 1, valor: 0 }, dibujar);
    boton(ctr, 'Nuevo ruido', () => { semilla++; dibujar(); }, 'sec');
    const g1 = lamina(c), g2 = lamina(c), lec = lectura(c);
    function etiquetar() {
      const mu = modelo.get() === 'mu';
      est.etiqueta(mu ? 'Amplitud estacional (%)' : 'Amplitud estacional');
      cic.etiqueta(mu ? 'Amplitud del ciclo (%)' : 'Amplitud del ciclo');
      rui.etiqueta(mu ? 'Ruido σ (%)' : 'Ruido σ');
    }
    function dibujar() {
      const n = 144, t = TS.rango(n, 1), mu = modelo.get() === 'mu', s = Number(per.get()), e = TS.rng(semilla).normales(n);
      const T = t.map(i => niv.get() + pen.get() * i + (i > n / 2 ? sal.get() : 0));
      const S = t.map(i => est.get() * Math.sin(2 * Math.PI * i / s));
      const C = t.map(i => cic.get() * Math.sin(2 * Math.PI * i / dur.get()));
      const E = e.map(v => rui.get() * v);
      const y = t.map((_, i) => mu ? T[i] * (1 + S[i] / 100) * (1 + C[i] / 100) * (1 + E[i] / 100) : T[i] + S[i] + C[i] + E[i]);
      graf(g1, [{ x: t, y, mode: 'lines', line: { color: PAL.lav, width: 2 }, name: 'y' }], { height: 280, title: { text: mu ? 'Serie final: y = T × S × C × ε' : 'Serie final: y = T + S + C + ε' }, showlegend: false, xaxis: { title: { text: 't' } } });
      const { tr, L } = apilado([
        { x: t, y: T, nombre: 'Tendencia', color: PAL.rosa },
        { x: t, y: S, nombre: mu ? 'Estacional %' : 'Estacional', color: PAL.cel },
        { x: t, y: C, nombre: mu ? 'Ciclo %' : 'Ciclo', color: PAL.menta },
        { x: t, y: E, nombre: mu ? 'Ruido %' : 'Ruido', color: PAL.dur }
      ], 380, { title: { text: 'Componentes por separado' }, margin: { t: 36 } });
      graf(g2, tr, L);
      const rango = a => Math.max(...a) - Math.min(...a);
      const r1 = rango(y.slice(0, s)), r2 = rango(y.slice(-s));
      lec.innerHTML = `Rango (máximo − mínimo) del primer ciclo estacional: <b>${fmt(r1, 1)}</b>; del último: <b>${fmt(r2, 1)}</b>. ` +
        (mu && pen.get() > 0.2 && est.get() > 0 ? 'En el modelo multiplicativo la estacionalidad <b>crece con el nivel</b>.' : !mu && est.get() > 0 ? 'En el modelo aditivo la amplitud estacional se mantiene (salvo por el ruido).' : '');
    }
    etiquetar(); dibujar();
  };

  // 3.5 Escala original vs logarítmica
  W.logaritmo = c => {
    const ctr = lienzo(c);
    const esc = segmentado(ctr, { etiqueta: 'Escala', valor: 'orig', opciones: [['orig', 'Original'], ['log', 'Logaritmo']] }, dibujar);
    const f = fila(c), g1 = lamina(f), g2 = lamina(f), lec = lectura(c), ex = extra(c, 'Vista extra: de dónde sale cada barra'), tx = el('div', { class: 'w-tabla' });
    ex.append(tx);
    const fechas = TS.datos.fechasMensuales(1949, 144);
    function dibujar() {
      const lg = esc.get() === 'log', x = TS.datos.airpassengers.map(v => lg ? Math.log(v) : v);
      graf(g1, [{ x: fechas, y: x, mode: 'lines', line: { color: lg ? PAL.menta : PAL.lav, width: 2 } }], { height: 300, title: { text: lg ? 'ln(pasajeros)' : 'Pasajeros' }, showlegend: false });
      const rangos = TS.rango(12).map(a => { const b = x.slice(12 * a, 12 * a + 12); return Math.max(...b) - Math.min(...b); });
      graf(g2, [{ type: 'bar', x: TS.rango(12, 1949).map(String), y: rangos, marker: { color: lg ? PAL.menta : PAL.dur }, hovertemplate: '%{x}: %{y:.3f}<extra></extra>' }], { height: 300, title: { text: 'Rango de cada año (máx − mín)' }, showlegend: false, yaxis: { rangemode: 'tozero' } });
      lec.className = 'w-lectura ' + (lg ? 'ok' : 'mal');
      lec.innerHTML = `El rango de 1960 es <b>${fmt(rangos[11] / rangos[0], 2)}</b> veces el de 1949` + (lg ? ': casi igual. En logaritmos la amplitud es <b>estable</b>.' : ': la amplitud <b>crece</b> con el nivel (modelo multiplicativo).');
      tx.innerHTML = tablaHTML(['Año', 'Mes máximo', 'Mes mínimo', 'Rango'], TS.rango(12).map(a => { const b2 = x.slice(12 * a, 12 * a + 12), mx = Math.max(...b2), mn = Math.min(...b2); return [1949 + a, `${MESES[b2.indexOf(mx)]}: ${fmt(mx, lg ? 3 : 0)}`, `${MESES[b2.indexOf(mn)]}: ${fmt(mn, lg ? 3 : 0)}`, fmt(mx - mn, lg ? 3 : 0)]; }));
    }
    dibujar();
  };

  // 3.7 Media móvil centrada
  W.mediamovil = c => {
    const ctr = lienzo(c);
    let semilla = 51;
    const v = segmentado(ctr, { etiqueta: 'Ventana', valor: 4, opciones: [[3, '3'], [4, '4 (2×4)'], [5, '5'], [8, '8 (2×8)']] }, dibujar);
    boton(ctr, 'Nuevo ruido', () => { semilla++; dibujar(); }, 'sec');
    const po = slider(ctr, { etiqueta: 'Calcular la media en t', min: 5, max: 36, paso: 1, valor: 12 }, dibujar);
    const g1 = lamina(c), g2 = lamina(c, 'min-height:200px'), lec = lectura(c), ex = extra(c, 'Vista extra: la cuenta de la media móvil en un punto'), tx = el('div', { class: 'w-tabla' });
    ex.append(tx);
    function dibujar() {
      const n = 40, t = TS.rango(n, 1), P = [8, -3, -10, 5], e = TS.rng(semilla).normales(n, 1.5);
      const T = t.map(i => 50 + 0.8 * i), y = t.map((i, j) => T[j] + P[(i - 1) % 4] + e[j]);
      const m = Number(v.get()), mm = TS.mediaMovilCentrada(y, m), w = TS.pesosMM(m), h = Math.floor(w.length / 2);
      graf(g1, [
        { x: t, y, mode: 'lines+markers', line: { color: 'rgba(124,105,214,.6)', width: 1.4 }, marker: { size: 5 }, name: 'serie trimestral' },
        { x: t, y: T, mode: 'lines', line: { color: PAL.menta, width: 2, dash: 'dash' }, name: 'tendencia verdadera' },
        { x: t, y: mm, mode: 'lines', line: { color: PAL.rosa, width: 3 }, name: `media móvil centrada (${m})` }
      ], { height: 330, title: { text: 'Estimar la tendencia con una media móvil centrada' }, xaxis: { title: { text: 't (trimestres)' } } });
      graf(g2, [{ type: 'bar', x: TS.rango(w.length, -h).map(j => j === 0 ? 't' : j > 0 ? 't+' + j : 't' + j), y: w, marker: { color: PAL.cel }, text: w.map(fracc), textposition: 'outside', hoverinfo: 'skip' }],
        { height: 200, title: { text: 'Pesos de la ventana (suman 1)' }, yaxis: { range: [0, Math.max(...w) * 1.4] }, showlegend: false, margin: { t: 34, b: 30 } });
      const err = mm.map((x, j) => x === null ? null : x - T[j]).filter(x => x !== null), rms = Math.sqrt(TS.media(err.map(x => x * x)));
      const completo = m % 4 === 0;
      lec.className = 'w-lectura ' + (completo ? 'ok' : 'mal');
      lec.innerHTML = (completo
        ? `La ventana de ${m} abarca ${m === 4 ? 'un periodo completo' : 'dos periodos completos'}: dentro de ella el patrón estacional suma 0 y desaparece.`
        : `La ventana de ${m} no abarca periodos completos: la «tendencia» conserva ondas del patrón estacional.`) +
        ` Distancia típica a la tendencia verdadera: <b>${fmt(rms, 2)}</b>.`;
      const T0 = Math.min(Math.max(po.get(), h + 1), n - h), idx = TS.rango(w.length, T0 - h);
      window.Plotly.addTraces(g1, [{ x: idx, y: idx.map(i => y[i - 1]), mode: 'markers', marker: { size: 13, color: 'rgba(248,225,156,.9)', line: { color: PAL.mant, width: 2 } }, name: `datos usados en t = ${T0}` }, { x: [T0], y: [mm[T0 - 1]], mode: 'markers', marker: { size: 13, color: PAL.rosa, symbol: 'diamond' }, name: `media en t = ${T0}` }]);
      const filasM = idx.map((i, j) => [i === T0 ? 't' : (i > T0 ? 't+' + (i - T0) : 't' + (i - T0)), i, fmt(y[i - 1], 2), fracc(w[j]), fmt(w[j] * y[i - 1], 3)]);
      filasM.push(['', '', '', '<b>Suma</b>', `<b>${fmt(mm[T0 - 1], 3)}</b>`]);
      tx.innerHTML = tablaHTML(['posición', 't', 'y(t)', 'peso', 'peso × y'], filasM, filasM.map((_, i) => i === filasM.length - 1 ? 'suma' : '')) + `<p style="font-size:.88rem;margin:6px 4px">Los puntos amarillos de la gráfica son los datos usados; el rombo rosa es el resultado. La media móvil es la suma de la última columna.</p>`;
    }
    dibujar();
  };

  // 3.8 Descomposición clásica de AirPassengers
  W.descomposicion = c => {
    const ctr = lienzo(c);
    const mod = segmentado(ctr, { etiqueta: 'Modelo', valor: 'multiplicativo', opciones: [['aditivo', 'Aditivo'], ['multiplicativo', 'Multiplicativo']] }, dibujar);
    const g = lamina(c), tabla = el('div', { class: 'w-tabla' }), lec = el('div', { class: 'w-lectura' });
    c.append(tabla, lec);
    const ex = extra(c, 'Vista extra: de dónde sale el índice de un mes'), cx = el('div', { class: 'w-controles' });
    ex.append(cx);
    const mes = seleccion(cx, { etiqueta: 'Mes', valor: '6', opciones: MESES.map((m, i) => [String(i), m]) }, dibujar);
    const fx = fila(ex), gx = lamina(fx), tx = el('div', { class: 'w-tabla' });
    fx.append(tx);
    const x = TS.datos.airpassengers, fechas = TS.datos.fechasMensuales(1949, 144);
    function dibujar() {
      const mu = mod.get() === 'multiplicativo', d = TS.descomponer(x, 12, mod.get());
      const { tr, L } = apilado([
        { x: fechas, y: x, nombre: 'Observada', color: PAL.lav },
        { x: fechas, y: d.T, nombre: 'Tendencia', color: PAL.rosa },
        { x: fechas, y: d.S, nombre: mu ? 'Factor estac.' : 'Estacional', color: PAL.cel },
        { x: fechas, y: d.R, nombre: 'Residuo', color: PAL.dur, modo: 'lines+markers' }
      ], 520, { title: { text: `Descomposición ${mu ? 'multiplicativa' : 'aditiva'} (periodo 12)` }, margin: { t: 36 } });
      L.shapes = [{ type: 'line', xref: 'paper', x0: 0, x1: 1, yref: 'y4', y0: mu ? 1 : 0, y1: mu ? 1 : 0, line: { color: PAL.gris, width: 1, dash: 'dot' } }];
      graf(g, tr, L);
      const idx = d.indices;
      tabla.innerHTML = `<table><thead><tr><th>Mes</th>${MESES.map(m => `<th>${m}</th>`).join('')}</tr></thead><tbody><tr><td>${mu ? 'Factor' : 'Índice'}</td>${idx.map(v => `<td>${mu ? v.toFixed(3) : (v > 0 ? '+' : '') + v.toFixed(1)}</td>`).join('')}</tr>` +
        (mu ? `<tr><td>%</td>${idx.map(v => `<td>${(v > 1 ? '+' : '') + ((v - 1) * 100).toFixed(1)}%</td>`).join('')}</tr>` : '') + '</tbody></table>';
      const R = d.R.filter(v => v !== null), q = 48, a = TS.desv(R.slice(0, q)), b = TS.desv(R.slice(-q));
      lec.className = 'w-lectura ' + (mu ? 'ok' : 'mal');
      lec.innerHTML = `Dispersión del residuo en los primeros 4 años: <b>${fmt(a, mu ? 4 : 2)}</b>; en los últimos 4: <b>${fmt(b, mu ? 4 : 2)}</b>. ` +
        (mu ? 'Con el modelo multiplicativo el residuo es un factor alrededor de 1 y su dispersión es parecida en toda la muestra: <b>modelo adecuado</b>.' : 'Con el aditivo el residuo forma un <b>embudo</b>: pequeño al inicio y grande al final, porque el patrón estacional real crece con el nivel.');
      const mi = Number(mes.get()), anios = [], vals = [];
      for (let a = 0; a < 12; a++) { const v = d.sinTendencia[12 * a + mi]; if (v !== null) { anios.push(String(1949 + a)); vals.push(v); } }
      const pr = TS.media(vals), base = mu ? 1 : 0;
      graf(gx, [{ type: 'bar', x: anios, y: vals.map(v => v - base), base: base, marker: { color: PAL.cel }, hovertemplate: '%{x}: %{y:.3f}<extra></extra>', name: mu ? 'y / T' : 'y − T' },
        { x: anios, y: anios.map(() => pr), mode: 'lines', line: { color: PAL.rosa, width: 3 }, name: 'promedio' }],
        { height: 260, title: { text: `${MESES[mi]}: ${mu ? 'y(t) / tendencia' : 'y(t) − tendencia'} en cada año` }, showlegend: false });
      tx.innerHTML = tablaHTML(['Año', mu ? 'y / T' : 'y − T'], anios.map((a, i) => [a, fmt(vals[i], mu ? 4 : 2)]).concat([['<b>Promedio</b>', `<b>${fmt(pr, mu ? 4 : 2)}</b>`], ['<b>Índice centrado</b>', `<b>${fmt(d.indices[mi], mu ? 4 : 2)}</b>`]])) +
        `<p style="font-size:.85rem;margin:6px 4px">Se promedian los ${vals.length} años con tendencia disponible y después se centra (${mu ? 'se divide entre el promedio de los 12 meses' : 'se resta el promedio de los 12 meses'}).</p>`;
    }
    dibujar();
  };

  // 4.5 Calculadora de autocorrelación
  W.calculadora = c => {
    const ctr = lienzo(c);
    const entrada = el('input', { type: 'text', value: '2, 4, 6, 5, 3, 4', 'aria-label': 'Datos de la serie', spellcheck: 'false' });
    const cd = control('Tus datos (separados por comas)', entrada);
    cd.style.flex = '3 1 260px';
    ctr.append(cd);
    const k = slider(ctr, { etiqueta: 'Rezago k', min: 0, max: 4, paso: 1, valor: 1 }, dibujar);
    const kpis = el('div', { class: 'w-kpis' }), tabla = el('div', { class: 'w-tabla' }), formulas = el('div', { class: 'w-lectura' });
    c.append(kpis, tabla, formulas);
    const g = lamina(c);
    entrada.addEventListener('input', dibujar);
    function dibujar() {
      const y = entrada.value.split(/[,;\s]+/).filter(s => s !== '').map(Number);
      if (y.length < 3 || y.some(v => !isFinite(v))) {
        formulas.className = 'w-lectura aviso';
        formulas.innerHTML = 'Escribe al menos 3 números (usa punto decimal), por ejemplo: <code>2, 4, 6, 5, 3, 4</code>';
        tabla.innerHTML = kpis.innerHTML = '';
        return;
      }
      if (y.length > 120) y.length = 120;
      const n = y.length;
      k.input.max = n - 2;
      if (k.get() > n - 2) k.set(n - 2);
      const kk = k.get(), m = TS.media(y), d = y.map(v => v - m), g0 = TS.suma(d.map(v => v * v)) / n;
      let filas = '', suma = 0;
      for (let t = 1; t <= n; t++) {
        const hay = t > kk, dk = hay ? d[t - 1 - kk] : null, p = hay ? d[t - 1] * dk : null;
        if (hay) suma += p;
        filas += `<tr><td>${t}</td><td>${num(y[t - 1])}</td><td>${num(d[t - 1])}</td><td>${hay ? num(dk) : '—'}</td><td class="${hay ? 'resalta' : ''}">${hay ? num(p) : '—'}</td></tr>`;
      }
      tabla.innerHTML = `<table><thead><tr><th>t</th><th>y<sub>t</sub></th><th>d<sub>t</sub> = y<sub>t</sub> − ȳ</th><th>d<sub>t−${kk}</sub></th><th>d<sub>t</sub> × d<sub>t−${kk}</sub></th></tr></thead><tbody>${filas}<tr class="suma"><td colspan="4">Suma de productos (${n - kk} parejas)</td><td>${num(suma)}</td></tr></tbody></table>`;
      const gk = suma / n, rk = gk / g0;
      kpis.innerHTML = kpi('n (datos)', n) + kpi('media ȳ', num(m)) + kpi('γ̂(0) = varianza', num(g0)) + kpi(`ρ̂(${kk})`, num(rk));
      formulas.className = 'w-lectura';
      formulas.innerHTML = tex(`\\hat{\\gamma}(${kk}) = \\frac{1}{n}\\sum_{t=${kk + 1}}^{${n}} d_t\\,d_{t-${kk}} = \\frac{${num(suma)}}{${n}} = ${num(gk)}`, true) +
        tex(`\\hat{\\rho}(${kk}) = \\frac{\\hat{\\gamma}(${kk})}{\\hat{\\gamma}(0)} = \\frac{${num(gk)}}{${num(g0)}} = ${num(rk)}`, true);
      const K = Math.min(n - 1, 20);
      graf(g, trazasACF(TS.acf(y, K), n, { resaltar: kk || null }), layoutACF('ACF de tus datos (rosa = rezago elegido)'));
      const exc = c.querySelector('.w-extra') || extra(c, 'Vista extra: cada producto de la tabla es un punto');
      let gx = exc.querySelector('.w-graf');
      if (!gx) { gx = lamina(exc); }
      const ks = TS.rango(n - kk, kk + 1), xs = ks.map(t1 => d[t1 - 1 - kk]), ys = ks.map(t1 => d[t1 - 1]);
      graf(gx, [Object.assign(dispersion(xs, ys, ys.map((v, i) => v * xs[i] >= 0 ? 'rgba(63,174,138,.75)' : 'rgba(224,112,159,.75)'), ks.map(t1 => 't = ' + t1)), { mode: 'markers+text', textposition: 'top center', textfont: { size: 10 } })], {
        height: 280, title: { text: `d(t−${kk}) contra d(t): verde = producto positivo, rosa = negativo` }, showlegend: false, xaxis: { title: { text: `d(t−${kk})` }, zeroline: true, zerolinecolor: '#c9c3e3' }, yaxis: { title: { text: 'd(t)' }, zeroline: true, zerolinecolor: '#c9c3e3' } });
    }
    dibujar();
  };

  // 5.5 Ruido blanco
  W.ruido = c => {
    const ctr = lienzo(c);
    let semilla = 61;
    const sg = slider(ctr, { etiqueta: 'σ (desviación del ruido)', min: 0.2, max: 3, paso: 0.1, valor: 1, fmt: v => v.toFixed(1) }, dibujar);
    const nn = slider(ctr, { etiqueta: 'n', min: 50, max: 500, paso: 10, valor: 200 }, dibujar);
    boton(ctr, 'Nueva muestra', () => { semilla++; dibujar(); }, 'sec');
    const g1 = lamina(c), f = fila(c), g2 = lamina(f), g3 = lamina(f), lec = lectura(c);
    function dibujar() {
      const s = sg.get(), n = nn.get(), x = TS.sim.ruido(n, { sigma: s, semilla }), t = TS.rango(n, 1);
      graf(g1, [
        { x: t, y: x, mode: 'lines', line: { color: PAL.lav, width: 1.3 }, name: 'ε(t)' },
        { x: [1, n], y: [2 * s, 2 * s], mode: 'lines', line: { color: PAL.menta, dash: 'dash' }, name: '±2σ' },
        { x: [1, n], y: [-2 * s, -2 * s], mode: 'lines', line: { color: PAL.menta, dash: 'dash' }, showlegend: false }
      ], { height: 250, title: { text: 'Serie de ruido blanco' }, yaxis: { range: [-4 * s, 4 * s] } });
      const xs = TS.rango(81).map(i => -4 * s + i * s / 10);
      graf(g2, [
        { type: 'histogram', x, histnorm: 'probability density', nbinsx: 30, marker: { color: 'rgba(201,188,247,.8)', line: { color: '#fff', width: 1 } }, name: 'datos' },
        { x: xs, y: xs.map(v => Math.exp(-v * v / (2 * s * s)) / (s * Math.sqrt(2 * Math.PI))), mode: 'lines', line: { color: PAL.rosa, width: 2.5 }, name: 'normal N(0, σ²)' }
      ], { height: 260, title: { text: 'Histograma' }, showlegend: false, bargap: 0.02 });
      const r = TS.acf(x, 20), fuera = r.slice(1).filter(v => Math.abs(v) > 1.96 / Math.sqrt(n)).length;
      graf(g3, trazasACF(r, n), layoutACF('ACF'));
      lec.innerHTML = `Media muestral <b>${fmt(TS.media(x))}</b> (teoría 0) · varianza muestral <b>${fmt(TS.varianza(x))}</b> (teoría σ² = ${fmt(s * s, 2)}) · barras fuera de la banda: <b>${fuera} de 20</b> (se espera alrededor de 1 por azar).`;
    }
    dibujar();
  };

  // 5.7 AR(1)
  W.ar1 = c => {
    const ctr = lienzo(c);
    let semilla = 71;
    const ph = slider(ctr, { etiqueta: 'φ', min: -0.95, max: 1.02, paso: 0.01, valor: 0.6, fmt: v => v.toFixed(2) }, dibujar);
    const cc = slider(ctr, { etiqueta: 'c (constante)', min: -2, max: 4, paso: 0.5, valor: 2, fmt: v => v.toFixed(1) }, dibujar);
    const sg = slider(ctr, { etiqueta: 'σ (choques)', min: 0.5, max: 3, paso: 0.1, valor: 2, fmt: v => v.toFixed(1) }, dibujar);
    boton(ctr, 'Nueva muestra', () => { semilla++; dibujar(); }, 'sec');
    const f = fila(c), g1 = lamina(f), g2 = lamina(f), lec = lectura(c), ex = extra(c, 'Vista extra: la regla del AR(1) y la comparación teoría vs. muestra'), fx = fila(ex), gx = lamina(fx), tx = el('div', { class: 'w-tabla' });
    fx.append(tx);
    function dibujar() {
      const phi = ph.get(), cst = cc.get(), s = sg.get(), n = 300, t = TS.rango(n, 1);
      const x = TS.sim.ar1(n, phi, { c: cst, sigma: s, semilla }), est = Math.abs(phi) < 1;
      const tr = [{ x: t, y: x, mode: 'lines', line: { color: PAL.lav, width: 1.3 }, name: 'y(t)' }];
      let mu = null, g0 = null;
      if (est) {
        mu = cst / (1 - phi); g0 = s * s / (1 - phi * phi);
        const d = 2 * Math.sqrt(g0);
        tr.unshift({ x: [1, n], y: [mu + d, mu + d], mode: 'lines', line: { width: 0 }, hoverinfo: 'skip', showlegend: false },
          { x: [1, n], y: [mu - d, mu - d], mode: 'lines', line: { width: 0 }, fill: 'tonexty', fillcolor: 'rgba(63,174,138,.15)', name: 'μ ± 2σ_y teórica', hoverinfo: 'skip' });
        tr.push({ x: [1, n], y: [mu, mu], mode: 'lines', line: { color: PAL.menta, width: 2, dash: 'dash' }, name: 'μ = c/(1−φ)' });
      }
      graf(g1, tr, { height: 300, title: { text: `AR(1) con φ = ${phi.toFixed(2)}` }, xaxis: { title: { text: 't' } } });
      const r = TS.acf(x, 20), K = TS.rango(20, 1);
      const tacf = trazasACF(r, n, { nombre: 'ACF muestral' });
      if (est) tacf.push({ x: K, y: K.map(k => Math.pow(phi, k)), mode: 'lines+markers', line: { color: PAL.rosa, width: 2 }, marker: { size: 6, symbol: 'diamond' }, name: 'teórica φ^k' });
      graf(g2, tacf, layoutACF('ACF: muestral (barras) vs teórica φ^k', { showlegend: true, height: 300 }));
      if (est) {
        const h = phi > 0 ? Math.log(0.5) / Math.log(phi) : null;
        lec.className = 'w-lectura ok';
        lec.innerHTML = tex(`\\tip{mu}{\\mu} = \\frac{c}{1-\\phi} = \\frac{${num(cst)}}{1-(${num(phi)})} = ${num(mu)} \\qquad \\gamma(0) = \\frac{\\sigma^2}{1-\\phi^2} = \\frac{${num(s * s)}}{1-${num(phi * phi)}} = ${num(g0)}`, true) +
          tex(`\\rho(1) = ${num(phi)},\\quad \\rho(2) = ${num(phi * phi)},\\quad \\rho(3) = ${num(phi ** 3)}`, true) +
          (h ? `Un choque tarda <b>${fmt(h, 1)}</b> periodos en reducirse a la mitad.` : 'Con φ ≤ 0 la serie alterna (φ < 0) o no tiene memoria (φ = 0).') +
          ` Media muestral: ${fmt(TS.media(x), 2)} · varianza muestral: ${fmt(TS.varianza(x), 2)}.`;
      } else {
        lec.className = 'w-lectura mal';
        lec.innerHTML = phi === 1
          ? 'Con φ = 1 la fórmula de la media pide dividir entre 1 − φ = 0 y la de la varianza entre 1 − φ² = 0: <b>no existen</b>. Es una <b>raíz unitaria</b>: los choques se acumulan y la serie no regresa a ningún nivel. ' + ref('raiz-unitaria', 'raíz unitaria')
          : 'Con φ > 1 el proceso es <b>explosivo</b>: cada choque se amplifica y la serie crece sin límite.';
      }
      const xs = x.slice(0, -1), ys2 = x.slice(1), lo = Math.min(...xs), hi = Math.max(...xs);
      graf(gx, [dispersion(xs, ys2), { x: [lo, hi], y: [cst + phi * lo, cst + phi * hi], mode: 'lines', line: { color: PAL.rosa, width: 3 }, name: 'c + φ·y(t−1)' }],
        { height: 300, title: { text: 'y(t−1) contra y(t): la recta es la parte predecible' }, showlegend: false, xaxis: { title: { text: 'y(t−1)' } }, yaxis: { title: { text: 'y(t)' } } });
      const rr = TS.acf(x, 3);
      tx.innerHTML = tablaHTML(['Cantidad', 'Teórica', 'Muestral'], [['μ', est ? fmt(mu, 3) : '—', fmt(TS.media(x), 3)], ['γ(0)', est ? fmt(g0, 3) : '—', fmt(TS.varianza(x), 3)], ['ρ(1)', est ? fmt(phi, 3) : '—', fmt(rr[1], 3)], ['ρ(2)', est ? fmt(phi * phi, 3) : '—', fmt(rr[2], 3)], ['ρ(3)', est ? fmt(phi ** 3, 3) : '—', fmt(rr[3], 3)]]) +
        '<p style="font-size:.85rem;margin:6px 4px">La distancia vertical de cada punto a la recta es el choque ε(t). La pendiente de la recta es φ.</p>';
    }
    dibujar();
  };

  // 5.8 Abanico de trayectorias
  W.abanico = c => {
    const ctr = lienzo(c);
    let semilla = 81;
    const pr = segmentado(ctr, { etiqueta: 'Proceso', valor: 'paseo', opciones: [['paseo', 'Paseo aleatorio'], ['ar', 'AR(1) con φ = 0.5']] }, dibujar);
    boton(ctr, 'Nuevas trayectorias', () => { semilla += 300; dibujar(); }, 'sec');
    const g = lamina(c), lec = lectura(c), ex = extra(c, 'Vista extra: la distribución de y(t) en dos instantes'), gx = lamina(ex);
    function dibujar() {
      const n = 100, M = 200, t = TS.rango(n, 1), xs = [], ys = [], s1 = new Array(n).fill(0), s2 = new Array(n).fill(0), paseo = pr.get() === 'paseo';
      for (let j = 0; j < M; j++) {
        const y = paseo ? TS.sim.paseo(n, { semilla: semilla + j }) : TS.sim.ar1(n, 0.5, { semilla: semilla + j });
        y.forEach((v, i) => { xs.push(i + 1); ys.push(v); s1[i] += v; s2[i] += v * v; });
        xs.push(null); ys.push(null);
      }
      const sd = s1.map((v, i) => Math.sqrt(s2[i] / M - (v / M) ** 2));
      const teo = paseo ? t.map(i => 2 * Math.sqrt(i)) : t.map(() => 2 / Math.sqrt(1 - 0.25));
      graf(g, [
        { x: xs, y: ys, mode: 'lines', line: { color: 'rgba(124,105,214,.13)', width: 1 }, hoverinfo: 'skip', name: `${M} trayectorias` },
        { x: t, y: teo, mode: 'lines', line: { color: PAL.rosa, width: 3 }, name: paseo ? '±2σ√t (teoría)' : '±2σ/√(1−φ²) (teoría)' },
        { x: t, y: teo.map(v => -v), mode: 'lines', line: { color: PAL.rosa, width: 3 }, showlegend: false }
      ], { height: 380, title: { text: paseo ? 'Paseo aleatorio: la nube se abre como abanico' : 'AR(1) estacionario: la nube se queda en una franja' }, xaxis: { title: { text: 't' } }, yaxis: { range: [-30, 30] } });
      lec.innerHTML = `Desviación entre trayectorias en t = 10: <b>${fmt(sd[9], 2)}</b> · en t = 100: <b>${fmt(sd[99], 2)}</b> (teoría: ${paseo ? '√10 = 3.16 y √100 = 10' : '1.15 en ambos casos'}). ` + (paseo ? 'La varianza crece con t: no es estacionario.' : 'La varianza no depende de t: estacionario.');
      const en = i => TS.rango(M).map(j => ys[j * (n + 1) + i]);
      graf(gx, [{ type: 'histogram', x: en(9), name: 't = 10', opacity: 0.65, marker: { color: PAL.cel }, nbinsx: 30 }, { type: 'histogram', x: en(99), name: 't = 100', opacity: 0.55, marker: { color: PAL.rosa }, nbinsx: 30 }],
        { height: 280, barmode: 'overlay', title: { text: 'Valores de las 200 trayectorias en t = 10 (azul) y t = 100 (rosa)' }, bargap: 0.03 });
    }
    dibujar();
  };

  // 5.9 Respuesta al impulso y raíz
  W.choque = c => {
    const ctr = lienzo(c);
    const ph = slider(ctr, { etiqueta: 'φ', min: 0, max: 1.05, paso: 0.01, valor: 0.9, fmt: v => v.toFixed(2) }, dibujar);
    const tm = slider(ctr, { etiqueta: 'Tamaño del choque', min: 1, max: 20, paso: 1, valor: 10 }, dibujar);
    const f = fila(c), g1 = lamina(f), g2 = lamina(f), lec = lectura(c), ex = extra(c, 'Vista extra: la respuesta al choque en números'), tx = el('div', { class: 'w-tabla' });
    ex.append(tx);
    const circ = TS.rango(121).map(i => 2 * Math.PI * i / 120);
    function dibujar() {
      const phi = ph.get(), s = tm.get(), h = TS.rango(31);
      graf(g1, [
        { x: h, y: h.map(k => s * Math.pow(0.5, k)), mode: 'lines+markers', line: { color: PAL.cel, width: 1.5 }, marker: { size: 4 }, name: 'φ = 0.5' },
        { x: h, y: h.map(() => s), mode: 'lines', line: { color: PAL.gris, width: 2, dash: 'dash' }, name: 'φ = 1 (raíz unitaria)' },
        { x: h, y: h.map(k => s * Math.pow(phi, k)), mode: 'lines+markers', line: { color: PAL.rosa, width: 3 }, marker: { size: 5 }, name: `φ = ${phi.toFixed(2)}` }
      ], { height: 320, title: { text: 'Efecto del choque en los periodos siguientes' }, xaxis: { title: { text: 'periodos después del choque' } }, yaxis: { rangemode: 'tozero' } });
      const z = phi === 0 ? Infinity : 1 / phi, zv = Math.min(z, 2.6);
      graf(g2, [
        { x: circ.map(Math.cos), y: circ.map(Math.sin), mode: 'lines', line: { color: PAL.lav, width: 2 }, name: 'círculo unitario', hoverinfo: 'skip' },
        { x: [zv], y: [0], mode: 'markers+text', marker: { size: 14, color: Math.abs(z) > 1.0001 ? PAL.menta : z > 0.9999 ? PAL.mant : PAL.rosa, line: { color: '#fff', width: 2 } }, text: [isFinite(z) && z <= 2.6 ? 'z = ' + z.toFixed(2) : 'z → ∞'], textposition: 'top center', name: 'raíz' }
      ], { height: 320, title: { text: 'Raíz z = 1/φ y círculo unitario' }, showlegend: false, xaxis: { range: [-2.8, 2.8], zeroline: true, zerolinecolor: '#ddd8ee', title: { text: 'parte real' } }, yaxis: { range: [-1.6, 1.6], scaleanchor: 'x', zeroline: true, zerolinecolor: '#ddd8ee', title: { text: 'imaginaria' } } });
      const vida = phi > 0 && phi < 1 ? Math.log(0.5) / Math.log(phi) : null;
      if (phi < 1) {
        lec.className = 'w-lectura ok';
        lec.innerHTML = `Raíz: z = 1/φ = <b>${isFinite(z) ? fmt(z, 3) : '∞'}</b> → |z| > 1, <b>fuera</b> del círculo: estacionario. ` + (vida ? `El choque se reduce a la mitad en <b>${fmt(vida, 1)}</b> periodos; después de 10 periodos queda ${fmt(s * phi ** 10, 2)} de ${s}.` : 'Con φ = 0 el choque desaparece al periodo siguiente.');
      } else if (phi === 1) {
        lec.className = 'w-lectura aviso';
        lec.innerHTML = 'Raíz z = <b>1</b>: está <b>sobre</b> el círculo. Es la <b>raíz unitaria</b>: el choque se queda para siempre (vida media infinita).';
      } else {
        lec.className = 'w-lectura mal';
        lec.innerHTML = `Raíz z = ${fmt(z, 3)}: <b>dentro</b> del círculo. Proceso explosivo: el choque crece en lugar de apagarse.`;
      }
      const hh = TS.rango(11);
      tx.innerHTML = tablaHTML(['h'].concat(hh.map(String)), [['efecto = tamaño·φʰ'].concat(hh.map(k => fmt(s * Math.pow(phi, k), 3))), ['% del choque que queda'].concat(hh.map(k => fmt(100 * Math.pow(phi, k), 1) + '%'))]);
    }
    dibujar();
  };

  // 5.10 Tendencia determinística vs estocástica
  W.tendencias = c => {
    const ctr = lienzo(c);
    let semilla = 91;
    const tt = segmentado(ctr, { etiqueta: 'Tratamiento', valor: 'orig', opciones: [['orig', 'Original'], ['recta', 'Restar la recta'], ['dif', 'Diferenciar']] }, dibujar);
    boton(ctr, 'Nuevos choques', () => { semilla++; dibujar(); }, 'sec');
    const g = lamina(c), lec = lectura(c), ex = extra(c, 'Vista extra: la ACF de cada resultado'), fx = fila(ex), gx1 = lamina(fx), gx2 = lamina(fx);
    function tratar(y, modo) {
      if (modo === 'recta') { const r = TS.ols(y.map((_, i) => [1, i + 1]), y); return r.resid; }
      if (modo === 'dif') return TS.diff(y);
      return y;
    }
    function dibujar() {
      const n = 150, a = 10, b = 0.3, e = TS.rng(semilla).normales(n), modo = tt.get();
      const det = e.map((v, i) => a + b * (i + 1) + v);
      const est = []; let y = a;
      e.forEach(v => { y = b + y + v; est.push(y); });
      const d1 = tratar(det, modo), d2 = tratar(est, modo), x1 = TS.rango(d1.length, 1);
      graf(g, [
        { x: x1, y: d1, mode: 'lines', line: { color: PAL.cel, width: 1.6 }, name: 'determinística', xaxis: 'x', yaxis: 'y' },
        { x: x1, y: d2, mode: 'lines', line: { color: PAL.rosa, width: 1.6 }, name: 'estocástica', xaxis: 'x2', yaxis: 'y2' }
      ], {
        height: 320, showlegend: false, title: { text: { orig: 'Las dos series originales (mismos choques)', recta: 'Después de restar una recta ajustada', dif: 'Después de diferenciar' }[modo] },
        xaxis: { domain: [0, 0.47] }, xaxis2: { domain: [0.53, 1], anchor: 'y2' }, yaxis2: { anchor: 'x2' },
        annotations: [
          { text: 'Determinística: a + bt + ε', x: 0.235, y: 1.02, xref: 'paper', yref: 'paper', showarrow: false, font: { color: PAL.cel, size: 12 } },
          { text: 'Estocástica: b + y(t−1) + ε', x: 0.765, y: 1.02, xref: 'paper', yref: 'paper', showarrow: false, font: { color: PAL.rosa, size: 12 } }
        ],
        margin: { t: 54 }
      });
      const r1 = TS.acf(d1, 1)[1], r2 = TS.acf(d2, 1)[1];
      const txt = {
        orig: ['Crece con una recta; los choques no se acumulan.', 'Crece con la deriva, pero los choques se acumulan y se aleja de la recta.'],
        recta: [`✓ Queda ruido estacionario (ρ̂(1) = ${fmt(r1)}). Tratamiento correcto.`, `✗ Queda un paseo aleatorio: deambula (ρ̂(1) = ${fmt(r2)}).`],
        dif: [`✗ Sobre-diferenciada: ρ̂(1) = ${fmt(r1)} ≈ −0.5.`, `✓ Queda ruido alrededor de b = 0.3 (ρ̂(1) = ${fmt(r2)}). Tratamiento correcto.`]
      }[modo];
      lec.innerHTML = `<b style="color:${PAL.cel}">Determinística:</b> ${txt[0]}<br><b style="color:${PAL.rosa}">Estocástica:</b> ${txt[1]}` + (modo === 'dif' ? ' ' + ref('sobre-diferenciar', 'por qué −0.5') : '');
      graf(gx1, trazasACF(TS.acf(d1, 20), d1.length, { color: PAL.cel }), layoutACF('ACF · determinística'));
      graf(gx2, trazasACF(TS.acf(d2, 20), d2.length, { color: PAL.rosa }), layoutACF('ACF · estocástica'));
    }
    dibujar();
  };

  // 5.11 Diferenciación
  W.diferencias = c => {
    const ctr = lienzo(c);
    const s = seleccion(ctr, { etiqueta: 'Serie', valor: 'deriva', opciones: [['deriva', 'Paseo con deriva'], ['cuad', 'Tendencia cuadrática'], ['est', 'Estacionalidad que se acumula (s = 12)'], ['ap', 'ln AirPassengers']] }, dibujar);
    const op = segmentado(ctr, { etiqueta: 'Transformación', valor: 'orig', opciones: [['orig', 'Original'], ['d1', 'Δ'], ['d2', 'Δ²'], ['ds', 'Δ₁₂'], ['d1ds', 'Δ Δ₁₂']] }, dibujar);
    const f = fila(c), g1 = lamina(f), g2 = lamina(f), lec = lectura(c), ex = extra(c, 'Vista extra: la resta renglón por renglón'), tx = el('div', { class: 'w-tabla' });
    ex.append(tx);
    const e = TS.rng(101).normales(240);
    const S = {
      deriva: (() => { let y = 0; return e.slice(0, 200).map(v => (y = 0.5 + y + v)); })(),
      cuad: TS.rango(200, 1).map(i => 5 + 0.02 * i + 0.004 * i * i + e[i - 1]),
      est: (() => { const y = []; for (let i = 0; i < 240; i++) y.push(i < 12 ? 20 + 6 * Math.sin(2 * Math.PI * (i + 1) / 12) + e[i] : 0.1 + y[i - 12] + e[i]); return y; })(),
      ap: TS.datos.airpassengers.map(Math.log)
    };
    const NEC = { deriva: 'd1', cuad: 'd2', est: 'ds', ap: 'd1ds' };
    const MSJ = {
      deriva: { orig: 'Raíz unitaria: la ACF decae muy lento.', d1: '✓ Una diferencia basta: queda ruido alrededor de la deriva.', d2: '✗ De más: aparece ρ̂(1) ≈ −0.5.', ds: '✗ No es la adecuada: suma 12 choques y queda muy persistente.', d1ds: '✗ De más: se diferenció también lo estacional, que no existía.' },
      cuad: { orig: 'La tendencia es una parábola.', d1: '✗ Queda una tendencia lineal (la ACF sigue decayendo lento).', d2: '✓ Dos diferencias eliminan la parábola.', ds: '✗ No es estacional: no sirve.', d1ds: '✗ Combinación innecesaria.' },
      est: { orig: 'Patrón de 12 meses que se mueve poco a poco.', d1: '✗ Queda la estacionalidad: picos en 12, 24, 36.', d2: '✗ La estacionalidad sigue ahí.', ds: '✓ La diferencia estacional deja ruido alrededor de una constante.', d1ds: '✗ De más: aparece ρ̂(1) ≈ −0.5.' },
      ap: { orig: 'Tendencia y estacionalidad.', d1: '✗ Se fue la tendencia, pero queda la estacionalidad (ρ̂(12) alto).', d2: '✗ Sigue la estacionalidad.', ds: '✗ Se fue la estacionalidad, pero queda persistencia (ρ̂(1) ≈ 0.7).', d1ds: '✓ Con una diferencia regular y una estacional queda estacionaria.' }
    };
    function transformar(x, o) {
      if (o === 'd1') return TS.diff(x);
      if (o === 'd2') return TS.diff(TS.diff(x));
      if (o === 'ds') return TS.diff(x, 12);
      if (o === 'd1ds') return TS.diff(TS.diff(x, 12));
      return x;
    }
    function dibujar() {
      const nom = s.get(), o = op.get(), x = transformar(S[nom], o), n = x.length, r = TS.acf(x, 36);
      graf(g1, [{ x: TS.rango(n, 1), y: x, mode: 'lines', line: { color: o === NEC[nom] ? PAL.menta : PAL.lav, width: 1.4 } }], { height: 290, title: { text: `Serie (${n} datos)` }, showlegend: false });
      graf(g2, trazasACF(r, n), layoutACF('ACF (36 rezagos)', { height: 290 }));
      const adf = TS.adf(x, { regression: 'c' }), kp = TS.kpss(x, { regression: 'c' });
      lec.className = 'w-lectura ' + (o === NEC[nom] ? 'ok' : o === 'orig' ? '' : 'mal');
      lec.innerHTML = `${MSJ[nom][o]} · ρ̂(1) = <b>${fmt(r[1])}</b> · ρ̂(12) = <b>${fmt(r[12])}</b> · ADF p = <b>${fp(adf.p)}</b> · KPSS p ${kp.fueraDeTabla === 'mayor' ? '> 0.10' : kp.fueraDeTabla === 'menor' ? '< 0.01' : '= ' + fp(kp.p)}`;
      const X0 = S[nom], lagO = o === 'd1' ? 1 : o === 'ds' ? 12 : null, desde = o === 'orig' ? 1 : o === 'd1' ? 2 : o === 'd2' ? 3 : o === 'ds' ? 13 : 14;
      const filasD = TS.rango(8, desde).map(t1 => [t1, fmt(X0[t1 - 1], 3)].concat(lagO ? [fmt(X0[t1 - 1 - lagO], 3)] : []).concat([o === 'orig' ? '—' : fmt(x[t1 - desde], 3)]));
      tx.innerHTML = tablaHTML(['t', 'y(t)'].concat(lagO ? [`y(t−${lagO})`] : []).concat([{ orig: 'sin transformar', d1: 'Δy = y(t) − y(t−1)', d2: 'Δ²y = Δy(t) − Δy(t−1)', ds: 'Δ₁₂y = y(t) − y(t−12)', d1ds: 'ΔΔ₁₂y' }[o]]), filasD) +
        `<p style="font-size:.85rem;margin:6px 4px">${o === 'orig' ? 'Elige una transformación para ver la resta.' : `El primer resultado aparece en t = ${desde}: se pierden ${desde - 1} datos.`}</p>`;
    }
    dibujar();
  };

  // 5.12 Galería de estacionariedad
  const GAL = {
    rb: { nombre: 'Ruido blanco', gen: s => TS.sim.ruido(240, { semilla: s }), ok: true, texto: 'Cumple las tres condiciones: media 0, varianza constante y sin autocorrelación.', ref: 'rb-estacionario' },
    ar6: { nombre: 'AR(1), φ = 0.6', gen: s => TS.sim.ar1(240, 0.6, { semilla: s }), ok: true, texto: 'Estacionario: media c/(1−φ), varianza σ²/(1−φ²) y ρ(k) = φᵏ.', ref: 'ar1-acf' },
    ar97: { nombre: 'AR(1), φ = 0.97', gen: s => TS.sim.ar1(240, 0.97, { semilla: s }), ok: true, texto: 'Sí es estacionario (|φ| < 1), pero tan persistente que en una muestra corta parece no serlo; la ADF a menudo no rechaza (poca potencia).', ref: 'potencia' },
    paseo: { nombre: 'Paseo aleatorio', gen: s => TS.sim.paseo(240, { semilla: s }), ok: false, texto: 'Falla (2) y (3): Var(y_t) = tσ² crece con t.', ref: 'paseo-demo' },
    tend: { nombre: 'Tendencia determinística', gen: s => TS.sim.tendencia(240, { b: 0.05, semilla: s }), ok: false, texto: 'Falla (1): E[y_t] = a + bt cambia con t. Es estacionaria alrededor de su recta.', ref: 'tendencias' },
    het: { nombre: 'Varianza creciente', gen: s => TS.sim.heteroc(240, { factor: 4, semilla: s }), ok: false, texto: 'Falla (2): la dispersión crece con el tiempo.', ref: 'def-debil' },
    est: { nombre: 'Estacionalidad determinística', gen: s => TS.sim.estacional(240, { periodo: 12, amp: 3, semilla: s }), ok: false, texto: 'Falla (1): E[y_t] = μ + S_t depende del mes. Ojo: con una ventana de 12 o 24 la media móvil sale plana (la trampa).', ref: 'est-no-estacionaria' },
    quiebre: { nombre: 'Ruptura en la media', gen: s => TS.sim.quiebre(240, { salto: 4, semilla: s }), ok: false, texto: 'Falla (1): la media salta a la mitad de la muestra.', ref: 'rupturas' }
  };
  W.galeria = c => {
    const ctr = lienzo(c);
    let semilla = 111;
    const p = seleccion(ctr, { etiqueta: 'Proceso', valor: 'rb', opciones: Object.entries(GAL).map(([k, v]) => [k, v.nombre]) }, dibujar);
    const w = slider(ctr, { etiqueta: 'Ventana de la media móvil', min: 6, max: 48, paso: 1, valor: 24 }, dibujar);
    boton(ctr, 'Nueva muestra', () => { semilla++; dibujar(); }, 'sec');
    const g = lamina(c), lec = lectura(c), ex = extra(c, 'Vista extra: el correlograma del mismo proceso'), gx = lamina(ex);
    function dibujar() {
      const G = GAL[p.get()], x = G.gen(semilla), t = TS.rango(x.length, 1), m = w.get(), mm = TS.mediaMovil(x, m), sd = TS.desvMovil(x, m);
      graf(g, [
        { x: t, y: x, mode: 'lines', line: { color: 'rgba(124,105,214,.6)', width: 1.2 }, name: 'serie' },
        { x: t, y: mm.map((v, i) => v === null ? null : v + 2 * sd[i]), mode: 'lines', line: { width: 0 }, hoverinfo: 'skip', showlegend: false },
        { x: t, y: mm.map((v, i) => v === null ? null : v - 2 * sd[i]), mode: 'lines', line: { width: 0 }, fill: 'tonexty', fillcolor: 'rgba(63,174,138,.16)', name: '± 2 desv. móviles', hoverinfo: 'skip' },
        { x: t, y: mm, mode: 'lines', line: { color: PAL.rosa, width: 3 }, name: `media móvil (${m})` }
      ], { height: 340, title: { text: G.nombre } });
      const adf = TS.adf(x, { regression: 'c' }), kp = TS.kpss(x, { regression: 'c' });
      lec.className = 'w-lectura ' + (G.ok ? 'ok' : 'mal');
      lec.innerHTML = `<b>${G.ok ? '✓ Estacionario' : '✗ No estacionario'}.</b> ${G.texto} ${ref(G.ref, 'ver la explicación')}<br><span style="font-size:.88em">Pruebas en esta muestra: ADF p = ${fp(adf.p)} · KPSS p ${kp.fueraDeTabla === 'mayor' ? '> 0.10' : kp.fueraDeTabla === 'menor' ? '< 0.01' : '= ' + fp(kp.p)}</span>`;
      graf(gx, trazasACF(TS.acf(x, 36), x.length), layoutACF(`ACF · ${G.nombre}`));
    }
    dibujar();
  };

  // 6.2 Distribución de Dickey-Fuller
  W.distdf = c => {
    const ctr = lienzo(c);
    let base = 1;
    const sp = segmentado(ctr, { etiqueta: 'Especificación', valor: 'c', opciones: [['n', 'sin constante'], ['c', 'con constante'], ['ct', 'constante + tendencia']] }, simular);
    const nn = segmentado(ctr, { etiqueta: 'n', valor: 100, opciones: [[50, '50'], [100, '100'], [250, '250']] }, simular);
    boton(ctr, 'Simular 2000 paseos nuevos', () => { base += 2000; simular(); });
    const g = lamina(c), lec = lectura(c), ex = extra(c, 'Vista extra: percentiles simulados contra las tablas'), tx = el('div', { class: 'w-tabla' });
    ex.append(tx);
    function simular() {
      lec.textContent = 'Simulando…';
      setTimeout(() => {
        const reg = sp.get(), n = Number(nn.get()), M = 2000, taus = [];
        for (let j = 0; j < M; j++) taus.push(TS.adf(TS.sim.paseo(n, { semilla: base + j }), { regression: reg, maxlag: 0, autolag: null }).stat);
        const crit = TS.mackinnoncrit(reg, n - 1)['5%'];
        const xs = TS.rango(161).map(i => -6 + i * 0.06);
        graf(g, [
          { type: 'histogram', x: taus, histnorm: 'probability density', nbinsx: 60, marker: { color: 'rgba(224,112,159,.55)', line: { color: '#fff', width: 0.5 } }, name: 'τ simulado (H₀ cierta)' },
          { x: xs, y: xs.map(v => Math.exp(-v * v / 2) / Math.sqrt(2 * Math.PI)), mode: 'lines', line: { color: PAL.lav, width: 2.5 }, name: 'normal estándar' }
        ], {
          height: 360, title: { text: 'Distribución de τ cuando hay raíz unitaria' }, bargap: 0.02, xaxis: { range: [-6, 3.5], title: { text: 'τ' } },
          shapes: [
            { type: 'line', x0: -1.645, x1: -1.645, yref: 'paper', y0: 0, y1: 1, line: { color: PAL.lav, dash: 'dash', width: 2 } },
            { type: 'line', x0: crit, x1: crit, yref: 'paper', y0: 0, y1: 1, line: { color: PAL.rosa, dash: 'dash', width: 2 } }
          ],
          annotations: [
            { x: -1.645, y: 1, yref: 'paper', text: 'normal 5%: −1.645', showarrow: false, xanchor: 'left', font: { color: PAL.lav, size: 11 } },
            { x: crit, y: 0.92, yref: 'paper', text: `Dickey–Fuller 5%: ${crit.toFixed(2)}`, showarrow: false, xanchor: 'right', font: { color: PAL.rosa, size: 11 } }
          ]
        });
        const p1 = taus.filter(v => v < -1.645).length / M, p2 = taus.filter(v => v < crit).length / M;
        lec.innerHTML = `Con el crítico de la normal (−1.645) rechazarías H₀ <b>verdadera</b> en el <b>${(100 * p1).toFixed(1)}%</b> de los casos, en lugar del 5%. Con el crítico de Dickey–Fuller (${crit.toFixed(2)}) se rechaza el <b>${(100 * p2).toFixed(1)}%</b>, como debe ser.`;
        const ord = taus.slice().sort((a, b2) => a - b2), q = pp => ord[Math.floor(pp * (M - 1))], cr = TS.mackinnoncrit(reg, n - 1);
        tx.innerHTML = tablaHTML(['Percentil', 'τ simulado (tu simulación)', 'Dickey–Fuller (MacKinnon)', 'Normal estándar'], [['1%', fmt(q(0.01), 3), fmt(cr['1%'], 3), '−2.326'], ['5%', fmt(q(0.05), 3), fmt(cr['5%'], 3), '−1.645'], ['10%', fmt(q(0.10), 3), fmt(cr['10%'], 3), '−1.282']]) +
          '<p style="font-size:.85rem;margin:6px 4px">Los percentiles de tu simulación se parecen a los valores críticos de Dickey–Fuller y no a los de la normal: por eso existen tablas especiales.</p>';
      }, 20);
    }
    simular();
  };

  // 6.8 Laboratorio ADF + KPSS
  W.laboratorio = c => {
    const ctr = lienzo(c);
    let semilla = 121;
    const pr = seleccion(ctr, { etiqueta: 'Proceso', valor: 'ar', opciones: [['rb', 'Ruido blanco'], ['ar', 'AR(1) (elige φ)'], ['paseo', 'Paseo aleatorio'], ['deriva', 'Paseo con deriva'], ['tend', 'Tendencia determinística'], ['quiebre', 'Ruptura en la media'], ['het', 'Varianza creciente']] }, () => { ph.mostrar(pr.get() === 'ar'); dibujar(); });
    const ph = slider(ctr, { etiqueta: 'φ del AR(1)', min: 0, max: 0.99, paso: 0.01, valor: 0.5, fmt: v => v.toFixed(2) }, dibujar);
    const nn = slider(ctr, { etiqueta: 'n', min: 30, max: 500, paso: 10, valor: 150 }, dibujar);
    const sa = segmentado(ctr, { etiqueta: 'ADF', valor: 'c', opciones: [['n', 'n'], ['c', 'c'], ['ct', 'ct']] }, dibujar);
    const sk = segmentado(ctr, { etiqueta: 'KPSS', valor: 'c', opciones: [['c', 'c'], ['ct', 'ct']] }, dibujar);
    boton(ctr, 'Nueva muestra', () => { semilla++; dibujar(); }, 'sec');
    const g = lamina(c), dec = el('div', { class: 'w-decision' }), mat = el('div', { class: 'w-tabla w-matriz' });
    c.append(dec, mat);
    const ex = extra(c, 'Vista extra: ACF de la serie y de su primera diferencia'), fx = fila(ex), gx1 = lamina(fx), gx2 = lamina(fx);
    function generar(p, n) {
      if (p === 'rb') return TS.sim.ruido(n, { semilla });
      if (p === 'ar') return TS.sim.ar1(n, ph.get(), { semilla });
      if (p === 'paseo') return TS.sim.paseo(n, { semilla });
      if (p === 'deriva') return TS.sim.paseo(n, { deriva: 0.3, semilla });
      if (p === 'tend') return TS.sim.tendencia(n, { b: 0.05, semilla });
      if (p === 'quiebre') return TS.sim.quiebre(n, { salto: 3, semilla });
      return TS.sim.heteroc(n, { factor: 4, semilla });
    }
    function dibujar() {
      const n = nn.get(), x = generar(pr.get(), n);
      graf(g, [{ x: TS.rango(n, 1), y: x, mode: 'lines', line: { color: PAL.lav, width: 1.4 } }], { height: 260, title: { text: 'Serie simulada' }, showlegend: false });
      const a = TS.adf(x, { regression: sa.get() }), k = TS.kpss(x, { regression: sk.get() });
      const ar = a.p < 0.05, kr = k.p < 0.05;
      const pk = k.fueraDeTabla === 'mayor' ? '> 0.10' : k.fueraDeTabla === 'menor' ? '< 0.01' : fp(k.p);
      dec.innerHTML = `<div class="w-prueba ${ar ? 'rechaza' : 'no-rechaza'}"><h5>ADF (regression = "${sa.get()}")</h5>τ = <b>${fmt(a.stat)}</b> · p-value = <b>${fp(a.p)}</b><br>crítico 5% = ${fmt(a.crit['5%'])} · rezagos (AIC) = ${a.lags} · obs. = ${a.nobs}<div class="dec">${ar ? 'Rechaza H₀: no hay raíz unitaria' : 'No rechaza H₀: posible raíz unitaria'}</div></div>` +
        `<div class="w-prueba ${kr ? 'rechaza' : 'no-rechaza'}"><h5>KPSS (regression = "${sk.get()}")</h5>η = <b>${fmt(k.stat)}</b> · p-value ${k.fueraDeTabla ? '' : '= '}<b>${pk}</b><br>crítico 5% = ${k.crit['5%']} · rezagos = ${k.lags}<div class="dec">${kr ? 'Rechaza H₀: no es estacionaria' : 'No rechaza H₀: compatible con estacionariedad'}</div></div>`;
      const celda = (aR, kR, txt) => `<td class="${aR === ar && kR === kr ? 'activa' : ''}">${txt}</td>`;
      mat.innerHTML = `<table><thead><tr><th></th><th>KPSS no rechaza</th><th>KPSS rechaza</th></tr></thead><tbody>
        <tr><th>ADF rechaza</th>${celda(true, false, '✅ Estacionaria')}${celda(true, true, '⚠️ Ambas rechazan: revisar')}</tr>
        <tr><th>ADF no rechaza</th>${celda(false, false, '❓ Evidencia insuficiente')}${celda(false, true, '❌ No estacionaria')}</tr></tbody></table>`;
      graf(gx1, trazasACF(TS.acf(x, 24), n), layoutACF('ACF de la serie'));
      const dx = TS.diff(x);
      graf(gx2, trazasACF(TS.acf(dx, 24), dx.length, { color: PAL.menta }), layoutACF('ACF de Δy'));
    }
    ph.mostrar(true);
    dibujar();
  };

  // 7.2 Bandas de Bartlett
  W.bartlett = c => {
    const ctr = lienzo(c);
    let semilla = 131;
    const NS = [20, 30, 50, 75, 100, 150, 200, 300, 500, 750, 1000];
    const nn = slider(ctr, { etiqueta: 'n', min: 0, max: NS.length - 1, paso: 1, valor: 4, fmt: v => NS[v] }, dibujar);
    boton(ctr, 'Nueva muestra', () => { semilla++; dibujar(); }, 'sec');
    const g = lamina(c), lec = lectura(c), ex = extra(c, 'Vista extra: las autocorrelaciones se distribuyen N(0, 1/n)'), gx = lamina(ex);
    function dibujar() {
      const n = NS[nn.get()], x = TS.sim.ruido(n, { semilla }), K = Math.min(40, n - 1), r = TS.acf(x, K), b = 1.96 / Math.sqrt(n);
      const fuera = r.slice(1).filter(v => Math.abs(v) > b).length;
      graf(g, trazasACF(r, n), layoutACF(`ACF de ruido blanco con n = ${n}`, { height: 300, yaxis: { range: [-0.6, 0.6] } }));
      lec.innerHTML = `Banda: ±1.96/√${n} = <b>±${fmt(b)}</b> · barras fuera: <b>${fuera} de ${K}</b> (${fmt(100 * fuera / K, 1)}%; se espera alrededor de 5%).`;
      const sdv = 1 / Math.sqrt(n), xs2 = TS.rango(81).map(i => -4 * sdv + i * sdv / 10);
      graf(gx, [{ type: 'histogram', x: r.slice(1), histnorm: 'probability density', nbinsx: 14, marker: { color: 'rgba(201,188,247,.85)', line: { color: '#fff', width: 1 } }, name: `ρ̂(1)…ρ̂(${K})` },
        { x: xs2, y: xs2.map(v => Math.exp(-v * v / (2 * sdv * sdv)) / (sdv * Math.sqrt(2 * Math.PI))), mode: 'lines', line: { color: PAL.rosa, width: 2.5 }, name: 'N(0, 1/n)' }],
        { height: 260, title: { text: 'Histograma de las barras del correlograma' }, bargap: 0.03, shapes: [-1, 1].map(sg => ({ type: 'line', x0: sg * b, x1: sg * b, yref: 'paper', y0: 0, y1: 1, line: { color: PAL.dur, dash: 'dash' } })) });
    }
    dibujar();
  };

  // 7.5 Galería de correlogramas
  const PROC = {
    rb: { nombre: 'Ruido blanco', param: null, gen: (n, p, s) => TS.sim.ruido(n, { semilla: s }), teo: (p, K) => [1].concat(new Array(K).fill(0)), patron: () => 'ACF y PACF ≈ 0 en todos los rezagos.' },
    ar1: { nombre: 'AR(1)', param: { etiqueta: 'φ', min: -0.95, max: 0.95, paso: 0.05, valor: 0.7 }, gen: (n, p, s) => TS.sim.ar1(n, p, { semilla: s }), teo: (p, K) => TS.rango(K + 1).map(k => Math.pow(p, k)), patron: p => p >= 0 ? 'ACF decae geométricamente (φᵏ); PACF se corta después del rezago 1.' : 'ACF decae alternando de signo; PACF se corta después del rezago 1 (negativa).' },
    ma1: { nombre: 'MA(1)', param: { etiqueta: 'θ', min: -0.95, max: 0.95, paso: 0.05, valor: 0.8 }, gen: (n, p, s) => TS.sim.ma1(n, p, { semilla: s }), teo: (p, K) => [1, p / (1 + p * p)].concat(new Array(K - 1).fill(0)), patron: () => 'ACF se corta después del rezago 1; PACF decae gradualmente.' },
    ar2: { nombre: 'AR(2): φ₁ = 0.5, φ₂ = 0.3', param: null, gen: (n, p, s) => simAR(n, [0.5, 0.3], s), teo: (p, K) => { const r = [1, 0.5 / 0.7]; for (let k = 2; k <= K; k++) r.push(0.5 * r[k - 1] + 0.3 * r[k - 2]); return r; }, patron: () => 'ACF decae gradualmente; PACF se corta después del rezago 2.' },
    paseo: { nombre: 'Paseo aleatorio', param: null, gen: (n, p, s) => TS.sim.paseo(n, { semilla: s }), teo: null, patron: () => 'ACF empieza cerca de 1 y decae muy despacio; PACF con un pico ≈ 1 en el rezago 1. Hay que diferenciar.' },
    sar: { nombre: 'Estacional (periodo 12)', param: { etiqueta: 'Φ estacional', min: 0.3, max: 0.95, paso: 0.05, valor: 0.8 }, gen: (n, p, s) => simAR(n, [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, p], s, 600), teo: (p, K) => TS.rango(K + 1).map(k => k % 12 === 0 ? Math.pow(p, k / 12) : 0), patron: () => 'Picos en los rezagos 12, 24, 36… de la ACF; en la PACF, un pico en 12.' }
  };
  W.correlograma = c => {
    const ctr = lienzo(c);
    let semilla = 141;
    const pr = seleccion(ctr, { etiqueta: 'Proceso', valor: 'ar1', opciones: Object.entries(PROC).map(([k, v]) => [k, v.nombre]) }, () => { configurar(); dibujar(); });
    const pa = slider(ctr, { etiqueta: 'φ', min: -0.95, max: 0.95, paso: 0.05, valor: 0.7, fmt: v => v.toFixed(2) }, dibujar);
    const nn = slider(ctr, { etiqueta: 'n', min: 50, max: 1000, paso: 50, valor: 300 }, dibujar);
    const teo = casilla(ctr, 'Mostrar valores teóricos', true, dibujar);
    boton(ctr, 'Nueva muestra', () => { semilla++; dibujar(); }, 'sec');
    const g1 = lamina(c), f = fila(c), g2 = lamina(f), g3 = lamina(f), lec = lectura(c);
    function configurar() {
      const P = PROC[pr.get()];
      pa.mostrar(!!P.param);
      if (P.param) pa.config(Object.assign({ fmt: v => v.toFixed(2) }, P.param));
    }
    function dibujar() {
      const P = PROC[pr.get()], n = nn.get(), p = P.param ? pa.get() : 0, x = P.gen(n, p, semilla), K = pr.get() === 'sar' ? 36 : 24;
      graf(g1, [{ x: TS.rango(n, 1), y: x, mode: 'lines', line: { color: PAL.lav, width: 1.2 } }], { height: 220, title: { text: P.nombre }, showlegend: false, margin: { t: 34, b: 30 } });
      const ra = TS.acf(x, K), rp = TS.pacf(x, K), ta = trazasACF(ra, n), tp = trazasACF(rp, n, { nombre: 'PACF muestral' });
      if (teo.get() && P.teo) {
        const at = P.teo(p, K), pt = TS.pacfDesdeAcf(at, K), ks = TS.rango(K, 1);
        const est = { mode: 'markers', marker: { symbol: 'diamond', size: 7, color: PAL.rosa, line: { color: '#fff', width: 1 } } };
        ta.push(Object.assign({ x: ks, y: ks.map(k => at[k]), name: 'teórica' }, est));
        tp.push(Object.assign({ x: ks, y: ks.map(k => pt[k]), name: 'teórica' }, est));
      }
      graf(g2, ta, layoutACF('ACF'));
      graf(g3, tp, layoutACF('PACF'));
      lec.innerHTML = `<b>Patrón esperado:</b> ${P.patron(p)} Barras naranjas = fuera de la banda ±1.96/√n; rombos rosas = valores teóricos.`;
    }
    configurar();
    dibujar();
  };

  // 8.4 Ljung-Box paso a paso
  W.ljungbox = c => {
    const ctr = lienzo(c);
    let semilla = 151;
    const ph = slider(ctr, { etiqueta: 'φ (0 = ruido blanco)', min: 0, max: 0.9, paso: 0.05, valor: 0.3, fmt: v => v.toFixed(2) }, dibujar);
    const nn = slider(ctr, { etiqueta: 'n', min: 30, max: 500, paso: 10, valor: 100 }, dibujar);
    const hh = slider(ctr, { etiqueta: 'h (rezagos evaluados)', min: 1, max: 30, paso: 1, valor: 10 }, dibujar);
    boton(ctr, 'Nueva muestra', () => { semilla++; dibujar(); }, 'sec');
    const g = lamina(c), lec = lectura(c), ex = extra(c, 'Vista extra: la tabla de la que sale cada barra'), tx = el('div', { class: 'w-tabla' });
    ex.append(tx);
    function dibujar() {
      const n = nn.get(), h = hh.get(), x = TS.sim.ar1(n, ph.get(), { semilla }), lb = TS.ljungBox(x, h), ks = TS.rango(h, 1);
      const crit = ks.map(k => TS.chi2ppf(0.95, k));
      graf(g, [
        { type: 'bar', x: ks, y: lb.filas.map(f => f.aporte), marker: { color: 'rgba(79,159,216,.55)' }, name: 'aporte de cada rezago', hovertemplate: 'k = %{x}<br>aporte = %{y:.3f}<extra></extra>' },
        { x: ks, y: lb.filas.map(f => f.Q), mode: 'lines+markers', line: { color: PAL.rosa, width: 3 }, name: 'Q acumulado' },
        { x: ks, y: crit, mode: 'lines', line: { color: PAL.gris, width: 2, dash: 'dash' }, name: 'crítico χ²(k) al 95%' }
      ], { height: 340, title: { text: 'Construcción del estadístico Q' }, xaxis: { title: { text: 'rezago k' }, dtick: h > 15 ? 5 : 1 } });
      const rech = lb.p < 0.05;
      lec.className = 'w-lectura ' + (rech ? 'mal' : 'ok');
      lec.innerHTML = tex(`Q = n(n+2)\\sum_{k=1}^{${h}}\\frac{\\hat{\\rho}(k)^2}{n-k} = ${num(lb.Q)} \\qquad \\chi^2_{${h};\\,0.95} = ${num(crit[h - 1])}`, true) +
        `p-value = <b>${fp(lb.p)}</b> → ${rech ? '<b>se rechaza H₀</b>: hay autocorrelación.' : '<b>no se rechaza H₀</b>: no hay evidencia de autocorrelación.'}`;
      tx.innerHTML = tablaHTML(['k', 'ρ̂(k)', 'ρ̂(k)²', 'n − k', 'aporte n(n+2)ρ̂²/(n−k)', 'Q acumulado', 'crítico χ²(k)', 'p-value'], lb.filas.map((fl, i) => [fl.k, fmt(fl.rho), fmt(fl.rho * fl.rho, 4), n - fl.k, fmt(fl.aporte), fmt(fl.Q), fmt(crit[i]), fp(fl.p)]), lb.filas.map(fl => fl.k === h ? 'suma' : ''));
    }
    dibujar();
  };

  // 9 Caso AirPassengers
  W.caso = c => {
    const ctr = lienzo(c);
    const tr = segmentado(ctr, { etiqueta: 'Transformación', valor: 'orig', opciones: [['orig', 'Original'], ['log', 'ln y'], ['dlog', 'Δ ln y'], ['d12', 'Δ₁₂ ln y'], ['dd12', 'ΔΔ₁₂ ln y']] }, () => { sp.set(['orig', 'log'].includes(tr.get()) ? 'ct' : 'c'); dibujar(); });
    const sp = segmentado(ctr, { etiqueta: 'Especificación ADF/KPSS', valor: 'ct', opciones: [['c', 'c'], ['ct', 'ct']] }, dibujar);
    const f = fila(c), g1 = lamina(f), g2 = lamina(f), dec = el('div', { class: 'w-decision' }), lec = lectura(c);
    c.insertBefore(dec, lec);
    const ex = extra(c, 'Vista extra: la PACF de la misma serie'), gx = lamina(ex);
    const L = TS.datos.airpassengers.map(Math.log), fechas = TS.datos.fechasMensuales(1949, 144);
    const NOTA = {
      orig: 'Tendencia, estacionalidad y amplitud creciente: primero logaritmo.',
      log: 'La amplitud ya es estable, pero sigue la tendencia y la estacionalidad.',
      dlog: 'Sin tendencia, pero mira ρ̂(12): la estacionalidad sigue ahí aunque las pruebas casi digan «estacionaria».',
      d12: 'Sin estacionalidad, pero ρ̂(1) sigue alto: falta la diferencia regular.',
      dd12: 'Estacionaria. Ljung–Box aún rechaza: los picos en 1 y 12 se modelan con un SARIMA (Unidad II).'
    };
    function serie(t) {
      if (t === 'orig') return TS.datos.airpassengers.slice();
      if (t === 'log') return L.slice();
      if (t === 'dlog') return TS.diff(L);
      if (t === 'd12') return TS.diff(L, 12);
      return TS.diff(TS.diff(L, 12));
    }
    function dibujar() {
      const t = tr.get(), x = serie(t), n = x.length, r = TS.acf(x, 36);
      graf(g1, [{ x: fechas.slice(144 - n), y: x, mode: 'lines', line: { color: t === 'dd12' ? PAL.menta : PAL.lav, width: 1.6 } }], { height: 290, title: { text: `Serie (${n} datos)` }, showlegend: false });
      graf(g2, trazasACF(r, n), layoutACF('ACF (36 rezagos)', { height: 290 }));
      const a = TS.adf(x, { regression: sp.get() }), k = TS.kpss(x, { regression: sp.get() }), lb = TS.ljungBox(x, 24);
      const ar = a.p < 0.05, kr = k.p < 0.05;
      const lect = ar && !kr ? '✅ estacionaria' : !ar && kr ? '❌ no estacionaria' : ar && kr ? '⚠️ ambas rechazan' : '❓ evidencia insuficiente';
      const pk = k.fueraDeTabla === 'mayor' ? '> 0.10' : k.fueraDeTabla === 'menor' ? '< 0.01' : fp(k.p);
      dec.innerHTML = `<div class="w-prueba ${ar ? 'rechaza' : 'no-rechaza'}"><h5>ADF</h5>p-value = <b>${fp(a.p)}</b><div class="dec">${ar ? 'rechaza la raíz unitaria' : 'no rechaza la raíz unitaria'}</div></div>` +
        `<div class="w-prueba ${kr ? 'rechaza' : 'no-rechaza'}"><h5>KPSS</h5>p-value ${k.fueraDeTabla ? pk : '= ' + pk}<div class="dec">${kr ? 'rechaza la estacionariedad' : 'no rechaza la estacionariedad'}</div></div>` +
        `<div class="w-prueba ${lb.p < 0.05 ? 'rechaza' : 'no-rechaza'}"><h5>Ljung–Box (h = 24)</h5>p-value = <b>${fp(lb.p)}</b><div class="dec">${lb.p < 0.05 ? 'hay autocorrelación' : 'sin autocorrelación'}</div></div>`;
      lec.innerHTML = `<b>Lectura conjunta:</b> ${lect} · ρ̂(1) = ${fmt(r[1])} · ρ̂(12) = ${fmt(r[12])}. ${NOTA[t]}`;
      graf(gx, trazasACF(TS.pacf(x, 36), n, { color: PAL.cel, nombre: 'PACF' }), layoutACF('PACF (36 rezagos)', { height: 270 }));
    }
    dibujar();
  };

  // Figuras para ejercicios (sin controles)
  W['figura-acf'] = (c, op) => {
    const n = Number(op.n || 200), s = Number(op.semilla || 1), p = Number(op.param || 0);
    const x = op.proceso === 'ar1' ? TS.sim.ar1(n, p, { semilla: s }) : op.proceso === 'ma1' ? TS.sim.ma1(n, p, { semilla: s }) : op.proceso === 'paseo' ? TS.sim.paseo(n, { semilla: s }) : TS.sim.ruido(n, { semilla: s });
    c.innerHTML = '';
    const f = fila(c), g1 = lamina(f), g2 = lamina(f);
    graf(g1, trazasACF(TS.acf(x, 20), n), layoutACF('ACF', { height: 240 }));
    graf(g2, trazasACF(TS.pacf(x, 20), n, { nombre: 'PACF' }), layoutACF('PACF', { height: 240 }));
  };


  // Tabla del dataset AirPassengers (mapa de calor enlazado con la gráfica)
  W['tabla-ap'] = c => {
    const ctr = lienzo(c), AP = TS.datos.airpassengers, fechas = TS.datos.fechasMensuales(1949, 144);
    const vista = segmentado(ctr, { etiqueta: 'Mostrar', valor: 'y', opciones: [['y', 'pasajeros'], ['log', 'ln(pasajeros)'], ['pct', 'cambio vs. mismo mes del año anterior (%)']] }, () => { dibujar(); if (sel !== null) marcar(sel); });
    const tx = el('div', { class: 'w-tabla tabla-ap' }), info = el('div', { class: 'w-lectura' });
    c.append(tx, info);
    const g = lamina(c);
    let sel = null, vals = [];
    const valor = i => vista.get() === 'y' ? AP[i] : vista.get() === 'log' ? Math.log(AP[i]) : (i < 12 ? null : 100 * (AP[i] / AP[i - 12] - 1));
    const dec = () => vista.get() === 'y' ? 0 : vista.get() === 'log' ? 3 : 1;
    function dibujar() {
      vals = TS.rango(144).map(valor);
      const ok = vals.filter(v => v !== null), lo = Math.min(...ok), hi = Math.max(...ok);
      let h = '<table><thead><tr><th>Año</th>' + MESES.map(m => `<th>${m}</th>`).join('') + '<th>Media</th></tr></thead><tbody>';
      for (let a = 0; a < 12; a++) {
        const fila_ = vals.slice(12 * a, 12 * a + 12);
        h += `<tr><th>${1949 + a}</th>` + fila_.map((v, m) => v === null ? `<td data-i="${12 * a + m}">—</td>` : `<td data-i="${12 * a + m}" data-a="${a}" data-m="${m}" style="background:${mezcla('#f6f3ff', '#f2a0c2', (v - lo) / (hi - lo || 1))}">${fmt(v, dec())}</td>`).join('') +
          `<td><b>${fila_.some(v => v === null) ? '—' : fmt(TS.media(fila_), dec())}</b></td></tr>`;
      }
      tx.innerHTML = h + '</tbody></table>';
      graf(g, [{ x: fechas, y: vals, mode: 'lines', line: { color: PAL.lav, width: 1.8 }, hovertemplate: '%{x|%b %Y}: %{y:.3f}<extra></extra>' },
        { x: [], y: [], mode: 'markers', marker: { size: 14, color: PAL.rosa, line: { color: '#fff', width: 2 } }, hoverinfo: 'skip' }],
        { height: 260, title: { text: 'La misma tabla como serie de tiempo (el punto rosa es la celda elegida)' }, showlegend: false });
      info.innerHTML = 'Pasa el cursor (o toca) una celda: se resaltan su año y su mes, y aparece en la gráfica.';
    }
    function marcar(i) {
      sel = i;
      const a = Math.floor(i / 12), m = i % 12;
      tx.querySelectorAll('td').forEach(td => td.classList.remove('sel', 'sel-f', 'sel-c'));
      tx.querySelectorAll(`td[data-a="${a}"]`).forEach(td => td.classList.add('sel-f'));
      tx.querySelectorAll(`td[data-m="${m}"]`).forEach(td => td.classList.add('sel-c'));
      const td = tx.querySelector(`td[data-i="${i}"]`); if (td) td.classList.add('sel');
      if (vals[i] !== null) window.Plotly.restyle(g, { x: [[fechas[i]]], y: [[vals[i]]] }, [1]);
      info.innerHTML = `<b>${MESES[m]} de ${1949 + a}</b>: ${vals[i] === null ? 'sin dato (no hay año anterior)' : fmt(vals[i], dec())} · es <b>y<sub>t</sub> con t = ${i + 1}</b> · en pandas: <code>serie.loc["${fechas[i]}"]</code> o <code>serie.iloc[${i}]</code>` +
        (m === 6 || m === 7 ? ' · julio y agosto son los meses más altos de cada año.' : m === 10 ? ' · noviembre es el mes más bajo.' : '');
    }
    tx.addEventListener('mouseover', e => { const td = e.target.closest('td[data-i]'); if (td) marcar(Number(td.dataset.i)); });
    tx.addEventListener('click', e => { const td = e.target.closest('td[data-i]'); if (td) marcar(Number(td.dataset.i)); });
    dibujar();
  };

  /* ===================== Simuladores de Python ===================== */
  // Resaltado mínimo de Python (mismas clases que Pygments)
  const PYKW = new Set(['import', 'from', 'as', 'for', 'in', 'def', 'return', 'if', 'else', 'with', 'print', 'lambda']);
  const PYKC = new Set(['True', 'False', 'None']);
  function resaltar(linea) {
    const esc = t => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    let html = '', i = 0;
    const re = /(#.*$)|("[^"]*"|'[^']*')|(\b\d+(?:\.\d+)?\b)|(\b[A-Za-z_]\w*\b)(?=\s*\()|(\b[A-Za-z_]\w*\b)|(@@\d+@@)/g;
    let m;
    while ((m = re.exec(linea))) {
      html += esc(linea.slice(i, m.index));
      const t = m[0];
      if (m[1]) html += `<span class="c1">${esc(t)}</span>`;
      else if (m[2]) html += `<span class="s1">${esc(t)}</span>`;
      else if (m[3]) html += `<span class="mi">${t}</span>`;
      else if (m[4]) html += PYKW.has(t) ? `<span class="k">${t}</span>` : `<span class="nf">${t}</span>`;
      else if (m[5]) html += PYKW.has(t) ? `<span class="k">${t}</span>` : PYKC.has(t) ? `<span class="kc">${t}</span>` : esc(t);
      else html += t;
      i = m.index + t.length;
    }
    return html + esc(linea.slice(i));
  }
  // plantilla: texto con {nombre}; args: {nombre: valorPython}
  function codigoPython(plantilla, args, cambiado) {
    const vals = [];
    const txt = plantilla.replace(/\{(\w+)\}/g, (m0, k) => { if (!(k in args)) return m0; vals.push(k); return '@@' + (vals.length - 1) + '@@'; });
    return txt.split('\n').map(resaltar).join('\n').replace(/@@(\d+)@@/g, (_, j) => {
      const k = vals[+j];
      return `<span class="arg${k === cambiado ? ' arg-nuevo' : ''}" title="parámetro: ${k}">${resaltar(String(args[k]))}</span>`;
    });
  }
  const pyv = v => v === null || v === undefined ? 'None' : typeof v === 'boolean' ? (v ? 'True' : 'False') : typeof v === 'string' && !/^[\[\d-]/.test(v) && v !== 'None' ? `"${v}"` : String(v);
  function panelCodigo(c, o) {
    const caja = el('div', { class: 'codigo sim-codigo' });
    const cab = el('div', { class: 'c-cab' }, el('span', { class: 'c-lang' }, '🐍 Python · el código cambia con tus parámetros'));
    const copiar = el('button', { type: 'button', class: 'c-copiar' }, 'Copiar');
    cab.append(copiar);
    const pre = el('pre', { class: 'c-fuente' }), code = el('code');
    pre.append(code);
    const sal = el('div', { class: 'c-salida' }, el('div', { class: 'c-salida-cab' }, 'Salida (calculada en tu navegador con las mismas fórmulas de ' + ((o && o.fuente) || 'statsmodels') + ')'));
    const spre = el('pre');
    sal.append(spre);
    caja.append(cab, pre, sal);
    c.append(caja);
    copiar.addEventListener('click', () => {
      const t = code.innerText;
      (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).catch(() => {});
      copiar.textContent = '¡Copiado!'; setTimeout(() => { copiar.textContent = 'Copiar'; }, 1500);
    });
    return { codigo: h => { code.innerHTML = h; }, salida: t => { spre.textContent = t; sal.style.display = t ? '' : 'none'; } };
  }
  // Tabla de texto al estilo pandas
  function tablaTexto(cols, filas, indice) {
    const fmtc = v => v === null || v === undefined || (typeof v === 'number' && isNaN(v)) ? 'NaN' : typeof v === 'number' ? (Number.isInteger(v) ? String(v) : v.toFixed(4)) : String(v);
    const datos = filas.map(f => f.map(fmtc)), idx = (indice || filas.map((_, i) => String(i))).map(String);
    const wi = Math.max(...idx.map(s => s.length), 1);
    const w = cols.map((cname, j) => Math.max(cname.length, ...datos.map(f => f[j].length)));
    const lin = [' '.repeat(wi) + '  ' + cols.map((cn, j) => cn.padStart(w[j])).join('  ')];
    datos.forEach((f, i) => lin.push(idx[i].padEnd(wi) + '  ' + f.map((v, j) => v.padStart(w[j])).join('  ')));
    return lin.join('\n');
  }
  function panelParametros(c, filas) {
    const d = el('div', { class: 'w-tabla sim-params' });
    c.append(d);
    return (valores, activo) => {
      d.innerHTML = '<table><thead><tr><th>Parámetro</th><th>Valor actual</th><th>Qué hace</th><th>Recomendado</th></tr></thead><tbody>' +
        filas.map(f => `<tr class="${f.nombre === activo ? 'activo' : ''}"><td><code>${f.nombre}</code></td><td><code>${valores[f.nombre] === undefined ? '—' : valores[f.nombre]}</code></td><td>${f.que}</td><td>${f.rec}</td></tr>`).join('') + '</tbody></table>';
    };
  }
  const fechasAP = TS.datos.fechasMensuales(1949, 144);
  const LOGAP = TS.datos.airpassengers.map(Math.log);
  const SERIES_SIM = {
    serie: { nombre: 'AirPassengers (serie)', x: () => TS.datos.airpassengers.slice(), fechas: () => fechasAP, estacional: true, def: 'serie' },
    log: { nombre: 'np.log(serie)', x: () => LOGAP.slice(), fechas: () => fechasAP, estacional: true, def: 'np.log(serie)' },
    dlog: { nombre: 'np.log(serie).diff()', x: () => TS.diff(LOGAP), fechas: () => fechasAP.slice(1), estacional: true, def: 'np.log(serie).diff().dropna()' },
    dd: { nombre: 'np.log(serie).diff(12).diff()', x: () => TS.diff(TS.diff(LOGAP, 12)), fechas: () => fechasAP.slice(13), estacional: true, def: 'np.log(serie).diff(12).diff().dropna()' },
    ar: { nombre: 'AR(1) simulado, φ = 0.7', x: () => TS.sim.ar1(200, 0.7, { semilla: 9 }), def: 'ar1   # AR(1) con φ = 0.7, n = 200 (muestra simulada en tu navegador)' },
    ma: { nombre: 'MA(1) simulado, θ = 0.8', x: () => TS.sim.ma1(200, 0.8, { semilla: 9 }), def: 'ma1   # MA(1) con θ = 0.8, n = 200 (muestra simulada en tu navegador)' },
    rb: { nombre: 'Ruido blanco', x: () => TS.sim.ruido(200, { semilla: 3 }), def: 'rb    # ruido blanco, n = 200 (muestra simulada en tu navegador)' },
    paseo: { nombre: 'Paseo aleatorio', x: () => TS.sim.paseo(200, { semilla: 2 }), def: 'paseo # paseo aleatorio, n = 200 (muestra simulada en tu navegador)' },
    tend: { nombre: 'Tendencia + ruido', x: () => TS.sim.tendencia(200, { a: 10, b: 0.05, semilla: 7 }), def: 'tend  # 10 + 0.05·t + ruido, n = 200 (muestra simulada en tu navegador)' }
  };
  const opcionesSeries = claves => claves.map(k => [k, SERIES_SIM[k].nombre]);
  const tallos = (ks, vs, color) => {
    const xs = [], ys = [];
    ks.forEach((k, i) => { xs.push(k, k, null); ys.push(0, vs[i], null); });
    return [
      { x: xs, y: ys, mode: 'lines', line: { color, width: 2 }, hoverinfo: 'skip', showlegend: false },
      { x: ks, y: vs, mode: 'markers', marker: { color, size: 7, line: { color: '#fff', width: 1 } }, hovertemplate: 'rezago %{x}<br>valor %{y:.3f}<extra></extra>', showlegend: false }
    ];
  };

  // --- plot_acf / plot_pacf con todos sus parámetros
  W['py-plotacf'] = c => {
    const ctr = lienzo(c);
    let activo = 'lags';
    const s = seleccion(ctr, { etiqueta: 'Serie (x)', valor: 'serie', opciones: opcionesSeries(['serie', 'dlog', 'dd', 'ar', 'ma', 'rb', 'paseo']) }, () => { activo = 'x'; dibujar(); });
    const fn = segmentado(ctr, { etiqueta: 'Función', valor: 'acf', opciones: [['acf', 'plot_acf'], ['pacf', 'plot_pacf']] }, () => { activo = 'fn'; dibujar(); });
    const lg = slider(ctr, { etiqueta: 'lags', min: 5, max: 60, paso: 1, valor: 36 }, () => { activo = 'lags'; dibujar(); });
    const lgNone = casilla(ctr, 'lags=None (por defecto)', false, () => { activo = 'lags'; dibujar(); });
    const al = segmentado(ctr, { etiqueta: 'alpha', valor: '0.05', opciones: [['0.01', '0.01'], ['0.05', '0.05'], ['0.1', '0.10'], ['None', 'None']] }, () => { activo = 'alpha'; dibujar(); });
    const ze = casilla(ctr, 'zero=True (dibujar rezago 0)', true, () => { activo = 'zero'; dibujar(); });
    const bc = casilla(ctr, 'bartlett_confint=True', true, () => { activo = 'bartlett_confint'; dibujar(); });
    const me = seleccion(ctr, { etiqueta: 'method (solo PACF)', valor: 'ywm', opciones: [['ywm', '"ywm" (por defecto)'], ['yw', '"yw" (ajustado)'], ['ols', '"ols"']] }, () => { activo = 'method'; dibujar(); });
    const pc = panelCodigo(c), g = lamina(c), lec = lectura(c);
    const params = panelParametros(c, [
      { nombre: 'x', que: 'La serie (ya transformada si hace falta).', rec: 'Una serie <b>estacionaria</b>; si no, la ACF solo mostrará decaimiento lento.' },
      { nombre: 'lags', que: 'Hasta qué rezago dibujar. <code>None</code> usa ⌈10·log₁₀ n⌉ (máximo n/2).', rec: 'No estacional: 20–40. Mensual: <b>36–48</b> (ver 12, 24, 36). Diaria con semana: 21–28. PACF: menos de n/2.' },
      { nombre: 'alpha', que: 'Nivel de la banda: 0.05 = banda al 95%. <code>None</code> quita la banda.', rec: '<b>0.05</b>. Usa 0.01 para ser más exigente con muchas barras.' },
      { nombre: 'zero', que: 'Si se dibuja el rezago 0 (que siempre vale 1).', rec: '<b>False</b>: así la escala se ajusta a los rezagos que importan.' },
      { nombre: 'bartlett_confint', que: 'Solo plot_acf. True: banda que se ensancha (Bartlett). False: banda fija ±z/√n.', rec: '<b>True</b> para identificar un MA(q); False para comparar contra ruido blanco.' },
      { nombre: 'method', que: 'Solo plot_pacf. Cómo se estima la PACF.', rec: '<b>"ywm"</b> (por defecto, nunca sale de [−1, 1]) u <b>"ols"</b>. Evita "yw" con pocos datos.' }
    ]);
    function dibujar() {
      const S = SERIES_SIM[s.get()], x = S.x(), n = x.length, esA = fn.get() === 'acf';
      const lim = Math.min(Math.ceil(10 * Math.log10(n)), Math.floor(n / 2));
      let L = lgNone.get() ? lim : lg.get();
      if (!esA && L >= Math.floor(n / 2)) L = Math.floor(n / 2) - 1;
      const alpha = al.get() === 'None' ? null : Number(al.get()), zero = ze.get(), metodo = me.get();
      const vals = esA ? TS.acf(x, L) : TS.pacfMetodo(x, L, metodo);
      let bandas = null;
      if (alpha !== null) bandas = esA ? TS.acfBandas(x, L, alpha, bc.get()) : [0].concat(TS.rango(L).map(() => TS.normppf(1 - alpha / 2) / Math.sqrt(n)));
      const ks = TS.rango(L + 1).filter(k => zero || k > 0), tr = [];
      if (bandas) {
        const kb = TS.rango(L, 1);
        tr.push({ x: kb, y: kb.map(k => bandas[k]), mode: 'lines', line: { width: 0, shape: 'linear' }, hoverinfo: 'skip', showlegend: false });
        tr.push({ x: kb, y: kb.map(k => -bandas[k]), mode: 'lines', line: { width: 0 }, fill: 'tonexty', fillcolor: 'rgba(124,105,214,.18)', hoverinfo: 'skip', showlegend: false });
      }
      tr.push(...tallos(ks, ks.map(k => vals[k]), esA ? PAL.lav : PAL.cel));
      const titulo = esA ? 'Autocorrelation' : 'Partial Autocorrelation';
      graf(g, tr, { height: 320, title: { text: `${titulo}  ·  ${S.nombre}` }, xaxis: { title: { text: 'rezago' } }, yaxis: zero ? { range: [-1.1, 1.1] } : {}, showlegend: false,
        shapes: [{ type: 'line', xref: 'paper', x0: 0, x1: 1, y0: 0, y1: 0, line: { color: '#b9b5cf', width: 1 } }] });
      const args = { x: S.def.split(' ')[0], lags: lgNone.get() ? 'None' : L, alpha: alpha === null ? 'None' : alpha, zero: pyv(zero), bartlett_confint: pyv(bc.get()), method: `"${metodo}"` };
      const cab = esA ? 'from statsmodels.graphics.tsaplots import plot_acf' : 'from statsmodels.graphics.tsaplots import plot_pacf';
      const linea = esA ? 'plot_acf(x, lags={lags}, alpha={alpha}, zero={zero}, bartlett_confint={bartlett_confint}, ax=ax)' : 'plot_pacf(x, lags={lags}, alpha={alpha}, method={method}, zero={zero}, ax=ax)';
      pc.codigo(codigoPython(`${cab}\nimport matplotlib.pyplot as plt\n\nx = ${S.def}\nfig, ax = plt.subplots(figsize=(9, 3.5))\n${linea}\nplt.show()`, args, activo === 'fn' ? null : activo));
      const fuera = bandas ? TS.rango(L, 1).filter(k => Math.abs(vals[k]) > bandas[k]) : [];
      pc.salida(bandas ? `# Rezagos cuya barra sale de la banda (no es salida de Python, es la lectura):\n${fuera.length ? fuera.join(', ') : 'ninguno'}` : '# alpha=None: no se dibuja banda, no se puede juzgar significancia.');
      params({ x: args.x, lags: args.lags, alpha: args.alpha, zero: args.zero, bartlett_confint: esA ? args.bartlett_confint : '(no aplica)', method: esA ? '(no aplica)' : args.method }, activo === 'fn' ? null : activo);
      const consejos = [];
      if (S.estacional && L < 36) consejos.push('Con datos mensuales usa al menos 36 rezagos para ver los picos de 12, 24 y 36.');
      if (zero) consejos.push('Con <code>zero=True</code> la barra del rezago 0 (=1) aplasta la escala; prueba <code>zero=False</code>.');
      if (!esA && metodo === 'yw' && vals.some((v, k) => k > 0 && Math.abs(v) > 1)) consejos.push('⚠️ El método "yw" dio valores fuera de [−1, 1]: por eso statsmodels recomienda "ywm".');
      if (s.get() === 'serie' || s.get() === 'paseo') consejos.push('Esta serie no es estacionaria: la ACF decae muy lento y no sirve para identificar el modelo. Diferénciala primero.');
      lec.innerHTML = `<b>Barras fuera de la banda:</b> ${fuera.length ? fuera.slice(0, 12).join(', ') + (fuera.length > 12 ? '…' : '') : 'ninguna'}.` + (consejos.length ? '<br>💡 ' + consejos.join('<br>💡 ') : '');
    }
    dibujar();
  };

  // --- acf(..., alpha, qstat=True): la tabla numérica
  W['py-acftabla'] = c => {
    const ctr = lienzo(c);
    let activo = 'nlags';
    const s = seleccion(ctr, { etiqueta: 'Serie (x)', valor: 'dd', opciones: opcionesSeries(['dd', 'ar', 'ma', 'rb', 'serie']) }, () => { activo = 'x'; dibujar(); });
    const nl = slider(ctr, { etiqueta: 'nlags', min: 1, max: 24, paso: 1, valor: 12 }, () => { activo = 'nlags'; dibujar(); });
    const al = segmentado(ctr, { etiqueta: 'alpha', valor: '0.05', opciones: [['0.01', '0.01'], ['0.05', '0.05'], ['0.1', '0.10']] }, () => { activo = 'alpha'; dibujar(); });
    const pc = panelCodigo(c), g = lamina(c), lec = lectura(c);
    function dibujar() {
      const S = SERIES_SIM[s.get()], x = S.x(), n = x.length, L = nl.get(), alpha = Number(al.get());
      const r = TS.acf(x, L), b = TS.acfBandas(x, L, alpha, true), lb = TS.ljungBox(x, L);
      pc.codigo(codigoPython(`from statsmodels.tsa.stattools import acf\n\nx = ${S.def}\nvalores, confint, qstat, pvalores = acf(x, nlags={nlags}, alpha={alpha}, qstat=True)\ntabla = pd.DataFrame({"acf": valores[1:], "inferior": confint[1:, 0], "superior": confint[1:, 1],\n                      "Q": qstat, "p-value": pvalores}, index=range(1, {nlags} + 1))\nprint(tabla.round(4))`, { nlags: L, alpha }, activo));
      const filas = TS.rango(L, 1).map(k => [r[k], r[k] - b[k], r[k] + b[k], lb.filas[k - 1].Q, lb.filas[k - 1].p]);
      pc.salida(tablaTexto(['acf', 'inferior', 'superior', 'Q', 'p-value'], filas, TS.rango(L, 1)));
      graf(g, [
        { x: TS.rango(L, 1), y: lb.filas.map(f => f.p), mode: 'lines+markers', line: { color: PAL.rosa, width: 2.5 }, marker: { size: 6 }, name: 'p-value de Q(k)' },
        { x: [0.5, L + 0.5], y: [alpha, alpha], mode: 'lines', line: { color: PAL.gris, dash: 'dash' }, name: `α = ${alpha}` }
      ], { height: 260, title: { text: 'p-value de Ljung–Box acumulado hasta cada rezago (columna p-value)' }, yaxis: { range: [0, 1.02] }, xaxis: { title: { text: 'k' }, dtick: L > 12 ? 2 : 1 } });
      const cero = TS.rango(L, 1).filter(k => r[k] - b[k] > 0 || r[k] + b[k] < 0);
      lec.innerHTML = `Cada fila es un rezago. <b>inferior/superior</b> = intervalo de ${(100 * (1 - alpha)).toFixed(0)}% alrededor de la ACF (Bartlett): si <b>no contiene al 0</b>, esa autocorrelación es significativa → rezagos ${cero.length ? cero.join(', ') : 'ninguno'}. <b>Q</b> y <b>p-value</b> son Ljung–Box con h = k (todas las autocorrelaciones de 1 a k juntas).`;
    }
    dibujar();
  };

  // --- pandas rolling
  W['py-rolling'] = c => {
    const ctr = lienzo(c);
    let activo = 'window';
    const s = seleccion(ctr, { etiqueta: 'Serie', valor: 'serie', opciones: opcionesSeries(['serie', 'tend', 'rb', 'paseo']) }, () => { activo = 'x'; dibujar(); });
    const w = slider(ctr, { etiqueta: 'window', min: 2, max: 36, paso: 1, valor: 12 }, () => { activo = 'window'; if (mp.get() > w.get()) mp.set(w.get()); dibujar(); });
    const ce = casilla(ctr, 'center=True', false, () => { activo = 'center'; dibujar(); });
    const mpN = casilla(ctr, 'min_periods=None', true, () => { activo = 'min_periods'; dibujar(); });
    const mp = slider(ctr, { etiqueta: 'min_periods (si no es None)', min: 1, max: 36, paso: 1, valor: 1 }, () => { activo = 'min_periods'; dibujar(); });
    const es = segmentado(ctr, { etiqueta: 'Estadístico', valor: 'mean', opciones: [['mean', '.mean()'], ['std', '.std()']] }, () => { activo = 'fn'; dibujar(); });
    const pc = panelCodigo(c), g = lamina(c), lec = lectura(c);
    const params = panelParametros(c, [
      { nombre: 'window', que: 'Cuántos datos entran en cada ventana.', rec: 'Igual al <b>periodo estacional</b> (12 en mensuales, 7 en diarios) para que la estacionalidad no contamine la media.' },
      { nombre: 'center', que: 'False: ventana hacia atrás (termina en t). True: ventana centrada en t.', rec: '<b>False</b> para monitorear en tiempo real; <b>True</b> para describir la tendencia (no se desfasa).' },
      { nombre: 'min_periods', que: 'Mínimo de datos para calcular; si hay menos, da NaN.', rec: '<b>None</b> (= window) para no mezclar ventanas incompletas.' }
    ]);
    function dibujar() {
      const S = SERIES_SIM[s.get()], x = S.x(), W0 = w.get(), cen = ce.get(), m = mpN.get() ? null : Math.min(mp.get(), W0), f = es.get();
      const y = TS.rolling(x, W0, { center: cen, min_periods: m, fn: f }), fechas = S.fechas ? S.fechas() : TS.rango(x.length, 1);
      const ser = S.def.split(' ')[0] === 'serie' ? 'serie' : 'x';
      pc.codigo(codigoPython(`${ser === 'x' ? 'x = pd.Series(' + S.def.split(' ')[0] + ')\n' : ''}movil = ${ser}.rolling(window={window}, center={center}, min_periods={min_periods}).${f}()\nprint(movil.head(8))\nprint("NaN:", movil.isna().sum())`, { window: W0, center: pyv(cen), min_periods: m === null ? 'None' : m }, activo));
      const nan = y.filter(v => v === null).length;
      pc.salida(tablaTexto([f === 'mean' ? 'media' : 'desv'], y.slice(0, 8).map(v => [v === null ? NaN : v]), fechas.slice(0, 8)) + `\nNaN: ${nan}`);
      graf(g, [
        { x: fechas, y: x, mode: 'lines', line: { color: 'rgba(124,105,214,.55)', width: 1.3 }, name: 'serie', yaxis: 'y' },
        { x: fechas, y, mode: 'lines', line: { color: PAL.rosa, width: 3 }, name: `rolling(${W0}).${f}()`, yaxis: f === 'std' ? 'y2' : 'y' }
      ], { height: 320, title: { text: 'Serie y estadístico móvil' }, yaxis2: { overlaying: 'y', side: 'right', showgrid: false, title: { text: 'desv. móvil' } } });
      params({ window: W0, center: pyv(cen), min_periods: m === null ? 'None' : m }, activo);
      lec.innerHTML = `Hay <b>${nan}</b> valores NaN ${cen ? '(repartidos al inicio y al final, porque la ventana centrada necesita datos de ambos lados)' : '(todos al inicio: las primeras ventanas están incompletas)'}.` +
        (S.estacional && W0 % 12 !== 0 && f === 'mean' ? ' 💡 La ventana no es múltiplo de 12: la media móvil conserva ondas estacionales.' : '') +
        (!cen && f === 'mean' ? ' 💡 Con <code>center=False</code> la media móvil va <b>retrasada</b> respecto a la serie (mira cómo la curva rosa llega tarde a los cambios).' : '');
    }
    dibujar();
  };

  // --- seasonal_decompose con sus parámetros
  W['py-decompose'] = c => {
    const ctr = lienzo(c);
    let activo = 'model';
    const mo = segmentado(ctr, { etiqueta: 'model', valor: 'multiplicative', opciones: [['additive', '"additive"'], ['multiplicative', '"multiplicative"']] }, () => { activo = 'model'; dibujar(); });
    const pe = segmentado(ctr, { etiqueta: 'period', valor: 12, opciones: [[6, '6'], [12, '12'], [24, '24']] }, () => { activo = 'period'; dibujar(); });
    const ts = casilla(ctr, 'two_sided=True', true, () => { activo = 'two_sided'; dibujar(); });
    const ex = segmentado(ctr, { etiqueta: 'extrapolate_trend', valor: '0', opciones: [['0', '0'], ['11', '11 (= period − 1)']] }, () => { activo = 'extrapolate_trend'; dibujar(); });
    const pc = panelCodigo(c), g = lamina(c), lec = lectura(c);
    const params = panelParametros(c, [
      { nombre: 'model', que: '"additive": y = T + S + R. "multiplicative": y = T × S × R.', rec: 'Amplitud constante → additive. Amplitud que crece con el nivel → <b>multiplicative</b> (AirPassengers).' },
      { nombre: 'period', que: 'Longitud del ciclo estacional. Si el índice tiene frecuencia, se deduce solo.', rec: '<b>El periodo real</b>: 12 mensual, 4 trimestral, 7 diario-semanal, 24 por hora.' },
      { nombre: 'two_sided', que: 'True: media móvil centrada. False: solo usa datos pasados.', rec: '<b>True</b> para analizar; False solo si necesitas una tendencia «en tiempo real».' },
      { nombre: 'extrapolate_trend', que: '0: deja NaN en los extremos. Un entero k: los rellena con una recta ajustada a los k + 1 datos más cercanos. <code>"period"</code> (statsmodels ≥ 0.15) o <code>"freq"</code> (versiones anteriores) equivalen a period − 1.', rec: '<b>0</b> para estudiar; <b>period − 1</b> si necesitas la tendencia completa (para graficarla o desestacionalizar toda la serie).' }
    ]);
    function dibujar() {
      const modelo = mo.get(), P = Number(pe.get()), dos = ts.get(), e = ex.get(), mult = modelo === 'multiplicative';
      const d = TS.descomponerOpc(TS.datos.airpassengers, P, { modelo: mult ? 'multiplicativo' : 'aditivo', twoSided: dos, extrapolate: Number(e) });
      pc.codigo(codigoPython(`from statsmodels.tsa.seasonal import seasonal_decompose\n\ndec = seasonal_decompose(serie, model={model}, period={period}, two_sided={two_sided}, extrapolate_trend={extrapolate_trend})\nresumen = pd.DataFrame({"observada": dec.observed, "tendencia": dec.trend, "estacional": dec.seasonal, "residuo": dec.resid})\nprint(resumen.head(8))\ndec.plot()`, { model: `"${modelo}"`, period: P, two_sided: pyv(dos), extrapolate_trend: Number(e) }, activo));
      pc.salida(tablaTexto(['observada', 'tendencia', 'estacional', 'residuo'], TS.rango(8).map(i => [TS.datos.airpassengers[i], d.T[i] === null ? NaN : d.T[i], d.S[i], d.R[i] === null ? NaN : d.R[i]]), fechasAP.slice(0, 8)));
      const { tr, L } = apilado([
        { x: fechasAP, y: TS.datos.airpassengers, nombre: 'Observed', color: PAL.lav },
        { x: fechasAP, y: d.T, nombre: 'Trend', color: PAL.rosa },
        { x: fechasAP, y: d.S, nombre: 'Seasonal', color: PAL.cel },
        { x: fechasAP, y: d.R, nombre: 'Resid', color: PAL.dur, modo: 'markers' }
      ], 500, { title: { text: 'dec.plot()' }, margin: { t: 36 } });
      L.shapes = [{ type: 'line', xref: 'paper', x0: 0, x1: 1, yref: 'y4', y0: mult ? 1 : 0, y1: mult ? 1 : 0, line: { color: PAL.gris, dash: 'dot' } }];
      graf(g, tr, L);
      params({ model: `"${modelo}"`, period: P, two_sided: pyv(dos), extrapolate_trend: Number(e) }, activo);
      const nan = d.T.filter(v => v === null).length, R = d.R.filter(v => v !== null);
      const ac12 = TS.acf(R, 12)[12];
      const msj = [];
      msj.push(`La tendencia tiene <b>${nan}</b> NaN ${nan ? (dos ? `(${nan / 2} al inicio y ${nan / 2} al final: la media móvil centrada de orden ${P} los necesita)` : '(todos al inicio)') : '(se extrapolaron con una recta)'}.`);
      if (P === 6) msj.push(`⚠️ Con period = 6 el patrón no coincide con el ciclo real de 12 meses: el residuo conserva la estacionalidad (ρ̂(12) del residuo = ${fmt(ac12)}).`);
      if (P === 24) msj.push('⚠️ period = 24 abarca dos ciclos de 12: el patrón se parece al correcto, pero estima 24 índices con la mitad de datos cada uno y pierde 12 meses de tendencia en cada extremo. Usa el periodo real (12).');
      if (!mult) msj.push('El residuo aditivo forma un embudo: el modelo correcto es el multiplicativo.');
      if (P === 12 && mult) msj.push(Math.abs(ac12) < 0.2 ? `Residuo sin patrón estacional claro (ρ̂(12) = ${fmt(ac12)}): buena descomposición.` : `El residuo es pequeño y sin embudo, aunque conserva algo de estructura (ρ̂(12) = ${fmt(ac12)}): es normal en la descomposición clásica, que supone el mismo patrón estacional todos los años.`);
      lec.innerHTML = msj.join(' ');
    }
    dibujar();
  };

  // --- adfuller con sus parámetros
  W['py-adfuller'] = c => {
    const ctr = lienzo(c);
    let activo = 'regression';
    const s = seleccion(ctr, { etiqueta: 'Serie (x)', valor: 'log', opciones: opcionesSeries(['serie', 'log', 'dlog', 'dd', 'paseo', 'ar', 'tend', 'rb']) }, () => { activo = 'x'; dibujar(); });
    const rg = segmentado(ctr, { etiqueta: 'regression', valor: 'ct', opciones: [['n', '"n"'], ['c', '"c"'], ['ct', '"ct"']] }, () => { activo = 'regression'; dibujar(); });
    const au = segmentado(ctr, { etiqueta: 'autolag', valor: 'AIC', opciones: [['AIC', '"AIC"'], ['BIC', '"BIC"'], ['t-stat', '"t-stat"'], ['None', 'None']] }, () => { activo = 'autolag'; dibujar(); });
    const mlN = casilla(ctr, 'maxlag=None (12·(n/100)^¼)', true, () => { activo = 'maxlag'; dibujar(); });
    const ml = slider(ctr, { etiqueta: 'maxlag (si no es None)', min: 0, max: 20, paso: 1, valor: 4 }, () => { activo = 'maxlag'; dibujar(); });
    const pc = panelCodigo(c), g = lamina(c), dec = el('div', { class: 'w-decision' }), t1 = el('div', { class: 'w-tabla' }), t2 = el('div', { class: 'w-tabla' });
    c.append(dec, t1, t2);
    const lec = lectura(c);
    const params = panelParametros(c, [
      { nombre: 'x', que: 'Serie sin NaN (usa <code>.dropna()</code> después de diferenciar).', rec: 'La serie en la escala que vas a modelar (log si la varianza crece).' },
      { nombre: 'regression', que: 'Términos deterministas: "n" ninguno, "c" constante, "ct" constante + tendencia.', rec: 'Oscila en 0 → "n". Nivel ≠ 0 sin tendencia → <b>"c"</b>. Crece o decrece → <b>"ct"</b>.' },
      { nombre: 'autolag', que: 'Cómo elegir p (rezagos de Δy). None = usar exactamente maxlag.', rec: '<b>"AIC"</b> (por defecto). "BIC" elige menos rezagos; "t-stat" quita rezagos hasta que el último es significativo.' },
      { nombre: 'maxlag', que: 'Máximo de rezagos que se prueban. None = ⌈12·(n/100)^¼⌉.', rec: '<b>None</b>. Súbelo si la serie es estacional y AIC se queda corto (por ejemplo, 13–15 en mensuales).' }
    ]);
    function dibujar() {
      const S = SERIES_SIM[s.get()], x = S.x(), reg = rg.get(), auto = au.get() === 'None' ? null : au.get();
      const N = x.length, ntr = reg === 'n' ? 0 : reg.length, maxDef = Math.min(Math.floor(N / 2) - ntr - 1, Math.ceil(12 * Math.pow(N / 100, 0.25)));
      const mxl = mlN.get() ? null : ml.get();
      const r = TS.adf(x, { regression: reg, autolag: auto, maxlag: mxl });
      pc.codigo(codigoPython(`from statsmodels.tsa.stattools import adfuller\n\nx = ${S.def}\nestad, pval, rezagos, nobs, criticos${auto ? ', mejor_ic' : ''} = adfuller(x, maxlag={maxlag}, regression={regression}, autolag={autolag})\nprint(f"Estadístico ADF : {estad:.4f}")\nprint(f"p-value         : {pval:.4f}")\nprint(f"Rezagos usados  : {rezagos}   (de un máximo de ${mxl === null ? maxDef : mxl})")\nprint(f"Observaciones   : {nobs}")\nfor nivel, valor in criticos.items():\n    print(f"Crítico {nivel:>4}    : {valor:.4f}")`.replace(/\{(estad|pval|rezagos|nobs|nivel|valor)([^}]*)\}/g, '｛$1$2｝'),
        { maxlag: mxl === null ? 'None' : mxl, regression: `"${reg}"`, autolag: auto ? `"${auto}"` : 'None' }, activo).replace(/｛/g, '{').replace(/｝/g, '}'));
      pc.salida(`Estadístico ADF : ${r.stat.toFixed(4)}\np-value         : ${r.p.toFixed(4)}\nRezagos usados  : ${r.lags}   (de un máximo de ${mxl === null ? maxDef : mxl})\nObservaciones   : ${r.nobs}\n` + ['1%', '5%', '10%'].map(k => `Crítico ${k.padStart(4)}    : ${r.crit[k].toFixed(4)}`).join('\n'));
      graf(g, [{ x: S.fechas ? S.fechas() : TS.rango(N, 1), y: x, mode: 'lines', line: { color: PAL.lav, width: 1.5 } }], { height: 230, title: { text: S.nombre }, showlegend: false, margin: { t: 34, b: 30 } });
      const rech = r.p < 0.05;
      dec.innerHTML = `<div class="w-prueba ${rech ? 'rechaza' : 'no-rechaza'}"><h5>Decisión al 5%</h5>τ = <b>${fmt(r.stat)}</b> ${rech ? '&lt;' : '≥'} crítico ${fmt(r.crit['5%'])} → <b>${rech ? 'se rechaza H₀: no hay raíz unitaria' : 'no se rechaza H₀: posible raíz unitaria'}</b></div>`;
      if (auto) {
        const clave = auto === 'BIC' ? 'bic' : auto === 'AIC' ? 'aic' : null;
        t1.innerHTML = `<table><thead><tr><th colspan="4" style="text-align:left">Búsqueda de rezagos (autolag="${auto}"; misma muestra de ${r.candidatos[0].nobs} obs.)</th></tr><tr><th>p</th><th>AIC</th><th>BIC</th><th>t del último regresor</th></tr></thead><tbody>` +
          r.candidatos.map(k => `<tr class="${k.lag === r.lags ? 'suma' : ''}"><td>${k.lag}${k.lag === r.lags ? ' ✓' : ''}</td><td>${k.aic.toFixed(2)}</td><td>${k.bic.toFixed(2)}</td><td>${k.tUltimo.toFixed(2)}</td></tr>`).join('') + '</tbody></table>';
      } else t1.innerHTML = `<p style="margin:6px 0;font-size:.9rem">autolag=None: no hay búsqueda; se usan exactamente <b>${r.lags}</b> rezagos.</p>`;
      const reg2 = r.reg;
      t2.innerHTML = `<table><thead><tr><th colspan="4" style="text-align:left">Regresión final: Δy(t) sobre…</th></tr><tr><th>regresor</th><th>coef.</th><th>EE</th><th>t</th></tr></thead><tbody>` +
        r.nombres.map((nm, j) => `<tr class="${nm === 'y(t-1)' ? 'suma' : ''}"><td>${nm}${nm === 'y(t-1)' ? ' (δ)' : ''}</td><td>${reg2.beta[j].toFixed(4)}</td><td>${reg2.se[j].toFixed(4)}</td><td>${reg2.t[j].toFixed(3)}</td></tr>`).join('') + '</tbody></table>';
      params({ x: S.def.split(' ')[0], regression: `"${reg}"`, autolag: auto ? `"${auto}"` : 'None', maxlag: mxl === null ? `None (= ${maxDef})` : mxl }, activo);
      const msj = [`El estadístico τ es la <b>t del coeficiente de y(t−1)</b> (renglón amarillo de la segunda tabla): ${fmt(r.delta, 4)} / ${fmt(r.se, 4)} = ${fmt(r.stat)}.`];
      if ((s.get() === 'serie' || s.get() === 'log' || s.get() === 'tend') && reg !== 'ct') msj.push('⚠️ Esta serie tiene tendencia: la especificación adecuada es "ct".');
      if (s.get() === 'tend' && reg === 'ct') msj.push('Con "ct" la ADF distingue la tendencia determinística y rechaza la raíz unitaria.');
      if (auto === 'BIC' || auto === 't-stat') msj.push(`Compara con "AIC": cada criterio puede elegir un p distinto y cambiar el p-value.`);
      lec.innerHTML = msj.join(' ');
    }
    dibujar();
  };

  // --- kpss con sus parámetros
  W['py-kpss'] = c => {
    const ctr = lienzo(c);
    let activo = 'regression';
    const s = seleccion(ctr, { etiqueta: 'Serie (x)', valor: 'paseo', opciones: opcionesSeries(['paseo', 'rb', 'ar', 'tend', 'log', 'dd']) }, () => { activo = 'x'; dibujar(); });
    const rg = segmentado(ctr, { etiqueta: 'regression', valor: 'c', opciones: [['c', '"c"'], ['ct', '"ct"']] }, () => { activo = 'regression'; dibujar(); });
    const nl = seleccion(ctr, { etiqueta: 'nlags', valor: 'auto', opciones: [['auto', '"auto" (por defecto)'], ['legacy', '"legacy"'], ['0', '0'], ['4', '4'], ['8', '8'], ['16', '16']] }, () => { activo = 'nlags'; dibujar(); });
    const pc = panelCodigo(c), f = fila(c), g1 = lamina(f), g2 = lamina(f), lec = lectura(c);
    const params = panelParametros(c, [
      { nombre: 'regression', que: '"c": H₀ = estacionaria alrededor de una constante. "ct": alrededor de una tendencia.', rec: 'Sin tendencia → <b>"c"</b>. Con tendencia → <b>"ct"</b> (usa la misma que en ADF).' },
      { nombre: 'nlags', que: 'Rezagos L de Newey–West para la varianza de largo plazo.', rec: '<b>"auto"</b> (Hobijn et al.). Con L muy pequeño la KPSS rechaza de más si hay autocorrelación; con L muy grande pierde potencia.' }
    ]);
    function dibujar() {
      const S = SERIES_SIM[s.get()], x = S.x(), reg = rg.get(), L = ['auto', 'legacy'].includes(nl.get()) ? nl.get() : Number(nl.get());
      const k = TS.kpss(x, { regression: reg, nlags: L });
      pc.codigo(codigoPython(`from statsmodels.tsa.stattools import kpss\n\nx = ${S.def}\nestad, pval, rezagos, criticos = kpss(x, regression={regression}, nlags={nlags})\nprint(f"Estadístico KPSS: ${'{'}estad:.4f${'}'}   p-value: ${'{'}pval:.4f${'}'}   rezagos: ${'{'}rezagos${'}'}")\nprint("Críticos:", criticos)`, { regression: `"${reg}"`, nlags: typeof L === 'string' ? `"${L}"` : L }, activo));
      const pv = k.fueraDeTabla === 'mayor' ? '0.1000' : k.fueraDeTabla === 'menor' ? '0.0100' : k.p.toFixed(4);
      pc.salida(`Estadístico KPSS: ${k.stat.toFixed(4)}   p-value: ${pv}   rezagos: ${k.lags}\nCríticos: {'10%': ${k.crit['10%']}, '5%': ${k.crit['5%']}, '2.5%': ${k.crit['2.5%']}, '1%': ${k.crit['1%']}}` + (k.fueraDeTabla ? `\n⚠ InterpolationWarning: The actual p-value is ${k.fueraDeTabla === 'mayor' ? 'greater' : 'smaller'} than the p-value returned.` : ''));
      const t = TS.rango(x.length, 1);
      graf(g1, [{ x: t, y: k.res, mode: 'lines', line: { color: PAL.lav, width: 1.2 } }], { height: 260, title: { text: `Residuos ê(t) (serie − ${reg === 'c' ? 'media' : 'recta'})` }, showlegend: false });
      graf(g2, [{ x: t, y: k.S, mode: 'lines', line: { color: PAL.rosa, width: 2.4 }, fill: 'tozeroy', fillcolor: 'rgba(224,112,159,.12)' }], { height: 260, title: { text: 'Sumas acumuladas S(t): el corazón de KPSS' }, showlegend: false });
      params({ regression: `"${reg}"`, nlags: typeof L === 'string' ? `"${L}" (= ${k.lags})` : L }, activo);
      const rech = k.p < 0.05;
      lec.className = 'w-lectura ' + (rech ? 'mal' : 'ok');
      lec.innerHTML = `η = (ΣS²/n²) / σ̂²∞ = ${fmt(k.eta, 4)} / ${fmt(k.s2, 4)} = <b>${fmt(k.stat, 4)}</b> ${rech ? '>' : '≤'} ${k.crit['5%']} → <b>${rech ? 'se rechaza la estacionariedad' : 'no se rechaza la estacionariedad'}</b>. ` +
        'Si S(t) hace grandes excursiones lejos de 0, el numerador crece. Cambia <code>nlags</code> y observa que solo cambia el denominador σ̂²∞.';
    }
    dibujar();
  };

  // --- acorr_ljungbox con sus parámetros
  W['py-ljungbox'] = c => {
    const ctr = lienzo(c);
    let activo = 'lags';
    const s = seleccion(ctr, { etiqueta: 'Serie (x)', valor: 'dd', opciones: opcionesSeries(['dd', 'rb', 'ar', 'ma']) }, () => { activo = 'x'; dibujar(); });
    const h = slider(ctr, { etiqueta: 'lags (h máximo)', min: 1, max: 36, paso: 1, valor: 24 }, () => { activo = 'lags'; dibujar(); });
    const lista = casilla(ctr, 'Pasar una lista: lags=[6, 12, 24]', false, () => { activo = 'lags'; dibujar(); });
    const bp = casilla(ctr, 'boxpierce=True', false, () => { activo = 'boxpierce'; dibujar(); });
    const md = slider(ctr, { etiqueta: 'model_df', min: 0, max: 4, paso: 1, valor: 0 }, () => { activo = 'model_df'; dibujar(); });
    const pc = panelCodigo(c), g = lamina(c), lec = lectura(c);
    const params = panelParametros(c, [
      { nombre: 'lags', que: 'Entero h → prueba h = 1, 2, …, h (una fila por cada uno). Lista → solo esos h.', rec: 'No estacional: <b>10</b>. Mensual: <b>24</b> (2 periodos). Lista útil: <code>[12, 24]</code>.' },
      { nombre: 'boxpierce', que: 'Agrega también el estadístico de Box–Pierce (Q = nΣρ̂²).', rec: '<b>False</b>: Ljung–Box es mejor con muestras pequeñas.' },
      { nombre: 'model_df', que: 'Parámetros estimados del modelo (p + q); se restan de los grados de libertad.', rec: '<b>0</b> para una serie; <b>p + q</b> para residuos de un ARMA(p, q).' }
    ]);
    function dibujar() {
      const S = SERIES_SIM[s.get()], x = S.x(), H = h.get(), lags = lista.get() ? [6, 12, 24] : TS.rango(H, 1), m = md.get();
      const tab = TS.ljungBoxTabla(x, lags, { boxpierce: bp.get(), model_df: m });
      pc.codigo(codigoPython(`from statsmodels.stats.diagnostic import acorr_ljungbox\n\nx = ${S.def}\nres = acorr_ljungbox(x, lags={lags}, boxpierce={boxpierce}, model_df={model_df})\nprint(res${lista.get() ? '' : '.tail(6)'})`, { lags: lista.get() ? '[6, 12, 24]' : H, boxpierce: pyv(bp.get()), model_df: m }, activo));
      const vis = lista.get() ? tab : tab.slice(-6);
      const cols = bp.get() ? ['lb_stat', 'lb_pvalue', 'bp_stat', 'bp_pvalue'] : ['lb_stat', 'lb_pvalue'];
      pc.salida(tablaTexto(cols, vis.map(f => cols.map(k => f[k])), vis.map(f => f.lag)));
      const trs = [{ x: tab.map(f => f.lag), y: tab.map(f => isNaN(f.lb_pvalue) ? null : f.lb_pvalue), mode: 'lines+markers', line: { color: PAL.rosa, width: 2.5 }, name: 'lb_pvalue' }];
      if (bp.get()) trs.push({ x: tab.map(f => f.lag), y: tab.map(f => isNaN(f.bp_pvalue) ? null : f.bp_pvalue), mode: 'lines+markers', line: { color: PAL.cel, width: 2, dash: 'dot' }, name: 'bp_pvalue' });
      trs.push({ x: [0.5, Math.max(...lags) + 0.5], y: [0.05, 0.05], mode: 'lines', line: { color: PAL.gris, dash: 'dash' }, name: '0.05' });
      graf(g, trs, { height: 280, title: { text: 'p-value para cada h' }, yaxis: { range: [0, 1.02] }, xaxis: { title: { text: 'h' } } });
      params({ lags: lista.get() ? '[6, 12, 24]' : H, boxpierce: pyv(bp.get()), model_df: m }, activo);
      const ult = tab[tab.length - 1];
      lec.innerHTML = `Con h = ${ult.lag}: Q = ${fmt(ult.lb_stat)} con ${ult.lag - m} grados de libertad, p = ${isNaN(ult.lb_pvalue) ? 'NaN' : fp(ult.lb_pvalue)} → ${ult.lb_pvalue < 0.05 ? '<b>hay autocorrelación</b>' : '<b>no hay evidencia de autocorrelación</b>'}.` +
        (m > 0 ? ` Con model_df = ${m}, los h ≤ ${m} dan p-value NaN (grados de libertad ≤ 0).` : '') +
        (s.get() === 'dd' ? ' 💡 Para esta serie mensual mira sobre todo h = 12 y h = 24.' : '');
    }
    dibujar();
  };

  // --- Transformaciones encadenadas en pandas
  W['py-transformar'] = c => {
    const ctr = lienzo(c);
    let activo = 'log';
    const lg = casilla(ctr, 'np.log(...)', true, () => { activo = 'log'; dibujar(); });
    const d1 = casilla(ctr, '.diff()  (regular)', false, () => { activo = 'd1'; dibujar(); });
    const d12 = casilla(ctr, '.diff(12)  (estacional)', false, () => { activo = 'd12'; dibujar(); });
    const pc = panelCodigo(c), f = fila(c), g1 = lamina(f), g2 = lamina(f), lec = lectura(c);
    function dibujar() {
      let x = TS.datos.airpassengers.slice(), cad = 'serie', pasos = [];
      if (lg.get()) { x = x.map(Math.log); cad = 'np.log(serie)'; pasos.push('log'); }
      if (d12.get()) { x = TS.diff(x, 12); cad += '.diff(12)'; pasos.push('Δ₁₂'); }
      if (d1.get()) { x = TS.diff(x); cad += '.diff()'; pasos.push('Δ'); }
      const n = x.length, fechas = fechasAP.slice(144 - n), r = TS.acf(x, 36);
      const reg = d1.get() || d12.get() ? 'c' : 'ct', a = TS.adf(x, { regression: reg }), k = TS.kpss(x, { regression: reg }), lb = TS.ljungBox(x, 24);
      pc.codigo(codigoPython(`y = {cadena}\nprint(y.head(4))\nprint("n =", len(y))\nprint("ADF p :", round(adfuller(y, regression="${reg}")[1], 4))\nprint("KPSS p:", round(kpss(y, regression="${reg}", nlags="auto")[1], 4))\nprint("ρ(1), ρ(12):", np.round(acf(y, nlags=12)[[1, 12]], 3))`, { cadena: cad + (d1.get() || d12.get() ? '.dropna()' : '') }, 'cadena'));
      const pk = k.fueraDeTabla === 'mayor' ? 0.1 : k.fueraDeTabla === 'menor' ? 0.01 : k.p;
      pc.salida(tablaTexto(['y'], x.slice(0, 4).map(v => [v]), fechas.slice(0, 4)) + `\nn = ${n}\nADF p : ${a.p.toFixed(4)}\nKPSS p: ${pk.toFixed(4)}\nρ(1), ρ(12): [${r[1].toFixed(3)} ${r[12].toFixed(3)}]`);
      graf(g1, [{ x: fechas, y: x, mode: 'lines', line: { color: d1.get() && d12.get() ? PAL.menta : PAL.lav, width: 1.5 } }], { height: 270, title: { text: pasos.length ? pasos.join(' → ') : 'serie original' }, showlegend: false });
      graf(g2, trazasACF(r, n), layoutACF('ACF de y', { height: 270 }));
      const est = a.p < 0.05 && pk >= 0.05;
      lec.className = 'w-lectura ' + (est && Math.abs(r[12]) < 0.5 ? 'ok' : '');
      lec.innerHTML = `ADF (${reg}) ${a.p < 0.05 ? 'rechaza' : 'no rechaza'} la raíz unitaria; KPSS ${pk < 0.05 ? 'rechaza' : 'no rechaza'} la estacionariedad; Ljung–Box(24) p = ${fp(lb.p)}. ` +
        (!lg.get() ? '💡 Sin log, la amplitud estacional crece con el nivel. ' : '') + (Math.abs(r[12]) > 0.5 ? '💡 ρ̂(12) alto: falta la diferencia estacional. ' : '') + (Math.abs(r[1]) > 0.6 ? '💡 ρ̂(1) alto: falta la diferencia regular. ' : '') +
        (lg.get() && d1.get() && d12.get() ? '✓ Esta es la transformación mínima que deja la serie estacionaria.' : '') +
        ' <i>El orden de .diff() y .diff(12) no cambia el resultado (las diferencias conmutan).</i>';
    }
    dibujar();
  };

  /* --------------------------- Carga diferida --------------------------- */
  function iniciar(contenedor) {
    if (contenedor.dataset.listo) return;
    contenedor.dataset.listo = '1';
    const nombre = contenedor.dataset.widget;
    let op = {};
    try { op = JSON.parse(contenedor.dataset.opciones || '{}'); } catch (e) { op = {}; }
    librerias().then(() => {
      const fn = W[nombre];
      if (!fn) { contenedor.innerHTML = '<div class="w-cargando">Gráfica no disponible: ' + nombre + '</div>'; return; }
      try { fn(contenedor, op); } catch (e) {
        contenedor.innerHTML = '<div class="w-cargando">No se pudo dibujar esta gráfica.</div>';
        if (window.console) console.error('Widget ' + nombre, e);
      }
    }).catch(() => {
      contenedor.dataset.listo = '';
      contenedor.innerHTML = '<div class="w-cargando">No se pudieron cargar las librerías de gráficas. Revisa tu conexión a internet y recarga la página.</div>';
    });
  }
  window.GUIA_UTIL = { PAL, MESES, el, fmt, fp, num, kpi, ref, tex, mezcla, barajar, fracc, simAR, control, slider, seleccion, segmentado, boton, casilla, lienzo, lamina, fila, lectura,
    combinar, graf, banda, trazasACF, layoutACF, apilado, tablaHTML, extra, dispersion, codigoPython, pyv, panelCodigo, tablaTexto, panelParametros, tallos,
    datos: (() => { try { return JSON.parse(document.getElementById('datos-unidad').textContent || '{}'); } catch (e) { return {}; } })() };
  window.GUIA_REGISTRAR = (nombre, fn) => { W[nombre] = fn; };
  function arrancar() {
  const widgets = Array.from(document.querySelectorAll('.widget[data-widget]'));
  if ('IntersectionObserver' in window) {
    const obs = new IntersectionObserver(entradas => {
      entradas.forEach(e => { if (e.isIntersecting) { obs.unobserve(e.target); iniciar(e.target); } });
    }, { rootMargin: '600px 0px' });
    widgets.forEach(w => obs.observe(w));
  } else {
    widgets.forEach(iniciar);
  }
  window.GUIA_WIDGETS = { iniciarTodos: () => widgets.forEach(iniciar), lista: () => Object.keys(W) };
  }
  // Se arranca en DOMContentLoaded para que los scripts de cada unidad (widgets2.js…) ya hayan registrado sus gráficas.
  if (document.readyState === 'complete') arrancar(); else document.addEventListener('DOMContentLoaded', arrancar);
})();
