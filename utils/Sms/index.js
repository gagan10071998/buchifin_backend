const config = require('config');
const nodemailer = require("nodemailer");
const fast2sms = require('fast-two-sms');

// create reusable transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // use SSL
    auth: {
        user: config.get('EMAIL_SERVICE').EMAIL,
        pass: config.get('EMAIL_SERVICE').PASSWORD
    },
    tls: {
        rejectUnauthorized: false
    }
});

const sendEmail = async (to, subject, message) => {
    return await transporter.sendMail({
        from: config.get('EMAIL_SERVICE').EMAIL,
        to: to, // list of receivers
        subject: subject,
        text: message,
        html: message, // html body
    })
}

const sendSMS = async (to, message) => {
    try {
        const options = {
            authorization: process.env.FAST2SMS_API_KEY,
            message: message,
            numbers: [to.replace('+91', '')],
            route: "v3",
            flash: 0
        };
        console.log('OPTIONS',options);

        const response = await fast2sms.sendMessage(options);
        console.log('SMS Response:', response);

        if (response.return === true) {
            return true;
        } else {
            throw new Error('Failed to send SMS');
        }
    } catch (error) {
        console.error('SMS sending failed:', error);
        throw error;
    }
};

// Utility function to format phone number
const formatPhoneNumber = (phone, countryCode) => {
    // Remove any non-numeric characters
    phone = phone.replace(/\D/g, '');
    
    // Remove country code if it's at the start of the phone number
    if (phone.startsWith(countryCode.replace('+', ''))) {
        phone = phone.substring(countryCode.replace('+', '').length);
    }
    
    return phone;
};

module.exports = {
    sendEmail,
    sendSMS,
    formatPhoneNumber
}