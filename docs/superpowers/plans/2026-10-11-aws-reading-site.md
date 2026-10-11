# AWS Reading Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. When committing, end commit messages with the attribution line the session instructs.

**Goal:** A static reading website that teaches AWS for a job, one chapter per section of the Udemy course "AWS Architecting: The Ultimate Course" (60 sections, same order), with cheat-sheets, X-vs-Y tables, diagrams and practice questions.

**Architecture:** Astro static site in `site/`. Lessons are Markdown files in a content collection; front-matter carries metadata and quiz data. A node check script (unit-tested with `node:test`) enforces the chapter template, so incomplete chapters cannot ship. Search is Pagefind run after the build. Diagrams are Mermaid code blocks rendered in the browser from a bundled (no CDN) mermaid package.

**Tech Stack:** Node 22, Astro (^7.3.8), mermaid ^12, pagefind ^1.5, gray-matter, `node:test`.

**Spec:** `docs/superpowers/specs/2026-10-11-aws-reading-site-design.md`

**Deviations from spec (decided while planning, same intent):**
- The 17 labs are course sections numbered 7, 9, 11, 13, 15, 16, 17, 22, 25, 27, 36, 38, 41, 42, 44–47, 49, 51, 54–58, so they are chapters with `kind: lab` in the same collection instead of a separate `labs/` folder. This keeps course order and one sidebar.
- Mermaid renders in the browser (bundled, works offline) instead of at build time, because build-time rendering needs a headless browser.

**Facts the engineer needs**
- `/home/nguyen/code/udemy` is NOT yet a git repo. `.profile/` and `.profile2/` there are Chromium profiles holding a logged-in Udemy session: they must never be committed (Task 1 ignores them).
- Input data: `course_structure.md` (human-readable) and the raw API dump at `/tmp/claude-1000/-home-nguyen-code-udemy/1d80b5cb-26dc-49bf-b515-d336a1a8b153/scratchpad/curriculum.json` (60 chapters, 790 lectures, 10 quizzes; items have `_class` = chapter|lecture|quiz and `title`).
- AWS docs tools (load with ToolSearch `select:` before use): `mcp__plugin_aws-core_aws-mcp__aws___search_documentation` and `mcp__plugin_aws-core_aws-mcp__aws___read_documentation`. Chapter writers MUST use them for facts.

---

## File structure

```
udemy/
├─ .gitignore
├─ docs/chapter-brief.md                  writer brief + chapter templates (Task 8)
└─ site/
   ├─ package.json, astro.config.mjs, tsconfig.json
   ├─ data/curriculum.json                copied API dump (input for scaffold)
   ├─ scripts/
   │  ├─ lib/validate.mjs                 pure validation rules (tested)
   │  ├─ validate.test.mjs                node:test unit tests
   │  ├─ check-content.mjs                CLI: runs rules over all files
   │  └─ scaffold-chapters.mjs            generates the 60 stub chapters
   └─ src/
      ├─ content.config.ts                schemas for `chapters` and `extras`
      ├─ data/parts.json                  contiguous course parts for the sidebar
      ├─ content/chapters/NN-slug.md      60 files
      ├─ content/extras/*.md              glossary, decision-guide, interview-questions
      ├─ layouts/Layout.astro             header, sidebar, search, mermaid loader
      ├─ components/Quiz.astro            click-to-reveal practice questions
      ├─ styles/global.css
      └─ pages/ index.astro, chapters/[id].astro, guide/[id].astro
```

---

### Task 1: Repo hygiene and project scaffold

**Files:**
- Create: `.gitignore`, `site/package.json`, `site/astro.config.mjs`, `site/tsconfig.json`

- [ ] **Step 1: Init git and ignore the browser profiles**

```bash
cd /home/nguyen/code/udemy
git init
cat > .gitignore <<'EOF'
.profile/
.profile2/
node_modules/
dist/
.astro/
EOF
git status --short
```
Expected: `.profile/` and `.profile2/` do NOT appear in the output.

- [ ] **Step 2: Create `site/package.json`**

```json
{
  "name": "aws-reading-site",
  "type": "module",
  "private": true,
  "scripts": {
    "dev": "astro dev",
    "build": "node scripts/check-content.mjs && astro build && pagefind --site dist",
    "build:draft": "node scripts/check-content.mjs --allow-stubs && astro build && pagefind --site dist",
    "preview": "astro preview",
    "scaffold": "node scripts/scaffold-chapters.mjs",
    "check": "node scripts/check-content.mjs",
    "test": "node --test scripts/"
  },
  "dependencies": {
    "astro": "^7.3.8",
    "mermaid": "^12.1.0"
  },
  "devDependencies": {
    "gray-matter": "^4.0.3",
    "pagefind": "^1.5.2"
  }
}
```

- [ ] **Step 3: Create `site/astro.config.mjs`** (mermaid blocks must not be syntax-highlighted)

```js
import { defineConfig } from 'astro/config';

export default defineConfig({
  markdown: {
    syntaxHighlight: { type: 'shiki', excludeLangs: ['mermaid', 'math'] },
  },
});
```

- [ ] **Step 4: Create `site/tsconfig.json`**

```json
{ "extends": "astro/tsconfigs/strict" }
```

