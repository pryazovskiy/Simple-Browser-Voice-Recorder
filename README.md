# Simple Browser Voice Recorder

An open-source Google Chrome extension designed to record the audio of the active browser tab (e.g., Google Meet, YouTube) and/or your microphone isolated from other applications, and save the result locally.

This project is licensed under the GPL-3.0 License.

## Features

- **Isolated Tab Capture**: Records audio originating only from the active browser tab. Background apps, system sounds, and other tabs are excluded.
- **Microphone Mixing**: Option to mix your microphone input with the tab audio (perfect for meetings).
- **Real-Time Volume Controls**: Dynamically adjust the volume of the recorded tab and/or microphone during the active recording.
- **Mute Toggles**: Instantly mute/unmute either sound source (tab/microphone) during recording.
- **Material Design 3 (Material You)**: Modern, clean, and intuitive user interface with adaptive elements.
- **Multi-language Support**: Interface available in English (default), Ukrainian, and Russian.
- **Privacy First**: All audio processing and encoding happen locally on your device. No data is sent to external servers.

## Installation (Developer Mode)

To run this extension locally:

1. Download or clone this repository to your computer.
2. Open Google Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer mode** in the top-right corner.
4. Click **Load unpacked** in the top-left corner.
5. Select the folder containing the extension files.

## Development Note

This software was developed in collaboration with and generated using **Large Language Models (LLMs)**. The AI assisted with structuring the code, implementing the Web Audio API mixing pipelines, managing Manifest V3 background service workers, and designing the Material 3 UI layout.

## License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file for details.
