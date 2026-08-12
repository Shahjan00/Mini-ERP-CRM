import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiError, api, getStoredUser } from '../lib/api';

interface Customer {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  unitPrice: string;
  currentStock: number;
}

interface ChallanItem {
  productId: string;
  quantity: number;
}

function CreateChallan() {
  const navigate = useNavigate();
  const user = getStoredUser();
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [challanNumber, setChallanNumber] = useState('');
  const [items, setItems] = useState<ChallanItem[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [customersResponse, productsResponse] = await Promise.all([
          api.listCustomers({ page: 1, pageSize: 100 }),
          api.listProducts({ page: 1, pageSize: 100 }),
        ]);
        setCustomers(customersResponse.data);
        setProducts(productsResponse.data);
      } catch (requestError) {
        setError(requestError instanceof ApiError ? requestError.message : 'Unable to load data');
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, []);

  const addItem = () => {
    if (products.length > 0) {
      setItems([...items, { productId: products[0].id, quantity: 1 }]);
    }
  };

  const updateItem = (index: number, field: keyof ChallanItem, value: string | number) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setItems(updatedItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCustomerId || !challanNumber || items.length === 0) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      
      await api.createChallan({
        challanNumber,
        customerId: selectedCustomerId,
        createdBy: user?.name || 'Unknown',
        items,
      });
      
      navigate('/dashboard/challans');
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Unable to create challan');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  const selectedProduct = (productId: string) => products.find(p => p.id === productId);

  return (
    <div>
      <div className="header">
        <h1>Create Sales Challan</h1>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={() => navigate('/dashboard/challans')}>
            Cancel
          </button>
        </div>
      </div>

      <div className="content">
        {error && <div className="error-message">{error}</div>}

        <form className="form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>
                Challan Number <span className="required">*</span>
              </label>
              <input
                type="text"
                value={challanNumber}
                onChange={(e) => setChallanNumber(e.target.value)}
                required
                placeholder="e.g., CH-2024-001"
              />
            </div>
            <div className="form-group">
              <label>
                Customer <span className="required">*</span>
              </label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                required
              >
                <option value="">Select customer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ marginTop: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600' }}>Items</h3>
              <button type="button" className="btn btn-sm btn-secondary" onClick={addItem}>
                + Add Item
              </button>
            </div>

            {items.length === 0 ? (
              <div className="empty-state">
                <h3>No items added</h3>
                <p>Add at least one product to create a challan</p>
              </div>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Price</th>
                      <th>Stock</th>
                      <th>Quantity</th>
                      <th>Total</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => {
                      const product = selectedProduct(item.productId);
                      const total = product ? Number(product.unitPrice) * item.quantity : 0;
                      return (
                        <tr key={index}>
                          <td>
                            <select
                              value={item.productId}
                              onChange={(e) => updateItem(index, 'productId', e.target.value)}
                              style={{ minWidth: '200px' }}
                            >
                              {products.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name} ({p.sku})
                                </option>
                              ))}
                            </select>
                          </td>
                          <td>${product ? Number(product.unitPrice).toFixed(2) : '-'}</td>
                          <td>{product ? product.currentStock : '-'}</td>
                          <td>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                              style={{ width: '80px' }}
                            />
                          </td>
                          <td>${total.toFixed(2)}</td>
                          <td>
                            <button
                              type="button"
                              className="btn btn-sm btn-danger"
                              onClick={() => removeItem(index)}
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/dashboard/challans')}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting || items.length === 0}>
              {submitting ? 'Creating...' : 'Create Challan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateChallan;
