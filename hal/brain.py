"""Brain — HAL's access layer to your "2nd Brain".

A brain is just a directory of notes (Markdown, text, anything). This module
gives HAL a small, safe surface for reading, searching, and writing those notes.
Every path the model supplies is confined to the brain directory; traversal
outside it (``..``, absolute paths, symlinks that escape) is rejected.
"""

from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

# Files we treat as readable text. Everything else is listed but not opened.
TEXT_SUFFIXES = {
    ".md", ".markdown", ".txt", ".text", ".org", ".rst",
    ".json", ".yaml", ".yml", ".toml", ".csv", ".log",
    ".py", ".js", ".ts", ".sh", ".html", ".css",
}

# Directories we never descend into.
IGNORE_DIRS = {".git", ".obsidian", "node_modules", "__pycache__", ".trash", ".DS_Store"}

MAX_READ_BYTES = 200_000  # per note, to keep a single read from blowing the context


@dataclass
class SearchHit:
    path: str          # brain-relative path
    line_no: int       # 1-indexed line of the match
    snippet: str       # the matching line, trimmed


class BrainError(Exception):
    """Raised for anything the caller did wrong (bad path, missing note, …)."""


class Brain:
    """A directory of notes that HAL can read from and write to."""

    def __init__(self, root: str | os.PathLike) -> None:
        self.root = Path(root).expanduser().resolve()
        self.root.mkdir(parents=True, exist_ok=True)

    # -- path safety -------------------------------------------------------

    def _resolve(self, rel: str, *, must_exist: bool = False) -> Path:
        """Resolve a brain-relative path, refusing anything outside the brain."""
        if rel is None:
            raise BrainError("no path given")
        rel = str(rel).strip().lstrip("/\\")
        candidate = (self.root / rel).resolve()
        if candidate != self.root and self.root not in candidate.parents:
            raise BrainError(f"path escapes the brain: {rel!r}")
        if must_exist and not candidate.exists():
            raise BrainError(f"no such note: {rel!r}")
        return candidate

    def _rel(self, path: Path) -> str:
        return path.relative_to(self.root).as_posix()

    # -- reading -----------------------------------------------------------

    def list_notes(self, subdir: str = "") -> list[str]:
        """Return every note path under ``subdir`` (recursively), sorted."""
        base = self._resolve(subdir) if subdir else self.root
        if not base.exists():
            raise BrainError(f"no such folder: {subdir!r}")
        out: list[str] = []
        for dirpath, dirnames, filenames in os.walk(base):
            dirnames[:] = [d for d in dirnames if d not in IGNORE_DIRS]
            for name in filenames:
                if name.startswith("."):
                    continue
                out.append(self._rel(Path(dirpath) / name))
        return sorted(out)

    def read_note(self, path: str) -> str:
        """Return the text of a single note."""
        p = self._resolve(path, must_exist=True)
        if p.is_dir():
            raise BrainError(f"{path!r} is a folder, not a note")
        if p.suffix.lower() not in TEXT_SUFFIXES:
            raise BrainError(f"{path!r} is not a readable text note ({p.suffix})")
        data = p.read_bytes()[:MAX_READ_BYTES]
        text = data.decode("utf-8", errors="replace")
        if p.stat().st_size > MAX_READ_BYTES:
            text += f"\n\n[... truncated at {MAX_READ_BYTES} bytes ...]"
        return text

    def search(self, query: str, max_results: int = 25) -> list[SearchHit]:
        """Case-insensitive substring search across all text notes."""
        if not query or not query.strip():
            raise BrainError("empty search query")
        needle = query.lower()
        hits: list[SearchHit] = []
        for rel in self.list_notes():
            p = self.root / rel
            if p.suffix.lower() not in TEXT_SUFFIXES:
                continue
            try:
                text = p.read_bytes()[:MAX_READ_BYTES].decode("utf-8", errors="replace")
            except OSError:
                continue
            for i, line in enumerate(text.splitlines(), start=1):
                if needle in line.lower():
                    snippet = line.strip()
                    if len(snippet) > 240:
                        snippet = snippet[:240] + "…"
                    hits.append(SearchHit(rel, i, snippet))
                    if len(hits) >= max_results:
                        return hits
        return hits

    # -- writing -----------------------------------------------------------

    def write_note(self, path: str, content: str) -> str:
        """Create or overwrite a note. Returns the brain-relative path written."""
        p = self._resolve(path)
        if p.suffix == "":
            p = p.with_suffix(".md")
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(content, encoding="utf-8")
        return self._rel(p)

    def append_note(self, path: str, content: str) -> str:
        """Append to a note (creating it if needed). Returns the path written."""
        p = self._resolve(path)
        if p.suffix == "":
            p = p.with_suffix(".md")
        p.parent.mkdir(parents=True, exist_ok=True)
        prefix = "" if not p.exists() or p.read_text(encoding="utf-8", errors="replace").endswith("\n") else "\n"
        with p.open("a", encoding="utf-8") as fh:
            fh.write(prefix + content + ("" if content.endswith("\n") else "\n"))
        return self._rel(p)

    # -- summary -----------------------------------------------------------

    def stats(self) -> dict:
        notes = self.list_notes()
        readable = [n for n in notes if Path(n).suffix.lower() in TEXT_SUFFIXES]
        return {"root": str(self.root), "notes": len(notes), "readable": len(readable)}
