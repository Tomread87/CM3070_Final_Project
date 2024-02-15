const { query, body, matchedData, validationResult } = require('express-validator');
const { hash_password, compare_hash_password, createUserToken, authenticateToken } = require('../serverside_scripts/authFuncs.js')
const { getAllCountries, getAllCitiesOfCountry, getClosestCity, getClosestCities, allWorldCities } = require('../serverside_scripts/cities.js');
const validationParam = require("./validationParam.js")

module.exports = function (app, db) {

    

    // --- Home Page ---
    app.get("/", authenticateToken, async (req, res) => {
        const allCountries = getAllCountries()
        const mostUsedTags = await db.getMostUsedTags()

        let user = undefined

        //return res.send(req.user == undefined)
        if (req.user != undefined) {
            user = await db.getUserData(req.user.id)
            user.id = req.user.id
        }
        
        return res.render("index.html", { allCountries, user, mostUsedTags })
    })

    // --- Registration Page --- //

    //opens the register user page
    app.get("/register", authenticateToken, (req, res) => {

        const user = req.user

        return res.render("register.html", { user })
    })

    //handles the request of a new user to register to the web application
    app.post("/register", validationParam.validateRegistration, async (req, res) => {

        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        // Access validated data
        const { username, email, password } = req.body;

        //check if user already exists
        try {
            const existingUser = await db.getUser(email, username)

            if (existingUser && existingUser.email == email) { //username or email already in use send back message
                return res.status(409).json({ error: 'email already in use' });
            }
            if (existingUser && existingUser.username == username) { //username or email already in use send back message
                return res.status(409).json({ error: 'username already in use' });
            }

            //insert new user into DB
            const hashed_password = hash_password(password) //hash_password
            const createdUserId = await db.createUser(username, email, hashed_password)
            if (createdUserId) {
                return res.status(201).send({ message: 'Registration successful!' });
            } else {
                // Handle the case where user wasn't created for some reason
                res.status(500).send('Internal Server Error');
            }
        } catch (error) {
            console.error('Database error:', error.message);
            return res.status(500).send('Internal Server Error');
        }
        //check that the values are correct
    })

    // --- Login Page --- //

    // views the login page
    app.get("/login", authenticateToken, (req, res) => {

        const user = req.user

        return res.render("login.html", { user })
    })

    // logs in the user and 
    app.post("/login", validationParam.validateLogin, async (req, res) => {

        // Check if the checkbox is selected
        const checkboxValue = req.body.myCheckbox === 'on' ? true : false;

        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        //Access validated data
        const { email, password } = req.body;

        //check if user exists
        try {
            const existingUser = await db.getUser(email)
            //check if there is actually a user with the login credentials
            if (!existingUser) {
                return res.status(400).json({ error: 'No user with this email' });
            }

            //check if password matches
            if (!compare_hash_password(password, existingUser.password)) {
                return res.status(401).json({ error: 'Wrong Password' });
            }

            //create JSON webtoken
            createUserToken(res, existingUser, checkboxValue)
            return res.status(200).json({ message: 'Login successful!' });

        } catch (error) {
            console.error('Database error:', error.message);
            return res.status(500).send('Internal Server Error');
        }

    })

    app.get("/logout", (req, res) => {
        res.clearCookie("geoKnowToken").status(200).redirect("/");
    })

    // --- Profile Page ---//

    app.get("/profile", authenticateToken, async (req, res) => {

        if (!req.user) return res.status(403).redirect("/login")

        let user = req.user

        user = await db.getUserData(user.id)

        return res.render("profile.html", { user })
    })

    // --- Restful API ---//

    // sends all the cities and their data based on the ISOcode of the country the are in
    app.get("/isocountrycities", validationParam.validateQueryISOCodeCities, (req, res) => {

        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        // Extract the sanitized country code
        const countryIsoCode = req.query.isocode;

        // Gest all Cities from the sent ISOcode
        const allCountryCities = getAllCitiesOfCountry(countryIsoCode)

        if (allCountryCities.length > 0) {
            return res.json({ allCountryCities })
        } else {
            return res.status(404).json({ error: "no cities with this ISO code: " + "countryIsoCode" })
        }
    })

    app.get("/findlocationsfromcoord", validationParam.validateQueryLonLatQty, (req, res) => {

        // validate entries
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { latitude, longitude, qty } = req.query;

        // Convert string query parameters to numbers
        const lat = Number(latitude);
        const lon = Number(longitude);
        const quantity = Number(qty);

        var closestCities

        if (quantity == 1) {
            closestCities = [getClosestCity(allWorldCities, lat, lon)] //if we are searching only one city we use getClosestCity, it takes half the time compared to getClosestCities
        } else {
            closestCities = getClosestCities(allWorldCities, lat, lon, qty)
        }


        if (closestCities) {
            res.json(closestCities);
        } else {
            res.status(404).send('No city found.');
        }
    });

    app.get("/getentities", validationParam.validateGetEntites, async (req, res) => {

        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        //retrieve data from query
        const { location, limit, tags } = req.query

        try {
            const numericLimit = parseInt(limit, 10) || 9; // Default to 9 if limit is not provided or invalid

            // Ensure tags is always an array even if only one tag is sent
            let tagsArray = Array.isArray(tags) ? tags : (tags ? [tags] : []);

            const entities = await db.getEntities(location, numericLimit, tags);

            return res.json({ entities: entities, location: location });
        } catch (error) {
            console.error('Database error:', error);
            return res.status(500).send('Internal Server Error');
        }

    })

    // if user is logged in save their choice of location to the database
    app.post("/set_location", validationParam.validateSetLocation, authenticateToken, async (req, res) =>{

        const user = req.user
        if (!user) return res.status(403).send({ error: "you need to login to create a new entity" })

        // Access validated data
        const data = { name, lat, lng } = req.body;
        data.id = user.id

        try {
            await db.setUserLocation(data)
        } catch (error) {
            console.log('createentity', error);
            return res.status(500).send(error)
        }

        return res.send({"mex":"set location", "body":req.body, user})
    })

    // --- Create Entities ---//

    app.post("/createentity", validationParam.validateCreateEntity, authenticateToken, async (req, res) => {

        const user = req.user
        if (!user) return res.status(403).send({ error: "you need to login to create a new entity" })

        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        // Access validated data
        const data = { entityName, entityTag, phoneNumber, email, website, review, location } = req.body;

        // Add user id to data
        data.userId = user.id

        try {
            await db.addEntityToDatabase(data)
        } catch (error) {
            console.log('createentity', error);
            return res.status(500)
        }

        return res.status(201).send({ body: req.body })
    })

}

