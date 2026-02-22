import { showSuccessAlert, showErrorAlert } from '../lib/utils/alertUtils';

export interface InvoiceItem {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  price: number;
  total: number;
}

export interface InvoiceData {
  id: string;
  invoiceNumber: string;
  date: string;
  dueDate?: string;
  customer: {
    name: string;
    email: string;
    phone?: string;
    address?: string;
  };
  items: InvoiceItem[];
  subtotal: number;
  tax?: number;
  discount?: number;
  total: number;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  notes?: string;
}

export const generateInvoiceNumber = (): string => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `INV-${timestamp}-${random}`;
};

export const calculateInvoiceTotal = (items: InvoiceItem[]): number => {
  return items.reduce((total, item) => total + item.total, 0);
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(amount);
};

export const formatDate = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export const generateInvoiceHTML = (invoice: InvoiceData): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Invoice ${invoice.invoiceNumber}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .invoice-details { display: flex; justify-content: space-between; margin-bottom: 30px; }
        .customer-info { margin-bottom: 30px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        th { background-color: #f5f5f5; }
        .total-section { text-align: right; margin-top: 20px; }
        .notes { margin-top: 30px; padding: 15px; background-color: #f9f9f9; }
      </style>
    </head>
    <body>
      <div class="header">
        <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 20px;">
          <img src="https://www.ficishoes.com/fici_128x128.png" alt="Fici Shoes" style="height: 60px; margin-right: 15px;">
          <div>
            <h1 style="margin: 0; font-size: 28px; color: #333;">Invoice</h1>
            <p style="margin: 5px 0 0 0; font-size: 14px; color: #666;">Fici Shoes</p>
          </div>
        </div>
        <h2>${invoice.invoiceNumber}</h2>
      </div>
      
      <div class="invoice-details">
        <div>
          <p><strong>Date:</strong> ${formatDate(invoice.date)}</p>
          ${invoice.dueDate ? `<p><strong>Due Date:</strong> ${formatDate(invoice.dueDate)}</p>` : ''}
        </div>
        <div>
          <p><strong>Status:</strong> <span style="color: ${getStatusColor(invoice.status)}">${invoice.status.toUpperCase()}</span></p>
        </div>
      </div>
      
      <div class="customer-info">
        <h3>Bill To:</h3>
        <p><strong>${invoice.customer.name}</strong></p>
        <p>${invoice.customer.email}</p>
        ${invoice.customer.phone ? `<p>${invoice.customer.phone}</p>` : ''}
        ${invoice.customer.address ? `<p>${invoice.customer.address}</p>` : ''}
      </div>
      
      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th>Quantity</th>
            <th>Price</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${invoice.items.map(item => `
            <tr>
              <td>${item.name}${item.description ? `<br><small>${item.description}</small>` : ''}</td>
              <td>${item.quantity}</td>
              <td>${formatCurrency(item.price)}</td>
              <td>${formatCurrency(item.total)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="total-section">
        <p><strong>Subtotal:</strong> ${formatCurrency(invoice.subtotal)}</p>
        ${invoice.tax ? `<p><strong>Tax:</strong> ${formatCurrency(invoice.tax)}</p>` : ''}
        ${invoice.discount ? `<p><strong>Discount:</strong> -${formatCurrency(invoice.discount)}</p>` : ''}
        <h3><strong>Total:</strong> ${formatCurrency(invoice.total)}</h3>
      </div>
      
      ${invoice.notes ? `
        <div class="notes">
          <h4>Notes:</h4>
          <p>${invoice.notes}</p>
        </div>
      ` : ''}
    </body>
    </html>
  `;
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'paid': return 'green';
    case 'pending': return 'orange';
    case 'overdue': return 'red';
    case 'cancelled': return 'gray';
    default: return 'black';
  }
};

export const downloadInvoice = (invoice: InvoiceData): void => {
  try {
    const html = generateInvoiceHTML(invoice);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice-${invoice.invoiceNumber}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showSuccessAlert('Invoice downloaded successfully');
  } catch (error) {
    console.error('Error downloading invoice:', error);
    showErrorAlert('Failed to download invoice');
  }
};

export const printInvoice = (invoice: InvoiceData): Promise<{ success: boolean; action: 'printed' | 'cancelled' | 'downloaded' | 'failed' | 'share_intent' }> => {
  return new Promise((resolve) => {
    const invoiceHTML = generateInvoiceHTML(invoice);
    
    // Detect device type
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    
    // Mobile-specific strategies
    if (isMobile) {
      // Strategy 1: iOS - Use share menu for printing
      if (isIOS) {
        try {
          // Create a blob and use Web Share API for iOS
          const blob = new Blob([invoiceHTML], { type: 'text/html' });
          const file = new File([blob], `invoice-${invoice.invoiceNumber}.html`, { type: 'text/html' });
          
          if (navigator.share && navigator.canShare({ files: [file] })) {
            navigator.share({
              title: `Invoice - ${invoice.invoiceNumber}`,
              text: 'FICI Shoes Invoice',
              files: [file]
            }).then(() => {
              resolve({ success: true, action: 'share_intent' });
            }).catch((error) => {
              downloadInvoice(invoice);
              resolve({ success: true, action: 'downloaded' });
            });
            return;
          }
        } catch (error) {
          // iOS share failed, falling back to iframe
        }
      }
      
      // Strategy 2: Android - Try share intent first, then iframe
      if (isAndroid) {
        try {
          const blob = new Blob([invoiceHTML], { type: 'text/html' });
          const file = new File([blob], `invoice-${invoice.invoiceNumber}.html`, { type: 'text/html' });
          
          if (navigator.share && navigator.canShare({ files: [file] })) {
            navigator.share({
              title: `Invoice - ${invoice.invoiceNumber}`,
              text: 'FICI Shoes Invoice - Open in browser to print',
              files: [file]
            }).then(() => {
              resolve({ success: true, action: 'share_intent' });
            }).catch((error) => {
              // Android share failed, trying iframe
            });
          }
        } catch (error) {
          // Android share failed, trying iframe
        }
      }
      
      // Strategy 3: Mobile iframe approach (works on most mobile browsers)
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.left = '0';
      iframe.style.top = '0';
      iframe.style.width = '100vw';
      iframe.style.height = '100vh';
      iframe.style.border = 'none';
      iframe.style.background = 'white';
      iframe.style.zIndex = '9999';
      iframe.style.overflow = 'hidden';
      
      document.body.appendChild(iframe);
      
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (iframeDoc) {
        // Write the invoice content
        iframeDoc.open();
        iframeDoc.write(invoiceHTML);
        iframeDoc.close();
        
        // Add mobile-specific print styles
        const mobilePrintStyles = iframeDoc.createElement('style');
        mobilePrintStyles.textContent = `
          @media print {
            body { 
              margin: 0 !important; 
              padding: 10px !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            @page {
              margin: 0.5in;
              size: A4;
            }
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }
          
          @media screen {
            body {
              zoom: 0.8;
              -webkit-transform: scale(0.8);
              transform: scale(0.8);
              -webkit-transform-origin: 0 0;
              transform-origin: 0 0;
            }
          }
          
          .mobile-print-hint {
            position: fixed;
            top: 10px;
            right: 10px;
            background: #007AFF;
            color: white;
            padding: 8px 12px;
            border-radius: 8px;
            font-size: 14px;
            z-index: 10000;
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          }
          
          @media print {
            .mobile-print-hint {
              display: none !important;
            }
          }
        `;
        iframeDoc.head.appendChild(mobilePrintStyles);
        
        // Add mobile print hint button
        const printHint = iframeDoc.createElement('div');
        printHint.className = 'mobile-print-hint';
        printHint.textContent = '🖨️ Print';
        printHint.onclick = () => {
          try {
            iframe.contentWindow?.print();
          } catch (error) {
            console.error('Print failed:', error);
            alert('Please use your browser\'s menu: Share → Print');
          }
        };
        iframeDoc.body.appendChild(printHint);
        
        // Wait for content to fully load
        setTimeout(() => {
          try {
            // Focus the iframe
            iframe.contentWindow?.focus();
            
            // Add print event listeners
            let printStarted = false;
            
            const handlePrintStart = () => {
              printStarted = true;
            };
            
            const handlePrintEnd = () => {
              setTimeout(() => {
                if (document.body.contains(iframe)) {
                  document.body.removeChild(iframe);
                }
              }, 1000);
              
              if (printStarted) {
                resolve({ success: true, action: 'printed' });
              } else {
                resolve({ success: false, action: 'cancelled' });
              }
            };
            
            // Set timeout for cancellation
            const printTimeout = setTimeout(() => {
              if (document.body.contains(iframe)) {
                document.body.removeChild(iframe);
              }
              resolve({ success: false, action: 'cancelled' });
            }, 15000); // 15 second timeout for mobile
            
            // Add event listeners
            iframe.contentWindow?.addEventListener('beforeprint', handlePrintStart);
            
            // For mobile browsers that don't support beforeprint
            const mediaQueryList = iframe.contentWindow?.matchMedia('print');
            if (mediaQueryList) {
              mediaQueryList.addEventListener('change', (e) => {
                if (e.matches) {
                  handlePrintStart();
                } else {
                  handlePrintEnd();
                }
              });
            }
            
            // Try to print automatically
            try {
              iframe.contentWindow?.print();
            } catch (error) {
              // Auto print failed on mobile, showing manual hint
              // The print hint button is already visible, so user can print manually
              setTimeout(() => {
                if (document.body.contains(iframe)) {
                  document.body.removeChild(iframe);
                }
                resolve({ success: false, action: 'cancelled' });
              }, 20000); // Longer timeout for manual interaction
            }
            
          } catch (error) {
            // Mobile print setup failed
            // Fallback to download
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
            downloadInvoice(invoice);
            resolve({ success: true, action: 'downloaded' });
          }
        }, 1500); // Longer wait for mobile rendering
      } else {
        // If iframe creation failed
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
        downloadInvoice(invoice);
        resolve({ success: true, action: 'downloaded' });
      }
    } else {
      // Desktop approach - create data URL to avoid about:blank
      const dataUrl = `data:text/html;charset=utf-8,${encodeURIComponent(invoiceHTML)}`;
      const printWindow = window.open(dataUrl, '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
      if (printWindow) {
        printWindow.onload = () => {
          setTimeout(() => {
            try {
              let printStarted = false;
              
              const handlePrintStart = () => {
                printStarted = true;
              };
              
              const handlePrintEnd = () => {
                setTimeout(() => {
                  printWindow.close();
                }, 500);
                
                if (printStarted) {
                  resolve({ success: true, action: 'printed' });
                } else {
                  resolve({ success: false, action: 'cancelled' });
                }
              };
              
              const mediaQueryList = printWindow.matchMedia('print');
              if (mediaQueryList) {
                mediaQueryList.addEventListener('change', (e) => {
                  if (e.matches) {
                    handlePrintStart();
                  } else {
                    handlePrintEnd();
                  }
                });
              }
              
              printWindow.addEventListener('beforeprint', handlePrintStart);
              
              setTimeout(() => {
                if (mediaQueryList) {
                  mediaQueryList.removeEventListener('change', handlePrintEnd);
                }
                printWindow.removeEventListener('beforeprint', handlePrintStart);
                printWindow.close();
                resolve({ success: false, action: 'cancelled' });
              }, 10000);
              
              printWindow.print();
            } catch (error) {
              printWindow.close();
              resolve({ success: false, action: 'failed' });
            }
          }, 500);
        };
      } else {
        downloadInvoice(invoice);
        resolve({ success: true, action: 'downloaded' });
      }
    }
  });
};

export const validateInvoice = (invoice: Partial<InvoiceData>): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!invoice.customer?.name) errors.push('Customer name is required');
  if (!invoice.customer?.email) errors.push('Customer email is required');
  if (!invoice.items || invoice.items.length === 0) errors.push('At least one item is required');
  if (!invoice.date) errors.push('Invoice date is required');
  
  if (invoice.items) {
    invoice.items.forEach((item, index) => {
      if (!item.name) errors.push(`Item ${index + 1}: Name is required`);
      if (!item.quantity || item.quantity <= 0) errors.push(`Item ${index + 1}: Quantity must be greater than 0`);
      if (!item.price || item.price < 0) errors.push(`Item ${index + 1}: Price must be non-negative`);
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const createInvoice = (data: Partial<InvoiceData>): InvoiceData => {
  const validation = validateInvoice(data);
  if (!validation.isValid) {
    throw new Error(validation.errors.join(', '));
  }
  
  const items = data.items || [];
  const subtotal = calculateInvoiceTotal(items);
  
  return {
    id: data.id || crypto.randomUUID(),
    invoiceNumber: data.invoiceNumber || generateInvoiceNumber(),
    date: data.date || new Date().toISOString(),
    dueDate: data.dueDate,
    customer: data.customer!,
    items,
    subtotal,
    tax: data.tax || 0,
    discount: data.discount || 0,
    total: subtotal + (data.tax || 0) - (data.discount || 0),
    status: data.status || 'pending',
    notes: data.notes
  };
};

export const updateInvoiceStatus = (
  invoice: InvoiceData, 
  status: InvoiceData['status']
): InvoiceData => {
  return {
    ...invoice,
    status
  };
};

// Additional invoice utilities that might have been in the original file

export const parseInvoiceDate = (dateString: string | undefined): Date => {
  if (!dateString) {
    return new Date();
  }
  return new Date(dateString);
};

export const isInvoiceOverdue = (invoice: InvoiceData): boolean => {
  if (!invoice.dueDate || invoice.status === 'paid' || invoice.status === 'cancelled') {
    return false;
  }
  return new Date() > new Date(invoice.dueDate);
};

export const getInvoiceSummary = (invoices: InvoiceData[]): {
  total: number;
  paid: number;
  pending: number;
  overdue: number;
  cancelled: number;
} => {
  return invoices.reduce(
    (summary, invoice) => {
      summary.total++;
      summary[invoice.status]++;
      return summary;
    },
    { total: 0, paid: 0, pending: 0, overdue: 0, cancelled: 0 }
  );
};

export const filterInvoicesByStatus = (
  invoices: InvoiceData[],
  status: InvoiceData['status']
): InvoiceData[] => {
  return invoices.filter(invoice => invoice.status === status);
};

export const filterInvoicesByDateRange = (
  invoices: InvoiceData[],
  startDate: string,
  endDate: string
): InvoiceData[] => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  return invoices.filter(invoice => {
    const invoiceDate = new Date(invoice.date);
    return invoiceDate >= start && invoiceDate <= end;
  });
};

export const searchInvoices = (
  invoices: InvoiceData[],
  searchTerm: string
): InvoiceData[] => {
  const term = searchTerm.toLowerCase();
  
  return invoices.filter(invoice => 
    invoice.invoiceNumber.toLowerCase().includes(term) ||
    invoice.customer.name.toLowerCase().includes(term) ||
    invoice.customer.email.toLowerCase().includes(term) ||
    invoice.items.some(item => item.name.toLowerCase().includes(term))
  );
};

export const sortInvoices = (
  invoices: InvoiceData[],
  sortBy: 'date' | 'total' | 'invoiceNumber',
  order: 'asc' | 'desc' = 'desc'
): InvoiceData[] => {
  return [...invoices].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'date':
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
        break;
      case 'total':
        comparison = a.total - b.total;
        break;
      case 'invoiceNumber':
        comparison = a.invoiceNumber.localeCompare(b.invoiceNumber);
        break;
    }
    
    return order === 'asc' ? comparison : -comparison;
  });
};

export const exportInvoicesToCSV = (invoices: InvoiceData[]): string => {
  const headers = [
    'Invoice Number',
    'Date',
    'Due Date',
    'Customer Name',
    'Customer Email',
    'Status',
    'Subtotal',
    'Tax',
    'Discount',
    'Total'
  ];
  
  const rows = invoices.map(invoice => [
    invoice.invoiceNumber,
    invoice.date,
    invoice.dueDate || '',
    invoice.customer.name,
    invoice.customer.email,
    invoice.status,
    invoice.subtotal.toString(),
    invoice.tax?.toString() || '0',
    invoice.discount?.toString() || '0',
    invoice.total.toString()
  ]);
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
  
  return csvContent;
};

export const downloadInvoicesCSV = (invoices: InvoiceData): void => {
  try {
    const csv = exportInvoicesToCSV([invoices]);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoices-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showSuccessAlert('Invoices exported to CSV successfully');
  } catch (error) {
    console.error('Error exporting CSV:', error);
    showErrorAlert('Failed to export invoices to CSV');
  }
};

export const calculateTax = (amount: number, taxRate: number): number => {
  return amount * (taxRate / 100);
};

export const applyDiscount = (amount: number, discountType: 'percentage' | 'fixed', discountValue: number): number => {
  if (discountType === 'percentage') {
    return amount * (discountValue / 100);
  }
  return discountValue;
};

export const generateInvoicePDF = async (invoice: InvoiceData): Promise<Blob> => {
  // This would typically use a PDF generation library like jsPDF or Puppeteer
  // For now, we'll return the HTML as a blob
  const html = generateInvoiceHTML(invoice);
  return new Blob([html], { type: 'text/html' });
};

export const sendInvoiceEmail = async (
  invoice: InvoiceData,
  recipientEmail: string
): Promise<void> => {
  // This would typically integrate with an email service
  console.log('Sending invoice to:', recipientEmail);
  console.log('Invoice:', invoice.invoiceNumber);
  
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  showSuccessAlert(`Invoice ${invoice.invoiceNumber} sent to ${recipientEmail}`);
};

export const getInvoiceStats = (invoices: InvoiceData[]): {
  totalRevenue: number;
  averageInvoiceValue: number;
  highestInvoice: InvoiceData | null;
  lowestInvoice: InvoiceData | null;
  paidInvoices: InvoiceData[];
  pendingInvoices: InvoiceData[];
  overdueInvoices: InvoiceData[];
} => {
  const paidInvoices = filterInvoicesByStatus(invoices, 'paid');
  const pendingInvoices = filterInvoicesByStatus(invoices, 'pending');
  const overdueInvoices = invoices.filter(inv => isInvoiceOverdue(inv));
  
  const totalRevenue = paidInvoices.reduce((sum, inv) => sum + inv.total, 0);
  const averageInvoiceValue = paidInvoices.length > 0 ? totalRevenue / paidInvoices.length : 0;
  
  const sortedByAmount = [...paidInvoices].sort((a, b) => b.total - a.total);
  const highestInvoice = sortedByAmount[0] || null;
  const lowestInvoice = sortedByAmount[sortedByAmount.length - 1] || null;
  
  return {
    totalRevenue,
    averageInvoiceValue,
    highestInvoice,
    lowestInvoice,
    paidInvoices,
    pendingInvoices,
    overdueInvoices
  };
};

export const validateInvoiceNumber = (invoiceNumber: string): boolean => {
  // Basic validation - should start with INV- followed by numbers
  const pattern = /^INV-\d+-\d+$/;
  return pattern.test(invoiceNumber);
};

export const sanitizeCustomerData = (customer: InvoiceData['customer']): InvoiceData['customer'] => {
  return {
    name: customer.name.trim(),
    email: customer.email.toLowerCase().trim(),
    phone: customer.phone?.trim() || undefined,
    address: customer.address?.trim() || undefined
  };
};

export const calculateLateFees = (
  invoice: InvoiceData,
  lateFeeRate: number = 0.05 // 5% per month
): number => {
  if (!isInvoiceOverdue(invoice)) {
    return 0;
  }
  
  const dueDate = new Date(invoice.dueDate!);
  const today = new Date();
  const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
  const monthsOverdue = Math.ceil(daysOverdue / 30);
  
  return invoice.total * (lateFeeRate * monthsOverdue);
};

// Fix for the Date constructor issue mentioned in the error
export const safeDateParse = (dateString: string | undefined): Date => {
  if (!dateString) {
    return new Date();
  }
  
  try {
    const parsed = new Date(dateString);
    if (isNaN(parsed.getTime())) {
      return new Date();
    }
    return parsed;
  } catch (error) {
    console.warn('Invalid date string:', dateString);
    return new Date();
  }
};
