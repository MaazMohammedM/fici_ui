import type { Order, OrderItem } from '../types/order-common';
import type { AdminOrder } from '../types/order';
import { showAlert } from '../lib/utils/alertUtils';

export interface ShipmentInfo {
  shipping_partner: string;
  tracking_id: string;
  tracking_url?: string;
}

export const generateInvoiceHTML = (
  order: Order | AdminOrder,
  shippedItems: OrderItem[],
  shipmentInfo: ShipmentInfo
): string => {
  const isShippingAddress = (address: any): address is any => {
    return typeof address === 'object' && address !== null;
  };

  const calculateItemTotal = (item: OrderItem) => {
    return (parseFloat(String(item.price_at_purchase || '0')) * item.quantity);
  };

  const calculateShippedTotal = () => {
    return shippedItems.reduce((total, item) => total + calculateItemTotal(item), 0);
  };

  const formatAddress = (address: any) => {
    if (isShippingAddress(address)) {
      return `${address.name || 'N/A'}, ${address.address || 'N/A'}, ${address.city || 'N/A'}, ${address.district ? address.district + ', ' : ''}${address.state || 'N/A'} - ${address.pincode || 'N/A'}`;
    }
    return address;
  };

  const extractCustomerName = (order: Order | AdminOrder, address: any) => {
    // Try to get name from shipping address first
    if (isShippingAddress(address) && address.name) {
      return address.name;
    }
    
    // Fallback to guest email name extraction
    if (order.guest_email) {
      const emailName = order.guest_email.split('@')[0];
      return emailName.charAt(0).toUpperCase() + emailName.slice(1).toLowerCase();
    }
    
    return 'Guest Customer';
  };

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Shipping Invoice - Order #${order.order_id.slice(-8)}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.4;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
          }
          
          .invoice-header {
            text-align: center;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          
          .company-info {
            margin-bottom: 20px;
          }
          
          .company-name {
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
          }
          
          .company-tagline {
            font-size: 14px;
            color: #666;
            margin-top: 5px;
          }
          
          .invoice-title {
            font-size: 20px;
            font-weight: bold;
            margin: 20px 0;
            color: #333;
          }
          
          .section {
            margin-bottom: 25px;
          }
          
          .section-title {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 10px;
            color: #333;
            border-bottom: 1px solid #ddd;
            padding-bottom: 5px;
          }
          
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 20px;
          }
          
          .info-item {
            margin-bottom: 8px;
          }
          
          .info-label {
            font-weight: 600;
            color: #555;
            display: block;
            margin-bottom: 2px;
          }
          
          .info-value {
            color: #333;
          }
          
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          
          .items-table th,
          .items-table td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
          }
          
          .items-table th {
            background-color: #f8f9fa;
            font-weight: 600;
          }
          
          .items-table tr:nth-child(even) {
            background-color: #f8f9fa;
          }
          
          .item-name {
            font-weight: 500;
          }
          
          .quantity {
            text-align: center;
          }
          
          .price {
            text-align: right;
            font-weight: 500;
          }
          
          .total-section {
            text-align: right;
            margin-top: 20px;
          }
          
          .total-row {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 5px;
          }
          
          .total-label {
            font-weight: 600;
            margin-right: 20px;
            min-width: 120px;
            text-align: right;
          }
          
          .total-value {
            font-weight: bold;
            min-width: 100px;
            text-align: right;
          }
          
          .grand-total {
            border-top: 2px solid #333;
            padding-top: 10px;
            margin-top: 10px;
          }
          
          .grand-total .total-label {
            font-size: 18px;
          }
          
          .grand-total .total-value {
            font-size: 18px;
            color: #2563eb;
          }
          
          .shipping-info {
            background-color: #f0f9ff;
            border: 1px solid #0284c7;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 20px;
          }
          
          .shipping-info-title {
            font-weight: bold;
            color: #0284c7;
            margin-bottom: 10px;
          }
          
          .instructions {
            background-color: #fffbeb;
            border: 1px solid #f59e0b;
            border-radius: 8px;
            padding: 15px;
            margin-top: 20px;
          }
          
          .instructions-title {
            font-weight: bold;
            color: #d97706;
            margin-bottom: 10px;
          }
          
          .instructions-list {
            list-style-position: inside;
            margin-left: 10px;
          }
          
          .instructions-list li {
            margin-bottom: 5px;
          }
          
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            text-align: center;
            color: #666;
            font-size: 12px;
          }
          
          @media print {
            body {
              padding: 10px;
            }
            
            .info-grid {
              grid-template-columns: 1fr;
              gap: 10px;
            }
            
            .items-table {
              font-size: 12px;
            }
            
            .items-table th,
            .items-table td {
              padding: 8px;
            }
          }
          
          @media (max-width: 768px) {
            body {
              padding: 10px;
              font-size: 14px;
            }
            
            .info-grid {
              grid-template-columns: 1fr;
              gap: 10px;
            }
            
            .items-table {
              font-size: 12px;
            }
            
            .items-table th,
            .items-table td {
              padding: 8px;
              font-size: 11px;
            }
            
            .company-name {
              font-size: 20px;
            }
            
            .invoice-title {
              font-size: 18px;
            }
            
            .section-title {
              font-size: 14px;
            }
            
            .total-label,
            .total-value {
              font-size: 14px;
            }
            
            .grand-total .total-label,
            .grand-total .total-value {
              font-size: 16px;
            }
          }
        </style>
      </head>
      <body>
        <!-- Header -->
        <div class="invoice-header">
          <div class="company-info">
            <div class="company-name">FICI Shoes by NMF International</div>
            <div class="company-tagline">Handcrafted Leather Formal Shoes</div>
            <div class="text-sm text-gray-600 mt-2">
              GST: 33BMAPM8509H1Z4 | Email: support@ficishoes.com | Phone: +91 81220 03006
            </div>
          </div>
          <div class="invoice-title">SHIPPING INVOICE</div>
          <div class="text-sm text-gray-600">
            Invoice Date: ${new Date().toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })}
          </div>
        </div>

        <!-- Order Information -->
        <div class="section">
          <div class="section-title">Order Information</div>
          <div class="info-grid">
            <div>
              <div class="info-item">
                <span class="info-label">Order Number:</span>
                <span class="info-value">#${order.order_id.slice(-8)}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Order Date:</span>
                <span class="info-value">
                  ${new Date(order.order_date).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </span>
              </div>
              <div class="info-item">
                <span class="info-label">Payment Method:</span>
                <span class="info-value capitalize">${order.payment_method}</span>
              </div>
            </div>
            <div>
              <div class="info-item">
                <span class="info-label">Payment Status:</span>
                <span class="info-value capitalize">${order.payment_status}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Order Status:</span>
                <span class="info-value capitalize">${order.status}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Items Shipped:</span>
                <span class="info-value">${shippedItems.length} of ${order.order_items?.length || 0}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Customer Information -->
        <div class="section">
          <div class="section-title">Customer Information</div>
          <div class="info-grid">
            <div>
              <div class="info-item">
                <span class="info-label">Customer Name:</span>
                <span class="info-value">${extractCustomerName(order, order.shipping_address)}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Email:</span>
                <span class="info-value">${order.guest_email || 'N/A'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Phone:</span>
                <span class="info-value">${order.guest_phone || 'N/A'}</span>
              </div>
            </div>
            <div>
              <div class="info-item">
                <span class="info-label">Shipping Address:</span>
                <span class="info-value">${formatAddress(order.shipping_address)}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Shipping Information -->
        <div class="shipping-info">
          <div class="shipping-info-title">🚚 Shipping Information</div>
          <div class="info-grid">
            <div>
              <div class="info-item">
                <span class="info-label">Shipping Partner:</span>
                <span class="info-value capitalize">${shipmentInfo.shipping_partner}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Tracking ID:</span>
                <span class="info-value font-mono">${shipmentInfo.tracking_id}</span>
              </div>
            </div>
            ${shipmentInfo.tracking_url ? `
            <div>
              <div class="info-item">
                <span class="info-label">Tracking URL:</span>
                <span class="info-value text-xs break-all">${shipmentInfo.tracking_url}</span>
              </div>
            </div>
            ` : ''}
          </div>
        </div>

        <!-- Shipped Items -->
        <div class="section">
          <div class="section-title">Shipped Items</div>
          <table class="items-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Size</th>
                <th class="quantity">Quantity</th>
                <th class="price">Unit Price</th>
                <th class="price">Total</th>
              </tr>
            </thead>
            <tbody>
              ${shippedItems.map((item) => `
                <tr>
                  <td>
                    <div class="item-name">${item.product_name}</div>
                    ${(item as any).color ? `
                      <div class="text-sm text-gray-600">Color: ${(item as any).color}</div>
                    ` : ''}
                  </td>
                  <td>${item.size}</td>
                  <td class="quantity">${item.quantity}</td>
                  <td class="price">₹${parseFloat(String(item.price_at_purchase || '0')).toLocaleString('en-IN')}</td>
                  <td class="price">₹${calculateItemTotal(item).toLocaleString('en-IN')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <!-- Total Calculation -->
        <div class="total-section">
          <div class="total-row">
            <span class="total-label">Subtotal:</span>
            <span class="total-value">₹${calculateShippedTotal().toLocaleString('en-IN')}</span>
          </div>
          <div class="total-row">
            <span class="total-label">Shipping:</span>
            <span class="total-value">FREE</span>
          </div>
          <div class="total-row grand-total">
            <span class="total-label">Total:</span>
            <span class="total-value">₹${calculateShippedTotal().toLocaleString('en-IN')}</span>
          </div>
        </div>

        <!-- Instructions -->
        <div class="instructions">
          <div class="instructions-title">📋 Packing Instructions</div>
          <ul class="instructions-list">
            <li>Verify all items against the invoice before packing</li>
            <li>Ensure proper packaging to prevent damage during transit</li>
            <li>Include this invoice in the package</li>
            <li>Attach the shipping label clearly on the package</li>
            <li>Scan and update tracking information before dispatch</li>
          </ul>
        </div>

        <!-- Footer -->
        <div class="footer">
          <div>This is a computer-generated invoice and does not require a signature</div>
          <div> 2024 FICI Shoes by NMF International. All rights reserved.</div>
          <div>For any queries, contact our customer support at info@ficishoes.com or call +91 99527 22675</div>
          <div>Khaderpet, Ambur - 635802, Tirupathur District, Tamil Nadu</div>
        </div>
      </body>
    </html>
  `;
};

export const printInvoice = (
  order: Order,
  shippedItems: OrderItem[],
  shipmentInfo: ShipmentInfo
): void => {
  const invoiceHTML = generateInvoiceHTML(order, shippedItems, shipmentInfo);
  
  // Check if mobile device
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  if (isMobile) {
    // Mobile-friendly approach: create iframe and print
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.left = '-9999px';
    iframe.style.top = '-9999px';
    iframe.style.width = '800px';
    iframe.style.height = '600px';
    iframe.style.border = 'none';
    
    document.body.appendChild(iframe);
    
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (iframeDoc) {
      iframeDoc.open();
      iframeDoc.write(invoiceHTML);
      iframeDoc.close();
      
      // Wait for content to load, then print
      setTimeout(() => {
        try {
          iframe.contentWindow?.print();
        } catch (error) {
          console.warn('Print failed, falling back to download:', error);
          // Fallback: download as HTML file
          downloadInvoiceAsHTML(invoiceHTML, order.order_id);
        }
        
        // Clean up iframe
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1000);
      }, 500);
    }
  } else {
    // Desktop approach: create new window
    const printWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
    if (printWindow) {
      printWindow.document.write(invoiceHTML);
      printWindow.document.close();
      
      // Wait for content to load, then print
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 500);
      };
    } else {
      // Fallback: create a downloadable HTML file
      downloadInvoiceAsHTML(invoiceHTML, order.order_id);
    }
  }
};

// Helper function to download invoice as HTML file
const downloadInvoiceAsHTML = (invoiceHTML: string, orderId: string): void => {
  try {
    const blob = new Blob([invoiceHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice-${orderId.slice(-8)}.html`;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to download invoice:', error);
    // Last resort: copy to clipboard
    navigator.clipboard.writeText(invoiceHTML).then(() => {
      showAlert('Invoice copied to clipboard! You can paste it into a text editor and save as HTML.', 'info');
    }).catch(() => {
      showAlert('Unable to print or download invoice. Please try again on desktop.', 'error');
    });
  }
};
