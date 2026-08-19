const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Generates content using the Google Gemini API.
 *
 * @param {string} prompt - The text prompt to send to Gemini.
 * @returns {Promise<string>} The generated text response.
 * @throws {Error} If GEMINI_API_KEY is missing or the API call fails.
 */
const generateContent = async (prompt) => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error(
      '[aiService] GEMINI_API_KEY is not set. Please add it to your .env file.'
    );
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const result = await model.generateContent(prompt);
  const response = result.response;
  return response.text();
};

module.exports = { generateContent };
