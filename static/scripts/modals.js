function create_alert_message(title, message) {

    if (document.querySelector('.modal-message-container') == null) {
        let modal = document.createElement('div')
        modal.classList.add('modal-message-container')
        modal.innerHTML = `
            <div class="inner-message-modal">
                <div style='display: flex; align-items: center; justify-content: center'>
                    <img src='/static/assets/icons/alert_red.png' height='30' width='30'>
                    <span style='margin-left: 6px; font-size: 1.5em; font-weight: 700'>${title}</span>
                </div>
                <br>
                ${message}
                <br>
                <br>
                <button class="general-button" onclick="closeMessageModal()">Close</button>
            </div>`
        document.body.appendChild(modal)
        modal.classList.add('message-modal-anim')
    }
}

/**
 * 
 * @param {*} message message to display
 * @param {*} title header title
 * @param {*} action action that that might be needed to perform on confirm
 */
function create_info_message(title, message, action = null) {
    let body = document.body
    let myaction = action

    if (action === null) {
        myaction = `closeMessageModal()`
    }

    if (document.querySelector('.modal-message-container') == null) {
        let modal = document.createElement('div')
        modal.classList.add('modal-message-container')
        modal.innerHTML = `
            <div class="inner-message-modal">
                <div style='display: flex; align-items: center; justify-content: center'>
                    <img src='/static/assets/icons/info-svgrepo-com.svg' height='30' width='30'>
                    <span style='margin-left: 6px; font-size: 1.5em; font-weight: 700'>${title}</span>
                </div>
                <br>
                ${message}
                <br>
                <br>
                <button class="general-button" onclick="${myaction}">Close</button>
            </div>`
        body.appendChild(modal)
        modal.classList.add('message-modal-anim')

    }
}

/**
 * 
 * @param {string} message message to display
 * @param {string} title header title
 * @param {*} action action that that might be needed to perform on ok
 */
function create_success_message(title, message, action = null) {
    let body = document.body
    let myaction = action


    if (action === null) {
        action = "closeMessageModal()"
    }


    if (document.querySelector('.modal-message-container') == null) {
        let modal = document.createElement('div')
        modal.classList.add('modal-message-container')
        modal.innerHTML = `<div class="inner-message-modal">
                <div style='display: flex; align-items: center; justify-content: center;'>
                    <img src='/static/assets/icons/ok_green.png' height='30' width='30'>
                    <span style='margin-left: 6px; font-size: 1.5em; font-weight: 700; width: min-content; text-wrap: nowrap;'>${title}</span>
                </div>

                <br>
                ${message}
                <br>
                <br>
                <button class="general-button" onclick="${myaction}">Close</button>
            </div>`
        body.appendChild(modal)
        modal.classList.add('message-modal-anim')
    }
}


/**
 * 
 * @param {*} message message to display
 * @param {*} title header title
 * @param {*} action action that that might be needed to perform on confirm
 */
function create_prompt_message(title, message, action, confirm_name = 'Ok') {
    let body = document.body
    let myaction = action

    if (document.querySelector('.modal-message-container') == null) {
        let modal = document.createElement('div')
        modal.classList.add('modal-message-container')
        modal.innerHTML = `
            <div class="inner-message-modal">

                <!-- Loading animation -->
                <div class="loading-animation" style="display: none;">
                    <img src="/static/assets/icons/spinner.gif">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                </div>

                <div class="prompt-message">
                    <div style='display: flex; align-items: center; justify-content: center;'>
                        <img src='/static/assets/icons/info-svgrepo-com.svg' style="height: 34px">
                        <div style='margin-left: 10px; font-size: 1.5em; text-align: center; font-weight: 700'>${title}</div>
                    </div>

                    <br>
                    <div style="text-align: center">
                    ${message}
                    </div>

                    <br>
                    <br>
                    <div style="display: flex; justify-content: center; gap: 10px">
                        <button class="general-button" style="margin-right: 10px" onclick="${myaction}">${confirm_name}</button>
                        <button class="general-button cancel-button" onclick="closeMessageModal()">Cancel</button>
                    </div>
                </div>
            </div>`
        body.appendChild(modal)
        modal.classList.add('message-modal-anim')

    }
}


