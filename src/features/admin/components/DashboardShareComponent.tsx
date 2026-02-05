import React, { useState } from 'react';
import { MessageCircle, FileText, Camera, RefreshCw } from 'lucide-react';
import html2canvas from 'html2canvas';
import { supabase } from '@lib/supabase';

interface DashboardShareComponentProps {
  stats: any;
  topProducts: any;
  allProducts: any;
  trafficVisits: number;
  comprehensiveData?: any;
  onDataReset?: () => void; // Callback to refresh data after reset
}

// Function to reset traffic data
const resetTrafficData = async () => {
  try {
    // Reset traffic_sources table - update all rows
    const { error: trafficError } = await supabase
      .from('traffic_sources')
      .update({ 
        visit_count: 0, 
        last_visited_at: new Date().toISOString() 
      })
      .gte('id', '00000000-0000-0000-0000-000000000000'); // Update all rows (UUID comparison)

    if (trafficError) throw trafficError;

    // Reset product_visit_stats table - update all rows
    const { error: productError } = await supabase
      .from('product_visit_stats')
      .update({ 
        visit_count: 0, 
        last_visited_at: new Date().toISOString() 
      })
      .gte('product_id', '00000000-0000-0000-0000-000000000000'); // Update all rows (UUID comparison)

    if (productError) throw productError;

    return { success: true };
  } catch (error) {
    console.error('Error resetting traffic data:', error);
    return { success: false, error };
  }
};

// Function to calculate product revenue from existing order data
const calculateProductRevenue = (productId: string, orders: any[]) => {
  let revenue = 0;
  orders.forEach(order => {
    // For now, use order total_amount as revenue (simplified approach)
    // This will show total order revenue, not per-product revenue
    if (order.payment_status === 'paid') {
      revenue += (order.effective_amount || order.total_amount || 0);
    }
  });
  return revenue;
};

