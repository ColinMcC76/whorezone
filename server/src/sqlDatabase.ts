import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(path.join(process.cwd(), 'package.json'));

type SqlStatement = {
  bind(values?: unknown[] | Record<string, unknown>): void;
  step(): boolean;
  getAsObject(): Record<string, unknown>;
  free(): void;
};

type SqlDatabase = {
  run(sql: string, params?: unknown[] | Record<string, unknown>): void;
  exec(sql: string): unknown;
  prepare(sql: string): SqlStatement;
  getRowsModified(): number;
  export(): Uint8Array;
};

type SqlStatic = {
  Database: new (data?: Uint8Array) => SqlDatabase;
};

let SQL: SqlStatic | undefined;
let database: SqlDatabase | undefined;

async function loadSql(): Promise<SqlStatic> {
  if (SQL) return SQL;
  const initSqlJs = require('sql.js') as (options?: { wasmBinary: Buffer }) => Promise<SqlStatic>;
  const wasmPath = require.resolve('sql.js/dist/sql-wasm.wasm');
  SQL = await initSqlJs({ wasmBinary: fs.readFileSync(wasmPath) });
  return SQL;
}

export async function openSqlDatabase(dbPath: string): Promise<void> {
  if (database) return;
  const sql = await loadSql();
  const bytes = fs.existsSync(dbPath) ? fs.readFileSync(dbPath) : undefined;
  database = new sql.Database(bytes);
}

export function saveSqlDatabase(dbPath: string): void {
  if (!database) return;
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  fs.writeFileSync(dbPath, Buffer.from(database.export()));
}

function bindParams(params: unknown[]): unknown[] | Record<string, unknown> | undefined {
  if (params.length === 0) return undefined;
  const first = params[0];
  if (
    params.length === 1 &&
    first &&
    typeof first === 'object' &&
    !Array.isArray(first) &&
    !Buffer.isBuffer(first)
  ) {
    const named: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(first as Record<string, unknown>)) {
      const parameter = key.startsWith('@') || key.startsWith(':') || key.startsWith('$') ? key : `@${key}`;
      named[parameter] = value === undefined ? null : value;
    }
    return named;
  }
  return params.map((value) => (value === undefined ? null : value));
}

function queryAll(sql: string, params: unknown[]): Record<string, unknown>[] {
  if (!database) throw new Error('Database is not open');
  const statement = database.prepare(sql);
  const bound = bindParams(params);
  if (bound) statement.bind(bound);
  const rows: Record<string, unknown>[] = [];
  while (statement.step()) rows.push(statement.getAsObject());
  statement.free();
  return rows;
}

export function getDb(): {
  exec(sql: string): void;
  prepare(sql: string): {
    all(...params: unknown[]): Record<string, unknown>[];
    get(...params: unknown[]): Record<string, unknown> | undefined;
    run(...params: unknown[]): { changes: number; lastInsertRowid: number };
  };
} {
  if (!database) throw new Error('Database is not open');
  return {
    exec(sql: string) {
      database!.exec(sql);
    },
    prepare(sql: string) {
      return {
        all(...params: unknown[]) {
          return queryAll(sql, params);
        },
        get(...params: unknown[]) {
          return queryAll(sql, params)[0];
        },
        run(...params: unknown[]) {
          const bound = bindParams(params);
          if (bound) database!.run(sql, bound);
          else database!.run(sql);
          const changes = database!.getRowsModified();
          const idRows = database!.exec('SELECT last_insert_rowid() AS id') as Array<{
            values: unknown[][];
          }>;
          const lastInsertRowid = Number(idRows[0]?.values?.[0]?.[0] ?? 0);
          return { changes, lastInsertRowid };
        },
      };
    },
  };
}
