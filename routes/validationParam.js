const { query, body, matchedData, validationResult } = require('express-validator');
const { allWorldCities } = require('../serverside_scripts/cities.js')

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
    body('review').optional({ checkFalsy: true }).isLength({ max: 500 }).withMessage('Review must be less than 500 characters'),
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
    })
];

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

const validateProfile = [
    query('userId')
    .optional()
    .isInt({ min: 1 }) // Ensure it's an integer greater than 0
    .withMessage('userId is required'),
]

const validateEntity = [
    query('entityId')
    .isInt({ min: 1 }) // Ensure it's an integer greater than 0
    .withMessage('an entityId is required to view this page'),
]


//validate post request to ser location
const validateSetLocation = [
    body('name').isString().withMessage('Name must be a string'),
    body('lat').isFloat().withMessage('Latitude must be a float number'),
    body('lng').isFloat().withMessage('Longitude must be a float number'),
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
    validateEntity
}