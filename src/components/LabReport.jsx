import { useRef, useEffect } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import JsBarcode from 'jsbarcode';

function LabReport({ result, onClose }) {
  const reportRef = useRef();
  const barcodeRef = useRef();

  const downloadPDF = async () => {
    const reportElement = reportRef.current;

    // Set a temporary style to ensure the element is captured correctly
    const originalStyle = reportElement.style.cssText;
    reportElement.style.width = '210mm'; // Fixed A4 width
    reportElement.style.minHeight = 'auto'; // Remove minHeight for capture

    try {
      const canvas = await html2canvas(reportElement, {
        scale: 3, // Higher scale for better quality
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: reportElement.scrollWidth,
        windowHeight: reportElement.scrollHeight
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const margin = 10;
      const availableWidth = pageWidth - (2 * margin);
      const availableHeight = pageHeight - (2 * margin);

      let imgWidth = availableWidth;
      let imgHeight = (canvas.height * imgWidth) / canvas.width;

      // If the content is taller than the page, scale it down to fit one page
      if (imgHeight > availableHeight) {
        const ratio = availableHeight / imgHeight;
        imgHeight = availableHeight;
        imgWidth = imgWidth * ratio;
      }

      // Center horizontally if scaled down by width
      const xOffset = margin + (availableWidth - imgWidth) / 2;
      const yOffset = margin;

      pdf.addImage(imgData, 'PNG', xOffset, yOffset, imgWidth, imgHeight);
      pdf.save(`Lab_Report_${result.patient_name || 'Patient'}_${result.test_name}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      // Restore original style
      reportElement.style.cssText = originalStyle;
    }
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

  // Generate barcode when component mounts
  useEffect(() => {
    if (barcodeRef.current && result.bill_id) {
      JsBarcode(barcodeRef.current, result.bill_id, {
        format: 'CODE128',
        width: 1,
        height: 25, // Even smaller barcode
        displayValue: false,
        margin: 0
      });
    }
  }, [result.bill_id]);

  // Filter to only show parameters that have been entered (non-empty values)
  const parameters = Object.entries(result.test_parameters || {})
    .map(([key, value]) => ({
      name: key,
      ...value
    }))
    .filter(param => {
      const hasValue = param.value !== null &&
        param.value !== undefined &&
        param.value !== '' &&
        param.value !== 'N/A';
      return hasValue;
    })
    .sort((a, b) => (a.order || 999) - (b.order || 999));

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: '900px', padding: 0, background: '#f0f2f5' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header" style={{ padding: '0.75rem 1.5rem', background: 'white', borderBottom: '1px solid #ddd' }}>
          <h2 className="modal-title" style={{ fontSize: '1.25rem' }}>📄 Report Preview</h2>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-primary btn-sm" onClick={downloadPDF} style={{ background: '#007bff', fontWeight: '600' }}>
              📥 Download PDF (Single Page)
            </button>
            <button className="btn btn-ghost btn-icon" onClick={onClose}>
              ✕
            </button>
          </div>
        </div>

        <div className="modal-body" style={{ padding: '1.5rem', overflowY: 'auto', maxHeight: '85vh' }}>
          {/* Main Report Container */}
          <div
            ref={reportRef}
            style={{
              background: 'white',
              width: '100%',
              maxWidth: '210mm', // Standard A4 width
              minHeight: 'auto', // Reduced from 297mm to fit content
              padding: '15mm', // Reduced margins
              margin: '0 auto',
              color: '#1a1a1a',
              fontFamily: '"Inter", sans-serif',
              position: 'relative',
              borderRadius: '2px',
              border: '1px solid #eee'
            }}
          >
            {/* Header - Logo and Hospital Info */}
            <div style={{ textAlign: 'center', marginBottom: '1rem', borderBottom: '1.5px solid #333', paddingBottom: '0.75rem' }}>
              <img src="/logo.png" alt="Hospital Header" style={{ width: '100%', maxHeight: '140px', objectFit: 'contain' }} />
            </div>

            {/* Patient Info Card - More Compact */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1.2fr 1fr',
              gap: '0.75rem',
              marginBottom: '1rem',
              background: '#f8f9fa',
              padding: '0.75rem',
              borderRadius: '4px',
              border: '1px solid #e9ecef',
              fontSize: '0.85rem'
            }}>
              <div>
                <p style={{ margin: '0 0 4px 0' }}><strong>Patient Name:</strong> {result.patient_name}</p>
                <p style={{ margin: '0 0 4px 0' }}><strong>Age / Gender:</strong> {result.patient_age || 'N/A'} Yrs / {result.patient_gender}</p>
                <p style={{ margin: '0' }}><strong>MR No:</strong> <span style={{ fontFamily: 'monospace', fontWeight: '600' }}>{result.patient_mrno}</span></p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ margin: '0 0 4px 0' }}><strong>Report Date:</strong> {formatDate(result.tested_date)}</p>
                <p style={{ margin: '0 0 4px 0' }}><strong>Bill ID:</strong> {result.bill_id}</p>
                <div style={{ margin: '0', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                  <strong>Barcode:</strong>
                  <svg ref={barcodeRef}></svg>
                </div>
              </div>
            </div>

            {/* Test Content */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h2 style={{
                fontSize: '1.1rem',
                fontWeight: 800,
                textAlign: 'center',
                textTransform: 'uppercase',
                borderBottom: '1px solid #eee',
                paddingBottom: '0.5rem',
                marginBottom: '1rem',
                color: '#000',
                letterSpacing: '1px'
              }}>
                {result.test_name}
              </h2>

              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #333', background: '#f1f3f5' }}>
                    <th style={{ textAlign: 'left', padding: '8px 5px', fontSize: '0.8rem', fontWeight: 700 }}>TEST NAME</th>
                    <th style={{ textAlign: 'center', padding: '8px 5px', fontSize: '0.8rem', fontWeight: 700 }}>RESULTS</th>
                    <th style={{ textAlign: 'center', padding: '8px 5px', fontSize: '0.8rem', fontWeight: 700 }}>UNITS</th>
                    <th style={{ textAlign: 'left', padding: '8px 5px', fontSize: '0.8rem', fontWeight: 700 }}>BIO. REF. INTERVAL</th>
                  </tr>
                </thead>
                <tbody>
                  {parameters.length > 0 ? (
                    parameters.map((param, index) => (
                      <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '8px 5px', fontSize: '0.85rem', fontWeight: 600 }}>{param.name?.toUpperCase().replace(/_/g, ' ')}</td>
                        <td style={{ padding: '8px 5px', textAlign: 'center', fontSize: '0.95rem', fontWeight: 800 }}>
                          {param.status === 'abnormal' || param.status === 'critical' ? (
                            <span style={{ color: param.status === 'critical' ? '#d32f2f' : '#e67e22', background: '#fff5f5', padding: '2px 6px', borderRadius: '3px' }}>
                              {param.value < (parseFloat(param.reference_range?.split('-')[0]) || 0) ? '↓ ' : '↑ '}
                              {param.value}
                            </span>
                          ) : (
                            param.value
                          )}
                        </td>
                        <td style={{ padding: '8px 5px', textAlign: 'center', fontSize: '0.8rem', color: '#444' }}>{param.unit}</td>
                        <td style={{ padding: '8px 5px', fontSize: '0.8rem', color: '#444' }}>{param.reference_range}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" style={{ padding: '30px 10px', textAlign: 'center', color: '#888', fontStyle: 'italic' }}>
                        No test results have been entered yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Notes Section - Compact */}
            {result.technician_notes && (
              <div style={{ marginBottom: '1.5rem', fontSize: '0.8rem', color: '#333', background: '#fff9db', padding: '0.75rem', borderRadius: '4px', borderLeft: '4px solid #fcc419' }}>
                <p style={{ margin: '0 0 5px 0' }}><strong>Technician Notes:</strong></p>
                <p style={{ fontStyle: 'italic', margin: 0 }}>{result.technician_notes}</p>
              </div>
            )}

            <div style={{ textAlign: 'center', margin: '1rem 0', color: '#888', fontSize: '0.75rem', fontWeight: 500, letterSpacing: '2px' }}>
              *** End of the Report ***
            </div>

            {/* Footer / Signatures - Optimized for single page */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '40px',
              marginTop: '2rem',
              paddingTop: '1rem'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ height: '60px', marginBottom: '8px' }}>
                  {/* Space for manual signature */}
                </div>
                <div style={{ borderBottom: '1.5px solid #333', maxWidth: '200px', margin: '0 auto 8px auto' }}></div>
                <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem', color: '#222' }}>Lab Technician</p>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#666' }}>({result.tested_by || 'Verified'})</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ height: '60px', marginBottom: '8px', position: 'relative' }}>
                  <img src="/signature.png" alt="Pathologist Signature" style={{ height: '110px', width: 'auto', position: 'absolute', bottom: '-15px', left: '50%', transform: 'translateX(-50%)' }} />
                </div>
                <div style={{ borderBottom: '1.5px solid #333', maxWidth: '200px', margin: '0 auto 8px auto' }}></div>
                <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem', color: '#222' }}>Dr. VARAPRASAD B.M</p>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#666' }}>Reg No-103954 | Consultant Pathologist</p>
              </div>
            </div>

            {/* Footer Hospital Info - Small */}
            <div style={{ marginTop: '2rem', textAlign: 'center', borderTop: '1px solid #eee', paddingTop: '0.5rem' }}>
              <p style={{ fontSize: '0.65rem', color: '#999', margin: 0 }}>
                This is a computer generated report and does not require a physical signature for authenticity.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LabReport;
