@echo off
rem ============================================================
rem  HAL — JARVIS browser HUD.  Double-click this to run HAL.
rem  First run also: finds Python, installs what it needs,
rem  and drops a "HAL" icon on your Desktop.
rem ============================================================
setlocal enabledelayedexpansion
cd /d "%~dp0"

rem --- find a Python (py launcher, PATH, or common install spots) ---
set "PY="
where py >nul 2>nul && set "PY=py -3"
if not defined PY ( where python >nul 2>nul && set "PY=python" )
if not defined PY ( if exist "G:\Python311\python.exe" set "PY=G:\Python311\python.exe" )
if not defined PY ( if exist "%LOCALAPPDATA%\Programs\Python\Python312\python.exe" set "PY=%LOCALAPPDATA%\Programs\Python\Python312\python.exe" )
if not defined PY ( if exist "%LOCALAPPDATA%\Programs\Python\Python311\python.exe" set "PY=%LOCALAPPDATA%\Programs\Python\Python311\python.exe" )
if not defined PY (
  echo.
  echo   Python was not found. Install it from https://www.python.org/downloads/
  echo   ^(tick "Add Python to PATH" during install^), then run this again.
  echo.
  pause & exit /b 1
)

rem --- make sure the one dependency is installed ---
%PY% -c "import anthropic" 2>nul || (
  echo Installing HAL's dependency ^(one time^)...
  %PY% -m pip install -r requirements.txt
)

rem --- first run: auto-create the Desktop icon (once) ---
if not exist "%~dp0assets\.icon-installed" (
  echo Setting up your HAL Desktop icon...
  set "PSICON=powershell"
  where pwsh >nul 2>nul && set "PSICON=pwsh"
  !PSICON! -NoProfile -ExecutionPolicy Bypass -File "%~dp0install-desktop-icon.ps1"
  echo installed> "%~dp0assets\.icon-installed"
  echo.
)

rem --- optional: set your projects here (edit or leave blank) ---
set "BRAIN="
rem example: set "BRAIN=--brain "G:\Users\daveq\2nd Brain" "G:\Users\daveq\source""

%PY% hal.py --ui jarvis %BRAIN% %*
pause
