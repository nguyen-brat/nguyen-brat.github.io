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
