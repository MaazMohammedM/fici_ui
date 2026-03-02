import { useState, useEffect, useCallback } from "react";
import { db, collection, getDocs, query, where, orderBy, limit } from "@lib/firebase";

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
      const visitQuery = query(
        collection(db, 'product_visit_stats'),
        orderBy('visit_count', 'desc'),
        limit(1000)
      );
      const visitSnapshot = await getDocs(visitQuery);
      const visitData = visitSnapshot.docs.map(doc => doc.data());

      const totalVisits = visitData?.reduce((sum: number, item: any) => sum + (item.visit_count || 0), 0) || 0;

      // Get total orders and revenue
      const ordersQuery = query(
        collection(db, 'orders'),
        orderBy('order_date', 'desc'),
        limit(1000)
      );
      const ordersSnapshot = await getDocs(ordersQuery);
      const ordersData = ordersSnapshot.docs.map(doc => doc.data());

      // Filter out Razorpay orders with pending payment status
      const validOrders = ordersData?.filter((order: any) => 
        !(order.payment_method === 'razorpay' && order.payment_status === 'pending')
      ) || [];

      const totalOrders = validOrders.length;
      const totalRevenue = validOrders.reduce((sum: number, order: any) =>
        order.payment_status === 'paid' ? sum + (order.effective_amount || 0) : sum, 0) || 0;
      const pendingOrders = validOrders.filter((order: any) =>
        order.payment_status === 'paid' && order.status !== 'shipped' && order.status !== 'delivered'
      ).length || 0;

      // Get total users - only count registered users (excluding guests)
      const usersQuery = query(
        collection(db, 'user_profiles'),
        where('is_guest', '==', false),
        limit(1000)
      );
      const usersSnapshot = await getDocs(usersQuery);
      const usersData = usersSnapshot.docs.map(doc => doc.data());
      
      const totalUsers = usersData.length || 0;

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

      const productsQuery = query(
        collection(db, 'product_visit_stats'),
        orderBy('visit_count', 'desc'),
        limit(10)
      );
      const productsSnapshot = await getDocs(productsQuery);
      const data = productsSnapshot.docs.map(doc => doc.data());

      const topProductsData: TopProduct[] = (data || []).map((item: any) => ({
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
      const visitsQuery = query(
        collection(db, 'product_visit_stats'),
        orderBy('last_visited_at', 'desc'),
        limit(1000)
      );
      const visitsSnapshot = await getDocs(visitsQuery);
      const data = visitsSnapshot.docs.map(doc => doc.data());

      const visitsByDate = (data || []).reduce(
        (acc: Record<string, number>, visit: any) => {
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
        
        let productsQuery = query(
          collection(db, 'product_visit_stats'),
          orderBy('last_visited_at', 'desc'),
          limit(pageSize)
        );

        if (search) {
          // Firebase doesn't have ilike, so we'll filter in JavaScript
          productsQuery = query(
            collection(db, 'product_visit_stats'),
            where('name', '>=', search),
            orderBy('last_visited_at', 'desc'),
            limit(pageSize)
          );
        }

        const productsSnapshot = await getDocs(productsQuery);
        let data = productsSnapshot.docs.map(doc => doc.data());

        // If there's a search term, filter the results
        if (search) {
          data = data.filter((item: any) => 
            item.name && item.name.toLowerCase().includes(search.toLowerCase())
          );
        }

        const productVisits: ProductVisit[] = (data || []).map((item: any) => ({
          product_id: item.product_id,
          name: item.name,
          visit_count: item.visit_count,
          thumbnail_url: item.thumbnail_url || undefined,
          last_visited_at: item.last_visited_at,
        }));

        setAllProducts(productVisits);
        // For Firebase, we'll estimate total pages based on the data we have
        setTotalPages(Math.ceil(data.length / pageSize));
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