# SpeakLoop — independent English practice MVP

This is a standalone prototype for a Spain-based company exploring an English-speaking practice product for the Chinese market. It has no dependency on another mascot, brand, repository, or service.

## What works

- Three short, scripted speaking scenarios with English read-aloud and simple answer feedback.
- Responsive desktop/mobile interface, no account, analytics, storage, or recording upload.
- Text answers everywhere. The microphone button becomes available **only** if the browser explicitly reports that on-device English speech recognition is already available. There is no silent cloud-recognition fallback.
- Optional **local-only** DeepSeek-R1-Distill-Qwen-1.5B feedback through Ollama. The public GitHub Pages demo cannot run a model server and honestly labels itself a scripted demonstration.

This is not a trained proprietary model. Using open model weights with a product-specific prompt is an MVP; fine-tuning should only be considered after evaluations and lawful, consented training data exist. The 1.5B model can make mistakes and is not production-safe for children.

## Run and test

Requires Node 20+.

```sh
npm test
npm run build
npm start
```

Open `http://127.0.0.1:4173`.

To enable local model feedback, install [Ollama](https://ollama.com/download), then run:

```sh
ollama pull deepseek-r1:1.5b
ollama serve
```

The app checks the local Ollama installation and keeps the model endpoint on `127.0.0.1`. No credentials are needed for local use. It never exposes Ollama directly to the internet. Model output is untrusted and needs further safety evaluation before a real launch.

## Deployment and costs

The workflow publishes `dist/` to GitHub Pages. It is a **static scripted demo**, not a cloud AI service. GitHub Pages must be enabled with **Settings → Pages → Build and deployment → GitHub Actions**. The workflow runs tests before publishing.

Open weights are free to download under their license, but cloud inference is not inherently free. A future server deployment needs its own provider account, budget and abuse controls. Do not put an API key or a local model port into this static site. A personal ChatGPT Plus subscription is not a general-purpose API credit for a commercial website.

## Privacy and launch boundary

This prototype is for adult/parent-led product testing, not a child-facing production service. It does not save practice content. Browser speech-synthesis voices may vary; speech recognition is deliberately limited to on-device support. Before a paid China launch, obtain jurisdiction-specific counsel on Spain/EU privacy, China child-data rules, generative AI obligations, AI labeling, hosting, and cross-border transfers. Do not collect children's real names, school, contacts, audio, or training data by default.
