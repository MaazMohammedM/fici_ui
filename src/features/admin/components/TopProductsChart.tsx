import React from 'react';
import { BarChart3, TrendingUp } from 'lucide-react';

interface TopProduct {
  product_id: string;
  name: string;
  visit_count: number;
  thumbnail_url?: string;
}

interface TopProductsChartProps {
  products: TopProduct[];
  loading?: boolean;
}

const TopProductsChart: React.FC<TopProductsChartProps> = ({ products, loading }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Top 10 Most Visited Products</h3>
          <BarChart3 className="w-5 h-5 text-gray-400" />
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const maxVisits = Math.max(...products.map(p => p.visit_count));

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Top 10 Most Visited Products</h3>
        <BarChart3 className="w-5 h-5 text-gray-400" />
      </div>
      
      <div className="space-y-4">
        {products.map((product, index) => {
          const percentage = (product.visit_count / maxVisits) * 100;
          
          return (
            <div key={product.product_id} className="flex items-center space-x-4">
              <div className="flex-shrink-0 w-8 text-center">
                <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
              </div>
              
              {product.thumbnail_url && (
                <img
                  src={product.thumbnail_url}
                  alt={product.name}
                  className="w-12 h-12 object-cover rounded-lg"
                />
              )}
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {product.name}
                  </p>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">{product.visit_count}</span>
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  </div>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {products.length === 0 && (
        <div className="text-center py-8">
          <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No product visits data available</p>
        </div>
      )}
    </div>
  );
};

export default TopProductsChart;
