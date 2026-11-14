// Renders the wireframe design-component screens into a plain static web app.
// Usage: node tools/build.mjs
import fs from 'fs';
import path from 'path';

const OUT = 'app';
const SRC = 'decoded';

/* ------------------------------------------------------------------ parsing */

const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
const RAWTEXT = new Set(['style', 'script', 'textarea', 'title']);

function parseAttrs(s) {
  const attrs = {};
  const re = /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  let m;
  while ((m = re.exec(s))) {
    const name = m[1].toLowerCase();
    if (name === '/') continue;
    attrs[name] = m[2] ?? m[3] ?? m[4] ?? '';
  }
  return attrs;
}

function parseHTML(str) {
  const root = { type: 'root', name: '#root', children: [] };
  const stack = [root];
  const push = (node) => stack[stack.length - 1].children.push(node);
  let i = 0;

  while (i < str.length) {
    const lt = str.indexOf('<', i);
    if (lt === -1) {
      if (i < str.length) push({ type: 'text', text: str.slice(i) });
      break;
    }
    if (lt > i) push({ type: 'text', text: str.slice(i, lt) });

    if (str.startsWith('<!--', lt)) {
      const e = str.indexOf('-->', lt);
      i = e === -1 ? str.length : e + 3;
      continue;
    }
    if (str.startsWith('<!', lt) || str.startsWith('<?', lt)) {
      const e = str.indexOf('>', lt);
      i = e === -1 ? str.length : e + 1;
      continue;
    }

    let j = lt + 1;
    let quote = null;
    while (j < str.length) {
      const c = str[j];
      if (quote) { if (c === quote) quote = null; }
      else if (c === '"' || c === "'") quote = c;
      else if (c === '>') break;
      j++;
    }
    const raw = str.slice(lt + 1, j);
    i = j + 1;

    if (raw.startsWith('/')) {
      const name = raw.slice(1).trim().toLowerCase();
      for (let k = stack.length - 1; k > 0; k--) {
        if (stack[k].name === name) { stack.length = k; break; }
      }
      continue;
    }

    const selfClosing = raw.endsWith('/');
    const body = selfClosing ? raw.slice(0, -1) : raw;
    const m = body.match(/^([a-zA-Z0-9:-]+)/);
    if (!m) continue;
    const name = m[1].toLowerCase();
    const node = { type: 'el', name, attrs: parseAttrs(body.slice(m[1].length)), children: [] };
    push(node);

    if (RAWTEXT.has(name)) {
      const close = new RegExp('</' + name + '\\s*>', 'i');
      const rest = str.slice(i);
      const cm = rest.match(close);
      if (cm) {
        node.children = [{ type: 'text', text: rest.slice(0, cm.index) }];
        node.rawtext = true;
        i += cm.index + cm[0].length;
      }
      continue;
    }
    if (!selfClosing && !VOID.has(name)) stack.push(node);
  }
  return root;
}

/* -------------------------------------------------------------- rendering */

const evalCache = new Map();
function evaluate(code, scope) {
  let fn = evalCache.get(code);
  if (!fn) {
    fn = new Function('scope', 'with (scope) { return (' + code + '); }');
    evalCache.set(code, fn);
  }
  return fn(scope);
}

const BINDING = /\{\{([\s\S]*?)\}\}/g;
function isBindingOnly(v) {
  const m = String(v).match(/^\s*\{\{([\s\S]*)\}\}\s*$/);
  return m ? m[1] : null;
}
function interpolate(str, scope) {
  return String(str).replace(BINDING, (_, code) => {
    const v = evaluate(code, scope);
    return v === undefined || v === null ? '' : String(v);
  });
}

