import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ApiError, api } from '../lib/api';

const initialForm = {
  name: '',
  mobile: '',
  email: '',
  businessName: '',
  gstNumber: '',
  customerType: 'RETAIL',
  address: '',
  status: 'LEAD',
  followUpDate: '',
  notes: '',
};

function CustomerFormPage() {
  const { customerId } = useParams();
  const isEditMode = Boolean(customerId);
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!customerId) {
      return;
    }

    const loadCustomer = async () => {
      try {
        setLoading(true);
        const customer = await api.getCustomer(customerId);
        setForm({
          name: customer.name,
          mobile: customer.mobile,
          email: customer.email ?? '',
          businessName: customer.businessName,
          gstNumber: customer.gstNumber ?? '',
          customerType: customer.customerType,
          address: customer.address,
          status: customer.status,
          followUpDate: customer.followUpDate ? customer.followUpDate.slice(0, 10) : '',
          notes: customer.notes ?? '',
        });
      } catch (requestError) {
        setError(requestError instanceof ApiError ? requestError.message : 'Unable to load customer');
      } finally {
        setLoading(false);
      }
    };

    void loadCustomer();
  }, [customerId]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError('');

      const payload = {
        ...form,
        email: form.email || undefined,
        gstNumber: form.gstNumber || undefined,
        followUpDate: form.followUpDate || undefined,
        notes: form.notes || undefined,
      };

      if (customerId) {
        await api.updateCustomer(customerId, payload);
        navigate(`/dashboard/customers/${customerId}`);
        return;
      }

      const customer = await api.createCustomer(payload);
      navigate(`/dashboard/customers/${customer.id}`);
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Unable to save customer');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p>Loading customer form...</p>;
  }

  return (
    <div className="page-stack">
      <div className="panel-header">
        <div>
          <h2>{isEditMode ? 'Edit customer' : 'Add customer'}</h2>
          <p>Maintain contact details, type, status, and next follow-up date.</p>
        </div>
        <Link className="secondary-button" to="/dashboard/customers">
          Back to list
        </Link>
      </div>

      <form className="panel form-grid" onSubmit={handleSubmit}>
        {error ? <div className="error-banner form-span-2">{error}</div> : null}

        <label>
          Name
          <input
            required
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
          />
        </label>

        <label>
          Mobile
          <input
            required
            value={form.mobile}
            onChange={(event) => setForm({ ...form, mobile: event.target.value })}
          />
        </label>

        <label>
          Email
          <input
            type="email"
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
          />
        </label>

        <label>
          Business name
          <input
            required
            value={form.businessName}
            onChange={(event) => setForm({ ...form, businessName: event.target.value })}
          />
        </label>

        <label>
          GST number
          <input
            value={form.gstNumber}
            onChange={(event) => setForm({ ...form, gstNumber: event.target.value })}
          />
        </label>

        <label>
          Customer type
          <select
            value={form.customerType}
            onChange={(event) => setForm({ ...form, customerType: event.target.value })}
          >
            <option value="RETAIL">Retail</option>
            <option value="WHOLESALE">Wholesale</option>
            <option value="DISTRIBUTOR">Distributor</option>
          </select>
        </label>

        <label>
          Status
          <select
            value={form.status}
            onChange={(event) => setForm({ ...form, status: event.target.value })}
          >
            <option value="LEAD">Lead</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </label>

        <label>
          Follow-up date
          <input
            type="date"
            value={form.followUpDate}
            onChange={(event) => setForm({ ...form, followUpDate: event.target.value })}
          />
        </label>

        <label className="form-span-2">
          Address
          <textarea
            rows={3}
            required
            value={form.address}
            onChange={(event) => setForm({ ...form, address: event.target.value })}
          />
        </label>

        <label className="form-span-2">
          Notes
          <textarea
            rows={4}
            value={form.notes}
            onChange={(event) => setForm({ ...form, notes: event.target.value })}
          />
        </label>

        <div className="form-actions form-span-2">
          <button className="primary-button" type="submit" disabled={saving}>
            {saving ? 'Saving...' : isEditMode ? 'Update customer' : 'Create customer'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default CustomerFormPage;
