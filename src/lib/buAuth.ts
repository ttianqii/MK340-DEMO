// Authenticates BU student credentials against the university's own student
// portal.
//
//   Student:   POST https://ursa.bu.ac.th/Account/BUAuthenticate
//              ASP.NET MVC with anti-CSRF: GET the page first to read the hidden
//              `__RequestVerificationToken` field AND the matching
//              `__RequestVerificationToken` cookie, then replay both in the POST.
//              Both success and failure 302-redirect to "/", so we follow the
//              redirect carrying the response cookies and decide based on whether
//              the login form (the Password field) is still shown.
//
// This success heuristic was verified against the live endpoint with invalid
// credentials. If BU changes its responses, revisit `studentSucceeded`.

const STUDENT_URL = "https://ursa.bu.ac.th/Account/BUAuthenticate";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

export interface AuthResult {
  ok: boolean;
  ursaCookies?: string; // student URSA (ursa.bu.ac.th) session cookies
}

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

function isRedirect(status: number): boolean {
  return status === 301 || status === 302 || status === 303 || status === 307 || status === 308;
}

async function safeText(res: Response): Promise<string> {
  try {
    return await res.text();
  } catch {
    return "";
  }
}

async function studentSucceeded(loginRes: Response, jar: Map<string, string>): Promise<boolean> {
  // Both outcomes redirect to "/". Follow the chain carrying our cookies, then
  // inspect the landing page: if it still renders the login form (Password
  // field), authentication failed; otherwise we reached an authenticated page.
  let res = loginRes;
  let body = await safeText(res);

  for (let hops = 0; isRedirect(res.status) && hops < 4; hops++) {
    const location = res.headers.get("location");
    if (!location) break;
    const nextUrl = new URL(location, STUDENT_URL).toString();
    res = await fetch(nextUrl, {
      method: "GET",
      headers: { "User-Agent": USER_AGENT, Cookie: serializeJar(jar) },
      redirect: "manual",
    });
    addToJar(jar, getSetCookies(res));
    body = await safeText(res);
  }

  return !/name="Password"/i.test(body);
}

/** Authenticate a BU student against the URSA portal. */
export async function authenticate(username: string, password: string): Promise<AuthResult> {
  try {
    // 1. GET the login page to obtain the anti-forgery cookie + hidden token.
    const pageRes = await fetch(STUDENT_URL, {
      method: "GET",
      headers: { "User-Agent": USER_AGENT },
      redirect: "manual",
    });
    const html = await pageRes.text();

    const jar = new Map<string, string>();
    addToJar(jar, getSetCookies(pageRes));

    const tokenCookie = jar.get("__RequestVerificationToken");
    const tokenField = html.match(
      /name="__RequestVerificationToken"[^>]*value="([^"]+)"/i
    )?.[1];

    if (!tokenCookie || !tokenField) {
      // Page layout changed — we can't authenticate safely.
      return { ok: false };
    }

    // 2. POST the credentials with the hidden token in the body and all GET cookies.
    const loginRes = await fetch(STUDENT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": USER_AGENT,
        Cookie: serializeJar(jar),
        Referer: STUDENT_URL,
      },
      body: new URLSearchParams({
        __RequestVerificationToken: tokenField,
        UserName: username,
        Password: password,
      }),
      redirect: "manual",
    });
    addToJar(jar, getSetCookies(loginRes));

    const ok = await studentSucceeded(loginRes, jar);
    return { ok, ursaCookies: ok ? serializeJar(jar) : undefined };
  } catch (err) {
    console.error("Student auth error:", err);
    return { ok: false };
  }
}
