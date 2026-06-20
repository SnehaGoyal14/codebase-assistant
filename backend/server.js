const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const repoRoutes = require('./routes/repos');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/repos', repoRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Codebase Assistant Backend running!' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
