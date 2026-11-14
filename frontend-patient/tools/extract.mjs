import fs from 'fs';
import zlib from 'zlib';
import path from 'path';

const src = fs.readFileSync('Pathway Companion Wireframes(1).html', 'utf8');

function grab(type) {
  const re = new RegExp('<script type="__bundler/' + type + '">([\\s\\S]*?)</script>');
  const m = src.match(re);
  if (!m) throw new Error('missing ' + type);
  return m[1];
}

const manifest = JSON.parse(grab('manifest'));
const order = JSON.parse(grab('page_order'));
const template = JSON.parse(grab('template'));

// titles from root template iframes, in document order
const titles = [...template.matchAll(/<h2>([\s\S]*?)<\/h2>/g)].map((m) => m[1]);
const frameUuids = [...template.matchAll(/about:blank#([0-9a-f-]{36})/g)].map((m) => m[1]);

const outDir = 'extracted';
fs.mkdirSync(outDir, { recursive: true });

const report = [];
order.forEach((uuid, i) => {
  const entry = manifest[uuid];
  if (!entry) throw new Error('no manifest entry for ' + uuid);
  const buf = Buffer.from(entry.data, 'base64');
  const bytes = entry.compressed ? zlib.gunzipSync(buf) : buf;
  const name = String(i).padStart(2, '0') + '-' + uuid.slice(0, 8) + '.html';
  fs.writeFileSync(path.join(outDir, name), bytes);
  report.push({
    i,
    name,
    title: titles[i] || '',
    inTemplate: frameUuids[i] === uuid,
    bytes: bytes.length,
    text: bytes.toString('utf8'),
  });
});

fs.writeFileSync(path.join(outDir, '_report.json'), JSON.stringify(report.map(({ text, ...r }) => r), null, 2));
console.log(report.map((r) => `${r.i}  ${r.title.padEnd(34)} ${r.bytes}  ${r.name}`).join('\n'));
