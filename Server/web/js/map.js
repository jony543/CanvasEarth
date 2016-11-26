/**
 * Created by Jonathan on 11/18/2016.
 */
// var pepper = "images/pepper.png";
var usersLocationIcon = "images/usersLocationIcon.png";

var imgRequestPrefix = "http://dfcysvy1a0vsz.cloudfront.net/images/canvas/"; //  + canvas_file_name.jpeg



var map;

initMap = function() {
    map = new google.maps.Map(document.getElementById('map') , {
        center : {lat: 32.0853, lng: 34.7818},
        zoom: 8,
        styles: [{"featureType":"all","elementType":"all","stylers":[{"hue":"#ff0000"},{"saturation":-100},{"lightness":-30}]},{"featureType":"all","elementType":"labels.text.fill","stylers":[{"color":"#ffffff"}]},{"featureType":"all","elementType":"labels.text.stroke","stylers":[{"color":"#353535"}]},{"featureType":"landscape","elementType":"geometry","stylers":[{"color":"#656565"}]},{"featureType":"poi","elementType":"geometry.fill","stylers":[{"color":"#505050"}]},{"featureType":"poi","elementType":"geometry.stroke","stylers":[{"color":"#808080"}]},{"featureType":"road","elementType":"geometry","stylers":[{"color":"#454545"}]}]
    });

    infoWindow = new google.maps.InfoWindow({
        content: ''
    });

}





var artData;

// gets artData from server and inits markers on map
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



var markersArray;

// creates Marker objects from artData and sets on map.
var initMarkers = function(artData) {
    markersArray = [];

    artData.forEach(function(currentArtData){
        var title = currentArtData.title;
        var lat = currentArtData.lat;
        var lng = currentArtData.lng;
        var canvas_file_name = currentArtData.canvas_file;

        var marker = new Marker(map, title, lat, lng, canvas_file_name );

        markersArray.push(marker);
    })
}


updateMarkers();


var Marker = function(map, title, lat, lng, canvas_file_name) {
    var googleMarker;

    this.lat = lat;
    this.lng = lng;
    this.title = title;
    this.canvas_file_name = canvas_file_name;

    googleMarker = new google.maps.Marker({
        position: new google.maps.LatLng(lat, lng),
        // animation: google.maps.Animation.DROP,
        // icon: pepper,
        title: title
    });


    this.clicked = function(){
        infoWindow.setContent(
            this.title +
                "<br>" +
            '<img id=\'canvasImg\' src=\'' + imgRequestPrefix + this.canvas_file_name + '\'>'
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


// delete infoWindow part. add center map to init map part. and add center button
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

$("#usersLocationButton").click(function(e){
    centerMapToCurrentLocation();
});