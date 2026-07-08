import mysql from 'mysql2/promise';

/**
 * Connection handling in Lambda is different from a traditional long-running
 * server: each concurrent invocation can spin up a new execution environment,
 * and each one would open its own DB connection if we're not careful —
 * this can exhaust MySQL's max_connections under load.
 *
 * Mitigations used here (documented for interview discussion):
 * 1. `connectionLimit: 1` — one connection per Lambda execution environment,
 *    since environments are reused across invocations but not shared
 *    concurrently within themselves.
 * 2. The pool is created OUTSIDE the handler function (module scope), so it's
 *    reused across warm invocations instead of reconnecting every time.
 * 3. For high-traffic production use, the recommended next step is RDS Proxy,
 *    which pools connections at the infrastructure level across all Lambda
 *    execution environments — noted in the README as a scaling path.
 */
let pool: mysql.Pool | null = null;

export function getPool(): mysql.Pool {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      connectionLimit: 1,
      waitForConnections: true,
      queueLimit: 0,
      enableKeepAlive: true,
    });
  }
  return pool;
}
