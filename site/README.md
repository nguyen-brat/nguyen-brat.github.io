# AWS Reading Course

A read-only version of the Udemy course *AWS Architecting: The Ultimate Course*: 60 chapters in course order, each with diagrams, comparison tables, a cheat sheet and practice questions, plus a glossary, a "which service for which job" guide and interview questions.

## Run it

```bash
cd site
npm install
npm run dev          # http://localhost:4321 (live reload, no search index)
npm run build        # strict check + build + search index into dist/
npm run preview      # serve dist/ (search works here)
```

`npm run build:draft` is the same but allows chapters still marked `status: stub`.

## Where things are

| Path | What |
|---|---|
| `src/content/chapters/NN-slug.md` | one file per course section (60) |
| `src/content/extras/*.md` | glossary, decision guide, interview questions |
| `src/data/parts.json` | the 14 course parts used for the sidebar |
| `scripts/` | content checker (`npm run check`) and its tests (`npm test`) |
| `../docs/chapter-brief.md` | the writing brief and chapter templates |

## Chapter format

Front-matter: `section`, `title`, `part`, `kind` (`concept` / `lab` / `intro`), `status` (`stub` / `done`), `readingTime`, `lectures`, `quiz`. Quiz items use exactly `question`, `options` (3–5), `answer` (0-based index), `explanation`.

`npm run check` fails the build unless every chapter has: its template sections (`## What it is`, `## X vs Y`, …), at least 2 Mermaid diagrams (1 for intro chapters), the minimum quiz questions, valid quiz fields, a link to docs.aws.amazon.com, no broken `/chapters/...` links, and at most 2,500 words. Diagrams are ```` ```mermaid ```` blocks, rendered in the browser from a bundled package.

## Accuracy notes

Chapters were written from AWS documentation using the course's lecture titles as the syllabus (not the videos). Prices and quotas are deliberately not quoted: chapters say to check the current values and link the source. Lab chapters describe the pattern generically where the course's own app is unknown. Anything an author could not confirm in the docs was flagged at writing time; treat console menu wording as approximate and the linked AWS docs as authoritative.
