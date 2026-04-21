"use client";

import { useState } from "react";
import DemoEmailModal from "./demo-email-modal";

export default function WaitlistForm({
  buttonText = "Join the Waitlist (Free)",
  inputPlaceholder = "you@startup.com",
  dark = false,
  stage,
  sector,
}: {
  buttonText?: string;
  inputPlaceholder?: string;
  dark?: boolean;
  stage?: string;
  sector?: string;
}) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [showModal, setShowModal] = useState(false);

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
        setShowModal(true);
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

  return (
    <>
      {showModal && (
        <DemoEmailModal
          stage={stage}
          sector={sector}
          onClose={() => setShowModal(false)}
        />
      )}

      {status === "success" ? (
        <div className="flex flex-col items-center gap-3">
          <p className={`text-sm font-medium ${dark ? "text-white" : "text-[#10B981]"}`}>
            ✓ You&apos;re on the list — check the sample email above.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="text-xs underline underline-offset-2 opacity-70 hover:opacity-100 transition-opacity"
            style={{ color: dark ? "#CBD5E1" : "#4F46E5" }}
          >
            View sample AI outreach email again
          </button>
        </div>
      ) : (
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
      )}
    </>
  );
}
