export function getPricingClassName(classes, id = 'B') {
  return classes[id]?.name?.trim() || (['A', 'B', 'C'].includes(id) ? `Class ${id}` : 'Unknown class');
}
