import express, { Request, Response } from "express";
import "dotenv/config";
import { auth } from "./lib/auth";
import { toNodeHandler, fromNodeHeaders } from "better-auth/node";
import cors from "cors";
import { setupSwagger } from "./lib/swagger";

const app = express();
const PORT = process.env.PORT || 3000;

// CORS — sebelum semua middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  }),
);

// Better Auth handler — sebelum express.json()
app.all("/api/auth/*splat", toNodeHandler(auth));

// Body parser
app.use(express.json());

// Setup Swagger UI (/api-docs)
setupSwagger(app);

// Route /
app.get("/", (_req: Request, res: Response) => {
  res.send("Hello, TypeScript with Express!");
});

// Route /api/me (Protected route)
app.get("/api/me", async (req: Request, res: Response) => {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });
  if (!session) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  res.json(session);
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Swagger Docs available at http://localhost:${PORT}/api-docs`);
});
