const Messages = require('../langs')
const bcrypt = require('bcryptjs')
const config = require('config')
const jwt = require('jsonwebtoken')
const fs = require("fs");
const path = require("path");
const ffmpeg = require('fluent-ffmpeg')
const Models = require('../models');
const { uploadFileToS3, generatePresignedUrlForDownload } = require('./S3Bucket')
const jwtVerify = async (token, refresh) => {
    try {
        if (!refresh) {
            let tokenExists = await Models.AuthToken.findOne({ token: token, expired: false }).lean();
            if (tokenExists) {
                return jwt.verify(token, config.get("JWT_OPTIONS").SECRET_KEY);
            }
        }
        else {
            let tokenExists = await Models.AuthToken.findOne({ refreshToken: refresh }).lean();
            if (tokenExists) {
                return jwt.verify(token, config.get("JWT_OPTIONS").SECRET_KEY);
            }
        }
        return false;
    } catch (error) {
        return false
    }
}
const { pathToRegexp } = require('path-to-regexp');

const AuthHelper = async (req, res, next) => {
    try {
        const accessToken = req.headers['authorization'];
        if (!accessToken) return res.status(401).send({ message: "No authorization token was found" });

        const decodeData = await jwtVerify(accessToken, req.headers['refresh']);

        if (!decodeData) {
            const temp = await Models.AuthToken.findOneAndUpdate({ token: accessToken }, { expired: true });
            return res.status(401).send({ message: "Invalid authorization token" });
        }

        const userData = await Models.User.findOne({ _id: decodeData._id, isDeleted: false }).lean();
        if (!userData) return res.status(404).send({ message: "User not found" });

        const query = {
            [`${req.method}.value`]: true,
            [`${req.method}.auth`]: true,
            userType: { $in: userData.type }
        }
        let permissions = await Models.ApiPermission.find(query).lean();

        let isAllowed = false;

        for (const permission of permissions) {
            const regex = pathToRegexp(permission.path)
            if (regex.test(req.path)) {
                isAllowed = true
                break
            }
        }

        if (!isAllowed) {
            const permissions = await Models.ApiPermission.find({
                [`${req.method}.value`]: true,
                [`${req.method}.auth`]: true,
                userType: 'ALL',
            }).lean()
            for (const permission of permissions) {
                const regex = pathToRegexp(permission.path)
                if (regex.test(req.path)) {
                    isAllowed = true
                    break
                }
            }
            if (!isAllowed || (isAllowed && !isAllowed[req.method]?.auth && !isAllowed[req.method]?.value)) return res.status(403).send({ message: "Not Authorized" });
        }
        req.user = userData;
        req.userType = req.headers.usertype || 'SUPER_ADMIN'
        next();
    } catch (error) {
        next(error);
    }
}

