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
        let retries = 10;
        while (retries > 0) {
            const session = await mongoose.startSession();
            try {
                session.startTransaction();
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
                            await Models.ApiPermission.findOneAndUpdate(
                                query,
                                update,
                                {
                                    upsert: true,
                                    session
                                }
                            ).exec();
                        }
                    }
                }

                await Models.ApiPermission.deleteMany(
                    { path: { $nin: paths } },
                    { session }
                ).exec();

                await session.commitTransaction();
                console.log('Permissions successfully populated!');
                return;
            } catch (error) {
                await session.abortTransaction();
                retries--;
                if (retries === 0) {
                    console.error('Failed to populate permissions after all retries:', error);
                    throw error;
                }
                console.log(`Retrying... ${retries} attempts remaining`);
                await new Promise(resolve => setTimeout(resolve, 1000));
            } finally {
                session.endSession();
            }
        }
    }, 
    seedCategories: async () => {
        let retries = 10;
        while (retries > 0) {
            const session = await mongoose.startSession();
            try {
                session.startTransaction();

                // Get super admin
                const superAdmin = await Models.User.findOne({ type: 'SUPER_ADMIN' });
                if (!superAdmin) {
                    throw new Error('Super admin user not found! Please create super admin first.');
                }

                const categories = require('./permissions/categories');
                let processedCategories = [];

                // First, create all parent categories
                for (const category of categories) {
                    if (!category.parentCategory) {
                        const existingCategory = await Models.Category.findOne(
                            { name: category.name },
                            null,
                            { session }
                        );

                        if (!existingCategory) {
                            const newCategory = await new Models.Category({
                                ...category,
                                createdBy: superAdmin._id,
                                createdByType: 'SUPER_ADMIN'
                            }).save({ session });
                            processedCategories.push(newCategory);
                            console.log(`Created parent category: ${category.name}`);
                        } else {
                            processedCategories.push(existingCategory);
                            console.log(`Parent category already exists: ${category.name}`);
                        }
                    }
                }

                // Then create child categories
                for (const category of categories) {
                    if (category.parentCategory) {
                        const parentCategory = processedCategories.find(
                            pc => pc.name === category.parentCategory
                        );

                        if (!parentCategory) {
                            console.log(`Parent category ${category.parentCategory} not found for ${category.name}`);
                            continue;
                        }

                        const existingCategory = await Models.Category.findOne(
                            { name: category.name },
                            null,
                            { session }
                        );

                        if (!existingCategory) {
                            const newCategory = await new Models.Category({
                                ...category,
                                parentCategory: parentCategory._id,
                                createdBy: superAdmin._id,
                                createdByType: 'SUPER_ADMIN'
                            }).save({ session });
                            processedCategories.push(newCategory);
                            console.log(`Created child category: ${category.name}`);
                        } else {
                            processedCategories.push(existingCategory);
                            console.log(`Child category already exists: ${category.name}`);
                        }
                    }
                }

                await session.commitTransaction();
                console.log('Categories seeding completed successfully!');
                return;
            } catch (error) {
                await session.abortTransaction();
                retries--;
                if (retries === 0) {
                    console.error('Failed to seed categories after all retries:', error);
                    throw error;
                }
                console.log(`Retrying... ${retries} attempts remaining`);
                await new Promise(resolve => setTimeout(resolve, 1000));
            } finally {
                session.endSession();
            }
        }
    } 
};