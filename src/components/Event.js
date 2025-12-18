import { useEffect, useState } from "react";
import { calculateDistance, formatDistance } from "../utils";
import { useNavigate, useSearchParams } from "react-router-dom";

const TableColumnHeader = ({ label, sortKey, handleSort, sortConfig }) => {
  return (
    <button
      className="btn btn-sm sort-btn-header"
      onClick={() => handleSort(sortKey)}
    >
      <span>{label}</span>
      <span className="sort-arrow">
        {sortConfig.key === sortKey
          ? sortConfig.direction === "asc"
            ? "↑"
            : "↓"
          : "⇅"}
      </span>
    </button>
  );
};

const Event = () => {
  const [events, setEvents] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [maxDistance, setMaxDistance] = useState(50);
  const [sortConfig, setSortConfig] = useState({
    key: "event",
    direction: "asc",
  });
  const [userLocation, setUserLocation] = useState(null);
  const [dataFetchTime, setDataFetchTime] = useState(null);
  const [sortedFilteredEvents, setSortedFilteredEvents] = useState([]);

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const handleClearSearch = () => setSearchQuery("");
  const handleClearDistrict = () => setSelectedDistrict("");
  const handleClearDistance = () => setMaxDistance(50);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        () => {
          setUserLocation({ latitude: 22.3193, longitude: 114.1694 });
        }
      );
    } else {
      setUserLocation({ latitude: 22.3193, longitude: 114.1694 });
    }
  }, []);

  useEffect(() => {
    let venueIds = [];
    if (searchParams.get("venueIds")) {
      venueIds = searchParams.get("venueIds").split(",");
    }

    const url =
      venueIds.length > 0
        ? "/api/events?venueIds=" + venueIds.join(",")
        : "/api/events";

    fetch(url)
      .then((response) => response.json())
      .then((data) => {
        const fetchTime = new Date();
        setDataFetchTime(fetchTime);
        setEvents(data);
      })
      .catch((error) => {
        console.error("Error fetching events:", error);
      });
  }, [searchParams]);

  useEffect(() => {
    let filtered = [...events];
    if (searchQuery) {
      filtered = filtered.filter((event) =>
        event.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (selectedDistrict) {
      filtered = filtered.filter((event) =>
        event.venue.district.includes(selectedDistrict)
      );
    }
    if (userLocation) {
      filtered = filtered.filter((event) => {
        const distance = calculateDistance(userLocation, event.venue);
        return distance !== null && distance <= maxDistance;
      });
    }

    const sorted = filtered.sort((a, b) => {
      let aValue, bValue;
      switch (sortConfig.key) {
        case "event":
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case "venue":
          aValue = a.venue.name.toLowerCase();
          bValue = b.venue.name.toLowerCase();
          break;
        case "date":
          aValue = a.date;
          bValue = b.date;
          break;
        case "distance":
          aValue = calculateDistance(userLocation, a.venue) || Infinity;
          bValue = calculateDistance(userLocation, b.venue) || Infinity;
          break;
        case "presenter":
          aValue = a.presenter.toLowerCase();
          bValue = b.presenter.toLowerCase();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) {
        return sortConfig.direction === "asc" ? -1 : 1;
      } else if (aValue > bValue) {
        return sortConfig.direction === "asc" ? 1 : -1;
      } else {
        return 0;
      }
    });

    setSortedFilteredEvents(sorted);
  }, [
    events,
    maxDistance,
    searchQuery,
    selectedDistrict,
    sortConfig.direction,
    sortConfig.key,
    userLocation,
  ]);

  return (
    <div className="container-lg mt-4">
      {searchParams.get("venueIds") !== null && events.length > 0 && (
        <div className="mb-4 d-flex align-items-center">
          <button
            onClick={() => navigate(-1)}
            className="link-secondary link-opacity-100-hover link-underline-opacity-0"
            style={{
              all: "unset",
              cursor: "pointer",
            }}
          >
            <i className="bi bi-chevron-left"></i> Go Back
          </button>
          <h2 className="flex-grow-1 text-center">
            Events for {events[0].venue?.name}
          </h2>
        </div>
      )}
      <div className="mb-4">
        <div className="row">
          <div className="col-4">
            <div className="card border h-100">
              <div className="card-body p-3 d-flex flex-column justify-content-center">
                <h6 className="card-title mb-2">
                  <i className="bi bi-search me-2"></i>
                  Search Event
                </h6>
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Type event name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button
                      className="btn btn-outline-secondary"
                      type="button"
                      onClick={handleClearSearch}
                    >
                      <i className="bi bi-x"></i>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 区域筛选 */}
          <div className="col-4">
            <div className="card border h-100">
              <div className="card-body p-3 d-flex flex-column justify-content-center">
                <h6 className="card-title mb-2">
                  <i className="bi bi-geo me-2"></i>
                  District
                </h6>
                <select
                  className="form-select"
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                >
                  <option value="">All Districts</option>
                  <option value="Central and Western">Central & Western</option>
                  <option value="Wan Chai">Wan Chai</option>
                  <option value="Eastern">Eastern</option>
                  <option value="Southern">Southern</option>
                  <option value="Yau Tsim Mong">Yau Tsim Mong</option>
                  <option value="Sham Shui Po">Sham Shui Po</option>
                  <option value="Kowloon City">Kowloon City</option>
                  <option value="Wong Tai Sin">Wong Tai Sin</option>
                  <option value="Kwun Tong">Kwun Tong</option>
                  <option value="Kwai Tsing">Kwai Tsing</option>
                  <option value="Tsuen Wan">Tsuen Wan</option>
                  <option value="Tuen Mun">Tuen Mun</option>
                  <option value="Yuen Long">Yuen Long</option>
                  <option value="North">North</option>
                  <option value="Tai Po">Tai Po</option>
                  <option value="Sha Tin">Sha Tin</option>
                  <option value="Sai Kung">Sai Kung</option>
                  <option value="Islands">Islands</option>
                </select>
              </div>
            </div>
          </div>

          <div className="col-4">
            <div className="card border h-100">
              <div className="card-body p-3 d-flex flex-column justify-content-center">
                <div className="text-center mb-2">
                  <div>
                    Distance{" "}
                    {maxDistance < 1
                      ? `${Math.round(maxDistance * 1000)}(m)`
                      : maxDistance < 10
                      ? `${maxDistance.toFixed(1)}(km)`
                      : `${Math.round(maxDistance)}(km)`}
                  </div>
                </div>

                {/* 滑块 - 最大100km */}
                <div className="d-flex align-items-center">
                  <div style={{ flex: 1 }}>
                    <input
                      type="range"
                      className="form-range"
                      min="0.1"
                      max="100"
                      step="0.1"
                      value={maxDistance < 0.1 ? 0.1 : maxDistance}
                      onChange={(e) => {
                        let value = parseFloat(e.target.value);
                        if (value < 0.1) value = 0.1;
                        if (value > 100) value = 100;
                        setMaxDistance(value);
                      }}
                      style={{
                        width: "100%",
                        height: "10px",
                        cursor: "pointer",
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="table-responsive">
        <table className="table table-striped table-hover m-0">
          <thead className="table-header-clean">
            <tr>
              <th scope="col" className="text-center-cell">
                Event ID
              </th>
              <th scope="col" className="text-center-cell">
                <TableColumnHeader
                  label="Event Title"
                  sortKey="event"
                  handleSort={handleSort}
                  sortConfig={sortConfig}
                />
              </th>
              <th scope="col" className="text-center-cell">
                <TableColumnHeader
                  label="Venue"
                  sortKey="venue"
                  handleSort={handleSort}
                  sortConfig={sortConfig}
                />
              </th>
              <th scope="col" className="text-center-cell">
                <TableColumnHeader
                  label="Date"
                  sortKey="date"
                  handleSort={handleSort}
                  sortConfig={sortConfig}
                />
              </th>
              <th scope="col" className="text-center-cell">
                <TableColumnHeader
                  label="Distance"
                  sortKey="distance"
                  handleSort={handleSort}
                  sortConfig={sortConfig}
                />
              </th>
              <th scope="col" className="text-center-cell">
                <TableColumnHeader
                  label="Presenter"
                  sortKey="presenter"
                  handleSort={handleSort}
                  sortConfig={sortConfig}
                />
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedFilteredEvents.map((event, index) => {
              const distance = calculateDistance(userLocation, event.venue);
              return (
                <tr key={event.eventId || index}>
                  <td>
                    <div>{event.eventId}</div>
                  </td>
                  <td>
                    <div className="fw-bold">{event.title}</div>
                  </td>
                  <td>
                    <span>{event.venue.name}</span>
                  </td>
                  <td>
                    {event.date.split(/[;\n]/).map((line) => (
                      <div key={line}>{line}</div>
                    ))}
                  </td>
                  <td>
                    <span>{formatDistance(distance)}</span>
                  </td>
                  <td>
                    <span>{event.presenter}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* 没有搜索结果时显示 */}
        {sortedFilteredEvents.length === 0 && (
          <div className="no-result text-center py-4 text-muted">
            <i className="bi bi-search display-6"></i>
            <h5 className="mt-3">No venues found</h5>
            <div className="mt-3">
              {(searchQuery || selectedDistrict || maxDistance < 100) && (
                <button
                  className="btn btn-outline-primary"
                  onClick={() => {
                    handleClearSearch();
                    handleClearDistrict();
                    handleClearDistance();
                  }}
                >
                  <i className="bi bi-arrow-clockwise me-2"></i>
                  Reset
                </button>
              )}
            </div>
          </div>
        )}
      </div>
      <div className="d-flex justify-content-center align-items-center text-center text-muted small p-4">
        Last updated time :{" "}
        {dataFetchTime
          ? dataFetchTime.toLocaleString([], {
              weekday: "short",
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "Loading..."}
      </div>
    </div>
  );
};

export default Event;
