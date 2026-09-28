// Preserve the preview's scale in downloaded A4 PDFs. Break between product
// rows and keep the summary/footer together whenever they fit on one page.
export function addA4Pages(pdf, canvas, element) {
  const bounds = element.getBoundingClientRect();
  const scale = canvas.width / bounds.width;
  const pxPerMm = canvas.width / 210;
  const capacity = Math.floor(273 * pxPerMm);
  const blocks = [...element.querySelectorAll('.a4-preview-header,.a4-preview-product-row,.a4-preview-summary,.a4-preview-footer')]
    .map(node => { const r = node.getBoundingClientRect(); return { top: Math.floor((r.top - bounds.top) * scale), bottom: Math.ceil((r.bottom - bounds.top) * scale) }; });
  const surface = element.querySelector('.a4-preview-content');
  // The preview has a paper-sized minimum height and its own margins. Crop
  // those before adding PDF page margins, otherwise a blank second page appears.
  let start = Math.floor((surface.getBoundingClientRect().top - bounds.top + parseFloat(getComputedStyle(surface).paddingTop)) * scale);
  const last = Math.min(canvas.height, Math.max(...blocks.map(block => block.bottom)));
  let page = 0;
  while (start < last) {
    let end = Math.min(start + capacity, last);
    const crossing = blocks.find(block => block.top > start && block.top < end && block.bottom > end && block.bottom - block.top <= capacity);
    if (crossing) end = crossing.top;
    const slice = document.createElement('canvas');
    slice.width = canvas.width; slice.height = end - start;
    slice.getContext('2d').drawImage(canvas, 0, start, canvas.width, slice.height, 0, 0, canvas.width, slice.height);
    if (page++) pdf.addPage([210, 297], 'portrait');
    pdf.addImage(slice.toDataURL('image/png'), 'PNG', 0, 12, 210, slice.height / pxPerMm, undefined, 'FAST');
    start = end;
  }
}
