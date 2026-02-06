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

// Function to download dashboard as image with mobile compatibility
const downloadDashboardAsImage = async (elementId: string, filename: string) => {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error('Dashboard element not found');
    }

    // Detect if we're on a mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    
    // Wait a bit for any dynamic content to render
    await new Promise(resolve => setTimeout(resolve, isMobile ? 1000 : 500));

    // Store original styles
    const elementRef = element as HTMLElement;
    const originalStyles = {
      display: elementRef.style.display,
      visibility: elementRef.style.visibility,
      position: elementRef.style.position,
      left: elementRef.style.left,
      top: elementRef.style.top,
      zIndex: elementRef.style.zIndex,
      width: elementRef.style.width,
      transform: elementRef.style.transform,
      overflow: elementRef.style.overflow
    };
    
    // Mobile-optimized dimensions
    const captureWidth = isMobile ? 800 : 1200;
    const captureHeight = isMobile ? 1200 : 1600;
    const scale = isMobile ? 1 : 1.5;
    
    // Make element visible but positioned for capture
    elementRef.style.display = 'block';
    elementRef.style.visibility = 'visible';
    elementRef.style.position = 'absolute';
    elementRef.style.left = '-10000px';
    elementRef.style.top = '-10000px';
    elementRef.style.zIndex = '-9999';
    elementRef.style.width = `${captureWidth}px`;
    elementRef.style.minWidth = `${captureWidth}px`;
    elementRef.style.maxWidth = `${captureWidth}px`;
    elementRef.style.overflow = 'visible';
    elementRef.style.transform = 'scale(1)';

    const canvas = await html2canvas(element, {
      backgroundColor: '#ffffff',
      scale: scale,
      logging: false,
      useCORS: true,
      allowTaint: false, // Changed to false for better mobile compatibility
      width: captureWidth,
      height: captureHeight,
      scrollX: 0,
      scrollY: 0,
      windowWidth: captureWidth,
      windowHeight: captureHeight,
      removeContainer: false,
      foreignObjectRendering: false,
      imageTimeout: isMobile ? 25000 : 15000, // Longer timeout for mobile
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

        // Remove problematic styles for mobile
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
          
          // Remove any problematic filters (especially for mobile)
          computedStyle.filter = 'none';
          computedStyle.webkitFilter = 'none';
          computedStyle.backdropFilter = 'none';
          computedStyle.transform = 'none';
          computedStyle.webkitTransform = 'none';
        });

        const clonedElement = clonedDoc.getElementById(elementId);
        if (clonedElement) {
          (clonedElement as HTMLElement).style.width = `${captureWidth}px`;
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
    Object.keys(originalStyles).forEach(key => {
      (elementRef.style as any)[key] = originalStyles[key as keyof typeof originalStyles];
    });

    // Convert canvas to blob with mobile-specific handling
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (blob && blob.size > 0) {
            resolve(blob);
          } else {
            resolve(null);
          }
        },
        'image/png',
        isMobile ? 0.8 : 0.9 // Slightly lower quality for mobile to reduce size
      );
    });

    if (!blob) {
      throw new Error(isMobile ? 'Failed to generate image on mobile device' : 'Failed to generate image');
    }

    // Check blob size - mobile devices often have size limitations
    const blobSizeInMB = blob.size / (1024 * 1024);
    if (isMobile && blobSizeInMB > 5) {
      console.warn(`Image size ${blobSizeInMB.toFixed(2)}MB may be too large for mobile`);
    }

    // Mobile-specific download handling
    if (isIOS || isMobile) {
      // For iOS and mobile, try to open in new tab first
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        
        // Try to open in new tab for mobile
        const newWindow = window.open('', '_blank');
        if (newWindow) {
          newWindow.document.write(`
            <html>
              <head><title>FiCi Dashboard - ${filename}</title></head>
              <body style="margin:0;padding:20px;text-align:center;background:#f5f5f5;">
                <h2>FiCi Dashboard Image</h2>
                <p>Tap and hold the image below to save to your device:</p>
                <img src="${dataUrl}" style="max-width:100%;height:auto;border:1px solid #ddd;" />
                <p style="margin-top:20px;color:#666;">Filename: ${filename}</p>
                <p style="color:#666;">Size: ${(blobSizeInMB).toFixed(2)}MB</p>
              </body>
            </html>
          `);
          newWindow.document.close();
        } else {
          // Fallback to direct download
          downloadBlobDirectly(blob, filename);
        }
      };
      reader.readAsDataURL(blob);
    } else {
      // Desktop download
      downloadBlobDirectly(blob, filename);
    }

    return { success: true, blobSize: blobSizeInMB };
  } catch (error) {
    console.error('Error generating image:', error);
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      isMobile,
      userAgent: navigator.userAgent
    };
  }
};

