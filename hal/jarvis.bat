@echo off
rem HAL — JARVIS browser HUD. Double-click to open the graphical interface.
rem Give HAL your projects by editing the BRAIN line below, or pass folders:
rem   jarvis.bat --brain "G:\Users\daveq\2nd Brain" "G:\Users\daveq\projects"
setlocal
cd /d "%~dp0"

rem --- pick a Python: the py launcher, else python on PATH ---
set "PY=python"
where py >nul 2>nul && set "PY=py -3"

rem --- optional: set your projects here (edit or leave blank) ---
set "BRAIN="
rem example: set "BRAIN=--brain "G:\Users\daveq\2nd Brain" "G:\Users\daveq\source""

%PY% hal.py --ui jarvis %BRAIN% %*
pause
