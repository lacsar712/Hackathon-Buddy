const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { 
  githubLogin, 
  githubCallback, 
  linkRepo, 
  getFiles, 
  getFile, 
  updateFile 
} = require('../controllers/githubController');

router.get('/login', githubLogin);
router.get('/callback', githubCallback);
router.post('/link-repo', protect, linkRepo);
router.get('/files/:projectId', protect, getFiles);
router.get('/file-content/:projectId', protect, getFile);
router.put('/update-file', protect, updateFile);

module.exports = router;
