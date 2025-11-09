import React, { useEffect, useState } from "react";
import { BarChart3, List, Plus, Package } from "lucide-react";

// Dashboard Components
import DashboardStats from "./components/DashboardStats";
import TopProductsChart from "./components/TopProductsChart";
import ProductVisitsTable from "./components/ProductVisitsTable";

// Product Management Components
import ProductForm from "./components/ProductForm";
import ProductList from "./components/ProductList";

// Order Management Components
// Store + Hooks
import { useAdminStore } from "./store/adminStore";
import { useAdminDashboard } from "./hooks/useAdminDashboard";
import AdminOrderDashboard from "./components/AdminOrderDashboard";

const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"dashboard" | "list" | "add" | "orders">(
    "dashboard"
  );

  const { fetchProducts } = useAdminStore();
  const {
    stats,
    topProducts,
    allProducts,
    loading,
    currentPage,
    totalPages,
    handlePageChange,
    handleSearch,
  } = useAdminDashboard();

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Admin Panel
          </h1>
        </div>

        {/* Navigation Tabs - Mobile Responsive */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-wrap gap-2 sm:gap-4 justify-center sm:justify-start overflow-x-auto pb-2 sm:pb-0">
            <button
              onClick={() => setActiveTab("dashboard")}
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
              onClick={() => setActiveTab("list")}
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
              onClick={() => setActiveTab("add")}
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
              onClick={() => setActiveTab("orders")}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-3 rounded-xl shadow transition whitespace-nowrap flex-shrink-0 ${
                activeTab === "orders"
                  ? "bg-blue-600 text-white"
                  : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              <Package className="w-4 h-4" />
              <span className="hidden sm:inline">Orders</span>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "dashboard" && (
          <div>
            {/* Stats */}
            <DashboardStats
              totalVisits={stats.totalVisits}
              totalOrders={stats.totalOrders}
              totalUsers={stats.totalUsers}
              conversionRate={stats.conversionRate}
              totalRevenue={stats.totalRevenue}
              pendingOrders={stats.pendingOrders}
            />

            {/* Charts - Mobile Responsive */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 mb-6 sm:mb-8">
              <TopProductsChart products={topProducts} loading={loading} />
            </div>

            {/* Product Visits Table */}
            <ProductVisitsTable
              products={allProducts}
              loading={loading}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              onSearch={handleSearch}
            />
          </div>
        )}

        {activeTab === "list" && <ProductList />}
        {activeTab === "add" && <ProductForm />}
        {activeTab === "orders" && <AdminOrderDashboard />}
      </div>
    </div>
  );
};

export default AdminPage;