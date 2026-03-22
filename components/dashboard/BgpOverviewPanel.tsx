"use client";

import { useEffect, useState } from "react";
import type { IcelandBgpOverview } from "@/lib/api/types";

function visColor(pct: number): string {
  if (pct >= 80) return "var(--noc-green)";
  if (pct >= 50) return "var(--noc-amber)";
  return "var(--noc-red)";
}

export function BgpOverviewPanel() {
  const [data, setData] = useState<IcelandBgpOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchData() {
      try {
        const res = await fetch("/api/ripestat/bgp-overview");
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
    const id = setInterval(fetchData, 600000); // 10 min
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  return (
    <div className="px-4">
      <div className="bg-[var(--noc-surface)] border border-[var(--noc-border)] rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-mono text-xs tracking-[0.2em] text-[var(--noc-text-dim)] uppercase">
            BGP Yfirlit Íslands
          </h2>
          {data && (
            <span className="font-mono text-[10px] text-[var(--noc-text-dim)]">
              {data.keyAsns.length} lykil-kerfi
            </span>
          )}
        </div>

        {loading && (
          <div className="text-center py-4 font-mono text-xs text-[var(--noc-text-dim)]">
            Sæki BGP gögn...
          </div>
        )}

        {error && (
          <div className="text-center py-4 font-mono text-xs text-[var(--noc-red)]">
            Villa: {error}
          </div>
        )}

        {data && !loading && !error && (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="text-center py-2 rounded border border-[var(--noc-border)] bg-[var(--noc-bg)]">
                <div className="font-mono text-lg font-bold text-[var(--noc-cyan)]">
                  {data.totalAsns}
                </div>
                <div className="font-mono text-[9px] text-[var(--noc-text-dim)] uppercase tracking-wider">
                  ASN
                </div>
              </div>
              <div className="text-center py-2 rounded border border-[var(--noc-border)] bg-[var(--noc-bg)]">
                <div className="font-mono text-lg font-bold text-[var(--noc-amber)]">
                  {data.totalIpv4Prefixes}
                </div>
                <div className="font-mono text-[9px] text-[var(--noc-text-dim)] uppercase tracking-wider">
                  IPv4 forskeyti
                </div>
              </div>
              <div className="text-center py-2 rounded border border-[var(--noc-border)] bg-[var(--noc-bg)]">
                <div className="font-mono text-lg font-bold text-[var(--noc-green)]">
                  {data.totalIpv6Prefixes}
                </div>
                <div className="font-mono text-[9px] text-[var(--noc-text-dim)] uppercase tracking-wider">
                  IPv6 forskeyti
                </div>
              </div>
            </div>

            {/* Key ASN table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-[var(--noc-border)]">
                    <th className="font-mono text-[10px] text-[var(--noc-text-dim)] pb-2 pr-2">ASN</th>
                    <th className="font-mono text-[10px] text-[var(--noc-text-dim)] pb-2 pr-2">Nafn</th>
                    <th className="font-mono text-[10px] text-[var(--noc-text-dim)] pb-2 pr-1 text-right">v4</th>
                    <th className="font-mono text-[10px] text-[var(--noc-text-dim)] pb-2 pr-1 text-right">v6</th>
                    <th className="font-mono text-[10px] text-[var(--noc-text-dim)] pb-2 pr-2 text-right">Nágrannar</th>
                    <th className="font-mono text-[10px] text-[var(--noc-text-dim)] pb-2 text-right">Sýnileiki</th>
                  </tr>
                </thead>
                <tbody>
                  {data.keyAsns.map((a) => (
                    <tr
                      key={a.asn}
                      className="border-b border-[var(--noc-border)] border-opacity-30"
                    >
                      <td className="font-mono text-[10px] text-[var(--noc-cyan)] py-1.5 pr-2">
                        {a.asn}
                      </td>
                      <td className="font-mono text-xs text-[var(--noc-text)] py-1.5 pr-2 truncate max-w-[180px]">
                        {a.name}
                      </td>
                      <td className="font-mono text-[10px] text-[var(--noc-text)] py-1.5 pr-1 text-right">
                        {a.prefixesV4}
                      </td>
                      <td className="font-mono text-[10px] text-[var(--noc-text)] py-1.5 pr-1 text-right">
                        {a.prefixesV6}
                      </td>
                      <td className="font-mono text-[10px] text-[var(--noc-amber)] py-1.5 pr-2 text-right">
                        {a.neighbors}
                      </td>
                      <td className="py-1.5">
                        <div className="flex items-center justify-end gap-1.5">
                          <div className="w-16 h-2 bg-[var(--noc-bg)] rounded-sm overflow-hidden">
                            <div
                              className="h-full rounded-sm"
                              style={{
                                width: `${a.visibilityV4}%`,
                                backgroundColor: visColor(a.visibilityV4),
                                opacity: 0.7,
                              }}
                            />
                          </div>
                          <span
                            className="font-mono text-[10px] w-8 text-right"
                            style={{ color: visColor(a.visibilityV4) }}
                          >
                            {a.visibilityV4}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
