import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import axios from "axios";

import "./Invoice.css";

const API_URL =
  "https://mystore-backend-u6ey.onrender.com";

/* ============================================================
   INVOICE LOGO
   ============================================================ */

const INVOICE_LOGO = "/logo.png";

/* ============================================================
   AUTH
============================================================ */

const getToken = () => {
  const token =
    localStorage.getItem("accessToken") ||
    localStorage.getItem("adminToken") ||
    localStorage.getItem("token") ||
    "";

  return token.replace(/^Bearer\s+/i, "").trim();
};

const getAuthHeaders = () => {
  const token = getToken();

  if (!token) {
    throw new Error(
      "Admin authentication token was not found. Please login again."
    );
  }

  return {
    Authorization: `Bearer ${token}`,
  };
};

/* ============================================================
   HELPERS
============================================================ */

const formatPrice = (value) => {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "$0.00";
  }

  return `$${number.toFixed(2)}`;
};

const formatDate = (value) => {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const getCustomerName = (customer) => {
  if (!customer) {
    return "Unknown Customer";
  }

  if (customer.firstName || customer.lastName) {
    return `${customer.firstName || ""} ${
      customer.lastName || ""
    }`.trim();
  }

  return customer.name || "Unknown Customer";
};

/* ============================================================
   PRODUCT HELPERS
============================================================ */

const getProductImage = (product) => {
  if (!product) {
    return "";
  }

  return product.image || product.productImage || "";
};

const getImageUrl = (image) => {
  if (!image) {
    return "";
  }

  if (
    image.startsWith("http://") ||
    image.startsWith("https://") ||
    image.startsWith("blob:")
  ) {
    return image;
  }

  if (image.startsWith("/")) {
    return `${API_URL}${image}`;
  }

  return `${API_URL}/${image}`;
};

const getProductPrice = (product) => {
  if (!product) {
    return 0;
  }

  const originalPrice = Number(product.price) || 0;
  const discount = Number(product.discount) || 0;

  if (discount <= 0) {
    return originalPrice;
  }

  if (discount >= 100) {
    return 0;
  }

  return (
    originalPrice -
    (originalPrice * discount) / 100
  );
};

/* ============================================================
   THERMAL 80MM LAYOUT
============================================================ */

function ThermalPrintLayout({
  invoice,
  totals,
  notes,
  copyType,
}) {
  if (!invoice) {
    return null;
  }

  const items = invoice.items || [];

  return (
    <div className="invoice-thermal-print">
      <div className="thermal-print-header">
        <img
          src={INVOICE_LOGO}
          alt="BStore logo"
          className="thermal-print-logo"
        />

        <div className="thermal-print-brand">
          <strong>BStore</strong>
          <span>Invoice</span>
        </div>

        <div className="thermal-print-number">
          <strong>
            {invoice.invoiceNumber}
          </strong>

          <span>
            {formatDate(invoice.createdAt)}
          </span>
        </div>
      </div>

      <div className="thermal-print-divider" />

      <div className="thermal-print-customer">
        <div className="thermal-print-section-title">
          CUSTOMER
        </div>

        <div className="thermal-print-customer-row">
          <span>Name</span>

          <strong>
            {getCustomerName(invoice.customer)}
          </strong>
        </div>

        {invoice.customer?.phone && (
          <div className="thermal-print-customer-row">
            <span>Phone</span>

            <strong>
              {invoice.customer.phone}
            </strong>
          </div>
        )}

        {invoice.customer?.email && (
          <div className="thermal-print-customer-row">
            <span>Email</span>

            <strong>
              {invoice.customer.email}
            </strong>
          </div>
        )}

        {invoice.customer?.address && (
          <div className="thermal-print-customer-row">
            <span>Address</span>

            <strong>
              {invoice.customer.address}
            </strong>
          </div>
        )}
      </div>

      <div className="thermal-print-divider" />

      <div className="thermal-print-products">
        <div className="thermal-print-products-head">
          <span>Product</span>
          <span>Qty</span>
          <span>Price</span>
          <span>Total</span>
        </div>

        {items.length > 0 ? (
          items.map((item, index) => {
            const quantity =
              Number(item.quantity) || 0;

            const price =
              Number(item.price) || 0;

            const lineTotal =
              quantity * price;

            return (
              <div
                className="thermal-print-product-row"
                key={
                  item._id ||
                  `${item.product?._id || item.product || "product"}-${index}`
                }
              >
                <div className="thermal-print-product-name">
                  {item.productName || "Product"}
                </div>

                <div className="thermal-print-product-qty">
                  {quantity}
                </div>

                <div className="thermal-print-product-price">
                  {formatPrice(price)}
                </div>

                <div className="thermal-print-product-total">
                  {formatPrice(lineTotal)}
                </div>
              </div>
            );
          })
        ) : (
          <div className="thermal-print-empty">
            No products in this invoice.
          </div>
        )}
      </div>

      <div className="thermal-print-divider" />

      <div className="thermal-print-summary">
        <div className="thermal-print-summary-row">
          <span>Subtotal</span>

          <strong>
            {formatPrice(totals.subtotal)}
          </strong>
        </div>

        <div className="thermal-print-summary-row">
          <span>
            Discount ({totals.discount}%)
          </span>

          <strong>
            -{formatPrice(totals.discountAmount)}
          </strong>
        </div>

        <div className="thermal-print-total">
          <span>Total</span>

          <strong>
            {formatPrice(totals.total)}
          </strong>
        </div>
      </div>

      {notes && (
        <>
          <div className="thermal-print-divider" />

          <div className="thermal-print-notes">
            <strong>Notes</strong>

            <span>{notes}</span>
          </div>
        </>
      )}

      <div className="thermal-print-divider" />

      <div className="thermal-print-footer">
        <strong>{copyType} Copy</strong>

        <span>
          Thank you for your business
        </span>
      </div>
    </div>
  );
}

/* ============================================================
   80MM SCREEN PREVIEW
============================================================ */

function ThermalPreview({
  invoice,
  totals,
  notes,
  copyType,
}) {
  if (!invoice) {
    return null;
  }

  const items = invoice.items || [];

  return (
    <div className="thermal-preview-content">
      <div className="thermal-preview-header">
        <img
          src={INVOICE_LOGO}
          alt="BStore logo"
          className="thermal-preview-logo"
        />

        <strong>BStore</strong>

        <span>Invoice</span>

        <small>
          {invoice.invoiceNumber}
        </small>

        <small>
          {formatDate(invoice.createdAt)}
        </small>
      </div>

      <div className="thermal-preview-divider" />

      <div className="thermal-preview-customer">
        <strong className="thermal-preview-title">
          CUSTOMER
        </strong>

        <div className="thermal-preview-customer-row">
          <span>Name</span>

          <strong>
            {getCustomerName(invoice.customer)}
          </strong>
        </div>

        {invoice.customer?.phone && (
          <div className="thermal-preview-customer-row">
            <span>Phone</span>

            <strong>
              {invoice.customer.phone}
            </strong>
          </div>
        )}

        {invoice.customer?.address && (
          <div className="thermal-preview-customer-row">
            <span>Address</span>

            <strong>
              {invoice.customer.address}
            </strong>
          </div>
        )}
      </div>

      <div className="thermal-preview-divider" />

      <div className="thermal-preview-products">
        <div className="thermal-preview-products-head">
          <span>Product</span>
          <span>Qty</span>
          <span>Price</span>
          <span>Total</span>
        </div>

        {items.length > 0 ? (
          items.map((item, index) => {
            const quantity =
              Number(item.quantity) || 0;

            const price =
              Number(item.price) || 0;

            const lineTotal =
              quantity * price;

            return (
              <div
                className="thermal-preview-product-row"
                key={
                  item._id ||
                  `${item.product?._id || item.product || "product"}-${index}`
                }
              >
                <span className="thermal-preview-product-name">
                  {item.productName || "Product"}
                </span>

                <span className="thermal-preview-qty">
                  {quantity}
                </span>

                <span className="thermal-preview-price">
                  {formatPrice(price)}
                </span>

                <strong className="thermal-preview-total">
                  {formatPrice(lineTotal)}
                </strong>
              </div>
            );
          })
        ) : (
          <div className="thermal-preview-empty">
            No products
          </div>
        )}
      </div>

      <div className="thermal-preview-divider" />

      <div className="thermal-preview-summary">
        <div>
          <span>Subtotal</span>

          <strong>
            {formatPrice(totals.subtotal)}
          </strong>
        </div>

        <div>
          <span>
            Discount ({totals.discount}%)
          </span>

          <strong>
            -{formatPrice(totals.discountAmount)}
          </strong>
        </div>

        <div className="thermal-preview-grand-total">
          <span>Total</span>

          <strong>
            {formatPrice(totals.total)}
          </strong>
        </div>
      </div>

      {notes && (
        <>
          <div className="thermal-preview-divider" />

          <div className="thermal-preview-notes">
            <strong>Notes</strong>

            <span>{notes}</span>
          </div>
        </>
      )}

      <div className="thermal-preview-divider" />

      <div className="thermal-preview-footer">
        <strong>
          {copyType} Copy
        </strong>

        <span>
          Thank you for your business
        </span>
      </div>
    </div>
  );
}

/* ============================================================
   A4 PREVIEW
============================================================ */

function A4Preview({
  invoice,
  totals,
  notes,
  copyType,
}) {
  if (!invoice) {
    return null;
  }

  return (
    <div className="a4-preview-content">
      <div className="a4-preview-header">
        <div>
          <img
            src={INVOICE_LOGO}
            alt="BStore logo"
            className="a4-preview-logo"
          />

          <strong>BStore</strong>

          <span>Invoice</span>
        </div>

        <div className="a4-preview-number">
          <strong>
            {invoice.invoiceNumber}
          </strong>

          <span>
            {formatDate(invoice.createdAt)}
          </span>
        </div>
      </div>

      <div className="a4-preview-divider" />

      <div className="a4-preview-customer">
        <strong className="a4-preview-title">
          CUSTOMER
        </strong>

        <div className="a4-preview-customer-grid">
          <div>
            <span>Name</span>

            <strong>
              {getCustomerName(
                invoice.customer
              )}
            </strong>
          </div>

          <div>
            <span>Email</span>

            <strong>
              {invoice.customer?.email ||
                "—"}
            </strong>
          </div>

          <div>
            <span>Phone</span>

            <strong>
              {invoice.customer?.phone ||
                "—"}
            </strong>
          </div>

          <div>
            <span>Address</span>

            <strong>
              {invoice.customer?.address ||
                "—"}
            </strong>
          </div>
        </div>
      </div>

      <div className="a4-preview-divider" />

      <div className="a4-preview-products">
        <div className="a4-preview-products-head">
          <span>#</span>
          <span>Product</span>
          <span>Qty</span>
          <span>Price</span>
          <span>Total</span>
        </div>

        {invoice.items?.map(
          (item, index) => {
            const quantity =
              Number(item.quantity) || 0;

            const price =
              Number(item.price) || 0;

            const lineTotal =
              quantity * price;

            return (
              <div
                className="a4-preview-product-row"
                key={
                  item._id ||
                  `${item.product?._id || item.product || "product"}-${index}`
                }
              >
                <span>
                  {index + 1}
                </span>

                <span>
                  {item.productName ||
                    "Product"}
                </span>

                <span>
                  {quantity}
                </span>

                <span>
                  {formatPrice(price)}
                </span>

                <strong>
                  {formatPrice(lineTotal)}
                </strong>
              </div>
            );
          }
        )}
      </div>

      <div className="a4-preview-summary">
        <div>
          <span>Subtotal</span>

          <strong>
            {formatPrice(
              totals.subtotal
            )}
          </strong>
        </div>

        <div>
          <span>
            Discount ({totals.discount}%)
          </span>

          <strong>
            -{formatPrice(
              totals.discountAmount
            )}
          </strong>
        </div>

        <div className="a4-preview-grand-total">
          <span>Total</span>

          <strong>
            {formatPrice(
              totals.total
            )}
          </strong>
        </div>
      </div>

      {notes && (
        <div className="a4-preview-notes">
          <strong>Notes</strong>

          <span>{notes}</span>
        </div>
      )}

      <div className="a4-preview-footer">
        <span>
          {copyType} Copy
        </span>

        <span>
          Thank you for your business
        </span>
      </div>
    </div>
  );
}

/* ============================================================
   INVOICE PAGE
============================================================ */

function Invoice() {
  const { invoiceId } = useParams();
  const navigate = useNavigate();

  /* ==========================================================
     STATE
  ========================================================== */

  const [invoice, setInvoice] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [actionLoading, setActionLoading] =
    useState("");

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [discountPercent, setDiscountPercent] =
    useState(0);

  const [notes, setNotes] =
    useState("");

  const [format, setFormat] =
    useState("80mm");

  const [copyType, setCopyType] =
    useState("Customer");

  const [products, setProducts] =
    useState([]);

  const [productLoading, setProductLoading] =
    useState(false);

  const [productSearch, setProductSearch] =
    useState("");

  const [showAddProduct, setShowAddProduct] =
    useState(false);

  const [previewOpen, setPreviewOpen] =
    useState(false);

  /* ==========================================================
     STATUS
  ========================================================== */

  const status =
    invoice?.status || "Draft";

  const isDraft =
    status === "Draft";

  const isSaved =
    status === "Saved";

  const isCancelled =
    status === "Cancelled";

  const canEdit =
    isDraft || isCancelled;

  /* ==========================================================
     LOAD INVOICE
  ========================================================== */

  const fetchInvoice = useCallback(
    async () => {
      if (!invoiceId) {
        setError("Invoice ID is missing.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");
        setSuccess("");

        const response =
          await axios.get(
            `${API_URL}/invoices/admin/${invoiceId}`,
            {
              headers: getAuthHeaders(),
            }
          );

        const receivedInvoice =
          response.data?.invoice ||
          response.data;

        if (!receivedInvoice) {
          throw new Error(
            "Invoice data was not returned."
          );
        }

        setInvoice(receivedInvoice);

        setDiscountPercent(
          Number(
            receivedInvoice.discountPercent
          ) || 0
        );

        setNotes(
          receivedInvoice.notes || ""
        );

        setFormat(
          receivedInvoice.format || "80mm"
        );

        setCopyType(
          receivedInvoice.copyType ||
            "Customer"
        );
      } catch (err) {
        console.error(
          "Fetch invoice error:",
          err
        );

        setError(
          err.response?.data?.message ||
            err.message ||
            "Failed to load invoice."
        );
      } finally {
        setLoading(false);
      }
    },
    [invoiceId]
  );

  useEffect(() => {
    fetchInvoice();
  }, [fetchInvoice]);

  /* ==========================================================
     FETCH PRODUCTS
  ========================================================== */

  const fetchProducts = useCallback(
    async () => {
      try {
        setProductLoading(true);

        const response =
          await axios.get(
            `${API_URL}/products/admin/all`,
            {
              headers: getAuthHeaders(),
            }
          );

        const data = response.data;

        if (
          !Array.isArray(data?.products)
        ) {
          throw new Error(
            "Products data was not returned correctly."
          );
        }

        setProducts(data.products);
      } catch (err) {
        console.error(
          "Fetch products error:",
          err
        );

        setError(
          err.response?.data?.message ||
            err.message ||
            "Failed to load products."
        );
      } finally {
        setProductLoading(false);
      }
    },
    []
  );

  /* ==========================================================
     CLEAR MESSAGES
  ========================================================== */

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  /* ==========================================================
     OPEN ADD PRODUCT
  ========================================================== */

  const handleOpenAddProduct =
    async () => {
      if (!canEdit) {
        return;
      }

      clearMessages();

      setShowAddProduct(true);

      if (products.length === 0) {
        await fetchProducts();
      }
    };

  /* ==========================================================
     UPDATE LOCAL ITEM
  ========================================================== */

  const updateItem = (
    itemIndex,
    field,
    value
  ) => {
    if (!canEdit) {
      return;
    }

    setInvoice(
      (previousInvoice) => {
        if (!previousInvoice) {
          return previousInvoice;
        }

        const newItems = [
          ...(previousInvoice.items || []),
        ];

        const item = {
          ...newItems[itemIndex],
        };

        if (field === "quantity") {
          let quantity =
            parseInt(value, 10);

          if (
            !Number.isFinite(quantity) ||
            quantity < 1
          ) {
            quantity = 1;
          }

          item.quantity = quantity;
        }

        if (field === "price") {
          let price = Number(value);

          if (
            !Number.isFinite(price) ||
            price < 0
          ) {
            price = 0;
          }

          item.price = price;
        }

        item.lineTotal =
          Number(item.quantity || 0) *
          Number(item.price || 0);

        newItems[itemIndex] = item;

        return {
          ...previousInvoice,
          items: newItems,
        };
      }
    );
  };

  /* ==========================================================
     REMOVE ITEM
  ========================================================== */

  const handleRemoveItem = (
    itemIndex
  ) => {
    if (!canEdit) {
      return;
    }

    const confirmed =
      window.confirm(
        "Remove this product from the invoice?"
      );

    if (!confirmed) {
      return;
    }

    setInvoice(
      (previousInvoice) => {
        if (!previousInvoice) {
          return previousInvoice;
        }

        const newItems = (
          previousInvoice.items || []
        ).filter(
          (_, index) =>
            index !== itemIndex
        );

        return {
          ...previousInvoice,
          items: newItems,
        };
      }
    );
  };

  /* ==========================================================
     ADD PRODUCT
  ========================================================== */

  const handleAddProduct = (
    product
  ) => {
    if (!canEdit || !product) {
      return;
    }

    const productId =
      product._id || product.id;

    const price =
      getProductPrice(product);

    const image =
      getImageUrl(
        getProductImage(product)
      );

    setInvoice(
      (previousInvoice) => {
        if (!previousInvoice) {
          return previousInvoice;
        }

        const existingItems = [
          ...(previousInvoice.items || []),
        ];

        const existingIndex =
          existingItems.findIndex(
            (item) => {
              const itemProductId =
                item.product?._id ||
                item.product;

              return (
                itemProductId &&
                String(itemProductId) ===
                  String(productId)
              );
            }
          );

        if (existingIndex !== -1) {
          const updatedItem = {
            ...existingItems[
              existingIndex
            ],
          };

          updatedItem.quantity =
            Number(
              updatedItem.quantity || 0
            ) + 1;

          updatedItem.lineTotal =
            Number(updatedItem.quantity) *
            Number(updatedItem.price);

          existingItems[
            existingIndex
          ] = updatedItem;

          return {
            ...previousInvoice,
            items: existingItems,
          };
        }

        existingItems.push({
          product:
            productId || null,

          productName:
            product.name || "Product",

          productImage: image,

          quantity: 1,

          price,

          lineTotal: price,
        });

        return {
          ...previousInvoice,
          items: existingItems,
        };
      }
    );

    setShowAddProduct(false);
    setProductSearch("");
  };

  /* ==========================================================
     CALCULATE LOCAL TOTALS
  ========================================================== */

  const calculatedTotals =
    useMemo(() => {
      const items =
        invoice?.items || [];

      const subtotal =
        items.reduce(
          (sum, item) => {
            const quantity =
              Number(item.quantity) || 0;

            const price =
              Number(item.price) || 0;

            return (
              sum +
              quantity * price
            );
          },
          0
        );

      const discount =
        Math.min(
          100,
          Math.max(
            0,
            Number(discountPercent) || 0
          )
        );

      const discountAmount =
        subtotal * (discount / 100);

      const total =
        subtotal - discountAmount;

      return {
        subtotal,
        discount,
        discountAmount,
        total,
      };
    }, [
      invoice?.items,
      discountPercent,
    ]);

  /* ==========================================================
     SAVE
  ========================================================== */

  const handleSave = async () => {
    if (!invoice || !canEdit) {
      return;
    }

    if (
      !invoice.items ||
      invoice.items.length === 0
    ) {
      setError(
        "Invoice must contain at least one product."
      );
      return;
    }

    try {
      setSaving(true);
      clearMessages();

      const items =
        invoice.items.map(
          (item) => ({
            product:
              item.product?._id ||
              item.product ||
              null,

            productName:
              item.productName,

            productImage:
              item.productImage || "",

            quantity:
              Number(item.quantity),

            price:
              Number(item.price),
          })
        );

      const updateResponse =
        await axios.put(
          `${API_URL}/invoices/admin/${invoiceId}`,
          {
            items,
            discountPercent:
              Number(discountPercent) || 0,
            notes,
            format,
            copyType,
          },
          {
            headers:
              getAuthHeaders(),
          }
        );

      const updatedInvoice =
        updateResponse.data?.invoice;

      if (updatedInvoice) {
        setInvoice(updatedInvoice);
      }

      const saveResponse =
        await axios.put(
          `${API_URL}/invoices/admin/${invoiceId}/save`,
          {},
          {
            headers:
              getAuthHeaders(),
          }
        );

      const savedInvoice =
        saveResponse.data?.invoice;

      if (savedInvoice) {
        setInvoice(savedInvoice);

        setDiscountPercent(
          Number(
            savedInvoice.discountPercent
          ) || 0
        );

        setNotes(
          savedInvoice.notes || ""
        );

        setFormat(
          savedInvoice.format || "80mm"
        );

        setCopyType(
          savedInvoice.copyType ||
            "Customer"
        );
      }

      setSuccess(
        "Invoice saved successfully."
      );
    } catch (err) {
      console.error(
        "Save invoice error:",
        err
      );

      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to save invoice."
      );
    } finally {
      setSaving(false);
    }
  };

  /* ==========================================================
     PREVIEW
  ========================================================== */

  const handlePreview = () => {
    clearMessages();

    setPreviewOpen(true);
  };

  /* ==========================================================
     PRINT
  ========================================================== */

  const handlePrint = () => {
    clearMessages();

    window.print();
  };

  /* ==========================================================
     SAVE AS PDF
  ========================================================== */

  const handleSaveAsPdf = () => {
    clearMessages();

    /*
     * We use the browser's native PDF printing system.
     *
     * The existing Invoice.css already contains the correct
     * print layouts for both:
     *
     * - A4
     * - 80mm thermal
     *
     * Changing document.title gives Chrome a clean suggested
     * filename when the user selects "Save to PDF".
     */

    const previousTitle =
      document.title;

    const invoiceNumber =
      invoice?.invoiceNumber ||
      "Invoice";

    const safeInvoiceNumber =
      String(invoiceNumber)
        .replace(/[<>:"/\\|?*]+/g, "-")
        .trim();

    document.title =
      `BStore-${safeInvoiceNumber}`;

    const restoreTitle = () => {
      document.title =
        previousTitle;

      window.removeEventListener(
        "afterprint",
        restoreTitle
      );
    };

    window.addEventListener(
      "afterprint",
      restoreTitle
    );

    window.print();
  };

  /* ==========================================================
     DUPLICATE
  ========================================================== */

  const handleDuplicate =
    async () => {
      if (isCancelled) {
        return;
      }

      const confirmed =
        window.confirm(
          "Create a new draft duplicate of this invoice?"
        );

      if (!confirmed) {
        return;
      }

      try {
        setActionLoading("duplicate");
        clearMessages();

        const response =
          await axios.post(
            `${API_URL}/invoices/admin/${invoiceId}/duplicate`,
            {},
            {
              headers:
                getAuthHeaders(),
            }
          );

        const duplicatedInvoice =
          response.data?.invoice;

        const newInvoiceId =
          duplicatedInvoice?._id ||
          duplicatedInvoice?.id;

        if (!newInvoiceId) {
          throw new Error(
            "Duplicate invoice was created but no invoice ID was returned."
          );
        }

        navigate(
          `/invoices/${newInvoiceId}`
        );
      } catch (err) {
        console.error(
          "Duplicate invoice error:",
          err
        );

        setError(
          err.response?.data?.message ||
            err.message ||
            "Failed to duplicate invoice."
        );
      } finally {
        setActionLoading("");
      }
    };

  /* ==========================================================
     CANCEL
  ========================================================== */

  const handleCancel =
    async () => {
      if (isCancelled) {
        return;
      }

      const reason =
        window.prompt(
          "Enter cancellation reason (optional):",
          ""
        );

      if (reason === null) {
        return;
      }

      const confirmed =
        window.confirm(
          "Are you sure you want to cancel this invoice?"
        );

      if (!confirmed) {
        return;
      }

      try {
        setActionLoading("cancel");
        clearMessages();

        const response =
          await axios.put(
            `${API_URL}/invoices/admin/${invoiceId}/cancel`,
            {
              reason:
                reason.trim(),
            },
            {
              headers:
                getAuthHeaders(),
            }
          );

        const cancelledInvoice =
          response.data?.invoice;

        if (cancelledInvoice) {
          setInvoice(
            cancelledInvoice
          );

          setFormat(
            cancelledInvoice.format ||
              "80mm"
          );

          setCopyType(
            cancelledInvoice.copyType ||
              "Customer"
          );

          setNotes(
            cancelledInvoice.notes || ""
          );

          setDiscountPercent(
            Number(
              cancelledInvoice.discountPercent
            ) || 0
          );
        }

        setSuccess(
          "Invoice cancelled successfully."
        );
      } catch (err) {
        console.error(
          "Cancel invoice error:",
          err
        );

        setError(
          err.response?.data?.message ||
            err.message ||
            "Failed to cancel invoice."
        );
      } finally {
        setActionLoading("");
      }
    };

  /* ==========================================================
     BACK
  ========================================================== */

  const handleBack = () => {
    navigate("/orders");
  };

  /* ==========================================================
     FILTER PRODUCTS
  ========================================================== */

  const filteredProducts =
    products.filter(
      (product) => {
        const text = [
          product.name,
          product.brand?.name,
          product.category?.name,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return (
          !productSearch.trim() ||
          text.includes(
            productSearch
              .trim()
              .toLowerCase()
          )
        );
      }
    );

  /* ==========================================================
     LOADING
  ========================================================== */

  if (loading) {
    return (
      <div className="invoice-loading-page">
        <div className="invoice-loading-spinner" />

        <p>Loading invoice...</p>
      </div>
    );
  }

  /* ==========================================================
     ERROR / NO INVOICE
  ========================================================== */

  if (!invoice) {
    return (
      <div className="invoice-error-page">
        <div className="invoice-error-card">
          <h2>Invoice not found</h2>

          <p>
            {error ||
              "The requested invoice could not be loaded."}
          </p>

          <button
            type="button"
            onClick={handleBack}
            className="invoice-secondary-button"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <div
      className={`invoice-page ${
        format === "A4"
          ? "invoice-page-a4"
          : "invoice-page-80mm"
      }`}
    >
      {/* ======================================================
          TOP BAR
      ====================================================== */}

      <div className="invoice-topbar no-print">
        <div>
          <button
            type="button"
            className="invoice-back-button"
            onClick={handleBack}
          >
            ← Back to Orders
          </button>
        </div>

        <div className="invoice-topbar-title">
          <h1>Invoice</h1>

          <span
            className={`invoice-status-badge ${status.toLowerCase()}`}
          >
            {status}
          </span>
        </div>

        <div className="invoice-topbar-actions">
          {/* SAVE */}

          {canEdit && (
            <button
              type="button"
              className="invoice-primary-button"
              disabled={saving}
              onClick={handleSave}
            >
              {saving
                ? "Saving..."
                : "Save Invoice"}
            </button>
          )}

          {/* PREVIEW */}

          <button
            type="button"
            className="invoice-secondary-button"
            disabled={
              actionLoading === "preview"
            }
            onClick={handlePreview}
          >
            Preview
          </button>

          {/* PRINT */}

          {!isCancelled && (
            <button
              type="button"
              className="invoice-secondary-button"
              onClick={handlePrint}
            >
              Print
            </button>
          )}

          {/* SAVE AS PDF */}

          <button
            type="button"
            className="invoice-secondary-button"
            onClick={handleSaveAsPdf}
          >
            Save as PDF
          </button>

          {/* DUPLICATE */}

          {!isCancelled && (
            <button
              type="button"
              className="invoice-secondary-button"
              disabled={
                actionLoading === "duplicate"
              }
              onClick={handleDuplicate}
            >
              {actionLoading === "duplicate"
                ? "Duplicating..."
                : "Duplicate"}
            </button>
          )}

          {/* CANCEL */}

          {!isCancelled && (
            <button
              type="button"
              className="invoice-danger-button"
              disabled={
                actionLoading === "cancel"
              }
              onClick={handleCancel}
            >
              {actionLoading === "cancel"
                ? "Cancelling..."
                : "Cancel"}
            </button>
          )}
        </div>
      </div>

      {/* ======================================================
          MESSAGES
      ====================================================== */}

      <div className="invoice-messages no-print">
        {error && (
          <div className="invoice-error-message">
            <strong>Error</strong>

            <span>{error}</span>

            <button
              type="button"
              onClick={() => setError("")}
            >
              ✕
            </button>
          </div>
        )}

        {success && (
          <div className="invoice-success-message">
            <span>✓</span>

            {success}

            <button
              type="button"
              onClick={() =>
                setSuccess("")
              }
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* ======================================================
          SETTINGS
      ====================================================== */}

      <div className="invoice-settings no-print">
        <div className="invoice-setting-group">
          <label>Format</label>

          <div className="invoice-toggle-group">
            <button
              type="button"
              className={
                format === "80mm"
                  ? "active"
                  : ""
              }
              disabled={!canEdit}
              onClick={() =>
                setFormat("80mm")
              }
            >
              80mm Thermal
            </button>

            <button
              type="button"
              className={
                format === "A4"
                  ? "active"
                  : ""
              }
              disabled={!canEdit}
              onClick={() =>
                setFormat("A4")
              }
            >
              A4
            </button>
          </div>
        </div>

        <div className="invoice-setting-group">
          <label>Copy</label>

          <div className="invoice-toggle-group">
            <button
              type="button"
              className={
                copyType === "Customer"
                  ? "active"
                  : ""
              }
              disabled={!canEdit}
              onClick={() =>
                setCopyType("Customer")
              }
            >
              Customer Copy
            </button>

            <button
              type="button"
              className={
                copyType === "Store"
                  ? "active"
                  : ""
              }
              disabled={!canEdit}
              onClick={() =>
                setCopyType("Store")
              }
            >
              Store Copy
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================
          SCREEN INVOICE
      ====================================================== */}

      <div
        className={`invoice-paper ${
          format === "A4"
            ? "invoice-paper-a4"
            : "invoice-paper-80mm"
        }`}
      >
        {/* HEADER */}

        <div className="invoice-paper-header">
          <div className="invoice-brand">
            <img
              src={INVOICE_LOGO}
              alt="BStore logo"
              className="invoice-brand-logo"
            />

            <div className="invoice-brand-text">
              <strong>BStore</strong>
              <span>Invoice</span>
            </div>
          </div>

          <div className="invoice-number-block">
            <strong>
              {invoice.invoiceNumber}
            </strong>

            <span>
              {formatDate(
                invoice.createdAt
              )}
            </span>
          </div>
        </div>

        {/* CUSTOMER */}

        <div className="invoice-customer-section">
          <div className="invoice-section-title">
            Customer
          </div>

          <div className="invoice-customer-grid">
            <div>
              <span>Name</span>

              <strong>
                {getCustomerName(
                  invoice.customer
                )}
              </strong>
            </div>

            <div>
              <span>Email</span>

              <strong>
                {invoice.customer?.email ||
                  "—"}
              </strong>
            </div>

            <div>
              <span>Phone</span>

              <strong>
                {invoice.customer?.phone ||
                  "—"}
              </strong>
            </div>

            <div>
              <span>Address</span>

              <strong>
                {invoice.customer?.address ||
                  "—"}
              </strong>
            </div>
          </div>
        </div>

        {/* PRODUCTS */}

        <div className="invoice-products-section">
          <div className="invoice-section-heading-row">
            <div className="invoice-section-title">
              Products
            </div>

            {canEdit && (
              <button
                type="button"
                className="invoice-add-product-button no-print"
                onClick={
                  handleOpenAddProduct
                }
              >
                + Add Product
              </button>
            )}
          </div>

          <div
            className={`invoice-products-table ${
              canEdit
                ? "draft"
                : "readonly"
            } ${
              format === "80mm"
                ? "thermal-screen-table"
                : "a4-screen-table"
            }`}
          >
            <div
              className={`invoice-products-head ${
                canEdit
                  ? "draft"
                  : "readonly"
              }`}
            >
              <span className="invoice-number-column">
                #
              </span>

              <span>Product</span>

              <span>Qty</span>

              <span>Price</span>

              <span>Total</span>

              {canEdit && (
                <span className="no-print">
                  Action
                </span>
              )}
            </div>

            {invoice.items?.length > 0 ? (
              invoice.items.map(
                (item, index) => {
                  const quantity =
                    Number(item.quantity) ||
                    0;

                  const price =
                    Number(item.price) ||
                    0;

                  const lineTotal =
                    quantity *
                    price;

                  return (
                    <div
                      className={`invoice-product-row ${
                        canEdit
                          ? "draft"
                          : "readonly"
                      }`}
                      key={
                        item._id ||
                        `${item.product?._id || item.product || "product"}-${index}`
                      }
                    >
                      <div className="invoice-product-number">
                        {index + 1}
                      </div>

                      <div className="invoice-product-info">
                        <strong>
                          {item.productName}
                        </strong>
                      </div>

                      <div>
                        {canEdit ? (
                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={
                              item.quantity
                            }
                            onChange={(event) =>
                              updateItem(
                                index,
                                "quantity",
                                event.target
                                  .value
                              )
                            }
                            className="invoice-edit-input quantity"
                          />
                        ) : (
                          <span>
                            {quantity}
                          </span>
                        )}
                      </div>

                      <div>
                        {canEdit ? (
                          <div className="invoice-price-input">
                            <span>$</span>

                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={
                                item.price
                              }
                              onChange={(event) =>
                                updateItem(
                                  index,
                                  "price",
                                  event.target
                                    .value
                                )
                              }
                              className="invoice-edit-input"
                            />
                          </div>
                        ) : (
                          <span>
                            {formatPrice(
                              price
                            )}
                          </span>
                        )}
                      </div>

                      <strong>
                        {formatPrice(
                          lineTotal
                        )}
                      </strong>

                      {canEdit && (
                        <button
                          type="button"
                          className="invoice-remove-button no-print"
                          onClick={() =>
                            handleRemoveItem(
                              index
                            )
                          }
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  );
                }
              )
            ) : (
              <div className="invoice-empty-products">
                No products in this invoice.
              </div>
            )}
          </div>
        </div>

        {/* TOTALS */}

        <div className="invoice-summary">
          <div className="invoice-summary-row">
            <span>Subtotal</span>

            <strong>
              {formatPrice(
                calculatedTotals.subtotal
              )}
            </strong>
          </div>

          <div className="invoice-summary-row invoice-discount-row">
            <div>
              <span>Discount</span>

              {canEdit ? (
                <div className="invoice-discount-input">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={
                      discountPercent
                    }
                    onChange={(event) =>
                      setDiscountPercent(
                        event.target.value
                      )
                    }
                  />

                  <span>%</span>
                </div>
              ) : (
                <span>
                  {Number(
                    invoice.discountPercent
                  ) || 0}
                  %
                </span>
              )}
            </div>

            <strong>
              -
              {formatPrice(
                calculatedTotals.discountAmount
              )}
            </strong>
          </div>

          <div className="invoice-summary-total">
            <span>Total</span>

            <strong>
              {formatPrice(
                calculatedTotals.total
              )}
            </strong>
          </div>
        </div>

        {/* NOTES */}

        <div className="invoice-notes-section">
          <div className="invoice-section-title">
            Notes
          </div>

          {canEdit ? (
            <textarea
              value={notes}
              onChange={(event) =>
                setNotes(
                  event.target.value
                )
              }
              placeholder="Optional invoice notes..."
              maxLength={2000}
              className="invoice-notes-input no-print"
            />
          ) : (
            <div className="invoice-notes-display">
              {invoice.notes ||
                "No notes."}
            </div>
          )}

          {canEdit && (
            <div className="invoice-notes-print">
              {notes || "No notes."}
            </div>
          )}
        </div>

        {/* FOOTER */}

        <div className="invoice-paper-footer">
          <span>
            {copyType} Copy
          </span>

          <span>
            Thank you for your business
          </span>
        </div>
      </div>

      {/* ======================================================
          DEDICATED 80MM PRINT LAYOUT
      ====================================================== */}

      <ThermalPrintLayout
        invoice={invoice}
        totals={calculatedTotals}
        notes={
          notes ||
          invoice.notes ||
          ""
        }
        copyType={copyType}
      />

      {/* ======================================================
          ADD PRODUCT MODAL
      ====================================================== */}

      {showAddProduct && (
        <div
          className="invoice-modal-overlay no-print"
          onClick={() =>
            setShowAddProduct(false)
          }
        >
          <div
            className="invoice-product-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="invoice-modal-header">
              <div>
                <h2>Add Product</h2>

                <p>
                  Select a product to add to
                  the invoice.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowAddProduct(
                    false
                  )
                }
              >
                ✕
              </button>
            </div>

            <input
              type="text"
              value={productSearch}
              onChange={(event) =>
                setProductSearch(
                  event.target.value
                )
              }
              placeholder="Search product..."
              className="invoice-product-search"
              autoFocus
            />

            <div className="invoice-product-list">
              {productLoading ? (
                <div className="invoice-product-loading">
                  <div className="invoice-loading-spinner small" />

                  Loading products...
                </div>
              ) : filteredProducts.length ===
                0 ? (
                <div className="invoice-product-empty">
                  No products found.
                </div>
              ) : (
                filteredProducts.map(
                  (product) => {
                    const finalPrice =
                      getProductPrice(
                        product
                      );

                    const image =
                      getProductImage(
                        product
                      );

                    return (
                      <button
                        type="button"
                        className="invoice-product-option"
                        key={
                          product._id ||
                          product.id
                        }
                        onClick={() =>
                          handleAddProduct(
                            product
                          )
                        }
                      >
                        {image ? (
                          <img
                            src={getImageUrl(
                              image
                            )}
                            alt={
                              product.name ||
                              "Product"
                            }
                          />
                        ) : (
                          <div className="invoice-product-option-placeholder">
                            —
                          </div>
                        )}

                        <div>
                          <strong>
                            {product.name ||
                              "Product"}
                          </strong>

                          <span>
                            {formatPrice(
                              finalPrice
                            )}
                          </span>

                          {Number(
                            product.discount
                          ) > 0 && (
                            <small>
                              {Number(
                                product.price
                              ).toFixed(2)}{" "}
                              ·{" "}
                              {Number(
                                product.discount
                              )}
                              % off
                            </small>
                          )}
                        </div>
                      </button>
                    );
                  }
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================
          PREVIEW MODAL
      ====================================================== */}

      {previewOpen && (
        <div
          className="invoice-preview-overlay no-print"
          onClick={() =>
            setPreviewOpen(false)
          }
        >
          <div
            className={`invoice-preview-modal ${
              format === "A4"
                ? "a4"
                : "thermal"
            }`}
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="invoice-preview-header">
              <div>
                <h2>
                  Invoice Preview
                </h2>

                <span>
                  {invoice.invoiceNumber}
                  {" · "}
                  {format}
                </span>
              </div>

              <button
                type="button"
                onClick={() =>
                  setPreviewOpen(false)
                }
              >
                ✕
              </button>
            </div>

            <div className="invoice-preview-body">
              {format === "80mm" ? (
                <div className="invoice-preview-paper thermal-preview-paper">
                  <ThermalPreview
                    invoice={invoice}
                    totals={calculatedTotals}
                    notes={
                      notes ||
                      invoice.notes ||
                      ""
                    }
                    copyType={copyType}
                  />
                </div>
              ) : (
                <div className="invoice-preview-paper a4-preview-paper">
                  <A4Preview
                    invoice={invoice}
                    totals={calculatedTotals}
                    notes={
                      notes ||
                      invoice.notes ||
                      ""
                    }
                    copyType={copyType}
                  />
                </div>
              )}
            </div>

            <div className="invoice-preview-footer">
              <button
                type="button"
                className="invoice-secondary-button"
                onClick={() =>
                  setPreviewOpen(false)
                }
              >
                Close
              </button>

              <button
                type="button"
                className="invoice-secondary-button"
                onClick={() => {
                  setPreviewOpen(false);

                  setTimeout(
                    () =>
                      handleSaveAsPdf(),
                    100
                  );
                }}
              >
                Save as PDF
              </button>

              <button
                type="button"
                className="invoice-primary-button"
                onClick={() => {
                  setPreviewOpen(false);

                  setTimeout(
                    () =>
                      window.print(),
                    100
                  );
                }}
              >
                Print
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Invoice;