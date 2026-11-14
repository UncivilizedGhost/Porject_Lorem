import fs from 'fs';

for (const file of fs.readdirSync('app').filter((f) => f.endsWith('.html')).sort()) {
  const html = fs.readFileSync('app/' + file, 'utf8');
  const links = [...html.matchAll(/<a\s([^>]*)>([\s\S]*?)<\/a>/g)].map((m) => {
    const href = (m[1].match(/href="([^"]*)"/) || [, ''])[1];
    const text = m[2].replace(/<svg[\s\S]*?<\/svg>/g, '[i]').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const aria = (m[1].match(/aria-label="([^"]*)"/) || [, ''])[1];
    return `${href} :: ${text || '[icon]' + (aria ? ' ' + aria : '')}`;
  });
  const buttons = [...html.matchAll(/<(button|div)\s([^>]*)>([\s\S]*?)<\/\1>/g)]
    .filter((m) => {
      const inner = m[3];
      if (/<(div|button|a|nav|section|header|footer|span|p|h1|h2|h3|ul|li)\b/.test(inner)) return false;
      const text = inner.replace(/<svg[\s\S]*?<\/svg>/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      return text.length > 0 && text.length < 60;
    })
    .map((m) => {
      const text = m[3].replace(/<svg[\s\S]*?<\/svg>/g, '[i]').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      const bg = (m[2].match(/background: (#?[\w-]+)/) || [, ''])[1];
      const hasSvg = /<svg/.test(m[3]);
      return `${m[1]}${bg ? ' bg=' + bg : ''}${hasSvg ? ' [svg]' : ''} :: ${text}`;
    });
  console.log('\n#### ' + file);
  console.log('  links: ' + (links.join(' | ') || '-'));
  console.log('  buttons: ' + (buttons.join(' | ') || '-'));
}
