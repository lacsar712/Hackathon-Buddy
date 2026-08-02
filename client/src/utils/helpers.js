// Parse comma-separated string into array of trimmed strings
export const parseTagInput = (str) =>
  str.split(',').map((s) => s.trim()).filter(Boolean);

// Format date nicely
export const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

// Get initials from a name (for avatar fallback)
export const getInitials = (name = '') =>
  name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

// Score bar color based on value
export const scoreColor = (score) => {
  if (score >= 70) return 'bg-hb-success';
  if (score >= 40) return 'bg-yellow-500';
  return 'bg-red-500';
};

// Available options for dropdowns
export const ROLES = ['Frontend', 'Backend', 'Full Stack', 'Designer', 'ML Engineer', 'DevOps'];
export const SKILL_SUGGESTIONS = [
  'React', 'Vue', 'Angular', 'Node.js', 'Express', 'Python', 'Django', 'Flask',
  'MongoDB', 'PostgreSQL', 'MySQL', 'GraphQL', 'TypeScript', 'JavaScript',
  'Machine Learning', 'TensorFlow', 'PyTorch', 'Solidity', 'Web3', 'Docker',
  'Kubernetes', 'AWS', 'Firebase', 'Figma', 'UI/UX', 'Swift', 'Kotlin',
];
export const INTEREST_SUGGESTIONS = [
  'AI/ML', 'Web3', 'Blockchain', 'Healthcare', 'EdTech', 'FinTech',
  'Climate', 'Gaming', 'AR/VR', 'Social Impact', 'Productivity', 'Open Source',
];
