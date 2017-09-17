/* @flow */
/**
 * pg-promise style query-helpers for common pg query response
 * handling
 */

import type {ResultSet, Pool, Client, PoolClient} from 'pg';

declare type ResultsPromise = Promise<ResultSet>;
declare type Results = ResultSet | ResultsPromise;
declare type Body = (...any) => any;

export async function oneOrNone(resultOrPromise: Results) {
  const {rows} = await resultOrPromise;

  if (rows.length === 0) {
    return null;
  } else if (rows.length === 1) {
    return rows[0];
  } else {
    throw new Error('Multiple rows were not expected.');
  }
}

export async function one(resultOrPromise: Results) {
  const {rows} = await resultOrPromise;

  if (rows.length === 1) {
    return rows[0];
  } else {
    throw new Error(`${rows.length} rows were not expected.`);
  }
}

export async function any(resultOrPromise: Results) {
  const {rows} = await resultOrPromise;
  return rows;
}

export async function tx(db: Client | PoolClient, body: Body) {
  let result;
  try {
    await db.query('BEGIN');

    // pass in the same client instance, for compatibility with pg-promise
    result = await body(db);

    await db.query('COMMIT');
  } catch (e) {
    await db.query('ROLLBACK');
    throw e;
  }

  return result;
}

export async function txPool(pool: Pool, body: Body) {
  let db;
  try {
    db = await pool.connect();
    await tx(db, body);
  } finally {
    if (db) {
      db.release();
    }
  }
}
