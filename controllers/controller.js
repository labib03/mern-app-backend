import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import otpGenerator from "otp-generator";
import ENV from "../config.js";
import { jwt_exp_time, saltRound } from "../helpers/variable.js";
import UserModel from "../models/User.model.js";

/** middleware for verify user */
export async function verifyUser(req, res, next) {
  try {
    const { userName } = req.method === "GET" ? req.query : req.body;

    if (!userName) {
      return res
        .status(404)
        .json({ status: "FAILED", message: "You must input username" });
    }

    // check the user existence
    let exist = await UserModel.findOne({ userName });
    if (!exist)
      return res.status(403).json({
        status: "FAILED",
        message: `Sorry user with username ${userName} is not found`,
      });
    next();
  } catch (error) {
    return res
      .status(404)
      .json({ status: "FAILED", error: "Authentication Error" });
  }
}

/** POST: http://localhost:8080/api/register
 * @param : {
  "username" : "example123",
  "password" : "admin123",
  "email": "example@gmail.com",
  "firstName" : "bill",
  "lastName": "william",
  "mobile": 8009860560,
  "address" : "Apt. 556, Klas Light, Gwenborough",
  "profile": ""
}
 */
export async function register(req, res) {
  try {
    const { userName, password, profile, email } = req.body;

    // // check the existing user
    // const existUsername = await UserModel.findOne({ userName });
    // const existEmail = await UserModel.findOne({ email });
    // if (existEmail && existUsername) {
    //   return res
    //     .status(302)
    //     .json({ status: "FAILED", message: "email and username already used" });
    // }
    //
    // if (existEmail) {
    //   return res
    //     .status(302)
    //     .json({ status: "FAILED", message: "email already used" });
    // }
    //
    // if (existUsername) {
    //   return res
    //     .status(302)
    //     .json({ status: "FAILED", message: "username already used" });
    // }

    // encrypting password
    const encryptedPassword = await bcrypt.hash(password, saltRound);

    UserModel.create({
      email,
      userName,
      password: encryptedPassword,
      profile: profile || "",
    })
      .then(() => {
        return res.status(201).json({
          status: "SUCCESS",
          message: "User Register Successfully",
        });
      })
      .catch((err) => {
        const error_key = Object.keys(err.keyPattern);
        const messageError = `${error_key.join().toLowerCase()} already used`;
        return res.status(404).json({
          status: "FAILED",
          message: messageError || "Register User Failed",
          error: { field: error_key },
        });
      });
  } catch (error) {
    return res
      .status(500)
      .json({ status: "FAILED", message: "something went wrong" });
  }
}

/** POST: http://localhost:8080/api/login
 * @param: {
  "username" : "example123",
  "password" : "admin123"
}
 */
export async function login(req, res) {
  const { userName, password } = req.body;

  try {
    const user = await UserModel.findOne({ userName });

    const comparePassword = await bcrypt.compare(password, user.password);

    if (!comparePassword) {
      return res
        .status(403)
        .json({ status: "FAILED", message: "Wrong password !" });
    }

    //   creating jwt token
    const token = jwt.sign(
      {
        userId: user._id,
        userName: user.userName,
      },
      ENV.JWT_SECRET,
      { expiresIn: jwt_exp_time },
    );

    return res.status(200).json({
      status: "SUCCESS",
      message: "Login Successful...!",
      userName: user.userName,
      token,
    });
  } catch (error) {
    return res.status(500).json({
      status: "FAILED",
      message: "Something went wrong",
      error,
    });
  }
}

/** GET: http://localhost:8080/api/user/example123 */
export async function getUser(req, res) {
  const { userName } = req.params;

  try {
    const user = await UserModel.findOne({ userName });

    if (!user) {
      return res
        .status(403)
        .json({ status: "FAILED", message: "Can't Find the User" });
    }

    /** remove password from user */
    const { password, ...rest } = Object.assign({}, user.toJSON());
    return res.status(201).json({
      status: "SUCCESS",
      message: "Get data user success",
      data: rest,
    });
  } catch (error) {
    return res
      .status(404)
      .json({ status: "FAILED", message: "Cannot Find User Data", error });
  }
}

