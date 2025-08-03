// ✅ ProductList.tsx — List, update sizes, delete products
import React from 'react';
import { useAdminStore } from '../store/adminStore';

const ProductList: React.FC = () => {
  const { products, deleteProduct, updateSizes } = useAdminStore();

  return (
    <div className='space-y-6'>
      {products.map((product) => (
        <div key={product.product_id} className='border p-4 rounded shadow-sm'>
          <h3 className='text-lg font-semibold'>{product.name} - ₹{product.mrpPrice}</h3>
          <p>{product.discountPrice}</p>
          <p>{product.description}</p>
          <p className='text-sm text-gray-500'>
  Sizes: {Object.entries(product.sizes).map(([size, qty]) => `${size}: ${qty}`).join(', ')}
</p>
          <div className='mt-2'>
            <input
              type='text'
              placeholder='Update sizes (comma-separated)'
              onBlur={(e) => {
                const input = e.target.value;
                const sizeMap: Record<string, number> = {};
                input.split(',').forEach(pair => {
                  const [size, qty] = pair.split(':').map(s => s.trim());
                  if (size && qty && !isNaN(Number(qty))) {
                    sizeMap[size] = Number(qty);
                  }
                });
                updateSizes(product.product_id, sizeMap);
              }}
                            className='border px-2 py-1 rounded text-sm'
            />
            <button
              onClick={() => deleteProduct(product.product_id)}
              className='ml-4 text-red-600 text-sm underline'
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProductList;