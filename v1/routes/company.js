const router = require("express").Router();
const controllers = require('../controllers');
const {upload} = require('../services');

router.post("/update/id", upload.upload.fields([
    { name: 'gst[doc][front]', maxCount: 1 },
    { name: 'gst[doc][back]', maxCount: 1 },
    { name: 'registrationCertificate[doc][front]', maxCount: 1 },
    { name: 'registrationCertificate[doc][back]', maxCount: 1 },
    { name: 'license[doc][front]', maxCount: 1 },
    { name: 'license[doc][back]', maxCount: 1 },
    { name: 'aadhaar[doc][front]', maxCount: 1 },
    { name: 'aadhaar[doc][back]', maxCount: 1 },
    { name: 'pan[doc][front]', maxCount: 1 },
    { name: 'pan[doc][back]', maxCount: 1 },
    { name: 'bankDetails[cancelCheque][front]', maxCount: 1 },
    { name: 'bankDetails[cancelCheque][back]', maxCount: 1 },
    ...Array.from({ length: 3 }).flatMap((_, index) => [
        { name: `documents[${index}][doc][front]`, maxCount: 1 },
        { name: `documents[${index}][doc][back]`, maxCount: 1 }
    ])
]), upload.setFilename, controllers.company.updateById);



module.exports = router;
