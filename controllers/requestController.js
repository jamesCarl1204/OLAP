import { submitCertificateRequest, ValidationError } from '../services/requestService.js';

const handler = (kind) => async (req, res) => {
  try {
    const referenceNo = await submitCertificateRequest(kind, req.body || {}, req.file);
    res.status(201).json({ reference_no: referenceNo });
  } catch (e) {
    if (e instanceof ValidationError) return res.status(400).json({ message: e.message });
    throw e; // Express 5 forwards this to the error handler in app.js (500)
  }
};

export const createBaptismal = handler('baptismal');
export const createConfirmation = handler('confirmation');