import { closeMongo, connectMongo } from "./db/mongo";
import { createApp } from "./app";
import { env } from "./config/env";

async function start(): Promise<void> {
  await connectMongo();
  const app = createApp();
  const server = app.listen(env.PORT, () => {
    console.log(`Wedding RSVP API listening on http://localhost:${env.PORT}`);
  });

  const shutdown = () => {
    server.close(async (error) => {
      if (error) {
        console.error("Failed to close the HTTP server cleanly:", error);
        process.exitCode = 1;
      }
      try {
        await closeMongo();
      } catch (closeError) {
        console.error("Failed to close MongoDB cleanly:", closeError);
        process.exitCode = 1;
      }
    });
  };

  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
}

start().catch((error: unknown) => {
  console.error("Failed to start the Wedding RSVP API:", error);
  process.exitCode = 1;
});
