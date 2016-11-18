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
                encryptedLicenseData: "-----BEGIN PGP MESSAGE-----\nVersion: OpenPGP.js v2.3.2\nComment: http://openpgpjs.org\n\n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\n=xOi3\n-----END PGP MESSAGE-----"
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
