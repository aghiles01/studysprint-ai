const form = document.getElementById('study-form');
const notesInput = document.getElementById('notes');
const courseInput = document.getElementById('courseName');
const goalInput = document.getElementById('goal');
const deadlineInput = document.getElementById('deadline');

const summaryOutput = document.getElementById('summaryOutput');
const priorityOutput = document.getElementById('priorityOutput');
const planOutput = document.getElementById('planOutput');
const quizOutput = document.getElementById('quizOutput');

const emptyState = document.getElementById('empty-state');
const result = document.getElementById('result');
const historyList = document.getElementById('history-list');

const loadDemoBtn = document.getElementById('load-demo');
const clearHistoryBtn = document.getElementById('clear-history');

const STORAGE_KEY = 'studysprint-history';

const STOP_WORDS = new Set([
  'le', 'la', 'les', 'de', 'des', 'du', 'un', 'une', 'et', 'en', 'dans', 'pour',
  'avec', 'sur', 'par', 'est', 'sont', 'au', 'aux', 'ce', 'ces', 'que', 'qui',
  'plus', 'moins', 'ou', 'ne', 'pas', 'se', 'sa', 'son', 'ses', 'leur', 'leurs',
  'elle', 'elles', 'il', 'ils', 'nous', 'vous', 'je', 'tu', 'on', 'comme', 'mais',
  'donc', 'car', 'ainsi', 'tout', 'tous', 'toute', 'toutes', 'cet', 'cette',
  'être', 'avoir', 'fait', 'faire', 'peut', 'permet', 'souvent', 'directement',
  'réellement', 'clairement', 'rapidement', 'notamment', 'principalement'
]);

const BAD_WORDS = new Set([
  'consiste', 'repose', 'explique', 'mesure', 'représente', 'sert', 'montre',
  'permet', 'choisirait', 'choisit', 'achètent', 'acheter', 'vendre', 'vend',
  'regroupe', 'relie', 'porte', 'portent', 'illustre', 'illustrer', 'préparer',
  'créer', 'faire', 'voit', 'donne', 'donner', 'aide', 'aider', 'utiliser',
  'utilise', 'utilisé', 'utilisée', 'utilisés', 'utilisées'
]);

const KNOWN_CONCEPTS = [
  'commerce de détail',
  'stratégie de détail',
  'marché cible',
  'consommateur final',
  'proposition de valeur',
  'segmentation',
  'segmentation démographique',
  'segmentation psychographique',
  'segmentation comportementale',
  'positionnement',
  'positionnement concurrentiel',
  'expérience client',
  'assortiment',
  'marchandisage',
  'méthode des 5b',
  'processus d’affaires',
  'cartographie des processus',
  'modèle sipoc',
  'diagramme de flux',
  'couloirs d’activité',
  'matrice raci',
  'demande',
  'offre',
  'équilibre du marché',
  'élasticité-prix',
  'coûts fixes',
  'coûts variables',
  'revenu total'
];

function splitSentences(text) {
  return text
    .replace(/\r/g, ' ')
    .replace(/\n+/g, '. ')
    .split(/[.!?;:]+/)
    .map(s => s.trim())
    .filter(Boolean);
}

function cleanWord(word) {
  return word
    .toLowerCase()
    .normalize('NFC')
    .replace(/^[^a-zàâçéèêëîïôûùüÿñæœ0-9-]+|[^a-zàâçéèêëîïôûùüÿñæœ0-9-]+$/gi, '');
}

