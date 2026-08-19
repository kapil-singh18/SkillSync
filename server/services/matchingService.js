const { generateContent } = require('./aiService');

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns the set intersection of two arrays (case-insensitive string compare).
 */
const intersect = (arrA = [], arrB = []) => {
  const setB = new Set(arrB.map((s) => s.toLowerCase()));
  return arrA.filter((s) => setB.has(s.toLowerCase()));
};

/**
 * Returns the count of overlapping availability slots (day + timeSlot).
 */
const availabilityOverlap = (availA = [], availB = []) => {
  const keyB = new Set(availB.map((a) => `${a.day}|${a.timeSlot}`));
  return availA.filter((a) => keyB.has(`${a.day}|${a.timeSlot}`)).length;
};

// ─── calculateMatchScore ──────────────────────────────────────────────────────

/**
 * Rule-based scoring:
 *   Skill overlap        40%
 *   Shared interests     30%
 *   Availability overlap 20%
 *   Complementary goals  10%
 *
 * Returns a number 0–100.
 */
const calculateMatchScore = (userA, userB) => {
  // ── Skill overlap (40%) ──
  const skillNamesA = (userA.skills || []).map((s) => s.name);
  const skillNamesB = (userB.skills || []).map((s) => s.name);
  const sharedSkills = intersect(skillNamesA, skillNamesB);
  const maxSkills = Math.max(skillNamesA.length + skillNamesB.length, 1);
  const skillScore = (sharedSkills.length * 2) / maxSkills; // 0–1

  // ── Shared interests (30%) ──
  const sharedInterests = intersect(userA.interests || [], userB.interests || []);
  const maxInterests = Math.max(
    (userA.interests || []).length + (userB.interests || []).length,
    1
  );
  const interestScore = (sharedInterests.length * 2) / maxInterests; // 0–1

  // ── Availability overlap (20%) ──
  const overlapCount = availabilityOverlap(
    userA.availability || [],
    userB.availability || []
  );
  const maxAvail = Math.max(
    (userA.availability || []).length + (userB.availability || []).length,
    1
  );
  const availScore = (overlapCount * 2) / maxAvail; // 0–1

  // ── Complementary learning goals (10%) ──
  // Score is higher if one user's learning goals overlap with the other's skills
  const aWantsWhatBKnows = intersect(
    userA.learningGoals || [],
    skillNamesB
  ).length;
  const bWantsWhatAKnows = intersect(
    userB.learningGoals || [],
    skillNamesA
  ).length;
  const maxGoals = Math.max(
    (userA.learningGoals || []).length + (userB.learningGoals || []).length,
    1
  );
  const goalScore = (aWantsWhatBKnows + bWantsWhatAKnows) / maxGoals; // 0–1

  const raw =
    skillScore * 0.4 +
    interestScore * 0.3 +
    availScore * 0.2 +
    goalScore * 0.1;

  return Math.round(Math.min(raw * 100, 100));
};

// ─── generateMatchExplanation ─────────────────────────────────────────────────

/**
 * Asks Gemini to write ONE short sentence (≤25 words) explaining the match.
 * Falls back to a template string if the AI call fails.
 */
const generateMatchExplanation = async (userA, userB, score) => {
  const sharedSkills = intersect(
    (userA.skills || []).map((s) => s.name),
    (userB.skills || []).map((s) => s.name)
  );
  const sharedInterests = intersect(
    userA.interests || [],
    userB.interests || []
  );

  // Fallback template
  const fallback = () => {
    if (sharedSkills.length > 0) {
      return `You both work with ${sharedSkills.slice(0, 2).join(' and ')}, making collaboration natural.`;
    }
    if (sharedInterests.length > 0) {
      return `Shared interest in ${sharedInterests.slice(0, 2).join(' and ')} creates a strong learning foundation.`;
    }
    return `Your complementary profiles suggest a strong potential for peer learning.`;
  };

  try {
    const prompt = `You are a study-match assistant. In ONE sentence of at most 25 words, explain why ${userA.name} and ${userB.name} would be a great study pair. Their shared skills: ${sharedSkills.join(', ') || 'none listed'}. Shared interests: ${sharedInterests.join(', ') || 'none listed'}. Match score: ${score}/100. Be specific and encouraging.`;

    const text = await generateContent(prompt);
    // Strip any trailing newlines/quotes and enforce length
    const cleaned = text.replace(/^["']|["']$/g, '').trim();
    return cleaned.length > 0 ? cleaned : fallback();
  } catch {
    return fallback();
  }
};

module.exports = { calculateMatchScore, generateMatchExplanation };
