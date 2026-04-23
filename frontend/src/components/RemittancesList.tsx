import React, { useState, useEffect } from 'react';

const RemittancesList: React.FC = () => {
  const [remittances, setRemittances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRemittances();
  }, []);

  const fetchRemittances = async () => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'https://social-care-backend.onrender.com';
      const response = await fetch(`${API_URL}/api/payroll/remittances`);
      const data = await response.json();
      setRemittances(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch remittances:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewPDF = (data: any) => {
    const printHtml = `
      <html>
        <head>
          <title>Remittance Advice - ${data.paymentNo}</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; color: #333; padding: 20px; font-size: 14px; }
            .box { border: 1px solid #ccc; background-color: #f9fafb; padding: 15px; border-radius: 6px; }
            @media print {
              body { padding: 0; font-size: 12px; }
              @page { margin: 15mm; }
              .page-container { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="page-container">
            <div style="margin-bottom: 30px; display: flex; align-items: center;">
              <img src="https://social-care-frontend.onrender.com/quotes/logo.png" alt="Eclesia Family Centre Logo" style="height: 60px; object-fit: contain;" />
            </div>

            <h2 style="color: #2b74b8; margin-bottom: 20px; font-size: 20px;">REMITTANCE ADVICE</h2>

            <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
              <div style="flex: 1;">
                <h3 style="color: #2b74b8; margin: 0 0 10px 0; font-size: 16px;">From:</h3>
                <p style="margin: 0; line-height: 1.5; color: #2b74b8; font-weight: bold;">
                  Eclesia Family Centre Ltd<br>
                  65 Nickelby Close<br>
                  London<br>
                  SE28 8LY
                </p>
              </div>
              
              <div class="box" style="width: 280px;">
                <p style="margin: 0 0 10px 0; color: #2b74b8; font-weight: bold;">Payment Total: £${data.paymentTotal}</p>
                <table style="width: 100%; font-size: 13px;">
                  <tr><td style="padding-bottom: 4px;">Payment No:</td><td>${data.paymentNo}</td></tr>
                  <tr><td style="padding-bottom: 4px;">Payment Date:</td><td>${data.paymentDate}</td></tr>
                  <tr><td style="padding-bottom: 4px;">Vendor:</td><td>${data.vendorId || ''}</td></tr>
                  <tr><td>Site Name:</td><td>${data.siteName || ''}</td></tr>
                </table>
              </div>
            </div>

            <div class="box" style="width: 280px; margin-bottom: 30px;">
              <h3 style="color: #2b74b8; margin: 0 0 10px 0; font-size: 16px;">To:</h3>
              <p style="margin: 0; line-height: 1.5;">
                ${data.payeeName}<br>
                ${(data.payeeAddress || '').replace(/\n/g, '<br>')}
              </p>
            </div>

            <h3 style="color: #2b74b8; margin: 0 0 10px 0; font-size: 16px;">Payment Details</h3>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; border: 1px solid #ccc;">
              <tr><td style="border: 1px solid #ccc; padding: 8px;">Payment Date</td><td style="border: 1px solid #ccc; padding: 8px;">${data.paymentDate}</td></tr>
              <tr><td style="border: 1px solid #ccc; padding: 8px;">Payment Method</td><td style="border: 1px solid #ccc; padding: 8px;">Bank Transfer</td></tr>
            </table>

          <div style="margin-bottom: 20px;">
            <p style="margin: 0 0 5px 0; font-size: 13px;">Bank Details (Payee):</p>
            <p style="margin: 0; line-height: 1.5; font-size: 13px;">
              ${data.payeeName}<br>
              ${data.bankName}<br>
              Account Number: ${data.accountNumber}<br>
              Sort Code: ${data.sortCode}
            </p>
          </div>

          <h3 style="color: #2b74b8; margin: 0 0 10px 0; font-size: 16px;">Work Summary</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; border: 1px solid #ccc;">
            <tr style="background-color: #f9f9f9;">
              <th style="border: 1px solid #ccc; padding: 8px; text-align: left;">Description of Work</th>
              <th style="border: 1px solid #ccc; padding: 8px; text-align: left;">Dates Covered</th>
              <th style="border: 1px solid #ccc; padding: 8px; text-align: left;">Hours / Qty</th>
              <th style="border: 1px solid #ccc; padding: 8px; text-align: left;">Rate (£)</th>
              <th style="border: 1px solid #ccc; padding: 8px; text-align: left;">Total (£)</th>
            </tr>
            <tr>
              <td style="border: 1px solid #ccc; padding: 8px;">${data.description}</td>
              <td style="border: 1px solid #ccc; padding: 8px;">${data.datesCovered}</td>
              <td style="border: 1px solid #ccc; padding: 8px;">${data.hoursWorked}</td>
              <td style="border: 1px solid #ccc; padding: 8px;">£${data.hourlyRate}</td>
              <td style="border: 1px solid #ccc; padding: 8px;">£${data.paymentTotal}</td>
            </tr>
          </table>

          <p style="margin: 0 0 30px 0; font-weight: bold; font-size: 16px;">Payment Total: £${data.paymentTotal}</p>

          <div style="border-top: 1px solid #ccc; padding-top: 15px; font-size: 11px; line-height: 1.4; color: #666;">
            1<br>
            Eclesia Family Center 65 Nickelby Clise SE28 8LY For general payment queries, please call 02035092366, quoting your Payment Reference Number from this remittance advice.
          </div>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printHtml);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }
  };

  const handleResend = async (remittance: any) => {
    if (!remittance.emailTo) {
      alert('No email address saved for this remittance.');
      return;
    }
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'https://social-care-backend.onrender.com';
      const response = await fetch(`${API_URL}/api/payroll/remittance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailTo: remittance.emailTo,
          remittanceData: remittance,
          action: 'send'
        })
      });

      if (response.ok) {
        alert('Remittance advice resent successfully.');
        fetchRemittances();
      } else {
        alert('Failed to resend remittance.');
      }
    } catch (error) {
      console.error(error);
      alert('Error sending email.');
    }
  };

  if (loading) {
    return <div style={{ padding: '20px', color: 'white' }}>Loading remittances...</div>;
  }

  return (
    <div style={{ padding: '20px', color: 'white' }}>
      <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>Saved Remittances</h2>

      {remittances.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', backgroundColor: '#2a2a2a', borderRadius: '8px' }}>
          <p style={{ color: '#9ca3af' }}>No saved remittances found.</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto', backgroundColor: '#2a2a2a', borderRadius: '8px', border: '1px solid #3a3a3a' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ backgroundColor: '#1a1a1a', borderBottom: '1px solid #3a3a3a' }}>
                <th style={{ padding: '12px', textAlign: 'left', color: '#9ca3af' }}>Payment No</th>
                <th style={{ padding: '12px', textAlign: 'left', color: '#9ca3af' }}>Date</th>
                <th style={{ padding: '12px', textAlign: 'left', color: '#9ca3af' }}>Payee Name</th>
                <th style={{ padding: '12px', textAlign: 'left', color: '#9ca3af' }}>Description</th>
                <th style={{ padding: '12px', textAlign: 'left', color: '#9ca3af' }}>Total</th>
                <th style={{ padding: '12px', textAlign: 'center', color: '#9ca3af' }}>Status</th>
                <th style={{ padding: '12px', textAlign: 'right', color: '#9ca3af' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {remittances.map((rem) => (
                <tr key={rem.id} style={{ borderBottom: '1px solid #3a3a3a' }}>
                  <td style={{ padding: '12px' }}>{rem.paymentNo}</td>
                  <td style={{ padding: '12px' }}>{rem.paymentDate}</td>
                  <td style={{ padding: '12px', fontWeight: 'bold' }}>{rem.payeeName}</td>
                  <td style={{ padding: '12px', color: '#9ca3af', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {rem.description}
                  </td>
                  <td style={{ padding: '12px', color: '#10b981', fontWeight: 'bold' }}>£{rem.paymentTotal}</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <span style={{ 
                      padding: '4px 8px', 
                      borderRadius: '12px', 
                      fontSize: '11px',
                      backgroundColor: rem.status === 'sent' ? '#10b98120' : '#8b5cf620',
                      color: rem.status === 'sent' ? '#10b981' : '#8b5cf6'
                    }}>
                      {rem.status === 'sent' ? 'Sent' : 'Saved'}
                    </span>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => handleViewPDF(rem)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      🖨️ PDF
                    </button>
                    <button
                      onClick={() => handleResend(rem)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#2a2a2a',
                        color: '#9ca3af',
                        border: '1px solid #4a4a4a',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      📧 Send
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default RemittancesList;
