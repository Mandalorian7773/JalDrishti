from itertools import groupby
from operator import itemgetter

from django.core.management.base import BaseCommand
from django.db.models import Max

from dwlr.analytics import analyse
from dwlr.models import Reading, Snapshot, Station
from dwlr.views import build_summary, build_trend

UPDATE_FIELDS = [
    "latest_level_mbgl", "latest_date", "mean_level_mbgl", "min_level_mbgl",
    "max_level_mbgl", "pre_monsoon_mbgl", "post_monsoon_mbgl",
    "seasonal_fluctuation_m", "trend_m_per_year", "recharge_mm", "specific_yield",
    "category", "data_quality", "anomalies", "reading_count",
]


class Command(BaseCommand):
    help = "Recompute trend, recharge, category and data-quality flags for every station"

    def handle(self, *args, **opts):
        dataset_end = Reading.objects.aggregate(m=Max("date"))["m"]
        stations = list(Station.objects.all())
        by_id = {s.id: s for s in stations}
        seen = set()

        def apply(station, rows):
            for field, value in analyse(station, rows, dataset_end).items():
                setattr(station, field, value)

        # One ordered scan, consumed station by station. Buffering every reading
        # first would mean holding millions of tuples in memory at once.
        rows_iter = (
            Reading.objects.order_by("station_id", "date")
            .values_list("station_id", "date", "level_mbgl")
            .iterator(chunk_size=50000)
        )
        for sid, group in groupby(rows_iter, key=itemgetter(0)):
            station = by_id.get(sid)
            if station is None:
                continue
            apply(station, [(d, lv) for _, d, lv in group])
            seen.add(sid)

        for sid, station in by_id.items():  # stations that never reported
            if sid not in seen:
                apply(station, [])

        Station.objects.bulk_update(stations, UPDATE_FIELDS, batch_size=500)
        counts = {c: sum(s.category == c for s in stations) for c in
                  ("safe", "semi_critical", "critical", "over_exploited", "unknown")}
        self.stdout.write(f"analysed {len(stations)} stations: {counts}")

        # Precompute the two payloads that scan the readings table. Doing it here
        # keeps them off the request path, where a cold serverless invocation has
        # no warm cache to hide a 28-second query behind.
        reading_count = Reading.objects.count()
        for key, payload in (
            ("summary", build_summary(Station.objects.all(), reading_count=reading_count)),
            ("trend", build_trend(Station.objects.all())),
        ):
            Snapshot.objects.update_or_create(key=key, defaults={"payload": payload})
            self.stdout.write(f"snapshot '{key}' refreshed")
