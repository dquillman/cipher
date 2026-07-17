# HAL — your brain, on the line

A HAL 9000 / JARVIS–style console for Claude, wired into your **second brain**: a
folder of your own notes that HAL can search, read, and (when you ask) write to.

It's a thin, self-contained wrapper — one personality, a handful of safe note
tools, and a streaming chat loop. Not part of the CipherExam app; it's a
standalone assistant for *you*.

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
# Chat, using the sample brain in ./brain
python hal.py

# Point at your real notes
python hal.py --brain "~/2nd Brain"

# One-shot question (no REPL)
python hal.py "what did I note about the exam pass?"

# "Expert of THIS folder" mode — treat a code/project dir as the brain
python hal.py app --dir /path/to/project
```

On Windows, double-click `hal.bat`. On macOS/Linux, `./hal.sh`.

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

## REPL commands

`/brain` (location & stats) · `/notes` (list) · `/reset` (forget the chat, brain
untouched) · `/help` · `/exit`

## Safety

Every note path HAL touches is confined to the brain directory — traversal
outside it is refused. HAL streams its replies and shows a short line whenever it
consults the brain, so you can always see what it read or wrote.
