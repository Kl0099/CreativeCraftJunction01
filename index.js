const express = require("express")
const app = express()
const PORT = 5500
const path = require("path")
const ejsMate = require("ejs-mate")
const ExpressError = require("./utility/ExpressError")
const wrapAsync = require("./utility/wrapAsync")
const mongoose = require("mongoose")
const dotenv = require("dotenv")
const postRoutes = require("./routes/post")
const AdminRoutes = require("./routes/Admin")
const flash = require("connect-flash")
const session = require("express-session")
const UserRoutes = require("./routes/user")
// require("./auth")
const cookieParser = require('cookie-parser');
const passport = require("passport")
const post = require("./module/post")
const category = require("./module/category")
const User = require("./module/user")
const Admin = require("./module/Admin")
const LocalStrategy = require("passport-local")
require("./auth")

const sessionOption = {
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge: 7 * 24 * 60 * 60 * 1000
    }
}

//required middlewares 
app.use(express.static(path.join(__dirname, "public")))
app.use(express.static(path.join(__dirname, "public/css")))
app.use(express.static(path.join(__dirname, "public/js")))
app.use(express.static(path.join(__dirname, "public/image")))
app.use('/uploads', express.static('uploads'))
app.set("view engine", "ejs")
app.set("views", path.join(__dirname, "views"))
app.engine("ejs", ejsMate)
dotenv.config()
app.use(flash())
app.use(session(sessionOption))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
const db_url = process.env.DATABASE_URL
app.use(cookieParser("This is the admin"));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()))
passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

main()
    .then(res => console.log("Mongodb is connected"))
    .catch(err => console.log(err))

async function main() {
    await mongoose.connect(db_url)
}


//flash middle ware for message sending 
app.use((req, res, next) => {
    res.locals.success = req.flash('success')
    res.locals.error = req.flash('error')
    res.locals.LoginError = req.flash('LoginError')
    res.locals.SignUpError = req.flash('SignUpError')
    res.locals.currUser = req.user;
    next()
})

//all routes
app.use('/', postRoutes)
app.use('/Admin', AdminRoutes)
app.use('/User', UserRoutes)

app.all("*", wrapAsync(async (req, res, next) => {
    throw new ExpressError(404, "Page not found!")
}))

app.use((err, req, res, next) => {
    let { status = 500 } = err
    res.status(status).render("Error.ejs", { err })
})

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`)
})

// const a = async ()=>{
//    const NewAdmin = await new Admin({ ContactNumber: 9313743791, email: "vishaljain7100@gmail.com" })
//    NewAdmin.save().then(res => console.log(res))
// }

// a()

// User.getIndexes()
// User.find({ ContactNumber: "9313743791" }).then(res => console.log(res)).catch(err => console.log(err))

// User.deleteMany({}).then(res => console.log(res))

// post.insertMany(data).then(res => console.log(res)).catch(err => console.log(err))
// post.deleteMany({}).then(res => log(res)).catch(err => log(err))

// category.deleteMany({}).then(res => log(res))
// category.insertMany(categoryData).then(res => log(res))