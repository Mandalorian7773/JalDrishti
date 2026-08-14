"""JalDrishti AI chatbot powered by Groq.

The LLM is given tool definitions that map to real database queries. When a user
asks a question ("which districts in Maharashtra are over-exploited?"), the model
calls the appropriate tool, we execute the query, feed the result back, and the
model writes a human-readable answer grounded in live data.
"""

import json
import os

from django.db.models import Avg, Count, Q

from groq import Groq

from .models import Reading, Station

GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
MODEL = "llama-3.3-70b-versatile"

SYSTEM_PROMPT = """\
You are **JalDrishti AI**, a helpful groundwater monitoring assistant for the
Central Ground Water Board (CGWB) of India.

You have access to a live database of DWLR (Digital Water Level Recorder)
stations across India. Use the provided tools to look up real data before
answering. Never invent numbers — if a tool returns no data, say so.

Keep answers concise, data-driven, and in plain language. Use bullet points and
tables (markdown) when comparing multiple items. Always mention the source is
CGWB DWLR telemetry data.

When the user asks about topics unrelated to groundwater, water levels, or the
JalDrishti app, politely redirect them back to groundwater topics.
"""

# ── Tool definitions (sent to Groq) ─────────────────────────────────────────

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "get_national_summary",
            "description": (
                "Get a national-level summary: total stations, category breakdown "
                "(safe / semi-critical / critical / over-exploited), average trend, "
                "average water level, number of declining and recovering stations."
            ),
            "parameters": {"type": "object", "properties": {}, "required": []},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_state_rankings",
            "description": (
                "Get a list of all Indian states ranked by their average groundwater depletion trend. "
                "Use this to find the most exploited (highest depletion rate) and least exploited states."
            ),
            "parameters": {"type": "object", "properties": {}, "required": []},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_state_summary",
            "description": (
                "Get groundwater summary for a specific Indian state: station count, "
                "category breakdown, average trend, average water level, worst districts."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "state": {
                        "type": "string",
                        "description": "Indian state name, e.g. 'Maharashtra', 'Goa', 'Rajasthan'",
                    }
                },
                "required": ["state"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_district_stations",
            "description": (
                "List DWLR stations in a specific district with their latest level, "
                "trend, and category."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "state": {"type": "string", "description": "State name"},
                    "district": {"type": "string", "description": "District name"},
                },
                "required": ["district"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_station_detail",
            "description": (
                "Get detailed info for one DWLR station by its station code: location, "
                "well type, aquifer, depth, latest reading, trend, category, anomalies."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "code": {
                        "type": "string",
                        "description": "DWLR station code, e.g. 'W2437'",
                    }
                },
                "required": ["code"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_critical_stations",
            "description": (
                "Get the stations with the worst (most negative) groundwater trends. "
                "Optionally filter by state. Returns top N stations ordered by depletion rate."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "state": {
                        "type": "string",
                        "description": "Optional state filter",
                    },
                    "limit": {
                        "type": "string",
                        "description": "Number of results (default 10)",
                    },
                },
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "search_stations",
            "description": (
                "Search stations by name, code, district, or state. "
                "Returns matching stations with key metrics."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Search term (station name, code, district, or state)",
                    }
                },
                "required": ["query"],
            },
        },
    },
]


# ── Tool implementations ────────────────────────────────────────────────────

def _round(v, d=3):
    return round(v, d) if v is not None else None


def tool_get_national_summary():
    qs = Station.objects.filter(anomalies=[])
    agg = qs.aggregate(
        total=Count("id"),
        avg_trend=Avg("trend_m_per_year"),
        avg_level=Avg("latest_level_mbgl"),
    )
    cats = {r["category"]: r["n"] for r in qs.values("category").annotate(n=Count("id"))}
    return {
        "total_stations": Station.objects.count(),
        "clean_stations": agg["total"],
        "avg_trend_m_per_year": _round(agg["avg_trend"]),
        "avg_level_mbgl": _round(agg["avg_level"]),
        "by_category": cats,
        "declining": qs.filter(trend_m_per_year__gt=0).count(),
        "recovering": qs.filter(trend_m_per_year__lt=0).count(),
        "total_readings": Reading.objects.count(),
        "states_covered": Station.objects.values("state").distinct().count(),
    }


def tool_get_state_rankings():
    # Use the same exclusion logic as the dashboard for consistency
    qs = Station.objects.exclude(anomalies__icontains="flatline").exclude(
        anomalies__icontains="out_of_range").exclude(anomalies__icontains="suspect_trend")
    rows = (
        qs.values("state")
        .annotate(
            stations=Count("id"),
            avg_trend=Avg("trend_m_per_year"),
            avg_level=Avg("latest_level_mbgl"),
            at_risk=Count("id", filter=Q(category__in=("critical", "over_exploited"))),
        )
        .order_by("-avg_trend")
    )
    return {
        "count": len(rows),
        "states": [
            {
                "state": r["state"],
                "avg_trend_m_per_year": _round(r["avg_trend"]),
                "avg_level_mbgl": _round(r["avg_level"]),
                "stations": r["stations"],
                "at_risk_stations": r["at_risk"],
            }
            for r in rows
        ]
    }