- [ ] **Step 5: Install**

Run: `cd /home/nguyen/code/udemy/site && npm install`
Expected: completes without ERR; `node_modules/astro` exists. If Astro 7 rejects Node 22, report the exact error and stop.

- [ ] **Step 6: Commit**

```bash
cd /home/nguyen/code/udemy && git add .gitignore site/package.json site/package-lock.json site/astro.config.mjs site/tsconfig.json course_structure.md learning_path.md docs
git commit -m "chore: scaffold Astro reading site"
```

---

### Task 2: Validation rules (TDD)

**Files:**
- Create: `site/scripts/validate.test.mjs`, `site/scripts/lib/validate.mjs`

- [ ] **Step 1: Write the failing tests** — `site/scripts/validate.test.mjs`

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { validateChapter } from './lib/validate.mjs';

const ids = new Set(['04-iam']);
const conceptBody = [
  '## What it is', 'x', '## Key concepts', 'x', '## X vs Y', 'x',
  '```mermaid\ngraph TD; A-->B\n```',
  '## Job notes', 'x', '## Cheat sheet', 'x',
  '## AWS docs', '[IAM](https://docs.aws.amazon.com/IAM/latest/UserGuide/introduction.html)',
].join('\n');
const q = (o = {}) => ({ question: 'Q?', options: ['a', 'b', 'c'], answer: 1, explanation: 'Because this explanation is long enough.', ...o });
const concept = (over = {}) => ({ data: { kind: 'concept', status: 'done', quiz: [q(), q(), q(), q(), q()] }, content: conceptBody, ...over });
const errs = (ch) => validateChapter(ch, { ids });

test('valid concept chapter has no errors', () => assert.deepEqual(errs(concept()), []));
test('stub status is an error', () => assert.deepEqual(errs(concept({ data: { kind: 'concept', status: 'stub', quiz: [] } })), ['status is stub']));
test('missing required section', () => {
  const e = errs(concept({ content: conceptBody.replace('## Cheat sheet', '## Other') }));
  assert.ok(e.includes('missing section "## Cheat sheet"'));
});
test('missing mermaid diagram', () => {
  const e = errs(concept({ content: conceptBody.replace(/```mermaid[\s\S]*?```/, '') }));
  assert.ok(e.includes('missing mermaid diagram'));
});
test('too few quiz questions for concept', () => {
  const e = errs(concept({ data: { kind: 'concept', status: 'done', quiz: [q(), q()] } }));
  assert.ok(e.includes('needs at least 5 quiz questions, has 2'));
});
test('answer index out of range', () => {
  const e = errs(concept({ data: { kind: 'concept', status: 'done', quiz: [q(), q(), q(), q(), q({ answer: 7 })] } }));
  assert.ok(e.includes('quiz 5: answer index out of range'));
});
test('short explanation', () => {
  const e = errs(concept({ data: { kind: 'concept', status: 'done', quiz: [q(), q(), q(), q(), q({ explanation: 'no' })] } }));
  assert.ok(e.includes('quiz 5: explanation missing or too short'));
});
test('broken internal link', () => {
  const e = errs(concept({ content: conceptBody + '\n[x](/chapters/99-nope/)' }));
  assert.ok(e.includes('broken internal link /chapters/99-nope'));
});
test('valid internal link passes', () => {
  assert.deepEqual(errs(concept({ content: conceptBody + '\n[x](/chapters/04-iam/#top)' })), []);
});
test('no AWS docs link', () => {
  const e = errs(concept({ content: conceptBody.replace(/\[IAM\]\(.*\)/, 'none') }));
  assert.ok(e.includes('no link to docs.aws.amazon.com'));
});
test('lab chapter needs lab sections and 3 questions', () => {
  const lab = { data: { kind: 'lab', status: 'done', quiz: [q(), q(), q()] }, content: conceptBody };
  const e = errs(lab);
  assert.ok(e.includes('missing section "## What you build"'));
  assert.ok(e.includes('missing section "## Cleanup"'));
  assert.ok(!e.some((x) => x.includes('quiz questions')));
});
test('intro chapter needs no diagram or X vs Y', () => {
  const body = ['## What it is', 'x', '## Key concepts', 'x', '## Cheat sheet', 'x', '## AWS docs', '[d](https://docs.aws.amazon.com/)'].join('\n');
  assert.deepEqual(errs({ data: { kind: 'intro', status: 'done', quiz: [q(), q(), q()] }, content: body }), []);
});
```

- [ ] **Step 2: Run to verify failure**

Run: `cd /home/nguyen/code/udemy/site && node --test scripts/`
Expected: FAIL — cannot find module `./lib/validate.mjs`.

- [ ] **Step 3: Implement** — `site/scripts/lib/validate.mjs`

```js
const REQUIRED = {
  concept: ['What it is', 'Key concepts', 'X vs Y', 'Job notes', 'Cheat sheet', 'AWS docs'],
  lab: ['What you build', 'Architecture', 'Steps', 'Common mistakes', 'Cleanup', 'On the job', 'AWS docs'],
  intro: ['What it is', 'Key concepts', 'Cheat sheet', 'AWS docs'],
};
const MIN_QUIZ = { concept: 5, lab: 3, intro: 3 };
const NEEDS_DIAGRAM = { concept: true, lab: true, intro: false };

