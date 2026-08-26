const {
  isPointInPolygon,
  isPointInCircle,
  verifyDiagramHotspotAnswer,
  generateDiagramHotspots,
} = require('../../services/diagramQuestionService');

describe('Multi-Modal Visual Diagram Hotspot Question Unit Tests', () => {
  describe('Point-in-Polygon & Geometry Algorithms', () => {
    it('accurately identifies point inside polygon', () => {
      const squarePolygon = [
        { x: 0, y: 0 },
        { x: 50, y: 0 },
        { x: 50, y: 50 },
        { x: 0, y: 50 },
      ];
      expect(isPointInPolygon({ x: 25, y: 25 }, squarePolygon)).toBe(true);
      expect(isPointInPolygon({ x: 75, y: 75 }, squarePolygon)).toBe(false);
    });

    it('accurately identifies point inside circle tolerance radius', () => {
      const center = { x: 50, y: 50 };
      expect(isPointInCircle({ x: 52, y: 48 }, center, 10)).toBe(true);
      expect(isPointInCircle({ x: 80, y: 80 }, center, 10)).toBe(false);
    });
  });

  describe('verifyDiagramHotspotAnswer', () => {
    it('verifies correct click within circle hotspot', () => {
      const hotspot = {
        type: 'CIRCLE',
        label: 'Mitochondria',
        center: { x: 45, y: 55 },
        radiusPercent: 10,
      };

      const result = verifyDiagramHotspotAnswer(hotspot, { x: 46, y: 54 });
      expect(result.isCorrect).toBe(true);
      expect(result.label).toBe('Mitochondria');
    });

    it('returns false for click outside circle hotspot', () => {
      const hotspot = {
        type: 'CIRCLE',
        label: 'Nucleus',
        center: { x: 20, y: 20 },
        radiusPercent: 5,
      };

      const result = verifyDiagramHotspotAnswer(hotspot, { x: 80, y: 80 });
      expect(result.isCorrect).toBe(false);
    });
  });

  describe('generateDiagramHotspots', () => {
    it('generates structured diagram hotspot definitions', async () => {
      const hotspots = await generateDiagramHotspots(null, 'image/jpeg', 'Biology Cell');
      expect(Array.isArray(hotspots)).toBe(true);
      expect(hotspots.length).toBeGreaterThan(0);
      expect(hotspots[0]).toHaveProperty('label');
      expect(hotspots[0]).toHaveProperty('prompt');
    });
  });
});
