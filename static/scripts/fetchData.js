// Fetch request to get entities based location
async function getEntities(location, limit, tags) {

    // Create the url depending on the parameters
    const url = new URL('/getentities', window.location.origin);
    if (location) url.searchParams.append('location', location);
    if (limit) url.searchParams.append('limit', limit);
    if (tags && tags.length) {
        // Express automatically converts multiple query parameters with the same name into an array.
        tags.forEach(tag => url.searchParams.append('tags', tag));
    }


    // Use fetch API to send the data to the server
    const response = await fetch(url, {
        method: 'GET',
    }).catch((error) => {
        console.error('Error:', error);
        // Handle errors here
    });

    const data = await response.json()

    return data
}

// Fetch request to get entities based location
async function getEntity(id) {

    // Create the url depending on the parameters
    const url = new URL('/getentity', window.location.origin);

    if (!id) return console.error("missing id")
    url.searchParams.append('entityId', id);


    // Use fetch API to send the data to the server
    const response = await fetch(url, {
        method: 'GET',
    }).catch((error) => {
        console.error('Error:', error);
        // Handle errors here
    });

    const data = await response.json()

    return data
}

// Fetch request to get state entities
async function getStateEntities(isoCode, countryCode, limit, tags) {

    // Create the url depending on the parameters
    const url = new URL('/getstateentities', window.location.origin);
    if (!isoCode && !countryCode) return console.error('Error:', error);

    url.searchParams.append('isoCode', isoCode);
    url.searchParams.append('countryCode', countryCode);

    if (limit) url.searchParams.append('limit', limit);
    if (tags && tags.length) {
        // Express automatically converts multiple query parameters with the same name into an array.
        tags.forEach(tag => url.searchParams.append('tags', tag));
    }


    // Use fetch API to send the data to the server
    const response = await fetch(url, {
        method: 'GET',
    }).catch((error) => {
        console.error('Error:', error);
        // Handle errors here
    });

    const data = await response.json()

    return data
}

// Fetch request to get country wide entities
async function getCountryEntities(countryCode, limit, tags) {

    // Create the url depending on the parameters
    const url = new URL('/getcountryentities', window.location.origin);
    if (!countryCode) return console.error('Error:', error);

    url.searchParams.append('countryCode', countryCode);

    if (limit) url.searchParams.append('limit', limit);
    if (tags && tags.length) {
        // Express automatically converts multiple query parameters with the same name into an array.
        tags.forEach(tag => url.searchParams.append('tags', tag));
    }


    // Use fetch API to send the data to the server
    const response = await fetch(url, {
        method: 'GET',
    }).catch((error) => {
        console.error('Error:', error);
    });

    const data = await response.json()

    return data
}

// Fetch request to get entities created by a user
async function getUserEntities(userId, limit, tags) {

    // Create the url depending on the parameters
    const url = new URL('/getuserentities', window.location.origin);
    if (userId) url.searchParams.append('userId', userId);
    if (limit) url.searchParams.append('limit', limit);
    if (tags && tags.length) {
        // Express automatically converts multiple query parameters with the same name into an array.
        tags.forEach(tag => url.searchParams.append('tags', tag));
    }


    // Use fetch API to send the data to the server
    const response = await fetch(url, {
        method: 'GET',
    }).catch((error) => {
        console.error('Error:', error);
        // Handle errors here
    });

    const data = await response.json()

    return data
}

// get the x number of closest city name based on latitude and longitude
async function fetchClosestCity(latitude, longitude, quantity = 1) {
    const url = new URL('/findlocationsfromCoord', window.location.origin);
    url.searchParams.append('latitude', latitude);
    url.searchParams.append('longitude', longitude);
    url.searchParams.append('qty', quantity);

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Network response was not ok: ' + response.statusText);
        }
        const data = await response.json();
        //console.log('Closest city:', data);
        return data; // Returns the fetched data
    } catch (error) {
        console.error('Error fetching the closest city:', error);
        throw error; // Rethrows the error to be handled where the function is called
    }
}

// get the x number of closest city name based on latitude and longitude
async function fetchClosestStates(latitude, longitude, distance) {
    const url = new URL('/findstatesfromcoord', window.location.origin);
    url.searchParams.append('latitude', latitude);
    url.searchParams.append('longitude', longitude);
    url.searchParams.append('qty', distance);

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Network response was not ok: ' + response.statusText);
        }
        const data = await response.json();
        //console.log('Closest city:', data);
        return data; // Returns the fetched data
    } catch (error) {
        console.error('Error fetching the closest city:', error);
        throw error; // Rethrows the error to be handled where the function is called
    }
}

// get the x number of closest city name based on latitude and longitude
async function fetchClosestCountries(latitude, longitude, distance, quantity = 1) {
    const url = new URL('/findcountriesfromcoord', window.location.origin);
    url.searchParams.append('latitude', latitude);
    url.searchParams.append('longitude', longitude);
    url.searchParams.append('qty', distance);

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Network response was not ok: ' + response.statusText);
        }
        const data = await response.json();
        return data; // Returns the fetched data
    } catch (error) {
        console.error('Error fetching the closest city:', error);
        throw error; // Rethrows the error to be handled where the function is called
    }
}

// Function to fetch cities by country ISO code
function fetchCitiesByIsoCode(isoCode) {
    // Construct the URL with the ISO code query parameter
    const url = new URL('/isocountrycities', window.location.origin);
    url.searchParams.append('isocode', isoCode);

    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            //cache data
            cities = data.allCountryCities

            //update the options in the city search
            updateCitySuggestions(cities)
        })
        .catch(error => {
            console.error('There has been a problem with your fetch operation:', error);
        });
}

function voteEntity(entityId, voteType, clickedElement) {
    // Prepare the data to send in the request body
    const requestData = {
        entity_id: entityId,
        vote_type: voteType
    };

    // Fetch options
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
    };

    // Fetch request
    fetch('/voteentity', options)
        .then(response => {
            if (response.ok) {
                // Handle successful response
                console.log('Vote submitted successfully');
                // Remove vote-selected class from all siblings
                const parent = clickedElement.parentElement;
                const siblings = parent.children;
                for (let i = 0; i < siblings.length; i++) {
                    siblings[i].classList.remove('vote-selected');
                }

            } else {
                // Handle error response
                console.error('Failed to submit vote');
            }
            return response.json()
        })
        .then(data => {
            console.log(data);
            clickedElement.classList.add('vote-selected');
            let span = clickedElement.parentElement.querySelector(".total-votes")
            if (data.vote_data.action == 'insert') {
                span.innerText = parseInt(span.innerText) + parseInt(voteType)
            } else {
                let db_vote = data.vote_data.db_vote
                if (db_vote != voteType) {
                    span.innerText = parseInt(span.innerText) + parseInt(voteType*2)
                }
            }
            // Add vote-selected class to the clicked element


            
        })
        .catch(error => {
            // Handle fetch error
            console.error('Error while submitting vote:', error);
        });
}