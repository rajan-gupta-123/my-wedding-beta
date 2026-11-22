import bcrypt from "bcryptjs";
import { createInterface } from "node:readline";
import { closeMongo, connectMongo, getDatabase } from "../db/mongo";
import { AdminDocument } from "../modules/auth/auth.types";

function ask(prompt: string): Promise<string> {
  const reader = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    reader.question(prompt, (answer) => {
      reader.close();
      resolve(answer.trim());
    });
  });
}

function askPassword(): Promise<string> {
  if (!process.stdin.isTTY || typeof process.stdin.setRawMode !== "function") {
    throw new Error("Run this command in an interactive terminal to enter the password securely.");
  }

  return new Promise((resolve, reject) => {
    const input = process.stdin;
    let password = "";
    process.stdout.write("Password: ");
    input.setRawMode(true);
    input.resume();

    const cleanup = () => {
      input.setRawMode(false);
      input.pause();
      input.removeListener("data", onData);
    };

    const onData = (chunk: Buffer) => {
      const key = chunk.toString("utf8");
      if (key === "\u0003") {
        cleanup();
        process.stdout.write("\n");
        reject(new Error("Admin setup cancelled."));
        return;
      }
      if (key === "\r" || key === "\n") {
        cleanup();
        process.stdout.write("\n");
        resolve(password);
        return;
      }
      if (key === "\u007f" || key === "\b") {
        password = password.slice(0, -1);
        return;
      }
      if (!/[\u0000-\u001f\u007f]/.test(key)) {
        password += key;
      }
    };

    input.on("data", onData);
  });
}

async function main(): Promise<void> {
  const username = await ask("Admin username: ");
  if (!username) {
    throw new Error("Username cannot be blank.");
  }

  const password = await askPassword();
  if (password.length < 12) {
    throw new Error("Use a password with at least 12 characters.");
  }

  await connectMongo();
  try {
    const passwordHash = await bcrypt.hash(password, 12);
    await getDatabase()
      .collection<AdminDocument>("admins")
      .insertOne({ username, passwordHash });
    console.log(`Admin "${username}" created.`);
  } finally {
    await closeMongo();
  }
}

main().catch((error: unknown) => {
  console.error("Could not create admin:", error);
  process.exitCode = 1;
});
