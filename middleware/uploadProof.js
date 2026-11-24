import multer from 'multer';

const MAX_BYTES = 5 * 1024 * 1024;

function wrap(upload) {
  return (req, res, next) => {
    upload(req, res, (err) => {
      if (!err) return next();
      const message = err.code === 'LIMIT_FILE_SIZE' ? 'File is too large. Maximum size is 5 MB.' : 'Invalid upload.';
      res.status(400).json({ message });
    });
  };
}

// Certificate requests: one proof of payment.
export const handleUpload = wrap(
  multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_BYTES, files: 1 } }).single('proof'));

// Baptism registration: three requirement documents + one proof of payment.
export const handleBaptismUploads = wrap(
  multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_BYTES, files: 4 } }).fields([
    { name: 'birth', maxCount: 1 },
    { name: 'marriage', maxCount: 1 },
    { name: 'noRecord', maxCount: 1 },
    { name: 'proof', maxCount: 1 },
  ]));

  // Marriage booking: five requirement documents + one proof of payment.
export const handleMarriageUploads = wrap(
  multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_BYTES, files: 6 } }).fields([
    { name: 'groomBaptism', maxCount: 1 },
    { name: 'groomConfirmation', maxCount: 1 },
    { name: 'brideBaptism', maxCount: 1 },
    { name: 'brideConfirmation', maxCount: 1 },
    { name: 'license', maxCount: 1 },
    { name: 'proof', maxCount: 1 },
  ]));