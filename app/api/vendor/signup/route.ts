import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      userId,
      name,
      phone,
      shopName,
      shopAddress,
    } = body;

    if (
      !userId ||
      !name ||
      !phone ||
      !shopName ||
      !shopAddress
    ) {
      return NextResponse.json(
        {
          error: "সব Vendor তথ্য প্রয়োজন।",
        },
        { status: 400 }
      );
    }

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const serviceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error(
        "Supabase server configuration missing."
      );

      return NextResponse.json(
        {
          error:
            "Server configuration পাওয়া যায়নি।",
        },
        { status: 500 }
      );
    }

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

    const { error } = await supabaseAdmin
      .from("profiles")
      .upsert(
        {
          id: userId,
          name: name.trim(),
          phone: phone.trim(),
          shop_name: shopName.trim(),
          shop_address: shopAddress.trim(),
          role: "vendor",

          // নতুন Vendor প্রথমে inactive থাকবে।
          // Admin activate করলে active হবে।
          membership_status: "inactive",
        },
        {
          onConflict: "id",
        }
      );

    if (error) {
      console.error(
        "VENDOR PROFILE ERROR:",
        error
      );

      return NextResponse.json(
        {
          error:
            "Vendor profile তৈরি করা যায়নি।",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "Vendor profile successfully created.",
    });

  } catch (error) {
    console.error(
      "VENDOR SIGNUP ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Vendor signup-এর সময় সমস্যা হয়েছে।",
      },
      { status: 500 }
    );
  }
}