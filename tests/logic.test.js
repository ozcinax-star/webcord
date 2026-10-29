import test from 'node:test';
import assert from 'node:assert/strict';
import { generateRoomCode, normalizeRoomCode, validateNick, uniqueNicks, cleanMessage } from '../src/logic.js';

test('normalizeRoomCode cleans separators and case', () => {
  assert.equal(normalizeRoomCode(' ab-c 234 '), 'ABC234');
});
test('normalizeRoomCode rejects short and invalid', () => {
  assert.equal(normalizeRoomCode('abc'), null);
  assert.equal(normalizeRoomCode('ab$d12'), null);
});
test('generateRoomCode yields valid codes', () => {
  for (let i = 0; i < 50; i++) {
    const c = generateRoomCode();
    assert.equal(normalizeRoomCode(c), c);
  }
});
test('validateNick', () => {
  assert.equal(validateNick('  '), null);
  assert.equal(validateNick('a'.repeat(21)), null);
  assert.equal(validateNick(' Ali '), 'Ali');
});
test('uniqueNicks numbers duplicates in join order', () => {
  const m = uniqueNicks([{ id: 'a', nick: 'Ali' }, { id: 'b', nick: 'Ali' }, { id: 'c', nick: 'Veli' }]);
  assert.equal(m.get('a'), 'Ali');
  assert.equal(m.get('b'), 'Ali (2)');
  assert.equal(m.get('c'), 'Veli');
});
test('cleanMessage', () => {
  assert.equal(cleanMessage('   '), null);
  assert.equal(cleanMessage('x'.repeat(400)).length, 300);
  assert.equal(cleanMessage('<b>hi</b>'), '<b>hi</b>');
});
