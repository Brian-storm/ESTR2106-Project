import "leaflet/dist/leaflet.css";
import MarkerIcon from "leaflet/dist/images/marker-icon.png";
import { useEffect, useState } from "react";
import { MapContainer, Marker, TileLayer } from "react-leaflet";
import L from "leaflet";

function Map() {
  const [venues, setVenues] = useState([]);
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const icon = L.icon({iconUrl: MarkerIcon, iconSize: [25, 41], iconAnchor: [12, 41]});

  useEffect(() => {
    fetch("/api/venues")
      .then((response) => response.json())
      .then((data) => {
        setVenues(data);
      });
  }, []);

  return (
    <div className="w-full flex-grow-1 position-relative">
      {/* Backdrop */}
        <div
          onClick={() => setIsPanelOpen(false)}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            zIndex: 999,
            opacity: isPanelOpen ? 1 : 0,
            pointerEvents: isPanelOpen ? 'auto' : 'none',
            transition: 'opacity 0.3s ease-out',
          }}
        />

      {/* Side Panel */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: isPanelOpen ? 0 : '-450px',
          bottom: 0,
          width: '450px',
          backgroundColor: 'white',
          boxShadow: '-2px 0 8px rgba(0, 0, 0, 0.15)',
          zIndex: 2000,
          overflowY: 'auto',
          padding: '1.5rem',
          transition: 'left 0.3s ease-out',
        }}
      >
        <button
          onClick={() => setIsPanelOpen(false)}
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            border: 'none',
            background: 'transparent',
            fontSize: '24px',
            cursor: 'pointer',
            color: '#666',
          }}
        >
          ×
        </button>
        {
          selectedVenue !== null && <>
            <h3 style={{ marginTop: 0, marginBottom: '15px' }}>{venues[selectedVenue].name}</h3>
            {venues[selectedVenue].address && (
              <p><strong>Address:</strong> {venues[selectedVenue].address}</p>
            )}
            {venues[selectedVenue].district && (
              <p><strong>District:</strong> {venues[selectedVenue].district}</p>
            )}
            {venues[selectedVenue].latitude && venues[selectedVenue].longitude && (
              <p><strong>Coordinates:</strong> {venues[selectedVenue].latitude.toFixed(4)}, {venues[selectedVenue].longitude.toFixed(4)}</p>
            )}
            {venues[selectedVenue].description && (
              <div>
                <strong>Description:</strong>
                <p>{venues[selectedVenue].description}</p>
              </div>
            )}
          </>
        }
      </div>

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
            eventHandlers={{
              click: () => {
                setSelectedVenue(index);
                setIsPanelOpen(true);
              },
            }}
          />
        ))}
      </MapContainer>
    </div>
  );
}

export default Map;
