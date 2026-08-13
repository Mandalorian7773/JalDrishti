"""Groundwater resource evaluation from DWLR time series.

Recharge uses the Water Table Fluctuation method of GEC-2015 (Ground Water
Estimation Committee), the methodology CGWB itself uses:

    Recharge (mm) = water-table rise (m) x specific yield x 1000

Specific yield is a property of the aquifer formation, so the norms below are
keyed to the dominant formation of each state. Override per station by setting
Station.specific_yield.
"""
from datetime import date, timedelta

import numpy as np

# GEC-2015 specific yield norms (fraction of volume)
SY_ALLUVIUM = 0.12
SY_SANDSTONE = 0.03
SY_LIMESTONE = 0.02
SY_BASALT = 0.02
SY_CRYSTALLINE = 0.025  # weathered granite / gneiss / schist
SY_LATERITE = 0.025
SY_DEFAULT = 0.03

STATE_SPECIFIC_YIELD = {
    # Indo-Gangetic / coastal alluvium
    "punjab": SY_ALLUVIUM, "haryana": SY_ALLUVIUM, "delhi": SY_ALLUVIUM,
    "uttar pradesh": SY_ALLUVIUM, "bihar": SY_ALLUVIUM, "west bengal": SY_ALLUVIUM,
    "assam": SY_ALLUVIUM, "uttarakhand": SY_ALLUVIUM, "chandigarh": SY_ALLUVIUM,
    "tripura": SY_ALLUVIUM, "manipur": SY_ALLUVIUM,
    # Deccan trap basalt
    "maharashtra": SY_BASALT, "madhya pradesh": SY_BASALT,
    "dadra and nagar haveli": SY_BASALT,
    # Crystalline hard rock
    "karnataka": SY_CRYSTALLINE, "tamil nadu": SY_CRYSTALLINE,
    "andhra pradesh": SY_CRYSTALLINE, "telangana": SY_CRYSTALLINE,
    "jharkhand": SY_CRYSTALLINE, "odisha": SY_CRYSTALLINE,
    "chhattisgarh": SY_CRYSTALLINE, "meghalaya": SY_CRYSTALLINE,
    "nagaland": SY_CRYSTALLINE, "mizoram": SY_CRYSTALLINE,
    "arunachal pradesh": SY_CRYSTALLINE, "sikkim": SY_CRYSTALLINE,
    "himachal pradesh": SY_CRYSTALLINE, "jammu and kashmir": SY_CRYSTALLINE,
    "ladakh": SY_CRYSTALLINE, "puducherry": SY_ALLUVIUM,
    # Laterite / mixed coastal
    "kerala": SY_LATERITE, "goa": SY_LATERITE,
    # Sedimentary
    "rajasthan": SY_SANDSTONE, "gujarat": SY_SANDSTONE,
}

# Trend-based categorisation. CGWB's official categories need extraction/draft
# figures we do not have per station, so these are depletion-rate proxies
# (m/yr of water-table decline) rather than stage-of-extraction percentages.
CATEGORY_THRESHOLDS = [(0.10, "safe"), (0.30, "semi_critical"), (0.60, "critical")]

PRE_MONSOON_MONTHS = (4, 5)  # April-May, water table at its deepest
POST_MONSOON_MONTHS = (10, 11)  # October-November, after the SW monsoon

# A bore next to a running pump genuinely swings several metres in a day, so a
# fixed jump threshold flags healthy stations. Compare each station against its
# own day-to-day variability instead, with an absolute floor no aquifer beats.
SPIKE_FLOOR_M = 10.0
SPIKE_MAD_MULTIPLE = 12
FLATLINE_DAYS = 10  # identical reading this long = stuck sensor
STALE_DAYS = 45
MAX_HEIGHT_ABOVE_GROUND_M = 10.0  # artesian heads exist; 10 m of them do not
# No aquifer drains or refills this fast for a year. A trend this steep means the
# sensor was re-datumed or the bore deepened mid-record, not a real resource change.
IMPLAUSIBLE_TREND_M_PER_YEAR = 15.0


def specific_yield_for(station):
    return STATE_SPECIFIC_YIELD.get((station.state or "").strip().lower(), SY_DEFAULT)


def categorise(trend_m_per_year):
    if trend_m_per_year is None:
        return "unknown"
    for limit, name in CATEGORY_THRESHOLDS:
        if trend_m_per_year < limit:
            return name
    return "over_exploited"


def _seasonal_mean(dates, levels, months):
    vals = [lv for d, lv in zip(dates, levels) if d.month in months]
    return float(np.mean(vals)) if vals else None


