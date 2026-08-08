import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../services/api';
import { AuthContext } from '../context/AuthContext';

/* ── Inline Styles / Theme ─────────────────────────────────────────────── */
const SIDEBAR_BG = '#0B132B';
const ACCENT = '#6C63FF';
const ACCENT2 = '#17B8A6';
const CARD_BG = '#FFFFFF';
const PAGE_BG = '#F4F6FA';
const TEXT_MAIN = '#1E293B';
const TEXT_MUTED = '#64748B';
const BORDER = '#E2E8F0';

/* ── SVG Area Chart ─────────────────────────────────────────────────────── */
const AreaChart = ({ labels, values, color = ACCENT }) => {
  const W = 520, H = 160, PAD = 28;
  const max = Math.max(...values, 1);
  const pts = values.map((v, i) => {
    const x = PAD + (i / (values.length - 1 || 1)) * (W - PAD * 2);
    const y = H - PAD - ((v / max) * (H - PAD * 2));
    return [x, y];
  });
  const poly = pts.map(p => p.join(',')).join(' ');
  const area = [
    `M ${pts[0][0]},${H - PAD}`,
    ...pts.map(p => `L ${p[0]},${p[1]}`),
    `L ${pts[pts.length - 1][0]},${H - PAD} Z`
  ].join(' ');

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: '100%', overflow: 'visible' }}>
      <defs>
        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
        const y = PAD + t * (H - PAD * 2);
        return (
          <line key={i} x1={PAD} y1={y} x2={W - PAD} y2={y}
            stroke={BORDER} strokeWidth="1" strokeDasharray="4,4" />
        );
      })}
      {/* Area fill */}
      <path d={area} fill="url(#chartGrad)" />
      {/* Line */}
      <polyline points={poly} fill="none" stroke={color} strokeWidth="2.5"
        strokeLinejoin="round" strokeLinecap="round" />
      {/* Dots */}
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="4" fill={color} stroke="#fff" strokeWidth="2" />
      ))}
      {/* X labels */}
      {labels.map((l, i) => {
        const x = PAD + (i / (labels.length - 1 || 1)) * (W - PAD * 2);
        return (
          <text key={i} x={x} y={H - 4} textAnchor="middle"
            fontSize="11" fill={TEXT_MUTED}>{l}</text>
        );
      })}
    </svg>
  );
};

/* ── Donut Chart ────────────────────────────────────────────────────────── */
const DonutChart = ({ slices }) => {
  const R = 52, cx = 70, cy = 70, stroke = 16;
  const total = slices.reduce((s, d) => s + d.value, 0) || 1;
  let offset = 0;
  const circ = 2 * Math.PI * R;

  return (
    <svg viewBox="0 0 140 140" style={{ width: 140, height: 140 }}>
      {slices.map((s, i) => {
        const pct = s.value / total;
        const dash = pct * circ;
        const el = (
          <circle key={i} cx={cx} cy={cy} r={R}
            fill="none" stroke={s.color} strokeWidth={stroke}
            strokeDasharray={`${dash} ${circ - dash}`}
            strokeDashoffset={-offset * circ}
            style={{ transition: 'stroke-dashoffset 0.4s ease' }}
            transform={`rotate(-90 ${cx} ${cy})`}
          />
        );
        offset += pct;
        return el;
      })}
      <text x={cx} y={cy - 6} textAnchor="middle" fontSize="16" fontWeight="700" fill={TEXT_MAIN}>
        {total}
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" fontSize="10" fill={TEXT_MUTED}>Orders</text>
    </svg>
  );
};

