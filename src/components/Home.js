import React, { useEffect, useState } from 'react';

function Home() {
    const [response, setResponse] = useState([]);
    const [selectedVenues, setSelectedVenues] = useState([]);

    useEffect(() => {
        console.log("running...at Home");
        fetch("/api/fetchEvents")
            .then(response => response.json())
            .then(data => {
                console.log("fetched");
                console.log(data);
                setResponse(data);
                findRandomVenues(data);
            })
            .catch(error => {
                console.error('Error:', error);
                setResponse([]);
            });
    }, []);

    const findRandomVenues = (data) => {
        if (!data || !Array.isArray(data)) return;

        const shuffled = [...data].sort(() => Math.random() - 0.5);  // Shuffle and take first 10
        const randomVenues = shuffled.slice(0, 10);
        setSelectedVenues(randomVenues.map(elem => elem.venueNameE));
    }

    return (
        <div className="container mt-4">
            <h2>Home Page</h2>
            <pre>Randomised 10 (only their English name listed): {JSON.stringify(selectedVenues, null, 2)}</pre>
            <pre>Original {JSON.stringify(response, null, 2)}</pre>
        </div>
    );
}

export default Home;