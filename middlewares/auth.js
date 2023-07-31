import jwt from "jsonwebtoken";
import ENV from "../config.js";

/** auth middleware */
export default async function Auth(req, res, next) {
  try {
    // access authorize header to validate request
    const token = req.headers.authorization.split(" ")[1];

    // retrive the user details fo the logged in user
    const decodedToken = await jwt.verify(token, ENV.JWT_SECRET);

    req.userAuth = decodedToken;

    next();
  } catch (error) {
    res
      .status(401)
      .json({ status: "FAILED", message: "Authentication Failed!" });
  }
}

// store variable in local
// reference https://expressjs.com/en/api.html#app.locals
export function localVariables(req, res, next) {
  req.app.locals = {
    userName: null,
    OTP: null,
    resetSession: false,
  };
  next();
}
