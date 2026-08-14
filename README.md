# JalDrishti 💧
> Real-time groundwater resource evaluation from Digital Water Level Recorder (DWLR) telemetry — Ministry of Jal Shakti.

---

## 🔍 Why the Project Was Not Working Before (Diagnostics)

1. **Python Environment / Missing Django**:
   - The dependencies are installed inside the virtual environment at `Backend/venv`.
   - When running `python manage.py runserver` with the system Python, it failed with `ModuleNotFoundError: No module named 'django'`.
   - **Fix**: The virtual environment must be activated (`.\venv\Scripts\activate` or `.\venv\Scripts\python.exe`).

2. **Empty Database (0 Stations / 0 Readings)**:
   - `db.sqlite3` had no station data loaded (`Station.objects.count() == 0`).
   - Consequently, all endpoints (`/api/summary/`, `/api/stations/`, `/api/trend/`, `/api/states/`, `/api/alerts/`) returned empty objects, causing the dashboard, charts, state rankings, and maps to show no series or empty placeholders.
   - **Fix**: Downloaded real DWLR groundwater telemetry data from India-WRIS and ran `manage.py load_wris` + `manage.py analyze`, populating 342 stations and 117,000+ daily observations with automated trend calculations, fluctuation metrics, recharge estimates, and sensor health diagnostics.

3. **Backend & Frontend Coordination**:
   - The frontend Expo app connects dynamically to `http://localhost:8000/api` (or the IP of the host machine).
   - If the backend server is not running on port 8000, the frontend displays `Cannot reach the API`.

---

## 🚀 Quick Start (One-Click)

Double-click `run_all.bat` in the root folder, or run:

```cmd
.\run_all.bat
```

This will launch both the Django backend (`http://127.0.0.1:8000`) and the Expo frontend (`http://localhost:8081`) in separate terminals.

---

## 🛠 Manual Execution Steps

### 1. Start Backend API
```powershell
cd Backend
.\venv\Scripts\Activate.ps1
python manage.py runserver 0.0.0.0:8000
```
- API Base: `http://127.0.0.1:8000/api/`
- Summary KPI Endpoint: `http://127.0.0.1:8000/api/summary/`
- Stations Network: `http://127.0.0.1:8000/api/stations/`
- National Trends: `http://127.0.0.1:8000/api/trend/`
- State Comparison: `http://127.0.0.1:8000/api/states/`
- Alerts (Depletion & Faulty Sensors): `http://127.0.0.1:8000/api/alerts/`

### 2. Start Frontend App
```powershell
cd App
npx expo start --web
```
Open `http://localhost:8081` in your browser.

---

## 🔄 Fetching Fresh India-WRIS Telemetry Data

To pull more districts or update records from the official India-WRIS portal:

```powershell
cd Backend
.\venv\Scripts\python.exe scripts\fetch_wris.py --states "Punjab,Haryana,Rajasthan,Delhi (NCT),Gujarat" --from 2024-01-01 --to 2025-12-31 --workers 8
.\venv\Scripts\python.exe manage.py load_wris
```
