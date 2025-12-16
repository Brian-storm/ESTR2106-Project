import React, { useEffect, useState, useCallback, useRef } from "react";
import { Navigate } from "react-router-dom";

const PAGE_SIZE = 10;

function AdminUsers({ user }) {
    /* ================== STATE ================== */
    const [page, setPage] = useState(1);
    const [users, setUsers] = useState([]);
    const [totalPages, setTotalPages] = useState(1);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [editingId, setEditingId] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);

    const pageCache = useRef({});

    const emptyForm = {
        username: "",
        password: "",
        role: "user"
    };

    const [form, setForm] = useState(emptyForm);

    /* ================== FETCH PAGE ================== */
    const fetchPage = useCallback(async (pageNumber, preload = false) => {
        if (pageCache.current[pageNumber]) {
            if (!preload) {
                setUsers(pageCache.current[pageNumber]);
                setLoading(false);
            }
            return;
        }

        try {
            if (!preload) {
                setLoading(true);
                setError(null);
            }

            const res = await fetch("/api/admin/users", {
                credentials: "include"
            });
            if (!res.ok) throw new Error("Fetch failed");

            const allUsers = await res.json();
            const total = Math.max(1, Math.ceil(allUsers.length / PAGE_SIZE));
            setTotalPages(total);

            const sliced = allUsers.slice(
                (pageNumber - 1) * PAGE_SIZE,
                pageNumber * PAGE_SIZE
            );

            pageCache.current[pageNumber] = sliced;

            if (!preload) setUsers(sliced);
        } catch (err) {
            console.error(err);
            setError("Failed to load users");
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

    /* ================== CRUD ================== */
    const startEdit = (u) => {
        setEditingId(u._id);
        setForm({
            username: u.username,
            role: u.role
        });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setForm(emptyForm);
    };

    const saveEdit = async () => {
        try {
            const res = await fetch(`/api/admin/users/${editingId}`, {
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
            alert("Failed to update user");
        }
    };

    const saveNewUser = async () => {
        try {
            const res = await fetch("/api/admin/users", {
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
            alert("Failed to create user");
        }
    };

    const deleteUser = async (id) => {
        if (!window.confirm("Delete this user?")) return;

        try {
            const res = await fetch(`/api/admin/users/${id}`, {
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
        return <div className="container-fluid mt-4">Loading users…</div>;
    }

    if (error) {
        return <div className="container-fluid mt-4 text-danger">{error}</div>;
    }

    /* ================== RENDER ================== */
    return (
        <div className="container-fluid mt-4">
            <div className="d-flex justify-content-between mb-2">
                <h2>Admin – User Management</h2>
                <button
                    className="btn btn-success"
                    onClick={() => {
                        setForm(emptyForm);
                        setShowAddModal(true);
                    }}
                >
                    + Add User
                </button>
            </div>

            <div className="table-responsive">
                <table className="table table-bordered table-sm">
                    <thead className="table-light">
                        <tr>
                            <th>Username</th>
                            <th>Role</th>
                            <th style={{ width: 160 }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(u => (
                            <tr key={u._id}>
                                <td>
                                    {editingId === u._id ? (
                                        <input
                                            className="form-control form-control-sm"
                                            value={form.username}
                                            onChange={e =>
                                                setForm({ ...form, username: e.target.value })
                                            }
                                        />
                                    ) : u.username}
                                </td>
                                <td>
                                    {editingId === u._id ? (
                                        <select
                                            className="form-select form-select-sm"
                                            value={form.role}
                                            onChange={e =>
                                                setForm({ ...form, role: e.target.value })
                                            }
                                        >
                                            <option value="user">User</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    ) : u.role}
                                </td>
                                <td>
                                    {editingId === u._id ? (
                                        <>
                                            <button className="btn btn-success btn-sm me-1" onClick={saveEdit}>
                                                Save
                                            </button>
                                            <button className="btn btn-secondary btn-sm" onClick={cancelEdit}>
                                                Cancel
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button className="btn btn-primary btn-sm me-1" onClick={() => startEdit(u)}>
                                                Edit
                                            </button>
                                            <button className="btn btn-danger btn-sm" onClick={() => deleteUser(u._id)}>
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

            {/* ADD USER MODAL */}
            {showAddModal && (
                <div style={{
                    position: "fixed",
                    inset: 0,
                    backgroundColor: "rgba(0,0,0,0.5)",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center"
                }}>
                    <div style={{ background: "#fff", padding: 20, maxWidth: 400, width: "100%" }}>
                        <h5>Add New User</h5>

                        <input
                            className="form-control mb-2"
                            placeholder="Username"
                            value={form.username}
                            onChange={e => setForm({ ...form, username: e.target.value })}
                        />

                        <input
                            className="form-control mb-2"
                            placeholder="Password"
                            type="password"
                            value={form.password}
                            onChange={e => setForm({ ...form, password: e.target.value })}
                        />

                        <select
                            className="form-select mb-3"
                            value={form.role}
                            onChange={e => setForm({ ...form, role: e.target.value })}
                        >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                        </select>

                        <div className="text-end">
                            <button className="btn btn-secondary me-2" onClick={() => setShowAddModal(false)}>
                                Cancel
                            </button>
                            <button className="btn btn-success" onClick={saveNewUser}>
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminUsers;
