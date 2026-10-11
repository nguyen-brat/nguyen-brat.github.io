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
