from datetime import timedelta

from django.db.models import Avg, Count, ExpressionWrapper, F, FloatField, Max, Q
from django.db.models.functions import TruncMonth
from functools import wraps

from django.core.cache import cache
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .analytics import forecast
from .models import Reading, Station

LIST_FIELDS = (
    "code", "name", "state", "district", "latitude", "longitude",
    "latest_level_mbgl", "latest_date", "trend_m_per_year", "category",
    "seasonal_fluctuation_m", "recharge_mm", "data_quality", "anomalies",
)
CATEGORIES = ("safe", "semi_critical", "critical", "over_exploited", "unknown")


def server_cache(seconds):
    """Cache the response body on the server only.

    Django's cache_page also sends Cache-Control: max-age, which makes the
    browser hold a stale copy for the same window - pull-to-refresh stops
    working and a schema change looks like a broken chart until it expires.
    """

    def decorate(view):
        @wraps(view)
        def wrapper(request, *args, **kwargs):
            key = f"{view.__name__}:{request.get_full_path()}"
            payload = cache.get(key)
            if payload is None:
                payload = view(request, *args, **kwargs).data
                cache.set(key, payload, seconds)
            return Response(payload)

        return wrapper

    return decorate


def _clean(qs):
    """Stations whose telemetry passed the quality checks.

    A stuck or datum-shifted recorder produces trends of tens of metres a year
    that swamp any average it lands in, so every headline number is computed
    over clean stations only. The flagged ones surface in /alerts/ instead.
    """
    return qs.filter(anomalies=[])


def _filtered(request):
    qs = Station.objects.all()
    p = request.query_params
    if state := p.get("state"):
        qs = qs.filter(state__iexact=state)
    if district := p.get("district"):
        qs = qs.filter(district__iexact=district)
    if category := p.get("category"):
        qs = qs.filter(category__in=category.split(","))
    if q := p.get("q"):
        qs = qs.filter(Q(name__icontains=q) | Q(code__icontains=q) |
                       Q(district__icontains=q) | Q(state__icontains=q))
    if bbox := p.get("bbox"):  # minLon,minLat,maxLon,maxLat
        try:
            x1, y1, x2, y2 = (float(v) for v in bbox.split(","))
            qs = qs.filter(longitude__range=(x1, x2), latitude__range=(y1, y2))
        except ValueError:
            pass
    return qs


@api_view(["GET"])
@server_cache(60)
def stations(request):
    qs = _filtered(request)
    order = request.query_params.get("order")
    if order in {"trend", "-trend"}:
        qs = qs.filter(trend_m_per_year__isnull=False).order_by(
            "-trend_m_per_year" if order == "trend" else "trend_m_per_year"
        )
    else:
        qs = qs.order_by("state", "district", "name")
    try:
        limit = min(int(request.query_params.get("limit", 6000)), 10000)
    except ValueError:
        limit = 6000
    return Response({"count": qs.count(), "results": list(qs.values(*LIST_FIELDS)[:limit])})


@api_view(["GET"])
def station_detail(request, code):
    try:
        s = Station.objects.get(code=code)
    except Station.DoesNotExist:
        return Response({"detail": "station not found"}, status=404)

    try:
        days = min(int(request.query_params.get("days", 400)), 2000)
    except ValueError:
        days = 400
    rows = list(s.readings.order_by("date").values_list("date", "level_mbgl"))
    recent = [r for r in rows if rows and r[0] >= rows[-1][0] - timedelta(days=days)]

    monthly = list(
        s.readings.annotate(m=TruncMonth("date")).values("m")
        .annotate(level=Avg("level_mbgl"), n=Count("id")).order_by("m")
    )

    data = {f: getattr(s, f) for f in LIST_FIELDS}
    data.update(
        {
            "tehsil": s.tehsil, "block": s.block, "well_type": s.well_type,
            "aquifer_type": s.aquifer_type, "well_depth_m": s.well_depth_m,
            "agency": s.agency, "status": s.status,
            "mean_level_mbgl": s.mean_level_mbgl, "min_level_mbgl": s.min_level_mbgl,
            "max_level_mbgl": s.max_level_mbgl, "pre_monsoon_mbgl": s.pre_monsoon_mbgl,
            "post_monsoon_mbgl": s.post_monsoon_mbgl, "specific_yield": s.specific_yield,
            "reading_count": s.reading_count,
            "series": [{"date": d.isoformat(), "level_mbgl": lv} for d, lv in recent],
            "monthly": [
                {"month": m["m"].isoformat(), "level_mbgl": round(m["level"], 3), "n": m["n"]}
                for m in monthly
            ],
            "forecast": forecast(rows),
        }
    )
    return Response(data)


