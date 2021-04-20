require("dotenv").config(); // dotenv paketini kullanmak için npm ile yükledikten sonra bu şekil eklemek gerekk
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const ejs = require("ejs");
const encrypt = require("mongoose-encryption");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

const uri = "mongodb+srv://" + process.env.DBUSER + ":" + process.env.DBPASSWORD + "@cluster0.otmwl.mongodb.net/userLogin?retryWrites=true&writeConcern=majority";

try {
    mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true }, () => console.log("connected"));
} catch (error) {
    console.log("could not connect");
}

// Schema
const userSchema = new mongoose.Schema({
    email: String,
    password: String,
});

userSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ["password"] });

const User = new mongoose.model("User", userSchema);

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
    .post((req, res) => {
        const yenikayit = new User({
            email: req.body.username,
            password: req.body.password,
        });

        yenikayit.save(function (err) {
            if (!err) {
                res.render("secrets");
            } else {
                console.log("Db kayıt eklenirken hata oluştu.");
            }
        });
    });

app.route("/login")
    .get((req, res) => {
        res.render("login");
    })
    .post((req, res) => {
        User.findOne({ email: req.body.username }, (err, user) => {
            if (err) {
                console.log(err);
            } else {
                if (user.password === req.body.password) {
                    res.render("secrets");
                } else {
                    console.log("Parola hatalı");
                    res.render("login");
                }
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
