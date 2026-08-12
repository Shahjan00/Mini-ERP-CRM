import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ApiError, api, getStoredUser } from '../lib/api';

interface ChallanDetail {
  id: string;
  challanNumber: string;
  customer: { name: string };
  status: string;
  totalAmount: number;
  createdAt: string;
  items: Array<{
    id: string;
    product: { name: string; sku: string };
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
}

function ChallanDetail() {
  const { challanId } = useParams<{ challanId: string }>();
  const navigate = useNavigate();
  const user = getStoredUser();
  
  const [challan, setChallan] = useState<ChallanDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const loadChallan = async () => {
      if (!challanId) return;
      
      try {
        setLoading(true);
        setError('');
        const data = await api.getChallan(challanId);
        setChallan(data);
      } catch (requestError) {
        setError(requestError instanceof ApiError ? requestError.message : 'Unable to load challan');
      } finally {
        setLoading(false);
      }
    };

    void loadChallan();
  }, [challanId]);

  const handleConfirm = async () => {
    if (!challanId) return;
    
    try {
      setActionLoading(true);
      setError('');
      await api.confirmChallan(challanId, { createdBy: user?.name || 'Unknown' });
      // Reload the challan
      const data = await api.getChallan(challanId);
      setChallan(data);
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Unable to confirm challan');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!challanId) return;
    
    if (!window.confirm('Are you sure you want to cancel this challan?')) return;
    
    try {
      setActionLoading(true);
      setError('');
      await api.cancelChallan(challanId);
      // Reload the challan
      const data = await api.getChallan(challanId);
      setChallan(data);
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Unable to cancel challan');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading challan...</div>;
  }

  if (error && !challan) {
    return <div className="error-message">{error}</div>;
  }

  if (!challan) {
    return <div className="empty-state">Challan not found</div>;
  }

  return (
    <div>
      <div className="header">
        <h1>Challan {challan.challanNumber}</h1>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={() => navigate('/dashboard/challans')}>
            Back
          </button>
          {challan.status === 'DRAFT' && (
            <>
              <button
                className="btn btn-primary"
                onClick={handleConfirm}
                disabled={actionLoading}
              >
                {actionLoading ? 'Confirming...' : 'Confirm'}
              </button>
              <button
                className="btn btn-danger"
                onClick={handleCancel}
                disabled={actionLoading}
              >
                {actionLoading ? 'Cancelling...' : 'Cancel'}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="content">
        {error && <div className="error-message">{error}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
          <div className="table-container">
            <div style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600' }}>Challan Details</h3>
            </div>
            <div style={{ padding: '16px' }}>
              <div style={{ marginBottom: '12px' }}>
                <strong>Status: </strong>
                <span
                  className={`badge badge-${
                    challan.status === 'CONFIRMED'
                      ? 'success'
                      : challan.status === 'CANCELLED'
                      ? 'danger'
                      : 'info'
                  }`}
                >
                  {challan.status}
                </span>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <strong>Customer: </strong>
                {challan.customer?.name || '-'}
              </div>
              <div style={{ marginBottom: '12px' }}>
                <strong>Date: </strong>
                {new Date(challan.createdAt).toLocaleString()}
              </div>
              <div>
                <strong>Total Amount: </strong>
                ${Number(challan.totalAmount).toFixed(2)}
              </div>
            </div>
          </div>

          <div className="table-container">
            <div style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600' }}>Items</h3>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Quantity</th>
                  <th>Unit Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {challan.items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.product?.name || '-'}</td>
                    <td>{item.product?.sku || '-'}</td>
                    <td>{item.quantity}</td>
                    <td>${Number(item.unitPrice).toFixed(2)}</td>
                    <td>${Number(item.totalPrice).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {challan.status === 'CONFIRMED' && (
          <div className="table-container">
            <div style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600' }}>Stock Impact</h3>
            </div>
            <div style={{ padding: '16px' }}>
              <p style={{ color: 'var(--success)' }}>
                ✓ Stock has been updated for all items in this challan
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ChallanDetail;
