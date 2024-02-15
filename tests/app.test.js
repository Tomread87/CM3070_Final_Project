const request = require('supertest');
const { makeApp } = require('../app.js'); // Import your Express app
const authFuncs = require('../serverside_scripts/authFuncs.js') // Import relevant hashing functions

//create mock functions for mock database testing using jest
const createUser = jest.fn()
const getUser = jest.fn()

//pass mock functions for database to express app
const app = makeApp({
    createUser,
    getUser
})

//create mock functions to test jwt authentication and create token functions
jest.spyOn(authFuncs, 'authenticateToken').mockImplementation((req, res, next) => {
    jest.fn()
});

jest.spyOn(authFuncs, 'createUserToken').mockImplementation((res, user, rememberme) => {
    jest.fn()
});


describe('Express App "Get" Routes that do not need authentication', () => {
    // Test the home page route
    test('GET / should return "Home Page"', async () => {
        const response = await request(app).get('/');
        expect(response.status).toBe(200);
    });

    // Test the /register get route
    test('GET /register should render "register.html"', async () => {
        const response = await request(app).get('/register');
        expect(response.status).toBe(200);
    });

    // Test the /login get route
    test('GET /login should render "login.html"', async () => {
        const response = await request(app).get('/login');
        expect(response.status).toBe(200);
    });
});

describe('POST /register tests', () => {

    afterEach(() => {
        getUser.mockReset(); //reset mock function to defaul state
        createUser.mockReset(); //reset mock function to defaul state
    })

    // Test the /register post route 
    describe('when user tries to register with a new account and inserts wrong input', () => {

        test('POST /register with missing email and wrong repeat password should send back error status 400 and details of error in JSON format"', async () => {
            const response = await request(app).post('/register')
                .set('Content-Type', 'application/x-www-form-urlencoded') //we are sending form data
                .send({
                    username: "username",
                    email: "",
                    password: "password",
                    repeatPassword: "passwords"
                });
            expect(response.status).toBe(400);

            //response type should be json
            expect(response.header['content-type']).toMatch(/application\/json/);

            //response should have property errors
            expect(response.body).toHaveProperty('errors');

            // check if the errors are related to the missing field email and wrong password
            const expectedErrors = [
                { location: 'body', msg: 'Invalid value', path: 'email', type: 'field', value: "" },
                { location: 'body', msg: 'Invalid value', path: 'repeatPassword', type: 'field', value: "passwords" },
            ];
            expect(response.body.errors).toEqual(expect.arrayContaining(expectedErrors));
        });
    });

    describe('when user tries to register with a new account and inserts correct input', () => {

        //define the connection to be used from the pool so that we can add beginTransaction()
        test('POST /register with correct form input should send back status 201 and success message in JSON format"', async () => {
            //createUser function is expected to return the id value of the inserted new user    
            createUser.mockResolvedValue(1)

            const response = await request(app).post('/register')
                .set('Content-Type', 'application/x-www-form-urlencoded') //we are sending form data
                .send({
                    username: "jest_test",
                    email: "jest_test@test.com",
                    password: "password",
                    repeatPassword: "password"
                });



            // Database function is called only once in the post request
            expect(createUser.mock.calls.length).toBe(1)

            //Check that the parametners sent to the databse are correct
            expect(createUser.mock.calls[0][0]).toBe('jest_test');
            expect(createUser.mock.calls[0][1]).toBe('jest_test@test.com');
            expect(createUser.mock.calls[0][2]).not.toBe('password'); //password should be hashed

            //response status should be 200 and type should be json
            expect(response.status).toBe(201);
            expect(response.header['content-type']).toMatch(/application\/json/);
        });
    });

    describe('when user tries to register with a new account and username already exists', () => {

        //define the connection to be used from the pool so that we can add beginTransaction()
        test('POST /register with correct form input but alerady exisiting email/username should send back error status 400 and details of error in JSON formatt"', async () => {
            //createUser function is expected to return the id value of the inserted new user    
            getUser.mockResolvedValue({ id: 1, username: "jest_test", email: "jest_test@test.com" })

            const response = await request(app).post('/register')
                .set('Content-Type', 'application/x-www-form-urlencoded') //we are sending form data
                .send({
                    username: "jest_test",
                    email: "jest_test@test.com",
                    password: "password",
                    repeatPassword: "password"
                });



            // Database function is called only once in the post request
            expect(getUser.mock.calls.length).toBe(1)


            //response status should be 400 and type should be json
            expect(response.status).toBe(409);
            expect(response.header['content-type']).toMatch(/application\/json/);
        });
    });
});

describe('POST /login tests', () => {
    // Test the /login post route 
    describe('when user tries to login with wrong credentials', () => {

        test('POST /login with wrong credentials should give error status 400 and details of error in JSON format"', async () => {
            const response = await request(app).post('/login')
                .set('Content-Type', 'application/json') //we are sending form data
                .send({
                    email: "wrong@mail.com",
                    password: "password",
                });
            expect(response.status).toBe(400);

            //response type should be json
            expect(response.header['content-type']).toMatch(/application\/json/);

            //response should have property errors
            expect(response.body).toHaveProperty('error');
        });
    });

    // Test the /login post route 
    describe('when user tries to login with correct credentials', () => {

        test('POST /login with correct credentials should return status 200, json message and set cookie token"', async () => {

            //createUser function is expected to return the id value of the inserted new user    
            getUser.mockResolvedValue({ id: 1, username: "jest_test", email: "jest_test@test.com", password: authFuncs.hash_password("password") }) // databse password is hashed

            const response = await request(app).post('/login')
                .set('Content-Type', 'application/json') //we are sending form data
                .send({
                    email: "jest_test@test.com",
                    password: "password",
                });
            expect(response.status).toBe(200);

            //response type should be json
            expect(response.header['content-type']).toMatch(/application\/json/);

            //response should have property message
            expect(response.body).toHaveProperty('message');

            //login route should set a cookie
            expect(response.headers['set-cookie']).toBeDefined();

            //check that 'token' cookie exists
            const cookies = response.headers['set-cookie'];
            const tokenCookie = cookies.find(cookie => cookie.startsWith('token='));
            expect(tokenCookie).toBeDefined();
        });
    });

});

describe('Express App "Get" Routes that need authentication', ()=> {
            //define the connection to be used from the pool so that we can add beginTransaction()
            test('GET /profile with bad autentication authentication should return status 403"', async () => {

                const response = await request(app).get('/profile')
                expect(response.status).toBe(302)
            });
})