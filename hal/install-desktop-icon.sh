#!/usr/bin/env bash
# ============================================================
#  Creates a "HAL" launcher icon.
#  Linux: adds it to your apps menu and Desktop (.desktop entry).
#  macOS: creates HAL.command on your Desktop (double-click to run).
#  Run once:  ./install-desktop-icon.sh
# ============================================================
set -e
HERE="$(cd "$(dirname "$0")" && pwd)"

if [[ "$(uname)" == "Darwin" ]]; then
  CMD="$HOME/Desktop/HAL.command"
  cat > "$CMD" <<EOF
#!/usr/bin/env bash
cd "$HERE"
exec python3 hal.py --ui jarvis
EOF
  chmod +x "$CMD"
  echo "Created $CMD — double-click it on your Desktop to launch HAL."
  echo "(To give it the HAL icon: select HAL.command, Cmd+I, drag assets/hal.png onto the icon.)"
  exit 0
fi

# Linux
DESKTOP_FILE_CONTENT="[Desktop Entry]
Type=Application
Name=HAL
Comment=your brain, on the line
Exec=/usr/bin/env bash -lc 'cd \"$HERE\" && python3 hal.py --ui jarvis'
Icon=$HERE/assets/hal.png
Terminal=true
Categories=Utility;"

APPS="$HOME/.local/share/applications"
mkdir -p "$APPS"
echo "$DESKTOP_FILE_CONTENT" > "$APPS/hal.desktop"
chmod +x "$APPS/hal.desktop" || true

DESK="$(xdg-user-dir DESKTOP 2>/dev/null || echo "$HOME/Desktop")"
if [[ -d "$DESK" ]]; then
  echo "$DESKTOP_FILE_CONTENT" > "$DESK/hal.desktop"
  chmod +x "$DESK/hal.desktop" || true
  gio set "$DESK/hal.desktop" metadata::trusted true 2>/dev/null || true
  echo "Added HAL to your apps menu and Desktop."
else
  echo "Added HAL to your apps menu (no Desktop folder found)."
fi
