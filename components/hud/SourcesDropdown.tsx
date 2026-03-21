"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Database, X } from "lucide-react";
import { dataSources, type SourceType } from "@/lib/data/sources";

const badgeColors: Record<SourceType, { bg: string; text: string; label: string }> = {
  live: { bg: "bg-[var(--noc-green)]/20", text: "text-[var(--noc-green)]", label: "LIVE" },
  static: { bg: "bg-[var(--noc-cyan)]/20", text: "text-[var(--noc-cyan)]", label: "STATIC" },
  simulated: { bg: "bg-[var(--noc-amber)]/20", text: "text-[var(--noc-amber)]", label: "SIMULATED" },
};

export function SourcesDropdown() {
  const [open, setOpen] = useState(false);

  return (
    <div className="absolute bottom-10 left-4 z-20">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 bg-[var(--noc-surface)]/80 backdrop-blur-sm border border-[var(--noc-border)] rounded text-xs font-mono tracking-wider text-[var(--noc-text-dim)] hover:border-[var(--noc-cyan)]/30 transition-colors"
      >
        <Database size={12} />
        GAGNALINDIR
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 10, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-10 left-0 w-80 max-h-[60vh] overflow-y-auto bg-[var(--noc-surface)]/95 backdrop-blur-md border border-[var(--noc-border)] rounded-lg"
          >
            <div className="flex items-center justify-between p-3 border-b border-[var(--noc-border)]">
              <span className="font-mono text-xs tracking-wider text-[var(--noc-text-dim)]">
                DATA SOURCES
              </span>
              <button
                onClick={() => setOpen(false)}
                className="p-1 hover:bg-[var(--noc-border)] rounded transition-colors"
              >
                <X size={14} className="text-[var(--noc-text-dim)]" />
              </button>
            </div>

            <div className="p-2 space-y-1">
              {dataSources.map((source, i) => {
                const badge = badgeColors[source.type];
                return (
                  <div
                    key={i}
                    className="p-2 rounded hover:bg-[var(--noc-border)]/30 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      {source.url ? (
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-xs text-[var(--noc-text)] hover:text-[var(--noc-cyan)] transition-colors"
                        >
                          {source.name} ↗
                        </a>
                      ) : (
                        <span className="font-mono text-xs text-[var(--noc-text)]">
                          {source.name}
                        </span>
                      )}
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold tracking-wider ${badge.bg} ${badge.text}`}
                      >
                        {badge.label}
                      </span>
                    </div>
                    <p className="text-[10px] text-[var(--noc-text-dim)] leading-relaxed">
                      {source.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