module.exports = {
    generatePresignedUrlForDownload,
    Authorization: async (req, res, next) => {
        try {
            let isApiAuthFree = false
            const permissions = await Models.ApiPermission.find({
                [`${req.method}.value`]: true,
                [`${req.method}.auth`]: false,
                userType: 'ALL',
            }).lean()

            for (const permission of permissions) {
                const regex = pathToRegexp(permission.path)
                if (regex.test(req.path)) {
                    isApiAuthFree = true
                    break
                }
            }
            if (!isApiAuthFree) {
                return AuthHelper(req, res, next);
            }
            next()

        } catch (error) {
            console.error('Error in Authorization:', error)
            next(error)
        }
    },
    /*
    Response Functions
    */
    handleUploadedFiles: async (s3Datas, files, payload, createdBy, docData, type) => {
        const filesLookup = files.reduce((acc, file) => {
            acc[file.fieldname] = file;
            return acc;
        }, {});
        ; for (const [index, s3Data] of s3Datas.entries()) {
            const docType = s3Data.type;
            const file = filesLookup[docType];
            if (!file || !s3Data) continue;
            const documentDetails = {
                s3Key: s3Data.key,
                url: s3Data.Location,
                documentType: file.mimetype,
                uploadedBy: createdBy,
                originalName: file.originalname,
                size: file.size,
            };

            if (type === "retailer") {
                const userIndex = payload.findIndex(retailer => retailer.user === s3Data.description.user);
                if (userIndex !== -1) {
                    if (file.description.type === "profilePic") {
                        payload[userIndex].profilePic = s3Data.Location;
                        documentDetails.type = "profilePic";
                    } else if (["aadhar", "pan"].includes(file.description.type)) {
                        const doc = payload[userIndex].documents.find(doc => doc.type === file.description.type);
                        if (doc) {
                            doc.url = s3Data.Location;
                            documentDetails.number = doc.number;
                            documentDetails.type = doc.type;
                        }
                    }
                }
            } else if (type === "firm") {
                if (docType === "firmProfilePic") {
                    payload.firmAddress.profilePic = s3Data.Location;
                    documentDetails.type = "profilePic";
                } else {
                    const doc = payload.documents.find(doc => doc.type === file.description.type);
                    if (doc) {
                        doc.url = s3Data.Location;
                        documentDetails.number = doc.number;
                        documentDetails.type = doc.type;
                    }
                }
            }

            docData.push(documentDetails);
        }

        return { updatedPayload: payload };
    },

    errHandler: async (err, req, res, next) => {
        const errorRecord = new Models.ErrorHandler({
            errorMessage: err.message,
            status: err.status,
            details: err.details || '',
            stack: err.stack,
            method: req.method,
            url: req.originalUrl
        });
        await errorRecord.save();
        console.log(errorRecord)
        return res.status(err.status || 500).send({ status: err.status || 500, message: errorRecord, data: {} });
    },
    errMessage: async (res, status, message, lang) => { await res.status(status).send({ status: status, message: Messages[lang][message] }); },
    sucMessage: async (res, status, message, data, lang) => { await res.send({ status: status, message: Messages[lang][message], result: data }); },
    response: async (res, status, message, data, lang = 'en') => {
        if (status != 200) {
            await res.status(status).send({ status: status, message: Messages[lang][message], result: data });
        }
        else {
            await res.status(status).send({ status: status, message: Messages[lang][message], result: data });
        }
    },
    /*
    Bcrypt Functions
    */
    hashPasswordUsingBcrypt: async (password) => { return bcrypt.hashSync(password, 10); },
    comparePasswordUsingBcrypt: async (pass, hash) => { return bcrypt.compareSync(pass, hash) },
    /*
    JWT Functions
    */
    jwtSign: async (payload) => {
        try {
            await Models.AuthToken.deleteMany({ user: payload._id, expired: true });
            // let devicesLoggedIn = await Models.AuthToken.find({ user: payload._id, expired: false }).lean()
            // if (devicesLoggedIn.length === config.get('maxLoginsAllowed')) {
            //     return false
            // }
            let token = jwt.sign(
                { _id: payload._id },
                config.get("JWT_OPTIONS").SECRET_KEY,
                {
                    expiresIn: config.get("JWT_OPTIONS").EXPIRES_IN.TOKEN
                }
            );
            let refreshToken = jwt.sign(
                { _id: payload._id },
                config.get("JWT_OPTIONS").SECRET_KEY,
                {
                    expiresIn: config.get("JWT_OPTIONS").EXPIRES_IN.REFRESH_TOKEN
                }
            );
            return {
                token,
                refreshToken
            }
        } catch (error) {
            throw error;
        }
    },
    jwtVerify,
    /*
    Generate Thumbnail Functions
    */
    generateVideoThumbnail: async (paths, saveLocation) => {
        try {
            ffmpeg(paths)
                .screenshots({
                    filename: paths.split('/')[paths.split('/').length - 1] + "_thumbnail.png",
                    folder: path.join(__dirname, saveLocation),
                    count: 1
                }).on('error', (e) => {
                    console.log({ e })
                    return false
                })
                .on('end', async () => {
                    return true
                })
        } catch (error) {
            throw error;
        }
    },
    /*
    File Functions
    */
    deleteFiles: async (paths) => {
        await paths.forEach(filePath => fs.unlinkSync(path.resolve(__dirname, '..' + filePath)))
        return
    },
    /*
    Email Service
    */
    emailService: require('./Email'),
    /*
    Otp
    */
    generateOtp: async () => {
        try {
            var digits = '0123456789';
            let OTP = '';
            for (let i = 0; i < 4; i++) { OTP += digits[Math.floor(Math.random() * 10)]; }
            return OTP;
        } catch (error) {
            throw error;
        }
    },
    getStatus: (statusString) => {
        const status = {
            "NOT ACCEPTED": 0,
            "ACCEPTED": 1,
            "LOADED": 2,
            "DISPATCHED": 3,
            "ARRIVED": 4,
            "DELIVERED": 5,
            "REJECTED": 6
        }
        console.log({ status: status[statusString] });
        return status[statusString]
    },
    generatePassword: () => {
        const length = 8;
        const lowerCharset = "abcdefghijklmnopqrstuvwxyz";
        const upperCharset = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const numberCharset = "0123456789";
        const specialCharset = "!@#$%^&*()_+=-";

        let password = "";
        password += lowerCharset[Math.floor(Math.random() * lowerCharset.length)];
        password += upperCharset[Math.floor(Math.random() * upperCharset.length)];
        password += numberCharset[Math.floor(Math.random() * numberCharset.length)];
        password += specialCharset[Math.floor(Math.random() * specialCharset.length)];

        const charset = lowerCharset + upperCharset + numberCharset + specialCharset;

        for (let i = 0; i < length - 4; i++) {
            password += charset[Math.floor(Math.random() * charset.length)];
        }

        return password.split('').sort(() => 0.5 - Math.random()).join('');
    },
    uploadFileToS3
}