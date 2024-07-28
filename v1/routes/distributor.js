const router = require("express").Router();
const controllers = require('../controllers');

router.post("/", controllers.distributor.create);
router.get("/", controllers.distributor.getAll);
router.get("/:id", controllers.distributor.getById);
router.put("/:id", controllers.distributor.updateById);
router.get("/firm/:id", controllers.distributor.getFirms);
module.exports = router;
