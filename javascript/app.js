/** reittiä varten
 * https://maps.googleapis.com/maps/api/directions/json?key=AIzaSyDUTG34LGXSXBAY-trPXT6z3F_g1h05iYk&origin=60.2182261,24.81152&destination=60.1711124,24.9417507&mode=walking
 */
(function () {
    'use strict';

    var database = {
        start: {},
        end: {}
    };

    function updateStartLocation(position) {
        console.log(position.coords);

        var apiRequest = 'https://nodejs-jussilat.rhcloud.com/updateLocation?name=kayttaja&lat=' + position.coords.latitude + '&lng=' + position.coords.longitude;
        var httpRequest = new XMLHttpRequest();
        // when the request is loaded
        httpRequest.onload = function () {
            // we're calling our method
            var response = httpRequest.response;
        };
        httpRequest.open('GET', apiRequest);
        httpRequest.send();
    }

    // gets starting location coordinates
    function getStartLocation() {
        var x = document.getElementById("demo");
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(updateStartLocation);
        } else {
            x.innerHTML = "Geolocation is not supported by this browser.";
        }
        //http: //nodejs-jussilat.rhcloud.com/updateLocation?name=kayttaja&lat=61&lng=25 https://maps.googleapis.com/maps/api/geocode/json?key=AIzaSyDUTG34LGXSXBAY-trPXT6z3F_g1h05iYk&address=helsinki

    }

    // gets location coordinates by httpRequest from google geoCode API
    function getEndLocation(callback) {
        
        var apiRequest = 'https://nodejs-jussilat.rhcloud.com/getLocations';
        var httpRequest = new XMLHttpRequest();
        // when the request is loaded
        httpRequest.onload = function () {
            // we're calling our method
            var response = JSON.parse(httpRequest.response);
            database.end = response;
            callback();
        };
        httpRequest.open('GET', apiRequest);
        httpRequest.send();
    }

    /**
     * When the request is ready,
     * this will handle the data and show in what direction is the end point
     */
    function getDirection() {
        var endCoordinates = database.end;
        var startCoordinates = database.start;

        var latDifference = endCoordinates.lat - startCoordinates.lat;
        var lngDifference = endCoordinates.lng - startCoordinates.lng;

        var division = latDifference / lngDifference;
        var rad2deg = 180 / Math.PI;
        var degrees = Math.atan(division) * rad2deg;

        if (endCoordinates.lng < startCoordinates.lng) {
            degrees = degrees + 180;
        }

        // invert the degrees, so positive degrees grow counter clockwise
        degrees = degrees - degrees * 2;

        showCompass(degrees);
    }

    // shows results in html
    function showCompass(degrees) {
        // console.log(degrees);
        $('#arrow').rotate(degrees);
    }

    function initButtons() {
        $('.hidden').removeClass('hidden');
        $('#sello').on('click', function () {
            console.log(database.end);
            getStartLocation();
            getDirection();
        });
        $('#shanghai').on('click', function () {
            getStartLocation();
            getDirection();
        });
    }

    function calculateDistance() {

        var lat1 = 60.2182348;
        var lon1 = 24.8107336;

        var lat2 = 60.2176518;
        var lon2 = 24.8106959;

        // Converts numeric degrees to radians
        if (typeof (Number.prototype.toRad) === "undefined") {
            Number.prototype.toRad = function () {
                return this * Math.PI / 180;
            };
        }

        // The haversine formula calculates the distance between two coordinates 
        var R = 6371000; // km 
        // has a problem with the .toRad() method below.
        var x1 = lat2 - lat1;
        var dLat = x1.toRad();
        var x2 = lon2 - lon1;
        var dLon = x2.toRad();
        var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1.toRad()) * Math.cos(lat2.toRad()) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        var d = R * c;

        console.log(d + 'm');
    }
    calculateDistance();

    getEndLocation(initButtons);
})();