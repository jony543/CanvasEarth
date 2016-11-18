/// <reference types="@argonjs/argon" />
/// <reference types="three" />
/// <reference types="dat-gui" />
/// <reference types="stats" />
// set up Argon
var app = Argon.init();
// app.view.element.style.zIndex = 0;

var camera, scene, renderer, hud;
var root, userLocation;

// need init to run after everything loads
window.addEventListener( 'load', init );

function init() {
    console.log("init start");
    // argon will pass us the camera projection details in each renderEvent callback.  This
    // is necessary to handle different devices, stereo/mono switching, etc.   argon will also
    // tell us the position of the camera to correspond to user movement
    //    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 5000 );
    //		camera.position.z = 1800;
    camera = new THREE.PerspectiveCamera();
    scene = new THREE.Scene();

    // add a new Object3D, root, that serves as the root of the 3D world in local coordinates.
    // Since the camera is moving in AR, and we want to move the content with us, but have it
    // oriented relative to the world, putting it in a sub-graph under the userLocation object
    // let's us move the location of the content with us.  Content should not be added to the
    // scene directly unless it is going to be updated as the user moves through the world
    // (since the world coordinate system is abitrarily chosen to be near the user, and could
    // change at any time)

    root = new THREE.Object3D()
    userLocation = new THREE.Object3D;

    // Add the root node to our eyeOrigin
    userLocation.add(root)

    // put the user and the camera in the world.  This allows us to update the userLocation
    // based on the user's currect location in local coordinates, and to update the camera
    // based on it's location and orientation in local coordinates
    scene.add(userLocation);
    scene.add(camera);

    // Tell argon what local coordinate system you want.  The default coordinate
    // frame used by Argon is Cesium's FIXED frame, which is centered at the center
    // of the earth and oriented with the earth's axes.
    // The FIXED frame is inconvenient for a number of reasons: the numbers used are
    // large and cause issues with rendering, and the orientation of the user's "local
    // view of the world" is different that the FIXED orientation (my perception of "up"
    // does not correspond to one of the FIXED axes).
    // Therefore, Argon uses a local coordinate frame that sits on a plane tangent to
    // the earth near the user's current location.  This frame automatically changes if the
    // user moves more than a few kilometers.
    // The EUS frame cooresponds to the typical 3D computer graphics coordinate frame, so we use
    // that here.  The other option Argon supports is localOriginEastNorthUp, which is
    // more similar to what is used in the geospatial industry
    app.context.setDefaultReferenceFrame(app.context.localOriginEastUpSouth);

    // In a typical threejs example, the camera doesn't move and is controlled by the
    // mouse.  We do not need that here.  Furthermore, our domElement for rendering is
    // coordinated by argon to match the user's prefered rendering setup

    //   renderer = new THREE.CSS3DRenderer();
    //   renderer.setSize( window.innerWidth, window.innerHeight );
    //   renderer.domElement.style.position = 'absolute';
    //   renderer.domElement.style.top = 0;
    //   document.getElementById( 'container' ).appendChild( renderer.domElement );
    //
    //   controls = new THREE.TrackballControls( camera, renderer.domElement );
    //   controls.rotateSpeed = 0.5;
    //   controls.addEventListener( 'change', render );

    // In argon, we use a custom version of the CSS3DRenderer called CSS3DArgonRenderer.
    // This version of the renderer supports stereo in a way that fits with Argon's renderEvent,
    // especially supporting the user providing multiple divs for the potential multiple viewports
    // in stereo mode.
    renderer = new THREE.CSS3DArgonRenderer();
    // The CSS3DArgonHUD has a similar interface to a renderer, and provides a simple abstraction
    // for multiple HTML HUD's that can be used in stereo mode.  We do not
    // use the HUD features here (instead, just removing the buttons below when in Stereo mode)
    hud = new THREE.CSS3DArgonHUD();

    // argon creates the domElement for the view, which we add our renderer dom to
    app.view.element.appendChild(renderer.domElement);
    app.view.element.appendChild(hud.domElement);

    // do not need to respond to windowResize events.  Argon handles this for us
    //    window.addEventListener( 'resize', onWindowResize, false );

    var augmentedObject = new THREE.Object3D();

    app.vuforia.isAvailable().then(function (available) {
        console.log("vuforia available?..." + available);
        if (!available) {
            var errorCallback = function(e) {
                console.log('Reeeejected!', e);
            };

            navigator.getUserMedia({video: true}, function(localMediaStream) {
                var video = document.querySelector('video');
                video.src = window.URL.createObjectURL(localMediaStream);
            }, errorCallback);

            root.add(augmentedObject);

        } else {
            // tell argon to initialize vuforia for our app, using our license information.
            app.vuforia.init({
                encryptedLicenseData: "-----BEGIN PGP MESSAGE----- Version: OpenPGP.js v2.3.2 Comment: http://openpgpjs.org  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 =4wf3 -----END PGP MESSAGE-----"
            }).then(function (api) {
                // the vuforia API is ready, so we can start using it.
                // tell argon to download a vuforia dataset.  The .xml and .dat file must be together
                // in the web directory, even though we just provide the .xml file url here
                api.objectTracker.createDataSet("resources/datasets/GUVBrochure.xml").then(function (dataSet) {
                    // the data set has been succesfully downloaded
                    // tell vuforia to load the dataset.
                    dataSet.load().then(function () {
                        // when it is loaded, we retrieve a list of trackables defined in the
                        // dataset and set up the content for the target
                        var trackables = dataSet.getTrackables();
                        // tell argon we want to track a specific trackable.  Each trackable
                        // has a Cesium entity associated with it, and is expressed in a
                        // coordinate frame relative to the camera.  Because they are Cesium
                        // entities, we can ask for their pose in any coordinate frame we know
                        // about.
                        var gvuBrochureEntity = app.context.subscribeToEntityById(trackables["GVUBrochure"].id);
                        // create a THREE object to put on the trackable
                        var gvuBrochureObject = new THREE.Object3D;
                        scene.add(gvuBrochureObject);
                        // the updateEvent is called each time the 3D world should be
                        // rendered, before the renderEvent.  The state of your application
                        // should be updated here.
                        app.context.updateEvent.addEventListener(function () {
                            // get the pose (in local coordinates) of the gvuBrochure target
                            var gvuBrochurePose = app.context.getEntityPose(gvuBrochureEntity);
                            // if the pose is known the target is visible, so set the
                            // THREE object to the location and orientation
                            if (gvuBrochurePose.poseStatus & Argon.PoseStatus.KNOWN) {
                                gvuBrochureObject.position.copy(gvuBrochurePose.position);
                                gvuBrochureObject.quaternion.copy(gvuBrochurePose.orientation);
                            }
                            // when the target is first seen after not being seen, the
                            // status is FOUND.  Here, we move the 3D text object from the
                            // world to the target.
                            // when the target is first lost after being seen, the status
                            // is LOST.  Here, we move the 3D text object back to the world
                            if (gvuBrochurePose.poseStatus & Argon.PoseStatus.FOUND) {
                                gvuBrochureObject.add(augmentedObject);
                                augmentedObject.position.z = 0;
                            }
                            else if (gvuBrochurePose.poseStatus & Argon.PoseStatus.LOST) {
                                augmentedObject.position.z = -0.50;
                                userLocation.add(augmentedObject);
                            }
                        });
                    }).catch(function (err) {
                        console.log("could not load dataset: " + err.message);
                    });
                    // activate the dataset.
                    api.objectTracker.activateDataSet(dataSet);
                });
            }).catch(function (err) {
                console.log("vuforia failed to initialize: " + err.message);
            });
        }
    });

}


