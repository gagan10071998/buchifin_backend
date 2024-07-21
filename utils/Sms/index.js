const config = require('config');
const nodemailer = require("nodemailer");
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
module.exports = {
    sendEmail
}