
import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { Routes, Route, Link, Navigate } from 'react-router-dom';

import Home from './components/Home';
import Location from './components/Location';
import Event from './components/Event';
import Map from './components/Map';
import Favorite from './components/Favorite';
import Login from './components/Login';
import View from './components/View';

import ChatWindow from './components/ChatWindow';
import AdminEvents from "./components/AdminEvents";
import AdminUsers from "./components/AdminUsers";


import './App.css';



function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

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
            <nav className="navbar navbar-expand-lg navbar-light bg-light sticky-top">
                <div className="container-fluid">
                    <img className="mr-5" src='/icon.png' alt='webpage logo' style={{ maxWidth: "45px" }} />

                    <ul className="navbar-nav" >
                        <li className="nav-item ms-2"><Link className="nav-link" to='/'>Home</Link></li>
                        <li className="nav-item ms-2"><Link className="nav-link" to='/location'>Location list</Link></li>
                        <li className="nav-item ms-2"><Link className="nav-link" to='/event'>Event list</Link></li>
                        <li className="nav-item ms-2"><Link className="nav-link" to='/map'>Map</Link></li>
                        <li className="nav-item ms-2"><Link className="nav-link" to='/favorite'>Favorite list</Link></li>
                        {!user && (
                            <li className="nav-item">
                                <Link className="nav-link" to='/login'>Log In</Link>
                            </li>
                        )}
                    </ul>

                    {user && (
                        <ul className="navbar-nav ms-auto">
                            <li className="nav-item">
                                <span className="nav-link">
                                    <i className="bi bi-person"></i> {user.username}
                                </span>
                            </li>
                            <li className="nav-item">
                                <button className="nav-link btn btn-link" onClick={async () => {
                                    await fetch('/api/logout', {
                                        method: 'POST',
                                        credentials: 'include'
                                    });
                                    setUser(null);
                                    checkAuth();
                                }}>
                                    Log out
                                </button>
                            </li>
                        </ul>
                    )}
                </div>
            </nav>

            {/* Chat Window (always visible) */}
            <ChatWindow user={user}/>

            <Routes>
                <Route path='/' element={
                    user ? <Home /> : <Navigate to="/login" replace />
                } />
                <Route path='/location' element={
                    user ? <Location /> : <Navigate to="/login" replace />
                } />
                <Route path='/event' element={
                    user ? <Event /> : <Navigate to="/login" replace />
                } />
                <Route path='/map' element={
                    user ? <Map /> : <Navigate to="/login" replace />
                } />
                <Route path='/view/:venueId' element={
                    user ? <View /> : <Navigate to="/login" replace />
                } />
                <Route path='/favorite' element={
                    user ? <Favorite /> : <Navigate to="/login" replace />
                } />
                <Route path='/login' element={
                    user ? <Navigate to="/" replace /> : <Login setUser={setUser} />
                } />
                <Route path="/admin/events" element={
                    user && user.role === "admin"? <AdminEvents user={user} />: <Navigate to="/" replace />
                }/>
                <Route path="/admin/users" element={
                    user && user.role === "admin"? <AdminUsers user={user} />: <Navigate to="/" replace />
                }/>
                <Route path='*' element={
                    <Navigate to={user ? "/" : "/login"} replace />
                } />
            </Routes>
        </div>
    );
}

export default App;