// the updateEvent is called each time the 3D world should be
// rendered, before the renderEvent.  The state of your application
// should be updated here.  Here, we call TWEEN.update()
app.updateEvent.addEventListener(function () {
    // get the position and orientation (the "pose") of the user
    // in the local coordinate frame.
    var userPose = app.context.getEntityPose(app.context.user);

    // assuming we know the user's pose, set the position of our
    // THREE user object to match it
    if (userPose.poseStatus & Argon.PoseStatus.KNOWN) {
        userLocation.position.copy(userPose.position);
    }

    // update the moving DIVs, if need be
    TWEEN.update();
});

// for the CSS renderer, we want to use requestAnimationFrame to
// limit the number of repairs of the DOM.  Otherwise, as the
// DOM elements are updated, extra repairs of the DOM could be
// initiated.  Extra repairs do not appear to happen within the
// animation callback.
var viewport = null;
var subViews = null;
var rAFpending = false;

app.renderEvent.addEventListener(function () {
    // only schedule a new callback if the old one has completed
    if (!rAFpending) {
        rAFpending = true;
        viewport = app.view.getViewport();
        subViews = app.view.getSubviews();
        window.requestAnimationFrame(renderFunc);
    }
});

// the animation callback.
function renderFunc() {
    rAFpending = false;
    // set the renderer to know the current size of the viewport.
    // This is the full size of the viewport, which would include
    // both views if we are in stereo viewing mode
    renderer.setSize(viewport.width, viewport.height);
    hud.setSize(viewport.width, viewport.height);

    // There is 1 subview in monocular mode, 2 in stereo mode.
    // If we are in mono view, show the buttons.  If not, hide them,
    // since we can't interact with them in an HMD
    if (subViews.length > 1 || !app.focus.hasFocus) {
        hud.domElement.style.display = 'none';
    } else {
        hud.domElement.style.display = 'block';
    }

    // we pass the view number to the renderer so it knows
    // which div's to use for each view
    for (var _i = 0, _a = subViews; _i < _a.length; _i++) {
        var subview = _a[_i];
        var frustum = subview.frustum;

        // set the position and orientation of the camera for
        // this subview
        camera.position.copy(subview.pose.position);
        camera.quaternion.copy(subview.pose.orientation);
        // the underlying system provide a full projection matrix
        // for the camera.  Use it, and then update the FOV of the
        // camera from it (needed by the CSS Perspective DIV)
        camera.projectionMatrix.fromArray(subview.projectionMatrix);
        camera.fov = THREE.Math.radToDeg(frustum.fovy);

        // set the viewport for this view
        var _b = subview.viewport, x = _b.x, y = _b.y, width = _b.width, height = _b.height;
        renderer.setViewport(x, y, width, height, _i);
        hud.setViewport(x, y, width, height, _i);

        // render this view.
        renderer.render(scene, camera, _i);
        hud.render(_i);
    }
}
