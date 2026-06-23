const express = require('express');
const axios = require('axios');
const pool = require('../db/connection');
const authenticateToken = require('../middleware/auth');
const router = express.Router();

/**
 * GET /repos
 * Get all repos indexed by the logged in user
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, repo_url, repo_id, indexed_at FROM repos WHERE user_id = $1 ORDER BY indexed_at DESC',
      [req.user.id]
    );

    return res.status(200).json({
      success: true,
      repos: result.rows
    });
  } catch (err) {
    console.error('Get Repos Error:', err.message);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * POST /repos/index
 * Index a new repo by forwarding the request to the AI engine
 */
router.post('/index', authenticateToken, async (req, res) => {
  try {
    const repo_url = req.body.repo_url?.trim();
    const repo_id = req.body.repo_id?.trim();

    if (!repo_url || !repo_id) {
      return res.status(400).json({
        success: false,
        error: 'repo_url and repo_id are required'
      });
    }

    const fastapiResponse = await axios.post(`${process.env.FASTAPI_URL}/index`, {
      repo_url,
      repo_id
    });

const existingRepo = await pool.query(
      'SELECT id FROM repos WHERE user_id = $1 AND repo_id = $2',
      [req.user.id, repo_id]
    );

    if (existingRepo.rows.length > 0) {
      await pool.query(
        `UPDATE repos SET repo_url = $1, indexed_at = NOW()
         WHERE user_id = $2 AND repo_id = $3`,
        [repo_url, req.user.id, repo_id]
      );
    } else {
      await pool.query(
        `INSERT INTO repos (user_id, repo_url, repo_id)
         VALUES ($1, $2, $3)`,
        [req.user.id, repo_url, repo_id]
      );
    }

    return res.status(200).json({
      success: true,
      ...fastapiResponse.data
    });
  } catch (err) {
    console.error('Index Repo Error:', err.message);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * POST /repos/ask
 * Ask a question about a repo by forwarding the request to the AI engine
 */
router.post('/ask', authenticateToken, async (req, res) => {
  try {
    const repo_id = req.body.repo_id?.trim();
    const question = req.body.question?.trim();

    if (!repo_id || !question) {
      return res.status(400).json({
        success: false,
        error: 'repo_id and question are required'
      });
    }

    const fastapiResponse = await axios.post(`${process.env.FASTAPI_URL}/ask`, {
      repo_id,
      question
    });

    const { answer, diagram, sources } = fastapiResponse.data;

    await pool.query(
      `INSERT INTO conversations (user_id, repo_id, question, answer, diagram, sources)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [req.user.id, repo_id, question, answer, diagram, JSON.stringify(sources)]
    );

    return res.status(200).json({
      success: true,
      ...fastapiResponse.data
    });
  } catch (err) {
    console.error('Ask Error:', err.message);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * POST /repos/guide
 * Generate an onboarding guide for a repo by forwarding the request to the AI engine
 */
router.post('/guide', authenticateToken, async (req, res) => {
  try {
    const repo_id = req.body.repo_id?.trim();

    if (!repo_id) {
      return res.status(400).json({
        success: false,
        error: 'repo_id is required'
      });
    }

    const fastapiResponse = await axios.post(`${process.env.FASTAPI_URL}/guide`, {
      repo_id
    });

    return res.status(200).json({
      success: true,
      ...fastapiResponse.data
    });
  } catch (err) {
    console.error('Guide Error:', err.message);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

module.exports = router;