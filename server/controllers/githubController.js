const axios = require('axios');
const User = require('../models/User');
const Project = require('../models/Project');
const githubService = require('../services/githubService');

// @route GET /api/github/login
const githubLogin = (req, res) => {
  // Use state to pass userId to callback for linking
  const state = req.query.userId;
  const url = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&scope=repo,user&state=${state}`;
  res.redirect(url);
};

// @route GET /api/github/callback
const githubCallback = async (req, res) => {
  const { code, state } = req.query;
  try {
    const response = await axios.post('https://github.com/login/oauth/access_token', {
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
    }, {
      headers: { Accept: 'application/json' }
    });

    const accessToken = response.data.access_token;
    
    // Get user info from GitHub
    const userRes = await axios.get('https://api.github.com/user', {
      headers: { Authorization: `token ${accessToken}` }
    });

    // Update user in DB if state (userId) is provided
    if (state) {
      await User.findByIdAndUpdate(state, {
        githubId: userRes.data.id,
        githubAccessToken: accessToken,
        githubUsername: userRes.data.login
      });
    }
    
    res.send(`
      <script>
        window.opener.postMessage({ 
          type: 'GITHUB_AUTH_SUCCESS', 
          token: '${accessToken}', 
          username: '${userRes.data.login}' 
        }, '*');
        window.close();
      </script>
    `);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route POST /api/github/link-repo
const linkRepo = async (req, res) => {
  try {
    const { projectId, repoName, repoOwner, repoUrl } = req.body;
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    // Only creator can link repo
    if (project.createdBy.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    project.githubRepoName = repoName;
    project.githubRepoOwner = repoOwner;
    project.githubRepoUrl = repoUrl;
    await project.save();

    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route GET /api/github/files/:projectId
const getFiles = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project || !project.githubRepoName) {
      return res.status(404).json({ message: 'Project or Repo not found' });
    }

    const path = req.query.path || '';
    const files = await githubService.getRepoFiles(
      req.user.githubAccessToken, 
      project.githubRepoOwner, 
      project.githubRepoName, 
      path
    );

    res.json(files);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route GET /api/github/file-content/:projectId
const getFile = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    const path = req.query.path;
    const content = await githubService.getFileContent(
      req.user.githubAccessToken,
      project.githubRepoOwner,
      project.githubRepoName,
      path
    );
    res.json(content);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route PUT /api/github/update-file
const updateFile = async (req, res) => {
  try {
    const { projectId, path, content, message, sha } = req.body;
    const project = await Project.findById(projectId);
    
    const result = await githubService.updateFile(
      req.user.githubAccessToken,
      project.githubRepoOwner,
      project.githubRepoName,
      path,
      content,
      message,
      sha
    );
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { 
  githubLogin, 
  githubCallback, 
  linkRepo, 
  getFiles, 
  getFile, 
  updateFile 
};
