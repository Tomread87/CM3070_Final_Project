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
            <div class="entity-card-title"><b>${data.entity_name}</b></div>
            <div class="entity-card-location">${data.location}</div>
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

        <!-- div>
            Leave a vote or a review if you know this entity
            <div class="review-button-container">
                <img src="/static/assets/icons/upvote.svg" title="upvote">
                <img src="/static/assets/icons/downvote.svg" title="downvote">
                <button>Leave a Review</button>
            </div>
            
        </div -->
        <div class="created-by-container">
        created by &#160;<b>${data.username}</b> <img src='/static/assets/badges/${data.badge}'>
        </div>

        
    </div>
    `

    return card
}

// Populates a selected div with the entity cards based on the data
function fillCardsContainer({data, containerQuerySelector, start = 0, end = 0, replace = true}) {
    // Fill the cards container
    const cardsContainer = document.querySelector(containerQuerySelector)
    if (replace) cardsContainer.innerHTML = ""

    // Determine the end index if it's not specified
    if (end === 0 || end > data.length) {
        end = data.length;
    }

    // Determine the end index if it's not specified
    if (start > data.length) {
        return
    }

    for (let i = start; i < end; i++) {
        cardsContainer.innerHTML += createCard(data[i]);
    }
}

// replaces null values with emtpy string
function replaceNullWithEmptyString(obj) {
    Object.keys(obj).forEach(key => {
        if (obj[key] === null) {
            obj[key] = "";
        }
    });
    return obj;
}
