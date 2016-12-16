/**
 * Created by Jonathan on 11/18/2016.
 */
// var pepper = "images/pepper.png";
var usersLocationIcon = "images/usersLocationIcon.png"; //TODO this is the user location icon

var imgRequestPrefix = "http://dfcysvy1a0vsz.cloudfront.net/images/canvas/"; //  + canvasFile.jpeg
// var imgRequestPrefix = "/images/canvasCircle.png";
var map; // holds the google map when initMap is called
var artData; // will hold the JSON from server
var markersArray; // will hold marker objects after initMarkers is called
var infoWindow;
var userMarker; // this also holds the users location.

initMap = function() {

    console.log("google maps call returned");

    map = new google.maps.Map(document.getElementById('map') , {
        center : {lat: 20, lng: 20}, //TODO change to CES location
        zoom: 8,
        zoomControl: false,
        mapTypeControl: false,
        scaleControl: false,
        streetViewControl: false,
        // rotateControl: boolean,
        fullscreenControl: false,
        styles: [{"featureType":"all","elementType":"all","stylers":[{"hue":"#ff0000"},{"saturation":-100},{"lightness":-30}]},{"featureType":"all","elementType":"labels.text.fill","stylers":[{"color":"#ffffff"}]},{"featureType":"all","elementType":"labels.text.stroke","stylers":[{"color":"#353535"}]},{"featureType":"landscape","elementType":"geometry","stylers":[{"color":"#656565"}]},{"featureType":"poi","elementType":"geometry.fill","stylers":[{"color":"#505050"}]},{"featureType":"poi","elementType":"geometry.stroke","stylers":[{"color":"#808080"}]},{"featureType":"road","elementType":"geometry","stylers":[{"color":"#454545"}]}]
    });



    infoWindow = new google.maps.InfoWindow({
        content: ''
    });

    initUserMarker();
    console.log("userMarker location before update: " +  userMarker.getPosition());
    centerMapToCurrentLocation();
    updateMarkers(); // gets artData from server and inits the markers.

    // var artData = [
    //         {
    //             title: "my title",
    //             lat: 32.0853,
    //             lng: 34.7818,
    //              canvasFile : ""  // "C:\\Users\\Jonathan\\Documents\\GitHub\\CanvasEarth\\Server\\web\\images\\canvasCircle.png"
    //         }
    //     ]
    //     ;
    // initMarkers(artData);
}


//gets artData from server and inits markers on map
var updateMarkers = function() {
    $.ajax (
        {
            url: "/art",
            success: function (response){
                console.log("got the Art Data");
                artData = response;
                initMarkers(artData);
            },
            error: function(){
                console.log("error on art request from server");
            }
        }
    )
}

// clears marker array and fills with Marker objects based on artData
var initMarkers = function(artData1) { //TODO refresh somehow every time we load a new map

    markersArray = [];
    artData1.forEach(function(currentArtData){
        var title = currentArtData.title;
        var lat = currentArtData.lat;
        var lng = currentArtData.lng;
        var canvasFile = currentArtData.canvas_file;

        var marker = new Marker(map, title, lat, lng, canvasFile );

        markersArray.push(marker);
    })
}




var Marker = function(map, title, lat, lng, canvasFile) {
    var googleMarker;

    this.lat = lat;
    this.lng = lng;
    this.title = title;
    this.canvasFile = canvasFile;

    googleMarker = new google.maps.Marker({
        position: new google.maps.LatLng(lat, lng),
        // animation: google.maps.Animation.DROP,
        // icon: pepper,//TODO change the image here
        title: title
    });

    // this.infoWindowContent =  document.createElement("div");

    this.infoWindowContent = document.createElement("div");
    this.infoWindowContent.innerHTML = this.title +
        "<br>" +
        '<img id=\'canvasImg\' src=\'' + imgRequestPrefix + this.canvasFile + '\'>';

    this.linkToEntityButton = document.createElement("BUTTON");
    this.linkToEntityButton.clicked = function() {
        // azaria - entity link here;
        window.open("http://www.google.com");
    };

    this.infoWindowContent.appendChild(this.linkToEntityButton);


    this.clicked = function(){
        infoWindow.setContent(
            this.infoWindowContent
        );

        infoWindow.open(map, googleMarker);

    }

    var self = this;
    googleMarker.addListener('click', function(){
        self.clicked();
    });

    googleMarker.setMap(map);
    this.googleMarker = googleMarker;
}


function updateUserLocation() {
    if (navigator.geolocation){
        navigator.geolocation.getCurrentPosition(setUserLocation);
    } else {
        console.log("geolocation is not supported");
    }

}


function initUserMarker() {
    userMarker  = new google.maps.Marker({ //TODO this is a googleMarker. should it be our marker?
        position: new google.maps.LatLng(20, 20),
        title: "user Location"
    });

    userMarker.setMap(map);
}

function setUserLocation(position){
    console.log("***************** position returned from getCurrentPosition: " + position.coords.latitude + position.coords.longitude);

    if ((position.coords.latitude != undefined) && (position.coords.longitude != undefined)){
        // userMarker.position = new google.maps.LatLng(position);
        userMarker.position = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
        map.setCenter(userMarker.position);
    }
    // console.log("userMaker position was updated if not 20,20:" + userMarker.position);
    // console.log("userMarer lat,lng after update is: " +  userMarker.getPosition());
    // console.log("lng is:" + userMarker.position.lng());
}


// after defining - remember to set map to center on this.
function centerMapToCurrentLocation() {
    updateUserLocation();
    console.log("going to setCenter");

    // map.setCenter(userMarker.position);
    console.log("setCenter");
    // console.log("passed map.setCenter test");
}


$("#usersLocationButton").click(function(e){
    centerMapToCurrentLocation();
});


function getUserLocation(){
    var userLocation = {lat: userMarker.position.lat(), lng: userMarker.position.lng()};
    // console.log(userLocation);
    return userLocation;
}