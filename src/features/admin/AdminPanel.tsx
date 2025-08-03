// ✅ AdminPage.tsx — Main Admin UI
import React, { useEffect, useState } from 'react';
import ProductForm from './components/ProductForm';
import ProductList from './components/ProductList';
import { useAdminStore } from './store/adminStore';

const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'list' | 'add'>('list');
  const { fetchProducts } = useAdminStore();

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return (
    <div className="max-w-5xl mx-auto p-6 bg-gradient-light dark:bg-gradient-dark rounded-2xl shadow-lg">
      <h1 className="text-3xl font-bold mb-6 text-primary dark:text-white font-secondary">Admin Product Management</h1>
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setActiveTab('list')}
          className={`px-4 py-2 rounded-xl shadow ${
            activeTab === 'list' ? 'bg-primary text-white' : 'bg-secondary dark:bg-dark2 text-black dark:text-white'
          }`}
        >
          Product List
        </button>
        <button
          onClick={() => setActiveTab('add')}
          className={`px-4 py-2 rounded-xl shadow ${
            activeTab === 'add' ? 'bg-primary text-white' : 'bg-secondary dark:bg-dark2 text-black dark:text-white'
          }`}
        >
          Add Product
        </button>
      </div>
      {activeTab === 'list' ? <ProductList /> : <ProductForm />}
    </div>
  );
};

export default AdminPage;