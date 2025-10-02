import React, { useEffect, useState } from "react";
import { BarChart3, List, Plus, Package } from "lucide-react";

// Dashboard Components
import DashboardStats from "./components/DashboardStats";
import TopProductsChart from "./components/TopProductsChart";
import VisitsTrendChart from "./components/VisitsTrendChart";
import ProductVisitsTable from "./components/ProductVisitsTable";

// Product Management Components
import ProductForm from "./components/ProductForm";
import ProductList from "./components/ProductList";

// Order Management Components
import OrderManagement from "./components/OrderManagement";

// Store + Hooks
import { useAdminStore } from "./store/adminStore";
import { useAdminDashboard } from "./hooks/useAdminDashboard";

const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"dashboard" | "list" | "add" | "orders">(
    "dashboard"
  );

  const { fetchProducts } = useAdminStore();
  const {
    stats,
    topProducts,
    dailyVisits,
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
          Admin Panel
        </h1>

        {/* Navigation Tabs */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl shadow transition ${
              activeTab === "dashboard"
                ? "bg-blue-600 text-white"
                : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab("list")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl shadow transition ${
              activeTab === "list"
                ? "bg-blue-600 text-white"
                : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
            }`}
          >
            <List className="w-4 h-4" />
            Product List
          </button>
          <button
            onClick={() => setActiveTab("add")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl shadow transition ${
              activeTab === "add"
                ? "bg-blue-600 text-white"
                : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
            }`}
          >
            <Plus className="w-4 h-4" />
            Add Product
          </button>
          <button
            onClick={() => setActiveTab("orders")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl shadow transition ${
              activeTab === "orders"
                ? "bg-blue-600 text-white"
                : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
            }`}
          >
            <Package className="w-4 h-4" />
            Orders
          </button>
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

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <TopProductsChart products={topProducts} loading={loading} />
              <VisitsTrendChart data={dailyVisits} loading={loading} />
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
        {activeTab === "orders" && <OrderManagement />}
      </div>
    </div>
  );
};

export default AdminPage;