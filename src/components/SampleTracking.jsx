import { useState, useEffect } from 'react';
import { samplesAPI } from '../lib/api';

const SampleTracking = () => {
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [samples, setSamples] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [serviceTypes, setServiceTypes] = useState([]);

  const [formData, setFormData] = useState({
    patient_name: '',
    patient_mrno: '',
    test_name: '',
    sample_type: '',
    priority: 'normal',
    container_type: '',
    collected_by: '',
    clinical_notes: ''
  });

  // Fetch service types on component mount
  useEffect(() => {
    fetchServiceTypes();
  }, []);

  // Fetch samples on component mount and when filters change
  useEffect(() => {
    fetchSamples();
  }, [filterStatus, searchTerm]);

  const fetchServiceTypes = async () => {
    try {
      console.log('🔄 Fetching service types...');
      const data = await samplesAPI.getLabServiceTypes();
      console.log('📦 Received service types:', data);
      setServiceTypes(data);
      console.log('✅ Service types set in state:', data.length, 'items');
    } catch (err) {
      console.error('❌ Error fetching service types:', err);
      // Continue with empty service types if fetch fails
    }
  };

  const fetchSamples = async () => {
    try {
      setLoading(true);
      const data = await samplesAPI.getAllSamples({
        status: filterStatus,
        search: searchTerm
      });
      setSamples(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching samples:', err);
      setError('Failed to load samples');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Generate sample ID
      const sampleId = `LAB-${Date.now()}`;

      const newSample = {
        sample_id: sampleId,
        patient_name: formData.patient_name,
        patient_mrno: formData.patient_mrno,
        test_name: formData.test_name,
        sample_type: formData.sample_type,
        priority: formData.priority,
        container_type: formData.container_type,
        collected_by: formData.collected_by,
        clinical_notes: formData.clinical_notes,
        status: 'collected',
        collection_date: new Date().toISOString()
      };

      await samplesAPI.createSample(newSample);

      setShowModal(false);
      setFormData({
        patient_name: '',
        patient_mrno: '',
        test_name: '',
        sample_type: '',
        priority: 'normal',
        container_type: '',
        collected_by: '',
        clinical_notes: ''
      });

      // Refresh samples list
      fetchSamples();
    } catch (err) {
      console.error('Error creating sample:', err);
      console.error('Error details:', err.message, err.details, err.hint);
      alert(`Failed to register sample: ${err.message || 'Unknown error'}. Please check console for details.`);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await samplesAPI.updateStatus(id, newStatus);
      fetchSamples();
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update status');
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'collected':
        return 'badge-info';
      case 'in-transit':
        return 'badge-warning';
      case 'received':
        return 'badge-primary';
      case 'processing':
        return 'badge-primary';
      case 'completed':
        return 'badge-success';
      case 'rejected':
        return 'badge-danger';
      default:
        return 'badge-info';
    }
  };

  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case 'stat':
      case 'urgent':
        return 'badge-danger';
      case 'high':
        return 'badge-warning';
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
            <h1 className="page-title">Sample Tracking</h1>
            <p className="page-description">Track and manage laboratory sample collection and processing</p>
          </div>
          <button className="btn btn-primary btn-lg" onClick={() => setShowModal(true)}>
            <span style={{ fontSize: '1.25rem' }}>+</span>
            <span>Register New Sample</span>
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
                placeholder="Search by patient name, sample ID, or test type..."
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
                className={`btn ${filterStatus === 'collected' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setFilterStatus('collected')}
              >
                Collected
              </button>
              <button
                className={`btn ${filterStatus === 'processing' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setFilterStatus('processing')}
              >
                Processing
              </button>
              <button
                className={`btn ${filterStatus === 'completed' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setFilterStatus('completed')}
              >
                Completed
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

        {/* Samples Table */}
        <div className="card" style={{ padding: '0' }}>
          {loading ? (
            <div style={{ padding: 'var(--space-3xl)', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading samples...
            </div>
          ) : (
            <div className="table-container" style={{ border: 'none' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Sample ID</th>
                    <th>Patient Name</th>
                    <th>Patient MRN</th>
                    <th>Test Type</th>
                    <th>Sample Type</th>
                    <th>Container</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Collected At</th>
                    <th>Collected By</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {samples.length === 0 ? (
                    <tr>
                      <td colSpan="11" style={{ textAlign: 'center', padding: 'var(--space-3xl)', color: 'var(--text-muted)' }}>
                        No samples found
                      </td>
                    </tr>
                  ) : (
                    samples.map((sample) => (
                      <tr key={sample.id}>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: '600', color: 'var(--color-primary)' }}>
                          {sample.sample_id}
                        </td>
                        <td style={{ fontWeight: '500' }}>{sample.patient_name || 'N/A'}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}>
                          {sample.patient_mrno || 'N/A'}
                        </td>
                        <td>{sample.test_name || 'N/A'}</td>
                        <td style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                          {sample.sample_type || 'N/A'}
                        </td>
                        <td style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                          {sample.container_type || 'N/A'}
                        </td>
                        <td>
                          <span className={`badge ${getPriorityBadgeClass(sample.priority)}`}>
                            {sample.priority}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${getStatusBadgeClass(sample.status)}`}>
                            {sample.status}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>
                          {formatDate(sample.collection_date)}
                        </td>
                        <td style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                          {sample.collected_by || 'N/A'}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                            <select
                              className="btn btn-sm btn-secondary"
                              value={sample.status}
                              onChange={(e) => handleUpdateStatus(sample.id, e.target.value)}
                              style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                            >
                              <option value="collected">Collected</option>
                              <option value="in-transit">In Transit</option>
                              <option value="received">Received</option>
                              <option value="processing">Processing</option>
                              <option value="completed">Completed</option>
                              <option value="rejected">Rejected</option>
                            </select>
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

      {/* Modal for New Sample */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Register New Sample</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="grid grid-cols-2">
                  <div className="form-group">
                    <label className="form-label">Patient Name *</label>
                    <input
                      type="text"
                      className="form-input"
                      required
                      value={formData.patient_name}
                      onChange={(e) => setFormData({ ...formData, patient_name: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Patient MRN *</label>
                    <input
                      type="text"
                      className="form-input"
                      required
                      placeholder="UUID format"
                      value={formData.patient_mrno}
                      onChange={(e) => setFormData({ ...formData, patient_mrno: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2">
                  <div className="form-group">
                    <label className="form-label">Test Name *</label>
                    <select
                      className="form-select"
                      required
                      value={formData.test_name}
                      onChange={(e) => setFormData({ ...formData, test_name: e.target.value })}
                    >
                      <option value="">Select Test Type</option>
                      {serviceTypes.length > 0 ? (
                        serviceTypes.map((service) => (
                          <option key={service.id} value={service.service_type_name}>
                            {service.service_type_name}
                          </option>
                        ))
                      ) : (
                        <>
                          <option value="Complete Blood Count">Complete Blood Count (CBC)</option>
                          <option value="Lipid Profile">Lipid Profile</option>
                          <option value="Liver Function Test">Liver Function Test (LFT)</option>
                          <option value="Kidney Function Test">Kidney Function Test (KFT)</option>
                          <option value="Thyroid Function Test">Thyroid Function Test</option>
                          <option value="HbA1c">HbA1c</option>
                          <option value="Blood Sugar">Blood Sugar</option>
                          <option value="Urine Analysis">Urine Analysis</option>
                        </>
                      )}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Sample Type *</label>
                    <select
                      className="form-select"
                      required
                      value={formData.sample_type}
                      onChange={(e) => setFormData({ ...formData, sample_type: e.target.value })}
                    >
                      <option value="">Select Sample Type</option>
                      <option value="Blood">Blood</option>
                      <option value="Urine">Urine</option>
                      <option value="Serum">Serum</option>
                      <option value="Plasma">Plasma</option>
                      <option value="Tissue">Tissue</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2">
                  <div className="form-group">
                    <label className="form-label">Container Type *</label>
                    <select
                      className="form-select"
                      required
                      value={formData.container_type}
                      onChange={(e) => setFormData({ ...formData, container_type: e.target.value })}
                    >
                      <option value="">Select Container</option>
                      <option value="EDTA Tube">EDTA Tube (Purple Cap)</option>
                      <option value="Serum Tube">Serum Tube (Red Cap)</option>
                      <option value="Plasma Tube">Plasma Tube (Green Cap)</option>
                      <option value="Fluoride Tube">Fluoride Tube (Gray Cap)</option>
                      <option value="Urine Container">Urine Container</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Priority *</label>
                    <select
                      className="form-select"
                      required
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    >
                      <option value="normal">Normal</option>
                      <option value="routine">Routine</option>
                      <option value="urgent">Urgent</option>
                      <option value="stat">STAT</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Collected By *</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    value={formData.collected_by}
                    onChange={(e) => setFormData({ ...formData, collected_by: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Clinical Notes</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Additional notes or special instructions..."
                    value={formData.clinical_notes}
                    onChange={(e) => setFormData({ ...formData, clinical_notes: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Register Sample
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SampleTracking;
