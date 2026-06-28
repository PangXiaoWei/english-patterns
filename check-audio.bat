@echo off
cd /d "%~dp0"
echo Installing audio dependencies if needed...
if not exist node_modules\openai npm install
echo Checking missing audio files. This does not call any API.
npm run check-audio
pause
