"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Product = {
  id: number;
  name: string;
  price: number;
  old_price: number;
  category: string;
  stock: number;
  image_url: string;
  description?: string;
};

type OrderItem = {
  product_id?: number;
  product_name?: string;
  category?: string;
  price?: number;
  quantity?: number;
  subtotal?: number;
  image_url?: string;
  vendor_id?: string | null;
};

type Order = {
  id: number;
  customer_name: string;
  customer_phone: string;
  customer_address?: string | null;
  order_note?: string | null;

  items?: OrderItem[] | null;

  total_amount: number;
  status: string;
  created_at: string;

  payment_method?: string | null;
  payment_status?: string | null;
  transaction_id?: string | null;
  validation_id?: string | null;

  user_id?: string | null;
  vendor_id?: string | null;
};

/* ==========================================
   VENDOR TYPE
========================================== */

type Vendor = {
  id: string;
  name?: string | null;
  phone?: string | null;
  shop_name?: string | null;
  shop_address?: string | null;
  role?: string | null;
  membership_status?: string | null;
  created_at?: string | null;
};

const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

export default function AdminDashboard() {
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  /* ==========================================
     VENDOR STATES
  ========================================== */

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [updatingVendor, setUpdatingVendor] =
    useState<string | null>(null);

  const [loading, setLoading] = useState(true);

  const [showAddProduct, setShowAddProduct] =
    useState(false);

  const [updatingOrder, setUpdatingOrder] =
    useState<number | null>(null);

  /* ==========================================
     VIEW ORDER DETAILS
  ========================================== */

  const [selectedOrder, setSelectedOrder] =
    useState<Order | null>(null);

  const [showOrderDetails, setShowOrderDetails] =
    useState(false);

  /* ==========================================
     PRODUCT FORM
  ========================================== */

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [oldPrice, setOldPrice] = useState("");
  const [category, setCategory] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [stock, setStock] = useState("");
  const [description, setDescription] =
    useState("");

  /* ==========================================
     EDIT PRODUCT
  ========================================== */

  const [editingProduct, setEditingProduct] =
    useState<Product | null>(null);

  const [showEditProduct, setShowEditProduct] =
    useState(false);

  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editOldPrice, setEditOldPrice] =
    useState("");
  const [editCategory, setEditCategory] =
    useState("");
  const [editImageUrl, setEditImageUrl] =
    useState("");
  const [editImageFile, setEditImageFile] =
    useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] =
    useState("");
  const [editStock, setEditStock] = useState("");
  const [editDescription, setEditDescription] =
    useState("");

  const [updatingProduct, setUpdatingProduct] =
    useState(false);

  const [deletingProduct, setDeletingProduct] =
    useState<number | null>(null);

  // ==========================================
  // SITE SETTINGS
  // ==========================================

  const [showSiteSettings, setShowSiteSettings] = useState(false);
  const [settingsLogoFile, setSettingsLogoFile] = useState<File | null>(null);
  const [settingsLogoPreview, setSettingsLogoPreview] = useState("");
  const [settingsLogoUrl, setSettingsLogoUrl] = useState("");
  const [aboutTitle, setAboutTitle] = useState("About NIJUM SHOP");
  const [aboutDescription, setAboutDescription] = useState("Gadgets And Varieties");
  const [sitePhone, setSitePhone] = useState("01812986259");
  const [siteWhatsapp, setSiteWhatsapp] = useState("8801812986259");
  const [siteEmail, setSiteEmail] = useState("");
  const [siteAddress, setSiteAddress] = useState("Katakhali Bazar, Hatiya, Noakhali");
  const [contactDescription, setContactDescription] = useState("Contact us for any query.");
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    checkAdmin();
  }, []);

  // ==========================================
  // CHECK ADMIN
  // ==========================================

  async function checkAdmin() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/admin/login");
      return;
    }

    await loadData();
  }

  // ==========================================
  // LOAD DATA
  // ==========================================

  async function loadData() {
    try {
      setLoading(true);

      /* ======================================
         LOAD PRODUCTS
      ====================================== */

      const {
        data: productsData,
        error: productsError,
      } = await supabase
        .from("products")
        .select("*")
        .order("id", {
          ascending: false,
        });

      if (productsError) {
        console.error(
          "PRODUCT LOAD ERROR:",
          productsError
        );
      }

      /* ======================================
         LOAD ORDERS
      ====================================== */

      const {
        data: ordersData,
        error: ordersError,
      } = await supabase
        .from("orders")
        .select("*")
        .order("id", {
          ascending: false,
        });

      if (ordersError) {
        console.error(
          "ORDER LOAD ERROR:",
          ordersError
        );
      }

      /* ======================================
         LOAD VENDORS
      ====================================== */

      const {
        data: vendorsData,
        error: vendorsError,
      } = await supabase
        .from("profiles")
        .select(
          "id, name, phone, shop_name, shop_address, role, membership_status, created_at"
        )
        .eq("role", "vendor")
        .order("created_at", {
          ascending: false,
        });

      if (vendorsError) {
        console.error(
          "VENDOR LOAD ERROR:",
          vendorsError
        );
      }

      setProducts(productsData || []);
      setOrders(ordersData || []);
      setVendors(vendorsData || []);

      // LOAD SITE SETTINGS
      const { data: settingsData, error: settingsError } = await supabase
        .from("site_settings")
        .select("*")
        .eq("id", 1)
        .maybeSingle();

      if (settingsError) {
        console.error("SITE SETTINGS LOAD ERROR:", settingsError);
      }

      if (settingsData) {
        setSettingsLogoUrl(settingsData.logo_url || "");
        setSettingsLogoPreview(settingsData.logo_url || "");
        setAboutTitle(settingsData.about_title || "");
        setAboutDescription(settingsData.about_description || "");
        setSitePhone(settingsData.phone || "");
        setSiteWhatsapp(settingsData.whatsapp || "");
        setSiteEmail(settingsData.email || "");
        setSiteAddress(settingsData.address || "");
        setContactDescription(settingsData.contact_description || "");
      }
    } catch (error) {
      console.error(
        "ADMIN LOAD ERROR:",
        error
      );
    } finally {
      setLoading(false);
    }
  }

  // ==========================================
  // SITE SETTINGS HANDLERS
  // ==========================================

  function handleSettingsLogoChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
    ];

    if (!allowedTypes.includes(file.type)) {
      alert("শুধু JPG, PNG, WEBP অথবা GIF image upload করা যাবে।");
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Image size সর্বোচ্চ 5MB হতে পারবে।");
      e.target.value = "";
      return;
    }

    setSettingsLogoFile(file);
    setSettingsLogoPreview(URL.createObjectURL(file));
  }

  async function saveSiteSettings() {
    try {
      setSavingSettings(true);
      let finalLogoUrl = settingsLogoUrl;

      if (settingsLogoFile) {
        finalLogoUrl = await uploadProductImage(settingsLogoFile, "site");
      }

      const { error } = await supabase
        .from("site_settings")
        .upsert({
          id: 1,
          logo_url: finalLogoUrl || null,
          about_title: aboutTitle,
          about_description: aboutDescription,
          phone: sitePhone,
          whatsapp: siteWhatsapp,
          email: siteEmail,
          address: siteAddress,
          contact_description: contactDescription,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      setSettingsLogoUrl(finalLogoUrl || "");
      setSettingsLogoFile(null);
      alert("✅ Site Settings সফলভাবে Save হয়েছে।");
    } catch (error) {
      console.error("SITE SETTINGS SAVE ERROR:", error);
      alert(
        "❌ Settings Save করা যায়নি।\n\n" +
        (error instanceof Error ? error.message : "আবার চেষ্টা করুন।")
      );
    } finally {
      setSavingSettings(false);
    }
  }

  // ==========================================
  // LOGOUT
  // ==========================================

  async function logout() {
    await supabase.auth.signOut();

    router.replace("/admin/login");
    router.refresh();
  }

  // ==========================================
  // UPDATE VENDOR STATUS
  // ==========================================

  async function updateVendorStatus(
    vendorId: string,
    newStatus: "active" | "inactive"
  ) {
    const vendor = vendors.find(
      (item) => item.id === vendorId
    );

    if (!vendor) {
      alert("Vendor পাওয়া যায়নি।");
      return;
    }

    const vendorName =
      vendor.name ||
      vendor.shop_name ||
      "এই Vendor";

    const actionText =
      newStatus === "active"
        ? "Activate"
        : "Deactivate";

    const confirmed = window.confirm(
      `আপনি কি "${vendorName}" Vendor-কে ${actionText} করতে চান?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setUpdatingVendor(vendorId);

      const {
        data: updatedVendor,
        error,
      } = await supabase
        .from("profiles")
        .update({
          membership_status: newStatus,
        })
        .eq("id", vendorId)
        .eq("role", "vendor")
        .select(
          "id, name, phone, shop_name, shop_address, role, membership_status, created_at"
        )
        .maybeSingle();

      if (error) {
        console.error(
          "VENDOR STATUS UPDATE ERROR:",
          error
        );

        alert(
          "❌ Vendor Status Update করা যায়নি.\n\n" +
            error.message
        );

        return;
      }

      if (!updatedVendor) {
        alert(
          "❌ Vendor Status Update হয়নি.\n\n" +
            "সম্ভবত Supabase RLS Policy-তে UPDATE permission দেওয়া নেই।"
        );

        return;
      }

      setVendors((currentVendors) =>
        currentVendors.map((item) =>
          item.id === vendorId
            ? updatedVendor
            : item
        )
      );

      alert(
        newStatus === "active"
          ? `✅ "${vendorName}" Vendor Successfully Activated!`
          : `⛔ "${vendorName}" Vendor Successfully Deactivated!`
      );
    } catch (error) {
      console.error(
        "VENDOR STATUS UPDATE EXCEPTION:",
        error
      );

      alert(
        "❌ Vendor Status Update করার সময় একটি সমস্যা হয়েছে.\n\n" +
          (error instanceof Error
            ? error.message
            : "আবার চেষ্টা করুন।")
      );
    } finally {
      setUpdatingVendor(null);
    }
  }

  // ==========================================
  // UPLOAD PRODUCT IMAGE FROM COMPUTER
  // ==========================================

  async function uploadProductImage(
    file: File,
    folder: string
  ) {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
    ];

    if (!allowedTypes.includes(file.type)) {
      throw new Error(
        "শুধু JPG, PNG, WEBP অথবা GIF image upload করা যাবে।"
      );
    }

    if (file.size > 5 * 1024 * 1024) {
      throw new Error(
        "Image size সর্বোচ্চ 5MB হতে পারবে।"
      );
    }

    const extension =
      file.name.split(".").pop()?.toLowerCase() ||
      "jpg";

    const fileName =
      `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 10)}.${extension}`;

    const filePath =
      `${folder}/${fileName}`;

    const {
      error: uploadError,
    } = await supabase.storage
      .from("product-images")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) {
      console.error(
        "IMAGE UPLOAD ERROR:",
        uploadError
      );

      throw new Error(
        uploadError.message
      );
    }

    const { data } =
      supabase.storage
        .from("product-images")
        .getPublicUrl(filePath);

    if (!data?.publicUrl) {
      throw new Error(
        "Image public URL পাওয়া যায়নি।"
      );
    }

    return data.publicUrl;
  }

  function handleAddImageChange(
    e: ChangeEvent<HTMLInputElement>
  ) {
    const file =
      e.target.files?.[0] || null;

    if (!file) {
      setImageFile(null);
      setImagePreview("");
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
    ];

    if (!allowedTypes.includes(file.type)) {
      alert(
        "শুধু JPG, PNG, WEBP অথবা GIF image upload করা যাবে।"
      );

      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert(
        "Image size সর্বোচ্চ 5MB হতে পারবে।"
      );

      e.target.value = "";
      return;
    }

    setImageFile(file);
    setImagePreview(
      URL.createObjectURL(file)
    );
  }

  function handleEditImageChange(
    e: ChangeEvent<HTMLInputElement>
  ) {
    const file =
      e.target.files?.[0] || null;

    if (!file) {
      setEditImageFile(null);
      setEditImagePreview("");
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
    ];

    if (!allowedTypes.includes(file.type)) {
      alert(
        "শুধু JPG, PNG, WEBP অথবা GIF image upload করা যাবে।"
      );

      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert(
        "Image size সর্বোচ্চ 5MB হতে পারবে।"
      );

      e.target.value = "";
      return;
    }

    setEditImageFile(file);
    setEditImagePreview(
      URL.createObjectURL(file)
    );
  }

  // ==========================================
  // ADD PRODUCT
  // ==========================================

  async function addProduct() {
    if (
      !name.trim() ||
      !price ||
      !category.trim() ||
      !stock
    ) {
      alert(
        "সব প্রয়োজনীয় তথ্য পূরণ করুন।"
      );

      return;
    }

    if (!imageFile && !imageUrl.trim()) {
      alert(
        "Computer থেকে Product Image Upload করুন অথবা Image URL দিন।"
      );

      return;
    }

    try {
      setUploadingImage(true);

      let finalImageUrl =
        imageUrl.trim();

      if (imageFile) {
        finalImageUrl =
          await uploadProductImage(
            imageFile,
            "admin"
          );
      }

      const { error } =
        await supabase
          .from("products")
          .insert([
            {
              name: name.trim(),
              price: Number(price),
              old_price: Number(
                oldPrice || 0
              ),
              category:
                category.trim(),
              image_url:
                finalImageUrl,
              description:
                description.trim(),
              stock: Number(stock),
            },
          ]);

      if (error) {
        console.error(
          "PRODUCT INSERT ERROR:",
          error
        );

        alert(
          "Product Save করা যায়নি.\n\n" +
            error.message
        );

        return;
      }

      alert(
        "Product Successfully Added!"
      );

      setName("");
      setPrice("");
      setOldPrice("");
      setCategory("");
      setImageUrl("");
      setImageFile(null);
      setImagePreview("");
      setStock("");
      setDescription("");

      setShowAddProduct(false);

      await loadData();
    } catch (error) {
      console.error(
        "PRODUCT ADD/IMAGE UPLOAD ERROR:",
        error
      );

      alert(
        "❌ Product Save করা যায়নি।\n\n" +
          (error instanceof Error
            ? error.message
            : "একটি সমস্যা হয়েছে।")
      );
    } finally {
      setUploadingImage(false);
    }
  }

  // ==========================================
  // OPEN EDIT PRODUCT
  // ==========================================

  function openEditProduct(
    product: Product
  ) {
    setEditingProduct(product);

    setEditName(
      product.name || ""
    );

    setEditPrice(
      String(product.price ?? "")
    );

    setEditOldPrice(
      String(
        product.old_price ?? ""
      )
    );

    setEditCategory(
      product.category || ""
    );

    setEditImageUrl(
      product.image_url || ""
    );

    setEditImageFile(null);
    setEditImagePreview("");

    setEditStock(
      String(product.stock ?? "")
    );

    setEditDescription(
      product.description || ""
    );

    setShowEditProduct(true);
  }

  // ==========================================
  // CLOSE EDIT PRODUCT
  // ==========================================

  function closeEditProduct() {
    setShowEditProduct(false);
    setEditingProduct(null);

    setEditName("");
    setEditPrice("");
    setEditOldPrice("");
    setEditCategory("");
    setEditImageUrl("");
    setEditImageFile(null);
    setEditImagePreview("");
    setEditStock("");
    setEditDescription("");
  }

  // ==========================================
  // UPDATE PRODUCT
  // ==========================================

  async function updateProduct() {
    if (!editingProduct) {
      return;
    }

    if (
      !editName.trim() ||
      !editPrice ||
      !editCategory.trim() ||
      !editStock
    ) {
      alert(
        "সব প্রয়োজনীয় তথ্য পূরণ করুন।"
      );

      return;
    }

    if (
      !editImageFile &&
      !editImageUrl.trim()
    ) {
      alert("Product Image দিন।");
      return;
    }

    try {
      setUpdatingProduct(true);

      let finalImageUrl =
        editImageUrl.trim();

      if (editImageFile) {
        finalImageUrl =
          await uploadProductImage(
            editImageFile,
            "admin"
          );
      }

      const {
        data: updatedProduct,
        error,
      } = await supabase
        .from("products")
        .update({
          name: editName.trim(),
          price: Number(editPrice),
          old_price: Number(
            editOldPrice || 0
          ),
          category:
            editCategory.trim(),
          image_url:
            finalImageUrl,
          stock: Number(editStock),
          description:
            editDescription.trim(),
        })
        .eq(
          "id",
          editingProduct.id
        )
        .select("*")
        .maybeSingle();

      if (error) {
        console.error(
          "PRODUCT UPDATE ERROR:",
          error
        );

        alert(
          "❌ Product Update করা যায়নি.\n\n" +
            error.message
        );

        return;
      }

      if (!updatedProduct) {
        alert(
          "❌ Product Update হয়নি.\n\n" +
            "সম্ভবত Supabase RLS Policy-তে UPDATE permission দেওয়া নেই।"
        );

        return;
      }

      setProducts(
        (currentProducts) =>
          currentProducts.map(
            (product) =>
              product.id ===
              editingProduct.id
                ? updatedProduct
                : product
          )
      );

      alert(
        `✅ "${updatedProduct.name}" Product Successfully Updated!`
      );

      closeEditProduct();
    } catch (error) {
      console.error(
        "PRODUCT UPDATE/IMAGE UPLOAD EXCEPTION:",
        error
      );

      alert(
        "❌ Product Update করার সময় একটি সমস্যা হয়েছে.\n\n" +
          (error instanceof Error
            ? error.message
            : "আবার চেষ্টা করুন।")
      );
    } finally {
      setUpdatingProduct(false);
    }
  }

  // ==========================================
  // DELETE PRODUCT
  // ==========================================

  async function deleteProduct(
    product: Product
  ) {
    const confirmed =
      window.confirm(
        `আপনি কি নিশ্চিতভাবে "${product.name}" Product টি Delete করতে চান?\n\nএই কাজটি Undo করা যাবে না।`
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingProduct(
        product.id
      );

      const { error } =
        await supabase
          .from("products")
          .delete()
          .eq(
            "id",
            product.id
          );

      if (error) {
        console.error(
          "PRODUCT DELETE ERROR:",
          error
        );

        alert(
          "❌ Product Delete করা যায়নি.\n\n" +
            error.message
        );

        return;
      }

      setProducts(
        (currentProducts) =>
          currentProducts.filter(
            (item) =>
              item.id !== product.id
          )
      );

      alert(
        `✅ "${product.name}" Product Successfully Deleted!`
      );
    } catch (error) {
      console.error(
        "PRODUCT DELETE EXCEPTION:",
        error
      );

      alert(
        "❌ Product Delete করার সময় একটি সমস্যা হয়েছে।"
      );
    } finally {
      setDeletingProduct(null);
    }
  }

  // ==========================================
  // UPDATE ORDER STATUS
  // ==========================================

  async function updateOrderStatus(
    orderId: number,
    newStatus: string
  ) {
    try {
      setUpdatingOrder(orderId);

      console.log(
        "Updating Order:",
        orderId,
        "New Status:",
        newStatus
      );

      const {
        data: updatedOrder,
        error,
      } = await supabase
        .from("orders")
        .update({
          status: newStatus,
        })
        .eq("id", orderId)
        .select("*")
        .maybeSingle();

      if (error) {
        console.error(
          "STATUS UPDATE ERROR:",
          error
        );

        alert(
          "❌ Status Save করা যায়নি.\n\n" +
            "Order ID: #" +
            orderId +
            "\n\n" +
            error.message
        );

        return;
      }

      if (!updatedOrder) {
        console.error(
          "NO UPDATED ORDER RETURNED"
        );

        alert(
          "❌ Status Database-এ Save হয়নি.\n\n" +
            "সম্ভবত Supabase RLS Policy-তে UPDATE permission দেওয়া নেই.\n\n" +
            "Order ID: #" +
            orderId
        );

        return;
      }

      console.log(
        "STATUS SAVED SUCCESSFULLY:",
        updatedOrder
      );

      setOrders(
        (currentOrders) =>
          currentOrders.map(
            (order) =>
              order.id === orderId
                ? {
                    ...order,
                    status:
                      updatedOrder.status,
                  }
                : order
          )
      );

      setSelectedOrder(
        (currentOrder) =>
          currentOrder &&
          currentOrder.id ===
            orderId
            ? {
                ...currentOrder,
                status:
                  updatedOrder.status,
              }
            : currentOrder
      );

      alert(
        `✅ Order #${orderId} status সফলভাবে "${getStatusText(
          updatedOrder.status
        )}" করা হয়েছে।`
      );
    } catch (error) {
      console.error(
        "STATUS UPDATE EXCEPTION:",
        error
      );

      alert(
        "❌ একটি সমস্যা হয়েছে.\n\n" +
          "Status Save করা যায়নি. আবার চেষ্টা করুন."
      );
    } finally {
      setUpdatingOrder(null);
    }
  }

  // ==========================================
  // OPEN ORDER DETAILS
  // ==========================================

  function openOrderDetails(
    order: Order
  ) {
    setSelectedOrder(order);
    setShowOrderDetails(true);
  }

  // ==========================================
  // CLOSE ORDER DETAILS
  // ==========================================

  function closeOrderDetails() {
    setShowOrderDetails(false);
    setSelectedOrder(null);
  }

  // ==========================================
  // STATUS TEXT
  // ==========================================

  function getStatusText(
    status: string
  ) {
    const value =
      status?.toLowerCase();

    switch (value) {
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

  // ==========================================
  // STATUS ICON
  // ==========================================

  function getStatusIcon(
    status: string
  ) {
    const value =
      status?.toLowerCase();

    switch (value) {
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

  // ==========================================
  // STATUS CLASS
  // ==========================================

  function getStatusClass(
    status: string
  ) {
    const value =
      status?.toLowerCase();

    if (value === "pending") {
      return "status-pending";
    }

    if (value === "confirmed") {
      return "status-confirmed";
    }

    if (value === "processing") {
      return "status-processing";
    }

    if (value === "shipped") {
      return "status-shipped";
    }

    if (value === "delivered") {
      return "status-delivered";
    }

    if (
      value === "cancelled" ||
      value === "canceled"
    ) {
      return "status-cancelled";
    }

    return "status-pending";
  }

  // ==========================================
  // PAYMENT STATUS CLASS
  // ==========================================

  function getPaymentStatusClass(
    status?: string | null
  ) {
    const value =
      status?.toLowerCase();

    if (
      value === "paid" ||
      value === "success" ||
      value === "completed"
    ) {
      return "payment-paid";
    }

    if (
      value === "failed" ||
      value === "cancelled"
    ) {
      return "payment-failed";
    }

    return "payment-pending";
  }

  // ==========================================
  // PAYMENT STATUS TEXT
  // ==========================================

  function getPaymentStatusText(
    status?: string | null
  ) {
    const value =
      status?.toLowerCase();

    if (
      value === "paid" ||
      value === "success" ||
      value === "completed"
    ) {
      return "Paid";
    }

    if (
      value === "failed" ||
      value === "cancelled"
    ) {
      return "Failed";
    }

    return "Pending";
  }

  // ==========================================
  // PAYMENT METHOD
  // ==========================================

  function getPaymentMethodText(
    method?: string | null
  ) {
    if (!method) {
      return "Not specified";
    }

    if (
      method.toLowerCase() ===
      "sslcommerz"
    ) {
      return "SSLCommerz";
    }

    if (
      method.toLowerCase() ===
      "cod"
    ) {
      return "Cash on Delivery";
    }

    return method;
  }

  // ==========================================
  // DATE
  // ==========================================

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

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <main className="admin-loading">
        <div>
          <div className="admin-loading-logo">
            N
          </div>

          <h2>
            NIJUM SHOP
          </h2>

          <p>
            Loading Admin Panel...
          </p>
        </div>

        <AdminStyles />
      </main>
    );
  }

  // ==========================================
  // MAIN
  // ==========================================

  return (
    <main className="admin-page">

      {/* ======================================
          SIDEBAR
      ====================================== */}

      <aside className="admin-sidebar">

        <div className="admin-brand">

          <div className="admin-brand-logo">
            N
          </div>

          <div>
            <strong>
              NIJUM SHOP
            </strong>

            <span>
              ADMIN PANEL
            </span>
          </div>

        </div>

        <nav className="admin-nav">

          <a
            className="active"
            href="/admin"
          >
            📊 Dashboard
          </a>

          <a href="#products">
            🛍️ Products
          </a>

          <a href="#orders">
            📦 Orders
          </a>

          <a href="#vendors">
            👥 Vendors
          </a>

          <button
            type="button"
            className={`admin-nav-settings ${showSiteSettings ? "active" : ""}`}
            onClick={() => setShowSiteSettings(true)}
          >
            ⚙️ Settings
          </button>

          <a href="/">
            🌐 View Shop
          </a>

        </nav>

        <button
          className="admin-logout"
          onClick={logout}
        >
          🚪 Logout
        </button>

      </aside>

      {/* ======================================
          MAIN CONTENT
      ====================================== */}

      <section className="admin-main">

        {/* TOPBAR */}

        <header className="admin-topbar">

          <div>
            <span>
              Welcome back
            </span>

            <h1>
              Dashboard
            </h1>
          </div>

          <a
            href="/"
            className="view-shop"
          >
            🌐 View Shop
          </a>

        </header>

        {/* ====================================
            STATS
        ==================================== */}

        <section className="admin-stats">

          <div className="stat-card">

            <div className="stat-icon">
              🛍️
            </div>

            <div>
              <span>
                Total Products
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
                      order.status
                        ?.toLowerCase() ===
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
                Total Sales
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

        {/* ====================================
            VENDORS
        ==================================== */}

        <section
          className="admin-section"
          id="vendors"
        >

          <div className="admin-section-header">

            <div>
              <span>
                PARTNERS
              </span>

              <h2>
                Vendor Management
              </h2>
            </div>

            <button
              className="refresh-button"
              onClick={loadData}
            >
              🔄 Refresh Vendors
            </button>

          </div>

          {vendors.length === 0 ? (

            <div className="no-vendors">

              <div className="no-vendors-icon">
                👥
              </div>

              <h3>
                No Vendors Yet
              </h3>

              <p>
                নতুন Vendor Signup করলে
                এখানে দেখা যাবে।
              </p>

            </div>

          ) : (

            <div className="admin-table-wrapper">

              <table className="admin-table vendor-table">

                <thead>

                  <tr>

                    <th>
                      Vendor
                    </th>

                    <th>
                      Phone
                    </th>

                    <th>
                      Shop
                    </th>

                    <th>
                      Address
                    </th>

                    <th>
                      Status
                    </th>

                    <th>
                      Action
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {vendors.map(
                    (vendor) => {

                      const isActive =
                        vendor.membership_status
                          ?.toLowerCase() ===
                        "active";

                      return (
                        <tr
                          key={
                            vendor.id
                          }
                        >

                          {/* VENDOR */}

                          <td>

                            <div className="vendor-info">

                              <div className="vendor-avatar">
                                👤
                              </div>

                              <div>

                                <strong>
                                  {
                                    vendor.name ||
                                    "Vendor"
                                  }
                                </strong>

                                <span>
                                  ID:{" "}
                                  {vendor.id.slice(
                                    0,
                                    8
                                  )}
                                  ...
                                </span>

                              </div>

                            </div>

                          </td>

                          {/* PHONE */}

                          <td>
                            {vendor.phone ||
                              "Not provided"}
                          </td>

                          {/* SHOP */}

                          <td>

                            <strong className="vendor-shop-name">
                              {
                                vendor.shop_name ||
                                "No shop name"
                              }
                            </strong>

                          </td>

                          {/* ADDRESS */}

                          <td>

                            <span className="vendor-address">
                              {
                                vendor.shop_address ||
                                "No address provided"
                              }
                            </span>

                          </td>

                          {/* STATUS */}

                          <td>

                            <span
                              className={
                                isActive
                                  ? "vendor-status vendor-active"
                                  : "vendor-status vendor-inactive"
                              }
                            >

                              {isActive
                                ? "✓ Active"
                                : "⏳ Inactive"}

                            </span>

                          </td>

                          {/* ACTION */}

                          <td>

                            {isActive ? (

                              <button
                                className="vendor-action deactivate"
                                disabled={
                                  updatingVendor ===
                                  vendor.id
                                }
                                onClick={() =>
                                  updateVendorStatus(
                                    vendor.id,
                                    "inactive"
                                  )
                                }
                              >
                                {updatingVendor ===
                                vendor.id
                                  ? "⏳ Updating..."
                                  : "⛔ Deactivate"}
                              </button>

                            ) : (

                              <button
                                className="vendor-action activate"
                                disabled={
                                  updatingVendor ===
                                  vendor.id
                                }
                                onClick={() =>
                                  updateVendorStatus(
                                    vendor.id,
                                    "active"
                                  )
                                }
                              >
                                {updatingVendor ===
                                vendor.id
                                  ? "⏳ Updating..."
                                  : "✓ Activate"}
                              </button>

                            )}

                          </td>

                        </tr>
                      );
                    }
                  )}

                </tbody>

              </table>

            </div>

          )}

        </section>

        {showSiteSettings && (
          <section className="admin-section site-settings-section" id="settings">
            <div className="admin-section-header">
              <div>
                <span>WEBSITE</span>
                <h2>⚙️ Site Settings</h2>
              </div>
              <button
                type="button"
                className="refresh-button"
                onClick={() => setShowSiteSettings(false)}
              >
                ✕ Close
              </button>
            </div>

            <div className="site-settings-panel">
              <div className="site-settings-logo-box">
                <h3>Website Logo</h3>
                {settingsLogoPreview ? (
                  <img src={settingsLogoPreview} alt="Site Logo" className="site-settings-logo-preview" />
                ) : (
                  <div className="site-settings-logo-empty">No Logo</div>
                )}
                <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleSettingsLogoChange} />
                <small>Computer থেকে Logo select করুন। সর্বোচ্চ 5MB।</small>
              </div>

              <div className="site-settings-fields">
                <label>About Title</label>
                <input value={aboutTitle} onChange={(e) => setAboutTitle(e.target.value)} />

                <label>About Description</label>
                <textarea rows={4} value={aboutDescription} onChange={(e) => setAboutDescription(e.target.value)} />

                <label>Mobile Number</label>
                <input value={sitePhone} onChange={(e) => setSitePhone(e.target.value)} />

                <label>WhatsApp Number</label>
                <input value={siteWhatsapp} onChange={(e) => setSiteWhatsapp(e.target.value)} />

                <label>Email</label>
                <input type="email" value={siteEmail} onChange={(e) => setSiteEmail(e.target.value)} />

                <label>Address</label>
                <input value={siteAddress} onChange={(e) => setSiteAddress(e.target.value)} />

                <label>Contact Description</label>
                <textarea rows={3} value={contactDescription} onChange={(e) => setContactDescription(e.target.value)} />

                <div className="site-settings-actions">
                  <button type="button" className="site-settings-save" disabled={savingSettings} onClick={saveSiteSettings}>
                    {savingSettings ? "Saving..." : "💾 Save Settings"}
                  </button>
                  <button type="button" className="refresh-button" onClick={() => setShowSiteSettings(false)}>Cancel</button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ====================================
            PRODUCTS
        ==================================== */}

        <section
          className="admin-section"
          id="products"
        >

          <div className="admin-section-header">

            <div>
              <span>
                STORE
              </span>

              <h2>
                Products
              </h2>
            </div>

            <button
              className="gold-button"
              onClick={() =>
                setShowAddProduct(true)
              }
            >
              + Add Product
            </button>

          </div>

          <div className="admin-table-wrapper">

            <table className="admin-table">

              <thead>
                <tr>

                  <th>
                    Product
                  </th>

                  <th>
                    Category
                  </th>

                  <th>
                    Price
                  </th>

                  <th>
                    Stock
                  </th>

                  <th>
                    Action
                  </th>

                </tr>
              </thead>

              <tbody>

                {products.map(
                  (product) => (

                    <tr
                      key={product.id}
                    >

                      <td>

                        <div className="admin-product">

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
                            <div className="product-image-placeholder">
                              📦
                            </div>
                          )}

                          <div>

                            <strong>
                              {product.name}
                            </strong>

                            <span>
                              ID: #{product.id}
                            </span>

                          </div>

                        </div>

                      </td>

                      <td>
                        {product.category}
                      </td>

                      <td>
                        <strong className="gold-text">
                          ৳{product.price}
                        </strong>
                      </td>

                      <td>

                        <span
                          className={
                            product.stock > 0
                              ? "stock-ok"
                              : "stock-out"
                          }
                        >
                          {product.stock}
                        </span>

                      </td>

                      <td>

                        <button
                          className="small-action"
                          title="Edit Product"
                          onClick={() =>
                            openEditProduct(
                              product
                            )
                          }
                          disabled={
                            updatingProduct
                          }
                        >
                          ✏️
                        </button>

                        <button
                          className="small-action delete"
                          title="Delete Product"
                          onClick={() =>
                            deleteProduct(
                              product
                            )
                          }
                          disabled={
                            deletingProduct ===
                            product.id
                          }
                        >
                          {deletingProduct ===
                          product.id
                            ? "⏳"
                            : "🗑️"}
                        </button>

                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        </section>

        {/* ====================================
            ORDERS
        ==================================== */}

        <section
          className="admin-section"
          id="orders"
        >

          <div className="admin-section-header">

            <div>
              <span>
                SALES
              </span>

              <h2>
                Order Management
              </h2>
            </div>

            <button
              className="refresh-button"
              onClick={loadData}
            >
              🔄 Refresh
            </button>

          </div>

          {/* ORDER STATUS FLOW */}

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

            <div className="no-orders">

              <div>
                📦
              </div>

              <h3>
                No Orders Yet
              </h3>

              <p>
                Customer-এর Order এখানে
                দেখা যাবে।
              </p>

            </div>

          ) : (

            <div className="admin-table-wrapper orders-table-wrapper">

              <table className="admin-table orders-table">

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
                      Current Status
                    </th>

                    <th>
                      View
                    </th>

                    <th>
                      Change Status
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {orders.map(
                    (order) => (

                      <tr
                        key={order.id}
                      >

                        <td>

                          <strong>
                            #{order.id}
                          </strong>

                        </td>

                        <td>

                          <strong>
                            {order.customer_name}
                          </strong>

                        </td>

                        <td>
                          {order.customer_phone}
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

                            {getStatusIcon(
                              order.status
                            )}{" "}

                            {getStatusText(
                              order.status
                            )}

                          </span>

                        </td>

                        <td>

                          <button
                            className="view-details-button"
                            title="View Order Details"
                            onClick={() =>
                              openOrderDetails(
                                order
                              )
                            }
                          >
                            👁️ View Details
                          </button>

                        </td>

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

                                const newStatus =
                                  e.target.value;

                                await updateOrderStatus(
                                  order.id,
                                  newStatus
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

      </section>

      {/* ======================================
          ADD PRODUCT MODAL
      ====================================== */}

      {showAddProduct && (

        <div className="modal-overlay">

          <div className="order-modal">

            <div className="modal-header">

              <div>

                <span>
                  STORE
                </span>

                <h2>
                  ➕ Add Product
                </h2>

              </div>

              <button
                className="close-button"
                onClick={() =>
                  setShowAddProduct(false)
                }
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
                setName(e.target.value)
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
                setPrice(e.target.value)
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
                setOldPrice(e.target.value)
              }
              placeholder="Old Price"
            />

            <label>
              Category
            </label>

            <input
              value={category}
              onChange={(e) =>
                setCategory(e.target.value)
              }
              placeholder="Gadgets"
            />

            <label>
              Product Image (Computer Upload)
            </label>

            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={
                handleAddImageChange
              }
              disabled={
                uploadingImage
              }
            />

            {imagePreview && (
              <div className="admin-upload-preview">

                <img
                  src={imagePreview}
                  alt="Selected Product Preview"
                />

                <div>

                  <strong>
                    Selected Image
                  </strong>

                  <span>
                    {imageFile?.name}
                  </span>

                </div>

              </div>
            )}

            <div className="image-url-divider">
              <span>
                OR
              </span>
            </div>

            <label>
              Image URL (Optional)
            </label>

            <input
              value={imageUrl}
              onChange={(e) =>
                setImageUrl(
                  e.target.value
                )
              }
              placeholder="https://..."
              disabled={
                !!imageFile ||
                uploadingImage
              }
            />

            <label>
              Stock
            </label>

            <input
              type="number"
              value={stock}
              onChange={(e) =>
                setStock(e.target.value)
              }
              placeholder="Stock"
            />

            <label>
              Description
            </label>

            <textarea
              rows={4}
              value={description}
              onChange={(e) =>
                setDescription(
                  e.target.value
                )
              }
              placeholder="Product Description"
            />

            <button
              className="confirm-order"
              onClick={addProduct}
              disabled={
                uploadingImage
              }
            >
              {uploadingImage
                ? "⏳ Uploading..."
                : "💾 Save Product"}
            </button>

          </div>

        </div>

      )}

      {/* ======================================
          EDIT PRODUCT MODAL
      ====================================== */}

      {showEditProduct &&
        editingProduct && (

        <div
          className="modal-overlay"
          onClick={(e) => {

            if (
              e.target ===
              e.currentTarget
            ) {
              closeEditProduct();
            }

          }}
        >

          <div className="order-modal">

            <div className="modal-header">

              <div>

                <span>
                  STORE
                </span>

                <h2>
                  ✏️ Edit Product
                </h2>

              </div>

              <button
                className="close-button"
                onClick={
                  closeEditProduct
                }
              >
                ✕
              </button>

            </div>

            <div className="edit-product-id">
              Editing Product #
              {editingProduct.id}
            </div>

            <label>
              Product Name
            </label>

            <input
              value={editName}
              onChange={(e) =>
                setEditName(
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
              value={editPrice}
              onChange={(e) =>
                setEditPrice(
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
              value={editOldPrice}
              onChange={(e) =>
                setEditOldPrice(
                  e.target.value
                )
              }
              placeholder="Old Price"
            />

            <label>
              Category
            </label>

            <input
              value={editCategory}
              onChange={(e) =>
                setEditCategory(
                  e.target.value
                )
              }
              placeholder="Gadgets"
            />

            <label>
              Product Image (Computer Upload)
            </label>

            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={
                handleEditImageChange
              }
              disabled={
                updatingProduct
              }
            />

            {editImagePreview && (
              <div className="admin-upload-preview">

                <img
                  src={
                    editImagePreview
                  }
                  alt="New Product Preview"
                />

                <div>

                  <strong>
                    New Image Selected
                  </strong>

                  <span>
                    {editImageFile?.name}
                  </span>

                </div>

              </div>
            )}

            <div className="image-url-divider">
              <span>
                OR
              </span>
            </div>

            <label>
              Image URL
            </label>

            <input
              value={editImageUrl}
              onChange={(e) =>
                setEditImageUrl(
                  e.target.value
                )
              }
              placeholder="https://..."
              disabled={
                !!editImageFile ||
                updatingProduct
              }
            />

            {editImageUrl &&
              !editImagePreview && (
                <div className="edit-image-preview">

                  <img
                    src={
                      editImageUrl
                    }
                    alt="Product Preview"
                  />

                  <span>
                    Current Image
                  </span>

                </div>
              )}

            <label>
              Stock
            </label>

            <input
              type="number"
              value={editStock}
              onChange={(e) =>
                setEditStock(
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
                editDescription
              }
              onChange={(e) =>
                setEditDescription(
                  e.target.value
                )
              }
              placeholder="Product Description"
            />

            <div className="edit-product-buttons">

              <button
                className="cancel-edit-button"
                onClick={
                  closeEditProduct
                }
                disabled={
                  updatingProduct
                }
              >
                Cancel
              </button>

              <button
                className="confirm-order"
                onClick={
                  updateProduct
                }
                disabled={
                  updatingProduct
                }
              >
                {updatingProduct
                  ? "⏳ Updating..."
                  : "💾 Update Product"}
              </button>

            </div>

          </div>

        </div>

      )}

      {/* ======================================
          ORDER DETAILS MODAL
      ====================================== */}

      {showOrderDetails &&
        selectedOrder && (

        <div
          className="modal-overlay"
          onClick={(e) => {

            if (
              e.target ===
              e.currentTarget
            ) {
              closeOrderDetails();
            }

          }}
        >

          <div className="order-details-modal">

            {/* HEADER */}

            <div className="details-header">

              <div>

                <span>
                  ORDER DETAILS
                </span>

                <h2>
                  Order #
                  {selectedOrder.id}
                </h2>

              </div>

              <button
                className="close-button"
                onClick={
                  closeOrderDetails
                }
              >
                ✕
              </button>

            </div>

            {/* STATUS */}

            <div className="details-status-box">

              <div>

                <small>
                  CURRENT ORDER STATUS
                </small>

                <div
                  className={`order-status large ${getStatusClass(
                    selectedOrder.status
                  )}`}
                >

                  {getStatusIcon(
                    selectedOrder.status
                  )}{" "}

                  {getStatusText(
                    selectedOrder.status
                  )}

                </div>

              </div>

              <div className="details-date">

                <small>
                  ORDER DATE
                </small>

                <strong>
                  {formatDate(
                    selectedOrder.created_at
                  )}
                </strong>

              </div>

            </div>

            {/* CUSTOMER INFORMATION */}

            <div className="details-section">

              <div className="details-section-title">
                👤 Customer Information
              </div>

              <div className="details-grid">

                <div className="detail-item">

                  <span>
                    Customer Name
                  </span>

                  <strong>
                    {
                      selectedOrder.customer_name ||
                      "Not provided"
                    }
                  </strong>

                </div>

                <div className="detail-item">

                  <span>
                    Phone
                  </span>

                  <strong>
                    {
                      selectedOrder.customer_phone ||
                      "Not provided"
                    }
                  </strong>

                </div>

                <div className="detail-item full">

                  <span>
                    Delivery Address
                  </span>

                  <strong>
                    {
                      selectedOrder.customer_address ||
                      "No address provided"
                    }
                  </strong>

                </div>

                <div className="detail-item full">

                  <span>
                    Order Note
                  </span>

                  <strong>
                    {
                      selectedOrder.order_note ||
                      "No order note"
                    }
                  </strong>

                </div>

              </div>

            </div>

            {/* PAYMENT INFORMATION */}

            <div className="details-section">

              <div className="details-section-title">
                💳 Payment Information
              </div>

              <div className="details-grid">

                <div className="detail-item">

                  <span>
                    Payment Method
                  </span>

                  <strong>
                    {getPaymentMethodText(
                      selectedOrder.payment_method
                    )}
                  </strong>

                </div>

                <div className="detail-item">

                  <span>
                    Payment Status
                  </span>

                  <strong>

                    <span
                      className={`payment-status ${getPaymentStatusClass(
                        selectedOrder.payment_status
                      )}`}
                    >
                      {getPaymentStatusText(
                        selectedOrder.payment_status
                      )}
                    </span>

                  </strong>

                </div>

                {selectedOrder.transaction_id && (

                  <div className="detail-item">

                    <span>
                      Transaction ID
                    </span>

                    <strong className="transaction-text">
                      {
                        selectedOrder.transaction_id
                      }
                    </strong>

                  </div>

                )}

                {selectedOrder.validation_id && (

                  <div className="detail-item">

                    <span>
                      Validation ID
                    </span>

                    <strong className="transaction-text">
                      {
                        selectedOrder.validation_id
                      }
                    </strong>

                  </div>

                )}

              </div>

            </div>

            {/* ORDER ITEMS */}

            <div className="details-section">

              <div className="details-section-title">
                📦 Ordered Products
              </div>

              {selectedOrder.items &&
              Array.isArray(
                selectedOrder.items
              ) &&
              selectedOrder.items.length > 0 ? (

                <div className="details-items">

                  {selectedOrder.items.map(
                    (item, index) => (

                      <div
                        className="details-product"
                        key={
                          `${item.product_id || "item"}-${index}`
                        }
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

                          <div className="details-product-placeholder">
                            📦
                          </div>

                        )}

                        <div className="details-product-info">

                          <strong>
                            {
                              item.product_name ||
                              "Product"
                            }
                          </strong>

                          <span>
                            {
                              item.category ||
                              "Gadgets"
                            }
                          </span>

                          <small>
                            ৳
                            {Number(
                              item.price || 0
                            ).toFixed(2)}{" "}
                            ×{" "}
                            {Number(
                              item.quantity || 0
                            )}
                          </small>

                        </div>

                        <strong className="details-subtotal">

                          ৳
                          {Number(
                            item.subtotal ??
                              Number(
                                item.price || 0
                              ) *
                                Number(
                                  item.quantity ||
                                    0
                                )
                          ).toFixed(2)}

                        </strong>

                      </div>

                    )
                  )}

                </div>

              ) : (

                <div className="no-items">
                  📦 No product details found.
                </div>

              )}

            </div>

            {/* TOTAL */}

            <div className="details-total">

              <span>
                Order Total
              </span>

              <strong>
                ৳
                {Number(
                  selectedOrder.total_amount ||
                    0
                ).toFixed(2)}
              </strong>

            </div>

            {/* STATUS CONTROL */}

            <div className="details-status-control">

              <div>

                <span>
                  Change Order Status
                </span>

                <small>
                  Admin can update this order
                  status.
                </small>

              </div>

              <select
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
                onChange={async (e) => {

                  const newStatus =
                    e.target.value;

                  await updateOrderStatus(
                    selectedOrder.id,
                    newStatus
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
              className="details-close-button"
              onClick={
                closeOrderDetails
              }
            >
              Close
            </button>

          </div>

        </div>

      )}

      <AdminStyles />

    </main>
  );
}


/* =====================================================
   ADMIN STYLES
===================================================== */

function AdminStyles() {
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

      .admin-page {
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

      .admin-sidebar {
        width: 245px;

        position: fixed;
        left: 0;
        top: 0;
        bottom: 0;

        display: flex;
        flex-direction: column;

        padding: 25px 18px;

        background:
          rgba(12,12,12,0.97);

        border-right:
          1px solid
          rgba(212,175,55,0.13);

        z-index: 20;
      }

      .admin-brand {
        display: flex;
        align-items: center;

        gap: 12px;

        padding: 5px 5px 28px;

        border-bottom:
          1px solid
          rgba(255,255,255,0.06);
      }

      .admin-brand-logo {
        width: 43px;
        height: 43px;

        display: flex;
        align-items: center;
        justify-content: center;

        border-radius: 12px;

        background:
          linear-gradient(
            135deg,
            #d4af37,
            #f5d76e
          );

        color: #080808;

        font-size: 23px;
        font-weight: 950;
      }

      .admin-brand strong {
        display: block;

        color: #eee;

        font-size: 14px;

        letter-spacing: 0.6px;
      }

      .admin-brand span {
        display: block;

        margin-top: 3px;

        color: #777;

        font-size: 9px;

        letter-spacing: 1.5px;
      }

      .admin-nav {
        display: flex;
        flex-direction: column;

        gap: 7px;

        padding-top: 25px;
      }

      .admin-nav-settings {
        width: 100%;
        border: 0;
        background: transparent;
        color: #f5f5f5;
        padding: 13px 14px;
        border-radius: 10px;
        text-align: left;
        font: inherit;
        cursor: pointer;
      }

      .admin-nav-settings:hover,
      .admin-nav-settings.active {
        background: rgba(212,175,55,0.12);
        color: #d4af37;
      }

      .site-settings-panel {
        display: grid;
        grid-template-columns: 280px 1fr;
        gap: 28px;
        padding: 24px;
        background: rgba(15,15,15,0.95);
        border: 1px solid rgba(212,175,55,0.18);
        border-radius: 16px;
      }

      .site-settings-logo-box,
      .site-settings-fields {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .site-settings-logo-preview {
        width: 180px;
        height: 120px;
        object-fit: contain;
        border-radius: 12px;
        background: #080808;
        border: 1px solid rgba(212,175,55,0.25);
        padding: 10px;
      }

      .site-settings-logo-empty {
        width: 180px;
        height: 120px;
        display: grid;
        place-items: center;
        border: 1px dashed rgba(212,175,55,0.3);
        border-radius: 12px;
        color: #aaa;
      }

      .site-settings-fields input,
      .site-settings-fields textarea {
        width: 100%;
        padding: 12px 14px;
        border-radius: 10px;
        border: 1px solid rgba(255,255,255,0.12);
        background: #0b0b0b;
        color: #fff;
        outline: none;
        font: inherit;
      }

      .site-settings-actions {
        display: flex;
        gap: 12px;
        margin-top: 10px;
      }

      .site-settings-save {
        border: 0;
        border-radius: 10px;
        padding: 12px 20px;
        background: linear-gradient(135deg, #d4af37, #f3d46b);
        color: #111;
        font-weight: 800;
        cursor: pointer;
      }

      .site-settings-save:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .admin-nav a {
        display: block;

        padding: 12px 13px;

        border-radius: 10px;

        text-decoration: none;

        color: #888;

        font-size: 13px;

        font-weight: 700;

        transition: 0.25s;
      }

      .admin-nav a:hover,
      .admin-nav a.active {
        color: #d4af37;

        background:
          rgba(212,175,55,0.09);
      }

      .admin-logout {
        margin-top: auto;

        padding: 12px;

        border-radius: 10px;

        border:
          1px solid
          rgba(239,68,68,0.2);

        background:
          rgba(239,68,68,0.07);

        color: #f87171;

        cursor: pointer;

        font-weight: 800;

        transition: 0.25s;
      }

      .admin-logout:hover {
        background:
          rgba(239,68,68,0.13);

        transform: translateY(-1px);
      }

      .admin-main {
        width: calc(100% - 245px);

        margin-left: 245px;

        padding: 30px 35px 60px;
      }

      .admin-topbar {
        display: flex;

        align-items: center;
        justify-content: space-between;

        margin-bottom: 30px;
      }

      .admin-topbar span {
        color: #777;

        font-size: 11px;
      }

      .admin-topbar h1 {
        margin: 5px 0 0;

        font-size: 28px;
      }

      .view-shop {
        padding: 10px 15px;

        border:
          1px solid
          rgba(212,175,55,0.3);

        border-radius: 10px;

        text-decoration: none;

        color: #d4af37;

        background:
          rgba(212,175,55,0.06);

        font-size: 12px;

        font-weight: 800;
      }

      .admin-stats {
        display: grid;

        grid-template-columns:
          repeat(4, 1fr);

        gap: 15px;

        margin-bottom: 35px;
      }

      .stat-card {
        display: flex;

        align-items: center;

        gap: 13px;

        padding: 19px;

        border-radius: 16px;

        background:
          rgba(18,18,18,0.95);

        border:
          1px solid
          rgba(255,255,255,0.07);
      }

      .stat-icon {
        width: 43px;
        height: 43px;

        display: flex;
        align-items: center;
        justify-content: center;

        border-radius: 12px;

        background:
          rgba(212,175,55,0.08);

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

      .admin-section {
        margin-bottom: 40px;
      }

      .admin-section-header {
        display: flex;

        align-items: end;
        justify-content: space-between;

        gap: 20px;

        margin-bottom: 17px;
      }

      .admin-section-header span {
        color: #d4af37;

        font-size: 9px;

        font-weight: 900;

        letter-spacing: 1.7px;
      }

      .admin-section-header h2 {
        margin: 5px 0 0;

        font-size: 21px;
      }

      .gold-button,
      .refresh-button {
        padding: 11px 15px;

        border-radius: 10px;

        cursor: pointer;

        font-weight: 800;
      }

      .gold-button {
        border:
          1px solid
          #d4af37;

        background:
          #d4af37;

        color: #080808;
      }

      .refresh-button {
        border:
          1px solid
          rgba(212,175,55,0.3);

        background:
          rgba(212,175,55,0.07);

        color: #d4af37;
      }

      .gold-button:hover,
      .refresh-button:hover {
        transform: translateY(-2px);

        box-shadow:
          0 8px 22px
          rgba(212,175,55,0.15);
      }

      .admin-table-wrapper {
        width: 100%;

        overflow-x: auto;

        border-radius: 16px;

        background:
          rgba(16,16,16,0.96);

        border:
          1px solid
          rgba(255,255,255,0.07);
      }

      .admin-table {
        width: 100%;

        min-width: 800px;

        border-collapse: collapse;
      }

      .orders-table {
        min-width: 0;
        width: 100%;
        table-layout: auto;
      }

      .vendor-table {
        min-width: 1050px;
      }

      .admin-table th {
        padding: 9px 7px;

        text-align: left;

        color: #666;

        background: #111;

        border-bottom:
          1px solid
          rgba(255,255,255,0.07);

        font-size: 9px;

        letter-spacing: 1.2px;

        text-transform: uppercase;
      }

      .admin-table td {
        padding: 9px 7px;

        color: #aaa;

        border-bottom:
          1px solid
          rgba(255,255,255,0.05);

        font-size: 12px;

        vertical-align: middle;
      }

      .admin-table tbody tr:last-child td {
        border-bottom: none;
      }

      .admin-table tbody tr:hover {
        background:
          rgba(212,175,55,0.025);
      }


      /* =====================================
         COMPACT ORDER MANAGEMENT TABLE
      ===================================== */
      .orders-table th,
      .orders-table td {
        padding-left: 6px;
        padding-right: 6px;
        white-space: nowrap;
      }

      .orders-table th {
        font-size: 8px;
        letter-spacing: 0.7px;
      }

      .orders-table td {
        font-size: 10px;
      }

      .orders-table .view-details-button {
        padding: 6px 8px;
        font-size: 9px;
        white-space: nowrap;
      }

      .orders-table .status-control select {
        min-width: 112px;
        padding: 6px 7px;
        font-size: 9px;
      }

      /* =====================================
         VENDOR MANAGEMENT
      ===================================== */

      .vendor-info {
        display: flex;

        align-items: center;

        gap: 10px;
      }

      .vendor-avatar {
        width: 43px;
        height: 43px;

        flex-shrink: 0;

        display: flex;

        align-items: center;
        justify-content: center;

        border-radius: 11px;

        background:
          rgba(212,175,55,0.08);

        border:
          1px solid
          rgba(212,175,55,0.15);

        font-size: 18px;
      }

      .vendor-info strong {
        display: block;

        color: #ddd;

        font-size: 12px;
      }

      .vendor-info span {
        display: block;

        margin-top: 4px;

        color: #666;

        font-size: 9px;

        font-family: monospace;
      }

      .vendor-shop-name {
        color: #ddd;
      }

      .vendor-address {
        display: block;

        max-width: 220px;

        color: #888;

        font-size: 10px;

        line-height: 1.5;
      }

      .vendor-status {
        display: inline-flex;

        align-items: center;

        padding: 7px 10px;

        border-radius: 8px;

        font-size: 10px;

        font-weight: 900;

        white-space: nowrap;
      }

      .vendor-active {
        color: #4ade80;

        background:
          rgba(34,197,94,0.10);

        border:
          1px solid
          rgba(34,197,94,0.12);
      }

      .vendor-inactive {
        color: #facc15;

        background:
          rgba(234,179,8,0.10);

        border:
          1px solid
          rgba(234,179,8,0.12);
      }

      .vendor-action {
        padding: 8px 11px;

        border-radius: 8px;

        cursor: pointer;

        white-space: nowrap;

        font-size: 10px;

        font-weight: 900;

        transition: 0.2s;
      }

      .vendor-action.activate {
        border:
          1px solid
          rgba(34,197,94,0.25);

        background:
          rgba(34,197,94,0.08);

        color: #4ade80;
      }

      .vendor-action.activate:hover {
        background:
          rgba(34,197,94,0.15);

        transform:
          translateY(-1px);
      }

      .vendor-action.deactivate {
        border:
          1px solid
          rgba(239,68,68,0.25);

        background:
          rgba(239,68,68,0.08);

        color: #f87171;
      }

      .vendor-action.deactivate:hover {
        background:
          rgba(239,68,68,0.15);

        transform:
          translateY(-1px);
      }

      .vendor-action:disabled {
        opacity: 0.5;

        cursor: wait;

        transform: none;
      }

      .no-vendors {
        padding: 60px 20px;

        text-align: center;

        border-radius: 16px;

        background:
          rgba(16,16,16,0.95);

        border:
          1px solid
          rgba(255,255,255,0.06);
      }

      .no-vendors-icon {
        font-size: 50px;
      }

      .no-vendors h3 {
        margin: 12px 0 5px;

        color: #ddd;
      }

      .no-vendors p {
        margin: 0;

        color: #666;

        font-size: 12px;
      }

      .admin-product {
        display: flex;

        align-items: center;

        gap: 10px;
      }

      .admin-product img,
      .product-image-placeholder {
        width: 48px;
        height: 48px;

        flex-shrink: 0;

        object-fit: cover;

        border-radius: 9px;

        background: #191919;

        border:
          1px solid
          rgba(255,255,255,0.08);
      }

      .product-image-placeholder {
        display: flex;

        align-items: center;
        justify-content: center;

        font-size: 20px;
      }

      .admin-product strong {
        display: block;

        color: #ddd;

        font-size: 12px;
      }

      .admin-product span {
        display: block;

        margin-top: 4px;

        color: #666;

        font-size: 9px;
      }

      .gold-text {
        color: #d4af37 !important;
      }

      .stock-ok,
      .stock-out {
        padding: 5px 8px;

        border-radius: 7px;

        font-size: 10px;

        font-weight: 800;
      }

      .stock-ok {
        color: #4ade80;

        background:
          rgba(34,197,94,0.09);
      }

      .stock-out {
        color: #f87171;

        background:
          rgba(239,68,68,0.09);
      }

      .small-action {
        width: 31px;
        height: 31px;

        margin-right: 5px;

        border-radius: 8px;

        border:
          1px solid
          rgba(255,255,255,0.08);

        background:
          rgba(255,255,255,0.04);

        cursor: pointer;

        transition: 0.2s;
      }

      .small-action:hover {
        background:
          rgba(212,175,55,0.1);
      }

      .small-action.delete:hover {
        background:
          rgba(239,68,68,0.1);
      }

      .small-action:disabled {
        opacity: 0.45;

        cursor: wait;
      }

      /* =====================================
         EDIT PRODUCT
      ===================================== */

      .edit-product-id {
        margin-top: -10px;
        margin-bottom: 14px;

        color: #666;

        font-size: 9px;

        font-family: monospace;
      }

      .edit-image-preview {
        display: flex;

        align-items: center;

        gap: 10px;

        margin-top: 10px;

        padding: 9px;

        border-radius: 10px;

        background:
          rgba(255,255,255,0.025);

        border:
          1px solid
          rgba(255,255,255,0.06);
      }

      .edit-image-preview img {
        width: 55px;
        height: 55px;

        object-fit: cover;

        border-radius: 9px;

        border:
          1px solid
          rgba(212,175,55,0.2);

        background: #191919;
      }

      .edit-image-preview span {
        color: #777;

        font-size: 9px;
      }

      .edit-product-buttons {
        display: grid;

        grid-template-columns:
          1fr 2fr;

        gap: 10px;

        margin-top: 20px;
      }

      .edit-product-buttons .confirm-order {
        margin-top: 0;
      }

      .cancel-edit-button {
        width: 100%;

        padding: 13px;

        border-radius: 10px;

        border:
          1px solid
          rgba(255,255,255,0.08);

        background:
          rgba(255,255,255,0.04);

        color: #aaa;

        cursor: pointer;

        font-weight: 800;

        transition: 0.2s;
      }

      .cancel-edit-button:hover {
        color: #d4af37;

        border-color:
          rgba(212,175,55,0.3);

        background:
          rgba(212,175,55,0.06);
      }

      .cancel-edit-button:disabled,
      .confirm-order:disabled {
        opacity: 0.55;

        cursor: wait;
      }

      /* =====================================
         VIEW DETAILS BUTTON
      ===================================== */

      .view-details-button {
        display: inline-flex;

        align-items: center;

        gap: 6px;

        padding: 8px 11px;

        border-radius: 8px;

        border:
          1px solid
          rgba(212,175,55,0.25);

        background:
          rgba(212,175,55,0.07);

        color: #d4af37;

        cursor: pointer;

        white-space: nowrap;

        font-size: 10px;

        font-weight: 900;

        transition: 0.2s;
      }

      .view-details-button:hover {
        background:
          rgba(212,175,55,0.14);

        border-color:
          rgba(212,175,55,0.5);

        transform:
          translateY(-1px);

        box-shadow:
          0 5px 15px
          rgba(212,175,55,0.08);
      }

      /* =====================================
         ORDER STATUS
      ===================================== */

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

      .order-status.large {
        margin-top: 8px;

        padding:
          9px 13px;

        font-size: 12px;
      }

      .status-pending {
        color: #facc15;

        background:
          rgba(234,179,8,0.10);
      }

      .status-confirmed {
        color: #a78bfa;

        background:
          rgba(139,92,246,0.10);
      }

      .status-processing {
        color: #60a5fa;

        background:
          rgba(59,130,246,0.10);
      }

      .status-shipped {
        color: #38bdf8;

        background:
          rgba(14,165,233,0.10);
      }

      .status-delivered {
        color: #4ade80;

        background:
          rgba(34,197,94,0.10);
      }

      .status-cancelled {
        color: #f87171;

        background:
          rgba(239,68,68,0.10);
      }

      /* =====================================
         STATUS GUIDE
      ===================================== */

      .status-guide {
        margin-bottom: 15px;

        padding: 15px 18px;

        border-radius: 14px;

        background:
          rgba(212,175,55,0.035);

        border:
          1px solid
          rgba(212,175,55,0.12);
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

        background:
          rgba(255,255,255,0.04);

        color: #aaa;

        font-size: 10px;
      }

      .status-flow b {
        color: #555;

        font-size: 12px;
      }

      /* =====================================
         STATUS CONTROL
      ===================================== */

      .status-control {
        display: flex;

        align-items: center;

        gap: 8px;
      }

      .status-control select {
        min-width: 145px;

        padding: 9px 10px;

        border-radius: 9px;

        border:
          1px solid
          rgba(212,175,55,0.25);

        outline: none;

        background:
          #111;

        color: #ddd;

        cursor: pointer;

        font-size: 11px;

        font-weight: 700;
      }

      .status-control select:hover {
        border-color:
          rgba(212,175,55,0.55);
      }

      .status-control select:focus {
        border-color:
          #d4af37;

        box-shadow:
          0 0 0 2px
          rgba(212,175,55,0.08);
      }

      .status-control select:disabled {
        opacity: 0.55;

        cursor: wait;
      }

      .status-control option {
        background: #111;

        color: #eee;
      }

      .updating {
        color: #d4af37;

        font-size: 9px;

        white-space: nowrap;

        animation:
          pulse 0.9s infinite;
      }

      @keyframes pulse {
        50% {
          opacity: 0.4;
        }
      }

      .date-text {
        color: #777;

        font-size: 10px;

        white-space: nowrap;
      }

      /* =====================================
         NO ORDERS
      ===================================== */

      .no-orders {
        padding: 60px 20px;

        text-align: center;

        border-radius: 16px;

        background:
          rgba(16,16,16,0.95);

        border:
          1px solid
          rgba(255,255,255,0.06);
      }

      .no-orders > div {
        font-size: 50px;
      }

      .no-orders h3 {
        margin: 12px 0 5px;

        color: #ddd;
      }

      .no-orders p {
        margin: 0;

        color: #666;

        font-size: 12px;
      }

      /* =====================================
         GENERAL MODAL
      ===================================== */

      .modal-overlay {
        position: fixed;

        inset: 0;

        z-index: 100;

        display: flex;

        align-items: center;
        justify-content: center;

        padding: 20px;

        background:
          rgba(0,0,0,0.78);

        backdrop-filter:
          blur(8px);
      }

      .order-modal {
        width: 100%;

        max-width: 520px;

        max-height: 90vh;

        overflow-y: auto;

        padding: 25px;

        border-radius: 18px;

        background:
          #111;

        border:
          1px solid
          rgba(212,175,55,0.18);

        box-shadow:
          0 30px 80px
          rgba(0,0,0,0.5);
      }

      /* =====================================
         ORDER DETAILS MODAL
      ===================================== */

      .order-details-modal {
        width: 100%;

        max-width: 780px;

        max-height: 92vh;

        overflow-y: auto;

        padding: 25px;

        border-radius: 20px;

        background:
          #101010;

        border:
          1px solid
          rgba(212,175,55,0.20);

        box-shadow:
          0 30px 100px
          rgba(0,0,0,0.65);
      }

      .details-header {
        display: flex;

        align-items: center;

        justify-content: space-between;

        gap: 20px;

        padding-bottom: 18px;

        border-bottom:
          1px solid
          rgba(255,255,255,0.07);
      }

      .details-header span {
        color: #d4af37;

        font-size: 8px;

        font-weight: 900;

        letter-spacing: 1.7px;
      }

      .details-header h2 {
        margin: 6px 0 0;

        font-size: 23px;

        color: #eee;
      }

      .details-status-box {
        display: flex;

        align-items: center;

        justify-content: space-between;

        gap: 20px;

        margin-top: 18px;

        padding: 16px;

        border-radius: 13px;

        background:
          rgba(212,175,55,0.045);

        border:
          1px solid
          rgba(212,175,55,0.12);
      }

      .details-status-box small,
      .details-date small {
        display: block;

        color: #666;

        font-size: 8px;

        font-weight: 900;

        letter-spacing: 1.1px;
      }

      .details-date {
        text-align: right;
      }

      .details-date strong {
        display: block;

        margin-top: 7px;

        color: #aaa;

        font-size: 10px;
      }

      /* =====================================
         DETAILS SECTION
      ===================================== */

      .details-section {
        margin-top: 18px;

        padding: 18px;

        border-radius: 14px;

        background:
          rgba(255,255,255,0.025);

        border:
          1px solid
          rgba(255,255,255,0.06);
      }

      .details-section-title {
        margin-bottom: 15px;

        color: #d4af37;

        font-size: 12px;

        font-weight: 900;
      }

      .details-grid {
        display: grid;

        grid-template-columns:
          repeat(2, 1fr);

        gap: 12px;
      }

      .detail-item {
        min-width: 0;

        padding: 12px;

        border-radius: 10px;

        background:
          rgba(0,0,0,0.20);

        border:
          1px solid
          rgba(255,255,255,0.04);
      }

      .detail-item.full {
        grid-column:
          1 / -1;
      }

      .detail-item > span {
        display: block;

        margin-bottom: 5px;

        color: #666;

        font-size: 9px;

        font-weight: 800;
      }

      .detail-item > strong {
        display: block;

        color: #ddd;

        font-size: 11px;

        line-height: 1.5;

        word-break: break-word;
      }

      .transaction-text {
        color: #d4af37 !important;

        font-family:
          monospace;

        font-size: 10px !important;
      }

      /* =====================================
         PAYMENT STATUS
      ===================================== */

      .payment-status {
        display: inline-flex;

        padding: 5px 8px;

        border-radius: 7px;

        font-size: 9px;

        font-weight: 900;
      }

      .payment-paid {
        color: #4ade80;

        background:
          rgba(34,197,94,0.10);
      }

      .payment-pending {
        color: #facc15;

        background:
          rgba(234,179,8,0.10);
      }

      .payment-failed {
        color: #f87171;

        background:
          rgba(239,68,68,0.10);
      }

      /* =====================================
         ORDER ITEMS
      ===================================== */

      .details-items {
        display: flex;

        flex-direction: column;

        gap: 8px;
      }

      .details-product {
        display: flex;

        align-items: center;

        gap: 12px;

        padding: 10px;

        border-radius: 10px;

        background:
          rgba(0,0,0,0.20);

        border:
          1px solid
          rgba(255,255,255,0.05);
      }

      .details-product img,
      .details-product-placeholder {
        width: 55px;
        height: 55px;

        flex-shrink: 0;

        object-fit: cover;

        border-radius: 9px;

        background: #191919;

        border:
          1px solid
          rgba(255,255,255,0.08);
      }

      .details-product-placeholder {
        display: flex;

        align-items: center;
        justify-content: center;

        font-size: 20px;
      }

      .details-product-info {
        flex: 1;

        min-width: 0;
      }

      .details-product-info strong {
        display: block;

        color: #ddd;

        font-size: 11px;
      }

      .details-product-info span {
        display: block;

        margin-top: 3px;

        color: #666;

        font-size: 9px;
      }

      .details-product-info small {
        display: block;

        margin-top: 5px;

        color: #999;

        font-size: 9px;
      }

      .details-subtotal {
        color: #d4af37;

        font-size: 11px;

        white-space: nowrap;
      }

      .no-items {
        padding: 25px;

        text-align: center;

        color: #666;

        font-size: 11px;
      }

      /* =====================================
         DETAILS TOTAL
      ===================================== */

      .details-total {
        display: flex;

        align-items: center;

        justify-content: space-between;

        margin-top: 18px;

        padding: 17px 18px;

        border-radius: 13px;

        background:
          linear-gradient(
            135deg,
            rgba(212,175,55,0.09),
            rgba(212,175,55,0.025)
          );

        border:
          1px solid
          rgba(212,175,55,0.18);
      }

      .details-total span {
        color: #aaa;

        font-size: 12px;

        font-weight: 800;
      }

      .details-total strong {
        color: #d4af37;

        font-size: 20px;
      }

      /* =====================================
         DETAILS STATUS CONTROL
      ===================================== */

      .details-status-control {
        display: flex;

        align-items: center;

        justify-content: space-between;

        gap: 20px;

        margin-top: 18px;

        padding: 15px;

        border-radius: 12px;

        background:
          rgba(255,255,255,0.025);

        border:
          1px solid
          rgba(255,255,255,0.06);
      }

      .details-status-control span {
        display: block;

        color: #ddd;

        font-size: 11px;

        font-weight: 800;
      }

      .details-status-control small {
        display: block;

        margin-top: 4px;

        color: #666;

        font-size: 9px;
      }

      .details-status-control select {
        min-width: 170px;

        padding: 10px 11px;

        border-radius: 9px;

        border:
          1px solid
          rgba(212,175,55,0.28);

        outline: none;

        background:
          #111;

        color: #ddd;

        cursor: pointer;

        font-size: 10px;

        font-weight: 800;
      }

      .details-status-control select:focus {
        border-color:
          #d4af37;

        box-shadow:
          0 0 0 2px
          rgba(212,175,55,0.08);
      }

      .details-status-control option {
        background: #111;

        color: #eee;
      }

      .details-close-button {
        width: 100%;

        margin-top: 15px;

        padding: 12px;

        border-radius: 10px;

        border:
          1px solid
          rgba(255,255,255,0.08);

        background:
          rgba(255,255,255,0.04);

        color: #aaa;

        cursor: pointer;

        font-weight: 800;

        transition: 0.2s;
      }

      .details-close-button:hover {
        color: #d4af37;

        border-color:
          rgba(212,175,55,0.3);

        background:
          rgba(212,175,55,0.06);
      }

      /* =====================================
         COMPUTER IMAGE UPLOAD
      ===================================== */

      .order-modal input[type="file"] {
        padding: 9px;

        cursor: pointer;

        color: #aaa;

        background: #0b0b0b;
      }

      .order-modal input[type="file"]::file-selector-button {
        margin-right: 10px;

        padding: 8px 11px;

        border: 1px solid
          rgba(212,175,55,0.35);

        border-radius: 8px;

        background:
          rgba(212,175,55,0.10);

        color: #d4af37;

        cursor: pointer;

        font-size: 10px;

        font-weight: 800;
      }

      .admin-upload-preview {
        display: flex;

        align-items: center;

        gap: 12px;

        margin-top: 10px;

        padding: 10px;

        border-radius: 10px;

        background:
          rgba(212,175,55,0.04);

        border: 1px solid
          rgba(212,175,55,0.14);
      }

      .admin-upload-preview img {
        width: 64px;

        height: 64px;

        flex-shrink: 0;

        object-fit: cover;

        border-radius: 9px;

        border: 1px solid
          rgba(255,255,255,0.10);
      }

      .admin-upload-preview div {
        min-width: 0;
      }

      .admin-upload-preview strong {
        display: block;

        color: #ddd;

        font-size: 11px;
      }

      .admin-upload-preview span {
        display: block;

        margin-top: 4px;

        overflow: hidden;

        color: #777;

        font-size: 9px;

        text-overflow: ellipsis;

        white-space: nowrap;
      }

      .image-url-divider {
        display: flex;

        align-items: center;

        gap: 10px;

        margin: 13px 0 2px;

        color: #555;

        font-size: 9px;

        font-weight: 900;
      }

      .image-url-divider::before,
      .image-url-divider::after {
        content: "";

        flex: 1;

        height: 1px;

        background:
          rgba(255,255,255,0.06);
      }

      .image-url-divider span {
        flex-shrink: 0;
      }

      /* =====================================
         MODAL HEADER
      ===================================== */

      .modal-header {
        display: flex;

        align-items: center;

        justify-content: space-between;

        margin-bottom: 22px;
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

        flex-shrink: 0;

        border-radius: 9px;

        border:
          1px solid
          rgba(255,255,255,0.08);

        background:
          rgba(255,255,255,0.04);

        color: #aaa;

        cursor: pointer;
      }

      .close-button:hover {
        color: #d4af37;

        border-color:
          rgba(212,175,55,0.3);
      }

      .order-modal label {
        display: block;

        margin:
          13px 0 6px;

        color: #888;

        font-size: 10px;

        font-weight: 800;
      }

      .order-modal input,
      .order-modal textarea {
        width: 100%;

        padding: 11px 12px;

        border-radius: 9px;

        border:
          1px solid
          rgba(255,255,255,0.08);

        outline: none;

        background:
          #0b0b0b;

        color: #eee;

        font-size: 12px;
      }

      .order-modal input:focus,
      .order-modal textarea:focus {
        border-color:
          rgba(212,175,55,0.55);
      }

      .order-modal textarea {
        resize: vertical;
      }

      .confirm-order {
        width: 100%;

        margin-top: 20px;

        padding: 13px;

        border-radius: 10px;

        border:
          1px solid
          #d4af37;

        background:
          #d4af37;

        color: #080808;

        cursor: pointer;

        font-weight: 900;
      }

      /* =====================================
         LOADING
      ===================================== */

      .admin-loading {
        min-height: 100vh;

        display: flex;

        align-items: center;
        justify-content: center;

        text-align: center;

        background: #080808;

        color: white;
      }

      .admin-loading-logo {
        width: 55px;
        height: 55px;

        margin: auto;

        display: flex;

        align-items: center;
        justify-content: center;

        border-radius: 15px;

        background:
          linear-gradient(
            135deg,
            #d4af37,
            #f5d76e
          );

        color: #080808;

        font-size: 27px;

        font-weight: 950;
      }

      .admin-loading h2 {
        margin:
          15px 0 5px;

        color: #d4af37;
      }

      .admin-loading p {
        color: #666;

        font-size: 12px;
      }

      /* =====================================
         MOBILE
      ===================================== */

      @media (max-width: 1000px) {

        .admin-sidebar {
          width: 205px;
        }

        .admin-main {
          width: calc(100% - 205px);

          margin-left: 205px;

          padding:
            25px 20px 50px;
        }

        .admin-stats {
          grid-template-columns:
            repeat(2, 1fr);
        }

      }

      @media (max-width: 700px) {

        .admin-page {
          display: block;
        }

        .admin-sidebar {
          position: relative;

          width: 100%;

          height: auto;

          padding: 15px;

          border-right: none;

          border-bottom:
            1px solid
            rgba(212,175,55,0.13);
        }

        .admin-brand {
          padding-bottom: 15px;
        }

        .admin-nav {
          flex-direction: row;

          overflow-x: auto;

          padding-top: 15px;
        }

        .admin-nav-settings {
        width: 100%;
        border: 0;
        background: transparent;
        color: #f5f5f5;
        padding: 13px 14px;
        border-radius: 10px;
        text-align: left;
        font: inherit;
        cursor: pointer;
      }

      .admin-nav-settings:hover,
      .admin-nav-settings.active {
        background: rgba(212,175,55,0.12);
        color: #d4af37;
      }

      .site-settings-panel {
        display: grid;
        grid-template-columns: 280px 1fr;
        gap: 28px;
        padding: 24px;
        background: rgba(15,15,15,0.95);
        border: 1px solid rgba(212,175,55,0.18);
        border-radius: 16px;
      }

      .site-settings-logo-box,
      .site-settings-fields {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .site-settings-logo-preview {
        width: 180px;
        height: 120px;
        object-fit: contain;
        border-radius: 12px;
        background: #080808;
        border: 1px solid rgba(212,175,55,0.25);
        padding: 10px;
      }

      .site-settings-logo-empty {
        width: 180px;
        height: 120px;
        display: grid;
        place-items: center;
        border: 1px dashed rgba(212,175,55,0.3);
        border-radius: 12px;
        color: #aaa;
      }

      .site-settings-fields input,
      .site-settings-fields textarea {
        width: 100%;
        padding: 12px 14px;
        border-radius: 10px;
        border: 1px solid rgba(255,255,255,0.12);
        background: #0b0b0b;
        color: #fff;
        outline: none;
        font: inherit;
      }

      .site-settings-actions {
        display: flex;
        gap: 12px;
        margin-top: 10px;
      }

      .site-settings-save {
        border: 0;
        border-radius: 10px;
        padding: 12px 20px;
        background: linear-gradient(135deg, #d4af37, #f3d46b);
        color: #111;
        font-weight: 800;
        cursor: pointer;
      }

      .site-settings-save:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .admin-nav a {
          white-space: nowrap;
        }

        .admin-logout {
          margin-top: 12px;
        }

        .admin-main {
          width: 100%;

          margin-left: 0;

          padding:
            20px 12px 40px;
        }

        .admin-topbar {
          margin-bottom: 20px;
        }

        .admin-topbar h1 {
          font-size: 24px;
        }

        .admin-stats {
          grid-template-columns: 1fr;
        }

        .admin-section-header {
          align-items: flex-start;

          flex-direction: column;
        }

        .status-flow {
          gap: 5px;
        }

        .status-flow b {
          display: none;
        }

        .order-details-modal {
          max-height: 94vh;

          padding: 18px;
        }

        .details-grid {
          grid-template-columns: 1fr;
        }

        .detail-item.full {
          grid-column: auto;
        }

        .details-status-box {
          align-items: flex-start;

          flex-direction: column;
        }

        .details-date {
          text-align: left;
        }

        .details-status-control {
          align-items: flex-start;

          flex-direction: column;
        }

        .details-status-control select {
          width: 100%;
        }

        .edit-product-buttons {
          grid-template-columns: 1fr;
        }

        .vendor-address {
          max-width: 160px;
        }

      }

      @media (max-width: 450px) {

        .admin-topbar {
          align-items: flex-start;

          gap: 10px;

          flex-direction: column;
        }

        .view-shop {
          width: 100%;

          text-align: center;
        }

        .gold-button,
        .refresh-button {
          width: 100%;
        }

        .status-guide {
          padding: 12px;
        }

        .details-product {
          align-items: flex-start;
        }

        .details-product img,
        .details-product-placeholder {
          width: 45px;
          height: 45px;
        }

        .details-product-info strong {
          font-size: 10px;
        }

        .details-subtotal {
          font-size: 10px;
        }

        .vendor-info {
          gap: 7px;
        }

        .vendor-avatar {
          width: 38px;
          height: 38px;
        }

      }

    `}</style>
  );
}