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
                encryptedLicenseData: "-----BEGIN PGP MESSAGE-----\nVersion: OpenPGP.js v2.3.2\nComment: http://openpgpjs.org\n\nwcFMA+gV6pi+O8zeAQ//Q2oqZdi551foNw46ucyGhCI+VFbVwelu9IealLfl\n59wz5j/tK52WesLPdSnqasGZwFoDVryG/GCN2ujXC3TYjTmTwguphUUiCrZb\neV+UQlgDxaObZqnjmPznIE4OFQX3OpWnkFIBzU3bH46qUZgKSeICbI+A9MZU\nL8cWdtzuVeAi1WojBn4lehSFviBPCFAs4s4XnmQ1fLA/Zg5DRMwRLOzpaNBD\nIdG0BiIe4sMJiD7Slqyfux7F9535mP8s+UrSN9pM1+0LcylKDHaD1wXQSFVg\ngOjO1LrPT/1gYkfYugO3Dpoa7qC2ubqdXLOrxrpNUarQjrOMNYhJXz0xtnkM\nFXY/aQoJnwx+LSkRwr08TRh4hSwJHh372S6EeUtudiJb846yPDOkZ6O/8/PO\nn/g9g99SO13X9mvNnwDdRHrd7vjHnNr4I/8hB296SrdelS5wzKgVO4d2XxRz\nfGtbKw4fkxyo30Ww9My+Az2OKBXrFsZEc3zTVhqPqKH8CiZb2NQ0Q75dUDgG\n/fD5hMGDsLM9gKX4OD29P/A06sNsVvZ2U5uaZdAdfDtpV/IaLPsswtE/ujhe\nPh6KgwqZB2Mu5HCXpJNmNhkel6Tnu53OKnMc8jbD2oqtZ8+8qwT/65AFUX9Z\nDASLMUePQJJbiciL1t22sBVS7Bp25349F69oTYxf18jBwU4DAGn1enGTza0Q\nB/9VW/xA3e8xNIeudcHHMzqXIs0u05RNP5rhYNappckzPfV4ZLXvPdlTPEjz\na9hkCAblprmvZnVqGBczr2imKUeCaL0PNlHCtHNdw2/UK/NCvHXgYtf/IlR4\nHIEd354pjijwn3Lk7rTWPQ90GYAv4ecaLOyGA8bcbt0P6YLzULAWzwirSv14\n9KwL6x2b2kOjF04RUzCsTU/jjVUzIUtOdvZwsyG9tqKQ+ZKutytMpiH4JjH0\n5Oll2mI3B4I13C4XV1IJe1Aktw/bqqclQOcRPD/dkgOW6aYKJ3aCsrbxcwNw\n377Y3gouJmf/Q9NktxIol2hetHAnVVdCCeJiJK2lX+NJB/437GWdnJVquuk6\nahqE71/3MCENseu0g7emsxHn4h6OWpEyP1I/tDtI7/iVCFytotWWB/8JUDkK\nzStrHctFFCKOMT1kYMvny9TxsCEKhdDMTeX7ceLBJGq5KyJK9M0ZWzx11xaC\nlgUHmioEJFV9jVf5Q0O3nnm8BN+XGfH6NwPMQPRTQ1NcQAjixSxADthxQ35L\n6bVtNwBw0qK/1bf/CuYU4yOwR7g13ttyTVMFWFaOHpw1D0gKqEjlwbrKEfKH\n+lnYN/nN5UQSQtD95tv9i0X8PuBvc/pC0TlEHiD/mZvv+VmPMqlbO/UNrRe1\n3z90R8lhlxqkN2iq0gXRDKJ3gK55wcFMA47tt+RhMWHyAQ/7BGVUa/k6bs4j\n1dgf/aot1Mmg1YjytXUPMrC1d+hhCvpADGYgsJ3npICOL+4cTZ9Lxw5tpzHY\nMZoOTdQEB6WJgTUVoyA/FX89fiByZfIozXM3uvLtKwQq0RGQfyfVI/MP5OlQ\n2sOEDF9lZKGe/v+eS5/G/dfqI00XINjbIOUKSYy/cben6jBG34AbvfRAcU/Z\nujHB5rP8PehBUAjyWWl4yhd8cVal+q8TXCGRNov38kqic2Y5isjSC5m7ngCm\nh91GgGmnWMGDFfPNR0EN5ly0X0ehcEyH8aOzKtyDbU4jw8A9slNNRzMjHCUd\nPSMALb6TCpP3+QspuwPjgktAgtPdQIsxvHeMCvjM7B+8Z8WlgRJ1IUNIypvz\nWbwM/ha+1PHCaqdEonly41HTvX1ylCfQ8gT2m3rjdTWodSzxsSVIDkwAlMO+\ni6tGICBLBubOIA2WmT0/Ct9zOqUtVMw4OYXfsHconR0gI4fDfYFuLzp4/ThZ\nUjFNOJiRxlen2IPFu4VVE8vNsvAJEhJhox1JcXZOijKvUPCozxW8fKVG97c/\nM7r8CgOgO+ne7dym0Coe5lP06bp+by8SuKug3I9/auZPy+OaPCKjoeTQONNk\n3pJgR4RgFbVB8lBVF715xuLJsvXYZTYxO4rRTIno1LQzpmQGug0JqoZQaBXU\nHpk/xuiee/PSwVQBa+fbHqF1hUycDfidAFp3qNMVvpMsUgD+5iZD8Ql5onO6\ntNpr8dd17NTgvabx5QAAAfP1cyKZEjoOpFzn0loyIfwNYLFGEb+aeQ/ZfdUp\nXSuaDBjt1LemirRZp6H5eVeiIUedaDttJXB8Gs9PGMU6qFnQVJyA3rU+KP6D\nfJRE6AmaYs8T4JzA9fzIQe55nK9LLn+hUuyBGJf70HgIDnHHl8VIUadN3UYB\nWhVr5uZftdQ+VsRaL5h7fRWwp6Fms+OmqGy5Ic94+xe0uc8Gr37M9GOPBp0t\nk7jWLO5GJ+D4ez2Qh7u6LNHUwLJjiDtVmqxfraGWv72XW2JHutwl4kQjsuVm\n6+9YpNQitv8nk0dwJ4vQehnWgXxFx9Wi+VHBmfaDIXn1OzYhY7XIvOpH9lot\nGOzcxZlQg5y2fluGNQQrLZvbMywVon5pdOA+KNvlmhHZNtXVTwoBmfF8GmFw\noooWSCavMhXH0nN83/C1jH5scSqkfkmbIbhzW44APgGLmZC4bxwbqI8oZwuI\n3Vf3phzfVMxuGfduTAydIzY7S1pa8LwQsY57HURVpQtSbyOuDPOmbDjexprM\ndfnWTZ4mYw1cFwGmlIyY8hgI+jU0aRzmQhDqQF5zawJ1WkSNuiEsZiFccI1F\naQ15IZJY6Nrf7VoteRFbhPmq0LrfS1ylB6rCJRUeINkYNShp/G6eTx1n17FF\nkY2a\n=r82W\n-----END PGP MESSAGE-----"
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
