import { PROOF_DIR } from '../config/uploads.js';
import { runAction, HttpError } from '../services/certificateWorkflow.js';
import * as staff from '../services/staffService.js';
import { findFile } from '../models/fileModel.js';

export async function listRequests(_req, res) { res.json(await staff.listRequestsForStaff()); }
export async function listBaptisms(_req, res) { res.json(await staff.listBaptismsForStaff()); }
export async function listMasses(_req, res) { res.json(await staff.listMassesForStaff()); }
export async function searchRegistry(req, res) { res.json(await staff.searchRegistryForStaff(req.query.type, req.query.q)); }

export async function act(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ message: 'Invalid request.' });
  try {
    await runAction(id, req.params.action, req.body || {}, req.auth.sub);
    res.json({ ok: true });
  } catch (e) {
    if (e instanceof HttpError) return res.status(e.status).json({ message: e.message });
    throw e;
  }
}

export async function getFile(req, res) {
  const f = await findFile(Number(req.params.id));
  if (!f) return res.status(404).json({ message: 'File not found.' });
  res.type(f.mime_type);
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('Cache-Control', 'private, no-store');
  res.sendFile(f.storage_key, { root: PROOF_DIR }, (err) => {
    if (err && !res.headersSent) res.status(404).json({ message: 'File not found.' });
  });
}