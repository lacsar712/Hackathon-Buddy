const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getMe, updateProfile, getAllUsers, getUserById } = require('../controllers/userController');

router.get('/me', protect, getMe);
router.put('/update', protect, updateProfile);
router.get('/all', protect, getAllUsers);
router.get('/:id', protect, getUserById);

module.exports = router;
