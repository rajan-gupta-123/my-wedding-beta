import express, { ErrorRequestHandler } from "express";
import MongoStore from "connect-mongo";
import session from "express-session";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { env } from "./config/env";
import { getMongoClient } from "./db/mongo";
import { authRouter } from "./modules/auth/auth.routes";
import { guestsRouter } from "./modules/guests/guests.routes";

export function createApp() {
  const app = express();
  const clientBuildPath = resolve(__dirname, "../../client/dist");

  app.disable("x-powered-by");
  app.use(express.json({ limit: "16kb" }));
  app.use(
    session({
      name: "wedding.sid",
      secret: env.SESSION_SECRET,
      store: MongoStore.create({
        client: getMongoClient(),
        dbName: env.MONGODB_DATABASE,
        collectionName: "sessions",
        ttl: env.SESSION_TTL_SECONDS,
      }),
      resave: false,
      saveUninitialized: false,
      rolling: true,
      cookie: {
        httpOnly: true,
        sameSite: "lax",
        secure: env.NODE_ENV === "production",
        maxAge: env.SESSION_TTL_SECONDS * 1000,
      },
    }),
  );

  app.use("/api", authRouter);
  app.use("/api/guests", guestsRouter);
  app.get("/api/health", (_request, response) => {
    response.status(200).json({ status: "ok" });
  });

  if (existsSync(clientBuildPath)) {
    app.use(express.static(clientBuildPath));
    app.get(/.*/, (request, response, next) => {
      if (request.path.startsWith("/api")) {
        next();
        return;
      }
      response.sendFile(resolve(clientBuildPath, "index.html"));
    });
  }

  app.use((_request, response) => {
    response.status(404).json({ message: "Resource not found." });
  });

  const errorHandler: ErrorRequestHandler = (error: unknown, _request, response, _next) => {
    if (typeof error === "object" && error !== null && "type" in error) {
      if (error.type === "entity.parse.failed") {
        response.status(400).json({ message: "Request body must be valid JSON." });
        return;
      }
      if (error.type === "entity.too.large") {
        response.status(413).json({ message: "Request body is too large." });
        return;
      }
    }

    console.error("Request failed:", error);
    if (response.headersSent) {
      return;
    }
    response.status(500).json({ message: "An unexpected server error occurred." });
  };
  app.use(errorHandler);

  return app;
}
