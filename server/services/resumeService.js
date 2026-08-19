/**
 * Resume Analysis Service
 *
 * Extracts text from uploaded PDF resumes and sends it to Gemini
 * for skill analysis, gap identification, and project recommendations.
 */
const { generateContent } = require('./aiService');

// ─── Simple text extraction from PDF buffer ─────────────────────────────────

/**
 * Very basic PDF text extractor — pulls readable ASCII/UTF-8 strings
 * from a raw PDF buffer. Not as full-featured as pdf-parse but has
 * zero dependencies.
 */
const extractTextFromPDF = (buffer) => {
  const text = buffer.toString('utf8');

  // Find text between BT and ET markers (PDF text objects)
  const textBlocks = [];
  const regex = /\(([^)]+)\)/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const cleaned = match[1].replace(/\\[nrt]/g, ' ').trim();
    if (cleaned.length > 1) {
      textBlocks.push(cleaned);
    }
  }

  // If PDF text extraction yields minimal results, fall back to
  // extracting any readable strings
  if (textBlocks.join(' ').length < 50) {
    const readable = text
      .replace(/[^\x20-\x7E\n]/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();
    return readable.substring(0, 5000);
  }

  return textBlocks.join(' ').substring(0, 5000);
};

// ─── Gemini analysis ────────────────────────────────────────────────────────

const cleanJsonOutput = (text) => {
  return text.replace(/```(?:json)?\s*/gi, '').replace(/```\s*/g, '').trim();
};

const analyzeResume = async (pdfBuffer) => {
  const resumeText = extractTextFromPDF(pdfBuffer);

  if (!resumeText || resumeText.length < 20) {
    return getFallbackAnalysis('Could not extract sufficient text from the PDF.');
  }

  const prompt = `You are an expert career counselor and technical recruiter. Analyze the following resume text and return a JSON object with this exact structure:

{
  "identifiedSkills": [
    { "name": "Skill Name", "level": "beginner|intermediate|advanced", "category": "frontend|backend|devops|data|design|other" }
  ],
  "skillGaps": [
    { "skill": "Skill Name", "reason": "Why this skill would help", "priority": "high|medium|low" }
  ],
  "projectRecommendations": [
    { "title": "Project Title", "description": "Brief project description", "skills": ["skill1", "skill2"], "difficulty": "beginner|intermediate|advanced" }
  ],
  "overallAssessment": "A 2-3 sentence summary of the candidate's profile",
  "careerSuggestions": ["suggestion1", "suggestion2", "suggestion3"]
}

Rules:
- Identify 5-15 skills from the resume
- Suggest 3-5 skill gaps based on current market demand
- Recommend 3-5 portfolio projects that address gaps
- Be specific and actionable

Resume text:
${resumeText}`;

  try {
    const raw = await generateContent(prompt);
    const cleaned = cleanJsonOutput(raw);
    const parsed = JSON.parse(cleaned);
    return parsed;
  } catch (err) {
    console.error('[resumeService] Gemini analysis failed:', err.message);
    return getFallbackAnalysis('AI analysis temporarily unavailable.');
  }
};

const getFallbackAnalysis = (reason) => ({
  identifiedSkills: [],
  skillGaps: [
    { skill: 'Unable to analyze', reason, priority: 'medium' },
  ],
  projectRecommendations: [
    {
      title: 'Personal Portfolio Website',
      description: 'Build a responsive portfolio site showcasing your projects and skills.',
      skills: ['HTML', 'CSS', 'JavaScript'],
      difficulty: 'beginner',
    },
    {
      title: 'REST API Project',
      description: 'Create a full CRUD REST API with authentication.',
      skills: ['Node.js', 'Express', 'MongoDB'],
      difficulty: 'intermediate',
    },
    {
      title: 'Collaborative Learning App',
      description: 'Build a real-time app where users can study together.',
      skills: ['React', 'Socket.io', 'Node.js'],
      difficulty: 'advanced',
    },
  ],
  overallAssessment: reason,
  careerSuggestions: [
    'Try uploading a more text-rich PDF for better analysis',
    'Ensure your resume includes technical skills and project descriptions',
    'Consider adding a skills section to your resume',
  ],
});

module.exports = { analyzeResume };
