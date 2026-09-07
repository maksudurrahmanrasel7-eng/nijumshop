import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// =========================================
// SERVER-SIDE SUPABASE CLIENT
// =========================================

function getSupabaseAdmin() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();

  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Supabase server environment variables missing."
    );
  }

  return createClient(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

// =========================================
// POST CALLBACK
// =========================================

export async function POST(request: Request) {
  return handleSuccess(request);
}

// =========================================
// GET CALLBACK FALLBACK
// =========================================

export async function GET(request: Request) {
  return handleSuccess(request);
}

// =========================================
// SUCCESS HANDLER
// =========================================

async function handleSuccess(request: Request) {
  try {
    // =========================================
    // SERVER-SIDE SUPABASE
    // =========================================

    const supabase = getSupabaseAdmin();

    // =========================================
    // GET SSLCommerz CALLBACK DATA
    // =========================================

    let tranId = "";
    let valId = "";
    let callbackStatus = "";

    // -----------------------------------------
    // POST callback
    // -----------------------------------------

    if (request.method === "POST") {
      const formData =
        await request.formData();

      tranId = String(
        formData.get("tran_id") || ""
      ).trim();

      valId = String(
        formData.get("val_id") || ""
      ).trim();

      callbackStatus = String(
        formData.get("status") || ""
      ).trim();
    }

    // -----------------------------------------
    // GET callback fallback
    // -----------------------------------------

    else {
      const url =
        new URL(request.url);

      tranId = String(
        url.searchParams.get("tran_id") || ""
      ).trim();

      valId = String(
        url.searchParams.get("val_id") || ""
      ).trim();

      callbackStatus = String(
        url.searchParams.get("status") || ""
      ).trim();
    }

    console.log(
      "========================================="
    );

    console.log(
      "SSLCommerz SUCCESS CALLBACK"
    );

    console.log(
      "TRAN ID:",
      tranId
    );

    console.log(
      "VAL ID:",
      valId
    );

    console.log(
      "CALLBACK STATUS:",
      callbackStatus
    );

    console.log(
      "========================================="
    );

    // =========================================
    // BASIC VALIDATION
    // =========================================

    if (!tranId || !valId) {
      console.error(
        "Missing tran_id or val_id"
      );

      return NextResponse.redirect(
        new URL(
          "/?payment=failed",
          request.url
        ),
        303
      );
    }

    // =========================================
    // SSLCommerz ENV
    // =========================================

    const storeId =
      process.env.SSLCOMMERZ_STORE_ID?.trim();

    const storePassword =
      process.env.SSLCOMMERZ_STORE_PASSWORD?.trim();

    const isLive =
      process.env.SSLCOMMERZ_IS_LIVE?.trim() ===
      "true";

    if (!storeId || !storePassword) {
      console.error(
        "SSLCommerz credentials missing."
      );

      return NextResponse.redirect(
        new URL(
          "/?payment=failed",
          request.url
        ),
        303
      );
    }

    // =========================================
    // SSLCommerz VALIDATION API
    // =========================================

    const validationUrl = isLive
      ? "https://securepay.sslcommerz.com/validator/api/validationserverAPI.php"
      : "https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php";

    const validationParams =
      new URLSearchParams();

    validationParams.append(
      "val_id",
      valId
    );

    validationParams.append(
      "store_id",
      storeId
    );

    validationParams.append(
      "store_passwd",
      storePassword
    );

    validationParams.append(
      "format",
      "json"
    );

    console.log(
      "Validating transaction with SSLCommerz..."
    );

    const validationResponse =
      await fetch(
        `${validationUrl}?${validationParams.toString()}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

    const validationText =
      await validationResponse.text();

    console.log(
      "VALIDATION HTTP STATUS:",
      validationResponse.status
    );

    console.log(
      "VALIDATION RESPONSE:",
      validationText
    );

    // =========================================
    // PARSE VALIDATION RESPONSE
    // =========================================

    let validationData: any;

    try {
      validationData =
        JSON.parse(validationText);
    } catch {
      console.error(
        "SSLCommerz validation response is not JSON."
      );

      return NextResponse.redirect(
        new URL(
          "/?payment=failed",
          request.url
        ),
        303
      );
    }

    // =========================================
    // VALIDATION STATUS
    // =========================================

    const validatedStatus =
      String(
        validationData?.status || ""
      ).toUpperCase();

    if (
      validatedStatus !== "VALID" &&
      validatedStatus !== "VALIDATED"
    ) {
      console.error(
        "SSLCommerz transaction validation failed:",
        validationData
      );

      return NextResponse.redirect(
        new URL(
          "/?payment=failed",
          request.url
        ),
        303
      );
    }

    // =========================================
    // VALIDATED TRANSACTION ID
    // =========================================

    const validatedTranId =
      String(
        validationData?.tran_id || ""
      ).trim();

    if (!validatedTranId) {
      console.error(
        "Validation response does not contain tran_id."
      );

      return NextResponse.redirect(
        new URL(
          "/?payment=failed",
          request.url
        ),
        303
      );
    }

    // =========================================
    // TRANSACTION ID MUST MATCH
    // =========================================

    if (validatedTranId !== tranId) {
      console.error(
        "Transaction ID mismatch:",
        {
          callbackTranId:
            tranId,

          validatedTranId,
        }
      );

      return NextResponse.redirect(
        new URL(
          "/?payment=failed",
          request.url
        ),
        303
      );
    }

    // =========================================
    // CURRENCY CHECK
    // =========================================

    const validatedCurrency =
      String(
        validationData?.currency || ""
      ).toUpperCase();

    if (validatedCurrency !== "BDT") {
      console.error(
        "Currency mismatch:",
        validatedCurrency
      );

      return NextResponse.redirect(
        new URL(
          "/?payment=failed",
          request.url
        ),
        303
      );
    }

    // =========================================
    // FIND ORDER USING TRANSACTION ID
    // =========================================

    const {
      data: order,
      error: orderFindError,
    } = await supabase
      .from("orders")
      .select(
        "id, total_amount, payment_status, transaction_id"
      )
      .eq(
        "transaction_id",
        validatedTranId
      )
      .maybeSingle();

    if (orderFindError) {
      console.error(
        "ORDER FIND ERROR:",
        orderFindError
      );

      return NextResponse.redirect(
        new URL(
          "/?payment=failed",
          request.url
        ),
        303
      );
    }

    if (!order) {
      console.error(
        "ORDER NOT FOUND FOR TRANSACTION:",
        validatedTranId
      );

      return NextResponse.redirect(
        new URL(
          "/?payment=failed",
          request.url
        ),
        303
      );
    }

    // =========================================
    // AMOUNT VALIDATION
    // =========================================

    const orderAmount =
      Number(order.total_amount);

    const sslAmount =
      Number(validationData?.amount);

    if (
      !Number.isFinite(orderAmount) ||
      !Number.isFinite(sslAmount)
    ) {
      console.error(
        "Invalid payment amount."
      );

      return NextResponse.redirect(
        new URL(
          "/?payment=failed",
          request.url
        ),
        303
      );
    }

    // Compare with 2 decimal precision

    const orderAmountFixed =
      orderAmount.toFixed(2);

    const sslAmountFixed =
      sslAmount.toFixed(2);

    if (
      orderAmountFixed !==
      sslAmountFixed
    ) {
      console.error(
        "PAYMENT AMOUNT MISMATCH:",
        {
          orderAmount:
            orderAmountFixed,

          sslAmount:
            sslAmountFixed,
        }
      );

      return NextResponse.redirect(
        new URL(
          "/?payment=failed",
          request.url
        ),
        303
      );
    }

    // =========================================
    // ALREADY PAID
    // =========================================

    if (
      order.payment_status === "paid"
    ) {
      console.log(
        "Order already marked as paid."
      );

      return NextResponse.redirect(
        new URL(
          `/?payment=success&order_id=${order.id}`,
          request.url
        ),
        303
      );
    }

    // =========================================
    // UPDATE ORDER
    // =========================================

    const {
      error: updateError,
    } = await supabase
      .from("orders")
      .update({
        payment_method:
          "sslcommerz",

        payment_status:
          "paid",

        transaction_id:
          validatedTranId,

        validation_id:
          valId,

        status:
          "confirmed",
      })
      .eq(
        "id",
        order.id
      );

    if (updateError) {
      console.error(
        "ORDER PAYMENT UPDATE ERROR:",
        updateError
      );

      return NextResponse.redirect(
        new URL(
          "/?payment=failed",
          request.url
        ),
        303
      );
    }

    // =========================================
    // SUCCESS LOG
    // =========================================

    console.log(
      "========================================="
    );

    console.log(
      "SSLCommerz PAYMENT VERIFIED SUCCESSFULLY"
    );

    console.log(
      "ORDER ID:",
      order.id
    );

    console.log(
      "TRANSACTION ID:",
      validatedTranId
    );

    console.log(
      "VALIDATION ID:",
      valId
    );

    console.log(
      "AMOUNT:",
      sslAmountFixed
    );

    console.log(
      "STATUS:",
      validatedStatus
    );

    console.log(
      "========================================="
    );

    // =========================================
    // REDIRECT CUSTOMER
    //
    // 303 is important here:
    // SSLCommerz POST -> browser GET
    // =========================================

    return NextResponse.redirect(
      new URL(
        `/?payment=success&order_id=${order.id}`,
        request.url
      ),
      303
    );

  } catch (error) {
    console.error(
      "SSLCommerz SUCCESS ERROR:",
      error
    );

    return NextResponse.redirect(
      new URL(
        "/?payment=failed",
        request.url
      ),
      303
    );
  }
}