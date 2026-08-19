const Assessment = require('../models/Assessment');
const { generateContent } = require('./aiService');

const cleanJsonOutput = (raw) => {
  let cleaned = raw.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  }
  return cleaned.trim();
};

/**
 * Returns 5 fallback questions if AI generation fails or API key is not configured.
 */
const getFallbackQuestions = (skillName, difficulty) => {
  const cap = skillName.charAt(0).toUpperCase() + skillName.slice(1);
  return [
    {
      questionText: `What is the primary purpose of ${cap} in modern development?`,
      options: [
        `To structure and implement scalable solutions in ${cap}`,
        'To replace standard database storage engines entirely',
        'To compile legacy code directly to low-level assembly',
        'None of the above',
      ],
      correctOptionIndex: 0,
    },
    {
      questionText: `Which of the following is considered a core best practice when working with ${cap}?`,
      options: [
        'Ignoring edge cases during unit and integration tests',
        'Following standard modular architectural patterns and conventions',
        'Hardcoding credentials and config constants directly in components',
        'Avoiding version control systems in production builds',
      ],
      correctOptionIndex: 1,
    },
    {
      questionText: `When handling asynchronous or concurrent operations in ${cap}, what is the recommended approach?`,
      options: [
        'Using busy-wait loops to block execution indefinitely',
        'Disabling all runtime error handlers and event loops',
        'Utilizing structured async/await or standard reactive paradigms with try/catch',
        'Terminating the main thread on the first unhandled event',
      ],
      correctOptionIndex: 2,
    },
    {
      questionText: `How should state and data transformations typically be managed at an ${difficulty} level in ${cap}?`,
      options: [
        'By mutating global state unpredictably across multiple files',
        'By using immutable or deterministic predictable flow patterns',
        'By storing all application state in browser cookies only',
        'By eliminating state management entirely from the architecture',
      ],
      correctOptionIndex: 1,
    },
    {
      questionText: `What is the most effective way to optimize performance in ${cap}?`,
      options: [
        'Profiling bottlenecks, optimizing algorithms, and memoizing expensive computations',
        'Increasing bundle size with redundant unused libraries',
        'Disabling runtime caching and compression headers',
        'Running all compute-heavy tasks synchronously on the main thread',
      ],
      correctOptionIndex: 0,
    },
  ];
};

/**
 * Generates or retrieves an existing 5-question MCQ assessment for a skill and difficulty.
 * @param {string} skillName
 * @param {string} difficulty - beginner | intermediate | advanced
 * @returns {Promise<Document>} Assessment document
 */
const generateAssessment = async (skillName, difficulty = 'beginner') => {
  const normalizedSkill = skillName.trim().toLowerCase();
  const validDifficulty = ['beginner', 'intermediate', 'advanced'].includes(
    difficulty
  )
    ? difficulty
    : 'beginner';

  // 1. Check if an assessment already exists in DB for this skill + difficulty
  const existing = await Assessment.findOne({
    skillName: normalizedSkill,
    difficulty: validDifficulty,
  });

  if (existing && existing.questions?.length === 5) {
    return existing;
  }

  // 2. Otherwise generate 5 MCQs using Gemini
  const prompt = `You are a senior technical interviewer and educator.
Create an accurate, high-quality multiple choice assessment for the skill "${normalizedSkill}" at the "${validDifficulty}" level.

Return ONLY a valid JSON array of exactly 5 question objects. Do not include markdown code fences, headers, or surrounding text.
Each object must have this exact structure:
{
  "questionText": "The question text here?",
  "options": [
    "Option A text",
    "Option B text",
    "Option C text",
    "Option D text"
  ],
  "correctOptionIndex": 0
}
Note: correctOptionIndex must be an integer (0, 1, 2, or 3) indicating which option in the options array is the correct answer.`;

  let questions = [];

  try {
    const rawResponse = await generateContent(prompt);
    const cleaned = cleanJsonOutput(rawResponse);
    const parsed = JSON.parse(cleaned);

    if (Array.isArray(parsed) && parsed.length >= 5) {
      questions = parsed.slice(0, 5).map((q) => {
        const options = Array.isArray(q.options) && q.options.length === 4
          ? q.options.map(String)
          : ['Option A', 'Option B', 'Option C', 'Option D'];

        const correctIdx = Number.isInteger(q.correctOptionIndex) &&
          q.correctOptionIndex >= 0 &&
          q.correctOptionIndex < 4
          ? q.correctOptionIndex
          : 0;

        return {
          questionText: String(q.questionText || 'Question').trim(),
          options,
          correctOptionIndex: correctIdx,
        };
      });
    } else {
      throw new Error('AI output did not contain 5 valid questions');
    }
  } catch (err) {
    console.warn(`[assessmentService] AI generation error: ${err.message}. Using structured fallback.`);
    questions = getFallbackQuestions(normalizedSkill, validDifficulty);
  }

  // 3. Upsert into DB
  const assessment = await Assessment.findOneAndUpdate(
    { skillName: normalizedSkill, difficulty: validDifficulty },
    {
      skillName: normalizedSkill,
      difficulty: validDifficulty,
      questions,
    },
    { upsert: true, new: true }
  );

  return assessment;
};

module.exports = { generateAssessment };
