/* =====================================================================
   lab.js — Gráficas y tablas fijas del Laboratorio.
   Cada paso del flujo exporta desde Python (al generar la página) los
   resultados de su código; aquí se dibujan con el mismo estilo que las
   gráficas de la guía (widgets.js). No hay controles: son los resultados.
   ===================================================================== */
(function () {
  'use strict';
  const U = window.GUIA_UTIL, R = window.GUIA_REGISTRAR;
  if (!U || !R) return;
  const { el, graf, tablaHTML, lamina } = U;
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
})();
