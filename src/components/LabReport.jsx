import { useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

function LabReport({ result, onClose }) {
  const reportRef = useRef();
  const headerRef = useRef();
  const patientInfoRef = useRef();
  const signatureRef = useRef();

  const downloadPDF = async () => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (2 * margin);

    // Capture header (logo) as image
    const headerElement = headerRef.current;
    const headerCanvas = await html2canvas(headerElement, {
      scale: 2,
      useCORS: true,
      logging: false
    });
    const headerImgData = headerCanvas.toDataURL('image/png');
    const headerHeight = (headerCanvas.height * contentWidth) / headerCanvas.width;

    // Capture patient info
    const patientInfoElement = patientInfoRef.current;
    const patientInfoCanvas = await html2canvas(patientInfoElement, {
      scale: 2,
      useCORS: true,
      logging: false
    });
    const patientInfoImgData = patientInfoCanvas.toDataURL('image/png');
    const patientInfoHeight = (patientInfoCanvas.height * contentWidth) / patientInfoCanvas.width;

    // Capture signature if available
    let signatureImgData = null;
    let signatureHeight = 0;
    if (signatureRef.current) {
      try {
        const signatureCanvas = await html2canvas(signatureRef.current, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: null
        });
        signatureImgData = signatureCanvas.toDataURL('image/png');
        const sigWidth = 60; // Fixed width for signature (increased for better visibility)
        signatureHeight = (signatureCanvas.height * sigWidth) / signatureCanvas.width;
      } catch (err) {
        console.warn('Could not capture signature:', err);
      }
    }

    // Function to add header to a page
    const addHeader = () => {
      pdf.addImage(headerImgData, 'PNG', margin, margin, contentWidth, headerHeight);
      return margin + headerHeight + 5; // Return Y position after header
    };

    // Add first page with header and patient info
    let currentY = addHeader();
    pdf.addImage(patientInfoImgData, 'PNG', margin, currentY, contentWidth, patientInfoHeight);
    currentY += patientInfoHeight + 10;

    // Add test name
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    const testNameY = currentY;
    pdf.text(result.test_name.toUpperCase(), pageWidth / 2, testNameY, { align: 'center' });
    currentY = testNameY + 10;

    // Draw table header
    const drawTableHeader = (y) => {
      pdf.setFillColor(68, 68, 68);
      pdf.rect(margin, y, contentWidth, 8, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');

      const col1 = margin + 2;
      const col2 = margin + contentWidth * 0.4;
      const col3 = margin + contentWidth * 0.6;
      const col4 = margin + contentWidth * 0.75;

      pdf.text('TEST NAME', col1, y + 6);
      pdf.text('RESULTS', col2, y + 6);
      pdf.text('UNITS', col3, y + 6);
      pdf.text('BIO. REF. INTERVAL', col4, y + 6);

      return y + 8;
    };

    currentY = drawTableHeader(currentY);

    // Filter parameters
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
      });

    // Draw table rows
    pdf.setTextColor(0, 0, 0);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);

    const rowHeight = 10;
    const col1 = margin + 2;
    const col2 = margin + contentWidth * 0.4;
    const col3 = margin + contentWidth * 0.6;
    const col4 = margin + contentWidth * 0.75;

    parameters.forEach((param, index) => {
      // Check if we need a new page
      if (currentY + rowHeight > pageHeight - margin - 30) {
        pdf.addPage();
        currentY = addHeader(); // Add header to new page
        currentY = drawTableHeader(currentY); // Add table header to new page
      }

      // Draw row background (alternating)
      if (index % 2 === 0) {
        pdf.setFillColor(249, 249, 249);
        pdf.rect(margin, currentY, contentWidth, rowHeight, 'F');
      }

      // Draw row border
      pdf.setDrawColor(238, 238, 238);
      pdf.line(margin, currentY + rowHeight, margin + contentWidth, currentY + rowHeight);

      // Draw cell content
      pdf.setFont('helvetica', 'bold');
      pdf.text(param.name?.toUpperCase().replace(/_/g, ' ') || '', col1, currentY + 7);

      pdf.setFont('helvetica', 'bold');
      // Color code abnormal values
      if (param.status === 'abnormal' || param.status === 'critical') {
        pdf.setTextColor(param.status === 'critical' ? 211 : 245, param.status === 'critical' ? 47 : 124, param.status === 'critical' ? 47 : 0);
        const arrow = param.value < (parseFloat(param.reference_range?.split('-')[0]) || 0) ? '↓ ' : '↑ ';
        pdf.text(arrow + String(param.value), col2, currentY + 7);
        pdf.setTextColor(0, 0, 0);
      } else {
        pdf.text(String(param.value), col2, currentY + 7);
      }

      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(102, 102, 102);
      pdf.text(param.unit || '', col3, currentY + 7);
      pdf.text(param.reference_range || '', col4, currentY + 7);
      pdf.setTextColor(0, 0, 0);

      currentY += rowHeight;
    });

    // Add notes if present
    if (result.technician_notes) {
      currentY += 10;
      if (currentY + 20 > pageHeight - margin - 30) {
        pdf.addPage();
        currentY = addHeader();
      }
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Technician Notes:', margin, currentY);
      currentY += 5;
      pdf.setFont('helvetica', 'italic');
      pdf.text(result.technician_notes, margin, currentY, { maxWidth: contentWidth });
      currentY += 10;
    }

    // Add end of report
    currentY += 10;
    if (currentY + 40 > pageHeight - margin) {
      pdf.addPage();
      currentY = addHeader() + 20;
    }
    pdf.setFontSize(8);
    pdf.setTextColor(136, 136, 136);
    pdf.text('--- End of the Report ---', pageWidth / 2, currentY, { align: 'center' });

    // Add signatures
    currentY += 30;
    if (currentY + 40 > pageHeight - margin) {
      pdf.addPage();
      currentY = addHeader() + 20;
    }

    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');

    const sig1X = pageWidth * 0.25;
    const sig2X = pageWidth * 0.75;
    const sigY = currentY + 30;

    // Lab Technician signature
    pdf.line(sig1X - 25, sigY, sig1X + 25, sigY);
    pdf.text('Lab Technician', sig1X, sigY + 5, { align: 'center' });
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.text(`(${result.tested_by || 'Verified'})`, sig1X, sigY + 10, { align: 'center' });

    // Pathologist signature with image
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);

    // Add signature image if captured
    if (signatureImgData) {
      const sigImgWidth = 60; // Increased size for better visibility
      pdf.addImage(signatureImgData, 'PNG', sig2X - (sigImgWidth / 2), sigY - signatureHeight - 5, sigImgWidth, signatureHeight);
    }

    pdf.line(sig2X - 25, sigY, sig2X + 25, sigY);
    pdf.text('Dr. VARAPRASAD B.M', sig2X, sigY + 5, { align: 'center' });
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    pdf.text('Reg No-103954', sig2X, sigY + 9, { align: 'center' });
    pdf.setFontSize(8);
    pdf.text('Consultant Pathologist', sig2X, sigY + 13, { align: 'center' });

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
    });

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
            <div ref={headerRef} style={{ textAlign: 'center', marginBottom: 'var(--space-xl)', borderBottom: '2px solid #333', paddingBottom: 'var(--space-lg)' }}>
              <img src="/logo.png" alt="Hospital Header" style={{ width: '100%', maxHeight: '180px', objectFit: 'contain' }} />
            </div>

            {/* Patient Info Card */}
            <div ref={patientInfoRef} style={{
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
                  {parameters.length > 0 ? (
                    parameters.map((param, index) => (
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
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" style={{ padding: '40px 20px', textAlign: 'center', color: '#999', fontStyle: 'italic' }}>
                        No test results have been entered yet.
                      </td>
                    </tr>
                  )}
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
                <div ref={signatureRef} style={{ height: '100px', display: 'flex', justifyContent: 'center', alignItems: 'flex-end', marginBottom: '5px' }}>
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
