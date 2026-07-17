#!/usr/bin/env bash
# HAL — JARVIS browser HUD. Opens the graphical interface.
# Point at your real brain:  HAL_BRAIN_DIR="$HOME/2nd Brain" ./jarvis.sh
cd "$(dirname "$0")" || exit 1
exec python3 hal.py --ui jarvis "$@"
