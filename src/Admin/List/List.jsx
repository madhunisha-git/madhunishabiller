// src/pages/ListProducts.jsx
import React, { useState, useEffect } from 'react';
import Sidebar from '../Sidebar/Sidebar';
import Logout from '../Logout';
import { FaEdit, FaTrash } from 'react-icons/fa';

export default function ListProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingProduct, setEditingProduct] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ productname: '', price: '' });
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // Fetch all data
  const fetchData = async () => {
    try {
      const [catRes, prodRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/product-types`),
        fetch(`${API_BASE_URL}/api/products`)
      ]);
      const cats = await catRes.json();
      const prods = await prodRes.json();

      setCategories(cats);
      setProducts(prods);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 300000); // Refresh every 5 mins
    return () => clearInterval(interval);
  }, []);

  // Delete Product
  const handleDelete = async (id, type) => {
    if (!window.confirm('Delete this product permanently?')) return;
    try {
      await fetch(`${API_BASE_URL}/api/products/${type}/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (err) {
      alert('Delete failed');
    }
  };

  // Edit Product
  const openEdit = (product) => {
    setEditingProduct(product);
    setEditForm({ productname: product.productname, price: product.price });
    setShowEditModal(true);
  };

  const saveEdit = async () => {
    if (!editForm.productname.trim() || !editForm.price) {
      return alert('Please fill all fields');
    }

    try {
      await fetch(`${API_BASE_URL}/api/products/${editingProduct.product_type}/${editingProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productname: editForm.productname.trim(),
          price: parseFloat(editForm.price),
          per_case: 1  // Always 1 — matches your business
        })
      });
      setShowEditModal(false);
      fetchData();
    } catch (err) {
      alert('Update failed');
    }
  };

  // Filtering
  const filtered = products.filter(p => {
    const matchesCategory = filterCategory === 'all' || p.product_type === filterCategory;
    const matchesSearch = p.productname.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const format = (str) => str?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || '';

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar />
      <Logout />

      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">

          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-gray-800 dark:text-white mb-4">
              All Products
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Total: <span className="font-bold text-indigo-600">{products.length}</span> items
            </p>
          </div>

          {/* Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-lg font-bold mb-4 text-gray-700 dark:text-gray-300">
                  Filter by Category
                </label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full px-6 py-4 rounded-xl border-2 border-indigo-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-black dark:text-white focus:border-indigo-500 outline-none text-lg"
                >
                  <option value="all">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{format(cat)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-lg font-bold mb-4 text-gray-700 dark:text-gray-300">
                  Search Product
                </label>
                <input
                  type="text"
                  placeholder="Search by product name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-6 py-4 rounded-xl border-2 border-indigo-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-black dark:text-white focus:border-indigo-500 outline-none text-lg placeholder-gray-500"
                />
              </div>
            </div>
          </div>

          {/* Product Grid */}
          {filtered.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-3xl text-gray-500 dark:text-gray-400">No products found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filtered.map(p => (
                <div
                  key={`${p.product_type}-${p.id}`}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-3 border border-gray-200 dark:border-gray-700"
                >
                  {/* Category Badge */}
                  <div className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white text-center py-3 font-bold text-lg">
                    {format(p.product_type)}
                  </div>

                  {/* Product Info */}
                  <div className="p-8">
                    <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-4 text-center">
                      {p.productname}
                    </h3>

                    <div className="text-center mb-8">
                      <p className="text-4xl font-bold text-green-600 dark:text-green-400">
                        ₹{(() => {
                          const price = parseFloat(p.rate_per_box || p.price || p.rate || 0);
                          return isNaN(price) ? '0.00' : price.toFixed(2);
                        })()}
                      </p>
                      <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">per case</p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4">
                      <button
                        onClick={() => openEdit(p)}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold transition flex items-center justify-center gap-2"
                      >
                        <FaEdit /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(p.id, p.product_type)}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white py-4 rounded-xl font-bold transition flex items-center justify-center gap-2"
                      >
                        <FaTrash /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-10 max-w-lg w-full shadow-2xl">
            <h2 className="text-3xl font-bold text-center mb-8 text-indigo-600 dark:text-indigo-400">
              Edit Product
            </h2>

            <div className="space-y-6">
              <input
                type="text"
                value={editForm.productname}
                onChange={e => setEditForm({ ...editForm, productname: e.target.value })}
                placeholder="Product Name"
                className="w-full px-6 py-4 rounded-xl border-2 text-black dark:text-white border-gray-300 dark:border-gray-600 focus:border-indigo-500 outline-none text-lg"
              />

              <input
                type="number"
                value={editForm.price}
                onChange={e => setEditForm({ ...editForm, price: e.target.value })}
                placeholder="Price per Case (₹)"
                step="0.01"
                className="w-full px-6 py-4 rounded-xl border-2 text-black dark:text-white border-gray-300 dark:border-gray-600 focus:border-indigo-500 outline-none text-lg"
              />

              <div className="flex gap-4 mt-8">
                <button
                  onClick={saveEdit}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white py-5 rounded-xl font-bold text-xl transition transform hover:scale-105"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-5 rounded-xl font-bold text-xl transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}