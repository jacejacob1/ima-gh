import PDFDocument from 'pdfkit';

export function buildInvoiceBuffer(booking) {
  const doc = new PDFDocument({ margin: 44 });
  const chunks = [];

  return new Promise((resolve, reject) => {
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(21).text('IMA Guesthouse Invoice', { align: 'left' });
    doc.moveDown(0.4);
    doc.fontSize(10).fillColor('#4b5b58').text('Indian Medical Association Guesthouse');
    doc.fillColor('#000');

    doc.moveDown();
    doc.fontSize(12).text(`Invoice No: ${booking.invoiceNumber}`);
    doc.text(`Booking ID: ${booking.id}`);
    doc.text(`Issued On: ${new Date(booking.createdAt).toLocaleString()}`);

    doc.moveDown();
    doc.fontSize(13).text('Guest Details', { underline: true });
    doc.fontSize(11).text(`Name: ${booking.guestName}`);
    doc.text(`Phone: ${booking.guestPhone || 'N/A'}`);
    doc.text(`Email: ${booking.guestEmail || 'N/A'}`);
    doc.text(`Branch: ${booking.branch}`);

    doc.moveDown();
    doc.fontSize(13).text('Stay / Event Details', { underline: true });
    doc.fontSize(11).text(`Space: ${booking.selectedSpaceLabel}`);
    doc.text(`Checkin: ${new Date(booking.checkinDateTime).toLocaleString()}`);
    doc.text(`Checkout: ${new Date(booking.checkoutDateTime).toLocaleString()}`);
    doc.text(`Meals: ${(booking.meals || []).join(', ')}`);
    doc.text(`Food Preference: ${booking.foodPreference}`);
    doc.text(`Cab Service: ${booking.cabService}`);

    doc.moveDown();
    doc.fontSize(13).text('Payment', { underline: true });
    doc.fontSize(11).text(`Method: ${booking.paymentMethod}`);
    doc.text(`Status: ${booking.paymentStatus}`);
    doc.text(`Amount Paid: INR ${booking.totalAmount}`);

    doc.moveDown(1.2);
    doc.fontSize(10).fillColor('#4b5b58').text('For support: secretary@imatnsb-hqgh.com');

    doc.end();
  });
}
