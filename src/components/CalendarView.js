import React, { useEffect, useState } from "react";
import "./CalendarView.css";

/* ================== CONSTANTS ================== */

const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

const WEEKDAY_ORDER = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/* ================== HELPERS ================== */

function isWeeklyEvent(dateStr = "") {
    return dateStr.includes("Every");
}

function extractWeekday(dateStr = "") {
    return WEEKDAY_ORDER.find(d => dateStr.includes(d)) || "";
}

function extractDayNumber(dateStr = "") {
    const match = dateStr.match(/\b(\d{1,2})[\/\s]/);
    return match ? parseInt(match[1], 10) : 99;
}

function extractMonthIndex(dateStr = "") {
    const numeric = dateStr.match(/\b\d{1,2}\/(\d{1,2})\/\d{4}/);
    if (numeric) return parseInt(numeric[1], 10) - 1;

    for (let i = 0; i < MONTH_NAMES.length; i++) {
        if (dateStr.includes(MONTH_NAMES[i].slice(0, 3))) return i;
    }
    return null;
}

/* ================== COMPONENT ================== */

function CalendarView() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [monthIndex, setMonthIndex] = useState(new Date().getMonth());
    const [showWeekly, setShowWeekly] = useState(false);

    /* ================== FETCH ================== */

    useEffect(() => {
        async function fetchEvents() {
            try {
                const res = await fetch("/api/calendar/events");
                if (!res.ok) throw new Error("Fetch failed");
                setEvents(await res.json());
            } catch (err) {
                console.error(err);
                setError("Failed to load events");
            } finally {
                setLoading(false);
            }
        }
        fetchEvents();
    }, []);

    /* ================== FILTER BY MONTH ================== */

    const monthEvents = events.filter(ev => {
        const m = extractMonthIndex(ev.date);
        return m === monthIndex;
    });

    /* ================== WEEKLY EVENTS ================== */

    const weeklyEvents = monthEvents
        .filter(ev => isWeeklyEvent(ev.date))
        .sort(
            (a, b) =>
                WEEKDAY_ORDER.indexOf(extractWeekday(a.date)) -
                WEEKDAY_ORDER.indexOf(extractWeekday(b.date))
        );

    /* ================== OTHER EVENTS (SORTED 1 → 30) ================== */

    const otherEvents = monthEvents
        .filter(ev => !isWeeklyEvent(ev.date))
        .sort(
            (a, b) =>
                extractDayNumber(a.date) - extractDayNumber(b.date)
        );

    const visibleEvents = showWeekly ? weeklyEvents : otherEvents;

    /* ================== UI STATES ================== */

    if (loading) return <div className="container-fluid mt-4">Loading…</div>;
    if (error) return <div className="container-fluid mt-4 text-danger">{error}</div>;

    /* ================== RENDER ================== */

    return (
        <div className="container-fluid mt-4">

            {/* HEADER */}
            <div className="d-flex justify-content-between align-items-center mb-3">
                <button
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => setMonthIndex(m => (m === 0 ? 11 : m - 1))}
                >
                    ◀
                </button>

                <h3 className="mb-0">
                    {MONTH_NAMES[monthIndex]}
                </h3>

                <button
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => setMonthIndex(m => (m === 11 ? 0 : m + 1))}
                >
                    ▶
                </button>
            </div>

            {/* TOGGLE */}
            <div className="text-center mb-3">
                <button
                    className="btn btn-sm btn-primary"
                    onClick={() => setShowWeekly(w => !w)}
                >
                    {showWeekly ? "Show Other Events" : "Show Weekly Events"}
                </button>
            </div>

            {/* EVENTS */}
            {visibleEvents.length === 0 ? (
                <div className="alert alert-secondary text-center">
                    No {showWeekly ? "weekly" : "other"} events this month.
                </div>
            ) : (
                visibleEvents.map(ev => (
                    <EventRow
                        key={ev._id}
                        leftLabel={
                            showWeekly
                                ? extractWeekday(ev.date).toUpperCase()
                                : extractDayNumber(ev.date)
                        }
                        event={ev}
                    />
                ))
            )}
        </div>
    );
}

/* ================== EVENT ROW ================== */

function EventRow({ leftLabel, event }) {
    return (
        <div className="calendar-event">
            <div className="calendar-date">
                {leftLabel}
            </div>

            <div className="calendar-content">
                <h5 className="event-title">{event.title}</h5>

                <div className="event-date-full">
                    {event.date}
                </div>

                <div className="event-meta">
                    {event.time} · {event.venue?.name}
                </div>

                <div className="event-presenter">
                    Presenter: {event.presenter}
                </div>
            </div>
        </div>
    );
}

export default CalendarView;
