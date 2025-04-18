const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const CLAUDE_API_URL = process.env.VITE_CLAUDE_API_URL || 'https://api.anthropic.com/v1/messages';
const CLAUDE_API_KEY = process.env.VITE_CLAUDE_API_KEY;
const CLAUDE_API_MODEL = process.env.VITE_CLAUDE_API_MODEL || 'claude-3-haiku-20240307';

app.post('/api/messages', async (req, res) => {
  try {
    const { messages, max_tokens, model } = req.body;
    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: model || CLAUDE_API_MODEL,
        max_tokens: max_tokens || 1024,
        messages,
      }),
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Proxy server listening on http://localhost:${PORT}`);
}); 