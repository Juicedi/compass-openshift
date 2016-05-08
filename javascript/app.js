/*jslint browser: true*/
/*global $, jQuery, alert, console*/

(function () {
    'use strict';

    /* GLOBAL VARIABLES */
    var username = 'kayttaja',
        destination = '',
        calibrationPoints = {},
        travelDistance = 0;

    function rotateArrow(degrees) {
        $('#arrow').rotate(degrees);
    }

    function rotateCompass(degrees) {
        $('#compass').rotate(degrees);
    }

    function showDistance(distance) {
        if (distance < 1) {
            distance = distance * 1000;
            $('#distance').html((Math.round(distance * 100) / 100) + 'm');
        } else {
            $('#distance').html((Math.round(distance * 100) / 100) + 'km');
        }
        travelDistance = (Math.round(distance * 100) / 100);
    }

    /**
     *========================================================================================
     * Controllers
     *========================================================================================
     */

    // The haversine formula calculates the distance between two coordinates 
    function calculateDistance(start, end) {
        // Converts numeric degrees to radians
        if (typeof (Number.prototype.toRad) === "undefined") {
            Number.prototype.toRad = function () {
                return this * Math.PI / 180;
            };
        }

        var lat1 = parseFloat(start.lat),
            lng1 = parseFloat(start.lng),
            lat2 = parseFloat(end.lat),
            lng2 = parseFloat(end.lng),

            // R is in km 
            R = 6371,
            x1 = lat2 - lat1,
            dLat = x1.toRad(),
            x2 = lng2 - lng1,
            dLon = x2.toRad(),
            a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1.toRad()) * Math.cos(lat2.toRad()) * Math.sin(dLon / 2) * Math.sin(dLon / 2),
            c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)),
            distance = R * c;
        return distance;
    }

    // Calculates direction using two coordinates
    function calculateDirection(start, end) {
        var latDifference = parseFloat(end.lat) - parseFloat(start.lat),
            lngDifference = parseFloat(end.lng) - parseFloat(start.lng),
            division = latDifference / lngDifference,
            rad2deg = 180 / Math.PI,
            degrees = Math.atan(division) * rad2deg,
            distance = calculateDistance(start, end);

        if (parseFloat(end.lng) < parseFloat(start.lng)) {
            degrees = degrees + 180;
        }

        /**
         * Invert the degrees, so positive degrees grow counter clockwise
         * It is this way because I thought the algorithm like that, and how the compass should rotate
         */
        degrees = degrees - (degrees * 2);

        showDistance(distance);
        return degrees;
    }

    // Orientate compass depending on the users movements
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

    /**
     *========================================================================================
     * Models
     *========================================================================================
     */

    // Updates database starting point coordinates
    function updateStartLocation(position) {
        $('#startingpoint').html(position.coords.latitude + ' ' + position.coords.longitude);
        if (position.coords.heading !== null) {
            $('#compass').rotate(position.coords.heading);
        }
        var apiRequest = 'https://nodejs-jussilat.rhcloud.com/updateLocation?name=' + username + '&lat=' + position.coords.latitude + '&lng=' + position.coords.longitude,
            httpRequest = new XMLHttpRequest();
        httpRequest.open('GET', apiRequest);
        httpRequest.send();
    }

    // Gets starting location coordinates from the browser.
    // Location is later send to database for possible new features.(two people tracking each others locations)
    function setStartLocation(callbackFunction) {
        var x = document.getElementById("body");
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(callbackFunction, function () {
                console.log('error');
            }, {
                enableHighAccuracy: true,
                timeout: 20000,
                maximumAge: 1000
            });
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
            startPoint = JSON.parse(startPoint)[0];
            endPoint = JSON.parse(endPoint)[0];
            degrees = calculateDirection(startPoint, endPoint);
            rotateArrow(degrees);
        };
        httpRequest.open('GET', apiRequest);
        httpRequest.send();
    }

    // Get starting-point/origin from database
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

    // Sets destination coordinates to database in separate request, because otherwise it response would be null
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
    // Used to determine in what direction the user's destination is.
    function getEndLocation() {
        var apiRequest = 'https://maps.googleapis.com/maps/api/geocode/json?key=AIzaSyDUTG34LGXSXBAY-trPXT6z3F_g1h05iYk&address=' + encodeURIComponent(destination),
            httpRequest = new XMLHttpRequest();
        httpRequest.onload = function () {
            var response = JSON.parse(httpRequest.response);
            setEndLocationToDb(response.results[0]);
        };
        httpRequest.open('GET', apiRequest);
        httpRequest.send();
    }

    /*
     // Users Starting coordinates used in calibration,
     // when comparing starting point and calibration point which is 10s away from starting point
    function getStartingCoordinates(callback) {
      var startingCoordinates = {},
        apiRequest = 'https://nodejs-jussilat.rhcloud.com/getUserLocation',
        httpRequest = new XMLHttpRequest();
      httpRequest.onload = function () {
        startingCoordinates = httpRequest.response;
        calibrationPoints.firstPoint = JSON.parse(startingCoordinates)[0];
        console.log('done 2');
        callback();
      };
      httpRequest.open('GET', apiRequest);
      httpRequest.send();
    }
    // Sets user's newer coordinates into the database. Used in calibration.
    function calibrateLocation(position, callback) {
      var lati = parseFloat(position.coords.latitude),
        apiRequest = 'https://nodejs-jussilat.rhcloud.com/updateLocation?name=' + username + '1' + '&lat=' + lati + '&lng=' + position.coords.longitude,
        httpRequest = new XMLHttpRequest();
      httpRequest.onload = function () {
        console.log('done 1');
        callback();
      };
      httpRequest.open('GET', apiRequest);
      httpRequest.send();
    }
     // Newest location is used to calibrate the compass so the north arrow will be pointing north.
     // Newest location will be compared with original starting point to determine users direction
    function getNewestLocation(callback) {
      var apiRequest = 'https://nodejs-jussilat.rhcloud.com/getCalibrationLocation',
        httpRequest = new XMLHttpRequest();
      httpRequest.onload = function () {
        var secondPoint = httpRequest.response;
        calibrationPoints.secondPoint = JSON.parse(secondPoint)[0];
        $('#endpoint').html(calibrationPoints.secondPoint.lat + ' ' + calibrationPoints.secondPoint.lng);
        console.log('done 3');
        callback();
      };
      httpRequest.open('GET', apiRequest);
      httpRequest.send();
    }
    // calibration 
    function calibrate() {
      var degrees;
      console.log('starting');
      setTimeout(function () {
        setStartLocation(function (position) {
          calibrateLocation(position, function () {
            getStartingCoordinates(function () {
              getNewestLocation(function () {
                console.log(calibrationPoints.firstPoint, calibrationPoints.secondPoint);
                degrees = calculateDirection(calibrationPoints.firstPoint, calibrationPoints.secondPoint);
                degrees = degrees + 90;
                degrees = degrees - degrees * 2;
                $('#degree').html(degrees);
                rotateCompass(degrees);
                //init();
              });
            });
          });
        });
      }, 150);
    }
    */

    /**
     * Initializes buttons that allows user to search different locations 
     * and calibrate the compass to point north.
     */
    function initButtons() {
        $('#search').on('click', function () {
            $('.hidden').removeClass('hidden');
            destination = $('#destination').val();
            getEndLocation();
            setInterval(function () {
                setStartLocation(updateStartLocation);
                getCoordinates();
                if (travelDistance < 0.1) {
                    clearInterval();
                    $('#destinationReached').show();
                }
            }, 10000);
        });
        $('#calibrateCompass').on('click', function () {
            //calibrate();
        });
    }

    initButtons();
    setStartLocation(updateStartLocation);
}());