/* =====================================================================
   ts3.js — Cálculos de la Unidad III (análisis espectral y filtrado).
   FFT (cualquier n), periodograma, suavizado de Daniell, Welch, espectro
   cruzado y coherencia (mismas fórmulas y escalas que scipy.signal),
   espectros teóricos ARMA, estimación AR, filtros lineales (respuesta en
   frecuencia, Butterworth, FIR por ventanas, lfilter/filtfilt como scipy),
   y los filtros de Hodrick–Prescott y Baxter–King (como statsmodels).
   Convención: frecuencia ω en ciclos por observación, 0 ≤ ω ≤ 1/2.
   ===================================================================== */
(function (global) {
  'use strict';
  const TS = global.TS || (typeof require !== 'undefined' ? require('./ts.js') : null);
  const T2 = global.TS2 || (typeof require !== 'undefined' ? require('./ts2.js') : null);
  const T3 = {};
  const PI = Math.PI, DOSPI = 2 * Math.PI;
  const rango = (n, a = 0) => Array.from({ length: n }, (_, i) => i + a);
  const suma = x => x.reduce((s, v) => s + v, 0);
  const media = x => suma(x) / x.length;

  /* ----------------------------- Complejos ----------------------------- */
  const cx = (re, im = 0) => ({ re, im });
  const cmul = (a, b) => cx(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re);
  const cdiv = (a, b) => { const d = b.re * b.re + b.im * b.im; return cx((a.re * b.re + a.im * b.im) / d, (a.im * b.re - a.re * b.im) / d); };
  const cadd = (a, b) => cx(a.re + b.re, a.im + b.im);
  const csub = (a, b) => cx(a.re - b.re, a.im - b.im);
  const cabs = a => Math.hypot(a.re, a.im);
  const cescala = (a, s) => cx(a.re * s, a.im * s);
  const csqrt = a => {
    const r = cabs(a);
    if (r === 0) return cx(0, 0);
    const re = Math.sqrt((r + a.re) / 2), im = Math.sqrt(Math.max(0, (r - a.re) / 2));
    return cx(re, a.im < 0 ? -im : im);
  };
  const cexp = a => { const e = Math.exp(a.re); return cx(e * Math.cos(a.im), e * Math.sin(a.im)); };
  T3.complejo = { cx, cmul, cdiv, cadd, csub, cabs, csqrt, cexp };

  /* -------------------------------- FFT -------------------------------- */
  // Radix-2 en el lugar (n potencia de 2)
  function fft2(re, im, inversa) {
    const n = re.length;
    for (let i = 1, j = 0; i < n; i++) {
      let bit = n >> 1;
      for (; j & bit; bit >>= 1) j ^= bit;
      j ^= bit;
      if (i < j) { let t = re[i]; re[i] = re[j]; re[j] = t; t = im[i]; im[i] = im[j]; im[j] = t; }
    }
    for (let len = 2; len <= n; len <<= 1) {
      const mitad = len >> 1, ang = (inversa ? DOSPI : -DOSPI) / len;
      for (let k = 0; k < mitad; k++) {
        const wr = Math.cos(ang * k), wi = Math.sin(ang * k);
        for (let i = k; i < n; i += len) {
          const j = i + mitad, br = re[j] * wr - im[j] * wi, bi = re[j] * wi + im[j] * wr;
          re[j] = re[i] - br; im[j] = im[i] - bi; re[i] += br; im[i] += bi;
        }
      }
    }
  }
  // FFT de cualquier longitud (Bluestein si n no es potencia de 2). X_k = Σ_{t=0}^{n−1} x_t e^{−2πikt/n}
  T3.fft = (xr, xi) => {
    const n = xr.length;
    const re = Float64Array.from(xr), im = xi ? Float64Array.from(xi) : new Float64Array(n);
    if (n <= 1) return { re: Array.from(re), im: Array.from(im) };
    if ((n & (n - 1)) === 0) { fft2(re, im, false); return { re: Array.from(re), im: Array.from(im) }; }
    let M = 1;
    while (M < 2 * n - 1) M <<= 1;
    const wr = new Float64Array(n), wi = new Float64Array(n);
    for (let k = 0; k < n; k++) { const a = PI * ((k * k) % (2 * n)) / n; wr[k] = Math.cos(a); wi[k] = Math.sin(a); }
    const Ar = new Float64Array(M), Ai = new Float64Array(M), Br = new Float64Array(M), Bi = new Float64Array(M);
    for (let t = 0; t < n; t++) { Ar[t] = re[t] * wr[t] + im[t] * wi[t]; Ai[t] = im[t] * wr[t] - re[t] * wi[t]; }
    Br[0] = wr[0]; Bi[0] = wi[0];
    for (let m = 1; m < n; m++) { Br[m] = Br[M - m] = wr[m]; Bi[m] = Bi[M - m] = wi[m]; }
    fft2(Ar, Ai, false); fft2(Br, Bi, false);
    for (let k = 0; k < M; k++) { const r = Ar[k] * Br[k] - Ai[k] * Bi[k], i = Ar[k] * Bi[k] + Ai[k] * Br[k]; Ar[k] = r; Ai[k] = i; }
    fft2(Ar, Ai, true);
    const outR = new Array(n), outI = new Array(n);
    for (let k = 0; k < n; k++) {
      const cr = Ar[k] / M, ci = Ai[k] / M;
      outR[k] = cr * wr[k] + ci * wi[k]; outI[k] = ci * wr[k] - cr * wi[k];
    }
    return { re: outR, im: outI };
  };
  T3.ifft = (re, im) => {
    const n = re.length, F = T3.fft(re, im.map(v => -v));
    return { re: F.re.map(v => v / n), im: F.im.map(v => -v / n) };
  };

  /* ---------------------- Ventanas y quitar tendencia ------------------- */
  function ventanaSim(tipo, M, alfa) {
    if (M === 1) return [1];
    const k = rango(M);
    if (tipo === 'hann') return k.map(i => 0.5 - 0.5 * Math.cos(DOSPI * i / (M - 1)));
    if (tipo === 'hamming') return k.map(i => 0.54 - 0.46 * Math.cos(DOSPI * i / (M - 1)));
    if (tipo === 'blackman') return k.map(i => 0.42 - 0.5 * Math.cos(DOSPI * i / (M - 1)) + 0.08 * Math.cos(2 * DOSPI * i / (M - 1)));
    if (tipo === 'tukey') {
      const a = alfa === undefined ? 0.5 : alfa;
      if (a <= 0) return k.map(() => 1);
      if (a >= 1) return ventanaSim('hann', M);
      const ancho = Math.floor(a * (M - 1) / 2);
      return k.map(i => i <= ancho ? 0.5 * (1 + Math.cos(PI * (-1 + 2 * i / a / (M - 1))))
        : i >= M - ancho - 1 ? 0.5 * (1 + Math.cos(PI * (-2 / a + 1 + 2 * i / a / (M - 1)))) : 1);
    }
    return k.map(() => 1);
  }
  // Igual que scipy.signal.get_window: por defecto periódica (fftbins=True)
  T3.ventana = (tipo, M, { simetrica = false, alfa } = {}) => {
    if (!tipo || tipo === 'boxcar') return new Array(M).fill(1);
    if (simetrica) return ventanaSim(tipo, M, alfa);
    return ventanaSim(tipo, M + 1, alfa).slice(0, M);
  };
  T3.quitarTendencia = (x, tipo = 'constant') => {
    if (!tipo || tipo === 'none' || tipo === false) return x.slice();
    const n = x.length, m = media(x);
    if (tipo === 'constant') return x.map(v => v - m);
    const tm = (n - 1) / 2;
    let sxy = 0, sxx = 0;
    for (let t = 0; t < n; t++) { sxy += (t - tm) * (x[t] - m); sxx += (t - tm) * (t - tm); }
    const b = sxy / sxx;
    return x.map((v, t) => v - m - b * (t - tm));
  };

  /* ---------------------------- Periodograma ---------------------------- */
  // I(ω_j) = |Σ w_t x_t e^{−2πiω_j t}|² / Σ w_t²  (con w = 1 es el de Shumway–Stoffer, |d(ω_j)|²)
  // pxx: la densidad «unilateral» de scipy.signal.periodogram (2·I salvo en 0 y 1/2)
  T3.periodograma = (x, { detrend = 'constant', ventana = 'boxcar', alfa } = {}) => {
    const y = T3.quitarTendencia(x, detrend), n = y.length, w = T3.ventana(ventana, n, { alfa });
    const S2 = suma(w.map(v => v * v)), F = T3.fft(y.map((v, t) => v * w[t]));
    const nf = Math.floor(n / 2) + 1, f = [], I = [], pxx = [];
    for (let j = 0; j < nf; j++) {
      const v = (F.re[j] * F.re[j] + F.im[j] * F.im[j]) / S2;
      f.push(j / n); I.push(v);
      pxx.push(j === 0 || (n % 2 === 0 && j === n / 2) ? v : 2 * v);
    }
    return { f, I, pxx, n, re: F.re.slice(0, nf), im: F.im.slice(0, nf), S2 };
  };
  // Coeficientes de la regresión de x_t (t = 1..n) sobre cos y sen en ω_j: el «periodograma escalado»
  T3.regresionFourier = (x, j) => {
    const n = x.length, w = j / n;
    let sc = 0, ss = 0;
    for (let t = 1; t <= n; t++) { sc += x[t - 1] * Math.cos(DOSPI * w * t); ss += x[t - 1] * Math.sin(DOSPI * w * t); }
    const extremo = j === 0 || (n % 2 === 0 && j === n / 2);
    const b1 = (extremo ? 1 : 2) * sc / n, b2 = extremo ? 0 : 2 * ss / n;
    return { w, sc, ss, b1, b2, I: (sc * sc + ss * ss) / n, P: b1 * b1 + b2 * b2, ajuste: rango(n, 1).map(t => b1 * Math.cos(DOSPI * w * t) + b2 * Math.sin(DOSPI * w * t)) };
  };
  // Periodograma en el círculo completo (j = 0..n−1), con la frecuencia 0 reemplazada por sus vecinas (como R)
  function circulo(x, detrend, ventana, alfa) {
    const y = T3.quitarTendencia(x, detrend), n = y.length, w = T3.ventana(ventana, n, { alfa });
    const S2 = suma(w.map(v => v * v)), F = T3.fft(y.map((v, t) => v * w[t]));
    return { F, S2, n, w };
  }
  T3.pesosDaniell = (m, modificado = false) => {
    if (m <= 0) return [1];
    if (!modificado) return new Array(2 * m + 1).fill(1 / (2 * m + 1));
    return rango(2 * m + 1).map(i => (i === 0 || i === 2 * m) ? 1 / (4 * m) : 1 / (2 * m));
  };
  // Pesos de un núcleo compuesto (convolución de varios Daniell): como kernel("modified.daniell", c(m1, m2)) de R
  T3.convolucionar = (a, b) => { const r = new Array(a.length + b.length - 1).fill(0); a.forEach((x, i) => b.forEach((y, j) => { r[i + j] += x * y; })); return r; };
  T3.daniell = (x, m, { modificado = false, detrend = 'constant', ventana = 'boxcar', alfa, pesos } = {}) => {
    const { F, S2, n } = circulo(x, detrend, ventana, alfa);
    const I = F.re.map((r, j) => (r * r + F.im[j] * F.im[j]) / S2);
    I[0] = (I[1] + I[n - 1]) / 2;
    const h = pesos || (Array.isArray(m) ? m.map(mi => T3.pesosDaniell(mi, modificado)).reduce(T3.convolucionar) : T3.pesosDaniell(m, modificado));
    const M = (h.length - 1) / 2, fs = new Array(n).fill(0);
    for (let j = 0; j < n; j++) { let s = 0; for (let k = -M; k <= M; k++) s += h[k + M] * I[((j + k) % n + n) % n]; fs[j] = s; }
    const nf = Math.floor(n / 2), f = [], Iout = [], fh = [];
    for (let j = 1; j <= nf; j++) { f.push(j / n); Iout.push(I[j]); fh.push(fs[j]); }
    const Lh = 1 / suma(h.map(v => v * v));
    return { f, I: Iout, fhat: fh, pesos: h, Lh, gl: 2 * Lh, B: Lh / n, n };
  };
  // Intervalo de confianza para f(ω) con gl grados de libertad: [gl·f̂/χ²(1−α/2), gl·f̂/χ²(α/2)]
  T3.intervalo = (fhat, gl, alfa = 0.05) => {
    const ql = TS.chi2ppf(alfa / 2, gl), qu = TS.chi2ppf(1 - alfa / 2, gl);
    return { inf: fhat.map(v => gl * v / qu), sup: fhat.map(v => gl * v / ql), qInf: ql, qSup: qu };
  };

  /* ------------------------------- Welch -------------------------------- */
  function segmentos(n, nperseg, noverlap) {
    const paso = nperseg - noverlap, K = Math.floor((n - nperseg) / paso) + 1;
    return rango(Math.max(K, 0)).map(k => k * paso);
  }
  T3.segmentosWelch = segmentos;
  // Como scipy.signal.csd / welch (scaling='density', average='mean', detrend='constant' por segmento)
  T3.csd = (x, y, { nperseg = 256, noverlap = null, ventana = 'hann', detrend = 'constant', alfa } = {}) => {
    const n = Math.min(x.length, y.length);
    nperseg = Math.min(nperseg, n);
    if (noverlap === null || noverlap === undefined) noverlap = Math.floor(nperseg / 2);
    const w = T3.ventana(ventana, nperseg, { alfa }), S2 = suma(w.map(v => v * v)), ini = segmentos(n, nperseg, noverlap);
    const nf = Math.floor(nperseg / 2) + 1, Pr = new Array(nf).fill(0), Pi = new Array(nf).fill(0), Pxx = new Array(nf).fill(0), Pyy = new Array(nf).fill(0);
    for (const a of ini) {
      const sx = T3.quitarTendencia(x.slice(a, a + nperseg), detrend).map((v, t) => v * w[t]);
      const sy = T3.quitarTendencia(y.slice(a, a + nperseg), detrend).map((v, t) => v * w[t]);
      const X = T3.fft(sx), Y = T3.fft(sy);
      for (let j = 0; j < nf; j++) {
        // conj(X)·Y
        Pr[j] += X.re[j] * Y.re[j] + X.im[j] * Y.im[j];
        Pi[j] += X.re[j] * Y.im[j] - X.im[j] * Y.re[j];
        Pxx[j] += X.re[j] * X.re[j] + X.im[j] * X.im[j];
        Pyy[j] += Y.re[j] * Y.re[j] + Y.im[j] * Y.im[j];
      }
    }
    const K = ini.length, f = rango(nf).map(j => j / nperseg);
    const esc = j => (j === 0 || (nperseg % 2 === 0 && j === nperseg / 2) ? 1 : 2) / (S2 * K);
    return {
      f, K, ini, nperseg, noverlap,
      re: Pr.map((v, j) => v * esc(j)), im: Pi.map((v, j) => v * esc(j)),
      pxx: Pxx.map((v, j) => v * esc(j)), pyy: Pyy.map((v, j) => v * esc(j))
    };
  };
  T3.welch = (x, opc = {}) => { const r = T3.csd(x, x, opc); return { f: r.f, pxx: r.pxx, K: r.K, ini: r.ini, nperseg: r.nperseg, noverlap: r.noverlap }; };
  T3.coherencia = (x, y, opc = {}) => {
    const r = T3.csd(x, y, opc);
    const coh = r.f.map((_, j) => (r.re[j] * r.re[j] + r.im[j] * r.im[j]) / (r.pxx[j] * r.pyy[j]));
    return Object.assign(r, { coh, fase: r.f.map((_, j) => Math.atan2(r.im[j], r.re[j])), mag: r.f.map((_, j) => Math.hypot(r.re[j], r.im[j])) });
  };
  // Espectro cruzado con periodogramas suavizados (Daniell): f̂_yx = promedio de d_y·conj(d_x)
  T3.cruzadoDaniell = (x, y, m, { modificado = false, detrend = 'constant' } = {}) => {
    const n = Math.min(x.length, y.length);
    const X = T3.fft(T3.quitarTendencia(x.slice(0, n), detrend)), Y = T3.fft(T3.quitarTendencia(y.slice(0, n), detrend));
    const h = T3.pesosDaniell(m, modificado), M = (h.length - 1) / 2;
    const ixx = rango(n).map(j => (X.re[j] ** 2 + X.im[j] ** 2) / n), iyy = rango(n).map(j => (Y.re[j] ** 2 + Y.im[j] ** 2) / n);
    const cr = rango(n).map(j => (Y.re[j] * X.re[j] + Y.im[j] * X.im[j]) / n), ci = rango(n).map(j => (Y.im[j] * X.re[j] - Y.re[j] * X.im[j]) / n);
    for (const a of [ixx, iyy, cr, ci]) a[0] = (a[1] + a[n - 1]) / 2;
    ci[0] = 0;
    const suav = a => rango(n).map(j => { let s = 0; for (let k = -M; k <= M; k++) s += h[k + M] * a[((j + k) % n + n) % n]; return s; });
    const sxx = suav(ixx), syy = suav(iyy), sr = suav(cr), si = suav(ci);
    const nf = Math.floor(n / 2), f = [], fxx = [], fyy = [], re = [], im = [], coh = [], fase = [];
    for (let j = 1; j <= nf; j++) {
      f.push(j / n); fxx.push(sxx[j]); fyy.push(syy[j]); re.push(sr[j]); im.push(si[j]);
      coh.push((sr[j] ** 2 + si[j] ** 2) / (sxx[j] * syy[j])); fase.push(Math.atan2(si[j], sr[j]));
    }
    const Lh = 1 / suma(h.map(v => v * v));
    return { f, fxx, fyy, re, im, coh, fase, Lh, n };
  };
  // Umbral de coherencia significativa (H0: coherencia 0) con L ordenadas promediadas: F(2, 2L−2)
  T3.umbralCoherencia = (L, alfa = 0.05) => {
    if (L <= 1) return 1;
    let lo = 0, hi = 1000;
    for (let i = 0; i < 200; i++) { const m = (lo + hi) / 2; if (T2.fsf(m, 2, 2 * L - 2) > alfa) lo = m; else hi = m; }
    const F = (lo + hi) / 2;
    return F / (L - 1 + F);
  };

  /* ------------------------- Espectros teóricos ------------------------- */
  // Evalúa Σ c_k e^{−2πiωk}
  T3.evalFrec = (c, w) => { let re = 0, im = 0; c.forEach((v, k) => { re += v * Math.cos(DOSPI * w * k); im -= v * Math.sin(DOSPI * w * k); }); return cx(re, im); };
  // f(ω) = σ² |θ(e^{−2πiω})|² / |φ(e^{−2πiω})|², con ar = [1, −φ1, …] y ma = [1, θ1, …]
  T3.espectroARMA = (ar, ma, sigma2, frecs) => frecs.map(w => {
    const a = T3.evalFrec(ar, w), b = T3.evalFrec(ma, w);
    return sigma2 * (b.re * b.re + b.im * b.im) / (a.re * a.re + a.im * a.im);
  });
  T3.frecs = (m = 501, hasta = 0.5) => rango(m).map(i => hasta * i / (m - 1));
  // f(ω) truncando la serie de Fourier en K rezagos: γ(0) + 2 Σ_{k=1}^{K} γ(k) cos(2πωk)
  T3.espectroDesdeACVF = (g, frecs, K) => frecs.map(w => { let s = g[0]; for (let k = 1; k <= Math.min(K, g.length - 1); k++) s += 2 * g[k] * Math.cos(DOSPI * w * k); return s; });
  // Integral numérica (trapecio) de f entre a y b; con f bilateral, la varianza es 2·∫_0^{1/2} f
  T3.integral = (frecs, f, a = 0, b = 0.5) => {
    let s = 0;
    for (let i = 1; i < frecs.length; i++) {
      const x0 = Math.max(a, frecs[i - 1]), x1 = Math.min(b, frecs[i]);
      if (x1 <= x0) continue;
      const lerp = x => f[i - 1] + (f[i] - f[i - 1]) * (x - frecs[i - 1]) / (frecs[i] - frecs[i - 1]);
      s += (x1 - x0) * (lerp(x0) + lerp(x1)) / 2;
    }
    return s;
  };

  /* ------------------------ Estimación paramétrica ---------------------- */
  // AR(p) por Yule–Walker (MLE, como statsmodels yule_walker method="mle"); AIC = n ln σ̂² + 2(p + 1)
  T3.arEspectral = (x, p, frecs) => {
    const n = x.length, yw = T2.yuleWalker(x, p, 'mle');
    const ar = [1].concat(yw.phi.map(v => -v));
    return { phi: yw.phi, sigma2: yw.sigma2, aic: n * Math.log(yw.sigma2) + 2 * (p + 1), espectro: frecs ? T3.espectroARMA(ar, [1], yw.sigma2, frecs) : null, ar };
  };
  T3.ordenesAR = (x, pmax) => rango(pmax + 1).map(p => { const r = T3.arEspectral(x, p); return { p, aic: r.aic, sigma2: r.sigma2 }; });

  /* ---------------------------- Filtros lineales ------------------------ */
  // Respuesta en frecuencia H(ω) = Σ b_k e^{−2πiωk} / Σ a_k e^{−2πiωk} (como scipy.signal.freqz con fs = 1)
  T3.respuesta = (b, a, frecs) => frecs.map(w => {
    const N = T3.evalFrec(b, w), D = T3.evalFrec(a || [1], w), H = cdiv(N, D);
    return { re: H.re, im: H.im, gan: cabs(H), gan2: H.re * H.re + H.im * H.im, fase: Math.atan2(H.im, H.re) };
  });
  // Filtro centrado y_t = Σ_{j=−M}^{M} a_j x_{t−j}: su respuesta es real, A(ω) = a_0 + 2 Σ a_j cos(2πωj) si es simétrico
  T3.respuestaCentrada = (pesos, frecs) => {
    const M = (pesos.length - 1) / 2;
    return frecs.map(w => { let re = 0, im = 0; pesos.forEach((v, i) => { const j = i - M; re += v * Math.cos(DOSPI * w * j); im -= v * Math.sin(DOSPI * w * j); }); return { re, im, gan: Math.hypot(re, im), gan2: re * re + im * im, fase: Math.atan2(im, re) }; });
  };
  T3.aplicarCentrado = (x, pesos) => {
    const M = (pesos.length - 1) / 2, n = x.length;
    return x.map((_, t) => { if (t < M || t >= n - M) return null; let s = 0; pesos.forEach((v, i) => { s += v * x[t + M - i]; }); return s; });
  };
  // lfilter: forma directa II transpuesta (como scipy.signal.lfilter)
  T3.lfilter = (b, a, x, zi) => {
    const a0 = a[0], K = Math.max(a.length, b.length);
    const B = rango(K).map(i => (b[i] || 0) / a0), A = rango(K).map(i => (a[i] || 0) / a0);
    const z = zi ? zi.slice() : new Array(K - 1).fill(0), y = new Array(x.length);
    for (let t = 0; t < x.length; t++) {
      const xt = x[t], yt = B[0] * xt + (K > 1 ? z[0] : 0);
      for (let i = 1; i < K - 1; i++) z[i - 1] = B[i] * xt + z[i] - A[i] * yt;
      if (K > 1) z[K - 2] = B[K - 1] * xt - A[K - 1] * yt;
      y[t] = yt;
    }
    return { y, zf: z };
  };
  // Condiciones iniciales de estado estacionario (como scipy.signal.lfilter_zi)
  T3.lfilterZi = (b, a) => {
    const a0 = a[0], K = Math.max(a.length, b.length);
    const B = rango(K).map(i => (b[i] || 0) / a0), A = rango(K).map(i => (a[i] || 0) / a0), m = K - 1;
    if (m === 0) return [];
    const M = rango(m).map(i => rango(m).map(j => (i === j ? 1 : 0) - (j === 0 ? -A[i + 1] : (j === i + 1 ? 1 : 0))));
    const rhs = rango(m).map(i => B[i + 1] - A[i + 1] * B[0]);
    return T2.resolver(M, rhs);
  };
  // filtfilt (padtype='odd', padlen = 3·max(len(a), len(b))): fase cero, ganancia |H|²
  T3.filtfilt = (b, a, x, { padlen = null } = {}) => {
    const n = x.length, pl = padlen === null ? 3 * Math.max(a.length, b.length) : padlen;
    if (n <= pl) throw new Error('La serie es demasiado corta para filtfilt');
    const ini = [], fin = [];
    for (let i = pl; i >= 1; i--) ini.push(2 * x[0] - x[i]);
    for (let i = n - 2; i >= n - pl - 1; i--) fin.push(2 * x[n - 1] - x[i]);
    const ext = ini.concat(x, fin), zi = T3.lfilterZi(b, a);
    let r = T3.lfilter(b, a, ext, zi.map(v => v * ext[0]));
    const y1 = r.y.slice().reverse();
    r = T3.lfilter(b, a, y1, zi.map(v => v * y1[0]));
    return r.y.reverse().slice(pl, pl + n);
  };
  // Polinomio con raíces dadas (como numpy.poly); devuelve la parte real
  function poly(raices) {
    let c = [cx(1)];
    for (const r of raices) {
      const nc = new Array(c.length + 1).fill(null).map(() => cx(0));
      c.forEach((v, i) => { nc[i] = cadd(nc[i], v); nc[i + 1] = csub(nc[i + 1], cmul(v, r)); });
      c = nc;
    }
    return c.map(v => v.re);
  }
  const prod = l => l.reduce((s, v) => cmul(s, v), cx(1));
  // Butterworth digital (como scipy.signal.butter(N, Wn, btype, fs=1)); fc en ciclos por observación
  T3.butter = (N, fc, tipo = 'lowpass') => {
    const Wn = (Array.isArray(fc) ? fc : [fc]).map(v => 2 * v);          // normalizada a Nyquist
    const fsI = 2, warped = Wn.map(v => 2 * fsI * Math.tan(PI * v / fsI));
    let z = [], p = rango(N).map(i => { const m = -N + 1 + 2 * i, a = PI * m / (2 * N); return cx(-Math.cos(a), -Math.sin(a)); }), k = 1;
    if (tipo === 'lowpass') {
      const wo = warped[0]; p = p.map(v => cescala(v, wo)); k = k * Math.pow(wo, N);
    } else if (tipo === 'highpass') {
      const wo = warped[0];
      k = k * prod(z.map(v => cescala(v, -1))).re / prod(p.map(v => cescala(v, -1))).re;
      p = p.map(v => cdiv(cx(wo), v)); z = rango(N).map(() => cx(0));
    } else {
      const bw = warped[1] - warped[0], wo = Math.sqrt(warped[0] * warped[1]);
      if (tipo === 'bandpass') {
        const pl = p.map(v => cescala(v, bw / 2));
        p = pl.map(v => cadd(v, csqrt(csub(cmul(v, v), cx(wo * wo))))).concat(pl.map(v => csub(v, csqrt(csub(cmul(v, v), cx(wo * wo))))));
        z = rango(N).map(() => cx(0)); k = k * Math.pow(bw, N);
      } else {
        const kk = prod(z.map(v => cescala(v, -1))), kp = prod(p.map(v => cescala(v, -1)));
        k = k * cdiv(kk, kp).re;
        const ph = p.map(v => cdiv(cx(bw / 2), v));
        p = ph.map(v => cadd(v, csqrt(csub(cmul(v, v), cx(wo * wo))))).concat(ph.map(v => csub(v, csqrt(csub(cmul(v, v), cx(wo * wo))))));
        z = rango(N).map(() => cx(0, wo)).concat(rango(N).map(() => cx(0, -wo)));
      }
    }
    // Transformación bilineal
    const fs2 = 2 * fsI, grado = p.length - z.length;
    const kb = cdiv(prod(z.map(v => csub(cx(fs2), v))), prod(p.map(v => csub(cx(fs2), v)))).re;
    const zz = z.map(v => cdiv(cadd(cx(fs2), v), csub(cx(fs2), v))).concat(rango(grado).map(() => cx(-1)));
    const pz = p.map(v => cdiv(cadd(cx(fs2), v), csub(cx(fs2), v)));
    const kz = k * kb;
    return { b: poly(zz).map(v => v * kz), a: poly(pz), z: zz, p: pz, k: kz };
  };
  // Ganancia exacta de Butterworth (fórmula cerrada, para comprobar)
  T3.ganButter = (N, fc, tipo, w) => {
    const O = Math.tan(PI * w);
    if (tipo === 'lowpass') return 1 / Math.sqrt(1 + Math.pow(O / Math.tan(PI * fc), 2 * N));
    if (tipo === 'highpass') return 1 / Math.sqrt(1 + Math.pow(Math.tan(PI * fc) / O, 2 * N));
    const O1 = Math.tan(PI * fc[0]), O2 = Math.tan(PI * fc[1]), B = O2 - O1, O0 = O1 * O2;
    const r = (O * O - O0) / (B * O);
    return tipo === 'bandpass' ? 1 / Math.sqrt(1 + Math.pow(r, 2 * N)) : 1 / Math.sqrt(1 + Math.pow(1 / r, 2 * N));
  };
  const sinc = v => (Math.abs(v) < 1e-12 ? 1 : Math.sin(PI * v) / (PI * v));
  // FIR por ventanas (como scipy.signal.firwin con fs = 1)
  T3.firwin = (numtaps, cutoff, { ventana = 'hamming', tipo = 'lowpass', escala = true } = {}) => {
    const c = (Array.isArray(cutoff) ? cutoff : [cutoff]).map(v => 2 * v);
    const pasaCero = tipo === 'lowpass' || tipo === 'bandstop', pasaNyq = ((c.length & 1) === 1) !== pasaCero;
    const bordes = (pasaCero ? [0] : []).concat(c, pasaNyq ? [1] : []), bandas = [];
    for (let i = 0; i < bordes.length; i += 2) bandas.push([bordes[i], bordes[i + 1]]);
    const al = 0.5 * (numtaps - 1), m = rango(numtaps).map(i => i - al);
    let h = m.map(v => bandas.reduce((s, [l, r]) => s + r * sinc(r * v) - l * sinc(l * v), 0));
    const w = T3.ventana(ventana, numtaps, { simetrica: true });
    h = h.map((v, i) => v * w[i]);
    if (escala) {
      const [l, r] = bandas[0], sf = l === 0 ? 0 : r === 1 ? 1 : 0.5 * (l + r);
      const s = suma(h.map((v, i) => v * Math.cos(PI * m[i] * sf)));
      h = h.map(v => v / s);
    }
    return h;
  };
  // Filtro de muesca (como scipy.signal.iirnotch(w0, Q, fs=1)): ganancia 0 en w0 y ≈ 1 lejos de ahí
  T3.iirnotch = (w0, Q) => {
    const wn = 2 * w0, bw = (wn / Q) * PI, w = wn * PI, beta = Math.tan(bw / 2), g = 1 / (1 + beta);
    return { b: [g, -2 * g * Math.cos(w), g], a: [1, -2 * g * Math.cos(w), 2 * g - 1] };
  };
  // Pesos de medias móviles
  T3.pesosMM = k => new Array(k).fill(1 / k);                 // causal: promedio de los últimos k
  T3.pesosCentrada = s => (s % 2 ? new Array(s).fill(1 / s) : [1 / (2 * s)].concat(new Array(s - 1).fill(1 / s), [1 / (2 * s)]));

  /* ------------------------ Filtros de economía ------------------------ */
  // Hodrick–Prescott: (I + λ K'K) τ = y, K = segundas diferencias (como statsmodels hpfilter)
  T3.hp = (y, lambda = 1600) => {
    const n = y.length;
    // Matriz simétrica pentadiagonal: diagonales d0, d1, d2
    const d0 = new Array(n).fill(0), d1 = new Array(n - 1).fill(0), d2 = new Array(n - 2).fill(0);
    for (let r = 0; r < n - 2; r++) {
      const c = [1, -2, 1];
      for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
        const a = r + i, b = r + j, v = lambda * c[i] * c[j];
        if (a === b) d0[a] += v; else if (Math.abs(a - b) === 1 && a < b) d1[a] += v; else if (b - a === 2) d2[a] += v;
      }
    }
    for (let i = 0; i < n; i++) d0[i] += 1;
    // Cholesky en banda (ancho 2): A = L Lᵀ
    const L0 = new Array(n), L1 = new Array(n).fill(0), L2 = new Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      const l2 = i >= 2 ? d2[i - 2] / L0[i - 2] : 0;
      const l1 = i >= 1 ? (d1[i - 1] - (i >= 2 ? L1[i - 1] * l2 : 0)) / L0[i - 1] : 0;
      L2[i] = l2; L1[i] = l1;
      L0[i] = Math.sqrt(d0[i] - l1 * l1 - l2 * l2);
    }
    const z = new Array(n);
    for (let i = 0; i < n; i++) z[i] = (y[i] - (i >= 1 ? L1[i] * z[i - 1] : 0) - (i >= 2 ? L2[i] * z[i - 2] : 0)) / L0[i];
    const tau = new Array(n);
    for (let i = n - 1; i >= 0; i--) tau[i] = (z[i] - (i + 1 < n ? L1[i + 1] * tau[i + 1] : 0) - (i + 2 < n ? L2[i + 2] * tau[i + 2] : 0)) / L0[i];
    return { tendencia: tau, ciclo: y.map((v, i) => v - tau[i]) };
  };
  // Ganancia del componente cíclico del HP: 4λ(1 − cos 2πω)² / (1 + 4λ(1 − cos 2πω)²)
  T3.hpGanancia = (lambda, frecs) => frecs.map(w => { const u = 4 * lambda * Math.pow(1 - Math.cos(DOSPI * w), 2); return u / (1 + u); });
  // Baxter–King (como statsmodels bkfilter(x, low, high, K))
  T3.bkPesos = (low = 6, high = 32, K = 12) => {
    const w1 = DOSPI / high, w2 = DOSPI / low, b = new Array(2 * K + 1).fill(0);
    b[K] = (w2 - w1) / PI;
    for (let j = 1; j <= K; j++) { const v = (Math.sin(w2 * j) - Math.sin(w1 * j)) / (PI * j); b[K + j] = v; b[K - j] = v; }
    const m = media(b);
    return b.map(v => v - m);
  };
  T3.bk = (x, low = 6, high = 32, K = 12) => {
    const b = T3.bkPesos(low, high, K), n = x.length, ciclo = [];
    for (let t = K; t < n - K; t++) { let s = 0; for (let j = -K; j <= K; j++) s += b[j + K] * x[t - j]; ciclo.push(s); }
    return { ciclo, pesos: b, K };
  };

  /* ------------------------------ Utilidades ---------------------------- */
  T3.senoide = (n, A, w, fase = 0, t0 = 1) => rango(n, t0).map(t => A * Math.cos(DOSPI * w * t + fase));
  T3.picos = (f, P, cuantos = 3, separacion = 2) => {
    const idx = rango(P.length).sort((i, j) => P[j] - P[i]), sel = [];
    for (const i of idx) { if (sel.every(s => Math.abs(s - i) > separacion)) sel.push(i); if (sel.length >= cuantos) break; }
    return sel.map(i => ({ i, f: f[i], P: P[i], periodo: f[i] > 0 ? 1 / f[i] : Infinity }));
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = T3;
  global.TS3 = T3;
})(typeof window !== 'undefined' ? window : globalThis);
