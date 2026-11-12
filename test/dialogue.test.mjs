import test from 'node:test';
import assert from 'node:assert/strict';
import { languages, openers, buildMessages, cleanReply, visemeFor } from '../web/dialogue.mjs';

test('three supported languages have openers', () => {
  assert.equal(languages.length, 3);
  for (const language of languages) assert.ok(openers[language.code]);
});
test('guide discourages fluency scoring and clinical claims', () => {
  const messages = buildMessages([{ role: 'user', content: 'hello' }], 'en-US');
  assert.match(messages[0].content, /not to eliminate stuttering/);
  assert.match(messages[0].content, /Never finish their sentence/);
  assert.match(messages[0].content, /not a clinician/);
});
test('history stays short and untrusted text is bounded', () => {
  const history = Array.from({ length: 20 }, () => ({ role: 'user', content: 'x'.repeat(900) }));
  const messages = buildMessages(history, 'zh-CN');
  assert.equal(messages.length, 9);
  assert.equal(messages[1].content.length, 500);
});
test('removes hidden reasoning and computes distinct mouth shapes', () => {
  assert.equal(cleanReply('<think>private</think>你好，今天想聊什么？'), '你好，今天想聊什么？');
  assert.notDeepEqual(visemeFor('apple'), visemeFor('olive'));
  assert.notDeepEqual(visemeFor('你'), visemeFor('说'));
});
