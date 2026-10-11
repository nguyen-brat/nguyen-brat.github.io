import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const curriculum = JSON.parse(fs.readFileSync(path.join(root, 'data/curriculum.json'), 'utf8'));
const parts = JSON.parse(fs.readFileSync(path.join(root, 'src/data/parts.json'), 'utf8'));
const outDir = path.join(root, 'src/content/chapters');
fs.mkdirSync(outDir, { recursive: true });

const INTRO = new Set([1, 43, 59, 60]);
const slug = (t) =>
  t.toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50).replace(/-$/, '');

const chapters = [];
for (const item of curriculum) {
  if (item._class === 'chapter') chapters.push({ title: item.title, lectures: [] });
  else if (item._class === 'lecture' && chapters.length) chapters.at(-1).lectures.push(item.title);
}
if (chapters.length !== 60) throw new Error(`expected 60 chapters, found ${chapters.length}`);

let created = 0;
chapters.forEach((c, i) => {
  const n = i + 1;
  const part = parts.find((p) => n >= p.from && n <= p.to);
  if (!part) throw new Error(`section ${n} has no part`);
  const kind = /^LAB\b/i.test(c.title) ? 'lab' : INTRO.has(n) ? 'intro' : 'concept';
  const file = path.join(outDir, `${String(n).padStart(2, '0')}-${slug(c.title)}.md`);
  if (fs.existsSync(file)) return;
  const fm = [
    '---',
    `section: ${n}`,
    `title: ${JSON.stringify(c.title)}`,
    `part: ${JSON.stringify(part.name)}`,
    `kind: ${kind}`,
    'status: stub',
    'readingTime: 10',
    `lectures: ${JSON.stringify(c.lectures)}`,
    'quiz: []',
    '---',
    '',
    'Not written yet.',
    '',
  ].join('\n');
  fs.writeFileSync(file, fm);
  created++;
});
console.log(`created ${created} stub chapters (${chapters.length} total)`);
