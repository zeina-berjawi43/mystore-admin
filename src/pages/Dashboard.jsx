
import React, {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import AdminMenu from './admin-menu';

const API_URL =
  'https://mystore-backend-u6ey.onrender.com';

// ============================================================
// DASHBOARD
// ============================================================

export default function DashboardScreen() {
  const router = useRouter();

  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  // ============================================================
  // FETCH DASHBOARD
  // ============================================================

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      setSelectedOrderId(null);

      const token =
        await AsyncStorage.getItem('accessToken');

      if (!token) {
        router.replace('/login');
        return;
      }

      const response = await axios.get(
        `${API_URL}/dashboard/statistics`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log(
        'DASHBOARD RESPONSE:',
        response.data
      );

      setStatistics(
        response.data?.statistics || null
      );
    } catch (err) {
      console.log(
        'DASHBOARD ERROR:',
        err
      );

      if (
        err?.response?.status === 401 ||
        err?.response?.status === 403
      ) {
        await AsyncStorage.multiRemove([
          'accessToken',
          'refreshToken',
          'user',
          'isLoggedIn',
        ]);

        router.replace('/login');
        return;
      }

      setError(
        err?.response?.data?.message ||
          'Cannot load dashboard'
      );
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // ============================================================
  // CUSTOMER HELPERS
  // ============================================================

  const getCustomer = (order) => {
    return order?.user || order?.customer || {};
  };

  const getCustomerName = (order) => {
    const customer = getCustomer(order);

    if (
      typeof customer.name === 'string' &&
      customer.name.trim()
    ) {
      return customer.name.trim();
    }

    if (
      typeof order?.customerName === 'string' &&
      order.customerName.trim()
    ) {
      return order.customerName.trim();
    }

    const firstName =
      customer.firstName || '';

    const lastName =
      customer.lastName || '';

    const fullName =
      `${firstName} ${lastName}`.trim();

    if (fullName) {
      return fullName;
    }

    if (customer.phone) {
      return customer.phone;
    }

    return 'Unknown User';
  };

  const getCustomerEmail = (order) => {
    const customer = getCustomer(order);

    return (
      customer.email ||
      ''
    );
  };

  const getCustomerPhone = (order) => {
    const customer = getCustomer(order);

    return (
      customer.phone ||
      ''
    );
  };

  // ============================================================
  // ORDER HELPERS
  // ============================================================

  const getOrderTotal = (order) => {
    return Number(
      order?.totalPrice ??
      order?.totalAmount ??
      order?.total ??
      0
    );
  };

  const getOrderNumber = (order, index) => {
    if (order?.orderNumber) {
      return order.orderNumber;
    }

    if (order?.orderId) {
      return order.orderId;
    }

    if (order?._id) {
      return String(order._id).slice(-8);
    }

    return String(index + 1);
  };

  const getOrderId = (order, index) => {
    return (
      order?._id ||
      order?.orderId ||
      `order-${index}`
    );
  };

  const getItemCount = (order) => {
    return Array.isArray(order?.items)
      ? order.items.length
      : 0;
  };

  // ============================================================
  // TOGGLE ORDER DETAILS
  // SAME BEHAVIOR AS WEB ADMIN
  // ============================================================

  const toggleOrderDetails = (orderId) => {
    setSelectedOrderId((currentId) =>
      currentId === orderId
        ? null
        : orderId
    );
  };

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <SafeAreaView style={styles.page}>
        <View style={styles.centerContainer}>
          <ActivityIndicator
            size="large"
            color="#E35B3F"
          />

          <ThemedText
            style={styles.loadingText}
          >
            Loading dashboard...
          </ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  // ============================================================
  // ERROR
  // ============================================================

  if (error) {
    return (
      <SafeAreaView style={styles.page}>
        <View style={styles.centerContainer}>
          <View style={styles.errorBox}>
            <ThemedText
              style={styles.errorTitle}
            >
              Something went wrong
            </ThemedText>

            <ThemedText
              style={styles.errorMessage}
            >
              {error}
            </ThemedText>
          </View>

          <Pressable
            style={styles.tryAgainButton}
            onPress={fetchDashboard}
          >
            <ThemedText
              style={styles.tryAgainText}
            >
              Try Again
            </ThemedText>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // ============================================================
  // NO DATA
  // ============================================================

  if (!statistics) {
    return (
      <SafeAreaView style={styles.page}>
        <View style={styles.centerContainer}>
          <ThemedText>
            No dashboard data available.
          </ThemedText>
        </View>
      </SafeAreaView>
    );
  }

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
  // SELECTED ORDER
  // ============================================================

  const selectedOrder =
    selectedOrderId
      ? recentOrders.find(
          (order, index) =>
            getOrderId(order, index) ===
            selectedOrderId
        )
      : null;

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <SafeAreaView style={styles.page}>
      <View style={styles.mainContainer}>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >

          {/* ==================================================
              HEADER
          ================================================== */}

          <View style={styles.header}>

            <Pressable
              style={({ pressed }) => [
                styles.menuButton,
                pressed &&
                  styles.menuButtonPressed,
              ]}
              onPress={() =>
                setMenuVisible(true)
              }
            >
              <ThemedText
                style={styles.menuButtonText}
              >
                ☰
              </ThemedText>
            </Pressable>

            <View style={styles.headerText}>
              <ThemedText
                style={styles.headerTitle}
              >
                Admin Dashboard
              </ThemedText>

              <ThemedText
                style={styles.headerSubtitle}
              >
                Overview of your store
              </ThemedText>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.refreshButton,
                pressed &&
                  styles.refreshPressed,
              ]}
              onPress={fetchDashboard}
            >
              <ThemedText
                style={styles.refreshText}
              >
                ↻ Refresh
              </ThemedText>
            </Pressable>

          </View>

          {/* ==================================================
              MAIN STATISTICS
          ================================================== */}

          <View style={styles.statsGrid}>

            <StatCard
              icon="💰"
              title="Total Sales"
              value={`$${Number(
                totalSales
              ).toFixed(2)}`}
            />

            <StatCard
              icon="📦"
              title="Total Orders"
              value={String(totalOrders)}
            />

            <StatCard
              icon="👥"
              title="Total Users"
              value={String(totalUsers)}
            />

            <StatCard
              icon="🛍️"
              title="Total Products"
              value={String(totalProducts)}
            />

          </View>

          {/* ==================================================
              ORDERS BY STATUS
          ================================================== */}

          <DashboardSection
            title="Orders by Status"
            subtitle="Current order distribution"
          >

            <View style={styles.statusGrid}>

              <StatusCard
                title="Pending"
                value={
                  ordersByStatus.pending || 0
                }
                type="pending"
              />

              <StatusCard
                title="Confirmed"
                value={
                  ordersByStatus.confirmed || 0
                }
                type="confirmed"
              />

              <StatusCard
                title="Preparing"
                value={
                  ordersByStatus.preparing || 0
                }
                type="preparing"
              />

              <StatusCard
                title="Shipped"
                value={
                  ordersByStatus.shipped || 0
                }
                type="shipped"
              />

              <StatusCard
                title="Delivered"
                value={
                  ordersByStatus.delivered || 0
                }
                type="delivered"
              />

              <StatusCard
                title="Cancelled"
                value={
                  ordersByStatus.cancelled || 0
                }
                type="cancelled"
              />

            </View>

          </DashboardSection>

          {/* ==================================================
              TOP SELLING PRODUCTS
          ================================================== */}

          <DashboardSection
            title="🔥 Top Selling Products"
            subtitle="Best performing products"
          >

            {topSellingProducts.length === 0 ? (

              <View style={styles.emptyBox}>
                <ThemedText
                  style={styles.emptyText}
                >
                  No sales yet.
                </ThemedText>
              </View>

            ) : (

              <View style={styles.productsTable}>

                <View style={styles.tableHeader}>

                  <ThemedText
                    style={[
                      styles.tableHeaderText,
                      styles.productColumn,
                    ]}
                  >
                    Product
                  </ThemedText>

                  <ThemedText
                    style={[
                      styles.tableHeaderText,
                      styles.priceColumn,
                    ]}
                  >
                    Price
                  </ThemedText>

                  <ThemedText
                    style={[
                      styles.tableHeaderText,
                      styles.soldColumn,
                    ]}
                  >
                    Sold
                  </ThemedText>

                  <ThemedText
                    style={[
                      styles.tableHeaderText,
                      styles.revenueColumn,
                    ]}
                  >
                    Revenue
                  </ThemedText>

                </View>

                {topSellingProducts.map(
                  (product, index) => (

                    <View
                      key={
                        product?.productId ||
                        product?._id ||
                        String(index)
                      }
                      style={styles.tableRow}
                    >

                      <View
                        style={[
                          styles.productInfo,
                          styles.productColumn,
                        ]}
                      >

                        <ThemedText
                          style={styles.rank}
                        >
                          #{index + 1}
                        </ThemedText>

                        <View
                          style={styles.productIcon}
                        >
                          <ThemedText>
                            🛍️
                          </ThemedText>
                        </View>

                        <View
                          style={styles.productText}
                        >
                          <ThemedText
                            numberOfLines={1}
                            style={styles.productName}
                          >
                            {product?.name || ''}
                          </ThemedText>

                          <ThemedText
                            numberOfLines={1}
                            style={styles.productCategory}
                          >
                            {product?.category || ''}
                          </ThemedText>
                        </View>

                      </View>

                      <ThemedText
                        style={[
                          styles.tableValue,
                          styles.priceColumn,
                        ]}
                      >
                        $
                        {Number(
                          product?.price || 0
                        ).toFixed(2)}
                      </ThemedText>

                      <ThemedText
                        style={[
                          styles.tableValue,
                          styles.soldColumn,
                        ]}
                      >
                        {product?.totalQuantitySold || 0}
                      </ThemedText>

                      <ThemedText
                        style={[
                          styles.tableValueStrong,
                          styles.revenueColumn,
                        ]}
                      >
                        $
                        {Number(
                          product?.totalRevenue || 0
                        ).toFixed(2)}
                      </ThemedText>

                    </View>
                  )
                )}

              </View>
            )}

          </DashboardSection>

          {/* ==================================================
              RECENT ORDERS
          ================================================== */}

          <DashboardSection
            title="🕐 Recent Orders"
            subtitle="Select an order to view its products and details"
          >

            {recentOrders.length === 0 ? (

              <View style={styles.emptyBox}>
                <ThemedText
                  style={styles.emptyText}
                >
                  No orders found.
                </ThemedText>
              </View>

            ) : (

              <View
                style={styles.recentOrdersContainer}
              >

                {/* ==================================================
                    ORDERS TABLE
                ================================================== */}

                <View style={styles.ordersTable}>

                  <View
                    style={styles.ordersTableHeader}
                  >

                    <ThemedText
                      style={[
                        styles.ordersHeaderText,
                        styles.customerColumn,
                      ]}
                    >
                      Customer
                    </ThemedText>

                    <ThemedText
                      style={[
                        styles.ordersHeaderText,
                        styles.orderColumn,
                      ]}
                    >
                      Order
                    </ThemedText>

                    <ThemedText
                      style={[
                        styles.ordersHeaderText,
                        styles.totalColumn,
                      ]}
                    >
                      Total
                    </ThemedText>

                    <ThemedText
                      style={[
                        styles.ordersHeaderText,
                        styles.statusColumn,
                      ]}
                    >
                      Status
                    </ThemedText>

                    <ThemedText
                      style={[
                        styles.ordersHeaderText,
                        styles.dateColumn,
                      ]}
                    >
                      Date
                    </ThemedText>

                  </View>

                  {/* ORDERS */}

                  {recentOrders.map(
                    (order, index) => {

                      const orderId =
                        getOrderId(
                          order,
                          index
                        );

                      const isSelected =
                        selectedOrderId ===
                        orderId;

                      const customerName =
                        getCustomerName(
                          order
                        );

                      const customerEmail =
                        getCustomerEmail(
                          order
                        );

                      const total =
                        getOrderTotal(
                          order
                        );

                      const itemCount =
                        getItemCount(
                          order
                        );

                      return (
                        <Pressable
                          key={orderId}
                          accessibilityRole="button"
                          onPress={() =>
                            toggleOrderDetails(
                              orderId
                            )
                          }
                          style={({ pressed }) => [
                            styles.ordersTableRow,

                            isSelected &&
                              styles.ordersTableRowSelected,

                            pressed &&
                              styles.ordersTableRowPressed,
                          ]}
                        >

                          {/* CUSTOMER */}

                          <View
                            style={[
                              styles.customerInfo,
                              styles.customerColumn,
                            ]}
                          >

                            <View
                              style={
                                styles.customerAvatar
                              }
                            >
                              <ThemedText
                                style={
                                  styles.customerAvatarText
                                }
                              >
                                {customerName
                                  .charAt(0)
                                  .toUpperCase() ||
                                  'U'}
                              </ThemedText>
                            </View>

                            <View
                              style={
                                styles.customerText
                              }
                            >

                              <ThemedText
                                numberOfLines={1}
                                style={
                                  styles.customerNameText
                                }
                              >
                                {customerName}
                              </ThemedText>

                              {customerEmail ? (
                                <ThemedText
                                  numberOfLines={1}
                                  style={
                                    styles.customerEmailText
                                  }
                                >
                                  {customerEmail}
                                </ThemedText>
                              ) : null}

                            </View>

                          </View>

                          {/* ORDER */}

                          <View
                            style={[
                              styles.orderNumberInfo,
                              styles.orderColumn,
                            ]}
                          >

                            <ThemedText
                              style={
                                styles.orderNumberText
                              }
                            >
                              #
                              {String(
                                order?._id ||
                                order?.orderNumber ||
                                order?.orderId ||
                                index + 1
                              ).slice(-8)}
                            </ThemedText>

                            <ThemedText
                              style={
                                styles.orderItemsText
                              }
                            >
                              {itemCount}{' '}
                              {itemCount === 1
                                ? 'item'
                                : 'items'}
                            </ThemedText>

                          </View>

                          {/* TOTAL */}

                          <ThemedText
                            style={[
                              styles.orderTotal,
                              styles.totalColumn,
                            ]}
                          >
                            $
                            {total.toFixed(2)}
                          </ThemedText>

                          {/* STATUS */}

                          <View
                            style={[
                              styles.statusColumn,
                              styles.statusCell,
                            ]}
                          >
                            <StatusBadge
                              status={
                                order?.status ||
                                'Unknown'
                              }
                            />
                          </View>

                          {/* DATE */}

                          <ThemedText
                            style={[
                              styles.orderDate,
                              styles.dateColumn,
                            ]}
                          >
                            {order?.createdAt
                              ? new Date(
                                  order.createdAt
                                ).toLocaleDateString()
                              : '-'}
                          </ThemedText>

                        </Pressable>
                      );
                    }
                  )}

                </View>

                {/* ==================================================
                    SELECTED ORDER DETAILS
                ================================================== */}

                {selectedOrder && (

                  <View
                    style={
                      styles.selectedOrderDetails
                    }
                  >

                    {/* HEADER */}

                    <View
                      style={
                        styles.selectedOrderHeader
                      }
                    >

                      <View
                        style={
                          styles.selectedOrderHeaderText
                        }
                      >

                        <ThemedText
                          style={
                            styles.selectedOrderTitle
                          }
                        >
                          Order Details
                        </ThemedText>

                        <ThemedText
                          style={
                            styles.selectedOrderSubtitle
                          }
                        >
                          Order #
                          {String(
                            selectedOrder?._id ||
                            selectedOrder?.orderNumber ||
                            selectedOrder?.orderId ||
                            ''
                          ).slice(-8)}
                        </ThemedText>

                      </View>

                      <Pressable
                        style={({ pressed }) => [
                          styles.hideDetailsButton,
                          pressed &&
                            styles.hideDetailsPressed,
                        ]}
                        onPress={() =>
                          setSelectedOrderId(null)
                        }
                      >
                        <ThemedText
                          style={
                            styles.hideDetailsText
                          }
                        >
                          Hide Details
                        </ThemedText>
                      </Pressable>

                    </View>

                    {/* CUSTOMER */}

                    <View
                      style={
                        styles.selectedCustomer
                      }
                    >

                      <View
                        style={[
                          styles.customerAvatar,
                          styles.largeAvatar,
                        ]}
                      >
                        <ThemedText
                          style={
                            styles.largeAvatarText
                          }
                        >
                          {getCustomerName(
                            selectedOrder
                          )
                            .charAt(0)
                            .toUpperCase() ||
                            'U'}
                        </ThemedText>
                      </View>

                      <View
                        style={
                          styles.selectedCustomerText
                        }
                      >

                        <ThemedText
                          style={
                            styles.selectedCustomerName
                          }
                        >
                          {getCustomerName(
                            selectedOrder
                          )}
                        </ThemedText>

                        {getCustomerEmail(
                          selectedOrder
                        ) ? (
                          <ThemedText
                            style={
                              styles.selectedCustomerMeta
                            }
                          >
                            {getCustomerEmail(
                              selectedOrder
                            )}
                          </ThemedText>
                        ) : null}

                        {getCustomerPhone(
                          selectedOrder
                        ) ? (
                          <ThemedText
                            style={
                              styles.selectedCustomerMeta
                            }
                          >
                            {getCustomerPhone(
                              selectedOrder
                            )}
                          </ThemedText>
                        ) : null}

                      </View>

                    </View>

                    {/* SUMMARY */}

                    <View
                      style={
                        styles.selectedOrderSummary
                      }
                    >

                      <View
                        style={
                          styles.summaryItem
                        }
                      >
                        <ThemedText
                          style={
                            styles.summaryLabel
                          }
                        >
                          Status
                        </ThemedText>

                        <StatusBadge
                          status={
                            selectedOrder?.status ||
                            'Unknown'
                          }
                        />
                      </View>

                      <View
                        style={
                          styles.summaryItem
                        }
                      >
                        <ThemedText
                          style={
                            styles.summaryLabel
                          }
                        >
                          Date
                        </ThemedText>

                        <ThemedText
                          style={
                            styles.summaryValue
                          }
                        >
                          {selectedOrder?.createdAt
                            ? new Date(
                                selectedOrder.createdAt
                              ).toLocaleDateString()
                            : '-'}
                        </ThemedText>
                      </View>

                      <View
                        style={
                          styles.summaryItem
                        }
                      >
                        <ThemedText
                          style={
                            styles.summaryLabel
                          }
                        >
                          Total
                        </ThemedText>

                        <ThemedText
                          style={
                            styles.summaryTotal
                          }
                        >
                          $
                          {getOrderTotal(
                            selectedOrder
                          ).toFixed(2)}
                        </ThemedText>
                      </View>

                    </View>

                    {/* PRODUCTS */}

                    <View
                      style={
                        styles.selectedProducts
                      }
                    >

                      <View
                        style={
                          styles.selectedProductsHeader
                        }
                      >

                        <ThemedText
                          style={
                            styles.selectedProductsTitle
                          }
                        >
                          Products
                        </ThemedText>

                        <ThemedText
                          style={
                            styles.selectedProductsCount
                          }
                        >
                          {Array.isArray(
                            selectedOrder?.items
                          )
                            ? selectedOrder.items.length
                            : 0}{' '}
                          {Array.isArray(
                            selectedOrder?.items
                          ) &&
                          selectedOrder.items.length ===
                            1
                            ? 'item'
                            : 'items'}
                        </ThemedText>

                      </View>

                      {!Array.isArray(
                        selectedOrder?.items
                      ) ||
                      selectedOrder.items.length ===
                        0 ? (

                        <View
                          style={
                            styles.emptyOrderProducts
                          }
                        >
                          <ThemedText
                            style={
                              styles.emptyText
                            }
                          >
                            No products found for this order.
                          </ThemedText>
                        </View>

                      ) : (

                        <View
                          style={
                            styles.orderProductsList
                          }
                        >

                          {selectedOrder.items.map(
                            (item, itemIndex) => {

                              const productName =
                                item?.product?.name ||
                                item?.productName ||
                                item?.name ||
                                'Product';

                              const quantity =
                                Number(
                                  item?.quantity || 0
                                );

                              const price =
                                Number(
                                  item?.price ??
                                  item?.product?.price ??
                                  0
                                );

                              const itemTotal =
                                price * quantity;

                              return (
                                <View
                                  key={
                                    item?._id ||
                                    item?.product?._id ||
                                    String(itemIndex)
                                  }
                                  style={
                                    styles.orderProductRow
                                  }
                                >

                                  <View
                                    style={
                                      styles.orderProductInfo
                                    }
                                  >

                                    <View
                                      style={
                                        styles.orderProductImage
                                      }
                                    >
                                      <ThemedText>
                                        🛍️
                                      </ThemedText>
                                    </View>

                                    <View
                                      style={
                                        styles.orderProductText
                                      }
                                    >

                                      <ThemedText
                                        numberOfLines={2}
                                        style={
                                          styles.orderProductName
                                        }
                                      >
                                        {productName}
                                      </ThemedText>

                                      <ThemedText
                                        style={
                                          styles.orderProductMeta
                                        }
                                      >
                                        $
                                        {price.toFixed(2)}
                                        {' × '}
                                        {quantity}
                                      </ThemedText>

                                    </View>

                                  </View>

                                  <ThemedText
                                    style={
                                      styles.orderProductTotal
                                    }
                                  >
                                    $
                                    {itemTotal.toFixed(2)}
                                  </ThemedText>

                                </View>
                              );
                            }
                          )}

                        </View>
                      )}

                    </View>

                  </View>
                )}

              </View>
            )}

          </DashboardSection>

        </ScrollView>

        {/* ======================================================
            ADMIN MENU
        ====================================================== */}

        {menuVisible ? (
          <View style={styles.menuOverlay}>

            <AdminMenu />

            <Pressable
              style={({ pressed }) => [
                styles.closeMenuButton,
                pressed &&
                  styles.closeMenuPressed,
              ]}
              onPress={() =>
                setMenuVisible(false)
              }
            >
              <ThemedText
                style={styles.closeMenuText}
              >
                ×
              </ThemedText>
            </Pressable>

          </View>
        ) : null}

      </View>
    </SafeAreaView>
  );
}

// ============================================================
// STATUS BADGE
// ============================================================

function StatusBadge({ status }) {
  const normalized = String(
    status || ''
  )
    .toLowerCase()
    .replace(/\s+/g, '');

  const type =
    normalized === 'pending'
      ? 'pending'
      : normalized === 'confirmed'
      ? 'confirmed'
      : normalized === 'preparing'
      ? 'preparing'
      : normalized === 'shipped'
      ? 'shipped'
      : normalized === 'delivered'
      ? 'delivered'
      : normalized === 'cancelled'
      ? 'cancelled'
      : 'unknown';

  return (
    <View
      style={[
        styles.statusBadge,
        badgeStyles[type],
      ]}
    >
      <ThemedText
        style={[
          styles.statusBadgeText,
          badgeTextStyles[type],
        ]}
      >
        {status || 'Unknown'}
      </ThemedText>
    </View>
  );
}

// ============================================================
// STAT CARD
// ============================================================

function StatCard({
  icon,
  title,
  value,
}) {
  return (
    <View style={styles.statCard}>

      <View style={styles.statIcon}>
        <ThemedText
          style={styles.statIconText}
        >
          {icon}
        </ThemedText>
      </View>

      <View style={styles.statContent}>

        <ThemedText
          style={styles.statTitle}
        >
          {title}
        </ThemedText>

        <ThemedText
          style={styles.statValue}
        >
          {value}
        </ThemedText>

      </View>

    </View>
  );
}

// ============================================================
// STATUS CARD
// ============================================================

function StatusCard({
  title,
  value,
  type,
}) {
  return (
    <View
      style={[
        styles.statusCard,
        statusStyles[type],
      ]}
    >

      <ThemedText
        style={styles.statusTitle}
      >
        {title}
      </ThemedText>

      <ThemedText
        style={styles.statusValue}
      >
        {value}
      </ThemedText>

    </View>
  );
}

// ============================================================
// SECTION
// ============================================================

function DashboardSection({
  title,
  subtitle,
  children,
}) {
  return (
    <View style={styles.section}>

      <View style={styles.sectionHeader}>

        <ThemedText
          style={styles.sectionTitle}
        >
          {title}
        </ThemedText>

        <ThemedText
          style={styles.sectionSubtitle}
        >
          {subtitle}
        </ThemedText>

      </View>

      {children}

    </View>
  );
}

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({

  page: {
    flex: 1,
    backgroundColor: '#F7F3EC',
  },

  mainContainer: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 40,
  },

  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },

  loadingText: {
    marginTop: 12,
    color: '#817B71',
    fontSize: 14,
  },

  errorBox: {
    width: '100%',
    padding: 16,
    borderWidth: 1,
    borderColor: '#E7B8B2',
    borderRadius: 10,
    backgroundColor: '#FCEDEC',
  },

  errorTitle: {
    marginBottom: 6,
    color: '#171717',
    fontSize: 18,
    fontWeight: '800',
  },

  errorMessage: {
    color: '#B42318',
    fontSize: 13,
    lineHeight: 19,
  },

  tryAgainButton: {
    marginTop: 14,
    minWidth: 120,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    borderRadius: 8,
    backgroundColor: '#171717',
  },

  tryAgainText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  // ----------------------------------------------------------
  // HEADER
  // ----------------------------------------------------------

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 22,
  },

  menuButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#E7DED1',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },

  menuButtonPressed: {
    backgroundColor: '#F8F2EA',
  },

  menuButtonText: {
    color: '#171717',
    fontSize: 21,
    lineHeight: 24,
    fontWeight: '700',
  },

  headerText: {
    flex: 1,
    paddingRight: 10,
  },

  headerTitle: {
    color: '#171717',
    fontSize: 23,
    lineHeight: 29,
    fontWeight: '800',
  },

  headerSubtitle: {
    marginTop: 4,
    color: '#817B71',
    fontSize: 12,
  },

  refreshButton: {
    height: 40,
    paddingHorizontal: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E7DED1',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },

  refreshPressed: {
    backgroundColor: '#F8F2EA',
  },

  refreshText: {
    color: '#171717',
    fontSize: 11,
    fontWeight: '700',
  },

  // ----------------------------------------------------------
  // MENU
  // ----------------------------------------------------------

  menuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
    elevation: 100,
    backgroundColor: '#FFFFFF',
  },

  closeMenuButton: {
    position: 'absolute',
    top: 12,
    right: 14,
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
    backgroundColor: '#F8F2EA',
  },

  closeMenuPressed: {
    opacity: 0.7,
  },

  closeMenuText: {
    color: '#171717',
    fontSize: 28,
    lineHeight: 31,
    fontWeight: '400',
  },

  // ----------------------------------------------------------
  // STATS
  // ----------------------------------------------------------

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 26,
  },

  statCard: {
    width: '48%',
    minHeight: 105,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E7DED1',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },

  statIcon: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
    borderRadius: 10,
    backgroundColor: '#F8F2EA',
  },

  statIconText: {
    fontSize: 20,
  },

  statContent: {
    flex: 1,
  },

  statTitle: {
    marginBottom: 5,
    color: '#817B71',
    fontSize: 11,
    fontWeight: '600',
  },

  statValue: {
    color: '#171717',
    fontSize: 18,
    fontWeight: '800',
  },

  // ----------------------------------------------------------
  // SECTIONS
  // ----------------------------------------------------------

  section: {
    marginBottom: 28,
  },

  sectionHeader: {
    marginBottom: 13,
  },

  sectionTitle: {
    color: '#171717',
    fontSize: 19,
    fontWeight: '800',
  },

  sectionSubtitle: {
    marginTop: 4,
    color: '#817B71',
    fontSize: 12,
  },

  // ----------------------------------------------------------
  // STATUS CARDS
  // ----------------------------------------------------------

  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  statusCard: {
    width: '31.5%',
    minHeight: 78,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 5,
    borderWidth: 1,
    borderRadius: 10,
  },

  statusTitle: {
    color: '#171717',
    fontSize: 11,
    fontWeight: '700',
  },

  statusValue: {
    marginTop: 6,
    color: '#171717',
    fontSize: 20,
    fontWeight: '800',
  },

  // ----------------------------------------------------------
  // PRODUCTS
  // ----------------------------------------------------------

  productsTable: {
    borderWidth: 1,
    borderColor: '#E7DED1',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },

  tableHeader: {
    minHeight: 42,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E7DED1',
    backgroundColor: '#F8F2EA',
  },

  tableHeaderText: {
    color: '#817B71',
    fontSize: 10,
    fontWeight: '800',
  },

  tableRow: {
    minHeight: 70,
    paddingHorizontal: 10,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE7DD',
  },

  productColumn: {
    flex: 2.7,
  },

  priceColumn: {
    flex: 1,
    textAlign: 'center',
  },

  soldColumn: {
    flex: 0.8,
    textAlign: 'center',
  },

  revenueColumn: {
    flex: 1.2,
    textAlign: 'right',
  },

  productInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
  },

  rank: {
    width: 25,
    color: '#817B71',
    fontSize: 10,
    fontWeight: '700',
  },

  productIcon: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 7,
    borderRadius: 8,
    backgroundColor: '#F8F2EA',
  },

  productText: {
    flex: 1,
    minWidth: 0,
  },

  productName: {
    color: '#171717',
    fontSize: 11,
    fontWeight: '700',
  },

  productCategory: {
    marginTop: 2,
    color: '#817B71',
    fontSize: 9,
  },

  tableValue: {
    color: '#171717',
    fontSize: 10,
  },

  tableValueStrong: {
    color: '#171717',
    fontSize: 10,
    fontWeight: '800',
  },

  emptyBox: {
    minHeight: 75,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#E7DED1',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },

  emptyText: {
    color: '#817B71',
    fontSize: 13,
  },

  // ----------------------------------------------------------
  // RECENT ORDERS
  // ----------------------------------------------------------

  recentOrdersContainer: {
    width: '100%',
  },

  ordersTable: {
    borderWidth: 1,
    borderColor: '#E7DED1',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },

  ordersTableHeader: {
    minHeight: 46,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E7DED1',
    backgroundColor: '#F8F2EA',
  },

  ordersHeaderText: {
    color: '#817B71',
    fontSize: 9,
    fontWeight: '800',
  },

  customerColumn: {
    flex: 2.15,
  },

  orderColumn: {
    flex: 1.35,
  },

  totalColumn: {
    flex: 1.1,
    textAlign: 'right',
  },

  statusColumn: {
    flex: 1.25,
  },

  dateColumn: {
    flex: 1.15,
    textAlign: 'right',
  },

  ordersTableRow: {
    minHeight: 78,
    paddingHorizontal: 10,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE7DD',
  },

  ordersTableRowSelected: {
    backgroundColor: '#F8F2EA',
  },

  ordersTableRowPressed: {
    backgroundColor: '#F3ECE2',
  },

  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
    paddingRight: 5,
  },

  customerAvatar: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 7,
    borderRadius: 17,
    backgroundColor: '#EDE3D5',
  },

  customerAvatarText: {
    color: '#5E554A',
    fontSize: 12,
    fontWeight: '800',
  },

  customerText: {
    flex: 1,
    minWidth: 0,
  },

  customerNameText: {
    color: '#171717',
    fontSize: 10,
    fontWeight: '800',
  },

  customerEmailText: {
    marginTop: 2,
    color: '#817B71',
    fontSize: 8,
  },

  orderNumberInfo: {
    paddingRight: 4,
  },

  orderNumberText: {
    color: '#171717',
    fontSize: 10,
    fontWeight: '800',
  },

  orderItemsText: {
    marginTop: 3,
    color: '#817B71',
    fontSize: 8,
  },

  orderTotal: {
    color: '#171717',
    fontSize: 10,
    fontWeight: '800',
  },

  statusCell: {
    alignItems: 'flex-start',
  },

  orderDate: {
    color: '#817B71',
    fontSize: 8,
  },

  // ----------------------------------------------------------
  // STATUS BADGE
  // ----------------------------------------------------------

  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderWidth: 1,
    borderRadius: 7,
  },

  statusBadgeText: {
    fontSize: 8,
    fontWeight: '800',
  },

  // ----------------------------------------------------------
  // SELECTED ORDER
  // ----------------------------------------------------------

  selectedOrderDetails: {
    marginTop: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E0D4C5',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },

  selectedOrderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE7DD',
  },

  selectedOrderHeaderText: {
    flex: 1,
    paddingRight: 10,
  },

  selectedOrderTitle: {
    color: '#171717',
    fontSize: 17,
    fontWeight: '800',
  },

  selectedOrderSubtitle: {
    marginTop: 3,
    color: '#817B71',
    fontSize: 10,
  },

  hideDetailsButton: {
    minHeight: 36,
    paddingHorizontal: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E7DED1',
    borderRadius: 8,
    backgroundColor: '#F8F2EA',
  },

  hideDetailsPressed: {
    opacity: 0.7,
  },

  hideDetailsText: {
    color: '#171717',
    fontSize: 10,
    fontWeight: '700',
  },

  // ----------------------------------------------------------
  // CUSTOMER
  // ----------------------------------------------------------

  selectedCustomer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
  },

  largeAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 11,
  },

  largeAvatarText: {
    color: '#5E554A',
    fontSize: 17,
    fontWeight: '800',
  },

  selectedCustomerText: {
    flex: 1,
  },

  selectedCustomerName: {
    color: '#171717',
    fontSize: 14,
    fontWeight: '800',
  },

  selectedCustomerMeta: {
    marginTop: 3,
    color: '#817B71',
    fontSize: 10,
  },

  // ----------------------------------------------------------
  // SUMMARY
  // ----------------------------------------------------------

  selectedOrderSummary: {
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E7DED1',
    borderRadius: 10,
    backgroundColor: '#F8F2EA',
  },

  summaryItem: {
    flex: 1,
    paddingHorizontal: 4,
  },

  summaryLabel: {
    marginBottom: 5,
    color: '#817B71',
    fontSize: 9,
    fontWeight: '700',
  },

  summaryValue: {
    color: '#171717',
    fontSize: 10,
    fontWeight: '700',
  },

  summaryTotal: {
    color: '#171717',
    fontSize: 12,
    fontWeight: '800',
  },

  // ----------------------------------------------------------
  // ORDER PRODUCTS
  // ----------------------------------------------------------

  selectedProducts: {
    marginTop: 15,
  },

  selectedProductsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },

  selectedProductsTitle: {
    color: '#171717',
    fontSize: 14,
    fontWeight: '800',
  },

  selectedProductsCount: {
    color: '#817B71',
    fontSize: 10,
  },

  emptyOrderProducts: {
    minHeight: 65,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#E7DED1',
    borderRadius: 9,
    backgroundColor: '#F8F2EA',
  },

  orderProductsList: {
    borderWidth: 1,
    borderColor: '#E7DED1',
    borderRadius: 9,
    overflow: 'hidden',
  },

  orderProductRow: {
    minHeight: 65,
    paddingHorizontal: 10,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE7DD',
    backgroundColor: '#FFFFFF',
  },

  orderProductInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 10,
    minWidth: 0,
  },

  orderProductImage: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
    borderRadius: 8,
    backgroundColor: '#F8F2EA',
  },

  orderProductText: {
    flex: 1,
    minWidth: 0,
  },

  orderProductName: {
    color: '#171717',
    fontSize: 10,
    fontWeight: '700',
  },

  orderProductMeta: {
    marginTop: 3,
    color: '#817B71',
    fontSize: 9,
  },

  orderProductTotal: {
    color: '#171717',
    fontSize: 10,
    fontWeight: '800',
  },

});

