const express = require("express");
const { getAllGroupedBySkus, getSkuByType, generateUniqueSku } = require("../controllers/skus");

const skusRouter = express.Router();

skusRouter
  .get("/all", getAllGroupedBySkus)
  .get("/:type", getSkuByType)
  .post("/generate", generateUniqueSku);

module.exports = { skusRouter };
