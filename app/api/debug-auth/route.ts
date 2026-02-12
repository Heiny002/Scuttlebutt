import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  const { password } = await request.json();

  const hash = process.env.AUTH_PASSWORD_HASH;
  const testHash = process.env.TEST_PASSWORD_HASH;

  const diagnostics: Record<string, unknown> = {
    AUTH_PASSWORD_HASH_exists: !!hash,
    AUTH_PASSWORD_HASH_length: hash?.length ?? 0,
    AUTH_PASSWORD_HASH_prefix: hash?.substring(0, 7) ?? "MISSING",
    TEST_PASSWORD_HASH_exists: !!testHash,
    TEST_PASSWORD_HASH_length: testHash?.length ?? 0,
    TEST_PASSWORD_HASH_prefix: testHash?.substring(0, 7) ?? "MISSING",
    password_received: password,
    password_length: password?.length ?? 0,
  };

  if (hash) {
    diagnostics.auth_match = await bcrypt.compare(password, hash);
  }
  if (testHash) {
    diagnostics.test_match = await bcrypt.compare(password, testHash);
  }

  // Also test a known-good hash inline to verify bcrypt itself works
  const inlineHash = await bcrypt.hash("REDBIRD", 10);
  diagnostics.inline_hash_match = await bcrypt.compare("REDBIRD", inlineHash);
  diagnostics.inline_hash_example = inlineHash;

  return NextResponse.json(diagnostics);
}

export async function GET() {
  const hash = process.env.AUTH_PASSWORD_HASH;
  const testHash = process.env.TEST_PASSWORD_HASH;

  return NextResponse.json({
    AUTH_PASSWORD_HASH_exists: !!hash,
    AUTH_PASSWORD_HASH_length: hash?.length ?? 0,
    AUTH_PASSWORD_HASH_prefix: hash?.substring(0, 7) ?? "MISSING",
    TEST_PASSWORD_HASH_exists: !!testHash,
    TEST_PASSWORD_HASH_length: testHash?.length ?? 0,
    TEST_PASSWORD_HASH_prefix: testHash?.substring(0, 7) ?? "MISSING",
    node_env: process.env.NODE_ENV,
  });
}
