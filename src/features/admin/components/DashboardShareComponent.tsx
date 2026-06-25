import React, { useState } from 'react';
import { Download, Mail, FileText, Image, Loader2, CheckCircle, AlertCircle, RefreshCw, MessageCircle } from 'lucide-react';
import { useImageDownloader } from '../../../hooks/useImageDownloader';
import { supabase } from '../../../lib/supabase';

interface DashboardShareComponentProps {
  stats: any;
  topProducts: any;
  allProducts: any;
  trafficVisits: number;
  comprehensiveData?: any;
  onDataReset?: () => void; // Callback to refresh data after reset
}

// Function to generate comprehensive text report
const generateComprehensiveReport = (
  stats: any,
  topProducts: any,
  allProducts: any,
  trafficVisits: number,
  comprehensiveData?: any
): string => {
  const report = `
📊 *FiCi Shoes - Complete Dashboard Report*
📅 ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}

🔥 *KEY METRICS*
👁️ Total Visits: ${(stats.totalVisits || 0).toLocaleString()}
🌐 Traffic Visits: ${trafficVisits.toLocaleString()}
🛒 Total Orders: ${(stats.totalOrders || 0).toLocaleString()}
👥 Total Users: ${(stats.totalUsers || 0).toLocaleString()}
💰 Total Revenue: ₹${(stats.totalRevenue || 0).toLocaleString('en-IN')}
📈 Conversion Rate: ${(stats.conversionRate || 0).toFixed(2)}%
📦 Pending Orders: ${(stats.pendingOrders || 0).toLocaleString()}

🏆 *TOP PRODUCTS*
${topProducts?.slice(0, 10).map((product: any, index: number) => {
  const productRevenue = comprehensiveData?.recentOrders
    ?.filter((order: any) => order.payment_status === 'paid')
    ?.reduce((sum: number, order: any) => sum + (order.effective_amount || order.total_amount || 0), 0) || 0;
  return `${index + 1}. ${product.name || 'Unknown Product'} | 📊 ${product.visit_count || 0} visits | 💰 ₹${productRevenue.toLocaleString('en-IN')}`;
}).join('\n')}

🌐 *TRAFFIC SOURCES*
${comprehensiveData?.trafficSources?.slice(0, 10).map((source: any, index: number) => 
  `${index + 1}. ${source.source || 'Direct'} ${source.medium ? `(${source.medium})` : ''} ${source.campaign ? `[${source.campaign}]` : ''}: ${source.visit_count || 0} visits`
).join('\n')}

�️ *PRODUCT VISITS DETAILED*
${comprehensiveData?.productVisits?.slice(0, 15).map((product: any, index: number) => {
  const productRevenue = comprehensiveData?.recentOrders
    ?.filter((order: any) => order.payment_status === 'paid')
    ?.reduce((sum: number, order: any) => sum + (order.effective_amount || order.total_amount || 0), 0) || 0;
  return `${index + 1}. ${product.name || 'Unknown Product'} | 📊 ${product.visit_count || 0} visits | 💰 ₹${productRevenue.toLocaleString('en-IN')} | 📅 ${product.created_at ? new Date(product.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}`;
}).join('\n')}

�📋 *RECENT ORDERS*
${comprehensiveData?.recentOrders?.slice(0, 10).map((order: any, index: number) => 
  `${index + 1}. Order #${order.id ? order.id.slice(0, 8) : 'N/A'} | 💰 ₹${(order.effective_amount || order.total_amount || 0).toLocaleString('en-IN')} | 📦 ${order.status || 'N/A'} | 💳 ${order.payment_status || 'N/A'} | 📅 ${order.created_at ? new Date(order.created_at).toLocaleDateString('en-IN') : 'N/A'}`
).join('\n')}

📈 *SUMMARY STATISTICS*
🌐 Total Traffic Sources: ${comprehensiveData?.trafficSources?.length || 0}
👥 Total Product Visits: ${comprehensiveData?.productVisits?.reduce((sum: number, p: any) => sum + (p.visit_count || 0), 0).toLocaleString() || 0}
📊 Products Tracked: ${comprehensiveData?.productVisits?.length || 0}
📋 Recent Orders: ${comprehensiveData?.recentOrders?.length || 0}
💳 Paid Orders: ${comprehensiveData?.recentOrders?.filter((order: any) => order.payment_status === 'paid').length || 0}
💰 Total Revenue: ₹${comprehensiveData?.recentOrders?.filter((order: any) => order.payment_status === 'paid')
  ?.reduce((sum: number, o: any) => sum + (o.effective_amount || o.total_amount || 0), 0).toLocaleString('en-IN') || 0}

