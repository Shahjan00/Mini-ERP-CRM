import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Printer, CheckCircle2, XCircle, Building2, User, Phone, Mail } from 'lucide-react';
import { api } from '../services/api';
import { Challan } from '../types';
import { StatusBadge } from '../components/StatusBadge';

export const ChallanDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [challan, setChallan] = useState<Challan | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState('');

  const fetchChallanDetail = async () => {
    setLoading(true);
    try {
      const res: any = await api.get(`/challans/${id}`);
      if (res.success) {
        setChallan(res.data);
      }
    } catch (err) {
      console.error('Failed to load sales challan details', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchChallanDetail();
  }, [id]);

  const handleStatusUpdate = async (newStatus: 'CONFIRMED' | 'CANCELLED') => {
    setMessage('');
    setUpdating(true);
    try {
      const res: any = await api.put(`/challans/${id}/status`, { status: newStatus });
      if (res.success) {
        setMessage(`Challan updated to ${newStatus} successfully.`);
        fetchChallanDetail();
      }
    } catch (err: any) {
      setMessage(err.message || 'Failed to update challan status');
    } finally {
      setUpdating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400">
        <div className="inline-block animate-spin w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full mb-2"></div>
        <p className="text-sm">Loading sales challan document...</p>
      </div>
    );
  }

  if (!challan) {
    return (
      <div className="p-8 text-center text-slate-400">
        <p className="text-base">Sales challan document not found.</p>
        <Link to="/challans" className="mt-4 inline-block text-sky-400 hover:underline text-sm">
          ← Back to Sales Challans
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Action Bar (hidden on print) */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            to="/challans"
            className="inline-flex items-center gap-1 text-xs font-semibold text-sky-400 hover:underline mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Sales Challans
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-100 font-mono">
              {challan.challanNumber}
            </h1>
            <StatusBadge status={challan.status} type="challan" />
          </div>
        </div>

        <div className="flex items-center gap-3">
          {challan.status === 'DRAFT' && (
            <button
              onClick={() => handleStatusUpdate('CONFIRMED')}
              disabled={updating}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow-lg shadow-emerald-600/20 flex items-center gap-1.5 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              Confirm & Dispatch Stock
            </button>
          )}

          {challan.status === 'CONFIRMED' && (
            <button
              onClick={() => handleStatusUpdate('CANCELLED')}
              disabled={updating}
              className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm shadow-lg shadow-rose-600/20 flex items-center gap-1.5 transition-all"
            >
              <XCircle className="w-4 h-4" />
              Cancel & Restore Stock
            </button>
          )}

          <button
            onClick={handlePrint}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold text-sm flex items-center gap-2 transition-colors border border-slate-700"
          >
            <Printer className="w-4 h-4 text-sky-400" />
            Print PDF Invoice
          </button>
        </div>
      </div>

      {message && (
        <div className="no-print p-3 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-300 text-xs font-medium">
          {message}
        </div>
      )}

      {/* Printable Invoice Card Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 print-container">
        {/* Invoice Header */}
        <div className="flex flex-col sm:flex-row justify-between gap-6 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center text-white font-bold text-base">
                A
              </div>
              <h2 className="text-xl font-extrabold text-slate-100">Apex Wholesale & Distribution</h2>
            </div>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              MIDC Industrial Area, Block C, Building 4
              <br />
              Pune, Maharashtra - 411018
              <br />
              GSTIN: 27AAAAA1234A1Z1 • Email: dispatch@apexindustrial.com
            </p>
          </div>

          <div className="sm:text-right">
            <h3 className="text-xs font-bold uppercase tracking-wider text-sky-400">
              SALES CHALLAN / INVOICE
            </h3>
            <div className="text-2xl font-black text-slate-100 font-mono mt-1">
              {challan.challanNumber}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Created Date: {new Date(challan.createdAt).toLocaleDateString()}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              Issued By: {challan.createdBy?.name || 'Sales Desk'} ({challan.createdBy?.role})
            </div>
          </div>
        </div>

        {/* Customer Snapshot Box */}
        <div className="my-6 p-4 rounded-xl bg-slate-950/60 border border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Billed & Dispatched To:
            </h4>
            <div className="text-sm font-bold text-slate-100">
              {challan.customerNameSnapshot}
            </div>
            {challan.customer?.name && (
              <div className="text-xs text-slate-400 mt-1">Attn: {challan.customer.name}</div>
            )}
            {challan.customer?.address && (
              <div className="text-xs text-slate-400 mt-1">{challan.customer.address}</div>
            )}
          </div>

          <div className="sm:text-right text-xs text-slate-400 space-y-1">
            <div>
              Email: <span className="text-slate-200">{challan.customerEmailSnapshot}</span>
            </div>
            <div>
              Phone: <span className="text-slate-200">{challan.customerMobileSnapshot}</span>
            </div>
            {challan.customer?.gstNumber && (
              <div>
                Customer GSTIN:{' '}
                <span className="font-mono text-slate-200">{challan.customer.gstNumber}</span>
              </div>
            )}
          </div>
        </div>

        {/* Product Items Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950 text-xs font-semibold uppercase text-slate-400 border-y border-slate-800">
              <tr>
                <th className="px-4 py-3">Item #</th>
                <th className="px-4 py-3">Product Snapshot Description</th>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3 text-right">Unit Price</th>
                <th className="px-4 py-3 text-right">Qty</th>
                <th className="px-4 py-3 text-right">Line Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {challan.items.map((item, idx) => (
                <tr key={item.id || idx}>
                  <td className="px-4 py-3.5 text-xs text-slate-500">{idx + 1}</td>
                  <td className="px-4 py-3.5 font-semibold text-slate-100">
                    {item.productNameSnapshot}
                  </td>
                  <td className="px-4 py-3.5 text-xs font-mono text-sky-400">
                    {item.skuSnapshot}
                  </td>
                  <td className="px-4 py-3.5 text-right font-medium text-slate-300">
                    ₹{item.unitPriceSnapshot.toLocaleString('en-IN')}
                  </td>
                  <td className="px-4 py-3.5 text-right font-bold text-slate-100">
                    {item.quantity}
                  </td>
                  <td className="px-4 py-3.5 text-right font-bold text-slate-100">
                    ₹{item.lineTotal.toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Total Summary */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="text-xs text-slate-400">
            Total Dispatched Quantity:{' '}
            <span className="font-bold text-slate-200">{challan.totalQuantity} items</span>
          </div>

          <div className="text-right">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-3">
              Grand Total Amount:
            </span>
            <span className="text-2xl font-extrabold text-sky-400">
              ₹{challan.grandTotal.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Signatures Footer */}
        <div className="mt-12 pt-8 border-t border-slate-800 grid grid-cols-2 text-xs text-slate-400">
          <div>
            <p>Received Goods in Good Condition Signature</p>
            <div className="h-12"></div>
            <p className="border-t border-slate-700 inline-block pt-1 text-slate-500">
              Customer Stamp & Signature
            </p>
          </div>

          <div className="text-right">
            <p>For Apex Wholesale & Distribution</p>
            <div className="h-12"></div>
            <p className="border-t border-slate-700 inline-block pt-1 text-slate-500">
              Authorized Signatory
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
