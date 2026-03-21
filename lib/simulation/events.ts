// Micro-events: brief spikes/dips that make metrics feel alive

export interface MicroEvent {
  type: "spike" | "dip";
  magnitude: number; // 0-1 multiplier offset
  duration: number; // ms remaining
  cableId?: string;
}

let activeEvents: MicroEvent[] = [];

export function tickEvents(deltaMs: number): MicroEvent[] {
  // Decay existing events
  activeEvents = activeEvents
    .map((e) => ({ ...e, duration: e.duration - deltaMs }))
    .filter((e) => e.duration > 0);

  // Random chance to spawn new event (~every 30-60 seconds)
  if (Math.random() < deltaMs / 45000) {
    const cables = ["danice", "farice1", "greenland-connect"];
    activeEvents.push({
      type: Math.random() > 0.3 ? "spike" : "dip",
      magnitude: 0.05 + Math.random() * 0.15,
      duration: 3000 + Math.random() * 8000,
      cableId: cables[Math.floor(Math.random() * cables.length)],
    });
  }

  return activeEvents;
}

export function getEventMultiplier(cableId: string): number {
  let mult = 1.0;
  for (const event of activeEvents) {
    if (!event.cableId || event.cableId === cableId) {
      if (event.type === "spike") mult += event.magnitude;
      else mult -= event.magnitude;
    }
  }
  return Math.max(0.5, Math.min(1.5, mult));
}
