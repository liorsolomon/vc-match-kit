"use client";

import { useState } from "react";

export default function WaitlistForm({
  buttonText = "Join the Waitlist (Free)",
  inputPlaceholder = "you@startup.com",
  dark = false,
}: {
  buttonText?: string;
  inputPlaceholder?: string;
  dark?: boolean;
}) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setStatus("success");
        setEmail("");
        if (typeof window !== "undefined" && (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag) {
          (window as unknown as { gtag: (...args: unknown[]) => void }).gtag("event", "sign_up", { method: "waitlist" });
        }
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <p className={`text-sm font-medium ${dark ? "text-white" : "text-[#10B981]"}`}>
        ✓ You&apos;re on the list — we&apos;ll be in touch soon.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={inputPlaceholder}
        className={`flex-1 rounded-full px-5 py-3 text-sm border focus:outline-none focus:ring-2 focus:ring-[#4F46E5] ${
          dark
            ? "bg-white/10 border-white/20 text-white placeholder-white/50"
            : "bg-white border-[#E2E8F0] text-[#1A1A2E] placeholder-[#64748B]"
        }`}
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="bg-[#4F46E5] hover:bg-[#4338CA] text-white font-semibold text-sm px-6 py-3 rounded-full transition-colors whitespace-nowrap disabled:opacity-60"
      >
        {status === "loading" ? "Joining…" : buttonText}
      </button>
      {status === "error" && (
        <p className="text-red-400 text-xs mt-1">Something went wrong — please try again.</p>
      )}
    </form>
  );
}
