// Maximum quantity per product per order (Admin form helper).
// Mirrors the backend rule for immediate feedback only; the backend
// (services/quantityLimit.js) remains the authority and re-validates every save.
export const MAX_QUANTITY_PER_ORDER_CEILING = 1000000;

export function quantityLimitFormValues(product) {
  return {
    quantityLimitEnabled: product?.quantityLimitEnabled === true,
    maxQuantityPerOrder:
      product?.quantityLimitEnabled === true && Number.isSafeInteger(product?.maxQuantityPerOrder)
        ? String(product.maxQuantityPerOrder)
        : "",
  };
}

// Returns { error } or { body } with the exact fields sent to the backend.
export function quantityLimitPayload(enabled, rawMaximum) {
  if (!enabled) return { body: { quantityLimitEnabled: false, maxQuantityPerOrder: null } };
  const text = String(rawMaximum ?? "").trim();
  if (!text) return { error: "Enter a maximum quantity per order, or turn off the quantity limit." };
  const value = Number(text);
  if (!/^\d+$/.test(text) || !Number.isSafeInteger(value) || value < 1 || value > MAX_QUANTITY_PER_ORDER_CEILING) {
    return { error: `Maximum quantity per order must be a whole number between 1 and ${MAX_QUANTITY_PER_ORDER_CEILING}.` };
  }
  return { body: { quantityLimitEnabled: true, maxQuantityPerOrder: value } };
}

// Products-list indicator: the saved maximum, or null for unlimited products.
export function activeQuantityLimit(product) {
  const max = product?.maxQuantityPerOrder;
  return product?.quantityLimitEnabled === true && Number.isSafeInteger(max) && max >= 1 ? max : null;
}
