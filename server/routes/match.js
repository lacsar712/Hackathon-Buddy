const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { matchUsers, matchProjects } = require('../controllers/matchController');

router.get('/users', protect, matchUsers);
router.get('/projects', protect, matchProjects);

module.exports = router;
