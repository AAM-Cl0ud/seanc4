import 'dotenv/config';
import express from 'express';

const API_KEY = process.env.GROQ_API_KEY;
const ENDPOINT = 'https://api.groq.ai/v1/query';
const port = process.env.PORT || 3000;

async function callGroqAPI(prompt) {
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Groq API error:', error);
      return null;
    }

    const data = await response.json();
    if (data.choices && data.choices[0] && data.choices[0].message) {
      return data.choices[0].message.content;
    }
  } catch (err) {
    console.error('Error calling Groq API:', err.message);
  }
  return null;
}

async function getAnimalInfoFromGroq(animalName) {
  const prompt = `Fournissez les informations scientifiques sur ${animalName} au format JSON strict (sans markdown):
  {"name": "nom français", "species": "nom scientifique", "size": "taille", "weight": "poids", "description": "courte description 1-2 lignes"}
  Répondez UNIQUEMENT avec le JSON, rien d'autre.`;

  const response = await callGroqAPI(prompt);
  if (!response) return null;

  try {
    // Clean the response to extract JSON
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (err) {
    console.error('Error parsing Groq response:', err);
  }
}

async function getAnimalImage(animalType) {
  try {
    // Try thecat API for cats
    if (animalType.toLowerCase().includes('chat')) {
      const res = await fetch('https://api.thecatapi.com/v1/images/search');
      const data = await res.json();
      if (data && data[0] && data[0].url) return data[0].url;
    }
    // Try dog API for dogs
    else if (animalType.toLowerCase().includes('chien')) {
      const res = await fetch('https://dog.ceo/api/breeds/image/random');
      const data = await res.json();
      if (data && data.message) return data.message;
    }
    
    // For other animals, try Wikimedia Commons API
    const imageUrl = await fetchWikimediaImage(animalType);
    if (imageUrl) return imageUrl;
  } catch (err) {
    console.warn('Could not fetch animal image:', err.message);
  }
  
  return generateAnimalSVG(animalType);
}

async function fetchWikimediaImage(animalName) {
  try {
    const searchQuery = animalName.toLowerCase().trim();
    const wikiRes = await fetch(`https://commons.wikimedia.org/w/api.php?action=query&format=json&list=search&srsearch=${encodeURIComponent(searchQuery)}&srnamespace=6&srlimit=10&srsort=relevance`);
    const wikiData = await wikiRes.json();
    
    if (wikiData.query && wikiData.query.search && wikiData.query.search.length > 0) {
      // Try to find a good quality image
      for (const result of wikiData.query.search.slice(0, 5)) {
        const title = result.title;
        if (title.includes('.jpg') || title.includes('.png') || title.includes('.jpeg')) {
          const imgRes = await fetch(`https://commons.wikimedia.org/w/api.php?action=query&format=json&titles=${encodeURIComponent(title)}&prop=imageinfo&iiprop=url`);
          const imgData = await imgRes.json();
          
          const pages = imgData.query.pages;
          for (const page of Object.values(pages)) {
            if (page.imageinfo && page.imageinfo[0] && page.imageinfo[0].url) {
              const url = page.imageinfo[0].url;
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

    // Try to get info from Groq API first
    let animalInfo = null;
    if (API_KEY && API_KEY.trim()) {
      animalInfo = await getAnimalInfoFromGroq(name);
      console.log(`Groq response for ${name}:`, animalInfo);
    }

    // If Groq fails or API_KEY not set, use mock data
    if (!animalInfo) {
      const mockAnimals = {
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
        },
        'girafe': { 
          name: 'Girafe', 
          species: 'Giraffa camelopardalis', 
          size: '4.5-5.5 m', 
          weight: '700-900 kg', 
          description: 'Animal herbivore au long cou, le plus haut quadrupède terrestre.'
        },
        'zebre': { 
          name: 'Zèbre', 
          species: 'Equus quagga', 
          size: '2.2-2.5 m', 
          weight: '350-450 kg', 
          description: 'Équidé noir et blanc, animal herbivore vivant en troupeaux.'
        },
        'hippopotame': { 
          name: 'Hippopotame', 
          species: 'Hippopotamus amphibius', 
          size: '3.5-4.2 m', 
          weight: '1500-1800 kg', 
          description: 'Mammifère semi-aquatique africain, herbivore agressif.'
        },
        'crocodile': { 
          name: 'Crocodile', 
          species: 'Crocodylus niloticus', 
          size: '2-5 m', 
          weight: '200-1000 kg', 
          description: 'Reptile prédateur vivant dans l\'eau, chasseur redoutable.'
        },
        'singe': { 
          name: 'Singe', 
          species: 'Primates', 
          size: '0.5-1.8 m', 
          weight: '2-100 kg', 
          description: 'Primate intelligent, agile et vivant en groupes sociaux.'
        },
        'leopard': { 
          name: 'Léopard', 
          species: 'Panthera pardus', 
          size: '0.9-1.3 m', 
          weight: '30-90 kg', 
          description: 'Félin tachet africain, chasseur solitaire et nocturne.'
        },
        'panthere': { 
          name: 'Panthère', 
          species: 'Panthera pardus', 
          size: '0.9-1.3 m', 
          weight: '30-90 kg', 
          description: 'Léopard noir ou variante sombre du félin tacheté.'
        },
        'rhinoceros': { 
          name: 'Rhinocéros', 
          species: 'Rhinocerotidae', 
          size: '2.5-3.7 m', 
          weight: '1000-2300 kg', 
          description: 'Grand herbivore à peau épaisse, doté d\'une ou deux cornes.'
        },
        'antilope': { 
          name: 'Antilope', 
          species: 'Bovidae', 
          size: '0.6-1.5 m', 
          weight: '20-350 kg', 
          description: 'Artiodactyle herbivore africain, animal rapide et gracieux.'
        },
        'buffle': { 
          name: 'Buffle', 
          species: 'Syncerus caffer', 
          size: '2.1-2.7 m', 
          weight: '500-900 kg', 
          description: 'Bovidé africain puissant, herbivore vivant en troupeaux.'
        },
        'hyene': { 
          name: 'Hyène', 
          species: 'Crocuta crocuta', 
          size: '1.1-1.4 m', 
          weight: '40-90 kg', 
          description: 'Carnivore africain avec une mâchoire puissante.'
        },
        'autruche': { 
          name: 'Autruche', 
          species: 'Struthio camelus', 
          size: '2-2.8 m', 
          weight: '100-160 kg', 
          description: 'Plus grand oiseau terrestre, incapable de voler mais très rapide.'
        },
        'serpent': { 
          name: 'Serpent', 
          species: 'Serpentes', 
          size: '0.2-10 m', 
          weight: '0.1-250 kg', 
          description: 'Reptile sans membres, carnivore vivant dans divers habitats.'
        },
        'python': { 
          name: 'Python', 
          species: 'Pythonidae', 
          size: '1-6 m', 
          weight: '1-100 kg', 
          description: 'Serpent constrictor non venimeux, prédateur de petits animaux.'
        }
      };
      const searchName = name.toLowerCase().trim();
      animalInfo = mockAnimals[searchName] || { 
        name: name.charAt(0).toUpperCase() + name.slice(1), 
        species: 'Espèce inconnue', 
        size: 'Inconnue', 
        weight: 'Inconnue', 
        description: 'Cet animal n\'est pas dans notre base de données.'
      };
    }

    // Get image from API or fallback to SVG
    const imageUrl = await getAnimalImage(animalInfo.name);
    animalInfo.image = { url: imageUrl };
    animalInfo.source = API_KEY && API_KEY.trim() ? 'Groq API' : 'Mock Database';

    res.json(animalInfo);
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
