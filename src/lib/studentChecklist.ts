// Authenticates BU students against the Graduation Check List system
// (studentchecklist.bu.ac.th) and reads their study plan / course checklist.
//
// Auth flow (ASP.NET Core):
//   1. GET  /Home/Login          — establishes the initial session + load-balancer
//                                   affinity cookies.
//   2. POST /Home/UserLogin      — `username` + `userpassword`, sent as an AJAX
//                                   request. Returns JSON:
//                                     { issuccess: true,  returnurl: "/Home/Index?url=<token>" }
//                                     { issuccess: false, msg: "..." }
//                                   On success the `.AspNetCore.Cookies` auth cookie
//                                   is set; the `url` token identifies the student.
//
// The checklist itself lives at /Home/CourseDetail?url=<token>, which we fetch
// server-side with the captured cookies and parse into structured data.

const BASE = "https://studentchecklist.bu.ac.th";
const LOGIN_PAGE = `${BASE}/Home/Login`;
const LOGIN_POST = `${BASE}/Home/UserLogin`;

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

export interface AuthResult {
  ok: boolean;
  message?: string;
  cookies?: string;
  url?: string;
}

export interface Course {
  code: string;
  name: string;
  credit: string;
  grade: string;
  note: string;
}

export interface CourseGroup {
  group: string;
  courses: Course[];
}

export interface Category {
  category: string;
  creditEarned: number | null;
  creditRequired: number | null;
  groups: CourseGroup[];
}

export interface InfoItem {
  label: string;
  value: string;
}

export interface StudentInfo {
  nameTh: string;
  nameEn: string;
  studentId: string;
  photo: string;
  info: InfoItem[];
  gpa: string;
  totalCredits: string;
  creditsEarned: string;
  creditsTransferred: string;
}

export interface Checklist {
  student: StudentInfo;
  categories: Category[];
}

export type ChecklistResult =
  | { ok: true; checklist: Checklist }
  | { ok: false; expired: boolean };

/** Read every Set-Cookie line from a fetch Response in a runtime-portable way. */
function getSetCookies(res: Response): string[] {
  const anyHeaders = res.headers as unknown as { getSetCookie?: () => string[] };
  if (typeof anyHeaders.getSetCookie === "function") return anyHeaders.getSetCookie();
  const single = res.headers.get("set-cookie");
  return single ? [single] : [];
}

/** Add Set-Cookie lines to a name->value cookie jar (later values win). */
function addToJar(jar: Map<string, string>, setCookies: string[]): void {
  for (const line of setCookies) {
    const pair = line.split(";")[0];
    const eq = pair.indexOf("=");
    if (eq > 0) jar.set(pair.slice(0, eq).trim(), pair.slice(eq + 1));
  }
}

function serializeJar(jar: Map<string, string>): string {
  return Array.from(jar, ([k, v]) => `${k}=${v}`).join("; ");
}

/** Authenticate a BU student against the checklist system. */
export async function authenticate(username: string, password: string): Promise<AuthResult> {
  try {
    const jar = new Map<string, string>();

    // 1. GET the login page to establish the initial cookies.
    const page = await fetch(LOGIN_PAGE, {
      method: "GET",
      headers: { "User-Agent": USER_AGENT },
      redirect: "manual",
    });
    addToJar(jar, getSetCookies(page));

    // 2. POST the credentials as an AJAX request.
    const res = await fetch(LOGIN_POST, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": USER_AGENT,
        "X-Requested-With": "XMLHttpRequest",
        Cookie: serializeJar(jar),
        Referer: LOGIN_PAGE,
        Origin: BASE,
      },
      body: new URLSearchParams({ username, userpassword: password }),
      redirect: "manual",
    });
    addToJar(jar, getSetCookies(res));

    let data: { issuccess?: boolean; returnurl?: string; msg?: string } = {};
    try {
      data = await res.json();
    } catch {
      return { ok: false, message: "Unexpected response from the checklist server." };
    }

    if (!data.issuccess) {
      return { ok: false, message: data.msg || "Invalid username or password." };
    }

    const url = extractUrlToken(data.returnurl || "");
    if (!url) {
      return { ok: false, message: "Could not resolve your student record." };
    }

    return { ok: true, cookies: serializeJar(jar), url };
  } catch (err) {
    console.error("Checklist auth error:", err);
    return { ok: false, message: "Login failed. Please try again." };
  }
}

function extractUrlToken(returnUrl: string): string | undefined {
  return returnUrl.match(/[?&]url=([^&]+)/)?.[1];
}

