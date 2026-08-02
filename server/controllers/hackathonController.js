const {
  fetchAllHackathons,
  fetchDevpost,
  fetchDevfolio,
  fetchHackerEarth,
  fetchUnstop,
} = require('../services/hackathonService');

// GET /api/hackathons
// Query param: ?platforms=devpost,devfolio,hackerearth,unstop
const getAllHackathons = async (req, res) => {
  try {
    const platforms = req.query.platforms
      ? req.query.platforms.split(',').map((p) => p.trim().toLowerCase())
      : ['devpost', 'devfolio', 'hackerearth', 'unstop'];

    const data = await fetchAllHackathons(platforms);
    res.json({ success: true, count: data.length, data });
  } catch (err) {
    console.error('[HackathonController] getAllHackathons error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to fetch hackathons' });
  }
};

// GET /api/hackathons/devpost
const getDevpostHackathons = async (req, res) => {
  try {
    const data = await fetchDevpost();
    res.json({ success: true, count: data.length, data });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch Devpost hackathons' });
  }
};

// GET /api/hackathons/devfolio
const getDevfolioHackathons = async (req, res) => {
  try {
    const data = await fetchDevfolio();
    res.json({ success: true, count: data.length, data });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch Devfolio hackathons' });
  }
};

// GET /api/hackathons/hackerearth
const getHackerEarthHackathons = async (req, res) => {
  try {
    const data = await fetchHackerEarth();
    res.json({ success: true, count: data.length, data });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch HackerEarth hackathons' });
  }
};

// GET /api/hackathons/unstop
const getUnstopHackathons = async (req, res) => {
  try {
    const data = await fetchUnstop();
    res.json({ success: true, count: data.length, data });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch Unstop hackathons' });
  }
};

module.exports = {
  getAllHackathons,
  getDevpostHackathons,
  getDevfolioHackathons,
  getHackerEarthHackathons,
  getUnstopHackathons,
};