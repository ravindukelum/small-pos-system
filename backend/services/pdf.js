const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class PDFService {
  constructor() {
    // Ensure uploads directory exists
    this.uploadsDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  /**
   * Generate PDF invoice
   * @param {Object} sale - Sale object with items
   * @returns {Promise<string>} Path to generated PDF file
   */
  async generateInvoicePDF(sale) {
    return new Promise((resolve, reject) => {
      try {
        const { invoice, customer_name, date, items, subtotal, tax_amount, discount_amount, total_amount, paid_amount, status } = sale;
        
        // Convert string values to numbers
        const numSubtotal = parseFloat(subtotal) || 0;
        const numTaxAmount = parseFloat(tax_amount) || 0;
        const numDiscountAmount = parseFloat(discount_amount) || 0;
        const numTotalAmount = parseFloat(total_amount) || 0;
        const numPaidAmount = parseFloat(paid_amount) || 0;
        
        // Create PDF document
        const doc = new PDFDocument({ margin: 50 });
        
        // Generate filename
        const filename = `invoice_${invoice}_${Date.now()}.pdf`;
        const filepath = path.join(this.uploadsDir, filename);
        
        // Pipe PDF to file
        doc.pipe(fs.createWriteStream(filepath));
        
        // Header
        doc.fontSize(20).text('INVOICE', 50, 50, { align: 'center' });
        doc.fontSize(16).text(`Invoice #${invoice}`, 50, 80, { align: 'center' });
        
        // Company info (you can customize this)
        doc.fontSize(12)
           .text('Your Business Name', 50, 120)
           .text('Your Address Line 1', 50, 135)
           .text('Your Address Line 2', 50, 150)
           .text('Phone: +94 XX XXX XXXX', 50, 165);
        
        // Invoice details
        doc.text(`Date: ${new Date(date).toLocaleDateString()}`, 400, 120, { align: 'right' });
        if (customer_name) {
          doc.text(`Customer: ${customer_name}`, 400, 135, { align: 'right' });
        }
        doc.text(`Status: ${status.toUpperCase()}`, 400, 150, { align: 'right' });
        
        // Line separator
        doc.moveTo(50, 200).lineTo(550, 200).stroke();
        
        // Items header
        let yPosition = 220;
        doc.fontSize(12).font('Helvetica-Bold');
        doc.text('Item', 50, yPosition);
        doc.text('Qty', 300, yPosition);
        doc.text('Unit Price', 350, yPosition);
        doc.text('Total', 450, yPosition);
        
        // Items separator
        yPosition += 15;
        doc.moveTo(50, yPosition).lineTo(550, yPosition).stroke();
        
        // Items
        yPosition += 15;
        doc.font('Helvetica');
        items.forEach(item => {
          const unitPrice = parseFloat(item.unit_price) || 0;
          const lineTotal = parseFloat(item.line_total) || 0;
          
          doc.text(item.item_name, 50, yPosition, { width: 240 });
          doc.text(item.quantity.toString(), 300, yPosition);
          doc.text(`RS ${unitPrice.toFixed(2)}`, 350, yPosition);
          doc.text(`RS ${lineTotal.toFixed(2)}`, 450, yPosition);
          yPosition += 20;
        });
        
        // Totals separator
        yPosition += 10;
        doc.moveTo(300, yPosition).lineTo(550, yPosition).stroke();
        
        // Totals
        yPosition += 15;
        doc.text(`Subtotal: RS ${numSubtotal.toFixed(2)}`, 350, yPosition);
        yPosition += 15;
        
        if (numTaxAmount > 0) {
          doc.text(`Tax: RS ${numTaxAmount.toFixed(2)}`, 350, yPosition);
          yPosition += 15;
        }
        
        if (numDiscountAmount > 0) {
          doc.text(`Discount: -RS ${numDiscountAmount.toFixed(2)}`, 350, yPosition);
          yPosition += 15;
        }
        
        // Total
        doc.font('Helvetica-Bold');
        doc.text(`Total: RS ${numTotalAmount.toFixed(2)}`, 350, yPosition);
        yPosition += 15;
        
        doc.font('Helvetica');
        doc.text(`Paid: RS ${numPaidAmount.toFixed(2)}`, 350, yPosition);
        yPosition += 15;
        
        const balance = numTotalAmount - numPaidAmount;
        if (balance > 0) {
          doc.text(`Balance Due: RS ${balance.toFixed(2)}`, 350, yPosition);
        } else if (balance < 0) {
          doc.text(`Change: RS ${Math.abs(balance).toFixed(2)}`, 350, yPosition);
        } else {
          doc.text('Fully Paid', 350, yPosition);
        }
        
        // Footer
        yPosition += 40;
        doc.fontSize(10)
           .text('Thank you for your business!', 50, yPosition, { align: 'center' });
        
        // Finalize PDF
        doc.end();
        
        // Wait for PDF to be written
        doc.on('end', () => {
          resolve(filepath);
        });
        
        doc.on('error', (error) => {
          reject(error);
        });
        
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Delete PDF file
   * @param {string} filepath - Path to PDF file
   */
  deletePDF(filepath) {
    try {
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
    } catch (error) {
      console.error('Error deleting PDF:', error);
    }
  }
}

module.exports = PDFService;