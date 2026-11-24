import { submitBaptismRegistration } from '../services/baptismService.js';
import { ValidationError } from '../utils/validate.js';

export async function createRegistration(req, res) {
  try {
    const referenceNo = await submitBaptismRegistration(req.body, req.files);
    res.status(201).json({ reference_no: referenceNo });
  } catch (e) {
    if (e instanceof ValidationError) return res.status(400).json({ message: e.message });
    throw e; // Express 5 forwards this to the error handler in app.js (500)
  }
}