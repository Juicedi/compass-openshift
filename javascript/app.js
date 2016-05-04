/* reittiä varten
 * https://maps.googleapis.com/maps/api/directions/json?key=AIzaSyDUTG34LGXSXBAY-trPXT6z3F_g1h05iYk&origin=60.2182261,24.81152&destination=60.1711124,24.9417507&mode=walking
 * http: //nodejs-jussilat.rhcloud.com/updateLocation?name=kayttaja&lat=61&lng=25 
 * https://maps.googleapis.com/maps/api/geocode/json?key=AIzaSyDUTG34LGXSXBAY-trPXT6z3F_g1h05iYk&address=helsinki
 */
(function () {
    'use strict';

    var username = 'kayttaja';
    var geolocation = '';

    /*setInterval(function () {
        var apiRequest = 'https://nodejs-jussilat.rhcloud.com/calibrateLocation?name=' + username + '&lat=' + position.coords.latitude + '&lng=' + position.coords.longitude;
        var httpRequest = new XMLHttpRequest();
        httpRequest.onload = function () {
        var firstPoint = getStartingCoordinates();
        var secondPoint = httpRequest.response;
        };
        httpRequest.open('GET', apiRequest);
        httpRequest.send();
    }, 1000);
    */

    //========================================================================================
    // Models
    //========================================================================================

    // Updates database starting point coordinates
    function updateStartLocation(position) {
        if (position.coords.heading !== null) {
            $('#compass').rotate(position.coords.heading);
        }
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
    }

    // Sets end location to database in separate request, because otherwise it response would be null
    function setEndLocationToDb(response) {
        var locationName = response.address_components[0].long_name;
        response = response.geometry.location;
        var apiRequest = 'https://nodejs-jussilat.rhcloud.com/setEndLocation?name=end&lat=' + response.lat + '&lng=' + response.lng;
        var httpRequest = new XMLHttpRequest();
        httpRequest.onload = function () {
            $('#message').html('Your destination is ' + locationName);
            getCoordinates();
        };
        httpRequest.open('GET', apiRequest);
        httpRequest.send();
    }

    // Gets location coordinates by httpRequest from google geoCode API
    function getEndLocation() {
        var apiRequest = 'https://maps.googleapis.com/maps/api/geocode/json?key=AIzaSyDUTG34LGXSXBAY-trPXT6z3F_g1h05iYk&address=' + geolocation;
        var httpRequest = new XMLHttpRequest();
        httpRequest.onload = function () {
            var response = JSON.parse(httpRequest.response);
            setEndLocationToDb(response.results[0]);
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
    
    function getStartingCoordinates() {
        var startingCoordinates = {};
        var apiRequest = 'https://nodejs-jussilat.rhcloud.com/getUserLocation';
        var httpRequest = new XMLHttpRequest();
        httpRequest.onload = function () {
            startingCoordinates = httpRequest.response;
            return startingCoordinates;
        };
        httpRequest.open('GET', apiRequest);
        httpRequest.send();
    }

    //========================================================================================
    // Controllers
    //========================================================================================

    //When the request is ready,
    //this will handle the data and show in what direction is the end point
    function calculateDirection(start, end) {
        start = JSON.parse(start)[0];
        end = JSON.parse(end)[0];
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
    }

    // orientate compass depending on the users movements
    /*
    function init() {
        var compass = document.getElementById('compass');
        if (window.DeviceOrientationEvent) {

            window.addEventListener('deviceorientation', function (event) {
                var alpha;
                //Check for iOS property
                if (event.webkitCompassHeading) {
                    alpha = event.webkitCompassHeading;
                    //Rotation is reversed for iOS
                    $('#compass').rotate(alpha);
                }
                //non iOS
                else {
                    alpha = event.alpha;
                    var webkitAlpha = alpha;
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
    */

    //========================================================================================
    // Views
    //========================================================================================

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
    var rota = 0;

    function initButtons() {
        $('#search').on('click', function () {
            $('.hidden').removeClass('hidden');
            geolocation = $('#destination').val();
            getEndLocation();
        });
        $('#rotate').on('click', function () {
            rota += 5;
            $('#compass').rotate(rota);
        });
    }

    initButtons();
    setStartLocation();
})();