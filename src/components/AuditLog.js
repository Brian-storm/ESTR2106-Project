import React, { useEffect, useState, useCallback, useRef } from "react";
import { Navigate } from "react-router-dom";

const PAGE_SIZE = 10;

function AuditLog({ user }) {
    /* ================== STATE ================== */
    const [page, setPage] = useState(1);
    const [logs, setLogs] = useState([]);
    const [totalPages, setTotalPages] = useState(1);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const pageCache = useRef({});

    /* ================== FETCH PAGE ================== */
    const fetchPage = useCallback(async (pageNumber, preload = false) => {
        if (pageCache.current[pageNumber]) {
            if (!preload) {
                setLogs(pageCache.current[pageNumber]);
                setLoading(false);
            }
            return;
        }

        try {
            if (!preload) {
                setLoading(true);
                setError(null);
            }

            const res = await fetch("/api/admin/audit-logs", {
                credentials: "include"
            });
            if (!res.ok) throw new Error("Fetch failed");

            const allLogs = await res.json();

            const total = Math.max(1, Math.ceil(allLogs.length / PAGE_SIZE));
            setTotalPages(total);

            const sliced = allLogs.slice(
                (pageNumber - 1) * PAGE_SIZE,
                pageNumber * PAGE_SIZE
            );

            pageCache.current[pageNumber] = sliced;

            if (!preload) setLogs(sliced);
        } catch (err) {
            console.error(err);
            setError("Failed to load audit logs");
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

    /* ================== ACCESS CONTROL ================== */
    if (!user || user.role !== "admin") {
        return <Navigate to="/" replace />;
    }

    /* ================== UI STATES ================== */
    if (loading) {
        return <div className="container-fluid mt-4">Loading audit logs…</div>;
    }

    if (error) {
        return (
            <div className="container-fluid mt-4 text-danger">
                {error}
            </div>
        );
    }

    /* ================== RENDER ================== */
    return (
        <div className="container-fluid mt-4">
            {/* header */}
            <div className="d-flex justify-content-between mb-2">
                <h2>Admin – Audit Log</h2>
            </div>

            {/* table */}
            <div className="table-responsive">
                <table className="table table-bordered table-sm w-100">
                    <thead className="table-light">
                        <tr>
                            <th>Timestamp</th>
                            <th>Admin</th>
                            <th>Action</th>
                            <th>Target Type</th>
                            <th>Target ID</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.map(log => (
                            <tr key={log._id}>
                                <td>
                                    {new Date(log.timestamp).toLocaleString()}
                                </td>
                                <td>{log.adminUsername}</td>
                                <td>
                                    <span
                                        className={
                                            log.action === "DELETE"
                                                ? "text-danger"
                                                : log.action === "UPDATE"
                                                ? "text-warning"
                                                : "text-success"
                                        }
                                    >
                                        {log.action}
                                    </span>
                                </td>
                                <td>{log.targetType}</td>
                                <td style={{ fontSize: 12 }}>
                                    {log.targetId}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* pagination */}
            <div className="d-flex justify-content-center mt-3">
                <button
                    className="btn btn-outline-secondary btn-sm me-2"
                    disabled={page === 1}
                    onClick={() => setPage(p => p - 1)}
                >
                    Prev
                </button>

                <span className="align-self-center">
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
        </div>
    );
}

export default AuditLog;
