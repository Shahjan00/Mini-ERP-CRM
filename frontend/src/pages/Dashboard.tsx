import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  AlertTriangle,
  FileText,
  DollarSign,
  PackageCheck,
  TrendingUp,
  ArrowRight,
  History,
} from 'lucide-react';
import { api } from '../services/api';
import { DashboardStats } from '../types';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res: any = await api.get('/dashboard/stats');
        if (res.success) {
          setStats(res.data);
        }
      } catch (error) {
        console.error('Failed to load dashboard statistics', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400">
        <div className="inline-block animate-spin w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full mb-2"></div>
        <p className="text-sm">Loading operations dashboard metrics...</p>
      </div>
    );
  }

  const kpis = stats?.kpis;

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Operations Overview</h1>
        <p className="text-sm text-slate-400">
          Real-time summary of sales, stock inventory alerts, and CRM customer pipeline.
        </p>
      </div>

      {/* Low Stock Warning Banner if applicable */}
      {kpis && kpis.inventory.lowStockAlerts > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-amber-300">
                Low Stock Alert ({kpis.inventory.lowStockAlerts} items below minimum threshold)
              </h4>
              <p className="text-xs text-amber-400/80">
                Immediate warehouse reorder recommended to avoid dispatch delays.
              </p>
            </div>
          </div>
          <Link
            to="/products?isLowStock=true"
            className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-semibold text-xs transition-colors flex items-center gap-1"
          >
            View Low Stock
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Customers & Leads"
          value={kpis?.customers.total || 0}
          subtitle={`${kpis?.customers.active || 0} Active • ${kpis?.customers.leads || 0} Leads`}
          icon={Users}
          color="sky"
        />

        <StatCard
          title="Stock Alerts"
          value={kpis?.inventory.lowStockAlerts || 0}
          subtitle={`${kpis?.inventory.totalProducts || 0} total SKU catalog`}
          icon={AlertTriangle}
          color={kpis?.inventory.lowStockAlerts ? 'amber' : 'emerald'}
        />

        <StatCard
          title="Confirmed Challans"
          value={kpis?.challans.confirmedCount || 0}
          subtitle={`Out of ${kpis?.challans.total || 0} total challans`}
          icon={FileText}
          color="indigo"
        />

        <StatCard
          title="Revenue (Confirmed)"
          value={`₹${(kpis?.challans.totalRevenue || 0).toLocaleString('en-IN')}`}
          subtitle="Total confirmed order value"
          icon={DollarSign}
          color="emerald"
        />
      </div>

      {/* Recent Feeds Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sales Challans */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-sky-400" />
              <h3 className="text-sm font-semibold text-slate-100">Recent Sales Challans</h3>
            </div>
            <Link
              to="/challans"
              className="text-xs font-semibold text-sky-400 hover:underline flex items-center gap-1"
            >
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {stats?.feeds.recentChallans.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No challans recorded yet.</p>
            ) : (
              stats?.feeds.recentChallans.map((challan) => (
                <div
                  key={challan.id}
                  className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between hover:border-slate-700 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-200">{challan.challanNumber}</span>
                      <StatusBadge status={challan.status} type="challan" />
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {challan.customerNameSnapshot || challan.customer?.businessName}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-slate-100">
                      ₹{challan.grandTotal.toLocaleString('en-IN')}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      {challan.totalQuantity} items
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Stock Movement Audit */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-semibold text-slate-100">Stock Movement Audit Feed</h3>
            </div>
            <Link
              to="/inventory-log"
              className="text-xs font-semibold text-sky-400 hover:underline flex items-center gap-1"
            >
              Audit Log <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {stats?.feeds.recentMovements.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No stock movements logged yet.</p>
            ) : (
              stats?.feeds.recentMovements.map((move) => (
                <div
                  key={move.id}
                  className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                        move.movementType === 'IN'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {move.movementType}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-200">
                        {move.product?.name}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 truncate max-w-xs">
                        {move.reason}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`text-xs font-bold ${
                        move.movementType === 'IN' ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {move.movementType === 'IN' ? '+' : ''}
                      {move.quantityChanged}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      {new Date(move.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
