"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type CustomerAuthProps = {
  open: boolean;
  onClose: () => void;
};

export default function CustomerAuth({
  open,
  onClose,
}: CustomerAuthProps) {
  const [mode, setMode] = useState<"login" | "signup">("login");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (open) {
      setMessage("");
    }
  }, [open]);

  if (!open) return null;

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      setMessage("দয়া করে Email এবং Password দিন।");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const { error } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (error) {
        setMessage(error.message);
        return;
      }

      setMessage("✅ Login সফল হয়েছে!");

      setTimeout(() => {
        onClose();
        window.location.reload();
      }, 800);
    } catch (error) {
      console.error("LOGIN ERROR:", error);

      setMessage(
        "Login করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।"
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleSignup() {
    if (
      !name.trim() ||
      !phone.trim() ||
      !email.trim() ||
      !password.trim()
    ) {
      setMessage(
        "দয়া করে সব তথ্য পূরণ করুন।"
      );
      return;
    }

    if (password.length < 6) {
      setMessage(
        "Password কমপক্ষে ৬ অক্ষরের হতে হবে।"
      );
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const { data, error } =
        await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: name.trim(),
              phone: phone.trim(),
            },
          },
        });

      if (error) {
        setMessage(error.message);
        return;
      }

      if (data.user) {
        setMessage(
          "✅ Account তৈরি হয়েছে!"
        );

        setTimeout(() => {
          onClose();
          window.location.reload();
        }, 1000);
      }
    } catch (error) {
      console.error("SIGNUP ERROR:", error);

      setMessage(
        "Account তৈরি করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।"
      );
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (mode === "login") {
      handleLogin();
    } else {
      handleSignup();
    }
  }

  return (
    <div
      className="customer-auth-overlay"
      onClick={onClose}
    >
      <div
        className="customer-auth-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* CLOSE */}
        <button
          type="button"
          className="customer-auth-close"
          onClick={onClose}
        >
          ×
        </button>

        {/* LOGO */}
        <div className="customer-auth-logo">
          N
        </div>

        <h2>
          {mode === "login"
            ? "Welcome Back!"
            : "Create Account"}
        </h2>

        <p className="customer-auth-subtitle">
          {mode === "login"
            ? "Login to your NIJUM SHOP account"
            : "Join NIJUM SHOP today"}
        </p>

        {/* TABS */}
        <div className="customer-auth-tabs">
          <button
            type="button"
            className={
              mode === "login"
                ? "active"
                : ""
            }
            onClick={() => {
              setMode("login");
              setMessage("");
            }}
          >
            🔐 Login
          </button>

          <button
            type="button"
            className={
              mode === "signup"
                ? "active"
                : ""
            }
            onClick={() => {
              setMode("signup");
              setMessage("");
            }}
          >
            📝 Signup
          </button>
        </div>

        {/* FORM */}
        <form
          onSubmit={handleSubmit}
          className="customer-auth-form"
        >
          {mode === "signup" && (
            <>
              <div className="auth-input-group">
                <label>
                  👤 Full Name
                </label>

                <input
                  type="text"
                  placeholder="আপনার নাম"
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value)
                  }
                  disabled={loading}
                />
              </div>

              <div className="auth-input-group">
                <label>
                  📱 Mobile Number
                </label>

                <input
                  type="tel"
                  placeholder="01XXXXXXXXX"
                  value={phone}
                  onChange={(e) =>
                    setPhone(e.target.value)
                  }
                  disabled={loading}
                />
              </div>
            </>
          )}

          <div className="auth-input-group">
            <label>
              📧 Email Address
            </label>

            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              disabled={loading}
            />
          </div>

          <div className="auth-input-group">
            <label>
              🔒 Password
            </label>

            <input
              type="password"
              placeholder="কমপক্ষে ৬ অক্ষর"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              disabled={loading}
            />
          </div>

          {/* MESSAGE */}
          {message && (
            <div className="customer-auth-message">
              {message}
            </div>
          )}

          {/* BUTTON */}
          <button
            type="submit"
            className="customer-auth-submit"
            disabled={loading}
          >
            {loading ? (
              <span className="auth-loading">
                <span className="auth-spinner"></span>
                Processing...
              </span>
            ) : mode === "login" ? (
              "🔐 Login"
            ) : (
              "✨ Create Account"
            )}
          </button>
        </form>

        {/* FOOTER */}
        <div className="customer-auth-footer">
          {mode === "login" ? (
            <>
              নতুন Customer?
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setMessage("");
                }}
              >
                Create Account               
              </button>
            </>
          ) : (
            <>
              Already have an account?
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setMessage("");
                }}
              >
                Login
              </button>
            </>
          )}
        </div>

        <div className="customer-auth-secure">
          🔐 Secure authentication by NIJUM SHOP
        </div>
      </div>
    </div>
  );
}