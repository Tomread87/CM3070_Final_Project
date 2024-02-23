
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

//function to populate native datalist with data, the data list works on chrome and firefox not edge -> look for solution in the future
function updateCitySuggestions(cities) {
    const cityList = document.getElementById('city_suggestions');
    cityList.innerHTML = ''; // Clear existing options

    cities.forEach(city => {
        const option = document.createElement('option');
        option.value = city.name; // Assuming city objects have a 'name' property
        cityList.appendChild(option);
        option.innerText = city.name
    });
}

//returns the coordinates of a city if it's available in the cached cities
function getCityCoordinates(cityName, cities) {
    // Find the city object where the name matches cityName
    const city = cities.find(city => city.name === cityName);

    // Return the found city object or null if not found
    return city || null;
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
        //console.log('Closest city:', data);
        return data; // Returns the fetched data
    } catch (error) {
        console.error('Error fetching the closest city:', error);
        throw error; // Rethrows the error to be handled where the function is called
    }
}

// Creates the popup window t add local knowledge
function createKnowledgePopup(input = currentLocation, includeCoord = false) {

    //to stop duplicate popups
    const popup = document.querySelector(".add-knowledge-popup")

    if (popup) return

    const isLoggedIn = document.querySelector(".log-in-wrapper").getAttribute("data-loggedIn") === "true" ? true : false

    if (!isLoggedIn) return create_alert_message("Attention", "you need to be logged in to add local knowledge")
    if (!currentLocation) return create_alert_message("Attention", "you need select a location before you can add local knowledge")


    //create container
    const section = document.createElement('section')
    const body = document.querySelector('body')

    section.classList.add('add-knowledge-popup')

    let coordString = ""
    if (includeCoord) {
        coordString = `
        <h4>Coordinates</h4>
        <div>
            <label for="entity-latitude">latitude</label>
            <input max="90" min="-90" step="0.0000000001" id="entity-latitude" type="number" name="entity-latitude" value="${input.lat}">
            <label for="entity-longitude">latitude</label>
            <input max="90" min="-90" step="0.0000000001" id="entity-longitude" type="number" name="entity-longitude" value="${input.lng}">  
        </div>
        `
    }

    section.innerHTML =
        `<section class="add-knowledge-popup">
            <div class="add-knowledge-inner-wrapper main-container">
                
                <form id="create-entity" action="/createentity" method="post">
                    <div>
                        <h2>Add Local Knowledge to ${input.name}</h2>
                        <button class="close-popup" type="button">×</button>
                    </div>
 
                    <div>
                        <label for="entity-name">Name of Service or Spot</label>
                        <input id="entity-name" name="entity-name" type="text" required>
                    </div>
                    
                    <div>
                        <label for="entity-tag">Add one or more tags, you can separate tags with a coma ","</label>
                        <input id="entity-tag" type="text" name="entity-tag">
                        <div class="inputed-tags-container"></div>
                        <div class="inputed-tags-error"></div>
                    </div>
                    <div>
                        <!--b>attached Tags:</b>
                        <div id="attached-tags"></div-->
                        <div class="form-error-message" id="tag-error-message"></div>
                    </div>
                    ${coordString}
                    <h4>Contact Information</h4>
                    <div class="form-error-message" id="contact-error-message"></div>
                    <div>
                        <div>
                            <label for="contact-phone-number">Phone Number</label>
                            <input id="contact-phone-number" type="tel" name="contact-phone-number">
                            
                            <div hidden>
                                <button type="button" class="submit-button plus-button"><b>+</b></button> Add another phone number
                            </div>

                        </div>
                        <div>
                            <label for="contact-email">Email</label>
                            <input id="contact-email" type="email" name="contact-email">   
                            <div hidden><button type="button" class="submit-button plus-button"><b>+</b></button> Add another email</div>

                        </div>
                        <div>
                            <label for="contact-website">Website</label>
                            <input id="contact-website" type="url" name="contact-website">
                            
                            <div hidden><button type="button" class="submit-button plus-button"><b>+</b></button> Add another website</div>

                        </div>

                    </div>
                    <h4>Review</h4>
                    <textarea name="entity-review" id="" cols="30" rows="10" maxlength="500" style="width: 350px" value=""></textarea>
                    
                    <button id="entity-form-submit" type="button" class="submit-button">Add Entity</button>
                </form>
            </div>
        </section>`

    body.appendChild(section)

    //const entityForm = section.querySelector('form')

    // Add the event listener
    //addEntityFormListener()

    section.querySelector("#entity-form-submit").addEventListener("click", () => {
        create_prompt_message(
            "Attention",
            `You are creating a new entity and possibly sharing sensitive data.\nPlease confirm that you have obtained permission from the owner of the data to share this information.`,
            "submitNewEntityForm()",
            "Confirm"
        )
    })

    section.querySelector('.close-popup').addEventListener("click", () => {
        section.remove()
    })

    // On entering tags in the form show tag in the tags container of the form
    section.querySelector('#entity-tag').addEventListener("input", (e) => {

        const container = section.querySelector('.inputed-tags-container')
        var tags = e.target.value.split(',')
        var trimmedTags = []

        //trim tags to have them orderly
        tags.forEach(tag => {
            const trimmedTag = tag.trim();
            if (trimmedTag) {
                trimmedTags.push(trimmedTag);
            }
        });
        tags = trimmedTags

        // check if tag is repeated
        if (e.data == ",") {
            let setTags = [...new Set(tags)]
            if (setTags.length != tags.length) section.querySelector('.inputed-tags-error').innerHTML = "*tag already present"
            tags = setTags
        }

        // check if more than 20 tags have been inputed
        if (tags.length > 20) {
            section.querySelector('.inputed-tags-error').innerHTML = "*20 tags max"
        }
        tags = tags.slice(0, 20)

        // add the tags to the tags container
        container.innerHTML = ""
        tags.forEach(tag => {
            container.innerHTML += `<div class="entity-tag">${tag.trim()}</div>`
        })

        // if comma then expect new word show all word in orderly manner inside input
        if (e.data == ",") {
            e.target.value = tags.join(', ') + e.data
        }
    })
}

