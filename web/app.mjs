import { openers, buildMessages, cleanReply, visemeFor } from './dialogue.mjs';

const $ = (id) => document.getElementById(id);
const state = { worker: null, pending: new Map(), nextId: 0, active: false, busy: false, listening: false, recognition: null, history: [], speechTimer: null };
const startButton = $('start-button');
const stopButton = $('stop-button');
const micButton = $('mic-button');
const doneButton = $('done-button');
const sendButton = $('send-button');
const draft = $('draft');
const language = $('language');

function status(message) { $('status').textContent = message; }
function caption(message) { $('avatar-caption').textContent = message; }
function mouth(width = 22, height = 7) {
  $('avatar-mouth').setAttribute('rx', width);
  $('avatar-mouth').setAttribute('ry', height);
}
function addTurn(role, content) {
  $('transcript').querySelector('.empty-chat')?.remove();
  const li = document.createElement('li');
  li.className = `turn turn-${role}`;
  const label = document.createElement('span');
  label.className = 'turn-label';
  label.textContent = role === 'assistant' ? 'SpeakLoop' : '你';
  const body = document.createElement('p');
  body.textContent = content;
  li.append(label, body);
  $('transcript').append(li);
  li.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}
function setControls() {
  startButton.disabled = state.active || state.busy;
  stopButton.disabled = !state.active;
  language.disabled = state.active || state.busy;
  draft.disabled = !state.active || state.busy;
  micButton.disabled = !state.active || state.busy || state.listening;
  sendButton.disabled = !state.active || state.busy || !draft.value.trim();
  doneButton.hidden = !state.listening;
}
function request(type, payload = {}) {
  const id = ++state.nextId;
  return new Promise((resolve, reject) => {
    state.pending.set(id, { resolve, reject });
    state.worker.postMessage({ id, type, ...payload });
  });
}
function closeWorker() {
  for (const { reject } of state.pending.values()) reject(new Error('会话已结束'));
  state.pending.clear();
  state.worker?.terminate();
  state.worker = null;
}
function stopSpeech() {
  clearInterval(state.speechTimer);
  state.speechTimer = null;
  window.speechSynthesis?.cancel();
  mouth();
}
function speak(text) {
  if (!('speechSynthesis' in window)) { caption('正在倾听'); return; }
  stopSpeech();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = language.value;
  utterance.rate = 0.9;
  let tick = 0;
  utterance.onstart = () => {
    caption('正在说话');
    state.speechTimer = setInterval(() => {
      const shape = visemeFor(text.slice(tick++ % text.length, tick + 2));
      mouth(shape.width, shape.height);
    }, 130);
  };
  utterance.onboundary = (event) => {
    const shape = visemeFor(text.slice(event.charIndex, event.charIndex + 3));
    mouth(shape.width, shape.height);
  };
  const finish = () => { clearInterval(state.speechTimer); state.speechTimer = null; mouth(); caption('正在倾听'); };
  utterance.onend = finish;
  utterance.onerror = finish;
  window.speechSynthesis.speak(utterance);
}
function stopListening() {
  if (!state.recognition) return;
  const recognition = state.recognition;
  state.recognition = null;
  state.listening = false;
  try { recognition.stop(); } catch { /* already stopped */ }
  micButton.textContent = '🎙 继续说话';
  caption('正在倾听');
  setControls();
}

