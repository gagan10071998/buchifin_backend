const config = require("config");
const Model = require("../../models");
const universal = require("../../utils");
const codes = require("../../constants").Codes;
const messages = require("../../constants").Messages;
const moment = require("moment");
const EmailService = require("../../utils").emailService;
const mongoose = require("mongoose");
let PROJECTION = {
  CREATE: { __v: 0, createdAt: 0, updatedAt: 0, isDeleted: 0, facebookId: 0, deviceType: 0, deviceToken: 0, password: 0, isBlocked: 0 },
  FIND: { __v: 0, updatedAt: 0, isDeleted: 0, facebookId: 0, deviceType: 0, deviceToken: 0, isBlocked: 0, isRead: 0, userId: 0 },
};
const Create = async (createObj) => {
  try {
    if (createObj.userId) createObj.category = mongoose.Types.ObjectId(createObj.userId);
    let notification = await Model.Notification(createObj).save();
    notification = await Model.Notification.findById(notification._id, PROJECTION.CREATE).lean().exec();
    return { status: codes.OK, message: messages.FUEL_PRODUCT_SAVED_SUCCESSFULLY, data: notification };
  } catch (error) {
    throw new Error(error);
  }
};
const Find = async (findObj,page=1) => {
  try {
    if (findObj.userId) findObj.userId = mongoose.Types.ObjectId(findObj.userId);
    let notifications = await Model.Notification.find(findObj, PROJECTION.FIND).sort({ createdAt: -1 }).skip((page-1)*10).limit(10).lean().exec();
    return { status: codes.OK, message: messages.FUEL_PRODUCTS_FETCHED_SUCCESSFULLY, data: notifications };
  } catch (error) {
    throw new Error(error);
  }
};
const Update = async (id, updateObj) => {
  try {
    let product = await Model.FuelProduct.findByIdAndUpdate(mongoose.Types.ObjectId(id), updateObj).lean().exec();
    product = await Model.FuelProduct.findById(product._id, PROJECTION.CREATE).lean().exec();
    return { status: codes.OK, message: messages.FUEL_PRODUCT_UPDATED_SUCCESSFULLY, data: product };
  } catch (error) {
    throw new Error(error);
  }
};
const UpdateMany = async (findObj, setObj) => {
  try {
    let products = await Model.FuelProduct.updateMany(findObj, { $set: setObj });
    return { status: codes.OK, message: messages.FUEL_PRODUCTS_UPDATED_SUCCESSFULLY, data: products };
  } catch (error) {
    throw new Error(error);
  }
};
const Pagination = async (findObj) => {
  try {
    let pipeline = [];
    let query = { isRead: false };
    if (findObj.userId) query.userId = mongoose.Types.ObjectId(findObj.userId);
    /*
    Match Query
    */
    pipeline.push({ $match: query });
    /*
    Search Query
    */
    if (findObj.search) {
      let search = findObj.search;
      pipeline.push({
        $match: {
          $or: [
            { title: { $regex: search, $options: "i" } },
            { body: { $regex: search, $options: "i" } },
            { image: { $regex: search, $options: "i" } },
            { message: { $regex: search, $options: "i" } },
          ],
        },
      });
    }
    let TotalRecords = (await Model.Notification.aggregate(pipeline).exec()).length; // records count
    /*
    Sorting
    */
    if (findObj.sort) pipeline.push({ $sort: { createdAt: -1 } });
    /*
    Pagination
    */
    let skip = 0;
    let limit = 10;
    if (findObj.limit) limit = Number(findObj.limit);
    if (findObj.page) skip = (findObj.page - 1) * limit;
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limit });
    let PageCount = Math.ceil(TotalRecords / limit);
    /*
    Projection
    */
    pipeline.push({ $project: PROJECTION.FIND });
    let notifications = await Model.Notification.aggregate(pipeline).exec();
    return { status: codes.OK, message: messages.FUEL_PRODUCTS_FETCHED_SUCCESSFULLY, data: { notifications: notifications, pages: PageCount } };
  } catch (error) {
    throw new Error(error);
  }
};
module.exports = {
  Create,
  Find,
  Update,
  UpdateMany,
  Pagination,
};
