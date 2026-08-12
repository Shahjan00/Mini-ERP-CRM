import { FormEvent, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ApiError, api, getStoredUser } from '../lib/api';
import type { CustomerDetail } from '../types/domain';

function CustomerDetailPage() {
  const { customerId } = useParams();
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [saving, setSaving] = useState(false);

  const loadCustomer = async () => {
    if (!customerId) {
      return;
    }

    try {
      setLoading(true);
      const response = await api.getCustomer(customerId);
      setCustomer(response);
      setError('');
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Unable to load customer');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCustomer();
  }, [customerId]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!customerId) {
      return;
    }

    try {
      setSaving(true);
      const user = getStoredUser();
      await api.addCustomerFollowUp(customerId, {
        note,
        followUpDate: followUpDate || undefined,
        createdBy: user?.name ?? user?.email ?? 'Dashboard User',
      });

      setNote('');
      setFollowUpDate('');
      await loadCustomer();
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Unable to add follow-up');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p>Loading customer details...</p>;
  }

  if (!customer) {
    return <p>Customer not found.</p>;
  }

  return (
    <div className="page-stack">
      <div className="panel-header">
        <div>
          <h2>{customer.name}</h2>
          <p>{customer.businessName}</p>
        </div>
        <div className="header-actions">
          <Link className="secondary-button" to="/dashboard/customers">
            Back
          </Link>
          <Link className="primary-button" to={`/dashboard/customers/${customer.id}/edit`}>
            Edit customer
          </Link>
        </div>
      </div>

      {error ? <div className="error-banner">{error}</div> : null}

      <div className="detail-grid">
        <div className="panel detail-card">
          <h3>Profile</h3>
          <dl>
            <div>
              <dt>Mobile</dt>
              <dd>{customer.mobile}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{customer.email ?? '-'}</dd>
            </div>
            <div>
              <dt>Type</dt>
              <dd>{customer.customerType}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{customer.status}</dd>
            </div>
            <div>
              <dt>GST</dt>
              <dd>{customer.gstNumber ?? '-'}</dd>
            </div>
            <div>
              <dt>Next follow-up</dt>
              <dd>{customer.followUpDate ? customer.followUpDate.slice(0, 10) : '-'}</dd>
            </div>
            <div>
              <dt>Address</dt>
              <dd>{customer.address}</dd>
            </div>
            <div>
              <dt>Notes</dt>
              <dd>{customer.notes ?? '-'}</dd>
            </div>
          </dl>
        </div>

        <div className="panel detail-card">
          <h3>Follow-up notes</h3>
          <form className="stack-form" onSubmit={handleSubmit}>
            <textarea
              rows={4}
              required
              placeholder="Add follow-up note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
            <input
              type="date"
              value={followUpDate}
              onChange={(event) => setFollowUpDate(event.target.value)}
            />
            <button className="primary-button" type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Add follow-up'}
            </button>
          </form>

          <div className="timeline">
            {customer.followUpNotes.length === 0 ? <p>No follow-up notes yet.</p> : null}

            {customer.followUpNotes.map((item) => (
              <article className="timeline-item" key={item.id}>
                <div className="timeline-head">
                  <strong>{item.createdBy ?? 'System'}</strong>
                  <span>{item.createdAt.slice(0, 10)}</span>
                </div>
                <p>{item.note}</p>
                {item.followUpDate ? <small>Next follow-up: {item.followUpDate.slice(0, 10)}</small> : null}
              </article>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CustomerDetailPage;
