import "dotenv/config";
import { startServer } from "./start-server.js";

const started = await startServer();

console.log(`Monthly running on http://${started.host}:${started.port}`);
if (process.env.NODE_ENV === "production") {
  console.log(`Data directory: ${process.env.DATA_DIR ?? "./data"}`);
}
