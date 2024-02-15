// Creates the popup window t add local knowledge
function createKnowledgePopup() {

    //to stop duplicate popups
    const popup = document.querySelector(".add-knowledge-popup")

    if (popup) return

    //create container
    const section = document.createElement('section')
    const body = document.querySelector('body')

    section.classList.add('add-knowledge-popup')

    section.innerHTML =
        `<section class="add-knowledge-popup">
        <div class="add-knowledge-inner-wrapper main-container">
            
            <form id="create-entity" action="/createentity" method="post">
                <div>
                    <h2>Add Local Knowledge of Your Area</h2><button class="close-popup">×</button>
                </div>
                
                <div>
                    <label for="entity-name">Name of Service or Spot</label>
                    <input id="entity-name" name="entity-name" type="text" required>
                </div>
                <br>
                <div>
                    <label for="entity-tag">Add one or more tags, you can separate tags with a coma ","</label>
                    <input id="entity-tag" type="text" name="entity-tag">
                    <br>
                    <button hidden type="button" class="submit-button" id="add-tag-button">Add Tag</button>
                </div>
                <br>
                <div>
                    <!--b>attached Tags:</b>
                    <div id="attached-tags"></div-->
                    <div class="form-error-message" id="tag-error-message"></div>
                </div>
                <h4>Contact Information</h4>
                <div class="form-error-message" id="contact-error-message"></div>
                <div>
                    <div>
                        <label for="contact-phone-number">Phone Number</label>
                        <input id="contact-phone-number" type="tel" name="contact-phone-number">
                        <br>
                        <div hidden>
                            <button type="button" class="submit-button plus-button"><b>+</b></button> Add another phone number
                        </div>

                    </div>
                    <br>
                    <div>
                        <label for="contact-email">Email</label>
                        <input id="contact-email" type="email" name="contact-email">
                        <br>
                        <div hidden><button type="button" class="submit-button plus-button"><b>+</b></button> Add another email</div>

                    </div>
                    <br>
                    <div>
                        <label for="contact-website">Website</label>
                        <input id="contact-website" type="url" name="contact-website">
                        <br>
                        <div hidden><button type="button" class="submit-button plus-button"><b>+</b></button> Add another website</div>

                    </div>
                    <br>
                </div>
                <h4>Review</h4>
                <textarea name="entity-review" id="" cols="30" rows="10" maxlength="500" style="width: 350px" value=""></textarea>
                <br>
                <br>
                <button type="submit" class="submit-button">Add Entity</button>
            </form>
        </div>
    </section>`

    body.appendChild(section)

    // Add the event listener
    addEntityFormListener()

    section.querySelector('.close-popup').addEventListener("click", () => {
        section.remove()
    })
}


// Fetch Request to Add Entity 
function addEntityFormListener() {

    const form = document.getElementById('create-entity')
    if (form) {
        document.getElementById('create-entity').addEventListener('submit', async function (event) {
            event.preventDefault(); // Prevent the default form submission

            const permission = window.confirm("You are creating a new entity and possibly sharing sensitive data.\nPlease confirm that you have obtained permission from the owner of the data to share this information.");

            if (!permission) return

            const entityName = document.getElementById('entity-name').value;
            const entityTag = document.getElementById('entity-tag').value.split(',');
            const phoneNumber = document.getElementById('contact-phone-number').value;
            const email = document.getElementById('contact-email').value;
            const website = document.getElementById('contact-website').value;
            const review = document.querySelector('textarea[name="entity-review"]').value.trim();
            const location = await JSON.parse(localStorage.getItem("location"))

            // at least one entity tag required
            if (entityTag == "") return document.querySelector("#tag-error-message").innerText = "At least one tag must be added"

            // at least one contact detail required
            if (email == "" && phoneNumber == "" && website == "") return document.querySelector("#contact-error-message").innerText = "At least one contact detail must be added"

            // create an object to send to server
            const data = {
                entityName: entityName,
                entityTag: entityTag,
                phoneNumber: phoneNumber,
                email: email,
                website: website,
                review: review,
                location: location.name
            };


            // Use fetch API to send the data to the server
            fetch('/createentity', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data),
            })
                .then(response => {
                    if (response.ok) response.json()
                    else if(response.status == 403) throw new Error("You need to be registered and logged in to add local knowledge")
                })
                .then(data => {
                    console.log('Success:', data);
                    //Will need to create popup message to show success
                    alert("New Knowledge Added Successfully")
                    window.location.reload()
                })
                .catch((error) => {
                    console.error(error);
                    // Handle errors here, such as showing an error message to the user
                    alert("Something went wrong:\n" + error)
                });
        });
    }

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

    console.log('Success:', data);
    // Process the response here

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

    const card = `
    <div class="entity-card">
        <div>
            <div class="entity-card-title"><b>${data.entity_name}</b> in <b>${data.location}</b></div>
            <div class="entity-card-tags">${tags}</div>
            <div>
                <br>
                <b>Contact Info:</b>
                <br>
                <ul>
                    <li>Email: ${data.emails}</li>
                    <li>Phone: ${data.phone_numbers}</li>
                    <li>Website: ${data.websites}</li>
                </ul>
            </div>
            <div>
                <b>Review</b>
                <br>
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
    document.querySelector("#show-city-name").innerHTML = `Exploring Local Knowledge in <b>${location}</b>`

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
