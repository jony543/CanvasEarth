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

    var element = document.createElement( 'div' );
    var image = document.createElement( 'img' );
    image.src = 'resources/images/yinyang.png';

    element.appendChild(image);
    var css3dobject = new THREE.CSS3DObject( element );
    augmentedObject.add(css3dobject);

    app.vuforia.isAvailable().then(function (available) {
        console.log("vuforia available?..." + available);
        if (!available) {
            var errorCallback = function(e) {
                console.re.log('video error', e.message);
            };

            navigator.getUserMedia({video: true}, function(localMediaStream) {
                var video = document.querySelector('video');
                video.src = window.URL.createObjectURL(localMediaStream);
            }, errorCallback);

            augmentedObject.position.x = 100;
            augmentedObject.position.y = 100;
            augmentedObject.position.z = -1000;

            root.add(augmentedObject);

        } else {
            augmentedObject.position.z = -0.5;

            // tell argon to initialize vuforia for our app, using our license information.
            app.vuforia.init({
                encryptedLicenseData: "-----BEGIN PGP MESSAGE-----\nVersion: OpenPGP.js v2.3.2\nComment: http://openpgpjs.org\n\n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\nNw==\n=KU/j\n-----END PGP MESSAGE-----"
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
