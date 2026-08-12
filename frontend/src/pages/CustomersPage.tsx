import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ApiError, api, getStoredUser } from '../lib/api';
import type { Customer, CustomerStatus, CustomerType, PaginationMeta } from '../types/domain';

const emptyMeta: PaginationMeta = {
  total: 0,
  page: 1,
  pageSize: 10,
  totalPages: 1,
};

function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>(emptyMeta);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<CustomerStatus | ''>('');
  const [customerType, setCustomerType] = useState<CustomerType | ''>('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const loadCustomers = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await api.listCustomers({
          q: search,
          status,
          customerType,
          page,
          pageSize: 10,
        });

        setCustomers(response.data);
        setMeta(response.meta);
      } catch (requestError) {
        setError(
          requestError instanceof ApiError ? requestError.message : 'Unable to load customers'
        );
      } finally {
        setLoading(false);
      }
    };

    void loadCustomers();
  }, [customerType, page, search, status]);

  const user = getStoredUser();
  const canCreateCustomer = user?.role === 'ADMIN' || user?.role === 'SALES';

  return (
    <div>
      <div className="header">
        <h1>Customers</h1>
        <div className="header-actions">
          {canCreateCustomer ? (
            <Link className="btn btn-primary" to="/dashboard/customers/new">
              Add Customer
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
            placeholder="Search by name, mobile, business, email, GST"
          />
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as CustomerStatus | '');
              setPage(1);
            }}
          >
            <option value="">All statuses</option>
            <option value="LEAD">Lead</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
          <select
            value={customerType}
            onChange={(event) => {
              setCustomerType(event.target.value as CustomerType | '');
              setPage(1);
            }}
          >
            <option value="">All customer types</option>
            <option value="RETAIL">Retail</option>
            <option value="WHOLESALE">Wholesale</option>
            <option value="DISTRIBUTOR">Distributor</option>
          </select>
        </div>

        {error && <div className="error-message">{error}</div>}

        {loading ? (
          <div className="loading">Loading customers...</div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Business</th>
                  <th>Mobile</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Follow-up</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <div className="empty-state">
                        <h3>No customers found</h3>
                        <p>Add your first customer to get started</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  customers.map((customer) => (
                    <tr key={customer.id}>
                      <td>{customer.name}</td>
                      <td>{customer.businessName}</td>
                      <td>{customer.mobile}</td>
                      <td>{customer.customerType}</td>
                      <td>
                        <span
                          className={`badge badge-${
                            customer.status === 'ACTIVE'
                              ? 'success'
                              : customer.status === 'INACTIVE'
                              ? 'danger'
                              : 'warning'
                          }`}
                        >
                          {customer.status}
                        </span>
                      </td>
                      <td>{customer.followUpDate ? customer.followUpDate.slice(0, 10) : '-'}</td>
                      <td>
                        <Link to={`/dashboard/customers/${customer.id}`}>View</Link>
                        {canCreateCustomer ? (
                          <>
                            {' | '}
                            <Link to={`/dashboard/customers/${customer.id}/edit`}>Edit</Link>
                          </>
                        ) : null}
                      </td>
                    </tr>
                  ))
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

export default CustomersPage;
