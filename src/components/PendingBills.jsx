import { useState, useEffect } from 'react';
import { pendingBillsAPI, labResultsAPI, testTemplatesAPI } from '../lib/newApi';
import TestResultEntry from './TestResultEntry';
import LabReport from './LabReport';

function PendingBills() {
  const [pendingBills, setPendingBills] = useState([]);
  const [completedBills, setCompletedBills] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' or 'completed'

  // Modal states
  const [showResultEntry, setShowResultEntry] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [selectedResult, setSelectedResult] = useState(null);
  const [testTemplate, setTestTemplate] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsData] = await Promise.all([
        pendingBillsAPI.getStats()
      ]);
      setStats(statsData);

      if (activeTab === 'pending') {
        const bills = await pendingBillsAPI.getPendingBills({ search: searchTerm });
        setPendingBills(bills);
      } else {
        const bills = await pendingBillsAPI.getCompletedBills({ search: searchTerm });
        setCompletedBills(bills);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnterResults = async (bill) => {
    try {
      const existingResult = await labResultsAPI.getResultByBillId(bill.id);
      if (existingResult) {
        alert('Results already entered for this bill!');
        return;
      }

      if (!bill.service_type_name) {
        alert('This bill does not have a test name.');
        return;
      }

      let template = null;
      try {
        template = await testTemplatesAPI.getTemplateByTestName(bill.service_type_name);
      } catch (error) {
        console.warn('Error fetching template:', error);
      }

      setSelectedBill(bill);
      setTestTemplate(template);
      setShowResultEntry(true);
    } catch (error) {
      console.error('Error opening result entry:', error);
    }
  };

  const handleViewReport = async (bill) => {
    setReportLoading(true);
    try {
      const result = await labResultsAPI.getResultByBillId(bill.id);
      if (!result) {
        alert('No result data found for this bill.');
        return;
      }
      setSelectedResult(result);
      setShowReport(true);
    } catch (error) {
      console.error('Error fetching result:', error);
      alert('Error loading report data.');
    } finally {
      setReportLoading(false);
    }
  };

  const handleResultSaved = () => {
    setShowResultEntry(false);
    setSelectedBill(null);
    setTestTemplate(null);
    fetchData();
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchData();
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPaymentStatusBadge = (status) => {
    const badges = {
      paid: 'badge-success',
      pending: 'badge-warning',
      cancelled: 'badge-danger'
    };
    return badges[status] || 'badge-info';
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">🔬 Laboratory Test Bills</h1>
          <p className="page-description">
            {activeTab === 'pending'
              ? 'Enter test results for pending bills'
              : 'View completed test results'}
          </p>
        </div>
      </div>

      {/* Statistics */}
      <div className="page-content">
        <div className="grid grid-cols-4 gap-lg" style={{ marginBottom: 'var(--space-xl)' }}>
          <div className="stat-card">
            <div className="stat-value">{stats.total || 0}</div>
            <div className="stat-label">Total Bills</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--color-warning)' }}>
              {stats.pending || 0}
            </div>
            <div className="stat-label">Pending Results</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--color-success)' }}>
              {stats.completed || 0}
            </div>
            <div className="stat-label">Results Entered</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--color-primary)' }}>
              {stats.paid || 0}
            </div>
            <div className="stat-label">Paid Bills</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-md" style={{ marginBottom: 'var(--space-lg)' }}>
          <button
            className={`btn ${activeTab === 'pending' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('pending')}
          >
            📋 Pending ({stats.pending || 0})
          </button>
          <button
            className={`btn ${activeTab === 'completed' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('completed')}
          >
            ✅ Completed ({stats.completed || 0})
          </button>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} style={{ marginBottom: 'var(--space-lg)' }}>
          <div className="search-bar">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="search-input"
              placeholder="Search by patient MRN or test name..."
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
        </form>

        {/* Bills Table */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-3xl)' }}>
            <div className="spinner" style={{ margin: '0 auto' }}></div>
            <p style={{ marginTop: 'var(--space-lg)', color: 'var(--text-secondary)' }}>
              Loading bills...
            </p>
          </div>
        ) : (
          <div className="card">
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Bill Date</th>
                    <th>Patient MRN</th>
                    <th>Test Name</th>
                    <th>Amount</th>
                    <th>Payment Status</th>
                    {activeTab === 'completed' && <th>Result Status</th>}
                    {activeTab === 'completed' && <th>Tested Date</th>}
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {activeTab === 'pending' ? (
                    pendingBills.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', padding: 'var(--space-2xl)' }}>
                          <p style={{ color: 'var(--text-secondary)' }}>
                            🎉 No pending bills! All results have been entered.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      pendingBills.map((bill) => (
                        <tr key={bill.id}>
                          <td>{formatDate(bill.bill_date)}</td>
                          <td>
                            <span className="font-semibold">{bill.patient_mrno}</span>
                          </td>
                          <td>
                            {bill.service_type_name || '(No test name)'}
                          </td>
                          <td>₹{bill.total_amount?.toFixed(2) || '0.00'}</td>
                          <td>
                            <span className={`badge ${getPaymentStatusBadge(bill.payment_status)}`}>
                              {bill.payment_status}
                            </span>
                          </td>
                          <td>
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => handleEnterResults(bill)}
                            >
                              📝 Enter Results
                            </button>
                          </td>
                        </tr>
                      ))
                    )
                  ) : (
                    completedBills.length === 0 ? (
                      <tr>
                        <td colSpan="8" style={{ textAlign: 'center', padding: 'var(--space-2xl)' }}>
                          <p style={{ color: 'var(--text-secondary)' }}>
                            No completed results found.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      completedBills.map((bill) => (
                        <tr key={bill.id}>
                          <td>{formatDate(bill.bill_date)}</td>
                          <td>
                            <span className="font-semibold">{bill.patient_mrno}</span>
                          </td>
                          <td>
                            {bill.service_type_name || '(No test name)'}
                          </td>
                          <td>₹{bill.total_amount?.toFixed(2) || '0.00'}</td>
                          <td>
                            <span className={`badge ${getPaymentStatusBadge(bill.payment_status)}`}>
                              {bill.payment_status}
                            </span>
                          </td>
                          <td>
                            <span className="badge badge-success">
                              {bill.lab_results?.status || 'completed'}
                            </span>
                          </td>
                          <td>
                            {formatDate(bill.results_entered_at)}
                            <br />
                            <small style={{ color: 'var(--text-tertiary)' }}>
                              {formatTime(bill.results_entered_at)}
                            </small>
                          </td>
                          <td>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleViewReport(bill)}
                              disabled={reportLoading}
                            >
                              {reportLoading ? '...' : '👁️ View'}
                            </button>
                          </td>
                        </tr>
                      ))
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Result Entry Modal */}
      {showResultEntry && selectedBill && (
        <TestResultEntry
          bill={selectedBill}
          template={testTemplate}
          onClose={() => {
            setShowResultEntry(false);
            setSelectedBill(null);
            setTestTemplate(null);
          }}
          onSave={handleResultSaved}
        />
      )}

      {/* Report Modal */}
      {showReport && selectedResult && (
        <LabReport
          result={selectedResult}
          onClose={() => {
            setShowReport(false);
            setSelectedResult(null);
          }}
        />
      )}
    </div>
  );
}

export default PendingBills;
