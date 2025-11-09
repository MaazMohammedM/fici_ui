import React, { useEffect, useState } from 'react';
import { supabase } from '@lib/supabase';
import { useAuthStore } from '@store/authStore';
import { Edit, Trash2, Check, Plus } from 'lucide-react';

export type Address = {
  id?: string;
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  landmark?: string;
  district?: string;
  is_default?: boolean;
};

interface Props {
  onSelect: (addr: Address) => void;
  selectedId?: string;
}

const AddressForm: React.FC<Props> = ({ onSelect, selectedId }) => {
  const { user } = useAuthStore();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [editing, setEditing] = useState<Address | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Address>({
    name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    landmark: ''
  });
  const [loading, setLoading] = useState(false);
  const [showAllAddresses, setShowAllAddresses] = useState(false);

  useEffect(() => {
    if (user?.id) loadAddresses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const loadAddresses = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('addresses')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      const arr = Array.isArray(data?.addresses) ? data.addresses : [];
      setAddresses(arr);
    } catch (err) {
      console.error('loadAddresses error', err);
    } finally {
      setLoading(false);
    }
  };

  const upsertAddresses = async (next: Address[]) => {
    if (!user?.id) return { error: 'no-user' };
    const { error } = await supabase
      .from('user_profiles')
      .update({ addresses: next })
      .eq('user_id', user.id);
    return { error };
  };

  const handleSave = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const next = [...addresses];
    if (editing?.id) {
      const idx = next.findIndex(a => a.id === editing.id);
      if (idx >= 0) next[idx] = { ...form, id: editing.id };
    } else {
      next.push({ ...form, id: `addr_${Date.now()}` });
    }

    setLoading(true);
    try {
      const { error } = await upsertAddresses(next);
      if (error) throw error;
      setAddresses(next);
      setEditing(null);
      setForm({
        name: '',
        phone: '',
        email: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        landmark: '',
        district: ''
      });
    } catch (err) {
      console.error('save address error', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;
    const next = addresses.filter(a => a.id !== id);
    setLoading(true);
    try {
      const { error } = await upsertAddresses(next);
      if (error) throw error;
      setAddresses(next);
    } catch (err) {
      console.error('delete address error', err);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (addr: Address) => {
    setEditing(addr);
    setForm(addr);
  };

  const setAsDefault = async (id?: string) => {
    if (!id) return;
    const next = addresses.map(a => ({ ...a, is_default: a.id === id }));
    setLoading(true);
    try {
      const { error } = await upsertAddresses(next);
      if (error) throw error;
      setAddresses(next);
    } catch (err) {
      console.error('default address error', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-dark2 rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Shipping Address</h2>
        <button
          onClick={() => {
            setShowForm(true);
            setEditing(null);
            setForm({
              name: '',
              phone: '',
              email: '',
              address: '',
              city: '',
              state: '',
              pincode: '',
              landmark: '',
              district: ''
            });
          }}
          className="flex items-center gap-2 text-accent hover:text-accent/80"
        >
          <Plus className="w-4 h-4" /> Add New
        </button>
      </div>

      {/* Address list */}
      {loading ? (
        <div>Loading...</div>
      ) : (
        <>
          {addresses.length > 0 && (
            <div className="space-y-3 mb-4">
              {(showAllAddresses ? addresses : addresses.slice(0, 2)).map(addr => (
                <div
                  key={addr.id}
                  onClick={() => {
                    onSelect(addr);
                  }}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedId === addr.id ? 'border-accent bg-accent/5' : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{addr.name}</h3>
                        {addr.is_default && <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Default</span>}
                      </div>
                      <p className="text-sm">{addr.phone} • {addr.email}</p>
                      <p className="text-sm">{addr.address}, {addr.city}, {addr.district ? `${addr.district}, ` : ''}{addr.state} {addr.pincode}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={(e) => { e.stopPropagation(); startEdit(addr); setShowForm(true); }} className="p-2 text-gray-400 hover:text-accent"><Edit className="w-4 h-4" /></button>
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(addr.id); }} className="p-2 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <button onClick={(e) => { e.stopPropagation(); setAsDefault(addr.id); }} className="text-xs text-[color:var(--color-accent)] hover:underline">Set as default</button>
                    {selectedId === addr.id && <span className="ml-auto text-accent flex items-center gap-2"><Check className="w-4 h-4" />Selected</span>}
                  </div>
                </div>
              ))}

              {/* View more button */}
              {!showAllAddresses && addresses.length > 2 && (
                <button
                  onClick={() => setShowAllAddresses(true)}
                  className="w-full p-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:border-accent hover:text-accent transition-colors"
                >
                  View {addresses.length - 2} more addresses
                </button>
              )}

              {/* View less button */}
              {showAllAddresses && addresses.length > 2 && (
                <button
                  onClick={() => setShowAllAddresses(false)}
                  className="w-full p-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:border-accent hover:text-accent transition-colors"
                >
                  View less
                </button>
              )}
            </div>
          )}

          {/* Add/Edit form - Only show when explicitly requested */}
          {showForm && (
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-3">{editing ? 'Edit Address' : 'Add New Address'}</h3>
              <form onSubmit={handleSave} className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input value={form.name || ''} onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))} placeholder="Full name" className="px-3 py-2 border rounded" required />
                  <input value={form.phone || ''} onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))} placeholder="Phone" className="px-3 py-2 border rounded" required />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input value={form.email || ''} onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))} placeholder="Email" className="px-3 py-2 border rounded" required />
                  <input value={form.pincode || ''} onChange={(e) => setForm(prev => ({ ...prev, pincode: e.target.value }))} placeholder="Pincode" className="px-3 py-2 border rounded" required />
                </div>
                <textarea value={form.address || ''} onChange={(e) => setForm(prev => ({ ...prev, address: e.target.value }))} placeholder="Address" rows={2} className="w-full px-3 py-2 border rounded" required />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input value={form.city || ''} onChange={(e) => setForm(prev => ({ ...prev, city: e.target.value }))} placeholder="City" className="px-3 py-2 border rounded" required />
                  <input value={form.district || ''} onChange={(e) => setForm(prev => ({ ...prev, district: e.target.value }))} placeholder="District" className="px-3 py-2 border rounded" required />
                  <input value={form.state || ''} onChange={(e) => setForm(prev => ({ ...prev, state: e.target.value }))} placeholder="State" className="px-3 py-2 border rounded" required />
                </div>
                <div className="flex gap-3">
                  <button type="submit" className="flex-1 bg-accent text-white py-2 rounded">{loading ? 'Saving...' : editing ? 'Update Address' : 'Save Address'}</button>
                  <button type="button" onClick={() => { setShowForm(false); setEditing(null); setForm({ name: '', phone: '', email: '', address: '', city: '', state: '', pincode: '', landmark: '' }); }} className="px-4 py-2 border rounded">Cancel</button>
                </div>
              </form>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AddressForm;
