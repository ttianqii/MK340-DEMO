import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@/lib/buAuth";
import { encryptValue } from "@/lib/serverCrypto";
import { signSession, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/session";

export const dynamic = "force-dynamic";

function loginResponse(redirectTo: string, token: string) {
  const response = NextResponse.json({ ok: true, role: "student", redirectTo });
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return response;
}

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (typeof username !== "string" || typeof password !== "string" || !username || !password) {
      return NextResponse.json({ message: "Username and password are required." }, { status: 400 });
    }

    const uname = username.trim();
    const result = await authenticate(uname, password);

    if (!result.ok) {
      return NextResponse.json({ message: "Invalid BU username or password." }, { status: 401 });
    }

    const ursa = result.ursaCookies ? encryptValue(result.ursaCookies) : undefined;
    const token = await signSession(uname, { ursa });
    return loginResponse("/dashboard", token);
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ message: "Login failed. Please try again." }, { status: 500 });
  }
}