// Creates the popup window t add local knowledge
function createKnowledgePopup(location, includeCoord = false) {

    //to stop duplicate popups
    const popup = document.querySelector(".add-knowledge-popup")

    if (popup) return

    const isLoggedIn = document.querySelector(".log-in-wrapper").getAttribute("data-loggedIn") === "true" ? true : false

    if (!isLoggedIn) return create_alert_message("Attention", "you need to be logged in to add local knowledge")
    if (!location) return create_alert_message("Attention", "you need select a location before you can add local knowledge")


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
            <input max="90" min="-90" step="0.00001" id="entity-latitude" type="number" name="entity-latitude" value="${location.lat}">
            <label for="entity-longitude">latitude</label>
            <input max="90" min="-90" step="0.00001" id="entity-longitude" type="number" name="entity-longitude" value="${location.lng}">  
        </div>
        `
    }

    section.innerHTML =
        `<section class="add-knowledge-popup">
            <div class="add-knowledge-inner-wrapper">
                
                <form id="create-entity" action="/createentity" method="post">
                    <div class="knowledge-form-title">
                        <h2>Add Local Knowledge to ${location.name}</h2>
                        <button class="close-popup" type="button">×</button>
                    </div>
 
                    <div>
                        <label for="entity-name">Enter the name of service, person, spot or knowledge</label>
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
                    
                    <div class="file-upload">
                        <label for="entity-image" class="file-upload-label">
                            <img src="/static/assets/icons/place_item.svg">
                            <span class="choose-file"><b>Choose your files</b> or drag them here</span>
                            <input id="entity-image" name="image" type="file" accept="image/*" multiple>
                            <div class="image-input-message" style="font-size: 0.8em;">max 10 files</div>
                        </label>
                    </div>

                    <h4>Describe the Knowledge</h4>
                    <textarea name="entity-review" id="" cols="30" rows="10" maxlength="1000" style="max-width: 350px; width: 100%;" value="" placeholder="max 1000 characters"></textarea>
                    
                    <button id="entity-form-submit" type="button" class="submit-button">Add Entity</button>
                </form>
            </div>
        </section>`

    body.appendChild(section)

    //const entityForm = section.querySelector('form')



    section.querySelector("#entity-form-submit").addEventListener("click", () => {
        create_prompt_message(
            "Attention",
            `You are creating a new entity and possibly sharing sensitive data.\nPlease confirm that the data is of public domain or that you have obtained permission from the owner of the data to share this information.`,
            "submitEntityForm('new')",
            "Confirm"
        )
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


    section.querySelector('.close-popup').addEventListener("click", () => {


        // Loop through child elements and remove event listeners by coning and replacing them
        section.querySelectorAll('*').forEach(child => {
            const clonedNode = child.cloneNode(true); // Clone the node to preserve its properties
            child.replaceWith(clonedNode); // Replace the original node with the cloned one
        });

        section.remove()


    })

    // call the drag and rop scripts
    callDragAndDrop(section)
}

// Creates the popup window t add local knowledge
function createModifyKnowledgePopup(entity, userId) {
;
    //to stop duplicate popups
    const popup = document.querySelector(".add-knowledge-popup")
    if (popup || !entity) return

    //create container
    const section = document.createElement('section')
    const body = document.querySelector('body')

    section.classList.add('add-knowledge-popup')

    let coordString = ""
    if (entity.lat && entity.lng) {
        coordString = `
        <h4>Coordinates</h4>
        <div>
            <label for="entity-latitude">latitude</label>
            <input max="90" min="-90" step="0.00001" id="entity-latitude" type="number" name="entity-latitude" value="${convertNullToEmptyString(entity.lat)}">
            <label for="entity-longitude">latitude</label>
            <input max="90" min="-90" step="0.00001" id="entity-longitude" type="number" name="entity-longitude" value="${convertNullToEmptyString(entity.lng)}">  
        </div>
        `
    }

    section.innerHTML =
        `<section class="add-knowledge-popup">
            <div class="add-knowledge-inner-wrapper">
                
                <form id="create-entity" action="/createentity" method="post">
                    <input id="update-form-entityId" class="hidden" type="text" value='${entity.entity_id}'>
                    <div class="knowledge-form-title">
                        <h2>Change Information of ${entity.entity_name}</h2>
                        <button class="close-popup" type="button">×</button>
                    </div>
 
                    <div>
                        <label for="entity-name">Enter the name of service, person, spot or knowledge</label>
                        <input id="entity-name" name="entity-name" type="text" required value="${entity.entity_name}">
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
                            <input id="contact-phone-number" type="tel" name="contact-phone-number" value="${convertNullToEmptyString(entity.phone_numbers)}">
                            
                            <div hidden>
                                <button type="button" class="submit-button plus-button"><b>+</b></button> Add another phone number
                            </div>

                        </div>
                        <div>
                            <label for="contact-email">Email</label>
                            <input id="contact-email" type="email" name="contact-email" value="${convertNullToEmptyString(entity.emails)}">   
                            <div hidden><button type="button" class="submit-button plus-button"><b>+</b></button> Add another email</div>

                        </div>
                        <div>
                            <label for="contact-website">Website</label>
                            <input id="contact-website" type="url" name="contact-website" value="${convertNullToEmptyString(entity.websites)}">
                            
                            <div hidden><button type="button" class="submit-button plus-button"><b>+</b></button> Add another website</div>
                        </div>
                    </div>
                    <h4>Add more Images</h4>
                    
                    <div class="file-upload">
                        <label for="entity-image" class="file-upload-label">
                            <img src="/static/assets/icons/place_item.svg">
                            <span class="choose-file"><b>Choose your files</b> or drag them here</span>
                            <input id="entity-image" name="image" type="file" accept="image/*" multiple>
                            <div class="image-input-message" style="font-size: 0.8em;">max 10 files</div>
                        </label>
                    </div>

                    <h4>Describe the Knowledge</h4>
                    <textarea name="entity-review" id="" cols="30" rows="10" maxlength="1000" style="width: 350px" placeholder="max 1000 characters">${convertNullToEmptyString(findReviewTextByUserId(entity.reviews, userId))}</textarea>
                    <button id="entity-form-submit" type="button" class="submit-button">Modify Knowledge</button>
                </form>
            </div>
        </section>`

    body.appendChild(section)

    //const entityForm = section.querySelector('form')

    // Add the event listener

    section.querySelector("#entity-form-submit").addEventListener("click", () => {
        create_prompt_message(
            "Attention",
            `You are modifying a knowledge entity and possibly sharing sensitive data.\nPlease confirm that the data is of public domain or that you have obtained permission from the owner of the data to share this information.`,
            "submitEntityForm('update')",
            "Confirm"
        )
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

    // Set the value of the input element to the 'tags' property of the 'entity' object
    section.querySelector('#entity-tag').value = entity.tags;

    // Create a new input event and pass the 'entity.tags' value as a property
    const inputEvent = new InputEvent('input', {
        bubbles: true,
        cancelable: true,
        data: entity.tags, // Pass the 'entity.tags' value here
    });

    // Dispatch the input event on the input element
    section.querySelector('#entity-tag').dispatchEvent(inputEvent);


    section.querySelector('.close-popup').addEventListener("click", () => {


        // Loop through child elements and remove event listeners by coning and replacing them
        section.querySelectorAll('*').forEach(child => {
            const clonedNode = child.cloneNode(true); // Clone the node to preserve its properties
            child.replaceWith(clonedNode); // Replace the original node with the cloned one
        });

        section.remove()


    })

    // call the drag and rop scripts
    callDragAndDrop(section)
}

// calls the 
function callModifyKnowledgePopup(entityId, userId) {

    try {
        getEntity(entityId)
            .then(entity => {
                createModifyKnowledgePopup(entity, userId)
            })
    } catch (error) {
        console.error(error);
        closeMessageModal()
        return create_alert_message("Attention", error)
    }


}

function closeMessageModal() {
    document.querySelector('.modal-message-container').remove()
}

function createSingleImageUploadForm() {
    var modal = document.createElement('div')
    modal.id = "imgModal"
    modal.classList.add("modal-overlay")
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close-modal" onclick="closeModal()">&times;</span>
            <div style="width: 100%; text-align: center; font-size: 1.3em; margin-bottom: 10px"><b>Change Profile Picture</b></div>
            <form id="profile-image-form" enctype="multipart/form-data" action="/changeprofileimage" method="POST">
                <div class="file-upload">
                    <label for="entity-image" class="file-upload-label">
                        <img src="/static/assets/icons/place_item.svg">
                        <span class="choose-file"><b>Choose a file</b> or drag it here</span>
                        <input id="entity-image" name="image" type="file" accept="image/*" required>
                        <div class="image-input-message" style="font-size: 0.8em;"></div>
                    </label>
                </div>
                <button style="margin-top: 10px" type="submit" class="submit-button">Submit</button>
            </form>
        </div>
    `
    document.body.appendChild(modal)

    callDragAndDrop(modal, 1)
}

