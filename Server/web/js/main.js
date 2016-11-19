var views = ["createView", "mapView", "arView"];
var ar_init = false;

var currentView = views[1];

function updateView() {
    views.forEach(function(viewName){
        if (viewName == currentView){
            document.getElementById(viewName).classList.toggle("hidden", false);
        } else {
            document.getElementById(viewName).classList.toggle("hidden",true);
        }
    });
}

updateView();

$("#createViewButton").click(function(e){
    currentView = views[0];
    updateView();
});

$("#mapViewButton").click(function(e){
    currentView = views[1];
    updateView();
});

$("#arViewButton").click(function(e){
    currentView = views[2];
    updateView();
    if (!ar_init) {
        initAugment();
        ar_init = true;
    }
});