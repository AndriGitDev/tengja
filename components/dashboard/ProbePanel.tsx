"use client";

import { useEffect, useState } from "react";
import type { ProbeWithMeasurements, ProbeSummary } from "@/lib/api/types";

export function ProbePanel() {
  const [probes, setProbes] = useState<(ProbeWithMeasurements | ProbeSummary)[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchProbes() {
      try {
        // Try measurements endpoint first (slower but more data)
        const res = await fetch("/api/ripe/probes");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (mounted) {
          setProbes(data);
          setLoading(false);
        }
      } catch (e) {
        if (mounted) {
          setError(e instanceof Error ? e.message : "Failed to fetch probes");
          setLoading(false);
        }
      }
    }

    fetchProbes();
    const id = setInterval(fetchProbes, 60000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  const onlineCount = probes.filter((p) => p.status === "Connected").length;

  return (
    <div className="bg-[var(--noc-surface)] border border-[var(--noc-border)] rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-mono text-xs tracking-[0.2em] text-[var(--noc-text-dim)] uppercase">
          RIPE Atlas Mælar
          </h2>
          <span className="font-mono text-xs text-[var(--noc-green)]">
            {loading ? "..." : `${onlineCount} tengdir`}
          </span>
        </div>

        {loading && (
          <div className="text-center py-4 font-mono text-xs text-[var(--noc-text-dim)]">
            Sæki mælingar...
          </div>
        )}

        {error && (
          <div className="text-center py-4 font-mono text-xs text-[var(--noc-red)]">
            Villa: {error}
          </div>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {probes.map((probe) => {
              const isConnected = probe.status === "Connected";
              const hasMeasurements = "pingRtt" in probe;

              return (
                <div
                  key={probe.id}
                  className="flex items-center gap-3 px-3 py-2 rounded border border-[var(--noc-border)] bg-[var(--noc-bg)]"
                >
                  {/* Status dot */}
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{
                      backgroundColor: isConnected ? "var(--noc-green)" : "var(--noc-red)",
                      boxShadow: isConnected
                        ? "0 0 6px var(--noc-green)"
                        : "0 0 6px var(--noc-red)",
                    }}
                  />

                  {/* Probe info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs text-[var(--noc-text)] truncate">
                        {probe.description}
                      </span>
                      <span className="font-mono text-[10px] text-[var(--noc-text-dim)] ml-2 shrink-0">
                        #{probe.id}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      {probe.asn && (
                        <span className="font-mono text-[10px] text-[var(--noc-cyan)]">
                          AS{probe.asn}
                        </span>
                      )}
                      {probe.addressV4 && (
                        <span className="font-mono text-[10px] text-[var(--noc-text-dim)]">
                          {probe.addressV4}
                        </span>
                      )}
                      {hasMeasurements && (probe as ProbeWithMeasurements).pingRtt && (
                        <span className="font-mono text-[10px] text-[var(--noc-amber)]">
                          RTT: {(probe as ProbeWithMeasurements).pingRtt!.avg}ms
                        </span>
                      )}
                      {probe.isAnchor && (
                        <span className="font-mono text-[10px] text-[var(--noc-amber)]">⚓</span>
                      )}
                    </div>
                  </div>

                  {/* Status label */}
                  <span
                    className="font-mono text-[10px] shrink-0 uppercase"
                    style={{ color: isConnected ? "var(--noc-green)" : "var(--noc-red)" }}
                  >
                    {isConnected ? "UP" : "DOWN"}
                  </span>
                </div>
              );
            })}
          </div>
        )}
    </div>
  );
}