/** Fetch and parse the student's course checklist. */
export async function fetchChecklist(cookies: string, url: string): Promise<ChecklistResult> {
  const res = await fetch(`${BASE}/Home/CourseDetail?url=${encodeURIComponent(url)}`, {
    method: "GET",
    headers: { "User-Agent": USER_AGENT, Cookie: cookies },
    redirect: "follow",
  });
  const html = await res.text();

  // A bounced (expired) session lands back on the login form.
  if (res.url.includes("/Home/Login") || /id="myform"/.test(html)) {
    return { ok: false, expired: true };
  }

  return { ok: true, checklist: parseChecklist(html) };
}

// --- HTML parsing (no DOM available on the server) ---------------------------

function decodeEntities(s: string): string {
  return s
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function stripTags(s: string): string {
  return decodeEntities(s.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

export function parseChecklist(html: string): Checklist {
  return { student: parseStudent(html), categories: parseCategories(html) };
}

function parseStudent(html: string): StudentInfo {
  const nameTh = stripTags(html.match(/<h5 class="text-primary mb-2">([\s\S]*?)<\/h5>/)?.[1] || "");
  const studentId = html.match(/<h5 class="text-muted font-size-14[^"]*">([\s\S]*?)<\/h5>/)?.[1]?.trim() || "";
  // Upgrade http→https so the avatar isn't blocked as mixed content in production.
  const photo = (html.match(/<img[^>]+src="([^"]+)"[^>]*avatar/i)?.[1] || "").replace(/^http:\/\//, "https://");
  const nameEn = stripTags(html.match(/\b(MR\.|MS\.|MISS|MRS\.)[^<]+/i)?.[0] || "");

  const info: InfoItem[] = [];
  const re = /<p[^>]*>([\s\S]*?):\s*<\/p>\s*<h5[^>]*>([\s\S]*?)<\/h5>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const label = stripTags(m[1]);
    const value = stripTags(m[2]);
    if (label) info.push({ label, value });
  }

  const find = (kw: string) => info.find((i) => i.label.includes(kw))?.value || "";
  return {
    nameTh,
    nameEn,
    studentId,
    photo,
    info,
    gpa: find("เกรดเฉลี่ยสะสม"),
    totalCredits: find("หน่วยกิตสำเร็จการศึกษา"),
    creditsEarned: find("หน่วยกิตที่เรียนได้"),
    creditsTransferred: find("เทียบโอน"),
  };
}

function parseCategories(html: string): Category[] {
  const tbody = html.match(/<tbody>([\s\S]*?)<\/tbody>/)?.[1] || "";
  const rows = tbody.match(/<tr\b[^>]*>[\s\S]*?<\/tr>/g) || [];
  const categories: Category[] = [];

  for (const tr of rows) {
    const cells = Array.from(tr.matchAll(/<td\b([^>]*)>([\s\S]*?)<\/td>/g), (c) => ({
      attrs: c[1],
      text: stripTags(c[2]),
    }));
    if (cells.length === 0) continue;

    const firstText = cells.find((c) => c.text)?.text || "";

    // Category header: a bold, dark cell like "…(Credit earned:27/30)".
    if (cells.some((c) => c.attrs.includes("fw-semibold") && c.attrs.includes("text-dark"))) {
      const earned = firstText.match(/Credit earned:\s*(\d+)\s*\/\s*(\d+)/i);
      categories.push({
        category: firstText,
        creditEarned: earned ? Number(earned[1]) : null,
        creditRequired: earned ? Number(earned[2]) : null,
        groups: [],
      });
      continue;
    }

    // Sub-group header: a bold (underlined) cell, e.g. "…ภาษาอังกฤษ (9 หน่วยกิต)".
    if (cells.some((c) => c.attrs.includes("fw-semibold")) && /<u\b/.test(tr)) {
      if (categories.length === 0) categories.push(blankCategory());
      categories[categories.length - 1].groups.push({ group: firstText, courses: [] });
      continue;
    }

    // Course row: first cell is a course code (e.g. EN101, CS250).
    const code = cells[0]?.text || "";
    if (cells.length >= 4 && /^[A-Z]{2,3}\d/.test(code)) {
      if (categories.length === 0) categories.push(blankCategory());
      const cat = categories[categories.length - 1];
      if (cat.groups.length === 0) cat.groups.push({ group: "-", courses: [] });
      cat.groups[cat.groups.length - 1].courses.push({
        code: code.trim(),
        name: cells[1]?.text || "",
        credit: cells[2]?.text || "",
        grade: cells[3]?.text || "",
        note: cells[4]?.text || "",
      });
    }
  }

  return categories;
}

function blankCategory(): Category {
  return { category: "-", creditEarned: null, creditRequired: null, groups: [] };
}
