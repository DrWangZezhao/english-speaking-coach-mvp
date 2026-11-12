import test from 'node:test';
import assert from 'node:assert/strict';
import { lessons, currentTurn, evaluateAnswer } from '../web/core.mjs';

test('all lessons have three prompts and hints', () => {
  assert.equal(lessons.length, 3);
  for (const lesson of lessons) {
    assert.equal(lesson.turns.length, 3);
    for (const turn of lesson.turns) assert.ok(turn.prompt && turn.hint && turn.keywords.length);
  }
});
test('rejects empty and too-short answers', () => {
  const turn = currentTurn(0, 0);
  assert.equal(evaluateAnswer('', turn).ok, false);
  assert.equal(evaluateAnswer('hi', turn).ok, false);
});
test('accepts meaningful spoken-style replies', () => {
  assert.equal(evaluateAnswer('You can call me Sky.', currentTurn(0, 0)).ok, true);
  assert.equal(evaluateAnswer('I would like tea, please.', currentTurn(1, 0)).ok, true);
});
test('limits answer length', () => {
  assert.equal(evaluateAnswer('word '.repeat(100), currentTurn(0, 0)).ok, false);
});
