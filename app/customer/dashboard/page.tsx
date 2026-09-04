"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type OrderItem = {
  product_id?: number;
  product_name?: string;
  category?: string;
  price?: number;
  quantity?: number;
  subtotal?: number;
  image_url?: string;
};

type Order = {
  id: number;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  order_note: string | null;
  items: OrderItem[] | any;
  total_amount: number;
  status: string;
  payment_method: string;
  payment_status: string;
  transaction_id?: string | null;
  created_at: string;
  user_id?: string | null;
};

export default function CustomerDashboard() {
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  // Selected Order for Details Modal
  const [selectedOrder, setSelectedOrder] =
    useState<Order | null>(null);

  useEffect(() => {
    loadCustomer();
  }, []);

  // =========================================
  // LOAD CUSTOMER
  // =========================================

  async function loadCustomer() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/customer/login");
        return;
      }

      setUser(user);

      await loadOrders(user);
    } catch (error) {
      console.error("CUSTOMER LOAD ERROR:", error);
    } finally {
      setLoading(false);
    }
  }

  // =========================================
  // LOAD CUSTOMER ORDERS
  // =========================================

  async function loadOrders(currentUser: any) {
    /*
      IMPORTANT:

      আপনার orders table-এ user_id থাকলে
      Customer-এর Order সরাসরি user.id দিয়ে
      পাওয়া যাবে।

      এটি phone/name matching-এর চেয়ে
      অনেক বেশি নির্ভরযোগ্য।
    */

    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("user_id", currentUser.id)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error(
        "ORDERS LOAD ERROR:",
        error
      );

      setOrders([]);
      return;
    }

    setOrders(data || []);
  }

  // =========================================
  // LOGOUT
  // =========================================

  async function handleLogout() {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      await supabase.auth.signOut();

      router.replace("/customer/login");
      router.refresh();
    } catch (error) {
      console.error(
        "LOGOUT ERROR:",
        error
      );
    } finally {
      setLoggingOut(false);
    }
  }

  // =========================================
  // DATE FORMAT
  // =========================================

  function formatDate(date: string) {
    return new Date(date).toLocaleString(
      "en-BD",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  }

  // =========================================
  // STATUS CLASS
  // =========================================

  function getStatusClass(
    status: string
  ) {
    const value =
      status?.toLowerCase();

    if (
      value === "delivered" ||
      value === "completed"
    ) {
      return "status delivered";
    }

    if (
      value === "processing" ||
      value === "confirmed"
    ) {
      return "status processing";
    }

    if (
      value === "cancelled" ||
      value === "canceled"
    ) {
      return "status cancelled";
    }

    return "status pending";
  }

  // =========================================
  // STATUS TEXT
  // =========================================

  function getStatusText(
    status: string
  ) {
    const value =
      status?.toLowerCase();

    if (value === "delivered") {
      return "✅ Delivered";
    }

    if (value === "completed") {
      return "✅ Completed";
    }

    if (value === "processing") {
      return "⚙️ Processing";
    }

    if (value === "confirmed") {
      return "✓ Confirmed";
    }

    if (
      value === "cancelled" ||
      value === "canceled"
    ) {
      return "❌ Cancelled";
    }

    return "⏳ Pending";
  }

  // =========================================
  // PAYMENT TEXT
  // =========================================

  function getPaymentText(
    paymentStatus: string
  ) {
    const value =
      paymentStatus?.toLowerCase();

    if (
      value === "paid" ||
      value === "success"
    ) {
      return "✅ Paid";
    }

    if (
      value === "failed" ||
      value === "cancelled"
    ) {
      return "❌ Failed";
    }

    return "⏳ Pending";
  }

  // =========================================
  // PAYMENT METHOD
  // =========================================

  function getPaymentMethodText(
    paymentMethod: string
  ) {
    if (
      paymentMethod?.toLowerCase() ===
      "sslcommerz"
    ) {
      return "💳 Online Payment";
    }

    if (
      paymentMethod?.toLowerCase() ===
      "cod"
    ) {
      return "💵 Cash on Delivery";
    }

    return paymentMethod || "Not available";
  }

  // =========================================
  // VIEW ORDER DETAILS
  // =========================================

  function openOrderDetails(
    order: Order
  ) {
    setSelectedOrder(order);

    document.body.style.overflow =
      "hidden";
  }

  // =========================================
  // CLOSE ORDER DETAILS
  // =========================================

  function closeOrderDetails() {
    setSelectedOrder(null);

    document.body.style.overflow =
      "auto";
  }

  // =========================================
  // LOADING
  // =========================================

  if (loading) {
    return (
      <main className="dashboard-page">

        <div className="loading-screen">

          <div className="gold-spinner"></div>

          <h2>
            Loading Dashboard...
          </h2>

          <p>
            Please wait a moment.
          </p>

        </div>

        <DashboardStyles />

      </main>
    );
  }

  // =========================================
  // NO USER
  // =========================================

  if (!user) {
    return null;
  }

  // =========================================
  // CUSTOMER INFO
  // =========================================

  const customerName =
    user.user_metadata?.full_name ||
    "Customer";

  const customerPhone =
    user.user_metadata?.phone ||
    "Not available";

  const customerEmail =
    user.email ||
    "Not available";

  // =========================================
  // PAGE
  // =========================================

  return (
    <main className="dashboard-page">

      {/* =====================================
          BACKGROUND
      ===================================== */}

      <div className="dashboard-background">

        <div className="gold-orb orb-one"></div>

        <div className="gold-orb orb-two"></div>

        <div className="gold-orb orb-three"></div>

      </div>

      {/* =====================================
          HEADER
      ===================================== */}

      <header className="dashboard-header">

        <div className="dashboard-header-inner">

          {/* LOGO */}

          <button
            className="dashboard-logo"
            onClick={() =>
              router.push("/")
            }
          >

            <span className="dashboard-logo-icon">
              N
            </span>

            <span>

              <strong>
                NIJUM SHOP
              </strong>

              <small>
                Gadgets & Varieties
              </small>

            </span>

          </button>

          {/* HEADER ACTIONS */}

          <div className="header-actions">

            <button
              className="shop-button"
              onClick={() =>
                router.push("/")
              }
            >
              🛍️ Continue Shopping
            </button>

            <button
              className="logout-button"
              onClick={handleLogout}
              disabled={loggingOut}
            >
              {loggingOut
                ? "Logging out..."
                : "🚪 Logout"}
            </button>

          </div>

        </div>

      </header>

      {/* =====================================
          MAIN CONTAINER
      ===================================== */}

      <section className="dashboard-container">

        {/* ===================================
            WELCOME CARD
        =================================== */}

        <div className="welcome-card">

          <div className="welcome-content">

            <div className="welcome-avatar">

              {customerName
                .charAt(0)
                .toUpperCase()}

            </div>

            <div>

              <span className="welcome-small">
                CUSTOMER DASHBOARD
              </span>

              <h1>
                Welcome back,{" "}
                <span>
                  {customerName}
                </span>
                !
              </h1>

              <p>
                আপনার NIJUM SHOP account
                থেকে আপনার order এবং
                account information দেখুন।
              </p>

            </div>

          </div>

          <div className="welcome-decoration">
            ✨
          </div>

        </div>

        {/* ===================================
            PROFILE + QUICK ACTION
        =================================== */}

        <div className="dashboard-grid">

          {/* PROFILE */}

          <div className="dashboard-card profile-card">

            <div className="card-title">

              <div className="title-icon">
                👤
              </div>

              <div>

                <h2>
                  My Profile
                </h2>

                <p>
                  Account information
                </p>

              </div>

            </div>

            <div className="profile-info">

              <div className="profile-row">

                <span>
                  👤 Name
                </span>

                <strong>
                  {customerName}
                </strong>

              </div>

              <div className="profile-row">

                <span>
                  📧 Email
                </span>

                <strong>
                  {customerEmail}
                </strong>

              </div>

              <div className="profile-row">

                <span>
                  📱 Mobile
                </span>

                <strong>
                  {customerPhone}
                </strong>

              </div>

            </div>

          </div>

          {/* QUICK ACTION */}

          <div className="dashboard-card quick-card">

            <div className="card-title">

              <div className="title-icon">
                🛍️
              </div>

              <div>

                <h2>
                  Quick Actions
                </h2>

                <p>
                  Manage your shopping
                </p>

              </div>

            </div>

            <div className="quick-actions">

              {/* SHOP */}

              <button
                onClick={() =>
                  router.push(
                    "/#products"
                  )
                }
              >

                <span>
                  🛒
                </span>

                <div>

                  <strong>
                    Shop Products
                  </strong>

                  <small>
                    Browse our products
                  </small>

                </div>

                <b>
                  →
                </b>

              </button>

              {/* MY ORDERS */}

              <button
                onClick={() =>
                  document
                    .getElementById(
                      "orders"
                    )
                    ?.scrollIntoView({
                      behavior:
                        "smooth",
                    })
                }
              >

                <span>
                  🧾
                </span>

                <div>

                  <strong>
                    My Orders
                  </strong>

                  <small>
                    View your orders
                  </small>

                </div>

                <b>
                  →
                </b>

              </button>

            </div>

          </div>

        </div>

        {/* ===================================
            ORDER HISTORY
        =================================== */}

        <div
          className="orders-section"
          id="orders"
        >

          {/* SECTION HEADING */}

          <div className="section-heading">

            <div>

              <span>
                ORDER HISTORY
              </span>

              <h2>
                My Orders
              </h2>

              <p>
                আপনার করা সব Order এখানে
                দেখতে পারবেন।
              </p>

            </div>

            <div className="order-count">

              <strong>
                {orders.length}
              </strong>

              <span>
                Orders
              </span>

            </div>

          </div>

          {/* =================================
              NO ORDERS
          ================================= */}

          {orders.length === 0 ? (

            <div className="empty-orders">

              <div className="empty-icon">
                🧾
              </div>

              <h3>
                এখনো কোনো Order নেই
              </h3>

              <p>
                আপনার প্রথম পণ্যটি
                এখনই Order করুন।
              </p>

              <button
                onClick={() =>
                  router.push("/")
                }
              >
                🛍️ Start Shopping
              </button>

            </div>

          ) : (

            /* =================================
               ORDERS LIST
            ================================= */

            <div className="orders-list">

              {orders.map(
                (order) => (

                  <div
                    className="order-card"
                    key={order.id}
                  >

                    {/* ORDER HEADER */}

                    <div className="order-header">

                      <div>

                        <span>
                          ORDER ID
                        </span>

                        <h3>
                          #{order.id}
                        </h3>

                      </div>

                      <div className="order-date">

                        {formatDate(
                          order.created_at
                        )}

                      </div>

                    </div>

                    {/* ORDER BODY */}

                    <div className="order-body">

                      {/* PRODUCTS */}

                      <div className="order-items">

                        {Array.isArray(
                          order.items
                        ) &&
                          order.items.map(
                            (
                              item: OrderItem,
                              index: number
                            ) => (

                              <div
                                className="order-item"
                                key={index}
                              >

                                {item.image_url ? (

                                  <img
                                    src={
                                      item.image_url
                                    }
                                    alt={
                                      item.product_name ||
                                      "Product"
                                    }
                                  />

                                ) : (

                                  <div className="item-placeholder">
                                    📦
                                  </div>

                                )}

                                <div>

                                  <strong>
                                    {
                                      item.product_name ||
                                      "Product"
                                    }
                                  </strong>

                                  <small>
                                    {
                                      item.quantity ||
                                      0
                                    }{" "}
                                    × ৳
                                    {
                                      item.price ||
                                      0
                                    }
                                  </small>

                                </div>

                              </div>

                            )
                          )}

                      </div>

                      {/* ORDER SUMMARY */}

                      <div className="order-summary">

                        <div>

                          <span>
                            Total
                          </span>

                          <strong>
                            ৳
                            {
                              order.total_amount
                            }
                          </strong>

                        </div>

                        <div>

                          <span>
                            Payment
                          </span>

                          <strong>
                            {
                              order.payment_method ===
                              "sslcommerz"
                                ? "💳 Online"
                                : "💵 COD"
                            }
                          </strong>

                        </div>

                        <div>

                          <span>
                            Payment Status
                          </span>

                          <strong>
                            {
                              getPaymentText(
                                order.payment_status
                              )
                            }
                          </strong>

                        </div>

                      </div>

                    </div>

                    {/* =================================
                        ORDER FOOTER
                    ================================= */}

                    <div className="order-footer">

                      <span
                        className={getStatusClass(
                          order.status
                        )}
                      >

                        {getStatusText(
                          order.status
                        )}

                      </span>

                      <span className="order-address">

                        📍{" "}
                        {order.customer_address}

                      </span>

                    </div>

                    {/* =================================
                        VIEW DETAILS BUTTON
                    ================================= */}

                    <div className="order-details-button-row">

                      <button
                        className="view-details-button"
                        onClick={() =>
                          openOrderDetails(
                            order
                          )
                        }
                      >

                        👁️ View Order Details

                        <span>
                          →
                        </span>

                      </button>

                    </div>

                  </div>

                )
              )}

            </div>

          )}

        </div>

      </section>

      {/* =====================================
          FOOTER
      ===================================== */}

      <footer className="dashboard-footer">

        <strong>
          NIJUM SHOP
        </strong>

        <span>
          Gadgets & Varieties
        </span>

        <p>
          © {new Date().getFullYear()} NIJUM SHOP.
          All Rights Reserved.
        </p>

      </footer>

      {/* =====================================
          ORDER DETAILS MODAL
      ===================================== */}

      {selectedOrder && (

        <div
          className="order-modal-overlay"
          onClick={closeOrderDetails}
        >

          <div
            className="order-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            {/* MODAL HEADER */}

            <div className="modal-header">

              <div>

                <span>
                  ORDER DETAILS
                </span>

                <h2>
                  Order #{selectedOrder.id}
                </h2>

              </div>

              <button
                className="modal-close"
                onClick={
                  closeOrderDetails
                }
              > ×
              </button>

            </div>

            {/* MODAL CONTENT */}

            <div className="modal-content">

              {/* STATUS */}

              <div className="modal-status-row">

                <span
                  className={getStatusClass(
                    selectedOrder.status
                  )}
                >
                  {getStatusText(
                    selectedOrder.status
                  )}
                </span>

                <span className="modal-date">
                  {formatDate(
                    selectedOrder.created_at
                  )}
                </span>

              </div>

              {/* PRODUCTS */}

              <div className="modal-section">

                <h3>
                  📦 Ordered Products
                </h3>

                <div className="modal-products">

                  {Array.isArray(
                    selectedOrder.items
                  ) &&
                    selectedOrder.items.map(
                      (
                        item: OrderItem,
                        index: number
                      ) => (

                        <div
                          className="modal-product"
                          key={index}
                        >

                          {item.image_url ? (

                            <img
                              src={
                                item.image_url
                              }
                              alt={
                                item.product_name ||
                                "Product"
                              }
                            />

                          ) : (

                            <div className="modal-product-placeholder">
                              📦
                            </div>

                          )}

                          <div className="modal-product-info">

                            <strong>
                              {
                                item.product_name ||
                                "Product"
                              }
                            </strong>

                            <span>
                              Quantity:{" "}
                              {
                                item.quantity ||
                                0
                              }
                            </span>

                            <span>
                              Price: ৳
                              {
                                item.price ||
                                0
                              }
                            </span>

                          </div>

                          <strong className="modal-subtotal">

                            ৳
                            {
                              item.subtotal ??
                              (
                                Number(
                                  item.price ||
                                    0
                                ) *
                                Number(
                                  item.quantity ||
                                    0
                                )
                              )
                            }

                          </strong>

                        </div>

                      )
                    )}

                </div>

              </div>

              {/* ORDER INFORMATION */}

              <div className="modal-section">

                <h3>
                  📋 Order Information
                </h3>

                <div className="modal-info-grid">

                  <div>

                    <span>
                      Order ID
                    </span>

                    <strong>
                      #{selectedOrder.id}
                    </strong>

                  </div>

                  <div>

                    <span>
                      Order Date
                    </span>

                    <strong>
                      {formatDate(
                        selectedOrder.created_at
                      )}
                    </strong>

                  </div>

                  <div>

                    <span>
                      Payment Method
                    </span>

                    <strong>
                      {
                        getPaymentMethodText(
                          selectedOrder.payment_method
                        )
                      }
                    </strong>

                  </div>

                  <div>

                    <span>
                      Payment Status
                    </span>

                    <strong>
                      {
                        getPaymentText(
                          selectedOrder.payment_status
                        )
                      }
                    </strong>

                  </div>

                  {selectedOrder.transaction_id && (

                    <div>

                      <span>
                        Transaction ID
                      </span>

                      <strong className="transaction-id">

                        {
                          selectedOrder.transaction_id
                        }

                      </strong>

                    </div>

                  )}

                </div>

              </div>

              {/* CUSTOMER INFORMATION */}

              <div className="modal-section">

                <h3>
                  👤 Customer Information
                </h3>

                <div className="customer-details">

                  <div>

                    <span>
                      Name
                    </span>

                    <strong>
                      {
                        selectedOrder.customer_name
                      }
                    </strong>

                  </div>

                  <div>

                    <span>
                      Phone
                    </span>

                    <strong>
                      {
                        selectedOrder.customer_phone
                      }
                    </strong>

                  </div>

                  <div>

                    <span>
                      Delivery Address
                    </span>

                    <strong>
                      {
                        selectedOrder.customer_address
                      }
                    </strong>

                  </div>

                  {selectedOrder.order_note && (

                    <div>

                      <span>
                        Order Note
                      </span>

                      <strong>
                        {
                          selectedOrder.order_note
                        }
                      </strong>

                    </div>

                  )}

                </div>

              </div>

              {/* TOTAL */}

              <div className="modal-total">

                <span>
                  Grand Total
                </span>

                <strong>
                  ৳
                  {
                    selectedOrder.total_amount
                  }
                </strong>

              </div>

            </div>

            {/* MODAL FOOTER */}

            <div className="modal-footer">

              <button
                className="modal-close-button"
                onClick={
                  closeOrderDetails
                }
              >
                Close
              </button>

            </div>

          </div>

        </div>

      )}

      {/* GLOBAL STYLES */}

      <DashboardStyles />

    </main>
  );
}


