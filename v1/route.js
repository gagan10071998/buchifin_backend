const express = require('express');
const Routes = require('./routes/');
const { skusRouter } = require('./routes/skus');
const { retailerV2Router } = require('./routes/retailerV2');
const router = express();

router.use('/auth', Routes.auth)
  .use('/retailer', Routes.retailer)
  .use('/agronomist', Routes.agronomist)
  .use('/manufacturer', Routes.manufacturer)
  .use('/company', Routes.company)
  .use('/document', Routes.document)
  .use('/category', Routes.category)
  .use('/product', Routes.product)
  .use('/inventory', Routes.inventory)
  .use('/order', Routes.order)
  .use('/skus', skusRouter)
  .use('/retailerV2', retailerV2Router)

module.exports = router;
