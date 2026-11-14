import fs from 'fs';
import zlib from 'zlib';
import path from 'path';

function grabAll(src, type) {
  const re = new RegExp('<script type="__bundler/' + type + '">([\\s\\S]*?)</script>', 'g');
  return [...src.matchAll(re)].map((m) => m[1]);
}

const files = fs.readdirSync('extracted').filter((f) => /^\d\d-.*\.html$/.test(f));
fs.mkdirSync('decoded', { recursive: true });

function decodeEntry(entry) {
  const buf = Buffer.from(entry.data, 'base64');
  return entry.compressed ? zlib.gunzipSync(buf) : buf;
}

for (const f of files) {
  const src = fs.readFileSync(path.join('extracted', f), 'utf8');
  const [manifestText] = grabAll(src, 'manifest');
  const [templateText] = grabAll(src, 'template');
  if (!manifestText || !templateText) {
    console.log(f, 'NO NESTED BUNDLE');
    continue;
  }
  const manifest = JSON.parse(manifestText);
  const template = JSON.parse(templateText);
  const dir = path.join('decoded', f.replace('.html', ''));
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'template.html'), template);

  const lines = [];
  for (const [uuid, entry] of Object.entries(manifest)) {
    const bytes = decodeEntry(entry);
    const ext = entry.mime.includes('javascript') ? 'js'
      : entry.mime.includes('css') ? 'css'
      : entry.mime.includes('html') ? 'html'
      : entry.mime.includes('json') ? 'json'
      : entry.mime.includes('font') ? 'woff2'
      : entry.mime.includes('svg') ? 'svg'
      : 'bin';
    const name = uuid + '.' + ext;
    fs.writeFileSync(path.join(dir, name), bytes);
    lines.push(`${entry.mime.padEnd(28)} ${String(bytes.length).padStart(8)}  ${name}`);
  }
  console.log('=== ' + f + '\n' + lines.join('\n'));
}
