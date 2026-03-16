let dueWords = [];
let allWords = [];

function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

async function refreshPanel() {
  allWords = await getWords();
  dueWords = getDueWords(allWords);

  const empty = document.getElementById('reviewEmpty');
  const box = document.getElementById('reviewBox');

  if (!dueWords.length) {
    empty.classList.remove('hidden');
    box.classList.add('hidden');
  } else {
    empty.classList.add('hidden');
    box.classList.remove('hidden');
    const current = dueWords[0];
    document.getElementById('reviewWord').textContent = current.word;
    document.getElementById('reviewMeaning').textContent = current.meaning || ' ';
    document.getElementById('reviewDueInfo').textContent = `${current.reviewStep + 1} • Due ${formatDateTime(current.nextReviewAt)}`;
  }

  renderUpcoming();
}

function renderUpcoming() {
  const list = document.getElementById('upcomingList');
  const items = getUpcomingWords(allWords).slice(0, 10);
  list.innerHTML = '';
  if (!items.length) {
    list.innerHTML = '<div class="muted">No saved words yet.</div>';
    return;
  }

  items.forEach(item => {
    const div = document.createElement('div');
    div.className = 'word-item';
    div.innerHTML = `
      <div class="top">
        <div>
          <div class="word">${escapeHtml(item.word)}</div>
          <div class="small">${escapeHtml(item.meaning || '')}</div>
        </div>
        <span class="badge">${item.reviewStep + 1}</span>
      </div>
      <div class="small" style="margin-top:8px;">Next review: ${formatDateTime(item.nextReviewAt)}</div>
    `;
    list.appendChild(div);
  });
}

async function submitReview(remembered) {
  if (!dueWords.length) return;
  const current = dueWords[0];
  const updated = allWords.map(item => item.id === current.id ? reviewWord(item, remembered) : item);
  await saveWords(updated);
  await refreshPanel();
}

async function quickAdd() {
  const wordInput = document.getElementById('quickWord');
  const meaningInput = document.getElementById('quickMeaning');
  const word = wordInput.value.trim();
  const meaning = meaningInput.value.trim();
  if (!word) return;

  const words = await getWords();
  words.push(createWordItem(word, meaning));
  await saveWords(words);
  wordInput.value = '';
  meaningInput.value = '';
  await refreshPanel();
}

document.getElementById('quickAddBtn').addEventListener('click', quickAdd);
document.getElementById('quickWord').addEventListener('keydown', e => {
  if (e.key === 'Enter') quickAdd();
});
document.getElementById('quickMeaning').addEventListener('keydown', e => {
  if (e.key === 'Enter') quickAdd();
});
document.getElementById('yesBtn').addEventListener('click', () => submitReview(true));
document.getElementById('noBtn').addEventListener('click', () => submitReview(false));
document.getElementById('openOptionsBtn').addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.words) refreshPanel();
});

refreshPanel();