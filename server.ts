import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { errorHandler } from "./src/server/middleware/error.middleware";
import assessmentRoutes from "./src/server/routes/assessment.routes";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Global error logging for Vercel
process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION:", err);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("UNHANDLED REJECTION at:", promise, "reason:", reason);
});

async function startServer() {
  console.log("[server] Starting server initialization...");
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    console.log("[server] Health check requested");
    res.json({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      env: {
        hasSupabaseUrl: !!(process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL),
        hasSupabaseKey: !!(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY),
        hasOpenAIKey: !!process.env.OPENAI_API_KEY,
        nodeEnv: process.env.NODE_ENV,
        isVercel: !!process.env.VERCEL
      }
    });
  });

  console.log("[server] Registering assessment routes...");
  app.use("/api/assessments", assessmentRoutes);

  app.use(errorHandler);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
    console.log("[server] Initializing Vite middleware...");
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: false // Explicitly disable HMR to prevent port conflicts
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("[server] Serving static files from dist...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // Only handle SPA routing if not on Vercel (Vercel handles it via routes in vercel.json)
    if (!process.env.VERCEL) {
      app.get("*", (req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    }
  }

  // Only listen if not running as a serverless function
  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } else {
    console.log("[server] Running in Vercel environment, skipping listen()");
  }
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});

export default app;

