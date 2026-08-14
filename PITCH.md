# JalDrishti — SIH Mock Pitch Script (8 min + 2 min Q&A)

**Problem theme:** Real-time groundwater resource evaluation from DWLR data — Ministry of Jal Shakti / CGWB
**Split:** 4:00 PPT · 4:00 live deployment · 2:00 Q&A

Every number below is from the actual database (`Backend/db.sqlite3`, analysed 2026-08-14). Do not round them up on stage — the precision *is* the credibility.

## The numbers you must know cold

| Fact | Value |
|---|---|
| DWLR recorders ingested | **3,263** |
| Daily observations | **2,407,898** (2.41 M) |
| Coverage | **25 states, 337 districts** |
| Record window | Jan 2024 → Jun 2026 |
| Recorders tripping ≥1 quality flag | **1,679 (51%)** |
| Recorders with clean telemetry | **1,584** |
| Clean recorders at risk (critical + over-exploited) | **379 (24%)** |
| Clean recorders declining / recovering | **568 / 1,015** |
| Mean water table | **14.25 m bgl** |
| Mean monsoon recharge (GEC-2015 WTF) | **98.2 mm** |
| Fastest depleting station | Gaddamvaripalle, Chittoor, AP — **+9.61 m/yr** |
| States with 0 clean recorders | **Punjab (204), Haryana (161), Uttarakhand (12)** |

---

# PART 1 — PPT (4:00)

Five speaking slides on the official SIH template. ~48 s each. Keep a stopwatch on slide 3.

## Slide 1 — Title / PS details (0:00–0:15, do not dwell)

Read only: PS ID, title, team name. Then straight into the hook.

> "Team [name], problem statement [ID] — real-time groundwater resource evaluation from DWLR telemetry."

## Slide 2 — Proposed Solution (0:15–1:05)

**Open with the finding, not the architecture.** Judges have heard forty dashboards today.

> "CGWB runs thousands of Digital Water Level Recorders across India. The data is public on India-WRIS. But it arrives as raw depth readings — a number, a timestamp, a station code. Nothing in it tells an officer whether a block is depleting, how much the monsoon actually recharged, or whether the sensor is even working.
>
> We pulled the real feed. 3,263 telemetric recorders, 2.4 million daily readings, 25 states. And the first thing the pipeline told us was uncomfortable: **half the network — 1,679 recorders — trips at least one data-quality check.** Stuck sensors repeating the same value for weeks. Readings from below the borehole floor. Datum shifts that look like an aquifer collapsing at ten metres a year.
>
> If you average that raw feed, you are not measuring groundwater. You are measuring broken hardware. JalDrishti is the layer that separates the two — it grades every recorder, throws the bad ones out of the statistics, and computes CGWB's own resource evaluation on what's left."

**Innovation & uniqueness — three bullets, say them fast:**
1. **Sensor triage first, analytics second.** Every station carries a 0–100 quality score and typed fault flags. No other groundwater dashboard tells CGWB *which recorder to send a technician to*.
2. **Coverage-bias-free national trend.** We plot each reading's deviation from its *own* station's mean, not the raw average — so the curve moves only when water moves, not when stations drop offline.
3. **The official methodology, not a made-up index.** Recharge is GEC-2015 Water Table Fluctuation with specific yield keyed to each state's aquifer formation — the same method CGWB uses on paper.

## Slide 3 — Technical Approach (1:05–1:55)

Point at the flow chart, narrate the *pipeline*, not the logos.

> "Four stages.
>
> **Ingest** — a threaded downloader walks all 700-odd districts on the India-WRIS API, keeps only `Telemetric` rows because manual dipper readings are not DWLR data, and collapses 6-hourly samples to a daily median per station. Retries on truncated responses, resumable, and one bad district can't kill the run.
>
> **Validate** — every series goes through five detectors: flatline, spike, gaps, stale, out-of-range. The spike test is per-station — it compares against that bore's own day-to-day variability using a median-absolute-deviation multiple, because a bore next to a running pump genuinely swings metres in a day and a fixed threshold would flag every healthy station in a pumping zone.
>
> **Analyse** — least-squares trend in metres per year, pre- and post-monsoon means, GEC-2015 recharge, depletion category, and a 90-day projection: harmonic regression fitting a linear trend plus one annual monsoon cycle. Deliberately not ARIMA — groundwater *is* trend plus monsoon, and we only fit the seasonal term when two full cycles exist, otherwise the sinusoid eats the trend and the projection points the wrong way.
>
> **Serve** — Django REST API. The national trend query scans all 2.4 million rows and takes 28 seconds cold, so we precompute it into a snapshot table during analysis and the request path reads one row.
>
> Frontend is one Expo React Native codebase that ships as a web app, an Android APK and iOS from the same source. Backend on Render with Postgres, frontend on Vercel."

## Slide 4 — Feasibility & Viability (1:55–2:45)

