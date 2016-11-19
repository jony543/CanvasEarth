/**
 * Created by Jonathan on 11/18/2016.
 */
// var pepper = "images/pepper.png";
var usersLocationIcon = "images/usersLocationIcon.png";

// marker data: lat , lng, artist, background
var markerData = [
    {
        title:'blue bus',
        position: {lat: 32.480551, lng: 34.968628}
    },
    {
        title: 'yosko',
        position: {lat: 32.574282, lng: 34.954885}
    },
    {
        title: 'badra',
        position: {lat: 31.898035, lng: 34.810469}
    },
    {
        title: 'abu hassan',
        position: {lat: 32.050319, lng: 34.750913}
    },
    {
        title: 'bahadonas',
        position: {lat: 32.174515, lng: 34.891622}
    }
];


var map;
var markersArray = [];

initMap = function() {
    map = new google.maps.Map(document.getElementById('map') , {
        center : {lat: 32.0853, lng: 34.7818},
        zoom: 8
    });

    markerData.forEach(function(currentMarkerData){
        var title = currentMarkerData.title;
        var lat = currentMarkerData.position.lat;
        var lng = currentMarkerData.position.lng;

        var marker = new Marker(map, title, lat, lng );

        markersArray.push(marker);
    })

    infoWindow = new google.maps.InfoWindow({
        content: ''
    });
}

var Marker = function(map, title, lat, lng) {
    var googleMarker;

    this.lat = lat;
    this.lng = lng;
    this.title = title;

    googleMarker = new google.maps.Marker({
        position: new google.maps.LatLng(lat, lng),
        // animation: google.maps.Animation.DROP,
        // icon: pepper,
        title: title
    });


    // this.clicked = function(){
    //
    // }
    //
    // var self = this;
    // googleMarker.addListener('click', function(){
    //     self.clicked();
    // });

    googleMarker.setMap(map);
    this.googleMarker = googleMarker;
}

function centerMapToCurrentLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            var pos = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };

            infoWindow.setPosition(pos);
            infoWindow.setContent('Location found.');
            map.setCenter(pos);
        }, function() {
            handleLocationError(true, infoWindow, map.getCenter());
        });
    } else {
        // Browser doesn't support Geolocation
        handleLocationError(false, infoWindow, map.getCenter());
    }
}

centerMapToCurrentLocation();