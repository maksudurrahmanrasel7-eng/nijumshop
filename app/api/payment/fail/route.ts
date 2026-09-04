import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const tranId = String(formData.get("tran_id") || "");

    console.log("SSLCommerz payment failed:", {
      tranId,
      status: formData.get("status"),
    });

    // Transaction ID থেকে Order ID বের করা
    // Format: NIJUM-{orderId}-{timestamp}
    const parts = tranId.split("-");

    if (parts.length >= 3) {
      const orderId = Number(parts[1]);

      if (orderId) {
        const { error } = await supabase
          .from("orders")
          .update({
            payment_method: "sslcommerz",
            payment_status: "failed",
            transaction_id: tranId,
          })
          .eq("id", orderId);

        if (error) {
          console.error(
            "FAILED PAYMENT ORDER UPDATE ERROR:",
            error
          );
        }
      }
    }

    return NextResponse.redirect(
      new URL(
        "/?payment=failed",
        request.url
      )
    );
  } catch (error) {
    console.error(
      "SSLCommerz Fail Error:",
      error
    );

    return NextResponse.redirect(
      new URL(
        "/?payment=failed",
        request.url
      )
    );
  }
}