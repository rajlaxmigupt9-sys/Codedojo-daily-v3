import type { Team, Submission } from './store.js';

/** One accepted solve per member/problem is counted in leaderboard totals. */
export function calculateTeamScore(team: Team, submissions: Submission[]) {
  const accepted = submissions.filter(item => item.teamId === team.id && item.status === 'Accepted');
  const uniqueSolves = new Set(accepted.map(item => `${item.user}:${item.problemId}`)).size;
  const points = accepted.reduce((sum, item) => sum + item.points, 0);
  const streakBonus = Math.min(team.members.length * 5, 20);
  return { ...team, solves: uniqueSolves, points, streakBonus, score: points + streakBonus };
}

export function firstAcceptedExists(submissions: Submission[], user: string, problemId: number): boolean {
  return submissions.some(item => item.user === user && item.problemId === problemId && item.status === 'Accepted');
}
