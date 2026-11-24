import { submitCertificateRequest, ValidationError } from '../services/requestService.js';

const run = (kind, req, res) =>
  submitCertificateRequest(kind, req.body || {}, req.file)
    .then((referenceNo) => res.status(201).json({ reference_no: referenceNo }))
    .catch((e) => {
      if (e instanceof ValidationError) return res.status(400).json({ message: e.message });
      throw e; // Express 5 forwards this to the error handler in app.js (500)
    });

export const createBaptismal = (req, res) => run('baptismal', req, res);
export const createConfirmation = (req, res) => run('confirmation', req, res);

// :kind is 'baptism' or 'confirmation' (same as the public URL)
const NO_RECORD = { baptism: 'no_record_baptism', confirmation: 'no_record_confirmation' };
export function createNoRecord(req, res) {
  const kind = NO_RECORD[req.params.kind];
  if (!kind) return res.status(404).json({ message: 'Unknown request type.' });
  return run(kind, req, res);
}