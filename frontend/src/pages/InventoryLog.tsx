import React, { useEffect, useState } from 'react';
import { History, Search, ArrowDownRight, ArrowUpRight, UserCheck } from 'lucide-react';
import { api } from '../services/api';
import { StockMovement } from '../types';
import { StatusBadge } from '../components/StatusBadge';

export const InventoryLog: React.FC = () => {
  const [logs, setLogs] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [movementTypeFilter, setMovementTypeFilter] = useState('');

  // Pagination state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '15',
        ...(search && { search }),
        ...(movementTypeFilter && { movementType: movementTypeFilter }),
      });

      const res: any = await api.get(`/inventory/logs?${params}`);
      if (res.success) {
        setLogs(res.data);
        setTotalPages(res.meta?.totalPages || 1);
      }
    } catch (err) {
      console.error('Error fetching inventory audit logs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, search, movementTypeFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Stock Movement Audit Log</h1>
        <p className="text-sm text-slate-400">
          Complete, non-repudiable audit history of all inventory IN/OUT adjustments, purchase inward entries, and sales dispatches.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search movement reason, product name, or SKU code..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>

        <div>
          <select
            value={movementTypeFilter}
            onChange={(e) => {
              setMovementTypeFilter(e.target.value);
              setPage(1);
            }}
            className="bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 px-3 py-2 focus:outline-none focus:border-sky-500"
          >
            <option value="">All Movement Types</option>
            <option value="IN">IN (Inward Stock)</option>
            <option value="OUT">OUT (Outward Stock)</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950 text-xs font-semibold uppercase text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Type & Qty</th>
                <th className="px-5 py-3.5">Product & SKU</th>
                <th className="px-5 py-3.5">Reason / Source</th>
                <th className="px-5 py-3.5">Performed By</th>
                <th className="px-5 py-3.5 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-slate-500">
                    Loading stock audit entries...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-slate-500">
                    No stock movement audit records found.
                  </td>
                </tr>
              ) : (
                logs.map((move) => {
                  const isIn = move.movementType === 'IN';
                  return (
                    <tr key={move.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                              isIn
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}
                          >
                            {isIn ? (
                              <ArrowDownRight className="w-4 h-4" />
                            ) : (
                              <ArrowUpRight className="w-4 h-4" />
                            )}
                          </div>

                          <div>
                            <span
                              className={`font-bold text-sm ${
                                isIn ? 'text-emerald-400' : 'text-rose-400'
                              }`}
                            >
                              {isIn ? '+' : ''}
                              {move.quantityChanged} units
                            </span>
                            <div className="text-[10px] text-slate-500 font-bold uppercase">
                              {move.movementType}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-100">{move.product?.name}</div>
                        <div className="text-xs font-mono text-sky-400">{move.product?.sku}</div>
                      </td>

                      <td className="px-5 py-4 text-xs text-slate-300 max-w-xs leading-relaxed">
                        {move.reason}
                      </td>

                      <td className="px-5 py-4 text-xs text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                          <span>{move.createdBy?.name || 'Staff'}</span>
                        </div>
                        <div className="text-[10px] text-sky-400 font-semibold uppercase mt-0.5">
                          {move.createdBy?.role}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-right text-xs text-slate-400 font-mono">
                        {new Date(move.timestamp).toLocaleString()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="px-5 py-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
