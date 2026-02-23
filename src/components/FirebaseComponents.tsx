import React, { useState, useEffect } from 'react';
import { firebaseService } from '../lib/firebaseService';
import { useAuth } from '../context/FirebaseAuthContext';
import type { Product, UserProfile } from '../lib/firebaseService';

// Product List Component - Firebase Version
export const ProductList: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    category: '',
    gender: '',
    search: ''
  });

  useEffect(() => {
    fetchProducts();
  }, [filters]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let result;
      if (filters.search) {
        result = await firebaseService.products.searchProducts(filters.search);
      } else {
        result = await firebaseService.products.getAllProducts({
          category: filters.category || undefined,
          gender: filters.gender || undefined,
          is_active: true
        });
      }
      
      setProducts(result.products || result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading products...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Products</h2>
      
      {/* Filters */}
      <div className="filters">
        <input
          type="text"
          placeholder="Search products..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        />
        <select
          value={filters.category}
          onChange={(e) => setFilters({ ...filters, category: e.target.value })}
        >
          <option value="">All Categories</option>
          <option value="Footwear">Footwear</option>
          <option value="Bags and Accessories">Bags and Accessories</option>
        </select>
        <select
          value={filters.gender}
          onChange={(e) => setFilters({ ...filters, gender: e.target.value })}
        >
          <option value="">All Genders</option>
          <option value="men">Men</option>
          <option value="women">Women</option>
          <option value="unisex">Unisex</option>
        </select>
      </div>

      {/* Product Grid */}
      <div className="product-grid">
        {products.map((product) => (
          <div key={product.product_id} className="product-card">
            <img 
              src={product.thumbnail_url} 
              alt={product.name}
              onError={(e) => {
                // Fallback image handling
                e.currentTarget.src = '/placeholder-product.jpg';
              }}
            />
            <h3>{product.name}</h3>
            <p>{product.description}</p>
            <div className="price">
              <span className="discount-price">₹{product.discount_price}</span>
              <span className="mrp-price">₹{product.mrp_price}</span>
            </div>
            <button>Add to Cart</button>
          </div>
        ))}
      </div>
    </div>
  );
};

// User Profile Component - Firebase Version
export const UserProfile: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const userProfile = await firebaseService.users.getUserProfile(user!.uid);
      setProfile(userProfile);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (updates: Partial<UserProfile>) => {
    if (!user || !profile) return;
    
    try {
      await firebaseService.users.updateUserProfile(user.uid, updates);
      await fetchProfile(); // Refresh profile
      setEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handleAddAddress = async (address: any) => {
    if (!user) return;
    
    try {
      await firebaseService.users.addAddress(user.uid, address);
      await fetchProfile(); // Refresh profile
    } catch (error) {
      console.error('Error adding address:', error);
    }
  };

  if (loading) return <div>Loading profile...</div>;
  if (!profile) return <div>Profile not found</div>;

  return (
    <div className="user-profile">
      <h2>My Profile</h2>
      
      <div className="profile-info">
        <h3>Personal Information</h3>
        {editing ? (
          <div className="edit-form">
            <input
              type="text"
              value={profile.first_name}
              onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
            />
            <input
              type="text"
              value={profile.last_name || ''}
              onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
            />
            <input
              type="email"
              value={profile.email || ''}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
            />
            <input
              type="tel"
              value={profile.phone_number || ''}
              onChange={(e) => setProfile({ ...profile, phone_number: e.target.value })}
            />
            <button onClick={() => handleUpdateProfile(profile)}>Save</button>
            <button onClick={() => setEditing(false)}>Cancel</button>
          </div>
        ) : (
          <div className="display-info">
            <p><strong>Name:</strong> {profile.first_name} {profile.last_name}</p>
            <p><strong>Email:</strong> {profile.email}</p>
            <p><strong>Phone:</strong> {profile.phone_number}</p>
            <button onClick={() => setEditing(true)}>Edit Profile</button>
          </div>
        )}
      </div>

      <div className="addresses">
        <h3>Addresses</h3>
        {profile.addresses.map((address) => (
          <div key={address.id} className="address-card">
            <h4>{address.name}</h4>
            <p>{address.address}</p>
            <p>{address.city}, {address.state} - {address.pincode}</p>
            <p>Phone: {address.phone}</p>
            {address.is_default && <span className="default-badge">Default</span>}
          </div>
        ))}
        <button>Add New Address</button>
      </div>
    </div>
  );
};

// Orders Component - Firebase Version
export const OrdersList: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const userOrders = await firebaseService.orders.getUserOrders(user!.uid);
      setOrders(userOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading orders...</div>;

  return (
    <div className="orders-list">
      <h2>My Orders</h2>
      {orders.length === 0 ? (
        <p>No orders found</p>
      ) : (
        orders.map((order) => (
          <div key={order.order_id} className="order-card">
            <div className="order-header">
              <h3>Order #{order.order_id.slice(-8)}</h3>
              <span className={`status ${order.status}`}>{order.status}</span>
            </div>
            <div className="order-details">
              <p><strong>Date:</strong> {new Date(order.order_date.toDate()).toLocaleDateString()}</p>
              <p><strong>Total:</strong> ₹{order.total_amount}</p>
              <p><strong>Payment:</strong> {order.payment_status}</p>
              {order.tracking_id && (
                <p><strong>Tracking:</strong> {order.tracking_id}</p>
              )}
            </div>
            <div className="order-items">
              {order.items.map((item: any, index: number) => (
                <div key={index} className="order-item">
                  <img src={item.thumbnail_url} alt={item.product_name} />
                  <div>
                    <h4>{item.product_name}</h4>
                    <p>Size: {item.size} | Qty: {item.quantity}</p>
                    <p>₹{item.price_at_purchase}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

// Pincode Checker Component - Firebase Version
export const PincodeChecker: React.FC = () => {
  const [pincode, setPincode] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const checkPincode = async () => {
    if (!pincode.trim()) return;
    
    try {
      setLoading(true);
      const serviceability = await firebaseService.pincodes.checkServiceability(pincode);
      setResult(serviceability);
    } catch (error) {
      console.error('Error checking pincode:', error);
      setResult({ serviceable: false, error: 'Failed to check pincode' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pincode-checker">
      <h3>Check Delivery Availability</h3>
      <div className="pincode-input">
        <input
          type="text"
          placeholder="Enter pincode"
          value={pincode}
          onChange={(e) => setPincode(e.target.value)}
          maxLength={6}
        />
        <button onClick={checkPincode} disabled={loading}>
          {loading ? 'Checking...' : 'Check'}
        </button>
      </div>
      
      {result && (
        <div className={`result ${result.serviceable ? 'serviceable' : 'not-serviceable'}`}>
          {result.serviceable ? (
            <div>
              <p>✅ Delivery available</p>
              <p>Delivery time: {result.deliveryTime}</p>
              <p>Shipping fee: ₹{result.shippingFee}</p>
              {result.codAllowed && <p>Cash on Delivery available</p>}
              {result.freeShippingThreshold && (
                <p>Free shipping on orders above ₹{result.freeShippingThreshold}</p>
              )}
            </div>
          ) : (
            <p>❌ Delivery not available for this pincode</p>
          )}
        </div>
      )}
    </div>
  );
};

// Export all components
export default {
  ProductList,
  UserProfile,
  OrdersList,
  PincodeChecker
};