/* ── Mini Calendar ──────────────────────────────────────────────────────── */
const MiniCalendar = () => {
  const now = new Date();
  const [viewDate, setViewDate] = useState(new Date(now.getFullYear(), now.getMonth(), 1));
  const today = now.getDate();
  const month = viewDate.toLocaleString('default', { month: 'long' });
  const year = viewDate.getFullYear();
  const firstDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const isCurrentMonth = viewDate.getMonth() === now.getMonth() && viewDate.getFullYear() === now.getFullYear();

  const prevMonth = () => setViewDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const nextMonth = () => setViewDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));

  return (
    <div style={{ userSelect: 'none' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <button onClick={prevMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: TEXT_MUTED, padding: '2px 6px' }}>‹</button>
        <span style={{ fontWeight: 700, fontSize: 14, color: TEXT_MAIN }}>{month} {year}</span>
        <button onClick={nextMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: TEXT_MUTED, padding: '2px 6px' }}>›</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
        {DAY_LABELS.map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: TEXT_MUTED, paddingBottom: 4 }}>{d}</div>
        ))}
        {cells.map((d, i) => {
          const isToday = isCurrentMonth && d === today;
          return (
            <div key={i} style={{
              textAlign: 'center', fontSize: 12, lineHeight: '28px',
              borderRadius: '50%', width: 28, height: 28, margin: '0 auto',
              backgroundColor: isToday ? ACCENT : 'transparent',
              color: isToday ? '#fff' : d ? TEXT_MAIN : 'transparent',
              fontWeight: isToday ? 700 : 400,
              cursor: d ? 'pointer' : 'default'
            }}>{d || ''}</div>
          );
        })}
      </div>
    </div>
  );
};

/* ── Stat Card ──────────────────────────────────────────────────────────── */
const StatCard = ({ label, value, icon, iconBg, trend, trendUp }) => (
  <div style={{
    background: CARD_BG, borderRadius: 14, padding: '20px 22px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: `1px solid ${BORDER}`,
    display: 'flex', alignItems: 'flex-start', gap: 16, flex: '1 1 180px'
  }}>
    <div style={{
      width: 46, height: 46, borderRadius: 12, backgroundColor: iconBg,
      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0
    }}>{icon}</div>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 12, color: TEXT_MUTED, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: TEXT_MAIN, lineHeight: 1.2 }}>{value}</div>
      {trend && (
        <div style={{
          marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 4,
          fontSize: 11, fontWeight: 600,
          color: trendUp ? '#10B981' : '#EF4444',
          backgroundColor: trendUp ? '#D1FAE5' : '#FEE2E2',
          padding: '2px 8px', borderRadius: 99
        }}>
          {trendUp ? '▲' : '▼'} {trend}
        </div>
      )}
    </div>
  </div>
);


/* ── STATUS COLOR MAP ───────────────────────────────────────────────────── */
const statusColor = (s) => ({
  placed: { bg: '#EFF6FF', text: '#1D4ED8' },
  shipped: { bg: '#F5F3FF', text: '#7C3AED' },
  delivered: { bg: '#D1FAE5', text: '#065F46' },
  cancelled: { bg: '#FEE2E2', text: '#B91C1C' },
})[s] || { bg: '#F1F5F9', text: '#475569' };

