const { getTopMatches, recommendProjects } = require('../services/matchService');

// @route  GET /api/match/users
const matchUsers = async (req, res) => {
  try {
    const matches = await getTopMatches(req.user._id);
    res.json(matches);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  GET /api/match/projects
const matchProjects = async (req, res) => {
  try {
    const projects = await recommendProjects(req.user._id);
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { matchUsers, matchProjects };
