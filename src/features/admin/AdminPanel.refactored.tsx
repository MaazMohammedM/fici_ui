import React, { useEffect, useState, lazy, Suspense } from "react";
import { BarChart3, List, Plus, Package, Percent } from "lucide-react";
import { supabase } from "@lib/supabase";
import { useAdminStore } from "./store/adminStore";
import ScrollToTop from "@components/ScrollToTop";
import { getThumbnailUrl } from "@lib/utils/imageOptimization";

const DashboardStats = lazy(() => import("./components/DashboardStats"));
const TopProductsChart = lazy(() => import("./components/TopProductsChart"));
const ProductVisitsTable = lazy(() => import("./components/ProductVisitsTable"));
const TrafficSourcesWidget = lazy(() => import("./components/TrafficSourcesWidget"));
const DiscountFormSection = lazy(() => import("./components/DiscountFormSection"));
const DashboardShareComponent = lazy(() => import("./components/DashboardShareComponent"));
const ProductForm = lazy(() => import("./components/ProductForm"));
const ProductList = lazy(() => import("./components/ProductList"));
const AdminOrderDashboard = lazy(() => import("./components/AdminOrderDashboard"));

const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"dashboard" | "list" | "add" | "orders" | "discounts">(
    "dashboard"
  );

  // State for comprehensive data sharing
  const [comprehensiveData, setComprehensiveData] = useState<any>(null);

  // Function to refresh comprehensive data after reset
  const refreshComprehensiveData = async () => {
    try {
      // Fetch traffic sources
      const { data: trafficData } = await supabase
        .from('traffic_sources')
        .select('source, medium, campaign, visit_count, last_visited_at')
        .order('visit_count', { ascending: false })
        .limit(20);

      // Fetch product visit stats (real data)
      const { data: productVisitData } = await supabase
        .from('product_visit_stats')
        .select('product_id, name, thumbnail_url, visit_count, last_visited_at')
        .order('visit_count', { ascending: false })
        .limit(20);

      // Fetch order stats (simplified to avoid 400 error)
      const { data: orderData } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      // Update traffic visits
      const { data: trafficVisitsData } = await supabase
        .from("traffic_sources")
        .select("visit_count");
      if (trafficVisitsData) {
        const total = trafficVisitsData.reduce((sum: number, row: any) => sum + (row.visit_count || 0), 0);
        setTrafficVisits(total);
      }

      setComprehensiveData({
        trafficSources: trafficData || [],
        productVisits: productVisitData || [], // Use real product visit stats data
        recentOrders: orderData || []
      });

      // Also update productVisitsData for the table with real data
      setProductVisitsData(productVisitData || []);
      
      // Also update topProducts for the chart with real data
      setTopProducts(productVisitData || []);
    } catch (error) {
      console.error('Error refreshing comprehensive data:', error);
    }
  };

  const { fetchProducts } = useAdminStore();
  const {
    products: allProducts,
    loading,
    currentPage,
    totalPages,
  } = useAdminStore();

  // Fetch real stats data from database
  const [stats, setStats] = useState({
    totalVisits: 0,
    totalOrders: 0,
    totalUsers: 0,
    conversionRate: 0,
    totalRevenue: 0,
    pendingOrders: 0
  });

  // Mock topProducts for now (since we don't have it in adminStore)
  const [topProducts, setTopProducts] = useState([]);

  // Mock product visits data with proper structure
  const [productVisitsData, setProductVisitsData] = useState([]);

  const [trafficVisits, setTrafficVisits] = useState<number>(0);

  // Mock functions for pagination and search
  const handlePageChange = (page: number) => {
    window.scrollTo(0, 0);
    // Implementation would go here
  };

  const handleSearch = (term: string) => {
    // Implementation would go here
  };

  // Function to fetch real stats data
  const fetchStatsData = async () => {
    try {
      // Fetch total product visits from product_visit_stats
      // This represents the total number of individual product visits
      const { data: productVisitData } = await supabase
        .from("product_visit_stats")
        .select("visit_count");
      
      // Fetch total orders
      const { data: ordersData } = await supabase
        .from("orders")
        .select("*");
      
      // Fetch total users (you might need to adjust this based on your user table)
      const { data: usersData } = await supabase
        .from("user_profiles")
        .select("*");
      
      // Calculate stats
      const totalVisits = productVisitData?.reduce((sum: number, row: any) => sum + Number(row.visit_count || 0), 0) || 0;
      
      // Filter out Razorpay orders with pending payment (incomplete transactions)
      const validOrders = ordersData?.filter((order: any) => 
        !(order.payment_method === 'razorpay' && order.payment_status === 'pending')
      ) || [];
      
      const totalOrders = validOrders.length;
      const totalUsers = usersData?.length || 0;
      const totalRevenue = validOrders.reduce((sum: number, order: any) => sum + (order.effective_amount || order.total_amount || 0), 0) || 0;
      const pendingOrders = validOrders.filter((order: any) => 
        order.payment_status === 'paid' && order.status !== 'shipped' && order.status !== 'delivered'
      ).length || 0;
      const conversionRate = totalVisits > 0 ? ((totalOrders / totalVisits) * 100) : 0;

      setStats({
        totalVisits,
        totalOrders,
        totalUsers,
        conversionRate,
        totalRevenue,
        pendingOrders
      });
    } catch (error) {
      console.error('Error fetching stats data:', error);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchStatsData(); // Fetch real stats data
  }, [fetchProducts]);

  useEffect(() => {
    const loadTrafficVisits = async () => {
      const { data, error } = await supabase
        .from("traffic_sources")
        .select("visit_count");
      if (!error && data) {
        const total = data.reduce((sum: number, row: any) => sum + (row.visit_count || 0), 0);
        setTrafficVisits(total);
      }
    };

    const loadProductVisits = async () => {
      const { data, error } = await supabase
        .from('product_visit_stats')
        .select('product_id, name, thumbnail_url, visit_count, last_visited_at')
        .order('last_visited_at', { ascending: false })
        .limit(20);
      
      if (!error && data) {
        setProductVisitsData(data);
      }
    };

    const loadTopProducts = async () => {
      const { data, error } = await supabase
        .from('product_visit_stats')
        .select('product_id, name, thumbnail_url, visit_count, last_visited_at')
        .order('visit_count', { ascending: false })
        .limit(10);
      
      if (!error && data) {
        setTopProducts(data);
      }
    };

    loadTrafficVisits();
    loadProductVisits();
    loadTopProducts();
  }, []);

  // Load comprehensive data for image generation
  useEffect(() => {
    const loadComprehensiveData = async () => {
      try {
        // Fetch traffic sources
        const { data: trafficData } = await supabase
          .from('traffic_sources')
          .select('source, medium, campaign, visit_count, last_visited_at')
          .order('visit_count', { ascending: false })
          .limit(20);

        // Fetch product visit stats
        const { data: productData } = await supabase
          .from('product_visit_stats')
          .select('product_id, name, thumbnail_url, visit_count, last_visited_at')
          .order('visit_count', { ascending: false })
          .limit(20);

        // Fetch order stats (simplified to avoid 400 error)
        const { data: orderData } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);

        setComprehensiveData({
          trafficSources: trafficData || [],
          productVisits: productData || [],
          recentOrders: orderData || []
        });
      } catch (error) {
        console.error('Error loading comprehensive data:', error);
      }
    };
    
    if (activeTab === 'dashboard') {
      loadComprehensiveData();
    }
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Admin Panel
            </h1>
            
            {/* Share Actions */}
            {activeTab === 'dashboard' && (
              <DashboardShareComponent
                stats={stats}
                topProducts={topProducts}
                allProducts={allProducts}
                trafficVisits={trafficVisits}
                comprehensiveData={comprehensiveData}
                onDataReset={refreshComprehensiveData}
              />
            )}
          </div>
        </div>

        {/* Navigation Tabs - Mobile Responsive */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-wrap gap-2 sm:gap-4 justify-center sm:justify-start overflow-x-auto pb-2 sm:pb-0">
            <button
              onClick={() => {
                setActiveTab("dashboard");
                window.scrollTo(0, 0);
              }}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-3 rounded-xl shadow transition whitespace-nowrap flex-shrink-0 ${
                activeTab === "dashboard"
                  ? "bg-blue-600 text-white"
                  : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </button>
            <button
              onClick={() => {
                setActiveTab("list");
                window.scrollTo(0, 0);
              }}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-3 rounded-xl shadow transition whitespace-nowrap flex-shrink-0 ${
                activeTab === "list"
                  ? "bg-blue-600 text-white"
                  : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">Product List</span>
            </button>
            <button
              onClick={() => {
                setActiveTab("add");
                window.scrollTo(0, 0);
              }}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-3 rounded-xl shadow transition whitespace-nowrap flex-shrink-0 ${
                activeTab === "add"
                  ? "bg-blue-600 text-white"
                  : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Product</span>
            </button>
            <button
              onClick={() => {
                setActiveTab("orders");
                window.scrollTo(0, 0);
              }}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-3 rounded-xl shadow transition whitespace-nowrap flex-shrink-0 ${
                activeTab === "orders"
                  ? "bg-blue-600 text-white"
                  : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              <Package className="w-4 h-4" />
              <span className="hidden sm:inline">Orders</span>
            </button>
            <button
              onClick={() => {
                setActiveTab("discounts");
                window.scrollTo(0, 0);
              }}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-3 rounded-xl shadow transition whitespace-nowrap flex-shrink-0 ${
                activeTab === "discounts"
                  ? "bg-blue-600 text-white"
                  : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              <Percent className="w-4 h-4" />
              <span className="hidden sm:inline">Discounts</span>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "dashboard" && (
          <div>
            {/* Comprehensive Dashboard Content for Image Generation - Hidden */}
            <div id="comprehensive-dashboard-content" className="bg-white p-6 rounded-lg shadow-lg mb-8" style={{ position: 'absolute', left: '-9999px', top: '-9999px', width: '1200px', minHeight: '800px' }}>
              {/* Header */}
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">FiCi Shoes - Complete Dashboard</h2>
                <p className="text-gray-600">{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>

              {/* Two Column Layout */}
              <div className="grid grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-6">
                  {/* Key Metrics */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">🔥 Key Metrics</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-blue-50 p-3 rounded text-center border border-blue-200">
                        <div className="text-xl font-bold text-blue-600">{(stats.totalVisits || 0).toLocaleString()}</div>
                        <div className="text-xs text-gray-600">Total Visits</div>
                      </div>
                      <div className="bg-indigo-50 p-3 rounded text-center border border-indigo-200">
                        <div className="text-xl font-bold text-indigo-600">{trafficVisits.toLocaleString()}</div>
                        <div className="text-xs text-gray-600">Traffic Visits</div>
                      </div>
                      <div className="bg-green-50 p-3 rounded text-center border border-green-200">
                        <div className="text-xl font-bold text-green-600">{(stats.totalOrders || 0).toLocaleString()}</div>
                        <div className="text-xs text-gray-600">Total Orders</div>
                      </div>
                      <div className="bg-purple-50 p-3 rounded text-center border border-purple-200">
                        <div className="text-xl font-bold text-purple-600">{(stats.totalUsers || 0).toLocaleString()}</div>
                        <div className="text-xs text-gray-600">Total Users</div>
                      </div>
                      <div className="bg-emerald-50 p-3 rounded text-center border border-emerald-200">
                        <div className="text-xl font-bold text-emerald-600">₹{(stats.totalRevenue || 0).toLocaleString('en-IN')}</div>
                        <div className="text-xs text-gray-600">Total Revenue</div>
                      </div>
                      <div className="bg-orange-50 p-3 rounded text-center border border-orange-200">
                        <div className="text-xl font-bold text-orange-600">{(stats.conversionRate || 0).toFixed(2)}%</div>
                        <div className="text-xs text-gray-600">Conversion Rate</div>
                      </div>
                      <div className="bg-yellow-50 p-3 rounded text-center border border-yellow-200">
                        <div className="text-xl font-bold text-yellow-600">{(stats.pendingOrders || 0).toLocaleString()}</div>
                        <div className="text-xs text-gray-600">Pending Orders</div>
                      </div>
                    </div>
                  </div>

                  {/* Top Products */}
                  {topProducts && topProducts.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">🏆 Top Products</h3>
                      <div className="space-y-2 max-h-80 overflow-y-auto">
                        {topProducts.slice(0, 10).map((product: any, index: number) => (
                          <div key={index} className="flex justify-between items-center bg-gray-50 p-2 rounded border border-gray-200">
                            <span className="text-sm text-gray-700 truncate flex-1 mr-2">
                              {index + 1}. {product.name || 'Unknown Product'}
                            </span>
                            <div className="flex gap-4 text-sm">
                              <span className="text-gray-600">{product.visit_count || 0} visits</span>
                              <span className="font-semibold text-gray-900">₹{(product.revenue || 0).toLocaleString('en-IN')}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recent Orders */}
                  {comprehensiveData?.recentOrders && comprehensiveData.recentOrders.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">📋 Recent Orders</h3>
                      <div className="space-y-2 max-h-80 overflow-y-auto">
                        {comprehensiveData.recentOrders.slice(0, 10).map((order: any, index: number) => (
                          <div key={`${order.id || index}-${order.created_at}`} className="bg-gray-50 p-2 rounded border border-gray-200">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-700">
                                {index + 1}. Order #{order.id ? order.id.slice(0, 8) : 'N/A'}
                              </span>
                              <span className="text-sm font-semibold text-gray-900">
                                ₹{(order.effective_amount || order.total_amount || 0).toLocaleString('en-IN')}
                              </span>
                            </div>
                            <div className="flex gap-4 text-xs text-gray-600 mt-1">
                              <span>📦 {order.status || 'N/A'}</span>
                              <span>💳 {order.payment_status || 'N/A'}</span>
                              <span>📅 {order.created_at ? new Date(order.created_at).toLocaleDateString('en-IN') : 'N/A'}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  {/* Traffic Sources */}
                  {comprehensiveData?.trafficSources && comprehensiveData.trafficSources.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">🌐 Traffic Sources</h3>
                      <div className="space-y-2 max-h-80 overflow-y-auto">
                        {comprehensiveData.trafficSources.slice(0, 10).map((source: any, index: number) => (
                          <div key={`${source.id || index}-${source.visit_count}`} className="flex justify-between items-center bg-gray-50 p-2 rounded border border-gray-200">
                            <span className="text-sm text-gray-700">
                              {index + 1}. {source.source || 'Direct'} {source.medium ? `(${source.medium})` : ''}
                            </span>
                            <span className="text-sm font-semibold text-gray-900">{source.visit_count || 0} visits</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Product Visits Detailed */}
                  {comprehensiveData?.productVisits && comprehensiveData.productVisits.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">�️ Product Visits (Detailed)</h3>
                      <div className="space-y-2 max-h-80 overflow-y-auto">
                        {comprehensiveData.productVisits.slice(0, 15).map((product: any, index: number) => (
                          <div key={`${product.product_id || index}-${product.visit_count}`} className="flex justify-between items-center bg-gray-50 p-2 rounded border border-gray-200">
                            <span className="text-sm text-gray-700 truncate flex-1 mr-2">
                              {index + 1}. {product.name || 'Unknown Product'}
                            </span>
                            <div className="flex gap-4 text-sm">
                              <span className="text-gray-600">{product.visit_count || 0} visits</span>
                              <span className="text-xs text-gray-500">
                                {product.last_visited_at ? new Date(product.last_visited_at).toLocaleDateString('en-IN') : 'N/A'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Summary Statistics */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">📈 Summary Statistics</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gray-50 p-3 rounded border border-gray-200 text-center">
                        <div className="text-lg font-bold text-gray-800">{comprehensiveData?.trafficSources?.length || 0}</div>
                        <div className="text-xs text-gray-600">Traffic Sources</div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded border border-gray-200 text-center">
                        <div className="text-lg font-bold text-gray-800">
                          {comprehensiveData?.productVisits?.reduce((sum: number, p: any) => sum + (p.visit_count || 0), 0).toLocaleString() || 0}
                        </div>
                        <div className="text-xs text-gray-600">Total Product Visits</div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded border border-gray-200 text-center">
                        <div className="text-lg font-bold text-gray-800">{comprehensiveData?.productVisits?.length || 0}</div>
                        <div className="text-xs text-gray-600">Products Tracked</div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded border border-gray-200 text-center">
                        <div className="text-lg font-bold text-gray-800">{comprehensiveData?.recentOrders?.length || 0}</div>
                        <div className="text-xs text-gray-600">Recent Orders</div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded border border-gray-200 text-center">
                        <div className="text-lg font-bold text-gray-800">
                          ₹{comprehensiveData?.recentOrders?.reduce((sum: number, o: any) => sum + (o.effective_amount || o.total_amount || 0), 0).toLocaleString('en-IN') || 0}
                        </div>
                        <div className="text-xs text-gray-600">Recent Revenue</div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded border border-gray-200 text-center">
                        <div className="text-lg font-bold text-gray-800">
                          {allProducts?.length || 0}
                        </div>
                        <div className="text-xs text-gray-600">Total Products</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center pt-4 border-t border-gray-200 mt-6">
                <p className="text-xs text-gray-500">
                  📱 FiCi Shoes - Premium Leather Footwear | 📊 Generated on {new Date().toLocaleString('en-IN')}
                </p>
              </div>
            </div>

            {/* Regular Dashboard Components */}
            {/* Stats */}
            <Suspense fallback={<div className="p-8 text-center">Loading dashboard stats...</div>}>
              <DashboardStats
                totalVisits={stats.totalVisits}
                totalOrders={stats.totalOrders}
                totalUsers={stats.totalUsers}
                conversionRate={stats.conversionRate}
                totalRevenue={stats.totalRevenue}
                pendingOrders={stats.pendingOrders}
                trafficVisits={trafficVisits}
              />
            </Suspense>

            {/* Charts - Mobile Responsive */}
            <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:gap-8 mb-6 sm:mb-8">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
                <Suspense fallback={<div className="p-8 text-center">Loading top products...</div>}>
                  <TopProductsChart products={topProducts} loading={loading} />
                </Suspense>
                <Suspense fallback={<div className="p-8 text-center">Loading traffic sources...</div>}>
                  <TrafficSourcesWidget />
                </Suspense>
              </div>
            </div>

            {/* Product Visits Table */}
            <Suspense fallback={<div className="p-8 text-center">Loading product visits...</div>}>
              <ProductVisitsTable
                products={productVisitsData}
                loading={loading}
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                onSearch={handleSearch}
              />
            </Suspense>
          </div>
        )}

        {activeTab === "list" && (
          <Suspense fallback={<div className="p-8 text-center">Loading product list...</div>}>
            <ProductList />
          </Suspense>
        )}
        
        {activeTab === "add" && (
          <Suspense fallback={<div className="p-8 text-center">Loading product form...</div>}>
            <ProductForm onCancel={() => {
              setActiveTab("list");
              window.scrollTo(0, 0);
            }} onSuccess={() => {
              setActiveTab("list");
              fetchProducts();
              window.scrollTo(0, 0);
            }} />
          </Suspense>
        )}
        
        {activeTab === "orders" && (
          <Suspense fallback={<div className="p-8 text-center">Loading orders...</div>}>
            <AdminOrderDashboard />
          </Suspense>
        )}
        
        {activeTab === "discounts" && (
          <Suspense fallback={<div className="p-8 text-center">Loading discounts...</div>}>
            <DiscountFormSection allProducts={allProducts} />
          </Suspense>
        )}
      </div>
    </div>
  );
};

export default AdminPage;