@echo off
rem ============================================================
rem  Creates a "HAL" icon on your Windows Desktop.
rem  Double-click this file ONCE. It writes to every Desktop
rem  folder Windows uses (local + OneDrive) and reports where.
rem ============================================================
setlocal
set "PS=powershell"
where pwsh >nul 2>nul && set "PS=pwsh"
%PS% -NoProfile -ExecutionPolicy Bypass -File "%~dp0install-desktop-icon.ps1"
echo.
pause
