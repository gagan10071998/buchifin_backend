const router = require("express").Router();
const controllers = require('../controllers');

router.post("/", controllers.manufacturer.create);
router.get("/", controllers.manufacturer.getAll);
router.get("/:id", controllers.manufacturer.getById);
router.put("/:id", controllers.manufacturer.updateById);
router.get("/firm/:id", controllers.manufacturer.getFirms);
module.exports = router;
