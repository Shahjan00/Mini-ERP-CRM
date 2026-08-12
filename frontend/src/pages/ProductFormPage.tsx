import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ApiError, api } from '../lib/api';

const initialForm = {
  name: '',
  sku: '',
  category: '',
  unitPrice: '0',
  minimumStock: '0',
  warehouseLocation: '',
};

function ProductFormPage() {
  const { productId } = useParams();
  const isEditMode = Boolean(productId);
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!productId) {
      return;
    }

    const loadProduct = async () => {
      try {
        setLoading(true);
        const product = await api.getProduct(productId);
        setForm({
          name: product.name,
          sku: product.sku,
          category: product.category,
          unitPrice: String(product.unitPrice),
          minimumStock: String(product.minimumStock),
          warehouseLocation: product.warehouseLocation,
        });
      } catch (requestError) {
        setError(requestError instanceof ApiError ? requestError.message : 'Unable to load product');
      } finally {
        setLoading(false);
      }
    };

    void loadProduct();
  }, [productId]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError('');
      const payload = {
        ...form,
        unitPrice: Number(form.unitPrice),
        minimumStock: Number(form.minimumStock),
      };

      if (productId) {
        await api.updateProduct(productId, payload);
        navigate(`/dashboard/products/${productId}/history`);
        return;
      }

      const product = await api.createProduct(payload);
      navigate(`/dashboard/products/${product.id}/history`);
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Unable to save product');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p>Loading product form...</p>;
  }

  return (
    <div className="page-stack">
      <div className="panel-header">
        <div>
          <h2>{isEditMode ? 'Edit product' : 'Add product'}</h2>
          <p>Maintain product identity, pricing, stock threshold, and warehouse location.</p>
        </div>
        <Link className="secondary-button" to="/dashboard/products">
          Back to list
        </Link>
      </div>

      <form className="panel form-grid" onSubmit={handleSubmit}>
        {error ? <div className="error-banner form-span-2">{error}</div> : null}

        <label>
          Product name
          <input
            required
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
          />
        </label>

        <label>
          SKU
          <input
            required
            value={form.sku}
            onChange={(event) => setForm({ ...form, sku: event.target.value })}
          />
        </label>

        <label>
          Category
          <input
            required
            value={form.category}
            onChange={(event) => setForm({ ...form, category: event.target.value })}
          />
        </label>

        <label>
          Unit price
          <input
            required
            min="0"
            step="0.01"
            type="number"
            value={form.unitPrice}
            onChange={(event) => setForm({ ...form, unitPrice: event.target.value })}
          />
        </label>

        <label>
          Minimum stock
          <input
            required
            min="0"
            type="number"
            value={form.minimumStock}
            onChange={(event) => setForm({ ...form, minimumStock: event.target.value })}
          />
        </label>

        <label>
          Warehouse location
          <input
            required
            value={form.warehouseLocation}
            onChange={(event) => setForm({ ...form, warehouseLocation: event.target.value })}
          />
        </label>

        <div className="form-actions form-span-2">
          <button className="primary-button" type="submit" disabled={saving}>
            {saving ? 'Saving...' : isEditMode ? 'Update product' : 'Create product'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ProductFormPage;
