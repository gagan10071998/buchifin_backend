const router = require("express").Router();
const controllers = require('../controllers');

/*
On-Boarding
*/
router.post("/login", controllers.auth.login);
router.post("/logout", controllers.auth.logout);
router.post("/refresh_token", controllers.auth.refreshToken);
router.post("/password/change", controllers.auth.changePassword);
router.post("/password/forgot", controllers.auth.forgotPassword);
router.post("/password/reset", controllers.auth.resetPassword);


module.exports = router;