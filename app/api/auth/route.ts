import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { COOKIE_NAME, COOKIE_MAX_AGE } from "@/lib/constants";

export async function POST(request: NextRequest) {
  const { password } = await request.json();

  const hash = process.env.AUTH_PASSWORD_HASH;
  if (!hash) {
    return NextResponse.json(
      { error: "Server misconfigured" },
      { status: 500 }
    );
  }

  const valid = await bcrypt.compare(password, hash);
  if (!valid) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const tokenValue = `authenticated:${Date.now()}`;

  const response = NextResponse.json({ success: true });
  response.cookies.set(COOKIE_NAME, tokenValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });

  return response;
}