const LINK_MAP = {
  'Main.dc.html': 'home.html',
  'NextStep.dc.html': 'home.html',
  'RiskCheck.dc.html': 'risk-check.html',
  'ReportPick.dc.html': 'report-pick.html',
  'ReportQuestion.dc.html': 'report-question.html',
  'ReportWords.dc.html': 'report-words.html',
  'ReportUrgent.dc.html': 'report-urgent.html',
  'Timeline.dc.html': 'timeline.html',
  'Confirm.dc.html': 'confirm.html',
  'Medication.dc.html': 'medication.html',
  'Learn.dc.html': 'learn.html',
  'Accessibility.dc.html': 'accessibility.html',
  'Help.dc.html': 'help.html',
  'CarePlanCard.dc.html': 'timeline.html',
  'TrustedPerson.dc.html': 'support-person.html',
  'Worklist.dc.html': null,
  'Dashboard.dc.html': null,
};

function mapHref(href) {
  if (!href) return '#';
  if (LINK_MAP[href] === null) return '#';
  if (LINK_MAP[href]) return LINK_MAP[href];
  if (href.startsWith('#')) return href;
  if (/^tel:|^mailto:|^https?:/.test(href)) return href;
  return '#';
}

function findEl(node, name) {
  if (!node.children) return null;
  for (const child of node.children) {
    if (child.type === 'el' && child.name === name) return child;
    const found = findEl(child, name);
    if (found) return found;
  }
  return null;
}

function renderNodes(nodes, scope) {
  let out = '';
  for (const node of nodes) out += renderNode(node, scope);
  return out;
}

