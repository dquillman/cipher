@echo off
title CipherExam - Deploy to STAGING
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0run-me.ps1" staging
echo.
echo ============================================
echo   Finished. Press any key to close.
echo ============================================
pause >nul
