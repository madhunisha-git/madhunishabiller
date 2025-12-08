// src/pages/Booking.jsx
import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../Sidebar/Sidebar';
import Logout from '../../Admin/Logout';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { format } from 'date-fns';
import { FaSearch, FaTrash, FaFilePdf, FaTimes, FaDownload } from 'react-icons/fa';
import Modal from 'react-modal';
Modal.setAppElement("#root");

const FloatingLabelInput = ({ value, onChange, placeholder, type = "text" }) => {
  const [focused, setFocused] = useState(false);
  const active = focused || (value && value.toString().trim() !== '');
  return (
    <div className="relative">
      <input
        type={type}
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="w-full px-4 py-2 border rounded bg-white text-black focus:outline-none focus:border-blue-500 peer text-sm"
        placeholder=" "
      />
      <label className={`absolute left-3 transition-all pointer-events-none
        ${active ? '-top-3 text-xs bg-white px-2 text-blue-600 font-medium' : 'top-2 text-gray-500'}`}>
        {placeholder}
      </label>
    </div>
  );
};

export default function Booking() {
  const [companies, setCompanies] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState(null);
  const [company, setCompany] = useState(null);

  const [billNumber, setBillNumber] = useState('Generating...');
  const [manualBillNo, setManualBillNo] = useState('');
  const [suggestedBillNo, setSuggestedBillNo] = useState('');

  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);

  const [customer, setCustomer] = useState({ name: '', address: '', gstin: '', place: '' });
  const [recentCustomers, setRecentCustomers] = useState([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');

  const [through, setThrough] = useState('DIRECT');
  const [destination, setDestination] = useState('');
  const [packingPercent, setPackingPercent] = useState(0);
  const [extraTaxable, setExtraTaxable] = useState('');
  const [isIGST, setIsIGST] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [pdfUrl, setPdfUrl] = useState('');
  const invoiceRef = useRef();

  const [search, setSearch] = useState('');
  const [productSearchResults, setProductSearchResults] = useState([]);
  const [states, setStates] = useState([]);
  const [loadingStates, setLoadingStates] = useState(true);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const splitAddressIntoTwo = (addr) => {
    if (!addr) return ['', ''];
    const a = addr.trim();
    const kilRegex = /\bKil\b/i;
    const kilMatch = a.match(kilRegex);
    if (kilMatch) {
      const idx = kilMatch.index;
      const line1 = a.slice(0, idx).trim().replace(/,+$/, '');
      const line2 = a.slice(idx).trim();
      return [line1, line2];
    }
    const parts = a.split(',').map(p => p.trim()).filter(Boolean);
    if (parts.length <= 2) return [parts.join(', '), ''];
    const half = Math.ceil(parts.length / 2);
    return [parts.slice(0, half).join(', '), parts.slice(half).join(', ')];
  };

  const numberToWords = (num) => {
    const a = ['','One ','Two ','Three ','Four ','Five ','Six ','Seven ','Eight ','Nine ','Ten ','Eleven ','Twelve ','Thirteen ','Fourteen ','Fifteen ','Sixteen ','Seventeen ','Eighteen ','Nineteen '];
    const b = ['', '', 'Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
    if ((num = num.toString()).length > 9) return 'overflow';
    const n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return '';
    let str = '';
    str += (n[1] !== '00') ? (a[Number(n[1])] || (b[n[1][0]] + ' ' + a[n[1][1]])) + 'Crore ' : '';
    str += (n[2] !== '00') ? (a[Number(n[2])] || (b[n[2][0]] + ' ' + a[n[2][1]])) + 'Lakh ' : '';
    str += (n[3] !== '00') ? (a[Number(n[3])] || (b[n[3][0]] + ' ' + a[n[3][1]])) + 'Thousand ' : '';
    str += (n[4] !== '0') ? (a[Number(n[4])] || (b[n[4][0]] + ' ' + a[n[4][1]])) + 'Hundred ' : '';
    str += (n[5] !== '00') ? ((str !== '') ? 'and ' : '') + (a[Number(n[5])] || (b[n[5][0]] + ' ' + a[n[5][1]])) + 'Only' : '';
    return str.trim() || 'Zero Rupees Only';
  };

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [companiesRes, productsRes, customersRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/companies`),
          fetch(`${API_BASE_URL}/api/products`),
          fetch(`${API_BASE_URL}/api/customers/recent`)
        ]);

        const companiesData = await companiesRes.json();
        const productsData = await productsRes.json();
        const customersData = await customersRes.json();

        // Handle companies
        const companiesList = Array.isArray(companiesData) ? companiesData : [companiesData];
        setCompanies(companiesList);
        if (companiesList.length > 0) {
          const firstCompany = companiesList[0];
          setSelectedCompanyId(firstCompany.id);
          setCompany(firstCompany);
        }

        // Handle products
        const normalized = (Array.isArray(productsData) ? productsData : []).map(p => ({
          ...p,
          id: p.id || p._id || Math.random().toString(36).slice(2),
          productname: p.productname || p.name || 'Unnamed',
          hsn: p.hsn || p.hsn_code || '360410',
          rate_per_box: parseFloat(p.rate_per_box || p.rate || p.price || 0) || 0
        }));
        setProducts(normalized);

        setRecentCustomers(Array.isArray(customersData) ? customersData : []);
      } catch (err) {
        console.error('Failed to load initial data:', err);
      }
    };

    loadInitialData();
  }, []);

  useEffect(() => {
    if (!selectedCompanyId || companies.length === 0) return;

    const found = companies.find(c => String(c.id) === String(selectedCompanyId));
    if (found) {
      const normalized = {
        ...found,
        company_name: (found.company_name || 'NISHA TRADERS').trim(),
        address: (found.address || '').trim(),
        gstin: (found.gstin || '').trim(),           // Fixed: was "index.gstin"
        email: (found.email || '').trim(),
        logo_url: found.logo_url || '',
        signature_url: found.signature_url || '',
        bank_name: found.bank_name || 'Tamilnad Mercantile Bank Ltd.',
        branch: found.branch || 'SIVAKASI',
        account_no: found.account_no || '',
        ifsc_code: found.ifsc_code || ''
      };
      setCompany(normalized);

      const prefix = normalized.company_name
        .split(/\s+/)
        .map(w => w[0].toUpperCase())
        .slice(0, 2)
        .join('');

      // Backend already returns the correct NEXT bill number (e.g. NT-002)
      fetch(`${API_BASE_URL}/api/latest?prefix=${prefix}`)
        .then(r => {
          if (!r.ok) throw new Error('Failed to fetch next bill number');
          return r.json();
        })
        .then(data => {
          const nextBillNo = data.bill_no || `${prefix}-001`;

          setSuggestedBillNo(nextBillNo);
          setBillNumber(nextBillNo);     // This is what will be used
          setManualBillNo('');           // Clear manual entry
        })
        .catch(err => {
          console.error('Failed to load next bill number:', err);
          const fallback = `${prefix}-001`;
          setSuggestedBillNo(fallback);
          setBillNumber(fallback);
        });
    }
  }, [selectedCompanyId, companies]);

  // Auto revert to suggested when manual is cleared
  useEffect(() => {
    if (!manualBillNo.trim()) {
      setBillNumber(suggestedBillNo);
    }
  }, [manualBillNo, suggestedBillNo]);

  useEffect(() => {
    if (!search.trim()) {
      setProductSearchResults([]);
      return;
    }
    const q = search.toLowerCase();
    const results = products.filter(p =>
      p.productname.toLowerCase().includes(q) ||
      (p.hsn && p.hsn.toLowerCase().includes(q))
    );
    setProductSearchResults(results.slice(0, 30));
  }, [search, products]);

  useEffect(() => {
    const fetchStates = async () => {
      try {
        setLoadingStates(true);
        const response = await fetch(`${API_BASE_URL}/api/states`);
        if (!response.ok) throw new Error('Failed');
        const data = await response.json();
        setStates(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingStates(false);
      }
    };
    fetchStates();
  }, []);

  const addProductToCart = (p) => {
    if (!p) return;
    const newItem = { ...p, cases: 1, uniqueId: Date.now() + Math.random() };
    setCart(prev => [...prev, newItem]);
  };

  const updateCases = (uniqueId, val) => {
    const cases = Math.max(1, parseInt(val) || 1);
    setCart(cart.map(item => item.uniqueId === uniqueId ? { ...item, cases } : item));
  };

  const removeItem = (uniqueId) => {
    setCart(cart.filter(item => item.uniqueId !== uniqueId));
  };

  const subtotal = cart.reduce((s, i) => s + (i.cases || 0) * (i.rate_per_box || 0), 0);
  const totalCases = cart.reduce((s, i) => s + (i.cases || 0), 0);
  const packing = subtotal * (packingPercent / 100);
  const gstBaseAmount = subtotal + packing;
  const extraAmount = extraTaxable !== '' ? parseFloat(extraTaxable) || 0 : 0;
  const cgst = isIGST ? 0 : gstBaseAmount * 0.09;
  const sgst = isIGST ? 0 : gstBaseAmount * 0.09;
  const igst = isIGST ? gstBaseAmount * 0.18 : 0;
  const taxableValue = gstBaseAmount + extraAmount;
  const netAmount = Math.round(taxableValue + cgst + sgst + igst);

  const generateAndShowPDF = async () => {
    if (!customer.name || cart.length === 0) {
      alert('Please fill customer name and add at least one product');
      return;
    }
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl('');
    }
    setShowModal(true);
    try {
      const canvas = await html2canvas(invoiceRef.current, { scale: 3, useCORS: true });
      const img = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const width = pdf.internal.pageSize.getWidth();
      const height = (canvas.height * width) / canvas.width;
      pdf.addImage(img, 'PNG', 0, 0, width, height);
      const pdfBlob = pdf.output('blob');
      const pdfUrlTemp = URL.createObjectURL(pdfBlob);
      setPdfUrl(pdfUrlTemp);
      document.getElementById('pdf-preview').src = pdfUrlTemp;

      const formData = new FormData();
      formData.append('pdf', pdfBlob, `${billNumber || 'invoice'}.pdf`);
      formData.append('customer_name', customer.name);
      formData.append('customer_address', customer.address || '');
      formData.append('customer_gstin', customer.gstin || '');
      formData.append('customer_place', customer.place || '');
      formData.append('customer_state_code', isIGST ? 'other' : '33');
      formData.append('through', through);
      formData.append('destination', destination || '');
      formData.append('items', JSON.stringify(cart.map(item => ({
        productname: item.productname,
        brand: item.brand || '',
        hsn_code: item.hsn || '360410',
        cases: item.cases,
        rate_per_box: item.rate_per_box,
        per_case: 1
      }))));
      formData.append('subtotal', subtotal);
      formData.append('packing_amount', packing);
      formData.append('extra_amount', extraAmount);
      formData.append('cgst_amount', cgst);
      formData.append('sgst_amount', sgst);
      formData.append('igst_amount', igst);
      formData.append('net_amount', netAmount);
      formData.append('bill_no', manualBillNo || billNumber);

      const res = await fetch(`${API_BASE_URL}/api/bookings`, {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setBillNumber(data.booking.bill_no);
        alert(`Bill saved successfully! Bill No: ${data.booking.bill_no}`);
      } else {
        const error = await res.text();
        console.error("Save failed:", error);
        alert('PDF generated but failed to save on server');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to generate or save PDF');
    }
  };

  const handleDownloadPdf = () => {
    if (!pdfUrl) return alert('Generate preview first');
    const a = document.createElement('a');
    a.href = pdfUrl;
    a.download = `${billNumber || 'invoice'}.pdf`;
    a.click();
  };

  if (!company && companies.length === 0) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 text-center pt-32 text-2xl">Loading...</div>
      </div>
    );
  }

  const [addrLine1, addrLine2] = splitAddressIntoTwo(company?.address || '');
  const filteredCustomers = recentCustomers.filter(c =>
    c.customer_name.toLowerCase().includes(customerSearch.toLowerCase())
  );

  return (
    <>
      <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
        <Sidebar />
        <Logout />
        <div className="flex-1 p-6 overflow-auto max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-center text-blue-800 mb-6">Create Tax Invoice</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="bg-white p-4 rounded shadow">
              <label className="block text-sm font-medium mb-2">Select Company</label>
              <select className="w-full border rounded px-3 py-2 mb-4" value={selectedCompanyId || ''} onChange={e => setSelectedCompanyId(e.target.value)}>
                {companies.map(c => (
                  <option key={c.id} value={c.id}>{c.company_name || 'Unknown Company'}</option>
                ))}
              </select>

              <label className="block text-sm font-medium mb-2">Select Previous Customer</label>
              <div className="relative mb-5">
                <input
                  type="text"
                  placeholder="Type to search customer..."
                  value={customerSearch}
                  onChange={e => setCustomerSearch(e.target.value)}
                  onFocus={() => setShowCustomerDropdown(true)}
                  className="w-full px-4 py-2 border rounded"
                />
                {showCustomerDropdown && filteredCustomers.length > 0 && (
                  <div className="absolute z-20 w-full mt-1 bg-white border rounded shadow-lg max-h-64 overflow-y-auto">
                    {filteredCustomers.map((c, i) => (
                      <div
                        key={i}
                        className="p-3 hover:bg-blue-50 cursor-pointer border-b"
                        onClick={() => {
                          setCustomer({
                            name: c.customer_name,
                            address: c.customer_address || '',
                            gstin: c.customer_gstin || '',
                            place: c.customer_place || ''
                          });
                          setIsIGST(c.customer_state_code !== '33');
                          setCustomerSearch(c.customer_name);
                          setShowCustomerDropdown(false);
                        }}
                      >
                        <div className="font-medium">{c.customer_name}</div>
                        <div className="text-xs text-gray-600">
                          {c.customer_place} • {c.customer_gstin || 'No GSTIN'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button onClick={generateAndShowPDF} className="w-full bg-green-600 text-white py-3 rounded flex items-center justify-center gap-2 text-lg font-medium">
                <FaFilePdf /> Generate & Save Bill
              </button>
            </div>

            <div className="lg:col-span-2 bg-white p-6 rounded shadow">
              <h2 className="text-xl font-semibold mb-4">Customer Details</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* ========== IMPROVED BILL NUMBER INPUT ========== */}
                <div>
                  <label className="block text-sm font-medium mb-2">Bill Number *</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={manualBillNo || billNumber}
                      onChange={(e) => {
                        const val = e.target.value.toUpperCase().trim();
                        setManualBillNo(val);
                        setBillNumber(val);
                      }}
                      onFocus={(e) => e.target.select()}
                      placeholder={suggestedBillNo}
                      className="w-full px-4 py-3 border-2 rounded-lg bg-white text-black focus:outline-none focus:border-blue-600 text-xl font-bold tracking-wider"
                    />

                    {/* Show "Next" badge when using auto-generated */}
                    {!manualBillNo && billNumber === suggestedBillNo && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        <span className="text-xs text-gray-500">Next:</span>
                        <span className="bg-blue-100 text-blue-800 px-3 py-1.5 rounded-full text-sm font-bold">
                          {suggestedBillNo}
                        </span>
                      </div>
                    )}

                    {/* Show "Use Suggested" button when user types different */}
                    {manualBillNo && manualBillNo !== suggestedBillNo && (
                      <button
                        type="button"
                        onClick={() => {
                          setManualBillNo('');
                          setBillNumber(suggestedBillNo);
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-medium transition"
                      >
                        Use {suggestedBillNo}
                      </button>
                    )}
                  </div>

                  <div className="mt-2 text-xs text-gray-600">
                    {manualBillNo ? (
                      <span>Custom: <strong>{manualBillNo}</strong></span>
                    ) : (
                      <span>Auto: <strong>{suggestedBillNo}</strong> (recommended)</span>
                    )}
                    {manualBillNo && (
                      <button
                        onClick={() => {
                          setManualBillNo('');
                          setBillNumber(suggestedBillNo);
                        }}
                        className="ml-3 text-blue-600 hover:underline"
                      >
                        ← Revert to suggested
                      </button>
                    )}
                  </div>
                </div>
                {/* =============================================== */}

                <div className=''>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Place of Supply *</label>
                  {loadingStates ? (
                    <div className="w-full px-4 py-2 border rounded bg-gray-50 text-gray-500">Loading states...</div>
                  ) : (
                    <select
                      className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={customer.place}
                      onChange={(e) => {
                        const selectedState = states.find(s => s.state_name === e.target.value);
                        setCustomer({ ...customer, place: e.target.value });
                        if (selectedState) setIsIGST(selectedState.code !== '33');
                      }}
                    >
                      <option value="">-- Select State --</option>
                      {states.map((state) => (
                        <option key={state.code} value={state.state_name}>
                          {state.code} - {state.state_name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <FloatingLabelInput placeholder="Party Name *" value={customer.name} onChange={e => setCustomer({...customer, name: e.target.value})} />
                <FloatingLabelInput placeholder="Address" value={customer.address} onChange={e => setCustomer({...customer, address: e.target.value})} />
                <FloatingLabelInput placeholder="GSTIN" value={customer.gstin} onChange={e => setCustomer({...customer, gstin: e.target.value})} />
                <FloatingLabelInput placeholder="Through" value={through} onChange={e => setThrough(e.target.value)} />
                <FloatingLabelInput placeholder="Destination" value={destination} onChange={e => setDestination(e.target.value)} />
              </div>

              <div className="mb-6 flex gap-8">
                <label className="flex items-center gap-2">
                  <input type="radio" checked={!isIGST} onChange={() => setIsIGST(false)} /> Tamil Nadu (CGST+SGST)
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" checked={isIGST} onChange={() => setIsIGST(true)} /> Other State (IGST)
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FloatingLabelInput type="number" placeholder="Packing %" value={packingPercent} onChange={e => setPackingPercent(parseFloat(e.target.value) || 0)} />
                <FloatingLabelInput type="text" placeholder="Manual Taxable Value" value={extraTaxable} onChange={e => setExtraTaxable(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded p-4 shadow">
              <div className="relative mb-4">
                <FaSearch className="absolute left-3 top-3 text-gray-400" />
                <input value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-3 py-2 border rounded" placeholder="Search products..." />
              </div>
              {productSearchResults.length > 0 && (
                <div className="mt-3 max-h-60 overflow-y-auto border rounded">
                  {productSearchResults.map(p => (
                    <div key={p.id} className="p-2 flex justify-between border-b hover:bg-gray-50">
                      <div>
                        <div className="font-semibold">{p.productname}</div>
                        <div className="text-xs text-gray-500">₹{p.rate_per_box.toFixed(2)}/box</div>
                      </div>
                      <button onClick={() => addProductToCart(p)} className="bg-blue-600 text-white px-4 py-1 rounded">Add</button>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-6">
                <h4 className="font-bold mb-3">Cart ({cart.length} items)</h4>
                {cart.map(item => (
                  <div key={item.uniqueId} className="flex items-center gap-3 py-2 border-b">
                    <div className="flex-1">
                      <div className="font-medium">{item.productname}</div>
                      <div className="text-xs text-gray-600">₹{item.rate_per_box}/box</div>
                    </div>
                    <input type="number" min="1" value={item.cases} onChange={e => updateCases(item.uniqueId, e.target.value)} className="w-20 px-2 py-1 border rounded text-center" />
                    <button onClick={() => removeItem(item.uniqueId)} className="text-red-600"><FaTrash /></button>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded p-6 shadow">
              <h4 className="font-bold text-lg mb-4">Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Packing ({packingPercent}%)</span><span>₹{packing.toFixed(2)}</span></div>
                <div className="flex justify-between font-medium"><span>Taxable Value</span><span>₹{taxableValue.toFixed(2)}</span></div>
                {!isIGST && <div className="flex justify-between"><span>CGST 9%</span><span>₹{cgst.toFixed(2)}</span></div>}
                {!isIGST && <div className="flex justify-between"><span>SGST 9%</span><span>₹{sgst.toFixed(2)}</span></div>}
                {isIGST && <div className="flex justify-between"><span>IGST 18%</span><span>₹{igst.toFixed(2)}</span></div>}
                <div className="border-t pt-2 flex justify-between text-lg font-bold text-blue-700">
                  <span>NET AMOUNT</span>
                  <span>₹{netAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-10 rounded shadow" style={{ border: '1px solid #111' }}>
            <div
              ref={invoiceRef}
              style={{
                width: "210mm",
                padding: 20,
                background: "#fff",
                color: "#000",
                fontFamily: "Arial, sans-serif",
                boxSizing: "border-box",
              }}
            >
              <div style={{ border: "1px solid #000" }}>
                {/* HEADER */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    borderBottom: "1px double #000",
                    padding: "10px 20px",
                  }}
                >
                  <div style={{ width: "150px" }}>
                    {company?.logo_url && (
                      <img
                        src={company.logo_url}
                        style={{ width: "100%", height: 90, objectFit: "contain" }}
                      />
                    )}
                  </div>

                  <div
                    style={{
                      flex: 1,
                      textAlign: "center",
                      lineHeight: 1.4,
                    }}
                  >
                    <div style={{ fontSize: 32, fontWeight: 900, textTransform: "uppercase" }}>
                      {company?.company_name || "NISHA TRADERS"}
                    </div>
                    <div style={{ fontSize: 15 }}>{addrLine1}</div>
                    <div style={{ fontSize: 15 }}>{addrLine2}</div>
                    <div style={{ fontSize: 14 }}>
                      GSTIN: {company?.gstin || ""} &nbsp;&nbsp; Email: {company?.email || ""}
                    </div>
                  </div>

                  <div style={{ width: "150px" }} />
                </div>

                {/* CUSTOMER + BILL INFO */}
                <div style={{ display: "flex", borderBottom: "1px solid #000" }}>
                  <div
                    style={{
                      flex: 1,
                      padding: 15,
                      fontSize: 14,
                      borderRight: "1px solid #000",
                    }}
                  >
                    <strong>To:</strong>
                    <div style={{ fontSize: 15, fontWeight: 700, marginTop: 2 }}>
                      {customer.name || "______________________"}
                    </div>
                    {(customer.address || "").split("\n").map((line, i) => (
                      <div key={i}>{line}</div>
                    ))}

                    <div style={{ marginTop: 6 }}>GSTIN : {customer.gstin || "---"}</div>
                    <div style={{ marginTop: 6 }}>
                      Place of Supply :{" "}
                      {(() => {
                        if (!customer.place) return "33 - Tamil Nadu";
                        const s = states.find((st) => st.state_name === customer.place);
                        return s ? `${s.code} - ${s.state_name}` : customer.place;
                      })()}
                    </div>
                  </div>

                  <div style={{ width: 383, padding: 15, fontSize: 14 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        borderBottom: "1px solid #000",
                        paddingBottom: 6,
                      }}
                    >
                      <div>
                        No. : <strong>{billNumber}</strong>
                      </div>
                      <div>Date : {format(new Date(), "dd/MM/yyyy")}</div>
                    </div>

                    <div style={{ marginTop: 6 }}>Through : {through}</div>
                    <div style={{ marginTop: 6 }}>No. of Cases : {totalCases} Cases</div>
                    <div style={{ marginTop: 6 }}>
                      Destination : {destination || customer.place || "__________"}
                    </div>
                  </div>
                </div>

                {/* TABLE */}
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: 12,
                    textAlign: "center",
                  }}
                >
                  <thead>
                    <tr>
                      {[
                        ["COMPANY", "14%"],
                        [
                          <span>
                            PRODUCT NAME{" "}
                            <span style={{ fontSize: "15px", fontWeight: 900 }}>
                              HSN: 360410
                            </span>
                          </span>,
                          "35%",
                        ],
                        ["CASES", "8%"],
                        ["QUANTITY", "14%"],
                        ["RATE PER", "16%"],
                        ["AMOUNT", "20%"],
                      ].map(([label, width], index, arr) => (
                        <th
                          key={index}
                          style={{
                            padding: 6,
                            width,
                            background: "#f1f1f1",
                            fontWeight: 700,
                            borderRight: index === arr.length - 1 ? 0 : "1px solid #000",
                            borderBottom: "1px solid #000",
                          }}
                        >
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {cart.map((it) => (
                      <tr key={it.uniqueId}>
                        <td style={{ borderBottom: "1px solid #000", padding: 6 }}></td>

                        <td style={{ borderBottom: "1px solid #000", borderLeft: "1px solid #000", padding: 6 }}>
                          {it.productname}
                        </td>

                        <td style={{ borderBottom: "1px solid #000", borderLeft: "1px solid #000", padding: 6, fontWeight: 700 }}>
                          {it.cases}
                        </td>

                        <td style={{ borderBottom: "1px solid #000", borderLeft: "1px solid #000", padding: 6 }}>
                          {it.cases} Case
                        </td>

                        <td style={{ borderBottom: "1px solid #000", borderLeft: "1px solid #000", padding: 6 }}>
                          {(it.rate_per_box || 0).toFixed(2)}
                        </td>

                        <td
                          style={{
                            borderBottom: "1px solid #000", borderLeft: "1px solid #000",
                            padding: 6,
                            fontWeight: 700,
                          }}
                        >
                          {((it.cases || 0) * (it.rate_per_box || 0)).toFixed(2)}
                        </td>
                      </tr>
                    ))}

                    {/* AUTO BLANK ROWS UNTIL 10 */}
                    {Array.from({ length: Math.max(0, 10 - cart.length) }).map((_, i) => (
                      <tr key={"blank-" + i}>
                        <td style={{ borderBottom: "1px solid #000", padding: 12 }}>
                          &nbsp;
                        </td>
                        <td style={{ borderBottom: "1px solid #000", borderLeft: "1px solid #000", padding: 12 }}>&nbsp;</td>
                        <td style={{ borderBottom: "1px solid #000", borderLeft: "1px solid #000", padding: 12 }}>&nbsp;</td>
                        <td style={{ borderBottom: "1px solid #000", borderLeft: "1px solid #000", padding: 12 }}>&nbsp;</td>
                        <td style={{ borderBottom: "1px solid #000", borderLeft: "1px solid #000", padding: 12 }}>&nbsp;</td>
                        <td
                          style={{
                            borderBottom: "1px solid #000", borderLeft: "1px solid #000",
                            borderRight: 0,
                            padding: 12,
                          }}
                        >
                          &nbsp;
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {/* TOTAL + BANK */}
                <div style={{ display: "flex", borderBottom: "1px solid #000" }}>
                  <div
                    style={{
                      flex: 1,
                      fontSize: 12,
                      padding: 12,
                      borderRight: "1px solid #000",
                    }}
                  >
                    <div style={{ marginBottom: 6 }}>
                      <strong>Total Cases: {totalCases}</strong>
                    </div>

                    <div>
                      <strong>Our Bank Account:</strong>
                      <div>Bank: {company?.bank_name || "Tamilnad Mercantile Bank"}</div>
                      <div>Branch: {company?.branch || "SIVAKASI"}</div>
                      <div>A/c No.: {company?.account_no || ""}</div>
                      <div>IFSC: {company?.ifsc_code || ""}</div>
                    </div>
                  </div>

                  <div style={{ width: 383, padding: 12, fontSize: 12 }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <tbody>
                        <tr>
                          <td>Total</td>
                          <td style={{ textAlign: "right" }}>{subtotal.toFixed(2)}</td>
                        </tr>
                        <tr>
                          <td>Taxable Value</td>
                          <td style={{ textAlign: "right" }}>{taxableValue.toFixed(2)}</td>
                        </tr>
                        {!isIGST && (
                          <>
                            <tr>
                              <td>CGST 9%</td>
                              <td style={{ textAlign: "right" }}>{cgst.toFixed(2)}</td>
                            </tr>
                            <tr>
                              <td>SGST 9%</td>
                              <td style={{ textAlign: "right" }}>{sgst.toFixed(2)}</td>
                            </tr>
                          </>
                        )}
                        {isIGST && (
                          <tr>
                            <td>IGST 18%</td>
                            <td style={{ textAlign: "right" }}>{igst.toFixed(2)}</td>
                          </tr>
                        )}

                        <tr style={{ fontWeight: 800, borderTop: "1px solid #000", marginTop: 2 }}>
                          <td>NET AMOUNT</td>
                          <td style={{ textAlign: "right" }}>{netAmount.toFixed(2)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* AMOUNT IN WORDS */}
                <div
                  style={{
                    textAlign: "center",
                    padding: "10px 0",
                    borderBottom: "1px solid #000",
                    fontWeight: 700,
                  }}
                >
                  Rupees {numberToWords(netAmount)} Only
                </div>

                {/* TERMS + SIGN */}
                <div style={{ display: "flex" }}>
                  <div
                    style={{
                      flex: 1,
                      padding: 12,
                      fontSize: 12,
                      borderRight: "1px solid #000",
                    }}
                  >
                    <strong>TERMS & CONDITIONS:</strong>
                    <div>• Goods once sold cannot be taken back</div>
                    <div>• We are not responsible for damage / shortage</div>
                    <div>• Subject to SIVAKASI jurisdiction</div>
                    <div style={{ marginTop: 5 }}>• E.&O.E.</div>
                  </div>

                  <div
                    style={{
                      width: 383,
                      padding: 12,
                      fontSize: 14,
                      textAlign: "center",
                    }}
                  >
                    <div>For {company?.company_name || "NISHA TRADERS"}</div>

                    <div style={{ marginTop: 20, flex:1, justifyContent: 'center', paddingLeft: '30%' }}>
                      {company?.signature_url ? (
                        <img
                          src={company.signature_url}
                          style={{ height: 60, objectFit: "contain" }}
                        />
                      ) : (
                        <div style={{ borderTop: "1px solid #000", height: 60 }} />
                      )}
                    </div>

                    <div style={{ marginTop: 5, fontWeight: 700 }}>Partner / Manager</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Modal isOpen={showModal} onRequestClose={() => setShowModal(false)} className="bg-white rounded shadow-lg max-w-6xl mx-4 my-8" overlayClassName="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-4 flex justify-between items-center rounded-t">
              <h2 className="text-xl font-bold">Tax Invoice - {billNumber}</h2>
              <div className="flex gap-3">
                <button onClick={handleDownloadPdf} className="bg-green-600 px-4 py-2 rounded flex items-center gap-2"><FaDownload /> Download</button>
                <button onClick={() => setShowModal(false)} className="bg-red-600 px-4 py-2 rounded flex items-center gap-2"><FaTimes /> Close</button>
              </div>
            </div>
            <div style={{ width: '100%', height: '80vh', background: '#f2f2f2' }}>
              <iframe id="pdf-preview" title="PDF Preview" style={{ width: '100%', height: '100%', border: 0 }} src={pdfUrl || ''}></iframe>
            </div>
          </Modal>
        </div>
      </div>
    </>
  );
}