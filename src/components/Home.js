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

    // useEffect(() => {
    //     if (selectedVenues.length > 0) {
    //         updateRandomVenues();
    //     }
    // }, [selectedVenues]);

    // const updateRandomVenues = async () => {
    //     const resp = await fetch("/api/updateLocation", {
    //         method: "POST",
    //         headers: {
    //             "Content-Type": "application/json"
    //         },
    //         body: JSON.stringify({ selectedVenues: selectedVenues.map(venue => ({
    //                 venueName: venue.name,
    //                 latitude: venue.latitude,
    //                 longitude: venue.longitude
    //             })
    //         )})
    //     });
        
    //     if (resp.ok) {
    //         console.log("Updated selectedVenues in db");
    //     } else {
    //         console.log("Failed to update selectedVenues in db");
    //     }
    // }

    const findRandomVenues = (data) => {
        if (!data || !Array.isArray(data)) return;

        const shuffled = [...data].sort(() => Math.random() - 0.5);  // Shuffle and take first 10
        const randomVenues = shuffled.slice(0, 10);
        setSelectedVenues(randomVenues);
    }

    return (
        <div className="container mt-4">
            <h2>Home Page</h2>
            <pre>Randomised 10 : {JSON.stringify(selectedVenues.map(elem => elem.name), null, 2)}</pre>
            {/* <pre>Original {JSON.stringify(response, null, 2)}</pre> */}
        </div>
    );
}

export default Home;

