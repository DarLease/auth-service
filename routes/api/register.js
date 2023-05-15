const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const { check, validationResult } = require("express-validator");
const User = require("../../models/User");
require("dotenv").config();
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
// @route    POST api/register
router.post("/", async (req, res) => {
  const role = "owner";
  const { phoneNumber, password } = req.body;
  try {
    let user = await User.findOne({ phoneNumber });
    let verified = false;
    if (user) {
      return res.status(401).json({ error: "User already exists" });
    }

    user = new User({
      phoneNumber,
      password,
    });
    // decapitalizing email to avoid conflicts
    user.phoneNumber = user.phoneNumber;
    const salt = await bcrypt.genSalt(10);

    user.password = await bcrypt.hash(password, salt);

    await user
      .save()
      .then((response) => {
        res.status(200).json({ success: 1 });
      })
      .catch((err) => {
        res.status(401).json({ err });
      });

    // if (user) {
    //   var transporter = nodemailer.createTransport({
    //     host: `${process.env.SMTP_HOST}`,
    //     port: `${process.env.SMTP_PORT}`,
    //     secure: false,
    //     requireTLS: true,
    //     auth: {
    //       user: `${process.env.phoneNumber_USER}`,
    //       pass: `${process.env.phoneNumber_PASSWORD}`,
    //     },
    //   });

    //   const secret = `${process.env.JWT_SECRET}` + user.password;
    //   const payload = {
    //     phoneNumber: user.phoneNumber,
    //     id: user._id.toHexString(),
    //   };

    //   const token = jwt.sign(payload, secret, {
    //     expiresIn: `${process.env.JWT_EXPIRATION_TIME}`,
    //   });

    //   // const token = jwt.sign(payload, secret);

    //   var currentDateTime = new Date();
    //   var mailOptions = {
    //     from: `${process.env.phoneNumber_USER}`,
    //     to: user.phoneNumber,
    //     subject: "Verify account !",
    //     text: "Verify account !",
    //     html: `
    //         <!DOCTYPE htmlPUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
    //         <html xmlns="http://www.w3.org/1999/xhtml" lang="en">
    //          <head>
    //             <meta charset="utf-8">
    //             <title>Email</title>
    //             <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">
    //          </head>
    //          <body style="text-align: center;margin-top:20px">
    //   <img src="https://i.ibb.co/1s6hxt6/steer.png" alt="steer" border="0">

    //   <div style="padding-left:40px; padding-right:40px; padding-top:20px">
    //          <h3 style="text-align: left;color:#1A2028;">Salut ${user.firstName},</h3>
    //          <p style="text-align: left;color:#1A2028;font-size: 14px;margin-bottom:50px">

    //          Nous avons reçu une demande de sécurité de votre compte Steer. Veuillez cliquer sur le bouton ci-dessous pour vérifier la propriété de votre compte.
    //          </p>
    //         </div>

    //          <a style="margin-left:0px;margin-right:0px; margin-top:50px; margin-bottom:50px;background-color:#4368B1;color:white;padding-top:10px;padding-bottom:10px;border-color:#4368B1;padding-left:20px;padding-right:20px;border-radius: 2px;text-decoration: none;" href=${process.env.SAAS_DASH_APP}/verify-account/${user.phoneNumber}/${token}>Vérifier votre compte</a>
    //          <div style="background-color:#4368B1;color:white;padding:20px;margin-top:50px" width="200" >
    //          <div>
    //          <a href="https://www.linkedin.com/company/76978849/admin/" style="margin:10px"><img src="https://i.ibb.co/n0hB2qX/Group-2.png" alt="linkedin" border="0"></a>
    //          <a href="https://www.facebook.com/SteerSolutions" style="margin:10px"><img src="https://i.ibb.co/XCZ4XnN/Group-1.png" alt="facebook" border="0"></a>
    //         <a href="https://www.instagram.com/steer.ai.solutions/" style="margin:10px"><img src="https://i.ibb.co/qjcHFdW/Group.png" alt="instagram" border="0"></a>
    //         </div>
    //         <p style="text-align:center">app.pre-prod.steerai.autos</p>
    //         </div>
    //  </body>
    //  </html>
    //       `,
    //   };

    //   // transporter.sendMail(mailOptions, function (error, info) {
    //   //   if (err) throw err;
    //   //   User.updateOne(
    //   //     { phoneNumber: user.phoneNumber },
    //   //     {
    //   //       token: currentDateTime,
    //   //     },
    //   //     { multi: true },
    //   //     function (resp) {
    //   //       return res.status(200).json({
    //   //         success: true,
    //   //         msg: info.response,
    //   //         userlist: resp,
    //   //       });
    //   //     }
    //   //   );
    //   // });
    // }
  } catch (err) {
    res.status(500).send(err.message);
  }
});

module.exports = router;
