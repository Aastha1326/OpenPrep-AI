const { generateMultimodalContent } = require('./geminiService');

/**
 * Multi-Modal Visual Diagram Question Generator & Point-in-Polygon Hotspot Validator
 */

/**
 * Ray-casting algorithm to determine if point (x, y) is inside polygon coordinates
 * coordinates: Array of { x: number, y: number } in percentage space (0 to 100)
 */
const isPointInPolygon = (point, polygon) => {
  if (!polygon || polygon.length < 3) return false;
  let isInside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;

    const intersect =
      yi > point.y !== yj > point.y &&
      point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;

    if (intersect) isInside = !isInside;
  }

  return isInside;
};

/**
 * Circle distance check for circular hotspot targets
 */
const isPointInCircle = (point, center, radiusPercent = 10) => {
  if (!center || typeof center.x !== 'number' || typeof center.y !== 'number') return false;
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance <= radiusPercent;
};

/**
 * Verify candidate click coordinates against defined hotspot target
 */
const verifyDiagramHotspotAnswer = (hotspot, clickCoordinates) => {
  if (!clickCoordinates || typeof clickCoordinates.x !== 'number' || typeof clickCoordinates.y !== 'number') {
    return { isCorrect: false, error: 'Invalid click coordinates provided.' };
  }

  let isCorrect = false;

  if (hotspot.type === 'POLYGON' && Array.isArray(hotspot.polygon)) {
    isCorrect = isPointInPolygon(clickCoordinates, hotspot.polygon);
  } else if (hotspot.type === 'CIRCLE' || hotspot.center) {
    isCorrect = isPointInCircle(clickCoordinates, hotspot.center, hotspot.radiusPercent || 10);
  } else if (hotspot.bounds) {
    // Bounding Box { minX, maxX, minY, maxY }
    const { minX, maxX, minY, maxY } = hotspot.bounds;
    isCorrect =
      clickCoordinates.x >= minX &&
      clickCoordinates.x <= maxX &&
      clickCoordinates.y >= minY &&
      clickCoordinates.y <= maxY;
  }

  return {
    isCorrect,
    label: hotspot.label,
    clickCoordinates,
    expectedHotspot: hotspot,
  };
};

/**
 * Auto-generate diagram hotspots and identification questions using Gemini Multimodal Vision
 */
const generateDiagramHotspots = async (imageBuffer, mimeType = 'image/jpeg', topic = 'Biology Diagram') => {
  if (!imageBuffer) {
    // Return structured default mock hotspots if buffer is missing
    return generateFallbackHotspots(topic);
  }

  try {
    const prompt = `
      Analyze this ${topic} educational diagram.
      Detect up to 4 key anatomical structures, circuit components, or geographical features.
      For each structure:
      1. Provide label name (e.g. "Mitochondria", "Resistor R1").
      2. Provide approximate center coordinates in percentage space (x: 0-100, y: 0-100).
      3. Provide a question prompt for students (e.g. "Click on the organelle responsible for cellular energy (ATP) production.").
      Return strictly JSON in format:
      [
        {
          "label": "Mitochondria",
          "prompt": "Click on the Mitochondria in the diagram below.",
          "center": { "x": 45, "y": 60 },
          "radiusPercent": 12
        }
      ]
    `;

    const rawResponse = await generateMultimodalContent(prompt, imageBuffer, mimeType);
    const jsonMatch = rawResponse.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed.map((h, i) => ({
        id: `hotspot-${i + 1}`,
        type: 'CIRCLE',
        label: h.label,
        prompt: h.prompt,
        center: h.center || { x: 50, y: 50 },
        radiusPercent: h.radiusPercent || 10,
      }));
    }
  } catch (err) {
    console.warn('[diagramQuestionService] AI generation error, using fallback:', err.message);
  }

  return generateFallbackHotspots(topic);
};

const generateFallbackHotspots = (topic) => [
  {
    id: 'hotspot-1',
    type: 'CIRCLE',
    label: 'Mitochondria',
    prompt: `Click on the Mitochondria in the ${topic} diagram below.`,
    center: { x: 45, y: 55 },
    radiusPercent: 12,
  },
  {
    id: 'hotspot-2',
    type: 'CIRCLE',
    label: 'Cell Nucleus',
    prompt: `Click on the Cell Nucleus in the ${topic} diagram below.`,
    center: { x: 50, y: 30 },
    radiusPercent: 15,
  },
  {
    id: 'hotspot-3',
    type: 'POLYGON',
    label: 'Cell Membrane Outer Layer',
    prompt: `Click on the Cell Membrane in the ${topic} diagram below.`,
    polygon: [
      { x: 10, y: 10 },
      { x: 90, y: 10 },
      { x: 90, y: 90 },
      { x: 10, y: 90 },
    ],
  },
];

module.exports = {
  isPointInPolygon,
  isPointInCircle,
  verifyDiagramHotspotAnswer,
  generateDiagramHotspots,
};
