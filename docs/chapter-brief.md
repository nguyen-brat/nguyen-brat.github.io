# Chapter writing brief

You are writing ONE chapter of an English reading course that mirrors the Udemy course "AWS Architecting: The Ultimate Course". The reader wants to learn AWS to get a job (SAA-C03 is a side benefit). They will NOT watch videos, but they want it **simple, concise and visual**: pictures first, words second.

Input: a chapter file `site/src/content/chapters/NN-slug.md` that has front-matter (`section`, `title`, `part`, `kind`, `lectures`) and a stub body.

## Style (most important)
- **Concise.** Target 800–1800 words of prose, hard cap 2500. Reading time 5–10 minutes. If a sentence does not help someone do the job or choose a service, cut it.
- **Diagrams first.** Every idea that has a flow, a structure, a relationship or a decision gets a Mermaid diagram BEFORE the text that explains it. Minimum 2 diagrams (3–5 is normal). Vary the types: `flowchart` (architecture, decisions), `sequenceDiagram` (who calls whom, auth flows, request paths), `stateDiagram-v2` (lifecycles), `graph LR` (data flow). Keep labels short; use emoji sparingly as icons (e.g. 👤 🪣 🗄️ ☁️ 🔒) to make nodes recognisable. Each diagram gets a one-line caption.
- **Tables for comparisons**, bullets for lists. No long paragraphs: max 3 sentences each.
- **Plain words.** Explain a term once in simple language, then use it. No filler, no history, no marketing.
- Show real examples as small code/CLI/JSON snippets only when they are what the reader will actually type at work.

## Content rules
1. Cover EVERY item in `lectures:` — they are the syllabus — but merge small lectures (demos, "console tour") into one short step list or note. Do not make a subsection per lecture.
2. Facts come from AWS documentation. Before writing, load and use `mcp__plugin_aws-core_aws-mcp__aws___search_documentation` / `aws___read_documentation` for each service. Never invent limits, prices or feature names. For numbers that change (quotas, prices) write "check the current quota" and link the docs page.
3. Keep `kind`, `section`, `title`, `part`, `lectures` unchanged. Set `status: done` and a realistic `readingTime` (minutes, 4–12) only when finished.
4. Quiz in front-matter `quiz:` — 5 questions for concept chapters, 3 for lab/intro. Short scenario (1–2 sentences), 3–4 options, `answer` is the 0-based index of the right option, `explanation` in 1–3 sentences that says why it is right and why the main wrong option is wrong. Original wording.
5. Link at least one page on https://docs.aws.amazon.com/ under `## AWS docs` (2–5 links). Internal links to other chapters use `/chapters/NN-slug/` and must exist.
6. Headings: `##` for template sections exactly as named below (the validator matches the text). Do not use `#` in the body. Use `###` sparingly.
7. Do not copy passages from AWS docs; paraphrase.

## Template — kind: concept
```
## What it is
(2–3 sentences + diagram + one-line rule: "Use it when …")

## Key concepts
(each concept: a diagram or small table, then 1–3 bullets. Cover every lecture.)

## X vs Y
(comparison table of the nearest alternatives, plus: "Pick X when … / pick Y when …")

## Job notes
(bullets: common tasks, mistakes, cost traps, security defaults, troubleshooting. Add a diagram if it shows a workflow.)

## Cheat sheet
(a tight bullet list that fits one screen)

## AWS docs
(bulleted links)
```

## Template — kind: lab
```
## What you build
(1–2 sentences + architecture diagram)

## Architecture
(second diagram: data/request flow or sequence; 3–5 bullets on the components)

## Steps
(numbered, one line each, console path and the CLI/IaC equivalent where short; expected result at the end)

## Common mistakes
## Cleanup
(exact deletion order so no charges remain)

## On the job
## AWS docs
```

## Template — kind: intro
```
## What it is
(include 1 diagram)

## Key concepts
## Cheat sheet
## AWS docs
```

## Done means
`cd /home/nguyen/code/udemy/site && node scripts/check-content.mjs --allow-stubs` reports no problems for your file (diagram count, word cap, quiz, template headings, links). Read the chapter once as a beginner: if a paragraph can be replaced by a diagram or a table, do it. Report: file path, reading time, word count, number of diagrams, quiz count, and any lecture you could not verify in the docs.
