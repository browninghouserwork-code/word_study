let allWordsCache = [];

function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function getFilterValue() {
  return document.getElementById('filterInput').value.trim().toLowerCase();
}

function filterWords(words, keyword) {
  if (!keyword) return words;

  return words.filter(item => {
    const word = (item.word || '').toLowerCase();
    const meaning = (item.meaning || '').toLowerCase();
    return word.includes(keyword) || meaning.includes(keyword);
  });
}

async function loadWords() {
  allWordsCache = getUpcomingWords(await getWords());
}

async function renderWords() {
  const list = document.getElementById('wordList');
  const resultInfo = document.getElementById('resultInfo');
  const keyword = getFilterValue();
  const filteredWords = filterWords(allWordsCache, keyword);

  list.innerHTML = '';

  if (!allWordsCache.length) {
    resultInfo.textContent = '';
    list.innerHTML = '<div class="muted">No words yet.</div>';
    return;
  }

  if (keyword) {
    resultInfo.textContent = `Showing ${filteredWords.length} of ${allWordsCache.length} word(s)`;
  } else {
    resultInfo.textContent = `Total ${allWordsCache.length} word(s)`;
  }

  if (!filteredWords.length) {
    list.innerHTML = '<div class="muted">No matching words found.</div>';
    return;
  }

  filteredWords.forEach(item => {
    const row = document.createElement('div');
    row.className = 'word-item';
    row.innerHTML = `
      <div class="top">
        <div>
          <div class="word">${escapeHtml(item.word)}</div>
          <div class="small">${escapeHtml(item.meaning || '')}</div>
        </div>
        <span class="badge">${item.reviewStep + 1}</span>
      </div>
      <div class="small" style="margin-top:8px;">Next review: ${formatDateTime(item.nextReviewAt)}</div>
      <div class="small">Last reviewed: ${formatDateTime(item.lastReviewedAt)}</div>
      <div class="row" style="margin-top:10px;">
        <button class="ghost edit-btn">Edit</button>
        <button class="danger delete-btn">Delete</button>
      </div>
    `;

    row.querySelector('.edit-btn').addEventListener('click', async () => {
      const newWord = prompt('Edit word', item.word);
      if (newWord === null) return;

      const newMeaning = prompt('Edit meaning / note', item.meaning || '');
      if (newMeaning === null) return;

      const updatedWords = allWordsCache.map(w =>
        w.id === item.id
          ? {
            ...w,
            word: newWord.trim(),
            meaning: newMeaning.trim(),
            updatedAt: now()
          }
          : w
      );

      await saveWords(updatedWords);
      await loadWords();
      await renderWords();
    });

    row.querySelector('.delete-btn').addEventListener('click', async () => {
      const updatedWords = allWordsCache.filter(w => w.id !== item.id);
      await saveWords(updatedWords);
      await loadWords();
      await renderWords();
    });

    list.appendChild(row);
  });
}

async function addWord() {
  const wordInput = document.getElementById('wordInput');
  const meaningInput = document.getElementById('meaningInput');
  const word = wordInput.value.trim();
  const meaning = meaningInput.value.trim();

  if (!word) return;

  const words = await getWords();
  words.push(createWordItem(word, meaning));
  await saveWords(words);

  wordInput.value = '';
  meaningInput.value = '';

  await loadWords();
  await renderWords();
}

document.getElementById('addBtn').addEventListener('click', addWord);

document.getElementById('clearBtn').addEventListener('click', () => {
  document.getElementById('wordInput').value = '';
  document.getElementById('meaningInput').value = '';
});

document.getElementById('wordInput').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addWord();
});

document.getElementById('meaningInput').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addWord();
});

document.getElementById('filterInput').addEventListener('input', () => {
  renderWords();
});

document.getElementById('clearFilterBtn').addEventListener('click', () => {
  document.getElementById('filterInput').value = '';
  renderWords();
});

chrome.storage.onChanged.addListener(async (changes, area) => {
  if (area === 'local' && changes.words) {
    await loadWords();
    await renderWords();
  }
});

(async function init() {
  await loadWords();
  await renderWords();
})();