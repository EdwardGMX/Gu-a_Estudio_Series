/* =====================================================================
   ui.js — Interacción general de la guía: explicación de símbolos,
   enlaces de regreso, índice, copiar código, ejercicios (opción múltiple
   y respuesta abierta), modo ETS, buscador y avance en la portada.
   ===================================================================== */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const UNIDAD = document.body.dataset.unidad || 'u1';
  const enEts = () => document.body.classList.contains('modo-ets');
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
  // Si el destino está dentro de un bloque de profundización plegado (modo ETS), se abre
  function abrirProf(el) {
    for (let p = el.closest('.prof'); p; p = p.parentElement && p.parentElement.closest('.prof')) {
      p.classList.add('abierta');
      const b = p.querySelector(':scope > .prof-stub');
      if (b) b.setAttribute('aria-expanded', 'true');
    }
  }
  function irA(id, origen) {
    const destino = document.getElementById(id);
    if (!destino) return;
    abrirProf(destino);
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
      if (t.offsetParent === null) continue;          // oculto por el modo ETS
      if (t.getBoundingClientRect().top - lim <= 0) actual = t; else break;
    }
    if (!actual || actual === marcado) return;
    marcado = actual;
    if (/^u[123]$/.test(UNIDAD) && window.scrollY > 300) {
      guardar('guia-ultima', { u: UNIDAD, id: actual.id, t: actual.textContent.replace(/\s+/g, ' ').trim().slice(0, 90) });
    }
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
    if (!$('.btn-estudiada')) return;
    const cuentan = $$('.toc .t-sec').filter(li => !(enEts() && li.classList.contains('prof')));
    const hechas = cuentan.filter(li => estudiadas.has(li.dataset.seccion)).length;
    $('#indice-avance').textContent = hechas ? `${hechas}/${cuentan.length} estudiadas` : '';
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
  // Lista de ejercicios fallados (para «Repasar mis errores»): { id del ejercicio: fecha }
  function registrarError(eid, mal) {
    if (!eid) return;
    const e = leer('guia-errores', {});
    if (mal) e[eid] = Date.now(); else delete e[eid];
    guardar('guia-errores', e);
    document.dispatchEvent(new CustomEvent('guia:errores'));
  }
  const marcador = $('#marcador');
  function actualizarMarcador() {
    if (!marcador) return;
    const ej = $$('.ejercicio').filter(e => !(enEts() && e.dataset.prof));
    const conOpciones = ej.filter(e => e.dataset.correcta !== undefined && e.dataset.correcta !== '');
    const revelados = conOpciones.filter(e => e.classList.contains('revelado'));
    const ok = revelados.filter(e => e.dataset.resultado === 'ok').length;
    const mal = revelados.filter(e => e.dataset.resultado === 'mal').length;
    $('.m-resp', marcador).textContent = `${revelados.length}/${conOpciones.length} revisadas`;
    $('.m-ok', marcador).textContent = `✓ ${ok} correctas`;
    $('.m-mal', marcador).textContent = `✗ ${mal} por repasar`;
  }
  const textoBoton = (ej, abierto) => ej.dataset.abierta ? (abierto ? 'Ocultar respuesta modelo' : 'Ver respuesta modelo')
    : $$('.opcion', ej).length ? (abierto ? 'Ocultar explicación' : 'Ver explicación') : (abierto ? 'Ocultar solución' : 'Ver solución paso a paso');
  // Muestra la solución; en opción múltiple califica la opción elegida. Devuelve 'ok', 'mal' o null.
  function revelar(ej, opc) {
    const contarVacia = !!(opc && opc.contarVacia);
    const opciones = $$('.opcion', ej), btn = $('.btn-respuesta', ej), sol = $('.ej-solucion', ej);
    sol.hidden = false;
    if (opciones.length && !ej.classList.contains('revelado')) {
      const c = Number(ej.dataset.correcta);
      const elegida = opciones.findIndex(o => o.classList.contains('elegida'));
      opciones[c].classList.add('correcta');
      let veredicto = 'Aún no habías elegido opción: la correcta está marcada en verde.';
      let clase = '';
      if (elegida >= 0) {
        if (elegida === c) { veredicto = '¡Correcto! 🎉'; clase = 'ok'; ej.dataset.resultado = 'ok'; }
        else { opciones[elegida].classList.add('incorrecta'); veredicto = 'Casi: revisa la explicación 👇'; clase = 'mal'; ej.dataset.resultado = 'mal'; }
      } else if (contarVacia) { veredicto = 'Sin responder: la correcta está marcada en verde.'; clase = 'mal'; ej.dataset.resultado = 'mal'; }
      ej.classList.add('revelado');
      const v = document.createElement('span');
      v.className = 'ej-veredicto ' + clase;
      v.textContent = veredicto;
      btn.after(v);
      if (ej.dataset.resultado) registrarError(ej.dataset.eid, ej.dataset.resultado === 'mal');
      actualizarMarcador();
    }
    if (ej.dataset.abierta) ej.classList.add('revelado');
    btn.textContent = textoBoton(ej, true);
    window.dispatchEvent(new Event('resize'));
    return ej.dataset.resultado || null;
  }
  // Respuesta abierta: el borrador y la autocalificación se guardan en el navegador
  // (efimero = true en el simulacro: no lee ni guarda el borrador ni la nota, pero sí registra el error)
  function iniciarAbierta(ej, efimero) {
    const eid = ej.dataset.eid, txt = $('.ab-texto', ej);
    const borradores = efimero ? {} : leer('guia-borradores', {});
    if (borradores[eid]) txt.value = borradores[eid];
    let espera = null;
    txt.addEventListener('input', () => {
      if (efimero) return;
      clearTimeout(espera);
      espera = setTimeout(() => {
        const b = leer('guia-borradores', {});
        if (txt.value.trim()) b[eid] = txt.value; else delete b[eid];
        guardar('guia-borradores', b);
      }, 400);
    });
    const pintar = n => {
      if (n) ej.dataset.nota = n; else delete ej.dataset.nota;
      $$('.ab-nota button', ej).forEach(b => b.classList.toggle('on', b.dataset.nota === n));
    };
    pintar(efimero ? null : leer('guia-abiertas', {})[eid] || null);
    $$('.ab-nota button', ej).forEach(b => b.addEventListener('click', () => {
      const n = ej.dataset.nota === b.dataset.nota ? null : b.dataset.nota;
      if (!efimero) {
        const N = leer('guia-abiertas', {});
        if (n) N[eid] = n; else delete N[eid];
        guardar('guia-abiertas', N);
      }
      pintar(n);
      registrarError(eid, n === 'mal' || n === 'medias');
      ej.dispatchEvent(new CustomEvent('guia:nota', { bubbles: true, detail: n }));
    }));
  }
  function iniciarEjercicio(ej, opc) {
    if (ej.dataset.listo) return;
    ej.dataset.listo = '1';
    const opciones = $$('.opcion', ej);
    opciones.forEach(op => op.addEventListener('click', () => {
      if (ej.classList.contains('revelado')) return;
      opciones.forEach(o => o.classList.remove('elegida'));
      op.classList.add('elegida');
      ej.dispatchEvent(new CustomEvent('guia:eleccion', { bubbles: true }));
    }));
    const btn = $('.btn-respuesta', ej), sol = $('.ej-solucion', ej);
    btn.addEventListener('click', () => {
      if (sol.hidden) revelar(ej);
      else { sol.hidden = true; btn.textContent = textoBoton(ej, false); }
    });
    if (ej.dataset.abierta) iniciarAbierta(ej, !!(opc && opc.efimero));
  }
  $$('.ejercicio').forEach(ej => iniciarEjercicio(ej));
  if (marcador) {
    $('button', marcador).addEventListener('click', () => {
      $$('.ejercicio').forEach(ej => {
        if (ej.dataset.abierta) return;
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
      // El que se desborda es el contenedor de KaTeX (tiene su propio scroll), no la caja de la fórmula
      const f = p.querySelector('.p-formula .katex-display') || p.querySelector('.p-formula .ecuacion') || p.querySelector('.p-formula');
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

  /* ------------------------------ Modo ETS ------------------------------ */
  // Deja a la vista lo que entra al examen; la profundización queda plegada tras un botón.
  const btnEts = $('#btn-ets');
  function ponerModo(on) {
    const ancla = marcado && marcado.offsetParent !== null ? marcado : null;
    const dy = ancla ? ancla.getBoundingClientRect().top : 0;
    document.body.classList.toggle('modo-ets', on);
    if (btnEts) btnEts.setAttribute('aria-pressed', String(on));
    guardar('guia-modo-ets', on);
    if (ancla) {
      if (ancla.offsetParent !== null) window.scrollTo({ top: window.scrollY + ancla.getBoundingClientRect().top - dy });
      else { const p = ancla.closest('.prof'); if (p) p.scrollIntoView({ block: 'start' }); }
    }
    pintarEstudiadas();
    actualizarMarcador();
    document.dispatchEvent(new CustomEvent('guia:modo', { detail: on }));
    window.dispatchEvent(new Event('resize'));
  }
  if (btnEts) {
    btnEts.setAttribute('aria-pressed', String(enEts()));
    btnEts.addEventListener('click', () => ponerModo(!enEts()));
  }
  document.addEventListener('click', e => {
    const b = e.target.closest && e.target.closest('.prof-stub');
    if (!b) return;
    const abierta = b.parentElement.classList.toggle('abierta');
    b.setAttribute('aria-expanded', String(abierta));
    window.dispatchEvent(new Event('resize'));
  });
  // La unidad activa queda a la vista en la barra cuando no caben todas
  const nav = $('.unidades'), navActiva = $('.unidad.activa');
  if (nav && navActiva) nav.scrollLeft = Math.max(0, navActiva.offsetLeft - nav.clientWidth / 2 + navActiva.offsetWidth / 2);

  /* ------------------------------ Buscador ------------------------------ */
  const B = window.GUIA_BUSCADOR, caja = $('#buscador'), campo = $('#buscador-campo'), resultados = $('#buscador-res'), btnBuscar = $('#btn-buscar');
  const norm = t => String(t).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  let indiceBusqueda = null, activoBusqueda = -1;
  function prepararBusqueda() {
    if (indiceBusqueda || !B) return;
    indiceBusqueda = [];
    B.entradas.forEach(e => indiceBusqueda.push({ u: e[0], id: e[1], tipo: e[2], num: e[3], t: e[4], prof: e[5], n: norm(e[4]) }));
    B.glosario.forEach(g => indiceBusqueda.push({ u: g[3], id: g[4], tipo: 'sim', clave: g[0], t: g[1], d: g[2], n: norm(g[1]), nd: norm(g[2] + ' ' + g[0]) }));
  }
  function buscar(q) {
    const tokens = norm(q).split(/\s+/).filter(Boolean);
    if (!tokens.length) return [];
    const res = [];
    for (const it of indiceBusqueda) {
      let p = 0, ok = true;
      for (const tk of tokens) {
        const i = it.n.indexOf(tk);
        if (i >= 0) {
          const inicioPalabra = i === 0 || /[^a-z0-9]/.test(it.n[i - 1]), finPalabra = i + tk.length === it.n.length || /[^a-z0-9]/.test(it.n[i + tk.length]);
          p += (inicioPalabra ? 20 : 10) + (inicioPalabra && finPalabra ? 8 : 0) + (i === 0 ? 6 : 0);
        }
        else if (it.nd && it.nd.includes(tk)) p += 3;
        else { ok = false; break; }
      }
      if (!ok) continue;
      p += ({ seccion: 16, def: 10, sub: 9, sim: 7, menor: 2, bloque: 0 })[it.tipo] || 0;
      p -= it.n.length / 200 + (it.prof ? 2 : 0);
      res.push([p, it]);
    }
    res.sort((a, b) => b[0] - a[0]);
    return res.slice(0, 40).map(r => r[1]);
  }
  const ETIQUETA = { def: 'Definición', sim: 'Símbolo', bloque: 'Bloque' };
  function pintarBusqueda() {
    const q = campo.value.trim();
    activoBusqueda = -1;
    if (!q) { resultados.innerHTML = '<div class="bq-vacio">Escribe una palabra: «Ljung», «invertibilidad», «coherencia», «AIC»…</div>'; return; }
    if (!B) { resultados.innerHTML = '<div class="bq-vacio">El índice de búsqueda no está disponible.</div>'; return; }
    const res = buscar(q);
    if (!res.length) { resultados.innerHTML = `<div class="bq-vacio">Sin resultados para «${esc(q)}».</div>`; return; }
    resultados.innerHTML = res.map(it => {
      const pag = B.paginas[it.u] || { a: '', c: '' };
      const sim = it.tipo === 'sim' && GLOS[it.clave] ? `<span class="bq-sim">${GLOS[it.clave].s}</span>` : '';
      const tag = (ETIQUETA[it.tipo] ? `<span class="bq-tag">${ETIQUETA[it.tipo]}</span>` : '') + (it.prof ? '<span class="bq-tag prof">profundización</span>' : '');
      const desc = it.d ? `<span class="bq-desc">${esc(it.d)}</span>` : '';
      return `<a class="bq-item" href="${pag.a}#${it.id}" data-u="${it.u}" data-id="${it.id}"><span class="bq-donde">${esc(pag.c)}${it.num ? ' · ' + esc(it.num) : ''}</span>` +
        `${sim}<span class="bq-titulo">${esc(it.t)}</span>${tag}${desc}</a>`;
    }).join('');
  }
  function abrirBusqueda(abrir) {
    if (!caja) return;
    caja.hidden = !abrir;
    btnBuscar.setAttribute('aria-expanded', String(abrir));
    if (abrir) { prepararBusqueda(); pintarBusqueda(); campo.focus(); campo.select(); }
  }
  if (caja && btnBuscar) {
    btnBuscar.addEventListener('click', e => { e.stopPropagation(); abrirBusqueda(caja.hidden); });
    campo.addEventListener('input', pintarBusqueda);
    campo.addEventListener('keydown', e => {
      const items = $$('.bq-item', resultados);
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (!items.length) return;
        activoBusqueda = (activoBusqueda + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
        items.forEach((a, i) => a.classList.toggle('activo', i === activoBusqueda));
        items[activoBusqueda].scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'Enter') {
        const a = items[activoBusqueda >= 0 ? activoBusqueda : 0];
        if (a) { e.preventDefault(); a.click(); }
      } else if (e.key === 'Escape') abrirBusqueda(false);
    });
    resultados.addEventListener('click', e => {
      const a = e.target.closest('.bq-item');
      if (!a) return;
      abrirBusqueda(false);
      if (a.dataset.u === UNIDAD && document.getElementById(a.dataset.id)) { e.preventDefault(); irA(a.dataset.id, null); }
    });
    document.addEventListener('click', e => { if (!caja.hidden && !caja.contains(e.target) && e.target !== btnBuscar) abrirBusqueda(false); });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && !caja.hidden) { abrirBusqueda(false); return; }
      const t = e.target;
      if (e.key === '/' && !e.ctrlKey && !e.metaKey && !(t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable))) {
        e.preventDefault(); abrirBusqueda(true);
      }
    });
  }

  /* ----------------- Avance: portada, temario y ruta de estudio ----------------- */
  const estudiadasDe = {};
  const setEstudiadas = u => estudiadasDe[u] || (estudiadasDe[u] = new Set(leer('guia-' + u + '-estudiadas', [])));
  function estadoDe(lista) {
    const ids = (lista || '').split(' ').filter(Boolean);
    if (!ids.length) return null;
    const hechas = ids.filter(x => { const k = x.indexOf(':'); return setEstudiadas(x.slice(0, k)).has(x.slice(k + 1)); }).length;
    return hechas === ids.length ? 'hecho' : hechas ? 'parcial' : 'nada';
  }
  const TXT_ESTADO = { hecho: '✓ Estudiado', parcial: '◐ En curso', nada: '☐ Pendiente' };
  function pintarAvance() {
    $$('tr[data-secs]').forEach(tr => {
      const e = estadoDe(tr.dataset.secs), td = $('.tm-estado', tr);
      if (!td) return;
      td.className = 'tm-estado ' + (e || '');
      td.textContent = e ? TXT_ESTADO[e] : '—';
    });
    $$('.rt-sesion').forEach(li => {
      const e = estadoDe(li.dataset.secs), sp = $('.rt-estado', li);
      li.classList.toggle('hecha', e === 'hecho');
      if (sp) { sp.className = 'rt-estado ' + (e || ''); sp.textContent = e ? TXT_ESTADO[e] : ''; }
    });
    const caja = $('#avance-global');
    if (caja && B && B.secciones) {
      caja.innerHTML = Object.keys(B.secciones).map(u => {
        const secs = B.secciones[u].filter(x => !(enEts() && x.prof));
        const hechas = secs.filter(x => setEstudiadas(u).has(x.id)).length;
        const pct = secs.length ? Math.round(100 * hechas / secs.length) : 0;
        return `<a class="av-unidad" href="${B.paginas[u].a}" style="text-decoration:none"><div class="av-nombre"><span>${esc(B.paginas[u].n)}</span>` +
          `<span>${hechas}/${secs.length} secciones</span></div><div class="av-barra"><span style="width:${pct}%"></span></div></a>`;
      }).join('');
    }
    const errores = Object.keys(leer('guia-errores', {})).length;
    const notas = Object.values(leer('guia-abiertas', {}));
    const sims = leer('guia-simulacros', []);
    const ultima = leer('guia-ultima', null);
    const DATOS = {
      errores: errores ? `${errores} ejercicio${errores === 1 ? '' : 's'} por repasar` : 'Sin errores pendientes',
      abiertas: notas.length ? `${notas.filter(n => n === 'bien').length} bien · ${notas.filter(n => n === 'medias').length} a medias · ${notas.filter(n => n === 'mal').length} mal` : 'Aún sin calificar',
      simulacro: sims.length ? `Último: ${sims[sims.length - 1].nota.toFixed(1)}/10 · ${sims.length} hecho${sims.length === 1 ? '' : 's'}` : 'Aún no haces ninguno'
    };
    $$('[data-dato]').forEach(el => { if (DATOS[el.dataset.dato] !== undefined) el.textContent = DATOS[el.dataset.dato]; });
    const cont = $('#continuar');
    if (cont) {
      if (ultima && B && B.paginas[ultima.u]) {
        cont.hidden = false;
        cont.href = B.paginas[ultima.u].a + '#' + ultima.id;
        const sp = $('.ac-dato', cont); if (sp) sp.textContent = `${B.paginas[ultima.u].n} · ${ultima.t}`;
      } else cont.hidden = true;
    }
  }
  pintarAvance();
  document.addEventListener('guia:modo', pintarAvance);
  document.addEventListener('guia:errores', pintarAvance);

  /* ------------- Preguntas tipo: resumen de la autocalificación ------------- */
  const ptResumen = $('#pt-resumen');
  if (ptResumen) {
    const pintarPt = () => {
      const ab = $$('.ejercicio.abierta');
      const c = n => ab.filter(e => e.dataset.nota === n).length;
      $('.pt-datos', ptResumen).innerHTML = `<span>${ab.length} preguntas</span><span class="pt-ok">✓ ${c('bien')} bien</span>` +
        `<span class="pt-med">≈ ${c('medias')} a medias</span><span class="pt-mal">✗ ${c('mal')} mal</span><span>${ab.filter(e => !e.dataset.nota).length} sin calificar</span>`;
    };
    document.addEventListener('guia:nota', pintarPt);
    const b = $('button', ptResumen);
    if (b) b.addEventListener('click', () => {
      const on = document.body.classList.toggle('pt-filtrado');
      $$('.ejercicio.abierta').forEach(e => { e.hidden = on && e.dataset.nota === 'bien'; });
      b.textContent = on ? 'Ver todas' : 'Ver solo las que no domino';
    });
    pintarPt();
  }

  // Lo que usan las demás páginas (práctica y simulacro)
  window.GUIA_UI = { $, $$, guardar, leer, esc, irA, iniciarEjercicio, revelar, registrarError, enEts, GLOS };

  // Si la página se abre con un #ancla (o cambia), abrir la profundización que la contenga y resaltarla
  function alAncla(mover) {
    if (location.hash.length < 2) return;
    const d = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (!d) return;
    const oculto = d.offsetParent === null;
    abrirProf(d);
    if (oculto || mover) d.scrollIntoView({ block: 'start' });
    setTimeout(() => destellar(d), 400);
  }
  alAncla(false);
  window.addEventListener('hashchange', () => alAncla(true));
})();
