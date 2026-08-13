import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, AlertTriangle, CheckCircle, FileText } from 'lucide-react';
import { api } from '../services/api';
import { Customer, Product } from '../types';

interface LineItem {
  productId: string;
  quantity: number;
  unitPrice: number;
}

export const ChallanForm: React.FC = () => {
  const navigate = useNavigate();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);

  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [items, setItems] = useState<LineItem[]>([
    { productId: '', quantity: 1, unitPrice: 0 },
  ]);
  const [status, setStatus] = useState<'DRAFT' | 'CONFIRMED'>('DRAFT');

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [custRes, prodRes]: [any, any] = await Promise.all([
          api.get('/customers?limit=100'),
          api.get('/products?limit=100'),
        ]);

        if (custRes.success) setCustomers(custRes.data);
        if (prodRes.success) setProducts(prodRes.data);

        if (custRes.data.length > 0) {
          setSelectedCustomerId(custRes.data[0].id);
        }

        if (prodRes.data.length > 0) {
          setItems([
            {
              productId: prodRes.data[0].id,
              quantity: 1,
              unitPrice: prodRes.data[0].unitPrice,
            },
          ]);
        }
      } catch (err) {
        console.error('Failed to load customers or products catalog', err);
      } finally {
        setLoadingInitial(false);
      }
    };

    fetchData();
  }, []);

  const handleProductChange = (index: number, productId: string) => {
    const selectedProd = products.find((p) => p.id === productId);
    const updatedItems = [...items];
    updatedItems[index] = {
      ...updatedItems[index],
      productId,
      unitPrice: selectedProd ? selectedProd.unitPrice : 0,
    };
    setItems(updatedItems);
  };

  const handleQuantityChange = (index: number, quantity: number) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], quantity: Math.max(1, quantity) };
    setItems(updatedItems);
  };

  const handlePriceChange = (index: number, price: number) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], unitPrice: Math.max(0, price) };
    setItems(updatedItems);
  };

  const addLineItem = () => {
    const defaultProd = products[0];
    setItems([
      ...items,
      {
        productId: defaultProd ? defaultProd.id : '',
        quantity: 1,
        unitPrice: defaultProd ? defaultProd.unitPrice : 0,
      },
    ]);
  };

  const removeLineItem = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const grandTotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedCustomerId) {
      setError('Please select a target customer.');
      return;
    }

    if (items.some((i) => !i.productId)) {
      setError('Please ensure all line items have a selected product.');
      return;
    }

    setSubmitting(true);

    try {
      const res: any = await api.post('/challans', {
        customerId: selectedCustomerId,
        status,
        items,
      });

      if (res.success) {
        navigate(`/challans/${res.data.id}`);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create sales challan');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingInitial) {
    return (
      <div className="p-8 text-center text-slate-400">
        <div className="inline-block animate-spin w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full mb-2"></div>
        <p className="text-sm">Initializing sales challan builder...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link
          to="/challans"
          className="inline-flex items-center gap-1 text-xs font-semibold text-sky-400 hover:underline mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Sales Challans
        </Link>
        <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
          Create New Sales Challan
        </h1>
        <p className="text-sm text-slate-400">
          Assemble customer order items, review live inventory stock levels, and generate challan.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Customer & Status Selection Panel */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Select Customer Business *
            </label>
            <select
              required
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-sky-500"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.businessName} ({c.name} - {c.customerType})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Initial Order Status *
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as 'DRAFT' | 'CONFIRMED')}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-sky-500"
            >
              <option value="DRAFT">DRAFT (Does not deduct stock immediately)</option>
              <option value="CONFIRMED">CONFIRMED (Atomically reduces stock & logs OUT movement)</option>
            </select>
          </div>
        </div>

        {/* Product Line Items Panel */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <FileText className="w-4 h-4 text-sky-400" />
              Order Items & Pricing Snapshots
            </h3>
            <button
              type="button"
              onClick={addLineItem}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400 font-semibold text-xs flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Line Item
            </button>
          </div>

          <div className="space-y-3">
            {items.map((item, index) => {
              const selectedProd = products.find((p) => p.id === item.productId);
              const isInsufficient = selectedProd && selectedProd.currentStock < item.quantity;
              const lineTotal = item.quantity * item.unitPrice;

              return (
                <div
                  key={index}
                  className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-3"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                    {/* Product Selector */}
                    <div className="sm:col-span-5">
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                        Product Item #{index + 1}
                      </label>
                      <select
                        value={item.productId}
                        onChange={(e) => handleProductChange(index, e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-sky-500"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.sku}) - Stock: {p.currentStock}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Quantity */}
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                        Quantity
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleQuantityChange(index, Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-sky-500"
                      />
                    </div>

                    {/* Unit Price */}
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                        Unit Price (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) => handlePriceChange(index, Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-sky-500"
                      />
                    </div>

                    {/* Line Total */}
                    <div className="sm:col-span-2 text-right">
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                        Line Total
                      </div>
                      <div className="text-sm font-bold text-slate-100 py-1">
                        ₹{lineTotal.toLocaleString('en-IN')}
                      </div>
                    </div>

                    {/* Delete Item */}
                    <div className="sm:col-span-1 text-right">
                      <button
                        type="button"
                        onClick={() => removeLineItem(index)}
                        disabled={items.length === 1}
                        className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-900 disabled:opacity-30 transition-colors"
                        title="Remove line item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Stock Warning Banner for this line item */}
                  {selectedProd && (
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-900">
                      <div className="text-slate-400">
                        Available Stock: <span className="font-bold text-slate-200">{selectedProd.currentStock} units</span> ({selectedProd.location})
                      </div>
                      {isInsufficient && status === 'CONFIRMED' && (
                        <div className="text-rose-400 font-semibold flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Stock insufficient for immediate confirmation!
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Grand Total Summary Box */}
          <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-400">
              Total Order Quantity: <span className="font-bold text-slate-100">{totalQuantity} items</span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Grand Total:</span>
              <span className="text-2xl font-bold text-sky-400">₹{grandTotal.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex justify-end gap-3">
          <Link
            to="/challans"
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-sm shadow-lg shadow-sky-600/25 flex items-center gap-2 disabled:opacity-50"
          >
            {submitting ? 'Generating Challan...' : `Save Sales Challan as ${status}`}
          </button>
        </div>
      </form>
    </div>
  );
};
