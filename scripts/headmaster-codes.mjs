// Prints every school's headmaster code to private/headmaster-codes.csv (kept out of git).
// Run from the project folder:   node scripts/headmaster-codes.mjs
//
// It uses HEADMASTER_CODE_SECRET from .env.local (or the environment). The SAME secret must be
// set on Vercel, otherwise the codes headmasters type will not match the ones on the live site.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { buildHeadCodes } from "../lib/headmaster-codes.mjs";

let secret = process.env.HEADMASTER_CODE_SECRET || "";
if (!secret) {
  try {
    const env = readFileSync(".env.local", "utf8");
    secret = (env.match(/^HEADMASTER_CODE_SECRET=(.*)$/m) || [])[1]?.trim().replace(/^["']|["']$/g, "") || "";
  } catch {}
}
if (!secret) { console.error("HEADMASTER_CODE_SECRET is not set (add it to .env.local)."); process.exit(1); }

const schools = JSON.parse(readFileSync("lib/schools.json", "utf8"));
const { bySchool } = buildHeadCodes(schools, secret);
const q = (v) => `"${String(v).replace(/"/g, '""')}"`;
const rows = [...schools]
  .sort((a, b) => a.region.localeCompare(b.region) || a.name.localeCompare(b.name))
  .map((s) => [s.region, s.name, s.town, bySchool.get(s.id)].map(q).join(","));
mkdirSync("private", { recursive: true });
writeFileSync("private/headmaster-codes.csv", "﻿" + ["Region,School,Town,Headmaster code", ...rows].join("\r\n") + "\r\n");
console.log(`Wrote ${rows.length} codes to private/headmaster-codes.csv`);
