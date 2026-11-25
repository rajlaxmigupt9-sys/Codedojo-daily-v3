import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanText, isValidProblemId, isValidTeamName, validateSubmission } from './validation.js';

test('cleanText trims and strips markup/control characters', () => {
  assert.equal(cleanText('  <Admin>\n  ', 24), 'Admin');
});
test('problem identifiers must be positive safe integers', () => {
  assert.equal(isValidProblemId(4), true);
  assert.equal(isValidProblemId(-1), false);
  assert.equal(isValidProblemId(1.5), false);
});
test('team names have bounded length and visible characters', () => {
  assert.equal(isValidTeamName('Byte Brigade'), true);
  assert.equal(isValidTeamName('ab'), false);
  assert.equal(isValidTeamName('   '), false);
});
test('submission validation rejects empty and oversized code', () => {
  assert.equal(validateSubmission({ user: 'A', problemId: 1, code: '  ' }).ok, false);
  assert.equal(validateSubmission({ user: 'A', problemId: 1, code: 'x'.repeat(50001) }).ok, false);
  assert.equal(validateSubmission({ user: 'A', problemId: 1, code: 'return 1;' }).ok, true);
});
