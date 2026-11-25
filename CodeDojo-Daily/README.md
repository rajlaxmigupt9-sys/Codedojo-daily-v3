# CodeDojo Daily — DailyDebug Derby (Version 3)

**Version 3** is an improved classroom-ready iteration of CodeDojo Daily. It keeps the original daily coding + team competition concept and adds a cleaner visual identity, reusable backend validation/scoring services, request throttling, and automated backend unit tests.

## What Version 3 improves

- **New visual identity:** Midnight Ocean surfaces with mint-teal primary actions, orchid secondary accents and warm amber status highlights. The previous lime-green accent system has been replaced throughout the interface.
- **Backend separation:** request validation and leaderboard scoring are moved into dedicated service modules instead of being embedded in Express route handlers.
- **Input validation:** team names, student labels, problem IDs and submitted source code are checked centrally. Submission code is limited to 50 KB.
- **Request throttling:** lightweight per-IP/per-route limits reduce accidental or abusive request bursts in the single-process classroom demo.
- **Automated tests:** built-in Node test-runner checks cover input validation, team-name rules, duplicate-solve detection and leaderboard calculations.
- **Duplicate scoring protection:** the leaderboard counts unique member/problem solves, and the API rejects a second accepted submission for the same member/problem pair.
- **Existing strengths retained:** 25 curated problems, five test cases per problem, searchable tags/difficulty, Monaco editor, Web Worker JavaScript runner with timeout, teams, leaderboard, Team War, progressive hints, activity heatmap and responsive layout.

## Evaluation report action plan

| Evaluator category | Version 3 response |
|---|---|
| Requirements fulfilment | Keeps the 25-problem catalogue, five test cases, daily challenge, team roster, leaderboard and progress views. |
| Code quality | Adds reusable validation/scoring services and automated tests. |
| Functionality & reliability | Adds central input checks, bounded payloads, rate limits and tested scoring helpers. |
| System design & architecture | Separates validation and scoring from API route handlers. |
| Security & robustness | Adds request throttling, stricter payload limits and safer input normalization. Full user authentication and server-side execution isolation remain required before public deployment. |
| Innovation & technical complexity | Retains Team War, progressive hints, similarity helper and contribution heatmap. |

## Technology

- Frontend: React 18, TypeScript, Vite, Monaco Editor, Lucide icons and custom responsive CSS.
- Backend: Node.js, Express and TypeScript.
- Persistence: atomic JSON file store in `backend/src/data/db.json`.
- Tests: Node.js built-in test runner through `tsx`.
- Code evaluation: JavaScript runs in a browser Web Worker with a 2-second timeout. Python is an editor mode only in this demo.

## Run on Windows / VS Code

Requirements: Node.js 20+ and npm.

1. Extract the ZIP file.
2. Open the extracted `CodeDojo-Daily` folder in VS Code.
3. Open Terminal → New Terminal.
4. Install root dependencies:

   ```powershell
   npm install
   ```

5. Install frontend and backend dependencies:

   ```powershell
   npm run install:all
   ```

6. Start both servers:

   ```powershell
   npm run dev
   ```

7. Open `http://localhost:5173`. The API runs at `http://localhost:4000`.

Stop the servers with `Ctrl + C`.

## Run tests and build

From the project root:

```powershell
npm run test --prefix backend
npm run typecheck --prefix backend
npm run build
```

The test suite verifies validation and scoring logic. These tests are not a substitute for end-to-end browser testing.

## Demo walkthrough

1. Open Overview and choose the daily challenge.
2. Open **Two Sum Variant** and inspect its statement, constraints and examples.
3. Use the JavaScript starter solution and run the five test cases.
4. Submit an accepted solution once; the backend records the first accepted solve.
5. Open Teams to create or join a squad (maximum four members).
6. Open Leaderboard and show the score and roster bonus.
7. Open Team War to demonstrate the shared 60-minute countdown.
8. Open Activity to show the contribution-style activity heatmap.

## Important limitations — explain these honestly in the viva

- **Authentication:** this classroom prototype still uses a demo student identity; it does not yet provide secure account registration, password login, or per-user authorization. Do not expose it to the public internet as-is.
- **Execution trust boundary:** the JavaScript code runs in a browser Web Worker. This keeps the interface responsive and permits a timeout, but a Web Worker is not a hardened security sandbox. A public judge needs isolated server-side containers with CPU, memory, filesystem and network restrictions.
- **Submission trust:** the current demo receives the evaluation status from the browser. A production judge must independently run hidden tests on the server before awarding points.
- **Python:** Python syntax editing is available, but execution is not implemented in this local demo. Use JavaScript for the working test runner.
- **Database:** the current store is atomic JSON-file persistence, not SQLite/PostgreSQL. It is suitable for a single-instance classroom demonstration, not concurrent multi-instance deployment. SQLite migration and backups are recommended next steps.
- **AI hints:** hints are curated progressive clues, not generated by an external AI model.
- **Similarity checker:** Levenshtein similarity is only a review signal; it is not proof of plagiarism.
- **Rate limiting:** throttling is in-memory and per process. Production deployment should use a shared store (for example Redis) behind HTTPS.

## Project structure

```text
CodeDojo-Daily/
├── frontend/
│   ├── src/App.tsx
│   ├── src/styles.css
│   ├── src/utils/runner.ts
│   └── ...
├── backend/
│   ├── src/data/problems.ts
│   ├── src/data/problems.json
│   ├── src/services/store.ts
│   ├── src/services/validation.ts
│   ├── src/services/scoring.ts
│   ├── src/services/validation.test.ts
│   ├── src/services/scoring.test.ts
│   └── src/server.ts
├── package.json
└── README.md
```

## API routes

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | API health |
| GET | `/api/problems` | Problem catalogue |
| GET | `/api/daily` | Daily rotating challenge |
| GET | `/api/problems/:id` | Problem details |
| GET/POST | `/api/teams` | List/create squads |
| POST | `/api/teams/:id/join` | Join a squad |
| POST | `/api/teams/:id/leave` | Leave a squad |
| GET | `/api/leaderboard` | Team score aggregation |
| GET/POST | `/api/submissions` | Submission history / record submission |
| GET | `/api/stats` | Demo student progress |
| GET/POST | `/api/war` | Read shared Team War state / start or end sprint |

---

**Project:** CodeDojo Daily — DailyDebug Derby  
**Release:** Version 3  
**Purpose:** College mini-project / hackathon prototype
