import React, { useEffect, useState, useCallback, useRef } from "react";
import { Navigate } from "react-router-dom";
import './AdminEvents.css';

const PAGE_SIZE = 10;

function AdminEvents({ user }) {
    /* ================== STATE ================== */
    const [page, setPage] = useState(1);
    const [events, setEvents] = useState([]);
    const [totalPages, setTotalPages] = useState(1);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [editingId, setEditingId] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);

    const pageCache = useRef({});
    const pageTopRef = useRef(null);
    

    const emptyForm = {
        title: "",
        venue: "",
        date: "",
        time: "",
        presenter: "",
        desc: ""
    };

    const [form, setForm] = useState(emptyForm);

    /* ================== FETCH PAGE ================== */
    const fetchPage = useCallback(async (pageNumber, preload = false) => {
        if (pageCache.current[pageNumber]) {
            if (!preload) {
                setEvents(pageCache.current[pageNumber]);
                setLoading(false);
            }
            return;
        }

        try {
            if (!preload) {
                setLoading(true);
                setError(null);
            }

            const res = await fetch("/api/admin/events", {
                credentials: "include"
            });
            if (!res.ok) throw new Error("Fetch failed");

            const allEvents = await res.json();
            const total = Math.max(1, Math.ceil(allEvents.length / PAGE_SIZE));
            setTotalPages(total);

            const sliced = allEvents.slice(
                (pageNumber - 1) * PAGE_SIZE,
                pageNumber * PAGE_SIZE
            );

            pageCache.current[pageNumber] = sliced;

            if (!preload) setEvents(sliced);
        } catch (err) {
            console.error(err);
            setError("Failed to load events");
        } finally {
            if (!preload) setLoading(false);
        }
    }, []);
    /* ================== EFFECT ================== */
    useEffect(() => {
        fetchPage(page, false);
        if (page < totalPages) {
            fetchPage(page + 1, true);
        }
    }, [page, totalPages, fetchPage]);

    useEffect(() => {
        pageTopRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [page]);

    /* ================== ACCESS CONTROL ================== */
    if (!user || user.role !== "admin") {
        return <Navigate to="/" replace />;
    }

    /* ================== CRUD ================== */
    const startEdit = (ev) => {
        setEditingId(ev._id);
        setForm({
            title: ev.title || "",
            venue: ev.venue || "",
            date: ev.date || "",
            time: ev.time || "",
            presenter: ev.presenter || "",
            desc: ev.desc || ""
        });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setForm(emptyForm);
    };

    const saveEdit = async () => {
        try {
            const res = await fetch(`/api/admin/events/${editingId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(form)
            });
            if (!res.ok) throw new Error();

            pageCache.current = {};
            setEditingId(null);
            fetchPage(page);
        } catch {
            alert("Failed to update event");
        }
    };

    const saveNewEvent = async () => {
        try {
            const res = await fetch("/api/admin/events", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(form)
            });
            if (!res.ok) throw new Error();

            pageCache.current = {};
            setShowAddModal(false);
            setForm(emptyForm);
            setPage(1);
            fetchPage(1);
        } catch {
            alert("Failed to create event");
        }
    };

    const deleteEvent = async (id) => {
        if (!window.confirm("Delete this event?")) return;

        try {
            const res = await fetch(`/api/admin/events/${id}`, {
                method: "DELETE",
                credentials: "include"
            });
            if (!res.ok) throw new Error();

            pageCache.current = {};
            setPage(1);
            fetchPage(1);
        } catch {
            alert("Delete failed");
        }
    };

    /* ================== UI STATES ================== */
    if (loading) {
        return <div className="container-fluid mt-4">Loading events…</div>;
    }

    if (error) {
        return <div className="container-fluid mt-4 text-danger">{error}</div>;
    }

    /* ================== RENDER ================== */
    return (
        <div className="container-fluid mt-4">
            {/* header */}
            <div className="d-flex justify-content-between mb-2">
                <h2>Admin – Event Management</h2>
                <button
                    className="btn btn-success"
                    onClick={() => {
                        setForm(emptyForm);
                        setShowAddModal(true);
                    }}
                >
                    + Add Event
                </button>
            </div>

            {/* pagination - TOP */}
            <div ref={pageTopRef} className="d-flex justify-content-center mt-3 mb-3">
                <button
                    className="btn btn-outline-secondary btn-sm me-2"
                    disabled={page === 1}
                    onClick={() => {
                        setPage(p => p - 1);
                        pageTopRef.current?.scrollIntoView({ behavior: 'smooth' });
                    }}
                >
                    Prev
                </button>
                <span className="align-self-center pagination-text">
                    Page {page} / {totalPages}
                </span>
                <button
                    className="btn btn-outline-secondary btn-sm ms-2"
                    disabled={page === totalPages}
                    onClick={() => setPage(p => p + 1)}
                >
                    Next
                </button>
            </div>

            {/* table */}
            <div className="table-responsive">
                <table className="table table-bordered table-sm w-100">
                    <thead className="table-light">
                        <tr>
                            <th>Title</th>
                            <th>Venue</th>
                            <th>Date</th>
                            <th>Time</th>
                            <th>Presenter</th>
                            <th>Description</th>
                            <th style={{ width: 160 }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {events.map(ev => (
                            <tr key={ev._id}>
                                {["title", "venue", "date", "time", "presenter"].map(k => (
                                    <td key={k}>
                                        {editingId === ev._id ? (
                                            <input
                                                className="form-control form-control-sm"
                                                value={form[k]}
                                                onChange={e =>
                                                    setForm({ ...form, [k]: e.target.value })
                                                }
                                            />
                                        ) : ev[k]}
                                    </td>
                                ))}
                                <td>
                                    {editingId === ev._id ? (
                                        <textarea
                                            className="form-control form-control-sm"
                                            rows={2}
                                            value={form.desc}
                                            onChange={e =>
                                                setForm({ ...form, desc: e.target.value })
                                            }
                                        />
                                    ) : ev.desc && <div className="desc-scroll">{ev.desc}</div>}
                                </td>
                                <td>
                                    {editingId === ev._id ? (
                                        <>
                                            <button
                                                className="btn btn-success btn-sm me-1"
                                                onClick={saveEdit}
                                            >
                                                Save
                                            </button>
                                            <button
                                                className="btn btn-secondary btn-sm"
                                                onClick={cancelEdit}
                                            >
                                                Cancel
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button
                                                className="btn btn-primary btn-sm me-1"
                                                onClick={() => startEdit(ev)}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                className="btn btn-danger btn-sm"
                                                onClick={() => deleteEvent(ev._id)}
                                            >
                                                Delete
                                            </button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* pagination - BOTTOM */}
            <div className="d-flex justify-content-center mt-3">
                <button
                    className="btn btn-outline-secondary btn-sm me-2"
                    disabled={page === 1}
                    onClick={() => {
                        setPage(p => p - 1);
                        pageTopRef.current?.scrollIntoView({ behavior: 'smooth' });
                    }}
                >
                    Prev
                </button>
                <span className="align-self-center pagination-text">
                    Page {page} / {totalPages}
                </span>
                <button
                    className="btn btn-outline-secondary btn-sm ms-2"
                    disabled={page === totalPages}
                    onClick={() => {
                        setPage(p => p + 1);
                        pageTopRef.current?.scrollIntoView({ behavior: 'smooth' });
                    }}
                >
                    Next
                </button>
            </div>

            {/* ADD EVENT MODAL — React-only (no Bootstrap JS) */}
            {showAddModal && (
                <div
                    style={{
                        position: "fixed",
                        inset: 0,
                        backgroundColor: "rgba(0,0,0,0.5)",
                        zIndex: 1050,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                    }}
                >
                    <div
                        style={{
                            background: "#fff",
                            borderRadius: 6,
                            width: "100%",
                            maxWidth: 700,
                            padding: 20
                        }}
                    >
                        <h5 className="mb-3">Add New Event</h5>

                        {["title", "venue", "date", "time", "presenter"].map(k => (
                            <div className="mb-2" key={k}>
                                <label className="form-label text-capitalize">{k}</label>
                                <input
                                    className="form-control"
                                    value={form[k]}
                                    onChange={e =>
                                        setForm({ ...form, [k]: e.target.value })
                                    }
                                />
                            </div>
                        ))}

                        <div className="mb-3">
                            <label className="form-label">Description</label>
                            <textarea
                                className="form-control"
                                rows={3}
                                value={form.desc}
                                onChange={e =>
                                    setForm({ ...form, desc: e.target.value })
                                }
                            />
                        </div>

                        <div className="text-end">
                            <button
                                className="btn btn-secondary me-2"
                                onClick={() => setShowAddModal(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn btn-success"
                                onClick={saveNewEvent}
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminEvents;
