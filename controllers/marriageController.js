import { submitMarriageBooking, listMarriagesForStaff } from '../services/marriageService.js';
import { ValidationError } from '../utils/validate.js';

export async function createMarriage(req, res) {
  try {
    const referenceNo = await submitMarriageBooking(req.body, req.files);
    res.status(201).json({ reference_no: referenceNo });
  } catch (e) {
    if (e instanceof ValidationError) return res.status(400).json({ message: e.message });
    throw e;
  }
}

export async function listMarriages(_req, res) {
  res.json(await listMarriagesForStaff());
}