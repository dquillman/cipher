@echo off
rem ============================================================
rem  HAL — terminal console.  Double-click this to run HAL.
rem  Finds a WORKING Python and installs what it needs.
rem ============================================================
setlocal enabledelayedexpansion
cd /d "%~dp0"

set "PY="
for %%C in ("py -3" "py" "python" "python3") do (
  if not defined PY (
    %%~C -c "import sys" >nul 2>nul && set "PY=%%~C"
  )
)
if not defined PY for %%P in (
  "%LOCALAPPDATA%\Programs\Python\Python313\python.exe"
  "%LOCALAPPDATA%\Programs\Python\Python312\python.exe"
  "%LOCALAPPDATA%\Programs\Python\Python311\python.exe"
  "%LOCALAPPDATA%\Programs\Python\Python310\python.exe"
  "C:\Python313\python.exe" "C:\Python312\python.exe" "C:\Python311\python.exe"
  "G:\Python311\python.exe"
) do (
  if not defined PY if exist "%%~P" (
    "%%~P" -c "import sys" >nul 2>nul && set PY="%%~P"
  )
)

if not defined PY (
  echo.
  echo   HAL could not find a working Python on this PC.
  echo   Quick fix ^(about 2 minutes^):
  echo     1. Open  https://www.python.org/downloads/
  echo     2. Download and run the installer.
  echo     3. IMPORTANT: on the first screen tick  "Add python.exe to PATH".
  echo     4. Click Install, let it finish, then double-click hal.bat again.
  echo.
  pause
  exit /b 1
)
echo Using Python: !PY!

!PY! -c "import anthropic" >nul 2>nul || (
  echo Installing HAL's dependency ^(one time^)...
  !PY! -m pip install -r requirements.txt
)

set "BRAIN="
rem example: set "BRAIN=--brain "G:\Users\daveq\2nd Brain""

!PY! hal.py %BRAIN% %*
pause
