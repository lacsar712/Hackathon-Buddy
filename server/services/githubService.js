const axios = require('axios');

const GITHUB_API_URL = 'https://api.github.com';

const getGithubClient = (accessToken) => {
  return axios.create({
    baseURL: GITHUB_API_URL,
    headers: {
      Authorization: `token ${accessToken}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });
};

const createRepo = async (accessToken, name, description) => {
  const client = getGithubClient(accessToken);
  const response = await client.post('/user/repos', {
    name,
    description,
    private: false,
  });
  return response.data;
};

const getRepoFiles = async (accessToken, owner, repo, path = '') => {
  const client = getGithubClient(accessToken);
  const response = await client.get(`/repos/${owner}/${repo}/contents/${path}`);
  return response.data;
};

const getFileContent = async (accessToken, owner, repo, path) => {
  const client = getGithubClient(accessToken);
  const response = await client.get(`/repos/${owner}/${repo}/contents/${path}`);
  return response.data;
};

const updateFile = async (accessToken, owner, repo, path, content, message, sha) => {
  const client = getGithubClient(accessToken);
  const response = await client.put(`/repos/${owner}/${repo}/contents/${path}`, {
    message,
    content: Buffer.from(content).toString('base64'),
    sha,
  });
  return response.data;
};

module.exports = {
  createRepo,
  getRepoFiles,
  getFileContent,
  updateFile,
};
