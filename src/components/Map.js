import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";

function Map() {
  const [venues, setVenues] = useState([]);

  useEffect(() => {
    fetch("/api/venues")
      .then((response) => response.json())
      .then((data) => {
        setVenues(data);
      });
  }, []);

  return (
    <div className="container d-flex flex-column align-items-center">
      <h2>Map</h2>
      <MapContainer
        center={[22.3193, 114.1694]} // Centered at Hong Kong
        zoom={12}
        scrollWheelZoom={true}
        style={{ height: "600px", width: "75%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {venues.map((venue, index) => (
          <Marker
            key={index}
            position={{ lat: venue.latitude, lng: venue.longitude }}
          >
            <Popup>{venue.name}</Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

export default Map;