function capitalize(text) {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function normalizeSpaces(text) {
  return text.replace(/\s+/g, ' ').trim();
}

function normalizeConcept(phrase) {
  let value = normalizeSpaces(
    phrase
      .toLowerCase()
      .replace(/[«»"()]/g, ' ')
  );

  value = value.replace(/^(le|la|les|un|une)\s+/i, '');

  let words = value.split(/\s+/).map(cleanWord).filter(Boolean);

  while (words.length && (STOP_WORDS.has(words[0]) || BAD_WORDS.has(words[0]))) {
    words.shift();
  }

  while (words.length && (STOP_WORDS.has(words[words.length - 1]) || BAD_WORDS.has(words[words.length - 1]))) {
    words.pop();
  }

  return words.join(' ');
}

function isValidConcept(phrase) {
  if (!phrase) return false;

  const words = phrase.split(/\s+/).map(cleanWord).filter(Boolean);
  if (!words.length || words.length > 4) return false;

  if (words.some(w => BAD_WORDS.has(w))) return false;

  const strongWords = words.filter(w => w.length >= 4 && !STOP_WORDS.has(w));
  if (!strongWords.length) return false;

  if (words.length === 1 && strongWords[0].length < 6) return false;

  return true;
}

function scoreConcept(phrase, sentence) {
  let score = 0;
  const words = phrase.split(/\s+/).map(cleanWord).filter(Boolean);

  words.forEach(word => {
    if (!STOP_WORDS.has(word) && word.length >= 4) score += 2;
  });

  if (phrase.includes(' de ') || phrase.includes(' du ') || phrase.includes(' des ')) score += 3;
  if (words.length === 2) score += 2;
  if (words.length === 3) score += 3;

  if (KNOWN_CONCEPTS.includes(phrase)) score += 8;
  if (/\b(est|consiste|représente|explique|mesure|sert)\b/i.test(sentence)) score += 2;

  return score;
}

function extractConcepts(text) {
  const sentences = splitSentences(text);
  const scores = new Map();

  KNOWN_CONCEPTS.forEach(concept => {
    const regex = new RegExp(`\\b${concept.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (regex.test(text)) {
      scores.set(concept, (scores.get(concept) || 0) + 20);
    }
  });

  const patterns = [
    /\b(?:le|la|les|un|une)\s+[a-zàâçéèêëîïôûùüÿñæœ-]+(?:\s+[a-zàâçéèêëîïôûùüÿñæœ-]+){0,2}\b/gi,
    /\b[a-zàâçéèêëîïôûùüÿñæœ-]+\s+de\s+[a-zàâçéèêëîïôûùüÿñæœ-]+(?:\s+[a-zàâçéèêëîïôûùüÿñæœ-]+)?\b/gi,
    /\b[a-zàâçéèêëîïôûùüÿñæœ-]+\s+du\s+[a-zàâçéèêëîïôûùüÿñæœ-]+(?:\s+[a-zàâçéèêëîïôûùüÿñæœ-]+)?\b/gi,
    /\b[a-zàâçéèêëîïôûùüÿñæœ-]+\s+des\s+[a-zàâçéèêëîïôûùüÿñæœ-]+(?:\s+[a-zàâçéèêëîïôûùüÿñæœ-]+)?\b/gi
  ];

  sentences.forEach(sentence => {
    patterns.forEach(pattern => {
      const matches = sentence.match(pattern) || [];
      matches.forEach(match => {
        const concept = normalizeConcept(match);
        if (!isValidConcept(concept)) return;

        scores.set(concept, (scores.get(concept) || 0) + scoreConcept(concept, sentence));
      });
    });

    sentence.split(/\s+/).forEach(rawWord => {
      const word = cleanWord(rawWord);
      if (!isValidConcept(word)) return;
      scores.set(word, (scores.get(word) || 0) + scoreConcept(word, sentence));
    });
  });

  const ranked = [...scores.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([concept]) => concept);

  const cleaned = [];
  ranked.forEach(item => {
    const duplicate = cleaned.some(existing =>
      existing === item ||
      existing.includes(item) ||
      item.includes(existing)
    );
    if (!duplicate) cleaned.push(item);
  });

  return cleaned.slice(0, 6);
}

function extractKeywords(text) {
  const freq = {};

  text
    .toLowerCase()
    .replace(/[^a-zàâçéèêëîïôûùüÿñæœ0-9\s-]/gi, ' ')
    .split(/\s+/)
    .map(cleanWord)
    .forEach(word => {
      if (!word) return;
      if (word.length < 4) return;
      if (STOP_WORDS.has(word)) return;
      if (BAD_WORDS.has(word)) return;
      freq[word] = (freq[word] || 0) + 1;
    });

  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .map(([word]) => word)
    .slice(0, 8);
}

function pickBestSentences(sentences) {
  const scored = sentences.map(sentence => {
    let score = 0;

    if (sentence.length >= 50 && sentence.length <= 220) score += 3;
    if (/\b(est|consiste|représente|explique|mesure|sert)\b/i.test(sentence)) score += 4;
    if (/\bclient|marché|valeur|segmentation|positionnement|marchandisage|processus|offre|demande\b/i.test(sentence)) score += 2;

    return { sentence, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)
    .map(item => item.sentence);
}

function buildSummary(sentences, concepts, keywords, goal) {
  const mainItems = (concepts.length ? concepts : keywords).slice(0, 4).map(capitalize);
  const bestSentences = pickBestSentences(sentences);

  const introMap = {
    exam: "Ce contenu est surtout orienté vers une préparation d'examen.",
    summary: "Ce contenu peut être résumé autour de quelques notions centrales.",
    oral: "Ce contenu peut être présenté clairement à l'oral en suivant ses notions principales."
  };

  let output = introMap[goal] || introMap.exam;

  if (mainItems.length) {
    output += " Les notions clés sont : " + mainItems.join(', ') + ".";
  }

  if (bestSentences.length) {
    output += " Les idées importantes portent sur " + bestSentences.join('. ') + ".";
  }

  return output;
}

function buildPriorities(concepts, keywords, goal) {
  const items = (concepts.length ? concepts : keywords).slice(0, 4).map(capitalize);

  const endings = {
    exam: "à comprendre, mémoriser et illustrer par un exemple",
    summary: "à résumer en une phrase simple",
    oral: "à expliquer clairement à voix haute"
  };

  return items.map((item, index) => {
    return `${index + 1}. Revoir « ${item} » : ${endings[goal]}.`;
  });
}

function buildPlan(deadline, goal, concepts) {
  const today = new Date();
  const target = deadline
    ? new Date(deadline)
    : new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000);

  const daysLeft = Math.max(1, Math.ceil((target - today) / (1000 * 60 * 60 * 24)));
  const topConcepts = concepts.slice(0, 3).map(capitalize).join(', ');

  const actions = {
    exam: "faire une fiche de révision puis un mini quiz",
    summary: "faire une fiche synthèse simple",
    oral: "préparer un plan puis répéter à voix haute"
  };

  return [
    `Aujourd'hui : lire les notes une première fois et repérer les notions clés${topConcepts ? ' : ' + topConcepts : ''}.`,
    `J-${Math.max(daysLeft - 1, 0)} : regrouper les notions par thème et ${actions[goal]}.`,
    "Veille de l'échéance : revoir sans regarder les notes et reformuler les idées avec tes propres mots."
  ];
}

function buildQuiz(concepts, keywords) {
  const items = (concepts.length ? concepts : keywords).slice(0, 3).map(capitalize);

  if (!items.length) {
    return [
      "Quelles sont les trois idées majeures du cours ?",
      "Comment expliquer ce chapitre à un camarade ?",
      "Quel exemple concret illustre le mieux ce contenu ?"
    ];
  }

  return [
    `Définis « ${items[0]} » en une ou deux phrases.`,
    `Pourquoi « ${items[1] || items[0]} » est-il important dans ce cours ?`,
    `Donne un exemple concret lié à « ${items[2] || items[0]} ».`
  ];
}

function renderResult(data) {
  emptyState.classList.add('hidden');
  result.classList.remove('hidden');

  summaryOutput.textContent = data.summary;
  priorityOutput.innerHTML = data.priorities.map(item => `<li>${item}</li>`).join('');
  planOutput.innerHTML = data.plan.map(item => `<li>${item}</li>`).join('');
  quizOutput.innerHTML = data.quiz.map(item => `<li>${item}</li>`).join('');
}

function getHistory() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
}

function saveHistory(entry) {
  const history = getHistory();
  history.unshift(entry);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, 8)));
  renderHistory();
}

function renderHistory() {
  const history = getHistory();

  if (!history.length) {
    historyList.innerHTML = `
      <div class="empty-state" style="min-height:260px">
        <div>
          <div class="empty-icon">⟳</div>
          <h3>Historique vide</h3>
          <p>Aucune session sauvegardée pour le moment.</p>
        </div>
      </div>
    `;
    return;
  }

  historyList.innerHTML = history.map(item => `
    <article class="history-item">
      <div class="history-top">
        <div>
          <h3>${item.course}</h3>
          <div class="history-meta">${item.goalLabel} - généré le ${item.createdAt}</div>
        </div>
        <span class="badge">${item.deadline || 'Sans date'}</span>
      </div>
      <p>${item.summary}</p>
    </article>
  `).join('');
}

form.addEventListener('submit', function (e) {
  e.preventDefault();

  const notes = notesInput.value.trim();
  const course = courseInput.value.trim() || 'Cours sans titre';
  const goal = goalInput.value;
  const deadline = deadlineInput.value;

  const sentences = splitSentences(notes);
  const concepts = extractConcepts(notes);
  const keywords = extractKeywords(notes);

  const payload = {
    course,
    goal,
    goalLabel: goalInput.options[goalInput.selectedIndex].text,
    deadline,
    createdAt: new Date().toLocaleDateString('fr-FR'),
    summary: buildSummary(sentences, concepts, keywords, goal),
    priorities: buildPriorities(concepts, keywords, goal),
    plan: buildPlan(deadline, goal, concepts),
    quiz: buildQuiz(concepts, keywords)
  };

  renderResult(payload);
  saveHistory(payload);
});

loadDemoBtn.addEventListener('click', function () {
  courseInput.value = 'Commerce de détail';
  goalInput.value = 'exam';
  deadlineInput.value = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  notesInput.value = "Le commerce de détail consiste à vendre des produits ou des services directement au consommateur final. La stratégie de détail repose sur des choix clairs concernant le marché cible, l'assortiment, le positionnement et l'expérience client. La segmentation permet de mieux comprendre les clients. Elle peut être démographique, psychographique ou comportementale. La proposition de valeur explique pourquoi un client choisirait une entreprise plutôt qu'une autre. Le marchandisage sert à mettre en valeur les produits en magasin. La méthode des 5B insiste sur le bon produit, au bon endroit, au bon moment, en bonne quantité et au bon prix.";
});

clearHistoryBtn.addEventListener('click', function () {
  localStorage.removeItem(STORAGE_KEY);
  renderHistory();
});

document.querySelectorAll('[data-tab]').forEach(function (btn) {
  btn.addEventListener('click', function () {
    activateTab(btn.dataset.tab);
  });
});

document.querySelectorAll('[data-tab-target]').forEach(function (btn) {
  btn.addEventListener('click', function () {
    activateTab(btn.dataset.tabTarget);
  });
});

function activateTab(tab) {
  document.querySelectorAll('.tab').forEach(function (el) {
    el.classList.toggle('active', el.dataset.tab === tab);
  });

  document.querySelectorAll('.tab-panel').forEach(function (el) {
    el.classList.toggle('active', el.id === tab);
  });

  if (tab === 'history') {
    renderHistory();
  }
}

renderHistory();