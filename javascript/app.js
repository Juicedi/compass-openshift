/** reittiä varten
 * https://maps.googleapis.com/maps/api/directions/json?key=AIzaSyDUTG34LGXSXBAY-trPXT6z3F_g1h05iYk&origin=60.2182261,24.81152&destination=60.1711124,24.9417507&mode=walking
 */
(function () {
    'use strict';

    var username = 'kayttaja';

    setInterval(function () {
        console.log("Hello");
    }, 10000);

    // Updates database starting point coordinates
    function updateStartLocation(position) {
        var apiRequest = 'https://nodejs-jussilat.rhcloud.com/updateLocation?name=' + username + '&lat=' + position.coords.latitude + '&lng=' + position.coords.longitude;
        var httpRequest = new XMLHttpRequest();
        httpRequest.onload = function () {};
        httpRequest.open('GET', apiRequest);
        httpRequest.send();
    }

    // Gets starting location coordinates
    function setStartLocation() {
        var x = document.getElementById("body");
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(updateStartLocation);
        } else {
            x.innerHTML = "Geolocation is not supported by this browser.";
        }
        // http: //nodejs-jussilat.rhcloud.com/updateLocation?name=kayttaja&lat=61&lng=25 https://maps.googleapis.com/maps/api/geocode/json?key=AIzaSyDUTG34LGXSXBAY-trPXT6z3F_g1h05iYk&address=helsinki
    }


    // Sets end location to database in separate request, because otherwise it response would be null
    function setEndLocationToDb(response) {
        var apiRequest = 'https://nodejs-jussilat.rhcloud.com/setEndLocation?name=end&lat=' + response.lat + '&lng=' + response.lng;
        var httpRequest = new XMLHttpRequest();
        httpRequest.onload = function () {};
        httpRequest.open('GET', apiRequest);
        httpRequest.send();
    }

    // Gets location coordinates by httpRequest from google geoCode API
    function getEndLocation(callback) {
        var apiRequest = 'https://maps.googleapis.com/maps/api/geocode/json?key=AIzaSyDUTG34LGXSXBAY-trPXT6z3F_g1h05iYk&address=vihti&region=fi';
        var httpRequest = new XMLHttpRequest();
        httpRequest.onload = function () {
            var response = JSON.parse(httpRequest.response);
            console.log(response);
            setEndLocationToDb(response.results[0].geometry.location);
            callback();
        };
        httpRequest.open('GET', apiRequest);
        httpRequest.send();
    }

    // Requests ending point from database and tries to get direction from starting point to ending point
    function getDbEndPoint(startPoint) {
        var apiRequest = 'https://nodejs-jussilat.rhcloud.com/getEndLocation';
        var httpRequest = new XMLHttpRequest();
        httpRequest.onload = function () {
            var endPoint = httpRequest.response;
            calculateDirection(startPoint, endPoint);
        };
        httpRequest.open('GET', apiRequest);
        httpRequest.send();
    }

    // Requests starting point from database
    function getCoordinates() {
        var startingCoordinates = {};
        var apiRequest = 'https://nodejs-jussilat.rhcloud.com/getUserLocation';
        var httpRequest = new XMLHttpRequest();
        httpRequest.onload = function () {
            startingCoordinates = httpRequest.response;
            getDbEndPoint(startingCoordinates);
        };
        httpRequest.open('GET', apiRequest);
        httpRequest.send();
    }

    /**
     * When the request is ready,
     * this will handle the data and show in what direction is the end point
     */
    function calculateDirection(start, end) {
        start = JSON.parse(start)[0];
        end = JSON.parse(end)[0];
        console.log(start);
        console.log(end);
        var latDifference = end.lat - start.lat;
        var lngDifference = end.lng - start.lng;
        var division = latDifference / lngDifference;
        var rad2deg = 180 / Math.PI;
        var degrees = Math.atan(division) * rad2deg;
        var asdpasd = end.lng - start.lng;
        if (parseFloat(end.lng) < parseFloat(start.lng)) {
            degrees = degrees + 180;
        }
        // invert the degrees, so positive degrees grow counter clockwise
        degrees = degrees - (degrees * 2);
        calculateDistance(start, end);
        showCompass(degrees);
    }

    // Shows results in html
    function showCompass(degrees) {
        $('#arrow').rotate(degrees);
    }
    
    // Shows results in html
    function showDistance(distance) {
        $('#distance').html(distance+'km');
    }

    function initButtons() {
        $('.hidden').removeClass('hidden');
        $('#sello').on('click', function () {
            getCoordinates();
        }); 
        $('#shanghai').on('click', function () {
            getCoordinates();
        });
    }

    function calculateDistance(start, end) {

        var lat1 = parseFloat(start.lat);
        var lon1 = parseFloat(start.lng);
        var lat2 = parseFloat(end.lat);
        var lon2 = parseFloat(end.lng);

        // Converts numeric degrees to radians
        if (typeof (Number.prototype.toRad) === "undefined") {
            Number.prototype.toRad = function () {
                return this * Math.PI / 180;
            };
        }

        // The haversine formula calculates the distance between two coordinates 
        var R = 6371; // km 
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
        showDistance(d);

        console.log(d + 'km');
    }
    setStartLocation();
    getEndLocation(initButtons);
})();