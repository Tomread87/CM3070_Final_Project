const { Country, State, City } = require('country-state-city');

//Function to get all countries listed into the country-state-city library
function getAllCountries() {
    const countries = Country.getAllCountries();
    return countries;
}

function getAllCitiesOfCountry(isoCode) {
    let allCountryCities = [];

    const states = State.getStatesOfCountry(isoCode);
    for (const state of states) {
        const cities = City.getCitiesOfState(isoCode, state.isoCode);
        allCountryCities = allCountryCities.concat(cities);
    }

    return allCountryCities;
}

// function to get all cities from the country-state-city library and cache it on the server
function getAllCitiesAndStates() {



    const allCountries = Country.getAllCountries();
    const allStates = State.getAllStates();
    const allCities = City.getAllCities();

    // Check for countries without states
    for (const country of allCountries) {
        const states = State.getStatesOfCountry(country.isoCode);
        if (states.length === 0) {
            const newState = {
                name: country.name,
                countryCode: country.isoCode,
                isoCode: country.isoCode,
                latitude: country.latitude,
                longitude: country.longitude,
            };
            allStates.push(newState);
            const newCity = {
                name: newState.name,
                countryCode: newState.countryCode,
                stateCode: newState.isoCode,
                latitude: newState.latitude,
                longitude: newState.longitude,
                stateName: newState.name,
                countryName: Country.getCountryByCode(newState.countryCode).name
            };

            allCities.push(newCity)
        }
    }

    // Filter out states without cities
    const statesWithCities = allStates.filter(state => {
        const cities = City.getCitiesOfState(state.countryCode, state.isoCode);
        return cities.length > 0;
    });
    return [allCities, statesWithCities];
}

// function to return the differnece dstances between lat and long given 
function haversineDistance(lat1, lon1, lat2, lon2) {
    const toRad = x => (x * Math.PI) / 180;
    const R = 6371; // Earth radius in km

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

// function to return the closes city based on latitude and longitude
function getClosestCity(allCities, latitude, longitude) {

    let closestCity = null;
    let smallestDistance = Infinity;

    allCities.forEach(city => {
        const distance = haversineDistance(latitude, longitude, city.latitude, city.longitude);
        if (distance < smallestDistance) {
            smallestDistance = distance;
            closestCity = city;
        }
    });

    return closestCity
}

// function to return an array of cities that are the closest to a set latitude and longitude
function getClosestCities(allCities, latitude, longitude, number = 1, radius = null) {

    let cityDistances = [];

    allCities.forEach(city => {
        const distance = haversineDistance(latitude, longitude, city.latitude, city.longitude);
        cityDistances.push({ city: city, distance: distance });
    });

    // Sort cities by distance
    cityDistances.sort((a, b) => a.distance - b.distance);

    // Slice the array to get the specified number of closest cities
    let closestCities = cityDistances.slice(0, number).map(entry => entry.city);

    return closestCities;
}

// get all states in a certain radius
function getClosestStates(latitude, longitude, radius) {
    const allStates = State.getAllStates();
    let statesDistances = [];

    // Calculate distances and create array of state-distance objects
    allStates.forEach(state => {
        const distance = haversineDistance(latitude, longitude, state.latitude, state.longitude);
        if (distance <= radius) {
            statesDistances.push({ state: state, distance: distance });
        }
    });

    // Sort states by distance
    statesDistances.sort((a, b) => a.distance - b.distance);

    // Extract states from sorted array
    let closestStates = statesDistances.map(entry => entry.state);

    return closestStates;
}

// get all states in a certain radius
function getClosestCountries(latitude, longitude, radius) {
    const allCountries = Country.getAllCountries();
    let countryDistances = [];

    // Calculate distances and create array of state-distance objects
    allCountries.forEach(country => {
        const distance = haversineDistance(latitude, longitude, country.latitude, country.longitude);
        if (distance <= radius + 200) {
            countryDistances.push({ country: country, distance: distance });
        }
    });

    // Sort states by distance
    countryDistances.sort((a, b) => a.distance - b.distance);

    // Extract states from sorted array
    let closestCountries = countryDistances.map(entry => entry.country);

    return closestCountries;
}

//search for city having country code and state code and name
function searchCityByNameStateCountry(cityName, stateCode, countryCode) {
    // Search for the city
    const cities = City.getCitiesOfState(countryCode, stateCode)

    // Filter the cities by state code and country code
    const filteredCities = cities.filter(city =>
        city.name === cityName
    );

    // If there are matching cities, you can access the first one
    if (filteredCities.length > 0) {
        return filteredCities[0];
    } else {
        return false
    }
}

//cache all cities
const AllCitiesAndStates = getAllCitiesAndStates()
const allWorldCities = AllCitiesAndStates[0]
const allWorldStates = AllCitiesAndStates[1]



module.exports = {
    allWorldCities,
    getAllCountries,
    getAllCitiesOfCountry,
    getClosestCity,
    getClosestCities,
    getClosestStates,
    getClosestCountries,
    searchCityByNameStateCountry
}