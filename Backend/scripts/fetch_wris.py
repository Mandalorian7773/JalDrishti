"""Download real DWLR (telemetric) groundwater level data from India-WRIS.

Writes two JSONL files that `manage.py load_wris` ingests:
  stations.jsonl  one row per DWLR station
  readings.jsonl  one row per station-day (6-hourly source data -> daily median)

Usage: python scripts/fetch_wris.py --from 2024-01-01 --to 2026-08-13 --workers 12
"""
import argparse
import json
import statistics
import sys
import threading
import time
import urllib.parse
import urllib.request
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

API = "https://indiawris.gov.in/Dataset/Ground%20Water%20Level"
DISTRICTS_URL = "https://raw.githubusercontent.com/sab99r/Indian-States-And-Districts/master/states-and-districts.json"
PAGE = 10000
MAX_PAGES = 60  # hard cap so one huge district can't stall the run
OUT = Path(__file__).resolve().parent.parent / "data"

_lock = threading.Lock()
_done = 0


def _post(payload, tries=3):
    body = urllib.parse.urlencode(payload).encode()
    for attempt in range(tries):
        try:
            req = urllib.request.Request(
                API, body, {"Content-Type": "application/x-www-form-urlencoded"}
            )
            with urllib.request.urlopen(req, timeout=180) as r:
                return json.load(r).get("data") or []
        except Exception:
            # WRIS truncates large chunked responses under load (IncompleteRead),
            # times out, and occasionally returns HTML. All of it is retryable.
            if attempt == tries - 1:
                return []
            time.sleep(2 * (attempt + 1))
    return []


def fetch_district(state, district, start, end):
    """All telemetric readings for one district, collapsed to station-day medians."""
    rows = []
    for page in range(MAX_PAGES):
        batch = _post(
            {
                "stateName": state,
                "districtName": district,
                "agencyName": "CGWB",
                "startdate": start,
                "enddate": end,
                "download": "false",
                "page": page,
                "size": PAGE,
            }
        )
        rows.extend(batch)
        if len(batch) < PAGE:
            break

    stations, daily = {}, defaultdict(list)
    for r in rows:
        # DWLR = telemetric recorders only; manual dipper readings are not DWLR data
        if r.get("dataAcquisitionMode") != "Telemetric":
            continue
        code, value, when = r.get("stationCode"), r.get("dataValue"), r.get("dataTime")
        if not code or value is None or not when:
            continue
        stations.setdefault(
            code,
            {
                "code": code,
                "name": r.get("stationName") or code,
                "state": r.get("state") or state,
                "district": (r.get("district") or district).title(),
                "tehsil": r.get("tehsil") or "",
                "block": r.get("block") or "",
                "latitude": r.get("latitude"),
                "longitude": r.get("longitude"),
                "agency": r.get("agencyName") or "CGWB",
                "well_type": r.get("wellType") or "",
                "aquifer_type": r.get("wellAquiferType") or "",
                "well_depth_m": r.get("wellDepth"),
                "status": r.get("stationStatus") or "",
            },
        )
        # source is metres relative to ground, negative below surface -> store depth mbgl
        daily[(code, when[:10])].append(-float(value))

    readings = [
        {"code": c, "date": d, "level_mbgl": round(statistics.median(v), 3), "n": len(v)}
        for (c, d), v in daily.items()
    ]
    return list(stations.values()), readings


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--from", dest="start", default="2024-01-01")
    ap.add_argument("--to", dest="end", default=time.strftime("%Y-%m-%d"))
    ap.add_argument("--workers", type=int, default=12)
    ap.add_argument("--states", default="", help="comma separated filter")
    ap.add_argument("--resume", action="store_true",
                    help="keep existing output and skip districts already downloaded")
    args = ap.parse_args()

    OUT.mkdir(exist_ok=True)
    with urllib.request.urlopen(DISTRICTS_URL, timeout=60) as r:
        catalog = json.load(r)["states"]
    only = {s.strip().lower() for s in args.states.split(",") if s.strip()}
    pairs = [
        (s["state"], d)
        for s in catalog
        if not only or s["state"].lower() in only
        for d in s["districts"]
    ]
    total = len(pairs)
    print(f"{total} districts, {args.start} -> {args.end}", flush=True)

    seen = set()
    done = set()
    mode = "w"
    if args.resume and (OUT / "stations.jsonl").exists():
        mode = "a"
        for line in (OUT / "stations.jsonl").open():
            r = json.loads(line)
            seen.add(r["code"])
            done.add((r["state"].lower(), r["district"].lower()))
        pairs = [p for p in pairs if (p[0].lower(), p[1].lower()) not in done]
        total = len(pairs)
        print(f"resume: {len(seen)} stations kept, {total} districts left", flush=True)

    sf = (OUT / "stations.jsonl").open(mode)
    rf = (OUT / "readings.jsonl").open(mode)

    def work(pair):
        global _done
        state, district = pair
        try:
            stations, readings = fetch_district(state, district, args.start, args.end)
        except Exception as exc:  # one bad district must not kill the run
            print(f"!! {state}/{district}: {exc}", flush=True)
            return
        with _lock:
            for s in stations:
                if s["code"] not in seen:
                    seen.add(s["code"])
                    sf.write(json.dumps(s) + "\n")
            for x in readings:
                rf.write(json.dumps(x) + "\n")
            _done += 1
            if stations or _done % 25 == 0:
                print(
                    f"[{_done}/{total}] {state}/{district}: "
                    f"{len(stations)} stations {len(readings)} station-days "
                    f"(total {len(seen)})",
                    flush=True,
                )
            sf.flush()
            rf.flush()

    with ThreadPoolExecutor(max_workers=args.workers) as pool:
        list(pool.map(work, pairs))
    sf.close()
    rf.close()
    print(f"DONE {len(seen)} DWLR stations -> {OUT}", flush=True)


if __name__ == "__main__":
    sys.exit(main())
