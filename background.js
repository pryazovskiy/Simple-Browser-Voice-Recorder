let pendingRecording = null;
let currentDownloadId = null;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "GET_STATUS") {
    chrome.storage.local.get(["isRecording"], (result) => {
      sendResponse({ isRecording: !!(result && result.isRecording) });
    });
    return true;
  }

  if (message.action === "START_RECORDING") {
    pendingRecording = {
      tabId: message.tabId,
      tabTitle: message.tabTitle || "Запись звука",
      recordMic: message.recordMic,
      tabVolume: message.tabVolume,
      micVolume: message.micVolume,
      streamId: message.streamId // Сохраняем переданный streamId
    };

    startRecordingFlow()
      .then(() => {
        chrome.storage.local.set({ isRecording: true });
        sendResponse({ success: true });
      })
      .catch((err) => {
        console.error(err);
        sendResponse({ error: err.message || "Не удалось начать запись" });
      });
    return true;
  }

  if (message.action === "STOP_RECORDING") {
    stopRecordingFlow()
      .then(() => {
        chrome.storage.local.set({ isRecording: false });
        sendResponse({ success: true });
      })
      .catch((err) => {
        console.error(err);
        sendResponse({ error: err.message || "Не удалось остановить запись" });
      });
    return true;
  }

  if (message.action === "OFFSCREEN_READY") {
    if (!pendingRecording) {
      console.error("Нет данных для записи при готовности offscreen");
      return;
    }

    // Отправляем в offscreen.js уже сохраненный streamId напрямую
    chrome.runtime.sendMessage({
      action: "START_STREAM",
      streamId: pendingRecording.streamId,
      tabTitle: pendingRecording.tabTitle,
      recordMic: pendingRecording.recordMic,
      tabVolume: pendingRecording.tabVolume,
      micVolume: pendingRecording.micVolume
    });
  }

  // Получаем запрос на скачивание файла из offscreen.js
  if (message.action === "DOWNLOAD_FILE") {
    chrome.downloads.download({
      url: message.blobUrl,
      filename: message.filename,
      saveAs: true // Открываем системный диалог выбора папки для сохранения
    }, (downloadId) => {
      if (chrome.runtime.lastError) {
        console.error("Ошибка скачивания:", chrome.runtime.lastError);
        // Если произошла ошибка до начала скачивания, закрываем документ
        chrome.offscreen.closeDocument().catch(() => {});
        chrome.storage.local.set({ isRecording: false });
        pendingRecording = null;
        return;
      }
      currentDownloadId = downloadId;
    });
  }

  if (message.action === "SET_TAB_VOLUME") {
    chrome.runtime.sendMessage({
      action: "SET_TAB_VOLUME",
      volume: message.volume
    });
  }

  if (message.action === "SET_MIC_VOLUME") {
    chrome.runtime.sendMessage({
      action: "SET_MIC_VOLUME",
      volume: message.volume
    });
  }
});

// Отслеживаем статус загрузки файла
chrome.downloads.onChanged.addListener((delta) => {
  if (currentDownloadId && delta.id === currentDownloadId) {
    if (delta.state) {
      const state = delta.state.current;
      // Как только загрузка завершена (успешно или прервана пользователем), закрываем offscreen
      if (state === "complete" || state === "interrupted") {
        chrome.offscreen.closeDocument().catch(() => {});
        chrome.storage.local.set({ isRecording: false });
        currentDownloadId = null;
        pendingRecording = null;
      }
    }
  }
});

async function startRecordingFlow() {
  try {
    await chrome.offscreen.createDocument({
      url: 'offscreen.html',
      reasons: ['USER_MEDIA'],
      justification: 'Запись аудио с контролем уровней громкости'
    });
  } catch (err) {
    if (!err.message.includes("Only one single offscreen document may be created")) {
      throw err;
    }
  }
}

async function stopRecordingFlow() {
  try {
    chrome.runtime.sendMessage({ action: "STOP_STREAM" });
  } catch (err) {
    console.error("Ошибка при отправке STOP_STREAM:", err);
  }
}