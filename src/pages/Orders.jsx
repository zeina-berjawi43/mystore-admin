import { useEffect, useState } from "react";
import axios from "axios";

const API_URL = "https://mystore-backend-u6ey.onrender.com";

const STATUSES = [
  "Pending",
  "Confirmed",
  "Preparing",
  "Shipped",
  "Delivered",
  "Cancelled",
];

function Orders() {

  const [orders, setOrders] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");

  const [selectedOrder, setSelectedOrder] = useState(null);

  const [updatingStatus, setUpdatingStatus] =
    useState(false);

  const [deletingOrder, setDeletingOrder] =
    useState(false);


  const getToken = () => {
    return localStorage.getItem("accessToken");
  };


  // ============================================================
  // GET ALL ORDERS
  // ============================================================

  const fetchOrders = async () => {

    try {

      setLoading(true);
      setError("");

      const token = getToken();

      const response = await axios.get(
        `${API_URL}/orders/admin/all`,
        {
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      console.log(
        "ORDERS RESPONSE:",
        response.data
      );

      setOrders(
        response.data.orders || []
      );

    } catch (error) {

      console.log(
        "ORDERS ERROR:",
        error
      );

      if (
        error.response?.status === 401 ||
        error.response?.status === 403
      ) {

        localStorage.clear();

        window.location.href =
          "/login";

        return;
      }

      setError(
        error.response?.data?.message ||
          "Cannot load orders"
      );

    } finally {

      setLoading(false);

    }
  };


  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {

    fetchOrders();

  }, []);


  // ============================================================
  // FILTER ORDERS
  // SEARCH CUSTOMER + PRODUCT
  // ============================================================

  const filteredOrders =
    orders.filter((order) => {

      const searchText =
        search
          .trim()
          .toLowerCase();


      // ========================================================
      // CUSTOMER
      // ========================================================

      const customerName =
        order.user?.name
          ?.toLowerCase() || "";

      const customerEmail =
        order.user?.email
          ?.toLowerCase() || "";

      const customerPhone =
        order.user?.phone
          ?.toLowerCase() || "";


      // ========================================================
      // PRODUCT
      // ========================================================

      const productMatch =
        (order.items || []).some(
          (item) => {

            const productName =
              item.product?.name
                ?.toLowerCase() || "";

            return productName.includes(
              searchText
            );

          }
        );


      // ========================================================
      // CUSTOMER MATCH
      // ========================================================

      const customerMatch =
        customerName.includes(
          searchText
        ) ||
        customerEmail.includes(
          searchText
        ) ||
        customerPhone.includes(
          searchText
        );


      // ========================================================
      // SEARCH MATCH
      // ========================================================

      const matchesSearch =
        !searchText ||
        customerMatch ||
        productMatch;


      // ========================================================
      // STATUS MATCH
      // ========================================================

      const matchesStatus =
        !statusFilter ||
        order.status ===
          statusFilter;


      return (
        matchesSearch &&
        matchesStatus
      );

    });


  // ============================================================
  // UPDATE STATUS
  // ============================================================

  const updateOrderStatus = async (
    orderId,
    newStatus
  ) => {

    try {

      setUpdatingStatus(true);

      const token = getToken();

      const response =
        await axios.put(
          `${API_URL}/orders/admin/${orderId}/status`,
          {
            status: newStatus,
          },
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );


      console.log(
        "STATUS UPDATE RESPONSE:",
        response.data
      );


      // ========================================================
      // UPDATE SELECTED ORDER
      // ========================================================

      setSelectedOrder(
        response.data.order
      );


      // ========================================================
      // UPDATE ORDER INSIDE TABLE
      // ========================================================

      setOrders(
        (previousOrders) =>
          previousOrders.map(
            (order) =>
              order._id === orderId
                ? response.data.order
                : order
          )
      );


      alert(
        "Order status updated successfully."
      );

    } catch (error) {

      console.log(
        "UPDATE STATUS ERROR:",
        error
      );


      alert(
        error.response?.data?.message ||
          "Error updating order status"
      );

    } finally {

      setUpdatingStatus(false);

    }
  };


  // ============================================================
  // DELETE ORDER
  // ============================================================

  const deleteOrder = async (
    orderId
  ) => {

    const confirmed =
      window.confirm(
        "Are you sure you want to delete this order? This action cannot be undone."
      );


    if (!confirmed) {
      return;
    }


    try {

      setDeletingOrder(true);

      const token = getToken();


      await axios.delete(
        `${API_URL}/orders/admin/${orderId}`,
        {
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );


      // ========================================================
      // REMOVE ORDER FROM TABLE
      // ========================================================

      setOrders(
        (previousOrders) =>
          previousOrders.filter(
            (order) =>
              order._id !== orderId
          )
      );


      // ========================================================
      // CLOSE MODAL
      // ========================================================

      if (
        selectedOrder?._id === orderId
      ) {

        setSelectedOrder(null);

      }


      alert(
        "Order deleted successfully."
      );


    } catch (error) {

      console.log(
        "DELETE ORDER ERROR:",
        error
      );


      if (
        error.response?.status === 401 ||
        error.response?.status === 403
      ) {

        localStorage.clear();

        window.location.href =
          "/login";

        return;

      }


      alert(
        error.response?.data?.message ||
          "Error deleting order"
      );


    } finally {

      setDeletingOrder(false);

    }
  };


  // ============================================================
  // OPEN ORDER
  // ============================================================

  const openOrder = async (
    orderId
  ) => {

    try {

      const token = getToken();

      const response =
        await axios.get(
          `${API_URL}/orders/admin/${orderId}`,
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );


      setSelectedOrder(
        response.data.order
      );

    } catch (error) {

      console.log(
        "GET ORDER ERROR:",
        error
      );


      alert(
        error.response?.data?.message ||
          "Cannot load order"
      );

    }
  };


  // ============================================================
  // CLOSE ORDER
  // ============================================================

  const closeOrder = () => {

    if (
      updatingStatus ||
      deletingOrder
    ) {
      return;
    }

    setSelectedOrder(null);

  };


  // ============================================================
  // CLEAR FILTERS
  // ============================================================

  const clearFilters = () => {

    setStatusFilter("");
    setSearch("");

  };


  // ============================================================
  // STATUS CLASS
  // ============================================================

  const getStatusClass = (
    status
  ) => {

    return `order-status ${
      String(status || "")
        .toLowerCase()
    }`;

  };


  // ============================================================
  // LOADING
  // ============================================================

  if (
    loading &&
    orders.length === 0
  ) {

    return (

      <div className="orders-page">

        <div className="orders-loading">

          <div className="loading-spinner"></div>

          <p>
            Loading orders...
          </p>

        </div>

      </div>

    );

  }


  // ============================================================
  // PAGE
  // ============================================================

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
            View and manage customer orders.
          </p>

        </div>


        <button
          type="button"
          className="refresh-orders-button"
          onClick={fetchOrders}
        >
          ↻ Refresh
        </button>

      </div>


      {/* ======================================================
          FILTERS
      ====================================================== */}

      <div className="orders-filters">

        {/* SEARCH */}

        <div className="orders-search">

          <span>
            🔍
          </span>

          <input
            type="text"
            placeholder="Search by customer or product..."
            value={search}
            onChange={(event) => {

              setSearch(
                event.target.value
              );

            }}
          />

        </div>


        {/* STATUS */}

        <select
          value={statusFilter}
          onChange={(event) => {

            setStatusFilter(
              event.target.value
            );

          }}
        >

          <option value="">
            All Statuses
          </option>

          {STATUSES.map(
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


        {/* CLEAR */}

        {(search ||
          statusFilter) && (

          <button
            type="button"
            className="clear-orders-button"
            onClick={clearFilters}
          >
            Clear
          </button>

        )}

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
            onClick={fetchOrders}
          >
            Try Again
          </button>

        </div>

      )}


      {/* ======================================================
          COUNT
      ====================================================== */}

      <div className="orders-count">

        <span>

          {filteredOrders.length} order
          {filteredOrders.length !== 1
            ? "s"
            : ""}

        </span>

      </div>


      {/* ======================================================
          ORDERS TABLE
      ====================================================== */}

      <div className="orders-table-container">

        <table className="orders-real-table">

          <thead>

            <tr>

              <th>
                Customer
              </th>

              <th>
                Products
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
                  colSpan="6"
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
                      There are no orders
                      matching your filters.
                    </p>

                  </div>

                </td>

              </tr>

            ) : (

              filteredOrders.map(
                (order) => (

                  <tr
                    key={order._id}
                  >

                    {/* CUSTOMER */}

                    <td>

                      <div className="order-customer">

                        <div className="order-avatar">

                          {order.user?.name
                            ?.charAt(0)
                            ?.toUpperCase() ||
                            "U"}

                        </div>

                        <div>

                          <strong>
                            {order.user?.name ||
                              "Unknown User"}
                          </strong>

                          <small>
                            {order.user?.email ||
                              ""}
                          </small>

                        </div>

                      </div>

                    </td>


                    {/* PRODUCTS */}

                    <td>

                      <div className="order-product-list">

                        {(order.items || []).map(
                          (item, index) => (

                            <div
                              key={
                                item._id ||
                                index
                              }
                              className="order-product-item"
                            >

                              <span>
                                {item.product?.name ||
                                  "Product"}
                              </span>

                              <small>
                                × {item.quantity}
                              </small>

                            </div>

                          )
                        )}

                      </div>

                    </td>


                    {/* TOTAL */}

                    <td>

                      <strong>

                        $
                        {Number(
                          order.totalPrice ||
                            0
                        ).toFixed(2)}

                      </strong>

                    </td>


                    {/* STATUS */}

                    <td>

                      <span
                        className={getStatusClass(
                          order.status
                        )}
                      >
                        {order.status}
                      </span>

                    </td>


                    {/* DATE */}

                    <td>

                      <span className="order-date">

                        {order.createdAt
                          ? new Date(
                              order.createdAt
                            ).toLocaleDateString()
                          : "-"}

                      </span>

                    </td>


                    {/* ACTION */}

                    <td>

                      <div className="order-actions">

                        <button
                          type="button"
                          className="view-order-button"
                          onClick={() =>
                            openOrder(
                              order._id
                            )
                          }
                        >
                          View
                        </button>


                        <button
                          type="button"
                          className="delete-order-button"
                          onClick={() =>
                            deleteOrder(
                              order._id
                            )
                          }
                          disabled={
                            deletingOrder
                          }
                        >
                          Delete
                        </button>

                      </div>

                    </td>

                  </tr>

                )
              )

            )}

          </tbody>

        </table>

      </div>


      {/* ======================================================
          ORDER DETAILS MODAL
      ====================================================== */}

      {selectedOrder && (

        <div
          className="order-modal-overlay"
          onMouseDown={(event) => {

            if (
              event.target ===
              event.currentTarget
            ) {

              closeOrder();

            }

          }}
        >

          <div className="order-modal">


            {/* HEADER */}

            <div className="order-modal-header">

              <div>

                <h2>
                  Order Details
                </h2>

                <p>
                  Order #
                  {selectedOrder._id}
                </p>

              </div>


              <button
                type="button"
                className="order-modal-close"
                onClick={closeOrder}
                disabled={
                  deletingOrder
                }
              >
                ✕
              </button>

            </div>


            {/* CUSTOMER */}

            <div className="order-detail-section">

              <h3>
                Customer
              </h3>

              <div className="order-detail-customer">

                <div className="order-avatar large">

                  {selectedOrder.user?.name
                    ?.charAt(0)
                    ?.toUpperCase() ||
                    "U"}

                </div>

                <div>

                  <strong>
                    {selectedOrder.user?.name ||
                      "Unknown User"}
                  </strong>

                  <span>
                    {selectedOrder.user?.email ||
                      ""}
                  </span>

                  {selectedOrder.user?.phone && (

                    <span>
                      {selectedOrder.user.phone}
                    </span>

                  )}

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

                {selectedOrder.createdAt
                  ? new Date(
                      selectedOrder.createdAt
                    ).toLocaleString()
                  : "-"}

              </p>

            </div>


            {/* SHIPPING */}

            <div className="order-detail-section">

              <h3>
                Shipping Address
              </h3>

              <p className="shipping-address">

                {selectedOrder.shippingAddress ||
                  "No address"}

              </p>

            </div>


            {/* PRODUCTS */}

            <div className="order-detail-section">

              <h3>
                Products
              </h3>

              <div className="order-detail-products">

                {(selectedOrder.items || []).map(
                  (item, index) => (

                    <div
                      className="order-detail-product"
                      key={
                        item._id ||
                        index
                      }
                    >

                      <div>

                        <strong>
                          {item.product?.name ||
                            "Product"}
                        </strong>

                        <span>
                          Quantity:{" "}
                          {item.quantity}
                        </span>

                      </div>


                      <strong>

                        $
                        {Number(
                          item.price ||
                            0
                        ).toFixed(2)}

                      </strong>

                    </div>

                  )
                )}

              </div>

            </div>


            {/* TOTAL */}

            <div className="order-total-row">

              <span>
                Total
              </span>

              <strong>

                $
                {Number(
                  selectedOrder.totalPrice ||
                    0
                ).toFixed(2)}

              </strong>

            </div>


            {/* STATUS */}

            <div className="order-detail-section">

              <h3>
                Update Status
              </h3>

              <div className="status-buttons">

                {STATUSES.map(
                  (status) => (

                    <button
                      type="button"
                      key={status}
                      disabled={
                        updatingStatus ||
                        deletingOrder
                      }
                      className={
                        selectedOrder.status ===
                        status
                          ? `status-change-button active ${status.toLowerCase()}`
                          : `status-change-button ${status.toLowerCase()}`
                      }
                      onClick={() =>
                        updateOrderStatus(
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


            {/* FOOTER */}

            <div className="order-modal-footer">

              <button
                type="button"
                className="delete-order-button"
                onClick={() =>
                  deleteOrder(
                    selectedOrder._id
                  )
                }
                disabled={
                  updatingStatus ||
                  deletingOrder
                }
              >

                {deletingOrder
                  ? "Deleting..."
                  : "Delete Order"}

              </button>


              <button
                type="button"
                className="close-order-button"
                onClick={closeOrder}
                disabled={
                  updatingStatus ||
                  deletingOrder
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
