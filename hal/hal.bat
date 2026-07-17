@echo off
rem HAL — terminal console. Double-click to open.
rem Give HAL your projects by editing the BRAIN line below, or pass folders:
rem   hal.bat --brain "G:\Users\daveq\2nd Brain" "G:\Users\daveq\projects"
setlocal
cd /d "%~dp0"

set "PY=python"
where py >nul 2>nul && set "PY=py -3"

set "BRAIN="
rem example: set "BRAIN=--brain "G:\Users\daveq\2nd Brain""

%PY% hal.py %BRAIN% %*
pause
