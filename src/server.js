import 'dotenv/config';
import express from 'express';

const API_KEY = process.env.GROQ_API_KEY;
const ENDPOINT = 'https://api.groq.ai/v1/query';
const port = process.env.PORT || 3000;

if (!API_KEY) {
  console.warn('Warning: GROQ_API_KEY is not set. Set it in .env or environment.');
}

async function runQuery(query) {
  try {
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
  } catch (err) {
    // If mock mode is enabled, return a fake response so the UI can be previewed
    if (process.env.MOCK_RESPONSE === '1') {
      console.warn('Groq API unreachable; returning mock response (MOCK_RESPONSE=1).', err.message || err);
      return {
        mock: true,
        note: 'Réponse factice car appel externe impossible depuis cet environnement',
        results: [
          { _id: 'mock1', title: 'Article exemple', body: 'Contenu factice pour la preview' },
        ],
      };
    }

    console.error('Error calling Groq API:', err);
    throw err;
  }
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

// New endpoint: search animal by name and return normalized fields
app.post('/animal', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).send('Missing name');

    // sanitize name for simple insertion (avoid newlines and quotes)
    const safeName = String(name).replace(/\"/g, '\\"').replace(/\n/g, ' ');

    // GROQ query: find an animal document by name (first match) and return common fields
    const groq = `*[_type == "animal" && name match "${safeName}" ]{name, species, size, weight, description, "image": image.asset->url}[0]`;

    const result = await runQuery(groq);
    // runQuery returns either a single object or an object with results depending on API
    // Normalize: if result has 'result' or 'results', handle accordingly
    if (!result) return res.status(404).send('No result');

    // If API returns {result: [...]} or {results: [...]}
    if (result.result && Array.isArray(result.result)) {
      return res.json(result.result[0] || {});
    }
    if (result.results && Array.isArray(result.results)) {
      return res.json(result.results[0] || {});
    }

    // If API returned object directly, send it
    return res.json(result);
  } catch (err) {
    // If mock mode is enabled, return a fake animal for preview
    if (process.env.MOCK_RESPONSE === '1') {
      return res.json({ mock: true, name: req.body.name || 'Exemple', species: 'Inconnue', description: 'Cet animal est un exemple.', image: { url: 'https://placekitten.com/800/600' } });
    }
    res.status(500).send(`Erreur: ${err.message}`);
  }
});

// New endpoint: call Groq's OpenAI-compatible Responses API
async function callGroqOpenAI(prompt, model = 'openai/gpt-oss-20b') {
  const base = 'https://api.groq.com/openai/v1/responses';
  const body = { model, input: prompt };
  const res = await fetch(base, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Groq OpenAI API HTTP ${res.status}: ${text}`);
  }

  return res.json();
}

app.post('/ai', async (req, res) => {
  try {
    const { prompt, model } = req.body;
    if (!prompt) return res.status(400).send('Missing prompt');

    const response = await callGroqOpenAI(prompt, model || 'openai/gpt-oss-20b');

    // Try to extract text output in common locations
    let output = null;
    if (response.output_text) output = response.output_text;
    else if (response.output && Array.isArray(response.output) && response.output[0] && response.output[0].content) {
      // content can be array of objects
      const parts = [];
      response.output[0].content.forEach((c) => {
        if (c?.text) parts.push(c.text);
        else if (typeof c === 'string') parts.push(c);
      });
      output = parts.join('');
    }

    return res.json({ raw: response, text: output });
  } catch (err) {
    console.error('AI endpoint error:', err);
    // If mock mode enabled, return a sample
    if (process.env.MOCK_RESPONSE === '1') {
      return res.json({ mock: true, text: 'Les modèles rapides permettent des interactions temps réel et réduisent la latence pour les applications.' });
    }
    res.status(500).send(`Erreur: ${err.message}`);
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
