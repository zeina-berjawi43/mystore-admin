// Keep checklist behavior aligned with the Admin App's dashboard-checklist service.
const productNames = new Intl.Collator(['ar', 'en'], { usage: 'sort', sensitivity: 'base' });

export function sortChecklistProducts(products) {
  // Sort a copy, preserving equal-name order without using quantity or checkbox state.
  return [...products].sort((a, b) => productNames.compare(a.name || 'Unknown Product', b.name || 'Unknown Product'));
}

export function uncheckedChecklistText(products) {
  const rows = products.filter(product => Number.isFinite(product.quantity) && Number(product.quantity) > 0);
  const names = new Map();
  for (const row of rows) names.set(row.name, (names.get(row.name) || 0) + 1);
  const unchecked = rows.filter(product => !product.checked);
  return unchecked.length ? 'Confirmed Order Products\n' + unchecked.map(row => {
    const name = row.name || 'Unknown Product';
    // Preserve existing duplicate/unknown-name identity labels even if a duplicate is checked.
    const identity = (names.get(row.name) || 0) > 1 || name === 'Unknown Product' ? ` [${row.productId || 'missing reference'}]` : '';
    return `${name}${identity} × ${row.quantity}`;
  }).join('\n') : '';
}