/* Drag and Drop functions */
function callDragAndDrop(section, max = 10) {
    const fileInput = section.querySelector("#entity-image");
    const fileUpload = section.querySelector(".file-upload");

    if (fileInput && fileUpload) {
        fileUpload.addEventListener("dragover", function (e) {
            e.preventDefault();
            this.classList.add("dragover");
        });

        fileUpload.addEventListener("dragleave", function () {
            this.classList.remove("dragover");
        });

        fileUpload.addEventListener("drop", function (e) {
            e.preventDefault();
            this.classList.remove("dragover");
            const files = e.dataTransfer.files;
            handleFiles(files);
        });

        fileInput.addEventListener("change", function () {
            const files = this.files
            handleFiles(files);
        });

        function handleFiles(files) {
            // Check if the number of files exceeds 5
            if (files.length > max) {
                create_alert_message("Attention", "Please select up to 5 files.");
                fileInput.value = ''; // Reset file input
                return;
            }

            let totalSize = 0;
            // Calculate total size of selected files
            for (const file of files) {
                totalSize += file.size;
            }

            // Check if total size exceeds 10MB
            const totalSizeInMB = totalSize / (1024 * 1024); // Convert bytes to MB
            if (totalSizeInMB > 10) {
                create_alert_message("Attention", "Total size of files cannot exceed 10MB.");
                fileInput.value = ''; // Reset file input
                return;
            }

            // Check if all files are images
            for (const file of files) {
                if (!file.type.startsWith("image/")) {
                    fileInput.value = ''; // Reset file input
                    create_alert_message("Attention", "Please select only image files.");
                    return;
                }
            }

            // All checks passed, handle files here
            for (const file of files) {
                console.log("File selected:", file.name);

                section.querySelector(".image-input-message").innerHTML = `${files.length} loaded - ${totalSizeInMB.toPrecision(2)}MB`
                // Handle each file here
            }
        }
    }
}


function openGoogleMaps(lat, lng) {

    console.log(lat, lng);

    // Construct the URL with the destination latitude and longitude
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

    // create action to pass to prompt
    window.open(url, '_blank');


    //create_prompt_message("Opening Google Maps", "This action will take you to google maps, are you sure you want to confirm?", "")


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

// Function to show the loading animation
function showLoadingAnimation() {
    const loadingAnimation = document.querySelector('.loading-animation');
    if (loadingAnimation) {
        loadingAnimation.style.display = 'block';
    }
}


// Function to find review text by submitted user ID
function findReviewTextByUserId(data, userId) {
    // Filter data where submitted_by matches userId



    // check if it's array
    if (!Array.isArray(data)) return null

    const userReview = data.filter(item => item.submitted_by == userId);

    // Map the filtered data to extract review text
    if (userReview) {
        const reviewText = userReview.map(item => item.review_text);
        return reviewText;
    } else {
        return null
    }
}

function convertNullToEmptyString(value) {
    if (value === null) return ""
    else return value
}