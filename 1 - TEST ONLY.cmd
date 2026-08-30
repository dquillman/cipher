@echo off
title CipherExam - Test Only
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0run-me.ps1" -TestOnly
echo.
echo ============================================
echo   Finished. Press any key to close.
echo ============================================
pause >nul
