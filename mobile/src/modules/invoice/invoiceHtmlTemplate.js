export const inr = (n) =>
  '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const fmtDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' · ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
};

export function generateInvoiceHtml({
  user,
  purchase,
  template,
  templateName,
  transactionId,
  invoiceNo,
  displayPhone,
  userId,
  amount,
  taxable,
  cgst,
  sgst,
}) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <title>Starpix Tax Invoice</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&display=swap');
        body {
          font-family: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif;
          margin: 0;
          padding: 30px;
          color: #17120C;
          background-color: #FBF9F4;
        }
        .invoice-box {
          max-width: 800px;
          margin: auto;
          padding: 32px;
          border: 3px solid #17120C;
          background: #FFFFFF;
          box-shadow: 6px 6px 0px #17120C;
        }
        .header-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 24px;
        }
        .brand-badge {
          display: inline-block;
          width: 44px;
          height: 44px;
          background-color: #FF5500;
          border: 2px solid #17120C;
          color: #FFFFFF;
          font-weight: 800;
          font-size: 24px;
          text-align: center;
          line-height: 44px;
          margin-right: 12px;
        }
        .brand-title {
          font-size: 24px;
          font-weight: 800;
          letter-spacing: 1px;
          color: #17120C;
          display: inline-block;
          vertical-align: middle;
        }
        .brand-sub {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 2px;
          color: #FF5500;
          text-transform: uppercase;
          margin-top: 2px;
        }
        .invoice-title-cell {
          text-align: right;
          vertical-align: top;
        }
        .invoice-title {
          font-size: 26px;
          font-weight: 800;
          color: #17120C;
          letter-spacing: 1px;
        }
        .invoice-sub {
          font-size: 11px;
          font-weight: 700;
          color: #666;
          letter-spacing: 1px;
        }
        .meta-grid {
          display: flex;
          justify-content: space-between;
          margin-bottom: 20px;
          padding-top: 16px;
          border-top: 2px solid #17120C;
        }
        .meta-col {
          width: 48%;
        }
        .meta-label {
          font-size: 11px;
          font-weight: 700;
          color: #666;
          letter-spacing: 1px;
          text-transform: uppercase;
          margin-bottom: 4px;
        }
        .meta-value {
          font-size: 14px;
          font-weight: 700;
          color: #17120C;
        }
        .meta-small {
          font-size: 12px;
          color: #555;
          margin-top: 2px;
        }
        .uid-box {
          background: #F5F1E8;
          border: 2px solid #17120C;
          padding: 10px 14px;
          margin-bottom: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        .items-table th {
          background: #17120C;
          color: #FFFFFF;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 1px;
          text-transform: uppercase;
          padding: 10px 14px;
          text-align: left;
        }
        .items-table td {
          border-bottom: 2px solid #17120C;
          padding: 14px;
          font-size: 14px;
          color: #17120C;
        }
        .text-right {
          text-align: right !important;
        }
        .text-center {
          text-align: center !important;
        }
        .totals-table {
          width: 280px;
          margin-left: auto;
          border-collapse: collapse;
          margin-bottom: 24px;
        }
        .totals-table td {
          padding: 6px 12px;
          font-size: 13px;
        }
        .totals-table .total-row {
          background: #17120C;
          color: #FFFFFF;
          font-weight: 800;
          font-size: 16px;
        }
        .totals-table .total-row td {
          padding: 10px 12px;
        }
        .badge-success {
          display: inline-block;
          background: #DCFCE7;
          border: 1px solid #15803D;
          color: #14532D;
          font-size: 11px;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 4px;
          text-transform: uppercase;
        }
        .footer {
          margin-top: 24px;
          padding-top: 16px;
          border-top: 2px dashed #CCC;
          font-size: 11px;
          color: #777;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="invoice-box">
        <table class="header-table">
          <tr>
            <td class="logo-cell">
              <div class="brand-badge">S</div>
              <div style="display: inline-block; vertical-align: middle;">
                <div class="brand-title">STARPIX</div>
                <div class="brand-sub">DIGITAL STATUS PLATFORM</div>
              </div>
            </td>
            <td class="invoice-title-cell">
              <div class="invoice-title">TAX INVOICE</div>
              <div class="invoice-sub">TEMPLATE UNLOCK</div>
            </td>
          </tr>
        </table>

        <div class="meta-grid">
          <div class="meta-col">
            <div class="meta-label">BILLED BY</div>
            <div class="meta-value">Starpix Digital Media</div>
            <div class="meta-small">Mobile Status Platform</div>
            <div class="meta-small">support@starpix.com</div>
          </div>
          <div class="meta-col">
            <div class="meta-label">BILLED TO</div>
            <div class="meta-value">${user?.name || 'Starpix User'}</div>
            <div class="meta-small">${displayPhone}</div>
          </div>
        </div>

        <div class="uid-box">
          <span class="meta-label" style="margin:0;">USER ID (UID):</span>
          <span class="meta-value" style="font-size:12px; font-family:monospace;">${userId}</span>
        </div>

        <div class="meta-grid">
          <div class="meta-col">
            <div class="meta-label">INVOICE NO.</div>
            <div class="meta-value">${invoiceNo}</div>
          </div>
          <div class="meta-col">
            <div class="meta-label">ISSUE DATE & STATUS</div>
            <div class="meta-value">
              ${fmtDate(purchase?.createdAt)} &nbsp;
              <span class="badge-success">${(purchase?.status || 'successful').toUpperCase()}</span>
            </div>
          </div>
        </div>

        <table class="items-table">
          <thead>
            <tr>
              <th>Description</th>
              <th class="text-center">Qty</th>
              <th class="text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <strong>${templateName}</strong><br/>
                <span style="font-size:12px; color:#666;">
                  ${purchase?.productId || 'starpix_single_unlock'} · ${template?.accessType || 'Premium'} Unlock
                </span>
              </td>
              <td class="text-center">1</td>
              <td class="text-right">${inr(taxable)}</td>
            </tr>
          </tbody>
        </table>

        ${amount > 0 ? `
          <div style="margin-bottom: 20px; padding: 12px; border: 2px solid #17120C; background: #F5F1E8; display: flex; align-items: center; gap: 14px;">
            <img src="${purchase?.finalAssetUrl || template?.thumbnail || template?.previewAsset || template?.mainMedia || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80'}" style="width: 50px; height: 75px; object-fit: cover; border: 2px solid #17120C;" />
            <div>
              <span style="background: #FF5500; color: #FFFFFF; font-size: 9px; font-weight: 800; padding: 2px 6px; letter-spacing: 1px; text-transform: uppercase;">GENERATED AI ASSET</span>
              <div style="font-size: 13px; font-weight: 700; color: #17120C; margin-top: 4px;">${templateName}</div>
              <div style="font-size: 10px; color: #666; font-family: monospace; margin-top: 2px;">Licensed High-Resolution Asset · Ref: ${transactionId}</div>
            </div>
          </div>
        ` : ''}

        <table class="totals-table">
          <tr>
            <td>Taxable Value:</td>
            <td class="text-right">${inr(taxable)}</td>
          </tr>
          <tr>
            <td>CGST @ 9%:</td>
            <td class="text-right">${inr(cgst)}</td>
          </tr>
          <tr>
            <td>SGST @ 9%:</td>
            <td class="text-right">${inr(sgst)}</td>
          </tr>
          <tr class="total-row">
            <td>TOTAL PAID:</td>
            <td class="text-right">${inr(amount)}</td>
          </tr>
        </table>

        <div class="footer">
          This is an official computer-generated tax invoice for Starpix digital status platform.<br/>
          Transaction Ref: ${transactionId} · Generated ${new Date().toLocaleString()}
        </div>
      </div>
    </body>
    </html>
  `;
}
