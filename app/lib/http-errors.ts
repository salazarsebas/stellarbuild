import { NextResponse } from "next/server";
import { AuthorizationError } from "./authorize-installation";

export function errorResponse(err: unknown, fallbackMessage: string): NextResponse {
  if (err instanceof AuthorizationError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  console.error(fallbackMessage, err);
  return NextResponse.json({ error: fallbackMessage }, { status: 502 });
}
