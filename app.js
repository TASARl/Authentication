require("dotenv").config(); // dotenv paketini kullanmak için npm ile yükledikten sonra bu şekil eklemek gerek
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const ejs = require("ejs");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const findOrCreate = require("mongoose-findorcreate");

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
    mongoose.set("useCreateIndex", true);
} catch (error) {
    console.log("could not connect");
}

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String,
    secret: String,
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function (user, done) {
    done(null, user.id);
});

passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
        done(err, user);
    });
});

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.CLIENT_ID,
            clientSecret: process.env.CLIENT_SECRET,
            callbackURL: "http://localhost:3000/auth/google/secrets",
        },
        function (accessToken, refreshToken, profile, cb) {
            console.log(profile);

            User.findOrCreate({ googleId: profile.id }, function (err, user) {
                return cb(err, user);
            });
        }
    )
);

// Db yeni kayıt ekleme.
// const yenikayit = new User({
//     email: "Bir tavuk alalım.",
//     password: "123"
// });

// yenikayit.save();

app.get("/", (req, res) => {
    res.render("home");
});

app.get("/auth/google", passport.authenticate("google", { scope: ["profile"] }));

app.get("/auth/google/secrets", passport.authenticate("google", { failureRedirect: "/login" }), function (req, res) {
    // Successful authentication, redirect home.
    res.redirect("/secrets");
});

app.get("/logout", function (req, res) {
    req.logout();
    res.redirect("/");
});

app.get("/secrets", function (req, res) {
    User.find({ secret: { $ne: null } }, function (err, foundUsers) {
        if (err) {
            console.log(err);
        } else {
            if (foundUsers) {
                res.render("secrets", { userWithSecret: foundUsers });
            }
        }
    });
});

app.get("/submit", function (req, res) {
    if (req.isAuthenticated()) {
        res.render("submit");
    } else {
        res.redirect("/login");
    }
});

app.post("/submit", function (req, res) {
    const submittedSecret = req.body.secret;
    console.log(req.user);

    User.findById(req.user.id, function (err, foundUser) {
        if (err) {
            console.log(err);
        } else {
            if (foundUser) {
                foundUser.secret = submittedSecret;
                foundUser.save(function (err) {
                    res.redirect("/secrets");
                });
            }
        }
    });
});

app.route("/register")
    .get((req, res) => {
        res.render("register");
    })
    .post((req, res) => {
        User.register({ username: req.body.username }, req.body.password, function (err, user) {
            if (err) {
                console.log(err);
                res.redirect("/register");
            } else {
                passport.authenticate("local")(req, res, function () {
                    res.redirect("/secrets");
                });
            }
        });
    });

app.route("/login")
    .get((req, res) => {
        res.render("login");
    })
    .post((req, res) => {
        const user = new User({
            username: req.body.username,
            password: req.body.password,
        });

        req.login(user, function (err) {
            if (err) {
                console.log(err);
            } else {
                passport.authenticate("local")(req, res, function () {
                    res.redirect("/secrets");
                });
            }
        });
    });

let port = process.env.PORT;
if (port == null || port == "") {
    port = 3000;
}

app.listen(port, function () {
    console.log("Server started succesfully!!");
});
