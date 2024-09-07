const router = require("express").Router();
const controllers = require('../controllers');

router.get("/:id", controllers.document.getById);
module.exports = router;
