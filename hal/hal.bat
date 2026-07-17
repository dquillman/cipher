@echo off
rem HAL — your brain, on the line. Double-click to open the HAL console.
rem Uses the local Python and this folder's hal.py. Set HAL_BRAIN_DIR to point
rem at your real "2nd Brain" folder, or pass --brain "C:\path\to\brain".
setlocal
cd /d "%~dp0"
python hal.py %*
pause
