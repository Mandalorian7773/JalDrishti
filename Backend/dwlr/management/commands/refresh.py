import sys
from concurrent.futures import ThreadPoolExecutor
from datetime import date, timedelta
from pathlib import Path

from django.core.management import call_command
from django.core.management.base import BaseCommand
from django.db import connection

from dwlr.models import Reading, Station

# The downloader stays a standalone script so it can run before the DB exists;
# reuse its paging and daily-median logic here rather than duplicating it.
sys.path.insert(0, str(Path(__file__).resolve().parents[3] / "scripts"))
from fetch_wris import fetch_district  # noqa: E402


class Command(BaseCommand):
    help = "Pull the latest readings for districts already in the database, then re-analyse"

    def add_arguments(self, parser):
        parser.add_argument("--days", type=int, default=30)
        parser.add_argument("--workers", type=int, default=12)

    def handle(self, *args, **opts):
        pairs = sorted(
            set(Station.objects.values_list("state", "district").distinct())
        )
        if not pairs:
            raise SystemExit("no stations yet - run load_wris first")

        start = (date.today() - timedelta(days=opts["days"])).isoformat()
        end = date.today().isoformat()
        self.stdout.write(f"refreshing {len(pairs)} districts, {start} -> {end}")

        ids = dict(Station.objects.values_list("code", "id"))
        added = 0

        def pull(pair):
            state, district = pair
            try:
                _, readings = fetch_district(state, district, start, end)
            except Exception as exc:
                self.stderr.write(f"!! {state}/{district}: {exc}")
                return []
            return readings

        with ThreadPoolExecutor(max_workers=opts["workers"]) as pool:
            for readings in pool.map(pull, pairs):
                batch = [
                    Reading(
                        station_id=ids[r["code"]],
                        date=r["date"],
                        level_mbgl=r["level_mbgl"],
                        samples=r.get("n", 1),
                    )
                    for r in readings
                    if r["code"] in ids
                ]
                if batch:
                    Reading.objects.bulk_create(batch, ignore_conflicts=True)
                    added += len(batch)
        connection.close()

        self.stdout.write(f"upserted {added} station-days")
        call_command("analyze")
