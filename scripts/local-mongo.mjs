// Starts a persistent local MongoDB (via mongodb-memory-server binaries) for
// development when you don't have MongoDB installed. Data lives in ./.mongo-data.
import { MongoMemoryServer } from "mongodb-memory-server";
import { mkdirSync } from "node:fs";
import path from "node:path";

const dbPath = path.resolve(".mongo-data");
mkdirSync(dbPath, { recursive: true });
const port = Number(process.env.MONGO_PORT ?? 27017);
const server = await MongoMemoryServer.create({ instance: { port, dbPath, storageEngine: "wiredTiger" } });
console.log(`MongoDB running at ${server.getUri()} (data: ${dbPath}). Ctrl+C to stop.`);
const stop = async () => {
  await server.stop({ doCleanup: false });
  process.exit(0);
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
