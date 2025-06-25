const { USER_TYPES } = require("../../constants/user-types");
const { User, Product, Inventory } = require("../../models");
const { sendResponse } = require("../../utils/sendResponse");
const {
  manfacturerIdSchema,
  addProductToInventorySchema,
  updateInventoryProductSchema
} = require("../validations/retailerV2");

const getManufacturersList = async (req, res, next) => {
  try {
    const users = await User.find(
      { type: USER_TYPES.MANUFACTURER_ADMIN, isDeleted: false },
      { name: 1 }
    );

    return sendResponse(res, "Manufacturers list fetched!", {
      manufacturers: users
    });
  } catch (error) {
    next(error);
  }
};

const getManufacturerProducts = async (req, res, next) => {
  try {
    const { success, data, error } = manfacturerIdSchema.safeParse(req.params);

    if (!success) {
      return sendResponse(res, "Validation Error", error.flatten(), 400);
    }

    const products = await Product.find(
      { manufacturer: data.manufacturerId, isDeleted: false },
      {
        _id: 1,
        sku: 1,
        name: 1,
        technicalName: 1,
        category: 1
      }
    ).populate({ path: "category", select: "name" });

    return sendResponse(
      res,
      "Inventory list fetched!",
      { products },
    );
  } catch (error) {
    next(error);
  }
};

const addProductToInventory = async (req, res, next) => {
  try {
    const { success, data, error } = addProductToInventorySchema.safeParse(
      req.body
    );

    if (!success) {
      return sendResponse(res, "Validation Error", error.flatten(), 400);
    }

    await Inventory.create({
      product: data.productId,
      retailer: data.manufacturerId,
      quantity: 0
    });
    
    return sendResponse(res, "Product added to inventory successfully");
  } catch (error) {
    next(error);
  }
};

const updateInventoryProduct = async (req, res, next) => {
  try {
    const { inventoryId } = req.params;
    const { success, data, error } = updateInventoryProductSchema.safeParse(
      req.body
    );

    if (!success) {
      return sendResponse(res, "Validation Error", error.flatten(), 400);
    }

    const updatedInventory = await Inventory.findByIdAndUpdate(inventoryId, data, {
      new: true
    });

    if (!updatedInventory) {
      return sendResponse(res, "Inventory not found", null, 404);
    }

    return sendResponse(res, "Inventory updated successfully",  { inventory: updatedInventory });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getManufacturersList,
  getManufacturerProducts,
  addProductToInventory,
  updateInventoryProduct
};
