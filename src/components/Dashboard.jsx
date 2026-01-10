import { useState } from 'react';

const Dashboard = () => {
  // Mock data for statistics
  const stats = [
    {
      label: 'Pending Samples',
      value: '24',
      change: '+12%',
      positive: true,
      icon: '🧪',
      color: 'hsl(195, 100%, 50%)'
    },
    {
      label: 'Tests Completed Today',
      value: '137',
      change: '+8%',
      positive: true,
      icon: '✅',
      color: 'hsl(142, 76%, 45%)'
    },
    {
      label: 'Pending Reports',
      value: '18',
      change: '-5%',
      positive: false,
      icon: '📄',
      color: 'hsl(45, 100%, 50%)'
    },
    {
      label: 'Revenue Today',
      value: '₹45,280',
      change: '+15%',
      positive: true,
      icon: '💰',
      color: 'hsl(280, 90%, 60%)'
    },
  ];

  const recentTests = [
    { id: 'S001', patient: 'Rajesh Kumar', test: 'Complete Blood Count', status: 'completed', priority: 'normal', time: '2 hours ago' },
    { id: 'S002', patient: 'Priya Sharma', test: 'Lipid Profile', status: 'pending', priority: 'high', time: '30 mins ago' },
    { id: 'S003', patient: 'Amit Patel', test: 'Thyroid Function Test', status: 'in-progress', priority: 'normal', time: '1 hour ago' },
    { id: 'S004', patient: 'Sneha Reddy', test: 'Liver Function Test', status: 'completed', priority: 'urgent', time: '3 hours ago' },
    { id: 'S005', patient: 'Vikram Singh', test: 'HbA1c', status: 'pending', priority: 'normal', time: '45 mins ago' },
  ];

  const inventoryAlerts = [
    { item: 'Blood Collection Tubes', level: 'low', count: 45 },
    { item: 'Reagent Kit A', level: 'critical', count: 12 },
    { item: 'Test Strips', level: 'low', count: 78 },
  ];

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'completed':
        return 'badge-success';
      case 'pending':
        return 'badge-warning';
      case 'in-progress':
        return 'badge-primary';
      default:
        return 'badge-info';
    }
  };

  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'badge-danger';
      case 'high':
        return 'badge-warning';
      default:
        return 'badge-info';
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-description">Welcome to Cura Hospital Laboratory Management System - Bengaluru</p>
      </div>

      <div className="page-content">
        {/* Statistics Cards */}
        <div className="grid grid-cols-4" style={{ marginBottom: 'var(--space-2xl)' }}>
          {stats.map((stat, index) => (
            <div key={index} className="stat-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-md)' }}>
                <div>
                  <div className="stat-value">{stat.value}</div>
                  <div className="stat-label">{stat.label}</div>
                </div>
                <div style={{
                  fontSize: '2rem',
                  opacity: 0.3,
                  filter: `drop-shadow(0 0 10px ${stat.color})`
                }}>
                  {stat.icon}
                </div>
              </div>
              <div className={`stat-change ${stat.positive ? 'positive' : 'negative'}`}>
                <span>{stat.positive ? '↑' : '↓'}</span>
                <span>{stat.change} from yesterday</span>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3" style={{ gap: 'var(--space-xl)' }}>
          {/* Recent Tests */}
          <div style={{ gridColumn: 'span 2' }}>
            <div className="card" style={{ padding: '0' }}>
              <div style={{
                padding: 'var(--space-xl)',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '700' }}>Recent Tests</h2>
                <button className="btn btn-secondary btn-sm">View All</button>
              </div>
              <div className="table-container" style={{ border: 'none', borderRadius: '0' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Sample ID</th>
                      <th>Patient Name</th>
                      <th>Test Type</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTests.map((test) => (
                      <tr key={test.id}>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: '600', color: 'var(--color-primary)' }}>
                          {test.id}
                        </td>
                        <td style={{ fontWeight: '500' }}>{test.patient}</td>
                        <td>{test.test}</td>
                        <td>
                          <span className={`badge ${getPriorityBadgeClass(test.priority)}`}>
                            {test.priority}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${getStatusBadgeClass(test.status)}`}>
                            {test.status}
                          </span>
                        </td>
                        <td style={{ color: 'var(--text-tertiary)', fontSize: '0.8125rem' }}>
                          {test.time}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Quick Actions & Alerts */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
            {/* Quick Actions */}
            <div className="card" style={{ padding: 'var(--space-xl)' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '700', marginBottom: 'var(--space-lg)' }}>
                Quick Actions
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'flex-start' }}>
                  New Sample Entry
                </button>
                <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'flex-start' }}>
                  Enter Test Results
                </button>
                <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'flex-start' }}>
                  Generate Report
                </button>
                <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'flex-start' }}>
                  Create Invoice
                </button>
              </div>
            </div>

            {/* Inventory Alerts */}
            <div className="card" style={{ padding: 'var(--space-xl)' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '700', marginBottom: 'var(--space-lg)' }}>
                Inventory Alerts
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                {inventoryAlerts.map((alert, index) => (
                  <div
                    key={index}
                    style={{
                      padding: 'var(--space-md)',
                      background: alert.level === 'critical'
                        ? 'hsla(0, 84%, 60%, 0.1)'
                        : 'hsla(45, 100%, 50%, 0.1)',
                      border: `1px solid ${alert.level === 'critical'
                        ? 'hsla(0, 84%, 60%, 0.3)'
                        : 'hsla(45, 100%, 50%, 0.3)'}`,
                      borderRadius: 'var(--radius-md)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <p style={{ fontWeight: '600', fontSize: '0.875rem', marginBottom: '2px' }}>
                          {alert.item}
                        </p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          Only {alert.count} units left
                        </p>
                      </div>
                      <span className={`badge ${alert.level === 'critical' ? 'badge-danger' : 'badge-warning'}`}>
                        {alert.level}
                      </span>
                    </div>
                  </div>
                ))}
                <button className="btn btn-secondary btn-sm" style={{ width: '100%', marginTop: 'var(--space-sm)' }}>
                  View All Inventory
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
