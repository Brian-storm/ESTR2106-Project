const calculateDistance = (userLocation, venue) => {
  if (!userLocation || !venue.latitude || !venue.longitude) {
    return null; // 返回 null 而不是 "N/A" 便于比较
  }

  const lat1 = userLocation.latitude;
  const lon1 = userLocation.longitude;
  const lat2 = venue.latitude;
  const lon2 = venue.longitude;

  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const formatDistance = (distance) => {
  if (distance === null || distance === undefined) return "N/A";

  if (distance < 1) {
    return `${Math.round(distance * 1000)} m`;
  } else if (distance < 10) {
    return `${distance.toFixed(1)} km`;
  } else {
    return `${Math.round(distance)} km`;
  }
};

export { calculateDistance, formatDistance };
