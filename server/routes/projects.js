const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { 
  createProject, 
  getProjects, 
  joinProject, 
  leaveProject, 
  getMyProjects,
  approveJoinRequest,
  rejectJoinRequest
} = require('../controllers/projectController');

router.post('/', protect, createProject);
router.get('/', protect, getProjects);
router.get('/my', protect, getMyProjects);
router.post('/join/:id', protect, joinProject);
router.post('/leave/:id', protect, leaveProject);
router.post('/approve/:id/:userId', protect, approveJoinRequest);
router.post('/reject/:id/:userId', protect, rejectJoinRequest);

module.exports = router;
