// npm run db:migrate: applies db/migrations/*.sql in order, once each.
import { connect, migrate } from "./db.mjs";

const db = await connect();
const applied = await migrate(db);
console.log(applied.length ? `applied: ${applied.join(", ")}` : "database is up to date");
await db.close();
