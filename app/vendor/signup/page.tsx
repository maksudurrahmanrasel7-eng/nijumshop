"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function VendorSignupPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [shopName, setShopName] = useState("");
  const [phone, setPhone] = useState("");
  const [shopAddress, setShopAddress] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSignup(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (
      !name ||
      !shopName ||
      !phone ||
      !shopAddress ||
      !email ||
      !password ||
      !confirmPassword
    ) {
      setError("সবগুলো তথ্য পূরণ করুন।");
      return;
    }

    if (password.length < 6) {
      setError("Password কমপক্ষে 6 অক্ষরের হতে হবে।");
      return;
    }

    if (password !== confirmPassword) {
      setError("Password এবং Confirm Password মিলছে না।");
      return;
    }

    setLoading(true);

    try {
      /*
       * First create Supabase Auth account.
       * The API route below will create/update the Vendor profile.
       */

      const { data, error: signupError } = await supabase.auth.signUp({
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
        setError(signupError.message);
        setLoading(false);
        return;
      }

      if (!data.user) {
        setError("Vendor account তৈরি করা যায়নি।");
        setLoading(false);
        return;
      }

      /*
       * Create Vendor profile.
       */

      const response = await fetch("/api/vendor/signup", {
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
      });

      const result = await response.json();

      if (!response.ok) {
        await supabase.auth.signOut();

        setError(
          result.error ||
            "Vendor profile তৈরি করা যায়নি।"
        );

        setLoading(false);
        return;
      }

      setSuccess(
        "Vendor Account সফলভাবে তৈরি হয়েছে। এখন Login করুন।"
      );

      await supabase.auth.signOut();

      setTimeout(() => {
        router.replace("/vendor/login");
      }, 1500);

    } catch (err) {
      console.error(err);

      setError(
        "একটি সমস্যা হয়েছে। আবার চেষ্টা করুন।"
      );

      setLoading(false);
    }
  }

  return (
    <main className="vendor-auth-page">
      <div className="vendor-auth-card">

        <div className="vendor-auth-logo">
          <div className="vendor-logo-icon">N</div>

          <div>
            <h1>NIJUM SHOP</h1>
            <p>Vendor Portal</p>
          </div>
        </div>

        <div className="vendor-auth-heading">
          <h2>Vendor Signup</h2>
          <p>আপনার Shop-এর জন্য Vendor Account তৈরি করুন</p>
        </div>

        {error && (
          <div className="vendor-auth-error">
            ❌ {error}
          </div>
        )}

        {success && (
          <div className="vendor-auth-success">
            ✅ {success}
          </div>
        )}

        <form onSubmit={handleSignup}>

          <div className="vendor-input-group">
            <label>Full Name *</label>

            <input
              type="text"
              placeholder="আপনার নাম"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="vendor-input-group">
            <label>Shop Name *</label>

            <input
              type="text"
              placeholder="আপনার Shop-এর নাম"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
            />
          </div>

          <div className="vendor-input-group">
            <label>Phone Number *</label>

            <input
              type="tel"
              placeholder="01XXXXXXXXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
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
              onChange={(e) => setEmail(e.target.value)}
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
                  setShowPassword(!showPassword)
                }
              >
                {showPassword ? "🙈" : "👁️"}
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
                  setConfirmPassword(e.target.value)
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
                {showConfirmPassword ? "🙈" : "👁️"}
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

        <div className="vendor-auth-divider">
          <span>OR</span>
        </div>

        <p className="vendor-signup-text">
          ইতিমধ্যে Vendor Account আছে?
        </p>

        <Link
          href="/vendor/login"
          className="vendor-signup-link"
        >
          🔐 Vendor Login
        </Link>

        <Link
          href="/"
          className="vendor-back-home"
        >
          ← Back to NIJUM SHOP
        </Link>

      </div>

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
              rgba(212, 175, 55, 0.14),
              transparent 45%
            ),
            #080808;
          color: white;
        }

        .vendor-auth-card {
          width: 100%;
          max-width: 470px;
          padding: 30px;
          border: 1px solid rgba(212, 175, 55, 0.35);
          border-radius: 20px;
          background: linear-gradient(
            145deg,
            #111,
            #080808
          );
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.55);
        }

        .vendor-auth-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 25px;
        }

        .vendor-logo-icon {
          width: 50px;
          height: 50px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(
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

        .vendor-auth-heading {
          text-align: center;
          margin-bottom: 20px;
        }

        .vendor-auth-heading h2 {
          margin: 0;
          font-size: 27px;
        }

        .vendor-auth-heading p {
          color: #999;
          font-size: 13px;
        }

        .vendor-auth-error,
        .vendor-auth-success {
          margin-bottom: 17px;
          padding: 11px 13px;
          border-radius: 9px;
          font-size: 13px;
        }

        .vendor-auth-error {
          border: 1px solid #7d2525;
          background: rgba(120, 20, 20, 0.15);
          color: #ff8585;
        }

        .vendor-auth-success {
          border: 1px solid #426c35;
          background: rgba(30, 100, 30, 0.15);
          color: #8ee27c;
        }

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

        .vendor-login-submit {
          width: 100%;
          height: 47px;
          margin-top: 4px;
          border: 0;
          border-radius: 10px;
          background: linear-gradient(
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

        .vendor-auth-divider {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 21px 0;
          color: #666;
          font-size: 11px;
        }

        .vendor-auth-divider::before,
        .vendor-auth-divider::after {
          content: "";
          flex: 1;
          height: 1px;
          background: #292929;
        }

        .vendor-signup-text {
          text-align: center;
          color: #999;
          font-size: 13px;
          margin-bottom: 9px;
        }

        .vendor-signup-link {
          display: block;
          text-align: center;
          padding: 12px;
          border: 1px solid rgba(212, 175, 55, 0.45);
          border-radius: 9px;
          color: #e6bf3e;
          text-decoration: none;
          font-weight: 700;
          font-size: 13px;
        }

        .vendor-back-home {
          display: block;
          margin-top: 17px;
          text-align: center;
          color: #777;
          text-decoration: none;
          font-size: 12px;
        }

        @media (max-width: 480px) {
          .vendor-auth-page {
            padding: 12px;
          }

          .vendor-auth-card {
            padding: 22px 17px;
          }
        }
      `}</style>
    </main>
  );
}