
import React, { useEffect, useState, useContext } from 'react';
import ReactDOM from 'react-dom/client';
import { Routes, Route, Link, Navigate } from 'react-router-dom';

import Home from './components/Home';
import Event from './components/Event';
import Map from './components/Map';
import Favorite from './components/Favorite';
import Login from './components/Login';

import ChatWindow from './components/ChatWindow';
import Calendar from './components/CalendarView';
import AdminEvents from "./components/AdminEvents";
import AdminUsers from "./components/AdminUsers";
import { ThemeContext } from './ThemeContext';
import AuditLog from "./components/AuditLog";


import './App.css';



function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const { isDarkMode, toggleTheme } = useContext(ThemeContext);

    async function checkAuth() {
        try {
            const response = await fetch('/api/check-auth', {
                credentials: 'include'
            });

            if (response.ok) {
                const userData = await response.json();
                setUser(userData);
            } else {
                setUser(null);
            }
        } catch (error) {
            console.error('Failed checking authentication:', error);
            setUser(null);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        checkAuth();
    }, []);

    if (loading) {
        return <div>Loading...</div>
    }

    // Page rendering
    return (
        <div className="App">
            {/* Top Navbar - Desktop Only */}
            <nav className="navbar navbar-expand-lg navbar-light bg-light sticky-top d-none d-lg-block">
                <div className="container-fluid">
                    <div className="d-flex align-items-center">
                        <img
                            className="me-2"
                            src={`/icon-${isDarkMode? "dark" : "light"}.png`}
                            alt='webpage logo'
                            style={{
                                maxWidth: "40px",
                                height: "auto"
                            }}
                        />
                        <span className="navbar-brand mb-0">Events</span>
                    </div>

                    <ul className="navbar-nav me-auto">
                        <li className="nav-item">
                            <Link className="nav-link" to='/'>Home</Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link" to='/event'>Events</Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link" to='/map'>Map</Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link" to='/calendar'>Events Calender</Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link" to='/favorite'>Favorites</Link>
                        </li>

                        {/* Admin links for desktop */}
                        {user && user.role === "admin" && (
                            <>
                                <li className="nav-item">
                                    <Link className="nav-link" to='/admin/events'>Manage Events</Link>
                                </li>
                                <li className="nav-item">
                                    <Link className="nav-link" to='/admin/users'>Manage Users</Link>
                                </li>
                                <li className="nav-item">
                                    <Link className="nav-link" to='/admin/auditlogs'>Audit Logs</Link>
                                </li>
                            </>
                        )}
                    </ul>

                    {/* User info and Logout - Desktop */}
                    <div className="d-flex align-items-center">
                        <ThemeToggleButton />
                        {!user ? (
                            <Link className="nav-link" to='/login'>Log In</Link>
                        ) : (
                            <>
                                <span className="nav-link mx-2">
                                    <i className="bi bi-person me-1"></i>
                                    {user.username}
                                </span>
                                <button
                                    className="nav-link btn btn-link text-decoration-none"
                                    onClick={async () => {
                                        await fetch('/api/logout', {
                                            method: 'POST',
                                            credentials: 'include'
                                        });
                                        setUser(null);
                                        checkAuth();
                                    }}
                                >
                                    Log out
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            {/* Simple Top Bar for Mobile */}
            <div className="d-lg-none sticky-top bg-light border-bottom py-2 px-3">
                <div className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center">
                        <img
                            className="me-2"
                            src={`/icon-${isDarkMode? "dark" : "light"}.png`}
                            alt='webpage logo'
                            style={{
                                maxWidth: "35px",
                                height: "auto"
                            }}
                        />
                        <span className="fw-bold">Event Manager</span>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                        <ThemeToggleButton />
                        {user && (
                            <span className="text-muted small">
                                Hi, {user.username.split(' ')[0]}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content - Adjusted padding for mobile */}
            <div className="main-content w-100 flex-grow-1 position-relative overflow-auto">
                {/* Chat Window (always displayed after login) */}
                {user && <ChatWindow user={user} />}

                <Routes>
                    <Route path='/' element={
                        user ? <Home /> : <Navigate to="/login" replace />
                    } />
                    <Route path='/event' element={
                        user ? <Event /> : <Navigate to="/login" replace />
                    } />
                    <Route path='/map' element={
                        user ? <Map /> : <Navigate to="/login" replace />
                    } />
                    <Route path='/favorite' element={
                        user ? <Favorite /> : <Navigate to="/login" replace />
                    } />
                    <Route path='/login' element={
                        user ? <Navigate to="/" replace /> : <Login setUser={setUser} />
                    } />
                    <Route path='/calendar' element={
                        user ? <Calendar /> : <Navigate to="/login" replace />
                    } />
                    <Route path="/admin/events" element={
                        user && user.role === "admin" ? <AdminEvents user={user} /> : <Navigate to="/" replace />
                    } />
                    <Route path="/admin/users" element={
                        user && user.role === "admin" ? <AdminUsers user={user} /> : <Navigate to="/" replace />
                    } />
                    <Route path="/admin/auditlogs" element={
                        user && user.role === "admin" ? <AuditLog user={user} /> : <Navigate to="/" replace />
                    } />
                    <Route path='*' element={
                        <Navigate to={user ? "/" : "/login"} replace />
                    } />`   `
                </Routes>
            </div>

            {/* Mobile Bottom Navigation */}
            {user ? (
                <div className="d-lg-none border-top mobile-bottom-nav" style={{ zIndex: 1030, backgroundColor: 'var(--bs-body-bg, #fff)', color: 'var(--bs-body-color, #000)' }}>
                    <div className="container">
                        <div className="row text-center py-2">

                            <div className="col">
                                <Link className="text-decoration-none d-flex flex-column align-items-center" style={{ color: 'inherit' }} to="/">
                                    <i className="bi bi-house fs-5"></i>
                                    <small className="mt-1" style={{ fontSize: "0.75rem" }}>Home</small>
                                </Link>
                            </div>

                            <div className="col">
                                <Link className="text-decoration-none d-flex flex-column align-items-center" style={{ color: 'inherit' }} to='/event'>
                                    <i className="bi bi-calendar-event fs-5"></i>
                                    <small className="mt-1" style={{ fontSize: "0.75rem" }}>Events</small>
                                </Link>
                            </div>

                            <div className="col">
                                <Link className="text-decoration-none d-flex flex-column align-items-center" style={{ color: 'inherit' }} to='/map'>
                                    <i className="bi bi-map fs-5"></i>
                                    <small className="mt-1" style={{ fontSize: '0.75rem' }}>Map</small>
                                </Link>
                            </div>

                            <div className="col">
                                <Link className="text-decoration-none text-dark d-flex flex-column align-items-center" to="/calendar">
                                    <i className="bi bi-calendar3 fs-5"></i>
                                    <small className="mt-1" style={{ fontSize: "0.75rem" }}>Calendar</small>
                                </Link>
                            </div>

                            <div className="col">
                                <Link className="text-decoration-none text-dark d-flex flex-column align-items-center" style={{ color: 'inherit' }} to='/favorite'>
                                    <i className="bi bi-heart fs-5"></i>
                                    <small className="mt-1" style={{ fontSize: "0.75rem" }}>Favorites</small>
                                </Link>
                            </div>

                            <div className="col">
                                <button
                                    className="text-decoration-none d-flex flex-column align-items-center border-0 bg-transparent w-100"
                                    style={{ color: 'inherit' }}
                                    onClick={async () => {
                                        await fetch("/api/logout", {
                                            method: "POST",
                                            credentials: "include"
                                        });
                                        setUser(null);
                                        checkAuth();
                                    }}
                                >
                                    <i className="bi bi-box-arrow-right fs-5"></i>
                                    <small className="mt-1" style={{ fontSize: "0.75rem" }}>Logout</small>
                                </button>
                            </div>

                        </div>
                    </div>
                </div>
            ) : null}

            {/* Extra Menu for Admin - Additional Bottom Menu */}
            {user && user.role === "admin" && (
                <div
                    className="d-lg-none border-top mobile-bottom-nav admin-bottom-nav"
                    style={{
                        zIndex: 1025,
                        backgroundColor: 'var(--bs-body-bg, #f8f9fa)',
                        color: 'var(--bs-body-color, #000)'
                    }}
                >
                    <div className="container">
                        <div className="row text-center py-2">

                            <div className="col">
                                <Link className="text-decoration-none text-primary d-flex flex-column align-items-center" to='/admin/events'>
                                    <i className="bi bi-tools fs-5"></i>
                                    <small className="mt-1" style={{ fontSize: "0.7rem" }}>Events</small>
                                </Link>
                            </div>

                            <div className="col">
                                <Link className="text-decoration-none d-flex flex-column align-items-center" style={{ color: 'var(--bs-body-color, #000)' }} to='/admin/users'>
                                    <i className="bi bi-people fs-5"></i>
                                    <small className="mt-1" style={{ fontSize: "0.7rem" }}>Users</small>
                                </Link>
                            </div>

                            <div className="col">
                                <Link className="text-decoration-none text-dark d-flex flex-column align-items-center" to='/location'>
                                    <i className="bi bi-geo-alt fs-5"></i>
                                    <small className="mt-1" style={{ fontSize: '0.7rem' }}>Locations</small>
                                </Link>
                            </div>

                            <div className="col">
                                <Link className="text-decoration-none text-primary d-flex flex-column align-items-center" to="/admin/auditlogs">
                                    <i className="bi bi-clipboard-data fs-5"></i>
                                    <small className="mt-1" style={{ fontSize: "0.7rem" }}>Logs</small>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ================== THEME TOGGLE BUTTON ================== */
function ThemeToggleButton() {
    const { isDarkMode, toggleTheme } = useContext(ThemeContext);

    return (
        <button
            className="btn btn-link text-decoration-none nav-link"
            onClick={toggleTheme}
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            style={{ fontSize: '1.2rem' }}
        >
            {isDarkMode ? '☀️' : '🌙'}
        </button>
    );
}

export default App;
