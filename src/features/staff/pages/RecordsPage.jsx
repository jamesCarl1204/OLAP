import { useState } from 'react';
import { REGISTRY, MARRIAGES, fmtDate } from '../data/mock.js';
import styles from '../styles/Staff.module.css';

const bpl = (r) => `${r.book_no} / ${r.page_no} / ${r.line_no}`;
const parents = (r) => `${r.father_name} & ${r.mother_name}`;

const TABS = [
  { id: 'baptism', label: 'Baptism' },
  { id: 'confirmation', label: 'Confirmation' },
  { id: 'marriage', label: 'Marriage' },
];

// [header, cell getter]
const COLS = {
  baptism: [
    ['Name', (r) => r.full_name], ['Parents', parents], ['Born', (r) => fmtDate(r.birth_date)],
    ['Baptized', (r) => fmtDate(r.event_date)], ['Officiant', (r) => r.officiant],
    ['Sponsors', (r) => (r.sponsors?.length ? r.sponsors.join(', ') : '—')], ['Book / Page / Line', bpl],
  ],
  confirmation: [
    ['Name', (r) => r.full_name], ['Parents', parents], ['Confirmed', (r) => fmtDate(r.event_date)],
    ['Officiant', (r) => r.officiant], ['Book / Page / Line', bpl],
  ],
  marriage: [
    ['Groom', (r) => r.groom_name], ['Bride', (r) => r.bride_name], ['Married', (r) => fmtDate(r.marriage_date)],
    ['Officiant', (r) => r.officiant], ['Witnesses', (r) => r.witnesses], ['Book / Page / Line', bpl],
  ],
};

export default function RecordsPage() {
  const [tab, setTab] = useState('baptism');
  const [q, setQ] = useState('');
  const term = q.trim().toLowerCase();

  const source = tab === 'marriage' ? MARRIAGES : REGISTRY.filter((r) => r.record_type === tab);
  const nameOf = (r) => (tab === 'marriage' ? `${r.groom_name} ${r.bride_name}` : r.full_name);
  const rows = source.filter((r) => !term || nameOf(r).toLowerCase().includes(term));
  const cols = COLS[tab];

  return (
    <>
      <div className={styles.pageHead}>
        <div>
          <span className="eyebrow">Registry</span>
          <h1>Sacramental Records</h1>
          <p>Search the Baptism, Confirmation, and Marriage registers.</p>
        </div>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.tabs}>
          {TABS.map((t) => (
            <button key={t.id} type="button" className={`${styles.tab} ${tab === t.id ? styles.on : ''}`} onClick={() => setTab(t.id)}>{t.label}</button>
          ))}
        </div>
        <div className={styles.search}>
          <i className="fa-solid fa-magnifying-glass" />
          <input className={styles.input} placeholder="Search by name" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      <div className={styles.tableWrap}>
        {rows.length === 0 ? <p className={styles.empty}>No records found.</p> : (
          <table className={styles.table}>
            <thead><tr>{cols.map(([h]) => <th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>{cols.map(([h, get]) => <td key={h}>{get(r)}</td>)}</tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}