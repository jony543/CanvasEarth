var views = ["createView", "mapView", "arView"];

var currentView = views[1];

// Note that "orientationchange" and screen.orientation are unprefixed in the following
// code although this API is still vendor-prefixed browsers implementing it.
window.addEventListener("orientationchange", function() {
    location.reload();
});

function updateView() {
    views.forEach(function(viewName){
        if (viewName == currentView){
            document.getElementById(viewName).classList.toggle("hidden", false);
            document.getElementById(viewName + 'Button').classList.toggle("mySelectedButton", true);
        } else {
            document.getElementById(viewName).classList.toggle("hidden",true);
            document.getElementById(viewName + 'Button').classList.toggle("mySelectedButton", false);
        }
    });
}

function changeView(viewName) {
    currentView = viewName;
    updateView();
}

updateView();

$("#createViewButton").click(function(e){
    currentView = views[0];
    updateView();
});

$("#mapViewButton").click(function(e){
    currentView = views[1];
    updateMarkers();
    updateView();
});

$("#arViewButton").click(function(e){
    currentView = views[2];
    updateView();
});