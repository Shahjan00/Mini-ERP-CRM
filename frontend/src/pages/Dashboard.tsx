import { useEffect, useState } from 'react';
import { api } from '../lib/api';

interface DashboardStats {
  totalCustomers: number;
  totalProducts: number;
  lowStockProducts: number;
  recentChallans: any[];
  recentStockMovements: any[];
}

function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await api.getDashboardStats();
        setStats(data);
      } catch (err) {
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="content">
      <div className="header">
        <h1>Dashboard</h1>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Customers</h3>
          <div className="value">{stats?.totalCustomers || 0}</div>
        </div>
        <div className="stat-card">
          <h3>Total Products</h3>
          <div className="value">{stats?.totalProducts || 0}</div>
        </div>
        <div className="stat-card warning">
          <h3>Low Stock Products</h3>
          <div className="value">{stats?.lowStockProducts || 0}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '24px' }}>
        <div className="table-container">
          <div style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600' }}>Recent Challans</h3>
          </div>
          <table>
            <thead>
              <tr>
                <th>Challan No</th>
                <th>Customer</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {stats?.recentChallans?.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', color: '#6b7280' }}>
                    No recent challans
                  </td>
                </tr>
              ) : (
                stats?.recentChallans?.map((challan) => (
                  <tr key={challan.id}>
                    <td>{challan.challanNo}</td>
                    <td>{challan.customer?.name || '-'}</td>
                    <td>
                      <span className={`badge badge-${challan.status === 'CONFIRMED' ? 'success' : 'info'}`}>
                        {challan.status}
                      </span>
                    </td>
                    <td>{new Date(challan.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="table-container">
          <div style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600' }}>Recent Stock Movements</h3>
          </div>
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Type</th>
                <th>Quantity</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {stats?.recentStockMovements?.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', color: '#6b7280' }}>
                    No recent movements
                  </td>
                </tr>
              ) : (
                stats?.recentStockMovements?.map((movement) => (
                  <tr key={movement.id}>
                    <td>{movement.product?.name || '-'}</td>
                    <td>
                      <span className={`badge badge-${movement.movementType === 'IN' ? 'success' : 'warning'}`}>
                        {movement.movementType}
                      </span>
                    </td>
                    <td>{movement.quantity}</td>
                    <td>{new Date(movement.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
