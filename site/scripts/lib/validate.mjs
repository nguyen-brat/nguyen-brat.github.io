const REQUIRED = {
  concept: ['What it is', 'Key concepts', 'X vs Y', 'Job notes', 'Cheat sheet', 'AWS docs'],
  lab: ['What you build', 'Architecture', 'Steps', 'Common mistakes', 'Cleanup', 'On the job', 'AWS docs'],
  intro: ['What it is', 'Key concepts', 'Cheat sheet', 'AWS docs'],
};
const MIN_QUIZ = { concept: 5, lab: 3, intro: 3 };
const MIN_DIAGRAMS = { concept: 2, lab: 2, intro: 1 };
const MAX_WORDS = 2500;

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
  const diagrams = (content.match(/```mermaid\n/g) ?? []).length;
  const minD = MIN_DIAGRAMS[data.kind] ?? 0;
  if (diagrams < minD) errors.push(`needs at least ${minD} mermaid diagrams, has ${diagrams}`);
  const words = content.replace(/```[\s\S]*?```/g, ' ').split(/\s+/).filter(Boolean).length;
  if (words > MAX_WORDS) errors.push(`too long: ${words} words (max ${MAX_WORDS}); cut text, use a diagram or table`);
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
