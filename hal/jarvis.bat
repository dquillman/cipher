@echo off
rem HAL — JARVIS browser HUD. Double-click to open the graphical interface.
rem Point at your real brain with:  set HAL_BRAIN_DIR=C:\path\to\2nd Brain
rem or pass:  jarvis.bat --brain "C:\path\to\2nd Brain"
setlocal
cd /d "%~dp0"
python hal.py --ui jarvis %*
pause
