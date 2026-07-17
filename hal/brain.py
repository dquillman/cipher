"""Brain — HAL's access layer to your notes and projects.

A brain is one *or more* root directories. Each root is a "project": your 2nd
Brain, a code repo, a folder of docs — anything. Every file is addressed as
``<project>/<path>`` (the project label is the root folder's name), so HAL can
span all of them at once without path collisions.

Every path the model supplies is confined to its project's root; traversal
outside it (``..``, absolute paths, symlinks that escape) is rejected.
"""

from __future__ import annotations

import os
import re
from dataclasses import dataclass
from pathlib import Path

WIKILINK = re.compile(r"\[\[([^\]|#]+)")

# Files we treat as readable text. Everything else is listed but not opened.
TEXT_SUFFIXES = {
    # notes / docs
    ".md", ".markdown", ".txt", ".text", ".org", ".rst", ".adoc",
    # data / config
    ".json", ".yaml", ".yml", ".toml", ".ini", ".cfg", ".conf", ".csv", ".tsv",
    ".env", ".log", ".xml", ".properties",
    # code
    ".py", ".js", ".jsx", ".ts", ".tsx", ".sh", ".bash", ".zsh", ".ps1",
    ".html", ".css", ".scss", ".sass", ".vue", ".svelte",
    ".go", ".rs", ".java", ".kt", ".swift", ".rb", ".php",
    ".c", ".h", ".cpp", ".hpp", ".cc", ".cs", ".sql", ".graphql", ".proto",
}

# Directories we never descend into (noise, build output, dependencies, VCS).
IGNORE_DIRS = {
    ".git", ".hg", ".svn", ".obsidian", ".trash",
    "node_modules", "bower_components", "vendor",
    "__pycache__", ".pytest_cache", ".mypy_cache", ".ruff_cache",
    "venv", ".venv", "env", ".env.d",
    "dist", "build", "out", ".next", ".nuxt", ".output", ".svelte-kit",
    "coverage", ".cache", ".parcel-cache", ".turbo",
    "target", "bin", "obj", ".idea", ".vscode", ".gradle", ".terraform",
}

MAX_READ_BYTES = 200_000  # per file, to keep a single read from blowing the context


@dataclass
class SearchHit:
    path: str          # labeled path, e.g. "cipher/functions/x.js"
    line_no: int       # 1-indexed line of the match
    snippet: str       # the matching line, trimmed


class BrainError(Exception):
    """Raised for anything the caller did wrong (bad path, missing note, …)."""


