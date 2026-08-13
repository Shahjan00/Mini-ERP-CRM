import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Building,
  Calendar,
  Plus,
  MessageSquare,
  FileText,
  Clock,
  UserCheck,
} from 'lucide-react';
import { api } from '../services/api';
import { Customer } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';

export const CustomerDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { hasRole } = useAuth();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  // Followup Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [note, setNote] = useState('');
  const [followupDate, setFollowupDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchCustomerDetail = async () => {
    setLoading(true);
    try {
      const res: any = await api.get(`/customers/${id}`);
      if (res.success) {
        setCustomer(res.data);
      }
    } catch (err) {
      console.error('Failed to load customer details', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchCustomerDetail();
  }, [id]);

  const handleAddFollowup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const res: any = await api.post(`/customers/${id}/followups`, { note, followupDate });
      if (res.success) {
        setIsModalOpen(false);
        setNote('');
        setFollowupDate('');
        fetchCustomerDetail();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to add followup note');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400">
        <div className="inline-block animate-spin w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full mb-2"></div>
        <p className="text-sm">Loading customer profile & activity timeline...</p>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="p-8 text-center text-slate-400">
        <p className="text-base">Customer profile not found.</p>
        <Link to="/customers" className="mt-4 inline-block text-sky-400 hover:underline text-sm">
          ← Back to Customers
        </Link>
      </div>
    );
  }

  const canAddNote = hasRole(['ADMIN', 'SALES']);

  return (
    <div className="space-y-6">
      {/* Back Link & Header */}
      <div>
        <Link
          to="/customers"
          className="inline-flex items-center gap-1 text-xs font-semibold text-sky-400 hover:underline mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Customer CRM
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
                {customer.businessName}
              </h1>
              <StatusBadge status={customer.status} type="customer" />
              <StatusBadge status={customer.customerType} type="customer" />
            </div>
            <p className="text-sm text-slate-400 mt-1">Contact Person: {customer.name}</p>
          </div>

          {canAddNote && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-sm shadow-lg shadow-sky-600/20 flex items-center justify-center gap-2 transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Follow-up Note
            </button>
          )}
        </div>
      </div>

      {/* Info Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Contact Info Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-2">
            Contact Details
          </h3>

          <div className="space-y-2 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-sky-400 shrink-0" />
              <span>{customer.mobile}</span>
            </div>

            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-sky-400 shrink-0" />
              <span>{customer.email}</span>
            </div>

            {customer.gstNumber && (
              <div className="flex items-center gap-2 font-mono">
                <Building className="w-4 h-4 text-sky-400 shrink-0" />
                <span>GST: {customer.gstNumber}</span>
              </div>
            )}

            <div className="flex items-start gap-2 pt-1 border-t border-slate-800/80">
              <MapPin className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
              <span className="text-slate-400">{customer.address}</span>
            </div>
          </div>
        </div>

        {/* Schedule & Metadata Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-2">
            Follow-up Schedule & Notes
          </h3>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Scheduled Follow-up:</span>
              {customer.followupDate ? (
                <span className="font-semibold text-amber-400 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(customer.followupDate).toLocaleDateString()}
                </span>
              ) : (
                <span className="text-slate-500">Not scheduled</span>
              )}
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">Total Followup Notes:</span>
              <span className="font-bold text-slate-200">{customer.followups?.length || 0}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">Total Sales Orders:</span>
              <span className="font-bold text-slate-200">{customer.challans?.length || 0}</span>
            </div>

            {customer.notes && (
              <div className="pt-2 border-t border-slate-800/80 text-slate-400 italic">
                "{customer.notes}"
              </div>
            )}
          </div>
        </div>

        {/* Sales Order History */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-2">
            Recent Sales Orders
          </h3>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {!customer.challans || customer.challans.length === 0 ? (
              <p className="text-xs text-slate-500 py-2">No challans created for this customer.</p>
            ) : (
              customer.challans.map((ch) => (
                <Link
                  key={ch.id}
                  to={`/challans/${ch.id}`}
                  className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between hover:border-slate-700 transition-colors block"
                >
                  <div>
                    <div className="text-xs font-bold text-slate-200">{ch.challanNumber}</div>
                    <div className="text-[10px] text-slate-400">
                      {new Date(ch.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-slate-100">
                      ₹{ch.grandTotal.toLocaleString('en-IN')}
                    </div>
                    <StatusBadge status={ch.status} type="challan" />
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Interactive Follow-up Notes Timeline */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h3 className="text-base font-bold text-slate-100 mb-4 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-sky-400" />
          CRM Follow-up Timeline
        </h3>

        {!customer.followups || customer.followups.length === 0 ? (
          <p className="text-xs text-slate-500 py-6 text-center">
            No follow-up notes recorded yet. Click 'Add Follow-up Note' to log your first call or meeting.
          </p>
        ) : (
          <div className="relative pl-6 border-l-2 border-slate-800 space-y-6">
            {customer.followups.map((note) => (
              <div key={note.id} className="relative group">
                {/* Timeline Node Dot */}
                <div className="absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full bg-slate-900 border-2 border-sky-500"></div>

                <div className="bg-slate-950/80 border border-slate-800/90 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-3.5 h-3.5 text-sky-400" />
                      <span className="font-semibold text-slate-200">
                        {note.createdBy?.name || 'Staff User'}
                      </span>
                      <span className="text-[10px] uppercase font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full">
                        {note.createdBy?.role}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(note.createdAt).toLocaleString()}
                    </div>
                  </div>

                  <p className="text-sm text-slate-200 font-medium leading-relaxed">{note.note}</p>

                  {note.followupDate && (
                    <div className="pt-2 border-t border-slate-800/60 text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      Next follow-up date set to:{' '}
                      {new Date(note.followupDate).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Followup Note Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Follow-up Call/Meeting Note"
      >
        <form onSubmit={handleAddFollowup} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Discussion Notes / Communication Log *
            </label>
            <textarea
              required
              rows={4}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Discussed bulk order discount. Client requested sample thermal printers by Friday."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Set Next Follow-up Date (Optional)
            </label>
            <input
              type="date"
              value={followupDate}
              onChange={(e) => setFollowupDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-sm shadow-lg shadow-sky-600/20 disabled:opacity-50"
            >
              {submitting ? 'Saving Note...' : 'Save Follow-up Note'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