/* =====================================================
   DARK + GOLD DASHBOARD STYLES
===================================================== */

function DashboardStyles() {
  return (
    <style jsx global>{`

      * {
        box-sizing: border-box;
      }

      html {
        scroll-behavior: smooth;
      }

      body {
        margin: 0;
      }

      /* =====================================
         MAIN PAGE
      ===================================== */

      .dashboard-page {
        min-height: 100vh;
        position: relative;
        overflow-x: hidden;

        background:
          radial-gradient(
            circle at 10% 10%,
            rgba(212, 175, 55, 0.10),
            transparent 30%
          ),
          radial-gradient(
            circle at 90% 90%,
            rgba(212, 175, 55, 0.08),
            transparent 30%
          ),
          #080808;

        color: #f5f5f5;
      }

      /* =====================================
         BACKGROUND
      ===================================== */

      .dashboard-background {
        position: fixed;
        inset: 0;
        pointer-events: none;
        overflow: hidden;
        z-index: 0;
      }

      .gold-orb {
        position: absolute;

        border-radius: 50%;

        filter: blur(80px);

        opacity: 0.16;

        background: #d4af37;

        animation:
          orbFloat
          9s
          ease-in-out
          infinite;
      }

      .orb-one {
        width: 300px;
        height: 300px;
        left: -120px;
        top: 10%;
      }

      .orb-two {
        width: 400px;
        height: 400px;
        right: -180px;
        bottom: 5%;
        animation-delay: 2s;
      }

      .orb-three {
        width: 180px;
        height: 180px;
        right: 25%;
        top: 5%;
        animation-delay: 4s;
      }

      @keyframes orbFloat {

        0%,
        100% {
          transform:
            translate(0, 0)
            scale(1);
        }

        50% {
          transform:
            translate(25px, -30px)
            scale(1.08);
        }

      }

      /* =====================================
         HEADER
      ===================================== */

      .dashboard-header {
        position: sticky;
        top: 0;
        z-index: 50;

        border-bottom:
          1px solid
          rgba(212, 175, 55, 0.15);

        background:
          rgba(8, 8, 8, 0.88);

        backdrop-filter:
          blur(20px);
      }

      .dashboard-header-inner {
        max-width: 1200px;
        margin: auto;

        min-height: 78px;

        padding: 0 25px;

        display: flex;
        align-items: center;
        justify-content: space-between;

        gap: 20px;
      }

      .dashboard-logo {
        border: none;
        background: transparent;

        color: white;

        display: flex;
        align-items: center;

        gap: 12px;

        cursor: pointer;
        text-align: left;
      }

      .dashboard-logo-icon {
        width: 45px;
        height: 45px;

        display: flex;
        align-items: center;
        justify-content: center;

        border-radius: 13px;

        background:
          linear-gradient(
            135deg,
            #d4af37,
            #f6d76b
          );

        color: #080808;

        font-size: 25px;
        font-weight: 950;

        box-shadow:
          0 0 25px
          rgba(212, 175, 55, 0.25);

        animation:
          logoPulse
          3s
          ease-in-out
          infinite;
      }

      @keyframes logoPulse {

        0%,
        100% {
          box-shadow:
            0 0 15px
            rgba(212, 175, 55, 0.2);
        }

        50% {
          box-shadow:
            0 0 30px
            rgba(212, 175, 55, 0.45);
        }

      }

      .dashboard-logo strong {
        display: block;

        font-size: 17px;

        letter-spacing: 0.7px;
      }

      .dashboard-logo small {
        display: block;

        margin-top: 3px;

        color: #a7a7a7;

        font-size: 11px;
      }

      .header-actions {
        display: flex;
        gap: 10px;
      }

      .shop-button,
      .logout-button {
        border:
          1px solid
          rgba(212, 175, 55, 0.35);

        padding: 10px 15px;

        border-radius: 11px;

        font-weight: 700;

        cursor: pointer;

        transition: 0.3s;
      }

      .shop-button {
        background:
          rgba(212, 175, 55, 0.08);

        color: #e8c95c;
      }

      .logout-button {
        background: #d4af37;
        color: #080808;
      }

      .shop-button:hover,
      .logout-button:hover:not(:disabled) {
        transform:
          translateY(-2px);

        box-shadow:
          0 8px 25px
          rgba(212, 175, 55, 0.2);
      }

      .logout-button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      /* =====================================
         CONTAINER
      ===================================== */

      .dashboard-container {
        max-width: 1200px;

        margin: auto;

        padding:
          45px
          25px
          70px;

        position: relative;

        z-index: 2;
      }

      /* =====================================
         WELCOME
      ===================================== */

      .welcome-card {
        position: relative;
        overflow: hidden;

        padding: 30px;

        border-radius: 24px;

        border:
          1px solid
          rgba(212, 175, 55, 0.25);

        background:
          linear-gradient(
            135deg,
            rgba(212, 175, 55, 0.13),
            rgba(20, 20, 20, 0.92)
          );

        box-shadow:
          0 25px 70px
          rgba(0, 0, 0, 0.4);

        animation:
          cardIn
          0.7s
          ease;
      }

      .welcome-card::before {
        content: "";

        position: absolute;

        width: 350px;
        height: 350px;

        border-radius: 50%;

        border:
          1px solid
          rgba(212, 175, 55, 0.10);

        right: -150px;
        top: -180px;
      }

      .welcome-content {
        display: flex;

        align-items: center;

        gap: 20px;

        position: relative;

        z-index: 2;
      }

      .welcome-avatar {
        flex-shrink: 0;

        width: 75px;
        height: 75px;

        display: flex;
        align-items: center;
        justify-content: center;

        border-radius: 22px;

        background:
          linear-gradient(
            135deg,
            #d4af37,
            #f4d66d
          );

        color: #080808;

        font-size: 32px;
        font-weight: 900;

        box-shadow:
          0 12px 35px
          rgba(212, 175, 55, 0.25);
      }

      .welcome-small {
        color: #d4af37;

        font-size: 11px;

        font-weight: 900;

        letter-spacing: 2px;
      }

      .welcome-card h1 {
        margin:
          7px
          0
          5px;

        font-size: 30px;
      }

      .welcome-card h1 span {
        color: #d4af37;
      }

      .welcome-card p {
        margin: 0;

        color: #a6a6a6;

        font-size: 14px;
      }

      .welcome-decoration {
        position: absolute;

        right: 40px;
        top: 50%;

        transform:
          translateY(-50%);

        font-size: 70px;

        opacity: 0.12;

        animation:
          decorationFloat
          4s
          ease-in-out
          infinite;
      }

      @keyframes decorationFloat {

        0%,
        100% {
          transform:
            translateY(-50%)
            rotate(0deg);
        }

        50% {
          transform:
            translateY(-60%)
            rotate(12deg);
        }

      }

      /* =====================================
         GRID
      ===================================== */

      .dashboard-grid {
        display: grid;

        grid-template-columns:
          1fr
          1fr;

        gap: 20px;

        margin-top: 20px;
      }

      .dashboard-card {
        background:
          rgba(18, 18, 18, 0.92);

        border:
          1px solid
          rgba(255, 255, 255, 0.07);

        border-radius: 20px;

        padding: 25px;

        transition: 0.3s;

        animation:
          cardIn
          0.7s
          ease;
      }

      .dashboard-card:hover {
        border-color:
          rgba(212, 175, 55, 0.28);

        transform:
          translateY(-3px);
      }

      .card-title {
        display: flex;

        align-items: center;

        gap: 13px;

        margin-bottom: 22px;
      }

      .title-icon {
        width: 43px;
        height: 43px;

        border-radius: 12px;

        display: flex;

        align-items: center;

        justify-content: center;

        background:
          rgba(212, 175, 55, 0.10);

        border:
          1px solid
          rgba(212, 175, 55, 0.20);

        font-size: 20px;
      }

      .card-title h2 {
        margin: 0;
        font-size: 18px;
      }

      .card-title p {
        margin:
          3px
          0
          0;

        color: #777;

        font-size: 11px;
      }

      /* =====================================
         PROFILE
      ===================================== */

      .profile-info {
        display: flex;

        flex-direction: column;

        gap: 1px;
      }

      .profile-row {
        display: flex;

        justify-content: space-between;

        gap: 20px;

        padding: 14px 0;

        border-bottom:
          1px solid
          rgba(255,255,255,0.06);
      }

      .profile-row:last-child {
        border-bottom: none;
      }

      .profile-row span {
        color: #858585;

        font-size: 13px;
      }

      .profile-row strong {
        color: #eee;

        font-size: 13px;

        text-align: right;

        word-break: break-word;
      }

      /* =====================================
         QUICK ACTIONS
      ===================================== */

      .quick-actions {
        display: flex;

        flex-direction: column;

        gap: 10px;
      }

      .quick-actions button {
        width: 100%;

        display: flex;

        align-items: center;

        gap: 13px;

        padding: 13px;

        border-radius: 13px;

        border:
          1px solid
          rgba(255,255,255,0.06);

        background: #111;

        color: white;

        cursor: pointer;

        text-align: left;

        transition: 0.3s;
      }

      .quick-actions button:hover {
        border-color:
          rgba(212,175,55,0.35);

        background:
          rgba(212,175,55,0.06);

        transform:
          translateX(4px);
      }

      .quick-actions button > span {
        width: 40px;
        height: 40px;

        display: flex;

        align-items: center;

        justify-content: center;

        border-radius: 11px;

        background:
          rgba(212,175,55,0.10);
      }

      .quick-actions button div {
        flex: 1;
      }

      .quick-actions strong {
        display: block;

        font-size: 13px;
      }

      .quick-actions small {
        display: block;

        color: #777;

        margin-top: 3px;

        font-size: 11px;
      }

      .quick-actions b {
        color: #d4af37;

        font-size: 20px;
      }

      /* =====================================
         ORDERS SECTION
      ===================================== */

      .orders-section {
        margin-top: 55px;

        animation:
          cardIn
          0.8s
          ease;
      }

      .section-heading {
        display: flex;

        align-items: end;

        justify-content: space-between;

        gap: 20px;

        margin-bottom: 20px;
      }

      .section-heading
      > div:first-child
      > span {
        color: #d4af37;

        font-size: 11px;

        font-weight: 900;

        letter-spacing: 2px;
      }

      .section-heading h2 {
        margin:
          7px
          0
          5px;

        font-size: 28px;
      }

      .section-heading p {
        margin: 0;

        color: #777;

        font-size: 13px;
      }

      .order-count {
        min-width: 85px;

        padding:
          12px
          18px;

        text-align: center;

        border-radius: 13px;

        background:
          rgba(212,175,55,0.08);

        border:
          1px solid
          rgba(212,175,55,0.18);
      }

      .order-count strong {
        display: block;

        color: #d4af37;

        font-size: 24px;
      }

      .order-count span {
        color: #777;

        font-size: 10px;
      }

      /* =====================================
         EMPTY
      ===================================== */

      .empty-orders {
        text-align: center;

        padding:
          70px
          20px;

        border-radius: 22px;

        border:
          1px dashed
          rgba(212,175,55,0.22);

        background:
          rgba(15,15,15,0.75);
      }

      .empty-icon {
        font-size: 55px;

        opacity: 0.8;
      }

      .empty-orders h3 {
        margin:
          15px
          0
          8px;

        font-size: 20px;
      }

      .empty-orders p {
        color: #777;

        font-size: 13px;
      }

      .empty-orders button {
        margin-top: 15px;

        border: none;

        border-radius: 11px;

        padding:
          12px
          20px;

        background: #d4af37;

        color: #080808;

        font-weight: 800;

        cursor: pointer;

        transition: 0.3s;
      }

      .empty-orders button:hover {
        transform:
          translateY(-2px);

        box-shadow:
          0 10px 25px
          rgba(212,175,55,0.25);
      }

      /* =====================================
         ORDER CARD
      ===================================== */

      .orders-list {
        display: flex;

        flex-direction: column;

        gap: 15px;
      }

      .order-card {
        overflow: hidden;

        border-radius: 19px;

        border:
          1px solid
          rgba(255,255,255,0.07);

        background: #111;

        transition: 0.3s;
      }

      .order-card:hover {
        border-color:
          rgba(212,175,55,0.25);

        box-shadow:
          0 15px 45px
          rgba(0,0,0,0.3);
      }

      .order-header {
        padding:
          17px
          20px;

        display: flex;

        align-items: center;

        justify-content: space-between;

        border-bottom:
          1px solid
          rgba(255,255,255,0.06);

        background:
          rgba(255,255,255,0.015);
      }

      .order-header span {
        color: #666;

        font-size: 9px;

        font-weight: 800;

        letter-spacing: 1.5px;
      }

      .order-header h3 {
        margin:
          4px
          0
          0;

        color: #d4af37;

        font-size: 17px;
      }

      .order-date {
        color: #777;

        font-size: 11px;
      }

      .order-body {
        padding: 20px;

        display: grid;

        grid-template-columns:
          1.5fr
          1fr;

        gap: 25px;
      }

      .order-items {
        display: flex;

        flex-direction: column;

        gap: 10px;
      }

      .order-item {
        display: flex;

        align-items: center;

        gap: 12px;
      }

      .order-item img,
      .item-placeholder {
        width: 50px;
        height: 50px;

        object-fit: cover;

        border-radius: 10px;

        border:
          1px solid
          rgba(255,255,255,0.08);
      }

      .item-placeholder {
        display: flex;

        align-items: center;

        justify-content: center;

        background: #191919;

        font-size: 20px;
      }

      .order-item strong {
        display: block;

        font-size: 12px;
      }

      .order-item small {
        display: block;

        margin-top: 4px;

        color: #777;

        font-size: 11px;
      }

      .order-summary {
        padding-left: 20px;

        border-left:
          1px solid
          rgba(255,255,255,0.06);

        display: flex;

        flex-direction: column;

        gap: 11px;
      }

      .order-summary div {
        display: flex;

        justify-content: space-between;

        gap: 15px;
      }

      .order-summary span {
        color: #777;

        font-size: 11px;
      }

      .order-summary strong {
        color: #ddd;

        font-size: 12px;

        text-align: right;
      }

      .order-summary
      div:first-child
      strong {
        color: #d4af37;

        font-size: 18px;
      }

      .order-footer {
        padding:
          13px
          20px;

        display: flex;

        align-items: center;

        justify-content: space-between;

        gap: 15px;

        border-top:
          1px solid
          rgba(255,255,255,0.06);
      }

      .status {
        padding:
          6px
          10px;

        border-radius: 8px;

        font-size: 10px;

        font-weight: 800;
      }

      .status.pending {
        background:
          rgba(234,179,8,0.12);

        color: #facc15;
      }

      .status.processing {
        background:
          rgba(59,130,246,0.12);

        color: #60a5fa;
      }

      .status.delivered {
        background:
          rgba(34,197,94,0.12);

        color: #4ade80;
      }

      .status.cancelled {
        background:
          rgba(239,68,68,0.12);

        color: #f87171;
      }

      .order-address {
        color: #666;

        font-size: 10px;

        text-align: right;
      }

      /* =====================================
         VIEW DETAILS BUTTON
      ===================================== */

      .order-details-button-row {
        padding:
          0
          20px
          18px;
      }

      .view-details-button {
        width: 100%;

        display: flex;

        align-items: center;

        justify-content: center;

        gap: 10px;

        padding:
          11px
          15px;

        border-radius: 10px;

        border:
          1px solid
          rgba(212,175,55,0.28);

        background:
          rgba(212,175,55,0.07);

        color: #e8c95c;

        font-size: 12px;

        font-weight: 800;

        cursor: pointer;

        transition: 0.3s;
      }

      .view-details-button span {
        font-size: 17px;
      }

      .view-details-button:hover {
        background:
          rgba(212,175,55,0.16);

        border-color:
          rgba(212,175,55,0.55);

        transform:
          translateY(-2px);

        box-shadow:
          0 8px 25px
          rgba(212,175,55,0.12);
      }

      /* =====================================
         ORDER DETAILS MODAL
      ===================================== */

      .order-modal-overlay {
        position: fixed;

        inset: 0;

        z-index: 9999;

        display: flex;

        align-items: center;

        justify-content: center;

        padding: 20px;

        background:
          rgba(0,0,0,0.78);

        backdrop-filter:
          blur(10px);

        animation:
          modalFade
          0.25s
          ease;
      }

      @keyframes modalFade {

        from {
          opacity: 0;
        }

        to {
          opacity: 1;
        }

      }

      .order-modal {
        width: 100%;

        max-width: 760px;

        max-height: 90vh;

        overflow: hidden;

        border-radius: 22px;

        border:
          1px solid
          rgba(212,175,55,0.28);

        background:
          linear-gradient(
            145deg,
            #161616,
            #090909
          );

        box-shadow:
          0 30px 100px
          rgba(0,0,0,0.65);

        animation:
          modalSlide
          0.3s
          ease;
      }

      @keyframes modalSlide {

        from {
          opacity: 0;

          transform:
            translateY(30px)
            scale(0.97);
        }

        to {
          opacity: 1;

          transform:
            translateY(0)
            scale(1);
        }

      }

      .modal-header {
        padding:
          20px
          22px;

        display: flex;

        align-items: center;

        justify-content: space-between;

        gap: 20px;

        border-bottom:
          1px solid
          rgba(255,255,255,0.07);

        background:
          rgba(212,175,55,0.05);
      }

      .modal-header span {
        color: #d4af37;

        font-size: 10px;

        font-weight: 900;

        letter-spacing: 2px;
      }

      .modal-header h2 {
        margin:
          5px
          0
          0;

        color: #fff;

        font-size: 22px;
      }

      .modal-close {
        width: 40px;
        height: 40px;

        flex-shrink: 0;

        border-radius: 50%;

        border:
          1px solid
          rgba(255,255,255,0.1);

        background:
          rgba(255,255,255,0.05);

        color: #fff;

        font-size: 27px;

        line-height: 1;

        cursor: pointer;

        transition: 0.3s;
      }

      .modal-close:hover {
        background:
          rgba(239,68,68,0.15);

        border-color:
          rgba(239,68,68,0.4);

        color: #f87171;

        transform:
          rotate(90deg);
      }

      .modal-content {
        padding: 22px;

        max-height:
          calc(90vh - 150px);

        overflow-y: auto;
      }

      .modal-status-row {
        display: flex;

        align-items: center;

        justify-content: space-between;

        gap: 15px;

        margin-bottom: 20px;
      }

      .modal-date {
        color: #777;

        font-size: 11px;
      }

      .modal-section {
        margin-bottom: 20px;

        padding: 18px;

        border-radius: 15px;

        border:
          1px solid
          rgba(255,255,255,0.06);

        background:
          rgba(255,255,255,0.025);
      }

      .modal-section h3 {
        margin:
          0
          0
          15px;

        color: #eee;

        font-size: 14px;
      }

      /* PRODUCTS */

      .modal-products {
        display: flex;

        flex-direction: column;

        gap: 10px;
      }

      .modal-product {
        display: flex;

        align-items: center;

        gap: 12px;

        padding: 10px;

        border-radius: 12px;

        border:
          1px solid
          rgba(255,255,255,0.05);

        background: #101010;
      }

      .modal-product img,
      .modal-product-placeholder {
        width: 58px;
        height: 58px;

        flex-shrink: 0;

        object-fit: cover;

        border-radius: 10px;

        border:
          1px solid
          rgba(255,255,255,0.08);
      }

      .modal-product-placeholder {
        display: flex;

        align-items: center;

        justify-content: center;

        background: #191919;

        font-size: 22px;
      }

      .modal-product-info {
        flex: 1;

        min-width: 0;
      }

      .modal-product-info strong {
        display: block;

        color: #eee;

        font-size: 13px;

        word-break: break-word;
      }

      .modal-product-info span {
        display: block;

        margin-top: 3px;

        color: #777;

        font-size: 11px;
      }

      .modal-subtotal {
        color: #d4af37;

        font-size: 14px;

        white-space: nowrap;
      }

      /* INFO GRID */

      .modal-info-grid {
        display: grid;

        grid-template-columns:
          1fr
          1fr;

        gap: 10px;
      }

      .modal-info-grid > div {
        padding: 12px;

        border-radius: 10px;

        background:
          rgba(255,255,255,0.025);

        border:
          1px solid
          rgba(255,255,255,0.05);
      }

      .modal-info-grid span,
      .customer-details span {
        display: block;

        color: #666;

        font-size: 10px;

        margin-bottom: 5px;
      }

      .modal-info-grid strong,
      .customer-details strong {
        display: block;

        color: #ddd;

        font-size: 12px;

        word-break: break-word;
      }

      .transaction-id {
        color: #d4af37 !important;
      }

      /* CUSTOMER */

      .customer-details {
        display: flex;

        flex-direction: column;

        gap: 12px;
      }

      .customer-details > div {
        padding-bottom: 10px;

        border-bottom:
          1px solid
          rgba(255,255,255,0.05);
      }

      .customer-details > div:last-child {
        padding-bottom: 0;

        border-bottom: none;
      }

      /* TOTAL */

      .modal-total {
        display: flex;

        align-items: center;

        justify-content: space-between;

        gap: 15px;

        padding:
          18px
          20px;

        border-radius: 15px;

        border:
          1px solid
          rgba(212,175,55,0.25);

        background:
          linear-gradient(
            135deg,
            rgba(212,175,55,0.10),
            rgba(212,175,55,0.03)
          );
      }

      .modal-total span {
        color: #aaa;

        font-size: 13px;

        font-weight: 700;
      }

      .modal-total strong {
        color: #d4af37;

        font-size: 25px;
      }

      .modal-footer {
        padding:
          15px
          22px;

        border-top:
          1px solid
          rgba(255,255,255,0.07);

        text-align: right;
      }

      .modal-close-button {
        border:
          1px solid
          rgba(212,175,55,0.3);

        background:
          rgba(212,175,55,0.08);

        color: #d4af37;

        padding:
          10px
          22px;

        border-radius: 10px;

        font-weight: 800;

        cursor: pointer;

        transition: 0.3s;
      }

      .modal-close-button:hover {
        background:
          #d4af37;

        color: #080808;
      }

      /* =====================================
         LOADING
      ===================================== */

      .loading-screen {
        min-height: 100vh;

        display: flex;

        flex-direction: column;

        align-items: center;

        justify-content: center;

        background: #080808;
      }

      .loading-screen h2 {
        margin:
          18px
          0
          5px;

        color: #d4af37;
      }

      .loading-screen p {
        color: #666;
      }

      .gold-spinner {
        width: 50px;
        height: 50px;

        border:
          3px solid
          rgba(212,175,55,0.15);

        border-top-color:
          #d4af37;

        border-radius: 50%;

        animation:
          spin
          0.8s
          linear
          infinite;
      }

      @keyframes spin {

        to {
          transform:
            rotate(360deg);
        }

      }

      @keyframes cardIn {

        from {
          opacity: 0;

          transform:
            translateY(20px);
        }

        to {
          opacity: 1;

          transform:
            translateY(0);
        }

      }

      /* =====================================
         FOOTER
      ===================================== */

      .dashboard-footer {
        position: relative;

        z-index: 2;

        padding:
          30px
          20px;

        text-align: center;

        border-top:
          1px solid
          rgba(212,175,55,0.12);

        background: #050505;
      }

      .dashboard-footer strong {
        display: block;

        color: #d4af37;

        font-size: 18px;
      }

      .dashboard-footer > span {
        display: block;

        color: #777;

        margin-top: 4px;

        font-size: 11px;
      }

      .dashboard-footer p {
        margin:
          15px
          0
          0;

        color: #555;

        font-size: 10px;
      }

      /* =====================================
         MOBILE
      ===================================== */

      @media (max-width: 800px) {

        .dashboard-header-inner {
          min-height: 70px;

          padding:
            0
            15px;
        }

        .dashboard-logo strong {
          font-size: 14px;
        }

        .dashboard-logo small {
          font-size: 9px;
        }

        .dashboard-logo-icon {
          width: 40px;
          height: 40px;

          font-size: 21px;
        }

        .shop-button {
          display: none;
        }

        .logout-button {
          padding:
            9px
            11px;

          font-size: 11px;
        }

        .dashboard-container {
          padding:
            25px
            15px
            50px;
        }

        .welcome-card {
          padding: 22px;
        }

        .welcome-content {
          align-items: flex-start;
        }

        .welcome-avatar {
          width: 55px;
          height: 55px;

          border-radius: 17px;

          font-size: 24px;
        }

        .welcome-card h1 {
          font-size: 21px;
        }

        .welcome-card p {
          font-size: 12px;

          line-height: 1.6;
        }

        .welcome-decoration {
          display: none;
        }

        .dashboard-grid {
          grid-template-columns: 1fr;
        }

        .section-heading {
          align-items: center;
        }

        .section-heading h2 {
          font-size: 23px;
        }

        .order-count {
          min-width: 70px;

          padding:
            9px
            12px;
        }

        .order-body {
          grid-template-columns: 1fr;

          gap: 20px;
        }

        .order-summary {
          padding-left: 0;

          padding-top: 15px;

          border-left: none;

          border-top:
            1px solid
            rgba(255,255,255,0.06);
        }

        .modal-info-grid {
          grid-template-columns: 1fr;
        }

      }

      @media (max-width: 500px) {

        .dashboard-card {
          padding: 18px;
        }

        .profile-row {
          flex-direction: column;

          gap: 5px;
        }

        .profile-row strong {
          text-align: left;
        }

        .order-header {
          align-items: flex-start;

          gap: 10px;

          flex-direction: column;
        }

        .order-footer {
          align-items: flex-start;

          flex-direction: column;
        }

        .order-address {
          text-align: left;
        }

        .order-details-button-row {
          padding:
            0
            15px
            15px;
        }

        .view-details-button {
          font-size: 11px;
        }

        .order-modal-overlay {
          padding: 10px;
        }

        .order-modal {
          max-height: 94vh;

          border-radius: 17px;
        }

        .modal-header {
          padding:
            16px
            17px;
        }

        .modal-header h2 {
          font-size: 18px;
        }

        .modal-content {
          padding: 15px;

          max-height:
            calc(94vh - 135px);
        }

        .modal-section {
          padding: 14px;
        }

        .modal-product img,
        .modal-product-placeholder {
          width: 48px;
          height: 48px;
        }

        .modal-total strong {
          font-size: 21px;
        }

      }

    `}</style>
  );
}