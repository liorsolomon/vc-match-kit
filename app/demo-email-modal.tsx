"use client";

import { useState, useEffect } from "react";
import { pickTemplate } from "./data/email-templates";

interface DemoEmailModalProps {
  stage?: string;
  sector?: string;
  onClose: () => void;
}

export default function DemoEmailModal({ stage, sector, onClose }: DemoEmailModalProps) {
  const template = pickTemplate(stage, sector);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(`Subject: ${template.subject}\n\n${template.body}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard not available
    }
  }

  const stageLabel = template.stageLabel || (stage ?? "");
  const sectorLabel = template.sectorLabel || (sector ?? "");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,27,45,0.75)", backdropFilter: "blur(2px)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl rounded-2xl overflow-hidden flex flex-col"
        style={{
          background: "#FFFFFF",
          maxHeight: "90vh",
          boxShadow: "0 24px 64px rgba(0,0,0,0.25)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-start justify-between px-6 py-5 shrink-0"
          style={{ borderBottom: "1px solid #E2E8F0" }}
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className="text-xs font-semibold uppercase tracking-widest px-2.5 py-0.5 rounded-full text-white"
                style={{ background: "#4F46E5" }}
              >
                Sample AI Outreach Email
              </span>
              {(stageLabel || sectorLabel) && (
                <span className="text-xs text-[#64748B] font-medium">
                  {[stageLabel, sectorLabel].filter(Boolean).join(" · ")}
                </span>
              )}
            </div>
            <p className="text-sm text-[#64748B]">
              This is what our AI generates for your investor list — personalized to your stage and sector.
            </p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 ml-4 text-[#94A3B8] hover:text-[#1A1A2E] transition-colors text-xl font-light leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Email content */}
        <div className="overflow-y-auto flex-1 px-6 py-5">
          {/* Subject line */}
          <div
            className="rounded-lg px-4 py-3 mb-4 text-sm"
            style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}
          >
            <span className="font-semibold text-[#64748B] mr-2">Subject:</span>
            <span className="text-[#1A1A2E]">{template.subject}</span>
          </div>

          {/* Body */}
          <pre
            className="text-sm leading-relaxed whitespace-pre-wrap font-sans"
            style={{ color: "#1A1A2E" }}
          >
            {template.body}
          </pre>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between px-6 py-4 shrink-0 gap-4"
          style={{ borderTop: "1px solid #E2E8F0", background: "#F8FAFC" }}
        >
          <p className="text-xs text-[#64748B] leading-relaxed">
            Unlock the full list to get personalized outreach for every matched investor — with their name, fund thesis, and portfolio already filled in.
          </p>
          <button
            onClick={handleCopy}
            className="shrink-0 text-sm font-semibold px-4 py-2 rounded-lg transition-colors text-white"
            style={{ background: copied ? "#10B981" : "#4F46E5" }}
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>
    </div>
  );
}
