const config = require('config');
const Model = require("../../models");
const universal = require('../../utils')
const codes = require('../../constants').Codes
const messages = require('../../constants').Messages
const moment = require('moment')
let PROJECTION = {
    Find: { __v: 0, createdAt: 0, updatedAt: 0, isDeleted: 0, facebookId: 0, deviceType: 0, deviceToken: 0, password: 0 },
    FindCustomer: { __v: 0, createdAt: 0, updatedAt: 0, isDeleted: 0, facebookId: 0, deviceType: 0, deviceToken: 0, password: 0 }
}
const Find = async (findObj) => {
    try {
        let actualEmail = findObj.actualEmail
        if (actualEmail) delete findObj.actualEmail
        let otp = await Model.Otp.findOne(findObj).lean().exec()
        if (otp) {
            findObj.isDeleted = false
            await Model.Otp.findByIdAndRemove(otp._id)
            delete findObj.code
            if (!actualEmail) {
                let customer = await Model.Customer.findOneAndUpdate(findObj, { isEmailVerify: true })
                customer = await Model.Customer.findOne(customer._id, PROJECTION.FindCustomer).lean().exec()
                return { status: codes.OK, message: messages.OTP_VERIFIED_SUCCESSFULLY, data: customer }
            }
            else {
                return { status: codes.OK, message: messages.OTP_VERIFIED_SUCCESSFULLY, data: "" }
            }
        }
        else return { status: codes.BAD_REQUEST, message: messages.UNABLE_TO_VERIFY_OTP, data: "" }
    }
    catch (error) {
        throw new Error(error)
    }
}
const Create = async (createObj) => {
    try {
        let OTP = await universal.generateOtp()
        let customer = createObj
        let query = {}
        if (customer.email) query.email = customer.email
        if (customer.phone) {
            query.phone = customer.phone
            query.countryCode = customer.countryCode
        }
        let otp = await Model.Otp.findOneAndDelete(query).lean().exec()
        otp = await Model.Otp({ email: customer.email, phone: customer.phone, countryCode: customer.countryCode, code: OTP, expireAt: moment().add(config.get('OTP_OPTIONS').EXPIRES, config.get('OTP_OPTIONS').IN) }).save()
        otp = await Model.Otp.findById(otp._id, PROJECTION.Find).lean().exec()
        return { status: codes.OK, message: messages.OTP_SENT_SUCCESSFULLY, data: otp }
    }
    catch (error) {
        throw new Error(error)
    }
}
const FindAndUpdate = async (findObj) => {
    try {
        let otp = await Model.Otp.findOne({code:findObj.code}).lean().exec()
        if (otp) {
           console.log(findObj.password);
            await Model.Otp.findByIdAndRemove(otp._id)
            delete findObj.code
            let admin = await Model.Admin.findOneAndUpdate({email: otp.email}, { password: findObj.password }, {new: true})
            admin = await Model.Admin.findOne(admin._id, PROJECTION.Findadmin).lean().exec()
            return { status: codes.OK, message: messages.PASSWORD_CHANGE_SUCCESSFULLY, data: admin }
        }
        else return { status: codes.BAD_REQUEST, message: messages.UNABLE_TO_VERIFY_OTP, data: "" }
    }
    catch (error) {
        throw new Error(error)
    }
}
module.exports = {
    Find,
    Create,
    FindAndUpdate
}