export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs" && process.env.E2E_MOCK_GITHUB === "1") {
    const { server } = await import("./mocks/server");
    server.listen({ onUnhandledRequest: "error" });
  }
}
