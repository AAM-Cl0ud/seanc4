import 'dotenv/config';
import express from 'express';

const API_KEY = process.env.GROQ_API_KEY;
const ENDPOINT = 'https://api.groq.ai/v1/query';
const port = process.env.PORT || 3000;

const animalSearchQueries = {
  'chat': { api: 'cat', query: null },
  'chien': { api: 'dog', query: null },
  'lion': { api: 'wikimedia', query: 'Panthera leo lion' },
  'elephant': { api: 'wikimedia', query: 'African elephant Loxodonta africana' },
  'tigre': { api: 'wikimedia', query: 'Tiger Panthera tigris' },
  'ours': { api: 'wikimedia', query: 'Brown bear Ursus arctos' },
  'girafe': { api: 'wikimedia', query: 'Giraffe camelopardalis' },
  'zebre': { api: 'wikimedia', query: 'Zebra Equus quagga' },
  'hippopotame': { api: 'wikimedia', query: 'Hippopotamus amphibius' },
  'crocodile': { api: 'wikimedia', query: 'Crocodile Nile' },
  'singe': { api: 'wikimedia', query: 'Primate chimpanzee monkey' },
  'leopard': { api: 'wikimedia', query: 'Leopard Panthera pardus' },
  'panthere': { api: 'wikimedia', query: 'Black panther leopard' },
  'rhinoceros': { api: 'wikimedia', query: 'Rhinoceros African' },
  'antilope': { api: 'wikimedia', query: 'Antelope wildebeest gnu' },
  'buffle': { api: 'wikimedia', query: 'African buffalo' },
  'hyene': { api: 'wikimedia', query: 'Hyena crocuta' },
  'autruche': { api: 'wikimedia', query: 'Ostrich African bird' },
  'serpent': { api: 'wikimedia', query: 'Snake python cobra' },
  'python': { api: 'wikimedia', query: 'Python snake' }
};

async function getAnimalImage(animalType) {
  try {
    const animalKey = animalType.toLowerCase().trim();
    const config = animalSearchQueries[animalKey];
    
    if (!config) {
      // Unknown animal - try generic search
      return await fetchWikimediaImage(animalType);
    }
    
    if (config.api === 'cat') {
      const res = await fetch('https://api.thecatapi.com/v1/images/search');
      const data = await res.json();
      if (data && data[0] && data[0].url) return data[0].url;
    } else if (config.api === 'dog') {
      const res = await fetch('https://dog.ceo/api/breeds/image/random');
      const data = await res.json();
      if (data && data.message) return data.message;
    }
    
    if (config.query) {
      return await fetchWikimediaImage(config.query);
    }
  } catch (err) {
    console.warn('Could not fetch animal image:', err.message);
  }
  
  return generateAnimalSVG(animalType);
}

