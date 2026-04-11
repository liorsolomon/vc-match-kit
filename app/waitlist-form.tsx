"use client";

import { useState } from "react";
import { usePostHog } from "posthog-js/react";

export default function WaitlistForm({ dark = false }: { dark?: boolean }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const posthog = usePostHog();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");

    posthog?.capture("waitlist_submitted", { email });

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setStatus("success");
        posthog?.capture("waitlist_success", { email });
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div
        className={`w-full rounded-xl py-4 px-6 text-center font-medium ${
          dark
            ? "bg-amber-500 text-white"
            : "bg-amber-50 border border-amber-200 text-amber-800"
        }`}
      >
        🎉 You&apos;re on the list! We&apos;ll be in touch.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 w-full">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        className={`flex-1 rounded-full px-5 py-3 text-sm border focus:outline-none focus:ring-2 focus:ring-amber-400 ${
          dark
            ? "bg-gray-800 border-gray-700 text-white placeholder-gray-500"
            : "bg-white border-gray-200 text-gray-900 placeholder-gray-400"
        }`}
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm px-6 py-3 rounded-full transition-colors disabled:opacity-50 whitespace-nowrap"
      >
        {status === "loading" ? "Joining…" : "Join Waitlist"}
      </button>
      {status === "error" && (
        <p className="text-red-500 text-xs mt-1 w-full text-center">
          Something went wrong — please try again.
        </p>
      )}
    </form>
  );
}
