"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        router.push("/dashboard");
      } else {
        const data = await res.json();
        setError(data.error || "Login failed");
        setIsLoading(false);
      }
    } catch {
      setError("An unexpected error occurred");
      setIsLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap');

        :root {
          --blue: #1a3a6b;
          --blue-mid: #2a52a0;
          --paste: #e8e4d9;
          --paste-dark: #d4cfc3;
          --paste-light: #f2efe8;
          --ink: #1c1c1c;
          --muted: #7a7670;
          --rule: #c8c4b8;
          --white: #faf9f7;
          --red: #8b2020;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .login-root {
          min-height: 100vh;
          display: flex;
          background-color: var(--paste);
          font-family: 'DM Mono', monospace;
          position: relative;
          overflow: hidden;
        }

        /* Left panel — decorative industrial stripe */
        .login-sidebar {
          width: 44%;
          background-color: var(--blue);
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 48px 40px;
          overflow: hidden;
          flex-shrink: 0;
        }

        /* Subtle ruled-line texture on sidebar */
        .login-sidebar::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 39px,
            rgba(255,255,255,0.04) 39px,
            rgba(255,255,255,0.04) 40px
          );
          pointer-events: none;
        }

        /* Shipyard background image, low opacity */
        .sidebar-bg {
          position: absolute;
          inset: 0;
          background-image: url('/shipyard-bg.jpg');
          background-size: cover;
          background-position: center;
          opacity: 0.08;
          filter: grayscale(1);
        }

        .sidebar-top {
          position: relative;
          z-index: 1;
        }

        .sidebar-eyebrow {
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: rgba(232, 228, 217, 0.5);
          margin-bottom: 28px;
        }

        .sidebar-title {
          font-family: 'Libre Baskerville', serif;
          font-size: 72px;
          font-weight: 700;
          color: var(--paste);
          line-height: 1;
          letter-spacing: -0.02em;
          margin-bottom: 12px;
        }

        .sidebar-title em {
          font-style: italic;
          color: rgba(232, 228, 217, 0.6);
        }

        .sidebar-grit-expand {
          font-family: 'DM Mono', monospace;
          font-size: 13px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(232, 228, 217, 0.45);
          line-height: 1;
          white-space: nowrap;
        }

        .sidebar-rule {
          width: 40px;
          height: 2px;
          background: rgba(232, 228, 217, 0.3);
          margin: 32px 0;
        }

        .sidebar-desc {
          font-size: 12px;
          line-height: 1.9;
          color: rgba(232, 228, 217, 0.5);
          letter-spacing: 0.02em;
          max-width: 240px;
        }

        .sidebar-bottom {
          position: relative;
          z-index: 1;
        }

        .sidebar-system-label {
          font-size: 9px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: rgba(232, 228, 217, 0.25);
        }

        /* Right panel — form */
        .login-form-panel {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 48px 40px;
          background-color: var(--paste-light);
        }

        .login-card {
          width: 100%;
          max-width: 360px;
          animation: fadeUp 0.55s cubic-bezier(0.22, 1, 0.36, 1) forwards;
          opacity: 0;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* Logo area */
        .login-logo-wrap {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 40px;
        }

        .login-logo-img {
          height: 40px;
          width: auto;
          object-fit: contain;
        }

        .login-logo-text {
          display: flex;
          flex-direction: column;
        }

        .login-logo-name {
          font-family: 'Libre Baskerville', serif;
          font-size: 20px;
          font-weight: 700;
          letter-spacing: 0.04em;
          color: var(--blue);
          line-height: 1;
        }

        .login-logo-sub {
          font-size: 9px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--muted);
          margin-top: 4px;
        }

        /* Divider */
        .login-divider {
          width: 100%;
          height: 1px;
          background: var(--rule);
          margin-bottom: 36px;
        }

        /* Form heading */
        .login-heading {
          font-family: 'Libre Baskerville', serif;
          font-size: 22px;
          font-weight: 400;
          color: var(--ink);
          margin-bottom: 6px;
          letter-spacing: -0.01em;
        }

        .login-subheading {
          font-size: 11px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--muted);
          margin-bottom: 32px;
        }

        /* Field */
        .field-group {
          margin-bottom: 20px;
        }

        .field-label {
          display: block;
          font-size: 9px;
          font-weight: 500;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--muted);
          margin-bottom: 8px;
        }

        .field-input {
          width: 100%;
          padding: 12px 14px;
          font-family: 'DM Mono', monospace;
          font-size: 13px;
          color: var(--ink);
          background-color: var(--white);
          border: 1px solid var(--rule);
          border-radius: 0;
          outline: none;
          transition: border-color 0.15s ease, background 0.15s ease;
          letter-spacing: 0.02em;
        }

        .field-input::placeholder {
          color: var(--rule);
          letter-spacing: 0.05em;
        }

        .field-input:focus {
          border-color: var(--blue);
          background-color: #fff;
        }

        .field-input:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Error */
        .login-error {
          padding: 10px 14px;
          background: transparent;
          border-left: 2px solid var(--red);
          color: var(--red);
          font-size: 11px;
          letter-spacing: 0.04em;
          margin-bottom: 20px;
          animation: fadeUp 0.25s ease forwards;
        }

        /* Submit button */
        .login-btn {
          width: 100%;
          padding: 13px 20px;
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--paste);
          background-color: var(--blue);
          border: none;
          border-radius: 0;
          cursor: pointer;
          transition: background-color 0.15s ease, opacity 0.15s ease;
          margin-top: 8px;
        }

        .login-btn:hover:not(:disabled) {
          background-color: var(--blue-mid);
        }

        .login-btn:active:not(:disabled) {
          transform: scale(0.995);
        }

        .login-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* Footer meta */
        .login-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 32px;
          padding-top: 20px;
          border-top: 1px solid var(--rule);
        }

        .login-meta-item {
          font-size: 9px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: var(--muted);
          opacity: 0.6;
        }

        .status-dot {
          display: inline-block;
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #4a7c5a;
          margin-right: 6px;
          vertical-align: middle;
          position: relative;
          top: -1px;
        }

        /* Responsive collapse */
        @media (max-width: 720px) {
          .login-sidebar { display: none; }
          .login-form-panel { padding: 32px 24px; }
        }
      `}</style>

      <div className="login-root">
        {/* Left Sidebar */}
        <div className="login-sidebar">
          <div className="sidebar-bg" />

          <div className="sidebar-top">
            <p className="sidebar-eyebrow">KR Steel · Ship Recycling Yard</p>
            <h2 className="sidebar-title">GRIT</h2>
            <p className="sidebar-grit-expand">
              Gear Reliability and Intervention Tracker
            </p>
            <div className="sidebar-rule" />
            <p className="sidebar-desc">
              Plant maintenance and intervention management platform for
              industrial operations. Authorized personnel only.
            </p>
          </div>

          <div className="sidebar-bottom">
            <p className="sidebar-system-label">
              Gear Reliability and Intervention Tracker · v1.0.0
            </p>
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="login-form-panel">
          <div className="login-card">
            {/* Logo */}
            <div className="login-logo-wrap">
              <img
                src="/logo.png"
                alt="KR Steel Logo"
                className="login-logo-img"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
              <div className="login-logo-text">
                <span className="login-logo-name">KR Steel</span>
                <span className="login-logo-sub">
                  GRIT — Maintenance Platform
                </span>
              </div>
            </div>

            <div className="login-divider" />

            <h1 className="login-heading">Welcome back</h1>
            <p className="login-subheading">Sign in to continue</p>

            <form onSubmit={handleLogin}>
              <div className="field-group">
                <label className="field-label" htmlFor="username">
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
                  className="field-input"
                  placeholder="Enter your ID"
                  autoComplete="username"
                />
              </div>

              <div className="field-group">
                <label className="field-label" htmlFor="password">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="field-input"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>

              {error && (
                <div className="login-error" role="alert">
                  {error}
                </div>
              )}

              <Button type="submit" disabled={isLoading} className="login-btn">
                {isLoading ? "Authenticating..." : "Access Dashboard"}
              </Button>
            </form>

            <div className="login-meta">
              <span className="login-meta-item">
                <span className="status-dot" />
                Secure Connection
              </span>
              <span className="login-meta-item">v1.0.0</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
