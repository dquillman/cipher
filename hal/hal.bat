@echo off
rem ============================================================
rem  HAL — terminal console.  Double-click this to run HAL.
rem  First run also finds Python and installs what it needs.
rem ============================================================
setlocal enabledelayedexpansion
cd /d "%~dp0"

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

%PY% -c "import anthropic" 2>nul || (
  echo Installing HAL's dependency ^(one time^)...
  %PY% -m pip install -r requirements.txt
)

set "BRAIN="
rem example: set "BRAIN=--brain "G:\Users\daveq\2nd Brain""

%PY% hal.py %BRAIN% %*
pause
