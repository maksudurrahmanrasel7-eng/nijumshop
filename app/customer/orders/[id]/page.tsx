"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type OrderItem = {
  product_id: number;
  product_name: string;
  category?: string;
  price: number;
  quantity: number;
  subtotal: number;
  image_url?: string;
};

type Order = {
  id: number;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  order_note: string | null;
  items: OrderItem[];
  total_amount: number;
  status: string;
  created_at: string;
  payment_method: string;
  payment_status: string;
  transaction_id: string | null;
  user_id: string | null;
};

export default function OrderDetailsPage() {
  const router = useRouter();
  const params = useParams();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    loadOrder();
  }, []);

  async function loadOrder() {
    try {
      setLoading(true);

      // =====================================
      // CURRENT USER
      // =====================================

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/customer/login");
        return;
      }

      setUser(user);

      // =====================================
      // ORDER ID
      // =====================================

      const orderId = Number(params.id);

      if (!orderId) {
        router.replace("/customer/dashboard");
        return;
      }

      // =====================================
      // LOAD ORDER
      // =====================================

      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .eq("user_id", user.id)
        .single();

      if (error) {
        console.error("ORDER DETAILS ERROR:", error);
        setOrder(null);
        return;
      }

      setOrder(data);
    } catch (error) {
      console.error("ORDER DETAILS LOAD ERROR:", error);
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }

  // =====================================
  // LOGOUT
  // =====================================

  async function logout() {
    await supabase.auth.signOut();

    router.replace("/customer/login");
    router.refresh();
  }

  // =====================================
  // FORMAT DATE
  // =====================================

  function formatDate(date: string) {
    return new Date(date).toLocaleString("en-BD", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  // =====================================
  // ORDER STATUS
  // =====================================

  function getStatusClass(status: string) {
    const value = status?.toLowerCase();

    if (
      value === "delivered" ||
      value === "completed"
    ) {
      return "status delivered";
    }

    if (
      value === "processing" ||
      value === "confirmed" ||
      value === "shipped"
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

  function getStatusText(status: string) {
    const value = status?.toLowerCase();

    if (value === "delivered") {
      return "✅ Delivered";
    }

    if (value === "completed") {
      return "✅ Completed";
    }

    if (value === "shipped") {
      return "🚚 Shipped";
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

  // =====================================
  // PAYMENT STATUS
  // =====================================

  function getPaymentStatusText(
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

  // =====================================
  // PAYMENT METHOD
  // =====================================

  function getPaymentMethod(
    paymentMethod: string
  ) {
    const value =
      paymentMethod?.toLowerCase();

    if (value === "cod") {
      return "💵 Cash on Delivery";
    }

    if (value === "sslcommerz") {
      return "💳 Online Payment";
    }

    return paymentMethod || "Not specified";
  }

  // =====================================
  // TRACKING STATUS
  // =====================================

  function getTrackingStep() {
    if (!order) return 0;

    const status =
      order.status?.toLowerCase();

    if (
      status === "delivered" ||
      status === "completed"
    ) {
      return 5;
    }

    if (status === "shipped") {
      return 4;
    }

    if (status === "processing") {
      return 3;
    }

    if (status === "confirmed") {
      return 2;
    }

    if (
      status === "cancelled" ||
      status === "canceled"
    ) {
      return -1;
    }

    return 1;
  }

  // =====================================
  // LOADING
  // =====================================

  if (loading) {
    return (
      <main className="order-details-page">
        <div className="loading-screen">
          <div className="gold-spinner"></div>

          <h2>
            Loading Order...
          </h2>

          <p>
            Please wait a moment.
          </p>
        </div>

        <OrderDetailsStyles />
      </main>
    );
  }

  // =====================================
  // ORDER NOT FOUND
  // =====================================

  if (!order) {
    return (
      <main className="order-details-page">

        <div className="not-found-container">

          <div className="not-found-icon">
            📦
          </div>

          <h1>
            Order Not Found
          </h1>

          <p>
            এই Order টি পাওয়া যায়নি অথবা
            আপনার দেখার অনুমতি নেই।
          </p>

          <button
            onClick={() =>
              router.push(
                "/customer/dashboard"
              )
            }
          >
            ← Back to Dashboard
          </button>

        </div>

        <OrderDetailsStyles />

      </main>
    );
  }

  const trackingStep =
    getTrackingStep();

  const trackingSteps = [
    {
      number: 1,
      icon: "📦",
      title: "Order Placed",
      description:
        "আপনার Order গ্রহণ করা হয়েছে।",
    },
    {
      number: 2,
      icon: "✓",
      title: "Confirmed",
      description:
        "আপনার Order Confirmed হয়েছে।",
    },
    {
      number: 3,
      icon: "⚙️",
      title: "Processing",
      description:
        "আপনার Order প্রস্তুত করা হচ্ছে।",
    },
    {
      number: 4,
      icon: "🚚",
      title: "Shipped",
      description:
        "আপনার Order Delivery-এর জন্য পাঠানো হয়েছে।",
    },
    {
      number: 5,
      icon: "✅",
      title: "Delivered",
      description:
        "আপনার Order সফলভাবে Delivered হয়েছে।",
    },
  ];

  return (
    <main className="order-details-page">

      {/* =====================================
          BACKGROUND
      ===================================== */}

      <div className="details-background">

        <div className="gold-orb details-orb-one"></div>

        <div className="gold-orb details-orb-two"></div>

      </div>

      {/* =====================================
          HEADER
      ===================================== */}

      <header className="details-header">

        <div className="details-header-inner">

          <button
            className="details-logo"
            onClick={() =>
              router.push("/")
            }
          >

            <span className="details-logo-icon">
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

          <div className="header-actions">

            <button
              className="back-button"
              onClick={() =>
                router.push(
                  "/customer/dashboard"
                )
              }
            >
              ← My Orders
            </button>

            <button
              className="logout-button"
              onClick={logout}
            >
              🚪 Logout
            </button>

          </div>

        </div>

      </header>

      {/* =====================================
          MAIN CONTENT
      ===================================== */}

      <section className="details-container">

        {/* ===================================
            PAGE TITLE
        =================================== */}

        <div className="page-heading">

          <div>

            <span>
              ORDER DETAILS
            </span>

            <h1>
              Order #{order.id}
            </h1>

            <p>
              আপনার Order-এর সম্পূর্ণ
              information এখানে দেখুন।
            </p>

          </div>

          <div
            className={getStatusClass(
              order.status
            )}
          >
            {getStatusText(
              order.status
            )}
          </div>

        </div>

        {/* ===================================
            ORDER BASIC INFO
        =================================== */}

        <div className="info-grid">

          {/* ORDER INFO */}

          <div className="info-card">

            <div className="info-icon">
              🧾
            </div>

            <div>

              <span>
                ORDER DATE
              </span>

              <strong>
                {formatDate(
                  order.created_at
                )}
              </strong>

            </div>

          </div>

          {/* PAYMENT */}

          <div className="info-card">

            <div className="info-icon">
              💳
            </div>

            <div>

              <span>
                PAYMENT
              </span>

              <strong>
                {getPaymentMethod(
                  order.payment_method
                )}
              </strong>

            </div>

          </div>

          {/* PAYMENT STATUS */}

          <div className="info-card">

            <div className="info-icon">
              💰
            </div>

            <div>

              <span>
                PAYMENT STATUS
              </span>

              <strong>
                {getPaymentStatusText(
                  order.payment_status
                )}
              </strong>

            </div>

          </div>

        </div>

        {/* ===================================
            ORDER TRACKING TIMELINE
        =================================== */}

        <div className="tracking-card">

          <div className="tracking-heading">

            <div>

              <span>
                ORDER TRACKING
              </span>

              <h2>
                🚚 Track Your Order
              </h2>

              <p>
                আপনার Order বর্তমানে কোন
                অবস্থায় আছে তা এখানে দেখতে
                পারবেন।
              </p>

            </div>

            <div className="tracking-current-status">

              <small>
                CURRENT STATUS
              </small>

              <strong>
                {getStatusText(
                  order.status
                )}
              </strong>

            </div>

          </div>

          {/* CANCELLED */}

          {trackingStep === -1 ? (

            <div className="cancelled-tracking">

              <div className="cancelled-icon">
                ❌
              </div>

              <div>

                <strong>
                  Order Cancelled
                </strong>

                <p>
                  এই Order টি Cancelled হয়েছে।
                </p>

              </div>

            </div>

          ) : (

            <div className="tracking-timeline">

              {trackingSteps.map(
                (step, index) => {

                  const isCompleted =
                    trackingStep >=
                    step.number;

                  const isCurrent =
                    trackingStep ===
                    step.number;

                  return (
                    <div
                      className={`tracking-step ${
                        isCompleted
                          ? "completed"
                          : ""
                      } ${
                        isCurrent
                          ? "current"
                          : ""
                      }`}
                      key={
                        step.number
                      }
                    >

                      {/* CONNECTOR */}

                      {index <
                        trackingSteps.length -
                          1 && (

                        <div
                          className={`tracking-line ${
                            trackingStep >
                            step.number
                              ? "line-completed"
                              : ""
                          }`}
                        ></div>

                      )}

                      {/* ICON */}

                      <div className="tracking-icon">

                        <span>
                          {isCompleted
                            ? "✓"
                            : step.icon}
                        </span>

                      </div>

                      {/* CONTENT */}

                      <div className="tracking-content">

                        <div className="tracking-step-title">

                          <strong>
                            {step.title}
                          </strong>

                          {isCurrent && (
                            <span className="current-badge">
                              CURRENT
                            </span>
                          )}

                          {isCompleted &&
                            !isCurrent && (
                              <span className="completed-badge">
                                COMPLETED
                              </span>
                            )}

                        </div>

                        <p>
                          {step.description}
                        </p>

                        {step.number === 1 && (
                          <small>
                            {formatDate(
                              order.created_at
                            )}
                          </small>
                        )}

                      </div>

                    </div>
                  );
                }
              )}

            </div>

          )}

        </div>

        {/* ===================================
            PRODUCTS
        =================================== */}

        <div className="details-card">

          <div className="card-heading">

            <div>

              <span>
                ORDER ITEMS
              </span>

              <h2>
                🛍️ Products
              </h2>

            </div>

            <span className="items-count">

              {Array.isArray(order.items)
                ? order.items.length
                : 0}{" "}
              Items

            </span>

          </div>

          <div className="products-list">

            {Array.isArray(order.items) &&
              order.items.map(
                (
                  item,
                  index
                ) => (

                  <div
                    className="product-row"
                    key={index}
                  >

                    {/* PRODUCT IMAGE */}

                    {item.image_url ? (

                      <img
                        src={
                          item.image_url
                        }
                        alt={
                          item.product_name
                        }
                        className="product-image"
                      />

                    ) : (

                      <div className="product-placeholder">
                        📦
                      </div>

                    )}

                    {/* PRODUCT NAME */}

                    <div className="product-info">

                      <strong>
                        {
                          item.product_name
                        }
                      </strong>

                      {item.category && (
                        <small>
                          {
                            item.category
                          }
                        </small>
                      )}

                      <span>
                        ৳
                        {
                          item.price
                        }{" "}
                        ×{" "}
                        {
                          item.quantity
                        }
                      </span>

                    </div>

                    {/* SUBTOTAL */}

                    <div className="product-subtotal">

                      <span>
                        Subtotal
                      </span>

                      <strong>
                        ৳
                        {
                          item.subtotal
                        }
                      </strong>

                    </div>

                  </div>

                )
              )}

          </div>

          {/* TOTAL */}

          <div className="total-section">

            <div>

              <span>
                Total Amount
              </span>

              <strong>
                ৳
                {
                  Number(
                    order.total_amount
                  )
                }
              </strong>

            </div>

          </div>

        </div>

        {/* ===================================
            CUSTOMER INFORMATION
        =================================== */}

        <div className="bottom-grid">

          <div className="details-card">

            <div className="card-heading">

              <div>

                <span>
                  CUSTOMER INFORMATION
                </span>

                <h2>
                  👤 Customer
                </h2>

              </div>

            </div>

            <div className="customer-info">

              <div className="customer-row">

                <span>
                  Name
                </span>

                <strong>
                  {order.customer_name}
                </strong>

              </div>

              <div className="customer-row">

                <span>
                  Mobile
                </span>

                <strong>
                  {order.customer_phone}
                </strong>

              </div>

            </div>

          </div>

          {/* =================================
              DELIVERY ADDRESS
          ================================= */}

          <div className="details-card">

            <div className="card-heading">

              <div>

                <span>
                  DELIVERY
                </span>

                <h2>
                  📍 Address
                </h2>

              </div>

            </div>

            <div className="address-box">

              {order.customer_address}

            </div>

          </div>

        </div>

        {/* ===================================
            ORDER NOTE
        =================================== */}

        {order.order_note && (

          <div className="details-card note-card">

            <div className="card-heading">

              <div>

                <span>
                  CUSTOMER NOTE
                </span>

                <h2>
                  📝 Order Note
                </h2>

              </div>

            </div>

            <div className="note-box">
              {order.order_note}
            </div>

          </div>

        )}

        {/* ===================================
            TRANSACTION ID
        =================================== */}

        {order.transaction_id && (

          <div className="transaction-box">

            <span>
              TRANSACTION ID
            </span>

            <strong>
              {order.transaction_id}
            </strong>

          </div>

        )}

        {/* ===================================
            ACTIONS
        =================================== */}

        <div className="bottom-actions">

          <button
            className="secondary-action"
            onClick={() =>
              router.push(
                "/customer/dashboard"
              )
            }
          >
            ← Back to My Orders
          </button>

          <button
            className="primary-action"
            onClick={() =>
              router.push("/")
            }
          >
            🛍️ Continue Shopping
          </button>

        </div>

      </section>

      {/* =====================================
          FOOTER
      ===================================== */}

      <footer className="details-footer">

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

      <OrderDetailsStyles />

    </main>
  );
}


/* =====================================================
   DARK + GOLD ORDER DETAILS STYLES
===================================================== */

function OrderDetailsStyles() {
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
        background: #080808;
      }

      /* =====================================
         PAGE
      ===================================== */

      .order-details-page {
        min-height: 100vh;
        position: relative;
        overflow: hidden;

        background:
          radial-gradient(
            circle at 10% 10%,
            rgba(212,175,55,0.10),
            transparent 30%
          ),
          radial-gradient(
            circle at 90% 90%,
            rgba(212,175,55,0.08),
            transparent 30%
          ),
          #080808;

        color: #f5f5f5;
      }

      /* =====================================
         BACKGROUND
      ===================================== */

      .details-background {
        position: fixed;
        inset: 0;
        z-index: 0;
        pointer-events: none;
        overflow: hidden;
      }

      .gold-orb {
        position: absolute;
        border-radius: 50%;
        background: #d4af37;
        filter: blur(90px);
        opacity: 0.13;
      }

      .details-orb-one {
        width: 320px;
        height: 320px;
        left: -150px;
        top: 15%;
      }

      .details-orb-two {
        width: 400px;
        height: 400px;
        right: -200px;
        bottom: 5%;
      }

      /* =====================================
         HEADER
      ===================================== */

      .details-header {
        position: sticky;
        top: 0;
        z-index: 10;

        border-bottom:
          1px solid
          rgba(212,175,55,0.15);

        background:
          rgba(8,8,8,0.88);

        backdrop-filter:
          blur(20px);
      }

      .details-header-inner {
        max-width: 1200px;
        min-height: 78px;

        margin: auto;
        padding: 0 25px;

        display: flex;
        align-items: center;
        justify-content: space-between;

        gap: 20px;
      }

      .details-logo {
        display: flex;
        align-items: center;
        gap: 12px;

        border: none;
        background: transparent;
        color: white;

        cursor: pointer;
        text-align: left;
      }

      .details-logo-icon {
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
          rgba(212,175,55,0.25);
      }

      .details-logo strong {
        display: block;
        font-size: 17px;
        letter-spacing: 0.7px;
      }

      .details-logo small {
        display: block;
        margin-top: 3px;
        color: #888;
        font-size: 11px;
      }

      .header-actions {
        display: flex;
        gap: 10px;
      }

      .back-button,
      .logout-button {
        padding: 10px 15px;
        border-radius: 11px;

        cursor: pointer;
        font-weight: 700;

        transition: 0.3s;
      }

      .back-button {
        background:
          rgba(212,175,55,0.08);

        border:
          1px solid
          rgba(212,175,55,0.35);

        color: #e8c95c;
      }

      .logout-button {
        background: #d4af37;
        color: #080808;

        border:
          1px solid
          #d4af37;
      }

      .back-button:hover,
      .logout-button:hover {
        transform: translateY(-2px);

        box-shadow:
          0 8px 25px
          rgba(212,175,55,0.20);
      }

      /* =====================================
         CONTAINER
      ===================================== */

      .details-container {
        max-width: 1200px;
        margin: auto;

        padding:
          45px 25px 70px;

        position: relative;
        z-index: 2;
      }

      /* =====================================
         PAGE HEADING
      ===================================== */

      .page-heading {
        display: flex;
        align-items: end;
        justify-content: space-between;

        gap: 20px;

        margin-bottom: 25px;
      }

      .page-heading > div:first-child > span {
        color: #d4af37;

        font-size: 11px;
        font-weight: 900;

        letter-spacing: 2px;
      }

      .page-heading h1 {
        margin: 8px 0 5px;

        font-size: 32px;
      }

      .page-heading p {
        margin: 0;

        color: #777;
        font-size: 13px;
      }

      /* =====================================
         STATUS
      ===================================== */

      .status {
        padding: 9px 15px;

        border-radius: 10px;

        font-size: 12px;
        font-weight: 900;

        white-space: nowrap;
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

      /* =====================================
         INFO GRID
      ===================================== */

      .info-grid {
        display: grid;

        grid-template-columns:
          repeat(3, 1fr);

        gap: 15px;

        margin-bottom: 20px;
      }

      .info-card {
        display: flex;
        align-items: center;
        gap: 13px;

        padding: 18px;

        border-radius: 17px;

        background:
          rgba(18,18,18,0.92);

        border:
          1px solid
          rgba(255,255,255,0.07);
      }

      .info-icon {
        width: 43px;
        height: 43px;

        flex-shrink: 0;

        display: flex;
        align-items: center;
        justify-content: center;

        border-radius: 12px;

        background:
          rgba(212,175,55,0.10);

        border:
          1px solid
          rgba(212,175,55,0.18);

        font-size: 19px;
      }

      .info-card span {
        display: block;

        color: #666;

        font-size: 9px;
        font-weight: 800;

        letter-spacing: 1.3px;
      }

      .info-card strong {
        display: block;

        margin-top: 5px;

        color: #ddd;

        font-size: 12px;
      }

      /* =====================================
         TRACKING CARD
      ===================================== */

      .tracking-card {
        margin-bottom: 20px;

        padding: 25px;

        border-radius: 22px;

        background:
          linear-gradient(
            145deg,
            rgba(212,175,55,0.08),
            rgba(17,17,17,0.97)
          );

        border:
          1px solid
          rgba(212,175,55,0.20);

        box-shadow:
          0 20px 60px
          rgba(0,0,0,0.25);
      }

      .tracking-heading {
        display: flex;
        justify-content: space-between;
        align-items: center;

        gap: 20px;

        padding-bottom: 20px;

        border-bottom:
          1px solid
          rgba(255,255,255,0.06);
      }

      .tracking-heading > div:first-child > span {
        color: #d4af37;

        font-size: 9px;
        font-weight: 900;

        letter-spacing: 1.7px;
      }

      .tracking-heading h2 {
        margin: 6px 0 5px;

        font-size: 21px;
      }

      .tracking-heading p {
        margin: 0;

        color: #777;

        font-size: 12px;
      }

      .tracking-current-status {
        min-width: 145px;

        padding: 12px 15px;

        border-radius: 13px;

        text-align: center;

        background:
          rgba(212,175,55,0.08);

        border:
          1px solid
          rgba(212,175,55,0.18);
      }

      .tracking-current-status small {
        display: block;

        color: #666;

        font-size: 8px;

        font-weight: 900;

        letter-spacing: 1.2px;
      }

      .tracking-current-status strong {
        display: block;

        margin-top: 5px;

        color: #d4af37;

        font-size: 12px;
      }

      /* =====================================
         TIMELINE
      ===================================== */

      .tracking-timeline {
        display: flex;

        align-items: flex-start;

        padding:
          35px 10px 10px;
      }

      .tracking-step {
        position: relative;

        flex: 1;

        min-width: 0;

        text-align: center;
      }

      .tracking-icon {
        position: relative;
        z-index: 3;

        width: 54px;
        height: 54px;

        margin: 0 auto;

        display: flex;
        align-items: center;
        justify-content: center;

        border-radius: 50%;

        background: #171717;

        border:
          2px solid
          #333;

        color: #777;

        font-size: 21px;

        transition:
          all 0.4s ease;
      }

      .tracking-step.completed
      .tracking-icon {

        background:
          linear-gradient(
            135deg,
            #d4af37,
            #f4d66d
          );

        border-color:
          #d4af37;

        color: #080808;

        box-shadow:
          0 0 25px
          rgba(212,175,55,0.28);

      }

      .tracking-step.current
      .tracking-icon {

        animation:
          trackingPulse 2s
          ease-in-out infinite;

      }

      @keyframes trackingPulse {

        0%,
        100% {
          box-shadow:
            0 0 0
            rgba(212,175,55,0);
        }

        50% {
          box-shadow:
            0 0 28px
            rgba(212,175,55,0.45);
        }

      }

      .tracking-line {
        position: absolute;

        z-index: 1;

        top: 26px;

        left: 50%;

        width: 100%;

        height: 3px;

        background:
          #292929;
      }

      .tracking-line.line-completed {
        background:
          linear-gradient(
            90deg,
            #d4af37,
            #e4c85b
          );

        box-shadow:
          0 0 8px
          rgba(212,175,55,0.25);
      }

      .tracking-content {
        padding:
          15px 8px 0;
      }

      .tracking-step-title {
        display: flex;

        justify-content: center;
        align-items: center;

        flex-wrap: wrap;

        gap: 6px;
      }

      .tracking-step-title strong {
        color: #ddd;

        font-size: 12px;
      }

      .tracking-step.completed
      .tracking-step-title strong {
        color: #d4af37;
      }

      .tracking-content p {
        margin: 6px auto 0;

        max-width: 170px;

        color: #666;

        font-size: 10px;

        line-height: 1.5;
      }

      .tracking-content small {
        display: block;

        margin-top: 7px;

        color: #777;

        font-size: 9px;
      }

      .current-badge,
      .completed-badge {
        padding: 3px 6px;

        border-radius: 5px;

        font-size: 7px;

        font-weight: 900;

        letter-spacing: 0.5px;
      }

      .current-badge {
        background:
          rgba(212,175,55,0.18);

        color: #d4af37;
      }

      .completed-badge {
        background:
          rgba(34,197,94,0.10);

        color: #4ade80;
      }

      /* =====================================
         CANCELLED TRACKING
      ===================================== */

      .cancelled-tracking {
        display: flex;

        align-items: center;

        justify-content: center;

        gap: 15px;

        margin-top: 25px;

        padding: 20px;

        border-radius: 15px;

        background:
          rgba(239,68,68,0.06);

        border:
          1px solid
          rgba(239,68,68,0.15);
      }

      .cancelled-icon {
        width: 50px;
        height: 50px;

        display: flex;
        align-items: center;
        justify-content: center;

        border-radius: 50%;

        background:
          rgba(239,68,68,0.10);

        font-size: 22px;
      }

      .cancelled-tracking strong {
        display: block;

        color: #f87171;

        font-size: 15px;
      }

      .cancelled-tracking p {
        margin: 4px 0 0;

        color: #777;

        font-size: 11px;
      }

      /* =====================================
         DETAILS CARD
      ===================================== */

      .details-card {
        margin-bottom: 20px;

        border-radius: 20px;

        background:
          rgba(17,17,17,0.95);

        border:
          1px solid
          rgba(255,255,255,0.07);

        overflow: hidden;
      }

      .card-heading {
        display: flex;
        align-items: center;
        justify-content: space-between;

        padding: 20px;

        border-bottom:
          1px solid
          rgba(255,255,255,0.06);
      }

      .card-heading span {
        color: #d4af37;

        font-size: 9px;
        font-weight: 900;

        letter-spacing: 1.5px;
      }

      .card-heading h2 {
        margin: 6px 0 0;

        font-size: 19px;
      }

      .items-count {
        padding: 7px 11px;

        border-radius: 8px;

        background:
          rgba(212,175,55,0.08);

        color: #d4af37 !important;

        font-size: 10px !important;
      }

      /* =====================================
         PRODUCTS
      ===================================== */

      .products-list {
        padding: 5px 20px;
      }

      .product-row {
        display: flex;
        align-items: center;

        gap: 15px;

        padding: 15px 0;

        border-bottom:
          1px solid
          rgba(255,255,255,0.06);
      }

      .product-row:last-child {
        border-bottom: none;
      }

      .product-image,
      .product-placeholder {
        width: 65px;
        height: 65px;

        flex-shrink: 0;

        object-fit: cover;

        border-radius: 12px;

        border:
          1px solid
          rgba(255,255,255,0.08);
      }

      .product-placeholder {
        display: flex;
        align-items: center;
        justify-content: center;

        background: #1a1a1a;

        font-size: 25px;
      }

      .product-info {
        flex: 1;
      }

      .product-info strong {
        display: block;

        color: #eee;

        font-size: 14px;
      }

      .product-info small {
        display: block;

        margin-top: 3px;

        color: #777;

        font-size: 10px;
      }

      .product-info span {
        display: block;

        margin-top: 6px;

        color: #888;

        font-size: 11px;
      }

      .product-subtotal {
        text-align: right;
      }

      .product-subtotal span {
        display: block;

        color: #666;

        font-size: 9px;
      }

      .product-subtotal strong {
        display: block;

        margin-top: 4px;

        color: #d4af37;

        font-size: 16px;
      }

      /* =====================================
         TOTAL
      ===================================== */

      .total-section {
        padding: 18px 20px;

        border-top:
          2px solid
          rgba(212,175,55,0.22);

        background:
          rgba(212,175,55,0.035);
      }

      .total-section > div {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .total-section span {
        color: #aaa;

        font-size: 14px;
        font-weight: 700;
      }

      .total-section strong {
        color: #d4af37;

        font-size: 26px;
      }

      /* =====================================
         BOTTOM GRID
      ===================================== */

      .bottom-grid {
        display: grid;

        grid-template-columns:
          1fr 1fr;

        gap: 20px;
      }

      .customer-info {
        padding: 5px 20px 20px;
      }

      .customer-row {
        display: flex;
        justify-content: space-between;

        gap: 20px;

        padding: 13px 0;

        border-bottom:
          1px solid
          rgba(255,255,255,0.06);
      }

      .customer-row:last-child {
        border-bottom: none;
      }

      .customer-row span {
        color: #777;

        font-size: 12px;
      }

      .customer-row strong {
        color: #ddd;

        font-size: 12px;

        text-align: right;
      }

      .address-box {
        margin: 5px 20px 20px;

        padding: 15px;

        border-radius: 12px;

        background: #0d0d0d;

        border:
          1px solid
          rgba(255,255,255,0.06);

        color: #bbb;

        font-size: 13px;

        line-height: 1.7;
      }

      /* =====================================
         NOTE
      ===================================== */

      .note-box {
        margin: 5px 20px 20px;

        padding: 15px;

        border-radius: 12px;

        background:
          rgba(212,175,55,0.05);

        border:
          1px solid
          rgba(212,175,55,0.12);

        color: #bbb;

        font-size: 13px;

        line-height: 1.7;
      }

      /* =====================================
         TRANSACTION
      ===================================== */

      .transaction-box {
        margin-bottom: 20px;

        padding: 16px 20px;

        border-radius: 15px;

        background: #111;

        border:
          1px solid
          rgba(255,255,255,0.06);
      }

      .transaction-box span {
        display: block;

        color: #666;

        font-size: 9px;

        letter-spacing: 1.4px;

        font-weight: 800;
      }

      .transaction-box strong {
        display: block;

        margin-top: 6px;

        color: #d4af37;

        font-size: 12px;

        word-break: break-all;
      }

      /* =====================================
         ACTIONS
      ===================================== */

      .bottom-actions {
        display: flex;

        justify-content: center;

        gap: 12px;

        margin-top: 25px;
      }

      .secondary-action,
      .primary-action {
        padding: 13px 20px;

        border-radius: 11px;

        font-weight: 800;

        cursor: pointer;

        transition: 0.3s;
      }

      .secondary-action {
        background:
          rgba(255,255,255,0.04);

        border:
          1px solid
          rgba(255,255,255,0.10);

        color: #ddd;
      }

      .primary-action {
        background:
          #d4af37;

        border:
          1px solid
          #d4af37;

        color: #080808;
      }

      .secondary-action:hover,
      .primary-action:hover {
        transform: translateY(-2px);

        box-shadow:
          0 10px 25px
          rgba(212,175,55,0.18);
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
        margin: 18px 0 5px;

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
          spin 0.8s linear infinite;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      /* =====================================
         NOT FOUND
      ===================================== */

      .not-found-container {
        min-height: 100vh;

        display: flex;
        flex-direction: column;

        align-items: center;
        justify-content: center;

        text-align: center;

        padding: 30px;
      }

      .not-found-icon {
        font-size: 65px;
      }

      .not-found-container h1 {
        margin: 15px 0 8px;

        color: #d4af37;
      }

      .not-found-container p {
        color: #777;
        max-width: 500px;
      }

      .not-found-container button {
        margin-top: 15px;

        padding: 12px 20px;

        border: none;
        border-radius: 10px;

        background: #d4af37;
        color: #080808;

        font-weight: 800;

        cursor: pointer;
      }

      /* =====================================
         FOOTER
      ===================================== */

      .details-footer {
        position: relative;
        z-index: 2;

        padding: 30px 20px;

        text-align: center;

        border-top:
          1px solid
          rgba(212,175,55,0.12);

        background: #050505;
      }

      .details-footer strong {
        display: block;

        color: #d4af37;

        font-size: 18px;
      }

      .details-footer span {
        display: block;

        margin-top: 4px;

        color: #777;

        font-size: 11px;
      }

      .details-footer p {
        margin: 15px 0 0;

        color: #555;

        font-size: 10px;
      }

      /* =====================================
         MOBILE
      ===================================== */

      @media (max-width: 800px) {

        .details-header-inner {
          min-height: 70px;
          padding: 0 15px;
        }

        .details-logo strong {
          font-size: 14px;
        }

        .details-logo small {
          font-size: 9px;
        }

        .details-logo-icon {
          width: 40px;
          height: 40px;
          font-size: 21px;
        }

        .header-actions {
          gap: 6px;
        }

        .back-button {
          padding: 8px 10px;
          font-size: 11px;
        }

        .logout-button {
          padding: 8px 10px;
          font-size: 11px;
        }

        .details-container {
          padding:
            25px 15px 50px;
        }

        .page-heading {
          align-items: flex-start;

          flex-direction: column;
        }

        .page-heading h1 {
          font-size: 25px;
        }

        .info-grid {
          grid-template-columns: 1fr;
        }

        /* ===============================
           MOBILE TRACKING
        =============================== */

        .tracking-card {
          padding: 20px 15px;
        }

        .tracking-heading {
          align-items: flex-start;

          flex-direction: column;
        }

        .tracking-current-status {
          width: 100%;
        }

        .tracking-timeline {
          display: block;

          padding:
            25px 5px 5px;
        }

        .tracking-step {
          display: flex;

          align-items: flex-start;

          text-align: left;

          min-height: 88px;
        }

        .tracking-icon {
          width: 45px;
          height: 45px;

          flex-shrink: 0;

          margin: 0;

          font-size: 18px;
        }

        .tracking-line {
          top: 45px;
          left: 21px;

          width: 3px;
          height: calc(100% - 10px);
        }

        .tracking-content {
          padding:
            2px 0 0 15px;
        }

        .tracking-step-title {
          justify-content: flex-start;
        }

        .tracking-content p {
          margin:
            5px 0 0;

          max-width: none;
        }

        .tracking-content small {
          margin-top: 5px;
        }

        .bottom-grid {
          grid-template-columns: 1fr;
        }

        .product-row {
          align-items: flex-start;
        }

        .product-image,
        .product-placeholder {
          width: 55px;
          height: 55px;
        }

        .product-subtotal strong {
          font-size: 14px;
        }

      }

      @media (max-width: 500px) {

        .details-logo small {
          display: none;
        }

        .details-logo strong {
          font-size: 13px;
        }

        .back-button {
          font-size: 10px;
        }

        .logout-button {
          font-size: 10px;
        }

        .card-heading {
          padding: 17px;
        }

        .products-list {
          padding: 5px 15px;
        }

        .product-row {
          gap: 10px;
        }

        .product-info strong {
          font-size: 12px;
        }

        .product-info span {
          font-size: 10px;
        }

        .product-subtotal span {
          display: none;
        }

        .product-subtotal strong {
          font-size: 13px;
        }

        .customer-row {
          flex-direction: column;
          gap: 5px;
        }

        .customer-row strong {
          text-align: left;
        }

        .bottom-actions {
          flex-direction: column;
        }

        .secondary-action,
        .primary-action {
          width: 100%;
        }

        .cancelled-tracking {
          justify-content: flex-start;
        }

      }

    `}</style>
  );
}