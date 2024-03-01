// Create card
function createCard(data) {

    var tags = ""

    data = replaceNullWithEmptyString(data);

    // create div for each tag
    data.tags.split(",").forEach(tag => {
        tags += `<div class="entity-tag">${tag}</div>`
    })

    const email = data.emails ? `<div><img src="/static/assets/icons/email.svg"> ${data.emails}</div>` : ""
    const phone = data.phone_numbers ? `<div><img src="/static/assets/icons/phone_in_talk.svg"> ${data.phone_numbers}</div>` : ""
    const website = data.websites ? `<div><img src="/static/assets/icons/internet.svg"> <a class="entity-website" ref="#" onClick="window.open('${data.websites}', '_blank')">${data.websites}</a></div>` : ""
    const coordinates = data.lat ? `<div><img src="/static/assets/icons/coordinates.svg">
        <a class="entity-coordinates" href="#map" onclick="goToLocation(map, ${data.lat}, ${data.lng}, 16); setMarker({lat: ${data.lat}, lng: ${data.lng}})">
            (lat: ${data.lat}, lng: ${data.lng})
        </a>
    </div>` : ""

    const review = data.reviews.length > 0 ? data.reviews[0].review_text : "No description at this moment"
    let imagesView = ""

    console.log(data.images);

    if (data.images) {
        imagesView += `<div class="media-container">`
        data.images.forEach(image => {
            imagesView += `<img data-id="${image.id}" data-owner="${image.upladed_by}" src="${image.thumbnail_location}" data-original="${image.original_location}" onclick="openModal(this)">`
        })
        imagesView += `</div>`
    }

    const card = `
    <div class="entity-card">
        <section class="entity-main-info">
            <div class="entity-card-title"><b>${data.entity_name}</b></div>
            <div class="entity-card-location">${data.location}</div>
            <div class="entity-card-tags">${tags}</div>
            <div class="entity-contact-info">        
                ${website}
                ${phone}
                ${email}
                ${coordinates}
            </div>
        </section>
        <section class="card-media-and-creator">
            <div class="entity-card-review">                
                ${review}
            </div>
            ${imagesView}
           
            <div class="created-by-container">
                <div>created by &#160;<b onclick="window.location.href='/profile?userId=${data.submitted_by}'">${data.username}</b> <img src='/static/assets/badges/${data.badge}'></div>
                <div class="review-button-container">
                    <img src="/static/assets/icons/thumb_up.svg" title="upvote">
                    <img src="/static/assets/icons/thumb_down.svg" title="downvote">
                    <button class="general-button" onclick="window.location.href='/entity?entityId=${data.entity_id}'">Discover More</button>
                </div>
            </div>
        </section>
    </div>
    `

    return card
}

// Populates a selected div with the entity cards based on the data
function fillCardsContainer({ data, containerQuerySelector, start = 0, end = 0, replace = true }) {
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

function openModal(img) {
    var modal = document.createElement('div')
    modal.id = "imgModal"
    modal.classList.add("modal-overlay")
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close-modal" onclick="closeModal()">&times;</span>
            <img id="modalImage" class="modal-image" src="">
        </div>
    `
    document.body.appendChild(modal)
    var modalImg = document.getElementById("modalImage");
    modalImg.src = img.getAttribute("data-original");
}

function closeModal() {
    var modal = document.getElementById("imgModal");
    modal.remove()
}