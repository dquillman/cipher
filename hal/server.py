"""server — the local web backend for HAL's JARVIS UI.

Stdlib only. Serves the single-page HUD from ``ui/`` and exposes:

    GET  /api/state          → { model, effort, brain: {...} }
    POST /api/chat  {message} → newline-delimited JSON event stream
    GET  /api/notes          → { notes: [...] }

The chat endpoint drives the same ``Hal.stream`` generator the terminal uses,
so the two UIs are just different front-ends over one brain.
"""

from __future__ import annotations

import json
import threading
import webbrowser
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

UI_DIR = Path(__file__).parent / "ui"

# One conversation, one lock — this is a personal, single-user local tool.
_lock = threading.Lock()


def serve(hal, *, host: str = "127.0.0.1", port: int = 8765, open_browser: bool = True) -> int:
    class Handler(BaseHTTPRequestHandler):
        # Quieter logging.
        def log_message(self, fmt, *args):  # noqa: N802
            pass

        # -- helpers -------------------------------------------------------
        def _send(self, code: int, body: bytes, ctype: str) -> None:
            self.send_response(code)
            self.send_header("Content-Type", ctype)
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        def _json(self, obj, code: int = 200) -> None:
            self._send(code, json.dumps(obj).encode("utf-8"), "application/json")

        # -- routes --------------------------------------------------------
        def do_GET(self):  # noqa: N802
            if self.path in ("/", "/index.html"):
                return self._serve_file("index.html", "text/html; charset=utf-8")
            if self.path == "/api/state":
                return self._json({
                    "model": hal.model,
                    "effort": hal.effort,
                    "brain": hal.brain.stats(),
                })
            if self.path == "/api/notes":
                try:
                    return self._json({"notes": hal.brain.list_notes()})
                except Exception as e:  # pragma: no cover
                    return self._json({"error": str(e)}, 500)
            if self.path.startswith("/ui/"):
                name = self.path[len("/ui/"):]
                return self._serve_file(name, self._ctype(name))
            return self._json({"error": "not found"}, 404)

        def do_POST(self):  # noqa: N802
            if self.path != "/api/chat":
                return self._json({"error": "not found"}, 404)
            length = int(self.headers.get("Content-Length", "0") or "0")
            try:
                payload = json.loads(self.rfile.read(length) or b"{}")
                message = (payload.get("message") or "").strip()
            except (ValueError, TypeError):
                return self._json({"error": "bad request"}, 400)
            if not message:
                return self._json({"error": "empty message"}, 400)
            return self._stream_chat(message)

        # -- chat streaming (NDJSON) --------------------------------------
        def _stream_chat(self, message: str) -> None:
            self.send_response(200)
            self.send_header("Content-Type", "application/x-ndjson")
            self.send_header("Cache-Control", "no-store")
            self.end_headers()

            def write_event(ev: dict) -> None:
                self.wfile.write((json.dumps(ev) + "\n").encode("utf-8"))
                self.wfile.flush()

            # Serialize turns: shared conversation state isn't concurrency-safe.
            with _lock:
                try:
                    for ev in hal.stream(message):
                        write_event(ev)
                except BrokenPipeError:
                    return
                except Exception as e:  # pragma: no cover - defensive
                    try:
                        write_event({"type": "error", "message": f"server error: {e}"})
                    except OSError:
                        pass

        # -- static files --------------------------------------------------
        def _serve_file(self, name: str, ctype: str) -> None:
            # Confine to the UI directory.
            target = (UI_DIR / name).resolve()
            if UI_DIR.resolve() not in target.parents and target != UI_DIR.resolve():
                return self._json({"error": "forbidden"}, 403)
            if not target.is_file():
                return self._json({"error": "not found"}, 404)
            self._send(200, target.read_bytes(), ctype)

        @staticmethod
        def _ctype(name: str) -> str:
            if name.endswith(".css"):
                return "text/css; charset=utf-8"
            if name.endswith(".js"):
                return "text/javascript; charset=utf-8"
            if name.endswith(".html"):
                return "text/html; charset=utf-8"
            return "application/octet-stream"

    httpd = ThreadingHTTPServer((host, port), Handler)
    url = f"http://{host}:{port}/"
    print(f"\n  H.A.L. // JARVIS interface online at {url}")
    print(f"  brain: {hal.brain.stats()['root']}  ·  model: {hal.model}")
    print("  (Ctrl-C to shut down)\n")
    if open_browser:
        threading.Timer(0.6, lambda: webbrowser.open(url)).start()
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n  Shutting down. Everything's as you left it.")
    finally:
        httpd.server_close()
    return 0
