import multer from 'multer';

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1
  },
  fileFilter(req, file, cb) {
    if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(null, true);
      return;
    }

    const error = new Error('INVALID_FILE_TYPE');
    error.code = 'INVALID_FILE_TYPE';
    cb(error);
  }
});

function createUploadHandler(fieldName, messages) {
  return function handleUpload(req, res, next) {
    upload.single(fieldName)(req, res, (error) => {
      if (!error) {
        next();
        return;
      }

      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: req.t(messages.fileTooLarge)
        });
      }

      if (error.code === 'INVALID_FILE_TYPE') {
        return res.status(400).json({
          success: false,
          message: req.t(messages.fileTypeInvalid)
        });
      }

      return res.status(400).json({
        success: false,
        message: req.t(messages.uploadInvalid)
      });
    });
  };
}

export const handleAvatarUpload = createUploadHandler('avatar', {
  fileTooLarge: 'pages.avatar.fileTooLarge',
  fileTypeInvalid: 'pages.avatar.fileTypeInvalid',
  uploadInvalid: 'pages.avatar.uploadInvalid'
});

export const handleServicePhotoUpload = createUploadHandler('photo', {
  fileTooLarge: 'pages.services.photo.fileTooLarge',
  fileTypeInvalid: 'pages.services.photo.fileTypeInvalid',
  uploadInvalid: 'pages.services.photo.uploadInvalid'
});
