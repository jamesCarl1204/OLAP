import { fmtLong } from '../data/mock.js';
import logoImg from '../../../assets/birhen.jpg';
import signatureImg from '../../../assets/signature.jpg';

const PARISH = {
  name: 'Our Lady of the Airways Parish',
  address: 'Chapel Rd. cor. Ninoy Aquino Avenue, Pasay City',
  email: 'airways_parish@yahoo.com',
  tel: '(02) 8851-4371',
  mobile: '0956-3647788/0919-4639797',
};

const SANS = "'Plus Jakarta Sans', Arial, sans-serif";
const S = {
  page: { width: '100%', maxWidth: '40rem', margin: '0 auto', padding: '2.5rem 2.5rem 2rem', background: '#fff', color: '#16263E', border: '6px double #B08D4F', fontFamily: "'Cormorant Garamond', Georgia, serif", textAlign: 'center', boxSizing: 'border-box' },
  headWrap: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px' },
  logo: { height: '72px', width: 'auto' },
  parish: { fontFamily: SANS, fontSize: '26px', fontWeight: 700, margin: 0 },
  addr: { fontFamily: SANS, fontSize: '11px', lineHeight: 1.7, color: '#566982' },
  title: { fontSize: '32px', fontWeight: 600, margin: '22px 0 6px', letterSpacing: '0.04em', textTransform: 'uppercase' },
  rule: { width: '80px', height: '1px', background: '#C5A467', margin: '0 auto 20px', border: 0 },
  body: { fontSize: '19px', lineHeight: 1.8, textAlign: 'justify' },
  center: { fontSize: '18px', lineHeight: 1.7, margin: '6px 0', textAlign: 'center' },
  rite: { fontSize: '16px', textTransform: 'uppercase', margin: '12px 0', lineHeight: 1.5 },
  name: { display: 'block', margin: '10px 0 14px', fontSize: '30px', fontWeight: 700, textAlign: 'center' },
  row: { display: 'grid', gridTemplateColumns: '9rem 1fr', gap: '0 14px', textAlign: 'left', fontSize: '18px', margin: '4px 0' },
  reg: { fontSize: '16px', margin: '14px 0 4px', textAlign: 'left' },
  foot: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '30px', gap: '16px', textAlign: 'left' },
  sig: { textAlign: 'center', minWidth: '12rem', fontSize: '16px' },
  sigImg: { height: '56px', display: 'block', margin: '0 auto -18px' },
  sigLine: { borderTop: '1px solid #16263E', marginTop: '36px', paddingTop: '4px', fontWeight: 700 },
  meta: { fontFamily: SANS, fontSize: '10px', color: '#566982', lineHeight: 1.6 },
  seal: { width: '84px', height: '84px', border: '1px dashed #B08D4F', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontSize: '9px', color: '#8F6F38', textAlign: 'center', padding: '8px', boxSizing: 'border-box' },
};

// absolute URL para gumana pati sa print window
const abs = (u) => (typeof window !== 'undefined' ? new URL(u, window.location.href).href : u);

// "NICANOR PIEDAD JR." -> "Nicanor Piedad Jr."
const tc = (s) => String(s ?? '').toLowerCase().replace(/(^|[\s.-])(\p{L})/gu, (_, a, b) => a + b.toUpperCase());

const ord = (n) => {
  const s = ['th', 'st', 'nd', 'rd'], v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};
// "18th day of April, 2006"
const dayOf = (d) => {
  if (!d) return '—';
  const x = new Date(d);
  return `${ord(x.getDate())} day of ${x.toLocaleDateString('en-PH', { month: 'long' })}, ${x.getFullYear()}`;
};
const joinList = (a) => (a.length < 2 ? a.join('') : a.length === 2 ? a.join(' and ') : `${a.slice(0, -1).join(', ')}, and ${a[a.length - 1]}`);

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

// ---- shared pieces ----
function Header({ title }) {
  return (
    <>
      <div style={S.headWrap}>
        <img src={abs(logoImg)} alt="" style={S.logo} />
        <div>
          <h3 style={S.parish}>{PARISH.name}</h3>
          <div style={S.addr}>
            {PARISH.address}<br />Email: {PARISH.email}<br />
            Telephone: {PARISH.tel}<br />Mobile Nos. {PARISH.mobile}
          </div>
        </div>
      </div>
      <h2 style={S.title}>{title}</h2>
      <hr style={S.rule} />
    </>
  );
}

function Footer({ issued, digital }) {
  return (
    <div style={S.foot}>
      <div>
        {digital ? <QrMock seed={issued.verify_token || issued.certificate_no || 'x'} /> : <div style={S.seal}>Parish dry seal</div>}
        {digital && (
          <div style={{ ...S.meta, marginTop: '6px' }}>
            No. {issued.certificate_no}<br />Verification link will be available once the backend is connected.
          </div>
        )}
      </div>
      <div style={S.sig}>
        <img src={abs(signatureImg)} alt="" style={S.sigImg} />
        <div style={S.sigLine}>{issued.signed_by}</div>
        <div>Parish Priest</div>
      </div>
    </div>
  );
}

