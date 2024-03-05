const { query, body, matchedData, validationResult } = require('express-validator');
const { allWorldCities } = require('../serverside_scripts/cities.js')

const maxTextAreaChars = 1000

// validates form for register post request
const validateRegistration = [
    body('username').notEmpty().isLength({ max: 64 }).trim().escape(),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }).trim().escape(),
    body('repeatPassword').custom((value, { req }) => {
        return value === req.body.password;
    }),

];

// calidates form for login post request
const validateLogin = [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }).trim().escape(),
];

// validate that the get requests has the isocode query paramaters and that
const validateQueryISOCodeCities = [
    query('isocode')
        .exists().withMessage('isocode is required').bail()
        .isString().withMessage('isocode must be a string').bail()
        .isLength({ min: 2, max: 2 }).withMessage('Country code must be exactly 2 characters long'),
]

// validates that there are the three parameters and that they are numbers
const validateQueryLonLatQty = [
    query('latitude')
        .exists().withMessage('Latitude is required').bail()
        .isNumeric().withMessage('Latitude must be a number'),
    query('longitude')
        .exists().withMessage('Longitude is required').bail()
        .isNumeric().withMessage('Longitude must be a number'),
    query('qty')
        .exists().withMessage('Quantity is required').bail()
        .isNumeric().withMessage('Quantity must be a number')
];

// validates the create entity data from the post request
const validateCreateEntity = [
    body('entityName').trim().notEmpty().withMessage('Entity name is required'),
    body('entityTag').isArray().withMessage('Tags must be an array'),
    body('entityTag.*').trim().notEmpty().withMessage('Each tag must be non-empty'),
    body('phoneNumber').optional({ checkFalsy: true }).isMobilePhone().withMessage('Invalid phone number'),
    body('email').optional({ checkFalsy: true }).isEmail().withMessage('Invalid email address'),
    body('website').optional({ checkFalsy: true }).isURL().withMessage('Invalid website URL'),
    body('review').optional({ checkFalsy: true }).isLength({ max: maxTextAreaChars }).withMessage('Review must be less than 500 characters'),
    // custom validator for at least one contact detail
    body().custom(data => {
        if (!data.email && !data.phoneNumber && !data.website && (!data.lat || !data.lng)) {
            throw new Error('At least one contact detail (email, phone number, or website) must be provided.');
        }
        return true;
    }),
    // location needs to be among the cities from allWorldCities
    body('location').custom((value) => {
        const cityFound = allWorldCities.some(city => city.name === value);
        if (!cityFound) {
            throw new Error('Location must be a valid city.');
        }
        return true;
    }),
    // check that both lat & lng are either null or numbers
    body().custom(({ lat, lng }) => {
        if ((lat === null && lng !== null) || (lat !== null && lng === null)) {
            throw new Error('Latitude and longitude must both be null or both be numbers.');
        }
        return true;
    }),
    body('lat').optional().custom(value => {
        if (value !== null && (value < -90 || value > 90)) {
            throw new Error('Latitude must be null or between -90 and 90.');
        }
        return true;
    }),
    body('lng').optional().custom(value => {
        if (value !== null && (value < -180 || value > 180)) {
            throw new Error('Longitude must be null or between -180 and 180.');
        }
        return true;
    }),
    body('locationLat').custom(value => {
        if (value !== null && (value < -90 || value > 90)) {
            throw new Error('Latitude must be null or between -90 and 90.');
        }
        return true;
    }),
    body('locationLng').custom(value => {
        if (value !== null && (value < -180 || value > 180)) {
            throw new Error('Longitude must be null or between -180 and 180.');
        }
        return true;
    }),
    // setting custom throw errors to manage approppriate message
    body('images').optional().custom((value, { req }) => {
        // Check if any files were uploaded
        if (!req.files || req.files.length === 0) {
            // No files uploaded, validation passes
            return true;
        }

        // Check if all uploaded files are images
        const allImages = req.files.every(file => file.mimetype.startsWith('image/'));

        if (!allImages) {
            // At least one file is not an image, throw an error
            throw new Error('Please upload only image files');
        }

        // All uploaded files are images, validation passes
        return true;
    }),

];

// validates the create entity data from the post request
const validateAddReview = [
    body('entityId').isInt({ min: 1 }).withMessage('an entityId is required to view this page'),
    body('review').optional({ checkFalsy: true }).isLength({ max: maxTextAreaChars }).withMessage('Review must be less than 500 characters'),
    // setting custom throw errors to manage approppriate message
    body('images').optional().custom((value, { req }) => {
        // Check if any files were uploaded
        if (!req.files || req.files.length === 0) {
            // No files uploaded, validation passes
            return true;
        }

        // Check if all uploaded files are images
        const allImages = req.files.every(file => file.mimetype.startsWith('image/'));

        if (!allImages) {
            // At least one file is not an image, throw an error
            throw new Error('Please upload only image files');
        }

        // All uploaded files are images, validation passes
        return true;
    }),

];

