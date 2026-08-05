@echo off
:: FormEase Pro Mobile Gateway Firewall Setup
:: Allows incoming phone connections on ports 3000, 3001, 3003

net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] Requesting Administrative privileges...
    powershell -Command "Start-Process '%~0' -Verb RunAs"
    exit /b
)

echo [✓] Adding Windows Firewall rules for FormEase Pro Mobile Gateway...
netsh advfirewall firewall delete rule name="FormEase Mobile Gateway" >nul 2>&1
netsh advfirewall firewall add rule name="FormEase Mobile Gateway" dir=in action=allow protocol=TCP localport=3000,3001,3003

echo.
echo [✓] SUCCESS! Windows Firewall inbound ports 3000, 3001, 3003 are now ALLOWED.
echo [✓] Your smartphone can now connect to http://192.168.100.53:3003/#/mobile-attendance
echo.
pause
