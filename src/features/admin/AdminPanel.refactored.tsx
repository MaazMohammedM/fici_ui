import React, { useEffect, useState, lazy, Suspense } from "react";

import { BarChart3, List, Plus, Package, Percent } from "lucide-react";

import { db, collection, getDocs, query, where, orderBy, limit, doc, getDoc } from "@lib/firebase";

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

      const trafficQuery = query(

        collection(db, 'traffic_sources'),

        orderBy('visit_count', 'desc'),

        limit(20)

      );

      const trafficSnapshot = await getDocs(trafficQuery);

      const trafficData = trafficSnapshot.docs.map(doc => ({ 

        id: doc.id, 

        ...doc.data() 

      }));



      // Fetch product visit stats (real data)

      const productVisitsQuery = query(

        collection(db, 'product_visit_stats'),

        orderBy('visit_count', 'desc'),

        limit(20)

      );

      const productSnapshot = await getDocs(productVisitsQuery);

      const productVisitData = productSnapshot.docs.map(doc => ({ 

        id: doc.id, 

        ...doc.data() 

      }));



      // Fetch order stats (simplified to avoid 400 error)

      const ordersQuery = query(

        collection(db, 'orders'),

        orderBy('created_at', 'desc'),

        limit(10)

      );

      const ordersSnapshot = await getDocs(ordersQuery);

      const orderData = ordersSnapshot.docs.map(doc => ({ 

        id: doc.id, 

        ...doc.data() 

      }));



      // Update traffic visits

      const trafficVisitsQuery = query(

        collection(db, 'traffic_sources'),

        orderBy('visit_count', 'desc')

      );

      const trafficVisitsSnapshot = await getDocs(trafficVisitsQuery);

      const trafficVisitsData = trafficVisitsSnapshot.docs.map(doc => ({ 

        id: doc.id, 

        ...doc.data() 

      }));

      

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

      const productVisitsQuery = query(

        collection(db, 'product_visit_stats'),

        orderBy('visit_count', 'desc')

      );

      const productSnapshot = await getDocs(productVisitsQuery);

      const productVisitData = productSnapshot.docs.map(doc => ({ 

        id: doc.id, 

        ...doc.data() 

      }));

      

      // Fetch total orders

      const ordersQuery = query(

        collection(db, 'orders'),

        orderBy('created_at', 'desc')

      );

      const ordersSnapshot = await getDocs(ordersQuery);

      const ordersData = ordersSnapshot.docs.map(doc => ({ 

        id: doc.id, 

        ...doc.data() 

      }));

      

      // Fetch total users (you might need to adjust this based on your user table)

      const usersQuery = query(

        collection(db, 'user_profiles'),

        limit(100)

      );

      const usersSnapshot = await getDocs(usersQuery);

      const usersData = usersSnapshot.docs.map(doc => ({ 

        id: doc.id, 

        ...doc.data() 

      }));

      

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

    } catch (error: any) {

      if (error.code === 'permission-denied') {

        console.warn('Permission denied: unable to fetch stats data. User may not have admin privileges.');

        console.warn('This could be due to:');

        console.warn('1. User not authenticated');

        console.warn('2. User does not have admin role in user_profiles');

        console.warn('3. Firestore rules not properly configured');

      } else if (error.code === 'unavailable' || error.code === 'resource-exhausted') {

        console.warn('Firebase temporarily unavailable, using fallback values');

      } else {

        console.error('Error fetching stats data:', error);

      }

      // Set fallback values to prevent UI crashes

      setStats({

        totalVisits: 0,

        totalOrders: 0,

        totalUsers: 0,

        conversionRate: 0,

        totalRevenue: 0,

        pendingOrders: 0

      });

    }

  };



  useEffect(() => {

    fetchProducts();

    fetchStatsData(); // Fetch real stats data

  }, [fetchProducts]);



  useEffect(() => {

    const loadTrafficVisits = async () => {

      try {

        const trafficQuery = query(

          collection(db, 'traffic_sources'),

          orderBy('visit_count', 'desc')

        );

        const trafficSnapshot = await getDocs(trafficQuery);

        const trafficData = trafficSnapshot.docs.map(doc => ({ 

          id: doc.id, 

          ...doc.data() 

        }));

        

        if (trafficData) {

          const total = trafficData.reduce((sum: number, row: any) => sum + (row.visit_count || 0), 0);

          setTrafficVisits(total);

        }

      } catch (error: any) {

        if (error.code === 'permission-denied') {

          console.warn('Permission denied: unable to load traffic visits');

        } else {

          console.warn('Error loading traffic visits (collection may not exist):', error?.message);

        }

        setTrafficVisits(0); // Set to 0 if collection doesn't exist

      }

    };



    const loadProductVisits = async () => {

      try {

        const productVisitsQuery = query(

          collection(db, 'product_visit_stats'),

          orderBy('last_visited_at', 'desc'),

          limit(20)

        );

        const productSnapshot = await getDocs(productVisitsQuery);

        const productData = productSnapshot.docs.map(doc => ({ 

          id: doc.id, 

          ...doc.data() 

        }));

        

        if (productData) {

          setProductVisitsData(productData);

        }

      } catch (error: any) {

        if (error.code === 'permission-denied') {

          console.warn('Permission denied: unable to load product visits');

        } else {

          console.warn('Error loading product visits (collection may not exist):', error?.message);

        }

        setProductVisitsData([]); // Set to empty array if collection doesn't exist

      }

    };



    const loadTopProducts = async () => {

      try {

        const productVisitsQuery = query(

          collection(db, 'product_visit_stats'),

          orderBy('visit_count', 'desc'),

          limit(10)

        );

        const productSnapshot = await getDocs(productVisitsQuery);

        const productData = productSnapshot.docs.map(doc => ({ 

          id: doc.id, 

          ...doc.data() 

        }));

        

        if (productData) {

          setTopProducts(productData);

        }

      } catch (error: any) {

        if (error.code === 'permission-denied') {

          console.warn('Permission denied: unable to load top products');

        } else {

          console.warn('Error loading top products (collection may not exist):', error?.message);

        }

        setTopProducts([]); // Set to empty array if collection doesn't exist

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

        const trafficQuery = query(

          collection(db, 'traffic_sources'),

          orderBy('visit_count', 'desc'),

          limit(20)

        );

        const trafficSnapshot = await getDocs(trafficQuery);

        const trafficData = trafficSnapshot.docs.map(doc => ({ 

          id: doc.id, 

          ...doc.data() 

        }));



        // Fetch product visit stats

        const productVisitsQuery = query(

          collection(db, 'product_visit_stats'),

          orderBy('visit_count', 'desc'),

          limit(20)

        );

        const productSnapshot = await getDocs(productVisitsQuery);

        const productData = productSnapshot.docs.map(doc => ({ 

          id: doc.id, 

          ...doc.data() 

        }));



        // Fetch order stats (simplified to avoid 400 error)

        const ordersQuery = query(

          collection(db, 'orders'),

          orderBy('created_at', 'desc'),

          limit(10)

        );

        const ordersSnapshot = await getDocs(ordersQuery);

        const orderData = ordersSnapshot.docs.map(doc => ({ 

          id: doc.id, 

          ...doc.data() 

        }));



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

            <div id="comprehensive-dashboard-content" className="bg-white p-6 rounded-lg shadow-lg mb-8" style={{ position: 'absolute', left: '-9999px', top: '-9999px', width: '1200px', maxWidth: '1200px', minWidth: '1200px', minHeight: '1600px', overflow: 'hidden' }}>

              {/* Header */}

              <div className="text-center mb-6">

                <h2 className="text-2xl font-bold text-gray-800 mb-2">FiCi Shoes - Complete Dashboard</h2>

                <p className="text-gray-600">{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>

              </div>



              {/* Two Column Layout */}

              <div className="grid grid-cols-2 gap-4">

                {/* Left Column */}

                <div className="space-y-4">

                  {/* Key Metrics */}

                  <div>

                    <h3 className="text-sm font-semibold text-gray-800 mb-2">🔥 Key Metrics</h3>

                    <div className="grid grid-cols-2 gap-2">

                      <div className="bg-blue-50 p-2 rounded text-center border border-blue-200">

                        <div className="text-sm font-bold text-blue-600">{(stats.totalVisits || 0).toLocaleString()}</div>

                        <div className="text-xs text-gray-600">Total Visits</div>

                      </div>

                      <div className="bg-indigo-50 p-2 rounded text-center border border-indigo-200">

                        <div className="text-sm font-bold text-indigo-600">{trafficVisits.toLocaleString()}</div>

                        <div className="text-xs text-gray-600">Traffic Visits</div>

                      </div>

                      <div className="bg-green-50 p-2 rounded text-center border border-green-200">

                        <div className="text-sm font-bold text-green-600">{(stats.totalOrders || 0).toLocaleString()}</div>

                        <div className="text-xs text-gray-600">Total Orders</div>

                      </div>

                      <div className="bg-purple-50 p-2 rounded text-center border border-purple-200">

                        <div className="text-sm font-bold text-purple-600">{(stats.totalUsers || 0).toLocaleString()}</div>

                        <div className="text-xs text-gray-600">Total Users</div>

                      </div>

                      <div className="bg-emerald-50 p-2 rounded text-center border border-emerald-200">

                        <div className="text-sm font-bold text-emerald-600">₹{(stats.totalRevenue || 0).toLocaleString('en-IN')}</div>

                        <div className="text-xs text-gray-600">Total Revenue</div>

                      </div>

                      <div className="bg-orange-50 p-2 rounded text-center border border-orange-200">

                        <div className="text-sm font-bold text-orange-600">{(stats.conversionRate || 0).toFixed(2)}%</div>

                        <div className="text-xs text-gray-600">Conversion Rate</div>

                      </div>

                      <div className="bg-yellow-50 p-2 rounded text-center border border-yellow-200">

                        <div className="text-sm font-bold text-yellow-600">{(stats.pendingOrders || 0).toLocaleString()}</div>

                        <div className="text-xs text-gray-600">Pending Orders</div>

                      </div>

                    </div>

                  </div>



                  {/* Top Products */}

                  {topProducts && topProducts.length > 0 && (

                    <div>

                      <h3 className="text-sm font-semibold text-gray-800 mb-2">🏆 Top Products</h3>

                      <div className="space-y-1">

                        {topProducts.slice(0, 10).map((product: any, index: number) => {

                          // For now, use a placeholder amount since individual product revenue calculation needs order data

                          const productRevenue = 500; // This should be calculated per product when order data is available

                          

                          return (

                            <div key={index} className="bg-gray-50 p-2 rounded border border-gray-200" style={{ fontSize: '11px', lineHeight: '1.3', fontFamily: 'Arial, sans-serif' }}>

                              <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>

                                <tbody>

                                  <tr>

                                    <td style={{ width: '55%', padding: '0', paddingRight: '8px', color: '#374151', fontSize: '11px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>

                                      {index + 1}. {product.name || 'Unknown Product'}

                                    </td>

                                    <td style={{ width: '25%', padding: '0', paddingRight: '4px', color: '#6B7280', fontSize: '10px', whiteSpace: 'nowrap', textAlign: 'right' }}>

                                      📊 {product.visit_count || 0} visits

                                    </td>

                                    <td style={{ width: '20%', padding: '0', color: '#111827', fontSize: '10px', fontWeight: '600', whiteSpace: 'nowrap', textAlign: 'right' }}>

                                      💰 ₹{productRevenue.toLocaleString('en-IN')}

                                    </td>

                                  </tr>

                                </tbody>

                              </table>

                            </div>

                          );

                        })}

                      </div>

                    </div>

                  )}



                  {/* Recent Orders */}

                  {comprehensiveData?.recentOrders && comprehensiveData.recentOrders.length > 0 && (

                    <div>

                      <h3 className="text-sm font-semibold text-gray-800 mb-2">📋 Recent Orders</h3>

                      <div className="space-y-1">

                        {comprehensiveData.recentOrders.slice(0, 10).map((order: any, index: number) => (

                          <div key={`${order.id || index}-${order.created_at}`} className="bg-gray-50 p-2 rounded border border-gray-200" style={{ fontSize: '11px', lineHeight: '1.3', fontFamily: 'Arial, sans-serif' }}>

                            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>

                              <tbody>

                                <tr>

                                  <td style={{ width: '40%', padding: '0', paddingRight: '8px', color: '#374151', fontSize: '11px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>

                                    {index + 1}. Order #{order.id ? order.id.slice(0, 8) : 'N/A'}

                                  </td>

                                  <td style={{ width: '25%', padding: '0', paddingRight: '4px', color: '#111827', fontSize: '10px', fontWeight: '600', whiteSpace: 'nowrap', textAlign: 'right' }}>

                                    💰 ₹{(order.effective_amount || order.total_amount || 0).toLocaleString('en-IN')}

                                  </td>

                                  <td style={{ width: '35%', padding: '0', color: '#6B7280', fontSize: '10px', whiteSpace: 'nowrap', textAlign: 'right' }}>

                                    � {order.status || 'N/A'} | 💳 {order.payment_status || 'N/A'} | 📅 {order.created_at ? new Date(order.created_at).toLocaleDateString('en-IN') : 'N/A'}

                                  </td>

                                </tr>

                              </tbody>

                            </table>

                          </div>

                        ))}

                      </div>

                    </div>

                  )}

                </div>



                {/* Right Column */}

                <div className="space-y-4">

                  {/* Traffic Sources */}

                  {comprehensiveData?.trafficSources && comprehensiveData.trafficSources.length > 0 && (

                    <div>

                      <h3 className="text-sm font-semibold text-gray-800 mb-2">🌐 Traffic Sources</h3>

                      <div className="space-y-1">

                        {comprehensiveData.trafficSources.slice(0, 10).map((source: any, index: number) => (

                          <div key={`${source.id || index}-${source.visit_count}`} className="bg-gray-50 p-2 rounded border border-gray-200" style={{ fontSize: '11px', lineHeight: '1.3', fontFamily: 'Arial, sans-serif' }}>

                            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>

                              <tbody>

                                <tr>

                                  <td style={{ width: '75%', padding: '0', paddingRight: '8px', color: '#374151', fontSize: '11px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>

                                    {index + 1}. {source.source || 'Direct'} {source.medium ? `(${source.medium})` : ''} {source.campaign ? `[${source.campaign}]` : ''}

                                  </td>

                                  <td style={{ width: '25%', padding: '0', color: '#111827', fontSize: '11px', fontWeight: '600', whiteSpace: 'nowrap', textAlign: 'right' }}>

                                    {source.visit_count || 0} visits

                                  </td>

                                </tr>

                              </tbody>

                            </table>

                          </div>

                        ))}

                      </div>

                    </div>

                  )}



                  {/* Product Visits Detailed */}

                  {comprehensiveData?.productVisits && comprehensiveData.productVisits.length > 0 && (

                    <div>

                      <h3 className="text-sm font-semibold text-gray-800 mb-2">🛍️ Product Visits (Detailed)</h3>

                      <div className="space-y-1">

                        {comprehensiveData.productVisits.slice(0, 15).map((product: any, index: number) => {

                          // For now, use a placeholder amount since individual product revenue calculation needs order data

                          const productRevenue = 500; // This should be calculated per product when order data is available

                          

                          return (

                            <div key={`${product.product_id || index}-${product.visit_count}`} className="bg-gray-50 p-2 rounded border border-gray-200" style={{ fontSize: '11px', lineHeight: '1.3', fontFamily: 'Arial, sans-serif' }}>

                              <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>

                                <tbody>

                                  <tr>

                                    <td style={{ width: '45%', padding: '0', paddingRight: '8px', color: '#374151', fontSize: '11px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>

                                      {index + 1}. {product.name || 'Unknown Product'}

                                    </td>

                                    <td style={{ width: '20%', padding: '0', paddingRight: '4px', color: '#6B7280', fontSize: '10px', whiteSpace: 'nowrap', textAlign: 'right' }}>

                                      📊 {product.visit_count || 0} visits

                                    </td>

                                    <td style={{ width: '18%', padding: '0', paddingRight: '4px', color: '#111827', fontSize: '10px', fontWeight: '600', whiteSpace: 'nowrap', textAlign: 'right' }}>

                                      💰 ₹{productRevenue.toLocaleString('en-IN')}

                                    </td>

                                    <td style={{ width: '17%', padding: '0', color: '#6B7280', fontSize: '10px', whiteSpace: 'nowrap', textAlign: 'right' }}>

                                      📅 {product.created_at ? new Date(product.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'N/A'}

                                    </td>

                                  </tr>

                                </tbody>

                              </table>

                            </div>

                          );

                        })}

                      </div>

                    </div>

                  )}



                  {/* Summary Statistics */}

                  <div>

                    <h3 className="text-sm font-semibold text-gray-800 mb-2">📈 Summary Statistics</h3>

                    <div className="grid grid-cols-2 gap-2">

                      <div className="bg-gray-50 p-2 rounded border border-gray-200 text-center">

                        <div className="text-sm font-bold text-gray-800">{comprehensiveData?.trafficSources?.length || 0}</div>

                        <div className="text-xs text-gray-600">Total Traffic Sources</div>

                      </div>

                      <div className="bg-gray-50 p-2 rounded border border-gray-200 text-center">

                        <div className="text-sm font-bold text-gray-800">

                          {comprehensiveData?.productVisits?.reduce((sum: number, p: any) => sum + (p.visit_count || 0), 0).toLocaleString() || 0}

                        </div>

                        <div className="text-xs text-gray-600">Total Product Visits</div>

                      </div>

                      <div className="bg-gray-50 p-2 rounded border border-gray-200 text-center">

                        <div className="text-sm font-bold text-gray-800">{comprehensiveData?.productVisits?.length || 0}</div>

                        <div className="text-xs text-gray-600">Products Tracked</div>

                      </div>

                      <div className="bg-gray-50 p-2 rounded border border-gray-200 text-center">

                        <div className="text-sm font-bold text-gray-800">{comprehensiveData?.recentOrders?.length || 0}</div>

                        <div className="text-xs text-gray-600">Recent Orders</div>

                      </div>

                      <div className="bg-gray-50 p-2 rounded border border-gray-200 text-center">

                        <div className="text-sm font-bold text-gray-800">

                          {comprehensiveData?.recentOrders?.filter(order => order.payment_status === 'paid').length || 0}

                        </div>

                        <div className="text-xs text-gray-600">Paid Orders</div>

                      </div>

                      <div className="bg-gray-50 p-2 rounded border border-gray-200 text-center">

                        <div className="text-sm font-bold text-gray-800">

                          ₹{comprehensiveData?.recentOrders?.filter(order => order.payment_status === 'paid')

                            ?.reduce((sum: number, o: any) => sum + (o.effective_amount || o.total_amount || 0), 0).toLocaleString('en-IN') || 0}

                        </div>

                        <div className="text-xs text-gray-600">Total Revenue</div>

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