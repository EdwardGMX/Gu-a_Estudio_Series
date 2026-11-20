/* =====================================================================
   lab.js — Gráficas y tablas fijas del Laboratorio.
   Cada paso del flujo exporta desde Python (al generar la página) los
   resultados de su código; aquí se dibujan con el mismo estilo que las
   gráficas de la guía (widgets.js). Las gráficas lab-control traen varias
   versiones ya calculadas en Python y un control para elegir cuál ver.
   ===================================================================== */
(function () {
  'use strict';
  const U = window.GUIA_UTIL, R = window.GUIA_REGISTRAR;
  if (!U || !R) return;
  const { el, graf, tablaHTML, lamina, slider, segmentado, combinar } = U;
  const DATOS = U.datos || {};

  R('lab-graf', (c, op) => {
    const spec = DATOS[op.id];
    if (!spec) { c.innerHTML = '<div class="w-cargando">Falta la gráfica ' + op.id + '</div>'; return; }
    c.innerHTML = '';
    c.classList.add('lab-graf');
    const L = Object.assign({ height: spec.alto || 320 }, spec.l || {});
    if (!L.legend && (spec.t || []).filter(t => t.showlegend !== false && t.name).length > 1) L.legend = { orientation: 'h', y: -0.2 };
    graf(lamina(c), spec.t, L);
    if (spec.nota) c.append(el('p', { class: 'lab-nota', html: spec.nota }));
  });

  R('lab-tabla', (c, op) => {
    const spec = DATOS[op.id];
    if (!spec) { c.innerHTML = '<div class="w-cargando">Falta la tabla ' + op.id + '</div>'; return; }
    c.innerHTML = '';
    c.classList.add('lab-tabla');
    if (spec.titulo) c.append(el('div', { class: 'lab-tabla-tit', html: spec.titulo }));
    const t = el('div', { class: 'w-tabla' });
    t.innerHTML = tablaHTML(spec.cols, spec.filas, spec.clases || []);
    c.append(t);
    if (spec.nota) c.append(el('p', { class: 'lab-nota', html: spec.nota }));
  });
  // Gráfica con controles: cada combinación de los controles es una versión precalculada
  R('lab-control', (c, op) => {
    const spec = DATOS[op.id];
    if (!spec) { c.innerHTML = '<div class="w-cargando">Falta la gráfica ' + op.id + '</div>'; return; }
    c.innerHTML = '';
    c.classList.add('lab-graf', 'lab-control');
    const ctr = el('div', { class: 'w-controles' });
    c.append(ctr);
    const ctrls = spec.controles.map(k => (k.tipo === 'seg'
      ? segmentado(ctr, { etiqueta: k.etiqueta, valor: String(k.inicial || 0), opciones: k.textos.map((t, i) => [String(i), t]) }, dibujar)
      : slider(ctr, { etiqueta: k.etiqueta, min: 0, max: k.textos.length - 1, paso: 1, valor: k.inicial || 0, fmt: v => k.textos[v] }, dibujar)));
    const g = lamina(c);
    const lec = spec.textos ? el('div', { class: 'w-lectura' }) : null;
    if (lec) c.append(lec);
    function indice() {
      let i = 0;
      spec.controles.forEach((k, j) => { i = i * k.textos.length + Number(ctrls[j].get()); });
      return i;
    }
    function dibujar() {
      const i = indice();
      const L = combinar(combinar({ height: spec.alto || 320 }, spec.l || {}), (spec.lv || [])[i] || {});
      const t = (spec.base || []).concat(spec.variantes[i] || []);
      if (!L.legend && t.filter(x => x.showlegend !== false && x.name).length > 1) L.legend = { orientation: 'h', y: -0.2 };
      graf(g, t, L);
      if (lec) lec.innerHTML = spec.textos[i] || '';
    }
    dibujar();
    if (spec.nota) c.append(el('p', { class: 'lab-nota', html: spec.nota }));
  });

  // Gráfica animada: cuadros precalculados en Python que avanzan solos (▶) o con la barra.
  // Cada cuadro trae sus trazas, su texto explicativo y, si hace falta, cambios del layout.
  // Arranca sola la primera vez que se ve en pantalla.
  R('lab-anim', (c, op) => {
    const spec = DATOS[op.id];
    if (!spec) { c.innerHTML = '<div class="w-cargando">Falta la animación ' + op.id + '</div>'; return; }
    c.innerHTML = '';
    c.classList.add('lab-graf', 'lab-anim');
    const n = spec.variantes.length;
    const etq = spec.etiquetas || spec.variantes.map((_, i) => String(i + 1));
    const ctr = el('div', { class: 'w-controles lab-anim-ctr' });
    c.append(ctr);
    const play = el('button', { type: 'button', class: 'w-btn lab-play', 'aria-label': 'Reproducir' }, '▶ Reproducir');
    ctr.append(play);
    const barra = slider(ctr, { etiqueta: spec.etiqueta || 'Cuadro', min: 0, max: n - 1, paso: 1, valor: 0, fmt: v => etq[v] },
      () => { parar(); dibujar(); });
    const g = lamina(c);
    const lec = el('div', { class: 'w-lectura lab-anim-txt' });
    if (spec.textos) c.append(lec);
    const vel = spec.vel || 1400;
    let timer = null, yaArranco = false;
    function dibujar() {
      const i = barra.get();
      const L = combinar(combinar({ height: spec.alto || 340 }, spec.l || {}), (spec.lv || [])[i] || {});
      if (spec.suave && timer) L.transition = { duration: Math.min(450, vel * 0.5), easing: 'cubic-in-out' };
      const t = (spec.base || []).concat(spec.variantes[i] || []);
      if (!L.legend && t.filter(x => x.showlegend !== false && x.name).length > 1) L.legend = { orientation: 'h', y: -0.2 };
      graf(g, t, L);
      if (spec.textos) lec.innerHTML = spec.textos[i] || '';
    }
    function paso() {
      const i = barra.get();
      if (i >= n - 1) { parar(); return; }
      barra.set(i + 1);
      dibujar();
      timer = setTimeout(paso, (spec.pausas && spec.pausas[i + 1]) || vel);
    }
    function arrancar() {
      if (barra.get() >= n - 1) { barra.set(0); dibujar(); }
      play.textContent = '⏸ Pausa';
      play.classList.add('on');
      timer = setTimeout(paso, (spec.pausas && spec.pausas[barra.get()]) || vel);
    }
    function parar() {
      if (timer) clearTimeout(timer);
      timer = null;
      play.textContent = barra.get() >= n - 1 ? '↺ Repetir' : '▶ Reproducir';
      play.classList.remove('on');
    }
    play.addEventListener('click', () => { if (timer) parar(); else arrancar(); });
    dibujar();
    if (spec.nota) c.append(el('p', { class: 'lab-nota', html: spec.nota }));
    if ('IntersectionObserver' in window) {
      const obs = new IntersectionObserver(es => {
        es.forEach(e => {
          if (e.isIntersecting && !yaArranco) { yaArranco = true; obs.disconnect(); arrancar(); }
        });
      }, { threshold: 0.6 });
      obs.observe(c);
    }
  });
})();
