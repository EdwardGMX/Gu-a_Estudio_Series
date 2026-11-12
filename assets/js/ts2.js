/* =====================================================================
   ts2.js — Cálculos de la Unidad II (procesos lineales).
   Polinomios en el operador rezago, raíces, pesos ψ, ACF/PACF teóricas
   (mismo método que statsmodels.arma_acovf), simulación de ARMA, ARIMA
   y SARIMA, pronóstico con parámetros conocidos, verosimilitud, Box–Cox,
   pruebas de diagnóstico (Jarque–Bera, ARCH-LM, H de heterocedasticidad)
   y métricas de pronóstico. Usa TS (ts.js) para la ACF muestral, la
   regresión por MCO y las distribuciones.
   ===================================================================== */
(function (global) {
  'use strict';
  const TS = global.TS || (typeof require !== 'undefined' ? require('./ts.js') : null);
  const T2 = {};
  const EPS = 1e-12;

  /* ----------------------------- Complejos ----------------------------- */
  const cx = (re, im = 0) => ({ re, im });
  const cmul = (a, b) => cx(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re);
  const cdiv = (a, b) => { const d = b.re * b.re + b.im * b.im; return cx((a.re * b.re + a.im * b.im) / d, (a.im * b.re - a.re * b.im) / d); };
  const cadd = (a, b) => cx(a.re + b.re, a.im + b.im);
  const csub = (a, b) => cx(a.re - b.re, a.im - b.im);
  const cabs = a => Math.hypot(a.re, a.im);
  T2.complejo = { cx, cmul, cdiv, cadd, csub, cabs };
  T2.fmtComplejo = (z, d = 4) => {
    const r = Number(z.re.toFixed(d)), i = Number(Math.abs(z.im).toFixed(d));
    if (Math.abs(z.im) < 10 ** -d) return String(Object.is(r, -0) ? 0 : r);
    return `${Object.is(r, -0) ? 0 : r} ${z.im < 0 ? '−' : '+'} ${i}i`;
  };

  /* --------------------- Polinomios en el rezago L --------------------- */
  // Los coeficientes van en potencias crecientes: [a0, a1, a2] = a0 + a1·L + a2·L².
  T2.polMul = (a, b) => {
    const r = new Array(a.length + b.length - 1).fill(0);
    for (let i = 0; i < a.length; i++) if (a[i]) for (let j = 0; j < b.length; j++) r[i + j] += a[i] * b[j];
    return r;
  };
  T2.polPot = (a, k) => { let r = [1]; for (let i = 0; i < k; i++) r = T2.polMul(r, a); return r; };
  T2.polRecortar = a => { const r = a.slice(); while (r.length > 1 && Math.abs(r[r.length - 1]) < EPS) r.pop(); return r; };
  T2.polAR = phi => [1].concat(phi.map(v => -v));          // φ(L) = 1 − φ1 L − … − φp L^p
  T2.polMA = theta => [1].concat(theta.slice());            // θ(L) = 1 + θ1 L + … + θq L^q
  // Polinomio estacional en L^s: signo −1 para la parte AR (Φ) y +1 para la MA (Θ)
  T2.polEstacional = (coefs, s, signo) => {
    const r = new Array(coefs.length * s + 1).fill(0);
    r[0] = 1;
    coefs.forEach((c, k) => { r[(k + 1) * s] = signo * c; });
    return r;
  };
  T2.polDif = (d, D, s) => T2.polMul(T2.polPot([1, -1], d), T2.polPot(T2.polEstacional([1], s, -1), D));
  // SARIMA(p,d,q)(P,D,Q)s completo: ar = φ(L)Φ(L^s), ma = θ(L)Θ(L^s), arTotal = ar·(1−L)^d(1−L^s)^D
  T2.expandir = ({ phi = [], theta = [], Phi = [], Theta = [], s = 12, d = 0, D = 0 } = {}) => {
    const ar = T2.polRecortar(T2.polMul(T2.polAR(phi), Phi.length ? T2.polEstacional(Phi, s, -1) : [1]));
    const ma = T2.polRecortar(T2.polMul(T2.polMA(theta), Theta.length ? T2.polEstacional(Theta, s, 1) : [1]));
    const arTotal = T2.polRecortar(T2.polMul(ar, T2.polDif(d, D, s)));
    return { ar, ma, arTotal };
  };
  T2.polEval = (a, z) => {      // Horner con z complejo
    let r = cx(0);
    for (let i = a.length - 1; i >= 0; i--) r = cadd(cmul(r, z), cx(a[i]));
    return r;
  };
  // Raíces de a0 + a1 z + … + an z^n (Durand–Kerner + pulido de Newton)
  T2.raices = a => {
    const p = T2.polRecortar(a), n = p.length - 1;
    if (n < 1) return [];
    if (n === 1) return [cx(-p[0] / p[1])];
    if (n === 2) {
      const [c0, b, A] = p, disc = b * b - 4 * A * c0;
      if (disc >= 0) {
        const q = -0.5 * (b + (b >= 0 ? 1 : -1) * Math.sqrt(disc));
        const r1 = q / A, r2 = Math.abs(q) > 0 ? c0 / q : -b / A;
        return [cx(r1), cx(r2)].sort((x, y) => cabs(x) - cabs(y));
      }
      const re = -b / (2 * A), im = Math.sqrt(-disc) / (2 * Math.abs(A));
      return [cx(re, im), cx(re, -im)];
    }
    const lider = p[n], m = p.map(v => v / lider);
    let R = 0;
    for (let i = 0; i < n; i++) R = Math.max(R, Math.abs(m[i]));
    R = 1 + R;
    let z = Array.from({ length: n }, (_, k) => {
      const ang = 2 * Math.PI * k / n + 0.4;
      return cx(0.6 * Math.min(R, 2) * Math.cos(ang), 0.6 * Math.min(R, 2) * Math.sin(ang));
    });
    for (let it = 0; it < 2000; it++) {
      let cambio = 0;
      const nz = z.map((zi, i) => {
        let den = cx(1);
        for (let j = 0; j < n; j++) if (j !== i) den = cmul(den, csub(zi, z[j]));
        const paso = cdiv(T2.polEval(m, zi), den);
        cambio = Math.max(cambio, cabs(paso));
        return csub(zi, paso);
      });
      z = nz;
      if (cambio < 1e-14) break;
    }
    const dp = m.slice(1).map((v, i) => v * (i + 1));
    z = z.map(zi => {
      for (let k = 0; k < 3; k++) {
        const f = T2.polEval(m, zi), df = T2.polEval(dp, zi);
        if (cabs(df) < 1e-300) break;
        zi = csub(zi, cdiv(f, df));
      }
      if (Math.abs(zi.im) < 1e-10 * Math.max(1, Math.abs(zi.re))) zi = cx(zi.re, 0);
      return zi;
    });
    return z.sort((x, y) => cabs(x) - cabs(y) || x.re - y.re || x.im - y.im);
  };
  T2.minModulo = a => { const r = T2.raices(a); return r.length ? Math.min(...r.map(cabs)) : Infinity; };
  T2.esEstacionario = ar => T2.minModulo(ar) > 1 + 1e-9;
  T2.esInvertible = ma => T2.minModulo(ma) > 1 + 1e-9;
  // 1 + c1 L + … invertido como serie de potencias (n términos): útil para AR(∞) o MA(∞)
  T2.polInvertir = (a, n) => {
    const r = new Array(n).fill(0);
    r[0] = 1 / a[0];
    for (let j = 1; j < n; j++) {
      let v = 0;
      for (let i = 1; i < a.length && i <= j; i++) v += a[i] * r[j - i];
      r[j] = -v / a[0];
    }
    return r;
  };

  /* ---------------------- Pesos ψ (forma MA(∞)) ------------------------ */
  // ar(L) ψ(L) = ma(L) ⇒ ψ_j = ma_j − Σ_{i=1}^{p} ar_i ψ_{j−i}   (= statsmodels arma2ma)
  T2.psi = (ar, ma, n) => {
    const psi = new Array(n).fill(0);
    for (let j = 0; j < n; j++) {
      let v = j < ma.length ? ma[j] : 0;
      for (let i = 1; i < ar.length && i <= j; i++) v -= ar[i] * psi[j - i];
      psi[j] = v;
    }
    return psi;
  };
  // π (forma AR(∞)): ma(L) π(L) = ar(L)  ⇒ ε_t = Σ π_j y_{t−j}
  T2.pi = (ar, ma, n) => T2.psi(ma, ar, n);

  /* ---------------- Sistemas lineales (eliminación gaussiana) ----------- */
  T2.resolver = (A, b) => {
    const n = A.length, M = A.map((f, i) => f.slice().concat([b[i]]));
    for (let c = 0; c < n; c++) {
      let piv = c;
      for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[piv][c])) piv = r;
      [M[c], M[piv]] = [M[piv], M[c]];
      const d = M[c][c];
      if (Math.abs(d) < 1e-300) return null;
      for (let j = c; j <= n; j++) M[c][j] /= d;
      for (let r = 0; r < n; r++) {
        if (r === c) continue;
        const f = M[r][c];
        if (f) for (let j = c; j <= n; j++) M[r][j] -= f * M[c][j];
      }
    }
    return M.map(f => f[n]);
  };

  /* ------------------ Autocovarianza / ACF / PACF teóricas -------------- */
  // Igual que statsmodels.tsa.arima_process.arma_acovf (Brockwell & Davis, ec. 3.3.8–3.3.9)
  T2.acvfTeorica = (ar, ma, nlags, sigma2 = 1) => {
    const p = ar.length - 1, q = ma.length - 1, m = Math.max(p, q) + 1;
    const psi = T2.psi(ar, ma, m), A = [], b = [], ta = new Array(m).fill(0);
    for (let i = 0; i <= p && i < m; i++) ta[i] = ar[i];
    for (let k = 0; k < m; k++) {
      const fila = new Array(m).fill(0);
      for (let j = 0; j <= k; j++) fila[j] += ta[k - j];
      for (let j = 1; j < m - k; j++) fila[j] += ta[k + j];
      A.push(fila);
      let s = 0;
      for (let j = k; j <= q; j++) s += ma[j] * psi[j - k];
      b.push(sigma2 * s);
    }
    const g0 = T2.resolver(A, b);
    if (!g0) return null;
    const g = g0.slice(0, Math.max(nlags + 1, m));
    for (let k = m; k <= nlags; k++) {
      let v = 0;
      for (let i = 1; i <= p; i++) v -= ar[i] * g[k - i];
      g[k] = v;
    }
    return g.slice(0, nlags + 1);
  };
  T2.acfTeorica = (ar, ma, nlags) => {
    const g = T2.acvfTeorica(ar, ma, nlags, 1);
    return g ? g.map(v => v / g[0]) : null;
  };
  T2.pacfTeorica = (ar, ma, nlags) => {
    const r = T2.acfTeorica(ar, ma, nlags);
    return r ? TS.pacfDesdeAcf(r, nlags) : null;
  };

  /* ------------------------------- Simulación --------------------------- */
  // ar(L) y_t = c + ma(L) ε_t   (ar y ma ya expandidos; ar sin diferencias)
  T2.simularARMA = (ar, ma, n, { semilla = 1, sigma = 1, c = 0, quemado = 500, eps = null } = {}) => {
    const tot = n + quemado, e = eps ? eps.slice() : TS.rng(semilla).normales(tot, sigma);
    const sAr = ar.reduce((s, v) => s + v, 0), mu = Math.abs(sAr) > 1e-9 ? c / sAr : 0;
    const y = new Array(tot).fill(0);
    for (let t = 0; t < tot; t++) {
      let v = c + e[t];
      for (let j = 1; j < ma.length; j++) if (t - j >= 0) v += ma[j] * e[t - j];
      for (let i = 1; i < ar.length; i++) v -= ar[i] * (t - i >= 0 ? y[t - i] : mu);
      y[t] = v;
    }
    return { y: y.slice(quemado), e: e.slice(quemado) };
  };
  // Deshace (1−L)^d (1−L^s)^D partiendo de valores iniciales (por defecto ceros)
  T2.integrar = (w, d, D, s, { inicioS = null, nivel = 0 } = {}) => {
    let x = w.slice();
    for (let k = 0; k < D; k++) {
      const out = [];
      for (let t = 0; t < x.length; t++) out.push(x[t] + (t - s >= 0 ? out[t - s] : (inicioS && k === D - 1 ? inicioS[t % s] : 0)));
      x = out;
    }
    for (let k = 0; k < d; k++) {
      let acum = k === d - 1 ? nivel : 0;
      x = x.map(v => (acum += v));
    }
    if (d === 0 && nivel) x = x.map(v => v + nivel);
    return x;
  };
  T2.simularSARIMA = (mod, n, opc = {}) => {
    const { ar, ma } = T2.expandir(mod), d = mod.d || 0, D = mod.D || 0, s = mod.s || 12;
    const r = T2.simularARMA(ar, ma, n, { semilla: opc.semilla || 1, sigma: opc.sigma || 1, c: mod.c || 0, quemado: opc.quemado === undefined ? 500 : opc.quemado });
    return { y: T2.integrar(r.y, d, D, s, { inicioS: opc.inicioS || null, nivel: opc.nivel || 0 }), w: r.y, e: r.e };
  };
  T2.simARCH = (n, omega, alpha, { semilla = 1, quemado = 500, mu = 0 } = {}) => {
    const z = TS.rng(semilla).normales(n + quemado);
    const e = [], s2 = [];
    let prev = omega / Math.max(1e-9, 1 - Math.min(alpha, 0.999));
    let ePrev = Math.sqrt(prev) * z[0];
    for (let t = 0; t < n + quemado; t++) {
      const v = omega + alpha * ePrev * ePrev;
      const et = Math.sqrt(v) * z[t];
      e.push(et); s2.push(v);
      ePrev = et;
    }
    return { e: e.slice(quemado).map(v => v + mu), s2: s2.slice(quemado), z: z.slice(quemado) };
  };

  /* ---------- Residuos condicionales y pronóstico con parámetros -------- */
  // ε_t = y_t − c + Σ ar_i y_{t−i} − Σ ma_j ε_{t−j}, empezando en t = p (ε previos = 0)
  T2.residuosCSS = (y, ar, ma, c = 0) => {
    const p = ar.length - 1, n = y.length, e = new Array(n).fill(0);
    for (let t = p; t < n; t++) {
      let v = y[t] - c;
      for (let i = 1; i <= p; i++) v += ar[i] * y[t - i];
      for (let j = 1; j < ma.length; j++) if (t - j >= p) v -= ma[j] * e[t - j];
      e[t] = v;
    }
    return { e, desde: p };
  };
  T2.pronosticar = (y, arTotal, ma, h, { c = 0, sigma2 = 1, alpha = 0.05, residuos = null } = {}) => {
    const n = y.length, p = arTotal.length - 1;
    const e = residuos || T2.residuosCSS(y, arTotal, ma, c).e;
    const ext = y.slice(), z = TS.normppf(1 - alpha / 2), psi = T2.psi(arTotal, ma, h);
    const media = [], ee = [], inf = [], sup = [];
    let acum = 0;
    for (let k = 1; k <= h; k++) {
      const t = n + k - 1;
      let v = c;
      for (let i = 1; i <= p; i++) v -= arTotal[i] * ext[t - i];
      for (let j = k; j < ma.length; j++) if (t - j >= 0 && t - j < n) v += ma[j] * e[t - j];
      ext.push(v);
      acum += psi[k - 1] * psi[k - 1];
      const se = Math.sqrt(sigma2 * acum);
      media.push(v); ee.push(se); inf.push(v - z * se); sup.push(v + z * se);
    }
    return { media, ee, inf, sup, psi, z };
  };

  /* ---------------------------- Verosimilitud --------------------------- */
  const LN2PI = Math.log(2 * Math.PI);
  T2.llNormal = (y, mu, s2) => y.reduce((s, v) => s - 0.5 * (LN2PI + Math.log(s2) + (v - mu) * (v - mu) / s2), 0);
  // AR(1): y_t = c + φ y_{t−1} + ε_t. Condicional (desde t = 2) o exacta (incluye y_1)
  T2.llAR1 = (y, phi, c, s2, exacta = false) => {
    let ll = 0;
    for (let t = 1; t < y.length; t++) { const r = y[t] - c - phi * y[t - 1]; ll -= 0.5 * (LN2PI + Math.log(s2) + r * r / s2); }
    if (exacta) {
      if (Math.abs(phi) >= 1) return -Infinity;
      const mu = c / (1 - phi), v = s2 / (1 - phi * phi), r = y[0] - mu;
      ll -= 0.5 * (LN2PI + Math.log(v) + r * r / v);
    }
    return ll;
  };
  // Log-verosimilitud concentrada (σ² = SSR/n): la que se maximiza al estimar
  T2.llConcentrada = (ssr, n) => -n / 2 * (LN2PI + Math.log(ssr / n) + 1);
  T2.cssARMA = (y, ar, ma, c = 0, desde = null) => {
    const r = T2.residuosCSS(y, ar, ma, c), ini = desde === null ? r.desde : desde;
    let ssr = 0;
    for (let t = ini; t < y.length; t++) ssr += r.e[t] * r.e[t];
    const n = y.length - ini;
    return { e: r.e, ssr, n, sigma2: ssr / n, llf: T2.llConcentrada(ssr, n) };
  };
  // Nelder–Mead (minimiza f)
  T2.nelderMead = (f, x0, { iter = 800, tol = 1e-10, paso = 0.1 } = {}) => {
    const n = x0.length;
    let S = [x0.slice()];
    for (let i = 0; i < n; i++) { const v = x0.slice(); v[i] += v[i] ? paso * Math.max(1, Math.abs(v[i])) : paso; S.push(v); }
    let F = S.map(f);
    for (let it = 0; it < iter; it++) {
      const idx = F.map((v, i) => i).sort((a, b) => F[a] - F[b]);
      S = idx.map(i => S[i]); F = idx.map(i => F[i]);
      if (Math.abs(F[n] - F[0]) < tol * (1 + Math.abs(F[0]))) break;
      const cen = new Array(n).fill(0);
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) cen[j] += S[i][j] / n;
      const pt = a => cen.map((v, j) => v + a * (S[n][j] - v));
      const xr = pt(-1), fr = f(xr);
      if (fr < F[0]) { const xe = pt(-2), fe = f(xe); if (fe < fr) { S[n] = xe; F[n] = fe; } else { S[n] = xr; F[n] = fr; } }
      else if (fr < F[n - 1]) { S[n] = xr; F[n] = fr; }
      else {
        const xc = fr < F[n] ? pt(-0.5) : pt(0.5), fc = f(xc);
        if (fc < Math.min(fr, F[n])) { S[n] = xc; F[n] = fc; }
        else { for (let i = 1; i <= n; i++) { S[i] = S[i].map((v, j) => S[0][j] + 0.5 * (v - S[0][j])); F[i] = f(S[i]); } }
      }
    }
    const k = F.indexOf(Math.min(...F));
    return { x: S[k], f: F[k] };
  };
  // ARMA(p, q) por mínimos cuadrados condicionales (CSS). desde = obs. con que se condiciona.
  T2.ajustarARMA = (y, p, q, { constante = true, desde = null } = {}) => {
    const ini = desde === null ? p : desde, my = TS.media(y);
    const arma = v => {
      const c = constante ? v[0] : 0, o = constante ? 1 : 0;
      return { c, ar: T2.polAR(v.slice(o, o + p)), ma: T2.polMA(v.slice(o + p, o + p + q)) };
    };
    const obj = v => {
      const m = arma(v);
      if (p && !T2.esEstacionario(m.ar)) return 1e12;
      if (q && !T2.esInvertible(m.ma)) return 1e12;
      return T2.cssARMA(y, m.ar, m.ma, m.c, ini).ssr;
    };
    const x0 = (constante ? [my * (1 - 0.1 * p)] : []).concat(new Array(p).fill(0.1), new Array(q).fill(0.1));
    let mejor = x0.length ? T2.nelderMead(obj, x0, { paso: 0.2 }) : { x: [], f: obj([]) };
    if (x0.length) mejor = T2.nelderMead(obj, mejor.x, { paso: 0.05 });
    const m = arma(mejor.x), r = T2.cssARMA(y, m.ar, m.ma, m.c, ini), k = x0.length + 1;
    return { params: mejor.x, c: m.c, phi: mejor.x.slice(constante ? 1 : 0, (constante ? 1 : 0) + p), theta: mejor.x.slice((constante ? 1 : 0) + p),
      ar: m.ar, ma: m.ma, sigma2: r.sigma2, llf: r.llf, n: r.n, k, aic: -2 * r.llf + 2 * k, bic: -2 * r.llf + k * Math.log(r.n),
      hqic: -2 * r.llf + 2 * k * Math.log(Math.log(r.n)), resid: r.e.slice(ini) };
  };
  // AR(p) por MCO (= máxima verosimilitud condicional), con una muestra común que empieza en holdBack
  T2.ajustarAR = (y, p, { constante = true, holdBack = null } = {}) => {
    const hb = holdBack === null ? p : holdBack, X = [], z = [];
    for (let t = hb; t < y.length; t++) {
      const f = constante ? [1] : [];
      for (let j = 1; j <= p; j++) f.push(y[t - j]);
      X.push(f); z.push(y[t]);
    }
    const n = z.length;
    let beta = [], se = [], resid = z.slice(), ssr;
    if (X[0].length) { const r = TS.ols(X, z); beta = r.beta; se = r.se; resid = r.resid; ssr = r.ssr; }
    else ssr = TS.suma(z.map(v => v * v));
    const llf = T2.llConcentrada(ssr, n), k = X[0].length + 1;
    return { beta, se, resid, sigma2: ssr / n, llf, n, k, aic: -2 * llf + 2 * k, bic: -2 * llf + k * Math.log(n), hqic: -2 * llf + 2 * k * Math.log(Math.log(n)) };
  };
  // Yule–Walker: method 'mle' (divide entre n, como acf) o 'adjusted' (entre n − k, defecto de statsmodels.yule_walker)
  T2.yuleWalker = (x, p, metodo = 'mle') => {
    const n = x.length, m = TS.media(x), g = [];
    for (let k = 0; k <= p; k++) { let s = 0; for (let t = k; t < n; t++) s += (x[t] - m) * (x[t - k] - m); g.push(s / (metodo === 'adjusted' ? n - k : n)); }
    const R = [], b = [];
    for (let i = 0; i < p; i++) { R.push(TS.rango(p).map(j => g[Math.abs(i - j)])); b.push(g[i + 1]); }
    const phi = p ? T2.resolver(R, b) : [];
    const sigma2 = g[0] - phi.reduce((s, v, i) => s + v * g[i + 1], 0);
    return { phi, sigma2, gamma: g };
  };

  /* -------------------------------- Box–Cox ----------------------------- */
  T2.boxcox = (y, lam) => y.map(v => Math.abs(lam) < 1e-12 ? Math.log(v) : (Math.pow(v, lam) - 1) / lam);
  T2.invBoxcox = (z, lam) => z.map(v => Math.abs(lam) < 1e-12 ? Math.exp(v) : Math.pow(lam * v + 1, 1 / lam));
  // = scipy.stats.boxcox_llf: (λ − 1) Σ ln y − (n/2) ln σ̂²(λ)   (σ̂² con n)
  T2.boxcoxLLF = (y, lam) => {
    const n = y.length, sl = TS.suma(y.map(Math.log));
    return (lam - 1) * sl - n / 2 * Math.log(TS.varianza(T2.boxcox(y, lam), 0));
  };
  T2.boxcoxMLE = (y, a = -2, b = 3) => {
    let lo = a, hi = b;
    const f = l => -T2.boxcoxLLF(y, l), g = (Math.sqrt(5) - 1) / 2;
    let x1 = hi - g * (hi - lo), x2 = lo + g * (hi - lo), f1 = f(x1), f2 = f(x2);
    for (let i = 0; i < 120; i++) {
      if (f1 < f2) { hi = x2; x2 = x1; f2 = f1; x1 = hi - g * (hi - lo); f1 = f(x1); }
      else { lo = x1; x1 = x2; f1 = f2; x2 = lo + g * (hi - lo); f2 = f(x2); }
    }
    return (lo + hi) / 2;
  };

  /* -------------------------- Distribuciones extra ----------------------- */
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
  T2.lnGamma = lnGamma;
  function betacf(a, b, x) {
    const MIN = 1e-300, qab = a + b, qap = a + 1, qam = a - 1;
    let c = 1, d = 1 - qab * x / qap;
    if (Math.abs(d) < MIN) d = MIN;
    d = 1 / d;
    let h = d;
    for (let m = 1; m <= 3000; m++) {
      const m2 = 2 * m;
      let aa = m * (b - m) * x / ((qam + m2) * (a + m2));
      d = 1 + aa * d; if (Math.abs(d) < MIN) d = MIN;
      c = 1 + aa / c; if (Math.abs(c) < MIN) c = MIN;
      d = 1 / d; h *= d * c;
      aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
      d = 1 + aa * d; if (Math.abs(d) < MIN) d = MIN;
      c = 1 + aa / c; if (Math.abs(c) < MIN) c = MIN;
      d = 1 / d;
      const del = d * c;
      h *= del;
      if (Math.abs(del - 1) < 1e-15) break;
    }
    return h;
  }
  // Beta incompleta regularizada I_x(a, b)
  T2.betaInc = (a, b, x) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    const bt = Math.exp(lnGamma(a + b) - lnGamma(a) - lnGamma(b) + a * Math.log(x) + b * Math.log(1 - x));
    return x < (a + 1) / (a + b + 2) ? bt * betacf(a, b, x) / a : 1 - bt * betacf(b, a, 1 - x) / b;
  };
  T2.fcdf = (x, d1, d2) => x <= 0 ? 0 : T2.betaInc(d1 / 2, d2 / 2, d1 * x / (d1 * x + d2));
  T2.fsf = (x, d1, d2) => x <= 0 ? 1 : T2.betaInc(d2 / 2, d1 / 2, d2 / (d2 + d1 * x));
  T2.normpdf = (x, mu = 0, s = 1) => Math.exp(-0.5 * ((x - mu) / s) ** 2) / (s * Math.sqrt(2 * Math.PI));
  T2.chi2pdf = (x, k) => x <= 0 ? 0 : Math.exp((k / 2 - 1) * Math.log(x) - x / 2 - (k / 2) * Math.log(2) - lnGamma(k / 2));

  /* ---------------------------- Diagnóstico ----------------------------- */
  // Momentos sesgados (como scipy.stats.skew/kurtosis con bias=True)
  T2.momentos = e => {
    const n = e.length, m = TS.media(e);
    let m2 = 0, m3 = 0, m4 = 0;
    for (const v of e) { const d = v - m; m2 += d * d; m3 += d * d * d; m4 += d * d * d * d; }
    m2 /= n; m3 /= n; m4 /= n;
    return { n, media: m, var: m2, skew: m3 / Math.pow(m2, 1.5), kurt: m4 / (m2 * m2) };
  };
  // statsmodels.stats.stattools.jarque_bera
  T2.jarqueBera = e => {
    const M = T2.momentos(e), jb = M.n / 6 * (M.skew * M.skew + 0.25 * (M.kurt - 3) ** 2);
    return { jb, p: TS.chi2sf(jb, 2), skew: M.skew, kurt: M.kurt, n: M.n, partes: [M.n / 6 * M.skew * M.skew, M.n / 24 * (M.kurt - 3) ** 2] };
  };
  // statsmodels.stats.diagnostic.het_arch (ARCH-LM): e²_t sobre constante y nlags rezagos; LM = n·R²
  T2.hetArch = (e, nlags = null) => {
    const n0 = e.length, q = nlags === null ? Math.min(10, Math.floor(n0 / 5)) : nlags;
    const e2 = e.map(v => v * v), X = [], z = [];
    for (let t = q; t < n0; t++) { const f = [1]; for (let j = 1; j <= q; j++) f.push(e2[t - j]); X.push(f); z.push(e2[t]); }
    const r = TS.ols(X, z), n = z.length, mz = TS.media(z);
    const sst = TS.suma(z.map(v => (v - mz) * (v - mz))), r2 = 1 - r.ssr / sst;
    const lm = n * r2, f = (r2 / q) / ((1 - r2) / (n - q - 1));
    return { lm, p: TS.chi2sf(lm, q), f, fp: T2.fsf(f, q, n - q - 1), r2, n, nlags: q, beta: r.beta };
  };
  // Prueba H de statsmodels (test_heteroskedasticity, 'breakvar', dos colas)
  T2.hetH = (e, { alternativa = 'two-sided' } = {}) => {
    const n = e.length, h = Math.round(n / 3);
    let num = 0, den = 0;
    for (let i = n - h; i < n; i++) num += e[i] * e[i];
    for (let i = 0; i < h; i++) den += e[i] * e[i];
    const H = num / den, inf = T2.fcdf(H, h, h), sup = T2.fsf(H, h, h);
    return { H, h, p: alternativa === 'two-sided' ? Math.min(1, 2 * Math.min(inf, sup)) : sup, num, den };
  };
  // gaussian_kde (regla de Scott: h = sd·n^(−1/5), sd con ddof = 1)
  T2.kde = (x, puntos) => {
    const n = x.length, h = TS.desv(x, 1) * Math.pow(n, -0.2);
    return puntos.map(p => x.reduce((s, v) => s + T2.normpdf(p, v, h), 0) / n);
  };
  // Datos del gráfico Q-Q (posiciones i/(n+1) como statsmodels.qqplot) y recta 's'
  T2.qq = x => {
    const n = x.length, o = x.slice().sort((a, b) => a - b), m = TS.media(x), s = TS.desv(x, 0);
    const teo = o.map((_, i) => TS.normppf((i + 1) / (n + 1)));
    return { teo, obs: o, recta: teo.map(t => m + s * t) };
  };

  /* -------------------------------- Métricas ----------------------------- */
  T2.metricas = (y, f, { entrenamiento = null, m = 1 } = {}) => {
    const n = y.length, err = y.map((v, i) => v - f[i]);
    const mae = TS.media(err.map(Math.abs)), mse = TS.media(err.map(v => v * v));
    const mape = 100 * TS.media(y.map((v, i) => Math.abs(err[i] / v)));
    const smape = 100 * TS.media(y.map((v, i) => 2 * Math.abs(err[i]) / (Math.abs(v) + Math.abs(f[i]))));
    let escala = null;
    if (entrenamiento && entrenamiento.length > m) escala = TS.media(TS.diff(entrenamiento, m).map(Math.abs));
    return { n, mae, mse, rmse: Math.sqrt(mse), mape, smape, mase: escala ? mae / escala : null, escala, err };
  };

  /* --------------------------- AR(2) y otros ----------------------------- */
  T2.ar2Info = (phi1, phi2) => {
    const disc = phi1 * phi1 + 4 * phi2, est = phi1 + phi2 < 1 && phi2 - phi1 < 1 && Math.abs(phi2) < 1;
    const info = { estacionario: est, complejas: disc < 0, raices: T2.raices([1, -phi1, -phi2]) };
    if (disc < 0 && phi2 < 0) {
      const r = Math.sqrt(-phi2), cosw = phi1 / (2 * r);
      info.amortiguamiento = r;
      info.w = Math.acos(Math.max(-1, Math.min(1, cosw)));
      info.periodo = 2 * Math.PI / info.w;
    }
    return info;
  };
  // Suavizamiento exponencial simple (para comparar con ARIMA(0,1,1))
  T2.ses = (y, alpha, l0 = null) => {
    let l = l0 === null ? y[0] : l0;
    const prono = [];
    for (const v of y) { prono.push(l); l = alpha * v + (1 - alpha) * l; }
    return { prono, nivel: l };
  };

  /* --------------------- Modelos de referencia (benchmarks) --------------------
     Las mismas fórmulas de statsforecast: HistoricAverage, Naive, SeasonalNaive y
     RandomWalkWithDrift. Ajustados, residuales, σ̂ y bandas normales. */
  T2.REF_NOMBRES = { ha: 'HistoricAverage', n: 'Naive', sn: 'SeasonalNaive', rwd: 'RWD' };
  T2.refAjustar = (y, m = 1) => {
    const T = y.length, mu = y.reduce((a, b) => a + b, 0) / T, b = (y[T - 1] - y[0]) / (T - 1);
    const fit = {
      ha: y.map(() => mu),
      n: y.map((v, i) => (i < 1 ? NaN : y[i - 1])),
      sn: y.map((v, i) => (i < m ? NaN : y[i - m])),
      rwd: y.map((v, i) => (i < 1 ? NaN : y[i - 1] + b))
    };
    const res = {}, sig = {}, ss = {};
    for (const k of Object.keys(fit)) {
      res[k] = y.map((v, i) => v - fit[k][i]);
      ss[k] = res[k].filter(Number.isFinite).reduce((a, e) => a + e * e, 0);
    }
    // Divisores de statsforecast: T−1 (media, ingenuo y deriva) y T−m (estacional)
    sig.ha = Math.sqrt(ss.ha / (T - 1));
    sig.n = Math.sqrt(ss.n / (T - 1));
    sig.sn = Math.sqrt(ss.sn / (T - m));
    sig.rwd = Math.sqrt(ss.rwd / (T - 1));
    return { T, m, mu, b, fit, res, sig, ss };
  };
  // Factor que multiplica a σ̂ en el horizonte h (σ̂_h = σ̂ · factor)
  T2.refFactor = (k, h, T, m) => k === 'ha' ? Math.sqrt(1 + 1 / T) : k === 'n' ? Math.sqrt(h)
    : k === 'sn' ? Math.sqrt(Math.floor((h - 1) / m) + 1) : Math.sqrt(h * (1 + h / (T - 1)));
  T2.refPronostico = (y, h, { m = 1, niveles = [], A = null } = {}) => {
    A = A || T2.refAjustar(y, m);
    const T = A.T, out = {};
    for (const k of ['ha', 'n', 'sn', 'rwd']) {
      const media = [], sd = [];
      for (let j = 1; j <= h; j++) {
        media.push(k === 'ha' ? A.mu : k === 'n' ? y[T - 1] : k === 'sn' ? y[T - m + ((j - 1) % m)] : y[T - 1] + j * A.b);
        sd.push(A.sig[k] * T2.refFactor(k, j, T, m));
      }
      const bandas = {};
      for (const nv of niveles) {
        const z = TS.normppf(0.5 + nv / 200);
        bandas[nv] = { lo: media.map((v, i) => v - z * sd[i]), hi: media.map((v, i) => v + z * sd[i]), z };
      }
      out[k] = { media, sd, bandas };
    }
    return { A, ...out };
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = T2;
  else global.TS2 = T2;
})(typeof window !== 'undefined' ? window : globalThis);
