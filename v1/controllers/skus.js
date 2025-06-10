const { Sku } = require('../../models/skus');
const { sendResponse } = require('../../utils/sendResponse');

const getAllGroupedBySkus = async (req, res, next) => {
  try {
    const skus = await Sku.aggregate([{
      $group: {
        _id: "$type",
        skus: { $push: { value: "$value", code: "$code", type: '$type' } }
      }
    }]);

    return sendResponse(res, 'All skus fetched!', { skus });
  } catch (error) {
    next(error)
  }
};

module.exports = { getAllGroupedBySkus }