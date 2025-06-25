const express = require("express");
const {
  getManufacturersList,
  getManufacturerProducts,
  addProductToInventory,
  updateInventoryProduct
} = require("../controllers/retailerV2");

const retailerV2Router = express.Router();

retailerV2Router
  .post("/addProductToInventory", addProductToInventory)
  .put("/updateInventoryProduct/:inventoryId", updateInventoryProduct)
  .get("/manufacturer/list", getManufacturersList)
  .get("/manufacturer/:manufacturerId/products", getManufacturerProducts);

module.exports = { retailerV2Router };
