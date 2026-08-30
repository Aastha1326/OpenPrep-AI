import React from 'react';

/**
 * Recognizes a rough set of stroke points as a clean geometric shape.
 * Supported: circles, ellipses, rectangles, triangles, coordinate axes, and straight lines.
 */
export const recognizeAndSnapShape = (points) => {
  if (points.length < 5) return null;

  // Calculate bounding box
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  let sumX = 0, sumY = 0;

  points.forEach((p) => {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
    sumX += p.x;
    sumY += p.y;
  });

  const width = maxX - minX;
  const height = maxY - minY;
  const cx = sumX / points.length;
  const cy = sumY / points.length;

  // Check if it's coordinate axes (cross-like: long lines intersecting)
  // Check if stroke contains a vertical-ish and horizontal-ish segment
  // Usually users draw horizontal axis then vertical axis in one stroke, or we detect if the width and height are large
  // and points are clustered near the horizontal and vertical lines.
  const isAxes = checkCoordinateAxes(points, minX, maxX, minY, maxY, cx, cy);
  if (isAxes) {
    return {
      type: 'axes',
      cx,
      cy,
      width,
      height,
      minX,
      maxX,
      minY,
      maxY,
    };
  }

  // Check circle/ellipse circularity
  const radiusX = width / 2;
  const radiusY = height / 2;
  let circleScore = 0;
  points.forEach((p) => {
    const dx = (p.x - cx) / (radiusX || 1);
    const dy = (p.y - cy) / (radiusY || 1);
    const dist = Math.sqrt(dx * dx + dy * dy);
    circleScore += Math.abs(dist - 1);
  });
  circleScore /= points.length;

  if (circleScore < 0.18) {
    // If width and height are close, snap to circle; else ellipse
    if (Math.abs(width - height) < Math.max(width, height) * 0.2) {
      const r = (width + height) / 4;
      return { type: 'circle', cx, cy, r };
    } else {
      return { type: 'ellipse', cx, cy, rx: radiusX, ry: radiusY };
    }
  }

  // Check triangle (look for 3 dominant peaks/corners)
  const vertices = findTriangleVertices(points, minX, maxX, minY, maxY);
  if (vertices) {
    return { type: 'triangle', vertices };
  }

  // Check if it's a simple straight line
  const lineDiff = checkLineDeviation(points, points[0], points[points.length - 1]);
  if (lineDiff < 8) {
    return { type: 'line', x1: points[0].x, y1: points[0].y, x2: points[points.length - 1].x, y2: points[points.length - 1].y };
  }

  // Default to rectangle if points are close to the bounds
  let rectScore = 0;
  points.forEach((p) => {
    const distToLeft = Math.abs(p.x - minX);
    const distToRight = Math.abs(p.x - maxX);
    const distToTop = Math.abs(p.y - minY);
    const distToBottom = Math.abs(p.y - maxY);
    const minDist = Math.min(distToLeft, distToRight, distToTop, distToBottom);
    rectScore += minDist;
  });
  rectScore /= points.length;

  if (rectScore < Math.max(width, height) * 0.25) {
    return { type: 'rectangle', x: minX, y: minY, w: width, h: height };
  }

  return null;
};

// Helper: deviation from a straight line
const checkLineDeviation = (points, start, end) => {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return Infinity;

  let totalDeviation = 0;
  points.forEach((p) => {
    const dev = Math.abs(dy * p.x - dx * p.y + end.x * start.y - end.y * start.x) / len;
    totalDeviation += dev;
  });
  return totalDeviation / points.length;
};

// Helper: check if points shape is coordinate axes (cross of X and Y axes)
const checkCoordinateAxes = (points, minX, maxX, minY, maxY, cx, cy) => {
  if (points.length < 15) return false;
  // Look for coordinate axes: points going from left-to-right, then bottom-to-top (or vice-versa)
  // Or check if a large fraction of points lie on cross lines
  let verticalCount = 0;
  let horizontalCount = 0;
  const threshold = 15; // pixels within centerlines
  const w = maxX - minX;
  const h = maxY - minY;

  if (w < 40 || h < 40) return false;

  points.forEach((p) => {
    if (Math.abs(p.x - cx) < threshold) verticalCount++;
    if (Math.abs(p.y - cy) < threshold) horizontalCount++;
  });

  const totalHits = verticalCount + horizontalCount;
  return totalHits / points.length > 0.55;
};

// Helper: locate 3 corner points for a triangle
const findTriangleVertices = (points, minX, maxX, minY, maxY) => {
  // Simple heuristic: find top-most point, left-most point, right-most point
  // and see if the rest of points align with the edges
  let topPoint = points[0];
  let leftPoint = points[0];
  let rightPoint = points[0];

  points.forEach((p) => {
    if (p.y < topPoint.y) topPoint = p;
    if (p.x < leftPoint.x) leftPoint = p;
    if (p.x > rightPoint.x) rightPoint = p;
  });

  // Verify that the points are reasonably distant
  const d1 = Math.sqrt(Math.pow(topPoint.x - leftPoint.x, 2) + Math.pow(topPoint.y - leftPoint.y, 2));
  const d2 = Math.sqrt(Math.pow(topPoint.x - rightPoint.x, 2) + Math.pow(topPoint.y - rightPoint.y, 2));
  const d3 = Math.sqrt(Math.pow(leftPoint.x - rightPoint.x, 2) + Math.pow(leftPoint.y - rightPoint.y, 2));

  if (d1 < 20 || d2 < 20 || d3 < 20) return null;

  return [
    { x: topPoint.x, y: topPoint.y },
    { x: leftPoint.x, y: leftPoint.y },
    { x: rightPoint.x, y: rightPoint.y },
  ];
};

const ShapeMagicTool = ({ isMagicPen, setIsMagicPen, onTriggerOCR, isOcrLoading }) => {
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => setIsMagicPen(!isMagicPen)}
        className={`p-2 rounded-full transition-colors flex items-center justify-center ${
          isMagicPen
            ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 font-bold border border-purple-300 dark:border-purple-800'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
        }`}
        title="Magic Pen: Automatically snaps rough sketches into vector shapes"
      >
        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
          />
        </svg>
        <span className="text-xs hidden md:inline">Magic Pen</span>
      </button>

      <button
        onClick={onTriggerOCR}
        disabled={isOcrLoading}
        className={`p-2 rounded-full transition-colors flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50`}
        title="OCR Recognizer: Converts sketched formulas directly into editable KaTeX formulas"
      >
        {isOcrLoading ? (
          <svg className="animate-spin h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        ) : (
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        )}
        <span className="text-xs hidden md:inline">Math OCR</span>
      </button>
    </div>
  );
};

export default ShapeMagicTool;
