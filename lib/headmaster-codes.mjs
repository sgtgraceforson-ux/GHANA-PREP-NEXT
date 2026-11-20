// Headmaster codes: one per school, in the form ABC-1234
// (the first 3 letters of the school name + 4 digits).
//
// SERVER-SIDE ONLY. The digits come from HEADMASTER_CODE_SECRET, so the codes are never stored in
// the repository or sent to the browser: anyone without the secret cannot work them out.
// The same file is used by the sign-in API route and by scripts/headmaster-codes.mjs, which
// prints the list for the app owner to hand out.
//
// Keeping codes stable: a school's code depends only on its id and the secret. If you add
// schools to lib/schools.json, add them at the end so no existing code can shift.
// Changing the secret changes EVERY code.
import { createHmac } from "node:crypto";

/** First three letters of the school name, e.g. "St. John's School" -> "STJ". */
export function prefixFor(name) {
  const letters = String(name).normalize("NFKD").replace(/[^A-Za-z]/g, "").toUpperCase();
  return (letters + "XXX").slice(0, 3);
}

/** "abc 1234", "ABC1234", "abc-1234" -> "ABC-1234"; anything else -> null */
export function normalizeHeadCode(raw) {
  const c = String(raw || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  return /^[A-Z]{3}\d{4}$/.test(c) ? `${c.slice(0, 3)}-${c.slice(3)}` : null;
}

/**
 * Builds every school's code. Returns { byCode: Map<code, school>, bySchool: Map<schoolId, code> }.
 * Codes are unique across all schools: on the rare clash the later school gets the next variant.
 */
export function buildHeadCodes(schools, secret) {
  if (!secret) throw new Error("HEADMASTER_CODE_SECRET is not set");
  const byCode = new Map(), bySchool = new Map();
  for (const s of schools) {
    const prefix = prefixFor(s.name);
    for (let n = 0; n < 1000; n++) {
      const h = createHmac("sha256", secret).update(`${s.id}:${n}`).digest();
      const code = `${prefix}-${String(h.readUInt32BE(0) % 10000).padStart(4, "0")}`;
      if (!byCode.has(code)) { byCode.set(code, s); bySchool.set(s.id, code); break; }
    }
  }
  return { byCode, bySchool };
}
