"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import CustomerAuth from "./components/CustomerAuth";

type Product = {
  id: number;
  name: string;
  price: number;
  old_price: number;
  category: string;
  stock: number;
  image_url: string;
  description?: string;

  // =========================================
  // VENDOR ID
  // =========================================
  vendor_id?: string | null;
};

type CartItem = Product & {
  quantity: number;
};

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState("All Products");

  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [orderOpen, setOrderOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  const [customerUser, setCustomerUser] =
    useState<any>(null);

  const [submittingOrder, setSubmittingOrder] =
    useState(false);

  const [customerName, setCustomerName] =
    useState("");

  const [customerPhone, setCustomerPhone] =
    useState("");

  const [customerAddress, setCustomerAddress] =
    useState("");

  const [orderNote, setOrderNote] =
    useState("");

  const [paymentMethod, setPaymentMethod] =
    useState<"cod" | "sslcommerz">("cod");

  // =========================================
  // LOAD PRODUCTS
  // =========================================

  useEffect(() => {
    loadProducts();
  }, []);

  // =========================================
  // CHECK CUSTOMER LOGIN
  // =========================================

  useEffect(() => {
    checkCustomerLogin();

    const {
      data: authListener,
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setCustomerUser(
          session?.user || null
        );
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  async function checkCustomerLogin() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    setCustomerUser(user || null);
  }

  // =========================================
  // CUSTOMER LOGOUT
  // =========================================

  async function customerLogout() {
    await supabase.auth.signOut();

    setCustomerUser(null);

    alert("আপনি Logout করেছেন।");
  }

  // =========================================
  // LOAD PRODUCTS
  // =========================================

  async function loadProducts() {
    setLoadingProducts(true);

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("id", {
        ascending: false,
      });

    if (error) {
      console.error(
        "PRODUCT LOAD ERROR:",
        error
      );

      alert(
        "Products load করতে সমস্যা হয়েছে।"
      );

      setProducts([]);
    } else {
      setProducts(
        (data || []) as Product[]
      );
    }

    setLoadingProducts(false);
  }

  // =========================================
  // CATEGORIES
  // =========================================

  const categories = [
    "All Products",
    ...Array.from(
      new Set(
        products.map(
          (product) => product.category
        )
      )
    ),
  ];

  // =========================================
  // FILTER PRODUCTS
  // =========================================

  const filteredProducts = products.filter(
    (product) => {
      const categoryMatch =
        selectedCategory ===
          "All Products" ||
        product.category ===
          selectedCategory;

      const searchMatch =
        product.name
          .toLowerCase()
          .includes(
            search.toLowerCase()
          );

      return (
        categoryMatch &&
        searchMatch
      );
    }
  );

  // =========================================
  // CART COUNT
  // =========================================

  const cartCount = cart.reduce(
    (total, item) =>
      total + item.quantity,
    0
  );

  // =========================================
  // CART TOTAL
  // =========================================

  const cartTotal = cart.reduce(
    (total, item) =>
      total +
      Number(item.price) *
        Number(item.quantity),
    0
  );

  // =========================================
  // ADD TO CART
  // =========================================

  function addToCart(product: Product) {
    if (Number(product.stock) <= 0) {
      alert(
        "এই Product বর্তমানে Stock Out।"
      );

      return;
    }

    setCart((currentCart) => {
      // =========================================
      // VENDOR CHECK
      // =========================================
      //
      // একই Order-এর মধ্যে ভিন্ন Vendor-এর
      // Product রাখা হবে না।
      //
      // এতে ভুল Vendor-এর Order History-তে
      // Order চলে যাওয়ার সমস্যা হবে না।
      //
      if (
        currentCart.length > 0 &&
        currentCart[0].vendor_id !==
          product.vendor_id
      ) {
        alert(
          "একটি Order-এ একসাথে একজন Vendor-এর Product অর্ডার করুন।\n\nবর্তমান Cart খালি করে অন্য Vendor-এর Product যোগ করুন।"
        );

        return currentCart;
      }

      const existing =
        currentCart.find(
          (item) =>
            item.id === product.id
        );

      if (existing) {
        if (
          existing.quantity >=
          Number(product.stock)
        ) {
          alert(
            "Stock অনুযায়ী এর বেশি যোগ করা যাবে না।"
          );

          return currentCart;
        }

        return currentCart.map(
          (item) =>
            item.id === product.id
              ? {
                  ...item,
                  quantity:
                    item.quantity + 1,
                }
              : item
        );
      }

      return [
        ...currentCart,
        {
          ...product,
          quantity: 1,
        },
      ];
    });

    setCartOpen(true);
  }

  // =========================================
  // INCREASE QUANTITY
  // =========================================

  function increaseQuantity(id: number) {
    setCart((currentCart) =>
      currentCart.map((item) => {
        if (item.id !== id) {
          return item;
        }

        if (
          item.quantity >=
          Number(item.stock)
        ) {
          alert(
            "Stock অনুযায়ী এর বেশি যোগ করা যাবে না।"
          );

          return item;
        }

        return {
          ...item,
          quantity:
            item.quantity + 1,
        };
      })
    );
  }

  // =========================================
  // DECREASE QUANTITY
  // =========================================

  function decreaseQuantity(id: number) {
    setCart((currentCart) =>
      currentCart
        .map((item) =>
          item.id === id
            ? {
                ...item,
                quantity:
                  item.quantity - 1,
              }
            : item
        )
        .filter(
          (item) =>
            item.quantity > 0
        )
    );
  }

  // =========================================
  // REMOVE FROM CART
  // =========================================

  function removeFromCart(id: number) {
    setCart((currentCart) =>
      currentCart.filter(
        (item) => item.id !== id
      )
    );
  }

  // =========================================
  // OPEN ORDER FORM
  // =========================================

  function openOrderForm() {
    if (!customerUser) {
      setCartOpen(false);

      alert(
        "Order করতে হলে প্রথমে Login / Signup করুন।"
        
      );
      window.location.href = "/customer/login";

      return;
    }

    if (cart.length === 0) {
      alert(
        "প্রথমে Cart-এ একটি পণ্য যোগ করুন।"
      );

      return;
    }

    setCartOpen(false);
    setOrderOpen(true);
  }

  // =========================================
  // SUBMIT ORDER
  // =========================================

  async function submitOrder() {
    if (submittingOrder) {
      return;
    }

    // =========================================
    // VALIDATION
    // =========================================

    if (
      !customerName.trim() ||
      !customerPhone.trim() ||
      !customerAddress.trim()
    ) {
      alert(
        "দয়া করে নাম, মোবাইল নম্বর এবং ঠিকানা পূরণ করুন।"
      );

      return;
    }

    if (cart.length === 0) {
      alert(
        "Cart খালি। প্রথমে একটি পণ্য যোগ করুন।"
      );

      return;
    }

    // =========================================
    // GET CURRENT USER
    // =========================================

    const {
      data: {
        user,
      },
    } = await supabase.auth.getUser();

    /*
      Login করা থাকলে user.id যাবে।
      Login না থাকলে customerUser-এর id
      fallback হিসেবে ব্যবহার হবে।
    */

    const userId =
      user?.id ||
      customerUser?.id ||
      null;

    console.log(
      "CURRENT CUSTOMER USER:",
      user
    );

    console.log(
      "ORDER USER ID:",
      userId
    );

    // =========================================
    // VENDOR ID
    // =========================================
    //
    // একটি Order-এর Cart একই Vendor-এর
    // Product দিয়ে তৈরি হবে।
    //
    // তাই cart[0].vendor_id পুরো Order-এর
    // vendor_id হিসেবে save করা নিরাপদ।
    //
    // vendor_id null হলে এটি Admin-created
    // product/order হতে পারে।
    // =========================================

    const orderVendorId =
      cart.length > 0
        ? cart[0].vendor_id || null
        : null;

    console.log(
      "ORDER VENDOR ID:",
      orderVendorId
    );

    // =========================================
    // EXTRA VENDOR SAFETY CHECK
    // =========================================

    const hasMultipleVendors =
      cart.some(
        (item) =>
          item.vendor_id !==
          cart[0].vendor_id
      );

    if (hasMultipleVendors) {
      alert(
        "একটি Order-এর মধ্যে একাধিক Vendor-এর Product রাখা যাবে না। Cart ঠিক করে আবার Order করুন।"
      );

      return;
    }

    // =========================================
    // CREATE ORDER ITEMS
    // =========================================

    const orderItems = cart.map(
      (item) => ({
        product_id:
          Number(item.id),

        product_name:
          item.name,

        category:
          item.category,

        price:
          Number(item.price),

        quantity:
          Number(item.quantity),

        subtotal:
          Number(item.price) *
          Number(item.quantity),

        image_url:
          item.image_url || "",

        // =========================================
        // VENDOR ID INSIDE ORDER ITEM
        // =========================================

        vendor_id:
          item.vendor_id || null,
      })
    );

    console.log(
      "ORDER ITEMS:",
      orderItems
    );

    try {
      setSubmittingOrder(true);

      // =========================================
      // SAVE ORDER TO SUPABASE
      // =========================================

      const {
        data: savedOrder,
        error: orderError,
      } = await supabase
        .from("orders")
        .insert({
          customer_name:
            customerName.trim(),

          customer_phone:
            customerPhone.trim(),

          customer_address:
            customerAddress.trim(),

          order_note:
            orderNote.trim() || null,

          items:
            orderItems,

          total_amount:
            Number(cartTotal),

          status:
            "pending",

          // =========================================
          // CUSTOMER USER ID
          // =========================================

          user_id:
            userId,

          // =========================================
          // VENDOR ID
          // =========================================
          //
          // এই অংশটাই Vendor Order History-এর
          // জন্য সবচেয়ে গুরুত্বপূর্ণ।
          // =========================================

          vendor_id:
            orderVendorId,

          payment_method:
            paymentMethod,

          payment_status:
            "pending",

          transaction_id:
            null,
        })
        .select()
        .single();

      // =========================================
      // ORDER SAVE ERROR
      // =========================================

      if (orderError) {
        console.error(
          "ORDER ERROR:",
          orderError
        );

        console.error(
          "ORDER ERROR MESSAGE:",
          orderError.message
        );

        console.error(
          "ORDER ERROR DETAILS:",
          orderError.details
        );

        console.error(
          "ORDER ERROR HINT:",
          orderError.hint
        );

        console.error(
          "ORDER ERROR CODE:",
          orderError.code
        );

        alert(
          `Order Save হয়নি!

${orderError.message}`
        );

        return;
      }

      // =========================================
      // ORDER SUCCESS
      // =========================================

      console.log(
        "ORDER SAVED SUCCESSFULLY:",
        savedOrder
      );

      console.log(
        "SAVED ORDER ID:",
        savedOrder?.id
      );

      console.log(
        "SAVED USER ID:",
        savedOrder?.user_id
      );

      console.log(
        "SAVED VENDOR ID:",
        savedOrder?.vendor_id
      );

      // =========================================
      // CASH ON DELIVERY
      // =========================================

      if (
        paymentMethod === "cod"
      ) {
        const orderDetails =
          cart
            .map(
              (item) =>
                `${item.name} x ${
                  item.quantity
                } = ৳${
                  Number(
                    item.price
                  ) *
                  Number(
                    item.quantity
                  )
                }`
            )
            .join("\n");

        const message =
          `NIJUM SHOP Order

Order ID: ${
            savedOrder.id
          }

Customer Name: ${
            customerName.trim()
          }
Mobile: ${
            customerPhone.trim()
          }
Address: ${
            customerAddress.trim()
          }

Payment Method: Cash on Delivery

Products:
${orderDetails}

Total: ৳${cartTotal}

Note: ${
            orderNote.trim() ||
            "N/A"
          }`;

        // =========================================
        // WHATSAPP
        // =========================================

        const whatsappUrl =
          "https://wa.me/8801756252219?text=" +
          encodeURIComponent(
            message
          );

        window.open(
          whatsappUrl,
          "_blank"
        );

        // =========================================
        // RESET
        // =========================================

        setCart([]);

        setOrderOpen(false);

        setCustomerName("");

        setCustomerPhone("");

        setCustomerAddress("");

        setOrderNote("");

        setPaymentMethod("cod");

        alert(
          "✅ Cash on Delivery Order সফলভাবে গ্রহণ করা হয়েছে!"
        );

        return;
      }

      // =========================================
      // SSL COMMERZ ONLINE PAYMENT
      // =========================================

      if (
        paymentMethod ===
        "sslcommerz"
      ) {
        console.log(
          "Starting SSLCommerz payment..."
        );

        const response =
          await fetch(
            "/api/payment/initiate",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                orderId:
                  savedOrder.id,

                customerName:
                  customerName.trim(),

                customerPhone:
                  customerPhone.trim(),

                customerAddress:
                  customerAddress.trim(),

                totalAmount:
                  Number(
                    cartTotal
                  ),
              }),
            }
          );

        // =========================================
        // READ RAW RESPONSE
        // =========================================

        const responseText =
          await response.text();

        console.log(
          "PAYMENT API STATUS:",
          response.status
        );

        console.log(
          "PAYMENT API RAW RESPONSE:",
          responseText
        );

        // =========================================
        // PARSE JSON
        // =========================================

        let paymentData: any =
          {};

        try {
          paymentData =
            responseText
              ? JSON.parse(
                  responseText
                )
              : {};
        } catch (error) {
          console.error(
            "PAYMENT JSON PARSE ERROR:",
            error
          );

          alert(
            "Payment server থেকে সঠিক response পাওয়া যায়নি।"
          );

          return;
        }

        // =========================================
        // PAYMENT API ERROR
        // =========================================

        // =========================================
// PAYMENT API ERROR
// =========================================

if (!response.ok) {
  console.error(
    "========================================="
  );

  console.error(
    "SSLCommerz Payment Initiation Failed"
  );

  console.error(
    "PAYMENT HTTP STATUS:",
    response.status
  );

  console.error(
    "PAYMENT HTTP STATUS TEXT:",
    response.statusText
  );

  console.error(
    "PAYMENT RAW RESPONSE:",
    responseText
  );

  console.error(
    "PAYMENT JSON RESPONSE:",
    paymentData
  );

  console.error(
    "========================================="
  );

  const errorMessage =
    paymentData?.message ||
    paymentData?.failedreason ||
    paymentData?.failedReason ||
    paymentData?.error ||
    responseText ||
    `Payment failed. HTTP ${response.status}`;

  alert(
    `❌ SSLCommerz Payment শুরু করা যায়নি।

${errorMessage}`
  );

  return;
}

        // =========================================
        // GET PAYMENT URL
        // =========================================

        const gatewayUrl =
          paymentData?.paymentUrl ||
          paymentData?.GatewayPageURL;

        if (!gatewayUrl) {
          console.error(
            "PAYMENT URL MISSING:",
            paymentData
          );

          alert(
            "SSLCommerz Payment Gateway URL পাওয়া যায়নি।"
          );

          return;
        }

        // =========================================
        // PAYMENT URL CREATED
        // =========================================

        console.log(
          "PAYMENT GATEWAY URL:",
          gatewayUrl
        );

        // =========================================
        // CLEAR CART
        // =========================================

        setCart([]);

        setOrderOpen(false);

        setCustomerName("");

        setCustomerPhone("");

        setCustomerAddress("");

        setOrderNote("");

        setPaymentMethod("cod");

        // =========================================
        // REDIRECT TO SSL COMMERZ
        // =========================================

        window.location.href =
          gatewayUrl;

        return;
      }
    } catch (error) {
  console.error(
    "========================================="
  );

  console.error(
    "UNEXPECTED ORDER / PAYMENT ERROR:"
  );

  console.error(
    error
  );

  console.error(
    "========================================="
  );

  alert(
    "Order করার সময় একটি সমস্যা হয়েছে। Console খুলে বিস্তারিত Error দেখুন।"
  );
} finally {
      setSubmittingOrder(false);
    }
  }

  // =========================================
  // RETURN
  // =========================================

  return (
    <main>

      {/* ========================================= */}
      {/* HEADER */}
      {/* ========================================= */}

      <header className="header">
        <div className="container header-content">

          <div className="logo">

            <div className="logo-icon">
              N
            </div>

            <div>

              <div className="logo-name">
                NIJUM SHOP
              </div>

              <div className="logo-tagline">
                Gadgets & Varieties
              </div>

            </div>

          </div>

          <div className="search-box">

            <span>
              🔍
            </span>

            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
            />

          </div>

          {/* ========================================= */}
          {/* CUSTOMER LOGIN */}
          {/* ========================================= */}

          {customerUser ? (
            <div className="customer-account">

              <button
                className="customer-account-button"
                onClick={() =>
                  (window.location.href =
                    "/my-orders")
                }
              >
                👤{" "}
                {customerUser.user_metadata
                  ?.full_name ||
                  customerUser.email}
              </button>

              <button
                className="customer-account-button"
                onClick={() =>
                  (window.location.href =
                    "/my-orders")
                }
              >
                📦 My Orders
              </button>

              <button
                className="customer-logout-button"
                onClick={customerLogout}
              >
                Logout
              </button>

            </div>
          ) : (
            <button
              className="customer-login-button"
              onClick={() =>
                (window.location.href = "/customer/login")
              }
            >
              👤 Login / Signup
            </button>
          )}

          {/* ========================================= */}
          {/* CART */}
          {/* ========================================= */}

          <button
            className="cart-button"
            onClick={() =>
              setCartOpen(true)
            }
          >
            🛒 Cart

            <span className="cart-count">
              {cartCount}
            </span>

          </button>

        </div>
      </header>

      {/* ========================================= */}
      {/* NAVIGATION */}
      {/* ========================================= */}

      <nav className="navigation">
        <div className="container nav-content">

          <a href="#home">
            Home
          </a>

          <a href="#products">
            Products
          </a>

          <a href="#categories">
            Categories
          </a>

          <a href="#about">
            About Us
          </a>

          <a href="#contact">
            Contact
          </a>

        </div>
      </nav>

      {/* ========================================= */}
      {/* HERO */}
      {/* ========================================= */}

      <section
        className="hero"
        id="home"
      >
        <div className="container hero-content">

          <div className="hero-text">

            <span className="hero-badge">
              ✨ Welcome to NIJUM SHOP
            </span>

            <h1>
              Your Trusted
              <br />
              <span>
                Gadget Store
              </span>
            </h1>

            <p>
              Gadgets, accessories and varieties —
              সবকিছু এখন এক জায়গায়। ভালো পণ্য,
              সাশ্রয়ী দাম এবং বিশ্বস্ত সেবা।
            </p>

            <div className="hero-buttons">

              <a
                href="#products"
                className="primary-button"
              >
                🛍️ Shop Now
              </a>

              <a
                href="tel:01756252219"
                className="secondary-button"
              >
                📞 Call Now
              </a>

            </div>

          </div>

          <div className="hero-image">

            <div className="hero-circle">

              <div className="hero-products">

                <span>📱</span>
                <span>⌚</span>
                <span>🎧</span>
                <span>🔊</span>

              </div>

            </div>

          </div>

        </div>
      </section>

      {/* ========================================= */}
      {/* FEATURES */}
      {/* ========================================= */}

      <section className="features">

        <div className="container features-grid">

          <div className="feature">

            <div className="feature-icon">
              🚚
            </div>

            <div>

              <h3>
                Fast Delivery
              </h3>

              <p>
                দ্রুত পণ্য ডেলিভারি
              </p>

            </div>

          </div>

          <div className="feature">

            <div className="feature-icon">
              💰
            </div>

            <div>

              <h3>
                Best Price
              </h3>

              <p>
                সাশ্রয়ী মূল্যে পণ্য
              </p>

            </div>

          </div>

          <div className="feature">

            <div className="feature-icon">
              ✅
            </div>

            <div>

              <h3>
                Quality Products
              </h3>

              <p>
                মানসম্মত পণ্য
              </p>

            </div>

          </div>

          <div className="feature">

            <div className="feature-icon">
              ☎️
            </div>

            <div>

              <h3>
                Support
              </h3>

              <p>
                সরাসরি যোগাযোগ
              </p>

            </div>

          </div>

        </div>
      </section>

      {/* ========================================= */}
      {/* CATEGORIES */}
      {/* ========================================= */}

      <section
        className="section"
        id="categories"
      >

        <div className="container">

          <div className="section-heading">

            <span>
              Explore
            </span>

            <h2>
              Shop by Category
            </h2>

            <p>
              আপনার পছন্দের ক্যাটাগরি থেকে
              পণ্য বেছে নিন
            </p>

          </div>

          <div className="category-grid">

            {categories.map(
              (category) => (

                <button
                  key={category}
                  className={`category-card ${
                    selectedCategory ===
                    category
                      ? "active"
                      : ""
                  }`}
                  onClick={() =>
                    setSelectedCategory(
                      category
                    )
                  }
                >

                  <span className="category-icon">

                    {category ===
                    "All Products"
                      ? "🛍️"
                      : "📱"}

                  </span>

                  <span>
                    {category}
                  </span>

                </button>

              )
            )}

          </div>

        </div>
      </section>

      {/* ========================================= */}
      {/* PRODUCTS */}
      {/* ========================================= */}

      <section
        className="section products-section"
        id="products"
      >

        <div className="container">

          <div className="section-heading">

            <span>
              Our Collection
            </span>

            <h2>
              Popular Products
            </h2>

            <p>
              জনপ্রিয় ও প্রয়োজনীয় কিছু পণ্য
            </p>

          </div>

          {/* LOADING */}

          {loadingProducts && (

            <div className="no-products">

              <div>
                ⏳
              </div>

              <h3>
                Products Loading...
              </h3>

              <p>
                একটু অপেক্ষা করুন।
              </p>

            </div>

          )}

          {/* PRODUCTS */}

          {!loadingProducts &&
            filteredProducts.length >
              0 && (

              <div className="products-grid">

                {filteredProducts.map(
                  (product) => (

                    <div
                      className="product-card"
                      key={product.id}
                    >

                      <div className="product-image">

                        <img
                          src={
                            product.image_url
                          }
                          alt={
                            product.name
                          }
                          className="product-photo"
                        />

                        {Number(
                          product.old_price
                        ) >
                          Number(
                            product.price
                          ) && (

                          <div className="discount">
                            SALE
                          </div>

                        )}

                      </div>

                      <div className="product-info">

                        <span className="product-category">
                          {
                            product.category
                          }
                        </span>

                        <h3>
                          {
                            product.name
                          }
                        </h3>

                        <div className="rating">
                          ★★★★★
                        </div>

                        <div className="price-row">

                          <strong>
                            ৳
                            {
                              product.price
                            }
                          </strong>

                          {Number(
                            product.old_price
                          ) > 0 && (

                            <del>
                              ৳
                              {
                                product.old_price
                              }
                            </del>

                          )}

                        </div>

                        <div
                          style={{
                            marginBottom:
                              "10px",
                            fontSize:
                              "14px",
                          }}
                        >

                          {Number(
                            product.stock
                          ) > 0 ? (

                            <span>
                              ✅ Stock:{" "}
                              {
                                product.stock
                              }
                            </span>

                          ) : (

                            <span>
                              ❌ Stock Out
                            </span>

                          )}

                        </div>

                        <button
                          className="add-cart"
                          onClick={() =>
                            addToCart(
                              product
                            )
                          }
                          disabled={
                            Number(
                              product.stock
                            ) <= 0
                          }
                        >

                          {Number(
                            product.stock
                          ) > 0
                            ? "🛒 Add to Cart"
                            : "❌ Stock Out"}

                        </button>

                      </div>

                    </div>

                  )
                )}

              </div>

            )}

          {/* NO PRODUCTS */}

          {!loadingProducts &&
            filteredProducts.length ===
              0 && (

              <div className="no-products">

                <div>
                  😔
                </div>

                <h3>
                  কোনো পণ্য পাওয়া যায়নি
                </h3>

                <p>
                  অন্য কোনো নাম দিয়ে
                  Search করুন।
                </p>

              </div>

            )}

        </div>
      </section>

      {/* ========================================= */}
      {/* OFFER */}
      {/* ========================================= */}

      <section className="offer-section">

        <div className="container offer">

          <div>

            <span>
              🔥 SPECIAL OFFER
            </span>

            <h2>
              আপনার পছন্দের Gadgets
              এখন আরও সাশ্রয়ী!
            </h2>

            <p>
              আজই অর্ডার করুন এবং আপনার
              প্রয়োজনীয় পণ্যটি নিয়ে নিন।
            </p>

          </div>

          <a
            href="#products"
            className="offer-button"
          >
            View Products →
          </a>

        </div>
      </section>

      {/* ========================================= */}
      {/* ABOUT */}
      {/* ========================================= */}

      <section
        className="about section"
        id="about"
      >

        <div className="container about-grid">

          <div className="about-logo">

            <div className="big-logo">
              N
            </div>

            <h2>
              NIJUM SHOP
            </h2>

            <p>
              Gadgets & Varieties
            </p>

          </div>

          <div className="about-text">

            <span>
              ABOUT US
            </span>

            <h2>
              আপনার বিশ্বস্ত অনলাইন শপ
            </h2>

            <p>
              NIJUM SHOP-এ আপনাকে
              স্বাগতম। আমরা বিভিন্ন ধরনের
              Gadgets, Mobile Accessories
              এবং প্রয়োজনীয় Variety
              Products নিয়ে কাজ করছি।
            </p>

            <p>
              আমাদের লক্ষ্য হলো ভালো
              মানের পণ্য সাশ্রয়ী মূল্যে
              আপনাদের কাছে পৌঁছে দেওয়া।
            </p>

            <div className="about-points">

              <div>
                ✓ Quality Products
              </div>

              <div>
                ✓ Affordable Price
              </div>

              <div>
                ✓ Customer Support
              </div>

              <div>
                ✓ Fast Service
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* ========================================= */}
      {/* CONTACT */}
      {/* ========================================= */}

      <section
        className="contact-section"
        id="contact"
      >

        <div className="container contact-content">

          <div>

            <span>
              GET IN TOUCH
            </span>

            <h2>
              আমাদের সাথে যোগাযোগ করুন
            </h2>

            <p>
              পণ্য সম্পর্কে জানতে বা
              অর্ডার করতে সরাসরি
              যোগাযোগ করুন।
            </p>

          </div>

          <div className="contact-details">

            <a href="tel:01756252219">
              📞 01756252219
            </a>

            <div>
              📍 Katakhali Bazar,
              Hatiya, Noakhali
            </div>

          </div>

        </div>
      </section>

      {/* ========================================= */}
      {/* FOOTER */}
      {/* ========================================= */}

      <footer className="footer">

        <div className="container footer-grid">

          <div>

            <div className="footer-logo">
              NIJUM SHOP
            </div>

            <p>
              Gadgets & Varieties
            </p>

            <p className="footer-description">
              আপনার প্রয়োজনীয় Gadgets ও
              Varieties-এর বিশ্বস্ত ঠিকানা।
            </p>

          </div>

          <div>

            <h3>
              Quick Links
            </h3>

            <a href="#home">
              Home
            </a>

            <a href="#products">
              Products
            </a>

            <a href="#categories">
              Categories
            </a>

            <a href="#about">
              About Us
            </a>

          </div>

          <div>

            <h3>
              Contact
            </h3>

            <p>
              📞 01756252219
            </p>

            <p>
              📍 Katakhali Bazar
            </p>

            <p>
              Hatiya, Noakhali
            </p>

          </div>

        </div>

        <div className="copyright">

          ©{" "}
          {new Date().getFullYear()}{" "}
          NIJUM SHOP. All Rights Reserved.

        </div>

      </footer>

      {/* ========================================= */}
      {/* FLOATING CALL */}
      {/* ========================================= */}

      <a
        href="tel:01756252219"
        className="floating-call"
      >
        📞
      </a>

      {/* ========================================= */}
      {/* CUSTOMER AUTH */}
      {/* ========================================= */}

      <CustomerAuth
        open={authOpen}
        onClose={() =>
          setAuthOpen(false)
        }
      />

      {/* ========================================= */}
      {/* CART DRAWER */}
      {/* ========================================= */}

      {cartOpen && (

        <div
          className="modal-overlay"
          onClick={() =>
            setCartOpen(false)
          }
        >

          <div
            className="cart-drawer"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="modal-header">

              <h2>
                🛒 Your Cart
              </h2>

              <button
                className="close-button"
                onClick={() =>
                  setCartOpen(false)
                }
              >
                ✕
              </button>

            </div>

            {cart.length ===
            0 ? (

              <div className="empty-cart">

                <div>
                  🛒
                </div>

                <h3>
                  Your Cart is Empty
                </h3>

                <p>
                  পছন্দের পণ্য Cart-এ
                  যোগ করুন।
                </p>

              </div>

            ) : (

              <>

                <div className="cart-items">

                  {cart.map(
                    (item) => (

                      <div
                        className="cart-item"
                        key={item.id}
                      >

                        <img
                          src={
                            item.image_url
                          }
                          alt={
                            item.name
                          }
                        />

                        <div className="cart-item-info">

                          <h3>
                            {
                              item.name
                            }
                          </h3>

                          <strong>
                            ৳
                            {
                              item.price
                            }
                          </strong>

                          <div className="quantity">

                            <button
                              onClick={() =>
                                decreaseQuantity(
                                  item.id
                                )
                              }
                            >
                              −
                            </button>

                            <span>
                              {
                                item.quantity
                              }
                            </span>

                            <button
                              onClick={() =>
                                increaseQuantity(
                                  item.id
                                )
                              }
                            >
                              +
                            </button>

                            <button
                              className="remove"
                              onClick={() =>
                                removeFromCart(
                                  item.id
                                )
                              }
                            >
                              🗑️
                            </button>

                          </div>

                        </div>

                      </div>
                    )
                  )}

                </div>

                <div className="cart-summary">

                  <div>

                    <span>
                      Total Items
                    </span>

                    <strong>
                      {
                        cartCount
                      }
                    </strong>

                  </div>

                  <div className="cart-total">

                    <span>
                      Total
                    </span>

                    <strong>
                      ৳
                      {
                        cartTotal
                      }
                    </strong>

                  </div>

                  <button
                    className="checkout-button"
                    onClick={
                      openOrderForm
                    }
                  >
                    🧾 Order Now
                  </button>

                </div>

              </>

            )}

          </div>

        </div>

      )}

      {/* ========================================= */}
      {/* ORDER FORM */}
      {/* ========================================= */}

      {orderOpen && (

        <div
          className="modal-overlay"
          onClick={() =>
            setOrderOpen(false)
          }
        >

          <div
            className="order-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="modal-header">

              <h2>
                🧾 Order Information
              </h2>

              <button
                className="close-button"
                onClick={() =>
                  setOrderOpen(false)
                }
              >
                ✕
              </button>

            </div>

            <p className="order-intro">
              নিচের তথ্যগুলো পূরণ করে
              Payment Method নির্বাচন করুন।
            </p>

            {customerUser && (
              <div
                style={{
                  background: "#584b3e",
                  border: "1px solid #777676",
                  padding: "12px",
                  borderRadius: "10px",
                  marginBottom: "15px",
                }}
              >
                👤 আপনি Login করা অবস্থায় Order করছেন।

                <br />

                <small>
                  Account:{" "}
                  {customerUser.user_metadata?.full_name ||
                    customerUser.email}
                </small>
              </div>
            )}

            {/* CUSTOMER NAME */}

            <label>
              Customer Name *
            </label>

            <input
              type="text"
              placeholder="আপনার নাম"
              value={customerName}
              onChange={(e) =>
                setCustomerName(
                  e.target.value
                )
              }
            />

            {/* MOBILE */}

            <label>
              Mobile Number *
            </label>

            <input
              type="tel"
              placeholder="01XXXXXXXXX"
              value={customerPhone}
              onChange={(e) =>
                setCustomerPhone(
                  e.target.value
                )
              }
            />

            {/* ADDRESS */}

            <label>
              Full Address *
            </label>

            <textarea
              placeholder="আপনার সম্পূর্ণ ঠিকানা"
              value={
                customerAddress
              }
              onChange={(e) =>
                setCustomerAddress(
                  e.target.value
                )
              }
              rows={4}
            />

            {/* PAYMENT METHOD */}

            <label>
              Payment Method *
            </label>

            <div className="payment-methods">

              {/* COD */}

              <label className="payment-option">

                <input
                  type="radio"
                  name="paymentMethod"
                  value="cod"
                  checked={
                    paymentMethod ===
                    "cod"
                  }
                  onChange={() =>
                    setPaymentMethod(
                      "cod"
                    )
                  }
                />

                <span>
                  💵 Cash on Delivery
                </span>

              </label>

              {/* SSL COMMERZ */}

              <label className="payment-option">

                <input
                  type="radio"
                  name="paymentMethod"
                  value="sslcommerz"
                  checked={
                    paymentMethod ===
                    "sslcommerz"
                  }
                  onChange={() =>
                    setPaymentMethod(
                      "sslcommerz"
                    )
                  }
                />

                <span>
                  💳 Online Payment

                  <small>
                    {" "}
                    SSLCommerz
                  </small>

                </span>

              </label>

            </div>

            {/* ORDER NOTE */}

            <label>
              Order Note
            </label>

            <textarea
              placeholder="কোনো অতিরিক্ত কথা থাকলে লিখুন"
              value={orderNote}
              onChange={(e) =>
                setOrderNote(
                  e.target.value
                )
              }
              rows={3}
            />

            {/* TOTAL */}

            <div className="order-total">

              <span>
                মোট অর্ডার মূল্য:
              </span>

              <strong>
                ৳
                {
                  cartTotal
                }
              </strong>

            </div>

            {/* CONFIRM BUTTON */}

            <button
              className="confirm-order"
              onClick={
                submitOrder
              }
              disabled={
                submittingOrder
              }
            >

              {submittingOrder
                ? "⏳ Processing..."
                : paymentMethod ===
                  "cod"
                ? "✅ Confirm Order"
                : "💳 Pay Now"}

            </button>

            {/* PAYMENT MESSAGE */}

            <p className="whatsapp-note">

              {paymentMethod ===
              "cod"
                ? "Cash on Delivery নির্বাচন করলে Order WhatsApp-এ পাঠানো হবে।"
                : "Online Payment নির্বাচন করলে আপনাকে SSLCommerz Payment Gateway-তে নিয়ে যাওয়া হবে।"}

            </p>

          </div>

        </div>

      )}

    </main>
  );
}