import "leaflet/dist/leaflet.css";
import MarkerIcon from "leaflet/dist/images/marker-icon.png";
import { useEffect, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import { Link } from "react-router-dom";

function Map() {
  const [venues, setVenues] = useState([]);
  const icon = L.icon({iconUrl: MarkerIcon, iconSize: [25, 41], iconAnchor: [12, 41]});

  useEffect(() => {
    fetch("/api/venues")
      .then((response) => response.json())
      .then((data) => {
        setVenues(data);
      });
  }, []);

  return (
    <div className="w-full flex-grow-1">
      <MapContainer
        center={[22.3193, 114.1694]} // Centered at Hong Kong
        zoom={12}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {venues.map((venue, index) => (
          <Marker
            key={index}
            position={{ lat: venue.latitude, lng: venue.longitude }}
            icon={icon}
          >
            <Popup>{venue.name}</Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

export default Map;
