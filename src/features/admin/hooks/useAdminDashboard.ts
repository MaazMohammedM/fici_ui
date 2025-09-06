import { useState, useEffect, useCallback } from "react";
import { supabase } from "@lib/supabase";

type VisitRecord = {
  product_id: string;
  visited_at: string;
  name: string | null;
  thumbnail_url: string | null;
};


interface DashboardStats {
  totalVisits: number;
  totalOrders: number;
  totalUsers: number;
  conversionRate: number;
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
  last_visited?: string;
}

export const useAdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalVisits: 0,
    totalOrders: 0,
    totalUsers: 0,
    conversionRate: 0,
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
   * 📊 Dashboard Stats
   */
  const fetchDashboardStats = useCallback(async () => {
    try {
      setError(null);

      const { count: totalVisits } = await supabase
        .from("product_visits")
        .select("*", { count: "exact", head: true });

      const { count: totalOrders } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true });

      const { count: totalUsers } = await supabase
        .from("user_profiles")
        .select("*", { count: "exact", head: true });

      const conversionRate =
        totalVisits && totalOrders ? (totalOrders / totalVisits) * 100 : 0;

      setStats({
        totalVisits: totalVisits || 0,
        totalOrders: totalOrders || 0,
        totalUsers: totalUsers || 0,
        conversionRate,
      });
    } catch (err) {
      console.error("Error fetching dashboard stats:", err);
      setError("Failed to fetch stats");
    }
  }, []);

  /**
   * 🏆 Top Products
   */
  const fetchTopProducts = useCallback(async () => {
    try {
      setError(null);
      const { data, error } = await supabase
      .from("product_visits")
      .select("product_id, name, thumbnail_url, visited_at");
    

      if (error) throw error;

      const productVisits = (data as VisitRecord[]).reduce<
      Record<string, TopProduct>
    >((acc, visit) => {
      const pid = visit.product_id;
    
      if (!acc[pid] && visit.name) {
        acc[pid] = {
          product_id: pid,
          name: visit.name,
          thumbnail_url: visit.thumbnail_url || undefined,
          visit_count: 0,
        };
      }
      if (acc[pid]) acc[pid].visit_count++;
      return acc;
    }, {});
    
    

      setTopProducts(
        Object.values(productVisits)
          .sort((a, b) => b.visit_count - a.visit_count)
          .slice(0, 10)
      );
    } catch (err) {
      console.error("Error fetching top products:", err);
      setError("Failed to fetch top products");
    }
  }, []);

  /**
   * 📈 Daily Visits (last 30 days)
   */
  const fetchDailyVisits = useCallback(async () => {
    try {
      setError(null);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await supabase
        .from("product_visits")
        .select("visited_at")
        .gte("visited_at", thirtyDaysAgo.toISOString());

      if (error) throw error;

      const visitsByDate = (data || []).reduce(
        (acc: Record<string, number>, visit) => {
          const date = new Date(visit.visited_at).toISOString().split("T")[0];
          acc[date] = (acc[date] || 0) + 1;
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
   * 📦 All Products (paginated + search)
   */
  const fetchAllProducts = useCallback(
    async (page = 1, search = "") => {
      try {
        setError(null);
        const pageSize = 20;
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;
        let query =  supabase
        .from("product_visits")
        .select("product_id, name, thumbnail_url, visited_at");
      
      

        if (search) {
          // ✅ match alias `products`
          query = query.ilike("products.name", `%${search}%`);
        }

        const { data, error, count } = await query
          .range(from, to)
          .order("visited_at", { ascending: false });

        if (error) throw error;

        const productVisits = (data as VisitRecord[]).reduce<
  Record<string, TopProduct>
>((acc, visit) => {
  const pid = visit.product_id;

  if (!acc[pid] && visit.name) {
    acc[pid] = {
      product_id: pid,
      name: visit.name,
      thumbnail_url: visit.thumbnail_url || undefined,
      visit_count: 0,
    };
  }


          if (acc[pid]) {
            acc[pid].visit_count++;
            // const visitDate = visit.visited_at
            //   ? new Date(visit.visited_at)
            //   : null;
            // const lastVisited = acc[pid].visit_count
            //   ? new Date(acc[pid].visit_count)
            //   : null;

            // if (visitDate && (!lastVisited || visitDate > lastVisited)) {
            //   acc[pid].visit_count = visit.visited_at;
            // }
          }

          return acc;
        }, {});

        setAllProducts(Object.values(productVisits));
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