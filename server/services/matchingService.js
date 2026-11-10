/**
 * services/matchingService.js
 *
 * PURE scoring functions — no DB calls, no AI calls, no side effects.
 * All inputs are plain JS objects (lean Mongoose documents or equivalent).
 *
 * Weights are documented per function.
 */

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Normalize a string for comparison: trim + lowercase. */
const norm = (s) => (typeof s === 'string' ? s.trim().toLowerCase() : '');

/** Normalize an array of strings. */
const normArr = (arr) => (Array.isArray(arr) ? arr.map(norm).filter(Boolean) : []);

/** Normalize a skills array → array of lowercase name strings. */
const normSkillNames = (skills) =>
  Array.isArray(skills) ? skills.map((s) => norm(s.name)).filter(Boolean) : [];

/** Intersection of two arrays (string values). */
const intersect = (a, b) => {
  const setB = new Set(b);
  return a.filter((x) => setB.has(x));
};

/** Cap a value between 0 and max. */
const cap = (val, max) => Math.min(val, max);

/**
 * Safe division — returns 0 if denominator is 0.
 * @param {number} num
 * @param {number} den
 */
const safeDivide = (num, den) => (den === 0 ? 0 : num / den);

// ── Peer Scoring ──────────────────────────────────────────────────────────────

/**
 * calculatePeerScore(me, other)
 *
 * Weights (sum = 100):
 *   sharedSkills        30%  — skills that appear in both profiles
 *   complementaryFit    25%  — their skills matching my goals + my skills matching their goals
 *   sharedInterests     25%  — interests that appear in both profiles
 *   availabilityOverlap 20%  — overlapping day+slot pairs, capped at 5 for full marks
 *
 * @param {object} me    - lean User document (the authenticated user)
 * @param {object} other - lean User document (the candidate)
 * @returns {{ score: number, breakdown: object, sharedSkills: string[],
 *             sharedInterests: string[], overlappingSlots: number, canTeachMe: string[] }}
 */
const calculatePeerScore = (me, other) => {
  // Normalised skill name sets
  const mySkills = normSkillNames(me.skills);
  const otherSkills = normSkillNames(other.skills);

  // Normalised interest sets
  const myInterests = normArr(me.interests);
  const otherInterests = normArr(other.interests);

  // Normalised goal sets
  const myGoals = normArr(me.learningGoals);
  const otherGoals = normArr(other.learningGoals);

  // Availability: set of "day|slot" strings
  const mySlots = new Set(
    (me.availability || []).map((a) => `${norm(a.day)}|${norm(a.slot)}`)
  );
  const otherSlotsArr = (other.availability || []).map(
    (a) => `${norm(a.day)}|${norm(a.slot)}`
  );

  // ── Shared skills (30%) ───────────────────────────────────────────────────
  const sharedSkillNames = intersect(mySkills, otherSkills);
  const totalUniqueSkills = new Set([...mySkills, ...otherSkills]).size;
  // Jaccard-style: shared / union, full marks when >= 3 shared
  const sharedSkillsRaw = cap(sharedSkillNames.length, 3);
  const skillScore = safeDivide(sharedSkillsRaw, 3) * 30;

  // ── Complementary fit (25%) ───────────────────────────────────────────────
  // Their skills matching my goals (can they help me?)
  const canTeachMe = intersect(otherSkills, myGoals);
  // My skills matching their goals (can I help them?)
  const canTeachThem = intersect(mySkills, otherGoals);
  const compTotal = canTeachMe.length + canTeachThem.length;
  const compRaw = cap(compTotal, 4);
  const compScore = safeDivide(compRaw, 4) * 25;

  // ── Shared interests (25%) ────────────────────────────────────────────────
  const sharedInterestNames = intersect(myInterests, otherInterests);
  const sharedInterestRaw = cap(sharedInterestNames.length, 3);
  const interestScore = safeDivide(sharedInterestRaw, 3) * 25;

  // ── Availability overlap (20%) ────────────────────────────────────────────
  const overlappingSlots = otherSlotsArr.filter((s) => mySlots.has(s)).length;
  const availRaw = cap(overlappingSlots, 5);
  const availScore = safeDivide(availRaw, 5) * 20;

  const score = Math.round(skillScore + compScore + interestScore + availScore);

  return {
    score: Math.min(score, 100),
    breakdown: {
      sharedSkills: Math.round(skillScore),
      complementaryFit: Math.round(compScore),
      sharedInterests: Math.round(interestScore),
      availabilityOverlap: Math.round(availScore),
    },
    sharedSkills: sharedSkillNames,
    sharedInterests: sharedInterestNames,
    overlappingSlots,
    canTeachMe,
  };
};

