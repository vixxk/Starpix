/**
 * Shared print trigger for print-ready documents (invoices, reports).
 *
 * Adds `body.printing-invoice` so the scoped @media print stylesheet in
 * index.css hides the app chrome and reveals only the marked print area
 * (#invoice-print-area / #report-print-area), then cleans up afterwards.
 */
export function printDocument() {
  document.body.classList.add('printing-invoice');

  const endPrint = () => {
    document.body.classList.remove('printing-invoice');
    window.removeEventListener('afterprint', endPrint);
  };

  window.addEventListener('afterprint', endPrint);
  // Safety net in case afterprint never fires
  setTimeout(endPrint, 30000);
  setTimeout(() => window.print(), 60);
}
