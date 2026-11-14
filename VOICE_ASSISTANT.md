# ULTRON voice assistant preview

This branch adds an opt-in browser voice interface to the ULTRON command centre.

## What works in this preview

- A user-controlled **Enable wake word** switch starts speech recognition while the ULTRON tab is open and visible.
- Saying **“ULTRON”** wakes the assistant. Saying a command in the same utterance sends that command to the local demo responder; saying only “ULTRON” makes it answer “Yes?” and then listen for a command.
- Browser speech synthesis reads assistant replies aloud. Spoken replies can be switched off.
- The existing microphone button remains available for one-shot speech-to-text.
- The wake-word control visibly reports listening/paused/off status. Hiding the tab pauses listening; returning to the tab resumes it while the switch remains enabled.

## Important limitations

- This is **not yet a real AI assistant**. Replies still come from the small local demo-response function. The voice layer does not create an AI brain or connect external services.
- Browser speech recognition support varies. Some browsers use a remote speech-recognition service; audio may be processed by the browser vendor. Check the browser's microphone and privacy settings.
- Wake-word listening requires the page to remain open and visible, microphone permission, a supported browser, and an active internet connection where the browser's speech service requires one. It is not a background wake word, does not work when the browser is closed, and is not an always-on device assistant.
- A browser cannot guarantee that it hears every wake-word utterance. Users should be able to disable the microphone immediately.
- Do not use this preview for sensitive conversations or assume speech recognition is fully on-device.

## How to try it

1. Open ULTRON over HTTPS in a supported browser.
2. Open **AI Assistant**.
3. Select **Enable wake word** and grant microphone permission.
4. Say “ULTRON”. Then ask a short question.
5. Use **Disable wake word** to stop listening. Use **Voice replies: On/Off** to control spoken answers.

## Next engineering work

1. Connect a secure server-side AI endpoint; never put an AI provider secret in browser JavaScript or GitHub.
2. Add authenticated conversation storage and per-user access controls.
3. Add calendar, email and messaging through official OAuth/API integrations with least-privilege scopes.
4. Require confirmation before sending messages, emails, or taking other consequential actions.
5. Implement owner authorization and subscription billing only on the trusted backend.
6. Add automated tests and verify supported browser behavior before enabling the feature for general users.
