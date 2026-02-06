import React, { useRef } from 'react';
import { Package, MapPin, Phone, Mail, User, Calendar, DollarSign, Truck, Building } from 'lucide-react';
import type { Order, OrderItem, ShippingAddress } from '../../types/order-common';
import type { AdminOrder } from '../../types/order';

interface ShippingInvoiceProps {
  order: Order | AdminOrder;
  shippedItems: OrderItem[];
  shipmentInfo: {
    shipping_partner: string;
    tracking_id: string;
    tracking_url?: string;
  };
  onPrint?: () => void;
  showPrintButton?: boolean;
}

const ShippingInvoice: React.FC<ShippingInvoiceProps> = ({
  order,
  shippedItems,
  shipmentInfo,
  onPrint,
  showPrintButton = true
}) => {
  const invoiceRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (invoiceRef.current) {
      // Create a new window for printing
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        const invoiceContent = invoiceRef.current.innerHTML;
        const styles = `
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
              
              .no-print {
                display: none !important;
              }
            }
          </style>
        `;
        
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Shipping Invoice - Order #${order.order_id.slice(-8)}</title>
              ${styles}
            </head>
            <body>
              ${invoiceContent}
            </body>
          </html>
        `);
        
        printWindow.document.close();
        
        // Wait for content to load, then print
        printWindow.onload = () => {
          setTimeout(() => {
            printWindow.print();
            printWindow.close();
          }, 500);
        };
      }
    }
    
    if (onPrint) {
      onPrint();
    }
  };

  const isShippingAddress = (address: ShippingAddress | string): address is ShippingAddress => {
    return typeof address === 'object' && address !== null;
  };

  const calculateItemTotal = (item: OrderItem) => {
    return (parseFloat(String(item.price_at_purchase)) * item.quantity);
  };

  const calculateShippedTotal = () => {
    return shippedItems.reduce((total, item) => total + calculateItemTotal(item), 0);
  };

  const formatAddress = (address: ShippingAddress | string) => {
    if (isShippingAddress(address)) {
      return `${address.name || 'N/A'}, ${address.address || 'N/A'}, ${address.city || 'N/A'}, ${address.district ? address.district + ', ' : ''}${address.state || 'N/A'} - ${address.pincode || 'N/A'}`;
    }
    return address;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg" ref={invoiceRef}>
      {/* Print Button - Only shown when not in print mode */}
      {showPrintButton && (
        <div className="no-print p-4 border-b border-gray-200">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Package className="w-4 h-4" />
            Print Invoice
          </button>
        </div>
      )}

      {/* Invoice Content */}
      <div className="p-6">
        {/* Header */}
        <div className="invoice-header">
          <div className="company-info">
            <div className="company-name">FiCi Shoes</div>
            <div className="company-tagline">Premium Leather Footwear</div>
            <div className="text-sm text-gray-600 mt-2">
              GST: 27AAAPF1234C1ZV | Email: info@fici.com | Phone: +91 98765 43210
            </div>
          </div>
          <div className="invoice-title">SHIPPING INVOICE</div>
          <div className="text-sm text-gray-600">
            Invoice Date: {new Date().toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })}
          </div>
        </div>

        {/* Order Information */}
        <div className="section">
          <div className="section-title">Order Information</div>
          <div className="info-grid">
            <div>
              <div className="info-item">
                <span className="info-label">Order Number:</span>
                <span className="info-value">#{order.order_id.slice(-8)}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Order Date:</span>
                <span className="info-value">
                  {new Date(order.order_date).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Payment Method:</span>
                <span className="info-value capitalize">{order.payment_method}</span>
              </div>
            </div>
            <div>
              <div className="info-item">
                <span className="info-label">Payment Status:</span>
                <span className="info-value capitalize">{order.payment_status}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Order Status:</span>
                <span className="info-value capitalize">{order.status}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Items Shipped:</span>
                <span className="info-value">{shippedItems.length} of {order.order_items?.length || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Information */}
        <div className="section">
          <div className="section-title">Customer Information</div>
          <div className="info-grid">
            <div>
              <div className="info-item">
                <span className="info-label">Customer Name:</span>
                <span className="info-value">
                  {order.user_id
                    ? `User ID: ${order.user_id}`
                    : order.guest_email || 'N/A'}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Email:</span>
                <span className="info-value">{order.guest_email || 'N/A'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Phone:</span>
                <span className="info-value">{order.guest_phone || 'N/A'}</span>
              </div>
            </div>
            <div>
              <div className="info-item">
                <span className="info-label">Shipping Address:</span>
                <span className="info-value">{formatAddress(order.shipping_address)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Shipping Information */}
        <div className="shipping-info">
          <div className="shipping-info-title">🚚 Shipping Information</div>
          <div className="info-grid">
            <div>
              <div className="info-item">
                <span className="info-label">Shipping Partner:</span>
                <span className="info-value capitalize">{shipmentInfo.shipping_partner}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Tracking ID:</span>
                <span className="info-value font-mono">{shipmentInfo.tracking_id}</span>
              </div>
            </div>
            {shipmentInfo.tracking_url && (
              <div>
                <div className="info-item">
                  <span className="info-label">Tracking URL:</span>
                  <span className="info-value text-xs break-all">{shipmentInfo.tracking_url}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Shipped Items */}
        <div className="section">
          <div className="section-title">Shipped Items</div>
          <table className="items-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Size</th>
                <th className="quantity">Quantity</th>
                <th className="price">Unit Price</th>
                <th className="price">Total</th>
              </tr>
            </thead>
            <tbody>
              {shippedItems.map((item, index) => (
                <tr key={item.order_item_id}>
                  <td>
                    <div className="item-name">{item.product_name}</div>
                    {(item as any).color && (
                      <div className="text-sm text-gray-600">Color: {(item as any).color}</div>
                    )}
                  </td>
                  <td>{item.size}</td>
                  <td className="quantity">{item.quantity.toString()}</td>
                  <td className="price">₹{parseFloat(String(item.price_at_purchase)).toLocaleString('en-IN')}</td>
                  <td className="price">₹{calculateItemTotal(item).toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Total Calculation */}
        <div className="total-section">
          <div className="total-row">
            <span className="total-label">Subtotal:</span>
            <span className="total-value">₹{calculateShippedTotal().toLocaleString('en-IN')}</span>
          </div>
          <div className="total-row">
            <span className="total-label">Shipping:</span>
            <span className="total-value">FREE</span>
          </div>
          <div className="total-row grand-total">
            <span className="total-label">Total:</span>
            <span className="total-value">₹{calculateShippedTotal().toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Instructions */}
        <div className="instructions">
          <div className="instructions-title">📋 Packing Instructions</div>
          <ul className="instructions-list">
            <li>Verify all items against the invoice before packing</li>
            <li>Ensure proper packaging to prevent damage during transit</li>
            <li>Include this invoice in the package</li>
            <li>Attach the shipping label clearly on the package</li>
            <li>Scan and update tracking information before dispatch</li>
          </ul>
        </div>

        {/* Footer */}
        <div className="footer">
          <div>This is a computer-generated invoice and does not require a signature</div>
          <div>© 2024 FiCi Shoes. All rights reserved.</div>
          <div>For any queries, contact our customer support at support@fici.com</div>
        </div>
      </div>
    </div>
  );
};

export default ShippingInvoice;
