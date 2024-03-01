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
            <div class="add-knowledge-inner-wrapper">
                
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
                    <h4>Images</h4>
                    <div style="font-size: 0.8em; color: red">max 5 files</div>
                    <input type="file" id="entity-image" name="image" accept="image/*" multiple>
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

    const formData = new FormData();

    // Get all selected files
    const files = document.getElementById('entity-image').files;

    console.log(files);
    // Append each file to FormData
    for (const file of files) {
        formData.append("images", file);
    }

    // Append the jsonData
    formData.append("jsonData", JSON.stringify(data))

    console.log(formData);
    // Use fetch API to send the data to the server
    fetch('/createentity', {
        method: 'POST',
        body: formData,
    })
    .then(response => {
        // close all previous message modals
        closeMessageModal()
        if (response.ok) response.json()
        else if (response.status == 403) throw new Error("You need to be registered and logged in to add local knowledge")
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
