/**
 * tests/matchingService.test.js
 *
 * Node.js test script for matchingService pure scoring functions.
 * Run: node server/tests/matchingService.test.js
 */

const { calculatePeerScore, calculateMentorScore } = require('../services/matchingService');

let passed = 0;
let failed = 0;

const assert = (label, condition, detail) => {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ ${label}${detail ? ` — ${detail}` : ''}`);
    failed++;
  }
};

// ── Fixtures ─────────────────────────────────────────────────────────────────

const richStudent = {
  skills: [
    { name: 'React', level: 'advanced' },
    { name: 'JavaScript', level: 'advanced' },
    { name: 'Node.js', level: 'intermediate' },
  ],
  interests: ['Web Development', 'Open Source', 'UI/UX'],
  learningGoals: ['TypeScript', 'System Design'],
  availability: [
    { day: 'Mon', slot: 'evening' },
    { day: 'Wed', slot: 'evening' },
    { day: 'Sat', slot: 'morning' },
  ],
};

const identicalStudent = JSON.parse(JSON.stringify(richStudent));

const disjointStudent = {
  skills: [{ name: 'Rust', level: 'beginner' }, { name: 'Go', level: 'beginner' }],
  interests: ['Embedded Systems', 'Robotics'],
  learningGoals: ['Kubernetes', 'Assembly'],
  availability: [{ day: 'Tue', slot: 'night' }],
};

const emptyStudent = {
  skills: [],
  interests: [],
  learningGoals: [],
  availability: [],
};

const richMentor = {
  role: 'mentor',
  skills: [
    { name: 'React', level: 'advanced' },
    { name: 'TypeScript', level: 'advanced' },
    { name: 'System Design', level: 'advanced' },
  ],
  interests: ['Web Development', 'Open Source'],
  learningGoals: [],
  availability: [
    { day: 'Mon', slot: 'evening' },
    { day: 'Sat', slot: 'morning' },
  ],
  mentorProfile: {
    expertise: ['React', 'TypeScript', 'System Design', 'Node.js'],
    yearsOfExperience: 8,
    acceptingMentees: true,
  },
};

// ── Peer tests ────────────────────────────────────────────────────────────────

console.log('\n── calculatePeerScore ──────────────────────────────────────────');

{
  const result = calculatePeerScore(richStudent, identicalStudent);
  console.log('\n  Identical profiles:');
  assert('score > 60 (high match)', result.score > 60, `got ${result.score}`);
  assert('score <= 100', result.score <= 100);
  assert('sharedSkills non-empty', result.sharedSkills.length > 0);
  assert('sharedInterests non-empty', result.sharedInterests.length > 0);
  assert('overlappingSlots > 0', result.overlappingSlots > 0);
  assert('breakdown sums to score (±2 rounding)', Math.abs(
    Object.values(result.breakdown).reduce((a, b) => a + b, 0) - result.score
  ) <= 2, JSON.stringify(result.breakdown));
}

{
  const result = calculatePeerScore(richStudent, disjointStudent);
  console.log('\n  Disjoint profiles:');
  assert('score < 20 (low match)', result.score < 20, `got ${result.score}`);
  assert('sharedSkills empty', result.sharedSkills.length === 0);
  assert('overlappingSlots === 0', result.overlappingSlots === 0);
}

{
  const result = calculatePeerScore(emptyStudent, emptyStudent);
  console.log('\n  Both profiles empty:');
  assert('score === 0', result.score === 0, `got ${result.score}`);
  assert('no NaN in breakdown', Object.values(result.breakdown).every((v) => !isNaN(v)));
  assert('no NaN in score', !isNaN(result.score));
  assert('sharedSkills is array', Array.isArray(result.sharedSkills));
  assert('sharedInterests is array', Array.isArray(result.sharedInterests));
  assert('overlappingSlots === 0', result.overlappingSlots === 0);
}

{
  const result = calculatePeerScore(emptyStudent, richStudent);
  console.log('\n  Me empty, other rich:');
  assert('score === 0 (no shared content)', result.score === 0, `got ${result.score}`);
  assert('no NaN', !isNaN(result.score));
}

// ── Mentor tests ───────────────────────────────────────────────────────────────

console.log('\n── calculateMentorScore ────────────────────────────────────────');

{
  const result = calculateMentorScore(richStudent, richMentor);
  console.log('\n  Strong mentor match (mentor covers my goals):');
  assert('score > 50 (strong match)', result.score > 50, `got ${result.score}`);
  assert('score <= 100', result.score <= 100);
  assert('canTeachMe non-empty', result.canTeachMe.length > 0);
  assert('breakdown has expertiseMatch', 'expertiseMatch' in result.breakdown);
  assert('breakdown has experience', 'experience' in result.breakdown);
  assert('no NaN in breakdown', Object.values(result.breakdown).every((v) => !isNaN(v)));
}

{
  const result = calculateMentorScore(emptyStudent, richMentor);
  console.log('\n  Empty student, rich mentor:');
  assert('score 0-100 range', result.score >= 0 && result.score <= 100, `got ${result.score}`);
  assert('no crash', true);
}

{
  const emptyMentor = { role: 'mentor', skills: [], interests: [], learningGoals: [], availability: [], mentorProfile: { expertise: [], yearsOfExperience: 0 } };
  const result = calculateMentorScore(emptyStudent, emptyMentor);
  console.log('\n  Both empty:');
  assert('score === 0', result.score === 0, `got ${result.score}`);
  assert('no NaN', !isNaN(result.score));
}

// ── Summary ────────────────────────────────────────────────────────────────────

console.log(`\n═══════════════════════════════════════════════════════════════`);
console.log(`  Results: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
