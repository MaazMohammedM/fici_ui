import { useState, useEffect, useCallback } from "react";
import { supabase } from "@lib/supabase";

interface DashboardStats {
  totalVisits: number;
  totalOrders: number;
  totalUsers: number;
  conversionRate: number;
  totalRevenue: number;
  pendingOrders: number;
}

interface TopProduct {
  product_id: string;
  name: string;
  visit_count: number;
  thumbnail_url?: string;
}

interface DailyVisit {
  date: string;
  visits: number;
}

interface ProductVisit {
  product_id: string;
  name: string;
  visit_count: number;
  thumbnail_url?: string;
  last_visited_at: string;
}

export const useAdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalVisits: 0,
    totalOrders: 0,
    totalUsers: 0,
    conversionRate: 0,
    totalRevenue: 0,
    pendingOrders: 0,
  });
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [dailyVisits, setDailyVisits] = useState<DailyVisit[]>([]);
  const [allProducts, setAllProducts] = useState<ProductVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  /**
   * 📊 Dashboard Stats - Updated for new schema
   */
  const fetchDashboardStats = useCallback(async () => {
    try {
      setError(null);

      // Get total visits from product_visit_stats
      const { data: visitData, error: visitError } = await supabase
        .from("product_visit_stats")
        .select("visit_count");

      if (visitError) throw visitError;

      const totalVisits = visitData?.reduce((sum, item) => sum + item.visit_count, 0) || 0;

      // Get total orders and revenue
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select("total_amount, status, payment_status");

      if (ordersError) throw ordersError;

      const totalOrders = ordersData?.length || 0;
      const totalRevenue = ordersData?.reduce((sum, order) =>
        order.payment_status === 'paid' ? sum + (order.total_amount || 0) : sum, 0) || 0;
      const pendingOrders = ordersData?.filter(order =>
        order.payment_status === 'paid' && order.status !== 'shipped' && order.status !== 'delivered'
      ).length || 0;

      // Get total users
      const { count: totalUsers, error: usersError } = await supabase
        .from("user_profiles")
        .select("*", { count: "exact", head: true });

      if (usersError) throw usersError;

      const conversionRate = totalVisits && totalOrders ? (totalOrders / totalVisits) * 100 : 0;

      setStats({
        totalVisits,
        totalOrders,
        totalUsers: totalUsers || 0,
        conversionRate,
        totalRevenue,
        pendingOrders,
      });
    } catch (err) {
      console.error("Error fetching dashboard stats:", err);
      setError("Failed to fetch stats");
    }
  }, []);

  /**
   * 🏆 Top Products - Updated for new schema
   */
  const fetchTopProducts = useCallback(async () => {
    try {
      setError(null);

      const { data, error } = await supabase
        .from("product_visit_stats")
        .select("product_id, name, thumbnail_url, visit_count, last_visited_at")
        .order("visit_count", { ascending: false })
        .limit(10);

      if (error) throw error;

      const topProductsData: TopProduct[] = (data || []).map(item => ({
        product_id: item.product_id,
        name: item.name,
        visit_count: item.visit_count,
        thumbnail_url: item.thumbnail_url || undefined,
      }));

      setTopProducts(topProductsData);
    } catch (err) {
      console.error("Error fetching top products:", err);
      setError("Failed to fetch top products");
    }
  }, []);

  /**
   * 📈 Daily Visits (last 30 days) - Updated for new schema
   */
  const fetchDailyVisits = useCallback(async () => {
    try {
      setError(null);

      // For now, we'll aggregate visits by date from product_visit_stats
      // In a real scenario, you might want a separate daily_visits table
      const { data, error } = await supabase
        .from("product_visit_stats")
        .select("last_visited_at");

      if (error) throw error;

      const visitsByDate = (data || []).reduce(
        (acc: Record<string, number>, visit) => {
          if (visit.last_visited_at) {
            const date = new Date(visit.last_visited_at).toISOString().split("T")[0];
            acc[date] = (acc[date] || 0) + 1;
          }
          return acc;
        },
        {}
      );

      const dailyVisitsArray: DailyVisit[] = [];
      for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split("T")[0];
        dailyVisitsArray.push({
          date: dateStr,
          visits: visitsByDate[dateStr] || 0,
        });
      }

      setDailyVisits(dailyVisitsArray);
    } catch (err) {
      console.error("Error fetching daily visits:", err);
      setError("Failed to fetch daily visits");
    }
  }, []);

  /**
   * 📦 All Products (paginated + search) - Updated for new schema
   */
  const fetchAllProducts = useCallback(
    async (page = 1, search = "") => {
      try {
        setError(null);
        const pageSize = 20;
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        let query = supabase
          .from("product_visit_stats")
          .select("product_id, name, thumbnail_url, visit_count, last_visited_at");

        if (search) {
          query = query.ilike("name", `%${search}%`);
        }

        const { data, error, count } = await query
          .range(from, to)
          .order("visit_count", { ascending: false });

        if (error) throw error;

        const productVisits: ProductVisit[] = (data || []).map(item => ({
          product_id: item.product_id,
          name: item.name,
          visit_count: item.visit_count,
          thumbnail_url: item.thumbnail_url || undefined,
          last_visited_at: item.last_visited_at,
        }));

        setAllProducts(productVisits);
        setTotalPages(Math.ceil((count || 0) / pageSize));
      } catch (err) {
        console.error("Error fetching all products:", err);
        setError("Failed to fetch all products");
      }
    },
    []
  );

  /**
   * 🔄 Pagination
   */
  const handlePageChange = useCallback(
    (page: number) => {
      setCurrentPage(page);
      fetchAllProducts(page, searchQuery);
    },
    [fetchAllProducts, searchQuery]
  );

  /**
   * 🔍 Search
   */
  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query);
      setCurrentPage(1);
      fetchAllProducts(1, query);
    },
    [fetchAllProducts]
  );

  /**
   * 🚀 Initial Load
   */
  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      await Promise.all([
        fetchDashboardStats(),
        fetchTopProducts(),
        fetchDailyVisits(),
        fetchAllProducts(1),
      ]);
      setLoading(false);
    };

    loadDashboard();
  }, [fetchDashboardStats, fetchTopProducts, fetchDailyVisits, fetchAllProducts]);

  return {
    stats,
    topProducts,
    dailyVisits,
    allProducts,
    loading,
    error,
    currentPage,
    totalPages,
    handlePageChange,
    handleSearch,
    refreshData: () => {
      fetchDashboardStats();
      fetchTopProducts();
      fetchDailyVisits();
      fetchAllProducts(currentPage, searchQuery);
    },
  };
};