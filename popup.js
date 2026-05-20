document.addEventListener("DOMContentLoaded", () => {
  const startBtn = document.getElementById("startBtn");
  const stopBtn = document.getElementById("stopBtn");
  const resetBtn = document.getElementById("resetBtn");
  const contactBtn = document.getElementById("contactBtn");
  const statusDiv = document.getElementById("status");
  const langSelect = document.getElementById("langSelect");
  
  const micCheckbox = document.getElementById("micCheckbox");
  
  const tabVolume = document.getElementById("tabVolume");
  const tabVolumeValue = document.getElementById("tabVolumeValue");
  const tabMuteBtn = document.getElementById("tabMuteBtn");

  const micVolume = document.getElementById("micVolume");
  const micVolumeValue = document.getElementById("micVolumeValue");
  const micMuteBtn = document.getElementById("micMuteBtn");

  // Словарь переводов
  const translations = {
    en: {
      title: "Voice Recorder",
      tabVolLabel: "Tab Volume (record):",
      micVolLabel: "Mic Volume:",
      micCheckbox: "Record my microphone",
      startBtn: "Start Recording",
      stopBtn: "Stop Recording",
      resetBtn: "Reset Sound",
      contactBtn: "Contact",
      statusReady: "Ready to record",
      statusStarting: "Starting...",
      statusRecording: "Recording...",
      statusStopping: "Saving...",
      statusSaved: "File saved!",
      statusError: "Error",
      statusTabNotFound: "Tab not found",
      statusSysTabErr: "Cannot record system tabs",
      statusMicPermission: "Microphone access required...",
      statusMicDenied: "Mic access denied"
    },
    uk: {
      title: "Запис звуку",
      tabVolLabel: "Гучність вкладки:",
      micVolLabel: "Гучність мікрофона:",
      micCheckbox: "Записувати мій мікрофон",
      startBtn: "Почати запис",
      stopBtn: "Зупинити запис",
      resetBtn: "Скинути звук",
      contactBtn: "Контакт",
      statusReady: "Готовий до роботи",
      statusStarting: "Запуск...",
      statusRecording: "Запис триває...",
      statusStopping: "Збереження...",
      statusSaved: "Файл збережено!",
      statusError: "Помилка",
      statusTabNotFound: "Вкладку не знайдено",
      statusSysTabErr: "Системні вкладки не записуються",
      statusMicPermission: "Потрібен доступ до мікрофона...",
      statusMicDenied: "Доступ до мікрофона відхилено"
    },
    ru: {
      title: "Запись звука",
      tabVolLabel: "Громкость вкладки:",
      micVolLabel: "Громкость микрофона:",
      micCheckbox: "Записывать мой микрофон",
      startBtn: "Начать запись",
      stopBtn: "Остановить запись",
      resetBtn: "Сбросить настройки",
      contactBtn: "Контакт",
      statusReady: "Готов к работе",
      statusStarting: "Запуск...",
      statusRecording: "Запись идет...",
      statusStopping: "Сохранение...",
      statusSaved: "Файл сохранен!",
      statusError: "Ошибка",
      statusTabNotFound: "Вкладка не найдена",
      statusSysTabErr: "Системные вкладки не записываются",
      statusMicPermission: "Требуется доступ к микрофону...",
      statusMicDenied: "Доступ к микрофону отклонен"
    }
  };

  let currentLang = "en";
  let currentStatusKey = "statusReady";

  function applyTranslations() {
    const dict = translations[currentLang];
    document.querySelectorAll("[data-i18n]").forEach(el => {
      const key = el.getAttribute("data-i18n");
      if (dict[key]) {
        el.textContent = dict[key];
      }
    });
    setStatus(currentStatusKey);
  }

  function setStatus(key) {
    currentStatusKey = key;
    const dict = translations[currentLang];
    statusDiv.textContent = dict[key] || key;
  }

  chrome.storage.local.get([
    "isRecording", 
    "recordMic", 
    "tabVolumeValue", 
    "micVolumeValue", 
    "isTabMuted", 
    "isMicMuted",
    "appLanguage"
  ], (result) => {
    if (result && result.appLanguage) {
      currentLang = result.appLanguage;
    } else {
      currentLang = "en";
      chrome.storage.local.set({ appLanguage: "en" });
    }
    langSelect.value = currentLang;
    applyTranslations();

    const isRecording = !!(result && result.isRecording);
    const recordMic = !!(result && result.recordMic);
    
    const tabVol = (result && result.tabVolumeValue !== undefined) ? result.tabVolumeValue : 100;
    const micVol = (result && result.micVolumeValue !== undefined) ? result.micVolumeValue : 100;
    
    const isTabMuted = !!(result && result.isTabMuted);
    const isMicMuted = !!(result && result.isMicMuted);

    micCheckbox.checked = recordMic;
    
    tabVolume.value = isTabMuted ? 0 : tabVol;
    tabVolumeValue.textContent = (isTabMuted ? 0 : tabVol) + "%";
    tabMuteBtn.textContent = isTabMuted ? "🔇" : "🔊";

    micVolume.value = isMicMuted ? 0 : micVol;
    micVolumeValue.textContent = (isMicMuted ? 0 : micVol) + "%";
    micMuteBtn.textContent = isMicMuted ? "🔇" : "🔊";

    setRecordingState(isRecording);
  });

  langSelect.addEventListener("change", () => {
    currentLang = langSelect.value;
    chrome.storage.local.set({ appLanguage: currentLang });
    applyTranslations();
  });

  micCheckbox.addEventListener("change", () => {
    const isChecked = micCheckbox.checked;
    chrome.storage.local.set({ recordMic: isChecked });
    micVolume.disabled = !isChecked;
    micMuteBtn.disabled = !isChecked;
  });

  tabVolume.addEventListener("input", () => {
    const value = parseInt(tabVolume.value);
    tabVolumeValue.textContent = value + "%";
    
    if (value === 0) {
      tabMuteBtn.textContent = "🔇";
      chrome.storage.local.set({ isTabMuted: true, tabVolumeValue: 0 });
    } else {
      tabMuteBtn.textContent = "🔊";
      chrome.storage.local.set({ isTabMuted: false, tabVolumeValue: value, prevTabVolumeValue: value });
    }

    chrome.runtime.sendMessage({
      action: "SET_TAB_VOLUME",
      volume: value / 100
    });
  });

  micVolume.addEventListener("input", () => {
    const value = parseInt(micVolume.value);
    micVolumeValue.textContent = value + "%";
    
    if (value === 0) {
      micMuteBtn.textContent = "🔇";
      chrome.storage.local.set({ isMicMuted: true, micVolumeValue: 0 });
    } else {
      micMuteBtn.textContent = "🔊";
      chrome.storage.local.set({ isMicMuted: false, micVolumeValue: value, prevMicVolumeValue: value });
    }

    chrome.runtime.sendMessage({
      action: "SET_MIC_VOLUME",
      volume: value / 100
    });
  });

  tabMuteBtn.addEventListener("click", () => {
    chrome.storage.local.get(["isTabMuted", "tabVolumeValue", "prevTabVolumeValue"], (res) => {
      const isMuted = !!res.isTabMuted;
      const currentVal = res.tabVolumeValue !== undefined ? res.tabVolumeValue : 100;
      const prevVal = res.prevTabVolumeValue !== undefined ? res.prevTabVolumeValue : 100;

      if (isMuted) {
        const targetVal = prevVal === 0 ? 100 : prevVal;
        tabVolume.value = targetVal;
        tabVolumeValue.textContent = targetVal + "%";
        tabMuteBtn.textContent = "🔊";
        chrome.storage.local.set({ isTabMuted: false, tabVolumeValue: targetVal });
        chrome.runtime.sendMessage({ action: "SET_TAB_VOLUME", volume: targetVal / 100 });
      } else {
        chrome.storage.local.set({ prevTabVolumeValue: currentVal, isTabMuted: true, tabVolumeValue: 0 });
        tabVolume.value = 0;
        tabVolumeValue.textContent = "0%";
        tabMuteBtn.textContent = "🔇";
        chrome.runtime.sendMessage({ action: "SET_TAB_VOLUME", volume: 0 });
      }
    });
  });

  micMuteBtn.addEventListener("click", () => {
    chrome.storage.local.get(["isMicMuted", "micVolumeValue", "prevMicVolumeValue"], (res) => {
      const isMuted = !!res.isMicMuted;
      const currentVal = res.micVolumeValue !== undefined ? res.micVolumeValue : 100;
      const prevVal = res.prevMicVolumeValue !== undefined ? res.prevMicVolumeValue : 100;

      if (isMuted) {
        const targetVal = prevVal === 0 ? 100 : prevVal;
        micVolume.value = targetVal;
        micVolumeValue.textContent = targetVal + "%";
        micMuteBtn.textContent = "🔊";
        chrome.storage.local.set({ isMicMuted: false, micVolumeValue: targetVal });
        chrome.runtime.sendMessage({ action: "SET_MIC_VOLUME", volume: targetVal / 100 });
      } else {
        chrome.storage.local.set({ prevMicVolumeValue: currentVal, isMicMuted: true, micVolumeValue: 0 });
        micVolume.value = 0;
        micVolumeValue.textContent = "0%";
        micMuteBtn.textContent = "🔇";
        chrome.runtime.sendMessage({ action: "SET_MIC_VOLUME", volume: 0 });
      }
    });
  });

  resetBtn.addEventListener("click", () => {
    chrome.storage.local.set({
      tabVolumeValue: 100,
      micVolumeValue: 100,
      isTabMuted: false,
      isMicMuted: false,
      prevTabVolumeValue: 100,
      prevMicVolumeValue: 100
    }, () => {
      tabVolume.value = 100;
      tabVolumeValue.textContent = "100%";
      tabMuteBtn.textContent = "🔊";

      micVolume.value = 100;
      micVolumeValue.textContent = "100%";
      micMuteBtn.textContent = "🔊";

      chrome.storage.local.get(["isRecording"], (res) => {
        if (res && res.isRecording) {
          chrome.runtime.sendMessage({ action: "SET_TAB_VOLUME", volume: 1.0 });
          chrome.runtime.sendMessage({ action: "SET_MIC_VOLUME", volume: 1.0 });
        }
      });
    });
  });

  contactBtn.addEventListener("click", () => {
    chrome.tabs.create({ url: "https://t.me/simple_sw?direct" });
  });

  startBtn.addEventListener("click", async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) {
      setStatus("statusTabNotFound");
      return;
    }

    if (tab.url.startsWith("chrome://") || tab.url.startsWith("edge://") || tab.url.startsWith("about:")) {
      setStatus("statusSysTabErr");
      return;
    }

    const recordMic = micCheckbox.checked;

    if (recordMic) {
      const storage = await chrome.storage.local.get(["micPermissionGranted"]);
      if (!storage || !storage.micPermissionGranted) {
        setStatus("statusMicPermission");
        chrome.tabs.create({ url: "permission.html" });
        return;
      }
    }

    setRecordingState(true);
    setStatus("statusStarting");

    // Запрашиваем ID потока ПРЯМО ТУТ, чтобы сохранить жест пользователя (user gesture)
    chrome.tabCapture.getMediaStreamId({ targetTabId: tab.id }, (streamId) => {
      if (!streamId) {
        setStatus("statusError");
        setRecordingState(false);
        return;
      }

      // Отправляем START_RECORDING вместе с уже готовым streamId
      chrome.runtime.sendMessage({
        action: "START_RECORDING",
        tabId: tab.id,
        tabTitle: tab.title,
        recordMic: recordMic,
        tabVolume: parseFloat(tabVolume.value) / 100,
        micVolume: parseFloat(micVolume.value) / 100,
        streamId: streamId
      }, (response) => {
        if (response && response.error) {
          setStatus("statusError");
          setRecordingState(false);
        } else {
          setStatus("statusRecording");
        }
      });
    });
  });

  stopBtn.addEventListener("click", () => {
    setRecordingState(false);
    setStatus("statusStopping");

    chrome.runtime.sendMessage({ action: "STOP_RECORDING" }, (response) => {
      if (response && response.success) {
        setStatus("statusSaved");
        setTimeout(() => {
          setStatus("statusReady");
        }, 2000);
      } else {
        setStatus("statusError");
      }
    });
  });

  function setRecordingState(isRecording) {
    if (isRecording) {
      startBtn.disabled = true;
      stopBtn.disabled = false;
      micCheckbox.disabled = true;
      
      tabVolume.disabled = false;
      tabMuteBtn.disabled = false;

      micVolume.disabled = !micCheckbox.checked;
      micMuteBtn.disabled = !micCheckbox.checked;
      
      setStatus("statusRecording");
    } else {
      startBtn.disabled = false;
      stopBtn.disabled = true;
      micCheckbox.disabled = false;

      tabVolume.disabled = false;
      tabMuteBtn.disabled = false;

      micVolume.disabled = !micCheckbox.checked;
      micMuteBtn.disabled = !micCheckbox.checked;
      setStatus("statusReady");
    }
  }
});