/** PUT: http://localhost:8080/api/updateUser
 * @param: {
  "header" : "<token>"
}
 body: {
    firstName: '',
    address : '',
    profile : ''
}
 */
export async function updateUser(req, res) {
  try {
    const { userId } = req.userAuth;

    const user = await UserModel.findOne({ _id: userId });

    if (!user) {
      return res
        .status(404)
        .json({ status: "FAILED", message: "User not found" });
    }

    const body = req.body;

    UserModel.updateOne({ _id: userId }, body)
      .then(() => {
        return res.status(200).json({
          status: "SUCCESS",
          message: "Update user success",
        });
      })
      .catch((err) => {
        const error_key = Object.keys(err.keyPattern);
        const messageError = `${error_key.join().toLowerCase()} already used`;
        return res.status(404).json({
          status: "FAILED",
          message: messageError || "Update failed",
          error: { field: error_key },
        });
      });
  } catch (error) {
    return res
      .status(401)
      .json({ status: "FAILED", message: "Something went wrong", error });
  }
}

/** GET: http://localhost:8080/api/generateOTP */
export async function generateOTP(req, res, next) {
  const { userName } = req.body;
  try {
    req.app.locals.OTP = await otpGenerator.generate(6, {
      lowerCaseAlphabets: false,
      upperCaseAlphabets: false,
      specialChars: false,
    });
    req.app.locals.userName = userName;
    next();
  } catch (error) {
    return res
      .status(500)
      .json({ status: "FAILED", message: "Failed to generate OTP", error });
  }
}

/** GET: http://localhost:8080/api/verifyOTP */
export async function verifyOTP(req, res) {
  const { code, userName } = req.query;
  const { userName: localUsername } = req.app.locals;

  if (userName !== localUsername) {
    return res
      .status(403)
      .json({ status: "FAILED", message: "Username not match" });
  }

  if (parseInt(req.app.locals.OTP) === parseInt(code)) {
    req.app.locals.OTP = null; // reset the OTP value
    req.app.locals.userName = null; // reset the username value on local variable
    req.app.locals.resetSession = true; // start session for reset password
    return res.status(201).json({
      status: "SUCCESS",
      message: "Verify Successsfully!",
    });
  }
  return res.status(400).json({ status: "FAILED", message: "Invalid OTP" });
}

// successfully redirect user when OTP is valid
/** GET: http://localhost:8080/api/createResetSession */
export async function createResetSession(req, res) {
  if (req.app.locals.resetSession) {
    return res.status(201).json({ flag: req.app.locals.resetSession });
  }
  return res
    .status(440)
    .json({ status: "FAILED", message: "Session expired!" });
}

// update the password when we have valid session
/** PUT: http://localhost:8080/api/resetPassword */
export async function resetPassword(req, res) {
  // local variable
  const { resetSession } = req.app.locals;

  try {
    if (!resetSession)
      return res
        .status(440)
        .json({ status: "FAILED", message: "Session expired!" });

    const { id, password } = req.body;

    const user = await UserModel.findOne({ _id: id });

    if (!user) {
      return res.status(404).json({
        status: "FAILED",
        message: `User not Found`,
      });
    }

    const encryptedPassword = await bcrypt.hash(password, saltRound);
    const newPassword = {
      password: encryptedPassword,
    };

    UserModel.updateOne({ userName: user.userName }, newPassword)
      .then(() => {
        req.app.locals.resetSession = false; // reset session
        return res.status(201).json({
          status: "SUCCESS",
          message: "Your password has been successfully changed",
        });
      })
      .catch((err) => {
        return res.status(201).json({
          status: "FAILED",
          message: "Your password has failed to change",
          error: err,
        });
      });
  } catch (error) {
    return res
      .status(401)
      .json({ status: "FAILED", message: "Something went wrong", error });
  }
}