def tool_get_state_summary(state: str):
    qs = Station.objects.filter(state__iexact=state)
    if not qs.exists():
        # Try a case-insensitive contains search
        qs = Station.objects.filter(state__icontains=state)
    if not qs.exists():
        return {"error": f"No stations found for state '{state}'"}

    clean = qs.filter(anomalies=[])
    agg = clean.aggregate(
        total=Count("id"),
        avg_trend=Avg("trend_m_per_year"),
        avg_level=Avg("latest_level_mbgl"),
    )
    cats = {r["category"]: r["n"] for r in clean.values("category").annotate(n=Count("id"))}
    worst = list(
        clean.filter(trend_m_per_year__isnull=False)
        .order_by("-trend_m_per_year")
        .values("code", "name", "district", "trend_m_per_year", "category")[:5]
    )
    return {
        "state": qs.first().state,
        "total_stations": qs.count(),
        "clean_stations": agg["total"],
        "avg_trend_m_per_year": _round(agg["avg_trend"]),
        "avg_level_mbgl": _round(agg["avg_level"]),
        "by_category": cats,
        "worst_stations": worst,
    }


def tool_get_district_stations(district: str, state: str = None):
    qs = Station.objects.filter(district__icontains=district)
    if state:
        qs = qs.filter(state__icontains=state)
    if not qs.exists():
        return {"error": f"No stations found in district '{district}'"}
    return {
        "district": district,
        "count": qs.count(),
        "stations": list(
            qs.values(
                "code", "name", "state", "district",
                "latest_level_mbgl", "trend_m_per_year", "category",
            )[:20]
        ),
    }


def tool_get_station_detail(code: str):
    try:
        s = Station.objects.get(code=code)
    except Station.DoesNotExist:
        # Fuzzy match
        qs = Station.objects.filter(code__icontains=code)
        if qs.exists():
            s = qs.first()
        else:
            return {"error": f"Station '{code}' not found"}
    return {
        "code": s.code, "name": s.name, "state": s.state, "district": s.district,
        "tehsil": s.tehsil, "block": s.block,
        "latitude": s.latitude, "longitude": s.longitude,
        "well_type": s.well_type, "aquifer_type": s.aquifer_type,
        "well_depth_m": s.well_depth_m, "agency": s.agency,
        "latest_level_mbgl": s.latest_level_mbgl,
        "latest_date": str(s.latest_date) if s.latest_date else None,
        "mean_level_mbgl": _round(s.mean_level_mbgl),
        "trend_m_per_year": _round(s.trend_m_per_year),
        "category": s.category,
        "seasonal_fluctuation_m": _round(s.seasonal_fluctuation_m),
        "recharge_mm": _round(s.recharge_mm),
        "data_quality": _round(s.data_quality),
        "anomalies": s.anomalies,
        "reading_count": s.reading_count,
    }


def tool_get_critical_stations(state: str = None, limit=10):
    limit = int(limit) if limit else 10
    qs = Station.objects.filter(anomalies=[], trend_m_per_year__isnull=False)
    if state:
        qs = qs.filter(state__icontains=state)
    worst = list(
        qs.order_by("-trend_m_per_year")
        .values("code", "name", "state", "district", "trend_m_per_year", "category")
        [:min(limit, 20)]
    )
    return {"count": len(worst), "stations": worst}


def tool_search_stations(query: str):
    qs = Station.objects.filter(
        Q(name__icontains=query) | Q(code__icontains=query) |
        Q(district__icontains=query) | Q(state__icontains=query)
    )[:15]
    return {
        "count": len(qs),
        "stations": list(
            qs.values(
                "code", "name", "state", "district",
                "latest_level_mbgl", "trend_m_per_year", "category",
            )
        ),
    }


TOOL_MAP = {
    "get_national_summary": lambda _: tool_get_national_summary(),
    "get_state_rankings": lambda _: tool_get_state_rankings(),
    "get_state_summary": lambda a: tool_get_state_summary(**a),
    "get_district_stations": lambda a: tool_get_district_stations(**a),
    "get_station_detail": lambda a: tool_get_station_detail(**a),
    "get_critical_stations": lambda a: tool_get_critical_stations(**a),
    "search_stations": lambda a: tool_search_stations(**a),
}


# ── Main chat function ──────────────────────────────────────────────────────

def chat(messages: list[dict]) -> str:
    """Run a multi-turn conversation, handling tool calls transparently.

    `messages` is the full conversation history from the frontend
    (list of {"role": "user"|"assistant", "content": "..."}).
    Returns the assistant's final text reply.
    """
    client = Groq(api_key=GROQ_API_KEY)

    # Prepend system prompt
    full = [{"role": "system", "content": SYSTEM_PROMPT}] + messages

    # Allow up to 3 rounds of tool calling
    for _ in range(3):
        response = client.chat.completions.create(
            model=MODEL,
            messages=full,
            tools=TOOLS,
            tool_choice="auto",
            temperature=0.3,
            max_tokens=1024,
        )
        msg = response.choices[0].message

        if not msg.tool_calls:
            return msg.content or "I wasn't able to generate a response."

        # Process each tool call — build a clean dict (model_dump() may include
        # fields like 'annotations' that Groq rejects).
        assistant_msg = {"role": "assistant", "content": msg.content or ""}
        assistant_msg["tool_calls"] = [
            {
                "id": tc.id,
                "type": "function",
                "function": {"name": tc.function.name, "arguments": tc.function.arguments},
            }
            for tc in msg.tool_calls
        ]
        full.append(assistant_msg)
        for tc in msg.tool_calls:
            fn_name = tc.function.name
            try:
                args = json.loads(tc.function.arguments) if tc.function.arguments else {}
            except json.JSONDecodeError:
                args = {}

            handler = TOOL_MAP.get(fn_name)
            if handler:
                result = handler(args)
            else:
                result = {"error": f"Unknown tool: {fn_name}"}

            full.append({
                "role": "tool",
                "tool_call_id": tc.id,
                "content": json.dumps(result, default=str),
            })

    # If we exhausted rounds, do one final completion without tools
    response = client.chat.completions.create(
        model=MODEL, messages=full, temperature=0.3, max_tokens=1024,
    )
    return response.choices[0].message.content or "Sorry, I couldn't process that."
