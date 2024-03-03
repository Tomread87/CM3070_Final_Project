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
        throw error
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
                    span.innerText = parseInt(span.innerText) + parseInt(voteType * 2)
                }
            }
            // Add vote-selected class to the clicked element



        })
        .catch(error => {
            // Handle fetch error
            console.error('Error while submitting vote:', error);
        });
}

async function deleteEntity(entityId) {

    try {
        const response = await fetch(`/deleteentity?entityId=${entityId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            const errorMessage = await response.text();
            throw new Error(`Failed to delete entity: ${errorMessage}`);
        }
        const data = await response.json();
        create_success_message(`Knowledge Removed`, `You have succesfully 
        <b>removed ${data.entity.entity_name}</b> and it will not be visible anymore, you will now be redirected to the homepage`,
            "window.location.href='/'")
    } catch (error) {
        console.error('Error deleting entity:', error);
        create_alert_message("Attention", `${error}`)
    }
}

// Fetch Request to Add Entity 
async function submitEntityForm(type) {

    if (type != 'new' && type != 'update') return console.error("missing parameter type, it should be either new or update")

    const entityName = document.getElementById('entity-name').value;
    const entityTag = document.getElementById('entity-tag').value.split(',').map(tag => tag.trim());
    const phoneNumber = document.getElementById('contact-phone-number').value;
    const email = document.getElementById('contact-email').value;
    const website = document.getElementById('contact-website').value;
    const review = document.querySelector('textarea[name="entity-review"]').value.trim();
    const location = await JSON.parse(localStorage.getItem("location"))


    var entityLatitutde = document.getElementById('entity-latitude') ? document.getElementById('entity-latitude').value : null;
    var entityLongitude = document.getElementById('entity-longitude') ? document.getElementById('entity-longitude').value : null;

    if (entityName == "") {
        closeMessageModal()
        return document.querySelector("#tag-error-message").innerText = "You need to add the Name of the service or spot"
    }

    // at least one entity tag required
    if (entityTag == "") {
        closeMessageModal()
        return document.querySelector("#tag-error-message").innerText = "At least one tag must be added"
    }

    // at least one contact detail required
    if (email == "" && phoneNumber == "" && website == "" && !entityLatitutde && !entityLongitude) {
        closeMessageModal()
        return document.querySelector("#contact-error-message").innerText = "At least one contact detail must be added, or coordinates must be present"
    }

    if (!isValidLocation(location)) {
        closeMessageModal()
        create_alert_message("No Location Selected", "<div style='text-align: left'>To proceed you need to select a location by:<br> - selecting one location with green borders on the map<br> - selecting from the list just below the map<br> - click on find where I am and then set the location</div>")
    }


    // create an object to send to server
    const data = {
        entityName: entityName,
        entityTag: entityTag,
        phoneNumber: phoneNumber,
        email: email,
        website: website,
        review: review,
        location: location.name,
        locationLat: location.lat,
        locationLng: location.lng,
        lat: entityLatitutde,
        lng: entityLongitude
    };

    if (type === "update") {
        data.entityId = document.getElementById("update-form-entityId").value   
    }

    const formData = new FormData();

    // Get all selected files
    const files = document.getElementById('entity-image').files;

    // Append each file to FormData
    for (const file of files) {
        formData.append("images", file);
    }

    // Append the jsonData
    formData.append("jsonData", JSON.stringify(data))

    // show loading animation
    document.querySelector(".loading-animation").style.display = "contents"

    //hide message
    document.querySelector(".prompt-message").style.display = "none"

    const url = type === 'new' ? '/createentity' : '/updateentity'
    console.log(data);

    // Use fetch API to send the data to the server
    fetch(url, {
        method: 'POST',
        body: formData,
    })
        .then(response => {
            // close all previous message modals
            closeMessageModal()
            if (response.ok) response.json()
            else if (response.status == 403) throw new Error("You need to be registered and logged in to add local knowledge")
            else if (response.status >= 400 && response.status <= 400) throw new Error("Something is wrong with the request")
            else if (response.status >= 500) throw new Error("Ops! Something went wrong, it's not your fault it's ours and we will try to fix it as soon as possible.")
        })
        .then(data => {
            console.log('Success:', data);
            //Will need to create popup message to show success
            create_success_message("Knowledge Created", "New Knowledge Added Successfully", "window.location.reload()")
            //window.location.reload()
        })
        .catch((error) => {
            console.error(error);
            // Handle errors here, such as showing an error message to the user
            create_alert_message("Attention", "Something went wrong:\n" + error)
        });

}


function isValidLocation(data) {
    // Check if data is an object and has the required properties
    if (typeof data === 'object' && data !== null) {
        if ('name' in data && 'lat' in data && 'lng' in data) {
            // Check if lat and lng are valid numbers
            if (typeof data.lat === 'number' && !isNaN(data.lat) &&
                typeof data.lng === 'number' && !isNaN(data.lng)) {
                return true; // Data is valid
            }
        }
    }
    return false; // Data is invalid
}