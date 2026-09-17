import { useEffect, useState } from "react";
import axios from "axios";

const API_URL = "https://mystore-backend-u6ey.onrender.com";

function Dashboard() {
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  // ============================================================
  // FETCH DASHBOARD DATA
  // ============================================================

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("accessToken");

      const response = await axios.get(
        `${API_URL}/dashboard/statistics`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("DASHBOARD RESPONSE:", response.data);

      setStatistics(response.data.statistics);
      setSelectedOrderId(null);
    } catch (error) {
      console.log("DASHBOARD ERROR:", error);

      if (
        error.response?.status === 401 ||
        error.response?.status === 403
      ) {
        localStorage.clear();
        window.location.href = "/login";
        return;
      }

      setError(
        error.response?.data?.message ||
          "Cannot load dashboard"
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // LOAD DATA
  // ============================================================

  useEffect(() => {
    fetchDashboard();
  }, []);

  // ============================================================
  // TOGGLE ORDER DETAILS
  // ============================================================

  const toggleOrderDetails = (orderId) => {
    setSelectedOrderId((currentId) =>
      currentId === orderId ? null : orderId
    );
  };

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>

        <p>Loading dashboard...</p>
      </div>
    );
  }

  // ============================================================
  // ERROR
  // ============================================================

  if (error) {
    return (
      <div className="dashboard-error">
        <h2>Something went wrong</h2>

        <p>{error}</p>

        <button onClick={fetchDashboard}>
          Try Again
        </button>
      </div>
    );
  }

  // ============================================================
  // NO DATA
  // ============================================================

  if (!statistics) {
    return null;
  }

  // ============================================================
  // STATISTICS
  // ============================================================

  const {
    totalSales = 0,
    totalOrders = 0,
    totalUsers = 0,
    totalProducts = 0,
    ordersByStatus = {},
    topSellingProducts = [],
    recentOrders = [],
  } = statistics;

  // ============================================================
  // RETURN
  // ============================================================

  return (
    <div className="dashboard-page">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="dashboard-header">

        <div>
          <h1>
            Admin Dashboard
          </h1>

          <p>
            Overview of your store
          </p>
        </div>

        <button
          type="button"
          className="refresh-button"
          onClick={fetchDashboard}
        >
          ↻ Refresh
        </button>

      </div>


      {/* ======================================================
          MAIN STATISTICS
      ====================================================== */}

      <div className="stats-grid">

        {/* TOTAL SALES */}

        <div className="stat-card">

          <div className="stat-icon">
            💰
          </div>

          <div>
            <p>Total Sales</p>

            <h2>
              ${Number(totalSales).toFixed(2)}
            </h2>
          </div>

        </div>


        {/* TOTAL ORDERS */}

        <div className="stat-card">

          <div className="stat-icon">
            📦
          </div>

          <div>
            <p>Total Orders</p>

            <h2>
              {totalOrders}
            </h2>
          </div>

        </div>


        {/* TOTAL USERS */}

        <div className="stat-card">

          <div className="stat-icon">
            👥
          </div>

          <div>
            <p>Total Users</p>

            <h2>
              {totalUsers}
            </h2>
          </div>

        </div>


        {/* TOTAL PRODUCTS */}

        <div className="stat-card">

          <div className="stat-icon">
            🛍️
          </div>

          <div>
            <p>Total Products</p>

            <h2>
              {totalProducts}
            </h2>
          </div>

        </div>

      </div>


      {/* ======================================================
          ORDERS BY STATUS
      ====================================================== */}

      <section className="dashboard-section">

        <div className="section-header">

          <div>
            <h2>
              Orders by Status
            </h2>

            <p>
              Current order distribution
            </p>
          </div>

        </div>


        <div className="status-grid">

          <div className="status-card pending">
            <span>Pending</span>

            <strong>
              {ordersByStatus.pending || 0}
            </strong>
          </div>


          <div className="status-card confirmed">
            <span>Confirmed</span>

            <strong>
              {ordersByStatus.confirmed || 0}
            </strong>
          </div>


          <div className="status-card preparing">
            <span>Preparing</span>

            <strong>
              {ordersByStatus.preparing || 0}
            </strong>
          </div>


          <div className="status-card shipped">
            <span>Shipped</span>

            <strong>
              {ordersByStatus.shipped || 0}
            </strong>
          </div>


          <div className="status-card delivered">
            <span>Delivered</span>

            <strong>
              {ordersByStatus.delivered || 0}
            </strong>
          </div>


          <div className="status-card cancelled">
            <span>Cancelled</span>

            <strong>
              {ordersByStatus.cancelled || 0}
            </strong>
          </div>

        </div>

      </section>


      {/* ======================================================
          TOP SELLING PRODUCTS
      ====================================================== */}

      <section className="dashboard-section">

        <div className="section-header">

          <div>
            <h2>
              🔥 Top Selling Products
            </h2>

            <p>
              Best performing products
            </p>
          </div>

        </div>


        {topSellingProducts.length === 0 ? (

          <div className="empty-box">
            No sales yet.
          </div>

        ) : (

          <div className="products-table">

            {/* TABLE HEADER */}

            <div className="table-header">

              <span>
                Product
              </span>

              <span>
                Price
              </span>

              <span>
                Sold
              </span>

              <span>
                Revenue
              </span>

            </div>


            {/* TABLE ROWS */}

            {topSellingProducts.map(
              (product, index) => (

                <div
                  className="table-row"
                  key={
                    product.productId ||
                    product._id ||
                    index
                  }
                >

                  {/* PRODUCT */}

                  <div className="product-info">

                    <span className="rank">
                      #{index + 1}
                    </span>

                    <div className="product-image-placeholder">
                      🛍️
                    </div>

                    <div>

                      <strong>
                        {product.name}
                      </strong>

                      <small>
                        {product.category || ""}
                      </small>

                    </div>

                  </div>


                  {/* PRICE */}

                  <span>
                    $
                    {Number(
                      product.price || 0
                    ).toFixed(2)}
                  </span>


                  {/* SOLD */}

                  <span>
                    {product.totalQuantitySold || 0}
                  </span>


                  {/* REVENUE */}

                  <strong>
                    $
                    {Number(
                      product.totalRevenue || 0
                    ).toFixed(2)}
                  </strong>

                </div>

              )
            )}

          </div>

        )}

      </section>


      {/* ======================================================
          RECENT ORDERS
      ====================================================== */}

      <section className="dashboard-section">

        <div className="section-header">

          <div>
            <h2>
              🕐 Recent Orders
            </h2>

            <p>
              Select an order to view its products and details
            </p>
          </div>

        </div>


        {recentOrders.length === 0 ? (

          <div className="empty-box">
            No orders found.
          </div>

        ) : (

          <div className="recent-orders-container">

            {/* ==================================================
                COMPACT ORDER LIST
            ================================================== */}

            <div className="orders-table">

              {/* TABLE HEADER */}

              <div className="orders-table-header">

                <span>
                  Customer
                </span>

                <span>
                  Order
                </span>

                <span>
                  Total
                </span>

                <span>
                  Status
                </span>

                <span>
                  Date
                </span>

              </div>


              {/* ORDERS */}

              {recentOrders.map(
                (order, index) => {

                  const orderId =
                    order._id || `order-${index}`;

                  const isSelected =
                    selectedOrderId === orderId;

                  return (
                    <div
                      className={`orders-table-row ${
                        isSelected
                          ? "selected"
                          : ""
                      }`}
                      key={orderId}
                      onClick={() =>
                        toggleOrderDetails(orderId)
                      }
                      role="button"
                      tabIndex={0}
                      onKeyDown={(event) => {
                        if (
                          event.key === "Enter" ||
                          event.key === " "
                        ) {
                          event.preventDefault();
                          toggleOrderDetails(orderId);
                        }
                      }}
                    >

                      {/* CUSTOMER */}

                      <div className="customer-info">

                        <div className="customer-avatar">

                          {order.user?.name
                            ?.charAt(0)
                            ?.toUpperCase() || "U"}

                        </div>

                        <div>

                          <strong>
                            {order.user?.name ||
                              "Unknown User"}
                          </strong>

                          <small>
                            {order.user?.email || ""}
                          </small>

                        </div>

                      </div>


                      {/* ORDER */}

                      <div className="order-number">

                        <strong>
                          #
                          {String(
                            order._id || index + 1
                          ).slice(-8)}
                        </strong>

                        <small>
                          {Array.isArray(order.items)
                            ? `${order.items.length} ${
                                order.items.length === 1
                                  ? "item"
                                  : "items"
                              }`
                            : "0 items"}
                        </small>

                      </div>


                      {/* TOTAL */}

                      <strong className="order-total">

                        $
                        {Number(
                          order.totalPrice || 0
                        ).toFixed(2)}

                      </strong>


                      {/* STATUS */}

                      <span
                        className={`order-status ${
                          String(
                            order.status || ""
                          ).toLowerCase()
                        }`}
                      >
                        {order.status || "Unknown"}
                      </span>


                      {/* DATE */}

                      <span className="order-date">

                        {order.createdAt
                          ? new Date(
                              order.createdAt
                            ).toLocaleDateString()
                          : "-"}

                      </span>

                    </div>
                  );
                }
              )}

            </div>


            {/* ==================================================
                SELECTED ORDER DETAILS
            ================================================== */}

            {selectedOrderId && (
              <div className="selected-order-details">

                {(() => {
                  const selectedOrder =
                    recentOrders.find(
                      (order, index) =>
                        (order._id ||
                          `order-${index}`) ===
                        selectedOrderId
                    );

                  if (!selectedOrder) {
                    return null;
                  }

                  return (
                    <>
                      {/* DETAILS HEADER */}

                      <div className="selected-order-header">

                        <div>
                          <h3>
                            Order Details
                          </h3>

                          <p>
                            Order #
                            {String(
                              selectedOrder._id || ""
                            ).slice(-8)}
                          </p>
                        </div>

                        <button
                          type="button"
                          className="close-order-details"
                          onClick={(event) => {
                            event.stopPropagation();
                            setSelectedOrderId(null);
                          }}
                        >
                          Hide Details
                        </button>

                      </div>


                      {/* CUSTOMER DETAILS */}

                      <div className="selected-order-customer">

                        <div className="customer-avatar large">

                          {selectedOrder.user?.name
                            ?.charAt(0)
                            ?.toUpperCase() || "U"}

                        </div>

                        <div>

                          <strong>
                            {selectedOrder.user?.name ||
                              "Unknown User"}
                          </strong>

                          {selectedOrder.user?.email && (
                            <small>
                              {selectedOrder.user.email}
                            </small>
                          )}

                          {selectedOrder.user?.phone && (
                            <small>
                              {selectedOrder.user.phone}
                            </small>
                          )}

                        </div>

                      </div>


                      {/* ORDER SUMMARY */}

                      <div className="selected-order-summary">

                        <div>
                          <span>
                            Status
                          </span>

                          <strong
                            className={`order-status ${
                              String(
                                selectedOrder.status || ""
                              ).toLowerCase()
                            }`}
                          >
                            {selectedOrder.status ||
                              "Unknown"}
                          </strong>
                        </div>

                        <div>
                          <span>
                            Date
                          </span>

                          <strong>
                            {selectedOrder.createdAt
                              ? new Date(
                                  selectedOrder.createdAt
                                ).toLocaleDateString()
                              : "-"}
                          </strong>
                        </div>

                        <div>
                          <span>
                            Total
                          </span>

                          <strong>
                            $
                            {Number(
                              selectedOrder.totalPrice || 0
                            ).toFixed(2)}
                          </strong>
                        </div>

                      </div>


                      {/* PRODUCTS */}

                      <div className="selected-order-products">

                        <div className="selected-products-title">
                          <h4>
                            Products
                          </h4>

                          <span>
                            {Array.isArray(
                              selectedOrder.items
                            )
                              ? selectedOrder.items.length
                              : 0}{" "}
                            {Array.isArray(
                              selectedOrder.items
                            ) &&
                            selectedOrder.items.length === 1
                              ? "item"
                              : "items"}
                          </span>
                        </div>


                        {!selectedOrder.items ||
                        selectedOrder.items.length === 0 ? (

                          <div className="empty-order-products">
                            No products found for this order.
                          </div>

                        ) : (

                          <div className="order-products-list">

                            {selectedOrder.items.map(
                              (item, itemIndex) => {

                                const productName =
                                  item.product?.name ||
                                  item.productName ||
                                  "Product";

                                const quantity =
                                  Number(
                                    item.quantity || 0
                                  );

                                const price =
                                  Number(
                                    item.price ||
                                      item.product?.price ||
                                      0
                                  );

                                const itemTotal =
                                  price * quantity;

                                return (
                                  <div
                                    className="order-product-row"
                                    key={
                                      item._id ||
                                      item.product?._id ||
                                      itemIndex
                                    }
                                  >

                                    <div className="order-product-info">

                                      <div className="order-product-image">
                                        🛍️
                                      </div>

                                      <div>
                                        <strong>
                                          {productName}
                                        </strong>

                                        <small>
                                          ${price.toFixed(2)} ×{" "}
                                          {quantity}
                                        </small>
                                      </div>

                                    </div>

                                    <strong>
                                      $
                                      {itemTotal.toFixed(2)}
                                    </strong>

                                  </div>
                                );
                              }
                            )}

                          </div>

                        )}

                      </div>

                    </>
                  );
                })()}

              </div>
            )}

          </div>

        )}

      </section>

    </div>
  );
}

export default Dashboard;