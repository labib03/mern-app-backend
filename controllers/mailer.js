import Mailgen from "mailgen";
import nodemailer from "nodemailer";

import ENV from "../config.js";
import UserModel from "../models/User.model.js";

// https://ethereal.email/create
let nodeConfig = {
  host: "smtp.ethereal.email",
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: ENV.EMAIL, // generated ethereal user
    pass: ENV.PASSWORD, // generated ethereal password
  },
};

let transporter = nodemailer.createTransport(nodeConfig);

let MailGenerator = new Mailgen({
  theme: "default",
  product: {
    name: "Mailgen",
    link: "https://mailgen.js/",
  },
});

/** POST: http://localhost:8080/api/registerMail 
 * @param: {
  "username" : "example123",
  "userEmail" : "admin123",
  "text" : "",
  "subject" : "",
}
*/
export const mailController = async (req, res) => {
  const { userName } = req.body;
  const { OTP } = req.app.locals;

  const user = await UserModel.findOne({ userName });

  const OtpText = `Your Password Recovery OTP is ${OTP}. Verify and recover your password.`;
  const OtpSubject = "Password Recovery OTP";

  // body of the email
  const bodyEmail = {
    body: {
      name: userName,
      intro: OTP
        ? OtpText
        : "Welcome to Author Community! We're very excited to have you on our community.",
      outro:
        "Need help, or have questions? Just reply to this email, we'd love to help.",
    },
  };

  const emailBody = MailGenerator.generate(bodyEmail);

  const message = {
    from: ENV.EMAIL,
    to: user.email,
    subject: OTP ? OtpSubject : "Signup Successful",
    html: emailBody,
  };

  // send mail
  transporter
    .sendMail(message)
    .then(() => {
      return res.status(200).send({
        status: "SUCCESS",
        message: "You should receive an email from us.",
        // data: req.app.locals,
      });
    })
    .catch((error) =>
      res.status(500).send({
        status: "FAILED",
        message: "Failed to send email",
        error,
      }),
    );
};
