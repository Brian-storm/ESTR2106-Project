
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { useParams, useLocation } from 'react-router-dom';

import Home from './components/Home';
import Location from './components/Location';
import Event from './components/Event';
import Map from './components/Map';
import Favorite from './components/Favorite';
import Login from './components/Login';

import logo from './logo.svg';
import './App.css';


function App() {
  // functional component need no render()!
  return (
    <BrowserRouter>

      <nav className="navbar navbar-expand-lg navbar-light bg-light sticky-top">
        <div className="container-fluid">
          <a className="navbar-brand" href=''><img src='' alt='webpage logo' /></a>

          <ul className="navbar-nav">
            <li className="nav-item"><Link className="nav-link" to='/'>Home</Link></li>
            <li className="nav-item"><Link className="nav-link" to='/location'>Location list</Link></li>
            <li className="nav-item"><Link className="nav-link" to='/event'>Event list</Link></li>
            <li className="nav-item"><Link className="nav-link" to='/map'>Map</Link></li>
            <li className="nav-item"><Link className="nav-link" to='/favorite'>Favorite list</Link></li>
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
        <Route path='/login' element={<Login />} />
      </Routes>
    </BrowserRouter>
  );
}

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
