// Reference codes from "OLAP REFERENCE CODE FORMAT – 2026".
// Each code has its own sequence per year: OLAP-BC-2026-00001
export const REF_CODES = {
  baptismal: 'BC',
  confirmation: 'CC',
  no_record_baptism: 'CNR',
  no_record_confirmation: 'CNR',
  mass: 'MI',
  marriage: 'MAR',
  baptism_registration: 'BR',
  certificate: 'CERT',
};

// Call inside the caller's transaction so the number is never reused or skipped.
export async function nextReference(conn, code) {
  const year = new Date().getFullYear();
  await conn.query(
    `INSERT INTO reference_counters (code, year, last_number) VALUES (?, ?, LAST_INSERT_ID(1))
     ON DUPLICATE KEY UPDATE last_number = LAST_INSERT_ID(last_number + 1)`, [code, year]);
  const [[row]] = await conn.query('SELECT LAST_INSERT_ID() AS n');
  return `OLAP-${code}-${year}-${String(row.n).padStart(5, '0')}`;
}
