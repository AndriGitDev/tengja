"use client";

import { useEffect, useState } from "react";
import type { RixSummary } from "@/lib/api/types";

export function IxpPeeringPanel() {
  const [data, setData] = useState<RixSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchData() {
      try {
        const res = await fetch("/api/peeringdb/rix");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (mounted) {
          setData(json);
          setLoading(false);
        }
      } catch (e) {
        if (mounted) {
          setError(e instanceof Error ? e.message : "Villa");
          setLoading(false);
        }
      }
    }

    fetchData();
    const id = setInterval(fetchData, 300000); // 5 min
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  return (
    <div className="bg-[var(--noc-surface)] border border-[var(--noc-border)] rounded-lg p-4 flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-mono text-xs tracking-[0.2em] text-[var(--noc-text-dim)] uppercase">
          RIX Jafningjar
        </h2>
        {data && (
          <div className="flex items-center gap-4">
            <span className="font-mono text-[10px] text-[var(--noc-cyan)]">
              {data.uniqueAsnCount} ASN
            </span>
            <span className="font-mono text-[10px] text-[var(--noc-amber)]">
              {data.totalCapacityGbps} Gbps
            </span>
            <span className="font-mono text-[10px] text-[var(--noc-text-dim)]">
              {data.totalPortCount} tengi
            </span>
          </div>
        )}
      </div>

      {loading && (
        <div className="text-center py-8 font-mono text-xs text-[var(--noc-text-dim)]">
          Sæki PeeringDB gögn...
        </div>
      )}

      {error && (
        <div className="text-center py-8 font-mono text-xs text-[var(--noc-red)]">
          Villa: {error}
        </div>
      )}

      {data && !loading && !error && (
        <div className="overflow-y-auto max-h-[320px] -mx-1 px-1">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-[var(--noc-border)]">
                <th className="font-mono text-[10px] text-[var(--noc-text-dim)] pb-2 pr-2">ASN</th>
                <th className="font-mono text-[10px] text-[var(--noc-text-dim)] pb-2 pr-2">Nafn</th>
                <th className="font-mono text-[10px] text-[var(--noc-text-dim)] pb-2 pr-2 text-right">Hraði</th>
                <th className="font-mono text-[10px] text-[var(--noc-text-dim)] pb-2 text-center">IP</th>
              </tr>
            </thead>
            <tbody>
              {data.members.map((m) => (
                <tr
                  key={m.asn}
                  className="border-b border-[var(--noc-border)] border-opacity-30"
                >
                  <td className="font-mono text-[10px] text-[var(--noc-cyan)] py-1.5 pr-2">
                    {m.asn}
                  </td>
                  <td className="font-mono text-xs text-[var(--noc-text)] py-1.5 pr-2 truncate max-w-[160px]">
                    {m.name}
                  </td>
                  <td className="font-mono text-[10px] text-[var(--noc-amber)] py-1.5 pr-2 text-right whitespace-nowrap">
                    {m.speedLabel}
                  </td>
                  <td className="py-1.5 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {m.hasIpv4 && (
                        <span className="font-mono text-[9px] px-1 py-0.5 rounded bg-[var(--noc-cyan)] bg-opacity-15 text-[var(--noc-cyan)]">
                          v4
                        </span>
                      )}
                      {m.hasIpv6 && (
                        <span className="font-mono text-[9px] px-1 py-0.5 rounded bg-[var(--noc-green)] bg-opacity-15 text-[var(--noc-green)]">
                          v6
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
