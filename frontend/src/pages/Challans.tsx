import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiError, api, getStoredUser } from '../lib/api';

interface Challan {
  id: string;
  challanNumber: string;
  customer: { name: string };
  status: string;
  totalAmount: number;
  createdAt: string;
}

function Challans() {
  const navigate = useNavigate();
  const [challans, setChallans] = useState<Challan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    const loadChallans = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await api.listChallans({
          q: search,
          status,
          page: 1,
          pageSize: 50,
        });
        setChallans(response.data);
      } catch (requestError) {
        setError(requestError instanceof ApiError ? requestError.message : 'Unable to load challans');
      } finally {
        setLoading(false);
      }
    };

    void loadChallans();
  }, [search, status]);

  const user = getStoredUser();
  const canCreateChallan = user?.role === 'ADMIN' || user?.role === 'SALES';

  return (
    <div>
      <div className="header">
        <h1>Sales Challans</h1>
        <div className="header-actions">
          {canCreateChallan ? (
            <button className="btn btn-primary" onClick={() => navigate('/dashboard/challans/new')}>
              Create Challan
            </button>
          ) : null}
        </div>
      </div>

      <div className="content">
        <div className="filters">
          <input
            type="text"
            placeholder="Search challans..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All Status</option>
            <option value="DRAFT">Draft</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        {error && <div className="error-message">{error}</div>}

        {loading ? (
          <div className="loading">Loading challans...</div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Challan No</th>
                  <th>Customer</th>
                  <th>Status</th>
                  <th>Total Amount</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {challans.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <div className="empty-state">
                        <h3>No challans found</h3>
                        <p>Create your first sales challan to get started</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  challans.map((challan) => (
                    <tr key={challan.id}>
                      <td>{challan.challanNumber}</td>
                      <td>{challan.customer?.name || '-'}</td>
                      <td>
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
                      </td>
                      <td>${Number(challan.totalAmount).toFixed(2)}</td>
                      <td>{new Date(challan.createdAt).toLocaleDateString()}</td>
                      <td>
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => navigate(`/dashboard/challans/${challan.id}`)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Challans;
