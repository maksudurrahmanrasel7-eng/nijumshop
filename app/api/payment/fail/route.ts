import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

function getSiteUrl(request: Request) {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    new URL(request.url).origin
  ).replace(/\/$/, "");
}

function browserRedirect(url: string) {
  const safeUrl = JSON.stringify(url);

  return new Response(
    `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta
    http-equiv="refresh"
    content="0;url=${url}"
  >
  <title>Redirecting...</title>
</head>
<body>
  <p>Redirecting...</p>

  <script>
    window.location.replace(${safeUrl});
  </script>
</body>
</html>`,
    {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    }
  );
}

export async function POST(request: Request) {
  const siteUrl = getSiteUrl(request);
  const redirectUrl = `${siteUrl}/?payment=failed`;

  try {
    const formData = await request.formData();

    const tranId = String(
      formData.get("tran_id") || ""
    ).trim();

    const status = String(
      formData.get("status") || ""
    ).trim();

    console.log("SSLCommerz FAIL callback:", {
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

    return browserRedirect(redirectUrl);
  } catch (error) {
    console.error(
      "SSLCommerz Fail Callback Error:",
      error
    );

    return browserRedirect(redirectUrl);
  }
}

export async function GET(request: Request) {
  const siteUrl = getSiteUrl(request);

  return NextResponse.redirect(
    `${siteUrl}/?payment=failed`,
    302
  );
}