import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDirectory = process.env.HUNTER_DATA_DIR
  ? path.resolve(process.env.HUNTER_DATA_DIR)
  : path.join(ROOT_DIR, "server", "data");

export const config = Object.freeze({
  rootDir: ROOT_DIR,
  publicDir: path.join(ROOT_DIR, "public"),
  dataDir: dataDirectory,
  dbFile: path.join(dataDirectory, "db.json"),
  catalogFile: path.join(dataDirectory, "catalog.json"),
  storeFile: path.join(dataDirectory, "users.json"),
  port: Number(process.env.PORT || 3000),
  persistProfile: /^(1|true)$/i.test(process.env.HUNTER_PERSIST || ""),
  secureCookie: /^(1|true)$/i.test(process.env.HUNTER_SECURE_COOKIE || ""),
  today: process.env.HUNTER_TODAY || null,
});
