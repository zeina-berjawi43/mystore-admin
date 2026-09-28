// A receipt is measured at its final 80mm width, including its existing feed.
// CSS has no content-sized @page height, so set a concrete custom paper length.
export function sizeReceiptPage() {
  const receipt = document.querySelector('.invoice-page-80mm > .invoice-thermal-print');
  const previous = document.getElementById('receipt-page-size');
  if (!receipt) { previous?.remove(); return null; }
  const host = document.createElement('div');
  host.className = 'invoice-preview-modal';
  host.style.cssText = 'position:fixed;left:-10000px;top:0;width:80mm;max-width:none;visibility:hidden;pointer-events:none';
  const copy = receipt.cloneNode(true);
  host.append(copy); document.body.append(host);
  const heightMm = Math.ceil(copy.getBoundingClientRect().height * 25.4 / 96) + 1;
  host.remove();
  if (!Number.isFinite(heightMm) || heightMm < 20) throw new Error('Receipt could not be measured. Open Preview and retry.');
  const style = previous || document.createElement('style');
  style.id = 'receipt-page-size';
  style.textContent = `@media print { @page invoice80 { size: 80mm ${heightMm}mm; margin: 0; } }`;
  if (!previous) document.head.append(style);
  return heightMm;
}

export async function printInvoice() {
  await document.fonts.ready;
  await Promise.all([...document.querySelectorAll('.invoice-page img')].map(image => image.decode().catch(() => {})));
  sizeReceiptPage();
  window.print();
}
