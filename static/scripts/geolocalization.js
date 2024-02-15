
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
    const url = new URL('/findlocationsfromcoord', window.location.origin);
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
