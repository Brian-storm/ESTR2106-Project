import "leaflet/dist/leaflet.css";
import MarkerIcon from "leaflet/dist/images/marker-icon.png";
import { useCallback, useEffect, useState } from "react";
import { MapContainer, Marker, TileLayer, ZoomControl } from "react-leaflet";
import L from "leaflet";

const icon = L.icon({iconUrl: MarkerIcon, iconSize: [25, 41], iconAnchor: [12, 41]});

function Map() {
  const [venues, setVenues] = useState([]);
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [currentVenueComments, setCurrentVenueComments] = useState(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [addingComment, setAddingComment] = useState(false);

  useEffect(() => {
    fetch("/api/locations")
      .then((response) => response.json())
      .then((data) => {
        setVenues(data);
      });
  }, []);

  const fetchCurrentVenueComments = useCallback(() => {
    fetch("/api/locations/" + venues[selectedVenue]._id + "/comments")
      .then((response) => response.json())
      .then((data) => {
        setCurrentVenueComments(data);
      });
  }, [selectedVenue, venues])

  useEffect(() => {
    if (selectedVenue === null) return;

    setCurrentVenueComments(null);
    fetchCurrentVenueComments();
  }, [fetchCurrentVenueComments, selectedVenue, venues])

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
            <div className="mt-0 mb-2 fs-5 fw-bold">{venues[selectedVenue].name}</div>
            {venues[selectedVenue].address && (
              <p><strong>Address:</strong> {venues[selectedVenue].address}</p>
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
            <div className="d-flex flex-column mt-3 align-items-start w-100">
              <strong>Comments</strong>
              {
                currentVenueComments &&
                currentVenueComments.length > 0 &&
                currentVenueComments.map((comment, index) => (
                  <div key={index} className="text-start mb-2 p-2 border-bottom w-100">
                    <div>{comment.user.username} at {new Date(comment.date).toLocaleString()} wrote:</div>
                    <div>
                      {comment.comment}
                    </div>
                  </div>
                ))
              }
              <form
                className="d-flex flex-column w-100 mt-1"
                onSubmit={(e) => {
                  e.preventDefault();
                  setAddingComment(true);
                  fetch(`/api/locations/${venues[selectedVenue]._id}/comments`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ comment: commentText }),
                  }).then(response => response.json())
                    .then(data => {
                      if (data.success) {
                        setCommentText("");
                        fetchCurrentVenueComments();
                      }
                      setAddingComment(false);
                    });
                }}
              >
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  required
                  className="form-control mb-2"
                />
                <button type="submit" className="btn btn-primary" disabled={addingComment}>Submit Comment</button>
              </form>
            </div>
          </>
        }
      </div>

      <MapContainer
        center={[22.3193, 114.1694]} // Centered at Hong Kong
        zoom={12}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
      >
        <ZoomControl position="topright" />
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
