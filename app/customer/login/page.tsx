"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function CustomerLoginPage() {
  const router = useRouter();

  const [isSignup, setIsSignup] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [message, setMessage] = useState("");

  // =========================================
  // EMAIL LOGIN / SIGNUP
  // =========================================

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (loading || googleLoading) return;

    setMessage("");

    // =========================================
    // VALIDATION
    // =========================================

    if (isSignup) {
      if (
        !name.trim() ||
        !email.trim() ||
        !phone.trim() ||
        !password.trim()
      ) {
        setMessage("দয়া করে সব তথ্য পূরণ করুন।");
        return;
      }

      if (password.length < 6) {
        setMessage("Password কমপক্ষে ৬ অক্ষরের হতে হবে।");
        return;
      }
    } else {
      if (!email.trim() || !password.trim()) {
        setMessage("Email এবং Password দিন।");
        return;
      }
    }

    try {
      setLoading(true);

      // =========================================
      // SIGN UP
      // =========================================

      if (isSignup) {
        const { data, error } = await supabase.auth.signUp({
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
          console.error("SIGNUP ERROR:", error);
          setMessage(error.message);
          return;
        }

        console.log("SIGNUP SUCCESS:", data);

        // Email confirmation enabled
        if (data.user && !data.session) {
          setMessage(
            "✅ Account তৈরি হয়েছে। আপনার Email-এ confirmation link পাঠানো হয়েছে। Email verify করে Login করুন।"
          );

          setIsSignup(false);
          setPassword("");

          return;
        }

        // Email confirmation disabled
        setMessage("✅ Account সফলভাবে তৈরি হয়েছে!");

        setTimeout(() => {
          router.push("/");
          router.refresh();
        }, 1000);

        return;
      }

      // =========================================
      // LOGIN
      // =========================================

      const { data, error } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (error) {
        console.error("LOGIN ERROR:", error);

        setMessage(
          "❌ Email অথবা Password সঠিক নয়।"
        );

        return;
      }

      console.log("LOGIN SUCCESS:", data);

      setMessage("✅ Login সফল হয়েছে!");

      setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 700);
    } catch (error) {
      console.error("AUTH ERROR:", error);

      setMessage(
        "একটি সমস্যা হয়েছে। আবার চেষ্টা করুন।"
      );
    } finally {
      setLoading(false);
    }
  }

  // =========================================
  // GOOGLE LOGIN / SIGNUP
  // =========================================

  async function handleGoogleLogin() {
    if (loading || googleLoading) return;

    try {
      setMessage("");
      setGoogleLoading(true);

      const { error } =
        await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: `${window.location.origin}/auth/callback`,
          },
        });

      if (error) {
        console.error(
          "GOOGLE LOGIN ERROR:",
          error
        );

        setMessage(
          "❌ Google Login করা যায়নি। আবার চেষ্টা করুন।"
        );

        setGoogleLoading(false);
      }
    } catch (error) {
      console.error(
        "GOOGLE AUTH ERROR:",
        error
      );

      setMessage(
        "Google Login-এর সময় একটি সমস্যা হয়েছে।"
      );

      setGoogleLoading(false);
    }
  }

  // =========================================
  // SWITCH LOGIN / SIGNUP
  // =========================================

  function switchMode() {
    setIsSignup(!isSignup);
    setMessage("");
    setPassword("");
  }

  // =========================================
  // RENDER
  // =========================================

  return (
    <main className="auth-page">

      {/* =========================================
          ANIMATED BACKGROUND
      ========================================= */}

      <div className="auth-background">

        <div className="gold-orb orb-one"></div>

        <div className="gold-orb orb-two"></div>

        <div className="gold-orb orb-three"></div>

        <div className="gold-ring ring-one"></div>

        <div className="gold-ring ring-two"></div>

        <div className="particles">
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
        </div>

      </div>

      {/* =========================================
          BACK HOME
      ========================================= */}

      <button
        type="button"
        className="back-home"
        onClick={() => router.push("/")}
      >
        ← Back to NIJUM SHOP
      </button>

      {/* =========================================
          AUTH CONTAINER
      ========================================= */}

      <div
        className={`auth-container ${
          isSignup
            ? "signup-mode"
            : "login-mode"
        }`}
      >

        {/* =========================================
            LEFT BRAND PANEL
        ========================================= */}

        <div className="auth-brand">

          <div className="brand-glow"></div>

          <div className="brand-logo">
            N
          </div>

          <div className="brand-name">
            NIJUM SHOP
          </div>

          <div className="brand-tagline">
            Gadgets & Varieties
          </div>

          <div className="brand-divider"></div>

          <h2>
            {isSignup
              ? "Join Our Family"
              : "Welcome Back!"}
          </h2>

          <p>
            {isSignup
              ? "Create your customer account and enjoy easy shopping."
              : "Login to your account and continue shopping."}
          </p>

          <div className="brand-features">

            <div>
              <span>✓</span>
              Quality Products
            </div>

            <div>
              <span>✓</span>
              Best Price
            </div>

            <div>
              <span>✓</span>
              Fast Delivery
            </div>

          </div>

        </div>

        {/* =========================================
            FORM PANEL
        ========================================= */}

        <div className="auth-form-wrapper">

          <div className="auth-form">

            {/* HEADER */}

            <div className="form-header">

              <div className="form-icon">
                {isSignup ? "✨" : "👋"}
              </div>

              <h1>
                {isSignup
                  ? "Create Account"
                  : "Customer Login"}
              </h1>

              <p>
                {isSignup
                  ? "Create your NIJUM SHOP account"
                  : "Login to your NIJUM SHOP account"}
              </p>

            </div>

            {/* LOGIN / SIGNUP TABS */}

            <div className="auth-tabs">

              <button
                type="button"
                className={
                  !isSignup
                    ? "active"
                    : ""
                }
                onClick={() => {
                  setIsSignup(false);
                  setMessage("");
                  setPassword("");
                }}
                disabled={
                  loading ||
                  googleLoading
                }
              >
                🔐 Login
              </button>

              <button
                type="button"
                className={
                  isSignup
                    ? "active"
                    : ""
                }
                onClick={() => {
                  setIsSignup(true);
                  setMessage("");
                  setPassword("");
                }}
                disabled={
                  loading ||
                  googleLoading
                }
              >
                ✨ Signup
              </button>

            </div>

            {/* =========================================
                GOOGLE LOGIN
            ========================================= */}

            <button
              type="button"
              className="google-button"
              onClick={handleGoogleLogin}
              disabled={
                loading ||
                googleLoading
              }
            >

              {googleLoading ? (
                <>
                  <span className="google-loader"></span>

                  Connecting to Google...
                </>
              ) : (
                <>
                  <span className="google-icon">
                    G
                  </span>

                  <span>
                    {isSignup
                      ? "Sign up with Google"
                      : "Continue with Google"}
                  </span>
                </>
              )}

            </button>

            {/* DIVIDER */}

            <div className="or-divider">

              <span></span>

              <strong>
                OR
              </strong>

              <span></span>

            </div>

            {/* FORM */}

            <form
              onSubmit={handleSubmit}
              className="login-form"
            >

              {/* NAME */}

              {isSignup && (
                <div className="input-group field-animation">

                  <label>
                    Full Name
                  </label>

                  <div className="input-wrapper">

                    <span className="input-icon">
                      👤
                    </span>

                    <input
                      type="text"
                      placeholder="আপনার নাম"
                      value={name}
                      onChange={(e) =>
                        setName(
                          e.target.value
                        )
                      }
                      disabled={
                        loading ||
                        googleLoading
                      }
                    />

                  </div>

                </div>
              )}

              {/* PHONE */}

              {isSignup && (
                <div className="input-group field-animation">

                  <label>
                    Mobile Number
                  </label>

                  <div className="input-wrapper">

                    <span className="input-icon">
                      📱
                    </span>

                    <input
                      type="tel"
                      placeholder="01XXXXXXXXX"
                      value={phone}
                      onChange={(e) =>
                        setPhone(
                          e.target.value
                        )
                      }
                      disabled={
                        loading ||
                        googleLoading
                      }
                    />

                  </div>

                </div>
              )}

              {/* EMAIL */}

              <div className="input-group">

                <label>
                  Email Address
                </label>

                <div className="input-wrapper">

                  <span className="input-icon">
                    ✉️
                  </span>

                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) =>
                      setEmail(
                        e.target.value
                      )
                    }
                    disabled={
                      loading ||
                      googleLoading
                    }
                  />

                </div>

              </div>

              {/* PASSWORD */}

              <div className="input-group">

                <label>
                  Password
                </label>

                <div className="input-wrapper">

                  <span className="input-icon">
                    🔐
                  </span>

                  <input
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) =>
                      setPassword(
                        e.target.value
                      )
                    }
                    disabled={
                      loading ||
                      googleLoading
                    }
                  />

                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() =>
                      setShowPassword(
                        !showPassword
                      )
                    }
                    disabled={
                      loading ||
                      googleLoading
                    }
                  >
                    {showPassword
                      ? "🙈"
                      : "👁️"}
                  </button>

                </div>

              </div>

              {/* MESSAGE */}

              {message && (
                <div
                  className={`auth-message ${
                    message.startsWith("✅")
                      ? "success"
                      : "error"
                  }`}
                >
                  {message}
                </div>
              )}

              {/* SUBMIT */}

              <button
                type="submit"
                className="auth-submit"
                disabled={
                  loading ||
                  googleLoading
                }
              >

                <span className="button-shine"></span>

                {loading ? (
                  <>
                    <span className="loader"></span>
                    Processing...
                  </>
                ) : isSignup ? (
                  <>
                    ✨ Create Account
                  </>
                ) : (
                  <>
                    🔐 Login
                  </>
                )}

              </button>

            </form>

            {/* SWITCH */}

            <div className="auth-switch">

              <span>
                {isSignup
                  ? "Already have an account?"
                  : "Don't have an account?"}
              </span>

              <button
                type="button"
                onClick={switchMode}
                disabled={
                  loading ||
                  googleLoading
                }
              >
                {isSignup
                  ? "Login"
                  : "Create Account"}
              </button>

            </div>

            {/* SECURITY */}

            <div className="secure-note">

              <span>
                🔒
              </span>

              Your information is securely protected

            </div>

          </div>

        </div>

      </div>

      {/* =========================================
          GLOBAL STYLE
      ========================================= */}

      <style jsx>{`

        * {
          box-sizing: border-box;
        }

        /* =========================================
           PAGE
        ========================================= */

        .auth-page {
          min-height: 100vh;

          position: relative;

          overflow: hidden;

          display: flex;

          align-items: center;

          justify-content: center;

          padding: 80px 20px 40px;

          background:
            radial-gradient(
              circle at 15% 20%,
              rgba(212, 175, 55, 0.12),
              transparent 28%
            ),
            radial-gradient(
              circle at 85% 80%,
              rgba(212, 175, 55, 0.08),
              transparent 30%
            ),
            linear-gradient(
              135deg,
              #050505 0%,
              #0a0a0a 45%,
              #111111 100%
            );

          color: #ffffff;
        }

        /* =========================================
           BACKGROUND
        ========================================= */

        .auth-background {
          position: absolute;

          inset: 0;

          overflow: hidden;

          pointer-events: none;
        }

        .gold-orb {
          position: absolute;

          border-radius: 50%;

          filter: blur(4px);

          opacity: 0.22;

          background:
            radial-gradient(
              circle,
              #f5d76e 0%,
              #d4af37 35%,
              transparent 70%
            );

          animation:
            orbFloat
            9s
            ease-in-out
            infinite;
        }

        .orb-one {
          width: 380px;

          height: 380px;

          left: -170px;

          top: -150px;
        }

        .orb-two {
          width: 420px;

          height: 420px;

          right: -180px;

          bottom: -180px;

          animation-delay: 2s;
        }

        .orb-three {
          width: 180px;

          height: 180px;

          right: 20%;

          top: 5%;

          animation-delay: 4s;
        }

        @keyframes orbFloat {

          0%,
          100% {
            transform:
              translate(0, 0)
              scale(1);
          }

          50% {
            transform:
              translate(20px, -25px)
              scale(1.08);
          }

        }

        /* =========================================
           GOLD RINGS
        ========================================= */

        .gold-ring {
          position: absolute;

          border-radius: 50%;

          border:
            1px solid
            rgba(212, 175, 55, 0.18);

          animation:
            ringRotate
            18s
            linear
            infinite;
        }

        .ring-one {
          width: 520px;

          height: 520px;

          left: -270px;

          bottom: -260px;
        }

        .ring-two {
          width: 420px;

          height: 420px;

          right: -210px;

          top: -210px;

          animation-direction:
            reverse;
        }

        @keyframes ringRotate {

          from {
            transform:
              rotate(0deg);
          }

          to {
            transform:
              rotate(360deg);
          }

        }

        /* =========================================
           PARTICLES
        ========================================= */

        .particles span {
          position: absolute;

          width: 4px;

          height: 4px;

          border-radius: 50%;

          background:
            #d4af37;

          opacity: 0.35;

          animation:
            particleFloat
            6s
            ease-in-out
            infinite;
        }

        .particles span:nth-child(1) {
          left: 10%;
          top: 25%;
        }

        .particles span:nth-child(2) {
          left: 25%;
          top: 70%;
          animation-delay: 1s;
        }

        .particles span:nth-child(3) {
          left: 45%;
          top: 15%;
          animation-delay: 2s;
        }

        .particles span:nth-child(4) {
          left: 65%;
          top: 80%;
          animation-delay: 3s;
        }

        .particles span:nth-child(5) {
          left: 82%;
          top: 30%;
          animation-delay: 1.5s;
        }

        .particles span:nth-child(6) {
          left: 92%;
          top: 60%;
          animation-delay: 2.5s;
        }

        .particles span:nth-child(7) {
          left: 38%;
          top: 90%;
          animation-delay: 3.5s;
        }

        .particles span:nth-child(8) {
          left: 75%;
          top: 12%;
          animation-delay: 4s;
        }

        @keyframes particleFloat {

          0%,
          100% {
            transform:
              translateY(0)
              scale(1);
          }

          50% {
            transform:
              translateY(-25px)
              scale(1.5);
          }

        }

        /* =========================================
           BACK HOME
        ========================================= */

        .back-home {
          position: absolute;

          top: 25px;

          left: 25px;

          z-index: 20;

          padding: 11px 18px;

          border:
            1px solid
            rgba(212, 175, 55, 0.35);

          border-radius: 12px;

          background:
            rgba(10, 10, 10, 0.85);

          color:
            #d4af37;

          font-size: 13px;

          font-weight: 700;

          cursor: pointer;

          backdrop-filter:
            blur(12px);

          transition:
            0.3s ease;
        }

        .back-home:hover {
          color:
            #f5d76e;

          border-color:
            #d4af37;

          transform:
            translateY(-2px);

          box-shadow:
            0 0 25px
            rgba(212, 175, 55, 0.18);
        }

        /* =========================================
           MAIN CONTAINER
        ========================================= */

        .auth-container {
          width: 100%;

          max-width: 1050px;

          min-height: 650px;

          position: relative;

          z-index: 5;

          display: grid;

          grid-template-columns:
            43% 57%;

          overflow: hidden;

          border-radius: 28px;

          border:
            1px solid
            rgba(212, 175, 55, 0.22);

          background:
            rgba(10, 10, 10, 0.92);

          box-shadow:
            0 35px 100px
              rgba(0, 0, 0, 0.75),
            0 0 60px
              rgba(212, 175, 55, 0.06);

          backdrop-filter:
            blur(20px);

          animation:
            containerIn
            0.8s
            ease;
        }

        @keyframes containerIn {

          from {
            opacity: 0;

            transform:
              translateY(35px)
              scale(0.97);
          }

          to {
            opacity: 1;

            transform:
              translateY(0)
              scale(1);
          }

        }

        /* =========================================
           BRAND PANEL
        ========================================= */

        .auth-brand {
          position: relative;

          overflow: hidden;

          padding: 60px 45px;

          display: flex;

          flex-direction: column;

          align-items: center;

          justify-content: center;

          text-align: center;

          background:
            radial-gradient(
              circle at 50% 35%,
              rgba(212, 175, 55, 0.15),
              transparent 35%
            ),
            linear-gradient(
              145deg,
              #080808,
              #111111,
              #050505
            );

          border-right:
            1px solid
            rgba(212, 175, 55, 0.18);
        }

        .auth-brand::before {
          content: "";

          position: absolute;

          width: 430px;

          height: 430px;

          border-radius: 50%;

          border:
            1px solid
            rgba(212, 175, 55, 0.1);

          top: -210px;

          left: -210px;
        }

        .auth-brand::after {
          content: "";

          position: absolute;

          width: 330px;

          height: 330px;

          border-radius: 50%;

          border:
            1px solid
            rgba(212, 175, 55, 0.08);

          right: -180px;

          bottom: -170px;
        }

        .brand-glow {
          position: absolute;

          width: 220px;

          height: 220px;

          border-radius: 50%;

          background:
            #d4af37;

          filter:
            blur(110px);

          opacity: 0.08;
        }

        /* =========================================
           BRAND LOGO
        ========================================= */

        .brand-logo {
          position: relative;

          width: 105px;

          height: 105px;

          display: flex;

          align-items: center;

          justify-content: center;

          border-radius: 28px;

          color:
            #050505;

          font-size: 58px;

          font-weight: 950;

          background:
            linear-gradient(
              145deg,
              #f8e79b,
              #d4af37,
              #a77d18
            );

          box-shadow:
            0 0 25px
              rgba(212, 175, 55, 0.22),
            inset 0 1px 0
              rgba(255,255,255,0.55);

          animation:
            logoPulse
            3s
            ease-in-out
            infinite;
        }

        @keyframes logoPulse {

          0%,
          100% {
            transform:
              translateY(0);

            box-shadow:
              0 0 25px
                rgba(212, 175, 55, 0.2),
              inset 0 1px 0
                rgba(255,255,255,0.55);
          }

          50% {
            transform:
              translateY(-8px);

            box-shadow:
              0 0 45px
                rgba(212, 175, 55, 0.38),
              inset 0 1px 0
                rgba(255,255,255,0.65);
          }

        }

        .brand-name {
          margin-top: 25px;

          color:
            #f5d76e;

          font-size: 32px;

          font-weight: 950;

          letter-spacing: 2px;

          text-shadow:
            0 0 20px
            rgba(212, 175, 55, 0.2);
        }

        .brand-tagline {
          margin-top: 7px;

          color:
            #a8a8a8;

          font-size: 14px;

          letter-spacing: 1px;
        }

        .brand-divider {
          width: 65px;

          height: 3px;

          margin: 28px 0;

          border-radius: 10px;

          background:
            linear-gradient(
              90deg,
              transparent,
              #d4af37,
              transparent
            );

          box-shadow:
            0 0 12px
            rgba(212, 175, 55, 0.35);
        }

        .auth-brand h2 {
          margin:
            0 0 12px;

          color:
            #ffffff;

          font-size: 25px;

          font-weight: 800;
        }

        .auth-brand > p {
          max-width: 290px;

          margin: 0;

          color:
            #999999;

          font-size: 14px;

          line-height: 1.8;
        }

        /* =========================================
           BRAND FEATURES
        ========================================= */

        .brand-features {
          margin-top: 30px;

          display: flex;

          flex-direction: column;

          gap: 10px;

          text-align: left;

          color:
            #a8a8a8;

          font-size: 13px;
        }

        .brand-features div {
          display: flex;

          align-items: center;

          gap: 9px;
        }

        .brand-features span {
          display: flex;

          align-items: center;

          justify-content: center;

          width: 20px;

          height: 20px;

          border-radius: 50%;

          background:
            rgba(212, 175, 55, 0.12);

          color:
            #d4af37;

          font-size: 12px;

          font-weight: 900;
        }

        /* =========================================
           FORM WRAPPER
        ========================================= */

        .auth-form-wrapper {
          display: flex;

          align-items: center;

          justify-content: center;

          padding: 55px;
        }

        .auth-form {
          width: 100%;

          max-width: 440px;

          animation:
            formIn
            0.65s
            ease;
        }

        @keyframes formIn {

          from {
            opacity: 0;

            transform:
              translateX(25px);
          }

          to {
            opacity: 1;

            transform:
              translateX(0);
          }

        }

        /* =========================================
           HEADER
        ========================================= */

        .form-header {
          text-align: center;

          margin-bottom: 24px;
        }

        .form-icon {
          width: 58px;

          height: 58px;

          margin:
            0 auto 13px;

          display: flex;

          align-items: center;

          justify-content: center;

          border-radius: 17px;

          border:
            1px solid
            rgba(212, 175, 55, 0.28);

          background:
            rgba(212, 175, 55, 0.08);

          font-size: 25px;

          box-shadow:
            0 0 25px
            rgba(212, 175, 55, 0.06);
        }

        .form-header h1 {
          margin: 0;

          color:
            #ffffff;

          font-size: 29px;

          font-weight: 850;
        }

        .form-header p {
          margin:
            8px 0 0;

          color:
            #777777;

          font-size: 13px;
        }

        /* =========================================
           TABS
        ========================================= */

        .auth-tabs {
          display: grid;

          grid-template-columns:
            1fr 1fr;

          padding: 5px;

          margin-bottom: 20px;

          border:
            1px solid
            rgba(212, 175, 55, 0.13);

          border-radius: 14px;

          background:
            rgba(255,255,255,0.025);
        }

        .auth-tabs button {
          height: 42px;

          border: none;

          border-radius: 10px;

          background:
            transparent;

          color:
            #777777;

          font-size: 13px;

          font-weight: 800;

          cursor: pointer;

          transition:
            0.3s ease;
        }

        .auth-tabs button.active {
          color:
            #080808;

          background:
            linear-gradient(
              135deg,
              #f5d76e,
              #d4af37,
              #b58a20
            );

          box-shadow:
            0 5px 18px
            rgba(212, 175, 55, 0.18);
        }

        .auth-tabs button:not(.active):hover {
          color:
            #d4af37;
        }

        .auth-tabs button:disabled {
          cursor:
            not-allowed;

          opacity:
            0.55;
        }

        /* =========================================
           GOOGLE BUTTON
        ========================================= */

        .google-button {
          width: 100%;

          height: 53px;

          display: flex;

          align-items: center;

          justify-content: center;

          gap: 11px;

          border:
            1px solid
            #d4af37;

          border-radius: 13px;

          background:
            #d4af37;

          color:
            #171717;

          font-size: 13px;

          font-weight: 800;

          cursor: pointer;

          transition:
            0.3s ease;

          box-shadow:
            0 8px 22px
            rgba(0,0,0,0.2);
        }

        .google-button:hover:not(:disabled) {
          transform:
            translateY(-2px);

          border-color:
            #d4af37;

          box-shadow:
            0 12px 30px
            rgba(212, 175, 55, 0.12);
        }

        .google-button:active:not(:disabled) {
          transform:
            translateY(0);
        }

        .google-button:disabled {
          opacity:
            0.65;

          cursor:
            not-allowed;
        }

        .google-icon {
          width: 24px;

          height: 24px;

          display: flex;

          align-items: center;

          justify-content: center;

          border-radius: 50%;

          font-size: 30px;

          font-weight: 900;

          color:
            rgba(255, 0, 0, 0.84);

          background:
            #d4af37;
        }

        /* =========================================
           GOOGLE LOADER
        ========================================= */

        .google-loader {
          width: 18px;

          height: 18px;

          border:
            2px solid
            #dddddd;

          border-top-color:
            #4285f4;

          border-radius: 50%;

          animation:
            spin
            0.7s
            linear
            infinite;
        }

        /* =========================================
           OR DIVIDER
        ========================================= */

        .or-divider {
          display: flex;

          align-items: center;

          gap: 12px;

          margin:
            20px 0;
        }

        .or-divider span {
          flex: 1;

          height: 1px;

          background:
            #252525;
        }

        .or-divider strong {
          color:
            #555555;

          font-size: 10px;

          font-weight: 800;

          letter-spacing: 1px;
        }

        /* =========================================
           INPUT
        ========================================= */

        .input-group {
          margin-bottom: 17px;

          animation:
            fieldIn
            0.4s
            ease;
        }

        .field-animation {
          animation:
            fieldIn
            0.45s
            ease;
        }

        @keyframes fieldIn {

          from {
            opacity: 0;

            transform:
              translateY(-8px);
          }

          to {
            opacity: 1;

            transform:
              translateY(0);
          }

        }

        .input-group label {
          display: block;

          margin-bottom: 7px;

          color:
            #c8c8c8;

          font-size: 12px;

          font-weight: 750;
        }

        .input-wrapper {
          height: 53px;

          display: flex;

          align-items: center;

          gap: 10px;

          padding: 0 14px;

          border:
            1px solid
            #292929;

          border-radius: 13px;

          background:
            #101010;

          transition:
            0.3s ease;
        }

        .input-wrapper:hover {
          border-color:
            #3a3a3a;
        }

        .input-wrapper:focus-within {
          border-color:
            #d4af37;

          background:
            #0d0d0d;

          box-shadow:
            0 0 0 3px
            rgba(212, 175, 55, 0.08),
            0 0 25px
            rgba(212, 175, 55, 0.06);

          transform:
            translateY(-1px);
        }

        .input-icon {
          font-size: 16px;

          opacity: 0.85;
        }

        .input-wrapper input {
          width: 100%;

          height: 100%;

          border: none;

          outline: none;

          background:
            transparent;

          color:
            #ffffff;

          font-size: 14px;
        }

        .input-wrapper input::placeholder {
          color:
            #555555;
        }

        .input-wrapper input:disabled {
          opacity:
            0.55;
        }

        /* =========================================
           PASSWORD
        ========================================= */

        .password-toggle {
          flex-shrink: 0;

          border: none;

          background:
            transparent;

          color:
            #777777;

          font-size: 17px;

          cursor: pointer;

          padding: 4px;

          transition:
            0.2s;
        }

        .password-toggle:hover {
          color:
            #d4af37;
        }

        /* =========================================
           MESSAGE
        ========================================= */

        .auth-message {
          padding: 11px 13px;

          margin:
            4px 0 15px;

          border-radius: 10px;

          font-size: 12px;

          line-height: 1.6;
        }

        .auth-message.success {
          color:
            #d4af37;

          background:
            rgba(212, 175, 55, 0.08);

          border:
            1px solid
            rgba(212, 175, 55, 0.2);
        }

        .auth-message.error {
          color:
            #ff8585;

          background:
            rgba(255, 80, 80, 0.06);

          border:
            1px solid
            rgba(255, 80, 80, 0.18);
        }

        /* =========================================
           SUBMIT BUTTON
        ========================================= */

        .auth-submit {
          position: relative;

          overflow: hidden;

          width: 100%;

          height: 54px;

          display: flex;

          align-items: center;

          justify-content: center;

          gap: 9px;

          border: none;

          border-radius: 13px;

          cursor: pointer;

          color:
            #070707;

          font-size: 14px;

          font-weight: 900;

          background:
            linear-gradient(
              135deg,
              #f8e79b 0%,
              #d4af37 45%,
              #a77d18 100%
            );

          box-shadow:
            0 10px 28px
            rgba(212, 175, 55, 0.18);

          transition:
            0.3s ease;
        }

        .auth-submit:hover:not(:disabled) {
          transform:
            translateY(-2px);

          box-shadow:
            0 15px 35px
            rgba(212, 175, 55, 0.3);
        }

        .auth-submit:active:not(:disabled) {
          transform:
            translateY(0);
        }

        .auth-submit:disabled {
          opacity:
            0.6;

          cursor:
            not-allowed;
        }

        /* =========================================
           BUTTON SHINE
        ========================================= */

        .button-shine {
          position: absolute;

          width: 70px;

          height: 120px;

          top: -35px;

          left: -100px;

          transform:
            rotate(25deg);

          background:
            rgba(255,255,255,0.35);

          filter:
            blur(10px);

          animation:
            buttonShine
            3.5s
            ease-in-out
            infinite;
        }

        @keyframes buttonShine {

          0% {
            left:
              -100px;
          }

          55%,
          100% {
            left:
              120%;
          }

        }

        /* =========================================
           LOADER
        ========================================= */

        .loader {
          width: 18px;

          height: 18px;

          border:
            2px solid
            rgba(0,0,0,0.25);

          border-top-color:
            #050505;

          border-radius: 50%;

          animation:
            spin
            0.7s
            linear
            infinite;
        }

        @keyframes spin {

          to {
            transform:
              rotate(360deg);
          }

        }

        /* =========================================
           SWITCH
        ========================================= */

        .auth-switch {
          margin-top: 22px;

          text-align: center;

          color:
            #707070;

          font-size: 12px;
        }

        .auth-switch button {
          margin-left: 6px;

          padding: 0;

          border: none;

          background:
            transparent;

          color:
            #d4af37;

          font-size: 12px;

          font-weight: 850;

          cursor: pointer;
        }

        .auth-switch button:hover {
          color:
            #f5d76e;

          text-decoration:
            underline;
        }

        .auth-switch button:disabled {
          opacity:
            0.5;

          cursor:
            not-allowed;
        }

        /* =========================================
           SECURITY
        ========================================= */

        .secure-note {
          display: flex;

          align-items: center;

          justify-content: center;

          gap: 5px;

          margin-top: 20px;

          color:
            #4f4f4f;

          font-size: 10px;
        }

        .secure-note span {
          color:
            #d4af37;
        }

        /* =========================================
           MOBILE
        ========================================= */

        @media (max-width: 850px) {

          .auth-page {
            padding:
              75px 15px 30px;
          }

          .auth-container {
            max-width: 520px;

            grid-template-columns:
              1fr;

            min-height: auto;
          }

          .auth-brand {
            padding:
              38px 25px;

            border-right: none;

            border-bottom:
              1px solid
              rgba(212, 175, 55, 0.16);
          }

          .brand-logo {
            width: 75px;

            height: 75px;

            border-radius: 21px;

            font-size: 40px;
          }

          .brand-name {
            font-size: 25px;

            margin-top: 17px;
          }

          .brand-tagline {
            font-size: 12px;
          }

          .brand-divider,
          .auth-brand h2,
          .auth-brand > p,
          .brand-features {
            display: none;
          }

          .auth-form-wrapper {
            padding:
              38px 25px 40px;
          }

        }

        /* =========================================
           SMALL MOBILE
        ========================================= */

        @media (max-width: 450px) {

          .auth-page {
            padding:
              70px 10px 20px;
          }

          .back-home {
            top: 15px;

            left: 15px;

            padding:
              9px 13px;

            font-size: 11px;
          }

          .auth-container {
            border-radius: 21px;
          }

          .auth-brand {
            padding:
              28px 20px;
          }

          .auth-form-wrapper {
            padding:
              30px 17px 32px;
          }

          .form-header h1 {
            font-size: 24px;
          }

          .form-header p {
            font-size: 12px;
          }

          .input-wrapper {
            height: 50px;
          }

          .google-button {
            height: 51px;

            font-size: 12px;
          }

          .auth-submit {
            height: 52px;
          }

        }

      `}</style>

    </main>
  );
}
