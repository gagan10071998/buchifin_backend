const express = require("express");
const { getAllGroupedBySkus, getSkuByType } = require("../controllers/skus");

const skusRouter = express.Router();

skusRouter.get("/all", getAllGroupedBySkus).get("/:type", getSkuByType);

module.exports = { skusRouter };
