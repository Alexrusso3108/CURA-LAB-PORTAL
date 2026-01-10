import { useState, useEffect } from 'react';
import { reportsAPI, samplesAPI } from '../lib/api';

const ReportGeneration = () => {
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [reports, setReports] = useState([]);
  const [samples, setSamples] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    sample_id: '',
    patient_name: '',
    patient_mrno: '',
    test_name: '',
    findings: '',
    interpretation: '',
    recommendations: '',
    tested_by: '',
    is_urgent: false
  });

  // Fetch reports and samples on component mount
  useEffect(() => {
    fetchReports();
    fetchSamples();
  }, [filterStatus, searchTerm]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const data = await reportsAPI.getAllReports({
        status: filterStatus,
        search: searchTerm
      });
      setReports(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const fetchSamples = async () => {
    try {
      // Fetch all samples (not just completed ones)
      const data = await samplesAPI.getAllSamples();
      console.log('📦 Fetched samples for report dropdown:', data);
      setSamples(data);
    } catch (err) {
      console.error('Error fetching samples:', err);
    }
  };

  const handleSampleSelect = (e) => {
    const selectedSample = samples.find(s => s.id === e.target.value);
    if (selectedSample) {
      setFormData({
        ...formData,
        sample_id: selectedSample.id,
        patient_name: selectedSample.patient_name,
        patient_mrno: selectedSample.patient_mrno,
        test_name: selectedSample.test_name
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await reportsAPI.createReport({
        ...formData,
        status: 'draft',
        report_date: new Date().toISOString()
      });

      setShowModal(false);
      setFormData({
        sample_id: '',
        patient_name: '',
        patient_mrno: '',
        test_name: '',
        findings: '',
        interpretation: '',
        recommendations: '',
        tested_by: '',
        is_urgent: false
      });

      fetchReports();
    } catch (err) {
      console.error('Error creating report:', err);
      alert(`Failed to generate report: ${err.message || 'Unknown error'}`);
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await reportsAPI.updateReportStatus(id, newStatus);
      fetchReports();
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update status');
    }
  };

  const handlePublish = async (id) => {
    try {
      await reportsAPI.publishReport(id, 'Lab Admin');
      fetchReports();
    } catch (err) {
      console.error('Error publishing report:', err);
      alert('Failed to publish report');
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'draft':
        return 'badge-secondary';
      case 'pending-review':
        return 'badge-warning';
      case 'reviewed':
        return 'badge-info';
      case 'approved':
        return 'badge-primary';
      case 'published':
        return 'badge-success';
      case 'cancelled':
        return 'badge-danger';
      default:
        return 'badge-secondary';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-IN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className="page-title">Report Generation</h1>
            <p className="page-description">Generate and manage laboratory reports</p>
          </div>
          <button className="btn btn-primary btn-lg" onClick={() => setShowModal(true)}>
            <span style={{ fontSize: '1.25rem' }}>+</span>
            <span>Generate Report</span>
          </button>
        </div>
      </div>

      <div className="page-content">
        {/* Filters and Search */}
        <div className="card" style={{ padding: 'var(--space-xl)', marginBottom: 'var(--space-xl)' }}>
          <div style={{ display: 'flex', gap: 'var(--space-lg)', alignItems: 'center' }}>
            <div className="search-bar" style={{ flex: 1 }}>
              <span className="search-icon">🔍</span>
              <input
                type="text"
                className="search-input"
                placeholder="Search by report number, patient name, or test..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
              <button
                className={`btn ${filterStatus === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setFilterStatus('all')}
              >
                All
              </button>
              <button
                className={`btn ${filterStatus === 'draft' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setFilterStatus('draft')}
              >
                Draft
              </button>
              <button
                className={`btn ${filterStatus === 'approved' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setFilterStatus('approved')}
              >
                Approved
              </button>
              <button
                className={`btn ${filterStatus === 'published' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setFilterStatus('published')}
              >
                Published
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="card" style={{ padding: 'var(--space-lg)', marginBottom: 'var(--space-xl)', backgroundColor: 'var(--color-danger-light)', borderLeft: '4px solid var(--color-danger)' }}>
            <p style={{ color: 'var(--color-danger)', margin: 0 }}>{error}</p>
          </div>
        )}

        {/* Reports Table */}
        <div className="card" style={{ padding: '0' }}>
          {loading ? (
            <div style={{ padding: 'var(--space-3xl)', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading reports...
            </div>
          ) : (
            <div className="table-container" style={{ border: 'none' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Report Number</th>
                    <th>Patient Name</th>
                    <th>Test Name</th>
                    <th>Status</th>
                    <th>Report Date</th>
                    <th>Tested By</th>
                    <th>Urgent</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: 'var(--space-3xl)', color: 'var(--text-muted)' }}>
                        No reports found
                      </td>
                    </tr>
                  ) : (
                    reports.map((report) => (
                      <tr key={report.id}>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: '600', color: 'var(--color-primary)' }}>
                          {report.report_number || 'N/A'}
                        </td>
                        <td style={{ fontWeight: '500' }}>
                          {report.patient_name || report.samples?.patient_name || 'N/A'}
                        </td>
                        <td>{report.test_name || report.samples?.test_name || 'N/A'}</td>
                        <td>
                          <span className={`badge ${getStatusBadgeClass(report.status)}`}>
                            {report.status || 'draft'}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>
                          {formatDate(report.report_date)}
                        </td>
                        <td style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                          {report.tested_by || 'N/A'}
                        </td>
                        <td>
                          {report.is_urgent && (
                            <span className="badge badge-danger" style={{ fontSize: '0.7rem' }}>
                              URGENT
                            </span>
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                            <select
                              className="btn btn-sm btn-secondary"
                              value={report.status}
                              onChange={(e) => handleStatusUpdate(report.id, e.target.value)}
                              style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                            >
                              <option value="draft">Draft</option>
                              <option value="pending-review">Pending Review</option>
                              <option value="reviewed">Reviewed</option>
                              <option value="approved">Approved</option>
                              <option value="published">Published</option>
                            </select>
                            {report.status === 'approved' && (
                              <button
                                className="btn btn-sm btn-success"
                                onClick={() => handlePublish(report.id)}
                                style={{ padding: '4px 12px', fontSize: '0.75rem' }}
                              >
                                Publish
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal for New Report */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Generate Report</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Sample *</label>
                  <select
                    className="form-select"
                    required
                    value={formData.sample_id}
                    onChange={handleSampleSelect}
                  >
                    <option value="">Select Sample</option>
                    {samples.map((sample) => (
                      <option key={sample.id} value={sample.id}>
                        {sample.sample_id} - {sample.patient_name} - {sample.test_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2">
                  <div className="form-group">
                    <label className="form-label">Patient Name</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.patient_name}
                      readOnly
                      style={{ backgroundColor: 'var(--bg-tertiary)' }}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Test Name</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.test_name}
                      readOnly
                      style={{ backgroundColor: 'var(--bg-tertiary)' }}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Findings *</label>
                  <textarea
                    className="form-textarea"
                    required
                    placeholder="Enter test findings..."
                    value={formData.findings}
                    onChange={(e) => setFormData({ ...formData, findings: e.target.value })}
                    rows="3"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Interpretation *</label>
                  <textarea
                    className="form-textarea"
                    required
                    placeholder="Clinical interpretation..."
                    value={formData.interpretation}
                    onChange={(e) => setFormData({ ...formData, interpretation: e.target.value })}
                    rows="3"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Recommendations</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Doctor's recommendations..."
                    value={formData.recommendations}
                    onChange={(e) => setFormData({ ...formData, recommendations: e.target.value })}
                    rows="2"
                  />
                </div>

                <div className="grid grid-cols-2">
                  <div className="form-group">
                    <label className="form-label">Tested By *</label>
                    <input
                      type="text"
                      className="form-input"
                      required
                      value={formData.tested_by}
                      onChange={(e) => setFormData({ ...formData, tested_by: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">
                      <input
                        type="checkbox"
                        checked={formData.is_urgent}
                        onChange={(e) => setFormData({ ...formData, is_urgent: e.target.checked })}
                        style={{ marginRight: '8px' }}
                      />
                      Mark as Urgent
                    </label>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Generate Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportGeneration;
