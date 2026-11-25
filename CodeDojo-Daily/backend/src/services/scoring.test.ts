import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateTeamScore, firstAcceptedExists } from './scoring.js';
import type { Team, Submission } from './store.js';

const team: Team = { id: 't1', name: 'Test Team', avatar: '⚡', members: ['A', 'B', 'C'], createdAt: '2026-01-01' };
const submissions: Submission[] = [
  { id: '1', user: 'A', problemId: 1, teamId: 't1', status: 'Accepted', points: 10, code: '', createdAt: '' },
  { id: '2', user: 'A', problemId: 1, teamId: 't1', status: 'Accepted', points: 10, code: '', createdAt: '' },
  { id: '3', user: 'B', problemId: 2, teamId: 't1', status: 'Wrong Answer', points: 0, code: '', createdAt: '' }
];
test('leaderboard score applies roster bonus and counts unique member/problem solves', () => {
  const result = calculateTeamScore(team, submissions);
  assert.equal(result.solves, 1);
  assert.equal(result.points, 20);
  assert.equal(result.streakBonus, 15);
  assert.equal(result.score, 35);
});
test('duplicate accepted solve detection works', () => {
  assert.equal(firstAcceptedExists(submissions, 'A', 1), true);
  assert.equal(firstAcceptedExists(submissions, 'B', 2), false);
});
