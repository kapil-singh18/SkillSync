const { GoogleGenerativeAI } = require('@google/generative-ai');

const getClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'GEMINI_API_KEY is not set. Add it to your .env file to use AI features.'
    );
  }
  return new GoogleGenerativeAI(apiKey);
};

/**
 * Strips markdown code fences from a string and attempts to parse it as JSON.
 * Useful for extracting structured data from Gemini's text responses.
 *
 * @param {string} text - Raw text from the model
 * @returns {any} Parsed JSON value
 * @throws {Error} If the text cannot be parsed as JSON after stripping fences
 */
const parseJsonFromModel = (text) => {
  const stripped = text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();

  try {
    return JSON.parse(stripped);
  } catch {
    throw new Error(`AI returned content that could not be parsed as JSON: ${stripped}`);
  }
};

/**
 * Sends a prompt to the Gemini API and returns the text response.
 *
 * @param {string} prompt
 * @param {string} [modelName='gemini-1.5-flash']
 * @returns {Promise<string>}
 */
const generateContent = async (prompt, modelName = 'gemini-1.5-flash') => {
  const client = getClient();
  const model = client.getGenerativeModel({ model: modelName });
  const result = await model.generateContent(prompt);
  return result.response.text();
};

module.exports = { generateContent, parseJsonFromModel };
