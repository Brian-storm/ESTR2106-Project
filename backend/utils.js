/**
 * Check if a point is inside or on a polygon using the ray casting algorithm
 * @param {Array<[number, number]>} polygon - Array of [x, y] coordinates representing polygon vertices
 * @param {[number, number]} point - Point coordinates [x, y]
 * @returns {boolean} True if point is inside or on the polygon
 */
function isPointInPolygon(polygon, point) {
  const [x, y] = point;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];

    // Check if point is on the edge
    if (isPointOnSegment(point, polygon[i], polygon[j])) {
      return true;
    }

    // Ray casting algorithm
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }

  return inside;
}

/**
 * Check if a point lies on a line segment
 * @param {[number, number]} point - Point coordinates
 * @param {[number, number]} p1 - Line segment start
 * @param {[number, number]} p2 - Line segment end
 * @returns {boolean}
 */
function isPointOnSegment(point, p1, p2) {
  const [x, y] = point;
  const [x1, y1] = p1;
  const [x2, y2] = p2;

  const crossproduct = (y - y1) * (x2 - x1) - (x - x1) * (y2 - y1);
  if (Math.abs(crossproduct) > 1e-10) return false;

  return (
    x >= Math.min(x1, x2) &&
    x <= Math.max(x1, x2) &&
    y >= Math.min(y1, y2) &&
    y <= Math.max(y1, y2)
  );
}

module.exports = { isPointInPolygon, isPointOnSegment };