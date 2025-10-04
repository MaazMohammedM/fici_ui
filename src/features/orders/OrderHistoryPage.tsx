import React from 'react';
import OrderList from './components/OrderList';

const OrderHistoryPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-light dark:bg-gradient-dark">
      <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
        <OrderList />
      </div>
    </div>
  );
};

export default OrderHistoryPage;
