@echo off
cd /d "%~dp0"
echo Installing audio dependencies if needed...
if not exist node_modules\openai npm install
echo Generating missing priority 1 and priority 2 MP3 files...
npm run generate-audio -- --priority 2 --limit 250
pause
