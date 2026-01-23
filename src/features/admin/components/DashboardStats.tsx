import React from 'react';
import { supabase } from '@lib/supabase';
import {
  TrendingUp,
  Eye,
  ShoppingBag,
  Users,
  DollarSign,
  Package
} from 'lucide-react';

interface DashboardStatsProps {
  totalVisits: number;
  totalOrders: number;
  totalUsers: number;
  conversionRate: number;
  totalRevenue: number;
  pendingOrders: number;
  trafficVisits?: number;
}

// Function to fetch order statistics using same logic as AdminOrderDashboard
const fetchOrderStats = async () => {
  try {
    // Use the same query as AdminOrderDashboard's adminStore
    let query = supabase
      .from('orders')
      .select(`
        *,
        order_items (*)
      `, { count: 'exact' });

    // For dashboard, we want all orders (excluding pending razorpay orders like in admin dashboard)
    const { data, error, count } = await query
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Apply the same filtering logic as AdminOrderDashboard
    let filteredData = data || [];
    
    // Exclude razorpay orders that are still pending (not paid) - same as admin dashboard
    filteredData = filteredData.filter(order => 
      !(order.payment_method === 'razorpay' && order.status === 'pending')
    );

    // Calculate statistics using same logic as AdminOrderDashboard
    const totalOrders = filteredData.length;
    const pendingOrders = filteredData.filter((order) => 
      order.payment_status === 'paid' && order.status !== 'shipped' && order.status !== 'delivered'
    ).length;
    
    // Calculate total revenue from paid orders using effective_amount (same as original logic)
    const totalRevenue = filteredData
      .filter(order => order.payment_status === 'paid')
      .reduce((sum, order) => sum + (order.effective_amount || order.total_amount || 0), 0);

    return {
      totalOrders,
      pendingOrders,
      totalRevenue
    };
  } catch (error) {
    console.error('Error fetching order stats:', error);
    return {
      totalOrders: 0,
      pendingOrders: 0,
      totalRevenue: 0
    };
  }
};

const DashboardStats: React.FC<DashboardStatsProps> = ({
  totalVisits,
  totalOrders: totalOrdersProp,
  totalUsers,
  conversionRate,
  totalRevenue: totalRevenueProp,
  pendingOrders: pendingOrdersProp,
  trafficVisits
}) => {
  // Fetch total traffic visits if not provided
  const [totalTrafficVisits, setTotalTrafficVisits] = React.useState<number | null>(null);
  
  // Fetch order statistics dynamically
  const [orderStats, setOrderStats] = React.useState({
    totalOrders: totalOrdersProp || 0,
    pendingOrders: pendingOrdersProp || 0,
    totalRevenue: totalRevenueProp || 0
  });
  const [orderStatsLoading, setOrderStatsLoading] = React.useState(false);
  
  React.useEffect(() => {
    if (typeof trafficVisits === 'number') {
      setTotalTrafficVisits(trafficVisits);
      return;
    }
    
    // Fetch total traffic visits from database
    const fetchTrafficVisits = async () => {
      try {
        const { data, error } = await supabase
          .from('traffic_sources')
          .select('visit_count')
          .not('visit_count', 'is', null);
        
        if (error) throw error;
        
        const total = data?.reduce((sum, row) => sum + (row.visit_count || 0), 0) || 0;
        setTotalTrafficVisits(total);
      } catch (error) {
        console.error('Failed to fetch traffic visits:', error);
        setTotalTrafficVisits(0);
      }
    };
    
    fetchTrafficVisits();
  }, [trafficVisits]);

  // Fetch order statistics
  React.useEffect(() => {
    const fetchStats = async () => {
      setOrderStatsLoading(true);
      try {
        const stats = await fetchOrderStats();
        setOrderStats(stats);
      } catch (error) {
        console.error('Failed to fetch order stats:', error);
      } finally {
        setOrderStatsLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Use fetched order stats, falling back to props if available
  const { totalOrders, pendingOrders, totalRevenue } = orderStats;
  const baseStats = [
    {
      title: 'Total Visits',
      value: totalVisits.toLocaleString(),
      icon: Eye,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Total Orders',
      value: orderStatsLoading ? '...' : totalOrders.toLocaleString(),
      icon: ShoppingBag,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Total Users',
      value: totalUsers.toLocaleString(),
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Total Revenue',
      value: orderStatsLoading ? '...' : `₹${totalRevenue.toLocaleString('en-IN')}`,
      icon: DollarSign,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50'
    },
    {
      title: 'Conversion Rate',
      value: `${conversionRate.toFixed(2)}%`,
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      title: 'Pending Orders',
      value: orderStatsLoading ? '...' : pendingOrders.toLocaleString(),
      icon: Package,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    }
  ];

  const stats =
    totalTrafficVisits !== null
      ? [
          {
            title: 'Traffic Visits',
            value: totalTrafficVisits.toLocaleString(),
            icon: Eye,
            color: 'text-indigo-600',
            bgColor: 'bg-indigo-50'
          },
          ...baseStats
        ]
      : baseStats;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-6 gap-3 mb-8">
      {stats.map((stat) => {
        const IconComponent = stat.icon;
        return (
          <div
            key={stat.title}
            /* ensure the card can shrink inside grid cells and not force its content out */
            className="bg-white dark:bg-gray-800 rounded-lg px-3 py-2.5 shadow-sm border border-gray-200 dark:border-gray-700 min-w-0 min-w-0-important"
          >
            {/* single-line layout: left (icon + title) and right (value) */}
            <div className="flex items-center gap-3 min-w-0 flex-nowrap-important">
              {/* Left: icon + title (title truncates) */}
              <div className="flex items-center gap-2 min-w-0 flex-1 min-w-0-important">
                <div className={`${stat.bgColor} rounded-md p-1.5 flex-shrink-0`}>
                  <IconComponent className={`${stat.color} w-4 h-4`} />
                </div>

                {/* title: force single line truncation */}
                <span className="text-sm text-gray-800 dark:text-gray-200 truncate truncate-nowrap">
                  {stat.title}
                </span>
              </div>

              {/* Right: value - keep it fixed and no-wrap */}
              <div className="flex-shrink-0 ml-2">
                <span className="text-sm font-bold text-gray-900 dark:text-white whitespace-nowrap">
                  {stat.value}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default DashboardStats;
