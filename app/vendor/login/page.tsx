"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Mode = "login" | "signup";

export default function VendorLoginPage() {
  const router = useRouter();

  const [mode, setMode] = useState<Mode>("login");

  // Login
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Signup
  const [name, setName] = useState("");
  const [shopName, setShopName] = useState("");
  const [phone, setPhone] = useState("");
  const [shopAddress, setShopAddress] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function changeMode(newMode: Mode) {
    setMode(newMode);
    setError("");
    setSuccess("");
  }

  // =========================
  // VENDOR LOGIN
  // =========================

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!email.trim() || !password) {
      setError("Email এবং Password দিন.");
      return;
    }

    setLoading(true);

    try {
      const { data, error: loginError } =
        await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });

      if (loginError) {
        setError("Email অথবা Password সঠিক নয়.");
        setLoading(false);
        return;
      }

      if (!data.user) {
        setError("Login করা যায়নি। আবার চেষ্টা করুন.");
        setLoading(false);
        return;
      }

      // Check Vendor Profile
      const { data: profile, error: profileError } =
        await supabase
          .from("profiles")
          .select("role, membership_status")
          .eq("id", data.user.id)
          .maybeSingle();

      if (profileError) {
        console.error(profileError);

        await supabase.auth.signOut();

        setError("Vendor profile পাওয়া যায়নি.");
        setLoading(false);
        return;
      }

      if (!profile || profile.role !== "vendor") {
        await supabase.auth.signOut();

        setError("এই account টি Vendor account নয়.");
        setLoading(false);
        return;
      }

      // =========================================
      // INACTIVE VENDOR CHECK
      // =========================================

      if (profile.membership_status !== "active") {
        await supabase.auth.signOut();

        setError(
          "আপনার ভেন্ডর একাউন্টটি এক্টিভ নয়, দয়া করে এডমিনের সাথে যোগাযোগ করুন।"
        );

        setLoading(false);
        return;
      }

      // =========================================
      // VENDOR ACTIVE
      // =========================================

      router.replace("/vendor");
      router.refresh();

    } catch (err) {
      console.error(err);

      setError(
        "একটি সমস্যা হয়েছে। আবার চেষ্টা করুন."
      );

      setLoading(false);
    }
  }

  // =========================
  // VENDOR SIGNUP
  // =========================

  async function handleSignup(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (
      !name.trim() ||
      !shopName.trim() ||
      !phone.trim() ||
      !shopAddress.trim() ||
      !email.trim() ||
      !password ||
      !confirmPassword
    ) {
      setError("সবগুলো তথ্য পূরণ করুন.");
      return;
    }

    if (password.length < 6) {
      setError(
        "Password কমপক্ষে 6 অক্ষরের হতে হবে."
      );
      return;
    }

    if (password !== confirmPassword) {
      setError(
        "Password এবং Confirm Password মিলছে না."
      );
      return;
    }

    setLoading(true);

    try {
      // Create Supabase Auth User
      const { data, error: signupError } =
        await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
          options: {
            data: {
              full_name: name.trim(),
              name: name.trim(),
              phone: phone.trim(),
              shop_name: shopName.trim(),
              shop_address: shopAddress.trim(),
              account_type: "vendor",
            },
          },
        });

      if (signupError) {
        console.error(signupError);

        setError(signupError.message);
        setLoading(false);
        return;
      }

      if (!data.user) {
        setError(
          "Vendor account তৈরি করা যায়নি."
        );
        setLoading(false);
        return;
      }

      // Create Vendor Profile
      const response = await fetch(
        "/api/vendor/signup",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: data.user.id,
            name: name.trim(),
            phone: phone.trim(),
            shopName: shopName.trim(),
            shopAddress: shopAddress.trim(),
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        console.error(result);

        await supabase.auth.signOut();

        setError(
          result.error ||
            "Vendor profile তৈরি করা যায়নি."
        );

        setLoading(false);
        return;
      }

      // Sign out after creating account
      await supabase.auth.signOut();

      // Clear signup fields
      setName("");
      setShopName("");
      setPhone("");
      setShopAddress("");
      setPassword("");
      setConfirmPassword("");

      setSuccess(
        "🎉 Vendor Account সফলভাবে তৈরি হয়েছে! Admin account Active করার পর Login করতে পারবেন।"
      );

      setMode("login");

      setLoading(false);

    } catch (err) {
      console.error(err);

      setError(
        "Vendor Signup-এর সময় সমস্যা হয়েছে."
      );

      setLoading(false);
    }
  }

  return (
    <main className="vendor-auth-page">

      <div className="vendor-auth-card">

        {/* =========================
            LOGO
        ========================= */}

        <div className="vendor-auth-logo">

          <div className="vendor-logo-icon">
            N
          </div>

          <div>
            <h1>NIJUM SHOP</h1>
            <p>Vendor Portal</p>
          </div>

        </div>

        {/* =========================
            TITLE
        ========================= */}

        <div className="vendor-auth-heading">

          <h2>
            {mode === "login"
              ? "Vendor Login"
              : "Vendor Signup"}
          </h2>

          <p>
            {mode === "login"
              ? "আপনার Vendor Account-এ Login করুন"
              : "আপনার Shop-এর জন্য Vendor Account তৈরি করুন"}
          </p>

        </div>

        {/* =========================
            LOGIN / SIGNUP TABS
        ========================= */}

        <div className="vendor-tabs">

          <button
            type="button"
            className={
              mode === "login"
                ? "vendor-tab active"
                : "vendor-tab"
            }
            onClick={() => changeMode("login")}
          >
            🔐 Login
          </button>

          <button
            type="button"
            className={
              mode === "signup"
                ? "vendor-tab active"
                : "vendor-tab"
            }
            onClick={() => changeMode("signup")}
          >
            🏪 Sign Up
          </button>

        </div>

        {/* =========================
            ERROR
        ========================= */}

        {error && (
          <div className="vendor-auth-error">
            ❌ {error}
          </div>
        )}

        {/* =========================
            SUCCESS
        ========================= */}

        {success && (
          <div className="vendor-auth-success">
            {success}
          </div>
        )}

        {/* =================================================
            LOGIN FORM
        ================================================= */}

        {mode === "login" && (

          <form onSubmit={handleLogin}>

            <div className="vendor-input-group">

              <label>Email Address</label>

              <input
                type="email"
                placeholder="vendor@example.com"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                autoComplete="email"
              />

            </div>

            <div className="vendor-input-group">

              <label>Password</label>

              <div className="vendor-password-box">

                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  placeholder="Your password"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  autoComplete="current-password"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                >
                  {showPassword
                    ? "🙈"
                    : "👁️"}
                </button>

              </div>

            </div>

            <button
              type="submit"
              className="vendor-login-submit"
              disabled={loading}
            >
              {loading
                ? "Logging in..."
                : "🔐 Login as Vendor"}
            </button>

          </form>

        )}

        {/* =================================================
            SIGNUP FORM
        ================================================= */}

        {mode === "signup" && (

          <form onSubmit={handleSignup}>

            <div className="vendor-input-group">

              <label>Full Name *</label>

              <input
                type="text"
                placeholder="আপনার নাম"
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
                autoComplete="name"
              />

            </div>

            <div className="vendor-input-group">

              <label>Shop Name *</label>

              <input
                type="text"
                placeholder="আপনার Shop-এর নাম"
                value={shopName}
                onChange={(e) =>
                  setShopName(e.target.value)
                }
              />

            </div>

            <div className="vendor-input-group">

              <label>Phone Number *</label>

              <input
                type="tel"
                placeholder="01XXXXXXXXX"
                value={phone}
                onChange={(e) =>
                  setPhone(e.target.value)
                }
                autoComplete="tel"
              />

            </div>

            <div className="vendor-input-group">

              <label>Shop Address *</label>

              <textarea
                placeholder="আপনার Shop-এর ঠিকানা"
                value={shopAddress}
                onChange={(e) =>
                  setShopAddress(e.target.value)
                }
              />

            </div>

            <div className="vendor-input-group">

              <label>Email Address *</label>

              <input
                type="email"
                placeholder="vendor@example.com"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                autoComplete="email"
              />

            </div>

            <div className="vendor-input-group">

              <label>Password *</label>

              <div className="vendor-password-box">

                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  placeholder="কমপক্ষে 6 অক্ষর"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  autoComplete="new-password"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      !showPassword
                    )
                  }
                >
                  {showPassword
                    ? "🙈"
                    : "👁️"}
                </button>

              </div>

            </div>

            <div className="vendor-input-group">

              <label>Confirm Password *</label>

              <div className="vendor-password-box">

                <input
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  placeholder="Password আবার দিন"
                  value={confirmPassword}
                  onChange={(e) =>
                    setConfirmPassword(
                      e.target.value
                    )
                  }
                  autoComplete="new-password"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(
                      !showConfirmPassword
                    )
                  }
                >
                  {showConfirmPassword
                    ? "🙈"
                    : "👁️"}
                </button>

              </div>

            </div>

            <button
              type="submit"
              className="vendor-login-submit"
              disabled={loading}
            >
              {loading
                ? "Creating Account..."
                : "🏪 Create Vendor Account"}
            </button>

          </form>

        )}

        {/* =========================
            SWITCH MODE
        ========================= */}

        <div className="vendor-auth-switch">

          {mode === "login" ? (
            <>
              <p>
                আপনার Vendor Account নেই?
              </p>

              <button
                type="button"
                onClick={() =>
                  changeMode("signup")
                }
              >
                🏪 Create Vendor Account
              </button>
            </>
          ) : (
            <>
              <p>
                ইতিমধ্যে Vendor Account আছে?
              </p>

              <button
                type="button"
                onClick={() =>
                  changeMode("login")
                }
              >
                🔐 Vendor Login
              </button>
            </>
          )}

        </div>

        {/* =========================
            BACK HOME
        ========================= */}

        <Link
          href="/"
          className="vendor-back-home"
        >
          ← Back to NIJUM SHOP
        </Link>

      </div>

      {/* =================================================
          CSS
      ================================================= */}

      <style jsx>{`

        .vendor-auth-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          background:
            radial-gradient(
              circle at top,
              rgba(212, 175, 55, 0.15),
              transparent 45%
            ),
            #080808;
          color: white;
        }

        .vendor-auth-card {
          width: 100%;
          max-width: 470px;
          padding: 30px;
          border: 1px solid
            rgba(212, 175, 55, 0.35);
          border-radius: 20px;
          background:
            linear-gradient(
              145deg,
              #111,
              #080808
            );
          box-shadow:
            0 20px 60px
            rgba(0, 0, 0, 0.55);
        }

        /* LOGO */

        .vendor-auth-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 24px;
        }

        .vendor-logo-icon {
          width: 50px;
          height: 50px;
          border-radius: 14px;

          display: flex;
          align-items: center;
          justify-content: center;

          background:
            linear-gradient(
              135deg,
              #ffe98a,
              #c89b18
            );

          color: #111;
          font-size: 25px;
          font-weight: 900;
        }

        .vendor-auth-logo h1 {
          margin: 0;
          color: #e7bd3c;
          font-size: 20px;
        }

        .vendor-auth-logo p {
          margin: 3px 0 0;
          color: #999;
          font-size: 12px;
        }

        /* HEADING */

        .vendor-auth-heading {
          text-align: center;
          margin-bottom: 20px;
        }

        .vendor-auth-heading h2 {
          margin: 0;
          font-size: 27px;
        }

        .vendor-auth-heading p {
          margin-top: 7px;
          color: #999;
          font-size: 13px;
        }

        /* TABS */

        .vendor-tabs {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 6px;
          padding: 5px;
          margin-bottom: 20px;

          background: #0b0b0b;
          border: 1px solid #292929;
          border-radius: 11px;
        }

        .vendor-tab {
          height: 40px;
          border: 0;
          border-radius: 8px;

          background: transparent;
          color: #888;

          font-size: 13px;
          font-weight: 700;

          cursor: pointer;
        }

        .vendor-tab.active {
          background:
            linear-gradient(
              135deg,
              #ffe27a,
              #c79b18
            );

          color: #111;
        }

        /* MESSAGE */

        .vendor-auth-error,
        .vendor-auth-success {
          margin-bottom: 17px;
          padding: 11px 13px;
          border-radius: 9px;
          font-size: 13px;
        }

        .vendor-auth-error {
          border: 1px solid #7d2525;
          background:
            rgba(120, 20, 20, 0.15);
          color: #ff8585;
        }

        .vendor-auth-success {
          border: 1px solid #426c35;
          background:
            rgba(30, 100, 30, 0.15);
          color: #8ee27c;
        }

        /* INPUT */

        .vendor-input-group {
          margin-bottom: 15px;
        }

        .vendor-input-group label {
          display: block;
          margin-bottom: 7px;
          color: #ddd;
          font-size: 13px;
        }

        .vendor-input-group input,
        .vendor-input-group textarea {
          width: 100%;
          box-sizing: border-box;

          border: 1px solid #333;
          border-radius: 9px;

          outline: none;

          background: #0c0c0c;
          color: white;

          font-family: inherit;
        }

        .vendor-input-group input {
          height: 44px;
          padding: 0 13px;
        }

        .vendor-input-group textarea {
          min-height: 75px;
          padding: 11px 13px;
          resize: vertical;
        }

        .vendor-input-group input:focus,
        .vendor-input-group textarea:focus {
          border-color: #d8b43a;
        }

        /* PASSWORD */

        .vendor-password-box {
          position: relative;
        }

        .vendor-password-box input {
          padding-right: 45px;
        }

        .vendor-password-box button {
          position: absolute;
          right: 5px;
          top: 4px;

          width: 35px;
          height: 35px;

          border: 0;
          background: transparent;
          color: white;

          cursor: pointer;
        }

        /* SUBMIT */

        .vendor-login-submit {
          width: 100%;
          height: 47px;

          margin-top: 4px;

          border: 0;
          border-radius: 10px;

          background:
            linear-gradient(
              135deg,
              #ffe27a,
              #c79b18
            );

          color: #111;

          font-size: 14px;
          font-weight: 800;

          cursor: pointer;
        }

        .vendor-login-submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* SWITCH */

        .vendor-auth-switch {
          text-align: center;
          margin-top: 22px;
          padding-top: 20px;

          border-top: 1px solid #292929;
        }

        .vendor-auth-switch p {
          margin: 0 0 9px;
          color: #999;
          font-size: 13px;
        }

        .vendor-auth-switch button {
          border: 0;
          background: transparent;

          color: #e6bf3e;

          font-size: 13px;
          font-weight: 700;

          cursor: pointer;
        }

        .vendor-auth-switch button:hover {
          text-decoration: underline;
        }

        /* BACK HOME */

        .vendor-back-home {
          display: block;

          margin-top: 18px;

          text-align: center;

          color: #777;

          text-decoration: none;

          font-size: 12px;
        }

        .vendor-back-home:hover {
          color: #e6bf3e;
        }

        /* MOBILE */

        @media (max-width: 480px) {

          .vendor-auth-page {
            padding: 12px;
            align-items: flex-start;
            padding-top: 25px;
          }

          .vendor-auth-card {
            padding: 22px 17px;
            border-radius: 17px;
          }

          .vendor-auth-heading h2 {
            font-size: 24px;
          }

          .vendor-auth-heading p {
            font-size: 12px;
          }

        }

      `}</style>

    </main>
  );
}