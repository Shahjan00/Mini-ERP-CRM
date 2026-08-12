import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiError, api, getStoredUser } from '../lib/api';
import type { Product } from '../types/domain';

function Inventory() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await api.listProducts({
          q: search,
          lowStock: lowStockOnly,
          page: 1,
          pageSize: 50,
        });
        setProducts(response.data);
      } catch (requestError) {
        setError(requestError instanceof ApiError ? requestError.message : 'Unable to load inventory');
      } finally {
        setLoading(false);
      }
    };

    void loadProducts();
  }, [search, lowStockOnly]);

  const user = getStoredUser();
  const canEditProduct = user?.role === 'ADMIN' || user?.role === 'WAREHOUSE';

  return (
    <div>
      <div className="header">
        <h1>Inventory</h1>
        <div className="header-actions">
          {canEditProduct ? (
            <button className="btn btn-primary" onClick={() => navigate('/dashboard/products/new')}>
              Add Product
            </button>
          ) : null}
        </div>
      </div>

      <div className="content">
        <div className="filters">
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <label className="checkbox-field">
            <input
              type="checkbox"
              checked={lowStockOnly}
              onChange={(e) => setLowStockOnly(e.target.checked)}
            />
            Low stock only
          </label>
        </div>

        {error && <div className="error-message">{error}</div>}

        {loading ? (
          <div className="loading">Loading inventory...</div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Name</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <div className="empty-state">
                        <h3>No products found</h3>
                        <p>Add your first product to get started</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  products.map((product) => {
                    const isLowStock = product.currentStock <= (product.minimumStock || 10);
                    return (
                      <tr key={product.id}>
                        <td>{product.sku}</td>
                        <td>{product.name}</td>
                        <td>${Number(product.unitPrice).toFixed(2)}</td>
                        <td>{product.currentStock}</td>
                        <td>
                          {isLowStock ? (
                            <span className="badge badge-warning">Low Stock</span>
                          ) : (
                            <span className="badge badge-success">In Stock</span>
                          )}
                        </td>
                        <td>
                          {canEditProduct ? (
                            <button
                              className="btn btn-sm btn-secondary"
                              onClick={() => navigate(`/dashboard/products/${product.id}/edit`)}
                            >
                              Edit
                            </button>
                          ) : null}
                          <button
                            className="btn btn-sm btn-secondary"
                            onClick={() => navigate(`/dashboard/products/${product.id}/history`)}
                          >
                            History
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Inventory;