function renderNode(node, scope) {
  if (node.type === 'text') return interpolate(node.text, scope);
  if (node.name === 'helmet' || node.name === 'script' || node.name === 'style') return '';
  if (node.rawtext) {
    const text = node.children.map((c) => c.text).join('');
    return '<' + node.name + '>' + text + '</' + node.name + '>';
  }
  if (node.name === 'x-dc') return renderNodes(node.children, scope);
  if (node.name === 'sc-for') {
    const list = evaluate(isBindingOnly(node.attrs.list) || '[]', scope) || [];
    const as = node.attrs.as || 'item';
    return list
      .map((item, index) => renderNodes(node.children, { ...scope, [as]: item, $index: index }))
      .join('');
  }
  if (node.name === 'sc-if') {
    const cond = evaluate(isBindingOnly(node.attrs.value) || 'false', scope);
    return cond ? renderNodes(node.children, scope) : '';
  }

  const attrs = [];
  for (const [key, value] of Object.entries(node.attrs)) {
    if (key.startsWith('hint-')) continue;
    if (key === 'sc-camel-view-box') { attrs.push(['viewBox', value]); continue; }
    if (key === 'sc-camel-on-click') continue; // no behaviour in the static build
    if (key.startsWith('sc-')) continue;
    attrs.push([key, value]);
  }

  const rendered = [];
  for (const [key, rawValue] of attrs) {
    const binding = isBindingOnly(rawValue);
    let value;
    if (binding !== null) {
      value = evaluate(binding, scope);
      if (value === false || value === null || value === undefined) {
        if (key === 'href') rendered.push([key, mapHref(null)], ['aria-disabled', 'true'], ['data-unavailable', '']);
        continue;
      }
      value = value === true ? '' : String(value);
      if (key === 'href') {
        value = mapHref(value);
        if (LINK_MAP[evaluate(binding, scope)] === null) rendered.push(['aria-disabled', 'true'], ['data-unavailable', '']);
      }
    } else {
      value = interpolate(rawValue, scope);
      if (key === 'href') value = mapHref(value);
    }
    rendered.push([key, value]);
  }

  const head = rendered.map(([k, v]) => (v === '' ? ' ' + k : ' ' + k + '="' + String(v).replace(/"/g, '&quot;') + '"')).join('');
  if (VOID.has(node.name)) return '<' + node.name + head + '>';
  return '<' + node.name + head + '>' + renderNodes(node.children, scope) + '</' + node.name + '>';
}

/* ------------------------------------------------------------------- build */

class DCLogic {
  constructor() { this.state = {}; }
  setState(patch) { Object.assign(this.state, patch || {}); }
}

function componentValues(code, state) {
  const factory = new Function('DCLogic', code + '\nreturn Component;');
  const Component = factory(DCLogic);
  const instance = new Component();
  Object.assign(instance.state, state || {});
  return instance.renderVals();
}

const SCREENS = [
  { src: '00-b11d7058', file: 'index.html' },
  { src: '01-adb76e05', file: 'risk-check.html' },
  { src: '02-4c67b29b', file: 'warning-signs.html' },
  { src: '03-f64c7140', file: 'home.html' },
  { src: '04-851a1c91', file: 'report-pick.html' },
  { src: '05-3abfbe0c', file: 'report-question.html' },
  { src: '06-f0c61645', file: 'report-words.html' },
  { src: '06-f0c61645', file: 'report-sent.html', state: { sent: true }, title: 'Sent to Nurse Aino' },
  { src: '07-951c5023', file: 'report-urgent.html' },
  { src: '08-791a4ff2', file: 'timeline.html' },
  { src: '09-c84b22f1', file: 'confirm.html' },
  { src: '10-bc22c1b0', file: 'support-person.html' },
  { src: '11-4c25b4e2', file: 'check-in.html' },
  { src: '12-bd8e1a37', file: 'medication.html' },
  { src: '13-b325d944', file: 'learn.html' },
  { src: '14-a352d806', file: 'accessibility.html' },
  { src: '15-0f26be5b', file: 'voice-checkin.html' },
];

const FONT_RANGES = {
  latin: 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD',
  'latin-ext': 'U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF',
};

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, 'assets', 'fonts'), { recursive: true });

// fonts: identical file in every bundle; latin is the 34 KB one
fs.copyFileSync(path.join(SRC, '00-b11d7058', 'c467b310-d1bd-4621-9f10-4f461d76c128.woff2'), path.join(OUT, 'assets', 'fonts', 'atkinson-latin.woff2'));
fs.copyFileSync(path.join(SRC, '00-b11d7058', '272bf761-5f43-4e21-bb67-04799a3a2c36.woff2'), path.join(OUT, 'assets', 'fonts', 'atkinson-latin-ext.woff2'));

const pages = {};
for (const screen of SCREENS) {
  const templatePath = path.join(SRC, screen.src, 'template.html');
  const template = fs.readFileSync(templatePath, 'utf8');
  const tree = parseHTML(template);

  const head = findEl(tree, 'head');
  let title = screen.title;
  if (!title) {
    const titleEl = head && findEl(head, 'title');
    title = titleEl ? titleEl.children.map((c) => c.text).join('').trim() : 'Pathway Companion';
  }

  const helmet = findEl(findEl(tree, 'x-dc'), 'helmet');
  // <helmet> styles stay scoped to their own screen (the emergency screen
  // inverts link colours, for example)
  const styles = [];
  if (helmet) {
    for (const child of helmet.children) {
      if (child.type !== 'el' || child.name !== 'style') continue;
      const rules = (child.children[0] ? child.children[0].text : '')
        .replace(/@font-face\s*\{[\s\S]*?\}/g, '')
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l && !l.startsWith('/*'));
      for (const rule of rules) {
        if (!styles.includes(rule)) styles.push(rule);
      }
    }
  }

  const scripts = [];
  (function collect(node) {
    if (!node.children) return;
    for (const child of node.children) {
      if (child.type === 'el' && child.name === 'script') scripts.push(child);
      else collect(child);
    }
  })(tree);
  const scriptEl = scripts.find((s) => s.attrs.type === 'text/x-dc');
  const code = scriptEl ? scriptEl.children.map((c) => c.text).join('') : '';
  const vals = code ? componentValues(code, screen.state) : {};

  const body = template.slice(template.indexOf('<x-dc>'), template.length);
  const bodyTree = parseHTML(body);
  let html = renderNodes(bodyTree.children, { ...vals });

  html = html.replace(/<body[^>]*>|<\/body>|<\/html>/gi, '').trim();

  const rootRe = /<div style="width: 390px;\s*height: \d+px;/;
  if (!rootRe.test(html)) throw new Error(screen.file + ': root div not found');
  html = html.replace(rootRe, '<div class="screen" style="width: 100%; min-height: 100%;');

  pages[screen.file] = {
    title,
    html,
    styles,
    src: screen.src,
    screen,
  };
}

