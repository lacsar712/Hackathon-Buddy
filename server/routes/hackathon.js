const express = require('express');
const router = express.Router();
const {
  getAllHackathons,
  getDevpostHackathons,
  getDevfolioHackathons,
  getHackerEarthHackathons,
  getUnstopHackathons,
} = require('../controllers/hackathonController');

// GET /api/hackathons              → all platforms (supports ?platforms=devpost,devfolio)
router.get('/', getAllHackathons);

// GET /api/hackathons/devpost
router.get('/devpost', getDevpostHackathons);

// GET /api/hackathons/devfolio
router.get('/devfolio', getDevfolioHackathons);

// GET /api/hackathons/hackerearth
router.get('/hackerearth', getHackerEarthHackathons);

// GET /api/hackathons/unstop
router.get('/unstop', getUnstopHackathons);

module.exports = router;