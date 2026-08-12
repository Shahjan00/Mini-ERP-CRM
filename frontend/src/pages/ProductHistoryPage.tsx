import { FormEvent, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ApiError, api, getStoredUser } from '../lib/api';
import type { PaginationMeta, Product, StockMovement } from '../types/domain';

const emptyMeta: PaginationMeta = {
  total: 0,
  page: 1,
  pageSize: 10,
  totalPages: 1,
};

function ProductHistoryPage() {
  const { productId } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>(emptyMeta);
  const [page, setPage] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    movementType: 'IN',
    quantity: '1',
    reason: '',
  });

  const loadData = async () => {
    if (!productId) {
      return;
    }

    try {
      setLoading(true);
      const [productResponse, movementResponse] = await Promise.all([
        api.getProduct(productId),
        api.getStockMovements(productId, { page, pageSize: 10 }),
      ]);

      setProduct(productResponse);
      setMovements(movementResponse.data);
      setMeta(movementResponse.meta);
      setError('');
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Unable to load product history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [page, productId]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!productId) {
      return;
    }

    try {
      setSaving(true);
      const user = getStoredUser();
      await api.adjustStock(productId, {
        movementType: form.movementType,
        quantity: Number(form.quantity),
        reason: form.reason,
        createdBy: user?.name ?? user?.email ?? 'Warehouse User',
      });

      setForm({
        movementType: 'IN',
        quantity: '1',
        reason: '',
      });
      await loadData();
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Unable to adjust stock');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p>Loading product inventory...</p>;
  }

  if (!product) {
    return <p>Product not found.</p>;
  }

  const isLowStock = product.currentStock <= product.minimumStock;

  const user = getStoredUser();
  const canAdjustStock = user?.role === 'ADMIN' || user?.role === 'WAREHOUSE';

  return (
    <div className="page-stack">
      <div className="panel-header">
        <div>
          <h2>{product.name}</h2>
          <p>{product.sku} · {product.category}</p>
        </div>
        <div className="header-actions">
          <Link className="secondary-button" to="/dashboard/products">
            Back
          </Link>
          <Link className="primary-button" to={`/dashboard/products/${product.id}/edit`}>
            Edit product
          </Link>
        </div>
      </div>

      {error ? <div className="error-banner">{error}</div> : null}

      <div className="detail-grid">
        <div className="panel detail-card">
          <h3>Inventory summary</h3>
          <dl>
            <div>
              <dt>Current stock</dt>
              <dd>
                {product.currentStock}
                {isLowStock ? <span className="stock-alert">Low stock</span> : null}
              </dd>
            </div>
            <div>
              <dt>Minimum stock</dt>
              <dd>{product.minimumStock}</dd>
            </div>
            <div>
              <dt>Unit price</dt>
              <dd>${Number(product.unitPrice).toFixed(2)}</dd>
            </div>
            <div>
              <dt>Warehouse location</dt>
              <dd>{product.warehouseLocation}</dd>
            </div>
          </dl>
        </div>

        <div className="panel detail-card">
          <h3>Stock adjustment</h3>
          {canAdjustStock ? (
            <form className="stack-form" onSubmit={handleSubmit}>
              <select
                value={form.movementType}
                onChange={(event) => setForm({ ...form, movementType: event.target.value })}
              >
              <option value="IN">Stock IN</option>
              <option value="OUT">Stock OUT</option>
            </select>
            <input
              required
              min="1"
              type="number"
              value={form.quantity}
              onChange={(event) => setForm({ ...form, quantity: event.target.value })}
            />
            <textarea
              rows={3}
              required
              placeholder="Reason for stock movement"
              value={form.reason}
              onChange={(event) => setForm({ ...form, reason: event.target.value })}
            />
            <button className="primary-button" type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Post adjustment'}
            </button>
          </form>
          ) : (
            <p>You do not have permission to adjust stock.</p>
          )}
        </div>
      </div>

      <div className="panel">
        <div className="panel-header compact">
          <div>
            <h3>Stock movement history</h3>
            <p>Every inventory change is recorded here.</p>
          </div>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Quantity</th>
                <th>Reason</th>
                <th>Created by</th>
              </tr>
            </thead>
            <tbody>
              {movements.length === 0 ? (
                <tr>
                  <td colSpan={5}>No stock movements found.</td>
                </tr>
              ) : null}

              {movements.map((movement) => (
                <tr key={movement.id}>
                  <td>{movement.createdAt.slice(0, 10)}</td>
                  <td>{movement.movementType}</td>
                  <td>{movement.quantity}</td>
                  <td>
                    {movement.reason}
                    {movement.salesChallan ? (
                      <div className="table-subtext">
                        Challan: {movement.salesChallan.challanNumber}
                      </div>
                    ) : null}
                  </td>
                  <td>{movement.createdBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pagination-row">
          <span>
            Page {meta.page} of {meta.totalPages} ({meta.total} records)
          </span>
          <div className="pagination-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page <= 1}
            >
              Previous
            </button>
            <button
              type="button"
              className="secondary-button"
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

export default ProductHistoryPage;
