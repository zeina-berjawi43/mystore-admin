// ============================================================
// SHARED PAGINATION COMPONENT
// ============================================================
//
// Used by Products, Orders, and Users so all three tables behave
// and look identical. Pure UI - the parent page owns the actual
// slicing of its data array.
// ============================================================

function getPageNumbers(currentPage, totalPages) {
  // Always show first, last, current, and one neighbor on each
  // side. Collapse the rest into "…".
  const pages = new Set([1, totalPages, currentPage]);

  if (currentPage - 1 >= 1) pages.add(currentPage - 1);
  if (currentPage + 1 <= totalPages) pages.add(currentPage + 1);

  const sorted = Array.from(pages)
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b);

  const withEllipsis = [];

  sorted.forEach((page, index) => {
    if (index > 0 && page - sorted[index - 1] > 1) {
      withEllipsis.push("…");
    }

    withEllipsis.push(page);
  });

  return withEllipsis;
}

function Pagination({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  itemLabel = "items",
  pageSizeOptions = [10, 25, 50, 100],
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  if (totalItems === 0) {
    return null;
  }

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  const pageNumbers = getPageNumbers(currentPage, totalPages);

  return (
    <div className="pagination-bar">
      <span className="pagination-info">
        Showing {startItem}–{endItem} of {totalItems} {itemLabel}
      </span>

      <div className="pagination-controls">
        <button
          type="button"
          className="pagination-button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          aria-label="Previous page"
        >
          ‹
        </button>

        {pageNumbers.map((page, index) =>
          page === "…" ? (
            <span
              key={`ellipsis-${index}`}
              className="pagination-ellipsis"
            >
              …
            </span>
          ) : (
            <button
              key={page}
              type="button"
              className={`pagination-button ${
                page === currentPage ? "active" : ""
              }`}
              onClick={() => onPageChange(page)}
            >
              {page}
            </button>
          )
        )}

        <button
          type="button"
          className="pagination-button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          aria-label="Next page"
        >
          ›
        </button>
      </div>

      {onPageSizeChange && (
        <label className="pagination-page-size">
          Rows per page
          <select
            value={pageSize}
            onChange={(event) =>
              onPageSizeChange(Number(event.target.value))
            }
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  );
}

export default Pagination;
