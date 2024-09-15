const router = require("express").Router();
const controllers = require('../controllers');


router.post("/batch", controllers.manufacturer.createBatch);
router.get("/batch", controllers.manufacturer.getAll);
router.get("/batch/:id", controllers.manufacturer.getById);
router.put("/batch/:id", controllers.manufacturer.updateById);


router.post("/", controllers.manufacturer.create);
router.get("/", controllers.manufacturer.getAll);
router.get("/:id", controllers.manufacturer.getById);
router.put("/:id", controllers.manufacturer.updateById);
router.get("/firm/:id", controllers.manufacturer.getFirms);
module.exports = router;