// calidation middleware for getting entities by location
const validateGetEntities = [
    query('location')
        .exists() // Makes this field optional
        .custom((value) => {
            const cityFound = allWorldCities.some(city => city.name === value);
            if (!cityFound) {
                throw new Error('Location must be a valid city from the list.');
            }
            return true;
        }),
    query('limit')
        .optional()
        .exists()
        .isInt({ min: 1 }) // Ensure it's an integer greater than 0
        .withMessage('Limit must be a positive integer.'),
    query('tags')
        .optional()
        .custom((value) => {
            // If it's a string, it's okay
            if (typeof value === 'string') return true;

            // If it's an array, validate each element
            if (Array.isArray(value)) {
                value.forEach(tag => {
                    if (typeof tag !== 'string') {
                        throw new Error('Each tag must be a string.');
                    }
                });
                return true;
            }

            // If tags is neither a string nor an array
            throw new Error('Tags must be a string or an array of strings.');
        })
];

// Validation middleware for getting entities by state
const validateGetStateEntities = [
    query('isoCode')
        .exists() // Makes this field optional
        .custom((value) => {
            const cityFound = allWorldCities.some(city => city.stateCode === value);
            if (!cityFound) {
                throw new Error('stateCode must be a valid stateCode from the list.');
            }
            return true;
        }),
    query('countryCode')
        .exists() // Makes this field optional
        .custom((value) => {
            const cityFound = allWorldCities.some(city => city.countryCode === value);
            if (!cityFound) {
                throw new Error('countryCode must be a valid city from the list.');
            }
            return true;
        }),
    query('limit')
        .optional()
        .isInt({ min: 1 }) // Ensure it's an integer greater than 0
        .withMessage('Limit must be a positive integer.'),
    query('tags')
        .optional()
        .custom((value) => {
            // If it's a string, it's okay
            if (typeof value === 'string') return true;

            // If it's an array, validate each element
            if (Array.isArray(value)) {
                value.forEach(tag => {
                    if (typeof tag !== 'string') {
                        throw new Error('Each tag must be a string.');
                    }
                });
                return true;
            }

            // If tags is neither a string nor an array
            throw new Error('Tags must be a string or an array of strings.');
        })
];

// Validation middleware for getting entities by country
const validateGetCountryEntities = [
    query('countryCode')
        .exists() // Makes this field optional
        .custom((value) => {
            const cityFound = allWorldCities.some(city => city.countryCode === value);
            if (!cityFound) {
                throw new Error('countryCode must be a valid city from the list.');
            }
            return true;
        }),
    query('limit')
        .optional()
        .isInt({ min: 1 }) // Ensure it's an integer greater than 0
        .withMessage('Limit must be a positive integer.'),
    query('tags')
        .optional()
        .custom((value) => {
            // If it's a string, it's okay
            if (typeof value === 'string') return true;

            // If it's an array, validate each element
            if (Array.isArray(value)) {
                value.forEach(tag => {
                    if (typeof tag !== 'string') {
                        throw new Error('Each tag must be a string.');
                    }
                });
                return true;
            }

            // If tags is neither a string nor an array
            throw new Error('Tags must be a string or an array of strings.');
        })
];

// Validation middleware for getting entities by user ID
const validateUserEntities = [
    query('userId')
        .isInt({ min: 1 }) // Ensure it's an integer greater than 0
        .withMessage('userId is required'),
    query('limit')
        .optional()
        .isInt({ min: 1 }) // Ensure it's an integer greater than 0
        .withMessage('Limit must be a positive integer.'),
    query('tags')
        .optional()
        .custom((value) => {
            // If it's a string, it's okay
            if (typeof value === 'string') return true;

            // If it's an array, validate each element
            if (Array.isArray(value)) {
                value.forEach(tag => {
                    if (typeof tag !== 'string') {
                        throw new Error('Each tag must be a string.');
                    }
                });
                return true;
            }

            // If tags is neither a string nor an array
            throw new Error('Tags must be a string or an array of strings.');
        })
];

// Validation middleware for getting an entity by ID
const validateProfile = [
    query('userId')
        .optional()
        .isInt({ min: 1 }) // Ensure it's an integer greater than 0
        .withMessage('userId is required'),
]

// Validation middleware for getting an entity by ID
const validateEntity = [
    query('entityId')
        .isInt({ min: 1 }) // Ensure it's an integer greater than 0
        .withMessage('an entityId is required to view this page'),
]

// Validation middleware for voting form
const validateVoteEntity = [
    body('entity_id').notEmpty().isInt(),
    body('vote_type').notEmpty().isInt().isIn([-1, 0, 1])
];

//validate post request to ser location
const validateSetLocation = [
    body('name').isString().withMessage('Name must be a string'),
    body('lat').isFloat().withMessage('Latitude must be a float number'),
    body('lng').isFloat().withMessage('Longitude must be a float number'),
]

const validateChangeProfileImage = [

    // setting custom throw errors to manage approppriate message
    body('image').custom((value, { req }) => {
        // Check if req.file is present
        if (!req.file) {
            throw new Error('Please upload an image file');
        }
        // Check if only one file is uploaded
        if (!req.file && req.files) {
            throw new Error('Please upload only one image file');
        }
        // Check if the uploaded file is an image
        if (req.file && !req.file.mimetype.startsWith('image/')) {
            throw new Error('Please upload a valid image file');
        }
        // Return true if validation passes
        return true;
    }),

]

module.exports = {
    validateRegistration,
    validateLogin,
    validateQueryISOCodeCities,
    validateQueryLonLatQty,
    validateCreateEntity,
    validateGetEntities,
    validateSetLocation,
    validateGetStateEntities,
    validateGetCountryEntities,
    validateUserEntities,
    validateProfile,
    validateEntity,
    validateChangeProfileImage,
    validateVoteEntity,
    validateAddReview
}