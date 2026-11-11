// Teacher accounts: separate from student accounts. Demo/local mode (localStorage).
// Real protection needs server-side auth (e.g. Supabase) with roles checked on the server.
export const REGIONS = [
  "Ahafo", "Ashanti", "Bono", "Bono East", "Central", "Eastern", "Greater Accra", "North East",
  "Northern", "Oti", "Savannah", "Upper East", "Upper West", "Volta", "Western", "Western North",
];

const ACCOUNTS = "gp_teachers_v1";   // { [email]: account }
const SESSION = "gp_teacher_session"; // { email }
const COOKIE = "gp_role";             // read by middleware.ts

export type Teacher = { fullName: string; email: string; phone: string; school: string; region: string };

const read = (k: string, d: any) => { try { return JSON.parse(localStorage.getItem(k) || "null") ?? d; } catch { return d; } };
const hex = (b: ArrayBuffer | Uint8Array) => Array.from(new Uint8Array(b as any)).map((x) => x.toString(16).padStart(2, "0")).join("");

async function hashPassword(password: string, salt: string) {
  if (!crypto?.subtle) throw new Error("Secure connection (https) required.");
  return hex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(salt + password)));
}

export const normalizePhone = (raw: string) => {
  let d = raw.replace(/\D/g, "");
  if (d.startsWith("233")) d = "0" + d.slice(3);
  return d;
};

export function setRoleCookie() {
  try { document.cookie = `${COOKIE}=teacher; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`; } catch {}
}
export function clearRoleCookie() {
  try { document.cookie = `${COOKIE}=; path=/; max-age=0; SameSite=Lax`; } catch {}
}

export function getTeacher(): Teacher | null {
  const s = read(SESSION, null);
  const a = s ? read(ACCOUNTS, {})[String(s.email).toLowerCase()] : null;
  if (!a) return null;
  const { fullName, email, phone, school, region } = a;
  return { fullName, email, phone, school, region };
}

export function logoutTeacher() {
  localStorage.removeItem(SESSION);
  clearRoleCookie();
}

export async function registerTeacher(d: Teacher & { password: string }) {
  const accounts = read(ACCOUNTS, {});
  const email = d.email.trim().toLowerCase();
  const phone = normalizePhone(d.phone);
  if (accounts[email]) return { ok: false, error: "A teacher account with this email already exists." };
  if (Object.values(accounts).some((a: any) => a.phone === phone)) return { ok: false, error: "A teacher account with this phone number already exists." };
  const salt = hex(crypto.getRandomValues(new Uint8Array(16)));
  accounts[email] = {
    fullName: d.fullName.trim(), email, phone, school: d.school.trim(), region: d.region,
    salt, hash: await hashPassword(d.password, salt), createdAt: Date.now(),
  };
  localStorage.setItem(ACCOUNTS, JSON.stringify(accounts));
  localStorage.setItem(SESSION, JSON.stringify({ email }));
  setRoleCookie();
  return { ok: true };
}

export async function loginTeacher(emailRaw: string, password: string) {
  const email = emailRaw.trim().toLowerCase();
  const a = read(ACCOUNTS, {})[email];
  if (!a || (await hashPassword(password, a.salt)) !== a.hash) return { ok: false, error: "Incorrect email or password." };
  localStorage.setItem(SESSION, JSON.stringify({ email }));
  setRoleCookie();
  return { ok: true };
}
