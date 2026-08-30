import React, { useState } from 'react';
import ModalPortal from './ModalPortal';
import { printDocument } from '../utils/print';
import {
  Receipt,
  Printer,
  X,
  CheckCircle,
  Clock,
  XCircle,
  Crown,
  Fingerprint,
  DeviceMobile,
  UserCircle,
} from '@phosphor-icons/react';

const inr = (n) =>
  '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatDate = (d) =>
  new Date(d).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

function StatusStamp({ status }) {
  if (status === 'successful') {
    return (
      <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-900 border-2 border-emerald-700 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider">
        <CheckCircle className="w-3 h-3" weight="fill" /> Successful
      </span>
    );
  }
  if (status === 'pending') {
    return (
      <span className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-900 border-2 border-amber-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider">
        <Clock className="w-3 h-3" weight="fill" /> Pending
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 bg-red-100 text-red-800 border-2 border-red-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider">
      <XCircle className="w-3 h-3" weight="fill" /> Failed
    </span>
  );
}

function InvoiceDocumentContent({ purchase, isPrintArea = false }) {
  const amount = Number(purchase?.amount) || 0;
  const taxable = Math.round((amount / 1.18) * 100) / 100;
  const gst = Math.round((amount - taxable) * 100) / 100;
  const cgst = Math.round((gst / 2) * 100) / 100;
  const sgst = Math.round((gst - cgst) * 100) / 100;

  const invoiceNo = `INV/${purchase?.transactionId || '—'}`;
  const userPhone = purchase?.userId?.phoneNumber || '—';
  const countryCode = purchase?.userId?.countryCode || '+91';
  const templateName = purchase?.templateId?.name || 'Status Template';
  const issuedAt = purchase?.createdAt || Date.now();

  return (
    <div id={isPrintArea ? 'invoice-print-area' : undefined} className="bg-white text-ink">
      {/* Masthead */}
      <div className="invoice-ink-slab break-inside-avoid bg-ink text-paper-50 px-7 py-5 flex items-center justify-between border-b-2 border-ink">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-flame-500 border-2 border-paper-100 flex items-center justify-center">
            <Crown className="w-5 h-5 text-ink" weight="fill" />
          </div>
          <div>
            <h4 className="display text-2xl text-white leading-none tracking-wide">STARPIX</h4>
            <p className="font-mono text-[9px] text-flame-400 font-bold tracking-[0.22em] uppercase mt-1">
              Digital Status Platform
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="display text-3xl text-white tracking-wide">INVOICE</p>
          <p className="font-mono text-[10px] text-paper-100/70 uppercase tracking-widest mt-1">
            Template Unlock
          </p>
        </div>
      </div>

      {/* Meta grid */}
      <div className="px-7 py-6 grid grid-cols-2 gap-6 border-b-2 border-ink/15 break-inside-avoid grid-meta-billed">
        {/* Billed by */}
        <div>
          <p className="label !text-ink/60 mb-2">Billed By</p>
          <p className="font-bold text-ink text-sm">Starpix Digital Media</p>
          <p className="text-xs text-ink-mute mt-1">Mobile Status &amp; Creative Quote Platform</p>
          <p className="text-xs text-ink-mute">support@starpix.com</p>
        </div>

        {/* Billed to */}
        <div>
          <p className="label !text-ink/60 mb-2 flex items-center gap-1.5">
            <UserCircle className="w-3.5 h-3.5" /> Billed To
          </p>
          <p className="font-bold text-ink text-sm">{purchase?.userId?.name || 'Starpix User'}</p>
          <p className="font-mono text-xs text-ink-mute mt-1">
            {countryCode} {userPhone}
          </p>
          <p className="font-mono text-[10px] text-ink-mute mt-0.5">
            UID · {purchase?.userId?._id || '—'}
          </p>
        </div>

        {/* Invoice meta */}
        <div className="col-span-2 grid grid-cols-4 gap-4 pt-1 grid-meta-info">
          <div>
            <p className="label !text-ink/60 mb-1">Invoice No.</p>
            <p className="font-mono text-xs font-bold text-ink">{invoiceNo}</p>
          </div>
          <div>
            <p className="label !text-ink/60 mb-1">Issue Date</p>
            <p className="font-mono text-xs font-semibold text-ink-soft">{formatDate(issuedAt)}</p>
          </div>
          <div>
            <p className="label !text-ink/60 mb-1">Transaction</p>
            <p className="font-mono text-xs font-bold text-ink">{purchase?.transactionId || '—'}</p>
          </div>
          <div>
            <p className="label !text-ink/60 mb-1">Status</p>
            <StatusStamp status={purchase?.status || 'successful'} />
          </div>
        </div>
      </div>

      {/* Item line */}
      <div className="px-7 py-6">
        <p className="label !text-ink/60 mb-3">Item Details</p>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr>
              <th className="text-left font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-ink bg-paper-100 px-3 py-2.5 border-2 border-ink">
                Description
              </th>
              <th className="text-center font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-ink bg-paper-100 px-3 py-2.5 border-2 border-ink w-16">
                Qty
              </th>
              <th className="text-right font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-ink bg-paper-100 px-3 py-2.5 border-2 border-ink w-32">
                Rate
              </th>
              <th className="text-right font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-ink bg-paper-100 px-3 py-2.5 border-2 border-ink w-32">
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-3 py-3 border-2 border-ink/20">
                <p className="font-semibold text-ink">{templateName}</p>
                <p className="text-[11px] text-ink-mute mt-0.5 capitalize">
                  {{
                    free: 'Free Template',
                    premium: 'Premium Template Unlock',
                    paid: 'Paid Template Unlock',
                    vip: 'VIP Exclusive Template',
                  }[purchase?.templateId?.accessType] || 'Premium Template Unlock'}{' '}
                  · {purchase?.productId || 'starpix_single_unlock'}
                </p>
              </td>
              <td className="text-center px-3 py-3 border-2 border-ink/20 font-bold text-ink">1</td>
              <td className="text-right px-3 py-3 border-2 border-ink/20 font-semibold text-ink tabular-nums">
                {inr(taxable)}
              </td>
              <td className="text-right px-3 py-3 border-2 border-ink/20 font-semibold text-ink tabular-nums">
                {inr(taxable)}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end mt-5">
          <div className="w-72 space-y-2 text-sm break-inside-avoid totals-box">
            {amount > 0 ? (
              <>
                <div className="flex items-center justify-between text-ink-soft">
                  <span className="text-xs font-medium">Taxable Value</span>
                  <span className="font-semibold tabular-nums">{inr(taxable)}</span>
                </div>
                <div className="flex items-center justify-between text-ink-soft">
                  <span className="text-xs font-medium">CGST @ 9%</span>
                  <span className="font-semibold tabular-nums">{inr(cgst)}</span>
                </div>
                <div className="flex items-center justify-between text-ink-soft">
                  <span className="text-xs font-medium">SGST @ 9%</span>
                  <span className="font-semibold tabular-nums">{inr(sgst)}</span>
                </div>
                <div className="flex items-center justify-between !bg-ink !text-white px-4 py-3 border-2 border-ink mt-1">
                  <span className="font-bold text-sm tracking-wide !text-white uppercase">Total Paid</span>
                  <span className="font-mono text-lg font-bold tracking-wide !text-white tabular-nums">{inr(amount)}</span>
                </div>
                <p className="text-[10px] text-ink-mute text-right pt-0.5">
                  Inclusive of all taxes · {purchase?.currency || 'INR'}
                </p>
              </>
            ) : (
              <div className="flex items-center justify-center bg-emerald-100 text-emerald-900 border-2 border-emerald-700 px-4 py-3">
                <span className="display text-sm tracking-wide">FREE UNLOCK · NO CHARGE</span>
              </div>
            )}
          </div>
        </div>

        {/* Payment trail */}
        <div className="mt-6 pt-4 border-t-2 border-ink/15 grid grid-cols-4 gap-4 grid-trail">
          <div>
            <p className="label !text-ink/60 mb-1">Provider</p>
            <p className="text-xs font-semibold text-ink-soft capitalize">
              {purchase?.paymentProvider || 'In-App Purchase'}
            </p>
          </div>
          <div>
            <p className="label !text-ink/60 mb-1">Payment</p>
            <p className="font-mono text-xs font-semibold text-ink-soft">{purchase?.status || 'successful'}</p>
          </div>
          <div className="col-span-2">
            <p className="label !text-ink/60 mb-1 flex items-center gap-1.5">
              <Fingerprint className="w-3 h-3" /> Transaction Ref
            </p>
            <p className="font-mono text-xs font-semibold text-ink-soft break-all">{purchase?.transactionId || '—'}</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-7 py-5 bg-paper-50 border-t-2 border-ink flex items-center justify-between gap-3">
        <p className="text-[10px] text-ink-mute">
          This is a computer-generated invoice for the Starpix digital status platform.
        </p>
        <p className="text-[10px] text-ink-mute shrink-0 flex items-center gap-1">
          <DeviceMobile className="w-3 h-3" /> Generated {formatDate(Date.now())}
        </p>
      </div>
    </div>
  );
}

/**
 * Single unified invoice modal component.
 * On desktop screen: renders preview inside interactive modal card.
 * On mobile screen: hidden from UI backdrop.
 * For printing: renders a SINGLE off-screen invoice target (id="invoice-print-area")
 * to prevent duplicate printing across desktop and mobile.
 */
export default function InvoiceModal({ purchase, onClose }) {
  const [copied, setCopied] = useState(false);

  const copyId = () => {
    if (!purchase?.transactionId) return;
    navigator.clipboard?.writeText(purchase.transactionId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    });
  };

  const handlePrint = () => printDocument();

  return (
    <ModalPortal>
      {/* Desktop Viewport Modal Overlay (Screen-only; print:hidden prevents duplication) */}
      <div className="fixed inset-0 z-[100] bg-ink/70 hidden sm:flex items-center justify-center p-4 overflow-y-auto print:hidden">
        <div id="invoice-modal-card" className="modal-card max-w-3xl">
          {/* Toolbar */}
          <div className="px-6 py-4 border-b-2 border-ink flex items-center justify-between bg-ink">
            <h3 className="display text-lg text-paper-50 flex items-center gap-2.5">
              <Receipt className="w-5 h-5 text-flame-400" weight="duotone" /> Tax Invoice
            </h3>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="btn-primary !py-2 !px-4 !text-xs"
              >
                <Printer className="w-4 h-4" weight="bold" /> Print Invoice
              </button>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close invoice"
                className="p-2 text-paper-100 hover:text-white hover:bg-paper-100/10 rounded-[2px] transition-colors"
              >
                <X className="w-5 h-5" weight="bold" />
              </button>
            </div>
          </div>

          <InvoiceDocumentContent purchase={purchase} isPrintArea={false} />

          {/* Quick actions toolbar */}
          <div className="px-6 py-3.5 border-t-2 border-ink bg-paper-50 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={copyId}
              className="link-chip !text-[11px]"
            >
              {copied ? '✓ Transaction ID copied' : 'Copy transaction ID'}
            </button>
            <p className="text-[10px] font-mono text-ink-mute">
              Tip · use <span className="font-bold">Print</span> to save as PDF
            </p>
          </div>
        </div>
      </div>

      {/* Single Unified Print Container (Off-screen at w-768px, left -9999px) */}
      <div className="fixed top-0 -left-[9999px] w-[768px] bg-white pointer-events-none print:static print:left-auto print:top-auto print:w-full print:pointer-events-auto">
        <InvoiceDocumentContent purchase={purchase} isPrintArea={true} />
      </div>
    </ModalPortal>
  );
}
