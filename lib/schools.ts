// Government senior high schools in Ghana, used for the compulsory school choice at teacher
// sign-up and to link teachers to their headmaster.
//
// Source: Wikipedia, "List of senior high schools in Ghana" (private, international and nursing
// schools removed). It is NOT complete: it has about 550 of the roughly 720 public SHS, and is
// thin for Savannah, Western North and North East. Add missing schools to the END of
// lib/schools.json (adding at the end keeps existing headmaster codes unchanged).
export type School = { id: string; name: string; region: string; town: string };

/** Loads the list only when it is needed, so it is not part of every page download. */
export async function loadSchools(): Promise<School[]> {
  const mod = await import("./schools.json");
  return ((mod as any).default || mod) as School[];
}

const words = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter(Boolean);

/** Schools whose name or town contains every word typed, best matches first. */
export function searchSchools(all: School[], query: string, limit = 8): School[] {
  const q = words(query);
  if (!q.length) return [];
  const scored: [number, School][] = [];
  for (const s of all) {
    const name = s.name.toLowerCase(), hay = `${name} ${s.town.toLowerCase()}`;
    if (!q.every((w) => hay.includes(w))) continue;
    scored.push([name.startsWith(q[0]) ? 0 : name.includes(" " + q[0]) ? 1 : 2, s]);
  }
  return scored.sort((a, b) => a[0] - b[0] || a[1].name.localeCompare(b[1].name)).slice(0, limit).map((x) => x[1]);
}
