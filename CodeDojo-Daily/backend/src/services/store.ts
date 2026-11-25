import { readFile, writeFile, rename } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { nanoid } from 'nanoid';

const file = join(dirname(fileURLToPath(import.meta.url)), '../data/db.json');
export type Team = { id: string; name: string; avatar: string; members: string[]; createdAt: string };
export type Submission = { id: string; user: string; problemId: number; teamId: string | null; status: string; points: number; code: string; createdAt: string };
type DB = { teams: Team[]; submissions: Submission[]; users: { name: string; streak: number; solved: number[]; lastActive: string }[]; war?: { startedAt: string | null; endsAt: string | null; active: boolean } };

const seed: DB = {
  teams: [
    { id: 'binary-beasts', name: 'Binary Beasts', avatar: '🐺', members: ['You', 'Aarav', 'Mira'], createdAt: new Date().toISOString() },
    { id: 'syntax-squad', name: 'Syntax Squad', avatar: '⚡', members: ['Riya', 'Kabir', 'Dev', 'Anya'], createdAt: new Date().toISOString() },
    { id: 'null-pointers', name: 'Null Pointers', avatar: '🦊', members: ['Ishaan', 'Tara', 'Neel'], createdAt: new Date().toISOString() },
    { id: 'runtime-rangers', name: 'Runtime Rangers', avatar: '🚀', members: ['Zoya', 'Arjun', 'Nia'], createdAt: new Date().toISOString() }
  ],
  submissions: [],
  users: [{ name: 'You', streak: 0, solved: [], lastActive: '' }],
  war: { startedAt: null, endsAt: null, active: false }
};

let writeQueue: Promise<void> = Promise.resolve();
export async function load(): Promise<DB> {
  try {
    const parsed = JSON.parse(await readFile(file, 'utf8')) as Partial<DB>;
    return {
      teams: Array.isArray(parsed.teams) ? parsed.teams : structuredClone(seed.teams),
      submissions: Array.isArray(parsed.submissions) ? parsed.submissions : [],
      users: Array.isArray(parsed.users) ? parsed.users : structuredClone(seed.users),
      war: parsed.war ?? structuredClone(seed.war)
    };
  } catch {
    return structuredClone(seed);
  }
}
export async function save(db: DB) {
  // Serialize writes and atomically replace the data file to avoid partial JSON on interruption.
  writeQueue = writeQueue.then(async () => {
    const temp = `${file}.tmp`;
    await writeFile(temp, JSON.stringify(db, null, 2), 'utf8');
    await rename(temp, file);
  });
  return writeQueue;
}
export const newId = () => nanoid(10);
