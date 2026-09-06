import { describe, expect, it } from "vitest";
import { errorResponse } from "@/lib/http-errors";
import { AuthorizationError } from "@/lib/authorize-installation";
import { EmptyRepositoryError } from "@/lib/add-toolkit";

describe("errorResponse", () => {
  it("maps an AuthorizationError to its own status and message", async () => {
    const res = errorResponse(new AuthorizationError("nope", 403), "fallback");
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: "nope" });
  });

  it("maps an EmptyRepositoryError to a 422 with its own message", async () => {
    const res = errorResponse(new EmptyRepositoryError(), "fallback");
    expect(res.status).toBe(422);
    expect((await res.json()).error).toContain("no commits yet");
  });

  it("maps an unknown error to a 502 with the fallback message", async () => {
    const res = errorResponse(new Error("boom"), "upstream failed");
    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ error: "upstream failed" });
  });
});
