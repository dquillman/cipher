#!/usr/bin/env python3
"""HAL — a HAL 9000 / JARVIS-style console for Claude, wired into your 2nd Brain.

HAL is a thin, personable wrapper around the Claude API. It talks like a calm
onboard AI, and it can reach into a folder of your notes (your "brain") to search,
read, and — when you ask — write things down for you.

Usage:
    python hal.py                       # chat, brain = ./brain
    python hal.py --brain "~/2nd Brain" # point at your real brain
    python hal.py "what did I note about the exam pass?"   # one-shot ask
    python hal.py app --dir .           # "expert of THIS folder" mode

Environment:
    ANTHROPIC_API_KEY   your key (or run `ant auth login`)
    HAL_BRAIN_DIR       default brain directory
    HAL_MODEL           model id (default: claude-opus-4-8)
    HAL_EFFORT          low | medium | high | xhigh | max (default: high)
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

try:
    import anthropic
except ImportError:
    sys.exit(
        "The 'anthropic' package is required.\n"
        "Install it with:  pip install -r requirements.txt   (or: pip install anthropic)"
    )

from brain import Brain, BrainError

DEFAULT_MODEL = os.environ.get("HAL_MODEL", "claude-opus-4-8")
DEFAULT_EFFORT = os.environ.get("HAL_EFFORT", "high")
MAX_TOKENS = 16000
MAX_TOOL_TURNS = 40  # safety cap on the agentic loop per user message

# Models offered in the switcher. All share the modern request surface
# (adaptive thinking + effort) that HAL sends, so switching is a drop-in.
MODEL_CHOICES = [
    {"id": "claude-fable-5", "label": "Fable 5 · most capable"},
    {"id": "claude-opus-4-8", "label": "Opus 4.8"},
    {"id": "claude-opus-4-7", "label": "Opus 4.7"},
    {"id": "claude-sonnet-5", "label": "Sonnet 5 · faster"},
]

# ---- terminal styling (no dependencies) ---------------------------------

_USE_COLOR = sys.stdout.isatty() and os.environ.get("NO_COLOR") is None


def _c(code: str, text: str) -> str:
    return f"\033[{code}m{text}\033[0m" if _USE_COLOR else text


def hal_label() -> str:
    return _c("1;36", "HAL")


def you_label() -> str:
    return _c("1;33", "you")


def dim(text: str) -> str:
    return _c("2", text)


# ---- personality ---------------------------------------------------------

SYSTEM_PROMPT = """\
You are HAL — a calm, precise, quietly warm onboard AI in the spirit of HAL 9000 \
and JARVIS. You are the user's personal assistant and the caretaker of their \
"second brain": a folder of their own notes that you can search, read, and write to.

How you speak:
- Composed and understated. Address the user directly ("you"), and by name if you learn it.
- Brief by default. Lead with the answer, then the detail. No filler, no theatrics, \
no "As an AI" throat-clearing.
- Confident but honest. If the brain doesn't contain something, say so plainly rather \
than inventing it.

How you work:
- The brain is the user's ground truth about their own life, projects, and decisions. \
Before answering questions about what they've thought, planned, decided, or recorded, \
search or read the brain rather than guessing.
- Use search_brain to find things, read_note to pull the full text, list_notes to \
orient yourself.
- Only write to the brain (write_note / append_note) when the user asks you to capture, \
save, log, or note something — or clearly wants a record kept. Confirm what you wrote \
and where. Never silently overwrite; prefer appending to a daily/topic note when capturing.
- When you use the brain, weave what you found into a natural answer and cite the note \
path(s) you drew from, e.g. "(from projects/exam-pass.md)".

You are a wrapper the user built to give Claude a memory of their own making. Treat that \
brain as trusted, personal, and worth being careful with."""

APP_SYSTEM_SUFFIX = """\

