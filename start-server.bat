@echo off
rem ============================================================
rem  Serve the IELTS trainer on your home Wi-Fi.
rem  Open the printed address on your Android / iPad browser.
rem ============================================================
cd /d "%~dp0"
echo.
echo  ============================================
echo   IELTS Trainer - Wi-Fi server
echo  ============================================
echo.
echo  On your phone / iPad (same Wi-Fi), open:
echo.
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
    for /f "tokens=* delims= " %%b in ("%%a") do echo     http://%%b:8123
)
echo.
echo  (If several addresses show, try the one starting 192.168.)
echo  Keep this window open while practising. Ctrl+C to stop.
echo.
python -m http.server 8123 --bind 0.0.0.0
pause
