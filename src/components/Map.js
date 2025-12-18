import "./Map.css"
import "leaflet/dist/leaflet.css";
import MarkerIcon from "leaflet/dist/images/marker-icon.png";
import { useCallback, useEffect, useState } from "react";
import { MapContainer, Marker, TileLayer, ZoomControl } from "react-leaflet";
import L from "leaflet";
import { Link, useSearchParams } from "react-router-dom";

const icon = L.icon({iconUrl: MarkerIcon, iconSize: [25, 41], iconAnchor: [12, 41]});

function Map() {
  const [venues, setVenues] = useState([]);
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [currentVenueComments, setCurrentVenueComments] = useState(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [addingComment, setAddingComment] = useState(false);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    fetch("/api/locations")
      .then((response) => response.json())
      .then((data) => {
        setVenues(data);
        
        // Check if venueId is in the query parameters
        const venueId = searchParams.get('venueId');
        if (venueId) {
          // Find the index of the venue with this venueId
          const venueIndex = data.findIndex(v => v.venueId === venueId);
          if (venueIndex !== -1) {
            setSelectedVenue(venueIndex);
            setIsPanelOpen(true);
          }
        }
      }).catch((error) => {
        console.error("Error fetching locations:", error);
      });
  }, [searchParams]);

  const fetchCurrentVenueComments = useCallback(async () => {
    if (!venues[selectedVenue]) return;
    try {
      const res = await fetch("/api/locations/" + venues[selectedVenue]._id + "/comments");
      const data = await res.json();
      setCurrentVenueComments(data);
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  }, [selectedVenue, venues])

  useEffect(() => {
    if (selectedVenue === null) return;

    setCurrentVenueComments(null);
    fetchCurrentVenueComments();
  }, [fetchCurrentVenueComments, selectedVenue])

  return (
    <div className="w-100 h-100">
      {/* Backdrop */}
        <div
          onClick={() => setIsPanelOpen(false)}
          className="position-absolute top-0 start-0 end-0 bottom-0"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            zIndex: 1999,
            opacity: isPanelOpen ? 1 : 0,
            pointerEvents: isPanelOpen ? 'auto' : 'none',
            transition: 'opacity 0.3s',
          }}
        />

      {/* Side Panel */}
      <div
        className="position-absolute top-0 bottom-0 bg-white shadow overflow-y-auto p-3"
        style={{
          left: isPanelOpen ? 0 : 'calc(var(--side-panel-width) * -1)',
          width: 'var(--side-panel-width)',
          transition: 'left 0.3s ease-in-out',
          zIndex: 2000,
        }}
      >
        <div className="w-100 text-start mb-3">
          <Link
            onClick={() => setIsPanelOpen(false)}
            className="link-secondary link-opacity-100-hover link-underline-opacity-0"
            style={{
              cursor: 'pointer',
            }}
            to="/map"
          >
            <i class="bi bi-chevron-left"></i> Go Back
          </Link>
        </div>
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
                onSubmit={async (e) => {
                  e.preventDefault();
                  setAddingComment(true);
                  try {
                    const res = await fetch(`/api/locations/${venues[selectedVenue]._id}/comments`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ comment: commentText }),
                    });
                    const data = await res.json();
                    if (data.success) {
                        setCommentText("");
                        fetchCurrentVenueComments();
                    }
                  } catch (error) {
                    console.error("Error adding comment:", error);
                  }
                  setAddingComment(false);
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
