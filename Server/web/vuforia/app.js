/// <reference types="@argonjs/argon" />
/// <reference types="three" />
/// <reference types="dat-gui" />
/// <reference types="stats" />
// set up Argon


console.re.log('remote log test');


var app = Argon.init();
console.re.log("init fuck off");
// set up THREE.  Create a scene, a perspective camera and an object
// for the user's location
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera();
var userLocation = new THREE.Object3D();
scene.add(camera);
scene.add(userLocation);
// We use the standard WebGLRenderer when we only need WebGL-based content
var renderer = new THREE.WebGLRenderer({
    alpha: true,
    logarithmicDepthBuffer: true
});
// account for the pixel density of the device
renderer.setPixelRatio(window.devicePixelRatio);
app.view.element.appendChild(renderer.domElement);
// to easily control stuff on the display
var hud = new THREE.CSS3DArgonHUD();
// We put some elements in the index.html, for convenience. 
// Here, we retrieve the description box and move it to the 
// the CSS3DArgonHUD hudElements[0].  We only put it in the left
// hud since we'll be hiding it in stereo
var description = document.getElementById('description');
hud.hudElements[0].appendChild(description);
app.view.element.appendChild(hud.domElement);
// let's show the rendering stats
var stats = new Stats();
hud.hudElements[0].appendChild(stats.dom);
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
// create a bit of animated 3D text that says "argon.js" to display 
var uniforms = {
    amplitude: { type: "f", value: 0.0 }
};
var argonTextObject = new THREE.Object3D();
argonTextObject.position.z = -0.5;
userLocation.add(argonTextObject);
var loader = new THREE.FontLoader();
loader.load('../resources/fonts/helvetiker_bold.typeface.js', function (font) {
    var textGeometry = new THREE.TextGeometry("argon.js", {
        font: font,
        size: 40,
        height: 5,
        curveSegments: 3,
        bevelThickness: 2,
        bevelSize: 1,
        bevelEnabled: true
    });
    textGeometry.center();
    var tessellateModifier = new THREE.TessellateModifier(8);
    for (var i = 0; i < 6; i++) {
        tessellateModifier.modify(textGeometry);
    }
    var explodeModifier = new THREE.ExplodeModifier();
    explodeModifier.modify(textGeometry);
    var numFaces = textGeometry.faces.length;
    var bufferGeometry = new THREE.BufferGeometry().fromGeometry(textGeometry);
    var colors = new Float32Array(numFaces * 3 * 3);
    var displacement = new Float32Array(numFaces * 3 * 3);
    var color = new THREE.Color();
    for (var f = 0; f < numFaces; f++) {
        var index = 9 * f;
        var h = 0.07 + 0.1 * Math.random();
        var s = 0.5 + 0.5 * Math.random();
        var l = 0.6 + 0.4 * Math.random();
        color.setHSL(h, s, l);
        var d = 5 + 20 * (0.5 - Math.random());
        for (var i = 0; i < 3; i++) {
            colors[index + (3 * i)] = color.r;
            colors[index + (3 * i) + 1] = color.g;
            colors[index + (3 * i) + 2] = color.b;
            displacement[index + (3 * i)] = d;
            displacement[index + (3 * i) + 1] = d;
            displacement[index + (3 * i) + 2] = d;
        }
    }
    bufferGeometry.addAttribute('customColor', new THREE.BufferAttribute(colors, 3));
    bufferGeometry.addAttribute('displacement', new THREE.BufferAttribute(displacement, 3));
    var shaderMaterial = new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: "\n            uniform float amplitude;\n            attribute vec3 customColor;\n            attribute vec3 displacement;\n            varying vec3 vNormal;\n            varying vec3 vColor;\n            void main() {\n                vNormal = normal;\n                vColor = customColor;\n                vec3 newPosition = position + normal * amplitude * displacement;\n                gl_Position = projectionMatrix * modelViewMatrix * vec4( newPosition, 1.0 );\n            }\n        ",
        fragmentShader: "\n            varying vec3 vNormal;\n            varying vec3 vColor;\n            void main() {\n                const float ambient = 0.4;\n                vec3 light = vec3( 1.0 );\n                light = normalize( light );\n                float directional = max( dot( vNormal, light ), 0.0 );\n                gl_FragColor = vec4( ( directional + ambient ) * vColor, 1.0 );\n            }\n        "
    });
    var textMesh = new THREE.Mesh(bufferGeometry, shaderMaterial);
    argonTextObject.add(textMesh);
    argonTextObject.scale.set(0.001, 0.001, 0.001);
    argonTextObject.position.z = -0.50;
    // add an argon updateEvent listener to slowly change the text over time.
    // we don't have to pack all our logic into one listener.
    app.context.updateEvent.addEventListener(function () {
        uniforms.amplitude.value = 1.0 + Math.sin(Date.now() * 0.001 * 0.5);
    });
});
app.vuforia.isAvailable().then(function (available) {
    // vuforia not available on this platform
    console.re.log("vuforia initialization...." + available);
    if (!available) {
        console.warn("vuforia not available on this platform.");
        return;
    }
    // tell argon to initialize vuforia for our app, using our license information.
    app.vuforia.init({
        encryptedLicenseData: "-----BEGIN PGP MESSAGE-----\nVersion: OpenPGP.js v2.3.2\nComment: http://openpgpjs.org\n\n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\nrwf+y/7Fmffo2u8MNIp9YGXM\n=IH7H\n-----END PGP MESSAGE-----"
    }).then(function (api) {
        console.re.log('vuforia init finished');
        // the vuforia API is ready, so we can start using it.
        // tell argon to download a vuforia dataset.  The .xml and .dat file must be together
        // in the web directory, even though we just provide the .xml file url here 
        api.objectTracker.createDataSet("../resources/datasets/GVUBrochure.xml").then(function (dataSet) {
            // the data set has been succesfully downloaded
            // tell vuforia to load the dataset.
            console.re.log('dataset created');
            dataSet.load().then(function () {
                console.re.log("dataset loaded");
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
                        gvuBrochureObject.add(argonTextObject);
                        argonTextObject.position.z = 0;
                    }
                    else if (gvuBrochurePose.poseStatus & Argon.PoseStatus.LOST) {
                        argonTextObject.position.z = -0.50;
                        userLocation.add(argonTextObject);
                    }
                });
            }).catch(function (err) {
                console.log("could not load dataset: " + err.message);
            });
            // activate the dataset.
            api.objectTracker.activateDataSet(dataSet);
        });
    }).catch(function (err) {
        console.re.log("vuforia failed to initialize: " + err.message);
    });
});
// the updateEvent is called each time the 3D world should be
// rendered, before the renderEvent.  The state of your application
// should be updated here.
app.context.updateEvent.addEventListener(function () {
    // get the position and orientation (the "pose") of the user
    // in the local coordinate frame.
    var userPose = app.context.getEntityPose(app.context.user);
    // assuming we know the user's pose, set the position of our 
    // THREE user object to match it
    if (userPose.poseStatus & Argon.PoseStatus.KNOWN) {
        userLocation.position.copy(userPose.position);
    }
});
// renderEvent is fired whenever argon wants the app to update its display
app.renderEvent.addEventListener(function () {
    // update the rendering stats
    stats.update();
    // if we have 1 subView, we're in mono mode.  If more, stereo.
    var monoMode = (app.view.getSubviews()).length == 1;
    // set the renderer to know the current size of the viewport.
    // This is the full size of the viewport, which would include
    // both views if we are in stereo viewing mode
    var viewport = app.view.getViewport();
    renderer.setSize(viewport.width, viewport.height);
    hud.setSize(viewport.width, viewport.height);
    // there is 1 subview in monocular mode, 2 in stereo mode    
    for (var _i = 0, _a = app.view.getSubviews(); _i < _a.length; _i++) {
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
        renderer.setViewport(x, y, width, height);
        // set the webGL rendering parameters and render this view
        renderer.setScissor(x, y, width, height);
        renderer.setScissorTest(true);
        renderer.render(scene, camera);
        // adjust the hud, but only in mono
        if (monoMode) {
            hud.setViewport(x, y, width, height, subview.index);
            hud.render(subview.index);
        }
    }
});
