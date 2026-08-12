import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ApiError, api, getStoredUser } from '../lib/api';
import type { PaginationMeta, Product } from '../types/domain';

const emptyMeta: PaginationMeta = {
  total: 0,
  page: 1,
  pageSize: 10,
  totalPages: 1,
};

function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>(emptyMeta);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        const response = await api.listProducts({
          q: search,
          lowStock: lowStockOnly,
          page,
          pageSize: 10,
        });

        setProducts(response.data);
        setMeta(response.meta);
        setError('');
      } catch (requestError) {
        setError(requestError instanceof ApiError ? requestError.message : 'Unable to load products');
      } finally {
        setLoading(false);
      }
    };

    void loadProducts();
  }, [lowStockOnly, page, search]);

  const user = getStoredUser();
  const canEditProduct = user?.role === 'ADMIN' || user?.role === 'WAREHOUSE';

  return (
    <div>
      <div className="header">
        <h1>Products</h1>
        <div className="header-actions">
          {canEditProduct ? (
            <Link className="btn btn-primary" to="/dashboard/products/new">
              Add Product
            </Link>
          ) : null}
        </div>
      </div>

      <div className="content">
        <div className="filters">
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search by name, SKU, category, warehouse"
          />
          <label className="checkbox-field">
            <input
              type="checkbox"
              checked={lowStockOnly}
              onChange={(event) => {
                setLowStockOnly(event.target.checked);
                setPage(1);
              }}
            />
            Show low-stock only
          </label>
        </div>

        {error && <div className="error-message">{error}</div>}

        {loading ? (
          <div className="loading">Loading products...</div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th>Unit price</th>
                  <th>Stock</th>
                  <th>Warehouse</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <div className="empty-state">
                        <h3>No products found</h3>
                        <p>Add your first product to get started</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  products.map((product) => {
                    const isLowStock = product.currentStock <= product.minimumStock;

                    return (
                      <tr key={product.id}>
                        <td>{product.name}</td>
                        <td>{product.sku}</td>
                        <td>{product.category}</td>
                        <td>${Number(product.unitPrice).toFixed(2)}</td>
                        <td>
                          <strong>{product.currentStock}</strong>
                          {isLowStock && <span className="badge badge-warning">Low stock</span>}
                        </td>
                        <td>{product.warehouseLocation}</td>
                        <td>
                          <Link to={`/dashboard/products/${product.id}/history`}>Stock</Link>
                          {canEditProduct ? (
                            <>
                              {' | '}
                              <Link to={`/dashboard/products/${product.id}/edit`}>Edit</Link>
                            </>
                          ) : null}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="pagination-row">
          <span>
            Page {meta.page} of {meta.totalPages} ({meta.total} records)
          </span>
          <div className="pagination-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page <= 1}
            >
              Previous
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setPage((current) => Math.min(meta.totalPages, current + 1))}
              disabled={page >= meta.totalPages}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductsPage;
