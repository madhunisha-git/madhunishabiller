// src/pages/Inventory.jsx
import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../Sidebar/Sidebar';
import Logout from '../Logout';
import { FaPlus, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import Modal from 'react-modal';
import '../../App.css'

Modal.setAppElement('#root');

// Floating Label Input
const FloatingLabelInput = ({ value, onChange, placeholder, type = "text", className = "", ...props }) => {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type={type}
        value={value}
        onChange={onChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={`w-full px-6 py-4 rounded-xl border ${isFocused ? 'border-indigo-500' : 'border-gray-300 dark:border-gray-600'} 
                   bg-white dark:bg-gray-700 text-black dark:text-white text-base placeholder-transparent focus:outline-none peer ${className}`}
        placeholder=" "
        {...props}
      />
      <label
        className={`absolute left-6 transition-all duration-200 pointer-events-none
                   ${isFocused || value ? '-top-3 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-white dark:bg-gray-800 px-2' 
                   : 'top-4 text-base text-gray-500 dark:text-gray-400'}`}
        onClick={() => inputRef.current?.focus()}
      >
        {placeholder}
      </label>
    </div>
  );
};

export default function Inventory() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [form, setForm] = useState({ productName: '', price: '', perCase: '' });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
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
      setError('Failed to load data');
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 300000); // 5 min
    return () => clearInterval(interval);
  }, []);

  // Add Category
  const handleAddCategory = async () => {
    if (!newCategory.trim()) return setError('Category name required');
    const formatted = newCategory.toLowerCase().trim().replace(/\s+/g, '_');

    try {
      await fetch(`${API_BASE_URL}/api/product-types`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_type: formatted })
      });
      setNewCategory('');
      setIsCategoryOpen(false);
      setSuccess('Category created successfully!');
      fetchData();
    } catch (err) {
      setError('Failed to create category');
    }
  };

  // Add Product
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!selectedCategory || !form.productName || !form.price || !form.perCase) {
      return setError('All fields are required');
    }

    try {
      await fetch(`${API_BASE_URL}/api/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productname: form.productName.trim(),
          price: parseFloat(form.price),
          per_case: parseInt(form.perCase),
          product_type: selectedCategory
        })
      });

      setForm({ productName: '', price: '', perCase: '' });
      setSuccess('Product added successfully!');
      fetchData();
    } catch (err) {
      setError('Failed to save product');
    }
  };

  // Delete Product
  const handleDelete = async (id, type) => {
    if (!window.confirm('Delete this product permanently?')) return;
    try {
      await fetch(`${API_BASE_URL}/api/products/${type}/${id}`, { method: 'DELETE' });
      setSuccess('Product deleted');
      fetchData();
    } catch (err) {
      setError('Delete failed');
    }
  };

  const format = (str) => str?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || '';

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar />
      <Logout />

      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-10 text-gray-800 dark:text-white">
            Inventory Management
          </h1>

          {error && <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 rounded-xl text-center">{error}</div>}
          {success && <div className="mb-6 p-4 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 rounded-xl text-center">{success}</div>}

          {/* Add New Category */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden mb-10">
            <button
              onClick={() => setIsCategoryOpen(!isCategoryOpen)}
              className="w-full p-6 flex justify-between items-center text-left font-bold text-2xl bg-gradient-to-r from-teal-600 to-cyan-700 text-white hover:from-teal-700 hover:to-cyan-800 transition"
            >
              Add New Category
              {isCategoryOpen ? <FaChevronUp /> : <FaChevronDown />}
            </button>

            {isCategoryOpen && (
              <div className="p-8 space-y-6">
                <FloatingLabelInput
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value)}
                  placeholder="e.g. Multi Shot, Fancy, Single Shot"
                />
                <div className="text-center">
                  <button
                    onClick={handleAddCategory}
                    className="px-12 py-4 bg-gradient-to-r from-teal-600 to-cyan-700 hover:from-teal-700 hover:to-cyan-800 text-white font-bold text-xl rounded-xl shadow-lg transition transform hover:scale-105 flex items-center gap-3 mx-auto"
                  >
                    <FaPlus /> Add Category
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Add Product Form */}
          <div className="bg-white dark:bg-gray-800 p-10 rounded-2xl shadow-xl mb-10">
            <h2 className="text-3xl font-bold mb-8 text-center text-indigo-600 dark:text-indigo-400">Add New Product</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div>
                <label className="block text-lg font-semibold mb-3 text-gray-700 dark:text-gray-300">Select Category</label>
                <select
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                  className="w-full px-6 py-4 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-black dark:text-white focus:border-indigo-500 outline-none"
                >
                  <option value="">Choose Category</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{format(cat)}</option>
                  ))}
                </select>
              </div>
            </div>

            {selectedCategory && (
              <form onSubmit={handleSaveProduct} className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <FloatingLabelInput
                  value={form.productName}
                  onChange={e => setForm({ ...form, productName: e.target.value })}
                  placeholder="Product Name (e.g. 100 Shot Green)"
                  required
                />
                <FloatingLabelInput
                  type="number"
                  value={form.price}
                  onChange={e => setForm({ ...form, price: e.target.value })}
                  placeholder="Price per Case (₹)"
                  step="0.01"
                  min="0"
                  required
                />
                <FloatingLabelInput
                  type="number"
                  value={form.perCase}
                  onChange={e => setForm({ ...form, perCase: e.target.value })}
                  placeholder="Quantity per Case"
                  min="1"
                  required
                />

                <div className="md:col-span-3 flex justify-center mt-6">
                  <button
                    type="submit"
                    className="px-16 py-5 bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white font-bold text-2xl rounded-xl shadow-xl transition transform hover:scale-105"
                  >
                    Save Product
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}