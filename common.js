const SUCCESS_STEPS = [1, 3, 24, 72, 168]; // hours
const FAIL_STEP_HOURS = 1;
const STORAGE_KEY = 'words';

function now() {
  return Date.now();
}

function hoursFromNow(hours) {
  return now() + hours * 60 * 60 * 1000;
}

function formatDateTime(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleString();
}

function makeId() {
  return crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random());
}

async function getWords() {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  return Array.isArray(result[STORAGE_KEY]) ? result[STORAGE_KEY] : [];
}

async function saveWords(words) {
  await chrome.storage.local.set({ [STORAGE_KEY]: words });
  await chrome.runtime.sendMessage({ type: 'WORDS_UPDATED' }).catch(() => {});
}

function createWordItem(word, meaning = '') {
  const timestamp = now();
  return {
    id: makeId(),
    word: word.trim(),
    meaning: meaning.trim(),
    createdAt: timestamp,
    updatedAt: timestamp,
    reviewStep: 0,
    lastReviewedAt: null,
    nextReviewAt: hoursFromNow(SUCCESS_STEPS[0]),
    history: []
  };
}

function getNextSuccessStep(currentStep) {
  return Math.min(currentStep + 1, SUCCESS_STEPS.length - 1);
}

function reviewWord(item, remembered) {
  const reviewedAt = now();
  const updated = { ...item };
  updated.lastReviewedAt = reviewedAt;
  updated.updatedAt = reviewedAt;
  updated.history = Array.isArray(updated.history) ? [...updated.history] : [];
  updated.history.push({ reviewedAt, remembered });

  if (remembered) {
    updated.reviewStep = getNextSuccessStep(updated.reviewStep);
    updated.nextReviewAt = reviewedAt + SUCCESS_STEPS[updated.reviewStep] * 60 * 60 * 1000;
  } else {
    updated.reviewStep = 0;
    updated.nextReviewAt = reviewedAt + FAIL_STEP_HOURS * 60 * 60 * 1000;
  }
  return updated;
}

function getDueWords(words) {
  const current = now();
  return words.filter(w => !w.nextReviewAt || w.nextReviewAt <= current)
    .sort((a, b) => (a.nextReviewAt || 0) - (b.nextReviewAt || 0));
}

function getUpcomingWords(words) {
  return [...words].sort((a, b) => (a.nextReviewAt || 0) - (b.nextReviewAt || 0));
}

async function scheduleReminderAlarm() {
  const words = await getWords();
  const upcoming = getUpcomingWords(words).filter(w => w.nextReviewAt);
  await chrome.alarms.clear('nextWordReview');
  if (!upcoming.length) return;

  const first = upcoming[0];
  const when = Math.max(Date.now() + 5000, first.nextReviewAt);
  await chrome.alarms.create('nextWordReview', { when });
}