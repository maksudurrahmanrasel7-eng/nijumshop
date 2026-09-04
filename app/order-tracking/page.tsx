"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

type Order = {
  id: number;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  order_note: string | null;
  items: any;
  total_amount: number;
  status: string;
  created_at: string;
};

export default function OrderTrackingPage() {
  const [orderId, setOrderId] = useState("");
  const [phone, setPhone] = useState("");

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function searchOrder(e: React.FormEvent) {
    e.preventDefault();

    setError("");
    setOrder(null);

    if (!orderId || !phone) {
      setError("Order ID এবং মোবাইল নম্বর দিন।");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("id", Number(orderId))
      .eq("customer_phone", phone.trim())
      .single();

    setLoading(false);

    if (error || !data) {
      setError("এই Order ID এবং মোবাইল নম্বর দিয়ে কোনো Order পাওয়া যায়নি।");
      return;
    }

    setOrder(data);
  }

  function getStatusText(status: string) {
    switch (status) {
      case "pending":
        return "⏳ Pending";

      case "confirmed":
        return "✅ Confirmed";

      case "delivered":
        return "🚚 Delivered";

      case "cancelled":
        return "❌ Cancelled";

      default:
        return status;
    }
  }

  function getStatusClass(status: string) {
    switch (status) {
      case "pending":
        return "tracking-status pending";

      case "confirmed":
        return "tracking-status confirmed";

      case "delivered":
        return "tracking-status delivered";

      case "cancelled":
        return "tracking-status cancelled";

      default:
        return "tracking-status";
    }
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleString("en-BD", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  return (
    <main className="tracking-page">

      <div className="tracking-container">

        {/* HEADER */}

        <div className="tracking-header">

          <div className="tracking-logo">
            N
          </div>

          <h1>NIJUM SHOP</h1>

          <p>
            📦 Track Your Order
          </p>

        </div>


        {/* SEARCH CARD */}

        <div className="tracking-card">

          <div className="tracking-card-header">

            <span>ORDER TRACKING</span>

            <h2>আপনার Order খুঁজুন</h2>

            <p>
              আপনার Order ID এবং Order করার সময় ব্যবহৃত
              মোবাইল নম্বর দিন।
            </p>

          </div>


          <form onSubmit={searchOrder}>

            <label>
              Order ID
            </label>

            <input
              type="number"
              value={orderId}
              onChange={(e) =>
                setOrderId(e.target.value)
              }
              placeholder="যেমন: 12"
            />


            <label>
              মোবাইল নম্বর
            </label>

            <input
              type="tel"
              value={phone}
              onChange={(e) =>
                setPhone(e.target.value)
              }
              placeholder="01XXXXXXXXX"
            />


            {error && (
              <div className="tracking-error">
                ⚠️ {error}
              </div>
            )}


            <button
              type="submit"
              className="tracking-button"
              disabled={loading}
            >
              {loading
                ? "⏳ খোঁজা হচ্ছে..."
                : "🔍 Track Order"}
            </button>

          </form>

        </div>


        {/* ORDER RESULT */}

        {order && (

          <div className="tracking-result">

            <div className="tracking-result-header">

              <div>

                <span>ORDER FOUND</span>

                <h2>
                  Order #{order.id}
                </h2>

              </div>

              <div
                className={getStatusClass(
                  order.status
                )}
              >
                {getStatusText(order.status)}
              </div>

            </div>


            {/* CUSTOMER INFO */}

            <div className="tracking-info-grid">

              <div className="tracking-info-box">

                <span>Customer</span>

                <strong>
                  {order.customer_name}
                </strong>

              </div>


              <div className="tracking-info-box">

                <span>Phone</span>

                <strong>
                  {order.customer_phone}
                </strong>

              </div>


              <div className="tracking-info-box">

                <span>Order Date</span>

                <strong>
                  {formatDate(order.created_at)}
                </strong>

              </div>


              <div className="tracking-info-box">

                <span>Total Amount</span>

                <strong className="tracking-price">
                  ৳{Number(
                    order.total_amount || 0
                  ).toLocaleString()}
                </strong>

              </div>

            </div>


            {/* ADDRESS */}

            <div className="tracking-address">

              <span>Delivery Address</span>

              <p>
                📍 {order.customer_address}
              </p>

            </div>


            {/* NOTE */}

            {order.order_note && (

              <div className="tracking-note">

                <span>Order Note</span>

                <p>
                  📝 {order.order_note}
                </p>

              </div>

            )}


            {/* ITEMS */}

            <div className="tracking-items">

              <h3>
                🛍️ Ordered Products
              </h3>


              {Array.isArray(order.items) ? (

                order.items.map(
                  (item: any, index: number) => (

                    <div
                      className="tracking-item"
                      key={index}
                    >

                      <div>

                        <strong>
                          {item.name ||
                            item.product_name ||
                            "Product"}
                        </strong>

                        <span>
                          Quantity:{" "}
                          {item.quantity || 1}
                        </span>

                      </div>


                      <strong>
                        ৳
                        {Number(
                          item.price || 0
                        ) *
                          Number(
                            item.quantity || 1
                          )}
                      </strong>

                    </div>

                  )
                )

              ) : (

                <div className="tracking-item">

                  <strong>
                    Order Items
                  </strong>

                  <span>
                    Order-এর Product Details
                    এখানে সংরক্ষিত আছে।
                  </span>

                </div>

              )}

            </div>


            {/* TOTAL */}

            <div className="tracking-total">

              <span>
                Total
              </span>

              <strong>
                ৳
                {Number(
                  order.total_amount || 0
                ).toLocaleString()}
              </strong>

            </div>


            {/* STATUS MESSAGE */}

            <div className="tracking-status-message">

              {order.status === "pending" && (
                <>
                  <strong>
                    ⏳ আপনার Order Pending
                  </strong>

                  <p>
                    আপনার Order আমরা পেয়েছি।
                    খুব শীঘ্রই Confirm করা হবে।
                  </p>
                </>
              )}


              {order.status === "confirmed" && (
                <>
                  <strong>
                    ✅ আপনার Order Confirmed
                  </strong>

                  <p>
                    আপনার Order Confirm করা হয়েছে।
                    Delivery-এর জন্য প্রস্তুত করা হচ্ছে।
                  </p>
                </>
              )}


              {order.status === "delivered" && (
                <>
                  <strong>
                    🚚 Order Delivered
                  </strong>

                  <p>
                    আপনার Order সফলভাবে Delivered হয়েছে।
                  </p>
                </>
              )}


              {order.status === "cancelled" && (
                <>
                  <strong>
                    ❌ Order Cancelled
                  </strong>

                  <p>
                    দুঃখিত, আপনার Order টি Cancel করা হয়েছে।
                  </p>
                </>
              )}

            </div>


            {/* BACK TO SHOP */}

            <a
              href="/"
              className="tracking-shop-button"
            >
              🛍️ Continue Shopping
            </a>

          </div>

        )}

      </div>

    </main>
  );
}