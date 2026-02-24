import 'dotenv/config';
import express from 'express';

const API_KEY = process.env.GROQ_API_KEY;
const ENDPOINT = 'https://api.groq.ai/v1/query';
const port = process.env.PORT || 3000;

if (!API_KEY) {
  console.warn('Warning: GROQ_API_KEY is not set. Set it in .env or environment.');
}

async function runQuery(query) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({ query }),
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  }

  return res.json();
}

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve the static frontend from /public
app.use(express.static('public'));

app.post('/query', async (req, res) => {
  try {
    const { query } = req.body;
    const result = await runQuery(query);
    res.json(result);
  } catch (err) {
    res.status(500).send(`Erreur: ${err.message}`);
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
