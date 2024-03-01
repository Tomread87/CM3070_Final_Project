/**
 * @param {*} title top header of the alert message
 * @param {*} message message to show in the alert message
 */

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

    console.log(myaction);

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
            </div>`
        body.appendChild(modal)
        modal.classList.add('message-modal-anim')

    }
}

function closeMessageModal() {
    document.querySelector('.modal-message-container').remove()
}