// ── Mentor Scoring ────────────────────────────────────────────────────────────

/**
 * calculateMentorScore(me, mentor)
 *
 * Weights (sum = 100):
 *   expertiseMatch      50%  — mentor expertise/skills vs my learningGoals and skills
 *   sharedInterests     20%  — shared interests
 *   availabilityOverlap 20%  — overlapping day+slot pairs, capped at 5
 *   experience          10%  — yearsOfExperience, capped at 5 for full marks
 *
 * @param {object} me     - lean User document (the authenticated user)
 * @param {object} mentor - lean User document (the mentor candidate)
 * @returns {{ score: number, breakdown: object, sharedSkills: string[],
 *             sharedInterests: string[], overlappingSlots: number, canTeachMe: string[] }}
 */
const calculateMentorScore = (me, mentor) => {
  const mySkills = normSkillNames(me.skills);
  const myGoals = normArr(me.learningGoals);
  const myInterests = normArr(me.interests);

  const mentorSkills = normSkillNames(mentor.skills);
  const mentorExpertise = normArr((mentor.mentorProfile || {}).expertise);
  const mentorInterests = normArr(mentor.interests);

  // Combined mentor knowledge base
  const mentorKnowledge = [...new Set([...mentorSkills, ...mentorExpertise])];

  // Availability
  const mySlots = new Set(
    (me.availability || []).map((a) => `${norm(a.day)}|${norm(a.slot)}`)
  );
  const mentorSlotsArr = (mentor.availability || []).map(
    (a) => `${norm(a.day)}|${norm(a.slot)}`
  );

  // ── Expertise match (50%) — mentor knowledge vs my goals and skills ───────
  const canTeachGoals = intersect(mentorKnowledge, myGoals);
  const canTeachSkills = intersect(mentorKnowledge, mySkills); // complements
  const canTeachMe = [...new Set([...canTeachGoals, ...canTeachSkills])];
  const expertiseRaw = cap(canTeachMe.length, 5);
  const expertiseScore = safeDivide(expertiseRaw, 5) * 50;

  // "Shared skills" for display = mentor knowledge ∩ my skills
  const sharedSkillNames = intersect(mySkills, mentorKnowledge);

  // ── Shared interests (20%) ────────────────────────────────────────────────
  const sharedInterestNames = intersect(myInterests, mentorInterests);
  const interestRaw = cap(sharedInterestNames.length, 3);
  const interestScore = safeDivide(interestRaw, 3) * 20;

  // ── Availability overlap (20%) ────────────────────────────────────────────
  const overlappingSlots = mentorSlotsArr.filter((s) => mySlots.has(s)).length;
  const availRaw = cap(overlappingSlots, 5);
  const availScore = safeDivide(availRaw, 5) * 20;

  // ── Experience (10%) — capped at 5 years for full marks ──────────────────
  const years = Number((mentor.mentorProfile || {}).yearsOfExperience) || 0;
  const expRaw = cap(years, 5);
  const expScore = safeDivide(expRaw, 5) * 10;

  const score = Math.round(expertiseScore + interestScore + availScore + expScore);

  return {
    score: Math.min(score, 100),
    breakdown: {
      expertiseMatch: Math.round(expertiseScore),
      sharedInterests: Math.round(interestScore),
      availabilityOverlap: Math.round(availScore),
      experience: Math.round(expScore),
    },
    sharedSkills: sharedSkillNames,
    sharedInterests: sharedInterestNames,
    overlappingSlots,
    canTeachMe,
  };
};

module.exports = { calculatePeerScore, calculateMentorScore };

