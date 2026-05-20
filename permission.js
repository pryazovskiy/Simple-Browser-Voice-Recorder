document.addEventListener("DOMContentLoaded", () => {
  const infoText = document.getElementById("info");
  const langSelect = document.getElementById("langSelect");

  // Словарь переводов для страницы разрешений
  const translations = {
    en: {
      title: "Microphone Access",
      info: "Please allow access to your microphone in the browser popup window at the top of the page.",
      granted: "Access granted! This tab can now be closed.",
      denied: "Access denied. Please allow microphone access in the top-left of this page and try again."
    },
    uk: {
      title: "Доступ до мікрофона",
      info: "Будь ласка, дозвольте доступ до вашого мікрофона у спливаючому вікні браузера у верхній частині сторінки.",
      granted: "Доступ отримано! Цю вкладку можна закрити.",
      denied: "Доступ відхилено. Будь ласка, дозвольте доступ до мікрофона у верхньому лівому кутку цієї сторінки та спробуйте знову."
    },
    ru: {
      title: "Доступ к микрофону",
      info: "Пожалуйста, разрешите доступ к вашему микрофону во всплывающем окне браузера вверху страницы.",
      granted: "Доступ получен! Эту вкладку можно закрыть.",
      denied: "Доступ отклонен. Пожалуйста, разрешите доступ к микрофону в левом верхнем углу этой страницы и попробуйте снова."
    }
  };

  let currentLang = "en";

  function applyTranslations() {
    const dict = translations[currentLang];
    document.querySelectorAll("[data-i18n]").forEach(el => {
      const key = el.getAttribute("data-i18n");
      if (dict[key]) {
        el.textContent = dict[key];
      }
    });
  }

  // Загружаем сохраненный пользователем язык расширения
  chrome.storage.local.get(["appLanguage"], (result) => {
    if (result && result.appLanguage) {
      currentLang = result.appLanguage;
    } else {
      currentLang = "en";
    }
    langSelect.value = currentLang;
    applyTranslations();

    // Запускаем системный запрос на использование микрофона
    requestMicrophone();
  });

  // Ручное переключение языка на странице
  langSelect.addEventListener("change", () => {
    currentLang = langSelect.value;
    chrome.storage.local.set({ appLanguage: currentLang });
    applyTranslations();
  });

  function requestMicrophone() {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then((stream) => {
        // Останавливаем временный поток сразу после получения доступа
        stream.getTracks().forEach(track => track.stop());

        chrome.storage.local.set({ micPermissionGranted: true }, () => {
          const dict = translations[currentLang];
          infoText.className = "status-granted";
          infoText.textContent = dict.granted;

          // Закрываем вкладку автоматически через 1.5 секунды
          setTimeout(() => {
            window.close();
          }, 1500);
        });
      })
      .catch((err) => {
        console.error("Ошибка получения доступа к микрофону:", err);
        chrome.storage.local.set({ micPermissionGranted: false });
        
        const dict = translations[currentLang];
        infoText.textContent = dict.denied;
      });
  }
});