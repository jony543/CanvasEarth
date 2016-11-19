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

    root = new THREE.Object3D();
    userLocation = new THREE.Object3D;

    // Add the root node to our eyeOrigin
    userLocation.add(root);

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

    var x0 = 0;
    var y0 = 0;
    var z0 = 1000;


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

            augmentedObject.position.x = x0;
            augmentedObject.position.y = y0;
            augmentedObject.position.z = z0;

            console.re.log('x: ' + x0 + ' y: ' + y0 + ' z: ' + z0);

            root.add(augmentedObject);

        } else {
            // augmentedObject.position.x = 0;
            // augmentedObject.position.y = 0;
            augmentedObject.position.z = -0.50;

            // tell argon to initialize vuforia for our app, using our license information.
            app.vuforia.init({
                encryptedLicenseData: "-----BEGIN PGP MESSAGE-----\nVersion: OpenPGP.js v2.3.2\nComment: http://openpgpjs.org\n\n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\n23hXvrccVkyHL8Tn+snyHQ==\n=VgAz\n-----END PGP MESSAGE-----"
            }).then(function (api) {
                // the vuforia API is ready, so we can start using it.
                // tell argon to download a vuforia dataset.  The .xml and .dat file must be together
                // in the web directory, even though we just provide the .xml file url here
                api.objectTracker.createDataSet("resources/datasets/CanvasEarthTargets.xml").then(function (dataSet) {
                    // the data set has been succesfully downloaded
                    // tell vuforia to load the dataset.
                    console.re.log('dataset created');
                    dataSet.load().then(function () {
                        console.re.log('dataset loaded');
                        // when it is loaded, we retrieve a list of trackables defined in the
                        // dataset and set up the content for the target
                        var trackables = dataSet.getTrackables();
                        // tell argon we want to track a specific trackable.  Each trackable
                        // has a Cesium entity associated with it, and is expressed in a
                        // coordinate frame relative to the camera.  Because they are Cesium
                        // entities, we can ask for their pose in any coordinate frame we know
                        // about.
                        var trackable_entity = app.context.subscribeToEntityById(trackables["bedroom"].id);
                        // create a THREE object to put on the trackable
                        var displayedObject = new THREE.Object3D;
                        scene.add(displayedObject);
                        // the updateEvent is called each time the 3D world should be
                        // rendered, before the renderEvent.  The state of your application
                        // should be updated here.
                        app.context.updateEvent.addEventListener(function () {
                            // get the pose (in local coordinates) of the gvuBrochure target
                            var trackable_entity_pose = app.context.getEntityPose(trackable_entity);

                            // if the pose is known the target is visible, so set the
                            // THREE object to the location and orientation
                            if (trackable_entity_pose.poseStatus & Argon.PoseStatus.KNOWN) {
                                //console.re.log('known');
                                displayedObject.position.copy(trackable_entity_pose.position);
                                displayedObject.quaternion.copy(trackable_entity_pose.orientation);

                                console.re.log('pos: ' + trackable_entity_pose.position);
                                console.re.log('orientation: ' + trackable_entity_pose.orientation);
                            }
                            // when the target is first seen after not being seen, the
                            // status is FOUND.  Here, we move the 3D text object from the
                            // world to the target.
                            // when the target is first lost after being seen, the status
                            // is LOST.  Here, we move the 3D text object back to the world
                            if (trackable_entity_pose.poseStatus & Argon.PoseStatus.FOUND) {
                                console.re.log('found');

                                displayedObject.add(augmentedObject);
                                augmentedObject.position.z = -500;
                                // augmentedObject.position.x = x0;
                                // augmentedObject.position.y = y0;
                                // augmentedObject.position.z = z0;

                                // console.re.log('x: ' + x0 + ' y: ' + y0 + ' z: ' + z0);
                            }
                            else if (trackable_entity_pose.poseStatus & Argon.PoseStatus.LOST) {
                                console.re.log('lost');
                                augmentedObject.position.z = 0;
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
    // if we have 1 subView, we're in mono mode.  If more, stereo.
    var monoMode = (app.view.getSubviews()).length == 1;
    // set the renderer to know the current size of the viewport.
    // This is the full size of the viewport, which would include
    // both views if we are in stereo viewing mode
    renderer.setSize(viewport.width, viewport.height);
    hud.setSize(viewport.width, viewport.height);
    // there is 1 subview in monocular mode, 2 in stereo mode
    for (var _i = 0, _a = subViews; _i < _a.length; _i++) {
        var subview = _a[_i];
        // set the position and orientation of the camera for
        // this subview
        camera.position.copy(subview.pose.position);
        camera.quaternion.copy(subview.pose.orientation);
        // the underlying system provide a full projection matrix
        // for the camera.
        camera.projectionMatrix.fromArray(subview.projectionMatrix);
        // set the viewport for this view
        var _b = subview.viewport, x = _b.x, y = _b.y, width = _b.width, height = _b.height;
        renderer.setViewport(x, y, width, height, _i);
        // set the webGL rendering parameters and render this view
        // renderer.setScissor(x, y, width, height);
        // renderer.setScissorTest(true);
        renderer.render(scene, camera, _i);
        // adjust the hud, but only in mono
        if (monoMode) {
            hud.setViewport(x, y, width, height, subview.index);
            hud.render(subview.index);
        }
    }


    //
    // // set the renderer to know the current size of the viewport.
    // // This is the full size of the viewport, which would include
    // // both views if we are in stereo viewing mode
    // renderer.setSize(viewport.width, viewport.height);
    // hud.setSize(viewport.width, viewport.height);
    //
    // // There is 1 subview in monocular mode, 2 in stereo mode.
    // // If we are in mono view, show the buttons.  If not, hide them,
    // // since we can't interact with them in an HMD
    // if (subViews.length > 1 || !app.focus.hasFocus) {
    //     hud.domElement.style.display = 'none';
    // } else {
    //     hud.domElement.style.display = 'block';
    // }
    //
    // // we pass the view number to the renderer so it knows
    // // which div's to use for each view
    // for (var _i = 0, _a = subViews; _i < _a.length; _i++) {
    //     var subview = _a[_i];
    //     var frustum = subview.frustum;
    //
    //     // set the position and orientation of the camera for
    //     // this subview
    //     camera.position.copy(subview.pose.position);
    //     camera.quaternion.copy(subview.pose.orientation);
    //     // the underlying system provide a full projection matrix
    //     // for the camera.  Use it, and then update the FOV of the
    //     // camera from it (needed by the CSS Perspective DIV)
    //     camera.projectionMatrix.fromArray(subview.projectionMatrix);
    //     camera.fov = THREE.Math.radToDeg(frustum.fovy);
    //
    //     // set the viewport for this view
    //     var _b = subview.viewport, x = _b.x, y = _b.y, width = _b.width, height = _b.height;
    //     renderer.setViewport(x, y, width, height, _i);
    //     hud.setViewport(x, y, width, height, _i);
    //
    //     // render this view.
    //     renderer.render(scene, camera, _i);
    //     hud.render(_i);
    // }
}
