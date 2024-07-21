const Models = require('../models');
const config = require("config");
const universal = require('../utils');
const permissions = require('./permissions')
const mongoose = require('mongoose');
module.exports = {
    createSuperAdmin: async () => {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            let superAdmin = { ...config.get("SUPER_ADMIN") };
            superAdmin.password = await universal.hashPasswordUsingBcrypt(superAdmin.password);
            superAdmin.type = ["SUPER_ADMIN"];
            await Models.User.findOneAndUpdate(
                { email: superAdmin.email, isDeleted: false },
                { $setOnInsert: superAdmin },
                { upsert: true, session }
            );

            await session.commitTransaction();
        } catch (error) {
            console.error("Error while creating/updating super admin:", error);
            await session.abortTransaction();
            throw error; // You can also handle the error differently based on your requirements
        } finally {
            session.endSession();
        }
    },
    createPermissions: async () => {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
          let paths = [];
          for (let path in permissions) {
            paths.push(path);
            for (let userType in permissions[path]) {
              for (let method in permissions[path][userType]) {
                let methodPermission = permissions[path][userType][method];
                let query = {
                  path: path,
                  userType: userType
                };
                let update = {
                  $set: {
                    [`${method}.value`]: methodPermission.value,
                    [`${method}.auth`]: methodPermission.auth
                  }
                };
                await Models.ApiPermission.findOneAndUpdate(query, update, { upsert: true, session }).exec();
              }
            }
          }
      
          await Models.ApiPermission.deleteMany({ path: { $nin: paths } }).session(session).exec();
          await session.commitTransaction();
          console.log('Permissions successfully populated!');
        } catch (error) {
          await session.abortTransaction();
          console.error('Failed to populate permissions:', error);
          throw error;
        } finally {
          session.endSession();
        }
      }
      

};