import { eq } from "drizzle-orm";

import { createDatabase } from "./client";
import { contentItems } from "./schema";

const seedContent: (typeof contentItems.$inferInsert)[] = [
  {
    kind: "vocabulary",
    title: "Academic vocabulary: assess",
    body: {
      headword: "assess",
      level: "6.0",
      definition: "to judge the quality, importance, or value of something",
      example: "The chart assesses changes in household energy use.",
      synonyms: ["evaluate", "appraise"],
      antonyms: ["ignore"],
    },
    sourceType: "original",
    rightsNote: "Original Alpha teaching content.",
    skillTags: ["vocabulary", "writing"],
    questionType: "word_in_context",
    publicationStatus: "published",
    publishedAt: new Date(),
  },
  {
    kind: "listening_question",
    title: "Campus library booking",
    body: {
      transcript: "The study room is available from half past three.",
      prompt: "What time is the study room available?",
      answer: "3:30 pm",
    },
    sourceType: "original",
    rightsNote: "Original Alpha teaching content and recording script.",
    skillTags: ["listening"],
    questionType: "form_completion",
    publicationStatus: "published",
    publishedAt: new Date(),
  },
  {
    kind: "reading_question",
    title: "Urban rooftop gardens",
    body: {
      passage: "Rooftop gardens can moderate building temperatures while providing small habitats for insects.",
      prompt: "Which two benefits are stated?",
      answer: ["temperature moderation", "insect habitats"],
    },
    sourceType: "original",
    rightsNote: "Original Alpha teaching content.",
    skillTags: ["reading"],
    questionType: "short_answer",
    publicationStatus: "published",
    publishedAt: new Date(),
  },
  {
    kind: "writing_prompt",
    title: "Task 1: Library visits",
    body: {
      taskType: "task_1",
      prompt: "The table shows visits to three city libraries in 2010 and 2020. Summarise the main features and make comparisons where relevant.",
    },
    sourceType: "original",
    rightsNote: "Original Alpha prompt; no official IELTS material reproduced.",
    skillTags: ["writing"],
    questionType: "table",
    publicationStatus: "published",
    publishedAt: new Date(),
  },
  {
    kind: "writing_prompt",
    title: "Task 2: Public transport investment",
    body: {
      taskType: "task_2",
      prompt: "Some people believe cities should invest more in public transport than in new roads. To what extent do you agree or disagree?",
    },
    sourceType: "original",
    rightsNote: "Original Alpha prompt; no official IELTS material reproduced.",
    skillTags: ["writing"],
    questionType: "opinion",
    publicationStatus: "published",
    publishedAt: new Date(),
  },
  {
    kind: "speaking_prompt",
    title: "Part 2: A useful place",
    body: {
      part: 2,
      category: "Place",
      prompt: "Describe a place in your city that is useful to many people.",
      cues: ["where it is", "who uses it", "why it is useful"],
    },
    sourceType: "original",
    rightsNote: "Original Alpha speaking prompt.",
    skillTags: ["speaking"],
    questionType: "part_2",
    publicationStatus: "published",
    publishedAt: new Date(),
  },
];

async function seed() {
  const { client, db } = createDatabase();

  try {
    for (const item of seedContent) {
      const existing = await db
        .select({ id: contentItems.id })
        .from(contentItems)
        .where(eq(contentItems.title, item.title))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(contentItems).values(item);
      }
    }
  } finally {
    await client.end();
  }
}

seed().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
