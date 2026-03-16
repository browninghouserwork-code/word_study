importScripts('common.js');

// chrome.runtime.onInstalled.addListener(async () => {
//   await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
//   await scheduleReminderAlarm();
// });

// chrome.runtime.onStartup.addListener(async () => {
//   await scheduleReminderAlarm();
// });

// chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
//   if (message?.type === 'WORDS_UPDATED') {
//     scheduleReminderAlarm().then(() => sendResponse({ ok: true }));
//     return true;
//   }
//   return false;
// });

// chrome.alarms.onAlarm.addListener(async (alarm) => {
//   if (alarm.name !== 'nextWordReview') return;

//   const words = await getWords();
//   const due = getDueWords(words);
//   if (due.length > 0) {
//     await chrome.notifications.create({
//       type: 'basic',
//       iconUrl: 'icons/icon128.png',
//       title: 'Word study time',
//       message: `You have ${due.length} word${due.length > 1 ? 's' : ''} ready to review.`
//     });
//   }
//   await scheduleReminderAlarm();
// });