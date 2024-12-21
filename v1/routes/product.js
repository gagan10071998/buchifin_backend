const router = require("express").Router();
const controllers = require('../controllers');
const validations = require('../validations/product');
const universal = require('../../utils');
const { upload } = require('../services/fileUpload');

// Product management routes
router.post("/create", 
  validations.create,
  controllers.product.create
);

router.get("/", 
  controllers.product.getAll
);

router.get("/:id", 
  controllers.product.getById
);

router.put("/:id", 
  validations.update,
  controllers.product.updateById
);

router.put("/:id/approve", 
  controllers.product.approve
);

router.put("/:id/status", 
  controllers.product.updateStatus
);

router.post("/import", 
  upload.single('file'),
  controllers.product.importProducts
);

module.exports = router; 