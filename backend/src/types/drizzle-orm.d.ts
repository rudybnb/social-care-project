declare module 'drizzle-orm/column.cjs' {
  export * from 'drizzle-orm/column.d.cts';
}

declare module 'drizzle-orm/sql/sql.cjs' {
  export * from 'drizzle-orm/sql/sql.d.cts';
}

declare module 'drizzle-orm/table.cjs' {
  export * from 'drizzle-orm/table.d.cts';
}

declare module 'drizzle-orm/casing.cjs' {
  export * from 'drizzle-orm/casing.d.cts';
}

declare module 'drizzle-orm/entity.cjs' {
  export * from 'drizzle-orm/entity.d.cts';
}

declare module 'drizzle-orm/utils.cjs' {
  export * from 'drizzle-orm/utils.d.cts';
}

declare module 'drizzle-orm/query-builders/select.types.cjs' {
  export * from 'drizzle-orm/query-builders/select.types.d.cts';
}

declare module 'drizzle-orm/subquery.cjs' {
  export * from 'drizzle-orm/subquery.d.cts';
}

declare module 'drizzle-orm/column-builder.cjs' {
  export * from 'drizzle-orm/column-builder.d.cts';
}

declare module 'drizzle-orm/pg-core/columns/common.cjs' {
  export * from 'drizzle-orm/pg-core/columns/common.d.cts';
}

declare module 'drizzle-orm/pg-core/table.cjs' {
  export * from 'drizzle-orm/pg-core/table.d.cts';
}

declare module 'drizzle-orm/pg-core/indexes.cjs' {
  export * from 'drizzle-orm/pg-core/indexes.d.cts';
}

declare module 'drizzle-orm' {
  import type * as Cond from 'drizzle-orm/sql/expressions/conditions.d.cts';
  import type * as Sql from 'drizzle-orm/sql/sql.d.cts';

  export const eq: typeof Cond.eq;
  export const ne: typeof Cond.ne;
  export const and: typeof Cond.and;
  export const or: typeof Cond.or;
  export const gte: typeof Cond.gte;
  export const lte: typeof Cond.lte;
  export const gt: typeof Cond.gt;
  export const lt: typeof Cond.lt;
  export const like: typeof Cond.like;
  export const ilike: typeof Cond.ilike;
  export const isNull: typeof Cond.isNull;
  export const isNotNull: typeof Cond.isNotNull;
  export const inArray: typeof Cond.inArray;
  export const notInArray: typeof Cond.notInArray;
  export const sql: typeof Sql.sql;
  export type SQL<T = unknown> = Sql.SQL<T>;
  export type SQLWrapper = Sql.SQLWrapper;
}

declare module 'drizzle-orm/pg-core' {
  import type * as TableModule from 'drizzle-orm/pg-core/table.d.cts';
  import type * as TextModule from 'drizzle-orm/pg-core/columns/text.d.cts';
  import type * as SerialModule from 'drizzle-orm/pg-core/columns/serial.d.cts';
  import type * as TimestampModule from 'drizzle-orm/pg-core/columns/timestamp.d.cts';
  import type * as IntegerModule from 'drizzle-orm/pg-core/columns/integer.d.cts';
  import type * as BooleanModule from 'drizzle-orm/pg-core/columns/boolean.d.cts';
  import type * as UuidModule from 'drizzle-orm/pg-core/columns/uuid.d.cts';
  import type * as NumericModule from 'drizzle-orm/pg-core/columns/numeric.d.cts';
  import type * as RealModule from 'drizzle-orm/pg-core/columns/real.d.cts';
  import type * as VarcharModule from 'drizzle-orm/pg-core/columns/varchar.d.cts';
  import type * as IndexModule from 'drizzle-orm/pg-core/indexes.d.cts';

  export const pgTable: typeof TableModule.pgTable;
  export const text: typeof TextModule.text;
  export const serial: typeof SerialModule.serial;
  export const timestamp: typeof TimestampModule.timestamp;
  export const integer: typeof IntegerModule.integer;
  export const boolean: typeof BooleanModule.boolean;
  export const uuid: typeof UuidModule.uuid;
  export const decimal: typeof NumericModule.numeric;
  export const real: typeof RealModule.real;
  export const varchar: typeof VarcharModule.varchar;
  export const index: typeof IndexModule.index;
  export const uniqueIndex: typeof IndexModule.uniqueIndex;
}

declare module 'drizzle-orm/node-postgres' {
  import type * as DriverModule from 'drizzle-orm/node-postgres/driver.d.cts';
  import type * as SessionModule from 'drizzle-orm/node-postgres/session.d.cts';

  export const drizzle: typeof DriverModule.drizzle;
  export type NodePgDatabase<TSchema extends Record<string, unknown> = Record<string, unknown>> = DriverModule.NodePgDatabase<TSchema>;
  export type NodePgTransaction<
    TSchema extends Record<string, unknown> = Record<string, unknown>,
    TQueryResult extends SessionModule.QueryResultHKT = SessionModule.NodePgQueryResultHKT
  > = SessionModule.NodePgTransaction<TSchema, TQueryResult, SessionModule.NodePgQueryResultHKT>;
}

declare module 'drizzle-orm/node-postgres/migrator' {
  import type * as MigratorModule from 'drizzle-orm/node-postgres/migrator.d.cts';

  export const migrate: typeof MigratorModule.migrate;
}