// Function to generate comprehensive report using existing data
const generateComprehensiveReport = (stats: any, topProducts: any, allProducts: any, trafficVisits: number, comprehensiveData: any) => {
  const date = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  // Calculate accurate revenue from existing orders data
  const totalOrderRevenue = comprehensiveData?.recentOrders
    ?.filter(order => order.payment_status === 'paid')
    ?.reduce((sum, order) => sum + (order.effective_amount || order.total_amount || 0), 0) || 0;

  // Calculate product revenues from existing data
  const productsWithRevenue = topProducts.map(product => ({
    ...product,
    revenue: calculateProductRevenue(product.product_id || product.id, comprehensiveData?.recentOrders || [])
  }));

  let report = `📊 *FiCi Shoes - Complete Dashboard Report*\n📅 ${date}\n\n` +
    `🔥 *KEY METRICS*\n` +
    `👁️ Total Visits: ${(stats.totalVisits || 0).toLocaleString()}\n` +
    `🌐 Traffic Visits: ${trafficVisits.toLocaleString()}\n` +
    `🛒 Total Orders: ${(stats.totalOrders || 0).toLocaleString()}\n` +
    `👥 Total Users: ${(stats.totalUsers || 0).toLocaleString()}\n` +
    `💰 Total Revenue: ₹${totalOrderRevenue.toLocaleString('en-IN')}\n` +
    `📈 Conversion Rate: ${(stats.conversionRate || 0).toFixed(2)}%\n` +
    `📦 Pending Orders: ${(stats.pendingOrders || 0).toLocaleString()}\n\n`;

  // Top Products Section with revenue
  if (productsWithRevenue && productsWithRevenue.length > 0) {
    report += `🏆 *TOP PRODUCTS*\n`;
    productsWithRevenue.slice(0, 10).forEach((product: any, index: number) => {
      const name = product.name || 'Unknown Product';
      const visits = product.visit_count || 0;
      const revenue = product.revenue || 0;
      report += `${index + 1}. ${name}\n   📊 ${visits} visits | 💰 ₹${revenue.toLocaleString('en-IN')}\n`;
    });
    report += `\n`;
  }

  // Traffic Sources Section
  if (comprehensiveData?.trafficSources && comprehensiveData.trafficSources.length > 0) {
    report += `🌐 *TRAFFIC SOURCES*\n`;
    comprehensiveData.trafficSources.slice(0, 10).forEach((source: any, index: number) => {
      const sourceName = source.source || 'Direct';
      const medium = source.medium ? ` (${source.medium})` : '';
      const campaign = source.campaign ? ` [${source.campaign}]` : '';
      const visits = source.visit_count || 0;
      report += `${index + 1}. ${sourceName}${medium}${campaign}: ${visits} visits\n`;
    });
    report += `\n`;
  }

  // Product Visits Section
  if (comprehensiveData?.productVisits && comprehensiveData.productVisits.length > 0) {
    report += `🛍️ *PRODUCT VISITS DETAILED*\n`;
    comprehensiveData.productVisits.slice(0, 15).forEach((product: any, index: number) => {
      const name = product.name || 'Unknown Product';
      const visits = product.visit_count || 0;
      const lastVisited = product.last_visited_at ? new Date(product.last_visited_at).toLocaleDateString('en-IN') : 'N/A';
      const revenue = calculateProductRevenue(product.product_id, comprehensiveData?.recentOrders || []);
      report += `${index + 1}. ${name}\n   📊 ${visits} visits | 💰 ₹${revenue.toLocaleString('en-IN')} | 📅 ${lastVisited}\n`;
    });
    report += `\n`;
  }

  // Recent Orders Section
  if (comprehensiveData?.recentOrders && comprehensiveData.recentOrders.length > 0) {
    report += `📋 *RECENT ORDERS*\n`;
    comprehensiveData.recentOrders.slice(0, 10).forEach((order: any, index: number) => {
      const orderId = order.id ? order.id.slice(0, 8) : 'N/A';
      const amount = order.effective_amount || order.total_amount || 0;
      const status = order.status || 'Unknown';
      const paymentStatus = order.payment_status || 'Unknown';
      const date = order.created_at ? new Date(order.created_at).toLocaleDateString('en-IN') : 'N/A';
      report += `${index + 1}. Order #${orderId}\n   💰 ₹${amount.toLocaleString('in-IN')} | 📦 ${status} | 💳 ${paymentStatus} | 📅 ${date}\n`;
    });
    report += `\n`;
  }

  // Summary Statistics
  const totalTrafficVisits = comprehensiveData?.trafficSources?.reduce((sum: number, source: any) => sum + (source.visit_count || 0), 0) || 0;
  const totalProductVisits = comprehensiveData?.productVisits?.reduce((sum: number, product: any) => sum + (product.visit_count || 0), 0) || 0;
  const paidOrders = comprehensiveData?.recentOrders?.filter(order => order.payment_status === 'paid') || [];

  report += `📈 *SUMMARY STATISTICS*\n` +
    `🌐 Total Traffic Sources: ${comprehensiveData?.trafficSources?.length || 0}\n` +
    `👥 Total Product Visits: ${totalProductVisits.toLocaleString()}\n` +
    `📊 Products Tracked: ${comprehensiveData?.productVisits?.length || 0}\n` +
    `📋 Recent Orders: ${comprehensiveData?.recentOrders?.length || 0}\n` +
    `💳 Paid Orders: ${paidOrders.length}\n` +
    `💰 Total Revenue: ₹${totalOrderRevenue.toLocaleString('en-IN')}\n\n` +
    `🔗 [View Dashboard](${window.location.origin}/admin)\n` +
    `📱 FiCi Shoes - Premium Leather Footwear\n` +
    `📊 Report generated on ${new Date().toLocaleString('en-IN')}`;

  return report;
};

// Function to share via WhatsApp
const shareViaWhatsApp = (message: string) => {
  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
  window.open(whatsappUrl, '_blank');
};

// Function to download as text file
const downloadAsText = (content: string, filename: string) => {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};