async function fetchWikimediaImage(searchQuery) {
  try {
    const wikiRes = await fetch(`https://commons.wikimedia.org/w/api.php?action=query&format=json&list=search&srsearch=${encodeURIComponent(searchQuery)}&srnamespace=6&srlimit=10&srsort=relevance`);
    const wikiData = await wikiRes.json();
    
    if (wikiData.query && wikiData.query.search && wikiData.query.search.length > 0) {
      // Try to find a good quality image (prefer jpg/png, avoid thumbnails)
      for (const result of wikiData.query.search.slice(0, 5)) {
        const title = result.title;
        if (title.includes('.jpg') || title.includes('.png') || title.includes('.jpeg')) {
          const imgRes = await fetch(`https://commons.wikimedia.org/w/api.php?action=query&format=json&titles=${encodeURIComponent(title)}&prop=imageinfo&iiprop=url`);
          const imgData = await imgRes.json();
          
          const pages = imgData.query.pages;
          for (const page of Object.values(pages)) {
            if (page.imageinfo && page.imageinfo[0] && page.imageinfo[0].url) {
              const url = page.imageinfo[0].url;
              // Prefer larger images (width > 300px recommended)
              if (url && (url.includes('wikipedia') || url.includes('wikimedia'))) {
                return url;
              }
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn('Wikimedia fetch error:', err.message);
  }
  
  return null;
}

function generateAnimalSVG(animalName) {
  const animals = {
    'chat': { color: '#FF6B6B', emoji: '🐱', name: 'Chat' },
    'chien': { color: '#4ECDC4', emoji: '🐕', name: 'Chien' },
    'lion': { color: '#FFD93D', emoji: '🦁', name: 'Lion' },
    'elephant': { color: '#95A5A6', emoji: '🐘', name: 'Éléphant' },
    'tigre': { color: '#FF8C00', emoji: '🐯', name: 'Tigre' },
    'ours': { color: '#8B4513', emoji: '🐻', name: 'Ours' },
    'girafe': { color: '#D4A574', emoji: '🦒', name: 'Girafe' },
    'zebre': { color: '#2C3E50', emoji: '🦓', name: 'Zèbre' },
    'hippopotame': { color: '#6C5B7B', emoji: '🦛', name: 'Hippopotame' },
    'crocodile': { color: '#27AE60', emoji: '🐊', name: 'Crocodile' },
    'singe': { color: '#8B6F47', emoji: '🐵', name: 'Singe' },
    'leopard': { color: '#B8860B', emoji: '🐆', name: 'Léopard' },
    'panthere': { color: '#1A1A1A', emoji: '🐆', name: 'Panthère' },
    'rhinoceros': { color: '#696969', emoji: '🦏', name: 'Rhinocéros' },
    'antilope': { color: '#A0826D', emoji: '🦌', name: 'Antilope' },
    'buffle': { color: '#654321', emoji: '🐃', name: 'Buffle' },
    'hyene': { color: '#8B7355', emoji: '🦒', name: 'Hyène' },
    'autruche': { color: '#8B7355', emoji: '🦅', name: 'Autruche' },
    'serpent': { color: '#4A7C59', emoji: '🐍', name: 'Serpent' },
    'python': { color: '#2F5233', emoji: '🐍', name: 'Python' }
  };
  
  const animalKey = animalName.toLowerCase();
  const animal = animals[animalKey] || {
    color: '#667eea',
    emoji: '🐾',
    name: animalName
  };
  
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${animal.color};stop-opacity:0.15" />
        <stop offset="100%" style="stop-color:${animal.color};stop-opacity:0.05" />
      </linearGradient>
    </defs>
    <rect width="600" height="400" fill="url(#bgGrad)"/>
    <circle cx="300" cy="180" r="90" fill="${animal.color}" opacity="0.4"/>
    <circle cx="300" cy="150" r="70" fill="${animal.color}" opacity="0.7"/>
    <text x="300" y="320" text-anchor="middle" font-size="32" font-weight="bold" fill="${animal.color}">
      ${animal.emoji} ${animal.name}
    </text>
  </svg>`;
  
  const base64 = Buffer.from(svg).toString('base64');
  return `data:image/svg+xml;base64,${base64}`;
}

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

    // If mock mode is enabled, return a fake animal immediately
    if (process.env.MOCK_RESPONSE === '1') {
      const animals = {
        'chat': { 
          name: 'Chat', 
          species: 'Felis catus', 
          size: '25-30 cm', 
          weight: '3.5-5 kg', 
          description: 'Félin domestique carnivore, animal de compagnie très populaire.'
        },
        'chien': { 
          name: 'Chien', 
          species: 'Canis familiaris', 
          size: '15-90 cm', 
          weight: '2-90 kg', 
          description: 'Mammifère carnivore, fidèle compagnon de l\'homme depuis des millénaires.'
        },
        'lion': { 
          name: 'Lion', 
          species: 'Panthera leo', 
          size: '1.7-2.5 m', 
          weight: '190-250 kg', 
          description: 'Grand félin africain, roi de la savane, animal social vivant en groupes.'
        },
        'elephant': { 
          name: 'Éléphant', 
          species: 'Loxodonta africana', 
          size: '6-7 m', 
          weight: '4000-7000 kg', 
          description: 'Plus grand animal terrestre, herbivore intelligent et sociable.'
        },
        'tigre': { 
          name: 'Tigre', 
          species: 'Panthera tigris', 
          size: '1.4-2.8 m', 
          weight: '65-300 kg', 
          description: 'Félin asiatique majestueux, prédateur solitaire et puissant.'
        },
        'ours': { 
          name: 'Ours', 
          species: 'Ursus arctos', 
          size: '1.5-2.8 m', 
          weight: '200-600 kg', 
          description: 'Mammifère puissant, omnivore, symbole de force et de nature sauvage.'
        }
      };
      const searchName = name.toLowerCase().trim();
      const animal = animals[searchName] || { 
        name: name.charAt(0).toUpperCase() + name.slice(1), 
        species: 'Espèce inconnue', 
        size: 'Inconnue', 
        weight: 'Inconnue', 
        description: 'Cet animal n\'est pas dans notre base de données.'
      };
      
      // Get image from API or fallback to SVG
      const imageUrl = await getAnimalImage(animal.name);
      animal.image = { url: imageUrl };
      animal.mock = true;
      return res.json(animal);
    }

    // Real API call
    const safeName = String(name).replace(/\"/g, '\\"').replace(/\n/g, ' ');
    const groq = `*[_type == "animal" && name match "${safeName}" ]{name, species, size, weight, description, "image": image.asset->url}[0]`;

    const result = await runQuery(groq);
    if (!result) return res.status(404).send('No result');

    if (result.result && Array.isArray(result.result)) {
      return res.json(result.result[0] || {});
    }
    if (result.results && Array.isArray(result.results)) {
      return res.json(result.results[0] || {});
    }

    return res.json(result);
  } catch (err) {
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
