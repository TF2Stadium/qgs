/**
 * pg-promise style query-helpers for common pg query response
 * handling
 */

function maybeAwait(resultOrPromise, fn) {
  if (resultOrPromise.then) {
    return resultOrPromise.then(result => fn(result));
  } else {
    return fn(resultOrPromise);
  }
}

export function oneOrNone(resultOrPromise) {
  return maybeAwait(resultOrPromise, ({rows}) => {
    if (rows.length === 0) {
      return null;
    } else if (rows.length === 1) {
      return rows[0];
    } else {
      throw new Error('Multiple rows were not expected.');
    }
  });
}

export function one(resultOrPromise) {
  return maybeAwait(resultOrPromise, ({rows}) => {
    if (rows.length === 1) {
      return rows[0];
    } else {
      throw new Error(`${rows.length} rows were not expected.`);
    }
  });
}

export function any(resultOrPromise) {
  return maybeAwait(resultOrPromise, ({rows}) => rows);
}

export async function tx(db, body) {
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
