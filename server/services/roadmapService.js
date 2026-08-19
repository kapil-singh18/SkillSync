const { generateContent } = require('./aiService');

/**
 * Strips markdown code blocks and trims JSON strings.
 * @param {string} raw
 * @returns {string}
 */
const cleanJsonOutput = (raw) => {
  let cleaned = raw.trim();
  // Remove markdown code fences ```json ... ``` or ``` ... ```
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  }
  return cleaned.trim();
};

/**
 * Generates a standard fallback roadmap in case AI API is unreachable or fails.
 */
const getFallbackRoadmap = (topic, level) => {
  const capTopic = topic.charAt(0).toUpperCase() + topic.slice(1);
  return [
    {
      title: `Fundamentals of ${capTopic}`,
      description: `Understand core concepts, syntax, and foundational architecture of ${capTopic} at the ${level} level.`,
      estimatedTime: '1 week',
      resources: ['Official Documentation', 'Interactive Tutorials'],
      completed: false,
      order: 1,
    },
    {
      title: `Core Principles & Best Practices`,
      description: `Deep dive into standard patterns, conventions, and essential tooling used in modern ${capTopic} workflows.`,
      estimatedTime: '2 weeks',
      resources: ['Curated Guidebooks', 'Code Along Exercises'],
      completed: false,
      order: 2,
    },
    {
      title: `Hands-on Project Building`,
      description: `Apply your knowledge by building a practical real-world application using ${capTopic}.`,
      estimatedTime: '2 weeks',
      resources: ['GitHub Starter Repos', 'Community Project Guides'],
      completed: false,
      order: 3,
    },
    {
      title: `Advanced Techniques & Optimization`,
      description: `Learn performance tuning, security considerations, and state-of-the-art patterns in ${capTopic}.`,
      estimatedTime: '2 weeks',
      resources: ['In-depth Articles', 'Case Studies'],
      completed: false,
      order: 4,
    },
    {
      title: `Mastery & Portfolio Showcase`,
      description: `Polish project code, write documentation, and demonstrate ${capTopic} proficiency in your peer network.`,
      estimatedTime: '1 week',
      resources: ['Portfolio Review Checklist', 'Peer Feedback Sessions'],
      completed: false,
      order: 5,
    },
  ];
};

/**
 * Generates 5-8 structured roadmap steps for a topic and skill level using Gemini.
 * @param {string} topic - The skill/topic to learn.
 * @param {string} userLevel - beginner | intermediate | advanced
 * @returns {Promise<Array>} Array of step objects
 */
const generateRoadmap = async (topic, userLevel = 'beginner') => {
  const prompt = `You are an expert technical curriculum designer and mentor.
Create a structured step-by-step learning roadmap for a student learning "${topic}" at the "${userLevel}" level.

Return ONLY a valid JSON array of 5 to 8 objects. Do not include any explanations, markdown headers, or surrounding text.
Each object must have the following structure:
{
  "title": "Short descriptive step title",
  "description": "2-3 sentences explaining what to learn and practice in this step",
  "estimatedTime": "e.g., 1 week or 2-3 days",
  "resources": ["Name of resource or documentation 1", "Resource 2"]
}`;

  try {
    const rawResponse = await generateContent(prompt);
    const cleaned = cleanJsonOutput(rawResponse);
    const parsed = JSON.parse(cleaned);

    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error('AI response is not a valid roadmap step list');
    }

    return parsed.map((item, index) => ({
      title: String(item.title || `Step ${index + 1}`).trim(),
      description: String(item.description || '').trim(),
      estimatedTime: String(item.estimatedTime || '1 week').trim(),
      resources: Array.isArray(item.resources)
        ? item.resources.map(String)
        : [],
      completed: false,
      order: index + 1,
    }));
  } catch (err) {
    // If Gemini fails (e.g. key not set or rate limited), provide high quality structured fallback
    console.warn(`[roadmapService] AI generation error: ${err.message}. Using structured fallback.`);
    return getFallbackRoadmap(topic, userLevel);
  }
};

module.exports = { generateRoadmap };
