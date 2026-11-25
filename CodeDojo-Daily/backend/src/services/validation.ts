/** Shared request validation helpers. Keep untrusted input checks out of route handlers. */
export function cleanText(value: unknown, maxLength = 64): string {
  if (typeof value !== 'string') return '';
  return value.normalize('NFKC').trim().replace(/[<>\u0000-\u001f\u007f]/g, '').slice(0, maxLength);
}

export function isValidProblemId(value: unknown): value is number {
  return Number.isSafeInteger(value) && Number(value) > 0;
}

export function validateSubmission(input: unknown): { ok: true; value: { user: string; problemId: number; code: string; teamId: string | null; status: 'Accepted' | 'Wrong Answer' } } | { ok: false; error: string } {
  if (!input || typeof input !== 'object') return { ok: false, error: 'A submission object is required' };
  const body = input as Record<string, unknown>;
  const user = cleanText(body.user, 32);
  const problemId = Number(body.problemId);
  const code = typeof body.code === 'string' ? body.code : '';
  if (!user) return { ok: false, error: 'A valid student name is required' };
  if (!isValidProblemId(problemId)) return { ok: false, error: 'A valid problem ID is required' };
  if (!code.trim()) return { ok: false, error: 'Submission code cannot be empty' };
  if (code.length > 50000) return { ok: false, error: 'Submission code exceeds the 50 KB limit' };
  const teamId = typeof body.teamId === 'string' && body.teamId.length <= 64 ? body.teamId : null;
  return { ok: true, value: { user, problemId, code, teamId, status: body.status === 'Accepted' ? 'Accepted' : 'Wrong Answer' } };
}

export function isValidTeamName(name: string): boolean {
  return name.length >= 3 && name.length <= 24 && /[\p{L}\p{N}]/u.test(name);
}
