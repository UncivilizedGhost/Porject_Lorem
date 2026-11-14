import fs from 'fs';
import path from 'path';

const dirs = fs.readdirSync('decoded').filter((d) => fs.statSync(path.join('decoded', d)).isDirectory()).sort();
for (const d of dirs) {
  const tpl = fs.readFileSync(path.join('decoded', d, 'template.html'), 'utf8');
  const body = tpl.slice(tpl.indexOf('<x-dc>'));
  const plain = body
    .replace(/<svg[\s\S]*?<\/svg>/g, ' [icon] ')
    .replace(/<style[\s\S]*?<\/style>/g, '')
    .replace(/<[^>]+>/g, '\n')
    .replace(/\n{2,}/g, '\n')
    .trim();
  console.log('\n\n################ ' + d);
  console.log(plain);
  console.log('-- links:', [...body.matchAll(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g)].map((m) => m[1] + ' :: ' + m[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()).join(' | '));
  console.log('-- ifs:', [...body.matchAll(/sc-if="([^"]*)"/g)].map((m) => m[1]).join(' | '));
  console.log('-- fors:', [...body.matchAll(/sc-for="([^"]*)"/g)].map((m) => m[1]).join(' | '));
}