// Function to download dashboard as image
const downloadDashboardAsImage = async (elementId: string, filename: string) => {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error('Dashboard element not found');
    }

    // Wait a bit for any dynamic content to render
    await new Promise(resolve => setTimeout(resolve, 500));

    // Store original styles
    const originalDisplay = (element as HTMLElement).style.display;
    const originalVisibility = (element as HTMLElement).style.visibility;
    const originalPosition = (element as HTMLElement).style.position as string;
    const originalLeft = (element as HTMLElement).style.left;
    const originalTop = (element as HTMLElement).style.top;
    const originalZIndex = (element as HTMLElement).style.zIndex;
    const originalWidth = (element as HTMLElement).style.width;
    
    // Make element visible but positioned off-screen for capture
    const elementRef = element as HTMLElement;
    elementRef.style.display = 'block';
    elementRef.style.visibility = 'visible';
    elementRef.style.position = 'absolute';
    elementRef.style.left = '-10000px'; // Position far off-screen
    elementRef.style.top = '-10000px'; // Position far off-screen
    elementRef.style.zIndex = '-9999'; // Keep it hidden behind everything
    elementRef.style.width = '1200px';
    elementRef.style.minWidth = '1200px';
    elementRef.style.maxWidth = '1200px';
    elementRef.style.overflow = 'visible';

    const canvas = await html2canvas(element, {
      backgroundColor: '#ffffff',
      scale: 1.5, // Reduced scale to prevent issues
      logging: false,
      useCORS: true,
      allowTaint: true,
      width: 1200,
      height: 1600, // Increased height significantly
      scrollX: 0,
      scrollY: 0,
      windowWidth: 1200,
      windowHeight: 1600,
      removeContainer: false,
      foreignObjectRendering: false, // Better CSS support
      imageTimeout: 15000, // Longer timeout
      onclone: (clonedDoc) => {
        // Force CSS Grid styles and ensure text visibility
        const styleElement = clonedDoc.createElement('style');
        styleElement.textContent = `
          * { 
            box-sizing: border-box !important; 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
            color: #000000 !important;
            background-color: #ffffff !important;
          }
          .grid { display: grid !important; }
          .grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)) !important; }
          .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
          .gap-3 { gap: 0.75rem !important; }
          .gap-4 { gap: 1rem !important; }
          .gap-6 { gap: 1.5rem !important; }
          .space-y-6 > * + * { margin-top: 1.5rem !important; }
          .text-gray-800 { color: #1f2937 !important; }
          .text-gray-600 { color: #4b5563 !important; }
          .text-blue-600 { color: #2563eb !important; }
          .text-green-600 { color: #059669 !important; }
          .text-purple-600 { color: #9333ea !important; }
          .text-emerald-600 { color: #10b981 !important; }
          .text-orange-600 { color: #ea580c !important; }
          .text-yellow-600 { color: #d97706 !important; }
          .bg-white { background-color: #ffffff !important; }
          .bg-gray-50 { background-color: #f9fafb !important; }
          .bg-blue-50 { background-color: #eff6ff !important; }
          .bg-green-50 { background-color: #f0fdf4 !important; }
          .bg-purple-50 { background-color: #f3e8ff !important; }
          .bg-emerald-50 { background-color: #ecfdf5 !important; }
          .bg-orange-50 { background-color: #fff7ed !important; }
          .bg-yellow-50 { background-color: #fef3c7 !important; }
          .border-gray-200 { border-color: #e5e7eb !important; }
          .border-blue-200 { border-color: #bfdbfe !important; }
          .border-green-200 { border-color: #bbf7d0 !important; }
          .border-purple-200 { border-color: #e9d5ff !important; }
          .border-emerald-200 { border-color: #a7f3d0 !important; }
          .border-orange-200 { border-color: #fed7aa !important; }
          .border-yellow-200 { border-color: #fde047 !important; }
        `;
        clonedDoc.head.appendChild(styleElement);

        // Remove any existing styles that might interfere
        const existingStyles = clonedDoc.querySelectorAll('style');
        existingStyles.forEach((style, index) => {
          if (index > 0) style.remove(); // Keep our injected styles, remove others
        });

        const elements = clonedDoc.querySelectorAll('*');
        elements.forEach(el => {
          const computedStyle = (el as HTMLElement).style;
          
          // Force all text to be visible and black
          if (el.textContent && el.textContent.trim()) {
            (el as HTMLElement).style.color = '#000000';
            (el as HTMLElement).style.backgroundColor = 'transparent';
          }
          
          // Ensure all backgrounds are white
          if (computedStyle.backgroundColor && computedStyle.backgroundColor.includes('oklch')) {
            computedStyle.backgroundColor = '#ffffff';
          }
          
          // Force visibility and display
          computedStyle.visibility = 'visible';
          computedStyle.opacity = '1';
          computedStyle.display = 'block';
          if (computedStyle.overflow === 'hidden') {
            computedStyle.overflow = 'visible';
          }
          
          // Remove any problematic filters
          computedStyle.filter = 'none';
          computedStyle.webkitFilter = 'none';
          computedStyle.backdropFilter = 'none';
        });

        const clonedElement = clonedDoc.getElementById(elementId);
        if (clonedElement) {
          (clonedElement as HTMLElement).style.width = '1200px';
          (clonedElement as HTMLElement).style.height = 'auto';
          (clonedElement as HTMLElement).style.overflow = 'visible';
          (clonedElement as HTMLElement).style.position = 'relative';
          (clonedElement as HTMLElement).style.left = '0';
          (clonedElement as HTMLElement).style.top = '0';
          (clonedElement as HTMLElement).style.zIndex = 'auto';
          (clonedElement as HTMLElement).style.display = 'block';
          (clonedElement as HTMLElement).style.visibility = 'visible';
          
          // Ensure grid containers maintain layout
          const gridElements = clonedElement.querySelectorAll('[class*="grid"]');
          gridElements.forEach((gridEl: any) => {
            gridEl.style.display = 'grid';
            if (gridEl.classList.contains('grid-cols-2')) {
              gridEl.style.gridTemplateColumns = 'repeat(2, minmax(0, 1fr))';
            }
          });
        }
      }
    });

    // Restore original styles immediately after capture
    elementRef.style.display = originalDisplay;
    elementRef.style.visibility = originalVisibility;
    elementRef.style.position = originalPosition;
    elementRef.style.left = originalLeft;
    elementRef.style.top = originalTop;
    elementRef.style.zIndex = originalZIndex;
    elementRef.style.width = originalWidth;

    canvas.toBlob((blob) => {
      if (blob) {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    }, 'image/png');

    return { success: true };
  } catch (error) {
    console.error('Error generating image:', error);
    return { success: false, error };
  }
};

