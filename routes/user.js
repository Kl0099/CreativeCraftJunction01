const express = require("express")
const router = express.Router()
const User = require("../module/user")
const { user } = require("../Schema")
const passport = require("passport")
const wrapAsync = require("../utility/wrapAsync")
const { signUp, verfiySignUp, login, LoginVerification, AdminLoginVerficaiton } = require('../Controller/userController')
const Admin = require("../module/Admin")

//user validation funciton
const userValidaiton = (req, res, next) => {
    const result = user.validate(req.body.user)
    if (result.error) {
        req.flash("error", result.error.message)
        res.redirect('/user/signUp')
    } else {
        next()
    }
}

//checking Person who is login is Admin
const AdCheck = async (req, res, next) => {
    const { Number } = req.body
    const admin = await Admin.find({ ContactNumber: Number })
    if (admin.length === 0) {
        next()
    } else {
        const ContactNumber = admin[0].ContactNumber
        req.flash("success", "Welcome Abmin Enter the OTP")
        res.cookie("Admin", `${ContactNumber}`, {
            httpOnly: true,
            expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
            maxAge: 7 * 24 * 60 * 60 * 1000,
            signed: true
        })
        res.redirect("/Admin/login")
    }
}

//sign Up route
router.get("/signUp", (req, res) => {
    res.render('user/signup.ejs')
})

//sign Up post route
router.post("/signUp", userValidaiton, signUp)
//otp verification and saving users after verification
router.post("/signUp/Verfication", verfiySignUp)

//login get route
router.get("/login", (req, res) => {
    res.render("user/login")
})

router.get("/otp", wrapAsync(async (req, res, next) => {
    if (req.session.user["username"]) {
        res.render("user/otp.ejs", { link: "signUp" })
    } else {
        res.render("user/otp.ejs", { link: "login" })
    }
}))

//login OTP verification
router.post("/login", AdCheck, login)

//login OTP verification
router.post("/login/Verfication", LoginVerification)

//logout api
router.get("/logOut", (req, res, next) => {
    req.logout(err => {
        if (err) {
            return next(err)
        }
        req.flash("success", "You Logout Successfully")
        res.redirect("/")
    })
})

//login through google
router.get('/login/google',
    passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/auth/google/callback',
    passport.authenticate('google',
        { failureRedirect: '/user/signUp', failureFlash: true }
    ),
    (req, res) => {
        req.flash("success", "You loggedIn SuccessFully")
        res.redirect("/")
    }
);
//user Profile
router.get("/userProfile", AdCheck, (req, res) => {
    res.render("user/userProfile.ejs")
  })
  //editprofile page
  router.get("/userProfile/edit", (req, res) => {
    res.render("user/editprofile.ejs")
  })
  

module.exports = router