> "Feasibility isn't a projection for us — **it's already running on the real national dataset.** No mock data, no sample CSV.
>
> Three real risks and what we did about them:
>
> **The upstream API is fragile.** It truncates large responses under load and occasionally returns HTML instead of JSON. We retry with backoff, page defensively, and the whole download is resumable — that's why we have 2.4 million rows and not a timeout.
>
> **Dirty data would silently corrupt every headline number.** A single datum shift produces a trend of tens of metres a year that swamps any average it lands in. That's why validation runs *before* aggregation and every figure on the dashboard is computed over clean stations only.
>
> **Cost.** The entire stack runs on free tiers — Render free web service, free Postgres, Vercel. Incremental refresh only pulls the last 30 days for districts already in the database, so the daily cron is minutes, not hours. For CGWB this deploys on existing NIC infrastructure with no licensing."

## Slide 5 — Impact & Benefits (2:45–3:35)

> "**Operational.** 379 clean recorders — a quarter of the trustworthy network — are in critical or over-exploited decline. Those are named blocks, on a map, ranked by rate. That's an artificial-recharge and abstraction-limit priority list an officer can act on this week.
>
> **Infrastructure.** 1,679 recorders need a maintenance decision. Punjab, Haryana and Uttarakhand — some of India's most stressed aquifers — have **zero** recorders passing every check in this window. That is either a servicing backlog or a regional calibration gap, and either way it's a finding you cannot get from the raw portal.
>
> **Scientific.** Recharge in millimetres per station per season, using the committee's own method, feeds straight into the block-level assessment CGWB already publishes — but continuously, instead of once a year.
>
> **Public.** Same app on a phone. A farmer or panchayat can see their own block's water table and the ninety-day projection."

## Slide 6 — Research & References (3:35–3:50)

Ten seconds. Point, don't read.

> "India-WRIS Ground Water Level dataset — the live CGWB telemetric feed, our sole data source. GEC-2015 for the recharge methodology and specific yield norms. Everything else is our own code."

**Handoff line (3:50–4:00):**
> "That's the thesis. Let me show you it running on the real data."

---

# PART 2 — LIVE DEPLOYMENT (4:00)

⚠️ **Pre-flight, 10 minutes before you present:** hit the API URL in a browser to wake the Render free tier — it spins down after 15 minutes idle and the first request takes ~50 seconds. Also open all five tabs once so bundles are cached. *(As of this writing `jaldrishti-api.onrender.com/api/summary/` returns 404 — verify your live URL and redeploy before the mock, or run the demo against `localhost:8000` + `expo start --web`.)*

Have a browser window and your phone both ready. **Do not narrate what you are clicking.** Narrate what the screen means.

### Beat 1 — Dashboard (0:00–1:00)

Land here. Let the KPI row sit for two seconds before you talk.

> "3,263 recorders, 2.4 million daily observations, live. Mean water table 14.25 metres below ground. Mean monsoon recharge 98 millimetres, computed per station by the GEC method.
>
> This chart is the one I'd defend hardest." *(point at the national anomaly curve)* "Every point is the average **deviation of each reading from its own station's mean.** If we plotted raw average depth instead, this line would move every time a shallow region dropped offline — coverage swings by hundreds of stations month to month. This curve only moves when the water table moves. The sawtooth is the monsoon refilling the aquifer every autumn.
>
> And this tile" *(point at Data quality)* "— 1,679 recorders excluded. Every other number on this screen is computed without them."

### Beat 2 — Map (1:00–1:50)

> "Every recorder, coloured by depletion category."

Click **Over-Exploited**.

> "267 recorders in sustained decline. Peninsular hard-rock India — Telangana, Andhra, Tamil Nadu, Rajasthan — thin aquifers, heavy extraction."

Click a grey marker.

> "Grey is deliberate. A flagged sensor's category isn't trustworthy, so we refuse to paint it as if it were. We show it as unknown rather than guess."

Filter to **Punjab**.

> "And here's the uncomfortable one. Punjab: 204 recorders, not one of them passes every quality check in this window. Mostly stale transmission. The state with the most-studied groundwater crisis in India, and its live telemetry can't currently support a trend claim."

### Beat 3 — Station analytics (1:50–3:00) — *your strongest 70 seconds*

Search or pick the top-ranked declining station.

> "Gaddamvaripalle, Chittoor district, Andhra Pradesh. Water table falling **9.6 metres a year** — currently 29 metres below ground."

Point at the series chart.

> "Its own daily record. Line rising means water getting deeper."

Point at the projection row.

> "Ninety-day projection — trend plus the fitted annual monsoon cycle, anchored to the last real reading so the forecast starts where the data actually ended, not where a straight line thinks it should have."

Scroll to the recharge card. **Read the equation off the screen.**

> "And this is why an officer would trust the number: we show the arithmetic. Seasonal rise, times specific yield for this aquifer formation, times a thousand, equals recharge in millimetres. That's GEC-2015, verbatim. Nothing hidden in a model."

