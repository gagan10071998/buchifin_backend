const config = require("config");
const USER_TYPES = config.get('USER_TYPES');
const validations = require("../validations");
const universal = require("../../utils");
const MESSAGES = require("../../constants").Messages;
const CODES = require("../../constants").Codes;
const Models = require('../../models');
const ObjectId = require('mongoose').Types.ObjectId;
const Projections = require('../projections').auth;
const OTP_TYPES = config.get('OTP_TYPES');
const { startSession } = require('mongoose');

module.exports = {
  login: async (req, res, next) => {
    try {
      await validations.auth.validateLogin(req, 'body');

      const query = req.body.email ? { email: req.body.email } : { phone: req.body.phone };

      const admin = await Models.User.findOne(query, Projections.login).lean();

      if (!admin) throw new Error(MESSAGES.USER_NOT_EXIST);

      const isPasswordMatched = await universal.comparePasswordUsingBcrypt(req.body.password, admin.password);
      if (!isPasswordMatched) throw new Error(MESSAGES.PASSWORD_NOT_MATCH);

      delete admin.password;
      admin.auth = await universal.jwtSign({ _id: admin._id })
      const tokenPayload = {
        token: admin.auth.token,
        user: admin._id,
        refreshToken: admin.auth.refreshToken,
      };

      if (!tokenPayload.token) throw new Error(MESSAGES.MAX_LOGINS_REACHED);

      await Models.AuthToken(tokenPayload).save();

      return await universal.response(res, CODES.OK, MESSAGES.USER_LOGGED_IN_SUCESSFULLY, admin, req.lang);
    } catch (error) {
     
      next(error);
    }
  },
  logout: async (req, res, next) => {
    try {
      const userUpdateCondition = { _id: new ObjectId(req.user._id) };
      const tokenDeleteCondition = { token: req.headers['authorization'] };

      await Promise.all([
        Models.User.findOneAndUpdate(userUpdateCondition, { deviceToken: "" }).lean(),
        Models.AuthToken.deleteOne(tokenDeleteCondition)
      ]);

      return await universal.response(res, CODES.OK, MESSAGES.USER_LOGGED_OUT_SUCCESSFULLY, {}, req.lang);
    } catch (error) {
     
      next(error);
    }
  },
  refreshToken: async (req, res, next) => {
    const session = await startSession();
    try {
      session.startTransaction();
      
      const oldTokenRecord = await Models.AuthToken.findOne({ refreshToken: req.headers['authorization'] }).session(session).lean();
      if (!oldTokenRecord) throw new Error(MESSAGES.INVALID_REFRESH_TOKEN);

      await Models.AuthToken.deleteOne({ refreshToken: req.headers['authorization'] }).session(session);
      const auth = await universal.jwtSign({ _id: oldTokenRecord.user });

      const tokenPayload = {
        token: auth.token,
        user: oldTokenRecord.user,
        refreshToken: auth.refreshToken
      };

      await new Models.AuthToken(tokenPayload).save({ session });

      await session.commitTransaction();

      delete tokenPayload.user;
      return await universal.response(res, CODES.OK, MESSAGES.NEW_TOKEN_GENERATED, tokenPayload, req.lang);
    } catch (error) {
      await session.abortTransaction();
     
      next(error);
    } finally {
      session.endSession();
    }
  },
  changePassword: async (req, res, next) => {
    try {
      await validations.auth.validateChangePassword(req, 'body');
      
      const { oldPassword, newPassword } = req.body;
      const admin = req.user;
  
      const isPasswordMatched = await universal.comparePasswordUsingBcrypt(oldPassword, admin.password);
      if (!isPasswordMatched) throw new Error(MESSAGES.OLD_PASSWORD_IS_INCORRECT);
  
      const hashedNewPassword = await universal.hashPasswordUsingBcrypt(newPassword);
      await Models.User.findOneAndUpdate({ _id: admin._id }, { password: hashedNewPassword });
  
      return await universal.response(res, CODES.OK, MESSAGES.PASSWORD_CHANGED_SUCCESSFULLY, {}, req.lang);
    } catch (error) {
     
      next(error);
    }
  },  
  forgotPassword: async (req, res, next) => {
    try {
      await validations.auth.validateForgotPassword(req, 'body');
      
      const query = req.body.email ? { email: req.body.email } : { phone: req.body.phone, countryCode: req.body.countryCode };
      if (!await Models.User.findOne(query, Projections.login).lean()) throw new Error(MESSAGES.USER_NOT_EXIST);
  
      const currentOTP = await Models.Otp.findOne({ ...req.body, type: OTP_TYPES.FORGOT }).lean();
      if (currentOTP && currentOTP.expireAt >= new Date()) throw new Error(MESSAGES.OTP_ALREADY_SENT);
  
      const newOTP = await universal.generateOtp();
      await Models.Otp({ ...req.body, type: OTP_TYPES.FORGOT, code: newOTP, expireAt: new Date(Date.now() + config.get('OTP_OPTIONS').EXPIRES * 60000) }).save();
      
      return await universal.response(res, CODES.OK, MESSAGES.OTP_SENT_SUCCESSFULLY, { code: newOTP }, req.lang);
    } catch (error) {
     
      next(error);
    }
  },
  resetPassword: async (req, res, next) => {
    const session = await startSession();
    try {
      session.startTransaction();
      
      await validations.auth.validateResetPassword(req, 'body');
      const query = req.body.email ? { email: req.body.email } : { phone: req.body.phone, countryCode: req.body.countryCode };
  
      if (!await Models.User.findOne(query, Projections.login).lean()) throw new Error(MESSAGES.USER_NOT_EXIST);
  
      const OTP = await Models.Otp.findOne({ code: req.body.code, email: req.body.email, type: OTP_TYPES.FORGOT }).lean();
      if (!OTP) throw new Error(MESSAGES.INVALID_OTP);
      if (OTP.expireAt < new Date()) throw new Error(MESSAGES.OTP_EXPIRED);
  
      const hashedPassword = await universal.hashPasswordUsingBcrypt(req.body.password);
      await Models.User.findOneAndUpdate(query, { password: hashedPassword }).session(session);
      await Models.Otp.findOneAndDelete(req.body).session(session);
  
      await session.commitTransaction();
  
      return await universal.response(res, CODES.OK, MESSAGES.PASSWORD_RESET_SUCCESSFULLY, {}, req.lang);
    } catch (error) {
      await session.abortTransaction();
     
      next(error);
    } finally {
      session.endSession();
    }
  }
  
}


