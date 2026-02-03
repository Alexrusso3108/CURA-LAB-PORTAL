import { useState, useEffect } from 'react';
import { labResultsAPI, patientDataAPI } from '../lib/newApi';
import { supabase } from '../lib/supabase';

function TestResultEntry({ bill, template, onClose, onSave }) {
  const [formData, setFormData] = useState({
    bill_id: bill.id,
    patient_mrno: bill.patient_mrno,
    patient_name: bill.patient_name || bill.name || '',
    patient_age: bill.patient_age || bill.age || null,
    patient_gender: bill.patient_gender || bill.gender || '',
    test_name: bill.service_type_name,
    test_parameters: {},
    overall_interpretation: 'normal',
    tested_by: '',
    technician_notes: '',
    status: 'draft'
  });

  const [parameters, setParameters] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Initialize parameters from template or create generic fields
    if (template && template.parameters) {
      const params = typeof template.parameters === 'string'
        ? JSON.parse(template.parameters)
        : template.parameters;

      setParameters(params.sort((a, b) => a.order - b.order));

      // Initialize test_parameters with empty values
      const initialParams = {};
      params.forEach(param => {
        initialParams[param.name] = {
          value: '',
          unit: param.unit,
          reference_range: param.reference_range,
          status: 'normal',
          flag: '',
          order: param.order
        };
      });

      setFormData(prev => ({
        ...prev,
        test_parameters: initialParams
      }));
    } else {
      // No template found - create a generic text area
      setParameters([]);
    }
  }, [template]);

  // Fetch patient data from appointments table
  // Ultra-robust fetch for patient data with enhanced debugging
  useEffect(() => {
    const fetchPatientData = async () => {
      const mrno = bill.patient_mrno || bill.mrno;
      const appId = bill.appointment_id;
      const billId = bill.id || bill.opbill_id;

      console.log('🔍 Starting patient data fetch...', {
        mrno,
        appId,
        billId,
        billObject: bill
      });

      if (!mrno && !appId) {
        console.warn('⚠️ No MRNO or Appointment ID available');
        return;
      }

      try {
        let foundName = '';
        let foundAge = null;
        let foundGender = '';

        // Quick fetch using centralized API
        const patientInfo = await patientDataAPI.fetchPatientInfo(mrno, appId);
        if (patientInfo) {
          console.log('✅ Got patient data from API:', patientInfo);
          foundName = patientInfo.name;
          foundAge = patientInfo.age;
          foundGender = patientInfo.gender;

          // Update state immediately if we have data
          if (foundName || foundAge || foundGender) {
            setFormData(prev => ({
              ...prev,
              patient_name: foundName || prev.patient_name,
              patient_age: foundAge || prev.patient_age,
              patient_gender: foundGender || prev.patient_gender
            }));
            return; // Exit early if we found everything
          }
        }

        // Fallback: Manual detailed search if API didn't return complete data

        // 1. Try Appointments table (Multiple strategies)
        if (appId || mrno) {
          console.log('🔎 Searching appointments table...');

          // Strategy 1a: By appointment_id
          if (appId) {
            const { data: appData1, error: err1 } = await supabase
              .from('appointments')
              .select('patient_name, mrno')
              .eq('appointment_id', appId)
              .maybeSingle();

            if (err1) console.warn('Appointments query 1 error:', err1);
            if (appData1?.patient_name) {
              console.log('✅ Found in appointments (by appointment_id):', appData1.patient_name);
              foundName = appData1.patient_name;
            }
          }

          // Strategy 1b: By MRNO
          if (!foundName && mrno) {
            const { data: appData2, error: err2 } = await supabase
              .from('appointments')
              .select('patient_name, mrno')
              .eq('mrno', mrno)
              .order('created_at', { ascending: false })
              .limit(1);

            if (err2) console.warn('Appointments query 2 error:', err2);
            if (appData2 && appData2.length > 0 && appData2[0].patient_name) {
              console.log('✅ Found in appointments (by MRNO):', appData2[0].patient_name);
              foundName = appData2[0].patient_name;
            }
          }
        }

        // 2. Try Users table
        if (mrno) {
          console.log('🔎 Searching users table...');

          // Only MRNO match - users table doesn't have 'id' column
          const { data: userData1, error: err3 } = await supabase
            .from('users')
            .select('name, age, gender, mrno')
            .eq('mrno', mrno)
            .maybeSingle();

          if (err3) console.warn('Users query error:', err3);
          if (userData1) {
            console.log('✅ Found in users (by MRNO):', userData1);
            foundName = foundName || userData1.name || '';
            foundAge = userData1.age;
            foundGender = userData1.gender || '';
          }
        }

        // 3. Try Walk-in Patients table - SKIPPED (mrno column doesn't exist)
        // The walk_in_patients table doesn't have an mrno column in your database

        // 4. Check if opbilling itself has patient data columns
        if (!foundName) {
          console.log('🔎 Checking bill object for patient data...');
          if (bill.patient_name) {
            console.log('✅ Found patient_name in bill object:', bill.patient_name);
            foundName = bill.patient_name;
          }
          if (bill.patient_age) {
            foundAge = foundAge || bill.patient_age;
          }
          if (bill.patient_gender) {
            foundGender = foundGender || bill.patient_gender;
          }
        }

        // Update state with everything we found
        if (foundName || foundAge || foundGender) {
          console.log('✅ Patient data found:', { foundName, foundAge, foundGender });
          setFormData(prev => ({
            ...prev,
            patient_name: foundName || prev.patient_name,
            patient_age: foundAge || prev.patient_age,
            patient_gender: foundGender || prev.patient_gender
          }));
        } else {
          console.error('❌ Patient not found in any table. MRNO:', mrno);
          console.log('💡 Suggestion: Run diagnose-patient-fetch.sql to investigate');
        }

      } catch (error) {
        console.error('❌ Patient data fetch failed:', error);
      }
    };

    fetchPatientData();
  }, [bill.appointment_id, bill.patient_mrno, bill.id]);

  const calculateAge = (dob) => {
    if (!dob) return null;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleParameterChange = (paramName, value) => {
    setFormData(prev => {
      const updatedParams = { ...prev.test_parameters };
      updatedParams[paramName] = {
        ...updatedParams[paramName],
        value: value
      };

      // Auto-calculate status based on reference range
      const status = calculateStatus(value, updatedParams[paramName].reference_range);
      updatedParams[paramName].status = status;
      updatedParams[paramName].flag = status === 'normal' ? '' : (status === 'critical' ? 'C' : 'H/L');

      // Debug logging
      console.log('Parameter Change:', {
        paramName,
        value,
        referenceRange: updatedParams[paramName].reference_range,
        calculatedStatus: status,
        paramData: updatedParams[paramName]
      });

      return {
        ...prev,
        test_parameters: updatedParams
      };
    });
  };

  const calculateStatus = (value, referenceRange) => {
    if (!value || !referenceRange) return 'normal';

    // Simple logic - can be enhanced based on your needs
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return 'normal';

    // Extract numeric ranges from reference_range
    // Example: "13-17 (M), 12-15 (F)" or "14 - 18" or "<200" or ">40"
    const rangeMatch = referenceRange.match(/(\d+\.?\d*)\s*-\s*(\d+\.?\d*)/);
    const lessThanMatch = referenceRange.match(/<(\d+\.?\d*)/);
    const greaterThanMatch = referenceRange.match(/>(\d+\.?\d*)/);

    if (rangeMatch) {
      const [, min, max] = rangeMatch;
      const minVal = parseFloat(min);
      const maxVal = parseFloat(max);

      if (numValue < minVal || numValue > maxVal) {
        // Check if it's critically low or high (20% beyond range)
        if (numValue < minVal * 0.8 || numValue > maxVal * 1.2) {
          return 'critical';
        }
        return 'abnormal';
      }
    } else if (lessThanMatch) {
      const [, max] = lessThanMatch;
      const maxVal = parseFloat(max);
      if (numValue >= maxVal) {
        return numValue >= maxVal * 1.2 ? 'critical' : 'abnormal';
      }
    } else if (greaterThanMatch) {
      const [, min] = greaterThanMatch;
      const minVal = parseFloat(min);
      if (numValue <= minVal) {
        return numValue <= minVal * 0.8 ? 'critical' : 'abnormal';
      }
    }

    return 'normal';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.tested_by) {
        alert('Please enter technician name');
        setLoading(false);
        return;
      }

      // Check if all required parameters are filled
      if (parameters.length > 0) {
        const missingParams = parameters
          .filter(p => p.required)
          .filter(p => !formData.test_parameters[p.name]?.value);

        if (missingParams.length > 0) {
          alert(`Please fill in required parameters: ${missingParams.map(p => p.display_name).join(', ')}`);
          setLoading(false);
          return;
        }
      }

      // Calculate overall interpretation
      const hasAbnormal = Object.values(formData.test_parameters).some(p => p.status === 'abnormal');
      const hasCritical = Object.values(formData.test_parameters).some(p => p.status === 'critical');

      const resultData = {
        ...formData,
        overall_interpretation: hasCritical ? 'critical' : (hasAbnormal ? 'abnormal' : 'normal'),
        has_abnormal_values: hasAbnormal,
        has_critical_values: hasCritical,
        tested_date: new Date().toISOString(),
        status: 'completed',
        created_by: formData.tested_by
      };

      await labResultsAPI.createResult(resultData);

      alert('Test results saved successfully!');
      onSave();
    } catch (error) {
      console.error('Error saving results:', error);
      alert('Error saving results. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      normal: 'var(--color-success)',
      abnormal: 'var(--color-warning)',
      critical: 'var(--color-danger)'
    };
    return colors[status] || 'var(--text-secondary)';
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: '900px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">📝 Enter Test Results</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Patient Information */}
            <div style={{
              background: 'var(--bg-tertiary)',
              padding: 'var(--space-lg)',
              borderRadius: 'var(--radius-md)',
              marginBottom: 'var(--space-xl)'
            }}>
              <h3 style={{ marginBottom: 'var(--space-md)', fontSize: '1rem', fontWeight: 600 }}>
                👤 Patient Information
              </h3>
              <div className="grid grid-cols-2 gap-md">
                <div>
                  <strong>MRN:</strong> {bill.patient_mrno}
                </div>
                <div>
                  <strong>Test:</strong> {bill.service_type_name}
                </div>
                <div className="form-group">
                  <label className="form-label">Patient Name *</label>
                  <input
                    type="text"
                    name="patient_name"
                    className="form-input"
                    value={formData.patient_name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Age</label>
                  <input
                    type="number"
                    name="patient_age"
                    className="form-input"
                    value={formData.patient_age || ''}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Gender</label>
                  <select
                    name="patient_gender"
                    className="form-select"
                    value={formData.patient_gender}
                    onChange={handleInputChange}
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Test Parameters */}
            <h3 style={{ marginBottom: 'var(--space-lg)', fontSize: '1rem', fontWeight: 600 }}>
              🧪 Test Parameters
            </h3>

            {parameters.length > 0 ? (
              <div className="table-container" style={{ marginBottom: 'var(--space-xl)' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th style={{ width: '30%' }}>Parameter</th>
                      <th style={{ width: '20%' }}>Value *</th>
                      <th style={{ width: '15%' }}>Unit</th>
                      <th style={{ width: '25%' }}>Reference Range</th>
                      <th style={{ width: '10%' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parameters.map((param) => {
                      const paramData = formData.test_parameters[param.name] || {};
                      return (
                        <tr key={param.name}>
                          <td>
                            <strong>{param.display_name}</strong>
                            {param.required && <span style={{ color: 'var(--color-danger)' }}> *</span>}
                          </td>
                          <td>
                            <input
                              type={param.type === 'numeric' ? 'number' : 'text'}
                              step="any"
                              className="form-input"
                              value={paramData.value || ''}
                              onChange={(e) => handleParameterChange(param.name, e.target.value)}
                              required={param.required}
                              style={{ width: '100%' }}
                            />
                          </td>
                          <td>
                            <span style={{ color: 'var(--text-secondary)' }}>{param.unit}</span>
                          </td>
                          <td>
                            <small style={{ color: 'var(--text-tertiary)' }}>
                              {param.reference_range}
                            </small>
                          </td>
                          <td>
                            <span
                              style={{
                                color: getStatusColor(paramData.status || 'normal'),
                                fontWeight: 600,
                                fontSize: '0.875rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              {!paramData.status || paramData.status === 'normal' ? (
                                <>✓ Normal</>
                              ) : paramData.status === 'critical' ? (
                                <>🔴 Critical</>
                              ) : (
                                <>⚠️ Abnormal</>
                              )}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="form-group">
                <label className="form-label">Test Results (No template available)</label>
                <textarea
                  className="form-textarea"
                  rows="6"
                  placeholder="Enter test results here..."
                  value={JSON.stringify(formData.test_parameters, null, 2)}
                  onChange={(e) => {
                    try {
                      const parsed = JSON.parse(e.target.value);
                      setFormData(prev => ({ ...prev, test_parameters: parsed }));
                    } catch (err) {
                      // Invalid JSON, ignore
                    }
                  }}
                />
              </div>
            )}

            {/* Additional Information */}
            <div className="grid grid-cols-2 gap-md">
              <div className="form-group">
                <label className="form-label">Tested By *</label>
                <input
                  type="text"
                  name="tested_by"
                  className="form-input"
                  value={formData.tested_by}
                  onChange={handleInputChange}
                  placeholder="Technician name"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  name="status"
                  className="form-select"
                  value={formData.status}
                  onChange={handleInputChange}
                >
                  <option value="draft">Draft</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Technician Notes</label>
              <textarea
                name="technician_notes"
                className="form-textarea"
                rows="3"
                value={formData.technician_notes}
                onChange={handleInputChange}
                placeholder="Any additional notes or observations..."
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : '💾 Save Results'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TestResultEntry;
