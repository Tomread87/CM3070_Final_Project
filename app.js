//Import Libraries
const express = require("express");
const bodyParser = require("body-parser");
const cookies = require("cookie-parser") //helps to get cookies from req and parse them
require('dotenv').config()

//create an app reference to express()
function makeApp(database) {
    const app = express();

    // Mount middelware
    app.use(bodyParser.urlencoded({ extended: true })) //let express know that we want to parse the bodies drom post requests
    app.use(cookies()) //let express know we want to use the cookie parser library
    app.use(express.json()); //needed to read json data

    require("./routes/main")(app, database); //let express know where the route file is
    app.set("views", __dirname + "/views"); //set the views directory
    app.set("view enging", "ejs"); // set the view engine to EJS
    app.engine("html", require("ejs").renderFile); // Set the HTML rednering enginge for EJS
    app.use('/static', express.static('static'))

    //http redirect
    app.use((req, res, next) => {
        if (req.secure) {
            next();
        } else {
            console.log("test");
            const redirectUrl = 'https://' + req.headers.host + req.url;
            res.redirect(301, redirectUrl);
        }
    });

    return app
}


module.exports = { makeApp } 