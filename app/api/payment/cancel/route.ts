import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const tranId = String(formData.get("tran_id") || "");

    console.log("SSLCommerz payment cancelled:", {
      tranId,
      status: formData.get("status"),
    });

    // Transaction ID format:
    // NIJUM-{orderId}-{timestamp}

    const parts = tranId.split("-");

    if (parts.length >= 3) {
      const orderId = Number(parts[1]);

      if (orderId) {
        const { error } = await supabase
          .from("orders")
          .update({
            payment_method: "sslcommerz",
            payment_status: "cancelled",
            transaction_id: tranId,
          })
          .eq("id", orderId);

        if (error) {
          console.error(
            "CANCEL PAYMENT ORDER UPDATE ERROR:",
            error
          );
        }
      }
    }

    return NextResponse.redirect(
      new URL(
        "/?payment=cancelled",
        request.url
      )
    );
  } catch (error) {
    console.error(
      "SSLCommerz Cancel Error:",
      error
    );

    return NextResponse.redirect(
      new URL(
        "/?payment=cancelled",
        request.url
      )
    );
  }
}