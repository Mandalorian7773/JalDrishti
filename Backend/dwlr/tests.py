"""Checks for the groundwater maths. Run: python manage.py test dwlr"""
from datetime import date, timedelta

from django.test import SimpleTestCase

from dwlr.analytics import analyse, categorise, forecast
from dwlr.models import Station


def series(fn, days=800, start=date(2024, 1, 1)):
    return [(start + timedelta(days=i), fn(i)) for i in range(days)]


class AnalyticsTests(SimpleTestCase):
    def setUp(self):
        self.station = Station(code="T1", name="Test", state="Punjab", district="X",
                               latitude=30.0, longitude=75.0)

    def test_declining_table_is_flagged_and_trend_is_metres_per_year(self):
        # 1 m deeper every year
        out = analyse(self.station, series(lambda i: 10 + i / 365.25))
        self.assertAlmostEqual(out["trend_m_per_year"], 1.0, places=2)
        self.assertEqual(out["category"], "over_exploited")

    def test_rising_table_is_safe(self):
        out = analyse(self.station, series(lambda i: 10 - i / 365.25))
        self.assertLess(out["trend_m_per_year"], 0)
        self.assertEqual(out["category"], "safe")

    def test_recharge_follows_gec_water_table_fluctuation_method(self):
        # 2 m shallower in Oct-Nov than in Apr-May; Punjab alluvium Sy = 0.12
        # => 2 * 0.12 * 1000 = 240 mm
        def level(i):
            month = (date(2024, 1, 1) + timedelta(days=i)).month
            return 10.0 if month in (4, 5) else (8.0 if month in (10, 11) else 9.0)

        out = analyse(self.station, series(level))
        self.assertAlmostEqual(out["seasonal_fluctuation_m"], 2.0, places=2)
        self.assertAlmostEqual(out["specific_yield"], 0.12)
        self.assertAlmostEqual(out["recharge_mm"], 240.0, places=1)

    def test_stuck_sensor_and_impossible_jump_are_caught(self):
        flat = analyse(self.station, series(lambda i: 7.5, days=60))
        self.assertIn("flatline", flat["anomalies"])
        self.assertLess(flat["data_quality"], 100)

        spiky = analyse(self.station, series(lambda i: 7.5 + (50 if i == 40 else 0), days=90))
        self.assertIn("spike", spiky["anomalies"])

    def test_gaps_and_staleness_are_scored(self):
        rows = [(date(2024, 1, 1) + timedelta(days=i * 5), 7.0 + i * 0.01) for i in range(60)]
        out = analyse(self.station, rows, dataset_end=date(2026, 8, 1))
        self.assertIn("data_gaps", out["anomalies"])
        self.assertIn("stale", out["anomalies"])

    def test_empty_series_does_not_crash(self):
        self.assertEqual(analyse(self.station, [])["category"], "unknown")

    def test_forecast_extends_the_trend(self):
        out = forecast(series(lambda i: 10 + i / 365.25), horizon_days=90)
        self.assertTrue(out)
        self.assertGreater(out[-1]["level_mbgl"], 12.0)  # keeps deepening

    def test_short_record_projects_trend_without_a_seasonal_term(self):
        # 18 months of steady decline must not project a recovery
        rows = series(lambda i: 10 + i * 0.05, days=540)
        out = forecast(rows, horizon_days=90)
        self.assertFalse(out[0]["seasonal"])
        self.assertGreater(out[-1]["level_mbgl"], rows[-1][1])

    def test_projection_starts_from_the_last_reading_not_the_fitted_line(self):
        # accelerating decline: a raw linear fit ends far below the real last point
        rows = series(lambda i: 10 + (i / 100) ** 2, days=540)
        out = forecast(rows, horizon_days=90)
        self.assertGreater(out[0]["level_mbgl"], rows[-1][1])
        self.assertLess(out[0]["level_mbgl"] - rows[-1][1], 3.0)  # continuous, no jump

    def test_datum_shift_sized_trend_is_flagged_not_reported_as_depletion(self):
        out = analyse(self.station, series(lambda i: 10 + i * 0.1))  # ~36 m/yr
        self.assertIn("suspect_trend", out["anomalies"])

    def test_severe_but_physical_depletion_is_not_flagged(self):
        out = analyse(self.station, series(lambda i: 10 + i * 0.01))  # ~3.6 m/yr
        self.assertNotIn("suspect_trend", out["anomalies"])
        self.assertEqual(out["category"], "over_exploited")

    def test_categorise_boundaries(self):
        self.assertEqual(categorise(0.05), "safe")
        self.assertEqual(categorise(0.2), "semi_critical")
        self.assertEqual(categorise(0.45), "critical")
        self.assertEqual(categorise(0.9), "over_exploited")
        self.assertEqual(categorise(None), "unknown")
