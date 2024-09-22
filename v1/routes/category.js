const router = require("express").Router();
const controllers = require('../controllers');

router.post("/", controllers.category.createCategory);
router.get("/", controllers.category.getAllCategories);
router.get("/:id", controllers.category.getCategoryById);
router.put("/:id", controllers.category.updateCategoryById);
module.exports = router;
