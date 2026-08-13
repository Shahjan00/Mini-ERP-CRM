import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  MapPin,
  Edit2,
  ArrowUpDown,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { api } from '../services/api';
import { Product } from '../types';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';

export const Products: React.FC = () => {
  const { hasRole } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [isLowStockOnly, setIsLowStockOnly] = useState(
    searchParams.get('isLowStock') === 'true'
  );

  // Pagination state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Add / Edit Product Modal State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [productForm, setProductForm] = useState({
    name: '',
    sku: '',
    category: 'Electronics',
    unitPrice: 100,
    currentStock: 0,
    minStockAlert: 5,
    location: '',
  });
  const [productFormError, setProductFormError] = useState('');
  const [productSubmitting, setProductSubmitting] = useState(false);

  // Stock Adjustment Modal State
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [stockForm, setStockForm] = useState({
    quantity: 10,
    movementType: 'IN' as 'IN' | 'OUT',
    reason: '',
  });
  const [stockFormError, setStockFormError] = useState('');
  const [stockSubmitting, setStockSubmitting] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(search && { search }),
        ...(categoryFilter && { category: categoryFilter }),
        ...(isLowStockOnly && { isLowStock: 'true' }),
      });

      const res: any = await api.get(`/products?${params}`);
      if (res.success) {
        setProducts(res.data);
        setTotalPages(res.meta?.totalPages || 1);
      }
    } catch (err) {
      console.error('Error fetching products', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [page, search, categoryFilter, isLowStockOnly]);

  const openAddProductModal = () => {
    setEditingProduct(null);
    setProductForm({
      name: '',
      sku: '',
      category: 'Electronics',
      unitPrice: 500,
      currentStock: 10,
      minStockAlert: 5,
      location: 'Rack A-01',
    });
    setProductFormError('');
    setIsProductModalOpen(true);
  };

  const openEditProductModal = (prod: Product) => {
    setEditingProduct(prod);
    setProductForm({
      name: prod.name,
      sku: prod.sku,
      category: prod.category,
      unitPrice: prod.unitPrice,
      currentStock: prod.currentStock,
      minStockAlert: prod.minStockAlert,
      location: prod.location,
    });
    setProductFormError('');
    setIsProductModalOpen(true);
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProductFormError('');
    setProductSubmitting(true);

    try {
      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, {
          name: productForm.name,
          sku: productForm.sku,
          category: productForm.category,
          unitPrice: Number(productForm.unitPrice),
          minStockAlert: Number(productForm.minStockAlert),
          location: productForm.location,
        });
      } else {
        await api.post('/products', {
          ...productForm,
          unitPrice: Number(productForm.unitPrice),
          currentStock: Number(productForm.currentStock),
          minStockAlert: Number(productForm.minStockAlert),
        });
      }
      setIsProductModalOpen(false);
      fetchProducts();
    } catch (err: any) {
      setProductFormError(err.message || 'Failed to save product');
    } finally {
      setProductSubmitting(false);
    }
  };

  const openStockModal = (prod: Product) => {
    setSelectedProduct(prod);
    setStockForm({
      quantity: 5,
      movementType: 'IN',
      reason: 'Inward Purchase Stock Intake',
    });
    setStockFormError('');
    setIsStockModalOpen(true);
  };

  const handleStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStockFormError('');
    setStockSubmitting(true);

    try {
      if (!selectedProduct) return;
      await api.post('/inventory/adjust', {
        productId: selectedProduct.id,
        quantity: Number(stockForm.quantity),
        movementType: stockForm.movementType,
        reason: stockForm.reason,
      });
      setIsStockModalOpen(false);
      fetchProducts();
    } catch (err: any) {
      setStockFormError(err.message || 'Stock adjustment failed');
    } finally {
      setStockSubmitting(false);
    }
  };

  const canManageCatalog = hasRole(['ADMIN', 'WAREHOUSE']);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Product & Inventory Catalog</h1>
          <p className="text-sm text-slate-400">
            Monitor SKU stock levels, warehouse locations, and perform stock adjustments.
          </p>
        </div>

        {canManageCatalog && (
          <button
            onClick={openAddProductModal}
            className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-sm shadow-lg shadow-sky-600/20 flex items-center justify-center gap-2 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Add New Product
          </button>
        )}
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search products by name, SKU, or warehouse location..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>

        <div className="flex gap-2 items-center">
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            className="bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 px-3 py-2 focus:outline-none focus:border-sky-500"
          >
            <option value="">All Categories</option>
            <option value="Electronics">Electronics</option>
            <option value="Packaging">Packaging</option>
            <option value="Fasteners">Fasteners</option>
            <option value="Industrial Supplies">Industrial Supplies</option>
          </select>

          <button
            onClick={() => {
              setIsLowStockOnly(!isLowStockOnly);
              setPage(1);
            }}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border ${
              isLowStockOnly
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Low Stock Only
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950 text-xs font-semibold uppercase text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Product & SKU</th>
                <th className="px-5 py-3.5">Category</th>
                <th className="px-5 py-3.5">Unit Price</th>
                <th className="px-5 py-3.5">Current Stock</th>
                <th className="px-5 py-3.5">Location</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-500">
                    Loading product catalog...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-500">
                    No products found matching criteria.
                  </td>
                </tr>
              ) : (
                products.map((prod) => {
                  const isLow = prod.currentStock <= prod.minStockAlert;
                  return (
                    <tr key={prod.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-100">{prod.name}</div>
                        <div className="text-xs font-mono text-sky-400 mt-0.5">{prod.sku}</div>
                      </td>

                      <td className="px-5 py-4">
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 border border-slate-700 text-slate-300">
                          {prod.category}
                        </span>
                      </td>

                      <td className="px-5 py-4 font-semibold text-slate-100">
                        ₹{prod.unitPrice.toLocaleString('en-IN')}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-bold text-sm ${
                              isLow ? 'text-rose-400' : 'text-emerald-400'
                            }`}
                          >
                            {prod.currentStock} units
                          </span>

                          {isLow && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full">
                              <AlertTriangle className="w-3 h-3" />
                              Low Stock (&lt;={prod.minStockAlert})
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-xs text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-500" />
                          {prod.location}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {canManageCatalog && (
                            <>
                              <button
                                onClick={() => openStockModal(prod)}
                                className="p-1.5 rounded-lg bg-slate-800 text-emerald-400 hover:bg-slate-700 transition-colors flex items-center gap-1 text-xs px-2 font-medium"
                                title="Adjust Stock (IN/OUT)"
                              >
                                <ArrowUpDown className="w-3.5 h-3.5" />
                                Adjust Stock
                              </button>

                              <button
                                onClick={() => openEditProductModal(prod)}
                                className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-amber-400 hover:bg-slate-700 transition-colors"
                                title="Edit Product Details"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="px-5 py-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Product Modal */}
      <Modal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        title={editingProduct ? 'Edit Product Details' : 'Add New Product to Catalog'}
      >
        <form onSubmit={handleProductSubmit} className="space-y-4">
          {productFormError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
              {productFormError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Product Name *</label>
            <input
              type="text"
              required
              value={productForm.name}
              onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
              placeholder="e.g. Industrial Wireless Barcode Scanner 2D"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">SKU / Code *</label>
              <input
                type="text"
                required
                value={productForm.sku}
                onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                placeholder="SKU-SCN-001"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 font-mono focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Category *</label>
              <select
                value={productForm.category}
                onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-sky-500"
              >
                <option value="Electronics">Electronics</option>
                <option value="Packaging">Packaging</option>
                <option value="Fasteners">Fasteners</option>
                <option value="Industrial Supplies">Industrial Supplies</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Unit Price (₹) *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={productForm.unitPrice}
                onChange={(e) => setProductForm({ ...productForm, unitPrice: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-sky-500"
              />
            </div>

            {!editingProduct && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Initial Stock</label>
                <input
                  type="number"
                  min="0"
                  value={productForm.currentStock}
                  onChange={(e) =>
                    setProductForm({ ...productForm, currentStock: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-sky-500"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Min Stock Alert Qty
              </label>
              <input
                type="number"
                min="0"
                value={productForm.minStockAlert}
                onChange={(e) =>
                  setProductForm({ ...productForm, minStockAlert: Number(e.target.value) })
                }
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Warehouse Location / Bin *
            </label>
            <input
              type="text"
              required
              value={productForm.location}
              onChange={(e) => setProductForm({ ...productForm, location: e.target.value })}
              placeholder="e.g. Rack A-04, Bay 2"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsProductModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={productSubmitting}
              className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-sm shadow-lg shadow-sky-600/20 disabled:opacity-50"
            >
              {productSubmitting ? 'Saving...' : editingProduct ? 'Update Product' : 'Add Product'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Manual Stock Adjustment Modal */}
      <Modal
        isOpen={isStockModalOpen}
        onClose={() => setIsStockModalOpen(false)}
        title={`Adjust Inventory Stock: ${selectedProduct?.name}`}
      >
        <form onSubmit={handleStockSubmit} className="space-y-4">
          {stockFormError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
              {stockFormError}
            </div>
          )}

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400">Current Stock Level</div>
              <div className="text-lg font-bold text-slate-100">{selectedProduct?.currentStock} units</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-400">SKU Code</div>
              <div className="text-xs font-mono font-bold text-sky-400">{selectedProduct?.sku}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Movement Type</label>
              <select
                value={stockForm.movementType}
                onChange={(e) =>
                  setStockForm({ ...stockForm, movementType: e.target.value as 'IN' | 'OUT' })
                }
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-sky-500"
              >
                <option value="IN">IN (+ Add Stock)</option>
                <option value="OUT">OUT (- Remove Stock)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Quantity *</label>
              <input
                type="number"
                min="1"
                required
                value={stockForm.quantity}
                onChange={(e) => setStockForm({ ...stockForm, quantity: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Reason / Note *</label>
            <textarea
              required
              rows={2}
              value={stockForm.reason}
              onChange={(e) => setStockForm({ ...stockForm, reason: e.target.value })}
              placeholder="e.g. Received shipment PO-2026-004 OR Damaged goods written off"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsStockModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={stockSubmitting}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow-lg shadow-emerald-600/20 disabled:opacity-50"
            >
              {stockSubmitting ? 'Updating...' : 'Confirm Stock Movement'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
