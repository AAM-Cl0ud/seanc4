import readline from 'readline';

// key must be provided via environment variable
const API_KEY = process.env.GROQ_API_KEY;
const ENDPOINT = 'https://api.groq.ai/v1/query';

if (!API_KEY) {
  console.warn('Warning: GROQ_API_KEY not set. Set it in environment to run queries.');
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

function prompt(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => rl.question(question, (ans) => {
    rl.close();
    resolve(ans);
  }));
}

(async () => {
  try {
    const query = await prompt('Entrez votre requête GROQ : ');
    const result = await runQuery(query);
    console.log('Résultat:', JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('Erreur lors de la requête :', err.message);
  }
})();
