import express from 'express';
import cors from 'cors';
import { problems } from './data/problems.js';
import { load, save, newId } from './services/store.js';
import { cleanText, isValidTeamName, validateSubmission } from './services/validation.js';
import { calculateTeamScore, firstAcceptedExists } from './services/scoring.js';

const app = express();
app.disable('x-powered-by');
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') ?? ['http://localhost:5173', 'http://127.0.0.1:5173'] }));
app.use(express.json({ limit: '128kb', strict: true }));

// Lightweight per-process throttling for the classroom/demo deployment.
const requestBuckets = new Map<string, { count: number; resetAt: number }>();
function rateLimit(max: number, windowMs: number) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const key = `${req.ip}:${req.path}`; const now = Date.now(); const bucket = requestBuckets.get(key);
    if (!bucket || bucket.resetAt <= now) requestBuckets.set(key, { count: 1, resetAt: now + windowMs });
    else if (bucket.count >= max) return res.status(429).json({ error: 'Too many requests. Please wait and try again.' });
    else bucket.count += 1;
    res.setHeader('RateLimit-Limit', String(max)); next();
  };
}
app.use('/api', rateLimit(180, 60_000));
app.use('/api/submissions', rateLimit(25, 60_000));
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Cache-Control', 'no-store');
  next();
});

const cleanName = cleanText;
const today = () => new Date().toISOString().slice(0, 10);

