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
    padre.append(el('label', { class: 'w-control w-check' }, i, el('span', {}, texto)));
    return { get: () => i.checked };
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

  // 1.1 Realizaciones de un proceso
  W.realizaciones = c => {
    const ctr = lienzo(c), n = 100;
    let base = 1, sel = 0;
    const proc = seleccion(ctr, { etiqueta: 'Proceso', valor: 'ar', opciones: [['ar', 'AR(1) con φ = 0.8'], ['paseo', 'Paseo aleatorio'], ['ruido', 'Ruido blanco']] }, dibujar);
    boton(ctr, 'Observar otra historia', () => { sel = (sel + 1) % 8; dibujar(); });
    boton(ctr, 'Nuevas historias', () => { base += 37; dibujar(); }, 'sec');
    const ens = casilla(ctr, 'Mostrar media del conjunto (200 historias)', false, dibujar);
    const g = lamina(c), lec = lectura(c);
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
    }
    dibujar();
  };

  // 1.4 Barajar los datos
  W.barajar = c => {
    const ctr = lienzo(c);
    let barajada = false, semilla = 3;
    const datos = seleccion(ctr, { etiqueta: 'Serie', valor: 'ap', opciones: [['ap', 'AirPassengers'], ['ar', 'AR(1) simulado (φ = 0.85)']] }, () => { barajada = false; dibujar(); });
    const bt = boton(ctr, '🔀 Barajar los datos', () => { barajada = !barajada; if (barajada) semilla++; dibujar(); });
    const f = fila(c), g1 = lamina(f), g2 = lamina(f), lec = lectura(c);
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
    }
    dibujar();
  };

  // 2.2 Gráfica estacional
  W.estacional = c => {
    const ctr = lienzo(c);
    const modo = segmentado(ctr, { etiqueta: 'Vista', valor: 'lineas', opciones: [['lineas', 'Una línea por año'], ['caja', 'Boxplot por mes']] }, dibujar);
    const lg = casilla(ctr, 'Usar logaritmo', false, dibujar);
    const g = lamina(c), lec = lectura(c);
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
    }
    dibujar();
  };

  // 2.3 Lag plot
  W.rezagos = c => {
    const ctr = lienzo(c);
    const series = { ar: TS.sim.ar1(200, 0.8, { semilla: 21 }), arn: TS.sim.ar1(200, -0.7, { semilla: 22 }), rb: TS.sim.ruido(200, { semilla: 23 }), ap: TS.datos.airpassengers };
    const s = seleccion(ctr, { etiqueta: 'Serie', valor: 'ar', opciones: [['ar', 'AR(1) con φ = 0.8'], ['arn', 'AR(1) con φ = −0.7'], ['rb', 'Ruido blanco'], ['ap', 'AirPassengers']] }, dibujar);
    const k = slider(ctr, { etiqueta: 'Rezago k', min: 1, max: 24, paso: 1, valor: 1 }, dibujar);
    const f = fila(c), g1 = lamina(f), g2 = lamina(f), lec = lectura(c);
    function dibujar() {
      const x = series[s.get()], kk = k.get(), n = x.length, r = TS.acf(x, 24), b = 1.96 / Math.sqrt(n);
      graf(g1, [{ x: x.slice(0, n - kk), y: x.slice(kk), mode: 'markers', marker: { color: 'rgba(124,105,214,.55)', size: 6, line: { color: '#fff', width: 0.5 } }, hovertemplate: 'y(t−k) = %{x:.2f}<br>y(t) = %{y:.2f}<extra></extra>' }],
        { height: 320, title: { text: `Lag plot, k = ${kk}: ρ̂(${kk}) = ${fmt(r[kk])}` }, xaxis: { title: { text: `y(t−${kk})` } }, yaxis: { title: { text: 'y(t)' } }, showlegend: false });
      graf(g2, trazasACF(r, n, { resaltar: kk }), layoutACF('Correlograma (rosa = el rezago del lag plot)', { height: 320 }));
      lec.innerHTML = `Con k = ${kk} hay n − k = <b>${n - kk}</b> parejas. ` +
        (Math.abs(r[kk]) > b ? `La autocorrelación es <b>significativa</b> (sale de la banda ±${fmt(b)}). ` : 'La autocorrelación queda <b>dentro</b> de la banda: no es significativa. ') +
        (r[kk] > 0.3 ? 'La nube sube: valores altos siguen a valores altos.' : r[kk] < -0.3 ? 'La nube baja: la serie alterna.' : 'La nube es casi redonda.');
    }
    dibujar();
  };

  // 2.4 Media y desviación móviles
  W.moviles = c => {
    const ctr = lienzo(c);
    const S = { rb: TS.sim.ruido(200, { semilla: 31, media: 10 }), tend: TS.sim.tendencia(200, { a: 5, b: 0.05, semilla: 32 }), het: TS.sim.heteroc(200, { factor: 4, semilla: 33 }), ap: TS.datos.airpassengers };
    const s = seleccion(ctr, { etiqueta: 'Serie', valor: 'rb', opciones: [['rb', 'Ruido blanco (estacionaria)'], ['tend', 'Tendencia + ruido'], ['het', 'Varianza creciente'], ['ap', 'AirPassengers']] }, dibujar);
    const w = slider(ctr, { etiqueta: 'Ventana m', min: 4, max: 36, paso: 1, valor: 12 }, dibujar);
    const g = lamina(c), lec = lectura(c);
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
    const f = fila(c), g1 = lamina(f), g2 = lamina(f), lec = lectura(c);
    const fechas = TS.datos.fechasMensuales(1949, 144);
    function dibujar() {
      const lg = esc.get() === 'log', x = TS.datos.airpassengers.map(v => lg ? Math.log(v) : v);
      graf(g1, [{ x: fechas, y: x, mode: 'lines', line: { color: lg ? PAL.menta : PAL.lav, width: 2 } }], { height: 300, title: { text: lg ? 'ln(pasajeros)' : 'Pasajeros' }, showlegend: false });
      const rangos = TS.rango(12).map(a => { const b = x.slice(12 * a, 12 * a + 12); return Math.max(...b) - Math.min(...b); });
      graf(g2, [{ type: 'bar', x: TS.rango(12, 1949).map(String), y: rangos, marker: { color: lg ? PAL.menta : PAL.dur }, hovertemplate: '%{x}: %{y:.3f}<extra></extra>' }], { height: 300, title: { text: 'Rango de cada año (máx − mín)' }, showlegend: false, yaxis: { rangemode: 'tozero' } });
      lec.className = 'w-lectura ' + (lg ? 'ok' : 'mal');
      lec.innerHTML = `El rango de 1960 es <b>${fmt(rangos[11] / rangos[0], 2)}</b> veces el de 1949` + (lg ? ': casi igual. En logaritmos la amplitud es <b>estable</b>.' : ': la amplitud <b>crece</b> con el nivel (modelo multiplicativo).');
    }
    dibujar();
  };

  // 3.7 Media móvil centrada
  W.mediamovil = c => {
    const ctr = lienzo(c);
    let semilla = 51;
    const v = segmentado(ctr, { etiqueta: 'Ventana', valor: 4, opciones: [[3, '3'], [4, '4 (2×4)'], [5, '5'], [8, '8 (2×8)']] }, dibujar);
    boton(ctr, 'Nuevo ruido', () => { semilla++; dibujar(); }, 'sec');
    const g1 = lamina(c), g2 = lamina(c, 'min-height:200px'), lec = lectura(c);
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
    }
    dibujar();
  };

  // 3.8 Descomposición clásica de AirPassengers
  W.descomposicion = c => {
    const ctr = lienzo(c);
    const mod = segmentado(ctr, { etiqueta: 'Modelo', valor: 'multiplicativo', opciones: [['aditivo', 'Aditivo'], ['multiplicativo', 'Multiplicativo']] }, dibujar);
    const g = lamina(c), tabla = el('div', { class: 'w-tabla' }), lec = el('div', { class: 'w-lectura' });
    c.append(tabla, lec);
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
    const f = fila(c), g1 = lamina(f), g2 = lamina(f), lec = lectura(c);
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
    }
    dibujar();
  };

  // 5.8 Abanico de trayectorias
  W.abanico = c => {
    const ctr = lienzo(c);
    let semilla = 81;
    const pr = segmentado(ctr, { etiqueta: 'Proceso', valor: 'paseo', opciones: [['paseo', 'Paseo aleatorio'], ['ar', 'AR(1) con φ = 0.5']] }, dibujar);
    boton(ctr, 'Nuevas trayectorias', () => { semilla += 300; dibujar(); }, 'sec');
    const g = lamina(c), lec = lectura(c);
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
    }
    dibujar();
  };

  // 5.9 Respuesta al impulso y raíz
  W.choque = c => {
    const ctr = lienzo(c);
    const ph = slider(ctr, { etiqueta: 'φ', min: 0, max: 1.05, paso: 0.01, valor: 0.9, fmt: v => v.toFixed(2) }, dibujar);
    const tm = slider(ctr, { etiqueta: 'Tamaño del choque', min: 1, max: 20, paso: 1, valor: 10 }, dibujar);
    const f = fila(c), g1 = lamina(f), g2 = lamina(f), lec = lectura(c);
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
    }
    dibujar();
  };

  // 5.10 Tendencia determinística vs estocástica
  W.tendencias = c => {
    const ctr = lienzo(c);
    let semilla = 91;
    const tt = segmentado(ctr, { etiqueta: 'Tratamiento', valor: 'orig', opciones: [['orig', 'Original'], ['recta', 'Restar la recta'], ['dif', 'Diferenciar']] }, dibujar);
    boton(ctr, 'Nuevos choques', () => { semilla++; dibujar(); }, 'sec');
    const g = lamina(c), lec = lectura(c);
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
    }
    dibujar();
  };

  // 5.11 Diferenciación
  W.diferencias = c => {
    const ctr = lienzo(c);
    const s = seleccion(ctr, { etiqueta: 'Serie', valor: 'deriva', opciones: [['deriva', 'Paseo con deriva'], ['cuad', 'Tendencia cuadrática'], ['est', 'Estacionalidad que se acumula (s = 12)'], ['ap', 'ln AirPassengers']] }, dibujar);
    const op = segmentado(ctr, { etiqueta: 'Transformación', valor: 'orig', opciones: [['orig', 'Original'], ['d1', 'Δ'], ['d2', 'Δ²'], ['ds', 'Δ₁₂'], ['d1ds', 'Δ Δ₁₂']] }, dibujar);
    const f = fila(c), g1 = lamina(f), g2 = lamina(f), lec = lectura(c);
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
    const g = lamina(c), lec = lectura(c);
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
    const g = lamina(c), lec = lectura(c);
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
    const g = lamina(c), lec = lectura(c);
    function dibujar() {
      const n = NS[nn.get()], x = TS.sim.ruido(n, { semilla }), K = Math.min(40, n - 1), r = TS.acf(x, K), b = 1.96 / Math.sqrt(n);
      const fuera = r.slice(1).filter(v => Math.abs(v) > b).length;
      graf(g, trazasACF(r, n), layoutACF(`ACF de ruido blanco con n = ${n}`, { height: 300, yaxis: { range: [-0.6, 0.6] } }));
      lec.innerHTML = `Banda: ±1.96/√${n} = <b>±${fmt(b)}</b> · barras fuera: <b>${fuera} de ${K}</b> (${fmt(100 * fuera / K, 1)}%; se espera alrededor de 5%).`;
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
    const g = lamina(c), lec = lectura(c);
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
})();
