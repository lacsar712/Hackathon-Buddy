const User = require('../models/User');

// @route  GET /api/users/me
const getMe = async (req, res) => {
  res.json(req.user);
};

// @route  PUT /api/users/update
const updateProfile = async (req, res) => {
  try {
    const { name, bio, skills, interests, role, github, linkedin } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, bio, skills, interests, role, github, linkedin },
      { new: true, runValidators: true }
    ).select('-password');

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  GET /api/users/all
const getAllUsers = async (req, res) => {
  try {
    const { search, role, skill } = req.query;
    let filter = { _id: { $ne: req.user._id } };

    if (role) filter.role = role;
    if (skill) filter.skills = { $in: [new RegExp(skill, 'i')] };
    if (search) filter.name = { $regex: search, $options: 'i' };

    const users = await User.find(filter).select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  GET /api/users/:id
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getMe, updateProfile, getAllUsers, getUserById };
