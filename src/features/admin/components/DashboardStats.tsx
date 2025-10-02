import React from 'react';
import { TrendingUp, Eye, ShoppingBag, Users, DollarSign, Package } from 'lucide-react';

interface DashboardStatsProps {
  totalVisits: number;
  totalOrders: number;
  totalUsers: number;
  conversionRate: number;
  totalRevenue: number;
  pendingOrders: number;
}

const DashboardStats: React.FC<DashboardStatsProps> = ({
  totalVisits,
  totalOrders,
  totalUsers,
  conversionRate,
  totalRevenue,
  pendingOrders
}) => {
  const stats = [
    {
      title: 'Total Visits',
      value: totalVisits.toLocaleString(),
      icon: Eye,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Total Orders',
      value: totalOrders.toLocaleString(),
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
      value: `₹${totalRevenue.toLocaleString('en-IN')}`,
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
      value: pendingOrders.toLocaleString(),
      icon: Package,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
      {stats.map((stat) => {
        const IconComponent = stat.icon;
        return (
          <div key={stat.title} className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <IconComponent className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default DashboardStats;
