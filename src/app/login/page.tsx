"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
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
        headers: { "Content-Type": "application/json" },
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
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --navy:        #225CA3;
          --navy-dark:   #133660;
          --navy-hover:  #1B4A82;
          --paste:       #EAE7DF;
          --paste-light: #F5F3EF;
          --white:       #FAFAF8;
          --ink:         #1A1A1A;
          --muted:       #7A8A93;
          --rule:        #D0CBC0;
          --accent:      #1CA5CE;
          --error:       #8B2020;
          --green:       #4A7C5A;
          --font:        'DM Sans', 'Helvetica Neue', Arial, sans-serif;
        }

        .lr {
          min-height: 100vh;
          display: flex;
          background: var(--paste-light);
          font-family: var(--font);
          -webkit-font-smoothing: antialiased;
        }

        /* ── Left panel ───────────────────────────── */
        .lr-left {
          width: 420px;
          flex-shrink: 0;
          background: var(--navy);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 52px 44px;
          position: relative;
          overflow: hidden;
        }

        /* Subtle horizontal rule texture */
        .lr-left::after {
          content: '';
          position: absolute;
          inset: 0;
          background-image: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 47px,
            rgba(255,255,255,0.035) 47px,
            rgba(255,255,255,0.035) 48px
          );
          pointer-events: none;
        }

        /* Vertical accent bar */
        .lr-left::before {
          content: '';
          position: absolute;
          top: 0;
          right: 0;
          width: 3px;
          height: 100%;
          background: var(--accent);
          opacity: 0.35;
        }

        .lr-left-top { position: relative; z-index: 1; }
        .lr-left-bot { position: relative; z-index: 1; }

        .lr-eyebrow {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.85);
          margin-bottom: 40px;
        }

        .lr-brand {
          font-size: 42px;
          font-weight: 600;
          letter-spacing: -0.01em;
          color: #ffffff;
          line-height: 1.05;
          margin-bottom: 6px;
        }

        .lr-brand-sub {
          font-size: 11px;
          font-weight: 400;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.9);
          margin-bottom: 40px;
        }

        .lr-rule {
          width: 32px;
          height: 1px;
          background: rgba(28, 165, 206, 0.4);
          margin-bottom: 28px;
        }

        .lr-desc {
          font-size: 13px;
          font-weight: 300;
          line-height: 1.8;
          color: rgba(255,255,255,0.85);
          max-width: 280px;
        }

        .lr-version {
          font-size: 9px;
          font-weight: 400;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.6);
        }

        /* ── Right panel ──────────────────────────── */
        .lr-right {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 48px 40px;
          background: var(--paste-light);
        }

        .lr-card {
          width: 100%;
          max-width: 368px;
          animation: lr-up 0.5s cubic-bezier(0.22,1,0.36,1) both;
        }

        @keyframes lr-up {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* Logo row */
        .lr-logo-row {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 36px;
        }

        .lr-logo-img {
          height: 48px;
          width: auto;
          object-fit: contain;
        }

        .lr-logo-name {
          font-size: 22px;
          font-weight: 700;
          letter-spacing: 0.02em;
          color: var(--navy);
          line-height: 1;
        }

        .lr-logo-tag {
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #4A6A7A;
          margin-top: 5px;
        }

        .lr-divider {
          width: 100%;
          height: 1px;
          background: var(--rule);
          margin-bottom: 36px;
        }

        /* Heading */
        .lr-heading {
          font-size: 20px;
          font-weight: 500;
          color: var(--ink);
          letter-spacing: -0.01em;
          margin-bottom: 4px;
        }

        .lr-subheading {
          font-size: 12px;
          font-weight: 400;
          letter-spacing: 0.04em;
          color: #4A5A62;
          margin-bottom: 32px;
        }

        /* Fields */
        .lr-field {
          margin-bottom: 20px;
        }

        .lr-label {
          display: block;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #225CA3;
          margin-bottom: 7px;
        }

        .lr-input {
          width: 100%;
          padding: 11px 14px;
          font-family: var(--font);
          font-size: 14px;
          font-weight: 400;
          color: var(--ink);
          background: #FFFFFF;
          border: 1px solid #C8C2B6;
          border-radius: 2px;
          outline: none;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
          -webkit-appearance: none;
        }

        .lr-input::placeholder {
          color: var(--rule);
        }

        .lr-input:focus {
          border-color: #225CA3;
          box-shadow: 0 0 0 3px rgba(34,92,163,0.06);
          background: #FFFFFF;
        }

        .lr-input:disabled {
          opacity: 0.45;
          cursor: not-allowed;
          background: var(--paste);
        }

        /* Error */
        .lr-error {
          padding: 10px 14px;
          border-left: 2px solid var(--error);
          color: var(--error);
          font-size: 12px;
          font-weight: 400;
          letter-spacing: 0.02em;
          margin-bottom: 20px;
          background: rgba(139,32,32,0.04);
          animation: lr-up 0.2s ease both;
        }

        /* Button override */
        .lr-btn {
          display: block !important;
          width: 100% !important;
          padding: 12px 20px !important;
          font-family: var(--font) !important;
          font-size: 12px !important;
          font-weight: 600 !important;
          letter-spacing: 0.16em !important;
          text-transform: uppercase !important;
          color: var(--paste-light) !important;
          background: var(--navy) !important;
          border: none !important;
          border-radius: 2px !important;
          cursor: pointer !important;
          transition: background 0.15s ease !important;
          margin-top: 6px !important;
        }

        .lr-btn:hover:not(:disabled) {
          background: var(--navy-hover) !important;
        }

        .lr-btn:active:not(:disabled) {
          background: var(--navy-dark) !important;
        }

        .lr-btn:disabled {
          opacity: 0.55 !important;
          cursor: not-allowed !important;
        }

        /* Footer */
        .lr-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 28px;
          padding-top: 20px;
          border-top: 1px solid var(--rule);
        }

        .lr-footer-item {
          font-size: 10px;
          font-weight: 400;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #5A6A73;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .lr-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: var(--green);
          flex-shrink: 0;
        }

        /* Responsive */
        @media (max-width: 700px) {
          .lr-left { display: none; }
          .lr-right { padding: 32px 24px; }
        }
      `}</style>

      <div className="lr">
        {/* ── Left Panel ── */}
        <div className="lr-left">
          <div className="lr-left-top">
            <p className="lr-eyebrow">KR Steel · Ship Recycling Facility</p>
            <h2 className="lr-brand">GRIT</h2>
            <p className="lr-brand-sub">
              Gear Reliability & Intervention Tracker
            </p>
            <div className="lr-rule" />
            <p className="lr-desc">
              Dedicated maintenance management system for KR Steel Ship
              Recycling Facility. Authorized personnel only.
            </p>
          </div>
          <div className="lr-left-bot">
            <p className="lr-version">
              KR Steel Ship Recycling Facility · GRIT · v1.0.0
            </p>
          </div>
        </div>

        {/* ── Right Panel ── */}
        <div className="lr-right">
          <div className="lr-card">
            {/* Logo */}
            <div className="lr-logo-row">
              <img
                src="/logo.png"
                alt="KR Steel"
                className="lr-logo-img"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
              <div>
                <div className="lr-logo-name">KR Steel</div>
                <div className="lr-logo-tag">
                  KR Steel Ship Recycling Facility
                </div>
              </div>
            </div>

            <div className="lr-divider" />

            <h1 className="lr-heading">Sign in</h1>
            <p className="lr-subheading">Enter your credentials to continue</p>

            <form onSubmit={handleLogin}>
              <div className="lr-field">
                <label className="lr-label" htmlFor="username">
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
                  className="lr-input"
                  placeholder="Your username"
                  autoComplete="username"
                />
              </div>

              <div className="lr-field">
                <label className="lr-label" htmlFor="password">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="lr-input"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>

              {error && (
                <div className="lr-error" role="alert">
                  {error}
                </div>
              )}

              <Button type="submit" disabled={isLoading} className="lr-btn">
                {isLoading ? "Authenticating…" : "Access Dashboard"}
              </Button>
            </form>

            <div className="lr-footer">
              <span className="lr-footer-item">
                <span className="lr-dot" />
                Secure connection
              </span>
              <span className="lr-footer-item">v1.0.0</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
