@echo off
rem ============================================================
rem  Creates a "HAL" icon on your Windows Desktop.
rem  Double-click this file ONCE. Then launch HAL from the Desktop.
rem ============================================================
setlocal
set "HERE=%~dp0"
if "%HERE:~-1%"=="\" set "HERE=%HERE:~0,-1%"
set "TARGET=%HERE%\jarvis.bat"
set "ICON=%HERE%\assets\hal.ico"

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$s=(New-Object -ComObject WScript.Shell).CreateShortcut((Join-Path ([Environment]::GetFolderPath('Desktop')) 'HAL.lnk')); $s.TargetPath='%TARGET%'; $s.WorkingDirectory='%HERE%'; $s.IconLocation='%ICON%'; $s.WindowStyle=7; $s.Description='HAL - your brain, on the line'; $s.Save()"

if errorlevel 1 (
  echo.
  echo   Could not create the shortcut. You can make one by hand:
  echo   right-click jarvis.bat ^> Send to ^> Desktop ^(create shortcut^),
  echo   then right-click it ^> Properties ^> Change Icon ^> browse to
  echo   %ICON%
) else (
  echo.
  echo   Done. A "HAL" icon is on your Desktop — double-click it to launch.
)
echo.
pause
