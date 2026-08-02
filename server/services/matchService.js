/**
 * matchService.js
 * ================
 * Core intelligent matching logic for Hackathon Buddy.
 *
 * Scoring weights:
 *   - Skills match    → 50%
 *   - Interests match → 30%
 *   - Role compat     → 20%
 *
 * Uses intersection-based scoring (simple & fast for MVP).
 * Can be upgraded to cosine similarity with TF-IDF vectors later.
 */

const User = require('../models/User');
const Project = require('../models/Project');

// --- Helper: count overlapping items between two arrays (case-insensitive) ---
const countOverlap = (arrA = [], arrB = []) => {
  const setB = new Set(arrB.map((x) => x.toLowerCase()));
  return arrA.filter((x) => setB.has(x.toLowerCase())).length;
};

// --- Helper: Jaccard similarity between two arrays ---
const jaccardScore = (arrA = [], arrB = []) => {
  if (!arrA.length && !arrB.length) return 0;
  const setA = new Set(arrA.map((x) => x.toLowerCase()));
  const setB = new Set(arrB.map((x) => x.toLowerCase()));
  const intersection = [...setA].filter((x) => setB.has(x)).length;
  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : intersection / union;
};

// --- Role Compatibility Map ---
// Defines how well roles complement each other (0 = no value, 1 = perfect complement)
const ROLE_COMPAT = {
  Frontend: { Backend: 1, 'ML Engineer': 0.8, Designer: 0.9, 'Full Stack': 0.7, Frontend: 0.3 },
  Backend: { Frontend: 1, 'ML Engineer': 0.9, Designer: 0.7, 'Full Stack': 0.7, Backend: 0.3 },
  Designer: { Frontend: 0.9, Backend: 0.7, 'ML Engineer': 0.6, 'Full Stack': 0.8, Designer: 0.3 },
  'ML Engineer': { Backend: 0.9, Frontend: 0.8, Designer: 0.6, 'Full Stack': 0.7, 'ML Engineer': 0.4 },
  'Full Stack': { Designer: 0.8, 'ML Engineer': 0.7, Frontend: 0.7, Backend: 0.7, 'Full Stack': 0.5 },
};

/**
 * calculateMatchScore(userA, userB)
 * -----------------------------------
 * Returns a score (0–100) representing how well userA and userB match.
 */
const calculateMatchScore = (userA, userB) => {
  // 1. Skills score (50%) — Jaccard similarity
  const skillScore = jaccardScore(userA.skills, userB.skills) * 50;

  // 2. Interests score (30%) — Jaccard similarity
  const interestScore = jaccardScore(userA.interests, userB.interests) * 30;

  // 3. Role compatibility score (20%)
  const roleA = userA.role || 'Full Stack';
  const roleB = userB.role || 'Full Stack';
  const roleCompat = ROLE_COMPAT[roleA]?.[roleB] ?? 0.5;
  const roleScore = roleCompat * 20;

  const total = skillScore + interestScore + roleScore;

  return {
    score: Math.round(total * 10) / 10, // round to 1 decimal
    breakdown: {
      skills: Math.round(skillScore * 10) / 10,
      interests: Math.round(interestScore * 10) / 10,
      role: Math.round(roleScore * 10) / 10,
    },
    sharedSkills: (userA.skills || []).filter((s) =>
      (userB.skills || []).map((x) => x.toLowerCase()).includes(s.toLowerCase())
    ),
    sharedInterests: (userA.interests || []).filter((i) =>
      (userB.interests || []).map((x) => x.toLowerCase()).includes(i.toLowerCase())
    ),
  };
};

/**
 * getTopMatches(userId)
 * ----------------------
 * Returns top 5 best-matching users for the given userId.
 */
const getTopMatches = async (userId) => {
  const currentUser = await User.findById(userId);
  if (!currentUser) throw new Error('User not found');

  // Get all other users
  const allUsers = await User.find({ _id: { $ne: userId } }).select('-password');

  // Calculate scores
  const scored = allUsers.map((user) => {
    const matchData = calculateMatchScore(currentUser, user);
    return { user, ...matchData };
  });

  // Sort by score descending, return top 5
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
};

/**
 * calculateProjectScore(user, project)
 * -------------------------------------
 * Returns match data for a single project against a user.
 */
const calculateProjectScore = (user, project) => {
  // Score based on required skills match (60%)
  const skillMatch = jaccardScore(user.skills, project.requiredSkills) * 60;

  // Score based on interest/domain match (40%)
  const interestMatch = jaccardScore(user.interests, project.interests) * 40;

  const score = Math.round((skillMatch + interestMatch) * 10) / 10;
  const matchedSkills = (user.skills || []).filter((s) =>
    (project.requiredSkills || []).map((x) => x.toLowerCase()).includes(s.toLowerCase())
  );

  return { score, matchedSkills };
};

/**
 * recommendProjects(userId)
 * --------------------------
 * Returns top 5 recommended projects based on user's skills + interests.
 */
const recommendProjects = async (userId) => {
  const currentUser = await User.findById(userId);
  if (!currentUser) throw new Error('User not found');

  // Projects the user hasn't created and hasn't joined
  const projects = await Project.find({
    createdBy: { $ne: userId },
    teamMembers: { $nin: [userId] },
  }).populate('createdBy', 'name role');

  const scored = projects.map((project) => {
    const { score, matchedSkills } = calculateProjectScore(currentUser, project);
    return { project, score, matchedSkills };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
};

module.exports = { calculateMatchScore, getTopMatches, recommendProjects, calculateProjectScore };
