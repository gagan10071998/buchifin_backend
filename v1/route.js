const express = require('express');
const Routes = require('./routes/');
const router = express();
router.use('/auth', Routes.auth);
router.use('/retailer', Routes.retailer);
router.use('/manufacturer', Routes.manufacturer);
router.use('/company', Routes.company);
module.exports = router;