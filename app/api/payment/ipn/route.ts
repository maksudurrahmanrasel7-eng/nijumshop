import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const tranId = String(formData.get("tran_id") || "");
    const status = String(formData.get("status") || "");

    console.log("SSLCommerz IPN:", {
      tranId,
      status,
    });

    // Transaction ID format:
    // NIJUM-{orderId}-{timestamp}

    const parts = tranId.split("-");

    if (parts.length >= 3) {
      const orderId = Number(parts[1]);

      if (orderId) {
        let paymentStatus = "pending";

        if (status === "VALID") {
          paymentStatus = "paid";
        } else if (
          status === "FAILED"
        ) {
          paymentStatus = "failed";
        } else if (
          status === "CANCELLED"
        ) {
          paymentStatus = "cancelled";
        }

        const { error } = await supabase
          .from("orders")
          .update({
            payment_method: "sslcommerz",
            payment_status: paymentStatus,
            transaction_id: tranId,
          })
          .eq("id", orderId);

        if (error) {
          console.error(
            "IPN ORDER UPDATE ERROR:",
            error
          );

          return NextResponse.json(
            {
              success: false,
              error: error.message,
            },
            { status: 500 }
          );
        }
      }
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(
      "SSLCommerz IPN ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "IPN processing failed",
      },
      { status: 500 }
    );
  }
}