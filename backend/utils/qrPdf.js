const PDFDocument = require('pdfkit');

// Convert data URL base64 to Buffer
function dataUrlToBuffer(dataUrl) {
  const matches = dataUrl.match(/^data:(.+);base64,(.*)$/);
  if (!matches) return null;
  return Buffer.from(matches[2], 'base64');
}

/**
 * Generate a single-page PDF containing the branded QR card image
 * @param {Object} opts
 * @param {string} opts.restaurantName
 * @param {string} opts.qrPngDataUrl - data:image/png;base64,...
 * @param {Object} [opts.meta]
 * @returns {PDFDocument} readable stream (PDFKit document)
 */
function createQrPdf({ restaurantName = 'Restaurant', qrPngDataUrl, meta = {} }) {
  const doc = new PDFDocument({ size: 'A5', margin: 24 });

  // Meta
  doc.info.Title = `${restaurantName} QR`;
  doc.info.Author = 'Qruzine';

  // Heading
  doc.fontSize(18).font('Helvetica-Bold').text(restaurantName, { align: 'center' });
  doc.moveDown(0.5);

  // QR image
  const buf = dataUrlToBuffer(qrPngDataUrl);
  if (buf) {
    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const maxHeight = 350;
    const x = doc.page.margins.left;
    const y = doc.y;
    doc.image(buf, x, y, { fit: [pageWidth, maxHeight], align: 'center' });
    doc.moveDown(0.5);
  } else {
    doc.fillColor('red').text('Failed to embed QR image', { align: 'center' });
    doc.fillColor('black');
  }

  // Footer branding
  doc.moveDown(1);
  doc.font('Helvetica-Bold').fontSize(14).fillColor('#D4AF37').text('qruzine', { align: 'center' });
  doc.fillColor('black');

  return doc;
}

module.exports = { createQrPdf };
