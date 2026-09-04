"use client";

import { useEffect, useState } from "react";
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

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    loadMyOrders();
  }, []);

  async function loadMyOrders() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setUser(null);
      setOrders([]);
      setLoading(false);
      return;
    }

    setUser(user);

    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("user_id", user.id)
      .order("id", {
        ascending: false,
      });

    if (error) {
      console.error("MY ORDERS ERROR:", error);

      alert("আপনার Order Load করতে সমস্যা হয়েছে।");

      setOrders([]);
    } else {
      setOrders(data || []);
    }

    setLoading(false);
  }

  // =========================================
  // LOGOUT
  // =========================================

  async function logout() {
    await supabase.auth.signOut();

    window.location.href = "/";
  }

  // =========================================
  // NOT LOGGED IN
  // =========================================

  if (!loading && !user) {
    return (
      <main className="my-orders-page">
        <div className="my-orders-login-box">
          <div className="my-orders-big-icon">🔐</div>

          <h1>Login Required</h1>

          <p>
            আপনার Order দেখতে হলে
            <br />
            প্রথমে Login করুন।
          </p>

          <button
            className="gold-button"
            onClick={() =>
              (window.location.href = "/")
            }
          >
            ← Back to Shop
          </button>
        </div>
      </main>
    );
  }

  // =========================================
  // LOADING
  // =========================================

  if (loading) {
    return (
      <main className="my-orders-loading">
        <div className="loading-box">
          <div className="loading-icon">⏳</div>

          <h2>Orders Loading...</h2>

          <p>একটু অপেক্ষা করুন।</p>
        </div>
      </main>
    );
  }

  // =========================================
  // PAGE
  // =========================================

  return (
    <main className="my-orders-page">

      {/* ========================================= */}
      {/* HEADER */}
      {/* ========================================= */}

      <header className="my-orders-header">
        <div className="my-orders-header-inner">

          <button
            className="shop-back-button"
            onClick={() =>
              (window.location.href = "/")
            }
          >
            <span>←</span>
            <strong>NIJUM SHOP</strong>
          </button>

          <button
            className="logout-button"
            onClick={logout}
          >
            Logout
          </button>

        </div>
      </header>

      {/* ========================================= */}
      {/* CONTENT */}
      {/* ========================================= */}

      <div className="my-orders-container">

        {/* ========================================= */}
        {/* PAGE TITLE */}
        {/* ========================================= */}

        <div className="my-orders-title">

          <span className="title-small">
            WELCOME BACK
          </span>

          <h1>
            📦 My Orders
          </h1>

          <p>
            {user?.user_metadata?.full_name ||
              user?.email}
          </p>

        </div>

        {/* ========================================= */}
        {/* NO ORDERS */}
        {/* ========================================= */}

        {orders.length === 0 && (
          <div className="no-orders-card">

            <div className="no-orders-icon">
              📦
            </div>

            <h2>
              কোনো Order পাওয়া যায়নি
            </h2>

            <p>
              আপনি এখনো কোনো Order করেননি।
            </p>

            <button
              className="gold-button"
              onClick={() =>
                (window.location.href = "/")
              }
            >
              🛍️ Shop Now
            </button>

          </div>
        )}

        {/* ========================================= */}
        {/* ORDERS */}
        {/* ========================================= */}

        <div className="orders-list">

          {orders.map((order) => (

            <div
              key={order.id}
              className="order-card"
            >

              {/* ========================================= */}
              {/* ORDER HEADER */}
              {/* ========================================= */}

              <div className="order-card-header">

                <div>

                  <div className="order-number">
                    Order #{order.id}
                  </div>

                  <div className="order-date">
                    {new Date(
                      order.created_at
                    ).toLocaleString("en-BD")}
                  </div>

                </div>

                <span
                  className={`order-status ${
                    order.status.toLowerCase()
                  }`}
                >
                  {order.status}
                </span>

              </div>

              {/* ========================================= */}
              {/* PRODUCTS */}
              {/* ========================================= */}

              <div className="order-products">

                <h3>
                  Products
                </h3>

                {Array.isArray(order.items) &&
                  order.items.map(
                    (item, index) => (

                      <div
                        key={index}
                        className="order-product"
                      >

                        <div className="order-product-info">

                          <strong>
                            {item.product_name}
                          </strong>

                          <span>
                            ৳{item.price} ×{" "}
                            {item.quantity}
                          </span>

                        </div>

                        <strong className="product-subtotal">
                          ৳{item.subtotal}
                        </strong>

                      </div>

                    )
                  )}

              </div>

              {/* ========================================= */}
              {/* ORDER INFO */}
              {/* ========================================= */}

              <div className="order-information">

                <div className="info-row">

                  <strong>
                    Payment:
                  </strong>

                  <span>
                    {order.payment_method ===
                    "cod"
                      ? "Cash on Delivery"
                      : "Online Payment"}
                  </span>

                </div>

                <div className="info-row">

                  <strong>
                    Payment Status:
                  </strong>

                  <span
                    className={`payment-status ${
                      order.payment_status.toLowerCase()
                    }`}
                  >
                    {order.payment_status}
                  </span>

                </div>

                <div className="info-row address-row">

                  <strong>
                    Delivery Address:
                  </strong>

                  <span>
                    {order.customer_address}
                  </span>

                </div>

                {order.order_note && (
                  <div className="info-row">

                    <strong>
                      Note:
                    </strong>

                    <span>
                      {order.order_note}
                    </span>

                  </div>
                )}

                {/* ========================================= */}
                {/* TOTAL */}
                {/* ========================================= */}

                <div className="order-total-row">

                  <span>
                    Total
                  </span>

                  <strong>
                    ৳
                    {Number(
                      order.total_amount
                    )}
                  </strong>

                </div>

              </div>

            </div>

          ))}

        </div>

      </div>

    </main>
  );
}