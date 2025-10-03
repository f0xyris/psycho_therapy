import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createServer() {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

  return app;
}

if (process.argv[1].includes('index.ts')) {
  (async () => {
    try {
      
      
      const app = createServer();
              const server = await registerRoutes(app);

      app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
        const status = err.status || err.statusCode || 500;
        const message = err.message || "Internal Server Error";

        console.error('Server error:', err);
        res.status(status).json({ message });
      });

      if (app.get("env") === "development") {
        await setupVite(app, server);
      } else {
        serveStatic(app);
      }

      const port = parseInt(process.env.PORT || '5000', 10);
      
      server.listen(port, "127.0.0.1", () => {
        log(`🚀 Server started successfully on port ${port}`);
        log(`🌍 Environment: ${app.get("env")}`);
        log(`🔌 WebSocket HMR: ${app.get("env") === "development" ? "enabled" : "disabled"}`);
        log(`📱 Local URL: http://localhost:${port}`);
      });

      server.on('error', (error: any) => {
        console.error('❌ Server error:', error);
        if (error.code === 'EADDRINUSE') {
          console.error(`🚫 Port ${port} is already in use. Please try a different port.`);
        }
      });

      process.on('SIGTERM', () => {
        log('🛑 SIGTERM received, shutting down gracefully');
        server.close(() => {
          log('✅ Server closed');
          process.exit(0);
        });
      });

      process.on('SIGINT', () => {
        log('🛑 SIGINT received, shutting down gracefully');
        server.close(() => {
          log('✅ Server closed');
          process.exit(0);
        });
      });

    } catch (error) {
      console.error('❌ Failed to start server:', error);
      process.exit(1);
    }
  })();
}
