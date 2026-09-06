import { NextResponse } from "next/server";
import { AuthorizationError } from "./authorize-installation";
import { EmptyRepositoryError } from "./add-toolkit";

export function errorResponse(err: unknown, fallbackMessage: string): NextResponse {
  if (err instanceof AuthorizationError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  if (err instanceof EmptyRepositoryError) {
    return NextResponse.json({ error: err.message }, { status: 422 });
  }
  console.error(fallbackMessage, err);
  return NextResponse.json({ error: fallbackMessage }, { status: 502 });
}
