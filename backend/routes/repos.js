const express = require('express');
const axios = require('axios');
const pool = require('../db/connection');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

// GET /repos
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, repo_url, repo_id, indexed_at FROM repos WHERE user_id = $1 ORDER BY indexed_at DESC',
      [req.user.id]
    );
    return res.status(200).json({ success: true, repos: result.rows });
  } catch (err) {
    console.error('Get Repos Error:', err.message);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /repos/index
router.post('/index', authenticateToken, async (req, res) => {
  try {
    const repo_url = req.body.repo_url?.trim();
    const repo_id = req.body.repo_id?.trim();
    if (!repo_url || !repo_id) {
      return res.status(400).json({ success: false, error: 'repo_url and repo_id are required' });
    }
    const fastapiResponse = await axios.post(`${process.env.FASTAPI_URL}/index`, { repo_url, repo_id });
    const existing = await pool.query(
      'SELECT id FROM repos WHERE user_id = $1 AND repo_id = $2',
      [req.user.id, repo_id]
    );
    if (existing.rows.length === 0) {
      await pool.query(
        'INSERT INTO repos (user_id, repo_url, repo_id) VALUES ($1, $2, $3)',
        [req.user.id, repo_url, repo_id]
      );
    }
    return res.status(200).json({ success: true, ...fastapiResponse.data });
  } catch (err) {
    console.error('Index Repo Error:', err.message);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /repos/ask
router.post('/ask', authenticateToken, async (req, res) => {
  try {
    const repo_id = req.body.repo_id?.trim();
    const question = req.body.question?.trim();
    if (!repo_id || !question) {
      return res.status(400).json({ success: false, error: 'repo_id and question are required' });
    }
    const fastapiResponse = await axios.post(`${process.env.FASTAPI_URL}/ask`, { repo_id, question });
    const { answer, diagram, sources } = fastapiResponse.data;
    await pool.query(
      'INSERT INTO conversations (user_id, repo_id, question, answer, diagram, sources) VALUES ($1, $2, $3, $4, $5, $6)',
      [req.user.id, repo_id, question, answer, diagram, JSON.stringify(sources)]
    );
    return res.status(200).json({ success: true, ...fastapiResponse.data });
  } catch (err) {
    console.error('Ask Error:', err.message);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /repos/guide
router.post('/guide', authenticateToken, async (req, res) => {
  try {
    const repo_id = req.body.repo_id?.trim();
    if (!repo_id) {
      return res.status(400).json({ success: false, error: 'repo_id is required' });
    }
    const fastapiResponse = await axios.post(`${process.env.FASTAPI_URL}/guide`, { repo_id });
    return res.status(200).json({ success: true, ...fastapiResponse.data });
  } catch (err) {
    console.error('Guide Error:', err.message);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /repos/graph
router.post('/graph', authenticateToken, async (req, res) => {
  try {
    const repo_url = req.body.repo_url?.trim();
    const repo_id = req.body.repo_id?.trim();
    if (!repo_url || !repo_id) {
      return res.status(400).json({ success: false, error: 'repo_url and repo_id are required' });
    }
    const fastapiResponse = await axios.post(`${process.env.FASTAPI_URL}/graph`, { repo_url, repo_id });
    return res.status(200).json({ success: true, ...fastapiResponse.data });
  } catch (err) {
    console.error('Graph Error:', err.message);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /repos/history/:repo_id
router.get('/history/:repo_id', authenticateToken, async (req, res) => {
  try {
    const { repo_id } = req.params;
    const result = await pool.query(
      'SELECT id, question, answer, diagram, sources, created_at FROM conversations WHERE user_id = $1 AND repo_id = $2 ORDER BY created_at ASC',
      [req.user.id, repo_id]
    );
    const history = result.rows.map(row => ({
      ...row,
      sources: Array.isArray(row.sources) ? row.sources : JSON.parse(row.sources || '[]')
    }));
    return res.status(200).json({ success: true, history });
  } catch (err) {
    console.error('History Error:', err.message);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

module.exports = router;
