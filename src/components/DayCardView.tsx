import type { DayCard } from "../core/types";

/** Stimmung 1 bis 5 bestimmt den Farbverlauf der Karte. */
const moodGradients: Record<number, [string, string]> = {
  1: ["#3d3a4a", "#1c2a33"],
  2: ["#6b5240", "#2d3b35"],
  3: ["#4f7a62", "#1f4a48"],
  4: ["#2fa89a", "#2d6a4f"],
  5: ["#d2ae7e", "#2fa89a"],
};

const fmtMin = (m: number) => (m >= 60 ? `${Math.floor(m / 60)} h ${m % 60} min` : `${m} min`);
const fmtEuro = (c: number) => (c / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" });

export function DayCardView({ card }: { card: DayCard }) {
  const [c1, c2] = moodGradients[Math.round(card.mood ?? 3)] ?? moodGradients[3];
  const date = new Date(card.date + "T12:00:00");
  const cells: { v: string; l: string }[] = [];
  if (card.steps != null) cells.push({ v: card.steps.toLocaleString("de-DE"), l: "Schritte" });
  if (card.wakeUp) cells.push({ v: card.wakeUp, l: "Aufgestanden" });
  if (card.bedtime) cells.push({ v: card.bedtime, l: "Schlafen gegangen" });
  if (card.screenTimeMinutes != null) cells.push({ v: fmtMin(card.screenTimeMinutes), l: "Bildschirmzeit" });
  if (card.spentCents != null) cells.push({ v: fmtEuro(card.spentCents), l: "Ausgegeben" });
  if (card.transitMinutes != null) cells.push({ v: fmtMin(card.transitMinutes), l: "In der Bahn" });
  if (card.routeKm != null) cells.push({ v: `${card.routeKm.toLocaleString("de-DE")} km`, l: "Unterwegs" });
  if (card.habitsTotal) cells.push({ v: `${card.habitsDone ?? 0} von ${card.habitsTotal}`, l: "Gewohnheiten" });

  return (
    <article className="daycard" style={{ "--c1": c1, "--c2": c2 } as React.CSSProperties}>
      <div className="eyebrow" style={{ color: "rgba(255,255,255,.7)", position: "relative" }}>
        {date.toLocaleDateString("de-DE", { weekday: "long" })}
      </div>
      <h3>{date.toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" })}</h3>
      {card.moodTags && card.moodTags.length > 0 && <div className="sub">{card.moodTags.join(" · ")}</div>}
      <div className="dc-grid">
        {cells.map((c) => (
          <div className="dc-cell" key={c.l}>
            <b>{c.v}</b>
            <small>{c.l}</small>
          </div>
        ))}
      </div>
      {card.demo && <span className="dc-badge">Beispieldaten</span>}
    </article>
  );
}

export const demoCard: DayCard = {
  date: new Date().toISOString().slice(0, 10),
  steps: 8421,
  wakeUp: "07:12",
  bedtime: "23:40",
  screenTimeMinutes: 187,
  spentCents: 2350,
  mood: 4,
  moodTags: ["ruhig", "zufrieden"],
  transitMinutes: 46,
  routeKm: 11.4,
  habitsDone: 3,
  habitsTotal: 5,
  demo: true,
};
