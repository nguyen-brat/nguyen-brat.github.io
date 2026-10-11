# AWS Reading Site — Design

Date: 2026-10-11 · Status: approved by user

## Goal
A read-only website for learning AWS well enough to get a job, following the order of the Udemy course "AWS Architecting: The Ultimate Course (Tiếng Việt)" (60 sections, see `course_structure.md`). SAA-C03 exam prep is a side benefit only. The user does not want to watch videos.

## Decisions
- Language: English.
- Content source: AWS documentation (via the installed AWS docs tools) plus own knowledge, using the course's section and lecture titles as the syllabus. Udemy captions are NOT used.
- Stack: Astro static site, Markdown lessons, full-text search with Pagefind, dark/light mode, mobile-friendly.
- Features: cheat-sheet, "X vs Y" tables, practice questions with explanations, architecture diagrams.
- Diagrams: Mermaid code blocks rendered in the browser from a bundled package (works offline; build-time rendering would need a headless browser).
- Not included: progress tracking, accounts, analytics.

## Content model
One chapter per course section (60), same order, grouped into the course's blocks (IAM, networking, compute, storage, databases, serverless, IaC, CI/CD, edge, DR, ...). The 25 lab sections (course sections with titles starting "LAB", covering 17 numbered labs) become written walkthroughs, stored as chapters with `kind: lab` in the same collection (keeps course order and one sidebar): what you build, architecture, steps with console/CLI commands, common mistakes, cleanup to avoid charges, and a "how this looks on the job" note.

Chapter template (in this order): what it is + "use it when" rule; key concepts; X vs Y table; diagram; job notes / common mistakes; cheat-sheet; 5–8 practice questions; links to AWS docs. IaC and CI/CD chapters add a "do it yourself" exercise.

Extra pages: glossary, "which service for which job" decision guide, interview questions.

Chapter front-matter: `section` (1–60), `title`, `block`, `reading_time`, `quiz` (list of question, options, answer index, explanation).

## Layout
```
site/
  src/content/chapters/NN-slug.md
  src/components/  Quiz, Diagram, CompareTable, Callout
  src/pages/       index, chapter, glossary, decision-guide, interview-questions
  public/diagrams/ SVG
```

## Accuracy rules
- Write from AWS docs; end each chapter with links to the matching AWS docs pages.
- Do not hard-code limits or prices that change; say "check current docs" and link the source.
- Practice questions are original, not real exam content.

## Build order
1. Site skeleton, components, one sample chapter.
2. Chapters in course order in batches (parallel agents, each chapter independent), building after each batch.
3. Extra pages (glossary, decision guide, interview questions).

## Testing
- `npm run build` passes.
- Check script: no broken internal links; every quiz question has an answer index and an explanation; every chapter has all template sections.

## Out of scope
Video/caption extraction, user accounts, progress tracking, hosting setup.