/* ══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════════════ */
const AdminDashboard = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getStats()
      .then(r => setStats(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const donutSlices = stats ? [
    { label: 'Placed', value: stats.status_counts?.placed || 0, color: '#3B82F6' },
    { label: 'Shipped', value: stats.status_counts?.shipped || 0, color: ACCENT },
    { label: 'Delivered', value: stats.status_counts?.delivered || 0, color: '#10B981' },
    { label: 'Cancelled', value: stats.status_counts?.cancelled || 0, color: '#EF4444' },
  ] : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Heading */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: TEXT_MAIN, margin: 0 }}>
            Analytics <span style={{ color: TEXT_MUTED, fontWeight: 400 }}>Dashboard</span>
          </h1>
          <p style={{ color: TEXT_MUTED, fontSize: 14, margin: '4px 0 0' }}>
            Welcome back, <strong>{user?.name}</strong>. Here's what's happening today.
          </p>
        </div>
        <div style={{ fontSize: 13, color: TEXT_MUTED }}>
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: TEXT_MUTED }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
          Loading dashboard data...
        </div>
      ) : stats && (
        <>
          {/* ── KPI Cards ── */}
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <StatCard
              label="Total Revenue"
              value={`₹${(stats.revenue / 1000).toFixed(1)}K`}
              icon="💰"
              iconBg="#EFF6FF"
              trend="Live"
              trendUp={true}
            />
            <StatCard
              label="Total Orders"
              value={stats.orders_count}
              icon="🛒"
              iconBg="#F5F3FF"
              trend={`${stats.status_counts?.placed || 0} pending`}
              trendUp={stats.status_counts?.placed === 0}
            />
            <StatCard
              label="Products Listed"
              value={stats.products_count}
              icon="📦"
              iconBg="#ECFDF5"
              trend={stats.low_stock_count > 0 ? `${stats.low_stock_count} low stock` : 'All in stock'}
              trendUp={stats.low_stock_count === 0}
            />
            <StatCard
              label="Customers"
              value={stats.customers_count}
              icon="👥"
              iconBg="#FFF7ED"
              trend="Registered"
              trendUp={true}
            />
          </div>

          {/* ── Chart Row ── */}
          <div className="admin-dashboard-grid-1">

            {/* Revenue Area Chart */}
            <div style={{ backgroundColor: CARD_BG, borderRadius: 16, padding: '22px 24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: `1px solid ${BORDER}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: TEXT_MAIN }}>Revenue Trend</div>
                  <div style={{ fontSize: 12, color: TEXT_MUTED, marginTop: 2 }}>Last 6 months • ₹{(stats.revenue / 1000).toFixed(1)}K total</div>
                </div>
                <div style={{ fontSize: 11, color: ACCENT, backgroundColor: `${ACCENT}15`, padding: '4px 10px', borderRadius: 99, fontWeight: 600 }}>Monthly</div>
              </div>
              <div style={{ height: 160 }}>
                <AreaChart
                  labels={stats.monthly_labels || []}
                  values={stats.monthly_values || []}
                  color={ACCENT}
                />
              </div>
            </div>

            {/* Order Status Donut */}
            <div style={{ backgroundColor: CARD_BG, borderRadius: 16, padding: '22px 24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: `1px solid ${BORDER}` }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: TEXT_MAIN, marginBottom: 4 }}>Order Status</div>
              <div style={{ fontSize: 12, color: TEXT_MUTED, marginBottom: 16 }}>Breakdown by status</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <DonutChart slices={donutSlices} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                  {donutSlices.map(s => (
                    <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: s.color, flexShrink: 0 }} />
                      <span style={{ color: TEXT_MUTED, flex: 1, textTransform: 'capitalize' }}>{s.label}</span>
                      <span style={{ fontWeight: 700, color: TEXT_MAIN }}>{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Bottom Row ── */}
          <div className="admin-dashboard-grid-2">

            {/* Mini Calendar */}
            <div style={{ backgroundColor: CARD_BG, borderRadius: 16, padding: '22px 24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: `1px solid ${BORDER}` }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: TEXT_MAIN, marginBottom: 16 }}>📅 Calendar</div>
              <MiniCalendar />
            </div>

            {/* Recent Orders Table */}
            <div style={{ backgroundColor: CARD_BG, borderRadius: 16, padding: '22px 24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: `1px solid ${BORDER}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: TEXT_MAIN }}>🧾 Recent Orders</div>
                <Link to="/admin/orders" style={{ fontSize: 12, color: ACCENT, fontWeight: 600 }}>View All →</Link>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                    {['Order ID', 'Customer', 'Amount', 'Payment', 'Status'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '0 8px 10px 0', color: TEXT_MUTED, fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(stats.recent_orders || []).map(order => {
                    const sc = statusColor(order.status);
                    return (
                      <tr key={order.id} style={{ borderBottom: `1px solid ${BORDER}` }}>
                        <td style={{ padding: '10px 8px 10px 0', fontWeight: 700, color: TEXT_MAIN }}>#{order.id}</td>
                        <td style={{ padding: '10px 8px 10px 0', color: TEXT_MUTED }}>{order.user_name || '—'}</td>
                        <td style={{ padding: '10px 8px 10px 0', fontWeight: 700, color: TEXT_MAIN, fontFamily: 'JetBrains Mono, monospace' }}>
                          ₹{parseFloat(order.total_amount || 0).toFixed(0)}
                        </td>
                        <td style={{ padding: '10px 8px 10px 0', color: TEXT_MUTED, textTransform: 'capitalize' }}>
                          {order.payment_method || '—'}
                        </td>
                        <td style={{ padding: '10px 0' }}>
                          <span style={{
                            display: 'inline-block', padding: '3px 10px', borderRadius: 99,
                            fontSize: 11, fontWeight: 700, textTransform: 'capitalize',
                            backgroundColor: sc.bg, color: sc.text
                          }}>{order.status}</span>
                        </td>
                      </tr>
                    );
                  })}
                  {(!stats.recent_orders || stats.recent_orders.length === 0) && (
                    <tr><td colSpan={5} style={{ padding: '24px 0', textAlign: 'center', color: TEXT_MUTED }}>No orders yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
