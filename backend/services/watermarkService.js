/**
 * Overlays semi-transparent, rotatable copyright signatures directly across document targets.
 */
function generateSecureWatermark(doc, options = {}) {
  const {
    studentName = 'Guest User',
    institution = 'OpenPrep AI'
  } = options;

  const timestamp = new Date().toISOString().split('T')[0];
  const watermarkText = `DIGITAL RIGHTS SECURITY PROTOCOL - COMPILED FOR: ${studentName.toUpperCase()} (${institution.toUpperCase()}) - DATE: ${timestamp}`;

  doc.save();
  
  // Set composition opacity state to clear transparency bands without text washouts
  doc.fillOpacity(0.06);
  doc.fillColor('#000000');
  doc.fontSize(7);
  doc.font('Helvetica-Bold');

  // Multi-line diagonal translation tracking path configurations
  const pageHeight = doc.page.height;
  const pageWidth = doc.page.width;

  for (let offset = -200; offset < pageHeight; offset += 180) {
    doc.save();
    doc.translate(pageWidth / 2, offset);
    doc.rotate(-35, { origin: [0, 0] });
    doc.text(watermarkText, -pageWidth, 0, { width: pageWidth * 2, align: 'center' });
    doc.restore();
  }

  doc.restore();
}

module.exports = { generateSecureWatermark };