// ============================================================
// STATUS CARD COLORS
// ============================================================

const statusStyles = StyleSheet.create({

  pending: {
    borderColor: '#D2C5B4',
    backgroundColor: '#F2E8D8',
  },

  confirmed: {
    borderColor: '#AABFD4',
    backgroundColor: '#DDEAF5',
  },

  preparing: {
    borderColor: '#D5B978',
    backgroundColor: '#F4E6C7',
  },

  shipped: {
    borderColor: '#B6B7D4',
    backgroundColor: '#E5E5F2',
  },

  delivered: {
    borderColor: '#9FC5AA',
    backgroundColor: '#DCEDE1',
  },

  cancelled: {
    borderColor: '#D9A29D',
    backgroundColor: '#F5DDDA',
  },

});

// ============================================================
// BADGE COLORS
// ============================================================

const badgeStyles = StyleSheet.create({

  pending: {
    borderColor: '#D2C5B4',
    backgroundColor: '#F2E8D8',
  },

  confirmed: {
    borderColor: '#AABFD4',
    backgroundColor: '#DDEAF5',
  },

  preparing: {
    borderColor: '#D5B978',
    backgroundColor: '#F4E6C7',
  },

  shipped: {
    borderColor: '#B6B7D4',
    backgroundColor: '#E5E5F2',
  },

  delivered: {
    borderColor: '#9FC5AA',
    backgroundColor: '#DCEDE1',
  },

  cancelled: {
    borderColor: '#D9A29D',
    backgroundColor: '#F5DDDA',
  },

  unknown: {
    borderColor: '#D2C5B4',
    backgroundColor: '#F2E8D8',
  },

});

// ============================================================
// BADGE TEXT COLORS
// ============================================================

const badgeTextStyles = StyleSheet.create({

  pending: {
    color: '#765E3D',
  },

  confirmed: {
    color: '#46627A',
  },

  preparing: {
    color: '#80662D',
  },

  shipped: {
    color: '#56577A',
  },

  delivered: {
    color: '#3E6E4D',
  },

  cancelled: {
    color: '#8A4540',
  },

  unknown: {
    color: '#6F665B',
  },

});
