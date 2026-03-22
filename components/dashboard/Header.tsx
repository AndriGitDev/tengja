"use client";

import { useEffect, useState } from "react";

export function Header() {
  const [time, setTime] = useState("");

  useEffect(() => {
    const tick = () => {
      setTime(
        new Date().toLocaleTimeString("en-GB", {
          timeZone: "UTC",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }) + " UTC"
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="flex items-center justify-between px-6 py-3 border-b border-[var(--noc-border)]">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-bold tracking-[0.3em] text-[var(--noc-cyan)]" style={{ textShadow: "0 0 10px rgba(0, 240, 255, 0.5), 0 0 30px rgba(0, 240, 255, 0.2)" }}>
          TENGJA
        </h1>
        <span className="text-xs tracking-[0.2em] text-[var(--noc-text-dim)] uppercase">
          Iceland&apos;s Network Pulse
        </span>
      </div>
      <div className="flex items-center gap-4">
        <span className="font-mono text-sm text-[var(--noc-text-dim)]">{time}</span>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[var(--noc-green)]" style={{ boxShadow: "0 0 6px var(--noc-green)" }} />
          <span className="text-xs font-mono text-[var(--noc-green)] uppercase tracking-wider">Kerfi Virkt</span>
        </div>
      </div>
    </header>
  );
}
