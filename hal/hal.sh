#!/usr/bin/env bash
# HAL — your brain, on the line. Opens the HAL console.
# Point at your real brain with:  HAL_BRAIN_DIR="$HOME/2nd Brain" ./hal.sh
#                            or:  ./hal.sh --brain "$HOME/2nd Brain"
cd "$(dirname "$0")" || exit 1
exec python3 hal.py "$@"
