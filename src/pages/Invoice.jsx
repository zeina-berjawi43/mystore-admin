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
   AUTH
============================================================ */

const getToken = () => {
  const token =
    localStorage.getItem("accessToken") ||
    localStorage.getItem("adminToken") ||
    localStorage.getItem("token") ||
    "";

  return token
    .replace(/^Bearer\s+/i, "")
    .trim();
};


const getAuthHeaders = () => {
  const token =
    getToken();

  if (!token) {
    throw new Error(
      "Admin authentication token was not found. Please login again."
    );
  }

  return {
    Authorization:
      `Bearer ${token}`,
  };
};


/* ============================================================
   HELPERS
============================================================ */

const formatPrice = (value) => {
  const number =
    Number(value);

  if (
    !Number.isFinite(number)
  ) {
    return "$0.00";
  }

  return `$${number.toFixed(2)}`;
};


const formatDate = (value) => {
  if (!value) {
    return "—";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "—";
  }

  return date.toLocaleDateString(
    "en-US",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    }
  );
};


const getCustomerName = (
  customer
) => {
  if (!customer) {
    return "Unknown Customer";
  }

  if (
    customer.firstName ||
    customer.lastName
  ) {
    return (
      `${customer.firstName || ""} ${
        customer.lastName || ""
      }`
        .trim()
    );
  }

  return (
    customer.name ||
    "Unknown Customer"
  );
};


/* ============================================================
   PRODUCT HELPERS
============================================================ */

const getProductImage = (
  product
) => {
  if (!product) {
    return "";
  }

  return (
    product.image ||
    product.productImage ||
    ""
  );
};


