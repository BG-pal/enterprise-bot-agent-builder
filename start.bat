@echo off
title Enterprise Bot AI Agent Builder - Local Dev Server
color 0B
echo ========================================================
echo   ENTERPRISE BOT AI AGENT BUILDER - LOCAL DEV SERVER
echo ========================================================
echo.
echo Starting local web server at http://localhost:5173/ ...
echo.
start "" "http://localhost:5173/"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0server.ps1"
pause
