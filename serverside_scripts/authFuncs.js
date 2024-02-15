
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');


//----------- password hashing for security purposes -------------//
function hash_password(string) {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(string, salt);
    return hash
}

function compare_hash_password(string_password, hash) {
    const result = bcrypt.compareSync(string_password, hash);
    return result
}


//----------- password hashing for security purposes -------------//
/** creates a JWT token that is set as cookie in the user's web browser
 * @param {*} res 
 * @param {*} user 
 * @param {*} rememberme 
 */
function createUserToken(res, user, rememberme) {

    //create JSON web token     
    const signedin_user = {
        id: user.id,
        username: user.username,
        rememberme: rememberme
    }


    //create the accessToken
    const accessToken = jwt.sign(signedin_user, process.env.ACCESS_TOKEN_SECRET)

    //set the token as cookie
    if (rememberme) {
        res.cookie("geoKnowToken", accessToken, {
            httpOnly: true,
            SameSite: 'Strict',
            //secure: true,
            maxAge: 2630000,
            //signed: true
        })
    } else {
        res.cookie("geoKnowToken", accessToken, {
            httpOnly: true,
            SameSite: 'Strict',
            //secure: true,
            //maxAge: 10000000,
            //signed: true
        })
    }
}

/** authenticate token checks if there is a token cookie and tries to decrypt it
 * @param {*} req request
 * @param {*} res response
 * @param {*} next next
 * @returns 
 */
async function authenticateToken(req, res, next) {

    const token = req.cookies.geoKnowToken;
    // if token is not present there is no JWT token
    if (typeof token == 'undefined') {
        req.user = null //set user as null so that it means no user is logged in
        return next()
    }

    try {
        //decoding del jwt
        const jwtUser = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET) //non valid token will throw an error

        //get the information from the cookie
        req.user = jwtUser;

        //Update token with new token
        createUserToken(res, jwtUser)

        return next()
    } catch (err) {
        console.log("error in authenticateToken")
        res.clearCookie("geoKnowToken"); //clear the token
        req.user = null
        return next()
    }
}

module.exports = {
    hash_password,
    compare_hash_password,
    createUserToken,
    authenticateToken
}