startButton.addEventListener('click', async () => {
  if (!navigator.gpu) { status('此浏览器没有 WebGPU，无法运行设备端 AI。请使用支持 WebGPU 的新版 Chrome 或 Edge。'); return; }
  state.busy = true;
  setControls();
  $('load-progress').hidden = false;
  status('正在加载设备端模型；第一次约需下载 570 MB，请保持页面打开。');
  try {
    state.worker = new Worker('./model-worker.js', { type: 'module' });
    state.worker.onmessage = ({ data }) => {
      if (data.type === 'progress') {
        $('load-bar').style.width = `${Math.max(0, Math.min(100, data.percent))}%`;
        status(`下载模型中：${data.percent}%（各文件进度，可能重复）`);
        return;
      }
      const pending = state.pending.get(data.id);
      if (!pending) return;
      state.pending.delete(data.id);
      if (data.type === 'error') pending.reject(new Error(data.message));
      else pending.resolve(data);
    };
    state.worker.onerror = (event) => {
      const message = event.message || '设备端模型加载失败';
      for (const { reject } of state.pending.values()) reject(new Error(message));
      state.pending.clear();
    };
    await request('load');
    state.active = true;
    state.history = [];
    $('chat-mode').textContent = '设备端 AI 对话';
    $('load-progress').hidden = true;
    status('AI 已就绪。它会等你说完；你可以随时用文字输入。');
    const opener = openers[language.value];
    state.history.push({ role: 'assistant', content: opener });
    addTurn('assistant', opener);
    speak(opener);
    $('conversation').scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (error) {
    closeWorker();
    $('load-progress').hidden = true;
    status(`模型未能启动：${error.message}。未切换到预设假回复。`);
  } finally { state.busy = false; setControls(); }
});

async function sendDraft() {
  const content = draft.value.trim();
  if (!state.active || state.busy || !content) return;
  stopListening();
  stopSpeech();
  draft.value = '';
  state.history.push({ role: 'user', content });
  addTurn('user', content);
  state.busy = true;
  setControls();
  caption('正在思考');
  status('AI 正在组织回应；你可以在它说完之后继续。');
  try {
    const result = await request('generate', { messages: buildMessages(state.history, language.value) });
    const reply = cleanReply(result.content);
    if (!reply) throw new Error('模型没有生成可用回复');
    state.history.push({ role: 'assistant', content: reply });
    addTurn('assistant', reply);
    status('轮到你了。你可以停顿，准备好了再说。');
    speak(reply);
  } catch (error) {
    status(`这次没有收到 AI 回复：${error.message}。你可以重试，或结束练习。`);
    caption('正在倾听');
  } finally { state.busy = false; setControls(); }
}

sendButton.addEventListener('click', sendDraft);
draft.addEventListener('input', setControls);
draft.addEventListener('keydown', (event) => { if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) sendDraft(); });
doneButton.addEventListener('click', () => { stopListening(); sendDraft(); });

micButton.addEventListener('click', async () => {
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Recognition) { status('这个浏览器不支持语音识别。可以用文字继续；建议在 Chrome 或 Edge 中体验麦克风。'); return; }
  let local = false;
  if (typeof Recognition.available === 'function') {
    try { local = await Recognition.available({ langs: [language.value], processLocally: true }) === 'available'; }
    catch { /* fall through to explicit consent */ }
  }
  if (!local && !$('speech-consent').checked) {
    status('本机识别不可用。请先勾选语音服务同意框，或使用文字；音频可能由浏览器服务商处理。');
    return;
  }
  stopSpeech();
  const recognition = new Recognition();
  recognition.lang = language.value;
  recognition.continuous = true;
  recognition.interimResults = true;
  if (local) recognition.processLocally = true;
  const initial = draft.value.trim();
  recognition.onresult = (event) => {
    let finalText = '', interim = '';
    for (let i = 0; i < event.results.length; i++) {
      const value = event.results[i][0]?.transcript || '';
      if (event.results[i].isFinal) finalText += `${value} `;
      else interim += value;
    }
    draft.value = [initial, finalText.trim(), interim].filter(Boolean).join(' ').slice(0, 500);
    setControls();
  };
  recognition.onerror = (event) => status(`语音识别未完成（${event.error}）。可以继续说，或者用文字输入；这里不会按停顿给分。`);
  recognition.onend = () => {
    if (state.recognition === recognition) {
      state.recognition = null;
      state.listening = false;
      micButton.textContent = '🎙 继续说话';
      caption('正在倾听');
      status('识别已暂停。可以继续说，或确认文字后发送；不会自动替你结束回答。');
      setControls();
    }
  };
  try {
    recognition.start();
    state.recognition = recognition;
    state.listening = true;
    micButton.textContent = '正在听…';
    caption('正在倾听');
    status(local ? '设备端识别中。你决定什么时候点“我说完了”。' : '浏览器语音服务识别中。你决定什么时候点“我说完了”。');
    setControls();
  } catch (error) { status(`无法启动麦克风：${error.message}`); }
});

stopButton.addEventListener('click', () => {
  stopListening();
  stopSpeech();
  closeWorker();
  state.active = false;
  state.busy = false;
  state.history = [];
  draft.value = '';
  $('transcript').replaceChildren();
  const empty = document.createElement('li');
  empty.className = 'empty-chat';
  empty.textContent = '准备好后，它会先开口。你可以停顿，也可以用文字补充；由你决定何时结束回答。';
  $('transcript').append(empty);
  $('chat-mode').textContent = '等待启动';
  status('本次练习已结束。对话未保存到本项目服务器。');
  caption('准备倾听');
  setControls();
});

setControls();
