
import {
  useEffect,
  useState,
} from "react";

import axios from "axios";


const API_URL =
  "https://mystore-backend-u6ey.onrender.com";


const ORDER_STATUSES = [
  "Pending",
  "Confirmed",
  "Preparing",
  "Shipped",
  "Delivered",
  "Cancelled",
];


/* ============================================================
   AUTH TOKEN
============================================================ */

const getToken = () => {

  /*
   * Admin Login stores the access token as:
   *
   * localStorage.setItem("accessToken", accessToken)
   *
   * We keep the other keys as fallbacks in case
   * an older session used them.
   */

  const storedToken =
    localStorage.getItem("accessToken") ||
    localStorage.getItem("adminToken") ||
    localStorage.getItem("token") ||
    "";

  return storedToken
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

const getInitials = (customer) => {

  if (!customer) {
    return "?";
  }


  const firstName =
    customer.firstName ||
    "";

  const lastName =
    customer.lastName ||
    "";

  const name =
    customer.name ||
    "";


  if (
    firstName ||
    lastName
  ) {

    return (
      `${firstName.charAt(0)}${lastName.charAt(0)}`
        .toUpperCase()
    );
  }


  if (name) {

    const parts =
      name.trim().split(/\s+/);


    if (parts.length >= 2) {

      return (
        `${parts[0].charAt(0)}${parts[1].charAt(0)}`
          .toUpperCase()
      );
    }


    return name
      .charAt(0)
      .toUpperCase();
  }


  return "?";
};


const getCustomerName = (customer) => {

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


const getCustomerEmail = (customer) => {

  return (
    customer?.email ||
    "No email"
  );
};


const getCustomerPhone = (customer) => {

  return (
    customer?.phone ||
    "No phone"
  );
};


const formatDate = (date) => {

  if (!date) {
    return "—";
  }


  const parsedDate =
    new Date(date);


  if (
    Number.isNaN(
      parsedDate.getTime()
    )
  ) {

    return "—";
  }


  return parsedDate.toLocaleDateString(
    "en-US",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    }
  );
};


const formatDateTime = (date) => {

  if (!date) {
    return "—";
  }


  const parsedDate =
    new Date(date);


  if (
    Number.isNaN(
      parsedDate.getTime()
    )
  ) {

    return "—";
  }


  return parsedDate.toLocaleString(
    "en-US",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
};


const formatPrice = (price) => {

  const value =
    Number(price);


  if (
    Number.isNaN(value)
  ) {

    return "$0.00";
  }


  return `$${value.toFixed(2)}`;
};


const getStatusClass = (status) => {

  return (
    status ||
    "Pending"
  )
    .toLowerCase()
    .replace(/\s+/g, "-");
};


/* ============================================================
   DATE FILTER HELPER
============================================================ */

const getLocalDateValue = (date) => {

  if (!date) {
    return "";
  }


  const parsedDate =
    new Date(date);


  if (
    Number.isNaN(
      parsedDate.getTime()
    )
  ) {

    return "";
  }


  const year =
    parsedDate.getFullYear();


  const month =
    String(
      parsedDate.getMonth() + 1
    ).padStart(2, "0");


  const day =
    String(
      parsedDate.getDate()
    ).padStart(2, "0");


  return `${year}-${month}-${day}`;
};


/* ============================================================
   ORDERS
============================================================ */

function Orders() {

  const [orders, setOrders] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [invoiceDate, setInvoiceDate] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("All");

  const [selectedOrder, setSelectedOrder] =
    useState(null);

  const [modalLoading, setModalLoading] =
    useState(false);

  const [updatingStatus, setUpdatingStatus] =
    useState(false);

  const [deletingOrder, setDeletingOrder] =
    useState(false);

  const [creatingInvoice, setCreatingInvoice] =
    useState(false);


/* ============================================================
   FETCH ALL ORDERS
============================================================ */

  const fetchOrders = async (
    showLoading = true
  ) => {

    try {

      if (showLoading) {
        setLoading(true);
      }

      setError("");


      const response =
        await axios.get(
          `${API_URL}/orders/admin/all`,
          {
            headers:
              getAuthHeaders(),
          }
        );


      const receivedOrders =
        Array.isArray(
          response.data
        )
          ? response.data
          : (
              response.data?.orders ||
              []
            );


      setOrders(
        receivedOrders
      );

    } catch (err) {

      console.error(
        "Fetch orders error:",
        err
      );


      setError(
        err.response?.data?.message ||
        err.message ||
        "Failed to load orders."
      );

    } finally {

      setLoading(false);
      setRefreshing(false);
    }
  };


  useEffect(() => {

    fetchOrders();

  }, []);


/* ============================================================
   GET INVOICE ID
============================================================ */

  const getInvoiceId = (
    order
  ) => {

    if (!order) {
      return null;
    }


    if (
      typeof order.invoice ===
      "string"
    ) {

      return order.invoice;
    }


    if (
      order.invoice &&
      typeof order.invoice ===
        "object"
    ) {

      return (
        order.invoice._id ||
        order.invoice.id ||
        null
      );
    }


    return null;
  };


/* ============================================================
   GET INVOICE NUMBER
============================================================ */

  const getInvoiceNumber = (
    order
  ) => {

    if (!order) {
      return "";
    }


    if (
      order.invoice &&
      typeof order.invoice ===
        "object"
    ) {

      return (
        order.invoice.invoiceNumber ||
        order.invoice.number ||
        ""
      );
    }


    return "";
  };


/* ============================================================
   GET INVOICE DATE
============================================================ */

  const getInvoiceDate = (
    order
  ) => {

    if (!order) {
      return "";
    }


    if (
      order.invoice &&
      typeof order.invoice ===
        "object"
    ) {

      return (
        order.invoice.createdAt ||
        order.invoice.invoiceDate ||
        order.invoice.date ||
        ""
      );
    }


    return "";
  };


/* ============================================================
   FILTER ORDERS
============================================================ */

  const filteredOrders =
    orders.filter(
      (order) => {

        const customer =
          order.user ||
          order.customer ||
          {};


        const customerName =
          getCustomerName(
            customer
          );


        const customerEmail =
          getCustomerEmail(
            customer
          );


        const customerPhone =
          getCustomerPhone(
            customer
          );


        const invoiceNumber =
          getInvoiceNumber(
            order
          );


        const invoiceId =
          getInvoiceId(
            order
          );


        const productNames =
          Array.isArray(
            order.items
          )
            ? order.items
                .map(
                  (item) =>
                    item?.product?.name ||
                    item?.productName ||
                    ""
                )
                .join(" ")
            : "";


        const searchableText =
          [
            customerName,
            customerEmail,
            customerPhone,
            order._id,
            invoiceId,
            invoiceNumber,
            productNames,
            order.status,
          ]
            .join(" ")
            .toLowerCase();


        const searchText =
          search
            .trim()
            .toLowerCase();


        const matchesSearch =
          !searchText ||
          searchableText.includes(
            searchText
          );


        const matchesInvoiceDate =
          !invoiceDate ||
          getLocalDateValue(
            getInvoiceDate(order)
          ) ===
            invoiceDate;


        const matchesStatus =
          statusFilter === "All" ||
          order.status ===
            statusFilter;


        return (
          matchesSearch &&
          matchesInvoiceDate &&
          matchesStatus
        );
      }
    );


/* ============================================================
   REFRESH
============================================================ */

  const handleRefresh = async () => {

    setRefreshing(true);

    await fetchOrders(false);
  };


/* ============================================================
   CLEAR FILTERS
============================================================ */

  const handleClearFilters = () => {

    setSearch("");

    setInvoiceDate("");

    setStatusFilter("All");
  };


/* ============================================================
   OPEN ORDER
============================================================ */

  const handleOpenOrder = async (
    orderId
  ) => {

    try {

      setModalLoading(true);

      setError("");


      const response =
        await axios.get(
          `${API_URL}/orders/admin/${orderId}`,
          {
            headers:
              getAuthHeaders(),
          }
        );


      const order =
        response.data?.order ||
        response.data;


      setSelectedOrder(
        order
      );

    } catch (err) {

      console.error(
        "Open order error:",
        err
      );


      setError(
        err.response?.data?.message ||
        err.message ||
        "Failed to load order details."
      );

    } finally {

      setModalLoading(false);
    }
  };


/* ============================================================
   CLOSE MODAL
============================================================ */

  const handleCloseModal = () => {

    if (
      updatingStatus ||
      deletingOrder ||
      creatingInvoice
    ) {

      return;
    }


    setSelectedOrder(null);
  };


/* ============================================================
   UPDATE ORDER STATUS
============================================================ */

  const handleStatusChange = async (
    orderId,
    newStatus
  ) => {

    if (
      !orderId ||
      !newStatus
    ) {

      return;
    }


    try {

      setUpdatingStatus(true);

      setError("");


      const response =
        await axios.put(
          `${API_URL}/orders/admin/${orderId}/status`,
          {
            status:
              newStatus,
          },
          {
            headers:
              getAuthHeaders(),
          }
        );


      const updatedOrder =
        response.data?.order ||
        response.data;


      setOrders(
        (previousOrders) =>
          previousOrders.map(
            (order) =>
              order._id ===
              orderId
                ? {
                    ...order,
                    status:
                      newStatus,
                }
                : order
          )
      );


      if (
        selectedOrder?._id ===
        orderId
      ) {

        setSelectedOrder(
          (previousOrder) =>
            previousOrder
              ? {
                  ...previousOrder,
                  ...(updatedOrder &&
                  typeof updatedOrder ===
                    "object"
                    ? updatedOrder
                    : {}),
                  status:
                    newStatus,
                }
              : previousOrder
        );
      }

    } catch (err) {

      console.error(
        "Update order status error:",
        err
      );


      setError(
        err.response?.data?.message ||
        err.message ||
        "Failed to update order status."
      );

    } finally {

      setUpdatingStatus(false);
    }
  };


/* ============================================================
   DELETE ORDER
============================================================ */

  const handleDeleteOrder = async (
    orderId
  ) => {

    if (!orderId) {
      return;
    }


    const confirmed =
      window.confirm(
        "Are you sure you want to delete this order?"
      );


    if (!confirmed) {
      return;
    }


    try {

      setDeletingOrder(true);

      setError("");


      await axios.delete(
        `${API_URL}/orders/admin/${orderId}`,
        {
          headers:
            getAuthHeaders(),
        }
      );


      setOrders(
        (previousOrders) =>
          previousOrders.filter(
            (order) =>
              order._id !==
              orderId
          )
      );


      if (
        selectedOrder?._id ===
        orderId
      ) {

        setSelectedOrder(null);
      }

    } catch (err) {

      console.error(
        "Delete order error:",
        err
      );


      setError(
        err.response?.data?.message ||
        err.message ||
        "Failed to delete order."
      );

    } finally {

      setDeletingOrder(false);
    }
  };


/* ============================================================
   CREATE INVOICE
============================================================ */

  const handleCreateInvoice = async (
    orderId
  ) => {

    if (!orderId) {
      return;
    }


    try {

      setCreatingInvoice(true);

      setError("");


      const response =
        await axios.post(
          `${API_URL}/invoices/admin/create/${orderId}`,
          {},
          {
            headers:
              getAuthHeaders(),
          }
        );


      const invoice =
        response.data?.invoice ||
        response.data;


      const invoiceId =
        invoice?._id ||
        invoice?.id;


      if (!invoiceId) {

        throw new Error(
          "Invoice was created but no invoice ID was returned."
        );
      }


      /*
       * IMPORTANT:
       *
       * We do NOT modify the original Order items,
       * quantities, prices or total.
       *
       * The invoice is an independent snapshot.
       */


      setOrders(
        (previousOrders) =>
          previousOrders.map(
            (order) =>
              order._id ===
              orderId
                ? {
                    ...order,
                    invoice:
                      invoice,
                    invoiceStatus:
                      invoice?.status ||
                      "Draft",
                  }
                : order
          )
      );


      setSelectedOrder(
        (previousOrder) =>
          previousOrder &&
          previousOrder._id ===
            orderId
            ? {
                ...previousOrder,
                invoice:
                  invoice,
                invoiceStatus:
                  invoice?.status ||
                  "Draft",
              }
            : previousOrder
      );


      /*
       * Open invoice page.
       */

      window.location.href =
        `/invoices/${invoiceId}`;

    } catch (err) {

      console.error(
        "Create invoice error:",
        err
      );


      setError(
        err.response?.data?.message ||
        err.message ||
        "Failed to create invoice."
      );

    } finally {

      setCreatingInvoice(false);
    }
  };


/* ============================================================
   OPEN EXISTING INVOICE
============================================================ */

  const handleViewInvoice = (
    invoiceId
  ) => {

    if (!invoiceId) {
      return;
    }


    window.location.href =
      `/invoices/${invoiceId}`;
  };


/* ============================================================
   INVOICE BUTTON
============================================================ */

  const renderInvoiceButton = (
    order
  ) => {

    const invoiceId =
      getInvoiceId(order);


    if (invoiceId) {

      return (

        <button
          type="button"
          className="view-invoice-button"
          onClick={() =>
            handleViewInvoice(
              invoiceId
            )
          }
        >
          Invoice
        </button>

      );
    }


    return (

      <button
        type="button"
        className="create-invoice-button"
        disabled={
          creatingInvoice
        }
        onClick={() =>
          handleCreateInvoice(
            order._id
          )
        }
      >

        {creatingInvoice
          ? "Creating..."
          : "Invoice"}

      </button>
    );
  };


/* ============================================================
   LOADING
============================================================ */

  if (loading) {

    return (

      <div className="orders-loading">

        <div className="loading-spinner" />

        <p>
          Loading orders...
        </p>

      </div>

    );
  }


/* ============================================================
   RENDER
============================================================ */

  return (

    <div className="orders-page">


      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="orders-header">

        <div>

          <h1>
            Orders
          </h1>

          <p>
            Manage customer orders
            and invoices
          </p>

        </div>


        <button
          type="button"
          className="refresh-orders-button"
          onClick={
            handleRefresh
          }
          disabled={
            refreshing
          }
        >

          {refreshing
            ? "Refreshing..."
            : "Refresh"}

        </button>

      </div>


      {/* ======================================================
          FILTERS
      ====================================================== */}

      <div className="orders-filters">


        <div className="orders-search">

          <span>
            🔍
          </span>


          <input
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Search customer, invoice number, phone, email or order..."
          />

        </div>


        <input
          type="date"
          className="orders-date-filter"
          value={invoiceDate}
          onChange={(event) =>
            setInvoiceDate(
              event.target.value
            )
          }
          title="Filter by invoice date"
          aria-label="Filter by invoice date"
        />


        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(
              event.target.value
            )
          }
        >

          <option value="All">
            All Statuses
          </option>


          {ORDER_STATUSES.map(
            (status) => (

              <option
                key={status}
                value={status}
              >
                {status}
              </option>

            )
          )}

        </select>


        <button
          type="button"
          className="clear-orders-button"
          onClick={
            handleClearFilters
          }
        >
          Clear
        </button>

      </div>


      {/* ======================================================
          ERROR
      ====================================================== */}

      {error && (

        <div className="orders-error">

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
            Dismiss
          </button>

        </div>

      )}


      {/* ======================================================
          COUNT
      ====================================================== */}

      <div className="orders-count">

        Showing{" "}

        <span>
          {filteredOrders.length}
        </span>

        {" "}of{" "}

        <span>
          {orders.length}
        </span>

        {" "}orders

      </div>


      {/* ======================================================
          TABLE
          NO PRODUCTS COLUMN
      ====================================================== */}

      <div className="orders-table-container">

        <table className="orders-real-table">

          <thead>

            <tr>

              <th>
                Customer
              </th>

              <th>
                Total
              </th>

              <th>
                Status
              </th>

              <th>
                Date
              </th>

              <th>
                Action
              </th>

            </tr>

          </thead>


          <tbody>

            {filteredOrders.length === 0 ? (

              <tr>

                <td
                  colSpan="5"
                  className="orders-empty"
                >

                  <div>

                    <span>
                      📦
                    </span>


                    <h3>
                      No orders found
                    </h3>


                    <p>
                      Try changing your
                      search or filters.
                    </p>

                  </div>

                </td>

              </tr>

            ) : (

              filteredOrders.map(
                (order) => {

                  const customer =
                    order.user ||
                    order.customer ||
                    {};


                  const customerName =
                    getCustomerName(
                      customer
                    );


                  return (

                    <tr
                      key={
                        order._id
                      }
                    >


                      {/* CUSTOMER */}

                      <td>

                        <div className="order-customer">

                          <div className="order-avatar">

                            {getInitials(
                              customer
                            )}

                          </div>


                          <div>

                            <strong>
                              {customerName}
                            </strong>


                            <small>
                              {getCustomerEmail(
                                customer
                              )}
                            </small>

                          </div>

                        </div>

                      </td>


                      {/* TOTAL */}

                      <td>

                        <strong>
                          {formatPrice(
                            order.totalPrice
                          )}
                        </strong>

                      </td>


                      {/* STATUS */}

                      <td>

                        <span
                          className={
                            `order-status ${getStatusClass(
                              order.status
                            )}`
                          }
                        >

                          {order.status ||
                            "Pending"}

                        </span>

                      </td>


                      {/* DATE */}

                      <td>

                        <span className="order-date">

                          {formatDate(
                            order.createdAt
                          )}

                        </span>

                      </td>


                      {/* ACTIONS */}

                      <td>

                        <div className="order-actions">


                          <button
                            type="button"
                            className="view-order-button"
                            onClick={() =>
                              handleOpenOrder(
                                order._id
                              )
                            }
                          >
                            View
                          </button>


                          {renderInvoiceButton(
                            order
                          )}


                          <button
                            type="button"
                            className="delete-order-button"
                            disabled={
                              deletingOrder
                            }
                            onClick={() =>
                              handleDeleteOrder(
                                order._id
                              )
                            }
                          >
                            Delete
                          </button>


                        </div>

                      </td>

                    </tr>

                  );
                }
              )

            )}

          </tbody>

        </table>

      </div>


      {/* ======================================================
          ORDER MODAL
      ====================================================== */}

      {selectedOrder && (

        <div
          className="order-modal-overlay"
          onClick={
            handleCloseModal
          }
        >

          <div
            className="order-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >


            {/* ==================================================
                MODAL HEADER
            ================================================== */}

            <div className="order-modal-header">

              <div>

                <h2>
                  Order Details
                </h2>


                <p>
                  {selectedOrder._id}
                </p>

              </div>


              <button
                type="button"
                className="order-modal-close"
                onClick={
                  handleCloseModal
                }
                disabled={
                  updatingStatus ||
                  deletingOrder ||
                  creatingInvoice
                }
              >
                ✕
              </button>

            </div>


            {/* ==================================================
                CUSTOMER
            ================================================== */}

            <div className="order-detail-section">

              <h3>
                Customer
              </h3>


              <div className="order-detail-customer">

                <div className="order-avatar large">

                  {getInitials(
                    selectedOrder.user ||
                    selectedOrder.customer
                  )}

                </div>


                <div>

                  <strong>

                    {getCustomerName(
                      selectedOrder.user ||
                      selectedOrder.customer
                    )}

                  </strong>


                  <span>

                    {getCustomerEmail(
                      selectedOrder.user ||
                      selectedOrder.customer
                    )}

                  </span>


                  <span>

                    {getCustomerPhone(
                      selectedOrder.user ||
                      selectedOrder.customer
                    )}

                  </span>

                </div>

              </div>

            </div>


            {/* ==================================================
                ORDER DATE
            ================================================== */}

            <div className="order-detail-section">

              <h3>
                Order Date
              </h3>


              <p className="order-detail-date">

                {formatDateTime(
                  selectedOrder.createdAt
                )}

              </p>

            </div>


            {/* ==================================================
                SHIPPING ADDRESS
            ================================================== */}

            <div className="order-detail-section">

              <h3>
                Shipping Address
              </h3>


              <p className="shipping-address">

                {selectedOrder.shippingAddress ||
                  "No shipping address"}

              </p>

            </div>


            {/* ==================================================
                PRODUCTS
                PRODUCTS ONLY INSIDE MODAL
            ================================================== */}

            <div className="order-detail-section">

              <h3>
                Products
              </h3>


              <div className="order-detail-products">

                {modalLoading ? (

                  <p>
                    Loading products...
                  </p>

                ) : selectedOrder.items &&
                  selectedOrder.items.length > 0 ? (

                  selectedOrder.items.map(
                    (item, index) => {

                      const product =
                        item.product &&
                        typeof item.product ===
                          "object"
                          ? item.product
                          : null;


                      const productName =
                        product?.name ||
                        item.productName ||
                        "Product";


                      const quantity =
                        Number(
                          item.quantity
                        ) || 0;


                      const price =
                        Number(
                          item.price
                        ) || 0;


                      const lineTotal =
                        price *
                        quantity;


                      return (

                        <div
                          className="order-detail-product"
                          key={
                            item._id ||
                            product?._id ||
                            index
                          }
                        >

                          <div>

                            <strong>
                              {productName}
                            </strong>


                            <span>

                              Qty:{" "}
                              {quantity}

                              {" × "}

                              {formatPrice(
                                price
                              )}

                            </span>

                          </div>


                          <strong>

                            {formatPrice(
                              lineTotal
                            )}

                          </strong>

                        </div>

                      );
                    }
                  )

                ) : (

                  <p>
                    No products found.
                  </p>

                )}

              </div>

            </div>


            {/* ==================================================
                TOTAL
            ================================================== */}

            <div className="order-total-row">

              <span>
                Order Total
              </span>


              <strong>
                {formatPrice(
                  selectedOrder.totalPrice
                )}
              </strong>

            </div>


            {/* ==================================================
                STATUS
            ================================================== */}

            <div className="order-detail-section">

              <h3>
                Order Status
              </h3>


              <div className="status-buttons">

                {ORDER_STATUSES.map(
                  (status) => (

                    <button
                      key={status}
                      type="button"
                      className={
                        `status-change-button ${getStatusClass(
                          status
                        )} ${
                          selectedOrder.status ===
                          status
                            ? "active"
                            : ""
                        }`
                      }
                      disabled={
                        updatingStatus ||
                        selectedOrder.status ===
                          status
                      }
                      onClick={() =>
                        handleStatusChange(
                          selectedOrder._id,
                          status
                        )
                      }
                    >

                      {status}

                    </button>

                  )
                )}

              </div>

            </div>


            {/* ==================================================
                INVOICE
            ================================================== */}

            <div className="order-detail-section">

              <h3>
                Invoice
              </h3>


              {getInvoiceId(
                selectedOrder
              ) ? (

                <button
                  type="button"
                  className="view-invoice-button"
                  onClick={() =>
                    handleViewInvoice(
                      getInvoiceId(
                        selectedOrder
                      )
                    )
                  }
                >
                  Open Invoice
                </button>

              ) : (

                <button
                  type="button"
                  className="create-invoice-button"
                  disabled={
                    creatingInvoice
                  }
                  onClick={() =>
                    handleCreateInvoice(
                      selectedOrder._id
                    )
                  }
                >

                  {creatingInvoice
                    ? "Creating Invoice..."
                    : "Create Invoice"}

                </button>

              )}

            </div>


            {/* ==================================================
                MODAL FOOTER
            ================================================== */}

            <div className="order-modal-footer">


              <button
                type="button"
                className="delete-order-button"
                disabled={
                  deletingOrder ||
                  updatingStatus ||
                  creatingInvoice
                }
                onClick={() =>
                  handleDeleteOrder(
                    selectedOrder._id
                  )
                }
              >

                {deletingOrder
                  ? "Deleting..."
                  : "Delete Order"}

              </button>


              <button
                type="button"
                className="close-order-button"
                disabled={
                  updatingStatus ||
                  deletingOrder ||
                  creatingInvoice
                }
                onClick={
                  handleCloseModal
                }
              >
                Close
              </button>


            </div>

          </div>

        </div>

      )}

    </div>
  );
}


export default Orders;