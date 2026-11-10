export function getPricingClassName(classes, id = 'B') {
  if (id === 'DEMO') return 'DEMO'; // Reserved screen-recording class; never a configured pricing class.
  return classes[id]?.name?.trim() || (['A', 'B', 'C'].includes(id) ? `Class ${id}` : 'Unknown class');
}
