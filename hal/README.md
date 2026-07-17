# HAL — your brain, on the line

A HAL 9000 / JARVIS–style assistant built on Claude, wired into your **second
brain**: a folder of your own notes that HAL can search, read, and (when you ask)
write to.

It's a thin, self-contained wrapper — one personality, a handful of safe note
tools, and a streaming chat loop — with **two interchangeable interfaces**:

- **Terminal** — a fast, glowing text console (default).
- **JARVIS UI** — a browser HUD with an animated arc-reactor core, streaming
  replies, voice in/out, a live skin switcher (**JARVIS · HAL 9000 · Minimal**),
  a **model switcher**, and a **3D brain map** of your notes.

Both front-ends drive the *same* brain logic (`Hal.stream`), so switching UI
never changes how HAL thinks. Not part of the CipherExam app; it's a standalone
assistant for *you*.

## Setup

```bash
cd hal
pip install -r requirements.txt

# Authenticate (either one):
export ANTHROPIC_API_KEY=sk-ant-...      # an API key
#   ...or run `ant auth login` once and skip the export
```

## Run

```bash
# Terminal console, using the sample brain in ./brain
python hal.py

# JARVIS browser UI (opens automatically)
python hal.py --ui jarvis

# Give HAL your real notes — or SEVERAL projects at once
python hal.py --ui jarvis --brain "~/2nd Brain"
python hal.py --ui jarvis --brain "~/2nd Brain" "~/projects/cipher" "~/work/docs"

# One-shot question (no UI)
python hal.py "what did I note about the exam pass?"

# "Expert of THIS folder" mode — treat a code/project dir as the brain
python hal.py app --dir /path/to/project
```

On Windows, double-click `hal.bat` (terminal) or `jarvis.bat` (browser HUD).
On macOS/Linux, `./hal.sh` or `./jarvis.sh`.

### Switching UI

- **At launch:** `--ui terminal` (default) or `--ui jarvis`. You can also set
  `HAL_UI=jarvis` in your environment.
- **Live, in the browser:** use the **JARVIS / HAL 9000 / Minimal** switcher in
  the top-right of the HUD. Your choice is remembered.

The JARVIS UI runs a small local web server (stdlib only, no extra installs) on
`127.0.0.1:8765` by default — change it with `--host` / `--port`. Voice input
(speech-to-text) and spoken replies use your browser's built-in Web Speech API;
toggle them with the **VOICE** and **SPEAK** buttons.

### Switching model

Pick the model live from the dropdown at the top of the JARVIS UI — Fable 5,
Opus 4.8, Opus 4.7, or Sonnet 5. The change applies to your next message. In the
terminal, use `/model <id>` (or `/models` to list). At launch, `--model <id>` or
`HAL_MODEL`. All offered models share the same request surface HAL uses (adaptive
thinking + effort), so switching is a drop-in.

### 3D brain map

Click **BRAIN 3D** in the top bar to see your notes as an orbiting
force-directed graph:

- **Folders** are diamonds, **notes** are dots, colored by top-level folder.
- **Links** come from folder structure plus references between notes —
  `[[wikilinks]]` and mentions of another note's name.
- **Drag** to orbit, **scroll** to zoom, **hover** for the path, **click** a
  node to preview its contents. From the preview, *Ask HAL about this* jumps back
  to chat with the note teed up. **REBUILD** re-scans the brain; **ROTATE**
  toggles auto-spin.

The graph is drawn with a small self-contained WebGL-free renderer (plain
canvas) — no external libraries, so it works offline.

## Multiple projects at once

The "brain" can be **one or many** root folders — your notes, a code repo, a
docs folder, all together. Pass several to `--brain` (space-separated), or set
`HAL_BRAIN_DIR` to a list joined by your OS path separator (`;` on Windows, `:`
on macOS/Linux).

Each root becomes a **project**, labeled by its folder name, and every file is
addressed as `project/path/...` — so `cipher/functions/index.js` and
`2nd-brain/daily/2026-07-15.md` never collide. Search, chat, and the 3D map span
all projects; each shows as its own colored cluster. Noise folders
(`node_modules`, `.git`, `venv`, `dist`, build output, …) are skipped
automatically. Each project is sandboxed: HAL can't traverse from one into
another except through the project label.

```bash
# Windows
python hal.py --ui jarvis --brain "G:\Users\daveq\2nd Brain" "G:\Users\daveq\source\cipher"
set HAL_BRAIN_DIR=G:\Users\daveq\2nd Brain;G:\Users\daveq\source\cipher

# macOS/Linux
python hal.py --ui jarvis --brain "~/2nd Brain" ~/src/cipher ~/work
export HAL_BRAIN_DIR="$HOME/2nd Brain:$HOME/src/cipher"
```

## What HAL can do with the brain

| Tool | When HAL uses it |
|------|------------------|
| `search_brain` | Find where you've written about something |
| `read_note` | Pull the full text of a note |
| `list_notes` | See what's in the brain |
| `write_note` | Save a new note (only when you ask) |
| `append_note` | Log/journal into an existing note |

HAL searches and reads freely; it only **writes** when you ask it to capture,
log, or save something, and it tells you the path it touched.

## Configuration

| Variable | Default | Meaning |
|----------|---------|---------|
| `ANTHROPIC_API_KEY` | — | Your Claude API key (or use `ant auth login`) |
| `HAL_BRAIN_DIR` | `./brain` | Default brain folder |
| `HAL_MODEL` | `claude-opus-4-8` | Model id |
| `HAL_EFFORT` | `high` | Reasoning effort: `low`…`max` |
| `HAL_UI` | `terminal` | Default interface: `terminal` or `jarvis` |
| `HAL_HOST` / `HAL_PORT` | `127.0.0.1` / `8765` | JARVIS UI address |

## REPL commands

`/brain` (location & stats) · `/notes` (list) · `/reset` (forget the chat, brain
untouched) · `/help` · `/exit`

## Safety

Every note path HAL touches is confined to the brain directory — traversal
outside it is refused. HAL streams its replies and shows a short line whenever it
consults the brain, so you can always see what it read or wrote.
