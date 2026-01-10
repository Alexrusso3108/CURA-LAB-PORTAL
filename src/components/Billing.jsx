import { useState, useEffect } from 'react';
import { billingAPI, debugTableStructure } from '../lib/api';

// Updated: Using correct column names from opbilling table

const Billing = () => {
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showInvoicePreview, setShowInvoicePreview] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    patientName: '',
    patientId: '',
    contactNumber: '',
    billType: 'outpatient', // outpatient or inpatient
    tests: [{ testName: '', price: '' }]
  });

  const [bills, setBills] = useState([]);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    pendingPayments: 0,
    totalInvoices: 0,
    paidInvoices: 0
  });

  const testPriceList = [
    { name: 'Complete Blood Count', price: 450 },
    { name: 'Lipid Profile', price: 850 },
    { name: 'Liver Function Test', price: 650 },
    { name: 'Kidney Function Test', price: 700 },
    { name: 'Thyroid Function Test', price: 750 },
    { name: 'HbA1c', price: 550 },
    { name: 'Blood Sugar', price: 150 },
    { name: 'Urine Analysis', price: 300 },
  ];

  // Fetch bills on component mount
  useEffect(() => {
    // Debug: Check table structure on first load
    debugTableStructure();

    fetchBills();
    fetchStats();
  }, [filterStatus, searchTerm]);

  const fetchBills = async () => {
    try {
      setLoading(true);
      const data = await billingAPI.getAllLabBills({ status: filterStatus, search: searchTerm });
      setBills(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching bills:', err);
      setError('Failed to load bills. Please check your connection to Supabase.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const statsData = await billingAPI.getStats();
      setStats(statsData);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const handleAddTest = () => {
    setFormData({
      ...formData,
      tests: [...formData.tests, { testName: '', price: '' }]
    });
  };

  const handleRemoveTest = (index) => {
    const newTests = formData.tests.filter((_, i) => i !== index);
    setFormData({ ...formData, tests: newTests });
  };

  const handleTestChange = (index, field, value) => {
    const newTests = [...formData.tests];
    newTests[index][field] = value;

    // Auto-fill price when test is selected
    if (field === 'testName') {
      const selectedTest = testPriceList.find(t => t.name === value);
      if (selectedTest) {
        newTests[index].price = selectedTest.price;
      }
    }

    setFormData({ ...formData, tests: newTests });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const subtotal = formData.tests.reduce((sum, test) => sum + parseFloat(test.price || 0), 0);
      const tax = subtotal * 0.18; // 18% GST
      const total = subtotal + tax;

      const billData = {
        patient_name: formData.patientName,
        patient_id: formData.patientId,
        contact_number: formData.contactNumber,
        bill_date: new Date().toISOString().split('T')[0],
        tests: JSON.stringify(formData.tests.map(t => ({ name: t.testName, price: parseFloat(t.price) }))),
        subtotal,
        tax,
        total,
        total_amount: total, // Some schemas might use total_amount
        status: 'pending',
        payment_method: null,
        paid_date: null
      };

      // Create bill based on type (outpatient or inpatient)
      if (formData.billType === 'outpatient') {
        await billingAPI.createOutpatientBill(billData);
      } else {
        await billingAPI.createInpatientBill(billData);
      }

      // Refresh bills
      await fetchBills();
      await fetchStats();

      setShowModal(false);
      setFormData({
        patientName: '',
        patientId: '',
        contactNumber: '',
        billType: 'outpatient',
        tests: [{ testName: '', price: '' }]
      });
    } catch (err) {
      console.error('Error creating bill:', err);
      alert('Failed to create bill. Please try again.');
    }
  };

  const handleMarkAsPaid = async (bill, paymentMethod) => {
    try {
      await billingAPI.markAsPaid(bill.id, paymentMethod, bill.source);
      await fetchBills();
      await fetchStats();
    } catch (err) {
      console.error('Error marking bill as paid:', err);
      alert('Failed to update bill status.');
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'paid':
        return 'badge-success';
      case 'pending':
        return 'badge-warning';
      case 'cancelled':
        return 'badge-danger';
      default:
        return 'badge-info';
    }
  };

  // Parse tests from JSON string if needed
  const parseTests = (testsData) => {
    if (typeof testsData === 'string') {
      try {
        return JSON.parse(testsData);
      } catch {
        return [];
      }
    }
    return testsData || [];
  };

  // Helper functions to get field values (handles different column names)
  const getPatientName = (bill) => {
    // For opbilling, show the patient MRN as the "name" since we don't have actual patient names
    // The MRN is the patient identifier
    return bill.patient_mrno || 'N/A';
  };

  const getPatientId = (bill) => {
    // opbilling uses patient_mrno, inpatient_bills uses patient_mrno too
    const possibleIds = [
      bill.patient_mrno,  // Actual column in both tables
      bill.patient_id,
      bill.uhid,
      bill.mrn,
      bill.patient_number
    ];

    const result = possibleIds.find(val => val && val !== null && val !== 'null' && val !== '');
    return result || 'N/A';
  };

  const getTotalAmount = (bill) => {
    return parseFloat(
      bill.total ||
      bill.total_amount ||
      bill.amount ||
      bill.bill_amount ||
      bill.totalAmount ||
      bill.total_bill ||
      0
    );
  };

  const getTaxAmount = (bill) => {
    return parseFloat(
      bill.tax ||
      bill.gst ||
      bill.tax_amount ||
      bill.gst_amount ||
      0
    );
  };

  const getBillDate = (bill) => {
    return bill.bill_date || bill.created_at?.split('T')[0] || bill.date || 'N/A';
  };

  const getBillId = (bill) => {
    // opbilling uses bill_number, inpatient uses bill_id
    return bill.bill_number || bill.opbill_id || bill.bill_id || bill.id || 'N/A';
  };

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className="page-title">Laboratory Billing & Invoicing</h1>
            <p className="page-description">Manage laboratory test invoices and payments</p>
          </div>
          <button className="btn btn-primary btn-lg" onClick={() => setShowModal(true)}>
            + Create New Invoice
          </button>
        </div>
      </div>

      <div className="page-content">
        {/* Error Message */}
        {error && (
          <div style={{
            padding: 'var(--space-lg)',
            background: 'hsla(0, 84%, 60%, 0.1)',
            border: '1px solid var(--color-danger)',
            borderRadius: 'var(--radius-md)',
            marginBottom: 'var(--space-xl)',
            color: 'var(--color-danger)'
          }}>
            {error}
          </div>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-4" style={{ marginBottom: 'var(--space-xl)' }}>
          <div className="stat-card">
            <div className="stat-value">₹{stats.totalRevenue.toLocaleString('en-IN')}</div>
            <div className="stat-label">Total Revenue</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--color-warning)' }}>
              ₹{stats.pendingPayments.toLocaleString('en-IN')}
            </div>
            <div className="stat-label">Pending Payments</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.totalInvoices}</div>
            <div className="stat-label">Total Lab Invoices</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.paidInvoices}</div>
            <div className="stat-label">Paid Invoices</div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="card" style={{ padding: 'var(--space-xl)', marginBottom: 'var(--space-xl)' }}>
          <div style={{ display: 'flex', gap: 'var(--space-lg)', alignItems: 'center' }}>
            <div className="search-bar" style={{ flex: 1 }}>
              <span className="search-icon">🔍</span>
              <input
                type="text"
                className="search-input"
                placeholder="Search by patient name, bill ID, or patient ID..."
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
                className={`btn ${filterStatus === 'paid' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setFilterStatus('paid')}
              >
                Paid
              </button>
            </div>
          </div>
        </div>

        {/* Bills Table */}
        <div className="card" style={{ padding: '0' }}>
          {loading ? (
            <div style={{ padding: 'var(--space-3xl)', textAlign: 'center' }}>
              <div className="spinner" style={{ margin: '0 auto' }}></div>
              <p style={{ marginTop: 'var(--space-md)', color: 'var(--text-secondary)' }}>Loading bills...</p>
            </div>
          ) : (
            <div className="table-container" style={{ border: 'none' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Bill ID</th>
                    <th>Type</th>
                    <th>Patient Details</th>
                    <th>Date</th>
                    <th>Tests</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Payment Method</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bills.length === 0 ? (
                    <tr>
                      <td colSpan="9" style={{ textAlign: 'center', padding: 'var(--space-3xl)', color: 'var(--text-muted)' }}>
                        No laboratory bills found
                      </td>
                    </tr>
                  ) : (
                    bills.map((bill) => {
                      const billTests = parseTests(bill.tests);
                      const billId = getBillId(bill);
                      const billDate = getBillDate(bill);
                      const billTotal = getTotalAmount(bill);
                      const billTax = getTaxAmount(bill);
                      const patientName = getPatientName(bill);
                      const patientId = getPatientId(bill);

                      return (
                        <tr key={bill.id}>
                          <td style={{ fontFamily: 'var(--font-mono)', fontWeight: '600', color: 'var(--color-primary)' }}>
                            {billId}
                          </td>
                          <td>
                            <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>
                              {bill.source || 'N/A'}
                            </span>
                          </td>
                          <td>
                            <div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '4px' }}>
                                Patient MRN
                              </div>
                              <div style={{ fontWeight: '600', fontFamily: 'var(--font-mono)', fontSize: '0.875rem' }}>
                                {patientId}
                              </div>
                            </div>
                          </td>
                          <td style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>
                            {billDate}
                          </td>
                          <td>
                            <div style={{ fontSize: '0.8125rem' }}>
                              {bill.service_name ? (
                                <div style={{ marginBottom: '2px', color: 'var(--text-secondary)' }}>
                                  {bill.service_name}
                                </div>
                              ) : billTests.length > 0 ? (
                                billTests.map((test, idx) => (
                                  <div key={idx} style={{ marginBottom: '2px', color: 'var(--text-secondary)' }}>
                                    • {test.name || test.testName || 'Unknown Test'}
                                  </div>
                                ))
                              ) : (
                                <span style={{ color: 'var(--text-muted)' }}>No tests listed</span>
                              )}
                            </div>
                          </td>
                          <td>
                            <div style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--color-success)' }}>
                              ₹{parseFloat(billTotal).toLocaleString('en-IN')}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                              +₹{parseFloat(billTax).toFixed(2)} GST
                            </div>
                          </td>
                          <td>
                            <span className={`badge ${getStatusBadgeClass(bill.payment_status || bill.status)}`}>
                              {bill.payment_status || bill.status || 'pending'}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                            {bill.payment_method || '-'}
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                              <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => {
                                  setSelectedInvoice({
                                    ...bill,
                                    id: billId,
                                    tests: billTests,
                                    patientName: bill.patient_name,
                                    patientId: bill.patient_id,
                                    date: billDate,
                                    total: billTotal,
                                    tax: billTax,
                                    subtotal: bill.subtotal || (billTotal - billTax)
                                  });
                                  setShowInvoicePreview(true);
                                }}
                              >
                                View
                              </button>
                              {bill.status === 'pending' && (
                                <button
                                  className="btn btn-success btn-sm"
                                  onClick={() => handleMarkAsPaid(bill, 'Cash')}
                                >
                                  ✓ Mark Paid
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create Bill Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: '800px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Create New Lab Bill</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="grid grid-cols-2">
                  <div className="form-group">
                    <label className="form-label">Bill Type *</label>
                    <select
                      className="form-select"
                      required
                      value={formData.billType}
                      onChange={(e) => setFormData({ ...formData, billType: e.target.value })}
                    >
                      <option value="outpatient">Outpatient</option>
                      <option value="inpatient">Inpatient</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Patient ID *</label>
                    <input
                      type="text"
                      className="form-input"
                      required
                      value={formData.patientId}
                      onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2">
                  <div className="form-group">
                    <label className="form-label">Patient Name *</label>
                    <input
                      type="text"
                      className="form-input"
                      required
                      value={formData.patientName}
                      onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Contact Number</label>
                    <input
                      type="tel"
                      className="form-input"
                      value={formData.contactNumber}
                      onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
                    <label className="form-label" style={{ marginBottom: 0 }}>Lab Tests *</label>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={handleAddTest}>
                      + Add Test
                    </button>
                  </div>

                  {formData.tests.map((test, index) => (
                    <div key={index} style={{
                      display: 'grid',
                      gridTemplateColumns: '2fr 1fr auto',
                      gap: 'var(--space-md)',
                      marginBottom: 'var(--space-md)',
                      padding: 'var(--space-md)',
                      background: 'var(--bg-tertiary)',
                      borderRadius: 'var(--radius-md)'
                    }}>
                      <select
                        className="form-select"
                        required
                        value={test.testName}
                        onChange={(e) => handleTestChange(index, 'testName', e.target.value)}
                        style={{ margin: 0 }}
                      >
                        <option value="">Select Lab Test</option>
                        {testPriceList.map((t, i) => (
                          <option key={i} value={t.name}>{t.name}</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        className="form-input"
                        placeholder="Price"
                        required
                        value={test.price}
                        onChange={(e) => handleTestChange(index, 'price', e.target.value)}
                        style={{ margin: 0 }}
                      />
                      {formData.tests.length > 1 && (
                        <button
                          type="button"
                          className="btn btn-danger btn-sm btn-icon"
                          onClick={() => handleRemoveTest(index)}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Bill Summary */}
                <div style={{
                  marginTop: 'var(--space-xl)',
                  padding: 'var(--space-lg)',
                  background: 'var(--bg-tertiary)',
                  borderRadius: 'var(--radius-md)'
                }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: 'var(--space-md)' }}>
                    Bill Summary
                  </h3>
                  {(() => {
                    const subtotal = formData.tests.reduce((sum, test) => sum + parseFloat(test.price || 0), 0);
                    const tax = subtotal * 0.18;
                    const total = subtotal + tax;
                    return (
                      <div style={{ fontSize: '0.875rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-sm)' }}>
                          <span>Subtotal:</span>
                          <span style={{ fontWeight: '600' }}>₹{subtotal.toFixed(2)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-sm)' }}>
                          <span>GST (18%):</span>
                          <span style={{ fontWeight: '600' }}>₹{tax.toFixed(2)}</span>
                        </div>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          paddingTop: 'var(--space-sm)',
                          borderTop: '1px solid var(--border-color)',
                          fontSize: '1rem'
                        }}>
                          <span style={{ fontWeight: '700' }}>Total Amount:</span>
                          <span style={{ fontWeight: '800', color: 'var(--color-success)' }}>
                            ₹{total.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Bill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Preview Modal - Keeping the same structure */}
      {showInvoicePreview && selectedInvoice && (
        <div className="modal-backdrop" onClick={() => setShowInvoicePreview(false)}>
          <div className="modal" style={{ maxWidth: '800px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Invoice Preview</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowInvoicePreview(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{
                background: 'white',
                color: '#000',
                padding: 'var(--space-3xl)',
                borderRadius: 'var(--radius-lg)',
                fontFamily: 'Arial, sans-serif'
              }}>
                <div style={{ textAlign: 'center', marginBottom: 'var(--space-xl)' }}>
                  <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '8px' }}>Cura Hospital</h1>
                  <p style={{ fontSize: '0.875rem', color: '#666' }}>Laboratory Department - Bengaluru, Karnataka</p>
                  <h2 style={{ fontSize: '1.5rem', marginTop: 'var(--space-md)', color: 'hsl(195, 100%, 40%)' }}>
                    LAB TAX INVOICE
                  </h2>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-xl)', marginBottom: 'var(--space-xl)' }}>
                  <div>
                    <p style={{ fontSize: '0.75rem', color: '#666', marginBottom: '4px' }}>Invoice To:</p>
                    <p style={{ fontWeight: '700', fontSize: '1rem' }}>{selectedInvoice.patientName}</p>
                    <p style={{ fontSize: '0.875rem', color: '#666' }}>Patient ID: {selectedInvoice.patientId}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '0.875rem', marginBottom: '4px' }}>
                      <strong>Invoice #:</strong> {selectedInvoice.id}
                    </p>
                    <p style={{ fontSize: '0.875rem', marginBottom: '4px' }}>
                      <strong>Date:</strong> {selectedInvoice.date}
                    </p>
                    <p style={{ fontSize: '0.875rem' }}>
                      <strong>Status:</strong>{' '}
                      <span style={{
                        padding: '2px 8px',
                        background: selectedInvoice.status === 'paid' ? '#d4edda' : '#fff3cd',
                        color: selectedInvoice.status === 'paid' ? '#155724' : '#856404',
                        borderRadius: '4px'
                      }}>
                        {selectedInvoice.status?.toUpperCase() || 'PENDING'}
                      </span>
                    </p>
                  </div>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 'var(--space-xl)' }}>
                  <thead>
                    <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Lab Test Name</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedInvoice.tests && selectedInvoice.tests.map((test, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #dee2e6' }}>
                        <td style={{ padding: '12px' }}>{test.name || test.testName}</td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>₹{parseFloat(test.price).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div style={{ textAlign: 'right', fontSize: '0.875rem' }}>
                  <div style={{ marginBottom: '8px' }}>
                    <strong>Subtotal:</strong> ₹{parseFloat(selectedInvoice.subtotal).toFixed(2)}
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <strong>GST (18%):</strong> ₹{parseFloat(selectedInvoice.tax).toFixed(2)}
                  </div>
                  <div style={{
                    fontSize: '1.25rem',
                    fontWeight: '800',
                    paddingTop: '12px',
                    borderTop: '2px solid #000'
                  }}>
                    Total: ₹{parseFloat(selectedInvoice.total).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowInvoicePreview(false)}>
                Close
              </button>
              <button type="button" className="btn btn-primary">
                Print Invoice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Billing;
