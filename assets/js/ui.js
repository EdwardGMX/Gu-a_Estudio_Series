/* =====================================================================
   ui.js — Interacción general de la guía: explicación de símbolos,
   enlaces de regreso, índice, copiar código y ejercicios.
   ===================================================================== */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const guardar = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sin almacenamiento */ } };
  const leer = (k, d) => { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } };

  /* ------------------ Explicación de símbolos (tooltip) ------------------ */
  let GLOS = {};
  try { GLOS = JSON.parse($('#glosario').textContent); } catch (e) { GLOS = {}; }
  const tip = $('#tooltip');
  let activo = null, fijado = false;

  function contenidoTip(clave) {
    const g = GLOS[clave];
    if (!g) return null;
    return `<div class="tt-cab"><span class="tt-sim">${g.s}</span><span class="tt-nom">${g.n}</span></div><div class="tt-desc">${g.d}</div>`;
  }
  function mostrar(el) {
    const html = contenidoTip(el.getAttribute('data-tip'));
    if (!html) return;
    if (activo && activo !== el) activo.classList.remove('tip-activo');
    activo = el;
    el.classList.add('tip-activo');
    tip.innerHTML = html;
    tip.hidden = false;
    const r = el.getBoundingClientRect();
    const w = tip.offsetWidth, h = tip.offsetHeight, m = 10;
    let x = r.left + r.width / 2 - w / 2;
    x = Math.max(m, Math.min(x, window.innerWidth - w - m));
    let y = r.top - h - 10;
    if (y < 70) y = r.bottom + 10;
    tip.style.left = x + 'px';
    tip.style.top = y + 'px';
  }
  function ocultar() {
    tip.hidden = true;
    if (activo) activo.classList.remove('tip-activo');
    activo = null;
    fijado = false;
  }
  document.addEventListener('mouseover', e => {
    if (fijado) return;
    const el = e.target.closest && e.target.closest('[data-tip]');
    if (el) mostrar(el);
  });
  document.addEventListener('mouseout', e => {
    if (fijado || !activo) return;
    const hacia = e.relatedTarget;
    if (!hacia || !activo.contains(hacia)) {
      const otro = hacia && hacia.closest && hacia.closest('[data-tip]');
      if (otro) mostrar(otro); else ocultar();
    }
  });
  document.addEventListener('click', e => {
    const el = e.target.closest && e.target.closest('[data-tip]');
    if (el) { mostrar(el); fijado = true; e.stopPropagation(); return; }
    if (fijado) ocultar();
  });
  window.addEventListener('scroll', () => { if (!tip.hidden) ocultar(); }, { passive: true });

  /* ------------------ Enlaces de referencia y "volver" ------------------ */
  const pila = [];
  const btnVolver = $('#btn-volver');
  function actualizarVolver() {
    btnVolver.hidden = pila.length === 0;
    btnVolver.querySelector('span').textContent = pila.length > 1 ? `Volver a donde estabas (${pila.length})` : 'Volver a donde estabas';
  }
  function destellar(el) {
    el.classList.remove('destello');
    void el.offsetWidth;
    el.classList.add('destello');
    setTimeout(() => el.classList.remove('destello'), 2300);
  }
  function irA(id, origen) {
    const destino = document.getElementById(id);
    if (!destino) return;
    // Se guarda el enlace de origen y su altura en la ventana: así el regreso es exacto
    // aunque las gráficas que se dibujan al pasar cambien la altura de la página.
    if (origen) { pila.push({ el: origen, dy: origen.getBoundingClientRect().top, y: window.scrollY }); actualizarVolver(); }
    if (destino.tagName === 'DETAILS') destino.open = true;
    const padreDetalles = destino.closest('details');
    if (padreDetalles) padreDetalles.open = true;
    destino.scrollIntoView({ behavior: 'smooth', block: 'start' });
    destellar(destino);
    cerrarIndice();
  }
  document.addEventListener('click', e => {
    const a = e.target.closest && e.target.closest('a.ref');
    if (!a || !a.getAttribute('href').startsWith('#')) return;
    e.preventDefault();
    irA(a.getAttribute('href').slice(1), a);
  });
  const alturaOrigen = p => (p.el && p.el.isConnected ? p.el.getBoundingClientRect().top + window.scrollY - p.dy : p.y);
  btnVolver.addEventListener('click', () => {
    const p = pila.pop();
    if (!p) return;
    window.scrollTo({ top: alturaOrigen(p), behavior: 'smooth' });
    actualizarVolver();
    // Corrección final por si algo cambió de tamaño durante el desplazamiento
    setTimeout(() => { const y = alturaOrigen(p); if (Math.abs(window.scrollY - y) > 30) window.scrollTo({ top: y }); }, 1100);
  });

  /* ------------------------------ Índice ------------------------------ */
  const indice = $('#indice'), velo = $('#velo'), btnMenu = $('#btn-menu');
  function cerrarIndice() {
    indice.classList.remove('abierto');
    velo.hidden = true;
    btnMenu.setAttribute('aria-expanded', 'false');
  }
  btnMenu.addEventListener('click', () => {
    const abrir = !indice.classList.contains('abierto');
    indice.classList.toggle('abierto', abrir);
    velo.hidden = !abrir;
    btnMenu.setAttribute('aria-expanded', String(abrir));
  });
  velo.addEventListener('click', cerrarIndice);
  $$('.toc a').forEach(a => a.addEventListener('click', () => cerrarIndice()));

  // Sección activa según el scroll
  const enlaces = new Map($$('.toc a[data-id]').map(a => [a.dataset.id, a]));
  const titulos = $$('main h2[id], main h3[id]');
  let marcado = null;
  function seccionActual() {
    const lim = 140;
    let actual = null;
    for (const t of titulos) {
      if (t.getBoundingClientRect().top - lim <= 0) actual = t; else break;
    }
    if (!actual || actual === marcado) return;
    marcado = actual;
    $$('.toc a.activo').forEach(a => a.classList.remove('activo'));
    const a = enlaces.get(actual.id);
    if (a) a.classList.add('activo');
    const sec = actual.closest('.seccion');
    $$('.toc .t-sec').forEach(li => li.classList.toggle('abierta', !!sec && li.dataset.seccion === sec.dataset.seccion));
    if (a && indice.scrollHeight > indice.clientHeight) {
      const r = a.getBoundingClientRect(), ri = indice.getBoundingClientRect();
      if (r.top < ri.top + 40 || r.bottom > ri.bottom - 40) indice.scrollTop += r.top - ri.top - ri.height / 3;
    }
  }
  const barra = $('#barra-progreso span'), btnArriba = $('#btn-arriba');
  let pendiente = false;
  window.addEventListener('scroll', () => {
    if (pendiente) return;
    pendiente = true;
    requestAnimationFrame(() => {
      pendiente = false;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      barra.style.width = (max > 0 ? 100 * window.scrollY / max : 0) + '%';
      btnArriba.hidden = window.scrollY < 900;
      seccionActual();
    });
  }, { passive: true });
  btnArriba.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  seccionActual();

  /* ---------------------- Secciones estudiadas ----------------------- */
  const estudiadas = new Set(leer('guia-' + (document.body.dataset.unidad || 'u1') + '-estudiadas', []));
  function pintarEstudiadas() {
    $$('.btn-estudiada').forEach(b => {
      const ok = estudiadas.has(b.dataset.seccion);
      b.classList.toggle('hecho', ok);
      b.querySelector('.ico').textContent = ok ? '✓' : '☐';
    });
    $$('.toc .t-sec').forEach(li => li.classList.toggle('estudiada', estudiadas.has(li.dataset.seccion)));
    const total = $$('.toc .t-sec').length;
    $('#indice-avance').textContent = estudiadas.size ? `${estudiadas.size}/${total} estudiadas` : '';
  }
  $$('.btn-estudiada').forEach(b => b.addEventListener('click', () => {
    const s = b.dataset.seccion;
    if (estudiadas.has(s)) estudiadas.delete(s); else estudiadas.add(s);
    guardar('guia-' + (document.body.dataset.unidad || 'u1') + '-estudiadas', Array.from(estudiadas));
    pintarEstudiadas();
  }));
  pintarEstudiadas();

  /* --------------------------- Copiar código -------------------------- */
  $$('.c-copiar').forEach(b => b.addEventListener('click', async () => {
    const codigo = b.closest('.codigo').querySelector('.c-fuente').innerText;
    try {
      await navigator.clipboard.writeText(codigo);
    } catch (e) {
      const t = document.createElement('textarea');
      t.value = codigo; document.body.appendChild(t); t.select();
      try { document.execCommand('copy'); } catch (e2) { /* nada */ }
      t.remove();
    }
    b.textContent = '¡Copiado!';
    b.classList.add('ok');
    setTimeout(() => { b.textContent = 'Copiar'; b.classList.remove('ok'); }, 1600);
  }));

  /* ---------------------------- Ejercicios ---------------------------- */
  const marcador = $('#marcador');
  function actualizarMarcador() {
    if (!marcador) return;
    const ej = $$('.ejercicio');
    const conOpciones = ej.filter(e => e.dataset.correcta !== '');
    const revelados = conOpciones.filter(e => e.classList.contains('revelado'));
    const ok = revelados.filter(e => e.dataset.resultado === 'ok').length;
    const mal = revelados.filter(e => e.dataset.resultado === 'mal').length;
    $('.m-resp', marcador).textContent = `${revelados.length}/${conOpciones.length} revisadas`;
    $('.m-ok', marcador).textContent = `✓ ${ok} correctas`;
    $('.m-mal', marcador).textContent = `✗ ${mal} por repasar`;
  }
  $$('.ejercicio').forEach(ej => {
    const opciones = $$('.opcion', ej);
    opciones.forEach(op => op.addEventListener('click', () => {
      if (ej.classList.contains('revelado')) return;
      opciones.forEach(o => o.classList.remove('elegida'));
      op.classList.add('elegida');
    }));
    const btn = $('.btn-respuesta', ej), sol = $('.ej-solucion', ej);
    btn.addEventListener('click', () => {
      const abrir = sol.hidden;
      sol.hidden = !abrir;
      if (abrir) {
        if (opciones.length && !ej.classList.contains('revelado')) {
          const c = Number(ej.dataset.correcta);
          const elegida = opciones.findIndex(o => o.classList.contains('elegida'));
          opciones[c].classList.add('correcta');
          let veredicto = 'Aún no habías elegido opción: la correcta está marcada en verde.';
          let clase = '';
          if (elegida >= 0) {
            if (elegida === c) { veredicto = '¡Correcto! 🎉'; clase = 'ok'; ej.dataset.resultado = 'ok'; }
            else { opciones[elegida].classList.add('incorrecta'); veredicto = 'Casi: revisa la explicación 👇'; clase = 'mal'; ej.dataset.resultado = 'mal'; }
          }
          ej.classList.add('revelado');
          const v = document.createElement('span');
          v.className = 'ej-veredicto ' + clase;
          v.textContent = veredicto;
          btn.after(v);
          actualizarMarcador();
        }
        btn.textContent = opciones.length ? 'Ocultar explicación' : 'Ocultar solución';
        window.dispatchEvent(new Event('resize'));
      } else {
        btn.textContent = opciones.length ? 'Ver explicación' : 'Ver solución paso a paso';
      }
    });
  });
  if (marcador) {
    $('button', marcador).addEventListener('click', () => {
      $$('.ejercicio').forEach(ej => {
        ej.classList.remove('revelado');
        delete ej.dataset.resultado;
        $$('.opcion', ej).forEach(o => o.classList.remove('elegida', 'correcta', 'incorrecta'));
        const v = $('.ej-veredicto', ej); if (v) v.remove();
        $('.ej-solucion', ej).hidden = true;
        $('.btn-respuesta', ej).textContent = $$('.opcion', ej).length ? 'Ver respuesta' : 'Ver solución paso a paso';
      });
      actualizarMarcador();
    });
    actualizarMarcador();
  }

  /* ------------- Pasos con fórmulas largas: ocupar todo el ancho ------------- */
  function ajustarPasos() {
    $$('.paso:not(.largo-fijo)').forEach(p => {
      if (p.classList.contains('largo') && !p.dataset.auto) { p.classList.add('largo-fijo'); return; }
      const f = p.querySelector('.p-formula .ecuacion') || p.querySelector('.p-formula');
      if (!f || !f.clientWidth) return;
      p.classList.remove('largo');
      if (f.scrollWidth > f.clientWidth + 2) { p.classList.add('largo'); p.dataset.auto = '1'; }
    });
  }
  let esperaPasos = null;
  window.addEventListener('resize', () => { clearTimeout(esperaPasos); esperaPasos = setTimeout(ajustarPasos, 150); });
  document.addEventListener('toggle', () => ajustarPasos(), true);
  window.addEventListener('load', ajustarPasos);
  ajustarPasos();

  /* ------------- Ejemplos guiados: iluminar los datos de cada paso ------------- */
  function altoGuiados() { $$('.guiado .g-fijo').forEach(f => f.parentElement.parentElement.classList.toggle('g-alto', f.offsetHeight > window.innerHeight * 0.72)); }
  window.addEventListener('resize', altoGuiados);
  window.addEventListener('load', altoGuiados);
  $$('.guiado').forEach(g => {
    const pasos = $$('.g-pasos .paso', g);
    const celdas = new Map($$('[data-celda]', g).map(c => [c.dataset.celda, c]));
    const ids = p => ({ usa: (p.dataset.usa || '').split(' ').filter(Boolean), da: (p.dataset.da || '').split(' ').filter(Boolean) });
    const btnIni = $('.g-iniciar', g), btnAnt = $('.g-ant', g), btnSig = $('.g-sig', g), btnTodo = $('.g-todo', g), pos = $('.g-pos', g);
    let actual = -1;
    // celdas que se calculan en algún paso (se ocultan hasta su paso en el recorrido)
    const resultado = new Map();
    pasos.forEach((p, i) => ids(p).da.forEach(id => { if (!resultado.has(id)) resultado.set(id, i); }));
    function limpiar() { celdas.forEach(c => c.classList.remove('g-usa', 'g-da')); }
    function iluminar(p) {
      limpiar();
      if (!p) return;
      const { usa, da } = ids(p);
      usa.forEach(id => { const c = celdas.get(id); if (c) c.classList.add('g-usa'); });
      da.forEach(id => { const c = celdas.get(id); if (c) c.classList.add('g-da'); });
    }
    function pintar() {
      const recorrido = actual >= 0;
      g.classList.toggle('g-recorriendo', recorrido);
      pasos.forEach((p, i) => {
        p.classList.toggle('g-actual', i === actual);
        p.classList.toggle('g-futuro', recorrido && i > actual);
      });
      resultado.forEach((i, id) => { const c = celdas.get(id); if (c) c.classList.toggle('g-oculta', recorrido && i > actual && !id.includes('-h')); });
      iluminar(recorrido ? pasos[actual] : null);
      btnAnt.disabled = !recorrido || actual === 0;
      btnSig.disabled = !recorrido || actual === pasos.length - 1;
      btnTodo.disabled = !recorrido;
      btnIni.textContent = recorrido ? '↺ Reiniciar' : '▶ Recorrer paso a paso';
      pos.textContent = recorrido ? `Paso ${actual + 1} de ${pasos.length}` : 'Pasa el cursor por un paso para ver qué datos usa';
      const espejo = $('.g-espejo', g);
      if (recorrido) {
        const p = pasos[actual];
        espejo.innerHTML = `<div class="p-num">${actual + 1}</div><div class="g-esp-f">${p.querySelector('.p-formula').innerHTML}</div><div class="g-esp-r">${p.querySelector('.p-razon').innerHTML}</div>`;
        espejo.hidden = false;
      } else espejo.hidden = true;
      if (recorrido) {
        const r = pasos[actual].getBoundingClientRect();
        if (r.bottom > window.innerHeight - 20 || r.top < 120) pasos[actual].scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
    btnIni.addEventListener('click', () => { actual = 0; pintar(); altoGuiados(); });
    btnSig.addEventListener('click', () => { if (actual < pasos.length - 1) { actual++; pintar(); } });
    btnAnt.addEventListener('click', () => { if (actual > 0) { actual--; pintar(); } });
    btnTodo.addEventListener('click', () => { actual = -1; pintar(); });
    pasos.forEach((p, i) => {
      p.addEventListener('mouseenter', () => iluminar(p));
      p.addEventListener('mouseleave', () => iluminar(actual >= 0 ? pasos[actual] : null));
      p.addEventListener('focus', () => iluminar(p));
      p.addEventListener('click', e => { if (e.target.closest('a, [data-tip]')) return; actual = i; pintar(); });
    });
  });

  /* ---------------------- Checklist del formulario ---------------------- */
  const marcas = leer('guia-' + (document.body.dataset.unidad || 'u1') + '-checklist', {});
  $$('li.check input[type=checkbox]').forEach((c, i) => {
    c.checked = !!marcas[i];
    c.addEventListener('change', () => { marcas[i] = c.checked; guardar('guia-' + (document.body.dataset.unidad || 'u1') + '-checklist', marcas); });
  });

  // Si la página se abre con un #ancla, resaltarla
  if (location.hash.length > 1) {
    const d = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (d) setTimeout(() => destellar(d), 400);
  }
})();
