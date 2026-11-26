import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ ok: true, count: 1337 });
}

export async function POST() {
  return NextResponse.json({ ok: true, count: 1337 });
}
