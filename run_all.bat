@echo off
echo ===================================================
echo   Starting JalDrishti (Backend + Frontend)
echo ===================================================
echo [1/2] Launching Django REST API on http://127.0.0.1:8000 ...
start "JalDrishti - Backend API" cmd /k "cd Backend && .\venv\Scripts\activate.bat && python manage.py runserver 0.0.0.0:8000"

echo [2/2] Launching Expo Frontend on http://localhost:8081 ...
start "JalDrishti - Expo Frontend" cmd /k "cd App && npx expo start --web"

echo.
echo Both servers have been launched in separate windows!
echo - API Backend: http://127.0.0.1:8000/api/summary/
echo - Frontend Web: http://localhost:8081
echo.
pause
