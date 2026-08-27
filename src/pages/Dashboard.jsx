import { useEffect, useState } from "react";
import axios from "axios";

const API_URL = "https://mystore-backend-u6ey.onrender.com";

function Dashboard() {
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
              Latest orders from customers
            </p>
          </div>

        </div>


        {recentOrders.length === 0 ? (

          <div className="empty-box">
            No orders found.
          </div>

        ) : (

          <div className="orders-table">

            {/* TABLE HEADER */}

            <div className="orders-table-header">

              <span>
                Customer
              </span>

              <span>
                Products
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
              (order, index) => (

                <div
                  className="orders-table-row"
                  key={
                    order._id || index
                  }
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


                  {/* PRODUCTS */}

                  <div className="order-products">

                    {(order.items || []).map(
                      (item, itemIndex) => (

                        <div
                          key={
                            item._id ||
                            itemIndex
                          }
                        >

                          {item.product?.name ||
                            item.productName ||
                            "Product"}

                          {" × "}

                          {item.quantity || 0}

                        </div>

                      )
                    )}

                  </div>


                  {/* TOTAL */}

                  <strong>
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

              )
            )}

          </div>

        )}

      </section>

    </div>
  );
}

export default Dashboard;
