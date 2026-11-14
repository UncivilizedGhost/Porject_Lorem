import fs from 'fs';
import path from 'path';

const DIR = 'app';
const pages = fs.readdirSync(DIR).filter((f) => f.endsWith('.html')).sort();
const problems = [];
const graph = {};

for (const file of pages) {
  const html = fs.readFileSync(path.join(DIR, file), 'utf8');
  const targets = new Set();

  for (const match of html.matchAll(/(?:href|data-href)="([^"]+)"/g)) {
    const href = match[1];
    if (href === '#' || href.startsWith('tel:') || href.startsWith('mailto:') || /^https?:/.test(href)) continue;
    if (href.endsWith('.html')) {
      if (!fs.existsSync(path.join(DIR, href))) problems.push(`${file}: missing target ${href}`);
      targets.add(href);
    } else if (!href.startsWith('assets/')) {
      problems.push(`${file}: unexpected href "${href}"`);
    }
  }
  graph[file] = [...targets];

  if (/href="[^"]*\.dc\.html"/.test(html)) problems.push(`${file}: design-time .dc.html link left`);
  if (/\{\{/.test(html)) problems.push(`${file}: unresolved {{ binding`);
  if (/class Component extends DCLogic/.test(html)) problems.push(`${file}: design runtime script left`);
  if (/__bundler/.test(html)) problems.push(`${file}: bundler scaffolding left`);
  if (/url\("[0-9a-f]{8}-/.test(html)) problems.push(`${file}: unresolved bundled font url`);
  if (!html.includes('assets/app.css') || !html.includes('assets/app.js')) problems.push(`${file}: missing shell assets`);
  if (!/<div class="app-frame">/.test(html)) problems.push(`${file}: missing app frame`);
  if (!/<title>.+ · Pathway Companion<\/title>/.test(html)) problems.push(`${file}: missing title`);
}

// reachability from index.html
const seen = new Set(['index.html']);
const queue = ['index.html'];
while (queue.length) {
  const current = queue.shift();
  for (const next of graph[current] || []) {
    if (!seen.has(next)) { seen.add(next); queue.push(next); }
  }
}
for (const file of pages) if (!seen.has(file)) problems.push(`${file}: unreachable from index.html`);

console.log(`${pages.length} pages, ${seen.size} reachable from index.html`);
console.log('links per page:');
for (const file of pages) console.log(`  ${file.padEnd(22)} -> ${(graph[file] || []).join(', ') || '(none)'}`);
if (problems.length) {
  console.log('\nPROBLEMS:');
  for (const problem of problems) console.log('  - ' + problem);
  process.exit(1);
}
console.log('\nOK: all links resolve, no design-time artifacts left');
