import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // =========================================
    // GET REQUEST DATA
    // =========================================

    const body = await request.json();

    const {
      orderId,
      customerName,
      customerPhone,
      customerAddress,
      totalAmount,
    } = body;

    console.log("=================================");
    console.log("SSLCommerz Payment Request");
    console.log("Order ID:", orderId);
    console.log("Customer:", customerName);
    console.log("Phone:", customerPhone);
    console.log("Amount:", totalAmount);
    console.log("=================================");

    // =========================================
    // VALIDATION
    // =========================================

    if (!orderId) {
      return NextResponse.json(
        {
          success: false,
          message: "Order ID পাওয়া যায়নি।",
        },
        { status: 400 }
      );
    }

    if (!customerName?.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "Customer Name পাওয়া যায়নি।",
        },
        { status: 400 }
      );
    }

    if (!customerPhone?.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "Customer Phone পাওয়া যায়নি।",
        },
        { status: 400 }
      );
    }

    if (!customerAddress?.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "Customer Address পাওয়া যায়নি।",
        },
        { status: 400 }
      );
    }

    if (
      totalAmount === undefined ||
      totalAmount === null ||
      Number(totalAmount) <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Order Amount সঠিক নয়।",
        },
        { status: 400 }
      );
    }

    // =========================================
    // ENVIRONMENT VARIABLES
    // =========================================

    const storeId = process.env.SSL_STORE_ID;
    const storePassword =
      process.env.SSL_STORE_PASSWORD;

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      "http://localhost:3000";

    console.log("SSL STORE ID:", storeId ? "FOUND" : "MISSING");
    console.log(
      "SSL STORE PASSWORD:",
      storePassword ? "FOUND" : "MISSING"
    );
    console.log("SITE URL:", siteUrl);

    // =========================================
    // CHECK SSL CREDENTIALS
    // =========================================

    if (!storeId || !storePassword) {
      console.error(
        "SSLCommerz credentials are missing."
      );

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
    // UNIQUE TRANSACTION ID
    // =========================================

    const tranId =
      `NIJUM_${String(orderId)}_${Date.now()}`;

    console.log(
      "Transaction ID:",
      tranId
    );

    // =========================================
    // SSLCommerz SANDBOX API
    // =========================================

    const sslUrl =
      "https://sandbox.sslcommerz.com/gwprocess/v4/api.php";

    // =========================================
    // PAYMENT DATA
    // =========================================

    const paymentData =
      new URLSearchParams();

    paymentData.append(
      "store_id",
      storeId
    );

    paymentData.append(
      "store_passwd",
      storePassword
    );

    paymentData.append(
      "total_amount",
      Number(totalAmount).toFixed(2)
    );

    paymentData.append(
      "currency",
      "BDT"
    );

    paymentData.append(
      "tran_id",
      tranId
    );

    // =========================================
    // CALLBACK URL
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
    // CUSTOMER INFORMATION
    // =========================================

    paymentData.append(
      "cus_name",
      customerName.trim()
    );

    paymentData.append(
      "cus_email",
      "customer@nijumshop.com"
    );

    paymentData.append(
      "cus_add1",
      customerAddress.trim()
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
      "3800"
    );

    paymentData.append(
      "cus_country",
      "Bangladesh"
    );

    paymentData.append(
      "cus_phone",
      customerPhone.trim()
    );

    paymentData.append(
      "cus_fax",
      ""
    );

    // =========================================
    // SHIPPING INFORMATION
    // =========================================

    paymentData.append(
      "shipping_method",
      "NO"
    );

    paymentData.append(
      "product_name",
      "NIJUM SHOP Products"
    );

    paymentData.append(
      "product_category",
      "Gadgets"
    );

    paymentData.append(
      "product_profile",
      "general"
    );

    // =========================================
    // SEND REQUEST
    // =========================================

    console.log(
      "Sending request to SSLCommerz..."
    );

    const response = await fetch(
      sslUrl,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded",
        },

        body: paymentData.toString(),

        cache: "no-store",
      }
    );

    // =========================================
    // READ RESPONSE AS TEXT
    // =========================================

    const responseText =
      await response.text();

    console.log(
      "SSLCommerz HTTP Status:",
      response.status
    );

    console.log(
      "SSLCommerz Raw Response:",
      responseText
    );

    // =========================================
    // HTTP ERROR
    // =========================================

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          message:
            `SSLCommerz server error: HTTP ${response.status}`,
          rawResponse: responseText,
        },
        { status: 502 }
      );
    }

    // =========================================
    // PARSE JSON
    // =========================================

    let paymentResponse: any;

    try {
      paymentResponse =
        JSON.parse(responseText);
    } catch (jsonError) {
      console.error(
        "SSLCommerz JSON Parse Error:",
        jsonError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "SSLCommerz থেকে JSON response পাওয়া যায়নি।",
          rawResponse: responseText,
        },
        { status: 502 }
      );
    }

    // =========================================
    // LOG RESPONSE
    // =========================================

    console.log(
      "SSLCommerz Parsed Response:",
      paymentResponse
    );

    // =========================================
    // SUCCESS
    // =========================================

    if (
      paymentResponse?.status === "SUCCESS" &&
      paymentResponse?.GatewayPageURL
    ) {
      console.log(
        "================================="
      );

      console.log(
        "SSLCommerz Gateway Created Successfully"
      );

      console.log(
        "Gateway URL:",
        paymentResponse.GatewayPageURL
      );

      console.log(
        "================================="
      );

      return NextResponse.json({
        success: true,

        GatewayPageURL:
          paymentResponse.GatewayPageURL,

        tran_id:
          paymentResponse.tran_id ||
          tranId,

        sessionkey:
          paymentResponse.sessionkey ||
          null,
      });
    }

    // =========================================
    // GATEWAY URL EXISTS
    // EVEN IF STATUS FIELD IS DIFFERENT
    // =========================================

    if (
      paymentResponse?.GatewayPageURL
    ) {
      console.log(
        "Gateway URL found."
      );

      return NextResponse.json({
        success: true,

        GatewayPageURL:
          paymentResponse.GatewayPageURL,

        tran_id:
          paymentResponse.tran_id ||
          tranId,

        sessionkey:
          paymentResponse.sessionkey ||
          null,
      });
    }

    // =========================================
    // SSL PAYMENT ERROR
    // =========================================

    const failedReason =
      paymentResponse?.failedreason ||
      paymentResponse?.message ||
      paymentResponse?.status ||
      "Unknown SSLCommerz error.";

    console.error(
      "================================="
    );

    console.error(
      "SSLCommerz Payment Failed"
    );

    console.error(
      "Reason:",
      failedReason
    );

    console.error(
      "Full Response:",
      paymentResponse
    );

    console.error(
      "================================="
    );

    return NextResponse.json(
      {
        success: false,

        message:
          `SSLCommerz Payment Failed: ${failedReason}`,

        response:
          paymentResponse,
      },
      { status: 400 }
    );
  } catch (error) {
    // =========================================
    // SERVER ERROR
    // =========================================

    console.error(
      "================================="
    );

    console.error(
      "SSL PAYMENT SERVER ERROR"
    );

    console.error(
      error
    );

    console.error(
      "================================="
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