const fontFaces = ['400', '600', '700']
  .flatMap((weight) =>
    Object.entries(FONT_RANGES).map(
      ([name, range]) =>
        `@font-face{font-family:'Atkinson Hyperlegible Next';font-style:normal;font-weight:${weight};font-display:swap;` +
        `src:url('assets/fonts/atkinson-${name}.woff2') format('woff2');unicode-range:${range};}`
    )
  )
  .join('\n');

const appCss = `${fontFaces}
/* ---- app shell ------------------------------------------------------- */
html{height:100%;-webkit-text-size-adjust:100%}
body{margin:0;min-height:100%;background:#e9e6df;display:flex;align-items:center;justify-content:center;
  font-family:'Atkinson Hyperlegible Next',system-ui,sans-serif;color:#1d2a2e}
.app-frame{position:relative;width:390px;height:844px;max-width:100vw;max-height:100vh;
  background:#f6f4f0;overflow-y:auto;overflow-x:hidden;-webkit-overflow-scrolling:touch;
  border-radius:26px;box-shadow:0 18px 60px rgba(29,42,46,.18),0 2px 6px rgba(29,42,46,.08)}
.screen{display:flex;flex-direction:column}
a{-webkit-tap-highlight-color:transparent}
a[data-unavailable]{opacity:.5;cursor:not-allowed}
[data-href]{cursor:pointer}
@media (max-width:480px),(max-height:900px){
  body{display:block;background:#f6f4f0}
  .app-frame{width:100%;height:100dvh;max-height:none;border-radius:0;box-shadow:none}
}
`;

fs.writeFileSync(path.join(OUT, 'assets', 'app.css'), appCss);
fs.copyFileSync(path.join('tools', 'app.js'), path.join(OUT, 'assets', 'app.js'));

/* ------------------------------------------------------------- navigation */

