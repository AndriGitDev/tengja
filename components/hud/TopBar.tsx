"use client";

import { useEffect, useState } from "react";
import { GlowText } from "@/components/ui/GlowText";
import { StatusBadge } from "@/components/ui/StatusBadge";

export function TopBar() {
  const [time, setTime] = useState("");

  useEffect(() => {
    function update() {
      const now = new Date();
      setTime(
        now.toISOString().slice(11, 19) + " UTC"
      );
    }
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute top-0 left-0 right-0 z-20 pointer-events-none flex items-center justify-between px-6 py-3">
      <div className="flex items-center gap-2">
        <GlowText color="cyan" className="text-lg tracking-[0.3em] font-bold">
          TENGJA
        </GlowText>
        <span className="text-[var(--noc-text-dim)] font-mono text-[10px] tracking-wider ml-2 hidden sm:inline">
          ICELAND&apos;S NETWORK PULSE
        </span>
      </div>

      <div className="flex items-center gap-4">
        <span className="font-mono text-xs text-[var(--noc-text-dim)] tabular-nums">
          {time}
        </span>
        <div className="flex items-center gap-2">
          <StatusBadge status="online" />
          <span className="font-mono text-[10px] text-[var(--noc-green)] tracking-wider">
            KERFI VIRKT
          </span>
        </div>
      </div>
    </div>
  );
}
