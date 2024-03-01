const { validationResult } = require('express-validator');
const { hash_password, compare_hash_password, createUserToken, authenticateToken } = require('../serverside_scripts/authFuncs.js')
const { getAllCountries, getAllCitiesOfCountry, getClosestCity, getClosestCities, getClosestStates, allWorldCities, getClosestCountries, searchCityByNameStateCountry } = require('../serverside_scripts/cities.js');
const validationParam = require("./validationParam.js")
const badges = require('../serverside_scripts/badges.json')
const { saveSharpScaledImages, multerMultiUpload } = require('../serverside_scripts/mediaUpload.js');


module.exports = function (app, db) {



    // --- Home Page ---
    app.get("/", authenticateToken, async (req, res) => {
        const allCountries = getAllCountries()
        const mostUsedTags = await db.getMostUsedTags()

        let user = undefined

        //return res.send(req.user == undefined)
        if (req.user != undefined) {
            user = await db.getUserData(req.user.id)
        }

        return res.render("index.html", { allCountries, user, mostUsedTags, badges })
    })

    // --- Registration Page --- //

    // opens the register user page
    app.get("/register", authenticateToken, (req, res) => {

        const user = req.user

        return res.render("register.html", { user })
    })

    // handles the request of a new user to register to the web application
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
            return res.status(200).json({ message: 'Login successful!', username: existingUser.username });

        } catch (error) {
            console.error('Database error:', error.message);
            return res.status(500).send('Internal Server Error');
        }

    })

    // logsout the user and clears the token cookie
    app.get("/logout", (req, res) => {
        res.clearCookie("geoKnowToken").status(200).redirect("/");
    })

    // --- Profile Page ---//
    app.get("/profile", authenticateToken, validationParam.validateProfile, async (req, res) => {

        //if (!req.user) return res.status(403).redirect("/login")

        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            req.query.userId = undefined
        }

        let user = req.user
        let searchedUser = undefined

        if (user) user = await db.getUserData(user.id)


        // if we have the query then we are looking at someone elses profile
        if (req.query.userId) searchedUser = await db.getUserData(req.query.userId)
        //if user is not logged in and input is incorrect redirect to home
        if (!searchedUser && !user) return res.status('400').redirect('/')
        //if there is no user with that id set searched user to the loged in user
        if (!searchedUser) searchedUser = user

        var createdEntities = await db.getUserCreatedEntities(searchedUser.id)
        //createdEntities = await db.attachAddInfoToEntities(createdEntities)


        // Get statistics
        const uniqueCountryCodes = new Set();
        const uniqueLocations = new Set();
        let nonNullLatCount = 0;

        createdEntities.forEach(entity => {
            uniqueCountryCodes.add(entity.countryCode);
            uniqueLocations.add(entity.location);
            if (entity.lat !== null) {
                nonNullLatCount++;
            }
        });


        const statistics = {
            totalEntities: createdEntities.length,
            totalCountries: uniqueCountryCodes.size,
            totalSpots: nonNullLatCount,
            totalLocations: uniqueLocations.size
        }

        return res.render("profile.html", { user, statistics, badges, searchedUser })
    })

    // --- Entity Details Page ---//
    app.get("/entity", authenticateToken, validationParam.validateEntity, async (req, res) => {

        // Check for validation errors
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).redirect("/")
        }

        let user = undefined

        //return res.send(req.user == undefined)
        if (req.user != undefined) {
            user = await db.getUserData(req.user.id)
        }

        // get entities
        let entity = await db.getEntity(req.query.entityId)
        if (entity.length > 0) {
            entity = await db.attachAddInfoToEntities(entity)
            entity[0].city = searchCityByNameStateCountry(entity[0].location, entity[0].stateCode, entity[0].countryCode)
        }
        else return res.status(404).send({ "error": "no entity with such entityId" })

        return res.render("entity.html", { user, badges, entity: entity[0] })
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

        var closestLocations

        if (quantity == 1) {
            closestLocations = [getClosestCity(allWorldCities, lat, lon)] //if we are searching only one city we use getClosestCity, it takes half the time compared to getClosestCities
        } else {
            closestLocations = getClosestCities(allWorldCities, lat, lon, qty)
        }

        if (closestLocations) {
            return res.json(closestLocations);
        } else {
            return res.status(404).send('No city found.');
        }
    });

    app.get("/findstatesfromcoord", validationParam.validateQueryLonLatQty, (req, res) => {

        // validate entries
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { latitude, longitude, qty } = req.query;

        // Convert string query parameters to numbers
        const lat = Number(latitude);
        const lng = Number(longitude);
        const radius = Number(qty);

        var closestLocations

        closestLocations = getClosestStates(lat, lng, radius,)


        if (closestLocations) {
            return res.json(closestLocations);
        } else {
            return res.status(404).send('No city found.');
        }
    });

    app.get("/findcountriesfromcoord", validationParam.validateQueryLonLatQty, (req, res) => {

        // validate entries
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { latitude, longitude, qty } = req.query;

        // Convert string query parameters to numbers
        const lat = Number(latitude);
        const lng = Number(longitude);
        const radius = Number(qty);

        var closestLocations

        closestLocations = getClosestCountries(lat, lng, radius)

        if (closestLocations) {
            return res.json(closestLocations);
        } else {
            return res.status(404).send('No city found.');
        }
    });

    app.get("/getentity", validationParam.validateEntity, async (req, res) => {

        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        //retrieve data from query
        const { entityId } = req.query

        try {

            let entity = await db.getEntity(entityId);
            if (entity.length > 0) {
                entity = await db.attachAddInfoToEntities(entity)
                entity[0].city = searchCityByNameStateCountry(entity[0].location, entity[0].stateCode, entity[0].countryCode)
            } else return res.status(404).send({ error: 'no entity with this entityId' })

            return res.json(entity[0]);
        } catch (error) {
            console.error('Database error:', error);
            return res.status(500).send('Internal Server Error');
        }

    })

    app.get("/getentities", validationParam.validateGetEntities, async (req, res) => {

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
            const tagsArray = Array.isArray(tags) ? tags : (tags ? [tags] : []);

            let entities = await db.getEntities(location, numericLimit, tagsArray);
            if (entities.length > 0) {

                entities = await db.attachAddInfoToEntities(entities)
            }


            return res.json({ entities: entities, location: location });
        } catch (error) {
            console.error('Database error:', error);
            return res.status(500).send('Internal Server Error');
        }

    })

    app.get("/getstateentities", validationParam.validateGetStateEntities, async (req, res) => {

        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        //retrieve data from query
        const { isoCode, countryCode, limit, tags } = req.query

        try {
            const numericLimit = parseInt(limit, 10) || 9; // Default to 9 if limit is not provided or invalid

            // Ensure tags is always an array even if only one tag is sent
            let tagsArray = Array.isArray(tags) ? tags : (tags ? [tags] : []);

            let entities = await db.getStateEntities(isoCode, countryCode, numericLimit, tagsArray);
            entities = await db.attachAddInfoToEntities(entities)

            return res.json({ entities: entities });
        } catch (error) {
            console.error('Database error:', error);
            return res.status(500).send('Internal Server Error');
        }

    })

    app.get("/getcountryentities", validationParam.validateGetCountryEntities, async (req, res) => {

        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        //retrieve data from query
        const { countryCode, limit, tags } = req.query

        try {
            const numericLimit = parseInt(limit, 10) || 9; // Default to 9 if limit is not provided or invalid

            // Ensure tags is always an array even if only one tag is sent
            let tagsArray = Array.isArray(tags) ? tags : (tags ? [tags] : []);

            let entities = await db.getCountryEntities(countryCode, numericLimit, tagsArray);
            entities = await db.attachAddInfoToEntities(entities)

            return res.json({ entities: entities });
        } catch (error) {
            console.error('Database error:', error);
            return res.status(500).send('Internal Server Error');
        }

    })

    app.get("/getuserentities", validationParam.validateUserEntities, authenticateToken, async (req, res) => {

        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        //retrieve data from query
        const { userId, limit, tags } = req.query

        try {
            // Ensure tags is always an array even if only one tag is sent
            let tagsArray = Array.isArray(tags) ? tags : (tags ? [tags] : []);

            let entities = await db.getUserCreatedEntities(userId, limit, tagsArray);
            entities = await db.attachAddInfoToEntities(entities)

            return res.json(entities);
        } catch (error) {
            console.error('Database error:', error);
            return res.status(500).send('Internal Server Error');
        }

    })

    app.post("/deleteimage", authenticateToken, async (req, res) => {
        const user = req.user
        if (!user) return res.status(403).send({ error: "you need to login to delete images" })

        // Check for validation errors
        const errors = validationResult(req.body);
        if (!errors.isEmpty()) {
            console.log(errors);
            return res.status(400).json({ errors: errors.array() });
        }


    })

    app.post("/changeprofileimage", validationParam.validateSetLocation, authenticateToken, async (req, res) => {

    })

    // if user is logged in save their choice of location to the database
    app.post("/set_location", validationParam.validateSetLocation, authenticateToken, async (req, res) => {

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

        return res.send({ "mex": "set location", "body": req.body, user })
    })

    // --- Create Entities ---//
    app.post("/createentity", multerMultiUpload.array('images', 5), validationParam.validateCreateEntity, authenticateToken, async (req, res) => {

        const user = req.user
        if (!user) return res.status(403).send({ error: "you need to login to create a new entity" })

        // Check for validation errors       
        const errors = validationResult(req.body.jsonData);
        if (!errors.isEmpty()) {
            console.log(errors);
            return res.status(400).json({ errors: errors.array() });
        }
        
        // Access validated data
        const jsonData = JSON.parse(req.body.jsonData)
        const data = {
            entityName, entityTag, phoneNumber, email, website, review, location,
            locationLat, locationLng, lat, lng
        } = jsonData;

        // Get Country Code and State Code
        let city
        if (!lat && !lng) {
            city = getClosestCity(allWorldCities, locationLat, locationLng)
        } else {
            city = getClosestCity(allWorldCities, lat, lng)
        }

        // Add user id, stateCode and countryCode to data
        data.userId = user.id
        data.countryCode = city.countryCode
        data.stateCode = city.stateCode
        data.dbImages = []

        //save everything to databse
        try {          
            // Access uploaded files
            if (req.files && req.files.length > 0) {

                for (let file of req.files) {
                    const fileInfo = await saveSharpScaledImages(file)
                    data.dbImages.push(fileInfo)
                }
                
                await db.addEntityToDatabase(data)
            } else {
                await db.addEntityToDatabase(data)
            }
        } catch (error) {
            console.log('createentity', error);
            if (error.code === 'LIMIT_FILE_SIZE') {
                res.status(400).json({ error: 'File size exceeds the limit of 10MB' });
            } else {
                return res.status(500).json({ error: 'Internal server error' });
            }
        }


        return res.status(201).send({ body: data })
    })

}

