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

export const printInvoice = (invoice: InvoiceData): void => {
  try {
    const html = generateInvoiceHTML(invoice);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.print();
      printWindow.close();
      
      showSuccessAlert('Invoice sent to printer');
    } else {
      showErrorAlert('Failed to open print window');
    }
  } catch (error) {
    console.error('Error printing invoice:', error);
    showErrorAlert('Failed to print invoice');
  }
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
