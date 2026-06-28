@echo off
cd /d "%~dp0"
echo Installing audio dependencies if needed...
if not exist node_modules\openai npm install
echo Generating first 10 MP3 files only...
npm run generate-audio:test
pause
