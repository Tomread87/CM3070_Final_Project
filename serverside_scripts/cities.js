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
function getAllCities() {
    let allCities = [];
    let timestamp1 = new Date()
    const countries = Country.getAllCountries();

    for (const country of countries) {
        const states = State.getStatesOfCountry(country.isoCode);
        for (const state of states) {
            const cities = City.getCitiesOfState(country.isoCode, state.isoCode);
            allCities = allCities.concat(cities);
        }
    }

    let timestamp2 = new Date()
    let timeDifference = (timestamp2 - timestamp1) / 1000; // Convert milliseconds to seconds


    console.log("allCities loaded in " + timeDifference + " seconds");

    return allCities;
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
    let timestamp1 = new Date()
    let closestCity = null;
    let smallestDistance = Infinity;
        
    allCities.forEach(city => {
        const distance = haversineDistance(latitude, longitude, city.latitude, city.longitude);
        if (distance < smallestDistance) {
            smallestDistance = distance;
            closestCity = city;
        }
    });

    let timestamp2 = new Date()
    let timeDifference = (timestamp2 - timestamp1) / 1000; // Convert milliseconds to seconds

    //console.log(closestCity, timeDifference)

    return closestCity      
}

// function to return an array of cities that are the closest to a set latitude and longitude
function getClosestCities(allCities, latitude, longitude, number = 1, radius = null) {
    let timestamp1 = new Date();
    let cityDistances = [];

    allCities.forEach(city => {
        const distance = haversineDistance(latitude, longitude, city.latitude, city.longitude);
        cityDistances.push({ city: city, distance: distance });
    });

    // Sort cities by distance
    cityDistances.sort((a, b) => a.distance - b.distance);

    // Slice the array to get the specified number of closest cities
    let closestCities = cityDistances.slice(0, number).map(entry => entry.city);

    // let timestamp2 = new Date();
    // let timeDifference = (timestamp2 - timestamp1) / 1000; // Convert milliseconds to seconds

    return closestCities;
}

//cache all cities
const allWorldCities = getAllCities()


module.exports = {
    allWorldCities,
    getAllCountries,
    getAllCitiesOfCountry,
    getClosestCity,
    getClosestCities
}