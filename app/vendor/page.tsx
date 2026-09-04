"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

/* =====================================================
   TYPES
===================================================== */

type Profile = {
  id: string;
  name: string | null;
  phone: string | null;
  role: string;
  membership_status: string;
  shop_name: string | null;
  shop_address: string | null;
};

type Product = {
  id: number;
  name: string;
  price: number;
  old_price: number;
  category: string;
  stock: number;
  image_url: string;
  description?: string;
  vendor_id: string | null;
};

type Order = {
  id: number;
  customer_name: string;
  customer_phone: string;
  total_amount: number;
  status: string;
  created_at: string;
  vendor_id: string | null;

  /* Optional fields - থাকলে automatically ব্যবহার হবে */
  customer_address?: string | null;
  customer_email?: string | null;
  shipping_address?: string | null;
  payment_method?: string | null;
};

/* =====================================================
   ORDER STATUSES
===================================================== */

const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

/* =====================================================
   COMPONENT
===================================================== */

export default function VendorDashboard() {
  const router = useRouter();

  const [profile, setProfile] =
    useState<Profile | null>(null);

  const [products, setProducts] =
    useState<Product[]>([]);

  const [orders, setOrders] =
    useState<Order[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [updatingOrder, setUpdatingOrder] =
    useState<number | null>(null);

  /* ===================================================
     PRODUCT MODAL
  =================================================== */

  const [showAddProduct, setShowAddProduct] =
    useState(false);

  const [editingProduct, setEditingProduct] =
    useState<Product | null>(null);

  /* ===================================================
     ORDER DETAILS
  =================================================== */

  const [selectedOrder, setSelectedOrder] =
    useState<Order | null>(null);

  /* ===================================================
     PRODUCT FORM
  =================================================== */

  const [name, setName] =
    useState("");

  const [price, setPrice] =
    useState("");

  const [oldPrice, setOldPrice] =
    useState("");

  const [category, setCategory] =
    useState("");

  const [imageUrl, setImageUrl] =
    useState("");

  const [imageFile, setImageFile] =
    useState<File | null>(null);

  const [uploadingImage, setUploadingImage] =
    useState(false);

  const [stock, setStock] =
    useState("");

  const [description, setDescription] =
    useState("");

  /* ===================================================
     PROFILE
  =================================================== */

  const [editingProfile, setEditingProfile] =
    useState(false);

  const [profileName, setProfileName] =
    useState("");

  const [profilePhone, setProfilePhone] =
    useState("");

  const [profileShopName, setProfileShopName] =
    useState("");

  const [profileShopAddress, setProfileShopAddress] =
    useState("");

  const [savingProfile, setSavingProfile] =
    useState(false);

  /* ===================================================
     START
  =================================================== */

  useEffect(() => {
    checkVendor();
  }, []);

  /* =====================================================
     CHECK VENDOR
  ===================================================== */

  async function checkVendor() {
    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/vendor/login");
        return;
      }

      const { data: profileData, error } =
        await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

      if (error || !profileData) {
        console.error("PROFILE ERROR:", error);

        alert(
          "আপনার Vendor Profile পাওয়া যায়নি।"
        );

        router.replace("/");
        return;
      }

      if (
        profileData.role !== "vendor" ||
        profileData.membership_status !== "active"
      ) {
        alert(
          "আপনার Vendor Membership Active নয়।"
        );

        router.replace("/");
        return;
      }

      setProfile(profileData);

      setProfileName(
        profileData.name || ""
      );

      setProfilePhone(
        profileData.phone || ""
      );

      setProfileShopName(
        profileData.shop_name || ""
      );

      setProfileShopAddress(
        profileData.shop_address || ""
      );

      await loadData(user.id);
    } catch (error) {
      console.error(
        "VENDOR CHECK ERROR:",
        error
      );

      router.replace("/");
    } finally {
      setLoading(false);
    }
  }

  /* =====================================================
     LOAD DATA
  ===================================================== */

  async function loadData(
    vendorId?: string
  ) {
    try {
      let currentVendorId = vendorId;

      if (!currentVendorId) {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) return;

        currentVendorId = user.id;
      }

      /* =================================================
         OWN PRODUCTS ONLY
      ================================================= */

      const {
        data: productsData,
        error: productsError,
      } = await supabase
        .from("products")
        .select("*")
        .eq("vendor_id", currentVendorId)
        .order("id", {
          ascending: false,
        });

      if (productsError) {
        console.error(
          "PRODUCT LOAD ERROR:",
          productsError
        );
      }

      /* =================================================
         OWN ORDERS ONLY
      ================================================= */

      const {
        data: ordersData,
        error: ordersError,
      } = await supabase
        .from("orders")
        .select("*")
        .eq("vendor_id", currentVendorId)
        .order("id", {
          ascending: false,
        });

      if (ordersError) {
        console.error(
          "ORDER LOAD ERROR:",
          ordersError
        );
      }

      setProducts(productsData || []);
      setOrders(ordersData || []);
    } catch (error) {
      console.error(
        "VENDOR LOAD ERROR:",
        error
      );
    }
  }

  /* =====================================================
     LOGOUT
  ===================================================== */

  async function logout() {
    await supabase.auth.signOut();

    router.replace("/vendor/login");

    router.refresh();
  }

  /* =====================================================
     PROFILE EDIT
  ===================================================== */

  function openProfileEdit() {
    setProfileName(profile?.name || "");
    setProfilePhone(profile?.phone || "");
    setProfileShopName(
      profile?.shop_name || ""
    );
    setProfileShopAddress(
      profile?.shop_address || ""
    );

    setEditingProfile(true);
  }

  function closeProfileEdit() {
    setEditingProfile(false);

    setProfileName(profile?.name || "");
    setProfilePhone(profile?.phone || "");
    setProfileShopName(
      profile?.shop_name || ""
    );
    setProfileShopAddress(
      profile?.shop_address || ""
    );
  }

  /* =====================================================
     SAVE PROFILE
  ===================================================== */

  async function saveProfile() {
    if (!profileShopName.trim()) {
      alert("Shop Name অবশ্যই দিতে হবে।");
      return;
    }

    if (!profileName.trim()) {
      alert("Owner Name অবশ্যই দিতে হবে।");
      return;
    }

    if (!profilePhone.trim()) {
      alert("Phone Number অবশ্যই দিতে হবে।");
      return;
    }

    if (!profileShopAddress.trim()) {
      alert("Shop Address অবশ্যই দিতে হবে।");
      return;
    }

    try {
      setSavingProfile(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert("Login session পাওয়া যায়নি।");
        return;
      }

      const {
        data: updatedProfile,
        error,
      } = await supabase
        .from("profiles")
        .update({
          name: profileName.trim(),
          phone: profilePhone.trim(),
          shop_name: profileShopName.trim(),
          shop_address:
            profileShopAddress.trim(),
        })
        .eq("id", user.id)
        .select("*")
        .single();

      if (error) {
        console.error(
          "PROFILE UPDATE ERROR:",
          error
        );

        alert(
          "Profile Save করা যায়নি.\n\n" +
            error.message
        );

        return;
      }

      setProfile(updatedProfile);
      setEditingProfile(false);

      alert(
        "✅ Shop Profile Successfully Updated!"
      );
    } catch (error) {
      console.error(
        "SAVE PROFILE ERROR:",
        error
      );

      alert(
        "একটি সমস্যা হয়েছে। আবার চেষ্টা করুন।"
      );
    } finally {
      setSavingProfile(false);
    }
  }

  /* =====================================================
     PRODUCT FORM RESET
  ===================================================== */

  function resetProductForm() {
    setName("");
    setPrice("");
    setOldPrice("");
    setCategory("");
    setImageUrl("");
    setImageFile(null);
    setStock("");
    setDescription("");
    setEditingProduct(null);
  }

  /* =====================================================
     ADD PRODUCT
  ===================================================== */

  function openAddProduct() {
    resetProductForm();
    setShowAddProduct(true);
  }

  /* =====================================================
     EDIT PRODUCT
  ===================================================== */

  function openEditProduct(
    product: Product
  ) {
    setEditingProduct(product);

    setName(product.name);

    setPrice(
      String(product.price)
    );

    setOldPrice(
      String(product.old_price || "")
    );

    setCategory(product.category);

    setImageUrl(
      product.image_url
    );

    setImageFile(null);

    setStock(
      String(product.stock)
    );

    setDescription(
      product.description || ""
    );

    setShowAddProduct(true);
  }

  /* =====================================================
     IMAGE UPLOAD
  ===================================================== */

  async function uploadProductImage(
    file: File
  ) {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
    ];

    if (
      !allowedTypes.includes(
        file.type
      )
    ) {
      throw new Error(
        "শুধু JPG, PNG, WEBP অথবা GIF Image ব্যবহার করুন।"
      );
    }

    if (
      file.size >
      5 * 1024 * 1024
    ) {
      throw new Error(
        "Image-এর size সর্বোচ্চ 5MB হতে হবে।"
      );
    }

    const extension =
      file.name
        .split(".")
        .pop()
        ?.toLowerCase() || "jpg";

    const fileName =
      `${crypto.randomUUID()}.${extension}`;

    const filePath =
      `vendors/${fileName}`;

    const {
      error: uploadError,
    } = await supabase.storage
      .from("product-images")
      .upload(
        filePath,
        file,
        {
          cacheControl: "3600",
          upsert: false,
        }
      );

    if (uploadError) {
      throw uploadError;
    }

    const { data } =
      supabase.storage
        .from("product-images")
        .getPublicUrl(
          filePath
        );

    return data.publicUrl;
  }

  /* =====================================================
     SAVE PRODUCT
  ===================================================== */

  async function saveProduct() {
    if (
      !name.trim() ||
      !price ||
      !category.trim() ||
      (!imageUrl.trim() &&
        !imageFile) ||
      stock === ""
    ) {
      alert(
        "Product Name, Price, Category, Stock এবং Image পূরণ করুন।"
      );

      return;
    }

    try {
      setSaving(true);

      let finalImageUrl =
        imageUrl.trim();

      if (imageFile) {
        setUploadingImage(true);

        finalImageUrl =
          await uploadProductImage(
            imageFile
          );
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert(
          "Login session পাওয়া যায়নি।"
        );

        return;
      }

      /* =================================================
         EDIT OWN PRODUCT ONLY
      ================================================= */

      if (editingProduct) {
        const {
          error,
        } = await supabase
          .from("products")
          .update({
            name: name.trim(),
            price: Number(price),
            old_price: Number(
              oldPrice || 0
            ),
            category: category.trim(),
            image_url: finalImageUrl,
            stock: Number(stock),
            description:
              description.trim(),
          })
          .eq(
            "id",
            editingProduct.id
          )
          .eq(
            "vendor_id",
            user.id
          );

        if (error) {
          console.error(
            "PRODUCT UPDATE ERROR:",
            error
          );

          alert(
            "Product Update করা যায়নি.\n\n" +
              error.message
          );

          return;
        }

        alert(
          "✅ Product Successfully Updated!"
        );
      }

      /* =================================================
         ADD PRODUCT
      ================================================= */

      else {
        const {
          error,
        } = await supabase
          .from("products")
          .insert([
            {
              name: name.trim(),
              price: Number(price),
              old_price: Number(
                oldPrice || 0
              ),
              category: category.trim(),
              image_url:
                finalImageUrl,
              stock: Number(stock),
              description:
                description.trim(),
              vendor_id: user.id,
            },
          ]);

        if (error) {
          console.error(
            "PRODUCT INSERT ERROR:",
            error
          );

          alert(
            "Product Add করা যায়নি.\n\n" +
              error.message
          );

          return;
        }

        alert(
          "✅ Product Successfully Added!"
        );
      }

      resetProductForm();
      setShowAddProduct(false);

      await loadData(user.id);
    } catch (error) {
      console.error(
        "SAVE PRODUCT ERROR:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "একটি সমস্যা হয়েছে। আবার চেষ্টা করুন।"
      );
    } finally {
      setSaving(false);
      setUploadingImage(false);
    }
  }

  /* =====================================================
     DELETE PRODUCT
  ===================================================== */

  async function deleteProduct(
    product: Product
  ) {
    const confirmed =
      confirm(
        `"${product.name}" Product টি Delete করতে চান?`
      );

    if (!confirmed) return;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert(
          "Login session পাওয়া যায়নি।"
        );

        return;
      }

      const {
        error,
      } = await supabase
        .from("products")
        .delete()
        .eq(
          "id",
          product.id
        )
        .eq(
          "vendor_id",
          user.id
        );

      if (error) {
        console.error(
          "PRODUCT DELETE ERROR:",
          error
        );

        alert(
          "Product Delete করা যায়নি.\n\n" +
            error.message
        );

        return;
      }

      alert(
        "✅ Product Successfully Deleted!"
      );

      await loadData(user.id);
    } catch (error) {
      console.error(
        "DELETE ERROR:",
        error
      );

      alert(
        "একটি সমস্যা হয়েছে। আবার চেষ্টা করুন।"
      );
    }
  }

  /* =====================================================
     STATUS TEXT
  ===================================================== */

  function getStatusText(
    status: string
  ) {
    switch (
      status?.toLowerCase()
    ) {
      case "pending":
        return "Pending";

      case "confirmed":
        return "Confirmed";

      case "processing":
        return "Processing";

      case "shipped":
        return "Shipped";

      case "delivered":
        return "Delivered";

      case "cancelled":
      case "canceled":
        return "Cancelled";

      default:
        return "Pending";
    }
  }

  /* =====================================================
     STATUS ICON
  ===================================================== */

  function getStatusIcon(
    status: string
  ) {
    switch (
      status?.toLowerCase()
    ) {
      case "pending":
        return "⏳";

      case "confirmed":
        return "✓";

      case "processing":
        return "⚙️";

      case "shipped":
        return "🚚";

      case "delivered":
        return "✅";

      case "cancelled":
      case "canceled":
        return "❌";

      default:
        return "⏳";
    }
  }

  /* =====================================================
     STATUS CLASS
  ===================================================== */

  function getStatusClass(
    status: string
  ) {
    switch (
      status?.toLowerCase()
    ) {
      case "pending":
        return "status-pending";

      case "confirmed":
        return "status-confirmed";

      case "processing":
        return "status-processing";

      case "shipped":
        return "status-shipped";

      case "delivered":
        return "status-delivered";

      case "cancelled":
      case "canceled":
        return "status-cancelled";

      default:
        return "status-pending";
    }
  }

  /* =====================================================
     UPDATE ORDER STATUS
  ===================================================== */

  async function updateOrderStatus(
    orderId: number,
    newStatus: string
  ) {
    try {
      setUpdatingOrder(orderId);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert(
          "Login session পাওয়া যায়নি।"
        );

        return;
      }

      /* =================================================
         FIND ORDER
      ================================================= */

      const targetOrder =
        orders.find(
          (order) =>
            order.id === orderId
        );

      if (!targetOrder) {
        alert(
          "এই Order আপনার Store-এর নয়।"
        );

        return;
      }

      /* =================================================
         EXTRA SECURITY
      ================================================= */

      if (
        targetOrder.vendor_id !==
        user.id
      ) {
        alert(
          "❌ আপনি অন্য Vendor-এর Order-এর Status পরিবর্তন করতে পারবেন না।"
        );

        return;
      }

      /* =================================================
         VALID STATUS
      ================================================= */

      if (
        !ORDER_STATUSES.includes(
          newStatus
        )
      ) {
        alert(
          "Invalid Order Status."
        );

        return;
      }

      /* =================================================
         UPDATE OWN ORDER ONLY
      ================================================= */

      const {
        data: updatedOrder,
        error,
      } = await supabase
        .from("orders")
        .update({
          status: newStatus,
        })
        .eq(
          "id",
          orderId
        )
        .eq(
          "vendor_id",
          user.id
        )
        .select("*")
        .single();

      if (error) {
        console.error(
          "STATUS UPDATE ERROR:",
          error
        );

        alert(
          "Status Update করা যায়নি.\n\n" +
            error.message
        );

        return;
      }

      /* =================================================
         UPDATE LOCAL STATE
      ================================================= */

      setOrders(
        (currentOrders) =>
          currentOrders.map(
            (order) =>
              order.id ===
              orderId
                ? updatedOrder ||
                  {
                    ...order,
                    status:
                      newStatus,
                  }
                : order
          )
      );

      if (
        selectedOrder?.id ===
        orderId
      ) {
        setSelectedOrder(
          updatedOrder ||
            {
              ...selectedOrder,
              status: newStatus,
            }
        );
      }

      alert(
        `Order #${orderId} status "${getStatusText(
          newStatus
        )}" করা হয়েছে।`
      );
    } catch (error) {
      console.error(
        "STATUS UPDATE ERROR:",
        error
      );

      alert(
        "একটি সমস্যা হয়েছে। আবার চেষ্টা করুন।"
      );
    } finally {
      setUpdatingOrder(null);
    }
  }

  /* =====================================================
     DATE
  ===================================================== */

  function formatDate(
    date: string
  ) {
    return new Date(
      date
    ).toLocaleString(
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

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <main className="vendor-loading">
        <div>
          <div className="vendor-loading-logo">
            N
          </div>

          <h2>
            NIJUM SHOP
          </h2>

          <p>
            Loading Vendor Panel...
          </p>
        </div>

        <VendorStyles />
      </main>
    );
  }

  /* =====================================================
     MAIN
  ===================================================== */

  return (
    <main className="vendor-page">

      {/* =================================================
          SIDEBAR
      ================================================= */}

      <aside className="vendor-sidebar">

        <div className="vendor-brand">

          <div className="vendor-brand-logo">
            N
          </div>

          <div>
            <strong>
              NIJUM SHOP
            </strong>

            <span>
              VENDOR PANEL
            </span>
          </div>

        </div>

        <nav className="vendor-nav">

          <a
            href="#dashboard"
            className="active"
          >
            📊 Dashboard
          </a>

          <a href="#products">
            🛍️ My Products
          </a>

          <a href="#orders">
            📦 Orders
          </a>

          <a href="#shop">
            🏪 My Shop
          </a>

          <a href="/">
            🌐 View Shop
          </a>

        </nav>

        <button
          className="vendor-logout"
          onClick={logout}
        >
          🚪 Logout
        </button>

      </aside>

      {/* =================================================
          MAIN CONTENT
      ================================================= */}

      <section className="vendor-main">

        {/* =================================================
            TOPBAR
        ================================================= */}

        <header
          className="vendor-topbar"
          id="dashboard"
        >

          <div>
            <span>
              Welcome back,{" "}
              {profile?.name ||
                "Vendor"}
            </span>

            <h1>
              Vendor Dashboard
            </h1>
          </div>

          <div className="topbar-actions">

            <div className="membership-badge">
              ● MEMBER ACTIVE
            </div>

            <a
              href="/"
              className="view-shop"
            >
              🌐 View Shop
            </a>

          </div>

        </header>

        {/* =================================================
            WELCOME
        ================================================= */}

        <section className="vendor-welcome">

          <div>

            <span>
              YOUR STORE
            </span>

            <h2>
              {profile?.shop_name ||
                "My Shop"}
            </h2>

            <p>
              {profile?.shop_address ||
                "Shop Address not set"}
            </p>

          </div>

          <div className="member-status">

            <span>
              MEMBERSHIP
            </span>

            <strong>
              ACTIVE
            </strong>

          </div>

        </section>

        {/* =================================================
            STATS
        ================================================= */}

        <section className="vendor-stats">

          <div className="stat-card">

            <div className="stat-icon">
              🛍️
            </div>

            <div>
              <span>
                My Products
              </span>

              <strong>
                {products.length}
              </strong>
            </div>

          </div>

          <div className="stat-card">

            <div className="stat-icon">
              📦
            </div>

            <div>
              <span>
                Total Orders
              </span>

              <strong>
                {orders.length}
              </strong>
            </div>

          </div>

          <div className="stat-card">

            <div className="stat-icon">
              ⏳
            </div>

            <div>
              <span>
                Pending Orders
              </span>

              <strong>
                {
                  orders.filter(
                    (order) =>
                      order.status?.toLowerCase() ===
                      "pending"
                  ).length
                }
              </strong>
            </div>

          </div>

          <div className="stat-card">

            <div className="stat-icon">
              💰
            </div>

            <div>
              <span>
                Sales
              </span>

              <strong>
                ৳
                {orders.reduce(
                  (
                    total,
                    order
                  ) =>
                    total +
                    Number(
                      order.total_amount ||
                        0
                    ),
                  0
                )}
              </strong>
            </div>

          </div>

        </section>

        {/* =================================================
            PRODUCTS
        ================================================= */}

        <section
          className="vendor-section"
          id="products"
        >

          <div className="section-header">

            <div>
              <span>
                STORE
              </span>

              <h2>
                My Products
              </h2>

              <p>
                এখানে শুধু আপনার Products দেখা যাবে।
              </p>
            </div>

            <button
              className="gold-button"
              onClick={openAddProduct}
            >
              + Add Product
            </button>

          </div>

          {products.length === 0 ? (

            <div className="empty-box">

              <div>
                🛍️
              </div>

              <h3>
                No Products Yet
              </h3>

              <p>
                আপনার প্রথম Product Add করুন।
              </p>

              <button
                className="gold-button"
                onClick={openAddProduct}
              >
                + Add Your First Product
              </button>

            </div>

          ) : (

            <div className="product-grid">

              {products.map(
                (product) => (

                  <div
                    className="product-card"
                    key={product.id}
                  >

                    <div className="product-card-image">

                      {product.image_url ? (

                        <img
                          src={
                            product.image_url
                          }
                          alt={
                            product.name
                          }
                        />

                      ) : (

                        <div>
                          📦
                        </div>

                      )}

                      <span
                        className={
                          product.stock > 0
                            ? "stock-badge"
                            : "out-badge"
                        }
                      >
                        {product.stock > 0
                          ? `${product.stock} in stock`
                          : "Out of stock"}
                      </span>

                    </div>

                    <div className="product-card-body">

                      <span className="category-text">
                        {
                          product.category
                        }
                      </span>

                      <h3>
                        {
                          product.name
                        }
                      </h3>

                      <div className="price-row">

                        <strong>
                          ৳
                          {
                            product.price
                          }
                        </strong>

                        {product.old_price >
                          0 && (
                          <del>
                            ৳
                            {
                              product.old_price
                            }
                          </del>
                        )}

                      </div>

                      <div className="product-actions">

                        <button
                          onClick={() =>
                            openEditProduct(
                              product
                            )
                          }
                        >
                          ✏️ Edit
                        </button>

                        <button
                          className="delete-btn"
                          onClick={() =>
                            deleteProduct(
                              product
                            )
                          }
                        >
                          🗑️ Delete
                        </button>

                      </div>

                    </div>

                  </div>

                )
              )}

            </div>

          )}

        </section>

        {/* =================================================
            ORDERS
        ================================================= */}

        <section
          className="vendor-section"
          id="orders"
        >

          <div className="section-header">

            <div>

              <span>
                SALES
              </span>

              <h2>
                Orders
              </h2>

              <p>
                আপনার Store-এর Order Management।
              </p>

            </div>

            <button
              className="refresh-button"
              onClick={() =>
                loadData()
              }
            >
              🔄 Refresh
            </button>

          </div>

          {/* STATUS GUIDE */}

          <div className="status-guide">

            <div className="guide-title">
              ORDER STATUS FLOW
            </div>

            <div className="status-flow">

              <span>
                ⏳ Pending
              </span>

              <b>→</b>

              <span>
                ✓ Confirmed
              </span>

              <b>→</b>

              <span>
                ⚙️ Processing
              </span>

              <b>→</b>

              <span>
                🚚 Shipped
              </span>

              <b>→</b>

              <span>
                ✅ Delivered
              </span>

            </div>

          </div>

          {orders.length === 0 ? (

            <div className="empty-box">

              <div>
                📦
              </div>

              <h3>
                No Orders Yet
              </h3>

              <p>
                আপনার Product-এর Order এখানে দেখা যাবে।
              </p>

            </div>

          ) : (

            <div className="table-wrapper">

              <table className="vendor-table">

                <thead>

                  <tr>

                    <th>
                      Order
                    </th>

                    <th>
                      Customer
                    </th>

                    <th>
                      Phone
                    </th>

                    <th>
                      Date
                    </th>

                    <th>
                      Total
                    </th>

                    <th>
                      Status
                    </th>

                    <th>
                      Details
                    </th>

                    <th>
                      Change
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {orders.map(
                    (order) => (

                      <tr
                        key={
                          order.id
                        }
                      >

                        <td>
                          <strong>
                            #
                            {
                              order.id
                            }
                          </strong>
                        </td>

                        <td>
                          <strong>
                            {
                              order.customer_name
                            }
                          </strong>
                        </td>

                        <td>
                          {
                            order.customer_phone
                          }
                        </td>

                        <td>
                          <span className="date-text">
                            {formatDate(
                              order.created_at
                            )}
                          </span>
                        </td>

                        <td>
                          <strong className="gold-text">
                            ৳
                            {
                              order.total_amount
                            }
                          </strong>
                        </td>

                        <td>

                          <span
                            className={`order-status ${getStatusClass(
                              order.status
                            )}`}
                          >
                            {
                              getStatusIcon(
                                order.status
                              )
                            }{" "}
                            {
                              getStatusText(
                                order.status
                              )
                            }
                          </span>

                        </td>

                        {/* DETAILS */}

                        <td>

                          <button
                            className="details-button"
                            onClick={() =>
                              setSelectedOrder(
                                order
                              )
                            }
                          >
                            👁️ View
                          </button>

                        </td>

                        {/* STATUS */}

                        <td>

                          <div className="status-control">

                            <select
                              value={
                                ORDER_STATUSES.includes(
                                  order.status?.toLowerCase()
                                )
                                  ? order.status.toLowerCase()
                                  : "pending"
                              }
                              disabled={
                                updatingOrder ===
                                order.id
                              }
                              onChange={async (
                                e
                              ) => {

                                await updateOrderStatus(
                                  order.id,
                                  e.target.value
                                );

                              }}
                            >

                              <option value="pending">
                                ⏳ Pending
                              </option>

                              <option value="confirmed">
                                ✓ Confirmed
                              </option>

                              <option value="processing">
                                ⚙️ Processing
                              </option>

                              <option value="shipped">
                                🚚 Shipped
                              </option>

                              <option value="delivered">
                                ✅ Delivered
                              </option>

                              <option value="cancelled">
                                ❌ Cancelled
                              </option>

                            </select>

                            {updatingOrder ===
                              order.id && (
                              <span className="updating">
                                Saving...
                              </span>
                            )}

                          </div>

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          )}

        </section>

        {/* =================================================
            MY SHOP
        ================================================= */}

        <section
          className="vendor-section"
          id="shop"
        >

          <div className="section-header">

            <div>

              <span>
                PROFILE
              </span>

              <h2>
                My Shop
              </h2>

              <p>
                আপনার Vendor / Member Information।
              </p>

            </div>

            <button
              className="gold-button"
              onClick={
                openProfileEdit
              }
            >
              ✏️ Edit Shop Profile
            </button>

          </div>

          <div className="shop-info-grid">

            <div className="info-card">

              <span>
                SHOP NAME
              </span>

              <strong>
                {profile?.shop_name ||
                  "Not Set"}
              </strong>

            </div>

            <div className="info-card">

              <span>
                OWNER NAME
              </span>

              <strong>
                {profile?.name ||
                  "Not Set"}
              </strong>

            </div>

            <div className="info-card">

              <span>
                PHONE
              </span>

              <strong>
                {profile?.phone ||
                  "Not Set"}
              </strong>

            </div>

            <div className="info-card">

              <span>
                MEMBERSHIP
              </span>

              <strong className="active-member">
                ● ACTIVE
              </strong>

            </div>

            <div className="info-card full-info">

              <span>
                SHOP ADDRESS
              </span>

              <strong>
                {profile?.shop_address ||
                  "Not Set"}
              </strong>

            </div>

          </div>

        </section>

      </section>

      {/* =================================================
          ORDER DETAILS MODAL
      ================================================= */}

      {selectedOrder && (

        <div
          className="modal-overlay"
          onClick={() =>
            setSelectedOrder(null)
          }
        >

          <div
            className="order-details-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="modal-header">

              <div>

                <span>
                  ORDER DETAILS
                </span>

                <h2>
                  📦 Order #
                  {
                    selectedOrder.id
                  }
                </h2>

              </div>

              <button
                className="close-button"
                onClick={() =>
                  setSelectedOrder(null)
                }
              >
                ✕
              </button>

            </div>

            {/* STATUS */}

            <div className="order-detail-status">

              <span>
                CURRENT STATUS
              </span>

              <strong
                className={`order-status ${getStatusClass(
                  selectedOrder.status
                )}`}
              >
                {
                  getStatusIcon(
                    selectedOrder.status
                  )
                }{" "}
                {
                  getStatusText(
                    selectedOrder.status
                  )
                }
              </strong>

            </div>

            {/* CUSTOMER */}

            <div className="detail-box">

              <h3>
                👤 Customer Information
              </h3>

              <div className="detail-grid">

                <div>
                  <span>
                    CUSTOMER NAME
                  </span>

                  <strong>
                    {
                      selectedOrder.customer_name
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    PHONE
                  </span>

                  <strong>
                    {
                      selectedOrder.customer_phone
                    }
                  </strong>
                </div>

                {selectedOrder.customer_email && (

                  <div>
                    <span>
                      EMAIL
                    </span>

                    <strong>
                      {
                        selectedOrder.customer_email
                      }
                    </strong>
                  </div>

                )}

                {(selectedOrder.customer_address ||
                  selectedOrder.shipping_address) && (

                  <div className="detail-full">

                    <span>
                      ADDRESS
                    </span>

                    <strong>
                      {
                        selectedOrder.customer_address ||
                        selectedOrder.shipping_address
                      }
                    </strong>

                  </div>

                )}

              </div>

            </div>

            {/* ORDER INFO */}

            <div className="detail-box">

              <h3>
                🧾 Order Information
              </h3>

              <div className="detail-grid">

                <div>
                  <span>
                    ORDER ID
                  </span>

                  <strong>
                    #
                    {
                      selectedOrder.id
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    ORDER DATE
                  </span>

                  <strong>
                    {formatDate(
                      selectedOrder.created_at
                    )}
                  </strong>
                </div>

                {selectedOrder.payment_method && (

                  <div>
                    <span>
                      PAYMENT
                    </span>

                    <strong>
                      {
                        selectedOrder.payment_method
                      }
                    </strong>
                  </div>

                )}

                <div>
                  <span>
                    TOTAL AMOUNT
                  </span>

                  <strong className="gold-detail">
                    ৳
                    {
                      selectedOrder.total_amount
                    }
                  </strong>
                </div>

              </div>

            </div>

            {/* STATUS CHANGE */}

            <div className="detail-box">

              <h3>
                🔄 Update Order Status
              </h3>

              <p className="security-note">
                🔒 আপনি শুধু আপনার নিজের Store-এর Order-এর Status পরিবর্তন করতে পারবেন।
              </p>

              <select
                className="modal-status-select"
                value={
                  ORDER_STATUSES.includes(
                    selectedOrder.status?.toLowerCase()
                  )
                    ? selectedOrder.status.toLowerCase()
                    : "pending"
                }
                disabled={
                  updatingOrder ===
                  selectedOrder.id
                }
                onChange={async (
                  e
                ) => {

                  await updateOrderStatus(
                    selectedOrder.id,
                    e.target.value
                  );

                }}
              >

                <option value="pending">
                  ⏳ Pending
                </option>

                <option value="confirmed">
                  ✓ Confirmed
                </option>

                <option value="processing">
                  ⚙️ Processing
                </option>

                <option value="shipped">
                  🚚 Shipped
                </option>

                <option value="delivered">
                  ✅ Delivered
                </option>

                <option value="cancelled">
                  ❌ Cancelled
                </option>

              </select>

            </div>

            <button
              className="close-detail-button"
              onClick={() =>
                setSelectedOrder(null)
              }
            >
              Close
            </button>

          </div>

        </div>

      )}

      {/* =================================================
          PRODUCT MODAL
      ================================================= */}

      {showAddProduct && (

        <div className="modal-overlay">

          <div className="product-modal">

            <div className="modal-header">

              <div>

                <span>
                  STORE
                </span>

                <h2>
                  {editingProduct
                    ? "✏️ Edit Product"
                    : "➕ Add Product"}
                </h2>

              </div>

              <button
                className="close-button"
                onClick={() => {

                  setShowAddProduct(
                    false
                  );

                  resetProductForm();

                }}
              >
                ✕
              </button>

            </div>

            <label>
              Product Name
            </label>

            <input
              value={name}
              onChange={(e) =>
                setName(
                  e.target.value
                )
              }
              placeholder="Product Name"
            />

            <label>
              Price
            </label>

            <input
              type="number"
              value={price}
              onChange={(e) =>
                setPrice(
                  e.target.value
                )
              }
              placeholder="Price"
            />

            <label>
              Old Price
            </label>

            <input
              type="number"
              value={oldPrice}
              onChange={(e) =>
                setOldPrice(
                  e.target.value
                )
              }
              placeholder="Old Price"
            />

            <label>
              Category
            </label>

            <input
              value={category}
              onChange={(e) =>
                setCategory(
                  e.target.value
                )
              }
              placeholder="Gadgets"
            />

            <label>
              Product Image
            </label>

            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={(e) => {

                const file =
                  e.target.files?.[0] ||
                  null;

                setImageFile(
                  file
                );

                if (file) {
                  setImageUrl("");
                }

              }}
            />

            {imageFile && (

              <p className="selected-image">
                📷 Selected:{" "}
                {
                  imageFile.name
                }
              </p>

            )}

            {editingProduct &&
              !imageFile &&
              imageUrl && (

                <div className="current-image-box">

                  <img
                    src={imageUrl}
                    alt="Current product"
                  />

                  <span>
                    Current Image
                  </span>

                </div>

              )}

            <div className="image-url-divider">
              <span>
                অথবা Image URL
              </span>
            </div>

            <input
              value={imageUrl}
              onChange={(e) => {

                setImageUrl(
                  e.target.value
                );

                if (
                  e.target.value
                ) {
                  setImageFile(
                    null
                  );
                }

              }}
              placeholder="https://..."
            />

            <label>
              Stock
            </label>

            <input
              type="number"
              value={stock}
              onChange={(e) =>
                setStock(
                  e.target.value
                )
              }
              placeholder="Stock"
            />

            <label>
              Description
            </label>

            <textarea
              rows={4}
              value={
                description
              }
              onChange={(e) =>
                setDescription(
                  e.target.value
                )
              }
              placeholder="Product Description"
            />

            <button
              className="save-product"
              disabled={
                saving ||
                uploadingImage
              }
              onClick={
                saveProduct
              }
            >
              {uploadingImage
                ? "Uploading Image..."
                : saving
                ? "Saving..."
                : editingProduct
                ? "💾 Update Product"
                : "💾 Save Product"}
            </button>

          </div>

        </div>

      )}

      {/* =================================================
          PROFILE MODAL
      ================================================= */}

      {editingProfile && (

        <div className="modal-overlay">

          <div className="profile-modal">

            <div className="modal-header">

              <div>

                <span>
                  PROFILE
                </span>

                <h2>
                  ✏️ Edit Shop Profile
                </h2>

              </div>

              <button
                className="close-button"
                onClick={
                  closeProfileEdit
                }
              >
                ✕
              </button>

            </div>

            <label>
              Owner Name
            </label>

            <input
              value={
                profileName
              }
              onChange={(e) =>
                setProfileName(
                  e.target.value
                )
              }
              placeholder="Owner Name"
            />

            <label>
              Phone Number
            </label>

            <input
              value={
                profilePhone
              }
              onChange={(e) =>
                setProfilePhone(
                  e.target.value
                )
              }
              placeholder="Phone Number"
            />

            <label>
              Shop Name
            </label>

            <input
              value={
                profileShopName
              }
              onChange={(e) =>
                setProfileShopName(
                  e.target.value
                )
              }
              placeholder="Shop Name"
            />

            <label>
              Shop Address
            </label>

            <textarea
              rows={4}
              value={
                profileShopAddress
              }
              onChange={(e) =>
                setProfileShopAddress(
                  e.target.value
                )
              }
              placeholder="Shop Address"
            />

            <div className="profile-security">

              🔒{" "}
              <strong>
                Protected Information
              </strong>

              <p>
                Role এবং Membership Status Vendor নিজে পরিবর্তন করতে পারবে না।
              </p>

            </div>

            <button
              className="save-profile"
              disabled={
                savingProfile
              }
              onClick={
                saveProfile
              }
            >
              {savingProfile
                ? "Saving..."
                : "💾 Save Shop Profile"}
            </button>

          </div>

        </div>

      )}

      <VendorStyles />

    </main>
  );
}

/* =====================================================
   STYLES
===================================================== */

function VendorStyles() {
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

      .vendor-page {
        min-height: 100vh;
        display: flex;
        background:
          radial-gradient(
            circle at 20% 10%,
            rgba(212,175,55,0.07),
            transparent 30%
          ),
          #080808;
        color: #f5f5f5;
      }

      /* SIDEBAR */

      .vendor-sidebar {
        width: 245px;
        position: fixed;
        left: 0;
        top: 0;
        bottom: 0;
        display: flex;
        flex-direction: column;
        padding: 25px 18px;
        background: rgba(12,12,12,0.97);
        border-right: 1px solid rgba(212,175,55,0.13);
        z-index: 20;
      }

      .vendor-brand {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 5px 5px 28px;
        border-bottom: 1px solid rgba(255,255,255,0.06);
      }

      .vendor-brand-logo {
        width: 43px;
        height: 43px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 12px;
        background: linear-gradient(
          135deg,
          #d4af37,
          #f5d76e
        );
        color: #080808;
        font-size: 23px;
        font-weight: 950;
      }

      .vendor-brand strong {
        display: block;
        color: #eee;
        font-size: 14px;
        letter-spacing: 0.6px;
      }

      .vendor-brand span {
        display: block;
        margin-top: 3px;
        color: #777;
        font-size: 9px;
        letter-spacing: 1.5px;
      }

      .vendor-nav {
        display: flex;
        flex-direction: column;
        gap: 7px;
        padding-top: 25px;
      }

      .vendor-nav a {
        display: block;
        padding: 12px 13px;
        border-radius: 10px;
        text-decoration: none;
        color: #888;
        font-size: 13px;
        font-weight: 700;
        transition: 0.25s;
      }

      .vendor-nav a:hover,
      .vendor-nav a.active {
        color: #d4af37;
        background: rgba(212,175,55,0.09);
      }

      .vendor-logout {
        margin-top: auto;
        padding: 12px;
        border-radius: 10px;
        border: 1px solid rgba(239,68,68,0.2);
        background: rgba(239,68,68,0.07);
        color: #f87171;
        cursor: pointer;
        font-weight: 800;
      }

      /* MAIN */

      .vendor-main {
        width: calc(100% - 245px);
        margin-left: 245px;
        padding: 30px 35px 60px;
      }

      .vendor-topbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 20px;
        margin-bottom: 22px;
      }

      .vendor-topbar > div:first-child span {
        color: #777;
        font-size: 11px;
      }

      .vendor-topbar h1 {
        margin: 5px 0 0;
        font-size: 28px;
      }

      .topbar-actions {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .membership-badge {
        padding: 9px 12px;
        border-radius: 9px;
        color: #4ade80;
        background: rgba(34,197,94,0.08);
        border: 1px solid rgba(34,197,94,0.18);
        font-size: 9px;
        font-weight: 900;
      }

      .view-shop {
        padding: 10px 15px;
        border: 1px solid rgba(212,175,55,0.3);
        border-radius: 10px;
        text-decoration: none;
        color: #d4af37;
        background: rgba(212,175,55,0.06);
        font-size: 12px;
        font-weight: 800;
      }

      /* WELCOME */

      .vendor-welcome {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 20px;
        margin-bottom: 25px;
        padding: 20px;
        border-radius: 16px;
        background:
          linear-gradient(
            135deg,
            rgba(212,175,55,0.09),
            rgba(255,255,255,0.02)
          );
        border: 1px solid rgba(212,175,55,0.14);
      }

      .vendor-welcome span {
        color: #d4af37;
        font-size: 8px;
        letter-spacing: 1.5px;
        font-weight: 900;
      }

      .vendor-welcome h2 {
        margin: 5px 0;
        font-size: 22px;
      }

      .vendor-welcome p {
        margin: 0;
        color: #777;
        font-size: 11px;
      }

      .member-status {
        min-width: 120px;
        text-align: right;
      }

      .member-status strong {
        display: block;
        margin-top: 5px;
        color: #4ade80;
        font-size: 13px;
      }

      /* STATS */

      .vendor-stats {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 15px;
        margin-bottom: 35px;
      }

      .stat-card {
        display: flex;
        align-items: center;
        gap: 13px;
        padding: 19px;
        border-radius: 16px;
        background: rgba(18,18,18,0.95);
        border: 1px solid rgba(255,255,255,0.07);
      }

      .stat-icon {
        width: 43px;
        height: 43px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 12px;
        background: rgba(212,175,55,0.08);
        font-size: 19px;
      }

      .stat-card span {
        display: block;
        color: #666;
        font-size: 10px;
      }

      .stat-card strong {
        display: block;
        margin-top: 4px;
        color: #ddd;
        font-size: 20px;
      }

      /* SECTION */

      .vendor-section {
        margin-bottom: 40px;
      }

      .section-header {
        display: flex;
        align-items: end;
        justify-content: space-between;
        gap: 20px;
        margin-bottom: 17px;
      }

      .section-header span {
        color: #d4af37;
        font-size: 9px;
        font-weight: 900;
        letter-spacing: 1.7px;
      }

      .section-header h2 {
        margin: 5px 0 0;
        font-size: 21px;
      }

      .section-header p {
        margin: 5px 0 0;
        color: #666;
        font-size: 11px;
      }

      .gold-button,
      .refresh-button {
        padding: 11px 15px;
        border-radius: 10px;
        cursor: pointer;
        font-weight: 800;
      }

      .gold-button {
        border: 1px solid #d4af37;
        background: #d4af37;
        color: #080808;
      }

      .refresh-button {
        border: 1px solid rgba(212,175,55,0.3);
        background: rgba(212,175,55,0.07);
        color: #d4af37;
      }

      /* PRODUCTS */

      .product-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 16px;
      }

      .product-card {
        overflow: hidden;
        border-radius: 16px;
        background: rgba(17,17,17,0.96);
        border: 1px solid rgba(255,255,255,0.07);
        transition: 0.25s;
      }

      .product-card:hover {
        transform: translateY(-3px);
        border-color: rgba(212,175,55,0.22);
      }

      .product-card-image {
        position: relative;
        height: 180px;
        background: #151515;
      }

      .product-card-image img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .product-card-image > div {
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 45px;
      }

      .stock-badge,
      .out-badge {
        position: absolute;
        left: 10px;
        bottom: 10px;
        padding: 5px 8px;
        border-radius: 7px;
        font-size: 8px;
        font-weight: 900;
      }

      .stock-badge {
        color: #4ade80;
        background: rgba(0,0,0,0.72);
      }

      .out-badge {
        color: #f87171;
        background: rgba(0,0,0,0.72);
      }

      .product-card-body {
        padding: 14px;
      }

      .category-text {
        color: #d4af37;
        font-size: 8px;
        font-weight: 900;
        text-transform: uppercase;
      }

      .product-card h3 {
        margin: 6px 0;
        color: #ddd;
        font-size: 14px;
      }

      .price-row {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .price-row strong {
        color: #d4af37;
        font-size: 16px;
      }

      .price-row del {
        color: #555;
        font-size: 10px;
      }

      .product-actions {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 7px;
        margin-top: 13px;
      }

      .product-actions button {
        padding: 8px 5px;
        border-radius: 8px;
        border: 1px solid rgba(255,255,255,0.08);
        background: rgba(255,255,255,0.04);
        color: #aaa;
        cursor: pointer;
        font-size: 10px;
        font-weight: 800;
      }

      .product-actions .delete-btn:hover {
        color: #f87171;
        background: rgba(239,68,68,0.08);
      }

      /* EMPTY */

      .empty-box {
        padding: 55px 20px;
        text-align: center;
        border-radius: 16px;
        background: rgba(16,16,16,0.95);
        border: 1px solid rgba(255,255,255,0.06);
      }

      .empty-box > div {
        margin-bottom: 10px;
        font-size: 48px;
      }

      .empty-box h3 {
        margin: 0 0 5px;
        color: #ddd;
      }

      .empty-box p {
        margin: 0 0 18px;
        color: #666;
        font-size: 11px;
      }

      /* TABLE */

      .table-wrapper {
        width: 100%;
        overflow-x: auto;
        border-radius: 16px;
        background: rgba(16,16,16,0.96);
        border: 1px solid rgba(255,255,255,0.07);
      }

      .vendor-table {
        width: 100%;
        min-width: 1200px;
        border-collapse: collapse;
      }

      .vendor-table th {
        padding: 14px 15px;
        text-align: left;
        color: #666;
        background: #111;
        border-bottom: 1px solid rgba(255,255,255,0.07);
        font-size: 9px;
        letter-spacing: 1.2px;
        text-transform: uppercase;
      }

      .vendor-table td {
        padding: 14px 15px;
        color: #aaa;
        border-bottom: 1px solid rgba(255,255,255,0.05);
        font-size: 12px;
        vertical-align: middle;
      }

      .vendor-table tbody tr:last-child td {
        border-bottom: none;
      }

      .gold-text {
        color: #d4af37 !important;
      }

      .date-text {
        color: #777;
        font-size: 10px;
        white-space: nowrap;
      }

      /* STATUS */

      .order-status {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        padding: 7px 10px;
        border-radius: 8px;
        font-size: 10px;
        font-weight: 900;
        white-space: nowrap;
      }

      .status-pending {
        color: #facc15;
        background: rgba(234,179,8,0.10);
      }

      .status-confirmed {
        color: #a78bfa;
        background: rgba(139,92,246,0.10);
      }

      .status-processing {
        color: #60a5fa;
        background: rgba(59,130,246,0.10);
      }

      .status-shipped {
        color: #38bdf8;
        background: rgba(14,165,233,0.10);
      }

      .status-delivered {
        color: #4ade80;
        background: rgba(34,197,94,0.10);
      }

      .status-cancelled {
        color: #f87171;
        background: rgba(239,68,68,0.10);
      }

      /* STATUS GUIDE */

      .status-guide {
        margin-bottom: 15px;
        padding: 15px 18px;
        border-radius: 14px;
        background: rgba(212,175,55,0.035);
        border: 1px solid rgba(212,175,55,0.12);
      }

      .guide-title {
        margin-bottom: 10px;
        color: #666;
        font-size: 8px;
        font-weight: 900;
        letter-spacing: 1.5px;
      }

      .status-flow {
        display: flex;
        align-items: center;
        gap: 9px;
        flex-wrap: wrap;
      }

      .status-flow span {
        padding: 6px 9px;
        border-radius: 7px;
        background: rgba(255,255,255,0.04);
        color: #aaa;
        font-size: 10px;
      }

      .status-flow b {
        color: #555;
        font-size: 12px;
      }

      /* STATUS CONTROL */

      .status-control {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .status-control select,
      .modal-status-select {
        min-width: 140px;
        padding: 9px 10px;
        border-radius: 9px;
        border: 1px solid rgba(212,175,55,0.25);
        outline: none;
        background: #111;
        color: #ddd;
        cursor: pointer;
        font-size: 11px;
        font-weight: 700;
      }

      .status-control select:focus,
      .modal-status-select:focus {
        border-color: #d4af37;
      }

      .status-control option,
      .modal-status-select option {
        background: #111;
        color: #eee;
      }

      .status-control select:disabled,
      .modal-status-select:disabled {
        opacity: 0.55;
        cursor: wait;
      }

      .updating {
        color: #d4af37;
        font-size: 9px;
        white-space: nowrap;
        animation: pulse 0.9s infinite;
      }

      @keyframes pulse {
        50% {
          opacity: 0.4;
        }
      }

      /* DETAILS BUTTON */

      .details-button {
        padding: 8px 11px;
        border-radius: 8px;
        border: 1px solid rgba(212,175,55,0.25);
        background: rgba(212,175,55,0.07);
        color: #d4af37;
        cursor: pointer;
        font-size: 10px;
        font-weight: 800;
        white-space: nowrap;
      }

      .details-button:hover {
        background: rgba(212,175,55,0.15);
      }

      /* SHOP */

      .shop-info-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 14px;
      }

      .info-card {
        padding: 18px;
        border-radius: 14px;
        background: rgba(17,17,17,0.95);
        border: 1px solid rgba(255,255,255,0.07);
      }

      .info-card span {
        display: block;
        margin-bottom: 7px;
        color: #666;
        font-size: 8px;
        font-weight: 900;
        letter-spacing: 1.3px;
      }

      .info-card strong {
        color: #ddd;
        font-size: 13px;
        line-height: 1.6;
      }

      .active-member {
        color: #4ade80 !important;
      }

      .full-info {
        grid-column: 1 / -1;
      }

      /* MODALS */

      .modal-overlay {
        position: fixed;
        inset: 0;
        z-index: 100;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        background: rgba(0,0,0,0.78);
        backdrop-filter: blur(8px);
      }

      .product-modal,
      .profile-modal,
      .order-details-modal {
        width: 100%;
        max-height: 90vh;
        overflow-y: auto;
        padding: 25px;
        border-radius: 18px;
        background: #111;
        border: 1px solid rgba(212,175,55,0.18);
        box-shadow: 0 30px 80px rgba(0,0,0,0.5);
      }

      .product-modal {
        max-width: 520px;
      }

      .profile-modal {
        max-width: 500px;
      }

      .order-details-modal {
        max-width: 650px;
      }

      .modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 20px;
      }

      .modal-header span {
        color: #d4af37;
        font-size: 8px;
        letter-spacing: 1.5px;
      }

      .modal-header h2 {
        margin: 5px 0 0;
        font-size: 20px;
      }

      .close-button {
        width: 35px;
        height: 35px;
        border-radius: 9px;
        border: 1px solid rgba(255,255,255,0.08);
        background: rgba(255,255,255,0.04);
        color: #aaa;
        cursor: pointer;
      }

      .product-modal label,
      .profile-modal label {
        display: block;
        margin: 13px 0 6px;
        color: #888;
        font-size: 10px;
        font-weight: 800;
      }

      .product-modal input,
      .product-modal textarea,
      .profile-modal input,
      .profile-modal textarea {
        width: 100%;
        padding: 11px 12px;
        border-radius: 9px;
        border: 1px solid rgba(255,255,255,0.08);
        outline: none;
        background: #0b0b0b;
        color: #eee;
        font-size: 12px;
      }

      .product-modal input:focus,
      .product-modal textarea:focus,
      .profile-modal input:focus,
      .profile-modal textarea:focus {
        border-color: rgba(212,175,55,0.55);
      }

      .product-modal textarea,
      .profile-modal textarea {
        resize: vertical;
      }

      /* IMAGE */

      .selected-image {
        margin: 8px 0 0;
        color: #4ade80;
        font-size: 10px;
      }

      .current-image-box {
        position: relative;
        margin-top: 10px;
        overflow: hidden;
        height: 140px;
        border-radius: 10px;
        background: #0b0b0b;
        border: 1px solid rgba(255,255,255,0.08);
      }

      .current-image-box img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .current-image-box span {
        position: absolute;
        left: 8px;
        bottom: 8px;
        padding: 5px 8px;
        border-radius: 6px;
        background: rgba(0,0,0,0.7);
        color: #ddd;
        font-size: 9px;
      }

      .image-url-divider {
        display: flex;
        align-items: center;
        gap: 10px;
        margin: 16px 0 0;
        color: #555;
        font-size: 9px;
      }

      .image-url-divider::before,
      .image-url-divider::after {
        content: "";
        flex: 1;
        height: 1px;
        background: rgba(255,255,255,0.07);
      }

      /* SAVE */

      .save-product,
      .save-profile {
        width: 100%;
        margin-top: 20px;
        padding: 13px;
        border-radius: 10px;
        border: 1px solid #d4af37;
        background: #d4af37;
        color: #080808;
        cursor: pointer;
        font-weight: 900;
      }

      .save-product:disabled,
      .save-profile:disabled {
        opacity: 0.6;
        cursor: wait;
      }

      /* ORDER DETAILS */

      .order-detail-status {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 15px;
        padding: 14px;
        margin-bottom: 15px;
        border-radius: 12px;
        background: rgba(212,175,55,0.04);
        border: 1px solid rgba(212,175,55,0.12);
      }

      .order-detail-status > span {
        color: #666;
        font-size: 9px;
        font-weight: 900;
        letter-spacing: 1.3px;
      }

      .detail-box {
        margin-top: 15px;
        padding: 16px;
        border-radius: 13px;
        background: rgba(255,255,255,0.025);
        border: 1px solid rgba(255,255,255,0.07);
      }

      .detail-box h3 {
        margin: 0 0 14px;
        color: #ddd;
        font-size: 13px;
      }

      .detail-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 13px;
      }

      .detail-grid > div {
        padding: 11px;
        border-radius: 9px;
        background: rgba(0,0,0,0.25);
      }

      .detail-grid span {
        display: block;
        margin-bottom: 5px;
        color: #666;
        font-size: 8px;
        font-weight: 900;
        letter-spacing: 1px;
      }

      .detail-grid strong {
        color: #ddd;
        font-size: 12px;
        line-height: 1.5;
      }

      .detail-full {
        grid-column: 1 / -1;
      }

      .gold-detail {
        color: #d4af37 !important;
        font-size: 15px !important;
      }

      .security-note {
        margin: 0 0 12px;
        color: #777;
        font-size: 10px;
        line-height: 1.5;
      }

      .modal-status-select {
        width: 100%;
      }

      .close-detail-button {
        width: 100%;
        margin-top: 18px;
        padding: 12px;
        border-radius: 10px;
        border: 1px solid rgba(255,255,255,0.08);
        background: rgba(255,255,255,0.04);
        color: #aaa;
        cursor: pointer;
        font-weight: 800;
      }

      /* SECURITY */

      .profile-security {
        margin-top: 18px;
        padding: 12px;
        border-radius: 10px;
        background: rgba(34,197,94,0.06);
        border: 1px solid rgba(34,197,94,0.12);
        color: #aaa;
        font-size: 10px;
        line-height: 1.6;
      }

      .profile-security strong {
        color: #4ade80;
      }

      .profile-security p {
        margin: 5px 0 0;
        color: #777;
        font-size: 9px;
      }

      /* LOADING */

      .vendor-loading {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        background: #080808;
        color: white;
      }

      .vendor-loading-logo {
        width: 55px;
        height: 55px;
        margin: auto;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 15px;
        background: linear-gradient(
          135deg,
          #d4af37,
          #f5d76e
        );
        color: #080808;
        font-size: 27px;
        font-weight: 950;
      }

      .vendor-loading h2 {
        margin: 15px 0 5px;
        color: #d4af37;
      }

      .vendor-loading p {
        color: #666;
        font-size: 12px;
      }

      /* RESPONSIVE */

      @media (max-width: 1100px) {

        .vendor-sidebar {
          width: 205px;
        }

        .vendor-main {
          width: calc(100% - 205px);
          margin-left: 205px;
          padding: 25px 20px 50px;
        }

        .vendor-stats {
          grid-template-columns: repeat(2, 1fr);
        }

        .product-grid {
          grid-template-columns: repeat(3, 1fr);
        }

      }

      @media (max-width: 800px) {

        .vendor-page {
          display: block;
        }

        .vendor-sidebar {
          position: relative;
          width: 100%;
          height: auto;
          padding: 15px;
          border-right: none;
          border-bottom: 1px solid rgba(212,175,55,0.13);
        }

        .vendor-brand {
          padding-bottom: 15px;
        }

        .vendor-nav {
          flex-direction: row;
          overflow-x: auto;
          padding-top: 15px;
        }

        .vendor-nav a {
          white-space: nowrap;
        }

        .vendor-logout {
          margin-top: 12px;
        }

        .vendor-main {
          width: 100%;
          margin-left: 0;
          padding: 20px 12px 40px;
        }

        .vendor-topbar {
          align-items: flex-start;
          flex-direction: column;
        }

        .topbar-actions {
          width: 100%;
          flex-wrap: wrap;
        }

        .vendor-welcome {
          align-items: flex-start;
          flex-direction: column;
        }

        .member-status {
          text-align: left;
        }

        .product-grid {
          grid-template-columns: repeat(2, 1fr);
        }

      }

      @media (max-width: 520px) {

        .vendor-stats {
          grid-template-columns: 1fr;
        }

        .product-grid {
          grid-template-columns: 1fr;
        }

        .shop-info-grid {
          grid-template-columns: 1fr;
        }

        .full-info,
        .detail-full {
          grid-column: auto;
        }

        .detail-grid {
          grid-template-columns: 1fr;
        }

        .section-header {
          align-items: flex-start;
          flex-direction: column;
        }

        .gold-button,
        .refresh-button {
          width: 100%;
        }

        .membership-badge,
        .view-shop {
          flex: 1;
          text-align: center;
        }

        .profile-modal,
        .product-modal,
        .order-details-modal {
          padding: 18px;
        }

      }

    `}</style>
  );
}