class Brain:
    """One or more project roots that HAL can read from and write to."""

    def __init__(self, roots) -> None:
        if isinstance(roots, (str, os.PathLike)):
            roots = [roots]
        roots = [r for r in roots if str(r).strip()]
        if not roots:
            raise BrainError("a brain needs at least one root directory")
        self.roots: dict[str, Path] = {}
        self.order: list[str] = []
        for r in roots:
            p = Path(r).expanduser().resolve()
            p.mkdir(parents=True, exist_ok=True)
            label = self._unique_label(p.name or "root")
            self.roots[label] = p
            self.order.append(label)
        self.primary = self.order[0]

    # -- labels & path safety ---------------------------------------------

    def _unique_label(self, name: str) -> str:
        base = re.sub(r"[^\w.-]", "_", name) or "root"
        label, i = base, 2
        while label in self.roots:
            label, i = f"{base}-{i}", i + 1
        return label

    def _split(self, path: str) -> tuple[str, Path, str]:
        """Return (label, root_path, relative-within-root) for a labeled path.

        A leading segment matching a known project label selects that root;
        otherwise the whole path is taken relative to the primary root.
        """
        if path is None:
            raise BrainError("no path given")
        norm = str(path).strip().replace("\\", "/").lstrip("/")
        first, _, rest = norm.partition("/")
        if first in self.roots:
            return first, self.roots[first], rest
        return self.primary, self.roots[self.primary], norm

    def _resolve(self, path: str, *, must_exist: bool = False) -> tuple[Path, str, str]:
        label, root, rel = self._split(path)
        candidate = (root / rel).resolve()
        if candidate != root and root not in candidate.parents:
            raise BrainError(f"path escapes the project: {path!r}")
        if must_exist and not candidate.exists():
            raise BrainError(f"no such note: {path!r}")
        return candidate, label, rel

    def _labeled(self, label: str, fs_path: Path) -> str:
        return f"{label}/{fs_path.relative_to(self.roots[label]).as_posix()}"

    # -- reading -----------------------------------------------------------

    def _walk_root(self, label: str, base: Path) -> list[str]:
        out: list[str] = []
        for dirpath, dirnames, filenames in os.walk(base):
            dirnames[:] = [d for d in dirnames if d not in IGNORE_DIRS and not d.startswith(".")]
            for name in filenames:
                if name.startswith("."):
                    continue
                out.append(self._labeled(label, Path(dirpath) / name))
        return out

    def list_notes(self, subdir: str = "") -> list[str]:
        """Return labeled note paths across all projects (or under ``subdir``)."""
        if subdir:
            label, root, rel = self._split(subdir)
            base = (root / rel).resolve()
            if root not in base.parents and base != root:
                raise BrainError(f"path escapes the project: {subdir!r}")
            if not base.exists():
                raise BrainError(f"no such folder: {subdir!r}")
            return sorted(self._walk_root(label, base))
        out: list[str] = []
        for label in self.order:
            out.extend(self._walk_root(label, self.roots[label]))
        return sorted(out)

    def read_note(self, path: str) -> str:
        """Return the text of a single file."""
        p, _, _ = self._resolve(path, must_exist=True)
        if p.is_dir():
            raise BrainError(f"{path!r} is a folder, not a note")
        if p.suffix.lower() not in TEXT_SUFFIXES:
            raise BrainError(f"{path!r} is not a readable text file ({p.suffix})")
        data = p.read_bytes()[:MAX_READ_BYTES]
        text = data.decode("utf-8", errors="replace")
        if p.stat().st_size > MAX_READ_BYTES:
            text += f"\n\n[... truncated at {MAX_READ_BYTES} bytes ...]"
        return text

    def search(self, query: str, max_results: int = 25) -> list[SearchHit]:
        """Case-insensitive substring search across all readable files."""
        if not query or not query.strip():
            raise BrainError("empty search query")
        needle = query.lower()
        hits: list[SearchHit] = []
        for rel in self.list_notes():
            if Path(rel).suffix.lower() not in TEXT_SUFFIXES:
                continue
            p, _, _ = self._resolve(rel)
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
        """Create or overwrite a note. Returns the labeled path written."""
        p, label, _ = self._resolve(path)
        if p.suffix == "":
            p = p.with_suffix(".md")
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(content, encoding="utf-8")
        return self._labeled(label, p)

    def append_note(self, path: str, content: str) -> str:
        """Append to a note (creating it if needed). Returns the labeled path."""
        p, label, _ = self._resolve(path)
        if p.suffix == "":
            p = p.with_suffix(".md")
        p.parent.mkdir(parents=True, exist_ok=True)
        prefix = "" if not p.exists() or p.read_text(encoding="utf-8", errors="replace").endswith("\n") else "\n"
        with p.open("a", encoding="utf-8") as fh:
            fh.write(prefix + content + ("" if content.endswith("\n") else "\n"))
        return self._labeled(label, p)

    # -- summary -----------------------------------------------------------

    def stats(self) -> dict:
        per_root = []
        total = readable = 0
        for label in self.order:
            notes = self._walk_root(label, self.roots[label])
            r = sum(1 for n in notes if Path(n).suffix.lower() in TEXT_SUFFIXES)
            per_root.append({"label": label, "root": str(self.roots[label]), "notes": len(notes), "readable": r})
            total += len(notes)
            readable += r
        summary = str(self.roots[self.primary]) if len(self.order) == 1 else f"{len(self.order)} projects"
        return {"root": summary, "roots": per_root, "notes": total, "readable": readable}

    # -- graph (for the 3D brain view) -------------------------------------

    def graph(self, max_nodes: int = 700) -> dict:
        """Model the brain as a node/edge graph across all projects.

        Nodes: one per folder (a hub) and one per file. Edges: folder→child
        containment, plus file↔file references from ``[[wikilinks]]`` and
        mentions of another file's name. Top-level group is the project label,
        so each project forms its own colored cluster.
        """
        all_notes = self.list_notes()
        notes = all_notes[:max_nodes]

        nodes: list[dict] = []
        ids: dict[str, int] = {}

        def top(path: str) -> str:
            return path.split("/")[0]

        def add(nid: str, label: str, group: str, ntype: str, size: float) -> None:
            if nid in ids:
                return
            ids[nid] = len(nodes)
            nodes.append({"id": nid, "label": label, "group": group, "type": ntype, "size": round(size, 2)})

        folders: set[str] = set()
        for n in notes:
            parts = n.split("/")
            for i in range(len(parts) - 1):
                folders.add("/".join(parts[: i + 1]))
        for f in sorted(folders):
            is_root = "/" not in f
            add("dir:" + f, f.split("/")[-1], top(f), "folder", 4.2 if is_root else 3.2)

        basename_map: dict[str, str] = {}
        for n in notes:
            try:
                size_bytes = self._resolve(n)[0].stat().st_size
            except OSError:
                size_bytes = 0
            radius = max(1.2, min(4.5, 1.2 + size_bytes / 3500))
            add(n, Path(n).stem, top(n), "note", radius)
            if Path(n).suffix.lower() in TEXT_SUFFIXES:
                basename_map[Path(n).stem.lower()] = n

        edges: list[dict] = []
        for n in notes:
            parent = "/".join(n.split("/")[:-1])
            if parent and ("dir:" + parent) in ids:
                edges.append({"source": "dir:" + parent, "target": n, "kind": "contains"})
        for f in folders:
            parent = "/".join(f.split("/")[:-1])
            if parent and ("dir:" + parent) in ids:
                edges.append({"source": "dir:" + parent, "target": "dir:" + f, "kind": "contains"})

        long_names = [b for b in basename_map if len(b) >= 4]
        mention_re = (
            re.compile(r"\b(" + "|".join(re.escape(b) for b in long_names) + r")\b", re.I)
            if long_names else None
        )
        seen_pairs: set[tuple[str, str]] = set()
        for n in notes:
            if Path(n).suffix.lower() not in TEXT_SUFFIXES:
                continue
            try:
                text = self._resolve(n)[0].read_bytes()[:MAX_READ_BYTES].decode("utf-8", "replace")
            except OSError:
                continue
            targets: set[str] = set()
            for m in WIKILINK.finditer(text):
                key = m.group(1).strip().split("/")[-1].lower()
                if key in basename_map:
                    targets.add(basename_map[key])
            if mention_re:
                for m in mention_re.finditer(text):
                    targets.add(basename_map[m.group(1).lower()])
            for t in targets:
                if t == n:
                    continue
                pair = tuple(sorted((n, t)))
                if pair in seen_pairs:
                    continue
                seen_pairs.add(pair)
                edges.append({"source": n, "target": t, "kind": "ref"})

        return {
            "nodes": nodes,
            "edges": edges,
            "truncated": len(all_notes) > len(notes),
            "counts": {"notes": sum(1 for x in nodes if x["type"] == "note"),
                       "folders": sum(1 for x in nodes if x["type"] == "folder"),
                       "edges": len(edges)},
        }
