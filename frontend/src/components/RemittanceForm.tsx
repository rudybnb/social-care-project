import React, { useState } from 'react';

interface RemittanceFormProps {
  staffData: any;
  periodLabel: string;
  onClose: () => void;
}

const RemittanceForm: React.FC<RemittanceFormProps> = ({ staffData, periodLabel, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Auto-generate payment number
  const generatedPaymentNo = `PAY-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
  
  const today = new Date().toLocaleDateString('en-GB');

  const [formData, setFormData] = useState({
    emailTo: '',
    paymentNo: generatedPaymentNo,
    paymentDate: today,
    vendorId: staffData.isAgency ? staffData.agencyName : (staffData.name || ''),
    siteName: 'Multiple Sites',
    payeeName: staffData.isAgency ? staffData.agencyName : (staffData.name || ''),
    payeeAddress: '',
    bankName: '',
    accountNumber: '',
    sortCode: '',
    description: staffData.custom ? 'Maintenance / Custom Service' : `Staffing Services - ${staffData.isAgency ? 'Agency' : 'Permanent'} Worker`,
    datesCovered: periodLabel,
    hoursWorked: staffData.totalHours > 0 ? staffData.totalHours.toFixed(2) : '1',
    hourlyRate: staffData.totalHours > 0 ? (staffData.totalPay / staffData.totalHours).toFixed(2) : '0.00',
    paymentTotal: staffData.totalPay > 0 ? staffData.totalPay.toFixed(2) : '0.00',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent, action: 'send' | 'save_only' = 'send') => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const API_URL = process.env.REACT_APP_API_URL || 'https://social-care-backend.onrender.com';
      const response = await fetch(`${API_URL}/api/payroll/remittance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailTo: formData.emailTo,
          remittanceData: formData,
          action
        })
      });

      if (!response.ok) {
        throw new Error('Failed to process remittance advice');
      }

      setSuccess(true);
      setTimeout(() => onClose(), 2000);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = () => {
    const data = formData;
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

  if (success) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px', color: 'white' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
        <h2 style={{ color: '#10b981', marginBottom: '8px' }}>Remittance Sent!</h2>
        <p style={{ color: '#9ca3af' }}>The remittance advice has been emailed successfully.</p>
      </div>
    );
  }

  const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    backgroundColor: '#0a0a0a',
    border: '1px solid #3a3a3a',
    borderRadius: '8px',
    color: 'white',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box' as const
  };

  const labelStyle = {
    display: 'block',
    color: '#9ca3af',
    fontSize: '13px',
    fontWeight: '600',
    marginBottom: '6px'
  };

  return (
    <div style={{ padding: '20px', color: 'white' }}>
      <div style={{ marginBottom: '24px', borderBottom: '1px solid #3a3a3a', paddingBottom: '16px' }}>
        <h2 style={{ margin: '0 0 8px 0', fontSize: '20px', color: '#8b5cf6' }}>Generate Remittance Advice</h2>
        <p style={{ margin: 0, color: '#9ca3af', fontSize: '14px' }}>Fill in the payee details below to generate and email a remittance advice document.</p>
      </div>

      {error && (
        <div style={{ backgroundColor: '#ef444420', color: '#ef4444', padding: '12px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #ef4444' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
          {/* Email Information */}
          <div style={{ gridColumn: '1 / -1', backgroundColor: '#1a1a1a', padding: '16px', borderRadius: '8px', border: '1px solid #3a3a3a' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', color: 'white' }}>Email Details</h3>
            <div>
              <label style={labelStyle}>Recipient Email Address *</label>
              <input required type="email" name="emailTo" value={formData.emailTo} onChange={handleChange} style={inputStyle} placeholder="agency@example.com" />
            </div>
          </div>

          {/* Payment Details */}
          <div style={{ backgroundColor: '#1a1a1a', padding: '16px', borderRadius: '8px', border: '1px solid #3a3a3a' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', color: 'white' }}>Payment Info</h3>
            <div style={{ marginBottom: '12px' }}>
              <label style={labelStyle}>Payment No</label>
              <input required type="text" name="paymentNo" value={formData.paymentNo} onChange={handleChange} style={inputStyle} />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={labelStyle}>Payment Date</label>
              <input required type="text" name="paymentDate" value={formData.paymentDate} onChange={handleChange} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Vendor / Site Name</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input required type="text" name="vendorId" value={formData.vendorId} onChange={handleChange} style={{...inputStyle, flex: 1}} placeholder="Vendor ID" />
                <input required type="text" name="siteName" value={formData.siteName} onChange={handleChange} style={{...inputStyle, flex: 1}} placeholder="Site Name" />
              </div>
            </div>
          </div>

          {/* Payee Details */}
          <div style={{ backgroundColor: '#1a1a1a', padding: '16px', borderRadius: '8px', border: '1px solid #3a3a3a' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', color: 'white' }}>Payee Address</h3>
            <div style={{ marginBottom: '12px' }}>
              <label style={labelStyle}>Payee Name (To)</label>
              <input required type="text" name="payeeName" value={formData.payeeName} onChange={handleChange} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Address (Use \\n for new lines)</label>
              <textarea required name="payeeAddress" value={formData.payeeAddress} onChange={handleChange} style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} placeholder="Company Name\nStreet Address\nCity\nPostcode" />
            </div>
          </div>

          {/* Bank Details */}
          <div style={{ gridColumn: '1 / -1', backgroundColor: '#1a1a1a', padding: '16px', borderRadius: '8px', border: '1px solid #3a3a3a' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', color: 'white' }}>Bank Details</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Bank Name</label>
                <input required type="text" name="bankName" value={formData.bankName} onChange={handleChange} style={inputStyle} placeholder="e.g. Starling Bank" />
              </div>
              <div>
                <label style={labelStyle}>Account Number</label>
                <input required type="text" name="accountNumber" value={formData.accountNumber} onChange={handleChange} style={inputStyle} maxLength={8} />
              </div>
              <div>
                <label style={labelStyle}>Sort Code</label>
                <input required type="text" name="sortCode" value={formData.sortCode} onChange={handleChange} style={inputStyle} placeholder="12-34-56" />
              </div>
            </div>
          </div>

          {/* Work Summary (Pre-filled) */}
          <div style={{ gridColumn: '1 / -1', backgroundColor: '#1a1a1a', padding: '16px', borderRadius: '8px', border: '1px solid #3a3a3a' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', color: 'white' }}>Work Summary (Auto-calculated)</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={labelStyle}>Description of Work</label>
                <input required type="text" name="description" value={formData.description} onChange={handleChange} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Dates Covered</label>
                <input required type="text" name="datesCovered" value={formData.datesCovered} onChange={handleChange} style={inputStyle} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Hours / Quantity</label>
                <input type="text" name="hoursWorked" value={formData.hoursWorked} onChange={handleChange} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Rate (£)</label>
                <input type="text" name="hourlyRate" value={formData.hourlyRate} onChange={handleChange} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Total Payment (£)</label>
                <input type="text" name="paymentTotal" value={formData.paymentTotal} onChange={handleChange} style={{ ...inputStyle, backgroundColor: '#10b98120', color: '#10b981', fontWeight: 'bold', border: '1px solid #10b981' }} />
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            style={{
              padding: '10px 20px',
              backgroundColor: 'transparent',
              color: 'white',
              border: '1px solid #3a3a3a',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleExportPDF}
            disabled={loading}
            style={{
              padding: '10px 20px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            🖨️ Export to PDF
          </button>
          <button
            type="button"
            onClick={(e) => handleSubmit(e, 'save_only')}
            disabled={loading}
            style={{
              padding: '10px 20px',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {loading ? 'Saving...' : '💾 Save Only'}
          </button>
          <button
            type="button"
            onClick={(e) => handleSubmit(e, 'send')}
            disabled={loading}
            style={{
              padding: '10px 20px',
              backgroundColor: '#8b5cf6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {loading ? 'Sending...' : '📧 Send & Save'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RemittanceForm;
