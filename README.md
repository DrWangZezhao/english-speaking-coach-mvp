# SpeakLoop — adult fluency conversation prototype

SpeakLoop is an independent, browser-based concept for adults who want low-pressure speaking practice, especially people exploring stuttering/fluency support. The speaking character is an original SVG illustration, not an Apple Memoji. This is **not** a licensed speech therapist, diagnosis, treatment plan, medical device, or proof of clinical benefit.

## Demo flow

1. Choose Mandarin, English, or Spanish. On a WebGPU-capable browser, click “加载 AI，开始对话.” The first run downloads roughly 570 MB of `onnx-community/Qwen3-0.6B-ONNX` model data, then runs text generation in a browser worker. No project AI server or API key is required. Performance and browser compatibility vary.
2. The character opens the conversation using browser text-to-speech. Its mouth moves during playback. Mouth movement is approximate animation, not phoneme-accurate lip sync.
3. Speak using the browser's speech recognition or type. If on-device recognition is unavailable, the user must explicitly opt in before browser-service recognition can handle microphone audio. Such audio **may leave the device for the browser vendor**; it does not go to this project's server. Recognition accuracy for stuttered speech is unvalidated, so the transcript can be edited.
4. The user decides when the turn is finished using “我说完了” or “发送.” The app does not cut them off after a pause or score their fluency. A generated reply is spoken aloud. If the model fails, it displays an error rather than a scripted substitute.

Conversation text stays in the current page session. Model files are cached by the browser/provider; this repo does not collect accounts, recordings, transcripts, or analytics. The first model download is from Hugging Face and can be slow or blocked depending on network location, including China. This MVP is not yet suitable for a paid China launch.

## Local development

Requires Node 20+ and Chrome/Edge with WebGPU. The static server serves the built `dist/` directory.

```sh
npm ci
npm test
npm run build
npm start
```

Open `http://127.0.0.1:4173/`. GitHub Pages deploys the same `dist/` directory on pushes to `main`. The site has a web-app manifest for a home-screen experience, but **native iOS and Android apps have not been built**. Browser speech recognition and WebGPU support must be checked separately on those platforms.

## Safety and product limits

- The system prompt focuses on conversational participation, does not demand fluency, and prohibits sentence completion, performance scores, and therapy claims. A 0.6B model may still ignore instructions or give poor advice. Human review, safety testing, accessibility testing, and qualified speech-language professional involvement are needed before any clinical positioning.
- Apple Memoji/emoji character assets are not bundled. A commercial product needs its own character artwork and licensing. Native iOS could later use ARKit facial blend shapes to animate original art, but this web prototype does not use ARKit.
- The model is an open-weight dependency, **not a model we trained**. Cloud inference is not free by default. Browser inference avoids a hosted AI bill but costs device memory, download time, battery, and support burden.
- No pediatric use, diagnosis, medical claims, or emergency guidance should be inferred from the prototype.
