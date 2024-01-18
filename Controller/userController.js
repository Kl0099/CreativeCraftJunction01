const express = require("express")
const User = require("../module/user")
const wrapAsync = require("../utility/wrapAsync")
const bcrypt = require("bcrypt")
const _ = require("lodash")
const axios = require("axios")
const otpGenerator = require("otp-generator")
const OtpSchema = require("../module/otp")
const dotenv = require("dotenv")
const passport = require("passport")

dotenv.config()
const authToken = process.env.Twilio_authToken
const accountSid = process.env.Twilio_accoundSid


//sending otp to user
module.exports.signUp = wrapAsync(async (req, res) => {
    const { ContactNumber, username, email } = req.body.user
    //if user exist then login page redirect
    const userExistWithNumber = await User.find({ ContactNumber: ContactNumber })
    if (userExistWithNumber.length !== 0) {
        req.flash('SignUpError', "Account Exist! Please login")
        res.redirect("/user/login")
        next()
    }

    const userExistWithEmail = await User.find({ email: email })
    if (userExistWithEmail.length !== 0) {
        req.flash('SignUpError', "Account Exist! Please login")
        res.redirect("/user/login")
        next()
    }

    //generating opt and storing in db
    const OTP = otpGenerator.generate(4, {
        digits: true, upperCaseAlphabets: false, specialChars: false, lowerCaseAlphabets: false
    })

    const otp = new OtpSchema({ number: ContactNumber, otp: OTP })
    //hashing otp
    const salt = await bcrypt.genSalt(10)
    otp.otp = await bcrypt.hash(otp.otp, salt)

    const result = await otp.save()
    console.log(OTP)
    //saving user temp for details to be verfied in otp page
    req.session.user = { ContactNumber, username, email }

    res.render("user/otp.ejs", { link: "signUp" })
})

//verify otp sended by user
module.exports.verfiySignUp = wrapAsync(async (req, res, next) => {
    const { ContactNumber, email, username } = req.session.user
    const { otp } = req.body
    const NumberOtp = otp.join("")

    //checking otp is expired or not
    const otpHolder = await OtpSchema.find({ number: ContactNumber })
    if (otpHolder.length === 0) {
        req.flash('error', "You use an Expired OTP!")
        res.redirect("/user/signUp")
    }

    const rightOtpFind = otpHolder[otpHolder.length - 1]
    const validUser = await bcrypt.compare(NumberOtp, rightOtpFind.otp)
    console.log(rightOtpFind.number, ContactNumber, NumberOtp, rightOtpFind.otp)
    //otp verification and saving users after verification
    if (rightOtpFind.number === ContactNumber && validUser) {
        const newUser = await new User({ email, ContactNumber, username })
        const reg = await User.register(newUser, ContactNumber)

        req.login(reg, err => {
            if (err) {
                console.log(err)
            }
            req.flash("success", "You loggedIn Successfully")
            res.redirect("/")
        })
        //deleting otp after user registor
        const OTPDelete = await OtpSchema.deleteMany({ number: rightOtpFind.number })
        res.redirect("/")
    } else {
        req.flash('LoginError', "INVALID OTP")
        res.redirect("/user/otp")
    }
})

//sending otp to user
module.exports.login = wrapAsync(async (req, res, next) => {
    const { Number } = req.body
    //getting user
    const userExistInDb = await User.find({ ContactNumber: Number })

    const OTP = otpGenerator.generate(4, {
        digits: true, lowerCaseAlphabets: false, upperCaseAlphabets: false, specialChars: false
    })
    const otp = new OtpSchema({ number: Number, otp: OTP })
    await otp.save()
    console.log(OTP)

    const ContactNumber = userExistInDb[0].ContactNumber
    req.session.user = { ContactNumber }
    res.render("user/otp.ejs", { link: "login" })
})

//otp verification with db and generating token for valid User
module.exports.LoginVerification = wrapAsync(async (req, res, next) => {
    const { ContactNumber } = req.session.user
    const { otp } = req.body
    const NumberOtp = otp.join("")
    //checking otp is expired or not
    const otpHolder = await OtpSchema.find({ number: ContactNumber })
    if (otpHolder.length === 0) {
        req.flash('error', "You use an Expired OTP!")
        res.redirect("/user/login")
    }

    const rightOtpFind = otpHolder[otpHolder.length - 1]
    if (rightOtpFind.number == ContactNumber && NumberOtp == rightOtpFind.otp) {
        // const user = await User.find({ ContactNumber: ContactNumber })
        req.body = { Number: ContactNumber }
        next()
    } else {
        req.flash("LoginError", "INVALID OTP")
        res.redirect("/user/otp")
    }
})

