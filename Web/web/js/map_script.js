function initMap() {
        var mapDiv = document.getElementById('map');
        var map = new google.maps.Map(mapDiv, {
            center: {lat: 44.540, lng: -78.546},
            zoom: 8
        });
        var infoWindow = new google.maps.InfoWindow({map: map});
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(function(position) {
            var pos = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };
            map.setCenter(pos);
            infoWindow.setPosition(pos);
            infoWindow.setContent('You Are Here');
          }, function() {
            handleLocationError(true, infoWindow, map.getCenter());
          });
        } else {
          // Browser doesn't support Geolocation
          handleLocationError(false, infoWindow, map.getCenter());
        }

/*** ADDING LOCATIONS TO MAP ***/
        var contentString = ''
        $.getJSON("../resources/locations.json", function(json) {
              json.locations.forEach(function(element){
                var latLng = {lat: element.lat, lng: element.lng};
                contentString = '<div id="content">'+
                    '<div id="content_'+element.id+'">'+
                    '</div>'+
                    '<h3 id="firstHeading'+element.id+'" class="firstHeading">'+element.title+'</h3>'+
                    '<div id="bodyContent'+element.id+'">'+ element.info + '<br>'+
                    '<a href='+element.img_url+' target="_blank">show</a>'+
                    '</div>'+
                    '</div>';
                var infoWindow = new google.maps.InfoWindow({
                  content: contentString
                });
                var marker = new google.maps.Marker({
                  position: latLng,
                  map: map,
                  draggable: true,
                  title: element.title
                });
                marker.addListener('click', function() {
                  infoWindow.open(map, marker);
                });
            })
        });
}