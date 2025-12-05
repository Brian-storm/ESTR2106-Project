
import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';

import Home from './components/Home';
import Location from './components/Location';
import Event from './components/Event';
import Map from './components/Map';
import Favorite from './components/Favorite';
import Login from './components/Login';

import './App.css';



function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loginTrigger, setLoginTrigger] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        // For already logged in before
        if (loginTrigger === 0) {
            const token = localStorage.getItem('token');
            const storedUser = localStorage.getItem('user')

            if (token && storedUser) {
                try {
                    const userData = JSON.parse(storedUser);
                    setUser(userData);
                } catch (error) {
                    console.error('Failed to parse user data:', error);
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                }
            }

            setLoading(false);
        }

        // if (user) {
        //     ...
        // }


    }, [loginTrigger]);

    useEffect(() => {
        if (!user) {
            setLoginTrigger(trigger => trigger + 1)
        }

    }, [user])

    if (loading) {
        return <div>Loading...</div>;  //navigate('/login');
    }



    // Page rendering
    return (
        <>
            <nav className="navbar navbar-expand-lg navbar-light bg-light sticky-top">
                <div className="container-fluid">
                    <img src='/public/icon.png' alt='webpage logo' style={{ maxWidth: "50px" }} />


                    <ul className="navbar-nav">
                        <li className="nav-item"><Link className="nav-link" to='/'>Home</Link></li>
                        <li className="nav-item"><Link className="nav-link" to='/location'>Location list</Link></li>
                        <li className="nav-item"><Link className="nav-link" to='/event'>Event list</Link></li>
                        <li className="nav-item"><Link className="nav-link" to='/map'>Map</Link></li>
                        <li className="nav-item"><Link className="nav-link" to='/favorite'>Favorite list</Link></li>
                        <li className="nav-item"><Link className="nav-link" to='/login'>Log In</Link></li>
                    </ul>

                    <ul className="navbar-nav ms-auto">
                        <li className="nav-item">
                            <Link className="nav-link" to="/login">
                                <i className="bi bi-person"></i>
                            </Link>
                        </li>
                    </ul>

                </div>
            </nav>

            <Routes>
                <Route path='/' element={<Home />} />
                <Route path='/location' element={<Location />} />
                <Route path='/event' element={<Event />} />
                <Route path='/map' element={<Map />} />
                <Route path='/favorite' element={<Favorite />} />
                <Route path='/login' element={user ? <Navigate to="/" replace /> : <Login onLogin={setUser} />} />
            </Routes>
        </>
    );
}

// Original code given by "npm create-react-app"
// function App() {
//   return (
//     <div className="App">
//       <header className="App-header">
//         <img src={logo} className="App-logo" alt="logo" />
//         <p>
//           Edit <code>src/App.js</code> and save to reload.
//         </p>
//         <a
//           className="App-link"
//           href="https://reactjs.org"
//           target="_blank"
//           rel="noopener noreferrer"
//         >
//           Learn React
//         </a>
//       </header>
//     </div>
//   );
// }

export default App;
