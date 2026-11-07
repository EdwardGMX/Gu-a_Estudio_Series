/* =====================================================================
   ts.js — Mini biblioteca de series de tiempo para la guía (Unidad I)
   Todo se calcula en el navegador. Las funciones replican lo que hace
   statsmodels (acf, pacf 'ywm', acorr_ljungbox, adfuller, kpss,
   seasonal_decompose) para que los números coincidan con Python.
   ===================================================================== */
(function (global) {
  'use strict';
  const TS = {};

  /* ---------------- Números aleatorios reproducibles ---------------- */
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  TS.rng = function (semilla) {
    const u = mulberry32((semilla >>> 0) || 1);
    let reserva = null;
    const r = {
      unif: u,
      normal() {
        if (reserva !== null) { const s = reserva; reserva = null; return s; }
        let a; do { a = u(); } while (a <= 1e-12);
        const b = u(), m = Math.sqrt(-2 * Math.log(a));
        reserva = m * Math.sin(2 * Math.PI * b);
        return m * Math.cos(2 * Math.PI * b);
      }
    };
    r.normales = (n, sd = 1) => Array.from({ length: n }, () => sd * r.normal());
    return r;
  };

  /* ---------------------- Utilidades básicas ----------------------- */
  TS.rango = (n, inicio = 0) => Array.from({ length: n }, (_, i) => i + inicio);
  TS.suma = x => x.reduce((s, v) => s + v, 0);
  TS.media = x => TS.suma(x) / x.length;
  TS.varianza = (x, ddof = 0) => {
    const m = TS.media(x);
    return x.reduce((s, v) => s + (v - m) * (v - m), 0) / (x.length - ddof);
  };
  TS.desv = (x, ddof = 0) => Math.sqrt(TS.varianza(x, ddof));
  TS.diff = (x, lag = 1) => x.slice(lag).map((v, i) => v - x[i]);
  TS.cumsum = x => { let s = 0; return x.map(v => (s += v)); };
  TS.redondear = (v, d = 4) => (v === null || v === undefined || !isFinite(v)) ? v : Math.round(v * 10 ** d) / 10 ** d;

  // Ventanas móviles "hacia atrás" como pandas .rolling(w) (std con ddof=1)
  TS.mediaMovil = (x, w) => x.map((_, i) => i < w - 1 ? null : TS.media(x.slice(i - w + 1, i + 1)));
  TS.desvMovil = (x, w) => x.map((_, i) => i < w - 1 ? null : TS.desv(x.slice(i - w + 1, i + 1), 1));

  /* ---------------------- Procesos simulados ------------------------ */
  TS.sim = {};
  // Ruido blanco gaussiano
  TS.sim.ruido = (n, { sigma = 1, semilla = 1, media = 0 } = {}) =>
    TS.rng(semilla).normales(n, sigma).map(e => media + e);
  // AR(1): y_t = c + phi*y_{t-1} + e_t
  TS.sim.ar1 = (n, phi, { c = 0, sigma = 1, semilla = 1, quemado = null, y0 = null } = {}) => {
    const estacionario = Math.abs(phi) < 1;
    const q = quemado === null ? (estacionario ? 200 : 0) : quemado;
    const e = TS.rng(semilla).normales(n + q, sigma);
    let y = y0 !== null ? y0 : (estacionario ? c / (1 - phi) : 0);
    const out = [];
    for (let t = 0; t < n + q; t++) {
      y = c + phi * y + e[t];
      if (t >= q) out.push(y);
    }
    return out;
  };
  // Paseo aleatorio (con deriva opcional): y_t = deriva + y_{t-1} + e_t
  TS.sim.paseo = (n, { deriva = 0, sigma = 1, semilla = 1, y0 = 0 } = {}) => {
    const e = TS.rng(semilla).normales(n, sigma);
    let y = y0;
    return e.map(v => (y = deriva + y + v));
  };
  // Tendencia determinística + ruido: y_t = a + b t + e_t
  TS.sim.tendencia = (n, { a = 0, b = 0.1, sigma = 1, semilla = 1 } = {}) => {
    const e = TS.rng(semilla).normales(n, sigma);
    return e.map((v, t) => a + b * (t + 1) + v);
  };
  // MA(1): y_t = e_t + theta e_{t-1}
  TS.sim.ma1 = (n, theta, { sigma = 1, semilla = 1 } = {}) => {
    const e = TS.rng(semilla).normales(n + 1, sigma);
    return TS.rango(n).map(t => e[t + 1] + theta * e[t]);
  };
  // Estacionalidad determinística + ruido
  TS.sim.estacional = (n, { periodo = 12, amp = 3, sigma = 1, semilla = 1, nivel = 0 } = {}) => {
    const e = TS.rng(semilla).normales(n, sigma);
    return e.map((v, t) => nivel + amp * Math.sin(2 * Math.PI * (t + 1) / periodo) + v);
  };
  // Cambio estructural en la media
  TS.sim.quiebre = (n, { salto = 4, en = 0.5, sigma = 1, semilla = 1 } = {}) => {
    const e = TS.rng(semilla).normales(n, sigma), t0 = Math.floor(n * en);
    return e.map((v, t) => (t >= t0 ? salto : 0) + v);
  };
  // Varianza creciente
  TS.sim.heteroc = (n, { factor = 4, semilla = 1 } = {}) => {
    const e = TS.rng(semilla).normales(n, 1);
    return e.map((v, t) => v * (1 + factor * t / n));
  };

  /* --------------- Autocovarianza, ACF, PACF, Ljung-Box ------------- */
  // gamma_hat(k): divide entre n (estimador sesgado, como statsmodels)
  TS.autocov = (x, k) => {
    const n = x.length, m = TS.media(x);
    let s = 0;
    for (let t = k; t < n; t++) s += (x[t] - m) * (x[t - k] - m);
    return s / n;
  };
  TS.acf = (x, nlags) => {
    const g0 = TS.autocov(x, 0), r = [];
    for (let k = 0; k <= nlags; k++) r.push(TS.autocov(x, k) / g0);
    return r;
  };
  // PACF por Durbin-Levinson sobre la ACF sesgada (= statsmodels pacf(method='ywm'))
  TS.pacfDesdeAcf = (r, nlags) => {
    const p = [1];
    let prev = [];
    for (let k = 1; k <= nlags; k++) {
      let num = r[k], den = 1;
      for (let j = 1; j < k; j++) { num -= prev[j - 1] * r[k - j]; den -= prev[j - 1] * r[j]; }
      const pkk = num / den, nuevo = [];
      for (let j = 1; j < k; j++) nuevo.push(prev[j - 1] - pkk * prev[k - j - 1]);
      nuevo.push(pkk);
      prev = nuevo;
      p.push(pkk);
    }
    return p;
  };
  TS.pacf = (x, nlags) => TS.pacfDesdeAcf(TS.acf(x, nlags), nlags);

  /* --------------------- Distribuciones ----------------------------- */
  function erfc(x) {
    const z = Math.abs(x), t = 1 / (1 + 0.5 * z);
    const r = t * Math.exp(-z * z - 1.26551223 + t * (1.00002368 + t * (0.37409196 + t * (0.09678418 +
      t * (-0.18628806 + t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 + t * (-0.82215223 + t * 0.17087277)))))))));
    return x >= 0 ? r : 2 - r;
  }
  TS.normcdf = x => 0.5 * erfc(-x / Math.SQRT2);
  function lnGamma(z) {
    const c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313,
      -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
    if (z < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * z)) - lnGamma(1 - z);
    z -= 1;
    let x = c[0];
    for (let i = 1; i < 9; i++) x += c[i] / (z + i);
    const t = z + 7.5;
    return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
  }
  function gammaPserie(a, x) {
    let ap = a, del = 1 / a, sum = del;
    for (let n = 0; n < 1000; n++) { ap += 1; del *= x / ap; sum += del; if (Math.abs(del) < Math.abs(sum) * 1e-15) break; }
    return sum * Math.exp(-x + a * Math.log(x) - lnGamma(a));
  }
  function gammaQfc(a, x) {
    const MIN = 1e-300;
    let b = x + 1 - a, c = 1 / MIN, d = 1 / b, h = d;
    for (let i = 1; i < 1000; i++) {
      const an = -i * (i - a); b += 2;
      d = an * d + b; if (Math.abs(d) < MIN) d = MIN;
      c = b + an / c; if (Math.abs(c) < MIN) c = MIN;
      d = 1 / d; const del = d * c; h *= del;
      if (Math.abs(del - 1) < 1e-15) break;
    }
    return Math.exp(-x + a * Math.log(x) - lnGamma(a)) * h;
  }
  // P(X > x) con X ~ chi^2(k)
  TS.chi2sf = (x, k) => {
    if (x <= 0) return 1;
    const a = k / 2, z = x / 2;
    return z < a + 1 ? 1 - gammaPserie(a, z) : gammaQfc(a, z);
  };
  // Cuantil de chi^2 por bisección (para valores críticos)
  TS.chi2ppf = (p, k) => {
    let lo = 0, hi = Math.max(10, k * 10);
    for (let i = 0; i < 200; i++) { const m = (lo + hi) / 2; if (1 - TS.chi2sf(m, k) < p) lo = m; else hi = m; }
    return (lo + hi) / 2;
  };

  TS.ljungBox = (x, h) => {
    const n = x.length, r = TS.acf(x, h);
    let acum = 0;
    const filas = [];
    for (let k = 1; k <= h; k++) {
      const aporte = r[k] * r[k] / (n - k);
      acum += aporte;
      filas.push({ k, rho: r[k], aporte: n * (n + 2) * aporte, Q: n * (n + 2) * acum, p: TS.chi2sf(n * (n + 2) * acum, k) });
    }
    const Q = n * (n + 2) * acum;
    return { Q, p: TS.chi2sf(Q, h), h, n, filas };
  };

  /* --------------------------- MCO (OLS) ---------------------------- */
  function invertir(A) {
    const n = A.length, M = A.map((fila, i) => fila.concat(TS.rango(n).map(j => (i === j ? 1 : 0))));
    for (let c = 0; c < n; c++) {
      let piv = c;
      for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[piv][c])) piv = r;
      [M[c], M[piv]] = [M[piv], M[c]];
      const d = M[c][c];
      for (let j = 0; j < 2 * n; j++) M[c][j] /= d;
      for (let r = 0; r < n; r++) {
        if (r === c) continue;
        const f = M[r][c];
        if (f !== 0) for (let j = 0; j < 2 * n; j++) M[r][j] -= f * M[c][j];
      }
    }
    return M.map(f => f.slice(n));
  }
  TS.ols = (X, y) => {
    const n = X.length, k = X[0].length;
    const XtX = TS.rango(k).map(() => new Array(k).fill(0)), Xty = new Array(k).fill(0);
    for (let i = 0; i < n; i++) {
      const xi = X[i];
      for (let a = 0; a < k; a++) {
        Xty[a] += xi[a] * y[i];
        for (let b = 0; b < k; b++) XtX[a][b] += xi[a] * xi[b];
      }
    }
    const inv = invertir(XtX);
    const beta = inv.map(f => f.reduce((s, v, j) => s + v * Xty[j], 0));
    const resid = y.map((v, i) => v - X[i].reduce((s, xv, j) => s + xv * beta[j], 0));
    const ssr = TS.suma(resid.map(r => r * r));
    const s2 = ssr / (n - k);
    const se = inv.map((f, j) => Math.sqrt(s2 * f[j]));
    const llf = -n / 2 * (Math.log(2 * Math.PI) + Math.log(ssr / n) + 1);
    return { beta, se, t: beta.map((b, j) => b / se[j]), resid, ssr, s2, n, k, llf, aic: -2 * llf + 2 * k };
  };

  /* ------------------ Dickey-Fuller aumentada (ADF) ----------------- */
  // Tablas de MacKinnon (1994, 2010) para N = 1, tomadas de statsmodels
  const MK = {
    n:  { max: Infinity, min: -19.04, star: -1.04, small: [0.6344, 1.2378, 0.032496], large: [0.4797, 0.93557, -0.06999, 0.033066] },
    c:  { max: 2.74, min: -18.83, star: -1.61, small: [2.1659, 1.4412, 0.038269], large: [1.7339, 0.93202, -0.12745, -0.010368] },
    ct: { max: 0.7, min: -16.18, star: -2.89, small: [3.2512, 1.6047, 0.049588], large: [2.5261, 0.61654, -0.37956, -0.060285] }
  };
  const CRIT = {
    n:  [[-2.56574, -2.2358, -3.627, 0], [-1.941, -0.2686, -3.365, 31.223], [-1.61682, 0.2656, -2.714, 25.364]],
    c:  [[-3.43035, -6.5393, -16.786, -79.433], [-2.86154, -2.8903, -4.234, -40.04], [-2.56677, -1.5384, -2.809, 0]],
    ct: [[-3.95877, -9.0531, -28.428, -134.155], [-3.41049, -4.3904, -9.036, -45.374], [-3.12705, -2.5856, -3.925, -22.38]]
  };
  TS.mackinnonp = (stat, reg) => {
    const m = MK[reg];
    if (stat > m.max) return 1;
    if (stat < m.min) return 0;
    const coef = stat <= m.star ? m.small : m.large;
    let v = 0;
    for (let i = coef.length - 1; i >= 0; i--) v = v * stat + coef[i];
    return TS.normcdf(v);
  };
  TS.mackinnoncrit = (reg, nobs) => {
    const v = CRIT[reg].map(b => b[0] + b[1] / nobs + b[2] / nobs ** 2 + b[3] / nobs ** 3);
    return { '1%': v[0], '5%': v[1], '10%': v[2] };
  };
  function columnasTendencia(reg, i) { return reg === 'n' ? [] : reg === 'c' ? [1] : [1, i + 1]; }
  // Igual que statsmodels.tsa.stattools.adfuller(x, maxlag, regression, autolag)
  TS.adf = (x, { regression = 'c', maxlag = null, autolag = 'AIC' } = {}) => {
    const N = x.length, ntr = regression === 'n' ? 0 : regression.length;
    if (maxlag === null) {
      maxlag = Math.ceil(12 * Math.pow(N / 100, 1 / 4));
      maxlag = Math.min(Math.floor(N / 2) - ntr - 1, maxlag);
    }
    const dx = TS.diff(x);
    const armar = p => {
      const filas = [], dep = [];
      for (let t = p; t < dx.length; t++) {
        const f = [x[t]];
        for (let j = 1; j <= p; j++) f.push(dx[t - j]);
        filas.push(f); dep.push(dx[t]);
      }
      return { filas, dep };
    };
    let usado = maxlag;
    if (autolag) {
      const { filas, dep } = armar(maxlag);
      const completo = filas.map((f, i) => columnasTendencia(regression, i).concat(f));
      const inicio = ntr + 1;
      let mejor = null;
      for (let c = inicio; c <= inicio + maxlag; c++) {
        const r = TS.ols(completo.map(f => f.slice(0, c)), dep);
        if (mejor === null || r.aic < mejor.aic) mejor = { aic: r.aic, c };
      }
      usado = mejor.c - inicio;
    }
    const { filas, dep } = armar(usado);
    const X = filas.map((f, i) => columnasTendencia(regression, i).concat(f));
    const r = TS.ols(X, dep);
    const stat = r.t[ntr];
    return {
      stat, p: TS.mackinnonp(stat, regression), lags: usado, nobs: r.n,
      crit: TS.mackinnoncrit(regression, r.n), delta: r.beta[ntr], se: r.se[ntr], reg: r
    };
  };

  /* ------------------------------ KPSS ------------------------------ */
  function kpssAutolag(res, n) {
    const covlags = Math.floor(Math.pow(n, 2 / 9));
    let s0 = TS.suma(res.map(r => r * r)) / n, s1 = 0;
    for (let i = 1; i <= covlags; i++) {
      let p = 0;
      for (let t = i; t < n; t++) p += res[t] * res[t - i];
      p /= n / 2;
      s0 += p; s1 += i * p;
    }
    const sh = s1 / s0, g = 1.1447 * Math.pow(sh * sh, 1 / 3);
    return Math.floor(g * Math.pow(n, 1 / 3));
  }
  // Igual que statsmodels.tsa.stattools.kpss(x, regression, nlags)
  TS.kpss = (x, { regression = 'c', nlags = 'auto' } = {}) => {
    const n = x.length;
    let res, crit;
    if (regression === 'ct') {
      res = TS.ols(x.map((_, i) => [1, i + 1]), x).resid;
      crit = [0.119, 0.146, 0.176, 0.216];
    } else {
      const m = TS.media(x);
      res = x.map(v => v - m);
      crit = [0.347, 0.463, 0.574, 0.739];
    }
    let L;
    if (nlags === 'legacy') L = Math.min(Math.ceil(12 * Math.pow(n / 100, 0.25)), n - 1);
    else if (nlags === 'auto') L = Math.min(kpssAutolag(res, n), n - 1);
    else L = nlags;
    let S = 0, eta = 0;
    for (const r of res) { S += r; eta += S * S; }
    eta /= n * n;
    let s = TS.suma(res.map(r => r * r));
    for (let i = 1; i <= L; i++) {
      let p = 0;
      for (let t = i; t < n; t++) p += res[t] * res[t - i];
      s += 2 * p * (1 - i / (L + 1));
    }
    s /= n;
    const stat = eta / s, pv = [0.10, 0.05, 0.025, 0.01];
    let p;
    if (stat <= crit[0]) p = 0.10;
    else if (stat >= crit[3]) p = 0.01;
    else for (let j = 0; j < 3; j++) if (stat <= crit[j + 1]) { p = pv[j] + (pv[j + 1] - pv[j]) * (stat - crit[j]) / (crit[j + 1] - crit[j]); break; }
    return { stat, p, lags: L, eta, s2: s, crit: { '10%': crit[0], '5%': crit[1], '2.5%': crit[2], '1%': crit[3] }, fueraDeTabla: stat <= crit[0] ? 'mayor' : stat >= crit[3] ? 'menor' : null };
  };

  /* --------------- Medias móviles y descomposición ----------------- */
  // Media móvil centrada como seasonal_decompose (2xm si m es par)
  TS.pesosMM = m => m % 2 === 0
    ? [0.5].concat(new Array(m - 1).fill(1), [0.5]).map(v => v / m)
    : new Array(m).fill(1 / m);
  TS.mediaMovilCentrada = (x, m) => {
    const w = TS.pesosMM(m), h = Math.floor(w.length / 2), out = x.map(() => null);
    for (let t = h; t < x.length - h; t++) {
      let s = 0;
      for (let j = -h; j <= h; j++) s += w[j + h] * x[t + j];
      out[t] = s;
    }
    return out;
  };
  TS.descomponer = (x, periodo, modelo = 'aditivo') => {
    const mult = modelo === 'multiplicativo';
    const T = TS.mediaMovilCentrada(x, periodo);
    const det = x.map((v, i) => T[i] === null ? null : (mult ? v / T[i] : v - T[i]));
    const prom = [];
    for (let s = 0; s < periodo; s++) {
      let sum = 0, c = 0;
      for (let i = s; i < x.length; i += periodo) if (det[i] !== null) { sum += det[i]; c++; }
      prom.push(sum / c);
    }
    const mp = TS.media(prom);
    const idx = prom.map(v => mult ? v / mp : v - mp);
    const S = x.map((_, i) => idx[i % periodo]);
    const R = x.map((v, i) => T[i] === null ? null : (mult ? v / (T[i] * S[i]) : v - T[i] - S[i]));
    return { T, S, R, indices: idx, promedios: prom, sinTendencia: det };
  };

  /* ------------------------------ Datos ----------------------------- */
  TS.datos = {
    airpassengers: [
      112, 118, 132, 129, 121, 135, 148, 148, 136, 119, 104, 118,
      115, 126, 141, 135, 125, 149, 170, 170, 158, 133, 114, 140,
      145, 150, 178, 163, 172, 178, 199, 199, 184, 162, 146, 166,
      171, 180, 193, 181, 183, 218, 230, 242, 209, 191, 172, 194,
      196, 196, 236, 235, 229, 243, 264, 272, 237, 211, 180, 201,
      204, 188, 235, 227, 234, 264, 302, 293, 259, 229, 203, 229,
      242, 233, 267, 269, 270, 315, 364, 347, 312, 274, 237, 278,
      284, 277, 317, 313, 318, 374, 413, 405, 355, 306, 271, 306,
      315, 301, 356, 348, 355, 422, 465, 467, 404, 347, 305, 336,
      340, 318, 362, 348, 363, 435, 491, 505, 404, 359, 310, 337,
      360, 342, 406, 396, 420, 472, 548, 559, 463, 407, 362, 405,
      417, 391, 419, 461, 472, 535, 622, 606, 508, 461, 390, 432
    ],
    fechasMensuales(inicioAnio, n) {
      return TS.rango(n).map(i => `${inicioAnio + Math.floor(i / 12)}-${String(i % 12 + 1).padStart(2, '0')}-01`);
    }
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = TS;
  else global.TS = TS;
})(typeof window !== 'undefined' ? window : globalThis);
