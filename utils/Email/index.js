const config = require('config');
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: config.get('EMAIL_SERVICE.AUTH.USER'),
        pass: config.get('EMAIL_SERVICE.AUTH.PASS')
    },
    tls: {
        rejectUnauthorized: false
    }
});

const sendEmail = async (to, subject, message) => {
    return await transporter.sendMail({
        from: config.get('EMAIL_SERVICE.AUTH.USER'),
        to: to,
        subject: subject,
        text: message,
        html: message,
    });
}

module.exports = {
    sendEmail
}