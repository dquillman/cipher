@echo off
title CipherExam - Bump, Commit, Push, Deploy to PRODUCTION
cd /d "%~dp0"

echo.
echo ##################################################
echo #                                                #
echo #   BUMP VERSION                                 #
echo #   RUN TESTS                                    #
echo #   COMMIT + PUSH TO main                        #
echo #   DEPLOY TO cipherexam.com  (LIVE)             #
echo #                                                #
echo ##################################################
echo.
set /p ok="Type  yes  and press Enter to continue: "
if /i not "%ok%"=="yes" (
  echo.
  echo Cancelled. Nothing changed.
  echo Press any key to close.
  pause >nul
  exit /b 0
)

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0ship-it.ps1" prod
echo.
echo ============================================
echo   Finished. Press any key to close.
echo ============================================
pause >nul
