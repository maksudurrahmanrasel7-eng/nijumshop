import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();

  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase server environment variables missing.");
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

function getSiteUrl(request: Request) {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    new URL(request.url).origin
  );
}

export async function POST(request: Request) {
  const siteUrl = getSiteUrl(request);

  try {
    // SSLCommerz callback sends form data
    const formData = await request.formData();

    const tranId = String(
      formData.get("tran_id") || ""
    ).trim();

    const status = String(
      formData.get("status") || ""
    ).trim();

    console.log("SSLCommerz payment failed:", {
      tranId,
      status,
    });

    if (tranId) {
      const supabaseAdmin = getSupabaseAdmin();

      const { error } = await supabaseAdmin
        .from("orders")
        .update({
          payment_method: "sslcommerz",
          payment_status: "failed",
        })
        .eq("transaction_id", tranId)
        .neq("payment_status", "paid");

      if (error) {
        console.error(
          "FAILED PAYMENT ORDER UPDATE ERROR:",
          error
        );
      }
    }

    // 303 converts SSLCommerz POST callback to browser GET
    return NextResponse.redirect(
      new URL("/?payment=failed", siteUrl),
      303
    );
  } catch (error) {
    console.error(
      "SSLCommerz Fail Error:",
      error
    );

    return NextResponse.redirect(
      new URL("/?payment=failed", siteUrl),
      303
    );
  }
}

// Browser দিয়ে callback URL সরাসরি খুললেও 405 হবে না
export async function GET(request: Request) {
  const siteUrl = getSiteUrl(request);

  return NextResponse.redirect(
    new URL("/?payment=failed", siteUrl),
    303
  );
}