const getImageUrl = (
  image
) => {
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


const getProductPrice = (
  product
) => {
  if (!product) {
    return 0;
  }

  const originalPrice =
    Number(
      product.price
    ) || 0;

  const discount =
    Number(
      product.discount
    ) || 0;

  if (
    discount <= 0
  ) {
    return originalPrice;
  }

  if (
    discount >= 100
  ) {
    return 0;
  }

  return (
    originalPrice -
    (
      originalPrice *
      discount
    ) /
      100
  );
};


/* ============================================================
   INVOICE PAGE
============================================================ */

function Invoice() {

  const {
    invoiceId,
  } = useParams();

  const navigate =
    useNavigate();


  /* ==========================================================
     STATE
  ========================================================== */

  const [
    invoice,
    setInvoice,
  ] = useState(null);


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    saving,
    setSaving,
  ] = useState(false);


  const [
    actionLoading,
    setActionLoading,
  ] = useState("");


  const [
    error,
    setError,
  ] = useState("");


  const [
    success,
    setSuccess,
  ] = useState("");


  const [
    discountPercent,
    setDiscountPercent,
  ] = useState(0);


  const [
    notes,
    setNotes,
  ] = useState("");


  const [
    format,
    setFormat,
  ] = useState("80mm");


  const [
    copyType,
    setCopyType,
  ] = useState("Customer");


  const [
    products,
    setProducts,
  ] = useState([]);


  const [
    productLoading,
    setProductLoading,
  ] = useState(false);


  const [
    productSearch,
    setProductSearch,
  ] = useState("");


  const [
    showAddProduct,
    setShowAddProduct,
  ] = useState(false);


  const [
    previewOpen,
    setPreviewOpen,
  ] = useState(false);


  /* ==========================================================
     STATUS
  ========================================================== */

  const status =
    invoice?.status ||
    "Draft";


  const isDraft =
    status === "Draft";


  const isSaved =
    status === "Saved";


  const isCancelled =
    status === "Cancelled";


  /* ==========================================================
     LOAD INVOICE
  ========================================================== */

  const fetchInvoice =
    useCallback(
      async () => {

        if (!invoiceId) {
          setError(
            "Invoice ID is missing."
          );

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
                headers:
                  getAuthHeaders(),
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


          setInvoice(
            receivedInvoice
          );


          setDiscountPercent(
            Number(
              receivedInvoice.discountPercent
            ) || 0
          );


          setNotes(
            receivedInvoice.notes ||
            ""
          );


          setFormat(
            receivedInvoice.format ||
            "80mm"
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
      [
        invoiceId,
      ]
    );


  useEffect(() => {

    fetchInvoice();

  }, [
    fetchInvoice,
  ]);


  /* ==========================================================
     FETCH PRODUCTS
  ========================================================== */

  const fetchProducts =
    useCallback(
      async () => {

        try {

          setProductLoading(true);


          const response =
            await axios.get(
              `${API_URL}/products/admin/all`,
              {
                headers:
                  getAuthHeaders(),
              }
            );


          const data =
            response.data;


          if (
            !Array.isArray(
              data?.products
            )
          ) {
            throw new Error(
              "Products data was not returned correctly."
            );
          }


          setProducts(
            data.products
          );

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
     OPEN ADD PRODUCT
  ========================================================== */

  const handleOpenAddProduct =
    async () => {

      clearMessages();

      setShowAddProduct(
        true
      );


      if (
        products.length === 0
      ) {
        await fetchProducts();
      }
    };


  /* ==========================================================
     CLEAR MESSAGES
  ========================================================== */

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };


  /* ==========================================================
     UPDATE LOCAL ITEM
  ========================================================== */

  const updateItem = (
    itemIndex,
    field,
    value
  ) => {

    if (!isDraft) {
      return;
    }


    setInvoice(
      (previousInvoice) => {

        if (
          !previousInvoice
        ) {
          return previousInvoice;
        }


        const newItems = [
          ...(previousInvoice.items ||
            []),
        ];


        const item = {
          ...newItems[itemIndex],
        };


        if (
          field ===
          "quantity"
        ) {

          let quantity =
            parseInt(
              value,
              10
            );


          if (
            !Number.isFinite(
              quantity
            ) ||
            quantity < 1
          ) {
            quantity = 1;
          }


          item.quantity =
            quantity;


        } else if (
          field ===
          "price"
        ) {

          let price =
            Number(value);


          if (
            !Number.isFinite(
              price
            ) ||
            price < 0
          ) {
            price = 0;
          }


          item.price =
            price;
        }


        item.lineTotal =
          Number(
            item.quantity || 0
          ) *
          Number(
            item.price || 0
          );


        newItems[
          itemIndex
        ] = item;


        return {
          ...previousInvoice,
          items:
            newItems,
        };
      }
    );
  };


  /* ==========================================================
     REMOVE ITEM
  ========================================================== */

  const handleRemoveItem =
    (itemIndex) => {

      if (!isDraft) {
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

          if (
            !previousInvoice
          ) {
            return previousInvoice;
          }


          const newItems =
            (
              previousInvoice.items ||
              []
            ).filter(
              (_, index) =>
                index !==
                itemIndex
            );


          return {
            ...previousInvoice,
            items:
              newItems,
          };
        }
      );
    };


  /* ==========================================================
     ADD PRODUCT
  ========================================================== */

  const handleAddProduct =
    (product) => {

      if (!isDraft) {
        return;
      }


      if (!product) {
        return;
      }


      const productId =
        product._id ||
        product.id;


      const price =
        getProductPrice(
          product
        );


      const image =
        getImageUrl(
          getProductImage(
            product
          )
        );


      setInvoice(
        (previousInvoice) => {

          if (
            !previousInvoice
          ) {
            return previousInvoice;
          }


          const existingItems =
            [
              ...(previousInvoice.items ||
                []),
            ];


          const existingIndex =
            existingItems.findIndex(
              (item) => {

                const itemProductId =
                  item.product?._id ||
                  item.product;


                return (
                  itemProductId &&
                  String(
                    itemProductId
                  ) ===
                    String(
                      productId
                    )
                );
              }
            );


          if (
            existingIndex !==
            -1
          ) {

            const updatedItem =
              {
                ...existingItems[
                  existingIndex
                ],
              };


            updatedItem.quantity =
              Number(
                updatedItem.quantity ||
                0
              ) + 1;


            updatedItem.lineTotal =
              Number(
                updatedItem.quantity
              ) *
              Number(
                updatedItem.price
              );


            existingItems[
              existingIndex
            ] =
              updatedItem;


            return {
              ...previousInvoice,
              items:
                existingItems,
            };
          }


          existingItems.push({
            product:
              productId ||
              null,

            productName:
              product.name ||
              "Product",

            /*
             * Product image is kept in the invoice data
             * for snapshot/history purposes.
             *
             * It is NOT displayed inside the invoice table.
             */

            productImage:
              image,

            quantity:
              1,

            price:
              price,

            lineTotal:
              price,
          });


          return {
            ...previousInvoice,
            items:
              existingItems,
          };
        }
      );


      setShowAddProduct(
        false
      );

      setProductSearch(
        ""
      );
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
          (
            sum,
            item
          ) => {

            const quantity =
              Number(
                item.quantity
              ) || 0;

            const price =
              Number(
                item.price
              ) || 0;


            return (
              sum +
              quantity *
                price
            );
          },
          0
        );


      const discount =
        Math.min(
          100,
          Math.max(
            0,
            Number(
              discountPercent
            ) || 0
          )
        );


      const discountAmount =
        subtotal *
        (
          discount /
          100
        );


      const total =
        subtotal -
        discountAmount;


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

  const handleSave =
    async () => {

      if (!invoice) {
        return;
      }


      if (!isDraft) {
        return;
      }


      if (
        !invoice.items ||
        invoice.items.length ===
          0
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
                item.productImage ||
                "",

              quantity:
                Number(
                  item.quantity
                ),

              price:
                Number(
                  item.price
                ),

            })
          );


        /* ----------------------------------------------------
           UPDATE INVOICE
        ---------------------------------------------------- */

        const updateResponse =
          await axios.put(
            `${API_URL}/invoices/admin/${invoiceId}`,
            {
              items,

              discountPercent:
                Number(
                  discountPercent
                ) || 0,

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

          setInvoice(
            updatedInvoice
          );
        }


        /* ----------------------------------------------------
           FINAL SAVE
        ---------------------------------------------------- */

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

          setInvoice(
            savedInvoice
          );


          setDiscountPercent(
            Number(
              savedInvoice.discountPercent
            ) || 0
          );


          setNotes(
            savedInvoice.notes ||
            ""
          );


          setFormat(
            savedInvoice.format ||
            "80mm"
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

  const handlePreview =
    async () => {

      try {

        setActionLoading(
          "preview"
        );

        clearMessages();


        const response =
          await axios.get(
            `${API_URL}/invoices/admin/${invoiceId}/preview`,
            {
              headers:
                getAuthHeaders(),
            }
          );


        const preview =
          response.data?.preview;


        if (preview) {

          setInvoice(
            preview
          );


          setDiscountPercent(
            Number(
              preview.discountPercent
            ) || 0
          );


          setNotes(
            preview.notes ||
            ""
          );


          setFormat(
            preview.format ||
            "80mm"
          );


          setCopyType(
            preview.copyType ||
            "Customer"
          );
        }


        setPreviewOpen(
          true
        );

      } catch (err) {

        console.error(
          "Preview invoice error:",
          err
        );


        setError(
          err.response?.data?.message ||
          err.message ||
          "Failed to load invoice preview."
        );

      } finally {

        setActionLoading("");
      }
    };


  /* ==========================================================
     PRINT
  ========================================================== */

  const handlePrint =
    () => {

      clearMessages();

      window.print();
    };


  /* ==========================================================
     REPRINT
  ========================================================== */

  const handleReprint =
    async () => {

      if (!isSaved) {

        setError(
          "Only saved invoices can be reprinted."
        );

        return;
      }


      try {

        setActionLoading(
          "reprint"
        );

        clearMessages();


        const response =
          await axios.put(
            `${API_URL}/invoices/admin/${invoiceId}/reprint`,
            {},
            {
              headers:
                getAuthHeaders(),
            }
          );


        const updatedInvoice =
          response.data?.invoice;


        if (updatedInvoice) {

          setInvoice(
            updatedInvoice
          );
        }


        setSuccess(
          "Invoice ready for reprint."
        );


        setTimeout(() => {
          window.print();
        }, 150);

      } catch (err) {

        console.error(
          "Reprint invoice error:",
          err
        );


        setError(
          err.response?.data?.message ||
          err.message ||
          "Failed to reprint invoice."
        );

      } finally {

        setActionLoading("");
      }
    };


  /* ==========================================================
     DUPLICATE
  ========================================================== */

  const handleDuplicate =
    async () => {

      if (
        isCancelled
      ) {
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

        setActionLoading(
          "duplicate"
        );

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

      if (
        isCancelled
      ) {
        return;
      }


      const reason =
        window.prompt(
          "Enter cancellation reason (optional):",
          ""
        );


      if (
        reason ===
        null
      ) {
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

        setActionLoading(
          "cancel"
        );

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

  const handleBack =
    () => {

      navigate(
        "/orders"
      );
    };


  /* ==========================================================
     FILTER PRODUCTS
  ========================================================== */

  const filteredProducts =
    products.filter(
      (product) => {

        const text =
          [
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

        <p>
          Loading invoice...
        </p>

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

          <h2>
            Invoice not found
          </h2>

          <p>
            {error ||
              "The requested invoice could not be loaded."}
          </p>

          <button
            type="button"
            onClick={
              handleBack
            }
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
      className={
        `invoice-page ${
          format === "A4"
            ? "invoice-page-a4"
            : "invoice-page-80mm"
        }`
      }
    >

      {/* ======================================================
          TOP BAR
      ====================================================== */}

      <div className="invoice-topbar no-print">

        <div>

          <button
            type="button"
            className="invoice-back-button"
            onClick={
              handleBack
            }
          >
            ← Back to Orders
          </button>

        </div>


        <div className="invoice-topbar-title">

          <h1>
            Invoice
          </h1>

          <span
            className={
              `invoice-status-badge ${
                status.toLowerCase()
              }`
            }
          >
            {status}
          </span>

        </div>


        <div className="invoice-topbar-actions">

          {isDraft && (

            <button
              type="button"
              className="invoice-primary-button"
              disabled={
                saving
              }
              onClick={
                handleSave
              }
            >
              {saving
                ? "Saving..."
                : "Save Invoice"}
            </button>

          )}


          <button
            type="button"
            className="invoice-secondary-button"
            disabled={
              actionLoading ===
              "preview"
            }
            onClick={
              handlePreview
            }
          >
            {actionLoading ===
            "preview"
              ? "Loading..."
              : "Preview"}
          </button>


          {!isCancelled && (

            <button
              type="button"
              className="invoice-secondary-button"
              onClick={
                handlePrint
              }
            >
              Print
            </button>

          )}


          {isSaved && (

            <button
              type="button"
              className="invoice-secondary-button"
              disabled={
                actionLoading ===
                "reprint"
              }
              onClick={
                handleReprint
              }
            >
              {actionLoading ===
              "reprint"
                ? "Preparing..."
                : "Reprint"}
            </button>

          )}


          {!isCancelled && (

            <button
              type="button"
              className="invoice-secondary-button"
              disabled={
                actionLoading ===
                "duplicate"
              }
              onClick={
                handleDuplicate
              }
            >
              {actionLoading ===
              "duplicate"
                ? "Duplicating..."
                : "Duplicate"}
            </button>

          )}


          {!isCancelled && (

            <button
              type="button"
              className="invoice-danger-button"
              disabled={
                actionLoading ===
                "cancel"
              }
              onClick={
                handleCancel
              }
            >
              {actionLoading ===
              "cancel"
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

            <strong>
              Error
            </strong>

            <span>
              {error}
            </span>

            <button
              type="button"
              onClick={() =>
                setError("")
              }
            >
              ✕
            </button>

          </div>

        )}


        {success && (

          <div className="invoice-success-message">

            <span>
              ✓
            </span>

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

          <label>
            Format
          </label>

          <div className="invoice-toggle-group">

            <button
              type="button"
              className={
                format ===
                "80mm"
                  ? "active"
                  : ""
              }
              disabled={
                !isDraft
              }
              onClick={() =>
                setFormat(
                  "80mm"
                )
              }
            >
              80mm Thermal
            </button>


            <button
              type="button"
              className={
                format ===
                "A4"
                  ? "active"
                  : ""
              }
              disabled={
                !isDraft
              }
              onClick={() =>
                setFormat(
                  "A4"
                )
              }
            >
              A4
            </button>

          </div>

        </div>


        <div className="invoice-setting-group">

          <label>
            Copy
          </label>

          <div className="invoice-toggle-group">

            <button
              type="button"
              className={
                copyType ===
                "Customer"
                  ? "active"
                  : ""
              }
              disabled={
                !isDraft
              }
              onClick={() =>
                setCopyType(
                  "Customer"
                )
              }
            >
              Customer Copy
            </button>


            <button
              type="button"
              className={
                copyType ===
                "Store"
                  ? "active"
                  : ""
              }
              disabled={
                !isDraft
              }
              onClick={() =>
                setCopyType(
                  "Store"
                )
              }
            >
              Store Copy
            </button>

          </div>

        </div>

      </div>


      {/* ======================================================
          INVOICE PAPER
      ====================================================== */}

      <div
        className={
          `invoice-paper ${
            format === "A4"
              ? "invoice-paper-a4"
              : "invoice-paper-80mm"
          }`
        }
      >

        {/* ====================================================
            HEADER
        ==================================================== */}

        <div className="invoice-paper-header">

          <div className="invoice-brand">

            <img
              src="/logo.png"
              alt="BStore logo"
              className="invoice-brand-logo"
            />

            <div className="invoice-brand-text">

              <strong>
                BStore
              </strong>

              <span>
                Invoice
              </span>

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


        {/* ====================================================
            CUSTOMER
        ==================================================== */}

        <div className="invoice-customer-section">

          <div className="invoice-section-title">
            Customer
          </div>


          <div className="invoice-customer-grid">

            <div>

              <span>
                Name
              </span>

              <strong>
                {getCustomerName(
                  invoice.customer
                )}
              </strong>

            </div>


            <div>

              <span>
                Email
              </span>

              <strong>
                {invoice.customer?.email ||
                  "—"}
              </strong>

            </div>


            <div>

              <span>
                Phone
              </span>

              <strong>
                {invoice.customer?.phone ||
                  "—"}
              </strong>

            </div>


            <div>

              <span>
                Address
              </span>

              <strong>
                {invoice.customer?.address ||
                  "—"}
              </strong>

            </div>

          </div>

        </div>


        {/* ====================================================
            PRODUCTS
        ==================================================== */}

        <div className="invoice-products-section">

          <div className="invoice-section-heading-row">

            <div className="invoice-section-title">
              Products
            </div>


            {isDraft && (

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
            className={
              `invoice-products-table ${
                isDraft
                  ? "draft"
                  : "readonly"
              }`
            }
          >

            <div
              className={
                `invoice-products-head ${
                  isDraft
                    ? "draft"
                    : "readonly"
                }`
              }
            >

              <span className="invoice-number-column">
                #
              </span>

              <span>
                Product
              </span>

              <span>
                Qty
              </span>

              <span>
                Price
              </span>

              <span>
                Total
              </span>

              {isDraft && (
                <span className="no-print">
                  Action
                </span>
              )}

            </div>


            {invoice.items?.length >
            0 ? (

              invoice.items.map(
                (
                  item,
                  index
                ) => {

                  const quantity =
                    Number(
                      item.quantity
                    ) || 0;


                  const price =
                    Number(
                      item.price
                    ) || 0;


                  const lineTotal =
                    quantity *
                    price;


                  return (

                    <div
                      className={
                        `invoice-product-row ${
                          isDraft
                            ? "draft"
                            : "readonly"
                        }`
                      }
                      key={
                        item._id ||
                        `${item.product?._id || item.product || "product"}-${index}`
                      }
                    >

                      {/* COUNT */}

                      <div className="invoice-product-number">
                        {index + 1}
                      </div>


                      {/* PRODUCT NAME ONLY */}

                      <div className="invoice-product-info">

                        <strong>
                          {item.productName}
                        </strong>

                      </div>


                      {/* QUANTITY */}

                      <div>

                        {isDraft ? (

                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={
                              item.quantity
                            }
                            onChange={(
                              event
                            ) =>
                              updateItem(
                                index,
                                "quantity",
                                event.target.value
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


                      {/* PRICE */}

                      <div>

                        {isDraft ? (

                          <div className="invoice-price-input">

                            <span>
                              $
                            </span>

                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={
                                item.price
                              }
                              onChange={(
                                event
                              ) =>
                                updateItem(
                                  index,
                                  "price",
                                  event.target.value
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


                      {/* TOTAL */}

                      <strong>
                        {formatPrice(
                          lineTotal
                        )}
                      </strong>


                      {/* ACTION */}

                      {isDraft && (

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


        {/* ====================================================
            TOTALS
        ==================================================== */}

        <div className="invoice-summary">

          <div className="invoice-summary-row">

            <span>
              Subtotal
            </span>

            <strong>
              {formatPrice(
                calculatedTotals.subtotal
              )}
            </strong>

          </div>


          <div className="invoice-summary-row invoice-discount-row">

            <div>

              <span>
                Discount
              </span>

              {isDraft ? (

                <div className="invoice-discount-input">

                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={
                      discountPercent
                    }
                    onChange={(
                      event
                    ) =>
                      setDiscountPercent(
                        event.target.value
                      )
                    }
                  />

                  <span>
                    %
                  </span>

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

            <span>
              Total
            </span>

            <strong>
              {formatPrice(
                calculatedTotals.total
              )}
            </strong>

          </div>

        </div>


        {/* ====================================================
            NOTES
        ==================================================== */}

        <div className="invoice-notes-section">

          <div className="invoice-section-title">
            Notes
          </div>


          {isDraft ? (

            <textarea
              value={
                notes
              }
              onChange={(
                event
              ) =>
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


          {isDraft && (

            <div className="invoice-notes-print">

              {notes ||
                "No notes."}

            </div>

          )}

        </div>


        {/* ====================================================
            FOOTER
        ==================================================== */}

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
          ADD PRODUCT MODAL
      ====================================================== */}

      {showAddProduct && (

        <div
          className="invoice-modal-overlay no-print"
          onClick={() =>
            setShowAddProduct(
              false
            )
          }
        >

          <div
            className="invoice-product-modal"
            onClick={(
              event
            ) =>
              event.stopPropagation()
            }
          >

            <div className="invoice-modal-header">

              <div>

                <h2>
                  Add Product
                </h2>

                <p>
                  Select a product to add to the invoice.
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
              value={
                productSearch
              }
              onChange={(
                event
              ) =>
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
                  (
                    product
                  ) => {

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
                              ).toFixed(2)}
                              {" "}
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
            setPreviewOpen(
              false
            )
          }
        >

          <div
            className={
              `invoice-preview-modal ${
                format === "A4"
                  ? "a4"
                  : "thermal"
              }`
            }
            onClick={(
              event
            ) =>
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
                </span>

              </div>


              <button
                type="button"
                onClick={() =>
                  setPreviewOpen(
                    false
                  )
                }
              >
                ✕
              </button>

            </div>


            <div className="invoice-preview-body">

              <div className="invoice-preview-paper">

                <img
                  src="/logo.png"
                  alt="BStore logo"
                  className="invoice-preview-logo"
                />

                <strong className="invoice-preview-brand">
                  BStore
                </strong>

                <p>
                  {invoice.invoiceNumber}
                </p>

                <hr />


                <strong>
                  {getCustomerName(
                    invoice.customer
                  )}
                </strong>


                <p>
                  {invoice.customer?.phone ||
                    ""}
                </p>


                <hr />


                {invoice.items?.map(
                  (
                    item,
                    index
                  ) => (

                    <div
                      className="preview-line"
                      key={
                        item._id ||
                        index
                      }
                    >

                      <span>
                        <b>
                          {index + 1}.
                        </b>
                        {" "}
                        {item.productName}
                        {" × "}
                        {item.quantity}
                      </span>

                      <strong>
                        {formatPrice(
                          Number(
                            item.price
                          ) *
                          Number(
                            item.quantity
                          )
                        )}
                      </strong>

                    </div>

                  )
                )}


                <hr />


                <div className="preview-line">

                  <span>
                    Subtotal
                  </span>

                  <strong>
                    {formatPrice(
                      calculatedTotals.subtotal
                    )}
                  </strong>

                </div>


                <div className="preview-line">

                  <span>
                    Discount
                  </span>

                  <strong>
                    -
                    {formatPrice(
                      calculatedTotals.discountAmount
                    )}
                  </strong>

                </div>


                <div className="preview-total">

                  <span>
                    Total
                  </span>

                  <strong>
                    {formatPrice(
                      calculatedTotals.total
                    )}
                  </strong>

                </div>


                {(
                  notes ||
                  invoice.notes
                ) && (

                  <>

                    <hr />

                    <div className="preview-notes">

                      <strong>
                        Notes
                      </strong>

                      <span>
                        {notes ||
                          invoice.notes}
                      </span>

                    </div>

                  </>

                )}

              </div>

            </div>


            <div className="invoice-preview-footer">

              <button
                type="button"
                className="invoice-secondary-button"
                onClick={() =>
                  setPreviewOpen(
                    false
                  )
                }
              >
                Close
              </button>


              <button
                type="button"
                className="invoice-primary-button"
                onClick={() => {

                  setPreviewOpen(
                    false
                  );


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