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
