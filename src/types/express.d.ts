import { auth } from "../lib/auth";

type SessionType = typeof auth.$Infer.Session;

declare global {
  namespace Express {
    interface Request {
      user?: SessionType["user"];
      session?: SessionType["session"];
    }
  }
}
