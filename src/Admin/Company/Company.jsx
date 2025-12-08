// src/pages/CompanyDetails.jsx
import React, { useState, useEffect } from 'react';
import Sidebar from '../Sidebar/Sidebar';
import Logout from '../Logout';
import { FaCheckCircle } from 'react-icons/fa';

export default function CompanyDetails() {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [logoFile, setLogoFile] = useState(null);
  const [signFile, setSignFile] = useState(null);
  const [previewLogo, setPreviewLogo] = useState('');   // Start empty
  const [previewSign, setPreviewSign] = useState('');   // Start empty
  const [showSuccess, setShowSuccess] = useState(false);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const fetchData = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/company`);
      const json = await res.json();
      setData(json);
      // Do NOT set preview here → we want fresh start every time
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    if (logoFile) formData.append('logo', logoFile);
    if (signFile) formData.append('signature', signFile);

    try {
      const res = await fetch(`${API_BASE_URL}/api/company`, {
        method: 'POST',
        body: formData,
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Failed');

      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        fetchData(); // Refresh data (but we won't show old images)
        e.target.reset();
        setLogoFile(null);
        setSignFile(null);
        setPreviewLogo('');   // Clear preview
        setPreviewSign('');   // Clear preview
      }, 2000);
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div className="text-center py-40 text-2xl text-black dark:text-white">Loading...</div>;

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar />
      <Logout />

      <div className="flex-1 p-6">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-5xl font-bold text-center mb-12 text-indigo-700 dark:text-indigo-400">
            Company Details Setup
          </h1>

          <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-12 space-y-10">
            {/* Company Info */}
            <div className="grid md:grid-cols-2 gap-10">
              <Input label="Company Name" name="company_name" placeholder="Enter company name" required />
              <Input label="GSTIN" name="gstin" placeholder="29ABCDE1234F2Z5" />
              <Input label="Email" name="email" type="email" placeholder="company@example.com" />
              <Input label="Address" name="address" placeholder="Full address" required />
            </div>

            {/* Bank Details */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-gray-700 dark:to-gray-800 p-8 rounded-2xl">
              <h2 className="text-2xl font-bold mb-6 text-indigo-700 dark:text-indigo-400">Bank Details</h2>
              <div className="grid md:grid-cols-2 gap-8">
                <Input label="Bank Name" name="bank_name" placeholder="e.g. HDFC Bank" />
                <Input label="Branch" name="branch" placeholder="Branch name" />
                <Input label="Account No." name="account_no" placeholder="1234567890" />
                <Input label="IFSC Code" name="ifsc_code" placeholder="HDFC0001234" />
              </div>
            </div>

            {/* Logo & Signature */}
            <div className="grid md:grid-cols-2 gap-16">
              {/* Company Logo */}
              <div>
                <label className="block text-2xl font-bold mb-6 text-purple-700">Company Logo</label>
                
                {/* Only show preview if user selected a new file */}
                {previewLogo && (
                  <div className="mb-6">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Preview:</p>
                    <img src={previewLogo} alt="Logo Preview" className="w-64 h-64 object-contain bg-white rounded-2xl shadow-xl" />
                  </div>
                )}

                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setLogoFile(file);
                      setPreviewLogo(URL.createObjectURL(file));
                    }
                  }}
                  className="block w-full text-lg file:mr-6 file:py-4 file:px-8 file:rounded-xl file:border-0 file:bg-indigo-600 file:text-white hover:file:bg-indigo-700"
                />
              </div>

              {/* Digital Signature */}
              <div>
                <label className="block text-2xl font-bold mb-6 text-purple-700">Digital Signature</label>
                
                {/* Only show preview if user selected a new file */}
                {previewSign && (
                  <div className="mb-6">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Preview:</p>
                    <img src={previewSign} alt="Signature Preview" className="w-80 h-40 object-contain bg-gray-50 rounded-2xl shadow-xl" />
                  </div>
                )}

                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setSignFile(file);
                      setPreviewSign(URL.createObjectURL(file));
                    }
                  }}
                  className="block w-full text-lg file:mr-6 file:py-4 file:px-8 file:rounded-xl file:border-0 file:bg-purple-600 file:text-white hover:file:bg-purple-700"
                />
              </div>
            </div>

            <div className="text-center pt-10">
              <button
                type="submit"
                className="px-20 py-7 bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 text-white font-bold text-3xl rounded-2xl shadow-2xl transition transform hover:scale-105"
              >
                Save Company Details
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* SUCCESS MODAL */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-16 shadow-3xl animate-bounce">
            <FaCheckCircle className="text-9xl text-green-500 mx-auto mb-6" />
            <h2 className="text-4xl font-bold text-center text-green-600 dark:text-green-400">Saved Successfully!</h2>
          </div>
        </div>
      )}
    </div>
  );
}

// Input Component (clean & consistent text color)
const Input = ({ label, ...props }) => (
  <div>
    <label className="block text-xl font-semibold mb-4 text-black dark:text-white">
      {label}
    </label>
    <input
      className="w-full px-8 py-5 rounded-2xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-indigo-500 outline-none text-lg text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
      {...props}
    />
  </div>
);