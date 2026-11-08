import { NextResponse } from "next/server";
import { listAvailableCities } from "@/lib/search/source";

export const runtime = "nodejs";

// Cidades com imóvel realmente publicado. Falha => lista vazia (a UI segue sem inventar cidades).
export async function GET() {
  const cities = await listAvailableCities().catch(() => [] as string[]);
  return NextResponse.json({ cities }, { headers: { "cache-control": "public, s-maxage=60, stale-while-revalidate=300" } });
}
