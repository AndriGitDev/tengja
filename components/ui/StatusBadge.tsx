"use client";

interface StatusBadgeProps {
  status: "online" | "degraded" | "offline";
  pulse?: boolean;
}

const colors = {
  online: "bg-[var(--noc-green)]",
  degraded: "bg-[var(--noc-amber)]",
  offline: "bg-[var(--noc-red)]",
};

const shadows = {
  online: "shadow-[0_0_6px_var(--noc-green)]",
  degraded: "shadow-[0_0_6px_var(--noc-amber)]",
  offline: "shadow-[0_0_6px_var(--noc-red)]",
};

export function StatusBadge({ status, pulse = true }: StatusBadgeProps) {
  return (
    <span
      className={`inline-block w-2 h-2 rounded-full ${colors[status]} ${shadows[status]} ${pulse ? "animate-pulse-glow" : ""}`}
    />
  );
}
