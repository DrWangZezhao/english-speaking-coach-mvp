import { lessons, currentTurn, evaluateAnswer } from './core.mjs';

const $ = (id) => document.getElementById(id);
const state = { lesson: 0, turn: 0, done: false };
let localModelReady = false;
const grid = $('lesson-grid');

lessons.forEach((lesson, index) => {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'lesson-card';
  button.innerHTML = `<span class="lesson-number">${lesson.icon} <span aria-hidden="true">↗</span></span><span class="lesson-title"></span><span class="lesson-subtitle"></span><span class="lesson-footer">3 句对话 <span aria-hidden="true">→</span></span>`;
  button.querySelector('.lesson-title').textContent = lesson.title;
  button.querySelector('.lesson-subtitle').textContent = lesson.subtitle;
  button.addEventListener('click', () => openLesson(index));
  grid.append(button);
});

function speak(text) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = 0.88;
  window.speechSynthesis.speak(utterance);
}

function renderTurn() {
  const lesson = lessons[state.lesson];
  const turn = currentTurn(state.lesson, state.turn);
  $('practice-title').textContent = lesson.title;
  $('progress').textContent = `第 ${state.turn + 1} / ${lesson.turns.length} 句`;
  $('coach-prompt').textContent = turn.prompt;
  $('hint').textContent = `表达提示：${turn.hint}`;
  $('answer').value = '';
  $('feedback').textContent = '';
  $('feedback').className = 'feedback';
  $('submit-answer').disabled = false;
  $('submit-answer').innerHTML = '提交回答 <span aria-hidden="true">→</span>';
  state.done = false;
}

function openLesson(index) {
  state.lesson = index;
  state.turn = 0;
  $('practice').classList.remove('hidden');
  renderTurn();
  $('practice').scrollIntoView({ behavior: 'smooth', block: 'start' });
  $('answer').focus({ preventScroll: true });
}

$('start-button').addEventListener('click', () => openLesson(0));
$('close-practice').addEventListener('click', () => {
  window.speechSynthesis?.cancel();
  $('practice').classList.add('hidden');
  $('lessons-title').scrollIntoView({ behavior: 'smooth' });
});
$('play-prompt').addEventListener('click', () => speak(currentTurn(state.lesson, state.turn).prompt));
$('submit-answer').addEventListener('click', async () => {
  if (state.done) {
    if (state.turn + 1 < lessons[state.lesson].turns.length) {
      state.turn += 1;
      renderTurn();
      speak(currentTurn(state.lesson, state.turn).prompt);
    } else {
      $('feedback').textContent = '这一轮完成了！可以选择另一个场景继续练习。';
      $('submit-answer').disabled = true;
    }
    return;
  }
  const result = evaluateAnswer($('answer').value, currentTurn(state.lesson, state.turn));
  $('feedback').textContent = result.feedback;
  $('feedback').className = `feedback ${result.ok ? 'success' : 'try-again'}`;
  if (!result.ok) return;
  if (localModelReady) {
    $('feedback').textContent = '正在获取本机模型的建议…';
    $('submit-answer').disabled = true;
    try {
      const response = await fetch('./api/coach', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ scene: lessons[state.lesson].title, question: currentTurn(state.lesson, state.turn).prompt, answer: $('answer').value })
      });
      if (!response.ok) throw new Error('Model unavailable');
      const data = await response.json();
      $('feedback').textContent = `本机模型建议：${data.feedback}`;
    } catch {
      localModelReady = false;
      $('model-status').textContent = '连接中断，已改用预设反馈';
      $('feedback').textContent = result.feedback;
    } finally { $('submit-answer').disabled = false; }
  }
  state.done = true;
  $('submit-answer').innerHTML = state.turn + 1 < lessons[state.lesson].turns.length
    ? '下一句 <span aria-hidden="true">→</span>'
    : '完成练习 <span aria-hidden="true">✓</span>';
});

async function setupLocalSpeech() {
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Recognition || typeof Recognition.available !== 'function') return;
  try {
    const availability = await Recognition.available({ langs: ['en-US'], processLocally: true });
    if (availability !== 'available') return;
    const mic = $('mic-button');
    mic.disabled = false;
    mic.textContent = '🎙 用麦克风回答';
    mic.addEventListener('click', () => {
      const recognition = new Recognition();
      recognition.lang = 'en-US';
      recognition.processLocally = true;
      recognition.interimResults = false;
      mic.disabled = true;
      mic.textContent = '正在听…';
      recognition.onresult = (event) => { $('answer').value = event.results[0][0].transcript; };
      recognition.onerror = () => { $('mic-note').textContent = '本地识别未成功；请改用文字输入。'; };
      recognition.onend = () => { mic.disabled = false; mic.textContent = '🎙 用麦克风回答'; };
      try { recognition.start(); } catch { mic.disabled = false; mic.textContent = '🎙 用麦克风回答'; }
    });
    $('mic-note').textContent = '你的浏览器已提供设备端英语识别；语音不经过本项目服务器。';
  } catch { /* No cloud fallback. */ }
}
setupLocalSpeech();

fetch('./api/health', { cache: 'no-store' })
  .then((response) => response.ok ? response.json() : null)
  .then((data) => {
    if (data?.ready) {
      localModelReady = true;
      $('model-status').textContent = '本机 DeepSeek 已连接';
    }
  })
  .catch(() => {});
