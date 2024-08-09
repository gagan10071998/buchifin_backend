const router = require("express").Router();
const controllers = require('../controllers');
const {upload} = require('../services')

router.post("/", upload.upload.fields([
    { name: 'aadhaar[doc][front]', maxCount: 1 },
    { name: 'aadhaar[doc][back]', maxCount: 1 },
    { name: 'pan[doc][front]', maxCount: 1 },
    { name: 'pan[doc][back]', maxCount: 1 },
    { name: 'bankDetails[cancelCheque][front]', maxCount: 1 },
    { name: 'bankDetails[cancelCheque][back]', maxCount: 1 },
    ...Array.from({ length: 3 }).flatMap((_, index) => [
        { name: `qualificationDocs[${index}][doc]`, maxCount: 1 },
    ]),
]), upload.setFilename, controllers.agronomist.create);
router.get("/", controllers.agronomist.getAll);
router.get("/:id", controllers.agronomist.getById);

module.exports = router;
