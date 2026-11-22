import { Db, MongoClient } from "mongodb";
import { env } from "../config/env";

let client: MongoClient | undefined;
let database: Db | undefined;

export async function connectMongo(): Promise<void> {
  if (client) {
    return;
  }

  const connection = new MongoClient(env.MONGODB_URI);
  await connection.connect();
  const db = connection.db(env.MONGODB_DATABASE);

  await db.collection("admins").createIndex({ username: 1 }, { unique: true });
  await db.collection("guests").createIndex({ status: 1 });

  client = connection;
  database = db;
}

export function getMongoClient(): MongoClient {
  if (!client) {
    throw new Error("MongoDB has not been connected.");
  }
  return client;
}

export function getDatabase(): Db {
  if (!database) {
    throw new Error("MongoDB has not been connected.");
  }
  return database;
}

export async function closeMongo(): Promise<void> {
  if (client) {
    const connection = client;
    client = undefined;
    database = undefined;
    await connection.close();
  }
}
