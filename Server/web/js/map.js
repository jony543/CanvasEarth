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
}


//gets artData from server and inits markers on map
var updateMarkers = function() { //TODO understand when to call again to refresh markers
    console.log("updating markers");
    $.ajax (
        {
            url: "/api/art",
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

        var marker = new Marker(map, title, lat, lng, canvasFile, currentArtData.entity_project );

        markersArray.push(marker);
    })
}

function getMobileOperatingSystem() {
    var userAgent = navigator.userAgent || navigator.vendor || window.opera;

    // Windows Phone must come first because its UA also contains "Android"
    if (/windows phone/i.test(userAgent)) {
        return "Windows Phone";
    }

    if (/android/i.test(userAgent)) {
        return "Android";
    }

    // iOS detection from: http://stackoverflow.com/a/9039885/177710
    if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
        return "iOS";
    }

    return "unknown";
}




var Marker = function(map, title, lat, lng, canvasFile, entiti_project) {
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
    var style = ".title {text-align: center; font-family: 'Raleway',sans-serif; " +
        "font-size: 15px; font-weight: 800;} " +
        "#canvasImg {max-width: 150px; height: auto}" +
        ".canvas-btn {text-align: center; font-family: 'Raleway',sans-serif; " +
        "font-size: 10px; font-weight: 600;} " +
        ".centerize {display: block; margin: 0 auto; text-align: center; padding-top: 5px}"
        ;
    this.infoWindowContent = document.createElement("div"); //TODO to stylize the infoWindow: change this DIV
    this.infoWindowContent.innerHTML = "<style>" + style + "</style>"+
        '<div class=title>' + this.title  +
        "<br>" +
        "<div class='centersize'>" +
        '<img id=\'canvasImg\' src=\'' + imgRequestPrefix + this.canvasFile + '\'>' +
        "</div>"+
        '</div>';

    this.buttonDiv = document.createElement("div");
    this.buttonDiv.setAttribute("style", "padding-top: 5px; display: block; margin: 0 auto; text-align: center; padding-top: 5px");
    this.linkToEntityButton = document.createElement("button");
    this.linkToEntityButton.setAttribute("class", "btn grey darken-2 canvas-btn");
    this.linkToEntityButton.innerHTML = "Show Me";
    this.linkToEntityButton.onclick = function() {
        // azaria - entity link here;
        var link = "http://www.google.com";
        // if (entiti_project) {
            if (getMobileOperatingSystem() == "iOS") {
                link = 'entiti://?id=' + entiti_project;
            } else {
                link = 'https://entiti.wakingapp.com/?id=' + entiti_project;
            }
        // }
        window.open(link);
    };
    this.buttonDiv.appendChild(this.linkToEntityButton);
    this.infoWindowContent.appendChild(this.buttonDiv);


    this.clicked = function(){

        infoWindow.setContent(
            this.infoWindowContent
        );

        infoWindow.open(map, googleMarker);

    }

    var self = this;
    googleMarker.addListener('click', function(){ //TODO clicked means the google marker is clicked
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
    var iconBase = 'https://maps.google.com/mapfiles/kml/shapes/';
    userMarker  = new google.maps.Marker({ //TODO this is a googleMarker. should it be our marker?
        position: new google.maps.LatLng(20, 20),
        title: "Your Location",
        icon: iconBase + 'flag_maps.png'
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
}


$("#usersLocationButton").click(function(e){
    centerMapToCurrentLocation();
});


function getUserLocation(){
    var userLocation = {lat: userMarker.position.lat(), lng: userMarker.position.lng()};
    // console.log(userLocation);
    return userLocation;
}