// Helper function for direct blob download
const downloadBlobDirectly = (blob: Blob, filename: string) => {
  try {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    // Clean up the URL after a delay
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
    }, 1000);
  } catch (error) {
    console.error('Direct download failed:', error);
    throw error;
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

  // Handle dashboard image download with enhanced mobile support
  const handleDownloadDashboardImage = async () => {
    setIsGeneratingImage(true);
    setReportMessage('');
    
    try {
      // Check if we're on mobile and show appropriate message
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      
      if (isMobile) {
        setReportMessage('Preparing image for mobile device...');
      }
      
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
        if (isIOS || isMobile) {
          setReportMessage('Image opened in new tab! Tap and hold the image to save it to your device.');
        } else {
          const sizeInfo = result.blobSize ? ` (${result.blobSize.toFixed(1)}MB)` : '';
          setReportMessage(`Dashboard image downloaded successfully${sizeInfo}!`);
        }
      } else {
        // Provide more detailed error messages for mobile
        let errorMessage = 'Failed to generate image. ';
        
        if (result.isMobile) {
          if (result.error?.includes('memory') || result.error?.includes('size') || result.error?.includes('Maximum call stack')) {
            errorMessage += 'Mobile device memory limit reached. Try reducing dashboard content.';
          } else if (result.error?.includes('permission') || result.error?.includes('download') || result.error?.includes('security')) {
            errorMessage += 'Download permission denied. Check browser settings.';
          } else if (result.error?.includes('capture') || result.error?.includes('canvas') || result.error?.includes('html2canvas')) {
            errorMessage += 'Screen capture failed on mobile. Trying alternative method...';
            // Try a simpler capture method for mobile
            setTimeout(() => {
              handleMobileFallbackImage(filename);
            }, 1000);
            return; // Don't set the error message yet, try fallback first
          } else if (result.error?.includes('timeout') || result.error?.includes('time')) {
            errorMessage += 'Mobile device timeout. Try again with better connection.';
          } else if (result.error?.includes('network') || result.error?.includes('connection')) {
            errorMessage += 'Network issue on mobile. Check connection and retry.';
          } else if (result.error?.includes('blob') || result.error?.includes('createObjectURL')) {
            errorMessage += 'Mobile browser limitation. Opening image in new tab...';
            // Try to open the image directly
            setTimeout(() => {
              handleMobileImagePreview();
            }, 1000);
            return; // Don't set the error message yet, try fallback first
          } else {
            // For unknown errors, try a simplified approach first
            errorMessage += 'Trying simplified mobile capture...';
            setTimeout(() => {
              handleSimplifiedMobileCapture();
            }, 1000);
            return; // Don't set the error message yet, try fallback first
          }
        } else {
          errorMessage += 'Please try again.';
        }
        
        setReportMessage(errorMessage);
        
        // Log detailed error for debugging
        console.error('Image generation failed:', {
          error: result.error,
          isMobile: result.isMobile,
          userAgent: result.userAgent,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      // Ensure element is restored even on error
      const originalElement = document.getElementById('comprehensive-dashboard-content');
      if (originalElement) {
        originalElement.style.display = 'block';
      }
      
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      let errorMessage = 'An error occurred while generating image.';
      
      if (isMobile) {
        errorMessage += ' This may be due to mobile device limitations.';
      }
      
      setReportMessage(errorMessage);
      
      console.error('Unexpected error during image generation:', {
        error,
        isMobile,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsGeneratingImage(false);
      // Keep message longer for mobile users to read instructions
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const messageDuration = isMobile ? 5000 : 3000;
      setTimeout(() => setReportMessage(''), messageDuration);
    }
  };

  // Fallback methods for mobile compatibility
  const handleMobileFallbackImage = async (filename: string) => {
    setReportMessage('Trying simplified mobile capture...');
    try {
      // Try with even smaller dimensions and no scaling
      const result = await downloadDashboardAsImageSimple('comprehensive-dashboard-content', filename);
      if (result.success) {
        setReportMessage('Image captured with simplified method! Check new tab.');
      } else {
        setReportMessage('Simplified capture failed. Please try on desktop for best results.');
      }
    } catch (error) {
      console.error('Fallback failed:', error);
      setReportMessage('All mobile capture methods failed. Desktop recommended.');
    }
  };

  const handleMobileImagePreview = () => {
    setReportMessage('Opening dashboard in new window for manual screenshot...');
    const element = document.getElementById('comprehensive-dashboard-content');
    if (element) {
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(`
          <html>
            <head>
              <title>FiCi Dashboard - Screenshot</title>
              <style>
                body { margin: 0; padding: 20px; background: #f5f5f5; font-family: Arial, sans-serif; }
                .instructions { text-align: center; margin-bottom: 20px; color: #666; }
                .dashboard-content { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
              </style>
            </head>
            <body>
              <div class="instructions">
                <h2>FiCi Dashboard</h2>
                <p>Take a screenshot of this dashboard to save it:</p>
                <p><strong>Mobile: Use your device's screenshot function</strong></p>
              </div>
              <div class="dashboard-content">
                ${element.innerHTML}
              </div>
            </body>
          </html>
        `);
        newWindow.document.close();
      }
    }
  };

  const handleSimplifiedMobileCapture = async () => {
    setReportMessage('Attempting ultra-simplified capture...');
    try {
      // Try the most basic capture possible
      const element = document.getElementById('comprehensive-dashboard-content');
      if (!element) {
        throw new Error('Element not found');
      }

      // Use very basic html2canvas settings
      const canvas = await html2canvas(element, {
        backgroundColor: '#ffffff',
        scale: 0.5, // Very low scale
        width: 600,
        height: 800,
        logging: false,
        useCORS: false,
        allowTaint: false,
        removeContainer: true
      });

      // Convert to blob and try to open in new tab
      canvas.toBlob((blob) => {
        if (blob) {
          const reader = new FileReader();
          reader.onload = () => {
            const dataUrl = reader.result as string;
            const newWindow = window.open('', '_blank');
            if (newWindow) {
              newWindow.document.write(`
                <html>
                  <head><title>FiCi Dashboard - Simplified</title></head>
                  <body style="margin:0;padding:20px;text-align:center;background:#f5f5f5;">
                    <h2>FiCi Dashboard - Simplified Capture</h2>
                    <p>Tap and hold to save:</p>
                    <img src="${dataUrl}" style="max-width:100%;height:auto;border:1px solid #ddd;" />
                  </body>
                </html>
              `);
              newWindow.document.close();
              setReportMessage('Simplified image ready! Save from new tab.');
            } else {
              setReportMessage('Could not open new tab. Please try on desktop.');
            }
          };
          reader.readAsDataURL(blob);
        }
      }, 'image/png', 0.7);
    } catch (error) {
      console.error('Simplified capture failed:', error);
      setReportMessage('All capture methods failed. Desktop recommended for best results.');
    }
  };

  // Simplified download function for fallback
  const downloadDashboardAsImageSimple = async (elementId: string, filename: string) => {
    try {
      const element = document.getElementById(elementId);
      if (!element) {
        throw new Error('Dashboard element not found');
      }

      // Very basic capture with minimal settings
      const canvas = await html2canvas(element, {
        backgroundColor: '#ffffff',
        scale: 0.8,
        width: 600,
        height: 900,
        logging: false,
        useCORS: false,
        allowTaint: false,
        removeContainer: true
      });

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, 'image/png', 0.8);
      });

      if (!blob) {
        throw new Error('Failed to create blob');
      }

      // Try to open in new tab for mobile
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const newWindow = window.open('', '_blank');
        if (newWindow) {
          newWindow.document.write(`
            <html>
              <head><title>FiCi Dashboard - ${filename}</title></head>
              <body style="margin:0;padding:20px;text-align:center;background:#f5f5f5;">
                <h2>FiCi Dashboard Image</h2>
                <p>Tap and hold the image below to save it to your device:</p>
                <img src="${dataUrl}" style="max-width:100%;height:auto;border:1px solid #ddd;" />
                <p style="margin-top:20px;color:#666;">Filename: ${filename}</p>
              </body>
            </html>
          `);
          newWindow.document.close();
        }
      };
      reader.readAsDataURL(blob);

      return { success: true };
    } catch (error) {
      console.error('Simple capture failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
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
