"use strict"

var animated = false

function counter_animation(element) {
    let max = parseInt(element.getAttribute("data_value"));
    let duration = Math.ceil(parseInt(element.getAttribute("duration") * 1000));
    console.log(element,duration);
    let n = 0;
    add_value(n, max, element, duration, 20)
}

function add_value(n, max, element, duration, speed) {
    if (n > max) {
        element.innerText = max;
        return n
    }
    else {
        let sum = (max / duration) * speed
        setTimeout(() => {
            element.innerText = Math.round(n);
            add_value(n + sum, max, element, duration, speed)
        }, speed)
    }
}

// https://codepen.io/jr-cologne/pen/zdYdmx solution found here
// get the element to animate
var numbers_container = document.getElementById('stats-container');
var elementHeight = numbers_container.clientHeight;

// check if element is in view
function inView(offset) {
  // get window height
  var windowHeight = window.innerHeight;
  // get number of pixels that the document is scrolled
  var scrollY = window.scrollY || window.pageYOffset;
  
  // get current scroll position (distance from the top of the page to the bottom of the current viewport)
  var scrollPosition = scrollY + windowHeight;
  // get element position (distance from the top of the page to the bottom of the element)
  var elementPosition = numbers_container.getBoundingClientRect().top + scrollY + elementHeight;
  
  // is scroll position greater than element position? (is element in view?)
  if (scrollPosition > elementPosition - offset) {
    return true;
  }
  
  return false;
}

// animate element when it is in view
function animateNumbers() {
    // is element in view?
    if (inView(300) && !animated) {
        document.removeEventListener('scroll', animateNumbers);

        // element is in view start function
        var numbers = numbers_container.getElementsByClassName("stat-numbers")
        for (let num of numbers) {
            counter_animation(num)
        }
    }
  }

// listen for scroll event and call animate function
if (!inView(300)) {
    document.addEventListener('scroll', animateNumbers);
} else {
    animateNumbers()
}