export function headings(content) {
  return [...content.matchAll(/^##\s+(.+?)\s*$/gm)].map((m) => m[1]);
}

/** @returns {string[]} human-readable errors; empty means valid */
export function validateChapter({ data, content }, { ids }) {
  if (data.status === 'stub') return ['status is stub'];
  const errors = [];
  const hs = headings(content);
  for (const h of REQUIRED[data.kind] ?? []) {
    if (!hs.includes(h)) errors.push(`missing section "## ${h}"`);
  }
  if (NEEDS_DIAGRAM[data.kind] && !/```mermaid\n/.test(content)) errors.push('missing mermaid diagram');
  const quiz = data.quiz ?? [];
  const min = MIN_QUIZ[data.kind] ?? 0;
  if (quiz.length < min) errors.push(`needs at least ${min} quiz questions, has ${quiz.length}`);
  quiz.forEach((q, i) => {
    if (!(q.answer >= 0 && q.answer < (q.options?.length ?? 0))) errors.push(`quiz ${i + 1}: answer index out of range`);
    if (!q.explanation || q.explanation.trim().length < 20) errors.push(`quiz ${i + 1}: explanation missing or too short`);
  });
  for (const m of content.matchAll(/\]\((\/chapters\/[^)#\s]+?)\/?(?:#[^)]*)?\)/g)) {
    if (!ids.has(m[1].replace('/chapters/', ''))) errors.push(`broken internal link ${m[1]}`);
  }
  if (!/\]\(https:\/\/docs\.aws\.amazon\.com\//.test(content)) errors.push('no link to docs.aws.amazon.com');
  return errors;
}
```

- [ ] **Step 4: Run to verify pass**

Run: `cd /home/nguyen/code/udemy/site && node --test scripts/`
Expected: all 12 tests PASS.

- [ ] **Step 5: Commit**

```bash
cd /home/nguyen/code/udemy && git add site/scripts && git commit -m "feat: chapter validation rules with tests"
```

---

### Task 3: Content schema, parts, and chapter scaffolder

**Files:**
- Create: `site/src/content.config.ts`, `site/src/data/parts.json`, `site/scripts/scaffold-chapters.mjs`, `site/data/curriculum.json` (copy)

- [ ] **Step 1: Copy the curriculum data**

```bash
mkdir -p /home/nguyen/code/udemy/site/data
cp /tmp/claude-1000/-home-nguyen-code-udemy/1d80b5cb-26dc-49bf-b515-d336a1a8b153/scratchpad/curriculum.json /home/nguyen/code/udemy/site/data/curriculum.json
```
If the source file is missing, regenerate it: it is the JSON list returned by Udemy's `/api-2.0/courses/7143905/subscriber-curriculum-items/` for a logged-in session; otherwise rebuild the 60 titles from `course_structure.md`.

- [ ] **Step 2: Create `site/src/data/parts.json`** (contiguous ranges covering 1–60)

```json
[
  { "name": "Getting Started", "from": 1, "to": 3 },
  { "name": "Identity & Access", "from": 4, "to": 4 },
  { "name": "Networking Basics", "from": 5, "to": 5 },
  { "name": "Compute & Containers", "from": 6, "to": 9 },
  { "name": "Storage", "from": 10, "to": 18 },
  { "name": "Databases", "from": 19, "to": 25 },
  { "name": "Scaling & Monitoring", "from": 26, "to": 28 },
  { "name": "Advanced Networking & Data Transfer", "from": 29, "to": 34 },
  { "name": "Serverless & Messaging", "from": 35, "to": 38 },
  { "name": "Security & Infrastructure as Code", "from": 39, "to": 43 },
  { "name": "CI/CD", "from": 44, "to": 47 },
  { "name": "Edge, AI & Multi-Account", "from": 48, "to": 52 },
  { "name": "Disaster Recovery", "from": 53, "to": 58 },
  { "name": "Capstone & Exam Prep", "from": 59, "to": 60 }
]
```

- [ ] **Step 3: Create `site/src/content.config.ts`**

```ts
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const chapters = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/chapters' }),
  schema: z.object({
    section: z.number().int().min(1).max(60),
    title: z.string(),
    part: z.string(),
    kind: z.enum(['concept', 'lab', 'intro']),
    status: z.enum(['stub', 'done']),
    readingTime: z.number().int().positive(),
    lectures: z.array(z.string()),
    quiz: z
      .array(
        z.object({
          question: z.string(),
          options: z.array(z.string()).min(3).max(5),
          answer: z.number().int().min(0),
          explanation: z.string(),
        }),
      )
      .default([]),
  }),
});

const extras = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/extras' }),
  schema: z.object({
    title: z.string(),
    order: z.number().int(),
    status: z.enum(['stub', 'done']),
  }),
});

export const collections = { chapters, extras };
```

- [ ] **Step 4: Create `site/scripts/scaffold-chapters.mjs`** (never overwrites an existing file)

```js
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
```

- [ ] **Step 5: Run it**

Run: `cd /home/nguyen/code/udemy/site && npm run scaffold && ls src/content/chapters | wc -l && ls src/content/chapters | sed -n '1,8p'`
Expected: `created 60 stub chapters (60 total)`, `60`, and names like `01-intro.md`, `04-aws-identity-and-access-management-iam.md`.

- [ ] **Step 6: Commit**

```bash
cd /home/nguyen/code/udemy && git add site && git commit -m "feat: content schema and 60 chapter stubs"
```

---

### Task 4: Layout, styles and quiz component

**Files:**
- Create: `site/src/styles/global.css`, `site/src/layouts/Layout.astro`, `site/src/components/Quiz.astro`

- [ ] **Step 1: Create `site/src/styles/global.css`**

```css
:root {
  --bg: #ffffff; --fg: #1b1f24; --muted: #5b6570; --line: #e1e5ea;
  --accent: #ff9900; --accent-fg: #6b3d00; --card: #f6f8fa; --code: #f0f2f5;
}
@media (prefers-color-scheme: dark) {
  :root { --bg: #14181d; --fg: #e6e9ed; --muted: #9aa5b1; --line: #2a313a; --accent: #ffb340; --accent-fg: #ffd699; --card: #1b2128; --code: #1f262e; }
}
* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body { margin: 0; background: var(--bg); color: var(--fg); font: 16px/1.65 system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; }
a { color: var(--accent-fg); }
.top { position: sticky; top: 0; z-index: 10; display: flex; align-items: center; gap: 12px; padding: 10px 16px; background: var(--bg); border-bottom: 1px solid var(--line); }
.brand { font-weight: 700; text-decoration: none; color: var(--fg); }
#menu { display: none; background: none; border: 1px solid var(--line); color: var(--fg); border-radius: 6px; padding: 4px 10px; font-size: 18px; }
#search { margin-left: auto; min-width: 220px; font-size: 14px; }
.shell { display: grid; grid-template-columns: 300px minmax(0, 1fr); max-width: 1280px; margin: 0 auto; }
.side { position: sticky; top: 53px; align-self: start; max-height: calc(100vh - 53px); overflow: auto; padding: 16px; border-right: 1px solid var(--line); font-size: 14px; }
.side summary { cursor: pointer; font-weight: 600; margin: 8px 0 4px; }
.side ul { list-style: none; margin: 0 0 8px; padding-left: 8px; }
.side li a { display: block; padding: 3px 8px; border-radius: 6px; text-decoration: none; color: var(--fg); }
.side li a[aria-current='page'] { background: var(--accent); color: #1b1f24; font-weight: 600; }
.extras { border-top: 1px solid var(--line); margin-top: 12px; padding-top: 8px; }
main { padding: 24px clamp(16px, 4vw, 48px) 64px; max-width: 860px; }
h1 { font-size: 2rem; line-height: 1.25; margin: .2em 0 .4em; }
.prose h2 { margin-top: 2em; padding-bottom: 4px; border-bottom: 1px solid var(--line); }
.prose table { border-collapse: collapse; display: block; overflow-x: auto; }
.prose th, .prose td { border: 1px solid var(--line); padding: 6px 10px; text-align: left; vertical-align: top; }
.prose th { background: var(--card); }
.prose pre { background: var(--code); padding: 12px; border-radius: 8px; overflow-x: auto; }
.prose code { background: var(--code); padding: 1px 5px; border-radius: 4px; font-size: .92em; }
.prose pre code { background: none; padding: 0; }
.prose blockquote { margin: 1em 0; padding: 4px 16px; border-left: 4px solid var(--accent); background: var(--card); }
.diagram { margin: 1.2em 0; overflow-x: auto; text-align: center; }
.meta { color: var(--muted); font-size: 14px; margin: 0; }
.lectures { color: var(--muted); font-size: 14px; margin-bottom: 16px; }
.quiz { margin-top: 3em; }
.quiz .q { background: var(--card); border: 1px solid var(--line); border-radius: 10px; padding: 8px 16px; margin: 12px 0; }
.quiz summary { cursor: pointer; color: var(--accent-fg); font-weight: 600; }
.pager { display: flex; justify-content: space-between; gap: 12px; margin-top: 3em; }
.pager a { flex: 1; border: 1px solid var(--line); border-radius: 10px; padding: 10px 14px; text-decoration: none; color: var(--fg); }
.pager a:last-child { text-align: right; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 12px; }
.card { background: var(--card); border: 1px solid var(--line); border-radius: 10px; padding: 12px 16px; }
@media (max-width: 860px) {
  .shell { grid-template-columns: 1fr; }
  #menu { display: inline-block; }
  .side { display: none; position: fixed; inset: 53px 0 0 0; max-height: none; background: var(--bg); z-index: 9; }
  .side.open { display: block; }
  #search { min-width: 0; flex: 1; }
}
```

- [ ] **Step 2: Create `site/src/components/Quiz.astro`**

```astro
---
interface Q { question: string; options: string[]; answer: number; explanation: string }
const { questions } = Astro.props as { questions: Q[] };
const letters = 'ABCDE';
---
{questions.length > 0 && (
  <section class="quiz">
    <h2>Practice questions</h2>
    {questions.map((q, i) => (
      <div class="q">
        <p><strong>{i + 1}.</strong> {q.question}</p>
        <ol type="A">{q.options.map((o) => <li>{o}</li>)}</ol>
        <details>
          <summary>Show answer</summary>
          <p><strong>Answer: {letters[q.answer]}.</strong> {q.explanation}</p>
        </details>
      </div>
    ))}
  </section>
)}
```

- [ ] **Step 3: Create `site/src/layouts/Layout.astro`**

```astro
---
import { getCollection } from 'astro:content';
import '../styles/global.css';
import parts from '../data/parts.json';

interface Props { title: string; current?: string }
const { title, current } = Astro.props;
const chapters = (await getCollection('chapters')).sort((a, b) => a.data.section - b.data.section);
const extras = (await getCollection('extras')).sort((a, b) => a.data.order - b.data.order);
const currentSection = chapters.find((c) => c.id === current)?.data.section;
---
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title} · AWS Reading Course</title>
  </head>
  <body>
    <header class="top">
      <button id="menu" aria-label="Toggle menu">☰</button>
      <a class="brand" href="/">AWS Reading Course</a>
      <div id="search"></div>
    </header>
    <div class="shell">
      <nav class="side" id="side" aria-label="Chapters">
        {parts.map((p) => {
          const items = chapters.filter((c) => c.data.section >= p.from && c.data.section <= p.to);
          const open = currentSection !== undefined && currentSection >= p.from && currentSection <= p.to;
          return (
            <details open={open}>
              <summary>{p.name}</summary>
              <ul>
                {items.map((c) => (
                  <li><a href={`/chapters/${c.id}/`} aria-current={c.id === current ? 'page' : undefined}>{c.data.section}. {c.data.title}</a></li>
                ))}
              </ul>
            </details>
          );
        })}
        <div class="extras">
          {extras.map((e) => <a href={`/guide/${e.id}/`}>{e.data.title}</a><br />)}
        </div>
      </nav>
      <main data-pagefind-body><slot /></main>
    </div>
    <script>
      document.getElementById('menu')?.addEventListener('click', () => document.getElementById('side')?.classList.toggle('open'));

      async function initSearch() {
        const el = document.getElementById('search');
        try {
          const css = document.createElement('link');
          css.rel = 'stylesheet';
          css.href = '/pagefind/pagefind-ui.css';
          document.head.append(css);
          await new Promise((res, rej) => {
            const s = document.createElement('script');
            s.src = '/pagefind/pagefind-ui.js';
            s.onload = res;
            s.onerror = rej;
            document.head.append(s);
          });
          // @ts-expect-error provided by pagefind-ui.js
          new PagefindUI({ element: '#search', showSubResults: true });
        } catch {
          if (el) el.textContent = 'Search works after a build';
        }
      }
      initSearch();

      const blocks = document.querySelectorAll('pre[data-language="mermaid"], pre.language-mermaid');
      if (blocks.length) {
        const { default: mermaid } = await import('mermaid');
        mermaid.initialize({ startOnLoad: false, theme: matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'default' });
        let i = 0;
        for (const pre of blocks) {
          const { svg } = await mermaid.render(`mmd${i++}`, pre.textContent ?? '');
          const div = document.createElement('div');
          div.className = 'diagram';
          div.innerHTML = svg;
          pre.replaceWith(div);
        }
      }
    </script>
  </body>
</html>
```

- [ ] **Step 4: Commit** (pages come next; nothing to run yet)

```bash
cd /home/nguyen/code/udemy && git add site/src && git commit -m "feat: layout, styles, quiz component"
```

---

### Task 5: Pages and extras stubs

**Files:**
- Create: `site/src/pages/index.astro`, `site/src/pages/chapters/[id].astro`, `site/src/pages/guide/[id].astro`, `site/src/content/extras/{glossary,decision-guide,interview-questions}.md`

- [ ] **Step 1: Create `site/src/pages/chapters/[id].astro`**

```astro
---
import { getCollection, render } from 'astro:content';
import Layout from '../../layouts/Layout.astro';
import Quiz from '../../components/Quiz.astro';

export async function getStaticPaths() {
  const all = (await getCollection('chapters')).sort((a, b) => a.data.section - b.data.section);
  return all.map((entry, i) => ({ params: { id: entry.id }, props: { entry, prev: all[i - 1], next: all[i + 1] } }));
}
const { entry, prev, next } = Astro.props;
const { Content } = await render(entry);
const d = entry.data;
---
<Layout title={`${d.section}. ${d.title}`} current={entry.id}>
  <p class="meta">{d.part} · {d.kind === 'lab' ? 'Lab' : 'Chapter'} {d.section} · about {d.readingTime} min read</p>
  <h1>{d.title}</h1>
  <details class="lectures">
    <summary>Course lectures covered ({d.lectures.length})</summary>
    <ul>{d.lectures.map((l) => <li>{l}</li>)}</ul>
  </details>
  <article class="prose"><Content /></article>
  <Quiz questions={d.quiz} />
  <nav class="pager">
    {prev ? <a href={`/chapters/${prev.id}/`}>← {prev.data.section}. {prev.data.title}</a> : <span />}
    {next ? <a href={`/chapters/${next.id}/`}>{next.data.section}. {next.data.title} →</a> : <span />}
  </nav>
</Layout>
```

- [ ] **Step 2: Create `site/src/pages/guide/[id].astro`**

```astro
---
import { getCollection, render } from 'astro:content';
import Layout from '../../layouts/Layout.astro';

export async function getStaticPaths() {
  return (await getCollection('extras')).map((entry) => ({ params: { id: entry.id }, props: { entry } }));
}
const { entry } = Astro.props;
const { Content } = await render(entry);
---
<Layout title={entry.data.title}>
  <h1>{entry.data.title}</h1>
  <article class="prose"><Content /></article>
</Layout>
```

- [ ] **Step 3: Create `site/src/pages/index.astro`**

```astro
---
import { getCollection } from 'astro:content';
import Layout from '../layouts/Layout.astro';
import parts from '../data/parts.json';

const chapters = (await getCollection('chapters')).sort((a, b) => a.data.section - b.data.section);
const done = chapters.filter((c) => c.data.status === 'done').length;
---
<Layout title="Home">
  <h1>AWS Reading Course</h1>
  <p>Read-only version of the Udemy course <em>AWS Architecting: The Ultimate Course</em>: {chapters.length} chapters in course order, each with a cheat sheet, comparison tables, diagrams and practice questions. {done} of {chapters.length} chapters written.</p>
  {parts.map((p) => (
    <section>
      <h2>{p.name}</h2>
      <div class="grid">
        {chapters.filter((c) => c.data.section >= p.from && c.data.section <= p.to).map((c) => (
          <a class="card" href={`/chapters/${c.id}/`}>
            <strong>{c.data.section}. {c.data.title}</strong><br />
            <span class="meta">{c.data.kind === 'lab' ? 'Lab' : 'Chapter'} · {c.data.status === 'done' ? `${c.data.readingTime} min` : 'coming soon'}</span>
          </a>
        ))}
      </div>
    </section>
  ))}
</Layout>
```

- [ ] **Step 4: Create the three extras as stubs** (filled in Task 11)

```bash
cd /home/nguyen/code/udemy/site/src/content/extras
printf -- '---\ntitle: "Glossary"\norder: 1\nstatus: stub\n---\n\nNot written yet.\n' > glossary.md
printf -- '---\ntitle: "Which service for which job"\norder: 2\nstatus: stub\n---\n\nNot written yet.\n' > decision-guide.md
printf -- '---\ntitle: "Interview questions"\norder: 3\nstatus: stub\n---\n\nNot written yet.\n' > interview-questions.md
```

- [ ] **Step 5: Extend the check script to cover extras and chapter inventory** — create `site/scripts/check-content.mjs`

```js
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
```

- [ ] **Step 6: Verify the check, tests and a draft build**

Run:
```bash
cd /home/nguyen/code/udemy/site
node scripts/check-content.mjs --allow-stubs   # expect: content OK (60 chapters, stubs allowed)
node scripts/check-content.mjs; echo "exit=$?"  # expect: many "status is stub" lines and exit=1
npm test                                         # expect: 12 pass
npm run build:draft
```
Expected: build completes; `dist/index.html`, `dist/chapters/04-aws-identity-and-access-management-iam/index.html` and `dist/pagefind/pagefind-ui.js` exist. If `astro build` fails on the content config (Astro 7 API change), read the error, check `mcp__plugin_context7_context7__query-docs` for `/withastro/docs`, and fix `content.config.ts` — do not guess.

- [ ] **Step 7: Run the dev server and look at the page**

```bash
cd /home/nguyen/code/udemy/site && (npm run dev -- --port 4321 > /tmp/claude-1000/astro-dev.log 2>&1 &) ; sleep 6; curl -s localhost:4321/ | grep -c "AWS Reading Course"
```
Expected: a number ≥ 1. Leave it running for later tasks, or stop it with `pkill -f "astro dev"`.

- [ ] **Step 8: Commit**

```bash
cd /home/nguyen/code/udemy && git add site && git commit -m "feat: pages, extras stubs, content check script"
```

---

### Task 6: Chapter brief and templates

**Files:**
- Create: `docs/chapter-brief.md`

- [ ] **Step 1: Create `docs/chapter-brief.md`** with exactly this content

````markdown
# Chapter writing brief

You are writing ONE chapter of an English reading course that mirrors the Udemy course "AWS Architecting: The Ultimate Course". The reader wants to learn AWS to get a job (SAA-C03 is a side benefit). They will NOT watch videos, so the chapter must teach the material fully, not summarise it.

Input: a chapter file `site/src/content/chapters/NN-slug.md` that currently has front-matter (`section`, `title`, `part`, `kind`, `lectures`) and a stub body.

## Rules
1. Cover EVERY item in `lectures:` — they are the syllabus. Order the content to follow them. Lecture titles that are demos or console clicks become steps or notes.
2. Facts come from AWS documentation. Before writing, load and use `mcp__plugin_aws-core_aws-mcp__aws___search_documentation` / `aws___read_documentation` for each service. Never invent limits, prices or feature names. For numbers that change (quotas, prices), write "check the current quota" and link the docs page.
3. Write for a beginner who wants a job: explain what it is, why it exists, how to choose it, how it breaks. Concrete examples over abstractions. Short paragraphs, tables for comparisons.
4. Keep `kind`, `section`, `title`, `part`, `lectures` unchanged. Set `status: done` and a realistic `readingTime` (minutes, 8–25) only when finished.
5. Quiz: put questions in front-matter `quiz:`. Scenario-style (a short business situation), original wording, 3–5 options, `answer` is the 0-based index of the right option, `explanation` says why it is right AND why each wrong option is wrong. Concept chapters need ≥5 questions, lab and intro chapters ≥3.
6. Diagram: at least one fenced ```mermaid block (flowchart/graph or sequence) that shows the real mechanism or architecture. Keep node labels short.
7. Link at least one page on https://docs.aws.amazon.com/ under `## AWS docs`. Internal links to other chapters use `/chapters/NN-slug/` and must exist.
8. Headings: use `##` for template sections exactly as named below (the validator matches the text). Do not use `#` in the body.
9. Do not copy long passages from AWS docs; paraphrase.

## Template — kind: concept
```
## What it is
(2–4 sentences + a one-line rule: "Use it when …")

## Key concepts
(subsections ### per concept; cover every lecture)

## X vs Y
(at least one comparison table of the nearest alternatives, plus a line: "Pick X when … / pick Y when …")

(a ```mermaid diagram, with a caption sentence)

## Job notes
(what you do with it at work: common tasks, mistakes, cost traps, security defaults, troubleshooting)

## Cheat sheet
(a tight bullet list: definitions, limits-to-check, defaults, gotchas. Must fit one screen.)

## AWS docs
(bulleted links)
```

## Template — kind: lab
```
## What you build
## Architecture            (include the ```mermaid diagram)
## Steps                   (numbered; console path AND CLI/IaC equivalent where useful; expected result per step)
## Common mistakes
## Cleanup                 (exact deletion order so no charges remain)
## On the job              (how this pattern appears in real projects)
## AWS docs
```

## Template — kind: intro
```
## What it is
## Key concepts
## Cheat sheet
## AWS docs
```

## Done means
`cd site && node scripts/check-content.mjs` reports no problems for your file. Report: file path, reading time, number of quiz questions, and any lecture you could not verify in the docs.
````

- [ ] **Step 2: Commit**

```bash
cd /home/nguyen/code/udemy && git add docs/chapter-brief.md && git commit -m "docs: chapter writing brief and templates"
```

---

### Task 7: Reference chapter (section 4, IAM) — sets the quality bar

**Files:**
- Modify: `site/src/content/chapters/04-aws-identity-and-access-management-iam.md`

- [ ] **Step 1:** Follow `docs/chapter-brief.md` exactly for this file. Read the `lectures:` list first; load the AWS docs tools; read the IAM User Guide pages for users/groups/roles, policies and evaluation logic, STS, MFA, Organizations/SCP overview.

- [ ] **Step 2: Validate**

Run: `cd /home/nguyen/code/udemy/site && node scripts/check-content.mjs --allow-stubs`
Expected: `content OK`. Fix every reported problem (the stub chapters are skipped by the flag).

- [ ] **Step 3: Look at it in the browser**

Run (dev server from Task 5 must be running): `curl -s localhost:4321/chapters/04-aws-identity-and-access-management-iam/ | grep -c "mermaid\|Practice questions"`
Then open `http://localhost:4321/chapters/04-aws-identity-and-access-management-iam/` and confirm: the diagram renders as SVG (not raw text), tables scroll on a narrow window, "Show answer" reveals the explanation. If the diagram shows as raw code, inspect the DOM for the `<pre>` class/attribute and fix the selector in `Layout.astro` accordingly.

- [ ] **Step 4: Show the user chapter 4 and ask whether depth, tone and length are right.** Adjust `docs/chapter-brief.md` with their feedback BEFORE writing the other chapters.

- [ ] **Step 5: Commit**

```bash
cd /home/nguyen/code/udemy && git add -A site docs && git commit -m "content: chapter 4 IAM (reference chapter)"
```

---

### Task 8: Write chapters in batches (course order)

**Files:** one `site/src/content/chapters/NN-*.md` per section, listed below.

Repeat Steps 1–4 for each batch, in order. Batches are one course part each.

| Batch | Part | Sections |
|---|---|---|
| B1 | Getting Started | 1, 2, 3 |
| B2 | Networking Basics | 5 |
| B3 | Compute & Containers | 6, 7, 8, 9 |
| B4 | Storage | 10–18 |
| B5 | Databases | 19–25 |
| B6 | Scaling & Monitoring | 26, 27, 28 |
| B7 | Advanced Networking & Data Transfer | 29–34 |
| B8 | Serverless & Messaging | 35–38 |
| B9 | Security & Infrastructure as Code | 39–43 |
| B10 | CI/CD | 44–47 |
| B11 | Edge, AI & Multi-Account | 48–52 |
| B12 | Disaster Recovery | 53–58 |
| B13 | Capstone & Exam Prep | 59, 60 |

(Section 4 was done in Task 7.)

- [ ] **Step 1: Dispatch one subagent per chapter in the batch, in parallel (at most 5 at once).** Prompt for each:

> Read `/home/nguyen/code/udemy/docs/chapter-brief.md` and follow it exactly. Your chapter file is `/home/nguyen/code/udemy/site/src/content/chapters/<FILE>`. Use `04-aws-identity-and-access-management-iam.md` as the quality reference. Load the AWS docs MCP tools with ToolSearch (`select:mcp__plugin_aws-core_aws-mcp__aws___search_documentation,mcp__plugin_aws-core_aws-mcp__aws___read_documentation`) and base every fact on them. Edit only your file. When done run `cd /home/nguyen/code/udemy/site && node scripts/check-content.mjs --allow-stubs`, fix problems in your file, and report the file path, reading time, quiz count, and anything you could not verify.

- [ ] **Step 2: Validate the whole batch**

Run: `cd /home/nguyen/code/udemy/site && node scripts/check-content.mjs --allow-stubs`
Expected: `content OK`. For any failing file, re-dispatch that chapter's agent with the error text.

- [ ] **Step 3: Spot-check two chapters from the batch for accuracy** — pick the one with the most numbers (quotas, limits) and read it against the AWS docs page it cites. Fix or remove any claim you cannot confirm.

- [ ] **Step 4: Build and commit**

```bash
cd /home/nguyen/code/udemy/site && npm run build:draft
cd /home/nguyen/code/udemy && git add -A site && git commit -m "content: batch <B#> (<part name>)"
```
Expected: build succeeds.

---

### Task 9: Extra pages

**Files:**
- Modify: `site/src/content/extras/glossary.md`, `decision-guide.md`, `interview-questions.md`

- [ ] **Step 1: Write the glossary** — only after all chapters are done: every AWS service and term introduced in the chapters (A–Z, one line each, link to the chapter as `/chapters/NN-slug/`). Front-matter `status: done`.

- [ ] **Step 2: Write the decision guide** — "I need to … → use …" tables by area (compute, storage, database, network connectivity, messaging, security, DR strategy), each row linking to the chapter and stating the deciding factor. Facts from the chapters; verify any new claim against the AWS docs.

- [ ] **Step 3: Write interview questions** — 40–60 junior/mid AWS cloud-engineer questions grouped by area, each with a concise model answer and a link to the chapter that teaches it. Mark scenario/design questions separately.

- [ ] **Step 4: Validate links** — extras are not covered by `validateChapter`, so run:

```bash
cd /home/nguyen/code/udemy/site && node -e "
const fs=require('fs');const ids=new Set(fs.readdirSync('src/content/chapters').map(f=>f.replace('.md','')));
let bad=0;for(const f of fs.readdirSync('src/content/extras')){const t=fs.readFileSync('src/content/extras/'+f,'utf8');
for(const m of t.matchAll(/\]\(\/chapters\/([^)#\s\/]+)/g)) if(!ids.has(m[1])){console.log(f,'broken',m[1]);bad++}}
console.log(bad?bad+' broken':'extras links OK');process.exit(bad?1:0)"
```
Expected: `extras links OK`.

- [ ] **Step 5: Commit**

```bash
cd /home/nguyen/code/udemy && git add -A site && git commit -m "content: glossary, decision guide, interview questions"
```

---

### Task 10: Final verification and cleanup

- [ ] **Step 1: Full strict build (no stubs allowed)**

Run: `cd /home/nguyen/code/udemy/site && npm test && npm run build`
Expected: 12 tests pass; `content OK (60 chapters)`; Astro builds 60 chapter pages + 3 guide pages + index; Pagefind reports the indexed page count (≥ 64).

- [ ] **Step 2: Preview and click through**

Run: `cd /home/nguyen/code/udemy/site && npm run preview -- --port 4322` and check, using Playwright (python) or a browser: home lists 14 parts / 60 cards; a chapter renders its diagram as SVG; search for "NAT gateway" returns the networking chapter; mobile width (390 px) shows the ☰ menu with no horizontal page scroll.

- [ ] **Step 3: Remove the leftover Udemy login session** (it was created only for the course lookup). Ask the user first, then:

```bash
pkill -f "remote-debugging-port=9222"; rm -rf /home/nguyen/code/udemy/.profile /home/nguyen/code/udemy/.profile2
```

- [ ] **Step 4: Write `site/README.md`** with: `cd site && npm install`, `npm run dev`, `npm run build`, `npm run check`, how to add a chapter, and the validation rules. Commit.

```bash
cd /home/nguyen/code/udemy && git add -A && git commit -m "docs: site README and final verification"
```

---

## Self-review (done at plan time)

- **Spec coverage:** goal/order (Task 3 scaffold, 60 chapters), English + docs-sourced content (brief rules 2–3), Astro + Markdown + Pagefind + dark mode + mobile (Tasks 1, 4, 10), cheat-sheet / X-vs-Y / quiz / diagrams (templates + validator), labs as walkthroughs (kind: lab template), extra pages (Task 9), build order skeleton → chapters → extras (Tasks 1–9), testing (Task 2, 5, 10), no progress tracking (none added).
- **Placeholders:** none in code steps; chapter bodies are produced by Task 7/8 from the brief by design.
- **Consistency:** schema field names (`section`, `title`, `part`, `kind`, `status`, `readingTime`, `lectures`, `quiz`) match the scaffold output, validator, pages and brief; section headings in `validate.mjs` match the templates in the brief.
