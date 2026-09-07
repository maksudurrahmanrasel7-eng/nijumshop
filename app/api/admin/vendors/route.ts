import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();

  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Supabase server configuration missing."
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

// ==========================================
// VERIFY ADMIN
// ==========================================

async function verifyAdmin(
  request: Request
) {
  const authorization =
    request.headers.get(
      "authorization"
    );

  if (
    !authorization ||
    !authorization.startsWith(
      "Bearer "
    )
  ) {
    return null;
  }

  const token =
    authorization
      .slice(7)
      .trim();

  if (!token) {
    return null;
  }

  const supabaseAdmin =
    getSupabaseAdmin();

  const {
    data: { user },
    error,
  } =
    await supabaseAdmin.auth.getUser(
      token
    );

  if (error || !user) {
    return null;
  }

  const adminEmail =
    process.env.ADMIN_EMAIL
      ?.trim()
      .toLowerCase();

  if (
    !adminEmail ||
    !user.email ||
    user.email
      .toLowerCase() !==
      adminEmail
  ) {
    return null;
  }

  return supabaseAdmin;
}

// ==========================================
// LOAD ALL VENDORS
// ==========================================

export async function GET(
  request: Request
) {
  try {
    const supabaseAdmin =
      await verifyAdmin(request);

    if (!supabaseAdmin) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Unauthorized admin.",
        },
        {
          status: 401,
        }
      );
    }

    const {
      data: vendors,
      error,
    } =
      await supabaseAdmin
        .from("profiles")
        .select(
          "id, name, phone, shop_name, shop_address, role, membership_status, created_at"
        )
        .eq(
          "role",
          "vendor"
        )
        .order(
          "created_at",
          {
            ascending:
              false,
          }
        );

    if (error) {
      console.error(
        "ADMIN VENDOR LOAD ERROR:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          error:
            error.message,
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      success: true,

      vendors:
        vendors || [],
    });

  } catch (error) {
    console.error(
      "ADMIN VENDOR GET ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "Vendor list load failed.",
      },
      {
        status: 500,
      }
    );
  }
}

// ==========================================
// ACTIVATE / DEACTIVATE VENDOR
// ==========================================

export async function PATCH(
  request: Request
) {
  try {
    const supabaseAdmin =
      await verifyAdmin(request);

    if (!supabaseAdmin) {
      return NextResponse.json(
        {
          success: false,

          error:
            "Unauthorized admin.",
        },
        {
          status: 401,
        }
      );
    }

    const body =
      await request.json();

    const vendorId =
      String(
        body.vendorId || ""
      ).trim();

    const membershipStatus =
      String(
        body.membershipStatus ||
          ""
      )
        .trim()
        .toLowerCase();

    if (
      !vendorId ||
      ![
        "active",
        "inactive",
      ].includes(
        membershipStatus
      )
    ) {
      return NextResponse.json(
        {
          success: false,

          error:
            "Invalid Vendor information.",
        },
        {
          status: 400,
        }
      );
    }

    const {
      data: vendor,
      error,
    } =
      await supabaseAdmin
        .from("profiles")
        .update({
          membership_status:
            membershipStatus,
        })
        .eq(
          "id",
          vendorId
        )
        .eq(
          "role",
          "vendor"
        )
        .select(
          "id, name, phone, shop_name, shop_address, role, membership_status, created_at"
        )
        .maybeSingle();

    if (error) {
      console.error(
        "ADMIN VENDOR UPDATE ERROR:",
        error
      );

      return NextResponse.json(
        {
          success: false,

          error:
            error.message,
        },
        {
          status: 500,
        }
      );
    }

    if (!vendor) {
      return NextResponse.json(
        {
          success: false,

          error:
            "Vendor পাওয়া যায়নি।",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json({
      success: true,

      vendor,
    });

  } catch (error) {
    console.error(
      "ADMIN VENDOR PATCH ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "Vendor Status Update failed.",
      },
      {
        status: 500,
      }
    );
  }
}