
// POST /repos/graph
router.post('/graph', authenticateToken, async (req, res) => {
  try {
    const repo_url = req.body.repo_url?.trim();
    const repo_id = req.body.repo_id?.trim();
    if (!repo_url || !repo_id) {
      return res.status(400).json({
        success: false,
        error: 'repo_url and repo_id are required'
      });
    }
    const fastapiResponse = await axios.post(`${process.env.FASTAPI_URL}/graph`, {
      repo_url,
      repo_id
    });
    return res.status(200).json({
      success: true,
      ...fastapiResponse.data
    });
  } catch (err) {
    console.error('Graph Error:', err.message);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// GET /repos/history/:repo_id
router.get('/history/:repo_id', authenticateToken, async (req, res) => {
  try {
    const { repo_id } = req.params;
    const result = await pool.query(
      `SELECT id, question, answer, diagram, sources, created_at
       FROM conversations
       WHERE user_id = $1 AND repo_id = $2
       ORDER BY created_at ASC`,
      [req.user.id, repo_id]
    );
    const history = result.rows.map(row => ({
      ...row,
      sources: Array.isArray(row.sources) ? row.sources : JSON.parse(row.sources || '[]')
    }));
    return res.status(200).json({
      success: true,
      history
    });
  } catch (err) {
    console.error('History Error:', err.message);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});
module.exports = router;
