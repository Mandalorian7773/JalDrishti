from django.db import models


class Station(models.Model):
    """A CGWB Digital Water Level Recorder (DWLR) / telemetric piezometer."""

    SAFE, SEMI_CRITICAL, CRITICAL, OVER_EXPLOITED, UNKNOWN = (
        "safe",
        "semi_critical",
        "critical",
        "over_exploited",
        "unknown",
    )
    CATEGORIES = [
        (SAFE, "Safe"),
        (SEMI_CRITICAL, "Semi-Critical"),
        (CRITICAL, "Critical"),
        (OVER_EXPLOITED, "Over-Exploited"),
        (UNKNOWN, "Unknown"),
    ]

    code = models.CharField(max_length=32, unique=True, db_index=True)
    name = models.CharField(max_length=160)
    state = models.CharField(max_length=80, db_index=True)
    district = models.CharField(max_length=80, db_index=True)
    tehsil = models.CharField(max_length=80, blank=True)
    block = models.CharField(max_length=80, blank=True)
    latitude = models.FloatField()
    longitude = models.FloatField()
    agency = models.CharField(max_length=40, default="CGWB")
    well_type = models.CharField(max_length=60, blank=True)
    aquifer_type = models.CharField(max_length=60, blank=True)
    well_depth_m = models.FloatField(null=True, blank=True)
    status = models.CharField(max_length=30, blank=True)

    # Denormalised analytics, refreshed by `manage.py analyze`. Recomputing these
    # per request would mean scanning millions of readings for every map pan.
    latest_level_mbgl = models.FloatField(null=True, blank=True)
    latest_date = models.DateField(null=True, blank=True)
    mean_level_mbgl = models.FloatField(null=True, blank=True)
    min_level_mbgl = models.FloatField(null=True, blank=True)
    max_level_mbgl = models.FloatField(null=True, blank=True)
    pre_monsoon_mbgl = models.FloatField(null=True, blank=True)
    post_monsoon_mbgl = models.FloatField(null=True, blank=True)
    seasonal_fluctuation_m = models.FloatField(null=True, blank=True)
    trend_m_per_year = models.FloatField(
        null=True, blank=True, help_text="+ve = water table deepening (depletion)"
    )
    recharge_mm = models.FloatField(null=True, blank=True)
    specific_yield = models.FloatField(null=True, blank=True)
    category = models.CharField(max_length=20, choices=CATEGORIES, default=UNKNOWN, db_index=True)
    data_quality = models.FloatField(null=True, blank=True, help_text="0-100")
    anomalies = models.JSONField(default=list, blank=True)
    reading_count = models.IntegerField(default=0)

    class Meta:
        indexes = [models.Index(fields=["state", "district"])]

    def __str__(self):
        return f"{self.code} - {self.name}"


class Snapshot(models.Model):
    """Precomputed API payloads, refreshed by `manage.py analyze`.

    The national trend series scans every reading - 28 seconds against a hosted
    Postgres. That is survivable behind a warm in-process cache but not on
    serverless, where each invocation starts cold. These figures only change
    when analyze reruns, so compute them there and let the API read one row.
    """

    key = models.CharField(max_length=40, unique=True)
    payload = models.JSONField()
    updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.key} @ {self.updated:%Y-%m-%d %H:%M}"


class Reading(models.Model):
    """Daily median water level for a station (source data is 6-hourly)."""

    station = models.ForeignKey(Station, on_delete=models.CASCADE, related_name="readings")
    date = models.DateField()
    level_mbgl = models.FloatField(help_text="metres below ground level; -ve = above ground")
    samples = models.SmallIntegerField(default=1)

    class Meta:
        unique_together = ("station", "date")
        indexes = [models.Index(fields=["station", "-date"])]
        ordering = ["date"]

    def __str__(self):
        return f"{self.station_id} {self.date} {self.level_mbgl}m"
