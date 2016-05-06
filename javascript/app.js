/*jslint browser: true*/
/*global $, jQuery, alert, console*/
/* reittiä varten
 * https://maps.googleapis.com/maps/api/directions/json?key=AIzaSyDUTG34LGXSXBAY-trPXT6z3F_g1h05iYk&origin=60.2182261,24.81152&destination=60.1711124,24.9417507&mode=walking
 * http://nodejs-jussilat.rhcloud.com/updateLocation?name=kayttaja&lat=61&lng=25 
 * https://maps.googleapis.com/maps/api/geocode/json?key=AIzaSyDUTG34LGXSXBAY-trPXT6z3F_g1h05iYk&address=helsinki
 */
(function () {
    'use strict';

    var username = 'kayttaja',
        destination = '',
        rota = 0;

    function showCompass(degrees) {
        $('#arrow').rotate(degrees);
    }

    function showDistance(distance) {
        if (distance < 1) {
            distance = distance * 1000;
            $('#distance').html((Math.round(distance * 100) / 100) + 'm');
        } else {
            $('#distance').html((Math.round(distance * 100) / 100) + 'km');
        }
    }

    //========================================================================================
    // Controllers
    //========================================================================================

    // The haversine formula calculates the distance between two coordinates 
    function calculateDistance(start, end) {
        // Converts numeric degrees to radians
        if (typeof (Number.prototype.toRad) === "undefined") {
            Number.prototype.toRad = function () {
                return this * Math.PI / 180;
            };
        }

        var lat1 = parseFloat(start.lat),
            lon1 = parseFloat(start.lng),
            lat2 = parseFloat(end.lat),
            lon2 = parseFloat(end.lng),

            R = 6371, // km 
            x1 = lat2 - lat1,
            dLat = x1.toRad(),
            x2 = lon2 - lon1,
            dLon = x2.toRad(),
            a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1.toRad()) * Math.cos(lat2.toRad()) * Math.sin(dLon / 2) * Math.sin(dLon / 2),
            c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)),
            d = R * c;

        return d;
    }

    //When the request is ready,
    //this will handle the data and show in what direction is the end point
    function calculateDirection(start, end) {
        start = JSON.parse(start)[0];
        end = JSON.parse(end)[0];
        console.log(start, end);
        var latDifference = end.lat - start.lat,
            lngDifference = end.lng - start.lng,
            division = latDifference / lngDifference,
            rad2deg = 180 / Math.PI,
            degrees = Math.atan(division) * rad2deg,
            distance = calculateDistance(start, end);

        if (parseFloat(end.lng) < parseFloat(start.lng)) {
            degrees = degrees + 180;
        }

        // invert the degrees, so positive degrees grow counter clockwise
        degrees = degrees - (degrees * 2);
        showDistance(distance);
        return degrees;
    }

    // orientate compass depending on the users movements
    function init() {
        var compass = document.getElementById('compass');
        if (window.DeviceOrientationEvent) {

            window.addEventListener('deviceorientation', function (event) {
                var alpha,
                    webkitAlpha = event.alpha;
                //Check for iOS property
                if (event.webkitCompassHeading) {
                    alpha = event.webkitCompassHeading;
                    //Rotation is reversed for iOS
                    $('#compass').rotate(alpha);
                } else {
                    //non iOS
                    if (!window.chrome) {
                        //Assume Android stock (this is crude, but good enough for our example) and apply offset
                        webkitAlpha = alpha - 270;
                    }
                }

                compass.style.Transform = 'rotate(' + alpha + 'deg)';
                compass.style.WebkitTransform = 'rotate(' + webkitAlpha + 'deg)';
                //Rotation is reversed for FF
                compass.style.MozTransform = 'rotate(-' + alpha + 'deg)';
            }, false);
        }
    }
    init();


    //========================================================================================
    // Models
    //========================================================================================

    // Updates database starting point coordinates
    function calibrateLocation(position) {
        if (position.coords.heading !== null) {
            $('#compass').rotate(position.coords.heading);
        }
        var apiRequest = 'https://nodejs-jussilat.rhcloud.com/updateLocation?name=' + username + '&lat=' + position.coords.latitude + '&lng=' + position.coords.longitude,
            httpRequest = new XMLHttpRequest();
        httpRequest.onload = function () {};
        httpRequest.open('GET', apiRequest);
        httpRequest.send();
    }

    // Updates database starting point coordinates
    function updateStartLocation(position) {
        if (position.coords.heading !== null) {
            $('#compass').rotate(position.coords.heading);
        }
        console.log(position);
        var apiRequest = 'https://nodejs-jussilat.rhcloud.com/updateLocation?name=' + username + '&lat=' + position.coords.latitude + '&lng=' + position.coords.longitude,
            httpRequest = new XMLHttpRequest();
        httpRequest.open('GET', apiRequest);
        httpRequest.send();
    }

    // Gets starting location coordinates
    function setStartLocation(callbackFunction) {
        console.log(callbackFunction);
        var x = document.getElementById("body");
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(callbackFunction);
        } else {
            x.innerHTML = "Geolocation is not supported by this browser.";
        }
    }

    // Requests ending point from database and tries to get direction from starting point to ending point
    function getDbEndPoint(startPoint) {
        var apiRequest = 'https://nodejs-jussilat.rhcloud.com/getEndLocation',
            httpRequest = new XMLHttpRequest();
        httpRequest.onload = function () {
            var endPoint = httpRequest.response,
                degrees;
            degrees = calculateDirection(startPoint, endPoint);
            showCompass(degrees);
        };
        httpRequest.open('GET', apiRequest);
        httpRequest.send();
    }

    // Requests starting point from database
    function getCoordinates() {
        var startingCoordinates = {},
            apiRequest = 'https://nodejs-jussilat.rhcloud.com/getUserLocation',
            httpRequest = new XMLHttpRequest();
        httpRequest.onload = function () {
            startingCoordinates = httpRequest.response;
            getDbEndPoint(startingCoordinates);
        };
        httpRequest.open('GET', apiRequest);
        httpRequest.send();
    }

    // Sets end location to database in separate request, because otherwise it response would be null
    function setEndLocationToDb(response) {
        var locationName = response.address_components[0].long_name,
            apiRequest = 'https://nodejs-jussilat.rhcloud.com/setEndLocation?name=end&lat=' + response.geometry.location.lat + '&lng=' + response.geometry.location.lng,
            httpRequest = new XMLHttpRequest();
        response = response.geometry.location;
        httpRequest.onload = function () {
            $('#message').html('Your destination is ' + locationName);
            getCoordinates();
        };
        httpRequest.open('GET', apiRequest);
        httpRequest.send();
    }

    // Gets location coordinates by httpRequest from google geoCode API
    function getEndLocation() {
        var apiRequest = 'https://maps.googleapis.com/maps/api/geocode/json?key=AIzaSyDUTG34LGXSXBAY-trPXT6z3F_g1h05iYk&address=' + destination,
            httpRequest = new XMLHttpRequest();
        httpRequest.onload = function () {
            var response = JSON.parse(httpRequest.response);
            setEndLocationToDb(response.results[0]);
        };
        httpRequest.open('GET', apiRequest);
        httpRequest.send();
    }

    // Users Starting coordinates used in calibration,
    // when comparing starting point and calibration point which is 10s away from starting point
    function getStartingCoordinates() {
        var startingCoordinates = {},
            apiRequest = 'https://nodejs-jussilat.rhcloud.com/getUserLocation',
            httpRequest = new XMLHttpRequest();
        httpRequest.onload = function () {
            startingCoordinates = httpRequest.response;
            return startingCoordinates;
        };
        httpRequest.open('GET', apiRequest);
        httpRequest.send();
    }
    
    setInterval(function () {
        var apiRequest = 'https://nodejs-jussilat.rhcloud.com/getCalibrationLocation',
            httpRequest = new XMLHttpRequest();
        httpRequest.onload = function () {
            var firstPoint = getStartingCoordinates(),
                secondPoint = httpRequest.response,
                degrees = calculateDirection(firstPoint, secondPoint);
        };
        httpRequest.open('GET', apiRequest);
        httpRequest.send();
    }, 1000);

    // Initializes buttons
    function initButtons() {
        $('#search').on('click', function () {
            $('.hidden').removeClass('hidden');
            destination = $('#destination').val();
            getEndLocation();
        });
        $('#rotate').on('click', function () {
            rota += 5;
            $('#compass').rotate(rota);
        });
    }

    initButtons();
    setStartLocation(updateStartLocation);
}());