Scroll to Sensor health.

> "Quality score and the named faults. This is the maintenance ticket."

### Beat 4 — Alerts (3:00–3:35)

> "Two queues, because they go to two different people."

Toggle between the tabs.

> "**Depletion** — where the resource is failing. That's a policy and recharge decision. **Sensor** — where the hardware is failing, ranked worst quality first. That's a technician dispatch. Same dataset, two workflows, and neither one contaminates the other."

### Beat 5 — Scale + mobile (3:35–4:00)

Click **States** — one sentence:

> "Every state ranked by mean trend across its clean recorders."

Then hold up the phone.

> "Same codebase. Web dashboard for the officer, Android app for the field. One repository."

**Closing line:**
> "Real feed, real validation, real methodology — deployed, not mocked. Happy to take questions."

---

# PART 3 — Q&A PREP (2:00)

Answer in **two sentences**, then stop talking. The most common way to lose a Q&A is filling silence.

**Q: Half your recorders are flagged? That seems too high.**
> Deliberately conservative — a flag means the station tripped a check *anywhere* in a 2.4-year window, not that it's broken today. Most common is a single implausible jump, and since one datum shift poisons a trend for the whole record, we'd rather exclude a good station than publish a fabricated depletion rate.

**Q: Why not ARIMA / LSTM / Prophet for forecasting?**
> Groundwater is a linear trend plus one annual monsoon cycle — that's precisely what harmonic regression fits, with four coefficients instead of a training pipeline. We'd swap in a heavier model the moment backtest error justified the dependency, and not before.

**Q: Is this real data or a sample?**
> Live India-WRIS CGWB telemetric feed, telemetric-mode rows only, 3,263 stations and 2.4 million daily readings from January 2024. The downloader is in the repo — `scripts/fetch_wris.py`.

**Q: Your categories aren't CGWB's official categories.**
> Correct, and we say so in the code and on the screen. Official categorisation needs per-block extraction and draft figures that aren't in this feed, so ours are depletion-*rate* proxies in metres per year — when CGWB supplies extraction data, the threshold table is one constant to change.

**Q: How is this different from the India-WRIS portal itself?**
> WRIS gives you the raw reading. We give you the trend, the recharge in millimetres, the risk category, the 90-day projection, and — the part nobody else does — whether the sensor producing that reading can be trusted at all.

**Q: How does it scale to the full national network / real-time ingestion?**
> The expensive queries are precomputed into a snapshot table by a management command, so the API reads one row instead of scanning 2.4 million. `manage.py refresh` pulls only the last 30 days for known districts — that's a nightly cron, and the query path doesn't get slower as history grows.

**Q: Why is the national trend showing recovery? Isn't India depleting?**
> Over this specific window — 2024 to mid-2026, two strong monsoons — 1,015 clean stations are recovering against 568 declining. That's an honest read of this window, not a claim about the decade, and it's exactly why the per-station and per-state views matter more than the national average.

**Q: What's your specific yield source, and isn't one value per state crude?**
> GEC-2015 norms, keyed to each state's dominant aquifer formation — alluvium 0.12, basalt 0.02, crystalline 0.025. It's a documented fallback, and any station can override it with its own measured value; the field already exists on the model.

**Q: Security / production readiness?**
> Environment-driven secrets, CORS and CSRF origins pinned by config, HTTPS enforced in production, and deployment is a single Render blueprint in the repo. Free tier today, one plan change to scale.

**Q: What would you build next?**
> Rainfall correlation per station, so we can separate monsoon-driven recovery from genuine extraction reduction. Then block-level aggregation to match CGWB's assessment units, and SMS alerts for panchayats.

---

# Failure drills

| If this happens | Do this |
|---|---|
| API cold / slow | Keep talking through the KPI narrative — it wakes in ~50 s. Don't refresh repeatedly. |
| Deployment down entirely | Switch to `localhost` (`python manage.py runserver` + `npx expo start --web`). Say "running locally, same code, same 2.4 million rows" — do not apologise twice. |
| Map won't render | It's a Leaflet iframe needing network for tiles. Skip to Analytics — that's the stronger beat anyway. |
| Judge interrupts mid-demo | Answer in one sentence, then "and this next screen shows exactly that" — steer back. |
| You're at 3:00 with two beats left | Drop States and the phone. Never drop Analytics. |

# Rehearsal notes

- **Time slide 3.** Technical Approach is where every team overruns. If you can't do it in 50 seconds, cut the ingest paragraph, not the validation one.
- **Lead with the 51% finding in the first 30 seconds.** It's the only thing in this pitch no other team will have.
- Say **"m below ground level"** out loud, never "mbgl" — half the panel won't parse the acronym.
- Never say "we built a dashboard." Say "we built the validation layer that makes the dashboard trustworthy."
