const express = require("express");
const { check, validationResult } = require("express-validator");
const auth = require("../../middleware/auth");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../../models/User");
const dotenv = require("dotenv");
require("dotenv").config();
const nodemailer = require("nodemailer");

// @route    GET api/auth
router.get("/", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    res.json(user);
  } catch (err) {
    res.status(500).send("Server Error");
  }
});

// @route    POST api/auth

router.post(
  "/",
  [check("email", "please enter valid mail").isEmail()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(401).json({ errors: errors.array() });
    }
    const { password, email } = req.body;

    try {
      let user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ errors: [{ msg: "User not found" }] });
      }
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ errors: [{ msg: "Invalid Password" }] });
      }
      const payload = {
        user: {
          _id: user.id,
          verified: user.verified,
        },
      };

      jwt.sign(
        payload,
        process.env.jwtSecret,
        { expiresIn: 360000 },
        (err, token) => {
          if (err) throw err;
          res.status(200).json({ token });
        }
      );
    } catch (err) {
      res.status(500).send(err.message);
    }
  }
);
// Update profile

router.put("/update/:id", async (req, res) => {
  try {
    const salt = await bcrypt.genSalt(10);
    let newPassword;
    req.body.password
      ? (newPassword = await bcrypt.hash(req.body.password, salt))
      : "";

    newUserDetails = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      password: newPassword,
    };
    const user = await User.findOneAndUpdate(
      { _id: req.params.id },
      { $set: { ...newUserDetails } },
      { new: true }
    ).select("-password");
    await user.save();
    res.json(user);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

//reset password
router.post("/reset", function (req, res) {
  User.findOne({ email: req.body.email }, function (error, userData) {
    if (!userData)
      return res.status(404).json({
        success: false,
      });
    else {
      var transporter = nodemailer.createTransport({
        host: `${process.env.SMTP_HOST}`,
        port: `${process.env.SMTP_PORT}`,
        secure: false,
        requireTLS: true,
        auth: {
          user: `${process.env.EMAIL_USER}`,
          pass: `${process.env.EMAIL_PASSWORD}`,
        },
      });

      const secret = `${process.env.JWT_SECRET}` + userData.password;
      const payload = {
        email: userData.email,
        id: userData.id,
      };

      const token = jwt.sign(payload, secret, {
        expiresIn: `${process.env.JWT_EXPIRATION_TIME}`,
      });

      var currentDateTime = new Date();
      var mailOptions = {
        from: `${process.env.EMAIL_USER}`,
        to: req.body.email,
        subject: "Password Reset",
        text: "Password Reset",
        html: `
        <!DOCTYPE htmlPUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
        <html xmlns="http://www.w3.org/1999/xhtml" lang="en">
         <head>
            <meta charset="utf-8">
            <title>Email</title>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">
         </head>
         <body style="text-align: center;margin-top:20px">
  <img src="https://i.ibb.co/1s6hxt6/steer.png" alt="steer" border="0">
         <h1 style="color:#1A2028;">Reset Password</h1>
         <div style="padding-left:40px; padding-right:40px; padding-top:20px">
         <h3 style="text-align: left;color:#1A2028;">Salut ${userData.firstName},</h3>
         <p style="text-align: left;color:#1A2028;font-size: 14px;margin-bottom:50px">

Votre mot de passe peut être réinitialisé en cliquant sur le bouton ci-dessous. Si vous n'avez pas fait de
demande de changement de mot de passe, merci d'ignorer cet e-mail. Aucune modification ne sera apportée à votre compte.
         </p>
        </div>
     
         <a style="margin-left:0px;margin-right:0px; margin-top:50px; margin-bottom:50px;background-color:#4368B1;color:white;padding-top:10px;padding-bottom:10px;border-color:#4368B1;padding-left:20px;padding-right:20px;border-radius: 2px;text-decoration: none;" href=${process.env.SAAS_DASH_APP}/change-password/${userData.email}/${token}>Réinitialiser le mot de passe</a>
         <div style="background-color:#4368B1;color:white;padding:20px;margin-top:50px" width="200" >
         <div>
         <a href="https://www.linkedin.com/company/76978849/admin/" style="margin:10px"><img src="https://i.ibb.co/n0hB2qX/Group-2.png" alt="linkedin" border="0"></a>
         <a href="https://www.facebook.com/SteerSolutions" style="margin:10px"><img src="https://i.ibb.co/XCZ4XnN/Group-1.png" alt="facebook" border="0"></a>
        <a href="https://www.instagram.com/steer.ai.solutions/" style="margin:10px"><img src="https://i.ibb.co/qjcHFdW/Group.png" alt="instagram" border="0"></a>
        </div>
        <p style="text-align:center">app.pre-prod.steerai.autos</p>
        </div>
 </body>
 </html>
      `,
      };

      transporter.sendMail(mailOptions, function (error, info) {
        if (error) res.send(error);
        User.updateOne(
          { email: userData.email },
          {
            token: currentDateTime,
          },
          { multi: true },
          function (resp) {
            return res.status(200).json({
              success: true,
              msg: info.response,
              userlist: resp,
            });
          }
        );
      });
    }
  });
});

router.get("/verifytoken/:email/:token", async (req, res) => {
  User.findOne({ email: req.params.email }).then(async (userData) => {
    const secret = `${process.env.JWT_SECRET}` + userData.password;
    const token = req.params.token;

    try {
      const payload = jwt.verify(token, secret);

      res.send("valid signature");
    } catch (error) {
      res.send(`${error.message}`);
    }
  });
});

router.post("/resetpassword", async (req, res) => {
  User.findOne({ email: req.body.email }).then(async (userData) => {
    if (!userData) res.json("dosen't exixst");
    else {
      const secret = `${process.env.JWT_SECRET}` + userData.password;
      const token = req.body.token;

      try {
        const payload = jwt.verify(token, secret);

        const salt = await bcrypt.genSalt(10);

        const { password } = req.body;

        const newPassword = await bcrypt.hash(password, salt);

        const match = bcrypt.compareSync(password, userData.password);

        if (match) {
          res.send({
            error: "Password Used Try Again",
          });
        } else {
          User.findOneAndUpdate(
            { _id: userData._id },
            { $set: { password: newPassword } }
          )

            .then((user) =>
              res.send({ succes: "mot de passe modifié avec succée" })
            )
            .catch((err) => res.send(err));
        }
      } catch (error) {
        res.send({ error: "link has been used or expired" });
      }
    }
  });
});

router.post("/verifyaccount", async (req, res) => {
  User.findOne({ email: req.body.email }).then(async (userData) => {
    console.log(req.body.verified);
    if (!userData) res.json("dosen't exixst");
    else {
      const secret = `${process.env.JWT_SECRET}` + userData.password;
      const token = req.body.token;

      try {
        const payload = jwt.verify(token, secret);

        User.updateOne(
          { _id: userData._id },
          { $set: { verified: req.body.verified } }
        )
          .then((user) => res.send({ succes: "account verified" }))
          .catch((err) => res.send(err));
      } catch (error) {
        console.log(error);
        res.send({ error: "link has been used or expired" });
      }
    }
  });
});

module.exports = router;