@api_view(["GET"])
@server_cache(60)
def summary(request):
    qs = _filtered(request)
    clean = _clean(qs)
    agg = clean.aggregate(
        total=Count("id"),
        avg_trend=Avg("trend_m_per_year"),
        avg_level=Avg("latest_level_mbgl"),
        avg_recharge=Avg("recharge_mm"),
        avg_fluctuation=Avg("seasonal_fluctuation_m"),
        avg_quality=Avg("data_quality"),
        latest=Max("latest_date"),
    )
    by_category = {c: 0 for c in CATEGORIES}
    for row in clean.values("category").annotate(n=Count("id")):
        by_category[row["category"]] = row["n"]

    declining = clean.filter(trend_m_per_year__gt=0).count()
    return Response(
        {
            **{k: (round(v, 3) if isinstance(v, float) else v) for k, v in agg.items()},
            "by_category": by_category,
            "declining": declining,
            "recovering": clean.filter(trend_m_per_year__lt=0).count(),
            "at_risk": by_category["critical"] + by_category["over_exploited"],
            "stations": qs.count(),
            "flagged_sensors": qs.exclude(anomalies=[]).count(),
            "readings": Reading.objects.count(),
            "states": qs.values("state").distinct().count(),
            "districts": qs.values("state", "district").distinct().count(),
            "worst": list(
                clean.filter(trend_m_per_year__isnull=False)
                .order_by("-trend_m_per_year")
                .values(*LIST_FIELDS)[:10]
            ),
            "best": list(
                clean.filter(trend_m_per_year__isnull=False)
                .order_by("trend_m_per_year")
                .values(*LIST_FIELDS)[:10]
            ),
        }
    )


@api_view(["GET"])
@server_cache(900)  # scans every reading; only changes when `analyze` reruns
def trend(request):
    """Monthly national water-table anomaly, for the dashboard chart.

    Averaging raw depths month by month measures which stations happened to
    report, not the water table: coverage swings between ~1000 and ~1600
    recorders and shallow regions dropping out look identical to a national
    recovery. Averaging each reading's deviation from its own station's mean
    cancels that out, so the curve only moves when water levels move.
    """
    qs = _clean(_filtered(request)).filter(mean_level_mbgl__isnull=False)
    rows = (
        Reading.objects.filter(station__in=qs)
        .annotate(
            m=TruncMonth("date"),
            dev=ExpressionWrapper(
                F("level_mbgl") - F("station__mean_level_mbgl"), output_field=FloatField()
            ),
        )
        .values("m")
        .annotate(
            anomaly=Avg("dev"), level=Avg("level_mbgl"), stations=Count("station", distinct=True)
        )
        .order_by("m")
    )
    return Response(
        [
            {
                "month": r["m"].isoformat(),
                "anomaly_m": round(r["anomaly"], 3),
                "level_mbgl": round(r["level"], 3),
                "stations": r["stations"],
            }
            for r in rows
        ]
    )


@api_view(["GET"])
@server_cache(60)
def states(request):
    rows = (
        _clean(Station.objects.all()).values("state")
        .annotate(
            stations=Count("id"),
            avg_trend=Avg("trend_m_per_year"),
            avg_level=Avg("latest_level_mbgl"),
            avg_recharge=Avg("recharge_mm"),
            at_risk=Count("id", filter=Q(category__in=("critical", "over_exploited"))),
        )
        .order_by("-avg_trend")
    )
    return Response(
        [
            {k: (round(v, 3) if isinstance(v, float) else v) for k, v in r.items()}
            for r in rows
        ]
    )


@api_view(["GET"])
@server_cache(60)
def alerts(request):
    """Stations needing attention: fast depletion, or a sensor reporting nonsense."""
    qs = _filtered(request)
    depleting = _clean(qs).filter(category__in=("critical", "over_exploited")).order_by(
        "-trend_m_per_year"
    )
    faulty = qs.exclude(anomalies=[]).order_by("data_quality")
    return Response(
        {
            "depletion": list(depleting.values(*LIST_FIELDS)[:100]),
            "sensor": list(faulty.values(*LIST_FIELDS)[:100]),
        }
    )