You are also running in "app expert" mode: the brain you have been given IS a software \
project directory. Act as an expert on this specific codebase — its structure, purpose, \
and conventions. Read files to answer questions accurately about how it works."""


# ---- tool definitions ----------------------------------------------------

TOOLS = [
    {
        "name": "search_brain",
        "description": (
            "Search the user's brain (their notes) for a word or phrase. "
            "Case-insensitive substring match across all text notes. "
            "Use this first when the user asks what they've thought, planned, decided, "
            "or written about something."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "Text to search for."},
                "max_results": {"type": "integer", "description": "Max hits (default 25)."},
            },
            "required": ["query"],
        },
    },
    {
        "name": "read_note",
        "description": "Read the full text of a single note by its brain-relative path.",
        "input_schema": {
            "type": "object",
            "properties": {
                "path": {"type": "string", "description": "Brain-relative path, e.g. 'projects/plan.md'."},
            },
            "required": ["path"],
        },
    },
    {
        "name": "list_notes",
        "description": "List note paths in the brain, optionally scoped to a subfolder.",
        "input_schema": {
            "type": "object",
            "properties": {
                "subdir": {"type": "string", "description": "Optional subfolder to list. Omit for the whole brain."},
            },
        },
    },
    {
        "name": "write_note",
        "description": (
            "Create or overwrite a note. Only use when the user asks you to save/capture "
            "something as a new note. Overwrites if the path exists — prefer append_note for logs."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "path": {"type": "string", "description": "Brain-relative path. '.md' is added if no extension."},
                "content": {"type": "string", "description": "The full note content."},
            },
            "required": ["path", "content"],
        },
    },
    {
        "name": "append_note",
        "description": (
            "Append text to a note (creating it if it doesn't exist). Best for journals, "
            "daily logs, and running capture. Use when the user says to jot/log/add something."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "path": {"type": "string", "description": "Brain-relative path to append to."},
                "content": {"type": "string", "description": "Text to append."},
            },
            "required": ["path", "content"],
        },
    },
]


def run_tool(brain: Brain, name: str, args: dict) -> tuple[str, bool]:
    """Execute a brain tool. Returns (result_text, is_error)."""
    try:
        if name == "search_brain":
            hits = brain.search(args["query"], int(args.get("max_results", 25)))
            if not hits:
                return f"No notes matched {args['query']!r}.", False
            lines = [f"{h.path}:{h.line_no}: {h.snippet}" for h in hits]
            return "\n".join(lines), False
        if name == "read_note":
            return brain.read_note(args["path"]), False
        if name == "list_notes":
            notes = brain.list_notes(args.get("subdir", ""))
            if not notes:
                return "(the brain is empty)", False
            return "\n".join(notes), False
        if name == "write_note":
            written = brain.write_note(args["path"], args["content"])
            return f"Wrote {written} ({len(args['content'])} chars).", False
        if name == "append_note":
            written = brain.append_note(args["path"], args["content"])
            return f"Appended to {written}.", False
        return f"Unknown tool: {name}", True
    except BrainError as e:
        return f"Error: {e}", True
    except Exception as e:  # pragma: no cover - defensive
        return f"Unexpected error running {name}: {e}", True


# ---- the conversation loop ----------------------------------------------

class Hal:
    def __init__(self, brain: Brain, *, model: str, effort: str, system: str) -> None:
        self.client = anthropic.Anthropic()
        self.brain = brain
        self.model = model
        self.effort = effort
        self.system = system
        self.messages: list[dict] = []

    def _create_kwargs(self) -> dict:
        return {
            "model": self.model,
            "max_tokens": MAX_TOKENS,
            "system": self.system,
            "tools": TOOLS,
            "thinking": {"type": "adaptive"},
            "output_config": {"effort": self.effort},
            "messages": self.messages,
        }

    def stream(self, user_text: str):
        """Run one user turn and yield UI-agnostic events.

        Events (dicts): {type: "tool_use", name}, {type: "tool_result", name,
        summary, is_error}, {type: "text", text}, {type: "final", text},
        {type: "error", message}. Every UI (terminal, web) consumes this same
        stream, so the brain logic lives in exactly one place.
        """
        turn_start = len(self.messages)
        self.messages.append({"role": "user", "content": user_text})
        final_text_parts: list[str] = []

        try:
            for _ in range(MAX_TOOL_TURNS):
                with self.client.messages.stream(**self._create_kwargs()) as stream:
                    for event in stream:
                        if event.type == "content_block_start" and event.content_block.type == "tool_use":
                            yield {"type": "tool_use", "name": event.content_block.name}
                        elif event.type == "content_block_delta" and event.delta.type == "text_delta":
                            yield {"type": "text", "text": event.delta.text}
                    response = stream.get_final_message()

                self.messages.append({"role": "assistant", "content": response.content})
                final_text_parts = [b.text for b in response.content if b.type == "text"]

                if response.stop_reason != "tool_use":
                    break

                tool_results = []
                for block in response.content:
                    if block.type == "tool_use":
                        result, is_error = run_tool(self.brain, block.name, dict(block.input))
                        yield {
                            "type": "tool_result",
                            "name": block.name,
                            "summary": (result.splitlines()[0][:120] if result else "ok"),
                            "is_error": is_error,
                        }
                        tool_results.append({
                            "type": "tool_result",
                            "tool_use_id": block.id,
                            "content": result,
                            "is_error": is_error,
                        })
                self.messages.append({"role": "user", "content": tool_results})
            else:
                yield {"type": "error", "message": "stopped: too many tool turns"}
        except anthropic.APIError as e:
            # Discard the whole failed turn so history never ends on a dangling
            # tool_use (which would 400 the next request).
            del self.messages[turn_start:]
            yield {"type": "error", "message": str(e)}
            return

        yield {"type": "final", "text": "\n".join(final_text_parts).strip()}

    def ask(self, user_text: str) -> str:
        """Terminal renderer: consume the event stream and print it. Returns final text."""
        printed_label = False
        final = ""
        for ev in self.stream(user_text):
            if ev["type"] == "tool_use":
                if printed_label:
                    print()
                    printed_label = False
                print(dim(f"  · consulting the brain ({ev['name']})…"))
            elif ev["type"] == "tool_result":
                mark = "!" if ev["is_error"] else "↳"
                print(dim(f"    {mark} {ev['name']}: {ev['summary']}"))
            elif ev["type"] == "text":
                if not printed_label:
                    print(f"{hal_label()}: ", end="", flush=True)
                    printed_label = True
                print(ev["text"], end="", flush=True)
            elif ev["type"] == "error":
                if printed_label:
                    print()
                    printed_label = False
                print(_c("31", f"  ⚠ {ev['message']}"))
            elif ev["type"] == "final":
                final = ev["text"]
        if printed_label:
            print()
        return final


# ---- entry points --------------------------------------------------------

BANNER = r"""
   ┌─────────────────────────────────────────────┐
   │   H A L   ·   your brain, on the line        │
   └─────────────────────────────────────────────┘
