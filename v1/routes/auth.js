const router = require("express").Router();
const controllers = require('../controllers');
const { smsLimiter, emailLimiter } = require('../../middleware/rateLimiter');

/*
On-Boarding
*/
router.post("/login", controllers.auth.login);
router.post("/logout", controllers.auth.logout);
router.post("/refresh_token", controllers.auth.refreshToken);
router.post("/password/change", controllers.auth.changePassword);
router.post("/password/forgot", controllers.auth.forgotPassword);
router.post("/password/reset", controllers.auth.resetPassword);
router.post('/send-email-verification',  controllers.auth.sendEmailVerification);
router.post('/verify-email', controllers.auth.verifyEmail);
router.post('/send-phone-verification',  controllers.auth.sendPhoneVerification);
router.post('/verify-phone', controllers.auth.verifyPhone);


module.exports = router;