function textOf(inner) {
  return inner
    .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// give a <button>/<label> a navigation target (app.js follows data-href)
function wireTag(html, tag, label, href) {
  let hits = 0;
  const re = new RegExp('<' + tag + '\\b([^>]*)>([\\s\\S]*?)<\\/' + tag + '>', 'g');
  const out = html.replace(re, (match, attrs, inner) => {
    if (textOf(inner) !== label) return match;
    hits++;
    const clean = attrs.replace(/\sdata-href="[^"]*"/g, '');
    return '<' + tag + clean + ' data-href="' + href + '">' + inner + '</' + tag + '>';
  });
  if (!hits) throw new Error('no <' + tag + '> with text "' + label + '"');
  return out;
}

function wireAnchorHref(html, label, href) {
  let hits = 0;
  const out = html.replace(/<a\b([^>]*)>([\s\S]*?)<\/a>/g, (match, attrs, inner) => {
    if (textOf(inner) !== label) return match;
    hits++;
    return '<a' + attrs.replace(/\shref="[^"]*"/, ' href="' + href + '"') + '>' + inner + '</a>';
  });
  if (!hits) throw new Error('no <a> with text "' + label + '"');
  return out;
}

function wireSlider(html, href) {
  const needle = '<div role="slider"';
  if (html.split(needle).length !== 2) throw new Error('slider not found or repeated');
  return html.replace(needle, needle + ' data-href="' + href + '"');
}

function appendToScreen(html, snippet) {
  const index = html.lastIndexOf('</div>');
  if (index === -1) throw new Error('screen root not found');
  return html.slice(0, index) + snippet + html.slice(index);
}

function insertBefore(html, needle, snippet) {
  const parts = html.split(needle);
  if (parts.length !== 2) throw new Error('insertion point "' + needle + '" matched ' + (parts.length - 1) + ' times');
  return parts[0] + snippet + needle + parts[1];
}

const CTA_STYLE =
  'min-height: 60px; margin: 0 20px 20px; display: flex; align-items: center; justify-content: center; ' +
  'border-radius: 14px; background: #0a6670; color: #ffffff; text-decoration: none; font-size: 19px; font-weight: 700';

const CHECK_IN_CARD = `<a href="check-in.html" style="margin: 0 20px 12px; display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 14px 16px; background: #ffffff; border: 1px solid #e2ddd5; border-radius: 16px; text-decoration: none; color: #1d2a2e">
<span style="display: flex; flex-direction: column; gap: 2px">
<span style="font-size: 18px; font-weight: 700; line-height: 1.2">Weekly check-in</span>
<span style="font-size: 15px; line-height: 1.3; color: #4b575b">4 of 10 answered · 3 min</span>
</span>
<svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><path d="M7 4l6 6-6 6" fill="none" stroke="#0a6670" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg>
</a>
`;

const WIRING = {
  'index.html': (html) =>
    appendToScreen(
      html,
      '\n<p style="margin: 0; font-size: 15px; line-height: 1.35; color: #4b575b">Coordinator nurse and county decision-maker are not part of this demo.</p>\n'
    ),
  'risk-check.html': (html) => wireTag(html, 'button', 'Next', 'warning-signs.html'),
  'warning-signs.html': (html) =>
    appendToScreen(html, '\n<a href="home.html" style="' + CTA_STYLE + '">Continue to your pathway</a>\n'),
  'home.html': (html) =>
    insertBefore(wireAnchorHref(html, 'Call Nurse Aino Weekdays 8–16', 'help.html'), '<nav ', CHECK_IN_CARD),
  'report-question.html': (html) => wireTag(html, 'button', 'Next', 'report-words.html'),
  'report-words.html': (html) => wireTag(html, 'button', 'Send to Nurse Aino', 'report-sent.html'),
  'report-urgent.html': (html) =>
    wireAnchorHref(
      wireAnchorHref(html, 'Call 112 If it feels like an emergency', 'tel:112'),
      'Call 116 117 Medical helpline',
      'tel:116117'
    ),
  'confirm.html': (html) => wireSlider(wireTag(html, 'button', 'Or tap here to confirm', 'home.html'), 'home.html'),
  'support-person.html': (html) =>
    wireAnchorHref(
      wireSlider(wireTag(html, 'button', 'Or tap here to confirm', 'home.html'), 'home.html'),
      'Call Nurse Aino His nurse, weekdays 8–16',
      'help.html'
    ),
  'check-in.html': (html) => {
    html = wireTag(html, 'button', 'Previous', 'home.html');
    html = wireTag(html, 'button', 'Next question', 'home.html');
    return wireAnchorHref(html, 'Call 116 117', 'tel:116117');
  },
  'medication.html': (html) => wireTag(html, 'button', 'Side effect', 'report-pick.html'),
  'accessibility.html': (html) => wireTag(html, 'label', 'Use the app by voice', 'voice-checkin.html'),
  'voice-checkin.html': (html) => {
    html = wireTag(html, 'button', 'Yes, send', 'home.html');
    return wireTag(html, 'button', 'No, again', 'check-in.html');
  },
};

for (const [file, patch] of Object.entries(WIRING)) {
  if (!pages[file]) throw new Error('wiring target missing: ' + file);
  pages[file].html = patch(pages[file].html);
}

// The design links every header's Help button to Help.dc.html, which is not
// included in the wireframe set; it is the "who to call" screen in the flow.
const HELP_HTML = `<div class="screen" style="width: 100%; min-height: 100%; box-sizing: border-box; display: flex; flex-direction: column; font-family: 'Atkinson Hyperlegible Next', system-ui, sans-serif; color: #1d2a2e; background: #f6f4f0">
<div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 12px 0 4px">
<a href="home.html" aria-label="Back" style="min-width: 56px; min-height: 56px; display: flex; align-items: center; justify-content: center; text-decoration: none">
<svg width="40" height="40" viewBox="0 0 20 20" aria-hidden="true"><path d="M13 4l-6 6 6 6" fill="none" stroke="#0a6670" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"></path></svg>
</a>
<a href="accessibility.html" aria-label="Language, text size and voice" class="btn" style="min-width: 48px; height: 48px; box-sizing: border-box; padding: 0 12px; border: 1px solid #e2ddd5; border-radius: 999px; background: #ffffff; color: #1d2a2e; text-decoration: none; display: flex; align-items: center; justify-content: center; font-size: 17px; font-weight: 700">Aa</a>
</div>
<div style="padding: 8px 20px 24px; display: flex; flex-direction: column; gap: 16px; flex: 1">
<h1 style="margin: 0; font-size: 34px; font-weight: 700; line-height: 1.15; letter-spacing: -0.01em">Who to call</h1>
<p style="margin: 0; font-size: 19px; line-height: 1.4; color: #4b575b">Pick the one that matches how you feel right now.</p>
<a href="tel:112" class="btn" style="min-height: 104px; display: flex; flex-direction: column; justify-content: center; gap: 4px; padding: 16px 18px; border-radius: 20px; background: #b02a20; color: #ffffff; text-decoration: none">
<span style="font-size: 28px; font-weight: 700">Call 112</span>
<span style="font-size: 17px; line-height: 1.3">Emergency: chest pain, heavy bleeding, struggling to breathe</span>
</a>
<a href="tel:116117" class="btn" style="min-height: 104px; display: flex; flex-direction: column; justify-content: center; gap: 4px; padding: 16px 18px; border-radius: 20px; background: #1d2a2e; color: #ffffff; text-decoration: none">
<span style="font-size: 28px; font-weight: 700">Call 116 117</span>
<span style="font-size: 17px; line-height: 1.3">Medical helpline: fever, pain, or symptoms getting worse</span>
</a>
<a href="report-pick.html" class="btn" style="min-height: 92px; display: flex; flex-direction: column; justify-content: center; gap: 4px; padding: 16px 18px; border-radius: 20px; background: #ffffff; border: 1px solid #e2ddd5; color: #1d2a2e; text-decoration: none">
<span style="font-size: 21px; font-weight: 700">Tell Nurse Aino</span>
<span style="font-size: 16px; line-height: 1.3; color: #4b575b">Weekdays 8–16 · she calls you back</span>
</a>
<p style="margin: 0; font-size: 16px; line-height: 1.4; color: #4b575b">If you are not sure, call 116 117. They will tell you what to do next.</p>
</div>
</div>`;

function writeDoc(file, title, body, styles) {
  const doc = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#f6f4f0">
<title>${title} · Pathway Companion</title>
<link rel="stylesheet" href="assets/app.css">
<style>
${(styles || []).join('\n')}
</style>
</head>
<body>
<div class="app-frame">
${body}
</div>
<script src="assets/app.js"></script>
</body>
</html>
`;
  fs.writeFileSync(path.join(OUT, file), doc);
}

for (const [file, page] of Object.entries(pages)) writeDoc(file, page.title, page.html, page.styles);
writeDoc('help.html', 'Who to call', HELP_HTML, [
  'body{margin:0}',
  'a{color:#0a6670}a:hover{color:#074d55}',
  'a.btn,button{transition:transform .12s ease,filter .15s ease}',
  'a.btn:hover,button:hover{filter:brightness(.96)}',
  'a.btn:active,button:active{transform:scale(.98)}',
]);

console.log('built ' + (Object.keys(pages).length + 1) + ' screens -> ' + OUT);
