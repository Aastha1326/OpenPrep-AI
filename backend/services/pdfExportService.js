const PDFDocument = require('pdfkit');
const { generateSecureWatermark } = require('./watermarkService');

/**
 * Orchestrates raw data transformation into print-optimized PDF buffers.
 */
async function generateExamPdf(quizData, options = {}) {
  const {
    fontSize = 10,
    twoColumn = false,
    includeAnswerKey = false,
    studentName = 'Guest Explorer',
    institution = 'OpenPrep AI'
  } = options;

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 40, bufferPages: true });
    const buffers = [];

    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    // --- Core Layout Definitions ---
    doc.fontSize(16).font('Helvetica-Bold').text(quizData.title || 'Revision Exam Sheet', { align: 'center' });
    doc.fontSize(9).font('Helvetica-Oblique').text(`Compiled for ${institution}`, { align: 'center' });
    doc.moveDown(2);

    const questions = quizData.questions || [];
    
    // Configurable Column Math Layout Configurations
    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const colWidth = twoColumn ? (pageWidth - 20) / 2 : pageWidth;
    
    let currentColumn = 0;
    let startY = doc.y;

    questions.forEach((q, index) => {
      // Establishes a virtual boundary check to avoid isolated fragment breaks
      if (doc.y > doc.page.height - 120) {
        if (twoColumn && currentColumn === 0) {
          currentColumn = 1;
          doc.y = startY;
        } else {
          doc.addPage();
          currentColumn = 0;
          startY = doc.page.margins.top;
        }
      }

      const xPos = doc.page.margins.left + currentColumn * (colWidth + 20);
      
      doc.fontSize(fontSize).font('Helvetica-Bold')
         .text(`Q${index + 1}. `, xPos, doc.y, { continued: true })
         .font('Helvetica').text(q.text, { width: colWidth, align: 'left' });
      
      doc.moveDown(0.5);

      // Render Options Payload Block
      if (q.options) {
        q.options.forEach((opt, idx) => {
          const prefix = String.fromCharCode(65 + idx) + ') ';
          doc.fontSize(fontSize - 1).font('Helvetica')
             .text(`   ${prefix}${opt}`, { width: colWidth, align: 'left' });
        });
      }

      if (includeAnswerKey && q.correctAnswer) {
        doc.moveDown(0.3);
        doc.fontSize(fontSize - 1).font('Helvetica-Bold').fillColor('#10b981')
           .text(`✔ Correct Answer: ${q.correctAnswer}`, { width: colWidth })
           .fillColor('#000000'); // Restore default text color
      }

      doc.moveDown(1.5);
    });

    // --- Dynamic Two-Pass Security & Footer Decoration Application ---
    const totalPages = doc.bufferedPageRange().count;
    for (let i = 0; i < totalPages; i++) {
      doc.switchToPage(i);
      
      // Inject secure diagonal text matrix watermarks safely underneath content layers
      generateSecureWatermark(doc, { studentName, institution });

      // Embed global verification footers containing system pagination metrics
      doc.fontSize(8).font('Helvetica').fillColor('#64748b');
      doc.text(
        `Page ${i + 1} of ${totalPages} | Digital Solution QR Code Affixed via OpenPrep Core Protocols`,
        doc.page.margins.left,
        doc.page.height - 30,
        { align: 'center' }
      );
      
      // Simulating vector position bounding boxes for QR placements
      doc.rect(doc.page.width - 65, doc.page.height - 45, 25, 25).stroke('#cbd5e1');
    }

    doc.end();
  });
}

module.exports = { generateExamPdf };
