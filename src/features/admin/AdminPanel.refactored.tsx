import React, { useEffect, useState } from "react";
import { BarChart3, List, Plus, Package, Percent } from "lucide-react";

// Dashboard Components
import DashboardStats from "./components/DashboardStats";
import TopProductsChart from "./components/TopProductsChart";
import ProductVisitsTable from "./components/ProductVisitsTable";
import TrafficSourcesWidget from "./components/TrafficSourcesWidget";

// Product Management Components
import ProductForm from "./components/ProductForm";
import ProductList from "./components/ProductList";

// Order Management Components
// Store + Hooks
import { useAdminStore } from "./store/adminStore";
import { useAdminDashboard } from "./hooks/useAdminDashboard";
import AdminOrderDashboard from "./components/AdminOrderDashboard";
import { supabase } from "@lib/supabase";
import { getActiveCheckoutRule, upsertCheckoutRule, getActiveProductDiscountsForProducts, upsertProductDiscount, type CheckoutRule, type ProductDiscountRule } from "@lib/discounts";

const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"dashboard" | "list" | "add" | "orders" | "discounts">(
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

  const [trafficVisits, setTrafficVisits] = useState<number>(0);
  const [checkoutRule, setCheckoutRule] = useState<CheckoutRule | null>(null);
  const [savingCheckout, setSavingCheckout] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [productRule, setProductRule] = useState<ProductDiscountRule | null>(null);
  const [savingProduct, setSavingProduct] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    const loadTrafficVisits = async () => {
      const { data, error } = await supabase
        .from("traffic_sources")
        .select("visit_count");
      if (!error && data) {
        const total = (data as Array<{ visit_count: number | null }>).reduce(
          (sum, row) => sum + (row.visit_count || 0),
          0
        );
        setTrafficVisits(total);
      }
    };
    loadTrafficVisits();
  }, []);

  // Load active checkout rule on mount
  useEffect(() => {
    (async () => {
      const rule = await getActiveCheckoutRule();
      setCheckoutRule(rule || { rule_type: 'amount', amount: 0, percent: null, min_order: null, max_discount_cap: null, active: true, starts_at: null, ends_at: null });
    })();
  }, []);

  // Load product discount rule when product changes
  useEffect(() => {
    if (!selectedProductId) { setProductRule(null); return; }
    (async () => {
      const map = await getActiveProductDiscountsForProducts([selectedProductId]);
      const existing = map[selectedProductId];
      setProductRule(existing || { product_id: selectedProductId, mode: 'amount', value: 0, base: 'price', active: true, starts_at: null, ends_at: null });
    })();
  }, [selectedProductId]);

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
            <button
              onClick={() => setActiveTab("discounts")}
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
            {/* Stats */}
            <DashboardStats
              totalVisits={stats.totalVisits}
              totalOrders={stats.totalOrders}
              totalUsers={stats.totalUsers}
              conversionRate={stats.conversionRate}
              totalRevenue={stats.totalRevenue}
              pendingOrders={stats.pendingOrders}
              trafficVisits={trafficVisits}
            />

            {/* Charts - Mobile Responsive */}
            <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:gap-8 mb-6 sm:mb-8">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
                <TopProductsChart products={topProducts} loading={loading} />
                <TrafficSourcesWidget />
              </div>
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
        {activeTab === "discounts" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Checkout Discount Rule */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 sm:p-6">
              <h3 className="text-lg font-semibold mb-4">Checkout (Prepaid) Discount</h3>
              {checkoutRule && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <label className="text-sm">Type
                      <select
                        className="mt-1 w-full border rounded p-2 bg-transparent"
                        value={checkoutRule.rule_type}
                        onChange={e => setCheckoutRule({ ...checkoutRule, rule_type: e.target.value as any, percent: e.target.value === 'percent' ? (checkoutRule.percent ?? 10) : null, amount: e.target.value === 'amount' ? (checkoutRule.amount ?? 100) : null })}
                      >
                        <option value="amount">Amount</option>
                        <option value="percent">Percent</option>
                      </select>
                    </label>
                    <label className="text-sm">Active
                      <input type="checkbox" className="ml-2 align-middle" checked={!!checkoutRule.active} onChange={e => setCheckoutRule({ ...checkoutRule, active: e.target.checked })} />
                    </label>
                  </div>
                  {checkoutRule.rule_type === 'percent' ? (
                    <label className="text-sm">Percent (%)
                      <input type="number" min={0} max={100} className="mt-1 w-full border rounded p-2 bg-transparent" value={checkoutRule.percent ?? 0} onChange={e => setCheckoutRule({ ...checkoutRule, percent: Number(e.target.value) })} />
                    </label>
                  ) : (
                    <label className="text-sm">Amount (₹)
                      <input type="number" min={0} className="mt-1 w-full border rounded p-2 bg-transparent" value={checkoutRule.amount ?? 0} onChange={e => setCheckoutRule({ ...checkoutRule, amount: Number(e.target.value) })} />
                    </label>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <label className="text-sm">Min Order (₹)
                      <input type="number" min={0} className="mt-1 w-full border rounded p-2 bg-transparent" value={checkoutRule.min_order ?? 0} onChange={e => setCheckoutRule({ ...checkoutRule, min_order: Number(e.target.value) })} />
                    </label>
                    <label className="text-sm">Max Cap (₹)
                      <input type="number" min={0} className="mt-1 w-full border rounded p-2 bg-transparent" value={checkoutRule.max_discount_cap ?? 0} onChange={e => setCheckoutRule({ ...checkoutRule, max_discount_cap: Number(e.target.value) })} />
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="text-sm">Starts At
                      <input type="datetime-local" className="mt-1 w-full border rounded p-2 bg-transparent" value={checkoutRule.starts_at ? new Date(checkoutRule.starts_at).toISOString().slice(0,16) : ''} onChange={e => setCheckoutRule({ ...checkoutRule, starts_at: e.target.value ? new Date(e.target.value).toISOString() : null })} />
                    </label>
                    <label className="text-sm">Ends At
                      <input type="datetime-local" className="mt-1 w-full border rounded p-2 bg-transparent" value={checkoutRule.ends_at ? new Date(checkoutRule.ends_at).toISOString().slice(0,16) : ''} onChange={e => setCheckoutRule({ ...checkoutRule, ends_at: e.target.value ? new Date(e.target.value).toISOString() : null })} />
                    </label>
                  </div>
                  <div className="flex justify-end">
                    <button
                      disabled={savingCheckout}
                      onClick={async () => {
                        try {
                          setSavingCheckout(true);
                          if (!checkoutRule) return;
                          await upsertCheckoutRule(checkoutRule);
                          alert('Checkout discount saved');
                        } catch (e) {
                          alert('Failed to save checkout discount');
                        } finally {
                          setSavingCheckout(false);
                        }
                      }}
                      className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
                    >
                      {savingCheckout ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Product Discount Rule */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 sm:p-6">
              <h3 className="text-lg font-semibold mb-4">Product Discounts</h3>
              <div className="space-y-3">
                <label className="text-sm">Select Product
                  <select className="mt-1 w-full border rounded p-2 bg-transparent" value={selectedProductId} onChange={(e) => setSelectedProductId(e.target.value)}>
                    <option value="">-- Choose a product --</option>
                    {allProducts.map((p: any) => (
                      <option key={p.product_id} value={p.product_id}>{p.name}</option>
                    ))}
                  </select>
                </label>
                {selectedProductId && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <label className="text-sm">Mode
                        <select className="mt-1 w-full border rounded p-2 bg-transparent" value={productRule?.mode || 'amount'} onChange={e => setProductRule(prev => ({ ...(prev as any), product_id: selectedProductId, mode: e.target.value as any }))}>
                          <option value="amount">Amount</option>
                          <option value="percent">Percent</option>
                        </select>
                      </label>
                      <label className="text-sm">Base
                        <select className="mt-1 w-full border rounded p-2 bg-transparent" value={productRule?.base || 'price'} onChange={e => setProductRule(prev => ({ ...(prev as any), product_id: selectedProductId, base: e.target.value as any }))}>
                          <option value="price">Price</option>
                          <option value="mrp">MRP</option>
                        </select>
                      </label>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="text-sm">Value
                        <input type="number" min={0} className="mt-1 w-full border rounded p-2 bg-transparent" value={productRule?.value ?? 0} onChange={e => setProductRule(prev => ({ ...(prev as any), product_id: selectedProductId, value: Number(e.target.value) }))} />
                      </label>
                      <label className="text-sm">Active
                        <input type="checkbox" className="ml-2 align-middle" checked={!!productRule?.active} onChange={e => setProductRule(prev => ({ ...(prev as any), product_id: selectedProductId, active: e.target.checked }))} />
                      </label>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="text-sm">Starts At
                        <input type="datetime-local" className="mt-1 w-full border rounded p-2 bg-transparent" value={productRule?.starts_at ? new Date(productRule.starts_at).toISOString().slice(0,16) : ''} onChange={e => setProductRule(prev => ({ ...(prev as any), product_id: selectedProductId, starts_at: e.target.value ? new Date(e.target.value).toISOString() : null }))} />
                      </label>
                      <label className="text-sm">Ends At
                        <input type="datetime-local" className="mt-1 w-full border rounded p-2 bg-transparent" value={productRule?.ends_at ? new Date(productRule.ends_at).toISOString().slice(0,16) : ''} onChange={e => setProductRule(prev => ({ ...(prev as any), product_id: selectedProductId, ends_at: e.target.value ? new Date(e.target.value).toISOString() : null }))} />
                      </label>
                    </div>
                    <div className="flex justify-end">
                      <button
                        disabled={savingProduct || !productRule}
                        onClick={async () => {
                          if (!productRule) return;
                          try {
                            setSavingProduct(true);
                            await upsertProductDiscount({ ...productRule, product_id: selectedProductId });
                            alert('Product discount saved');
                          } catch (e) {
                            alert('Failed to save product discount');
                          } finally {
                            setSavingProduct(false);
                          }
                        }}
                        className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
                      >
                        {savingProduct ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;