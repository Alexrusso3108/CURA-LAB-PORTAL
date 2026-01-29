import { useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

function LabReport({ result, onClose }) {
  const reportRef = useRef();

  const downloadPDF = async () => {
    const element = reportRef.current;
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Lab_Report_${result.patient_name || 'Patient'}_${result.test_name}.pdf`);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const parameters = Object.entries(result.test_parameters || {}).map(([key, value]) => ({
    name: key,
    ...value
  }));

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: '850px', padding: 0, background: '#f5f5f5' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header" style={{ padding: 'var(--space-md) var(--space-xl)', background: 'white', borderBottom: '1px solid #eee' }}>
          <h2 className="modal-title">📄 Report Preview</h2>
          <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
            <button className="btn btn-primary btn-sm" onClick={downloadPDF}>
              📥 Download PDF
            </button>
            <button className="btn btn-ghost btn-icon" onClick={onClose}>
              ✕
            </button>
          </div>
        </div>

        <div className="modal-body" style={{ padding: 'var(--space-xl)', overflowY: 'auto', maxHeight: '80vh' }}>
          {/* Main Report Container */}
          <div
            ref={reportRef}
            style={{
              background: 'white',
              width: '100%',
              minHeight: '297mm',
              padding: '20mm',
              boxShadow: '0 0 10px rgba(0,0,0,0.1)',
              margin: '0 auto',
              color: '#333',
              fontFamily: '"Inter", sans-serif'
            }}
          >
            {/* Header - Full Logo */}
            <div style={{ textAlign: 'center', marginBottom: 'var(--space-xl)', borderBottom: '2px solid #333', paddingBottom: 'var(--space-lg)' }}>
              <img src="/logo.png" alt="Hospital Header" style={{ width: '100%', maxHeight: '180px', objectFit: 'contain' }} />
            </div>

            {/* Patient Info Card */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 'var(--space-lg)',
              marginBottom: 'var(--space-xl)',
              background: '#f9f9f9',
              padding: 'var(--space-lg)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid #eee'
            }}>
              <div>
                <p style={{ margin: '0 0 5px 0' }}><strong>Patient Name:</strong> {result.patient_name}</p>
                <p style={{ margin: '0 0 5px 0' }}><strong>Age / Gender:</strong> {result.patient_age || 'N/A'} Yrs / {result.patient_gender}</p>
                <p style={{ margin: '0' }}><strong>MR No:</strong> <span style={{ fontFamily: 'monospace' }}>{result.patient_mrno}</span></p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ margin: '0 0 5px 0' }}><strong>Report Date:</strong> {formatDate(result.tested_date)}</p>
                <p style={{ margin: '0 0 5px 0' }}><strong>Bill ID:</strong> {result.bill_id}</p>
                <p style={{ margin: '0' }}><strong>Ref By:</strong> Self / Dr. Hospital</p>
              </div>
            </div>

            {/* Test Content */}
            <div style={{ marginBottom: 'var(--space-2xl)' }}>
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: 700,
                textAlign: 'center',
                textTransform: 'uppercase',
                borderBottom: '1px solid #eee',
                paddingBottom: 'var(--space-sm)',
                marginBottom: 'var(--space-lg)',
                color: '#222'
              }}>
                {result.test_name}
              </h2>

              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #444' }}>
                    <th style={{ textAlign: 'left', padding: '10px 5px', fontSize: '0.9rem', fontWeight: 700 }}>TEST NAME</th>
                    <th style={{ textAlign: 'center', padding: '10px 5px', fontSize: '0.9rem', fontWeight: 700 }}>RESULTS</th>
                    <th style={{ textAlign: 'center', padding: '10px 5px', fontSize: '0.9rem', fontWeight: 700 }}>UNITS</th>
                    <th style={{ textAlign: 'left', padding: '10px 5px', fontSize: '0.9rem', fontWeight: 700 }}>BIO. REF. INTERVAL</th>
                  </tr>
                </thead>
                <tbody>
                  {parameters.map((param, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '12px 5px', fontSize: '0.9rem', fontWeight: 600 }}>{param.name?.toUpperCase().replace(/_/g, ' ')}</td>
                      <td style={{ padding: '12px 5px', textAlign: 'center', fontSize: '1rem', fontWeight: 800 }}>
                        {param.status === 'abnormal' || param.status === 'critical' ? (
                          <span style={{ color: param.status === 'critical' ? '#d32f2f' : '#f57c00' }}>
                            {param.value < (parseFloat(param.reference_range?.split('-')[0]) || 0) ? '↓ ' : '↑ '}
                            {param.value}
                          </span>
                        ) : (
                          param.value
                        )}
                      </td>
                      <td style={{ padding: '12px 5px', textAlign: 'center', fontSize: '0.85rem', color: '#666' }}>{param.unit}</td>
                      <td style={{ padding: '12px 5px', fontSize: '0.85rem', color: '#666' }}>{param.reference_range}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Notes Section */}
            {result.technician_notes && (
              <div style={{ marginBottom: 'var(--space-2xl)', fontSize: '0.85rem', color: '#555' }}>
                <p><strong>Technician Notes:</strong></p>
                <p style={{ fontStyle: 'italic' }}>{result.technician_notes}</p>
              </div>
            )}

            <div style={{ textAlign: 'center', margin: 'var(--space-2xl) 0', color: '#888', fontSize: '0.8rem' }}>
              --- End of the Report ---
            </div>

            {/* Footer / Signatures */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', marginTop: '80px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ height: '80px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', marginBottom: '5px' }}>
                  {/* Space for manual signature if needed */}
                </div>
                <div style={{ borderBottom: '2px solid #333', maxWidth: '250px', margin: '0 auto 10px auto' }}></div>
                <p style={{ margin: 0, fontWeight: 700, fontSize: '1rem', color: '#222' }}>Lab Technician</p>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#666' }}>({result.tested_by || 'Verified'})</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ height: '100px', display: 'flex', justifyContent: 'center', alignItems: 'flex-end', marginBottom: '5px' }}>
                  <img src="/signature.png" alt="Pathologist Signature" style={{ height: '140px', width: 'auto', marginBottom: '-40px' }} />
                </div>
                <div style={{ borderBottom: '2px solid #333', maxWidth: '250px', margin: '0 auto' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LabReport;
