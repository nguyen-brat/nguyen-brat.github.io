import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { validateChapter } from './lib/validate.mjs';

const root = path.resolve(import.meta.dirname, '..');
const allowStubs = process.argv.includes('--allow-stubs');
const chapDir = path.join(root, 'src/content/chapters');
const extraDir = path.join(root, 'src/content/extras');

const files = fs.readdirSync(chapDir).filter((f) => f.endsWith('.md')).sort();
const ids = new Set(files.map((f) => f.replace(/\.md$/, '')));
let failures = 0;
const report = (name, errs) => { for (const e of errs) { console.error(`${name}: ${e}`); failures++; } };

const sections = new Set();
for (const f of files) {
  const { data, content } = matter(fs.readFileSync(path.join(chapDir, f), 'utf8'));
  if (sections.has(data.section)) report(f, [`duplicate section ${data.section}`]);
  sections.add(data.section);
  if (!f.startsWith(String(data.section).padStart(2, '0') + '-')) report(f, ['file prefix does not match section']);
  if (data.status === 'stub' && allowStubs) continue;
  report(f, validateChapter({ data, content }, { ids }));
}
for (let n = 1; n <= 60; n++) if (!sections.has(n)) report('chapters', [`missing section ${n}`]);

for (const f of fs.readdirSync(extraDir).filter((x) => x.endsWith('.md'))) {
  const { data } = matter(fs.readFileSync(path.join(extraDir, f), 'utf8'));
  if (data.status === 'stub' && !allowStubs) report(f, ['status is stub']);
}

if (failures) { console.error(`\n${failures} problem(s)`); process.exit(1); }
console.log(`content OK (${files.length} chapters${allowStubs ? ', stubs allowed' : ''})`);
