import { setupServer } from "msw/node";
import { handlers } from "./github-handlers";

export const server = setupServer(...handlers);
