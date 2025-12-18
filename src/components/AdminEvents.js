import React, { useEffect, useState, useCallback, useRef } from "react";
import { Navigate } from "react-router-dom";
import './AdminEvents.css';

const PAGE_SIZE = 10;

/* ================== PAGINATION ================== */
function Pagination({ page, totalPages, setPage }) {
    return (
        <div className="d-flex justify-content-center align-items-center gap-2 my-3">
            <button
                className="btn btn-outline-secondary btn-sm"
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
            >
                Prev
            </button>
            <span className="fw-semibold">
                Page {page} / {totalPages}
            </span>
            <button
                className="btn btn-outline-secondary btn-sm"
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
            >
                Next
            </button>
        </div>
    );
}

/* ================== MAIN ================== */
function AdminEvents({ user }) {
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

    /* ================== FETCH ================== */
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

            const res = await fetch("/api/admin/events", { credentials: "include" });
            if (!res.ok) throw new Error();

            const all = await res.json();
            const total = Math.max(1, Math.ceil(all.length / PAGE_SIZE));
            setTotalPages(total);

            const sliced = all.slice(
                (pageNumber - 1) * PAGE_SIZE,
                pageNumber * PAGE_SIZE
            );

            pageCache.current[pageNumber] = sliced;
            if (!preload) setEvents(sliced);
        } catch {
            setError("Failed to load events");
        } finally {
            if (!preload) setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPage(page, false);
        if (page < totalPages) fetchPage(page + 1, true);
    }, [page, totalPages, fetchPage]);

    useEffect(() => {
        pageTopRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [page]);

    useEffect(() => {
        pageTopRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [page]);

    /* ================== ACCESS CONTROL ================== */
    if (!user || user.role !== "admin") {
        return <Navigate to="/" replace />;
    }

    /* ================== CRUD ================== */
    const startEdit = ev => {
        setEditingId(ev._id);
        setForm({ ...emptyForm, ...ev });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setForm(emptyForm);
    };

    const saveEdit = async () => {
        const res = await fetch(`/api/admin/events/${editingId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(form)
        });
        if (!res.ok) return alert("Update failed");

        pageCache.current = {};
        setEditingId(null);
        fetchPage(page);
    };

    const saveNewEvent = async () => {
        const res = await fetch("/api/admin/events", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(form)
        });
        if (!res.ok) return alert("Create failed");

        pageCache.current = {};
        setShowAddModal(false);
        setForm(emptyForm);
        setPage(1);
        fetchPage(1);
    };

    const deleteEvent = async id => {
        if (!window.confirm("Delete this event?")) return;

        const res = await fetch(`/api/admin/events/${id}`, {
            method: "DELETE",
            credentials: "include"
        });
        if (!res.ok) return alert("Delete failed");

        pageCache.current = {};
        setPage(1);
        fetchPage(1);
    };

    if (loading) return <div className="container-fluid mt-4">Loading…</div>;
    if (error) return <div className="container-fluid mt-4 text-danger">{error}</div>;

    const cellStyle = {
        whiteSpace: "normal",
        wordBreak: "break-word",
        overflowWrap: "anywhere",
        verticalAlign: "top"
    };


    return (
        <div className="container-fluid mt-3">
            {/* HEADER */}
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 mb-3">
                <h2 className="mb-0">Admin – Event Management</h2>
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
                            <th style={{ width: "16%" }}>Title</th>
                            <th style={{ width: "14%" }}>Venue</th>
                            <th style={{ width: "10%" }}>Date</th>
                            <th style={{ width: "8%" }}>Time</th>
                            <th style={{ width: "14%" }}>Presenter</th>
                            <th style={{ width: "28%" }}>Description</th>
                            <th style={{ width: "10%" }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {events.map(ev => (
                            <tr key={ev._id}>
                                <td style={cellStyle}>{ev.title}</td>
                                <td style={cellStyle}>{ev.venue}</td>

                                <td style={cellStyle}>{ev.date}</td>
                                <td style={cellStyle}>{ev.time}</td>

                                <td style={cellStyle}>{ev.presenter}</td>
                                <td style={cellStyle}>{ev.desc}</td>

                                <td
                                    className="text-center"
                                    style={{ verticalAlign: "top", whiteSpace: "nowrap" }}
                                >
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
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="mt-3 mb-5">
                <Pagination page={page} totalPages={totalPages} setPage={setPage} />
            </div>

            {/* ================== ADD / EDIT MODAL ================== */}
            {(showAddModal || editingId) && (
                <div
                    style={{
                        position: "fixed",
                        inset: 0,
                        background: "rgba(0,0,0,0.5)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 1050
                    }}
                >
                    <div id="modify-event" style={{ background: "#fff", padding: 20, width: "100%", maxWidth: 600 }}>
                        <h5>{editingId ? "Edit Event" : "Add Event"}</h5>

                        {Object.keys(emptyForm).map(k => (
                            <div className="mb-2" key={k}>
                                <label className="form-label text-capitalize">{k}</label>
                                {k === "desc" ? (
                                    <textarea
                                        className="form-control"
                                        rows={3}
                                        value={form[k]}
                                        onChange={e => setForm({ ...form, [k]: e.target.value })}
                                    />
                                ) : (
                                    <input
                                        className="form-control"
                                        value={form[k]}
                                        onChange={e => setForm({ ...form, [k]: e.target.value })}
                                    />
                                )}
                            </div>
                        ))}

                        <div className="text-end">
                            <button
                                className="btn btn-secondary me-2"
                                onClick={() => {
                                    cancelEdit();
                                    setShowAddModal(false);
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn btn-success"
                                onClick={editingId ? saveEdit : saveNewEvent}
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
