import { Router } from "express";
/** import all controllers */
import * as controller from "../controllers/controller.js";
import { mailController } from "../controllers/mailer.js";
import Auth, { localVariables } from "../middlewares/auth.js";

const router = Router();

/** POST Methods */
router.route("/register").post(controller.register); // register user
router.route("/registerMail").post(mailController); // send the email
router
  .route("/authenticate")
  .post(controller.verifyUser, (req, res) =>
    res.status(200).json({ status: "SUCCESS", message: "User Verified" }),
  ); // authenticate user
router.route("/login").post(controller.verifyUser, controller.login); // login in app

// /** GET Methods */
router.route("/user/:userName").get(controller.getUser); // user with username
router
  .route("/generateOTP")
  .post(
    controller.verifyUser,
    localVariables,
    controller.generateOTP,
    mailController,
  ); // generate random OTP
router.route("/verifyOTP").get(controller.verifyUser, controller.verifyOTP); // verify generated OTP
router.route("/createResetSession").get(controller.createResetSession); // reset all the variables

// /** PUT Methods */
router.route("/updateUser").put(Auth, controller.updateUser); // use to update the user profile
router.put("/resetPassword", controller.resetPassword); // use to reset password

export { router };
