import { fmtLong } from '../data/mock.js';

const S = {
  page: { width: '100%', maxWidth: '40rem', margin: '0 auto', padding: '2.5rem 2.5rem 2rem', background: '#fff', color: '#16263E', border: '6px double #B08D4F', fontFamily: "'Cormorant Garamond', Georgia, serif", textAlign: 'center', boxSizing: 'border-box' },
  small: { fontFamily: "'Plus Jakarta Sans', Arial, sans-serif", fontSize: '11px', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#8F6F38' },
  parish: { fontSize: '26px', fontWeight: 600, margin: '4px 0 0' },
  title: { fontSize: '34px', fontWeight: 600, margin: '22px 0 6px', letterSpacing: '0.04em', textTransform: 'uppercase' },
  rule: { width: '80px', height: '1px', background: '#C5A467', margin: '0 auto 22px', border: 0 },
  body: { fontSize: '19px', lineHeight: 1.8, textAlign: 'justify' },
  name: { display: 'block', margin: '10px 0', fontSize: '28px', fontWeight: 700, textAlign: 'center', letterSpacing: '0.03em' },
  foot: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '34px', gap: '16px', textAlign: 'left' },
  sig: { textAlign: 'center', minWidth: '12rem', fontSize: '16px' },
  sigLine: { borderTop: '1px solid #16263E', marginTop: '36px', paddingTop: '4px', fontWeight: 700 },
  meta: { fontFamily: "'Plus Jakarta Sans', Arial, sans-serif", fontSize: '10px', color: '#566982', lineHeight: 1.6 },
  seal: { width: '84px', height: '84px', border: '1px dashed #B08D4F', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Plus Jakarta Sans', Arial, sans-serif", fontSize: '9px', color: '#8F6F38', textAlign: 'center', padding: '8px', boxSizing: 'border-box' },
};


function QrMock({ seed }) {
  const N = 21;
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const cells = [];
  const inFinder = (x, y) => (x < 7 && y < 7) || (x >= N - 7 && y < 7) || (x < 7 && y >= N - 7);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    h = (h * 1103515245 + 12345) >>> 0;
    if (!inFinder(x, y) && (h >> 16) % 2) cells.push(<rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" />);
  }
  const finder = (ox, oy) => (
    <g key={`${ox}-${oy}`}>
      <rect x={ox} y={oy} width="7" height="7" /><rect x={ox + 1} y={oy + 1} width="5" height="5" fill="#fff" /><rect x={ox + 2} y={oy + 2} width="3" height="3" />
    </g>
  );
  return (
    <svg viewBox={`-1 -1 ${N + 2} ${N + 2}`} width="84" height="84" fill="#16263E" shapeRendering="crispEdges">
      <rect x="-1" y="-1" width={N + 2} height={N + 2} fill="#fff" />
      {cells}{finder(0, 0)}{finder(N - 7, 0)}{finder(0, N - 7)}
    </svg>
  );
}

export function printCertificate(node) {
  if (!node) return;
  const w = window.open('', '_blank', 'width=900,height=1100');
  if (!w) return alert('Please allow pop-ups to print the certificate.');
  w.document.write(`<!doctype html><html><head><title>Certificate</title>
    <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Plus+Jakarta+Sans:wght@400;600&display=swap" rel="stylesheet">
    <style>body{margin:0;padding:24px}@page{margin:12mm}</style></head><body>${node.outerHTML}</body></html>`);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 700);
}

export default function Certificate({ req, record, issued, innerRef }) {
  const isBaptism = req.certificate_type === 'baptismal';
  const digital = req.format === 'digital';
  const r = record || {};
  const name = r.full_name || req.subject_name;
  const father = r.father_name || req.father_name;
  const mother = r.mother_name || req.mother_name;
  const birthDate = r.birth_date || req.birth_date;
  const birthPlace = r.birth_place || req.birth_place;
  const eventDate = r.event_date || req.event_date;

  return (
    <div ref={innerRef} style={S.page}>
      <div style={S.small}>Archdiocese · Parish Registry</div>
      <h3 style={S.parish}>Our Lady of the Airways Parish</h3>
      <h2 style={S.title}>{isBaptism ? 'Certificate of Baptism' : 'Certificate of Confirmation'}</h2>
      <hr style={S.rule} />

      <p style={S.body}>
        This is to certify that
        <span style={S.name}>{name}</span>
        {birthDate && <>born on <b>{fmtLong(birthDate)}</b>{birthPlace ? <> in <b>{birthPlace}</b></> : null}, </>}
        {father || mother ? <>child of <b>{father || '—'}</b> and <b>{mother || '—'}</b>, </> : null}
        {isBaptism ? 'was baptized' : 'received the Sacrament of Confirmation'}
        {eventDate ? <> on <b>{fmtLong(eventDate)}</b></> : null} at Our Lady of the Airways Parish,
        {' '}as recorded in the {isBaptism ? 'Baptismal' : 'Confirmation'} Register,
        {' '}Book <b>{r.book_no || '—'}</b>, Page <b>{r.page_no || '—'}</b>, Line <b>{r.line_no || '—'}</b>.
      </p>
      <p style={{ ...S.body, textAlign: 'center', fontSize: '16px' }}>
        Issued on {fmtLong(issued.issued_at)} for the purpose of: <i>{req.purpose}</i>.
      </p>

      <div style={S.foot}>
        <div>
          {digital ? <QrMock seed={issued.verify_token || issued.certificate_no || 'x'} /> : <div style={S.seal}>Parish dry seal</div>}
          {digital && (
            <div style={{ ...S.meta, marginTop: '6px' }}>
              No. {issued.certificate_no}<br />Verify: olap.example/verify/{issued.verify_token}
            </div>
          )}
        </div>
        <div style={S.sig}>
          <div style={S.sigLine}>{issued.signed_by}</div>
          <div>Parish Priest</div>
        </div>
      </div>
    </div>
  );
}