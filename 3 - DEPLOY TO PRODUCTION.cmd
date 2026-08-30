@echo off
title CipherExam - Deploy to PRODUCTION
cd /d "%~dp0"

echo.
echo ############################################
echo #                                          #
echo #   THIS DEPLOYS TO cipherexam.com LIVE    #
echo #                                          #
echo ############################################
echo.
set /p ok="Type  yes  and press Enter to continue: "
if /i not "%ok%"=="yes" (
  echo.
  echo Cancelled. Nothing deployed.
  echo Press any key to close.
  pause >nul
  exit /b 0
)

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0run-me.ps1" prod
echo.
echo ============================================
echo   Finished. Press any key to close.
echo ============================================
pause >nul
