const router = require("express").Router();
const controllers = require('../controllers');
const validations = require('../validations/inventory');
const universal = require('../../utils');
const { upload } = require('../services/fileUpload');
const validateId = require('../middleware/validateId');

// Inventory management routes
router.post("/add-product", 
  validations.create,
  controllers.inventory.addProductToInventory
);

router.get("/", 
  controllers.inventory.getAll
);

router.get("/:id", validateId, controllers.inventory.getById);

router.put("/:id", 
  validations.update,
  controllers.inventory.updateById
);

router.put("/:id/status", 
  controllers.inventory.updateStatus
);

router.get("/status/low-stock",
  controllers.inventory.getLowStock
);

router.get("/location/nearby",
  controllers.inventory.getNearby
);

router.post("/import", 
  upload.single('file'),
  controllers.inventory.importInventory
);

router.get("/:id/transactions", 
  controllers.inventory.getTransactions
);

router.get("/product/:productId", 
  controllers.inventory.getByProduct
);

module.exports = router; 