const multer = require('multer');
const path = require('path');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const setFilename = (req, res, next) => {
  const timestamp = Date.now();
  const date = new Date().toISOString().split('T')[0];

  for (let field in req.files) {
    req.files[field].forEach(file => {
      const fieldname = file.fieldname.replace(/\[/g, '_').replace(/\]/g, '');
      const extension = path.extname(file.originalname); 
      const id = req.body.id;
      const filename = `${fieldname}_${id}_${timestamp}_${date}${extension}`;
      file.filename = filename;
    });
  }

  next();
};

const uploadToS3 = null;

module.exports = {
  upload,
  setFilename
};
