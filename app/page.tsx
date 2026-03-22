"use client";

import { Header } from "@/components/dashboard/Header";
import { CableCards } from "@/components/dashboard/CableCards";
import { NetworkDiagram } from "@/components/dashboard/NetworkDiagram";
import { ProbePanel } from "@/components/dashboard/ProbePanel";
import { TrafficChart } from "@/components/dashboard/TrafficChart";
import { GlobalStats } from "@/components/dashboard/GlobalStats";

export default function Home() {
  return (
    <main className="min-h-screen bg-[var(--noc-bg)]">
      <Header />
      <div className="flex flex-col gap-4 py-4 max-w-[1400px] mx-auto">
        <CableCards />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <NetworkDiagram />
          <TrafficChart />
        </div>
        <ProbePanel />
        <GlobalStats />
      </div>
    </main>
  );
}