🔗 [View Dashboard](https://www.ficishoes.com/admin)
📱 FiCi Shoes - Premium Leather Footwear
📊 Report generated on ${new Date().toLocaleString('en-IN')}
  `.trim();

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

// Function to reset traffic data
const resetTrafficData = async () => {
  try {
    // Reset traffic sources
    const { error: trafficError } = await supabase
      .from('traffic_sources')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Keep one dummy row

    if (trafficError) throw trafficError;

    // Reset product visits
    const { error: visitsError } = await supabase
      .from('product_visits')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Keep one dummy row

    if (visitsError) throw visitsError;

    return { success: true };
  } catch (error) {
    console.error('Error resetting traffic data:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to reset traffic data' 
    };
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
  // Use the new image downloader hook
  const { downloadImage, isDownloading, progress, error, result } = useImageDownloader();

  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [reportMessage, setReportMessage] = useState('');

  // Handle comprehensive report sharing
  const handleShareComprehensiveReport = async () => {
    setIsGeneratingReport(true);
    setReportMessage('');
    
    try {
      const report = generateComprehensiveReport(stats, topProducts, allProducts, trafficVisits, comprehensiveData);
      shareViaWhatsApp(report);
      setReportMessage('Report shared via WhatsApp successfully!');
    } catch (error) {
      setReportMessage('Failed to share report. Please try again.');
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

  // Handle dashboard image download using the new hook
  const handleDownloadDashboardImage = async () => {
    try {
      const filename = `fici-dashboard-${new Date().toISOString().split('T')[0]}.png`;
      const downloadResult = await downloadImage('comprehensive-dashboard-content', filename);
      
      if (downloadResult.success) {
        setReportMessage(`Dashboard image downloaded successfully! Size: ${(downloadResult.blobSize || 0).toFixed(2)}MB`);
      } else {
        setReportMessage(`Failed to download image: ${downloadResult.error}`);
      }
    } catch (err) {
      setReportMessage('Failed to download dashboard image');
      console.error('Download error:', err);
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
      const resetResult = await resetTrafficData();
      if (resetResult.success) {
        setReportMessage('Traffic data reset successfully!');
        // Call the callback to refresh data instead of page reload
        if (onDataReset) {
          onDataReset();
        }
      } else {
        setReportMessage(`Failed to reset traffic data: ${resetResult.error}`);
      }
    } catch (error) {
      setReportMessage('Failed to reset traffic data. Please try again.');
    } finally {
      setIsResetting(false);
      setTimeout(() => setReportMessage(''), 3000);
    }
  };

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        {/* All Buttons Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
          <button
            onClick={handleShareComprehensiveReport}
            disabled={isGeneratingReport}
            className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 px-2 py-2 sm:px-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
          >
            <Mail className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            <span className="hidden sm:inline">
              {isGeneratingReport ? 'Generating...' : 'Share Report'}
            </span>
            <span className="sm:hidden text-xs">
              Share
            </span>
          </button>
          
          <button
            onClick={handleDownloadComprehensiveReport}
            disabled={isGeneratingReport}
            className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 px-2 py-2 sm:px-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
          >
            <FileText className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            <span className="hidden sm:inline">
              {isGeneratingReport ? 'Generating...' : 'Download Report'}
            </span>
            <span className="sm:hidden text-xs">
              Report
            </span>
          </button>
          
          <button
            onClick={handleDownloadDashboardImage}
            disabled={isDownloading}
            className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 px-2 py-2 sm:px-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
          >
            {isDownloading ? (
              <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 animate-spin" />
            ) : (
              <Image className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            )}
            <span className="hidden sm:inline">
              {isDownloading ? 'Generating...' : 'Download Image'}
            </span>
            <span className="sm:hidden text-xs">
              {isDownloading ? 'Loading...' : 'Image'}
            </span>
          </button>
          
          <button
            onClick={handleResetTrafficData}
            disabled={isResetting}
            className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 px-2 py-2 sm:px-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
          >
            {isResetting ? (
              <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            )}
            <span className="hidden sm:inline">
              {isResetting ? 'Resetting...' : 'Reset Traffic Data'}
            </span>
            <span className="sm:hidden text-xs">
              {isResetting ? 'Reset...' : 'Reset'}
            </span>
          </button>
        </div>
        
        {/* Report Message */}
        {(isGeneratingReport || isDownloading || isResetting || reportMessage || progress) && (
          <div className={`mt-3 p-3 rounded-lg text-sm ${
            reportMessage?.includes('success') 
              ? 'bg-green-100 text-green-800 border border-green-200' 
              : reportMessage?.includes('Failed') || error
              ? 'bg-red-100 text-red-800 border border-red-200'
              : 'bg-blue-100 text-blue-800 border border-blue-200'
          }`}>
            <div className="flex items-center gap-2">
              {(isGeneratingReport || isDownloading || isResetting) ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : reportMessage?.includes('success') ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
              <span>
                {isGeneratingReport && 'Generating report...'}
                {isDownloading && progress}
                {isResetting && 'Resetting traffic data...'}
                {error && error}
                {!isGeneratingReport && !isDownloading && !isResetting && !error && reportMessage}
              </span>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default DashboardShareComponent;
