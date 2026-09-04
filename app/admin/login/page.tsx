"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AdminLogin() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");

    const cleanEmail = email.trim();

    if (!cleanEmail || !password) {
      setError("Email এবং Password দিন।");
      return;
    }

    setLoading(true);

    try {
      const { data, error: loginError } =
        await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

      if (loginError) {
        console.error(
          "ADMIN LOGIN ERROR:",
          loginError
        );

        setError(
          "Email অথবা Password সঠিক নয়।"
        );

        return;
      }

      if (!data.user) {
        setError(
          "Login সফল হয়নি। আবার চেষ্টা করুন।"
        );

        return;
      }

      console.log(
        "ADMIN LOGIN SUCCESS:",
        data.user.email
      );

      router.replace("/admin");
      router.refresh();

    } catch (error) {
      console.error(
        "UNEXPECTED LOGIN ERROR:",
        error
      );

      setError(
        "Login করার সময় সমস্যা হয়েছে। আবার চেষ্টা করুন।"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="admin-login-page">

      {/* ================================= */}
      {/* LOGIN CARD */}
      {/* ================================= */}

      <div className="admin-login-card">

        {/* LOGO */}

        <div className="admin-logo">
          N
        </div>

        {/* SHOP NAME */}

        <h1>
          NIJUM SHOP
        </h1>

        <p className="admin-subtitle">
          Admin Panel
        </p>

        {/* LOGIN FORM */}

        <form onSubmit={handleLogin}>

          {/* EMAIL */}

          <label htmlFor="admin-email">
            Email
          </label>

          <input
            id="admin-email"
            type="email"
            placeholder="Admin Email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            autoComplete="email"
            disabled={loading}
            required
          />

          {/* PASSWORD */}

          <label htmlFor="admin-password">
            Password
          </label>

          <input
            id="admin-password"
            type="password"
            placeholder="Admin Password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            autoComplete="current-password"
            disabled={loading}
            required
          />

          {/* ERROR */}

          {error && (
            <div className="login-error">
              ❌ {error}
            </div>
          )}

          {/* LOGIN BUTTON */}

          <button
            type="submit"
            className="admin-login-button"
            disabled={loading}
          >
            {loading
              ? "⏳ Login হচ্ছে..."
              : "🔐 Login"}
          </button>

        </form>

        {/* BACK TO SHOP */}

        <a
          href="/"
          className="back-home"
        >
          ← Back to Shop
        </a>

      </div>

    </main>
  );
}