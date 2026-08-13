import json
from pathlib import Path

from django.core.management import call_command
from django.core.management.base import BaseCommand
from django.db import transaction

from dwlr.models import Reading, Station

DATA = Path(__file__).resolve().parents[3] / "data"
BATCH = 20000
# WRIS occasionally ships a station with lat/lon swapped or blank. One such row
# is enough to stretch the map's auto-fit across the globe, so drop anything
# that cannot be in India.
INDIA_BBOX = (6.0, 38.0, 68.0, 98.0)  # min lat, max lat, min lon, max lon


def _in_india(lat, lon):
    if lat is None or lon is None:
        return False
    y1, y2, x1, x2 = INDIA_BBOX
    return y1 <= lat <= y2 and x1 <= lon <= x2


class Command(BaseCommand):
    help = "Load India-WRIS DWLR stations and readings from scripts/fetch_wris.py output"

    def add_arguments(self, parser):
        parser.add_argument("--dir", default=str(DATA))
        parser.add_argument("--no-analyze", action="store_true")

    def handle(self, *args, **opts):
        d = Path(opts["dir"])
        stations_file, readings_file = d / "stations.jsonl", d / "readings.jsonl"
        if not stations_file.exists():
            raise SystemExit(f"missing {stations_file} - run scripts/fetch_wris.py first")

        text_fields = ["name", "state", "district", "tehsil", "block", "agency",
                       "well_type", "aquifer_type", "status"]
        num_fields = ["latitude", "longitude", "well_depth_m"]
        seen, created, rejected = {}, 0, 0
        with transaction.atomic():
            for line in stations_file.open():
                r = json.loads(line)
                if not _in_india(r.get("latitude"), r.get("longitude")):
                    rejected += 1
                    continue
                defaults = {k: (r.get(k) or "") for k in text_fields}
                defaults.update({k: r.get(k) for k in num_fields})
                obj, is_new = Station.objects.update_or_create(code=r["code"], defaults=defaults)
                seen[r["code"]] = obj.id
                created += is_new
        self.stdout.write(
            f"stations: {len(seen)} ({created} new, {rejected} rejected on coordinates)"
        )
        if not readings_file.exists():
            return
        # Readings are append-only per station-day; ignore_conflicts makes reloads idempotent.
        buf, total, skipped = [], 0, 0
        for line in readings_file.open():
            r = json.loads(line)
            sid = seen.get(r["code"])
            if sid is None:
                skipped += 1
                continue
            buf.append(Reading(station_id=sid, date=r["date"], level_mbgl=r["level_mbgl"],
                               samples=r.get("n", 1)))
            if len(buf) >= BATCH:
                Reading.objects.bulk_create(buf, ignore_conflicts=True)
                total += len(buf)
                buf = []
                self.stdout.write(f"  {total} readings...", ending="\r")
        if buf:
            Reading.objects.bulk_create(buf, ignore_conflicts=True)
            total += len(buf)
        self.stdout.write(f"readings: {total} loaded, {skipped} orphaned")

        if not opts["no_analyze"]:
            call_command("analyze")