app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'CodeDojo Daily API', timestamp: new Date().toISOString(), problems: problems.length }));
app.get('/api/problems', (_req, res) => res.json(problems));
app.get('/api/daily', (_req, res) => {
  const day = Math.floor(Date.now() / 86400000);
  const problem = problems[((day % problems.length) + problems.length) % problems.length];
  res.json({ date: today(), problemId: problem.id });
});
app.get('/api/problems/:id', (req, res) => {
  const problem = problems.find(item => item.id === Number(req.params.id));
  if (!problem) return res.status(404).json({ error: 'Problem not found' });
  return res.json(problem);
});
app.get('/api/teams', async (_req, res, next) => { try { res.json((await load()).teams); } catch (e) { next(e); } });
app.get('/api/war', async (_req, res, next) => {
  try { const db = await load(); const war = db.war ?? { startedAt: null, endsAt: null, active: false }; const remainingSeconds = war.active && war.endsAt ? Math.max(0, Math.ceil((new Date(war.endsAt).getTime() - Date.now()) / 1000)) : 0; if (war.active && remainingSeconds === 0) { war.active = false; await save(db); } res.json({ ...war, active: war.active && remainingSeconds > 0, remainingSeconds }); } catch (e) { next(e); }
});
app.post('/api/war/start', async (_req, res, next) => {
  try { const db = await load(); const now = new Date(); const current = db.war; if (current?.active && current.endsAt && new Date(current.endsAt).getTime() > now.getTime()) return res.status(409).json({ error: 'A Team War is already running', endsAt: current.endsAt }); db.war = { startedAt: now.toISOString(), endsAt: new Date(now.getTime() + 60 * 60 * 1000).toISOString(), active: true }; await save(db); return res.status(201).json({ ...db.war, remainingSeconds: 3600 }); } catch (e) { return next(e); }
});
app.post('/api/war/end', async (_req, res, next) => {
  try { const db = await load(); if (db.war) db.war.active = false; await save(db); return res.json({ ok: true, active: false }); } catch (e) { return next(e); }
});
app.post('/api/teams', async (req, res, next) => {
  try {
    const name = cleanName(req.body?.name);
    const avatar = cleanName(req.body?.avatar, 8) || '🦊';
    const user = cleanName(req.body?.user, 32) || 'You';
    if (!isValidTeamName(name)) return res.status(400).json({ error: 'Squad name must be 3–24 characters and include a letter or number' });
    const db = await load();
    if (db.teams.some(team => team.name.toLowerCase() === name.toLowerCase())) return res.status(409).json({ error: 'That squad name is already taken' });
    if (db.teams.some(team => team.members.includes(user))) return res.status(409).json({ error: 'You already belong to a squad. Leave your current squad before creating another.' });
    const team = { id: newId(), name, avatar, members: [user], createdAt: new Date().toISOString() };
    db.teams.push(team); await save(db); return res.status(201).json(team);
  } catch (e) { return next(e); }
});
app.post('/api/teams/:id/leave', async (req, res, next) => {
  try { const db = await load(); const team = db.teams.find(item => item.id === req.params.id); if (!team) return res.status(404).json({ error: 'Squad not found' }); const user = cleanName(req.body?.user, 32) || 'You'; if (!team.members.includes(user)) return res.status(409).json({ error: 'You are not a member of this squad' }); team.members = team.members.filter(member => member !== user); if (team.members.length === 0) db.teams = db.teams.filter(item => item.id !== team.id); await save(db); return res.json({ ok: true }); } catch (e) { return next(e); }
});
app.post('/api/teams/:id/join', async (req, res, next) => {
  try {
    const db = await load();
    const team = db.teams.find(item => item.id === req.params.id);
    if (!team) return res.status(404).json({ error: 'Squad not found' });
    const user = cleanName(req.body?.user, 32) || 'You';
    if (team.members.includes(user)) return res.json(team);
    if (db.teams.some(item => item.members.includes(user))) return res.status(409).json({ error: 'You already belong to a squad' });
    if (team.members.length >= 4) return res.status(409).json({ error: 'This squad is full (maximum 4 members)' });
    team.members.push(user); await save(db); return res.json(team);
  } catch (e) { return next(e); }
});
app.get('/api/leaderboard', async (_req, res, next) => {
  try {
    const db = await load();
    const rows = db.teams.map(team => calculateTeamScore(team, db.submissions))
      .sort((a, b) => b.score - a.score || b.solves - a.solves || a.name.localeCompare(b.name));
    return res.json(rows);
  } catch (e) { return next(e); }
});
app.get('/api/submissions', async (req, res, next) => {
  try {
    const db = await load();
    const problemId = req.query.problemId ? Number(req.query.problemId) : undefined;
    const rows = problemId ? db.submissions.filter(item => item.problemId === problemId) : db.submissions;
    return res.json(rows);
  } catch (e) { return next(e); }
});
app.post('/api/submissions', async (req, res, next) => {
  try {
    const checked = validateSubmission(req.body);
    if (!checked.ok) return res.status(400).json({ error: checked.error });
    const { user, problemId, code, teamId: requestedTeam, status } = checked.value;
    const problem = problems.find(item => item.id === problemId);
    if (!problem) return res.status(400).json({ error: 'A valid problem ID is required' });
    const db = await load();
    const prior = firstAcceptedExists(db.submissions, user, problemId);
    if (status === 'Accepted' && prior) return res.status(409).json({ error: 'First accepted submission already counted', duplicate: true });
    const team = db.teams.find(item => item.members.includes(user));
    if (requestedTeam && (!team || team.id !== requestedTeam)) return res.status(403).json({ error: 'You can only submit for your own squad' });
    const warIsActive = Boolean(db.war?.active && db.war.endsAt && new Date(db.war.endsAt).getTime() > Date.now());
    const submission = {
      id: newId(), user, problemId, teamId: team?.id ?? null, status,
      // Points are derived on the server; active Team War submissions earn the 2x multiplier.
      points: status === 'Accepted' ? problem.points * (warIsActive ? 2 : 1) : 0,
      code, createdAt: new Date().toISOString()
    };
    db.submissions.push(submission);
    const me = db.users.find(item => item.name === user) ?? { name: user, streak: 0, solved: [], lastActive: '' };
    if (!db.users.some(item => item.name === user)) db.users.push(me);
    if (status === 'Accepted' && !me.solved.includes(problemId)) me.solved.push(problemId);
    if (status === 'Accepted') {
      const date = today();
      if (me.lastActive !== date) {
        const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
        me.streak = me.lastActive === yesterday ? me.streak + 1 : 1;
        me.lastActive = date;
      }
    }
    await save(db); return res.status(201).json(submission);
  } catch (e) { return next(e); }
});
app.get('/api/stats', async (_req, res, next) => {
  try {
    const db = await load();
    const me = db.users.find(item => item.name === 'You') ?? { name: 'You', streak: 0, solved: [], lastActive: '' };
    const mine = db.submissions.filter(item => item.user === 'You');
    const activity: Record<string, number> = {};
    for (const sub of mine) activity[sub.createdAt.slice(0, 10)] = (activity[sub.createdAt.slice(0, 10)] ?? 0) + 1;
    const activeDays = Object.keys(activity).sort();
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const streak = me.lastActive === today() || me.lastActive === yesterday ? me.streak : 0;
    return res.json({ solved: me.solved.length, total: problems.length, streak, submissions: mine.length, solvedIds: me.solved, activity, activeDays });
  } catch (e) { return next(e); }
});
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Unexpected server error. Check the backend terminal for details.' });
});

const port = Number(process.env.PORT || 4000);
app.listen(port, () => console.log(`🥋 CodeDojo API running at http://localhost:${port}`));
