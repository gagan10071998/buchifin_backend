const express = require("express");
const { getAllGroupedBySkus } = require('../controllers/skus')

const skusRouter = express.Router();

skusRouter.get('/all', getAllGroupedBySkus);

module.exports = { skusRouter }
