import { useState, useEffect } from 'react';
import { testResultsAPI, samplesAPI } from '../lib/api';

const TestResults = () => {
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [results, setResults] = useState([]);
  const [samples, setSamples] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    sample_id: '',
    test_name: '',
    result_value: '',
    result_unit: '',
    reference_range: '',
    interpretation: 'normal',
    tested_by: '',
    result_notes: ''
  });

  // Fetch test results and samples on component mount
  useEffect(() => {
    fetchTestResults();
    fetchSamples();
  }, [filterStatus, searchTerm]);

  const fetchTestResults = async () => {
    try {
      setLoading(true);
      const data = await testResultsAPI.getAllTestResults({
        status: filterStatus,
        search: searchTerm
      });
      setResults(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching test results:', err);
      setError('Failed to load test results');
    } finally {
      setLoading(false);
    }
  };

  const fetchSamples = async () => {
    try {
      // Fetch all samples (not just completed ones)
      const data = await samplesAPI.getAllSamples();
      console.log('📦 Fetched samples for dropdown:', data);
      setSamples(data);
    } catch (err) {
      console.error('Error fetching samples:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await testResultsAPI.createTestResult({
        ...formData,
        result_status: 'completed',
        tested_date: new Date().toISOString(),
        is_abnormal: formData.interpretation !== 'normal',
        is_critical: formData.interpretation === 'critical'
      });

      setShowModal(false);
      setFormData({
        sample_id: '',
        test_name: '',
        result_value: '',
        result_unit: '',
        reference_range: '',
        interpretation: 'normal',
        tested_by: '',
        result_notes: ''
      });

      fetchTestResults();
    } catch (err) {
      console.error('Error creating test result:', err);
      alert(`Failed to add test result: ${err.message || 'Unknown error'}`);
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await testResultsAPI.updateResultStatus(id, newStatus);
      fetchTestResults();
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update status');
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending':
        return 'badge-warning';
      case 'in-progress':
        return 'badge-info';
      case 'completed':
        return 'badge-primary';
      case 'verified':
        return 'badge-success';
      case 'approved':
        return 'badge-success';
      default:
        return 'badge-info';
    }
  };

  const getInterpretationBadgeClass = (interpretation) => {
    switch (interpretation) {
      case 'normal':
        return 'badge-success';
      case 'abnormal':
        return 'badge-warning';
      case 'critical':
        return 'badge-danger';
      case 'borderline':
        return 'badge-info';
      default:
        return 'badge-info';
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
            <h1 className="page-title">Test Results</h1>
            <p className="page-description">View and manage laboratory test results</p>
          </div>
          <button className="btn btn-primary btn-lg" onClick={() => setShowModal(true)}>
            <span style={{ fontSize: '1.25rem' }}>+</span>
            <span>Add Test Result</span>
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
                placeholder="Search by test name..."
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
                className={`btn ${filterStatus === 'pending' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setFilterStatus('pending')}
              >
                Pending
              </button>
              <button
                className={`btn ${filterStatus === 'completed' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setFilterStatus('completed')}
              >
                Completed
              </button>
              <button
                className={`btn ${filterStatus === 'verified' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setFilterStatus('verified')}
              >
                Verified
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

        {/* Test Results Table */}
        <div className="card" style={{ padding: '0' }}>
          {loading ? (
            <div style={{ padding: 'var(--space-3xl)', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading test results...
            </div>
          ) : (
            <div className="table-container" style={{ border: 'none' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Sample ID</th>
                    <th>Patient Name</th>
                    <th>Test Name</th>
                    <th>Result Value</th>
                    <th>Reference Range</th>
                    <th>Interpretation</th>
                    <th>Status</th>
                    <th>Tested Date</th>
                    <th>Tested By</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {results.length === 0 ? (
                    <tr>
                      <td colSpan="10" style={{ textAlign: 'center', padding: 'var(--space-3xl)', color: 'var(--text-muted)' }}>
                        No test results found
                      </td>
                    </tr>
                  ) : (
                    results.map((result) => (
                      <tr key={result.id}>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: '600', color: 'var(--color-primary)' }}>
                          {result.samples?.sample_id || 'N/A'}
                        </td>
                        <td style={{ fontWeight: '500' }}>
                          {result.samples?.patient_name || 'N/A'}
                        </td>
                        <td>{result.test_name || 'N/A'}</td>
                        <td style={{ fontWeight: '600' }}>
                          {result.result_value || 'N/A'} {result.result_unit || ''}
                        </td>
                        <td style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                          {result.reference_range || 'N/A'}
                        </td>
                        <td>
                          <span className={`badge ${getInterpretationBadgeClass(result.interpretation)}`}>
                            {result.interpretation || 'N/A'}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${getStatusBadgeClass(result.result_status)}`}>
                            {result.result_status || 'pending'}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>
                          {formatDate(result.tested_date)}
                        </td>
                        <td style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                          {result.tested_by || 'N/A'}
                        </td>
                        <td>
                          <select
                            className="btn btn-sm btn-secondary"
                            value={result.result_status}
                            onChange={(e) => handleStatusUpdate(result.id, e.target.value)}
                            style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                          >
                            <option value="pending">Pending</option>
                            <option value="in-progress">In Progress</option>
                            <option value="completed">Completed</option>
                            <option value="verified">Verified</option>
                            <option value="approved">Approved</option>
                          </select>
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

      {/* Modal for New Test Result */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Add Test Result</h2>
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
                    onChange={(e) => setFormData({ ...formData, sample_id: e.target.value })}
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
                    <label className="form-label">Test Name *</label>
                    <input
                      type="text"
                      className="form-input"
                      required
                      value={formData.test_name}
                      onChange={(e) => setFormData({ ...formData, test_name: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Result Value *</label>
                    <input
                      type="text"
                      className="form-input"
                      required
                      value={formData.result_value}
                      onChange={(e) => setFormData({ ...formData, result_value: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2">
                  <div className="form-group">
                    <label className="form-label">Unit</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="mg/dL, cells/μL, etc."
                      value={formData.result_unit}
                      onChange={(e) => setFormData({ ...formData, result_unit: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Reference Range</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g., 70-100 mg/dL"
                      value={formData.reference_range}
                      onChange={(e) => setFormData({ ...formData, reference_range: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2">
                  <div className="form-group">
                    <label className="form-label">Interpretation *</label>
                    <select
                      className="form-select"
                      required
                      value={formData.interpretation}
                      onChange={(e) => setFormData({ ...formData, interpretation: e.target.value })}
                    >
                      <option value="normal">Normal</option>
                      <option value="abnormal">Abnormal</option>
                      <option value="critical">Critical</option>
                      <option value="borderline">Borderline</option>
                    </select>
                  </div>
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
                </div>

                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Additional notes or observations..."
                    value={formData.result_notes}
                    onChange={(e) => setFormData({ ...formData, result_notes: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Add Result
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestResults;
