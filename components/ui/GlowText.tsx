"use client";

interface GlowTextProps {
  children: React.ReactNode;
  color?: "cyan" | "amber" | "green";
  mono?: boolean;
  className?: string;
}

export function GlowText({
  children,
  color = "cyan",
  mono = true,
  className = "",
}: GlowTextProps) {
  const glowClass = `glow-${color}`;
  const colorMap = {
    cyan: "text-[var(--noc-cyan)]",
    amber: "text-[var(--noc-amber)]",
    green: "text-[var(--noc-green)]",
  };

  return (
    <span
      className={`${mono ? "font-mono" : "font-sans"} ${colorMap[color]} ${glowClass} ${className}`}
    >
      {children}
    </span>
  );
}
