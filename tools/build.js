#!/usr/bin/env node
/*
 * Genereert de site in de repo-root uit de ontwerpbronnen in `design/`.
 *
 *   node tools/build.js
 *
 * De bronnen komen uit het Claude Design-project "Timmerly Prototype v2".
 * Het prototype (`Timmerly Prototype v2.dc.html`) wordt een single-page app:
 * de template gaat ongewijzigd in een <template>, de logica uit het
 * <script type="text/x-dc"> gaat naar assets/app.js, en assets/dc-runtime.js
 * rendert het geheel. De overige pagina's bevatten geen logica en worden
 * platgeslagen tot gewone HTML.
 *
 * Draai dit opnieuw na elke import uit Claude Design; handmatige wijzigingen
 * in de gegenereerde bestanden gaan dan verloren.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DESIGN = path.join(ROOT, 'design');
const ASSETS = path.join(ROOT, 'assets');

// Ontwerpbestand → pad in de site. Wat hier niet in staat wordt niet gebouwd.
const PAGES = {
  'Timmerly Prototype v2': { out: 'index.html', app: true, title: 'Timmerly — werk voor zzp-timmermannen' },
  'Over Timmerly': { out: 'over-timmerly.html', title: 'Over Timmerly' },
  'Hoe Het Werkt': { out: 'hoe-het-werkt.html', title: 'Hoe het werkt — Timmerly' },
  'Verificatie en Certificaten': { out: 'verificatie-en-certificaten.html', title: 'Verificatie en certificaten — Timmerly' },
  'AVG en Privacy': { out: 'avg-en-privacy.html', title: 'AVG en privacy — Timmerly' },
  Support: { out: 'support.html', title: 'Support — Timmerly' },
  'Algemene Voorwaarden': { out: 'algemene-voorwaarden.html', title: 'Algemene voorwaarden — Timmerly' },
  Privacybeleid: { out: 'privacybeleid.html', title: 'Privacybeleid — Timmerly' },
  Cookies: { out: 'cookies.html', title: 'Cookies — Timmerly' },
  'Architectuur en Roadmap': { out: 'architectuur-en-roadmap.html', title: 'Architectuur en roadmap — Timmerly' }
};

// Verwijzingen in het ontwerp gaan naar .dc.html-bestanden; die worden hier
// omgezet naar de gegenereerde paden. De v1-prototypes wijzen naar de app.
const LINKS = Object.assign(
  { 'Timmerly Prototype': 'index.html', 'Timmerly Prototype v1': 'index.html' },
  Object.fromEntries(Object.entries(PAGES).map(([name, p]) => [name, p.out]))
);

const read = (name) => fs.readFileSync(path.join(DESIGN, `${name}.dc.html`), 'utf8');

function section(src, tag) {
  const open = new RegExp(`<${tag}(?:\\s[^>]*)?>`).exec(src);
  if (!open) return null;
  const close = src.lastIndexOf(`</${tag}>`);
  if (close === -1) return null;
  return src.slice(open.index + open[0].length, close);
}

/** Template van een ontwerpbestand, met <helmet> eruit en imports ingevoegd. */
function template(name, seen = []) {
  if (seen.includes(name)) throw new Error(`Cirkelvormige dc-import via "${name}"`);
  let body = section(read(name), 'x-dc');
  if (body === null) throw new Error(`Geen <x-dc> gevonden in "${name}"`);

  body = body.replace(/<helmet>[\s\S]*?<\/helmet>/g, '');
  body = body.replace(/<dc-import\s+name="([^"]+)"[^>]*>\s*<\/dc-import>/g, (_, imported) =>
    template(imported, seen.concat([name]))
  );
  return body.trim();
}

/** De <style> uit de <helmet> van een ontwerpbestand. */
function styles(name) {
  const helmet = section(read(name), 'helmet');
  return helmet ? (section(helmet, 'style') || '').trim() : '';
}

/** De logica uit het <script type="text/x-dc">-blok. */
function logic(name) {
  const src = read(name);
  const open = /<script[^>]*data-dc-script[^>]*>/.exec(src);
  if (!open) return { code: '', props: {} };
  const close = src.indexOf('</script>', open.index);
  const rawProps = /data-props="([^"]*)"/.exec(open[0]);
  const props = rawProps
    ? JSON.parse(rawProps[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&'))
    : {};
  return { code: src.slice(open.index + open[0].length, close).trim(), props };
}

/** Standaardwaarden uit de propsdefinitie van het ontwerp. */
function defaultProps(props) {
  const out = {};
  for (const [key, def] of Object.entries(props)) {
    if (key.startsWith('$') || !def || typeof def !== 'object') continue;
    if ('default' in def) out[key] = def.default;
  }
  return out;
}

function rewriteLinks(html) {
  return html.replace(/href="([^"]+)\.dc\.html"/g, (whole, name) => {
    const target = LINKS[decodeURIComponent(name).replace(/\+/g, ' ')];
    return target ? `href="${target}"` : whole;
  });
}

const BANNER = '<!-- Gegenereerd uit design/ met `node tools/build.js` — niet handmatig bewerken. -->';

function page({ title, style, body, scripts = '' }) {
  return `<!DOCTYPE html>
<html lang="nl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
${BANNER}
<style>
${style}
  footer a:hover{color:#F26522}
</style>
</head>
<body>
${body}
${scripts}</body>
</html>
`;
}

function build() {
  const written = [];

  for (const [name, config] of Object.entries(PAGES)) {
    const body = rewriteLinks(template(name));

    if (!config.app) {
      fs.writeFileSync(path.join(ROOT, config.out), page({ title: config.title, style: styles(name), body }));
      written.push(config.out);
      continue;
    }

    const { code, props } = logic(name);
    fs.writeFileSync(
      path.join(ASSETS, 'app.js'),
      `/*\n * Gegenereerd uit "design/${name}.dc.html" met \`node tools/build.js\`.\n` +
        ` * De logica is de ontwerpbron zelf; alleen de koppeling onderaan is toegevoegd.\n */\n` +
        `'use strict';\n\n${code}\n\n` +
        `// Koppeling met assets/dc-runtime.js.\n` +
        `const DEFAULT_PROPS = ${JSON.stringify(defaultProps(props), null, 2)};\n\n` +
        `// Demo-props zijn via de URL te zetten, bijv. index.html?startScreen=admin\n` +
        `function propsFromUrl() {\n` +
        `  const params = new URLSearchParams(location.search);\n` +
        `  const props = Object.assign({}, DEFAULT_PROPS);\n` +
        `  for (const [key, value] of params) {\n` +
        `    if (!(key in DEFAULT_PROPS)) continue;\n` +
        `    props[key] = typeof DEFAULT_PROPS[key] === 'boolean' ? value !== 'false' : value;\n` +
        `  }\n` +
        `  return props;\n` +
        `}\n\n` +
        `DC.mount({ template: '#dc-template', mount: '#app', component: Component, props: propsFromUrl() });\n`
    );
    written.push('assets/app.js');

    fs.writeFileSync(
      path.join(ROOT, config.out),
      page({
        title: config.title,
        style: styles(name),
        body: `<div id="app"></div>\n\n<template id="dc-template">\n${body}\n</template>`,
        scripts: '<script src="assets/dc-runtime.js"></script>\n<script src="assets/app.js"></script>\n'
      })
    );
    written.push(config.out);
  }

  console.log(`Gebouwd:\n  ${written.join('\n  ')}`);
}

build();