def _detect_anomalies(dates, levels, dataset_end, station_depth=None):
    """Flag the DWLR failure modes CGWB cares about: stuck, spiking, dead, patchy."""
    flags = []
    arr = np.asarray(levels, dtype=float)

    run = 1
    for i in range(1, len(arr)):
        run = run + 1 if arr[i] == arr[i - 1] else 1
        if run >= FLATLINE_DAYS:
            flags.append("flatline")
            break

    if len(arr) > 10:
        jumps = np.abs(np.diff(arr))
        mad = float(np.median(np.abs(jumps - np.median(jumps))))
        if np.any(jumps > max(SPIKE_FLOOR_M, SPIKE_MAD_MULTIPLE * mad)):
            flags.append("spike")

    span_days = (dates[-1] - dates[0]).days + 1
    if span_days > 0 and len(dates) / span_days < 0.7:
        flags.append("data_gaps")

    if (dataset_end - dates[-1]).days > STALE_DAYS:
        flags.append("stale")

    depth_limit = (station_depth or 0) + 20 if station_depth else None
    if np.any(arr < -MAX_HEIGHT_ABOVE_GROUND_M) or (
        depth_limit and np.any(arr > depth_limit)  # deeper than the borehole itself
    ):
        flags.append("out_of_range")

    return flags


def analyse(station, rows, dataset_end=None):
    """rows: list of (date, level_mbgl) ascending. Returns field updates for Station."""
    if not rows:
        return {"category": "unknown", "reading_count": 0, "anomalies": ["no_data"]}

    dates = [r[0] for r in rows]
    levels = [r[1] for r in rows]
    arr = np.asarray(levels, dtype=float)
    dataset_end = dataset_end or dates[-1]

    # Least-squares slope in metres per year; +ve means the table is deepening.
    day0 = dates[0]
    x = np.asarray([(d - day0).days for d in dates], dtype=float)
    trend = None
    if len(arr) >= 30 and x[-1] > 180:  # need half a year before a trend means anything
        trend = float(np.polyfit(x, arr, 1)[0] * 365.25)

    pre = _seasonal_mean(dates, levels, PRE_MONSOON_MONTHS)
    post = _seasonal_mean(dates, levels, POST_MONSOON_MONTHS)
    sy = station.specific_yield or specific_yield_for(station)

    fluctuation = recharge = None
    if pre is not None and post is not None:
        fluctuation = round(pre - post, 3)  # +ve = table rose over the monsoon
        recharge = round(max(fluctuation, 0.0) * sy * 1000, 1)

    anomalies = _detect_anomalies(dates, levels, dataset_end, station.well_depth_m)
    if trend is not None and abs(trend) > IMPLAUSIBLE_TREND_M_PER_YEAR:
        anomalies.append("suspect_trend")
    quality = 100.0
    span = max((dates[-1] - dates[0]).days + 1, 1)
    quality -= (1 - min(len(dates) / span, 1)) * 40
    quality -= 25 * ("flatline" in anomalies)
    quality -= 15 * ("spike" in anomalies)
    quality -= 20 * ("stale" in anomalies)
    quality -= 10 * ("out_of_range" in anomalies)
    quality -= 20 * ("suspect_trend" in anomalies)

    return {
        "latest_level_mbgl": round(float(arr[-1]), 3),
        "latest_date": dates[-1],
        "mean_level_mbgl": round(float(arr.mean()), 3),
        "min_level_mbgl": round(float(arr.min()), 3),
        "max_level_mbgl": round(float(arr.max()), 3),
        "pre_monsoon_mbgl": round(pre, 3) if pre is not None else None,
        "post_monsoon_mbgl": round(post, 3) if post is not None else None,
        "seasonal_fluctuation_m": fluctuation,
        "trend_m_per_year": round(trend, 4) if trend is not None else None,
        "recharge_mm": recharge,
        "specific_yield": sy,
        "category": categorise(trend),
        "data_quality": round(max(quality, 0.0), 1),
        "anomalies": anomalies,
        "reading_count": len(rows),
    }


def forecast(rows, horizon_days=90):
    """Trend + annual-seasonality projection of the water table.

    Deliberately harmonic regression on one seasonal cycle, not ARIMA/Prophet.
    Groundwater is dominated by the monsoon cycle plus a linear trend, which is
    exactly what this fits. Swap in a proper model only if backtest error
    justifies the dependency.
    """
    if len(rows) < 180:
        return []
    day0 = rows[0][0]
    x = np.asarray([(d - day0).days for d, _ in rows], dtype=float)
    y = np.asarray([lv for _, lv in rows], dtype=float)
    w = 2 * np.pi / 365.25

    # Fit the seasonal term only with two full cycles behind it. On a shorter
    # record the sinusoid soaks up part of the trend and the projection comes
    # back pointing the wrong way on stations that are plainly draining.
    seasonal = x[-1] >= 730
    columns = [np.ones_like(x), x]
    if seasonal:
        columns += [np.sin(w * x), np.cos(w * x)]
    coef, *_ = np.linalg.lstsq(np.column_stack(columns), y, rcond=None)

    def fitted(t):
        basis = [1, t] + ([np.sin(w * t), np.cos(w * t)] if seasonal else [])
        return float(coef @ basis)

    # Anchor to the last real reading and project the *change* from there. A
    # straight line through an accelerating decline sits well below its own final
    # point, so the raw fit would start the forecast metres away from reality.
    last_date, last_level = rows[-1]
    offset = last_level - fitted(x[-1])

    out = []
    for step in range(7, horizon_days + 1, 7):
        d = last_date + timedelta(days=step)
        out.append(
            {
                "date": d.isoformat(),
                "level_mbgl": round(fitted((d - day0).days) + offset, 3),
                "seasonal": seasonal,
            }
        )
    return out
