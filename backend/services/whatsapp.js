const axios = require('axios');
const PDFService = require('./pdf');

class WhatsAppService {
  constructor() {
    // Configuration for WhatsApp API
    // You can use services like Twilio, WhatsApp Business API, or other providers
    this.apiUrl = process.env.WHATSAPP_API_URL || 'https://api.whatsapp.com/send';
    this.apiToken = process.env.WHATSAPP_API_TOKEN || '';
    this.businessPhone = process.env.WHATSAPP_BUSINESS_PHONE || '';
    this.pdfService = new PDFService();
  }

  /**
   * Format invoice message for WhatsApp
   * @param {Object} sale - Sale object with items
   * @returns {string} Formatted message
   */
  formatInvoiceMessage(sale) {
    const { invoice, customer_name, date, items, subtotal, tax_amount, discount_amount, total_amount, paid_amount, status } = sale;
    
    // Convert string values to numbers to ensure toFixed() works
    const numSubtotal = parseFloat(subtotal) || 0;
    const numTaxAmount = parseFloat(tax_amount) || 0;
    const numDiscountAmount = parseFloat(discount_amount) || 0;
    const numTotalAmount = parseFloat(total_amount) || 0;
    const numPaidAmount = parseFloat(paid_amount) || 0;
    
    let message = `🧾 *INVOICE ${invoice}*\n\n`;
    message += `📅 Date: ${new Date(date).toLocaleDateString()}\n`;
    
    if (customer_name) {
      message += `👤 Customer: ${customer_name}\n`;
    }
    
    message += `\n📦 *ITEMS:*\n`;
    message += `${'─'.repeat(30)}\n`;
    
    items.forEach(item => {
      const unitPrice = parseFloat(item.unit_price) || 0;
      const lineTotal = parseFloat(item.line_total) || 0;
      message += `• ${item.item_name}\n`;
      message += `  Qty: ${item.quantity} × RS ${unitPrice.toFixed(2)} = RS ${lineTotal.toFixed(2)}\n`;
    });
    
    message += `${'─'.repeat(30)}\n`;
    message += `💰 Subtotal: RS ${numSubtotal.toFixed(2)}\n`;
    
    if (numTaxAmount > 0) {
      message += `🏛️ Tax: RS ${numTaxAmount.toFixed(2)}\n`;
    }
    
    if (numDiscountAmount > 0) {
      message += `🎯 Discount: -RS ${numDiscountAmount.toFixed(2)}\n`;
    }
    
    message += `💳 *Total: RS ${numTotalAmount.toFixed(2)}*\n`;
    message += `💵 Paid: RS ${numPaidAmount.toFixed(2)}\n`;
    
    const balance = numTotalAmount - numPaidAmount;
    if (balance > 0) {
      message += `⚠️ Balance Due: RS ${balance.toFixed(2)}\n`;
    } else if (balance < 0) {
      message += `💰 Change: RS ${Math.abs(balance).toFixed(2)}\n`;
    } else {
      message += `✅ Fully Paid\n`;
    }
    
    message += `\n📱 Status: ${status.toUpperCase()}\n`;
    message += `\nThank you for your business! 🙏`;
    
    return message;
  }

  /**
   * Send invoice via WhatsApp using simple URL method
   * @param {string} phoneNumber - Customer phone number
   * @param {Object} sale - Sale object
   * @param {boolean} includePDF - Whether to generate PDF invoice
   * @returns {Object} Result object
   */
  async sendInvoiceSimple(phoneNumber, sale, includePDF = false) {
    try {
      if (!phoneNumber) {
        throw new Error('Phone number is required');
      }

      const message = this.formatInvoiceMessage(sale);
      let pdfPath = null;
      
      // Generate PDF if requested
      if (includePDF) {
        try {
          pdfPath = await this.pdfService.generateInvoicePDF(sale);
        } catch (pdfError) {
          console.error('Error generating PDF:', pdfError);
          // Continue without PDF if generation fails
        }
      }
      
      // Clean phone number (remove non-digits)
      let cleanPhone = phoneNumber.replace(/\D/g, '');
      
      // Add Sri Lankan country code (+94) if not present
      if (!cleanPhone.startsWith('94') && cleanPhone.length === 9) {
        cleanPhone = '94' + cleanPhone;
      }
      
      // Create WhatsApp URL
      const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
      
      return {
        success: true,
        message: 'WhatsApp URL generated successfully',
        whatsappUrl,
        formattedMessage: message,
        pdfPath: pdfPath
      };
    } catch (error) {
      console.error('Error generating WhatsApp message:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send invoice via WhatsApp API (for future implementation)
   * @param {string} phoneNumber - Customer phone number
   * @param {Object} sale - Sale object
   * @returns {Object} Result object
   */
  async sendInvoiceAPI(phoneNumber, sale) {
    try {
      if (!this.apiToken) {
        throw new Error('WhatsApp API token not configured');
      }

      const message = this.formatInvoiceMessage(sale);
      
      // This is a placeholder for actual API implementation
      // You would replace this with actual API calls to your WhatsApp provider
      const response = await axios.post(this.apiUrl, {
        to: phoneNumber,
        message: message,
        type: 'text'
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        }
      });

      return {
        success: true,
        message: 'Invoice sent successfully via WhatsApp API',
        response: response.data
      };
    } catch (error) {
      console.error('Error sending WhatsApp message via API:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Main method to send invoice
   * @param {string} phoneNumber - Customer phone number
   * @param {Object} sale - Sale object
   * @param {string} method - 'simple' or 'api'
   * @param {boolean} includePDF - Whether to generate PDF invoice
   * @returns {Object} Result object
   */
  async sendInvoice(phoneNumber, sale, method = 'simple', includePDF = false) {
    if (method === 'api') {
      return await this.sendInvoiceAPI(phoneNumber, sale);
    } else {
      return await this.sendInvoiceSimple(phoneNumber, sale, includePDF);
    }
  }
}

module.exports = WhatsAppService;