// Fetch Request to Add Entity 
async function submitNewEntityForm() {

    const entityName = document.getElementById('entity-name').value;
    const entityTag = document.getElementById('entity-tag').value.split(',');
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

    console.log(data);

    // Use fetch API to send the data to the server
    fetch('/createentity', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data),
    })
        .then(response => {
            // close all previous message modals
            closeMessageModal()
            if (response.ok) response.json()
            else if (response.status == 403) throw new Error("You need to be registered and logged in to add local knowledge")
        })
        .then(data => {
            console.log('Success:', data);
            //Will need to create popup message to show success
            create_success_message("Knowledge Created", "New Knowledge Added Successfully","window.location.reload()")
            //window.location.reload()
        })
        .catch((error) => {
            console.error(error);
            // Handle errors here, such as showing an error message to the user
            create_alert_message("Attention", "Something went wrong:\n" + error)
        });




}

// Fetch request to get entities
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

// Fetch request to get entities
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

// Fetch request to get entities
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

// Create card
function createCard(data) {

    var tags = ""

    data = replaceNullWithEmptyString(data);

    // create div for each card
    data.tags.split(",").forEach(tag => {
        tags += `<div class="entity-tag">${tag}</div>`
    })

    const email = data.emails ? `<li>Email: ${data.emails}</li>` : ""
    const phone = data.phone_numbers ? `<li>Phone: ${data.phone_numbers}</li>` : ""
    const website = data.website ? `<li>Website: ${data.websites}</li>` : ""
    const coordinates = data.lat ? `<li>Coordinates:
        <br>
        <a href="#map" onclick="goToLocation(map, ${data.lat}, ${data.lng}, 16); setMarker({lat: ${data.lat}, lng: ${data.lng}})">
            (lat: ${data.lat}, lng: ${data.lng})
        </a>
    <li>` : ""

    const card = `
    <div class="entity-card">
        <div>
            <div class="entity-card-title"><b>${data.entity_name}</b> in <b>${data.location}</b></div>
            <div class="entity-card-tags">${tags}</div>
            <div>
                
                <b>Contact Info:</b>
                
                <ul>
                    ${coordinates}
                    ${email}
                    ${phone}
                    ${website}
                </ul>
            </div>
            <div>
                <b>Review</b>
                
                ${data.reviews}
            </div>
        </div>

        <div>
            Leave a vote or a review if you know this entity
            <div class="review-button-container">
                <img src="/static/assets/icons/upvote.svg" title="upvote">
                <img src="/static/assets/icons/downvote.svg" title="downvote">
                <button>Leave a Review</button>
            </div>
            
        </div>
        <div>
        created by <b>${data.username}</b>
        </div>

        
    </div>
    `

    return card
}


function replaceNullWithEmptyString(obj) {
    Object.keys(obj).forEach(key => {
        if (obj[key] === null) {
            obj[key] = "";
        }
    });
    return obj;
}


function showAllSections(location) {

    // Change the heading of section
    document.querySelector("#location-selection-wrapper > h2").innerHTML = "Change your Location"

    // Change the heading of section
    document.querySelector("#show-city-name").innerHTML = `<b>${location}</b> is selected, explore what this location has to offer`

    // Change recently added section header
    document.querySelector('.recently-added > h2').innerHTML = `Recent services and spots in <b>${location}</b>`

    // Change the heading of section
    // document.querySelector("#create-entity > h2").innerHTML = `Add Local Knowledge to <b>${location}</b>`

    // Unhide various sections
    let sections = document.querySelectorAll("section.hidden");
    sections.forEach(section => {
        section.classList.remove("hidden")
    })
}

// Populates a selected div with the entity cards based on the data
function fillCardsContainer(data, containerQuerySelector) {
    // Fill the cards container
    const cardsContainer = document.querySelector(containerQuerySelector)
    cardsContainer.innerHTML = ""
    data.entities.forEach(entity => {
        cardsContainer.innerHTML += createCard(entity)
    })
}
