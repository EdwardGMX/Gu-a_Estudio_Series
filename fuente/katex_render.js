// Renderiza fórmulas con KaTeX. Entrada (stdin): {"macros": {...}, "items": [[tex, display], ...]}
// Salida (stdout): {"out": [html, ...], "errores": [[tex, mensaje], ...]}
const katex = require('katex');
const fs = require('fs');

const entrada = JSON.parse(fs.readFileSync(0, 'utf8'));
const out = [];
const errores = [];
for (const [tex, display] of entrada.items) {
  try {
    out.push(katex.renderToString(tex, {
      displayMode: display,
      macros: { ...entrada.macros },
      trust: true,
      strict: 'ignore',
      throwOnError: true,
      output: 'html'
    }));
  } catch (e) {
    errores.push([tex, String(e.message)]);
    out.push(`<span class="katex-error">${tex.replace(/</g, '&lt;')}</span>`);
  }
}
process.stdout.write(JSON.stringify({ out, errores }));
