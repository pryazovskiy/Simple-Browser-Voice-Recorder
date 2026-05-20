let mediaRecorder = null;
let audioChunks = [];
let audioContext = null;
let tabStream = null;
let micStream = null;

let tabGainNode = null;
let micGainNode = null;

chrome.runtime.sendMessage({ action: "OFFSCREEN_READY" });

chrome.runtime.onMessage.addListener(async (message) => {
  if (message.action === "START_STREAM") {
    const streamId = message.streamId;
    const tabTitle = message.tabTitle;
    const recordMic = message.recordMic;
    
    const initialTabVolume = message.tabVolume;
    const initialMicVolume = message.micVolume;

    try {
      tabStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          mandatory: {
            chromeMediaSource: "tab",
            chromeMediaSourceId: streamId
          }
        },
        video: false
      });

      audioContext = new AudioContext();
      const tabSource = audioContext.createMediaStreamSource(tabStream);
      
      tabSource.connect(audioContext.destination);

      const recordingDestination = audioContext.createMediaStreamDestination();

      tabGainNode = audioContext.createGain();
      tabGainNode.gain.value = initialTabVolume;

      tabSource.connect(tabGainNode);
      tabGainNode.connect(recordingDestination);

      if (recordMic) {
        try {
          micStream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: false
          });
          const micSource = audioContext.createMediaStreamSource(micStream);
          
          micGainNode = audioContext.createGain();
          micGainNode.gain.value = initialMicVolume;

          micSource.connect(micGainNode);
          micGainNode.connect(recordingDestination);
        } catch (micError) {
          console.error("Микрофон аппаратно недоступен:", micError);
          chrome.storage.local.set({ micPermissionGranted: false });
        }
      }

      const mixedStream = recordingDestination.stream;
      mediaRecorder = new MediaRecorder(mixedStream, {
        mimeType: "audio/webm; codecs=opus"
      });

      audioChunks = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
        const blobUrl = URL.createObjectURL(audioBlob);

        const dateStr = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
        const cleanTitle = tabTitle.replace(/[^a-zA-Z0-9а-яА-ЯёЁ\s-_]/g, "").trim() || "audio";
        const filename = `${cleanTitle}_${dateStr}.webm`;

        // Отправляем blobUrl обратно в background.js для контролируемого скачивания
        chrome.runtime.sendMessage({
          action: "DOWNLOAD_FILE",
          blobUrl: blobUrl,
          filename: filename
        });

        if (audioContext) {
          audioContext.close();
        }
        if (tabStream) {
          tabStream.getTracks().forEach(track => track.stop());
        }
        if (micStream) {
          micStream.getTracks().forEach(track => track.stop());
        }
        tabGainNode = null;
        micGainNode = null;
      };

      mediaRecorder.start();

      tabStream.getAudioTracks()[0].onended = () => {
        if (mediaRecorder && mediaRecorder.state !== "inactive") {
          mediaRecorder.stop();
        }
      };

    } catch (error) {
      console.error("Ошибка при запуске записи в offscreen:", error);
    }
  }

  if (message.action === "STOP_STREAM") {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
    }
  }

  if (message.action === "SET_TAB_VOLUME") {
    if (tabGainNode) {
      tabGainNode.gain.value = message.volume;
    }
  }

  if (message.action === "SET_MIC_VOLUME") {
    if (micGainNode) {
      micGainNode.gain.value = message.volume;
    }
  }
});