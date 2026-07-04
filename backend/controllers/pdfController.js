const PDFDocument = require('pdfkit');

/**
 * Generate a professional proposal/quote PDF and stream it back
 */
exports.generateProposalPDF = (req, res) => {
  try {
    const { clientName, company, email, tenant, revenue, discount, notes } = req.body;
    
    const doc = new PDFDocument({ margin: 50 });
    
    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="proposal-${Date.now()}.pdf"`);
    
    doc.pipe(res);
    
    // Brand Header
    doc.fontSize(20).font('Helvetica-Bold').text('Abdelghanem Enterprise', { align: 'center' });
    doc.fontSize(12).font('Helvetica').text('CRM Master Contract Invoice', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(8).fillColor('#888888').text(`UUID: PROP-2026-${Date.now().toString(36).toUpperCase()}`, { align: 'center' });
    doc.moveDown(1);
    
    // Divider line
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#cccccc').stroke();
    doc.moveDown(1);
    
    // Issued by / To sections
    const sectionTop = doc.y;
    doc.fontSize(10).fillColor('#333333');
    
    // Left column - Issued by
    doc.font('Helvetica-Bold').text('ISSUED BY:', 50, sectionTop);
    doc.font('Helvetica').fillColor('#555555').text('Abdelghanem Enterprise Automation Ltd', 50, doc.y + 5);
    doc.text(`Tenant Division: ${(tenant || 'N/A').toUpperCase()}`, 50, doc.y + 5);
    
    // Right column - To
    const rightX = 310;
    doc.font('Helvetica-Bold').fillColor('#333333').text('PROPOSAL TO CLIENT:', rightX, sectionTop);
    doc.font('Helvetica').fillColor('#555555').text(clientName || 'Client Name', rightX, doc.y + 5);
    if (company) doc.text(company, rightX, doc.y + 5);
    if (email) doc.text(email, rightX, doc.y + 5);
    
    doc.moveDown(2);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#cccccc').stroke();
    doc.moveDown(1);
    
    // Scope of Work
    doc.font('Helvetica-Bold').fillColor('#333333').fontSize(10).text('ESTIMATED SCOPE OF WORK:');
    doc.font('Helvetica').fillColor('#555555').fontSize(9).text(notes || 'Standard installation and service agreement.', 50, doc.y + 5, { width: 495, align: 'left' });
    doc.moveDown(2);
    
    // Financial details
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#cccccc').stroke();
    doc.moveDown(1);
    
    const grossAmount = parseFloat(revenue) || 0;
    const discountPercent = parseFloat(discount) || 0;
    const netAmount = grossAmount * (1 - discountPercent / 100);
    
    doc.fontSize(10);
    doc.font('Helvetica').fillColor('#555555').text('Gross Job Estimate:', 50, doc.y, { continued: true });
    doc.font('Helvetica-Bold').fillColor('#333333').text(` £${grossAmount.toLocaleString()}`, { align: 'right' });
    
    doc.moveDown(0.3);
    doc.font('Helvetica').fillColor('#888888').text(`Contract Discount Rate:`, 50, doc.y, { continued: true });
    doc.font('Helvetica').fillColor('#888888').text(` -${discountPercent}%`, { align: 'right' });
    
    doc.moveDown(0.8);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#cccccc').stroke();
    doc.moveDown(0.3);
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#333333').text('NET TOTAL ESTIMATE:', 50, doc.y, { continued: true });
    doc.text(` £${netAmount.toFixed(2)}`, { align: 'right' });
    
    doc.moveDown(2);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#cccccc').stroke();
    doc.moveDown(1);
    
    // Footer
    doc.fontSize(8).fillColor('#aaaaaa').font('Helvetica').text('System generated quote. Valid for 30 days from issue date.', 50, doc.y, { align: 'center', width: 495 });
    doc.text('Abdelghanem Enterprise Automation - Premium CRM Suite', 50, doc.y + 10, { align: 'center', width: 495 });
    
    // Finalize the PDF
    doc.end();
    
  } catch (err) {
    console.error('PDF generation error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to generate PDF: ' + err.message });
    }
  }
};