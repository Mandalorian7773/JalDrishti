@echo off
echo ===================================================
echo   Starting JalDrishti Backend (Django REST API)
echo   URL: http://127.0.0.1:8000
echo ===================================================
cd Backend
call .\venv\Scripts\activate.bat
python manage.py runserver 0.0.0.0:8000
pause
