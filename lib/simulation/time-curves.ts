// Icelandic traffic patterns — peak ~20:00-23:00 UTC, trough ~04:00-07:00 UTC
export function getTimeOfDayMultiplier(): number {
  const now = new Date();
  const utcHour = now.getUTCHours() + now.getUTCMinutes() / 60;

  // Sinusoidal curve: peak at 21:00 UTC, trough at 05:00 UTC
  // Range: 0.3 (night) to 1.0 (peak)
  const phase = ((utcHour - 21) / 24) * Math.PI * 2;
  const base = 0.65 + 0.35 * Math.cos(phase);
  return base;
}

// Slight weekly pattern — lower on weekends
export function getWeekdayMultiplier(): number {
  const day = new Date().getUTCDay();
  if (day === 0 || day === 6) return 0.85;
  return 1.0;
}

export function getTrafficMultiplier(): number {
  return getTimeOfDayMultiplier() * getWeekdayMultiplier();
}