"""


def ensure_api_key() -> None:
    if os.environ.get("ANTHROPIC_API_KEY"):
        return
    # The SDK also resolves `ant auth login` profiles; only warn, don't block.
    print(dim("Note: ANTHROPIC_API_KEY is not set. Relying on an `ant auth login` "
              "profile if you have one; otherwise set the key and retry.\n"))


def build_hal(args) -> Hal:
    roots: list[str] = []
    if args.brain:
        roots += args.brain  # nargs='+' → list
    if getattr(args, "dir", None):
        roots.append(args.dir)
    if not roots:
        env = os.environ.get("HAL_BRAIN_DIR")
        if env:
            roots += [p for p in env.split(os.pathsep) if p.strip()]
    if not roots:
        roots = [str(Path(__file__).parent / "brain")]
    brain = Brain(roots)
    system = SYSTEM_PROMPT + (APP_SYSTEM_SUFFIX if getattr(args, "mode", None) == "app" else "")
    if len(brain.order) > 1:
        system += ("\n\nYou currently have access to several projects: "
                   + ", ".join(brain.order)
                   + ". Each file is addressed as <project>/<path>. When you cite or "
                   "write a file, include the project prefix.")
    return Hal(brain, model=args.model, effort=args.effort, system=system)


def repl(hal: Hal) -> None:
    if _USE_COLOR:
        print(_c("36", BANNER))
    else:
        print(BANNER)
    s = hal.brain.stats()
    print(dim(f"  brain: {s['root']}  ·  {s['notes']} notes ({s['readable']} readable)  ·  model: {hal.model}"))
    print(dim("  type your message, or /help for commands. Ctrl-D or /exit to leave.\n"))

    print(f"{hal_label()}: Good to see you. I'm listening — and I've got your notes in front of me.\n")

    while True:
        try:
            line = input(f"{you_label()}: ").strip()
        except (EOFError, KeyboardInterrupt):
            print(f"\n{hal_label()}: Signing off. I'll keep everything just as you left it.")
            return
        if not line:
            continue
        if line in ("/exit", "/quit", "/q"):
            print(f"{hal_label()}: Signing off.")
            return
        if line == "/help":
            print(dim("  /brain          show brain location & stats\n"
                      "  /notes          list notes\n"
                      "  /model [id]     show or switch the model\n"
                      "  /models         list model choices\n"
                      "  /reset          forget this conversation (brain is untouched)\n"
                      "  /exit           leave"))
            continue
        if line == "/models":
            for m in MODEL_CHOICES:
                mark = "•" if m["id"] == hal.model else " "
                print(dim(f"  {mark} {m['id']:20s} {m['label']}"))
            continue
        if line == "/model" or line.startswith("/model "):
            arg = line[len("/model"):].strip()
            if not arg:
                print(dim(f"  current model: {hal.model}  (use /model <id>, /models to list)"))
            else:
                hal.model = arg
                print(dim(f"  model set to {hal.model} (takes effect next message)."))
            continue
        if line == "/brain":
            print(dim(f"  {json.dumps(hal.brain.stats(), indent=2)}"))
            continue
        if line == "/notes":
            notes = hal.brain.list_notes()
            print(dim("  " + ("\n  ".join(notes) if notes else "(empty)")))
            continue
        if line == "/reset":
            hal.messages.clear()
            print(dim("  conversation cleared."))
            continue
        try:
            hal.ask(line)
        except anthropic.APIError as e:
            print(_c("31", f"\n  API error: {e}"))
        print()


def launch_web(hal: Hal, *, host: str, port: int, open_browser: bool) -> int:
    """Start the JARVIS web UI (local HUD in the browser)."""
    import server  # local module
    return server.serve(hal, host=host, port=port, open_browser=open_browser)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="HAL — a Claude console wired into your 2nd Brain.")
    parser.add_argument("mode", nargs="?", default="chat", choices=["chat", "app"],
                        help="'chat' (default) or 'app' (expert of a code/project folder).")
    parser.add_argument("prompt", nargs="*", help="Optional one-shot question.")
    parser.add_argument("--ui", default=os.environ.get("HAL_UI", "terminal"),
                        choices=["terminal", "jarvis", "web"],
                        help="Which interface to open: 'terminal' (default) or 'jarvis'/'web' (browser HUD).")
    parser.add_argument("--brain", nargs="+",
                        help="One or more project folders HAL can access (space-separated).")
    parser.add_argument("--dir", help="In 'app' mode, the project folder to be expert on.")
    parser.add_argument("--model", default=DEFAULT_MODEL, help=f"Model id (default {DEFAULT_MODEL}).")
    parser.add_argument("--effort", default=DEFAULT_EFFORT, help=f"Reasoning effort (default {DEFAULT_EFFORT}).")
    parser.add_argument("--host", default=os.environ.get("HAL_HOST", "127.0.0.1"), help="Web UI host.")
    parser.add_argument("--port", type=int, default=int(os.environ.get("HAL_PORT", "8765")), help="Web UI port.")
    parser.add_argument("--no-browser", action="store_true", help="Don't auto-open the browser (web UI).")
    args = parser.parse_args(argv)

    ensure_api_key()
    hal = build_hal(args)

    if args.prompt:
        hal.ask(" ".join(args.prompt))
        return 0

    if args.ui in ("jarvis", "web"):
        return launch_web(hal, host=args.host, port=args.port, open_browser=not args.no_browser)

    repl(hal)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
