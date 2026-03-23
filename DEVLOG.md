# Sales Call AI — Dev Log

---

## Session 1 — Day 1 & Day 2
**Date:** March 23, 2026  
**Developer:** Oscar Landrum  
**GitHub:** https://github.com/oscarlandrum/sales-call-ai

---

## Day 1 — Environment Setup

### Completed
- Signed up for Deepgram (deepgram.com) — API key obtained
- Signed up for Anthropic API (console.anthropic.com) — API key obtained
- Confirmed Node.js v22.22.1 already installed
- Confirmed npm v10.9.4 already installed
- Installed VS Code
- Created project folder: `~/sales-call-ai`
- Ran `npm init -y` — package.json created successfully
- Installed BlackHole 2ch audio driver (existential.audio/blackhole)
- Restarted Mac to complete BlackHole install

### Verification Results
| Check | Result |
|-------|--------|
| `node -v` | v22.22.1 |
| `npm -v` | 10.9.4 |
| BlackHole 2ch | Confirmed via system_profiler |
| sales-call-ai folder | Confirmed in ~/ |

### Day 1 Notes
- BlackHole installs silently — no app opens after install, that is normal
- Must restart Mac after BlackHole install for driver to register
- Terminal quote trap: never run two commands on one line with quotes. Always run one at a time

---

## Day 2 — Transcription Proof of Concept

### Completed
- Installed Deepgram SDK v3.0.0
- Installed dotenv for secure key management
- Installed SoX via Homebrew for mic audio capture
- Created index.js — live transcription script
- Successfully connected to Deepgram API
- Live mic transcription working — words appearing in terminal in real time
- Speaker diarization enabled
- API keys moved to .env file
- .env added to .gitignore
- Project pushed to GitHub cleanly with no exposed keys
- DEVLOG.md added to project

### Issues & Fixes

---

**Issue 1 — Terminal quote trap**  
Running two commands on one line caused Terminal to enter a `quote>` waiting state and hang.
```
touch index.js
open -a "Visual Studio Code" .   ← ran together, caused hang
```
*Fix:* Always run commands one at a time. Hit `Ctrl + C` to escape the quote trap.

---

**Issue 2 — SDK version mismatch (v5)**  
Initially installed `@deepgram/sdk` which pulled v5.0.0. The `createClient` function was listed in exports but threw `TypeError: createClient is not a function` at runtime.  
*Fix:* Inspected actual exports with:
```
node -e "console.log(Object.keys(require('@deepgram/sdk')))"
```
v5 had restructured internals. Downgraded to v3.0.0 which has stable `createClient` and `LiveTranscriptionEvents` exports:
```
npm uninstall @deepgram/sdk
npm install @deepgram/sdk@3.0.0
```

---

**Issue 3 — API key syntax errors**  
Two separate syntax errors caused by incorrect key formatting:
- First error: pasted key without quotes → `SyntaxError: Invalid or unexpected token`
- Second error: removed quotes entirely → same error

*Fix:* Key must always be wrapped in quotes:
```javascript
const DEEPGRAM_API_KEY = "your_key_here";
```

---

**Issue 4 — Extra text pasted into index.js**  
Copying code from chat into VS Code accidentally included instruction text alongside the code, causing syntax errors.  
*Fix:* Use Terminal `cat > index.js << 'EOF' ... EOF` method to write files directly instead of copy-pasting into VS Code. Cleaner, no stray characters.

---

**Issue 5 — Audio format mismatch**  
SOX captured audio at 48000hz stereo by default but the Deepgram config specified 16000hz mono. Connection dropped immediately with:
```
DeepgramError: Could not send. Connection not open.
```
*Fix:* Match SOX output settings to Deepgram config exactly:
```javascript
encoding: "linear16",
sample_rate: 48000,
channels: 2,
```
And update SOX spawn arguments:
```javascript
sox ["-d", "-r", "48000", "-c", "2", "-b", "16", "-e", "signed-integer", "-t", "raw", "-"]
```
Also added connection state guard before sending chunks:
```javascript
if (connection.getReadyState() === 1) { connection.send(chunk); }
```
And keepAlive ping every 5 seconds to maintain connection:
```javascript
setInterval(() => {
  if (connection.getReadyState() === 1) { connection.keepAlive(); }
}, 5000);
```

---

**Issue 6 — API key exposed on GitHub**  
Hardcoded Deepgram API key was committed directly in index.js and pushed to the public GitHub repo.  
*Fix (immediate):*
- Revoked the exposed key on Deepgram dashboard immediately
- Generated a new Deepgram API key
- Installed dotenv: `npm install dotenv`
- Created `.env` file with real keys — never committed to GitHub
- Added `.env` to `.gitignore`
- Updated index.js line 1: `require("dotenv").config();`
- Updated key reference: `const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;`
- Wiped git history entirely and force pushed clean repo:
```
rm -rf .git
git init
git add .
git commit -m "Day 1-2: live transcription working, keys in .env"
git branch -M main
git remote add origin https://github.com/oscarlandrum/sales-call-ai.git
git push -u origin main
```

*Rule going forward:* NEVER hardcode API keys in any file. Always use `.env` from day one.

---

**Issue 7 — GitHub password authentication rejected**  
Running `git push` prompted for GitHub password. Entering the actual GitHub account password returned:
```
remote: Invalid username or token. Password authentication is not supported.
```
*Fix:* GitHub requires a Personal Access Token (PAT) instead of a password for Git operations.  
To generate: github.com → Settings → Developer Settings → Personal Access Tokens → Tokens (classic) → Generate new token → check `repo` scope → add a Note (required) → Generate.  
Use the generated token as the password when prompted. Save it in a password manager — GitHub only shows it once.

Also run this so macOS saves it going forward:
```
git config --global credential.helper osxkeychain
```

---

## Current Working State

### index.js
- Loads env vars via dotenv
- Connects to Deepgram nova-2 model
- Captures mic audio via SoX at 48000hz stereo
- Streams audio chunks to Deepgram in real time
- Prints final transcripts to terminal with speaker label
- Keeps connection alive with 5-second ping
- Guards against sending on closed connection

### .env (local only, never on GitHub)
```
DEEPGRAM_API_KEY=your_real_key
ANTHROPIC_API_KEY=your_real_key
```

### .gitignore
```
node_modules/
.env
*.env
```

### To Run
```
cd ~/sales-call-ai
node index.js
```
Press `Ctrl + C` to stop.

---

## File Structure
```
sales-call-ai/
├── .env              (local only — never push this)
├── .gitignore
├── DEVLOG.md
├── index.js          (live transcription — working)
├── package.json
├── package-lock.json
└── node_modules/
```

---

## Up Next — Day 3
- Install Anthropic SDK: `npm install @anthropic-ai/sdk`
- Write system prompt with 9-stage call workflow + objection handles
- Add client context injection (prospect name, business type, funding goal)
- Every 8 seconds send last 3 lines of transcript to Claude
- Claude returns real-time suggestions to terminal
- Test with mock prospect objection scenarios

---

## Git Identity Setup (one time)
```
git config --global user.name "Oscar Landrum"
git config --global user.email "landrumoscar@gmail.com"
git config --global credential.helper osxkeychain
```

---

## Key Reminders
- Never hardcode API keys — always use .env
- Always run Terminal commands one at a time
- Use `cat > file.js << 'EOF' ... EOF` to write files from Terminal — avoids VS Code paste issues
- GitHub PAT expires April 22, 2026 — generate a new one before then
- Deepgram free tier has usage limits — monitor dashboard during heavy testing