const DashboardShareComponent: React.FC<DashboardShareComponentProps> = ({
  stats,
  topProducts,
  allProducts,
  trafficVisits,
  comprehensiveData,
  onDataReset
}) => {
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [reportMessage, setReportMessage] = useState('');

  // Handle comprehensive report sharing
  const handleShareComprehensiveReport = async () => {
    setIsGeneratingReport(true);
    setReportMessage('');
    
    try {
      const report = generateComprehensiveReport(stats, topProducts, allProducts, trafficVisits, comprehensiveData);
      shareViaWhatsApp(report);
      setReportMessage('Comprehensive report shared via WhatsApp!');
    } catch (error) {
      setReportMessage('Failed to generate report. Please try again.');
    } finally {
      setIsGeneratingReport(false);
      setTimeout(() => setReportMessage(''), 3000);
    }
  };

  // Handle comprehensive report download
  const handleDownloadComprehensiveReport = async () => {
    setIsGeneratingReport(true);
    setReportMessage('');
    
    try {
      const report = generateComprehensiveReport(stats, topProducts, allProducts, trafficVisits, comprehensiveData);
      const filename = `fici-dashboard-report-${new Date().toISOString().split('T')[0]}.txt`;
      downloadAsText(report, filename);
      setReportMessage('Comprehensive report downloaded successfully!');
    } catch (error) {
      setReportMessage('Failed to download report. Please try again.');
    } finally {
      setIsGeneratingReport(false);
      setTimeout(() => setReportMessage(''), 3000);
    }
  };

  // Handle dashboard image download
  const handleDownloadDashboardImage = async () => {
    setIsGeneratingImage(true);
    setReportMessage('');
    
    try {
      // Hide the original element temporarily during capture
      const originalElement = document.getElementById('comprehensive-dashboard-content');
      if (originalElement) {
        originalElement.style.display = 'none';
      }
      
      const filename = `fici-dashboard-${new Date().toISOString().split('T')[0]}.png`;
      const result = await downloadDashboardAsImage('comprehensive-dashboard-content', filename);
      
      // Show the original element after capture
      if (originalElement) {
        originalElement.style.display = 'block';
      }
      
      if (result.success) {
        setReportMessage('Dashboard image downloaded successfully!');
      } else {
        setReportMessage('Failed to generate image. Please try again.');
      }
    } catch (error) {
      // Ensure element is restored even on error
      const originalElement = document.getElementById('comprehensive-dashboard-content');
      if (originalElement) {
        originalElement.style.display = 'block';
      }
      setReportMessage('An error occurred while generating image.');
    } finally {
      setIsGeneratingImage(false);
      setTimeout(() => setReportMessage(''), 3000);
    }
  };

  // Handle reset traffic data
  const handleResetTrafficData = async () => {
    if (!confirm('Are you sure you want to reset all traffic data? This action cannot be undone.')) {
      return;
    }

    setIsResetting(true);
    setReportMessage('');
    
    try {
      const result = await resetTrafficData();
      if (result.success) {
        setReportMessage('Traffic data reset successfully!');
        // Call the callback to refresh data instead of page reload
        if (onDataReset) {
          onDataReset();
        }
        setTimeout(() => setReportMessage(''), 3000);
      } else {
        setReportMessage('Failed to reset traffic data. Please try again.');
      }
    } catch (error) {
      setReportMessage('An error occurred while resetting data.');
    } finally {
      setIsResetting(false);
      setTimeout(() => setReportMessage(''), 3000);
    }
  };

  return (
    <>
      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleShareComprehensiveReport}
          disabled={isGeneratingReport}
          className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          title="Share complete dashboard report via WhatsApp"
        >
          <MessageCircle className="w-4 h-4" />
          <span className="hidden sm:inline">
            {isGeneratingReport ? 'Generating...' : 'Share Report'}
          </span>
        </button>
        
        <button
          onClick={handleDownloadComprehensiveReport}
          disabled={isGeneratingReport}
          className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          title="Download complete dashboard report as text"
        >
          <FileText className="w-4 h-4" />
          <span className="hidden sm:inline">
            {isGeneratingReport ? 'Generating...' : 'Download Report'}
          </span>
        </button>
        
        <button
          onClick={handleDownloadDashboardImage}
          disabled={isGeneratingImage}
          className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          title="Download dashboard as image"
        >
          <Camera className={`w-4 h-4 ${isGeneratingImage ? 'animate-pulse' : ''}`} />
          <span className="hidden sm:inline">
            {isGeneratingImage ? 'Generating...' : 'Download Image'}
          </span>
        </button>
        
        <button
          onClick={handleResetTrafficData}
          disabled={isResetting}
          className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          title="Reset traffic sources and product visit stats"
        >
          <RefreshCw className={`w-4 h-4 ${isResetting ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">
            {isResetting ? 'Resetting...' : 'Reset Traffic Data'}
          </span>
        </button>
      </div>
      
      {/* Report Message */}
      {reportMessage && (
        <div className={`mt-3 p-3 rounded-lg text-sm ${
          reportMessage.includes('success') 
            ? 'bg-green-100 text-green-800 border border-green-200' 
            : 'bg-red-100 text-red-800 border border-red-200'
        }`}>
          {reportMessage}
        </div>
      )}
    </>
  );
};

export default DashboardShareComponent;
