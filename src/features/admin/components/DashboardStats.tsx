import React, { useState, useEffect } from 'react';
import { db, collection, getDocs, query, orderBy, limit } from '@lib/firebase';
import {
  TrendingUp,
  Eye,
  ShoppingBag,
  Users,
  DollarSign,
  Package
} from 'lucide-react';
import { getThumbnailUrl } from '@lib/utils/imageOptimization';

interface DashboardStatsProps {
  totalVisits: number;
  totalOrders: number;
  totalUsers: number;
  conversionRate: number;
  totalRevenue: number;
  pendingOrders: number;
  trafficVisits?: number;
}


// Function to fetch detailed traffic and product stats for snapshot
const fetchDetailedStats = async () => {
  try {
    // Fetch traffic sources data
    const trafficQuery = query(
      collection(db, 'traffic_sources'),
      orderBy('visit_count', 'desc'),
      limit(10)
    );
    const trafficSnapshot = await getDocs(trafficQuery);
    const trafficData = trafficSnapshot.docs.map(doc => ({
      ...doc.data()
    }));

    // Fetch product visit stats
    const productQuery = query(
      collection(db, 'product_visit_stats'),
      orderBy('visit_count', 'desc'),
      limit(10)
    );
    const productSnapshot = await getDocs(productQuery);
    const productData = productSnapshot.docs.map(doc => ({
      ...doc.data()
    }));

    return {
      trafficSources: trafficData || [],
      productVisits: productData || []
    };
  } catch (error) {
    console.error('Error fetching detailed stats:', error);
    return {
      trafficSources: [],
      productVisits: []
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





  useEffect(() => {
    if (typeof trafficVisits === 'number') {
      setTotalTrafficVisits(trafficVisits);
      return;
    }
    
    // Fetch total traffic visits from database
    const fetchTrafficVisits = async () => {
      try {
        const trafficQuery = query(
          collection(db, 'traffic_sources'),
          orderBy('visit_count', 'desc')
        );
        const snapshot = await getDocs(trafficQuery);
        const data = snapshot.docs.map(doc => ({
          ...doc.data()
        }));
        
        const total = data?.reduce((sum: number, row: any) => sum + (row.visit_count || 0), 0) || 0;
        setTotalTrafficVisits(total);
      } catch (error) {
        console.error('Failed to fetch traffic visits:', error);
        setTotalTrafficVisits(0);
      }
    };
    
    fetchTrafficVisits();
  }, [trafficVisits]);


  const baseStats = [
    {
      title: 'Total Product Visits',
      value: totalVisits.toLocaleString(),
      icon: Eye,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Total Orders',
      value: totalOrdersProp.toLocaleString(),
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
      value: `₹${totalRevenueProp.toLocaleString('en-IN')}`,
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
      value: pendingOrdersProp.toLocaleString(),
      icon: Package,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    }
  ];

  const stats = totalTrafficVisits !== null
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
    <>
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-6 gap-3 mb-8">
        {stats.map((stat) => {
          const IconComponent = stat.icon;
          return (
            <div
              key={stat.title}
              className="bg-white dark:bg-gray-800 rounded-lg px-3 py-2.5 shadow-sm border border-gray-200 dark:border-gray-700 min-w-0 min-w-0-important"
            >
              {/* single-line layout: left (icon + title) and right (value) */}
              <div className="flex items-center gap-3 min-w-0 flex-nowrap-important">
                {/* Left: icon + title (title truncates) */}
                <div className="flex items-center gap-2 min-w-0 flex-1 min-w-0-important">
                  <div className={`${stat.bgColor} rounded-md p-1.5 flex-shrink-0`}>
                    <IconComponent className={`${stat.color} w-4 h-4`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{stat.title}</p>
                  </div>
                </div>
                {/* Right: value */}
                <div className="text-sm font-semibold text-gray-900">{stat.value}</div>
              </div>
            </div>
          );
        })}
      </div>

          </>
  );
};

export default DashboardStats;
