require("dotenv").config(); // dotenv paketini kullanmak için npm ile yükledikten sonra bu şekil eklemek gerek
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const ejs = require("ejs");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const app = express();

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(
    session({
        secret: "Ege bir Türk gölü değildir. Ege bir Yunan gölü de değildir. Ege zaten bir göl de değildir!",
        resave: false,
        saveUninitialized: false,
    })
);

app.use(passport.initialize());
app.use(passport.session());

const uri = "mongodb+srv://" + process.env.DBUSER + ":" + process.env.DBPASSWORD + "@cluster0.otmwl.mongodb.net/userLogin?retryWrites=true&writeConcern=majority";

try {
    mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true }, () => console.log("connected"));
} catch (error) {
    console.log("could not connect");
}

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
});

userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Db yeni kayıt ekleme.
// const yenikayit = new User({
//     email: "Bir tavuk alalım.",
//     password: "123"
// });

// yenikayit.save();

app.get("/", (req, res) => {
    res.render("home");
});

app.route("/register")
    .get((req, res) => {
        res.render("register");
    })
    .post((req, res) => {});

app.route("/login")
    .get((req, res) => {
        res.render("login");
    })
    .post((req, res) => {});

let port = process.env.PORT;
if (port == null || port == "") {
    port = 3000;
}

app.listen(port, function () {
    console.log("Server started succesfully!!");
});
