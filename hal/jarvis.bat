@echo off
rem HAL — JARVIS browser HUD. Double-click to open the graphical interface.
rem The FIRST time you run this, it also drops a "HAL" icon on your Desktop.
rem Give HAL your projects by editing the BRAIN line below, or pass folders:
rem   jarvis.bat --brain "G:\Users\daveq\2nd Brain" "G:\Users\daveq\projects"
setlocal
cd /d "%~dp0"

rem --- first run: auto-create the Desktop icon (once) ---
if not exist "%~dp0assets\.icon-installed" (
  echo Setting up your HAL Desktop icon...
  set "PSICON=powershell"
  where pwsh >nul 2>nul && set "PSICON=pwsh"
  %PSICON% -NoProfile -ExecutionPolicy Bypass -File "%~dp0install-desktop-icon.ps1"
  echo installed> "%~dp0assets\.icon-installed"
  echo.
)

rem --- pick a Python: the py launcher, else python on PATH ---
set "PY=python"
where py >nul 2>nul && set "PY=py -3"

rem --- optional: set your projects here (edit or leave blank) ---
set "BRAIN="
rem example: set "BRAIN=--brain "G:\Users\daveq\2nd Brain" "G:\Users\daveq\source""

%PY% hal.py --ui jarvis %BRAIN% %*
pause