// ---- bodies ----
function BaptismBody({ req, r, issued }) {
  const sponsors = r.sponsors?.length ? joinList(r.sponsors.map(tc)) : '—';
  return (
    <>
      <p style={S.center}>This is to certify that</p>
      <span style={S.name}>{(r.full_name || req.subject_name || '').toUpperCase()}</span>
      <div style={S.row}><span>Child of</span><b>{tc(r.father_name || req.father_name) || '—'}</b></div>
      <div style={S.row}><span>And</span><b>{tc(r.mother_name || req.mother_name) || '—'}</b></div>
      <div style={S.row}><span>born in</span><b>{tc(r.birth_place || req.birth_place) || '—'}</b></div>
      <div style={S.row}><span>on the</span><b>{dayOf(r.birth_date || req.birth_date)}</b></div>
      <p style={S.center}>was solemnly Baptized</p>
      <div style={S.row}><span>on the</span><b>{dayOf(r.event_date || req.event_date)}</b></div>
      <div style={S.rite}>According to the Rite of the<br />Roman Catholic Church</div>
      <div style={S.row}><span>By the Rev.</span><b>{tc(r.officiant) || '—'}</b></div>
      <div style={S.row}><span>the sponsors being:</span><span>{sponsors}</span></div>
      <p style={{ ...S.reg, marginTop: '40px' }}>as appears on the Baptismal Register of this Church.</p>
      <p style={S.reg}>
        Bk. No.: <b>{r.book_no || '—'}</b> &nbsp; Page No.: <b>{r.page_no || '—'}</b> &nbsp; Line No.: <b>{r.line_no || '—'}</b> &nbsp; Date: <b>{fmtLong(issued.issued_at)}</b>
      </p>
      <p style={{ ...S.reg, margin: 0 }}>Purpose: <b>FOR {String(req.purpose || '').toUpperCase()}</b></p>
    </>
  );
}

// TODO: no Confirmation certificate sample yet. Replace this wording once the parish sends one.
function ConfirmationBody({ req, r, issued }) {
  const father = r.father_name || req.father_name;
  const mother = r.mother_name || req.mother_name;
  const eventDate = r.event_date || req.event_date;
  return (
    <>
      <p style={S.body}>
        This is to certify that
        <span style={S.name}>{(r.full_name || req.subject_name || '').toUpperCase()}</span>
        {father || mother ? <>child of <b>{tc(father) || '—'}</b> and <b>{tc(mother) || '—'}</b>, </> : null}
        received the Sacrament of Confirmation{eventDate ? <> on the <b>{dayOf(eventDate)}</b></> : null}
        {r.officiant ? <> by <b>{tc(r.officiant)}</b></> : null}, as recorded in the Confirmation Register,
        {' '}Book <b>{r.book_no || '—'}</b>, Page <b>{r.page_no || '—'}</b>, Line <b>{r.line_no || '—'}</b>.
      </p>
      <p style={{ ...S.body, textAlign: 'center', fontSize: '16px' }}>
        Issued on {fmtLong(issued.issued_at)} for the purpose of: <i>{req.purpose}</i>.
      </p>
    </>
  );
}

function NoRecordBody({ req, issued }) {
  const baptism = req.certificate_type === 'no_record_baptism';
  const record = baptism ? 'BAPTISMAL' : 'CONFIRMATION';
  const verb = baptism ? 'BAPTIZED' : 'CONFIRMED';
  const sacrament = baptism ? 'BAPTISM' : 'CONFIRMATION';
  const parents = req.father_name || req.mother_name;
  return (
    <>
      <p style={{ ...S.body, textAlign: 'left', fontWeight: 700 }}>To Whom It May Concern:</p>
      <p style={S.body}>
        This is to certify that the <b>{record} RECORD</b> of
        <span style={S.name}>{req.subject_name}</span>
        {parents && <>child of <b>{tc(req.father_name) || '—'}</b> and <b>{tc(req.mother_name) || '—'}</b>, </>}
        {req.birth_date && <>alleged to have been born on <b>{fmtLong(req.birth_date)}</b>{req.birth_place ? <> in <b>{tc(req.birth_place)}</b></> : null}, </>}
        was <b>not {verb}</b> in our parish and cannot be found in the records of this office despite diligent and thorough research.
      </p>
      <p style={S.body}>
        In view of the foregoing, this office cannot issue a certificate of {sacrament.toLowerCase()} for <b>{req.subject_name}</b> as
        partial requirement in <b>{tc(req.destination_church)}{req.destination_city ? `, ${tc(req.destination_city)}` : ''}</b> for <b>{sacrament}</b>.
      </p>
      <p style={{ ...S.body, textAlign: 'center', fontSize: '16px' }}>
        Given this <b>{dayOf(issued.issued_at)}</b>.
      </p>
    </>
  );
}

export default function Certificate({ req, record, issued, innerRef }) {
  const type = req.certificate_type; // baptismal | confirmation | no_record_baptism | no_record_confirmation
  const noRecord = type.startsWith('no_record');
  const kind = type.includes('baptism') ? 'baptism' : 'confirmation';
  const digital = req.format === 'digital';
  const r = record || {};
  const title = noRecord ? 'Certificate of No Record' : kind === 'baptism' ? 'Certificate of Baptism' : 'Certificate of Confirmation';

  return (
    <div ref={innerRef} style={S.page}>
      <Header title={title} />
      {noRecord
        ? <NoRecordBody req={req} issued={issued} />
        : kind === 'baptism'
          ? <BaptismBody req={req} r={r} issued={issued} />
          : <ConfirmationBody req={req} r={r} issued={issued} />}
      <Footer issued={issued} digital={digital} />
    </div>
  );
}