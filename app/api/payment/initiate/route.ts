import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
    // =========================================
    // GET REQUEST BODY
    // =========================================

    const body = await request.json();

    const {
      orderId,
      totalAmount,
      customerName,
      customerPhone,
      customerAddress,
    } = body;

    // =========================================
    // VALIDATION
    // =========================================

    if (
      !orderId ||
      !totalAmount ||
      !customerName ||
      !customerPhone ||
      !customerAddress
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Payment information incomplete.",
        },
        { status: 400 }
      );
    }

    // =========================================
    // AMOUNT VALIDATION
    // =========================================

    const amount = Number(totalAmount);

    if (!Number.isFinite(amount) || amount < 10) {
      return NextResponse.json(
        {
          success: false,
          message: "Payment amount must be at least 10 BDT.",
        },
        { status: 400 }
      );
    }

    // =========================================
    // SUPABASE ENV
    // =========================================

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();

    const serviceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

    if (!supabaseUrl || !serviceRoleKey) {
      console.error(
        "SUPABASE SERVER ENV ERROR:",
        {
          urlExists: !!supabaseUrl,
          serviceRoleExists: !!serviceRoleKey,
        }
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Supabase server configuration পাওয়া যায়নি। .env.local চেক করুন।",
        },
        { status: 500 }
      );
    }

    // =========================================
    // SERVER-SIDE SUPABASE CLIENT
    //
    // Service Role শুধুমাত্র server-side ব্যবহার হবে।
    // =========================================

    const supabaseAdmin = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // =========================================
    // SSL ENVIRONMENT VARIABLES
    // =========================================

    const storeId =
      process.env.SSLCOMMERZ_STORE_ID?.trim();

    const storePassword =
      process.env.SSLCOMMERZ_STORE_PASSWORD?.trim();

    const isLive =
      process.env.SSLCOMMERZ_IS_LIVE?.trim() === "true";

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
      "http://localhost:3000";

    // =========================================
    // DEBUG
    // =========================================

    console.log(
      "========================================="
    );

    console.log(
      "SSLCommerz Payment Initiation"
    );

    console.log(
      "ORDER ID:",
      orderId
    );

    console.log(
      "STORE ID EXISTS:",
      !!storeId
    );

    console.log(
      "STORE PASSWORD EXISTS:",
      !!storePassword
    );

    console.log(
      "SUPABASE SERVICE ROLE EXISTS:",
      !!serviceRoleKey
    );

    console.log(
      "SSL LIVE:",
      isLive
    );

    console.log(
      "SITE URL:",
      siteUrl
    );

    console.log(
      "========================================="
    );

    // =========================================
    // CHECK SSL CREDENTIALS
    // =========================================

    if (!storeId || !storePassword) {
      return NextResponse.json(
        {
          success: false,
          message:
            "SSLCommerz Store ID অথবা Store Password পাওয়া যায়নি। .env.local চেক করুন।",
        },
        { status: 500 }
      );
    }

    // =========================================
    // FIND ORDER
    // =========================================

    const {
      data: existingOrder,
      error: orderFindError,
    } = await supabaseAdmin
      .from("orders")
      .select(
        "id,total_amount,payment_status,payment_method,transaction_id"
      )
      .eq("id", orderId)
      .single();

    if (orderFindError || !existingOrder) {
      console.error(
        "ORDER FIND ERROR:",
        orderFindError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Order পাওয়া যায়নি। Payment শুরু করা সম্ভব নয়।",
        },
        { status: 404 }
      );
    }

    console.log(
      "EXISTING ORDER:",
      existingOrder
    );

    // =========================================
    // CHECK ORDER AMOUNT
    // =========================================

    const orderAmount =
      Number(existingOrder.total_amount);

    if (
      !Number.isFinite(orderAmount) ||
      orderAmount <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Order amount সঠিক নয়।",
        },
        { status: 400 }
      );
    }

    // =========================================
    // PAYMENT AMOUNT MUST MATCH ORDER
    // =========================================

    if (
      Math.abs(orderAmount - amount) > 0.01
    ) {
      console.error(
        "ORDER AMOUNT MISMATCH:",
        {
          orderAmount,
          paymentAmount: amount,
        }
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Order amount এবং payment amount একই নয়।",
        },
        { status: 400 }
      );
    }

    // =========================================
    // PREVENT DUPLICATE PAYMENT
    // =========================================

    if (
      existingOrder.payment_status === "paid"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "এই Order-এর payment ইতিমধ্যে সম্পন্ন হয়েছে।",
        },
        { status: 400 }
      );
    }

    // =========================================
    // TRANSACTION ID
    // =========================================

    const shortOrderId = String(orderId)
      .replace(/[^a-zA-Z0-9]/g, "")
      .slice(-12);

    const transactionId =
      `NIJUM${Date.now()
        .toString()
        .slice(-10)}${shortOrderId}`.slice(0, 30);

    console.log(
      "TRANSACTION ID:",
      transactionId
    );

    // =========================================
    // SAVE TRANSACTION ID
    // =========================================

    const {
      data: updatedOrder,
      error: transactionSaveError,
    } = await supabaseAdmin
      .from("orders")
      .update({
        transaction_id: transactionId,
        payment_method: "sslcommerz",
        payment_status: "pending",
      })
      .eq("id", orderId)
      .select()
      .single();

    if (transactionSaveError) {
      console.error(
        "TRANSACTION ID SAVE ERROR:",
        transactionSaveError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Order-এর transaction ID save করা যায়নি।",
          details:
            transactionSaveError.message,
        },
        { status: 500 }
      );
    }

    console.log(
      "TRANSACTION ID SAVED:",
      updatedOrder
    );

    // =========================================
    // SSLCommerz API URL
    // =========================================

    const sslUrl = isLive
      ? "https://securepay.sslcommerz.com/gwprocess/v4/api.php"
      : "https://sandbox-gw.sslcommerz.com/gwprocess/v4/api.php";

    console.log(
      "SSL API URL:",
      sslUrl
    );

    // =========================================
    // PAYMENT DATA
    // =========================================

    const paymentData =
      new URLSearchParams();

    // =========================================
    // STORE
    // =========================================

    paymentData.append(
      "store_id",
      storeId
    );

    paymentData.append(
      "store_passwd",
      storePassword
    );

    // =========================================
    // ORDER
    // =========================================

    paymentData.append(
      "total_amount",
      amount.toFixed(2)
    );

    paymentData.append(
      "currency",
      "BDT"
    );

    paymentData.append(
      "tran_id",
      transactionId
    );

    // =========================================
    // CALLBACK
    // =========================================

    paymentData.append(
      "success_url",
      `${siteUrl}/api/payment/success`
    );

    paymentData.append(
      "fail_url",
      `${siteUrl}/api/payment/fail`
    );

    paymentData.append(
      "cancel_url",
      `${siteUrl}/api/payment/cancel`
    );

    paymentData.append(
      "ipn_url",
      `${siteUrl}/api/payment/ipn`
    );

    // =========================================
    // CUSTOMER
    // =========================================

    paymentData.append(
      "cus_name",
      String(customerName).trim()
    );

    paymentData.append(
      "cus_email",
      "customer@nijumshop.com"
    );

    paymentData.append(
      "cus_add1",
      String(customerAddress).trim()
    );

    paymentData.append(
      "cus_add2",
      ""
    );

    paymentData.append(
      "cus_city",
      "Noakhali"
    );

    paymentData.append(
      "cus_state",
      "Chattogram"
    );

    paymentData.append(
      "cus_postcode",
      "3700"
    );

    paymentData.append(
      "cus_country",
      "Bangladesh"
    );

    paymentData.append(
      "cus_phone",
      String(customerPhone).trim()
    );

    paymentData.append(
      "cus_fax",
      ""
    );

    // =========================================
    // SHIPPING
    // =========================================

    paymentData.append(
      "shipping_method",
      "Courier"
    );

    paymentData.append(
      "product_name",
      "NIJUM SHOP Products"
    );

    paymentData.append(
      "product_category",
      "Gadgets & Varieties"
    );

    paymentData.append(
      "product_profile",
      "general"
    );

    paymentData.append(
      "ship_name",
      String(customerName).trim()
    );

    paymentData.append(
      "ship_add1",
      String(customerAddress).trim()
    );

    paymentData.append(
      "ship_city",
      "Noakhali"
    );

    paymentData.append(
      "ship_state",
      "Chattogram"
    );

    paymentData.append(
      "ship_postcode",
      "3700"
    );

    paymentData.append(
      "ship_country",
      "Bangladesh"
    );

    // =========================================
    // SEND TO SSLCOMMERZ
    // =========================================

    console.log(
      "Sending payment request to SSLCommerz..."
    );

    const sslResponse =
      await fetch(
        sslUrl,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/x-www-form-urlencoded",
          },

          body:
            paymentData.toString(),

          cache: "no-store",
        }
      );

    // =========================================
    // READ RESPONSE
    // =========================================

    const responseText =
      await sslResponse.text();

    console.log(
      "SSL HTTP STATUS:",
      sslResponse.status
    );

    console.log(
      "SSL RESPONSE:",
      responseText
    );

    // =========================================
    // PARSE JSON
    // =========================================

    let sslData: any;

    try {
      sslData =
        JSON.parse(responseText);
    } catch {
      return NextResponse.json(
        {
          success: false,

          message:
            "SSLCommerz থেকে valid JSON response পাওয়া যায়নি।",

          httpStatus:
            sslResponse.status,

          rawResponse:
            responseText,
        },
        { status: 502 }
      );
    }

    // =========================================
    // SSL SUCCESS
    // =========================================

    if (
      sslData?.status === "SUCCESS" &&
      sslData?.GatewayPageURL
    ) {
      console.log(
        "========================================="
      );

      console.log(
        "SSL PAYMENT CREATED SUCCESSFULLY"
      );

      console.log(
        "Transaction ID:",
        transactionId
      );

      console.log(
        "Gateway URL created."
      );

      console.log(
        "========================================="
      );

      return NextResponse.json({
        success: true,

        paymentUrl:
          sslData.GatewayPageURL,

        GatewayPageURL:
          sslData.GatewayPageURL,

        transactionId,

        tran_id:
          sslData.tran_id ||
          transactionId,

        sessionkey:
          sslData.sessionkey ||
          null,
      });
    }

    // =========================================
    // SSL ERROR
    // =========================================

    console.error(
      "========================================="
    );

    console.error(
      "SSLCommerz PAYMENT ERROR"
    );

    console.error(
      "Status:",
      sslData?.status
    );

    console.error(
      "Failed Reason:",
      sslData?.failedreason
    );

    console.error(
      "Full Response:",
      sslData
    );

    console.error(
      "========================================="
    );

    return NextResponse.json(
      {
        success: false,

        message:
          sslData?.failedreason ||
          sslData?.failedReason ||
          sslData?.message ||
          "SSLCommerz payment শুরু করা যায়নি।",

        status:
          sslData?.status ||
          null,

        failedreason:
          sslData?.failedreason ||
          null,

        response:
          sslData,

        httpStatus:
          sslResponse.status,
      },
      { status: 400 }
    );

  } catch (error) {
    console.error(
      "========================================="
    );

    console.error(
      "PAYMENT INITIATE SERVER ERROR:"
    );

    console.error(
      error
    );

    console.error(
      "========================================="
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "Payment server error হয়েছে।",

        error:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 }
    );
  }
}