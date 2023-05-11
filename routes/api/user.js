const express = require("express");
const { check, validationResult } = require("express-validator");
const router = express.Router();
const User = require("../../models/User");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const nodemailer = require("nodemailer");

// Get single User

router.get("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const user = await User.findOne({ _id: id });
    res.json(user);
  } catch (err) {
    res.status(500).json(err.message);
  }
});

//Get all users

router.get("/", async (req, res) => {
  try {
    const user = await User.find();
    res.json(user);
  } catch (err) {
    res.status(500).json(err.message);
  }
});

// Update userByID
router.put("/:id", async (req, res) => {
  const id = req.params.id;
  const updateuser = req.body;

  try {
    const user = await User.findOne({ _id: id });
    if (!user) {
      return res.status(404).json({ error: "user dosen't exist" });
    } else {
      const userUpdated = await User.findOneAndUpdate(
        { _id: id },
        { $set: { ...updateuser } }
      );
      res.json(userUpdated);
    }
  } catch (err) {
    res.status(500).json(err);
  }
});

// Delete user
router.delete("/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const user = await User.findOne({ _id: id });
    if (!user) {
      return res.status(404).json({ error: "user dosen't exist" });
    } else {
      const userDeleted = await User.findOneAndDelete({ _id: id });
      res.json(userDeleted);
    }
  } catch (err) {
    res.status(500).json(err);
  }
});

//Add user
router.post(
  "/adduser",
  [check("email", "Please include a valid email").isEmail()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { firstName, lastName, email, role, userId } = req.body;

    const password = "";

    try {
      let user = await User.findOne({ email });

      if (user) {
        return res.status(401).json({ error: "User already exists" });
      }
      let verified = true;
      user = new User({
        firstName,
        lastName,
        email,
        password,
        role,
        userId,
        verified,
      });

      await user.save();
      res.status(200).json({ success: "User added with Success" });

      User.findOne({ email: email }, function (error, userData) {
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

          const token = jwt.sign(payload, secret);
          var currentDateTime = new Date();
          var mailOptions = {
            from: `${process.env.EMAIL_USER}`,
            to: email,
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
    
         <div style="padding-left:40px; padding-right:40px; padding-top:20px">
         <h3 style="text-align: left;color:#1A2028;">Salut ${userData.firstName},</h3>
         <p style="text-align: left;color:#1A2028;font-size: 14px;margin-bottom:50px">
         Votre mot de passe peut être crée en cliquant sur le bouton ci-dessous. 
         </p>
        </div>
     
         <a style="margin-left:0px;margin-right:0px; margin-top:50px; margin-bottom:50px;background-color:#4368B1;color:white;padding-top:10px;padding-bottom:10px;border-color:#4368B1;padding-left:20px;padding-right:20px;border-radius: 2px;text-decoration: none;" href=${process.env.SAAS_DASH_APP}/change-password/${userData.email}/${token}>Créer un mot de passe</a>
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
            if (err) throw err;
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
    } catch (err) {
      res.status(500).send(err);
    }
  }
);

module.exports = router;
